/* Figuras de Mecánica (Física I universitaria). Mismas clases de color que src/figuras.js. */
'use strict';
var F = require('./figuras');
var _ = F._, svg = _.svg, line = _.line, text = _.text, arrow = _.arrow, rect = _.rect, circle = _.circle, path = _.path, poly = _.poly, polyline = _.polyline, arc = _.arc, ground = _.ground;
var M = {};
function r(n) { return Math.round(n * 10) / 10; }

/* Lanzamiento horizontal desde un acantilado. */
M.acantilado = function (o) {
  var s = rect(10, 60, 90, 130, 's1') + ground(100, 330, 190);
  s += circle(100, 52, 8, 'b1') + arrow(110, 52, 160, 52, 'fb', 9) + text(166, 56, o.v, 'tb');
  s += path('M100 52 Q 210 52 290 188', 'd');
  s += line(40, 60, 40, 190, 'lt') + line(34, 60, 46, 60, 'lt') + line(34, 190, 46, 190, 'lt') + text(48, 130, o.h, 't');
  s += text(230, 182, 'alcance = ?', 'tm', 'middle');
  return svg(340, 200, s, 'Pelota lanzada horizontalmente desde un acantilado de ' + o.h);
};
/* Tiro oblicuo con ángulo. */
M.tiro = function (o) {
  var s = ground(10, 330, 180), a = o.ang * Math.PI / 180;
  s += path('M30 178 Q 170 -40 310 178', 'd');
  s += arrow(30, 178, 30 + 80 * Math.cos(a), 178 - 80 * Math.sin(a), 'fb', 10) + text(30 + 86 * Math.cos(a), 170 - 80 * Math.sin(a), o.v, 'tb');
  s += arc(30, 178, 34, 0, o.ang, 'lt') + text(70, 172, o.ang + '°', 'tm');
  s += line(170, 70, 170, 178, 'lt') + text(176, 130, 'h máx = ?', 'tm');
  return svg(340, 195, s, 'Proyectil lanzado a ' + o.ang + ' grados con rapidez ' + o.v);
};
/* Bote que cruza un río. */
M.rio = function (o) {
  var s = rect(10, 50, 320, 110, 'w') + line(10, 50, 330, 50, 'wl') + line(10, 160, 330, 160, 'wl');
  [30, 90, 230].forEach(function (x) { s += arrow(x, 145, x + 30, 145, 'ejes', 6); });
  s += text(326, 128, 'corriente ' + o.rio, 'tm', 'end');
  s += path('M150 150 L165 125 L180 150 Z', 's1');
  s += arrow(165, 125, 165, 60, 'fb', 10) + text(172, 90, o.bote + ' (respecto al agua)', 'tb');
  return svg(340, 175, s, 'Bote que apunta perpendicular a la corriente de un río');
};
/* Máquina de Atwood. */
M.atwood = function (o) {
  var s = line(170, 0, 170, 20, 'l') + circle(170, 40, 22, 's1') + circle(170, 40, 3, 'dot');
  s += line(148, 40, 148, 120, 'l') + line(192, 40, 192, 90, 'l');
  s += rect(128, 120, 40, 40, 'b1r') + text(148, 145, o.m1, 'tm', 'middle');
  s += rect(172, 90, 40, 34, 'b2r') + text(192, 112, o.m2, 'tm', 'middle');
  return svg(340, 175, s, 'Máquina de Atwood con masas ' + o.m1 + ' y ' + o.m2);
};
/* Bloque sobre una mesa unido a una masa colgante por una polea. */
M.mesaPolea = function (o) {
  var s = rect(20, 90, 240, 12, 's1') + line(40, 102, 40, 190, 'l') + line(240, 102, 240, 190, 'l');
  s += rect(90, 56, 60, 34, 'b1r') + text(120, 78, o.m1, 'tm', 'middle');
  s += line(150, 72, 266, 72, 'l') + circle(272, 84, 13, 's1') + line(285, 84, 285, 140, 'l');
  s += rect(266, 140, 38, 34, 'b2r') + text(285, 162, o.m2, 'tm', 'middle');
  s += text(140, 120, o.nota || 'sin fricción', 'tm', 'middle');
  return svg(340, 195, s, 'Bloque de ' + o.m1 + ' sobre una mesa unido a una masa colgante de ' + o.m2);
};
/* Bloque jalado por una fuerza inclinada. */
M.bloqueAngulo = function (o) {
  var s = ground(10, 330, 150), a = o.ang * Math.PI / 180;
  s += rect(110, 100, 70, 50, 's1') + text(145, 130, o.m, 'tm', 'middle');
  var x2 = 180 + 100 * Math.cos(a), y2 = 110 - 100 * Math.sin(a);
  s += arrow(180, 110, x2, y2, 'fa', 11) + text(x2 + 6, y2 + 4, o.F, 'ta');
  s += line(180, 110, 280, 110, 'd') + arc(180, 110, 36, 0, o.ang, 'lt') + text(222, 102, o.ang + '°', 'tm');
  s += text(170, 172, o.nota || 'piso sin fricción', 'tm', 'middle');
  return svg(340, 180, s, 'Bloque de ' + o.m + ' jalado con ' + o.F + ' a ' + o.ang + ' grados');
};
/* Rizo vertical (loop). */
M.rizo = function (o) {
  var s = ground(10, 330, 190) + circle(170, 110, 78, 'lc');
  s += rect(158, 34, 24, 14, 'b1r') + arrow(184, 41, 204, 41, 'fb', 7) + text(214, 26, 'v = ?', 'tb');   // el carro va por dentro del rizo
  s += line(170, 110, 248, 110, 'lt') + text(208, 104, 'R = ' + o.R, 'tm', 'middle') + circle(170, 110, 3, 'dot');
  return svg(340, 200, s, 'Carro en lo alto de un rizo vertical de radio ' + o.R);
};
/* Rampa sin fricción que termina en un resorte. */
M.rampaResorte = function (o) {
  var s = ground(10, 330, 180);
  s += path('M20 60 Q 70 175 140 178 L 260 178', 'l') + rect(14, 44, 18, 14, 'b1r') + text(40, 50, o.m, 'tm');
  s += line(8, 60, 8, 178, 'lt') + text(12, 130, o.h, 'tm');
  var pts = [[260, 168]]; for (var i = 1; i < 8; i++) pts.push([260 + i * 7, 168 + (i % 2 ? -8 : 8)]); pts.push([316, 168]);
  s += polyline(pts, 'l') + rect(316, 140, 10, 40, 'wall') + text(284, 128, 'k = ' + o.k, 'tm', 'middle');
  return svg(340, 195, s, 'Bloque que baja por una rampa sin fricción y comprime un resorte');
};
/* Llave aplicada a una tuerca con fuerza inclinada. */
M.llave = function (o) {
  var s = circle(60, 110, 16, 's1') + circle(60, 110, 4, 'dot') + rect(60, 102, 160, 16, 's1');
  var a = o.ang * Math.PI / 180, x = 215, y = 110;
  s += arrow(x, y, x + 70 * Math.cos(a), y - 70 * Math.sin(a), 'fa', 11) + text(x + 74 * Math.cos(a), y - 74 * Math.sin(a) - 4, o.F, 'ta');
  s += line(x, y, x + 70, y, 'd') + arc(x, y, 30, 0, o.ang, 'lt') + text(x + 36, y - 6, o.ang + '°', 'tm');
  s += line(60, 140, 215, 140, 'lt') + text(138, 156, o.L, 'tm', 'middle');
  return svg(340, 170, s, 'Llave de ' + o.L + ' con una fuerza de ' + o.F + ' a ' + o.ang + ' grados');
};
/* Balancín con dos niños. */
M.balancin = function (o) {
  var s = ground(10, 330, 170) + poly([[170, 130], [155, 168], [185, 168]], 's1');
  s += rect(30, 124, 280, 8, 's1');
  s += rect(50, 96, 36, 28, 'b1r') + text(68, 115, o.m1, 'tm', 'middle');
  s += rect(250, 100, 32, 24, 'b2r') + text(266, 117, o.m2, 'tm', 'middle');
  s += line(68, 150, 170, 150, 'lt') + text(119, 146, o.d1, 'tm', 'middle') + line(170, 150, 266, 150, 'd') + text(218, 146, 'x = ?', 'tb', 'middle');
  return svg(340, 180, s, 'Balancín: ' + o.m1 + ' a ' + o.d1 + ' del apoyo y ' + o.m2 + ' al otro lado');
};
/* Viga sobre dos apoyos con una carga. */
M.viga = function () {
  var s = ground(10, 330, 170) + rect(40, 100, 260, 12, 's1');
  s += poly([[40, 112], [28, 140], [52, 140]], 's1') + poly([[300, 112], [288, 140], [312, 140]], 's1');
  s += arrow(170, 70, 170, 98, 'fa', 8) + text(176, 76, '200 N (peso de la viga)', 'tm');
  s += arrow(105, 50, 105, 98, 'fb', 8) + text(105, 44, '100 N', 'tb', 'middle');
  s += line(40, 152, 300, 152, 'lt') + text(170, 164, '4 m', 'tm', 'middle') + line(40, 124, 105, 124, 'd') + text(72, 136, '1 m', 'tm', 'middle');
  s += text(32, 158, 'A', 't') + text(304, 158, 'B', 't');
  return svg(340, 180, s, 'Viga de 4 m apoyada en A y B, con su peso en el centro y una carga de 100 N a 1 m de A');
};
/* Letrero colgado de dos cables simétricos. */
M.letrero = function (o) {
  var s = rect(10, 20, 320, 8, 'wall');
  var a = o.ang * Math.PI / 180, cx = 170, cy = 28 + 120 * Math.tan(a);
  s += line(50, 28, cx, cy, 'l') + line(290, 28, cx, cy, 'l');
  s += arc(50, 28, 34, -o.ang, 0, 'lt') + text(92, 46, o.ang + '°', 'tm');
  s += arc(290, 28, 34, 180, 180 + o.ang, 'lt') + text(248, 46, o.ang + '°', 'tm', 'end');
  s += line(cx, cy, cx, cy + 14, 'l') + rect(cx - 40, cy + 14, 80, 36, 'b1r') + text(cx, cy + 37, o.P, 'tm', 'middle');
  return svg(340, cy + 62, s, 'Letrero de ' + o.P + ' colgado de dos cables a ' + o.ang + ' grados de la horizontal');
};
/* Esfera maciza y aro sobre un plano inclinado. */
M.rodadura = function () {
  var s = poly([[20, 180], [320, 180], [20, 60]], 'inc');
  s += circle(70, 64, 16, 'b1') + text(70, 44, 'esfera maciza', 'tm', 'middle');
  s += circle(120, 84, 16, 'lc') + text(150, 76, 'aro', 'tm');
  return svg(340, 190, s, 'Una esfera maciza y un aro listos para rodar por el mismo plano inclinado');
};
/* Satélite en órbita circular. */
M.orbita = function () {
  var s = circle(170, 110, 30, 'cel1') + text(170, 115, 'planeta', 'tm', 'middle');
  s += circle(170, 110, 90, 'd') + circle(260, 110, 7, 'b1') + text(270, 106, 'satélite', 'tm');
  s += line(170, 110, 260, 110, 'lt') + text(215, 124, 'r', 'tm', 'middle');
  return svg(340, 215, s, 'Satélite en órbita circular de radio r alrededor de un planeta');
};

module.exports = M;
