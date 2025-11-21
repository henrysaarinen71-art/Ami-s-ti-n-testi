#!/usr/bin/env node

/**
 * AMI Hanke Aggregator MCP Server
 *
 * Tämä MCP-server tarjoaa työkalut Claude AI:lle hanketiedon hakemiseen
 * Supabase-tietokannasta.
 *
 * Työkalut:
 * - get_ami_hankkeet: Hae AMI-säätiön myöntämät hankkeet
 * - get_muut_hankkeet: Hae muiden rahoittajien hankkeet
 * - search_hankkeet: Hae hankkeita hakusanalla
 * - get_hanke_stats: Hae tilastot rahoittajittain
 *
 * Käyttö:
 *   node mcp-server/hanke-server.ts
 *
 * Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "ami-hanke-aggregator": {
 *         "command": "node",
 *         "args": ["/polku/mcp-server/hanke-server.ts"]
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Lataa ympäristömuuttujat
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VIRHE: Puuttuvat ympäristömuuttujat')
  console.error('Varmista että .env.local sisältää:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Luo Supabase-client (käyttää service_role_key:tä)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Luo MCP server
const server = new Server(
  {
    name: 'ami-hanke-aggregator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Handler: Listaa käytettävissä olevat työkalut
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_ami_hankkeet',
        description:
          'Hae AMI-säätiön myöntämät hankkeet tietokannasta. Palauttaa listan hankkeista joissa on AMI-säätiön myöntämä rahoitus. Käytä tätä AINA kun haluat vertailla hakemusta AMI-säätiön aiempiin hankkeisiin.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maksimimäärä palautettavia hankkeita (oletus: 100)',
            },
            vuosi: {
              type: 'number',
              description: 'Rajaa hakua tiettyyn vuoteen (valinnainen)',
            },
          },
        },
      },
      {
        name: 'get_muut_hankkeet',
        description:
          'Hae muiden rahoittajien (TSR, Diak, Laurea, EURA2021) hankkeet. Palauttaa hankkeet jotka EIVÄT ole AMI-säätiön rahoittamia. Voit rajata tiettyyn rahoittajaan.',
        inputSchema: {
          type: 'object',
          properties: {
            rahoittaja: {
              type: 'string',
              description:
                'Rahoittajan nimi (TSR, Diak, Laurea, EURA2021, Muu) - valinnainen',
            },
            limit: {
              type: 'number',
              description: 'Maksimimäärä palautettavia hankkeita (oletus: 100)',
            },
          },
        },
      },
      {
        name: 'search_hankkeet',
        description:
          'Hae hankkeita hakusanalla. Etsii hakusanaa hankkeen otsikosta, kuvauksesta ja toteuttajasta. Käytä tätä kun haluat löytää vastaavia hankkeita tietystä aiheesta.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Hakusana (esim. "nuorten työllistyminen", "maahanmuuttajat", "osaaminen")',
            },
            rahoittaja: {
              type: 'string',
              description:
                'Rajaa hakua tiettyyn rahoittajaan (AMI, TSR, Diak, Laurea, EURA2021, Muu) - valinnainen',
            },
            limit: {
              type: 'number',
              description: 'Maksimimäärä palautettavia hankkeita (oletus: 20)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_hanke_stats',
        description:
          'Hae hanketilastot rahoittajittain. Palauttaa yhteenvedon hankkeiden määrästä, kokonaisrahoituksesta ja keskimääräisestä rahoituksesta rahoittajittain.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }
})

// Handler: Kutsu työkalua
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    // TOOL 1: get_ami_hankkeet
    if (name === 'get_ami_hankkeet') {
      const limit = (args?.limit as number) || 100
      const vuosi = args?.vuosi as number | undefined

      let query = supabase
        .from('hankkeet')
        .select('*')
        .eq('on_ami_hanke', true)
        .order('vuosi', { ascending: false })
        .limit(limit)

      if (vuosi) {
        query = query.eq('vuosi', vuosi)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Tietokantavirhe: ${error.message}`)
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                count: data?.length || 0,
                hankkeet: data || [],
              },
              null,
              2
            ),
          },
        ],
      }
    }

    // TOOL 2: get_muut_hankkeet
    if (name === 'get_muut_hankkeet') {
      const rahoittaja = args?.rahoittaja as string | undefined
      const limit = (args?.limit as number) || 100

      let query = supabase
        .from('hankkeet')
        .select('*')
        .eq('on_ami_hanke', false)
        .order('vuosi', { ascending: false })
        .limit(limit)

      if (rahoittaja) {
        query = query.eq('rahoittaja', rahoittaja)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Tietokantavirhe: ${error.message}`)
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                count: data?.length || 0,
                rahoittaja: rahoittaja || 'kaikki',
                hankkeet: data || [],
              },
              null,
              2
            ),
          },
        ],
      }
    }

    // TOOL 3: search_hankkeet
    if (name === 'search_hankkeet') {
      const query = args?.query as string
      const rahoittaja = args?.rahoittaja as string | undefined
      const limit = (args?.limit as number) || 20

      if (!query) {
        throw new Error('Hakusana (query) on pakollinen')
      }

      // PostgreSQL full-text search (suomenkielinen)
      let dbQuery = supabase
        .from('hankkeet')
        .select('*')
        .textSearch('otsikko', query, {
          type: 'websearch',
          config: 'finnish',
        })
        .limit(limit)

      if (rahoittaja) {
        dbQuery = dbQuery.eq('rahoittaja', rahoittaja)
      }

      const { data, error } = await dbQuery

      if (error) {
        // Jos full-text search ei toimi, yritä ILIKE
        console.warn('[MCP] Full-text search failed, trying ILIKE:', error.message)

        let fallbackQuery = supabase
          .from('hankkeet')
          .select('*')
          .or(
            `otsikko.ilike.%${query}%,kuvaus.ilike.%${query}%,toteuttaja.ilike.%${query}%`
          )
          .limit(limit)

        if (rahoittaja) {
          fallbackQuery = fallbackQuery.eq('rahoittaja', rahoittaja)
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery

        if (fallbackError) {
          throw new Error(`Hakuvirhe: ${fallbackError.message}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  query,
                  count: fallbackData?.length || 0,
                  hankkeet: fallbackData || [],
                },
                null,
                2
              ),
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                query,
                count: data?.length || 0,
                hankkeet: data || [],
              },
              null,
              2
            ),
          },
        ],
      }
    }

    // TOOL 4: get_hanke_stats
    if (name === 'get_hanke_stats') {
      // Käytä Supabase RPC:tä stored procedureen
      const { data, error } = await supabase.rpc('get_hanke_stats')

      if (error) {
        // Jos stored procedure ei ole vielä olemassa, tee manuaalinen aggregaatio
        console.warn('[MCP] Stored procedure not found, using manual aggregation')

        const { data: hankkeet, error: hankkeetError } = await supabase
          .from('hankkeet')
          .select('rahoittaja, rahoitus_summa, crawled_at')

        if (hankkeetError) {
          throw new Error(`Tietokantavirhe: ${hankkeetError.message}`)
        }

        // Manuaalinen aggregaatio
        const statsByRahoittaja = hankkeet.reduce((acc: any, hanke: any) => {
          const r = hanke.rahoittaja
          if (!acc[r]) {
            acc[r] = {
              rahoittaja: r,
              hankkeet_yhteensa: 0,
              rahoitus_yhteensa: 0,
              keskiarvo_rahoitus: 0,
              uusin_hanke: null,
              vanhin_hanke: null,
            }
          }

          acc[r].hankkeet_yhteensa++
          if (hanke.rahoitus_summa) {
            acc[r].rahoitus_yhteensa += hanke.rahoitus_summa
          }

          if (!acc[r].uusin_hanke || hanke.crawled_at > acc[r].uusin_hanke) {
            acc[r].uusin_hanke = hanke.crawled_at
          }
          if (!acc[r].vanhin_hanke || hanke.crawled_at < acc[r].vanhin_hanke) {
            acc[r].vanhin_hanke = hanke.crawled_at
          }

          return acc
        }, {})

        // Laske keskiarvot
        Object.values(statsByRahoittaja).forEach((stats: any) => {
          if (stats.hankkeet_yhteensa > 0) {
            stats.keskiarvo_rahoitus =
              stats.rahoitus_yhteensa / stats.hankkeet_yhteensa
          }
        })

        const statsArray = Object.values(statsByRahoittaja)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  stats: statsArray,
                },
                null,
                2
              ),
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                stats: data || [],
              },
              null,
              2
            ),
          },
        ],
      }
    }

    // Tuntematon työkalu
    throw new Error(`Tuntematon työkalu: ${name}`)
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    }
  }
})

// Käynnistä server
async function main() {
  console.error('[MCP Server] Starting AMI Hanke Aggregator...')
  console.error('[MCP Server] Version: 1.0.0')
  console.error('[MCP Server] Available tools:')
  console.error('  - get_ami_hankkeet')
  console.error('  - get_muut_hankkeet')
  console.error('  - search_hankkeet')
  console.error('  - get_hanke_stats')
  console.error('[MCP Server] Server ready on stdio')

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error)
  process.exit(1)
})
