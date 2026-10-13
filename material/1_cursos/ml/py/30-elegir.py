# Comparar algoritmos con el mismo protocolo: línea base, validación cruzada y tiempo
import warnings
import numpy as np
from sklearn.datasets import load_breast_cancer, load_digits, make_classification
from sklearn.model_selection import cross_validate, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
warnings.filterwarnings("ignore")

conjuntos = {
    "cáncer de mama (569 × 30)": load_breast_cancer(return_X_y=True),
    "dígitos 8×8 (1 797 × 64)": load_digits(return_X_y=True),
    "tabular sintético (3 000 × 40, 30 inútiles)": make_classification(3000, 40, n_informative=6, n_redundant=4,
                                                                      flip_y=0.05, random_state=0),
}
esc = lambda m: make_pipeline(StandardScaler(), m)
modelos = {
    "línea base (clase mayoritaria)": DummyClassifier(),
    "regresión logística": esc(LogisticRegression(max_iter=3000)),
    "Bayes ingenuo": GaussianNB(),
    "k-NN (k = 7)": esc(KNeighborsClassifier(7)),
    "SVM RBF": esc(SVC()),
    "árbol (profundidad 8)": DecisionTreeClassifier(max_depth=8, random_state=0),
    "bosque aleatorio": RandomForestClassifier(300, n_jobs=-1, random_state=0),
    "HistGradientBoosting": HistGradientBoostingClassifier(random_state=0),
    "red MLP (100)": esc(MLPClassifier((100,), max_iter=1000, random_state=0)),
}
cv = StratifiedKFold(5, shuffle=True, random_state=0)
for nombre_d, (X, y) in conjuntos.items():
    print(f"\n{nombre_d}")
    print("   modelo                          exactitud (media ± de)   entrenar (s)")
    res = []
    for nombre_m, m in modelos.items():
        r = cross_validate(m, X, y, cv=cv)
        res.append((r["test_score"].mean(), nombre_m))
        print(f"   {nombre_m:31s} {r['test_score'].mean():.3f} ± {r['test_score'].std():.3f}          {r['fit_time'].mean():6.2f}")
    res.sort(reverse=True)
    print(f"   → mejor: {res[0][1]} ({res[0][0]:.3f}); segundo: {res[1][1]} ({res[1][0]:.3f})")
