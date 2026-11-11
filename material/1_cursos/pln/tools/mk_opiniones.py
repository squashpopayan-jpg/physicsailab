"""Genera src/lib/06-opiniones.js a partir de data/opiniones.csv y data/oraciones.csv
(corpus sintético de los cuadernos de Colab del curso: 360 opiniones equilibradas)."""
import csv, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def leer(n):
    with open(os.path.join(ROOT, "data", n), encoding="utf-8-sig", newline="") as f:
        txt = f.read().replace("\r\r\n", "\n").replace("\r\n", "\n").replace("\r", "\n")
    lines = [l for l in txt.split("\n") if l.strip()]
    return list(csv.DictReader(lines))
op = leer("opiniones.csv")
orr = leer("oraciones.csv")
rows = [[r["id"], r["texto"], r["etiqueta"], r["tema"]] for r in op]
js = ("/* Generado por tools/mk_opiniones.py — corpus sintético de los laboratorios de Colab (no son opiniones reales). */\n"
      "(function (root) {\n  'use strict';\n  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
      "  L.corpus.opiniones = " + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ".map((r) => ({ id: r[0], texto: r[1], etiqueta: r[2], tema: r[3] }));\n"
      "  L.corpus.oraciones = " + json.dumps([r["oracion"] for r in orr], ensure_ascii=False) + ";\n"
      "})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "06-opiniones.js"), "w", encoding="utf-8").write(js)
print(len(rows), "opiniones;", len(orr), "oraciones;", len(js) // 1024, "KB")
