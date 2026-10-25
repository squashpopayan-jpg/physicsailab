#!/usr/bin/env python3
"""Sirve hBN-MC en http://127.0.0.1:8000 (solo acceso local)."""
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parents[1]
os.chdir(root)
version = json.loads((root / 'VERSION.json').read_text(encoding='utf-8'))['version']
print(f'hBN-MC v{version} -> http://127.0.0.1:8000  (Ctrl+C para detener)')
ThreadingHTTPServer(('127.0.0.1', 8000), SimpleHTTPRequestHandler).serve_forever()
