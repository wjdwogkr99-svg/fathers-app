#!/usr/bin/env python3
"""Read-only verification of the three pinned public OSM peak nodes (TLS stays enabled).

Run from any directory: python3 scripts/verify_peak_sources.py
Does not write the catalog, upload locations, or request a token.
"""
import hashlib
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

catalog = json.loads((Path(__file__).resolve().parents[1] / 'src/data/peak-catalog.json').read_text())
assert catalog['schemaVersion'] == 1
for peak in catalog['peaks']:
    source = peak['source']
    expected_url = f"https://api.openstreetmap.org/api/0.6/node/{source['nodeId']}/{source['version']}"
    assert source['url'] == expected_url, 'Only pinned official OSM API URLs are supported'
    request = urllib.request.Request(expected_url, headers={'User-Agent': 'FathersApp/0.1 public-peak-source-verification'})
    with urllib.request.urlopen(request, timeout=40) as response:
        node = ET.fromstring(response.read()).find('node')
    assert node is not None
    tags = {tag.attrib['k']: tag.attrib['v'] for tag in node.findall('tag')}
    actual = {
        'nodeId': int(node.attrib['id']), 'version': int(node.attrib['version']),
        'nodeTimestamp': node.attrib['timestamp'],
        'latitude': float(node.attrib['lat']), 'longitude': float(node.attrib['lon']),
        'tags': {key: tags[key] for key in ['natural', 'name', 'ele']},
    }
    expected = {key: source[key] for key in actual}
    assert actual == expected, f"Source mismatch: {peak['id']}"
    canonical = json.dumps(actual, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    assert hashlib.sha256(canonical).hexdigest() == source['sha256'], 'Canonical source checksum mismatch'
    assert tags['natural'] == 'peak' and float(tags['ele']) > 0
    print(f"PASS {peak['name']}: node {source['nodeId']} v{source['version']}, coordinates + elevation + SHA-256 match")
print(f"Verified {len(catalog['peaks'])} public peak source records. No files changed.")
