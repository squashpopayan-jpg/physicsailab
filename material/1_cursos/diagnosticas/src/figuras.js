/* Figuras SVG de las pruebas diagnósticas.
   Cada función devuelve un <svg> en texto. Los colores salen de clases (ver src/app/estilos.css),
   así las figuras se ven bien en tema claro y oscuro:
     l  trazo principal      lt trazo fino     g  cuadrícula     d  trazo punteado
     fa/fb/fc  flechas o realces de color (trazo y relleno)
     s1 objeto con relleno suave      w agua      t texto      tm texto pequeño      ta/tb texto de color */
(function (root) {
  'use strict';
  var F = {};
  function r(n) { return Math.round(n * 10) / 10; }
  function svg(w, h, body, alt) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      esc(alt || 'Figura') + '">' + body + '</svg>';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function line(x1, y1, x2, y2, c) { return '<line class="' + (c || 'l') + '" x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) + '"/>'; }
  function text(x, y, s, c, anchor) {
    return '<text class="' + (c || 't') + '" x="' + r(x) + '" y="' + r(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>';
  }
  function rect(x, y, w, h, c) { return '<rect class="' + (c || 's1') + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '"/>'; }
  function circle(x, y, rad, c) { return '<circle class="' + (c || 's1') + '" cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(rad) + '"/>'; }
  function path(d, c) { return '<path class="' + (c || 'l') + '" d="' + d + '"/>'; }
  function poly(pts, c) { return '<polygon class="' + (c || 's1') + '" points="' + pts.map(function (p) { return r(p[0]) + ',' + r(p[1]); }).join(' ') + '"/>'; }
  function polyline(pts, c) { return '<polyline class="' + (c || 'l') + '" points="' + pts.map(function (p) { return r(p[0]) + ',' + r(p[1]); }).join(' ') + '"/>'; }
  /* Flecha con punta dibujada a mano (los <marker> no toman el color del tema en todos los navegadores). */
  function arrow(x1, y1, x2, y2, c, head) {
    c = c || 'fa'; head = head || 9;
    var a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    var bx = x2 - Math.cos(a) * head, by = y2 - Math.sin(a) * head;
    var px = Math.sin(a) * head * 0.45, py = -Math.cos(a) * head * 0.45;
    return '<g class="' + c + '">' + (L > head ? line(x1, y1, bx, by, c + ' ar') : '') +
      poly([[x2, y2], [bx + px, by + py], [bx - px, by - py]], c) + '</g>';
  }
  function ground(x1, x2, y) {
    var s = line(x1, y, x2, y, 'l');
    for (var x = x1 + 4; x < x2; x += 12) s += line(x, y, x - 8, y + 8, 'lt');
    return s;
  }
  function arc(cx, cy, rad, a1, a2, c) { // ángulos en grados, sentido antihorario en pantalla (y hacia arriba)
    var p1 = [cx + rad * Math.cos(a1 * Math.PI / 180), cy - rad * Math.sin(a1 * Math.PI / 180)];
    var p2 = [cx + rad * Math.cos(a2 * Math.PI / 180), cy - rad * Math.sin(a2 * Math.PI / 180)];
    return path('M' + r(p1[0]) + ' ' + r(p1[1]) + ' A' + rad + ' ' + rad + ' 0 0 0 ' + r(p2[0]) + ' ' + r(p2[1]), c || 'lt');
  }
  F._ = { svg: svg, line: line, text: text, arrow: arrow, rect: rect, circle: circle, path: path, poly: poly, polyline: polyline, arc: arc, ground: ground, esc: esc };

  /* ---------- Vectores ---------- */
  // Cuadrícula con vectores dados en unidades de cuadro: vs = [{x0,y0,x1,y1,lab,c}]
  F.vectoresCuadricula = function (o) {
    var nx = o.nx || 8, ny = o.ny || 6, u = 30, ox = 20, oy = 20, W = nx * u + 2 * ox, H = ny * u + 2 * oy, s = '';
    for (var i = 0; i <= nx; i++) s += line(ox + i * u, oy, ox + i * u, oy + ny * u, 'g');
    for (var j = 0; j <= ny; j++) s += line(ox, oy + j * u, ox + nx * u, oy + j * u, 'g');
    function P(x, y) { return [ox + x * u, oy + (ny - y) * u]; }
    o.vs.forEach(function (v) {
      var a = P(v.x0, v.y0), b = P(v.x1, v.y1);
      s += arrow(a[0], a[1], b[0], b[1], v.c || 'fa', 11);
      var m = P((v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2);
      s += text(m[0] + (v.dx || 0), m[1] + (v.dy || -6), v.lab, v.c === 'fb' ? 'tb' : 'ta', 'middle');
    });
    s += text(ox + nx * u, oy + ny * u + 16, '1 cuadro = ' + (o.escala || '1 unidad'), 'tm', 'end');
    return svg(W, H + 4, s, o.alt || 'Vectores en una cuadrícula');
  };
  F.vectorAngulo = function (o) {
    var s = '', x0 = 50, y0 = 170, L = 170, a = o.ang * Math.PI / 180;
    s += line(x0, y0, x0 + 230, y0, 'lt') + line(x0, y0, x0, 20, 'lt');
    s += text(x0 + 236, y0 + 4, 'x', 'tm') + text(x0 - 4, 14, 'y', 'tm');
    var x1 = x0 + L * Math.cos(a), y1 = y0 - L * Math.sin(a);
    s += line(x1, y1, x1, y0, 'd') + line(x1, y1, x0, y1, 'd');
    s += arrow(x0, y0, x1, y1, 'fa', 12);
    s += arc(x0, y0, 42, 0, o.ang, 'lt') + text(x0 + 50, y0 - 10, o.ang + '°', 't');
    s += text(x0 + L * 0.5 * Math.cos(a) - 14, y0 - L * 0.5 * Math.sin(a) - 10, o.lab, 'ta', 'end');
    return svg(300, 195, s, 'Vector de ' + o.lab + ' a ' + o.ang + ' grados sobre la horizontal');
  };

  /* ---------- Gráficas ---------- */
  // o = {xmax, ymax, xstep, ystep, xlab, ylab, series:[{pts:[[x,y]..], c}], ymin, marcas:[{x,y,lab}], sombra:[[x,y]..], etiquetas:[{x,y,lab}]}
  F.grafica = function (o) {
    var W = 330, H = 220, L = 52, R = 18, T = 16, B = 40, ymin = o.ymin || 0;
    var sx = (W - L - R) / o.xmax, sy = (H - T - B) / (o.ymax - ymin);
    function X(x) { return L + x * sx; }
    function Y(y) { return H - B - (y - ymin) * sy; }
    var s = '';
    for (var x = 0; x <= o.xmax + 1e-9; x += o.xstep) { s += line(X(x), T, X(x), H - B, 'g'); s += text(X(x), H - B + 15, fmt(x), 'tm', 'middle'); }
    for (var y = ymin; y <= o.ymax + 1e-9; y += o.ystep) { s += line(L, Y(y), W - R, Y(y), 'g'); s += text(L - 6, Y(y) + 4, fmt(y), 'tm', 'end'); }
    if (o.sombra) s += poly(o.sombra.map(function (p) { return [X(p[0]), Y(p[1])]; }), 'sh');
    s += line(L, Y(Math.max(ymin, 0)), W - R, Y(Math.max(ymin, 0)), 'lt') + line(L, T, L, H - B, 'lt');
    o.series.forEach(function (se) { s += polyline(se.pts.map(function (p) { return [X(p[0]), Y(p[1])]; }), se.c || 'fa ln'); });
    (o.marcas || []).forEach(function (m) { s += circle(X(m.x), Y(m.y), 3.5, 'dot') + text(X(m.x) + (m.dx || 6), Y(m.y) + (m.dy || -6), m.lab, 't'); });
    (o.etiquetas || []).forEach(function (m) { s += text(X(m.x), Y(m.y), m.lab, m.c || 'tm', 'middle'); });
    s += text((L + W - R) / 2, H - 6, o.xlab, 't', 'middle');
    s += '<text class="t" text-anchor="middle" transform="translate(14 ' + r((T + H - B) / 2) + ') rotate(-90)">' + esc(o.ylab) + '</text>';
    return svg(W, H, s, o.alt || ('Gráfica de ' + o.ylab + ' contra ' + o.xlab));
  };
  function fmt(v) { v = Math.round(v * 1000) / 1000; return String(v).replace('.', ','); }

  /* ---------- Cinemática ---------- */
  F.dosEsferas = function () {
    var s = '', mesa = 60;
    s += rect(20, mesa, 90, 10, 's1') + line(100, mesa + 10, 100, 190, 'l');
    s += ground(10, 320, 190);
    s += circle(112, mesa - 9, 8, 'b1') + text(112, mesa - 22, 'A', 'tb', 'middle');
    s += circle(96, mesa - 9, 8, 'b2') + text(86, mesa - 22, 'B', 'ta', 'middle');
    s += arrow(122, mesa - 9, 160, mesa - 9, 'fb', 8) + text(166, mesa - 5, 'lanzada horizontalmente', 'tm');
    s += path('M112 ' + (mesa - 1) + ' Q 200 ' + (mesa + 10) + ' 250 188', 'd');
    s += line(96, mesa, 96, 188, 'd') + text(84, 125, 'B: se suelta', 'tm', 'end');
    return svg(330, 200, s, 'Dos esferas a la misma altura: A lanzada horizontalmente y B soltada');
  };
  F.parabola = function () {
    var s = '';
    s += ground(10, 320, 180);
    s += path('M30 178 Q 165 -70 300 178', 'd');
    s += circle(165, 54, 9, 'b1') + text(178, 44, 'punto más alto', 'tm');
    s += circle(30, 172, 6, 'b2') + arrow(30, 172, 75, 120, 'fb', 9);
    return svg(330, 195, s, 'Trayectoria parabólica de una pelota con el punto más alto marcado');
  };
  F.circular = function () {
    var s = '', cx = 150, cy = 105, R = 75;
    s += circle(cx, cy, R, 'lc') + circle(cx, cy, 3, 'dot') + text(cx + 8, cy + 16, 'centro', 'tm');
    s += circle(cx + R, cy, 9, 'b1') + text(cx + R + 14, cy + 5, 'P', 't');
    s += arrow(cx + R, cy - 10, cx + R, cy - 60, 'fb', 10) + text(cx + R + 8, cy - 48, 'v', 'tb');
    s += path('M' + (cx - R * 0.7) + ' ' + (cy + R * 0.7) + ' A ' + (R + 14) + ' ' + (R + 14) + ' 0 0 0 ' + (cx + R * 0.72) + ' ' + (cy + R * 0.76), 'd');
    s += text(cx, cy + R + 22, 'rapidez constante, sentido antihorario', 'tm', 'middle');
    return svg(300, 210, s, 'Objeto en movimiento circular uniforme en el punto P');
  };

  /* ---------- Dinámica ---------- */
  F.disco = function () {
    var s = rect(10, 120, 310, 22, 'ice') + text(165, 158, 'hielo sin fricción', 'tm', 'middle');
    s += '<ellipse class="s1" cx="120" cy="110" rx="32" ry="10"/>' + rect(88, 100, 64, 10, 's1') + '<ellipse class="s1" cx="120" cy="100" rx="32" ry="10"/>';
    s += arrow(160, 100, 240, 100, 'fb', 10) + text(250, 104, 'v constante', 'tb');
    return svg(330, 170, s, 'Disco deslizando con velocidad constante sobre hielo');
  };
  // fuerzas sobre un bloque: [{dir:'der'|'izq'|'arr'|'abj', lab, len, c}]
  F.bloqueFuerzas = function (o) {
    var s = ground(10, 330, 140), x = 130, y = 90, w = 70, h = 50;
    s += rect(x, y, w, h, 's1') + text(x + w / 2, y + 30, o.masa, 't', 'middle');
    (o.fuerzas || []).forEach(function (f) {
      var L = f.len || 70, c = f.c || 'fa', tc = c === 'fb' ? 'tb' : 'ta';
      if (f.dir === 'der') { s += arrow(x + w, y + 25, x + w + L, y + 25, c); s += text(x + w + L + 4, y + 22, f.lab, tc); }
      if (f.dir === 'izq') { s += arrow(x, y + 25, x - L, y + 25, c); s += text(x - L - 4, y + 22, f.lab, tc, 'end'); }
    });
    if (o.nota) s += text(170, 166, o.nota, 'tm', 'middle');
    return svg(340, 175, s, 'Bloque de ' + o.masa + ' con fuerzas horizontales');
  };
  F.camionAuto = function () {
    var s = ground(5, 335, 150);
    s += rect(20, 70, 110, 60, 's1') + rect(130, 92, 40, 38, 's1') + circle(50, 138, 12, 'wh') + circle(150, 138, 12, 'wh');
    s += text(75, 105, 'camión', 't', 'middle');
    s += path('M190 130 L190 108 L210 96 L250 96 L268 110 L290 112 L290 130 Z', 's1') + circle(208, 138, 10, 'wh') + circle(272, 138, 10, 'wh');
    s += text(240, 124, 'auto', 'tm', 'middle');
    s += arrow(70, 50, 120, 50, 'fb', 9) + arrow(290, 60, 245, 60, 'fb', 9);
    s += text(176, 40, 'choque de frente', 'tm', 'middle');
    return svg(340, 170, s, 'Camión y auto pequeño que chocan de frente');
  };
  F.libroMesa = function () {
    var s = rect(40, 110, 250, 12, 's1') + rect(60, 122, 12, 60, 's1') + rect(258, 122, 12, 60, 's1') + ground(10, 330, 182);
    s += rect(120, 86, 90, 24, 'b1r') + text(165, 103, 'libro', 'tm', 'middle');
    return svg(340, 195, s, 'Libro en reposo sobre una mesa');
  };
  F.plano = function (o) {
    var a = o.ang * Math.PI / 180, x0 = 30, y0 = 175, s = '';
    var L = Math.min(280, 150 / Math.tan(a));   // que el vértice superior quepa en el dibujo
    var xt = x0 + L;
    var hy = y0 - (xt - x0) * Math.tan(a);
    s += poly([[x0, y0], [xt, y0], [xt, hy]], 'inc');
    s += arc(x0, y0, 46, 0, o.ang, 'lt') + text(x0 + 52, y0 - 8, o.ang + '°', 't');
    // bloque sobre el plano
    var cx = x0 + 0.6 * L, cy = y0 - 0.6 * L * Math.tan(a), bw = 54, bh = 34, ca = Math.cos(a), sa = Math.sin(a);
    var p1 = [cx - bw / 2 * ca, cy + bw / 2 * sa], p2 = [cx + bw / 2 * ca, cy - bw / 2 * sa];
    var p3 = [p2[0] - bh * sa, p2[1] - bh * ca], p4 = [p1[0] - bh * sa, p1[1] - bh * ca];
    s += poly([p1, p2, p3, p4], 's1');
    s += text((p1[0] + p3[0]) / 2, (p1[1] + p3[1]) / 2 + 4, o.masa, 'tm', 'middle');
    if (o.nota) s += text(170, 196, o.nota, 'tm', 'middle');
    return svg(340, 205, s, 'Bloque de ' + o.masa + ' sobre un plano inclinado a ' + o.ang + ' grados');
  };
  F.ascensor = function (o) {
    var s = rect(90, 20, 150, 170, 'cab') + line(165, 0, 165, 20, 'l');
    s += rect(130, 168, 70, 12, 's1') + text(165, 178, 'báscula', 'tm', 'middle');
    s += circle(165, 85, 12, 's1') + line(165, 97, 165, 135, 'l') + line(165, 135, 150, 166, 'l') + line(165, 135, 180, 166, 'l') + line(165, 108, 145, 125, 'l') + line(165, 108, 185, 125, 'l');
    s += text(200, 92, o.masa, 'tm');
    s += arrow(256, 140, 256, 60, 'fb', 10) + text(264, 104, 'a = ' + o.a, 'tb');
    return svg(340, 200, s, 'Persona sobre una báscula dentro de un ascensor que acelera hacia arriba');
  };
  F.dosBloques = function (o) {
    var s = ground(10, 330, 150);
    s += rect(110, 100, 60, 50, 's1') + text(140, 130, o.m1, 't', 'middle');
    s += rect(170, 85, 80, 65, 's1') + text(210, 122, o.m2, 't', 'middle');
    s += arrow(40, 125, 108, 125, 'fa', 10) + text(56, 116, o.F, 'ta');
    s += text(170, 170, 'superficie sin fricción', 'tm', 'middle');
    return svg(340, 180, s, 'Dos bloques en contacto empujados por una fuerza');
  };

  /* ---------- Energía ---------- */
  F.cajaCuerda = function (o) {
    var s = ground(10, 330, 150), a = o.ang * Math.PI / 180;
    s += rect(90, 105, 70, 45, 's1');
    var x2 = 160 + 110 * Math.cos(a), y2 = 110 - 110 * Math.sin(a);
    s += arrow(160, 110, x2, y2, 'fa', 11) + text(x2 + 6, y2 + 4, o.F, 'ta');
    s += line(160, 110, 260, 110, 'd') + arc(160, 110, 34, 0, o.ang, 'lt') + text(198, 98, o.ang + '°', 'tm');
    s += arrow(90, 172, 90 + 120, 172, 'fb', 8) + text(150, 192, 'se desplaza ' + o.d, 'tb', 'middle');
    return svg(340, 200, s, 'Caja jalada con una fuerza inclinada mientras se desplaza horizontalmente');
  };
  F.alturaBola = function (o) {
    var s = ground(10, 330, 180);
    s += circle(120, 34, 11, 'b1') + text(140, 38, 'en reposo', 'tm');
    s += line(120, 46, 120, 175, 'd');
    s += line(220, 34, 220, 180, 'lt') + line(212, 34, 228, 34, 'lt') + text(232, 112, 'h = ' + o.h, 't');
    return svg(340, 195, s, 'Pelota soltada desde una altura ' + o.h);
  };
  F.montana = function () {
    var s = '', base = 190, k = 7; // 1 m = 7 px
    function Y(h) { return base - h * k; }
    var d = 'M20 ' + Y(20) + ' C 70 ' + Y(20) + ', 80 ' + Y(0) + ', 130 ' + Y(0) + ' S 190 ' + Y(10) + ', 220 ' + Y(10) + ' S 280 ' + Y(4) + ', 320 ' + Y(4);
    s += ground(10, 335, base) + path(d, 'l');
    s += circle(22, Y(20) - 8, 7, 'b1') + text(30, Y(20) - 14, 'A (reposo)', 'tm');
    s += circle(130, Y(0) - 7, 4, 'dot') + text(130, Y(0) - 14, 'B', 't', 'middle');
    s += circle(220, Y(10) - 7, 4, 'dot') + text(220, Y(10) - 14, 'C', 't', 'middle');
    s += line(8, Y(20), 8, base, 'lt') + text(12, Y(8), '20 m', 'tm');
    s += line(220, Y(10) - 4, 220, base, 'd') + text(226, Y(4), '10 m', 'tm');
    return svg(340, 205, s, 'Montaña rusa: A a 20 m, B en el suelo y C a 10 m de altura');
  };
  F.resorte = function (o) {
    var s = ground(10, 330, 150) + rect(20, 60, 14, 90, 's1');
    var pts = [[34, 115]], n = 10, x0 = 34, x1 = 150;
    for (var i = 1; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, 115 + (i % 2 ? -14 : 14)]);
    pts.push([x1, 115]);
    s += polyline(pts, 'l') + rect(150, 95, 50, 45, 's1');
    s += line(200, 85, 200, 150, 'd') + line(240, 85, 240, 150, 'd');
    s += arrow(240, 80, 202, 80, 'fb', 8) + text(220, 70, 'x = ' + o.x, 'tb', 'middle');
    s += text(90, 95, 'k = ' + o.k, 'tm', 'middle') + text(240, 170, 'longitud natural', 'tm', 'middle');
    return svg(340, 178, s, 'Resorte comprimido una distancia ' + o.x);
  };

  /* ---------- Cantidad de movimiento ---------- */
  function carrito(x, y, w, lab, c) {
    return rect(x, y, w, 34, c || 's1') + circle(x + 12, y + 40, 7, 'wh') + circle(x + w - 12, y + 40, 7, 'wh') + text(x + w / 2, y + 22, lab, 'tm', 'middle');
  }
  F.carrito = function (o) {
    var s = ground(10, 330, 140) + carrito(110, 92, 80, o.m);
    s += arrow(195, 108, 265, 108, 'fb', 10) + text(270, 112, o.v, 'tb');
    return svg(340, 155, s, 'Carrito de ' + o.m + ' moviéndose a ' + o.v);
  };
  F.choque = function (o) {
    var s = ground(10, 330, 140) + carrito(40, 92, 70, o.m1) + carrito(190, 92, 90, o.m2, 'b2r');
    s += arrow(114, 108, 170, 108, 'fb', 10) + text(118, 84, o.v1, 'tb') + text(235, 84, 'en reposo', 'tm', 'middle');
    s += text(170, 165, 'quedan unidos después del choque', 'tm', 'middle');
    return svg(340, 175, s, 'Carrito en movimiento que choca con otro en reposo y quedan unidos');
  };
  F.patinadora = function (o) {
    var s = ground(10, 330, 165);
    s += circle(100, 60, 11, 's1') + line(100, 71, 100, 120, 'l') + line(100, 120, 88, 158, 'l') + line(100, 120, 112, 158, 'l');
    s += line(100, 85, 135, 80, 'l') + line(100, 85, 75, 100, 'l') + line(78, 160, 98, 160, 'l') + line(102, 160, 122, 160, 'l');
    s += circle(150, 78, 8, 'b1') + arrow(162, 78, 230, 78, 'fb', 10) + text(236, 82, o.v, 'tb');
    s += text(150, 62, o.mb, 'tm', 'middle') + text(60, 140, o.mp, 'tm', 'end');
    return svg(340, 180, s, 'Patinadora en reposo que lanza una pelota hacia adelante');
  };
  F.pulsos = function () {
    return F.grafica({
      xmax: 10, ymax: 10, xstep: 2, ystep: 2, xlab: 'tiempo (ms)', ylab: 'fuerza (kN)',
      series: [{ pts: [[1, 0], [2, 4], [3, 10], [4, 4], [5, 0]], c: 'fa ln' },
               { pts: [[1, 0], [3, 2], [5, 2.6], [7, 2], [9, 0]], c: 'fb ln' }],
      etiquetas: [{ x: 6.2, y: 8.6, lab: '← sin bolsa de aire', c: 'ta' }, { x: 7.8, y: 4.2, lab: 'con bolsa de aire', c: 'tb' }],
      alt: 'Fuerza contra tiempo en un choque con y sin bolsa de aire'
    });
  };

  /* ---------- Fluidos ---------- */
  F.recipiente = function (o) {
    var s = path('M60 30 L60 180 L270 180 L270 30', 'l') + rect(61, 50, 208, 129, 'w');
    s += line(60, 50, 270, 50, 'wl') + text(280, 54, 'superficie', 'tm');
    s += circle(165, 130, 5, 'dot') + text(175, 134, 'P', 't');
    s += line(130, 50, 130, 130, 'lt') + line(124, 130, 136, 130, 'lt') + text(124, 95, o.h, 'tm', 'end');
    return svg(340, 195, s, 'Recipiente con agua y un punto P a ' + o.h + ' de profundidad');
  };
  F.vasos = function () {
    var s = '', base = 170, top = 60;
    s += poly([[30, top], [110, top], [90, base], [50, base]], 'w') + path('M30 ' + (top - 20) + ' L50 ' + base + ' L90 ' + base + ' L110 ' + (top - 20), 'l');
    s += rect(141, top, 50, base - top, 'w') + path('M140 ' + (top - 20) + ' L140 ' + base + ' L192 ' + base + ' L192 ' + (top - 20), 'l');
    s += poly([[255, top], [285, top], [320, base], [220, base]], 'w') + path('M260 ' + (top - 20) + ' L220 ' + base + ' L320 ' + base + ' L280 ' + (top - 20), 'l');
    s += text(70, base + 18, '1', 't', 'middle') + text(166, base + 18, '2', 't', 'middle') + text(270, base + 18, '3', 't', 'middle');
    s += line(10, top, 330, top, 'd') + text(170, top - 28, 'misma altura de agua', 'tm', 'middle');
    return svg(340, 195, s, 'Tres recipientes de formas distintas con agua hasta la misma altura');
  };
  F.dinamometro = function (o) {
    var s = line(170, 0, 170, 20, 'l') + rect(158, 20, 24, 50, 's1') + text(190, 50, 'dinamómetro', 'tm') + line(170, 70, 170, 105, 'l');
    s += path('M70 60 L70 190 L270 190 L270 60', 'l') + rect(71, 80, 198, 109, 'w') + line(70, 80, 270, 80, 'wl');
    s += rect(140, 105, 60, 45, 's1') + text(170, 132, o.m, 'tm', 'middle');
    s += text(170, 176, 'V = ' + o.V, 'tm', 'middle');
    return svg(340, 200, s, 'Bloque colgado de un dinamómetro y sumergido en agua');
  };
  F.tubo = function (o) {
    var s = path('M20 50 L140 50 C170 50, 180 85, 210 85 L320 85', 'l') + path('M20 150 L140 150 C170 150, 180 115, 210 115 L320 115', 'l');
    s += rect(20, 51, 120, 98, 'w') + poly([[140, 51], [210, 86], [320, 86], [320, 114], [210, 114], [140, 149]], 'w');
    s += arrow(40, 100, 100, 100, 'fb', 10) + text(70, 90, o.v1, 'tb', 'middle');
    s += text(80, 172, 'A₁ = ' + o.A1, 'tm', 'middle') + text(265, 140, 'A₂ = ' + o.A2, 'tm', 'middle');
    s += text(265, 75, 'v₂ = ?', 'tb', 'middle');
    return svg(340, 185, s, 'Tubería que se angosta de área ' + o.A1 + ' a ' + o.A2);
  };

  /* ---------- Calor ---------- */
  F.dosVasosTemp = function () {
    var s = path('M40 70 L50 180 L110 180 L120 70', 'l') + poly([[44, 120], [114, 120], [110, 179], [50, 179]], 'w');
    s += path('M170 40 L185 180 L285 180 L300 40', 'l') + poly([[174, 70], [297, 70], [285, 179], [185, 179]], 'w');
    s += text(80, 150, '100 g', 'tm', 'middle') + text(235, 130, '500 g', 'tm', 'middle');
    s += text(80, 200, '80 °C', 't', 'middle') + text(235, 200, '80 °C', 't', 'middle');
    return svg(340, 210, s, 'Dos vasos con agua a 80 grados: uno de 100 g y otro de 500 g');
  };

  /* ---------- Ondas ---------- */
  F.onda = function (o) {
    var W = 340, H = 204, L = 54, R = 14, mid = 90, ux = (W - L - R) / o.xmax, A = 50, s = '';
    for (var x = 0; x <= o.xmax; x += 1) { s += line(L + x * ux, 20, L + x * ux, 160, 'g'); s += text(L + x * ux, 176, String(x), 'tm', 'middle'); }
    s += line(L, mid, W - R, mid, 'lt') + line(L, 20, L, 160, 'lt');
    var pts = [];
    for (var i = 0; i <= 160; i++) { var xx = o.xmax * i / 160; pts.push([L + xx * ux, mid - A * Math.sin(2 * Math.PI * xx / o.lambda)]); }
    s += polyline(pts, 'fa ln');
    s += text(L - 6, mid - A + 4, '+' + o.amp, 'tm', 'end') + text(L - 6, mid + A + 4, '−' + o.amp, 'tm', 'end');
    s += line(L - 3, mid - A, L + 3, mid - A, 'lt') + line(L - 3, mid + A, L + 3, mid + A, 'lt');
    s += text(W - R, 198, 'x (m)', 'tm', 'end');
    if (o.p) { var px = L + o.p * ux, py = mid - A * Math.sin(2 * Math.PI * o.p / o.lambda); s += circle(px, py, 6, 'b1') + text(px + 9, py - 8, 'P', 't'); }
    if (o.dir) s += arrow(W - 95, 28, W - 35, 28, 'fb', 9) + text(W - 100, 32, 'la onda avanza', 'tb', 'end');
    return svg(W, H, s, o.alt || 'Onda sinusoidal');
  };
  F.eco = function () {
    var s = ground(10, 330, 170) + rect(290, 30, 22, 140, 'wall') + text(300, 22, 'pared', 'tm', 'middle');
    s += circle(40, 100, 9, 's1') + line(40, 109, 40, 140, 'l') + line(40, 140, 32, 168, 'l') + line(40, 140, 48, 168, 'l');
    for (var k = 0; k < 3; k++) s += path('M' + (60 + k * 10) + ' 88 Q ' + (68 + k * 10) + ' 100 ' + (60 + k * 10) + ' 112', 'lt');
    s += arrow(70, 70, 280, 70, 'fb', 9) + arrow(280, 82, 70, 82, 'fa', 9);
    s += line(40, 190, 290, 190, 'lt') + text(165, 186, 'd = ?', 't', 'middle');
    return svg(340, 200, s, 'Persona que grita frente a una pared y escucha el eco');
  };

  /* ---------- Electricidad ---------- */
  function resistor(x, y, w, vert, lab) { // horizontal por defecto: de (x,y) a (x+w,y)
    var pts = [], n = 6, i;
    if (!vert) { pts.push([x, y]); for (i = 1; i < n; i++) pts.push([x + w * i / n, y + (i % 2 ? -8 : 8)]); pts.push([x + w, y]); }
    else { pts.push([x, y]); for (i = 1; i < n; i++) pts.push([x + (i % 2 ? -8 : 8), y + w * i / n]); pts.push([x, y + w]); }
    return polyline(pts, 'l') + (lab ? (vert ? text(x + 14, y + w / 2 + 4, lab, 'tm') : text(x + w / 2, y - 14, lab, 'tm', 'middle')) : '');
  }
  function bateria(x, y, lab) { // vertical, borne + arriba
    return line(x - 16, y - 6, x + 16, y - 6, 'l') + line(x - 9, y + 6, x + 9, y + 6, 'lw') +
      text(x - 24, y + 4, lab, 'tm', 'end') + text(x + 22, y - 6, '+', 'tm');
  }
  function bombillo(x, y, lab) {
    return circle(x, y, 13, 'bulb') + line(x - 9, y - 9, x + 9, y + 9, 'lt') + line(x - 9, y + 9, x + 9, y - 9, 'lt') + text(x + 18, y - 12, lab, 't');
  }
  F.circuito = function (o) { // o.tipo: 'uno' | 'serie' | 'paralelo'
    var s = '', L = 60, R = 280, T = 40, B = 160;
    if (o.tipo === 'uno') {
      s += line(L, T, L, 94, 'l') + line(L, 106, L, B, 'l') + bateria(L, 100, o.V);
      s += line(L, T, 130, T, 'l') + resistor(130, T, 80, false, o.R[0]) + line(210, T, R, T, 'l') + line(R, T, R, B, 'l') + line(R, B, L, B, 'l');
    } else if (o.tipo === 'serie') {
      s += line(L, T, L, 94, 'l') + line(L, 106, L, B, 'l') + bateria(L, 100, o.V);
      s += line(L, T, 110, T, 'l') + resistor(110, T, 60, false, o.R[0]) + line(170, T, 200, T, 'l') + resistor(200, T, 60, false, o.R[1]) + line(260, T, R, T, 'l');
      s += line(R, T, R, B, 'l') + line(R, B, L, B, 'l');
    } else {
      s += line(L, T, L, 94, 'l') + line(L, 106, L, B, 'l') + bateria(L, 100, o.V);
      s += line(L, T, 260, T, 'l') + line(L, B, 260, B, 'l');
      s += line(170, T, 170, 70, 'l') + resistor(170, 70, 60, true, o.R[0]) + line(170, 130, 170, B, 'l');
      s += line(260, T, 260, 70, 'l') + resistor(260, 70, 60, true, o.R[1]) + line(260, 130, 260, B, 'l');
    }
    return svg(340, 185, s, 'Circuito ' + o.tipo + ' con batería de ' + o.V);
  };
  F.bombillos = function () {
    var s = '', L = 50, T = 40, B = 170;
    s += line(L, T, L, 99, 'l') + line(L, 111, L, B, 'l') + bateria(L, 105, '');
    s += line(L, T, 115, T, 'l') + bombillo(128, T, 'A') + line(141, T, 300, T, 'l');
    s += line(210, T, 210, 92, 'l') + bombillo(210, 105, 'B') + line(210, 118, 210, B, 'l');
    s += line(300, T, 300, 92, 'l') + bombillo(300, 105, 'C') + line(300, 118, 300, B, 'l');
    s += line(L, B, 300, B, 'l');
    return svg(340, 185, s, 'Bombillo A en serie con los bombillos B y C, que están en paralelo');
  };
  F.cargas = function () {
    var s = circle(80, 70, 16, 'qp') + text(80, 76, '+q', 't', 'middle') + circle(260, 70, 16, 'qp') + text(260, 76, '+q', 't', 'middle');
    s += line(80, 110, 260, 110, 'lt') + line(80, 104, 80, 116, 'lt') + line(260, 104, 260, 116, 'lt') + text(170, 128, 'd', 't', 'middle');
    s += arrow(64, 70, 24, 70, 'fa', 9) + arrow(276, 70, 316, 70, 'fa', 9) + text(30, 58, 'F', 'ta') + text(304, 58, 'F', 'ta');
    return svg(340, 140, s, 'Dos cargas iguales separadas una distancia d que se repelen con fuerza F');
  };

  /* ---------- Óptica ---------- */
  F.espejoRayo = function (o) {
    var s = rect(40, 160, 260, 10, 'mir') + ground(40, 300, 170);
    s += line(170, 40, 170, 160, 'd') + text(176, 50, 'normal', 'tm');
    var a = o.ang * Math.PI / 180, L = 150;
    s += arrow(170 - L * Math.cos(a), 160 - L * Math.sin(a), 170, 160, 'fa', 11);
    s += arc(170, 160, 46, 180 - o.ang, 180, 'lt') + text(108, 150, o.ang + '°', 't', 'end');
    s += text(70, 70, 'rayo incidente', 'ta');
    return svg(340, 190, s, 'Rayo que incide sobre un espejo plano formando ' + o.ang + ' grados con la superficie');
  };
  F.refraccion = function () {
    var s = rect(20, 100, 300, 90, 'w') + line(20, 100, 320, 100, 'l');
    s += text(30, 30, 'aire', 't') + text(30, 180, 'agua', 't');
    s += line(170, 15, 170, 185, 'd') + text(176, 26, 'normal', 'tm');
    s += arrow(80, 25, 170, 100, 'fa', 11);
    return svg(340, 195, s, 'Rayo de luz que llega desde el aire a la superficie del agua');
  };
  F.espejoPersona = function () {
    var s = rect(260, 30, 10, 150, 'mir') + ground(10, 330, 180);
    s += circle(120, 80, 10, 's1') + line(120, 90, 120, 135, 'l') + line(120, 135, 110, 178, 'l') + line(120, 135, 130, 178, 'l');
    s += arrow(140, 110, 225, 110, 'fb', 10) + text(182, 100, 'se acerca', 'tb', 'middle');
    s += text(265, 22, 'espejo plano', 'tm', 'middle');
    return svg(340, 195, s, 'Persona que camina hacia un espejo plano');
  };
  F.lente = function () {
    var s = '', cx = 170, y = 110, f = 50;
    s += line(10, y, 330, y, 'lt') + '<ellipse class="lens" cx="' + cx + '" cy="' + y + '" rx="10" ry="70"/>';
    [-2, -1, 1, 2].forEach(function (k) { s += circle(cx + k * f, y, 3, 'dot') + text(cx + k * f, y + 18, (Math.abs(k) === 2 ? '2F' : 'F'), 'tm', 'middle'); });
    s += arrow(cx - 2 * f, y, cx - 2 * f, y - 45, 'fb', 10) + text(cx - 2 * f - 8, y - 50, 'objeto', 'tb', 'end');
    return svg(340, 200, s, 'Lente convergente con un objeto ubicado en 2F');
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F; else root.FIG = F;
})(this);
