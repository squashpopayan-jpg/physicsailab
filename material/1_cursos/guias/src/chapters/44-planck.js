/* Capítulo 44 — La constante de Planck con LED */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* Tensión típica a 1 mA (valores de catálogo, ilustrativos) */
  const LEDS = [
    { nm: 940, V1: 1.1, n: 'infrarrojo', fam: 'GaAs' },
    { nm: 630, V1: 1.75, n: 'rojo', fam: 'AlGaInP' },
    { nm: 605, V1: 1.8, n: 'naranja', fam: 'AlGaInP' },
    { nm: 590, V1: 1.85, n: 'amarillo', fam: 'AlGaInP' },
    { nm: 525, V1: 2.45, n: 'verde', fam: 'InGaN' },
    { nm: 470, V1: 2.6, n: 'azul', fam: 'InGaN' },
    { nm: 405, V1: 2.85, n: 'violeta', fam: 'InGaN' }
  ];
  const ETA = 2, RS = 10, RSER = 1000, VT = (MO.kB * 298.15) / MO.e;
  EM.defineSim('planck-banco', function (sim) {
    /* Desfase de cada LED del lote (fijo por muestra) */
    const dV = (st) => { if (st._sL !== st.semilla) { st._sL = st.semilla; const r = L.rng((st.semilla ^ 0x51ed27) >>> 0); st.dV = LEDS.map(() => r.gauss(0, 0.02)); } return st.dV; };
    const led = (p) => LEDS[Number(p.led)];
    const V0 = (p, st) => led(p).V1 + dV(st)[Number(p.led)] - ETA * VT * Math.log(1000) - RS * 1e-3;
    /* Punto de operación con la resistencia de 1 kΩ: V + I·Rser = Vs */
    const op = (Vs, v0) => {
      let lo = 0, hi = Math.max(Vs, 0);
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (m + MO.iLED(m, v0, ETA, RS) * RSER > Vs) hi = m; else lo = m; }
      const V = (lo + hi) / 2; return { V, I: Math.max(0, (Vs - V) / RSER) };
    };
    const lV = (V, rnd) => L.quant(V + rnd.gauss(0, 0.002), V < 2 ? 0.001 : 0.01);
    EM.banco(sim, {
      nombre: 'planck', aspect: [1.25, 1.1],
      cols: [{ k: 'n', t: 'LED', d: 0 }, { k: 'nm', t: 'λ (nm)', d: 0 }, { k: 'il', t: '1/λ (µm⁻¹)', d: 3 }, { k: 'V', t: 'V (V)', d: 3 }, { k: 'I', t: 'I (mA)', d: 2 }],
      controles(sim) {
        sim.group('Circuito');
        sim.select('led', { label: 'LED', options: LEDS.map((x, i) => [String(i), x.n + ' · ' + x.nm + ' nm']), value: '1' });
        sim.slider('Vs', { label: 'Tensión aplicada (potenciómetro)', min: 0, max: 9, step: 0.01, value: 2.5, unit: 'V', fmt: (v) => EM.fix(v, 2) });
        sim.seg('graf', { label: 'Experimento', options: [['iv', 'Curva I–V'], ['h', 'V contra 1/λ']], value: 'h' });
      },
      paso() {},
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, x = led(p), o = op(p.Vs, V0(p, st)), xa = W * 0.12, xl = W * 0.58, yt = H * 0.22, yb = H * 0.8, w = { width: 1.8 };
        D.fuente(ctx, xa, yb, xa, yt);
        D.arrow(ctx, xa - 16, yb - 18, xa + 16, yt + 18, { color: '--c2', width: 1.4, head: 6 });
        D.label(ctx, EM.fix(p.Vs, 2) + ' V', xa + 18, (yt + yb) / 2 + 4, { mono: true });
        D.line(ctx, xa, yt, W * 0.24, yt, w);
        D.resistor(ctx, W * 0.24, yt, W * 0.46, yt, { label: '1 kΩ' });
        D.line(ctx, W * 0.46, yt, xl, yt, w);
        const vis = x.nm < 760, br = Math.min(1, o.I / 0.004);
        if (vis && br > 0.01) { const gx = xl - 12, gy = (yt + yb) / 2, g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 36); g.addColorStop(0, D.colorNm(x.nm, 0.85 * br)); g.addColorStop(1, D.colorNm(x.nm, 0)); ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 36, 0, 7); ctx.fill(); ctx.restore(); }
        D.diodo(ctx, xl, yt, xl, yb, { led: true, color: vis ? D.colorNm(x.nm) : '--ink-3' });
        D.label(ctx, x.n, xl - 16, (yt + yb) / 2 + 26, { align: 'right', weight: 650 });
        if (!vis) D.label(ctx, '(solo lo ve la cámara)', xl - 16, (yt + yb) / 2 + 42, { align: 'right', size: 10.5, color: '--ink-3' });
        D.line(ctx, xa, yb, xl, yb, w);
        const mw = W * 0.2, mx = W * 0.74, my = yt + 12, m = D.multimetro(ctx, mx, my, mw, EM.fix(o.V, 3), { modo: 'V⎓' });
        const yr = m.v[1] + 12, xr = Math.min(W - 6, mx + mw + 9);
        D.cable(ctx, [xl, yt], m.v, '--wire-r', { ruta: [[xr, yt], [xr, yr], [m.v[0], yr]] });
        D.cable(ctx, [xl, yb], m.com, '--wire-b', { ruta: [[m.com[0], yb]] });
        D.label(ctx, 'I = ' + EM.fix(o.I * 1000, 2) + ' mA', W * 0.04, H * 0.96, { weight: 650, mono: true });
      },
      medir(p, rnd, st) { const x = led(p), o = op(p.Vs, V0(p, st)); return { k: 'iv', n: x.n, nm: x.nm, il: 1000 / x.nm, V: lV(o.V, rnd), I: L.quant(o.I * 1000 + rnd.gauss(0, 0.003), 0.01) }; },
      serie(p, rnd, st) {
        const out = [];
        if (p.graf === 'iv') { const v0 = V0(p, st), x = led(p); for (let Vs = 0; Vs <= 9.001; Vs += 0.2) { const o = op(Vs, v0); if (o.I > 0.0065) break; out.push({ k: 'iv', n: x.n, nm: x.nm, il: 1000 / x.nm, V: lV(o.V, rnd), I: L.quant(o.I * 1000 + rnd.gauss(0, 0.003), 0.01) }); } }
        else LEDS.forEach((x, i) => out.push({ k: 'h', n: x.n, nm: x.nm, il: 1000 / x.nm, V: lV(x.V1 + dV(st)[i], rnd), I: 1 }));
        return out;
      },
      grafica(rows, p, st) {
        if (p.graf === 'iv') { const x = led(p), r = rows.filter((q) => q.k === 'iv' && q.n === x.n), v0 = V0(p, st); return { x: r.map((q) => q.V), y: r.map((q) => q.I), xl: 'V del LED (V)', yl: 'I (mA)', ajuste: null, curva: (V) => Math.min(8, MO.iLED(V, v0, ETA, RS) * 1000), xr: [0, 3.5], yr: [0, 7] }; }
        const r = rows.filter((q) => q.k === 'h');
        return { x: r.map((q) => q.il), y: r.map((q) => q.V), xl: '1/λ (µm⁻¹)', yl: 'V a 1 mA (V)', ajuste: 'recta', curva: (il) => (MO.h * MO.c * il * 1e6) / MO.e, xr: [0.9, 2.6], yr: [0.5, 3.5], leyenda: [{ label: 'datos', color: '--accent', kind: 'dot' }, { label: 'ajuste', color: '--c2' }, { label: 'hc/(eλ)', color: '--ink-3', dash: [5, 4], width: 1.4 }], esquina: 'tl' };
      },
      resultado(fit, rows, p, st) {
        const x = led(p), o = op(p.Vs, V0(p, st));
        const out = [['ef', 'Energía del fotón hc/(eλ)', EM.fix(MO.vFoton(x.nm * 1e-9), 3) + ' V'], ['op', 'LED: V e I', EM.fix(o.V, 3) + ' V · ' + EM.fix(o.I * 1000, 2) + ' mA']];
        if (fit && p.graf === 'h') {
          const k = (1e-6 * MO.e) / MO.c, h = fit.m * k, sh = fit.sm * k;
          out.push(['h', 'h = e·pendiente/c', L.pm(h / 1e-34, sh / 1e-34, '× 10⁻³⁴ J·s'), true]);
          out.push(['d', 'Diferencia con el valor exacto', (h >= MO.h ? '+' : '−') + EM.fix(Math.abs((h / MO.h - 1) * 100), 1) + ' %']);
          out.push(['b', 'Ordenada al origen', EM.fix(fit.b, 2) + ' V']);
        }
        return out;
      }
    });
  });
})();
