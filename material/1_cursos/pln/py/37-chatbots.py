# Diseño de un chatbot de reservas: clasificador de intenciones (scikit-learn), extracción de datos con expresiones regulares y máquina de estados.
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.pipeline import make_pipeline
DATOS = {
 "reservar": ["quiero reservar una mesa", "necesito una mesa para cuatro personas", "reserva una mesa para mañana", "me gustaría reservar para esta noche", "mesa para dos el viernes por favor", "puedo hacer una reserva", "quisiera reservar a las nueve", "apúntame una mesa para el sábado"],
 "cancelar": ["quiero cancelar mi reserva", "cancela la mesa de mañana", "ya no voy a poder ir, anula la reserva", "necesito anular mi reserva", "borra mi reserva por favor", "no podré asistir, cancélala", "deseo cancelar la mesa del viernes", "elimina la reserva a nombre de ana"],
 "horario": ["a qué hora abren", "cuál es el horario", "hasta qué hora cierran", "abren los domingos", "cuándo abren por la mañana", "tienen horario de almuerzo", "qué días están cerrados", "a qué hora cierra la cocina"],
 "menu": ["qué platos tienen", "tienen opciones vegetarianas", "me puede decir el menú", "hay platos sin gluten", "cuánto cuesta el menú del día", "qué postres hay", "quiero ver la carta", "tienen comida para niños"],
 "saludo": ["hola", "buenas tardes", "buenos días", "qué tal", "hola, buenas", "saludos", "buenas noches", "hey, hola"],
 "adios": ["adiós", "hasta luego", "gracias, nada más", "eso es todo, gracias", "chao", "hasta pronto", "muchas gracias, adiós", "nos vemos"]}
X = [f for v in DATOS.values() for f in v]; y = [k for k, v in DATOS.items() for _ in v]
modelo = make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), LogisticRegression(C=10, max_iter=1000))
s = cross_val_score(modelo, X, y, cv=StratifiedKFold(4, shuffle=True, random_state=0))
print(f"{len(X)} frases, {len(DATOS)} intenciones; exactitud en validación cruzada (4 bloques): {s.mean():.3f}")
modelo.fit(X, y)
def datos(t):
    n = re.search(r"\b(\d+|un|una|dos|tres|cuatro|cinco|seis)\s+personas?\b", t.lower()); h = re.search(r"\b(?:a las )?(\d{1,2})(?::(\d\d))?\s*(?:h|horas)?\b", t.lower()); d = re.search(r"\b(hoy|mañana|esta noche|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b", t.lower())
    return {"personas": n and n.group(1), "dia": d and d.group(1)}
for u in ["Hola", "Quiero una mesa para cuatro personas el viernes", "Hasta qué hora está abierto", "Anula mi reserva por favor", "Cuánto cuesta el menú", "Quisiera comer pizza en Marte"]:
    p = modelo.predict_proba([u])[0]; i = p.argmax()
    print(f"{u:48} → {modelo.classes_[i]:9} ({p[i]:.2f}) {datos(u) if modelo.classes_[i] == 'reservar' else ''}")
print("\nUmbral de confianza: si la probabilidad máxima es menor que 0,5, el bot responde «no lo he entendido» y ofrece las opciones.")
