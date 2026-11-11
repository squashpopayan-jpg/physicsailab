# WordNet con NLTK: sentidos de una palabra del español, relaciones léxicas y estadísticas de polisemia.
from nltk.corpus import wordnet as wn

# 1) Sentidos de palabras del español (Open Multilingual WordNet)
for palabra in ["banco", "perro", "radio", "hoja"]:
    ss = wn.synsets(palabra, lang="spa")
    print(f"{palabra}: {len(ss)} synsets")
    for s in ss[:4]:
        print(f"   {s.name():32} {s.definition()[:62]}")

# 2) Relaciones entre sentidos
perro = wn.synset("dog.n.01")
print("hiperónimos de dog.n.01   :", [h.name() for h in perro.hypernyms()])
print("cadena hasta la raíz      :", " → ".join(s.name().split(".")[0] for s in perro.hypernym_paths()[0]))
print("algunos hipónimos de dog  :", sorted(h.name().split(".")[0] for h in perro.hyponyms())[:6])
print("partes de car.n.01        :", sorted(m.name().split(".")[0] for m in wn.synset("car.n.01").part_meronyms())[:6])
bueno = wn.synset("good.a.01").lemmas()[0]
print("antónimo de good          :", [a.name() for a in bueno.antonyms()])
print("subsumidor de dog y cat   :", wn.synset("dog.n.01").lowest_common_hypernyms(wn.synset("cat.n.01")))

# 3) ¿Cuán polisémicas son las palabras? (inglés, sustantivos)
n_sentidos = {}
for s in wn.all_synsets("n"):
    for l in s.lemmas():
        n_sentidos[l.name().lower()] = n_sentidos.get(l.name().lower(), 0) + 1
tot = len(n_sentidos)
print(f"sustantivos distintos: {tot}; synsets: {len(list(wn.all_synsets('n')))}")
print(f"media de sentidos por sustantivo: {sum(n_sentidos.values()) / tot:.2f}")
print(f"con un solo sentido: {sum(1 for v in n_sentidos.values() if v == 1) / tot:.1%}; con más de 5: {sum(1 for v in n_sentidos.values() if v > 5) / tot:.1%}")
