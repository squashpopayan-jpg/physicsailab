# Dispositivos activos y pasivos — curso con taller de circuitos

Pedido 2026-11-04: «Crear un curso de dispositivos activos y pasivos completo, buscando los referentes bibliográficos actualizados, mostrando simulación y funcionamiento de los dispositivos con todo el contenido necesario y con la opción de crear circuitos, usar instrumentos de medida e incorporar proyectos para implementar en el laboratorio. Tener la opción de agregar elementos a los circuitos y simular cortocircuitos. El contenido debe ser completo y extenso en teoría para entender. Basarse en cursos anteriores.»

Base: copia de ConCode/arduino (namespace `EM`, shell.html, styles.css, 00-base, 10-ui [Sim], 20-plot, 90-app, build.js, tools/shot.js). Acento azul-petróleo #0B6E8A (oscuro #5CC8E0). Autor: Mg. Manuel Alejandro Obando — Depto. de Física, Universidad del Cauca. Público universitario (Física/Ingeniería), español.

## Motor (núcleo sin DOM, probado en Node) — HECHO
- `30-spice.js` MNA: R, V (rs), I, C (cvar), L (emf, saturación `lsat`), SW, D (Shockley+ruptura, temperatura), Q (Ebers–Moll+Early), M (MOSFET/JFET cuadrático N/P), OA (A0, polo, SR, rieles, colector abierto), X (transformador n devanados), E, G, REG (regulador, modos cv/cc/off), DX (optoacoplador). DC con gmin/source stepping, transitorio trap/BE, eventos (`hooks`).
- `31-spice-ac.js` `ac(f)`, `acSweep`, `dcSweep`, `S.tran`, `S.fft`.
- `32-models.js` EM.spice.MOD: diodos, LED, Zener, BJT, MOSFET, JFET, A.O., reguladores, condensadores/inductores reales.
- `33-parts.js` catálogo EM.parts (≈55 tipos con pines, props, build, rate/fail). `34-net.js` EM.Net: redes por unión–búsqueda, build, tieFloating, medición, calor/daños (`accumulate`/`tick`), `Net.fromSpec` (DSL de circuitos: partes [id,tipo,x,y,rot,props] y cables ['R1.1','C1.0'], ['R2.1','gnd'], ['Q1.0','@vcc:u']).
- Pruebas: tests/smoke.js (motor), tests/net-smoke.js (Net), dbg*.js (depuración). ¡Cuidado con cables que pasan por pines ajenos (se unen)!

## Pendiente
1. Símbolos y dibujo (35-symbols), editor Taller (36-taller: paleta, cables, propiedades, instrumentos, osciloscopio, Bode, barrido DC, falla/cortocircuito, deshacer, guardar), paneles.
2. Capítulos (ver temario), sims de física (bandas, unión PN, curvas), proyectos de laboratorio.
3. Pruebas de cifras (tests/caps), validación contra SciPy, bibliografía, build, artefacto.

## Temario (≈31 caps)
I Fundamentos: 1 circuitos y leyes · 2 el Taller (instrumentos) · 3 señales, fasores, Bode.
II Pasivos: 4 resistores · 5 condensadores · 6 inductores · 7 transformadores · 8 RC/RL/RLC · 9 filtros pasivos · 10 sensores, protecciones, electromecánicos.
III Diodos: 11 semiconductores · 12 unión PN · 13 modelos de diodo · 14 rectificación y aplicaciones · 15 Zener, LED, fotodiodo, solar.
IV Transistores: 16 BJT · 17 polarización y conmutación · 18 amplificadores BJT · 19 MOSFET · 20 JFET y amplificadores FET · 21 potencia, disipación y conmutadas.
V Integrados: 22 A.O. · 23 aplicaciones lineales y filtros activos · 24 comparadores y osciladores (555) · 25 reguladores y fuentes · 26 tiristores y optoacopladores.
VI Laboratorio: 27 instrumentación y medición · 28 cortocircuitos, fallas y protección · 29 proyectos (≈10) · 30 taller libre y retos. Apéndices: formulario, modelos, validación, bibliografía.

Bibliografía verificada (2026-11-04): Sedra/Smith/Carusone/Gaudet Microelectronic Circuits 8.ª (OUP 2020); Razavi Fundamentals of Microelectronics 3.ª (Wiley 2021); Horowitz & Hill The Art of Electronics 3.ª (CUP 2015); Boylestad & Nashelsky EDCT 11.ª (Pearson 2013/14); Malvino & Bates Electronic Principles 8.ª (McGraw-Hill 2015/16); Hambley Electrical Engineering 7.ª (Pearson 2021); Alexander & Sadiku Fundamentals of Electric Circuits 7.ª (McGraw-Hill 2021); Rashid Power Electronics 4.ª (Pearson 2018/2023); Sze, Li & Ng Physics of Semiconductor Devices 4.ª (Wiley 2021); Streetman & Banerjee Solid State Electronic Devices 7.ª (Pearson 2015). Otros (sin verificar edición en línea): Neamen, Floyd, Mohan–Undeland–Robbins, Jaeger–Blalock, Nilsson–Riedel, Hayt. Normas: IEC 60063 (series E), IEC 60062 (código de colores).

## Taller (editor) — HECHO (2026-11-04)
`35-symbols.js` (símbolos ANSI + caras de instrumentos), `36-panels.js` (osciloscopio Y–T/X–Y/FFT, Bode con refinamiento −3 dB y `cfg.bodeRef`, curvas por barrido con familias, tabla), `37-taller.js` (EM.Taller.mount(sim,cfg): edición completa/‘values’/‘none’, cables, propiedades, fallas, cortocircuito, daños, humo, corrientes animadas, metas `goals`, `watch`→`T.pw/T.irms`, `T.set/v/vd/i/m/stat/dmm`), `38-cx.js` (`EM.cx.ladder`: fuente a la izquierda, serie en riel y=6, derivación a y=10; `tap` pone etiqueta de nodo). Pruebas: `node tests/lint.js [filtro]` (pines sueltos, DC) · `node tools/shot.js check <id>` · `node tools/shot.js shot <id> out.png --sim <nombre>` · `tools/tl-test.js` (ratón real).
Convenciones: ids de partes en specs NO deben ser 'G1…'/'N1…' si hay gnd/@ automáticos (ahora usan '_g'/'_n'); instrumentos con pines enteros; los cables que pasan por pines ajenos los unen (¡revisar con lint y capturas!). `startZero:false` por defecto (amplificadores arrancan en régimen); usar `startZero:true` para cargas/transitorios.

## Estado
- 2026-11-04 (madrugada): caps 1–15 completos (Partes I, II y III), 70 sims. Herramientas: tests/measure.js <sim> <tmax> <dt> <etiquetas> [R1.r=..] [--op|--ac f0,f1,n,lab|--zero] (números para el texto), T.setSweep, probes con `ref` (diferenciales), FG 'am', T.ipk(id). Falta: Partes IV (16–21), V (22–26), VI (27–31), portada real, apéndices, validación, bibliografía, quitar 98-prueba, publicar.
- 2026-11-04 (noche): caps 1–9 completos (circuitos, taller, señales, resistores, condensadores, inductores, transformadores, transitorios, filtros), 44 sims. Herramientas nuevas: tools/err.js <cap> (trazas), T.setBode(f0,f1), T.loadSpec(spec), ladder item mode:'buf'. Pendiente: 10 (sensores/protecciones) y partes III–VI.
- 2026-11-04 (tarde): caps 1 (circuitos) y 2 (taller) completos con sims. Siguiente: cap 3 señales/fasores/Bode, luego pasivos (4–10), etc. Quitar 98-prueba al final.
- 2026-11-04: motor + catálogo + Net probados (rectificador+7805, 555 T=66,4 ms vs 65,8, EC BJT, LED, RC). Siguiente: símbolos y editor.
- 2026-11-05: CURSO COMPLETO. 30 capítulos + portada + 3 apéndices (A formulario, B validación con 60 pruebas contra NumPy/SciPy/SymPy/analítico/problemas, C bibliografía), 128 simulaciones. Partes IV (16–21), V (22–26: A.O., aplicaciones/filtros, osciladores/555, reguladores, tiristores/opto) y VI (27–30: instrumentación/Monte Carlo, fallas y protección, proyectos, taller libre con 4 retos con metas verificables). Cambios de motor en esta fase: re-solución DC al variar Tj en circuitos estáticos (`net.tchg`), recorte del estado interno del A.O. a los rieles (sin «enrollado»), continuación en A₀ en `solveDC`, REG con rja/rjc (65 K/W sin disipador), SCR dispara con V_AK>0.5 y se mantiene mientras haya corriente de puerta, fototransistor del opto con saturación (tanh). Constructores `CX.amp/bias/swb/ce` (BJT/MOSFET/JFET). Diseños con etiquetas: `['U1.0','@n:l']` y etiquetas iguales unidas.
  Herramientas: `node build.js` · `node tests/lint.js [f]` · `node tools/err.js <id>` · `node tools/shot.js check|shot` · `python tests/referencias.py` + `node tests/validar.js` (→ tests/resultados.json, lo lee build.js).

## Revisión 2026-11-05 (fórmulas y botón Cortocircuito)
- Causa de «Math input error»: (1) un `\approx` perdió la barra (carácter de control \x07) en cap. 12; (2) 23 fórmulas con `<` pegado a una letra (`V_{GS}<V_{th}`) que el HTML tomaba como etiqueta. Corregido (`&lt;`). Herramienta: `python tools/lt-fix.py [--apply]`.
- Detector fiable: `node tools/mathcheck.js [ids]` (busca merror/data-mjx-error, controles, delimitadores crudos y lecturas NaN/undefined en sims). `tools/shot.js check` ya usa también ese marcador.
- Botón Cortocircuito: ahora muestra instrucción en pantalla (paso 1/2, 2/2) y marca terminales; prueba `node tools/short-test.js`.
- Cifra corregida: pendiente a 10 µA ≈ −2.7 mV/K (`tests/vd-temp.js`).
