# Laboratorio virtual · Calibrador vernier y micrómetro

Práctica de metrología dimensional: medir piezas con calibrador vernier (pie de rey) y micrómetro, con la resolución real de cada instrumento y en unidades de longitud reales (mm, cm, m, µm, nm, in, ft, mil). Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Archivos

- `dist/Laboratorio_Metrologia.html`: archivo único para estudiantes (funciona sin conexión).
- `dist/metrologia-artefacto.html`: el mismo contenido para publicarlo como artefacto.
- `src/engine.js`: motor (unidades, lectura de vernier y micrómetro, error de cero, contacto y fuerza, piezas con conicidad/ovalidad, evaluación de lecturas con diagnóstico de errores, estadística e incertidumbre).
- `src/render.js`: dibujo a escala real de la escena y de las vistas de lectura (escala principal, nonio, manguito, tambor, lente).
- `src/app.js`: práctica, entrenador, cuaderno, teoría, panel docente.
- `test/engine.test.js`: 37 693 pruebas del motor.

```bash
node build.js
node test/engine.test.js
node tools/shot.js practica shots/p.png --jsfile test/sesion.js
```

## Qué la hace realista

| En el laboratorio | En la simulación |
|---|---|
| Resolución del instrumento | La lectura se cuantiza a 0,1 / 0,05 / 0,02 mm, 0,001 in (vernier); 0,01 mm, 0,001 mm con nonio, 0,001 in (micrómetro) |
| Error de cero | Cada banco (1–24) trae el suyo; hay que cerrar, leer y corregir |
| Fuerza de medición | Trinquete (fuerza fija 5–8,5 N, «clic») o tambor directo; el marco cede y los materiales blandos se aplastan |
| Piezas imperfectas | Conicidad, ovalidad y rugosidad: el diámetro cambia con el punto y el giro |
| Paralaje | Control de posición del ojo que desplaza la escala móvil |
| Unidades | Lecturas anotadas en cualquier unidad; el diagnóstico detecta factores de 10, 100, 1000 y 25,4 |

## Para el docente

Clave del panel docente: `calibre-unicauca` (pie de página → «Docente»). Muestra errores de cero, valores verdaderos, intervalos locales y compara los resultados del estudiante.
