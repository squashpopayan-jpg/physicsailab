# Mecánica Cuántica — plan de trabajo

Pedido 2026-10-30: «Crear un curso de Mecánica Cuántica. Con todas las soluciones y procedimientos. Mantener el estilo de los cursos que hemos creado. Es exclusivamente Mecánica Cuántica» (ya existe `ConCode/cuantica` = curso aplicado a hBN-MC; este es el curso general).
Arquitectura de ConCode/fisicoquimica (namespace EM, build.js, shot.js, probe.js, MathJax, sims por capítulo). Acento violeta #5B3CC4 (oscuro #B9A6FF). Almacenamiento `mcq:`.
Salida: `node build.js` → dist/mecanica-cuantica.html (artefacto), dist/index.html, dist/Mecanica-Cuantica.html.

## Estilo y contrato de cada capítulo
- `src/chapters/NN-id.html` (plantilla `<template class="chapter-src" data-id data-num data-title data-part data-short>`) + `NN-id.js` (sims con `EM.defineSim`).
- Estructura: `<p class="lead">`, secciones `<section><h2>`, ecuaciones `<div class="eq key" data-name>`, `<div class="sim" data-sim data-title>` + `<div class="sim-guide"><ul>` con cifras verificadas, cajas `box ex|note|def|warn|hist` (los `box ex` son ejemplos RESUELTOS con procedimiento), sección final «Problemas propuestos» con `<ol class="problems">`.
- **Todos los problemas llevan solución paso a paso**: `<details class="sol"><summary>Solución paso a paso</summary><ol class="steps"><li><b>Planteamiento.</b> …</li><li><b>Desarrollo.</b> …</li><li><b>Resultado.</b> …</li><li><b>Comprobación.</b> …</li></ol></details>`; `<span class="ans">` para la cifra final; `<span class="lvl">Básico|Intermedio|Avanzado</span>`.
- Macros MathJax: `\ket{}`, `\bra{}`, `\braket{}{}`, `\mel{}{}{}`, `\ev{}`, `\comm{}{}`, `\hb`, `\op{}`, `\Tr`, `\dd`, `\ii`, `\ee`, `\un{}`, `\sen`, `\pdv{}{}`, `\odv{}{}`.
- HTML se escribe con la herramienta Write (no heredoc con apóstrofes). Textos con LaTeX en scripts Python: usar r"" (los `\t` se rompen). Verificar cada cifra con node/python ANTES de escribirla.
- Núcleo (sin DOM, probado en Node): 30-linalg.js (EM.P.la), 31-numerics.js (EM.P.sf/util/K), 32-schrod1d.js (EM.P.q1d: fdEigen, Numerov, CrankNicolson, exactas), 33+ nuevos (EM.qm…).
- Pruebas: `python tests/referencias.py` (SciPy, SymPy, mpmath → referencias.json) → `node tests/validar.js` (biblioteca JS vs referencias) y `python tests/problemas.py` (cifras de las soluciones de los problemas, SymPy/SciPy) → resultados.json → apéndice B.
- Comprobar: `node tools/shot.js check [ids]`; `node tools/probe.js <cap> <sim> '[{"id":val}]'`; `node tools/shot.js shot <cap> shots/x.png --sim <sim>`.

## Capítulos (id · título)
Parte I · Los orígenes y la función de onda
1 crisis · Del cuerpo negro al átomo de Bohr
2 schrodinger · La ecuación de Schrödinger y la interpretación de Born
3 paquetes · Paquetes de onda, Fourier e incertidumbre
4 formalismo · Operadores, observables y postulados
5 dirac · Espacios de Hilbert y notación de Dirac
Parte II · Problemas en una dimensión
6 caja · El pozo infinito
7 pozos · Pozo finito, delta y doble pozo
8 barreras · Escalones, barreras y efecto túnel
9 oscilador · El oscilador armónico
10 coherentes · Estados coherentes y comprimidos
11 bandas · Potenciales periódicos y bandas de Bloch
Parte III · Momento angular y el átomo
12 momang · Momento angular
13 central · Potenciales centrales
14 hidrogeno · El átomo de hidrógeno
15 espin · El espín 1/2
16 sumamom · Suma de momentos angulares
17 campos · Partícula en un campo electromagnético
18 simetrias · Simetrías y leyes de conservación
Parte IV · Métodos de aproximación
19 pert · Teoría de perturbaciones independiente del tiempo
20 fina · Estructura fina e hiperfina, Zeeman y Stark
21 variacional · Método variacional
22 wkb · Aproximación WKB
23 dependiente · Perturbaciones dependientes del tiempo y regla de oro de Fermi
24 adiabatico · Dos niveles, Rabi, Landau–Zener y fase de Berry
Parte V · Dispersión
25 dispersion · Teoría de la dispersión: Born y ondas parciales
26 resonancias · Lippmann–Schwinger, resonancias y baja energía
Parte VI · Partículas idénticas y muchos cuerpos
27 identicas · Partículas idénticas y el helio
28 muchos · Átomos de muchos electrones
29 segunda · Segunda cuantización y gases cuánticos
Parte VII · Sistemas abiertos, medida e información
30 densidad · Matriz densidad
31 entrelazamiento · Entrelazamiento, EPR y desigualdades de Bell
32 medida · Medida y decoherencia
33 abiertos · Sistemas cuánticos abiertos y ecuación de Lindblad
34 info · Información y computación cuántica
35 campo · El campo cuantizado y Jaynes–Cummings
36 caminos · Integrales de camino
37 dirac · Hacia lo relativista: ecuación de Dirac
Apéndices: 97 formulario · 98 validación · 99 bibliografía

## Estado
(actualizar tras cada capítulo)
- 2026-10-30: esqueleto copiado de fisicoquimica; estilos .steps/.ans; macros Dirac en shell.html; núcleo base copiado de ConCode/cuantica (30-32). Sin capítulos aún.
- 2026-10-30 (sesión 1): hechos caps 1–4 (crisis, schrodinger, paquetes, formalismo) + portada; 334 pruebas (tests/validar.js + tests/problemas.py). Núcleo propio: 33-qm-orig.js (EM.qm.orig), 34-qm-wave.js (EM.qm.wave: fft, gaussFree, SplitOp, stats). Lección: en heredocs de Python las `\t` de LaTeX se rompen: editar HTML con Edit/sed, nunca con Python; los chk de problemas.py aceptan la cifra impresa como STRING (se exige redondeo correcto).
- 2026-10-30: caps 5 (dirac) y 6 (caja) hechos; 494 pruebas. Nueva estructura de pruebas de problemas: tests/caps/capNN.py (un archivo por capítulo, se cargan solos desde tests/problemas.py con chk, math, np, sp, mp, C, linalg, integrate, h, c, kB, e, me, hbar, hc inyectados). Núcleo nuevo: 36-viz.js (EM.heat mapas de calor). Cuidado con nombres de sims duplicados entre capítulos (build.js avisa).
- 2026-10-30: caps 7 (pozos), 8 (barreras) hechos; 880 pruebas. Núcleo nuevo: 37-qm-pot.js (EM.qm.pot: delta, doble delta), 38-qm-scat.js (EM.qm.scat.solve: dispersión 1D por capas, con psi(x); validado contra numpy.linalg.solve). Pruebas de dispersión en validar.js (cap. 8) y numpy independiente en referencias.py (scat_ref, packet_ref).
- 2026-10-30: caps 9 (oscilador), 10 (coherentes) hechos; 1199 pruebas. Núcleo: 39-qm-ho.js (EM.qm.ho: psi, xmat, forbidden, poisson, cohDensity, squeezeCov, wignerFock/Gauss/Cat; validado con SciPy y expm de numpy). Sims con 3 por capítulo; tests/caps/capNN.py con cifras impresas como STRING.
- 2026-10-30: cap 11 (bandas) hecho; Partes I–II completas (caps 1–11), 1394 pruebas. Núcleo: 40-qm-band.js (EM.qm.band: peine de deltas, casi libres, enlace fuerte). Siguiente: Parte III (12 momang, 13 central, 14 hidrogeno, 15 espin, 16 sumamom, 17 campos, 18 simetrias), luego IV–VII, portada final, apéndices A/B/C, publicar.
- 2026-10-30: caps 12 (momang), 13 (central), 14 (hidrogeno) hechos; 2349 pruebas de biblioteca + 1086 cifras de problemas. Núcleo: 41-qm-ang.js, 42-qm-central.js, 43-qm-hyd.js (R_nl validado frente a scipy y sympy.physics.hydrogen). Cuidado: en la serie de terminación el argumento de Laguerre es 2ρ (ρ = κr). Heredocs con comillas complejas fallan en Bash: usar la herramienta Write para archivos de pruebas.
- 2026-10-31: caps 15 (espin), 16 (sumamom), 17 (campos), 18 (simetrias) hechos: Parte III completa (caps 12–18). 2843 pruebas de biblioteca + 1333 cifras de problemas. Núcleo: 44-qm-spin, 45-qm-couple (CG de Racah vs sympy), 46-qm-mag (Landau, AB, Hall), 47-qm-sym (Wigner d, A de Einstein vs NIST). Lección: usar siempre `\ee` (no `\e`) para la exponencial; scripts de edición con LaTeX → archivo .py con raw strings (no heredoc). Siguiente: Parte IV (19 pert, 20 fina, 21 variacional, 22 wkb, 23 dependiente, 24 adiabatico).
- 2026-10-31: caps 19 (pert), 20 (fina), 21 (variacional) hechos; 3262 pruebas de biblioteca + 1591 cifras. Núcleo: 48-qm-pert (Hirschfelder RS vs mpmath), 49-qm-fina (Dirac vs mpmath, Breit–Rabi vs numpy), 50-qm-var (GTO vs scipy, H2+ vs dblquad). Siguiente: 22 wkb, 23 dependiente, 24 adiabático (Parte IV), luego V–VII.
- 2026-10-31: caps 22 (wkb), 23 (dependiente), 24 (adiabatico) hechos: Parte IV completa (caps 19–24). Núcleo: 51-qm-wkb (BS, T, Gamow vs quad/ODE), 52-qm-tdep (RK4, pulsos, banda/regla de oro, LZ, Berry vs expm). Herramienta: tools/fixe.py <html> convierte \e→\ee. No usar heredocs bash para Python con LaTeX o regex con \e: escribir el .py con Write. Colisión de claves en referencias.json (ref['band'] cap. 1): usar sufijo de capítulo. Siguiente: Parte V (25 dispersion, 26 resonancias), VI (27 identicas, 28 muchos, 29 segunda), VII (30–37).
- 2026-10-31: caps 25 (dispersion), 26 (resonancias) hechos: Parte V completa. Núcleo 53-qm-scat3d (Numerov δ_l vs solve_ivp, pozo/esfera dura vs scipy, Born vs quad, Levinson con malla geométrica desde k grande: ¡el unwrap descendente debe empezar con δ pequeño, k ≫ V0a!). Siguiente: Parte VI (27 identicas, 28 muchos, 29 segunda), Parte VII (30–37), apéndices.
- 2026-10-31: caps 27 (identicas), 28 (muchos: HF/Roothaan vs numpy, Slater, Madelung), 29 (segunda: JW/Hubbard, Fermi, BEC) hechos: Parte VI completa. 4325 pruebas de biblioteca + 2081 cifras. Núcleos: 54-qm-ident, 55-qm-hf, 56-qm-secq. problemas.py tarda ~50 s (límite 120 s del tool: cuidado, si crece usar run_in_background). Siguiente: Parte VII (30 densidad, 31 entrelazamiento, 32 medida, 33 abiertos, 34 info, 35 campo, 36 caminos, 37 dirac) con lib común 57-qm-qinfo.js, y apéndices 97–99 + portada + publicación.
- 2026-10-31: caps 30 (densidad), 31 (entrelazamiento), 32 (medida) hechos; núcleo 57-qm-qinfo (matriz densidad/Lindblad/concurrencia/CHSH/negatividad/Mermin; eigh con Gram–Schmidt complejo). 4603 pruebas de biblioteca + 2228 cifras. Evitar ñ en nombres de sims (ids DOM). Siguiente: 33 abiertos (Lindblad), 34 info, 35 campo, 36 caminos, 37 Dirac, luego apéndices.
- 2026-10-31: cap 33 (abiertos: Lindblad, T1/T2, ecuaciones ópticas de Bloch, canales de Kraus/Choi) hecho; 4815 pruebas de biblioteca + 2321 cifras. Convención del qubit: |0⟩ fundamental (z = +1), σ₋ = |0⟩⟨1|. Referencia independiente: exponencial del superoperador (numpy/scipy). Siguiente: 34 info, 35 campo, 36 caminos, 37 Dirac, luego apéndices.
- 2026-10-31: cap 34 (info: puertas/no clonación, teletransporte, Grover, Shor, código de 3 qubits, BB84) hecho; núcleo 58-qm-qcomp (simulador de vector de estado, QFT, periodDist, teleport en matriz densidad, bitflip, bb84). 4994 pruebas de biblioteca + 2412 cifras. Siguiente: 35 campo (JC), 36 caminos, 37 Dirac, apéndices.
- 2026-10-31: cap 35 (campo: JC, vestidos, colapso/revival, Wigner del gato, Casimir) hecho; núcleo 59-qm-field. 5111 pruebas de biblioteca + 2478 cifras. problemas.py tarda ~60 s (limite 120): lanzar con timeout largo. En chk de problemas.py, si exp es str se exige redondeo exacto de la cifra impresa (tol se ignora); para aproximaciones usar float + tol. Siguiente: 36 caminos, 37 Dirac, apéndices.
- 2026-10-31: cap 36 (caminos: propagadores, Cornu, Trotter euclídeo, PIMC; Parte VIII 'Caminos de Feynman y mecánica relativista') hecho; núcleo 60-qm-path. 5312 pruebas de biblioteca + 2564 cifras. validar.js tarda ~75 s; problemas.py ~60 s. Siguiente: 37 Dirac (zitterbewegung 1D, Klein, hidrógeno de Dirac), luego apéndices 97/98/99 y portada.
- 2026-10-31: cap 37 (dirac: zitterbewegung, Klein, hidrogenoide, Landau) hecho; núcleo 61-qm-dirac. Capítulos 1–37 completos. Siguiente: apéndices 97/98/99 + portada (00-inicio) y validación final, publicar.
- 2026-10-31: curso COMPLETO: 37 capítulos + apéndices A (formulario), B (validación), C (bibliografía) + portada. 5486 pruebas superadas (≈2839 de biblioteca + 2647 cifras de problemas). Publicado como artefacto privado: https://claude.ai/artifact/USsdM2dEKgfRvUjhWapW5y (icono atom; republicar el mismo dist/mecanica-cuantica.html para actualizar).
