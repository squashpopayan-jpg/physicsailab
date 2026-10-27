module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  T.rel(S, 'campo de un hilo: Biot–Savart integrado (quad) frente a μ₀I/2πr', C.bWire(10, 0.02), R.wire.B, 1e-8);
  T.rel(S, 'campo de un hilo con la fórmula exacta (scipy.constants.mu_0)', C.bWire(10, 0.02), R.wire.exact, 1e-9);
  T.rel(S, 'espira circular en su eje: integral del elemento de corriente', C.bLoopAxis(10, 0.05, 0.04), R.loop, 1e-9);
  T.rel(S, 'espira circular: fórmula exacta', C.bLoopAxis(10, 0.05, 0.04), R.loop_exact, 1e-9);
  for (const [z, t, v, m, a, N, e] of R.emf) T.rel(S, 'fem del imán que cae (derivada simbólica de sympy), z = ' + z + ' m', C.dipoleEmf(m, a, z - v * t, v, N), e, 1e-9);
  T.rel(S, 'disco de Faraday: ∫ v B dr', C.faradayDisc(1, 50, 0.1), R.disc, 1e-12);
  T.abs(H, 'disco: 1.57 V con 1 T, 50 Hz y 10 cm', C.faradayDisc(1, 50, 0.1), 1.571, 0.001);
  T.abs(S, 'constante de Faraday F = N_A e', 6.02214076e23 * 1.602176634e-19, R.F, 1e-6);
  T.abs(H, 'F = 96 485 C/mol', R.F, 96485.33, 0.01);
  T.abs(H, 'electrólisis: 0.329 mg de cobre por culombio (Cu²⁺)', R.cu * 1000, 0.3294, 0.0005);
  T.abs(N, 'el área total de los dos pulsos es el cambio de flujo (nulo: el imán sale por el otro lado)', R.pulse_area, R.flux_change, 1e-9);
  T.abs(H, 'brújula: 5 A a 2 cm desvían la aguja 64° con B_h = 2.4×10⁻⁵ T', C.compassDeflection(C.bWire(5, 0.02), 2.4e-5), 64.4, 0.3);
  T.abs(H, 'campo de 10 A a 2 cm = 10⁻⁴ T', C.bWire(10, 0.02), 1e-4, 1e-9);
  T.ok(H, 'la fem de inducción cambia de signo al pasar el imán por el plano de la bobina', C.dipoleEmf(1, 0.03, 0.02, 1, 100) * C.dipoleEmf(1, 0.03, -0.02, 1, 100) < 0);
};
