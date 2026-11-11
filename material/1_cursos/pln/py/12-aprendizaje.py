# Etiquetado con aprendizaje automático supervisado: perceptrón promediado (NLTK) y regresión logística (máxima entropía)
# con rasgos de la palabra y su contexto; evaluación por etiqueta. Requiere: nltk, scikit-learn y nltk.download("cess_esp").
import re, time
from collections import Counter
import numpy as np
from nltk.corpus import cess_esp
from nltk.tag.perceptron import PerceptronTagger
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report


def coarse(t):
    if t[0] == "n": return "PROPN" if t.startswith("np") else "NOUN"
    if t[0] == "v": return "AUX" if t.startswith("va") else "VERB"
    return {"a": "ADJ", "r": "ADV", "d": "DET", "p": "PRON", "s": "ADP", "c": "CONJ", "z": "NUM", "Z": "NUM",
            "F": "PUNCT", "W": "DATE", "i": "INTJ", "I": "INTJ"}.get(t[0], "X")


sents = [[(w, coarse(t)) for w, t in s if "." not in t and not re.fullmatch(r"\*.*\*", w)] for s in cess_esp.tagged_sents()]
sents = [s for s in sents if s]
n = int(0.9 * len(sents)); train, test = sents[:n], sents[n:]
conocidas = {w.lower() for s in train for w, _ in s}
print(f"entrenamiento {len(train)} oraciones, prueba {len(test)}")


def exactitud(pred, gold):
    ok = sum(p == g for p, g in zip(pred, gold))
    k = [(p == g) for p, g, w in zip(pred, gold, [w for s in test for w, _ in s]) if w.lower() in conocidas]
    u = [(p == g) for p, g, w in zip(pred, gold, [w for s in test for w, _ in s]) if w.lower() not in conocidas]
    return ok / len(gold), sum(k) / len(k), sum(u) / len(u)


gold = [t for s in test for _, t in s]

# 1) Perceptrón promediado de NLTK
t0 = time.time()
tagger = PerceptronTagger(load=False)
tagger.train([[(w, t) for w, t in s] for s in train], nr_iter=5)
pred = [t for s in test for _, t in tagger.tag([w for w, _ in s])]
a, k, u = exactitud(pred, gold)
print(f"perceptrón promediado (NLTK, 5 épocas): {100*a:.1f} %  conocidas {100*k:.1f} %  desconocidas {100*u:.1f} %   ({time.time()-t0:.0f} s)")


# 2) Máxima entropía (regresión logística) con rasgos de contexto y decodificación voraz
def rasgos(ws, i, prev):
    w = ws[i]; l = w.lower()
    return {"b": 1, "w=" + l: 1, "s3=" + l[-3:]: 1, "s2=" + l[-2:]: 1, "p1=" + prev: 1, "pw=" + (ws[i - 1].lower() if i else "<s>"): 1,
            "nw=" + (ws[i + 1].lower() if i + 1 < len(ws) else "</s>"): 1, "cap": int(w[:1].isupper() and i > 0), "dig": int(any(c.isdigit() for c in w))}


t0 = time.time()
X, y = [], []
for s in train:
    ws = [w for w, _ in s]; prev = "<s>"
    for i, (_, t) in enumerate(s):
        X.append(rasgos(ws, i, prev)); y.append(t); prev = t
vec = DictVectorizer()
Xv = vec.fit_transform(X)
clf = LogisticRegression(max_iter=300, C=1.0).fit(Xv, y)
pred = []
for s in test:
    ws = [w for w, _ in s]; prev = "<s>"
    for i in range(len(ws)):
        t = clf.predict(vec.transform([rasgos(ws, i, prev)]))[0]; pred.append(t); prev = t
a, k, u = exactitud(pred, gold)
print(f"máxima entropía (regresión logística): {100*a:.1f} %  conocidas {100*k:.1f} %  desconocidas {100*u:.1f} %   ({time.time()-t0:.0f} s, {Xv.shape[1]} rasgos)")

# 3) Evaluación por etiqueta del mejor
rep = classification_report(gold, pred, output_dict=True, zero_division=0)
print("\netiqueta   precisión  cobertura  F1     soporte")
for t in sorted(rep, key=lambda k: -rep[k]["support"] if k in set(gold) else 1)[:9]:
    if t in set(gold): print(f"{t:8}   {rep[t]['precision']:.3f}      {rep[t]['recall']:.3f}      {rep[t]['f1-score']:.3f}  {int(rep[t]['support'])}")
print(f"F1 macro: {rep['macro avg']['f1-score']:.3f}  |  F1 ponderado: {rep['weighted avg']['f1-score']:.3f}")
c = Counter((g, p) for g, p in zip(gold, pred) if g != p)
print("confusiones más frecuentes:", [(f"{g}→{p}", v) for (g, p), v in c.most_common(5)])
