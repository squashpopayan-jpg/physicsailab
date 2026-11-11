"""Genera src/lib/14-ner.js: subconjunto del corpus CoNLL-2002 en español (NLTK) para reconocimiento de entidades (etiquetas BIO).
Entrenamiento: 1.200 oraciones de esp.train (6–30 palabras, paso fijo). Prueba: 300 oraciones de esp.testb (mismas condiciones)."""
import os, json
from nltk.corpus import conll2002
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def elige(fid, n):
    ok = [[(w, t) for w, _, t in s] for s in conll2002.iob_sents(fid) if 6 <= len(s) <= 30]
    paso = max(1, len(ok) // n)
    return ok[::paso][:n]


if __name__ == "__main__":
    tr, te = elige("esp.train", 1200), elige("esp.testb", 300)
    js = ("/* Generado por tools/mk_ner.py — CoNLL-2002 (español) con etiquetas BIO: [[palabra, etiqueta], …] por oración. */\n(function (root) {\n  'use strict';\n"
          "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
          "  L.corpus.ner = " + json.dumps({"tr": [[[w, t] for w, t in s] for s in tr], "te": [[[w, t] for w, t in s] for s in te]}, ensure_ascii=False, separators=(',', ':')) + ";\n"
          "})(typeof window !== 'undefined' ? window : globalThis);\n")
    open(os.path.join(ROOT, "src", "lib", "14-ner.js"), "w", encoding="utf-8").write(js)
    ent = lambda ss: sum(1 for s in ss for _, t in s if t.startswith("B-"))
    print(len(tr), "oraciones de entrenamiento;", ent(tr), "entidades;", len(te), "de prueba;", ent(te), "entidades;", len(js) // 1024, "KB")
