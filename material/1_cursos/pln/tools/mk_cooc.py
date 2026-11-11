"""Genera src/lib/11-cooc.js: matriz de coocurrencia palabra–contexto de CESS-ESP (corpus completo y limpio), ventana ±2 dentro de la oración.
Filas: las 400 formas de contenido (sustantivos, verbos y adjetivos) más frecuentes. Columnas: las 800 formas más frecuentes (sin puntuación).
Los totales marginales para PMI se calculan sobre esta matriz restringida."""
import os, json, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mk_cess import corpus_limpio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V, H, VENT = 400, 800, 2


def cuenta():
    corpus = [[(w.lower(), t) for w, t in s if t[0] not in "FWzZ" and ' ' not in w] for s in corpus_limpio()]
    corpus = [s for s in corpus if s]
    frec = Counter(w for s in corpus for w, _ in s)
    contenido = Counter(w for s in corpus for w, t in s if t[0] in "nva" and not t.startswith("va") and len(w) > 2)
    filas = [w for w, _ in contenido.most_common(V)]
    cols = [w for w, _ in frec.most_common(H)]
    return corpus, filas, cols


if __name__ == "__main__":
    corpus, filas, cols = cuenta()
    fi = {w: i for i, w in enumerate(filas)}; ci = {w: i for i, w in enumerate(cols)}
    M = [Counter() for _ in filas]
    for s in corpus:
        ws = [w for w, _ in s]
        for i, w in enumerate(ws):
            if w not in fi: continue
            for j in range(max(0, i - VENT), min(len(ws), i + VENT + 1)):
                if j != i and ws[j] in ci: M[fi[w]][ci[ws[j]]] += 1
    filas_js = [[[c, n] for c, n in sorted(m.items())] for m in M]
    total = sum(n for m in M for n in m.values())
    js = ("/* Generado por tools/mk_cooc.py — coocurrencias de CESS-ESP (ventana ±2). */\n(function (root) {\n  'use strict';\n"
          "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
          "  L.corpus.cooc = " + json.dumps({"filas": filas, "cols": cols, "ventana": VENT, "total": total, "m": filas_js}, ensure_ascii=False, separators=(',', ':')) + ";\n"
          "})(typeof window !== 'undefined' ? window : globalThis);\n")
    open(os.path.join(ROOT, "src", "lib", "11-cooc.js"), "w", encoding="utf-8").write(js)
    nz = sum(len(m) for m in M)
    print(len(filas), "filas;", len(cols), "columnas;", nz, "celdas no nulas;", total, "pares;", len(js) // 1024, "KB")
    print("filas más frecuentes:", filas[:20])
