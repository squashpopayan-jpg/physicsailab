/* ===================================================================
   Capítulo 6 — Las fuerzas y el diagrama de cuerpo libre
   Simulaciones: explorador-fuerzas, constructor-dcl,
                 sistemas-equilibrio, sistemas-movimiento
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const G = MC.K.g;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const RAD = Math.PI / 180;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* Tipos de fuerza, con los colores de todo el curso (a: artículo, u: indefinido, s: símbolo) */
  const FT = {
    w: { n: 'peso', a: 'el', u: 'un', s: 'w', c: '--weight' },
    n: { n: 'normal', a: 'la', u: 'una', s: 'n', c: '--normal' },
    T: { n: 'tensión', a: 'la', u: 'una', s: 'T', c: '--tension' },
    fs: { n: 'fricción estática', a: 'la', u: 'una', s: 'f_{s}', c: '--fric' },
    fk: { n: 'fricción cinética', a: 'la', u: 'una', s: 'f_{k}', c: '--fric' },
    F: { n: 'fuerza aplicada', a: 'la', u: 'una', s: 'F', c: '--force' },
    Fe: { n: 'fuerza elástica', a: 'la', u: 'una', s: 'F_{e}', c: '--c8' },
    D: { n: 'arrastre', a: 'el', u: 'un', s: 'F_{D}', c: '--c6' },
    B: { n: 'empuje', a: 'el', u: 'un', s: 'B', c: '--water' }
  };

  /* ---------- Utilidades de dibujo ---------- */
  /* longitud de flecha (px) que crece como la raíz de la fuerza (explorador) */
  const Lf = (F) => M.clamp(16 + 4.4 * Math.sqrt(Math.abs(F)), 12, 165);
  /* vector desde (x, y) px con ángulo matemático ang (rad) y longitud L (px) */
  const vecA = (ctx, x, y, ang, L, color, label, o = {}) => D.vec(ctx, x, y, L * Math.cos(ang), -L * Math.sin(ang), Object.assign({ color, label, size: 13 }, o));
  /* mano con antebrazo: la mano en (x, y) px y el brazo hacia el ángulo ang (rad) */
  function hand(ctx, x, y, ang, len = 38) {
    D.line(ctx, x, y, x + len * Math.cos(ang), y - len * Math.sin(ang), { color: '--body-c', width: 9 });
    D.circle(ctx, x, y, 7.5, { fill: '--body-c', color: 'none' });
  }
  /* persona de pie (pies en y = 0) que alcanza con una mano el punto (hx, hy) del mundo;
     side = +1 si es la mano derecha, −1 si es la izquierda; h = estatura (m) */
  function reach(ctx, V, hx, hy, side, h) {
    const S = 0.77 * h, al = 0.33 * h;
    const a = Math.asin(M.clamp((hy - S) / al, -1, 1));
    D.person(ctx, V.X(hx - side * al * Math.cos(a)), V.Y(0), V.L(h), { arms: 1 + (2 * a) / Math.PI, color: '--ink-2' });
  }
  /* punto fijo de una cuerda: perno y base rayada; ang = dirección de la cuerda hacia el perno */
  function anchor(ctx, x, y, ang) {
    const ux = Math.cos(ang), uy = -Math.sin(ang), px = -uy, py = ux, bx = x + ux * 6, by = y + uy * 6;
    D.line(ctx, bx - px * 13, by - py * 13, bx + px * 13, by + py * 13, { color: '--ink-2', width: 2 });
    for (let k = -11; k <= 11; k += 5.5) D.line(ctx, bx + px * k, by + py * k, bx + px * (k + 4) + ux * 6, by + py * (k + 4) + uy * 6, { color: '--ink-3', width: 1 });
    D.circle(ctx, x, y, 3.5, { fill: '--ink-2' });
  }
  /* símbolo ⊗: vector que entra en la pantalla */
  function intoScreen(ctx, x, y, r, color) {
    D.circle(ctx, x, y, r, { color, width: 1.8, fill: '--canvas' });
    const d = r * 0.6;
    D.line(ctx, x - d, y - d, x + d, y + d, { color, width: 1.8 });
    D.line(ctx, x - d, y + d, x + d, y - d, { color, width: 1.8 });
  }
  /* tramo de cuerda que abraza una polea (ángulos del lienzo) */
  function ropeArc(ctx, x, y, r, a0, a1, ccw) {
    ctx.save();
    ctx.strokeStyle = MC.col('--rope');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, a0, a1, ccw);
    ctx.stroke();
    ctx.restore();
  }
  /* reparte n paneles: en fila si caben, apilados en pantallas angostas */
  function panels(cv, n) {
    const narrow = cv.w < 520;
    const want = narrow ? cv.w / (n * 150 + 8 * (n - 1) + 16) : n > 2 ? 2.7 : 2.2;
    if (Math.abs((cv._asp || 0) - want) > 0.01) { cv._asp = want; cv.wrap.style.aspectRatio = String(want); }
    const gap = 8, W = cv.w - 16, H = cv.h - 16;
    const pw = (W - gap * (n - 1)) / n, ph = (H - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => (narrow ? { x: 8, y: 8 + i * (ph + gap), w: W, h: ph, cdy: 5 } : { x: 8 + i * (pw + gap), y: 8, w: pw, h: H }));
  }
  /* polígono de fuerzas (punta con cola); si no se cierra, muestra la resultante */
  function polygon(ctx, forces, P, title) {
    const { x, y, w, h } = P;
    D.panel(ctx, x, y, w, h, { title });
    const pts = [[0, 0]];
    let px = 0, py = 0;
    forces.forEach((f) => { px += f.fx; py += f.fy; pts.push([px, py]); });
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const span = Math.max(maxx - minx, maxy - miny, 1e-9);
    const sc = Math.min((w - 52) / Math.max(maxx - minx, span * 0.2), (h - 66) / Math.max(maxy - miny, span * 0.2));
    const ox = x + w / 2 - ((minx + maxx) / 2) * sc, oy = y + 4 + h / 2 + ((miny + maxy) / 2) * sc;
    for (let i = 0; i < forces.length; i++) {
      const a = [ox + pts[i][0] * sc, oy - pts[i][1] * sc], b = [ox + pts[i + 1][0] * sc, oy - pts[i + 1][1] * sc];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 2) continue;
      D.arrow(ctx, a[0], a[1], b[0], b[1], { color: forces[i].color, width: 2.2, dash: forces[i].dash });
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      MC.text(ctx, forces[i].label, mx + ((b[1] - a[1]) / L) * 12, my - ((b[0] - a[0]) / L) * 12, { size: 12, math: true, color: forces[i].color, halo: true, align: 'center', baseline: 'middle' });
    }
    if (Math.hypot(px, py) > span * 0.01) {
      D.arrow(ctx, ox, oy, ox + px * sc, oy - py * sc, { color: '--fnet', width: 1.8, dash: [5, 4] });
      MC.text(ctx, 'no se cierra: ΣF ≠ 0', x + w - 8, y + h - 8, { size: 11, color: '--warn-ink', align: 'right', weight: 700 });
    } else MC.text(ctx, 'se cierra: ΣF = 0', x + w - 8, y + h - 8, { size: 11, color: '--vel', align: 'right', weight: 600 });
  }
  const fmtN = (v) => `${f1(v)} N`;
  /* rótulo de masa en la parte alta de un bloque (el centro queda libre para las flechas) */
  function massTag(ctx, x, y, txt, size = 10.5) { MC.text(ctx, txt, x, y, { size, align: 'center', baseline: 'middle', color: '--body-ink', weight: 600 }); }
  /* DCL con escalas distintas en x y en y (sólo para fuerzas horizontales y verticales) */
  function fbdXY(ctx, forces, o) {
    const ml = Math.min(o.w, o.h) * 0.33;
    const mx = Math.max(1e-9, ...forces.map((f) => Math.abs(f.fx))), my = Math.max(1e-9, ...forces.map((f) => Math.abs(f.fy)));
    const sx = (o.sx || ml / mx), sy = (o.sy || ml / my);
    /* una fuerza pequeña pero no nula se dibuja con al menos 12 px para que se vea */
    const grow = (v) => (v !== 0 && Math.abs(v) < 12 ? Math.sign(v) * 12 : v);
    D.fbd(ctx, forces.map((f) => Object.assign({}, f, { fx: grow(f.fx * sx), fy: grow(f.fy * sy) })), Object.assign({}, o, { scale: 1 }));
  }

  /* ======================================================================
     6.2  Explorador de fuerzas
     ====================================================================== */
  const MATS_B = {
    corcho: ['Corcho', 240, '--wood'], madera: ['Madera', 600, '--wood'], hielo: ['Hielo', 917, '--glass'],
    aluminio: ['Aluminio', 2700, '--metal'], hierro: ['Hierro', 7870, '--metal']
  };
  const PLACE = { tierra: 'La Tierra', luna: 'La Luna', marte: 'Marte', jupiter: 'Júpiter' };
  MC.defineSim('explorador-fuerzas', function (sim) {
    const cv = sim.canvas({ aspect: 1.45, cls: 'fixed' });
    const card = MC.el('div', 'fcard');
    sim.stage.append(card);
    const view = new MC.View2D(cv, { xmin: -3.2, xmax: 3.2, ymin: -1.2, ymax: 3.2, align: 'bottom', padB: 4 });
    sim.group('Fuerza');
    sim.select('f', {
      label: 'Fuerza que quiere estudiar', value: 'normal',
      options: [['peso', 'Peso'], ['normal', 'Fuerza normal'], ['tension', 'Tensión de una cuerda'], ['friccion', 'Fricción estática y cinética'], ['elastica', 'Fuerza elástica (resorte)'], ['aplicada', 'Fuerza aplicada'], ['arrastre', 'Arrastre de un fluido'], ['empuje', 'Empuje de un fluido']]
    });
    const gm = sim.group('Cuerpo');
    sim.slider('m', { label: 'Masa del cuerpo <i>m</i>', min: 0.5, max: 80, step: 0.5, value: 10, unit: 'kg', fmt: f1 });
    const gP = sim.group('Peso');
    sim.select('pl', { label: 'Lugar', value: 'tierra', options: MC.planetOptions(['tierra', 'luna', 'marte', 'jupiter']) });
    const gN = sim.group('Normal');
    sim.slider('th', { label: 'Inclinación de la superficie θ', min: 0, max: 60, step: 1, value: 25, unit: '°', fmt: f0 });
    sim.slider('P', { label: 'Mano perpendicular a la superficie: aprieta (+) o tira (−)', min: -150, max: 150, step: 1, value: 0, unit: 'N', fmt: f0 });
    const gT = sim.group('Tensión');
    sim.slider('phi', { label: 'Ángulo de la cuerda en la mano (desde la vertical)', min: 0, max: 60, step: 1, value: 20, unit: '°', fmt: f0 });
    const gF = sim.group('Fricción');
    sim.slider('Fx', { label: 'Empujón horizontal <i>F</i>', min: 0, max: 400, step: 1, value: 40, unit: 'N', fmt: f0 });
    sim.slider('mus', { label: 'Coeficiente estático μ<sub>s</sub>', min: 0.1, max: 1, step: 0.01, value: 0.5, fmt: f2 });
    sim.slider('muk', { label: 'Coeficiente cinético μ<sub>k</sub>', min: 0.05, max: 1, step: 0.01, value: 0.35, fmt: f2 });
    const gE = sim.group('Fuerza elástica');
    sim.slider('k', { label: 'Constante del resorte <i>k</i>', min: 10, max: 500, step: 5, value: 120, unit: 'N/m', fmt: f0 });
    sim.slider('x', { label: 'Deformación <i>x</i> (+ estirado, − comprimido)', min: -0.3, max: 0.3, step: 0.005, value: 0.15, unit: 'm', fmt: f3 });
    const gA = sim.group('Fuerza aplicada');
    sim.slider('Fa', { label: 'Magnitud de la fuerza <i>F</i>', min: 0, max: 300, step: 1, value: 100, unit: 'N', fmt: f0 });
    sim.slider('ang', { label: 'Ángulo con la horizontal α (− hacia abajo)', min: -60, max: 60, step: 1, value: -30, unit: '°', fmt: f0 });
    const gD = sim.group('Arrastre');
    sim.select('fl', { label: 'Fluido', value: 'aire', options: [['aire', 'Aire (1.2 kg/m³)'], ['agua', 'Agua (1000 kg/m³)']] });
    sim.slider('v', { label: 'Rapidez de la esfera <i>v</i>', min: 0, max: 40, step: 0.5, value: 15, unit: 'm/s', fmt: f1 });
    sim.slider('r', { label: 'Radio de la esfera', min: 1, max: 30, step: 0.5, value: 11, unit: 'cm', fmt: f1 });
    const gB = sim.group('Empuje');
    sim.select('mat', { label: 'Material del bloque', value: 'madera', options: Object.keys(MATS_B).map((k) => [k, `${MATS_B[k][0]} (${MATS_B[k][1]} kg/m³)`]) });
    sim.slider('V', { label: 'Volumen del bloque', min: 0.5, max: 30, step: 0.5, value: 10, unit: 'L', fmt: f1 });
    sim.slider('sub', { label: 'Parte sumergida', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => `${f0(v * 100)} %` });
    sim.out('val', 'Valor de la fuerza', { hl: true });
    sim.presets([
      { id: 'libro', label: 'Peso de un libro de 1.5 kg', v: { f: 'peso', m: 1.5, pl: 'tierra' } },
      { id: 'luna', label: 'Una persona de 60 kg en la Luna', v: { f: 'peso', m: 60, pl: 'luna' }, note: 'La masa no cambia; el peso es seis veces menor que en la Tierra: 97 N en vez de 588 N.' },
      { id: 'rampa', label: 'Normal en una rampa de 30°', v: { f: 'normal', m: 10, th: 30, P: 0 }, note: 'n = mg cos 30° = 84.9 N, menor que el peso de 98 N.' },
      { id: 'despega', label: 'Tirar de un bloque hasta despegarlo', v: { f: 'normal', m: 5, th: 0, P: -60 }, note: 'La mano tira con 60 N y el peso es de 49 N: el bloque se despega y la normal desaparece.' },
      { id: 'pozo', label: 'La cuerda del pozo', v: { f: 'tension', m: 12, phi: 20 } },
      { id: 'estatica', label: 'Empujar un mueble que no se mueve', v: { f: 'friccion', m: 20, Fx: 60, mus: 0.5, muk: 0.35 }, note: 'La fricción estática vale 60 N, lo mismo que el empujón, aunque podría llegar a 98 N.' },
      { id: 'cinetica', label: 'Empujar hasta que desliza', v: { f: 'friccion', m: 20, Fx: 110, mus: 0.5, muk: 0.35 }, note: 'Se superó el máximo de 98 N: ahora actúa la cinética, 68.6 N, y sobra fuerza para acelerar.' },
      { id: 'resorte', label: 'Un resorte estirado', v: { f: 'elastica', k: 120, x: 0.15 } },
      { id: 'podadora', label: 'Empujar una podadora (100 N a 30° hacia abajo)', v: { f: 'aplicada', m: 20, Fa: 100, ang: -30 }, note: 'n = 196 + 50 = 246 N: empujar hacia abajo aumenta la normal.' },
      { id: 'maleta', label: 'Jalar una maleta (100 N a 30° hacia arriba)', v: { f: 'aplicada', m: 20, Fa: 100, ang: 30 }, note: 'n = 196 − 50 = 146 N: tirar hacia arriba la disminuye.' },
      { id: 'balon', label: 'Balón de fútbol pateado a 25 m/s', v: { f: 'arrastre', fl: 'aire', v: 25, r: 11 } },
      { id: 'flota', label: 'Bloque de madera en el agua', v: { f: 'empuje', mat: 'madera', V: 10, sub: 0.6 }, note: 'Con el 60 % sumergido, el empuje iguala al peso: así flota la madera sola.' }
    ]);
    const GR = { peso: gP, normal: gN, tension: gT, friccion: gF, elastica: gE, aplicada: gA, arrastre: gD, empuje: gB };
    const MASS = { peso: 1, normal: 1, tension: 1, friccion: 1, aplicada: 1 };
    sim.onChange = () => {
      const f = sim.p.f;
      Object.keys(GR).forEach((k) => { GR[k].hidden = k !== f; });
      gm.hidden = !MASS[f];
      if (sim.p.muk > sim.p.mus) sim.ctl.muk.set(sim.p.mus, true);
    };
    sim.onChange();
    const info = (nom, autor, dir, mag, val, nota) => {
      card.innerHTML = `<h4>${nom}</h4><dl><dt>La ejerce</dt><dd>${autor}</dd><dt>Dirección</dt><dd>${dir}</dd><dt>Magnitud</dt><dd>${mag}</dd><dt>Aquí vale</dt><dd class="v">${MC.supHTML(val)}</dd></dl><p>${nota}</p>`;
      sim.set('val', val);
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      view.update();
      D.clear(cv);
      view.grid({ labels: false });
      const X = (x) => view.X(x), Y = (y) => view.Y(y);
      const kp = view.s / 90, Lx = (F) => Lf(F) * kp;
      const ground = () => {
        ctx.save();
        ctx.fillStyle = MC.alpha('--ground-fill', 0.55);
        ctx.fillRect(0, Y(0), cv.w, cv.h - Y(0));
        ctx.restore();
        D.ground(ctx, 0, Y(0), cv.w, { depth: 10 });
      };
      if (p.f === 'peso') {
        const g = MC.gOf(p.pl), w = p.m * g, s = 0.42 + 0.3 * Math.cbrt(p.m / 80), yt = 1.25, cy = yt + s / 2;
        ground();
        D.block(ctx, X(-1.3), Y(yt) + 5, view.L(2.0), 10, { fill: '--wood', r: 2 });
        D.line(ctx, X(-2.1), Y(yt) + 10, X(-2.1), Y(0), { color: '--wood', width: 6 });
        D.line(ctx, X(-0.5), Y(yt) + 10, X(-0.5), Y(0), { color: '--wood', width: 6 });
        const L = Math.min(Lx(w), Y(-0.95) - Y(cy));
        D.block(ctx, X(-1.3), Y(cy), view.L(s), view.L(s), { fill: '--body-a' });
        massTag(ctx, X(-1.3), Y(cy + s * 0.27), `${f1(p.m)} kg`);
        vecA(ctx, X(-1.3), Y(cy), -Math.PI / 2, L, '--weight', 'w');
        MC.text(ctx, 'en reposo', X(-1.3), Y(yt + s) - 8, { size: 11, align: 'center', color: '--ink-3' });
        for (let k = 1; k <= 3; k++) D.line(ctx, X(1.3) - view.L(s) * 0.3, Y(cy + s / 2 + 0.13 * k), X(1.3) + view.L(s) * 0.3, Y(cy + s / 2 + 0.13 * k), { color: '--ink-3', width: 1, alpha: 0.5 });
        D.block(ctx, X(1.3), Y(cy), view.L(s), view.L(s), { fill: '--body-a' });
        massTag(ctx, X(1.3), Y(cy + s * 0.27), `${f1(p.m)} kg`);
        vecA(ctx, X(1.3), Y(cy), -Math.PI / 2, L, '--weight', 'w');
        MC.text(ctx, 'cayendo', X(1.3) + view.L(s) / 2 + 8, Y(cy) + 4, { size: 11, color: '--ink-3' });
        const pl = MC.PLANETS.find((q) => q[0] === p.pl);
        MC.text(ctx, `${pl[1]}: g = ${pl[2]} m/s²`, 12, 20, { size: 12.5, weight: 600, color: '--ink-2' });
        info('Peso <i>w</i>', `${PLACE[p.pl] || pl[1]}, a distancia: no necesita contacto`, 'vertical, hacia abajo (hacia el centro del planeta)', '<i>w</i> = <i>mg</i>', `${f1(w)} N`,
          'Es el mismo en reposo y en caída: no depende del movimiento ni de lo que sostenga al cuerpo. Sólo cambia si cambia <i>g</i>, como al ir a la Luna.');
      } else if (p.f === 'normal') {
        const th = p.th * RAD, w = p.m * G, Lr = 3.4, x0 = -2.2, bs = 0.62;
        const nRaw = w * Math.cos(th) + p.P, n = Math.max(0, nRaw);
        const u = [Math.cos(th), Math.sin(th)], nr = [-Math.sin(th), Math.cos(th)];
        const top = [x0 + Lr * u[0], Lr * u[1]];
        D.poly(ctx, [[X(x0), Y(0)], [X(top[0]), Y(top[1])], [X(top[0]), Y(0)]], { close: true, fill: '--wood', fillAlpha: 0.35, color: '--ink-2', width: 1.4 });
        ground();
        if (p.th > 0) D.angle(ctx, X(x0), Y(0), 40, 0, th, { label: 'θ' });
        const lift = nRaw < 0 ? 0.18 : 0;
        const c = [x0 + 1.9 * u[0] + (bs / 2 + lift) * nr[0], 1.9 * u[1] + (bs / 2 + lift) * nr[1]];
        D.block(ctx, X(c[0]), Y(c[1]), view.L(bs), view.L(bs), { fill: '--body-b', ang: th });
        const k = (130 * kp) / Math.max(w, n, Math.abs(p.P), 1), C = [X(c[0]), Y(c[1])];
        if (p.th > 0) {
          /* componentes del peso desde el centro, con el paralelogramo punteado */
          const a1 = w * Math.cos(th) * k, a2 = w * Math.sin(th) * k;
          const e1 = [C[0] + a1 * Math.sin(th), C[1] + a1 * Math.cos(th)], e2 = [C[0] - a2 * Math.cos(th), C[1] + a2 * Math.sin(th)], ew = [C[0], C[1] + w * k];
          D.line(ctx, e1[0], e1[1], ew[0], ew[1], { color: '--weight', width: 1, dash: [2, 3], alpha: 0.6 });
          D.line(ctx, e2[0], e2[1], ew[0], ew[1], { color: '--weight', width: 1, dash: [2, 3], alpha: 0.6 });
          D.vec(ctx, C[0], C[1], e1[0] - C[0], e1[1] - C[1], { color: '--weight', label: 'w cos θ', width: 1.3, dash: [4, 3], size: 11 });
          D.vec(ctx, C[0], C[1], e2[0] - C[0], e2[1] - C[1], { color: '--weight', label: 'w sen θ', width: 1.3, dash: [4, 3], size: 11, labelSide: -1 });
        }
        vecA(ctx, C[0], C[1], -Math.PI / 2, w * k, '--weight', 'w');
        if (n > 0) vecA(ctx, C[0], C[1], th + Math.PI / 2, n * k, '--normal', 'n', { labelSide: -1 });
        if (Math.abs(p.P) > 0.5) vecA(ctx, C[0] + 16 * u[0], C[1] - 16 * u[1], th + (p.P > 0 ? -Math.PI / 2 : Math.PI / 2), Math.abs(p.P) * k, '--force', 'F_{mano}', { vec: false, size: 12, dash: [6, 3] });
        info('Fuerza normal <i>n</i>', 'La superficie de apoyo (fuerza de contacto)', 'perpendicular a la superficie, empujando hacia afuera', 'la necesaria: aquí <i>n</i> = <i>mg</i> cos θ + <i>F</i><sub>mano</sub>', `${f1(n)} N (el peso es ${f1(w)} N)`,
          nRaw < 0 ? 'La mano tira con más fuerza que <i>mg</i> cos θ: el bloque se despega y la normal vale cero. Una superficie puede empujar, pero no tirar.' : 'La normal no es el peso: depende de la inclinación y de las otras fuerzas perpendiculares a la superficie. Aquí no se dibuja la fricción, para mirar sólo la normal.');
      } else if (p.f === 'tension') {
        const w = p.m * G, phi = p.phi * RAD;
        ground();
        D.ceiling(ctx, X(-1.0), Y(2.95), X(1.3));
        const pc = [0.35, 2.6], pr = 0.2, bx = pc[0] + pr, byTop = 1.45, bw = 0.5, bh = 0.5;
        D.line(ctx, X(pc[0]), Y(2.95), X(pc[0]), Y(pc[1]), { color: '--ink-2', width: 3 });
        D.line(ctx, X(bx), Y(pc[1]), X(bx), Y(byTop), { color: '--rope', width: 2 });
        /* la cuerda deja la polea por la tangente y baja hasta la mano */
        const tp = [pc[0] - pr * Math.cos(phi), pc[1] + pr * Math.sin(phi)], hy = 1.5;
        const tl = (tp[1] - hy) / Math.cos(phi), hp = [tp[0] - tl * Math.sin(phi), hy];
        D.line(ctx, X(tp[0]), Y(tp[1]), X(hp[0]), Y(hp[1]), { color: '--rope', width: 2 });
        ropeArc(ctx, X(pc[0]), Y(pc[1]), view.L(pr) + 1, -(Math.PI - phi), 0, false);
        D.pulley(ctx, X(pc[0]), Y(pc[1]), view.L(pr));
        D.poly(ctx, [[X(bx - bw / 2), Y(byTop - 0.04)], [X(bx - bw * 0.4), Y(byTop - bh)], [X(bx + bw * 0.4), Y(byTop - bh)], [X(bx + bw / 2), Y(byTop - 0.04)]], { close: true, fill: '--metal', color: '--ink-2', width: 1.4 });
        MC.text(ctx, `balde de ${f1(p.m)} kg`, X(bx + bw / 2) + 8, Y(byTop - bh / 2) + 4, { size: 10.5, color: '--ink-2', weight: 600, halo: true });
        reach(ctx, view, hp[0], hp[1], 1, 1.75);
        const LT = 70 * kp;
        vecA(ctx, X(bx), Y(byTop), Math.PI / 2, LT, '--tension', 'T');
        vecA(ctx, X(bx), Y(byTop - bh / 2), -Math.PI / 2, LT, '--weight', 'w', { size: 12 });
        vecA(ctx, X(hp[0]), Y(hp[1]), Math.PI / 2 - phi, LT, '--tension', 'T', { labelSide: -1 });
        MC.text(ctx, 'La cuerda tira del balde hacia arriba', 12, Y(2.95) + 28, { size: 11.5, color: '--tension', weight: 600, halo: true });
        MC.text(ctx, 'y de la mano hacia la polea, con la misma T.', 12, Y(2.95) + 44, { size: 11.5, color: '--tension', weight: 600, halo: true });
        info('Tensión <i>T</i>', 'La cuerda (fuerza de contacto)', 'a lo largo de la cuerda, tirando del cuerpo', 'si el balde está quieto: <i>T</i> = <i>mg</i>', `${f1(w)} N en toda la cuerda`,
          'Una cuerda ideal tiene la misma tensión en toda su longitud y sólo puede tirar, nunca empujar. La polea ideal cambia la dirección de la cuerda, no su tensión: por eso el ángulo de la mano no cambia <i>T</i>.');
      } else if (p.f === 'friccion') {
        const w = p.m * G, n = w, fmax = p.mus * n, stat = p.Fx <= fmax + 1e-9;
        const f = stat ? p.Fx : p.muk * n, a = stat ? 0 : (p.Fx - f) / p.m;
        ground();
        const s = 0.5 + 0.35 * Math.cbrt(p.m / 80), bw = s * 1.3, c = [0.4, s / 2], C = [X(c[0]), Y(c[1])];
        D.block(ctx, C[0], C[1], view.L(bw), view.L(s), { fill: '--body-a' });
        MC.text(ctx, `${f1(p.m)} kg`, C[0] - 8, Y(s) - 7, { size: 10.5, align: 'right', color: '--ink-2', weight: 600, halo: true });
        if (p.Fx > 0) hand(ctx, X(c[0] - bw / 2) - 7, C[1], Math.PI, 40 * kp);
        const k = Math.min((130 * kp) / Math.max(w, p.Fx, 1), (Y(-0.95) - C[1]) / w);
        vecA(ctx, C[0], C[1], Math.PI / 2, n * k, '--normal', 'n');
        vecA(ctx, C[0], C[1], -Math.PI / 2, w * k, '--weight', 'w', { labelSide: -1 });
        if (p.Fx > 0) vecA(ctx, C[0], C[1], 0, p.Fx * k, '--force', 'F');
        if (f > 0.01) vecA(ctx, C[0], Y(0) - 3, Math.PI, f * k, '--fric', stat ? 'f_{s}' : 'f_{k}', { labelSide: -1 });
        if (!stat) vecA(ctx, X(c[0] + bw / 2) + 8, Y(s) - 12, 0, 46 * kp, '--vel', 'v', { width: 2 });
        const msg = stat ? `f_s = ${f0(f)} N · máximo μ_s n = ${f0(fmax)} N` : `superó el máximo μ_s n = ${f0(fmax)} N: desliza con a = ${f2(a)} m/s²`;
        const bx = 14, by = 12, bwid = Math.min(cv.w - 28, Math.max(220, MC.textWidth(ctx, msg, { size: 11 }) + 8)), bh = 10;
        D.panel(ctx, bx - 6, by - 4, bwid + 12, 40, {});
        MC.text(ctx, msg, bx, by + 11, { size: 11, color: stat ? '--ink-2' : '--warn-ink', weight: stat ? 400 : 600 });
        ctx.save();
        ctx.fillStyle = MC.col('--surface-3');
        ctx.fillRect(bx, by + 18, bwid, bh);
        ctx.fillStyle = MC.col(stat ? '--fric' : '--warn-ink');
        ctx.fillRect(bx, by + 18, bwid * Math.min(1, f / fmax), bh);
        ctx.restore();
        info(stat ? 'Fricción estática <i>f</i><sub>s</sub>' : 'Fricción cinética <i>f</i><sub>k</sub>', 'El piso (fuerza de contacto)', stat ? 'paralela al piso, contra la tendencia a deslizar' : 'paralela al piso, contra el deslizamiento', stat ? 'la necesaria: <i>f</i><sub>s</sub> = <i>F</i>, hasta μ<sub>s</sub><i>n</i>' : '<i>f</i><sub>k</sub> = μ<sub>k</sub><i>n</i>', `${f1(f)} N`,
          stat ? 'Mientras el bloque no desliza, la fricción estática iguala al empujón: si se empuja más, crece con él, hasta su máximo μ<sub>s</sub><i>n</i>.' : 'Ya desliza: la fricción cinética es constante y menor que la estática máxima, así que la fuerza que sobra acelera el bloque.');
      } else if (p.f === 'elastica') {
        const Fe = -p.k * p.x, xw = -2.7, L0 = 1.9, bs = 0.6, xe = xw + L0 + p.x;
        ground();
        D.wall(ctx, X(xw), Y(1.1), Y(0), 'left');
        D.spring(ctx, X(xw), Y(bs / 2), X(xe), Y(bs / 2), { n: 12, amp: 9, color: '--c8', width: 2 });
        D.block(ctx, X(xe + bs / 2), Y(bs / 2), view.L(bs), view.L(bs), { fill: '--body-b' });
        D.line(ctx, X(xw + L0), Y(0) + 4, X(xw + L0), Y(1.15), { color: '--ink-3', dash: [4, 4], width: 1.2 });
        MC.text(ctx, 'longitud natural', X(xw + L0), Y(1.15) - 6, { size: 10.5, align: 'center', color: '--ink-3' });
        if (Math.abs(p.x) > 1e-4) D.dim(ctx, X(xw + L0), Y(1.45), X(xe), Y(1.45), `x = ${MC.fix(p.x * 100, 1)} cm`, { size: 11, labelOff: -9 });
        if (Math.abs(Fe) > 0.05) vecA(ctx, X(xe + bs / 2), Y(bs * 0.82), Fe < 0 ? Math.PI : 0, Lx(Fe) * 1.2, '--c8', 'F_{e}', { labelSide: -1 });
        const est = p.x > 1e-4 ? 'estirado: tira del bloque hacia la pared' : p.x < -1e-4 ? 'comprimido: empuja el bloque lejos de la pared' : 'en su longitud natural: no hace fuerza';
        MC.text(ctx, `Resorte ${est}`, 12, 20, { size: 12, weight: 600, color: '--c8' });
        info('Fuerza elástica <i>F</i><sub>e</sub>', 'El resorte (fuerza de contacto)', Math.abs(p.x) < 1e-4 ? '— (no hay deformación)' : `hacia ${Fe < 0 ? 'la izquierda' : 'la derecha'}: hacia la longitud natural`, '<i>F</i><sub>e</sub> = <i>k</i>|<i>x</i>| (ley de Hooke, <i>F</i> = −<i>kx</i>)', `${f1(Math.abs(Fe))} N`,
          'Siempre apunta hacia la longitud natural del resorte: tira si está estirado y empuja si está comprimido. Al doble de deformación, doble fuerza.');
      } else if (p.f === 'aplicada') {
        const w = p.m * G, a = p.ang * RAD, Fx = p.Fa * Math.cos(a), Fy = p.Fa * Math.sin(a);
        const nRaw = w - Fy, n = Math.max(0, nRaw);
        ground();
        const s = 0.6, bw = s * 1.25, c = [0.5, s / 2 + (nRaw < 0 ? 0.15 : 0)], C = [X(c[0]), Y(c[1])];
        D.block(ctx, C[0], C[1], view.L(bw), view.L(s), { fill: '--body-a' });
        MC.text(ctx, `${f1(p.m)} kg`, C[0] + (a <= 0 ? 8 : -8), Y(c[1] + s / 2) - 16, { size: 10.5, align: a <= 0 ? 'left' : 'right', color: '--ink-2', weight: 600, halo: true });
        const d = [Math.cos(a), Math.sin(a)];
        const e0 = Math.min(Math.abs(d[0]) > 1e-9 ? bw / 2 / Math.abs(d[0]) : 1e9, Math.abs(d[1]) > 1e-9 ? s / 2 / Math.abs(d[1]) : 1e9);
        if (p.Fa > 0) {
          if (a <= 0) {
            /* empuja con una vara, como una podadora */
            const p0 = [c[0] - e0 * d[0], c[1] - e0 * d[1]], p1 = [p0[0] - 1.2 * d[0], p0[1] - 1.2 * d[1]];
            D.line(ctx, X(p0[0]), Y(p0[1]), X(p1[0]), Y(p1[1]), { color: '--ink-2', width: 4 });
            hand(ctx, X(p1[0]), Y(p1[1]), a + Math.PI, 38 * kp);
          } else {
            /* tira con una cuerda, como al jalar una maleta */
            const p0 = [c[0] + e0 * d[0], c[1] + e0 * d[1]], p1 = [p0[0] + 1.2 * d[0], p0[1] + 1.2 * d[1]];
            D.line(ctx, X(p0[0]), Y(p0[1]), X(p1[0]), Y(p1[1]), { color: '--rope', width: 2 });
            hand(ctx, X(p1[0]), Y(p1[1]), a, 38 * kp);
          }
        }
        const k = Math.min((130 * kp) / Math.max(w, p.Fa, n, 1), (Y(-0.95) - C[1]) / w, (C[1] - Y(3.0)) / Math.max(n, 1e-9));
        vecA(ctx, C[0], C[1], -Math.PI / 2, w * k, '--weight', 'w', { labelSide: -1 });
        if (n > 0) vecA(ctx, C[0], C[1], Math.PI / 2, n * k, '--normal', 'n');
        if (p.Fa > 0) {
          vecA(ctx, C[0], C[1], a, p.Fa * k, '--force', 'F');
          if (Math.abs(Fy) > 0.5 && Math.abs(Fx) > 0.5) {
            const side = Fy < 0 ? -1 : 1;
            D.vec(ctx, C[0], C[1], Fx * k, 0, { color: '--force', label: 'F cos α', width: 1.2, dash: [3, 3], size: 11, labelAt: 'mid', labelSide: side, labelOff: 15 });
            D.vec(ctx, C[0] + Fx * k, C[1], 0, -Fy * k, { color: '--force', label: 'F sen α', width: 1.2, dash: [3, 3], size: 11, labelAt: 'mid', labelSide: side, labelOff: 18 });
          }
        }
        info('Fuerza aplicada <i>F</i>', 'Una persona, a través de una vara o de una cuerda', p.Fa > 0 ? `${f0(Math.abs(p.ang))}° ${p.ang < 0 ? 'por debajo' : 'por encima'} de la horizontal` : '—', 'la que decida quien empuja o tira', `${f0(p.Fa)} N (horizontal ${f1(Fx)} N, vertical ${f1(Fy)} N)`,
          nRaw < 0 ? 'La componente hacia arriba supera el peso: la caja se levanta del piso y la normal desaparece.' : `La normal cambia con la componente vertical de <i>F</i>: <i>n</i> = <i>mg</i> ${Fy <= 0 ? '+' : '−'} <i>F</i>|sen α| = ${f1(n)} N. Empujar hacia abajo la aumenta; tirar hacia arriba la disminuye.`);
      } else if (p.f === 'arrastre') {
        const rho = p.fl === 'agua' ? 1000 : 1.2, Cd = 0.47, R = p.r / 100, FD = 0.5 * Cd * rho * Math.PI * R * R * p.v * p.v;
        if (p.fl === 'agua') D.fluid(ctx, 0, 0, cv.w, cv.h, { color: '--water', alpha0: 0.16, alpha1: 0.3 });
        const c = [0, 1.0], Rw = 0.14 + R * 1.7, rp = view.L(Rw);
        /* líneas de corriente alrededor de la esfera, vistas desde la esfera */
        for (const j of [-3, -2, -1, 1, 2, 3]) {
          const dj = Math.abs(j) * 0.36, pts = [];
          for (let i = 0; i <= 90; i++) {
            const x = view.x0 + ((view.x1 - view.x0) * i) / 90 - c[0];
            let lo = Math.abs(x) < Rw ? Math.sqrt(Rw * Rw - x * x) : 0, hi = dj + Rw;
            for (let it = 0; it < 32; it++) { const mid = (lo + hi) / 2; if (mid - (mid * Rw * Rw) / (x * x + mid * mid) - dj > 0) hi = mid; else lo = mid; }
            pts.push([X(c[0] + x), Y(c[1] + Math.sign(j) * (lo + hi) / 2)]);
          }
          D.poly(ctx, pts, { color: '--ink-3', width: 1, dash: [5, 5], alpha: 0.55 });
        }
        D.ball(ctx, X(c[0]), Y(c[1]), rp, { fill: '--body-c' });
        if (p.v > 0) vecA(ctx, X(c[0]), Y(c[1]) - rp - 14, 0, Math.min(150, 20 + p.v * 3.2) * kp, '--vel', 'v', { width: 2.2 });
        if (FD > 1e-3) vecA(ctx, X(c[0]) - rp, Y(c[1]), Math.PI, Lx(FD), '--c6', 'F_{D}', { labelSide: -1 });
        MC.text(ctx, p.fl === 'agua' ? 'Esfera que avanza en el agua' : 'Esfera que avanza en el aire', 12, 20, { size: 12, weight: 600, color: '--ink-2' });
        info('Arrastre <i>F</i><sub>D</sub>', `El ${p.fl} que rodea al cuerpo (fuerza de contacto con el fluido)`, 'opuesta a la velocidad respecto al fluido', '<i>F</i><sub>D</sub> = ½<i>C</i>ρ<i>Av</i>² (<i>C</i> ≈ 0.47 para una esfera)', p.v > 0 ? `${MC.sci(FD, 3)} N` : '0 N (en reposo no hay arrastre)',
          'Al duplicar la rapidez, el arrastre se cuadruplica. En el agua es unas 830 veces mayor que en el aire a la misma rapidez, porque el agua es 830 veces más densa.');
      } else {
        const mt = MATS_B[p.mat], Vm = p.V / 1000, w = mt[1] * Vm * G, B = 1000 * Vm * p.sub * G, ys = 1.75;
        D.fluid(ctx, 0, Y(ys), cv.w, Y(0) - Y(ys), { color: '--water' });
        ground();
        const side = 0.45 + 0.45 * Math.cbrt(p.V / 30), cy = ys - p.sub * side + side / 2;
        D.block(ctx, X(0), Y(cy), view.L(side), view.L(side), { fill: mt[2] });
        MC.text(ctx, mt[0], X(side / 2) + 8, Y(cy + side / 2) + 14, { size: 11, color: '--ink-2', weight: 600, halo: true });
        const k = Math.min((130 * kp) / Math.max(w, B, 1), (Y(cy) - Y(2.85)) / Math.max(B, 1e-9), (Y(-0.95) - Y(cy)) / Math.max(w, 1e-9));
        if (B > 0.01) vecA(ctx, X(0) - 6, Y(cy), Math.PI / 2, B * k, '--water', 'B', { labelSide: -1 });
        vecA(ctx, X(0) + 6, Y(cy), -Math.PI / 2, w * k, '--weight', 'w');
        if (Math.abs(B - w) > 0.02 * w) {
          const rx = side * 0.3;
          if (B > w) { D.line(ctx, X(rx), Y(cy + side / 2), X(rx), Y(2.95), { color: '--ink-2', width: 4 }); MC.text(ctx, 'una varilla lo empuja hacia abajo', X(rx) + 8, Y(2.75), { size: 10.5, color: '--ink-3' }); }
          else { D.line(ctx, X(rx), Y(cy + side / 2), X(rx), Y(2.95), { color: '--rope', width: 1.8 }); MC.text(ctx, 'un hilo lo sostiene', X(rx) + 8, Y(2.75), { size: 10.5, color: '--ink-3' }); }
        }
        const fl = mt[1] < 1000 ? `Si se suelta, flota con el ${f0(mt[1] / 10)} % sumergido` : 'Si se suelta, se hunde: es más denso que el agua';
        info('Empuje <i>B</i>', 'El agua, que presiona más por debajo que por encima', 'vertical, hacia arriba', '<i>B</i> = ρ<sub>agua</sub><i>V</i><sub>sum</sub><i>g</i>', `${f1(B)} N (el peso del bloque es ${f1(w)} N)`, `El empuje es igual al peso del agua desalojada. ${fl}.`);
      }
    });
  });

  /* ======================================================================
     6.3  Arme el diagrama de cuerpo libre
     ====================================================================== */
  const DIRH = {
    w: 'El peso siempre es vertical y hacia abajo.',
    n: 'La normal es perpendicular a la superficie de contacto y empuja alejándose de ella.',
    T: 'La tensión sigue la dirección de la cuerda y tira del cuerpo hacia la cuerda.',
    fs: 'La fricción estática es paralela a la superficie y se opone a hacia donde deslizaría el cuerpo si no hubiera fricción.',
    fk: 'La fricción cinética es paralela a la superficie y opuesta al deslizamiento.',
    F: 'La fuerza aplicada tiene la dirección del empujón o del tirón.',
    Fe: 'La fuerza elástica apunta hacia la longitud natural del resorte.',
    D: 'El arrastre es opuesto a la velocidad respecto al fluido.',
    B: 'El empuje del fluido es vertical y hacia arriba.'
  };
  const SIMILAR = { fs: ['fk'], fk: ['fs'], T: ['F', 'Fe'], F: ['T', 'Fe'], Fe: ['T', 'F'] };
  const TYPEH = {
    'fs>fk': 'el cuerpo no desliza respecto a la superficie, así que la fricción es estática.',
    'fk>fs': 'el cuerpo desliza sobre la superficie, así que la fricción es cinética.',
    'T>F': 'la fuerza la transmite una cuerda: es una tensión.',
    'T>Fe': 'la fuerza la hace una cuerda, no un resorte: es una tensión.',
    'F>T': 'la fuerza la hace directamente una mano, no una cuerda.',
    'Fe>T': 'la fuerza la hace un resorte: es una fuerza elástica.',
    'Fe>F': 'la fuerza la hace un resorte: es una fuerza elástica.',
    'F>Fe': 'la fuerza la hace directamente una mano.'
  };
  /* escenas: vista x ∈ [−3, 3], y ∈ [−0.25, 2.6] */
  const scn = {
    floor: (ctx, V) => D.ground(ctx, 0, V.Y(0), V.cv.w, { depth: 10 }),
    tag: (ctx, x, y, t = 'cuerpo a analizar') => MC.text(ctx, t, x, y, { size: 10.5, align: 'center', color: '--accent', weight: 600, halo: true }),
    vel: (ctx, x, y, ang, L, lab = 'v') => vecA(ctx, x, y, ang, L, '--vel', lab, { width: 2 }),
    ramp: (ctx, V, th) => {
      const x0 = -2.4, L = 4.6, tp = [x0 + L * Math.cos(th), L * Math.sin(th)];
      D.poly(ctx, [[V.X(x0), V.Y(0)], [V.X(tp[0]), V.Y(tp[1])], [V.X(tp[0]), V.Y(0)]], { close: true, fill: '--wood', fillAlpha: 0.35, color: '--ink-2', width: 1.4 });
      D.angle(ctx, V.X(x0), V.Y(0), 40, 0, th, { label: '30°', math: false, size: 12 });
      return { x0, u: [Math.cos(th), Math.sin(th)], n: [-Math.sin(th), Math.cos(th)] };
    }
  };
  const SIT = [
    { id: 'libro', label: 'Un libro sobre una mesa', desc: 'Un libro descansa en reposo sobre una mesa horizontal.', ref: 'floor',
      f: [['w', 270, 'La Tierra atrae al libro.'], ['n', 90, 'La mesa empuja al libro hacia arriba, perpendicular a su superficie.']],
      extra: { F: 'Nadie empuja el libro. Tampoco se dibuja la fuerza que el libro hace sobre la mesa: esa actúa sobre la mesa.' },
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        D.block(ctx, V.X(0), V.Y(0.45) + 5, V.L(2.2), 10, { fill: '--wood', r: 2 });
        D.line(ctx, V.X(-0.9), V.Y(0.45) + 10, V.X(-0.9), V.Y(0), { color: '--wood', width: 6 });
        D.line(ctx, V.X(0.9), V.Y(0.45) + 10, V.X(0.9), V.Y(0), { color: '--wood', width: 6 });
        D.block(ctx, V.X(0), V.Y(0.45) - 10, 64, 20, { fill: '--c1', sel: true });
        scn.tag(ctx, V.X(0), V.Y(0.45) - 30);
      } },
    { id: 'lampara', label: 'Una lámpara colgada de un cable', desc: 'Una lámpara cuelga en reposo del techo, sostenida por un cable vertical.',
      f: [['w', 270, 'La Tierra atrae a la lámpara.'], ['T', 90, 'El cable tira de la lámpara hacia arriba, a lo largo del cable.']],
      draw: (ctx, V) => {
        D.ceiling(ctx, V.X(-1), V.Y(2.5), V.X(1));
        D.line(ctx, V.X(0), V.Y(2.5), V.X(0), V.Y(1.2), { color: '--rope', width: 2 });
        D.poly(ctx, [[V.X(-0.35), V.Y(0.85)], [V.X(-0.15), V.Y(1.2)], [V.X(0.15), V.Y(1.2)], [V.X(0.35), V.Y(0.85)]], { close: true, fill: '--body-a', color: '--accent', width: 2.5 });
        scn.tag(ctx, V.X(0), V.Y(0.85) + 18);
      } },
    { id: 'caja', label: 'Una caja empujada que desliza', desc: 'Una persona empuja horizontalmente una caja que se desliza hacia la derecha por el piso (hay fricción).', ref: 'floor',
      f: [['w', 270, 'La Tierra atrae a la caja.'], ['n', 90, 'El piso empuja la caja hacia arriba.'], ['F', 0, 'La mano empuja la caja hacia la derecha.'], ['fk', 180, 'La caja desliza hacia la derecha: la fricción cinética apunta hacia la izquierda.']],
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        D.block(ctx, V.X(0.4), V.Y(0.3), V.L(0.8), V.L(0.6), { fill: '--body-a', sel: true });
        hand(ctx, V.X(0) - 8, V.Y(0.3), Math.PI, 46);
        scn.vel(ctx, V.X(0.4), V.Y(0.6) - 12, 0, 50);
        scn.tag(ctx, V.X(0.4), V.Y(0.6) - 32);
      } },
    { id: 'rampa-reposo', label: 'Un bloque quieto en una rampa', desc: 'Un bloque está en reposo sobre una rampa de 30° que sube hacia la derecha. Hay fricción.', ref: 30,
      f: [['w', 270, 'La Tierra atrae al bloque.'], ['n', 120, 'La rampa empuja perpendicular a su superficie: a 120°, hacia arriba y a la izquierda.'], ['fs', 30, 'Sin fricción el bloque bajaría; la fricción estática apunta rampa arriba (30°).']],
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        const r = scn.ramp(ctx, V, 30 * RAD), c = [r.x0 + 2.6 * r.u[0] + 0.3 * r.n[0], 2.6 * r.u[1] + 0.3 * r.n[1]];
        D.block(ctx, V.X(c[0]), V.Y(c[1]), V.L(0.6), V.L(0.6), { fill: '--body-b', ang: 30 * RAD, sel: true });
        scn.tag(ctx, V.X(c[0]) - 46, V.Y(c[1]) - 34);
      } },
    { id: 'rampa-baja', label: 'Un bloque que baja deslizando por una rampa', desc: 'Un bloque baja deslizando por la rampa de 30° (la rampa sube hacia la derecha; el bloque se mueve hacia abajo y a la izquierda). Hay fricción.', ref: 30,
      f: [['w', 270, 'La Tierra atrae al bloque.'], ['n', 120, 'La rampa empuja perpendicular a su superficie.'], ['fk', 30, 'El bloque desliza rampa abajo: la fricción cinética apunta rampa arriba.']],
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        const r = scn.ramp(ctx, V, 30 * RAD), c = [r.x0 + 2.4 * r.u[0] + 0.3 * r.n[0], 2.4 * r.u[1] + 0.3 * r.n[1]];
        D.block(ctx, V.X(c[0]), V.Y(c[1]), V.L(0.6), V.L(0.6), { fill: '--body-b', ang: 30 * RAD, sel: true });
        const vs = [c[0] + 0.62 * r.n[0] + 0.3 * r.u[0], c[1] + 0.62 * r.n[1] + 0.3 * r.u[1]];
        scn.vel(ctx, V.X(vs[0]), V.Y(vs[1]), Math.PI + 30 * RAD, 48);
        scn.tag(ctx, V.X(c[0]) - 25, V.Y(2.4));
      } },
    { id: 'trineo', label: 'Un trineo jalado con una cuerda inclinada', desc: 'Un niño jala un trineo con una cuerda que forma 30° con la horizontal; el trineo avanza hacia la derecha sobre la nieve, con fricción.', ref: 'floor',
      f: [['w', 270, 'La Tierra atrae al trineo.'], ['n', 90, 'La nieve empuja hacia arriba.'], ['T', 30, 'La cuerda tira del trineo a 30° sobre la horizontal.'], ['fk', 180, 'El trineo desliza hacia la derecha: la fricción cinética apunta hacia la izquierda.']],
      extra: { F: 'El niño no toca el trineo: tira de la cuerda, y es la cuerda la que tira del trineo (tensión).' },
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        D.block(ctx, V.X(-0.6), V.Y(0.2), V.L(1.0), V.L(0.4), { fill: '--wood', sel: true });
        const a = 30 * RAD, h = [-0.1 + 1.7 * Math.cos(a), 0.3 + 1.7 * Math.sin(a)];
        D.line(ctx, V.X(-0.1), V.Y(0.3), V.X(h[0]), V.Y(h[1]), { color: '--rope', width: 2 });
        reach(ctx, V, h[0], h[1], -1, 1.3);
        scn.vel(ctx, V.X(-0.6), V.Y(0.4) - 12, 0, 46);
        scn.tag(ctx, V.X(-0.6), V.Y(0.4) - 32);
      } },
    { id: 'pelota', label: 'Una pelota lanzada hacia arriba (mientras sube)', desc: 'Una pelota fue lanzada verticalmente hacia arriba y ahora sube, ya fuera de la mano. No hay resistencia del aire.',
      f: [['w', 270, 'Sólo actúa el peso: nada toca a la pelota.']],
      extra: { F: 'Ya nada empuja la pelota hacia arriba: la mano dejó de tocarla. Sube por inercia mientras el peso la frena.', T: 'No hay ninguna cuerda: la pelota está libre en el aire.', D: 'El enunciado dice que no hay resistencia del aire.' },
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        reach(ctx, V, 0, 1.45, 1, 1.5);
        D.line(ctx, V.X(0), V.Y(1.55), V.X(0), V.Y(1.86), { color: '--ink-3', dash: [3, 4], width: 1.2 });
        D.ball(ctx, V.X(0), V.Y(2.05), 13, { fill: '--c4', sel: true });
        scn.vel(ctx, V.X(0) + 24, V.Y(2.05) + 18, Math.PI / 2, 40);
        MC.text(ctx, 'cuerpo a analizar', V.X(0) + 42, V.Y(2.05) - 4, { size: 10.5, color: '--accent', weight: 600, halo: true });
      } },
    { id: 'paracaidista', label: 'Un paracaidista con velocidad constante', desc: 'El sistema «paracaidista + paracaídas» baja con velocidad constante. El aire lo frena.',
      f: [['w', 270, 'La Tierra atrae al paracaidista y a su paracaídas.'], ['D', 90, 'El aire frena la caída: el arrastre apunta hacia arriba, opuesto a la velocidad.']],
      extra: { T: 'Con el sistema paracaidista + paracaídas, las cuerdas son internas; la fuerza externa hacia arriba es el arrastre del aire.', B: 'El empuje del aire es despreciable frente al arrastre.' },
      draw: (ctx, V) => {
        const cx = V.X(0), top = V.Y(2.4);
        ctx.save();
        ctx.fillStyle = MC.col('--c4');
        ctx.beginPath();
        ctx.ellipse(cx, top + 18, V.L(0.9), 26, 0, Math.PI, 0);
        ctx.fill();
        ctx.restore();
        for (const dx of [-0.85, -0.3, 0.3, 0.85]) D.line(ctx, V.X(dx), top + 18, cx, V.Y(1.2), { color: '--ink-3', width: 1 });
        D.person(ctx, cx, V.Y(0.55), V.L(0.68), { arms: 0.8, color: '--ink-2' });
        D.circle(ctx, cx, V.Y(1.5), V.L(1.05), { color: '--accent', width: 2.5, dash: [5, 4] });
        scn.vel(ctx, cx + V.L(1.2), V.Y(1.5) - 20, -Math.PI / 2, 46);
        scn.tag(ctx, cx, V.Y(0.45) + 16, 'sistema a analizar');
      } },
    { id: 'semaforo', label: 'Un semáforo colgado de dos cables', desc: 'Un semáforo cuelga en reposo de dos cables: el izquierdo forma 30° con la horizontal y el derecho, 45°.',
      f: [['w', 270, 'La Tierra atrae al semáforo.'], ['T', 150, 'El cable izquierdo tira hacia arriba y a la izquierda: 30° sobre la horizontal, es decir, a 150°.'], ['T', 45, 'El cable derecho tira hacia arriba y a la derecha, a 45°.']],
      draw: (ctx, V) => {
        const K = [0.25, 1.15], A = [K[0] - 2.2, K[1] + 2.2 * Math.tan(30 * RAD)], Bp = [K[0] + 1.25, K[1] + 1.25];
        D.line(ctx, V.X(A[0]), V.Y(A[1]), V.X(A[0]), V.Y(0), { color: '--metal', width: 6 });
        D.line(ctx, V.X(Bp[0]), V.Y(Bp[1]), V.X(Bp[0]), V.Y(0), { color: '--metal', width: 6 });
        D.line(ctx, V.X(A[0]), V.Y(A[1]), V.X(K[0]), V.Y(K[1]), { color: '--rope', width: 2 });
        D.line(ctx, V.X(Bp[0]), V.Y(Bp[1]), V.X(K[0]), V.Y(K[1]), { color: '--rope', width: 2 });
        scn.floor(ctx, V);
        ctx.save();
        ctx.fillStyle = MC.col('--tire');
        ctx.fillRect(V.X(K[0]) - 12, V.Y(K[1]), 24, 56);
        ['#E0463A', '#F2B84B', '#3FA66B'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(V.X(K[0]), V.Y(K[1]) + 10 + i * 18, 6, 0, 2 * Math.PI); ctx.fill(); });
        ctx.strokeStyle = MC.col('--accent');
        ctx.lineWidth = 2.5;
        ctx.strokeRect(V.X(K[0]) - 14, V.Y(K[1]) - 2, 28, 60);
        ctx.restore();
        scn.tag(ctx, V.X(K[0]), V.Y(K[1]) + 74);
      } },
    { id: 'pared', label: 'Un bloque apretado contra una pared', desc: 'Una mano aprieta horizontalmente un bloque contra una pared que está a su derecha; el bloque no se cae.', ref: 'wall',
      f: [['w', 270, 'La Tierra atrae al bloque.'], ['F', 0, 'La mano empuja el bloque hacia la pared (a la derecha).'], ['n', 180, 'La pared empuja el bloque hacia la izquierda, perpendicular a ella.'], ['fs', 90, 'Sin fricción el bloque caería: la fricción estática de la pared apunta hacia arriba.']],
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        D.wall(ctx, V.X(0.6), V.Y(2.5), V.Y(0), 'right');
        D.block(ctx, V.X(0.3), V.Y(1.3), V.L(0.6), V.L(0.6), { fill: '--body-b', sel: true });
        hand(ctx, V.X(0) - 8, V.Y(1.3), Math.PI, 70);
        MC.text(ctx, 'mano', V.X(0) - 50, V.Y(1.3) - 14, { size: 10.5, color: '--ink-3' });
        scn.tag(ctx, V.X(0.3), V.Y(1.6) - 10);
      } },
    { id: 'camion', label: 'Una caja en un camión que arranca', desc: 'Una caja va sobre la plataforma de un camión que acelera hacia la derecha; la caja no desliza respecto a la plataforma.', ref: 'floor',
      f: [['w', 270, 'La Tierra atrae a la caja.'], ['n', 90, 'La plataforma empuja la caja hacia arriba.'], ['fs', 0, 'La caja acelera hacia la derecha junto con el camión, y la única fuerza horizontal que puede acelerarla es la fricción estática de la plataforma, hacia adelante.']],
      extra: { F: 'Nadie empuja la caja: la fuerza hacia adelante la hace la plataforma, por fricción.' },
      dirx: { fs: 'Sin fricción la caja se quedaría atrás respecto al camión; la fricción estática la arrastra hacia adelante, en el sentido de la aceleración.' },
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        ctx.save();
        ctx.fillStyle = MC.col('--c1');
        ctx.fillRect(V.X(-2.4), V.Y(0.75), V.L(3.4), V.L(0.2));
        ctx.fillStyle = MC.col('--body-c');
        ctx.fillRect(V.X(1.0), V.Y(1.55), V.L(0.9), V.L(1.0));
        ctx.fillStyle = MC.col('--glass');
        ctx.fillRect(V.X(1.45), V.Y(1.45), V.L(0.38), V.L(0.35));
        ctx.restore();
        for (const wx of [-1.8, 0.2, 1.45]) D.ball(ctx, V.X(wx), V.Y(0.27), V.L(0.27), { fill: '--tire' });
        D.block(ctx, V.X(-0.9), V.Y(0.75) - V.L(0.25), V.L(0.6), V.L(0.5), { fill: '--body-a', sel: true });
        vecA(ctx, V.X(0.3), V.Y(2.05), 0, 60, '--acc', 'a', { width: 2.2 });
        scn.tag(ctx, V.X(-0.9), V.Y(1.25) - 10);
      } },
    { id: 'resorte', label: 'Una masa colgada de un resorte', desc: 'Una masa cuelga en reposo de un resorte vertical estirado.',
      f: [['w', 270, 'La Tierra atrae a la masa.'], ['Fe', 90, 'El resorte estirado tira de la masa hacia arriba, hacia su longitud natural.']],
      draw: (ctx, V) => {
        D.ceiling(ctx, V.X(-0.8), V.Y(2.5), V.X(0.8));
        D.spring(ctx, V.X(0), V.Y(2.5), V.X(0), V.Y(1.15), { n: 10, amp: 9, color: '--c8', width: 2 });
        D.block(ctx, V.X(0), V.Y(0.9), V.L(0.55), V.L(0.5), { fill: '--metal', sel: true });
        scn.tag(ctx, V.X(0), V.Y(0.65) + 16);
      } },
    { id: 'corcho', label: 'Un corcho que flota', desc: 'Un corcho flota en reposo en el agua, parcialmente sumergido.',
      f: [['w', 270, 'La Tierra atrae al corcho.'], ['B', 90, 'El agua empuja al corcho hacia arriba con una fuerza igual al peso del agua desalojada.']],
      extra: { n: 'El agua no es una superficie sólida de apoyo: su fuerza hacia arriba se llama empuje.' },
      draw: (ctx, V) => {
        D.fluid(ctx, 0, V.Y(1.1), V.cv.w, V.Y(0) - V.Y(1.1), { color: '--water' });
        scn.floor(ctx, V);
        D.block(ctx, V.X(0), V.Y(1.1) - V.L(0.08), V.L(0.8), V.L(0.4), { fill: '--wood', sel: true });
        scn.tag(ctx, V.X(0), V.Y(1.4) - 10);
      } },
    { id: 'curva', label: 'Un auto en una curva plana (visto desde atrás)', desc: 'Un auto toma una curva plana con rapidez constante. Lo vemos desde atrás y el centro de la curva queda a la izquierda.', ref: 'floor',
      f: [['w', 270, 'La Tierra atrae al auto.'], ['n', 90, 'La carretera empuja hacia arriba (en las cuatro llantas; aquí, una sola flecha).'], ['fs', 180, 'La fricción estática lateral del piso apunta hacia el centro de la curva: es la fuerza centrípeta.']],
      extra: { F: 'No existe una «fuerza centrífuga» que empuje hacia afuera: el auto tiende a seguir derecho y la fricción lo desvía hacia el centro.', fk: 'Las llantas no derrapan: la fricción lateral es estática.' },
      dirx: { fs: 'El auto necesita una fuerza hacia el centro de la curva (a la izquierda) para girar.' },
      draw: (ctx, V) => {
        scn.floor(ctx, V);
        ctx.save();
        ctx.fillStyle = MC.col('--body-c');
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(V.X(-0.75), V.Y(1.2), V.L(1.5), V.L(0.9), 10); else ctx.rect(V.X(-0.75), V.Y(1.2), V.L(1.5), V.L(0.9));
        ctx.fill();
        ctx.fillStyle = MC.col('--glass');
        ctx.fillRect(V.X(-0.5), V.Y(1.1), V.L(1.0), V.L(0.3));
        ctx.fillStyle = MC.col('--tire');
        ctx.fillRect(V.X(-0.78), V.Y(0.32), V.L(0.3), V.L(0.32));
        ctx.fillRect(V.X(0.48), V.Y(0.32), V.L(0.3), V.L(0.32));
        ctx.strokeStyle = MC.col('--accent');
        ctx.lineWidth = 2.5;
        ctx.strokeRect(V.X(-0.8), V.Y(1.25), V.L(1.6), V.L(1.25));
        ctx.restore();
        intoScreen(ctx, V.X(0), V.Y(0.62), 9, '--vel');
        MC.text(ctx, 'v hacia adentro de la pantalla', V.X(0), V.Y(1.25) - 8, { size: 10.5, align: 'center', color: '--vel', halo: true });
        vecA(ctx, V.X(-1.15), V.Y(0.75), Math.PI, 70, '--ink-3', 'centro de la curva', { vec: false, math: false, size: 10.5, width: 1.5, labelAt: 'mid' });
        scn.tag(ctx, V.X(0), V.Y(1.25) - 24);
      } }
  ];
  const angDist = (a, b) => { const d = Math.abs((((a - b) % 360) + 360) % 360); return Math.min(d, 360 - d); };
  MC.defineSim('constructor-dcl', function (sim) {
    const sc = sim.canvas({ aspect: 2.3, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.3 });
    const V = new MC.View2D(sc, { xmin: -3, xmax: 3, ymin: -0.25, ymax: 2.6, align: 'bottom', padB: 4 });
    const st = { sit: SIT[0], user: [], sel: -1, rev: null, sol: false };
    const TOL = 15;
    sim.group('Agregar una fuerza');
    Object.keys(FT).forEach((t) => { const b = sim.button(cap(FT[t].n), () => add(t), { cls: 'chip', title: 'Agregar ' + FT[t].u + ' ' + FT[t].n }); b.style.setProperty('--sw', `var(${FT[t].c})`); });
    sim.group('Fuerza seleccionada');
    sim.slider('dir', {
      label: 'Dirección (0° a la derecha, 90° hacia arriba)', min: 0, max: 355, step: 5, value: 45, unit: '°', fmt: f0, keepPreset: true,
      onInput: (v) => { if (st.sel >= 0 && st.user[st.sel].a !== v) { st.user[st.sel].a = v; st.rev = null; showRes(); } }
    });
    sim.button('Quitar la seleccionada', () => { if (st.sel >= 0) { st.user.splice(st.sel, 1); st.sel = st.user.length - 1; st.rev = null; syncDir(); showRes(); } });
    sim.button('Borrar todas', () => { st.user = []; st.sel = -1; st.rev = null; syncDir(); showRes(); });
    sim.group('Revisión');
    sim.button('Revisar', () => { st.sol = false; st.rev = grade(); showRes(); }, { primary: true });
    const solBtn = sim.button('Ver la solución', () => { st.sol = !st.sol; showRes(); });
    sim.out('res', 'Resultado', { hl: true });
    sim.out('det', 'Situación');
    ['res', 'det'].forEach((k) => { sim._outs[k].dt.classList.add('wide'); sim._outs[k].dd.classList.add('wide'); });
    sim.presets(SIT.map((s) => ({ id: s.id, label: s.label, fn: () => load(s.id) })), { label: 'Situación' });
    function load(id) { st.sit = SIT.find((s) => s.id === id) || SIT[0]; st.user = []; st.sel = -1; st.rev = null; st.sol = false; syncDir(); showRes(); }
    function add(t) {
      const used = st.user.map((u) => u.a);
      const cand = [45, 135, 225, 315, 0, 90, 180, 270].find((a) => used.every((b) => angDist(a, b) > 20));
      st.user.push({ t, a: cand === undefined ? 45 : cand });
      st.sel = st.user.length - 1;
      st.rev = null;
      st.sol = false;
      syncDir();
      showRes();
    }
    function syncDir() {
      const on = st.sel >= 0;
      if (on) sim.ctl.dir.set(st.user[st.sel].a, true);
      sim.ctl.dir.enable(on);
    }
    function grade() {
      const need = st.sit.f.map(([t, a, why]) => ({ t, a, why, used: false }));
      const user = st.user.map((u) => ({ t: u.t, a: u.a, st: null }));
      const out = [];
      /* 1) tipo y dirección correctos */
      user.forEach((u) => {
        const c = need.filter((q) => !q.used && q.t === u.t).sort((p, q) => angDist(p.a, u.a) - angDist(q.a, u.a))[0];
        if (c && angDist(c.a, u.a) <= TOL) { c.used = true; u.st = 'ok'; out.push(['ok', `✓ ${cap(FT[u.t].n)}: bien.`]); }
      });
      /* 2) tipo correcto, dirección equivocada */
      user.forEach((u) => {
        if (u.st) return;
        const c = need.find((q) => !q.used && q.t === u.t);
        if (c) { c.used = true; u.st = 'dir'; out.push(['dir', `↻ ${cap(FT[u.t].n)}: la dirección no es correcta. ${(st.sit.dirx && st.sit.dirx[u.t]) || DIRH[u.t]}`]); }
      });
      /* 3) dirección correcta, tipo parecido */
      user.forEach((u) => {
        if (u.st) return;
        const c = need.find((q) => !q.used && (SIMILAR[u.t] || []).includes(q.t) && angDist(q.a, u.a) <= TOL);
        if (c) { c.used = true; u.st = 'type'; out.push(['type', `≈ Puso ${FT[u.t].u} ${FT[u.t].n} donde va ${FT[c.t].u} ${FT[c.t].n}: ${TYPEH[c.t + '>' + u.t] || DIRH[c.t]}`]); }
      });
      /* 4) lo que sobra y lo que falta */
      user.forEach((u) => {
        if (u.st) return;
        u.st = 'extra';
        out.push(['extra', `✗ Sobra ${FT[u.t].a} ${FT[u.t].n}. ${(st.sit.extra && st.sit.extra[u.t]) || '¿Quién la ejerce? Si ningún cuerpo la ejerce, esa fuerza no existe.'}`]);
      });
      need.forEach((q) => { if (!q.used) out.push(['miss', `✗ Falta ${FT[q.t].a} ${FT[q.t].n}. ${q.why}`]); });
      const ok = user.filter((u) => u.st === 'ok').length;
      return { user, out, ok, n: need.length, extra: user.filter((u) => u.st === 'extra').length, perfect: ok === need.length && user.length === need.length };
    }
    function showRes() {
      solBtn.querySelector('span').textContent = st.sol ? 'Ocultar la solución' : 'Ver la solución';
      if (st.sol) {
        sim.set('res', 'Solución');
        sim.set('det', '<ul class="fbd-list">' + st.sit.f.map(([t, a, why]) => `<li class="fb-sol"><b>${cap(FT[t].n)}</b> (${a}°): ${why}</li>`).join('') + '</ul>');
      } else if (st.rev) {
        const r = st.rev;
        sim.set('res', r.perfect ? '<span class="goodv">¡Diagrama correcto!</span>' : `${r.ok} de ${r.n} ${r.n === 1 ? 'fuerza correcta' : 'fuerzas correctas'}${r.extra ? ` · ${r.extra} de más` : ''}`);
        sim.set('det', '<ul class="fbd-list">' + r.out.map(([k, t]) => `<li class="fb-${k}">${t}</li>`).join('') + '</ul>');
      } else {
        const n = st.user.length;
        sim.set('res', n ? `${n} fuerza${n > 1 ? 's' : ''} en el diagrama: pulse «Revisar»` : 'Agregue las fuerzas con los botones');
        sim.set('det', st.sit.desc);
      }
      sim.redraw();
    }
    /* arrastrar la punta (o el cuerpo) de una flecha para orientarla */
    const geo = { cx: 0, cy: 0, R: 1 };
    const tipOf = (u) => [geo.cx + geo.R * Math.cos(u.a * RAD), geo.cy - geo.R * Math.sin(u.a * RAD)];
    const hit = (x, y) => {
      let best = -1, bd = 1e9;
      st.user.forEach((u, i) => {
        const [tx, ty] = tipOf(u);
        const d = Math.hypot(x - tx, y - ty);
        const t = M.clamp(((x - geo.cx) * (tx - geo.cx) + (y - geo.cy) * (ty - geo.cy)) / (geo.R * geo.R), 0, 1);
        const ds = Math.hypot(x - (geo.cx + t * (tx - geo.cx)), y - (geo.cy + t * (ty - geo.cy)));
        const sc2 = Math.min(d, ds + 6);
        if ((d < 22 || (ds < 10 && t > 0.25)) && sc2 < bd) { bd = sc2; best = i; }
      });
      return best;
    };
    MC.pointer(gc, {
      down: (x, y) => {
        const i = hit(x, y);
        st.sel = i;
        syncDir();
        sim.redraw();
        return i >= 0 ? i : null;
      },
      move: (i, x, y) => {
        const a = (Math.round((((Math.atan2(geo.cy - y, x - geo.cx) / RAD) + 360) % 360) / 5) * 5) % 360;
        if (a === st.user[i].a) return;
        st.user[i].a = a;
        st.rev = null;
        syncDir();
        showRes();
      },
      hover: (x, y) => hit(x, y) >= 0
    });
    sim.hint('Arrastre la punta de cada flecha para orientarla', gc);
    sim.onDraw(() => {
      /* escena */
      const ctx = sc.ctx;
      V.update();
      D.clear(sc);
      V.grid({ labels: false });
      st.sit.draw(ctx, V);
      /* diagrama del estudiante */
      const g = gc.ctx, W = gc.w, H = gc.h;
      D.clear(gc);
      geo.cx = W / 2; geo.cy = H / 2 + 8; geo.R = Math.min(W, H) * 0.32;
      const { cx, cy, R } = geo;
      D.circle(g, cx, cy, R, { color: '--grid-2', width: 1, dash: [2, 5] });
      for (let a = 0; a < 360; a += 15) {
        const big = a % 90 === 0, r1 = R + (big ? 9 : 5);
        D.line(g, cx + R * Math.cos(a * RAD), cy - R * Math.sin(a * RAD), cx + r1 * Math.cos(a * RAD), cy - r1 * Math.sin(a * RAD), { color: '--ink-3', width: big ? 1.4 : 1 });
        if (big) { const al = (a + 9) * RAD; MC.text(g, `${a}°`, cx + (R + 20) * Math.cos(al), cy - (R + 20) * Math.sin(al) + 4, { size: 10.5, mono: true, align: 'center', color: '--ink-3' }); }
      }
      D.line(g, cx - R * 1.05, cy, cx + R * 1.05, cy, { color: '--grid-2', width: 1, dash: [4, 4] });
      D.line(g, cx, cy - R * 1.05, cx, cy + R * 1.05, { color: '--grid-2', width: 1, dash: [4, 4] });
      /* superficie de referencia y cuerpo aislado */
      const bs = 40, ref = st.sit.ref;
      let bang = 0;
      if (typeof ref === 'number') {
        bang = ref * RAD;
        const ux = Math.cos(bang), uy = -Math.sin(bang), bx = cx + Math.sin(bang) * (bs / 2), by = cy + Math.cos(bang) * (bs / 2);
        D.line(g, bx - ux * R * 0.9, by - uy * R * 0.9, bx + ux * R * 0.9, by + uy * R * 0.9, { color: '--wood', width: 3, alpha: 0.6 });
        MC.text(g, 'superficie de la rampa', bx - ux * R * 0.5, by - uy * R * 0.5 + 18, { size: 10, color: '--ink-3', align: 'center' });
      } else if (ref === 'floor') {
        D.line(g, cx - R * 0.8, cy + bs / 2, cx + R * 0.8, cy + bs / 2, { color: '--wood', width: 3, alpha: 0.6 });
      } else if (ref === 'wall') {
        D.line(g, cx + bs / 2, cy - R * 0.8, cx + bs / 2, cy + R * 0.8, { color: '--wood', width: 3, alpha: 0.6 });
        MC.text(g, 'pared', cx + bs / 2 + 6, cy - R * 0.62, { size: 10, color: '--ink-3' });
      }
      D.block(g, cx, cy, bs, bs, { fill: '--body-a', ang: bang });
      if (st.sol) st.sit.f.forEach(([t, a]) => vecA(g, cx, cy, a * RAD, R * 0.78, '--vel', FT[t].s, { dash: [6, 4], width: 2, alpha: 0.85 }));
      const marks = st.rev ? st.rev.user : null;
      st.user.forEach((u, i) => {
        const sel = i === st.sel, ar = u.a * RAD;
        vecA(g, cx, cy, ar, R, FT[u.t].c, FT[u.t].s, { width: sel ? 3.4 : 2.4, size: 14 });
        const [tx, ty] = tipOf(u);
        if (sel) D.circle(g, tx, ty, 7, { color: '--accent', width: 2 });
        if (marks && marks[i]) {
          const m = marks[i].st, sym = m === 'ok' ? '✓' : m === 'extra' ? '✗' : m === 'dir' ? '↻' : '≈';
          const col = m === 'ok' ? '--vel' : m === 'extra' ? '--warn-ink' : '--acc';
          MC.text(g, sym, cx + 0.6 * R * Math.cos(ar) + 13 * Math.sin(ar), cy - 0.6 * R * Math.sin(ar) + 13 * Math.cos(ar) + 5, { size: 15, weight: 700, color: col, halo: true, align: 'center' });
        }
      });
      MC.text(g, st.sol ? 'Solución: flechas verdes punteadas' : 'Su diagrama de cuerpo libre', 10, H - 10, { size: 11, weight: 700, color: st.sol ? '--vel' : '--ink-3' });
    });
    sim.applyPreset('libro', true);
  });

  /* ======================================================================
     6.4  Laboratorio de sistemas en equilibrio
     ====================================================================== */
  MC.defineSim('sistemas-equilibrio', function (sim) {
    const sc = sim.canvas({ aspect: 1.9, cls: 'fixed' });
    const pc = sim.canvas({ aspect: 2.2 });
    const V = new MC.View2D(sc, { xmin: -3.2, xmax: 3.2, ymin: -0.3, ymax: 3.0, align: 'bottom', padB: 4 });
    const stx = sim.status(sc);
    sim.group('Montaje');
    sim.seg('cfg', { options: [['rampa', 'Rampa'], ['contrapeso', 'Contrapeso'], ['pared', 'Pared'], ['poleas', 'Poleas']], value: 'rampa' }).el.querySelector('.seg').classList.add('fit');
    const gB = sim.group('Bloque');
    sim.slider('m', { label: 'Masa del bloque <i>m</i>', min: 0.5, max: 50, step: 0.5, value: 10, unit: 'kg', fmt: f1 });
    const gR = sim.group('Rampa');
    sim.slider('th', { label: 'Inclinación de la rampa θ', min: 5, max: 60, step: 1, value: 30, unit: '°', fmt: f0 });
    sim.slider('phi', { label: 'Ángulo de la cuerda sobre la rampa φ', min: 0, max: 60, step: 1, value: 0, unit: '°', fmt: f0 });
    const gC = sim.group('Contrapeso');
    sim.slider('m2', { label: 'Masa colgante <i>m</i>₂', min: 0, max: 30, step: 0.1, value: 5, unit: 'kg', fmt: f1 });
    const gW = sim.group('Mano');
    sim.slider('Fw', { label: 'Fuerza horizontal de la mano <i>F</i>', min: 0, max: 200, step: 0.5, value: 50, unit: 'N', fmt: f1 });
    const gF = sim.group('Fricción');
    sim.slider('mus', { label: 'Coeficiente estático μ<sub>s</sub>', min: 0, max: 1, step: 0.01, value: 0.3, fmt: f2 });
    const gP = sim.group('Poleas');
    sim.seg('tipo', { label: 'Montaje', options: [['fija', 'Polea fija'], ['movil', 'Polea móvil'], ['aparejo', 'Aparejo']], value: 'movil' });
    sim.slider('W', { label: 'Peso de la carga <i>W</i>', min: 50, max: 2000, step: 10, value: 400, unit: 'N', fmt: f0 });
    sim.slider('wb', { label: 'Peso de las poleas móviles', min: 0, max: 100, step: 1, value: 0, unit: 'N', fmt: f0 });
    sim.out('e1', 'Ecuación 1');
    sim.out('e2', 'Ecuación 2');
    sim.out('r1', 'Resultado', { hl: true });
    sim.out('r2', 'Resultado', { hl: true });
    sim.out('st', 'Estado');
    sim.presets([
      { id: 'rampa', label: 'Bloque de 10 kg sostenido por una cuerda en una rampa lisa de 30°', v: { cfg: 'rampa', m: 10, th: 30, phi: 0 }, note: 'T = mg sen 30° = 49 N y n = mg cos 30° = 84.9 N.' },
      { id: 'cuerda-inclinada', label: 'La misma cuerda, inclinada 30° sobre la rampa', v: { cfg: 'rampa', m: 10, th: 30, phi: 30 }, note: 'Al inclinar la cuerda, la tensión aumenta (56.6 N) y la normal disminuye (56.6 N).' },
      { id: 'contrapeso', label: 'Contrapeso justo: la fricción vale cero', v: { cfg: 'contrapeso', m: 10, th: 30, m2: 5, mus: 0.3 }, note: 'm₂g = mg sen 30°: el contrapeso equilibra solo y la fricción no hace falta.' },
      { id: 'friccion-abajo', label: 'Contrapeso mayor: la fricción apunta rampa abajo', v: { cfg: 'contrapeso', m: 10, th: 30, m2: 7, mus: 0.3 }, note: 'El contrapeso tiende a subir el bloque: la fricción estática (19.6 N) apunta rampa abajo.' },
      { id: 'friccion-arriba', label: 'Contrapeso menor: la fricción apunta rampa arriba', v: { cfg: 'contrapeso', m: 10, th: 30, m2: 3, mus: 0.3 }, note: 'El bloque tiende a bajar: la fricción estática (19.6 N) apunta rampa arriba.' },
      { id: 'pared', label: 'Libro de 1.5 kg apretado contra la pared (μs = 0.40)', v: { cfg: 'pared', m: 1.5, Fw: 40, mus: 0.4 }, note: 'Hace falta F ≥ mg/μs = 36.8 N; con 40 N el libro no cae.' },
      { id: 'polea-fija', label: 'Polea fija con una carga de 400 N', v: { cfg: 'poleas', tipo: 'fija', W: 400, wb: 0 }, note: 'Un solo tramo sostiene la carga: hay que tirar con 400 N, pero hacia abajo, que es más cómodo.' },
      { id: 'polea-movil', label: 'Polea móvil con una carga de 400 N', v: { cfg: 'poleas', tipo: 'movil', W: 400, wb: 0 }, note: 'Dos tramos de cuerda sostienen la carga: T = 200 N.' },
      { id: 'aparejo', label: 'Aparejo de cuatro tramos con 800 N', v: { cfg: 'poleas', tipo: 'aparejo', W: 800, wb: 0 }, note: 'Cuatro tramos: T = 200 N, pero hay que recoger 4 m de cuerda por cada metro que sube la carga.' }
    ]);
    const SHOW = { rampa: [gB, gR], contrapeso: [gB, gR, gC, gF], pared: [gB, gW, gF], poleas: [gP] };
    sim.onChange = () => {
      const c = sim.p.cfg;
      [gB, gR, gC, gW, gF, gP].forEach((g) => { g.hidden = !SHOW[c].includes(g); });
      sim.ctl.phi.show(c === 'rampa');
    };
    sim.onChange();
    const lab = (k, h) => sim._outs[k].label(h);
    sim.onDraw(() => {
      const p = sim.p, ctx = sc.ctx, c = p.cfg;
      V.setRange({ ymax: c === 'contrapeso' ? 3.4 : 3.0 });
      D.clear(sc);
      V.grid({ labels: false });
      stx.hide();
      const X = (x) => V.X(x), Y = (y) => V.Y(y), kp = V.s / 90;
      const gctx = pc.ctx;
      D.clear(pc);
      D.ground(ctx, 0, Y(0), sc.w, { depth: 10 });
      if (c === 'rampa' || c === 'contrapeso') {
        const th = p.th * RAD, u = [Math.cos(th), Math.sin(th)], nr = [-Math.sin(th), Math.cos(th)], w = p.m * G;
        const cw = c === 'contrapeso', yb = cw ? 0.7 : 0, L = cw ? 2.2 : 3.3, x0 = cw ? -2.6 : -2.9, bs = 0.5;
        const top = [x0 + L * u[0], yb + L * u[1]];
        if (cw) {
          const tx0 = x0 - 0.2, tx1 = top[0] + 0.04;
          D.block(ctx, (X(tx0) + X(tx1)) / 2, Y(yb) + 5, X(tx1) - X(tx0), 10, { fill: '--wood', r: 2 });
          D.line(ctx, X(tx0 + 0.15), Y(yb) + 10, X(tx0 + 0.15), Y(0), { color: '--wood', width: 6 });
          D.line(ctx, X(tx1 - 0.15), Y(yb) + 10, X(tx1 - 0.15), Y(0), { color: '--wood', width: 6 });
        }
        D.poly(ctx, [[X(x0), Y(yb)], [X(top[0]), Y(top[1])], [X(top[0]), Y(yb)]], { close: true, fill: '--wood', fillAlpha: 0.35, color: '--ink-2', width: 1.4 });
        D.angle(ctx, X(x0), Y(yb), 40, 0, th, { label: 'θ' });
        const s0 = 0.55 * L, cb = [x0 + s0 * u[0] + (bs / 2) * nr[0], yb + s0 * u[1] + (bs / 2) * nr[1]];
        const att = [cb[0] + (bs / 2) * u[0], cb[1] + (bs / 2) * u[1]];
        if (!cw) {
          const phi = p.phi * RAD, T = (w * Math.sin(th)) / Math.cos(phi), n = w * Math.cos(th) - T * Math.sin(phi), ok = n >= -1e-9;
          const dT = [Math.cos(th + phi), Math.sin(th + phi)], anc = [att[0] + 0.95 * dT[0], att[1] + 0.95 * dT[1]];
          D.line(ctx, X(att[0]), Y(att[1]), X(anc[0]), Y(anc[1]), { color: '--rope', width: 2 });
          anchor(ctx, X(anc[0]), Y(anc[1]), th + phi);
          D.block(ctx, X(cb[0]), Y(cb[1]), V.L(bs), V.L(bs), { fill: '--body-b', ang: th, label: `${f1(p.m)} kg`, size: 10, upright: true });
          if (p.phi > 0) D.angle(ctx, X(att[0]), Y(att[1]), 28, th, th + phi, { label: 'φ', size: 11 });
          if (!ok) stx.show('La cuerda levantaría el bloque de la rampa', 'bad');
          const nn = Math.max(0, n);
          const F = [{ fx: 0, fy: -w, color: '--weight', label: 'w' }, { fx: nn * nr[0], fy: nn * nr[1], color: '--normal', label: 'n' }, { fx: T * dT[0], fy: T * dT[1], color: '--tension', label: 'T' }];
          const P = panels(pc, 2);
          D.fbd(gctx, F, Object.assign({}, P[0], { title: 'DCL DEL BLOQUE', shape: 'block', ang: th, fill: '--body-b', axes: true, axesAng: th }));
          polygon(gctx, F, P[1], 'POLÍGONO DE FUERZAS');
          lab('e1', 'Σ<i>F</i> a lo largo de la rampa'); sim.set('e1', '<i>T</i> cos φ − <i>mg</i> sen θ = 0');
          lab('e2', 'Σ<i>F</i> perpendicular a la rampa'); sim.set('e2', '<i>n</i> + <i>T</i> sen φ − <i>mg</i> cos θ = 0');
          lab('r1', 'Tensión <i>T</i>'); sim.set('r1', fmtN(T));
          lab('r2', 'Normal <i>n</i>'); sim.set('r2', ok ? fmtN(n) : '0 (sin contacto)');
          sim.set('st', ok ? '<span class="goodv">en equilibrio</span>' : '<span class="warnv">no puede quedar en equilibrio apoyado</span>');
        } else {
          const n = w * Math.cos(th), Dd = p.m2 * G - w * Math.sin(th), fmax = p.mus * n, eq = Math.abs(Dd) <= fmax + 1e-9;
          const f = eq ? Dd : Math.sign(Dd) * fmax; /* positiva: la fricción apunta rampa abajo */
          const R = 0.15, dd = Math.max(0.3, (0.2 + 0.1 * Math.sin(th)) / Math.cos(th));
          const pul = [top[0] + nr[0] * (bs / 2 - R) + u[0] * dd, top[1] + nr[1] * (bs / 2 - R) + u[1] * dd];
          const tg = [pul[0] + R * nr[0], pul[1] + R * nr[1]];
          D.line(ctx, X(top[0]), Y(top[1]), X(pul[0]), Y(pul[1]), { color: '--metal', width: 4 });
          D.line(ctx, X(att[0]), Y(att[1]), X(tg[0]), Y(tg[1]), { color: '--rope', width: 2 });
          ropeArc(ctx, X(pul[0]), Y(pul[1]), V.L(R) + 1, -(th + Math.PI / 2), 0, false);
          const hx = pul[0] + R, hb = Math.max(0.62, pul[1] - 1.15), s2 = 0.28 + 0.2 * Math.cbrt(Math.max(p.m2, 0.05) / 10);
          D.line(ctx, X(hx), Y(pul[1]), X(hx), Y(hb), { color: '--rope', width: 2 });
          D.pulley(ctx, X(pul[0]), Y(pul[1]), V.L(R));
          if (p.m2 > 0) D.block(ctx, X(hx), Y(hb - s2 / 2), V.L(s2), V.L(s2), { fill: '--metal', label: `${f1(p.m2)} kg`, size: 9.5 });
          D.block(ctx, X(cb[0]), Y(cb[1]), V.L(bs), V.L(bs), { fill: '--body-b', ang: th, label: `${f1(p.m)} kg`, size: 10, upright: true });
          const lo = Math.max(0, p.m * (Math.sin(th) - p.mus * Math.cos(th))), hi = p.m * (Math.sin(th) + p.mus * Math.cos(th));
          if (!eq) stx.show(`Sin equilibrio: el bloque ${Dd > 0 ? 'sube' : 'baja'} por la rampa`, 'bad');
          const Tv = p.m2 * G;
          const fF = Math.abs(f) > 1e-6 ? { fx: -f * u[0], fy: -f * u[1], color: '--fric', label: 'f_{s}', dash: eq ? null : [5, 4], ox: 8 * Math.sin(th), oy: -8 * Math.cos(th), side: -1 } : null;
          const fw = { fx: 0, fy: -w, color: '--weight', label: 'w_{1}' }, fn = { fx: n * nr[0], fy: n * nr[1], color: '--normal', label: 'n' }, fT = { fx: Tv * u[0], fy: Tv * u[1], color: '--tension', label: 'T' };
          const F1 = !fF ? [fw, fn, fT] : f > 0 ? [fw, fF, fn, fT] : [fw, fn, fT, fF];
          const F2 = [{ fx: 0, fy: -Tv, color: '--weight', label: 'w_{2}' }, { fx: 0, fy: Tv, color: '--tension', label: 'T' }];
          const P = panels(pc, 3);
          const scale = (Math.min(P[0].w, P[0].h) * 0.34) / Math.max(w, Tv, 1);
          D.fbd(gctx, F1, Object.assign({}, P[0], { title: 'DCL DEL BLOQUE', shape: 'block', ang: th, fill: '--body-b', axes: true, axesAng: th, scale }));
          D.fbd(gctx, F2, Object.assign({}, P[1], { title: 'DCL DEL CONTRAPESO', shape: 'block', fill: '--metal', scale }));
          if (eq) polygon(gctx, F1, P[2], 'FUERZAS DEL BLOQUE');
          else {
            const Q = P[2];
            D.panel(gctx, Q.x, Q.y, Q.w, Q.h, { title: 'RANGO DE EQUILIBRIO DE m₂' });
            const bx = Q.x + 16, bw = Q.w - 32, by = Q.y + Q.h / 2 + 4, mmax = Math.max(hi * 1.3, p.m2 * 1.1, 1);
            const Xm = (m) => bx + (bw * m) / mmax;
            gctx.save();
            gctx.fillStyle = MC.alpha('--vel', 0.25);
            gctx.fillRect(Xm(lo), by - 8, Math.max(2, Xm(hi) - Xm(lo)), 16);
            gctx.restore();
            D.line(gctx, bx, by, bx + bw, by, { color: '--ink-3', width: 1 });
            D.line(gctx, Xm(p.m2), by - 16, Xm(p.m2), by + 16, { color: '--warn-ink', width: 2.5 });
            MC.text(gctx, `equilibrio: ${f2(lo)} a ${f2(hi)} kg`, (Xm(lo) + Xm(hi)) / 2, by - 16, { size: 11, align: 'center', color: '--vel', weight: 600, halo: true });
            MC.text(gctx, `m₂ = ${f1(p.m2)} kg`, Xm(p.m2), by + 30, { size: 11, align: 'center', color: '--warn-ink', weight: 600, halo: true });
          }
          lab('e1', 'Bloque, a lo largo de la rampa'); sim.set('e1', '<i>T</i> − <i>m</i>₁<i>g</i> sen θ − <i>f</i><sub>s</sub> = 0');
          lab('e2', 'Contrapeso'); sim.set('e2', `<i>T</i> = <i>m</i>₂<i>g</i> = ${fmtN(Tv)}`);
          lab('r1', 'Fricción necesaria'); sim.set('r1', Math.abs(Dd) < 1e-6 ? '0 N (no hace falta)' : `${fmtN(Math.abs(Dd))} ${Dd > 0 ? 'rampa abajo' : 'rampa arriba'}`);
          lab('r2', 'Fricción máxima μ<sub>s</sub><i>n</i>'); sim.set('r2', fmtN(fmax));
          sim.set('st', eq ? '<span class="goodv">en equilibrio</span>' : `<span class="warnv">no hay equilibrio: m₂ debe estar entre ${f2(lo)} y ${f2(hi)} kg</span>`);
        }
      } else if (c === 'pared') {
        const w = p.m * G, n = p.Fw, fmax = p.mus * n, eq = w <= fmax + 1e-9, fs = eq ? w : fmax;
        D.wall(ctx, X(0.6), Y(2.9), Y(0), 'right');
        const bs = 0.6, cb = [0.3, eq ? 1.4 : 1.1];
        D.block(ctx, X(cb[0]), Y(cb[1]), V.L(bs), V.L(bs), { fill: '--body-b', label: `${f1(p.m)} kg`, size: 10 });
        if (p.Fw > 0) hand(ctx, X(0) - 8, Y(cb[1]), Math.PI, 80 * kp);
        if (!eq) { stx.show(p.mus > 0 ? `Resbala: hace falta F ≥ ${f1(w / p.mus)} N` : 'Resbala: sin fricción no hay fuerza que lo sostenga', 'bad'); vecA(ctx, X(cb[0]) - 34, Y(cb[1]), -Math.PI / 2, 40 * kp, '--vel', 'v', { width: 2 }); }
        const Fw = { fx: 0, fy: -w, color: '--weight', label: 'w' }, FF = { fx: p.Fw, fy: 0, color: '--force', label: 'F' }, Fn = { fx: -n, fy: 0, color: '--normal', label: 'n' }, Ff = { fx: 0, fy: fs, color: '--fric', label: 'f_{s}', dash: eq ? null : [5, 4] };
        const P = panels(pc, 2);
        D.fbd(gctx, [Fw, FF, Fn, Ff], Object.assign({}, P[0], { title: 'DCL DEL BLOQUE', shape: 'block', fill: '--body-b' }));
        polygon(gctx, [Fw, FF, Ff, Fn], P[1], 'POLÍGONO DE FUERZAS');
        lab('e1', 'Σ<i>F<sub>x</sub></i>'); sim.set('e1', `<i>F</i> − <i>n</i> = 0 → <i>n</i> = ${fmtN(n)}`);
        lab('e2', 'Σ<i>F<sub>y</sub></i>'); sim.set('e2', `<i>f</i><sub>s</sub> − <i>mg</i> = 0 → <i>f</i><sub>s</sub> = ${fmtN(w)}`);
        lab('r1', 'Fricción máxima μ<sub>s</sub><i>n</i>'); sim.set('r1', fmtN(fmax));
        lab('r2', 'Fuerza mínima <i>mg</i>/μ<sub>s</sub>'); sim.set('r2', p.mus > 0 ? fmtN(w / p.mus) : '∞ (sin fricción no se sostiene)');
        sim.set('st', eq ? '<span class="goodv">en equilibrio</span>' : '<span class="warnv">no hay equilibrio: resbala</span>');
      } else {
        const ns = p.tipo === 'fija' ? 1 : p.tipo === 'movil' ? 2 : 4, wb = p.tipo === 'fija' ? 0 : p.wb, T = (p.W + wb) / ns;
        D.ceiling(ctx, X(-2.2), Y(2.85), X(1.2));
        const R = 0.22, rope = { color: '--rope', width: 2 };
        let free;
        if (p.tipo === 'fija') {
          const fx = -0.4, fy = 2.35;
          D.line(ctx, X(fx), Y(2.85), X(fx), Y(fy), { color: '--ink-2', width: 3 });
          D.line(ctx, X(fx - R), Y(fy), X(fx - R), Y(1.3), rope);
          ropeArc(ctx, X(fx), Y(fy), V.L(R) + 1, Math.PI, 0, false);
          D.pulley(ctx, X(fx), Y(fy), V.L(R));
          D.block(ctx, X(fx - R), Y(1.05), V.L(0.55), V.L(0.5), { fill: '--metal', label: `${f0(p.W)} N`, size: 10 });
          free = [fx + R, fy];
        } else if (p.tipo === 'movil') {
          const mx = -0.95, my = 1.5, fx = mx + 2 * R, fy = 2.35;
          D.line(ctx, X(mx - R), Y(2.85), X(mx - R), Y(my), rope);
          ropeArc(ctx, X(mx), Y(my), V.L(R) + 1, Math.PI, 0, true);
          D.line(ctx, X(mx + R), Y(my), X(fx - R), Y(fy), rope);
          ropeArc(ctx, X(fx), Y(fy), V.L(R) + 1, Math.PI, 0, false);
          D.line(ctx, X(fx), Y(2.85), X(fx), Y(fy), { color: '--ink-2', width: 3 });
          D.pulley(ctx, X(fx), Y(fy), V.L(R));
          D.line(ctx, X(mx), Y(my), X(mx), Y(1.1), { color: '--ink-2', width: 2 });
          D.pulley(ctx, X(mx), Y(my), V.L(R));
          D.block(ctx, X(mx), Y(0.85), V.L(0.6), V.L(0.5), { fill: '--metal', label: `${f0(p.W)} N`, size: 10 });
          free = [fx + R, fy];
        } else {
          const ux = -0.75, uy = 2.45, ly = 1.6;
          D.line(ctx, X(ux), Y(2.85), X(ux), Y(uy + 0.13), { color: '--ink-2', width: 3 });
          for (const dx of [-0.27, -0.09, 0.09, 0.27]) D.line(ctx, X(ux + dx), Y(uy), X(ux + dx), Y(ly), rope);
          D.block(ctx, X(ux), Y(uy), V.L(0.72), V.L(0.26), { fill: '--metal', r: 6 });
          D.block(ctx, X(ux), Y(ly), V.L(0.72), V.L(0.26), { fill: '--metal', r: 6 });
          D.line(ctx, X(ux + 0.36), Y(uy), X(ux + 0.62), Y(uy), rope);
          D.line(ctx, X(ux), Y(ly - 0.13), X(ux), Y(1.1), { color: '--ink-2', width: 2 });
          D.block(ctx, X(ux), Y(0.85), V.L(0.6), V.L(0.5), { fill: '--metal', label: `${f0(p.W)} N`, size: 10 });
          MC.text(ctx, '4 tramos', X(ux - 0.45), Y((uy + ly) / 2), { size: 10.5, color: '--ink-3', align: 'right' });
          free = [ux + 0.62, uy];
        }
        const hy = 1.5;
        D.line(ctx, X(free[0]), Y(free[1]), X(free[0]), Y(hy), rope);
        reach(ctx, V, free[0], hy, -1, 1.7);
        vecA(ctx, X(free[0]), Y(hy) + 10, -Math.PI / 2, M.clamp(16 + T * 0.1, 16, 80) * kp, '--force', `${f0(T)} N`, { vec: false, math: false, size: 11.5, labelSide: -1 });
        const F = Array.from({ length: ns }, (_, i) => ({ fx: 0, fy: T, color: '--tension', label: 'T', ox: (i - (ns - 1) / 2) * 15 })).concat([{ fx: 0, fy: -(p.W + wb), color: '--weight', label: wb > 0 ? 'W + w_{p}' : 'W' }]);
        const P = panels(pc, 2);
        D.fbd(gctx, F, Object.assign({}, P[0], { title: ns > 1 ? 'DCL: CARGA Y POLEAS MÓVILES' : 'DCL DE LA CARGA', shape: 'block', fill: '--metal' }));
        const Q = P[1];
        D.panel(gctx, Q.x, Q.y, Q.w, Q.h, { title: 'EL PRECIO DE LA VENTAJA' });
        const fz = Q.w < 300 ? 11 : 12, lh = Math.min(21, (Q.h - 34) / 5);
        [`Tramos que sostienen la carga: ${ns}`, `Fuerza de la persona: T = ${f0(T)} N`, `Ventaja mecánica: W/T = ${f2(p.W / T)}`, 'Por cada metro que sube la carga,', `se recogen ${ns} m de cuerda.`].forEach((t, i) => MC.text(gctx, t, Q.x + 12, Q.y + 30 + lh * (i + 0.6), { size: fz, color: i === 1 ? '--force' : '--ink-2', weight: i === 1 ? 700 : 400 }));
        lab('e1', ns > 1 ? 'Σ<i>F<sub>y</sub></i> (carga y poleas móviles)' : 'Σ<i>F<sub>y</sub></i> (carga)'); sim.set('e1', ns > 1 ? `${ns}<i>T</i> − (<i>W</i> + <i>w</i><sub>poleas</sub>) = 0` : '<i>T</i> − <i>W</i> = 0');
        lab('e2', 'Polea fija ideal'); sim.set('e2', 'sólo cambia la dirección de la cuerda');
        lab('r1', 'Fuerza de la persona <i>T</i>'); sim.set('r1', fmtN(T));
        lab('r2', 'Ventaja mecánica <i>W</i>/<i>T</i>'); sim.set('r2', f2(p.W / T));
        sim.set('st', '<span class="goodv">en equilibrio (quieto o subiendo con rapidez constante)</span>');
      }
    });
  });

  /* ======================================================================
     6.5  Laboratorio de sistemas en movimiento
     ====================================================================== */
  MC.defineSim('sistemas-movimiento', function (sim) {
    const sc = sim.canvas({ aspect: 2.4, cls: 'fixed' });
    const pc = sim.canvas({ aspect: 2.2 });
    const V = new MC.View2D(sc, { xmin: -4, xmax: 4, ymin: -0.45, ymax: 2.4, align: 'bottom', padB: 4 });
    const s = { x: 0, v: 0, xt: 0, vt: 0, off: false };
    const stx = sim.status(sc);
    let AP = null, lastCfg = null;
    sim.group('Montaje');
    sim.seg('cfg', { options: [['contacto', 'Contacto'], ['tren', 'Tren'], ['trineo', 'Trineo'], ['apilados', 'Apilados']], value: 'contacto', reset: true });
    const gK = sim.group('Cajas en contacto');
    sim.slider('m1', { label: 'Caja empujada <i>m</i>₁', min: 0.5, max: 20, step: 0.5, value: 4, unit: 'kg', fmt: f1, reset: true });
    sim.slider('m2', { label: 'Caja de adelante <i>m</i>₂', min: 0.5, max: 20, step: 0.5, value: 2, unit: 'kg', fmt: f1, reset: true });
    const gTr = sim.group('Vagones');
    sim.slider('mA', { label: 'Vagón delantero <i>m</i><sub>A</sub>', min: 100, max: 5000, step: 100, value: 2000, unit: 'kg', fmt: f0, reset: true });
    sim.slider('mB', { label: 'Vagón del medio <i>m</i><sub>B</sub>', min: 100, max: 5000, step: 100, value: 2000, unit: 'kg', fmt: f0, reset: true });
    sim.slider('mC', { label: 'Vagón trasero <i>m</i><sub>C</sub>', min: 100, max: 5000, step: 100, value: 2000, unit: 'kg', fmt: f0, reset: true });
    const gS = sim.group('Trineo');
    sim.slider('ms', { label: 'Masa del trineo <i>m</i>', min: 2, max: 60, step: 0.5, value: 20, unit: 'kg', fmt: f1, reset: true });
    sim.slider('Ts', { label: 'Tensión de la cuerda <i>T</i>', min: 0, max: 300, step: 1, value: 80, unit: 'N', fmt: f0, reset: true });
    sim.slider('ph', { label: 'Ángulo de la cuerda φ', min: 0, max: 80, step: 0.5, value: 30, unit: '°', fmt: f1, reset: true });
    const gA = sim.group('Bloques apilados');
    sim.slider('Mb', { label: 'Bloque de abajo <i>M</i>', min: 1, max: 20, step: 0.5, value: 4, unit: 'kg', fmt: f1, reset: true });
    sim.slider('mt', { label: 'Bloque de arriba <i>m</i>', min: 0.5, max: 10, step: 0.5, value: 1, unit: 'kg', fmt: f1, reset: true });
    sim.slider('mus', { label: 'Fricción estática entre ellos μ<sub>s</sub>', min: 0.05, max: 1, step: 0.01, value: 0.4, fmt: f2, reset: true });
    sim.group('Fuerza y fricción');
    sim.slider('F', { label: 'Fuerza aplicada <i>F</i>', min: 0, max: 200, step: 0.5, value: 30, unit: 'N', fmt: f0, reset: true });
    sim.slider('mu', { label: 'Fricción cinética con el piso μ<sub>k</sub>', min: 0, max: 0.8, step: 0.01, value: 0, fmt: f2, reset: true });
    sim.out('a', 'Aceleración', { hl: true });
    sim.out('i1', 'Fuerza interna');
    sim.out('i2', 'Fuerza interna');
    sim.out('c1', 'Comprobación');
    sim.out('c2', 'Comprobación');
    sim.presets([
      { id: 'contacto', label: 'Cajas de 4 y 2 kg empujadas con 30 N', v: { cfg: 'contacto', m1: 4, m2: 2, F: 30, mu: 0 }, note: 'a = 5.0 m/s²; la caja de 4 kg empuja a la de 2 kg con 10 N.' },
      { id: 'contacto-invertido', label: 'Las mismas cajas, empujando la de 2 kg', v: { cfg: 'contacto', m1: 2, m2: 4, F: 30, mu: 0 }, note: 'La aceleración no cambia, pero la fuerza entre las cajas sube a 20 N.' },
      { id: 'contacto-friccion', label: 'Cajas en contacto con fricción (μk = 0.2)', v: { cfg: 'contacto', m1: 4, m2: 2, F: 30, mu: 0.2 }, note: 'a = (30 − 11.8)/6 = 3.04 m/s²; la fuerza de contacto sigue siendo 10 N.' },
      { id: 'tren', label: 'Tres vagones de 2000 kg jalados con 3000 N', v: { cfg: 'tren', mA: 2000, mB: 2000, mC: 2000, F: 3000, mu: 0 }, note: 'a = 0.50 m/s²; tensiones de 2000 N y 1000 N en los enganches.' },
      { id: 'trineo', label: 'Trineo de 20 kg jalado con 80 N a 30° (μk = 0.15)', v: { cfg: 'trineo', ms: 20, Ts: 80, ph: 30, mu: 0.15 }, note: 'n = 156 N y a = 2.29 m/s².' },
      { id: 'trineo-optimo', label: 'El ángulo óptimo para jalar: tan φ = μk', v: { cfg: 'trineo', ms: 20, Ts: 80, ph: 8.5, mu: 0.15 }, note: 'Con φ = 8.5° la aceleración es máxima: 2.57 m/s², un poco más que a 30°.' },
      { id: 'juntos', label: 'Bloques apilados que se mueven juntos', v: { cfg: 'apilados', Mb: 4, mt: 1, mus: 0.4, F: 15 }, note: 'F es menor que μs g (M + m) = 19.6 N: la fricción estática alcanza para llevar el bloque de arriba.' },
      { id: 'desliza', label: 'El bloque de arriba desliza y se queda atrás', v: { cfg: 'apilados', Mb: 4, mt: 1, mus: 0.4, F: 30 }, note: 'Arriba a = μk g = 2.94 m/s²; abajo, 6.76 m/s². El de arriba se queda atrás y termina cayendo.' }
    ]);
    const GRP = { contacto: gK, tren: gTr, trineo: gS, apilados: gA };
    sim.onChange = () => {
      const c = sim.p.cfg;
      Object.keys(GRP).forEach((k) => { GRP[k].hidden = k !== c; });
      sim.ctl.F.show(c !== 'trineo');
      sim.ctl.mu.show(c !== 'apilados');
      sim.ctl.mu.label(c === 'trineo' ? 'Fricción cinética con la nieve μ<sub>k</sub>' : 'Fricción cinética con el piso μ<sub>k</sub>');
      if (c !== lastCfg) {
        const tr = c === 'tren';
        sim.ctl.F.range(0, tr ? 20000 : 200, tr ? 50 : 0.5);
        if (tr && sim.p.F < 200) sim.ctl.F.set(3000, true);
        if (!tr && sim.p.F > 200) sim.ctl.F.set(30, true);
        lastCfg = c;
      }
    };
    sim.onChange();
    const MUK = (p) => 0.75 * p.mus; /* fricción cinética entre los bloques apilados */
    /* dinámica de cada montaje */
    const dyn = () => {
      const p = sim.p, c = p.cfg;
      if (c === 'contacto') {
        const Mt = p.m1 + p.m2, fr = p.mu * Mt * G, mv = p.F > fr + 1e-9;
        if (mv) { const a = (p.F - fr) / Mt; return { a, mv, P: p.m2 * (a + p.mu * G), f1: p.mu * p.m1 * G, f2: p.mu * p.m2 * G }; }
        const f1s = Math.min(p.F, p.mu * p.m1 * G);
        return { a: 0, mv, P: p.F - f1s, f1: f1s, f2: p.F - f1s };
      }
      if (c === 'tren') {
        const Mt = p.mA + p.mB + p.mC, fr = p.mu * Mt * G, mv = p.F > fr + 1e-9;
        if (mv) { const a = (p.F - fr) / Mt; return { a, mv, T1: (p.mB + p.mC) * (a + p.mu * G), T2: p.mC * (a + p.mu * G), fA: p.mu * p.mA * G, fB: p.mu * p.mB * G, fC: p.mu * p.mC * G }; }
        const fA = Math.min(p.F, p.mu * p.mA * G), T1 = p.F - fA, fB = Math.min(T1, p.mu * p.mB * G), T2 = T1 - fB;
        return { a: 0, mv, T1, T2, fA, fB, fC: T2 };
      }
      if (c === 'trineo') {
        const phi = p.ph * RAD, w = p.ms * G, n = w - p.Ts * Math.sin(phi), lift = n < 0;
        const nn = Math.max(0, n), fk = p.mu * nn, push = p.Ts * Math.cos(phi), mv = push > fk + 1e-9;
        return { a: mv ? (push - fk) / p.ms : 0, mv, n: nn, f: mv ? fk : push, lift, w };
      }
      const together = p.F <= p.mus * G * (p.Mb + p.mt) + 1e-9;
      if (together) { const a = p.F / (p.Mb + p.mt); return { together, aT: a, aB: a, f: p.mt * a }; }
      const fk = MUK(p) * p.mt * G;
      return { together, aT: fk / p.mt, aB: (p.F - fk) / p.Mb, f: fk };
    };
    const Lb = 1.2, Hb = 0.45, Lt = 0.5, Ht = 0.4;
    sim.run({
      startLabel: 'Soltar',
      h: 1 / 600,
      reset() { s.x = 0; s.v = 0; s.xt = 0; s.vt = 0; s.off = false; },
      step(h) {
        const q = dyn();
        if (sim.p.cfg === 'apilados') {
          s.v += q.aB * h; s.x += s.v * h;
          if (!s.off) {
            s.vt += (q.together ? q.aB : q.aT) * h; s.xt += s.vt * h;
            if (s.xt - s.x < -Lb / 2) { s.off = true; sim.end(); }
          }
        } else { s.v += q.a * h; s.x += s.v * h; }
        if (sim.t >= 5) sim.end();
      }
    });
    const blockW = (m, ref) => (0.45 + 0.3 * Math.cbrt(m / ref)) * 1.1;
    sim.onDraw(() => {
      const p = sim.p, c = p.cfg, q = dyn(), ctx = sc.ctx;
      V.setRange({ xmin: s.x - 4, xmax: s.x + 4 });
      D.clear(sc);
      V.grid({ labels: false });
      const X = (x) => V.X(x), Y = (y) => V.Y(y), kp = V.s / 90;
      D.ground(ctx, 0, Y(0), sc.w, { depth: 10 });
      for (let m = Math.ceil(V.x0); m <= V.x1; m++) {
        D.line(ctx, X(m), Y(0) + 2, X(m), Y(0) + 8, { color: '--ink-3', width: 1 });
        MC.text(ctx, `${m} m`, X(m), Y(0) + 22, { size: 10, align: 'center', mono: true, color: '--ink-3' });
      }
      const gctx = pc.ctx;
      D.clear(pc);
      const checks = (P, lines) => lines.forEach((t, i) => MC.text(gctx, t, P.x + P.w - 8, P.y + 32 + i * 15, { size: 11, align: 'right', mono: true, color: i ? '--vel' : '--ink-2', halo: true }));
      const fbd = (F, P, title, fill, scale) => D.fbd(gctx, F, Object.assign({}, P, { title, shape: 'block', fill, scale, cdx: -P.w * 0.15 }));
      const velArrow = (x, y) => { if (s.v > 0.02) vecA(ctx, x, y, 0, M.clamp(14 + s.v * 7, 14, 110) * kp, '--vel', 'v', { width: 2 }); };
      stx.hide();
      if (c === 'contacto') {
        const w1 = blockW(p.m1, 10), w2 = blockW(p.m2, 10), h1 = w1 * 0.9, h2 = w2 * 0.9;
        D.block(ctx, X(s.x - w1 / 2), Y(h1 / 2), V.L(w1), V.L(h1), { fill: '--body-b', label: 'm₁', size: 13, math: true });
        D.block(ctx, X(s.x + w2 / 2), Y(h2 / 2), V.L(w2), V.L(h2), { fill: '--body-a', label: 'm₂', size: 13, math: true });
        const face = X(s.x - w1);
        if (p.F > 0) {
          hand(ctx, face - 7, Y(h1 * 0.4), Math.PI, 40 * kp);
          const LF = M.clamp(16 + p.F * 0.6, 16, 110) * kp;
          vecA(ctx, face - 3 - LF, Y(h1 * 0.85), 0, LF, '--force', 'F', { labelAt: 'mid', labelSide: -1 });
        }
        velArrow(X(s.x), Y(Math.max(h1, h2)) - 14);
        if (!q.mv && p.F > 0) stx.show('No arranca: F no supera la fricción máxima', 'bad');
        const P = panels(pc, 2);
        const F1 = [{ fx: 0, fy: -p.m1 * G, color: '--weight', label: 'w_{1}' }, { fx: 0, fy: p.m1 * G, color: '--normal', label: 'n_{1}' }, { fx: p.F, fy: 0, color: '--force', label: 'F' }, { fx: -q.P, fy: 0, color: '--normal', label: 'P', oy: 9 }];
        const F2 = [{ fx: 0, fy: -p.m2 * G, color: '--weight', label: 'w_{2}' }, { fx: 0, fy: p.m2 * G, color: '--normal', label: 'n_{2}' }, { fx: q.P, fy: 0, color: '--normal', label: 'P', oy: 9 }];
        if (q.f1 > 1e-6) F1.push({ fx: -q.f1, fy: 0, color: '--fric', label: 'f_{1}', oy: -9 });
        if (q.f2 > 1e-6) F2.push({ fx: -q.f2, fy: 0, color: '--fric', label: 'f_{2}', oy: -9 });
        const scale = (Math.min(P[0].w, P[0].h) * 0.33) / Math.max(p.m1 * G, p.m2 * G, p.F, 1);
        fbd(F1, P[0], `DCL DE m₁ (${f1(p.m1)} kg)`, '--body-b', scale);
        fbd(F2, P[1], `DCL DE m₂ (${f1(p.m2)} kg)`, '--body-a', scale);
        checks(P[0], [`ΣF = ${f1(p.F - q.P - q.f1)} N`, `m₁a = ${f1(p.m1 * q.a)} N ✓`]);
        checks(P[1], [`ΣF = ${f1(q.P - q.f2)} N`, `m₂a = ${f1(p.m2 * q.a)} N ✓`]);
        sim._outs.a.label('Aceleración <i>a</i> = (<i>F</i> − <i>f</i>)/(<i>m</i>₁ + <i>m</i>₂)'); sim.set('a', `${f2(q.a)} m/s²`);
        sim._outs.i1.label('Fuerza de contacto entre las cajas <i>P</i>'); sim.set('i1', `${f1(q.P)} N`);
        sim._outs.i2.label('Normal de cada caja'); sim.set('i2', `${f1(p.m1 * G)} N y ${f1(p.m2 * G)} N`);
        sim._outs.c1.label('Caja 1: <i>F</i> − <i>P</i> − <i>f</i>₁ = <i>m</i>₁<i>a</i>'); sim.set('c1', `${f1(p.F - q.P - q.f1)} N = ${f1(p.m1 * q.a)} N`);
        sim._outs.c2.label('Caja 2: <i>P</i> − <i>f</i>₂ = <i>m</i>₂<i>a</i>'); sim.set('c2', `${f1(q.P - q.f2)} N = ${f1(p.m2 * q.a)} N`);
      } else if (c === 'tren') {
        const ms = [p.mC, p.mB, p.mA], names = ['C', 'B', 'A'], ws = ms.map((m) => blockW(m, 5000)), gap = 0.35;
        let xl = s.x - (ws.reduce((a, b) => a + b, 0) + gap * 2 + 1.9) / 2;
        const xs = ws.map((w) => { const xm = xl + w / 2; xl += w + gap; return xm; });
        xs.forEach((xm, i) => {
          D.block(ctx, X(xm), Y(0.36), V.L(ws[i]), V.L(0.5), { fill: ['--body-e', '--body-d', '--body-a'][i], label: names[i], size: 12 });
          D.ball(ctx, X(xm - ws[i] * 0.28), Y(0.07), 6, { fill: '--tire' });
          D.ball(ctx, X(xm + ws[i] * 0.28), Y(0.07), 6, { fill: '--tire' });
        });
        for (let i = 0; i < 2; i++) D.line(ctx, X(xs[i] + ws[i] / 2), Y(0.36), X(xs[i + 1] - ws[i + 1] / 2), Y(0.36), { color: '--rope', width: 3 });
        const front = xs[2] + ws[2] / 2;
        D.line(ctx, X(front), Y(0.36), X(front + 0.6), Y(0.36), { color: '--rope', width: 3 });
        D.block(ctx, X(front + 1.25), Y(0.5), V.L(1.3), V.L(0.8), { fill: '--c2', label: 'locomotora', size: 10, labelColor: '--brand-fg' });
        D.ball(ctx, X(front + 0.9), Y(0.08), 7, { fill: '--tire' });
        D.ball(ctx, X(front + 1.6), Y(0.08), 7, { fill: '--tire' });
        vecA(ctx, X(front) + 2, Y(0.36) - 16, 0, V.L(0.5), '--force', 'F', { labelAt: 'mid', labelSide: -1 });
        velArrow(X(xs[1]), Y(0.61) - 14);
        if (!q.mv && p.F > 0) stx.show('No arranca: F no supera la fricción total', 'bad');
        const P = panels(pc, 3);
        const fr = (fv) => (fv > 1e-6 ? [{ fx: -fv, fy: 0, color: '--fric', label: 'f', oy: -9 }] : []);
        const FA = [{ fx: 0, fy: -p.mA * G, color: '--weight', label: 'w' }, { fx: 0, fy: p.mA * G, color: '--normal', label: 'n' }, { fx: p.F, fy: 0, color: '--force', label: 'F' }, { fx: -q.T1, fy: 0, color: '--tension', label: 'T_{1}', oy: 9 }].concat(fr(q.fA));
        const FB = [{ fx: 0, fy: -p.mB * G, color: '--weight', label: 'w' }, { fx: 0, fy: p.mB * G, color: '--normal', label: 'n' }, { fx: q.T1, fy: 0, color: '--tension', label: 'T_{1}', oy: 9 }, { fx: -q.T2, fy: 0, color: '--tension', label: 'T_{2}', oy: -9 }].concat(fr(q.fB));
        const FC = [{ fx: 0, fy: -p.mC * G, color: '--weight', label: 'w' }, { fx: 0, fy: p.mC * G, color: '--normal', label: 'n' }, { fx: q.T2, fy: 0, color: '--tension', label: 'T_{2}', oy: 9 }].concat(fr(q.fC));
        /* los pesos son mucho mayores que las fuerzas horizontales: escala propia para cada eje, común a los tres vagones */
        const ml = Math.min(P[0].w, P[0].h) * 0.33, sx = ml / Math.max(p.F, 1), sy = ml / Math.max(p.mA, p.mB, p.mC) / G;
        [[FC, 'DCL DE C (ATRÁS)', '--body-e'], [FB, 'DCL DE B (MEDIO)', '--body-d'], [FA, 'DCL DE A (ADELANTE)', '--body-a']].forEach(([F, t, fill], i) => fbdXY(gctx, F, Object.assign({}, P[i], { title: t, shape: 'block', fill, sx, sy, cdx: -P[i].w * 0.15 })));
        checks(P[0], [`ΣF = ${f0(q.T2 - q.fC)} N`, `m a = ${f0(p.mC * q.a)} N ✓`]);
        checks(P[1], [`ΣF = ${f0(q.T1 - q.T2 - q.fB)} N`, `m a = ${f0(p.mB * q.a)} N ✓`]);
        checks(P[2], [`ΣF = ${f0(p.F - q.T1 - q.fA)} N`, `m a = ${f0(p.mA * q.a)} N ✓`]);
        sim._outs.a.label('Aceleración del tren <i>a</i> = (<i>F</i> − <i>f</i>)/<i>M</i>'); sim.set('a', `${f3(q.a)} m/s²`);
        sim._outs.i1.label('Enganche A–B, <i>T</i>₁ (arrastra B y C)'); sim.set('i1', `${f0(q.T1)} N`);
        sim._outs.i2.label('Enganche B–C, <i>T</i>₂ (arrastra sólo C)'); sim.set('i2', `${f0(q.T2)} N`);
        sim._outs.c1.label('Tren completo: <i>F</i> − <i>f</i> = <i>Ma</i>'); sim.set('c1', `${f0(p.F - q.fA - q.fB - q.fC)} N = ${f0((p.mA + p.mB + p.mC) * q.a)} N`);
        sim._outs.c2.label('Las tensiones bajan hacia atrás'); sim.set('c2', `${f0(p.F)} > ${f0(q.T1)} > ${f0(q.T2)} N`);
      } else if (c === 'trineo') {
        const phi = p.ph * RAD, sw = 1.1, yl = q.lift ? 0.2 : 0;
        D.block(ctx, X(s.x), Y(0.22 + yl), V.L(sw), V.L(0.42), { fill: '--wood', label: `${f1(p.ms)} kg`, size: 10 });
        const att = [s.x + sw / 2, 0.3 + yl], end = [att[0] + 1.6 * Math.cos(phi), att[1] + 1.6 * Math.sin(phi)];
        D.line(ctx, X(att[0]), Y(att[1]), X(end[0]), Y(end[1]), { color: '--rope', width: 2 });
        hand(ctx, X(end[0]), Y(end[1]), phi, 38 * kp);
        velArrow(X(s.x), Y(0.43 + yl) - 14);
        if (q.lift) stx.show('La cuerda levanta el trineo: T sen φ supera el peso', 'bad');
        else if (!q.mv && p.Ts > 0) stx.show('No arranca: T cos φ no supera la fricción', 'bad');
        const P = panels(pc, 2);
        const F = [{ fx: 0, fy: -q.w, color: '--weight', label: 'w' }, { fx: 0, fy: q.n, color: '--normal', label: 'n' }, { fx: p.Ts * Math.cos(phi), fy: p.Ts * Math.sin(phi), color: '--tension', label: 'T' }];
        if (q.f > 1e-6) F.push({ fx: -q.f, fy: 0, color: '--fric', label: q.mv ? 'f_{k}' : 'f_{s}', oy: -9 });
        fbd(F, P[0], 'DCL DEL TRINEO', '--wood', (Math.min(P[0].w, P[0].h) * 0.33) / Math.max(q.w, p.Ts, 1));
        checks(P[0], [`ΣFx = ${f1(p.Ts * Math.cos(phi) - q.f)} N`, `m a = ${f1(p.ms * q.a)} N ✓`]);
        const Pa = AP || (AP = new MC.Plot(gctx));
        Pa.ctx = gctx;
        const af = (deg) => { const r = deg * RAD, n = Math.max(0, p.ms * G - p.Ts * Math.sin(r)); return Math.max(0, (p.Ts * Math.cos(r) - p.mu * n) / p.ms); };
        let amax = 0.1;
        for (let d = 0; d <= 80; d += 1) amax = Math.max(amax, af(d));
        const Q = P[1];
        D.panel(gctx, Q.x, Q.y, Q.w, Q.h, {});
        Pa.set({ x: Q.x, y: Q.y, w: Q.w, h: Q.h, xmin: 0, xmax: 80, ymin: 0, ymax: MC.niceCeil(amax * 1.15), xlabel: ['φ', '°'], ylabel: ['a', 'm/s²'], mb: 36, mt: 26, ml: 48, mr: 12, title: 'Aceleración según el ángulo de la cuerda' });
        Pa.frame();
        Pa.fn(af, { color: '--acc', width: 2.2, n: 160 });
        const opt = Math.atan(p.mu) / RAD;
        Pa.vline(opt, { color: '--vel', label: `óptimo ${f1(opt)}°`, labelY: 14 });
        Pa.dot(p.ph, af(p.ph), { color: '--acc', r: 5.5 });
        sim._outs.a.label('Aceleración <i>a</i> = (<i>T</i> cos φ − μ<sub>k</sub><i>n</i>)/<i>m</i>'); sim.set('a', `${f2(q.a)} m/s²`);
        sim._outs.i1.label('Normal <i>n</i> = <i>mg</i> − <i>T</i> sen φ'); sim.set('i1', `${f1(q.n)} N (peso ${f1(q.w)} N)`);
        sim._outs.i2.label(q.mv ? 'Fricción cinética μ<sub>k</sub><i>n</i>' : 'Fricción estática'); sim.set('i2', `${f1(q.f)} N`);
        sim._outs.c1.label('Ángulo óptimo: tan φ = μ<sub>k</sub>'); sim.set('c1', `${f1(opt)}°`);
        sim._outs.c2.label('Componente horizontal <i>T</i> cos φ'); sim.set('c2', `${f1(p.Ts * Math.cos(phi))} N`);
      } else {
        D.block(ctx, X(s.x), Y(Hb / 2 + 0.06), V.L(Lb), V.L(Hb), { fill: '--body-b', label: `M = ${f1(p.Mb)} kg`, size: 10 });
        D.ball(ctx, X(s.x - Lb * 0.35), Y(0.06), 6, { fill: '--tire' });
        D.ball(ctx, X(s.x + Lb * 0.35), Y(0.06), 6, { fill: '--tire' });
        const yt = s.off ? Ht / 2 : Hb + 0.06 + Ht / 2, xt = s.off ? s.x - Lb / 2 - Lt / 2 - 0.08 : s.xt;
        D.block(ctx, X(xt), Y(yt), V.L(Lt), V.L(Ht), { fill: '--body-a', label: 'm', size: 13, math: true });
        if (p.F > 0) { const LF = M.clamp(16 + p.F * 0.6, 16, 110) * kp; vecA(ctx, X(s.x - Lb / 2) - 3 - LF, Y(Hb * 0.8 + 0.06), 0, LF, '--force', 'F', { labelAt: 'mid', labelSide: -1 }); }
        velArrow(X(s.x), Y(Hb + Ht + 0.06) - 14);
        if (s.off) stx.show('El bloque de arriba se quedó atrás y cayó', 'bad');
        else if (!q.together) stx.show('El bloque de arriba desliza hacia atrás', 'bad');
        const P = panels(pc, 2), lf = q.together ? 'f_{s}' : 'f_{k}', dash = q.together ? null : [5, 4];
        const FTp = [{ fx: 0, fy: -p.mt * G, color: '--weight', label: 'w' }, { fx: 0, fy: p.mt * G, color: '--normal', label: 'n' }, { fx: q.f, fy: 0, color: '--fric', label: lf, dash }];
        const FBt = [{ fx: 0, fy: -p.Mb * G, color: '--weight', label: 'W', ox: -10 }, { fx: 0, fy: -p.mt * G, color: '--normal', label: "n'", ox: 10 }, { fx: 0, fy: (p.Mb + p.mt) * G, color: '--normal', label: 'n_{piso}' }, { fx: p.F, fy: 0, color: '--force', label: 'F' }, { fx: -q.f, fy: 0, color: '--fric', label: lf, dash, oy: -9 }];
        /* escala propia para cada eje, común a los dos bloques: así la fricción entre ellos se ve igual en ambos */
        const ml = Math.min(P[0].w, P[0].h) * 0.33, sx = ml / Math.max(p.F, q.f, 1e-6), sy = ml / ((p.Mb + p.mt) * G);
        fbdXY(gctx, FTp, Object.assign({}, P[0], { title: 'DCL DEL BLOQUE DE ARRIBA', shape: 'block', fill: '--body-a', sx, sy, cdx: -P[0].w * 0.15 }));
        fbdXY(gctx, FBt, Object.assign({}, P[1], { title: 'DCL DEL BLOQUE DE ABAJO', shape: 'block', fill: '--body-b', sx, sy, cdx: -P[1].w * 0.15 }));
        checks(P[0], [`ΣF = ${f2(q.f)} N`, `m a = ${f2(p.mt * q.aT)} N ✓`]);
        checks(P[1], [`ΣF = ${f1(p.F - q.f)} N`, `M a = ${f1(p.Mb * q.aB)} N ✓`]);
        sim._outs.a.label(q.together ? 'Aceleración común <i>F</i>/(<i>M</i> + <i>m</i>)' : 'Aceleraciones: arriba y abajo'); sim.set('a', q.together ? `${f2(q.aT)} m/s²` : `${f2(q.aT)} y ${f2(q.aB)} m/s²`);
        sim._outs.i1.label(q.together ? 'Fricción estática necesaria <i>ma</i>' : 'Fricción cinética μ<sub>k</sub><i>mg</i> (μ<sub>k</sub> = 0.75 μ<sub>s</sub>)'); sim.set('i1', `${f2(q.f)} N`);
        sim._outs.i2.label('Fricción estática máxima μ<sub>s</sub><i>mg</i>'); sim.set('i2', `${f2(p.mus * p.mt * G)} N`);
        sim._outs.c1.label('Fuerza máxima para que vayan juntos'); sim.set('c1', `μ<sub>s</sub><i>g</i>(<i>M</i> + <i>m</i>) = ${f1(p.mus * G * (p.Mb + p.mt))} N`);
        sim._outs.c2.label('Régimen'); sim.set('c2', q.together ? '<span class="goodv">se mueven juntos</span>' : '<span class="warnv">el de arriba desliza hacia atrás</span>');
      }
    });
  });
})();
