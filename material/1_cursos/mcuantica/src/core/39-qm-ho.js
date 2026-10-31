/* ===================================================================
   39-qm-ho.js — Oscilador armónico (EM.qm.ho): funciones propias, elementos de matriz de x y p en la base
   de números, probabilidad en la región clásicamente prohibida y densidad clásica. Unidades ħ = m = ω = 1
   (longitud ℓ = √(ħ/mω)) salvo indicación.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const H = (qm.ho = {});
  /* ψ_n(ξ) normalizada respecto de ξ (recurrencia estable): ψ₀ = π^{-1/4} e^{−ξ²/2} */
  H.psi = (n, xi) => {
    let p0 = Math.pow(Math.PI, -0.25) * Math.exp(-0.5 * xi * xi);
    if (n === 0) return p0;
    let p1 = Math.SQRT2 * xi * p0;
    for (let k = 1; k < n; k++) { const p2 = Math.sqrt(2 / (k + 1)) * xi * p1 - Math.sqrt(k / (k + 1)) * p0; p0 = p1; p1 = p2; }
    return p1;
  };
  H.E = (n) => n + 0.5;
  /* ⟨n|x|m⟩ y ⟨n|p|m⟩ en unidades de ℓ y ħ/ℓ: x = (a + a†)/√2, p = i(a† − a)/√2 (p es imaginario puro para m = n + 1) */
  H.xmat = (n, m) => (m === n + 1 ? Math.sqrt((n + 1) / 2) : m === n - 1 ? Math.sqrt(n / 2) : 0);
  H.pmat = (n, m) => (m === n + 1 ? -Math.sqrt((n + 1) / 2) : m === n - 1 ? Math.sqrt(n / 2) : 0); /* parte coeficiente de i: ⟨n|p|n+1⟩ = −i√((n+1)/2) */
  /* Probabilidad de hallar el oscilador fuera de los puntos de retorno |ξ| > √(2n+1) (cuadratura de Simpson) */
  H.forbidden = function (n, N = 4000) {
    const xt = Math.sqrt(2 * n + 1), xmax = xt + 12, h = (xmax - xt) / N;
    let s = 0;
    for (let i = 0; i <= N; i++) { const x = xt + i * h, p = H.psi(n, x), w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * p * p; }
    return 2 * (s * h) / 3;
  };
  /* Densidad clásica (para la misma energía) 1/(π √(2n+1 − ξ²)) */
  H.classical = (n, xi) => { const d = 2 * n + 1 - xi * xi; return d > 0 ? 1 / (Math.PI * Math.sqrt(d)) : 0; };

  /* ---- Estados coherentes y comprimidos, función de Wigner (ℓ = ħ = ω = 1; ξ = x/ℓ, π = pℓ/ħ) ---- */
  H.poisson = (n, mean) => { if (mean === 0) return n === 0 ? 1 : 0; let lg = -mean + n * Math.log(mean); for (let k = 2; k <= n; k++) lg -= Math.log(k); return Math.exp(lg); };
  /* Densidad |ψ_α(ξ,t)|² del estado coherente α(t) = α e^{−it}: gaussiana de varianza ½ centrada en √2 Re α(t) */
  H.cohDensity = (xi, alRe, alIm, t) => { const c = Math.cos(t), s = Math.sin(t), re = alRe * c + alIm * s; const xc = Math.SQRT2 * re; return Math.exp(-((xi - xc) ** 2)) / Math.sqrt(Math.PI); };
  /* Matriz de covarianza de un estado coherente comprimido (r, ángulo th del eje comprimido) tras un tiempo t (rotación horaria en el plano ξ–π) */
  H.squeezeCov = (r, th, t) => {
    const a = Math.exp(-2 * r) / 2, b = Math.exp(2 * r) / 2, c1 = Math.cos(th), s1 = Math.sin(th);
    let s11 = a * c1 * c1 + b * s1 * s1, s22 = a * s1 * s1 + b * c1 * c1, s12 = (a - b) * c1 * s1;
    const c = Math.cos(t), s = Math.sin(t);
    /* x(t) = x c + p s ; p(t) = −x s + p c */
    const v11 = c * c * s11 + 2 * c * s * s12 + s * s * s22, v22 = s * s * s11 - 2 * c * s * s12 + c * c * s22, v12 = -c * s * s11 + (c * c - s * s) * s12 + c * s * s22;
    return [v11, v12, v22];
  };
  /* Wigner de un estado de Fock: (−1)^n e^{−ρ} L_n(2ρ)/π con ρ = ξ² + π² */
  H.wignerFock = (n, xi, pi_) => { const rho = xi * xi + pi_ * pi_, Lg = EM.P.sf.laguerre(n, 0, 2 * rho); return ((n % 2 ? -1 : 1) / Math.PI) * Math.exp(-rho) * Lg; };
  /* Wigner de un estado gaussiano de covarianza (v11, v12, v22) centrado en (x0, p0) */
  H.wignerGauss = (v, x0, p0, xi, pi_) => { const det = v[0] * v[2] - v[1] * v[1], dx = xi - x0, dp = pi_ - p0, q = (v[2] * dx * dx - 2 * v[1] * dx * dp + v[0] * dp * dp) / det; return Math.exp(-0.5 * q) / (2 * Math.PI * Math.sqrt(det)); };
  /* Gato de Schrödinger |α⟩ ± |−α⟩ con α real (parity = +1 par, −1 impar) */
  H.wignerCat = (al, parity, xi, pi_) => { const a = Math.SQRT2 * al, w = Math.exp(-pi_ * pi_), g = (u) => Math.exp(-u * u); return (w * (g(xi - a) + g(xi + a) + parity * 2 * g(xi) * Math.cos(2 * a * pi_))) / (2 * Math.PI * (1 + parity * Math.exp(-2 * al * al))); };
  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(typeof window !== 'undefined' ? window : globalThis);
