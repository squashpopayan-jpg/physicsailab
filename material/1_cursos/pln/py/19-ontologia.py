# Una ontología pequeña en OWL con rdflib y razonamiento OWL RL (owlrl); consultas SPARQL.
from rdflib import Graph, Namespace, RDF, OWL, BNode
from rdflib.collection import Collection
import owlrl

EX = Namespace("http://ejemplo.org/u#")
g = Graph()
g.bind("ex", EX)

def clase(nombre):
    g.add((EX[nombre], RDF.type, OWL.Class))
    return EX[nombre]

def existe(rol, cls):                       # ∃rol.cls
    r = BNode()
    g.add((r, RDF.type, OWL.Restriction)); g.add((r, OWL.onProperty, EX[rol])); g.add((r, OWL.someValuesFrom, EX[cls]))
    return r

def definir(nombre, partes):                # nombre ≡ parte1 ⊓ parte2 ⊓ …
    lista = BNode(); Collection(g, lista, partes)
    inter = BNode(); g.add((inter, RDF.type, OWL.Class)); g.add((inter, OWL.intersectionOf, lista))
    g.add((EX[nombre], OWL.equivalentClass, inter))

# TBox (la misma que usa la simulación del capítulo)
for c in ["Persona", "Curso", "Estudiante", "Docente", "Monitor"]:
    clase(c)
definir("Estudiante", [EX.Persona, existe("cursa", "Curso")])
definir("Docente", [EX.Persona, existe("ensena", "Curso")])
definir("Monitor", [EX.Estudiante, EX.Docente])

# ABox: hechos sobre individuos
for ind, cls in [("ana", "Persona"), ("luis", "Persona"), ("pepe", "Persona"), ("c1", "Curso")]:
    g.add((EX[ind], RDF.type, EX[cls]))
g.add((EX.ana, EX.cursa, EX.c1)); g.add((EX.luis, EX.ensena, EX.c1))
g.add((EX.pepe, EX.cursa, EX.c1)); g.add((EX.pepe, EX.ensena, EX.c1))

antes = len(g)
owlrl.DeductiveClosure(owlrl.OWLRL_Semantics).expand(g)
print(f"tripletas: {antes} antes del razonamiento, {len(g)} después")

for c in ["Persona", "Estudiante", "Docente", "Monitor"]:
    q = f"PREFIX ex: <http://ejemplo.org/u#> SELECT ?x WHERE {{ ?x a ex:{c} . FILTER(STRSTARTS(STR(?x), STR(ex:))) }} ORDER BY ?x"
    print(f"{c:11}", sorted(str(r.x).split('#')[1] for r in g.query(q)))
