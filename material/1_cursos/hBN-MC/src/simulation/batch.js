/** [REGISTRO-DOC-MODULO-BATCH]
 * Módulo: batch.js — Motor de corridas múltiples (ensemble).
 *
 * Responsabilidad: ejecutar réplicas Monte Carlo independientes con semillas
 * reproducibles, recopilar observables por réplica, calcular estadística
 * agregada y exportar un CSV autosuficiente para análisis/reproducción.
 *
 * Este bloque es documentación para registro. No modifica código ejecutable.
 */
// batch.js — [NUEVO v14.0] Motor de corridas múltiples (ensemble) para publicación.
// Ejecuta N réplicas independientes con semillas reproducibles, recopila
// observables por réplica y calcula estadística agregada (media ± σ, IC 95%),
// histograma de geometrías finales y exportación CSV lista para figuras.
//
// Diseño: no toca loop()/done() del modo interactivo. Corre el MC en modo
// "headless" (sin animación) en trozos asíncronos para no congelar la UI.
'use strict';

let batchActive=false, batchAbort=false;
let BATCH_RESULTS=[];      // resultados por réplica
let BATCH_META=null;       // parámetros comunes del lote
const BATCH_CURVE_POINTS=40; // puntos de la curva E(paso) guardados por réplica

/** [REGISTRO-DOC-BATCH:batchTempAtStep]
 * Calcula la temperatura correspondiente a un paso de una réplica, reproduciendo el esquema térmico del bucle interactivo.
 *
 * @param {number} s - Paso actual de la réplica.
 * @param {number} totalSteps - Número total de pasos Monte Carlo.
 * @returns {number} Temperatura en kelvin para el paso indicado.
 */
function batchTempAtStep(s,totalSteps){
  // Misma función que usa loop() en render.js.
  return temperatureAtStep(s,totalSteps);
}

/** [REGISTRO-DOC-BATCH:batchClassifyAllPores]
 * Clasifica todos los clústeres de poro de la configuración actual y resume la forma del poro de mayor tamaño.
 *
 * @returns {{shapes:Object, largest:(Object|null), nPores:number}} Conteos por forma, poro mayor y número total de poros.
 */
function batchClassifyAllPores(){
  const clusters=getPoreClusters();
  const shapes={triangle:0,parallelogram:0,hexagon:0,irregular:0};
  let largest=null;
  for(const c of clusters){
    const cls=classifyPoreCluster(c);
    if(!cls) continue;
    shapes[cls.key]=(shapes[cls.key]||0)+1;
    if(!largest||c.length>largest.n) largest={...cls,n:c.length};
  }
  return {shapes,largest,nPores:clusters.length};
}

/** [REGISTRO-DOC-BATCH:batchCollectReplicaResult]
 * Recopila los observables finales de una réplica y construye el registro persistente del ensemble.
 *
 * @param {number} runIdx - Índice 1-based de la réplica.
 * @param {number} seed - Semilla usada por la réplica.
 * @returns {Object} Energía, formación, aceptación, enlaces, morfología y curvas reducidas.
 */
function batchCollectReplicaResult(runIdx,seed){
  const bc=countBonds();
  const formv=(typeof calcFormationEnergyDFTLike==='function')?calcFormationEnergyDFTLike():null;
  const pores=batchClassifyAllPores();
  const attempts=accepted+rejected||1;
  return {
    run:runIdx, seed,
    E_final:E,
    Eform:formv?formv.Eform:null,
    Eform_perH:formv?formv.perH:null,
    nH:formv?formv.nH:null,
    accept_pct:accepted/attempts*100,
    cNB:bc.cNB, cNN:bc.cNN, cBB:bc.cBB,
    cCC:bc.cCC, cCN:bc.cCN, cCB:bc.cCB,
    cXN:bc.cXN, cXB:bc.cXB, cXC:bc.cXC,
    poreShape:pores.largest?pores.largest.key:'',
    poreTerm:pores.largest?pores.largest.term:'',
    poreSize:pores.largest?pores.largest.n:0,
    poreEdgeN:pores.largest?pores.largest.nBorderN:0,
    poreEdgeB:pores.largest?pores.largest.nBorderB:0,
    poreCompactness:pores.largest?pores.largest.compactness:null,
    nPores:pores.nPores,
    shapesAll:pores.shapes,
    curveE:BATCH_LAST_CURVE.slice(),
    curveT:BATCH_LAST_CURVE_T.slice()
  };
}

let BATCH_LAST_CURVE=[], BATCH_LAST_CURVE_T=[];

/** [REGISTRO-DOC-BATCH:batchRunOneReplica]
 * Ejecuta una réplica Monte Carlo completa en modo headless y asíncrono, con semilla reproducible y progreso opcional.
 *
 * @param {number} runIdx - Índice 1-based de la réplica.
 * @param {number} seed - Semilla pseudoaleatoria de la réplica.
 * @param {number} totalSteps - Pasos Monte Carlo a ejecutar.
 * @param {number} globalFrac - Probabilidad de seleccionar un movimiento global.
 * @param {Function} [onProgress] - Callback de progreso normalizado [0,1].
 * @returns {Promise<Object|null>} Resultado de la réplica o null si el lote fue cancelado.
 */
async function batchRunOneReplica(runIdx,seed,totalSteps,globalFrac,onProgress){
  setRandomSeed(seed);
  // init() reconstruye la estructura desde la UI: con semilla fija, las
  // estructuras aleatorias (opc 2,3,4,8,20) también son reproducibles.
  init();
  E=calcFullE(); step=0; accepted=0; rejected=0; T=Ti;
  BATCH_LAST_CURVE=[]; BATCH_LAST_CURVE_T=[];
  const rec=Math.max(1,Math.floor(totalSteps/BATCH_CURVE_POINTS));
  const CHUNK=4000;
  while(step<totalSteps){
    if(batchAbort) return null;
    const end=Math.min(totalSteps,step+CHUNK);
    for(;step<end;step++){
      T=batchTempAtStep(step,totalSteps);
      if(globalFrac>0&&rand()<globalFrac) metro_global(); else metro();
      if(step%rec===0){BATCH_LAST_CURVE.push(E);BATCH_LAST_CURVE_T.push(T);}
    }
    if(onProgress) onProgress(step/totalSteps);
    await new Promise(r=>setTimeout(r,0)); // ceder al hilo de UI
  }
  BATCH_LAST_CURVE.push(E); BATCH_LAST_CURVE_T.push(T);
  return batchCollectReplicaResult(runIdx,seed);
}

// [FIX v14.7 · D11] El IC95 usaba 1.96, el cuantil NORMAL. Para n<30 corresponde
// la t de Student: con n=12 subestimaba el intervalo un 11 %, con n=20 un 6 %.
const T_CRIT_975={1:12.706,2:4.303,3:3.182,4:2.776,5:2.571,6:2.447,7:2.365,
  8:2.306,9:2.262,10:2.228,11:2.201,12:2.179,13:2.160,14:2.145,15:2.131,
  16:2.120,17:2.110,18:2.101,19:2.093,20:2.086,22:2.074,24:2.064,26:2.056,
  28:2.048,30:2.042,40:2.021,50:2.009,60:2.000,120:1.980};
/** [REGISTRO-DOC-BATCH:tCrit975]
 * Devuelve el cuantil t de Student bilateral al 95 % (percentil 0.975) para los grados de libertad indicados, interpolando la tabla cuando es necesario.
 *
 * @param {number} nu - Grados de libertad.
 * @returns {number} Valor crítico t; NaN cuando nu <= 0.
 */
function tCrit975(nu){
  if(nu<=0) return NaN;
  if(T_CRIT_975[nu]!==undefined) return T_CRIT_975[nu];
  const keys=Object.keys(T_CRIT_975).map(Number).sort((a,b)=>a-b);
  if(nu>keys[keys.length-1]) return 1.960;
  for(let i=0;i<keys.length-1;i++){
    if(nu>keys[i]&&nu<keys[i+1]){
      const f=(nu-keys[i])/(keys[i+1]-keys[i]);
      return T_CRIT_975[keys[i]]+f*(T_CRIT_975[keys[i+1]]-T_CRIT_975[keys[i]]);
    }
  }
  return 1.960;
}
/** [REGISTRO-DOC-BATCH:batchStats]
 * Calcula estadística descriptiva para una serie numérica finita: media, desviación estándar muestral, error estándar e IC95 con t de Student.
 *
 * @param {Array<number>} vals - Valores a resumir; se ignoran entradas no finitas.
 * @returns {{n:number,mean:number|null,std:number|null,sem:number|null,ci95:number|null,tcrit:number|null,min:number|null,max:number|null}} Resumen estadístico.
 */
function batchStats(vals){
  const v=vals.filter(x=>Number.isFinite(x));
  const n=v.length;
  if(!n) return {n:0,mean:null,std:null,sem:null,ci95:null,tcrit:null,min:null,max:null};
  const mean=v.reduce((a,b)=>a+b,0)/n;
  const std=n>1?Math.sqrt(v.map(x=>(x-mean)**2).reduce((a,b)=>a+b,0)/(n-1)):0; // σ muestral (n−1)
  const sem=n>1?std/Math.sqrt(n):0;
  const t=n>1?tCrit975(n-1):NaN;
  return {n,mean,std,sem,tcrit:t,ci95:n>1?t*sem:0,min:Math.min(...v),max:Math.max(...v)};
}

// [NUEVO v14.7 · D12] Bloque de parametrización para el CSV. Los datos que
// acompañan a un artículo deben permitir reconstruir la corrida sólo con el CSV.
/** [REGISTRO-DOC-BATCH:batchParameterBlock]
 * Genera el bloque comentado de parametrización física que se incorpora al CSV del ensemble para permitir reproducir la corrida.
 *
 * @returns {Array<string>} Líneas de metadatos con parámetros energéticos, químicos y de solapamiento H-H.
 */
function batchParameterBlock(){
  const w=chemicalWindow(FORM_DMU_H);
  const edge=edgeEnergyPerHydrogen();
  return [
    '#',
    `# --- Parametrización del modelo de enlace (eV/enlace) · conjunto=${MODEL_PARAM_SET} ---`,
    `# eps_NN=${EPS_NN}  eps_NB=${EPS_NB}  eps_BB=${EPS_BB}`,
    `# eps_CC=${EPS_CC}  eps_CN=${EPS_CN}  eps_CB=${EPS_CB}`,
    `# eps_XN=${EPS_XN}  eps_XB=${EPS_XB}  eps_XC=${EPS_XC}  eps_XX=${EPS_XX}`,
    `# eps_CH_AC=${EPS_CH_AC}  eps_CH_ZZ=${EPS_CH_ZZ}  dispersion=${EPS_CH_DISP}`,
    '# --- Reservorio de H del Monte Carlo ---',
    `# reservorio=${H_RESERVOIR}  delta_mu_H_MC=${muH}  desplazamiento_por_H=${edge.shift}  eps_VV_efectivo=${edge.epsVV}  energia_borde_por_H=${edge.perH.toFixed(6)}`,
    '# --- Potenciales químicos para la energía de formación (eV/átomo) ---',
    `# ambiente=${FORM_CHEM_ENV}  referencia_mu_BN=${FORM_MU_BN_REF}  delta_mu_H_form=${FORM_DMU_H}`,
    `# mu_B=${FORM_MU_B}  mu_N=${FORM_MU_N}  mu_C=${FORM_MU_C}  mu_H=${FORM_MU_H}`,
    `# mu_B+mu_N=${(FORM_MU_B+FORM_MU_N).toFixed(6)}  (debe ser mu_BN=${w.muBN.toFixed(6)})  ventana_mu_N=[${w.muNmin.toFixed(4)},${w.muNmax.toFixed(4)}] ${w.open?'abierta':'VACIA'}`,
    '# --- Penalización estérica H-H ---',
    `# K_HH=${H_OVERLAP_K}  dmin_HH=${H_OVERLAP_DMIN}  modo=${H_OVERLAP_MODE}`,
    `# --- Version: ${HBN_APP_NAME} v${HBN_VERSION} ---`
  ];
}

/** [REGISTRO-DOC-BATCH:startBatch]
 * Coordina un lote completo de réplicas: lee parámetros de interfaz, deriva semillas reproducibles, ejecuta cada réplica y publica el resumen final.
 *
 * @returns {Promise<void>} Finaliza cuando todas las réplicas terminan o el usuario cancela el lote.
 */
async function startBatch(){
  if(batchActive){addLog('Ya hay un lote en ejecución','w');return;}
  if(run){addLog('Detén la simulación interactiva antes de lanzar un lote','w');return;}
  const nR=+(document.getElementById('iNruns')?.value||1);
  const seedInput=document.getElementById('iSeed')?.value;
  const baseSeed=(seedInput!==''&&Number.isFinite(+seedInput))?(+seedInput>>>0):((Date.now()%2147483647)>>>0);
  // Leer parámetros de la UI igual que startSim
  if(typeof readLiveRuntimeParams==='function') readLiveRuntimeParams();
  const totalSteps=+document.getElementById('iSt').value;
  const opc=+document.getElementById('iPore').value;
  const globalFrac=usingCustomConstructorGeometry()
    ?((importedMCPolicy==='fixed')?0:(globalSwapPct/100))
    :(isCarbon?0.30:(globalSwapPct/100));

  batchActive=true; batchAbort=false;
  BATCH_RESULTS=[];
  BATCH_META={date:new Date().toISOString(),nRuns:nR,baseSeed,Nx,Ny,opc,Ti,Tf,tMode,
    totalSteps,muH,hRes:H_RESERVOIR,hPass,globalFrac,latticeOrient,latticeStart,
    pbc:(pbcX&&pbcY)?'XY':pbcX?'X':pbcY?'Y':'none',
    EPS_XC,H_OVERLAP_K,H_OVERLAP_DMIN,H_OVERLAP_MODE};

  const bBtn=document.getElementById('bBatch');
  if(bBtn){bBtn.disabled=true;bBtn.textContent='⏳ LOTE EN CURSO…';}
  const bAbort=document.getElementById('bBatchStop');
  if(bAbort) bAbort.style.display='';
  setUI('rn',`Lote: réplica 1/${nR}`,'BATCH','rn');
  addLog(`▶▶ Lote de ${nR} réplicas · semilla base=${baseSeed} · ${totalSteps.toLocaleString()} pasos c/u`,'g');

  try{
    for(let r=0;r<nR;r++){
      const seed=(baseSeed + r*1000003)>>>0; // semillas espaciadas, reproducibles
      setUI('rn',`Lote: réplica ${r+1}/${nR}`,'BATCH','rn');
      const res=await batchRunOneReplica(r+1,seed,totalSteps,globalFrac,(f)=>{
        const pf=document.getElementById('pf'), pct=document.getElementById('pct');
        const g=((r+f)/nR*100);
        if(pf) pf.style.width=g.toFixed(1)+'%';
        if(pct) pct.textContent=g.toFixed(0)+'%';
      });
      if(!res){addLog('Lote cancelado por el usuario','w');break;}
      BATCH_RESULTS.push(res);
      addLog(`  ✓ réplica ${r+1}: E=${res.E_final.toFixed(1)} eV · poro=${res.poreShape||'—'}${res.poreTerm?'-'+res.poreTerm:''} (${res.poreSize} vac) · acc=${res.accept_pct.toFixed(1)}%`,'i');
      ui(); draw();
    }
  }catch(err){
    console.error(err);
    addLog('Error en lote: '+(err&&err.message?err.message:err),'r');
  }
  batchActive=false;
  setRandomSeed(null); // volver a modo no determinista fuera del lote
  if(bBtn){bBtn.disabled=false;bBtn.textContent='▶▶ EJECUTAR LOTE';}
  if(bAbort) bAbort.style.display='none';
  setUI('dn',`Lote completo: ${BATCH_RESULTS.length} réplicas`,'DONE','dn');
  if(BATCH_RESULTS.length) batchShowSummary();
}

/** [REGISTRO-DOC-BATCH:stopBatch]
 * Solicita la cancelación cooperativa del lote activo estableciendo la bandera global batchAbort.
 *
 * @returns {void}
 */
function stopBatch(){ batchAbort=true; }

/** [REGISTRO-DOC-BATCH:batchShowSummary]
 * Calcula y presenta en log/DOM el resumen estadístico del ensemble y el histograma de geometrías finales.
 *
 * @returns {void}
 */
function batchShowSummary(){
  const R=BATCH_RESULTS;
  const sE=batchStats(R.map(x=>x.E_final));
  const sEf=batchStats(R.map(x=>x.Eform_perH));
  const sAcc=batchStats(R.map(x=>x.accept_pct));
  const sNB=batchStats(R.map(x=>x.cNB));
  // Histograma de geometrías del poro mayor
  const hist={};
  for(const x of R){const k=x.poreShape||'sin-poro';hist[k]=(hist[k]||0)+1;}
  const histTxt=Object.entries(hist).sort((a,b)=>b[1]-a[1])
    .map(([k,v])=>`${k}: ${v}/${R.length} (${(v/R.length*100).toFixed(0)}%)`).join(' · ');

  addLog('══ RESUMEN DEL ENSEMBLE ══','g');
  addLog(`⟨E⟩ = ${sE.mean.toFixed(2)} ± ${sE.std.toFixed(2)} eV (σ muestral, n=${sE.n}) · IC95 ±${sE.ci95.toFixed(2)}`,'g');
  if(sEf.n) addLog(`⟨E_form/H⟩ = ${sEf.mean.toFixed(4)} ± ${sEf.std.toFixed(4)} eV por H de borde (ambiente ${FORM_CHEM_ENV})`,'g');
  addLog(`⟨cNB⟩ = ${sNB.mean.toFixed(1)} ± ${sNB.std.toFixed(1)} · ⟨acc⟩ = ${sAcc.mean.toFixed(1)}%`,'i');
  addLog(`Geometrías finales (poro mayor): ${histTxt}`,'g');

  const box=document.getElementById('batchResults');
  if(box){
    box.style.display='';
    box.innerHTML=
      `<div style="font-weight:800;color:#6d28d9;margin-bottom:4px">Lote n=${R.length} · semilla base ${BATCH_META.baseSeed}</div>`+
      `<div>⟨E⟩ = ${sE.mean.toFixed(2)} ± ${sE.std.toFixed(2)} eV</div>`+
      (sEf.n?`<div>⟨E_form/H⟩ = ${sEf.mean.toFixed(4)} ± ${sEf.std.toFixed(4)} eV</div>`:'')+
      `<div>Geometrías: ${histTxt}</div>`+
      `<button class="btn" style="margin-top:6px;width:100%;border-color:#0d9488;color:#0f766e" onclick="exportBatchCSV()">📊 Exportar CSV del lote</button>`;
  }
}

/** [REGISTRO-DOC-BATCH:exportBatchCSV]
 * Serializa resultados, metadatos, parametrización, estadística agregada y curvas reducidas del ensemble en un archivo CSV.
 *
 * @returns {void}
 */
function exportBatchCSV(){
  if(!BATCH_RESULTS.length){addLog('No hay resultados de lote para exportar','w');return;}
  const M=BATCH_META;
  const head=[
    `# ${HBN_APP_NAME} v${HBN_VERSION} — ENSEMBLE de corridas independientes`,
    `# Mg. M.A. Obando · Dpto. Física, Universidad del Cauca & FIMAT-UFOP`,
    `# Fecha: ${M.date}`,
    `# n_runs=${M.nRuns}  semilla_base=${M.baseSeed}  (semilla_i = base + i*1000003)`,
    `# Red=${M.Nx}x${M.Ny}  opc=${M.opc}  orient=${M.latticeOrient}  PBC=${M.pbc}`,
    `# T: ${M.Ti}K → ${M.Tf}K  modo=${M.tMode}  pasos=${M.totalSteps}  global_frac=${M.globalFrac}`,
    `# delta_mu_H=${M.muH}  reservorio=${M.hRes}  hPass=${M.hPass?1:0}  eps_XC=${M.EPS_XC}  K_HH=${M.H_OVERLAP_K}  dmin_HH=${M.H_OVERLAP_DMIN}  modo_HH=${M.H_OVERLAP_MODE}`
  ];
  const colHead=[
    '#',
    '# --- Una fila por réplica ---',
    'run,seed,E_final_eV,Eform_eV,Eform_por_H_eV,n_H,accept_pct,cNB,cNN,cBB,cCC,cCN,cCB,cXN,cXB,cXC,poro_forma,poro_term,poro_nvac,poro_borde_N,poro_borde_B,poro_compacidad,n_poros'
  ];
  const f=(v,d)=>(v!==null&&v!==undefined&&Number.isFinite(v))?v.toFixed(d):'';
  const rows=BATCH_RESULTS.map(x=>[
    x.run,x.seed,x.E_final.toFixed(6),
    f(x.Eform,6),f(x.Eform_perH,6),x.nH??'',
    x.accept_pct.toFixed(3),
    x.cNB,x.cNN,x.cBB,x.cCC,x.cCN,x.cCB,x.cXN,x.cXB,x.cXC,
    x.poreShape,x.poreTerm,x.poreSize,x.poreEdgeN??'',x.poreEdgeB??'',
    f(x.poreCompactness,4),
    x.nPores
  ].join(','));

  const sE=batchStats(BATCH_RESULTS.map(x=>x.E_final));
  const sEf=batchStats(BATCH_RESULTS.map(x=>x.Eform_perH));
  const summary=[
    '#',
    '# --- Estadística agregada (σ muestral n−1, IC95 = t_{0.975,n−1}·σ/√n) ---',
    `# E_final: media=${sE.mean.toFixed(6)}  sigma=${sE.std.toFixed(6)}  IC95=${sE.ci95.toFixed(6)}  min=${sE.min.toFixed(4)}  max=${sE.max.toFixed(4)}`,
    sEf.n?`# Eform_por_H: media=${sEf.mean.toFixed(6)}  sigma=${sEf.std.toFixed(6)}  IC95=${sEf.ci95.toFixed(6)}`:'# Eform_por_H: n/d',
    '#',
    '# --- Curvas E(paso) por réplica (downsampled) ---',
    'run,punto,paso_aprox,T_K,E_eV'
  ];
  const curves=[];
  for(const x of BATCH_RESULTS){
    const np=x.curveE.length;
    for(let i=0;i<np;i++){
      curves.push([x.run,i,Math.round(i*M.totalSteps/Math.max(1,np-1)),
        x.curveT[i]!==undefined?x.curveT[i].toFixed(1):'',x.curveE[i].toFixed(6)].join(','));
    }
  }
  const csv=[...head,...batchParameterBlock(),...colHead,...rows,...summary,...curves].join('\n');
  const name=`hBN_ensemble_${M.nRuns}runs_seed${M.baseSeed}_${Date.now()}.csv`;
  if(typeof saveFile==='function') saveFile(name,csv,'text/csv');
  addLog(`CSV del lote exportado: ${name}`,'g');
}
