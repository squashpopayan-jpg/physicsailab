# Recursos lingüísticos disponibles en NLTK: tamaño de corpus en español y de WordNet, y cuánto vocabulario hace falta para cubrir un texto.
from collections import Counter
from nltk.corpus import cess_esp, conll2002, wordnet as wn, stopwords

for nombre, sents in [("CESS-ESP", cess_esp.sents()), ("CoNLL-2002 (esp.train)", conll2002.sents("esp.train"))]:
    toks = [w.lower() for s in sents for w in s if w.isalpha()]
    c = Counter(toks); n = len(toks)
    hapax = sum(1 for v in c.values() if v == 1)
    print(f"{nombre:24} {len(sents):6d} oraciones {n:8d} palabras {len(c):6d} formas distintas; hapax {hapax / len(c):.1%} de las formas")
    acum, cob = 0, {}
    for i, (_, v) in enumerate(c.most_common(), 1):
        acum += v
        for k in (100, 1000, 5000):
            if i == k: cob[k] = acum / n
    print("   cobertura del texto con las formas más frecuentes:", ", ".join(f"{k}: {v:.1%}" for k, v in cob.items()))

print(f"\nWordNet 3.0 (inglés): {len(list(wn.all_synsets('n')))} synsets de sustantivos, {len(list(wn.all_synsets('v')))} de verbos, {len(list(wn.all_synsets('a')))} de adjetivos")
print("lemas en español (OMW) de dog.n.01:", wn.synset("dog.n.01").lemma_names("spa")[:5], "| idiomas disponibles:", len(wn.langs()))
print("palabras vacías en español (NLTK):", len(stopwords.words("spanish")))
