(async () => {
  const r = __riel, out = {};
  const correr = (T) => { r.E.avanzar(r.st.sim, T); r.E.avanzar(r.st.ideal, T); r.resultados(); r.tabla(); r.lcd(); };
  const txt = () => document.querySelector('#resultados').innerText.replace(/\n+/g, ' | ');
  r.cambioParam('m', 60); clearTimeout(r.st.tAuto); r.soltar(); correr(1.5); out.ghostAntes = r.st.ghosts.length;
  r.cambioParam('m', 100); clearTimeout(r.st.tAuto); out.fantasmas = r.st.ghosts.map((g) => g.etiqueta);
  r.elegir('newton'); r.cambioParam('m', 50); clearTimeout(r.st.tAuto); r.soltar(); correr(2.0); out.newton = txt();
  out.tabla = document.querySelector('#tb-ev').innerText.replace(/\n+/g, ' / ');
  out.lcd = r.st.ultimoLCD;
  r.elegir('choque_el'); r.soltar(); correr(3); out.choque = txt();
  r.elegir('choque_in'); r.soltar(); correr(3); out.inel = txt();
  r.elegir('explosion'); r.soltar(); correr(2); out.expl = txt();
  r.elegir('oscilador'); r.soltar(); correr(6); out.osc = txt();
  r.elegir('inclinado'); r.soltar(); correr(2.5); out.incl = txt();
  r.elegir('acoplados'); r.soltar(); correr(1.2); out.acopl = txt();
  r.elegir('newton'); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); out.espacio = r.st.sim.estado;
  return out;
})()
