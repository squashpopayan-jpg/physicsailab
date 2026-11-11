# Un autómata finito determinista como tabla, su expresión regular equivalente y el límite de lo regular.
import re

# 1) AFD del «balido de oveja»: b a a* !   (estados 0..3; el 3 es final)
delta = {(0, "b"): 1, (1, "a"): 2, (2, "a"): 2, (2, "!"): 3}


def acepta_afd(cadena):
    q = 0
    for c in cadena:
        q = delta.get((q, c))
        if q is None:          # transición inexistente: estado de error
            return False
    return q == 3


regex = re.compile(r"ba+!")
for s in ["ba!", "baaa!", "b!", "baa", "abaa!", "baa!!"]:
    print(f"{s:7} AFD: {acepta_afd(s)!s:5}  regex: {bool(regex.fullmatch(s))}")

# 2) Hechos morfotácticos como autómata: raíz + (o|a) + s? con un lexicón de raíces
raices = ["gat", "perr", "libr", "cas"]
nominal = re.compile("(" + "|".join(raices) + ")(o|a)s?")
print("\nmorfotáctica nominal:")
for w in ["gatos", "gatas", "perro", "casas", "libras", "gatoss", "gat", "mesas"]:
    print(f"  {w:8} {bool(nominal.fullmatch(w))}")

# 3) El límite: a^n b^n no es regular. Un AFD con k estados no puede contar más allá de k.
def regex_hasta(k):
    return re.compile("(" + "|".join(["a" * n + "b" * n for n in range(k + 1)]) + ")")


def cuenta(cadena):            # un contador: memoria ilimitada, no es un autómata finito
    n = cadena.count("a")
    return cadena == "a" * n + "b" * n


print("\naⁿbⁿ con una regex finita (n ≤ 3) y con un contador:")
r3 = regex_hasta(3)
for s in ["", "ab", "aabb", "aaabbb", "aaaabbbb"]:
    print(f"  {s or 'ε':10} regex n≤3: {bool(r3.fullmatch(s))!s:5}  contador: {cuenta(s)}")
