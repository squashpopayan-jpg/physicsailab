/* ===================================================================
   44-qm-spin.js — Espín ½ (EM.qm.spin). Un espinor es [[a_re, a_im], [b_re, b_im]] con base |↑⟩, |↓⟩ de σ_z.
   H = (ħ/2) w·σ  →  U(t) = cos(|w|t/2) − i sin(|w|t/2) ŵ·σ
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Sp = (qm.spin = {});
  /* Estado propio de n·σ con valor +1: (cos θ/2, e^{iφ} sin θ/2) */
  Sp.nstate = (th, ph = 0) => [[Math.cos(th / 2), 0], [Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph)]];
  /* Estado propio con valor −1 (ortogonal al anterior) */
  Sp.nstateMinus = (th, ph = 0) => [[-Math.sin(th / 2), 0], [Math.cos(th / 2) * Math.cos(ph), Math.cos(th / 2) * Math.sin(ph)]];
  /* Vector de Bloch (⟨σx⟩, ⟨σy⟩, ⟨σz⟩) de un espinor normalizado */
  Sp.bloch = function (p) {
    const [[ar, ai], [br, bi]] = p;
    return [2 * (ar * br + ai * bi), 2 * (ar * bi - ai * br), ar * ar + ai * ai - br * br - bi * bi];
  };
  Sp.norm2 = (p) => p[0][0] ** 2 + p[0][1] ** 2 + p[1][0] ** 2 + p[1][1] ** 2;
  /* Evolución con U = exp(−i (t/2) w·σ), w = [wx, wy, wz] (rad por unidad de tiempo) */
  Sp.evolve = function (p, w, t) {
    const W = Math.hypot(w[0], w[1], w[2]);
    if (W < 1e-300) return [p[0].slice(), p[1].slice()];
    const c = Math.cos((W * t) / 2), s = Math.sin((W * t) / 2), nx = w[0] / W, ny = w[1] / W, nz = w[2] / W;
    const [[ar, ai], [br, bi]] = p;
    /* (n·σ)ψ = [nz a + (nx − i ny) b, (nx + i ny) a − nz b] */
    const ur = nz * ar + nx * br + ny * bi, ui = nz * ai + nx * bi - ny * br;
    const vr = nx * ar - ny * ai - nz * br, vi = nx * ai + ny * ar - nz * bi;
    /* ψ' = c ψ − i s (n·σ)ψ  →  parte real: c·re + s·im(n·σψ) ; imaginaria: c·im − s·re(n·σψ) */
    return [[c * ar + s * ui, c * ai - s * ur], [c * br + s * vi, c * bi - s * vr]];
  };
  /* Probabilidad de hallar +ħ/2 sobre la dirección (θ, φ) */
  Sp.prob = function (p, th, ph = 0) {
    const q = Sp.nstate(th, ph);
    const re = q[0][0] * p[0][0] + q[0][1] * p[0][1] + q[1][0] * p[1][0] + q[1][1] * p[1][1], im = q[0][0] * p[0][1] - q[0][1] * p[0][0] + q[1][0] * p[1][1] - q[1][1] * p[1][0];
    return (re * re + im * im) / Sp.norm2(p);
  };
  /* Probabilidad de pasar por una cadena de analizadores Stern–Gerlach coplanares (ángulos en rad, desde el primero) */
  Sp.chain = function (angles) {
    let P = 1;
    for (let i = 1; i < angles.length; i++) P *= Math.cos((angles[i] - angles[i - 1]) / 2) ** 2;
    return P;
  };
  /* Frecuencia de Larmor ω = gμ_B B/ħ (rad/s) */
  Sp.larmor = (g, B) => (g * 9.2740100783e-24 * B) / 1.054571817e-34;
  /* Probabilidad de inversión del espín desde +z con campo de eje (θ_B) y frecuencia ω: sin²θ_B sin²(ωt/2) */
  Sp.flip = (thB, w, t) => Math.sin(thB) ** 2 * Math.sin((w * t) / 2) ** 2;
  /* Intensidad en el interferómetro de neutrones con una rama girada un ángulo φ: cos²(φ/4) */
  Sp.neutron = (phi) => Math.cos(phi / 4) ** 2;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sp;
})(typeof window !== 'undefined' ? window : globalThis);
