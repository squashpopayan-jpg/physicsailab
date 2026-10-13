# Preprocesamiento completo de una tabla mixta con ColumnTransformer
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder, FunctionTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold

rng = np.random.default_rng(5)
n = 2000
df = pd.DataFrame({
    "edad": rng.integers(18, 75, n).astype(float),
    "ingreso": np.round(rng.lognormal(mean=8.0, sigma=0.8, size=n), -1),   # miles de pesos, cola larga
    "ciudad": rng.choice(["Popayán", "Cali", "Bogotá", "Pasto"], n, p=[0.4, 0.3, 0.2, 0.1]),
    "plan": rng.choice(["básico", "medio", "premium"], n, p=[0.5, 0.35, 0.15]),
})
# El objetivo (¿renueva la suscripción?) depende del logaritmo del ingreso, la edad y el plan
nivel = df["plan"].map({"básico": 0, "medio": 1, "premium": 2})
logit = -9.2 + 1.1 * np.log(df["ingreso"]) + 0.02 * df["edad"] + 0.6 * nivel + 0.4 * (df["ciudad"] == "Cali")
y = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
# Faltantes: el 15 % de las edades y el 10 % de los ingresos
df.loc[rng.random(n) < 0.15, "edad"] = np.nan
df.loc[rng.random(n) < 0.10, "ingreso"] = np.nan

print(df.head(), "\n")
print("faltantes por columna:\n", df.isna().sum().to_string(), "\n")
print("proporción de renovaciones:", round(y.mean(), 3))

def preprocesador(log_ingreso):
    num_ingreso = [SimpleImputer(strategy="median", add_indicator=True)]
    if log_ingreso:
        num_ingreso.append(FunctionTransformer(np.log1p, feature_names_out="one-to-one"))
    num_ingreso.append(StandardScaler())
    return ColumnTransformer([
        ("edad", make_pipeline(SimpleImputer(strategy="median", add_indicator=True), StandardScaler()), ["edad"]),
        ("ingreso", make_pipeline(*num_ingreso), ["ingreso"]),
        ("ciudad", OneHotEncoder(handle_unknown="ignore"), ["ciudad"]),
        ("plan", OrdinalEncoder(categories=[["básico", "medio", "premium"]]), ["plan"]),
    ])

pre = preprocesador(True).fit(df)
print("\ncolumnas que ve el modelo:", list(pre.get_feature_names_out()))

cv = StratifiedKFold(5, shuffle=True, random_state=0)
for nombre, modelo in [
    ("logística, ingreso lineal", make_pipeline(preprocesador(False), LogisticRegression(max_iter=1000))),
    ("logística, log(ingreso)  ", make_pipeline(preprocesador(True), LogisticRegression(max_iter=1000))),
]:
    auc = cross_val_score(modelo, df, y, cv=cv, scoring="roc_auc")
    print(f"{nombre}: AUC = {auc.mean():.3f} ± {auc.std():.3f}")

# Los árboles potenciados aceptan faltantes y categorías sin escalar ni transformar
X_hgb = df.assign(ciudad=df["ciudad"].astype("category"), plan=nivel)
hgb = HistGradientBoostingClassifier(categorical_features="from_dtype", random_state=0)
auc = cross_val_score(hgb, X_hgb, y, cv=cv, scoring="roc_auc")
print(f"HistGradientBoosting sin preprocesar: AUC = {auc.mean():.3f} ± {auc.std():.3f}")
hgb2 = HistGradientBoostingClassifier(categorical_features="from_dtype", max_depth=2,
                                      learning_rate=0.05, max_iter=300, random_state=0)
auc = cross_val_score(hgb2, X_hgb, y, cv=cv, scoring="roc_auc")
print(f"HistGradientBoosting poco profundo:   AUC = {auc.mean():.3f} ± {auc.std():.3f}")
