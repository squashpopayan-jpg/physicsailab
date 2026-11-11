# Un analizador morfológico mínimo del español: lexicón + terminaciones + reglas ortográficas.
# Nivel intermedio: raíz ^ sufijo #   (^ frontera de morfemas, # frontera de palabra).
import re
from collections import defaultdict

VOC = "aeiouáéíóúü"
TERM = {
    "ar": {"Pres": "o as a amos áis an", "Impf": "aba abas aba ábamos abais aban", "Perf": "é aste ó amos asteis aron",
           "Fut": "é ás á emos éis án", "Cond": "ía ías ía íamos íais ían", "Subj Pres": "e es e emos éis en",
           "Subj Impf": "ara aras ara áramos arais aran"},
    "er": {"Pres": "o es e emos éis en", "Impf": "ía ías ía íamos íais ían", "Perf": "í iste ió imos isteis ieron",
           "Fut": "é ás á emos éis án", "Cond": "ía ías ía íamos íais ían", "Subj Pres": "a as a amos áis an",
           "Subj Impf": "iera ieras iera iéramos ierais ieran"},
    "ir": {"Pres": "o es e imos ís en", "Impf": "ía ías ía íamos íais ían", "Perf": "í iste ió imos isteis ieron",
           "Fut": "é ás á emos éis án", "Cond": "ía ías ía íamos íais ían", "Subj Pres": "a as a amos áis an",
           "Subj Impf": "iera ieras iera iéramos ierais ieran"},
}
PERSONAS = ["1P Sg", "2P Sg", "3P Sg", "1P Pl", "2P Pl", "3P Pl"]


def reglas(inter):
    """Cascada de reglas ortográficas sobre la cadena intermedia."""
    s = re.sub(rf"([^{VOC}^#])\^s#$", r"\1^es#", inter)           # inserción de e
    s = re.sub(r"z\^e", "c^e", s)                                   # z → c ante e
    s = re.sub(r"([áéíóú])([ns])\^e",                               # pérdida de tilde
               lambda m: "aeiou"["áéíóú".index(m.group(1))] + m.group(2) + "^e", s)
    return s.replace("^", "").replace("#", "")                      # quitar fronteras


def formas_verbo(inf):
    k, raiz = inf[-2:], inf[:-2]
    out = []
    for t, suf in TERM[k].items():
        base = inf if t in ("Fut", "Cond") else raiz
        for s, p in zip(suf.split(), PERSONAS):
            out.append((reglas(f"{base}^{s}#"), f"{inf} +V +{t.replace(' ', ' +')} +{p.replace(' ', ' +')}"))
    out.append((inf, f"{inf} +V +Inf"))
    out.append((reglas(f"{raiz}^{'ando' if k == 'ar' else 'iendo'}#"), f"{inf} +V +Ger"))
    out.append((reglas(f"{raiz}^{'ado' if k == 'ar' else 'ido'}#"), f"{inf} +V +Part"))
    return out


def plural(raiz):
    return reglas(raiz + "^s#")


if __name__ == "__main__":
    f = formas_verbo("cantar")
    print(f"cantar: {len(f)} análisis, {len({x for x, _ in f})} formas distintas")
    print("Pres Ind  :", " ".join(x for x, y in f if y.startswith("cantar +V +Pres")))
    print("Perf 3P Sg:", [x for x, y in f if y.endswith("+Perf +3P +Sg")])

    # homografía: formas con más de un análisis
    idx = defaultdict(set)
    for inf in ["cantar", "comer", "vivir"]:
        for x, y in formas_verbo(inf):
            idx[x].add(y)
    idx["vino"] |= {"vino +N +Masc +Sg", "venir +V +Perf +3P +Sg"}
    idx["canto"] |= {"canto +N +Masc +Sg"}
    amb = sorted((w, sorted(v)) for w, v in idx.items() if len(v) > 1)
    print(f"\nformas ambiguas en el mini-lexicón: {len(amb)}")
    for w, v in amb[:6]:
        print(f"  {w}: {v}")

    # reglas ortográficas en el plural
    print("\nplurales con reglas:")
    for p in ["lugar", "nuez", "canción", "lápiz", "autobús", "padre", "café"]:
        print(f"  {p}^s# → {plural(p)}")
    # inglés frente a español: formas de un verbo
    print("\nformas del verbo inglés sing: 5 (sing, sings, sang, sung, singing)")
