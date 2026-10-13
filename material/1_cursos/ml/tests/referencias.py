"""Genera los valores de referencia con scikit-learn/SciPy para validar el núcleo JS.

Uso:  python tests/referencias.py
Escribe src/lib/05-datasets.js (iris y una muestra de dígitos 8×8, usados por las
simulaciones) y src/lib/91-ref.js (conjuntos de prueba pequeños y resultados
esperados). Los datos se redondean a 4 decimales ANTES de ajustar los modelos, de
modo que JavaScript y Python trabajan exactamente con los mismos números.
"""
import json, os, sys, warnings
import numpy as np
import scipy, sklearn
from scipy import stats
from scipy.cluster.hierarchy import linkage
from scipy.signal import correlate2d
from sklearn import datasets, linear_model, metrics, tree, ensemble, svm, cluster, mixture, decomposition, neighbors, naive_bayes, discriminant_analysis, calibration

warnings.filterwarnings("ignore")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda a: np.round(np.asarray(a, dtype=float), 4)
rs = np.random.RandomState(2026)

# ---------------------------------------------------------------- datos
# R1: regresión lineal múltiple, 3 variables (x2 correlacionada con x1)
n = 40
X = rs.randn(n, 3); X[:, 1] = 0.6 * X[:, 0] + 0.8 * X[:, 1]
y = 1.5 + 2.0 * X[:, 0] - 1.0 * X[:, 1] + 0.5 * X[:, 2] + 0.7 * rs.randn(n)
R1 = dict(X=R(X), y=R(y))
# R6: 6 variables, solo 2 relevantes (para Lasso)
X = rs.randn(50, 6); y = 3 * X[:, 0] - 2 * X[:, 3] + 0.5 * rs.randn(50)
R6 = dict(X=R(X), y=R(y))
# R2: regresión 1D no lineal
x = np.sort(rs.uniform(-2, 2, 60)); y = np.sin(1.8 * x) + 0.25 * rs.randn(60)
R2 = dict(X=R(x[:, None]), y=R(y))
# C1: clasificación binaria 2D solapada
n = 60
X = np.vstack([rs.randn(n // 2, 2) * 0.9 + [-0.8, -0.5], rs.randn(n // 2, 2) * 0.9 + [0.8, 0.6]])
y = np.r_[np.zeros(n // 2), np.ones(n // 2)].astype(int)
C1 = dict(X=R(X), y=y)
# C2: clasificación binaria no lineal (lunas) con ruido
X, y = datasets.make_moons(120, noise=0.3, random_state=7)
C2 = dict(X=R(X), y=y)
# C3: lunas más limpias para SVM RBF y DBSCAN
X, y = datasets.make_moons(80, noise=0.08, random_state=3)
C3 = dict(X=R(X), y=y)
# C4: dos gaussianas para GMM
X = np.vstack([rs.randn(70, 2) @ np.array([[1.0, 0.0], [0.6, 0.5]]) + [-1.5, 0], rs.randn(50, 2) * 0.6 + [1.8, 1.2]])
C4 = dict(X=R(X))
# Y/S: etiquetas y puntuaciones con empates para métricas
yb = rs.randint(0, 2, 50)
sc = np.round(np.clip(0.35 * yb + 0.65 * rs.rand(50), 0, 1), 2)
M = dict(y=yb.tolist(), s=sc.tolist(), yp=(sc >= 0.5).astype(int).tolist())
yr = rs.uniform(1, 10, 30); pr = yr + rs.randn(30)
MR = dict(y=R(yr), p=R(pr))

iris = datasets.load_iris()
IX, Iy = iris.data, iris.target

ref = {}
def put(k, v):
    ref[k] = v.tolist() if isinstance(v, np.ndarray) else v

# ---------------------------------------------------------------- lineales
X, y = np.array(R1["X"]), np.array(R1["y"])
ols = linear_model.LinearRegression().fit(X, y)
put("ols_coef", ols.coef_); put("ols_b", float(ols.intercept_)); put("ols_r2", float(ols.score(X, y)))
A = np.c_[np.ones(len(X)), X]; res = y - A @ np.r_[ols.intercept_, ols.coef_]
s2 = res @ res / (len(X) - A.shape[1]); se = np.sqrt(np.diag(s2 * np.linalg.inv(A.T @ A)))
put("ols_se", se); put("ols_p", 2 * stats.t.sf(np.abs(np.r_[ols.intercept_, ols.coef_] / se), len(X) - A.shape[1]))
vif = [1 / (1 - linear_model.LinearRegression().fit(np.delete(X, j, 1), X[:, j]).score(np.delete(X, j, 1), X[:, j])) for j in range(3)]
put("vif", vif)
put("ridge_coef", linear_model.Ridge(alpha=2.5).fit(X, y).coef_)
X6, y6 = np.array(R6["X"]), np.array(R6["y"])
put("lasso_coef", linear_model.Lasso(alpha=0.1, tol=1e-12, max_iter=10**6).fit(X6, y6).coef_)
put("lasso_coef_big", linear_model.Lasso(alpha=0.8, tol=1e-12, max_iter=10**6).fit(X6, y6).coef_)
put("enet_coef", linear_model.ElasticNet(alpha=0.1, l1_ratio=0.5, tol=1e-12, max_iter=10**6).fit(X6, y6).coef_)
put("lasso_alphamax", float(np.max(np.abs((X6 - X6.mean(0)).T @ (y6 - y6.mean()))) / len(y6)))
Xc, yc = np.array(C1["X"]), np.array(C1["y"])
lr = linear_model.LogisticRegression(C=1.0, tol=1e-12, max_iter=100000).fit(Xc, yc)
put("logit_coef", lr.coef_[0]); put("logit_b", float(lr.intercept_[0]))
lr2 = linear_model.LogisticRegression(C=0.05, tol=1e-12, max_iter=100000).fit(Xc, yc)
put("logit_coef_C005", lr2.coef_[0])
mn = linear_model.LogisticRegression(C=1.0, tol=1e-12, max_iter=100000).fit(IX, Iy)
put("softmax_coef", mn.coef_); put("softmax_b", mn.intercept_)
put("softmax_p0", mn.predict_proba(IX[[0, 60, 120]]))
Xr, yr2 = np.array(R2["X"]), np.array(R2["y"])
q = linear_model.QuantileRegressor(quantile=0.8, alpha=0, solver="highs").fit(Xr, yr2)
put("quant_coef", [float(q.intercept_), float(q.coef_[0])])

# ---------------------------------------------------------------- métricas
y_, s_, p_ = np.array(M["y"]), np.array(M["s"]), np.array(M["yp"])
put("auc", metrics.roc_auc_score(y_, s_)); put("ap", metrics.average_precision_score(y_, s_))
put("logloss", metrics.log_loss(y_, s_)); put("brier", metrics.brier_score_loss(y_, s_))
put("mcc", metrics.matthews_corrcoef(y_, p_)); put("kappa", metrics.cohen_kappa_score(y_, p_))
put("f1", metrics.f1_score(y_, p_)); put("bacc", metrics.balanced_accuracy_score(y_, p_))
fpr, tpr, thr = metrics.roc_curve(y_, s_, drop_intermediate=False); put("roc_n", len(fpr))
pt, pp = calibration.calibration_curve(y_, s_, n_bins=5); put("cal_true", pt); put("cal_pred", pp)
yy, pp2 = np.array(MR["y"]), np.array(MR["p"])
put("r2", metrics.r2_score(yy, pp2)); put("mae", metrics.mean_absolute_error(yy, pp2)); put("mape", metrics.mean_absolute_percentage_error(yy, pp2))
put("rmse", float(np.sqrt(metrics.mean_squared_error(yy, pp2))))

# ---------------------------------------------------------------- vecinos y Bayes
Q3 = np.array([[0.0, 0.0], [1.0, -0.5], [-1.2, 0.7]])
knn = neighbors.KNeighborsClassifier(5).fit(Xc, yc); put("knn_p", knn.predict_proba(Q3)[:, 1])
knnd = neighbors.KNeighborsClassifier(7, weights="distance").fit(Xc, yc); put("knnd_p", knnd.predict_proba(Q3)[:, 1])
gnb = naive_bayes.GaussianNB().fit(IX, Iy); put("gnb_p", gnb.predict_proba(IX[[10, 70, 130]])); put("gnb_acc", gnb.score(IX, Iy))
lda = discriminant_analysis.LinearDiscriminantAnalysis().fit(IX, Iy); put("lda_p", lda.predict_proba(IX[[70, 83, 133]])); put("lda_acc", lda.score(IX, Iy))
qda = discriminant_analysis.QuadraticDiscriminantAnalysis().fit(IX, Iy); put("qda_p", qda.predict_proba(IX[[70, 83, 133]])); put("qda_acc", qda.score(IX, Iy))

# ---------------------------------------------------------------- árboles y ensambles
X2, y2 = np.array(C2["X"]), np.array(C2["y"])
dt = tree.DecisionTreeClassifier(max_depth=3, random_state=0).fit(X2, y2)
put("tree_acc", dt.score(X2, y2)); put("tree_imp", dt.feature_importances_)
dte = tree.DecisionTreeClassifier(max_depth=3, criterion="entropy", random_state=0).fit(X2, y2); put("tree_ent_acc", dte.score(X2, y2))
path = tree.DecisionTreeClassifier(random_state=0).cost_complexity_pruning_path(X2, y2)
put("ccp_alphas", path.ccp_alphas); put("ccp_imp", path.impurities)
G = np.linspace(-1.9, 1.9, 9)[:, None]
dtr = tree.DecisionTreeRegressor(max_depth=3).fit(Xr, yr2); put("treg_pred", dtr.predict(G))
gbr = ensemble.GradientBoostingRegressor(n_estimators=20, learning_rate=0.1, max_depth=2, random_state=0).fit(Xr, yr2); put("gbr_pred", gbr.predict(G))
gbc = ensemble.GradientBoostingClassifier(n_estimators=20, learning_rate=0.2, max_depth=2, random_state=0).fit(X2, y2); put("gbc_p", gbc.predict_proba(Q3)[:, 1])
ada = ensemble.AdaBoostClassifier(tree.DecisionTreeClassifier(max_depth=1), n_estimators=8, learning_rate=1.0, random_state=0).fit(X2, y2)
put("ada_w", ada.estimator_weights_); put("ada_acc", ada.score(X2, y2))

# ---------------------------------------------------------------- SVM
sv = svm.SVC(kernel="linear", C=1.0, tol=1e-8).fit(Xc, yc); put("svml_dec", sv.decision_function(Q3)); put("svml_nsv", int(sv.n_support_.sum()))
X3, y3 = np.array(C3["X"]), np.array(C3["y"])
svr = svm.SVC(kernel="rbf", C=2.0, gamma=1.5, tol=1e-8).fit(X3, y3); put("svmr_dec", svr.decision_function(Q3)); put("svmr_nsv", int(svr.n_support_.sum()))
svp = svm.SVC(kernel="poly", degree=3, gamma=1.0, coef0=1.0, C=0.5, tol=1e-8).fit(X3, y3); put("svmp_dec", svp.decision_function(Q3))
put("gamma_scale", float(1 / (X3.shape[1] * X3.var())))

# ---------------------------------------------------------------- no supervisado
X4 = np.array(C4["X"])
km = cluster.KMeans(3, init=X4[[0, 1, 2]], n_init=1, algorithm="lloyd", tol=0, max_iter=1000).fit(X4)
put("km_inertia", float(km.inertia_)); put("km_sil", float(metrics.silhouette_score(X4, km.labels_)))
lab_a = km.labels_; lab_b = (X4[:, 0] > 0).astype(int); put("ari", float(metrics.adjusted_rand_score(lab_b, lab_a)))
X20 = X4[:20]
for m in ["single", "complete", "average", "ward"]:
    put("link_" + m, linkage(X20, m)[:, 2])
db = cluster.DBSCAN(eps=0.25, min_samples=5).fit(X3); put("db_ncl", int(len(set(db.labels_)) - (1 if -1 in db.labels_ else 0))); put("db_noise", int((db.labels_ == -1).sum()))
gm = mixture.GaussianMixture(2, covariance_type="full", tol=1e-12, max_iter=5000, reg_covar=1e-6, random_state=0, n_init=5).fit(X4)
put("gmm_ll", float(gm.score(X4)))
pca = decomposition.PCA().fit(IX); put("pca_ratio", pca.explained_variance_ratio_)
pcs = decomposition.PCA().fit((IX - IX.mean(0)) / IX.std(0)); put("pca_ratio_std", pcs.explained_variance_ratio_)

# ---------------------------------------------------------------- estadística y redes
put("t975_4", float(stats.t.ppf(0.975, 4))); put("t975_29", float(stats.t.ppf(0.975, 29)))
put("z975", float(stats.norm.ppf(0.975))); put("chi2_95_3", float(stats.chi2.cdf(7.814727903251178, 3)))
from sklearn.ensemble._iforest import _average_path_length
put("iso_c256", float(_average_path_length([256])[0]))
img = np.arange(36, dtype=float).reshape(6, 6) % 7; ker = np.array([[1, 0, -1], [2, 0, -2], [1, 0, -1]], float)
put("conv_valid", correlate2d(img, ker, mode="valid").ravel())
import torch
torch.manual_seed(0)
net = torch.nn.Sequential(torch.nn.Linear(3, 4), torch.nn.Tanh(), torch.nn.Linear(4, 2))
xt = torch.tensor([[0.5, -1.2, 0.3], [1.1, 0.4, -0.7]], dtype=torch.float64); yt = torch.tensor([1, 0])
net = net.double()
loss = torch.nn.functional.cross_entropy(net(xt), yt); loss.backward()
W1, b1, W2, b2 = [p.detach().numpy() for p in net.parameters()]
G1 = net[0].weight.grad.numpy()
put("torch_net", dict(W1=W1.tolist(), b1=b1.tolist(), W2=W2.tolist(), b2=b2.tolist(), x=xt.numpy().tolist(), y=[1, 0], loss=float(loss), gW1=G1.tolist(), gb2=net[2].bias.grad.numpy().tolist()))

data = dict(R1=R1, R6=R6, R2=R2, C1=C1, C2=C2, C3=C3, C4=C4, M=M, MR=MR, Q3=Q3.tolist(),
            iris_idx=[0, 60, 120], conv_img=img.tolist(), conv_ker=ker.tolist())
def enc(o):
    if isinstance(o, np.ndarray): return o.tolist()
    if isinstance(o, (np.integer,)): return int(o)
    if isinstance(o, (np.floating,)): return float(o)
    raise TypeError(type(o))
hdr = f"/* Generado por tests/referencias.py con scikit-learn {sklearn.__version__}, SciPy {scipy.__version__}, NumPy {np.__version__}, PyTorch {torch.__version__}. No editar a mano. */\n"
with open(os.path.join(ROOT, "src", "lib", "91-ref.js"), "w", encoding="utf8") as f:
    f.write(hdr + "(function (root) {\n  const L = ((root.ML = root.ML || {}).L = root.ML.L || {});\n")
    f.write("  L.REF = " + json.dumps(dict(data=data, ref=ref, versions=dict(sklearn=sklearn.__version__, scipy=scipy.__version__, numpy=np.__version__, torch=torch.__version__)), default=enc, separators=(",", ":")) + ";\n")
    f.write("})(typeof window !== 'undefined' ? window : globalThis);\n")

# ---------------------------------------------------------------- conjuntos para las simulaciones
dig = datasets.load_digits()
sel = np.concatenate([np.where(dig.target == d)[0][:70] for d in range(10)])
alpha = "0123456789ABCDEFG"
dstr = "".join("".join(alpha[int(v)] for v in dig.data[i]) for i in sel)
with open(os.path.join(ROOT, "src", "lib", "05-datasets.js"), "w", encoding="utf8") as f:
    f.write(hdr)
    f.write("(function (root) {\n  const L = ((root.ML = root.ML || {}).L = root.ML.L || {});\n  const DS = (L.ds = L.ds || {});\n")
    f.write("  /* Iris de Fisher (Anderson, 1935), tal como lo distribuye scikit-learn: 150 flores, 4 medidas en cm */\n")
    f.write("  DS.iris = { names: ['largo del sépalo', 'ancho del sépalo', 'largo del pétalo', 'ancho del pétalo'], classes: ['setosa', 'versicolor', 'virginica'], X: " + json.dumps(IX.round(1).tolist(), separators=(",", ":")) + ", y: " + json.dumps(Iy.tolist(), separators=(",", ":")) + " };\n")
    f.write("  /* Dígitos 8×8 de UCI (load_digits): 70 por clase, intensidades 0–16 codificadas en base 17 */\n")
    f.write("  const DIG = '" + dstr + "';\n")
    f.write("  DS.digits = { y: " + json.dumps(dig.target[sel].tolist(), separators=(",", ":")) + ", X: Array.from({ length: " + str(len(sel)) + " }, (_, i) => Array.from({ length: 64 }, (_, j) => parseInt(DIG[i * 64 + j], 17))) };\n")
    f.write("})(typeof window !== 'undefined' ? window : globalThis);\n")
print("OK", len(ref), "referencias")

# ---------------------------------------------------------------- (añadido) isotónica
from sklearn.isotonic import IsotonicRegression
xi = np.round(rs.uniform(0, 1, 40), 4); yi = (rs.rand(40) < xi ** 2).astype(float)
iso = IsotonicRegression(out_of_bounds="clip").fit(xi, yi)
grid = np.linspace(0, 1, 11)
extra = dict(iso_x=xi.tolist(), iso_y=yi.tolist(), iso_pred=iso.predict(grid).tolist())
with open(os.path.join(ROOT, "src", "lib", "92-ref-extra.js"), "w", encoding="utf8") as f:
    f.write(hdr + "(function (root) {\n  const L = ((root.ML = root.ML || {}).L = root.ML.L || {});\n  L.REF2 = " + json.dumps(extra, separators=(",", ":")) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")

# ---------------------------------------------------------------- (añadido) t-SNE: probabilidades conjuntas
from sklearn.manifold._t_sne import _joint_probabilities
from scipy.spatial.distance import squareform, pdist
X4b = np.array(C4["X"])[:60]
Pc = squareform(_joint_probabilities(squareform(pdist(X4b, "sqeuclidean")), 10.0, 0))
extra["tsne_P"] = Pc[:4, :12].tolist()
with open(os.path.join(ROOT, "src", "lib", "92-ref-extra.js"), "w", encoding="utf8") as f:
    f.write(hdr + "(function (root) {\n  const L = ((root.ML = root.ML || {}).L = root.ML.L || {});\n  L.REF2 = " + json.dumps(extra, separators=(",", ":")) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
