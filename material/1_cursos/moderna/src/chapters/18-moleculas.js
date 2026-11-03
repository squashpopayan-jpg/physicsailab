/* Capítulo 18 — Moléculas: enlace, rotación y vibración */
(function () {
  'use strict';
  const EM = window.EM, M = EM.fm.mol, K = EM.qm.K, c = K.c, h = K.h, kB = K.kB, HA = M.HA_EV;

  /* 18.1 Enlace en H₂⁺ */
  EM.defineSim('enlace', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('R', { label: 'Distancia internuclear R', min: 0.5, max: 8, step: 0.01, value: 2.49, unit: 'a₀', fmt: (v) => EM.fix(v, 2) });
    sim.seg('o', { label: 'Orbital molecular mostrado', options: [['g', 'σ_g (enlazante)'], ['u', 'σ_u (antienlazante)']], value: 'g' });
    sim.out('E', 'Energía electrónica + repulsión nuclear E(R) respecto de H + H⁺ (eV)', { hl: true });
    sim.out('S', 'Solapamiento S · integral de Coulomb · integral de intercambio');
    sim.out('b', 'Mínimo LCAO: R_e · D_e (valor exacto: 1.997 a₀ · 2.793 eV)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = p.R, b = M.bond(), sg = p.o === 'g' ? 1 : -1;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0.5, xmax: 8, ymin: -2.4, ymax: 6, xlabel: 'R (a₀)', ylabel: 'E(R) − E(H + H⁺) (eV)', ml: 56, mr: 8, title: 'Curvas de energía LCAO' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [4, 3] });
      pl.fn((r) => (M.Eplus(r) + 0.5) * HA, { color: '--c1', width: 2.8, n: 300 }); pl.fn((r) => (M.Eminus(r) + 0.5) * HA, { color: '--c3', width: 2.8, n: 300 });
      pl.dot(b.Re, -b.De * HA, { color: '--c2', r: 5 }); pl.label(b.Re + 0.2, -b.De * HA - 0.3, `R_e = ${EM.fix(b.Re, 2)} a₀`, { color: '--c2' });
      pl.dot(R, ((sg > 0 ? M.Eplus(R) : M.Eminus(R)) + 0.5) * HA, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'σ_g (enlazante)', color: '--c1' }, { label: 'σ_u (antienlazante)', color: '--c3' }], 'tr');
      // densidad electrónica |ψ|² en el plano (z, ρ)
      const x0 = W * 0.54, wd = W * 0.44, ht = H * 0.78, y0 = H * 0.08, NX = 110, NY = 80, ext = 4.2; let mx = 0; const val = new Float64Array(NX * NY);
      for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++) { const z = ((ix + 0.5) / NX * 2 - 1) * ext, rho = Math.abs((iy + 0.5) / NY * 2 - 1) * ext * ht / wd * 2 * 0.55; const v = M.psi(R, z, rho, sg), d = v * v; val[iy * NX + ix] = d; if (d > mx) mx = d; }
      EM.heat(ctx, { x: x0, y: y0, w: wd, h: ht }, NX, NY, (ix, iy) => Math.sqrt(val[iy * NX + ix] / mx), { cmap: 'inferno' });
      const cxm = x0 + wd / 2, cym = y0 + ht / 2, sc = wd / (2 * ext);
      for (const s of [-1, 1]) { ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(cxm + s * R / 2 * sc, cym, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); }
      EM.text(ctx, `densidad electrónica de ${sg > 0 ? 'σ_g' : 'σ_u'} (cuadrado de la raíz de |ψ|²)`, x0 + wd / 2, H - 8, { size: 11.5, align: 'center', color: '--ink-3' });
      sim.set('E', `${EM.fix(((sg > 0 ? M.Eplus(R) : M.Eminus(R)) + 0.5) * HA, 3)} eV (${p.o === 'g' ? 'σ_g' : 'σ_u'})`);
      sim.set('S', `${EM.fix(M.S(R), 4)} · ${EM.fix(M.jInt(R), 4)} · ${EM.fix(M.kInt(R), 4)}`);
      sim.set('b', `${EM.fix(b.Re, 3)} a₀ (${EM.fix(b.Re * 0.529177, 3)} Å) · ${EM.fix(b.De * HA, 3)} eV`);
    });
  });

  /* 18.2 Espectro rotacional */
  const MOL = { CO: ['CO (¹²C¹⁶O)', 1.92253, 6.8562086, 'none'], C13: ['¹³C¹⁶O', 1.83669, 7.1724125, 'none'], HCl: ['H³⁵Cl', 10.4401, 0.9795925, 'none'], N2: ['N₂ (¹⁴N₂)', 1.98957, 7.001537, 'N2'], H2: ['H₂', 59.322, 0.5039125, 'H2'] };
  EM.defineSim('rotacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('mol', { label: 'Molécula (constante B₀ medida)', options: Object.entries(MOL).map(([k, v]) => [k, `${v[0]} · B₀ = ${v[1]} cm⁻¹`]), value: 'CO' });
    sim.slider('T', { label: 'Temperatura', min: 10, max: 1000, step: 1, value: 300, log: true, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('B', 'Constante rotacional B₀ · I = ħ²/2hcB₀ · distancia r₀ = √(I/μ)', { hl: true });
    sim.out('J', 'Nivel de máxima población J_max = √(kT/2hcB) − ½ · función de partición');
    sim.out('l', 'Primeras líneas de absorción 2B(J + 1): frecuencia (GHz)');
    sim.out('o', 'Estadística nuclear (peso de J par : impar)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, B, mu, ns] = MOL[p.mol], w = M.NS[ns];
      EM.draw.clear(cv);
      const Jm = Math.min(40, Math.ceil(M.Jmax(B, p.T) * 3 + 8)), Js = [...Array(Jm + 1).keys()], pop = Js.map((J) => M.pop(B, p.T, J, w)), ymx = Math.max(...pop) * 1.15;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -0.5, xmax: Jm + 0.5, ymin: 0, ymax: ymx, xlabel: 'J', ylabel: 'población N_J/N', ml: 56, mr: 8, title: 'Población térmica de los niveles' });
      pl.frame(); Js.forEach((J) => pl.xy([J, J], [0, pop[J]], { color: J % 2 && ns !== 'none' ? '--c3' : '--c1', width: 5 }));
      pl.vline(M.Jmax(B, p.T), { color: '--ink-3', dash: [4, 3], label: 'J_max' });
      const lines = Js.slice(0, Jm).map((J) => ({ nu: 2 * B * (J + 1), I: (J + 1) * M.pop(B, p.T, J, [1, 1]) })), imx = Math.max(...lines.map((q) => q.I)) * 1.15;
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 2 * B * (Jm + 1), ymin: 0, ymax: imx, xlabel: 'número de onda (cm⁻¹)', ylabel: 'intensidad relativa', ml: 56, mr: 8, title: 'Espectro de absorción rotacional (J → J + 1)' });
      pr.frame(); lines.forEach((q) => pr.xy([q.nu, q.nu], [0, q.I], { color: '--accent', width: 3 }));
      const I = (h / (8 * Math.PI * Math.PI * c * 100 * B)), r0 = Math.sqrt(I / (mu * K.u));
      sim.set('B', `${B} cm⁻¹ · ${EM.sci(I, 3)} kg m² · ${EM.fix(r0 * 1e10, 4)} Å`);
      sim.set('J', `${EM.fix(M.Jmax(B, p.T), 2)} · ${EM.fix(M.partition(B, p.T, [1, 1]), 2)}`);
      sim.set('l', [0, 1, 2].map((J) => EM.fix(2 * B * (J + 1) * c * 100 / 1e9, 3)).join(' · '));
      sim.set('o', ns === 'none' ? 'sin restricción (núcleos distintos)' : ns === 'H2' ? '1 : 3 (para-H₂ en J par, orto-H₂ en J impar, fermiones I = ½)' : '6 : 3 = 2 : 1 (bosones ¹⁴N, I = 1)');
    });
  });

  /* 18.3 Vibración–rotación y Raman rotacional */
  const SPEC = { HCl: ['H³⁵Cl (infrarrojo, v 0 → 1)', { we: 2990.946, wexe: 52.8186, Be: 10.5934, alpha: 0.30718, Dcd: 5.319e-4, beta: 0 }, 'ir'], CO: ['¹²C¹⁶O (infrarrojo, v 0 → 1)', { we: 2169.8133, wexe: 13.2883, Be: 1.93128, alpha: 0.017504, Dcd: 6.12e-6, beta: 0 }, 'ir'], N2: ['¹⁴N₂ (Raman rotacional)', { Be: 1.99824, B0: 1.98957 }, 'raman'] };
  EM.defineSim('rovib', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('mol', { label: 'Espectro', options: Object.entries(SPEC).map(([k, v]) => [k, v[0]]), value: 'HCl' });
    sim.slider('T', { label: 'Temperatura', min: 50, max: 1000, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('o', 'Origen de la banda ν₀ = ω_e − 2ω_ex_e · primeras líneas R(0), R(1), P(1), P(2) (cm⁻¹)', { hl: true });
    sim.out('g', 'Hueco central ≈ 4B (ausencia de la línea Q: ΔJ = 0 prohibida en un diatómico ¹Σ) · separación entre líneas');
    sim.out('i', 'Línea más intensa de cada rama');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, d, kind] = SPEC[p.mol];
      EM.draw.clear(cv);
      if (kind === 'ir') {
        const ln = M.lines(d, p.T, 16), nu0 = M.G(d, 1) - M.G(d, 0), imx = Math.max(...ln.map((q) => q.I)), lo = Math.min(...ln.map((q) => q.nu)) - 2 * d.Be, hi = Math.max(...ln.map((q) => q.nu)) + 2 * d.Be;
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: lo, xmax: hi, ymin: 0, ymax: 1.15, xlabel: 'número de onda (cm⁻¹)', ylabel: 'absorbancia relativa', ml: 56, mr: 10, title: 'Banda fundamental de vibración–rotación' });
        pl.frame(); ln.filter((q) => q.I / imx > 0.005).forEach((q) => pl.xy([q.nu, q.nu], [0, q.I / imx], { color: q.br === 'R' ? '--c1' : '--c3', width: 3.2 }));
        pl.vline(nu0, { color: '--ink-3', dash: [4, 3], label: 'ν₀' }); pl.legend([{ label: 'rama R (J → J + 1)', color: '--c1' }, { label: 'rama P (J → J − 1)', color: '--c3' }], 'tr');
        const R = (J) => ln.find((q) => q.br === 'R' && q.J === J).nu, P = (J) => ln.find((q) => q.br === 'P' && q.J === J).nu, mxR = ln.filter((q) => q.br === 'R').sort((a, b) => b.I - a.I)[0], mxP = ln.filter((q) => q.br === 'P').sort((a, b) => b.I - a.I)[0];
        sim.set('o', `${EM.fix(nu0, 2)} · ${EM.fix(R(0), 2)}, ${EM.fix(R(1), 2)}, ${EM.fix(P(1), 2)}, ${EM.fix(P(2), 2)}`);
        sim.set('g', `${EM.fix(R(0) - P(1), 2)} cm⁻¹ (4B = ${EM.fix(4 * d.Be, 2)}) · ${EM.fix(R(1) - R(0), 2)} cm⁻¹ (algo menos de 2B)`);
        sim.set('i', `R(${mxR.J}) en ${EM.fix(mxR.nu, 2)} · P(${mxP.J}) en ${EM.fix(mxP.nu, 2)}`);
      } else {
        const B = d.B0, ln = M.ramanLines(B, p.T, M.NS.N2, 24), imx = Math.max(...ln.map((q) => q.I)), span = B * (4 * 24 + 6);
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -span, xmax: span, ymin: 0, ymax: 1.15, xlabel: 'desplazamiento Raman (cm⁻¹; negativo: Stokes)', ylabel: 'intensidad relativa', ml: 56, mr: 10, title: 'Raman rotacional del N₂ (alternancia 2 : 1 por espín nuclear)' });
        pl.frame(); ln.forEach((q) => { const x = q.stokes !== undefined ? q.stokes : q.antistokes; pl.xy([x, x], [0, q.I / imx], { color: q.J % 2 ? '--c3' : '--c1', width: 3.2 }); });
        pl.vline(0, { color: '--ink-3', dash: [4, 3], label: 'láser' });
        sim.set('o', `líneas Stokes en ${[0, 1, 2, 3].map((J) => '−' + EM.fix(M.ramanShift(B, J), 2)).join(', ')} cm⁻¹ (B(4J + 6))`);
        sim.set('g', `primera línea a ±${EM.fix(6 * B, 2)} cm⁻¹ del láser (6B) · separación entre líneas 4B = ${EM.fix(4 * B, 2)} cm⁻¹`);
        sim.set('i', `razón de intensidades de las dos primeras líneas Stokes (J = 0, 1) = ${EM.fix(ln.filter((q) => q.stokes !== undefined)[0].I / ln.filter((q) => q.stokes !== undefined)[1].I, 3)}`);
      }
    });
  });
})();
