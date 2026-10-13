/* Imprime en JSON la plantilla de hoja de cálculo (lib/60-hoja.js) para tools/xlsx.py */
const cargar = require('../tests/cargar.js');
const RT = cargar();
process.stdout.write(JSON.stringify(RT.L.HOJA(RT.L.CASA)));
