# Un Transformer pequeño (solo decodificador) como modelo de lenguaje, con las mismas oraciones y el mismo vocabulario del capítulo 25.
import json, math, os, re, time
from collections import Counter
import torch
from torch import nn

torch.manual_seed(0)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.loads(re.search(r"L\.corpus\.lm = (\{.*\});", open(os.path.join(RAIZ, "src", "lib", "12-lm.js"), encoding="utf-8").read(), re.S).group(1))
train, test = datos["train"], datos["test"]
frec = Counter(w for s in train for w in s.split())
vocab = ["<pad>", "<s>", "</s>", "<unk>"] + sorted(w for w, c in frec.items() if c >= 2); idx = {w: i for i, w in enumerate(vocab)}
def codifica(frases, T=32):
    X = torch.zeros(len(frases), T, dtype=torch.long)
    for k, s in enumerate(frases):
        ids = [1] + [idx.get(w, 3) for w in s.split()] + [2]; X[k, :len(ids)] = torch.tensor(ids[:T])
    return X
Xtr, Xte = codifica(train), codifica(test)
print(f"vocabulario {len(vocab) - 3} (más <pad>, <s> y </s> → {len(vocab)}); {len(train)} oraciones de entrenamiento; {len(test)} de prueba")

class LM(nn.Module):
    def __init__(s, V, d=64, h=4, capas=2, dff=128, T=32, p=0.1):
        super().__init__(); s.e = nn.Embedding(V, d, padding_idx=0); s.d = d
        pos = torch.zeros(T, d); k = torch.arange(T)[:, None]; div = torch.exp(torch.arange(0, d, 2) * (-math.log(10000.0) / d))
        pos[:, 0::2] = torch.sin(k * div); pos[:, 1::2] = torch.cos(k * div); s.register_buffer("pos", pos)
        s.enc = nn.TransformerEncoder(nn.TransformerEncoderLayer(d, h, dff, p, batch_first=True, norm_first=True), capas)
        s.nf = nn.LayerNorm(d); s.o = nn.Linear(d, V)
    def forward(s, X, pesos=False):
        T = X.shape[1]; m = nn.Transformer.generate_square_subsequent_mask(T)
        z = s.e(X) * math.sqrt(s.d) + s.pos[:T]
        return s.o(s.nf(s.enc(z, mask=m)))

def perplejidad(m, X):
    m.eval()
    with torch.no_grad():
        lo = m(X[:, :-1]); obj = X[:, 1:]
        perd = nn.functional.cross_entropy(lo.reshape(-1, len(vocab)), obj.reshape(-1), ignore_index=0, reduction="sum")
        return math.exp(perd.item() / (obj != 0).sum().item())

m = LM(len(vocab)); opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=0.01)
print(f"Transformer de 2 capas, 4 cabezas, d = 64: {sum(p.numel() for p in m.parameters()):,} parámetros".replace(",", "."))
t0 = time.time(); mejor = (1e9, 0)
for epoca in range(1, 31):
    m.train(); perm = torch.randperm(len(Xtr))
    for i in range(0, len(perm), 64):
        lote = Xtr[perm[i:i + 64]]
        lo = m(lote[:, :-1]); perd = nn.functional.cross_entropy(lo.reshape(-1, len(vocab)), lote[:, 1:].reshape(-1), ignore_index=0)
        opt.zero_grad(); perd.backward(); torch.nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step()
    pp = perplejidad(m, Xte)
    if pp < mejor[0]: mejor = (pp, epoca); estado = {k: v.clone() for k, v in m.state_dict().items()}
    if epoca in (1, 2, 3, 5, 8, 10, 15, 20, 25, 30):
        print(f"   época {epoca:2d}: pérdida de entrenamiento {perd.item():.3f}, perplejidad en prueba {pp:7.1f}")
print(f"mejor perplejidad en prueba: {mejor[0]:.1f} (época {mejor[1]}); Kneser–Ney del capítulo 25: 102,2 (bigrama) y 103,2 (trigrama); {time.time() - t0:.0f} s")

m.load_state_dict(estado)   # se analiza el modelo de la mejor época, antes de que se sobreajuste
# ¿A qué mira cada cabeza? Peso medio que cada cabeza de la última capa da a la palabra anterior y a la propia palabra (con atención uniforme sería 1/(t+1))
m.eval()
capa = m.enc.layers[-1]; mask = nn.Transformer.generate_square_subsequent_mask(Xte.shape[1] - 1)
with torch.no_grad():
    x = m.e(Xte[:, :-1]) * math.sqrt(m.d) + m.pos[:Xte.shape[1] - 1]
    for c in m.enc.layers[:-1]: x = c(x, src_mask=mask)
    z = capa.norm1(x); _, w = capa.self_attn(z, z, z, attn_mask=mask, need_weights=True, average_attn_weights=False)
    real = (Xte[:, :-1] != 0); T = w.shape[-1]; unif = (1.0 / (torch.arange(T) + 1.0))[None, :].expand_as(real)
    sel = real.clone(); sel[:, 0] = False                       # posiciones con palabra anterior
    print(f"atención uniforme daría {unif[sel].mean().item():.3f} a la palabra anterior")
    for h in range(w.shape[1]):
        prev = torch.zeros_like(real, dtype=torch.float); prev[:, 1:] = w[:, h].diagonal(offset=-1, dim1=1, dim2=2)
        propia = w[:, h].diagonal(dim1=1, dim2=2)
        print(f"   cabeza {h + 1}: {prev[sel].mean().item():.3f} a la palabra anterior; {propia[real].mean().item():.3f} a sí misma")
