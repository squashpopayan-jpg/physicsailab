/* Capítulo 2 — La neurona y el impulso nervioso */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, N = L.neuro;

  /* ======================================================================
     2.1 Potenciales de equilibrio y de reposo
     ====================================================================== */
  RC.defineSim('reposo', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, label: 'Potenciales de equilibrio del potasio, el sodio y el cloro y potencial de reposo' });
    sim.group('Concentraciones (mM)');
    sim.slider('Ke', { label: 'Potasio fuera', min: 2, max: 20, step: 0.5, value: 5, fmt: (v) => RC.nf(v, 1) });
    sim.slider('Ki', { label: 'Potasio dentro', min: 80, max: 160, step: 5, value: 140, fmt: (v) => RC.nf(v) });
    sim.slider('Nai', { label: 'Sodio dentro', min: 5, max: 40, step: 1, value: 12, fmt: (v) => RC.nf(v) });
    sim.group('Permeabilidades relativas al potasio');
    sim.slider('pNa', { label: 'p(Na) / p(K)', min: 0.005, max: 20, step: 0.005, value: 0.05, log: true, fmt: (v) => RC.nf(v, v < 0.1 ? 3 : v < 10 ? 2 : 1) });
    sim.slider('pCl', { label: 'p(Cl) / p(K)', min: 0, max: 1, step: 0.05, value: 0.45, fmt: (v) => RC.nf(v, 2) });
    sim.slider('T', { label: 'Temperatura (°C)', min: 6, max: 40, step: 0.5, value: 37, fmt: (v) => RC.nf(v, 1) });
    sim.out('EK', 'E del potasio');
    sim.out('ENa', 'E del sodio');
    sim.out('ECl', 'E del cloro');
    sim.out('V', 'Potencial de reposo (GHK)', { hl: true });
    sim.onDraw(() => {
      const c = { Ki: sim.p.Ki, Ke: sim.p.Ke, Nai: sim.p.Nai, Nae: 145, Cli: 7, Cle: 110 };
      const EK = N.nernst(1, c.Ke, c.Ki, sim.p.T), ENa = N.nernst(1, c.Nae, c.Nai, sim.p.T), ECl = N.nernst(-1, c.Cle, c.Cli, sim.p.T);
      const V = N.ghk(Object.assign({ pK: 1, pNa: sim.p.pNa, pCl: sim.p.pCl }, c), sim.p.T);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -120, xmax: 90, ymin: 0, ymax: 1, yticks: [], xlabel: 'voltaje de la membrana (mV, dentro respecto de fuera)', ml: 16, mt: 20 });
      pl.frame();
      const mark = (x, col, txt, y) => { pl.vline(x, { color: col, dash: [], width: 2.5 }); pl.label(x, y, txt, { color: col, align: x > 40 ? 'right' : 'left', dx: x > 40 ? -6 : 6, size: 12.5, weight: 650 }); };
      pl.band(Math.min(EK, ENa), Math.max(EK, ENa), { color: '--c1', alpha: 0.06 });
      mark(EK, '--c4', `E(K⁺) = ${RC.nf(EK, 1)} mV`, 0.85);
      mark(ENa, '--c2', `E(Na⁺) = ${RC.nf(ENa, 1)} mV`, 0.85);
      mark(ECl, '--c3', `E(Cl⁻) = ${RC.nf(ECl, 1)}`, 0.6);
      mark(V, '--c1', `reposo ${RC.nf(V, 1)} mV`, 0.35);
      sim.set('EK', `${RC.nf(EK, 1)} mV`); sim.set('ENa', `${RC.nf(ENa, 1)} mV`); sim.set('ECl', `${RC.nf(ECl, 1)} mV`); sim.set('V', `${RC.nf(V, 1)} mV`);
    });
  });

  /* ======================================================================
     2.2 Hodgkin-Huxley completo
     ====================================================================== */
  RC.defineSim('hh', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, label: 'Voltaje de la membrana en el tiempo' });
    const cg = sim.canvas({ aspect: 3.2, label: 'Compuertas o corrientes iónicas en el tiempo' });
    sim.group('Estímulo');
    sim.slider('A', { label: 'Amplitud del pulso (µA/cm²)', min: 0, max: 40, step: 0.5, value: 10, fmt: (v) => RC.nf(v, 1) });
    sim.slider('D', { label: 'Duración (ms)', min: 0.2, max: 5, step: 0.1, value: 1, fmt: (v) => RC.nf(v, 1) });
    sim.check('dos', { label: 'Segundo pulso igual', value: false });
    sim.slider('gap', { label: 'Separación entre pulsos (ms)', min: 2, max: 30, step: 0.5, value: 15, fmt: (v) => RC.nf(v, 1) });
    sim.group('Farmacología y temperatura');
    sim.slider('ttx', { label: 'Canales de Na⁺ bloqueados', min: 0, max: 1, step: 0.05, value: 0, fmt: (v) => RC.pct(v, 0) });
    sim.slider('tea', { label: 'Canales de K⁺ bloqueados', min: 0, max: 0.95, step: 0.05, value: 0, fmt: (v) => RC.pct(v, 0) });
    sim.slider('T', { label: 'Temperatura (°C)', min: 6.3, max: 20, step: 0.1, value: 6.3, fmt: (v) => RC.nf(v, 1) });
    sim.group('Panel inferior');
    sim.seg('vista', { options: [['g', 'Compuertas'], ['i', 'Corrientes']], value: 'g' });
    sim.out('n', 'Espigas', { hl: true });
    sim.out('pk', 'Voltaje máximo');
    sim.out('w', 'Ancho de la espiga (a 0 mV)');
    sim.onDraw(() => {
      const t1 = 5, A = sim.p.A, D = sim.p.D, g2 = sim.p.dos ? sim.p.gap : null, T = 50;
      const I = (t) => ((t >= t1 && t < t1 + D) || (g2 !== null && t >= t1 + g2 && t < t1 + g2 + D) ? A : 0);
      const s = N.hhSim({ T, dt: 0.01, I, every: 4, gNa: 120 * (1 - sim.p.ttx), gK: 36 * (1 - sim.p.tea), phi: N.phi(sim.p.T) });
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: -90, ymax: 55, ylabel: 'voltaje (mV)', mb: 26 });
      pl.frame();
      pl.band(t1, t1 + D, { color: '--c2', alpha: 0.12 });
      if (g2 !== null) pl.band(t1 + g2, t1 + g2 + D, { color: '--c2', alpha: 0.12 });
      pl.hline(0, { color: '--ink-3' });
      pl.xy(s.t, s.V, { color: '--c1', width: 2.4 });
      RC.draw.clear(cg);
      const pg = new RC.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: T, ymin: sim.p.vista === 'g' ? 0 : -900, ymax: sim.p.vista === 'g' ? 1 : 900, xlabel: 'tiempo (ms)', ylabel: sim.p.vista === 'g' ? 'fracción abierta' : 'µA/cm²', mt: 8 });
      pg.frame();
      if (sim.p.vista === 'g') {
        pg.xy(s.t, s.m, { color: '--c2', width: 2 });
        pg.xy(s.t, s.h, { color: '--c4', width: 2 });
        pg.xy(s.t, s.n, { color: '--c3', width: 2 });
        pg.legend([{ label: 'm (activa Na⁺)', color: '--c2' }, { label: 'h (inactiva Na⁺)', color: '--c4' }, { label: 'n (activa K⁺)', color: '--c3' }], 'tr');
      } else {
        const P = N.HH, gNa = 120 * (1 - sim.p.ttx), gK = 36 * (1 - sim.p.tea);
        const INa = s.V.map((V, i) => -gNa * s.m[i] ** 3 * s.h[i] * (V - P.ENa));
        const IK = s.V.map((V, i) => -gK * s.n[i] ** 4 * (V - P.EK));
        pg.xy(s.t, INa, { color: '--c2', width: 2 });
        pg.xy(s.t, IK, { color: '--c3', width: 2 });
        pg.legend([{ label: 'entra Na⁺ (positiva = despolariza)', color: '--c2' }, { label: 'sale K⁺ (negativa = repolariza)', color: '--c3' }], 'tr');
      }
      const vmax = Math.max(...s.V);
      let ancho = NaN;
      if (s.spikes.length) {
        const i0 = s.V.findIndex((v) => v >= 0);
        let i1 = i0; while (i1 < s.V.length && s.V[i1] >= 0) i1++;
        ancho = s.t[i1] - s.t[i0];
      }
      sim.set('n', String(s.spikes.length));
      sim.set('pk', `${RC.nf(vmax, 1)} mV`);
      sim.set('w', isFinite(ancho) ? `${RC.nf(ancho, 2)} ms` : '—');
    });
  });

  /* ======================================================================
     2.3 Curva f–I
     ====================================================================== */
  RC.defineSim('fi', function (sim) {
    sim.cols2();
    const ch = sim.canvas({ aspect: 1.15, label: 'Frecuencia de disparo del modelo de Hodgkin y Huxley según la corriente' });
    const cl = sim.canvas({ aspect: 1.15, label: 'Frecuencia de disparo del modelo de integrar y disparar según la corriente' });
    sim.group('Integrar y disparar');
    sim.slider('tau', { label: 'Constante de tiempo τm (ms)', min: 5, max: 40, step: 1, value: 10, fmt: (v) => RC.nf(v) });
    sim.slider('th', { label: 'Umbral (mV)', min: -58, max: -40, step: 0.5, value: -50, fmt: (v) => RC.nf(v, 1) });
    sim.slider('tr', { label: 'Periodo refractario (ms)', min: 0.5, max: 10, step: 0.5, value: 2, fmt: (v) => RC.nf(v, 1) });
    sim.out('hhon', 'Umbral del disparo repetitivo (HH)');
    sim.out('lifon', 'Corriente mínima (LIF)');
    sim.out('lifmax', 'Frecuencia máxima (LIF)');
    let hhData = null;
    sim.onDraw(() => {
      if (!hhData) {
        const Is = [0, 2, 4, 5, 5.5, 6, 6.2, 6.3, 6.5, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 60];
        hhData = Is.map((I) => [I, N.hhRate(I, { T: 400, tA: 100, dt: 0.02 })]);
      }
      RC.draw.clear(ch);
      const ph = new RC.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: 60, ymin: 0, ymax: 140, xlabel: 'corriente (µA/cm²)', ylabel: 'espigas por segundo', title: 'Hodgkin-Huxley (tipo II)' });
      ph.frame();
      ph.path(hhData, { color: '--c1', width: 2.4 });
      hhData.forEach(([I, f]) => ph.dot(I, f, { color: '--c1', r: 3 }));
      const p = { tau: sim.p.tau, EL: -65, Vth: sim.p.th, Vr: -65, R: 10, tref: sim.p.tr };
      RC.draw.clear(cl);
      const fmax = 1000 / p.tref;
      const pl = new RC.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 6, ymin: 0, ymax: Math.min(Math.max(150, fmax * 0.55), 520), xlabel: 'corriente (nA)', ylabel: 'espigas por segundo', title: 'integrar y disparar (tipo I)' });
      pl.frame();
      pl.fn((I) => N.lifRate(I, p), { color: '--c2', width: 2.4, n: 400 });
      const Imin = (p.Vth - p.EL) / p.R;
      pl.vline(Imin, { color: '--c2', label: 'umbral', labelY: 14 });
      sim.set('hhon', '≈ 6,26 µA/cm² (salta a ~50 Hz)');
      sim.set('lifon', `${RC.nf(Imin, 2)} nA`);
      sim.set('lifmax', `${RC.nf(fmax, 0)} Hz (= 1/t_ref)`);
    });
  });

  /* ======================================================================
     Autoevaluación
     ====================================================================== */
  RC.defineSim('quiz-neurona', function (sim) {
    RC.quiz(sim, [
      { q: '¿Por qué el potencial de reposo es negativo y cercano a −65 mV?', opts: ['Porque dentro de la célula hay más sodio', 'Porque la membrana en reposo es mucho más permeable al potasio, que tiende a salir', 'Porque la bomba de sodio genera ese voltaje directamente'], ok: 1, fb: 'La ecuación de Goldman pondera cada equilibrio por su permeabilidad; el potasio domina y su equilibrio está cerca de −89 mV.' },
      { q: '¿Qué produce la subida explosiva del potencial de acción?', opts: ['La salida de potasio', 'La retroalimentación positiva: la despolarización abre canales de sodio que despolarizan más', 'La entrada de cloro'], ok: 1, fb: 'Las compuertas m del sodio se abren con la despolarización, entra sodio y despolariza aún más.' },
      { q: '¿Cómo codifica una neurona un estímulo más intenso?', opts: ['Con espigas más altas', 'Con más espigas por segundo', 'Con espigas más largas'], ok: 1, fb: 'La espiga es de todo o nada; la intensidad se codifica en la frecuencia.' },
      { q: 'La tetrodotoxina bloquea los canales de sodio. ¿Qué efecto tiene?', opts: ['Impide el potencial de acción', 'Lo vuelve más rápido', 'Aumenta el potencial de reposo a +60 mV'], ok: 0, fb: 'Sin corriente de sodio no hay retroalimentación positiva ni espiga; por eso es un veneno tan potente.' },
      { q: '¿Qué hace la mielina?', opts: ['Genera las espigas', 'Aísla el axón y permite la conducción saltatoria, mucho más rápida', 'Almacena los recuerdos'], ok: 1, fb: 'El impulso salta de un nodo de Ranvier a otro: hasta más de 100 m/s en fibras gruesas mielinizadas.' }
    ], { id: 'neurona', shuffle: true });
  });
})();
