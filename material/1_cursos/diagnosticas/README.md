# Pruebas diagnósticas para colegios y universidades

Sitio independiente (Firebase) para vender y aplicar pruebas diagnósticas de 50 preguntas de selección
múltiple con figuras y sin calculadora. La institución envía la lista de estudiantes; cada uno recibe un código;
el docente aplica la prueba en sala y la sigue en vivo; al cerrar se publican el diagnóstico individual y el
informe institucional (estadísticas, prioridades por tema, errores conceptuales, ranking y análisis de ítems).

Autor académico: Mg. Manuel Alejandro Obando, Departamento de Física, Universidad del Cauca.

## Estado

| Prueba | Estado |
|---|---|
| Física fundamental | **Lista** — 50 preguntas, 41 con figura, 10 temas, 58 errores conceptuales asociados a distractores |
| Matemáticas para la universidad | **Lista** — 50 preguntas, 27 con figura, 10 temas, 59 errores conceptuales; las 50 respuestas verificadas de forma independiente |
| Cálculo I | **Lista** — 50 preguntas, 20 con figura, 10 temas, 44 errores conceptuales; las 50 respuestas verificadas (derivadas e integrales numéricas, y la misma función de cada figura) |
| Cálculo II | **Lista** — 50 preguntas, 16 con figura, 10 temas, 38 errores conceptuales; las 50 respuestas verificadas (antiderivadas derivando, impropias y series numéricamente, fracciones parciales por ajuste) |
| Cálculo III | **Lista** — 50 preguntas, 14 con figura (vectores y superficies en 3D, curvas de nivel, campos vectoriales), 10 temas, 38 errores conceptuales; las 50 respuestas verificadas (integrales múltiples en cartesianas para validar las de polares y esféricas) |
| Álgebra lineal | **Lista** — 50 preguntas, 13 con figura (rectas, vectores, imagen del cuadrado unitario) y matrices en los enunciados, 10 temas, 37 errores conceptuales; las 50 respuestas verificadas con rutinas propias (eliminación, raíces de det(A − λI), proyecciones por minimización) |
| Mecánica | **Lista** — 50 preguntas, 19 con figura (Atwood, rizo, viga, llave, letrero, rodadura…), 10 temas, 48 errores conceptuales; las 50 respuestas verificadas, casi todas simulando el movimiento paso a paso |
| Electromagnetismo | **Lista** — 50 preguntas, 13 con figura (cargas, superficies gaussianas, circuitos, campo B, imán y bobina, transformador), 10 temas, 43 errores conceptuales; las 50 respuestas verificadas por integración numérica (flujos, Biot–Savart, circuitos RC/RL/LC, órbita del protón) |
| Vibraciones y ondas | **Lista** — 50 preguntas, 15 con figura (resortes, péndulos acoplados, pulsos, estacionarias, tubo, Doppler, Mach), 10 temas, 39 errores conceptuales; las 50 respuestas verificadas simulando osciladores, cuerdas y frentes de onda |

## Páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | instituciones | Presentación comercial, catálogo, ejemplo de informe y de diagnóstico |
| `prueba.html` | estudiantes | Ingreso con código, confirmación de identidad y datos, prueba con reloj y guardado automático |
| `panel.html` | docente | Bancos, aplicaciones, estudiantes y códigos, control en vivo, resultados y publicación |
| `resultado.html` | estudiantes e instituciones | Diagnóstico individual (código + identificación) e informe institucional (enlace privado) |
| `privacidad.html` | todos | Plantilla de política de datos (Ley 1581 de 2012) — **revisar con abogado** |

## Seguridad (lo que está garantizado por las reglas de la base de datos)

- Las preguntas y la clave **no están en el sitio web**: el banco compilado (`dist/bancos/*.json`) se carga
  desde el panel y queda con acceso solo de docente. Nunca subas `dist/bancos` al hosting.
- El estudiante solo ve las preguntas de su aplicación, y solo después de activar su código.
- Un código funciona en **un solo dispositivo**; el docente puede liberarlo si el estudiante cambia de equipo.
- No se puede responder antes de abrir, en pausa, con la prueba cerrada, después de entregar ni con el tiempo vencido
  (el servidor revisa la hora, con 2 minutos de gracia y el tiempo extra individual).
- Nadie puede listar códigos, informes ni diagnósticos; un diagnóstico se abre solo con código + identificación.
- Cada estudiante ve las preguntas y las opciones en un orden distinto (también en las preguntas numéricas, para que la
  correcta no quede casi siempre en el medio); el panel registra cada salida de la pestaña.

## Uso local (emuladores, sin tocar ninguna base real)

```bash
npm install
npm run dev          # compila, arranca emuladores y siembra: http://127.0.0.1:5055
npm run simular      # (otra terminal) 29 estudiantes simulados contra la aplicación más reciente
npm test             # bancos (982) + análisis (22) + reglas de seguridad (42)
```

Cuenta de docente local: la que crea `tools/semilla.js` (solo existe en el emulador).
`node tools/preparar-demo.js --abrir` crea una aplicación con 30 estudiantes ya abierta.

## Publicar en internet (una vez)

1. Crea un proyecto en <https://console.firebase.google.com> (plan Spark gratis para empezar).
2. **Authentication** → habilita *Correo/contraseña* y *Anónimo*. Crea tu usuario de docente y copia su UID.
3. **Realtime Database** → crea la base. En *Datos* agrega `admins/<TU_UID> = true`.
4. Configuración del proyecto → Tus apps → Web: copia la configuración a `src/app/config.js`
   (y llena `contacto`, `urlSitio`).
5. `npx firebase login`, `npx firebase use --add` (elige el proyecto) y `npm run desplegar`
   (sube el sitio y las reglas de seguridad).
6. Entra a `/panel.html`, ve a *Bancos de pruebas* y carga cada uno de los nueve archivos de `dist/bancos/`.
7. Opcional: dominio propio (p. ej. `pruebas.tudominio.com`) en Hosting → Agregar dominio, y un enlace desde tu página actual.

**Capacidad:** el plan gratis de Realtime Database admite **100 conexiones simultáneas**. Para grupos más grandes
en la misma hora, pasa al plan Blaze (pago por uso; una aplicación de 300 estudiantes cuesta centavos de dólar).

## Aplicar una prueba

1. *Nueva aplicación*: institución, grupo, prueba, duración, fecha.
2. *Estudiantes y códigos*: pega desde Excel (nombre · identificación · correo). El panel rechaza correos
   inválidos, identificaciones o correos repetidos y filas incompletas.
3. *Descargar CSV para correos* → combinación de correspondencia en Gmail/Outlook/Word. *Imprimir tarjetas*
   como respaldo para quien no reciba el correo.
4. Día de la prueba: los estudiantes ingresan y quedan en espera → *Abrir prueba*. En vivo: ingresos, avance,
   pregunta actual, salidas de la pestaña, desconexiones, dispositivo; pausar, +5 min a todos, +10 min a uno,
   liberar dispositivo, entregar o reabrir a un estudiante.
5. *Cerrar* → *Resultados* → *Publicar*. Se genera el enlace privado del informe para la institución.
   Por defecto el estudiante **no** ve su puesto ni el solucionario (protege el banco y a los menores).

## Agregar una prueba nueva

Copia `src/bancos/fisica-fundamental.js` a `src/bancos/<id>.js`: temas (con peso de prerrequisito y recomendación),
errores conceptuales, y 50 preguntas con `ok`, tres distractores `[texto, idError]`, explicación y figura de
`src/figuras.js`, `src/figuras-mat.js`, `src/figuras-mec.js`, `src/figuras-em.js` o `src/figuras-ondas.js` (las matrices de los enunciados se escriben con `mt()`, ver algebra-lineal.js). Crea `tests/verificaciones/<id>.js` con el cálculo independiente de cada
respuesta (ver el de matemáticas: con `valores`, la prueba exige verificar las 50) y ejecuta `npm test` y `node build.js`.
`tests/banco.test.js` revisa todos los bancos automáticamente.

## Estructura

```
src/bancos/        bancos fuente (preguntas + clave + errores) — privados
src/figuras.js     figuras SVG de física (tema claro/oscuro)
src/figuras-mat.js figuras de matemáticas (plano cartesiano, triángulos, geometría, estadística)
src/app/           sitio: páginas, core.js, analisis.js (calificación y estadística), informe.js
database.rules.json  reglas de seguridad
build.js           compila → dist/public (sitio) y dist/bancos (privado)
tools/             emuladores, semilla, simuladores
tests/             bancos (+ verificaciones/<id>.js), análisis, reglas
```
