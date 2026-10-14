/* Capítulo 16 — Aleaciones metálicas y fabricación */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     16.1 Designaciones
     ====================================================================== */
  const AISI = {
    10: ['Acero al carbono simple', 'Mn ≤ 1.0', 'estructuras, ejes, piezas de uso general'],
    11: ['Al carbono resulfurado', 'S 0.08–0.33', 'piezas de maquinado automático'],
    13: ['Al manganeso', 'Mn 1.75', 'ejes, pernos de alta resistencia'],
    40: ['Al molibdeno', 'Mo 0.20–0.25', 'engranajes, resortes'],
    41: ['Al cromo-molibdeno', 'Cr 0.5–0.95, Mo 0.12–0.30', 'ejes, cigüeñales, tubería de alta presión'],
    43: ['Al níquel-cromo-molibdeno', 'Ni 1.83, Cr 0.5–0.8, Mo 0.25', 'trenes de aterrizaje, piezas críticas de gran sección'],
    46: ['Al níquel-molibdeno', 'Ni 0.85–1.83, Mo 0.20–0.25', 'engranajes carburizados'],
    51: ['Al cromo', 'Cr 0.7–1.1', 'resortes, engranajes'],
    52: ['Al cromo (alto C)', 'Cr 1.45 (con 1.0 C: 52100)', 'rodamientos'],
    61: ['Al cromo-vanadio', 'Cr 0.6–0.95, V 0.10–0.15', 'resortes, herramientas manuales'],
    86: ['Al níquel-cromo-molibdeno', 'Ni 0.55, Cr 0.50, Mo 0.20', 'engranajes carburizados, piezas automotrices'],
    92: ['Al silicio', 'Si 1.4–2.0', 'resortes de ballesta']
  };
  const ALS = { 1: ['≥ 99 % Al', 'no tratable térmicamente', 'conductores, química, envases'], 2: ['Cobre', 'tratable térmicamente', 'aeronáutica (2024), remaches (2017)'], 3: ['Manganeso', 'no tratable', 'latas de bebida (3004), utensilios'], 4: ['Silicio', 'parcialmente', 'aporte de soldadura, pistones'], 5: ['Magnesio', 'no tratable (endurece por deformación)', 'naval, tanques (5083), carrocerías'], 6: ['Magnesio y silicio', 'tratable térmicamente', 'perfiles extruidos, estructuras (6061, 6063)'], 7: ['Zinc (con Mg, Cu)', 'tratable térmicamente', 'aeronáutica de máxima resistencia (7075)'], 8: ['Otros (Li, Fe)', 'según aleación', 'Al–Li aeronáutico (8090), papel de aluminio'] };
  const TEMPER = { F: 'en bruto de fabricación', O: 'recocido (máxima ductilidad)', H14: 'endurecido por deformación, medio duro', H18: 'endurecido por deformación, duro', T3: 'solubilizado, trabajado en frío y envejecido naturalmente', T4: 'solubilizado y envejecido naturalmente', T6: 'solubilizado y envejecido artificialmente (máxima resistencia)', T7: 'solubilizado y sobreenvejecido (estabilidad, resistencia a la corrosión bajo tensión)', T651: 'T6 con alivio de tensiones por estirado' };
  EM.defineSim('alloy-designation', function (sim) {
    const cv = sim.canvas({ aspect: 3.0 });
    sim.seg('sys', { label: 'Sistema', options: [['aisi', 'Acero AISI/SAE'], ['al', 'Aluminio (AA)']], value: 'aisi' });
    sim.select('fam', { label: 'Dos primeros dígitos', options: Object.keys(AISI).map((k) => [k, k + 'xx']), value: '41' });
    sim.slider('c', { label: 'Dos últimos dígitos (C en centésimas)', min: 5, max: 100, step: 5, value: 40, fmt: (v) => String(v).padStart(2, '0') });
    sim.select('ser', { label: 'Serie', options: Object.keys(ALS).map((k) => [k, k + 'xxx']), value: '6' });
    sim.select('tmp', { label: 'Temple', options: Object.keys(TEMPER).map((k) => [k, k]), value: 'T6' });
    sim.out('name', 'Designación', { hl: true });
    sim.out('comp', 'Composición');
    sim.out('ht', 'Tratamiento / clase');
    sim.out('use', 'Usos típicos');
    const vis = () => { const a = sim.p.sys === 'aisi'; ['fam', 'c'].forEach((k) => sim.ctl[k].show(a)); ['ser', 'tmp'].forEach((k) => sim.ctl[k].show(!a)); };
    sim.onChange = vis; vis();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      let name, comp, ht, use;
      if (p.sys === 'aisi') {
        const f = AISI[p.fam], cc = String(Math.round(p.c)).padStart(2, '0');
        name = p.fam + cc; comp = (p.c / 100).toFixed(2) + ' % C · ' + f[1];
        const cl = p.c < 25 ? 'bajo carbono' : p.c < 60 ? 'medio carbono' : 'alto carbono';
        ht = f[0] + ', ' + cl + (p.c < 25 ? (p.fam === '10' ? ' (no templable)' : ' (típico para carburizar)') : ' (templable y revenible)');
        use = f[2];
        if (p.fam === '52' && p.c >= 95) name = '52100';
      } else {
        const s = ALS[p.ser]; name = p.ser + 'xxx-' + p.tmp; comp = 'aleante principal: ' + s[0]; ht = s[1] + ' · ' + p.tmp + ': ' + TEMPER[p.tmp]; use = s[2];
        if (s[1].startsWith('no tratable') && p.tmp.startsWith('T')) ht += ' — combinación poco habitual: esta serie no responde al envejecimiento';
      }
      /* dígitos grandes */
      EM.text(ctx, name, W / 2, H * 0.6, { size: Math.min(60, H * 0.5), weight: 800, align: 'center', color: '--accent', mono: true });
      EM.text(ctx, p.sys === 'aisi' ? 'familia · carbono' : 'serie · temple', W / 2, H - 8, { size: 11, align: 'center', color: '--ink-3' });
      sim.set('name', name); sim.set('comp', comp); sim.set('ht', ht); sim.set('use', use);
    });
  });

  /* ======================================================================
     16.2 Resistencia específica
     ====================================================================== */
  EM.defineSim('specific-strength', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('q', { label: 'Índice', options: [['s', 'σ<sub>y</sub>/ρ'], ['E', 'E/ρ'], ['abs', 'σ<sub>y</sub>']], value: 's' });
    sim.out('best', 'Mejor de la lista', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const ms = MAT.db.filter((m) => m.cls === 'metal' && m.name !== 'Plomo');
      const val = (m) => (p.q === 's' ? (m.sy / m.rho) * 1000 : p.q === 'E' ? (m.E / m.rho) * 1000 : m.sy);
      const sorted = ms.slice().sort((a, b) => val(b) - val(a));
      const mx = val(sorted[0]) * 1.12;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: mx, ymin: 0, ymax: sorted.length, xlabel: p.q === 's' ? 'σ_y/ρ (MPa·cm³/g)' : p.q === 'E' ? 'E/ρ (GPa·cm³/g)' : 'σ_y (MPa)', yticks: [], ml: 196, mb: 36 });
      pl.frame();
      sorted.forEach((m, i) => {
        const y = sorted.length - i - 0.5;
        ctx.fillStyle = EM.alpha(i === 0 ? '--accent' : '--c1', 0.75);
        ctx.fillRect(pl.X(0), pl.Y(y + 0.35), pl.X(val(m)) - pl.X(0), pl.Y(y - 0.35) - pl.Y(y + 0.35));
        EM.text(ctx, m.name, pl.X(0) - 6, pl.Y(y) + 4, { size: 11, align: 'right', color: '--ink-2' });
        EM.text(ctx, EM.fix(val(m), 0), pl.X(val(m)) + 4, pl.Y(y) + 4, { size: 10.5, color: '--ink-3', mono: true });
      });
      sim.set('best', sorted[0].name);
    });
  });

  /* ======================================================================
     16.3 Laminado
     ====================================================================== */
  EM.defineSim('rolling', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    const P = EM.TENSILE_PRESETS;
    sim.select('m', { label: 'Material (recocido)', options: ['cu', 'low', 'ss304', 'brass', 'al2024'].map((k) => [k, P[k][0]]), value: 'cu' });
    sim.slider('w', { label: 'Ancho <i>w</i>', min: 50, max: 2000, step: 10, value: 300, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('h0', { label: 'Espesor inicial <i>h</i><sub>0</sub>', min: 2, max: 60, step: 0.5, value: 25, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('red', { label: 'Reducción por pasada', min: 2, max: 40, step: 1, value: 20, unit: '%', fmt: (v) => v.toFixed(0) });
    sim.slider('R', { label: 'Radio de los rodillos <i>R</i>', min: 25, max: 600, step: 5, value: 250, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('np', { label: 'Pasadas sin recocer', min: 1, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('F', 'Fuerza en la última pasada', { hl: true });
    sim.out('L', 'Longitud de contacto √(<i>R</i>Δ<i>h</i>)');
    sim.out('k', 'Esfuerzo de fluencia medio de la pasada');
    sim.out('tot', 'Espesor final y deformación acumulada');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, , sy, K, n] = P[p.m];
      let h = p.h0, e0 = 0, F = 0, L = 0, kb = 0;
      const forces = [];
      for (let i = 0; i < p.np; i++) {
        const hf = h * (1 - p.red / 100), de = Math.log(h / hf), e1 = e0 + de;
        /* media de σ = max(σy, Kε^n) entre e0 y e1 */
        kb = MAT.integrate((e) => Math.max(sy, K * Math.pow(Math.max(e, 1e-9), n)), e0, e1, 200) / de;
        L = Math.sqrt(p.R * (h - hf));
        F = kb * 1e6 * (p.w / 1000) * (L / 1000);
        forces.push(F);
        h = hf; e0 = e1;
      }
      /* esquema */
            const cx = W * 0.3, cy = H * 0.5;
      const Rr = Math.min(H * 0.3, W * 0.17), h0p = Math.min(H * 0.32, Rr * (p.h0 / p.R) * 2), hfp = h0p * (1 - p.red / 100); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * 0.56, H); ctx.clip();
      ctx.fillStyle = EM.alpha('--c6', 0.35); ctx.fillRect(10, cy - h0p / 2, cx - 10, h0p); ctx.fillRect(cx, cy - hfp / 2, W * 0.55 - cx, hfp);
      for (const s of [-1, 1]) { ctx.fillStyle = EM.alpha('--c1', 0.3); ctx.strokeStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(cx, cy + s * (hfp / 2 + Rr), Rr, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.restore(); EM.draw.arrow(ctx, 20, cy, 60, cy, { color: '--accent', width: 2 }); EM.text(ctx, 'espesor exagerado ×2', 14, H - 8, { size: 10.5, color: '--ink-3' });
      /* fuerzas por pasada */
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0.5, xmax: 6.5, ymin: 0, ymax: Math.max(...forces) * 1.3 / 1e6, xlabel: 'pasada', ylabel: 'fuerza (MN)', ml: 46, xticks: [1, 2, 3, 4, 5, 6] });
      pl.frame();
      forces.forEach((f, i) => { ctx.fillStyle = EM.alpha('--accent', 0.75); ctx.fillRect(pl.X(i + 0.7), pl.Y(f / 1e6), pl.X(i + 1.3) - pl.X(i + 0.7), pl.Y(0) - pl.Y(f / 1e6)); });
      sim.set('F', EM.fix(F / 1e6, 2) + ' MN');
      sim.set('L', EM.fix(L, 1) + ' mm');
      sim.set('k', EM.fix(kb, 0) + ' MPa');
      sim.set('tot', EM.fix(h, 2) + ' mm, ε = ' + EM.fix(e0, 3) + ' (TF = ' + EM.fix(100 * (1 - h / p.h0), 0) + ' %)');
    });
  });

  /* ======================================================================
     16.4 Chvorinov
     ====================================================================== */
  EM.defineSim('chvorinov', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('V', { label: 'Volumen de la pieza', min: 50, max: 20000, step: 10, value: 1000, unit: 'cm³', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('Cm', { label: 'Constante del molde <i>C<sub>m</sub></i>', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'min/cm²', fmt: (v) => EM.fix(v, 1) });
    sim.slider('ar', { label: 'Relación ancho/espesor de la placa', min: 2, max: 20, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Tiempos de solidificación', { hl: true });
    sim.out('riser', 'Mazarota cilíndrica (H = D) para el cubo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const a = Math.cbrt(p.V), mCube = a / 6;
      const r = Math.cbrt((3 * p.V) / (4 * Math.PI)), mSph = r / 3;
      const D = Math.cbrt((4 * p.V) / Math.PI), mCyl = D / 6;
      const tpl = Math.cbrt(p.V / (p.ar * p.ar)), mPl = (p.ar * p.ar * tpl ** 3) / (2 * p.ar * p.ar * tpl * tpl + 4 * p.ar * tpl * tpl);
      const shapes = [['esfera', mSph, '--c3'], ['cilindro H = D', mCyl, '--c1'], ['cubo', mCube, '--c5'], ['placa ' + p.ar + ':' + p.ar + ':1', mPl, '--c4']];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Math.max(...shapes.map((s) => s[1])) * 1.35, ymin: 0, ymax: p.Cm * Math.pow(Math.max(...shapes.map((s) => s[1])) * 1.35, 2), xlabel: 'módulo V/A (cm)', ylabel: 't_s (min)', ml: 50 });
      pl.frame();
      pl.fn((m) => p.Cm * m * m, { color: '--ink-3', width: 1.4 });
      for (const [n, m, c] of shapes) pl.dot(m, p.Cm * m * m, { color: c, r: 6, label: n });
      const Dr = 6 * 1.2 * mCube;
      sim.set('t', shapes.map(([n, m]) => n + ': ' + EM.fix(p.Cm * m * m, 1) + ' min').join(' · '));
      sim.set('riser', 'D = H = ' + EM.fix(Dr, 1) + ' cm (módulo 1.2 × ' + EM.fix(mCube, 2) + ' cm)');
    });
  });
})();
