# Preentrenamiento: (1) cuántos tokens usa el español en tokenizadores reales (tiktoken), (2) BPE sobre CESS-ESP y (3) dos objetivos de preentrenamiento
# con Transformers diminutos: lenguaje enmascarado (tipo BERT, ve ambos lados) frente a lenguaje causal (tipo GPT, ve solo el pasado).
import json, math, os, re, time
from collections import Counter
import torch
from torch import nn
import tiktoken

torch.manual_seed(0)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", open(os.path.join(RAIZ, "src", "lib", "12-lm.js"), encoding="utf-8").read(), re.S).group(1))
train, test = datos["train"], datos["test"]

# 1) Tokens por palabra en tokenizadores de modelos reales: mismas ideas en español y en inglés
pares = [("El presidente del gobierno anunció ayer una decisión importante sobre la política económica del país.", "The president of the government announced yesterday an important decision about the country's economic policy."),
         ("Los estudiantes aprenden procesamiento del lenguaje natural con ejemplos prácticos y mucha paciencia.", "Students learn natural language processing with practical examples and a lot of patience."),
         ("La descentralización administrativa requiere instituciones transparentes y ciudadanos informados.", "Administrative decentralization requires transparent institutions and informed citizens.")]
print(f"{'tokenizador':14}{'idioma':9}{'palabras':>9}{'tokens':>8}{'tokens/palabra':>16}")
for nombre in ("cl100k_base", "o200k_base"):
    enc = tiktoken.get_encoding(nombre)
    for k, idioma in ((0, "español"), (1, "inglés")):
        pal = sum(len(p[k].split()) for p in pares); tok = sum(len(enc.encode(p[k])) for p in pares)
        print(f"{nombre:14}{idioma:9}{pal:9d}{tok:8d}{tok / pal:16.2f}")
print("«descentralización» en cl100k_base:", [tiktoken.get_encoding("cl100k_base").decode([t]) for t in tiktoken.get_encoding("cl100k_base").encode(" descentralización")])

# 2) BPE propio: más fusiones → vocabulario mayor y menos tokens por palabra
def entrenar(palabras, n):
    vocab = {tuple(w[:-1]) + (w[-1] + "</w>",): f for w, f in Counter(palabras).items()}; fus = []
    for _ in range(n):
        pares_ = Counter()
        for sim, f in vocab.items():
            for a, b in zip(sim, sim[1:]): pares_[(a, b)] += f
        if not pares_: break
        (a, b), _f = min(pares_.items(), key=lambda kv: (-kv[1], kv[0])); fus.append((a, b)); nuevo = {}
        for sim, f in vocab.items():
            o, i = [], 0
            while i < len(sim):
                if i + 1 < len(sim) and sim[i] == a and sim[i + 1] == b: o.append(a + b); i += 2
                else: o.append(sim[i]); i += 1
            nuevo[tuple(o)] = nuevo.get(tuple(o), 0) + f
        vocab = nuevo
    return fus, {x for sim in vocab for x in sim}
def codificar(fus, w):
    rango = {p: i for i, p in enumerate(fus)}; s = list(w[:-1]) + [w[-1] + "</w>"]
    while True:
        c = [(rango[(s[i], s[i + 1])], i) for i in range(len(s) - 1) if (s[i], s[i + 1]) in rango]
        if not c: return s
        _, i = min(c); s = s[:i] + [s[i] + s[i + 1]] + s[i + 2:]
pal_tr = [w for s in train for w in s.split()]; pal_te = [w for s in test for w in s.split()]
print(f"\nBPE sobre {len(pal_tr)} palabras de entrenamiento ({len(set(pal_tr))} formas distintas); prueba: {len(pal_te)} palabras")
print(f"{'fusiones':>9}{'vocabulario':>13}{'tokens/palabra (prueba)':>25}{'palabras en 1 token':>21}")
for n in (0, 100, 300, 1000, 3000):
    fus, voc = entrenar(pal_tr, n); cod = [codificar(fus, w) for w in pal_te]
    print(f"{n:9d}{len(voc):13d}{sum(map(len, cod)) / len(cod):25.2f}{sum(len(c) == 1 for c in cod) / len(cod):21.1%}")

# 3) Dos objetivos de preentrenamiento con el mismo Transformer diminuto
frec = Counter(w for s in train for w in s.split())
vocab = ["<pad>", "<s>", "</s>", "<unk>", "<mask>"] + sorted(w for w, c in frec.items() if c >= 2); idx = {w: i for i, w in enumerate(vocab)}; V = len(vocab)
def codifica(frases, T=32):
    X = torch.zeros(len(frases), T, dtype=torch.long)
    for k, s in enumerate(frases):
        ids = [1] + [idx.get(w, 3) for w in s.split()] + [2]; X[k, :len(ids)] = torch.tensor(ids[:T])
    return X
Xtr, Xte = codifica(train), codifica(test)
class Enc(nn.Module):
    def __init__(s, causal, d=64, h=4, capas=2, dff=128, T=32):
        super().__init__(); s.causal = causal; s.d = d; s.e = nn.Embedding(V, d, padding_idx=0)
        pos = torch.zeros(T, d); k = torch.arange(T)[:, None]; div = torch.exp(torch.arange(0, d, 2) * (-math.log(10000.0) / d))
        pos[:, 0::2] = torch.sin(k * div); pos[:, 1::2] = torch.cos(k * div); s.register_buffer("pos", pos)
        s.enc = nn.TransformerEncoder(nn.TransformerEncoderLayer(d, h, dff, 0.1, batch_first=True, norm_first=True), capas); s.nf = nn.LayerNorm(d); s.o = nn.Linear(d, V)
    def forward(s, X):
        T = X.shape[1]; m = nn.Transformer.generate_square_subsequent_mask(T) if s.causal else None
        return s.o(s.nf(s.enc(s.e(X) * math.sqrt(s.d) + s.pos[:T], mask=m, src_key_padding_mask=(X == 0))))
def enmascara(X, g, p=0.15):
    """Elige el 15 % de las palabras reales; de ellas, 80 % → <mask>, 10 % → palabra al azar, 10 % sin cambiar (receta de BERT)."""
    real = (X > 2); sel = (torch.rand(X.shape, generator=g) < p) & real
    r = torch.rand(X.shape, generator=g); Y = X.clone()
    Y[sel & (r < 0.8)] = 4
    az = sel & (r >= 0.8) & (r < 0.9); Y[az] = torch.randint(5, V, (int(az.sum()),), generator=g)
    return Y, sel
gte = torch.Generator().manual_seed(123); Yte, sel_te = enmascara(Xte, gte)       # máscaras fijas para evaluar
def evalua(m, bert):
    m.eval()
    with torch.no_grad():
        if bert: lo = m(Yte)[sel_te]; obj = Xte[sel_te]
        else:   # modelo causal: la predicción de la posición t se hace con las palabras anteriores (posición t − 1)
            lo = m(Xte)[:, :-1]; s2 = sel_te[:, 1:]; lo = lo[s2]; obj = Xte[:, 1:][s2]
        top = lo.topk(5, dim=1).indices; return (top[:, 0] == obj).float().mean().item(), (top == obj[:, None]).any(1).float().mean().item(), len(obj)
print(f"\nobjetivos de preentrenamiento (Transformer de 2 capas, d = 64; vocabulario {V}); evaluación en {int(sel_te.sum())} posiciones enmascaradas del conjunto de prueba")
masc = Counter(w for s in train for w in s.split()); mas5 = [w for w, _ in masc.most_common(5)]
print("línea de base (siempre las 5 palabras más frecuentes):", ", ".join(mas5), f"→ acierto en 5: {sum(vocab[i] in mas5 for i in Xte[sel_te].tolist()) / int(sel_te.sum()):.1%}")
for nombre, bert in (("enmascarado, ve ambos lados (tipo BERT)", True), ("causal, solo ve la izquierda (tipo GPT)", False)):
    torch.manual_seed(0); g = torch.Generator().manual_seed(1); m = Enc(causal=not bert); opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=0.01); t0 = time.time(); mejor = (0, 0, 0)
    for ep in range(1, 21):
        m.train(); perm = torch.randperm(len(Xtr))
        for i in range(0, len(perm), 64):
            lote = Xtr[perm[i:i + 64]]
            if bert:
                Y, sel = enmascara(lote, g); lo = m(Y)[sel]; obj = lote[sel]
            else:
                lo = m(lote)[:, :-1]; obj = lote[:, 1:]; lo = lo[obj > 0]; obj = obj[obj > 0]
            perd = nn.functional.cross_entropy(lo, obj); opt.zero_grad(); perd.backward(); torch.nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step()
        a1, a5, n = evalua(m, bert)
        if a5 > mejor[1]: mejor = (a1, a5, ep)
    print(f"   {nombre:42} mejor época {mejor[2]:2d}: acierto en 1 = {mejor[0]:.1%}, en 5 = {mejor[1]:.1%}  ({time.time() - t0:.0f} s)")
