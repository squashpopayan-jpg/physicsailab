/* Capítulo 3 — Espacio-tiempo, cuadrivectores y paradojas */
(function () {
  'use strict';
  const EM = window.EM, R = EM.fm.rel, K = EM.qm.K, c = K.c;

  /* Gráfica cuadrada (misma escala en x y en ct) centrada en el lienzo */
  function squarePlot(cv, lim, o) {
    const ml = 46, mr = 12, mt = 14, mb = 40, s = Math.max(60, Math.min(cv.w - ml - mr, cv.h - mt - mb));
    const w = s + ml + mr, h = s + mt + mb;
    return new EM.Plot(cv.ctx, Object.assign({ x: (cv.w - w) / 2, y: (cv.h - h) / 2, w, h, xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, ml, mr, mt, mb }, o));
  }

  /* 3.1 Diagrama de Minkowski: ejes de S′, calibración, cono de luz y simultaneidad */
  EM.defineSim('minkowski', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.slider('b', { label: 'Velocidad de S′ respecto de S: β', min: -0.95, max: 0.95, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('x', { label: 'Suceso E: posición x', min: -5, max: 5, step: 0.1, value: 3, unit: 'al', fmt: (v) => EM.fix(v, 1) });
    sim.slider('ct', { label: 'Suceso E: tiempo ct', min: -5, max: 5, step: 0.1, value: 2, unit: 'años', fmt: (v) => EM.fix(v, 1) });
    sim.check('cone', { label: 'Cono de luz del origen', value: true });
    sim.check('axes', { label: 'Ejes de S′, escalas y paralelas por E', value: true });
    sim.check('hyp', { label: 'Hipérbolas de calibración (intervalo = ±1)', value: false });
    sim.out('p', 'Coordenadas de E en S′: x′ · ct′', { hl: true });
    sim.out('s2', 'Intervalo (ct)² − x² (invariante) · tipo');
    sim.out('ord', 'Orden temporal de E respecto del origen');
    sim.out('tau', 'Tiempo propio desde el origen (tipo tiempo) / distancia propia (tipo espacio)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, b = p.b, g = R.gamma(b), lim = 6, pl = squarePlot(cv, lim, { xlabel: 'x (años luz)', ylabel: 'ct (años)' });
      EM.draw.clear(cv); pl.frame();
      const X = (x) => pl.X(x), Y = (y) => pl.Y(y);
      if (p.cone) {
        ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.1); ctx.beginPath();
        ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(lim), Y(lim)); ctx.lineTo(X(-lim), Y(lim)); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(lim), Y(-lim)); ctx.lineTo(X(-lim), Y(-lim)); ctx.closePath(); ctx.fill(); ctx.restore();
        pl.path([[-lim, -lim], [lim, lim]], { color: '--c3', width: 1.8 }); pl.path([[-lim, lim], [lim, -lim]], { color: '--c3', width: 1.8 });
        pl.label(0, lim * 0.82, 'futuro', { color: '--accent', align: 'center' }); pl.label(0, -lim * 0.82, 'pasado', { color: '--accent', align: 'center' });
        pl.label(lim * 0.8, 0.1 * lim, 'otro lugar', { color: '--ink-3', align: 'center' }); pl.label(-lim * 0.8, 0.1 * lim, 'otro lugar', { color: '--ink-3', align: 'center' });
      }
      if (p.hyp) for (const sg of [1, -1]) {
        const tl = [], ts = [];
        for (let u = -2.4; u <= 2.4; u += 0.05) { tl.push([sg * 0 + Math.sinh(u), sg * Math.cosh(u)]); ts.push([sg * Math.cosh(u), Math.sinh(u)]); }
        pl.path(tl, { color: '--c4', width: 1.3, dash: [4, 3] }); pl.path(ts, { color: '--c5', width: 1.3, dash: [4, 3] });
      }
      const x = p.x, ct = p.ct, xp = g * (x - b * ct), ctp = g * (ct - b * x);
      if (p.axes) {
        pl.path([[-lim * b, -lim], [lim * b, lim]], { color: '--accent', width: 2.4 }); /* eje ct′: x = βct */
        pl.path([[-lim, -lim * b], [lim, lim * b]], { color: '--accent', width: 2.4 }); /* eje x′: ct = βx */
        pl.label(lim * b * 0.97, lim * 0.97, 'ct′', { color: '--accent', dx: 12, dy: 8 }); pl.label(lim * 0.96, lim * b * 0.96, 'x′', { color: '--accent', dx: -10, dy: -8 });
        for (let n = 1; n <= 5; n++) { pl.dot(g * b * n, g * n, { color: '--accent', r: 2.6, noclip: false }); pl.dot(g * n, g * b * n, { color: '--accent', r: 2.6 }); pl.dot(-g * b * n, -g * n, { color: '--accent', r: 2.6 }); pl.dot(-g * n, -g * b * n, { color: '--accent', r: 2.6 }); }
        pl.path([[x - 12 * b, ct - 12], [x + 12 * b, ct + 12]], { color: '--c2', width: 1.3, dash: [5, 3] }); /* x′ constante */
        pl.path([[x - 12, ct - 12 * b], [x + 12, ct + 12 * b]], { color: '--c2', width: 1.3, dash: [5, 3] }); /* ct′ constante */
        pl.path([[-lim, ct], [lim, ct]], { color: '--ink-3', width: 1, dash: [2, 3] }); pl.path([[x, -lim], [x, lim]], { color: '--ink-3', width: 1, dash: [2, 3] });
      }
      pl.dot(0, 0, { color: '--ink', r: 4 }); pl.dot(x, ct, { color: '--c3', r: 6, label: 'E' });
      const s2 = ct * ct - x * x, kind = R.classify(x, ct);
      sim.set('p', `${EM.fix(xp, 3)} al · ${EM.fix(ctp, 3)} años`);
      sim.set('s2', `${EM.fix(s2, 3)} · ${kind === 'tiempo' ? 'tipo tiempo' : kind === 'espacio' ? 'tipo espacio' : 'tipo luz'}`);
      sim.set('ord', kind === 'espacio' ? `puede invertirse: con |β| > ${EM.fix(Math.abs(ct / x), 3)} E ocurre antes que el origen (ct′ ${ctp < 0 ? '< 0' : '> 0'} con el β actual)` : kind === 'luz' ? 'sobre el cono: sin cambio de orden' : `siempre ${ct > 0 ? 'después' : 'antes'} (en todos los sistemas)`);
      sim.set('tau', kind === 'tiempo' ? `τ = ${EM.fix(Math.sqrt(s2), 3)} años (reloj que viaja del origen a E)` : kind === 'espacio' ? `distancia propia = ${EM.fix(Math.sqrt(-s2), 3)} al (medida en el sistema donde son simultáneos)` : '0 (rayo de luz)');
    });
  });

  /* 3.2 Paradoja de los gemelos */
  EM.defineSim('gemelos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('d', { label: 'Distancia de la Tierra al destino (sistema de la Tierra)', min: 1, max: 12, step: 0.1, value: 4, unit: 'al', fmt: (v) => EM.fix(v, 1) });
    sim.slider('b', { label: 'Velocidad del viajero β', min: 0.1, max: 0.99, step: 0.005, value: 0.8, fmt: (v) => EM.fix(v, 3) });
    sim.out('E', 'Tiempo transcurrido en la Tierra: 2d/β', { hl: true });
    sim.out('T', 'Tiempo transcurrido para el viajero: 2d/(βγ)');
    sim.out('dif', 'Diferencia de edad al reunirse');
    sim.out('sal', 'Lectura de la Tierra «simultánea» con el giro: sistema de ida · sistema de vuelta · salto 2βd');
    let u = 0;
    sim.resetButton(() => { u = 0; });
    sim.animate((dt) => { u = (u + dt * 0.1) % 1.1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = R.twins(p.d, p.b), tT = p.d / p.b, tau = T.traveler;
      EM.draw.clear(cv);
      const tmax = T.earth * 1.05, prog = Math.min(1, u), tcur = prog * T.earth;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -p.d * 0.15, xmax: p.d * 1.15, ymin: 0, ymax: tmax, xlabel: 'distancia a la Tierra (años luz)', ylabel: 'tiempo de la Tierra (años)', ml: 52, mr: 8, title: 'Sistema de la Tierra' });
      pl.frame();
      pl.path([[0, 0], [0, T.earth]], { color: '--ink', width: 2.4 });
      pl.path([[0, 0], [p.d, tT], [0, T.earth]], { color: '--accent', width: 2.8 });
      pl.path([[0, T.earthAtTurnOut], [p.d, tT]], { color: '--c2', width: 1.5, dash: [5, 3] });
      pl.path([[0, T.earthAtTurnIn], [p.d, tT]], { color: '--c4', width: 1.5, dash: [5, 3] });
      pl.dot(0, T.earthAtTurnOut, { color: '--c2', r: 3.5, label: EM.fix(T.earthAtTurnOut, 2), dx: 6, dy: 12 }); pl.dot(0, T.earthAtTurnIn, { color: '--c4', r: 3.5, label: EM.fix(T.earthAtTurnIn, 2), dx: 6, dy: -4 });
      pl.dot(p.d, tT, { color: '--c3', r: 4.5, label: 'giro', dx: -6, dy: -8, align: 'right' });
      /* tics de un año del viajero (cada γ años de la Tierra) */
      for (let k = 1; k * 1 < tau; k++) { const te = k * T.gamma, xp = te <= tT ? p.b * te : p.d - p.b * (te - tT); if (te < T.earth) pl.dot(xp, te, { color: '--accent', r: 2.2 }); }
      const xnow = tcur <= tT ? p.b * tcur : p.d - p.b * (tcur - tT);
      pl.dot(xnow, tcur, { color: '--c3', r: 5.5 }); pl.dot(0, tcur, { color: '--ink', r: 5.5 });
      pl.legend([{ label: 'gemelo en la Tierra', color: '--ink' }, { label: 'viajero', color: '--accent' }, { label: 'simultaneidad del viajero (ida)', color: '--c2', dash: [5, 3] }, { label: 'simultaneidad del viajero (vuelta)', color: '--c4', dash: [5, 3] }], 'tr');
      /* Derecha: qué lee el viajero del reloj terrestre en cada momento de su propio tiempo */
      const pr = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 0, xmax: tau, ymin: 0, ymax: T.earth * 1.05, xlabel: 'tiempo propio del viajero (años)', ylabel: 'reloj terrestre «ahora» para el viajero (años)', ml: 56, mr: 8, title: 'El salto en el giro' });
      pr.frame();
      const half = tau / 2;
      pr.path([[0, 0], [half, T.earthAtTurnOut]], { color: '--c2', width: 2.8 }); pr.path([[half, T.earthAtTurnIn], [tau, T.earth]], { color: '--c4', width: 2.8 });
      pr.path([[half, T.earthAtTurnOut], [half, T.earthAtTurnIn]], { color: '--c3', width: 2.8, dash: [3, 3] });
      pr.path([[0, 0], [tau, tau]], { color: '--ink-3', width: 1.2, dash: [2, 4] });
      pr.label(half, (T.earthAtTurnOut + T.earthAtTurnIn) / 2, 'salto ' + EM.fix(T.jump, 2) + ' años', { color: '--c3', dx: 8, align: 'left' });
      const ptau = prog * tau, ref = ptau <= half ? ptau / T.gamma : T.earthAtTurnIn + (ptau - half) / T.gamma;
      pr.dot(ptau, ref, { color: '--accent' });
      sim.set('E', `${EM.fix(T.earth, 3)} años`);
      sim.set('T', `${EM.fix(tau, 3)} años (γ = ${EM.fix(T.gamma, 4)})`);
      sim.set('dif', `${EM.fix(T.earth - tau, 3)} años: el viajero es más joven`);
      sim.set('sal', `${EM.fix(T.earthAtTurnOut, 3)} · ${EM.fix(T.earthAtTurnIn, 3)} · ${EM.fix(T.jump, 3)} años`);
    });
  });

  /* 3.3 Aceleración propia constante: movimiento hiperbólico y viajes interestelares */
  const DEST = { prox: ['Próxima Centauri', 4.2465], sir: ['Sirio', 8.60], veg: ['Vega', 25.04], gc: ['Centro galáctico', 26000], and: ['Galaxia de Andrómeda', 2.537e6] };
  EM.defineSim('hiperbolica', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Aceleración propia a (múltiplos de g = 9.807 m/s²)', min: 0.1, max: 10, step: 0.01, value: 1, log: true, unit: 'g', fmt: (v) => EM.fix(v, 2) });
    sim.select('dest', { label: 'Destino (viaje de reposo a reposo: acelerar la mitad, frenar la otra mitad)', options: Object.entries(DEST).map(([k, v]) => [k, `${v[0]} (${EM.sci(v[1], 4)} al)`]), value: 'prox' });
    sim.out('tau', 'Tiempo propio de la tripulación', { hl: true });
    sim.out('t', 'Tiempo transcurrido en el sistema de la Tierra');
    sim.out('g', 'γ máximo (a mitad del viaje) · 1 − β máximo');
    sim.out('y', 'Tras 1 año propio de aceleración desde el reposo: β · distancia recorrida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = p.a * K.g0, d = DEST[p.dest][1] * K.ly, T = R.hypTrip(a, d);
      EM.draw.clear(cv);
      const N = 160, leg = T.tau / 2, xs = [], ts = [];
      for (let i = 0; i <= N; i++) { const tau = (leg * i) / N, h = R.hyp(a, tau); xs.push(h.x / d); ts.push(h.t / (d / c)); }
      for (let i = N - 1; i >= 0; i--) { xs.push(1 - xs[i]); ts.push(T.t / (d / c) - ts[i]); }
      const tn = T.t / (d / c);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(1.05, tn * 1.03), xlabel: 'distancia recorrida x/d', ylabel: 'tiempo de la Tierra t/(d/c)', ml: 52, mr: 8, title: 'Línea de universo (en unidades d y d/c)' });
      pl.frame();
      pl.path([[0, 0], [1, 1]], { color: '--c3', width: 1.6, dash: [5, 3] });
      pl.xy(xs, ts, { color: '--accent', width: 3 });
      pl.label(0.55, 0.45, 'luz', { color: '--c3' });
      /* Derecha: tiempo propio frente a la distancia para tres aceleraciones */
      const pr = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 1, xmax: 1e7, xlog: true, ymin: 1, ymax: 100, ylog: true, xlabel: 'distancia d (años luz)', ylabel: 'tiempo propio total (años)', ml: 52, mr: 8, title: 'Tiempo propio de la tripulación' });
      pr.frame();
      pr.fn((dl) => R.hypTrip(0.5 * K.g0, dl * K.ly).tau / K.yr, { color: '--c2', width: 2, n: 120 }); pr.fn((dl) => R.hypTrip(K.g0, dl * K.ly).tau / K.yr, { color: '--c1', width: 2, n: 120 }); pr.fn((dl) => R.hypTrip(3 * K.g0, dl * K.ly).tau / K.yr, { color: '--c4', width: 2, n: 120 });
      pr.fn((dl) => R.hypTrip(a, dl * K.ly).tau / K.yr, { color: '--accent', width: 3, n: 120 });
      pr.dot(DEST[p.dest][1], T.tau / K.yr, { color: '--accent', r: 5.5 });
      pr.legend([{ label: 'a elegida', color: '--accent' }, { label: '0.5 g', color: '--c2' }, { label: '1 g', color: '--c1' }, { label: '3 g', color: '--c4' }], 'tl');
      const h1 = R.hyp(a, K.yr);
      sim.set('tau', `${EM.fix(T.tau / K.yr, 3)} años`);
      sim.set('t', `${EM.sci(T.t / K.yr, 5)} años`);
      sim.set('g', `${EM.sci(T.gammaMax, 4)} · ${EM.sci(T.gammaMax > 1e6 ? 1 / (2 * T.gammaMax * T.gammaMax) : 1 - T.betaMax, 3)}`);
      sim.set('y', `${EM.fix(h1.beta, 4)} · ${EM.fix(h1.x / K.ly, 4)} al`);
    });
  });
})();
