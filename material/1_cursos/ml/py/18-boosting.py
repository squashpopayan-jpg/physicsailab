# Boosting: tasa de aprendizaje, número de árboles, parada temprana y bibliotecas modernas
# (la parte 1 entrena 4 000 árboles: tarda unos minutos)
import time
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, HistGradientBoostingClassifier, RandomForestClassifier, AdaBoostClassifier
from sklearn.metrics import log_loss, roc_auc_score
import xgboost as xgb
import lightgbm as lgb

X, y = make_classification(n_samples=20000, n_features=30, n_informative=12, n_redundant=6,
                           flip_y=0.03, class_sep=0.8, random_state=4)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)
Xa, Xv, ya, yv = train_test_split(Xtr, ytr, test_size=0.2, random_state=0)   # validación interna

# 1) Tasa de aprendizaje frente a número de árboles (log-loss de validación por etapa)
print("tasa   mejor n.º de árboles   log-loss de validación en ese punto   con 1 000 árboles")
for lr in [1.0, 0.3, 0.1, 0.03]:
    gb = GradientBoostingClassifier(n_estimators=1000, learning_rate=lr, max_depth=3, random_state=0).fit(Xa[:5000], ya[:5000])
    ll = [log_loss(yv, p[:, 1]) for p in gb.staged_predict_proba(Xv)]
    k = int(np.argmin(ll))
    print(f"{lr:4.2f}   {k + 1:20d}   {ll[k]:34.4f}   {ll[-1]:.4f}")

# 2) Parada temprana automática con HistGradientBoosting
t0 = time.perf_counter()
hgb = HistGradientBoostingClassifier(max_iter=2000, learning_rate=0.1, early_stopping=True,
                                     validation_fraction=0.15, n_iter_no_change=30, random_state=0).fit(Xtr, ytr)
t_hgb = time.perf_counter() - t0
print(f"\nHistGradientBoosting se detuvo en {hgb.n_iter_} iteraciones de 2 000 posibles")

# 3) Comparación en prueba
modelos = {
    "AdaBoost (tocones, 300)": AdaBoostClassifier(n_estimators=300, random_state=0),
    "Bosque aleatorio (500)": RandomForestClassifier(500, n_jobs=-1, random_state=0),
    "HistGradientBoosting": hgb,
    "XGBoost": xgb.XGBClassifier(n_estimators=2000, learning_rate=0.05, max_depth=6, subsample=0.8,
                                 colsample_bytree=0.8, early_stopping_rounds=50, eval_metric="logloss", random_state=0),
    "LightGBM": lgb.LGBMClassifier(n_estimators=2000, learning_rate=0.05, num_leaves=31, subsample=0.8,
                                   subsample_freq=1, colsample_bytree=0.8, random_state=0, verbose=-1),
}
print("\nmodelo                      AUC prueba   log-loss   tiempo (s)")
for nombre, m in modelos.items():
    t = time.perf_counter()
    if nombre == "XGBoost":
        m.fit(Xa, ya, eval_set=[(Xv, yv)], verbose=False)
    elif nombre == "LightGBM":
        m.fit(Xa, ya, eval_set=[(Xv, yv)], callbacks=[lgb.early_stopping(50, verbose=False)])
    elif nombre != "HistGradientBoosting":
        m.fit(Xtr, ytr)
    dt = t_hgb if nombre == "HistGradientBoosting" else time.perf_counter() - t
    p = m.predict_proba(Xte)[:, 1]
    extra = f"  (árboles: {m.best_iteration + 1})" if nombre == "XGBoost" else f"  (árboles: {m.best_iteration_})" if nombre == "LightGBM" else ""
    print(f"{nombre:26s}  {roc_auc_score(yte, p):.4f}      {log_loss(yte, p):.4f}   {dt:6.1f}{extra}")
