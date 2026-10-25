/* Figuras de Vibraciones y ondas. Mismas clases de color que src/figuras.js. */
'use strict';
var F = require('./figuras');
var _ = F._, svg = _.svg, line = _.line, text = _.text, arrow = _.arrow, rect = _.rect, circle = _.circle, path = _.path, poly = _.poly, polyline = _.polyline, arc = _.arc, ground = _.ground;
var M = {};

function resorteV(x, y1, y2) {   // resorte vertical en zigzag
  var pts = [[x, y1], [x, y1 + 8]], n = 10; for (var i = 1; i < n; i++) pts.push([x + (i % 2 ? -9 : 9), y1 + 8 + (y2 - y1 - 16) * i / n]); pts.push([x, y2 - 8], [x, y2]);
  return polyline(pts, 'l');
}
/* Dos resortes iguales en paralelo o en serie sosteniendo una masa. */
M.resortes = function (o) {
  var s = rect(40, 14, 260, 10, 'wall');
  if (o.tipo === 'paralelo') { s += resorteV(140, 24, 120) + resorteV(200, 24, 120) + rect(120, 120, 100, 40, 'b1r') + text(170, 145, 'm', 't', 'middle'); }
  else { s += resorteV(170, 24, 80) + circle(170, 82, 3, 'dot') + resorteV(170, 84, 140) + rect(130, 140, 80, 34, 'b1r') + text(170, 162, 'm', 't', 'middle'); }
  s += text(250, 80, 'cada resorte: k', 'tm');
  return svg(340, 190, s, 'Dos resortes iguales de constante k ' + (o.tipo === 'paralelo' ? 'en paralelo' : 'en serie') + ' sosteniendo una masa');
};
/* Varilla que oscila desde un extremo y péndulo simple de igual longitud. */
M.varillaPendulo = function () {
  var s = rect(20, 20, 300, 8, 'wall');
  s += circle(100, 28, 4, 'dot') + poly([[96, 28], [104, 28], [134, 168], [126, 168]], 's1') + text(130, 186, 'varilla', 'tm', 'middle');
  s += circle(240, 28, 4, 'dot') + line(240, 28, 270, 160, 'l') + circle(272, 166, 10, 'b1') + text(262, 194, 'péndulo simple', 'tm', 'middle');
  s += line(40, 28, 40, 168, 'lt') + text(36, 100, 'L', 'tm', 'end');
  return svg(340, 200, s, 'Varilla rígida colgada de un extremo y péndulo simple de la misma longitud L');
};
/* Dos péndulos acoplados por un resorte. */
M.acoplados = function () {
  var s = rect(20, 20, 300, 8, 'wall');
  s += line(110, 28, 110, 140, 'l') + line(230, 28, 230, 140, 'l') + circle(110, 150, 12, 'b1') + circle(230, 150, 12, 'b1');
  var pts = [[122, 150]]; for (var i = 1; i < 9; i++) pts.push([122 + 96 * i / 9, 150 + (i % 2 ? -7 : 7)]); pts.push([218, 150]);
  s += polyline(pts, 'l') + text(170, 178, 'resorte de acople', 'tm', 'middle');
  return svg(340, 190, s, 'Dos péndulos iguales unidos por un resorte');
};
/* Pulso que viaja hacia un extremo fijo. */
M.pulsoExtremo = function () {
  var s = line(20, 100, 290, 100, 'l') + rect(290, 50, 16, 100, 'wall') + text(298, 170, 'extremo fijo', 'tm', 'middle');
  var pts = []; for (var x = 60; x <= 160; x += 2) pts.push([x, 100 - 50 * Math.exp(-Math.pow((x - 110) / 18, 2))]);
  s += polyline(pts, 'fa ln') + arrow(150, 40, 210, 40, 'fb', 9) + text(214, 44, 'avanza', 'tb');
  return svg(340, 180, s, 'Pulso hacia arriba que viaja hacia un extremo fijo de la cuerda');
};
/* Unión de una cuerda liviana con una pesada. */
M.cuerdas = function () {
  var s = line(20, 100, 170, 100, 'lt') + line(170, 100, 320, 100, 'lw') + circle(170, 100, 4, 'dot');
  s += text(95, 86, 'cuerda liviana', 'tm', 'middle') + text(245, 86, 'cuerda pesada', 'tm', 'middle');
  s += arrow(60, 130, 140, 130, 'fb', 9) + text(100, 150, 'la onda pasa a la pesada', 'tb', 'middle');
  return svg(340, 165, s, 'Una cuerda liviana unida a una cuerda pesada con la misma tensión');
};
/* Dos parlantes en fase y un punto P. */
M.parlantes = function (o) {
  var s = '';
  [60, 140].forEach(function (y) { s += rect(30, y - 18, 20, 36, 's1') + poly([[50, y - 18], [70, y - 30], [70, y + 30], [50, y + 18]], 's1'); });
  s += circle(290, 100, 5, 'dot') + text(298, 104, 'P', 't');
  s += line(70, 60, 290, 100, 'd') + line(70, 140, 290, 100, 'd');
  s += text(180, 66, o.d1, 'tm', 'middle') + text(180, 142, o.d2, 'tm', 'middle') + text(20, 186, 'parlantes en fase, λ = ' + o.lam, 'tm');
  return svg(340, 195, s, 'Dos parlantes en fase a distancias ' + o.d1 + ' y ' + o.d2 + ' de un punto P');
};
/* Dos pulsos iguales y opuestos que se acercan. */
M.pulsos = function () {
  var s = line(20, 100, 320, 100, 'lt');
  var p1 = [], p2 = [];
  for (var x = 40; x <= 140; x += 2) p1.push([x, 100 - 40 * Math.exp(-Math.pow((x - 90) / 16, 2))]);
  for (var x2 = 200; x2 <= 300; x2 += 2) p2.push([x2, 100 + 40 * Math.exp(-Math.pow((x2 - 250) / 16, 2))]);
  s += polyline(p1, 'fa ln') + polyline(p2, 'fb ln') + arrow(110, 36, 160, 36, 'fa', 9) + arrow(230, 164, 180, 164, 'fb', 9);
  return svg(340, 185, s, 'Un pulso hacia arriba y otro igual hacia abajo que se acercan por la misma cuerda');
};
/* Onda estacionaria con n vientres. */
M.estacionaria = function (o) {
  var s = rect(20, 50, 10, 100, 'wall') + rect(310, 50, 10, 100, 'wall'), a = [], b = [];
  for (var i = 0; i <= 200; i++) { var x = 30 + 280 * i / 200, y = 45 * Math.sin(o.n * Math.PI * i / 200); a.push([x, 100 - y]); b.push([x, 100 + y]); }
  return svg(340, 170, s + polyline(a, 'fa ln') + polyline(b, 'd'), 'Cuerda fija en ambos extremos vibrando con ' + o.n + ' vientres');
};
/* Tubo cerrado en un extremo. */
M.tubo = function (o) {
  var s = rect(40, 70, 260, 60, 'w') + line(40, 70, 300, 70, 'l') + line(40, 130, 300, 130, 'l') + line(40, 70, 40, 130, 'lw');
  s += text(40, 150, 'cerrado', 'tm', 'middle') + text(300, 150, 'abierto', 'tm', 'middle');
  s += line(40, 170, 300, 170, 'lt') + text(170, 186, 'L = ' + o.L, 'tm', 'middle');
  return svg(340, 195, s, 'Tubo de longitud ' + o.L + ' cerrado en un extremo y abierto en el otro');
};
/* Ambulancia que se acerca a un observador. */
M.ambulancia = function (o) {
  var s = ground(10, 330, 160) + rect(40, 110, 90, 40, 's1') + rect(130, 122, 30, 28, 's1') + circle(65, 152, 8, 'wh') + circle(140, 152, 8, 'wh');
  s += text(85, 134, o.f, 'tm', 'middle') + arrow(170, 90, 230, 90, 'fb', 9) + text(200, 80, o.v, 'tb', 'middle');
  s += circle(290, 102, 8, 's1') + line(290, 110, 290, 138, 'l') + line(290, 138, 282, 158, 'l') + line(290, 138, 298, 158, 'l') + text(290, 84, 'observador', 'tm', 'middle');
  for (var k = 0; k < 3; k++) s += path('M' + (180 + k * 14) + ' 112 Q ' + (188 + k * 14) + ' 126 ' + (180 + k * 14) + ' 140', 'lt');
  return svg(340, 175, s, 'Ambulancia que se acerca a un observador en reposo');
};
/* Cono de Mach. */
M.mach = function () {
  var s = '', ap = [250, 100], ang = 30 * Math.PI / 180;
  [1, 2, 3, 4].forEach(function (k) { var r = 18 * k, cx = ap[0] - 2 * r; s += circle(cx, 100, r, 'lc'); });   // frente emitido hace más tiempo: más lejos y más grande (radio = mitad de la distancia)
  s += line(ap[0], ap[1], ap[0] - 180, ap[1] - 180 * Math.tan(ang), 'fa ln') + line(ap[0], ap[1], ap[0] - 180, ap[1] + 180 * Math.tan(ang), 'fa ln');
  s += path('M250 100 L262 96 L262 104 Z', 'dot') + arrow(262, 100, 304, 100, 'fb', 9) + text(270, 70, 'v = 2·v_sonido', 'tb', 'middle');
  s += arc(ap[0], ap[1], 50, 180 - 30, 180, 'lt') + text(186, 92, 'θ', 't');
  return svg(340, 200, s, 'Frentes de onda de un avión que vuela al doble de la rapidez del sonido y el cono de Mach');
};

module.exports = M;
