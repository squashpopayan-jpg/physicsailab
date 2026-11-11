# Estructuras de rasgos y unificación con NLTK; una gramática con concordancia.
import nltk
from nltk.featstruct import FeatStruct

f = lambda s: FeatStruct(s)
linea = lambda x: " ".join(str(x).split())
print("unificar [gen=fem, num=?n] con [num=sg]     →", linea(f("[gen='fem', num=?n]").unify(f("[num='sg']"))))
print("unificar [num=sg] con [num=pl]              →", linea(f("[num='sg']").unify(f("[num='pl']"))))
print("unificar [agr=[gen=fem]] con [agr=[num=sg]] →", linea(f("[agr=[gen='fem']]").unify(f("[agr=[num='sg']]"))))
print("unificar [a=?x, b=?x] con [a=1, b=2]        →", linea(f("[a=?x, b=?x]").unify(f("[a=1, b=2]"))))

GRAMATICA = r"""
% start S
S -> SN[NUM=?n, PER=?p] SV[NUM=?n, PER=?p]
SN[NUM=?n, GEN=?g, PER=3] -> Det[NUM=?n, GEN=?g] N[NUM=?n, GEN=?g]
SN[NUM=sg, PER=?p] -> Pron[PER=?p]
SV[NUM=?n, PER=?p] -> V[NUM=?n, PER=?p, TR=no]
SV[NUM=?n, PER=?p] -> V[NUM=?n, PER=?p, TR=si] SN[]
Det[NUM=sg, GEN=fem] -> 'la' | 'una'
Det[NUM=sg, GEN=masc] -> 'el' | 'un'
Det[NUM=pl, GEN=fem] -> 'las'
Det[NUM=pl, GEN=masc] -> 'los'
N[NUM=sg, GEN=fem] -> 'niña' | 'casa'
N[NUM=pl, GEN=fem] -> 'niñas' | 'casas'
N[NUM=sg, GEN=masc] -> 'gato' | 'libro'
N[NUM=pl, GEN=masc] -> 'gatos' | 'libros'
Pron[PER=1] -> 'yo'
V[NUM=sg, PER=3, TR=si] -> 'lee'
V[NUM=pl, PER=3, TR=si] -> 'leen'
V[NUM=sg, PER=1, TR=si] -> 'leo'
V[NUM=sg, PER=3, TR=no] -> 'duerme'
V[NUM=pl, PER=3, TR=no] -> 'duermen'
"""
g = nltk.grammar.FeatureGrammar.fromstring(GRAMATICA)
parser = nltk.parse.FeatureChartParser(g)
casos = ["la niña lee un libro", "las niña lee un libro", "los gatos duermen", "los gatos duerme", "yo leo un libro", "yo lee un libro",
         "el gato duerme un libro", "los niñas leen los libros"]
print()
for c in casos:
    try:
        n = len(list(parser.parse(c.split())))
    except ValueError as e:
        n = 0
    print(f"{c:28} {'se acepta ' if n else 'se rechaza'} ({n} análisis)")

