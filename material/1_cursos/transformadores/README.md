# Laboratorio de Transformadores (v2)

Versión revisada y ampliada del laboratorio `Transformadores_Laboratorio.html` (v1). Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Archivos

- `dist/Transformadores_Laboratorio.html`: archivo único para estudiantes. Funciona sin conexión (sin internet usa fuentes del sistema). Desde aquí sí se puede imprimir la guía.
- `dist/transformadores-artefacto.html`: el mismo contenido, preparado para publicarlo como artefacto.
- `src/`: fuentes. `engine.js` (física), `bench.js` (banco), `app.js` (cuaderno, análisis, exposición), `shell.html`, `styles.css`, `slides.css`.

```bash
node build.js
node test/engine.test.js
```

## Qué cambió frente a la v1

| v1 | v2 |
|---|---|
| Circuito ya conectado; solo se mueven deslizadores | Banco con cableado libre: fuente, transformador desmontable, carga, shunt, 3 multímetros, analizador de potencia y osciloscopio |
| Lecturas exactas, sin ruido | Lecturas con autorrango, resolución de 6000 cuentas, exactitud ±(% + dígitos), calibración propia de cada instrumento y deriva de la red |
| Espiras de 100 a 1000 en pasos de 50 | Juego de bobinas reales (100, 250, 500, 1000 y una X sin rótulo); yugo apretado, flojo o retirado |
| R, Lσ, Rc y Lm fijos aunque cambien las espiras | Parámetros físicos: R y L dependen de N, reluctancia del núcleo y del entrehierro, pérdidas de Steinmetz, saturación con armónicos |
| Sin consecuencias de errores | Fusibles de la fuente y de los multímetros, calentamiento de bobinas y resistencias, tensión peligrosa > 50 V, lazos de tierra del osciloscopio; todo queda en la bitácora |
| Ensayos A, B, C | Ensayos R (resistencia de devanados), A, B (vacío), C (cortocircuito), D (carga), E (polaridad) |
| Sin preinforme | Preinforme autocalificado de 8 preguntas |
| Análisis básico | Ajuste por mínimos cuadrados con incertidumbre, N de la bobina X, R_c y X_m, R_eq y X_eq, predicción del circuito equivalente frente a la medición |
| `confirm()` para borrar datos (bloqueado en algunos navegadores integrados) | Confirmaciones dentro de la página |
| Sin exposición | Diapositivas generadas con los datos del grupo, notas del expositor, rúbrica y descarga en HTML |

## Para el docente

- Asigne un **número de banco** (1–24) por grupo. Cada banco tiene una bobina X distinta, tolerancias y calibraciones propias, así que los datos no se pueden copiar entre grupos.
- La tabla de soluciones por banco está en Guía → «Para el docente». Clave: `faraday-unicauca`.
- Para que el kit coincida con el equipo de su laboratorio, edite el objeto `KIT` al inicio de `src/engine.js` y recompile.
- El tiempo térmico está acelerado (una bobina sobrecargada se calienta en uno o dos minutos).
