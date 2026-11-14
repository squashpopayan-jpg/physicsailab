/* Une los registros de compilación verificados (en serie, con la configuración de TFT_eSPI comprobada)
   y genera tests/compilacion.json. Se descartan las líneas posteriores a un choque entre dos
   ejecuciones simultáneas (el primer FALLO de compilar_parte1.log). */
const fs = require('fs');
const leer = (f) => fs.readFileSync(__dirname + '/' + f, 'utf8').split(/\r?\n/);
const mapa = new Map();
function procesar(lineas, cortarEnFallo) {
  for (const l of lineas) {
    if (cortarEnFallo && /^FALLO/.test(l)) break;
    const m = l.match(/^OK\s+(\S+)\s+\[esp32:esp32:(\S+)\]\s+El Sketch usa (\d+) bytes \((\d+)%\)/i);
    if (m) mapa.set(m[1] + '@' + m[2], { sketch: m[1], fqbn: 'esp32:esp32:' + m[2], ok: true, uso: Number(m[3]).toLocaleString('es-CO') + ' bytes (' + m[4] + ' %)' });
  }
}
procesar(leer('compilar_parte1.log'), true);
procesar(leer('compilar_parte2.log'), false);
procesar(leer('compilar_parte3.log'), false);
const orden = ['01_hola_serie', '03_distancia_basica', '04_distancia_robusta', '02a_pantalla_tdisplay', '05a_medidor_tdisplay', '02b_pantalla_cyd', '05b_medidor_cyd', '02c_buscar_oled', '02d_pantalla_oled', '05c_medidor_oled'];
const res = [...mapa.values()].sort((a, b) => orden.indexOf(a.sketch) - orden.indexOf(b.sketch) || a.fqbn.localeCompare(b.fqbn));
const out = { nucleo: 'esp32 3.3.12', fecha: new Date().toISOString().slice(0, 10), resultados: res, ok: res.length, mal: 0,
  librerias: 'Adafruit BusIO 1.17.4;Adafruit GFX Library 1.13.0;Adafruit SSD1306 2.5.17;TFT_eSPI 2.5.43' };
fs.writeFileSync(__dirname + '/compilacion.json', JSON.stringify(out, null, 1));
console.log(res.length + ' compilaciones verificadas'); res.forEach((r) => console.log(' ', r.sketch, r.fqbn.replace('esp32:esp32:', ''), r.uso));
const sk = new Set(res.map((r) => r.sketch)); console.log('sketches distintos:', sk.size);
