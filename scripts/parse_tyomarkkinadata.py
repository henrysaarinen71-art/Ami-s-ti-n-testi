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

def parse_xml_file(filepath):
    """Parsii yksittäisen XML-tiedoston"""
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()

        # Palautetaan parsed data (rakenne päivitetään kun XML-tiedostot saapuvat)
        data = {
            'filename': os.path.basename(filepath),
            'root_tag': root.tag,
            'data': []
        }

        # TODO: Lisää XML-spesifinen parsintalogiikka kun tiedostojen rakenne tiedetään

        return data
    except Exception as e:
        print(f"Virhe tiedoston {filepath} käsittelyssä: {e}")
        return None

def main():
    # Määritä polut
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    raw_data_dir = project_root / 'data' / 'raw'
    output_file = project_root / 'data' / 'tyomarkkinadata.json'

    print("Parsitaan työmarkkinadata XML-tiedostoista...")
    print(f"Raaka data hakemisto: {raw_data_dir}")

    # Etsi kaikki XML-tiedostot
    xml_files = list(raw_data_dir.glob('*.xml'))

    if not xml_files:
        print("VIRHE: XML-tiedostoja ei löytynyt data/raw/ hakemistosta!")
        return

    print(f"Löydettiin {len(xml_files)} XML-tiedostoa")

    # Parsii kaikki XML-tiedostot
    all_data = {
        'metadata': {
            'source_files': len(xml_files),
            'files': [os.path.basename(f) for f in xml_files]
        },
        'datasets': []
    }

    for xml_file in xml_files:
        print(f"Käsitellään: {xml_file.name}")
        parsed = parse_xml_file(xml_file)
        if parsed:
            all_data['datasets'].append(parsed)

    # Tallenna JSON
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Työmarkkinadata tallennettu: {output_file}")
    print(f"  Tiedostoja käsitelty: {len(all_data['datasets'])}")

if __name__ == '__main__':
    main()
