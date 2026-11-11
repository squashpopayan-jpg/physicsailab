"""Genera src/lib/09-wordnet.js: un subconjunto de WordNet 3.0 (NLTK + Open Multilingual WordNet 1.4)
con los sustantivos de unas 70 palabras del español y toda su cadena de hiperónimos."""
import os, json
from nltk.corpus import wordnet as wn
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEMILLAS = ("banco cabo sobre radio planta hoja mina capital cuerda ratón gato perro animal coche automóvil manzana fruta árbol casa edificio persona profesor "
            "estudiante libro texto médico hospital escuela río orilla dinero idioma lenguaje ordenador mesa silla mueble pájaro ave pez caballo vaca mamífero "
            "vehículo camión bicicleta ciudad país universidad agua comida pan vino café música guitarra instrumento red nube tiempo gobierno presidente").split()
sel = {}
semilla_syns = {}
for w in SEMILLAS:
    ss = wn.synsets(w, pos="n", lang="spa")
    semilla_syns[w] = [s.name() for s in ss]
    for s in ss:
        stack = [s]
        while stack:
            x = stack.pop()
            if x.name() in sel: continue
            sel[x.name()] = x
            stack += x.hypernyms() + x.instance_hypernyms()
datos = []
for n, s in sorted(sel.items()):
    datos.append({"id": n, "gl": s.definition(), "es": s.lemma_names("spa"), "en": s.lemma_names("eng")[:4],
                  "h": [h.name() for h in s.hypernyms() + s.instance_hypernyms()]})
idx = {w: v for w, v in semilla_syns.items()}
js = ("/* Generado por tools/mk_wordnet.py — subconjunto de WordNet 3.0 con lemas del español (Open Multilingual WordNet). */\n(function (root) {\n  'use strict';\n"
      "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
      "  L.corpus.wordnet = { synsets: " + json.dumps(datos, ensure_ascii=False, separators=(',', ':')) + ", semillas: " + json.dumps(idx, ensure_ascii=False, separators=(',', ':')) + " };\n"
      "})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "09-wordnet.js"), "w", encoding="utf-8").write(js)
print(len(datos), "synsets;", sum(len(v) for v in idx.values()), "sentidos de las semillas;", len(js) // 1024, "KB")
print({w: len(v) for w, v in list(idx.items())[:12]})
