"""Genera src/lib/13-s2s.js a partir de py/out/29-s2s.json (salida del programa py/29-seq2seq.py): atenciones aprendidas de un seq2seq de fechas."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, "py", "out", "29-s2s.json"), encoding="utf-8"))
js = ("/* Generado por tools/mk_s2s.py — resultados y atenciones del seq2seq de fechas (py/29-seq2seq.py). */\n(function (root) {\n  'use strict';\n"
      "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
      "  L.corpus.s2s = " + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "13-s2s.js"), "w", encoding="utf-8").write(js)
print(len(d["ejemplos"]), "ejemplos;", len(js) // 1024, "KB")
