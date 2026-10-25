/* Figuras SVG de matemáticas. Usan las mismas clases de color que src/figuras.js (tema claro y oscuro). */
'use strict';
var F = require('./figuras');
var _ = F._, svg = _.svg, line = _.line, text = _.text, arrow = _.arrow, rect = _.rect, circle = _.circle, path = _.path, poly = _.poly, polyline = _.polyline, arc = _.arc;
var M = {};
function r(n) { return Math.round(n * 10) / 10; }
function fmt(v) { return String(Math.round(v * 1000) / 1000).replace('.', ',').replace('-', '−'); }

/* ---------- Aritmética ---------- */
// Rectángulo dividido en filas × columnas con las primeras `sombreadas` celdas (por columnas) sombreadas.
M.cuadricula = function (o) {
  var u = 46, ox = 20, oy = 14, s = '';
  for (var c = 0; c < o.cols; c++) for (var f = 0; f < o.filas; f++) {
    var k = c * o.filas + f;
    s += rect(ox + c * u, oy + f * u, u, u, k < o.sombreadas ? 'cel1' : 'cel0');
  }
  return svg(o.cols * u + 2 * ox, o.filas * u + 2 * oy, s, 'Rectángulo dividido en ' + (o.filas * o.cols) + ' partes iguales con ' + o.sombreadas + ' sombreadas');
};
// Barras de fracción: [{num, den, lab}]
M.barrasFraccion = function (lista) {
  var W = 300, ox = 50, s = '';
  lista.forEach(function (b, i) {
    var y = 16 + i * 52, u = W / b.den;
    for (var k = 0; k < b.den; k++) s += rect(ox + k * u, y, u, 34, k < b.num ? (i ? 'cel2' : 'cel1') : 'cel0');
    s += text(ox - 10, y + 23, b.lab, 't', 'end');
  });
  return svg(W + ox + 16, 16 + lista.length * 52, s, 'Barras que representan fracciones');
};
// Línea de tiempo de dos buses que salen cada a y b minutos.
M.buses = function (o) {
  var L = 84, W = 290, s = '', esc = W / o.hasta;
  [[o.a, 'Ruta 1', 'b2'], [o.b, 'Ruta 2', 'b1']].forEach(function (x, i) {
    var y = 40 + i * 50;
    s += line(L, y, L + W, y, 'lt') + text(L - 16, y + 5, x[1], 'tm', 'end');
    for (var t = 0; t <= o.hasta; t += x[0]) s += circle(L + t * esc, y, 6, x[2]);
  });
  for (var t = 0; t <= o.hasta; t += 6) { s += line(L + t * esc, 128, L + t * esc, 134, 'lt'); if (t % 12 === 0) s += text(L + t * esc, 150, String(t), 'tm', 'middle'); }
  s += line(L, 131, L + W, 131, 'lt') + text(L + W, 168, 'minutos después de las 7:00', 'tm', 'end');
  return svg(L + W + 20, 176, s, 'Línea de tiempo de dos rutas de bus con salidas periódicas');
};

/* ---------- Álgebra ---------- */
M.cuadradoMenos = function () {
  var s = '', x0 = 40, y0 = 20, A = 170, B = 70;
  s += poly([[x0, y0], [x0 + A, y0], [x0 + A, y0 + A - B], [x0 + A - B, y0 + A - B], [x0 + A - B, y0 + A], [x0, y0 + A]], 'cel1');
  s += rect(x0 + A - B, y0 + A - B, B, B, 'hueco');
  s += text(x0 + A / 2, y0 - 6, 'a', 't', 'middle') + text(x0 - 10, y0 + A / 2, 'a', 't', 'end');
  s += text(x0 + A - B / 2, y0 + A + 18, 'b', 't', 'middle') + text(x0 + A + 10, y0 + A - B / 2 + 5, 'b', 't');
  return svg(260, 220, s, 'Cuadrado de lado a al que se le quita un cuadrado de lado b en una esquina');
};
// Máquinas de funciones: x → [g] → [f]
M.maquinas = function (o) {
  var s = text(20, 64, 'x = 3', 't') + arrow(70, 60, 108, 60, 'fa', 8);
  s += rect(110, 36, 80, 48, 'cel0') + text(150, 58, 'g', 'tb', 'middle') + text(150, 76, o.g, 'tm', 'middle');
  s += arrow(192, 60, 228, 60, 'fa', 8);
  s += rect(230, 36, 80, 48, 'cel0') + text(270, 58, 'f', 'tb', 'middle') + text(270, 76, o.f, 'tm', 'middle');
  s += arrow(312, 60, 346, 60, 'fa', 8) + text(352, 64, '?', 't');
  return svg(370, 110, s, 'Diagrama: x entra a la máquina g y su resultado entra a la máquina f');
};

/* ---------- Recta numérica ---------- */
// o = {min, max, intervalo: {a, b, ca, cb}} (ca/cb = extremo cerrado)
M.rectaNumerica = function (o) {
  var L = 30, W = 300, y = 60, esc = W / (o.max - o.min), s = '';
  function X(v) { return L + (v - o.min) * esc; }
  s += line(L - 14, y, L + W + 14, y, 'l');
  for (var v = o.min; v <= o.max; v++) { s += line(X(v), y - 6, X(v), y + 6, 'l'); s += text(X(v), y + 26, fmt(v), 'tm', 'middle'); }
  if (o.intervalo) {
    var it = o.intervalo;
    s += line(X(it.a), y, X(it.b), y, 'fa ln');
    s += circle(X(it.a), y, 6, it.ca ? 'pfill' : 'phueco') + circle(X(it.b), y, 6, it.cb ? 'pfill' : 'phueco');
  }
  return svg(L + W + 30, 100, s, 'Recta numérica' + (o.intervalo ? ' con un intervalo marcado' : ''));
};

/* ---------- Plano cartesiano ---------- */
/* o = {xmin, xmax, ymin, ymax, u (px por unidad), paso (cada cuánto se rotulan los ejes),
       curvas: [{f | pts, c ('fa' | 'fb' | 'd' punteada), dom: [a, b], lab: [x, y, texto]}],
       puntos: [{x, y, lab, dx, dy, hueco}]  (hueco: círculo vacío, el punto no pertenece a la gráfica),
       sombras: [{f, a, b}]  (área entre la curva y el eje x), entre: [{f, g, a, b}]  (región entre dos curvas),
       rects: [{x, w, h}]  (rectángulos de una suma de Riemann), verticales: [x], horizontales: [y]  (rectas punteadas),
       vectores: [{v: [x, y], desde, lab, c, dx, dy}], poligonos: [{pts: [[x, y]…], c}]  (p. ej. el cuadrado unitario y su imagen),
       titulo: rótulo centrado debajo del plano} */
M.cartesiano = function (o) {
  var u = o.u || 28, pad = 22, W = (o.xmax - o.xmin) * u + 2 * pad, H = (o.ymax - o.ymin) * u + 2 * pad, s = '';
  function X(x) { return pad + (x - o.xmin) * u; }
  function Y(y) { return pad + (o.ymax - y) * u; }
  for (var x = o.xmin; x <= o.xmax; x++) s += line(X(x), Y(o.ymax), X(x), Y(o.ymin), 'g');
  for (var y = o.ymin; y <= o.ymax; y++) s += line(X(o.xmin), Y(y), X(o.xmax), Y(y), 'g');
  (o.sombras || []).forEach(function (sh) {
    var pts = [[X(sh.a), Y(0)]];
    for (var i = 0; i <= 120; i++) { var xx = sh.a + (sh.b - sh.a) * i / 120; pts.push([X(xx), Y(sh.f(xx))]); }
    pts.push([X(sh.b), Y(0)]);
    s += poly(pts, 'sh');
  });
  (o.entre || []).forEach(function (re) {
    var arriba = [], abajo = [];
    for (var i = 0; i <= 120; i++) { var xx = re.a + (re.b - re.a) * i / 120; arriba.push([X(xx), Y(re.f(xx))]); abajo.unshift([X(xx), Y(re.g(xx))]); }
    s += poly(arriba.concat(abajo), 'sh');
  });
  (o.rects || []).forEach(function (q) { s += rect(X(q.x), Y(Math.max(q.h, 0)), q.w * u, Math.abs(q.h) * u, 'cel1'); });
  (o.poligonos || []).forEach(function (pg) { s += poly(pg.pts.map(function (p) { return [X(p[0]), Y(p[1])]; }), pg.c || 'cel1'); });
  (o.verticales || []).forEach(function (v) { s += line(X(v), Y(o.ymax), X(v), Y(o.ymin), 'd'); });
  (o.horizontales || []).forEach(function (h) { s += line(X(o.xmin), Y(h), X(o.xmax), Y(h), 'd'); });
  s += arrow(X(o.xmin), Y(0), X(o.xmax) + 12, Y(0), 'ejes', 8) + arrow(X(0), Y(o.ymin), X(0), Y(o.ymax) - 12, 'ejes', 8);
  s += text(X(o.xmax) + 10, Y(0) - 8, 'x', 'tm') + text(X(0) + 8, Y(o.ymax) - 4, 'y', 'tm');
  var paso = o.paso || 1;
  for (x = o.xmin; x <= o.xmax; x++) if (x && x % paso === 0) s += text(X(x), Y(0) + 15, fmt(x), 'tm', 'middle');
  for (y = o.ymin; y <= o.ymax; y++) if (y && y % paso === 0) s += text(X(0) - 6, Y(y) + 4, fmt(y), 'tm', 'end');
  (o.curvas || []).forEach(function (cv) {
    var tramos = [], act = [];
    if (cv.pts) tramos = [cv.pts.map(function (p) { return [X(p[0]), Y(p[1])]; })];
    else {
      var a = cv.dom ? cv.dom[0] : o.xmin, b = cv.dom ? cv.dom[1] : o.xmax, n = 900;
      for (var i = 0; i <= n; i++) {
        var xx = a + (b - a) * i / n, yy = cv.f(xx);
        if (isFinite(yy) && yy >= o.ymin && yy <= o.ymax) act.push([X(xx), Y(yy)]);
        else if (act.length) { tramos.push(act); act = []; }
      }
      if (act.length) tramos.push(act);
    }
    tramos.forEach(function (t) { s += polyline(t, (cv.c || 'fa') + ' ln'); });
    if (cv.lab) s += text(X(cv.lab[0]), Y(cv.lab[1]), cv.lab[2], cv.c === 'fb' ? 'tb' : cv.c === 'd' ? 'tm' : 'ta');
  });
  (o.puntos || []).forEach(function (p) { s += circle(X(p.x), Y(p.y), 4.5, p.hueco ? 'phueco' : 'pfill') + (p.lab ? text(X(p.x) + (p.dx || 8), Y(p.y) + (p.dy || -8), p.lab, 't') : ''); });
  (o.vectores || []).forEach(function (v) {
    var d = v.desde || [0, 0], a = [X(d[0]), Y(d[1])], b = [X(d[0] + v.v[0]), Y(d[1] + v.v[1])];
    s += arrow(a[0], a[1], b[0], b[1], v.c || 'fa', 10) + (v.lab ? text(b[0] + (v.dx || 6), b[1] + (v.dy || -6), v.lab, v.c === 'fb' ? 'tb' : v.c === 'fc' ? 't' : 'ta') : '');
  });
  if (o.titulo) { s += text(W / 2, H + 12, o.titulo, 'ta', 'middle'); H += 22; }   // debajo del plano, sin tapar ejes ni curvas
  return svg(r(W + 10), r(H), s, o.alt || 'Plano cartesiano');
};
// Cuatro curvas pequeñas numeradas.
M.cuatroCurvas = function () {
  var s = '', fs = [
    function (x) { return 0.6 * x + 0.3; },
    function (x) { return 0.5 * x * x - 1.5; },
    null,
    function (x) { return 0.15 * x * x * x; }
  ];
  for (var k = 0; k < 4; k++) {
    var ox = 10 + k * 95, cx = ox + 42, cy = 70, u = 14, t = [];
    s += rect(ox, 14, 84, 112, 'cel0') + line(ox + 6, cy, ox + 78, cy, 'lt') + line(cx, 20, cx, 120, 'lt');
    if (fs[k]) {
      for (var i = 0; i <= 60; i++) { var x = -2.6 + 5.2 * i / 60, y = fs[k](x); if (Math.abs(y) <= 3.4) t.push([cx + x * u, cy - y * u]); }
      s += polyline(t, 'fa ln');
    } else s += circle(cx, cy, 2.2 * u, 'curva');
    s += text(cx, 146, 'Curva ' + (k + 1), 't', 'middle');
  }
  return svg(392, 156, s, 'Cuatro curvas en el plano, numeradas del 1 al 4');
};

/* ---------- Trigonometría ---------- */
// Triángulo rectángulo: ángulo recto abajo a la derecha, θ abajo a la izquierda.
M.trianguloRect = function (o) {
  var A = [40, 180], B = [280, 180], C = [280, 80], s = '';
  s += poly([A, B, C], 'cel0') + rect(266, 166, 14, 14, 'recto');
  s += arc(A[0], A[1], 38, 0, 22.6, 'lt') + text(A[0] + 46, A[1] - 6, 'θ', 't');
  s += text(160, 200, o.ady, 't', 'middle') + text(292, 135, o.op, 't') + text(150, 118, o.hip, 't', 'end');
  return svg(330, 210, s, 'Triángulo rectángulo con ángulo θ, catetos ' + o.ady + ' y ' + o.op + ' e hipotenusa ' + o.hip);
};
M.triangulo3060 = function () {
  var A = [40, 190], B = [240, 190], C = [140, 190 - 173.2], D = [140, 190], s = '';
  s += poly([A, B, C], 'cel0') + line(C[0], C[1], D[0], D[1], 'd') + rect(140, 176, 14, 14, 'recto');
  s += text(90, 205, '1', 't', 'middle') + text(76, 100, '2', 't', 'end') + text(146, 120, '√3', 't');
  s += arc(A[0], A[1], 30, 0, 60, 'lt') + text(A[0] + 34, A[1] - 8, '60°', 'tm');
  s += arc(C[0], C[1], 30, 240, 270, 'lt') + text(C[0] - 8, C[1] + 58, '30°', 'tm', 'end');
  return svg(280, 214, s, 'Triángulo equilátero de lado 2 dividido por su altura en dos triángulos de 30, 60 y 90 grados');
};
M.sombra = function (o) {
  // dibujo a escala: los rayos forman o.ang grados con el suelo y tocan la punta del árbol
  var s = _.ground(20, 330, 180), x = 260, x0 = 100, top = 180 - (x - x0) * Math.tan(o.ang * Math.PI / 180);
  s += rect(x - 6, top + 50, 12, 180 - top - 50, 'tronco') + circle(x, top + 30, 30, 'copa');
  s += line(x0, 180, x, top, 'd') + circle(x, top, 3, 'dot');
  s += arc(x0, 180, 40, 0, o.ang, 'lt') + text(x0 + 46, 172, o.ang + '°', 't');
  s += line(x0, 194, x, 194, 'lt') + text((x0 + x) / 2, 210, 'sombra: ' + o.sombra, 'tm', 'middle');
  s += text(x + 44, 110, 'h = ?', 'tb');
  return svg(340, 218, s, 'Árbol que proyecta una sombra; los rayos del sol forman ' + o.ang + ' grados con el suelo');
};
M.circuloUnitario = function (o) {
  var cx = 150, cy = 120, R = 90, a = o.ang * Math.PI / 180, s = '';
  s += line(cx - R - 20, cy, cx + R + 20, cy, 'lt') + line(cx, cy - R - 20, cx, cy + R + 20, 'lt') + circle(cx, cy, R, 'curva');
  var px = cx + R * Math.cos(a), py = cy - R * Math.sin(a);
  s += line(cx, cy, px, py, 'fa ln') + circle(px, py, 4.5, 'pfill') + text(px - 8, py - 10, 'P', 't', 'end');
  s += arc(cx, cy, 26, 0, o.ang, 'lt') + text(cx + 18, cy - 30, o.lab || (o.ang + '°'), 'tb');
  ['I', 'II', 'III', 'IV'].forEach(function (q, k) { s += text(cx + (k === 0 || k === 3 ? 1 : -1) * 42, cy + (k < 2 ? -38 : 50), q, 'tm', 'middle'); });
  s += text(cx + R + 6, cy + 16, '1', 'tm') + text(cx + 6, cy - R - 6, '1', 'tm');
  return svg(300, 240, s, 'Circunferencia unitaria con un ángulo de ' + (o.lab || o.ang + ' grados'));
};

/* ---------- Geometría ---------- */
M.formaL = function () {
  var u = 22, x0 = 40, y0 = 20, s = '';
  // rectángulo de 8 × 6 con un rectángulo de 3 × 4 recortado en la esquina superior derecha
  s += poly([[x0, y0], [x0 + 5 * u, y0], [x0 + 5 * u, y0 + 4 * u], [x0 + 8 * u, y0 + 4 * u], [x0 + 8 * u, y0 + 6 * u], [x0, y0 + 6 * u]], 'cel1');
  s += poly([[x0 + 5 * u, y0], [x0 + 8 * u, y0], [x0 + 8 * u, y0 + 4 * u], [x0 + 5 * u, y0 + 4 * u]], 'hueco');
  s += text(x0 + 4 * u, y0 + 6 * u + 18, '8 cm', 't', 'middle') + text(x0 - 8, y0 + 3 * u + 5, '6 cm', 't', 'end');
  s += text(x0 + 6.5 * u, y0 - 6, '3 cm', 'tm', 'middle') + text(x0 + 8 * u + 8, y0 + 2 * u + 5, '4 cm', 'tm');
  return svg(x0 + 8 * u + 60, y0 + 6 * u + 30, s, 'Figura en forma de L: rectángulo de 8 por 6 cm al que le falta un rectángulo de 3 por 4 cm en una esquina');
};
M.circuloDiam = function (o) {
  var cx = 130, cy = 110, R = 80, s = circle(cx, cy, R, 'cel1');
  s += arrow(cx + 8, cy, cx + R - 2, cy, 'fb', 8) + arrow(cx - 8, cy, cx - R + 2, cy, 'fb', 8) + circle(cx, cy, 3, 'dot');
  s += text(cx, cy - 10, 'd = ' + o.d, 'tb', 'middle');
  return svg(260, 220, s, 'Círculo con diámetro ' + o.d);
};
M.rectDiagonal = function (o) {
  var s = rect(40, 30, 240, 180 * 0.75, 'cel0'), h = 135;
  s += line(40, 30 + h, 280, 30, 'fa ln') + text(160, 30 + h + 20, o.b, 't', 'middle') + text(30, 30 + h / 2 + 4, o.a, 't', 'end');
  s += text(146, 84, 'd = ?', 'ta', 'end');
  return svg(320, 195, s, 'Rectángulo de ' + o.b + ' por ' + o.a + ' con su diagonal');
};
M.paralelas = function (o) {
  var s = '', y1 = 60, y2 = 160, a = o.ang * Math.PI / 180;
  s += line(20, y1, 320, y1, 'l') + line(20, y2, 320, y2, 'l');
  s += text(326, y1 + 4, 'L₁', 'tm') + text(326, y2 + 4, 'L₂', 'tm');
  // transversal que corta L1 en P y L2 en Q, inclinada o.ang respecto a la horizontal
  var P = [200, y1], dx = (y2 - y1) / Math.tan(a), Q = [200 - dx, y2];
  s += line(P[0] + 40 / Math.tan(a), y1 - 40, Q[0] - 40 / Math.tan(a), y2 + 40, 'l');
  // En P: ángulo entre la semirrecta izquierda de L1 (180°) y la transversal hacia Q (180° + ang). Interior, lado izquierdo.
  s += arc(P[0], P[1], 26, 180, 180 + o.ang, 'arco-a') + text(P[0] - 34, P[1] + 22, o.ang + '°', 'ta', 'end');
  // En Q: ángulo entre la transversal hacia P (ang) y la semirrecta izquierda de L2 (180°). Interior, mismo lado.
  s += arc(Q[0], Q[1], 26, o.ang, 180, 'arco-b') + text(Q[0] - 30, Q[1] - 12, 'x', 'tb', 'end');
  s += text(170, 200, 'L₁ ∥ L₂', 'tm', 'middle');
  return svg(350, 210, s, 'Dos rectas paralelas cortadas por una transversal, con un ángulo de ' + o.ang + ' grados y un ángulo x');
};
M.semejantes = function () {
  var s = '', k = 22;
  function tri(x0, y0, e, lab) { return poly([[x0, y0], [x0 + 4 * e, y0], [x0, y0 - 3 * e]], 'cel0') + rect(x0, y0 - 12, 12, 12, 'recto'); }
  s += tri(30, 150, k) + text(30 + 2 * k, 168, '4', 't', 'middle') + text(20, 150 - 1.5 * k, '3', 't', 'end');
  s += tri(150, 180, 2 * k) + text(150 + 4 * k, 198, 'x', 'tb', 'middle') + text(140, 180 - 3 * k, '6', 't', 'end');
  return svg(340, 206, s, 'Dos triángulos rectángulos semejantes: catetos 3 y 4, y catetos 6 y x');
};

/* ---------- Estadística y porcentajes ---------- */
M.barrasFrec = function (o) {
  var L = 50, B = 170, u = 30, w = 46, s = '';
  for (var y = 0; y <= o.ymax; y++) { s += line(L, B - y * u, L + o.datos.length * 64 + 10, B - y * u, 'g') + text(L - 8, B - y * u + 4, String(y), 'tm', 'end'); }
  o.datos.forEach(function (d, i) { var x = L + 14 + i * 64; s += rect(x, B - d[1] * u, w, d[1] * u, 'barra') + text(x + w / 2, B + 18, String(d[0]), 't', 'middle'); });
  s += line(L, B, L + o.datos.length * 64 + 10, B, 'l') + line(L, B, L, B - o.ymax * u - 6, 'l');
  s += text(L + o.datos.length * 32, B + 38, o.xlab, 'tm', 'middle');
  s += '<text class="tm" text-anchor="middle" transform="translate(16 ' + (B - o.ymax * u / 2) + ') rotate(-90)">' + o.ylab + '</text>';
  return svg(L + o.datos.length * 64 + 30, B + 46, s, 'Diagrama de barras de ' + o.ylab + ' por ' + o.xlab);
};
M.etiqueta = function (o) {
  var s = path('M40 40 L230 40 L280 100 L230 160 L40 160 Z', 'cel0') + circle(240, 100, 8, 'wh');
  s += text(135, 88, o.precio, 't', 'middle') + text(135, 126, o.desc, 'tb', 'middle');
  return svg(310, 200, s, 'Etiqueta de precio ' + o.precio + ' con ' + o.desc);
};
M.exponencial = function () {
  return F.grafica({ xmax: 5, ymax: 3500, xstep: 1, ystep: 500, xlab: 'tiempo (h)', ylab: 'bacterias',
    series: [{ pts: [[0, 100], [1, 200], [2, 400], [3, 800]] }], marcas: [{ x: 0, y: 100, lab: '100', dy: -10 }, { x: 1, y: 200, lab: '200', dy: -10 }, { x: 2, y: 400, lab: '400', dy: -10 }, { x: 3, y: 800, lab: '800', dy: -10 }],
    alt: 'Número de bacterias medido durante las primeras 3 horas' });
};

/* ---------- Cálculo ---------- */
M.escalera = function () {
  var s = rect(250, 20, 16, 170, 'wall') + _.ground(30, 330, 190);
  s += line(130, 186, 250, 26, 'lw') + text(176, 96, '5 m', 't', 'end');
  s += arrow(124, 172, 84, 172, 'fb', 8) + text(104, 164, '1 m/s', 'tb', 'middle');
  s += line(130, 200, 250, 200, 'lt') + text(190, 214, 'x = 3 m', 'tm', 'middle');
  s += arrow(278, 40, 278, 80, 'fa', 8) + text(284, 64, '?', 'ta');
  return svg(330, 220, s, 'Escalera de 5 m apoyada en una pared; su base se aleja a 1 m/s');
};
M.esfera = function (o) {
  var s = circle(130, 110, 80, 'cel1') + '<ellipse class="d" cx="130" cy="110" rx="80" ry="20"/>';
  s += line(130, 110, 210, 110, 'fa ln') + circle(130, 110, 3, 'dot') + text(170, 102, 'r', 'ta', 'middle');
  s += text(230, 60, o.texto, 'tm');
  return svg(330, 210, s, 'Globo esférico de radio r que aumenta');
};
M.rectanguloPerimetro = function () {
  var s = rect(60, 40, 200, 110, 'cel1');
  s += text(160, 168, 'x', 't', 'middle') + text(274, 100, '20 − x', 't');
  s += text(160, 100, 'perímetro = 40 m', 'tm', 'middle');
  return svg(340, 180, s, 'Rectángulo de lados x y 20 − x con perímetro 40 m');
};

/* ---------- Espacio (proyección oblicua) y campos vectoriales ---------- */
/* Eje x hacia abajo a la izquierda, y a la derecha, z hacia arriba.
   o = {s (px por unidad), ejes: [lx, ly, lz] (largo de cada eje), vectores: [{v, desde, lab, c}], puntos: [{p, lab}],
        curvas: [{f(t) → [x, y, z], a, b, c}], poligonos: [{pts: [[x, y, z]…], c}], segmentos: [{a, b, c}], caja: [x, y, z] (proyecciones punteadas)} */
M.espacio = function (o) {
  var sc = o.s || 40, L = o.ejes || [3, 3, 3], ox = 0.62, oy = 0.42;
  var pts = [[0, 0, 0], [L[0], 0, 0], [0, L[1], 0], [0, 0, L[2]]];
  function proy(p) { return [p[1] - ox * p[0], -(p[2] - oy * p[0])]; }
  // marco: se calcula con los extremos de los ejes y de todo lo dibujado
  var todos = pts.slice();
  (o.vectores || []).forEach(function (v) { var d = v.desde || [0, 0, 0]; todos.push(d, [d[0] + v.v[0], d[1] + v.v[1], d[2] + v.v[2]]); });
  (o.poligonos || []).forEach(function (pg) { todos = todos.concat(pg.pts); });
  (o.curvas || []).forEach(function (cv) { for (var i = 0; i <= 60; i++) todos.push(cv.f(cv.a + (cv.b - cv.a) * i / 60)); });
  var xs = todos.map(function (p) { return proy(p)[0]; }), ys = todos.map(function (p) { return proy(p)[1]; });
  var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys), pad = 30;
  function P(p) { var q = proy(p); return [pad + (q[0] - minx) * sc, pad + (q[1] - miny) * sc]; }
  var W = (maxx - minx) * sc + 2 * pad, H = (maxy - miny) * sc + 2 * pad, s = '';
  ['x', 'y', 'z'].forEach(function (n, k) {
    var fin = [0, 0, 0]; fin[k] = L[k];
    var a = P([0, 0, 0]), b = P(fin);
    s += arrow(a[0], a[1], b[0], b[1], 'ejes', 8) + text(b[0] + (k === 0 ? -12 : 6), b[1] + (k === 2 ? -4 : 14), n, 'tm');
  });
  if (o.caja) {
    var c = o.caja, v = [[c[0], 0, 0], [0, c[1], 0], [c[0], c[1], 0], [c[0], c[1], c[2]]];
    [[v[0], v[2]], [v[1], v[2]], [v[2], v[3]]].forEach(function (sg) { var a = P(sg[0]), b = P(sg[1]); s += line(a[0], a[1], b[0], b[1], 'd'); });
  }
  (o.poligonos || []).forEach(function (pg) { s += poly(pg.pts.map(P), pg.c || 'cel1'); });
  (o.segmentos || []).forEach(function (sg) { var a = P(sg.a), b = P(sg.b); s += line(a[0], a[1], b[0], b[1], sg.c || 'd'); });
  (o.curvas || []).forEach(function (cv) { var t = []; for (var i = 0; i <= 200; i++) t.push(P(cv.f(cv.a + (cv.b - cv.a) * i / 200))); s += polyline(t, (cv.c || 'fa') + ' ln'); });
  (o.vectores || []).forEach(function (v) {
    var d = v.desde || [0, 0, 0], a = P(d), b = P([d[0] + v.v[0], d[1] + v.v[1], d[2] + v.v[2]]);
    s += arrow(a[0], a[1], b[0], b[1], v.c || 'fa', 10) + (v.lab ? text(b[0] + (v.dx || 6), b[1] + (v.dy || -6), v.lab, v.c === 'fb' ? 'tb' : 'ta') : '');
  });
  (o.puntos || []).forEach(function (pt) { var a = P(pt.p); s += circle(a[0], a[1], 4, 'pfill') + (pt.lab ? text(a[0] + 7, a[1] - 7, pt.lab, 't') : ''); });
  if (o.titulo) { s += text(W / 2, H + 10, o.titulo, 'ta', 'middle'); H += 20; }
  return svg(r(W), r(H), s, o.alt || 'Figura en el espacio');
};
/* Campo vectorial en una cuadrícula: flechas de igual largo que muestran la dirección de F(x, y). */
M.campo = function (o) {
  var u = o.u || 34, pad = 22, W = (o.xmax - o.xmin) * u + 2 * pad, H = (o.ymax - o.ymin) * u + 2 * pad, s = '';
  function X(x) { return pad + (x - o.xmin) * u; }
  function Y(y) { return pad + (o.ymax - y) * u; }
  s += arrow(X(o.xmin), Y(0), X(o.xmax) + 10, Y(0), 'ejes', 7) + arrow(X(0), Y(o.ymin), X(0), Y(o.ymax) - 10, 'ejes', 7);
  s += text(X(o.xmax) + 8, Y(0) - 6, 'x', 'tm') + text(X(0) + 6, Y(o.ymax) - 4, 'y', 'tm');
  for (var x = o.xmin; x <= o.xmax; x++) for (var y = o.ymin; y <= o.ymax; y++) {
    var v = o.F(x, y), n = Math.hypot(v[0], v[1]);
    if (n < 1e-9) { s += circle(X(x), Y(y), 2, 'dot'); continue; }
    var L = u * 0.38, dx = v[0] / n * L, dy = v[1] / n * L;
    s += arrow(X(x) - dx / 2, Y(y) + dy / 2, X(x) + dx / 2, Y(y) - dy / 2, 'fa', 6);
  }
  return svg(r(W + 10), r(H), s, o.alt || 'Campo vectorial');
};

module.exports = M;
