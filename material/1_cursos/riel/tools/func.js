(async () => {
  const r = __riel, sleep = (ms) => new Promise((x) => setTimeout(x, ms)), out = {};
  // 1. auto-soltar al mover el deslizador de masa
  r.cambioParam('m', 60); await sleep(1200);
  out.auto = r.st.sim.estado;
  await sleep(2500); r.cambioParam('m', 100);
  out.fantasmas = r.st.ghosts.length;
  await sleep(1500);
  // 2. compuerta arrastrada
  r.escena.onGate(1, 120.4); out.g2 = r.st.P.g2 + ' ' + r.st.sim.gates[1].x.toFixed(3);
  // 3. recorre todos los montajes con la interfaz viva
  out.montajes = {};
  for (const m of r.E.MONTAJES) {
    r.elegir(m.id); r.soltar(); await sleep(1800);
    out.montajes[m.id] = { t: +r.st.sim.t.toFixed(2), estado: r.st.sim.estado, eventos: r.st.sim.eventos.length, res: document.querySelector('#resultados').innerText.replace(/\n+/g, ' | ').slice(0, 300) };
  }
  // 4. teclas
  r.elegir('newton'); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); await sleep(300); out.espacio = r.st.sim.estado;
  return out;
})()
