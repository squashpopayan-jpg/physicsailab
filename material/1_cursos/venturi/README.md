# Laboratorio virtual · Tubo de Venturi

Banco hidráulico virtual para la práctica «Tubo de Venturi: principio de Bernoulli y ecuación de continuidad» (Física de Fluidos). Sigue la guía `Guia_venturi_ManuelObando.pdf`: tomas A–H, rotámetro a la salida, válvula de regulación, purga de 2 minutos, tablas 2, 3 y 4. Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Archivos

- `dist/Laboratorio_Venturi.html`: archivo único para estudiantes. Funciona sin conexión (sin internet usa fuentes del sistema).
- `dist/venturi-artefacto.html`: el mismo contenido, preparado para publicarlo como artefacto.
- `src/engine.js`: física (agua, bomba y válvula, perfil de presiones, Cd(Re), rotámetro, burbujas, fuga, tanque). El objeto `EQUIPO` al inicio describe el equipo.
- `src/bench.js`: dibujo del banco, lupas con paralaje, mandos, cronómetro y bitácora.
- `src/app.js`: cuaderno (tablas de la guía), registro rápido, exportación CSV/JSON, lista de pasos y panel del docente.
- `test/engine.test.js`: 384 pruebas. `test/referencias.py` genera `test/referencias.json` con CoolProp y fluids.

```bash
node build.js
node test/engine.test.js
python test/referencias.py
node tools/shot.js banco shots/banco.png --jsfile test/sesion.js
```

## Qué hace real a la práctica

| En el laboratorio | En el banco virtual |
|---|---|
| Hay que leer cada columna | No se muestra ningún valor numérico: se lee la escala en una lupa, en el fondo del menisco |
| Paralaje | La escala está detrás del tubo; si el menisco no queda a la altura del ojo la lectura se corre |
| Columnas que oscilan | Turbulencia proporcional a la altura dinámica de cada toma y pulsación de la bomba |
| Esperar a que se estabilice | Columnas con dinámica de segundo orden: tardan 10–25 s en asentarse tras mover la válvula |
| Burbujas en las mangueras | 2 a 4 mangueras con aire al empezar; se van con caudal alto (purga) o con golpecitos |
| Fugas | La mitad de los bancos gotea en la unión entre el Venturi y el rotámetro hasta que se aprieta |
| Rotámetro clase 2,5 | Error propio de cada banco dentro de la clase VDI/VDE 3513 y flotador que baila |
| Agua que se calienta | Temperatura inicial distinta por banco y +0,8 °C/h con la bomba en marcha |
| Cd < 1 | Cd(Re) de 0,92 a 0,97, pérdida permanente del 15 al 30 % de Δh |

El tanque volumétrico con cronómetro permite, como extensión, calibrar el rotámetro.

## Para el docente

- Asigne un número de banco (1–24) por grupo. Cada banco tiene temperatura, error de rotámetro, capilaridad, burbujas y fuga propios.
- Guía → «Para el docente» muestra la tabla de referencia por banco y las lecturas que debería obtener un grupo cuidadoso. Clave: `bernoulli-unicauca`.
- El cuaderno se guarda en el navegador del estudiante. El CSV exportado trae las tablas y la bitácora con la hora de cada acción (purga, fuga, mediciones).
- Para que el banco coincida con el equipo del laboratorio, edite `EQUIPO` en `src/engine.js` y recompile.
