# Uso y evaluación de modelos de lenguaje: (1) BLEU, ROUGE y chrF; (2) recuperación TF-IDF frente a BM25 para RAG; (3) estrategias de decodificación.
import json, math, os, re
from collections import Counter
import numpy as np
import sacrebleu
from rouge_score import rouge_scorer
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", open(os.path.join(RAIZ, "src", "lib", "12-lm.js"), encoding="utf-8").read(), re.S).group(1))
train = datos["train"]

# 1) Medidas de evaluación sobre cinco candidatas de una misma referencia
ref = "el gobierno anunció una nueva política económica para el país"
cands = {"idéntica": ref, "reordenada": "una nueva política económica para el país fue anunciada por el gobierno", "sinónimos": "el ejecutivo presentó un nuevo plan económico para la nación",
         "demasiado corta": "el gobierno anunció una política", "repetición": "país país país país país país"}
sc = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=False)
sinac = lambda t: t.translate(str.maketrans("áéíóúü", "aeiouu"))
print(f"{'candidata':17}{'BLEU':>7}{'chrF':>7}{'R-1 F1':>8}{'R-2 F1':>8}{'R-L F1':>8}")
for n, c in cands.items():
    b = sacrebleu.sentence_bleu(c, [ref], tokenize="none").score; f = sacrebleu.sentence_chrf(c, [ref]).score; r = sc.score(sinac(ref), sinac(c))
    print(f"{n:17}{b:7.1f}{f:7.1f}{r['rouge1'].fmeasure:8.3f}{r['rouge2'].fmeasure:8.3f}{r['rougeL'].fmeasure:8.3f}")

# 2) Recuperación: ¿en qué posición aparece la oración de origen cuando la consulta es un fragmento de ella?
rng = np.random.default_rng(32); idx = rng.choice(len(train), 300, replace=False); consultas = []
for i in idx:
    w = train[i].split(); j = int(rng.integers(0, max(1, len(w) - 5))); consultas.append(" ".join(w[j:j + 5]))
vacias = "a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue sobre".split()
tv = TfidfVectorizer(stop_words=vacias); T = tv.fit_transform(train)
cv = CountVectorizer(stop_words=vacias); C = cv.fit_transform(train).tocsc().astype(float); N = C.shape[0]
df = np.asarray((C > 0).sum(0)).ravel(); idf = np.log(1 + (N - df + 0.5) / (df + 0.5)); ld = np.asarray(C.sum(1)).ravel(); k1, b = 1.2, 0.75
def bm25(q):
    t = [cv.vocabulary_[w] for w in cv.build_analyzer()(q) if w in cv.vocabulary_]; s = np.zeros(N)
    for j in t:
        tf = C[:, j].toarray().ravel(); s += idf[j] * tf * (k1 + 1) / (tf + k1 * (1 - b + b * ld / ld.mean()))
    return s
def evalua(pun):
    rangos = []
    for q, i in zip(consultas, idx):
        s = pun(q); rangos.append(int((s > s[i]).sum()) + 1)
    r = np.array(rangos); return (1 / r).mean(), (r <= 1).mean(), (r <= 5).mean()
for nombre, f in (("TF-IDF + coseno", lambda q: cosine_similarity(tv.transform([q]), T).ravel()), ("BM25", bm25)):
    mrr, r1, r5 = evalua(f); print(f"{nombre:18} MRR {mrr:.3f}  acierto en 1: {r1:.1%}  en 5: {r5:.1%}   ({len(consultas)} consultas de 5 palabras)")

# 3) Estrategias de decodificación con un modelo de bigramas (suavizado add-0,05), 300 frases de hasta 20 palabras por estrategia
frec = Counter(w for s in train for w in s.split()); vocab = ["<s>", "</s>"] + sorted(w for w, c in frec.items() if c >= 2); ix = {w: i for i, w in enumerate(vocab)}; V = len(vocab)
Mb = np.full((V, V), 0.05, dtype=np.float32)
for s in train:
    t = [0] + [ix[w] for w in s.split() if w in ix] + [1]
    for a, bb in zip(t, t[1:]): Mb[a, bb] += 1
Mb[:, 0] = 0; P = Mb / Mb.sum(1, keepdims=True)
def genera(met, rng, T=1.0, k=0, p=1.0, maxlen=20):
    h, out, lp = 0, [], 0.0
    for _ in range(maxlen):
        q = P[h].astype(np.float64)
        if met == "voraz": s = int(q.argmax())
        else:
            q = q ** (1 / T); q /= q.sum()
            if k: top = np.argsort(-q)[:k]; m = np.zeros(V); m[top] = q[top]; q = m / m.sum()
            if p < 1:
                o = np.argsort(-q); c = np.cumsum(q[o]); keep = o[:int((c < p).sum()) + 1]; m = np.zeros(V); m[keep] = q[keep]; q = m / m.sum()
            s = int(rng.choice(V, p=q))
        lp += math.log(P[h, s]); out.append(s); h = s
        if s == 1: break
    return out, lp
print(f"\n{'estrategia':22}{'palabras':>9}{'log P/pal.':>11}{'distintas-1':>12}{'distintas-2':>12}")
for nombre, kw in (("voraz", dict(met="voraz")), ("muestreo T = 0,5", dict(met="m", T=0.5)), ("muestreo T = 1,0", dict(met="m", T=1.0)), ("muestreo T = 1,5", dict(met="m", T=1.5)), ("top-k (k = 10)", dict(met="m", k=10)), ("top-p (p = 0,9)", dict(met="m", p=0.9))):
    rng = np.random.default_rng(5); gen = [genera(rng=rng, **kw) for _ in range(300)]; toks = [t for s, _ in gen for t in s]; bis = [(a, b2) for s, _ in gen for a, b2 in zip(s, s[1:])]
    print(f"{nombre:22}{np.mean([len(s) for s, _ in gen]):9.1f}{sum(l for _, l in gen) / len(toks):11.2f}{len(set(toks)) / len(toks):12.3f}{len(set(bis)) / max(1, len(bis)):12.3f}")
