/* Capítulo 6 — El cerebro que se reorganiza */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, P = L.plast;
  const COLS = ['--c1', '--c2', '--c3', '--c4', '--c5'];

  /* ======================================================================
     6.1 Mapa autoorganizado de cinco dedos
     ====================================================================== */
  RC.defineSim('som', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Piel de cinco dedos y su mapa en una franja de corteza, antes y después' });
    sim.group('Experiencia');
    sim.slider('uso', { label: 'Estimulación del dedo 2 (veces lo normal)', min: 1, max: 6, step: 0.5, value: 1, fmt: (v) => '×' + RC.nf(v, 1) });
    sim.check('amp', { label: 'Amputar el dedo 3', value: false });
    sim.out('cnt0', 'Unidades por dedo antes', { wide: true });
    sim.out('cnt1', 'Unidades por dedo después', { wide: true });
    const M = 60;
    const base = P.somTrain({ m: M, freq: [1, 1, 1, 1, 1], steps: 30000, seed: 5 });
    const cache = {};
    sim.onDraw(() => {
      const key = sim.p.uso + '|' + sim.p.amp;
      if (!cache[key]) {
        const freq = [1, sim.p.uso, sim.p.amp ? 0 : 1, 1, 1];
        cache[key] = sim.p.uso === 1 && !sim.p.amp ? base : P.somTrain({ m: M, freq, steps: 25000, seed: 9, c0: base, sigma0: 2.5, sigma1: 0.8, eta0: 0.06, eta1: 0.01 });
      }
      const after = cache[key];
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      RC.draw.clear(cv);
      const x0 = 30, x1 = w - 30, row = (y, lab) => RC.text(ctx, lab, x0, y - 8, { size: 12, weight: 650, color: '--ink-2' });
      /* piel */
      row(30, 'piel de la mano (cinco dedos)');
      for (let d = 0; d < 5; d++) {
        const a = x0 + ((x1 - x0) * d) / 5, b = x0 + ((x1 - x0) * (d + 1)) / 5;
        const muerto = sim.p.amp && d === 2;
        ctx.fillStyle = muerto ? RC.col('--surface-3') : RC.alpha(COLS[d], 0.75);
        ctx.fillRect(a + 2, 36, b - a - 4, 26);
        RC.text(ctx, muerto ? 'amputado' : `dedo ${d + 1}${d === 1 && sim.p.uso > 1 ? ' (más uso)' : ''}`, (a + b) / 2, 54, { size: 11.5, align: 'center', color: muerto ? '--ink-3' : '#fff', weight: 650 });
      }
      const franja = (c, y, lab) => {
        row(y, lab);
        const cw = (x1 - x0) / M;
        for (let k = 0; k < M; k++) {
          const d = Math.min(4, Math.max(0, Math.floor(c[k] * 5)));
          ctx.fillStyle = RC.col(COLS[d]);
          ctx.fillRect(x0 + k * cw + 0.5, y, cw - 1, 26);
        }
      };
      franja(base, 108, 'corteza antes (60 unidades, color = dedo al que responde)');
      franja(after, 172, 'corteza después');
      const c0 = P.somShare(base, 5), c1 = P.somShare(after, 5);
      const ff = (c) => c.map((n, i) => `<b style="color:var(${COLS[i]})">${i + 1}</b>: ${n}`).join(' · ');
      sim.set('cnt0', ff(c0));
      sim.set('cnt1', ff(c1));
    });
  });

  /* ======================================================================
     6.2 Potencia de un estudio de resonancia
     ====================================================================== */
  RC.defineSim('mri', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Cambio de volumen estimado por cien estudios simulados' });
    sim.group('Realidad');
    sim.slider('d', { label: 'Cambio real promedio del volumen', min: 0, max: 0.05, step: 0.0025, value: 0.02, fmt: (v) => RC.pct(v, 1) });
    sim.slider('sb', { label: 'Variación del cambio entre personas (DE)', min: 0, max: 0.05, step: 0.0025, value: 0.02, fmt: (v) => RC.pct(v, 1) });
    sim.slider('me', { label: 'Error de cada medición (DE)', min: 0.005, max: 0.04, step: 0.0025, value: 0.015, fmt: (v) => RC.pct(v, 1) });
    sim.group('Estudio');
    sim.slider('n', { label: 'Participantes', min: 6, max: 120, step: 2, value: 12, fmt: (v) => RC.nf(v) });
    sim.slider('reg', { label: 'Regiones analizadas (sin corrección)', min: 1, max: 20, step: 1, value: 1, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Otros 100 estudios', () => { seed++; }, { id: 'otros' });
    sim.out('pw', 'Estudios que encuentran un cambio (p < 0,05)', { hl: true });
    sim.out('ex', 'Cambio promedio reportado por esos estudios');
    sim.onDraw(() => {
      const rng = L.rng(seed * 19), n = sim.p.n, K = 100;
      const res = [];
      for (let k = 0; k < K; k++) {
        let mejorP = 1, mejorD = 0;
        for (let r = 0; r < sim.p.reg; r++) {
          const real = r === 0 ? sim.p.d : 0;     /* solo una región cambia de verdad */
          const dif = [];
          for (let i = 0; i < n; i++) dif.push(real + sim.p.sb * rng.gauss() + Math.SQRT2 * sim.p.me * rng.gauss());
          const m = L.stat.mean(dif), s = L.stat.sd(dif), t = m / (s / Math.sqrt(n));
          const p = 2 * (1 - L.ev.tCDF(Math.abs(t), n - 1));
          if (p < mejorP) { mejorP = p; mejorD = m; }
        }
        res.push({ d: mejorD, sig: mejorP < 0.05 && mejorD > 0 });
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.06, xmax: 0.1, ymin: 0, ymax: 1, yticks: [], xlabel: 'cambio de volumen estimado (antes → después)', xfmt: RC.pctAxis, ml: 16 });
      pl.frame();
      const rj = L.rng(seed);
      res.forEach((o) => {
        const px = pl.X(Math.max(-0.06, Math.min(0.1, o.d))), py = pl.Y(0.08 + 0.84 * rj());
        cv.ctx.beginPath(); cv.ctx.arc(px, py, 3.8, 0, 7);
        if (o.sig) { cv.ctx.fillStyle = RC.col('--c2'); cv.ctx.fill(); } else { cv.ctx.strokeStyle = RC.col('--c6'); cv.ctx.lineWidth = 1.2; cv.ctx.stroke(); }
      });
      pl.vline(sim.p.d, { color: '--gain', dash: [], width: 2, label: 'cambio real', labelY: 14 });
      pl.vline(0, { color: '--ink-3' });
      const sig = res.filter((o) => o.sig);
      sim.set('pw', `${sig.length} de ${K}`);
      sim.set('ex', sig.length ? RC.pct(L.stat.mean(sig.map((o) => o.d)), 1) : '—');
    });
  });

  RC.defineSim('quiz-mapas', function (sim) {
    RC.quiz(sim, [
      { q: 'Al amputar un dedo a un mono adulto, la zona cortical que lo representaba…', opts: ['Queda inactiva para siempre', 'Pasa a responder a los dedos vecinos', 'Se convierte en zona visual'], ok: 1, fb: 'Merzenich y otros (1984): los vecinos invaden el territorio.' },
      { q: '¿Qué es un periodo crítico?', opts: ['Una crisis nerviosa', 'Una ventana del desarrollo en que la experiencia moldea los circuitos con mucha fuerza', 'El periodo refractario de la neurona'], ok: 1, fb: 'Hubel y Wiesel lo mostraron tapando un ojo a gatitos.' },
      { q: 'Un aumento de «sustancia gris» medido con resonancia significa necesariamente…', opts: ['Que nacieron neuronas nuevas', 'Nada tan específico: puede reflejar glía, vasos, agua o espinas dendríticas', 'Que la persona es más inteligente'], ok: 1, fb: 'La resonancia mide volumen o señal, no tipos de células.' },
      { q: '¿Cuál es el estado de la neurogénesis adulta en el hipocampo humano?', opts: ['Demostrada sin dudas y abundante', 'En debate: estudios de 2018 llegaron a conclusiones opuestas', 'Refutada'], ok: 1, fb: 'Sorrells (2018) frente a Boldrini (2018) y Moreno-Jiménez (2019).' },
      { q: '¿Cuál de estos es un ejemplo de plasticidad perjudicial?', opts: ['Aprender un idioma', 'La distonía focal del músico', 'Mejorar el revés en squash'], ok: 1, fb: 'La práctica excesiva y repetitiva puede fusionar representaciones de dedos vecinos.' }
    ], { id: 'mapas', shuffle: true });
  });
})();
