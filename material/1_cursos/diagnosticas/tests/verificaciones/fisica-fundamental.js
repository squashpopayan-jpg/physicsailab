/* Verificación independiente del banco de Física fundamental (g = 10 m/s², unidades SI). */
'use strict';
var g = 10;
module.exports = {
  minFiguras: 35,
  esperado: {
    FF01: 72 * 1000 / 3600,
    FF02: Math.hypot(3, 4),
    FF03: 10 * Math.cos(Math.PI / 6),
    FF07: 0.5 * 5 * 10,
    FF08: 10 / 5,
    FF09: g * 3,
    FF14: (10 - 4) / 2,
    FF17: 4 * g * Math.cos(Math.PI / 6),
    FF18: 60 * (g + 2),
    FF19: 3 * (20 / 5),
    FF20: 10 * 4 * Math.cos(Math.PI / 3),
    FF21: Math.sqrt(2 * g * 5),
    FF22: Math.sqrt(2 * g * (20 - 10)),
    FF23: 50 * g * 2 / 4,
    FF25: 0.5 * 200 * 0.1 * 0.1,
    FF26: 2 * 3,
    FF27: 2 * 6 / (2 + 4),
    FF30: 1000 * g * 2,
    FF32: 1000 * g * 0.001,
    FF33: 4 * 2 / 1,
    FF35: 2 * 4200 * (30 - 20),
    FF38: 4 * 5,
    FF41: 340 * 2 / 2,
    FF42: 12 / 4,
    FF43: 12 / (2 + 4),
    FF44: 1 / (1 / 6 + 1 / 6),
    FF47: 90 - 30,
    FF49: 1 + 1
  },
  extra: function (t, assert) {
    t('patinadora: retroceso 0,2 m/s', function () { assert.ok(Math.abs(1 * 10 / 50 - 0.2) < 1e-9); });
    t('Coulomb a doble distancia: F/4', function () { assert.strictEqual(1 / Math.pow(2, 2), 0.25); });
    t('bombillos: A lleva el doble de corriente que B y C (brilla 4 veces más)', function () {
      var R = 1, I = 1 / (R + R / 2); assert.ok(Math.abs((I * I * R) / ((I / 2) * (I / 2) * R) - 4) < 1e-9);
    });
  }
};
