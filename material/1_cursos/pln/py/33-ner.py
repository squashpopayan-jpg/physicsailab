# Reconocimiento de entidades nombradas (NER) con etiquetas BIO: perceptrón promediado estructurado desde cero y evaluación por entidades (estilo conlleval).
import json, os, re, time
from collections import Counter, defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.loads(re.search(r"L\.corpus\.ner = (\{.*\});", open(os.path.join(RAIZ, "src", "lib", "14-ner.js"), encoding="utf-8").read(), re.S).group(1))
TR, TE = datos["tr"], datos["te"]
TAGS = sorted({t for s in TR for _, t in s})


def forma(w):
    """Forma de la palabra: Xxxx → Xx, 2024 → d, mayúsculas → X, minúsculas → x (sin repeticiones consecutivas)."""
    out = ""
    for c in w:
        k = "X" if c.isupper() else "x" if c.islower() else "d" if c.isdigit() else c
        if not out or out[-1] != k: out += k
    return out


def rasgos(pal, i, previa):
    w = pal[i]; lw = w.lower(); n = len(pal)
    a = pal[i - 1].lower() if i > 0 else "<s>"; d = pal[i + 1].lower() if i < n - 1 else "</s>"
    return ["b", "w=" + lw, "s3=" + lw[-3:], "s2=" + lw[-2:], "p3=" + lw[:3], "f=" + forma(w), "ini=" + str(i == 0), "t-1=" + previa, "t-1w=" + previa + "|" + lw,
            "w-1=" + a, "w+1=" + d, "f-1=" + (forma(pal[i - 1]) if i > 0 else "<s>"), "f+1=" + (forma(pal[i + 1]) if i < n - 1 else "</s>"),
            "w-2=" + (pal[i - 2].lower() if i > 1 else "<s>"), "w+2=" + (pal[i + 2].lower() if i < n - 2 else "</s>")]


class Perceptron:
    def __init__(self):
        self.w = defaultdict(lambda: defaultdict(float)); self.tot = defaultdict(float); self.est = defaultdict(int); self.i = 0

    def puntos(self, rs):
        s = {t: 0 for t in TAGS}
        for f in rs:
            if f in self.w:
                for t, v in self.w[f].items(): s[t] += v
        return s

    def predice(self, rs):
        s = self.puntos(rs); mejor = TAGS[0]
        for t in TAGS:
            if s[t] > s[mejor]: mejor = t
        return mejor

    def actualiza(self, ok, mal, rs):
        self.i += 1
        if ok == mal: return
        for f in rs:
            for t, d in ((ok, 1.0), (mal, -1.0)):
                k = (f, t); self.tot[k] += (self.i - self.est[k]) * self.w[f][t]; self.est[k] = self.i; self.w[f][t] += d

    def promedia(self):
        for f in list(self.w):
            for t in list(self.w[f]):
                k = (f, t); tot = self.tot[k] + (self.i - self.est[k]) * self.w[f][t]; self.w[f][t] = tot / self.i


def entrena(sents, epocas=5):
    m = Perceptron()
    for _ in range(epocas):
        for s in sents:
            pal = [w for w, _ in s]; prev = "<s>"
            for i, (w, t) in enumerate(s):
                rs = rasgos(pal, i, prev); g = m.predice(rs); m.actualiza(t, g, rs); prev = g
    m.promedia(); return m


def etiqueta(m, pal):
    prev, out = "<s>", []
    for i in range(len(pal)):
        prev = m.predice(rasgos(pal, i, prev)); out.append(prev)
    return out


def entidades(tags):
    """Conjunto de entidades (tipo, inicio, fin) de una secuencia BIO: una I- sin B- previa del mismo tipo abre una entidad (como conlleval)."""
    out, ini, tipo = set(), None, None
    for i, t in enumerate(list(tags) + ["O"]):
        p, tp = (t.split("-", 1) + [""])[:2] if t != "O" else ("O", "")
        if tipo is not None and (p in ("O", "B") or tp != tipo): out.add((tipo, ini, i)); tipo = None
        if p == "B" or (p == "I" and tipo is None): ini, tipo = i, tp
    return out


def evalua(oro, pred):
    ok, np_, ng = Counter(), Counter(), Counter()
    for g, p in zip(oro, pred):
        G, P = entidades(g), entidades(p)
        for e in G: ng[e[0]] += 1
        for e in P: np_[e[0]] += 1
        for e in G & P: ok[e[0]] += 1
    def prf(a, b, c): p = a / b if b else 0.0; r = a / c if c else 0.0; return p, r, 2 * p * r / (p + r) if p + r else 0.0
    res = {t: prf(ok[t], np_[t], ng[t]) for t in sorted(ng)}; res["TOTAL"] = prf(sum(ok.values()), sum(np_.values()), sum(ng.values())); return res


if __name__ == "__main__":
    print(f"entrenamiento: {len(TR)} oraciones, {sum(len(s) for s in TR)} palabras, {sum(len(entidades([t for _, t in s])) for s in TR)} entidades; prueba: {len(TE)} oraciones, {sum(len(entidades([t for _, t in s])) for s in TE)} entidades")
    print("etiquetas:", ", ".join(f"{t} {c}" for t, c in Counter(t for s in TR for _, t in s).most_common()))
    # Línea de base: a cada palabra, su etiqueta más frecuente en el entrenamiento
    freq = defaultdict(Counter)
    for s in TR:
        for w, t in s: freq[w][t] += 1
    base = [[freq[w].most_common(1)[0][0] if w in freq else "O" for w, _ in s] for s in TE]
    b = evalua([[t for _, t in s] for s in TE], base)["TOTAL"]
    print(f"\nlínea de base (etiqueta más frecuente de cada palabra): P {b[0]:.3f}  R {b[1]:.3f}  F1 {b[2]:.3f}")
    t0 = time.time(); m = entrena(TR); pred = [etiqueta(m, [w for w, _ in s]) for s in TE]; res = evalua([[t for _, t in s] for s in TE], pred)
    print(f"perceptrón promediado (5 épocas, {time.time() - t0:.0f} s):")
    print(f"   {'tipo':8}{'P':>7}{'R':>7}{'F1':>7}")
    for t, (p, r, f) in res.items(): print(f"   {t:8}{p:7.3f}{r:7.3f}{f:7.3f}")
    acc = sum(a == g for s, p in zip(TE, pred) for (_, g), a in zip(s, p)) / sum(len(s) for s in TE)
    print(f"exactitud por etiqueta: {acc:.3f} (engañosa: el {Counter(t for s in TE for _, t in s)['O'] / sum(len(s) for s in TE):.1%} de las palabras son «O»)")
    # Qué pesa más: rasgos de mayor peso para B-PER y para B-ORG
    for tg in ("B-PER", "B-ORG"):
        top = sorted(((v[tg], f) for f, v in m.w.items() if tg in v), reverse=True)[:6]
        print(f"rasgos con más peso para {tg}:", ", ".join(f"{f} ({v:.1f})" for v, f in top))
    # Errores típicos
    errores = Counter()
    for g, p in zip([[t for _, t in s] for s in TE], pred):
        G, P = entidades(g), entidades(p)
        for e in G - P:
            fal = [q for q in P if q[1] < e[2] and e[1] < q[2]]
            errores["fallo de tipo" if any(q[0] != e[0] and q[1:] == e[1:] for q in fal) else "fronteras distintas" if fal else "entidad no detectada"] += 1
    print("entidades de referencia no acertadas:", dict(errores))
