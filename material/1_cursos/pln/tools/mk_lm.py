"""Genera src/lib/12-lm.js: oraciones de CESS-ESP (minúsculas, sin puntuación) para entrenar y evaluar modelos de n-gramas.
Entrenamiento: 2.400 oraciones; prueba: 300 oraciones distintas; ambas elegidas con paso fijo entre las de 6 a 28 palabras."""
import os, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mk_cess import corpus_limpio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def oraciones():
    out = []
    for s in corpus_limpio():
        ws = [w.lower() for w, t in s if t[0] not in "FWzZ" and ' ' not in w]
        if 6 <= len(ws) <= 28: out.append(" ".join(ws))
    return out


if __name__ == "__main__":
    todas = oraciones()
    paso = len(todas) // 2700
    sel = todas[::paso][:2700]
    test = sel[8::9][:300]
    train = [s for i, s in enumerate(sel) if i % 9 != 8][:2400]
    js = ("/* Generado por tools/mk_lm.py — oraciones de CESS-ESP para modelos de n-gramas. */\n(function (root) {\n  'use strict';\n"
          "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
          "  L.corpus.lm = " + json.dumps({"train": train, "test": test}, ensure_ascii=False, separators=(',', ':')) + ";\n"
          "})(typeof window !== 'undefined' ? window : globalThis);\n")
    open(os.path.join(ROOT, "src", "lib", "12-lm.js"), "w", encoding="utf-8").write(js)
    print(len(todas), "candidatas;", len(train), "entrenamiento;", len(test), "prueba;", sum(len(s.split()) for s in train), "palabras de entrenamiento;", len(js) // 1024, "KB")
