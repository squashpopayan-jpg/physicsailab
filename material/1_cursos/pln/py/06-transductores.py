# Transductores de estados finitos: reglas ortográficas del español compiladas a autómatas de dos cintas.
# Cada arco es (estado, entrada, salida, estado); '' es ε. ^ marca frontera de morfemas y # frontera de palabra.
from collections import deque

VOC = set("aeiouáéíóúü")
CON = set("bcdfghjklmnñpqrstvwxyz")
ALF = sorted(VOC | CON) + ["^", "#"]


class FST:
    def __init__(self):
        self.arcos, self.finales, self.n = [], {0}, 1

    def estado(self, final=False):
        self.n += 1
        if final:
            self.finales.add(self.n - 1)
        return self.n - 1

    def arco(self, a, i, o, b):
        self.arcos.append((a, i, o, b))

    def aplicar(self, entrada, maxlen=40):
        """Todas las salidas posibles (el transductor es no determinista)."""
        por = {}
        for a in self.arcos:
            por.setdefault(a[0], []).append(a)
        vistos, salidas, cola = set(), set(), deque([(0, 0, "")])
        while cola:
            q, p, s = cola.popleft()
            if (q, p, s) in vistos:
                continue
            vistos.add((q, p, s))
            if p == len(entrada) and q in self.finales:
                salidas.add(s)
            for (_, i, o, b) in por.get(q, []):
                if i == "" or (p < len(entrada) and entrada[p] == i):
                    if len(s + o) <= maxlen:
                        cola.append((b, p + (i != ""), s + o))
        return sorted(salidas)


def regla_derecha(mapa, ctx):
    """a → b / _ contexto  (obligatoria): copia lo que no cambia, reescribe solo si sigue el contexto."""
    f = FST()
    need = [f.estado(False) for _ in ctx]
    avoid = [f.estado(True) for _ in ctx]

    def base(desde, x):
        if x in mapa:
            f.arco(desde, x, mapa[x], need[0]); f.arco(desde, x, x, avoid[0])
        else:
            f.arco(desde, x, x, 0)
    for x in ALF:
        base(0, x)
    for k, c in enumerate(ctx):
        for x in c:
            f.arco(need[k], x, x, need[k + 1] if k + 1 < len(ctx) else 0)
        for x in ALF:
            if x in c:
                if k + 1 < len(ctx):
                    f.arco(avoid[k], x, x, avoid[k + 1])
            else:
                base(avoid[k], x)
    return f


def inserta_e():
    """ε → e / consonante ^ _ s#"""
    f = FST()
    C1, C2 = f.estado(True), f.estado(True)
    E, S, S0 = f.estado(False), f.estado(False), f.estado(False)

    def base(d, x):
        f.arco(d, x, x, C1 if x in CON else 0)
    for x in ALF:
        base(0, x)
        if x == "^": f.arco(C1, x, x, C2)
        else: base(C1, x)
        if x == "s": f.arco(C2, x, x, S0)
        elif x != "^": base(C2, x)
        if x != "#": base(S0, x)
    f.arco(C2, "", "e", E); f.arco(E, "s", "s", S); f.arco(S, "#", "#", 0)
    return f


quitar = FST()
for x in sorted(VOC | CON):
    quitar.arco(0, x, x, 0)
quitar.arco(0, "^", "", 0); quitar.arco(0, "#", "", 0)

CASCADA = [("inserción de e", inserta_e()),
           ("z → c ante ^e", regla_derecha({"z": "c"}, [{"^"}, {"e"}])),
           ("pérdida de tilde", regla_derecha(dict(zip("áéíóú", "aeiou")), [{"n", "s"}, {"^"}, {"e"}])),
           ("quitar fronteras", quitar)]


def generar(inter):
    for _, t in CASCADA:
        s = t.aplicar(inter)
        assert len(s) == 1, (inter, s)
        inter = s[0]
    return inter


if __name__ == "__main__":
    print(f"transductor de inserción de e: {inserta_e().n} estados, {len(inserta_e().arcos)} arcos")
    for inter in ["lugar^s#", "padre^s#", "nuez^s#", "canción^s#", "lápiz^s#", "autobús^s#", "gat^as#", "cant^ábamos#"]:
        pasos, s = [inter], inter
        for nombre, t in CASCADA:
            s = t.aplicar(s)[0]; pasos.append(s)
        print(f"{inter:14} → " + " → ".join(pasos[1:]))
    print("\nla regla es obligatoria y no ambigua:", inserta_e().aplicar("lugar^s#"), inserta_e().aplicar("lugar^as#"))
    # sentido inverso: ¿qué intermedios producen «lugares»?
    candidatos = [f"lugar^{x}" for x in ["es#", "s#"]] + ["lugares#", "lugare^s#", "luga^res#"]
    print("intermedios que dan «lugares»:", [c for c in candidatos if generar(c) == "lugares"])
