/* Capítulo 15 — Espín del electrón */
(function () {
  'use strict';
  const EM = window.EM, SP = EM.qm.spin, V = EM.V, M = EM.M, PI = Math.PI;

  /* 15.1 Esfera de Bloch y precesión de Larmor */
  EM.defineSim('bloch-esp', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const v3 = new EM.View3D(sim, cv, { radius: 1.45, az: M.rad(40), el: M.rad(20) });
    sim.slider('th', { label: 'Ángulo polar del espín inicial θ (grados)', min: 0, max: 180, step: 1, value: 60, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('ph', { label: 'Ángulo azimutal del espín inicial φ (grados)', min: 0, max: 360, step: 1, value: 0, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('tb', { label: 'Ángulo polar del campo B respecto de z (grados)', min: 0, max: 180, step: 1, value: 0, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('B', { label: 'Campo magnético B (tesla)', min: 0.001, max: 10, step: 0.001, value: 1, log: true, fmt: (v) => (v < 0.1 ? EM.fix(v * 1e3, 1) + ' mT' : EM.fix(v, 2) + ' T') });
    sim.out('b', 'Vector de Bloch ⟨<b>σ</b>⟩ = (⟨σ<sub>x</sub>⟩, ⟨σ<sub>y</sub>⟩, ⟨σ<sub>z</sub>⟩) en este instante · longitud', { hl: true });
    sim.out('p', 'Probabilidades de medir <i>S</i><sub>z</sub> = +ħ/2 y −ħ/2 · ⟨<i>S</i><sub>z</sub>⟩/ħ');
    sim.out('w', 'Frecuencia de Larmor del electrón ω = <i>g</i>μ<sub>B</sub><i>B</i>/ħ (rad/s) · <i>f</i> = ω/2π · periodo');
    sim.out('c', 'cos del ángulo entre ⟨<b>S</b>⟩ y <b>B</b> (se conserva) · sin² de ese ángulo');
    let tau = 0, trail = [];
    sim.resetButton(() => { tau = 0; trail = []; });
    sim.onChange = () => { trail = []; };
    sim.animate((dt) => { tau += dt * 1.5; });
    sim.onDraw(() => {
      const p = sim.p, th = M.rad(p.th), ph = M.rad(p.ph), tb = M.rad(p.tb);
      const nB = [Math.sin(tb), 0, Math.cos(tb)];
      const psi = SP.evolve(SP.nstate(th, ph), nB, tau), b = SP.bloch(psi);
      trail.push(b); if (trail.length > 160) trail.shift();
      v3.begin(); v3.axes({ len: 1.3, neg: 0 });
      v3.mesh((u, v) => [Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)], 0, PI, 24, 0, 2 * PI, 36, { fill: '--c5', alpha: 0.1, shade: false, wire: '--ink-3', wireAlpha: 0.22, wireEveryU: 4, wireEveryV: 6 });
      v3.arc([0, 0, 0], [1, 0, 0], [0, 1, 0], 1, 0, 2 * PI, { color: '--ink-3', width: 1.1, alpha: 0.7 });
      v3.arrow(V.scale(nB, -1.25), V.scale(nB, 1.25), { color: '--c2', width: 2.2, head: 11 });
      v3.text(V.scale(nB, 1.38), 'B', { size: 14, italic: true, color: '--c2', weight: 700, align: 'center', baseline: 'middle' });
      if (trail.length > 1) v3.polyline(trail, { color: '--accent', width: 1.6, alpha: 0.7 });
      v3.arrow([0, 0, 0], b, { color: '--accent', width: 3, head: 12 });
      v3.point(b, { color: '--accent', r: 5 });
      v3.text([0, 0, 1.12], '|↑⟩', { size: 12, color: '--ink-2', align: 'center', baseline: 'middle' });
      v3.text([0, 0, -1.12], '|↓⟩', { size: 12, color: '--ink-2', align: 'center', baseline: 'middle' });
      v3.render();
      const w = SP.larmor(2.00231930436, p.B), pu = (1 + b[2]) / 2, cang = V.dot(b, nB) / Math.max(1e-12, V.norm(b));
      sim.set('b', `(${EM.fix(b[0], 4)}, ${EM.fix(b[1], 4)}, ${EM.fix(b[2], 4)}) · ${EM.fix(V.norm(b), 4)}`);
      sim.set('p', `${EM.fix(100 * pu, 2)} % y ${EM.fix(100 * (1 - pu), 2)} % · ${EM.fix(b[2] / 2, 4)}`);
      sim.set('w', `${EM.sci(w, 4)} rad/s · ${EM.sci(w / (2 * PI), 4)} Hz · ${EM.sci((2 * PI) / w, 3)} s`);
      sim.set('c', `${EM.fix(cang, 4)} · ${EM.fix(100 * Math.sin(Math.acos(Math.max(-1, Math.min(1, cang)))) ** 2, 2)} %`);
    });
  });

  /* 15.2 Cadena de analizadores de Stern–Gerlach */
  EM.defineSim('sg-cadena', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Orientación del segundo analizador α respecto de z (grados)', min: 0, max: 180, step: 1, value: 45, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('b', { label: 'Orientación del tercer analizador β respecto de z (grados)', min: 0, max: 180, step: 1, value: 90, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('n', { label: 'Átomos lanzados (con sus espines ya en +z)', min: 100, max: 20000, step: 100, value: 4000, log: true, fmt: (v) => v.toFixed(0) });
    sim.out('p', 'P(pasa el 2.º) = cos²(α/2) · P(pasa el 3.º | pasó el 2.º) = cos²((β − α)/2)', { hl: true });
    sim.out('t', 'Fracción total que pasa los tres analizadores · sin el 2.º analizador: cos²(β/2)');
    sim.out('m', 'Simulación Monte Carlo: pasan el 2.º y el 3.º (de los lanzados) · fracción');
    let mc = null, seed = 12345;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const run = () => {
      const n = Math.round(sim.p.n), a = M.rad(sim.p.a), b = M.rad(sim.p.b), p2 = Math.cos(a / 2) ** 2, p3 = Math.cos((b - a) / 2) ** 2;
      let c2 = 0, c3 = 0; for (let i = 0; i < n; i++) if (rnd() < p2) { c2++; if (rnd() < p3) c3++; } mc = { n, c2, c3 };
    };
    sim.button('Lanzar los átomos', run);
    sim.resetButton(() => { mc = null; });
    sim.onChange = () => { mc = null; };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, a = M.rad(sim.p.a), b = M.rad(sim.p.b), p2 = Math.cos(a / 2) ** 2, p3 = Math.cos((b - a) / 2) ** 2;
      EM.draw.clear(cv);
      const x0 = W * 0.04, bw = W * 0.095, gap = W * 0.12, yc = H * 0.4, hmax = H * 0.3;
      const boxes = [[x0 + W * 0.04, 'z', 0], [x0 + W * 0.04 + bw + gap, `α = ${sim.p.a.toFixed(0)}°`, a], [x0 + W * 0.04 + 2 * (bw + gap), `β = ${sim.p.b.toFixed(0)}°`, b]];
      const frac = [1, p2, p2 * p3];
      let xPrev = x0;
      boxes.forEach(([bx, lab, ang], i) => {
        ctx.save(); ctx.fillStyle = EM.alpha('--c5', 0.25); ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 1.4;
        ctx.fillRect(bx, yc - hmax * 0.55, bw, hmax * 1.1); ctx.strokeRect(bx, yc - hmax * 0.55, bw, hmax * 1.1);
        const L = Math.min(bw, hmax) * 0.34; ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + bw / 2 - L * Math.sin(ang), yc + L * Math.cos(ang)); ctx.lineTo(bx + bw / 2 + L * Math.sin(ang), yc - L * Math.cos(ang)); ctx.stroke(); ctx.restore();
        EM.text(ctx, 'analizador ' + (i + 1), bx + bw / 2, yc - hmax * 0.7, { size: 11, align: 'center', color: '--ink-3' });
        EM.text(ctx, lab, bx + bw / 2, yc + hmax * 0.82, { size: 12, align: 'center', color: '--accent' });
        /* haz que entra */
        const f0 = i === 0 ? 1 : frac[i - 1];
        ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.45); const th = Math.max(1.5, hmax * 0.34 * f0); ctx.fillRect(xPrev, yc - th / 2, bx - xPrev, th); ctx.restore();
        EM.text(ctx, EM.fix(100 * f0, 1) + ' %', (xPrev + bx) / 2, yc - th / 2 - 8, { size: 11, align: 'center', color: '--ink-2' });
        xPrev = bx + bw;
      });
      { const th = Math.max(1.5, hmax * 0.34 * frac[2]); ctx.save(); ctx.fillStyle = EM.alpha('--c2', 0.55); ctx.fillRect(xPrev, yc - th / 2, W * 0.1, th); ctx.restore(); EM.text(ctx, EM.fix(100 * frac[2], 2) + ' %', xPrev + W * 0.05, yc - th / 2 - 8, { size: 11, align: 'center', color: '--c2' }); }
      /* P_total(α) para β fijo */
      const pl = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 180, ymin: 0, ymax: 1, xlabel: 'α (grados)', ylabel: 'fracción total que pasa', ml: 52, mr: 10, title: 'Efecto del analizador intermedio' });
      pl.frame(); pl.fn((al) => Math.cos(M.rad(al) / 2) ** 2 * Math.cos((b - M.rad(al)) / 2) ** 2, { color: '--c1', width: 2 });
      pl.hline(Math.cos(b / 2) ** 2, { color: '--ink-3', dash: [4, 3], label: 'sin el 2.º analizador', labelRight: true });
      pl.dot(sim.p.a, p2 * p3, { color: '--accent', r: 5 });
      sim.set('p', `${EM.fix(100 * p2, 2)} % · ${EM.fix(100 * p3, 2)} %`);
      sim.set('t', `${EM.fix(100 * p2 * p3, 3)} % · ${EM.fix(100 * Math.cos(b / 2) ** 2, 2)} %`);
      sim.set('m', mc ? `${mc.c2} y ${mc.c3} de ${mc.n} · ${EM.fix((100 * mc.c3) / mc.n, 2)} %` : 'pulse «Lanzar los átomos»');
    });
  });

  /* 15.3 El espinor cambia de signo con un giro de 2π: interferometría de neutrones */
  EM.defineSim('spinor-2pi', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('ph', { label: 'Ángulo φ girado por el espín en una de las ramas (grados)', min: 0, max: 720, step: 1, value: 360, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('L', { label: 'Longitud del tramo de campo L (cm), neutrones de 2200 m/s (λ = 1.80 Å)', min: 0.5, max: 10, step: 0.1, value: 2, fmt: (v) => EM.fix(v, 1) + ' cm' });
    sim.out('i', 'Intensidad relativa de salida cos²(φ/4) · cos(φ/2) (el signo de la amplitud)', { hl: true });
    sim.out('b', 'Campo B necesario en un tramo de longitud L (neutrón: γ<sub>n</sub> = 1.8325×10<sup>8</sup> rad s<sup>−1</sup> T<sup>−1</sup>) para girar φ');
    sim.out('s', 'Componentes del espinor tras el giro, partiendo de |+x⟩ y con el campo a lo largo de z');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, phi = M.rad(sim.p.ph);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: 720, ymin: 0, ymax: 1.05, xlabel: 'ángulo de giro φ (grados)', ylabel: 'intensidad (u. arb.)', ml: 52, mr: 10, title: 'Interferómetro de neutrones: cos²(φ/4)' });
      pl.frame(); pl.fn((x) => SP.neutron(M.rad(x)), { color: '--c1', width: 2.2 });
      pl.vline(360, { color: '--ink-3', dash: [4, 3] }); pl.label(368, 0.5, '2π: ¡intensidad nula!', { size: 11, color: '--ink-2' });
      pl.dot(sim.p.ph, SP.neutron(phi), { color: '--accent', r: 5 });
      const q = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 0, xmax: 720, ymin: -1.1, ymax: 1.1, xlabel: 'φ (grados)', ylabel: 'amplitud', ml: 48, mr: 8, title: 'Espinor girado alrededor de z' });
      q.frame(); q.hline(0, { color: '--axis' });
      const comp = (ph) => SP.evolve(SP.nstate(PI / 2, 0), [0, 0, 1], ph); /* |+x⟩ */
      const xs = [], ca = [], cb = []; for (let k = 0; k <= 144; k++) { const x = (720 * k) / 144, s = comp(M.rad(x)); xs.push(x); ca.push(s[0][0]); cb.push(s[1][0]); }
      q.xy(xs, ca, { color: '--c1', width: 1.8 }); q.xy(xs, cb, { color: '--c2', width: 1.8 }); q.vline(sim.p.ph, { color: '--accent', dash: [3, 3] });
      q.legend([{ label: 'Re ψ↑', color: '--c1' }, { label: 'Re ψ↓', color: '--c2' }], 'tr');
      const s = comp(phi), gam = 1.8324717e8, tt = (sim.p.L * 1e-2) / 2200, Bn = phi / (gam * tt);
      sim.set('i', `${EM.fix(SP.neutron(phi), 4)} · cos(φ/2) = ${EM.fix(Math.cos(phi / 2), 4)}`);
      sim.set('b', `${EM.fix(Bn * 1e3, 3)} mT (tiempo de vuelo ${EM.fix(tt * 1e6, 2)} µs)`);
      const cz = (z) => `${EM.fix(z[0], 4)} ${z[1] < 0 ? '−' : '+'} ${EM.fix(Math.abs(z[1]), 4)}i`;
      sim.set('s', `ψ = (${cz(s[0])}, ${cz(s[1])})`);
    });
  });
})();
