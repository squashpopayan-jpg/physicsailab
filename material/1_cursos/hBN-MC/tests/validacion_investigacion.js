/* Suite de validación del módulo de investigación — hBN-MC v15
 *
 *   I1  Datos de Mazzoni: 20 estructuras, Σ enlaces = 12, átomos enteros.
 *   I2  El reajuste por mínimos cuadrados reproduce la Tabla 5.8 de la tesis
 *       (parámetros del Prof. Batista) con RMS, R² y errores estándar.
 *   I3  Ajuste con parámetros fijos y estructuras adicionales leídas de CSV.
 *   I4  Sistema de parámetros: validación, restauración y etiqueta del conjunto.
 *   I5  Calibración ε_CH con nanocintas: recupera un valor sintético conocido
 *       por las rutas directa e indirecta.
 *   I6  Energética de poros: terminaciones correctas, un único clúster,
 *       linealidad en μ_N y estado del usuario intacto.
 *   I7  Diagnóstico de escala energética en h-BN perfecto: ΔE(B↔N) analítico.
 *   I8  Orden de corto alcance: α_C en configuraciones límite.
 *   I9  Barrido de temperatura e intercambio de réplicas: restaura el estado,
 *       es reproducible por semilla y produce observables finitos.
 */
'use strict';
const { run: R } = require('./harness.js');

let fails = 0;
const chk = (name, pass, detail = '') => {
  if (!pass) fails++;
  console.log(`  ${pass ? 'PASS' : '**FAIL**'}  ${name}${detail ? '  ·  ' + detail : ''}`);
};
const H = (t) => console.log('\n' + t + '\n' + '-'.repeat(t.length));

// ---------------------------------------------------------------- I1
H('I1 · Conjunto de datos de Mazzoni (matriz §5.2 de la tesis)');
const d1 = R(`(function(){
  return MAZZONI_DATASET.map(r=>{ const s=Object.values(r.n).reduce((a,b)=>a+b,0); const at=atomsFromBondCounts(r.n);
    return {id:r.id, s, integer:at.integer, nat:at.N+at.B+at.C}; });
})()`);
chk('20 estructuras', d1.length === 20);
chk('Σ enlaces = 12 en todas', d1.every((r) => r.s === 12), d1.filter((r) => r.s !== 12).map((r) => r.id).join(','));
chk('átomos enteros y 8 por celda', d1.every((r) => r.integer && Math.abs(r.nat - 8) < 1e-9));

// ---------------------------------------------------------------- I2
H('I2 · Reproducción de la Tabla 5.8 (valores del Prof. Batista)');
const fit = R(`(function(){ const f=fitBondModel(MAZZONI_DATASET,{free:['NN','NB','BB','CC','CN','CB']});
  return {ok:f.ok, params:f.params, stderr:f.stderr, rms:f.rms, rmsA:f.rmsPerAtom, R2:f.R2, loo:f.looRms, maxAbs:f.maxAbs,
          tesis:PARAMS_TESIS_2019}; })()`);
chk('ajuste resuelto', fit.ok);
for (const k of ['NN', 'NB', 'BB', 'CC', 'CN', 'CB']) {
  const d = fit.params[k] - fit.tesis[k];
  chk(`ε_${k}: ${fit.params[k].toFixed(4)} ± ${fit.stderr[k].toFixed(3)} (tesis ${fit.tesis[k]})`, Math.abs(d) < 0.005, `Δ = ${d.toFixed(4)} eV`);
}
chk('RMS = 0.630 eV (0.079 eV/átomo)', Math.abs(fit.rms - 0.6297) < 5e-4 && Math.abs(fit.rmsA - 0.0787) < 5e-4, `RMS=${fit.rms.toFixed(4)} · ${fit.rmsA.toFixed(4)} eV/átomo · máx ${fit.maxAbs.toFixed(3)} eV`);
chk('R² > 0.9999', fit.R2 > 0.9999, `R²=${fit.R2.toFixed(6)} · RMS LOO=${fit.loo.toFixed(4)} eV`);

// ---------------------------------------------------------------- I3
H('I3 · Parámetros fijos y estructuras de usuario (CSV)');
const d3 = R(`(function(){
  const csv='# ejemplo\\nid,nNB,NH,BH,E_eV\\nx1,351,6,0,' + (351*-128.9067+6*-109.8) + '\\nx2,342,9,0,' + (342*-128.9067+9*-109.8) + '\\nx3,351,0,6,' + (351*-128.9067+6*-50.3);
  const p=parseFitRowsCSV(csv);
  const f=fitBondModel(p.rows,{free:['XN','XB'],fixed:{NB:-128.9067}});
  return {n:p.rows.length, errs:p.errors, keys:Object.keys(p.rows[0].n), ok:f.ok, XN:f.params.XN, XB:f.params.XB};
})()`);
chk('CSV con alias (nNB, NH, BH, E_eV)', d3.n === 3 && d3.keys.includes('NB') && d3.keys.includes('XN') && d3.keys.includes('XB'), JSON.stringify(d3.keys));
chk('ajuste con ε_NB fijo recupera ε_XN, ε_XB exactos', d3.ok && Math.abs(d3.XN + 109.8) < 1e-8 && Math.abs(d3.XB + 50.3) < 1e-8, `XN=${d3.XN} XB=${d3.XB}`);
const d3b = R(`(function(){ const p=parseFitRowsCSV('id,NB,XN,E\\nmal,10,1,-5'); return p.errors.length; })()`);
chk('detecta conteos que implican átomos no enteros', d3b > 0);

// ---------------------------------------------------------------- I4
H('I4 · Sistema de parámetros');
const d4 = R(`(function(){
  const r1=setModelParameters({NB:-128.9067, ZZZ:1, CC:'abc'});
  const set1=MODEL_PARAM_SET, nb=EPS_NB;
  resetModelParameters();
  return {changed:r1.changed, rejected:r1.rejected, set1, nb, set2:MODEL_PARAM_SET, nb2:EPS_NB, xc:EPS_XC};
})()`);
chk('acepta claves válidas y rechaza inválidas', d4.changed.join() === 'NB' && d4.rejected.join() === 'ZZZ,CC', JSON.stringify(d4));
chk('marca el conjunto como personalizado', d4.set1 === 'personalizado' && d4.nb === -128.9067);
chk('restaurar devuelve la tesis 2019', d4.set2 === 'tesis2019' && d4.nb2 === -128.1626 && d4.xc === -70.41);

// ---------------------------------------------------------------- I5
H('I5 · Calibración ε_CH con nanocintas (datos sintéticos)');
const d5 = R(`(function(){
  const epsXC=-70.41, nC=24, nH=8, nCC=(3*nC-nH)/2;
  const EH=nCC*PARAMS_TESIS_2019.CC + nH*epsXC;
  const dEh=-1.72; // energía de hidrogenación por H
  const Ebare=EH - nH*(dEh + E_MOL.H2/2);
  const r=calibrateEpsXCFromRibbon({E_H:EH, nC, nH, E_bare:Ebare});
  const bad=calibrateEpsXCFromRibbon({E_H:EH, nC, nH:7});
  return {nCC:r.nCC, direct:r.direct.lsq, dEh:r.indirect.dEhydro, ind:r.indirect.eps, sane:r.indirect.sane, warnOdd:bad.warnings.length>0,
          expectedInd:dEh + E_MOL.H2/2 + EPS_CC/2};
})()`);
chk('n_CC = (3n_C − n_H)/2', d5.nCC === 32);
chk('ruta directa recupera ε_XC', Math.abs(d5.direct + 70.41) < 1e-9, `${d5.direct}`);
chk('ruta indirecta: ΔE_hidrog y ε_XC', Math.abs(d5.dEh + 1.72) < 1e-9 && Math.abs(d5.ind - d5.expectedInd) < 1e-9 && d5.sane, `ΔE_h=${d5.dEh.toFixed(3)} ε=${d5.ind.toFixed(3)}`);
chk('advierte si 3n_C − n_H es impar (enlaces colgantes)', d5.warnOdd);

// ---------------------------------------------------------------- I6
H('I6 · Energética de poros por forma');
const d6 = R(`(function(){
  Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';hPass=true;buildGrid(3,20,3);buildPhysNB();E=calcFullE();
  const sig0=Array.from(G).join(''), E0=E, Nx0=Nx;
  setChemicalEnvironment('Nrich',0);
  const res=poreShapeEnergetics({N:36,sizes:[2,3]});
  const w=res.window;
  const lin=res.rows.every(r=>Math.abs((r.EformNrich-r.EformBrich)-r.slope*(w.muNmax-w.muNmin))<1e-6);
  const triN=res.rows.filter(r=>r.shape==='triN'), triB=res.rows.filter(r=>r.shape==='triB'), hex=res.rows.filter(r=>r.shape==='hex');
  return {n:res.rows.length, oneCluster:res.rows.every(r=>r.nClusters===1),
    triN:triN.every(r=>r.edgeB===0&&r.edgeN>0), triB:triB.every(r=>r.edgeN===0&&r.edgeB>0), hex:hex.every(r=>r.edgeN===r.edgeB),
    lin, restored:Array.from(G).join('')===sig0 && E===E0 && Nx===Nx0,
    sample:res.rows.filter(r=>r.size===3).map(r=>r.shape+':'+r.nVac+'vac '+r.EformNrich.toFixed(1)+'/'+r.EformBrich.toFixed(1)+' eV').join(' · ')};
})()`);
chk('10 poros (5 formas × 2 tamaños), un clúster cada uno', d6.n === 10 && d6.oneCluster);
chk('triángulo N: solo borde N · triángulo B: solo borde B · hexágono NH = BH', d6.triN && d6.triB && d6.hex);
chk('E_form lineal en μ_N con pendiente n_B − n_N', d6.lin);
chk('la estructura del usuario no se modifica', d6.restored);
console.log('        ' + d6.sample);

// ---------------------------------------------------------------- I7
H('I7 · Escala energética de los movimientos MC');
const d7 = R(`(function(){
  Nx=12;Ny=12;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';hPass=false;muH=0;buildGrid(1,0,1);buildPhysNB();E=calcFullE();
  const d=energyScaleDiagnostics([5000,20000]);
  return {n:d.n, min:d.min, max:d.max, ref:2*(EPS_NN+EPS_BB)-4*EPS_NB, acc:d.acceptance.map(a=>a.meanAcc)};
})()`);
chk('todos los intercambios B↔N del cristal perfecto cuestan 2(ε_NN+ε_BB) − 4ε_NB', d7.n === 216 && Math.abs(d7.min - d7.ref) < 1e-9 && Math.abs(d7.max - d7.ref) < 1e-9, `ΔE = ${d7.ref.toFixed(4)} eV · n=${d7.n}`);
chk('aceptación esperada exp(−ΔE/k_BT)', Math.abs(d7.acc[0] - Math.exp(-d7.ref / (8.6173324e-5 * 5000))) < 1e-15, `5000 K: ${d7.acc[0].toExponential(2)} · 20000 K: ${d7.acc[1].toExponential(2)}`);

// ---------------------------------------------------------------- I8
H('I8 · Orden de corto alcance');
const d8 = R(`(function(){
  Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';hPass=false;buildGrid(1,0,1);buildPhysNB();
  // mitad izquierda C, mitad derecha h-BN (segregado)
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx/2;j++) G[idx(i,j)]=C_T;
  const seg=shortRangeOrder();
  buildGrid(1,0,1);
  // C en una sola subred alternada: ningún vecino C–C
  for(let k=0;k<Nx*Ny;k++) if(G[k]===B_T && (k%4===0)) G[k]=C_T;
  const alt=shortRangeOrder();
  buildGrid(1,0,1); const pure=shortRangeOrder();
  return {seg:seg.alphaC, alt:alt.alphaC, fBN:pure.fBN, pureC:pure.alphaC};
})()`);
chk('segregación → α_C > 0.8', d8.seg > 0.8, `α_C = ${d8.seg.toFixed(3)}`);
chk('C aislados → α_C < 0', d8.alt < 0, `α_C = ${d8.alt.toFixed(3)}`);
chk('h-BN perfecto: f_BN = 1, α_C indefinido', d8.fBN === 1 && d8.pureC === null);

// ---------------------------------------------------------------- I9
H('I9 · Barrido de temperatura e intercambio de réplicas');
(async () => {
  const d9 = await R(`(async function(){
    Nx=12;Ny=12;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';hPass=false;muH=0;globalSwapPct=0;
    setRandomSeed(3); buildGrid(3,0,1); buildPhysNB(); E=calcFullE(); setRandomSeed(null);
    const sig0=Array.from(G).join(''), E0=E;
    const o={temps:[4000,8000,12000,16000], steps:3000, mode:'pt', swapEvery:100, eqFrac:0.3, nSamples:20, seed:77};
    const a=await runTemperatureSweep(o), b=await runTemperatureSweep(o);
    const c=await runTemperatureSweep({...o, mode:'indep'});
    const csv=temperatureSweepCSV(a);
    return {restored:Array.from(G).join('')===sig0 && E===E0,
      same:JSON.stringify(a.results.map(r=>[r.Emean,r.CvkB]))===JSON.stringify(b.results.map(r=>[r.Emean,r.CvkB])),
      finite:a.results.every(r=>Number.isFinite(r.Emean)&&Number.isFinite(r.CvkB)&&r.nSamples===20),
      swaps:a.swaps.map(s=>s.accPct), tried:a.swaps.every(s=>s.tried>0), indepNoSwap:c.mode==='indep',
      Emeans:a.results.map(r=>r.Emean), csvLines:csv.split('\\n').length, seedNull:getRandomSeed()===null};
  })()`);
  chk('estado del usuario restaurado (G, E) y RNG sin semilla fija', d9.restored && d9.seedNull);
  chk('reproducible con la misma semilla', d9.same);
  chk('observables finitos y 20 muestras por réplica', d9.finite);
  chk('se intentan intercambios entre todas las temperaturas vecinas', d9.tried && d9.swaps.every((v) => v >= 0 && v <= 100), `aceptación % = ${d9.swaps.map((v) => v.toFixed(1)).join(', ')}`);
  chk('⟨E⟩ no decrece con T (ordenamiento térmico)', d9.Emeans.every((v, i, a) => i === 0 || v >= a[i - 1] - 1e-6), d9.Emeans.map((v) => v.toFixed(1)).join(' < '));
  chk('CSV del barrido generado', d9.csvLines >= 8, `${d9.csvLines} líneas`);

  console.log('\n' + '='.repeat(72));
  console.log(fails === 0 ? '  INVESTIGACIÓN: TODAS LAS PRUEBAS PASAN' : `  INVESTIGACIÓN: ${fails} FALLO(S)`);
  console.log('='.repeat(72));
  process.exitCode = fails === 0 ? 0 : 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });
