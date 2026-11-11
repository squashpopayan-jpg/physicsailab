# ELIZA: un agente conversacional de reglas (Weizenbaum, 1966) con patrones, reflexión de pronombres y respuestas por defecto.
import random, re
REFLEJO = {"yo": "usted", "mi": "su", "mis": "sus", "me": "le", "soy": "es usted", "estoy": "está usted", "mío": "suyo", "tengo": "tiene"}
REGLAS = [(r"\b(?:me siento|estoy) (.*)", ["¿Desde cuándo está {0}?", "¿Por qué cree que está {0}?"]),
          (r"\bmi (madre|padre|familia|hermano|hermana)\b(.*)", ["Hábleme más de su {0}.", "¿Qué relación tiene con su {0}?"]),
          (r"\bnecesito (.*)", ["¿Qué significaría para usted conseguir {0}?"]),
          (r"\bporque (.*)", ["¿Es esa la verdadera razón?"]),
          (r"\b(?:sí|si)\b", ["Entiendo. Cuénteme más."]), (r"\bno\b", ["¿Por qué no?"])]
DEFECTO = ["Siga, por favor.", "Cuénteme más.", "Ya veo. ¿Y eso qué le hace pensar?"]
def refleja(t): return " ".join(REFLEJO.get(w, w) for w in t.split())
def responde(frase, rng):
    for pat, resp in REGLAS:
        m = re.search(pat, frase.lower())
        if m: return rng.choice(resp).format(*[refleja(g.strip(" .,!")) for g in m.groups()])
    return rng.choice(DEFECTO)
rng = random.Random(4)
for u in ["Me siento muy cansado", "Mi madre siempre me critica", "Necesito unas vacaciones", "No sé por qué", "Hace calor hoy", "Estoy preocupado por mis exámenes"]:
    print("USUARIO:", u); print("ELIZA:  ", responde(u, rng))
print(f"\n{len(REGLAS)} reglas y {len(DEFECTO)} respuestas por defecto bastan para sostener un turno; no hay comprensión: solo coincidencia de patrones.")
