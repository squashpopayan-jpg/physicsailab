# Tejiendo el PEC

Curso ilustrado y de letra grande sobre la **Cartilla del Proceso Educativo Comunitario (PEC) del Resguardo Nasa de Novirao** (Totoró, Cauca). Elaborado por Mg. Manuel Alejandro Obando, Departamento de Física, Universidad del Cauca.

## Estructura

| Parte | Lecciones | Cierre |
|---|---|---|
| I · Quiénes somos y qué es el PEC | 1 ¿Qué es el PEC? · 2 Novirao, la Casa grande | Quiz de 10 preguntas |
| II · La historia: la tierra y la escuela | 3 La lucha por la tierra · 4 La historia de la escuela | Quiz de 10 preguntas |
| III · Tejidos, hilos y semillas | 5 Los dos tejidos · 6 Los cinco hilos dinamizadores · 7 Prácticas, vivencias y la semilla | Quiz de 10 preguntas |
| IV · Vivir el PEC en la escuela | 8 La pedagogía como camino · 9 Resignificar el tiempo escolar · 10 Armonizar la estructura · 11 Unificar la planeación | Quiz de 10 preguntas |
| Para terminar | Examen final: 40 preguntas (10 por parte) | |
| Apéndices | A Glosario · B El curso en una página | |

Además, **47 pausas de repaso** (una pregunta con retroalimentación dentro de cada lección).
Todas las preguntas son de selección múltiple con 4 opciones; el orden de las opciones se baraja en cada intento.

## Letra grande y navegación

- Letra base de 22 px (botones **A−** y **A+** para pasar de 18 a 32 px, se recuerda entre visitas).
- Fuente Atkinson Hyperlegible (diseñada para legibilidad) y títulos Baloo 2.
- Índice lateral (en el celular, botón «Índice»), buscador, botones grandes «Anterior/Siguiente», teclado en los quizzes (A–D, Enter).
- Tema claro, oscuro o automático. Sin dependencias de JavaScript externo.

## Quiz y examen

- Quiz: una pregunta por pantalla, respuesta correcta y explicación al instante, enlace a la lección que conviene repasar, nota final, y opción de repetir o de practicar solo las falladas.
- Examen: se puede cambiar la respuesta y saltar entre preguntas; las respuestas se revelan al final, con nota por parte y lecciones para repasar.
- Se guardan en el navegador las lecciones leídas y la mejor nota de cada prueba.

## Construcción

```bash
node build.js        # compila src/ → dist/index.html (completo) y dist/tejiendo-pec.html (fragmento para Artifact)
node serve.js 8791   # servidor local de prueba
```

- `src/chapters/*.html`: una plantilla por lección (`<template class="chapter-src" …>`).
- `src/data/*.js`: banco de preguntas (pausas, quizzes, examen).
- `src/core/app.js`: interfaz, quizzes y examen. `src/core/figs.js`: figuras generadas (espiral, intra/interculturalidad, tejido de los hilos).
- `src/img/*.jpg`: ilustraciones recortadas de las fotografías de la cartilla (`tests/recortes.py`).
- `docs/fuentes/`: fotografías de las 19 hojas del PDF y su transcripción (`transcripcion.md`, `transcripcion2.md`).

`build.js` valida: etiquetas balanceadas, ids de lección, imágenes, que cada pausa y cada quiz tengan su banco, que cada pregunta tenga 4 opciones distintas, explicación y lección de repaso válida, y que la respuesta correcta no sea mucho más larga que las demás.
