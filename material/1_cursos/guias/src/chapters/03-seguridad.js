/* Capítulo 3 — Seguridad, riesgos y residuos */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, D = EM.draw, G = EM.GTC;
  const COLN = { I: '#C62828', II: '#E07B12', III: '#D4B000', IV: '#2E9D52' };

  EM.defineSim('gtc45', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.select('nd', { label: 'Nivel de deficiencia (ND)', options: G.ND.map((r) => [r[0], r[0] ? r[0] + ' · ' + r[1] : r[1]]), value: 6 });
    sim.select('ne', { label: 'Nivel de exposición (NE)', options: G.NE.map((r) => [r[0], r[0] + ' · ' + r[1]]), value: 3 });
    sim.select('nc', { label: 'Nivel de consecuencia (NC)', options: G.NC.map((r) => [r[0], r[0] + ' · ' + r[1]]), value: 25 });
    sim.out('np', 'Nivel de probabilidad NP = ND × NE');
    sim.out('nr', 'Nivel de riesgo NR = NP × NC', { hl: true });
    sim.out('ac', 'Aceptabilidad');
    sim.out('sig', 'Qué hacer');
    const NPs = [2, 3, 4, 6, 8, 10, 12, 18, 20, 24, 30, 40].filter((v) => v !== 3), NCs = [10, 25, 60, 100];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      const v = G.valorar(+p.nd, +p.ne, +p.nc);
      const ml = 70, mt = 34, cw = (W - ml - 16) / NCs.length, ch = (H - mt - 40) / NPs.length;
      EM.text(ctx, 'NC →', ml, mt - 14, { size: 11.5, color: '--ink-3' });
      NCs.forEach((nc, i) => EM.text(ctx, String(nc), ml + (i + 0.5) * cw, mt - 14, { size: 12, align: 'center', weight: 650 }));
      NPs.slice().reverse().forEach((np, j) => {
        const y = mt + j * ch;
        EM.text(ctx, 'NP ' + np, ml - 8, y + ch / 2 + 4, { size: 11.5, align: 'right', color: '--ink-2' });
        NCs.forEach((nc, i) => {
          const nr = np * nc, niv = nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV';
          const x = ml + i * cw;
          D.rect(ctx, x + 1, y + 1, cw - 2, ch - 2, { fill: COLN[niv], alpha: 0.78, stroke: null, r: 2 });
          EM.text(ctx, niv + ' · ' + nr, x + cw / 2, y + ch / 2 + 4, { size: Math.min(12, ch * 0.5), align: 'center', color: '#FFFFFF', weight: 650 });
          if (v.np === np && +p.nc === nc) { ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4); ctx.restore(); }
        });
      });
      EM.text(ctx, 'ND bajo: riesgo controlado, nivel IV directo', ml, H - 14, { size: 11, color: '--ink-3' });
      sim.set('np', v.np === null ? 'no se calcula (ND bajo)' : v.np + ' · ' + G.npNivel(v.np));
      sim.set('nr', v.nr === null ? 'IV' : v.nr + ' · nivel ' + v.nivel);
      sim.set('ac', `<span class="chip ${{ I: 'bad', II: 'warn', III: 'mid', IV: 'ok' }[v.nivel]}">${v.acept}</span>`);
      sim.set('sig', v.sig);
    });
  });

  EM.defineSim('cuerpo', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('U', { label: 'Tensión de contacto (mano a mano)', min: 1.5, max: 240, step: 0.5, value: 120, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.check('dif', { label: 'Circuito protegido con diferencial de 30 mA', value: true });
    sim.out('z', 'Impedancia total del cuerpo');
    sim.out('i', 'Corriente', { hl: true });
    sim.out('ef', 'Efecto probable (ca 50/60 Hz)');
    sim.out('d', 'Diferencial');
    const fuentes = [[1.5, 'pila AA'], [9, 'pila de 9 V'], [12, 'fuente 12 V'], [24, '24 V'], [120, 'toma 120 V'], [208, '208 V']];
    const efecto = (I) => (I < 0.5 ? 'Imperceptible' : I < 10 ? 'Se percibe; la persona puede soltar el conductor' : I < 30 ? 'Contracciones fuertes; puede no soltar el conductor; dificultad para respirar' : 'Riesgo de fibrilación ventricular si dura más de una fracción de segundo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 250, ymin: 0.1, ymax: 300, xlog: true, ylog: true, xlabel: 'tensión de contacto U (V)', ylabel: 'corriente I (mA)' });
      pl.frame();
      const bands = [[0.1, 0.5, '#2E9D52', 'imperceptible'], [0.5, 10, '#D4B000', 'se percibe, se suelta'], [10, 30, '#E07B12', 'contracción, no se suelta'], [30, 300, '#C62828', 'riesgo de fibrilación']];
      for (const [a, b, c, t] of bands) {
        ctx.save(); ctx.fillStyle = c; ctx.globalAlpha = 0.12; ctx.fillRect(pl.ix, pl.Y(b), pl.iw, pl.Y(a) - pl.Y(b)); ctx.restore();
        EM.text(ctx, t, pl.ix + pl.iw - 6, pl.Y(Math.sqrt(a * b)) + 4, { size: 11, align: 'right', color: c, weight: 650, halo: true });
      }
      pl.fn((U) => (1000 * U) / MO.zCuerpo(U), { color: '--c1', width: 2.4, from: 25, n: 200 });
      pl.fn((U) => (1000 * U) / MO.zCuerpo(U), { color: '--c1', width: 1.6, dash: [5, 4], to: 25, n: 80 });
      pl.hline(30, { color: '--c2', label: 'diferencial 30 mA', dash: [4, 3] });
      for (const [u, t] of fuentes) { pl.vline(u, { color: '--ink-3', dash: [2, 4] }); EM.text(ctx, t, pl.X(u) + 3, pl.iy + 12 + (u > 100 ? 14 : 0), { size: 10.5, color: '--ink-3', halo: true }); }
      const Z = MO.zCuerpo(p.U), I = (1000 * p.U) / Z;
      pl.dot(p.U, I, { color: '--c2', r: 6 });
      sim.set('z', EM.fix(Z, 0) + ' Ω' + (p.U < 25 ? ' (cota: la piel seca real es mucho más resistente)' : ''));
      sim.set('i', (p.U < 25 ? 'menos de ' : '') + EM.fix(I, 1) + ' mA');
      sim.set('ef', efecto(I));
      sim.set('d', p.dif ? (I >= 30 ? (I >= 150 ? 'Dispara en menos de 40 ms (corriente ≥ 5 × 30 mA)' : 'Dispara en menos de 300 ms') : 'No dispara: la corriente es menor que 30 mA') : '<span class="chip bad">Sin protección</span>');
    });
  });

  const PILAS = {
    aa: { n: 'Pila AA alcalina', E: 1.5, r: 0.15 },
    v9: { n: 'Pila alcalina de 9 V', E: 9, r: 1.7 },
    pp4: { n: 'Portapilas de 4 × AA (6 V)', E: 6, r: 0.6 },
    li: { n: 'Celda de litio 18650 (3,7 V)', E: 3.7, r: 0.04 },
    pb: { n: 'Batería de plomo de moto (12 V)', E: 12, r: 0.02 }
  };
  const AWG = { 22: 0.644e-3, 26: 0.405e-3, 30: 0.255e-3 };
  EM.defineSim('cortocircuito', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('pila', { label: 'Fuente', options: Object.keys(PILAS).map((k) => [k, PILAS[k].n]), value: 'li' });
    sim.seg('awg', { label: 'Alambre de cobre', options: [[22, 'AWG 22'], [26, 'AWG 26'], [30, 'AWG 30']], value: 26 });
    sim.slider('Lw', { label: 'Longitud del alambre', min: 2, max: 50, step: 1, value: 10, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.check('fus', { label: 'Portapilas con fusible de 2 A', value: false });
    sim.out('R', 'Resistencia del alambre');
    sim.out('I', 'Corriente de cortocircuito', { hl: true });
    sim.out('P', 'Potencia en el alambre / en la pila');
    sim.out('t', 'Tiempo para que el alambre llegue a 160 °C');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, B = PILAS[p.pila];
      D.clear(cv);
      const d = AWG[p.awg], A = (Math.PI * d * d) / 4, Lw = p.Lw / 100;
      const Rw = (1.72e-8 * Lw) / A, c = MO.cortoPila(B.E, B.r, Rw);
      const fundido = p.fus && c.I > 2;
      const m = 8960 * A * Lw, dTdt = c.Pw / (m * 385), t160 = (160 - 25) / dTdt;
      /* dibujo */
      const T = fundido ? 25 : Math.min(900, 25 + dTdt * 3);
      const glow = Math.min(1, Math.max(0, (T - 400) / 500));
      const y = H * 0.55;
      D.pila(ctx, W * 0.32, y, W * 0.32, { label: B.E + ' V' });
      ctx.save(); ctx.lineWidth = 4;
      ctx.strokeStyle = glow > 0 ? `rgb(${200 + 55 * glow},${120 + 60 * glow},${60})` : EM.col('--copper');
      if (glow > 0) { ctx.shadowColor = '#FF6A00'; ctx.shadowBlur = 18 * glow; }
      ctx.beginPath(); ctx.moveTo(W * 0.16, y); ctx.bezierCurveTo(W * 0.1, H * 0.12, W * 0.55, H * 0.12, W * 0.48, y); ctx.stroke(); ctx.restore();
      if (fundido) D.label(ctx, 'el fusible abrió el circuito', W * 0.32, H * 0.18, { align: 'center', color: '--c3', weight: 650 });
      D.label(ctx, 'temperatura del alambre a los 3 s (sin pérdidas): ' + (fundido ? '25' : T >= 900 ? 'más de 900' : EM.fix(T, 0)) + ' °C', W * 0.32, H * 0.9, { align: 'center' });
      /* barras de potencia */
      const x0 = W * 0.64, bw = W * 0.12, base = H * 0.82, top = H * 0.12;
      const Pmax = Math.max(1, c.Pw, c.Pr);
      const barra = (x, P, lab, col) => { const h = fundido ? 0 : ((base - top) * Math.log10(1 + P)) / Math.log10(1 + Math.max(Pmax, 100)); D.rect(ctx, x, base - h, bw, h, { fill: col, r: 2 }); D.label(ctx, lab, x + bw / 2, base + 16, { align: 'center', size: 11 }); D.label(ctx, fundido ? '0 W' : EM.si(P, 'W', 2), x + bw / 2, base - h - 6, { align: 'center', size: 11, weight: 650 }); };
      barra(x0, c.Pw, 'alambre', '--c4');
      barra(x0 + bw * 1.4, c.Pr, 'pila', '--c2');
      sim.set('R', EM.si(Rw, 'Ω', 3));
      sim.set('I', fundido ? '0 A (fusible abierto)' : EM.fix(c.I, 1) + ' A');
      sim.set('P', fundido ? '0 W' : EM.si(c.Pw, 'W', 2) + ' / ' + EM.si(c.Pr, 'W', 2));
      sim.set('t', fundido ? '—' : t160 < 0.05 ? 'menos de 0,05 s' : EM.fix(t160, t160 < 10 ? 2 : 0) + ' s (estimación sin pérdidas de calor)');
    });
  });
})();
