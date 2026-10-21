// Sesión de estudiante acelerada dentro de la página: purga, ajuste de caudal y lecturas.
(() => {
  const S = BENCH.sim, avanza = (seg) => { for (let k = 0; k < seg * 30; k++) S.paso(1 / 30); };
  document.getElementById('btnBomba').click();
  document.querySelector('[data-dv="abrir"]').click();
  avanza(20);
  const antes = S.lecturas().burbujas.filter((b) => b.viva).length;
  avanza(130);
  const despues = S.lecturas().burbujas.filter((b) => b.viva).length;
  S.valvula(2.1); avanza(40);
  const L = S.lecturas();
  BENCH.selectTube(3); BENCH.ojo('m', Math.round(L.h[3])); BENCH.ojo('r', L.flot);
  return { antes, despues, q: L.q.toFixed(2), qr: L.qr.toFixed(2), flot: L.flot.toFixed(2), h: L.h.map((x) => x.toFixed(1)).join(' '), T: L.Tagua.toFixed(1), V: L.V.toFixed(2) };
})()
