# Atención de producto escalar, codificación posicional, temperatura y un bloque transformer
import numpy as np
import torch
from torch import nn

np.set_printoptions(precision=3, suppress=True)
rng = np.random.default_rng(0)

# 1) Atención de producto escalar escalado, paso a paso
tokens = ["el", "gato", "come", "pescado"]
d = 4
X = rng.normal(size=(4, d))                      # embeddings de entrada (4 tokens × d)
Wq, Wk, Wv = (rng.normal(size=(d, d)) / np.sqrt(d) for _ in range(3))
Q, K, V = X @ Wq, X @ Wk, X @ Wv
S = Q @ K.T / np.sqrt(d)                         # puntajes de compatibilidad
A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)   # softmax por filas
print("pesos de atención (fila = token que pregunta, columna = token consultado):")
print("         " + "  ".join(f"{t:>7s}" for t in tokens))
for t, fila in zip(tokens, A):
    print(f"{t:>8s} " + "  ".join(f"{v:7.3f}" for v in fila))
print("cada fila suma:", A.sum(1))
Y = A @ V
print("salida = A·V, forma:", Y.shape)

# Máscara causal: un token solo puede mirar a los anteriores (modelos de lenguaje)
Sc = S + np.triu(np.full((4, 4), -np.inf), 1)
Ac = np.exp(Sc - Sc.max(1, keepdims=True)); Ac /= Ac.sum(1, keepdims=True)
print("\ncon máscara causal:\n", Ac)

# 2) Por qué se divide por √d: sin escalar, el softmax se satura en dimensión alta
for dd in [4, 64, 512]:
    q, k = rng.normal(size=(1000, dd)), rng.normal(size=(1000, dd))
    s = (q * k).sum(1)
    print(f"d = {dd:3d}: desviación de q·k = {s.std():6.2f}   escalado por √d = {(s / np.sqrt(dd)).std():.2f}")

# 3) Codificación posicional sinusoidal (Vaswani y colaboradores, 2017)
def pos_enc(n, d):
    pos, i = np.arange(n)[:, None], np.arange(d // 2)[None, :]
    ang = pos / 10000 ** (2 * i / d)
    return np.concatenate([np.sin(ang), np.cos(ang)], 1)
P = pos_enc(50, 16)
sim = P @ P.T
print(f"\nsimilitud entre codificaciones posicionales: pos 10 con 10 = {sim[10, 10]:.2f}, con 11 = {sim[10, 11]:.2f}, con 20 = {sim[10, 20]:.2f}, con 40 = {sim[10, 40]:.2f}")

# 4) Temperatura al muestrear el siguiente token
logits = np.array([3.0, 2.0, 1.0, 0.5, -1.0])
for T in [0.2, 0.7, 1.0, 2.0]:
    p = np.exp(logits / T); p /= p.sum()
    H = -(p * np.log(p)).sum()
    print(f"T = {T:3.1f}: probabilidades = {np.round(p, 3)}   entropía = {H:.2f}")

# 5) Un bloque transformer de PyTorch: formas y parámetros
torch.manual_seed(0)
capa = nn.TransformerEncoderLayer(d_model=64, nhead=4, dim_feedforward=256, batch_first=True)
x = torch.randn(2, 10, 64)                        # 2 secuencias de 10 tokens, d = 64
print(f"\nbloque transformer: entrada {tuple(x.shape)} → salida {tuple(capa(x).shape)}")
print("parámetros:", sum(p.numel() for p in capa.parameters()),
      "  (atención:", sum(p.numel() for p in capa.self_attn.parameters()), " · red densa:",
      sum(p.numel() for n, p in capa.named_parameters() if n.startswith("linear")), ")")
