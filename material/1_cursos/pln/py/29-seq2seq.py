# Seq2Seq con y sin atención: convertir fechas escritas en español («3 de mayo de 2021») a formato ISO («2021-05-03»), carácter a carácter.
import json, os, random, time
import torch
from torch import nn

torch.manual_seed(0); random.seed(0)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

def fecha():
    a, m = random.randint(1990, 2029), random.randint(1, 12)
    d = random.randint(1, 28)
    return f"{d} de {MESES[m - 1]} de {a}", f"{a}-{m:02d}-{d:02d}"

ORIGEN = sorted(set("".join(MESES) + "0123456789 de")) ; ORIGEN = ["<pad>"] + ORIGEN
DESTINO = ["<pad>", "<s>", "</s>"] + list("0123456789-")
oi = {c: i for i, c in enumerate(ORIGEN)}; di = {c: i for i, c in enumerate(DESTINO)}
Ls, Lt = 24, 11    # longitud máxima de origen (con relleno) y de destino (10 caracteres + </s>)

def codifica(pares):
    S = torch.zeros(len(pares), Ls, dtype=torch.long); T = torch.zeros(len(pares), Lt + 1, dtype=torch.long)
    for k, (s, t) in enumerate(pares):
        for i, c in enumerate(s): S[k, i] = oi[c]
        T[k, 0] = di["<s>"]
        for i, c in enumerate(t): T[k, i + 1] = di[c]
        T[k, len(t) + 1] = di["</s>"]
    return S, T

class Modelo(nn.Module):
    def __init__(s, atencion, d=32, h=128):
        super().__init__(); s.att = atencion
        s.ee = nn.Embedding(len(ORIGEN), d, padding_idx=0); s.enc = nn.GRU(d, h, batch_first=True)
        s.de = nn.Embedding(len(DESTINO), d, padding_idx=0); s.dec = nn.GRUCell(d + (h if atencion else 0), h)
        s.Wq = nn.Linear(h, h, bias=False); s.out = nn.Linear(h + (h if atencion else 0), len(DESTINO))
    def codificar(s, S):
        E, h = s.enc(s.ee(S)); return E, h[0]
    def paso(s, y, h, E, mascara):
        ctx, w = None, None
        entrada = s.de(y)
        if s.att:
            sc = torch.bmm(E, s.Wq(h).unsqueeze(2)).squeeze(2).masked_fill(~mascara, -1e9)      # producto escalar con la consulta
            w = torch.softmax(sc, 1); ctx = torch.bmm(w.unsqueeze(1), E).squeeze(1); entrada = torch.cat([entrada, ctx], 1)
        h = s.dec(entrada, h)
        return s.out(torch.cat([h, ctx], 1) if s.att else h), h, w
    def forward(s, S, T):
        E, h = s.codificar(S); m = S > 0; salidas = []
        for t in range(T.shape[1] - 1):
            o, h, _ = s.paso(T[:, t], h, E, m); salidas.append(o)
        return torch.stack(salidas, 1)
    @torch.no_grad()
    def traducir(s, S):
        E, h = s.codificar(S); m = S > 0; y = torch.full((len(S),), di["<s>"]); res, ws = [], []
        for t in range(Lt):
            o, h, w = s.paso(y, h, E, m); y = o.argmax(1); res.append(y)
            if w is not None: ws.append(w)
        return torch.stack(res, 1), (torch.stack(ws, 1) if ws else None)

def texto(ids):
    out = ""
    for i in ids:
        c = DESTINO[int(i)]
        if c == "</s>": break
        out += c
    return out

prueba = [fecha() for _ in range(1000)]; Sp, Tp = codifica(prueba)
entrenamiento = [fecha() for _ in range(20000)]; Se, Te = codifica(entrenamiento)
PASOS = (50, 100, 200, 400, 800, 1500)
resultados, ejemplo, curvas = {}, None, {}

def evaluar(m):
    pred, ws = m.traducir(Sp)
    exactas = sum(texto(pred[i]) == prueba[i][1] for i in range(len(prueba))) / len(prueba)
    car = sum(texto(pred[i])[j:j + 1] == prueba[i][1][j:j + 1] for i in range(len(prueba)) for j in range(10)) / (10 * len(prueba))
    return exactas, car, pred, ws

for nombre, att in [("sin atención (solo el último estado)", False), ("con atención", True)]:
    torch.manual_seed(0); g = torch.Generator().manual_seed(1); m = Modelo(att, d=24, h=48); opt = torch.optim.Adam(m.parameters(), lr=0.004); t0 = time.time(); curvas[nombre] = []
    for paso in range(1, PASOS[-1] + 1):
        idx = torch.randint(0, len(Se), (128,), generator=g)
        S, T = Se[idx], Te[idx]
        perd = nn.functional.cross_entropy(m(S, T).reshape(-1, len(DESTINO)), T[:, 1:].reshape(-1), ignore_index=0)
        opt.zero_grad(); perd.backward(); torch.nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step()
        if paso in PASOS: curvas[nombre].append((paso, evaluar(m)[0], perd.item()))
    exactas, car, pred, ws = evaluar(m)
    resultados[nombre] = (exactas, car, perd.item(), time.time() - t0)
    print(f"{nombre:36} {sum(p.numel() for p in m.parameters()):6d} parámetros · pérdida {perd.item():.3f} · fechas exactas {exactas:.1%} · caracteres correctos {car:.1%}")
    if att:
        ejemplo = [(prueba[i][0], prueba[i][1], texto(pred[i]), ws[i][:len(prueba[i][1])][:, :len(prueba[i][0])].tolist()) for i in range(12)]
    else:
        sin = [texto(pred[i]) for i in range(12)]
print("\nfechas exactas en la prueba según los pasos de entrenamiento:")
print(f"{'pasos':>8}" + "".join(f"{p:>8d}" for p in PASOS))
for nombre, c in curvas.items():
    print(f"{nombre[:20]:>20}" + "".join(f"{e:8.1%}" for _, e, _ in c))
print("\nejemplos (origen → destino, sin atención | con atención):")
for (s, t, p, w), q in zip(ejemplo[:5], sin[:5]):
    print(f"   {s:24} → {t}   {q} | {p}")
os.makedirs(os.path.join(RAIZ, "py", "out"), exist_ok=True)
json.dump({"ejemplos": [{"origen": s, "destino": t, "con": p, "sin": q, "atencion": [[round(x, 4) for x in f] for f in w]} for (s, t, p, w), q in zip(ejemplo, sin)],
           "resumen": {k: {"exactas": v[0], "caracteres": v[1]} for k, v in resultados.items()},
           "curvas": {k: [[a, round(b, 4)] for a, b, _ in v] for k, v in curvas.items()}},
          open(os.path.join(RAIZ, "py", "out", "29-s2s.json"), "w", encoding="utf-8"), ensure_ascii=False)
