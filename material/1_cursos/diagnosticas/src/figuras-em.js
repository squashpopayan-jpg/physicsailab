/* Figuras de Electromagnetismo (Física II universitaria). Mismas clases de color que src/figuras.js. */
'use strict';
var F = require('./figuras');
var _ = F._, svg = _.svg, line = _.line, text = _.text, arrow = _.arrow, rect = _.rect, circle = _.circle, path = _.path, poly = _.poly, polyline = _.polyline;
var M = {};

function carga(x, y, signo, lab) {
  return circle(x, y, 15, signo > 0 ? 'qp' : 'qn') + text(x, y + 5, signo > 0 ? '+' : '−', 't', 'middle') + (lab ? text(x, y - 22, lab, 'tm', 'middle') : '');
}
function resistor(x1, y, x2, lab) {
  var pts = [[x1, y]], n = 6; for (var i = 1; i < n; i++) pts.push([x1 + (x2 - x1) * i / n, y + (i % 2 ? -8 : 8)]); pts.push([x2, y]);
  return polyline(pts, 'l') + (lab ? text((x1 + x2) / 2, y - 14, lab, 'tm', 'middle') : '');
}
function bateriaV(x, y, lab) {   // vertical, borne + arriba
  return line(x - 16, y - 6, x + 16, y - 6, 'l') + line(x - 9, y + 6, x + 9, y + 6, 'lw') + (lab ? text(x - 22, y + 4, lab, 'tm', 'end') : '');
}
function capacitorH(x, y, lab) {   // dos placas verticales en un tramo horizontal centrado en x
  return line(x - 5, y - 13, x - 5, y + 13, 'lw') + line(x + 5, y - 13, x + 5, y + 13, 'lw') + (lab ? text(x, y - 18, lab, 'tm', 'middle') : '');
}

/* Dos cargas sobre una recta, con posiciones marcadas. */
M.cargasLinea = function (o) {
  var L = 50, W = 240, esc = W / o.d, y = 80, s = line(20, y, 320, y, 'lt');
  s += carga(L, y, 1, o.q1) + carga(L + W, y, 1, o.q2);
  for (var x = 0; x <= o.d; x++) s += line(L + x * esc, y + 22, L + x * esc, y + 30, 'lt') + text(L + x * esc, y + 44, x + ' m', 'tm', 'middle');
  s += text(170, 140, '¿dónde se anula el campo?', 'tm', 'middle');
  return svg(340, 150, s, 'Dos cargas positivas sobre una recta separadas ' + o.d + ' m');
};
/* Dos cargas iguales en la base y una tercera en el vértice superior. */
M.triangulo = function () {
  var s = line(70, 160, 270, 160, 'd') + line(70, 160, 170, 60, 'd') + line(270, 160, 170, 60, 'd');
  s += carga(70, 160, 1, '') + carga(270, 160, 1, '') + carga(170, 60, 1, '');
  s += text(70, 192, '(−a, 0)', 'tm', 'middle') + text(270, 192, '(a, 0)', 'tm', 'middle') + text(205, 52, '(0, a)', 'tm');
  return svg(340, 200, s, 'Tres cargas positivas iguales: dos en (−a, 0) y (a, 0) y una en (0, a)');
};
/* Dipolo con un punto P en el centro. */
M.dipolo = function () {
  var s = line(60, 90, 280, 90, 'd') + carga(60, 90, 1, '+q') + carga(280, 90, -1, '−q');
  s += circle(170, 90, 5, 'dot') + text(170, 115, 'P (punto medio)', 'tm', 'middle');
  return svg(340, 135, s, 'Carga +q a la izquierda, carga −q a la derecha y el punto medio P');
};
/* Superficie gaussiana con una carga dentro o fuera. */
M.gauss = function (o) {
  var s = circle(150, 100, 70, 'gauss') + text(150, 186, 'superficie cerrada', 'tm', 'middle');
  s += o.dentro ? carga(150, 100, 1, 'q') : carga(285, 60, 1, 'q');
  return svg(340, 200, s, o.dentro ? 'Carga q dentro de una superficie cerrada' : 'Carga q fuera de una superficie cerrada');
};
/* Capacitor de 2 μF en serie con dos de 3 μF en paralelo. */
M.capacitores = function () {
  var s = '', L = 40, R = 300, T = 50, B = 160;
  s += line(L, T, L, 99, 'l') + line(L, 111, L, B, 'l') + bateriaV(L, 105, '');
  s += line(L, T, 105, T, 'l') + capacitorH(110, T, '2 μF') + line(115, T, 190, T, 'l');
  s += line(190, T, 190, 80, 'l') + line(260, T, 260, 80, 'l') + line(190, T, 260, T, 'l');
  s += line(190, 80, 190, 99, 'l') + line(178, 99, 202, 99, 'lw') + line(178, 109, 202, 109, 'lw') + line(190, 109, 190, 130, 'l') + text(210, 108, '3 μF', 'tm');
  s += line(260, 80, 260, 99, 'l') + line(248, 99, 272, 99, 'lw') + line(248, 109, 272, 109, 'lw') + line(260, 109, 260, 130, 'l') + text(280, 108, '3 μF', 'tm');
  s += line(190, 130, 260, 130, 'l') + line(225, 130, 225, B, 'l') + line(L, B, 225, B, 'l');
  return svg(340, 180, s, 'Capacitor de 2 μF en serie con dos capacitores de 3 μF conectados en paralelo');
};
/* Batería con resistencia interna conectada a una resistencia externa. */
M.bateriaInterna = function () {
  var s = rect(30, 40, 110, 116, 'hueco') + text(85, 186, 'batería real (recuadro)', 'tm', 'middle');
  s += line(75, 40, 75, 74, 'l') + bateriaV(75, 80, '') + text(96, 84, '12 V', 'tm') + line(75, 86, 75, 110, 'l') + resistorV(75, 110, 150, 'r = 1 Ω');
  s += line(75, 40, 75, 20, 'l') + line(75, 20, 280, 20, 'l') + line(75, 150, 75, 175 - 5, 'l') + line(75, 170, 280, 170, 'l');
  s += resistorV(280, 20, 170, 'R = 5 Ω');
  return svg(340, 196, s, 'Batería de 12 V con resistencia interna de 1 Ω conectada a una resistencia de 5 Ω');
};
function resistorV(x, y1, y2, lab) {
  var pts = [[x, y1]], n = 6; for (var i = 1; i < n; i++) pts.push([x + (i % 2 ? -8 : 8), y1 + (y2 - y1) * i / n]); pts.push([x, y2]);
  return polyline(pts, 'l') + (lab ? text(x + 14, (y1 + y2) / 2 + 4, lab, 'tm') : '');
}
/* Nodo con cuatro corrientes. */
M.nodo = function () {
  var s = circle(170, 100, 6, 'dot');
  s += arrow(60, 60, 162, 96, 'fa', 10) + text(70, 52, '5 A', 'ta');
  s += arrow(60, 150, 162, 104, 'fa', 10) + text(70, 168, '3 A', 'ta');
  s += arrow(178, 96, 280, 50, 'fb', 10) + text(286, 52, '2 A', 'tb');
  s += arrow(178, 104, 280, 150, 'fb', 10) + text(286, 156, 'I = ?', 'tb');
  return svg(340, 190, s, 'Nodo al que llegan 5 A y 3 A y del que salen 2 A y una corriente I');
};
/* Carga que se mueve en un campo magnético que sale de la página. */
M.campoB = function () {
  var s = '';
  for (var x = 40; x <= 300; x += 40) for (var y = 30; y <= 170; y += 35) s += circle(x, y, 7, 'lc') + circle(x, y, 2, 'dot');
  s += circle(110, 118, 13, 'qp') + text(110, 123, '+', 't', 'middle') + arrow(125, 118, 200, 118, 'fb', 11) + text(206, 112, 'v', 'tb');
  s += text(320, 196, 'B sale de la página (⊙)', 'tm', 'end');
  return svg(340, 205, s, 'Carga positiva que se mueve hacia la derecha en un campo magnético que sale de la página');
};
/* Dos alambres paralelos con corriente en el mismo sentido. */
M.alambres = function () {
  var s = line(40, 60, 300, 60, 'l') + line(40, 140, 300, 140, 'l');
  s += arrow(140, 60, 200, 60, 'fa', 10) + arrow(140, 140, 200, 140, 'fa', 10) + text(206, 52, 'I', 'ta') + text(206, 132, 'I', 'ta');
  s += text(30, 104, 'd', 'tm') + line(40, 66, 40, 134, 'lt');
  return svg(340, 170, s, 'Dos alambres paralelos con corrientes en el mismo sentido');
};
/* Imán que se acerca a una bobina. */
M.imanBobina = function () {
  var s = rect(30, 80, 60, 40, 'b1r') + rect(90, 80, 60, 40, 'b2r') + text(60, 105, 'S', 't', 'middle') + text(120, 105, 'N', 't', 'middle');
  s += arrow(100, 140, 160, 140, 'fb', 9) + text(130, 160, 'se acerca', 'tb', 'middle');
  s += '<ellipse class="lc" cx="240" cy="100" rx="16" ry="50"/>' + '<ellipse class="lc" cx="256" cy="100" rx="16" ry="50"/>' + '<ellipse class="lc" cx="272" cy="100" rx="16" ry="50"/>';
  s += text(256, 170, 'bobina', 'tm', 'middle') + text(60, 50, 'el observador mira la bobina desde el imán', 'tm');
  return svg(340, 185, s, 'Imán con el polo norte hacia una bobina, acercándose a ella');
};
/* Barra que se desliza sobre rieles en un campo magnético. */
M.barra = function () {
  var s = '';
  for (var x = 60; x <= 300; x += 40) for (var y = 50; y <= 150; y += 33) s += line(x - 5, y - 5, x + 5, y + 5, 'lt') + line(x - 5, y + 5, x + 5, y - 5, 'lt');
  s += line(30, 40, 320, 40, 'l') + line(30, 160, 320, 160, 'l') + line(30, 40, 30, 160, 'l');
  s += rect(196, 36, 10, 128, 's1') + arrow(212, 100, 270, 100, 'fb', 10) + text(276, 104, 'v = 4 m/s', 'tb');
  s += text(184, 104, 'L = 0,5 m', 'tm', 'end') + text(320, 184, 'B = 0,2 T entrando a la página (×)', 'tm', 'end');
  return svg(340, 192, s, 'Barra conductora que se desliza sobre rieles dentro de un campo magnético');
};
/* Transformador. */
M.transformador = function () {
  var s = rect(110, 40, 120, 120, 'hueco') + rect(130, 60, 80, 80, 'hueco');
  for (var i = 0; i < 4; i++) s += '<ellipse class="lc" cx="120" cy="' + (64 + i * 22) + '" rx="22" ry="8"/>';
  for (var j = 0; j < 7; j++) s += '<ellipse class="lc" cx="220" cy="' + (52 + j * 16) + '" rx="22" ry="6"/>';
  s += text(70, 104, 'primario', 'tm', 'middle') + text(275, 104, 'secundario', 'tm', 'middle');
  return svg(340, 180, s, 'Transformador con bobina primaria y secundaria en un núcleo de hierro');
};

module.exports = M;
