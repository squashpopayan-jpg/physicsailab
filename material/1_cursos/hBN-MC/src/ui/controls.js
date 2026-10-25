/**
 * @registro Fase 5 · Módulo de controles e interacción
 * Coordina la interfaz de usuario con el núcleo físico, el renderizado y la ejecución
 * Monte Carlo. Esta pasada añade documentación sin modificar código ejecutable.
 */
// controls.js — interacción, sliders, tabs, resize y arranque
'use strict';
// ── Helpers UI ────────────────────────────────────────────────────────
/**
 * @registro Fase 5 · controls.js · setUI
 * Actualiza el indicador de estado principal, su texto traducible y la píldora visual de ejecución.
 * @param {*} dc clase visual del indicador.
 * @param {*} txt texto de respaldo.
 * @param {*} pt texto de la píldora.
 * @param {*} pc clase de la píldora.
 * @returns {void}
 */
function setUI(dc,txt,pt,pc){
  document.getElementById('dot').className='dot '+(dc||'');
  // i18n: guardar estado para traducción
  const cstEl=document.getElementById('cst');
  const stMap={'dn':'done','rn':'run','ps':'pause',''  :'idle'};
  // La pausa reutiliza el estilo 'dn' del indicador, pero su texto es "Pausado".
  const stKey=(pt==='PAUSE')?'pause':(stMap[dc]||'idle');
  if(cstEl){
    cstEl.setAttribute('data-status',stKey);
    // Si hay traducción, usar; si no, usar txt literal
    const translated=t('status_'+stKey);
    cstEl.textContent=(translated && translated!=='status_'+stKey)?translated:(txt||'');
  }
  const p=document.getElementById('pill');
  if(p){p.textContent=pt||'IDLE';p.className='pill '+(pc||'');}
}
/**
 * @registro Fase 5 · controls.js · setBtn
 * Habilita o deshabilita los botones principales de ejecución y pausa según el estado de la simulación.
 * @param {*} sr verdadero cuando la simulación está en ejecución.
 * @returns {void}
 */
function setBtn(sr){
  document.getElementById('bRun').disabled=sr;
  document.getElementById('bPause').disabled=!sr;
}
/**
 * @registro Fase 5 · controls.js · addLog
 * Añade una entrada al registro visible de la interfaz, respetando el modo de supresión de logs en actualizaciones en vivo.
 * @param {*} msg mensaje a registrar.
 * @param {*} cls clase visual opcional.
 * @returns {void}
 */
function addLog(msg,cls=''){
  if(window.__suppressLiveLog) return;
  const lg=document.getElementById('log');
  if(!lg) return;
  const d=document.createElement('div');d.className='le '+(cls||'');d.textContent=msg;
  lg.appendChild(d);lg.scrollTop=lg.scrollHeight;
  if(lg.children.length>80) lg.removeChild(lg.firstChild);
}


// ── Panel compacto: tarjetas plegables para evitar desbordes verticales ──
/**
 * @registro Fase 5 · controls.js · setupCompactCards
 * Inicializa las tarjetas plegables del panel de controles y sus botones de expansión/colapso.
 * @returns {void}
 */
function setupCompactCards(){
  const cards=Array.from(document.querySelectorAll('#t-ctrl .pcard'));
  cards.forEach((card,n)=>{
    const head=card.querySelector('.pcard-head');
    if(!head||head.dataset.compactReady) return;
    head.dataset.compactReady='1';
    const btn=document.createElement('button');
    btn.type='button'; btn.className='pcard-toggle'; btn.textContent=n<2?'−':'+';
    btn.title='Mostrar/ocultar sección';
    head.appendChild(btn);
    const toggle=(ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      card.classList.toggle('compact-collapsed');
      btn.textContent=card.classList.contains('compact-collapsed')?'+':'−';
    };
    head.addEventListener('click',toggle);
    btn.addEventListener('click',toggle);
    if(n>1){card.classList.add('compact-collapsed'); btn.textContent='+';}
  });
}
/**
 * @registro Fase 5 · controls.js · expandAllCards
 * Expande o colapsa en conjunto las tarjetas compactas del panel de controles.
 * @param {*} collapse si es verdadero, colapsa todas las tarjetas.
 * @returns {void}
 */
function expandAllCards(collapse=false){
  const cards=Array.from(document.querySelectorAll('#t-ctrl .pcard'));
  cards.forEach(card=>{
    card.classList.toggle('compact-collapsed',!!collapse);
    const btn=card.querySelector('.pcard-toggle');
    if(btn) btn.textContent=collapse?'+':'−';
  });
}

// ── Modo edición manual ───────────────────────────────────────────────
let editMode=false;
let editTarget={k:-1,i:0,j:0};

/**
 * @registro Fase 5 · controls.js · toggleEditMode
 * Activa o desactiva el modo de edición manual de especies atómicas sobre la red mostrada.
 * @returns {void}
 */
function toggleEditMode(){
  if(run){addLog('Detén la simulación antes de editar','r');return;}
  editMode=!editMode;
  const btn=document.getElementById('bEdit');
  const hint=document.getElementById('editHint');
  if(btn){btn.textContent=editMode?t('btn_edit_exit'):t('btn_edit');
    btn.style.borderColor=editMode?'#f59e0b':'';
    btn.style.color=editMode?'#b45309':'';}
  if(hint) hint.style.display=editMode?'':'none';
  if(!editMode) hideAtomMenu();
  addLog(editMode?'Modo edición activado — click sobre un átomo':'Modo edición desactivado','w');
}

/**
 * @registro Fase 5 · controls.js · showAtomMenu
 * Muestra y posiciona el menú contextual para editar el tipo de especie de un sitio seleccionado.
 * @param {*} k índice lineal del sitio.
 * @param {*} i fila.
 * @param {*} j columna.
 * @param {*} screenX coordenada X de pantalla.
 * @param {*} screenY coordenada Y de pantalla.
 * @returns {void}
 */
function showAtomMenu(k,i,j,screenX,screenY){
  editTarget={k,i,j};
  const menu=document.getElementById('atomMenu');
  const title=document.getElementById('atomMenuTitle');
  if(!menu) return;
  const tp=G[k];
  const tnm=tp===N_T?'N':tp===B_T?'B':tp===C_T?'C':'Vacancia';
  if(title) title.textContent=`[${i},${j}] ${tnm} · ${t('atom_menu_change_to')}`;
  // Posicionar menú cerca del átomo, dentro de la ventana
  const mw=170, mh=130;
  let mx=screenX+10, my=screenY-mh/2;
  if(mx+mw>window.innerWidth) mx=screenX-mw-10;
  if(my<10) my=10;
  if(my+mh>window.innerHeight-10) my=window.innerHeight-mh-10;
  menu.style.left=mx+'px'; menu.style.top=my+'px';
  menu.style.display='block';
}

/**
 * @registro Fase 5 · controls.js · hideAtomMenu
 * Oculta el menú contextual de edición y limpia el sitio seleccionado.
 * @returns {void}
 */
function hideAtomMenu(){
  const menu=document.getElementById('atomMenu');
  if(menu) menu.style.display='none';
  editTarget={k:-1,i:0,j:0};
}

/**
 * @registro Fase 5 · controls.js · setAtomType
 * Sustituye manualmente la especie del sitio seleccionado y recalcula energía, métricas y representación.
 * @param {*} newType código de la nueva especie.
 * @returns {void}
 */
function setAtomType(newType){
  const{k}=editTarget;
  if(k<0||!ready){hideAtomMenu();return;}
  const old=G[k];
  G[k]=newType;
  E=calcFullE(); // recalcular energía completa
  const names=['Vacancia','N','B','C'];
  addLog(`[${editTarget.i},${editTarget.j}] ${names[old]} → ${names[newType]} · E=${E.toFixed(1)} eV`,'w');
  hideAtomMenu();
  refreshCurrentEnergySnapshot();
  ui();
  draw();
}

// ── Eliminación aleatoria sin reiniciar ───────────────────────────────
/**
 * @registro Fase 5 · controls.js · applyRandomVacancies
 * Convierte aleatoriamente sitios no vacantes en vacancias sin reconstruir por completo la red.
 * @returns {void}
 */
function applyRandomVacancies(){
  if(run){addLog('Detén la simulación primero','r');return;}
  if(!ready){addLog('Inicializa una red primero','r');return;}
  const pct=+document.getElementById('iVac').value/100;
  const n=Math.max(0,Math.floor(Nx*Ny*pct));
  // Sitios no-vacantes disponibles
  const candidates=[];
  for(let k=0;k<Nx*Ny;k++) if(G[k]!==V_T) candidates.push(k);
  // Fisher-Yates shuffle parcial
  const toRemove=Math.min(n,candidates.length);
  if(toRemove===0){addLog('Vacantes/C% = 0: no se quitaron átomos','i');return;}
  for(let i=0;i<toRemove;i++){
    const j=i+Math.floor(rand()*(candidates.length-i));
    [candidates[i],candidates[j]]=[candidates[j],candidates[i]];
    G[candidates[i]]=V_T;
  }
  E=calcFullE();
  addLog(`Eliminados ${toRemove} átomos aleatorios · E=${E.toFixed(1)} eV`,'w');
  refreshCurrentEnergySnapshot();
  ui();
  draw();
}

/**
 * @registro Fase 5 · controls.js · onLatticeStartChange
 * Lee la subred inicial B/N seleccionada y programa la regeneración estructural en vivo.
 * @returns {void}
 */
function onLatticeStartChange(){
  latticeStart=document.getElementById('iStart')?.value||'B';
  scheduleLiveUpdate('structure','inicio de subred '+(latticeStart==='N'?'N':'B'));
}

// ── onPoreChange: mostrar/ocultar controles según opc ────────────────
/**
 * @registro Fase 5 · controls.js · onPoreChange
 * Adapta la interfaz y los parámetros recomendados al tipo de estructura/poro seleccionado y programa su actualización.
 * @returns {void}
 */
function onPoreChange(){
  const opc=+document.getElementById('iPore').value;
  const vacEl=document.getElementById('iVac');
  const vacLab=document.getElementById('lVac');
  if(vacEl){
    vacEl.min='0';
    vacEl.max='100'; // antes 35% para vacancias; ampliado a 100% en todos los modos
    if(+vacEl.value>+vacEl.max) vacEl.value=vacEl.max;
    if(vacLab) vacLab.textContent=vacEl.value+'%';
    if(opc===99){vacEl.value='0'; if(vacLab) vacLab.textContent='0%';}
  }
  const pszRow=document.getElementById('pszRow');
  const fitaRows=['fitaRow1','fitaRow2','fitaRow3'].map(id=>document.getElementById(id));
  const isFita=[30,31,32].includes(opc);
  const isPore=[10,11,12,13,14].includes(opc);

  // Mostrar slider tamaño poro
  if(pszRow) pszRow.classList[isPore?'add':'remove']('vis');
  // Mostrar slider de Carbono % solo en el modo combinado (opc 4)
  const carbRow=document.getElementById('carbRow');
  if(carbRow) carbRow.classList[opc===4?'add':'remove']('vis');
  const importedRow=document.getElementById('importedMCPolicyRow');
  if(importedRow) importedRow.style.display=(opc===99 || (typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry()))?'':'none';
  // Mostrar controles de fita estándar
  const isFitaEx=[40,41,42].includes(opc);
  const isFitaStd=[30,31,32,33,34].includes(opc);
  fitaRows.forEach(r=>r&&r.classList[isFitaStd?'add':'remove']('vis'));
  // Fita explícita
  const fitaExRow=document.getElementById('fitaExRow');
  if(fitaExRow) fitaExRow.classList[isFitaEx?'add':'remove']('vis');

  // Auto-activar overlay para poros con geometría definida
  if(isPore){
    const iOvl=document.getElementById('iOvl');
    if(iOvl&&iOvl.value==='off') iOvl.value='hull';
  }

  // Ajustar parámetros recomendados para segregación de C
  if(opc===20||opc===21){
    const set=(id,v,lid,fmt)=>{const e=document.getElementById(id);if(e)e.value=v;const l=document.getElementById(lid);if(l)l.textContent=fmt;};
    const vac=document.getElementById('iVac'); if(vac) vac.max='100';
    set('iVac',20,'lVac','20%');
    set('iSt',200000,'lSt','200k');
    set('iTi',5000,'lTi','5,000');
    set('iTf',300,'lTf','300');
  }
  // Modo combinado: red aleatoria h-BN + vacancias + carbono (opc 4)
  if(opc===4){
    const set=(id,v,lid,fmt)=>{const e=document.getElementById(id);if(e)e.value=v;const l=document.getElementById(lid);if(l)l.textContent=fmt;};
    // iVac = % de vacancias; iCarb = % de carbono. Recocido alto para ordenar B/N,
    // segregar el C y regularizar los bordes de las vacancias.
    set('iVac',12,'lVac','12%');
    set('iCarb',15,'lCarb','15%');
    set('iSt',200000,'lSt','200k');
    set('iTi',8000,'lTi','8,000');
    set('iTf',300,'lTf','300');
    addLog('Modo combinado: red aleatoria h-BN + vacancias (iVac) + C sustitucional (iCarb)','w');
  }
  // Parámetros y valores iniciales para cada tipo de fita
  // Auto-config para nanoribbons pasivadas
  const isNR=[47,48,49].includes(opc);
  if(isNR){
    const set=(id,v,lid,fmt)=>{const e=document.getElementById(id);if(e)e.value=v;const l=document.getElementById(lid);if(l)l.textContent=fmt;};
    set('iSt',200000,'lSt','200k');
    set('iTi',3000,'lTi','3,000');
    set('iTf',300,'lTf','300');
    // Forzar pasivación H activada para nanoribbons
    const iH=document.getElementById('iH');if(iH)iH.value='1';
    // Orientación recomendada
    const iOr=document.getElementById('iOrient');
    if(iOr){
      if(opc===47||opc===48){iOr.value='ZZ';latticeOrient='ZZ';}
      else{iOr.value='AC';latticeOrient='AC';}
      onOrientChange();
    }
    addLog('Nanoribbon pasivada: H activado · orientación ajustada','w');
  }
  if(isFita){
    const set=(id,v,lid,fmt)=>{const e=document.getElementById(id);if(e)e.value=v;const l=document.getElementById(lid);if(l)l.textContent=fmt;};
    set('iSt',100000,'lSt','100k');
    set('iTi',5000,'lTi','5,000');
    set('iTf',300,'lTf','300');
    // Para heteroestructuras: ajustar fp a 50% si está en 0
    if([32,42].includes(opc)){
      const ifp=document.getElementById('iFp');
      if(ifp&&+ifp.value===0){ifp.value=50;const l=document.getElementById('lFp');if(l)l.textContent='50%';}
    }
    // Para fitas estándar (30,31): fp por defecto 50%
    if([30,31].includes(opc)){
      const ifp=document.getElementById('iFp');
      if(ifp&&+ifp.value===0){ifp.value=50;const l=document.getElementById('lFp');if(l)l.textContent='50%';}
    }
  }
  syncTemperatureInputs();
  if(ready) scheduleLiveUpdate('structure','tipo de estructura');
}
/**
 * Ajusta Nx/Ny a dimensiones pares únicamente sobre los ejes internos que son
 * periódicos. Se omite para geometrías importadas/custom, que poseen un grafo
 * explícito y no dependen de la paridad de la malla regular.
 *
 * @param {boolean} updateUI Sincroniza sliders y etiquetas cuando hay ajuste.
 * @param {boolean} logChange Registra el ajuste en el panel de eventos.
 * @returns {boolean} true si alguna dimensión cambió.
 */
function enforcePeriodicGridParity(updateUI=true, logChange=true){
  const custom = typeof hasConsistentImportedGeometry==='function' && hasConsistentImportedGeometry();
  if(custom || typeof normalizePeriodicGridDimensions!=='function') return false;
  const result=normalizePeriodicGridDimensions(Nx,Ny,latticeOrient,pbcX,pbcY);
  if(!result.changed) return false;

  const oldNx=Nx, oldNy=Ny;
  Nx=result.nx; Ny=result.ny;
  if(updateUI){
    const nxEl=document.getElementById('iNx'); if(nxEl) nxEl.value=String(Nx);
    const nyEl=document.getElementById('iNy'); if(nyEl) nyEl.value=String(Ny);
    const lx=document.getElementById('lNx'); if(lx) lx.textContent=String(Nx);
    const ly=document.getElementById('lNy'); if(ly) ly.textContent=String(Ny);
    const lat=document.getElementById('lAt'); if(lat) lat.textContent=String(Nx*Ny);
  }
  if(logChange && typeof addLog==='function'){
    addLog(`PBC: dimensiones ajustadas para preservar la bipartición (${oldNx}×${oldNy} → ${Nx}×${Ny}).`,'w');
  }
  return true;
}

// ── initParams: solo lee parámetros MC, NO reconstruye la red ────────
/**
 * @registro Fase 5 · controls.js · initParams
 * Lee los parámetros Monte Carlo y físicos desde la interfaz preservando dimensiones de geometrías importadas coherentes.
 * @returns {void}
 */
function initParams(){
  // [FIX v13.9] Las geometrías del Constructor hBN/C (grafo explícito) codifican
  // Nx=1, Ny=n_átomos, un valor que puede superar el max="48" del slider #iNy.
  // El slider clampa ese valor silenciosamente (p.ej. 384 → 48), y si aquí
  // volvemos a leer Nx/Ny desde el slider, Nx*Ny deja de coincidir con
  // CUSTOM_POSITIONS/CUSTOM_PNB y la app pierde la geometría cargada al
  // presionar INICIAR, reconstruyendo una red genérica distinta. Por eso, si
  // ya hay una geometría personalizada válida y consistente, NO se sobre-
  // escriben Nx/Ny desde los sliders: se preservan los valores reales.
  const keepCustomDims = typeof hasConsistentImportedGeometry==='function' && hasConsistentImportedGeometry();
  if(!keepCustomDims){
    Nx=+document.getElementById('iNx').value;
    Ny=+document.getElementById('iNy').value;
  }
  readHydrogenReservoirInputs();
  tMode=document.getElementById('iTmode')?.value||'anneal';
  nRuns=+(document.getElementById('iNruns')?.value||1);
  const opc=+document.getElementById('iPore').value;
  isCarbon=(opc===20)||(opc===4)||(opc>=30&&opc!==99);
  latticeOrient=document.getElementById('iOrient')?.value||'AC';
  latticeStart=document.getElementById('iStart')?.value||'B';
  const pbcMode2=document.getElementById('iPBC')?.value||'XY';
  pbcX=(pbcMode2==='XY'||pbcMode2==='X');
  pbcY=(pbcMode2==='XY'||pbcMode2==='Y');
  if(!keepCustomDims) enforcePeriodicGridParity(true,true);
  if(typeof readImportedMCPolicy==='function') readImportedMCPolicy();
  globalSwapPct=isCarbon?0:+(document.getElementById('iGlobal')?.value||0);
  Ti=+document.getElementById('iTi').value;
  Tf=+document.getElementById('iTf').value; T=Ti;
  total=+document.getElementById('iSt').value;
  hPass=document.getElementById('iH').value==='1';
  H_OVERLAP_K=Math.max(0,+(document.getElementById('iHHK')?.value??H_OVERLAP_K));
  H_OVERLAP_DMIN=Math.max(0.1,+(document.getElementById('iHHD')?.value??H_OVERLAP_DMIN));
  H_OVERLAP_MODE=document.getElementById('iHHMode')?.value||H_OVERLAP_MODE;
  readCHCalibrationInputs(false);
  readFormationReferenceInputs();
  const spd=document.getElementById('iSpd').value;
  doAnim=spd==='normal'||spd==='slow';
  accepted=0; rejected=0; step=0; SA=null; AS.p=1;
  hE=[]; hS=[]; hT=[]; hA=[]; hBN=[];
  E=calcFullE(); // recalcular sobre la red actual (editada o no)
  hE.push(E); hS.push(step); hT.push(T); hA.push(0); hBN.push(countBonds().cNB);
}

/**
 * @registro Fase 5 · controls.js · startSim
 * Inicia o reanuda una corrida Monte Carlo sobre la red actual, validando topología, política de movimientos y reproducibilidad.
 * @returns {void}
 */
function startSim(){
  try{
    cancelAnimationFrame(raf);
    // [NUEVO v14.0] Semilla reproducible también en modo interactivo:
    // si #iSeed tiene un valor, la corrida es determinista; si está vacío,
    // vuelve al modo aleatorio clásico (Math.random).
    if(typeof setRandomSeed==='function'){
      const sv=document.getElementById('iSeed')?.value;
      const applied=setRandomSeed(sv!==''&&sv!==undefined?sv:null);
      if(applied!==null) addLog(`Semilla RNG fijada: ${applied} (corrida reproducible)`,'i');
    }
    editMode=false;
    const bEdit=document.getElementById('bEdit');
    if(bEdit){bEdit.textContent='✏ EDITAR';bEdit.style.borderColor='';bEdit.style.color='';}
    const hint=document.getElementById('editHint');
    if(hint) hint.style.display='none';
    hideAtomMenu();

    if(!ready){
      // Red no inicializada: hacer init completo
      init();
    } else {
      // Red ya existe (posiblemente importada/editada): preservar geometría y solo reiniciar MC
      const opcEl=document.getElementById('iPore');
      const wasImported=opcEl && +opcEl.value===99;
      const wasConsistent=typeof hasConsistentImportedGeometry==='function' && hasConsistentImportedGeometry();
      initParams();
      if(typeof buildPhysNB==='function') buildPhysNB();
      if(typeof buildScreenPos==='function') buildScreenPos();
      if(wasImported && !wasConsistent){
        addLog('Aviso: la geometría importada/personalizada no coincidía con Nx×Ny antes de iniciar (revisa si moviste los sliders Nx/Ny manualmente); se reconstruyó con la red genérica.','r');
      }
      addLog('► MC sobre red actual (geometría preservada)','g');
    }
    if(!ready || !G || !PNB || !PNB.length) throw new Error('red no inicializada o vecinos vacíos');
    if(typeof countAllowedMCMoves==='function'){
      const moves=countAllowedMCMoves();
      if(typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry()){
        const diag=(typeof diagnoseImportedMCMoves==='function')?diagnoseImportedMCMoves():null;
        if(diag){
          addLog(`MC importado: ${diag.summary}`,'i');
          const vacGlobal=Object.keys(diag.globalByType||{}).some(k=>k.includes('Vac'));
          if((diag.nVac||0)>0 && (diag.vacancyLocal||0)<=0 && !vacGlobal){
            addLog('Aviso: hay vacancia, pero la política actual no tiene saltos Vacancia↔átomo disponibles. La vacancia quedará fija aunque otros intercambios puedan ocurrir.','w');
          }
        } else {
          const policyLabel=(typeof describeImportedMCPolicy==='function')?describeImportedMCPolicy():(importedMCPolicy||'');
          addLog(`MC importado: ${policyLabel} · pares locales=${moves.local} · pares globales=${moves.global}`,'i');
        }
        if(moves.active<=0){
          setUI('','Sin movimientos MC','IDLE','');
          setBtn(false);
          const reason=(diag&&diag.reason)||moves.reason||'no hay pares elegibles';
          addLog('MC no iniciado: '+reason+'. Revisa la política importada: para mover una vacancia usa “Robusto recomendado” o “Vacancias móviles”.','r');
          return;
        }
      }
    }
    if(typeof saveInitialConfig==='function') saveInitialConfig();
    if(typeof startSimulationRecording==='function' && typeof recordingState!=='undefined' && recordingState.armed) startSimulationRecording();
    run=true; paused=false;
    setUI('rn','Simulando…',tMode==='3phase'?['EXPLORAR','ENFRIAR','EQUIL'][curPhase]||'RUN':'RUN','rn'); setBtn(true);
    document.getElementById('bPause').textContent='⏸  PAUSAR';
    raf=requestAnimationFrame(loop);
  }catch(err){
    run=false; paused=false;
    setBtn(false);
    setUI('','Listo','IDLE','');
    console.error(err);
    addLog('No se pudo iniciar MC: '+(err&&err.message?err.message:err),'r');
  }
}
/**
 * @registro Fase 5 · controls.js · pauseSim
 * Alterna el estado pausa/continuación de la simulación y sincroniza botones e indicadores.
 * @returns {void}
 */
function pauseSim(){
  paused=!paused;
  document.getElementById('bPause').textContent=paused?'▶  CONTINUAR':'⏸  PAUSAR';
  setUI(paused?'dn':'rn',paused?'Pausado':'Simulando…',paused?'PAUSE':'RUN',paused?'dn':'rn');
  if(!paused) raf=requestAnimationFrame(loop);
}
/**
 * @registro Fase 5 · controls.js · resetSim
 * Detiene la simulación y restablece contadores, estado visual, red y métricas mediante una reinicialización completa.
 * @returns {void}
 */
function resetSim(){
  cancelAnimationFrame(raf);run=false;paused=false;SA=null;AS.p=1;ready=false;
  document.getElementById('bPause').textContent='⏸  PAUSAR';
  document.getElementById('pf').style.width='0%';
  document.getElementById('pct').textContent='0%';
  setUI('','Listo','IDLE','');setBtn(false);
  init();resize();ui();draw();addLog('↺ Reset','w');
}

// ── Actualización automática en vivo (sin presionar RESET) ─────────────
let liveUpdateTimer=null;
let liveUpdateKind='structure';
let liveUpdateReason='';

/**
 * @registro Fase 5 · controls.js · liveKindPriority
 * Asigna prioridad a una clase de actualización en vivo para consolidar cambios pendientes.
 * @param {*} kind tipo de actualización: energy, params, view, neighbors o structure.
 * @returns {number}
 */
function liveKindPriority(kind){
  return ({energy:1,params:2,view:3,neighbors:4,structure:5}[kind]||5);
}



/**
 * @registro Fase 5 · controls.js · readCHCalibrationInputs
 * Lee y sincroniza los parámetros de calibración C–H armchair/zigzag y el valor efectivo promedio usado por el modelo.
 * @param {*} updateAverage si es verdadero, recalcula el promedio desde AC/ZZ.
 * @returns {void}
 */
function readCHCalibrationInputs(updateAverage=true){
  const get=id=>document.getElementById(id);
  const read=(id,fallback)=>{
    const el=get(id); if(!el) return fallback;
    const raw=String(el.value??'').trim(); if(raw==='') return fallback;
    const v=Number(raw.replace(',','.'));
    return Number.isFinite(v)?v:fallback;
  };
  EPS_CH_AC=read('iEpsCHAC',EPS_CH_AC);
  EPS_CH_ZZ=read('iEpsCHZZ',EPS_CH_ZZ);
  if(updateAverage) updateCHCalibrationFromEdges(EPS_CH_AC,EPS_CH_ZZ);
  else {
    const epsEl=get('iEpsXC');
    const v=read('iEpsXC',EPS_XC);
    EPS_XC=v;
    EPS_CH_DISP=Math.abs(EPS_CH_AC-EPS_CH_ZZ)/2;
  }
  const set=(id,val,d=2)=>{const el=get(id); if(el) el.textContent=Number.isFinite(val)?val.toFixed(d):'—';};
  set('lEpsCHAC',EPS_CH_AC,2); set('lEpsCHZZ',EPS_CH_ZZ,2); set('lEpsXC',EPS_XC,2);
  const epsInput=get('iEpsXC'); if(epsInput&&updateAverage) epsInput.value=EPS_XC.toFixed(2);
  const ep=get('epXC'); if(ep) ep.textContent=EPS_XC.toFixed(2);
  const note=get('chDispNote'); if(note) note.textContent=`Dispersión AC/ZZ: ±${EPS_CH_DISP.toFixed(2)} eV/enlace. El promedio alimenta X–C/C–H.`;
}

/**
 * @registro Fase 5 · controls.js · readFormationReferenceInputs
 * Lee desde la interfaz los potenciales químicos y la referencia DFT utilizados en energía de formación.
 * @returns {void}
 */
function readFormationReferenceInputs(){
  const get=id=>document.getElementById(id);
  const read=(id,fallback)=>{
    const el=get(id);
    if(!el) return fallback;
    const raw=String(el.value??'').trim();
    if(raw==='') return fallback;
    const v=Number(raw.replace(',','.'));
    return Number.isFinite(v)?v:fallback;
  };
  FORM_MU_B=read('iMuB',FORM_MU_B);
  FORM_MU_N=read('iMuN',FORM_MU_N);
  FORM_MU_C=read('iMuC',FORM_MU_C);
  FORM_MU_H=read('iMuHForm',FORM_MU_H);
  const dftRaw=String(get('iEformDFT')?.value??'').trim();
  const dftVal=dftRaw===''?null:Number(dftRaw.replace(',','.'));
  FORM_DFT_TOTAL=Number.isFinite(dftVal)?dftVal:null;
  const set=(id,val,digits=4)=>{const el=get(id); if(el) el.textContent=Number.isFinite(val)?val.toFixed(digits):'—';};
  set('lMuB',FORM_MU_B,4); set('lMuN',FORM_MU_N,4); set('lMuC',FORM_MU_C,4); set('lMuHForm',FORM_MU_H,4);
  const lD=get('lEformDFT'); if(lD) lD.textContent=FORM_DFT_TOTAL!==null?FORM_DFT_TOTAL.toFixed(4):'—';
  updateChemicalWindowNote();
}

/**
 * Muestra la ventana química de μ_N para el Δμ_H de formación activo.
 * @returns {void}
 */
function updateChemicalWindowNote(){
  const el=document.getElementById('chemWindowNote');
  if(!el||typeof chemicalWindow!=='function') return;
  const w=chemicalWindow(FORM_DMU_H);
  el.textContent=w.open
    ? `Ventana de μ_N: [${w.muNmin.toFixed(3)}, ${w.muNmax.toFixed(3)}] eV (ancho ${w.width.toFixed(3)} eV) para Δμ_H = ${FORM_DMU_H.toFixed(2)} eV.`
    : `Ventana vacía para Δμ_H = ${FORM_DMU_H.toFixed(2)} eV: h-BN es inestable frente a NH₃+BH₃ con estas referencias. Se abre para Δμ_H ≤ ${w.dmuHOpen.toFixed(3)} eV.`;
  el.style.color=w.open?'#0f766e':'#b45309';
}

// [v15.0] Aplica un ambiente químico respetando μ_B+μ_N = μ_BN y la ventana
// de estabilidad frente a NH₃ y BH₃ (límites corregidos: en v14.x estaban
// intercambiados).
/**
 * @registro controls.js · applyChemicalEnvironment
 * Aplica el ambiente químico seleccionado, sincroniza los potenciales químicos y actualiza la energía si corresponde.
 * @param {*} which identificador del ambiente químico.
 * @returns {void}
 */
function applyChemicalEnvironment(which){
  const get=id=>document.getElementById(id);
  const dm=Number(String(get('iDmuHForm')?.value??'0').replace(',','.'));
  const ref=get('iMuBNRef')?.value;
  if(ref) FORM_MU_BN_REF=ref==='dft'?'dft':'model';
  const r=setChemicalEnvironment(which||get('iChemEnv')?.value||'Nrich',Number.isFinite(dm)?dm:0);
  const set=(id,val)=>{const el=get(id); if(el) el.value=Number(val).toFixed(4);};
  set('iMuB',r.muB); set('iMuN',r.muN); set('iMuC',r.muC); set('iMuHForm',r.muH);
  readFormationReferenceInputs();
  if(ready) scheduleLiveUpdate('energy','ambiente químico');
  const nombre={Nrich:'rico en N (NH₃)',Brich:'rico en B (BH₃)',mid:'punto medio'}[r.env]||r.env;
  addLog(`Ambiente químico: ${nombre} · μ_B=${r.muB.toFixed(3)} μ_N=${r.muN.toFixed(3)} μ_H=${r.muH.toFixed(3)} (μ_B+μ_N=${(r.muB+r.muN).toFixed(3)})${r.open?'':' · ventana vacía'}`,r.open?'g':'w');
}

/**
 * Lee el modo del reservorio de H y Δμ_H del Monte Carlo desde la interfaz.
 * @returns {void}
 */
function readHydrogenReservoirInputs(){
  const get=id=>document.getElementById(id);
  const mode=get('iHRes')?.value;
  if(mode) setHydrogenReservoir(mode);
  const raw=String(get('iMuH')?.value??'0').replace(',','.');
  const v=Number(raw);
  muH=Number.isFinite(v)?Math.max(-20,Math.min(20,v)):0;
  const lab=get('lMuH'); if(lab) lab.textContent=muH.toFixed(2);
  const note=get('edgePerHNote');
  if(note&&typeof edgeEnergyPerHydrogen==='function'){
    const e=edgeEnergyPerHydrogen();
    note.textContent=`Energía de borde por H en el MC: ${e.perH.toFixed(3)} eV (${e.perH<0?'< 0: favorece fragmentar poros':'> 0: favorece poros compactos'}) · s=${e.shift.toFixed(3)} eV · ε'XX=${e.epsVV.toFixed(3)} eV`;
    note.style.color=e.perH<0?'#b45309':'#0f766e';
  }
}

// [NUEVO v14.7] Informa de las trampas de escala D1/D3/D8 en el registro.
/**
 * @registro Fase 5 · controls.js · reportParameterConsistency
 * Ejecuta las comprobaciones de coherencia de parámetros y registra advertencias o errores de escala.
 * @param {*} silent omite el mensaje de éxito cuando no hay observaciones.
 * @returns {Array<object>}
 */
function reportParameterConsistency(silent=false){
  const msgs=(typeof checkParameterConsistency==='function')?checkParameterConsistency():[];
  if(!msgs.length){ if(!silent) addLog('Coherencia de parámetros: sin observaciones','g'); return msgs; }
  for(const m of msgs) addLog((m.lvl==='error'?'⚠ ':'· ')+m.txt, m.lvl==='error'?'r':'w');
  return msgs;
}

// [NUEVO v14.7] Exporta E_form(μ_N) en todo el rango físico accesible.
// Es la figura estándar para defectos: E_f frente al potencial químico, en vez
// de un único número que depende de un reparto arbitrario.
/**
 * @registro Fase 5 · controls.js · exportFormationVsMu
 * Genera y guarda un CSV de energía de formación frente al potencial químico de nitrógeno.
 * @returns {void}
 */
function exportFormationVsMu(){
  if(!ready){ addLog('Genera una estructura antes de exportar E_form(μ)','w'); return; }
  const data=formationEnergyVsMuN(41,G);
  const w=chemicalWindow(FORM_DMU_H);
  const head=[
    `# ${HBN_APP_NAME} v${HBN_VERSION} — E_form frente al potencial químico del N`,
    `# Fecha: ${new Date().toISOString()}`,
    `# Red=${Nx}x${Ny}  orient=${latticeOrient}  PBC=${(pbcX&&pbcY)?'XY':pbcX?'X':pbcY?'Y':'none'}`,
    `# Restriccion: mu_B + mu_N = mu_BN = ${w.muBN.toFixed(6)}  (referencia ${FORM_MU_BN_REF==='dft'?'E(BN) Tabla 5.1':'3*eps_NB del modelo'})`,
    `# Delta mu_H = ${FORM_DMU_H}  mu_H = ${w.muH.toFixed(6)}`,
    `# Limite rico en B: mu_N=${w.muNmin.toFixed(4)} | rico en N: mu_N=${w.muNmax.toFixed(4)} | ventana ${w.open?'abierta':'VACIA (se barre entre extremos)'}`,
    `# mu_C=${FORM_MU_C}`,
    'mu_N_eV,mu_B_eV,Eform_eV,Eform_por_H_eV'
  ];
  const rows=data.map(d=>[d.muN.toFixed(6),d.muB.toFixed(6),
    d.Eform!==null?d.Eform.toFixed(6):'',d.perH!==null?d.perH.toFixed(8):''].join(','));
  const name=`hBN_Eform_vs_mu_${Date.now()}.csv`;
  if(typeof saveFile==='function') saveFile(name,[...head,...rows].join('\n'),'text/csv');
  addLog(`E_form(μ_N) exportado: ${name} (${data.length} puntos)`,'g');
}

/**
 * @registro Fase 5 · controls.js · setFormationReferencePreset
 * Carga un conjunto predefinido de referencias químicas de formación y actualiza la simulación si está inicializada.
 * @param {*} mode preset solicitado; por defecto model.
 * @returns {void}
 */
function setFormationReferencePreset(mode='model'){
  if(mode==='model') applyChemicalEnvironment(document.getElementById('iChemEnv')?.value||FORM_CHEM_ENV);
  else readFormationReferenceInputs();
  addLog('Referencias de formación actualizadas: preset '+mode,'i');
}

/**
 * @registro Fase 5 · controls.js · syncUIControlsFromValues
 * Sincroniza etiquetas y controles secundarios con los valores actuales de la interfaz y del estado global.
 * @returns {void}
 */
function syncUIControlsFromValues(){
  const get=id=>document.getElementById(id);
  const nx=+(get('iNx')?.value||Nx||16);
  const ny=+(get('iNy')?.value||Ny||16);
  if(get('lNx')) get('lNx').textContent=nx;
  if(get('lNy')) get('lNy').textContent=ny;
  if(get('lAt')) get('lAt').textContent=nx*ny;
  const st=+(get('iSt')?.value||total||0);
  if(get('lSt')) get('lSt').textContent=st>=1000?Math.round(st/1000)+'k':String(st);
  if(get('lVac')&&get('iVac')) get('lVac').textContent=get('iVac').value+'%';
  if(get('lPsz')&&get('iPsz')) get('lPsz').textContent=get('iPsz').value;
  if(get('lFw')&&get('iFw')) get('lFw').textContent=get('iFw').value;
  if(get('lFp')&&get('iFp')) get('lFp').textContent=get('iFp').value+'%';
  if(get('lWx')&&get('iWx')) get('lWx').textContent=get('iWx').value;
  if(get('lWy')&&get('iWy')) get('lWy').textContent=get('iWy').value;
  if(get('lWpos')&&get('iWpos')) get('lWpos').textContent=get('iWpos').value+'%';
  if(get('lGlobal')&&get('iGlobal')) get('lGlobal').textContent=get('iGlobal').value+'%';
  if(typeof readImportedMCPolicy==='function') readImportedMCPolicy();
  const importedRow=get('importedMCPolicyRow');
  if(importedRow) importedRow.style.display=((+get('iPore')?.value||0)===99 || (typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry()))?'':'none';
  readHydrogenReservoirInputs();
  if(get('iEpsXC')){
    EPS_XC=+get('iEpsXC').value;
    if(get('lEpsXC')) get('lEpsXC').textContent=EPS_XC.toFixed(2);
    if(get('epXC')) get('epXC').textContent=EPS_XC.toFixed(2);
  }
  readCHCalibrationInputs(false);
  if(get('iHHK')){
    H_OVERLAP_K=Math.max(0,+get('iHHK').value||0);
    if(get('lHHK')) get('lHHK').textContent=H_OVERLAP_K.toFixed(2);
  }
  if(get('iHHD')){
    H_OVERLAP_DMIN=Math.max(0.1,+get('iHHD').value||0.72);
    if(get('lHHD')) get('lHHD').textContent=H_OVERLAP_DMIN.toFixed(2);
  }
  if(get('iHHMode')) H_OVERLAP_MODE=get('iHHMode').value||H_OVERLAP_MODE;
  readFormationReferenceInputs();
  syncTemperatureInputs();
}

/**
 * @registro Fase 5 · controls.js · clearLiveRunStats
 * Reinicia estadísticas, historiales y progreso asociados a una actualización estructural en vivo.
 * @returns {void}
 */
function clearLiveRunStats(){
  accepted=0; rejected=0; step=0; SA=null; AS.p=1;
  hE=[]; hS=[]; hT=[]; hA=[]; hBN=[];
  const pf=document.getElementById('pf'); if(pf) pf.style.width='0%';
  const pct=document.getElementById('pct'); if(pct) pct.textContent='0%';
}

/**
 * @registro Fase 5 · controls.js · readLiveRuntimeParams
 * Actualiza parámetros de ejecución desde la interfaz sin reconstruir la geometría actual.
 * @returns {void}
 */
function readLiveRuntimeParams(){
  readHydrogenReservoirInputs();
  tMode=document.getElementById('iTmode')?.value||'anneal';
  nRuns=+(document.getElementById('iNruns')?.value||1);
  const opc=+document.getElementById('iPore').value;
  isCarbon=(opc===20)||(opc===4)||(opc>=30&&opc!==99);
  latticeOrient=document.getElementById('iOrient')?.value||'AC';
  latticeStart=document.getElementById('iStart')?.value||'B';
  const pbcMode2=document.getElementById('iPBC')?.value||'XY';
  pbcX=(pbcMode2==='XY'||pbcMode2==='X');
  pbcY=(pbcMode2==='XY'||pbcMode2==='Y');
  if(typeof readImportedMCPolicy==='function') readImportedMCPolicy();
  globalSwapPct=isCarbon?0:+(document.getElementById('iGlobal')?.value||0);
  Ti=+document.getElementById('iTi').value;
  Tf=+document.getElementById('iTf').value;
  if(!run||step===0) T=Ti;
  total=+document.getElementById('iSt').value;
  hPass=document.getElementById('iH')?.value==='1';
  H_OVERLAP_K=Math.max(0,+document.getElementById('iHHK')?.value||0);
  H_OVERLAP_DMIN=Math.max(0.1,+document.getElementById('iHHD')?.value||0.72);
  H_OVERLAP_MODE=document.getElementById('iHHMode')?.value||H_OVERLAP_MODE;
  readCHCalibrationInputs(false);
  readFormationReferenceInputs();
  const spd=document.getElementById('iSpd')?.value||'fast';
  doAnim=spd==='normal'||spd==='slow';
}

/**
 * @registro Fase 5 · controls.js · refreshCurrentEnergySnapshot
 * Recalcula la energía total y actualiza el último punto de los historiales visuales.
 * @returns {void}
 */
function refreshCurrentEnergySnapshot(){
  if(!ready) return;
  E=calcFullE();
  if(!hE.length){hE.push(E); hS.push(step); hT.push(T); hA.push(0); hBN.push(countBonds().cNB);}
  else{hE[hE.length-1]=E; hT[hT.length-1]=T; hBN[hBN.length-1]=countBonds().cNB;}
}

/**
 * @registro Fase 5 · controls.js · resumeLiveLoopIfNeeded
 * Restaura los estados run/paused y reanuda el bucle de animación cuando una actualización en vivo lo requiere.
 * @param {*} wasRunning estado de ejecución previo.
 * @param {*} wasPaused estado de pausa previo.
 * @returns {void}
 */
function resumeLiveLoopIfNeeded(wasRunning,wasPaused){
  run=!!(wasRunning||wasPaused);
  paused=!!wasPaused;
  setBtn(run);
  const bPause=document.getElementById('bPause');
  if(bPause) bPause.textContent=paused?'▶  CONTINUAR':'⏸  PAUSAR';
  if(wasRunning){
    setUI('rn','Simulando…',tMode==='3phase'?['EXPLORAR','ENFRIAR','EQUIL'][curPhase]||'RUN':'RUN','rn');
    raf=requestAnimationFrame(loop);
  } else if(wasPaused){
    setUI('dn','Pausado','PAUSE','dn');
  } else {
    setUI('','Listo','IDLE','');
    setBtn(false);
  }
}

/**
 * @registro Fase 5 · controls.js · applyLiveUpdate
 * Aplica inmediatamente una actualización en vivo de energía, parámetros, vista, vecinos o estructura preservando el estado de ejecución.
 * @param {*} kind tipo de actualización.
 * @param {*} reason descripción opcional del cambio.
 * @returns {void}
 */
function applyLiveUpdate(kind='structure',reason=''){
  if(window.__loadingSession) return;
  syncUIControlsFromValues();
  const wasRunning=run&&!paused;
  const wasPaused=run&&paused;
  cancelAnimationFrame(raf); raf=null;
  const applyStatus=()=>resumeLiveLoopIfNeeded(wasRunning,wasPaused);

  if(kind==='params'){
    readLiveRuntimeParams();
    refreshCurrentEnergySnapshot();
    ui(); draw(); applyStatus();
    addLog('↻ Parámetros MC actualizados en vivo'+(reason?' · '+reason:''),'i');
    return;
  }

  if(kind==='energy'){
    readHydrogenReservoirInputs();
    hPass=document.getElementById('iH')?.value==='1';
    const eps=document.getElementById('iEpsXC'); if(eps) EPS_XC=+eps.value;
    const hhk=document.getElementById('iHHK'); if(hhk) H_OVERLAP_K=Math.max(0,+hhk.value||0);
    const hhd=document.getElementById('iHHD'); if(hhd) H_OVERLAP_DMIN=Math.max(0.1,+hhd.value||0.72);
    const hhm=document.getElementById('iHHMode'); if(hhm) H_OVERLAP_MODE=hhm.value||H_OVERLAP_MODE;
    readCHCalibrationInputs(false);
    readFormationReferenceInputs();
    refreshCurrentEnergySnapshot();
    ui(); draw(); applyStatus();
    addLog('↻ Energía recalculada en vivo'+(reason?' · '+reason:''),'i');
    return;
  }

  if(kind==='view'){
    latticeOrient=document.getElementById('iOrient')?.value||'AC';
    // AC/ZZ no es solo una rotación de pantalla: la orientación cambia qué eje
    // físico corresponde a filas/columnas y, por tanto, cambia los vecinos en
    // PBC-X/PBC-Y y la pasivación de los bordes. Antes aquí solo se llamaba a
    // buildScreenPos(), por eso el botón parecía rotar la estructura sin cambiar
    // la familia real del borde.
    if(ready){
      buildPhysNB();
      buildScreenPos();

      if(typeof refreshCurrentEnergySnapshot==='function') refreshCurrentEnergySnapshot();
      draw(); ui();
    }
    applyStatus();
    addLog('↻ Orientación AC/ZZ recalculada: vecinos, PBC, energía y H actualizados'+(reason?' · '+reason:''),'g');
    return;
  }

  if(kind==='neighbors'){
    const mode=document.getElementById('iPBC')?.value||'XY';
    pbcX=(mode==='XY'||mode==='X');
    pbcY=(mode==='XY'||mode==='Y');
    const parityAdjusted=enforcePeriodicGridParity(true,true);
    if(parityAdjusted && ready && !(typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry())){
      applyLiveUpdate('structure',reason||'ajuste de paridad PBC');
      return;
    }
    if(ready && typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry()){
      const recomputed=typeof recomputeCustomGeometryPBC==='function' && recomputeCustomGeometryPBC(mode);
      if(recomputed){
        buildPhysNB(); buildScreenPos();
  
        readLiveRuntimeParams(); refreshCurrentEnergySnapshot();
        ui(); draw(); applyStatus();
        addLog('↻ Periodicidad recalculada en la geometría importada (enlaces y H reales)'+(reason?' · '+reason:''),'g');
        return;
      }
      if(IMPORTED_META) IMPORTED_META.runtimePBC=mode;
      readLiveRuntimeParams(); refreshCurrentEnergySnapshot();
      ui(); draw(); applyStatus();
      addLog('PBC del panel actualizado sin remapear la geometría importada (faltan metadatos del Constructor). Para cambiar periodicidad física real, usa el Constructor hBN/C y carga de nuevo.','w');
      return;
    }
    if(ready){
      buildPhysNB(); buildScreenPos(); refreshCurrentEnergySnapshot();
      ui(); draw();
    }
    applyStatus();
    addLog('↻ Vecinos/periodicidad actualizados en vivo'+(reason?' · '+reason:''),'i');
    return;
  }

  // Cambio estructural: tamaño, poro, vacancias, fitas, subred inicial, etc.
  window.__suppressLiveLog=true;
  try{
    run=false; paused=false; ready=false;
    init(); resize(); ui(); draw();
  } finally {
    window.__suppressLiveLog=false;
  }
  applyStatus();
  addLog('↻ Estructura regenerada automáticamente'+(reason?' · '+reason:''),'g');
}

/**
 * @registro Fase 5 · controls.js · scheduleLiveUpdate
 * Agrupa y difiere actualizaciones en vivo, conservando la de mayor prioridad cuando llegan cambios sucesivos.
 * @param {*} kind tipo de actualización.
 * @param {*} reason descripción opcional.
 * @param {*} delay retardo en milisegundos.
 * @returns {void}
 */
function scheduleLiveUpdate(kind='structure',reason='',delay=120){
  if(window.__loadingSession) return;
  if(liveUpdateTimer){
    if(liveKindPriority(kind)>=liveKindPriority(liveUpdateKind)) liveUpdateKind=kind;
    liveUpdateReason=reason||liveUpdateReason;
    clearTimeout(liveUpdateTimer);
  } else {
    liveUpdateKind=kind; liveUpdateReason=reason||'';
  }
  liveUpdateTimer=setTimeout(()=>{
    const k=liveUpdateKind, r=liveUpdateReason;
    liveUpdateTimer=null; liveUpdateKind='structure'; liveUpdateReason='';
    applyLiveUpdate(k,r);
  },delay);
}

document.getElementById('bRun').onclick=startSim;
document.getElementById('bPause').onclick=pauseSim;
document.getElementById('bReset').onclick=resetSim;

// El overlay se actualiza en tiempo real al cambiar el select
document.getElementById('iOvl').addEventListener('change',()=>{if(ready)draw();});

// Slider tamaño de poro
const iPsz=document.getElementById('iPsz');
const lPsz=document.getElementById('lPsz');
if(iPsz) iPsz.addEventListener('input',function(){
  if(lPsz)lPsz.textContent=this.value;
  scheduleLiveUpdate('structure','tamaño de poro');
});

// Sliders de fita
[['iFw','lFw',v=>v],['iFp','lFp',v=>v+'%']].forEach(([sid,lid,fmt])=>{
  const el=document.getElementById(sid);if(!el)return;
  el.addEventListener('input',function(){
    const l=document.getElementById(lid);if(l)l.textContent=fmt(this.value);
    scheduleLiveUpdate('structure',sid==='iFw'?'ancho de fita':'posición/fracción de fita');
  });
});


/**
 * @registro Fase 5 · controls.js · bindRangeNumber
 * Vincula un control range con su entrada numérica, etiqueta y acción adicional manteniendo límites y paso.
 * @param {*} rangeId id del slider.
 * @param {*} numberId id de la entrada numérica.
 * @param {*} labelId id de la etiqueta.
 * @param {*} fmt función de formato opcional.
 * @param {*} extra callback adicional opcional.
 * @returns {void}
 */
function bindRangeNumber(rangeId, numberId, labelId, fmt, extra){
  const rangeEl=document.getElementById(rangeId);
  const numberEl=document.getElementById(numberId);
  const labelEl=document.getElementById(labelId);
  if(!rangeEl) return;
  const formatter=fmt||((v)=>v);
  const sync=(value, source='range')=>{
    let v=Number(value);
    const min=Number(rangeEl.min ?? numberEl?.min ?? v);
    const max=Number(rangeEl.max ?? numberEl?.max ?? v);
    const step=Number(rangeEl.step||numberEl?.step||1)||1;
    if(!Number.isFinite(v)) v=Number(rangeEl.value||min||0);
    v=Math.min(max, Math.max(min, v));
    if(step>0){
      v=Math.round((v-min)/step)*step + min;
      v=Math.min(max, Math.max(min, v));
    }
    const normalized=String(v);
    rangeEl.value=normalized;
    if(numberEl) numberEl.value=normalized;
    if(labelEl) labelEl.textContent=formatter(normalized);
    if(extra&&source!=='init') extra(v);
  };
  rangeEl.addEventListener('input',function(){ sync(this.value,'range'); });
  if(numberEl){
    numberEl.addEventListener('input',function(){ sync(this.value,'number'); });
    numberEl.addEventListener('change',function(){ sync(this.value,'number'); });
    numberEl.addEventListener('blur',function(){ sync(this.value,'number'); });
  }
  sync(rangeEl.value,'init');
}

// ── Sliders ───────────────────────────────────────────────────────────
[['iNx','lNx',v=>v,v=>{document.getElementById('lAt').textContent=+v*(+document.getElementById('iNy').value)},'structure','tamaño Nx'],
 ['iNy','lNy',v=>v,v=>{document.getElementById('lAt').textContent=(+document.getElementById('iNx').value)*+v},'structure','tamaño Ny'],
 ['iSt','lSt',v=>+v>=1000?Math.round(+v/1000)+'k':v,null,'params','pasos MC'],
 ['iVac','lVac',v=>v+'%',null,'structure','porcentaje de vacancias'],
 ['iCarb','lCarb',v=>v+'%',null,'structure','porcentaje de carbono'],
].forEach(([sid,lid,fmt,extra,kind,reason])=>{
  const el=document.getElementById(sid);if(!el)return;
  el.addEventListener('input',function(){
    document.getElementById(lid).textContent=fmt(this.value);
    if(extra)extra(+this.value);
    scheduleLiveUpdate(kind,reason);
  });
  document.getElementById(lid).textContent=fmt(el.value);
  if(extra)extra(+el.value);
});
bindRangeNumber('iTi','iTiNum','lTi',v=>(+v).toLocaleString(),()=>scheduleLiveUpdate('params','temperatura inicial'));
bindRangeNumber('iTf','iTfNum','lTf',v=>(+v).toLocaleString(),()=>scheduleLiveUpdate('params','temperatura final'));
document.getElementById('iSpd').addEventListener('change',function(){
  doAnim=this.value==='normal'||this.value==='slow';
});

// ── Tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',function(){
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    document.querySelectorAll('.tb').forEach(b=>b.classList.remove('on'));
    this.classList.add('on');
    const tb=document.getElementById('t-'+this.dataset.t);if(tb)tb.classList.add('on');
    if(this.dataset.t==='graf'){
      setTimeout(()=>['gE','gT','gA','gB'].forEach(id=>{
        const c=document.getElementById(id);
        if(c){c.width=c.parentElement.clientWidth||230;}
        if(hE.length>1) miniChart(id,id==='gE'?hE:id==='gT'?hT:id==='gA'?hA:hBN,
          id==='gE'?'#7c3aed':id==='gT'?'#b45309':id==='gA'?'#16a34a':'#2563eb',
          id+'v');
      }),40);
      setTimeout(()=>{ if(hE.length>1) miniChartXY('gET',hT,hE); },45);
    }
    if(this.dataset.t==='inv' && typeof refreshResearchPanel==='function') refreshResearchPanel();
  });
});

// ── Click átomo ───────────────────────────────────────────────────────
/**
 * @registro Fase 5 · controls.js · handleClick
 * Localiza el sitio atómico más cercano a un clic/tacto y abre edición o registra información del átomo.
 * @param {*} ex coordenada X del evento.
 * @param {*} ey coordenada Y del evento.
 * @returns {void}
 */
function handleClick(ex,ey){
  if(!ready||!GX.length) return;
  const rect=cv.getBoundingClientRect();
  const scX=cv.width/rect.width,scY=cv.height/rect.height;
  const mx0=(ex-rect.left)*scX,my0=(ey-rect.top)*scY;
  const inv=viewToWorld2D(mx0,my0);
  const mx=inv.x,my=inv.y;
  let best=-1,bestD=Infinity,bi=0,bj=0;
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    const d=Math.hypot(mx-GX[k],my-GY[k]);
    if(d<bestD){bestD=d;best=k;bi=i;bj=j;}
  }
  if(best>=0&&bestD<SCALE*D*0.9){
    if(editMode){
      // En modo edición: mostrar menú contextual
      showAtomMenu(best,bi,bj,ex,ey);
      return;
    }
    const tp=G[best];
    const nm=tp===N_T?'N (nitrógeno)':tp===B_T?'B (boro)':tp===C_T?'C (carbono)':'Vacancia';
    const[x,y]=atomPos(bi,bj);
    addLog(`[${bi},${bj}] ${nm} · x=${x.toFixed(3)} y=${y.toFixed(3)} Å`,'i');
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    document.querySelectorAll('.tb').forEach(b=>b.classList.remove('on'));
    document.querySelector('[data-t="stat"]').classList.add('on');
    document.getElementById('t-stat').classList.add('on');
  } else {
    // Click fuera de un átomo → cerrar menú si estaba abierto
    if(editMode) hideAtomMenu();
  }
}
cv.addEventListener('click',e=>handleClick(e.clientX,e.clientY));
cv.addEventListener('touchstart',e=>{e.preventDefault();handleClick(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});

// ── Navegación 2D (sin 3D) ───────────────────────────────────────────
cv.addEventListener('wheel',e=>{
  e.preventDefault();
  const rect=cv.getBoundingClientRect();
  const sx=(e.clientX-rect.left)*(cv.width/rect.width);
  const sy=(e.clientY-rect.top)*(cv.height/rect.height);
  zoom2D(e.deltaY<0?1.12:1/1.12,sx,sy);
},{passive:false});
cv.addEventListener('mousedown',e=>{
  if(e.shiftKey||e.button===1||e.button===2){
    VIEW2D.drag=true; VIEW2D.lastX=e.clientX; VIEW2D.lastY=e.clientY;
    cv.style.cursor='move'; e.preventDefault();
  }
});
window.addEventListener('mousemove',e=>{
  if(!VIEW2D.drag) return;
  VIEW2D.panX += e.clientX-VIEW2D.lastX;
  VIEW2D.panY += e.clientY-VIEW2D.lastY;
  VIEW2D.lastX=e.clientX; VIEW2D.lastY=e.clientY;
  if(ready) draw();
});
window.addEventListener('mouseup',()=>{if(VIEW2D.drag){VIEW2D.drag=false;cv.style.cursor='crosshair';}});
cv.addEventListener('contextmenu',e=>{ if(e.shiftKey) e.preventDefault(); });

// ── Resize ────────────────────────────────────────────────────────────
/**
 * @registro Fase 5 · controls.js · resize
 * Ajusta el Canvas principal al contenedor, reconstruye posiciones de pantalla y redibuja la estructura.
 * @returns {void}
 */
function resize(){
  const cz=document.querySelector('.cz');if(!cz)return;
  const W=Math.max(80,cz.clientWidth);
  const cbH=document.querySelector('.cbar')?.offsetHeight||32;
  const lgH=document.querySelector('.legbar')?.offsetHeight||26;
  const H=Math.max(80,cz.clientHeight-cbH-lgH);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  if(ready) buildScreenPos();
  draw();
}
window.addEventListener('resize',resize);
if(window.ResizeObserver)
  new ResizeObserver(()=>setTimeout(resize,20)).observe(document.querySelector('.cz'));


// ── Modo temperatura ─────────────────────────────────────────────────

/**
 * @registro Fase 5 · controls.js · syncTemperatureInputs
 * Sincroniza sliders, campos numéricos y etiquetas de temperatura inicial/final.
 * @returns {void}
 */
function syncTemperatureInputs(){
  ['iTi','iTf'].forEach((id)=>{
    const src=document.getElementById(id);
    const num=document.getElementById(id+'Num');
    const lab=document.getElementById(id==='iTi'?'lTi':'lTf');
    if(src&&num) num.value=src.value;
    if(src&&lab) lab.textContent=(+src.value).toLocaleString();
  });
}

/**
 * @registro Fase 5 · controls.js · onTmodeChange
 * Adapta la visibilidad de la temperatura final al modo térmico seleccionado.
 * @returns {void}
 */
function onTmodeChange(){
  const m=document.getElementById('iTmode')?.value||'anneal';
  const rowTf=document.getElementById('rowTf');
  if(rowTf) rowTf.style.display=(m==='iso')?'none':'';
}

// ── Protocolo DFT — configurar parámetros óptimos ────────────────────
// Configuración recomendada para comparación cuantitativa con DFT
/**
 * @registro Fase 5 · controls.js · applyDFTProtocol
 * Aplica a la interfaz un conjunto de parámetros recomendado para comparación cuantitativa con cálculos DFT.
 * @returns {void}
 */
function applyDFTProtocol(){
  const opc=+document.getElementById('iPore').value;
  // N=24 para poros, N=28 para fitas
  const isFita=opc>=30;
  const sz=isFita?28:24;
  document.getElementById('iNx').value=sz;
  document.getElementById('lNx').textContent=sz;
  document.getElementById('iNy').value=sz;
  document.getElementById('lNy').textContent=sz;
  document.getElementById('lAt').textContent=sz*sz;
  // Modo 3 fases
  document.getElementById('iTmode').value='3phase';
  onTmodeChange();
  // T: exploración 5000K → equilibración 900K
  document.getElementById('iTi').value=5000;
  document.getElementById('lTi').textContent='5,000';
  document.getElementById('iTf').value=900;
  document.getElementById('lTf').textContent='900';
  syncTemperatureInputs();
  // Pasos
  document.getElementById('iSt').value=400000;
  document.getElementById('lSt').textContent='400k';
  // Parámetros de la tesis 2019 y ε_CH provisional; K_HH = 35 eV (modo max).
  ['iEpsCHAC','iEpsCHZZ','iEpsXC'].forEach(id=>{const el=document.getElementById(id); if(el) el.value=PARAMS_TESIS_2019.XC.toFixed(2);});
  readCHCalibrationInputs(true);
  const hhk=document.getElementById('iHHK'); if(hhk) hhk.value='35.00';
  const hhkL=document.getElementById('lHHK'); if(hhkL) hhkL.textContent='35.00';
  const hhm=document.getElementById('iHHMode'); if(hhm){hhm.value='max'; H_OVERLAP_MODE='max';}
  // Reservorio de H de la tesis, Δμ_H = 0.
  const hres=document.getElementById('iHRes'); if(hres) hres.value='tesis';
  const imu=document.getElementById('iMuH'); if(imu) imu.value='0';
  readHydrogenReservoirInputs();
  // Overlay automático
  if([10,11,12,13,14].includes(opc))
    document.getElementById('iOvl').value='hull';
  scheduleLiveUpdate('structure','protocolo de referencia',40);
  addLog(`Protocolo de referencia aplicado: N=${sz}×${sz} · 3 fases 5000→900 K · ε_CH=${PARAMS_TESIS_2019.XC} eV (provisional) · K_HH=35 eV · reservorio tesis`,'g');
}

// ── Reservorio de H del Monte Carlo ───────────────────────────────────
['iMuH','iHRes'].forEach(id=>{
  const el=document.getElementById(id);
  if(!el) return;
  const onChange=()=>{
    readHydrogenReservoirInputs();
    if(ready) scheduleLiveUpdate('energy',id==='iHRes'?'reservorio de H':'Δμ_H');
  };
  el.addEventListener('input',onChange);
  el.addEventListener('change',onChange);
});

// ── Referencias de la energía de formación ───────────────────────────
['iDmuHForm','iMuBNRef'].forEach(id=>{
  const el=document.getElementById(id);
  if(!el) return;
  el.addEventListener('change',()=>applyChemicalEnvironment(document.getElementById('iChemEnv')?.value||FORM_CHEM_ENV));
});

document.getElementById('iEpsXC')?.addEventListener('input',function(){
  EPS_XC=+this.value;
  const l=document.getElementById('lEpsXC');
  if(l) l.textContent=EPS_XC.toFixed(2);
  const ep=document.getElementById('epXC');
  if(ep) ep.textContent=EPS_XC.toFixed(2);
  const note=document.getElementById('chDispNote'); if(note) note.textContent='Modo manual: εCH promedio editado directamente. AC/ZZ conservan sus valores de trazabilidad.';
  if(ready) scheduleLiveUpdate('energy','εCH');
});



['iEpsCHAC','iEpsCHZZ'].forEach(id=>{
  document.getElementById(id)?.addEventListener('input',function(){
    readCHCalibrationInputs(true);
    if(ready) scheduleLiveUpdate('energy','εCH AC/ZZ');
  });
});

document.getElementById('iHHK')?.addEventListener('input',function(){
  H_OVERLAP_K=Math.max(0,+this.value||0);
  const l=document.getElementById('lHHK'); if(l) l.textContent=H_OVERLAP_K.toFixed(2);
  if(ready) scheduleLiveUpdate('energy','penalización H–H');
});
document.getElementById('iHHD')?.addEventListener('input',function(){
  H_OVERLAP_DMIN=Math.max(0.1,+this.value||0.72);
  const l=document.getElementById('lHHD'); if(l) l.textContent=H_OVERLAP_DMIN.toFixed(2);
  if(ready) scheduleLiveUpdate('energy','distancia H–H');
});
document.getElementById('iHHMode')?.addEventListener('change',function(){
  H_OVERLAP_MODE=this.value||'max';
  if(ready) scheduleLiveUpdate('energy','modo H–H');
});

['iMuB','iMuN','iMuC','iMuHForm','iEformDFT'].forEach(id=>{
  document.getElementById(id)?.addEventListener('input',function(){
    // Una edición manual de μ deja el ambiente como 'custom'.
    if(id!=='iEformDFT') FORM_CHEM_ENV='custom';
    readFormationReferenceInputs();
    if(ready) scheduleLiveUpdate('energy','referencia '+id);
  });
});

// Sliders Wx,Wy,Wpos
[['iWx','lWx',v=>v],['iWy','lWy',v=>v],['iWpos','lWpos',v=>v+'%']].forEach(([s,l,f])=>{
  document.getElementById(s)?.addEventListener('input',function(){
    const el=document.getElementById(l);if(el)el.textContent=f(this.value);
    scheduleLiveUpdate('structure',s==='iWpos'?'posición de ventana':'tamaño de ventana');
  });
});

// ── onPoreChange mejorado: fitas explícitas ───────────────────────────
// ── Cambio de orientación ────────────────────────────────────────────
/**
 * @registro Fase 5 · controls.js · onOrientChange
 * Actualiza la orientación AC/ZZ y, según el tipo de geometría, redibuja o programa la actualización correspondiente.
 * @returns {void}
 */
function onOrientChange(){
  latticeOrient=document.getElementById('iOrient')?.value||'AC';
  const hint=document.getElementById('orientHint');
  if(hint){
    const pbcMode=document.getElementById('iPBC')?.value||'XY';
    const baseHint=latticeOrient==='ZZ'?t('orient_hint_zz'):t('orient_hint_ac');
    const bulkNote=pbcMode==='XY'?' · En PBC X+Y no hay borde libre visible; usa PBC-X o bordes abiertos para ver la diferencia AC/ZZ.':'';
    hint.textContent=baseHint+bulkNote;
    hint.style.color=latticeOrient==='ZZ'?'#2563eb':'#64748b';
  }
  if(ready && typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry()){
    // En geometría importada explícita, la orientación del panel no debe reconstruir la red.
    buildScreenPos(); ui(); draw();
    addLog('Orientación del panel no remapea la geometría importada del constructor.','w');
    return;
  }
  // Si hay una red generada, actualizarla en vivo sin RESET
  if(ready) scheduleLiveUpdate('view','familia real de borde '+latticeOrient,40);
}

// ── onPoreChange: también configurar NR pasivadas ─────────────────────
// ── Arranque ──────────────────────────────────────────────────────────
// ── Cambio de condición de borde ─────────────────────────────────────
/**
 * @registro Fase 5 · controls.js · onPBCChange
 * Actualiza las condiciones periódicas y reconstruye vecinos/enlaces/H cuando la geometría explícita lo permite.
 * @returns {void}
 */
function onPBCChange(){
  const mode=document.getElementById('iPBC')?.value||'XY';
  pbcX=(mode==='XY'||mode==='X');
  pbcY=(mode==='XY'||mode==='Y');
  const parityAdjusted=enforcePeriodicGridParity(true,true);
  const labels={XY:'Periódico X+Y',X:'Periódico X / borde libre Y',Y:'Borde libre X / periódico Y',none:'Bordes abiertos (isla)'};
  // Refresca la nota de AC/ZZ cuando cambia la periodicidad: con X+Y no hay borde libre real.
  const hint=document.getElementById('orientHint');
  if(hint){
    const baseHint=latticeOrient==='ZZ'?t('orient_hint_zz'):t('orient_hint_ac');
    const bulkNote=mode==='XY'?' · En PBC X+Y no hay borde libre visible; usa PBC-X o bordes abiertos para ver la diferencia AC/ZZ.':'';
    hint.textContent=baseHint+bulkNote;
  }
  if(ready && typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry()){
    const recomputed=typeof recomputeCustomGeometryPBC==='function' && recomputeCustomGeometryPBC(mode);
    if(recomputed){
      buildPhysNB(); buildScreenPos();

      refreshCurrentEnergySnapshot(); ui(); draw(); applyStatus();
      addLog(`Periodicidad recalculada sobre la geometría importada: ${labels[mode]||mode} (enlaces y pasivación H reales, no solo la etiqueta)`,'g');
    } else {
      if(IMPORTED_META) IMPORTED_META.runtimePBC=mode;
      refreshCurrentEnergySnapshot(); ui(); draw();
      addLog('No se pudieron recalcular enlaces/H reales para esta geometría (faltan metadatos del Constructor, p.ej. una sesión antigua) — solo se actualizó la etiqueta del panel. Regenera en el Constructor hBN/C para cambiar la periodicidad física real.','w');
    }
    return;
  }
  if(ready) scheduleLiveUpdate(parityAdjusted?'structure':'neighbors',labels[mode]||mode,40);
}

// Slider de intercambio global h-BN
document.getElementById('iGlobal')?.addEventListener('input',function(){
  globalSwapPct=+this.value;
  const l=document.getElementById('lGlobal');if(l)l.textContent=this.value+'%';
  if(ready) scheduleLiveUpdate('params','intercambio global',80);
  if(globalSwapPct>0&&!isCarbon)
    addLog('Intercambio global: '+this.value+'% de los intentos MC serán de largo alcance','i');
});


document.getElementById('iImportedMCPolicy')?.addEventListener('change',function(){
  if(typeof readImportedMCPolicy==='function') readImportedMCPolicy();
  if(ready) scheduleLiveUpdate('params','política MC importada',80);
  addLog('MC importado: '+this.options[this.selectedIndex].text,'w');
});

// Selectores que también deben aplicar cambios automáticamente
['iFt'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>scheduleLiveUpdate('structure','terminación de fita')));
document.getElementById('iH')?.addEventListener('change',()=>scheduleLiveUpdate('energy','pasivación H'));
document.getElementById('iTmode')?.addEventListener('change',()=>scheduleLiveUpdate('params','modo de temperatura'));
document.getElementById('iNruns')?.addEventListener('input',()=>scheduleLiveUpdate('params','número de réplicas'));

window.addEventListener('load',()=>{
  setTimeout(()=>{
    onPoreChange();
    setupCompactCards();
    const epsInput=document.getElementById('iEpsXC'); if(epsInput) epsInput.value=EPS_XC.toFixed(2);
    const epsLbl=document.getElementById('lEpsXC'); if(epsLbl) epsLbl.textContent=EPS_XC.toFixed(2);
    const epsCell=document.getElementById('epXC'); if(epsCell) epsCell.textContent=EPS_XC.toFixed(2);
    readCHCalibrationInputs(true);
    const hhkInput=document.getElementById('iHHK'); if(hhkInput) hhkInput.value=H_OVERLAP_K.toFixed(2);
    const hhkLbl=document.getElementById('lHHK'); if(hhkLbl) hhkLbl.textContent=H_OVERLAP_K.toFixed(2);
    const hhdInput=document.getElementById('iHHD'); if(hhdInput) hhdInput.value=H_OVERLAP_DMIN.toFixed(2);
    const hhdLbl=document.getElementById('lHHD'); if(hhdLbl) hhdLbl.textContent=H_OVERLAP_DMIN.toFixed(2);
    const hhm=document.getElementById('iHHMode'); if(hhm) hhm.value=H_OVERLAP_MODE;
    update2DZoomLabel();
    if(typeof update2DVolatileButton==='function') update2DVolatileButton();
    applyChemicalEnvironment(document.getElementById('iChemEnv')?.value||'Nrich');
    readHydrogenReservoirInputs();
    resize();init();draw();ui();
    if(typeof initResearchPanel==='function') initResearchPanel();
    addLog(`${HBN_APP_NAME} v${HBN_VERSION} · N=azul B=verde C=gris H=blanco`,'g');
    addLog(`Parámetros: ${MODEL_PARAM_SET==='tesis2019'?'tesis Obando–Batista 2019':'personalizados'} · ε_CH=${EPS_XC.toFixed(2)} eV (provisional) · reservorio H=${H_RESERVOIR}`,'i');
    // Comprobación automática de coherencia de escala (D1/D3/D8)
    setTimeout(()=>{ try{ reportParameterConsistency(true); }catch(e){} },100);
  },80);
});

// Aplicar idioma inicial al cargar
document.addEventListener('DOMContentLoaded', ()=>{
  applyLang();
  const cb=document.getElementById('iAskSaveLoc'), lb=document.getElementById('lAskSaveLoc');
  if(cb && !SAVE_FILE_PICKER_SUPPORTED){
    cb.checked=false; cb.disabled=true; ASK_SAVE_LOCATION=false;
    if(lb) lb.textContent='Elegir carpeta al guardar (no disponible en este navegador · usa Chrome/Edge)';
  }
});
