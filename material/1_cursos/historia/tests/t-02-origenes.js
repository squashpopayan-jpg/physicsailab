module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  T.abs(H, 'YBC 7289: 1;24,51,10 frente a √2', C.sexToNumber([1, 24, 51, 10]), Math.SQRT2, 7e-7);
  T.rel(S, 'YBC 7289 en decimales', C.sexToNumber([1, 24, 51, 10]), R.ybc, 1e-12);
  const it = C.babSqrt(2, 1.5, 4);
  R.bab_iter.forEach((v, i) => T.rel(S, `método babilónico: iteración ${i + 1} (fracciones exactas)`, it[i + 1], v, 1e-13));
  T.rel(S, 'x₂ = 577/408', it[2], R.bab_x2_frac[0] / R.bab_x2_frac[1], 1e-14);
  T.eq(H, 'x₂ = 1;24,51,10 en tres cifras sexagesimales', C.sexagesimal(it[2], 3), [1, 24, 51, 10]);
  T.ok(H, 'Plimpton 322: las 15 ternas cumplen Pitágoras', C.plimpton.every(([b, d, h]) => b * b + h * h === d * d) && R.plimpton_ok.every(Boolean));
  C.plimpton.forEach(([b, d, h], i) => { if (i % 7 === 0) T.abs(S, `Plimpton fila ${i + 1}: ángulo (°)`, (Math.atan2(b, h) * 180) / Math.PI, R.plimpton_ang[i], 1e-9); });
  T.ok(H, 'Plimpton: cociente (d/h)² decrece fila a fila', C.plimpton.every((r, i, a) => i === 0 || (r[1] / r[2]) ** 2 < (a[i - 1][1] / a[i - 1][2]) ** 2));
  T.abs(H, 'Saros: 223 lunaciones = 6585.3211 d (Meeus)', 223 * C.K.synodic, R.saros_lit, 0.002);
  T.abs(H, 'Saros: 242 meses dracónicos', 242 * C.K.draconic, R.saros_242, 1e-9);
  T.ok(H, 'Saros: 223 lunaciones, 242 dracónicos y 239 anomalísticos coinciden en menos de 0.25 d', Math.abs(R.saros_223 - R.saros_242) < 0.25 && Math.abs(R.saros_223 - R.saros_239) < 0.25);
  T.eq(H, 'N = 223 es el único N ≤ 400 con desfases < 0.5 d en ambos ciclos', [...Array(400).keys()].map((i) => i + 1).filter((n) => Math.abs(C.cycleMismatch(n, C.K.draconic).dev) < 0.5 && Math.abs(C.cycleMismatch(n, C.K.anomalistic).dev) < 0.5), [223]);
  T.abs(H, 'Metón: 235 lunaciones ≈ 19 años tropicales (desfase en días)', R.metonic_diff, 0.086, 0.01);
  T.abs(H, 'Códice de Dresde: 5 ciclos de Venus de 584 d = 8 años de 365 d', R.venus_maya, 8, 1e-12);
  T.abs(H, 'papiro Rhind: π ≈ (16/9)²', R.rhind_pi, 3.1605, 5e-5);
};
