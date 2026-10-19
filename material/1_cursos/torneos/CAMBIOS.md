# Torneos Squash Popayán · v15

Archivo final: `dist/torneos-squash-popayan-v15.html` (copia en el Escritorio).
Usa la misma base de Firebase que la v14 (`torneo_v12`): el torneo que ya está en línea se conserva.

## Accesos
- **Administrador:** PIN `Anto` (no distingue mayúsculas). Tras 5 intentos fallidos se bloquea 30 s.
- **Jueces:** código `juez2026` por defecto. El admin lo ve en «Jugadores» y lo cambia en ⚙ Config
  (botón 🎲 genera uno aleatorio, o puede desactivar el acceso de jueces). Al cambiarlo, los jueces
  conectados pierden el acceso al instante. El juez escribe su nombre y queda registrado en cada partido.
- La sesión de admin/juez se recuerda en el dispositivo (recargar la página no saca al juez).

## Fallos corregidos de la v14
- El marcador en vivo solo se guardaba al pulsar «Guardar»: «← Volver», recargar o un celular apagado
  perdían el partido. Ahora se guarda punto a punto y se retoma exacto.
- Playoffs: los datos del cuadro estaban duplicados; cerrar una llave podía borrar el marcador en juego
  de otra, y corregir un resultado dejaba ganadores imposibles en la ronda siguiente. Ahora hay una sola
  fuente de verdad y las rondas dependientes se reinician (con aviso).
- Cada acción del admin reescribía el torneo completo y podía pisar lo que guardaba un juez.
  Ahora solo se envían las rutas que cambiaron.
- Cada actualización remota hacía saltar la pantalla arriba y borraba lo escrito en formularios.
- «🟢 EN VIVO» aparecía siempre, aun sin conexión.
- Siembra: los sembrados 1 y 2 podían cruzarse en semifinal. Ahora siembra estándar y se evita repetir
  rival de grupo en la primera ronda.
- Se aceptaban marcadores imposibles (13-10). Se podían crear grupos de 1 jugador (bloqueaba los playoffs).
- `confirm()` del navegador (bloqueado en algunos navegadores integrados) → confirmaciones dentro de la app.
- IDs de jugador por milisegundo (podían repetirse) y nombres duplicados.

## Novedades
- Bloqueo por partido: si otro juez lo está llevando, se ve en vivo en solo lectura (con «Tomar control»).
  Si alguien modifica el partido desde otro dispositivo, el juez elige qué versión conservar.
- Modo sin conexión: los puntos quedan en cola y se envían al reconectar (indicador en pantalla).
- Doble toque accidental ignorado, pantalla siempre encendida al arbitrar, vibración, atajos de teclado
  (1/2 punto, L let, Retroceso deshacer), «Corregir sacador», W.O. con confirmación (conserva games jugados).
- Clasificación con desempate oficial: enfrentamiento directo entre 2; mini-tabla entre 3 o más.
- Formato «Eliminación directa» (sembrado por nivel), playoffs programados con hora y cancha.
- Horarios: duración por partido y descanso mínimo configurables; evita cruces de cancha y de jugadores
  inscritos en dos categorías; «Recalcular desde ahora»; editar hora/cancha de un partido (con aviso
  de choques y opción de fijarlo).
- Jugadores: agregar lista pegada, corregir nombre (se propaga a partidos), cambiar nivel, retirar
  jugador (W.O. automático en sus pendientes), «Deshacer grupos» conservando inscritos.
- Categorías: añadir (hasta 8) y eliminar vacías. Puntos por game 11 o 15.
- Respaldo: descargar/importar JSON y copias automáticas antes de cada acción importante.
- Vista General con «En juego ahora», buscador de jugador y filtros. Campeón y subcampeón en Playoffs.
- PDF de cronograma (incluye playoffs) y nuevo PDF de clasificación y resultados.

## Pruebas
- `node torneos/test/logic.test.js` → 19 pruebas de lógica (marcador, cuadros, horarios, desempates,
  migración de datos v14, escrituras mínimas).
- `python torneos/serve.py 8797` + `test/app-test.html` → la app con Firebase simulado (varios dispositivos,
  modo sin conexión). `test/v14-test.html` es la v14 original contra el simulador, para probar la migración.
- `python torneos/build.py` regenera `dist/` y `test/app-test.html` desde `src/torneos.html`.
