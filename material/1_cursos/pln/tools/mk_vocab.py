"""Genera src/lib/07-vocab.js: las 6.000 palabras más frecuentes de CESS-ESP (NLTK) con sus frecuencias.
Se usa como modelo de lengua unigrama del corrector ortográfico (capítulo 8)."""
import os, re, json
from collections import Counter
from nltk.corpus import cess_esp
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
c = Counter(w.lower() for w in cess_esp.words() if re.fullmatch(r"[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+", w))
total = sum(c.values())
top = c.most_common(6000)
js = ("/* Generado por tools/mk_vocab.py — frecuencias de palabras de CESS-ESP (NLTK). */\n(function (root) {\n  'use strict';\n"
      "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
      f"  L.corpus.vocab = {{ total: {total}, tipos: {len(c)}, w: {json.dumps([w for w, _ in top], ensure_ascii=False, separators=(',', ':'))}, n: {json.dumps([n for _, n in top], separators=(',', ':'))} }};\n"
      "})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "07-vocab.js"), "w", encoding="utf-8").write(js)
print(total, "tokens;", len(c), "tipos;", len(js) // 1024, "KB; top:", top[:8])
