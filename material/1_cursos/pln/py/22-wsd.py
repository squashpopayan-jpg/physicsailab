# Desambiguación del sentido: Lesk simplificado en español (variantes) y el Lesk de NLTK con WordNet.
import json, math, os, re, unicodedata
from collections import Counter
import regex
from nltk.stem.snowball import SnowballStemmer
from nltk.wsd import lesk as lesk_nltk

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.load(open(os.path.join(RAIZ, "data", "wsd.json"), encoding="utf-8"))
st = SnowballStemmer("spanish")
STOP = set("a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era eran es esa esas ese esos esta estas este esto estos fue fueron ha hay hasta la las le les lo los mas me mi mis muy no nos o para pero por porque que quien quienes se ser si sin sobre su sus te tiene todo todos tu tus un una unas uno unos y ya yo".split())
sin = lambda s: "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def raices(texto, objetivo):
    return {st.stem(w) for w in regex.findall(r"\p{L}+", texto.lower()) if sin(w) not in STOP and len(w) > 2} - {st.stem(objetivo)}

firmas = {p: [raices(s["d"] + " " + " ".join(s["e"]), p) for s in ss] for p, ss in datos["palabras"].items()}
N = sum(len(v) for v in firmas.values())
def idf(r): return math.log(N / max(1, sum(1 for v in firmas.values() for f in v if r in f)))

def desambigua(palabra, oracion, ejemplos=True, con_idf=False):
    ctx = raices(oracion, palabra)
    puntos = []
    for s in datos["palabras"][palabra]:
        f = raices(s["d"] + (" " + " ".join(s["e"]) if ejemplos else ""), palabra)
        puntos.append(sum(idf(r) for r in ctx & f) if con_idf else len(ctx & f))
    return max(range(len(puntos)), key=lambda i: (puntos[i], -i)), puntos

pruebas = datos["pruebas"]
print(f"oraciones de prueba: {len(pruebas)}; palabras ambiguas: {len(datos['palabras'])}; sentidos: {N}")
mfs = sum(1 for _, g, _ in pruebas if g == 0) / len(pruebas)
print(f"sentido más frecuente (el primero):        {mfs:.1%}")
for nombre, kw in [("Lesk simplificado (definición+ejemplos)", {}), ("Lesk solo con la definición", {"ejemplos": False}), ("Lesk ponderado con IDF", {"con_idf": True})]:
    ok = sum(1 for p, g, o in pruebas if desambigua(p, o, **kw)[0] == g)
    print(f"{nombre:42} {ok}/{len(pruebas)} = {ok / len(pruebas):.1%}")

# Aprendizaje supervisado: Bayes ingenuo multinomial entrenado con la definición y los ejemplos de cada sentido
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer
def lista(texto, objetivo):
    return [st.stem(w) for w in regex.findall(r"\p{L}+", texto.lower()) if sin(w) not in STOP and len(w) > 2 and st.stem(w) != st.stem(objetivo)]
def bayes(palabra, oracion):
    ss = datos["palabras"][palabra]
    cv = CountVectorizer(analyzer=lambda x: x)
    X = cv.fit_transform([lista(s["d"] + " " + " ".join(s["e"]), palabra) for s in ss])
    nb = MultinomialNB(alpha=1.0, fit_prior=False).fit(X, list(range(len(ss))))
    return int(nb.predict(cv.transform([lista(oracion, palabra)]))[0])
ok = sum(1 for p, g, o in pruebas if bayes(p, o) == g)
print(f"{'Bayes ingenuo (sklearn, alfa = 1)':42} {ok}/{len(pruebas)} = {ok / len(pruebas):.1%}")

fallos = [(p, g, o) for p, g, o in pruebas if desambigua(p, o)[0] != g]
print("fallos:", [f"{p} (sentido {g}, sin solapes: {max(desambigua(p, o)[1]) == 0})" for p, g, o in fallos])

# El Lesk de NLTK sobre el WordNet inglés (oración clásica del libro de texto)
frase = "I went to the bank to deposit my money".split()
print("NLTK lesk('bank') →", lesk_nltk(frase, "bank", "n"), "|", lesk_nltk(frase, "bank", "n").definition()[:60])
