# Análisis semántico dirigido por la sintaxis con NLTK: gramática con atributos SEM (λ-cálculo) y almacenamiento de Cooper.
import nltk
from nltk import grammar
from nltk.parse.featurechart import FeatureChartParser, FeatureChart
from nltk.parse import load_parser
from nltk.sem import root_semrep, cooper_storage as cs

# 1) Una gramática del español con anotaciones semánticas (hipótesis «regla a regla»)
G = grammar.FeatureGrammar.fromstring(r"""
% start S
S[SEM=<?sn(?sv)>]  -> SN[SEM=?sn] SV[SEM=?sv]
SN[SEM=<?d(?n)>]   -> Det[SEM=?d] N[SEM=?n]
SN[SEM=?np]        -> Nom[SEM=?np]
SV[SEM=<?v(?sn)>]  -> VT[SEM=?v] SN[SEM=?sn]
SV[SEM=?v]         -> VI[SEM=?v]
Det[SEM=<\P Q.all x.(P(x) -> Q(x))>]    -> 'todo'
Det[SEM=<\P Q.exists x.(P(x) & Q(x))>]  -> 'un'
Det[SEM=<\P Q.-exists x.(P(x) & Q(x))>] -> 'ningún'
N[SEM=<\x.estudiante(x)>] -> 'estudiante'
N[SEM=<\x.libro(x)>]      -> 'libro'
Nom[SEM=<\P.P(marta)>]    -> 'marta'
Nom[SEM=<\P.P(juan)>]     -> 'juan'
VT[SEM=<\X x.X(\y.lee(x,y))>] -> 'lee'
VI[SEM=<\x.duerme(x)>]        -> 'duerme'
""")
parser = FeatureChartParser(G)
for frase in ["juan duerme", "marta lee un libro", "todo estudiante lee un libro", "ningún estudiante duerme"]:
    for arbol in parser.parse(frase.split()):
        sem = root_semrep(arbol)
        print(f"{frase:32} → {sem.simplify()}")

# 2) Una oración con dos cuantificadores tiene dos lecturas: almacenamiento de Cooper (gramática del libro de NLTK, en inglés)
p = load_parser('grammars/book_grammars/storage.fcfg', trace=0, chart_class=FeatureChart)
arbol = next(p.parse('every girl chases a dog'.split()))
almacen = cs.CooperStore(arbol.label()['SEM'])
almacen.s_retrieve(trace=False)
print("every girl chases a dog:")
for i, lectura in enumerate(almacen.readings, 1):
    print(f"  lectura {i}: {lectura}")
