# Agrupamiento jerárquico, DBSCAN y HDBSCAN sobre formas no convexas
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
from sklearn.datasets import make_moons, make_blobs
from sklearn.cluster import AgglomerativeClustering, DBSCAN, HDBSCAN, KMeans
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import adjusted_rand_score

X, y = make_moons(400, noise=0.07, random_state=0)
rng = np.random.default_rng(0)
X = np.vstack([X, rng.uniform([-1.5, -1], [2.5, 1.5], (20, 2))])     # 20 puntos de ruido
y = np.r_[y, -np.ones(20, int)]
mask = y >= 0                                                          # ARI solo sobre los puntos de las lunas

print("método                       grupos  ruido   ARI (sobre las lunas)")
km = KMeans(2, n_init=10, random_state=0).fit_predict(X)
print(f"k-medias (k = 2)             {2:5d}  {0:5d}   {adjusted_rand_score(y[mask], km[mask]):.3f}")
for link in ["ward", "average", "complete", "single"]:
    lab = AgglomerativeClustering(2, linkage=link).fit_predict(X)
    print(f"aglomerativo, enlace {link:8s} {2:5d}  {0:5d}   {adjusted_rand_score(y[mask], lab[mask]):.3f}")

# Elegir eps con la gráfica de distancias al k-ésimo vecino
k = 5
d = np.sort(NearestNeighbors(n_neighbors=k).fit(X).kneighbors(X)[0][:, -1])
print(f"\ndistancia al {k}.º vecino (percentiles 50, 90, 95, 99): {np.round(np.percentile(d, [50, 90, 95, 99]), 3)}")
for eps in [0.05, 0.1, 0.15, 0.3, 0.6]:
    lab = DBSCAN(eps=eps, min_samples=k).fit_predict(X)
    ng = len(set(lab)) - (1 if -1 in lab else 0)
    print(f"DBSCAN eps = {eps:4.2f}: {ng:3d} grupos, {np.sum(lab == -1):3d} puntos de ruido, ARI = {adjusted_rand_score(y[mask], lab[mask]):.3f}, "
          f"ruido real detectado = {np.sum((lab == -1) & ~mask)} de 20")

hd = HDBSCAN(min_cluster_size=15).fit_predict(X)
print(f"HDBSCAN (min_cluster_size = 15): {len(set(hd)) - (1 if -1 in hd else 0)} grupos, {np.sum(hd == -1)} de ruido, "
      f"ARI = {adjusted_rand_score(y[mask], hd[mask]):.3f}")

# Densidades distintas: un único eps no sirve para todos
Xb, yb = make_blobs(600, centers=[[0, 0], [4, 0]], cluster_std=[0.3, 1.2], random_state=1)
for eps in [0.2, 0.5]:
    lab = DBSCAN(eps=eps, min_samples=8).fit_predict(Xb)
    print(f"\ndensidades distintas, DBSCAN eps = {eps}: {len(set(lab)) - (1 if -1 in lab else 0)} grupos, {np.sum(lab == -1)} de ruido")
lab = HDBSCAN(min_cluster_size=20).fit_predict(Xb)
print(f"densidades distintas, HDBSCAN: {len(set(lab)) - (1 if -1 in lab else 0)} grupos, {np.sum(lab == -1)} de ruido, ARI = {adjusted_rand_score(yb, lab):.3f}")

# El dendrograma resume todas las particiones posibles: cortar a distintas alturas
Z = linkage(Xb[:60], "ward")
for h in [2, 5, 15]:
    print(f"corte del dendrograma (Ward) a altura {h:2d}: {len(set(fcluster(Z, h, criterion='distance')))} grupos")
