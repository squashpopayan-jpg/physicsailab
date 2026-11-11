# La fórmula por dentro — plan de trabajo

Pedido 2026-11-05: «un curso que muestre TODAS las deducciones —paso a paso— de las fórmulas de la física: de dónde vienen, cómo se hacen las operaciones matemáticas hasta la expresión final, acompañada de la variación de sus parámetros; en TODAS las áreas; usar toda la matemática que se requiera; rico en conocimiento, validado científica y bibliográficamente». Luego: «Continuar hasta terminar con el proyecto».
Arquitectura: la de ConCode/mcuantica (namespace EM, build.js, shot.js, MathJax). Acento ámbar #A8480A (oscuro #F3B261). Almacenamiento `ded:`. Salida: `node build.js` → dist/formula-por-dentro.html (artefacto), dist/index.html, dist/La-formula-por-dentro.html.

## Contrato de una deducción (src/chapters/NN-id.html, etiquetas expandidas por tools/expand.js)
```
<deriv id="id-unico" title="Título" tags="Área, Tema">
<goal>…</goal>
<given><g>principio/hipótesis</g>…</given>
<step op="Operación aplicada">\[…\]<why>por qué se permite</why></step>   (5–8 pasos)
<result name="Nombre">\[…\]</result>
<vars><v s="L" n="longitud" u="m"/> … (u: "kg m^2 s^-2", "1", "rad", "Pa s", "W", "Hz", "N", "K")</vars>
<effects><e>qué pasa si se duplica… con cifras verificadas</e></effects>
<limits><l>dimensiones y límites conocidos</l></limits>
<explore sim="id-explorador" title="…"/>
<div class="sim-guide"><ul><li>cifras verificadas…</li></ul></div>
</deriv>
```
- Cada `<deriv>` es una sección (entra en el índice) y se numera D{cap}.{k}. Entre derivaciones puede haber `<section><h2>` de teoría; al final `<section><h2>Fuentes y lecturas</h2><ul class="refs">` (solo fuentes que se conozcan con certeza).
- Explorador: `EM.formula('id', {gx, params, outs, reads, draw})` en NN-id.js (src/core/32-formula.js). f recibe los parámetros en las unidades MOSTRADAS. `angle:true` en parámetros angulares; `fixed:true` los excluye de la tabla de sensibilidad; `gx` = clave del eje horizontal inicial. Utilidades: EM.lgamma, EM.erf/erfc, EM.M.ellipKE. Dibujo propio: spec.draw (ver proyectil, cap. 5).
- HTML con Write/Edit (NO heredocs de bash/python con tildes o LaTeX: se corrompen). Evitar `\\[2pt]` en LaTeX. Números verificados con SymPy ANTES de escribirlos; luego `num(...)` con la cifra impresa.

## Verificación (tests/)
`python tests/verificar.py [capNN…]` ejecuta `node tests/jsdump.js` (muestras aleatorias de cada EM.formula) y cada `tests/caps/capNN.py` (namespace de tests/dlib.py) → tests/resultados.json (build.js lo usa para insignias y apéndice B). Caché por capítulo en tests/cache (se invalida si cambian el test, el HTML/JS del capítulo, 32-formula.js, dlib.py o jsdump.js).
Por cada deducción son OBLIGATORIAS (coverage() lo exige): ≥1 comprobación de pasos (`chain, ident, solves, ode, dsolve_is, integral, deriv_is, series_is, buckingham`), ≥1 `dimcheck(deriv, nombre, lhs, rhs, {sym:'unidad'})` (las unidades deben estar en la tabla `<v>`; admite Derivative/Integral/Abs/funciones indefinidas) y fsim (por cada salida de cada EM.formula) o `fsim_py` (referencia independiente con mpmath/SciPy). El explorador con id distinto de la deducción: wrapper `fs` con dict EX (ver cap03–cap08).
Cifras del texto: `num(deriv, nombre, valor, 'cifra impresa')` (string = redondeo exacto; float+tol). Símbolos de fsim: mismos nombres que las claves de parámetros; conv(p) convierte (grados→rad).

## Temario (42 capítulos; ~5 deducciones cada uno)
I Herramientas: 1 dimensional ✔ · 2 aproximaciones ✔ · 3 vectores ✔ · 4 edo ✔
II Mecánica: 5 cinemática ✔ · 6 dinámica ✔ · 7 energía y choques ✔ · 8 oscilaciones ✔ · 9 gravitación y órbitas ✔ · 10 cuerpo rígido ✔ · 11 mecánica analítica ✔ · 12 no inerciales y elasticidad ✔
III Ondas y fluidos: 13 ondas y sonido · 14 hidrostática y capilaridad · 15 hidrodinámica
IV Térmica: 16 termodinámica · 17 teoría cinética · 18 mecánica estadística · 19 calor y difusión
V Electromagnetismo: 20 electrostática · 21 circuitos · 22 magnetostática e inducción · 23 Maxwell, ondas EM y radiación · 24 materia (dieléctricos, plasmas)
VI Óptica: 25 geométrica · 26 ondulatoria
VII Relatividad: 27 especial · 28 general
VIII Cuántica: 29 orígenes · 30 Schrödinger 1D ✔ · 31 átomo ✔ · 32 aproximaciones ✔ · 33 moléculas y espectros ✔
IX Materia condensada: 34 sólidos ✔ · 35 semiconductores y superconductividad ✔
X Núcleos y partículas: 36 nuclear ✔ · 37 partículas ✔
XI Astrofísica y cosmología: 38 estrellas ✔ · 39 cosmología ✔
XII Complejos y aplicados: 40 caos y no lineal ✔ · 41 biofísica ✔ · 42 geofísica y plasmas ✔
Apéndices (automáticos en build.js): A formulario (resultados de todas las deducciones), B validación, C bibliografía (unión de «Fuentes»).

## Estado (actualizar tras cada capítulo)
- 2026-11-10: CURSO COMPLETO: 42 capítulos (las 12 partes), apéndices A (formulario), B (validación) y C (bibliografía) generados por tools/apendices.js; 218 simulaciones, 8836 pruebas, 1.8 MB. Publicado (privado): https://claude.ai/artifact/9jS5KSqDCKcVgNsf2xc8Te (icono formula); para actualizar: `node build.js` y republicar dist/formula-por-dentro.html con la misma ruta.
- Flujo por capítulo: calcular cifras con Python → escribir NN.js (exploradores), NN.html, tests/caps/capNN.py → `node build.js` → `python tests/verificar.py capNN` → corregir → `node tools/shot.js check id` → actualizar este Estado.
- Pendiente: nada (mantenimiento: `python tests/verificar.py` completo ANTES de `node build.js`, porque una ejecución parcial deja tests/resultados.json con un solo capítulo).
