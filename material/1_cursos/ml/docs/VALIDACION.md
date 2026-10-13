# Validación del núcleo de algoritmos — «Aprender de los datos»

Cada simulación del curso usa las funciones de `src/lib/`. Este informe compara
sus resultados con scikit-learn, SciPy y PyTorch (valores generados por
`python tests/referencias.py`) y con identidades matemáticas exactas.
Se regenera con `node tests/validar.js`.

Resultado: **96 de 96 pruebas superadas** (2026-10-05, 0.9 s).

| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |
|---|---|---|---|---|---|---|---|
| 2 | Cuantil t de Student 0.975 con 4 g.l. | 2.77644511 | 2.77644511 | SciPy stats.t.ppf | 5.0e-14 | 1e-9 | OK |
| 2 | Cuantil t de Student 0.975 con 29 g.l. | 2.04522964 | 2.04522964 | SciPy stats.t.ppf | 2.2e-13 | 1e-9 | OK |
| 2 | Cuantil normal 0.975 | 1.95996398 | 1.95996398 | SciPy stats.norm.ppf | 4.4e-16 | 1e-9 | OK |
| 2 | CDF χ² con 3 g.l. en 7.8147 | 0.95 | 0.95 | SciPy stats.chi2.cdf | 2.2e-16 | 1e-9 | OK |
| 3 | Polinomio en base de Legendre = MCO con monomios (grado 3, máx |Δ| de predicciones) | 1.387779e-15 | 0 | identidad de bases | 1.4e-15 | 1e-9 | OK |
| 3 | Norma mínima (p > n): interpola los datos de entrenamiento (máx |residuo|) | 1.976197e-13 | 0 | propiedad de la solución | 2.0e-13 | 0.000001 | OK |
| 6 | MCO: coeficientes de 3 variables (máx |Δ|) | 1.443290e-15 | 0 | LinearRegression · sklearn | 1.4e-15 | 1e-9 | OK |
| 6 | MCO: intercepto | 1.69660515 | 1.69660515 | LinearRegression | 4.4e-16 | 1e-9 | OK |
| 6 | MCO: R² de entrenamiento | 0.925026068 | 0.925026068 | LinearRegression.score | 0.0e+0 | 1e-10 | OK |
| 6 | MCO: errores estándar (máx |Δ|) | 2.775558e-17 | 0 | NumPy (σ̂²(XᵀX)⁻¹) | 2.8e-17 | 1e-9 | OK |
| 6 | MCO: valores p de las pruebas t (máx |Δ|) | 7.911965e-17 | 0 | SciPy stats.t.sf | 7.9e-17 | 1e-8 | OK |
| 6 | Factores de inflación de la varianza (VIF) (máx |Δ|) | 2.220446e-16 | 0 | LinearRegression por variable | 2.2e-16 | 1e-8 | OK |
| 7 | Descenso de gradiente en cuenco: distancia al mínimo tras 400 pasos (η = 0.15) | 2.108011e-28 | 0 | mínimo exacto (0, 0) | 2.1e-28 | 1e-10 | OK |
| 7 | Adam en Rosenbrock: distancia al mínimo (1, 1) tras 6000 pasos | 1.570092e-16 | 0 | mínimo exacto | 1.6e-16 | 0.002 | OK |
| 7 | GD sobre MSE converge a la solución de MCO (máx |Δ| de pesos) | 2.220446e-15 | 0 | ecuaciones normales | 2.2e-15 | 1e-8 | OK |
| 8 | Ridge α = 2.5: coeficientes (máx |Δ|) | 6.661338e-16 | 0 | Ridge | 6.7e-16 | 1e-9 | OK |
| 8 | Lasso α = 0.1: coeficientes (6 variables, 2 relevantes) (máx |Δ|) | 1.416645e-13 | 0 | Lasso | 1.4e-13 | 1e-8 | OK |
| 8 | Lasso α = 0.8: coeficientes (ceros exactos) (máx |Δ|) | 2.220446e-16 | 0 | Lasso | 2.2e-16 | 1e-8 | OK |
| 8 | Elastic Net α = 0.1, l1_ratio = 0.5 (máx |Δ|) | 1.626255e-12 | 0 | ElasticNet | 1.6e-12 | 1e-8 | OK |
| 8 | α máximo del Lasso (todos los coeficientes nulos) | 2.34416617 | 2.34416617 | fórmula max|Xᵀy|/n | 8.9e-16 | 1e-12 | OK |
| 9 | R² de predicciones fijas | 0.876183914 | 0.876183914 | r2_score | 0.0e+0 | 1e-12 | OK |
| 9 | Error absoluto medio | 0.685993333 | 0.685993333 | mean_absolute_error | 0.0e+0 | 1e-12 | OK |
| 9 | Error porcentual absoluto medio (fracción) | 0.168138094 | 0.168138094 | mean_absolute_percentage_error | 2.8e-17 | 1e-12 | OK |
| 9 | Raíz del error cuadrático medio | 0.91871554 | 0.91871554 | mean_squared_error | 1.1e-16 | 1e-12 | OK |
| 9 | Regresión cuantílica τ = 0.8: intercepto y pendiente (máx |Δ|) | 5.551115e-17 | 0 | QuantileRegressor (HiGHS) | 5.6e-17 | 0.000001 | OK |
| 9 | Huber con ε enorme coincide con MCO (máx |Δ|) | 1.443290e-15 | 0 | identidad | 1.4e-15 | 1e-9 | OK |
| 10 | Logística C = 1: coeficientes (máx |Δ|) | 1.888153e-9 | 0 | LogisticRegression (lbfgs) | 1.9e-9 | 0.000001 | OK |
| 10 | Logística C = 1: intercepto | -0.596826892 | -0.596826893 | LogisticRegression | 1.4e-9 | 0.000001 | OK |
| 10 | Logística C = 0.05 (más regularizada): coeficientes (máx |Δ|) | 1.890642e-9 | 0 | LogisticRegression | 1.9e-9 | 0.000001 | OK |
| 10 | Softmax multinomial en iris: 12 coeficientes (máx |Δ|) | 7.208509e-6 | 0 | LogisticRegression multinomial | 7.2e-6 | 0.00001 | OK |
| 10 | Softmax en iris: probabilidades de 3 flores (máx |Δ|) | 1.824985e-7 | 0 | predict_proba | 1.8e-7 | 0.000001 | OK |
| 11 | AUC ROC (puntuaciones con empates) | 0.956730769 | 0.956730769 | roc_auc_score | 1.1e-16 | 1e-12 | OK |
| 11 | AUC trapezoidal = estadístico de Mann–Whitney | 0 | 0 | identidad | 0.0e+0 | 1e-12 | OK |
| 11 | Precisión promedio (AP) | 0.951926955 | 0.951926955 | average_precision_score | 4.4e-16 | 1e-12 | OK |
| 11 | Pérdida logarítmica | 0.389349217 | 0.389349217 | log_loss | 1.1e-16 | 1e-12 | OK |
| 11 | Coeficiente de correlación de Matthews | 0.83974359 | 0.83974359 | matthews_corrcoef | 0.0e+0 | 1e-12 | OK |
| 11 | Kappa de Cohen | 0.83974359 | 0.83974359 | cohen_kappa_score | 1.1e-16 | 1e-12 | OK |
| 11 | F1 de la clase positiva | 0.916666667 | 0.916666667 | f1_score | 0.0e+0 | 1e-12 | OK |
| 11 | Exactitud balanceada | 0.919871795 | 0.919871795 | balanced_accuracy_score | 0.0e+0 | 1e-12 | OK |
| 11 | Número de puntos de la curva ROC (con empates) | 39 | 39 | roc_curve | 0.0e+0 | 0 | OK |
| 12 | Puntuación de Brier | 0.119154 | 0.119154 | brier_score_loss | 0.0e+0 | 1e-12 | OK |
| 12 | Curva de fiabilidad (5 bins): frecuencias observadas (máx |Δ|) | 0 | 0 | calibration_curve | 0.0e+0 | 1e-12 | OK |
| 12 | Curva de fiabilidad (5 bins): probabilidad media (máx |Δ|) | 0 | 0 | calibration_curve | 0.0e+0 | 1e-12 | OK |
| 12 | Regresión isotónica (PAV): predicciones en 11 puntos (máx |Δ|) | 0 | 0 | IsotonicRegression | 0.0e+0 | 1e-12 | OK |
| 13 | k-NN (k = 5): probabilidad de clase 1 en 3 puntos (máx |Δ|) | 0 | 0 | KNeighborsClassifier | 0.0e+0 | 1e-12 | OK |
| 13 | k-NN (k = 7, ponderado por distancia) (máx |Δ|) | 2.220446e-16 | 0 | KNeighborsClassifier(weights=distance) | 2.2e-16 | 1e-12 | OK |
| 14 | Bayes ingenuo gaussiano en iris: probabilidades (máx |Δ|) | 3.136380e-15 | 0 | GaussianNB | 3.1e-15 | 1e-9 | OK |
| 14 | Bayes ingenuo gaussiano: exactitud de entrenamiento | 0.96 | 0.96 | GaussianNB.score | 0.0e+0 | 1e-12 | OK |
| 14 | LDA en iris: probabilidades (máx |Δ|) | 2.831069e-15 | 0 | LinearDiscriminantAnalysis | 2.8e-15 | 1e-8 | OK |
| 14 | LDA: exactitud de entrenamiento | 0.98 | 0.98 | LinearDiscriminantAnalysis.score | 0.0e+0 | 1e-12 | OK |
| 14 | QDA en iris: probabilidades (máx |Δ|) | 4.662937e-15 | 0 | QuadraticDiscriminantAnalysis | 4.7e-15 | 1e-8 | OK |
| 14 | QDA: exactitud de entrenamiento | 0.98 | 0.98 | QuadraticDiscriminantAnalysis.score | 0.0e+0 | 1e-12 | OK |
| 15 | SVM lineal C = 1: función de decisión en 3 puntos (máx |Δ|) | 1.032199e-7 | 0 | SVC(kernel=linear) | 1.0e-7 | 0.00001 | OK |
| 15 | SVM lineal: número de vectores de soporte | 25 | 25 | SVC.n_support_ | 0.0e+0 | 0 | OK |
| 15 | SVM RBF (γ = 1.5, C = 2): función de decisión (máx |Δ|) | 1.168955e-7 | 0 | SVC(kernel=rbf) | 1.2e-7 | 0.00001 | OK |
| 15 | SVM RBF: número de vectores de soporte | 17 | 17 | SVC.n_support_ | 0.0e+0 | 0 | OK |
| 15 | SVM polinómica (grado 3): función de decisión (máx |Δ|) | 8.902953e-7 | 0 | SVC(kernel=poly) | 8.9e-7 | 0.00001 | OK |
| 15 | γ = "scale" (1 / (p·Var X)) | 0.94652151 | 0.94652151 | SVC(gamma=scale) | 4.4e-16 | 1e-12 | OK |
| 16 | Árbol (Gini, profundidad 3): exactitud de entrenamiento | 0.9 | 0.9 | DecisionTreeClassifier | 0.0e+0 | 1e-12 | OK |
| 16 | Árbol: importancias de Gini (MDI) (máx |Δ|) | 0 | 0 | feature_importances_ | 0.0e+0 | 1e-10 | OK |
| 16 | Árbol (entropía, profundidad 3): exactitud | 0.908333333 | 0.908333333 | DecisionTreeClassifier(criterion=entropy) | 0.0e+0 | 1e-12 | OK |
| 16 | Poda de costo–complejidad: α efectivos (máx |Δ|) | 5.204170e-18 | 0 | cost_complexity_pruning_path | 5.2e-18 | 1e-10 | OK |
| 16 | Poda: impureza total de las hojas por α (máx |Δ|) | 1.387779e-17 | 0 | cost_complexity_pruning_path | 1.4e-17 | 1e-10 | OK |
| 16 | Árbol de regresión (profundidad 3): predicciones (máx |Δ|) | 0 | 0 | DecisionTreeRegressor | 0.0e+0 | 1e-10 | OK |
| 17 | Bosque de 1 árbol sin bootstrap ni submuestreo = árbol único (diferencias) | 0 | 0 | identidad | 0.0e+0 | 0 | OK |
| 17 | Bosque de 200 árboles: exactitud OOB razonable en lunas con ruido | 0.891666667 | 0.88 | rango esperado (0.83–0.93) | 1.2e-2 | 0.05 | OK |
| 18 | Gradient boosting de regresión (20 árboles): predicciones (máx |Δ|) | 0 | 0 | GradientBoostingRegressor | 0.0e+0 | 1e-10 | OK |
| 18 | Gradient boosting de clasificación: probabilidades (máx |Δ|) | 1.110223e-16 | 0 | GradientBoostingClassifier | 1.1e-16 | 1e-9 | OK |
| 18 | AdaBoost SAMME: pesos de los 8 tocones (máx |Δ|) | 1.110223e-15 | 0 | AdaBoostClassifier | 1.1e-15 | 1e-9 | OK |
| 18 | AdaBoost SAMME: exactitud de entrenamiento | 0.883333333 | 0.883333333 | AdaBoostClassifier.score | 0.0e+0 | 1e-12 | OK |
| 20 | k-medias (Lloyd, mismos centros iniciales): inercia | 80.8721787 | 80.8721787 | KMeans | 4.3e-14 | 1e-9 | OK |
| 20 | Coeficiente de silueta de esa partición | 0.499618202 | 0.499618202 | silhouette_score | 5.6e-17 | 1e-12 | OK |
| 20 | Índice de Rand ajustado | 0.565928465 | 0.565928465 | adjusted_rand_score | 1.1e-16 | 1e-12 | OK |
| 20 | Mezcla de 2 gaussianas: log-verosimilitud media | -2.63451943 | -2.63451943 | GaussianMixture.score | 1.6e-12 | 0.000001 | OK |
| 21 | Enlace simple: alturas de las 19 fusiones (máx |Δ|) | 0 | 0 | SciPy linkage | 0.0e+0 | 1e-10 | OK |
| 21 | Enlace completo: alturas de las 19 fusiones (máx |Δ|) | 0 | 0 | SciPy linkage | 0.0e+0 | 1e-10 | OK |
| 21 | Enlace promedio: alturas de las 19 fusiones (máx |Δ|) | 1.110223e-16 | 0 | SciPy linkage | 1.1e-16 | 1e-10 | OK |
| 21 | Enlace de Ward: alturas de las 19 fusiones (máx |Δ|) | 1.776357e-15 | 0 | SciPy linkage | 1.8e-15 | 1e-10 | OK |
| 21 | DBSCAN (ε = 0.25, minPts = 5): número de grupos | 6 | 6 | DBSCAN | 0.0e+0 | 0 | OK |
| 21 | DBSCAN: número de puntos de ruido | 1 | 1 | DBSCAN | 0.0e+0 | 0 | OK |
| 22 | PCA de iris: fracción de varianza explicada (máx |Δ|) | 7.327472e-15 | 0 | PCA.explained_variance_ratio_ | 7.3e-15 | 1e-10 | OK |
| 22 | PCA de iris estandarizado (máx |Δ|) | 4.440892e-16 | 0 | PCA sobre StandardScaler | 4.4e-16 | 1e-10 | OK |
| 22 | PCA: reconstrucción con todos los componentes (máx |Δ|) | 1.776357e-15 | 0 | identidad | 1.8e-15 | 1e-10 | OK |
| 22 | t-SNE: probabilidades conjuntas p_ij (perplejidad 10) (máx |Δ|) | 1.126830e-8 | 0 | sklearn _joint_probabilities | 1.1e-8 | 0.000001 | OK |
| 22 | t-SNE de 150 dígitos: exactitud de 5-NN sobre el mapa 2D tras 500 iteraciones | 0.98 | 0.95 | rango esperado (≥ 0.85) | 3.0e-2 | 0.1 | OK |
| 23 | Bosque de aislamiento: c(256), longitud media de camino | 10.2447709 | 10.2447709 | sklearn _average_path_length | 0.0e+0 | 1e-12 | OK |
| 23 | Mahalanobis: Σ d² = (n − 1)·p con la covarianza muestral | 2.842171e-14 | 0 | identidad | 2.8e-14 | 1e-9 | OK |
| 25 | Red 3–4–2 (tanh, softmax): entropía cruzada | 2.220446e-16 | 0 | PyTorch (float64) | 2.2e-16 | 1e-12 | OK |
| 25 | Retropropagación: gradiente de W₁ (12 valores) (máx |Δ|) | 2.775558e-17 | 0 | PyTorch autograd | 2.8e-17 | 1e-12 | OK |
| 25 | Retropropagación: gradiente de b₂ (máx |Δ|) | 5.551115e-17 | 0 | PyTorch autograd | 5.6e-17 | 1e-12 | OK |
| 25 | Comprobación numérica del gradiente (red 2–5–3–1, ReLU) | 8.512618e-10 | 0 | diferencias centradas | 8.5e-10 | 0.000001 | OK |
| 24 | Red 2–4–1 aprende XOR (exactitud en los 4 casos) | 1 | 1 | tabla de verdad | 0.0e+0 | 0 | OK |
| 27 | Convolución válida 6×6 con filtro de Sobel (máx |Δ|) | 0 | 0 | SciPy signal.correlate2d | 0.0e+0 | 1e-12 | OK |
| 28 | Atención: cada fila de pesos suma 1 (máx |Σ − 1|) | 1.110223e-16 | 0 | identidad del softmax | 1.1e-16 | 1e-12 | OK |
| 29 | Shapley de un modelo lineal = wⱼ(xⱼ − media del fondo) (máx |Δ|) | 1.110223e-16 | 0 | resultado exacto | 1.1e-16 | 1e-12 | OK |
| 29 | Shapley: eficiencia Σφ = f(x) − E[f] en un modelo con interacción | 0 | 0 | axioma de eficiencia | 0.0e+0 | 1e-12 | OK |
