# Tokenización, stemming (Snowball) y lematización por diccionario. Requiere: pip install nltk regex
import regex
from nltk.stem.snowball import SnowballStemmer

texto = "El profesor Sr. Pérez pagó $1.234,50 al banco del barrio; escribe a ana@uni.edu.co. ¿Vamos al parque? ¡Sí!"

# 1) Cuatro formas de dividir el mismo texto
espacios = texto.split()
solo_w = regex.findall(r"\w+", texto)                       # \w es Unicode en Python (en JavaScript es solo ASCII)
letras = regex.findall(r"\p{L}+", texto)
completo = regex.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+|\d+(?:[.,]\d+)*|\p{L}+|[^\s\p{L}\p{N}]", texto)
for nombre, t in [("split()", espacios), (r"\w+", solo_w), (r"\p{L}+", letras), ("palabras y signos", completo)]:
    print(f"{nombre:18} {len(t):3d} tokens: {t[:9]}...")
contraidas = [t for t in completo if t.lower() in ("del", "al")]
print("contracciones que un buen tokenizador separa:", contraidas, "→ de+el, a+el")

# 2) Stemming: Snowball español (el mismo de los cuadernos de Colab)
st = SnowballStemmer("spanish")
familias = {
    "cantar": ["cantar", "canto", "cantas", "cantábamos", "cantaré", "cantó", "cantando", "cantado"],
    "comer": ["comer", "como", "comemos", "comían", "comeré", "comió", "comiendo"],
    "gato": ["gato", "gata", "gatos", "gatas", "gatito"],
    "universidad": ["universidad", "universidades", "universal", "universitario", "universo"],
    "nación": ["nación", "naciones", "nacional", "nacionalidad", "nacionalmente"],
}
print()
for fam, formas in familias.items():
    print(f"{fam:12}", {w: st.stem(w) for w in formas})

# 3) Lematización con un diccionario: devuelve palabras reales, pero hay que construirlo
LEMAS = {"cantábamos": "cantar", "cantaré": "cantar", "cantó": "cantar", "canto": "cantar|canto", "vino": "venir|vino",
         "gatas": "gato", "naciones": "nación", "universidades": "universidad", "comían": "comer", "fue": "ser|ir"}
print()
for w, l in LEMAS.items():
    s = st.stem(w)
    print(f"{w:14} raíz Snowball: {s:10} lema(s): {l}")
