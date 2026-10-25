/* Experimento reproducible citado en docs/INFORME_CIENTIFICO.md §3.
 * Evolución de un poro triangular de borde N (opc 10, tamaño 3, 25 vacancias)
 * en una red 24×24 PBC, 60 000 pasos isotérmicos, semilla 7, según el
 * reservorio de H y la penalización H–H. Uso: node tests/historico/experimento_estabilidad_poro.js
 */
'use strict';
const { run: R } = require('../harness.js');

const cases = [
  ['tesis', 0, 0, 'tesis, sin penalización H–H'],
  ['tesis', 0, 35, 'tesis, K_HH = 35 eV (por defecto)'],
  ['H2', 0, 0, 'H₂, Δμ_H = 0, sin penalización'],
  ['H2', -1.5, 0, 'H₂, Δμ_H = −1.5 eV, sin penalización'],
];
console.log('caso | T (K) | clústeres | mayor | forma del mayor | aceptación % | ΔE (eV)');
for (const [res, dmu, K, label] of cases) {
  for (const Tk of [5000, 10000, 20000]) {
    const r = R(`(function(){
      Nx=24;Ny=24;latticeOrient='AC';latticeStart='B';pbcX=true;pbcY=true;
      setHydrogenReservoir('${res}'); muH=${dmu}; hPass=${K > 0}; H_OVERLAP_K=${K}; H_OVERLAP_MODE='max';
      setRandomSeed(7); buildGrid(10,0,3); buildPhysNB(); E=calcFullE(); const E0=E;
      T=${Tk}; accepted=0; rejected=0;
      for(let s=0;s<60000;s++) metro();
      const cl=getPoreClusters(); const c=cl.length?classifyPoreCluster(cl[0]):null;
      const out={n:cl.length, big:cl.length?cl[0].length:0, shape:c?c.label:'—', acc:accepted/(accepted+rejected)*100, dE:E-E0};
      setRandomSeed(null); setHydrogenReservoir('tesis'); muH=0; H_OVERLAP_K=35;
      return out;
    })()`);
    console.log(`${label} | ${Tk} | ${r.n} | ${r.big} | ${r.shape} | ${r.acc.toFixed(3)} | ${r.dE.toFixed(1)}`);
  }
}
