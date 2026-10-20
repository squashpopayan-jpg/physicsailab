/* Capítulo 5 — Tensión superficial y capilaridad */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g;
  const LIQ = {
    agua: ['Agua sobre vidrio limpio', 0.0727, 998.2, 0], jabon: ['Agua jabonosa', 0.025, 1000, 0], etanol: ['Etanol sobre vidrio', 0.0224, 789.4, 0],
    teflon: ['Agua sobre teflón', 0.0727, 998.2, 110], mercurio: ['Mercurio sobre vidrio', 0.485, 13546, 140]
  };

  /* 5.1 Dos burbujas conectadas */
  EM.defineSim('burbujas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r1', { label: 'Radio inicial de la burbuja izquierda', min: 1.05, max: 4, step: 0.05, value: 1.6, unit: 'cm', fmt: (v) => v.toFixed(2) });
    sim.slider('r2', { label: 'Radio inicial de la burbuja derecha', min: 1.05, max: 4, step: 0.05, value: 2.4, unit: 'cm', fmt: (v) => v.toFixed(2) });
    sim.slider('gam', { label: 'Tensión superficial de la solución', min: 0.02, max: 0.05, step: 0.001, value: 0.025, unit: 'N/m', fmt: (v) => v.toFixed(3) });
    sim.slider('rs', { label: 'Radio interior del tubo', min: 0.5, max: 3, step: 0.1, value: 1.5, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.out('p', 'Sobrepresiones 4γ/<i>R</i> (izq · der)', { hl: true });
    sim.out('V', 'Volúmenes (cm³)');
    sim.out('t', 'Tiempo');
    const a = 0.01, mu = 1.81e-5, Ls = 0.06;
    const Vc = (h) => (Math.PI * h * (3 * a * a + h * h)) / 6, Rc = (h) => (a * a + h * h) / (2 * h), dVdh = (h) => (Math.PI * (a * a + h * h)) / 2;
    const hFromR = (r) => r + Math.sqrt(Math.max(0, r * r - a * a));
    let h1, h2, t;
    const reset = () => { h1 = hFromR(sim.p.r1 / 100); h2 = hFromR(sim.p.r2 / 100); t = 0; };
    reset();
    sim.onChange = (id) => { if (id === 'r1' || id === 'r2') reset(); };
    sim.resetButton(reset);
    sim.animate((dt) => {
      const p = sim.p, Rf = (8 * mu * Ls) / (Math.PI * Math.pow(p.rs / 1000, 4));
      const n = 40, h = (dt * 0.5) / n; /* medio segundo físico por segundo real */
      for (let i = 0; i < n; i++) {
        const Q = ((4 * p.gam) / Rc(h1) - (4 * p.gam) / Rc(h2)) / Rf;
        const n1 = h1 - (Q * h) / dVdh(h1), n2 = h2 + (Q * h) / dVdh(h2);
        if (n1 > 1e-5 && n2 > 1e-5) { h1 = n1; h2 = n2; }
        t += h;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sc = Math.min((W * 0.55) / 0.16, (H * 0.8) / 0.09), base = H - 40;
      const cx1 = W * 0.14, cx2 = W * 0.42;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx1, base); ctx.lineTo(cx1, base + 20); ctx.lineTo(cx2, base + 20); ctx.lineTo(cx2, base); ctx.stroke();
      /* casquete esférico de altura hh sobre un anillo de radio a: centro a zc = hh − R */
      const cap = (cx, hh) => {
        const R = Rc(hh), zc = hh - R, pr = Math.atan2(-zc, a), N = 90;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const ps = Math.PI - pr + ((2 * pr - Math.PI) * i) / N;
          const x = cx + R * Math.cos(ps) * sc, y = base - (zc + R * Math.sin(ps)) * sc;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.fillStyle = EM.alpha('--c5', 0.12); ctx.fill();
        ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - a * sc - 3, base); ctx.lineTo(cx + a * sc + 3, base); ctx.stroke();
      };
      cap(cx1, h1); cap(cx2, h2);
      const Q = ((4 * p.gam) / Rc(h1) - (4 * p.gam) / Rc(h2));
      if (Math.abs(Q) > 1e-4) EM.draw.arrow(ctx, (cx1 + cx2) / 2 - Math.sign(Q) * 20, base + 32, (cx1 + cx2) / 2 + Math.sign(Q) * 20, base + 32, { color: '--accent', width: 2 });
      /* curva Δp(V) */
      const hs = EM.M.linspace(0.0005, 0.08, 300);
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0, xmax: 1.05 * (Vc(0.08) * 1e6), ymin: 0, ymax: ((4 * p.gam) / a) * 1.15, xlabel: 'volumen (cm³)', ylabel: 'Δp (Pa)' });
      pl.frame();
      pl.xy(hs.map((h) => Vc(h) * 1e6), hs.map((h) => (4 * p.gam) / Rc(h)), { color: '--c5', width: 2.2 });
      pl.vline(Vc(a) * 1e6, { color: '--ink-3', label: 'semiesfera' });
      pl.dot(Vc(h1) * 1e6, (4 * p.gam) / Rc(h1), { color: '--accent', r: 6, label: 'izq' });
      pl.dot(Vc(h2) * 1e6, (4 * p.gam) / Rc(h2), { color: '--c1', r: 6, label: 'der' });
      sim.set('p', EM.fix((4 * p.gam) / Rc(h1), 3) + ' · ' + EM.fix((4 * p.gam) / Rc(h2), 3) + ' Pa');
      sim.set('V', EM.fix(Vc(h1) * 1e6, 2) + ' · ' + EM.fix(Vc(h2) * 1e6, 2));
      sim.set('t', EM.fix(t, 2) + ' s');
    });
  });

  /* 5.2 Ley de Jurin */
  EM.defineSim('jurin', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('f', { label: 'Líquido y superficie', options: Object.entries(LIQ).map(([k, v]) => [k, v[0]]), value: 'agua' });
    sim.slider('r', { label: 'Radio del tubo central', min: 0.05, max: 2, step: 0.01, value: 0.5, unit: 'mm', log: true, fmt: (v) => v.toFixed(2) });
    sim.out('h', 'Altura capilar <i>h</i> (tubo central)', { hl: true });
    sim.out('lc', 'Longitud capilar ℓ<sub>c</sub>');
    sim.out('Bo', 'Número de Bond (<i>r</i>/ℓ<sub>c</sub>)²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = LIQ[p.f], th = (L[3] * Math.PI) / 180;
      EM.draw.clear(cv);
      const hh = (r) => FL.jurin(L[1], th, L[2], r / 1000) * 1000; /* mm */
      const col = p.f === 'mercurio' ? '--c6' : '--water';
      const rr = [p.r / 2, p.r, p.r * 2], hmax = Math.max(...rr.map((r) => Math.abs(hh(r))), 5);
      const lvl = H * (L[3] > 90 ? 0.38 : 0.78), sc = Math.min((H * (L[3] > 90 ? 0.45 : 0.68)) / hmax, 20);
      const x0 = 20, x1 = W * 0.5;
      EM.flow.waterRect(ctx, x0, lvl, x1 - x0, H - lvl - 6, { color: col });
      rr.forEach((r, i) => {
        const cx = x0 + ((x1 - x0) * (i + 1)) / 4, w = Math.max(3, Math.min(40, r * 12)), top = lvl - hh(r) * sc;
        ctx.fillStyle = EM.alpha(col, 0.5);
        ctx.fillRect(cx - w / 2, Math.min(top, lvl), w, Math.abs(lvl - top) + (top < lvl ? 0 : 0));
        if (top > lvl) { ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(cx - w / 2, lvl, w, top - lvl); }
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - w / 2 - 1.5, 14, w + 3, H - 40);
        /* menisco */
        ctx.strokeStyle = EM.col(col); ctx.lineWidth = 1.6; ctx.beginPath();
        const dip = (w / 2) * (1 - Math.abs(Math.sin(th))) * (Math.cos(th) > 0 ? 1 : -1) * 0.8;
        ctx.moveTo(cx - w / 2, top - dip); ctx.quadraticCurveTo(cx, top + dip, cx + w / 2, top - dip); ctx.stroke();
        EM.text(ctx, 'r = ' + EM.fix(r, 2) + ' mm', cx, H - 10, { size: 10.5, align: 'center', color: '--ink-2' });
      });
      const pl = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 0.05, xmax: 2, ymin: Math.min(0, hh(0.05) * 1.1), ymax: Math.max(5, hh(0.05) * 1.1), xlog: true, xlabel: 'radio del tubo (mm)', ylabel: 'h (mm)' });
      pl.frame();
      pl.fn(hh, { color: col, width: 2.4 });
      pl.dot(p.r, hh(p.r), { color: '--accent', r: 6 });
      const lc = FL.lcap(L[1], L[2]);
      sim.set('h', EM.fix(hh(p.r), 2) + ' mm');
      sim.set('lc', EM.fix(lc * 1000, 3) + ' mm');
      sim.set('Bo', EM.sci(Math.pow(p.r / 1000 / lc, 2), 3));
    });
  });

  /* 5.3 Menisco junto a una pared */
  EM.defineSim('menisco-pared', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('f', { label: 'Líquido', options: [['agua', 'Agua (ℓ_c = 2.73 mm)'], ['etanol', 'Etanol (ℓ_c = 1.70 mm)'], ['mercurio', 'Mercurio (ℓ_c = 1.91 mm)']], value: 'agua' });
    sim.slider('th', { label: 'Ángulo de contacto θ', min: 0, max: 180, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('exp', { label: 'Mostrar la aproximación exponencial', value: true });
    sim.out('h', 'Altura del menisco en la pared', { hl: true });
    sim.out('lc', 'Longitud capilar');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = LIQ[p.f], lc = FL.lcap(L[1], L[2]) * 1000;
      EM.draw.clear(cv);
      const up = p.th <= 90, the = ((up ? p.th : 180 - p.th) * Math.PI) / 180, sg = up ? 1 : -1;
      const m = FL.meniscusPlate(the, lc), h = m.h;
      const xmax = 5 * lc, v = EM.flow.view({ x: 30, y: 10, w: W - 40, h: H - 20 }, -0.6 * lc, xmax, -2.2 * lc, 2.2 * lc, false);
      /* perfil x(z) → muestreamos z desde h hasta pequeño */
      const pts = [];
      if (h > 1e-9) for (let i = 0; i <= 300; i++) { const z = h * Math.pow(1e-4, i / 300); const x = m.x(z); if (x <= xmax) pts.push([x, sg * z]); }
      pts.push([xmax, 0]);
      const poly = [[v.X(0), v.Y(-2.2 * lc)]].concat(pts.map((q) => v.map(q))).concat([[v.X(xmax), v.Y(-2.2 * lc)]]);
      EM.flow.waterFill(ctx, poly, { color: p.f === 'mercurio' ? '--c6' : '--water', alpha: 0.35 });
      EM.flow.drawPath(ctx, pts, v.map, { color: p.f === 'mercurio' ? '--c6' : '--water', width: 2.4 });
      if (p.exp && h > 1e-9) { const xs = EM.M.linspace(0, xmax, 100); EM.flow.drawPath(ctx, xs.map((x) => [x, sg * h * Math.exp(-x / lc)]), v.map, { color: '--c2', width: 1.4, dash: [5, 4] }); }
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(v.X(-0.6 * lc), v.Y(2.2 * lc), v.X(0) - v.X(-0.6 * lc), v.Y(-2.2 * lc) - v.Y(2.2 * lc));
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(xmax), v.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      for (let k = 1; k <= 4; k++) { EM.text(ctx, k + 'ℓ_c', v.X(k * lc), v.Y(0) + 14, { size: 10.5, align: 'center', color: '--ink-3' }); }
      EM.text(ctx, 'pared', v.X(-0.3 * lc), v.Y(1.9 * lc), { size: 11, align: 'center', color: '--ink', halo: true });
      sim.set('h', EM.fix(sg * h, 3) + ' mm');
      sim.set('lc', EM.fix(lc, 3) + ' mm');
    });
  });

  /* 5.4 Gota sésil */
  EM.defineSim('gota-sesil', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('f', { label: 'Líquido', options: [['agua', 'Agua'], ['mercurio', 'Mercurio']], value: 'agua' });
    sim.slider('V', { label: 'Volumen de la gota', min: 0.1, max: 2000, step: 0, value: 30, unit: 'µL', log: true, fmt: (v) => (v < 10 ? v.toFixed(2) : v.toFixed(0)) });
    sim.slider('th', { label: 'Ángulo de contacto θ', min: 10, max: 170, step: 1, value: 110, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('H', 'Altura de la gota', { hl: true });
    sim.out('D', 'Diámetro de la base');
    sim.out('cap', 'Casquete esférico del mismo volumen (altura)');
    sim.out('inf', 'Altura límite del charco 2ℓ<sub>c</sub> sen(θ/2)');
    sim.out('Bo', 'Número de Bond (<i>R</i>/ℓ<sub>c</sub>)²');
    const cache = new Map();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h, L = p.f === 'agua' ? LIQ.agua : LIQ.mercurio, lc = FL.lcap(L[1], L[2]) * 1000; /* mm */
      EM.draw.clear(cv);
      const th = (p.th * Math.PI) / 180, Vd = p.V / Math.pow(lc, 3); /* µL = mm³ */
      const key = p.f + '|' + p.V.toPrecision(5) + '|' + p.th;
      let d = cache.get(key);
      if (!d) { d = FL.sessileV(Vd, th, { tol: 1e-7, it: 60, ds: 0.004, bmax: 1e4 }); cache.set(key, d); if (cache.size > 300) cache.clear(); }
      const Rs = Math.cbrt((3 * p.V) / (Math.PI * (2 - 3 * Math.cos(th) + Math.pow(Math.cos(th), 3)))), capH = Rs * (1 - Math.cos(th)), capR = Rs * Math.sin(th);
      const Hd = d.H * lc, Rb = d.Rb * lc;
      const span = Math.max(Rb, capR, Rs) * 1.25, top = Math.max(Hd, capH, 2 * lc * Math.sin(th / 2)) * 1.2 + 0.3;
      const v = EM.flow.view({ x: 10, y: 10, w: W - 20, h: Hc - 30 }, -span, span, -top * 0.15, top);
      /* perfil: z hacia abajo desde el ápice → y = H − z */
      const right = d.pts.map((q) => [q[0] * lc, Hd - q[1] * lc]);
      const full = right.slice().reverse().map((q) => [-q[0], q[1]]).concat(right);
      const col = p.f === 'mercurio' ? '--c6' : '--water';
      EM.flow.waterFill(ctx, full.map((q) => v.map(q)), { color: col, alpha: 0.35 });
      EM.flow.drawPath(ctx, full, v.map, { color: col, width: 2.4 });
      /* casquete esférico */
      const cz = capH - Rs, capPts = [];
      const a0 = Math.PI / 2 - th, a1 = Math.PI / 2 + th;
      for (let i = 0; i <= 120; i++) { const a = a0 + ((a1 - a0) * i) / 120; capPts.push([Rs * Math.cos(a), cz + Rs * Math.sin(a)]); }
      EM.flow.drawPath(ctx, capPts, v.map, { color: '--c2', width: 1.4, dash: [5, 4] });
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(v.X(-span), v.Y(0), v.X(span) - v.X(-span), 8);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(v.X(-span), v.Y(2 * lc * Math.sin(th / 2))); ctx.lineTo(v.X(span), v.Y(2 * lc * Math.sin(th / 2))); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'h∞ = 2ℓ_c sen(θ/2)', v.X(span) - 6, v.Y(2 * lc * Math.sin(th / 2)) - 5, { size: 11, color: '--ink-3', align: 'right', halo: true });
      sim.set('H', EM.fix(Hd, 3) + ' mm');
      sim.set('D', EM.fix(2 * Rb, 3) + ' mm');
      sim.set('cap', EM.fix(capH, 3) + ' mm (base ' + EM.fix(2 * capR, 3) + ' mm)');
      sim.set('inf', EM.fix(2 * lc * Math.sin(th / 2), 3) + ' mm');
      sim.set('Bo', EM.sci(d.Rb * d.Rb, 3));
    });
  });
})();
