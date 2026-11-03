# Física Moderna — plan de trabajo

Pedido 2026-10-31: «Crear un curso de física moderna. Con la misma rigurosidad de cursos anteriores. Debe tener todos los conceptos validados y soportados científicamente».
Arquitectura de ConCode/mcuantica (namespace EM, build.js, tools/shot.js, probe.js, MathJax, sims por capítulo). Acento teal #0B6E80 (oscuro #6FD3E3). Almacenamiento `fm:`.
Salida: `node build.js` → dist/fisica-moderna.html (artefacto), dist/index.html, dist/Fisica-Moderna.html.
Autor: Mg. Manuel Alejandro Obando — Depto. de Física, Universidad del Cauca.

## Estilo y contrato de cada capítulo (igual que mcuantica)
- `src/chapters/NN-id.html` (`<template class="chapter-src" data-id data-num data-title data-part data-short>`) + `NN-id.js` (sims con `EM.defineSim`).
- Estructura: `<p class="lead">`, secciones `<section><h2>`, ecuaciones `<div class="eq key" data-name>`, `<div class="sim" data-sim data-title>` + `<div class="sim-guide"><ul>` con cifras verificadas, cajas `box ex|note|def|warn|hist` (`box ex` = ejemplo RESUELTO), sección final «Problemas propuestos» con `<ol class="problems">`.
- **Todos los problemas llevan solución paso a paso**: `<details class="sol"><summary>Solución paso a paso</summary><ol class="steps"><li><b>Planteamiento.</b> …</li>…<li><b>Resultado.</b> <span class="ans">…</span></li></ol></details>`; `<span class="lvl">Básico|Intermedio|Avanzado</span>`.
- Macros MathJax: `\ket \bra \braket \mel \ev \comm \hb \op \Tr \dd \ii \ee \un{} \sen \pdv \odv`. Usar `\ee` (no `\e`).
- Escribir HTML con Write/Edit (no heredoc con LaTeX). Verificar cada cifra con python ANTES de escribirla.
- Núcleo sin DOM en `src/core/NN-fm-*.js` (EM.fm.*), probado en Node. K = EM.qm.K (CODATA 2018, en 33-qm-orig.js).
- Pruebas: `tests/refs/refNN.py` (SciPy, SymPy, mpmath, astropy, particle(PDG), periodictable → referencias.json), `tests/val/valNN.js` (biblioteca vs referencias; exporta function(ctx)), `tests/caps/capNN.py` (cifras de problemas, chk con STRING = redondeo exacto).
  Orden: `python tests/referencias.py` → `python tests/problemas.py` → `node tests/validar.js` → `node build.js`.
- Comprobar: `node tools/shot.js check [ids]`; `node tools/probe.js <cap> <sim> '[{"id":val}]'`.
- Validadores independientes instalados: astropy (cosmología, constantes), particle (PDG: masas, vidas medias), periodictable (masas isotópicas), scipy.constants (CODATA 2018), sympy, mpmath.

## Capítulos (id · título)
Parte I · Relatividad especial
1 etero · El problema del éter y los postulados de Einstein
2 lorentz · Transformaciones de Lorentz: tiempo, longitud y velocidades
3 minkowski · Espacio-tiempo, cuadrivectores y paradojas
4 dinamica · Momento, energía y E = mc²
5 doppler · Doppler, aberración, Cherenkov y campos en movimiento
6 general · Relatividad general: de la equivalencia a las ondas gravitacionales
Parte II · Cuantos de luz y de materia
7 cuerpo · Cuerpo negro y el cuanto de Planck
8 fotones · Fotoeléctrico, Compton, rayos X y pares
9 materia · Ondas de materia e incertidumbre
10 bohr · Átomo de Bohr, espectros, Franck–Hertz y Moseley
Parte III · Mecánica ondulatoria
11 schrod · Función de onda y ecuación de Schrödinger
12 tunel · Pozos finitos, barreras y efecto túnel
13 oscilador · Oscilador armónico cuántico
14 hidrogeno · Átomo de hidrógeno y orbitales
15 espin · Momento angular, espín y estructura fina
Parte IV · Átomos, luz y moléculas
16 atomos · Átomos multielectrónicos y tabla periódica
17 laser · Emisión estimulada y láser
18 moleculas · Moléculas: enlace, rotación y vibración
Parte V · Estadística cuántica y materia condensada
19 estadistica · Distribuciones cuánticas y calores específicos
20 solidos · Bandas, semiconductores y unión pn
21 macro · Superconductividad, superfluidez y condensados
Parte VI · Física nuclear
22 nucleo · El núcleo: tamaño, masa, ligadura y modelos
23 radiactividad · Radiactividad: alfa, beta y gamma
24 reacciones · Reacciones nucleares, fisión y fusión
Parte VII · Partículas, estrellas y cosmos
25 particulas · Partículas y el Modelo Estándar
26 aceleradores · Interacciones, aceleradores y detectores
27 estrellas · Estrellas, enanas blancas y estrellas de neutrones
28 cosmologia · Cosmología
Apéndices: 97 formulario · 98 validación · 99 bibliografía; portada 00-inicio.

## Estado
(actualizar tras cada capítulo)
- 2026-10-31: esqueleto creado desde mcuantica (build, tools, estilos, núcleo base: 00,10,20,30–36,40-view3d,41–43,90); pruebas modulares (validar.js carga tests/val/*, referencias.py carga tests/refs/*, problemas.py carga tests/caps/*). Instalados astropy, particle, periodictable. Sin capítulos aún.
- 2026-10-31: caps 1 (etero), 2 (lorentz), 3 (minkowski), 4 (dinamica) hechos; núcleo 50-fm-rel.js (EM.fm.rel: Michelson, reloj de luz, boosts, suma de velocidades, muones, Fizeau, gemelos, movimiento hiperbólico, cuadrimomento, umbrales, desintegraciones, Q). Referencias independientes: DOP853, brentq, mpmath, SymPy, particle (PDG 2020 ≈ 2022 a 0.1 % para W/H/top: la biblioteca usa PDG 2022), periodictable. Lecciones: bash heredocs con comillas/LaTeX fallan → escribir los .py con Write; `python tests/problemas.py capNN` prueba un capítulo; cuidado con `sed` que inserta \( dentro de matemáticas. Siguiente: cap 5 (doppler), 6 (general), luego Parte II.
- 2026-10-31: cap 5 (doppler: Doppler/aberración/faro/Cherenkov/campos y Purcell; validado con boosts explícitos, Liénard–Wiechert con tiempo retardado y ΛFΛᵀ) y cap 6 (general: GPS con W0, deflexión y precesión exactas vs integración DOP853 de geodésicas, ISCO, sombra EHT, Hawking vs astropy, chirp de LIGO vs Peters ODE) hechos: PARTE I COMPLETA (caps 1–6). Núcleo 51-fm-gr.js (EM.fm.gr). Siguiente: Parte II (7 cuerpo, 8 fotones, 9 materia, 10 bohr): reutilizar 33-qm-orig.js (planck, fotoeléctrico, Compton, Bohr, de Broglie; ya validado en mcuantica: copiar sus pruebas de ref a refs/ref07..10) y los sims de mcuantica/src/chapters/01-crisis.js; añadir Klein–Nishina, CMB/FIRAS, doble rendija con electrones, Franck–Hertz, Moseley.
- 2026-10-31: PARTE II COMPLETA: cap 7 (cuerpo: Planck ν/λ, gas de fotones, estrellas+color CIE vs colour-science, CMB), 8 (fotones: Klein–Nishina vs quad, borde Compton, Duane–Hunt/Kramers, Moseley vs xraydb, pares), 9 (materia: de Broglie, doble rendija Fraunhofer vs integral numérica, Monte Carlo partícula a partícula, paquete gaussiano vs FFT, estimación del H), 10 (bohr: Rutherford vs DOP853, Bohr de dos cuerpos, Franck–Hertz Monte Carlo, ajuste de Moseley). Núcleos: 52-fm-bb, 53-fm-photon, 54-fm-matter, 55-fm-atom (EM.fm.bb/ph/mat/atom). Instalado xraydb (líneas K, mu_elam). 682 pruebas de biblioteca + ~380 cifras de problemas hasta aquí. Los sims 'planck', 'fotoelectrico', 'compton', 'bohr', 'broglie' se copian con tools/mkNN.py desde mcuantica/src/chapters/01-crisis.js (marcadores de sección). Siguiente: Parte III (11 schrod, 12 tunel, 13 oscilador, 14 hidrogeno, 15 espin): sims nuevos con la API Plot, núcleo analítico validado con scipy (brentq, eval_hermite, genlaguerre, sympy.physics.hydrogen); se puede reutilizar 32-schrod1d (CN) y 41–43 (armónicos esféricos, hidrógeno).
- Procedimiento por capítulo (≈ 25 pasos): (1) núcleo JS + tests/refs/refNN.py + tests/val/valNN.js → `python tests/referencias.py && node tests/validar.js`; (2) sims JS; (3) HTML con Write; (4) tests/caps/capNN.py con chk de TODA cifra del texto (strings = redondeo exacto) → `python tests/problemas.py capNN`; (5) correcciones con tools/fixNN.py (Python con replace + assert, escrito con Write; los sed con `\(` no funcionan en este entorno: usar Edit); (6) `node build.js && node tools/shot.js check <id>` y capturas `shot.js shot <id> shots/x.png --sim <nombre>`.
- 2026-10-31: caps 11–15 hechos (schrod, tunel, oscilador, hidrogeno, espin; core 56–60) y cap 16 (atomos: 62-fm-at.js helio perturbación/variacional/HF radial en malla log vs Roothaan-STO, Madelung vs pymatgen/NIST, Hund vs microestados, Slater; 61-fm-ptdata.js datos NIST generados por tools/mk16.py). Validación: 1092 pruebas OK tras cap 16. Siguiente: 17 laser.
- 2026-10-31: cap 17 (laser: 63-fm-laser.js, Einstein/Doppler/umbral/balance vs DOP853/ABCD/TBP FFT) y cap 18 (moleculas: 64-fm-mol.js, H₂⁺ LCAO vs cuadratura 2D, Morse rovibración vs eigh_tridiagonal, Raman N₂) hechos; validación 1239 OK. Siguiente: 19 estadistica.
- 2026-10-31: cap 19 (estadistica: 65-fm-stat.js; FD/BE vs conteo directo, F_j vs mpmath polylog, μ(T) vs quad+brentq, Debye vs quad, γ vs tabla Kittel, T_c BEC) hecho; 1306 pruebas OK. Siguiente: 20 solidos.
- 2026-10-31: cap 20 (solidos: 66-fm-solid.js; Kronig–Penney vs ondas planas, Poisson–Boltzmann vs solve_bvp, diodo vs difusión numérica, Shockley–Queisser vs quad) hecho; 1375 pruebas OK. Siguiente: 21 macro (superconductividad/superfluidez/BEC/Josephson).
- 2026-10-31: cap 21 (macro: 67-fm-macro.js; gap BCS vs ecuación con corte, RCSJ vs DOP853, Fraunhofer vs quad, Landau vs minimize_scalar, BEC en trampa vs suma exacta) hecho; 1417 pruebas OK. PARTE V COMPLETA. Siguiente: Parte VI nuclear (22 nucleo, 23 radiactividad, 24 reacciones).
- 2026-10-31: cap 22 (nucleo: 68-fm-nucdata.js [tools/mk22.py, periodictable], 69-fm-nuc.js: B desde masas atómicas vs AME, SEMF por mínimos cuadrados vs lstsq, valle de estabilidad, Woods–Saxon+espín–órbita vs eigh_tridiagonal → números mágicos 2,8,20,28,50,82,126) hecho; 1491 pruebas OK. Siguiente: 23 radiactividad.
- 2026-11-02: cap 23 (radiactividad: 70-fm-decay.js; Bateman vs expm/DOP853, Gamow analítico vs quad + semividas α, Q desde masas vs literatura, espectro β con Fermi vs quad, datación) hecho; 1559 pruebas OK + 81 cifras de problemas. Siguiente: 24 reacciones.
- 2026-11-02: cap 24 (reacciones: 71-fm-react.js; Q desde masas, cinemática vs fsolve, pico de Gamow vs minimize_scalar, extinción de cadenas vs brentq+MC NumPy, cinética puntual vs Radau/inhour) hecho; PARTE VI COMPLETA; 1614 pruebas + 85 cifras. Siguiente: Parte VII (25 particulas, 26 aceleradores, 27 estrellas, 28 cosmologia), luego portada 00-inicio, 97/98/99 y publicar.
- 2026-11-02: cap 25 (particulas: 72-fm-pdg.js [tools/mk25.py, paquete particle], 73-fm-part.js: quarks vs PDG, conservación, cinemática vs fsolve, τμ, helicidad del π, Γ(Z)/Nν, σ_Z, oscilaciones vs expm, CKM/PMNS unitarias, GMO y Ω⁻) hecho; 1695 pruebas + 66 cifras. Siguiente: 26 aceleradores, 27 estrellas, 28 cosmologia.
- 2026-11-02: cap 26 (aceleradores: 74-fm-acc.js; ciclotrón vs DOP853, sincrotrón, luminosidad vs dblquad, Bethe–Bloch y rango vs NIST PSTAR/quad, σμμ vs quad, α(Q) vs solve_ivp) hecho; 1742 pruebas + 60 cifras. Siguiente: 27 estrellas, 28 cosmologia.
- 2026-11-02: cap 27 (estrellas: 75-fm-star.js; Lane–Emden vs DOP853, enana blanca (Chandrasekhar) y TOV con gas de neutrones vs DOP853, límite de Chandrasekhar 1.456, Sirius B, Eddington, supernova) hecho; 1794 pruebas + 77 cifras. Siguiente: cap 28 cosmologia (astropy) y portada/apéndices/publicación.
- 2026-11-02: cap 28 (cosmologia: 76-fm-cosmo.js; Friedmann/distancias/edad vs astropy.cosmology en 4 universos, Saha vs brentq, horizonte sonoro vs quad, Bessel/disco de Freeman vs scipy.special) hecho. PORTADA y apéndices 97/98/99 listos. Validación final: 4047 pruebas (1919 de biblioteca + 2128 cifras de problemas), 32 plantillas, 95 simulaciones, build 1909 KB. Falta: publicar el artefacto y registrar la URL en memoria.
