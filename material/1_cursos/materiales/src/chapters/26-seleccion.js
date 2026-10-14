/* Capítulo 26 — Selección de materiales y sostenibilidad */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const CLS = EM.CLS_COLORS;
  /* índices: [nombre, función(m) con E en GPa, ρ en Mg/m³, σ en MPa] */
  const IDX = {
    tieE: ['Tirante rígido: E/ρ', (m, r) => m.E / r],
    tieS: ['Tirante resistente: σ/ρ', (m, r) => m.sy / r],
    beamE: ['Viga o columna rígida: E½/ρ', (m, r) => Math.sqrt(m.E) / r],
    beamS: ['Viga resistente: σ⅔/ρ', (m, r) => Math.pow(m.sy, 2 / 3) / r],
    plateE: ['Placa rígida: E⅓/ρ', (m, r) => Math.cbrt(m.E) / r],
    spring: ['Resorte: σ²/E', (m) => (m.sy * m.sy) / (m.E * 1000)],
    lbb: ['Fuga antes de rotura: K_Ic²/σ', (m) => (m.KIc * m.KIc) / m.sy]
  };

  /* ======================================================================
     26.1 Ranking por índice
     ====================================================================== */
  EM.defineSim('material-index', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.select('ix', { label: 'Componente', options: Object.entries(IDX).map(([k, v]) => [k, v[0]]), value: 'beamE' });
    sim.seg('obj', { label: 'Objetivo', options: [['mass', 'Mínima masa'], ['cost', 'Mínimo costo']], value: 'mass' });
    sim.slider('K', { label: 'Tenacidad mínima K<sub>Ic</sub>', min: 0, max: 40, step: 1, value: 0, unit: 'MPa√m', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura de servicio', min: 20, max: 800, step: 10, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('top', 'Mejor candidato', { hl: true });
    sim.out('n', 'Materiales que cumplen las restricciones');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const f = IDX[p.ix][1];
      const massBased = !['spring', 'lbb'].includes(p.ix);
      const ok = MAT.db.filter((m) => m.KIc >= p.K && m.Tmax >= p.T && m.sy > 0 && (p.obj === 'mass' || m.cost > 0));
      const val = (m) => f(m, massBased ? (p.obj === 'cost' ? (m.rho / 1000) * m.cost : m.rho / 1000) : 1);
      const list = ok.map((m) => [m, val(m)]).sort((a, b) => b[1] - a[1]).slice(0, 15);
      if (!list.length) { EM.text(ctx, 'Ningún material cumple las restricciones', cv.w / 2, cv.h / 2, { size: 14, align: 'center', color: '--c2' }); sim.set('top', '—'); sim.set('n', '0'); return; }
      const mx = list[0][1] * 1.15;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: mx, ymin: 0, ymax: list.length, xlabel: 'índice ' + (p.obj === 'cost' && massBased ? 'por unidad de costo' : '') + ' (u. relativas)', yticks: [], ml: 230, mb: 36 });
      pl.frame();
      list.forEach(([m, v], i) => {
        const y = list.length - i - 0.5;
        ctx.fillStyle = EM.alpha(CLS[m.cls], i === 0 ? 0.95 : 0.6);
        ctx.fillRect(pl.X(0), pl.Y(y + 0.35), pl.X(v) - pl.X(0), pl.Y(y - 0.35) - pl.Y(y + 0.35));
        EM.text(ctx, m.name, pl.X(0) - 6, pl.Y(y) + 4, { size: 10.5, align: 'right', color: '--ink-2' });
      });
      sim.set('top', list[0][0].name);
      sim.set('n', ok.length + ' de ' + MAT.db.length);
    });
    sim.note('Ordena la base de datos del curso (38 materiales, valores típicos de Ashby y Callister); los costos son aproximados.');
  });

  /* ======================================================================
     26.2 Mapa con línea guía y restricciones
     ====================================================================== */
  EM.defineSim('selection-chart', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.slider('slope', { label: 'Pendiente de la línea guía', min: 1, max: 3, step: 0.5, value: 2, fmt: (v) => ({ 1: '1 · E/ρ', 1.5: '1.5', 2: '2 · √E/ρ', 2.5: '2.5', 3: '3 · ∛E/ρ' })[v] });
    sim.slider('pos', { label: 'Posición de la línea', min: -2, max: 2.5, step: 0.02, value: 0.7, fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura de servicio mínima', min: 20, max: 800, step: 10, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('c', 'Candidatos por encima de la línea', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.03, xmax: 30, ymin: 0.001, ymax: 1500, xlog: true, ylog: true, xlabel: 'densidad ρ (Mg/m³)', ylabel: 'módulo E (GPa)', ml: 60 });
      pl.frame();
      const f = (x) => Math.pow(10, p.slope * Math.log10(x) + p.slope * p.pos * 0.5);
      /* zona aceptada */
      ctx.save(); ctx.beginPath(); ctx.moveTo(pl.X(0.03), pl.Y(Math.min(1500, f(0.03))));
      for (let q = 0; q <= 60; q++) { const x = Math.pow(10, -1.52 + (q / 60) * 3); ctx.lineTo(pl.X(x), pl.Y(Math.max(0.001, Math.min(1500, f(x))))); }
      ctx.lineTo(pl.X(30), pl.Y(1500)); ctx.lineTo(pl.X(0.03), pl.Y(1500)); ctx.closePath(); ctx.fillStyle = EM.alpha('--c3', 0.08); ctx.fill(); ctx.restore();
      pl.fn(f, { color: '--accent', width: 2, dash: [7, 4] });
      const cand = [];
      for (const m of MAT.db) {
        const x = m.rho / 1000, y = m.E, okT = m.Tmax >= p.T, above = y > f(x);
        pl.dot(x, y, { color: okT ? CLS[m.cls] : '--grid-2', r: above && okT ? 6 : 3.5 });
        if (above && okT) { cand.push(m.name); pl.label(x, y, m.name.split(' (')[0], { size: 9.5, dx: 7, dy: -5, color: '--ink-2' }); }
      }
      sim.set('c', cand.length ? cand.length + ': ' + cand.join(', ') : 'ninguno');
    });
  });

  /* ======================================================================
     26.3 Energía incorporada de una viga
     ====================================================================== */
  const ECO = { 'Acero al carbono 1020': 27, 'Aluminio 6061-T6': 200, 'Titanio Ti-6Al-4V': 650, 'CFRP (carbono/epoxi, cuasiisótropo)': 275, 'GFRP (vidrio/epoxi, cuasiisótropo)': 100, 'Madera de pino (a la fibra)': 11, 'Magnesio AZ31B': 300 };
  EM.defineSim('eco-beam', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.check('rec', { label: 'Aluminio reciclado (≈ 18 MJ/kg)', value: false });
    sim.slider('use', { label: 'Energía de uso por kg transportado en la vida útil', min: 0, max: 2000, step: 10, value: 0, unit: 'MJ/kg', fmt: (v) => v.toFixed(0) });
    sim.out('best', 'Menor energía total', { hl: true });
    sim.out('note', 'Referencia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const rows = Object.entries(ECO).map(([n, H]) => {
        const m = MAT.db.find((q) => q.name === n);
        const Hh = n.startsWith('Aluminio') && p.rec ? 18 : H;
        const mass = (m.rho / 1000) / Math.sqrt(m.E); // masa relativa de la viga de rigidez dada
        return [n, mass * Hh, mass * p.use, mass];
      });
      const ref = rows.find((r) => r[0].startsWith('Acero'));
      const mx = Math.max(...rows.map((r) => r[1] + r[2])) * 1.12;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: mx, ymin: 0, ymax: rows.length, xlabel: 'energía de la viga (relativa)', yticks: [], ml: 220, mb: 36 });
      pl.frame();
      rows.sort((a, b) => a[1] + a[2] - (b[1] + b[2])).forEach(([n, e1, e2, mass], i) => {
        const y = rows.length - i - 0.5;
        ctx.fillStyle = EM.alpha('--c4', 0.8); ctx.fillRect(pl.X(0), pl.Y(y + 0.33), pl.X(e1) - pl.X(0), pl.Y(y - 0.33) - pl.Y(y + 0.33));
        ctx.fillStyle = EM.alpha('--c1', 0.6); ctx.fillRect(pl.X(e1), pl.Y(y + 0.33), pl.X(e1 + e2) - pl.X(e1), pl.Y(y - 0.33) - pl.Y(y + 0.33));
        EM.text(ctx, n.split(' (')[0] + ' · masa ' + EM.fix(mass / ref[3], 2) + '×', pl.X(0) - 6, pl.Y(y) + 4, { size: 10.5, align: 'right', color: '--ink-2' });
      });
      pl.legend([{ label: 'producción', color: '--c4', kind: 'sq' }, { label: 'uso', color: '--c1', kind: 'sq' }], 'br');
      const best = rows.reduce((b, r) => (r[1] + r[2] < b[1] + b[2] ? r : b));
      sim.set('best', best[0]);
      sim.set('note', 'masa relativa ∝ ρ/√E (viga de rigidez dada); energía incorporada típica de Ashby (2013)');
    });
  });
})();
