# Protoboard — laboratorio de simulación

Pedido 2026-11-11: «Crear un curso a manera de simulación, recopilando lo ya visto en otros cursos, que tenga que ver con la protoboard, que sea real, que se puedan mover los cables, que aparezcan dispositivos electrónicos, que se puedan medir, que se vean las señales, que se comporte de forma real (se pueden quemar los elementos). Laboratorio de simulación con protoboard. Incluir proyectos para realizar en casa.»

Autor: Mg. Manuel Alejandro Obando — Depto. de Física, Universidad del Cauca. Acento verde #1B7A4B (oscuro #5BD18C).
Salida: `node build.js` → `dist/index.html`, `dist/protoboard.html` (fragmento para artefacto), `dist/Protoboard-Laboratorio.html`.

## Arquitectura (src/core, núcleo sin DOM)
- 30–34 motor SPICE y catálogo (copiados de ConCode/dispositivos): MNA, transitorio, modelos, EM.Net con calor y daños. Parches propios: CC de la fuente (I muerta), A.O. de colector abierto suavizado + corriente de salida por V−, apagado térmico del regulador por reconstrucción, `pavg` desde 0, capacidad térmica `cth` por pieza, falla «abierta» sin elementos.
- 35 `labparts`: PSUC (canal de fuente), FGB, DMMB (tomas VΩ/mA/10 A y fusibles 0,2 A/10 A), SCOPEB (punta ×1/×10), ACT (secundario aislado 12 V~ 60 Hz), BTN4, LM358/LM393, BATP, BUZA, SEG7; capacitancias parásitas de relé y motor.
- 36 `bb`: geometría de protoboard (mini/media/completa), huellas (TO-92, TO-220, DIP, relé, 7 segmentos), catálogo `TYPES`, bandeja `TRAY`.
- 37 `bench`: escena (placas, piezas, cables, puntas), conectividad por tiras, BenchNet, instrumentos, daños, lectura del multímetro, tiempo real con presupuesto de CPU.
- 38 `specs`: ayudas para escribir circuitos (rieles, fuente de 5 V).
- 40/41/43 dibujo realista y efectos; 42 instrumentos (fuente, transformador, generador, multímetro, osciloscopio); 45 `lab` (editor).

## Capítulos (22 + 3 apéndices, 62 simulaciones)
I El banco: 1 banco · 2 fuente y multímetro · 3 generador y osciloscopio · 4 por qué se queman las cosas
II Pasivos: 5 resistores · 6 divisores y sensores · 7 condensadores y RC · 8 inductores y relés
III Diodos: 9 diodos y LED · 10 rectificación y fuente
IV Transistores: 11 BJT interruptor · 12 amplificador · 13 MOSFET y motores
V Integrados: 14 A.O. · 15 comparadores · 16 555 · 17 reguladores
VI: 18 diagnóstico · 19–21 proyectos en casa (9) · 22 taller libre y retos
Apéndices: A formulario y patillas · B validación · C bibliografía y seguridad

## Procedimiento
Spec del circuito en `src/chapters/NN-id.js` (`EM.Lab.mount(sim,cfg)`), texto en `NN-id.html`. Verificar: `node tests/run.js [filtro]` (metas y lecturas sin navegador), `node tests/validar.js` (→ `tests/resultados.json`, lo lee build.js), `node build.js`, `node tools/shot.js check`, `tools/drive.js` (ratón real), `tools/q.js` (código en una sim + captura).

## Estado
- 2026-11-11: CURSO COMPLETO y verificado en navegador (sin errores en 26 plantillas). Validación en `tests/validar.js`.
