/* Portada — plano vivo de la casa ejemplo que recorre las capas del proyecto */
(function () {
  'use strict';
  const RT = window.RT;

  RT.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 0.92 });
    const ETAPAS = [
      { t: 'A01 · Planta arquitectónica y estructural', capas: { cotas: true, ilum: false, tomas: false, canal: false, tierra: false } },
      { t: 'E01 · Planta de iluminación', capas: { ilum: true, ctrl: true, muebles: false } },
      { t: 'E02 · Planta de tomacorrientes y zonas GFCI', capas: { tomas: true, esp: true, gfci: true } },
      { t: 'E03 · Canalizaciones y marcas de conductores', capas: { ilum: true, tomas: true, esp: true, canal: true, marcas: true, muebles: false, etiquetas: false } },
      { t: 'E04 · Acometida, medidor y puesta a tierra', capas: { tomas: false, tierra: true, cim: true } }
    ];
    const plano = new RT.Plano(sim, cv, { bounds: [-1.3, -2.3, 9.5, 11.0] });
    const hint = sim.hint('', cv);
    let k = 0, t = 0;
    const aplicar = () => {
      const base = { ejes: true, estr: true, vigas: true, muros: true, muebles: true, nombres: true, cotas: false, ilum: false, ctrl: false, tomas: false, esp: false, canal: false, marcas: false, tierra: false, gfci: false, etiquetas: true, cim: false };
      plano.capas = Object.assign(base, ETAPAS[k].capas);
      hint.textContent = ETAPAS[k].t + '  ·  clic en el plano para pausar';
    };
    aplicar();
    cv.el.addEventListener('click', () => sim.toggle());
    sim.onDraw(() => plano.draw());
    sim.animate((dt) => { t += dt; if (t > 4.2) { t = 0; k = (k + 1) % ETAPAS.length; aplicar(); } }, { autoplay: true });
  });
})();
