# Métricas de clasificación con clases desbalanceadas
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (confusion_matrix, classification_report, accuracy_score, balanced_accuracy_score,
                             roc_auc_score, average_precision_score, matthews_corrcoef, log_loss,
                             brier_score_loss, precision_recall_curve, roc_curve)

X, y = make_classification(n_samples=6000, n_features=12, n_informative=5, weights=[0.95],
                           class_sep=0.9, flip_y=0.01, random_state=3)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.4, stratify=y, random_state=0)
print(f"prevalencia de la clase positiva: {yte.mean():.3f}")

dummy = DummyClassifier(strategy="most_frequent").fit(Xtr, ytr)
print(f"clasificador trivial (todo negativo): exactitud = {accuracy_score(yte, dummy.predict(Xte)):.3f}, "
      f"exactitud balanceada = {balanced_accuracy_score(yte, dummy.predict(Xte)):.3f}")

m = LogisticRegression(max_iter=2000).fit(Xtr, ytr)
p = m.predict_proba(Xte)[:, 1]
pred = (p >= 0.5).astype(int)
print("\nMatriz de confusión con umbral 0.5 (filas = real, columnas = predicho):")
print(confusion_matrix(yte, pred))
print(classification_report(yte, pred, digits=3, target_names=["negativo", "positivo"]))
print(f"exactitud = {accuracy_score(yte, pred):.3f}   balanceada = {balanced_accuracy_score(yte, pred):.3f}   "
      f"MCC = {matthews_corrcoef(yte, pred):.3f}")
print(f"AUC-ROC = {roc_auc_score(yte, p):.3f}   AP (área PR) = {average_precision_score(yte, p):.3f}   "
      f"(AP de un modelo al azar = prevalencia = {yte.mean():.3f})")
print(f"log-loss = {log_loss(yte, p):.4f}   Brier = {brier_score_loss(yte, p):.4f}")

print("\nCambiar el umbral cambia el compromiso:")
print("umbral  precisión  exhaustividad  FPR     alertas")
for t in [0.5, 0.3, 0.2, 0.1, 0.05]:
    q = (p >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(yte, q).ravel()
    print(f"{t:6.2f}  {tp / max(tp + fp, 1):9.3f}  {tp / (tp + fn):13.3f}  {fp / (fp + tn):.3f}  {tp + fp:7d}")

prec, rec, thr = precision_recall_curve(yte, p)
i = np.argmax((prec[:-1] >= 0.5) * rec[:-1])          # recall más alto entre los umbrales con precisión ≥ 0.5
print(f"\nmáxima exhaustividad con precisión ≥ 0.5: {rec[i]:.3f} (umbral {thr[i]:.3f})")
fpr, tpr, _ = roc_curve(yte, p)
print(f"puntos de la curva ROC: {len(fpr)};  TPR con FPR ≤ 1 %: {tpr[fpr <= 0.01].max():.3f}")
