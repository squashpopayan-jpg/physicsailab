# Redes convolucionales en PyTorch: parámetros, tamaños de salida, exactitud y aumento de datos
import numpy as np
import torch
from torch import nn
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

torch.manual_seed(0)
X, y = load_digits(return_X_y=True)
X = (X / 16.0).astype(np.float32).reshape(-1, 1, 8, 8)       # (N, canales, alto, ancho)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.4, stratify=y, random_state=0)
Xtr, ytr = torch.tensor(Xtr), torch.tensor(ytr)
Xte, yte = torch.tensor(Xte), torch.tensor(yte)

cnn = nn.Sequential(
    nn.Conv2d(1, 16, kernel_size=3, padding=1), nn.ReLU(),    # 16 filtros 3×3: (16, 8, 8)
    nn.MaxPool2d(2),                                          # (16, 4, 4)
    nn.Conv2d(16, 32, kernel_size=3, padding=1), nn.ReLU(),   # (32, 4, 4)
    nn.MaxPool2d(2),                                          # (32, 2, 2)
    nn.Flatten(), nn.Linear(32 * 2 * 2, 10))
mlp = nn.Sequential(nn.Flatten(), nn.Linear(64, 128), nn.ReLU(), nn.Linear(128, 10))
contar = lambda m: sum(p.numel() for p in m.parameters())

x = torch.zeros(1, 1, 8, 8)
for capa in cnn:
    x = capa(x)
    print(f"{capa.__class__.__name__:10s} → salida {tuple(x.shape[1:])}")
print(f"\nparámetros: CNN = {contar(cnn)}   MLP 64–128–10 = {contar(mlp)}")
print(f"  primera convolución: 16 filtros × (3×3×1) + 16 sesgos = {16 * 9 + 16}")

def desplazar(Xs, dx, dy):
    """Desplaza las imágenes dx, dy píxeles rellenando con ceros (sin dar la vuelta)."""
    P = nn.functional.pad(Xs, (1, 1, 1, 1))
    return P[:, :, 1 - dy:9 - dy, 1 - dx:9 - dx]

def entrenar(modelo, Xa, ya, epocas=60, aumentar=False):
    opt = torch.optim.Adam(modelo.parameters(), lr=3e-3)
    f = nn.CrossEntropyLoss()
    for ep in range(epocas):
        modelo.train()
        for idx in torch.randperm(len(Xa)).split(64):
            xb = Xa[idx]
            if aumentar:                                        # desplazamientos aleatorios de ±1 píxel
                dx, dy = np.random.randint(-1, 2, 2)
                xb = desplazar(xb, int(dx), int(dy))
            opt.zero_grad(); f(modelo(xb), ya[idx]).backward(); opt.step()
    modelo.eval()
    with torch.no_grad():
        return (modelo(Xte).argmax(1) == yte).float().mean().item()


print("\nexactitud de prueba (entrenando con todo el conjunto de entrenamiento):")
for nombre, m in [("MLP", mlp), ("CNN", cnn)]:
    acc = entrenar(m, Xtr, ytr)
    with torch.no_grad():
        acc_d = (m(desplazar(Xte, 1, 1)).argmax(1) == yte).float().mean().item()
    print(f"  {nombre}: {acc:.3f}   con las imágenes de prueba desplazadas 1 píxel: {acc_d:.3f}")

np.random.seed(0)
torch.manual_seed(1)
cnn_aum = nn.Sequential(nn.Conv2d(1, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2), nn.Conv2d(16, 32, 3, padding=1),
                        nn.ReLU(), nn.MaxPool2d(2), nn.Flatten(), nn.Linear(128, 10))
acc = entrenar(cnn_aum, Xtr, ytr, aumentar=True)
with torch.no_grad():
    acc_d = (cnn_aum(desplazar(Xte, 1, 1)).argmax(1) == yte).float().mean().item()
print(f"  CNN con aumento de datos (desplazamientos aleatorios): {acc:.3f}   desplazadas 1 píxel: {acc_d:.3f}")
