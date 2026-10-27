/* Capítulo 11 — Galileo */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;

  /* 11.1 El plano inclinado y el reloj de agua */
  EM.defineSim('plano-inclinado', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('th', { label: 'Inclinación del plano', min: 1, max: 30, step: 0.5, value: 4, fmt: (v) => v.toFixed(1) + '°' });
    sim.slider('dt', { label: 'Intervalo del reloj de agua', min: 0.3, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' s' });
    sim.slider('err', { label: 'Error de cada lectura (en la distancia)', min: 0, max: 5, step: 0.1, value: 0.5, fmt: (v) => v.toFixed(1) + ' %' });
    sim.check('roll', { label: 'Bola que rueda (esfera maciza, 5/7)', value: true });
    sim.check('gal', { label: 'Superponer los datos del folio 116v (en puntos)', value: true });
    sim.button('Otra tanda de errores', () => { seed++; sim.redraw(); });
    sim.out('a', 'Aceleración de la bola', { hl: true });
    sim.out('g', 'g deducido ignorando la rotación');
    sim.out('r', 'Distancias / distancia del primer intervalo');
    sim.out('gal', 'Datos de Galileo, razón con la primera');
    sim.note('Galileo (c. 1604-1608) dejaba rodar una bola de bronce por un canal de pergamino en una tabla de 12 codos (≈ 5.5 m) y medía el tiempo pesando el agua que salía de un depósito por un tubito. Las distancias recorridas en intervalos iguales crecían como los cuadrados 1, 4, 9, 16, 25, 36, 49, 64; es la ley \\(s\\propto t^2\\) de la caída uniformemente acelerada. Los 8 números del folio 116v (en «puntos», 1 punto ≈ 0.94 mm) la confirman al 0.5 % en promedio.');
    let seed = 1;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, rng = C.rng(500 + seed);
      EM.draw.clear(cv);
      const a = C.inclineAccel(p.th, p.roll), n = 8;
      const d = [], meas = [];
      for (let i = 1; i <= n; i++) { const s = C.distAt(a, i * p.dt); d.push(s); meas.push(s * (1 + (p.err / 100) * rng.gauss())); }
      const half = W * 0.5;
      /* plano */
      const L = Math.min(half * 0.9, 380), x0 = 20, y0 = H * 0.45, ang = Math.min(p.th, 18) * DEG * 0.9 + 0.05;
      const sx = L / Math.max(d[n - 1], 0.01), px = (s) => x0 + s * sx * Math.cos(ang), py = (s) => y0 + s * sx * Math.sin(ang);
      ctx.strokeStyle = EM.col('--sand'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(px(d[n - 1]), py(d[n - 1])); ctx.stroke();
      for (let i = 0; i < n; i++) { const X = px(meas[i]), Y = py(meas[i]); ctx.fillStyle = EM.alpha('--accent', 0.9); ctx.beginPath(); ctx.arc(X, Y - 8, 5, 0, TAU); ctx.fill(); EM.text(ctx, String(i + 1), X, Y - 18, { size: 10.5, align: 'center', color: '--ink-2' }); }
      EM.text(ctx, 'posiciones de la bola al final de cada intervalo', x0, 18, { size: 11, color: '--ink-3' });
      /* ratios */
      const rat = meas.map((s) => s / meas[0]);
      const gal = C.galileoPunti.map((s) => s / C.galileoPunti[0]);
      const pl = new EM.Plot(ctx, { x: half + 6, y: 4, w: W - half - 10, h: H - 8, xmin: 0.5, xmax: 8.5, ymin: 0, ymax: 70, xlabel: 'n (intervalos de tiempo iguales)', ylabel: 'distancia / primera distancia' });
      pl.frame();
      pl.fn((x) => x * x, { color: '--ink-3', width: 1.4, dash: [4, 4], from: 0.5, to: 8.5 });
      rat.forEach((r, i) => pl.dot(i + 1, r, { color: '--c1', r: 4.5 }));
      if (p.gal) gal.forEach((r, i) => pl.dot(i + 1, r, { color: '--accent', r: 3 }));
      pl.legend([{ label: 'n² (ley)', color: '--ink-3', kind: 'dash' }, { label: 'simulación', color: '--c1', kind: 'dot' }, { label: 'folio 116v', color: '--accent', kind: 'dot' }], 'tl');
      sim.set('a', EM.fix(a, 3) + ' m/s²');
      sim.set('g', EM.fix(a / Math.sin(p.th * DEG), 2) + ' m/s²  (real 9.81)');
      sim.set('r', rat.map((r) => EM.fix(r, 1)).join(' · '));
      sim.set('gal', gal.map((r) => EM.fix(r, 2)).join(' · '));
    });
  });

  /* 11.2 Las fases de Venus */
  EM.defineSim('fases-venus', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('mod', { label: 'Sistema del mundo', options: [['pto', 'Ptolomeo'], ['cop', 'Copérnico / Tycho']], value: 'cop' });
    sim.slider('t', { label: 'Día', min: 0, max: 1200, step: 1, value: 300, fmt: (v) => v.toFixed(0) });
    sim.out('k', 'Fracción iluminada de Venus', { hl: true });
    sim.out('d', 'Distancia a la Tierra (UA)');
    sim.out('s', 'Tamaño aparente relativo');
    sim.out('rng', 'Fases posibles en este sistema');
    sim.note('Con el telescopio, Galileo vio desde fines de 1610 que Venus pasa por <em>todas</em> las fases de la Luna, y que su tamaño aparente es mayor en fase creciente que en fase llena. Con Ptolomeo, un Venus siempre entre la Tierra y el Sol solo puede mostrar fases de creciente a cuarto; con Copérnico (o con Tycho), todas. Es la primera observación que separa los dos sistemas.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, t = p.t;
      EM.draw.clear(cv);
      const f = C.venusPhase(t, p.mod);
      /* Diagrama */
      const cx = W * 0.2, cy = H * 0.5, sc = Math.min(W * 0.17, H * 0.4);
      const X = (v) => cx + sc * v[0], Y = (v) => cy - sc * v[1];
      const dot = (v, r, col) => { ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.arc(X(v), Y(v), r, 0, TAU); ctx.fill(); };
      ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.setLineDash([3, 4]);
      if (p.mod === 'cop') { ctx.beginPath(); ctx.arc(cx, cy, sc, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, sc * 0.723, 0, TAU); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.strokeStyle = EM.alpha('--ray', 0.6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(f.E), Y(f.E)); ctx.lineTo(X(f.V), Y(f.V)); ctx.stroke();
      dot(f.S, 8, '--gold'); dot(f.E, 5.5, '--c1'); dot(f.V, 4.5, '--c2');
      EM.text(ctx, p.mod === 'cop' ? 'Sol en el centro' : 'Tierra en el centro; el Sol da una vuelta por año', cx, 16, { size: 11.5, align: 'center', color: '--ink-2', weight: 650 });
      /* Disco de Venus con fase (iluminación desde el Sol: se dibuja el terminador) */
      const R = Math.min(H * 0.18, W * 0.07) * Math.min(2.2, 0.55 / Math.max(f.dist, 0.2) + 0.2), dx = W * 0.5, dy = H * 0.5;
      ctx.fillStyle = EM.alpha('--ink', 0.12); ctx.beginPath(); ctx.arc(dx, dy, R, 0, TAU); ctx.fill();
      ctx.fillStyle = EM.col('--gold');
      ctx.beginPath();
      const kk = f.k, ex = R * (2 * kk - 1);
      ctx.arc(dx, dy, R, -PI / 2, PI / 2, false);
      if (ex > 0) ctx.ellipse(dx, dy, Math.abs(ex), R, 0, PI / 2, 3 * PI / 2, false); else ctx.ellipse(dx, dy, Math.abs(ex), R, 0, PI / 2, -PI / 2, true);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dx, dy, R, 0, TAU); ctx.stroke();
      EM.text(ctx, 'como se vería', dx, H * 0.9, { size: 11.5, align: 'center', color: '--ink-3' });
      /* Series temporales */
      const T0 = 0, T1 = 1200, xs = [], ks = [], ds = [];
      for (let i = 0; i <= 240; i++) { const q = C.venusPhase((T1 * i) / 240, p.mod); xs.push((T1 * i) / 240); ks.push(q.k); ds.push(1 / q.dist); }
      const pl = new EM.Plot(ctx, { x: W * 0.64, y: 6, w: W * 0.36 - 8, h: H - 12, xmin: 0, xmax: T1, ymin: 0, ymax: 1.1, xlabel: 'día', ylabel: 'fase (azul) y tamaño relativo (rojo)' });
      pl.frame(); pl.xy(xs, ks, { color: '--c1', width: 2 }); pl.xy(xs, ds.map((v) => v / 6.3), { color: '--c2', width: 1.6 });
      pl.vline(t, { color: '--accent', dash: [] }); pl.dot(t, f.k, { color: '--c1', r: 5 });
      let kmin = 2, kmax = -1; for (const k of ks) { kmin = Math.min(kmin, k); kmax = Math.max(kmax, k); }
      sim.set('k', EM.fix(100 * f.k, 0) + ' %');
      sim.set('d', EM.fix(f.dist, 3));
      sim.set('s', EM.fix((1 / f.dist) / 1, 2) + ' (1 = Tierra–Sol)');
      sim.set('rng', 'de ' + EM.fix(100 * kmin, 0) + ' % a ' + EM.fix(100 * kmax, 0) + ' %');
    });
  });

  /* 11.3 Las lunas de Júpiter */
  EM.defineSim('lunas-jupiter', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('n', { label: 'Noche de observación (desde el 7 de enero)', min: 0, max: 60, step: 0.25, value: 6, fmt: (v) => v.toFixed(2) });
    sim.check('curva', { label: 'Mostrar las curvas teóricas', value: true });
    sim.out('pos', 'Posiciones respecto de Júpiter (radios de Júpiter)', { hl: true });
    sim.out('k', 'T²/a³ de cada luna (días²/radios³)');
    sim.out('cuantas', 'Lunas visibles (no ocultas)');
    sim.note('Galileo observó tres «estrellitas» alineadas con Júpiter el 7 de enero de 1610; la noche del 13 vio una cuarta. Siguieron a Júpiter, cambiando de lado y de distancia: eran satélites que giraban a su alrededor, la primera prueba directa de que hay centros de movimiento distintos de la Tierra. Las fases iniciales son arbitrarias en esta simulación.');
    const ph0 = [0.3, 2.6, 4.1, 0.9];
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.38, w: W, h: H * 0.62, xmin: 0, xmax: 60, ymin: -30, ymax: 30, xlabel: 'noches desde el 7 de enero de 1610', ylabel: 'x / R_J' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      const cols = ['--c1', '--c2', '--c3', '--c5'];
      C.GALILEAN.forEach((m, i) => {
        if (p.curva) pl.fn((x) => m.a * Math.sin(TAU * x / m.T + ph0[i]), { color: cols[i], width: 1.1, n: 700, alpha: 0.75 });
        pl.dot(p.n, m.a * Math.sin(TAU * p.n / m.T + ph0[i]), { color: cols[i], r: 4.5 });
      });
      /* vista de Júpiter */
      const cx = W / 2, cy = H * 0.17, sc = (W * 0.46) / 30;
      ctx.fillStyle = EM.alpha('--c4', 0.8); ctx.beginPath(); ctx.arc(cx, cy, 1.2 * sc, 0, TAU); ctx.fill();
      let vis = 0; const parts = [];
      C.GALILEAN.forEach((m, i) => {
        const ang = TAU * p.n / m.T + ph0[i], x = m.a * Math.sin(ang), z = m.a * Math.cos(ang), hidden = z < 0 && Math.abs(x) < 1.2;
        if (!hidden) vis++;
        ctx.fillStyle = EM.col(cols[i]); ctx.globalAlpha = hidden ? 0.15 : 1; ctx.beginPath(); ctx.arc(cx + x * sc, cy, 3.6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        parts.push(m.n + ' ' + EM.fix(x, 1));
      });
      EM.text(ctx, 'Júpiter', cx, cy + 22, { size: 11, align: 'center', color: '--ink-3' });
      sim.set('pos', parts.join(' · '));
      sim.set('k', C.GALILEAN.map((m) => EM.fix((m.T * m.T) / Math.pow(m.a, 3), 5)).join(' · '));
      sim.set('cuantas', vis + ' de 4');
    });
  });

  /* 11.4 Montañas de la Luna */
  EM.defineSim('montanas-luna', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('f', { label: 'Distancia de la cumbre iluminada al terminador (fracción del diámetro lunar)', min: 0.004, max: 0.1, step: 0.002, value: 0.05, fmt: (v) => v.toFixed(3) });
    sim.out('d', 'Distancia en kilómetros', { hl: true });
    sim.out('h', 'Altura de la montaña');
    sim.out('cmp', 'Comparación');
    sim.note('Observando la Luna en cuarto, Galileo vio puntos luminosos en la parte oscura, separados del terminador: cumbres que reciben ya el Sol cuando el valle contiguo aún está en sombra. Con el teorema de Pitágoras (un triángulo rectángulo de catetos \\(R\\) y \\(d\\), e hipotenusa \\(R+h\\)) midió su altura: \\(h=\\sqrt{R^2+d^2}-R\\approx d^2/2R\\). Concluyó que había montañas «de más de cuatro millas».');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, f = sim.p.f, R = 1737.4, D = 2 * R, d = f * D, h = C.moonMountain(d, R);
      EM.draw.clear(cv);
      const cx = W * 0.3, cy = H * 0.5, r = Math.min(W * 0.24, H * 0.42);
      ctx.fillStyle = EM.alpha('--ink', 0.12); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      ctx.fillStyle = EM.alpha('--gold', 0.55); ctx.beginPath(); ctx.arc(cx, cy, r, -PI / 2, PI / 2, true); ctx.fill(); /* mitad iluminada (derecha) */
      ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke(); ctx.setLineDash([]);
      const xp = cx - f * 2 * r; /* cumbre iluminada en la zona oscura, a la izquierda del terminador */
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(xp, cy - r * 0.15, 4, 0, TAU); ctx.fill();
      EM.text(ctx, 'terminador', cx + 4, cy - r - 6, { size: 11, color: '--ink-3' });
      EM.text(ctx, 'cumbre iluminada', xp - 6, cy - r * 0.15 - 10, { size: 11, color: '--gold', align: 'right' });
      /* esquema de la geometría */
      const gx = W * 0.66, gy = H * 0.68, gr = Math.min(W * 0.28, H * 0.55) * 1.0;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx, gy + gr * 0.0, gr, PI * 1.12, PI * 1.88); ctx.stroke();
      EM.text(ctx, 'R', gx - gr * 0.12, gy - gr * 0.5, { size: 12 }); EM.text(ctx, 'd', gx + gr * 0.28, gy - gr - 8, { size: 12, color: '--c1' }); EM.text(ctx, 'h', gx + gr * 0.04, gy - gr - 22, { size: 12, color: '--accent' });
      sim.set('d', EM.fix(d, 0) + ' km');
      sim.set('h', EM.fix(h, 2) + ' km  (' + EM.fix(h / 1.609, 1) + ' millas)');
      sim.set('cmp', h > 4 * 1.609 ? 'más de 4 millas, como dijo Galileo; el Monte Everest mide 8.8 km' : 'montaña pequeña');
    });
  });

  /* 11.5 El barco de Galileo */
  EM.defineSim('barco-galileo', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('v', { label: 'Velocidad del barco', min: 0, max: 12, step: 0.5, value: 6, fmt: (v) => v.toFixed(1) + ' m/s' });
    sim.slider('H', { label: 'Altura del mástil', min: 3, max: 20, step: 0.5, value: 9, fmt: (v) => v.toFixed(1) + ' m' });
    sim.seg('ref', { label: 'Visto desde', options: [['mar', 'La orilla'], ['barco', 'El barco']], value: 'mar' });
    sim.out('t', 'Tiempo de caída', { hl: true });
    sim.out('x', 'Distancia recorrida por la piedra en la orilla');
    sim.out('p', 'Posición respecto del pie del mástil');
    sim.note('Si la Tierra se moviera, argumentaban los aristotélicos, una piedra soltada desde una torre caería lejos de su pie. Galileo (1632) responde con un barco: la piedra soltada desde el mástil cae al pie, ande o no el barco, porque conserva el movimiento horizontal que tenía. Las leyes de la mecánica son las mismas en reposo o con movimiento uniforme: la <em>relatividad galileana</em>.');
    let t = 0, running = true;
    sim.animate((dt) => { t += dt * 0.6; const T = Math.sqrt(2 * sim.p.H / K.g); if (t > T + 0.7) t = 0; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, T = Math.sqrt((2 * p.H) / K.g), tt = Math.min(t, T);
      EM.draw.clear(cv);
      const sc = Math.min((W * 0.7) / (p.v * T + 12), (H * 0.62) / p.H, 22), gy = H * 0.88;
      ctx.fillStyle = EM.alpha('--water', 0.3); ctx.fillRect(0, gy, W, H - gy);
      const off = p.ref === 'mar' ? 40 + p.v * Math.min(t, T + 0.7) * sc : W * 0.4;
      const shipX = p.ref === 'mar' ? 40 + p.v * Math.min(t, T + 0.7) * sc : W * 0.4;
      /* barco y mástil */
      ctx.fillStyle = EM.col('--sand'); ctx.fillRect(shipX - 4 * sc, gy - 1.2 * sc, 8 * sc, 1.2 * sc);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(shipX, gy - 1.2 * sc); ctx.lineTo(shipX, gy - 1.2 * sc - p.H * sc); ctx.stroke();
      /* piedra */
      const y = p.H - 0.5 * K.g * tt * tt, xs = p.ref === 'mar' ? shipX : shipX; /* en el sistema del mar la piedra conserva v: ver traza */
      const stoneX = p.ref === 'mar' ? 40 + p.v * Math.min(tt, T) * sc : shipX;
      /* traza de la trayectoria */
      ctx.strokeStyle = EM.alpha('--c2', 0.7); ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const u = (T * i) / 40; const xx = p.ref === 'mar' ? 40 + p.v * u * sc : shipX, yy = p.H - 0.5 * K.g * u * u; i ? ctx.lineTo(xx, gy - 1.2 * sc - yy * sc) : ctx.moveTo(xx, gy - 1.2 * sc - yy * sc); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(stoneX, gy - 1.2 * sc - y * sc, 5, 0, TAU); ctx.fill();
      EM.text(ctx, p.ref === 'mar' ? 'visto desde la orilla: la piedra describe una parábola' : 'visto desde el barco: la piedra cae en vertical', 10, 18, { size: 11.5, color: '--ink-2' });
      sim.set('t', EM.fix(T, 3) + ' s');
      sim.set('x', EM.fix(p.v * T, 2) + ' m (el barco avanza lo mismo)');
      sim.set('p', '0.00 m: cae al pie del mástil');
    });
  });

  /* 11.6 El péndulo: ¿es isócrono? */
  EM.defineSim('pendulo-galileo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('A', { label: 'Amplitud inicial', min: 1, max: 170, step: 1, value: 40, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('L', { label: 'Longitud del péndulo', min: 0.2, max: 3, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' m' });
    sim.out('T0', 'Periodo de pequeñas oscilaciones 2π√(L/g)', { hl: true });
    sim.out('T', 'Periodo verdadero');
    sim.out('d', 'Diferencia');
    sim.out('c', 'Retraso en 1 hora si se usara T₀');
    sim.note('Galileo (según su discípulo Viviani, observando una lámpara de la catedral de Pisa hacia 1583) afirmó que el periodo no depende de la amplitud. Es cierto para oscilaciones pequeñas; para amplitudes grandes el periodo crece (integral elíptica). Huygens (1673) mostró que el verdadero isócrono es una cicloide (capítulo 13).');
    let ph = 0;
    sim.animate((dt) => { ph += dt; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, A = p.A * DEG;
      EM.draw.clear(cv);
      const T0 = TAU * Math.sqrt(p.L / K.g), r = C.pendulumRatio(p.A), T = T0 * r;
      /* movimiento: se usa la solución exacta por integración numérica sencilla del péndulo */
      const half = W * 0.5, px = half * 0.5, py = 24, len = Math.min(H * 0.7, half * 0.7);
      /* ángulo en el instante ph: integrar con paso pequeño y reiniciar cada vez (barato) */
      let th = A, om = 0; const dt = 1e-3, steps = Math.floor((ph % T) / dt);
      const wp2 = K.g / p.L, n = steps;
      th = A; om = 0; for (let i = 0; i < n; i++) { om += -wp2 * Math.sin(th) * dt; th += om * dt; }
      const bx = px + len * Math.sin(th), by = py + len * Math.cos(th);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.strokeStyle = EM.alpha('--ink-3', 0.6); ctx.beginPath(); ctx.arc(px, py, len, PI / 2 - A, PI / 2 + A); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(bx, by, 9, 0, TAU); ctx.fill();
      const pl = new EM.Plot(ctx, { x: half + 6, y: 6, w: W - half - 12, h: H - 12, xmin: 0, xmax: 170, ymin: 0.98, ymax: 2.6, xlabel: 'amplitud (°)', ylabel: 'T / T₀' });
      pl.frame(); pl.hline(1, { color: '--ink-3', label: 'isocronismo (Galileo)', labelRight: true });
      pl.fn((x) => C.pendulumRatio(x), { color: '--c1', width: 2.2, from: 0.5 }); pl.dot(p.A, r, { color: '--accent', r: 5 });
      sim.set('T0', EM.fix(T0, 4) + ' s');
      sim.set('T', EM.fix(T, 4) + ' s');
      sim.set('d', '+' + EM.fix(100 * (r - 1), 2) + ' %');
      sim.set('c', EM.fix(3600 * (1 - 1 / r) / 60, 2) + ' min');
    });
  });
})();
