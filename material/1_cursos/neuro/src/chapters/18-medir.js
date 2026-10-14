/* Capítulo 18 — Medir el progreso sin engañarse */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, T = L.tend;

  /* ======================================================================
     18.1 Pesajes, tendencia real, media móvil y Kalman
     ====================================================================== */
  RC.defineSim('ruidopeso', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Pesajes diarios, peso real y dos estimaciones de la tendencia' });
    sim.group('Realidad');
    sim.slider('ritmo', { label: 'Pérdida real (kg por semana)', min: -0.25, max: 1.2, step: 0.05, value: 0.5, fmt: (v) => RC.nf(v, 2) });
    sim.slider('agua', { label: 'Fluctuación del agua (kg, DE)', min: 0, max: 1.2, step: 0.05, value: 0.5, fmt: (v) => RC.nf(v, 2) });
    sim.slider('ciclo', { label: 'Retención por ciclo menstrual (kg)', min: 0, max: 1.5, step: 0.1, value: 0, fmt: (v) => RC.nf(v, 1) });
    sim.slider('falta', { label: 'Días sin pesarse', min: 0, max: 0.7, step: 0.05, value: 0.15, fmt: (v) => RC.pct(v, 0) });
    let seed = 12;
    sim.button('Otros 90 días', () => { seed++; }, { id: 'otro' });
    sim.out('sube', 'Días en que la báscula subió', { hl: true });
    sim.out('kal', 'Ritmo estimado por Kalman (último día)');
    sim.out('det', 'Día en que la regresión detecta el cambio');
    sim.onDraw(() => {
      const s = T.simPeso({ seed, dias: 90, peso0: 85, ritmo: sim.p.ritmo, sdAgua: sim.p.agua, ciclo: sim.p.ciclo, faltan: sim.p.falta });
      const k = T.kalman(s.y, { qN: 0.0025, qP: 2e-6, r: 0.45 }), e = T.ema(s.y, 0.1);
      let sube = 0, tot = 0, prev = null;
      s.y.forEach((v) => { if (v !== null) { if (prev !== null) { tot++; if (v > prev) sube++; } prev = v; } });
      const det = T.diasDeteccion(s.t, s.ritmo === 0 ? s.y : s.y.map((v) => (v === null ? null : sim.p.ritmo >= 0 ? v : -v)), 7);
      RC.draw.clear(cv);
      const vals = s.y.filter((v) => v !== null);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 89, ymin: Math.floor(Math.min(...vals, ...s.real) - 0.5), ymax: Math.ceil(Math.max(...vals, ...s.real) + 0.5), xlabel: 'día', ylabel: 'kg' });
      pl.frame();
      s.y.forEach((v, i) => { if (v !== null) pl.dot(i, v, { color: '--c6', r: 3 }); });
      pl.xy(s.t, s.real, { color: '--c3', width: 2.2 });
      pl.xy(s.t, e, { color: '--c4', width: 1.6, dash: [5, 4] });
      pl.xy(s.t, k.lvl, { color: '--c1', width: 2.6 });
      pl.legend([{ label: 'pesajes', color: '--c6', kind: 'dot' }, { label: 'peso real', color: '--c3' }, { label: 'Kalman', color: '--c1' }, { label: 'media móvil 10 %', color: '--c4', dash: [5, 4] }], 'tr');
      const n = k.slope.length - 1;
      sim.set('sube', `${sube} de ${tot}`);
      sim.set('kal', `${RC.nf(-7 * k.slope[n], 2)} ± ${RC.nf(7 * 1.96 * k.sdSlope[n], 2)} kg/semana de pérdida`);
      sim.set('det', isFinite(det) ? `día ${det}` : 'no en 90 días');
    });
  });

  /* ======================================================================
     18.2 Días hasta detectar una tendencia (simulación de muchas personas)
     ====================================================================== */
  RC.defineSim('deteccion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Fracción de personas en que ya se detectó la pérdida según los días transcurridos' });
    sim.group('Medición');
    sim.slider('agua', { label: 'Fluctuación del agua (kg, DE)', min: 0.2, max: 1.2, step: 0.05, value: 0.5, fmt: (v) => RC.nf(v, 2) });
    sim.seg('frec', { label: 'Frecuencia de pesaje', options: [[1, 'diaria'], [0.43, '3 por semana'], [0.14, 'semanal']], value: 1 });
    sim.out('r25', '0,25 kg/sem: 80 % detectado al día');
    sim.out('r50', '0,5 kg/sem: 80 % detectado al día', { hl: true });
    sim.out('r100', '1 kg/sem: 80 % detectado al día');
    const cache = {};
    sim.onDraw(() => {
      const key = sim.p.agua + '|' + sim.p.frec;
      if (!cache[key]) {
        const res = {};
        for (const r of [0.25, 0.5, 1]) {
          const curve = new Array(91).fill(0), R = 40;
          for (let s = 0; s < R; s++) {
            const sm = T.simPeso({ seed: 500 + s, dias: 91, peso0: 85, ritmo: r, sdAgua: sim.p.agua, faltan: 1 - sim.p.frec });
            const d = T.diasDeteccion(sm.t, sm.y, 7);
            for (let i = Math.min(91, isFinite(d) ? d : 91); i < 91; i++) curve[i] += 1 / R;
          }
          res[r] = curve;
        }
        cache[key] = res;
      }
      const res = cache[key];
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 90, ymin: 0, ymax: 1, xlabel: 'días de registro', ylabel: 'personas con la pérdida ya detectada', yfmt: RC.pctAxis });
      pl.frame();
      pl.hline(0.8, { color: '--ink-3', label: '80 %', labelRight: true });
      const cols = { 0.25: '--c4', 0.5: '--c1', 1: '--c3' };
      for (const r of [0.25, 0.5, 1]) pl.xy(res[r].map((_, i) => i), res[r], { color: cols[r], width: 2.4 });
      pl.legend([{ label: '0,25 kg/semana', color: '--c4' }, { label: '0,5 kg/semana', color: '--c1' }, { label: '1 kg/semana', color: '--c3' }], 'br');
      const d80 = (c) => { const i = c.findIndex((v) => v >= 0.8); return i >= 0 ? `día ${i}` : 'más de 90'; };
      sim.set('r25', d80(res[0.25])); sim.set('r50', d80(res[0.5])); sim.set('r100', d80(res[1]));
    });
  });

  RC.defineSim('quiz-medir', function (sim) {
    RC.quiz(sim, [
      { q: 'Su báscula marca 600 g más que ayer, pero lleva semanas cumpliendo su plan. Lo más probable es que…', opts: ['Haya ganado 600 g de grasa', 'Sea ruido: agua, sal, glucógeno o comida en el intestino', 'La báscula esté dañada'], ok: 1, fb: 'Las fluctuaciones diarias de uno o dos kilos son normales.' },
      { q: '¿Qué hace el filtro de Kalman con cada pesaje nuevo?', opts: ['Lo reemplaza por el promedio de la semana', 'Combina la predicción del modelo con la medición, ponderando por sus incertidumbres', 'Lo ignora si sube'], ok: 1, fb: 'Es la misma lógica de la integración bayesiana del capítulo 8.' },
      { q: '¿Cuál es el principal defecto de la media móvil exponencial?', opts: ['No suaviza', 'Se retrasa respecto de los cambios reales', 'Necesita muchos datos'], ok: 1, fb: 'Con α = 0,1 tarda unos 7 días en recorrer la mitad de un salto.' },
      { q: '¿Cuándo conviene evaluar si un plan de pérdida de grasa funciona?', opts: ['A los 3 días', 'Con 3 a 4 semanas de datos', 'Solo al año'], ok: 1, fb: 'Para ritmos sostenibles, la tendencia real tarda semanas en salir del ruido.' },
      { q: 'La ley de Goodhart advierte que…', opts: ['Medir no sirve', 'Cuando una medida se vuelve el objetivo, deja de medir bien', 'Las rachas siempre ayudan'], ok: 1, fb: 'Use los números para aprender, no como fin en sí mismos.' }
    ], { id: 'medir', shuffle: true });
  });
})();
