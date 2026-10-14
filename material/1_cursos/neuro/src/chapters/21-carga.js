/* Capítulo 21 — Carga, fatiga y recuperación */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, D = L.dep;
  const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  /* ======================================================================
     21.1 Planificador semanal con RPE de sesión (Foster)
     ====================================================================== */
  const SEMANAS = {
    variada: [420, 180, 0, 480, 120, 540, 0],
    monotona: [250, 250, 250, 250, 250, 250, 250],
    concentrada: [0, 0, 0, 0, 600, 600, 550]
  };
  RC.defineSim('srpe', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Carga diaria de una semana; arrastre las barras para cambiarla' });
    let w = SEMANAS.variada.slice(), pl = null;
    sim.group('Semanas típicas');
    sim.button('Variada', () => { w = SEMANAS.variada.slice(); });
    sim.button('Monótona', () => { w = SEMANAS.monotona.slice(); });
    sim.button('Concentrada', () => { w = SEMANAS.concentrada.slice(); });
    sim.note('Arrastre una barra hacia arriba o hacia abajo para cambiar la carga de ese día (minutos × RPE).');
    sim.out('tot', 'Carga semanal');
    sim.out('mono', 'Monotonía (media / desviación)', { hl: true });
    sim.out('ten', 'Tensión (carga × monotonía)');
    const setFrom = (x, y) => {
      if (!pl) return;
      const i = Math.round(pl.invX(x)) - 1;
      if (i < 0 || i > 6) return;
      w[i] = Math.round(RC.M.clamp(pl.invY(y), 0, 900) / 10) * 10;
      sim.redraw();
    };
    RC.pointer(cv, {
      down: (x, y) => { if (!pl || !pl.inside(x, y)) return null; setFrom(x, y); return 1; },
      move: (a, x, y) => setFrom(x, y),
      hover: (x, y) => (pl && pl.inside(x, y) ? 'ns-resize' : false)
    });
    sim.onDraw(() => {
      const f = D.foster(w);
      RC.draw.clear(cv);
      pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: 7.6, ymin: 0, ymax: 900, xticks: [1, 2, 3, 4, 5, 6, 7], xfmt: (v) => DIAS[v - 1] || '', ylabel: 'carga (UA)' });
      pl.frame();
      pl.hline(f.total / 7, { color: '--ink-3', label: 'media diaria', labelRight: true });
      pl.bars([1, 2, 3, 4, 5, 6, 7], w, { colors: w.map((v) => (v === 0 ? '--ink-3' : '--c1')), w: 0.7, labels: true, fmt: (v) => RC.nf(v, 0) });
      sim.set('tot', RC.nf(f.total, 0) + ' UA');
      sim.set('mono', isFinite(f.monotonia) ? RC.nf(f.monotonia, 2) + (f.monotonia > 2 ? ' (alta)' : '') : '∞ (todos los días iguales)');
      sim.set('ten', isFinite(f.tension) ? RC.nf(f.tension, 0) : '∞');
    });
  });

  /* ======================================================================
     21.2 Banister: plan de 12 semanas con puesta a punto; competencia el día 84
     ====================================================================== */
  RC.defineSim('banister', function (sim) {
    const cv = sim.canvas({ aspect: 2, label: 'Carga diaria, estado físico, fatiga y forma durante un plan de 12 semanas' });
    sim.group('Plan');
    sim.slider('carga', { label: 'Carga de un día fuerte (UA)', min: 200, max: 700, step: 20, value: 400, fmt: (v) => RC.nf(v) });
    sim.slider('prog', { label: 'Progresión semanal', min: 0, max: 0.06, step: 0.005, value: 0.02, fmt: (v) => RC.pct(v, 1) });
    sim.check('desc', { label: 'Semana de descarga cada 4 semanas', value: false });
    sim.group('Puesta a punto');
    sim.slider('td', { label: 'Días antes de competir', min: 0, max: 21, step: 1, value: 10, fmt: (v) => RC.nf(v) });
    sim.slider('tf', { label: 'Volumen durante la puesta a punto', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => RC.pct(v, 0) });
    sim.group('Parámetros personales');
    sim.slider('t1', { label: 'τ₁ del estado físico (días)', min: 30, max: 60, step: 1, value: 42, fmt: (v) => RC.nf(v) });
    sim.slider('t2', { label: 'τ₂ de la fatiga (días)', min: 4, max: 18, step: 1, value: 7, fmt: (v) => RC.nf(v) });
    sim.out('fc', 'Forma el día de competencia', { hl: true });
    sim.out('f0', 'Sin puesta a punto');
    sim.out('gp', 'Estado físico perdido en la puesta a punto');
    sim.out('best', 'Mejor puesta a punto con este volumen');
    const cargas = (td, tf) => {
      const l = D.plan({ semanas: 12, carga: sim.p.carga, prog: sim.p.prog, descargaCada: sim.p.desc ? 4 : 0, descarga: 0.6 });
      for (let d = 84 - td; d < 84; d++) l[d] *= tf;
      return l;
    };
    sim.onDraw(() => {
      const o = { tau1: sim.p.t1, tau2: sim.p.t2 };
      const loads = cargas(sim.p.td, sim.p.tf);
      const b = D.banister(loads, o);
      const b0 = D.banister(cargas(0, 1), o);
      let best = [-Infinity, 0];
      for (let td = 0; td <= 28; td++) { const p = D.banister(cargas(td, sim.p.tf), o).p[84]; if (p > best[0]) best = [p, td]; }
      const xs = b.p.map((_, i) => i);
      const k2h = b.h.map((v) => 2 * v);
      const ymax = Math.max(1000, ...b.g, ...k2h) * 1.08, ymin = Math.min(0, ...b.p) * 1.1;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 85, ymin, ymax, xlabel: 'día del plan', ylabel: 'unidades arbitrarias' });
      pl.frame();
      if (sim.p.td > 0) pl.band(84 - sim.p.td, 84, { color: '--c6', alpha: 0.1 });
      const lmax = Math.max(...loads, 1);
      pl.bars(loads.map((_, i) => i + 0.5), loads.map((v) => (v / lmax) * ymax * 0.22), { color: '--ink-3', alpha: 0.35, w: 0.8 });
      pl.xy(xs, b.g, { color: '--c3', width: 2 });
      pl.xy(xs, k2h, { color: '--c2', width: 1.6 });
      pl.xy(xs, b.p, { color: '--c1', width: 2.8 });
      pl.xy(xs, b0.p.map((v, i) => (i >= 84 - sim.p.td ? v : NaN)), { color: '--c1', width: 1.4, dash: [4, 4] });
      pl.vline(84, { label: 'competencia', align: 'right', labelY: 14 });
      pl.dot(84, b.p[84], { color: '--c1' });
      pl.legend([{ label: 'estado físico', color: '--c3' }, { label: 'fatiga × k₂', color: '--c2' }, { label: 'forma', color: '--c1' }, { label: 'forma sin puesta a punto', color: '--c1', dash: [4, 4] }], 'tl');
      sim.set('fc', RC.nf(b.p[84], 0));
      sim.set('f0', RC.nf(b0.p[84], 0));
      sim.set('gp', RC.pct(1 - b.g[84] / b0.g[84], 0));
      sim.set('best', best[1] + ' días');
    });
  });

  /* ======================================================================
     21.3 Acoplamiento matemático del cociente agudo:crónico
     ====================================================================== */
  RC.defineSim('acoplamiento', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Carga aguda frente a carga crónica de deportistas simulados' });
    sim.group('Cálculo');
    sim.seg('modo', { label: 'Carga crónica', options: [['c', 'Acoplada (incluye la semana aguda)'], ['u', 'Desacoplada']], value: 'c' });
    sim.group('Deportistas simulados');
    sim.slider('sb', { label: 'Variación entre deportistas', min: 0, max: 0.5, step: 0.02, value: 0, fmt: (v) => RC.pct(v, 0) });
    sim.slider('cv', { label: 'Variación de una semana a otra', min: 0.1, max: 0.5, step: 0.02, value: 0.3, fmt: (v) => RC.pct(v, 0) });
    sim.out('r', 'Correlación agudo–crónico', { hl: true });
    sim.out('rc', 'Acoplada / desacoplada');
    sim.out('alto', 'Deportistas con cociente > 1,5');
    sim.onDraw(() => {
      const s = D.acwrSim({ n: 400, sb: sim.p.sb, cv: sim.p.cv, seed: 21 });
      const C = sim.p.modo === 'c' ? s.Cc : s.Cu;
      const r = sim.p.modo === 'c' ? s.rC : s.rU;
      const hi = Math.max(2.4, ...s.A, ...C) * 1.02;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: hi, ymin: 0, ymax: hi, xlabel: 'carga crónica (relativa a la media)', ylabel: 'carga aguda (última semana)' });
      pl.frame();
      pl.fn((x) => 1.5 * x, { color: '--loss', width: 1.2, dash: [5, 4] });
      pl.fn((x) => 0.8 * x, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      for (let i = 0; i < s.A.length; i++) pl.dot(C[i], s.A[i], { r: 2.6, color: sim.p.modo === 'c' ? '--c1' : '--c3' });
      pl.label(hi / 1.5 * 0.92, hi * 0.97, 'cociente 1,5', { color: '--loss', align: 'right' });
      pl.label(hi * 0.97, 0.8 * hi * 0.97 - hi * 0.04, 'cociente 0,8', { align: 'right' });
      const nAlto = s.A.filter((a, i) => a / C[i] > 1.5).length;
      sim.set('r', RC.nf(r, 2));
      sim.set('rc', RC.nf(s.rC, 2) + ' / ' + RC.nf(s.rU, 2));
      sim.set('alto', RC.pct(nAlto / s.A.length, 1));
    });
  });

  /* ======================================================================
     21.4 Energía disponible
     ====================================================================== */
  RC.defineSim('energia-disp', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, label: 'Energía disponible en kilocalorías por kilogramo de masa libre de grasa y franjas orientativas' });
    sim.group('Cuerpo');
    sim.slider('peso', { label: 'Peso (kg)', min: 40, max: 130, step: 0.5, value: 80, fmt: (v) => RC.nf(v, 1) });
    sim.slider('grasa', { label: 'Grasa corporal estimada', min: 6, max: 45, step: 1, value: 25, fmt: (v) => RC.nf(v) + ' %' });
    sim.group('Día típico');
    sim.slider('ing', { label: 'Energía ingerida (kcal/día)', min: 1000, max: 4500, step: 50, value: 2500, fmt: (v) => RC.nf(v) });
    sim.slider('ej', { label: 'Gasto del ejercicio (kcal/día)', min: 0, max: 1500, step: 25, value: 500, fmt: (v) => RC.nf(v) });
    sim.out('mlg', 'Masa libre de grasa');
    sim.out('ea', 'Energía disponible', { hl: true });
    sim.out('zona', 'Franja orientativa', { wide: true });
    sim.onDraw(() => {
      const mlg = sim.p.peso * (1 - sim.p.grasa / 100);
      const ea = D.energiaDisp(sim.p.ing, sim.p.ej, sim.p.peso, sim.p.grasa);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 70, ymin: 0, ymax: 1, yticks: [], xlabel: 'kcal por kg de masa libre de grasa por día' });
      pl.frame();
      pl.band(0, 30, { color: '--loss', alpha: 0.18 });
      pl.band(30, 45, { color: '--gold', alpha: 0.2 });
      pl.band(45, 70, { color: '--gain', alpha: 0.16 });
      pl.label(15, 0.82, 'baja: riesgo de REDs', { align: 'center' });
      pl.label(37.5, 0.82, 'reducida', { align: 'center' });
      pl.label(57.5, 0.82, 'cercana al balance', { align: 'center' });
      const x = RC.M.clamp(ea, 0, 70);
      pl.vline(x, { color: '--ink', dash: [], width: 2.5 });
      pl.dot(x, 0.4, { color: '--c1', r: 7, label: RC.nf(ea, 1), mono: true });
      sim.set('mlg', RC.nf(mlg, 1) + ' kg');
      sim.set('ea', RC.nf(ea, 1) + ' kcal/kg MLG/día');
      sim.set('zona', ea < 30 ? 'Baja: si se mantiene por semanas, aumenta el riesgo de REDs' : ea < 45 ? 'Reducida: propia de un déficit para perder grasa; vigile síntomas y rendimiento' : 'Cercana al balance energético');
    });
  });

  RC.defineSim('quiz-carga', function (sim) {
    RC.quiz(sim, [
      { q: 'Una sesión de 50 minutos con RPE de sesión 6 tiene una carga de…', opts: ['56 UA', '300 UA', '3 000 UA'], ok: 1, fb: '6 × 50 = 300 unidades arbitrarias (Foster y otros, 2001).' },
      { q: 'En el modelo de Banister, la puesta a punto funciona porque…', opts: ['El estado físico aumenta durante el descanso', 'La fatiga se disipa más rápido que el estado físico', 'La carga se vuelve negativa'], ok: 1, fb: 'τ₂ (fatiga) es mucho menor que τ₁ (estado físico).' },
      { q: 'Según el metaanálisis de Bosquet y otros (2007), la puesta a punto más eficaz…', opts: ['Reduce la intensidad y mantiene el volumen', 'Dura unas dos semanas, reduce el volumen 41–60 % y mantiene la intensidad', 'Es descanso total durante un mes'], ok: 1, fb: 'Volumen abajo, intensidad y frecuencia sin cambios.' },
      { q: '¿Cuál es el problema del cociente agudo:crónico acoplado?', opts: ['Usa minutos en lugar de kilómetros', 'La semana aguda está dentro de la crónica y eso crea correlaciones espurias', 'Ninguno: predice bien las lesiones'], ok: 1, fb: 'Lolli y otros (2019); Impellizzeri y otros (2020).' },
      { q: 'El síndrome de sobreentrenamiento se diagnostica…', opts: ['Con un análisis de cortisol', 'Descartando otras causas y por la duración y gravedad del cuadro', 'Cuando el RPE supera 8'], ok: 1, fb: 'No hay un marcador único (Meeusen y otros, 2013).' },
      { q: 'La energía disponible se calcula como…', opts: ['Ingesta menos gasto total, por kg de peso', '(Ingesta − gasto del ejercicio) / masa libre de grasa', 'Gasto del ejercicio / ingesta'], ok: 1, fb: 'Mountjoy y otros (2023).' }
    ], { id: 'carga', shuffle: true });
  });
})();
