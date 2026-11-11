# Validación del núcleo de cálculo — «Máquinas que leen»

Cada simulación del curso usa las funciones de `src/lib/`. Este informe compara
sus resultados con implementaciones independientes en Python (NLTK, scikit-learn, SciPy, NumPy, Gensim),
con resultados publicados (valores generados por `python tests/referencias.py`) y con
identidades matemáticas exactas.
Se regenera con `node tests/validar.js`.

Resultado: **689 de 689 pruebas superadas** (2026-11-11, 43.5 s).

| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Análisis de «V SN + 0 SP» por programación dinámica | 1 | 1 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Análisis de «V SN + 1 SP» por programación dinámica | 2 | 2 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Análisis de «V SN + 2 SP» por programación dinámica | 5 | 5 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Análisis de «V SN + 3 SP» por programación dinámica | 14 | 14 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Análisis de «V SN + 4 SP» por programación dinámica | 42 | 42 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Análisis de «V SN + 5 SP» por programación dinámica | 132 | 132 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Análisis de «V SN + 6 SP» por programación dinámica | 429 | 429 | NLTK 3.10.4 ChartParser (conteo de árboles) | 0.0e+0 | 0 | OK |
| 1 | Fórmula de Catalan C₇ = 429 frente al conteo por programación dinámica | 429 | 429 | identidad: C_{n+1} | 0.0e+0 | 0 | OK |
| 2 | Entropía condicional empírica de orden 0 del corpus (bits por carácter) | 4.03228961 bits | 4.03228961 | Python (Counter), mismo texto normalizado | 0.0e+0 | 1e-9 | OK |
| 2 | Entropía condicional empírica de orden 1 del corpus (bits por carácter) | 3.0147892 bits | 3.0147892 | Python (Counter), mismo texto normalizado | 0.0e+0 | 1e-9 | OK |
| 2 | Entropía condicional empírica de orden 2 del corpus (bits por carácter) | 2.10238808 bits | 2.10238808 | Python (Counter), mismo texto normalizado | 0.0e+0 | 1e-9 | OK |
| 2 | Entropía condicional empírica de orden 3 del corpus (bits por carácter) | 1.1150528 bits | 1.1150528 | Python (Counter), mismo texto normalizado | 0.0e+0 | 1e-9 | OK |
| 2 | Entropía condicional empírica de orden 4 del corpus (bits por carácter) | 0.554186428 bits | 0.554186428 | Python (Counter), mismo texto normalizado | 0.0e+0 | 1e-9 | OK |
| 2 | Entropía condicional empírica de orden 5 del corpus (bits por carácter) | 0.301164335 bits | 0.301164335 | Python (Counter), mismo texto normalizado | 0.0e+0 | 1e-9 | OK |
| 2 | Longitud del texto normalizado del corpus | 2820 | 2820 | Python re | 0.0e+0 | 0 | OK |
| 3 | Limpieza del laboratorio 1 (muestra 1): suma de verificación del resultado | 9865 | 9865 | Python (html, re), función limpiar del cuaderno Lab 01 | 0.0e+0 | 0 | OK |
| 3 | Limpieza con puntuación eliminada (muestra 1) | 8086 | 8086 | Python (html, re) | 0.0e+0 | 0 | OK |
| 3 | Limpieza del laboratorio 1 (muestra 2): suma de verificación del resultado | 1.320500e+4 | 1.320500e+4 | Python (html, re), función limpiar del cuaderno Lab 01 | 0.0e+0 | 0 | OK |
| 3 | Limpieza con puntuación eliminada (muestra 2) | 1.320500e+4 | 1.320500e+4 | Python (html, re) | 0.0e+0 | 0 | OK |
| 3 | Limpieza del laboratorio 1 (muestra 3): suma de verificación del resultado | 1.677557e+6 | 1.677557e+6 | Python (html, re), función limpiar del cuaderno Lab 01 | 0.0e+0 | 0 | OK |
| 3 | Limpieza con puntuación eliminada (muestra 3) | 4860 | 4860 | Python (html, re) | 0.0e+0 | 0 | OK |
| 3 | Limpieza del laboratorio 1 (muestra 4): suma de verificación del resultado | 1.433400e+4 | 1.433400e+4 | Python (html, re), función limpiar del cuaderno Lab 01 | 0.0e+0 | 0 | OK |
| 3 | Limpieza con puntuación eliminada (muestra 4) | 1.073000e+4 | 1.073000e+4 | Python (html, re) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (a): identificadas (360 opiniones) | 3534 | 3534 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (a): tras (360 opiniones) | 2018 | 2018 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (a): distintos (360 opiniones) | 102 | 102 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (a): excluidas (360 opiniones) | 1516 | 1516 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (a): frecuencia del término n.º 1 | 108 | 108 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (a): frecuencia del término n.º 2 | 40 | 40 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (a): frecuencia del término n.º 3 | 40 | 40 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (b): identificadas (360 opiniones) | 3534 | 3534 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (b): tras (360 opiniones) | 2378 | 2378 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (b): distintos (360 opiniones) | 114 | 114 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (b): excluidas (360 opiniones) | 1156 | 1156 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (b): frecuencia del término n.º 1 | 108 | 108 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (b): frecuencia del término n.º 2 | 80 | 80 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (b): frecuencia del término n.º 3 | 50 | 50 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (c): identificadas (360 opiniones) | 3534 | 3534 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (c): tras (360 opiniones) | 1908 | 1908 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (c): distintos (360 opiniones) | 96 | 96 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento del laboratorio (c): excluidas (360 opiniones) | 1626 | 1626 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (c): frecuencia del término n.º 1 | 108 | 108 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (c): frecuencia del término n.º 2 | 40 | 40 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Experimento (c): frecuencia del término n.º 3 | 40 | 40 | laboratorio_pln.py del curso (Python) | 0.0e+0 | 0 | OK |
| 3 | Ley de Zipf en las 360 opiniones: pendiente log-log | -0.727140265 | -0.727140265 | NumPy 2.1.2 polyfit | 7.8e-16 | 1e-10 | OK |
| 3 | Ley de Zipf en las 360 opiniones: intercepto | 2.51267634 | 2.51267634 | NumPy 2.1.2 polyfit | 1.8e-15 | 1e-10 | OK |
| 3 | Ley de Zipf en las 360 opiniones: R² | 0.931104294 | 0.931104294 | NumPy 2.1.2 corrcoef | 2.4e-14 | 1e-10 | OK |
| 3 | Ley de Zipf en el corpus de 60 oraciones: pendiente | -0.559672534 | -0.559672534 | NumPy 2.1.2 polyfit | 1.4e-14 | 1e-10 | OK |
| 4 | Conjugación de «cantar»: suma de verificación de todos los pares forma|análisis | 9.471489e+7 | 9.471489e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «hablar»: suma de verificación de todos los pares forma|análisis | 9.372174e+7 | 9.372174e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «estudiar»: suma de verificación de todos los pares forma|análisis | 1.235266e+8 | 1.235266e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «caminar»: suma de verificación de todos los pares forma|análisis | 1.073908e+8 | 1.073908e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «comprar»: suma de verificación de todos los pares forma|análisis | 1.091436e+8 | 1.091436e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «trabajar»: suma de verificación de todos los pares forma|análisis | 1.215951e+8 | 1.215951e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «mirar»: suma de verificación de todos los pares forma|análisis | 8.307819e+7 | 8.307819e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «escuchar»: suma de verificación de todos los pares forma|análisis | 1.221180e+8 | 1.221180e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «procesar»: suma de verificación de todos los pares forma|análisis | 1.233777e+8 | 1.233777e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «etiquetar»: suma de verificación de todos los pares forma|análisis | 1.392691e+8 | 1.392691e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «aprender»: suma de verificación de todos los pares forma|análisis | 1.236230e+8 | 1.236230e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «comer»: suma de verificación de todos los pares forma|análisis | 8.377411e+7 | 8.377411e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «beber»: suma de verificación de todos los pares forma|análisis | 8.238188e+7 | 8.238188e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «correr»: suma de verificación de todos los pares forma|análisis | 9.715029e+7 | 9.715029e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «vender»: suma de verificación de todos los pares forma|análisis | 9.654047e+7 | 9.654047e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «comprender»: suma de verificación de todos los pares forma|análisis | 1.554434e+8 | 1.554434e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «escribir»: suma de verificación de todos los pares forma|análisis | 1.240710e+8 | 1.240710e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «vivir»: suma de verificación de todos los pares forma|análisis | 8.565049e+7 | 8.565049e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «subir»: suma de verificación de todos los pares forma|análisis | 8.494717e+7 | 8.494717e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «partir»: suma de verificación de todos los pares forma|análisis | 9.774122e+7 | 9.774122e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «decidir»: suma de verificación de todos los pares forma|análisis | 1.083227e+8 | 1.083227e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «recibir»: suma de verificación de todos los pares forma|análisis | 1.091826e+8 | 1.091826e+8 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Conjugación de «abrir»: suma de verificación de todos los pares forma|análisis | 8.361045e+7 | 8.361045e+7 | Python (py/04-morfologia.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 4 | Pares forma|análisis de los 23 verbos regulares | 1035 | 1035 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «lugar» con la cascada de reglas ortográficas | 3020 | 3020 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «ciudad» con la cascada de reglas ortográficas | 3772 | 3772 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «nuez» con la cascada de reglas ortográficas | 2238 | 2238 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «lápiz» con la cascada de reglas ortográficas | 3220 | 3220 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «canción» con la cascada de reglas ortográficas | 4823 | 4823 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «razón» con la cascada de reglas ortográficas | 3079 | 3079 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «autobús» con la cascada de reglas ortográficas | 4963 | 4963 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «color» con la cascada de reglas ortográficas | 3070 | 3070 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «pan» con la cascada de reglas ortográficas | 1615 | 1615 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «mujer» con la cascada de reglas ortográficas | 3046 | 3046 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «azul» con la cascada de reglas ortográficas | 2319 | 2319 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 4 | Plural de «fácil» con la cascada de reglas ortográficas | 3220 | 3220 | Python (py/04-morfologia.py) | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «ba+!»: cadenas aceptadas de longitud ≤ 7 | 5 | 5 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «ba+!» | 5 | 5 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «ba+!» | 5 | 5 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «(a|b)*abb»: cadenas aceptadas de longitud ≤ 7 | 31 | 31 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «(a|b)*abb» | 31 | 31 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «(a|b)*abb» | 31 | 31 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «a*b*»: cadenas aceptadas de longitud ≤ 7 | 36 | 36 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «a*b*» | 36 | 36 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «a*b*» | 36 | 36 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «(ab|ba)+»: cadenas aceptadas de longitud ≤ 7 | 14 | 14 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «(ab|ba)+» | 14 | 14 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «(ab|ba)+» | 14 | 14 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «(a|b)*a(a|b)(a|b)»: cadenas aceptadas de longitud ≤ 7 | 124 | 124 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «(a|b)*a(a|b)(a|b)» | 124 | 124 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «(a|b)*a(a|b)(a|b)» | 124 | 124 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «a?b+(ab)*»: cadenas aceptadas de longitud ≤ 7 | 28 | 28 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «a?b+(ab)*» | 28 | 28 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «a?b+(ab)*» | 28 | 28 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFN de Thompson de «(a|b)*(aa|bb)(a|b)*»: cadenas aceptadas de longitud ≤ 7 | 240 | 240 | Python re.fullmatch (todas las cadenas) | 0.0e+0 | 0 | OK |
| 5 | AFD por subconjuntos de «(a|b)*(aa|bb)(a|b)*» | 240 | 240 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | AFD mínimo de «(a|b)*(aa|bb)(a|b)*» | 240 | 240 | Python re.fullmatch | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo completo de «(a|b)*abb» (ejemplo clásico) | 4 | 4 | Aho, Lam, Sethi y Ullman, Compiladores, ej. 3.7 | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo de «(a|b)*a(a|b)(a|b)»: 2³ por el tercer símbolo desde el final | 8 | 8 | identidad: 2ᵏ estados para el k-ésimo símbolo desde el final | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo completo de «ba+!» (balido de oveja, con estado de error) | 5 | 5 | Jurafsky y Martin: 4 estados + error | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo de {aⁿbⁿ : n ≤ 1} (necesita 2k + 2) | 4 | 4 | identidad: contar exige memoria | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo de {aⁿbⁿ : n ≤ 2} (necesita 2k + 2) | 6 | 6 | identidad: contar exige memoria | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo de {aⁿbⁿ : n ≤ 3} (necesita 2k + 2) | 8 | 8 | identidad: contar exige memoria | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo de {aⁿbⁿ : n ≤ 4} (necesita 2k + 2) | 10 | 10 | identidad: contar exige memoria | 0.0e+0 | 0 | OK |
| 5 | Estados del AFD mínimo de {aⁿbⁿ : n ≤ 5} (necesita 2k + 2) | 12 | 12 | identidad: contar exige memoria | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (1 de 36): todas las salidas | 3020 | 3020 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (2 de 36): todas las salidas | 2257 | 2257 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (3 de 36): todas las salidas | 2238 | 2238 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (4 de 36): todas las salidas | 4823 | 4823 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (5 de 36): todas las salidas | 3220 | 3220 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (6 de 36): todas las salidas | 4963 | 4963 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (7 de 36): todas las salidas | 1608 | 1608 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (8 de 36): todas las salidas | 6500 | 6500 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (9 de 36): todas las salidas | 3046 | 3046 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (10 de 36): todas las salidas | 2319 | 2319 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (11 de 36): todas las salidas | 2106 | 2106 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (12 de 36): todas las salidas | 3772 | 3772 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (13 de 36): todas las salidas | 3079 | 3079 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (14 de 36): todas las salidas | 1615 | 1615 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (15 de 36): todas las salidas | 3070 | 3070 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (16 de 36): todas las salidas | 3965 | 3965 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (17 de 36): todas las salidas | 3887 | 3887 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (18 de 36): todas las salidas | 1596 | 1596 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (19 de 36): todas las salidas | 1618 | 1618 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (20 de 36): todas las salidas | 1618 | 1618 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (21 de 36): todas las salidas | 3854 | 3854 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (22 de 36): todas las salidas | 2282 | 2282 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (23 de 36): todas las salidas | 301 | 301 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (24 de 36): todas las salidas | 623 | 623 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (25 de 36): todas las salidas | 634 | 634 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (26 de 36): todas las salidas | 630 | 630 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (27 de 36): todas las salidas | 1094 | 1094 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (28 de 36): todas las salidas | 327 | 327 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (29 de 36): todas las salidas | 689 | 689 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (30 de 36): todas las salidas | 1026 | 1026 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (31 de 36): todas las salidas | 1446 | 1446 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (32 de 36): todas las salidas | 1548 | 1548 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (33 de 36): todas las salidas | 1502 | 1502 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (34 de 36): todas las salidas | 659 | 659 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (35 de 36): todas las salidas | 1590 | 1590 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Cascada de transductores sobre un intermedio de prueba (36 de 36): todas las salidas | 1651 | 1651 | Python (py/06-transductores.py, FST independiente) | 0.0e+0 | 0 | OK |
| 6 | Estados del transductor de inserción de «e» | 6 | 6 | Python (py/06-transductores.py) | 0.0e+0 | 0 | OK |
| 6 | Arcos del transductor de inserción de «e» (alfabeto de 36 símbolos) | 141 | 141 | Python (py/06-transductores.py) | 0.0e+0 | 0 | OK |
| 6 | Generación: el FST produce la forma de superficie de todos los análisis del lexicón (desajustes) | 0 | 0 | comparación con la función de reglas del capítulo 4 | 0.0e+0 | 0 | OK |
| 6 | Análisis por inversión de transductores: formas del lexicón con resultado distinto del índice (desajustes) | 0 | 0 | comparación con el índice superficie → análisis | 0.0e+0 | 0 | OK |
| 7 | Stemmer Snowball del español: palabras con raíz distinta de NLTK (de las 2.500+ de CESS-ESP y 19 casos especiales) | 0 | 0 | NLTK 3.10.4 SnowballStemmer("spanish") | 0.0e+0 | 0 | OK |
| 7 | Número de palabras comparadas con NLTK | 2519 | 2519 | lista de CESS-ESP con frecuencia ≥ 2 | 0.0e+0 | 0 | OK |
| 7 | Raíz de «universidad» (universid) | 3118 | 3118 | NLTK 3.10.4 (valor impreso en el capítulo) | 0.0e+0 | 0 | OK |
| 7 | Raíz de «universal» (univers) | 4866 | 4866 | NLTK 3.10.4 (valor impreso en el capítulo) | 0.0e+0 | 0 | OK |
| 7 | Raíz de «universitario» (universitari) | 8486 | 8486 | NLTK 3.10.4 (valor impreso en el capítulo) | 0.0e+0 | 0 | OK |
| 7 | Raíz de «cantábamos» (cant) | 1087 | 1087 | NLTK 3.10.4 (valor impreso en el capítulo) | 0.0e+0 | 0 | OK |
| 7 | Raíz de «rápidamente» (rapid) | 1564 | 1564 | NLTK 3.10.4 (valor impreso en el capítulo) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «espacios» sobre la muestra 1: número de tokens | 20 | 20 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «letras» sobre la muestra 1: número de tokens | 26 | 26 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo» sobre la muestra 1: número de tokens | 31 | 31 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo+contracciones» sobre la muestra 1: número de tokens | 32 | 32 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «espacios» sobre la muestra 2: número de tokens | 12 | 12 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «letras» sobre la muestra 2: número de tokens | 10 | 10 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo» sobre la muestra 2: número de tokens | 21 | 21 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo+contracciones» sobre la muestra 2: número de tokens | 22 | 22 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «espacios» sobre la muestra 3: número de tokens | 7 | 7 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «letras» sobre la muestra 3: número de tokens | 9 | 9 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo» sobre la muestra 3: número de tokens | 15 | 15 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo+contracciones» sobre la muestra 3: número de tokens | 15 | 15 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «espacios» sobre la muestra 4: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «letras» sobre la muestra 4: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo» sobre la muestra 4: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo+contracciones» sobre la muestra 4: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «espacios» sobre la muestra 5: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «letras» sobre la muestra 5: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo» sobre la muestra 5: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo+contracciones» sobre la muestra 5: número de tokens | 0 | 0 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «espacios» sobre la muestra 6: número de tokens | 3534 | 3534 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «letras» sobre la muestra 6: número de tokens | 3534 | 3534 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo» sobre la muestra 6: número de tokens | 3914 | 3914 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 7 | Tokenizador «completo+contracciones» sobre la muestra 6: número de tokens | 3934 | 3934 | Python (str.split, regex) | 0.0e+0 | 0 | OK |
| 8 | Distancia de Levenshtein (costos 1, 1, 1): suma sobre 306 pares de palabras | 2175 | 2175 | RapidFuzz 3.14.6 Levenshtein.distance | 0.0e+0 | 0 | OK |
| 8 | Levenshtein con sustitución de costo 2 (variante de Jurafsky): suma | 3143 | 3143 | RapidFuzz 3.14.6 weights=(1,1,2) | 0.0e+0 | 0 | OK |
| 8 | Distancia de Damerau (con transposiciones adyacentes): suma | 2173 | 2173 | RapidFuzz 3.14.6 OSA.distance | 0.0e+0 | 0 | OK |
| 8 | «intención» → «ejecución»: 5 con costos 1, 8 con sustitución de costo 2 | 58 | 58 | RapidFuzz 3.14.6 | 0.0e+0 | 0 | OK |
| 8 | El alineamiento por retroceso tiene el costo de la distancia (306 pares) | 0 | 0 | identidad: Σ costos de operaciones = distancia | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «hola» (conjunto sin repetidos) | 297 | 297 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «algo» (conjunto sin repetidos) | 297 | 297 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «casa» (conjunto sin repetidos) | 297 | 297 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «ñandú» (conjunto sin repetidos) | 363 | 363 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «a» (conjunto sin repetidos) | 99 | 99 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «sistema» (conjunto sin repetidos) | 495 | 495 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Candidatos a distancia 1 de «abcdefghij» (conjunto sin repetidos) | 693 | 693 | Python (Norvig, mismo alfabeto de 33 letras) | 0.0e+0 | 0 | OK |
| 8 | Corrector de canal ruidoso: palabras cuya primera corrección difiere (67 erratas) | 0 | 0 | Python (misma función de puntuación y desempate) | 0.0e+0 | 0 | OK |
| 8 | Tokens del corpus CESS-ESP en el modelo de lengua | 1.559670e+5 | 1.559670e+5 | NLTK cess_esp | 0.0e+0 | 0 | OK |
| 10 | Cadena de taggers (gruesas, bigrama no, sufijos no): palabras bien etiquetadas y suma de verificación | 9.112421e+8 | 9.112421e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (gruesas, bigrama no, sufijos sí): palabras bien etiquetadas y suma de verificación | 8.750798e+8 | 8.750798e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (gruesas, bigrama sí, sufijos no): palabras bien etiquetadas y suma de verificación | 9.155048e+8 | 9.155048e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (gruesas, bigrama sí, sufijos sí): palabras bien etiquetadas y suma de verificación | 8.786816e+8 | 8.786816e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (completas, bigrama no, sufijos no): palabras bien etiquetadas y suma de verificación | 6.457135e+8 | 6.457135e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (completas, bigrama no, sufijos sí): palabras bien etiquetadas y suma de verificación | 9.796191e+8 | 9.796191e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (completas, bigrama sí, sufijos no): palabras bien etiquetadas y suma de verificación | 5.863264e+8 | 5.863264e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Cadena de taggers (completas, bigrama sí, sufijos sí): palabras bien etiquetadas y suma de verificación | 9.487993e+8 | 9.487993e+8 | Python (implementación independiente con el mismo desempate) | 0.0e+0 | 0.000001 | OK |
| 10 | Tagger de línea base (etiquetas gruesas): palabras bien etiquetadas | 842 | 842 | Python (Counter; mismo desempate) | 0.0e+0 | 0 | OK |
| 10 | Línea de base (gruesas): suma de verificación de las etiquetas predichas | 9.112421e+8 | 9.112421e+8 | Python | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0, desconocidas «hapax»): palabras bien etiquetadas en 60 oraciones | 918 | 918 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0, «hapax»): suma de verificación de todas las etiquetas predichas | 8.785299e+8 | 8.785299e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0, desconocidas «ninguno»): palabras bien etiquetadas en 60 oraciones | 70 | 70 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0, «ninguno»): suma de verificación de todas las etiquetas predichas | 5.647302e+8 | 5.647302e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 1, desconocidas «hapax»): palabras bien etiquetadas en 60 oraciones | 864 | 864 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 1, «hapax»): suma de verificación de todas las etiquetas predichas | 8.727109e+8 | 8.727109e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 1, desconocidas «ninguno»): palabras bien etiquetadas en 60 oraciones | 836 | 836 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 1, «ninguno»): suma de verificación de todas las etiquetas predichas | 8.592010e+8 | 8.592010e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0.1, desconocidas «hapax»): palabras bien etiquetadas en 60 oraciones | 914 | 914 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0.1, «hapax»): suma de verificación de todas las etiquetas predichas | 8.767432e+8 | 8.767432e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0.1, desconocidas «ninguno»): palabras bien etiquetadas en 60 oraciones | 906 | 906 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (gruesas, k = 0.1, «ninguno»): suma de verificación de todas las etiquetas predichas | 8.728567e+8 | 8.728567e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 10 | Tagger de línea base (EAGLES completas): palabras bien etiquetadas | 674 | 674 | Python (Counter; mismo desempate) | 0.0e+0 | 0 | OK |
| 10 | Línea de base (completas): suma de verificación de las etiquetas predichas | 6.457135e+8 | 6.457135e+8 | Python | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0, desconocidas «hapax»): palabras bien etiquetadas en 60 oraciones | 267 | 267 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0, «hapax»): suma de verificación de todas las etiquetas predichas | 7.340089e+8 | 7.340089e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0, desconocidas «ninguno»): palabras bien etiquetadas en 60 oraciones | 29 | 29 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0, «ninguno»): suma de verificación de todas las etiquetas predichas | 3.562066e+8 | 3.562066e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 1, desconocidas «hapax»): palabras bien etiquetadas en 60 oraciones | 623 | 623 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 1, «hapax»): suma de verificación de todas las etiquetas predichas | 9.376721e+8 | 9.376721e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 1, desconocidas «ninguno»): palabras bien etiquetadas en 60 oraciones | 595 | 595 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 1, «ninguno»): suma de verificación de todas las etiquetas predichas | 8.582281e+8 | 8.582281e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0.1, desconocidas «hapax»): palabras bien etiquetadas en 60 oraciones | 731 | 731 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0.1, «hapax»): suma de verificación de todas las etiquetas predichas | 9.376040e+8 | 9.376040e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0.1, desconocidas «ninguno»): palabras bien etiquetadas en 60 oraciones | 724 | 724 | Python (py/11-hmm.py, implementación independiente) | 0.0e+0 | 0 | OK |
| 11 | HMM (completas, k = 0.1, «ninguno»): suma de verificación de todas las etiquetas predichas | 8.424735e+8 | 8.424735e+8 | Python (py/11-hmm.py) | 0.0e+0 | 0 | OK |
| 11 | HMM: número de etiquetas y de símbolos de emisión (gruesas, k = 0,1) | 1.303570e+5 | 1.303570e+5 | Python | 0.0e+0 | 0 | OK |
| 11 | Viterbi frente a enumeración exhaustiva de todas las secuencias de etiquetas (14 oraciones de 5 palabras): máxima diferencia de log P | 7.105427e-15 | 0 | Python (itertools.product) | 7.1e-15 | 1e-9 | OK |
| 14 | CKY: número de análisis de la oración 1 con la gramática del curso | 2 | 2 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 1 | 2 | 2 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 1 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 1 | 2 | 2 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 1 coincide con el de NLTK (suma de verificación) | 1.357647e+6 | 1.357647e+6 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 2 con la gramática del curso | 2 | 2 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 2 | 2 | 2 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 2 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 2 | 2 | 2 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 2 coincide con el de NLTK (suma de verificación) | 1.704588e+6 | 1.704588e+6 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 3 con la gramática del curso | 2 | 2 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 3 | 2 | 2 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 3 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 3 | 0 | 0 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 3 coincide con el de NLTK (suma de verificación) | 1.040628e+6 | 1.040628e+6 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 4 con la gramática del curso | 5 | 5 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 4 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 4 | 1 | 1 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 4 coincide con el de NLTK (suma de verificación) | 2.474194e+7 | 2.474194e+7 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 5 con la gramática del curso | 1 | 1 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 5 | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 5 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 5 | 1 | 1 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 5 coincide con el de NLTK (suma de verificación) | 1.408150e+5 | 1.408150e+5 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 6 con la gramática del curso | 1 | 1 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 6 | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 6 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 6 | 1 | 1 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 6 coincide con el de NLTK (suma de verificación) | 2.710890e+5 | 2.710890e+5 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 7 con la gramática del curso | 2 | 2 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 7 | 2 | 2 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 7 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 7 | 2 | 2 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 7 coincide con el de NLTK (suma de verificación) | 1.746503e+6 | 1.746503e+6 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 8 con la gramática del curso | 14 | 14 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 8 | 14 | 14 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 8 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 8 | 4 | 4 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 8 coincide con el de NLTK (suma de verificación) | 2.378313e+8 | 2.378313e+8 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 9 con la gramática del curso | 0 | 0 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 9 exactamente cuando NLTK da al menos un análisis | 0 | 0 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 9 | 0 | 0 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 9 coincide con el de NLTK (suma de verificación) | 0 | 0 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 10 con la gramática del curso | 14 | 14 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Analizador ascendente (desplazar-reducir): número de análisis de la oración 10 | 14 | 14 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 10 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 10 | 1 | 1 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 10 coincide con el de NLTK (suma de verificación) | 2.956133e+8 | 2.956133e+8 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | CKY: número de análisis de la oración 11 con la gramática del curso | 7 | 7 | NLTK 3.10.4 ChartParser (número de árboles) | 0.0e+0 | 0 | OK |
| 14 | Earley: reconoce la oración 11 exactamente cuando NLTK da al menos un análisis | 1 | 1 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 14 | Analizador descendente (gramática sin recursión izquierda): análisis de la oración 11 | 0 | 0 | NLTK 3.10.4 RecursiveDescentParser | 0.0e+0 | 0 | OK |
| 14 | CKY: el conjunto de árboles de la oración 11 coincide con el de NLTK (suma de verificación) | 2.979450e+7 | 2.979450e+7 | NLTK 3.10.4 ChartParser | 0.0e+0 | 0 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 1 (CKY de Viterbi) | -19.3369715 | -19.3369715 | NLTK 3.10.4 ViterbiParser | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 1 | -18.9315064 | -18.9315064 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 2 (CKY de Viterbi) | -20.4355838 | -20.4355838 | NLTK 3.10.4 ViterbiParser | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 2 | -20.0301187 | -20.0301187 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 3 (CKY de Viterbi) | -19.4345518 | -19.4345518 | NLTK 3.10.4 ViterbiParser | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 3 | -18.7414046 | -18.7414046 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 4 (CKY de Viterbi) | -32.7061949 | -32.7061949 | NLTK 3.10.4 ViterbiParser | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 4 | -31.7899042 | -31.7899042 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 5 (CKY de Viterbi) | -13.2401464 | -13.2401464 | NLTK 3.10.4 ViterbiParser | 1.8e-15 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 5 | -13.2401464 | -13.2401464 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 1.8e-15 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 6 (CKY de Viterbi) | -17.622173 | -17.622173 | NLTK 3.10.4 ViterbiParser | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 6 | -17.622173 | -17.622173 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 7 (CKY de Viterbi) | -22.7381689 | -22.7381689 | NLTK 3.10.4 ViterbiParser | 3.6e-15 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 7 | -22.3327037 | -22.3327037 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 8 (CKY de Viterbi) | -35.7427492 | -35.7427492 | NLTK 3.10.4 ViterbiParser | 7.1e-15 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 8 | -34.2668427 | -34.2668427 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 9 (CKY de Viterbi) | 0 | 0 | NLTK 3.10.4 ViterbiParser | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 9 | 0 | 0 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 10 (CKY de Viterbi) | -41.2233881 | -41.2233881 | NLTK 3.10.4 ViterbiParser | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 10 | -39.7474816 | -39.7474816 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log P del mejor árbol de la oración 11 (CKY de Viterbi) | -29.6099731 | -29.6099731 | NLTK 3.10.4 ViterbiParser | 0.0e+0 | 1e-9 | OK |
| 17 | PCFG: log de la probabilidad total (interior) de la oración 11 | -27.6640629 | -27.6640629 | Python (suma de las probabilidades de todos los árboles de NLTK 3.10.4) | 0.0e+0 | 1e-9 | OK |
| 15 | Unificación de estructuras de rasgos (caso 1): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 1.682100e+4 | 1.682100e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 2): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 3): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 1.676400e+4 | 1.676400e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 4): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 5.558400e+4 | 5.558400e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 5): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 6): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 5.548400e+4 | 5.548400e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 7): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 5855 | 5855 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 8): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 9): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 5867 | 5867 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 10): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 2.399000e+4 | 2.399000e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 11): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 12): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 13): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 2146 | 2146 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 14): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 1.024500e+4 | 1.024500e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 15): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 16): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 8.970000e+4 | 8.970000e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 17): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 0 | 0 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Unificación de estructuras de rasgos (caso 18): resultado idéntico al de NLTK (suma de verificación; 0 si falla) | 2.160600e+4 | 2.160600e+4 | NLTK 3.10.4 FeatStruct.unify | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «la niña lee un libro» se acepta | 1 | 1 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «las niña lee un libro» se rechaza | 0 | 0 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «los gatos duerme» se rechaza | 0 | 0 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «yo lee un libro» se rechaza | 0 | 0 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «yo leo un libro» se acepta | 1 | 1 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «los niños leen los libros» se acepta | 1 | 1 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «el niño duerme un libro» se rechaza | 0 | 0 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 15 | Gramática de unificación: «la casa es roja» se acepta | 1 | 1 | juicio de gramaticalidad fijado a mano (concordancia de género, número y persona) | 0.0e+0 | 0 | OK |
| 16 | Árboles de dependencias aleatorios: desacuerdos con Python en «es árbol» y «es proyectivo» (60 árboles) | 0 | 0 | Python (implementación independiente) | 0.0e+0 | 0 | OK |
| 16 | Oráculo arc-standard: desacuerdos con Python en la secuencia de transiciones (60 árboles) | 0 | 0 | Python (implementación independiente) | 0.0e+0 | 0 | OK |
| 16 | Oráculo arc-standard: cada secuencia reconstruye exactamente el árbol de referencia (árboles proyectivos y 11 oraciones anotadas) | 0 | 0 | identidad: ejecutar(oráculo(árbol)) = árbol | 0.0e+0 | 0 | OK |
| 16 | Chu-Liu/Edmonds: máxima diferencia de peso total con NetworkX en 25 matrices de puntuaciones | 3.552714e-15 | 0 | NetworkX maximum_spanning_arborescence | 3.6e-15 | 1e-9 | OK |
| 18 | Evaluación de la fórmula 1 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 2 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 3 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 4 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 5 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 6 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 7 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 8 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 9 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 10 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 11 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 12 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 13 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 14 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 15 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 16 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 17 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 18 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 19 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 20 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 21 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 22 en el modelo de prueba (1 = verdadera) | 0 | 0 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 23 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 24 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Evaluación de la fórmula 25 en el modelo de prueba (1 = verdadera) | 1 | 1 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Fórmulas del modelo de prueba que se evalúan como verdaderas | 18 | 18 | NLTK 3.10.4 sem.Model.satisfy | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (1 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (2 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (3 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (4 de 40) | 10 | 10 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (5 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (6 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (7 de 40) | 3 | 3 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (8 de 40) | 6 | 6 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (9 de 40) | 10 | 10 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (10 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (11 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (12 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (13 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (14 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (15 de 40) | 7 | 7 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (16 de 40) | 3 | 3 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (17 de 40) | 4 | 4 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (18 de 40) | 3 | 3 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (19 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (20 de 40) | 10 | 10 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (21 de 40) | 3 | 3 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (22 de 40) | 4 | 4 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (23 de 40) | 0 | 0 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (24 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (25 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (26 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (27 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (28 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (29 de 40) | 10 | 10 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (30 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (31 de 40) | 7 | 7 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (32 de 40) | 4 | 4 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (33 de 40) | 2 | 2 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (34 de 40) | 4 | 4 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (35 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (36 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (37 de 40) | 1 | 1 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (38 de 40) | 0 | 0 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (39 de 40) | 4 | 4 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 18 | Número de modelos de una fórmula proposicional aleatoria (40 de 40) | 4 | 4 | SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 1 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 2 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 3 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 4 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 5 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 6 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 7 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 8 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 9 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 10 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 11 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 12 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 13 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 14 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 15 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 16 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 17 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 18 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 19 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 20 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 21 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 22 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 23 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 24 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 25 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 26 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 27 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 28 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 29 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 30 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 31 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 32 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 33 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 34 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 35 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 36 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 37 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 38 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 39 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 40 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 41 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 42 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 43 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 44 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Tableau de ALC: satisfacibilidad del concepto aleatorio 45 (1 = satisfacible) | 1 | 1 | Python (búsqueda exhaustiva de modelos con hasta 3 individuos) | 0.0e+0 | 0 | OK |
| 19 | Instancias de «Persona» deducidas por tableaux frente a las del razonador OWL RL (owlrl) | 8965 | 8965 | Python (rdflib + owlrl, py/19-ontologia.py) | 0.0e+0 | 0 | OK |
| 19 | Instancias de «Estudiante» deducidas por tableaux frente a las del razonador OWL RL (owlrl) | 3542 | 3542 | Python (rdflib + owlrl, py/19-ontologia.py) | 0.0e+0 | 0 | OK |
| 19 | Instancias de «Docente» deducidas por tableaux frente a las del razonador OWL RL (owlrl) | 4521 | 4521 | Python (rdflib + owlrl, py/19-ontologia.py) | 0.0e+0 | 0 | OK |
| 19 | Instancias de «Monitor» deducidas por tableaux frente a las del razonador OWL RL (owlrl) | 1054 | 1054 | Python (rdflib + owlrl, py/19-ontologia.py) | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 1 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 2 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 3 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 4 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 5 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 6 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 7 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 8 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 9 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 10 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 11 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 12 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 13 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 14 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 15 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 16 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 17 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 18 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 19 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 20 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 21 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 22 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 23 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 24 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 25 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 26 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 27 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 28 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 29 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 30 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 31 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 32 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 33 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 34 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 35 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 36 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 37 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 38 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 39 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 40 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 41 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 42 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 43 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 44 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 45 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 20 | β-reducción de la expresión lambda 46 (idéntica a la de NLTK salvo el nombre de las variables ligadas) | 1 | 1 | NLTK 3.10.4 Expression.simplify | 0.0e+0 | 0 | OK |
| 21 | Similitud por camino: máxima diferencia con NLTK en 120 pares de synsets de WordNet 3.0 | 0 | 0 | NLTK 3.10.4 Synset.path_similarity | 0.0e+0 | 1e-12 | OK |
| 21 | Similitud de Wu-Palmer: máxima diferencia con NLTK en 120 pares de synsets | 0 | 0 | NLTK 3.10.4 Synset.wup_similarity | 0.0e+0 | 1e-12 | OK |
| 21 | Profundidad mínima y máxima de los synsets: desacuerdos con NLTK | 0 | 0 | NLTK 3.10.4 Synset.min_depth / max_depth | 0.0e+0 | 0 | OK |
| 22 | Lesk simplificado: oraciones con distinto sentido elegido que la implementación en Python (todas las oraciones de prueba) | 0 | 0 | Python (NLTK Snowball, misma firma y desempate) | 0.0e+0 | 0 | OK |
| 22 | Bayes ingenuo de sentidos: sentidos elegidos distintos de los de scikit-learn | 0 | 0 | scikit-learn (MultinomialNB, alfa = 1, sin a priori) | 0.0e+0 | 0 | OK |
| 22 | Bayes ingenuo de sentidos: log-verosimilitudes conjuntas que difieren de scikit-learn (tolerancia 1e-9) | 0 | 0 | scikit-learn (predict_joint_log_proba) | 0.0e+0 | 0 | OK |
| 22 | Lesk sin ejemplos en la firma: sentidos elegidos distintos de los de Python | 0 | 0 | Python | 0.0e+0 | 0 | OK |
| 22 | Lesk ponderado con IDF: puntuaciones que difieren de las de Python (tolerancia 1e-9) | 0 | 0 | Python (math.log) | 0.0e+0 | 0 | OK |
| 22 | Lesk simplificado: coinciden también las puntuaciones de todos los sentidos | 0 | 0 | Python | 0.0e+0 | 0 | OK |
| 23 | Número de pares de coocurrencia de la matriz palabra–contexto | 5.572200e+4 | 5.572200e+4 | Python (suma de la matriz con NumPy) | 0.0e+0 | 0 | OK |
| 23 | Coseno entre vectores PPMI: máxima diferencia con NumPy en 120 pares de palabras | 5.551115e-17 | 0 | NumPy (log2, PMI positivo, coseno) | 5.6e-17 | 1e-12 | OK |
| 23 | Coseno entre vectores de conteos: máxima diferencia con NumPy en 120 pares | 0 | 0 | NumPy | 0.0e+0 | 1e-12 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (1) | 1.114570e+5 | 1.114570e+5 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (2) | 1.120750e+5 | 1.120750e+5 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (3) | 1.423480e+5 | 1.423480e+5 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (4) | 5.303900e+4 | 5.303900e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (5) | 8.653400e+4 | 8.653400e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (6) | 8.002400e+4 | 8.002400e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (7) | 6.156200e+4 | 6.156200e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (8) | 5.586700e+4 | 5.586700e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (9) | 7.375600e+4 | 7.375600e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 23 | Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (10) | 7.755100e+4 | 7.755100e+4 | NumPy (ordenación por coseno) | 0.0e+0 | 0 | OK |
| 24 | Tamaño del vocabulario (unigramas) | 124 | 124 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Vocabulario (unigramas): suma de verificación de los rasgos ordenados | 5.786629e+7 | 5.786629e+7 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Total de ocurrencias en la matriz (unigramas) | 3324 | 3324 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Celdas no nulas de la matriz (unigramas) | 3169 | 3169 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | TF-IDF (unigramas): máxima diferencia en la suma de cada fila con scikit-learn | 8.881784e-16 | 0 | scikit-learn TfidfVectorizer | 8.9e-16 | 1e-12 | OK |
| 24 | TF-IDF con tf sublineal (unigramas): máxima diferencia en la suma de cada fila | 1.332268e-15 | 0 | scikit-learn TfidfVectorizer(sublinear_tf=True) | 1.3e-15 | 1e-12 | OK |
| 24 | Término de mayor TF-IDF de cada documento (unigramas): desacuerdos | 0 | 0 | scikit-learn TfidfVectorizer | 0.0e+0 | 0 | OK |
| 24 | Tamaño del vocabulario (uni+bigramas, min_df = 2) | 401 | 401 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Vocabulario (uni+bigramas, min_df = 2): suma de verificación de los rasgos ordenados | 4.405168e+8 | 4.405168e+8 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Total de ocurrencias en la matriz (uni+bigramas, min_df = 2) | 6191 | 6191 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Celdas no nulas de la matriz (uni+bigramas, min_df = 2) | 6036 | 6036 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | TF-IDF (uni+bigramas, min_df = 2): máxima diferencia en la suma de cada fila con scikit-learn | 2.664535e-15 | 0 | scikit-learn TfidfVectorizer | 2.7e-15 | 1e-12 | OK |
| 24 | TF-IDF con tf sublineal (uni+bigramas, min_df = 2): máxima diferencia en la suma de cada fila | 2.664535e-15 | 0 | scikit-learn TfidfVectorizer(sublinear_tf=True) | 2.7e-15 | 1e-12 | OK |
| 24 | Término de mayor TF-IDF de cada documento (uni+bigramas, min_df = 2): desacuerdos | 0 | 0 | scikit-learn TfidfVectorizer | 0.0e+0 | 0 | OK |
| 24 | Tamaño del vocabulario (hasta trigramas con palabras vacías) | 1328 | 1328 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Vocabulario (hasta trigramas con palabras vacías): suma de verificación de los rasgos ordenados | 9.835063e+8 | 9.835063e+8 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Total de ocurrencias en la matriz (hasta trigramas con palabras vacías) | 5424 | 5424 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Celdas no nulas de la matriz (hasta trigramas con palabras vacías) | 5424 | 5424 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | TF-IDF (hasta trigramas con palabras vacías): máxima diferencia en la suma de cada fila con scikit-learn | 1.776357e-15 | 0 | scikit-learn TfidfVectorizer | 1.8e-15 | 1e-12 | OK |
| 24 | TF-IDF con tf sublineal (hasta trigramas con palabras vacías): máxima diferencia en la suma de cada fila | 1.776357e-15 | 0 | scikit-learn TfidfVectorizer(sublinear_tf=True) | 1.8e-15 | 1e-12 | OK |
| 24 | Término de mayor TF-IDF de cada documento (hasta trigramas con palabras vacías): desacuerdos | 0 | 0 | scikit-learn TfidfVectorizer | 0.0e+0 | 0 | OK |
| 24 | Tamaño del vocabulario (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)) | 61 | 61 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Vocabulario (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)): suma de verificación de los rasgos ordenados | 1.749810e+7 | 1.749810e+7 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Total de ocurrencias en la matriz (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)) | 1698 | 1698 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | Celdas no nulas de la matriz (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)) | 1698 | 1698 | scikit-learn CountVectorizer | 0.0e+0 | 0 | OK |
| 24 | TF-IDF (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)): máxima diferencia en la suma de cada fila con scikit-learn | 4.440892e-16 | 0 | scikit-learn TfidfVectorizer | 4.4e-16 | 1e-12 | OK |
| 24 | TF-IDF con tf sublineal (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)): máxima diferencia en la suma de cada fila | 4.440892e-16 | 0 | scikit-learn TfidfVectorizer(sublinear_tf=True) | 4.4e-16 | 1e-12 | OK |
| 24 | Término de mayor TF-IDF de cada documento (61 rasgos más frecuentes con palabras vacías (sin empate en el corte)): desacuerdos | 0 | 0 | scikit-learn TfidfVectorizer | 0.0e+0 | 0 | OK |
| 24 | Búsqueda por coseno: los 5 documentos más cercanos a la consulta 1 | 8730 | 8730 | scikit-learn (cosine_similarity) | 0.0e+0 | 0 | OK |
| 24 | Búsqueda por coseno: los 5 documentos más cercanos a la consulta 2 | 8493 | 8493 | scikit-learn (cosine_similarity) | 0.0e+0 | 0 | OK |
| 24 | Búsqueda por coseno: los 5 documentos más cercanos a la consulta 3 | 7643 | 7643 | scikit-learn (cosine_similarity) | 0.0e+0 | 0 | OK |
| 25 | Palabras de prueba evaluadas (incluido el fin de oración) | 5805 | 5805 | Python (implementación con tuplas) | 0.0e+0 | 0 | OK |
| 25 | Palabras de prueba desconocidas (<unk>) | 1165 | 1165 | Python | 0.0e+0 | 0 | OK |
| 25 | Tamaño del vocabulario (modelo de orden 1) | 3631 | 3631 | Python | 0.0e+0 | 0 | OK |
| 25 | Perplejidad de máxima verosimilitud, orden 1 (−1 = infinita) | 159.832569 | 159.832569 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con suavizado de Laplace (k = 1), orden 1 | 163.757725 | 163.757725 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con suavizado de Laplace (k = 0.1), orden 1 | 160.158921 | 160.158921 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con interpolación lineal, orden 1 | 162.287824 | 162.287824 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Tamaño del vocabulario (modelo de orden 2) | 3631 | 3631 | Python | 0.0e+0 | 0 | OK |
| 25 | Perplejidad de máxima verosimilitud, orden 2 (−1 = infinita) | -1 | -1 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con suavizado de Laplace (k = 1), orden 2 | 470.662522 | 470.662522 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con suavizado de Laplace (k = 0.1), orden 2 | 244.912189 | 244.912189 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con interpolación lineal, orden 2 | 122.822544 | 122.822544 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con Kneser–Ney interpolado (D = 0.75), orden 2 | 102.214618 | 102.214618 | Python | 1.4e-14 | 0.000001 | OK |
| 25 | Perplejidad con Kneser–Ney interpolado (D = 0.9), orden 2 | 103.222005 | 103.222005 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Tamaño del vocabulario (modelo de orden 3) | 3631 | 3631 | Python | 0.0e+0 | 0 | OK |
| 25 | Perplejidad de máxima verosimilitud, orden 3 (−1 = infinita) | -1 | -1 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con suavizado de Laplace (k = 1), orden 3 | 1614.05409 | 1614.05409 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con suavizado de Laplace (k = 0.1), orden 3 | 907.242334 | 907.242334 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con interpolación lineal, orden 3 | 174.968541 | 174.968541 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con Kneser–Ney interpolado (D = 0.75), orden 3 | 103.232068 | 103.232068 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Perplejidad con Kneser–Ney interpolado (D = 0.9), orden 3 | 99.8556647 | 99.8556647 | Python | 0.0e+0 | 0.000001 | OK |
| 25 | Probabilidad kn del trigrama de prueba 1 | 0.122670537 | 0.122670537 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad laplace del trigrama de prueba 1 | 0.0484165147 | 0.0484165147 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad mle del trigrama de prueba 1 | 0.12125 | 0.12125 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad kn del trigrama de prueba 2 | 0.028861906 | 0.028861906 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad laplace del trigrama de prueba 2 | 0.00229474758 | 0.00229474758 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad mle del trigrama de prueba 2 | 0.0274914089 | 0.0274914089 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad kn del trigrama de prueba 3 | 0.0100984334 | 0.0100984334 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad laplace del trigrama de prueba 3 | 0.00124875125 | 0.00124875125 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad mle del trigrama de prueba 3 | 0.0107238606 | 0.0107238606 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad kn del trigrama de prueba 4 | 0.183658516 | 0.183658516 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad laplace del trigrama de prueba 4 | 0.0100567303 | 0.0100567303 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad mle del trigrama de prueba 4 | 0.153846154 | 0.153846154 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad kn del trigrama de prueba 5 | 0.207587888 | 0.207587888 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad laplace del trigrama de prueba 5 | 0.00325291407 | 0.00325291407 | Python | 0.0e+0 | 1e-12 | OK |
| 25 | Probabilidad mle del trigrama de prueba 5 | 0.189655172 | 0.189655172 | Python | 0.0e+0 | 1e-12 | OK |
| 26 | Valores singulares de la matriz PPMI (los 20 primeros): máxima diferencia con NumPy | 1.421085e-13 | 0 | NumPy linalg.svd | 1.4e-13 | 0.000001 | OK |
| 26 | Coseno entre vectores U·S de rango 20: máxima diferencia con NumPy en 100 pares | 4.656711e-10 | 0 | NumPy linalg.svd | 4.7e-10 | 0.000001 | OK |
| 26 | Pérdida skip-gram con muestreo negativo (caso 1) | 2.9942944 | 2.9942944 | PyTorch (logsigmoid) | 4.4e-16 | 1e-12 | OK |
| 26 | Gradiente respecto de los vectores (caso 1): máxima diferencia con autograd | 2.220446e-16 | 0 | PyTorch autograd | 2.2e-16 | 1e-12 | OK |
| 26 | Pérdida skip-gram con muestreo negativo (caso 2) | 4.05196989 | 4.05196989 | PyTorch (logsigmoid) | 0.0e+0 | 1e-12 | OK |
| 26 | Gradiente respecto de los vectores (caso 2): máxima diferencia con autograd | 8.881784e-16 | 0 | PyTorch autograd | 8.9e-16 | 1e-12 | OK |
| 26 | Pérdida skip-gram con muestreo negativo (caso 3) | 3.48453453 | 3.48453453 | PyTorch (logsigmoid) | 4.4e-16 | 1e-12 | OK |
| 26 | Gradiente respecto de los vectores (caso 3): máxima diferencia con autograd | 4.440892e-16 | 0 | PyTorch autograd | 4.4e-16 | 1e-12 | OK |
| 26 | Pérdida skip-gram con muestreo negativo (caso 4) | 9.6874869 | 9.6874869 | PyTorch (logsigmoid) | 0.0e+0 | 1e-12 | OK |
| 26 | Gradiente respecto de los vectores (caso 4): máxima diferencia con autograd | 4.440892e-16 | 0 | PyTorch autograd | 4.4e-16 | 1e-12 | OK |
| 26 | Pérdida skip-gram con muestreo negativo (caso 5) | 3.83494201 | 3.83494201 | PyTorch (logsigmoid) | 0.0e+0 | 1e-12 | OK |
| 26 | Gradiente respecto de los vectores (caso 5): máxima diferencia con autograd | 4.440892e-16 | 0 | PyTorch autograd | 4.4e-16 | 1e-12 | OK |
| 27 | Validación cruzada (5 bloques), Bayes ingenuo con conteos (polaridad): exactitud media | 0.936111111 | 0.936111111 | scikit-learn (Pipeline + KFold) | 0.0e+0 | 1e-9 | OK |
| 27 | Predicciones de la validación cruzada, Bayes ingenuo con conteos (polaridad): suma de verificación | 5.295869e+8 | 5.295869e+8 | scikit-learn cross_val_predict | 0.0e+0 | 0 | OK |
| 27 | Bayes ingenuo con conteos (polaridad): F1 macro | 0.936106674 | 0.936106674 | scikit-learn f1_score | 0.0e+0 | 1e-12 | OK |
| 27 | Bayes ingenuo con conteos (polaridad): matriz de confusión | 4513 | 4513 | scikit-learn confusion_matrix | 0.0e+0 | 0 | OK |
| 27 | Validación cruzada (5 bloques), Bayes ingenuo con TF-IDF de uni+bigramas (polaridad): exactitud media | 0.963888889 | 0.963888889 | scikit-learn (Pipeline + KFold) | 0.0e+0 | 1e-9 | OK |
| 27 | Predicciones de la validación cruzada, Bayes ingenuo con TF-IDF de uni+bigramas (polaridad): suma de verificación | 5.294345e+8 | 5.294345e+8 | scikit-learn cross_val_predict | 0.0e+0 | 0 | OK |
| 27 | Bayes ingenuo con TF-IDF de uni+bigramas (polaridad): F1 macro | 0.96388861 | 0.96388861 | scikit-learn f1_score | 0.0e+0 | 1e-12 | OK |
| 27 | Bayes ingenuo con TF-IDF de uni+bigramas (polaridad): matriz de confusión | 3314 | 3314 | scikit-learn confusion_matrix | 0.0e+0 | 0 | OK |
| 27 | Validación cruzada (5 bloques), Bayes ingenuo por tema (10 clases): exactitud media | 0.858333333 | 0.858333333 | scikit-learn (Pipeline + KFold) | 0.0e+0 | 1e-9 | OK |
| 27 | Predicciones de la validación cruzada, Bayes ingenuo por tema (10 clases): suma de verificación | 6.106294e+8 | 6.106294e+8 | scikit-learn cross_val_predict | 0.0e+0 | 0 | OK |
| 27 | Bayes ingenuo por tema (10 clases): F1 macro | 0.859169918 | 0.859169918 | scikit-learn f1_score | 0.0e+0 | 1e-12 | OK |
| 27 | Bayes ingenuo por tema (10 clases): matriz de confusión | 1.027290e+6 | 1.027290e+6 | scikit-learn confusion_matrix | 0.0e+0 | 0 | OK |
| 27 | Validación cruzada (5 bloques), regresión logística con conteos (polaridad): exactitud media | 1 | 1 | scikit-learn (Pipeline + KFold) | 0.0e+0 | 1e-9 | OK |
| 27 | Predicciones de la validación cruzada, regresión logística con conteos (polaridad): suma de verificación | 5.293660e+8 | 5.293660e+8 | scikit-learn cross_val_predict | 0.0e+0 | 0 | OK |
| 27 | regresión logística con conteos (polaridad): F1 macro | 1 | 1 | scikit-learn f1_score | 0.0e+0 | 1e-12 | OK |
| 27 | regresión logística con conteos (polaridad): matriz de confusión | 3202 | 3202 | scikit-learn confusion_matrix | 0.0e+0 | 0 | OK |
| 27 | Validación cruzada (5 bloques), regresión logística con TF-IDF (polaridad): exactitud media | 1 | 1 | scikit-learn (Pipeline + KFold) | 0.0e+0 | 1e-9 | OK |
| 27 | Predicciones de la validación cruzada, regresión logística con TF-IDF (polaridad): suma de verificación | 5.293660e+8 | 5.293660e+8 | scikit-learn cross_val_predict | 0.0e+0 | 0 | OK |
| 27 | regresión logística con TF-IDF (polaridad): F1 macro | 1 | 1 | scikit-learn f1_score | 0.0e+0 | 1e-12 | OK |
| 27 | regresión logística con TF-IDF (polaridad): matriz de confusión | 3202 | 3202 | scikit-learn confusion_matrix | 0.0e+0 | 0 | OK |
| 27 | Regresión logística (conteos): máxima diferencia de probabilidad con scikit-learn en 40 opiniones | 9.246183e-8 | 0 | scikit-learn LogisticRegression (lbfgs, tol 1e-12) | 9.2e-8 | 0.000001 | OK |
| 27 | Regresión logística (conteos): intercepto | 1.38664888 | 1.38664661 | scikit-learn (lbfgs converge hasta ~1e-6) | 2.3e-6 | 0.00001 | OK |
| 27 | Regresión logística (conteos): norma de los pesos | 8.85495664 | 8.85495632 | scikit-learn (lbfgs converge hasta ~1e-6) | 3.2e-7 | 0.00001 | OK |
| 27 | Regresión logística (TF-IDF): máxima diferencia de probabilidad con scikit-learn en 40 opiniones | 1.437659e-7 | 0 | scikit-learn LogisticRegression (lbfgs, tol 1e-12) | 1.4e-7 | 0.000001 | OK |
| 27 | Regresión logística (TF-IDF): intercepto | 0.681830514 | 0.681830164 | scikit-learn (lbfgs converge hasta ~1e-6) | 3.5e-7 | 0.00001 | OK |
| 27 | Regresión logística (TF-IDF): norma de los pesos | 25.9749955 | 25.9749932 | scikit-learn (lbfgs converge hasta ~1e-6) | 2.2e-6 | 0.00001 | OK |
| 28 | Perceptrón multicapa (tanh): pérdida de entropía cruzada binaria | 1.69952953 | 1.69952953 | PyTorch (binary_cross_entropy) | 0.0e+0 | 1e-12 | OK |
| 28 | Perceptrón multicapa (tanh): máxima diferencia de los gradientes con autograd | 8.326673e-17 | 0 | PyTorch autograd | 8.3e-17 | 1e-12 | OK |
| 28 | Perceptrón multicapa (tanh): máxima diferencia de las probabilidades de salida | 5.551115e-17 | 0 | PyTorch | 5.6e-17 | 1e-12 | OK |
| 28 | Perceptrón multicapa (relu): pérdida de entropía cruzada binaria | 4.06841762 | 4.06841762 | PyTorch (binary_cross_entropy) | 8.9e-16 | 1e-12 | OK |
| 28 | Perceptrón multicapa (relu): máxima diferencia de los gradientes con autograd | 4.440892e-16 | 0 | PyTorch autograd | 4.4e-16 | 1e-12 | OK |
| 28 | Perceptrón multicapa (relu): máxima diferencia de las probabilidades de salida | 1.084202e-18 | 0 | PyTorch | 1.1e-18 | 1e-12 | OK |
| 28 | RNN de Elman: máxima diferencia de los estados ocultos de 6 pasos con PyTorch | 3.885781e-16 | 0 | PyTorch nn.RNN | 3.9e-16 | 1e-12 | OK |
| 28 | LSTM: máxima diferencia de los estados ocultos de 6 pasos con PyTorch | 1.110223e-16 | 0 | PyTorch nn.LSTM | 1.1e-16 | 1e-12 | OK |
| 28 | LSTM: máxima diferencia del estado de la celda final | 1.110223e-16 | 0 | PyTorch nn.LSTM | 1.1e-16 | 1e-12 | OK |
| 28 | Convolución 1D (3 filtros de ancho 2) con ReLU y max-pooling: máxima diferencia con PyTorch | 1.110223e-16 | 0 | PyTorch nn.Conv1d | 1.1e-16 | 1e-12 | OK |
| 28 | Convolución 1D (2 filtros de ancho 3) con ReLU y max-pooling: máxima diferencia con PyTorch | 0 | 0 | PyTorch nn.Conv1d | 0.0e+0 | 1e-12 | OK |
| 29 | Pesos de atención softmax(QKᵀ/√d): máxima diferencia con PyTorch | 1.110223e-16 | 0 | PyTorch softmax | 1.1e-16 | 1e-12 | OK |
| 29 | Salida de la atención: máxima diferencia con scaled_dot_product_attention | 2.498002e-16 | 0 | PyTorch scaled_dot_product_attention | 2.5e-16 | 1e-12 | OK |
| 29 | Atención causal (máscara triangular): máxima diferencia de la salida | 1.110223e-16 | 0 | PyTorch scaled_dot_product_attention(is_causal=True) | 1.1e-16 | 1e-12 | OK |
| 29 | Atención causal: los pesos futuros son exactamente cero | 0 | 0 | definición de la máscara | 0.0e+0 | 0 | OK |
| 30 | Bloque Transformer (normalización posterior, sin máscara): máxima diferencia de la salida con nn.TransformerEncoderLayer | 8.881784e-16 | 0 | PyTorch nn.TransformerEncoderLayer | 8.9e-16 | 1e-11 | OK |
| 30 | Bloque Transformer (normalización posterior, sin máscara): máxima diferencia de los pesos de atención de las 3 cabezas | 1.110223e-16 | 0 | PyTorch nn.MultiheadAttention | 1.1e-16 | 1e-12 | OK |
| 30 | Bloque Transformer (normalización posterior, máscara causal): máxima diferencia de la salida con nn.TransformerEncoderLayer | 8.881784e-16 | 0 | PyTorch nn.TransformerEncoderLayer | 8.9e-16 | 1e-11 | OK |
| 30 | Bloque Transformer (normalización posterior, máscara causal): máxima diferencia de los pesos de atención de las 3 cabezas | 1.110223e-16 | 0 | PyTorch nn.MultiheadAttention | 1.1e-16 | 1e-12 | OK |
| 30 | Bloque Transformer (normalización previa, sin máscara): máxima diferencia de la salida con nn.TransformerEncoderLayer | 4.440892e-16 | 0 | PyTorch nn.TransformerEncoderLayer | 4.4e-16 | 1e-11 | OK |
| 30 | Bloque Transformer (normalización previa, sin máscara): máxima diferencia de los pesos de atención de las 3 cabezas | 1.665335e-16 | 0 | PyTorch nn.MultiheadAttention | 1.7e-16 | 1e-12 | OK |
| 30 | Bloque Transformer (normalización previa, máscara causal): máxima diferencia de la salida con nn.TransformerEncoderLayer | 4.440892e-16 | 0 | PyTorch nn.TransformerEncoderLayer | 4.4e-16 | 1e-11 | OK |
| 30 | Bloque Transformer (normalización previa, máscara causal): máxima diferencia de los pesos de atención de las 3 cabezas | 1.387779e-16 | 0 | PyTorch nn.MultiheadAttention | 1.4e-16 | 1e-12 | OK |
| 30 | Codificación posicional sinusoidal (20 posiciones × 16 dimensiones): máxima diferencia con NumPy | 8.881784e-16 | 0 | NumPy | 8.9e-16 | 1e-12 | OK |
| 30 | Codificación posicional sinusoidal (7 posiciones × 8 dimensiones): máxima diferencia con NumPy | 1.110223e-16 | 0 | NumPy | 1.1e-16 | 1e-12 | OK |
| 30 | Codificación posicional sinusoidal (50 posiciones × 64 dimensiones): máxima diferencia con NumPy | 7.105427e-15 | 0 | NumPy | 7.1e-15 | 1e-12 | OK |
| 31 | BPE: las 400 fusiones aprendidas (par y frecuencia) coinciden con la implementación independiente | 0 | 0 | Python (Counter y búsqueda del par más frecuente) | 0.0e+0 | 0 | OK |
| 31 | BPE: palabras codificadas de forma distinta en 124 palabras de prueba (incluidas palabras raras) | 0 | 0 | Python | 0.0e+0 | 0 | OK |
| 31 | BPE: las 50 primeras fusiones, con un entrenamiento independiente de 50 pasos | 0 | 0 | Python | 0.0e+0 | 0 | OK |
| 32 | BLEU de corpus (1 referencia, sin suavizado): diferencia con sacrebleu | 0 | 0 | sacrebleu corpus_bleu (tokenize = none) | 0.0e+0 | 1e-9 | OK |
| 32 | BLEU de corpus con 2 referencias por oración: diferencia con sacrebleu | 2.842171e-14 | 0 | sacrebleu corpus_bleu (2 flujos de referencias) | 2.8e-14 | 1e-9 | OK |
| 32 | BLEU de corpus con suavizado exponencial: diferencia con sacrebleu | 0 | 0 | sacrebleu corpus_bleu (smooth = exp) | 0.0e+0 | 1e-9 | OK |
| 32 | BLEU de oración (40 pares): máxima diferencia con sacrebleu.sentence_bleu | 7.105427e-14 | 0 | sacrebleu sentence_bleu | 7.1e-14 | 1e-9 | OK |
| 32 | ROUGE-1 (precisión, cobertura y F1 de 40 pares): máxima diferencia con rouge-score | 0 | 0 | rouge-score (sin raíces) | 0.0e+0 | 1e-12 | OK |
| 32 | ROUGE-2 (precisión, cobertura y F1 de 40 pares): máxima diferencia con rouge-score | 0 | 0 | rouge-score (sin raíces) | 0.0e+0 | 1e-12 | OK |
| 32 | ROUGE-L (precisión, cobertura y F1 de 40 pares): máxima diferencia con rouge-score | 0 | 0 | rouge-score (sin raíces) | 0.0e+0 | 1e-12 | OK |
| 33 | Perceptrón promediado de entidades: etiquetas predichas en las 300 oraciones de prueba (suma de verificación) | 9.501511e+8 | 9.501511e+8 | Python (py/33-ner.py, misma implementación) | 0.0e+0 | 0 | OK |
| 33 | Perceptrón promediado de entidades: oraciones etiquetadas de forma distinta en las 60 primeras | 0 | 0 | Python (py/33-ner.py) | 0.0e+0 | 0 | OK |
| 33 | Evaluación por entidades (LOC): precisión, cobertura y F1 del tagger, máxima diferencia | 0 | 0 | Python (conlleval, implementación independiente) | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (MISC): precisión, cobertura y F1 del tagger, máxima diferencia | 0 | 0 | Python (conlleval, implementación independiente) | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (ORG): precisión, cobertura y F1 del tagger, máxima diferencia | 0 | 0 | Python (conlleval, implementación independiente) | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (PER): precisión, cobertura y F1 del tagger, máxima diferencia | 0 | 0 | Python (conlleval, implementación independiente) | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (TOTAL): precisión, cobertura y F1 del tagger, máxima diferencia | 0 | 0 | Python (conlleval, implementación independiente) | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (LOC) con etiquetas perturbadas al azar (casos límite de BIO) | 0 | 0 | Python | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (MISC) con etiquetas perturbadas al azar (casos límite de BIO) | 0 | 0 | Python | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (ORG) con etiquetas perturbadas al azar (casos límite de BIO) | 0 | 0 | Python | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (PER) con etiquetas perturbadas al azar (casos límite de BIO) | 0 | 0 | Python | 0.0e+0 | 1e-12 | OK |
| 33 | Evaluación por entidades (TOTAL) con etiquetas perturbadas al azar (casos límite de BIO) | 0 | 0 | Python | 0.0e+0 | 1e-12 | OK |
| 33 | Extracción de entidades de 50 secuencias BIO perturbadas: diferencias con la implementación de Python | 0 | 0 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón promediado (gruesas, 1 época): palabras bien etiquetadas | 918 | 918 | Python (implementación independiente del mismo algoritmo) | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (gruesas, 1 época): suma de verificación de las etiquetas predichas | 8.945176e+8 | 8.945176e+8 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (gruesas, 1): rasgos con peso no nulo | 3675 | 3675 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón promediado (gruesas, 5 épocas): palabras bien etiquetadas | 970 | 970 | Python (implementación independiente del mismo algoritmo) | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (gruesas, 5 épocas): suma de verificación de las etiquetas predichas | 8.944076e+8 | 8.944076e+8 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (gruesas, 5): rasgos con peso no nulo | 4673 | 4673 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón promediado (EAGLES, 1 época): palabras bien etiquetadas | 852 | 852 | Python (implementación independiente del mismo algoritmo) | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (EAGLES, 1 época): suma de verificación de las etiquetas predichas | 9.824448e+8 | 9.824448e+8 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (EAGLES, 1): rasgos con peso no nulo | 5118 | 5118 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón promediado (EAGLES, 5 épocas): palabras bien etiquetadas | 895 | 895 | Python (implementación independiente del mismo algoritmo) | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (EAGLES, 5 épocas): suma de verificación de las etiquetas predichas | 9.562337e+8 | 9.562337e+8 | Python | 0.0e+0 | 0 | OK |
| 12 | Perceptrón (EAGLES, 5): rasgos con peso no nulo | 6383 | 6383 | Python | 0.0e+0 | 0 | OK |
