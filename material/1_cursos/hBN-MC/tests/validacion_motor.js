/* Suite de validación del motor Monte Carlo — hBN-MC v15
 *
 * Cada prueba compara el cálculo incremental con un recálculo independiente
 * (fuerza bruta) o con un valor analítico. El proceso termina con código 1
 * si alguna prueba falla.
 *
 *   M1  Topología: grado 3, simetría, alternancia B/N, d = 1.44 Å (AC/ZZ, PBC).
 *   M2  calcFullE frente a la suma explícita de epsEff sobre enlaces únicos,
 *       en ambos reservorios de H y con Δμ_H ≠ 0.
 *   M3  ΔE local (vecinos) frente a recálculo completo.
 *   M4  ΔE global (pares arbitrarios) frente a recálculo completo.
 *   M5  Deriva de la energía incremental en 20 000 pasos MC con pasivación H.
 *   M6  Reproducibilidad bit a bit por semilla.
 *   M7  Invariancia traslacional de la energía bajo PBC.
 *   M8  Protocolos térmicos (anneal, iso, 3 fases, ciclo).
 *   M9  Energía de formación: lámina perfecta = 0, grafeno = 0, vacancias
 *       simples con valor analítico, independencia respecto de ε_NB.
 *   M10 Energía de borde por H: fórmula analítica frente a diferencia finita.
 */
'use strict';
const { run: R } = require('./harness.js');

let fails = 0;
const chk = (name, pass, detail = '') => {
  if (!pass) fails++;
  console.log(`  ${pass ? 'PASS' : '**FAIL**'}  ${name}${detail ? '  ·  ' + detail : ''}`);
};
const H = (t) => console.log('\n' + t + '\n' + '-'.repeat(t.length));

const setup = (nx, ny, orient = 'AC', px = true, py = true) =>
  R(`Nx=${nx};Ny=${ny};latticeOrient='${orient}';pbcX=${px};pbcY=${py};latticeStart='B';buildGrid(1,0,1);buildPhysNB();`);

// ---------------------------------------------------------------- M1
H('M1 · Topología de la red');
for (const orient of ['AC', 'ZZ']) {
  for (const [nx, ny] of [[12, 12], [12, 20], [20, 12], [16, 16]]) {
    setup(nx, ny, orient);
    const r = R(`(function(){
      let bad=0,badDeg=0,badSym=0,badAlt=0;
      const LXp=D/2, LYp=D*Math.sqrt(3)/2, DXp=2*LXp+2*D, DYp=2*LYp;
      const W=latticeOrient==='ZZ'?(Ny>>1)*DYp:(Nx>>1)*DXp;
      const Hh=latticeOrient==='ZZ'?(Nx>>1)*DXp:(Ny>>1)*DYp;
      for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
        const k=idx(i,j), nb=PNB[k];
        if(nb.length!==3) badDeg++;
        const [x1,y1]=atomPos(i,j);
        for(const [ni,nj] of nb){
          const nk=idx(ni,nj);
          if(!PNB[nk].some(([a,b])=>idx(a,b)===k)) badSym++;
          if(G[k]===G[nk]) badAlt++;
          const [x2,y2]=atomPos(ni,nj);
          let dx=x2-x1, dy=y2-y1; dx-=W*Math.round(dx/W); dy-=Hh*Math.round(dy/Hh);
          if(Math.abs(Math.hypot(dx,dy)-D)>1e-9) bad++;
        }
      }
      return {bad,badDeg,badSym,badAlt};
    })()`);
    chk(`${orient} ${nx}×${ny}`, r.bad + r.badDeg + r.badSym + r.badAlt === 0, JSON.stringify(r));
  }
}

// ---------------------------------------------------------------- M2
H('M2 · calcFullE frente a suma explícita (fuerza bruta)');
setup(16, 16);
for (const [res, mh] of [['tesis', 0], ['tesis', 0.37], ['H2', 0], ['H2', -1.2]]) {
  const r = R(`(function(){
    setHydrogenReservoir('${res}'); muH=${mh}; hPass=false; setRandomSeed(12345);
    for(let k=0;k<Nx*Ny;k++){ const x=rand(); G[k]= x<0.35?1 : x<0.70?2 : x<0.88?3 : 0; }
    const Ef=calcFullE(); let e=0; const seen=new Set();
    for(let k=0;k<Nx*Ny;k++) for(const [a,b] of PNB[k]){ const nk=idx(a,b);
      const key=k<nk?k+'_'+nk:nk+'_'+k; if(seen.has(key)) continue; seen.add(key); e+=epsEff(G[k],G[nk]); }
    return Math.abs(Ef-e);
  })()`);
  chk(`reservorio=${res} Δμ_H=${mh}`, r < 1e-8, `|diff| = ${r.toExponential(2)} eV`);
}
R(`setHydrogenReservoir('tesis'); muH=0;`);

// ---------------------------------------------------------------- M3/M4
H('M3/M4 · ΔE incremental frente a recálculo completo');
for (const [res, mh, hp] of [['tesis', 0, false], ['tesis', 0.5, true], ['H2', -0.8, true]]) {
  const r = R(`(function(){
    setHydrogenReservoir('${res}'); muH=${mh}; hPass=${hp};
    Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=${hp ? 'false' : 'true'};latticeStart='B';
    buildGrid(1,0,1); buildPhysNB(); setRandomSeed(777);
    for(let k=0;k<Nx*Ny;k++){ const x=rand(); G[k]= x<0.40?1 : x<0.80?2 : x<0.92?3 : 0; }
    let mL=0,mG=0,nL=0,nG=0;
    for(let t=0;t<1500;t++){
      const k1=Math.floor(rand()*Nx*Ny);
      const nb=PNB[k1]; if(!nb.length) continue;
      const [i2,j2]=nb[Math.floor(rand()*nb.length)];
      const i1=(k1/Nx)|0, j1=k1%Nx, k2=idx(i2,j2);
      if(G[k1]!==G[k2]){
        const E0=calcFullE(), d=calcDeltaE(i1,j1,i2,j2);
        let q=G[k1];G[k1]=G[k2];G[k2]=q; mL=Math.max(mL,Math.abs(d-(calcFullE()-E0))); nL++;
        q=G[k1];G[k1]=G[k2];G[k2]=q;
      }
      const a=Math.floor(rand()*Nx*Ny), b=Math.floor(rand()*Nx*Ny);
      if(a!==b && G[a]!==G[b]){
        const E0=calcFullE(), d=calcDeltaE_global((a/Nx)|0,a%Nx,(b/Nx)|0,b%Nx);
        let q=G[a];G[a]=G[b];G[b]=q; mG=Math.max(mG,Math.abs(d-(calcFullE()-E0))); nG++;
        q=G[a];G[a]=G[b];G[b]=q;
      }
    }
    return {mL,mG,nL,nG};
  })()`);
  chk(`local  reservorio=${res} Δμ_H=${mh} hPass=${hp}`, r.mL < 1e-8, `n=${r.nL} err_max=${r.mL.toExponential(2)} eV`);
  chk(`global reservorio=${res} Δμ_H=${mh} hPass=${hp}`, r.mG < 1e-8, `n=${r.nG} err_max=${r.mG.toExponential(2)} eV`);
}
R(`setHydrogenReservoir('tesis'); muH=0; pbcY=true;`);

// ---------------------------------------------------------------- M5
H('M5 · Deriva de la energía incremental (20 000 pasos)');
for (const [res, mh, hp] of [['tesis', 0, false], ['tesis', 0, true], ['H2', -1, true]]) {
  const r = R(`(function(){
    Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    setHydrogenReservoir('${res}'); muH=${mh}; hPass=${hp}; T=15000; accepted=0; rejected=0;
    setRandomSeed(2024); buildGrid(2,30,3); buildPhysNB(); E=calcFullE();
    for(let s=0;s<20000;s++){ if(rand()<0.5) metro(); else metro_global(); }
    return {drift:Math.abs(E-calcFullE()), acc:accepted/(accepted+rejected)};
  })()`);
  chk(`reservorio=${res} Δμ_H=${mh} hPass=${hp}`, r.drift < 1e-6, `deriva=${r.drift.toExponential(2)} eV · aceptación ${(r.acc * 100).toFixed(2)} %`);
}
R(`setHydrogenReservoir('tesis'); muH=0;`);

// ---------------------------------------------------------------- M6
H('M6 · Reproducibilidad por semilla');
const rep = R(`(function(){
  const go=(seed)=>{ Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0; hPass=false; T=12000; accepted=0;rejected=0; setRandomSeed(seed);
    buildGrid(2,40,3); buildPhysNB(); E=calcFullE();
    for(let s=0;s<8000;s++){ if(rand()<0.5) metro(); else metro_global(); }
    return {E, sig:Array.from(G).join('')}; };
  const a=go(99), b=go(99), c=go(100); setRandomSeed(null);
  return {same:a.E===b.E && a.sig===b.sig, differ:a.sig!==c.sig};
})()`);
chk('misma semilla → misma trayectoria', rep.same);
chk('semilla distinta → trayectoria distinta', rep.differ);

// ---------------------------------------------------------------- M7
H('M7 · Invariancia traslacional bajo PBC');
const inv = R(`(function(){
  const Es=[];
  for(const [ci,cj] of [[12,12],[0,0],[6,18],[23,23],[2,22],[17,3]]){
    Nx=24;Ny=24;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B'; hPass=false; muH=0;
    buildGrid(1,0,1); buildPhysNB();
    const st=idx(ci,cj); const seen=new Set([st]); const q=[[st,0]];
    while(q.length){ const [k,d]=q.shift(); if(d>=3) continue;
      for(const [p,r] of PNB[k]){ const nk=idx(p,r); if(!seen.has(nk)){ seen.add(nk); q.push([nk,d+1]); } } }
    // misma paridad de subred en todas las posiciones
    if(((ci+cj)&1)!==0) return null;
    for(const k of seen) G[k]=0; Es.push(calcFullE());
  }
  return Math.max(...Es)-Math.min(...Es);
})()`);
chk('dispersión de E entre 6 posiciones del mismo poro', inv !== null && inv < 1e-9, `${inv !== null ? inv.toExponential(2) : 'n/d'} eV`);

// ---------------------------------------------------------------- M8
H('M8 · Protocolos térmicos');
const tp = R(`(function(){
  const n=1000;
  return {
    anneal:[temperatureAtStep(0,n,'anneal',5000,500),temperatureAtStep(500,n,'anneal',5000,500)],
    iso:temperatureAtStep(700,n,'iso',3000,500),
    ph:[temperatureAtStep(100,n,'3phase',5000,900),temperatureAtStep(500,n,'3phase',5000,900),temperatureAtStep(900,n,'3phase',5000,900)],
    cyc:[temperatureAtStep(0,n,'cycle',2000,20000),temperatureAtStep(250,n,'cycle',2000,20000),temperatureAtStep(500,n,'cycle',2000,20000),temperatureAtStep(750,n,'cycle',2000,20000),temperatureAtStep(1000,n,'cycle',2000,20000)],
    max:TEMP_MAX_K
  };
})()`);
chk('recocido lineal', tp.anneal[0] === 5000 && Math.abs(tp.anneal[1] - 2750) < 1e-9, JSON.stringify(tp.anneal));
chk('isotérmico', tp.iso === 3000);
chk('3 fases (meseta/rampa/meseta)', tp.ph[0] === 5000 && Math.abs(tp.ph[1] - 2950) < 1e-9 && tp.ph[2] === 900, JSON.stringify(tp.ph));
chk('ciclo 2000→20000→2000 K', JSON.stringify(tp.cyc) === JSON.stringify([2000, 11000, 20000, 11000, 2000]), JSON.stringify(tp.cyc));
chk('T máxima permite el protocolo del artículo (20 000 K)', tp.max >= 20000);

// ---------------------------------------------------------------- M9
H('M9 · Energía de formación');
const ef = R(`(function(){
  Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B'; hPass=true; muH=0;
  FORM_MU_BN_REF='model';
  buildGrid(1,0,1); buildPhysNB(); setChemicalEnvironment('Nrich',0);
  const hbn=calcFormationEnergyDFTLike().Eform;
  buildGrid(43,0,1); const gra=calcFormationEnergyDFTLike().Eform;
  buildGrid(1,0,1);
  let kB=-1,kN=-1; for(let q=0;q<Nx*Ny;q++){ if(G[q]===B_T&&kB<0) kB=q; if(G[q]===N_T&&kN<0) kN=q; }
  G[kB]=V_T; setChemicalEnvironment('Nrich',0); const vB=calcFormationEnergyDFTLike();
  G[kB]=B_T; G[kN]=V_T; setChemicalEnvironment('Brich',0); const vN=calcFormationEnergyDFTLike();
  // independencia de εNB para defectos de una sola subred
  const save=EPS_NB; setModelParameters({NB:save-0.744}); setChemicalEnvironment('Brich',0);
  const vN2=calcFormationEnergyDFTLike().Eform; setModelParameters({NB:save});
  G[kN]=N_T; setChemicalEnvironment('Nrich',0);
  return {hbn,gra,vB:vB.Eform,vBHH:vB.EHH,vN:vN.Eform,vN2,
    vBref:3*(EPS_XN-E_MOL.NH3/3), vNref:3*(EPS_XB-E_MOL.BH3/3)};
})()`);
chk('h-BN perfecto: E_form = 0', Math.abs(ef.hbn) < 1e-8, `${ef.hbn.toExponential(2)} eV`);
chk('grafeno perfecto: E_form = 0', Math.abs(ef.gra) < 1e-8, `${ef.gra.toExponential(2)} eV`);
chk('V_B + 3H rico en N = 3(ε_XN − E(NH₃)/3)', Math.abs(ef.vB - ef.vBref) < 1e-8, `${ef.vB.toFixed(4)} eV (penalización H–H aparte: ${ef.vBHH.toFixed(1)} eV)`);
chk('V_N + 3H rico en B = 3(ε_XB − E(BH₃)/3)', Math.abs(ef.vN - ef.vNref) < 1e-8, `${ef.vN.toFixed(4)} eV`);
chk('V_N independiente de ε_NB (misma escala de μ)', Math.abs(ef.vN - ef.vN2) < 1e-8);

// ---------------------------------------------------------------- M10
H('M10 · Energía de borde por H (analítica frente a diferencia finita)');
for (const [res, mh] of [['tesis', 0], ['H2', 0], ['H2', -1.5]]) {
  const r = R(`(function(){
    Nx=24;Ny=24;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B'; hPass=false;
    setHydrogenReservoir('${res}'); muH=${mh};
    buildGrid(1,0,1); buildPhysNB();
    // Divacancia B+N (un enlace B–N quitado) frente a las mismas dos vacancias
    // separadas: mismos átomos, ΔN_H = +2, sin enlaces homonucleares.
    const k0=idx(10,10); const nb=PNB[k0][0]; const k1=idx(nb[0],nb[1]);
    G[k0]=V_T; G[k1]=V_T; const Ea=calcFullE();
    const tB=baseHBNType(10,10), tN=baseHBNType(nb[0],nb[1]);
    G[k0]=tB; G[k1]=tN;
    // segunda configuración: las mismas especies quitadas en sitios lejanos
    let far0=-1,far1=-1;
    for(let q=0;q<Nx*Ny;q++){ if(far0<0 && G[q]===tB && q!==k0 && Math.abs(((q/Nx)|0)-10)>6) far0=q; }
    for(let q=0;q<Nx*Ny;q++){ if(far1<0 && G[q]===tN && Math.abs(((q/Nx)|0)-((far0/Nx)|0))>6 && Math.abs(((q/Nx)|0)-10)>6) far1=q; }
    G[far0]=V_T; G[far1]=V_T; const Eb=calcFullE();
    return {fd:(Eb-Ea)/2, an:edgeEnergyPerHydrogen().perH};
  })()`);
  chk(`reservorio=${res} Δμ_H=${mh}`, Math.abs(r.fd - r.an) < 1e-8, `ΔE/ΔN_H = ${r.fd.toFixed(4)} eV · fórmula = ${r.an.toFixed(4)} eV`);
}
R(`setHydrogenReservoir('tesis'); muH=0; setRandomSeed(null);`);

// ---------------------------------------------------------------- M11
H('M11 · Generadores geométricos 10–14 en todos los tamaños (AC y ZZ)');
for (const orient of ['AC', 'ZZ']) {
  const g = R(`(function(){
    const out=[];
    for(const opc of [10,11,12,13,14]) for(let sz=1;sz<=6;sz++){
      Nx=48;Ny=48;latticeOrient='${orient}';pbcX=true;pbcY=true;latticeStart='B';
      buildGrid(opc,0,sz); buildPhysNB();
      const v=validateSinglePore(opc===10?'N':opc===11?'B':null);
      out.push({opc,sz,ok:v.ok,n:v.nVac,e:v.edgeN+'/'+v.edgeB,sq:Number.isInteger(Math.sqrt(v.nVac))});
    }
    return out;
  })()`);
  const bad = g.filter((r) => !r.ok || ((r.opc === 10 || r.opc === 11) && !r.sq));
  chk(`${orient}: 30 poros, un clúster, terminación correcta, triángulos de n² vacancias`, bad.length === 0,
    bad.length ? JSON.stringify(bad) : g.filter((r) => r.opc === 10).map((r) => r.n).join(', ') + ' (triángulo N)');
}

console.log('\n' + '='.repeat(72));
console.log(fails === 0 ? '  MOTOR: TODAS LAS PRUEBAS PASAN' : `  MOTOR: ${fails} FALLO(S)`);
console.log('='.repeat(72));
process.exitCode = fails === 0 ? 0 : 1;
