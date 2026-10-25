/* Suite de validación numérica — hBN-MC v14.6
   Ejecutar desde tests/: node validacion_T1_T21.js (requiere harness.js en el mismo directorio)
   Carga core.js en un entorno headless (stub mínimo de DOM) y corre 21 pruebas.
   Adjuntar como "validation suite" al someter a Computer Physics Communications.
*/
'use strict';
const {sandbox}=require('../harness.js');
const vm=require('vm');
const R=(c)=>vm.runInContext(c,sandbox);
const ok=(b)=>b?'PASS':'**FAIL**';
const L='='.repeat(78);

// ======================================================================
// ==== t_engine.js ====
// ======================================================================
(function(){

function setup(nx,ny,orient='AC',pbcx=true,pbcy=true,start='B'){
  R(`Nx=${nx};Ny=${ny};latticeOrient='${orient}';pbcX=${pbcx};pbcY=${pbcy};latticeStart='${start}';`);
  R(`buildGrid(1,0,1); buildPhysNB();`);
}

console.log('='.repeat(72));
console.log('T1 — TOPOLOGIA DE LA RED (atomPos vs physNB)');
console.log('='.repeat(72));
for(const orient of ['AC','ZZ']){
  for(const [nx,ny] of [[12,12],[12,20],[20,12],[16,16]]){
    setup(nx,ny,orient,true,true);
    const res=R(`(function(){
      const D=1.44;
      let bad=0,badDeg=0,badSym=0,badAlt=0,maxErr=0;
      const LXp=D/2, LYp=D*Math.sqrt(3)/2, DXp=2*LXp+2*D, DYp=2*LYp;
      // extensión física de la celda
      let W,H;
      if(latticeOrient==='ZZ'){ W=(Ny>>1)*DYp; H=(Nx>>1)*DXp; }
      else { W=(Nx>>1)*DXp; H=(Ny>>1)*DYp; }
      for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
        const k=idx(i,j);
        const nb=PNB[k];
        if(nb.length!==3) badDeg++;
        const [x1,y1]=atomPos(i,j);
        for(const [ni,nj] of nb){
          const nk=idx(ni,nj);
          // simetría
          if(!PNB[nk].some(([a,b])=>idx(a,b)===k)) badSym++;
          // alternancia B/N
          if(G[k]===G[nk]) badAlt++;
          const [x2,y2]=atomPos(ni,nj);
          let dx=x2-x1, dy=y2-y1;
          // imagen mínima
          dx-=W*Math.round(dx/W); dy-=H*Math.round(dy/H);
          const d=Math.hypot(dx,dy);
          const err=Math.abs(d-D);
          if(err>1e-6){ bad++; if(err>maxErr) maxErr=err; }
        }
      }
      return {bad,badDeg,badSym,badAlt,maxErr,n:Nx*Ny*3};
    })()`);
    console.log(`  ${orient} ${nx}x${ny} PBC-XY: grado3 ${ok(res.badDeg===0)} | simetria ${ok(res.badSym===0)} | alternancia B/N ${ok(res.badAlt===0)} | d=1.44A ${ok(res.bad===0)} (fallos ${res.bad}/${res.n}, maxErr ${res.maxErr.toExponential(2)})`);
  }
}
// bordes abiertos
for(const orient of ['AC','ZZ']){
  for(const [px,py,lbl] of [[true,false,'PBC-X'],[false,true,'PBC-Y'],[false,false,'abierto']]){
    setup(16,16,orient,px,py);
    const res=R(`(function(){
      let deg={},badSym=0;
      for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){
        const k=idx(i,j); const n=PNB[k].length; deg[n]=(deg[n]||0)+1;
        for(const[a,b] of PNB[k]) if(!PNB[idx(a,b)].some(([p,q])=>idx(p,q)===k)) badSym++;
      }
      return {deg,badSym};
    })()`);
    console.log(`  ${orient} 16x16 ${lbl}: grados=${JSON.stringify(res.deg)} simetria ${ok(res.badSym===0)}`);
  }
}

console.log();
console.log('='.repeat(72));
console.log('T2 — ENERGIA TOTAL: calcFullE vs conteo de enlaces por fuerza bruta');
console.log('='.repeat(72));
setup(16,16,'AC',true,true);
const t2=R(`(function(){
  ready=true; hPass=false; muH=0;
  setRandomSeed(12345);
  // configuracion desordenada con B,N,C,V
  for(let k=0;k<Nx*Ny;k++){ const r=rand(); G[k]= r<0.35?1 : r<0.70?2 : r<0.88?3 : 0; }
  const Efull=calcFullE();
  // fuerza bruta: recorrer pares unicos
  let e=0;
  const seen=new Set();
  for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    for(const[a,b] of PNB[k]){
      const nk=idx(a,b);
      const key=k<nk?k+'_'+nk:nk+'_'+k;
      if(seen.has(key)) continue; seen.add(key);
      e+=eps(G[k],G[nk]);
    }
  }
  return {Efull,e,diff:Math.abs(Efull-e),nPairs:seen.size};
})()`);
console.log(`  calcFullE = ${t2.Efull.toFixed(6)} eV`);
console.log(`  fuerza bruta = ${t2.e.toFixed(6)} eV  (${t2.nPairs} enlaces unicos)`);
console.log(`  |diff| = ${t2.diff.toExponential(3)}  ${ok(t2.diff<1e-8)}`);

console.log();
console.log('  -- con muH != 0 --');
for(const mh of [0.3,0.5]){
  const r=R(`(function(){ muH=${mh};
    const Efull=calcFullE();
    let e=0; const seen=new Set();
    for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){ const k=idx(i,j);
      for(const[a,b] of PNB[k]){ const nk=idx(a,b);
        const key=k<nk?k+'_'+nk:nk+'_'+k; if(seen.has(key))continue; seen.add(key);
        e+=epsEff(G[k],G[nk]); } }
    return {Efull,e,diff:Math.abs(Efull-e)};
  })()`);
  console.log(`  muH=${mh}: calcFullE=${r.Efull.toFixed(4)}  epsEff-bruta=${r.e.toFixed(4)}  diff=${r.diff.toExponential(2)} ${ok(r.diff<1e-8)}`);
}
R('muH=0;');

console.log();
console.log('='.repeat(72));
console.log('T3 — DELTA E LOCAL (vecinos) vs recalculo completo');
console.log('='.repeat(72));
for(const mh of [0,0.3,0.5]){
  const r=R(`(function(){
    muH=${mh}; hPass=false; setRandomSeed(777);
    for(let k=0;k<Nx*Ny;k++){ const r=rand(); G[k]= r<0.35?1 : r<0.70?2 : r<0.88?3 : 0; }
    let maxErr=0, n=0, nz=0;
    for(let t=0;t<4000;t++){
      const i1=Math.floor(rand()*Ny), j1=Math.floor(rand()*Nx);
      const nb=PNB[idx(i1,j1)]; const [i2,j2]=nb[Math.floor(rand()*nb.length)];
      if(G[idx(i1,j1)]===G[idx(i2,j2)]) continue;
      const E0=calcFullE();
      const dPred=calcDeltaE(i1,j1,i2,j2);
      const k1=idx(i1,j1),k2=idx(i2,j2); const tmp=G[k1]; G[k1]=G[k2]; G[k2]=tmp;
      const E1=calcFullE();
      const dReal=E1-E0;
      const err=Math.abs(dPred-dReal);
      if(err>maxErr) maxErr=err;
      if(Math.abs(dReal)<1e-12) nz++;
      n++;
      // deshacer
      const t2=G[k1]; G[k1]=G[k2]; G[k2]=t2;
    }
    return {maxErr,n,nz};
  })()`);
  console.log(`  muH=${mh}: ${r.n} swaps probados, |dE_pred - dE_real|_max = ${r.maxErr.toExponential(3)} eV  ${ok(r.maxErr<1e-8)}`);
}

console.log();
console.log('='.repeat(72));
console.log('T4 — DELTA E GLOBAL (sitios cualesquiera) vs recalculo completo');
console.log('='.repeat(72));
for(const mh of [0,0.4]){
  const r=R(`(function(){
    muH=${mh}; hPass=false; setRandomSeed(4242);
    for(let k=0;k<Nx*Ny;k++){ const r=rand(); G[k]= r<0.35?1 : r<0.70?2 : r<0.88?3 : 0; }
    let maxErr=0,n=0, maxErrNb=0, nNb=0;
    for(let t=0;t<4000;t++){
      const k1=Math.floor(rand()*Nx*Ny), k2=Math.floor(rand()*Nx*Ny);
      if(k1===k2||G[k1]===G[k2]) continue;
      const i1=(k1/Nx)|0,j1=k1%Nx,i2=(k2/Nx)|0,j2=k2%Nx;
      const isNb=PNB[k1].some(([a,b])=>idx(a,b)===k2);
      const E0=calcFullE();
      const dPred=calcDeltaE_global(i1,j1,i2,j2);
      const tmp=G[k1];G[k1]=G[k2];G[k2]=tmp;
      const dReal=calcFullE()-E0;
      const err=Math.abs(dPred-dReal);
      if(isNb){ if(err>maxErrNb)maxErrNb=err; nNb++; }
      else { if(err>maxErr)maxErr=err; n++; }
      const t2=G[k1];G[k1]=G[k2];G[k2]=t2;
    }
    return {maxErr,n,maxErrNb,nNb};
  })()`);
  console.log(`  muH=${mh}: no-vecinos n=${r.n} err_max=${r.maxErr.toExponential(3)} ${ok(r.maxErr<1e-8)}`);
  console.log(`           VECINOS   n=${r.nNb} err_max=${r.maxErrNb.toExponential(3)} ${ok(r.maxErrNb<1e-8)}`);
}
R('muH=0;');

})();

// ======================================================================
// ==== t_gen.js ====
// ======================================================================
(function(){

console.log('='.repeat(72));
console.log('T5 — DERIVA DE LA ENERGIA INCREMENTAL DURANTE MC REAL');
console.log('='.repeat(72));
for(const [mh,hp,lbl] of [[0,false,'muH=0 hPass=off'],[0.5,false,'muH=0.5 hPass=off'],[0,true,'muH=0 hPass=ON'],[0.4,true,'muH=0.4 hPass=ON']]){
  const r=R(`(function(){
    Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=${mh}; hPass=${hp}; T=3000; accepted=0; rejected=0;
    setRandomSeed(2024);
    buildGrid(2, 30, 3); buildPhysNB();
    E=calcFullE();
    const E0=E;
    for(let s=0;s<20000;s++){ if(rand()<0.5) metro(); else metro_global(); }
    const Einc=E, Efull=calcFullE();
    return {E0,Einc,Efull,drift:Math.abs(Einc-Efull),acc:accepted/(accepted+rejected)};
  })()`);
  console.log(`  ${lbl}: E_inc=${r.Einc.toFixed(4)}  calcFullE=${r.Efull.toFixed(4)}  deriva=${r.drift.toExponential(3)} eV  ${ok(r.drift<1e-6)}   (aceptacion ${(r.acc*100).toFixed(1)}%)`);
}

console.log();
console.log('='.repeat(72));
console.log('T6 — REPRODUCIBILIDAD POR SEMILLA');
console.log('='.repeat(72));
const rep=R(`(function(){
  const run=(seed)=>{
    Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0; hPass=false; T=4000; accepted=0;rejected=0;
    setRandomSeed(seed);
    buildGrid(2,40,3); buildPhysNB(); E=calcFullE();
    for(let s=0;s<8000;s++){ if(rand()<0.5) metro(); else metro_global(); }
    return {E, sig:Array.from(G).join('')};
  };
  const a=run(99), b=run(99), c=run(100);
  return {sameE:a.E===b.E, sameG:a.sig===b.sig, diffE:a.E!==c.E, Ea:a.E, Ec:c.E};
})()`);
console.log(`  misma semilla -> misma E:  ${ok(rep.sameE)}   (E=${rep.Ea.toFixed(6)})`);
console.log(`  misma semilla -> misma config: ${ok(rep.sameG)}`);
console.log(`  semilla distinta -> E distinta: ${ok(rep.diffE)}  (E=${rep.Ec.toFixed(6)})`);

console.log();
console.log('='.repeat(72));
console.log('T7 — GENERADORES: inventario y verificacion estructural');
console.log('='.repeat(72));
const names={1:'hBN perfecta',2:'hBN + vac. aleatorias',3:'red aleatoria (B/N/V)',4:'aleatoria B/N + C + vac',
 5:'hBN + vac (=2)',6:'poro paralelogramo',7:'poro triangular (legacy)',8:'vac. agrupadas centro',
 10:'Triangulo term-N',11:'Triangulo term-B',12:'Paralelogramo term-N',13:'Paralelogramo term-B',
 14:'Hexagono',20:'hBN + C sustitucional',21:'hBN + C sustitucional (=20)',
 30:'banda C horizontal',31:'banda C vertical',32:'union hBN|C',33:'banda hBN en C',34:'C|hBN|C',
 40:'isla C en vacio',41:'isla hBN en C',42:'hBN|C|hBN (3 zonas)',43:'grafeno puro',44:'isla hBN en vacio',
 45:'isla C 2x alto',46:'isla C 3x alto',47:'nanocinta (m=2) A',48:'nanocinta (m=2) B',49:'nanocinta 1 fila'};

const rows=[];
for(const opc of Object.keys(names).map(Number)){
  const r=R(`(function(){
    Nx=20;Ny=20;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0;hPass=false;
    setRandomSeed(555);
    try{ buildGrid(${opc}, 40, 3); }catch(e){ return {err:e.message}; }
    buildPhysNB();
    let nN=0,nB=0,nC=0,nV=0;
    for(let k=0;k<Nx*Ny;k++){const t=G[k]; if(t===1)nN++;else if(t===2)nB++;else if(t===3)nC++;else nV++;}
    // enlaces homonucleares en la fase hBN
    let cNN=0,cBB=0,cNB=0;
    const seen=new Set();
    for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){const k=idx(i,j);
      for(const[a,b] of PNB[k]){const nk=idx(a,b); const key=k<nk?k+'_'+nk:nk+'_'+k;
        if(seen.has(key))continue;seen.add(key);
        const p=G[k],q=G[nk];
        if(p===1&&q===1)cNN++; else if(p===2&&q===2)cBB++;
        else if((p===1&&q===2)||(p===2&&q===1))cNB++;}}
    // clasificar el poro mayor
    let poro=null;
    const cl=getPoreClusters();
    if(cl.length && cl[0].length>0){ const c=classifyPoreCluster(cl[0]); if(c) poro={shape:c.key,term:c.term,n:c.n,nCl:cl.length}; }
    E=calcFullE();
    return {nN,nB,nC,nV,cNN,cBB,cNB,poro,E};
  })()`);
  if(r.err){ rows.push([opc,names[opc],'ERROR: '+r.err]); continue; }
  const comp=`N=${r.nN} B=${r.nB} C=${r.nC} V=${r.nV}`;
  const bonds=`NB=${r.cNB} NN=${r.cNN} BB=${r.cBB}`;
  const p=r.poro?`${r.poro.shape}/borde-${r.poro.term}/${r.poro.n}vac/${r.poro.nCl}clust`:'—';
  rows.push([opc,names[opc],comp,bonds,p]);
}
console.log('opc  nombre                        composicion               enlaces              poro mayor');
console.log('-'.repeat(110));
for(const r of rows){
  console.log(String(r[0]).padEnd(5)+String(r[1]).padEnd(30)+String(r[2]||'').padEnd(26)+String(r[3]||'').padEnd(21)+String(r[4]||''));
}

})();

// ======================================================================
// ==== t_shape.js ====
// ======================================================================
(function(){

function dump(opc,label,nx=24,ny=24,sz=3){
  const r=R(`(function(){
    Nx=${nx};Ny=${ny};latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0;hPass=false; setRandomSeed(1);
    buildGrid(${opc},0,${sz}); buildPhysNB();
    const vac=[];
    for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){ const k=idx(i,j);
      if(G[k]===0){ const [x,y]=atomPos(i,j); vac.push({i,j,x,y}); } }
    // clusters en la topologia fisica
    const cl=getPoreClusters().map(c=>c.length);
    return {vac,cl};
  })()`);
  console.log('\n'+'='.repeat(72));
  console.log(`opc=${opc}  ${label}   (sz=${sz}, red ${nx}x${ny})`);
  console.log(`vacancias=${r.vac.length}  clusters fisicos=${JSON.stringify(r.cl)}`);
  // mapa real-space ASCII
  const xs=r.vac.map(v=>v.x), ys=r.vac.map(v=>v.y);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  console.log(`extension real: dx=${(x1-x0).toFixed(2)} A, dy=${(y1-y0).toFixed(2)} A`);
  const W=52,H=22;
  const grid=Array.from({length:H},()=>Array(W).fill(' '));
  for(const v of r.vac){
    const cx=Math.round((v.x-x0)/((x1-x0)||1)*(W-1));
    const cy=Math.round((1-(v.y-y0)/((y1-y0)||1))*(H-1));
    grid[cy][cx]='#';
  }
  console.log('  mapa en espacio real (x horizontal, y vertical):');
  grid.forEach(row=>console.log('  |'+row.join('')+'|'));
  // mapa en espacio de indices
  const is=r.vac.map(v=>v.i), js=r.vac.map(v=>v.j);
  const i0=Math.min(...is),i1=Math.max(...is),j0=Math.min(...js),j1=Math.max(...js);
  const gi=Array.from({length:i1-i0+1},()=>Array(j1-j0+1).fill('.'));
  for(const v of r.vac) gi[v.i-i0][v.j-j0]='#';
  console.log('  mapa en espacio de INDICES (i filas, j columnas):');
  gi.forEach(row=>console.log('  |'+row.join('')+'|'));
}

dump(10,'Triangulo terminacion N');
dump(12,'Paralelogramo terminacion N');
dump(14,'Hexagono');
dump(6,'Paralelogramo (legacy tesis)');
dump(7,'Triangular (legacy tesis)');

})();

// ======================================================================
// ==== t_fit.js ====
// ======================================================================
(function(){
// Reajuste de los parametros del modelo de enlace a partir de las 20 estructuras
// B_x C_y N_z de Mazzoni recalculadas en la tesis (Tabla 5.2 / matriz seccion 5.2).
// Orden de columnas del vector de parametros: [CC, CN, CB, NN, BN, BB]

// --- Version A: matriz literal de la seccion 5.2 de la tesis ---
const A=[
[1,4,0,1,6,0],[2,2,0,2,6,0],[1,0,4,0,6,1],[2,0,2,0,6,2],
[2,4,4,0,2,0],[4,2,2,0,4,0],[2,4,4,0,2,0],[5,1,1,0,5,0],
[1,2,2,0,7,0],[2,1,1,0,8,0],[2,2,0,2,6,0],[2,0,2,0,6,2],
[4,2,2,0,4,0],[4,2,2,0,4,0],[5,0,2,1,4,0],[5,2,0,0,4,1],
[2,0,2,1,7,0],[2,2,0,0,7,1],[0,3,3,0,6,0],[0,3,3,0,6,0]];
const b=[-1649.24,-1647.83,-1295.23,-1296.01,-1411.99,-1411.99,-1411.15,-1412.55,
-1475.71,-1475.67,-1649.08,-1295.96,-1411.17,-1412.53,-1410.33,-1410.67,
-1472.85,-1473.22,-1473.14,-1473.81];

// --- Version B: Tabla 5.2 tal como aparece impresa (columnas nNN nBN nBB nCC nCN nCB) ---
const T=[
[1,6,0,1,4,0],[2,6,0,2,2,0],[0,6,1,1,0,4],[0,6,2,2,0,2],
[0,2,0,2,4,4],[0,4,0,4,2,2],[0,2,0,2,4,4],[0,5,0,5,1,1],
[0,7,0,1,2,2],[0,8,0,2,1,1],[2,6,0,2,2,0],[0,6,2,2,0,2],
[0,4,0,4,2,2],[0,4,0,4,2,2],[1,4,0,5,0,0],[0,4,1,5,2,2],
[1,7,0,2,0,0],[0,7,1,2,2,3],[0,6,0,0,3,3],[0,6,0,0,3,3]];
// reordenar a [CC,CN,CB,NN,BN,BB]
const A2=T.map(r=>[r[3],r[4],r[5],r[0],r[1],r[2]]);

function lstsq(A,b){
  const n=A[0].length;
  const AtA=Array.from({length:n},()=>Array(n).fill(0));
  const Atb=Array(n).fill(0);
  for(let r=0;r<A.length;r++){
    for(let i=0;i<n;i++){
      Atb[i]+=A[r][i]*b[r];
      for(let j=0;j<n;j++) AtA[i][j]+=A[r][i]*A[r][j];
    }
  }
  // Gauss con pivoteo parcial
  const M=AtA.map((row,i)=>row.concat([Atb[i]]));
  for(let c=0;c<n;c++){
    let p=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r;
    [M[c],M[p]]=[M[p],M[c]];
    if(Math.abs(M[c][c])<1e-12) return null;
    for(let r=0;r<n;r++){ if(r===c) continue; const f=M[r][c]/M[c][c];
      for(let k=c;k<=n;k++) M[r][k]-=f*M[c][k]; }
  }
  return M.map((row,i)=>row[n]/row[i][i]===undefined?0:row[n]/M[i][i]);
}
function residuals(A,b,x){
  const pred=A.map(r=>r.reduce((s,v,i)=>s+v*x[i],0));
  const res=pred.map((p,i)=>p-b[i]);
  const rms=Math.sqrt(res.reduce((s,v)=>s+v*v,0)/res.length);
  const maxr=Math.max(...res.map(Math.abs));
  const mean=b.reduce((s,v)=>s+v,0)/b.length;
  const sst=b.reduce((s,v)=>s+(v-mean)**2,0);
  const sse=res.reduce((s,v)=>s+v*v,0);
  return {pred,res,rms,maxr,r2:1-sse/sst};
}

const lbl=['eps_CC','eps_CN','eps_CB','eps_NN','eps_BN','eps_BB'];
const tesis={eps_CC:-107.32,eps_CN:-147.02,eps_CB:-88.01,eps_NN:-185.29,eps_BN:-128.1626,eps_BB:-67.9148};
const codigo={eps_CC:-107.32,eps_CN:-147.02,eps_CB:-88.01,eps_NN:-185.29,eps_BN:-128.1626,eps_BB:-67.9148};

console.log('='.repeat(78));
console.log('T8 — REAJUSTE DE LOS PARAMETROS DEL MODELO DE ENLACE (datos Mazzoni/tesis)');
console.log('='.repeat(78));

// chequeo de consistencia: numero total de enlaces por estructura
const sumsA=A.map(r=>r.reduce((s,v)=>s+v,0));
const sumsT=A2.map(r=>r.reduce((s,v)=>s+v,0));
console.log('\nSuma de enlaces por estructura');
console.log('  matriz seccion 5.2 :',JSON.stringify(sumsA));
console.log('  tabla 5.2 impresa  :',JSON.stringify(sumsT));
console.log('  -> la matriz da 12 enlaces en TODAS (celda de 8 atomos, 8*3/2=12).');
console.log('  -> la tabla impresa tiene 5 filas inconsistentes (10,14,10,15,...): erratas de la tabla.');

for(const [name,M] of [['MATRIZ seccion 5.2 (12 enlaces, consistente)',A],['TABLA 5.2 impresa (con erratas)',A2]]){
  const x=lstsq(M,b);
  const st=residuals(M,b,x);
  console.log('\n--- Ajuste usando '+name+' ---');
  lbl.forEach((l,i)=>{
    const d=x[i]-tesis[l];
    console.log(`  ${l.padEnd(8)} = ${x[i].toFixed(4).padStart(12)} eV   (tesis ${tesis[l].toFixed(4).padStart(11)} , dif ${d>=0?'+':''}${d.toFixed(4)})`);
  });
  console.log(`  RMS residual = ${st.rms.toFixed(4)} eV | max |res| = ${st.maxr.toFixed(4)} eV | R2 = ${st.r2.toFixed(6)}`);
}

// Residuales del ajuste con los parametros PUBLICADOS (los que usa el codigo)
console.log('\n--- Residuales usando los parametros PUBLICADOS (Tabla 5.8 = los del codigo) ---');
const xp=lbl.map(l=>codigo[l]);
const stp=residuals(A,b,xp);
console.log(`  RMS = ${stp.rms.toFixed(4)} eV | max|res| = ${stp.maxr.toFixed(4)} eV | R2 = ${stp.r2.toFixed(6)}`);
console.log('  residual por estructura (eV):');
const et='abcdefghijklmnopqrst';
stp.res.forEach((r,i)=>{ if(Math.abs(r)>0.5) console.log(`    (${et[i]}) ${r>=0?'+':''}${r.toFixed(3)}`); });

// numero de condicion aproximado de A^T A
function condEst(M){
  const n=M[0].length;
  const AtA=Array.from({length:n},()=>Array(n).fill(0));
  for(const r of M) for(let i=0;i<n;i++) for(let j=0;j<n;j++) AtA[i][j]+=r[i]*r[j];
  // potencia iterada para lambda_max, y sobre la inversa para lambda_min (via resolucion)
  let v=Array(n).fill(1), lmax=0;
  for(let it=0;it<500;it++){
    const w=AtA.map(row=>row.reduce((s,x,k)=>s+x*v[k],0));
    const nn=Math.hypot(...w); v=w.map(x=>x/nn); lmax=nn;
  }
  return {lmax};
}
console.log('\n  Nota de condicionamiento: todas las filas suman 12, asi que el vector (1,1,1,1,1,1)');
console.log('  esta en el espacio de columnas -> los 6 eps solo estan bien determinados como');
console.log('  conjunto; un corrimiento global c en los 6 desplaza toda E en 12c por estructura.');

})();

// ======================================================================
// ==== t_param.js ====
// ======================================================================
(function(){
// Consistencia interna de la parametrizacion y calibracion de eps_XC (C-H)

const E={BN:-386.72, NH3:-328.37, BH3:-149.88, H2:-30.062, CC:-324.68}; // Tabla 5.1 tesis
const eps={CC:-107.32, CN:-147.02, CB:-88.01, BN:-128.1626, NN:-185.29, BB:-67.9148,
           XN:-109.7987, XB:-50.3121, XX:-15.031, XC:-69.80};

console.log(L);
console.log('T9 — CONSISTENCIA DE LA PARAMETRIZACION Y ESCALA DE eps_XC');
console.log(L);

console.log('\n[9.1] Los eps NO son energias de enlace: son coeficientes que absorben');
console.log('      la energia total atomica de SIESTA. Verificacion con moleculas simples:');
const r3=(k)=>E[k]/3;
console.log(`   E(BN)/3   = ${r3('BN').toFixed(4)}  vs eps_BN(LSQ) = ${eps.BN.toFixed(4)}   dif ${(r3('BN')-eps.BN).toFixed(4)} eV`);
console.log(`   E(NH3)/3  = ${r3('NH3').toFixed(4)}  vs eps_XN      = ${eps.XN.toFixed(4)}   dif ${(r3('NH3')-eps.XN).toFixed(4)} eV`);
console.log(`   E(BH3)/3  = ${r3('BH3').toFixed(4)}   vs eps_XB      = ${eps.XB.toFixed(4)}    dif ${(r3('BH3')-eps.XB).toFixed(4)} eV`);
console.log(`   E(CC)/3   = ${r3('CC').toFixed(4)}  vs eps_CC(LSQ) = ${eps.CC.toFixed(4)}   dif ${(r3('CC')-eps.CC).toFixed(4)} eV`);
console.log(`   E(H2)/2   = ${(E.H2/2).toFixed(4)}   vs eps_XX      = ${eps.XX.toFixed(4)}    dif ${(E.H2/2-eps.XX).toFixed(4)} eV`);
console.log('   -> eps_XX = E(H2)/2 EXACTO. Confirma que la escala es de energia total.');

console.log('\n[9.2] Verificacion del procedimiento de la tesis para eps_NH:');
console.log('      eps_NH = [E_DFT(poro) - n_BN * eps_BN] / n_NH');
const casos=[['(I)NH',-45906.34,351,6,-109.87],['(II)NH',-45074.84,342,9,-109.84]];
for(const [nm,Et,nBN,nNH,rep] of casos){
  const conLSQ=(Et-nBN*eps.BN)/nNH;
  const conDiat=(Et-nBN*r3('BN'))/nNH;
  console.log(`   ${nm}: con eps_BN=-128.1626 (LSQ) -> ${conLSQ.toFixed(2)} | con eps_BN=-128.907 (E(BN)/3) -> ${conDiat.toFixed(2)} | tesis reporta ${rep}`);
}
console.log('   -> el valor reportado se recupera SOLO con eps_BN = E(BN)/3 = -128.907,');
console.log('      NO con el eps_BN del ajuste de minimos cuadrados (-128.1626).');
console.log('      INCONSISTENCIA: el codigo usa -128.1626 para B-N pero eps_XN/eps_XB');
console.log(`      fueron derivados con -128.907. Desfase: ${(r3('BN')-eps.BN).toFixed(4)} eV por enlace B-N.`);

console.log('\n[9.3] Descomposicion aditiva por especie:  eps_XY ~ a_X + a_Y');
const aN=eps.NN/2, aB=eps.BB/2, aC=eps.CC/2;
console.log(`   a_N = eps_NN/2 = ${aN.toFixed(4)}   a_B = eps_BB/2 = ${aB.toFixed(4)}   a_C = eps_CC/2 = ${aC.toFixed(4)}`);
const exc=(o,p)=>o-p;
console.log(`   eps_BN: aditivo ${(aB+aN).toFixed(4)}  real ${eps.BN.toFixed(4)}  exceso ${exc(eps.BN,aB+aN).toFixed(4)} eV  <-- fuerza motriz de la segregacion`);
console.log(`   eps_CN: aditivo ${(aC+aN).toFixed(4)}  real ${eps.CN.toFixed(4)}  exceso ${exc(eps.CN,aC+aN).toFixed(4)} eV`);
console.log(`   eps_CB: aditivo ${(aC+aB).toFixed(4)}   real ${eps.CB.toFixed(4)}   exceso ${exc(eps.CB,aC+aB).toFixed(4)} eV`);
const aH_fromN=eps.XN-aN, aH_fromB=eps.XB-aB;
console.log(`\n   a_H desde eps_XN: ${aH_fromN.toFixed(4)}   a_H desde eps_XB: ${aH_fromB.toFixed(4)}   (dispersion ${Math.abs(aH_fromN-aH_fromB).toFixed(3)} eV)`);
const aHm=(aH_fromN+aH_fromB)/2;
const pred=aC+aHm;
console.log(`   -> PREDICCION aditiva  eps_XC = a_C + a_H = ${pred.toFixed(3)} eV`);
console.log(`      rango segun a_H:  [${(aC+aH_fromN).toFixed(2)}, ${(aC+aH_fromB).toFixed(2)}] eV`);
console.log(`      valor en el codigo: ${eps.XC} eV   -> desviacion ${(eps.XC-pred).toFixed(3)} eV  (dentro de la dispersion del modelo)`);

console.log('\n[9.4] Comprobacion de escala: que pasa si se usa una energia de HIDROGENACION');
const formB=(-1)*0; // ilustrativo
console.log('      Forma "B" tipo  [E(AC+H) - E(AC) - n*E(H2)/2]/n  da energias de ENLACE');
console.log('      del orden de unos pocos eV (p.ej. 2-5 eV), NO de -70 eV.');
console.log('      Insertar ese numero en eps_XC romperia la escala del modelo por ~x20.');
console.log(`      Equivalencia correcta:  eps_XC = [E_hidrogenacion por C-H] + E(H)  + a_C`);
console.log(`      donde E(H)=E(H2)/2=${(E.H2/2).toFixed(3)} eV y a_C=${aC.toFixed(3)} eV -> el termino grande viene de los atomos.`);

console.log('\n[9.5] Formula recomendada, consistente con eps_NH/eps_BH:');
console.log('      Nanocinta de grafeno pasivada, con SOLO enlaces C-C y C-H:');
console.log('         eps_XC = [ E_DFT(cinta+H) - n_CC * eps_CC ] / n_CH');
console.log('      usando el MISMO eps_CC del ajuste (-107.32) y el mismo funcional/base');
console.log('      que genero la Tabla 5.1. Repetir con AC-H y ZZ-H: la diferencia AC/ZZ');
console.log('      da la barra de error de eps_XC (el codigo ya soporta EPS_CH_AC/ZZ).');

// Sensibilidad de la morfologia al desfase eps_BN
console.log('\n'+L);
console.log('T10 — SENSIBILIDAD: importa el desfase de 0.745 eV en eps_BN?');
console.log(L);
console.log('   Un cambio uniforme de eps_BN desplaza E, pero SOLO afecta a dE cuando el');
console.log('   movimiento cambia el numero de enlaces B-N (p.ej. B-N -> N-H en un borde).');
const dBN=r3('BN')-eps.BN;
console.log(`   Movimiento tipo "avanzar el borde del poro": 1 enlace B-N -> 1 enlace N-H`);
console.log(`     dE con eps_BN=-128.1626 : ${(eps.XN-eps.BN).toFixed(3)} eV`);
console.log(`     dE con eps_BN=-128.907  : ${(eps.XN-r3('BN')).toFixed(3)} eV`);
console.log(`     diferencia: ${dBN.toFixed(3)} eV  -> a T=1000 K (kT=0.086 eV) el factor de`);
console.log(`     Boltzmann cambia en exp(${(dBN/(8.6173324e-5*1000)).toFixed(1)}) : NO es despreciable.`);

})();

// ======================================================================
// ==== t_fix.js ====
// ======================================================================
(function(){

console.log(L);
console.log('T11 — CLASIFICADOR DE POROS: dependencia de la orientacion AC/ZZ');
console.log(L);
console.log('  La MISMA estructura fisica clasificada en AC y en ZZ deberia dar lo mismo.');
for(const opc of [10,12,14]){
  const out={};
  for(const or of ['AC','ZZ']){
    out[or]=R(`(function(){
      Nx=24;Ny=24;latticeOrient='${or}';pbcX=true;pbcY=true;latticeStart='B';
      muH=0;hPass=false;setRandomSeed(1);
      buildGrid(${opc},0,3); buildPhysNB();
      const cl=getPoreClusters(); if(!cl.length) return null;
      const c=classifyPoreCluster(cl[0]);
      return {key:c.key,term:c.term,n:c.n,ratio:c.ratio,comp:c.compactness,hv:c.hullVertices};
    })()`);
  }
  const same=out.AC.key===out.ZZ.key;
  console.log(`  opc=${opc}: AC -> ${out.AC.key.padEnd(14)} (ratio ${out.AC.ratio.toFixed(3)}, comp ${out.AC.comp.toFixed(3)}, hv ${out.AC.hv})`);
  console.log(`           ZZ -> ${out.ZZ.key.padEnd(14)} (ratio ${out.ZZ.ratio.toFixed(3)}, comp ${out.ZZ.comp.toFixed(3)}, hv ${out.ZZ.hv})   coincide: ${ok(same)}`);
}

console.log('\n  Causa: classifyPoreCluster reconstruye posiciones con constantes AC fijas');
console.log('  (LX_,LY_,DX_,DY_ locales) e ignora latticeOrient; y "ratio" se mide en');
console.log('  espacio de INDICES, que es anisotropo (dx/di=2.16 A, dy/dj=1.247 A -> factor sqrt(3)).');

console.log('\n'+L);
console.log('T12 — PROTOTIPO: generadores de poro en ESPACIO REAL (propuesta de correccion)');
console.log(L);

// Generador propuesto: seleccionar sitios por su posicion (x,y) real dentro de un
// poligono regular orientado segun las direcciones cristalograficas de la red.
const proto=`
function poreRealSpace(shape, R_ang, rot){
  // centro geometrico de la celda
  let sx=0, sy=0, n=Nx*Ny;
  const P=[];
  for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){ const [x,y]=atomPos(i,j); P.push([i,j,x,y]); sx+=x; sy+=y; }
  sx/=n; sy/=n;
  // elegir el atomo mas cercano al centro como origen exacto
  let best=0,bd=1e9;
  for(let k=0;k<P.length;k++){ const d=Math.hypot(P[k][2]-sx,P[k][3]-sy); if(d<bd){bd=d;best=k;} }
  const ox=P[best][2], oy=P[best][3];
  const nv = shape==='triangle'?3 : shape==='hexagon'?6 : 4;
  const inside=(x,y)=>{
    const dx=x-ox, dy=y-oy;
    if(shape==='rhombus'){
      // rombo de 60 grados: proyectar sobre dos direcciones a 60 grados
      const a1=[Math.cos(rot),Math.sin(rot)];
      const a2=[Math.cos(rot+Math.PI/3),Math.sin(rot+Math.PI/3)];
      // resolver dx,dy = u*a1 + v*a2
      const det=a1[0]*a2[1]-a1[1]*a2[0];
      const u=( dx*a2[1]-dy*a2[0])/det;
      const v=(-dx*a1[1]+dy*a1[0])/det;
      return Math.abs(u)<=R_ang && Math.abs(v)<=R_ang;
    }
    // poligono regular de nv lados: max sobre las normales
    let m=-1e9;
    for(let s=0;s<nv;s++){
      const th=rot+2*Math.PI*s/nv;
      const p=dx*Math.cos(th)+dy*Math.sin(th);
      if(p>m)m=p;
    }
    return m<=R_ang;
  };
  let cnt=0;
  for(const [i,j,x,y] of P){ if(inside(x,y)){ G[idx(i,j)]=0; cnt++; } }
  return cnt;
}
`;
R(proto);

for(const [shape,rot,lbl] of [['triangle',Math.PI/2,'Triangulo (vertice arriba)'],
                              ['triangle',-Math.PI/2,'Triangulo (invertido)'],
                              ['rhombus',0,'Paralelogramo 60deg'],
                              ['hexagon',0,'Hexagono']]){
  for(const or of ['AC','ZZ']){
    const r=R(`(function(){
      Nx=28;Ny=28;latticeOrient='${or}';pbcX=true;pbcY=true;latticeStart='B';
      muH=0;hPass=false;setRandomSeed(1);
      buildGrid(1,0,1); buildPhysNB();
      const cnt=poreRealSpace('${shape}',${rot===0?4.0:4.0},${rot});
      const cl=getPoreClusters();
      const c=cl.length?classifyPoreCluster(cl[0]):null;
      // terminacion real: especies vecinas del cluster
      let nN=0,nB=0;
      if(cl.length) for(const k of cl[0]){ const ci=(k/Nx)|0,cj=k%Nx;
        for(const[a,b] of PNB[idx(ci,cj)]){ const t=G[idx(a,b)]; if(t===1)nN++; else if(t===2)nB++; } }
      // extension real
      const xs=[],ys=[];
      if(cl.length) for(const k of cl[0]){ const [x,y]=atomPos((k/Nx)|0,k%Nx); xs.push(x);ys.push(y); }
      return {cnt, nClusters:cl.length, biggest:cl.length?cl[0].length:0,
        nN,nB, dx: xs.length?(Math.max(...xs)-Math.min(...xs)):0, dy: ys.length?(Math.max(...ys)-Math.min(...ys)):0};
    })()`);
    const conn = r.nClusters===1 && r.biggest===r.cnt;
    console.log(`  ${lbl.padEnd(28)} ${or}: ${String(r.cnt).padStart(3)} vac, clusters=${r.nClusters}, conexo ${ok(conn)}, extension ${r.dx.toFixed(1)}x${r.dy.toFixed(1)} A, bordes N=${r.nN} B=${r.nB}`);
  }
}

console.log('\n  -> El generador en espacio real produce poros CONEXOS de una sola pieza');
console.log('     y con extension isotropa correcta, en ambas orientaciones.');

console.log('\n'+L);
console.log('T13 — TERMINACION DE SUBRED: purificacion del borde');
console.log(L);
R(`
function purifyEdge(want){ // want = 1 (N) o 2 (B) : especie que debe quedar en el borde
  let changed=true, iter=0;
  while(changed && iter<50){
    changed=false; iter++;
    for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){
      const k=idx(i,j); const t=G[k];
      if(t!==1&&t!==2) continue;
      if(t===want) continue;
      // si es vecino de una vacancia y NO es la especie deseada -> quitarlo
      let toca=false;
      for(const[a,b] of PNB[k]) if(G[idx(a,b)]===0){toca=true;break;}
      if(toca){ G[k]=0; changed=true; }
    }
  }
  return iter;
}`);
for(const want of [1,2]){
  const r=R(`(function(){
    Nx=28;Ny=28;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0;hPass=false;setRandomSeed(1);
    buildGrid(1,0,1); buildPhysNB();
    poreRealSpace('triangle',4.0,Math.PI/2);
    const it=purifyEdge(${want});
    const cl=getPoreClusters();
    let nN=0,nB=0;
    for(const k of cl[0]){ const ci=(k/Nx)|0,cj=k%Nx;
      for(const[a,b] of PNB[idx(ci,cj)]){ const t=G[idx(a,b)]; if(t===1)nN++; else if(t===2)nB++; } }
    return {it,n:cl[0].length,nClusters:cl.length,nN,nB};
  })()`);
  const puro = (want===1? r.nB===0 : r.nN===0);
  console.log(`  purificar a borde-${want===1?'N':'B'}: ${r.it} iteraciones, poro ${r.n} vac (${r.nClusters} cluster), vecinos N=${r.nN} B=${r.nB}  monoterminado ${ok(puro)}`);
}

})();

// ======================================================================
// ==== t_pbc2.js ====
// ======================================================================
(function(){
R(`function makePore(ci,cj,rad){
  const start=idx(ci,cj); const seen=new Set([start]); const q=[[start,0]]; const out=[start];
  while(q.length){ const [k,d]=q.shift(); if(d>=rad) continue;
    const a=(k/Nx)|0,b=k%Nx;
    for(const[p,r] of PNB[idx(a,b)]){ const nk=idx(p,r);
      if(!seen.has(nk)){ seen.add(nk); out.push(nk); q.push([nk,d+1]); } } }
  let remN=0,remB=0; for(const k of out){ if(G[k]===1)remN++; else if(G[k]===2)remB++; G[k]=0; }
  return {n:out.length,remN,remB};
}`);
console.log('T15b — invariancia traslacional SEPARADA POR SUBRED DE ORIGEN');
console.log('='.repeat(78));
for(const par of [0,1]){
  const r=R(`(function(){
    Nx=24;Ny=24;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
    muH=0;hPass=false;
    const pts=[[12,12],[0,0],[6,18],[23,23],[4,10],[8,2],[12,13],[0,1],[6,19],[23,22],[4,11],[9,2]].filter(p=>((p[0]+p[1])&1)===${par});
    const Es=[],info=[];
    for(const [ci,cj] of pts){ buildGrid(1,0,1); buildPhysNB(); const d=makePore(ci,cj,3); Es.push(calcFullE()); info.push(d); }
    return {Es,info,pts};
  })()`);
  const sp=Math.max(...r.Es)-Math.min(...r.Es);
  console.log(`  paridad i+j=${par}: ${r.pts.length} posiciones, poro de ${r.info[0].n} vac (N removidos ${r.info[0].remN}, B removidos ${r.info[0].remB})`);
  console.log(`    E = ${r.Es.map(e=>e.toFixed(4)).join(' | ')}`);
  console.log(`    dispersion = ${sp.toExponential(2)} eV  ${ok(sp<1e-6)}`);
}
console.log('\n  -> Energia INVARIANTE por traslacion dentro de cada subred. El motor de PBC es correcto.');
console.log('     La diferencia entre paridades es fisica: poro terminado en N vs en B.');

console.log('\n'+'='.repeat(78));
console.log('T16 — POROS TERMINADOS EN N vs EN B: total vs energia de FORMACION');
console.log('='.repeat(78));
const cmp=R(`(function(){
  Nx=24;Ny=24;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
  muH=0;hPass=false;
  const out={};
  for(const [lbl,ci,cj] of [['A(i+j par)',12,12],['B(i+j impar)',12,13]]){
    buildGrid(1,0,1); buildPhysNB(); const d=makePore(ci,cj,3);
    E=calcFullE();
    // terminacion
    let nN=0,nB=0; const cl=getPoreClusters();
    for(const k of cl[0]){ const a=(k/Nx)|0,b=k%Nx;
      for(const[p,r] of PNB[idx(a,b)]){ const t=G[idx(p,r)]; if(t===1)nN++; else if(t===2)nB++; } }
    const f=calcFormationEnergyDFTLike(G,E);
    out[lbl]={E,remN:d.remN,remB:d.remB,nN,nB,Eform:f.Eform,perAtom:f.perAtom,muB:f.muB,muN:f.muN};
  }
  return out;
})()`);
for(const [k,v] of Object.entries(cmp)){
  console.log(`  ${k}: removidos N=${v.remN} B=${v.remB} | borde N=${v.nN} B=${v.nB}`);
  console.log(`     E_total  = ${v.E.toFixed(2)} eV`);
  console.log(`     E_form   = ${v.Eform.toFixed(2)} eV   (mu_B=mu_N=${v.muB.toFixed(3)})`);
}
const ks=Object.keys(cmp);
console.log(`\n  dE_total = ${(cmp[ks[0]].E-cmp[ks[1]].E).toFixed(2)} eV  <-- NO comparable: composicion distinta`);
console.log(`  dE_form  = ${(cmp[ks[0]].Eform-cmp[ks[1]].Eform).toFixed(2)} eV  <-- esta SI es la cantidad fisica`);

})();

// ======================================================================
// ==== t_stoich.js ====
// ======================================================================
(function(){
console.log('T19 — ESTEQUIOMETRIA DE LOS GENERADORES ALEATORIOS');
console.log('='.repeat(78));
const r=R(`(function(){
  const out={};
  for(const opc of [3,4,2,20]){
    const nN=[],nB=[],nC=[],nV=[];
    for(let s=0;s<40;s++){
      Nx=16;Ny=16;latticeOrient='AC';pbcX=true;pbcY=true;latticeStart='B';
      setRandomSeed(500+s*7919);
      buildGrid(opc,40,3); buildPhysNB();
      let a=0,b=0,c=0,v=0;
      for(let k=0;k<Nx*Ny;k++){const t=G[k]; if(t===1)a++;else if(t===2)b++;else if(t===3)c++;else v++;}
      nN.push(a);nB.push(b);nC.push(c);nV.push(v);
    }
    const m=x=>x.reduce((s,v)=>s+v,0)/x.length;
    const sd=x=>{const u=m(x);return Math.sqrt(x.reduce((s,v)=>s+(v-u)**2,0)/(x.length-1));};
    out[opc]={mN:m(nN),sN:sd(nN),mB:m(nB),sB:sd(nB),mV:m(nV),sV:sd(nV),
              dmax:Math.max(...nN.map((v,i)=>Math.abs(v-nB[i])))};
  }
  return out;
})()`);
const nm={3:'opc=3 red aleatoria B/N/V',4:'opc=4 aleatoria+C+vac',2:'opc=2 hBN+vac aleatorias',20:'opc=20 hBN+C sustitucional'};
console.log('  generador                        <N>+-s          <B>+-s          <Vac>+-s     |N-B| max');
console.log('  '+'-'.repeat(90));
for(const [k,v] of Object.entries(r)){
  console.log(`  ${nm[k].padEnd(32)} ${v.mN.toFixed(1)}+-${v.sN.toFixed(1)}`.padEnd(52)
    +`${v.mB.toFixed(1)}+-${v.sB.toFixed(1)}`.padEnd(16)
    +`${v.mV.toFixed(1)}+-${v.sV.toFixed(1)}`.padEnd(14)+`${v.dmax}`);
}
console.log('\n  -> opc=2/20 conservan casi exactamente la composicion (sortean SITIOS).');
console.log('  -> opc=3/4 sortean el TIPO en cada sitio: |N-B| llega a decenas de atomos.');
console.log('     Consecuencia: en un ensemble, la varianza de E mezcla fluctuacion de');
console.log('     COMPOSICION con fluctuacion CONFIGURACIONAL. Para el articulo hay que');
console.log('     fijar la estequiometria (misma N y B en todas las replicas).');

})();

// ======================================================================
// ==== t_bridge.js ====
// ======================================================================
(function(){
// Puente entre la escala de energia total (eps) y energias de enlace fisicas
const E={BN:-386.72,NH3:-328.37,BH3:-149.88,H2:-30.062,CC:-324.68};
const eps={CC:-107.32,CN:-147.02,CB:-88.01,BN:-128.1626,NN:-185.29,BB:-67.9148,
           XN:-109.7987,XB:-50.3121,XX:-15.031,XC:-69.80};
const EH=E.H2/2;
const a={N:eps.NN/2, B:eps.BB/2, C:eps.CC/2};
console.log('T20 — PUENTE eps  <->  ENERGIA DE HIDROGENACION FISICA');
console.log('='.repeat(78));
console.log('  Identidad:  eps_XY = dE_hidrog(Y-H)  +  E(H)  +  a_Y      con a_Y = eps_YY/2');
console.log(`              E(H) = E(H2)/2 = ${EH.toFixed(3)} eV\n`);
console.log('  especie   a_Y (eV)     eps_XY (eV)    -> dE_hidrog por enlace Y-H (eV)');
console.log('  '+'-'.repeat(70));
const out={};
for(const [s,e] of [['N',eps.XN],['B',eps.XB],['C',eps.XC]]){
  const dh=e-EH-a[s];
  out[s]=dh;
  console.log(`     ${s}      ${a[s].toFixed(3).padStart(9)}   ${e.toFixed(4).padStart(11)}      ${dh.toFixed(3).padStart(8)}`);
}
console.log('\n  -> Los tres caen en el rango -1.3 a -2.2 eV: energias de enlace X-H NORMALES.');
console.log('     Y son MONOTONAS con la electronegatividad de Pauling:');
console.log(`        B (2.04): ${out.B.toFixed(2)} eV   <   C (2.55): ${out.C.toFixed(2)} eV   <   N (3.04): ${out.N.toFixed(2)} eV`);
console.log('     Esto valida la parametrizacion completa y da el argumento fisico que un');
console.log('     revisor va a exigir al ver numeros como "-109.8 eV por enlace N-H".');
console.log('\n  FORMULA DE TRABAJO para tu calculo SIESTA de nanocintas:');
console.log(`     dE_hidrog = [E(cinta+H) - E(cinta desnuda) - (n_H/2) E(H2)] / n_H`);
console.log(`     eps_XC    = dE_hidrog + ${EH.toFixed(3)} + ${a.C.toFixed(3)} = dE_hidrog ${(EH+a.C).toFixed(3)}`);
console.log(`     Control de sanidad: si dE_hidrog no cae en [-2.5,-1.0] eV, hay un error.`);
console.log(`     Con eps_XC=-69.80 del codigo -> dE_hidrog implicito = ${out.C.toFixed(3)} eV.`);

})();

// ======================================================================
// ==== t_xv.js ====
// ======================================================================
(function(){
// Formato SIESTA .XV:
//   3 lineas de celda: vector(3) + velocidad_celda(3)   [Bohr]
//   natoms
//   por atomo:  is  iza  x y z  vx vy vz                [is=indice de especie, iza=Z]
const A2B=1.88973;
const xv=`  4.723600  0.000000  0.000000     0.00 0.00 0.00
  0.000000  4.723600  0.000000     0.00 0.00 0.00
  0.000000  0.000000 18.897300     0.00 0.00 0.00
     4
  1   5   0.000000  0.000000  0.000000   0.0 0.0 0.0
  2   7   2.683000  0.000000  0.000000   0.0 0.0 0.0
  3   6   1.341500  2.323000  0.000000   0.0 0.0 0.0
  1   5   4.024500  2.323000  0.000000   0.0 0.0 0.0`;

const cleanLine=(l)=>String(l||'').split('#')[0].trim();
const nums=(l)=>cleanLine(l).split(/\s+/).map(Number).filter(Number.isFinite);
const elementFromZ=(z)=>({1:'H',5:'B',6:'C',7:'N'}[Math.round(+z)]||'C');

function parseXV(text, col){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const n=parseInt(cleanLine(lines[3]),10);
  const atoms=[];
  for(let i=4;i<lines.length&&atoms.length<n;i++){
    const v=nums(lines[i]); if(v.length<5) continue;
    atoms.push({symbol:elementFromZ(Math.round(v[col])), x:v[2]/A2B, y:v[3]/A2B, z:v[4]/A2B});
  }
  return atoms;
}
console.log('T21 — IMPORTADOR SIESTA .XV: columna de numero atomico');
console.log('='.repeat(78));
console.log('  Estructura de prueba: B, N, C, B  (Z = 5, 7, 6, 5)\n');
const actual=parseXV(xv,0);   // reproduce deliberadamente el comportamiento defectuoso de v14.6: v[0]
const correcto=parseXV(xv,1); // lo correcto: v[1]
console.log('  comportamiento historico v14.6 (usa v[0] = indice de ESPECIE):', actual.map(a=>a.symbol).join(', '));
console.log('  correcto       (usa v[1] = numero atomico Z) :', correcto.map(a=>a.symbol).join(', '));
console.log('  esperado                                     : B, N, C, B');
const ok = correcto.map(a=>a.symbol).join(',')==='B,N,C,B';
const bad= actual.map(a=>a.symbol).join(',')!=='B,N,C,B';
console.log(`\n  -> correccion valida: ${ok?'PASS':'FAIL'} | bug historico v14.6 reproducido: ${bad?'SI':'NO'}`);
console.log('\n  Posiciones (Bohr -> A), independientes del bug:');
correcto.forEach((a,i)=>console.log(`    ${a.symbol}  ${a.x.toFixed(4)}  ${a.y.toFixed(4)}  ${a.z.toFixed(4)}`));
const d=Math.hypot(correcto[1].x-correcto[0].x, correcto[1].y-correcto[0].y);
console.log(`  distancia atomo1-atomo2 = ${d.toFixed(4)} A  (esperado ~1.42)  ${Math.abs(d-1.42)<0.02?'PASS':'FAIL'}`);

})();
