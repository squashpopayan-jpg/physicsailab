# Herramientas de PLN en Python: versiones instaladas y una medición de velocidad de tres formas de tokenizar el mismo texto.
import importlib, re, time
from nltk.corpus import cess_esp
from nltk.tokenize import wordpunct_tokenize, word_tokenize

for m in ("nltk", "sklearn", "gensim", "torch", "tiktoken", "sacrebleu", "rdflib"):
    try: print(f"{m:10} {importlib.import_module(m).__version__}")
    except Exception as e: print(f"{m:10} no instalado")
for m in ("spacy", "stanza", "transformers"):
    try: importlib.import_module(m); print(f"{m:10} instalado")
    except ImportError: print(f"{m:10} no instalado (se instalaría con pip)")

texto = " ".join(" ".join(s) for s in cess_esp.sents()[:3000])
print(f"\ntexto de prueba: {len(texto)} caracteres, {len(texto.split())} palabras separadas por espacios")
for nombre, f in [("split()", str.split), ("expresión regular \w+", lambda t: re.findall(r"\w+|[^\w\s]", t)), ("nltk wordpunct_tokenize", wordpunct_tokenize), ("nltk word_tokenize", lambda t: word_tokenize(t, language="spanish"))]:
    t0 = time.perf_counter(); r = f(texto); dt = time.perf_counter() - t0
    print(f"{nombre:26} {len(r):7d} tokens en {dt * 1000:7.1f} ms ({len(r) / dt / 1e6:5.2f} millones de tokens/s)")
