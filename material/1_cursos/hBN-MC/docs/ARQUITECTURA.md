# Arquitectura — hBN-MC v15.0.1

Aplicación web de cliente, sin compilación ni dependencias de ejecución. Los
módulos son scripts clásicos que comparten el estado global definido en
`src/core/core.js`; el orden de carga de `index.html` es significativo:

```
i18n → core → render → export → import → structure_generator_bands
     → batch → research → controls → viewer3d
```

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `src/core/core.js` | Versión única (`HBN_VERSION`), RNG Mulberry32 con semilla, parámetros ε con procedencia, reservorio de H, potenciales químicos y ventana de estabilidad, geometría del panal y PBC, generadores de estructuras, clasificador de poros, energía total, ΔE local/global, energía de formación, protocolos térmicos, selección de movimientos MC y overlay de poros. |
| `src/ui/render.js` | Inicialización de corridas (`init`), bucle interactivo (`loop`), cierre (`done`), mini-gráficas y gráfica E(T), actualización de indicadores (`ui`). |
| `src/ui/controls.js` | Lectura de controles, actualización en vivo, ambiente químico, reservorio de H, edición manual, pestañas, arranque. |
| `src/ui/i18n.js` | Textos en español e inglés. |
| `src/simulation/batch.js` | Modo LOTE: réplicas con semillas reproducibles, estadística e IC95 (t de Student), CSV autosuficiente. |
| `src/research/research.js` | Pestaña INV: reajuste por mínimos cuadrados, energética de poros, barrido de temperatura con intercambio de réplicas, calibración de ε_CH, escala energética, orden de corto alcance. Funciones de cálculo sin DOM (probadas en Node). |
| `src/io/export.js` | PNG, CSV, sesión (esquema 2), POSCAR, XV, LAMMPS, vídeo, ZIP (JSZip bajo demanda). |
| `src/io/import.js` | XYZ, POSCAR, SIESTA XV, LAMMPS data/dump. |
| `src/geometry/structure_generator_bands.js` | Constructor de heteroestructuras hBN/C con grafo explícito. |
| `src/view/viewer3d.js` | Visor 3D (Three.js bajo demanda, respaldo en Canvas). |

## Hamiltoniano del Monte Carlo

E = Σ_enlaces ε′(a,b) + pasivación de bordes abiertos + penalización H–H,
con ε′(X,α) = ε_Xα − s y ε′(X,X) = ε_XX (reservorio *tesis*, s = Δμ_H) o
ε′(X,X) = 0 (reservorio *H₂*, s = E(H₂)/2 + Δμ_H). `calcFullE`, `calcDeltaE`
y `calcDeltaE_global` usan la misma función `epsEff`; las pruebas M2–M5
verifican su coherencia con recálculo completo (error < 10⁻¹⁰ eV).

## Energía de formación

`calcFormationEnergyDFTLike()` usa E_fís (sin término vacancia–vacancia, sin
desplazamiento de reservorio, penalización H–H aparte) y los potenciales de
`chemicalEnvironmentPotentials()`: μ_B + μ_N = μ_BN (3ε_NB por defecto),
μ_N ≤ E(NH₃) − 3μ_H, μ_B ≤ E(BH₃) − 3μ_H.

## Protocolos térmicos

`temperatureAtStep(s, n, modo, Ti, Tf)` es la única implementación y la usan
el bucle interactivo, el modo LOTE y los barridos.

## Pruebas (npm test)

| Suite | Contenido |
|---|---|
| `tests/check_release.js` | Versión única, referencias locales, orden de scripts, controles retirados. |
| `tests/validacion_motor.js` | Topología, energía, ΔE, deriva, reproducibilidad, invariancia, protocolos, E_form, energía de borde, generadores. |
| `tests/validacion_parches.js` | Correcciones D1–D8 de la auditoría v14.7 sobre la API v15. |
| `tests/validacion_investigacion.js` | Datos de Mazzoni, reajuste, CSV, parámetros, calibración ε_CH, poros, escala energética, SRO, barrido PT. |
| `tests/smoke_full_app.js` | Carga los 10 scripts con un DOM mínimo, dispara el arranque real y ejecuta exportaciones y herramientas. |
| `tests/functional_subsystems.js` | Importadores, lote, PBC, exportadores, constructor, idiomas, visor. |
| `tests/pbc_stress.js` | 726 combinaciones de tamaño/orientación/periodicidad. |

`tests/harness.js` carga `core.js` y `research.js` en Node con un DOM mínimo.
