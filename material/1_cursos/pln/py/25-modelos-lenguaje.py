# Modelos de lenguaje de n-gramas desde cero (conteos, Laplace, interpolación, Kneser–Ney) y comparación con nltk.lm.
import json, math, os, random, re
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js = open(os.path.join(RAIZ, "src", "lib", "12-lm.js"), encoding="utf-8").read()
datos = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", js, re.S).group(1))
train, test = datos["train"], datos["test"]
frec = Counter(w for s in train for w in s.split())
vocab = {"</s>", "<unk>"} | {w for w, c in frec.items() if c >= 2}
print(f"entrenamiento: {len(train)} oraciones, {sum(frec.values())} palabras; prueba: {len(test)} oraciones")
print(f"vocabulario (≥ 2 apariciones, más <unk> y </s>): {len(vocab)} de {len(frec)} formas distintas")

def ajustar(n):
    cnt = [None] + [Counter() for _ in range(n)]
    for s in train:
        t = ["<s>"] * (n - 1) + [w if w in vocab else "<unk>" for w in s.split()] + ["</s>"]
        for i in range(n - 1, len(t)):
            for k in range(1, n + 1): cnt[k][tuple(t[i - k + 1:i + 1])] += 1
    cont = [None] + [Counter() for _ in range(n)]
    for k in range(1, n):
        for g in cnt[k + 1]: cont[k][g[1:]] += 1
    tot = [None] + [Counter() for _ in range(n)]; tip = [None] + [Counter() for _ in range(n)]
    ctot = [None] + [Counter() for _ in range(n)]; ctip = [None] + [Counter() for _ in range(n)]
    for k in range(1, n + 1):
        for g, c in cnt[k].items(): tot[k][g[:-1]] += c; tip[k][g[:-1]] += 1
    for k in range(1, n):
        for g, c in cont[k].items(): ctot[k][g[:-1]] += c; ctip[k][g[:-1]] += 1
    return dict(n=n, cnt=cnt, cont=cont, tot=tot, tip=tip, ctot=ctot, ctip=ctip)

def prob(m, w, h, metodo, k=1.0, lam=None, d=0.75):
    n, V = m["n"], len(vocab)
    hist = lambda j: tuple(h[len(h) - (j - 1):]) if j > 1 else ()
    def mle(j):
        hh = hist(j); t = m["tot"][j].get(hh, 0)
        return m["cnt"][j].get(hh + (w,), 0) / t if t else 0.0
    if metodo == "mle": return mle(n)
    if metodo == "laplace":
        hh = hist(n); return (m["cnt"][n].get(hh + (w,), 0) + k) / (m["tot"][n].get(hh, 0) + k * V)
    if metodo == "interp": return lam[0] / V + sum(lam[j] * mle(j) for j in range(1, n + 1))
    def kn(j):
        hh = hist(j)
        if j == 1: return m["cont"][1].get((w,), 0) / sum(m["cont"][1].values())
        tab, ct, ty = (m["cnt"][j], m["tot"][j], m["tip"][j]) if j == n else (m["cont"][j], m["ctot"][j], m["ctip"][j])
        t = ct.get(hh, 0)
        return kn(j - 1) if not t else max(tab.get(hh + (w,), 0) - d, 0) / t + d * ty.get(hh, 0) / t * kn(j - 1)
    return kn(n)

def perplejidad(m, **kw):
    n, lp, N = m["n"], 0.0, 0
    for s in test:
        t = ["<s>"] * (n - 1) + [w if w in vocab else "<unk>" for w in s.split()] + ["</s>"]
        for i in range(n - 1, len(t)):
            p = prob(m, t[i], t[:i], **kw)
            if p <= 0: return math.inf
            lp += math.log(p); N += 1
    return math.exp(-lp / N)

modelos = {n: ajustar(n) for n in (1, 2, 3)}
lams = {1: [0.05, 0.95], 2: [0.02, 0.18, 0.80], 3: [0.01, 0.09, 0.30, 0.60]}
print(f"\n{'perplejidad en prueba':26}{'unigrama':>10}{'bigrama':>10}{'trigrama':>10}")
filas = [("máxima verosimilitud", lambda n: perplejidad(modelos[n], metodo="mle")),
         ("Laplace (k = 1)", lambda n: perplejidad(modelos[n], metodo="laplace", k=1)),
         ("Laplace (k = 0,1)", lambda n: perplejidad(modelos[n], metodo="laplace", k=0.1)),
         ("interpolación lineal", lambda n: perplejidad(modelos[n], metodo="interp", lam=lams[n])),
         ("Kneser–Ney (D = 0,75)", lambda n: perplejidad(modelos[n], metodo="kn") if n > 1 else math.nan)]
for nombre, f in filas:
    print(f"{nombre:26}" + "".join(f"{('∞' if math.isinf(v) else '—' if math.isnan(v) else f'{v:.1f}'):>10}" for v in (f(n) for n in (1, 2, 3))))

# Generación con el trigrama de Kneser–Ney
rng = random.Random(7); m = modelos[3]
print("\nfrases generadas (trigrama, Kneser–Ney):")
for _ in range(4):
    h, out = ["<s>", "<s>"], []
    for _ in range(18):
        cand = [(w, prob(m, w, h, "kn")) for w in vocab if w not in ("<unk>",)]
        r = rng.random() * sum(p for _, p in cand)
        for w, p in sorted(cand):
            r -= p
            if r <= 0: break
        if w == "</s>": break
        out.append(w); h.append(w)
    print("  ", " ".join(out))

# Comparación con nltk.lm (mismo corpus, sus propias convenciones de relleno y descuento)
from nltk.lm import KneserNeyInterpolated, Laplace
from nltk.lm.preprocessing import padded_everygram_pipeline
sents = [[w if w in vocab else "<unk>" for w in s.split()] for s in train]
for nombre, M in [("Laplace", Laplace(3)), ("KneserNeyInterpolated", KneserNeyInterpolated(3, discount=0.75))]:
    datos_t, voc = padded_everygram_pipeline(3, sents)
    M.fit(datos_t, voc)
    ngr = [g for s in test for g in __import__("nltk").ngrams(["<s>", "<s>"] + [w if w in vocab else "<unk>" for w in s.split()] + ["</s>"], 3)]
    print(f"nltk.lm {nombre:24} perplejidad = {M.perplexity(ngr):.1f}")
