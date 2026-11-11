# Etiquetado morfosintáctico con taggers de NLTK sobre CESS-ESP (etiquetas EAGLES reducidas a 13 clases).
# Requiere: pip install nltk  y  nltk.download("cess_esp")
import re
from collections import Counter, defaultdict
from nltk.corpus import cess_esp
from nltk.tag import DefaultTagger, RegexpTagger, UnigramTagger, BigramTagger, TrigramTagger


def coarse(t):
    if t[0] == "n": return "PROPN" if t.startswith("np") else "NOUN"
    if t[0] == "v": return "AUX" if t.startswith("va") else "VERB"
    return {"a": "ADJ", "r": "ADV", "d": "DET", "p": "PRON", "s": "ADP", "c": "CONJ", "z": "NUM", "Z": "NUM",
            "F": "PUNCT", "W": "DATE", "i": "INTJ", "I": "INTJ"}.get(t[0], "X")


def limpia(sent):
    return [(w.lower(), coarse(t)) for w, t in sent if "." not in t and not re.fullmatch(r"\*.*\*", w)]


sents = [s for s in (limpia(x) for x in cess_esp.tagged_sents()) if s]
n = int(0.9 * len(sents))
train, test = sents[:n], sents[n:]
print(f"oraciones: {len(sents)} (entrenamiento {len(train)}, prueba {len(test)}); etiquetas: {sorted({t for s in sents for _, t in s})}")

# ambigüedad: tipos con más de una etiqueta frente a tokens en tipos ambiguos
d = defaultdict(Counter)
for s in sents:
    for w, t in s: d[w][t] += 1
tok = sum(len(s) for s in sents)
amb_tok = sum(sum(c.values()) for c in d.values() if len(c) > 1)
print(f"tipos ambiguos: {100*sum(len(c)>1 for c in d.values())/len(d):.1f} %; tokens en tipos ambiguos: {100*amb_tok/tok:.1f} %")

# taggers
por_defecto = DefaultTagger("NOUN")
reglas = RegexpTagger([(r"^[0-9][0-9.,]*$", "NUM"), (r"^[.,;:!?¿¡()«»\"'-]+$", "PUNCT"), (r".*(mente)$", "ADV"), (r".*(ción|sión|dad|tad|miento)(es)?$", "NOUN"),
                       (r".*(ar|er|ir|ando|iendo|ado|ido|aba|ó)$", "VERB"), (r".*(oso|osa|ivo|iva|ble)s?$", "ADJ")], backoff=por_defecto)
uni = UnigramTagger(train)
uni_b = UnigramTagger(train, backoff=reglas)
bi = BigramTagger(train, backoff=uni_b)
tri = TrigramTagger(train, backoff=bi)
for nombre, t in [("siempre NOUN", por_defecto), ("reglas por sufijo", reglas), ("unigrama", uni), ("unigrama + reglas", uni_b),
                  ("bigrama + unigrama + reglas", bi), ("trigrama + ... + reglas", tri)]:
    print(f"{nombre:30} exactitud en prueba: {100*t.accuracy(test):5.1f} %")

# errores más frecuentes del mejor
err = Counter()
for s in test:
    for (w, g), (_, p) in zip(s, tri.tag([w for w, _ in s])):
        if g != p: err[(g, p)] += 1
print("\nconfusiones más frecuentes (real → predicha):", [(f"{g}→{p}", c) for (g, p), c in err.most_common(5)])
