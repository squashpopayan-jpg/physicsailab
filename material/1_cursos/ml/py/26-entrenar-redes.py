# Entrenar redes en la práctica: tasa de aprendizaje, regularización, dropout y parada temprana
import copy
import numpy as np
import torch
from torch import nn
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X, y = load_digits(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)
Xtr, Xva, ytr, yva = train_test_split(Xtr, ytr, test_size=0.25, stratify=ytr, random_state=0)
Xtr, Xva, ytr, yva = Xtr[:300], Xva, ytr[:300], yva          # pocos datos: así se nota el sobreajuste
sc = StandardScaler().fit(Xtr)
T = lambda a: torch.tensor(sc.transform(a), dtype=torch.float32)
Xtr_t, Xva_t, Xte_t = T(Xtr), T(Xva), T(Xte)
ytr_t, yva_t, yte_t = (torch.tensor(v) for v in (ytr, yva, yte))

def red(p_drop=0.0):
    return nn.Sequential(nn.Linear(64, 256), nn.ReLU(), nn.Dropout(p_drop),
                         nn.Linear(256, 256), nn.ReLU(), nn.Dropout(p_drop), nn.Linear(256, 10))

def entrenar(lr=1e-3, wd=0.0, p_drop=0.0, epocas=200, paciencia=None, coseno=False, semilla=0):
    torch.manual_seed(semilla)
    m = red(p_drop)
    opt = torch.optim.AdamW(m.parameters(), lr=lr, weight_decay=wd)
    sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, epocas) if coseno else None
    f = nn.CrossEntropyLoss()
    mejor, mejor_ep, estado, hist = np.inf, 0, None, []
    for ep in range(epocas):
        m.train()
        for idx in torch.randperm(len(Xtr_t)).split(32):
            opt.zero_grad(); f(m(Xtr_t[idx]), ytr_t[idx]).backward(); opt.step()
        if sch: sch.step()
        m.eval()
        with torch.no_grad():
            ltr, lva = f(m(Xtr_t), ytr_t).item(), f(m(Xva_t), yva_t).item()
        hist.append((ltr, lva))
        if not np.isfinite(lva): break
        if lva < mejor: mejor, mejor_ep, estado = lva, ep, copy.deepcopy(m.state_dict())
        if paciencia and ep - mejor_ep >= paciencia: break
    final = (m(Xte_t).argmax(1) == yte_t).float().mean().item()
    m.load_state_dict(estado)                                    # restaurar los mejores pesos
    with torch.no_grad():
        acc = (m(Xte_t).argmax(1) == yte_t).float().mean().item()
    return hist, mejor_ep, acc, final

print("1) Tasa de aprendizaje (Adam, 60 épocas): pérdida de entrenamiento por época")
for lr in [1e-5, 1e-3, 1e-1, 1.0]:
    h, _, _, fin = entrenar(lr=lr, epocas=60)
    print(f"  lr = {lr:6g}: época 1 = {h[0][0]:8.3f}   época 10 = {h[min(9, len(h) - 1)][0]:8.3f}   época 60 = {h[-1][0]:8.3f}   exactitud final = {fin:.3f}")

print("\n2) Regularización (200 épocas, 300 imágenes de entrenamiento)")
print("   configuración              mejor época   val. mínima   val. final   prueba (mejores pesos)")
for nombre, kw in [("sin regularizar", {}), ("weight decay 0.1", {"wd": 0.1}), ("dropout 0.5", {"p_drop": 0.5}),
                   ("dropout + weight decay", {"p_drop": 0.5, "wd": 0.1}), ("parada temprana (20)", {"paciencia": 20}),
                   ("coseno + dropout", {"p_drop": 0.5, "coseno": True, "lr": 3e-3})]:
    h, be, acc, _ = entrenar(**kw)
    print(f"   {nombre:24s}  {be + 1:9d}    {min(v for _, v in h):10.3f}   {h[-1][1]:10.3f}   {acc:10.3f}   ({len(h)} épocas)")
