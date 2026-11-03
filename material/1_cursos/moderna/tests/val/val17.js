/* Cap. 17 — Láser */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const La = EM.fm.las, K = EM.qm.K, c = K.c, h = K.h, kB = K.kB;
  for (const q of ref.planck_u) chk(S, `Planck a partir de los coeficientes de Einstein (A/B)/(e^{hν/kT} − 1) a ν = ${q.nu.toExponential(2)} Hz, T = ${q.T} K, frente a 4πB_ν/c (NumPy)`, La.uFromRates(q.nu, q.T), q.u, 1e-9);
  for (const q of ref.stimratio) chk(S, `Cociente emisión espontánea / estimulada e^{hν/kT} − 1 (ν = ${q.nu.toExponential(2)} Hz, T = ${q.T} K)`, La.spontOverStim(q.nu, q.T), q.r, 1e-9);
  chk(S, 'Relación de Einstein A/B = 8πhν³/c³ para 632.8 nm', La.AoverB(c / 632.8e-9), 8 * Math.PI * h * Math.pow(c / 632.8e-9, 3) / Math.pow(c, 3), 1e-12);
  chk(L, 'A 300 K el cociente de poblaciones del neón en 632.8 nm es e^{−75.8} ≈ 1.2×10⁻³³ (sin inversión no hay láser)', La.boltzRatio(c / 632.8e-9, 300), 1.2e-33, 0.02);
  for (const q of ref.dopp17) chk(S, `Ancho Doppler (FWHM) del Ne a 632.8 nm, T = ${q.T} K, frente al perfil numérico obtenido de la distribución de Maxwell`, La.dopplerFWHM(q.nu, q.T, q.m), q.fw, 1e-9);
  chk(L, 'Ancho Doppler del He–Ne a 400 K ≈ 1.5 GHz (valor habitual en la literatura)', La.dopplerFWHM(c / 632.8e-9, 400, 20.1797), 1.5e9, 0.02);
  chk(L, 'Ancho Doppler: fórmula práctica Δν = 7.16×10⁻⁷ ν √(T/M) con M en g/mol', La.dopplerFWHM(c / 632.8e-9, 300, 20.1797), 7.16e-7 * (c / 632.8e-9) * Math.sqrt(300 / 20.1797), 2e-3);
  { const g0 = 1e-9 * 0, nu = c / 632.8e-9; let sG = 0, sL = 0; const fw = 1.3e9, N = 20001, lo = nu - 40 * fw, hi = nu + 40 * fw, dn = (hi - lo) / (N - 1);
    for (let i = 0; i < N; i++) { const x = lo + i * dn; sG += La.gaussProfile(x, nu, fw) * dn; sL += La.lorentzProfile(x, nu, 1e8) * dn; }
    chk(L, 'El perfil gaussiano está normalizado (∫g dν = 1)', sG, 1, 1e-6); chk(L, 'El perfil lorentziano está normalizado (colas hasta ±40 Δν)', sL, 1, 1e-2);
    chk(L, 'La mitad del máximo del perfil gaussiano se alcanza a ±FWHM/2', La.gaussProfile(nu + 0.65e9, nu, 1.3e9) / La.gaussProfile(nu, nu, 1.3e9), 0.5, 1e-12);
    chk(L, 'La mitad del máximo del perfil lorentziano se alcanza a ±FWHM/2', La.lorentzProfile(nu + 0.5e8, nu, 1e8) / La.lorentzProfile(nu, nu, 1e8), 0.5, 1e-12); void g0; }
  chk(L, 'Sección eficaz del He–Ne (632.8 nm, A = 3.4×10⁶ s⁻¹, Doppler a 400 K): ≈ 3×10⁻¹³ cm² = 3×10⁻¹⁷ m²', La.sigma(632.8e-9, 3.4e6, La.gaussProfile(c / 632.8e-9, c / 632.8e-9, La.dopplerFWHM(c / 632.8e-9, 400, 20.1797))), 3e-17, 0.25);
  chk(L, 'Ancho natural de la línea 632.8 nm (A = 3.4×10⁶ s⁻¹): 0.54 MHz, mucho menor que el ancho Doppler', La.naturalFWHM(3.4e6), 0.541e6, 2e-3);
  // cavidad
  chk(L, 'Intervalo espectral libre de una cavidad de 30 cm: c/2L = 499.7 MHz', La.fsr(0.3), 499.654096e6, 1e-6);
  for (const q of ref.thr) { chk(S, `Umbral de ganancia (L = ${q.L} m, R₁ = ${q.R1}, R₂ = ${q.R2}, α = ${q.al} m⁻¹) frente a la raíz de R₁R₂e^{2(γ−α)L} = 1 (scipy.optimize.brentq)`, La.gammaThreshold(q.L, q.R1, q.R2, q.al), q.g, 1e-9);
    chk(S, `Tiempo de vida del fotón en la cavidad (L = ${q.L} m) frente al decaimiento por viaje de ida y vuelta`, La.photonLifetime(q.L, q.R1, q.R2, q.al), q.tauc, 0.03); }
  { const md = La.modes(c / 632.8e-9, 0.3, 1.5e9, 0.01, 0.0035), n = md.filter((x) => x.on).length; chk(L, 'He–Ne de 30 cm con ancho Doppler 1.5 GHz y la ganancia por encima del umbral en ≈ el 60 % del pico: oscilan 3 modos', n, 3, 0); }
  // ecuaciones de balance
  { const p = ref.rate.p, T = 40e-6, dt = 1e-9; const tr = La.rateIntegrate(p, T, dt, 0, 1e-3, 1);
    ref.rate.t.forEach((t, k) => { const i = Math.round(t / dt), q = tr[i]; chk(S, `Ecuaciones de balance, t = ${(t * 1e6).toFixed(0)} µs: inversión N (RK4) frente a scipy.integrate.solve_ivp (DOP853)`, q.N, ref.rate.y[0][k], 1e-6); chk(S, `Ecuaciones de balance, t = ${(t * 1e6).toFixed(0)} µs: fotones φ (RK4) frente a DOP853`, q.ph, ref.rate.y[1][k], 1e-5); }); }
  { const p = ref.rate.p, f = La.relaxFreq(p), ss = La.rateSteady(p); chk(L, 'Estado estacionario: N = 1/(Bτc) y φ = τc(R − R_th)', ss.phi, p.tauc * (p.R - La.rateThreshold(p).Rth), 1e-12);
    chk(S, 'Frecuencia de las oscilaciones de relajación √((r − 1)/(ττc) − (r/2τ)²)/2π frente al periodo medido en la solución numérica (DOP853)', Math.sqrt(f.w0 ** 2 - f.damp ** 2) / (2 * Math.PI), ref.rate_f, 2e-3); }
  // haces gaussianos
  for (const q of ref.abcd) { chk(S, `Resonador (L = ${q.L} m, R₁ = ${q.R1}, R₂ = ${q.R2}, λ = ${(q.lam * 1e9).toFixed(0)} nm): cintura w₀ de la fórmula cerrada frente al autovalor de la matriz ABCD (NumPy)`, La.waist(q.L, q.R1, q.R2, q.lam), q.w0, 1e-9);
    chk(S, `Resonador (L = ${q.L} m): posición de la cintura medida desde el espejo 1`, La.waistPos(q.L, q.R1, q.R2), q.zw, 1e-9);
    chk(S, `Resonador (L = ${q.L} m): radio del haz en el espejo 1, w(z) con z = posición de la cintura`, La.beamW(q.w0, q.lam, q.zw), q.w1, 1e-9); }
  chk(L, 'Estabilidad: el resonador plano-plano (g₁g₂ = 1) y el confocal (g = 0) están en el límite; el hemiesférico es estable', [La.stable(0.3, 1e12, 1e12), La.stable(1, 1, 1), La.stable(0.5, 1, 1e12), La.stable(3, 1, 1)].join() === 'true,true,true,false' ? 1 : 0, 1, 0);
  chk(L, 'Alcance de Rayleigh del haz de un He–Ne con w₀ = 0.3 mm: z_R = πw₀²/λ = 0.447 m', La.zR(0.3e-3, 632.8e-9), 0.4468, 1e-3);
  chk(L, 'Divergencia (semiángulo) λ/πw₀ = 0.67 mrad', La.divergence(0.3e-3, 632.8e-9), 0.6714e-3, 1e-3);
  // pulsos
  chk(S, 'Producto tiempo–ancho de banda de un pulso gaussiano: 2 ln2/π = 0.4413 frente a la FFT numérica (NumPy)', La.TBP.gauss, ref.tbp.gauss, 3e-4);
  chk(S, 'Producto tiempo–ancho de banda de un pulso sech²: 0.3148 frente a la FFT numérica', La.TBP.sech2, ref.tbp.sech2, 1e-3);
  chk(L, 'Ti:zafiro, 100 nm de ancho a 800 nm → pulso gaussiano de 9.4 fs', La.pulseFromBandwidth(La.bandwidthHz(800e-9, 100e-9)) * 1e15, 9.4, 5e-3);
};
