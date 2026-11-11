# Redes neuronales con PyTorch: perceptrón multicapa en datos 2D y tres arquitecturas para clasificar opiniones (bolsa de embeddings, CNN y LSTM).
import csv, os, re
import numpy as np, torch
from torch import nn
from sklearn.linear_model import LogisticRegression

torch.manual_seed(0); np.random.seed(0)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1) Dos espirales: un modelo lineal no puede; un perceptrón multicapa sí
def espirales(n=400, ruido=0.08, rng=np.random.default_rng(1)):
    t = rng.uniform(0.2, 3.2, n) * 1.6; r = t / 3.2 * 1.6; c = np.arange(n) % 2
    ph = np.where(c == 1, np.pi, 0)
    X = np.c_[r * np.cos(t + ph), r * np.sin(t + ph)] + ruido * rng.standard_normal((n, 2))
    return X, c
X, y = espirales(); ntr = 300
lin = LogisticRegression().fit(X[:ntr], y[:ntr])
print(f"espirales: regresión logística (lineal)  exactitud en prueba {lin.score(X[ntr:], y[ntr:]):.3f}")
Xt, yt = torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)
for oculta in (2, 8, 32):
    red = nn.Sequential(nn.Linear(2, oculta), nn.Tanh(), nn.Linear(oculta, oculta), nn.Tanh(), nn.Linear(oculta, 1))
    opt = torch.optim.Adam(red.parameters(), lr=0.02)
    for _ in range(1500):
        opt.zero_grad(); perd = nn.functional.binary_cross_entropy_with_logits(red(Xt[:ntr]).squeeze(1), yt[:ntr]); perd.backward(); opt.step()
    ok = ((red(Xt[ntr:]).squeeze(1) > 0).float() == yt[ntr:]).float().mean().item()
    print(f"   perceptrón 2-{oculta}-{oculta}-1 ({sum(p.numel() for p in red.parameters()):5d} parámetros): pérdida {perd.item():.3f}, exactitud en prueba {ok:.3f}")

# 2) Opiniones: bolsa de embeddings, CNN y LSTM con los mismos datos (entrenar con 80, probar con 72)
filas = list(csv.DictReader(open(os.path.join(RAIZ, "data", "opiniones.csv"), encoding="utf-8-sig")))
toks = [re.findall(r"\w+", f["texto"].lower()) for f in filas]; y = torch.tensor([f["etiqueta"] == "positivo" for f in filas], dtype=torch.float32)
voc = {w: i + 1 for i, w in enumerate(sorted({w for t in toks[:80] for w in t}))}      # solo el vocabulario de entrenamiento; 0 = desconocida
T = max(map(len, toks)); X = torch.tensor([[voc.get(w, 0) for w in t] + [0] * (T - len(t)) for t in toks])
tr, te = slice(0, 80), slice(288, 360)

class Bolsa(nn.Module):
    def __init__(s, V, d=16): super().__init__(); s.e = nn.Embedding(V, d, padding_idx=0); s.o = nn.Linear(d, 1)
    def forward(s, x): m = (x > 0).unsqueeze(2); return s.o((s.e(x) * m).sum(1) / m.sum(1).clamp(min=1)).squeeze(1)
class CNN(nn.Module):
    def __init__(s, V, d=16, f=16): super().__init__(); s.e = nn.Embedding(V, d, padding_idx=0); s.c = nn.Conv1d(d, f, 3, padding=1); s.o = nn.Linear(f, 1)
    def forward(s, x): return s.o(torch.relu(s.c(s.e(x).transpose(1, 2))).max(2).values).squeeze(1)
class LSTM(nn.Module):
    def __init__(s, V, d=16, h=16): super().__init__(); s.e = nn.Embedding(V, d, padding_idx=0); s.r = nn.LSTM(d, h, batch_first=True); s.o = nn.Linear(h, 1)
    def forward(s, x): n = (x > 0).sum(1) - 1; h, _ = s.r(s.e(x)); return s.o(h[torch.arange(len(x)), n]).squeeze(1)

print(f"\nopiniones: {len(voc)} palabras de entrenamiento; entrenar con 80 ejemplos, probar con 72")
for nombre, Clase in [("bolsa de embeddings", Bolsa), ("CNN (filtros de ancho 3)", CNN), ("LSTM", LSTM)]:
    torch.manual_seed(0); m = Clase(len(voc) + 1); opt = torch.optim.Adam(m.parameters(), lr=0.01)
    for _ in range(150):
        opt.zero_grad(); perd = nn.functional.binary_cross_entropy_with_logits(m(X[tr]), y[tr]); perd.backward(); opt.step()
    ok = ((m(X[te]) > 0).float() == y[te]).float().mean().item()
    print(f"   {nombre:26} {sum(p.numel() for p in m.parameters()):5d} parámetros: pérdida de entrenamiento {perd.item():.3f}, exactitud en prueba {ok:.3f}")
