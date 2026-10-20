/* Capítulo 4 — Evaluar e incluir */
(function () {
  'use strict';
  const EM = window.EM, D = EM.draw;
  EM.defineSim('calificador', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const CR = EM.GUIA.RUBRICA.map((r) => r[0]);
    sim.group('Escala del SIEE');
    sim.slider('min', { label: 'Nota mínima', min: 0, max: 1, step: 1, value: 1, fmt: (v) => EM.fix(v, 1) });
    sim.slider('max', { label: 'Nota máxima', min: 5, max: 10, step: 5, value: 5, fmt: (v) => EM.fix(v, 1) });
    sim.slider('cb', { label: 'Corte Básico (fracción de la escala)', min: 0.4, max: 0.7, step: 0.01, value: 0.5, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.slider('ca', { label: 'Corte Alto', min: 0.6, max: 0.85, step: 0.01, value: 0.75, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.slider('cs', { label: 'Corte Superior', min: 0.8, max: 0.95, step: 0.01, value: 0.9, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.group('Desempeño del estudiante');
    CR.forEach((c, i) => sim.seg('c' + i, { label: c, options: [[0, 'Bajo'], [1, 'Básico'], [2, 'Alto'], [3, 'Superior']], value: 2 }));
    sim.group('Pesos');
    CR.forEach((c, i) => sim.slider('w' + i, { label: 'Peso · ' + c, min: 0, max: 3, step: 0.5, value: i === 2 ? 1.5 : 1, fmt: (v) => EM.fix(v, 1) }));
    sim.out('cortes', 'Cortes en la escala');
    sim.out('nota', 'Nota de la práctica', { hl: true });
    sim.out('niv', 'Equivalencia nacional', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const a = p.min, b = p.max, cut = [a, a + p.cb * (b - a), a + p.ca * (b - a), a + p.cs * (b - a), b];
      const mid = (k) => (cut[k] + cut[k + 1]) / 2;
      let sw = 0, s = 0;
      CR.forEach((_, i) => { sw += p['w' + i]; s += p['w' + i] * mid(p['c' + i]); });
      const nota = sw > 0 ? s / sw : a;
      const k = nota >= cut[3] ? 3 : nota >= cut[2] ? 2 : nota >= cut[1] ? 1 : 0;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: a, xmax: b, ymin: 0, ymax: CR.length + 1.2, xlabel: 'nota institucional', ylabel: '', yticks: [], ml: 24 });
      pl.frame();
      const cols = ['#C62828', '#D4B000', '#2E9D52', '#0B7A5F'];
      for (let j = 0; j < 4; j++) {
        ctx.save(); ctx.fillStyle = cols[j]; ctx.globalAlpha = 0.13; ctx.fillRect(pl.X(cut[j]), pl.iy, pl.X(cut[j + 1]) - pl.X(cut[j]), pl.ih); ctx.restore();
        EM.text(ctx, EM.GUIA.ESCALA[j], (pl.X(cut[j]) + pl.X(cut[j + 1])) / 2, pl.iy + 14, { size: 11.5, align: 'center', color: cols[j], weight: 650 });
      }
      CR.forEach((c, i) => {
        const y = CR.length - i;
        pl.dot(mid(p['c' + i]), y, { color: '--c1', r: 5 + p['w' + i] });
        EM.text(ctx, c, pl.X(a) + 6, pl.Y(y) - 9, { size: 10.5, color: '--ink-3' });
      });
      pl.vline(nota, { color: '--c2', dash: [], width: 2.5, label: 'nota ' + EM.fix(nota, 1) });
      sim.set('cortes', cut.slice(1, 4).map((x) => EM.fix(x, 2)).join(' · '));
      sim.set('nota', EM.fix(nota, 1) + ' (de ' + EM.fix(a, 1) + ' a ' + EM.fix(b, 1) + ')');
      sim.set('niv', `<span class="chip ${['bad', 'mid', 'ok', 'ok'][k]}">Desempeño ${EM.GUIA.ESCALA[k]}</span>`);
    });
  });
})();
