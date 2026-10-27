module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  const th = (34 / 60) * Math.PI / 180;
  T.rel(S, 'Biruni: R = h cosθ/(1−cosθ) frente a la raíz numérica (brentq)', C.biruniRadius(305, th), R.biruni_R, 1e-6);
  T.abs(H, 'Biruni: 305 m y 34′ dan un radio dentro del 3 % del real', C.biruniRadius(305, th) / 1000, 6371, 0.03 * 6371);
  T.abs(H, 'Biruni: la depresión real a 305 m es ≈ 33.6′', R.dip_real, 33.6, 0.3);
  T.abs(H, 'Biruni: 1′ de error en el ángulo cambia R en ≈ 6 %', Math.abs(C.biruniSensitivity(305, th, Math.PI / 10800)), 0.06, 0.01);
  T.rel(S, 'cámara oscura: orificio óptimo √(2.44 λ f) (minimize_scalar)', C.pinholeOptimum(0.5, 550e-9), R.pinhole_opt, 1e-4);
  T.abs(H, 'cámara oscura: 0.82 mm a 50 cm', C.pinholeOptimum(0.5, 550e-9) * 1e3, 0.82, 0.005);
  const rr = C.refract(1, 1.5, (40 * Math.PI) / 180);
  T.abs(S, 'refracción aire→vidrio a 40°: ángulo (°)', (rr.th2 * 180) / Math.PI, R.snell_n15_40, 1e-9);
  T.abs(H, 'Ibn Sahl: cociente de longitudes constante = 1/n', rr.ratio, 1 / 1.5, 1e-12);
  T.ok(H, 'Ibn Sahl: el cociente no depende del ángulo', [10, 30, 60, 80].every((a) => Math.abs(C.refract(1, 1.5, (a * Math.PI) / 180).ratio - 1 / 1.5) < 1e-12));
  R.tusi.forEach(([t, x, y]) => { const q = C.tusi(t, 2, 1); T.abs(S, `par de Tusi (R=2r): x = 2r cos t en t=${t}`, q[0], x, 1e-12); T.abs(S, `par de Tusi: y = 0 en t=${t}`, q[1], y, 1e-12); });
  T.ok(H, 'par de Tusi: con R ≠ 2r el punto sale de la recta', Math.abs(C.tusi(1, 2.4, 1)[1]) > 0.05);
};
