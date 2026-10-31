/* Capítulo 28 — Átomos de muchos electrones */
(function () {
  'use strict';
  const EM = window.EM, HF = EM.qm.hf, PI = Math.PI, EHEV = 27.211386246;
  const SYM = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
  const IE = [13.598, 24.587, 5.392, 9.323, 8.298, 11.260, 14.534, 13.618, 17.423, 21.565, 5.139, 7.646, 5.986, 8.152, 10.487, 10.360, 12.968, 15.760, 4.341, 6.113, 6.561, 6.828, 6.746, 6.767, 7.434, 7.902, 7.881, 7.640, 7.726, 9.394, 5.999, 7.899, 9.789, 9.752, 11.814, 14.000];
  const HFL = { 2: [-2.86168, -0.91795], 3: [-7.23641, -2.79236], 4: [-13.61129, -5.66711], 5: [-21.98622, -9.54197], 6: [-32.36118, -14.41688] };
  const EX = { 2: -2.903724377, 3: -7.279913413, 4: -13.655566239, 5: -22.030971580, 6: -32.406246602 };
  /* excepciones del llenado de Madelung hasta Z = 36 */
  const EXC = { 24: '[Ar] 3d⁵ 4s¹', 29: '[Ar] 3d¹⁰ 4s¹' };

  /* 28.1 Hartree–Fock del helio y de los iones de dos electrones */
  EM.defineSim('hf-dos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Z', { label: 'Carga nuclear Z (He, Li⁺, Be²⁺, B³⁺, C⁴⁺)', min: 2, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('N', { label: 'Número de gaussianas de la base N', min: 1, max: 10, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.slider('a1', { label: 'Exponente menor a₁ (la serie es a_i = a₁β^{i−1})', min: 0.01, max: 0.5, step: 0.005, value: 0.05, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.slider('b', { label: 'Razón β entre exponentes', min: 1.8, max: 6, step: 0.1, value: 3.2, fmt: (v) => EM.fix(v, 1) });
    sim.out('e', 'Energía Hartree–Fock <i>E</i><sub>HF</sub> (hartree) · energía exacta (no relativista) · energía de correlación <i>E</i><sub>c</sub> = <i>E</i><sub>exacta</sub> − <i>E</i><sub>HF</sub>', { hl: true });
    sim.out('k', 'Energía del orbital ε (teorema de Koopmans: −ε ≈ energía de ionización de un electrón) · potencial de ionización experimental <i>I</i> = −<i>Z</i>²/2 − <i>E</i><sub>exacta</sub>');
    sim.out('v', 'Comparación con el modelo variacional de un parámetro (ζ = Z − 5/16): −(Z − 5/16)² · error de la carga efectiva');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(sim.p.Z), N = Math.round(sim.p.N), ex = HF.eventemp(N, sim.p.a1, sim.p.b), r = HF.rhf(ex, Z);
      EM.draw.clear(cv);
      const Eex = EX[Z], zeta = Z - 5 / 16, nrm = (() => { let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += r.c[i] * r.c[j] * Math.pow(PI / (ex[i] + ex[j]), 1.5); return 1 / Math.sqrt(s); })();
      const psiHF = (x) => nrm * ex.reduce((s, a, i) => s + r.c[i] * Math.exp(-a * x * x), 0), psiH = (x) => Math.pow(zeta, 1.5) / Math.sqrt(PI) * Math.exp(-zeta * x);
      const xmax = 6 / Z + 1.5, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: xmax, ymin: 0, ymax: Math.max(psiHF(0), psiH(0)) * 1.15, xlabel: 'r (a₀)', ylabel: 'ψ(r) del orbital 1s', ml: 52, mr: 8, title: 'Orbital Hartree–Fock frente al hidrogenoide óptimo' });
      pl.frame(); pl.fn(psiH, { color: '--c2', width: 2, dash: [5, 3] }); pl.fn(psiHF, { color: '--accent', width: 2.4 }); pl.legend([{ label: 'Hartree–Fock (gaussianas)', color: '--accent' }, { label: 'e^{−ζr}, ζ = Z − 5/16', color: '--c2', dash: [5, 3] }], 'tr');
      const Ns = [], Es = []; for (let n = 1; n <= 10; n++) { const q = HF.rhf(HF.eventemp(n, sim.p.a1, sim.p.b), Z); Ns.push(n); Es.push(Math.log10(Math.max(q.E - r.E - 1e-9 + (Math.abs(q.E - r.E) < 1e-9 ? 0 : 0), 1e-9) + 1e-12)); }
      const Eref = Es.length ? null : null; const q2 = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.5, xmax: 10.5, ymin: Math.min(-0.5 * Z * Z - 2 * Z, -50), ymax: 0, xlabel: 'N', ylabel: 'E_HF (hartree)', ml: 56, mr: 8, title: 'Convergencia con el tamaño de la base' });
      const vals = Ns.map((n) => HF.rhf(HF.eventemp(n, sim.p.a1, sim.p.b), Z).E); q2.set({ ymin: Math.min(...vals, Eex) - 0.05 * Math.abs(Eex), ymax: Math.max(...vals, Eex) + 0.1 * Math.abs(Eex) }); q2.frame(); q2.xy(Ns, vals, { color: '--accent', width: 2.2 }); Ns.forEach((n, i) => q2.dot(n, vals[i], { color: n === N ? '--c3' : '--accent', r: n === N ? 5.5 : 3 })); q2.hline(Eex, { color: '--c2', dash: [5, 3], label: 'exacta', labelRight: true });
      const Elim = HFL[Z][0];
      sim.set('e', `${EM.fix(r.E, 6)} (límite HF: ${EM.fix(Elim, 5)}; error de la base ${EM.fix((r.E - Elim) * 1000, 3)} mEh) · exacta ${EM.fix(Eex, 6)} · E_c = ${EM.fix(Eex - Elim, 5)} (${EM.fix(EHEV * (Eex - Elim), 3)} eV)`);
      sim.set('k', `${EM.fix(r.eps, 5)} (límite: ${EM.fix(HFL[Z][1], 5)}; −ε = ${EM.fix(-r.eps * EHEV, 3)} eV) · I = ${EM.fix((-(Z * Z) / 2 - Eex) * EHEV, 3)} eV`);
      sim.set('v', `${EM.fix(-(zeta * zeta), 6)} · E_HF(base) − E_var = ${EM.fix((r.E + zeta * zeta) * EHEV, 3)} eV`);
    });
  });

  /* 28.2 Tabla periódica: potenciales de ionización y llenado de capas */
  EM.defineSim('periodica', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Z', { label: 'Número atómico Z (1–36)', min: 1, max: 36, step: 1, value: 11, fmt: (v) => v.toFixed(0) + ' (' + SYM[v - 1] + ')' });
    sim.out('c', 'Configuración electrónica (regla de Madelung: se llena en orden creciente de <i>n</i> + <i>l</i>) y excepción experimental si la hay', { hl: true });
    sim.out('i', 'Primer potencial de ionización medido (eV) · tamaño del orbital más externo según Slater, ⟨<i>r</i>⟩ ≈ <i>n</i>*²/<i>Z</i><sub>ef</sub> (a₀)');
    sim.out('z', 'Carga efectiva de Slater <i>Z</i><sub>ef</sub> del electrón más externo y su nivel (n*, l) · electrones de valencia');
    const outer = (conf) => { let best = conf[0]; for (const c of conf) if (c[0] > best[0] || (c[0] === best[0] && c[1] > best[1])) best = c; return best; };
    const est = (Z) => { const conf = HF.madelung(Z), [n, l] = outer(conf), ze = HF.slaterZeff(Z, conf, n, l); return { n, l, ze, E: (13.605693 * ze * ze) / HF.nstar(n) ** 2 }; };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(sim.p.Z), conf = HF.madelung(Z), s = est(Z);
      EM.draw.clear(cv);
      const zs = Array.from({ length: 36 }, (_, i) => i + 1), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: 0.5, xmax: 36.5, ymin: 0, ymax: 27, xlabel: 'Z', ylabel: 'primer potencial de ionización (eV)', ml: 52, mr: 8, title: 'Los picos son los gases nobles; los mínimos, los alcalinos' });
      pl.frame(); pl.xy(zs, IE, { color: '--accent', width: 2 }); zs.forEach((z, i) => pl.dot(z, IE[i], { color: z === Z ? '--c3' : '--accent', r: z === Z ? 6 : 3 }));
      [2, 10, 18, 36].forEach((z) => pl.label(z, IE[z - 1], SYM[z - 1], { size: 11, dy: -9, align: 'center', color: '--ink-2' })); [3, 11, 19].forEach((z) => pl.label(z, IE[z - 1], SYM[z - 1], { size: 11, dy: 16, align: 'center', color: '--ink-2' }));
      /* capas */
      const bx = W * 0.7, by = H * 0.1, rowh = H * 0.07; EM.text(ctx, `Z = ${Z} (${SYM[Z - 1]})`, bx, by, { size: 13, color: '--accent' });
      conf.forEach(([n, l, k], i) => { const y = by + 18 + i * rowh, wmax = W * 0.25, cap = 2 * (2 * l + 1); EM.text(ctx, `${n}${'spdf'[l]}`, bx, y + rowh * 0.6, { size: 11.5, color: '--ink-2' }); for (let j = 0; j < cap; j++) { ctx.save(); ctx.fillStyle = j < k ? EM.col('--accent') : EM.alpha('--ink-3', 0.25); ctx.fillRect(bx + 28 + j * (wmax / 14), y + rowh * 0.2, wmax / 14 - 3, rowh * 0.55); ctx.restore(); } });
      sim.set('c', HF.confString(conf) + (EXC[Z] ? `  —  experimental: ${EXC[Z]} (el semillenado de 3d es más favorable)` : ''));
      sim.set('i', `${EM.fix(IE[Z - 1], 3)} eV · ${EM.fix(HF.nstar(s.n) ** 2 / s.ze, 3)} a₀`);
      sim.set('z', `Z_ef = ${EM.fix(s.ze, 2)} · (n* = ${HF.nstar(s.n)}, l = ${'spdf'[s.l]}) · ${conf.filter((c) => c[0] === s.n).reduce((t, c) => t + c[2], 0)} en la capa n = ${s.n}`);
    });
  });

  /* 28.3 Apantallamiento: Z_ef de cada subcapa según Slater */
  EM.defineSim('slater', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Z', { label: 'Número atómico Z', min: 3, max: 36, step: 1, value: 19, fmt: (v) => v.toFixed(0) + ' (' + SYM[v - 1] + ')' });
    sim.out('t', 'Carga efectiva y energía del orbital según Slater para cada subcapa ocupada: <i>E</i> = −13.606 <i>Z</i><sub>ef</sub>²/<i>n</i>*² (eV)', { hl: true });
    sim.out('p', 'Penetración: la subcapa 4s tiene <i>Z</i><sub>ef</sub> mayor que la 3d desde Z = 19 (K): por eso se llena antes. Comparación en el elemento elegido');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(sim.p.Z), conf = HF.madelung(Z);
      EM.draw.clear(cv);
      const rows = conf.map(([n, l, k]) => { const ze = HF.slaterZeff(Z, conf, n, l); return { n, l, k, ze, E: -(13.605693 * ze * ze) / HF.nstar(n) ** 2 }; });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: rows.length + 1, ymin: 0, ymax: Math.max(...rows.map((r) => r.ze)) * 1.15, xlabel: '', ylabel: 'Z_ef (carga efectiva de Slater)', ml: 52, mr: 8, title: `Apantallamiento en ${SYM[Z - 1]} (Z = ${Z})` });
      pl.frame(); rows.forEach((r, i) => { pl.path([[i + 1, 0], [i + 1, r.ze]], { color: r.l === 0 ? '--accent' : r.l === 1 ? '--c2' : '--c3', width: 22 }); pl.label(i + 1, 0, `${r.n}${'spdf'[r.l]}`, { size: 11, dy: 14, align: 'center', color: '--ink-2' }); pl.label(i + 1, r.ze, EM.fix(r.ze, 2), { size: 10.5, dy: -8, align: 'center', color: '--ink' }); });
      const q = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: rows.length + 1, ymin: Math.min(...rows.map((r) => r.E)) * 1.1, ymax: 0, xlabel: '', ylabel: 'E (eV)', ml: 50, mr: 8, title: 'Energías orbitales de Slater' });
      q.frame(); rows.forEach((r, i) => { q.path([[i + 0.55, r.E], [i + 1.45, r.E]], { color: r.l === 0 ? '--accent' : r.l === 1 ? '--c2' : '--c3', width: 3 }); q.label(i + 1, r.E, `${r.n}${'spdf'[r.l]}`, { size: 10.5, dy: -8, align: 'center', color: '--ink-2' }); });
      const s4 = rows.find((r) => r.n === 4 && r.l === 0), d3 = rows.find((r) => r.n === 3 && r.l === 2);
      sim.set('t', rows.map((r) => `${r.n}${'spdf'[r.l]}: ${EM.fix(r.ze, 2)} (${EM.fix(r.E, 1)} eV)`).join(' · '));
      sim.set('p', s4 && d3 ? `4s: Z_ef = ${EM.fix(s4.ze, 2)} (E = ${EM.fix(s4.E, 2)} eV) · 3d: Z_ef = ${EM.fix(d3.ze, 2)} (E = ${EM.fix(d3.E, 2)} eV) → ${s4.E > d3.E ? '4s más alta que 3d (según Slater, pero la 4s se llena antes porque la 3d es más compacta)' : '4s más baja'}` : 'solo con 4s y 3d ocupados (Z ≥ 21)');
    });
  });
})();
