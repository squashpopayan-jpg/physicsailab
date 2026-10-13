/* Animación de la portada: rotación de tres jugadores en vista de transmisión. */
MS.Hero = (function () {
  const { U, TV, Compile, Routines } = MS;
  const H = { tl: null, t: 0, raf: 0, last: 0, cam: Object.assign({}, TV.PRESETS.tv) };
  function loop(ts) {
    H.raf = 0;
    if (MS.App.current !== 'inicio') return;
    const dt = H.last ? Math.min(0.1, (ts - H.last) / 1000) : 0; H.last = ts;
    H.t += dt; if (H.t > H.tl.duration) H.t = 0;
    H.cam.az = Math.sin(ts / 9000) * 0.35;
    const cv = U.$('#heroCanvas'); const r = cv.getBoundingClientRect();
    const w = Math.max(200, r.width), h = Math.max(120, r.height);
    TV.draw(U.fitCanvas(cv, w, h), w, h, H.tl, H.t, H.cam, { angulos: false });
    H.raf = requestAnimationFrame(loop);
  }
  function init() {
    H.tl = Compile.compile(Routines.byId.rotacion3);
    H.t = 1.5;
    const n = U.$('#nRut'); if (n) n.textContent = String(Routines.LIB.length);
  }
  function show() { if (!H.raf) { H.last = 0; H.raf = requestAnimationFrame(loop); } }
  MS.App.on('inicio', { init, show });
  return H;
})();
