"""Genera src/lib/85-ref.js: valores de referencia calculados con implementaciones independientes
(NLTK, scikit-learn, SciPy, Gensim, NumPy...) para validar el núcleo en JavaScript (src/lib).

Uso: python tests/referencias.py
Cada capítulo añade su bloque en una función ref_NN(R, D); las claves de R deben ser únicas.
"""
import json, math, os, re, sys, warnings
warnings.filterwarnings("ignore")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R, D, V = {}, {}, {}


def corpus():
    js = open(os.path.join(ROOT, "src", "lib", "05-corpus.js"), encoding="utf-8").read()
    arr = re.search(r"const es = \[(.*?)\n  \];", js, re.S).group(1)
    return [s.replace("\\'", "'") for s in re.findall(r"'((?:[^'\\]|\\.)*)'", arr)]


CORPUS = corpus()
TEXTO = " ".join(CORPUS)


def ver(name):
    try:
        m = __import__(name)
        V[name] = getattr(m, "__version__", "?")
    except Exception:
        V[name] = "no instalado"


for n in ("numpy", "scipy", "nltk", "sklearn", "gensim", "sacrebleu", "rapidfuzz"):
    ver(n)


# ---------------------------------------------------------------- cap. 1 · ambigüedad
def ref_01():
    import nltk
    g = nltk.CFG.fromstring("""
    S -> SV
    SV -> V SN | SV SP
    SN -> SN SP | N
    SP -> P SN
    V -> 'V'
    N -> 'N'
    P -> 'P'
    """)
    parser = nltk.ChartParser(g)
    for n in range(0, 7):
        toks = ["V", "N"] + ["P", "N"] * n
        R[f"cat_trees_{n}"] = sum(1 for _ in parser.parse(toks))


# ---------------------------------------------------------------- cap. 2 · Markov y Shannon
def norm_chars(t):
    t = re.sub(r"[^a-záéíóúüñ]+", " ", t.lower())
    return t.strip(" ")


def cond_entropy(t, k):
    s = norm_chars(t)
    from collections import Counter, defaultdict
    ctx = defaultdict(Counter)
    for i in range(k, len(s)):
        ctx[s[i - k:i]][s[i]] += 1
    n = sum(sum(c.values()) for c in ctx.values())
    h = 0.0
    for c in ctx.values():
        tot = sum(c.values())
        for v in c.values():
            h -= (v / n) * math.log2(v / tot)
    return h


def ref_02():
    for k in range(0, 6):
        R[f"markov_h{k}"] = cond_entropy(TEXTO, k)
    R["markov_len"] = len(norm_chars(TEXTO))


# ---------------------------------------------------------------- cap. 3 · preparar el texto
def opiniones():
    import csv
    with open(os.path.join(ROOT, "data", "opiniones.csv"), encoding="utf-8-sig", newline="") as f:
        txt = f.read().replace("\r\r\n", "\n").replace("\r\n", "\n")
    return list(csv.DictReader([l for l in txt.split("\n") if l.strip()]))


def chk(s):
    return sum(ord(c) * (i + 1) for i, c in enumerate(s)) % 1000000007


def ref_03():
    import html as _html, unicodedata
    from collections import Counter
    import numpy as np

    def limpiar(texto, quitar_puntuacion=False):  # Lab 01 (Colab)
        texto = _html.unescape(str(texto))
        texto = re.sub(r'<[^>]+>', ' ', texto)
        texto = re.sub(r'https?://\S+|www\.\S+', ' URL ', texto)
        texto = texto.lower()
        if quitar_puntuacion:
            texto = re.sub(r'[^\w\sáéíóúüñ]', ' ', texto, flags=re.UNICODE)
        return re.sub(r'\s+', ' ', texto).strip()
    muestras = ['<p>¡NO me gustó!</p>', 'Visita https://ejemplo.org ahora', '¡Está BIEN! 😊', 'Tom &amp; Jerry &lt;3  www.sitio.com/x?y=1']
    D["limp_muestras"] = muestras
    R["limp_chk"] = [chk(limpiar(m)) for m in muestras]
    R["limp_chk_p"] = [chk(limpiar(m, True)) for m in muestras]
    ops = opiniones()
    texto = "\n".join(r["texto"] for r in ops)
    STOP = set(('a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era eran es esa esas ese esos esta estas este esto estos fue fueron ha hay hasta la las le les lo los mas me mi mis muy no nos o para pero por porque que quien quienes se ser si sin sobre su sus te tiene todo todos tu tus un una unas uno unos y ya yo').split())

    def analizar(t, minimo=3, excluir=True):  # laboratorio_pln.py del curso
        t = t.lower()
        t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
        todos = []
        act = []
        for c in t:
            if unicodedata.category(c).startswith('L'):
                act.append(c)
            elif act:
                todos.append(''.join(act)); act = []
        if act: todos.append(''.join(act))
        filt = [p for p in todos if len(p) >= minimo and (not excluir or p.lower() not in STOP)]
        fr = Counter(filt)
        rk = sorted(fr.items(), key=lambda x: (-x[1], x[0]))
        return len(todos), len(filt), len(fr), len(todos) - len(filt), rk[:10]
    for nom, args in (("a", dict()), ("b", dict(excluir=False)), ("c", dict(minimo=5))):
        r = analizar(texto, **args)
        R[f"ana_{nom}"] = list(r[:4])
        R[f"ana_{nom}_top"] = [r[4][0][1], r[4][1][1], r[4][2][1]]
    tok = re.findall(r"[^\W\d_]+", texto.lower())
    c = Counter(tok)
    fr = sorted(c.values(), reverse=True)
    x = np.log10(np.arange(1, len(fr) + 1)); y = np.log10(fr)
    b, a = np.polyfit(x, y, 1)
    R["zipf_op"] = [float(b), float(a), len(fr), len(tok), float(np.corrcoef(x, y)[0, 1] ** 2)]
    tok2 = re.findall(r"[^\W\d_]+", TEXTO.lower())
    c2 = Counter(tok2); fr2 = sorted(c2.values(), reverse=True)
    x2 = np.log10(np.arange(1, len(fr2) + 1)); y2 = np.log10(fr2)
    b2, a2 = np.polyfit(x2, y2, 1)
    R["zipf_es"] = [float(b2), float(a2), len(fr2), len(tok2), float(np.corrcoef(x2, y2)[0, 1] ** 2)]


# ---------------------------------------------------------------- cap. 4 · morfología
def cargar_py(nombre):
    import importlib.util
    spec = importlib.util.spec_from_file_location("mod_" + re.sub(r"\W", "_", nombre), os.path.join(ROOT, "py", nombre + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VERBOS = ['cantar', 'hablar', 'estudiar', 'caminar', 'comprar', 'trabajar', 'mirar', 'escuchar', 'procesar', 'etiquetar', 'aprender', 'comer', 'beber', 'correr', 'vender', 'comprender', 'escribir', 'vivir', 'subir', 'partir', 'decidir', 'recibir', 'abrir']
CONS = ['lugar', 'ciudad', 'nuez', 'lápiz', 'canción', 'razón', 'autobús', 'color', 'pan', 'mujer', 'azul', 'fácil']


def ref_04():
    m = cargar_py("04-morfologia")
    tot = 0
    for v in VERBOS:
        pares = sorted({f"{s}|{l}" for s, l in m.formas_verbo(v)})
        R[f"morf_v_{v}"] = [chk("\n".join(pares)), len(pares), len({p.split('|')[0] for p in pares})]
        tot += len(pares)
    R["morf_total"] = tot
    R["morf_plurales"] = {c: m.plural(c) for c in CONS}


# ---------------------------------------------------------------- cap. 5 · autómatas
REGEX5 = [("ba+!", "ba!"), ("(a|b)*abb", "ab"), ("a*b*", "ab"), ("(ab|ba)+", "ab"), ("(a|b)*a(a|b)(a|b)", "ab"), ("a?b+(ab)*", "ab"), ("(a|b)*(aa|bb)(a|b)*", "ab")]


def ref_05():
    import itertools
    for i, (rx, alf) in enumerate(REGEX5):
        pat = re.compile(rx)
        n = 0
        for ln in range(0, 8):
            for t in itertools.product(alf, repeat=ln):
                if pat.fullmatch("".join(t)):
                    n += 1
        R[f"fsa_count_{i}"] = n


# ---------------------------------------------------------------- cap. 6 · transductores
def ref_06():
    m = cargar_py("06-transductores")
    entradas = ["lugar^s#", "padre^s#", "nuez^s#", "canción^s#", "lápiz^s#", "autobús^s#", "gat^as#", "cant^ábamos#", "mujer^s#", "azul^s#",
                "café^s#", "ciudad^s#", "razón^s#", "pan^s#", "color^s#", "proces^ó#", "cantar^é#", "vez^s#", "luz^es#", "luz^s#", "jardín^s#",
                "cant^s#", "z^e#", "zz^e#", "ón^e#", "ás^e#", "ón^s#", "a^s#", "r^s^s#", "casa#", "aló^e#", "nuez^e#", "paz^ec#", "x^as#", "pez^s#", "lunes#"]
    D["fst_entradas"] = entradas
    sal = []
    for e in entradas:
        cur = {e}
        for _, t in m.CASCADA:
            nxt = set()
            for s in cur:
                nxt |= set(t.aplicar(s))
            cur = nxt
        sal.append("|".join(sorted(cur)))
    R["fst_chk"] = [chk(s) for s in sal]
    R["fst_nestados"] = m.inserta_e().n
    R["fst_narcos"] = len(m.inserta_e().arcos)


# ---------------------------------------------------------------- cap. 7 · tokenización y stemming
def ref_07():
    import nltk, regex
    from collections import Counter
    from nltk.corpus import cess_esp
    from nltk.stem.snowball import SnowballStemmer
    st = SnowballStemmer("spanish")
    cnt = Counter(w.lower() for w in cess_esp.words() if regex.fullmatch(r"\p{L}+", w))
    pal = sorted(w for w, c in cnt.items() if c >= 2)
    muestra = pal[::max(1, len(pal) // 2500)][:2500]
    muestra += ["cantábamos", "universidad", "universal", "universitario", "rápidamente", "estudiándolo", "diciéndoselo", "conducir", "paguen", "buscaremos", "actividades", "construcción", "continuamente", "lingüística", "Pingüino", "ley", "cayeron", "huyendo", "construyeron"]
    D["stem_words"] = muestra
    R["stem_out"] = [st.stem(w) for w in muestra]
    R["stem_n_cess"] = len(pal)
    # tokenizadores
    ops = [r["texto"] for r in opiniones()]
    mu = ["El profesor Sr. Pérez, de la U. del Cauca, pagó $1.234,50 el 08/11/2026; escribe a ana.p@uni.edu.co o visita https://ejemplo.org/x?y=1 #PLN.",
          "¿Vamos al parque? ¡Sí! Dámelo; no lo sé... 3,14159 y 2.500.000 pesos.", "Tom's well-known co-op: 'hola' (adiós) — «cita».", " ", ""]
    D["tok_muestras"] = mu + ["\n".join(ops)]
    W = "A-Za-z0-9_"   # \w de JavaScript es solo ASCII; se escribe explícito para igualar la semántica
    pat = regex.compile(rf"https?://\S+|[{W}.+-]+@[{W}-]+(?:\.[{W}-]+)+|#\p{{L}}[\p{{L}}\p{{N}}_]*|[0-9]+(?:[.,][0-9]+)*|\p{{L}}+(?:[-']\p{{L}}+)*|[^\s\p{{L}}\p{{N}}]")
    res = []
    for t in D["tok_muestras"]:
        comp = pat.findall(t)
        contr = len(comp) + sum(1 for x in comp if x.lower() in ("del", "al"))
        res.append([len(t.split()), len(regex.findall(r"\p{L}+", t)), len(comp), contr])
    R["tok_counts"] = res


# ---------------------------------------------------------------- cap. 8 · distancia de edición
def ref_08():
    import random
    from rapidfuzz.distance import Levenshtein as Lev, OSA
    from nltk.corpus import cess_esp
    from collections import Counter
    import regex
    c = Counter(w.lower() for w in cess_esp.words() if regex.fullmatch(r"[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+", w))
    total = sum(c.values())
    top = c.most_common(6000)
    freq = dict(top)
    palabras = [w for w, _ in top]
    rnd = random.Random(8)
    pares = [[rnd.choice(palabras[:3000]), rnd.choice(palabras[:3000])] for _ in range(300)]
    pares += [["intención", "ejecución"], ["casa", "caza"], ["hola", "hoal"], ["", "abc"], ["abc", ""], ["ñandú", "nandu"]]
    D["edit_pares"] = pares
    R["edit_lev1"] = [Lev.distance(a, b) for a, b in pares]
    R["edit_lev2"] = [Lev.distance(a, b, weights=(1, 1, 2)) for a, b in pares]
    R["edit_osa"] = [OSA.distance(a, b) for a, b in pares]
    ALF = "abcdefghijklmnñopqrstuvwxyzáéíóúü"

    def edits1(w):
        out = set()
        for i in range(len(w) + 1):
            l, r = w[:i], w[i:]
            if r: out.add(l + r[1:])
            if len(r) > 1: out.add(l + r[1] + r[0] + r[2:])
            if r:
                for ch in ALF: out.add(l + ch + r[1:])
            for ch in ALF: out.add(l + ch + r)
        return out

    def corregir(w, lam=0.01):
        w = w.lower(); cands = []
        if w in freq: cands.append((w, 0))
        e1 = edits1(w)
        cands += [(x, 1) for x in e1 if x in freq and x != w]
        if not any(d <= 1 for _, d in cands):
            e2 = {y for x in e1 for y in edits1(x)}
            cands += [(x, 2) for x in e2 if x in freq and x != w and x not in e1]
        sc = [(math.log(freq[x] / total) + d * math.log(lam), x, d) for x, d in cands]
        sc.sort(key=lambda t: (-t[0], t[1]))
        return sc
    mal = []
    for _ in range(60):
        w = rnd.choice(palabras[:2500])
        if len(w) < 4: continue
        t = rnd.choice("dtis")
        i = rnd.randrange(1, len(w) - 1)
        if t == "d": x = w[:i] + w[i + 1:]
        elif t == "t": x = w[:i] + w[i + 1] + w[i] + w[i + 2:]
        elif t == "i": x = w[:i] + rnd.choice(ALF) + w[i:]
        else: x = w[:i] + rnd.choice(ALF) + w[i + 1:]
        mal.append(x)
    mal += ["pais", "ladrilo", "cassa", "nesesario", "sistma", "ejemlpo", "rapidamenet"]
    D["edit_mal"] = mal
    top1 = []
    for x in mal:
        sc = corregir(x)
        top1.append(sc[0][1] if sc else "")
    R["edit_top1"] = top1
    R["edit_ed1"] = {w: len(edits1(w)) for w in ["hola", "algo", "casa", "ñandú", "a", "sistema", "abcdefghij"]}
    R["edit_vocab"] = [total, len(c)]


# ---------------------------------------------------------------- cap. 9–11 · etiquetado
def cess_js():
    js = open(os.path.join(ROOT, "src", "lib", "08-cess.js"), encoding="utf-8").read()
    return json.loads(re.search(r"L\.corpus\.cess = (\[.*\]);\n", js, re.S).group(1))


def ref_11():
    import itertools
    from collections import Counter
    m11 = cargar_py("11-hmm")
    sents = cess_js()
    tr, te = sents[:240], sents[240:]
    for gruesa in (True, False):
        prep = lambda S: [[(w.lower(), m11.coarse(t) if gruesa else t) for w, t in s] for s in S]
        ptr, pte = prep(tr), prep(te)
        # línea de base
        por = {}
        glob = Counter()
        for s in ptr:
            for w, t in s:
                por.setdefault(w, Counter())[t] += 1
                glob[t] += 1
        mejor = lambda c: sorted(c.items(), key=lambda x: (-x[1], x[0]))[0][0]
        dflt = mejor(glob)
        tabla = {w: mejor(c) for w, c in por.items()}
        pred = [[tabla.get(w, dflt) for w, _ in s] for s in pte]
        R[f"tag_base_{int(gruesa)}"] = [sum(p == g for ps, s in zip(pred, pte) for p, (_, g) in zip(ps, s)), sum(len(s) for s in pte), chk(" ".join(x for ps in pred for x in ps))]
        for k in (0, 1, 0.1):
            for unk in ("hapax", "ninguno"):
                m = m11.HMM(ptr, k=k, unk=unk)
                preds = []
                for s in pte:
                    ruta, _, _ = m.viterbi([w for w, _ in s])
                    preds.append(ruta or [m.tags[0]] * len(s))
                ok = sum(p == g for ps, s in zip(preds, pte) for p, (_, g) in zip(ps, s))
                R[f"tag_hmm_{int(gruesa)}_{k}_{unk}"] = [ok, chk(" ".join(x for ps in preds for x in ps)), m.T, m.V]
    # Viterbi frente a fuerza bruta (modelo pequeño, sin palabras desconocidas)
    ptr = [[(w.lower(), m11.coarse(t)) for w, t in s] for s in tr[:12]]
    m = m11.HMM(ptr, k=0.5, unk="ninguno")
    frases = [[w for w, _ in s][:5] for s in ptr[:8]] + [[w for w, _ in s][2:7] for s in ptr[4:10]]
    D["hmm_bf"] = frases
    D["hmm_bf_train"] = len(ptr)
    lps = []
    for fr in frases:
        best = -math.inf
        for ruta in itertools.product(m.tags, repeat=len(fr)):
            lp = m.l_init(ruta[0]) + m.l_emis(ruta[0], fr[0])
            for i in range(1, len(fr)):
                lp += m.l_trans(ruta[i - 1], ruta[i]) + m.l_emis(ruta[i], fr[i])
            lp += m.l_fin(ruta[-1])
            best = max(best, lp)
        lps.append(best)
    R["hmm_bf_logp"] = lps
    R["hmm_bf_T"] = m.T


def ref_10():
    from collections import Counter, defaultdict
    m11 = cargar_py("11-hmm")
    sents = cess_js()
    tr, te = sents[:240], sents[240:]
    for gruesa in (True, False):
        prep = lambda S: [[(w.lower(), m11.coarse(t) if gruesa else t) for w, t in s] for s in S]
        ptr, pte = prep(tr), prep(te)
        cw = Counter(w for s in ptr for w, _ in s)
        glob, uni, bi, suf = Counter(), defaultdict(Counter), defaultdict(Counter), defaultdict(Counter)
        for s in ptr:
            prev = "<s>"
            for w, t in s:
                glob[t] += 1; uni[w][t] += 1; bi[prev + "|" + w][t] += 1
                if cw[w] <= 2:
                    for n in (3, 2, 1):
                        if len(w) >= n: suf[(n, w[-n:])][t] += 1
                prev = t
        best = lambda c: sorted(c.items(), key=lambda x: (-x[1], x[0]))[0][0]
        dflt = best(glob)
        U = {k: best(v) for k, v in uni.items()}; B = {k: best(v) for k, v in bi.items()}; SF = {k: best(v) for k, v in suf.items()}
        for usa_bi in (False, True):
            for usa_suf in (False, True):
                preds = []
                for s in pte:
                    prev, out = "<s>", []
                    for w, _ in s:
                        if usa_bi and prev + "|" + w in B: t = B[prev + "|" + w]
                        elif w in U: t = U[w]
                        else:
                            t = None
                            if usa_suf:
                                for n in (3, 2, 1):
                                    if len(w) >= n and (n, w[-n:]) in SF: t = SF[(n, w[-n:])]; break
                            t = t or dflt
                        out.append(t); prev = t
                    preds.append(out)
                ok = sum(p == g for ps, s in zip(preds, pte) for p, (_, g) in zip(ps, s))
                R[f"cad_{int(gruesa)}_{int(usa_bi)}_{int(usa_suf)}"] = [ok, chk(" ".join(x for ps in preds for x in ps))]


def ref_12():
    from collections import defaultdict
    m11 = cargar_py("11-hmm")
    sents = cess_js()
    tr, te = sents[:240], sents[240:]

    def rasgos(ws, i, p1, p2):
        w0 = ws[i]; w = w0.lower()
        ant = ws[i - 1].lower() if i > 0 else "<s>"
        sig = ws[i + 1].lower() if i + 1 < len(ws) else "</s>"
        f = ["b", "w=" + w, "s3=" + w[-3:], "s2=" + w[-2:], "p1=" + p1, "p1w=" + p1 + "|" + w, "p21=" + p2 + "|" + p1, "pw=" + ant, "nw=" + sig]
        if re.match(r"[A-ZÁÉÍÓÚÑ]", w0) and i > 0: f.append("cap")
        if re.search(r"[0-9]", w0): f.append("dig")
        return f

    def entrena(S, epochs):
        tags = sorted({t for s in S for _, t in s})
        W = defaultdict(lambda: defaultdict(float)); tot = {}; ts = {}; it = 0
        def score(fs, pesos):
            sc = {t: 0.0 for t in tags}
            for f in fs:
                if f in pesos:
                    for t, v in pesos[f].items(): sc[t] += v
            return sc
        def mejor(sc):
            b, bv = None, -math.inf
            for t in tags:
                if sc[t] > bv: bv, b = sc[t], t
            return b
        for _ in range(epochs):
            for s in S:
                ws = [w for w, _ in s]; p1 = p2 = "<s>"
                for i, (_, gold) in enumerate(s):
                    fs = rasgos(ws, i, p1, p2)
                    guess = mejor(score(fs, W)); it += 1
                    if guess != gold:
                        for f in fs:
                            for t, d in ((gold, 1), (guess, -1)):
                                k = (f, t); tot[k] = tot.get(k, 0) + (it - ts.get(k, 0)) * W[f][t]; ts[k] = it; W[f][t] += d
                    p2, p1 = p1, guess
        A = {}
        for f, m in W.items():
            nm = {}
            for t, v in m.items():
                k = (f, t); a = (tot.get(k, 0) + (it - ts.get(k, 0)) * v) / it
                if a != 0: nm[t] = a
            if nm: A[f] = nm
        def predice(ws):
            p1 = p2 = "<s>"; out = []
            for i in range(len(ws)):
                t = mejor(score(rasgos(ws, i, p1, p2), A)); out.append(t); p2, p1 = p1, t
            return out
        return predice, len(A), it

    for gruesa in (True, False):
        conv = (lambda S: [[(w, m11.coarse(t)) for w, t in s] for s in S]) if gruesa else (lambda S: [[(w, t) for w, t in s] for s in S])
        for ep in (1, 5):
            pred, nr, it = entrena(conv(tr), ep)
            pte = conv(te)
            preds = [pred([w for w, _ in s]) for s in pte]
            ok = sum(p == g for ps, s in zip(preds, pte) for p, (_, g) in zip(ps, s))
            R[f"perc_{int(gruesa)}_{ep}"] = [ok, chk(" ".join(x for ps in preds for x in ps)), nr, it]


def gram_js():
    js = open(os.path.join(ROOT, "src", "lib", "71-gramaticas.js"), encoding="utf-8").read()
    g = lambda n: re.search(r"G\." + n + r" = `(.*?)`;", js, re.S).group(1)
    orac = re.search(r"G\.ORACIONES = \[(.*?)\];", js, re.S).group(1)
    return g("TEXTO"), g("TEXTO_NLR"), g("TEXTOP"), re.findall(r"'([^']*)'", orac)


def ref_14():
    import nltk
    t, tn, tp, orac = gram_js()
    extra = ["libro la niña un lee", "el niño ve un gato grande con un telescopio en el parque por la casa", "hombres y mujeres mayores y niño viejo leen"]
    frases = orac + extra
    D["cfg_frases"] = frases
    cp = nltk.ChartParser(nltk.CFG.fromstring(t))
    rd = nltk.RecursiveDescentParser(nltk.CFG.fromstring(tn))
    cn = nltk.ChartParser(nltk.CFG.fromstring(tn))
    norm = lambda tr: re.sub(r"\s+", " ", tr.pformat(margin=10**6))
    R["cfg_cuentas"] = []
    R["cfg_arboles"] = []
    for f in frases:
        w = f.split()
        arb = [norm(x) for x in cp.parse(w)]
        arb_n = list(rd.parse(w))
        R["cfg_cuentas"].append([len(arb), len(arb_n), len(list(cn.parse(w)))])
        R["cfg_arboles"].append(chk("|".join(sorted(arb))) if len(arb) <= 60 else -1)
    # PCFG: pesos normalizados
    pesos = {}
    for line in tp.strip().split("\n"):
        lhs, rhs = [x.strip() for x in line.split("->")]
        for alt in re.split(r"\|(?=(?:[^']*'[^']*')*[^']*$)", rhs):
            m = re.search(r"\[([0-9.]+)\]\s*$", alt.strip())
            pesos.setdefault(lhs, []).append((re.sub(r"\s*\[[0-9.]+\]\s*$", "", alt.strip()), float(m.group(1))))
    texto = ""
    for lhs, alts in pesos.items():
        s = sum(p for _, p in alts)
        texto += f"{lhs} -> " + " | ".join(f"{a} [{p / s!r}]" for a, p in alts) + "\n"
    pg = nltk.PCFG.fromstring(texto)
    vit = nltk.ViterbiParser(pg)
    cp2 = nltk.ChartParser(nltk.CFG.fromstring(t))
    R["pcfg_best"] = []
    R["pcfg_sum"] = []
    for f in frases:
        w = f.split()
        try:
            best = list(vit.parse(w))
        except ValueError:
            best = []
        tot, mx = 0.0, 0.0
        for tr in cp2.parse(w):
            p = 1.0
            for pr in tr.productions():
                p *= next(q.prob() for q in pg.productions(lhs=pr.lhs()) if q.rhs() == pr.rhs())
            tot += p; mx = max(mx, p)
        R["pcfg_best"].append(math.log(mx) if mx > 0 else None)          # máximo sobre todos los árboles
        R["pcfg_sum"].append(math.log(tot) if tot > 0 else None)
        R.setdefault("pcfg_vit_nltk", []).append(math.log(best[0].prob()) if best else None)


def ref_15():
    from nltk.featstruct import FeatStruct
    from nltk.sem.logic import Variable
    pares = [
        [{"gen": "f", "num": "s"}, {"gen": "f", "num": "s"}], [{"gen": "f", "num": "s"}, {"gen": "m", "num": "s"}], [{"gen": "f"}, {"num": "p"}],
        [{"agr": {"gen": "f", "num": "s"}}, {"agr": {"num": "s", "per": "3"}}], [{"agr": {"gen": "f", "num": "s"}}, {"agr": {"num": "p"}}],
        [{"cat": "N", "agr": {"num": "?n", "gen": "f"}}, {"agr": {"num": "s"}}], [{"a": "?x", "b": "?x"}, {"a": 1}], [{"a": "?x", "b": "?x"}, {"a": 1, "b": 2}],
        [{"a": "?x", "b": "?y"}, {"a": 1, "b": 2}], [{"a": {"b": {"c": 1}}}, {"a": {"b": {"d": 2}}}], [{"a": {"b": {"c": 1}}}, {"a": {"b": {"c": 2}}}],
        [{"a": 1}, {"a": {"b": 1}}], [{}, {"x": 1}], [{"p": "?v", "q": "?v"}, {"p": "?w", "q": "s"}], [{"num": "s", "per": "1"}, {"num": "s", "per": "3"}],
        [{"agr": {"num": "?n"}, "subj": {"agr": {"num": "?n"}}}, {"agr": {"num": "p"}, "subj": {"agr": {"num": "p"}}}],
        [{"agr": {"num": "?n"}, "subj": {"agr": {"num": "?n"}}}, {"agr": {"num": "s"}, "subj": {"agr": {"num": "p"}}}],
        [{"a": 1, "b": {"c": "?z"}}, {"b": {"c": 5}, "d": 4}]]
    D["unif_pares"] = pares

    def fs(d):
        if isinstance(d, dict): return FeatStruct({k: fs(v) for k, v in d.items()})
        if isinstance(d, str) and d.startswith("?"): return Variable(d)
        return d

    def aDict(x):
        if isinstance(x, FeatStruct) or isinstance(x, dict): return {k: aDict(x[k]) for k in sorted(x.keys())}
        if isinstance(x, Variable): return "?"
        return x
    salida = []
    for a, b in pares:
        r = fs(a).unify(fs(b))
        salida.append(None if r is None else json.dumps(aDict(r), sort_keys=True, separators=(",", ":")))
    R["unif_out"] = salida


def ref_16():
    import random, networkx as nx
    rnd = random.Random(16)

    def es_arbol(h):
        n = len(h)
        for i in range(1, n + 1):
            k, c = i, 0
            while k != 0 and c <= n:
                k = h[k - 1]; c += 1
            if k != 0: return False
        return sum(1 for x in h if x == 0) == 1

    def proy(h):
        arcos = [(min(x, i + 1), max(x, i + 1)) for i, x in enumerate(h)]
        for a in range(len(arcos)):
            for b in range(a + 1, len(arcos)):
                l1, r1 = arcos[a]; l2, r2 = arcos[b]
                if (l1 < l2 < r1 < r2) or (l2 < l1 < r2 < r1): return False
        return True

    def oraculo(h):
        n = len(h); pila = [0]; buf = list(range(1, n + 1)); tr = []
        pend = [sum(1 for x in h if x == 0)] + [sum(1 for x in h if x == i + 1) for i in range(n)]
        g = 0
        while (buf or len(pila) > 1) and g < 10 * n + 10:
            g += 1
            s0 = pila[-1]; s1 = pila[-2] if len(pila) > 1 else None
            if s1 is not None and s1 != 0 and h[s1 - 1] == s0: tr.append("LA"); del pila[-2]; pend[s0] -= 1
            elif s1 is not None and h[s0 - 1] == s1 and pend[s0] == 0: tr.append("RA"); pila.pop(); pend[s1] -= 1
            elif buf: tr.append("SH"); pila.append(buf.pop(0))
            else: return None
        return tr
    arboles = []
    while len(arboles) < 60:
        n = rnd.randint(3, 7)
        h = [rnd.randint(0, n) for _ in range(n)]
        if any(h[i] == i + 1 for i in range(n)) or not es_arbol(h): continue
        arboles.append(h)
    D["dep_arboles"] = arboles
    R["dep_flags"] = [[int(es_arbol(h)), int(proy(h))] for h in arboles]
    R["dep_oraculo"] = [("".join(oraculo(h) or ["?"]) if proy(h) else "NP") for h in arboles]
    # MST frente a networkx
    mats, pesos = [], []
    for _ in range(25):
        n = rnd.randint(3, 8)
        M = [[0.0] * (n + 1) for _ in range(n + 1)]
        Gx = nx.DiGraph()
        for h in range(n + 1):
            for d in range(1, n + 1):
                if h != d:
                    M[h][d] = round(rnd.uniform(-3, 5), 4); Gx.add_edge(h, d, weight=M[h][d])
        T = nx.maximum_spanning_arborescence(Gx, attr="weight")
        mats.append(M); pesos.append(sum(M[u][v] for u, v in T.edges()))
    D["dep_mats"] = mats
    R["dep_mst"] = pesos


def ref_18():
    import random, itertools
    from nltk.sem import Valuation, Model, Assignment
    from nltk.sem.logic import Expression
    import sympy as sp
    modelo = {"dominio": ["marta", "juan", "libroa", "librob", "ana"],
              "cte": {"marta": "marta", "juan": "juan", "libroa": "libroa", "librob": "librob", "ana": "ana"},
              "pred": {"estudiante": ["marta", "juan", "ana"], "libro": ["libroa", "librob"], "lee": [["marta", "libroa"], ["juan", "libroa"], ["juan", "librob"]],
                       "profesora": ["ana"], "enseña": [["ana", "marta"], ["ana", "juan"]]}}
    D["fol_modelo"] = modelo
    formulas = ["all x.(estudiante(x) -> exists y.(libro(y) & lee(x,y)))", "exists y.(libro(y) & all x.(estudiante(x) -> lee(x,y)))",
                "all x.(libro(x) -> exists y.(estudiante(y) & lee(y,x)))", "-exists x.(libro(x) & -lee(marta,x))", "lee(marta,librob) | lee(juan,librob)",
                "marta = juan", "marta = marta", "exists x.(estudiante(x) & -exists y.(libro(y) & lee(x,y)))", "all x.(profesora(x) -> exists y.enseña(x,y))",
                "all x.all y.(enseña(x,y) -> estudiante(y))", "exists x.(estudiante(x) & all y.(libro(y) -> lee(x,y)))", "all x.(estudiante(x) <-> -libro(x))",
                "all x.(lee(x,librob) -> lee(x,libroa))", "all x.(lee(x,libroa) -> lee(x,librob))", "exists x.exists y.(lee(x,y) & lee(y,x))", "-all x.estudiante(x)",
                "all x.(estudiante(x) | libro(x))", "exists x.(-estudiante(x) & -libro(x))", "all x.(enseña(ana,x) -> -profesora(x))", "exists x.(x = ana & profesora(x))",
                "all x.all y.(x = y -> (estudiante(x) <-> estudiante(y)))", "all x.(estudiante(x) -> (lee(x,libroa) & lee(x,librob)))", "-(lee(marta,libroa) & lee(marta,librob))",
                "estudiante(marta) -> estudiante(juan) -> libro(libroa)", "exists x.(libro(x) & all y.(lee(y,x) -> estudiante(y)))", "all x.(lee(x,libroa) <-> (x = marta | x = juan))"]
    D["fol_formulas"] = formulas
    dom = set(modelo["dominio"])
    val = Valuation([(k, v) for k, v in modelo["cte"].items()] + [(p, {tuple(t) if isinstance(t, list) else t for t in ts}) for p, ts in modelo["pred"].items()])
    m = Model(dom, val)
    g = Assignment(dom)
    R["fol_valores"] = [int(bool(m.satisfy(Expression.fromstring(f), g))) for f in formulas]
    # proposicional: 40 fórmulas aleatorias, número de modelos con sympy
    rnd = random.Random(18)
    A = sp.symbols("P Q R S")
    nom = ["P", "Q", "R", "S"]
    def gen(d):
        if d == 0 or rnd.random() < 0.25:
            i = rnd.randrange(4); return (nom[i], A[i], {i})
        op = rnd.choice(["not", "and", "or", "imp", "iff"])
        if op == "not":
            s, e, at = gen(d - 1); return (f"-{s}" if s[0] in "PQRS(" and len(s) <= 2 or s.startswith("(") else f"-({s})", sp.Not(e), at)
        (s1, e1, a1), (s2, e2, a2) = gen(d - 1), gen(d - 1)
        sym = {"and": "&", "or": "|", "imp": "->", "iff": "<->"}[op]
        ex = {"and": sp.And(e1, e2), "or": sp.Or(e1, e2), "imp": sp.Implies(e1, e2), "iff": sp.Equivalent(e1, e2)}[op]
        return (f"({s1} {sym} {s2})", ex, a1 | a2)
    props, cuentas = [], []
    for _ in range(40):
        s, e, at = gen(3)
        props.append(s)
        n = 0
        usados = sorted(at)
        for vals in itertools.product([False, True], repeat=len(usados)):
            if bool(e.xreplace({A[i]: v for i, v in zip(usados, vals)})): n += 1
        cuentas.append(n)
    D["prop_formulas"] = props
    R["prop_modelos"] = cuentas


def ref_19():
    import random, itertools
    rnd = random.Random(19)

    def gen(d, ex):
        if d == 0 or rnd.random() < 0.3: return ("n", rnd.choice("AB"))
        op = rnd.choice(["not", "and", "or", "some", "only"])
        if op in ("some", "only") and (op == "some" and ex[0] >= 2): op = "and"
        if op == "some": ex[0] += 1
        if op == "not": return ("not", gen(d - 1, ex))
        if op in ("and", "or"): return (op, gen(d - 1, ex), gen(d - 1, ex))
        return (op, gen(d - 1, ex))

    def txt(c):
        if c[0] == "n": return c[1]
        if c[0] == "not": return "~(" + txt(c[1]) + ")"
        if c[0] in ("and", "or"): return "(" + txt(c[1]) + (" & " if c[0] == "and" else " | ") + txt(c[2]) + ")"
        return ("some" if c[0] == "some" else "only") + " r.(" + txt(c[1]) + ")"

    def ext(c, dom, nom, R):
        if c[0] == "n": return nom[c[1]]
        if c[0] == "not": return dom - ext(c[1], dom, nom, R)
        if c[0] == "and": return ext(c[1], dom, nom, R) & ext(c[2], dom, nom, R)
        if c[0] == "or": return ext(c[1], dom, nom, R) | ext(c[2], dom, nom, R)
        s = ext(c[1], dom, nom, R)
        if c[0] == "some": return {d for d in dom if any((d, e) in R and e in s for e in dom)}
        return {d for d in dom if all((d, e) not in R or e in s for e in dom)}

    def sat(c, N=3):
        for n in range(1, N + 1):
            dom = set(range(n)); pares = [(a, b) for a in dom for b in dom]
            for mr in range(2 ** len(pares)):
                Rr = {p for i, p in enumerate(pares) if (mr >> i) & 1}
                for ma in range(2 ** n):
                    for mb in range(2 ** n):
                        nom = {"A": {d for d in dom if (ma >> d) & 1}, "B": {d for d in dom if (mb >> d) & 1}}
                        if ext(c, dom, nom, Rr): return True
        return False
    conceptos, res = [], []
    while len(conceptos) < 45:
        ex = [0]
        c = gen(3, ex)
        s = txt(c)
        if s in conceptos: continue
        conceptos.append(s); res.append(int(sat(c)))
    D["alc_conceptos"] = conceptos
    R["alc_sat"] = res
    # Pertenencias deducidas por el razonador OWL RL (owlrl) en py/19-ontologia.py
    import subprocess
    sal = subprocess.run([sys.executable, os.path.join(ROOT, "py", "19-ontologia.py")], capture_output=True, text=True, encoding="utf-8", cwd=os.path.join(ROOT, "py")).stdout
    miembros = {}
    for linea in sal.splitlines():
        m = re.match(r"^(Persona|Estudiante|Docente|Monitor)\s+\[(.*)\]$", linea)
        if m: miembros[m.group(1)] = ",".join(x.strip().strip("'") for x in m.group(2).split(",") if x.strip())
    R["onto_miembros"] = miembros


def ref_20():
    from nltk.sem.logic import Expression
    DET = {"todo": r"\P.\Q.all x.(P(x) -> Q(x))", "un": r"\P.\Q.exists x.(P(x) & Q(x))", "ningún": r"\P.\Q.-exists x.(P(x) & Q(x))"}
    N = {n: rf"\x.{n}(x)" for n in ("estudiante", "libro", "profesor", "gato")}
    NOM = {"marta": r"\P.P(marta)", "juan": r"\P.P(juan)"}
    VT = {v: rf"\Y.\x.Y(\y.{v}(x,y))" for v in ("lee", "ve")}
    VI = {"duerme": r"\x.duerme(x)"}
    exprs = []
    sujetos = [f"({DET[d]})({N[n]})" for d in DET for n in N] + [f"({NOM[m]})" for m in NOM]
    for s in sujetos:
        for v in VI: exprs.append(f"({s})({VI[v]})")
    for s in sujetos[:6] + sujetos[-2:]:
        for v in VT:
            for d in ("un", "todo"):
                obj = f"({DET[d]})({N['libro']})"
                exprs.append(f"({s})(({VT[v]})({obj}))")
    # simples
    exprs += [r"(\x.P(x))(a)", r"(\x.\y.lee(x,y))(juan)(marta)", r"(\P.all x.(P(x) -> libro(x)))(\z.estudiante(z))", r"(\x.all y.lee(x,y))(y)"]
    D["sem_exprs"] = exprs
    R["sem_nltk"] = [str(Expression.fromstring(e).simplify()) for e in exprs]

def ref_21():
    import random, regex
    from nltk.corpus import wordnet as wn
    from nltk.stem.snowball import SnowballStemmer
    js = open(os.path.join(ROOT, "src", "lib", "09-wordnet.js"), encoding="utf-8").read()
    wnd = json.loads(re.search(r"synsets: (\[.*?\]), semillas:", js, re.S).group(1))
    ids = [s["id"] for s in wnd]
    rnd = random.Random(21)
    pares = [[rnd.choice(ids), rnd.choice(ids)] for _ in range(120)]
    D["wn_pares"] = pares
    R["wn_path"] = [wn.synset(a).path_similarity(wn.synset(b)) for a, b in pares]
    R["wn_wup"] = [wn.synset(a).wup_similarity(wn.synset(b)) for a, b in pares]
    R["wn_depth"] = [[wn.synset(a).min_depth(), wn.synset(a).max_depth()] for a, _ in pares]
    # Lesk simplificado (implementación independiente)
    st = SnowballStemmer("spanish")
    STOP = set("a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era eran es esa esas ese esos esta estas este esto estos fue fueron ha hay hasta la las le les lo los mas me mi mis muy no nos o para pero por porque que quien quienes se ser si sin sobre su sus te tiene todo todos tu tus un una unas uno unos y ya yo".split())
    import unicodedata
    sin = lambda s: "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    def raices(t, obj):
        o = st.stem(obj)
        return {st.stem(w) for w in regex.findall(r"\p{L}+", t.lower()) if sin(w) not in STOP and len(w) > 2} - {o}
    wsd = json.load(open(os.path.join(ROOT, "data", "wsd.json"), encoding="utf-8"))
    # IDF de cada raíz sobre las firmas (con ejemplos) de todos los sentidos
    firmas = [raices(s["d"] + " " + " ".join(s["e"]), p) for p, ss in wsd["palabras"].items() for s in ss]
    def idf(r): return math.log(len(firmas) / max(1, sum(1 for f in firmas if r in f)))
    def lesk(ejemplos, conidf):
        out = []
        for p, g, o in wsd["pruebas"]:
            ctx = raices(o, p)
            pun = []
            for s in wsd["palabras"][p]:
                f = raices(s["d"] + (" " + " ".join(s["e"]) if ejemplos else ""), p)
                pun.append(sum(idf(r) for r in ctx & f) if conidf else len(ctx & f))
            best = 0
            for i, v in enumerate(pun):
                if v > pun[best]: best = i
            out.append([best, pun])
        return out
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.feature_extraction.text import CountVectorizer
    def lista(t, obj):
        return [st.stem(w) for w in regex.findall(r"\p{L}+", t.lower()) if sin(w) not in STOP and len(w) > 2 and st.stem(w) != st.stem(obj)]
    nbres = []
    for p, g, o in wsd["pruebas"]:
        ss = wsd["palabras"][p]
        cv = CountVectorizer(analyzer=lambda x: x)
        X = cv.fit_transform([lista(s["d"] + " " + " ".join(s["e"]), p) for s in ss])
        nb = MultinomialNB(alpha=1.0, fit_prior=False).fit(X, list(range(len(ss))))
        jll = nb.predict_joint_log_proba(cv.transform([lista(o, p)]))[0]
        nbres.append([int(jll.argmax()), [float(x) for x in jll]])
    R["bayes"] = nbres
    R["lesk"] = lesk(True, False)
    R["lesk_sin"] = lesk(False, False)
    R["lesk_idf"] = lesk(True, True)


def ref_23():
    import random
    import numpy as np
    js = open(os.path.join(ROOT, "src", "lib", "11-cooc.js"), encoding="utf-8").read()
    d = json.loads(re.search(r"L\.corpus\.cooc = (\{.*\});", js, re.S).group(1))
    F, C = d["filas"], d["cols"]
    M = np.zeros((len(F), len(C)))
    for i, r in enumerate(d["m"]):
        for c, n in r: M[i, c] = n
    tot = M.sum(); pw = M.sum(1, keepdims=True) / tot; pc = M.sum(0, keepdims=True) / tot
    with np.errstate(divide="ignore", invalid="ignore"):
        pmi = np.log2((M / tot) / (pw * pc))
    P = np.where(np.isfinite(pmi) & (pmi > 0), pmi, 0.0)
    def cos(X, a, b):
        na, nb = np.linalg.norm(X[a]), np.linalg.norm(X[b])
        return float(X[a] @ X[b] / (na * nb)) if na and nb else 0.0
    rnd = random.Random(23)
    pares = [[rnd.choice(F), rnd.choice(F)] for _ in range(120)]
    D["dist_pares"] = pares
    R["dist_ppmi"] = [cos(P, F.index(a), F.index(b)) for a, b in pares]
    R["dist_conteo"] = [cos(M, F.index(a), F.index(b)) for a, b in pares]
    palabras = ["gobierno", "presidente", "ministro", "partido", "país", "equipo", "años", "ciudad", "guerra", "empresa"]
    D["dist_palabras"] = palabras
    vec = []
    for w in palabras:
        a = F.index(w); sims = [(cos(P, a, j), j) for j in range(len(F)) if j != a]
        sims.sort(key=lambda x: (-round(x[0], 12), F[x[1]]))
        vec.append([F[j] for _, j in sims[:5]])
    R["dist_vecinos"] = vec
    R["dist_total"] = float(tot)


def ref_24():
    import csv
    import numpy as np
    from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    docs = [r["texto"] for r in csv.DictReader(open(os.path.join(ROOT, "data", "opiniones.csv"), encoding="utf-8-sig"))]
    stop = "a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue".split()
    D["vec_stop"] = stop
    configs = {
        "a": dict(),
        "b": dict(ngram_range=(1, 2), min_df=2),
        "c": dict(stop_words=stop, ngram_range=(1, 3)),
        "d": dict(max_features=61, stop_words=stop),
    }
    D["vec_cfg"] = {k: {"n": list(v.get("ngram_range", (1, 1))), "minDf": v.get("min_df", 1), "maxRasgos": v.get("max_features"), "vacias": "stop_words" in v} for k, v in configs.items()}
    out = {}
    for k, cfg in configs.items():
        cv = CountVectorizer(**cfg); X = cv.fit_transform(docs)
        voc = list(cv.get_feature_names_out())
        tv = TfidfVectorizer(**cfg); T = tv.fit_transform(docs)
        ts = TfidfVectorizer(sublinear_tf=True, **cfg); TS = ts.fit_transform(docs)
        Td = T.toarray()
        out[k] = {"nvocab": len(voc), "vocab": "|".join(voc), "total": int(X.sum()), "nnz": int(X.nnz),
                  "tfsum": [float(x) for x in Td.sum(1)], "tfsum_sub": [float(x) for x in TS.toarray().sum(1)],
                  "argmax": [voc[int(i)] if Td[j].max() > 0 else "" for j, i in enumerate(Td.argmax(1))]}
        if k == "a":
            qs = ["la guía es confusa y difícil", "recomendaría la actividad a mis compañeros", "excelente taller de tokenización"]
            D["vec_consultas"] = qs
            Q = tv.transform(qs)
            out["busqueda"] = [[int(i) for i in np.argsort(-cosine_similarity(Q[j], T).ravel(), kind="stable")[:5]] for j in range(len(qs))]
    R["vec"] = out


def modelo_lm(train, n, minimo=2):
    """Modelo de n-gramas con tuplas (implementación independiente del curso)."""
    from collections import Counter
    frec = Counter(w for s in train for w in s.split())
    vocab = {"</s>", "<unk>"} | {w for w, c in frec.items() if c >= minimo}
    cnt = [None] + [Counter() for _ in range(n)]
    for s in train:
        t = ["<s>"] * (n - 1) + [w if w in vocab else "<unk>" for w in s.split()] + ["</s>"]
        for i in range(n - 1, len(t)):
            for k in range(1, n + 1): cnt[k][tuple(t[i - k + 1:i + 1])] += 1
    cont = [None] + [Counter() for _ in range(n)]   # conteos de continuación
    for k in range(1, n):
        for g in cnt[k + 1]: cont[k][g[1:]] += 1
    m = {"n": n, "vocab": vocab, "cnt": cnt, "cont": cont}
    m["_tot"] = [None] + [Counter() for _ in range(n)]; m["_tip"] = [None] + [Counter() for _ in range(n)]
    m["_ctot"] = [None] + [Counter() for _ in range(n)]; m["_ctip"] = [None] + [Counter() for _ in range(n)]
    for kk in range(1, n + 1):
        for g, c in cnt[kk].items(): m["_tot"][kk][g[:-1]] += c; m["_tip"][kk][g[:-1]] += 1
    for kk in range(1, n):
        for g, c in cont[kk].items(): m["_ctot"][kk][g[:-1]] += c; m["_ctip"][kk][g[:-1]] += 1
    return m


def prob_lm(m, w, h, metodo, k=1.0, lam=None, d=0.75):
    n = m["n"]; V = len(m["vocab"]); cnt, cont = m["cnt"], m["cont"]
    def hist(kk): return tuple(h[len(h) - (kk - 1):]) if kk > 1 else ()
    def mle(kk):
        hh = hist(kk); tot = m["_tot"][kk].get(hh, 0)
        return cnt[kk].get(hh + (w,), 0) / tot if tot else 0.0
    if metodo == "mle": return mle(n)
    if metodo == "laplace":
        hh = hist(n); tot = m["_tot"][n].get(hh, 0)
        return (cnt[n].get(hh + (w,), 0) + k) / (tot + k * V)
    if metodo == "interp":
        return lam[0] / V + sum(lam[kk] * mle(kk) for kk in range(1, n + 1))
    def kn(kk):
        hh = hist(kk)
        if kk == 1:
            tot = sum(cont[1].values()); return cont[1].get((w,), 0) / tot if tot else 0.0
        if kk == n: tab, ct, ty = cnt[kk], m["_tot"][kk], m["_tip"][kk]
        else: tab, ct, ty = cont[kk], m["_ctot"][kk], m["_ctip"][kk]
        tot = ct.get(hh, 0)
        if not tot: return kn(kk - 1)
        return max(tab.get(hh + (w,), 0) - d, 0) / tot + d * ty.get(hh, 0) / tot * kn(kk - 1)
    return kn(n)


def pp_lm(m, test, **kw):
    import math
    n = m["n"]; lp = 0.0; N = 0; unk = 0; cero = False
    for s in test:
        t = ["<s>"] * (n - 1) + [w if w in m["vocab"] else "<unk>" for w in s.split()] + ["</s>"]
        for i in range(n - 1, len(t)):
            p = prob_lm(m, t[i], t[:i], **kw)
            if p <= 0: cero = True
            else: lp += math.log(p)
            N += 1; unk += t[i] == "<unk>"
    return (None if cero else math.exp(-lp / N)), N, unk


def ref_25():
    js = open(os.path.join(ROOT, "src", "lib", "12-lm.js"), encoding="utf-8").read()
    d = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", js, re.S).group(1))
    train, test = d["train"], d["test"]
    out = {}
    for n in (1, 2, 3):
        m = modelo_lm(train, n)
        out[f"V{n}"] = len(m["vocab"])
        out[f"mle{n}"] = pp_lm(m, test, metodo="mle")[0]
        for k in (1.0, 0.1):
            out[f"lap{n}_{k}"] = pp_lm(m, test, metodo="laplace", k=k)[0]
        if n > 1:
            for dd in (0.75, 0.9):
                out[f"kn{n}_{dd}"] = pp_lm(m, test, metodo="kn", d=dd)[0]
        lam = {1: [0.05, 0.95], 2: [0.02, 0.18, 0.80], 3: [0.01, 0.09, 0.30, 0.60]}[n]
        out[f"int{n}"] = pp_lm(m, test, metodo="interp", lam=lam)[0]
    m3 = modelo_lm(train, 3)
    out["N"], out["unk"] = pp_lm(m3, test, metodo="laplace")[1:]
    pts = []
    for ctx, w in [(["<s>", "<s>"], "el"), (["<s>", "el"], "presidente"), (["de", "la"], "ciudad"), (["en", "el"], "<unk>"), (["que", "no"], "se")]:
        pts.append([ctx, w, prob_lm(m3, w, ctx, "kn"), prob_lm(m3, w, ctx, "laplace"), prob_lm(m3, w, ctx, "mle")])
    out["puntos"] = pts
    R["lm"] = out


def ref_26():
    import random
    import numpy as np
    import torch
    js = open(os.path.join(ROOT, "src", "lib", "11-cooc.js"), encoding="utf-8").read()
    d = json.loads(re.search(r"L\.corpus\.cooc = (\{.*\});", js, re.S).group(1))
    F, C = d["filas"], d["cols"]
    M = np.zeros((len(F), len(C)))
    for i, r in enumerate(d["m"]):
        for c, n in r: M[i, c] = n
    tot = M.sum()
    with np.errstate(divide="ignore", invalid="ignore"):
        pmi = np.log2((M / tot) / ((M.sum(1, keepdims=True) / tot) * (M.sum(0, keepdims=True) / tot)))
    P = np.where(np.isfinite(pmi) & (pmi > 0), pmi, 0.0)
    U, S, Vt = np.linalg.svd(P, full_matrices=False)
    R["emb_S"] = [float(x) for x in S[:20]]
    W = U[:, :20] * S[:20]
    rnd = random.Random(26)
    pares = [[rnd.choice(F), rnd.choice(F)] for _ in range(100)]
    D["emb_pares"] = pares
    R["emb_cos"] = [float(W[F.index(a)] @ W[F.index(b)] / (np.linalg.norm(W[F.index(a)]) * np.linalg.norm(W[F.index(b)]))) for a, b in pares]
    # Gradientes de la pérdida skip-gram con muestreo negativo (autograd de PyTorch)
    g = torch.Generator().manual_seed(26)
    casos, res = [], []
    for _ in range(5):
        w = torch.randn(8, generator=g, dtype=torch.float64).requires_grad_(); c = torch.randn(8, generator=g, dtype=torch.float64).requires_grad_()
        ns = [torch.randn(8, generator=g, dtype=torch.float64).requires_grad_() for _ in range(3)]
        loss = -torch.nn.functional.logsigmoid(w @ c) - sum(torch.nn.functional.logsigmoid(-(w @ n)) for n in ns)
        loss.backward()
        casos.append({"w": w.tolist(), "c": c.tolist(), "ns": [n.tolist() for n in ns]})
        res.append({"loss": float(loss), "gw": w.grad.tolist(), "gc": c.grad.tolist(), "gn": [n.grad.tolist() for n in ns]})
    D["sg_casos"] = casos; R["sg_res"] = res


def ref_27():
    import csv
    import numpy as np
    from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import KFold, cross_val_predict
    from sklearn.pipeline import make_pipeline
    from sklearn.metrics import confusion_matrix, f1_score, accuracy_score
    filas = list(csv.DictReader(open(os.path.join(ROOT, "data", "opiniones.csv"), encoding="utf-8-sig")))
    docs = [r["texto"] for r in filas]
    stop = "a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue".split()
    lr = dict(solver="lbfgs", tol=1e-12, max_iter=20000)
    cfgs = {
        "pol_nb": ("etiqueta", lambda: make_pipeline(CountVectorizer(), MultinomialNB(alpha=1.0)), dict(modelo="nb", alpha=1.0, tfidf=False, n=[1, 1], vacias=False)),
        "pol_nb2": ("etiqueta", lambda: make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), MultinomialNB(alpha=0.5)), dict(modelo="nb", alpha=0.5, tfidf=True, n=[1, 2], vacias=False)),
        "tema_nb": ("tema", lambda: make_pipeline(CountVectorizer(stop_words=stop), MultinomialNB(alpha=0.3)), dict(modelo="nb", alpha=0.3, tfidf=False, n=[1, 1], vacias=True)),
        "pol_lr": ("etiqueta", lambda: make_pipeline(CountVectorizer(), LogisticRegression(C=1.0, **lr)), dict(modelo="lr", C=1.0, tfidf=False, n=[1, 1], vacias=False)),
        "pol_lr2": ("etiqueta", lambda: make_pipeline(TfidfVectorizer(), LogisticRegression(C=10.0, **lr)), dict(modelo="lr", C=10.0, tfidf=True, n=[1, 1], vacias=False)),
    }
    D["clf_cfg"] = {k: v[2] for k, v in cfgs.items()}; D["clf_stop"] = stop
    out = {}
    for k, (col, fab, _) in cfgs.items():
        y = np.array([r[col] for r in filas])
        pipe = fab(); cv = KFold(5)
        pred = cross_val_predict(pipe, docs, y, cv=cv)
        accs = []
        for tr, te in cv.split(docs):
            m = fab().fit([docs[i] for i in tr], y[tr]); accs.append(float(m.score([docs[i] for i in te], y[te])))
        labs = sorted(set(y))
        out[k] = {"acc": accs, "pred": chk(" ".join(pred)), "macro": float(f1_score(y, pred, average="macro", labels=labs)), "conf": confusion_matrix(y, pred, labels=labs).tolist(), "exact": float(accuracy_score(y, pred))}
        if k.startswith("pol_lr"):
            m = fab().fit(docs, y); out[k]["prob"] = [float(x) for x in m.predict_proba(docs[:40])[:, 1]]
            out[k]["b"] = float(m[-1].intercept_[0]); out[k]["normw"] = float(np.linalg.norm(m[-1].coef_))
    R["clf"] = out


def ref_28():
    import torch
    torch.manual_seed(28); torch.set_default_dtype(torch.float64)
    casos = {}
    # Perceptrón multicapa 3-5-4-1 con tanh / relu y salida sigmoide + BCE
    res = {}
    for act in ("tanh", "relu"):
        W1, b1 = torch.randn(5, 3, requires_grad=True), torch.randn(5, requires_grad=True)
        W2, b2 = torch.randn(4, 5, requires_grad=True), torch.randn(4, requires_grad=True)
        W3, b3 = torch.randn(1, 4, requires_grad=True), torch.randn(1, requires_grad=True)
        X = torch.randn(7, 3); y = torch.tensor([0., 1, 1, 0, 1, 0, 1])
        f = torch.tanh if act == "tanh" else torch.relu
        z = torch.sigmoid(f(f(X @ W1.T + b1) @ W2.T + b2) @ W3.T + b3).squeeze(1)
        loss = torch.nn.functional.binary_cross_entropy(z, y); loss.backward()
        L = lambda t: t.detach().tolist()
        casos[act] = {"W": [L(W1), L(W2), L(W3)], "b": [L(b1), L(b2), L(b3)], "X": L(X), "y": L(y)}
        res[act] = {"loss": float(loss), "gW": [L(W1.grad), L(W2.grad), L(W3.grad)], "gb": [L(b1.grad), L(b2.grad), L(b3.grad)], "prob": L(z)}
    D["nn_mlp"] = casos; R["nn_mlp"] = res
    # RNN y LSTM de una capa, entrada 4, oculto 5, secuencia de 6 pasos
    rnn = torch.nn.RNN(4, 5, batch_first=True); lstm = torch.nn.LSTM(4, 5, batch_first=True)
    x = torch.randn(1, 6, 4)
    with torch.no_grad():
        ho, hn = rnn(x); lo, (lh, lc) = lstm(x)
    pr = lambda m: {"Wih": m.weight_ih_l0.tolist(), "Whh": m.weight_hh_l0.tolist(), "bih": m.bias_ih_l0.tolist(), "bhh": m.bias_hh_l0.tolist()}
    D["nn_rec"] = {"x": x[0].tolist(), "rnn": pr(rnn), "lstm": pr(lstm)}
    R["nn_rec"] = {"rnn": ho[0].tolist(), "lstm": lo[0].tolist(), "c": lc[0, 0].tolist()}
    # Convolución 1D (3 filtros de ancho 2 y 3) + ReLU + max-pooling temporal
    conv = torch.nn.Conv1d(4, 3, 2); conv3 = torch.nn.Conv1d(4, 2, 3)
    xs = torch.randn(1, 4, 9)
    with torch.no_grad():
        o2 = torch.relu(conv(xs)).max(dim=2).values[0]; o3 = torch.relu(conv3(xs)).max(dim=2).values[0]
    D["nn_conv"] = {"x": xs[0].T.tolist(), "f2": [{"W": conv.weight[i].T.tolist(), "b": float(conv.bias[i])} for i in range(3)], "f3": [{"W": conv3.weight[i].T.tolist(), "b": float(conv3.bias[i])} for i in range(2)]}
    R["nn_conv"] = {"f2": o2.tolist(), "f3": o3.tolist()}


def ref_29():
    import torch
    torch.manual_seed(29); torch.set_default_dtype(torch.float64)
    Q, K, V = torch.randn(4, 8), torch.randn(6, 8), torch.randn(6, 5)
    sc = Q @ K.T / 8 ** 0.5
    w = torch.softmax(sc, 1); out = w @ V
    Qc, Kc, Vc = torch.randn(5, 8), torch.randn(5, 8), torch.randn(5, 3)
    m = torch.tril(torch.ones(5, 5, dtype=torch.bool))
    wc = torch.softmax((Qc @ Kc.T / 8 ** 0.5).masked_fill(~m, float("-inf")), 1)
    oc = torch.nn.functional.scaled_dot_product_attention(Qc[None, None], Kc[None, None], Vc[None, None], is_causal=True)[0, 0]
    ref = torch.nn.functional.scaled_dot_product_attention(Q[None, None], K[None, None], V[None, None])[0, 0]
    D["att"] = {"Q": Q.tolist(), "K": K.tolist(), "V": V.tolist(), "Qc": Qc.tolist(), "Kc": Kc.tolist(), "Vc": Vc.tolist()}
    R["att"] = {"w": w.tolist(), "out": out.tolist(), "outsdpa": ref.tolist(), "wc": wc.tolist(), "oc": oc.tolist()}


def ref_30():
    import torch, numpy as np
    torch.manual_seed(30); torch.set_default_dtype(torch.float64)
    d, h, dff, n = 12, 3, 20, 6
    casos = {}; res = {}
    for npr in (False, True):
        capa = torch.nn.TransformerEncoderLayer(d, h, dff, dropout=0.0, activation="relu", batch_first=True, norm_first=npr).eval()
        with torch.no_grad():
            for nm in (capa.norm1, capa.norm2):
                nm.weight.copy_(torch.randn(d) * 0.3 + 1); nm.bias.copy_(torch.randn(d) * 0.2)
            capa.self_attn.in_proj_bias.copy_(torch.randn(3 * d) * 0.2); capa.self_attn.out_proj.bias.copy_(torch.randn(d) * 0.2)
            capa.linear1.bias.copy_(torch.randn(dff) * 0.2); capa.linear2.bias.copy_(torch.randn(d) * 0.2)
        x = torch.randn(1, n, d)
        L = lambda t: t.detach().tolist()
        par = {"mha": {"h": h, "inW": L(capa.self_attn.in_proj_weight), "inB": L(capa.self_attn.in_proj_bias), "outW": L(capa.self_attn.out_proj.weight), "outB": L(capa.self_attn.out_proj.bias)},
               "ff": {"W1": L(capa.linear1.weight), "b1": L(capa.linear1.bias), "W2": L(capa.linear2.weight), "b2": L(capa.linear2.bias)},
               "n1": {"g": L(capa.norm1.weight), "b": L(capa.norm1.bias)}, "n2": {"g": L(capa.norm2.weight), "b": L(capa.norm2.bias)}}
        mask = torch.nn.Transformer.generate_square_subsequent_mask(n)
        for causal in (False, True):
            with torch.no_grad():
                y = capa(x, src_mask=mask if causal else None, is_causal=False)
                entrada = capa.norm1(x) if npr else x
                _, w = capa.self_attn(entrada, entrada, entrada, attn_mask=mask if causal else None, need_weights=True, average_attn_weights=False)
            clave = f"{'pre' if npr else 'post'}_{'causal' if causal else 'libre'}"
            casos[clave] = {"x": L(x[0]), "par": par, "normPrimero": npr, "causal": causal}
            res[clave] = {"y": L(y[0]), "w": L(w[0])}
    D["tf_casos"] = casos; R["tf_res"] = res
    # codificación posicional sinusoidal con NumPy
    def pe(n, d):
        P = np.zeros((n, d)); pos = np.arange(n)[:, None]; div = np.exp(np.arange(0, d, 2) * (-np.log(10000.0) / d))
        P[:, 0::2] = np.sin(pos * div); P[:, 1::2] = np.cos(pos * div); return P
    D["tf_pe"] = [[20, 16], [7, 8], [50, 64]]; R["tf_pe"] = [pe(n, dd).tolist() for n, dd in D["tf_pe"]]


def ref_31():
    from collections import Counter
    js = open(os.path.join(ROOT, "src", "lib", "12-lm.js"), encoding="utf-8").read()
    d = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", js, re.S).group(1))
    palabras = [w for s in d["train"] for w in s.split()]
    def entrenar(ws, n):
        vocab = {tuple(w[:-1]) + (w[-1] + "</w>",): f for w, f in Counter(ws).items()}
        fus = []
        for _ in range(n):
            pares = Counter()
            for sym, f in vocab.items():
                for a, b in zip(sym, sym[1:]): pares[(a, b)] += f
            if not pares: break
            (a, b), f = min(pares.items(), key=lambda kv: (-kv[1], kv[0]))
            fus.append([a, b, f]); nuevo = {}
            for sym, fr in vocab.items():
                out, i = [], 0
                while i < len(sym):
                    if i + 1 < len(sym) and sym[i] == a and sym[i + 1] == b: out.append(a + b); i += 2
                    else: out.append(sym[i]); i += 1
                nuevo[tuple(out)] = nuevo.get(tuple(out), 0) + fr
            vocab = nuevo
        return fus
    def codificar(fus, w):
        rango = {(a, b): i for i, (a, b, _) in enumerate(fus)}
        s = list(w[:-1]) + [w[-1] + "</w>"]
        while True:
            c = [(rango[(s[i], s[i + 1])], i) for i in range(len(s) - 1) if (s[i], s[i + 1]) in rango]
            if not c: return s
            _, i = min(c); s = s[:i] + [s[i] + s[i + 1]] + s[i + 2:]
    fus = entrenar(palabras, 400)
    R["bpe_fus"] = fus
    prueba = [w for s in d["test"][:40] for w in s.split()][:120] + ["procesamiento", "descentralización", "kiwi", "gubernamental"]
    D["bpe_prueba"] = prueba
    R["bpe_cod"] = [codificar(fus, w) for w in prueba]
    fus50 = entrenar(palabras, 50); R["bpe_fus50"] = fus50


def ref_32():
    import random, unicodedata
    import sacrebleu
    from rouge_score import rouge_scorer
    js = open(os.path.join(ROOT, "src", "lib", "12-lm.js"), encoding="utf-8").read()
    d = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", js, re.S).group(1))
    rnd = random.Random(32)
    def perturba(frase):
        w = frase.split()
        for _ in range(rnd.randint(0, 3)):
            if len(w) > 4:
                op = rnd.choice(["borrar", "cambiar", "intercambiar", "repetir"]); i = rnd.randrange(len(w) - 1)
                if op == "borrar": del w[i]
                elif op == "cambiar": w[i] = "xx"
                elif op == "intercambiar": w[i], w[i + 1] = w[i + 1], w[i]
                else: w.insert(i, w[i])
        return " ".join(w)
    refs = d["test"][:40]; refs2 = [perturba(r) for r in refs]; hips = [perturba(r) for r in refs]
    D["ev_hips"] = hips; D["ev_refs"] = refs; D["ev_refs2"] = refs2
    R["ev_bleu1"] = sacrebleu.corpus_bleu(hips, [refs], tokenize="none", smooth_method="none", force=True).score
    R["ev_bleu2"] = sacrebleu.corpus_bleu(hips, [refs, refs2], tokenize="none", smooth_method="none", force=True).score
    R["ev_bleu_exp"] = sacrebleu.corpus_bleu(hips, [refs], tokenize="none", smooth_method="exp", force=True).score
    R["ev_bleu_s"] = [sacrebleu.sentence_bleu(h, [r], tokenize="none").score for h, r in zip(hips, refs)]
    sinac = lambda t: "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    sc = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=False)
    R["ev_rouge"] = [[(lambda x: [x.precision, x.recall, x.fmeasure])(sc.score(sinac(r), sinac(h))[k]) for k in ("rouge1", "rouge2", "rougeL")] for h, r in zip(hips, refs)]


def ref_33():
    m = cargar_py("33-ner")
    modelo = m.entrena(m.TR, 5)
    pred = [m.etiqueta(modelo, [w for w, _ in s]) for s in m.TE]
    oro = [[t for _, t in s] for s in m.TE]
    R["ner_pred"] = chk(" ".join(" ".join(p) for p in pred))
    R["ner_pred_ini"] = [" ".join(p) for p in pred[:60]]
    res = m.evalua(oro, pred)
    R["ner_eval"] = {k: list(v) for k, v in res.items()}
    # Métricas de entidades con predicciones perturbadas (casos límite de BIO)
    import random
    rnd = random.Random(33); tags = sorted({t for s in m.TR for _, t in s}); pert = []
    for g in oro[:120]:
        p = list(g)
        for _ in range(rnd.randint(0, 3)):
            if p: p[rnd.randrange(len(p))] = rnd.choice(tags)
        pert.append(p)
    D["ner_pert"] = pert; D["ner_oro"] = oro[:120]
    R["ner_pert_eval"] = {k: list(v) for k, v in m.evalua(oro[:120], pert).items()}
    R["ner_ent"] = [sorted(m.entidades(p)) for p in pert[:50]]


BLOQUES = [ref_01,ref_02,ref_03, ref_04, ref_05, ref_06, ref_07, ref_08, ref_10, ref_11, ref_12, ref_14, ref_15, ref_16, ref_18, ref_19, ref_20, ref_21, ref_23, ref_24, ref_25, ref_26, ref_27, ref_28, ref_29, ref_30, ref_31, ref_32, ref_33]
if __name__ == "__main__":
    only = set(sys.argv[1:])
    for f in BLOQUES:
        f()
    out = "/* Generado por tests/referencias.py — no editar */\n(function (root) {\n  'use strict';\n  const NL = (root.NL = root.NL || {});\n  const L = (NL.L = NL.L || {});\n  L.REF = " + json.dumps({"ref": R, "data": D, "versions": V}, ensure_ascii=False, indent=1) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n"
    open(os.path.join(ROOT, "src", "lib", "85-ref.js"), "w", encoding="utf-8").write(out)
    print("referencias:", len(R), "valores;", V)




