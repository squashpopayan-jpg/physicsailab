# Limpieza, palabras vacías y ley de Zipf con las 360 opiniones sintéticas del curso.
# Solo biblioteca estándar + NumPy. Los datos son los de los cuadernos de Colab (data/opiniones.csv).
import csv, html, re, unicodedata
from collections import Counter
import numpy as np

with open("../data/opiniones.csv", encoding="utf-8-sig", newline="") as f:
    filas = list(csv.DictReader(f))
textos = [r["texto"] for r in filas]
print("opiniones:", len(textos), "| positivas:", sum(r["etiqueta"] == "positivo" for r in filas))

STOP = set("a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era eran es esa esas ese esos esta estas este esto estos fue fueron ha hay hasta la las le les lo los mas me mi mis muy no nos o para pero por porque que quien quienes se ser si sin sobre su sus te tiene todo todos tu tus un una unas uno unos y ya yo".split())


def limpiar(texto, quitar_puntuacion=False):
    texto = html.unescape(str(texto))
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = re.sub(r"https?://\S+|www\.\S+", " URL ", texto)
    texto = texto.lower()
    if quitar_puntuacion:
        texto = re.sub(r"[^\w\sáéíóúüñ]", " ", texto, flags=re.UNICODE)
    return re.sub(r"\s+", " ", texto).strip()


for s in ["<p>¡NO me gustó!</p>", "Visita https://ejemplo.org ahora", "¡Está BIEN! 😊"]:
    print(repr(s), "→", repr(limpiar(s)), "| sin puntuación:", repr(limpiar(s, True)))

# --- Tokens, tipos y efecto de las palabras vacías ---
tok = [p for t in textos for p in re.findall(r"[^\W\d_]+", limpiar(t))]
sin = [p for p in tok if p not in STOP]
print(f"\ntokens: {len(tok)} | tipos: {len(set(tok))} | sin palabras vacías: {len(sin)} tokens, {len(set(sin))} tipos")
print("10 más frecuentes (con vacías):", Counter(tok).most_common(10))
print("10 más frecuentes (sin vacías):", Counter(sin).most_common(10))

# --- Las negaciones: ¿qué pasa si se eliminan las palabras vacías? ---
neg = [r for r in filas if re.search(r"\b(no|sin)\b", limpiar(r["texto"]))]
print(f"\nopiniones con «no» o «sin»: {len(neg)} (positivas: {sum(r['etiqueta']=='positivo' for r in neg)})")
for r in neg[:3]:
    t = limpiar(r["texto"], True).split()
    print(" ", r["etiqueta"].ljust(8), r["texto"], "→", " ".join(p for p in t if p not in STOP))

# --- Ley de Zipf: log10 frecuencia = a + b log10 rango ---
fr = sorted(Counter(tok).values(), reverse=True)
x, y = np.log10(np.arange(1, len(fr) + 1)), np.log10(fr)
b, a = np.polyfit(x, y, 1)
print(f"\nZipf: pendiente b = {b:.3f}, a = {a:.3f}, R² = {np.corrcoef(x, y)[0,1]**2:.3f}; "
      f"la palabra más frecuente aparece {fr[0]} veces y el {100*sum(1 for v in fr if v==1)/len(fr):.0f} % de los tipos aparece una sola vez")
