'use strict';
const {sandbox}=require('./harness.js');
const vm=require('vm');
const R=(c)=>vm.runInContext(c,sandbox);
const ok=(b)=>b?'PASS':'**FAIL**';
let fails=0; const chk=(n,p,d)=>{ if(!p)fails++; console.log(`  ${ok(p)}  ${n}${d?'  ·  '+d:''}`); };
console.log('='.repeat(78));
console.log('VALIDACION de los parches v14.7 sobre la API v15');
console.log('='.repeat(78));

// D8 + coherencia de parametros
const d8=R(`(function(){
  const m=checkParameterConsistency();
  return {eps:EPS_XC, dhC:hydrogenationEnergyFromEps(EPS_XC,'C'),
          dhN:hydrogenationEnergyFromEps(EPS_XN,'N'), dhB:hydrogenationEnergyFromEps(EPS_XB,'B'),
          errores:m.filter(x=>x.lvl==='error').length, avisos:m.filter(x=>x.lvl==='warn').map(x=>x.txt)};
})()`);
chk('D8 eps_XC = -70.41', Math.abs(d8.eps+70.41)<1e-6, `dE_hidrog(C)=${d8.dhC.toFixed(3)} eV`);
chk('D8 monotonia con electronegatividad', d8.dhC<=d8.dhB && d8.dhC>=d8.dhN,
    `B=${d8.dhB.toFixed(2)} < C=${d8.dhC.toFixed(2)} < N=${d8.dhN.toFixed(2)}`);
chk('checkParameterConsistency sin errores', d8.errores===0, `${d8.avisos.length} aviso(s)`);
d8.avisos.forEach(a=>console.log('        aviso esperado (D3): '+a.slice(0,90)+'...'));

// D1 potenciales quimicos (v15: límites de la ventana corregidos)
const d1=R(`(function(){
  const s=FORM_MU_B+FORM_MU_N;
  const w=chemicalWindow(0);
  const nr=setChemicalEnvironment('Nrich',0), br=setChemicalEnvironment('Brich',0);
  setChemicalEnvironment('Nrich',0);
  return {suma:s, muBN:formationMuBN(), nr, br, w, iguales:Math.abs(FORM_MU_B-FORM_MU_N)<1e-6, muH:FORM_MU_H,
          nh3:E_MOL.NH3, bh3:E_MOL.BH3, h2:E_MOL.H2};
})()`);
chk('D1 mu_B + mu_N = mu_BN', Math.abs(d1.suma-d1.muBN)<1e-3, `${d1.suma.toFixed(3)} = ${d1.muBN.toFixed(3)}`);
chk('D1 mu_B != mu_N (no es reparto 50/50)', !d1.iguales, `mu_B=${d1.nr.muB.toFixed(3)} mu_N=${d1.nr.muN.toFixed(3)}`);
chk('D1 mu_H = E(H2)/2', Math.abs(d1.muH+15.031)<1e-3, `${d1.muH.toFixed(4)} eV`);
chk('D1 ambos ambientes respetan la restriccion',
    Math.abs(d1.nr.muB+d1.nr.muN-d1.muBN)<1e-3 && Math.abs(d1.br.muB+d1.br.muN-d1.muBN)<1e-3);
chk('D1 rico en N: mu_N = E(NH3) - 3 mu_H', Math.abs(d1.nr.muN-(d1.nh3-1.5*d1.h2))<1e-9, `${d1.nr.muN.toFixed(4)}`);
chk('D1 rico en B: mu_B = E(BH3) - 3 mu_H', Math.abs(d1.br.muB-(d1.bh3-1.5*d1.h2))<1e-9, `${d1.br.muB.toFixed(4)}`);
chk('D1 ventana vacia a dmu_H=0 detectada', d1.w.open===false && d1.w.muNmax<d1.w.muNmin, `mu_N,max=${d1.w.muNmax.toFixed(3)} < mu_N,min=${d1.w.muNmin.toFixed(3)}`);

// D2 generadores conexos + terminacion
console.log('\n  D2 — generadores geometricos:');
for(const [opc,lbl,expForma,expTerm] of [[10,'Triangulo borde-N','triangle','N'],
                                          [11,'Triangulo borde-B','triangle','B'],
                                          [12,'Paralelogramo A','parallelogram',null],
                                          [13,'Paralelogramo B','parallelogram',null],
                                          [14,'Hexagono NH=BH','hexagon',null]]){
  const r=R(`(function(){
    Nx=28;Ny=28;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0;hPass=false;setRandomSeed(1);
    buildGrid(${opc},0,4); buildPhysNB();
    const a=assertPoreConnected(); const cl=getPoreClusters();
    const c=classifyPoreCluster(cl[0]);
    let nN=0,nB=0;
    for(const k of cl[0]){const p=(k/Nx)|0,q=k%Nx;
      for(const[u,v] of PNB[idx(p,q)]){const t=G[idx(u,v)];if(t===1)nN++;else if(t===2)nB++;}}
    const xs=[],ys=[];
    for(const k of cl[0]){const [x,y]=atomPos((k/Nx)|0,k%Nx); xs.push(x); ys.push(y);}
    return {conexo:a.ok,n:a.nVac,cl:a.nClusters,key:c.key,comp:c.compactness,nN,nB,
            dx:Math.max(...xs)-Math.min(...xs), dy:Math.max(...ys)-Math.min(...ys)};
  })()`);
  const termOk = expTerm===null ? (r.nN>0&&r.nB>0) : (expTerm==='N'?r.nB===0:r.nN===0);
  chk(lbl, r.conexo && r.key===expForma && termOk,
      `${r.n} vac · ${r.cl} cluster · ${r.key} (comp ${r.comp.toFixed(4)}) · bordes N=${r.nN} B=${r.nB} · ${r.dx.toFixed(1)}x${r.dy.toFixed(1)} A`);
}

// D4 clasificador invariante bajo PBC
R(`function makePore(ci,cj,rad){
  const st=idx(ci,cj); const seen=new Set([st]); const q=[[st,0]]; const out=[st];
  while(q.length){ const [k,d]=q.shift(); if(d>=rad) continue;
    const a=(k/Nx)|0,b=k%Nx;
    for(const[p,r] of PNB[idx(a,b)]){ const nk=idx(p,r);
      if(!seen.has(nk)){ seen.add(nk); out.push(nk); q.push([nk,d+1]); } } }
  for(const k of out) G[k]=0; return out.length;
}`);
const d4=R(`(function(){
  const res=[];
  for(const [ci,cj] of [[12,12],[0,0],[6,18],[23,23]]){
    Nx=24;Ny=24;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0;hPass=false; buildGrid(1,0,1); buildPhysNB(); makePore(ci,cj,3);
    const c=classifyPoreCluster(getPoreClusters()[0]);
    res.push({key:c.key,comp:c.compactness,ratio:c.ratio});
  }
  return res;
})()`);
console.log('\n  D4 — clasificador bajo traslacion periodica:');
const keys=new Set(d4.map(r=>r.key));
const spreadC=Math.max(...d4.map(r=>r.comp))-Math.min(...d4.map(r=>r.comp));
d4.forEach((r,i)=>console.log(`        posicion ${i+1}: ${r.key.padEnd(14)} comp ${r.comp.toFixed(4)} ratio ${r.ratio.toFixed(3)}`));
chk('D4 clasificacion invariante', keys.size===1 && spreadC<1e-6, `dispersion compacidad = ${spreadC.toExponential(2)}`);

// D6 estequiometria
console.log('\n  D6 — estequiometria de los generadores aleatorios:');
for(const opc of [3,4]){
  const r=R(`(function(){
    let mx=0;
    for(let s=0;s<40;s++){
      Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
      setRandomSeed(500+s*7919); buildGrid(${opc},40,3);
      let a=0,b=0; for(let k=0;k<Nx*Ny;k++){if(G[k]===1)a++;else if(G[k]===2)b++;}
      mx=Math.max(mx,Math.abs(a-b));
    }
    return mx;
  })()`);
  chk(`D6 opc=${opc} estequiometria exacta`, r<=1, `max |N-B| sobre 40 semillas = ${r}  (v14.6: 28 y 38)`);
}

// D7 delta E global con vecinos
const d7=R(`(function(){
  Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
  muH=0;hPass=false;setRandomSeed(4242); buildGrid(1,0,1); buildPhysNB();
  for(let k=0;k<Nx*Ny;k++){const r=rand(); G[k]= r<0.35?1:r<0.70?2:r<0.88?3:0;}
  let mxNb=0,nNb=0,mx=0,n=0;
  for(let t=0;t<3000;t++){
    const k1=Math.floor(rand()*Nx*Ny), k2=Math.floor(rand()*Nx*Ny);
    if(k1===k2||G[k1]===G[k2]) continue;
    const i1=(k1/Nx)|0,j1=k1%Nx,i2=(k2/Nx)|0,j2=k2%Nx;
    const isNb=PNB[k1].some(([a,b])=>idx(a,b)===k2);
    const E0=calcFullE(), dP=calcDeltaE_global(i1,j1,i2,j2);
    let tm=G[k1];G[k1]=G[k2];G[k2]=tm;
    const err=Math.abs(dP-(calcFullE()-E0));
    if(isNb){mxNb=Math.max(mxNb,err);nNb++;} else {mx=Math.max(mx,err);n++;}
    tm=G[k1];G[k1]=G[k2];G[k2]=tm;
  }
  return {mx,n,mxNb,nNb};
})()`);
console.log('');
chk('D7 dE global con pares vecinos', d7.mxNb<1e-8, `n=${d7.nNb}, err_max=${d7.mxNb.toExponential(2)} eV  (v14.6: 1.9e+1)`);
chk('D7 dE global con pares no vecinos', d7.mx<1e-8, `n=${d7.n}, err_max=${d7.mx.toExponential(2)} eV`);

console.log('\n'+'='.repeat(78));
console.log(fails===0?'  TODOS LOS PARCHES VERIFICADOS':`  ${fails} FALLO(S)`);
console.log('='.repeat(78));
process.exitCode = fails===0 ? 0 : 1;
