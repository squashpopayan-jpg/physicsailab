/* Capítulo 5 — Memoria */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, P = L.plast;

  const LETRAS = {
    A: ['....##....', '...####...', '..##..##..', '.##....##.', '.##....##.', '.########.', '.########.', '.##....##.', '.##....##.', '.##....##.'],
    C: ['..######..', '.########.', '###....##.', '##........', '##........', '##........', '##........', '###....##.', '.########.', '..######..'],
    H: ['.##....##.', '.##....##.', '.##....##.', '.##....##.', '.########.', '.########.', '.##....##.', '.##....##.', '.##....##.', '.##....##.'],
    L: ['.##.......', '.##.......', '.##.......', '.##.......', '.##.......', '.##.......', '.##.......', '.##.......', '.########.', '.########.'],
    T: ['##########', '##########', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....'],
    X: ['##......##', '.##....##.', '..##..##..', '...####...', '....##....', '....##....', '...####...', '..##..##..', '.##....##.', '##......##']
  };
  const ORDEN = ['T', 'X', 'L', 'A', 'C', 'H'];
  const vec = (k) => Int8Array.from(LETRAS[k].join('').split('').map((c) => (c === '#' ? 1 : -1)));

  /* ======================================================================
     5.1 Hopfield con letras
     ====================================================================== */
  RC.defineSim('hopfield', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1.25, label: 'Letras guardadas en la red' });
    const cr = sim.canvas({ aspect: 1.25, label: 'Estado de la red durante el recuerdo' });
    sim.group('Memoria');
    sim.slider('np', { label: 'Letras guardadas', min: 1, max: 6, step: 1, value: 3, fmt: (v) => RC.nf(v) });
    sim.select('q', { label: 'Letra a recordar', options: ORDEN.map((k) => [k, k]), value: 'X' });
    sim.slider('ruido', { label: 'Píxeles cambiados en la pista', min: 0, max: 0.45, step: 0.01, value: 0.25, fmt: (v) => RC.pct(v, 0) });
    let seed = 1, net, s, target, paso = 0, acc = 0, key = '', hecho = false;
    sim.button('Otra pista', () => { seed++; key = ''; }, { id: 'pista' });
    const preparar = () => {
      const k = ORDEN.slice(0, sim.p.np);
      net = new P.Hopfield(100, L.rng(seed * 7));
      k.forEach((c) => net.store(vec(c)));
      target = vec(sim.p.q);
      s = P.corrupt(target, sim.p.ruido, L.rng(seed * 13 + 1));
      paso = 0; hecho = false;
    };
    sim.animate((dt) => {
      acc += dt;
      if (!hecho && acc > 0.05) {
        acc = 0;
        /* actualiza 5 neuronas al azar por cuadro para ver el proceso */
        let ch = 0;
        for (let r = 0; r < 5; r++) {
          const i = Math.floor(net.rng() * 100), h = net.field(s, i), ns = h >= 0 ? 1 : -1;
          if (ns !== s[i]) { s[i] = ns; ch++; }
          paso++;
        }
        if (paso > 600) hecho = true;
      }
    });
    sim.out('ov', 'Parecido con la letra buscada', { hl: true });
    sim.out('mej', 'Letra guardada más parecida');
    sim.out('E', 'Energía de la red');
    const dibuja = (cv, x0, y0, size, p, col) => {
      const c = size / 10, ctx = cv.ctx;
      for (let r = 0; r < 10; r++) for (let q = 0; q < 10; q++) {
        ctx.fillStyle = p[r * 10 + q] > 0 ? RC.col(col) : RC.col('--surface-2');
        ctx.fillRect(x0 + q * c + 0.5, y0 + r * c + 0.5, c - 1, c - 1);
      }
    };
    sim.onDraw(() => {
      const kk = `${sim.p.np}|${sim.p.q}|${sim.p.ruido}|${seed}`;
      if (kk !== key) { key = kk; preparar(); }
      RC.draw.clear(cs);
      const k = ORDEN.slice(0, sim.p.np), cols = 3, sz = Math.min((cs.w - 30) / cols, (cs.h - 50) / 2) - 10;
      RC.text(cs.ctx, 'guardadas', 10, 18, { size: 12.5, weight: 650, color: '--ink-2' });
      k.forEach((c, i) => dibuja(cs, 14 + (i % cols) * (sz + 12), 30 + Math.floor(i / cols) * (sz + 12), sz, vec(c), c === sim.p.q ? '--c1' : '--c6'));
      RC.draw.clear(cr);
      const S = Math.min(cr.w, cr.h) - 50;
      RC.text(cr.ctx, hecho ? 'estado final' : `recordando… ${paso} actualizaciones`, 10, 18, { size: 12.5, weight: 650, color: '--ink-2' });
      dibuja(cr, (cr.w - S) / 2, 30, S, s, '--c2');
      const ov = P.overlap(s, target);
      let mejor = '', mo = -2;
      ORDEN.forEach((c) => { const o = Math.abs(P.overlap(s, vec(c))); if (o > mo) { mo = o; mejor = c; } });
      sim.set('ov', RC.pct((ov + 1) / 2, 0) + (ov > 0.96 ? ' <span class="gain">recuperada</span>' : ''));
      sim.set('mej', `${mejor} (${RC.pct((mo + 1) / 2, 0)})` + (k.includes(mejor) ? '' : ' — no estaba guardada'));
      sim.set('E', RC.nf(net.energy(s), 1));
    });
  });

  /* ======================================================================
     5.2 Capacidad
     ====================================================================== */
  RC.defineSim('capacidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Fracción de bits inestables según la carga de la red' });
    sim.group('Red');
    sim.seg('N', { label: 'Neuronas', options: [[100, '100'], [200, '200'], [400, '400']], value: 200 });
    sim.out('cap', 'Capacidad 0,138 N', { hl: true });
    const cache = {};
    sim.onDraw(() => {
      const N = sim.p.N;
      if (!cache[N]) {
        const fr = [0.03, 0.06, 0.09, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4];
        cache[N] = fr.map((f) => { const nP = Math.max(1, Math.round(f * N)); return [nP / N, P.hopErrMC(N, nP, N > 300 ? 1 : 2, 5)]; });
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.42, ymin: 0, ymax: 0.07, xlabel: 'carga P / N (recuerdos por neurona)', ylabel: 'bits inestables', yfmt: RC.pctAxis });
      pl.frame();
      pl.band(0.138, 0.42, { color: '--c2', alpha: 0.07 });
      pl.vline(0.138, { color: '--c2', label: '0,138', labelY: 14 });
      pl.fn((a) => (a > 0 ? P.hopErr(N, a * N) : 0), { color: '--c1', width: 2.4, from: 0.005 });
      cache[N].forEach(([a, e]) => pl.dot(a, e, { color: '--c2', r: 5 }));
      pl.legend([{ label: 'teoría ½[1 − erf(√(N/2P))]', color: '--c1' }, { label: 'red simulada', color: '--c2', kind: 'dot' }], 'tl');
      sim.set('cap', `${Math.round(0.138 * N)} recuerdos`);
    });
  });

  /* ======================================================================
     5.3 Curva del olvido de Ebbinghaus
     ====================================================================== */
  const EBB = [[20 / 1440, 58.2], [1 / 24, 44.2], [8.8 / 24, 35.8], [1, 33.7], [2, 27.8], [6, 25.4], [31, 21.1]];
  RC.defineSim('olvido', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Ahorro al reaprender según el tiempo transcurrido: datos de Ebbinghaus y ajustes' });
    sim.group('Escala');
    sim.seg('esc', { options: [['lin', 'tiempo lineal'], ['log', 'tiempo logarítmico']], value: 'lin' });
    sim.out('pow', 'Potencial: R² y fórmula', { wide: true });
    sim.out('exp', 'Exponencial: R² y fórmula', { wide: true });
    let fits = null;
    sim.onDraw(() => {
      if (!fits) {
        const ts = EBB.map((d) => d[0]), ys = EBB.map((d) => d[1]);
        const pw = L.levmar(ts, ys, (t, p) => p[0] * Math.pow(t, -p[1]), (t, p) => [Math.pow(t, -p[1]), -p[0] * Math.pow(t, -p[1]) * Math.log(t)], [30, 0.1]);
        const ex = L.levmar(ts, ys, (t, p) => p[0] + p[1] * Math.exp(-t / p[2]), (t, p) => [1, Math.exp(-t / p[2]), (p[1] * t * Math.exp(-t / p[2])) / (p[2] * p[2])], [25, 30, 1]);
        const m = L.stat.mean(ys), sst = ys.reduce((s, y) => s + (y - m) ** 2, 0);
        fits = { pw: pw.p, ex: ex.p, r2p: 1 - pw.sse / sst, r2e: 1 - ex.sse / sst };
      }
      const log = sim.p.esc === 'log';
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: log ? 0.01 : 0, xmax: 32, xlog: log, ymin: 0, ymax: 70, xlabel: 'días desde el aprendizaje', ylabel: 'ahorro al reaprender (%)' });
      pl.frame();
      pl.fn((t) => fits.pw[0] * Math.pow(t, -fits.pw[1]), { color: '--c1', width: 2.4, from: 0.01 });
      pl.fn((t) => fits.ex[0] + fits.ex[1] * Math.exp(-t / fits.ex[2]), { color: '--c2', width: 2, dash: [6, 4], from: 0.005 });
      EBB.forEach(([t, y]) => pl.dot(t, y, { color: '--ink', r: 5 }));
      pl.legend([{ label: 'datos de Ebbinghaus (1885)', color: '--ink', kind: 'dot' }, { label: 'ley potencial', color: '--c1' }, { label: 'exponencial con asíntota', color: '--c2', dash: [6, 4] }], 'tr');
      sim.set('pow', `R² = ${RC.nf(fits.r2p, 3)} · ahorro ≈ ${RC.nf(fits.pw[0], 1)} · t^(−${RC.nf(fits.pw[1], 3)})`);
      sim.set('exp', `R² = ${RC.nf(fits.r2e, 3)} · ahorro ≈ ${RC.nf(fits.ex[0], 1)} + ${RC.nf(fits.ex[1], 1)} e^(−t/${RC.nf(fits.ex[2], 2)})`);
    });
  });

  /* ======================================================================
     5.4 Espaciado (modelo de Pavlik y Anderson, parámetros ilustrativos)
     ====================================================================== */
  RC.defineSim('espaciado', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Probabilidad de recordar a lo largo de un mes según el calendario de repasos' });
    sim.group('Repasos');
    sim.slider('n', { label: 'Número de repasos', min: 2, max: 8, step: 1, value: 4, fmt: (v) => RC.nf(v) });
    sim.slider('gap', { label: 'Intervalo entre repasos espaciados (días)', min: 0.25, max: 10, step: 0.25, value: 1, fmt: (v) => RC.nf(v, 2) });
    sim.slider('test', { label: 'Día de la prueba (contado desde el último repaso)', min: 1, max: 60, step: 1, value: 7, fmt: (v) => RC.nf(v) });
    sim.out('m', 'Masivo (cada 10 min)');
    sim.out('e', 'Espaciado', { hl: true });
    sim.out('opt', 'Mejor intervalo para esa prueba');
    sim.onDraw(() => {
      const D = 1440, n = sim.p.n, gap = sim.p.gap * D;
      const mas = Array.from({ length: n }, (_, k) => k * 10), esp = Array.from({ length: n }, (_, k) => k * gap);
      const fin = (a) => a[a.length - 1];
      RC.draw.clear(cv);
      const T = Math.max(35, sim.p.gap * (n - 1) + sim.p.test + 3);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: 0, ymax: 1, xlabel: 'días desde el primer repaso', ylabel: 'probabilidad de recordar', yfmt: RC.pctAxis });
      pl.frame();
      const curva = (rep, col) => {
        const xs = [], ys = [];
        for (let d = 0.002; d <= T; d += T / 500) { const t = d * D; if (t > rep[0]) { xs.push(d); ys.push(L.learn.paRecall(rep.filter((r) => r < t), t)); } }
        pl.xy(xs, ys, { color: col, width: 2.3 });
        rep.forEach((r) => pl.vline(r / D, { color: col, alpha: 0.35, dash: [2, 3] }));
      };
      curva(mas, '--c2');
      curva(esp, '--c1');
      const tm = fin(mas) + sim.p.test * D, te = fin(esp) + sim.p.test * D;
      pl.dot(tm / D, L.learn.paRecall(mas, tm), { color: '--c2', r: 6 });
      pl.dot(te / D, L.learn.paRecall(esp, te), { color: '--c1', r: 6 });
      pl.legend([{ label: 'repasos seguidos', color: '--c2' }, { label: 'repasos espaciados', color: '--c1' }], 'tr');
      let best = 0, bg = 0;
      for (let g = 0.1; g <= 20; g += 0.1) { const r = Array.from({ length: n }, (_, k) => k * g * D); const p = L.learn.paRecall(r, fin(r) + sim.p.test * D); if (p > best) { best = p; bg = g; } }
      sim.set('m', RC.pct(L.learn.paRecall(mas, tm), 0));
      sim.set('e', RC.pct(L.learn.paRecall(esp, te), 0));
      sim.set('opt', `cada ${RC.nf(bg, 1)} días (${RC.pct(best, 0)})`);
    });
  });

  RC.defineSim('quiz-memoria', function (sim) {
    RC.quiz(sim, [
      { q: 'H. M. no podía formar recuerdos de hechos nuevos, pero mejoraba en el dibujo en espejo. Esto muestra que…', opts: ['La memoria procedimental no depende del hipocampo', 'Fingía', 'El hipocampo guarda las habilidades'], ok: 0, fb: 'Memoria declarativa y procedimental son sistemas separables.' },
      { q: 'En una red de Hopfield, recordar a partir de una pista significa…', opts: ['Buscar en una lista', 'Que la dinámica de la red cae al atractor más cercano y completa el patrón', 'Crear una sinapsis nueva'], ok: 1, fb: 'Cada recuerdo es un mínimo de energía; la red completa el patrón.' },
      { q: '¿Qué técnica de estudio tiene mejor respaldo?', opts: ['Subrayar y releer', 'Espaciar el estudio y practicar la evocación', 'Escuchar grabaciones mientras se duerme'], ok: 1, fb: 'Dunlosky y otros (2013) solo calificaron de alta utilidad la práctica distribuida y la de evocación.' },
      { q: 'Si quiere recordar algo dentro de un mes, sus repasos deberían estar separados por…', opts: ['Minutos', 'Días', 'Da igual'], ok: 1, fb: 'El intervalo óptimo crece con el tiempo que se quiere retener (Cepeda y otros, 2006).' },
      { q: 'Un recuerdo vívido «recuperado» en una sesión de regresión guiada…', opts: ['Prueba que el hecho ocurrió', 'Puede ser falso: la sugestión crea recuerdos vívidos', 'Siempre es falso'], ok: 1, fb: 'Los estudios de implantación muestran que cerca de 30 % de las personas pueden formar un recuerdo falso con sugestión insistente.' }
    ], { id: 'memoria', shuffle: true });
  });
})();
