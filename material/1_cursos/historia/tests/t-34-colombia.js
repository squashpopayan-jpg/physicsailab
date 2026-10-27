module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const [h, p, tb] of R.boil) T.abs(S, `ebullición del agua a ${h} m (atmósfera estándar; Antoine frente a CoolProp/IAPWS-95), °C`, C.tBoil(C.pStd(h)), tb, 0.08);
  for (const [t, p] of R.pvap) T.rel(S, `presión de vapor del agua a ${t} °C: Antoine frente a CoolProp`, C.pVapor(t), p, 0.01);
  T.abs(H, 'el agua hierve a ≈ 94 °C en Popayán (1738 m)', C.tBoil(C.pStd(1738)), 94.4, 0.5);
  T.abs(H, 'el agua hierve a ≈ 91 °C en Bogotá (2640 m)', C.tBoil(C.pStd(2640)), 91.3, 0.5);
  T.abs(H, 'el agua hierve a ≈ 79 °C a la altura del Chimborazo', C.tBoil(C.pStd(6263)), 79.3, 1.5);
  for (const h of [500, 1738, 2640, 4764]) T.abs(N, 'el hipsómetro de Caldas recupera la altura desde la temperatura de ebullición, h = ' + h + ' m', C.hypsoHeight(C.tBoil(C.pStd(h))), h, 25);
  T.abs(H, 'cada 300 m de ascenso baja la temperatura de ebullición ≈ 1 °C (10 °C en 3000 m)', C.tBoil(C.pStd(0)) - C.tBoil(C.pStd(3000)), 10, 0.5);
  for (const [d, dec] of R.decl) T.abs(S, `declinación solar el día ${d} del año: fórmula de Spencer (1971) frente a numpy`, C.solarDecl(d), dec, 1e-9);
  const zd = C.zenithDays(2.4419);
  T.ok(N, 'en Popayán el Sol pasa por el cenit dos veces al año (primavera y fin del verano boreal)', zd.length >= 2 && zd[0] < 130 && zd[zd.length - 1] > 200);
  T.abs(S, 'primer paso del Sol por el cenit en Popayán (brentq con la fórmula de Spencer)', zd[0], R.zenith[0], 1.5);
  T.abs(S, 'segundo paso del Sol por el cenit en Popayán', zd[zd.length - 1], R.zenith[1], 1.5);
  T.abs(H, 'Popayán: latitud 2.44° N y 1738 m de altura', C.PLACES[0][1], 2.44, 0.01);
};
