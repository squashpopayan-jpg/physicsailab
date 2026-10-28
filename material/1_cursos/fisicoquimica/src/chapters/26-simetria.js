/* Capítulo 26 — Simetría molecular y grupos puntuales */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, Y = FQ.sym;
  const SUB = { H2O: 'C2v', CH2O: 'C2v', NH3: 'C3v', CH4: 'Td', C2H4: 'D2h', BF3: 'D3h', CO2: 'D2h' };
  const COL = { H: '--ink-3', C: '--ink', N: '--c1', O: '--c2', B: '--c4', F: '--c3' }, RAD = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, B: 0.84, F: 0.57 };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cache = {};
  const info = (k) => { if (!cache[k]) { const m = Y.MOLS[k], pg = Y.pointGroup(m.atoms), r = Y.reduce(SUB[k], m.atoms, pg.ops, !!m.linear); cache[k] = { m, pg, r }; } return cache[k]; };

  /* 26.1 Elementos de simetría y grupo puntual */
  EM.defineSim('simetria', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Molécula', options: Object.entries(Y.MOLS).map(([k, v]) => [k, v.nm]), value: 'NH3' });
    sim.slider('ax', { label: 'Giro alrededor de x', min: -90, max: 90, step: 1, value: 25, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('ay', { label: 'Giro alrededor de y', min: -90, max: 90, step: 1, value: 20, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('el', { label: 'Mostrar ejes y planos de simetría', value: true });
    sim.out('g', 'Grupo puntual · orden (número de operaciones)', { hl: true });
    sim.out('ops', 'Operaciones por tipo');
    sim.out('f', 'Propiedades que se deducen: ¿polar? ¿quiral? ¿centrosimétrica?');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, { m, pg } = info(p.m), ax = (p.ax * Math.PI) / 180, ay = (p.ay * Math.PI) / 180;
      EM.draw.clear(cv);
      const R = (v) => { let [x, y, z] = v; let y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax); let x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay); return [x2, y1, z2]; };
      const sc = Math.min(W * 0.36, H * 0.38) / 1.8, cx = W * 0.3, cy = H * 0.5, P = (v) => { const r = R(v); return [cx + r[0] * sc, cy - r[1] * sc, r[2]]; };
      /* planos y ejes */
      if (p.el) {
        const planes = []; pg.ops.filter((o) => o.type === 'σ').forEach((o) => { if (!planes.some((q) => Math.abs(Math.abs(dot(q, o.axis)) - 1) < 1e-6)) planes.push(o.axis); });
        planes.slice(0, 9).forEach((n) => { const a = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], u = a.map((x, i) => x - dot(a, n) * n[i]), nu = Math.hypot(...u), uu = u.map((x) => x / nu), w = [n[1] * uu[2] - n[2] * uu[1], n[2] * uu[0] - n[0] * uu[2], n[0] * uu[1] - n[1] * uu[0]], s = 1.7; const pts = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a1, b1]) => P(uu.map((x, i) => s * (a1 * x + b1 * w[i])))); ctx.fillStyle = EM.alpha('--c1', 0.07); ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill(); });
        const axes = []; pg.ops.filter((o) => o.type === 'C').forEach((o) => { let a = axes.find((q) => Math.abs(Math.abs(dot(q.axis, o.axis)) - 1) < 1e-6); if (!a) axes.push((a = { axis: o.axis, n: 1 })); a.n = Math.max(a.n, o.order); });
        axes.slice(0, 12).forEach((a) => { const e1 = P(a.axis.map((x) => x * 1.9)), e2 = P(a.axis.map((x) => -x * 1.9)); ctx.strokeStyle = EM.col(a.n > 2 ? '--accent' : '--c3'); ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); ctx.setLineDash([]); EM.text(ctx, 'C' + a.n, e1[0] + 4, e1[1] - 4, { size: 10, color: a.n > 2 ? '--accent' : '--c3' }); });
      }
      /* enlaces y átomos (ordenados por profundidad) */
      const at = m.atoms.map((a) => ({ a, q: P(a.xyz) }));
      m.atoms.forEach((a, i) => m.atoms.forEach((b, j) => { if (j <= i) return; const d = Math.hypot(a.xyz[0] - b.xyz[0], a.xyz[1] - b.xyz[1], a.xyz[2] - b.xyz[2]); if (d < 1.28 * (RAD[a.el] + RAD[b.el]) + 0.05 && d > 0.1 && !(m.linear && a.el === 'O' && b.el === 'O')) { ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(at[i].q[0], at[i].q[1]); ctx.lineTo(at[j].q[0], at[j].q[1]); ctx.stroke(); } }));
      at.slice().sort((u, v) => u.q[2] - v.q[2]).forEach(({ a, q }) => { ctx.fillStyle = EM.col(COL[a.el] || '--ink'); ctx.beginPath(); ctx.arc(q[0], q[1], 5 + 14 * RAD[a.el], 0, 2 * Math.PI); ctx.fill(); EM.text(ctx, a.el, q[0], q[1] + 4, { size: 11, align: 'center', color: a.el === 'H' ? '--ink' : '#fff' }); });
      /* tabla de operaciones por tipo */
      const cnt = {}; pg.ops.forEach((o) => { const key = o.type === 'C' ? 'C' + o.order : o.type === 'S' ? 'S' + o.order : o.type; cnt[key] = (cnt[key] || 0) + 1; });
      const rows = Object.entries(cnt), x0 = W * 0.62; EM.text(ctx, 'Tipo de operación (con potencias)', x0, 26, { size: 12, color: '--ink-3' });
      rows.forEach(([k, v], i) => { EM.text(ctx, k, x0, 52 + i * 22, { size: 13 }); ctx.fillStyle = EM.alpha('--c1', 0.6); ctx.fillRect(x0 + 50, 40 + i * 22, v * 10, 14); EM.text(ctx, String(v), x0 + 56 + v * 10, 52 + i * 22, { size: 11, color: '--ink-3' }); });
      const hasI = pg.ops.some((o) => o.type === 'i'), hasS = pg.ops.some((o) => o.type === 'S' || o.type === 'σ' || o.type === 'i'), cn = pg.ops.filter((o) => o.type === 'C').length, polar = !hasI && !['Td', 'Oh', 'Ih'].includes(pg.name) && !/^D/.test(pg.name) && !/^T|^O|^I/.test(pg.name);
      const polarGroups = ['C1', 'Cs', 'Cn', 'C2v', 'C3v', 'C4v', 'C5v', 'C6v', 'C∞v', 'C2', 'C3'];
      sim.set('g', pg.name + ' · ' + pg.ops.length);
      sim.set('ops', rows.map(([k, v]) => k + '×' + v).join(', '));
      sim.set('f', (polarGroups.includes(pg.name) ? 'con momento dipolar permanente (grupo ' + pg.name + ')' : 'sin dipolo permanente') + ' · ' + (hasS ? 'aquiral (tiene σ, i o Sₙ)' : 'quiral') + ' · ' + (hasI ? 'con centro de inversión (reglas g/u)' : 'sin centro de inversión'));
    });
  });

  /* 26.2 Tablas de caracteres y modos de vibración */
  EM.defineSim('vibsim', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Molécula', options: Object.entries(Y.MOLS).map(([k, v]) => [k, v.nm]), value: 'H2O' });
    sim.out('t', 'Γ<sub>vib</sub> = Γ<sub>cart</sub> − Γ<sub>trans</sub> − Γ<sub>rot</sub>', { hl: true });
    sim.out('ir', 'Modos activos en el infrarrojo (transforman como <i>x</i>, <i>y</i> o <i>z</i>) · en Raman (como productos <i>xy</i>, <i>x</i>², ...)');
    sim.out('n', 'Nº de modos 3<i>N</i> − 6 (o 3<i>N</i> − 5) · nº de frecuencias distintas · bandas IR esperadas');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, { m, pg, r } = info(p.m), tab = Y.TABLES[SUB[p.m]], N = m.atoms.length;
      EM.draw.clear(cv);
      const heads = ['Γ'].concat(tab.cls, ['IR', 'Raman', 'Γcart', 'Γtrans', 'Γrot', 'Γvib']), nc = heads.length, cw = Math.min(70, (W - 20) / nc), x0 = 10, y0 = 30, rh = 26;
      heads.forEach((h, j) => EM.text(ctx, h, x0 + j * cw + cw / 2, y0, { size: 12, align: 'center', color: '--ink-3' }));
      ctx.strokeStyle = EM.col('--axis'); ctx.beginPath(); ctx.moveTo(x0, y0 + 8); ctx.lineTo(x0 + nc * cw, y0 + 8); ctx.stroke();
      tab.rows.forEach((row, i) => { const y = y0 + 8 + (i + 1) * rh, act = r.vib[i] > 0; if (act) { ctx.fillStyle = EM.alpha('--c1', 0.1); ctx.fillRect(x0, y - rh + 6, nc * cw, rh); }
        EM.text(ctx, row[0], x0 + cw / 2, y, { size: 13, align: 'center', color: act ? '--ink' : '--ink-2' }); row[1].forEach((c, j) => EM.text(ctx, String(c), x0 + (j + 1) * cw + cw / 2, y, { size: 13, align: 'center' }));
        const base = tab.cls.length + 1; EM.text(ctx, row[2] ? '●' : '', x0 + base * cw + cw / 2, y, { size: 13, align: 'center', color: '--c1' }); EM.text(ctx, row[3] ? '●' : '', x0 + (base + 1) * cw + cw / 2, y, { size: 13, align: 'center', color: '--c2' });
        [r.cart, r.trans, r.rot, r.vib].forEach((v, j) => EM.text(ctx, v[i] ? String(v[i]) : '·', x0 + (base + 2 + j) * cw + cw / 2, y, { size: 13, align: 'center', color: j === 3 && v[i] ? '--accent' : '--ink' })); });
      const irs = r.names.filter((n, i) => r.vib[i] > 0 && r.ir[i]), ram = r.names.filter((n, i) => r.vib[i] > 0 && r.raman[i]), nf = r.vib.filter((v) => v > 0).reduce((a, v) => a + v, 0), nir = r.vib.reduce((a, v, i) => a + (r.ir[i] ? v : 0), 0);
      sim.set('t', Y.formula(r.names, r.vib) + (m.linear ? '  (D∞h: Σg⁺ + Σu⁺ + Πu)' : ''));
      sim.set('ir', (irs.join(', ') || 'ninguno') + ' · ' + (ram.join(', ') || 'ninguno') + (pg.ops.some((o) => o.type === 'i') ? '  (centrosimétrica: exclusión mutua)' : ''));
      sim.set('n', (3 * N - (m.linear ? 5 : 6)) + ' · ' + nf + ' · ' + nir);
    });
  });
})();
