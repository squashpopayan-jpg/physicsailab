# Dependencias: transiciones arc-standard con oráculo estático y decodificación por grafos (árbol de expansión máximo).
import random
import networkx as nx

# oración: El gato duerme en la alfombra roja .   (cabeza de cada palabra; 0 = raíz)
palabras = "El gato duerme en la alfombra roja .".split()
cabeza = [2, 3, 0, 6, 6, 3, 6, 3]
rel = "det nsubj root case det obl amod punct".split()


def oraculo(h):
    n = len(h); pila, buf, tr = [0], list(range(1, n + 1)), []
    pend = [sum(x == 0 for x in h)] + [sum(x == i + 1 for x in h) for i in range(n)]
    while buf or len(pila) > 1:
        s0, s1 = pila[-1], (pila[-2] if len(pila) > 1 else None)
        if s1 not in (None, 0) and h[s1 - 1] == s0: tr.append("LEFT-ARC"); del pila[-2]; pend[s0] -= 1
        elif s1 is not None and h[s0 - 1] == s1 and pend[s0] == 0: tr.append("RIGHT-ARC"); pila.pop(); pend[s1] -= 1
        else: tr.append("SHIFT"); pila.append(buf.pop(0))
    return tr


t = oraculo(cabeza)
print(f"{len(palabras)} palabras → {len(t)} transiciones (siempre 2n): {t}")
print("proyectivo, porque las transiciones lo reconstruyen sin cruces")

# decodificación por grafos: arco h→d con puntuación; se elige el árbol de mayor suma
rnd = random.Random(1)
n = len(palabras)
G = nx.DiGraph()
for h in range(n + 1):
    for d in range(1, n + 1):
        if h != d:
            base = 2.0 if cabeza[d - 1] == h else 0.0     # puntuación que favorece el árbol correcto
            G.add_edge(h, d, weight=base + rnd.uniform(-3, 3))
T = nx.maximum_spanning_arborescence(G, attr="weight")
pred = [next(u for u, v in T.edges() if v == d) for d in range(1, n + 1)]
print("\ncabezas de referencia:", cabeza)
print("cabezas decodificadas :", pred)
uas = sum(p == g for p, g in zip(pred, cabeza)) / n
print(f"UAS = {100*uas:.1f} %  ({sum(p == g for p, g in zip(pred, cabeza))} de {n} cabezas correctas)")
pesos = [G[h][d]["weight"] for d, h in enumerate(pred, 1)]
print(f"peso del árbol decodificado: {sum(pesos):.2f}")

