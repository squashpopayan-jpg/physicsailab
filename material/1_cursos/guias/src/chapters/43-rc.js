/* Capítulo 43 — Carga y descarga de un condensador */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('rc-banco', function (sim) {
    const RM = { dig: 10e6, ana: 200e3 };
    const ohm = (r) => (r >= 1e6 ? EM.fix(r / 1e6, r % 1e6 ? 1 : 0) + ' MΩ' : EM.fix(r / 1e3, r % 1e3 ? 1 : 0) + ' kΩ');
    /* Capacidad real dentro de la tolerancia, fija para cada muestra */
    const Creal = (p, st) => { if (st._sC !== st.semilla) { st._sC = st.semilla; st.dC = L.rng((st.semilla ^ 0x9e3779b9) >>> 0).uni(-0.15, 0.15); } return Number(p.C) * 1e-6 * (1 + st.dC); };
    const circ = (p, st, real) => { const R = Number(p.R), Rm = RM[p.Rm], C = real ? Creal(p, st) : Number(p.C) * 1e-6, Rp = (R * Rm) / (R + Rm); return { R, Rm, C, Rp, tau: Rp * C, Vinf: (p.E * Rm) / (R + Rm) }; };
    const Vt = (p, c, t) => (p.modo === 'd' ? MO.rcDescarga(t, c.Vinf, c.R, c.C, c.Rm) : MO.rcCarga(t, p.E, c.R, c.C, c.Rm));
    const paso = (tau) => [0.2, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 300, 600].find((s) => s >= (4 * tau) / 20) || 1200;
    const lect = (V, p, rnd) => (p.Rm === 'dig' ? L.quant(V + rnd.gauss(0, 0.002 * V + 0.003), 0.01) : L.quant(V + rnd.gauss(0, 0.05), 0.05));
    EM.banco(sim, {
      nombre: 'rc', aspect: [1.25, 1.1],
      cols: [{ k: 'm', t: 'proceso', d: 0 }, { k: 't', t: 't (s)', d: 1 }, { k: 'V', t: 'V (V)', d: 2 }],
      controles(sim) {
        sim.group('Circuito');
        sim.select('R', { label: 'Resistencia R', options: [['10000', '10 kΩ'], ['47000', '47 kΩ'], ['100000', '100 kΩ'], ['1000000', '1 MΩ']], value: '47000' });
        sim.select('C', { label: 'Condensador (nominal, ±20 %)', options: [['100', '100 µF'], ['470', '470 µF'], ['1000', '1000 µF'], ['2200', '2200 µF']], value: '1000' });
        sim.slider('E', { label: 'Tensión de la pila', min: 3, max: 12, step: 0.05, value: 9, unit: 'V', fmt: (v) => EM.fix(v, 2) });
        sim.seg('Rm', { label: 'Voltímetro', options: [['dig', 'Digital 10 MΩ'], ['ana', 'Analógico 200 kΩ']], value: 'dig' });
        sim.seg('modo', { label: 'Proceso', options: [['d', 'Descarga'], ['c', 'Carga']], value: 'd' });
        sim.seg('graf', { label: 'Gráfica', options: [['V', 'V contra t'], ['ln', 'linealizada']], value: 'ln' });
      },
      paso() {},
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, c = circ(p, st, true), T = 5 * c.tau, tv = ((st.t || 0) * Math.max(1, T / 12)) % T, V = Vt(p, c, tv);
        const xa = W * 0.1, xs = W * 0.33, xc = W * 0.62, yt = H * 0.22, yb = H * 0.8, w = { width: 1.8 };
        D.fuente(ctx, xa, yb, xa, yt);
        D.label(ctx, EM.fix(p.E, 2) + ' V', xa + 16, (yt + yb) / 2 + 4, { mono: true });
        D.line(ctx, xa, yt, xs - 16, yt, w);
        D.line(ctx, xs - 16, yt + 30, xs - 16, yb, w);
        const piv = [xs + 14, yt], tgt = p.modo === 'c' ? [xs - 16, yt] : [xs - 16, yt + 30];
        D.line(ctx, piv[0], piv[1], tgt[0], tgt[1], { width: 2.6, color: '--c2' });
        for (const q of [[xs - 16, yt], [xs - 16, yt + 30], piv]) { ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 7); ctx.fill(); ctx.restore(); }
        D.label(ctx, p.modo === 'c' ? 'carga' : 'descarga', xs, yt - 12, { align: 'center', color: '--c2', weight: 650 });
        D.line(ctx, piv[0], piv[1], W * 0.4, yt, w);
        D.resistor(ctx, W * 0.4, yt, W * 0.56, yt, { label: ohm(c.R) });
        D.line(ctx, W * 0.56, yt, xc, yt, w);
        D.capacitor(ctx, xc, yt, xc, yb);
        D.label(ctx, p.C + ' µF', xc - 15, (yt + yb) / 2 + 22, { align: 'right', mono: true });
        D.label(ctx, '+', xc + 15, (yt + yb) / 2 - 8, { align: 'center', weight: 700 });
        D.line(ctx, xa, yb, xc, yb, w);
        const mw = W * 0.2, mx = W * 0.72, my = yt + 12, m = D.multimetro(ctx, mx, my, mw, EM.fix(V, p.Rm === 'dig' ? 2 : 1), { modo: 'V⎓' });
        const yr = m.v[1] + 12, xr = Math.min(W - 6, mx + mw + 9);
        D.cable(ctx, [xc, yt], m.v, '--wire-r', { ruta: [[xr, yt], [xr, yr], [m.v[0], yr]] });
        D.cable(ctx, [xc, yb], m.com, '--wire-b', { ruta: [[m.com[0], yb]] });
        D.label(ctx, 'Rm = ' + ohm(c.Rm), mx + mw / 2, yb + 18, { align: 'center', size: 11, mono: true });
        D.label(ctx, 't = ' + EM.fix(tv, 1) + ' s', W * 0.04, H * 0.96, { weight: 650, mono: true });
      },
      medir(p, rnd, st) {
        const c = circ(p, st, true), T = 5 * c.tau, tv = L.quant(((st.t || 0) * Math.max(1, T / 12)) % T, 0.1);
        return { m: p.modo === 'd' ? 'descarga' : 'carga', t: tv, V: lect(Vt(p, c, tv), p, rnd) };
      },
      serie(p, rnd, st) {
        const c = circ(p, st, true), dt = paso(c.tau), out = [];
        for (let i = 0; i <= 20; i++) out.push({ m: p.modo === 'd' ? 'descarga' : 'carga', t: L.quant(i * dt, 0.1), V: lect(Vt(p, c, i * dt), p, rnd) });
        if (p.modo === 'c') out.push({ m: 'carga', t: L.quant(10 * c.tau, 1), V: lect(Vt(p, c, 10 * c.tau), p, rnd) });
        return out;
      },
      grafica(rows, p, st) {
        const m = p.modo === 'd' ? 'descarga' : 'carga', r = rows.filter((x) => x.m === m), cn = circ(p, st, false);
        if (p.graf === 'V') return { x: r.map((x) => x.t), y: r.map((x) => x.V), xl: 't (s)', yl: 'V (V)', ajuste: null, curva: (t) => Vt(p, cn, t), xextra: [0], yextra: [0, p.E], leyenda: [{ label: 'datos', color: '--accent', kind: 'dot' }, { label: 'modelo con C nominal', color: '--ink-3', dash: [5, 4], width: 1.4 }], esquina: 'tr' };
        if (p.modo === 'd') { const q = r.filter((x) => x.V >= 0.2); return { x: q.map((x) => x.t), y: q.map((x) => Math.log(x.V)), xl: 't (s)', yl: 'ln(V / 1 V)', ajuste: 'recta', cero: false }; }
        const Vf = r.length ? Math.max(...r.map((x) => x.V)) : 0, q = r.filter((x) => Vf - x.V >= 0.2);
        return { x: q.map((x) => x.t), y: q.map((x) => Math.log(Vf - x.V)), xl: 't (s)', yl: 'ln((V∞ − V) / 1 V)', ajuste: 'recta', cero: false };
      },
      resultado(fit, rows, p, st) {
        const cn = circ(p, st, false), out = [['tn', 'τ\' nominal = (R ∥ Rm)·C', EM.fix(cn.tau, 2) + ' s'], ['vi', 'Tensión final de carga V∞', EM.fix(cn.Vinf, 3) + ' V']];
        if (fit && p.graf === 'ln') {
          const tau = -1 / fit.m, st2 = fit.sm / (fit.m * fit.m), C = tau / cn.Rp, sC = st2 / cn.Rp, dev = (C / cn.C - 1) * 100;
          out.push(['tau', 'τ\' medido = −1/pendiente', L.pm(tau, st2, 's'), true]);
          out.push(['C', 'Capacidad real C = τ\'/(R ∥ Rm)', L.pm(C * 1e6, sC * 1e6, 'µF') + ' (' + (dev >= 0 ? '+' : '−') + EM.fix(Math.abs(dev), 1) + ' %, ' + (Math.abs(dev) <= 20 ? 'dentro' : 'fuera') + ' de la tolerancia)']);
        }
        return out;
      }
    });
  });
})();
