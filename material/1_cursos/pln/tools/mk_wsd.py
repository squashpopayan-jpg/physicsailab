"""Genera src/lib/10-wsd.js a partir de data/wsd.json (inventario de sentidos en español y oraciones de prueba)."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, "data", "wsd.json"), encoding="utf-8"))
js = ("/* Generado por tools/mk_wsd.py — inventario de sentidos y oraciones de prueba (originales del curso). */\n(function (root) {\n  'use strict';\n"
      "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
      "  L.corpus.wsd = " + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "10-wsd.js"), "w", encoding="utf-8").write(js)
print(len(d["palabras"]), "palabras;", sum(len(v) for v in d["palabras"].values()), "sentidos;", len(d["pruebas"]), "oraciones de prueba;", len(js) // 1024, "KB")
