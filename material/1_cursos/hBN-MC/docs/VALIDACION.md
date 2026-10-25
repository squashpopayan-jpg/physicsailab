# Validación — hBN-MC v15.0.1

Comando: `npm test` (Node.js ≥ 18, sin dependencias). Salida completa en
`docs/VALIDACION_SALIDA.txt`. Cada suite termina con código 1 si falla una
sola comprobación.

## Resultado

Todas las suites pasan (96 comprobaciones con PASS explícito más las
aserciones de las suites de integración).

| Suite | Comprobaciones clave | Resultado |
|---|---|---|
| Estructura del paquete | versión única 15.0.1 en core, HTML, VERSION.json, package.json y CITATION.cff; 10 scripts en orden; sin rótulos de versiones antiguas; controles retirados ausentes | PASS |
| Motor (M1–M11) | topología AC/ZZ (grado 3, simetría, alternancia, d = 1.44 Å); calcFullE vs fuerza bruta en ambos reservorios (< 6×10⁻¹¹ eV); ΔE local y global (< 3×10⁻¹¹ eV); deriva en 20 000 pasos con pasivación (< 3×10⁻¹¹ eV); reproducibilidad por semilla; invariancia traslacional (0 eV); protocolos térmicos incluido el ciclo; E_form = 0 para h-BN y grafeno, vacancias con valor analítico; energía de borde por H analítica = diferencia finita; 60 poros geométricos válidos | PASS |
| Parches D1–D8 | potenciales químicos, generadores conexos y mono-terminados, clasificador invariante bajo PBC, estequiometría exacta, ΔE global con vecinos, coherencia de ε_XC | PASS |
| Investigación (I1–I9) | datos de Mazzoni coherentes; reajuste reproduce la Tabla 5.8 (Δ ≤ 0.004 eV, RMS 0.630 eV, R² 0.99996); CSV con alias y parámetros fijos; sistema de parámetros; calibración ε_CH recupera valores sintéticos; energética de poros lineal en μ_N y sin efectos sobre el estado del usuario; ΔE(B↔N) = 6.2408 eV analítico; α_C en casos límite; barrido con intercambio de réplicas reproducible y que restaura el estado | PASS |
| Integración (aplicación completa) | carga de los 10 scripts con DOM mínimo; arranque real; ε_CH = −70.41 y conjunto “tesis2019” tras el arranque; ejecución de CSV, gráficas, sesión, reajuste, escala energética, análisis, E_form(μ) | PASS |
| Subsistemas | importadores XYZ/POSCAR/XV/LAMMPS data/dump, estadística del lote, PBC, exportadores, constructor, idiomas, visor 3D de respaldo, RNG de vacancias | PASS |
| Estrés PBC | 726 casos, 109 060 aristas dirigidas, 0 fallos | PASS |

## Verificación manual en navegador

Se comprobó en el navegador integrado (Chromium): arranque sin errores de
consola; pestaña INV (tabla de parámetros, reajuste, energética de poros con
gráfica, barrido con intercambio de réplicas); corrida en modo ciclo
2000 → 20 000 → 2000 K con la gráfica E(T) de calentamiento y enfriamiento;
etiquetas del Paso 4.

## Pruebas históricas

`tests/historico/validacion_T1_T21_v14.6.js` es el guion narrativo de la
auditoría v14.6 (imprime diagnósticos, incluido un prototipo T12 que no es
código de la aplicación). `tests/historico/experimento_estabilidad_poro.js`
reproduce la tabla del §3.2 de `docs/INFORME_CIENTIFICO.md`.
