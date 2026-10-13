# Modelos generativos: Bayes ingenuo, LDA y QDA; Bayes multinomial para texto
import numpy as np
from sklearn.datasets import load_wine
from sklearn.model_selection import cross_validate, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import CountVectorizer

X, y = load_wine(return_X_y=True)
cv = StratifiedKFold(5, shuffle=True, random_state=0)
modelos = {
    "Bayes ingenuo gaussiano": GaussianNB(),
    "LDA": LinearDiscriminantAnalysis(),
    "QDA": QuadraticDiscriminantAnalysis(reg_param=0.1),
    "Logística (escalada)": make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)),
}
print("modelo                    exactitud   log-loss")
for nombre, m in modelos.items():
    r = cross_validate(m, X, y, cv=cv, scoring=["accuracy", "neg_log_loss"])
    print(f"{nombre:24s}  {r['test_accuracy'].mean():.3f}       {-r['test_neg_log_loss'].mean():.3f}")

lda = LinearDiscriminantAnalysis().fit(X, y)
print("\nLDA como reducción de dimensión: fracción de separación entre clases por eje:",
      np.round(lda.explained_variance_ratio_, 3))
Z = lda.transform(X)
print("medias de cada cultivar en el primer eje discriminante:", np.round([Z[y == k, 0].mean() for k in range(3)], 2))

# Bayes multinomial para clasificar mensajes cortos
textos = [
    "gane dinero rápido sin salir de casa", "oferta exclusiva gratis haga clic ya", "premio gratis reclame su dinero hoy",
    "crédito aprobado sin papeles llame ya", "gane un celular gratis responda ahora", "dinero fácil oferta limitada clic aquí",
    "últimos cupos oferta gratis inscríbase", "su cuenta tiene un premio reclame ya",
    "mañana es la reunión de laboratorio", "le envío las notas del parcial de física", "nos vemos en clase a las diez",
    "adjunto el informe del proyecto", "la práctica de óptica se cambia al jueves", "gracias por la revisión del artículo",
    "hoy no hay clase por el festivo", "recuerde traer la calculadora al examen",
]
etiqueta = np.array([1] * 8 + [0] * 8)                  # 1 = spam
vec = CountVectorizer()
C = vec.fit_transform(textos)
nb = MultinomialNB(alpha=1.0).fit(C, etiqueta)
voc = np.array(vec.get_feature_names_out())
razon = nb.feature_log_prob_[1] - nb.feature_log_prob_[0]   # log P(palabra|spam) − log P(palabra|normal)
orden = np.argsort(razon)
print("\npalabras más indicativas de spam:  ", list(voc[orden[-6:]][::-1]))
print("palabras más indicativas de normal:", list(voc[orden[:6]]))
nuevos = ["reclame su premio gratis", "la clase de física es mañana", "oferta de laboratorio gratis"]
for t, p in zip(nuevos, nb.predict_proba(vec.transform(nuevos))[:, 1]):
    print(f"  P(spam | «{t}») = {p:.3f}")
