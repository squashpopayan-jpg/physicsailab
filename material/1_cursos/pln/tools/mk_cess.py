"""Genera src/lib/08-cess.js: un subconjunto de CESS-ESP (NLTK) con etiquetas EAGLES para los capítulos de etiquetado.
Limpieza: se descartan las huellas sintácticas (tokens como *0*, etiquetas con punto) y se restituyen los paréntesis.
Se guardan 300 oraciones (8–30 palabras) elegidas con paso fijo. También estadísticas del corpus completo limpio."""
import os, re, json
from collections import Counter, defaultdict
from nltk.corpus import cess_esp
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def coarse(t):
    if t[0] == 'n': return 'PROPN' if t.startswith('np') else 'NOUN'
    if t[0] == 'v': return 'AUX' if t.startswith('va') else 'VERB'
    return {'a': 'ADJ', 'r': 'ADV', 'd': 'DET', 'p': 'PRON', 's': 'ADP', 'c': 'CONJ', 'z': 'NUM', 'Z': 'NUM', 'F': 'PUNCT', 'W': 'DATE', 'i': 'INTJ', 'I': 'INTJ'}.get(t[0], 'X')


def limpia(sent):
    out = []
    for w, t in sent:
        if '.' in t or re.fullmatch(r"\*.*\*", w): continue
        w = {'-Fpa-': '(', '-Fpt-': ')', '-Fca-': '[', '-Fct-': ']'}.get(w, w)
        out.append((w.replace('_', ' '), t))
    return out


def corpus_limpio():
    return [s for s in (limpia(x) for x in cess_esp.tagged_sents()) if s]


if __name__ == "__main__":
    todas = corpus_limpio()
    tok = sum(len(s) for s in todas)
    cand = [s for s in todas if 8 <= len(s) <= 30 and all(' ' not in w for w, _ in s)]
    paso = max(1, len(cand) // 300)
    sub = cand[::paso][:300]
    d = defaultdict(Counter)
    for s in todas:
        for w, t in s: d[w.lower()][coarse(t)] += 1
    amb_tipos = sum(1 for c in d.values() if len(c) > 1)
    amb_tok = sum(sum(c.values()) for c in d.values() if len(c) > 1)
    dist = Counter(coarse(t) for s in todas for _, t in s)
    frec_amb = sorted(((w, sum(c.values()), dict(c)) for w, c in d.items() if len(c) > 1), key=lambda x: -x[1])[:40]
    fino = Counter(t for s in todas for _, t in s)
    meta = {"oraciones": len(todas), "tokens": tok, "tipos": len(d), "etiquetas": len({t for s in todas for _, t in s}),
            "ambTipos": amb_tipos / len(d), "ambTokens": amb_tok / tok, "dist": dict(dist),
            "ambiguas": [[w, n, c] for w, n, c in frec_amb], "finas": fino.most_common(60)}
    js = ("/* Generado por tools/mk_cess.py — subconjunto de CESS-ESP (NLTK) con etiquetas EAGLES. */\n(function (root) {\n  'use strict';\n"
          "  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.corpus = L.corpus || {};\n"
          f"  L.corpus.cessMeta = {json.dumps(meta)};\n"
          "  L.corpus.cess = " + json.dumps([[[w, t] for w, t in s] for s in sub], ensure_ascii=False, separators=(',', ':')) + ";\n"
          "})(typeof window !== 'undefined' ? window : globalThis);\n")
    open(os.path.join(ROOT, "src", "lib", "08-cess.js"), "w", encoding="utf-8").write(js)
    print(meta, len(sub), 'oraciones;', sum(len(s) for s in sub), 'tokens;', len(js) // 1024, 'KB')
