# Un HMM bigrama para etiquetar, con estados <s> y </s>, y el algoritmo de Viterbi paso a paso.
# Implementación propia (sin bibliotecas) sobre CESS-ESP con etiquetas gruesas. Requiere nltk.download("cess_esp") solo para el programa principal.
import math, re
from collections import Counter, defaultdict


def coarse(t):
    if t[0] == "n": return "PROPN" if t.startswith("np") else "NOUN"
    if t[0] == "v": return "AUX" if t.startswith("va") else "VERB"
    return {"a": "ADJ", "r": "ADV", "d": "DET", "p": "PRON", "s": "ADP", "c": "CONJ", "z": "NUM", "Z": "NUM",
            "F": "PUNCT", "W": "DATE", "i": "INTJ", "I": "INTJ"}.get(t[0], "X")


class HMM:
    def __init__(self, sents, k=0.0, unk="hapax"):
        """sents: lista de oraciones [(palabra, etiqueta), …] ya en minúsculas. k: suavizado add-k (0 = máxima verosimilitud)."""
        self.k, self.unk = k, unk
        cw = Counter(w for s in sents for w, _ in s)
        self.cw = cw
        self.tags = sorted({t for s in sents for _, t in s})
        self.init, self.fin = Counter(), Counter()
        self.trans, self.emis, self.tc = defaultdict(Counter), defaultdict(Counter), Counter()
        self.vocab = set()
        for s in sents:
            prev = None
            for w, t in s:
                w = "<UNK>" if unk == "hapax" and cw[w] == 1 else w
                self.vocab.add(w); self.tc[t] += 1; self.emis[t][w] += 1
                if prev is None: self.init[t] += 1
                else: self.trans[prev][t] += 1
                prev = t
            self.fin[prev] += 1
        self.T, self.V, self.nS = len(self.tags), len(self.vocab), len(sents)

    # probabilidades (en logaritmos; log 0 = −∞)
    @staticmethod
    def _log(num, den):
        return math.log(num / den) if num > 0 else -math.inf

    def l_init(self, t): return self._log(self.init[t] + self.k, self.nS + self.k * self.T)
    def l_trans(self, a, b): return self._log(self.trans[a][b] + self.k, self.tc[a] + self.k * (self.T + 1))
    def l_fin(self, a): return self._log(self.fin[a] + self.k, self.tc[a] + self.k * (self.T + 1))

    def simbolo(self, w):
        if w in self.vocab and not (self.unk == "hapax" and self.cw[w] == 1): return w
        return "<UNK>" if self.unk == "hapax" else w

    def l_emis(self, t, w): return self._log(self.emis[t][w] + self.k, self.tc[t] + self.k * self.V)

    def viterbi(self, palabras):
        sym = [self.simbolo(w) for w in palabras]
        n, tags = len(sym), self.tags
        M = [{t: self.l_init(t) + self.l_emis(t, sym[0]) for t in tags}]
        B = [{}]
        for i in range(1, n):
            col, bp = {}, {}
            for t in tags:
                mejor, arg = -math.inf, None
                for p in tags:
                    v = M[i - 1][p] + self.l_trans(p, t)
                    if v > mejor: mejor, arg = v, p
                col[t] = mejor + self.l_emis(t, sym[i]); bp[t] = arg
            M.append(col); B.append(bp)
        mejor, fin = -math.inf, None
        for t in tags:
            v = M[-1][t] + self.l_fin(t)
            if v > mejor: mejor, fin = v, t
        if fin is None: return None, -math.inf, M
        ruta = [fin]
        for i in range(n - 1, 0, -1): ruta.append(B[i][ruta[-1]])
        return ruta[::-1], mejor, M


def evaluar(modelo, test):
    ok = n = okk = nk = oku = nu = 0
    for s in test:
        ruta, _, _ = modelo.viterbi([w for w, _ in s])
        ruta = ruta or [modelo.tags[0]] * len(s)
        for (w, g), p in zip(s, ruta):
            conocida = w in modelo.cw
            n += 1; ok += g == p
            if conocida: nk += 1; okk += g == p
            else: nu += 1; oku += g == p
    return ok / n, okk / max(nk, 1), oku / max(nu, 1), nu


if __name__ == "__main__":
    from nltk.corpus import cess_esp
    sents = [[(w.lower(), coarse(t)) for w, t in x if "." not in t and not re.fullmatch(r"\*.*\*", w)] for x in cess_esp.tagged_sents()]
    sents = [s for s in sents if s]
    n = int(0.9 * len(sents)); train, test = sents[:n], sents[n:]
    print(f"entrenamiento: {len(train)} oraciones; prueba: {len(test)}")
    for k in (0, 1, 0.1):
        m = HMM(train, k=k)
        acc, ak, au, nu = evaluar(m, test)
        print(f"HMM k={k:<4} exactitud {100*acc:5.1f} %  (palabras conocidas {100*ak:5.1f} %, desconocidas {100*au:5.1f} % de {nu})")
    m = HMM(train, k=0.1)
    print()
    for frase in ["bebo un vaso de vino tinto", "vino de un lugar lejano", "el gobierno anunció una nueva medida"]:
        ruta, lp, M = m.viterbi(frase.split())
        print(" ".join(f"{w}/{t}" for w, t in zip(frase.split(), ruta)), f"  (log P = {lp:.1f})")
    print("\nprobabilidad de transición DET→NOUN:", round(math.exp(m.l_trans("DET", "NOUN")), 3), "| ADP→NOUN:", round(math.exp(m.l_trans("ADP", "NOUN")), 3))
    print("emisión P(vino|NOUN):", f"{math.exp(m.l_emis('NOUN', 'vino')):.5f}", "| P(vino|VERB):", f"{math.exp(m.l_emis('VERB', 'vino')):.5f}")
    print("inicio de oración P(<s>→VERB):", round(math.exp(m.l_init("VERB")), 3), "| P(<s>→NOUN):", round(math.exp(m.l_init("NOUN")), 3))
