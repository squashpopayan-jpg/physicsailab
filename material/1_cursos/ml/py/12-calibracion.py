# Calibración de probabilidades, umbral por costos y clases desbalanceadas
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.model_selection import TunedThresholdClassifierCV
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score, confusion_matrix, make_scorer

X, y = make_classification(n_samples=20000, n_features=20, n_informative=6, n_redundant=6,
                           weights=[0.85], random_state=1)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, stratify=y, random_state=0)

def ece(y, p, nb=10):
    """Error de calibración esperado: promedio ponderado de |frecuencia − probabilidad| por bin."""
    b = np.minimum((p * nb).astype(int), nb - 1)
    return sum(np.mean(b == k) * abs(y[b == k].mean() - p[b == k].mean()) for k in range(nb) if np.any(b == k))

modelos = {
    "Logística": LogisticRegression(max_iter=2000),
    "Bayes ingenuo": GaussianNB(),
    "Bosque aleatorio": RandomForestClassifier(300, random_state=0, n_jobs=-1),
    "Bayes + isotónica": CalibratedClassifierCV(GaussianNB(), method="isotonic", cv=5),
    "SVM lineal + Platt": CalibratedClassifierCV(LinearSVC(), method="sigmoid", cv=5),
}
print("modelo               AUC     Brier   log-loss   ECE")
for nombre, m in modelos.items():
    p = m.fit(Xtr, ytr).predict_proba(Xte)[:, 1]
    print(f"{nombre:19s} {roc_auc_score(yte, p):.3f}   {brier_score_loss(yte, p):.4f}   {log_loss(yte, p):.4f}   {ece(yte, p):.4f}")
    if nombre == "Bayes ingenuo":
        fr, pm = calibration_curve(yte, p, n_bins=5)
        print("   curva de fiabilidad (prob. media → frecuencia real):",
              ", ".join(f"{a:.2f}→{b:.2f}" for a, b in zip(pm, fr)))

# Umbral por costos: un falso negativo cuesta 10 veces un falso positivo
cFP, cFN = 1.0, 10.0
lr = LogisticRegression(max_iter=2000).fit(Xtr, ytr)
p = lr.predict_proba(Xte)[:, 1]
def costo(yv, pred):
    tn, fp, fn, tp = confusion_matrix(yv, pred).ravel()
    return cFP * fp + cFN * fn
print(f"\nCosto total en prueba (cFP = {cFP:.0f}, cFN = {cFN:.0f}):")
for t in [0.5, 0.3, cFP / (cFP + cFN), 0.05]:
    print(f"  umbral {t:.3f}: costo = {costo(yte, (p >= t).astype(int)):6.0f}")
neg_costo = make_scorer(lambda yv, pred: -costo(yv, pred))
tuned = TunedThresholdClassifierCV(LogisticRegression(max_iter=2000), scoring=neg_costo, cv=5).fit(Xtr, ytr)
print(f"  umbral elegido por validación cruzada: {tuned.best_threshold_:.3f} → costo = {costo(yte, tuned.predict(Xte)):.0f}")

# class_weight='balanced': más exhaustividad, pero probabilidades descalibradas
for cw in [None, "balanced"]:
    m = LogisticRegression(max_iter=2000, class_weight=cw).fit(Xtr, ytr)
    q = m.predict_proba(Xte)[:, 1]
    tn, fp, fn, tp = confusion_matrix(yte, (q >= 0.5).astype(int)).ravel()
    print(f"\nclass_weight = {cw}: exhaustividad = {tp / (tp + fn):.3f}  precisión = {tp / (tp + fp):.3f}  "
          f"prob. media = {q.mean():.3f} (prevalencia real {yte.mean():.3f})  Brier = {brier_score_loss(yte, q):.4f}")
