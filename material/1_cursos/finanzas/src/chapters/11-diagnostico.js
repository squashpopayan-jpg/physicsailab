/* Capítulo 11 — Diagnóstico financiero personal */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L;

  /* Cifras del hogar de ejemplo (compartidas por las tres simulaciones) */
  const EJ = { liq: 5e6, cdt: 0, fon: 0, pen: 20e6, inm: 0, viv: 280e6, veh: 55e6, otr: 0, tar: 6e6, pveh: 38e6, hip: 170e6, potr: 0 };
  const CAMPOS = [
    ['Activos líquidos', '--c3', [['liq', 'Efectivo y cuentas de ahorro'], ['cdt', 'CDT y fondos a la vista']]],
    ['Activos de inversión', '--c1', [['fon', 'Fondos, acciones, otros'], ['pen', 'Cesantías y pensiones voluntarias'], ['inm', 'Inmuebles para renta']]],
    ['Activos de uso', '--c6', [['viv', 'Vivienda propia'], ['veh', 'Vehículos'], ['otr', 'Otros bienes']]],
    ['Pasivos', '--c2', [['tar', 'Tarjetas y créditos de consumo'], ['pveh', 'Crédito de vehículo'], ['hip', 'Hipoteca o leasing'], ['potr', 'Libranzas y otras deudas']]]
  ];

  /* 11.1 Balance personal */
  CC.defineSim('balance', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.3, label: 'Balance: activos frente a pasivos y patrimonio' });
    const saved = CC.store.get('balance', null) || EJ;
    CAMPOS.forEach(([g, , items]) => { sim.group(g); items.forEach(([id, lab]) => sim.num(id, { label: lab, value: saved[id] ?? 0, min: 0, money: true })); });
    sim.group('');
    sim.button('Volver al ejemplo', () => { Object.keys(EJ).forEach((k) => sim.ctl[k].set(EJ[k], true)); sim.changed('liq'); }, { id: 'ej' });
    sim.out('a', 'Total de activos');
    sim.out('p', 'Total de pasivos');
    sim.out('w', 'Patrimonio', { hl: true });
    sim.out('l', 'Parte líquida de los activos');
    sim.out('e', 'Endeudamiento (pasivos / activos)');
    sim.onChange = () => { const o = {}; Object.keys(EJ).forEach((k) => { o[k] = sim.p[k]; }); CC.store.set('balance', o); };
    sim.onDraw(() => {
      const g = CAMPOS.map(([nm, col, items]) => ({ nm, col, v: items.reduce((s, [id]) => s + (sim.p[id] || 0), 0) }));
      const A = g[0].v + g[1].v + g[2].v, P = g[3].v, W = A - P;
      CC.draw.clear(cv);
      const ctx = cv.ctx, top = 34, bot = cv.h - 30, H = bot - top, M = Math.max(A, P, 1);
      const bw = Math.min(150, cv.w * 0.2), xa = Math.max(20, cv.w * 0.42 - bw - 24), xp = xa + bw + 48;
      const tc = CC.isDark() ? '#0B1230' : '#FFFFFF';
      const seg = (x, y, h, col, label, v) => {
        if (h <= 0.5) return;
        ctx.fillStyle = CC.col(col); ctx.globalAlpha = 0.82; ctx.fillRect(x, y, bw, h); ctx.globalAlpha = 1;
        if (h > 26) {
          CC.text(ctx, label, x + bw / 2, y + h / 2 - 6, { size: 12, align: 'center', color: tc, weight: 700 });
          CC.text(ctx, CC.copS(v), x + bw / 2, y + h / 2 + 10, { size: 11.5, align: 'center', color: tc, mono: true });
        }
      };
      let y = top + H * (1 - A / M);
      [g[2], g[1], g[0]].forEach((s) => { const h = (H * s.v) / M; seg(xa, y, h, s.col, s.nm.replace('Activos ', ''), s.v); y += h; });
      y = top + H * (1 - Math.max(A, P) / M);
      if (W > 0) { const h = (H * W) / M; seg(xp, y, h, '--gold', 'patrimonio', W); y += h; }
      seg(xp, y, (H * P) / M, '--c2', 'pasivos', P);
      if (W < 0) {
        CC.text(ctx, `patrimonio negativo ${CC.copS(W)}`, xp + bw / 2, top + H * (1 - P / M) - 8, { size: 12.5, align: 'center', color: '--loss', weight: 700 });
      }
      /* leyenda con todos los grupos, incluso los que no caben en la barra */
      const lx = Math.min(cv.w - 190, xp + bw + 34);
      [[g[0].nm, g[0].col, g[0].v], [g[1].nm, g[1].col, g[1].v], [g[2].nm, g[2].col, g[2].v], ['Pasivos', '--c2', P], ['Patrimonio', '--gold', W]].forEach(([nm, col, v], k) => {
        const yy = top + 8 + k * 34;
        ctx.fillStyle = CC.col(col); ctx.fillRect(lx, yy - 9, 12, 12);
        CC.text(ctx, nm, lx + 18, yy + 1, { size: 12, color: '--ink', weight: 600 });
        CC.text(ctx, CC.copS(v), lx + 18, yy + 16, { size: 11.5, color: '--ink-3', mono: true });
      });
      CC.text(ctx, 'Lo que tiene', xa + bw / 2, top - 12, { size: 13, align: 'center', weight: 700 });
      CC.text(ctx, 'Cómo se financia', xp + bw / 2, top - 12, { size: 13, align: 'center', weight: 700 });
      ctx.strokeStyle = CC.col('--axis'); ctx.beginPath(); ctx.moveTo(xa - 20, bot + 0.5); ctx.lineTo(xp + bw + 20, bot + 0.5); ctx.stroke();
      sim.set('a', CC.copS(A));
      sim.set('p', CC.copS(P));
      sim.set('w', `<span class="${W >= 0 ? 'gain' : 'loss'}">${CC.copS(W)}</span>`);
      sim.set('l', A > 0 ? CC.pct(g[0].v / A) : '—');
      sim.set('e', A > 0 ? CC.pct(P / A, 0) : '—');
    });
  });

  /* 11.2 Tablero de indicadores */
  const NIV = (v, ok, mid, mayorMejor) => (mayorMejor ? (v >= ok ? 'ok' : v >= mid ? 'mid' : 'bad') : (v <= ok ? 'ok' : v <= mid ? 'mid' : 'bad'));
  CC.defineSim('indicadores', function (sim) {
    const cv = sim.canvas({ aspect: 1.75, label: 'Indicadores con zonas de referencia' });
    sim.group('Flujo mensual');
    sim.num('ing', { label: 'Ingreso neto mensual', value: 6500000, min: 0, money: true });
    sim.num('gas', { label: 'Gastos de vida (sin cuotas)', value: 4300000, min: 0, money: true });
    sim.num('cuo', { label: 'Cuotas de deudas', value: 1600000, min: 0, money: true });
    sim.group('Balance');
    sim.num('liq', { label: 'Activos líquidos', value: 5000000, min: 0, money: true });
    sim.num('cara', { label: 'Saldo de deuda cara (tarjetas, consumo)', value: 6000000, min: 0, money: true });
    sim.num('act', { label: 'Activos totales', value: 360000000, min: 0, money: true });
    sim.num('pas', { label: 'Pasivos totales', value: 214000000, min: 0, money: true });
    sim.out('s', 'Tasa de ahorro');
    sim.out('c', 'Carga de la deuda');
    sim.out('m', 'Colchón de liquidez');
    sim.out('e', 'Endeudamiento');
    sim.out('d', 'Deuda cara');
    sim.out('pri', 'Primera prioridad', { wide: true, hl: true });
    sim.onDraw(() => {
      const p = sim.p, ah = p.ing - p.gas - p.cuo;
      const I = [
        { n: 'Tasa de ahorro', v: p.ing > 0 ? ah / p.ing : 0, lo: -0.1, hi: 0.4, ok: 0.15, mid: 0.05, up: true, f: (v) => CC.pct(v) },
        { n: 'Carga de la deuda', v: p.ing > 0 ? p.cuo / p.ing : 0, lo: 0, hi: 0.6, ok: 0.3, mid: 0.4, up: false, f: (v) => CC.pct(v) },
        { n: 'Colchón (meses)', v: p.gas + p.cuo > 0 ? p.liq / (p.gas + p.cuo) : 0, lo: 0, hi: 8, ok: 3, mid: 1, up: true, f: (v) => CC.nf(v, 1) + ' meses' },
        { n: 'Endeudamiento', v: p.act > 0 ? p.pas / p.act : 0, lo: 0, hi: 1, ok: 0.4, mid: 0.6, up: false, f: (v) => CC.pct(v, 0) },
        { n: 'Deuda cara (meses de ingreso)', v: p.ing > 0 ? p.cara / p.ing : 0, lo: 0, hi: 4, ok: 0, mid: 1, up: false, f: (v) => CC.nf(v, 1) + ' meses' }
      ];
      CC.draw.clear(cv);
      const ctx = cv.ctx, x0 = Math.min(230, cv.w * 0.36), x1 = cv.w - 30, rh = (cv.h - 20) / I.length;
      I.forEach((it, k) => {
        const yc = 16 + rh * (k + 0.5), X = (v) => x0 + ((Math.min(it.hi, Math.max(it.lo, v)) - it.lo) / (it.hi - it.lo)) * (x1 - x0);
        const zones = it.up ? [[it.lo, it.mid, '--loss'], [it.mid, it.ok, '--gold'], [it.ok, it.hi, '--gain']] : [[it.lo, it.ok, '--gain'], [it.ok, it.mid, '--gold'], [it.mid, it.hi, '--loss']];
        zones.forEach(([a, b, col]) => { ctx.fillStyle = CC.alpha(col, 0.28); ctx.fillRect(X(a), yc - 9, Math.max(0, X(b) - X(a)), 18); });
        if (!it.up && it.ok === it.lo) { ctx.fillStyle = CC.alpha('--gain', 0.6); ctx.fillRect(X(it.lo), yc - 9, 4, 18); }
        const nv = NIV(it.v, it.ok, it.mid, it.up);
        ctx.beginPath(); ctx.moveTo(X(it.v), yc - 13); ctx.lineTo(X(it.v) - 6, yc - 22); ctx.lineTo(X(it.v) + 6, yc - 22); ctx.closePath();
        ctx.fillStyle = CC.col('--ink'); ctx.fill();
        ctx.fillStyle = CC.col('--ink'); ctx.fillRect(X(it.v) - 1.5, yc - 13, 3, 26);
        CC.text(ctx, it.n, x0 - 12, yc - 4, { size: 13, align: 'right', weight: 650 });
        CC.text(ctx, it.f(it.v), x0 - 12, yc + 12, { size: 12, align: 'right', mono: true, color: nv === 'ok' ? '--gain' : nv === 'mid' ? '--law-ink' : '--loss' });
      });
      const ids = ['s', 'c', 'm', 'e', 'd'];
      I.forEach((it, k) => { const nv = NIV(it.v, it.ok, it.mid, it.up); sim.set(ids[k], CC.chip(it.f(it.v), nv)); });
      const lv = I.map((it) => NIV(it.v, it.ok, it.mid, it.up));
      let pri;
      if (ah < 0) pri = 'Gasta más de lo que gana: antes que nada, cerrar la brecha (capítulo 12).';
      else if (lv[4] === 'bad' || (lv[4] === 'mid' && lv[2] !== 'bad')) pri = 'Pagar la deuda cara con todo el ahorro disponible, manteniendo un mínimo de liquidez (capítulo 14).';
      else if (lv[2] === 'bad') pri = 'Construir un colchón de al menos un mes y luego llegar a tres (capítulo 13).';
      else if (lv[1] === 'bad') pri = 'Reducir la carga de cuotas: no tomar deudas nuevas y evaluar refinanciar (capítulo 14).';
      else if (lv[0] !== 'ok') pri = 'Subir la tasa de ahorro con ahorro automático (capítulos 5 y 12).';
      else if (lv[2] === 'mid') pri = 'Completar el colchón de tres meses.';
      else pri = 'La base está sana: es momento de metas de largo plazo e inversión (partes IV y V).';
      sim.set('pri', pri);
    });
  });

  /* 11.3 Fórmula de Stanley y Danko */
  CC.defineSim('millonario', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, label: 'Patrimonio frente al esperado según Stanley y Danko' });
    sim.group('Datos');
    sim.slider('edad', { label: 'Edad', min: 25, max: 75, step: 1, value: 42, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('ing', { label: 'Ingreso anual bruto del hogar', min: 10e6, max: 600e6, step: 1e6, value: 90e6, fmt: CC.copS });
    sim.slider('w', { label: 'Patrimonio actual', min: -50e6, max: 3000e6, step: 1e6, value: 146e6, fmt: CC.copS });
    sim.out('esp', 'Patrimonio esperado', { hl: true });
    sim.out('r', 'Patrimonio / esperado');
    sim.out('cl', 'Clasificación');
    sim.onDraw(() => {
      const esp = (sim.p.edad * sim.p.ing) / 10, r = sim.p.w / esp;
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 10, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'patrimonio / patrimonio esperado (escala logarítmica)', mb: 40, ml: 20, xfmt: (v) => CC.nf(v, v < 1 ? 1 : 0) + '×' });
      pl.frame();
      pl.band(0.1, 0.5, { color: '--loss', alpha: 0.14 });
      pl.band(0.5, 2, { color: '--gold', alpha: 0.14 });
      pl.band(2, 10, { color: '--gain', alpha: 0.14 });
      pl.label(0.22, 0.85, 'acumulador insuficiente', { align: 'center', color: '--loss', weight: 700 });
      pl.label(1, 0.85, 'promedio', { align: 'center', color: '--law-ink', weight: 700 });
      pl.label(4.5, 0.85, 'acumulador prodigioso', { align: 'center', color: '--gain', weight: 700 });
      const x = Math.max(0.1, Math.min(10, r));
      pl.vline(x, { color: '--ink', dash: [], width: 2.4 });
      pl.dot(x, 0.45, { color: '--accent', r: 7, label: r > 0 ? CC.nf(r, 2) + '×' : 'negativo', noclip: true });
      sim.set('esp', CC.copS(esp));
      sim.set('r', r > 0 ? CC.nf(r, 2) + ' veces' : '<span class="loss">patrimonio negativo</span>');
      sim.set('cl', r >= 2 ? CC.chip('prodigioso', 'ok') : r > 0.5 ? CC.chip('promedio', 'mid') : CC.chip('insuficiente', 'bad'));
    });
  });
})();
