/* Cap. 3 — Espacio-tiempo: movimiento hiperbólico, gemelos, cuadrivelocidad */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const R = EM.fm.rel, K = EM.qm.K, c = K.c;
  for (const r of ref.hyp) {
    const h = R.hyp(r.a, r.tau);
    chk(S, `Movimiento hiperbólico (a = ${(r.a / 9.80665).toFixed(2)} g, τ = ${(r.tau / K.yr).toFixed(2)} años): γ frente a la integración numérica de la ecuación del movimiento (DOP853)`, h.gamma, r.gamma, 1e-9);
    chk(S, `Movimiento hiperbólico (a = ${(r.a / 9.80665).toFixed(2)} g, τ = ${(r.tau / K.yr).toFixed(2)} años): β frente a la integración numérica`, h.beta, r.beta, 1e-9);
    chk(S, `Movimiento hiperbólico (a = ${(r.a / 9.80665).toFixed(2)} g, τ = ${(r.tau / K.yr).toFixed(2)} años): t frente a la integración numérica`, h.t, r.t, 1e-9);
    chk(S, `Movimiento hiperbólico (a = ${(r.a / 9.80665).toFixed(2)} g, τ = ${(r.tau / K.yr).toFixed(2)} años): x frente a la integración numérica`, h.x, r.x, 1e-9);
    chk(L, `Movimiento hiperbólico (τ = ${(r.tau / K.yr).toFixed(2)} años): la hipérbola x′ = (c²/a)(γ − 1) cumple (x + c²/a)² − (ct)² = (c²/a)²`, ((h.x + (c * c) / r.a) ** 2 - (c * h.t) ** 2) / ((c * c) / r.a) ** 2, 1, 1e-9);
  }
  for (const r of ref.twins) {
    const T = R.twins(r.d, r.b);
    chk(S, `Gemelos (d = ${r.d} al, β = ${r.b}): tiempo del viajero 2d/(βγ) frente a la integral de dτ = √(1−β²)dt`, T.traveler, r.tau, 1e-12);
    chk(S, `Gemelos (d = ${r.d} al, β = ${r.b}): lectura de la Tierra simultánea con el giro, sistema de ida, frente a la transformación de sucesos (brentq)`, T.earthAtTurnOut, r.tE_out, 1e-9);
    chk(S, `Gemelos (d = ${r.d} al, β = ${r.b}): lectura de la Tierra simultánea con el giro, sistema de regreso, frente a la transformación de sucesos`, T.earthAtTurnIn, r.tE_in, 1e-9);
    chk(L, `Gemelos (d = ${r.d} al, β = ${r.b}): el salto 2βd cierra la cuenta: t_ida + salto + t_vuelta = tiempo de la Tierra`, T.earthAtTurnOut + T.jump + (T.earth - T.earthAtTurnIn), T.earth, 1e-12);
  }
  for (const r of ref.trip) {
    const T = R.hypTrip(K.g0, r.d);
    chk(S, `Viaje a 1 g de reposo a reposo (d = ${(r.d / K.ly).toPrecision(5)} al): tiempo propio frente a la integración numérica`, T.tau, r.tau, 1e-8);
    chk(S, `Viaje a 1 g de reposo a reposo (d = ${(r.d / K.ly).toPrecision(5)} al): tiempo de la Tierra frente a la integración numérica`, T.t, r.t, 1e-8);
    chk(S, `Viaje a 1 g de reposo a reposo (d = ${(r.d / K.ly).toPrecision(5)} al): γ máximo en el punto medio`, T.gammaMax, r.gammaMax, 1e-9);
  }
  chk(Y, 'Cuadrivelocidad: u·u = c² (en unidades de c, signatura + −) para β = 0.6', R.dot(R.fourVelocity(0.6), R.fourVelocity(0.6)), 1, 1e-14);
  chk(Y, 'Cuadrivelocidad: u·u = 1 para β = 0.999', R.dot(R.fourVelocity(0.999), R.fourVelocity(0.999)), 1, 1e-12);
  chk(L, 'Clasificación del intervalo: (Δx, cΔt) = (5, 3) es de tipo espacio', R.classify(5, 3) === 'espacio' ? 1 : 0, 1, 0);
  chk(L, 'Clasificación del intervalo: (3, 5) es de tipo tiempo', R.classify(3, 5) === 'tiempo' ? 1 : 0, 1, 0);
  chk(L, 'Clasificación del intervalo: (4, 4) es de tipo luz', R.classify(4, 4) === 'luz' ? 1 : 0, 1, 0);
};
