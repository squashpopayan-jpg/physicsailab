# Dos ideas históricas en pocas líneas: la aproximación de Shannon al lenguaje
# (cadenas de Markov de caracteres) y un ELIZA mínimo. Solo biblioteca estándar.
import math, random, re
from collections import Counter, defaultdict

TEXTO = """El gato duerme en la alfombra roja. La niña lee un libro muy largo.
Mi hermano compró pan en la tienda del barrio. El perro corre por el parque cada mañana.
La profesora explica el tema con un ejemplo sencillo. Los estudiantes escriben un programa para contar palabras.
Hoy llueve mucho y las calles están mojadas. El tren sale de la estación a las ocho.
Mi madre prepara una sopa de verduras para la cena. El niño pequeño juega con una pelota azul.
La computadora procesa el texto en pocos segundos. Ella no quiere salir porque tiene mucho trabajo."""

s = re.sub(r"[^a-záéíóúüñ]+", " ", TEXTO.lower()).strip()
print(f"caracteres del texto normalizado: {len(s)}")


def modelo(k):
    m = defaultdict(Counter)
    for i in range(k, len(s)):
        m[s[i - k:i]][s[i]] += 1
    return m


def entropia(m):
    n = sum(sum(c.values()) for c in m.values())
    h = 0.0
    for c in m.values():
        t = sum(c.values())
        for v in c.values():
            h -= (v / n) * math.log2(v / t)
    return h


random.seed(7)
print("\norden k | contextos | H(X|k anteriores) bits/carácter | texto generado")
for k in range(0, 5):
    m = modelo(k)
    ctx, out = s[:k], s[:k]
    for _ in range(45):
        c = m.get(ctx)
        if not c:
            ctx = random.choice(list(m)); c = m[ctx]
        x = random.choices(list(c), weights=list(c.values()))[0]
        out += x
        ctx = (ctx + x)[1:] if k else ""
    print(f"   {k}    |   {len(m):4d}    |            {entropia(m):.3f}             | {out}")

# ---- ELIZA mínima: reglas de palabras clave + reflexión de pronombres ----
REFLEJO = {"yo": "usted", "me": "le", "mi": "su", "mis": "sus", "soy": "es", "estoy": "está", "tengo": "tiene"}
REGLAS = [
    (r"\b(madre|padre|hermano|hermana|familia)\b", "Hábleme más de su familia."),
    (r"\bme siento (.+)", "¿Por qué se siente {0}?"),
    (r"\bquiero (.+)", "¿Qué significaría para usted conseguir {0}?"),
    (r"\bporque (.+)", "¿Es esa la verdadera razón?"),
]


def responder(frase):
    t = frase.strip(" .!?¡¿")
    for patron, plantilla in REGLAS:
        m = re.search(patron, t, re.I)
        if m:
            g = " ".join(REFLEJO.get(w.lower(), w) for w in (m.group(1) if m.groups() else "").split())
            return plantilla.format(g)
    return "Siga, por favor."


print("\n--- ELIZA ---")
for frase in ["Me siento muy cansado", "Quiero mi descanso", "Mi madre no me entiende", "Hola"]:
    print("Usuario:", frase)
    print("ELIZA  :", responder(frase))
