/* Capítulo 27 — Neurorrehabilitación: recuperar después de una lesión */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, T = L.ter;

  /* ======================================================================
     27.1 No uso aprendido y umbral de dosis (inspirado en Han, Arbib y Schweighofer, 2008)
     ====================================================================== */
  RC.defineSim('ictus', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Habilidad y uso espontáneo del brazo afectado durante un año, con y sin terapia' });
    sim.group('Terapia de uso forzado');
    sim.slider('inicio', { label: 'Inicio (días después del ictus)', min: 5, max: 200, step: 5, value: 30, fmt: (v) => RC.nf(v) });
    sim.slider('dias', { label: 'Duración (días)', min: 0, max: 40, step: 1, value: 14, fmt: (v) => RC.nf(v) });
    sim.slider('forz', { label: 'Usos forzados por día', min: 0, max: 80, step: 1, value: 25, fmt: (v) => RC.nf(v) });
    sim.group('Paciente');
    sim.slider('s0', { label: 'Habilidad inicial del brazo', min: 0.15, max: 0.7, step: 0.01, value: 0.35, fmt: (v) => RC.pct(v, 0) });
    let seed = 3;
    sim.button('Otro paciente', () => { seed++; }, { id: 'otro' });
    sim.out('sf', 'Habilidad al año: con / sin terapia', { hl: true });
    sim.out('uf', 'Uso espontáneo al año: con / sin terapia');
    sim.onDraw(() => {
      const base = { S0: sim.p.s0, seed: seed * 7 + 1 };
      const r = T.stroke(Object.assign({}, base, { inicio: sim.p.inicio, dias: sim.p.dias, forzado: sim.p.forz }));
      const r0 = T.stroke(Object.assign({}, base, { dias: 0 }));
      const xs = r.S.map((_, i) => i);
      const sm = (a) => a.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - 20); j <= i; j++) { s += a[j]; n++; } return s / n; });
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 360, ymin: 0, ymax: 1, xlabel: 'días después del ictus', ylabel: 'fracción', yfmt: RC.pctAxis });
      pl.frame();
      if (sim.p.dias > 0) pl.band(sim.p.inicio, sim.p.inicio + sim.p.dias, { color: '--c3', alpha: 0.14 });
      pl.xy(xs, r0.S, { color: '--ink-3', width: 1.6, dash: [6, 4] });
      pl.xy(xs, sm(r0.uso).map((v) => Math.min(1, v * 2)), { color: '--ink-3', width: 1, dash: [2, 3] });
      pl.xy(xs, r.S, { color: '--c1', width: 2.6 });
      pl.xy(xs, sm(r.uso).map((v) => Math.min(1, v * 2)), { color: '--c2', width: 1.8 });
      pl.legend([{ label: 'habilidad, con terapia', color: '--c1' }, { label: 'uso espontáneo (relativo al sano), con terapia', color: '--c2' }, { label: 'sin terapia', color: '--ink-3', dash: [6, 4] }], 'tl');
      const n = r.S.length - 1, uA = (a) => Math.min(1, 2 * L.stat.mean(a.slice(-30)));
      sim.set('sf', RC.pct(r.S[n], 0) + ' / ' + RC.pct(r0.S[n], 0));
      sim.set('uf', RC.pct(uA(r.uso), 0) + ' / ' + RC.pct(uA(r0.uso), 0));
    });
  });

  /* ======================================================================
     27.2 La «regla de recuperación proporcional» y el techo de la escala (Hope y otros, 2019)
     ====================================================================== */
  RC.defineSim('proporcional', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Deficiencia inicial frente a cambio en la escala de Fugl-Meyer de pacientes simulados' });
    sim.group('Pacientes simulados');
    sim.slider('rmax', { label: 'Potencial de recuperación al azar (puntos, antes del techo)', min: 10, max: 150, step: 1, value: 100, fmt: (v) => RC.nf(v) });
    sim.check('techo', { label: 'La escala tiene techo (66 puntos)', value: true });
    sim.note('La recuperación de cada paciente se sortea sin ninguna relación con su deficiencia inicial.');
    sim.out('r', 'Correlación deficiencia inicial – cambio', { hl: true });
    sim.out('b', 'Pendiente (fracción recuperada)');
    sim.out('r2', 'Correlación puntaje inicial – final');
    sim.onDraw(() => {
      const rng = L.rng(27), n = 250, def = [], chg = [], ini = [], fin = [];
      for (let i = 0; i < n; i++) {
        const f0 = 4 + 58 * rng();
        let f1 = f0 + sim.p.rmax * rng();
        if (sim.p.techo) f1 = Math.min(66, f1);
        def.push(66 - f0); chg.push(f1 - f0); ini.push(f0); fin.push(f1);
      }
      const mx = L.stat.mean(def), my = L.stat.mean(chg);
      let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (def[i] - mx) * (chg[i] - my); sxx += (def[i] - mx) ** 2; }
      const b = sxy / sxx, a = my - b * mx;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 66, ymin: 0, ymax: 70, xlabel: 'deficiencia inicial (66 − Fugl-Meyer inicial)', ylabel: 'cambio en Fugl-Meyer' });
      pl.frame();
      pl.fn((x) => 0.7 * x, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.label(60, 0.7 * 60 - 3, '70 %', { color: '--ink-3', align: 'right' });
      for (let i = 0; i < n; i++) pl.dot(def[i], chg[i], { r: 2.5, color: '--c1' });
      pl.fn((x) => a + b * x, { color: '--c2', width: 2.2 });
      sim.set('r', RC.nf(L.stat.corr(def, chg), 2));
      sim.set('b', RC.nf(b, 2));
      sim.set('r2', RC.nf(L.stat.corr(ini, fin), 2));
    });
  });

  RC.defineSim('quiz-neurorrehab', function (sim) {
    RC.quiz(sim, [
      { q: 'El «no uso aprendido» después de un ictus significa que…', opts: ['El brazo afectado no puede moverse', 'Al fallar con el brazo afectado, la persona deja de usarlo y eso empeora su función', 'El cerebro olvida el brazo sano'], ok: 1, fb: 'Taub lo describió en monos y lo trató con terapia de restricción del lado sano.' },
      { q: 'En el modelo de Han y otros (2008), la dosis de terapia…', opts: ['Tiene un efecto proporcional', 'Tiene un umbral: por debajo, el uso vuelve a perderse; por encima, se mantiene solo', 'No importa'], ok: 1, fb: 'Por encima del umbral, el uso espontáneo sigue entrenando el brazo.' },
      { q: 'El ensayo CPASS sugiere que la terapia intensiva adicional rinde más…', opts: ['En las primeras 24 horas', 'Entre 60 y 90 días después del ictus', 'Después de un año'], ok: 1, fb: 'Dromerick y otros (2021); es un ensayo de fase II que requiere confirmación.' },
      { q: 'La fuerte correlación entre la deficiencia inicial y la recuperación («regla del 70 %»)…', opts: ['Prueba que todos recuperan el 70 %', 'Puede aparecer en parte por el techo de la escala y el acoplamiento matemático; su interpretación está en debate', 'Es un mito sin datos'], ok: 1, fb: 'Hope y otros (2019).' },
      { q: 'En el ensayo AVERT, movilizar muy pronto y con mucha intensidad (en las primeras 24 horas)…', opts: ['Mejoró los resultados', 'Redujo la probabilidad de un buen resultado a los 3 meses', 'No se ha estudiado'], ok: 1, fb: 'Más no siempre es mejor, sobre todo en los primeros días.' }
    ], { id: 'neurorrehab', shuffle: true });
  });
})();
