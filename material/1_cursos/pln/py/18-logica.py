# Lógica de primer orden con NLTK: evaluar fórmulas en modelos y demostrar consecuencias.
from nltk.sem import Valuation, Model, Assignment
from nltk.sem.logic import Expression
from nltk.inference import ResolutionProver

leer = Expression.fromstring
dominio = {"marta", "juan", "ana", "libroa", "librob"}
base = [("marta", "marta"), ("juan", "juan"), ("ana", "ana"),
        ("estudiante", {"marta", "juan", "ana"}), ("libro", {"libroa", "librob"})]
MODELOS = {   # tres mundos distintos: quién lee qué
    "A (cada cual lee uno distinto)": {("marta", "libroa"), ("juan", "librob"), ("ana", "libroa")},
    "B (todos leen el mismo)":        {("marta", "libroa"), ("juan", "libroa"), ("ana", "libroa")},
    "C (ana no lee nada)":            {("marta", "libroa"), ("juan", "librob")},
}
FORMULAS = {
    "todo estudiante lee un libro   (∀x∃y)": "all x.(estudiante(x) -> exists y.(libro(y) & lee(x,y)))",
    "hay un libro que todos leen    (∃y∀x)": "exists y.(libro(y) & all x.(estudiante(x) -> lee(x,y)))",
}
print("Modelo".ljust(34), *[k.split("(")[0].strip().ljust(6) for k in FORMULAS], sep=" ")
for nombre, lee in MODELOS.items():
    m = Model(dominio, Valuation(base + [("lee", lee)]))
    g = Assignment(dominio)
    print(nombre.ljust(34), *[str(m.satisfy(leer(f), g)).ljust(6) for f in FORMULAS.values()])

# Inferencia: ¿se sigue la conclusión de las premisas?
premisas = [leer("all x.(estudiante(x) -> persona(x))"), leer("estudiante(marta)")]
for concl in ["persona(marta)", "estudiante(marta) & persona(marta)"]:
    print(f"premisas ⊢ {concl:38} → {ResolutionProver().prove(leer(concl), premisas)}")
# La resolución termina pronto solo si la conclusión se sigue; si no, agota su límite de búsqueda
# (la lógica de primer orden es semidecidible), por eso aquí no se prueba una conclusión que no se sigue.
