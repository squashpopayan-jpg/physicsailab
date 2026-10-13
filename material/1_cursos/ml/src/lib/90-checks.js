/* ===================================================================
   lib/90-checks.js — Catálogo de validaciones del núcleo de algoritmos.
   Cada prueba compara un cálculo en JavaScript con scikit-learn, SciPy
   o PyTorch (valores en 91-ref.js, generados por tests/referencias.py)
   o con una identidad matemática exacta.
   Formato: {cap, id, what, ref, src, tol, rel, unit, fn() → valor}.
   Para vectores, fn devuelve el máximo |Δ| y la referencia es 0.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const C = [];
  const add = (cap, id, what, ref, src, tol, fn, o = {}) => C.push(Object.assign({ cap, id, what, ref, src, tol, fn }, o));
  L.CHECKS = C;
  const R = () => L.REF.ref, D = () => L.REF.data;
  const SK = () => 'scikit-learn ' + L.REF.versions.sklearn;
  const maxd = (a, b) => { a = a.flat ? a.flat(3) : a; b = b.flat ? b.flat(3) : b; let m = 0; for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return a.length === b.length ? m : Infinity; };
  const vec = (cap, id, what, src, tol, fn) => add(cap, id, what + ' (máx |Δ|)', 0, src, tol, fn);
  const toInt = (y) => y.map((v) => Math.round(v));

  /* ---------- 2 · Matemáticas y probabilidad ---------- */
  add(2, 't4', 'Cuantil t de Student 0.975 con 4 g.l.', () => R().t975_4, 'SciPy stats.t.ppf', 1e-9, () => L.stat.tQuantile(0.975, 4));
  add(2, 't29', 'Cuantil t de Student 0.975 con 29 g.l.', () => R().t975_29, 'SciPy stats.t.ppf', 1e-9, () => L.stat.tQuantile(0.975, 29));
  add(2, 'z975', 'Cuantil normal 0.975', () => R().z975, 'SciPy stats.norm.ppf', 1e-9, () => L.stat.normQuantile(0.975));
  add(2, 'chi2', 'CDF χ² con 3 g.l. en 7.8147', 0.95, 'SciPy stats.chi2.cdf', 1e-9, () => L.stat.chi2CDF(7.814727903251178, 3));

  /* ---------- 3 · Generalización ---------- */
  add(3, 'leg', 'Polinomio en base de Legendre = MCO con monomios (grado 3, máx |Δ| de predicciones)', 0, 'identidad de bases', 1e-9, () => {
    const x = D().R2.X.map((r) => r[0]), y = D().R2.y, m = L.lin.polyFit(x, y, 3, { alpha: 0 });
    const o = L.lin.ols(x.map((v) => [v, v * v, v * v * v]), y, { stats: false });
    return maxd(x.map((v) => m.predict1(v)), o.yhat);
  });
  add(3, 'mnorm', 'Norma mínima (p > n): interpola los datos de entrenamiento (máx |residuo|)', 0, 'propiedad de la solución', 1e-6, () => {
    const rng = L.rng(2), Phi = Array.from({ length: 10 }, () => Array.from({ length: 30 }, () => rng.gauss())), y = Phi.map(() => rng.gauss());
    const w = L.lin.minNorm(Phi, y, 1e-12);
    return Math.max(...Phi.map((r, i) => Math.abs(L.la.dot(r, w) - y[i])));
  });

  /* ---------- 6 · Regresión lineal ---------- */
  vec(6, 'ols', 'MCO: coeficientes de 3 variables', 'LinearRegression · ' + 'sklearn', 1e-9, () => maxd(L.lin.ols(D().R1.X, D().R1.y).coef, R().ols_coef));
  add(6, 'olsb', 'MCO: intercepto', () => R().ols_b, 'LinearRegression', 1e-9, () => L.lin.ols(D().R1.X, D().R1.y).intercept);
  add(6, 'olsr2', 'MCO: R² de entrenamiento', () => R().ols_r2, 'LinearRegression.score', 1e-10, () => L.lin.ols(D().R1.X, D().R1.y).r2);
  vec(6, 'olsse', 'MCO: errores estándar', 'NumPy (σ̂²(XᵀX)⁻¹)', 1e-9, () => maxd(L.lin.ols(D().R1.X, D().R1.y).se, R().ols_se));
  vec(6, 'olsp', 'MCO: valores p de las pruebas t', 'SciPy stats.t.sf', 1e-8, () => maxd(L.lin.ols(D().R1.X, D().R1.y).pval, R().ols_p));
  vec(6, 'vif', 'Factores de inflación de la varianza (VIF)', 'LinearRegression por variable', 1e-8, () => maxd(L.lin.vif(D().R1.X), R().vif));

  /* ---------- 7 · Descenso de gradiente ---------- */
  add(7, 'gdq', 'Descenso de gradiente en cuenco: distancia al mínimo tras 400 pasos (η = 0.15)', 0, 'mínimo exacto (0, 0)', 1e-10, () => { const p = L.opt.path(L.opt.SURF.bowl, 'gd', { lr: 0.15 }, 400); const e = p[p.length - 1]; return Math.hypot(e[0], e[1]); });
  add(7, 'adam', 'Adam en Rosenbrock: distancia al mínimo (1, 1) tras 6000 pasos', 0, 'mínimo exacto', 2e-3, () => { const p = L.opt.path(L.opt.SURF.rosen, 'adam', { lr: 0.01 }, 6000); const e = p[p.length - 1]; return Math.hypot(e[0] - 1, e[1] - 1); });
  add(7, 'gdlin', 'GD sobre MSE converge a la solución de MCO (máx |Δ| de pesos)', 0, 'ecuaciones normales', 1e-8, () => {
    const { X, y } = D().R1, n = X.length, w = new Float64Array(4), o = L.opt.make('gd', { lr: 0.2 });
    for (let it = 0; it < 4000; it++) { const g = new Float64Array(4); for (let i = 0; i < n; i++) { const e = w[0] + w[1] * X[i][0] + w[2] * X[i][1] + w[3] * X[i][2] - y[i]; g[0] += e / n; for (let j = 0; j < 3; j++) g[j + 1] += (e * X[i][j]) / n; } o.step(w, g); }
    return maxd(Array.from(w), [R().ols_b, ...R().ols_coef]);
  });

  /* ---------- 8 · Regularización ---------- */
  vec(8, 'ridge', 'Ridge α = 2.5: coeficientes', 'Ridge', 1e-9, () => maxd(L.lin.ridge(D().R1.X, D().R1.y, 2.5).coef, R().ridge_coef));
  vec(8, 'lasso', 'Lasso α = 0.1: coeficientes (6 variables, 2 relevantes)', 'Lasso', 1e-8, () => maxd(L.lin.lasso(D().R6.X, D().R6.y, 0.1).coef, R().lasso_coef));
  vec(8, 'lassob', 'Lasso α = 0.8: coeficientes (ceros exactos)', 'Lasso', 1e-8, () => maxd(L.lin.lasso(D().R6.X, D().R6.y, 0.8).coef, R().lasso_coef_big));
  vec(8, 'enet', 'Elastic Net α = 0.1, l1_ratio = 0.5', 'ElasticNet', 1e-8, () => maxd(L.lin.enet(D().R6.X, D().R6.y, 0.1, 0.5).coef, R().enet_coef));
  add(8, 'amax', 'α máximo del Lasso (todos los coeficientes nulos)', () => R().lasso_alphamax, 'fórmula max|Xᵀy|/n', 1e-12, () => L.lin.alphaMax(D().R6.X, D().R6.y));

  /* ---------- 9 · Métricas de regresión ---------- */
  add(9, 'r2', 'R² de predicciones fijas', () => R().r2, 'r2_score', 1e-12, () => L.met.r2(D().MR.y, D().MR.p));
  add(9, 'mae', 'Error absoluto medio', () => R().mae, 'mean_absolute_error', 1e-12, () => L.met.mae(D().MR.y, D().MR.p));
  add(9, 'mape', 'Error porcentual absoluto medio (fracción)', () => R().mape, 'mean_absolute_percentage_error', 1e-12, () => L.met.mape(D().MR.y, D().MR.p));
  add(9, 'rmse', 'Raíz del error cuadrático medio', () => R().rmse, 'mean_squared_error', 1e-12, () => L.met.rmse(D().MR.y, D().MR.p));
  vec(9, 'quant', 'Regresión cuantílica τ = 0.8: intercepto y pendiente', 'QuantileRegressor (HiGHS)', 1e-6, () => { const m = L.lin.quantile(D().R2.X, D().R2.y, 0.8); return maxd([m.intercept, m.coef[0]], R().quant_coef); });
  add(9, 'huber', 'Huber con ε enorme coincide con MCO (máx |Δ|)', 0, 'identidad', 1e-9, () => { const m = L.lin.huber(D().R1.X, D().R1.y, 1e9); return maxd(m.coef, R().ols_coef); });

  /* ---------- 10 · Regresión logística ---------- */
  vec(10, 'logit', 'Logística C = 1: coeficientes', 'LogisticRegression (lbfgs)', 1e-6, () => maxd(L.lin.logistic(D().C1.X, D().C1.y, { C: 1 }).coef, R().logit_coef));
  add(10, 'logitb', 'Logística C = 1: intercepto', () => R().logit_b, 'LogisticRegression', 1e-6, () => L.lin.logistic(D().C1.X, D().C1.y, { C: 1 }).intercept);
  vec(10, 'logit5', 'Logística C = 0.05 (más regularizada): coeficientes', 'LogisticRegression', 1e-6, () => maxd(L.lin.logistic(D().C1.X, D().C1.y, { C: 0.05 }).coef, R().logit_coef_C005));
  vec(10, 'smax', 'Softmax multinomial en iris: 12 coeficientes', 'LogisticRegression multinomial', 1e-5, () => maxd(L.lin.softmax(L.ds.iris.X, L.ds.iris.y, { C: 1 }).coef, R().softmax_coef));
  vec(10, 'smaxp', 'Softmax en iris: probabilidades de 3 flores', 'predict_proba', 1e-6, () => { const m = L.lin.softmax(L.ds.iris.X, L.ds.iris.y, { C: 1 }); return maxd(m.proba(D().iris_idx.map((i) => L.ds.iris.X[i])), R().softmax_p0); });

  /* ---------- 11 · Métricas de clasificación ---------- */
  add(11, 'auc', 'AUC ROC (puntuaciones con empates)', () => R().auc, 'roc_auc_score', 1e-12, () => L.met.auc(D().M.y, D().M.s));
  add(11, 'aucmw', 'AUC trapezoidal = estadístico de Mann–Whitney', 0, 'identidad', 1e-12, () => L.met.auc(D().M.y, D().M.s) - L.met.aucRank(D().M.y, D().M.s));
  add(11, 'ap', 'Precisión promedio (AP)', () => R().ap, 'average_precision_score', 1e-12, () => L.met.ap(D().M.y, D().M.s));
  add(11, 'll', 'Pérdida logarítmica', () => R().logloss, 'log_loss', 1e-12, () => L.met.logloss(D().M.y, D().M.s));
  add(11, 'mcc', 'Coeficiente de correlación de Matthews', () => R().mcc, 'matthews_corrcoef', 1e-12, () => L.met.binary(D().M.y, D().M.yp).mcc);
  add(11, 'kappa', 'Kappa de Cohen', () => R().kappa, 'cohen_kappa_score', 1e-12, () => L.met.binary(D().M.y, D().M.yp).kappa);
  add(11, 'f1', 'F1 de la clase positiva', () => R().f1, 'f1_score', 1e-12, () => L.met.binary(D().M.y, D().M.yp).f1);
  add(11, 'bacc', 'Exactitud balanceada', () => R().bacc, 'balanced_accuracy_score', 1e-12, () => L.met.binary(D().M.y, D().M.yp).bacc);
  add(11, 'rocn', 'Número de puntos de la curva ROC (con empates)', () => R().roc_n, 'roc_curve', 0, () => L.met.roc(D().M.y, D().M.s).fpr.length);

  /* ---------- 12 · Calibración ---------- */
  add(12, 'brier', 'Puntuación de Brier', () => R().brier, 'brier_score_loss', 1e-12, () => L.met.brier(D().M.y, D().M.s));
  vec(12, 'cal', 'Curva de fiabilidad (5 bins): frecuencias observadas', 'calibration_curve', 1e-12, () => maxd(L.met.calibration(D().M.y, D().M.s, 5).true, R().cal_true));
  vec(12, 'calp', 'Curva de fiabilidad (5 bins): probabilidad media', 'calibration_curve', 1e-12, () => maxd(L.met.calibration(D().M.y, D().M.s, 5).pred, R().cal_pred));

  vec(12, 'iso', 'Regresión isotónica (PAV): predicciones en 11 puntos', 'IsotonicRegression', 1e-12, () => { const m = L.met.isotonic(L.REF2.iso_x, L.REF2.iso_y); return maxd(Array.from(L.util.linspace(0, 1, 11), m.f), L.REF2.iso_pred); });

  /* ---------- 13 · k vecinos ---------- */
  vec(13, 'knn', 'k-NN (k = 5): probabilidad de clase 1 en 3 puntos', 'KNeighborsClassifier', 1e-12, () => maxd(L.knn.classifier(D().C1.X, D().C1.y, 5).probaAll(D().Q3).map((p) => p[1]), R().knn_p));
  vec(13, 'knnd', 'k-NN (k = 7, ponderado por distancia)', 'KNeighborsClassifier(weights=distance)', 1e-12, () => maxd(L.knn.classifier(D().C1.X, D().C1.y, 7, { weights: 'distance' }).probaAll(D().Q3).map((p) => p[1]), R().knnd_p));

  /* ---------- 14 · Bayes y discriminantes ---------- */
  const irisPts = (ix) => ix.map((i) => L.ds.iris.X[i]);
  vec(14, 'gnb', 'Bayes ingenuo gaussiano en iris: probabilidades', 'GaussianNB', 1e-9, () => maxd(L.gen.gaussianNB(L.ds.iris.X, L.ds.iris.y).proba(irisPts([10, 70, 130])), R().gnb_p));
  add(14, 'gnba', 'Bayes ingenuo gaussiano: exactitud de entrenamiento', () => R().gnb_acc, 'GaussianNB.score', 1e-12, () => L.met.accuracy(L.ds.iris.y, L.gen.gaussianNB(L.ds.iris.X, L.ds.iris.y).predict(L.ds.iris.X)));
  vec(14, 'lda', 'LDA en iris: probabilidades', 'LinearDiscriminantAnalysis', 1e-8, () => maxd(L.gen.lda(L.ds.iris.X, L.ds.iris.y).proba(irisPts([70, 83, 133])), R().lda_p));
  add(14, 'ldaa', 'LDA: exactitud de entrenamiento', () => R().lda_acc, 'LinearDiscriminantAnalysis.score', 1e-12, () => L.met.accuracy(L.ds.iris.y, L.gen.lda(L.ds.iris.X, L.ds.iris.y).predict(L.ds.iris.X)));
  vec(14, 'qda', 'QDA en iris: probabilidades', 'QuadraticDiscriminantAnalysis', 1e-8, () => maxd(L.gen.qda(L.ds.iris.X, L.ds.iris.y).proba(irisPts([70, 83, 133])), R().qda_p));
  add(14, 'qdaa', 'QDA: exactitud de entrenamiento', () => R().qda_acc, 'QuadraticDiscriminantAnalysis.score', 1e-12, () => L.met.accuracy(L.ds.iris.y, L.gen.qda(L.ds.iris.X, L.ds.iris.y).predict(L.ds.iris.X)));

  /* ---------- 15 · SVM ---------- */
  vec(15, 'svml', 'SVM lineal C = 1: función de decisión en 3 puntos', 'SVC(kernel=linear)', 1e-5, () => maxd(L.svm.fit(D().C1.X, D().C1.y, { kernel: 'linear', C: 1, tol: 1e-8 }).decision(D().Q3), R().svml_dec));
  add(15, 'svmln', 'SVM lineal: número de vectores de soporte', () => R().svml_nsv, 'SVC.n_support_', 0, () => L.svm.fit(D().C1.X, D().C1.y, { kernel: 'linear', C: 1, tol: 1e-8 }).sv.length);
  vec(15, 'svmr', 'SVM RBF (γ = 1.5, C = 2): función de decisión', 'SVC(kernel=rbf)', 1e-5, () => maxd(L.svm.fit(D().C3.X, D().C3.y, { kernel: 'rbf', C: 2, gamma: 1.5, tol: 1e-8 }).decision(D().Q3), R().svmr_dec));
  add(15, 'svmrn', 'SVM RBF: número de vectores de soporte', () => R().svmr_nsv, 'SVC.n_support_', 0, () => L.svm.fit(D().C3.X, D().C3.y, { kernel: 'rbf', C: 2, gamma: 1.5, tol: 1e-8 }).sv.length);
  vec(15, 'svmp', 'SVM polinómica (grado 3): función de decisión', 'SVC(kernel=poly)', 1e-5, () => maxd(L.svm.fit(D().C3.X, D().C3.y, { kernel: 'poly', degree: 3, gamma: 1, coef0: 1, C: 0.5, tol: 1e-8 }).decision(D().Q3), R().svmp_dec));
  add(15, 'gsc', 'γ = "scale" (1 / (p·Var X))', () => R().gamma_scale, 'SVC(gamma=scale)', 1e-12, () => L.svm.gammaScale(D().C3.X));

  /* ---------- 16 · Árboles ---------- */
  const tree3 = (crit) => L.tree.fit(D().C2.X, D().C2.y, { maxDepth: 3, criterion: crit });
  add(16, 'tree', 'Árbol (Gini, profundidad 3): exactitud de entrenamiento', () => R().tree_acc, 'DecisionTreeClassifier', 1e-12, () => L.met.accuracy(D().C2.y, tree3('gini').predict(D().C2.X)));
  vec(16, 'treei', 'Árbol: importancias de Gini (MDI)', 'feature_importances_', 1e-10, () => maxd(tree3('gini').importances(), R().tree_imp));
  add(16, 'treee', 'Árbol (entropía, profundidad 3): exactitud', () => R().tree_ent_acc, 'DecisionTreeClassifier(criterion=entropy)', 1e-12, () => L.met.accuracy(D().C2.y, tree3('entropy').predict(D().C2.X)));
  vec(16, 'ccp', 'Poda de costo–complejidad: α efectivos', 'cost_complexity_pruning_path', 1e-10, () => maxd(L.tree.prunePath(L.tree.fit(D().C2.X, D().C2.y, {})).alphas, R().ccp_alphas));
  vec(16, 'ccpi', 'Poda: impureza total de las hojas por α', 'cost_complexity_pruning_path', 1e-10, () => maxd(L.tree.prunePath(L.tree.fit(D().C2.X, D().C2.y, {})).impurities, R().ccp_imp));
  vec(16, 'treg', 'Árbol de regresión (profundidad 3): predicciones', 'DecisionTreeRegressor', 1e-10, () => { const t = L.tree.fit(D().R2.X, D().R2.y, { task: 'reg', maxDepth: 3 }); return maxd(t.predict(Array.from(L.util.linspace(-1.9, 1.9, 9), (v) => [v])), R().treg_pred); });

  /* ---------- 17 · Bosques ---------- */
  add(17, 'bag1', 'Bosque de 1 árbol sin bootstrap ni submuestreo = árbol único (diferencias)', 0, 'identidad', 0, () => { const f = L.ens.forest(D().C2.X, D().C2.y, { nTrees: 1, bootstrap: false, maxFeatures: 2 }); const t = L.tree.fit(D().C2.X, D().C2.y, {}); return f.predict(D().C2.X).filter((v, i) => v !== t.predict([D().C2.X[i]])[0]).length; });
  add(17, 'oob', 'Bosque de 200 árboles: exactitud OOB razonable en lunas con ruido', 0.88, 'rango esperado (0.83–0.93)', 0.05, () => L.ens.forest(D().C2.X, D().C2.y, { nTrees: 200, rng: L.rng(4) }).oob());

  /* ---------- 18 · Boosting ---------- */
  vec(18, 'gbr', 'Gradient boosting de regresión (20 árboles): predicciones', 'GradientBoostingRegressor', 1e-10, () => { const m = L.ens.gboost(D().R2.X, D().R2.y, { loss: 'sq', nEst: 20, lr: 0.1, depth: 2 }); return maxd(m.predict(Array.from(L.util.linspace(-1.9, 1.9, 9), (v) => [v])), R().gbr_pred); });
  vec(18, 'gbc', 'Gradient boosting de clasificación: probabilidades', 'GradientBoostingClassifier', 1e-9, () => maxd(L.ens.gboost(D().C2.X, D().C2.y, { loss: 'log', nEst: 20, lr: 0.2, depth: 2 }).proba(D().Q3), R().gbc_p));
  vec(18, 'ada', 'AdaBoost SAMME: pesos de los 8 tocones', 'AdaBoostClassifier', 1e-9, () => maxd(L.ens.adaboost(D().C2.X, D().C2.y, { nEst: 8 }).alphas, R().ada_w));
  add(18, 'adaa', 'AdaBoost SAMME: exactitud de entrenamiento', () => R().ada_acc, 'AdaBoostClassifier.score', 1e-12, () => L.met.accuracy(D().C2.y, L.ens.adaboost(D().C2.X, D().C2.y, { nEst: 8 }).predict(D().C2.X)));

  /* ---------- 20 · k-medias y mezclas ---------- */
  const km3 = () => L.clu.kmeans(D().C4.X, 3, { init: D().C4.X.slice(0, 3), maxIt: 1000 });
  add(20, 'km', 'k-medias (Lloyd, mismos centros iniciales): inercia', () => R().km_inertia, 'KMeans', 1e-9, () => km3().inertia);
  add(20, 'sil', 'Coeficiente de silueta de esa partición', () => R().km_sil, 'silhouette_score', 1e-12, () => L.met.silhouette(D().C4.X, km3().lab));
  add(20, 'ari', 'Índice de Rand ajustado', () => R().ari, 'adjusted_rand_score', 1e-12, () => L.met.ari(D().C4.X.map((r) => (r[0] > 0 ? 1 : 0)), km3().lab));
  add(20, 'gmm', 'Mezcla de 2 gaussianas: log-verosimilitud media', () => R().gmm_ll, 'GaussianMixture.score', 1e-6, () => L.clu.gmm(D().C4.X, 2, { rng: L.rng(2), tol: 1e-13, maxIt: 5000 }).ll);

  /* ---------- 21 · Jerárquico y DBSCAN ---------- */
  for (const m of ['single', 'complete', 'average', 'ward']) vec(21, 'lk' + m.slice(0, 3), `Enlace ${m === 'single' ? 'simple' : m === 'complete' ? 'completo' : m === 'average' ? 'promedio' : 'de Ward'}: alturas de las 19 fusiones`, 'SciPy linkage', 1e-10, () => maxd(L.clu.agglo(D().C4.X.slice(0, 20), m).map((r) => r[2]), R()['link_' + m]));
  add(21, 'dbn', 'DBSCAN (ε = 0.25, minPts = 5): número de grupos', () => R().db_ncl, 'DBSCAN', 0, () => L.clu.dbscan(D().C3.X, 0.25, 5).nClusters);
  add(21, 'dbr', 'DBSCAN: número de puntos de ruido', () => R().db_noise, 'DBSCAN', 0, () => L.clu.dbscan(D().C3.X, 0.25, 5).lab.filter((v) => v < 0).length);

  /* ---------- 22 · PCA ---------- */
  vec(22, 'pca', 'PCA de iris: fracción de varianza explicada', 'PCA.explained_variance_ratio_', 1e-10, () => maxd(L.dr.pca(L.ds.iris.X).ratio, R().pca_ratio));
  vec(22, 'pcas', 'PCA de iris estandarizado', 'PCA sobre StandardScaler', 1e-10, () => { const s = L.data.standardizer(L.ds.iris.X); return maxd(L.dr.pca(s.transform(L.ds.iris.X)).ratio, R().pca_ratio_std); });
  add(22, 'pcar', 'PCA: reconstrucción con todos los componentes (máx |Δ|)', 0, 'identidad', 1e-10, () => { const p = L.dr.pca(L.ds.iris.X); return maxd(p.inverse(p.transform(L.ds.iris.X)), L.ds.iris.X); });

  vec(22, 'tsneP', 't-SNE: probabilidades conjuntas p_ij (perplejidad 10)', 'sklearn _joint_probabilities', 1e-6, () => { const t = L.dr.tsne(D().C4.X.slice(0, 60), { perplexity: 10 }); return maxd(t.P.slice(0, 4).map((r) => Array.from(r.slice(0, 12))).map((r, i) => r.map((v, j) => (i === j ? 0 : v))), L.REF2.tsne_P); });
  add(22, 'tsnek', 't-SNE de 150 dígitos: exactitud de 5-NN sobre el mapa 2D tras 500 iteraciones', 0.95, 'rango esperado (≥ 0.85)', 0.1, () => {
    const idx = []; for (let c = 0; c < 10; c++) { let k = 0; L.ds.digits.y.forEach((v, i) => { if (v === c && k < 15) { idx.push(i); k++; } }); }
    const X = idx.map((i) => L.ds.digits.X[i]), y = idx.map((i) => L.ds.digits.y[i]), t = L.dr.tsne(X, { perplexity: 20, rng: L.rng(1), lr: 100 });
    t.step(500);
    return L.stat.mean(t.Y.map((p, i) => (L.knn.classifier(t.Y, y, 5).proba(p, i).indexOf(Math.max(...L.knn.classifier(t.Y, y, 5).proba(p, i))) === y[i] ? 1 : 0)));
  });

  /* ---------- 23 · Anomalías ---------- */
  add(23, 'isoc', 'Bosque de aislamiento: c(256), longitud media de camino', () => R().iso_c256, 'sklearn _average_path_length', 1e-12, () => L.tree.cIso(256));
  add(23, 'maha', 'Mahalanobis: Σ d² = (n − 1)·p con la covarianza muestral', 0, 'identidad', 1e-9, () => { const X = D().C4.X, m = L.anom.mahalanobis(X); return L.util.sum(m.d(X).map((v) => v * v)) - (X.length - 1) * 2; });

  /* ---------- 24–25 · Redes y retropropagación ---------- */
  const torchNet = () => {
    const T = R().torch_net, net = L.nn.mlp({ sizes: [3, 4, 2], act: 'tanh', out: 'softmax' });
    T.W1.forEach((r, j) => r.forEach((v, i) => { net.params[net.off[0].W + j * 3 + i] = v; }));
    T.b1.forEach((v, j) => { net.params[net.off[0].b + j] = v; });
    T.W2.forEach((r, j) => r.forEach((v, i) => { net.params[net.off[1].W + j * 4 + i] = v; }));
    T.b2.forEach((v, j) => { net.params[net.off[1].b + j] = v; });
    return { net, T };
  };
  add(25, 'tloss', 'Red 3–4–2 (tanh, softmax): entropía cruzada', 0, 'PyTorch ' + '(float64)', 1e-12, () => { const { net, T } = torchNet(); return net.grad(T.x, T.y, [0, 1]).loss - T.loss; });
  vec(25, 'tgrad', 'Retropropagación: gradiente de W₁ (12 valores)', 'PyTorch autograd', 1e-12, () => { const { net, T } = torchNet(); const g = net.grad(T.x, T.y, [0, 1]).g; return maxd(Array.from(g.slice(0, 12)), T.gW1.flat()); });
  vec(25, 'tgb', 'Retropropagación: gradiente de b₂', 'PyTorch autograd', 1e-12, () => { const { net, T } = torchNet(); const g = net.grad(T.x, T.y, [0, 1]).g; return maxd(Array.from(g.slice(net.off[1].b, net.off[1].b + 2)), T.gb2); });
  add(25, 'gchk', 'Comprobación numérica del gradiente (red 2–5–3–1, ReLU)', 0, 'diferencias centradas', 1e-6, () => {
    const rng = L.rng(9), net = L.nn.mlp({ sizes: [2, 5, 3, 1], act: 'tanh', rng });
    const X = Array.from({ length: 8 }, () => [rng.gauss(), rng.gauss()]), Y = X.map((r) => (r[0] * r[1] > 0 ? 1 : 0));
    return net.gradCheck(X, Y, L.util.range(8), 1e-5);
  });
  add(24, 'xor', 'Red 2–4–1 aprende XOR (exactitud en los 4 casos)', 1, 'tabla de verdad', 0, () => {
    const net = L.nn.mlp({ sizes: [2, 4, 1], act: 'tanh', rng: L.rng(3) }), X = [[0, 0], [0, 1], [1, 0], [1, 1]], Y = [0, 1, 1, 0], o = L.opt.make('adam', { lr: 0.05 });
    for (let e = 0; e < 1500; e++) net.epoch(X, Y, o, { batch: 4, rng: L.rng(e) });
    return X.filter((x, i) => (net.predict1(x)[0] >= 0.5 ? 1 : 0) === Y[i]).length / 4;
  });

  /* ---------- 27 · Convolución ---------- */
  vec(27, 'conv', 'Convolución válida 6×6 con filtro de Sobel', 'SciPy signal.correlate2d', 1e-12, () => { const img = D().conv_img.flat(); return maxd(Array.from(L.nn.conv2d(img, 6, 6, D().conv_ker).out), R().conv_valid); });

  /* ---------- 28 · Atención ---------- */
  add(28, 'att', 'Atención: cada fila de pesos suma 1 (máx |Σ − 1|)', 0, 'identidad del softmax', 1e-12, () => { const rng = L.rng(1), M = () => Array.from({ length: 5 }, () => [rng.gauss(), rng.gauss(), rng.gauss(), rng.gauss()]); const r = L.nn.attention(M(), M(), M()); return Math.max(...r.A.map((row) => Math.abs(L.util.sum(row) - 1))); });

  /* ---------- 29 · Interpretabilidad ---------- */
  add(29, 'shl', 'Shapley de un modelo lineal = wⱼ(xⱼ − media del fondo) (máx |Δ|)', 0, 'resultado exacto', 1e-12, () => {
    const w = [1.5, -2, 0.7, 0.3], f = (x) => 0.4 + L.util.sum(x.map((v, j) => v * w[j])), rng = L.rng(3);
    const B = Array.from({ length: 12 }, () => w.map(() => rng.gauss())), x = [0.5, 1.2, -0.3, 2];
    const r = L.interp.shapley(f, x, B), mb = w.map((_, j) => L.stat.mean(B.map((b) => b[j])));
    return maxd(r.phi, w.map((wj, j) => wj * (x[j] - mb[j])));
  });
  add(29, 'she', 'Shapley: eficiencia Σφ = f(x) − E[f] en un modelo con interacción', 0, 'axioma de eficiencia', 1e-12, () => {
    const f = (x) => x[0] * x[1] + Math.sin(x[2]) + x[0] * x[2] * x[3], rng = L.rng(4);
    const B = Array.from({ length: 10 }, () => [rng.gauss(), rng.gauss(), rng.gauss(), rng.gauss()]), x = [1, -0.5, 0.8, 1.5];
    const r = L.interp.shapley(f, x, B);
    return L.util.sum(r.phi) - (r.fx - r.base);
  });

  L.refOf = (c) => (typeof c.ref === 'function' ? c.ref() : c.ref);
  L.runCheck = function (c) {
    let v;
    try { v = c.fn(); } catch (e) { return { ok: false, v: NaN, err: NaN, msg: String((e && e.message) || e) }; }
    const ref = L.refOf(c);
    const err = c.rel ? Math.abs(v - ref) / Math.abs(ref) : Math.abs(v - ref);
    return { ok: err <= c.tol, v, err, ref };
  };
  void toInt;
})(typeof window !== 'undefined' ? window : globalThis);
