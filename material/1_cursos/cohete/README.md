# Apogeo

Aplicación web para el celular Android que **sigue un cohete con la cámara, calcula su altura y la deja grabada en
el video**: altura en vivo, trayectoria, regla de alturas virtual encima de la rampa y una tarjeta final con el
apogeo. Además entrega la curva altura–tiempo en CSV, una gráfica en PNG y permite revisar el video cuadro a cuadro.

Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Cómo abrirla en el celular

La cámara y los sensores de inclinación solo funcionan en páginas `https://`. La app se sirve desde el PC:

1. En el PC, doble clic en `iniciar.bat` (o `python serve.py` en esta carpeta). Si Windows pregunta por el
   firewall, permite Python en **redes privadas**.
2. El celular y el PC deben estar en la misma red. **En la cancha, sin Wi-Fi:** activa el *punto de acceso* del
   celular (no gasta datos para esto) y conecta el PC portátil a esa red.
3. La terminal muestra una dirección como `https://192.168.43.20:8796/`. Ábrela en **Chrome** del celular.
4. Chrome dirá «La conexión no es privada» (el certificado lo genera tu propio PC): **Configuración avanzada →
   Continuar**. Acepta el permiso de cámara.
5. Deja la pestaña abierta mientras uses la app. Sin el PC encendido la página no vuelve a cargar.

Para practicar sin salir: **Ver la demostración** (cancha simulada con un cohete de agua o de modelismo; la app
conoce la altura verdadera y te dice cuánto se equivocó).

## En la cancha, paso a paso

1. **Escoge el puesto.**
   - **De lado al viento.** Si el viento empuja el cohete hacia ti o lejos de ti, un solo celular no lo puede ver y
     la altura sale corrida (cada metro que se acerca suma *h/d* metros). Si sopla de lado, la app lo corrige.
   - **A una distancia parecida a la altura que esperas**: 30–50 m para un cohete de agua, 100–200 m para uno de
     modelismo. Con el cohete a 45° de elevación el error de ángulo pesa lo mínimo.
   - Sin torres de luz ni cables delante. Desde el edificio de la foto se puede medir (la app acepta que estés más
     alto que la rampa), pero los cables y la torre de luz cruzan el cuadro; es mejor la pista atlética, a un costado.
2. **Mide la distancia horizontal** del pie del trípode a la base de la rampa con cinta métrica por el suelo
   (cada carril de la pista mide 1.22 m). Escríbela en ⚙ → *Distancia*. El error de la distancia pasa tal cual a
   la altura: 1 % en *d* es 1 % en *h*. Si no tienes cinta: *Medirla con el GPS* (±3 a ±8 m).
3. **Calibra el lente** una vez por celular (⚙ → *Calibrar lente*), antes de montarlo: apuntas la cruz a algo
   lejano, pulsas *Marcar*, inclinas el celular hasta que el objeto quede cerca del borde y lo tocas.
4. **Monta el celular** en el trípode, **en vertical**, inclinado hacia arriba, con la rampa cerca del borde
   inferior. Arriba aparece *El cuadro cubre: X m*: debe superar la altura esperada.
5. **Toca la base de la rampa** en la imagen. Aparece la regla de alturas cian encima de la rampa y la barra de
   arriba dice *cel. 1.4 m*: es la altura del celular sobre la base calculada con tu distancia. **Compruébala con
   la del trípode**; si no coincide, la distancia o el toque están mal.
6. **Comprobación opcional:** pon algo de altura conocida junto a la rampa (una persona con un palo de 2 m, el
   travesaño de una portería mide 2.44 m) y tócalo: la app dice a qué altura está.
7. **Graba.** Hay una cuenta regresiva con pitidos (5 s por defecto) para alejarte. La app aprende el fondo,
   detecta sola el despegue, sigue al cohete y para de grabar sola cuando aterriza. Si en algún momento lo pierde,
   **toca el cohete en la pantalla**.
8. **Resultados:** apogeo ± incertidumbre, tiempo al apogeo, rapidez vertical máxima, deriva lateral, gráfica.
   *Guardar video* (MP4 a Descargas), *Compartir video* (WhatsApp, Drive…), *Guardar datos (CSV)*, *Guardar
   gráfica*. Si mediste la distancia después, cámbiala ahí y todo se recalcula.
9. **Revisar cuadro a cuadro** si algo salió raro: tocas el cohete para corregir un punto, quitas puntos malos,
   marcas el cuadro del despegue o vuelves a tocar la base.

**En la mano** (⚙ → modo *En la mano*): para cohetes que suben más de lo que cabe en el cuadro. Apuntas la cruz a
la base y pulsas *Base*; al grabar, sigues el cohete con la cruz. Es menos preciso al comienzo del vuelo y la hora
del despegue sale unos 0.2 s tarde (lo que tarda la mano en reaccionar); el apogeo no se ve afectado.

## Cómo calcula la altura

Un solo observador a distancia horizontal *d* de la rampa:

  **h = d · ( tan θ / cos Δ − tan θ₀ )**

- **θ**: elevación del cohete = inclinación del celular (sensor de orientación: giroscopio + acelerómetro) más la
  posición del cohete en la imagen (modelo de cámara estenopeica con la focal calibrada).
- **θ₀**: elevación de la base de la rampa (el toque). El término −*d*·tan θ₀ es la altura del celular sobre la
  base, así que **no hay que medirla**, y un sesgo del sensor se cancela en parte.
- **Δ**: giro horizontal entre la rampa y el cohete. Dividir por cos Δ supone el cohete en el plano vertical que pasa
  por la rampa, de frente a ti: corrige la deriva lateral.
- El **apogeo** sale de una parábola ajustada a los puntos más altos. La incertidumbre combina el error del sensor
  (±0.3°), el de la distancia y el del ajuste, y aparte se informa el margen por la deriva hacia/desde ti.
- Cada cuadro del video lleva su número codificado en la franja inferior (las celdas blancas y negras): así la
  revisión cuadro a cuadro recupera la orientación exacta de ese cuadro.

El seguimiento: en trípode, diferencia contra un fondo aprendido antes del despegue (solo aparece lo que se
mueve) y se toma la punta de la mancha en la dirección del movimiento, porque el cohete va delante de su chorro de
agua o su humo. En la mano, contraste contra el color del cielo cerca de la cruz. La posición se guarda como
dirección en el espacio (no como píxel), así que la predicción sirve aunque el celular se mueva.

## Validación (con honestidad)

Probado con **vuelos simulados** (física con empuje, arrastre del aire a 1760 m s. n. m., viento, rampa inclinada;
imágenes con nubes que derivan, árboles, ruido de cámara; sensor con sesgo de 0.2° y ruido):

| caso | real | aparente* | medido | error del rastreador |
| --- | --- | --- | --- | --- |
| agua, trípode, viento de lado | 35.7 m | 37.1 m | 36.9 ± 0.5 m | −0.2 m |
| agua, trípode, viento a lo largo de la visual | 35.6 m | 39.6 m | 39.5 ± 0.5 m | −0.2 m |
| agua, trípode, desde un 3.er piso (8 m, d = 60 m) | 35.7 m | 36.4 m | 36.2 ± 0.5 m | −0.3 m |
| agua, en la mano | 35.7 m | 37.1 m | 37.2 ± 0.5 m | +0.1 m |
| modelismo B6-4, trípode, d = 150 m | 198 m | 209 m | 211 ± 2.5 m | +1.9 m |
| modelismo B6-4, en la mano, d = 150 m | 198 m | 209 m | 211 ± 2.5 m | +1.7 m |

\* *aparente*: lo que mediría un instrumento perfecto desde un solo punto. La diferencia entre *real* y *aparente*
es la deriva hacia el observador; con viento a lo largo de la visual llega al 11 %. Por eso: **ponte de lado al
viento**, o mide con dos celulares desde dos puestos (posible extensión).

Además se probó en Chrome: grabación MP4 a 30 cuadros/s, lectura del número de cuadro después de la compresión
H.264, revisión y marcado manual. **Todavía no se ha probado con un lanzamiento real ni en tu celular**: lo que más
puede variar es la velocidad de procesamiento (si va lento, ⚙ → Avanzado → *Resolución de análisis 480*) y que
el navegador entregue el instante de captura de cada cuadro (en trípode no importa).

## Archivos

| archivo | para qué |
| --- | --- |
| `index.html`, `css/style.css` | interfaz |
| `js/app.js` | cámara, demostración, grabación, resultados, revisión, ajustes |
| `js/geom.js` | orientación, proyección de la cámara, fórmula de altura, calibración del lente, GPS |
| `js/pipeline.js`, `js/detect.js` | detección del despegue y seguimiento del cohete |
| `js/analysis.js` | apogeo ajustado, incertidumbres, rapidez, CSV |
| `js/hud.js`, `js/chart.js`, `js/barcode.js` | capa de información del video, gráfica, número de cuadro |
| `js/orient.js`, `js/recorder.js`, `js/store.js` | sensores, grabación y guardado |
| `js/physics.js`, `js/scene.js` | vuelo del cohete y escena de la demostración |
| `serve.py`, `iniciar.bat` | servidor HTTPS local (puerto 8796) |
| `test/` | pruebas: `npm test` (geometría y vuelos simulados de extremo a extremo) |
