/* Capítulo 22 — Líneas de transmisión y guías de onda */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, CK = EM.ckt;
  const { cx, cadd, cmul, cdiv, cabs, carg } = EM.complex;
  const deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const cexpj = (th) => cx(Math.cos(th), Math.sin(th));
  const fmtC = (z, d = 3) => { const e = 0.5 * Math.pow(10, -d), re = Math.abs(z.re) < e ? 0 : z.re, im = Math.abs(z.im) < e ? 0 : z.im; return EM.fix(re, d) + (im >= 0 ? ' + j' : ' − j') + EM.fix(Math.abs(im), d); };
  const posmod = (x, m) => ((x % m) + m) % m;

  /* Esquema de generador + línea + carga. fillFn(z) ∈ [−1, 1] colorea el dieléctrico (z = 0 en el generador). */
  function lineSchematic(ctx, g) {
    const { xs, x0, x1, xr, yT, yB } = g;
    /* generador */
    if (g.src === 'ac') CK.acsource(ctx, xs, yB, xs, yT, { len: 30 });
    else CK.battery(ctx, xs, yB, xs, yT, { len: 26 });
    EM.text(ctx, g.srcLabel || 'V_{g}', xs - 22, (yT + yB) / 2, { size: 12, align: 'right', baseline: 'middle', color: '--ink' });
    if (g.Rg !== false) CK.resistor(ctx, xs, yT, x0, yT, { len: Math.min(40, (x0 - xs) * 0.6), label: 'R_{g}', labelOff: 14, labelSide: -1 });
    else CK.wire(ctx, [[xs, yT], [x0, yT]]);
    CK.wire(ctx, [[xs, yB], [x0, yB]]);
    /* dieléctrico coloreado según la tensión */
    if (g.fillFn) {
      for (let px = x0; px < x1; px += 2) {
        const v = M.clamp(g.fillFn((px - x0) / (x1 - x0)), -1, 1);
        if (Math.abs(v) < 0.01) continue;
        ctx.fillStyle = EM.alpha(v > 0 ? '--pos' : '--neg', 0.7 * Math.abs(v));
        ctx.fillRect(px, yT + 3, 2.2, yB - yT - 6);
      }
    }
    ctx.save();
    ctx.strokeStyle = EM.col('--ink-2');
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x0, yT); ctx.lineTo(x1, yT); ctx.moveTo(x0, yB); ctx.lineTo(x1, yB); ctx.stroke();
    ctx.restore();
    if (g.lineLabel) EM.text(ctx, g.lineLabel, (x0 + x1) / 2, yT - 9, { size: 11.5, align: 'center', color: '--ink-2', halo: true });
    /* carga */
    if (g.load === 'oc') {
      CK.wire(ctx, [[x1, yT], [x1 + 14, yT]]); CK.wire(ctx, [[x1, yB], [x1 + 14, yB]]);
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.6; ctx.fillStyle = EM.col('--canvas');
      [[x1 + 17, yT], [x1 + 17, yB]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); ctx.stroke(); });
      ctx.restore();
      EM.text(ctx, 'abierta', x1 + 26, (yT + yB) / 2, { size: 11.5, baseline: 'middle', color: '--ink-2' });
    } else if (g.load === 'sc') {
      CK.wire(ctx, [[x1, yT], [xr, yT], [xr, yB], [x1, yB]]);
      EM.text(ctx, 'corto', xr + 8, (yT + yB) / 2, { size: 11.5, baseline: 'middle', color: '--ink-2' });
    } else {
      CK.wire(ctx, [[x1, yT], [xr, yT]]); CK.wire(ctx, [[x1, yB], [xr, yB]]);
      if (g.load === 'Z') {
        const h = Math.min(34, (yB - yT) * 0.62), ym = (yT + yB) / 2;
        CK.wire(ctx, [[xr, yT], [xr, ym - h / 2]]); CK.wire(ctx, [[xr, yB], [xr, ym + h / 2]]);
        ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.fillStyle = EM.col('--canvas');
        ctx.beginPath(); ctx.rect(xr - 9, ym - h / 2, 18, h); ctx.fill(); ctx.stroke(); ctx.restore();
      } else CK.resistor(ctx, xr, yT, xr, yB, { len: Math.min(34, (yB - yT) * 0.7) });
      EM.text(ctx, g.loadLabel || 'R_{L}', xr + 14, (yT + yB) / 2, { size: 12, baseline: 'middle', color: '--ink' });
    }
  }

  /* ======================================================================
     22.1 Escalón en una línea: diagrama de rebotes
     ====================================================================== */
  EM.defineSim('bounce-diagram', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const cb = sim.canvas({ aspect: 2.2, cls: 'fixed' });
    sim.group('Generador');
    sim.slider('Vg', { label: 'Escalón <i>V</i><sub>g</sub>', min: 1, max: 20, step: 0.5, value: 10, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('Rg', { label: 'Resistencia interna <i>R</i><sub>g</sub>', min: 0, max: 500, step: 1, value: 50, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.group('Línea y carga');
    sim.slider('Z0', { label: 'Impedancia característica <i>Z</i><sub>0</sub>', min: 25, max: 300, step: 1, value: 50, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.seg('load', { label: 'Carga', options: [['R', 'Resistencia'], ['oc', 'Abierta'], ['sc', 'Cortocircuito']], value: 'R', onInput: () => vis() });
    const sR = sim.slider('RL', { label: '<i>R</i><sub>L</sub>', min: 1, max: 5000, value: 150, log: true, step: 1, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.group('Tiempo');
    sim.slider('spd', { label: 'Velocidad de la animación', min: 0.2, max: 2, step: 0.1, value: 0.6, unit: 'T/s', fmt: (v) => EM.fix(v, 1) });
    sim.check('I', { label: 'Mostrar también la corriente (como <i>Z</i><sub>0</sub><i>i</i>)', value: false });
    sim.button('Desde t = 0', () => { t = 0; hold = 0; sim.redraw(); });
    function vis() { sR.show(sim.p.load === 'R'); }
    vis();
    sim.out('t', 'Tiempo <i>t</i>/<i>T</i>');
    sim.out('V1', 'Primera onda <i>V</i><sub>1</sub><sup>+</sup>');
    sim.out('G', '<i>Γ</i><sub>L</sub>, <i>Γ</i><sub>g</sub>');
    sim.out('VL', 'Tensión en la carga', { hl: true });
    sim.out('Vdc', 'Valor final (corriente continua)');
    const TMAX = 8;
    let t = 0, hold = 0;
    function waves(p) {
      const Z0 = p.Z0;
      const GL = p.load === 'oc' ? 1 : p.load === 'sc' ? -1 : (p.RL - Z0) / (p.RL + Z0);
      const Gg = (p.Rg - Z0) / (p.Rg + Z0);
      const V1 = (p.Vg * Z0) / (p.Rg + Z0);
      const A = [V1];
      for (let k = 1; k <= TMAX; k++) A.push(A[k - 1] * (k % 2 === 1 ? GL : Gg));
      const Vdc = p.load === 'oc' ? p.Vg : p.load === 'sc' ? 0 : (p.Vg * p.RL) / (p.Rg + p.RL);
      return { A, GL, Gg, V1, Vdc };
    }
    /* Onda k (k = 0, 1, …) sale en t = k: hacia la carga si k es par, hacia el generador si es impar */
    function Vz(A, z, tt, cur) {
      let v = 0;
      for (let k = 0; k < A.length; k++) {
        if (tt < k) break;
        const fw = k % 2 === 0, front = fw ? tt - k : 1 - (tt - k);
        if (fw ? z <= front + 1e-9 : z >= front - 1e-9) v += cur && !fw ? -A[k] : A[k];
      }
      return v;
    }
    sim.animate((dt) => {
      if (t >= TMAX) { hold += dt; if (hold > 1.5) { t = 0; hold = 0; } return; }
      t = Math.min(TMAX, t + dt * sim.p.spd);
    });
    sim.onDraw(() => {
      const p = sim.p, W = waves(p), A = W.A;
      /* rango vertical común */
      let lo = Math.min(0, W.Vdc), hi = Math.max(0, W.Vdc, p.Vg * 0.2);
      for (let i = 0; i <= 20; i++) for (let j = 0; j <= 160; j++) {
        const z = i / 20, tt = (TMAX * j) / 160;
        const v = Vz(A, z, tt, false); lo = Math.min(lo, v); hi = Math.max(hi, v);
        if (p.I) { const c = Vz(A, z, tt, true); lo = Math.min(lo, c); hi = Math.max(hi, c); }
      }
      const span = hi - lo || 1, ymin = lo - 0.12 * span, ymax = hi + 0.12 * span, vs = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
      /* ---------- esquema y V(z) ---------- */
      EM.draw.clear(cv);
      const ctx = cv.ctx, Wd = cv.w, Hh = cv.h;
      const x0 = 112, x1 = Wd - 92, yT = 30, yB = Math.min(86, Hh * 0.3);
      lineSchematic(ctx, { xs: 36, x0, x1, xr: x1 + 40, yT, yB, load: p.load, fillFn: (z) => Vz(A, z, t, false) / vs, lineLabel: 'Z₀ = ' + p.Z0 + ' Ω · tránsito T' });
      const pl = new EM.Plot(ctx, { x: 0, y: yB + 14, w: Wd, h: Hh - yB - 14, xmin: 0, xmax: 1, ymin, ymax, ml: x0, mr: Wd - x1, mt: 8, xlabel: 'posición z/ℓ (generador → carga)', ylabel: 'tensión (V)' });
      pl.frame();
      pl.hline(W.Vdc, { color: '--ink-3', dash: [4, 4], label: 'final ' + EM.fix(W.Vdc, 2) + ' V', labelRight: true });
      if (p.I) pl.fn((z) => Vz(A, z, t, true), { color: '--cur', width: 2, dash: [6, 4], n: 800 });
      pl.fn((z) => Vz(A, z, t, false), { color: '--efield', width: 2.8, n: 800 });
      const lg = [{ label: 'v(z, t)', color: '--efield' }];
      if (p.I) lg.push({ label: 'Z₀ i(z, t)', color: '--cur', dash: [6, 4] });
      pl.legend(lg, 'tl');
      /* ---------- diagrama de rebotes y tensiones en los extremos ---------- */
      EM.draw.clear(cb);
      const c2 = cb.ctx, W2 = cb.w, H2 = cb.h, half = W2 * 0.42;
      const bx0 = 46, bx1 = half - 16, by0 = 34, by1 = H2 - 18;
      const BX = (z) => bx0 + z * (bx1 - bx0), BY = (tt) => by0 + (tt / TMAX) * (by1 - by0);
      c2.save();
      c2.strokeStyle = EM.col('--ink-2'); c2.lineWidth = 2;
      c2.beginPath(); c2.moveTo(BX(0), by0); c2.lineTo(BX(0), by1); c2.moveTo(BX(1), by0); c2.lineTo(BX(1), by1); c2.stroke();
      c2.restore();
      EM.text(c2, 'generador', BX(0), by0 - 16, { size: 11, align: 'center', color: '--ink-2' });
      EM.text(c2, 'carga', BX(1), by0 - 16, { size: 11, align: 'center', color: '--ink-2' });
      for (let k = 0; k <= TMAX; k += 2) EM.text(c2, k + 'T', BX(0) - 6, BY(k) + 4, { size: 10.5, align: 'right', mono: true, color: '--ink-3' });
      EM.draw.arrow(c2, BX(0) - 30, by0 + 20, BX(0) - 30, by1 - 6, { color: '--ink-3', width: 1.2, head: 7 });
      EM.text(c2, 't', BX(0) - 36, by1 - 8, { size: 12, italic: true, align: 'right', color: '--ink-3' });
      for (let k = 0; k < A.length && k < TMAX; k++) {
        const fw = k % 2 === 0, za = fw ? 0 : 1, zb = fw ? 1 : 0;
        const done = t >= k + 1, part = t > k && !done;
        const tb = done ? k + 1 : part ? t : k;
        const zc = fw ? tb - k : 1 - (tb - k);
        const faint = Math.abs(A[k]) < 1e-3 * Math.abs(W.V1);
        c2.save();
        c2.strokeStyle = EM.col(fw ? '--c1' : '--c2');
        c2.globalAlpha = faint ? 0.25 : 0.3;
        c2.lineWidth = 1.2; c2.setLineDash([3, 3]);
        c2.beginPath(); c2.moveTo(BX(za), BY(k)); c2.lineTo(BX(zb), BY(k + 1)); c2.stroke();
        if (t > k) {
          c2.globalAlpha = 1; c2.setLineDash([]); c2.lineWidth = 2.2;
          c2.beginPath(); c2.moveTo(BX(za), BY(k)); c2.lineTo(BX(zc), BY(tb)); c2.stroke();
        }
        c2.restore();
        if (!faint) EM.text(c2, EM.fix(A[k], 2) + ' V', BX(0.5) + (fw ? 8 : -8), BY(k + 0.5) + 4, { size: 10.5, mono: true, align: fw ? 'left' : 'right', color: fw ? '--c1' : '--c2', halo: true });
      }
      c2.save(); c2.strokeStyle = EM.col('--accent'); c2.lineWidth = 1.4; c2.setLineDash([5, 4]);
      c2.beginPath(); c2.moveTo(BX(0) - 4, BY(t)); c2.lineTo(BX(1) + 4, BY(t)); c2.stroke(); c2.restore();
      const pt = new EM.Plot(c2, { x: half, y: 0, w: W2 - half, h: H2, xmin: 0, xmax: TMAX, ymin, ymax, xlabel: 't / T', ylabel: 'tensión (V)', title: 'Tensión en los extremos', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8] });
      pt.frame();
      pt.hline(W.Vdc, { color: '--ink-3', dash: [4, 4] });
      pt.fn((tt) => Vz(A, 0, tt, false), { color: '--c2', width: 2, n: 1600, to: t });
      pt.fn((tt) => Vz(A, 1, tt, false), { color: '--c1', width: 2.6, n: 1600, to: t });
      pt.vline(t, { color: '--accent', dash: [5, 4] });
      pt.legend([{ label: 'en la carga', color: '--c1' }, { label: 'en el generador', color: '--c2' }], 'br');
      /* lecturas */
      sim.set('t', EM.fix(t, 2));
      sim.set('V1', EM.fix(W.V1, 3) + ' V');
      sim.set('G', f3(W.GL) + ', ' + f3(W.Gg));
      sim.set('VL', EM.fix(Vz(A, 1, t, false), 3) + ' V');
      sim.set('Vdc', Math.abs(W.GL * W.Gg) > 0.9999 ? 'no se alcanza (|Γ_L Γ_g| = 1)' : EM.fix(W.Vdc, 3) + ' V');
    });
  });

  /* ======================================================================
     22.2 Ondas estacionarias en una línea terminada
     ====================================================================== */
  EM.defineSim('tline-standing', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const cz = sim.canvas({ aspect: 3.3, cls: 'fixed' });
    sim.group('Carga');
    sim.seg('kind', { options: [['z', '<i>R</i> + j<i>X</i>'], ['sc', 'Cortocircuito'], ['oc', 'Abierta']], value: 'z', onInput: () => vis() });
    sim.slider('Z0', { label: 'Impedancia característica <i>Z</i><sub>0</sub>', min: 25, max: 300, step: 1, value: 50, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    const sR = sim.slider('RL', { label: 'Resistencia de la carga <i>R</i><sub>L</sub>', min: 0, max: 500, step: 1, value: 100, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    const sX = sim.slider('XL', { label: 'Reactancia de la carga <i>X</i><sub>L</sub>', min: -300, max: 300, step: 1, value: 0, unit: 'Ω', fmt: (v) => EM.minus(v.toFixed(0)) });
    const setZ = (fr, fx) => () => { sim.ctl.kind.set('z', true); vis(); sim.ctl.RL.set(Math.round(fr * sim.p.Z0), true); sim.ctl.XL.set(Math.round(fx * sim.p.Z0)); };
    sim.button('Adaptada', setZ(1, 0), { newRow: true });
    sim.button('2Z₀', setZ(2, 0));
    sim.button('Z₀/2', setZ(0.5, 0));
    sim.button('Z₀(1 + j)', setZ(1, 1));
    sim.group('Línea');
    sim.slider('len', { label: 'Longitud ℓ/<i>λ</i>', min: 0.25, max: 2, step: 0.01, value: 1.25, fmt: f2 });
    sim.check('I', { label: 'Mostrar la corriente (como <i>Z</i><sub>0</sub><i>I</i>)', value: true });
    sim.check('inst', { label: 'Valores instantáneos', value: true });
    function vis() { const z = sim.p.kind === 'z'; sR.show(z); sX.show(z); }
    vis();
    sim.out('G', 'Coeficiente de reflexión <i>Γ</i><sub>L</sub>', { hl: true });
    sim.out('swr', 'ROE');
    sim.out('rl', 'Pérdidas de retorno');
    sim.out('pd', 'Potencia entregada a la carga');
    sim.out('dm', 'Primer mínimo / máximo de tensión');
    sim.out('zin', '<i>Z</i><sub>ent</sub> en el generador', { hl: true });
    sim.legend([{ color: '--efield', label: 'tensión |<i>V</i>|' }, { color: '--cur', kind: 'dash', label: 'corriente <i>Z</i><sub>0</sub>|<i>I</i>|' }, { color: '--efield', kind: 'dash', label: 'valor instantáneo' }]);
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2.4; });
    sim.onDraw(() => {
      const p = sim.p, Z0 = p.Z0, L = p.len;
      const ZL = cx(p.RL, p.XL);
      const G = p.kind === 'sc' ? cx(-1, 0) : p.kind === 'oc' ? cx(1, 0) : cdiv(cadd(ZL, cx(-Z0, 0)), cadd(ZL, cx(Z0, 0)));
      const gm = cabs(G), th = carg(G);
      const TAU = 2 * Math.PI;
      /* fasores normalizados a V0+ = 1; d en longitudes de onda desde la carga */
      const Vd = (d) => cmul(cexpj(TAU * d), cadd(cx(1, 0), cmul(G, cexpj(-2 * TAU * d))));
      const Id = (d) => cmul(cexpj(TAU * d), cadd(cx(1, 0), cmul(cx(-G.re, -G.im), cexpj(-2 * TAU * d))));
      const zin = (d) => { const g = cmul(G, cexpj(-2 * TAU * d)); const den = cadd(cx(1, 0), cx(-g.re, -g.im)); return cabs(den) < 1e-9 ? null : cdiv(cadd(cx(1, 0), g), den); };
      /* ---------- esquema + ondas ---------- */
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const x0 = 112, x1 = W - 92, yT = 28, yB = Math.min(80, H * 0.27);
      const inst = (d) => { const v = Vd(d); return v.re * Math.cos(ph) - v.im * Math.sin(ph); };
      lineSchematic(ctx, { xs: 36, x0, x1, xr: x1 + 40, yT, yB, src: 'ac', load: p.kind === 'z' ? 'Z' : p.kind, loadLabel: 'Z_{L}', fillFn: (z) => inst(L * (1 - z)) / 2, lineLabel: 'Z₀ = ' + Z0 + ' Ω · ℓ = ' + f2(L) + 'λ' });
      const pl = new EM.Plot(ctx, { x: 0, y: yB + 12, w: W, h: H - yB - 12, xmin: -L, xmax: 0, ymin: -2.2, ymax: 2.2, ml: x0, mr: W - x1, mt: 8, xlabel: 'distancia a la carga d/λ', ylabel: 'V / V₀⁺', xfmt: (v) => EM.fix(Math.abs(v), Math.abs(v) % 0.5 < 1e-6 || Math.abs(v) % 0.5 > 0.5 - 1e-6 ? 1 : 2) });
      pl.frame();
      /* máximos y mínimos */
      if (gm > 0.01) {
        const dmax = posmod(th / (2 * TAU), 0.5), dmin = posmod(th / (2 * TAU) + 0.25, 0.5);
        for (let d = dmin; d <= L + 1e-9; d += 0.5) pl.vline(-d, { color: '--ink-3', dash: [2, 3], width: 1 });
        if (dmin <= L) pl.label(-dmin, -2.05, 'V_{mín}', { align: 'center', size: 10.5, color: '--ink-2' });
        if (dmax <= L) pl.label(-dmax, -2.05, 'V_{máx}', { align: 'center', size: 10.5, color: '--ink-2' });
      }
      const env = (d) => cabs(Vd(d)), envI = (d) => cabs(Id(d));
      if (p.I) {
        pl.fn((x) => envI(-x), { color: '--cur', width: 2, dash: [6, 4], n: 700 });
        pl.fn((x) => -envI(-x), { color: '--cur', width: 2, dash: [6, 4], n: 700 });
      }
      pl.fn((x) => env(-x), { color: '--efield', width: 2.6, n: 700 });
      pl.fn((x) => -env(-x), { color: '--efield', width: 2.6, n: 700 });
      if (p.inst) {
        pl.fn((x) => inst(-x), { color: '--efield', width: 1.6, dash: [3, 3], n: 700 });
        if (p.I) pl.fn((x) => { const c = Id(-x); return c.re * Math.cos(ph) - c.im * Math.sin(ph); }, { color: '--cur', width: 1.3, dash: [2, 3], n: 700 });
      }
      /* ---------- impedancia de entrada a lo largo de la línea ---------- */
      EM.draw.clear(cz);
      const pz = new EM.Plot(cz.ctx, { x: 0, y: 0, w: cz.w, h: cz.h, xmin: -L, xmax: 0, ymin: -4, ymax: 4, ml: x0, mr: W - x1, mt: 22, title: 'Impedancia normalizada vista hacia la carga, z_{ent}(d) = Z_{ent}/Z₀', ylabel: 'z_{ent}', yticks: [-4, -2, 0, 2, 4], xfmt: (v) => EM.fix(Math.abs(v), 2) });
      pz.frame();
      pz.hline(1, { color: '--ink-3', dash: [3, 3], width: 1 });
      pz.fn((x) => { const z = zin(-x); return z ? z.re : NaN; }, { color: '--c1', width: 2.2, n: 900, breakJumps: true });
      pz.fn((x) => { const z = zin(-x); return z ? z.im : NaN; }, { color: '--c2', width: 2.2, n: 900, breakJumps: true });
      pz.legend([{ label: 'r (resistencia)', color: '--c1' }, { label: 'x (reactancia)', color: '--c2' }], 'tl');
      const zg = zin(L);
      if (zg) { pz.dot(-L, M.clamp(zg.re, -4, 4), { color: '--c1', noclip: true }); pz.dot(-L, M.clamp(zg.im, -4, 4), { color: '--c2', noclip: true }); }
      /* ---------- lecturas ---------- */
      sim.set('G', f3(gm) + ' ∠ ' + EM.fix(deg(th), 1) + '°');
      sim.set('swr', gm > 0.9999 ? '∞' : f3((1 + gm) / (1 - gm)));
      sim.set('rl', gm < 1e-6 ? '∞ (sin reflexión)' : EM.fix(-20 * Math.log10(gm), 2) + ' dB');
      sim.set('pd', EM.fix(100 * (1 - gm * gm), 1) + ' %');
      sim.set('dm', gm < 0.01 ? 'no hay (onda viajera)' : f3(posmod(th / (2 * TAU) + 0.25, 0.5)) + 'λ / ' + f3(posmod(th / (2 * TAU), 0.5)) + 'λ');
      sim.set('zin', zg ? fmtC(cmul(zg, cx(Z0, 0)), 1) + ' Ω' : '∞ (circuito abierto)');
    });
  });

  /* ======================================================================
     22.3 Carta de Smith
     ====================================================================== */
  EM.defineSim('smith-chart', function (sim) {
    const cv = sim.canvas({ aspect: 1.08 });
    sim.group('Carga');
    sim.seg('kind', { options: [['z', '<i>Z</i><sub>L</sub> = <i>R</i> + j<i>X</i>'], ['sc', 'Corto'], ['oc', 'Abierta']], value: 'z', onInput: () => vis() });
    sim.select('Z0', { label: 'Línea', options: [[50, 'Z₀ = 50 Ω (coaxial de RF)'], [75, 'Z₀ = 75 Ω (coaxial de vídeo)'], [300, 'Z₀ = 300 Ω (bifilar plana)']], value: 50 });
    const sR = sim.slider('RL', { label: '<i>R</i><sub>L</sub>', min: 0, max: 500, step: 1, value: 25, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    const sX = sim.slider('XL', { label: '<i>X</i><sub>L</sub>', min: -500, max: 500, step: 1, value: 25, unit: 'Ω', fmt: (v) => EM.minus(v.toFixed(0)) });
    const pre = (r, x) => () => { sim.ctl.kind.set('z', true); vis(); const z0 = +sim.p.Z0; sim.ctl.RL.set(Math.round(r * z0), true); sim.ctl.XL.set(Math.round(x * z0)); };
    sim.button('z = 0.5 + j0.5', pre(0.5, 0.5), { newRow: true });
    sim.button('z = 2', pre(2, 0));
    sim.button('z = 1 − j2', pre(1, -2));
    sim.button('z = j1', pre(0, 1));
    sim.group('Desplazamiento hacia el generador');
    sim.slider('d', { label: 'Distancia desde la carga <i>d</i>/<i>λ</i>', min: 0, max: 0.5, step: 0.001, value: 0.125, fmt: f3 });
    sim.button('<i>d</i> = λ/8', () => sim.ctl.d.set(0.125), { newRow: true });
    sim.button('<i>d</i> = λ/4', () => sim.ctl.d.set(0.25));
    sim.check('adm', { label: 'Mostrar las admitancias (punto opuesto)', value: false });
    function vis() { const z = sim.p.kind === 'z'; sR.show(z); sX.show(z); }
    vis();
    sim.out('zL', '<i>z</i><sub>L</sub> = <i>Z</i><sub>L</sub>/<i>Z</i><sub>0</sub>');
    sim.out('G', '<i>Γ</i><sub>L</sub>', { hl: true });
    sim.out('swr', 'ROE');
    sim.out('zin', '<i>z</i><sub>ent</sub>(<i>d</i>)', { hl: true });
    sim.out('Zin', '<i>Z</i><sub>ent</sub>(<i>d</i>)');
    sim.out('Yin', '<i>Y</i><sub>ent</sub>(<i>d</i>)');
    sim.out('dmin', 'Primer mínimo de tensión desde la carga');
    sim.legend([{ color: '--c1', kind: 'dot', label: 'carga <i>z</i><sub>L</sub>' }, { color: '--c2', kind: 'dot', label: 'entrada <i>z</i><sub>ent</sub>' }, { color: '--gold', kind: 'dash', label: 'círculo de ROE' }, { color: '--accent', label: 'giro 2<i>βd</i> hacia el generador' }]);
    sim.onDraw(() => {
      const p = sim.p, Z0 = +p.Z0;
      const zl = cx(p.RL / Z0, p.XL / Z0);
      const G = p.kind === 'sc' ? cx(-1, 0) : p.kind === 'oc' ? cx(1, 0) : cdiv(cadd(zl, cx(-1, 0)), cadd(zl, cx(1, 0)));
      const gm = cabs(G), th = carg(G), rot = 4 * Math.PI * p.d;
      const Gi = cmul(G, cexpj(-rot));
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const R = Math.min(W, H) / 2 - 46, ox = W / 2, oy = H / 2 + 6;
      const P = (g) => [ox + R * g.re, oy - R * g.im];
      /* fondo del círculo */
      ctx.save();
      ctx.fillStyle = EM.alpha('--c3', 0.05);
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, 7); ctx.fill();
      /* cuadrícula de impedancias */
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, 7); ctx.clip();
      const grid = (col, a, w) => { ctx.strokeStyle = EM.alpha(col, a); ctx.lineWidth = w; };
      [0.2, 0.5, 1, 2, 5].forEach((r) => {
        grid(r === 1 ? '--ink-2' : '--ink-3', r === 1 ? 0.7 : 0.5, r === 1 ? 1.4 : 1);
        ctx.beginPath(); ctx.arc(ox + (R * r) / (1 + r), oy, R / (1 + r), 0, 7); ctx.stroke();
      });
      [0.2, 0.5, 1, 2, 5].forEach((x) => [x, -x].forEach((xx) => {
        grid(Math.abs(xx) === 1 ? '--ink-2' : '--ink-3', Math.abs(xx) === 1 ? 0.7 : 0.5, Math.abs(xx) === 1 ? 1.4 : 1);
        ctx.beginPath(); ctx.arc(ox + R, oy - R / xx, R / Math.abs(xx), 0, 7); ctx.stroke();
      }));
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, 7); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ox - R, oy); ctx.lineTo(ox + R, oy); ctx.stroke();
      ctx.restore();
      /* rótulos de r y x */
      [0, 0.2, 0.5, 1, 2, 5].forEach((r) => { const g = (r - 1) / (r + 1); EM.text(ctx, String(r), ox + R * g + 3, oy - 4, { size: 10, mono: true, color: '--ink-3', halo: true }); });
      [0.2, 0.5, 1, 2, 5].forEach((x) => [x, -x].forEach((xx) => {
        const d = xx * xx + 1, g = cx((xx * xx - 1) / d, (2 * xx) / d), a = Math.atan2(g.im, g.re);
        EM.text(ctx, (xx > 0 ? '+j' : '−j') + x, ox + (R - 16) * Math.cos(a), oy - (R - 16) * Math.sin(a) + 4, { size: 10, mono: true, align: 'center', color: '--ink-3', halo: true });
      }));
      EM.text(ctx, '∞', ox + R - 6, oy - 5, { size: 12, align: 'right', color: '--ink-3', halo: true });
      EM.text(ctx, 'inductiva (x > 0)', ox, oy - R * 0.55, { size: 11, align: 'center', color: '--ink-3', halo: true });
      EM.text(ctx, 'capacitiva (x < 0)', ox, oy + R * 0.55 + 4, { size: 11, align: 'center', color: '--ink-3', halo: true });
      /* escala de longitudes de onda hacia el generador */
      ctx.save();
      ctx.strokeStyle = EM.col('--ink-3');
      for (let k = 0; k < 50; k++) {
        const v = k / 100, a = Math.PI - 4 * Math.PI * v, big = k % 5 === 0;
        const r1 = R + 4, r2 = R + (big ? 12 : 8);
        ctx.lineWidth = big ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(ox + r1 * Math.cos(a), oy - r1 * Math.sin(a)); ctx.lineTo(ox + r2 * Math.cos(a), oy - r2 * Math.sin(a)); ctx.stroke();
        if (big) EM.text(ctx, EM.fix(v, 2), ox + (R + 24) * Math.cos(a), oy - (R + 24) * Math.sin(a) + 4, { size: 10, mono: true, align: 'center', color: '--ink-3' });
      }
      ctx.restore();
      EM.text(ctx, 'longitudes de onda hacia el generador (sentido horario) →', ox, 16, { size: 11, align: 'center', color: '--ink-2' });
      /* círculo de ROE y puntos de máximo/mínimo */
      if (gm > 0.004) {
        ctx.save(); ctx.strokeStyle = EM.col('--gold'); ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.arc(ox, oy, R * gm, 0, 7); ctx.stroke(); ctx.restore();
        const mk = (g, lab, al) => { const [x, y] = P(g); ctx.save(); ctx.strokeStyle = EM.col('--gold'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.stroke(); ctx.restore(); EM.text(ctx, lab, x + (al === 'left' ? 7 : -7), y + 16, { size: 10.5, align: al, color: '--gold', halo: true }); };
        mk(cx(gm, 0), 'V_{máx}', 'left');
        mk(cx(-gm, 0), 'V_{mín}', 'right');
        /* arco recorrido */
        if (p.d > 0.0005) {
          ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(ox, oy, R * gm, -th, -th + rot, false); ctx.stroke(); ctx.restore();
          const ae = th - rot, [ex, ey] = P(Gi), tx = Math.sin(ae), ty = Math.cos(ae);
          EM.draw.arrow(ctx, ex - tx * 12, ey - ty * 12, ex + tx * 2, ey + ty * 2, { color: '--accent', width: 2.5, head: 11 });
        }
      }
      /* puntos */
      const dot = (g, col, lab, hollow) => {
        const [x, y] = P(g);
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, 6, 0, 7);
        if (hollow) { ctx.fillStyle = EM.col('--canvas'); ctx.fill(); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2.2; ctx.stroke(); }
        else { ctx.fillStyle = EM.col(col); ctx.fill(); ctx.strokeStyle = EM.col('--canvas'); ctx.lineWidth = 1.6; ctx.stroke(); }
        ctx.restore();
        const lx = x + (g.re > 0.6 ? -10 : 10), ly = y + (g.im >= 0 ? -10 : 18);
        EM.text(ctx, lab, lx, ly, { size: 12.5, italic: true, weight: 600, align: g.re > 0.6 ? 'right' : 'left', color: col, halo: true });
      };
      if (p.adm) { dot(cx(-G.re, -G.im), '--c1', 'y_{L}', true); dot(cx(-Gi.re, -Gi.im), '--c2', 'y_{ent}', true); }
      dot(G, '--c1', 'z_{L}');
      dot(Gi, '--c2', 'z_{ent}');
      /* lecturas */
      const zOf = (g) => { const den = cadd(cx(1, 0), cx(-g.re, -g.im)); return cabs(den) < 1e-9 ? null : cdiv(cadd(cx(1, 0), g), den); };
      const zi = zOf(Gi);
      sim.set('zL', p.kind === 'sc' ? '0' : p.kind === 'oc' ? '∞' : fmtC(zl));
      sim.set('G', f3(gm) + ' ∠ ' + EM.fix(deg(th), 1) + '°');
      sim.set('swr', gm > 0.9999 ? '∞' : f3((1 + gm) / (1 - gm)));
      sim.set('zin', zi ? fmtC(zi) : '∞');
      sim.set('Zin', zi ? fmtC(cmul(zi, cx(Z0, 0)), 1) + ' Ω' : '∞ (circuito abierto)');
      const yi = zi && cabs(zi) > 1e-9 ? cdiv(cx(1, 0), cmul(zi, cx(Z0, 0))) : null;
      sim.set('Yin', yi ? fmtC(cmul(yi, cx(1000, 0)), 2) + ' mS' : zi ? '∞ (cortocircuito)' : '0');
      sim.set('dmin', gm < 0.004 ? 'no hay (carga adaptada)' : f3(posmod(th / (4 * Math.PI) + 0.25, 0.5)) + 'λ');
    });
  });

  /* ======================================================================
     22.4 Modos de una guía rectangular
     ====================================================================== */
  EM.defineSim('waveguide-modes', function (sim) {
    const cs = sim.canvas({ aspect: 2.1 });
    const ct = sim.canvas({ aspect: 3.1, cls: 'fixed' });
    const cd = sim.canvas({ aspect: 2.4, cls: 'fixed' });
    sim.group('Guía');
    sim.slider('a', { label: 'Ancho <i>a</i>', min: 5, max: 80, step: 0.01, value: 22.86, unit: 'mm', fmt: f2 });
    sim.slider('b', { label: 'Alto <i>b</i>', min: 2, max: 40, step: 0.01, value: 10.16, unit: 'mm', fmt: f2 });
    const guide = (a, b, f) => () => { sim.ctl.a.set(a, true); sim.ctl.b.set(b, true); sim.ctl.f.set(f); };
    sim.button('WR-90 (banda X)', guide(22.86, 10.16, 10), { newRow: true });
    sim.button('WR-284 (banda S)', guide(72.14, 34.04, 3.2));
    sim.button('WR-42 (banda K)', guide(10.67, 4.32, 22));
    sim.group('Modo y frecuencia');
    sim.seg('type', { options: [['TE', 'TE'], ['TM', 'TM']], value: 'TE' });
    sim.slider('m', { label: 'Índice <i>m</i> (variaciones en <i>x</i>)', min: 0, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Índice <i>n</i> (variaciones en <i>y</i>)', min: 0, max: 4, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 1, max: 40, step: 0.01, value: 10, unit: 'GHz', fmt: f2 });
    sim.check('H', { label: 'Mostrar <b>H</b> transversal', value: true });
    sim.out('fc', 'Frecuencia de corte del modo', { hl: true });
    sim.out('st', 'Estado');
    sim.out('lg', 'Longitud de onda guiada <i>λ</i><sub>g</sub>');
    sim.out('l0', 'Longitud de onda en el vacío <i>λ</i>');
    sim.out('v', '<i>v</i><sub>p</sub>/<i>c</i>, <i>v</i><sub>g</sub>/<i>c</i>');
    sim.out('Z', 'Impedancia de onda');
    sim.out('mono', 'Banda monomodo');
    sim.out('list', 'Modos que se propagan a esta frecuencia');
    sim.legend([{ color: '--efield', label: '<b>E</b> transversal' }, { color: '--bfield', label: '<b>H</b> transversal' }, { color: '--efield', kind: 'sq', label: 'intensidad |<b>E</b><sub>t</sub>|²' }]);
    sim.onChange = (id) => {
      const p = sim.p;
      if (p.type === 'TE' && p.m === 0 && p.n === 0) sim.ctl[id === 'n' ? 'n' : 'm'].set(1, true);
      if (p.type === 'TM') { if (p.m === 0) sim.ctl.m.set(1, true); if (p.n === 0) sim.ctl.n.set(1, true); }
    };
    const C0 = K.c;
    const fcOf = (m, n, a, b) => (C0 / 2) * Math.hypot(m / a, n / b); /* a, b en m */
    function modes(a, b) {
      const L = [];
      for (let m = 0; m <= 5; m++) for (let n = 0; n <= 5; n++) {
        if (m + n === 0) continue;
        const fc = fcOf(m, n, a, b);
        L.push({ t: 'TE', m, n, fc });
        if (m > 0 && n > 0) L.push({ t: 'TM', m, n, fc });
      }
      L.sort((u, v) => u.fc - v.fc || (u.t < v.t ? -1 : 1));
      return L;
    }
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2.2; });
    const view = new EM.View2D(cs, {});
    let off = null;
    sim.onDraw(() => {
      const p = sim.p, a = p.a * 1e-3, b = p.b * 1e-3, m = p.m, n = p.n, TE = p.type === 'TE';
      const f = p.f * 1e9, fc = fcOf(m, n, a, b), k = (2 * Math.PI * f) / C0, kc = (2 * Math.PI * fc) / C0;
      const prop = f > fc, beta = prop ? Math.sqrt(k * k - kc * kc) : 0, alpha = prop ? 0 : Math.sqrt(kc * kc - k * k);
      const pa = (m * Math.PI) / p.a, pb = (n * Math.PI) / p.b; /* en 1/mm */
      /* campos transversales (x, y en mm) sin el factor común */
      const Et = (x, y) => TE ? [(n / p.b) * Math.cos(pa * x) * Math.sin(pb * y), -(m / p.a) * Math.sin(pa * x) * Math.cos(pb * y)] : [(m / p.a) * Math.cos(pa * x) * Math.sin(pb * y), (n / p.b) * Math.sin(pa * x) * Math.cos(pb * y)];
      const Ht = (x, y) => TE ? [(m / p.a) * Math.sin(pa * x) * Math.cos(pb * y), (n / p.b) * Math.cos(pa * x) * Math.sin(pb * y)] : [-(n / p.b) * Math.sin(pa * x) * Math.cos(pb * y), (m / p.a) * Math.cos(pa * x) * Math.sin(pb * y)];
      let Emax = 0, Hmax = 0;
      for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
        const e = Et((p.a * i) / 24, (p.b * j) / 24), h = Ht((p.a * i) / 24, (p.b * j) / 24);
        Emax = Math.max(Emax, Math.hypot(e[0], e[1])); Hmax = Math.max(Hmax, Math.hypot(h[0], h[1]));
      }
      /* ---------- corte transversal ---------- */
      EM.draw.clear(cs);
      view.setRange({ xmin: -0.1 * p.a, xmax: 1.1 * p.a, ymin: -0.2 * p.b - 2, ymax: 1.12 * p.b + 2 });
      const ctx = cs.ctx;
      const inside = (x, y) => x >= 0 && x <= p.a && y >= 0 && y <= p.b;
      EM.field.heat(view, (x, y) => (inside(x, y) ? (Math.pow(Math.hypot(...Et(x, y)) / Emax, 2)) : NaN), (v) => EM.cmap.seq(v * 0.55, '--efield'), { res: 3 });
      const X0 = view.X(0), X1 = view.X(p.a), Y0 = view.Y(0), Y1 = view.Y(p.b);
      ctx.save(); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 5; ctx.strokeRect(X0 - 2.5, Y1 - 2.5, X1 - X0 + 5, Y0 - Y1 + 5); ctx.restore();
      const wpx = X1 - X0, hpx = Y0 - Y1;
      const sp = Math.max(16, Math.min(34, Math.min(wpx / 12, hpx / 4)));
      const nx = Math.max(2, Math.round(wpx / sp)), ny = Math.max(2, Math.round(hpx / sp));
      const cE = Math.cos(ph), cH = prop ? Math.cos(ph) : Math.sin(ph); /* bajo el corte H está desfasado 90° */
      const arrows = (fn, mx, s, off, col, w) => {
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const x = (p.a * (i + 0.5 + off)) / nx, y = (p.b * (j + 0.5 + off)) / ny;
          if (!inside(x, y)) continue;
          const v = fn(x, y), mag = Math.hypot(v[0], v[1]) / mx;
          const L = 0.8 * Math.min(wpx / nx, hpx / ny) * mag * s;
          if (Math.abs(L) < 2.5) continue;
          const ux = v[0] / Math.hypot(v[0], v[1]), uy = v[1] / Math.hypot(v[0], v[1]);
          const px = view.X(x), py = view.Y(y);
          EM.draw.arrow(ctx, px - (ux * L) / 2, py + (uy * L) / 2, px + (ux * L) / 2, py - (uy * L) / 2, { color: col, width: w, head: Math.min(8, 3 + Math.abs(L) * 0.25) });
        }
      };
      arrows(Et, Emax, cE, 0, '--efield', 1.9);
      if (p.H) arrows(Ht, Hmax, cH, nx > 2 && ny > 2 ? 0.5 : 0.25, '--bfield', 1.4);
      EM.text(ctx, 'a = ' + f2(p.a) + ' mm', (X0 + X1) / 2, Y0 + 22, { size: 11.5, align: 'center', color: '--ink-2' });
      EM.text(ctx, 'b', X1 + 12, (Y0 + Y1) / 2 + 4, { size: 12, italic: true, color: '--ink-2' });
      EM.text(ctx, p.type + '_{' + m + n + '} · corte transversal (z = 0)', X0, Y1 - 12, { size: 12, weight: 600, color: '--ink' });
      /* ---------- vista superior: plano x–z ---------- */
      EM.draw.clear(ct);
      const c2 = ct.ctx, W2 = ct.w, H2 = ct.h, ml = 48, mr = 14, mt = 24, mb = 30;
      const zmax = 6 * p.a; /* mm */
      let comp, y0txt, Phi;
      if (TE && n === 0) { comp = 'E_{y}'; y0txt = ' (igual en todo y)'; Phi = (x) => Math.sin(pa * x); }
      else if (TE) { comp = 'E_{x}'; y0txt = ' en el plano y = b/' + 2 * n; Phi = (x) => Math.cos(pa * x); }
      else { comp = 'E_{z}'; y0txt = ' en el plano y = b/' + 2 * n; Phi = (x) => Math.sin(pa * x); }
      const NZ = 360, NX = 48;
      if (!off || off.width !== NZ) { off = document.createElement('canvas'); off.width = NZ; off.height = NX; }
      const oc = off.getContext('2d'), img = oc.createImageData(NZ, NX), dd = img.data;
      const bmm = beta * 1e-3, amm = alpha * 1e-3;
      for (let j = 0; j < NX; j++) {
        const x = (p.a * (NX - 1 - j + 0.5)) / NX, px = Phi(x);
        for (let i = 0; i < NZ; i++) {
          const z = (zmax * (i + 0.5)) / NZ;
          const v = prop ? px * Math.cos(ph - bmm * z) : px * Math.exp(-amm * z) * Math.cos(ph);
          const c = EM.cmap.diverging(v), q = (j * NZ + i) * 4;
          dd[q] = c[0]; dd[q + 1] = c[1]; dd[q + 2] = c[2]; dd[q + 3] = 255;
        }
      }
      oc.putImageData(img, 0, 0);
      c2.imageSmoothingEnabled = true;
      c2.drawImage(off, ml, mt, W2 - ml - mr, H2 - mt - mb);
      c2.save(); c2.strokeStyle = EM.col('--ink-2'); c2.lineWidth = 4;
      c2.beginPath(); c2.moveTo(ml, mt - 2); c2.lineTo(W2 - mr, mt - 2); c2.moveTo(ml, H2 - mb + 2); c2.lineTo(W2 - mr, H2 - mb + 2); c2.stroke(); c2.restore();
      const ZX = (z) => ml + (z / zmax) * (W2 - ml - mr);
      const tk = EM.ticks(0, zmax, 7);
      tk.ticks.forEach((z) => { c2.fillStyle = EM.col('--ink-3'); c2.fillRect(ZX(z), H2 - mb + 4, 1, 5); EM.text(c2, EM.tickFmt(tk.step)(z), ZX(z), H2 - mb + 19, { size: 10.5, mono: true, align: 'center', color: '--ink-3' }); });
      EM.text(c2, 'z (mm)', W2 - mr, H2 - 2, { size: 11, align: 'right', color: '--ink-2' });
      EM.text(c2, 'x', ml - 14, (mt + H2 - mb) / 2 + 4, { size: 12, italic: true, align: 'right', color: '--ink-2' });
      EM.text(c2, '0', ml - 6, H2 - mb + 2, { size: 10, mono: true, align: 'right', color: '--ink-3' });
      EM.text(c2, 'a', ml - 6, mt + 8, { size: 11, italic: true, align: 'right', color: '--ink-3' });
      EM.text(c2, 'Vista superior: ' + comp + y0txt + (prop ? ' · la onda avanza hacia +z' : ' · modo evanescente: no avanza, decae'), ml, 15, { size: 11.5, color: '--ink' });
      if (prop) {
        const lgmm = (2 * Math.PI) / bmm;
        if (lgmm < zmax * 0.9) {
          const xa = ZX(zmax - lgmm - 4 * (zmax / (W2 - ml - mr))), xb = ZX(zmax) - 4, yy = mt + 10;
          EM.draw.arrow(c2, (xa + xb) / 2, yy, xa, yy, { color: '--ink', width: 1.4, head: 7 });
          EM.draw.arrow(c2, (xa + xb) / 2, yy, xb, yy, { color: '--ink', width: 1.4, head: 7 });
          EM.text(c2, 'λ_{g}', (xa + xb) / 2, yy + 16, { size: 12, italic: true, align: 'center', color: '--ink', halo: true });
        }
      }
      /* ---------- diagrama de dispersión ---------- */
      EM.draw.clear(cd);
      const fmax = 40, bmax = (2 * Math.PI * fmax * 1e9) / C0;
      const pd = new EM.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: fmax, ymin: 0, ymax: bmax, xlabel: 'f (GHz)', ylabel: 'β (rad/m)', title: 'Diagrama de dispersión β(f) de los modos' });
      pd.frame();
      pd.fn((F) => (2 * Math.PI * F * 1e9) / C0, { color: '--ink-3', width: 1.4, dash: [6, 4] });
      pd.label(fmax * 0.8, (2 * Math.PI * fmax * 0.8e9) / C0, 'luz: β = ω/c', { dx: -8, dy: -8, align: 'right', size: 11 });
      const ML = modes(a, b).filter((q) => q.fc < fmax * 1e9);
      const groups = [];
      ML.forEach((q) => { const g = groups.find((G) => Math.abs(G.fc - q.fc) < 1e-6 * q.fc); if (g) g.names.push(q.t + q.m + q.n); else groups.push({ fc: q.fc, names: [q.t + q.m + q.n], sel: false }); });
      groups.forEach((g) => { g.sel = g.names.includes(p.type + m + n); });
      const lastX = [-1e9, -1e9, -1e9];
      groups.forEach((g) => {
        const F0 = g.fc / 1e9;
        pd.fn((F) => (F > F0 ? ((2 * Math.PI) / C0) * Math.sqrt(F * F - F0 * F0) * 1e9 : NaN), { color: g.sel ? '--accent' : '--ink-3', width: g.sel ? 3 : 1.2, alpha: g.sel ? 1 : 0.8, from: F0, n: 300 });
        const txt = g.names.join('/').replace(/(TE|TM)(\d)(\d)/g, '$1_{$2$3}'), px = pd.X(F0), tw = EM.textWidth(cd.ctx, txt, { size: 10.5 }) + 6;
        const lv = [0, 1, 2].find((l) => px - lastX[l] > 0) ;
        if (lv !== undefined && (g.sel || px + tw < pd.ix + pd.iw)) { pd.label(F0, 0, txt, { dx: 3, dy: -7 - 14 * lv, size: 10.5, color: g.sel ? '--accent' : '--ink-2' }); lastX[lv] = px + tw; }
      });
      pd.vline(p.f, { color: '--c1', dash: [], width: 1.4 });
      if (prop) pd.dot(p.f, beta, { color: '--accent' });
      /* ---------- lecturas ---------- */
      const r = fc / f;
      sim.set('fc', EM.fix(fc / 1e9, 3) + ' GHz');
      sim.set('st', prop ? 'se propaga' : 'evanescente');
      const lam0 = (C0 / f) * 1e3;
      if (prop) {
        const s = Math.sqrt(1 - r * r);
        sim.set('lg', EM.fix(lam0 / s, 2) + ' mm');
        sim.set('v', f3(1 / s) + ', ' + f3(s));
        sim.set('Z', EM.fix(TE ? K.eta0 / s : K.eta0 * s, 1) + ' Ω');
      } else {
        sim.set('lg', '— (1/α = ' + EM.fix(1e3 / alpha, 2) + ' mm)');
        sim.set('v', '—');
        sim.set('Z', 'reactiva');
      }
      sim.set('l0', EM.fix(lam0, 2) + ' mm');
      const all = modes(a, b);
      const fc1 = all[0].fc, fc2 = all.find((q) => q.fc > fc1 * (1 + 1e-9)).fc;
      sim.set('mono', EM.fix(fc1 / 1e9, 2) + ' – ' + EM.fix(fc2 / 1e9, 2) + ' GHz');
      const pr = all.filter((q) => q.fc < f).map((q) => q.t + q.m + q.n);
      sim.set('list', pr.length ? (pr.length > 8 ? pr.slice(0, 8).join(', ') + '… (' + pr.length + ')' : pr.join(', ')) : 'ninguno');
    });
  });
})();
