# Retropropagación a mano frente a autograd, y gradientes que se desvanecen
import numpy as np
import torch
from torch import nn

# 1) Una red 2–2–1 con sigmoide, calculada a mano (hacia delante y hacia atrás)
x = np.array([0.5, -1.0]); y = 1.0
W1 = np.array([[0.3, -0.2], [0.8, 0.4]]); b1 = np.array([0.1, -0.1])
W2 = np.array([[1.2, -0.7]]); b2 = np.array([0.05])
sig = lambda z: 1 / (1 + np.exp(-z))
z1 = W1 @ x + b1; a1 = sig(z1)              # capa oculta
z2 = W2 @ a1 + b2; p = sig(z2)[0]           # salida
L = -(y * np.log(p) + (1 - y) * np.log(1 - p))
print(f"hacia delante: z1 = {np.round(z1, 4)}, a1 = {np.round(a1, 4)}, p = {p:.4f}, pérdida = {L:.4f}")
d2 = p - y                                   # ∂L/∂z2 (sigmoide + entropía cruzada)
gW2 = d2 * a1; gb2 = d2
d1 = (W2[0] * d2) * a1 * (1 - a1)            # regla de la cadena: δ1 = W2ᵀ δ2 ⊙ σ'(z1)
gW1 = np.outer(d1, x); gb1 = d1
print(f"hacia atrás:   δ2 = {d2:.4f}, δ1 = {np.round(d1, 4)}")
print("∂L/∂W1 a mano:\n", np.round(gW1, 6))

# 2) Lo mismo con autograd de PyTorch
t = lambda a: torch.tensor(a, dtype=torch.float64, requires_grad=True)
tW1, tb1, tW2, tb2 = t(W1), t(b1), t(W2), t(b2)
tp = torch.sigmoid(tW2 @ torch.sigmoid(tW1 @ torch.tensor(x) + tb1) + tb2)
tL = -(y * torch.log(tp) + (1 - y) * torch.log(1 - tp)).sum()
tL.backward()
print("∂L/∂W1 con autograd:\n", np.round(tW1.grad.numpy(), 6))
print("diferencia máxima:", np.abs(tW1.grad.numpy() - gW1).max())

# 3) Comprobación numérica (diferencias centradas)
def perdida(W1v):
    a = sig(W1v @ x + b1); q = sig(W2 @ a + b2)[0]
    return -(y * np.log(q) + (1 - y) * np.log(1 - q))
h = 1e-6
num = np.zeros_like(W1)
for i in range(2):
    for j in range(2):
        E = np.zeros_like(W1); E[i, j] = h
        num[i, j] = (perdida(W1 + E) - perdida(W1 - E)) / (2 * h)
print("error relativo frente a diferencias finitas:", np.abs(num - gW1).max() / np.abs(gW1).max())

# 4) Gradientes por capa en una red de 10 capas ocultas
torch.manual_seed(0)
Xb = torch.randn(256, 20); yb = (Xb[:, 0] * Xb[:, 1] > 0).float()
print("\nnorma media del gradiente de los pesos de cada capa (capa 1 = la más cercana a la entrada)")
for act, init in [("sigmoide", "normal(0, 0.1)"), ("sigmoide", "Xavier"), ("tanh", "Xavier"), ("ReLU", "He")]:
    capas = []
    for i in range(10):
        lin = nn.Linear(20 if i == 0 else 64, 64)
        if init == "normal(0, 0.1)": nn.init.normal_(lin.weight, 0, 0.1)
        elif init == "Xavier": nn.init.xavier_normal_(lin.weight)
        else: nn.init.kaiming_normal_(lin.weight, nonlinearity="relu")
        nn.init.zeros_(lin.bias)
        capas += [lin, {"sigmoide": nn.Sigmoid(), "tanh": nn.Tanh(), "ReLU": nn.ReLU()}[act]]
    red = nn.Sequential(*capas, nn.Linear(64, 1))
    nn.functional.binary_cross_entropy_with_logits(red(Xb).squeeze(1), yb).backward()
    g = [m.weight.grad.norm().item() / m.weight.numel() ** 0.5 for m in red if isinstance(m, nn.Linear)][:10]
    print(f"  {act:8s} + {init:14s}: capa 1 = {g[0]:.1e}   capa 5 = {g[4]:.1e}   capa 10 = {g[9]:.1e}   razón 10/1 = {g[9] / g[0]:.1e}")
