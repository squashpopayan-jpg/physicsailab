# Primer modelo: clasificar flores de iris y medir la generalización
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, confusion_matrix

X, y = load_iris(return_X_y=True)          # X: 150 x 4, y: 0, 1, 2
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.3, stratify=y, random_state=42)
print("entrenamiento:", X_tr.shape, " prueba:", X_te.shape)

modelos = {
    "árbol sin límite": DecisionTreeClassifier(random_state=0),
    "5 vecinos": KNeighborsClassifier(n_neighbors=5),
}
for nombre, m in modelos.items():
    m.fit(X_tr, y_tr)                       # aprender los parámetros
    acc_tr = accuracy_score(y_tr, m.predict(X_tr))
    acc_te = accuracy_score(y_te, m.predict(X_te))
    print(f"{nombre:17s} exactitud entrenamiento = {acc_tr:.3f}   prueba = {acc_te:.3f}")

print("\nMatriz de confusión del árbol (filas = real, columnas = predicho):")
print(confusion_matrix(y_te, modelos["árbol sin límite"].predict(X_te)))
