/* Capítulo 2 — El espacio y la dotación */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, D = EM.draw;

  /* Área exigida por estudiante (NTC 4595:2025, 5.3.3): base + 0,1 m² por cada 10 estudiantes menos que 40 */
  EM.areaNTC = (base, N) => base + Math.max(0, 40 - N) * 0.01;

  EM.defineSim('dimensionador', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.group('Grupo');
    sim.slider('N', { label: 'Estudiantes por sesión', min: 10, max: 45, step: 1, value: 30, fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Estudiantes por grupo', min: 2, max: 6, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.seg('tipo', { label: 'Tipo de laboratorio', options: [[2.2, 'Física (2,2 m²)'], [2.5, 'Integrado (2,5 m²)']], value: 2.2 });
    sim.group('Salón');
    sim.slider('L', { label: 'Largo', min: 4, max: 16, step: 0.1, value: 9, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('W', { label: 'Ancho', min: 4, max: 12, step: 0.1, value: 8, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.seg('ori', { label: 'Mesones', options: [['h', 'Paralelos al largo'], ['v', 'Paralelos al ancho']], value: 'h' });
    sim.check('franja', { label: 'Reservar 1,5 m al frente para tablero y docente', value: true });
    sim.out('area', 'Área del salón');
    sim.out('req', 'Área exigida', { hl: true });
    sim.out('mes', 'Mesones que caben / necesarios', { hl: true });
    sim.out('gfci', 'Tomas con GFCI en mesones');
    sim.out('agua', 'Pocetas');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W0 = cv.w, H0 = cv.h;
      D.clear(cv);
      const grupos = Math.ceil(p.N / p.g);
      const [bl, bw] = p.g <= 4 ? [1.6, 0.8] : [2.0, 0.9];
      const [ml, mw] = p.ori === 'h' ? [bl, bw] : [bw, bl];
      const fr = p.franja ? 1.5 : 0;
      const Lu = p.L - 2 * 1.2 - fr, Wu = p.W - 2 * 1.2;
      const nx = Lu >= ml ? Math.floor((Lu + 1.4) / (ml + 1.4)) : 0, ny = Wu >= mw ? Math.floor((Wu + 1.4) / (mw + 1.4)) : 0;
      const caben = nx * ny;
      const areaReq = EM.areaNTC(+p.tipo, p.N) * p.N, area = p.L * p.W;
      /* dibujo en planta */
      const pad = 44, sc = Math.min((W0 - 2 * pad) / p.L, (H0 - 2 * pad - 20) / p.W);
      const ox = (W0 - p.L * sc) / 2 + 12, oy = pad + 6;
      ctx.save();
      ctx.fillStyle = EM.col('--surface-2'); ctx.fillRect(ox, oy, p.L * sc, p.W * sc);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.strokeRect(ox, oy, p.L * sc, p.W * sc);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
      ctx.strokeRect(ox + (1.2 + fr) * sc, oy + 1.2 * sc, Math.max(0, Lu) * sc, Math.max(0, Wu) * sc);
      ctx.restore();
      if (fr) { D.rect(ctx, ox + 0.15 * sc, oy + p.W * sc * 0.2, 0.12 * sc, p.W * sc * 0.6, { fill: '--ink-2' }); D.label(ctx, 'tablero', ox + 0.5 * sc, oy + p.W * sc * 0.18, { size: 10.5 }); D.rect(ctx, ox + 0.5 * sc, oy + p.W * sc * 0.42, 0.7 * sc, 1.2 * sc, { fill: '--wood' }); }
      const x0 = ox + (1.2 + fr) * sc + Math.max(0, (Lu - (nx * ml + (nx - 1) * 1.4)) / 2) * sc;
      const y0 = oy + 1.2 * sc + Math.max(0, (Wu - (ny * mw + (ny - 1) * 1.4)) / 2) * sc;
      let k = 0;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        k++;
        const x = x0 + i * (ml + 1.4) * sc, y = y0 + j * (mw + 1.4) * sc;
        D.rect(ctx, x, y, ml * sc, mw * sc, { fill: k <= grupos ? '--accent' : '--surface-3', r: 2, alpha: k <= grupos ? 0.85 : 1 });
        if (ml * sc > 22) D.label(ctx, String(k), x + (ml * sc) / 2, y + (mw * sc) / 2 + 4, { align: 'center', color: k <= grupos ? '#FFFFFF' : '--ink-3', halo: false, size: 10.5, weight: 650 });
      }
      /* poceta con ducha en una esquina */
      D.rect(ctx, ox + p.L * sc - 0.9 * sc, oy + p.W * sc - 0.9 * sc, 0.6 * sc, 0.6 * sc, { fill: '--water', r: 2 });
      D.label(ctx, 'ducha', ox + p.L * sc - 0.95 * sc, oy + p.W * sc - 0.3 * sc, { size: 10, align: 'right' });
      D.cota(ctx, ox, oy + p.W * sc + 14, ox + p.L * sc, oy + p.W * sc + 14, EM.fix(p.L, 1) + ' m', { side: 1 });
      D.cota(ctx, ox - 14, oy, ox - 14, oy + p.W * sc, EM.fix(p.W, 1) + ' m', { side: 1 });
      if (nx > 1) { const xa = x0 + ml * sc, ya = y0 + (mw * sc) / 2; D.cota(ctx, xa, ya, xa + 1.4 * sc, ya, '1,4', { size: 10 }); }
      D.label(ctx, 'Línea punteada: 1,2 m de las paredes (NTC 4595, 9.4.7)', ox, oy - 10, { size: 10.5, color: '--ink-3' });
      const okA = area >= areaReq, okM = caben >= grupos;
      sim.set('area', EM.fix(area, 1) + ' m² (' + EM.fix(area / p.N, 2) + ' m² por estudiante)');
      sim.set('req', EM.fix(areaReq, 1) + ' m² = ' + EM.fix(EM.areaNTC(+p.tipo, p.N), 2) + ' × ' + p.N + ' ' + (okA ? '<span class="chip ok">Cumple</span>' : '<span class="chip bad">No cumple</span>'));
      sim.set('mes', caben + ' / ' + grupos + ' (' + EM.fix(ml, 1) + ' × ' + EM.fix(mw, 1) + ' m) ' + (okM ? '<span class="chip ok">Suficientes</span>' : '<span class="chip bad">Faltan ' + (grupos - caben) + '</span>'));
      sim.set('gfci', Math.ceil(p.N / 3) + ' (un tercio de los estudiantes)');
      sim.set('agua', grupos + ' (una por grupo) + 1 con ducha de emergencia');
    });
  });

  EM.defineSim('luminarias', function (sim) {
    const cv = sim.canvas({ aspect: 1.4 });
    sim.group('Local');
    sim.slider('L', { label: 'Largo', min: 4, max: 16, step: 0.1, value: 9, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('W', { label: 'Ancho', min: 4, max: 12, step: 0.1, value: 8, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('H', { label: 'Altura de las luminarias sobre el piso', min: 2.4, max: 4.5, step: 0.1, value: 3.0, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.group('Luminaria y criterio');
    sim.select('phi', { label: 'Luminaria', options: [[3600, 'Panel LED 60 × 60 cm, 36 W, 3600 lm'], [4400, 'Panel LED 60 × 60 cm, 40 W, 4400 lm'], [2000, 'Tubo LED T8 de 120 cm, 18 W, 2000 lm'], [4000, 'Regleta con dos tubos LED, 36 W, 4000 lm']], value: 3600 });
    sim.slider('CU', { label: 'Coeficiente de utilización C<sub>U</sub>', min: 0.35, max: 0.85, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.slider('FM', { label: 'Factor de mantenimiento F<sub>M</sub>', min: 0.6, max: 0.9, step: 0.01, value: 0.8, fmt: (v) => EM.fix(v, 2) });
    sim.slider('E', { label: 'Iluminancia media requerida', min: 300, max: 750, step: 50, value: 500, unit: 'lx', fmt: (v) => v.toFixed(0) });
    sim.out('K', 'Índice del local K');
    sim.out('N', 'Luminarias necesarias', { hl: true });
    sim.out('Er', 'Iluminancia con la disposición propuesta');
    sim.out('P', 'Potencia instalada');
    const WATT = { 3600: 36, 4400: 40, 2000: 18, 4000: 36 };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const A = p.L * p.W, hm = p.H - 0.85;
      const K = MO.indiceLocal(p.L, p.W, hm), N = MO.luminarias(p.E, A, +p.phi, p.CU, p.FM);
      let nx = Math.max(1, Math.round(Math.sqrt((N * p.L) / p.W))), ny = Math.ceil(N / nx);
      while (nx * ny < N) ny++;
      const Nt = nx * ny, Er = (Nt * p.phi * p.CU * p.FM) / A;
      const pad = 30, sc = Math.min((cv.w - 2 * pad) / p.L, (cv.h - 2 * pad) / p.W), ox = (cv.w - p.L * sc) / 2, oy = (cv.h - p.W * sc) / 2;
      ctx.save(); ctx.fillStyle = EM.col('--surface-2'); ctx.fillRect(ox, oy, p.L * sc, p.W * sc); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.5; ctx.strokeRect(ox, oy, p.L * sc, p.W * sc); ctx.restore();
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const cx = ox + ((i + 0.5) * p.L * sc) / nx, cy = oy + ((j + 0.5) * p.W * sc) / ny;
        const s = (+p.phi === 2000 ? [1.2, 0.08] : +p.phi === 4000 ? [1.2, 0.2] : [0.6, 0.6]).map((v) => v * sc);
        ctx.save(); ctx.shadowColor = 'rgba(255,214,90,0.9)'; ctx.shadowBlur = 14; D.rect(ctx, cx - s[0] / 2, cy - s[1] / 2, s[0], s[1], { fill: '#FFE9A8', stroke: '--ink-3' }); ctx.restore();
      }
      D.label(ctx, nx + ' × ' + ny + ' luminarias', ox, oy - 8, { size: 11.5 });
      sim.set('K', EM.fix(K, 2) + ' (h<sub>m</sub> = ' + EM.fix(hm, 2) + ' m)');
      sim.set('N', N + ' → disposición ' + nx + ' × ' + ny + ' = ' + Nt);
      sim.set('Er', EM.fix(Er, 0) + ' lx ' + (Er >= 500 ? '<span class="chip ok">≥ 500 lx</span>' : '<span class="chip bad">&lt; 500 lx</span>'));
      sim.set('P', Nt * WATT[p.phi] + ' W (' + EM.fix((Nt * WATT[p.phi]) / A, 1) + ' W/m²)');
    });
  });
})();
