/* Capítulo 12 — Momento angular */
(function () {
  'use strict';
  const EM = window.EM, S = EM.P.sf, AN = EM.qm.ang, M = EM.M, PI = Math.PI;
  const NAMES = { 's': 0, 'p': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5 };

  /* 12.1 Armónicos esféricos en 3D */
  EM.defineSim('armonicos', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const v3 = new EM.View3D(sim, cv, { radius: 1.25, az: M.rad(35), el: M.rad(22) });
    sim.slider('l', { label: 'Número cuántico orbital l', min: 0, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) + '  (' + 'spdfgh'[Math.round(v)] + ')', onInput: () => { if (Math.abs(sim.p.m) > sim.p.l) sim.ctl.m.set(Math.max(-sim.p.l, Math.min(sim.p.l, sim.p.m)), true); } });
    sim.slider('m', { label: 'Número cuántico magnético m', min: -5, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.seg('mode', { label: 'Representación', options: [['real', 'Real (Re Y)'], ['mod', '|Y|² (compleja)']], value: 'real' });
    sim.out('L', '|<b>L</b>| = ħ√(<i>l</i>(<i>l</i> + 1)) · <i>L</i><sub>z</sub> = <i>m</i>ħ', { hl: true });
    sim.out('a', 'Ángulo entre <b>L</b> y el eje <i>z</i>: cos θ = <i>m</i>/√(<i>l</i>(<i>l</i> + 1)) · nodos angulares');
    sim.out('p', 'Paridad (−1)^<i>l</i> · probabilidad en el cono θ &lt; 30° ');
    sim.onDraw(() => {
      const l = Math.round(sim.p.l), m = Math.max(-l, Math.min(l, Math.round(sim.p.m))), real = sim.p.mode === 'real';
      const f = (th, ph) => (real ? AN.Y(l, m, th, ph)[0] : AN.Y2(l, m, th));
      v3.begin(); v3.axes({ len: 1.05, neg: 0.9 });
      let mx = 0; for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) mx = Math.max(mx, Math.abs(f((PI * i) / 30, (2 * PI * j) / 30)));
      const sc = 0.95 / mx;
      v3.mesh((th, ph) => { const r = Math.abs(f(th, ph)) * sc; return [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]; }, 1e-4, PI - 1e-4, 44, 0, 2 * PI, 56, { fillFn: (th, ph) => (real ? (f(th, ph) >= 0 ? '--c2' : '--c1') : '--c5'), alpha: 0.92 });
      v3.render();
      /* probabilidad en θ < 30°: ∫|Y|² dΩ */
      let pc = 0; const N = 800; for (let i = 0; i < N; i++) { const th = (PI / 6) * (i + 0.5) / N; pc += AN.Y2(l, m, th) * Math.sin(th) * (PI / 6 / N) * 2 * PI; }
      sim.set('L', `ħ·${EM.fix(Math.sqrt(l * (l + 1)), 4)} · ${m}ħ`);
      sim.set('a', `${l ? EM.fix(M.deg(Math.acos(m / Math.sqrt(l * (l + 1)))), 2) + '°' : '—'} · ${l}`);
      sim.set('p', `${l % 2 ? '−1' : '+1'} · ${EM.fix(100 * pc, 3)} %`);
    });
  });

  /* 12.2 Modelo vectorial y relaciones de incertidumbre de L */
  EM.defineSim('vectorial', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('l', { label: 'Número cuántico l', min: 1, max: 12, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Número cuántico m', min: -12, max: 12, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('L', '|<b>L</b>|² = <i>l</i>(<i>l</i> + 1)ħ² · <i>L</i><sub>z</sub> = <i>m</i>ħ · |<b>L</b>| / (<i>l</i>ħ) (límite clásico → 1)', { hl: true });
    sim.out('x', '⟨<i>L</i><sub>x</sub>²⟩ = ⟨<i>L</i><sub>y</sub>²⟩ = ½[<i>l</i>(<i>l</i> + 1) − <i>m</i>²]ħ² · Δ<i>L</i><sub>x</sub> = Δ<i>L</i><sub>y</sub>');
    sim.out('r', 'Robertson: Δ<i>L</i><sub>x</sub>Δ<i>L</i><sub>y</sub> ≥ ½|⟨<i>L</i><sub>z</sub>⟩|ħ = |<i>m</i>|ħ²/2 (en unidades ħ²) · cociente');
    let t = 0; sim.animate((dt) => { t += dt * 1.1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, l = Math.round(p.l), m = Math.max(-l, Math.min(l, Math.round(p.m))), L = Math.sqrt(l * (l + 1)), W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* vista lateral: eje z vertical, conos para cada m */
      const cx = W * 0.3, cy = H * 0.5, sc = Math.min(W * 0.22, H * 0.42) / (L + 0.2);
      ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - (l + 1) * sc); ctx.lineTo(cx, cy + (l + 1) * sc); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'z', cx + 6, cy - (l + 1) * sc + 8, { size: 12, color: '--ink-2' });
      for (let k = -l; k <= l; k++) {
        const y = cy - k * sc, rr = Math.sqrt(Math.max(0, L * L - k * k)) * sc, sel = k === m;
        ctx.save(); ctx.strokeStyle = sel ? EM.col('--accent') : EM.alpha('--ink-3', 0.55); ctx.lineWidth = sel ? 2.2 : 1; ctx.beginPath(); ctx.ellipse(cx, y, rr, rr * 0.28, 0, 0, 2 * PI); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 5, y); ctx.lineTo(cx + 5, y); ctx.stroke(); ctx.restore();
        EM.text(ctx, String(k), cx - rr - 10 - (k < 0 ? 4 : 0), y + 4, { size: 10.5, color: sel ? '--accent' : '--ink-3', align: 'right' });
      }
      /* esfera de radio |L| */
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = EM.alpha('--ink-3', 0.6); ctx.beginPath(); ctx.arc(cx, cy, L * sc, 0, 2 * PI); ctx.stroke(); ctx.restore();
      /* vector L precesionando */
      const rr = Math.sqrt(Math.max(0, L * L - m * m)), ph = t, px = cx + rr * Math.cos(ph) * sc, py = cy - m * sc + rr * Math.sin(ph) * sc * 0.28;
      EM.draw.arrow(ctx, cx, cy, px, py, { color: '--accent', width: 2.8, head: 10 });
      EM.draw.arrow(ctx, cx, cy, cx, cy - m * sc, { color: '--c2', width: 2.2, head: 8 });
      EM.text(ctx, 'L', px + 6, py - 6, { size: 13, color: '--accent' }); EM.text(ctx, 'L_z = mħ', cx + 8, cy - m * sc * 0.5, { size: 11.5, color: '--c2' });
      /* barras de incertidumbre */
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: -0.5, xmax: 12.5, ymin: 0, ymax: Math.max(1, l * (l + 1) / 2 + 1), xlabel: 'l', ylabel: 'ΔL_x ΔL_y (ħ²) y cota |m|/2', ml: 52, mr: 8, title: 'Incertidumbre de Lₓ y L_y (estado |l, m⟩)' });
      pl.frame(); for (let k = 0; k <= 12; k++) pl.path([[k, 0], [k, 0.5 * (k * (k + 1) - m * m * (k >= Math.abs(m) ? 1 : 0))]], { color: k >= Math.abs(m) ? '--c1' : '--ink-3', width: 7 });
      pl.hline(Math.abs(m) / 2, { color: '--c2', dash: [4, 3], label: `cota |m|/2 = ${EM.fix(Math.abs(m) / 2, 1)}`, labelRight: true });
      const vx = 0.5 * (l * (l + 1) - m * m);
      sim.set('L', `${l * (l + 1)}ħ² (|L| = ${EM.fix(L, 4)}ħ) · ${m}ħ · ${EM.fix(L / l, 4)}`);
      sim.set('x', `${EM.fix(vx, 3)}ħ² · ${EM.fix(Math.sqrt(vx), 4)}ħ`);
      sim.set('r', `${EM.fix(vx, 3)} ≥ ${EM.fix(Math.abs(m) / 2, 3)} · ${Math.abs(m) > 0 ? EM.fix(vx / (Math.abs(m) / 2), 3) : '∞ (cota nula)'}${Math.abs(m) === l ? ' (mínimo: m = ±l)' : ''}`);
    });
  });

  /* 12.3 Rotor rígido: paquete angular, renacimientos y alineamiento molecular */
  const ROT = { CO: ['CO', 1.9313, 6.8562], HCl: ['H³⁵Cl', 10.5934, 0.97959], N2: ['N₂', 1.9987, 7.0034], I2: ['I₂', 0.0374, 63.452] };
  EM.defineSim('rotor-paquete', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('mol', { label: 'Molécula (constante rotacional B)', options: Object.entries(ROT).map(([k, v]) => [k, v[0] + ' (B = ' + v[1] + ' cm⁻¹)']), value: 'CO' });
    sim.slider('l0', { label: 'Estado rotacional central del paquete l₀', min: 0, max: 20, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Anchura del paquete en l (σ)', min: 0.5, max: 6, step: 0.1, value: 2, fmt: (v) => EM.fix(v, 1) });
    sim.out('T', 'Tiempo de renacimiento 1/(2<i>cB</i>) (la dinámica es periódica) · I = ħ/(4π<i>cB</i>)', { hl: true });
    sim.out('r', 'Longitud de enlace √(<i>I</i>/μ) · energía de la transición 0 → 1: 2<i>B</i>');
    sim.out('c', '⟨cos²θ⟩ en este instante (1/3: orientación al azar) · máximo y mínimo en un periodo');
    let t = 0; sim.resetButton(() => { t = 0; }); sim.animate((dt) => { t = (t + dt * 0.04) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, B, mu] = ROT[p.mol], NL = 50, l0 = Math.round(p.l0);
      EM.draw.clear(cv);
      let nrm = 0; const c = []; for (let l = 0; l < NL; l++) { const a = Math.exp(-((l - l0) ** 2) / (4 * p.s * p.s)) * (l % 2 === 0 ? 1 : 0); c.push([a, 0]); nrm += a * a; } /* solo l pares (m = 0, simetría de inversión) */
      const sn = Math.sqrt(nrm || 1); c.forEach((v) => { v[0] /= sn; });
      /* en unidades B: fase e^{−iB l(l+1) t}, periodo 2π/(2B)·... → t en unidades de renacimiento T = π/B(ħ=1) */
      const Bu = 1, Trev = PI / Bu, ts = Array.from({ length: 401 }, (_, i) => (Trev * i) / 400), vals = ts.map((u) => AN.cos2(c, Bu, u));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.62, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 't / T_ren', ylabel: '⟨cos²θ⟩', ml: 46, mr: 8, title: 'Alineamiento molecular y renacimientos' });
      pl.frame(); pl.hline(1 / 3, { color: '--ink-3', dash: [4, 3], label: '1/3 (al azar)', labelRight: true });
      pl.xy(ts.map((u) => u / Trev), vals, { color: '--accent', width: 2.4 }); pl.dot(t, AN.cos2(c, Bu, t * Trev), { color: '--c2' });
      /* distribución angular |Ψ(θ)|² en este instante (m = 0) */
      const cx = cv.w * 0.81, cy = cv.h * 0.5, R = Math.min(cv.w * 0.16, cv.h * 0.42), tau = t * Trev;
      const th = Array.from({ length: 181 }, (_, i) => (PI * i) / 180), dens = th.map((q) => { let re = 0, im = 0; for (let l = 0; l < NL; l += 2) { if (!c[l][0]) continue; const ph = -Bu * l * (l + 1) * tau, f = c[l][0] * Math.sqrt((2 * l + 1) / (4 * PI)) * S.legendre(l, 0, Math.cos(q)); re += f * Math.cos(ph); im += f * Math.sin(ph); } return re * re + im * im; }), dm = Math.max(...dens) || 1;
      ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - R - 8); ctx.lineTo(cx, cy + R + 8); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.beginPath(); th.forEach((q, i) => { const r = (dens[i] / dm) * R, x = cx + r * Math.sin(q), y = cy - r * Math.cos(q); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); th.slice().reverse().forEach((q, i) => { const r = (dens[180 - i] / dm) * R, x = cx - r * Math.sin(q), y = cy - r * Math.cos(q); ctx.lineTo(x, y); }); ctx.closePath(); ctx.fillStyle = EM.alpha('--accent', 0.25); ctx.fill(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      EM.text(ctx, 'z (eje del campo)', cx, cy - R - 12, { size: 10.5, align: 'center', color: '--ink-3' });
      const hc = 2.99792458e10, Ihb = (1.054571817e-34) / (4 * PI * hc * B), r_ = Math.sqrt(Ihb / (mu * 1.66053906660e-27)) * 1e10;
      sim.set('T', `${EM.sci(1 / (2 * hc * B) * 1e12, 4)} ps · ${EM.sci(Ihb, 4)} kg·m²`);
      sim.set('r', `${EM.fix(r_, 4)} Å · ${EM.fix(2 * B, 4)} cm⁻¹ (${EM.fix(2 * B * hc / 1e9, 2)} GHz)`);
      sim.set('c', `${EM.fix(AN.cos2(c, Bu, tau), 4)} · ${EM.fix(Math.max(...vals), 4)} y ${EM.fix(Math.min(...vals), 4)}`);
    });
  });
})();
