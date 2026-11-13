# Obra Eléctrica (ConCode/instalacion)

Laboratorio de simulación de la instalación eléctrica de una vivienda (RETIE + NTC 2050). Reutiliza la casa y la biblioteca de `ConCode/retie`.

- `src/lib/` (sin DOM, probada en Node): `00-norma`, `10-calc`, `20-casa`, `30-red`, `40-reglas`, `50-cargas` copiados de retie; `05-norma2` (tablas 250.122/250.66, lotes, rollos, colores), `60-obra` (estado `E`, `casaDe`, evaluaciones `O.ev.<etapa>`, referencia, puntaje), `70-cableado` (5 montajes, redes, simulación, GFCI), `80-sim` (energización, disparo, calentamiento, fallas, defectos y pruebas).
- `src/ui/`: `00-base`, `10-planta` (SVG), `15-grafica`, `20…28` una por etapa, `90-app` (navegación e inicio).
- Etapas: plano, acometida, tierra, circuitos, canal, tablero, cableado, pruebas, dictamen. Pesos en `O.ETAPAS`.
- `node tests/validar.js` (60 pruebas) · `node build.js` → `dist/index.html` y `dist/obra-electrica.html` (artefacto).
- Servidor local: launch.json «obra-electrica» (puerto 8802). Cachea: abrir con `?v=N`.
- `O.aplicarReferencia(E)` deja plano/acometida/tierra/circuitos/canal/tablero en verde (75 puntos); cableado y pruebas exigen acción.
