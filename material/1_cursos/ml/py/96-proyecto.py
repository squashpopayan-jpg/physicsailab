# Proyecto completo: predecir el abandono de clientes de un operador de telefonía, de los datos crudos al informe
import warnings
import numpy as np
import pandas as pd
from scipy.stats import loguniform, randint
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, RandomizedSearchCV, cross_val_predict
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss, log_loss
from sklearn.inspection import permutation_importance
warnings.filterwarnings("ignore")
rng = np.random.default_rng(42)

# ---------------------------------------------------------------- 0. Los datos (simulados, con los defectos de los reales)
n = 8000
plan = rng.choice(["prepago", "pospago", "hogar"], n, p=[0.45, 0.40, 0.15])
ciudad = rng.choice(["Popayán", "Cali", "Pasto", "Neiva", "Ibagué", "Armenia"], n, p=[0.25, 0.30, 0.15, 0.10, 0.10, 0.10])
antig = rng.gamma(1.6, 14.0, n).round()                                    # meses como cliente
cargo = np.select([plan == "prepago", plan == "pospago"], [35, 75], 110) * 1000 + rng.normal(0, 12000, n)
soporte = rng.poisson(np.where(plan == "hogar", 1.4, 0.8))                 # llamadas a soporte en 3 meses
datos = rng.lognormal(1.5, 0.7, n)                                         # GB por mes
electronico = (rng.random(n) < np.where(plan == "prepago", 0.35, 0.70)).astype(int)
edad = rng.normal(40, 13, n).clip(18, 85).round()
logit = (-1.0 - 0.035 * antig + 1.3 * (antig < 6) + 0.45 * soporte + 0.5 * (soporte >= 3) - 0.7 * electronico
         + 0.6 * (plan == "prepago") + 0.02 * (cargo / 1000 - 70) * (plan != "hogar") - 0.25 * np.log(datos)
         + 0.4 * (ciudad == "Cali") - 0.012 * (edad - 40))
abandona = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
portabilidad = np.where(abandona == 1, rng.random(n) < 0.85, rng.random(n) < 0.01).astype(int)   # se registra al pedir la baja
datos[(rng.random(n) < np.where(plan == "prepago", 0.14, 0.04))] = np.nan  # faltantes más frecuentes en prepago
edad[rng.random(n) < 0.06] = np.nan
df = pd.DataFrame({"id_cliente": np.arange(100000, 100000 + n), "plan": plan, "ciudad": ciudad, "antiguedad": antig,
                   "cargo_mensual": cargo.round(-2), "llamadas_soporte": soporte, "datos_gb": datos.round(2),
                   "pago_electronico": electronico, "edad": edad, "solicito_portabilidad": portabilidad, "abandona": abandona})

# ---------------------------------------------------------------- 1. Exploración
print("1. EXPLORACIÓN")
print(f"filas × columnas: {df.shape[0]} × {df.shape[1]}   tasa de abandono: {df.abandona.mean():.3f}")
falt = df.isna().mean()
print("faltantes:", ", ".join(f"{c} {100 * v:.1f} %" for c, v in falt[falt > 0].items()))
print("abandono por plan:", ", ".join(f"{k} {v:.3f}" for k, v in df.groupby("plan").abandona.mean().items()))
print("faltante de datos_gb por plan:", ", ".join(f"{k} {100 * v:.1f} %" for k, v in df.datos_gb.isna().groupby(df.plan).mean().items()))
print("AUC de cada variable numérica sola (detector de fugas):")
for c in ["antiguedad", "cargo_mensual", "llamadas_soporte", "datos_gb", "pago_electronico", "edad", "solicito_portabilidad", "id_cliente"]:
    ok = df[c].notna()
    a = roc_auc_score(df.abandona[ok], df[c][ok]); a = max(a, 1 - a)
    print(f"  {c:22s} {a:.3f}" + ("   <-- sospechosa: ¿se conoce antes de la decisión?" if a > 0.85 else ""))
print("decisión: se descartan solicito_portabilidad (se registra cuando el cliente ya decidió irse) e id_cliente")

# ---------------------------------------------------------------- 2. Partición: la prueba se aparta y no se toca
X = df.drop(columns=["abandona", "solicito_portabilidad", "id_cliente"]); y = df.abandona
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
print(f"\n2. PARTICIÓN  entrenamiento {len(Xtr)} (abandono {ytr.mean():.3f})   prueba {len(Xte)} (abandono {yte.mean():.3f})")

# ---------------------------------------------------------------- 3. Preprocesamiento dentro de pipelines
num = ["antiguedad", "cargo_mensual", "llamadas_soporte", "datos_gb", "edad"]
cat = ["plan", "ciudad"]
pre_lineal = ColumnTransformer([
    ("num", make_pipeline(SimpleImputer(strategy="median", add_indicator=True), StandardScaler()), num),
    ("bin", "passthrough", ["pago_electronico"]),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat)])
pre_arbol = ColumnTransformer([
    ("num", "passthrough", num + ["pago_electronico"]),                     # los árboles de HGB manejan NaN
    ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), cat)])
pre_bosque = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), num + ["pago_electronico"]),
    ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), cat)])

# ---------------------------------------------------------------- 4. Candidatos con el mismo protocolo
cv = StratifiedKFold(5, shuffle=True, random_state=0)
metr = {"AUC": "roc_auc", "AP": "average_precision", "logloss": "neg_log_loss", "Brier": "neg_brier_score"}
candidatos = {
    "línea base (tasa global)": DummyClassifier(strategy="prior"),
    "regresión logística": Pipeline([("pre", pre_lineal), ("m", LogisticRegression(max_iter=2000))]),
    "bosque aleatorio": Pipeline([("pre", pre_bosque), ("m", RandomForestClassifier(300, min_samples_leaf=5, n_jobs=1, random_state=0))]),
    "gradient boosting (HGB)": Pipeline([("pre", pre_arbol), ("m", HistGradientBoostingClassifier(categorical_features=[6, 7], random_state=0))]),
}
print("\n4. VALIDACIÓN CRUZADA (5 pliegues, media ± desviación entre pliegues)")
print(f"{'modelo':28s} {'AUC':>13s} {'AP':>13s} {'log loss':>13s} {'Brier':>13s}")
for nombre, m in candidatos.items():
    r = cross_validate(m, Xtr, ytr, cv=cv, scoring=metr)
    v = {k: (-1 if k in ("logloss", "Brier") else 1) * r["test_" + k] for k in metr}
    print(f"{nombre:28s} " + " ".join(f"{v[k].mean():7.3f} ± {v[k].std():.3f}" for k in metr))

# ---------------------------------------------------------------- 5. Ajuste de hiperparámetros del candidato elegido
busq = RandomizedSearchCV(
    Pipeline([("pre", pre_arbol), ("m", HistGradientBoostingClassifier(categorical_features=[6, 7], random_state=0))]),
    {"m__learning_rate": loguniform(0.02, 0.3), "m__max_iter": randint(80, 400), "m__max_leaf_nodes": randint(4, 48),
     "m__min_samples_leaf": randint(10, 200), "m__l2_regularization": loguniform(1e-3, 10)},
    n_iter=25, scoring={"AP": "average_precision", "AUC": "roc_auc"}, refit="AP", cv=cv, random_state=0).fit(Xtr, ytr)
bp = busq.best_params_
print("\n5. BÚSQUEDA ALEATORIA (25 combinaciones, métrica AP)")
print("mejores hiperparámetros:", ", ".join(f"{k[3:]}={v:.3g}" if isinstance(v, float) else f"{k[3:]}={v}" for k, v in bp.items()))
res = pd.DataFrame(busq.cv_results_).sort_values("rank_test_AP")
print(f"AP de validación: mejor {res.mean_test_AP.iloc[0]:.3f} ± {res.std_test_AP.iloc[0]:.3f} (AUC {res.mean_test_AUC.iloc[0]:.3f})   "
      f"5.ª mejor {res.mean_test_AP.iloc[4]:.3f}   peor {res.mean_test_AP.iloc[-1]:.3f}")
final = busq.best_estimator_

# ---------------------------------------------------------------- 6. Evaluación final en la prueba (una sola vez), con intervalos
p = final.predict_proba(Xte)[:, 1]
b = np.random.default_rng(1); yv = yte.to_numpy(); B = []
for _ in range(1000):
    i = b.integers(0, len(yv), len(yv))
    B.append((roc_auc_score(yv[i], p[i]), average_precision_score(yv[i], p[i])))
lo, hi = np.percentile(B, [2.5, 97.5], axis=0)
print("\n6. PRUEBA (1 600 clientes nunca vistos)")
print(f"AUC = {roc_auc_score(yv, p):.3f}  [IC 95 % {lo[0]:.3f}–{hi[0]:.3f}]   AP = {average_precision_score(yv, p):.3f}  [{lo[1]:.3f}–{hi[1]:.3f}]   "
      f"log loss = {log_loss(yv, p):.3f}   Brier = {brier_score_loss(yv, p):.3f}   (AP del azar = {yv.mean():.3f})")

# ---------------------------------------------------------------- 7. Calibración
print("\n7. CALIBRACIÓN EN LA PRUEBA (quintiles de la probabilidad predicha)")
q = pd.qcut(p, 5, labels=False)
for k in range(5):
    s = q == k
    print(f"  quintil {k + 1}: predicha media {p[s].mean():.3f}   abandono observado {yv[s].mean():.3f}   (n = {s.sum()})")

# ---------------------------------------------------------------- 8. Umbral por costos de la campaña de retención
contacto, margen, exito = 20_000, 300_000, 0.30                            # pesos: costo de contactar, margen perdido, éxito de la oferta
ganancia = lambda yy, d: np.sum(d * (yy * exito * margen - contacto))       # beneficio neto de contactar a los marcados
t_teo = contacto / (exito * margen)
oof = cross_val_predict(final, Xtr, ytr, cv=cv, method="predict_proba")[:, 1]
grid = np.round(np.arange(0.05, 0.951, 0.01), 2)
g_oof = [ganancia(ytr.to_numpy(), oof >= t) for t in grid]
t_cv = grid[int(np.argmax(g_oof))]
print(f"\n8. DECISIÓN  contactar si p ≥ umbral   (umbral teórico = costo / (éxito · margen) = {t_teo:.3f})")
print(f"umbral elegido con predicciones fuera de pliegue del entrenamiento: {t_cv:.2f}")
por_mil = 1000 / len(yv) / 1e6
for nombre, d in [("no contactar a nadie", np.zeros_like(p)), ("contactar a todos", np.ones_like(p)), ("umbral 0.5", p >= 0.5),
                  (f"umbral teórico {t_teo:.2f}", p >= t_teo), (f"umbral validado {t_cv:.2f}", p >= t_cv)]:
    d = np.asarray(d, float)
    print(f"  {nombre:24s} contactados {d.mean() * 100:5.1f} %   abandonos cubiertos {d[yv == 1].mean() * 100:5.1f} %   "
          f"ganancia {ganancia(yv, d) * por_mil:6.2f} millones por cada 1 000 clientes")

# ---------------------------------------------------------------- 9. Interpretación
print("\n9. IMPORTANCIA POR PERMUTACIÓN EN LA PRUEBA (caída de la AP, 10 repeticiones)")
pi = permutation_importance(final, Xte, yte, scoring="average_precision", n_repeats=10, random_state=0)
for i in np.argsort(-pi.importances_mean):
    print(f"  {X.columns[i]:18s} {pi.importances_mean[i]:6.3f} ± {pi.importances_std[i]:.3f}")
print("dependencia parcial de la antigüedad (probabilidad media de abandono si todos tuvieran esa antigüedad):")
pd_ant = []
for v in [1, 3, 5, 6, 9, 12, 24, 48]:
    Xc = Xte.copy(); Xc["antiguedad"] = v; pd_ant.append(f"{v} m → {final.predict_proba(Xc)[:, 1].mean():.3f}")
print("  " + "   ".join(pd_ant))

# ---------------------------------------------------------------- 10. Desempeño por segmento
print("\n10. POR SEGMENTO EN LA PRUEBA")
for k in ["prepago", "pospago", "hogar"]:
    s = (Xte.plan == k).to_numpy()
    print(f"  {k:8s} n = {s.sum():4d}   abandono {yv[s].mean():.3f}   predicho {p[s].mean():.3f}   AUC {roc_auc_score(yv[s], p[s]):.3f}"
          f"   contactados con el umbral {100 * (p[s] >= t_cv).mean():5.1f} %")

# joblib.dump(final, "modelo_abandono.joblib")  # guardar el pipeline completo: el mismo preprocesamiento en producción
