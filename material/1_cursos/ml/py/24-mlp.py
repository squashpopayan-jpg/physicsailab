# Del perceptrón a la red multicapa: XOR, MLPClassifier y un bucle de entrenamiento en PyTorch
import numpy as np
import torch
from torch import nn
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Perceptron, LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# 1) XOR: ningún modelo lineal lo resuelve; una capa oculta sí
Xx = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], float); yx = np.array([0, 1, 1, 0])
print("XOR, exactitud del perceptrón:", Perceptron(max_iter=1000, random_state=0).fit(Xx, yx).score(Xx, yx))
mlp = MLPClassifier(hidden_layer_sizes=(4,), activation="tanh", solver="lbfgs", random_state=1, max_iter=2000).fit(Xx, yx)
print("XOR, exactitud de una red 2–4–1:", mlp.score(Xx, yx), "  predicciones:", mlp.predict(Xx))

# 2) Lunas: tamaño de la red y regularización
X, y = make_moons(1000, noise=0.25, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=0)
print(f"\nlogística lineal: prueba = {LogisticRegression().fit(Xtr, ytr).score(Xte, yte):.3f}")
for capas in [(2,), (8,), (32,), (32, 32), (128, 128)]:
    m = make_pipeline(StandardScaler(), MLPClassifier(capas, alpha=1e-4, max_iter=3000, random_state=0)).fit(Xtr, ytr)
    n_par = sum(w.size for w in m[-1].coefs_) + sum(b.size for b in m[-1].intercepts_)
    print(f"capas ocultas {str(capas):11s} ({n_par:6d} parámetros): entrenamiento = {m.score(Xtr, ytr):.3f}   prueba = {m.score(Xte, yte):.3f}")

# 3) El mismo modelo en PyTorch, con el bucle de entrenamiento explícito
torch.manual_seed(0)
sc = StandardScaler().fit(Xtr)
Xt = torch.tensor(sc.transform(Xtr), dtype=torch.float32); yt = torch.tensor(ytr, dtype=torch.float32)
Xv = torch.tensor(sc.transform(Xte), dtype=torch.float32); yv = torch.tensor(yte, dtype=torch.float32)
red = nn.Sequential(nn.Linear(2, 32), nn.ReLU(), nn.Linear(32, 32), nn.ReLU(), nn.Linear(32, 1))
opt = torch.optim.Adam(red.parameters(), lr=1e-2)
perdida = nn.BCEWithLogitsLoss()                 # sigmoide + entropía cruzada, numéricamente estable
print(f"\nPyTorch: {sum(p.numel() for p in red.parameters())} parámetros")
for epoca in range(201):
    red.train()
    for idx in torch.randperm(len(Xt)).split(64):   # mini-lotes de 64
        opt.zero_grad()
        l = perdida(red(Xt[idx]).squeeze(1), yt[idx])
        l.backward()                                 # retropropagación
        opt.step()                                   # actualización de Adam
    if epoca % 50 == 0:
        red.eval()
        with torch.no_grad():
            lv = perdida(red(Xv).squeeze(1), yv).item()
            acc = ((red(Xv).squeeze(1) > 0).float() == yv).float().mean().item()
        print(f"  época {epoca:3d}: pérdida de entrenamiento = {l.item():.3f}   validación = {lv:.3f}   exactitud = {acc:.3f}")
