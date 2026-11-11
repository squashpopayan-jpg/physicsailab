# Gramática libre de contexto del curso con NLTK: árboles, ambigüedad y número de análisis.
# Requiere: pip install nltk
import nltk

GRAMATICA = """
S -> SN SV
SN -> Det N | N | Pron | SN SP | SN Adj | SN Conj SN
SV -> V | V SN | V Adj | SV SP
SP -> P SN
Det -> 'el' | 'la' | 'los' | 'las' | 'un' | 'una' | 'mi'
N -> 'niño' | 'niña' | 'gato' | 'perro' | 'casa' | 'parque' | 'telescopio' | 'hombres' | 'mujeres' | 'libro' | 'elefante' | 'pijama' | 'profesor' | 'estudiantes' | 'texto'
Pron -> 'yo'
Adj -> 'grande' | 'roja' | 'mayores' | 'viejo' | 'nuevo'
V -> 'vi' | 'vio' | 've' | 'tiene' | 'lee' | 'leen' | 'es' | 'disparé'
P -> 'con' | 'en' | 'de' | 'por'
Conj -> 'y'
"""
g = nltk.CFG.fromstring(GRAMATICA)
print(f"{len(g.productions())} producciones; {len(g._lhs_index)} símbolos con reglas; símbolo inicial: {g.start()}")
parser = nltk.ChartParser(g)

frases = ["la niña lee un libro", "yo vi un elefante en mi pijama", "hombres y mujeres mayores leen",
          "el niño ve un gato grande con un telescopio en el parque", "libro la niña un lee"]
for f in frases:
    arboles = list(parser.parse(f.split()))
    print(f"\n«{f}»: {len(arboles)} análisis")
    for t in arboles[:2]:
        print("  ", t.pformat(margin=200).replace("\n", " ").replace("  ", " "))

print("\nárbol de «la niña lee un libro»:")
list(parser.parse("la niña lee un libro".split()))[0].pretty_print()
