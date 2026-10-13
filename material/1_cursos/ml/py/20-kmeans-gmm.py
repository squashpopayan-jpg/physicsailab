# Agrupamiento por particiones: k-medias, elegir k y mezclas gaussianas
import numpy as np
from sklearn.datasets import make_blobs, load_iris
from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, adjusted_rand_score

X, y = make_blobs(n_samples=600, centers=[[0, 0], [4, 1], [1.5, 4], [5, 5]], cluster_std=[0.8, 1.0, 0.9, 0.7], random_state=3)
print("k   inercia    silueta")
for k in range(2, 8):
    km = KMeans(k, n_init=10, random_state=0).fit(X)
    print(f"{k}   {km.inertia_:8.1f}   {silhouette_score(X, km.labels_):.3f}")

# Sensibilidad a la inicialización: una sola inicialización aleatoria frente a k-means++ con 10
inercias = [KMeans(4, init="random", n_init=1, random_state=s).fit(X).inertia_ for s in range(20)]
print(f"\n20 inicializaciones aleatorias (n_init=1): inercia mínima {min(inercias):.1f}, máxima {max(inercias):.1f}")
km = KMeans(4, n_init=10, random_state=0).fit(X)
print(f"k-means++ con n_init=10: {km.inertia_:.1f}   ARI frente a los grupos verdaderos = {adjusted_rand_score(y, km.labels_):.3f}")

# Grupos alargados: k-medias falla, la mezcla gaussiana no
rng = np.random.default_rng(0)
A = rng.normal(size=(300, 2)) @ np.array([[3.0, 0.0], [0.0, 0.35]]) + [0, 0]
B = rng.normal(size=(300, 2)) @ np.array([[3.0, 0.0], [0.0, 0.35]]) + [0, 2.0]
Z = np.vstack([A, B]); yz = np.r_[np.zeros(300), np.ones(300)]
km2 = KMeans(2, n_init=10, random_state=0).fit(Z)
gm_km = GaussianMixture(2, covariance_type="full", n_init=10, init_params="kmeans", random_state=0).fit(Z)
gm = GaussianMixture(2, covariance_type="full", n_init=10, init_params="random_from_data", random_state=0).fit(Z)
print(f"\ngrupos alargados: ARI k-medias = {adjusted_rand_score(yz, km2.labels_):.3f}")
print(f"  mezcla iniciada con k-medias: ARI = {adjusted_rand_score(yz, gm_km.predict(Z)):.3f}   log-verosimilitud media = {gm_km.score(Z):.3f}")
print(f"  mezcla iniciada al azar (10): ARI = {adjusted_rand_score(yz, gm.predict(Z)):.3f}   log-verosimilitud media = {gm.score(Z):.3f}")
print("probabilidades de pertenencia de 3 puntos (mezcla):", np.round(gm.predict_proba(Z[[0, 150, 450]]), 3).tolist())

print("\nBIC de mezclas con k componentes (menor es mejor):")
for k in range(1, 6):
    g = GaussianMixture(k, covariance_type="full", n_init=3, random_state=0).fit(X)
    print(f"  k = {k}: BIC = {g.bic(X):8.1f}")

# Iris sin etiquetas: ¿se recuperan las especies?
Xi, yi = load_iris(return_X_y=True)
Zi = StandardScaler().fit_transform(Xi)
for k in [2, 3]:
    lab = KMeans(k, n_init=10, random_state=0).fit_predict(Zi)
    print(f"\niris estandarizado, k = {k}: silueta = {silhouette_score(Zi, lab):.3f}   ARI con las especies = {adjusted_rand_score(yi, lab):.3f}")
