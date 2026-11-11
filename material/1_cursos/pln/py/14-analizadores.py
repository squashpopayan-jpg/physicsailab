# Estrategias de análisis sintáctico con NLTK: descendente, ascendente, tabla (CKY/gráfico) y Earley.
import nltk

CON_RECURSION_IZQ = """
S -> SN SV
SN -> Det N | N | SN SP | SN Adj
SV -> V | V SN | SV SP
SP -> P SN
Det -> 'el' | 'un' | 'mi'
N -> 'niño' | 'gato' | 'telescopio' | 'parque'
Adj -> 'grande'
V -> 've'
P -> 'con' | 'en'
"""
SIN_RECURSION_IZQ = """
S -> SN SV
SN -> Det N | N | Det N SP | Det N Adj
SV -> V | V SN | V SN SP
SP -> P SN
Det -> 'el' | 'un' | 'mi'
N -> 'niño' | 'gato' | 'telescopio' | 'parque'
Adj -> 'grande'
V -> 've'
P -> 'con' | 'en'
"""
frase = "el niño ve un gato con un telescopio en el parque".split()

g1 = nltk.CFG.fromstring(CON_RECURSION_IZQ)
g2 = nltk.CFG.fromstring(SIN_RECURSION_IZQ)

try:
    list(nltk.RecursiveDescentParser(g1).parse(frase))
    print("descendente con recursión izquierda: terminó")
except (RecursionError, TimeoutError) as e:
    print(f"descendente con recursión izquierda (SN -> SN SP): no termina ({type(e).__name__})")

arboles = list(nltk.RecursiveDescentParser(g2).parse(frase))
print(f"descendente con la gramática sin recursión izquierda: {len(arboles)} análisis")

for nombre, parser in [("ascendente (bottom-up)", nltk.BottomUpChartParser(g1)), ("tabla de gráfico (CKY-like)", nltk.ChartParser(g1)),
                       ("Earley", nltk.EarleyChartParser(g1))]:
    chart = parser.chart_parse(frase)
    print(f"{nombre:28} {len(list(chart.parses(g1.start()))):2d} análisis, {chart.num_edges():4d} arcos en la tabla")

# la tabla comparte subárboles: el número de análisis crece como Catalan, el tamaño de la tabla casi no
print("\nPP encadenados: análisis (Catalan) y arcos de la tabla")
for n in range(1, 7):
    f = "el niño ve un gato".split() + ["con", "un", "telescopio"] * n
    # n sintagmas preposicionales con la misma preposición
    ch = nltk.ChartParser(g1).chart_parse(f)
    print(f"  n={n}: {len(list(ch.parses(g1.start()))):4d} análisis, {ch.num_edges():4d} arcos")

