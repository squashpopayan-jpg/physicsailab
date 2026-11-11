# ¿Procesamiento de datos o procesamiento de lenguaje?
# Solo biblioteca estándar de Python.
import re

texto = """María le dijo a Ana que ella había ganado el concurso.
Él la felicitó y se lo contó a su hermano; luego nos llamó a todos.
Ellos no lo sabían, pero usted sí.
La casa de tu hermano tiene los libros que ella le prestó."""

# 1) Procesamiento de datos ordinario: bytes, "palabras" separadas por espacios y líneas.
print("bytes   :", len(texto.encode("utf-8")))
print("palabras:", len(texto.split()))
print("líneas  :", len(texto.splitlines()))

# 2) Para contar pronombres hay que saber QUÉ es una palabra y QUÉ es un pronombre:
#    ya es conocimiento del lenguaje (morfología y léxico).
PRONOMBRES = {"yo", "tú", "tu", "él", "ella", "ello", "ellos", "ellas", "nosotros", "nos",
              "usted", "ustedes", "me", "te", "se", "lo", "la", "los", "las", "le", "les"}
palabras = re.findall(r"\w+", texto.lower())
print("\ntokens (letras):", len(palabras))
pron = [p for p in palabras if p in PRONOMBRES]
print("candidatos a pronombre:", len(pron), pron)

# 3) La lista no basta: «la» y «los» también son artículos; «tu» es posesivo.
#    Distinguir exige contexto (sintaxis). Mostramos las ocurrencias dudosas.
for m in re.finditer(r"\b(la|los|las|tu)\b", texto.lower()):
    ini = max(0, m.start() - 12)
    print(f"  «{m.group(0)}» en …{texto.lower()[ini:m.end() + 10].strip()}…".replace("\n", " "))
