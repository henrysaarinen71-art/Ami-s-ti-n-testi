#!/usr/bin/env python3
"""
Työmarkkinadatan XML -> JSON parseri

Lukee kolme XML-tiedostoa data/raw/ hakemistosta,
parsii ne ja yhdistää yhteen JSON-tiedostoon.
"""

import xml.etree.ElementTree as ET
import json
import os
from pathlib import Path
from datetime import datetime

# Microsoft Excel XML namespace
NS = {'ss': 'urn:schemas-microsoft-com:office:spreadsheet'}

def get_cell_value(cell):
    """Hakee solun arvon Cell-elementistä"""
    data = cell.find('ss:Data', NS)
    if data is not None and data.text:
        # Yritä konvertoida numeroksi jos mahdollista
        try:
            if '.' in data.text:
                return float(data.text)
            else:
                return int(data.text)
        except ValueError:
            return data.text
    return None

def parse_12r5_file(tree):
    """
    Parsii 12r5-tiedoston (Työttömät työnhakijat eri ryhmissä)
    Sisältää kolme kaupunkia: Espoo, Helsinki, Vantaa
    """
    root = tree.getroot()
    worksheet = root.find('.//ss:Worksheet', NS)
    table = worksheet.find('ss:Table', NS)
    rows = table.findall('ss:Row', NS)

    # Rivi 4 sisältää kaupunkien nimet
    # Rivi 5 sisältää kuukaudet
    # Rivi 6+ sisältää datan

    cities_row = rows[3]  # Index 3 = rivi 4
    months_row = rows[4]  # Index 4 = rivi 5

    # Hae kuukaudet
    months_cells = months_row.findall('ss:Cell', NS)
    months = []
    for cell in months_cells[1:]:  # Ohita ensimmäinen tyhjä
        value = get_cell_value(cell)
        if value:
            months.append(value)

    # Rakenna data
    data = {
        'type': '12r5_tyonhakijat',
        'description': 'Työnhakijat laskentapäivänä',
        'cities': {}
    }

    # Käsittele datarivit
    for row in rows[5:]:
        cells = row.findall('ss:Cell', NS)
        if not cells:
            continue

        # Ensimmäinen solu sisältää rivin otsikon
        label = get_cell_value(cells[0])
        if not label:
            continue

        # Hae arvot kullekin kaupungille
        values = []
        for cell in cells[1:]:
            value = get_cell_value(cell)
            values.append(value)

        # Jakele arvot kaupungeittain (10 kuukautta per kaupunki)
        cities = ['Espoo', 'Helsinki', 'Vantaa']
        months_per_city = 10

        for i, city in enumerate(cities):
            if city not in data['cities']:
                data['cities'][city] = {}

            start_idx = i * months_per_city
            end_idx = start_idx + months_per_city
            city_values = values[start_idx:end_idx]

            # Luo kuukausikohtainen data
            if label not in data['cities'][city]:
                data['cities'][city][label] = {}

            for j, month in enumerate(months[start_idx:end_idx]):
                if j < len(city_values):
                    data['cities'][city][label][month] = city_values[j]

    return data

def parse_12te_file(tree):
    """
    Parsii 12te-tiedoston (Työttömät työnhakijat koulutusasteittain)
    Sisältää sukupuolijakauman
    """
    root = tree.getroot()
    worksheet = root.find('.//ss:Worksheet', NS)
    table = worksheet.find('ss:Table', NS)
    rows = table.findall('ss:Row', NS)

    data = {
        'type': '12te_koulutusaste',
        'description': 'Työttömät työnhakijat koulutusasteittain',
        'koulutusasteet': []
    }

    # Käy läpi rivit ja hae koulutusastekohtaiset tiedot
    for row in rows[5:]:  # Ohita headerit
        cells = row.findall('ss:Cell', NS)
        if not cells or len(cells) < 2:
            continue

        label = get_cell_value(cells[0])
        if not label or not isinstance(label, str):
            continue

        # Kerää arvot
        values = []
        for cell in cells[1:]:
            value = get_cell_value(cell)
            values.append(value)

        data['koulutusasteet'].append({
            'koulutusaste': label,
            'values': values
        })

    return data

def parse_12ti_file(tree):
    """
    Parsii 12ti-tiedoston (Työttömät työnhakijat ammattiryhmittäin)
    """
    root = tree.getroot()
    worksheet = root.find('.//ss:Worksheet', NS)
    table = worksheet.find('ss:Table', NS)
    rows = table.findall('ss:Row', NS)

    data = {
        'type': '12ti_ammattiryhmat',
        'description': 'Työttömät työnhakijat ja avoimet työpaikat ammattiryhmittäin',
        'ammattiryhmat': []
    }

    # Käy läpi rivit
    for row in rows[5:]:  # Ohita headerit
        cells = row.findall('ss:Cell', NS)
        if not cells or len(cells) < 2:
            continue

        label = get_cell_value(cells[0])
        if not label or not isinstance(label, str):
            continue

        # Kerää arvot
        values = []
        for cell in cells[1:]:
            value = get_cell_value(cell)
            values.append(value)

        data['ammattiryhmat'].append({
            'ammattiryhmä': label,
            'values': values
        })

    return data

def parse_xml_file(filepath):
    """Parsii yksittäisen XML-tiedoston"""
    try:
        import re

        # Lue tiedosto binääritilassa
        with open(filepath, 'rb') as f:
            content = f.read()

        # Huom: XML-tiedostot väittävät olevansa iso-8859-15, mutta ovat UTF-8
        # Dekoodaa UTF-8 (todellinen enkoodaus)
        content_str = content.decode('utf-8')

        # Poista mahdolliset ongelmalliset HTML-tagit (esim. footer-linkit)
        # Nämä ovat usein tiedoston lopussa metadata-osassa
        # Poista virheelliset A-tagit jotka eivät ole valid XML:ää
        content_str = re.sub(r'<A HREF=[^>]*>', '', content_str)
        content_str = re.sub(r'</A>', '', content_str)

        # Parsii XML
        tree = ET.ElementTree(ET.fromstring(content_str))
        filename = os.path.basename(filepath)

        # Tunnista tiedostotyyppi tiedostonimen perusteella
        if '12r5' in filename:
            return parse_12r5_file(tree)
        elif '12te' in filename:
            return parse_12te_file(tree)
        elif '12ti' in filename:
            return parse_12ti_file(tree)
        else:
            print(f"Tuntematon tiedostotyyppi: {filename}")
            return None

    except Exception as e:
        print(f"Virhe tiedoston {filepath} käsittelyssä: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    # Määritä polut
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    raw_data_dir = project_root / 'data' / 'raw'
    output_file = project_root / 'data' / 'tyomarkkinadata.json'

    print("Parsitaan työmarkkinadata XML-tiedostoista...")
    print(f"Raaka data hakemisto: {raw_data_dir}")

    # Etsi kaikki XML-tiedostot (paitsi .gitkeep jos se on XML)
    xml_files = [f for f in raw_data_dir.glob('*.xml') if f.name != '.gitkeep']

    if not xml_files:
        print("VIRHE: XML-tiedostoja ei löytynyt data/raw/ hakemistosta!")
        return

    print(f"Löydettiin {len(xml_files)} XML-tiedostoa")

    # Parsii kaikki XML-tiedostot
    datasets = {}

    for xml_file in sorted(xml_files):
        print(f"Käsitellään: {xml_file.name}")
        parsed = parse_xml_file(xml_file)
        if parsed:
            data_type = parsed.get('type', 'unknown')
            datasets[data_type] = parsed

    # Luo lopullinen JSON-rakenne
    all_data = {
        'metadata': {
            'paivitetty': datetime.now().strftime('%Y-%m-%d'),
            'alueet': ['Espoo', 'Helsinki', 'Vantaa'],
            'aikajakso': '2024M12 - 2025M09',
            'source_files': len(xml_files),
            'files': [f.name for f in sorted(xml_files)]
        },
        'tyonhakijat_kaupungeittain': datasets.get('12r5_tyonhakijat', {}),
        'koulutusasteet': datasets.get('12te_koulutusaste', {}),
        'ammattiryhmat': datasets.get('12ti_ammattiryhmat', {})
    }

    # Tallenna JSON
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Työmarkkinadata tallennettu: {output_file}")
    print(f"  Tiedostoja käsitelty: {len(datasets)}")
    print(f"  Kaupunkidata: {'✓' if '12r5_tyonhakijat' in datasets else '✗'}")
    print(f"  Koulutusastedata: {'✓' if '12te_koulutusaste' in datasets else '✗'}")
    print(f"  Ammattiryhmädata: {'✓' if '12ti_ammattiryhmat' in datasets else '✗'}")

if __name__ == '__main__':
    main()
