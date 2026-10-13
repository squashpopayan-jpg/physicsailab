# Detección de anomalías: estadísticos, Mahalanobis, bosque de aislamiento, LOF y SVM de una clase
import numpy as np
from scipy import stats
from sklearn.covariance import EmpiricalCovariance, MinCovDet
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import average_precision_score, roc_auc_score

rng = np.random.default_rng(0)
# Datos normales: dos variables muy correlacionadas (p. ej., consumo eléctrico y temperatura)
n = 1000
z = rng.normal(size=n)
normal = np.column_stack([z, 0.9 * z + 0.3 * rng.normal(size=n)])
# Anomalías: 15 que rompen la correlación (valores normales por separado) y 15 extremas
rompen = np.zeros((15, 2))
rompen[:, 0] = rng.uniform(-1.5, 1.5, 15)
rompen[:, 1] = -0.9 * rompen[:, 0] + rng.normal(0, 0.2, 15)      # correlación invertida
extremas = rng.normal(0, 1, (15, 2)) * 0.5 + np.array([4.5, 4.0])
X = np.vstack([normal, rompen, extremas])
y = np.r_[np.zeros(n), np.ones(30)]          # 1 = anomalía (solo para evaluar)
tipo = np.r_[np.zeros(n), np.ones(15), 2 * np.ones(15)]

def informe(nombre, puntaje):
    k = 30
    top = np.argsort(puntaje)[::-1][:k]
    print(f"{nombre:28s} AP = {average_precision_score(y, puntaje):.3f}   AUC = {roc_auc_score(y, puntaje):.3f}   "
          f"precisión@30 = {y[top].mean():.3f}   (rompen: {np.sum(tipo[top] == 1):2d}/15, extremas: {np.sum(tipo[top] == 2):2d}/15)")

Z = StandardScaler().fit_transform(X)
informe("|z| máximo por variable", np.abs(Z).max(1))
informe("Mahalanobis (cov. empírica)", EmpiricalCovariance().fit(X).mahalanobis(X))
informe("Mahalanobis (cov. robusta)", MinCovDet(random_state=0).fit(X).mahalanobis(X))
iso = IsolationForest(n_estimators=300, contamination="auto", random_state=0).fit(X)
informe("Bosque de aislamiento", -iso.score_samples(X))
lof = LocalOutlierFactor(n_neighbors=20).fit(X)
informe("LOF (k = 20)", -lof.negative_outlier_factor_)
oc = OneClassSVM(gamma=0.5, nu=0.03).fit(Z)
informe("SVM de una clase", -oc.decision_function(Z))

# El umbral: contamination fija qué fracción se declara anómala
for c in [0.01, 0.03, 0.10]:
    pred = IsolationForest(n_estimators=300, contamination=c, random_state=0).fit_predict(X) == -1
    print(f"contamination = {c:.2f}: {pred.sum():3d} marcadas, de ellas {int(y[pred].sum()):2d} anomalías reales")

# Mahalanobis² sigue una χ² con 2 g.l. para los datos normales: umbral con probabilidad conocida
d2 = MinCovDet(random_state=0).fit(X).mahalanobis(X)
u = stats.chi2.ppf(0.999, df=2)
print(f"\numbral χ²(2) al 99.9 %: {u:.2f}  →  marcadas {np.sum(d2 > u)}, anomalías reales entre ellas {int(y[d2 > u].sum())}, "
      f"falsas alarmas {int(np.sum((d2 > u) & (y == 0)))}")
