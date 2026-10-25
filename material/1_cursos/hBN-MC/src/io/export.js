// export.js — exportación de imágenes, datos y estructuras
'use strict';

/**
 * [REGISTRO-DOC-EXPORT:MODULE]
 * Módulo de salida de resultados de hBN-MC. Centraliza capturas PNG, grabación WebM,
 * exportación de series CSV, estructuras LAMMPS/POSCAR/SIESTA, sesiones JSON,
 * reportes gráficos y paquetes ZIP. La documentación añadida en esta fase no modifica
 * el código ejecutable ni los formatos de archivo generados por la versión v14.7.1.
 */
// ── Exportación de resultados ─────────────────────────────────────────
// Guarda el snapshot del canvas como PNG
/**
 * [REGISTRO-DOC-EXPORT:001:exportCanvasPNG]
 * Exporta el canvas principal como imagen PNG con fondo blanco y nombre de archivo fechado.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: label.
 * Retorno: void.
 */
function exportCanvasPNG(label){
  const tmp=document.createElement('canvas');
  tmp.width=cv.width; tmp.height=cv.height;
  const tc=tmp.getContext('2d');
  tc.fillStyle='#ffffff'; tc.fillRect(0,0,tmp.width,tmp.height);
  tc.drawImage(cv,0,0);
  const filename=`hBN_${label}_${Date.now()}.png`;
  if(typeof saveFile==='function' && tmp.toBlob){
    tmp.toBlob(blob=>{ if(blob) saveFile(filename,blob,'image/png'); },'image/png');
    return;
  }
  const a=document.createElement('a');
  a.download=filename;
  a.href=tmp.toDataURL('image/png');
  a.click();
}

// Genera PNG de la configuración inicial guardada
let G_initial=null;

// ── Grabación de video: estructura + gráficas ────────────────────────
let recordingState={armed:false,active:false,canvas:null,ctx:null,stream:null,track:null,recorder:null,chunks:[],mime:'',blob:null,startedAt:0,raf:0,lastFrameAt:0};
/**
 * [REGISTRO-DOC-EXPORT:002:updateRecordingButton]
 * Actualiza texto y estilo del botón de grabación según el estado armed/active.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function updateRecordingButton(){
  const b=document.getElementById('bRec');
  if(!b) return;
  if(recordingState.active){
    b.textContent=t('rec_stop');
    b.style.background='#b91c1c'; b.style.color='#fff'; b.style.borderColor='#ef4444';
  }else if(recordingState.armed){
    b.textContent=t('rec_armed');
    b.style.background='#fef2f2'; b.style.color='#b91c1c'; b.style.borderColor='#ef4444';
  }else{
    b.textContent=t('rec_idle');
    b.style.background='#fff'; b.style.color='#b91c1c'; b.style.borderColor='#ef4444';
  }
}
/**
 * [REGISTRO-DOC-EXPORT:003:toggleRecordingArm]
 * Activa o desactiva el armado de la grabación; si ya graba, solicita detenerla.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function toggleRecordingArm(){
  if(recordingState.active){ stopSimulationRecording(false); return; }
  recordingState.armed=!recordingState.armed;
  updateRecordingButton();
  addLog(recordingState.armed?'Grabación activada: comenzará con INICIAR':'Grabación desactivada','w');
}
/**
 * [REGISTRO-DOC-EXPORT:004:getSupportedVideoMime]
 * Selecciona el primer MIME WebM soportado por MediaRecorder, priorizando VP9 y VP8.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: string.
 */
function getSupportedVideoMime(){
  const opts=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return opts.find(v=>window.MediaRecorder&&MediaRecorder.isTypeSupported(v))||'';
}
/**
 * [REGISTRO-DOC-EXPORT:005:recordingPump]
 * Mantiene el bucle de captura de frames durante una grabación de simulación.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function recordingPump(){
  if(!recordingState.active) return;
  renderRecordingFrame();
  if(recordingState.track && typeof recordingState.track.requestFrame==='function'){
    try{ recordingState.track.requestFrame(); }catch(_e){}
  }
  recordingState.lastFrameAt=performance.now();
  recordingState.raf=requestAnimationFrame(recordingPump);
}
/**
 * [REGISTRO-DOC-EXPORT:006:startSimulationRecording]
 * Inicializa canvas 1280×720, MediaRecorder y captura de estructura+gráficas en WebM.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function startSimulationRecording(){
  if(recordingState.active||!recordingState.armed) return;
  const mime=getSupportedVideoMime();
  if(!mime){ addLog('Este navegador no soporta grabación WebM/MediaRecorder','r'); recordingState.armed=false; updateRecordingButton(); return; }
  const recCanvas=document.createElement('canvas');
  recCanvas.width=1280; recCanvas.height=720;
  const recCtx=recCanvas.getContext('2d',{alpha:false});
  const stream=recCanvas.captureStream(30);
  const track=stream.getVideoTracks?stream.getVideoTracks()[0]:null;
  if(track) try{ track.contentHint='motion'; }catch(_e){}
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10_000_000});
  recordingState={armed:false,active:true,canvas:recCanvas,ctx:recCtx,stream,track,recorder:rec,chunks:[],mime,blob:null,startedAt:performance.now(),raf:0,lastFrameAt:0};
  rec.ondataavailable=e=>{ if(e.data&&e.data.size>0) recordingState.chunks.push(e.data); };
  rec.onerror=e=>{ addLog('Error al grabar video: '+(e?.error?.message||e?.name||'MediaRecorder'),'r'); };
  rec.onstop=()=>{
    const chunks=recordingState.chunks||[];
    const mimeType=recordingState.mime||'video/webm';
    if(recordingState.raf) cancelAnimationFrame(recordingState.raf);
    if(recordingState.stream) recordingState.stream.getTracks().forEach(t=>t.stop());
    recordingState.active=false;
    recordingState.recorder=null;
    recordingState.track=null;
    if(!chunks.length){
      addLog('No se pudo consolidar el video. Intenta con Chrome/Edge y una corrida un poco más larga.','r');
      updateRecordingButton();
      return;
    }
    recordingState.blob=new Blob(chunks,{type:mimeType});
    downloadLastRecording(true);
    addLog('Video generado ✓ transición estructural + gráficas','g');
    updateRecordingButton();
  };
  renderRecordingFrame();
  if(track && typeof track.requestFrame==='function'){
    try{ track.requestFrame(); }catch(_e){}
  }
  rec.start(250);
  recordingPump();
  updateRecordingButton();
  addLog('Grabando simulación… estructura y gráficas se renderizan en paralelo en el video','w');
}
/**
 * [REGISTRO-DOC-EXPORT:007:stopSimulationRecording]
 * Finaliza de forma controlada la grabación activa y solicita los últimos datos al MediaRecorder.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: keepArmed=false.
 * Retorno: void.
 */
function stopSimulationRecording(keepArmed=false){
  recordingState.armed=!!keepArmed;
  const rec=recordingState.recorder;
  if(!rec||rec.state==='inactive'){
    if(recordingState.raf) cancelAnimationFrame(recordingState.raf);
    if(recordingState.stream) recordingState.stream.getTracks().forEach(t=>t.stop());
    recordingState.active=false;
    updateRecordingButton();
    return;
  }
  if(recordingState.raf) cancelAnimationFrame(recordingState.raf);
  renderRecordingFrame();
  if(recordingState.track && typeof recordingState.track.requestFrame==='function'){
    try{ recordingState.track.requestFrame(); }catch(_e){}
  }
  const elapsed=performance.now()-(recordingState.startedAt||0);
  const minRun=420;
  const wait=Math.max(180,minRun-elapsed,performance.now()-(recordingState.lastFrameAt||0)<80?120:0);
  setTimeout(()=>{
    renderRecordingFrame();
    if(recordingState.track && typeof recordingState.track.requestFrame==='function'){
      try{ recordingState.track.requestFrame(); }catch(_e){}
    }
    try{ if(rec.state!=='inactive'&&typeof rec.requestData==='function') rec.requestData(); }catch(_e){}
    setTimeout(()=>{ try{ if(rec.state!=='inactive') rec.stop(); }catch(_e){}; },160);
  },wait);
}
/**
 * [REGISTRO-DOC-EXPORT:008:downloadLastRecording]
 * Guarda o descarga el último Blob WebM consolidado.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: silent=false.
 * Retorno: boolean.
 */
function downloadLastRecording(silent=false){
  if(!recordingState.blob){ if(!silent) addLog('No hay una grabación disponible todavía','r'); return false; }
  const filename=`hBN_transicion_${Date.now()}.webm`;
  if(typeof saveFile==='function'){
    saveFile(filename,recordingState.blob,'video/webm'); // saveFile ya registra el log de confirmación
    return true;
  }
  const a=document.createElement('a');
  a.download=filename;
  a.href=URL.createObjectURL(recordingState.blob);
  a.click();
  if(!silent) addLog('Video exportado ✓','g');
  return true;
}
/**
 * [REGISTRO-DOC-EXPORT:009:exportLastRecordingFromDialog]
 * Exporta el último video desde el diálogo y actualiza el estado visual del botón.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: btn.
 * Retorno: void.
 */
function exportLastRecordingFromDialog(btn){
  if(downloadLastRecording()) updateDlgBtn(btn,'✓ Video exportado');
}
/**
 * [REGISTRO-DOC-EXPORT:010:drawRecordingChart]
 * Dibuja una minigráfica temporal dentro del canvas de grabación.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: c,data,label,color,x0,y0,w,h.
 * Retorno: void.
 */
function drawRecordingChart(c,data,label,color,x0,y0,w,h){
  c.fillStyle='#ffffff'; c.fillRect(x0,y0,w,h);
  c.strokeStyle='#e2e8f0'; c.lineWidth=1; c.strokeRect(x0,y0,w,h);
  c.fillStyle='#334155'; c.font='bold 18px sans-serif'; c.textAlign='left'; c.fillText(label,x0+14,y0+24);
  if(!data||data.length<2) return;
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1;
  const pl=46, pr=12, pt=36, pb=22, pw=w-pl-pr, ph=h-pt-pb;
  c.strokeStyle='rgba(226,232,240,0.9)'; c.lineWidth=1;
  for(let g=0;g<=3;g++){
    const yy=y0+pt+ph*g/3;
    c.beginPath(); c.moveTo(x0+pl,yy); c.lineTo(x0+pl+pw,yy); c.stroke();
  }
  c.beginPath();
  data.forEach((v,i)=>{
    const px=x0+pl+pw*i/Math.max(1,data.length-1);
    const py=y0+pt+ph*(1-(v-mn)/rng);
    i===0?c.moveTo(px,py):c.lineTo(px,py);
  });
  c.strokeStyle=color; c.lineWidth=3; c.stroke();
  const lv=data[data.length-1];
  c.fillStyle=color; c.font='bold 18px sans-serif'; c.textAlign='right';
  c.fillText((Math.abs(lv)>9999?lv.toFixed(0):lv.toFixed(2)),x0+w-12,y0+24);
}
/**
 * [REGISTRO-DOC-EXPORT:011:renderRecordingFrame]
 * Compone un frame 1280×720 con estructura, estado MC y cuatro gráficas de seguimiento.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function renderRecordingFrame(){
  if(!recordingState.active||!recordingState.ctx||!recordingState.canvas) return;
  const c=recordingState.ctx, W=recordingState.canvas.width, H=recordingState.canvas.height;
  c.fillStyle='#f8fafc'; c.fillRect(0,0,W,H);
  c.fillStyle='#0f172a'; c.font='bold 28px sans-serif'; c.textAlign='left';
  c.fillText('h-BN Monte Carlo · transición estructural',24,34);
  c.fillStyle='#64748b'; c.font='16px sans-serif';
  const pore=classifyPore();
  c.fillText(`paso ${step.toLocaleString()} / ${total.toLocaleString()} · T=${T.toFixed(0)} K · E=${E.toFixed(1)} eV${pore?' · '+pore.label:''}`,24,58);

  const left={x:24,y:78,w:760,h:618};
  c.fillStyle='#ffffff'; c.fillRect(left.x,left.y,left.w,left.h);
  c.strokeStyle='#cbd5e1'; c.lineWidth=1.5; c.strokeRect(left.x,left.y,left.w,left.h);
  if(cv&&cv.width&&cv.height){
    const s=Math.min(left.w/cv.width,left.h/cv.height);
    const dw=cv.width*s, dh=cv.height*s;
    c.drawImage(cv,left.x+(left.w-dw)/2,left.y+(left.h-dh)/2,dw,dh);
  }
  const infoX=808, chartW=448, chartH=140, gap=12;
  drawRecordingChart(c,hE,'Energía total (eV)','#7c3aed',infoX,78,chartW,chartH);
  drawRecordingChart(c,hT,'Temperatura (K)','#b45309',infoX,78+(chartH+gap),chartW,chartH);
  drawRecordingChart(c,hA,'Aceptación (%)','#16a34a',infoX,78+2*(chartH+gap),chartW,chartH);
  drawRecordingChart(c,hBN,'Ligaciones N–B','#2563eb',infoX,78+3*(chartH+gap),chartW,chartH);
  c.fillStyle='#475569'; c.font='16px sans-serif'; c.textAlign='left';
  c.fillText(`aceptados=${accepted} · rechazados=${rejected} · reservorio H=${H_RESERVOIR} · Δμ_H=${muH.toFixed(2)} eV`,infoX,H-18);
}
/**
 * [REGISTRO-DOC-EXPORT:012:saveInitialConfig]
 * Copia la configuración G actual como referencia de configuración inicial.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function saveInitialConfig(){
  G_initial=new Uint8Array(G);
  // Guardar dimensiones para restaurar correctamente
  G_initial._Nx=Nx; G_initial._Ny=Ny;
}

/**
 * [REGISTRO-DOC-EXPORT:013:exportInitialPNG]
 * Exporta temporalmente la configuración inicial guardada como PNG sin alterar el estado final.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function exportInitialPNG(){
  if(!G_initial||!ready){addLog('No hay configuración inicial guardada','r');return;}
  // Usar G_initial que puede ser de tamaño diferente si Nx/Ny cambió
  if(G_initial.length===G.length){
    const Gsave=new Uint8Array(G);
    G.set(G_initial);
    draw();
    exportCanvasPNG('inicial');
    G.set(Gsave);
    draw();
    addLog('Imagen inicial exportada ✓','g');
  } else {
    addLog('Tamaño de red cambió — imagen inicial no disponible','r');
  }
}

/**
 * [REGISTRO-DOC-EXPORT:014:exportFinalPNG]
 * Redibuja y exporta la configuración actual/final como PNG.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function exportFinalPNG(){
  draw();
  exportCanvasPNG('final');
  addLog('Imagen final exportada ✓','g');
}


// Captura técnica: estructura + metadatos + conteo de enlaces.
// No requiere haber corrido la simulación MC; recalcula la energía de la
// configuración actual y exporta una ficha similar al informe, sin gráficas.
/**
 * [REGISTRO-DOC-EXPORT:015:exportCurrentStructurePNG]
 * Genera una lámina PNG técnica de la estructura actual con metadatos y conteos.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: Promise<void>.
 */
async function exportCurrentStructurePNG(){
  if(!ready||!cv){
    addLog('No hay una estructura lista para capturar','r');
    return false;
  }
  const btn=document.getElementById('btnCaptureStructure');
  const origBtnText=btn?(btn.getAttribute('data-orig')||btn.textContent):'';
  if(btn){
    if(!btn.getAttribute('data-orig')) btn.setAttribute('data-orig',btn.textContent);
    btn.disabled=true;
    btn.textContent='⏳ Capturando...';
  }
  try{
    // Recalcular el estado energético para que la captura sea válida incluso
    // antes de presionar INICIAR.
    const currentE=typeof calcFullE==='function'?calcFullE():E;
    if(Number.isFinite(currentE)) E=currentE;
    draw();

    // Alto del lienzo según la columna derecha (cuatro paneles cuyo alto depende
    // del número de filas) para que ningún panel invada el pie de página.
    // Mantener en sincronía con drawTable/drawKeyValuePanel y sus filas.
    const RIGHT_Y0=140, GAP=14;
    const tableH=(nRows,rowH)=>36+(nRows+1)*rowH+6;
    const kvH=(nRows,rowH)=>34+nRows*rowH+6;
    const RIGHT_BOTTOM=RIGHT_Y0+tableH(10,23)+GAP+kvH(6,24)+GAP+kvH(7,24)+GAP+kvH(8,23);
    const W=1320, H=Math.max(960,RIGHT_BOTTOM+60), R=2;
    const tmp=document.createElement('canvas');
    tmp.width=W*R; tmp.height=H*R;
    const c=tmp.getContext('2d');
    c.setTransform(R,0,0,R,0,0);

    const BG='#ffffff', BG2='#f8fafc', BG3='#f1f5f9';
    const BORDER='#e2e8f0', BORDER2='#cbd5e1';
    const TEXT='#0f172a', TEXT2='#475569', TEXT3='#94a3b8';
    const ACCENT='#2563eb';

    /**
     * [REGISTRO-DOC-EXPORT:016:rect]
     * Dibuja un rectángulo/panel auxiliar en el canvas de exportación.
     * Alcance: auxiliar local.
     * Parámetros: x,y,w,h,fill,stroke,r=0.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function rect(x,y,w,h,fill,stroke,r=0){
      c.beginPath();
      if(r>0){
        c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
        c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
        c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);
        c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);
        c.closePath();
      }else c.rect(x,y,w,h);
      if(fill){c.fillStyle=fill;c.fill();}
      if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
    }
    /**
     * [REGISTRO-DOC-EXPORT:017:label]
     * Dibuja texto con opciones de estilo en el canvas de exportación.
     * Alcance: auxiliar local.
     * Parámetros: txt,x,y,opts={}.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function label(txt,x,y,opts={}){
      c.fillStyle=opts.color||TEXT2;
      c.font=(opts.weight||'normal')+' '+(opts.size||11)+'px sans-serif';
      c.textAlign=opts.align||'left';
      c.textBaseline=opts.base||'alphabetic';
      c.fillText(String(txt),x,y);
    }
    /**
     * [REGISTRO-DOC-EXPORT:018:line]
     * Dibuja un segmento de línea auxiliar.
     * Alcance: auxiliar local.
     * Parámetros: x1,y1,x2,y2,color=BORDER,w=1.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function line(x1,y1,x2,y2,color=BORDER,w=1){
      c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);
      c.strokeStyle=color;c.lineWidth=w;c.stroke();
    }
    /**
     * [REGISTRO-DOC-EXPORT:019:chip]
     * Dibuja una etiqueta tipo chip/badge.
     * Alcance: auxiliar local.
     * Parámetros: txt,x,y,bg,fg.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function chip(txt,x,y,bg,fg){
      c.font='bold 12px sans-serif';
      const cw=c.measureText(txt).width+18;
      rect(x,y-16,cw,24,bg,null,7);
      label(txt,x+9,y,{size:12,weight:'bold',color:fg});
      return cw+8;
    }
    /**
     * [REGISTRO-DOC-EXPORT:020:fmt]
     * Formatea un valor numérico para presentación o serialización.
     * Alcance: auxiliar local.
     * Parámetros: v,d=2.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function fmt(v,d=2){
      return Number.isFinite(+v)?(+v).toFixed(d):'—';
    }
    /**
     * [REGISTRO-DOC-EXPORT:021:pct]
     * Calcula un porcentaje seguro entre dos cantidades.
     * Alcance: auxiliar local.
     * Parámetros: a,b.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function pct(a,b){
      return b?((a/b)*100).toFixed(1)+'%':'0.0%';
    }

    // Render limpio de la estructura completa, independiente del zoom/pan del
    // visor. No dibuja cascos, etiquetas ni resaltados de poro.
    /**
     * [REGISTRO-DOC-EXPORT:022:renderCleanStructure]
     * Renderiza una representación limpia de una configuración estructural.
     * Alcance: auxiliar local.
     * Parámetros: Gdata,nxG,nyG,w,h,ss=2.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function renderCleanStructure(Gdata,nxG,nyG,w,h,ss=2){
      const off=document.createElement('canvas'); off.width=w*ss; off.height=h*ss;
      const oc=off.getContext('2d');
      oc.setTransform(ss,0,0,ss,0,0);
      oc.fillStyle='#ffffff'; oc.fillRect(0,0,w,h);
      const D_=1.44,LX_=D_/2,LY_=D_*Math.sqrt(3)/2,DX_=2*LX_+2*D_,DY_=2*LY_;
      const hasCustomPos=typeof usingCustomConstructorGeometry==='function'
        && usingCustomConstructorGeometry()
        && Array.isArray(CUSTOM_POSITIONS) && CUSTOM_POSITIONS.length===nxG*nyG
        && CUSTOM_POSITIONS.some(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
      let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9;
      const positions=[];
      for(let i=0;i<nyG;i++) for(let j=0;j<nxG;j++){
        const k=i*nxG+j;
        let px,py;
        const cp=hasCustomPos?CUSTOM_POSITIONS[k]:null;
        if(cp&&Number.isFinite(cp.x)&&Number.isFinite(cp.y)){px=cp.x;py=cp.y;}
        else{
          const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
          const xx=cc*DX_+(sr===0?(sc===0?LX_:LX_+D_):(sc===0?0:2*LX_+D_));
          const yy=cr*DY_+(sr===0?LY_:0);
          if(latticeOrient==='ZZ'){px=yy;py=xx;}else{px=xx;py=yy;}
        }
        positions[k]=[px,py];
        if(px<mnX)mnX=px;if(px>mxX)mxX=px;if(py<mnY)mnY=py;if(py>mxY)mxY=py;
      }
      const pad=22;
      const sc=Math.min((w-2*pad)/(mxX-mnX||1),(h-2*pad)/(mxY-mnY||1));
      const ox=(w-(mxX-mnX)*sc)/2, oy=(h-(mxY-mnY)*sc)/2;
      const rBase=Math.max(2,Math.min(sc*D_*0.38,15));
      const MAX_B=sc*D_*1.35;
      const BOND_COL={'01':'rgba(37,99,235,0.25)','02':'rgba(22,163,74,0.25)',
        '03':'rgba(71,85,105,0.22)','12':'rgba(22,163,74,0.55)',
        '13':'rgba(71,85,105,0.44)','23':'rgba(71,85,105,0.38)',
        '11':'rgba(37,99,235,0.18)','22':'rgba(21,128,61,0.18)','33':'rgba(51,65,85,0.22)',
        '00':'rgba(148,163,184,0.22)'};
      const ATOM_COL=['#e2e8f0','#2563eb','#16a34a','#475569'];
      const ATOM_B=['#94a3b8','#1d4ed8','#15803d','#334155'];
      /**
       * [REGISTRO-DOC-EXPORT:023:getN]
       * Obtiene/deriva información de vecindad para el render técnico.
       * Alcance: auxiliar local.
       * Parámetros: k.
       * Retorno: valor auxiliar o void según el contexto.
       */
      function getN(k){return PNB&&PNB[k]?PNB[k]:[];}
      for(let i=0;i<nyG;i++) for(let j=0;j<nxG;j++){
        const k=i*nxG+j, t1=Gdata[k];
        const [px1,py1]=positions[k];
        const sx1=ox+(px1-mnX)*sc, sy1=oy+(py1-mnY)*sc;
        for(const [ni,nj] of getN(k)){
          const nk=ni*nxG+nj; if(nk<=k) continue;
          const t2=Gdata[nk];
          const [px2,py2]=positions[nk];
          const sx2=ox+(px2-mnX)*sc, sy2=oy+(py2-mnY)*sc;
          if(Math.hypot(sx2-sx1,sy2-sy1)>MAX_B) continue;
          const key=[Math.min(t1,t2),Math.max(t1,t2)].join('');
          oc.beginPath();oc.moveTo(sx1,sy1);oc.lineTo(sx2,sy2);
          oc.strokeStyle=BOND_COL[key]||'rgba(148,163,184,0.28)';
          oc.lineWidth=Math.max(0.45,rBase*0.38);oc.stroke();
        }
      }
      for(let i=0;i<nyG;i++) for(let j=0;j<nxG;j++){
        const k=i*nxG+j, t=Gdata[k];
        const [px,py]=positions[k];
        const sx=ox+(px-mnX)*sc, sy=oy+(py-mnY)*sc;
        const atomScale=(t===1||t===2)?0.74:(t===3?0.82:0.56);
        const rAtom=rBase*atomScale;
        oc.beginPath();oc.arc(sx,sy,rAtom,0,Math.PI*2);
        if(t===0){oc.strokeStyle='rgba(148,163,184,0.7)';oc.lineWidth=0.75;oc.stroke();}
        else{oc.fillStyle=ATOM_COL[t]||'#94a3b8';oc.fill();oc.strokeStyle=ATOM_B[t]||'#64748b';oc.lineWidth=0.5;oc.stroke();}
      }
      return off;
    }

    c.fillStyle=BG; c.fillRect(0,0,W,H);
    rect(0,0,W,7,ACCENT);

    const now=new Date();
    const dateStr=now.toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'});
    const timeStr=now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
    const isCustomGeo=typeof usingCustomConstructorGeometry==='function'&&usingCustomConstructorGeometry();
    const opcEl=document.getElementById('iPore');
    const opcLabel=opcEl?(opcEl.options[opcEl.selectedIndex]?.text||`Tipo ${opcEl.value}`):'Configuración actual';
    const geoLbl=isCustomGeo?`Constructor/importada · ${Nx*Ny} sitios`:`Red ${Nx}×${Ny}`;
    const pbcLabel=(pbcX&&pbcY)?'Periódico X+Y':(pbcX?'Periódico solo X':(pbcY?'Periódico solo Y':'Bordes abiertos'));
    const simState=step>0?`${step.toLocaleString()} pasos MC`:'pre-ejecución · simulación no corrida';
    const bc=typeof countBonds==='function'?countBonds():{cNN:0,cNB:0,cBB:0,cXN:0,cXB:0,cXX:0,cCC:0,cCN:0,cCB:0,cXC:0};
    const counts=typeof getSpeciesCounts==='function'?getSpeciesCounts():{nN:0,nB:0,nC:0,nV:0,nAtoms:0,nSites:Nx*Ny};
    const hp=typeof calcHOverlapPenalty==='function'?calcHOverlapPenalty(G):null;
    const hH=typeof calcHydrogenOverlapEnergy==='function'?calcHydrogenOverlapEnergy(G):0;
    const edgeH=typeof calcOpenEdgePassivationEnergy==='function'?calcOpenEdgePassivationEnergy(G):0;
    const formv=typeof calcFormationEnergyDFTLike==='function'?calcFormationEnergyDFTLike(G):null;
    const accRate=(accepted/(accepted+rejected||1)*100);

    label(`Captura técnica de estructura — ${HBN_APP_NAME} v${HBN_VERSION}`,22,38,{size:22,weight:'bold',color:TEXT});
    label(`${opcLabel}  ·  ${geoLbl}  ·  ${pbcLabel}  ·  ${simState}`,22,64,{size:13,color:TEXT2});
    label(`${dateStr}  ${timeStr}`,W-22,38,{size:11,color:TEXT3,align:'right'});

    let cx=22;
    cx+=chip(`E = ${fmt(E,3)} eV`,cx,95,'#eff6ff','#1d4ed8');
    cx+=chip(`N–B = ${bc.cNB}`,cx,95,'#f0fdf4','#166534');
    cx+=chip(`Átomos = ${counts.nAtoms}`,cx,95,'#f8fafc','#334155');
    cx+=chip(`Vacancias = ${counts.nV}`,cx,95,'#f1f5f9','#475569');
    if(formv) cx+=chip(`Eform = ${fmt(formv.Eform,3)} eV`,cx,95,'#eef2ff','#4338ca');
    if(step>0) cx+=chip(`Accept = ${fmt(accRate,1)}%`,cx,95,'#ecfdf5','#047857');

    line(0,118,W,118,BORDER2,1);

    const leftX=20,leftY=RIGHT_Y0,leftW=760,leftH=Math.max(760,RIGHT_BOTTOM-RIGHT_Y0);
    rect(leftX,leftY,leftW,leftH,BG2,BORDER,10);
    label('Estructura actual',leftX+16,leftY+24,{size:15,weight:'bold',color:TEXT});
    label('vista limpia: sin resaltado gráfico de poros',leftX+leftW-16,leftY+24,{size:10,color:TEXT3,align:'right'});
    if(G&&G.length===Nx*Ny){
      const img=renderCleanStructure(G,Nx,Ny,leftW-28,leftH-78,2);
      c.drawImage(img,0,0,img.width,img.height,leftX+14,leftY+40,leftW-28,leftH-78);
    }else{
      label('(estructura no disponible)',leftX+leftW/2,leftY+leftH/2,{size:12,color:TEXT3,align:'center'});
    }
    // Leyenda
    const atoms=[{c:'#2563eb',l:'N'},{c:'#16a34a',l:'B'},{c:'#475569',l:'C'},{c:'#e2e8f0',l:'Vacancia'}];
    let lx=leftX+22, ly=leftY+leftH-20;
    atoms.forEach(a=>{
      c.beginPath();c.arc(lx+6,ly-4,5,0,Math.PI*2);c.fillStyle=a.c;c.fill();c.strokeStyle='#94a3b8';c.lineWidth=0.5;c.stroke();
      label(a.l,lx+16,ly,{size:10,color:TEXT2});
      lx+=c.measureText(a.l).width+54;
    });

    const rightX=800, rightW=W-rightX-20;
    /**
     * [REGISTRO-DOC-EXPORT:024:drawKeyValuePanel]
     * Dibuja un panel de pares clave/valor.
     * Alcance: auxiliar local.
     * Parámetros: title,rows,x,y,w,rowH=26.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function drawKeyValuePanel(title,rows,x,y,w,rowH=26){
      const h=34+rows.length*rowH+6; // +6: margen inferior para no tapar el borde
      rect(x,y,w,h,BG2,BORDER,8);
      label(title,x+14,y+22,{size:14,weight:'bold',color:TEXT});
      let yy=y+34;
      rows.forEach((r,i)=>{
        rect(x+1,yy,w-2,rowH,i%2?BG2:BG,null);
        label(r[0],x+14,yy+17,{size:11.5,color:TEXT2});
        label(r[1],x+w-14,yy+17,{size:11.5,weight:'bold',color:TEXT,align:'right'});
        yy+=rowH;
      });
      return h;
    }
    /**
     * [REGISTRO-DOC-EXPORT:025:drawTable]
     * Dibuja una tabla dentro del reporte gráfico.
     * Alcance: auxiliar local.
     * Parámetros: title,headers,rows,x,y,w,rowH=24.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function drawTable(title,headers,rows,x,y,w,rowH=24){
      const h=36+(rows.length+1)*rowH+6; // +6: margen inferior para no tapar el borde
      rect(x,y,w,h,BG2,BORDER,8);
      label(title,x+14,y+22,{size:14,weight:'bold',color:TEXT});
      const cols=headers.length;
      const cw=w/cols;
      let yy=y+36;
      rect(x+1,yy,w-2,rowH,BG3,null);
      headers.forEach((hd,i)=>label(hd,x+i*cw+cw/2,yy+16,{size:10.5,weight:'bold',color:TEXT2,align:'center'}));
      yy+=rowH;
      rows.forEach((row,ri)=>{
        rect(x+1,yy,w-2,rowH,ri%2?BG2:BG,null);
        row.forEach((cell,i)=>{
          label(cell,x+i*cw+cw/2,yy+16,{size:10.7,color:i===0?TEXT:TEXT2,weight:i===0?'bold':'normal',align:'center'});
        });
        yy+=rowH;
      });
      return h;
    }

    const bondRows=[
      ['N–B',String(bc.cNB),fmt(EPS_NB,2),fmt(bc.cNB*EPS_NB,1)],
      ['N–N',String(bc.cNN),fmt(EPS_NN,2),fmt(bc.cNN*EPS_NN,1)],
      ['B–B',String(bc.cBB),fmt(EPS_BB,2),fmt(bc.cBB*EPS_BB,1)],
      ['X/H–N',String(bc.cXN),fmt(epsEff(V_T,N_T),2),fmt(bc.cXN*epsEff(V_T,N_T),1)],
      ['X/H–B',String(bc.cXB),fmt(epsEff(V_T,B_T),2),fmt(bc.cXB*epsEff(V_T,B_T),1)],
      ['X–X',String(bc.cXX),fmt(epsVacVac(),2),fmt(bc.cXX*epsVacVac(),1)],
      ['C–C',String(bc.cCC),fmt(EPS_CC,2),fmt(bc.cCC*EPS_CC,1)],
      ['C–N',String(bc.cCN),fmt(EPS_CN,2),fmt(bc.cCN*EPS_CN,1)],
      ['C–B',String(bc.cCB),fmt(EPS_CB,2),fmt(bc.cCB*EPS_CB,1)],
      ['X/H–C',String(bc.cXC),fmt(epsEff(V_T,C_T),2),fmt(bc.cXC*epsEff(V_T,C_T),1)]
    ];
    const bondE=bondRows.reduce((acc,r)=>acc+(parseFloat(r[3])||0),0);
    let y=140;
    y+=drawTable('Conteo de enlaces por tipo',['Tipo','Cant.','ε (eV)','Contrib.'],bondRows,rightX,y,rightW,23)+14;

    const compRows=[
      ['N',`${counts.nN}  (${pct(counts.nN,counts.nSites)})`],
      ['B',`${counts.nB}  (${pct(counts.nB,counts.nSites)})`],
      ['C',`${counts.nC}  (${pct(counts.nC,counts.nSites)})`],
      ['Vacancias',`${counts.nV}  (${pct(counts.nV,counts.nSites)})`],
      ['Total sitios',String(counts.nSites)],
      ['H pasivación',formv?String(formv.nH):(typeof getPassivationHCount==='function'?String(getPassivationHCount(G)):'—')]
    ];
    y+=drawKeyValuePanel('Composición atómica',compRows,rightX,y,rightW,24)+14;

    const energyRows=[
      ['E total actual',`${fmt(E,4)} eV`],
      ['Suma enlaces + pasivación',`${fmt(bondE,3)} eV`],
      ['Pasivación borde abierto',`${fmt(edgeH,3)} eV`],
      ['Penalización H–H',`${fmt(hH,3)} eV`],
      ['Pares H–H',hp?String(hp.nOverlap):'0'],
      ['E formación',formv?`${fmt(formv.Eform,4)} eV`:'—'],
      ['E formación / H de borde',formv&&formv.perH!==null?`${fmt(formv.perH,5)} eV`:'—']
    ];
    y+=drawKeyValuePanel('Energía y correcciones',energyRows,rightX,y,rightW,24)+14;

    const paramRows=[
      ['Temperatura',`Ti=${Ti} K · Tf=${Tf} K · T=${fmt(T,0)} K`],
      ['MC',`${simState}${step>0?' · aceptación '+fmt(accRate,1)+'%':''}`],
      ['Modo térmico',String(tMode||'—')],
      ['Reservorio H / Δμ_H',`${H_RESERVOIR} · ${fmt(muH,3)} eV`],
      ['Orientación / subred',`${latticeOrient||'—'} · ${latticeStart||'—'}`],
      ['Intercambio global',`${globalSwapPct}%`],
      ['Semilla RNG',(typeof getRandomSeed==='function'&&getRandomSeed()!==null)?String(getRandomSeed()):'aleatoria'],
      ['H-H modo / K',`${H_OVERLAP_MODE||'—'} · ${fmt(H_OVERLAP_K,2)} eV`]
    ];
    y+=drawKeyValuePanel('Parámetros de generación y modelo',paramRows,rightX,y,rightW,23);

    line(20,H-40,W-20,H-40,BORDER2,1);
    label('La captura se calcula sobre la estructura actual; no requiere historial MC ni gráficas. X/H indica enlaces con vacancia o hidrógeno de pasivación en bordes abiertos.',22,H-16,{size:10.5,color:TEXT3});
    label(`${HBN_APP_NAME} v${HBN_VERSION}`,W-22,H-16,{size:10.5,color:TEXT3,align:'right'});

    const fname=`hBN_captura_estructura_datos_${Nx}x${Ny}_${Date.now()}.png`;
    let saved=true;
    if(typeof saveFile==='function' && tmp.toBlob){
      const blob=await new Promise(resolve=>tmp.toBlob(resolve,'image/png',1.0));
      if(blob) saved=await saveFile(fname,blob,'image/png');
    }else{
      const a=document.createElement('a');
      a.download=fname;
      a.href=tmp.toDataURL('image/png',1.0);
      a.click();
      addLog(`Captura técnica exportada ✓ — ${fname}`,'g');
    }
    if(saved===false){
      if(btn){btn.disabled=false;btn.textContent=origBtnText||'📸 Captura';}
      return false;
    }
    addLog(`Captura técnica exportada ✓ — estructura + enlaces + energía (${W*R}×${H*R}px)`,'g');
    if(btn){
      btn.textContent='✓ Captura guardada';
      btn.style.background='#f0fdf4';btn.style.color='#16a34a';btn.style.borderColor='#86efac';
      setTimeout(()=>{
        btn.disabled=false;btn.textContent=origBtnText||'📸 Captura';
        btn.style.background='';btn.style.color='';btn.style.borderColor='';
      },1600);
    }
    return true;
  }catch(err){
    console.error('exportCurrentStructurePNG falló:',err);
    if(typeof addLog==='function') addLog('No se pudo generar la captura técnica: '+(err&&err.message?err.message:err),'r');
    if(btn){btn.disabled=false;btn.textContent=origBtnText||'📸 Captura';}
    return false;
  }
}

// Genera gráficas como PNG usando un canvas temporal
/**
 * [REGISTRO-DOC-EXPORT:026:exportChartsPNG]
 * Genera una imagen PNG con las series históricas de energía, temperatura, aceptación y enlaces N–B.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function exportChartsPNG(){
  if(hE.length<2){addLog("Ejecuta la simulación primero","r");return;}
  const W=800, H=520, pad=50, gap=20;
  const tmp=document.createElement('canvas');
  tmp.width=W*SCALE_R; tmp.height=H*SCALE_R;
  const c=tmp.getContext('2d');
  c.setTransform(SCALE_R,0,0,SCALE_R,0,0);
  c.fillStyle='#ffffff'; c.fillRect(0,0,W,H);

  // Título
  c.fillStyle='#1e293b';
  c.font='bold 14px sans-serif';
  c.textAlign='center';
  const opc=+document.getElementById('iPore').value;
  const opcL={1:'Red perfecta',2:'Real+vac',3:'Aleatoria',6:'Paralelogramo',
    7:'Triangular',8:'Aleatorio',10:'Tri-N',11:'Tri-B',12:'Para-N',
    13:'Para-B',14:'Hexágono',20:'h-BNC'}[opc]||opc;
  c.fillText(`h-BN Monte Carlo · ${Nx}×${Ny} · ${opcL} · Ti=${Ti}K → Tf=${Tf}K · ${step.toLocaleString()} pasos`,W/2,20);

  /**
   * [REGISTRO-DOC-EXPORT:027:drawSubchart]
   * Dibuja una subgráfica de una serie histórica.
   * Alcance: auxiliar local.
   * Parámetros: data,label,color,x0,y0,w,h.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function drawSubchart(data,label,color,x0,y0,w,h){
    if(data.length<2) return;
    const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
    const pt=30,pb=24,pl=54,pr=10,pw=w-pl-pr,ph=h-pt-pb;
    // Fondo
    c.fillStyle='#f8fafc'; c.fillRect(x0,y0,w,h);
    c.strokeStyle='#e2e8f0'; c.lineWidth=1;
    c.strokeRect(x0,y0,w,h);
    // Grid y etiquetas
    c.strokeStyle='rgba(203,213,225,0.8)'; c.lineWidth=0.7;
    c.fillStyle='#64748b'; c.font='10px sans-serif'; c.textAlign='right';
    [0,.25,.5,.75,1].forEach(f=>{
      const yy=y0+pt+ph*(1-f);
      c.beginPath();c.moveTo(x0+pl,yy);c.lineTo(x0+pl+pw,yy);c.stroke();
      const val=mn+rng*f;
      c.fillText(Math.abs(val)>9999?val.toFixed(0):val.toFixed(1),x0+pl-3,yy+3);
    });
    // Título del panel
    c.fillStyle='#475569'; c.font='bold 11px sans-serif'; c.textAlign='center';
    c.fillText(label,x0+w/2,y0+15);
    // Área
    c.beginPath();
    data.forEach((v,i)=>{
      const px=x0+pl+pw*i/(data.length-1);
      const py=y0+pt+ph*(1-(v-mn)/rng);
      i===0?c.moveTo(px,py):c.lineTo(px,py);
    });
    c.lineTo(x0+pl+pw,y0+pt+ph);
    c.lineTo(x0+pl,y0+pt+ph);
    c.closePath();
    c.fillStyle=color+'22'; c.fill();
    // Línea
    c.beginPath();
    data.forEach((v,i)=>{
      const px=x0+pl+pw*i/(data.length-1);
      const py=y0+pt+ph*(1-(v-mn)/rng);
      i===0?c.moveTo(px,py):c.lineTo(px,py);
    });
    c.strokeStyle=color; c.lineWidth=1.8; c.stroke();
    // Valor final
    c.fillStyle=color; c.font='bold 10px sans-serif'; c.textAlign='right';
    const lv=data[data.length-1];
    c.fillText(Math.abs(lv)>9999?lv.toFixed(0):lv.toFixed(2),x0+pl+pw-2,y0+pt+8);
    // Eje X
    c.fillStyle='#94a3b8'; c.font='9px sans-serif'; c.textAlign='center';
    c.fillText('0',x0+pl,y0+pt+ph+14);
    c.fillText(step.toLocaleString(),x0+pl+pw,y0+pt+ph+14);
    c.fillText('pasos MC',x0+pl+pw/2,y0+h-4);
  }

  const cw=(W-pad*2-gap)/2, ch=(H-60-gap)/2;
  drawSubchart(hE,'Energía total (eV)','#7c3aed', pad,       40,       cw,ch);
  drawSubchart(hT,'Temperatura (K)',   '#b45309', pad+cw+gap,40,       cw,ch);
  drawSubchart(hA,'Tasa aceptación (%)', '#16a34a',pad,       40+ch+gap,cw,ch);
  drawSubchart(hBN,'Ligaciones N–B',   '#2563eb', pad+cw+gap,40+ch+gap,cw,ch);

  // Metadatos al pie
  c.fillStyle='#94a3b8'; c.font='9px sans-serif'; c.textAlign='left';
  const bc=countBonds();
  const pore=classifyPore();
  c.fillText(`cNB=${bc.cNB} cNN=${bc.cNN} cBB=${bc.cBB} · ε_BN=${EPS_NB} eV · kB=${KB} eV/K · Mg. M.A. Obando | Dpto. Física — Unicauca & UFOP`,pad,H-6);
  if(pore){c.textAlign='right';c.fillText(`Geometría: ${pore.label}`,W-pad,H-6);}

  const gfilename=`hBN_graficas_${Date.now()}.png`;
  if(typeof saveFile==='function' && tmp.toBlob){
    tmp.toBlob(blob=>{ if(blob) saveFile(gfilename,blob,'image/png'); },'image/png');
  } else {
    const a=document.createElement('a');
    a.download=gfilename;
    a.href=tmp.toDataURL('image/png');
    a.click();
    addLog('Gráficas exportadas ✓','g');
  }
}

// Exporta datos crudos como CSV
/**
 * [REGISTRO-DOC-EXPORT:028:exportCSV]
 * Exporta las series y metadatos de la simulación en CSV de texto.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function buildSimulationCSV(){
  const bc=countBonds();
  const pore=classifyPore();
  const formv=typeof calcFormationEnergyDFTLike==='function'?calcFormationEnergyDFTLike():null;
  const hp=typeof calcHOverlapPenalty==='function'?calcHOverlapPenalty(G):null;
  const opc=+document.getElementById('iPore').value;
  const f=(v,d)=>(v!==null&&v!==undefined&&Number.isFinite(v))?v.toFixed(d):'';
  const rows=[
    [`# ${HBN_APP_NAME} v${HBN_VERSION} — Mg. M.A. Obando, Dpto. Física, Universidad del Cauca & UFOP`],
    [`# Fecha: ${new Date().toISOString()}`],
    [`# Red: ${Nx}x${Ny}  opc=${opc}  orient=${latticeOrient}  PBC=${(pbcX&&pbcY)?'XY':pbcX?'X':pbcY?'Y':'none'}  modoT=${tMode}  Ti=${Ti}K  Tf=${Tf}K  pasos=${step}`],
    [`# E_final=${E.toFixed(4)}eV  T_final=${T.toFixed(1)}K  semilla=${(typeof getRandomSeed==='function'&&getRandomSeed()!==null)?getRandomSeed():'aleatoria'}`],
    [`# reservorio_H=${H_RESERVOIR}  delta_mu_H_MC=${muH.toFixed(4)}eV  hPass=${hPass?1:0}  global_pct=${globalSwapPct}`],
    formv?[`# Eform_total=${formv.Eform.toFixed(6)}eV  Eform_por_H=${f(formv.perH,6)}eV  E_fisica=${formv.Ephys.toFixed(6)}eV  Eref=${formv.Eref.toFixed(6)}eV`]:[],
    formv?[`# ambiente=${formv.env}  ref_mu_BN=${formv.muBNref}  muB=${formv.muB.toFixed(6)}  muN=${formv.muN.toFixed(6)}  muC=${formv.muC.toFixed(6)}  muH_form=${formv.muH.toFixed(6)}  nH=${formv.nH}`]:[],
    formv&&formv.deltaDFT!==null?[`# Delta_vs_DFT=${formv.deltaDFT.toFixed(6)}eV`]:[],
    hp?[`# H_H_mode=${hp.mode}  H_H_pairs=${hp.nOverlap}  E_HH=${hp.energy.toFixed(6)}eV  geom_pairs=${hp.geomPairs}  topo_pairs=${hp.topoPairs}`]:[],
    [`# cNB=${bc.cNB}  cNN=${bc.cNN}  cBB=${bc.cBB}  cXN=${bc.cXN}  cXB=${bc.cXB}  cXX=${bc.cXX}  cCC=${bc.cCC}  cCN=${bc.cCN}  cCB=${bc.cCB}  cXC=${bc.cXC}`],
    [`# aceptados=${accepted}  rechazados=${rejected}`],
    pore?[`# Geometria_poro: ${pore.label}`]:[],
    [`# --- Energias de ligacion (eV) · conjunto=${MODEL_PARAM_SET} ---`],
    [`# eps_NB=${EPS_NB}  eps_NN=${EPS_NN}  eps_BB=${EPS_BB}`],
    [`# eps_XN=${EPS_XN}  eps_XB=${EPS_XB}  eps_XC_CH=${EPS_XC}  eps_CH_AC=${EPS_CH_AC}  eps_CH_ZZ=${EPS_CH_ZZ}  eps_CH_disp=${EPS_CH_DISP}  eps_XX=${EPS_XX}`],
    [`# eps_CC=${EPS_CC}  eps_CN=${EPS_CN}  eps_CB=${EPS_CB}`],
    ['# --- Series temporales ---'],
    ['paso_MC,E_eV,T_K,accept_pct,cNB'],
    ...hE.map((e,i)=>[(hS[i]!==undefined?hS[i]:Math.round(i*step/Math.max(1,hE.length-1))),e.toFixed(4),
      hT[i]?.toFixed(1)||'',hA[i]?.toFixed(2)||'',hBN[i]??''].join(','))
  ];
  return rows.filter(r=>!(Array.isArray(r)&&r.length===0))
    .map(r=>Array.isArray(r)?r.join(''):r).join('\n');
}

/**
 * Exporta las series temporales y metadatos de la corrida actual en CSV.
 * @returns {void}
 */
function exportCSV(){
  const csvText=buildSimulationCSV();
  const csvName=`hBN_datos_${Date.now()}.csv`;
  if(typeof saveFile==='function'){
    saveFile(csvName,csvText,'text/csv');
  } else {
    const blob=new Blob([csvText],{type:'text/csv'});
    const a=document.createElement('a');
    a.download=csvName;
    a.href=URL.createObjectURL(blob);
    a.click();
    addLog('Datos CSV exportados ✓','g');
  }
}


// ── Exportar LAMMPS DATA (atomic style) ───────────────────────────────
// Formato compatible con LAMMPS/OVITO. Tipos: 1=B, 2=N, 3=C, 4=H.
// [FIX v13.9] Bounding box real (Å) de una geometría personalizada del
// Constructor hBN/C, usado para dimensionar correctamente la celda en las
// exportaciones LAMMPS/POSCAR/XV en vez de la fórmula genérica Nx*DXa/2 que
// no tiene sentido cuando Nx=1 (codificación interna del grafo explícito).
/**
 * [REGISTRO-DOC-EXPORT:029:customPositionBBox]
 * Calcula la caja envolvente de posiciones explícitas CUSTOM_POSITIONS válidas.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: object | null.
 */
function customPositionBBox(){
  if(typeof usingCustomConstructorGeometry!=='function' || !usingCustomConstructorGeometry()) return null;
  if(!Array.isArray(CUSTOM_POSITIONS)) return null;
  let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9;
  for(const p of CUSTOM_POSITIONS){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)) continue;
    if(p.x<mnX)mnX=p.x; if(p.x>mxX)mxX=p.x;
    if(p.y<mnY)mnY=p.y; if(p.y>mxY)mxY=p.y;
  }
  if(mnX>mxX||mnY>mxY) return null;
  return {mnX,mxX,mnY,mxY};
}
/**
 * [REGISTRO-DOC-EXPORT:030:collectAtomsCartesianForExport]
 * Recopila átomos N/B/C/H con coordenadas cartesianas para exportadores estructurales.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: Array<object>.
 */
function collectAtomsCartesianForExport(){
  if(!ready) return null;
  const d=1.44, LXa=d/2, LYa=d*Math.sqrt(3)/2, DXa=3*d, DYa=2*LYa;
  const VACUUM=20.0;
  const custom=customPositionBBox();
  const PAD=6.0; // Å de vacío alrededor del bounding box real, si no hay caja periódica exacta disponible
  const cellA=custom?(custom.mxX-custom.mnX+PAD):Nx*DXa/2;
  const cellB=custom?(custom.mxY-custom.mnY+PAD):Ny*DYa/2;
  const cellC=VACUUM;
  /**
   * [REGISTRO-DOC-EXPORT:031:posAt]
   * Calcula la posición exportable de un sitio según geometría regular o custom.
   * Alcance: auxiliar local.
   * Parámetros: i,j.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function posAt(i,j){
    if(custom){
      const p=CUSTOM_POSITIONS[idx(i,j)];
      if(p && Number.isFinite(p.x) && Number.isFinite(p.y)) return [p.x-custom.mnX+PAD/2, p.y-custom.mnY+PAD/2];
    }
    const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
    const xoffs=[[LXa,LXa+d],[0,2*LXa+d]];
    const x=cc*DXa+xoffs[sr][sc], y=cr*DYa+(sr===0?LYa:0);
    return latticeOrient==='ZZ'?[y,x]:[x,y];
  }
  const atoms=[];
  let id=1;
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j),t=G[k];
    if(t===V_T) continue;
    const[x,y]=posAt(i,j);
    const symbol=t===B_T?'B':t===N_T?'N':t===C_T?'C':'X';
    atoms.push({id:id++,symbol,x,y,z:cellC/2});
    if(hPass && !custom){
      // Los H de borde de geometrías personalizadas ya están en IMPORTED_H_SITES
      // (posiciones reales calculadas por el Constructor); rawNB()/mapRawNeighborIndex()
      // asumen la red honeycomb genérica y no aplican aquí.
      for(const[ri,rj]of rawNB(i,j)){
        const nk=mapRawNeighborIndex(ri,rj);
        if(nk!==null&&G[nk]!==V_T) continue;
        const[xn,yn]=posAt(ri,rj);
        const hfr=1.09/1.44;
        atoms.push({id:id++,symbol:'H',x:x+hfr*(xn-x),y:y+hfr*(yn-y),z:cellC/2});
      }
    }
  }
  if(hPass && custom && Array.isArray(IMPORTED_H_SITES)){
    for(const h of IMPORTED_H_SITES){
      if(!h||!Number.isFinite(h.x)||!Number.isFinite(h.y)) continue;
      const parent=h.parent??-1;
      if(parent>=0 && parent<G.length && G[parent]===V_T) continue;
      atoms.push({id:id++,symbol:'H',x:h.x-custom.mnX+PAD/2,y:h.y-custom.mnY+PAD/2,z:cellC/2});
    }
  }
  return {atoms,cell:{a:cellA,b:cellB,c:cellC}};
}
/**
 * [REGISTRO-DOC-EXPORT:032:buildLAMMPSDataLines]
 * Construye las líneas de un archivo LAMMPS DATA a partir de la geometría actual.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: Array<string> | null.
 */
function buildLAMMPSDataLines(){
  const data=collectAtomsCartesianForExport();
  if(!data) return null;
  const {atoms,cell}=data;
  const typeMap={B:1,N:2,C:3,H:4};
  const lines=[];
  lines.push(`# ${HBN_APP_NAME} v${HBN_VERSION} LAMMPS DATA · Nx=${Nx} Ny=${Ny} · E=${E.toFixed(6)} eV`);
  lines.push(`# Mg. Manuel Alejandro Obando · exportado ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`${atoms.length} atoms`);
  lines.push('4 atom types');
  lines.push('');
  lines.push(`0.000000 ${cell.a.toFixed(6)} xlo xhi`);
  lines.push(`0.000000 ${cell.b.toFixed(6)} ylo yhi`);
  lines.push(`0.000000 ${cell.c.toFixed(6)} zlo zhi`);
  lines.push('');
  lines.push('Masses');
  lines.push('');
  lines.push('1 10.811 # B');
  lines.push('2 14.007 # N');
  lines.push('3 12.011 # C');
  lines.push('4 1.008 # H');
  lines.push('');
  lines.push('Atoms # atomic');
  lines.push('');
  atoms.forEach(a=>{
    const typ=typeMap[a.symbol]||3;
    lines.push(`${a.id} ${typ} ${a.x.toFixed(8)} ${a.y.toFixed(8)} ${a.z.toFixed(8)} # ${a.symbol}`);
  });
  lines.push('');
  lines.push('# Nota: la app usa H como pasivación de borde. En LAMMPS se exporta como átomo explícito.');
  lines.push(`# KHH=${H_OVERLAP_K.toFixed(6)} eV  dmin=${H_OVERLAP_DMIN.toFixed(6)} Ang  modo=${H_OVERLAP_MODE}`);
  return lines;
}
/**
 * [REGISTRO-DOC-EXPORT:033:exportLAMMPSData]
 * Guarda la geometría actual en formato LAMMPS DATA.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function exportLAMMPSData(){
  const lines=buildLAMMPSDataLines();
  if(!lines){addLog('Genera una estructura primero','r');return;}
  const filename=`hBN_MC_v${HBN_VERSION.replace(/\./g,'_')}_${Nx}x${Ny}.lammps.data`;
  const text=lines.join('\n');
  if(typeof saveFile==='function'){
    addLog(`LAMMPS DATA listo (${lines.length} líneas) · guardando…`,'i');
    saveFile(filename,text,'text/plain'); // confirma con su propio log al terminar
    return;
  }
  const blob=new Blob([text],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  a.click(); URL.revokeObjectURL(url);
  addLog(`LAMMPS DATA exportado ✓ — ${lines.length} líneas`,'g');
}

// ── Exportar POSCAR (formato VASP) ────────────────────────────────────
/**
 * [REGISTRO-DOC-EXPORT:034:exportPOSCAR]
 * Guarda la geometría actual como archivo POSCAR/VASP.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function exportPOSCAR(){
  const lines=buildPOSCARLines();
  if(!lines){addLog('Genera una estructura primero','r');return;}
  const opc=+document.getElementById('iPore')?.value||1;
  const opcLabel={1:'hBN_perfect',10:'Tri-N',11:'Tri-B',14:'Hexagon',20:'h-BNC',30:'C-ribbon',43:'Graphene'}[opc]||`opc${opc}`;
  const filename=`hBN_MC_v10_${opcLabel.replace(/\s/g,'_')}.vasp`;
  const text=lines.join('\n');
  if(typeof saveFile==='function'){
    saveFile(filename,text,'text/plain');
    return;
  }
  const blob=new Blob([text],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=filename;
  a.click(); URL.revokeObjectURL(url);
  addLog(`POSCAR exportado ✓ (v10)`,'g');
}

// ── Exportar XV (formato SIESTA) ────────────────────────────────────────
// XV es el formato nativo de SIESTA. Similar a POSCAR pero en Å y
// con números atómicos en lugar de símbolos. Útil para continuar
// con SIESTA directamente.
/**
 * [REGISTRO-DOC-EXPORT:035:exportXV]
 * Guarda la geometría actual en formato SIESTA .XV.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function exportXV(){
  if(!ready||!GX.length){addLog('Genera una estructura primero','r');return;}

  const d=1.44, LXa=d/2, LYa=d*Math.sqrt(3)/2, DXa=3*d, DYa=2*LYa;
  const VACUUM=20.0;
  const custom=customPositionBBox();
  const PAD=6.0;
  const cellA=custom?(custom.mxX-custom.mnX+PAD):Nx*DXa/2;
  const cellB=custom?(custom.mxY-custom.mnY+PAD):Ny*DYa/2;

  /**
   * [REGISTRO-DOC-EXPORT:036:posAt]
   * Calcula la posición exportable de un sitio según geometría regular o custom.
   * Alcance: auxiliar local.
   * Parámetros: i,j.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function posAt(i,j){
    if(custom){
      const p=CUSTOM_POSITIONS[idx(i,j)];
      if(p && Number.isFinite(p.x) && Number.isFinite(p.y)) return [p.x-custom.mnX+PAD/2, p.y-custom.mnY+PAD/2];
    }
    const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
    const xoffs=[[LXa,LXa+d],[0,2*LXa+d]];
    const x=cc*DXa+xoffs[sr][sc];
    const y=cr*DYa+(sr===0?LYa:0);
    return latticeOrient==='ZZ'?[y,x]:[x,y];
  }

  // Número atómico: N=7, B=5, C=6, H=1
  const ZN=7,ZB=5,ZC=6,ZH=1;
  const atoms=[];
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j),t=G[k];
    if(t===V_T) continue;
    const[x,y]=posAt(i,j);
    const Z=t===N_T?ZN:t===B_T?ZB:ZC;
    atoms.push({Z,x,y});
    if(hPass && !custom){
      for(const[ri,rj]of rawNB(i,j)){
        const nk=mapRawNeighborIndex(ri,rj);
        if(nk!==null&&G[nk]!==V_T) continue;
        const[xn,yn]=posAt(ri,rj);
        const hfr=1.09/1.44; atoms.push({Z:ZH,x:x+hfr*(xn-x),y:y+hfr*(yn-y)});
      }
    }
  }
  if(hPass && custom && Array.isArray(IMPORTED_H_SITES)){
    for(const h of IMPORTED_H_SITES){
      if(!h||!Number.isFinite(h.x)||!Number.isFinite(h.y)) continue;
      const parent=h.parent??-1;
      if(parent>=0 && parent<G.length && G[parent]===V_T) continue;
      atoms.push({Z:ZH,x:h.x-custom.mnX+PAD/2,y:h.y-custom.mnY+PAD/2});
    }
  }

  const lines=[];
  // Vectores de red (en Bohr para SIESTA — 1 Å = 1.88973 Bohr)
  const A2B=1.88973;
  lines.push(`        ${(cellA*A2B).toFixed(6)}  0.000000  0.000000`);
  lines.push(`        0.000000  ${(cellB*A2B).toFixed(6)}  0.000000`);
  lines.push(`        0.000000  0.000000  ${(VACUUM*A2B).toFixed(6)}`);
  lines.push(`${atoms.length}`);
  atoms.forEach(({Z,x,y})=>{
    lines.push(`  ${Z}  1  ${(x*A2B).toFixed(8)}  ${(y*A2B).toFixed(8)}  ${(10*A2B).toFixed(8)}`);
  });

  const content=lines.join('\n');
  const filename=`hBN_MC_v${HBN_VERSION.replace(/\./g,'_')}.XV`;
  if(typeof saveFile==='function'){
    addLog(`XV (SIESTA) listo: ${atoms.length} átomos · guardando…`,'i');
    saveFile(filename,content,'text/plain');
    return;
  }
  const blob=new Blob([content],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=filename;
  a.click(); URL.revokeObjectURL(url);
  addLog(`XV (SIESTA) exportado: ${atoms.length} átomos`,'g');
}




// ── Informe completo en PNG ────────────────────────────────────────────
// Genera un solo PNG con:
//   • Encabezado con metadatos completos
//   • Imagen configuración inicial  |  Imagen configuración final
//   • 4 gráficas: E(t), T(t), accept%(t), cNB(t)
//   • Tabla de conteo de enlaces (todos los tipos)
//   • Tabla de parámetros del modelo
//   • Pie con E_f, geometría del poro, tasa de aceptación, semilla
// Todo en un canvas de alta resolución exportado como PNG.
/**
 * [REGISTRO-DOC-EXPORT:037:exportFullReport]
 * Genera un reporte gráfico multipágina/lámina con estructura, métricas y gráficas.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: btn.
 * Retorno: Promise<void>.
 */
async function exportFullReport(btn){
  if(!ready){addLog('Genera una estructura primero','r');return;}
  if(!hE.length){addLog('Genera o carga una estructura primero para generar el informe','r');return;}
  if(hE.length<2){addLog('Informe estático: no hay trayectoria MC; se usará el estado actual como inicial/final.','w');}
  const origBtnText=btn?(btn.getAttribute('data-orig')||btn.textContent):'';
  if(btn){btn.disabled=true;btn.textContent='⏳ Generando informe...';}

  try{
  const W=1200, SCALE_R=2; // escala retina para exportar más nítido
  // [v14.3] Bounding box de la estructura para dimensionar los paneles a página
  // completa respetando la relación de aspecto real (Constructor o red regular).
  /**
   * [REGISTRO-DOC-EXPORT:038:structureBBox]
   * Calcula la caja envolvente estructural usada por el reporte.
   * Alcance: auxiliar local.
   * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function structureBBox(){
    const D_=1.44,LX_=D_/2,LY_=D_*Math.sqrt(3)/2,DX_=2*LX_+2*D_,DY_=2*LY_;
    const hasCP=typeof usingCustomConstructorGeometry==='function'&&usingCustomConstructorGeometry()
      &&Array.isArray(CUSTOM_POSITIONS)&&CUSTOM_POSITIONS.length===Nx*Ny;
    let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9;
    for(let i=0;i<Ny;i++)for(let j=0;j<Nx;j++){
      const k=i*Nx+j; let px,py;
      const cp=hasCP?CUSTOM_POSITIONS[k]:null;
      if(cp&&Number.isFinite(cp.x)&&Number.isFinite(cp.y)){px=cp.x;py=cp.y;}
      else{
        const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
        const xx=cc*DX_+(sr===0?(sc===0?LX_:LX_+D_):(sc===0?0:2*LX_+D_));
        const yy=cr*DY_+(sr===0?LY_:0);
        if(latticeOrient==='ZZ'){px=yy;py=xx;}else{px=xx;py=yy;}
      }
      if(px<mnX)mnX=px;if(px>mxX)mxX=px;if(py<mnY)mnY=py;if(py>mxY)mxY=py;
    }
    return {w:Math.max(mxX-mnX,1e-6),h:Math.max(mxY-mnY,1e-6)};
  }
  const bbox=structureBBox();
  const pagePanelW=W-32;
  // Altura del panel según relación de aspecto real, acotada para legibilidad.
  const PAGE_STRUCT_H=Math.round(Math.max(300,Math.min(660,(pagePanelW-16)*bbox.h/bbox.w+40)));
  const PAGE_H=PAGE_STRUCT_H+64; // panel + título + leyenda de página

  // [v14.4] Todas las secciones escaladas proporcionalmente a los paneles de
  // estructura a página completa: gráficas más altas, tablas con tipografía
  // mayor en dos filas (enlaces+composición / parámetros), pie más legible.
  const bcPre=countBonds(); // para dimensionar la tabla de enlaces por adelantado
  const hasCRows=(bcPre.cCC>0||bcPre.cCN>0||bcPre.cCB>0);
  const nBondRows=(hasCRows?10:7)+1; // filas de datos + encabezado
  const TROW=26;       // alto de fila de tabla (antes 18)
  const HDR=128;       // encabezado
  const SNAP=PAGE_H*2+40; // dos "páginas" a ancho completo (inicial y final)
  const CHART_H=250;   // altura de cada fila de gráficas (antes 160)
  const CHARTS=CHART_H*2+20; // dos filas de gráficas
  const TBL_ROW1=Math.max(nBondRows,6)*TROW+34; // enlaces | composición (lado a lado)
  const TBL_ROW2=8*TROW+34;                     // parámetros (ancho completo)
  const TABLE=TBL_ROW1+TBL_ROW2+28;
  const FTR=116;       // pie: datos del resultado arriba, referencia y firma debajo
  const H=HDR+SNAP+CHARTS+TABLE+FTR+32;

  const tmp=document.createElement('canvas');
  tmp.width=W*SCALE_R; tmp.height=H*SCALE_R;
  const c=tmp.getContext('2d');
  c.setTransform(SCALE_R,0,0,SCALE_R,0,0);

  // ─── Paleta ───────────────────────────────────────────────────────────
  const BG='#ffffff', BG2='#f8fafc', BG3='#f1f5f9';
  const BORDER='#e2e8f0', BORDER2='#cbd5e1';
  const TEXT='#0f172a', TEXT2='#475569', TEXT3='#94a3b8';
  const ACCENT='#2563eb';
  const COL_E='#7c3aed', COL_T='#b45309', COL_A='#16a34a', COL_B='#2563eb';

  // ─── Utilidades de dibujo ─────────────────────────────────────────────
  /**
   * [REGISTRO-DOC-EXPORT:039:rect]
   * Dibuja un rectángulo/panel auxiliar en el canvas de exportación.
   * Alcance: auxiliar local.
   * Parámetros: x,y,w,h,fill,stroke,r=0.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function rect(x,y,w,h,fill,stroke,r=0){
    c.beginPath();
    if(r>0){
      c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
      c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
      c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);
      c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);
      c.closePath();
    } else {
      c.rect(x,y,w,h);
    }
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
  }
  /**
   * [REGISTRO-DOC-EXPORT:040:label]
   * Dibuja texto con opciones de estilo en el canvas de exportación.
   * Alcance: auxiliar local.
   * Parámetros: txt,x,y,opts={}.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function label(txt,x,y,opts={}){
    c.fillStyle=opts.color||TEXT2;
    c.font=(opts.weight||'normal')+' '+(opts.size||11)+'px sans-serif';
    c.textAlign=opts.align||'left';
    c.textBaseline=opts.base||'alphabetic';
    c.fillText(txt,x,y);
  }
  /**
   * [REGISTRO-DOC-EXPORT:041:hline]
   * Dibuja una línea horizontal auxiliar.
   * Alcance: auxiliar local.
   * Parámetros: x1,x2,y,color=BORDER,w=1.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function hline(x1,x2,y,color=BORDER,w=1){
    c.beginPath();c.moveTo(x1,y);c.lineTo(x2,y);
    c.strokeStyle=color;c.lineWidth=w;c.stroke();
  }
  /**
   * [REGISTRO-DOC-EXPORT:042:chip]
   * Dibuja una etiqueta tipo chip/badge.
   * Alcance: auxiliar local.
   * Parámetros: txt,x,y,bg,fg.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function chip(txt,x,y,bg,fg){
    c.font='bold 11.5px sans-serif';
    const cw=c.measureText(txt).width+16;
    rect(x,y-15,cw,22,bg,null,6);
    label(txt,x+8,y,{color:fg,size:11.5,weight:'bold'});
    return cw+7;
  }

  // ─── Datos y cálculos ─────────────────────────────────────────────────
  const bc=bcPre;
  const pore=classifyPore();
  const formv=typeof calcFormationEnergyDFTLike==='function'?calcFormationEnergyDFTLike():null;
  const efv=formv&&formv.nV>0&&formv.perH!==null?formv:null;
  const hp=typeof calcHOverlapPenalty==='function'?calcHOverlapPenalty(G):null;
  const counts=getSpeciesCounts();
  const accRate=(accepted/(accepted+rejected||1)*100).toFixed(1);
  const opc=+document.getElementById('iPore').value;
  const opcNames={1:'Red perfecta h-BN',2:'h-BN + vacancias aleatorias',
    3:'Configuración aleatoria',6:'Poro paralelogramo',7:'Poro triangular',
    8:'Vacancias región central',10:'Poro Tri-N',11:'Poro Tri-B',
    12:'Poro paralelogramo A',13:'Poro paralelogramo B',14:'Poro hexagonal',
    20:'h-BN + segregación C',30:'Fita C horizontal',31:'Fita C vertical',
    32:'Heteroestructura BNC',43:'Grafeno puro',
    47:'Nanoribbon ZZ-N',48:'Nanoribbon ZZ-B',49:'Nanoribbon AC'};
  const opcL=opcNames[opc]||`Configuración ${opc}`;
  const pbcLabel=(pbcX&&pbcY)?'X+Y (bulk)':(pbcX?'solo X':(pbcY?'solo Y':'bordes abiertos'));
  const now=new Date();
  const dateStr=now.toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'});
  const timeStr=now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});

  // ─── Fondo general ────────────────────────────────────────────────────
  c.fillStyle=BG; c.fillRect(0,0,W,H);

  // ══════════════════════════════════════════════════════════════════════
  // ENCABEZADO
  // ══════════════════════════════════════════════════════════════════════
  // Barra superior azul
  rect(0,0,W,6,ACCENT);
  // Título principal
  label(`Informe de Simulación — ${HBN_APP_NAME} v${HBN_VERSION}`,20,34,{size:20,weight:'bold',color:TEXT});
  const isCustomGeo=typeof usingCustomConstructorGeometry==='function'&&usingCustomConstructorGeometry();
  const geoLbl=isCustomGeo?`Constructor hBN/C · ${Nx*Ny} sitios`:`Red ${Nx}×${Ny}`;
  label(`${opcL}  ·  ${geoLbl}  ·  ${step.toLocaleString()} pasos MC`,20,58,{size:14,color:TEXT2});
  label(`${dateStr}  ${timeStr}  ·  Mg. Manuel Alejandro Obando  ·  Dpto. Física, Universidad del Cauca & FIMAT-UFOP`,20,78,{size:11,color:TEXT3});

  // Chips de estado rápido
  let cx=20;
  cx+=chip(`E = ${E.toFixed(1)} eV`,cx,102,'#eff6ff','#1d4ed8')+4;
  cx+=chip(`T_f = ${T.toFixed(0)} K`,cx,102,'#fef3c7','#92400e')+4;
  cx+=chip(`Accept = ${accRate}%`,cx,102,'#f0fdf4','#166534')+4;
  if(efv) cx+=chip(`E_form/H = ${efv.perH.toFixed(4)} eV (${efv.env})`,cx,102,'#f5f3ff','#5b21b6')+4;
  if(formv) cx+=chip(`Eform = ${formv.Eform.toFixed(3)} eV`,cx,102,'#eef2ff','#4338ca')+4;
  if(hp) cx+=chip(`H-H = ${hp.energy.toFixed(2)} eV`,cx,102,'#fff7ed','#9a3412')+4;
  if(pore) chip(pore.label,cx,102,'#fff7ed','#9a3412');

  hline(0,W,HDR,BORDER2,1);

  // ══════════════════════════════════════════════════════════════════════
  // FILA DE SNAPSHOTS
  // ══════════════════════════════════════════════════════════════════════
  let y=HDR+8;

  // Helper para renderizar G en canvas temporal
  /**
   * [REGISTRO-DOC-EXPORT:043:renderGridToCanvas]
   * Renderiza una configuración Gdata sobre un canvas de reporte.
   * Alcance: auxiliar local.
   * Parámetros: Gdata,nxG,nyG,w,h,ss=2.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function renderGridToCanvas(Gdata,nxG,nyG,w,h,ss=2){
    // [v14.3] ss = factor de sobremuestreo: el canvas interno se renderiza a
    // ss× y se reduce al dibujarlo en el informe (que ya va a 2× por SCALE_R),
    // dando ~4× de resolución efectiva en los átomos y enlaces.
    const off=document.createElement('canvas'); off.width=w*ss; off.height=h*ss;
    const oc=off.getContext('2d');
    oc.setTransform(ss,0,0,ss,0,0);
    oc.fillStyle='#ffffff'; oc.fillRect(0,0,w,h);

    const D_=1.44,LX_=D_/2,LY_=D_*Math.sqrt(3)/2,DX_=2*LX_+2*D_,DY_=2*LY_;
    let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9;
    /**
     * [REGISTRO-DOC-EXPORT:044:aPos]
     * Calcula posición auxiliar de un sitio para renderizado del reporte.
     * Alcance: auxiliar local.
     * Parámetros: i,j.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function aPos(i,j){
      const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
      const x=cc*DX_+(sr===0?(sc===0?LX_:LX_+D_):(sc===0?0:2*LX_+D_));
      const y_=cr*DY_+(sr===0?LY_:0);
      return latticeOrient==='ZZ'?[y_,x]:[x,y_];
    }
    // [FIX v14.2] Geometrías del Constructor hBN/C (opc=99): la malla interna es
    // 1×N y la plantilla regular aPos() colapsa todos los átomos en una línea.
    // Las posiciones físicas reales están en CUSTOM_POSITIONS — usarlas cuando
    // existan y coincidan en longitud. PNB/energía siempre fueron correctos;
    // solo el dibujo de los snapshots del informe usaba la plantilla equivocada.
    const hasCustomPos = typeof usingCustomConstructorGeometry==='function'
      && usingCustomConstructorGeometry()
      && Array.isArray(CUSTOM_POSITIONS) && CUSTOM_POSITIONS.length===nxG*nyG
      && CUSTOM_POSITIONS.some(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
    const positions=[];
    for(let i=0;i<nyG;i++) for(let j=0;j<nxG;j++){
      const k=i*nxG+j;
      let px,py;
      const cp=hasCustomPos?CUSTOM_POSITIONS[k]:null;
      if(cp&&Number.isFinite(cp.x)&&Number.isFinite(cp.y)){ px=cp.x; py=cp.y; }
      else { const [ax,ay]=aPos(i,j); px=ax; py=ay; }
      positions.push([px,py]);
      if(px<mnX)mnX=px; if(px>mxX)mxX=px;
      if(py<mnY)mnY=py; if(py>mxY)mxY=py;
    }
    const pad_=18;
    const sc_=Math.min((w-2*pad_)/(mxX-mnX||1),(h-2*pad_)/(mxY-mnY||1));
    const ox_=(w-(mxX-mnX)*sc_)/2, oy_=(h-(mxY-mnY)*sc_)/2;
    const rBase=Math.max(2,Math.min(sc_*D_*0.38,16)); // [v14.3] tope 9→16 para paneles grandes

    /**
     * [REGISTRO-DOC-EXPORT:045:getLocalNeighbors]
     * Obtiene vecinos locales usados por la reconstrucción visual del poro.
     * Alcance: auxiliar local.
     * Parámetros: k.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function getLocalNeighbors(k){ return PNB && PNB[k] ? PNB[k] : []; }
    /**
     * [REGISTRO-DOC-EXPORT:046:getVacClustersLocal]
     * Obtiene clústeres de vacancias para sombreado del poro en el reporte.
     * Alcance: auxiliar local.
     * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function getVacClustersLocal(){
      const vis=new Uint8Array(nxG*nyG), clusters=[];
      for(let k=0;k<Gdata.length;k++){
        if(Gdata[k]!==0 || vis[k]) continue;
        const comp=[], q=[k]; vis[k]=1;
        while(q.length){
          const cur=q.pop(); comp.push(cur);
          const i=(cur/nxG)|0, j=cur%nxG;
          for(const [ni,nj] of getLocalNeighbors(cur)){
            const nk=ni*nxG+nj;
            if(Gdata[nk]===0 && !vis[nk]){ vis[nk]=1; q.push(nk); }
          }
        }
        clusters.push(comp);
      }
      clusters.sort((a,b)=>b.length-a.length);
      return clusters;
    }
    /**
     * [REGISTRO-DOC-EXPORT:047:drawPoreShade]
     * Dibuja sombreado de poro en la representación del reporte.
     * Alcance: auxiliar local.
     * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
     * Retorno: valor auxiliar o void según el contexto.
     */
    function drawPoreShade(){
      // [v14.3] Resaltado de poros con clasificación geométrica:
      //  • anillos dobles sobre los átomos de borde (color según forma detectada)
      //  • casco convexo punteado en el mismo color
      //  • etiqueta con forma, terminación y tamaño junto a cada poro
      const clusters=getVacClustersLocal();
      if(!clusters.length) return;
      /**
       * [REGISTRO-DOC-EXPORT:048:paletteFor]
       * Selecciona la paleta visual de un clúster de poro.
       * Alcance: auxiliar local.
       * Parámetros: cluster.
       * Retorno: valor auxiliar o void según el contexto.
       */
      const paletteFor=(cluster)=>{
        let cls=null;
        try{
          if(typeof classifyPoreClusterForState==='function') cls=classifyPoreClusterForState(cluster,Gdata);
          else if(typeof classifyPoreCluster==='function') cls=classifyPoreCluster(cluster);
        }catch(e){cls=null;}
        const pal=(typeof getPoreVisualPalette==='function')
          ? getPoreVisualPalette(cls?cls.key:'irregular')
          : {stroke:'rgba(217,119,6,0.9)',fill:'rgba(245,158,11,0.12)'};
        return {cls,pal};
      };
      /**
       * [REGISTRO-DOC-EXPORT:049:drawOne]
       * Dibuja un clúster/poro individual.
       * Alcance: auxiliar local.
       * Parámetros: cluster,alphaScale=1,showLabel=true.
       * Retorno: valor auxiliar o void según el contexto.
       */
      const drawOne=(cluster,alphaScale=1,showLabel=true)=>{
        if(!cluster||!cluster.length) return;
        const {cls,pal}=paletteFor(cluster);
        const edgeAtoms=new Set();
        const vacPts=[],edgePts=[];
        cluster.forEach(k=>{
          const [px,py]=positions[k];
          vacPts.push([ox_+(px-mnX)*sc_, oy_+(py-mnY)*sc_]);
          for(const [ni,nj] of getLocalNeighbors(k)){
            const nk=ni*nxG+nj;
            if(Gdata[nk]!==0){
              edgeAtoms.add(nk);
              const [npx,npy]=positions[nk];
              edgePts.push([ox_+(npx-mnX)*sc_, oy_+(npy-mnY)*sc_]);
            }
          }
        });
        // 1) Casco convexo punteado
        const sourcePts=edgePts.length>=3?edgePts:vacPts;
        if(sourcePts.length>=3){
          let hullPts=typeof convexHull==='function'?convexHull(sourcePts):sourcePts.slice();
          if(hullPts&&hullPts.length>=3){
            const hcx=hullPts.reduce((a,p)=>a+p[0],0)/hullPts.length;
            const hcy=hullPts.reduce((a,p)=>a+p[1],0)/hullPts.length;
            const expand=Math.max(3,rBase*0.9);
            const hx=hullPts.map(([x,y])=>{const dx=x-hcx,dy=y-hcy,d=Math.hypot(dx,dy)||1;return[x+dx/d*expand,y+dy/d*expand];});
            oc.save();
            oc.beginPath();
            hx.forEach(([x,y],ii)=>{ii===0?oc.moveTo(x,y):oc.lineTo(x,y);});
            oc.closePath();
            oc.fillStyle=(pal.fill||'rgba(245,158,11,0.12)').replace(/0\.\d+\)/,(m)=>((parseFloat(m)*alphaScale*0.7).toFixed(3))+')');
            oc.fill();
            oc.strokeStyle=pal.stroke;
            oc.globalAlpha=alphaScale;
            oc.lineWidth=Math.max(1.4,rBase*0.28);
            oc.setLineDash([Math.max(4,rBase*0.7),Math.max(2.5,rBase*0.4)]);
            oc.stroke();
            oc.setLineDash([]);
            oc.globalAlpha=1;
            oc.restore();
          }
        }
        // 2) Anillo doble en cada átomo de borde
        oc.save();
        oc.globalAlpha=alphaScale;
        for(const nk of edgeAtoms){
          const [px,py]=positions[nk];
          const sx=ox_+(px-mnX)*sc_, sy=oy_+(py-mnY)*sc_;
          oc.beginPath(); oc.arc(sx,sy,rBase*1.28,0,Math.PI*2);
          oc.strokeStyle=pal.stroke; oc.lineWidth=Math.max(1.2,rBase*0.24); oc.stroke();
          oc.beginPath(); oc.arc(sx,sy,rBase*1.62,0,Math.PI*2);
          oc.strokeStyle=pal.stroke; oc.globalAlpha=alphaScale*0.45;
          oc.lineWidth=Math.max(0.8,rBase*0.14); oc.stroke();
          oc.globalAlpha=alphaScale;
        }
        // 3) Marcar las vacancias del poro
        vacPts.forEach(([x,y])=>{
          oc.beginPath(); oc.arc(x,y,Math.max(1.4,rBase*0.6),0,Math.PI*2);
          oc.fillStyle=pal.stroke.replace(/0\.\d+\)/,'0.22)'); oc.fill();
        });
        // 4) Etiqueta de clasificación junto al poro
        if(showLabel&&cls&&vacPts.length){
          const lcx=vacPts.reduce((a,p)=>a+p[0],0)/vacPts.length;
          const lcy=Math.min(...vacPts.map(p=>p[1]))-rBase*2.4;
          const txt=cls.label||`${cls.shape||''} (${cluster.length} vac.)`;
          oc.font='bold '+Math.max(9,Math.min(13,rBase*1.15))+'px sans-serif';
          const tw=oc.measureText(txt).width;
          const bx=lcx-tw/2-6, by=lcy-13;
          oc.fillStyle='rgba(255,255,255,0.92)';
          oc.strokeStyle=pal.stroke; oc.lineWidth=1;
          oc.beginPath();
          if(oc.roundRect) oc.roundRect(bx,by,tw+12,18,4); else oc.rect(bx,by,tw+12,18);
          oc.fill(); oc.stroke();
          oc.fillStyle=pal.stroke;
          oc.textAlign='center'; oc.textBaseline='middle';
          oc.fillText(txt,lcx,by+9);
          oc.textAlign='left'; oc.textBaseline='alphabetic';
        }
        oc.restore();
      };
      // Resaltar hasta 4 poros (por tamaño), etiquetas solo en los 2 mayores
      const nShow=Math.min(4,clusters.length);
      for(let ci=0;ci<nShow;ci++){
        const alpha=ci===0?1:(ci===1?0.8:0.55);
        drawOne(clusters[ci],alpha,ci<2);
      }
    }

    // Sombreado de huecos desactivado: estaba generando manchas imprecisas en el resumen.

    const BOND_COL={'01':'rgba(37,99,235,0.25)','02':'rgba(22,163,74,0.25)',
      '12':'rgba(22,163,74,0.55)','11':'rgba(37,99,235,0.18)','22':'rgba(21,128,61,0.18)',
      '00':'rgba(148,163,184,0.3)'};
    // Longitud máxima de enlace en píxeles de pantalla (igual criterio que la vista
    // principal en render.js: MAX_B = SCALE*D*1.35). Los vecinos de PNB con PBC activo
    // conectan índices envueltos (wrap-around) en el borde opuesto de la red; al dibujarse
    // con las coordenadas cartesianas reales (no la imagen mínima/minimum-image), esos
    // enlaces aparecen como líneas rectas larguísimas que cruzan todo el panel. No son un
    // artefacto físico: PNB y la energía siguen siendo correctos bajo PBC, es solo que la
    // proyección 2D del enlace periódico no debe dibujarse como si fuera un enlace directo.
    const MAX_B_=sc_*D_*1.35;
    for(let i=0;i<nyG;i++) for(let j=0;j<nxG;j++){
      const k=i*nxG+j, t1=Gdata[k];
      const [px1,py1]=positions[k];
      const sx1=ox_+(px1-mnX)*sc_, sy1=oy_+(py1-mnY)*sc_;
      if(!getLocalNeighbors(k).length) continue;
      for(const[ni,nj] of getLocalNeighbors(k)){
        const nk=ni*nxG+nj; if(nk<=k) continue;
        const t2=Gdata[nk];
        const [px2,py2]=positions[nk];
        const sx2=ox_+(px2-mnX)*sc_, sy2=oy_+(py2-mnY)*sc_;
        if(Math.hypot(sx2-sx1,sy2-sy1)>MAX_B_) continue; // descarta enlace envuelto por PBC
        const key=[Math.min(t1,t2),Math.max(t1,t2)].join('');
        oc.beginPath(); oc.moveTo(sx1,sy1); oc.lineTo(sx2,sy2);
        oc.strokeStyle=BOND_COL[key]||'rgba(148,163,184,0.3)';
        oc.lineWidth=Math.max(0.5,rBase*0.4); oc.stroke();
      }
    }

    const ATOM_COL=[COL_VAC||'#e2e8f0','#2563eb','#16a34a','#475569'];
    const ATOM_B=['#94a3b8','#1d4ed8','#15803d','#334155'];
    for(let i=0;i<nyG;i++) for(let j=0;j<nxG;j++){
      const k=i*nxG+j, t=Gdata[k];
      const [px,py]=positions[k];
      const sx=ox_+(px-mnX)*sc_, sy=oy_+(py-mnY)*sc_;
      const atomScale = (t===1 || t===2) ? 0.74 : (t===3 ? 0.82 : 0.56);
      const rAtom = rBase * atomScale;
      oc.beginPath(); oc.arc(sx,sy,rAtom,0,Math.PI*2);
      if(t===0){
        oc.strokeStyle='rgba(148,163,184,0.7)';
        oc.lineWidth=0.65;
        oc.stroke();
      } else {
        oc.fillStyle=ATOM_COL[t]||'#94a3b8'; oc.fill();
        oc.strokeStyle=ATOM_B[t]||'#64748b'; oc.lineWidth=0.4; oc.stroke();
      }
    }
    // Informe limpio: no dibujar resaltados, cascos ni etiquetas de poro sobre
    // la estructura. Las vacancias quedan como sitios vacíos, sin overlay gráfico.
    return off;
  }

  // [v14.3] Dos "páginas" a ancho completo: mayor resolución y resaltado de poros.
  /**
   * [REGISTRO-DOC-EXPORT:050:drawLegendRow]
   * Dibuja una fila de leyenda del reporte.
   * Alcance: auxiliar local.
   * Parámetros: cy.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function drawLegendRow(cy){
    const atoms=[{c:'#2563eb',l:'N'},{c:'#16a34a',l:'B'},{c:'#475569',l:'C'},{c:'#e2e8f0',l:'Vacancia'}];
    let lx=28;
    atoms.forEach(a=>{
      c.beginPath(); c.arc(lx+6,cy-4,5,0,Math.PI*2);
      c.fillStyle=a.c; c.fill();
      c.strokeStyle='#94a3b8'; c.lineWidth=0.5; c.stroke();
      label(a.l,lx+15,cy,{size:9,color:TEXT3});
      lx+=c.measureText(a.l).width+42;
    });
  }
  /**
   * [REGISTRO-DOC-EXPORT:051:drawStructPage]
   * Dibuja una página/sección estructural del reporte.
   * Alcance: auxiliar local.
   * Parámetros: Gdata,titulo,pageNo,py.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function drawStructPage(Gdata,titulo,pageNo,py){
    rect(16,py,pagePanelW,PAGE_H-8,BG2,BORDER,8);
    label(titulo,28,py+18,{size:13,weight:'bold',color:TEXT});
    label(`página ${pageNo}`,W-28,py+18,{size:10,color:TEXT3,align:'right'});
    if(Gdata&&Gdata.length===Nx*Ny){
      const cnv=renderGridToCanvas(Gdata,Nx,Ny,pagePanelW-16,PAGE_STRUCT_H,2);
      // drawImage con destino a tamaño lógico: el sobremuestreo interno (2×) por
      // el SCALE_R del informe (2×) da ~4× de resolución efectiva.
      c.drawImage(cnv,0,0,cnv.width,cnv.height,24,py+26,pagePanelW-16,PAGE_STRUCT_H);
    } else {
      label('(no disponible)',W/2,py+PAGE_STRUCT_H/2,{size:11,color:TEXT3,align:'center'});
    }
    drawLegendRow(py+PAGE_STRUCT_H+44);
  }

  drawStructPage(G_initial,'Configuración inicial',1,y);
  y+=PAGE_H+8;
  // Separador de página
  c.save(); c.setLineDash([6,5]);
  hline(16,W-16,y,BORDER2,1.2);
  c.restore();
  label('— continúa: configuración final —',W/2,y+14,{size:9,color:TEXT3,align:'center'});
  y+=24;
  drawStructPage(G,'Configuración final',2,y);
  y+=PAGE_H+8;
  hline(16,W-16,y-4,BORDER);

  // ══════════════════════════════════════════════════════════════════════
  // GRÁFICAS — 2 filas × 2 columnas
  // ══════════════════════════════════════════════════════════════════════
  /**
   * [REGISTRO-DOC-EXPORT:052:drawChart]
   * Dibuja una gráfica completa dentro del reporte.
   * Alcance: auxiliar local.
   * Parámetros: data,title,unit,color,x0,y0,w,h.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function drawChart(data,title,unit,color,x0,y0,w,h){
    if(!data||data.length<2) return;
    rect(x0,y0,w,h,BG2,BORDER,6);
    const pl=66,pr=16,pt=36,pb=34; // [v14.4] márgenes acordes a la altura mayor
    const pw=w-pl-pr, ph=h-pt-pb;
    const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;

    // Título
    label(title,x0+pl+pw/2,y0+22,{size:14,weight:'bold',color:TEXT2,align:'center'});

    // Grid horizontal
    const nGrid=4;
    for(let g=0;g<=nGrid;g++){
      const gy=y0+pt+ph*g/nGrid;
      c.beginPath(); c.moveTo(x0+pl,gy); c.lineTo(x0+pl+pw,gy);
      c.strokeStyle=g===nGrid?BORDER2:'rgba(226,232,240,0.7)';
      c.lineWidth=g===nGrid?1:0.5; c.stroke();
      const val=mx-rng*g/nGrid;
      label((Math.abs(val)>9999?val.toFixed(0):val.toFixed(1)),x0+pl-6,gy+4,{size:10.5,color:TEXT3,align:'right'});
    }

    // Área bajo la curva
    c.beginPath();
    data.forEach((v,i)=>{
      const px=x0+pl+pw*i/(data.length-1);
      const py=y0+pt+ph*(1-(v-mn)/rng);
      i===0?c.moveTo(px,py):c.lineTo(px,py);
    });
    c.lineTo(x0+pl+pw, y0+pt+ph);
    c.lineTo(x0+pl, y0+pt+ph);
    c.closePath();
    c.fillStyle=color+'18'; c.fill();

    // Línea principal
    c.beginPath();
    data.forEach((v,i)=>{
      const px=x0+pl+pw*i/(data.length-1);
      const py=y0+pt+ph*(1-(v-mn)/rng);
      i===0?c.moveTo(px,py):c.lineTo(px,py);
    });
    c.strokeStyle=color; c.lineWidth=2.4; c.lineJoin='round'; c.stroke();

    // Punto final
    const lv=data[data.length-1];
    const fx=x0+pl+pw, fy=y0+pt+ph*(1-(lv-mn)/rng);
    c.beginPath(); c.arc(fx,fy,4.5,0,Math.PI*2);
    c.fillStyle=color; c.fill();
    // Valor final a la derecha del punto si cabe; si no, encima y alineado a la
    // derecha, para que no se recorte en el borde del panel.
    const endTxt=`${Math.abs(lv)>9999?lv.toFixed(0):lv.toFixed(2)} ${unit}`.trim();
    c.font='bold 11px sans-serif';
    const endW=c.measureText(endTxt).width;
    if(fx+6+endW<=x0+w-4){
      label(endTxt,fx+6,fy+4,{size:11,weight:'bold',color});
    }else{
      const ly=(fy-10<y0+pt+4)?fy+20:fy-10;
      rect(fx-endW-11,ly-11,endW+8,15,'rgba(255,255,255,0.85)',null,3);
      label(endTxt,fx-7,ly,{size:11,weight:'bold',color,align:'right'});
    }

    // Eje X: pasos
    label('0',x0+pl,y0+h-10,{size:10.5,color:TEXT3,align:'left'});
    label(step.toLocaleString(),x0+pl+pw,y0+h-10,{size:10.5,color:TEXT3,align:'right'});
    label('pasos MC',x0+pl+pw/2,y0+h-10,{size:10.5,color:TEXT3,align:'center'});
  }

  const gpad=12;
  const gw=(W-48-gpad)/2;
  const gy0=y+4;
  drawChart(hE,'Energía total','eV',COL_E, 16,gy0, gw,CHART_H);
  drawChart(hT,'Temperatura','K',COL_T, 16+gw+gpad,gy0, gw,CHART_H);
  drawChart(hA,'Tasa de aceptación','%',COL_A, 16,gy0+CHART_H+gpad, gw,CHART_H);
  drawChart(hBN,'Ligaciones N–B','',COL_B, 16+gw+gpad,gy0+CHART_H+gpad, gw,CHART_H);

  y+=CHARTS+16;
  hline(16,W-16,y,BORDER);
  y+=10;

  // ══════════════════════════════════════════════════════════════════════
  // TABLAS DE DATOS
  // ══════════════════════════════════════════════════════════════════════
  // ── [v14.4] Tablas rediseñadas: fila 1 = Enlaces | Composición;
  //    fila 2 = Parámetros a ancho completo. Tipografía 12/13 px, filas de 26 px.
  const rowH=TROW;
  const FS_H=11, FS_D=12.5; // tamaños encabezado/dato

  // ── Tabla 1: Conteo de enlaces (mitad izquierda) ─────────────────────
  const T1X=16, T1W=610;
  label('Conteo de enlaces',T1X,y+16,{size:14,weight:'bold',color:TEXT});
  // countBonds() devuelve enlaces sin duplicar (cada par vecino una sola vez),
  // así que la contribución de cada tipo es simplemente n·ε, igual que en la
  // captura técnica y en calcFullE (que cuenta pares dirigidos y divide por 2).
  const bondRows=[
    ['Tipo','Cantidad','Energía (eV)','Contribución (eV)'],
    ['N – B', bc.cNB, EPS_NB.toFixed(2), (bc.cNB*EPS_NB).toFixed(1)],
    ['N – N', bc.cNN, EPS_NN.toFixed(2), (bc.cNN*EPS_NN).toFixed(1)],
    ['B – B', bc.cBB, EPS_BB.toFixed(2), (bc.cBB*EPS_BB).toFixed(1)],
    ['X – N', bc.cXN, epsEff(V_T,N_T).toFixed(2), (bc.cXN*epsEff(V_T,N_T)).toFixed(1)],
    ['X – B', bc.cXB, epsEff(V_T,B_T).toFixed(2), (bc.cXB*epsEff(V_T,B_T)).toFixed(1)],
    ['X – X', bc.cXX, epsVacVac().toFixed(2), (bc.cXX*epsVacVac()).toFixed(1)],
  ];
  if(bc.cCC>0||bc.cCN>0||bc.cCB>0){
    bondRows.push(['C – C', bc.cCC, EPS_CC.toFixed(2), (bc.cCC*EPS_CC).toFixed(1)]);
    bondRows.push(['C – N', bc.cCN, EPS_CN.toFixed(2), (bc.cCN*EPS_CN).toFixed(1)]);
    bondRows.push(['C – B', bc.cCB, EPS_CB.toFixed(2), (bc.cCB*EPS_CB).toFixed(1)]);
    bondRows.push(['X – C', bc.cXC, epsEff(V_T,C_T).toFixed(2), (bc.cXC*epsEff(V_T,C_T)).toFixed(1)]);
  }
  const colW=[110,120,180,190];
  let ty=y+26;
  bondRows.forEach((row,ri)=>{
    const bg=ri===0?BG3:(ri%2===0?BG:BG2);
    rect(T1X,ty,T1W,rowH,bg,null);
    let tx=T1X+8;
    row.forEach((cell,ci)=>{
      label(String(cell),tx+colW[ci]-10,ty+17,{size:ri===0?FS_H:FS_D,weight:ri===0?'bold':'normal',
        color:ri===0?TEXT2:ci===0?TEXT:TEXT2,align:'right'});
      tx+=colW[ci];
      if(ci<row.length-1&&ri>0){
        c.beginPath();c.moveTo(T1X+8+colW.slice(0,ci+1).reduce((a,b)=>a+b),ty);
        c.lineTo(T1X+8+colW.slice(0,ci+1).reduce((a,b)=>a+b),ty+rowH);
        c.strokeStyle=BORDER;c.lineWidth=0.5;c.stroke();
      }
    });
    if(ri===0||ri===bondRows.length-1) hline(T1X,T1X+T1W,ty+(ri===0?0:rowH),BORDER2,1);
    ty+=rowH;
  });
  rect(T1X,y+26,T1W,ty-(y+26),null,BORDER,3);

  // ── Tabla 2: Composición atómica (mitad derecha) ─────────────────────
  const T2X=T1X+T1W+16;
  const T2W=W-T2X-16;
  label('Composición atómica',T2X,y+16,{size:14,weight:'bold',color:TEXT});
  const specRows=[
    ['Especie','N° átomos','Fracción'],
    ['N  (nitrógeno)',counts.nN,(counts.nN/counts.nSites*100).toFixed(1)+'%'],
    ['B  (boro)',counts.nB,(counts.nB/counts.nSites*100).toFixed(1)+'%'],
    ['C  (carbono)',counts.nC,(counts.nC/counts.nSites*100).toFixed(1)+'%'],
    ['Vacancia (X)',counts.nV,(counts.nV/counts.nSites*100).toFixed(1)+'%'],
    ['Total sitios',counts.nSites,'100%'],
  ];
  const scolW=[Math.round(T2W*0.46),Math.round(T2W*0.28),0];
  scolW[2]=T2W-scolW[0]-scolW[1];
  let sy=y+26;
  specRows.forEach((row,ri)=>{
    const bg=ri===0?BG3:(ri%2===0?BG:BG2);
    rect(T2X,sy,T2W,rowH,bg,null);
    let tx=T2X+10;
    row.forEach((cell,ci)=>{
      label(String(cell),ci===0?tx:tx+scolW[ci]-14,sy+17,{
        size:ri===0?FS_H:FS_D,weight:ri===0?'bold':'normal',
        color:ri===0?TEXT2:(ci===0?TEXT:TEXT2),align:ci===0?'left':'right'});
      tx+=scolW[ci];
    });
    if(ri===0||ri===specRows.length-1) hline(T2X,T2X+T2W,sy+(ri===0?0:rowH),BORDER2,1);
    sy+=rowH;
  });
  rect(T2X,y+26,T2W,sy-(y+26),null,BORDER,3);

  // ── Tabla 3: Parámetros del modelo (ancho completo) ──────────────────
  y+=TBL_ROW1+12;
  const T3X=16, T3W=W-32;
  label('Parámetros del modelo',T3X,y+16,{size:14,weight:'bold',color:TEXT});
  const paramRows=[
    ['Ti','Tf','T final','Pasos','Modo'],
    [`${Ti} K`,`${Tf} K`,`${T.toFixed(0)} K`,step.toLocaleString(),tMode],
    ['μH (eV)','Semilla RNG','ε_CH (eV)','PBC','Int. global'],
    [`${muH.toFixed(3)}`,(typeof getRandomSeed==='function'&&getRandomSeed()!==null)?String(getRandomSeed()):'aleatoria',`${EPS_XC.toFixed(2)}`,pbcLabel,`${globalSwapPct}%`],
    ['εCH AC','εCH ZZ','KHH','Modo H-H','Pares H-H'],
    [`${EPS_CH_AC.toFixed(2)}`,`${EPS_CH_ZZ.toFixed(2)}`,`${H_OVERLAP_K.toFixed(2)} eV`,H_OVERLAP_MODE, hp?String(hp.nOverlap):'0'],
    ['Orient.','Subred','Accept.','Rechazados','Pasos/sitio'],
    [latticeOrient,latticeStart,`${accRate}%`,(rejected).toLocaleString(),
     `${(step/(Nx*Ny)).toFixed(1)}`],
  ];
  const pcol=Math.floor(T3W/5);
  let py=y+26;
  paramRows.forEach((row,ri)=>{
    const isHdr=ri%2===0;
    const bg=isHdr?BG3:BG2;
    rect(T3X,py,T3W,rowH,bg,null);
    row.forEach((cell,ci)=>{
      label(String(cell),T3X+ci*pcol+pcol/2,py+17,{
        size:isHdr?FS_H:FS_D,weight:isHdr?'bold':'normal',
        color:isHdr?TEXT2:TEXT,align:'center'});
    });
    if(isHdr) hline(T3X,T3X+T3W,py,BORDER2,1);
    py+=rowH;
  });
  hline(T3X,T3X+T3W,py,BORDER2,1);
  rect(T3X,y+26,T3W,py-(y+26),null,BORDER,3);

  y+=TBL_ROW2+16;


  // ══════════════════════════════════════════════════════════════════════
  // PIE DE PÁGINA
  // ══════════════════════════════════════════════════════════════════════
  hline(0,W,y,BORDER2,1);
  rect(0,y,W,FTR,'#f8fafc');
  rect(0,y,W,4,ACCENT);

  // Datos del resultado (bloque izquierdo, una línea por concepto) y fecha.
  const footX=20;
  if(efv){
    label(`E_form = ${efv.Eform.toFixed(4)} eV  ·  ${efv.perH.toFixed(5)} eV por H de borde  ·  N_H = ${efv.nH}  ·  N_vac = ${efv.nV}  ·  ambiente ${efv.env}`,
      footX,y+24,{size:11,color:'#5b21b6',weight:'bold'});
  }
  if(pore){
    label(`Geometría detectada: ${pore.label}  ·  compacidad = ${pore.compactness?.toFixed(3)||'—'}`,
      footX,y+41,{size:11,color:'#9a3412'});
  }
  if(hp){
    label(`Corrección H-H: modo=${hp.mode} · pares=${hp.nOverlap} · E_HH=${hp.energy.toFixed(3)} eV · geom=${hp.geomPairs} · topo=${hp.topoPairs}`,
      footX,y+57,{size:10,color:'#ea580c'});
  }
  label(`${dateStr} ${timeStr}`,W-16,y+24,{size:10,color:TEXT3,align:'right'});
  // Referencia bibliográfica y firma, debajo y centradas (sin solaparse con los datos).
  hline(16,W-16,y+70,BORDER);
  label(`Parámetros: tesis Obando–Batista (FIMAT-UFOP, 2019) sobre estructuras de Mazzoni et al., PRB 73, 073108 (2006)  ·  Metropolis  ·  ${HBN_APP_NAME} v${HBN_VERSION}`,
    W/2,y+88,{size:10,color:TEXT3,align:'center'});
  label(`Mg. Manuel Alejandro Obando  ·  Dpto. de Física, Universidad del Cauca, Colombia  ·  FIMAT-UFOP, Brasil (2019)  ·  Director: Prof. R.J.C. Batista`,
    W/2,y+104,{size:10,color:TEXT3,align:'center'});

  // ─── Exportar ────────────────────────────────────────────────────────
  const fname=`hBN_informe_${Nx}x${Ny}_${Date.now()}.png`;
  let saved=true;
  if(typeof saveFile==='function' && tmp.toBlob){
    const blob=await new Promise(resolve=>tmp.toBlob(resolve,'image/png',1.0));
    if(blob) saved=await saveFile(fname,blob,'image/png');
  } else {
    const link=document.createElement('a');
    link.download=fname;
    link.href=tmp.toDataURL('image/png',1.0);
    link.click();
    addLog(`Informe completo exportado ✓ — ${fname}`,'g');
  }
  if(saved===false){
    if(btn){
      btn.disabled=false;
      btn.textContent=origBtnText||'📋 Informe completo — resumen visual (PNG)';
      btn.style.background='#f8fafc';btn.style.color='#1e293b';btn.style.borderColor='#e2e8f0';
    }
    return;
  }
  addLog(`Resolución: ${W*SCALE_R}×${H*SCALE_R} px — inicial + final + 4 gráficas + tablas`,'i');
  if(btn){
    btn.textContent='✓ Informe exportado';
    btn.style.background='#f0fdf4';btn.style.color='#16a34a';btn.style.borderColor='#86efac';
  }
  }catch(err){
    console.error('exportFullReport falló:',err);
    if(typeof addLog==='function') addLog('No se pudo generar el informe: '+(err&&err.message?err.message:err),'r');
    if(btn){
      btn.disabled=false;
      btn.textContent=origBtnText||'📋 Informe completo — resumen visual (PNG)';
      btn.style.background='#f8fafc';btn.style.color='#1e293b';btn.style.borderColor='#e2e8f0';
    }
  }
}

// Diálogo de exportación al finalizar la simulación
/**
 * [REGISTRO-DOC-EXPORT:053:showExportDialog]
 * Abre y actualiza el diálogo/modal de exportación.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function showExportDialog(){
  const dlg=document.getElementById('exportDlg');
  if(!dlg) return;
  // Re-habilitar todos los botones (pueden quedar disabled de ejecución anterior)
  dlg.querySelectorAll('button[disabled]').forEach(btn=>{
    btn.disabled=false;
    btn.style.background='#f8fafc';
    btn.style.color='#1e293b';
    btn.style.borderColor='#e2e8f0';
    const origText=btn.getAttribute('data-orig');
    if(origText) btn.textContent=origText;
  });
  // Guardar textos originales si no están guardados
  dlg.querySelectorAll('button').forEach(btn=>{
    if(!btn.getAttribute('data-orig')&&btn.textContent.trim()!=='Cerrar')
      btn.setAttribute('data-orig',btn.textContent);
  });
  // Llenar resumen
  const bc=typeof countBonds==='function' ? countBonds() : {cNB:0};
  const pore=classifyPore();
  const opc=+document.getElementById('iPore').value;
  const opcL={1:'Red perfecta',2:'Real+vac',3:'Aleatoria',6:'Paralelogramo',
    7:'Triangular',8:'Aleatorio',10:'Tri-N',11:'Tri-B',12:'Para-N',
    13:'Para-B',14:'Hexágono',20:'h-BNC'}[opc]||opc;
  const sumEl=document.getElementById('dlgSummary');
  if(sumEl) sumEl.innerHTML=
    `<b>${Nx}×${Ny}</b> · <b>${opcL}</b> · <b>${step.toLocaleString()}</b> ${curLang==='es'?'pasos':'steps'}<br>`+
    `E = <b>${E.toFixed(1)} eV</b> · T = <b>${T.toFixed(0)} K</b><br>`+
    `cN–B = ${bc.cNB} · accept = ${(accepted/(accepted+rejected||1)*100).toFixed(1)}%`+
    (pore?`<br>${curLang==='es'?'Geometría':'Geometry'}: <b>${pore.label}</b>`:'');
  dlg.style.display='flex';
}
/**
 * [REGISTRO-DOC-EXPORT:054:hideExportDialog]
 * Oculta el diálogo/modal de exportación.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function hideExportDialog(){
  const dlg=document.getElementById('exportDlg');
  if(dlg) dlg.style.display='none';
}
/**
 * [REGISTRO-DOC-EXPORT:055:updateDlgBtn]
 * Actualiza texto y estilo de confirmación de un botón del diálogo de exportación.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: btn,txt.
 * Retorno: void.
 */
function updateDlgBtn(btn,txt){
  btn.textContent='✓ '+txt.replace('✓ ','');
  btn.style.background='#f0fdf4';
  btn.style.color='#16a34a';
  btn.style.borderColor='#86efac';
  btn.disabled=true;
}

// ── Guardar sesión — formato nativo hBN-MC ────────────────────────────
// Serializa la red actual (G), todos los parámetros MC y el estado de la
// simulación en un JSON descargable. Se puede recargar con loadSession().
/**
 * Construye el objeto de sesión (esquema HBN_SESSION_SCHEMA) con red,
 * parámetros del modelo, referencias e historial. Lo usan saveSession() y la
 * exportación ZIP.
 * @returns {object}
 */
function buildSessionObject(){
  const opc=+document.getElementById('iPore')?.value||1;
  // [FIX v13.9] Si la red activa es una geometría personalizada del
  // Constructor hBN/C o de un archivo importado (opc=99), había que guardar
  // también CUSTOM_PNB/CUSTOM_POSITIONS/IMPORTED_META/IMPORTED_GRID/
  // IMPORTED_H_SITES: sin esto, al recargar la sesión se perdía la topología
  // real y la app reconstruía una red honeycomb genérica (mismo problema
  // que corría una estructura distinta al presionar INICIAR).
  const customGeom = (opc===99 && typeof usingCustomConstructorGeometry==='function' && usingCustomConstructorGeometry())
    ? { customPNB:CUSTOM_PNB, customPositions:CUSTOM_POSITIONS, customOpenValence:CUSTOM_OPEN_VALENCE,
        importedMeta:IMPORTED_META, importedGrid:IMPORTED_GRID?Array.from(IMPORTED_GRID):null,
        importedHSites:IMPORTED_H_SITES }
    : (opc===99 && IMPORTED_GRID && IMPORTED_GRID.length===Nx*Ny)
      ? { importedMeta:IMPORTED_META, importedGrid:Array.from(IMPORTED_GRID), importedHSites:IMPORTED_H_SITES }
      : null;
  return {
    // schema 2 (v15): parámetros del modelo completos, reservorio de H y
    // referencias de formación. 'version' guarda la versión del programa.
    schema:HBN_SESSION_SCHEMA,
    version:HBN_VERSION,
    app:HBN_APP_NAME,
    timestamp:new Date().toISOString(),
    author:'Mg. M.A. Obando · Dpto. Física · Unicauca & UFOP',
    params:{
      Nx,Ny,opc,
      Ti,Tf,T,
      total,step,E,
      tMode,nRuns,
      dmuH:muH,
      hReservoir:H_RESERVOIR,
      modelParams:getModelParameters(),
      modelParamSet:MODEL_PARAM_SET,
      seed:(typeof getRandomSeed==='function')?getRandomSeed():null,
      FORM_CHEM_ENV,FORM_MU_BN_REF,FORM_DMU_H,
      EPS_XC,EPS_CH_AC,EPS_CH_ZZ,EPS_CH_DISP,
      H_OVERLAP_K,
      H_OVERLAP_DMIN,H_OVERLAP_MODE,
      FORM_MU_B,FORM_MU_N,FORM_MU_C,FORM_MU_H,FORM_DFT_TOTAL,
      hPass:hPass?1:0,
      latticeOrient,latticeStart,
      pbcX,pbcY,
      globalSwapPct
    },
    grid:Array.from(G),
    customGeometry:customGeom,
    history:{hE,hS,hT,hA,hBN}
  };
}

/**
 * [REGISTRO-DOC-EXPORT:056:saveSession]
 * Serializa parámetros, red, geometría custom e historial en un archivo JSON de sesión.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function saveSession(){
  if(!ready){addLog('Genera una estructura primero','r');return;}
  const session=buildSessionObject();
  const filename=`hBN_sesion_${Nx}x${Ny}_${Date.now()}.json`;
  const text=JSON.stringify(session,null,2);
  if(typeof saveFile==='function'){
    saveFile(filename,text,'application/json');
    return;
  }
  const blob=new Blob([text],{type:'application/json'});
  const a=document.createElement('a');
  a.download=filename;
  a.href=URL.createObjectURL(blob);
  a.click();
  addLog('Sesión guardada ✓ — puedes recargarla con Cargar sesión','g');
}

// ── Cargar sesión desde JSON ───────────────────────────────────────────
/**
 * [REGISTRO-DOC-EXPORT:057:loadSession]
 * Carga un JSON de sesión, restaura parámetros/red/historial y reconstruye estructuras derivadas.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: void.
 */
function loadSession(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='.json,application/json';
  inp.onchange=async e=>{
    const file=e.target.files[0];
    if(!file) return;
    try{
      const text=await file.text();
      const s=JSON.parse(text);
      if(!s.grid||!s.params){addLog('Archivo de sesión inválido','r');return;}
      const p=s.params;
      // [FIX v13.9] Restaurar geometría personalizada si la sesión la trae
      // (Constructor hBN/C o archivo importado). Debe hacerse ANTES de fijar
      // Nx/Ny en los sliders para poder usar el mismo candado que evita el
      // clamping de #iNx/#iNy (min=2,max=48) en estructuras grandes.
      const cg=s.customGeometry;
      if(cg){
        if(typeof CUSTOM_PNB!=='undefined') CUSTOM_PNB=Array.isArray(cg.customPNB)?cg.customPNB:null;
        if(typeof CUSTOM_POSITIONS!=='undefined') CUSTOM_POSITIONS=Array.isArray(cg.customPositions)?cg.customPositions:null;
        if(typeof CUSTOM_OPEN_VALENCE!=='undefined') CUSTOM_OPEN_VALENCE=Array.isArray(cg.customOpenValence)?cg.customOpenValence:null;
        IMPORTED_META=cg.importedMeta||null;
        IMPORTED_GRID=Array.isArray(cg.importedGrid)?new Uint8Array(cg.importedGrid):null;
        IMPORTED_H_SITES=Array.isArray(cg.importedHSites)?cg.importedHSites:[];
      } else {
        if(typeof CUSTOM_PNB!=='undefined') CUSTOM_PNB=null;
        if(typeof CUSTOM_POSITIONS!=='undefined') CUSTOM_POSITIONS=null;
        if(typeof CUSTOM_OPEN_VALENCE!=='undefined') CUSTOM_OPEN_VALENCE=null;
        IMPORTED_META=null; IMPORTED_GRID=null; IMPORTED_H_SITES=[];
      }
      // Restaurar parámetros en UI
      /**
       * [REGISTRO-DOC-EXPORT:058:setEl]
       * Restaura el valor de un control DOM durante carga de sesión.
       * Alcance: auxiliar local.
       * Parámetros: id,v.
       * Retorno: valor auxiliar o void según el contexto.
       */
      const setEl=(id,v)=>{const el=document.getElementById(id);if(el){el.value=v;}};
      // Los sliders Nx/Ny se fijan con el mismo candado (amplía min/max y
      // deshabilita) que usa el Constructor hBN/C, para no perder valores
      // grandes de Nx/Ny por el clamping del rango 2–48.
      const nxVal=p.Nx||16, nyVal=p.Ny||16;
      /**
       * [REGISTRO-DOC-EXPORT:059:lockOrSet]
       * Restaura/ajusta un control DOM considerando su estado de bloqueo.
       * Alcance: auxiliar local.
       * Parámetros: id,v.
       * Retorno: valor auxiliar o void según el contexto.
       */
      const lockOrSet=(id,v)=>{
        const el=document.getElementById(id);
        if(!el) return;
        if(cg){
          const num=Number(v)||0;
          if(num<Number(el.min)) el.min=String(num);
          if(num>Number(el.max)) el.max=String(num);
          el.value=num; el.disabled=true;
          el.title='Fijado por la geometría de la sesión cargada. Genera una red nueva en PASO 1 para volver a editar Nx/Ny.';
        } else {
          if(el.disabled){ el.disabled=false; el.min='2'; el.max='48'; el.removeAttribute('title'); }
          el.value=v;
        }
      };
      lockOrSet('iNx',nxVal); lockOrSet('iNy',nyVal);
      document.getElementById('lNx').textContent=nxVal;
      document.getElementById('lNy').textContent=nyVal;
      document.getElementById('lAt').textContent=nxVal*nyVal;
      setEl('iPore',p.opc||1);
      setEl('iTi',p.Ti||5000); setEl('iTiNum',p.Ti||5000); document.getElementById('lTi').textContent=(+p.Ti||5000).toLocaleString();
      setEl('iTf',p.Tf||500);  setEl('iTfNum',p.Tf||500);  document.getElementById('lTf').textContent=(+p.Tf||500).toLocaleString();
      setEl('iSt',p.total||50000); document.getElementById('lSt').textContent=+p.total>=1000?Math.round(+p.total/1000)+'k':p.total||'50k';
      setEl('iTmode',p.tMode||'anneal');
      setEl('iNruns',p.nRuns||1);
      // Esquema 2: Δμ_H en eV. Sesiones antiguas (v10.4) guardaban μH·100 con
      // la convención de signo/pesos corregida en v15; se restablece a 0.
      const legacy=!(+s.schema>=2);
      const dmuH=legacy?0:(+p.dmuH||0);
      if(legacy&&(+p.muH||0)!==0) addLog('Sesión antigua: μH usaba pesos 1/0.5/0.7 y signo invertido (corregido en v15). Se fija Δμ_H = 0.','w');
      setEl('iMuH',dmuH);
      setEl('iHRes',legacy?'tesis':(p.hReservoir||'tesis'));
      if(!legacy&&p.modelParams) setModelParameters(p.modelParams);
      if(!legacy&&p.FORM_MU_BN_REF){ setEl('iMuBNRef',p.FORM_MU_BN_REF); FORM_MU_BN_REF=p.FORM_MU_BN_REF==='dft'?'dft':'model'; }
      if(!legacy&&p.FORM_DMU_H!==undefined){ setEl('iDmuHForm',p.FORM_DMU_H); FORM_DMU_H=+p.FORM_DMU_H||0; }
      if(!legacy&&p.FORM_CHEM_ENV){ if(['Nrich','Brich','mid'].includes(p.FORM_CHEM_ENV)) setEl('iChemEnv',p.FORM_CHEM_ENV); FORM_CHEM_ENV=p.FORM_CHEM_ENV; }
      if(!legacy&&p.seed!==null&&p.seed!==undefined) setEl('iSeed',p.seed);
      if(p.EPS_XC!==undefined){setEl('iEpsXC',p.EPS_XC);EPS_XC=+p.EPS_XC;const l=document.getElementById('lEpsXC');if(l)l.textContent=(+p.EPS_XC).toFixed(2);}
      if(p.EPS_CH_AC!==undefined) setEl('iEpsCHAC',p.EPS_CH_AC);
      if(p.EPS_CH_ZZ!==undefined) setEl('iEpsCHZZ',p.EPS_CH_ZZ);
      if(p.H_OVERLAP_K!==undefined){setEl('iHHK',p.H_OVERLAP_K);H_OVERLAP_K=+p.H_OVERLAP_K;const l=document.getElementById('lHHK');if(l)l.textContent=H_OVERLAP_K.toFixed(2);}
      if(p.H_OVERLAP_DMIN!==undefined){setEl('iHHD',p.H_OVERLAP_DMIN);H_OVERLAP_DMIN=+p.H_OVERLAP_DMIN;const l=document.getElementById('lHHD');if(l)l.textContent=H_OVERLAP_DMIN.toFixed(2);}
      if(p.H_OVERLAP_MODE!==undefined){setEl('iHHMode',p.H_OVERLAP_MODE);H_OVERLAP_MODE=p.H_OVERLAP_MODE||'max';}
      if(p.FORM_MU_B!==undefined) setEl('iMuB',p.FORM_MU_B);
      if(p.FORM_MU_N!==undefined) setEl('iMuN',p.FORM_MU_N);
      if(p.FORM_MU_C!==undefined) setEl('iMuC',p.FORM_MU_C);
      if(p.FORM_MU_H!==undefined) setEl('iMuHForm',p.FORM_MU_H);
      if(p.FORM_DFT_TOTAL!==undefined&&p.FORM_DFT_TOTAL!==null) setEl('iEformDFT',p.FORM_DFT_TOTAL);
      readFormationReferenceInputs();
      setEl('iH',p.hPass?'1':'0');
      setEl('iOrient',p.latticeOrient||'AC');
      setEl('iStart',p.latticeStart||'B');
      if(p.pbcX!==undefined&&p.pbcY!==undefined){
        const pbcVal=p.pbcX&&p.pbcY?'XY':p.pbcX?'X':p.pbcY?'Y':'none';
        setEl('iPBC',pbcVal);
      }
      if(p.globalSwapPct!==undefined){
        setEl('iGlobal',p.globalSwapPct);
        const lg=document.getElementById('lGlobal');if(lg)lg.textContent=p.globalSwapPct+'%';
      }
      // Restaurar variables globales
      Nx=p.Nx||16; Ny=p.Ny||16;
      Ti=+p.Ti||5000; Tf=+p.Tf||500; T=+p.T||Ti;
      total=+p.total||50000; step=+p.step||0; E=+p.E||0;
      tMode=p.tMode||'anneal'; nRuns=+p.nRuns||1;
      readHydrogenReservoirInputs();
      if(p.H_OVERLAP_K!==undefined) H_OVERLAP_K=Math.max(0,+p.H_OVERLAP_K||0);
      if(p.H_OVERLAP_DMIN!==undefined) H_OVERLAP_DMIN=Math.max(0.1,+p.H_OVERLAP_DMIN||0.72);
      if(p.H_OVERLAP_MODE!==undefined) H_OVERLAP_MODE=p.H_OVERLAP_MODE||'max';
      if(p.EPS_CH_AC!==undefined) EPS_CH_AC=+p.EPS_CH_AC;
      if(p.EPS_CH_ZZ!==undefined) EPS_CH_ZZ=+p.EPS_CH_ZZ;
      if(p.EPS_CH_AC!==undefined||p.EPS_CH_ZZ!==undefined) updateCHCalibrationFromEdges(EPS_CH_AC,EPS_CH_ZZ);
      if(p.FORM_MU_B!==undefined) FORM_MU_B=+p.FORM_MU_B;
      if(p.FORM_MU_N!==undefined) FORM_MU_N=+p.FORM_MU_N;
      if(p.FORM_MU_C!==undefined) FORM_MU_C=+p.FORM_MU_C;
      if(p.FORM_MU_H!==undefined) FORM_MU_H=+p.FORM_MU_H;
      FORM_DFT_TOTAL=(p.FORM_DFT_TOTAL!==undefined&&p.FORM_DFT_TOTAL!==null)?+p.FORM_DFT_TOTAL:null;
      hPass=(+p.hPass===1);
      latticeOrient=p.latticeOrient||'AC';
      latticeStart=p.latticeStart||'B';
      pbcX=p.pbcX!==undefined?p.pbcX:true;
      pbcY=p.pbcY!==undefined?p.pbcY:true;
      globalSwapPct=+p.globalSwapPct||0;
      // Restaurar grid
      G=new Uint8Array(s.grid);
      // Restaurar historial
      if(s.history){hE=s.history.hE||[];hS=s.history.hS||[];hT=s.history.hT||[];hA=s.history.hA||[];hBN=s.history.hBN||[];}
      // Reconstruir estructuras derivadas
      window.__loadingSession=true;
      buildPhysNB();
      buildScreenPos();
      E=calcFullE();
      if(typeof refreshResearchPanel==='function') refreshResearchPanel();
      window.__loadingSession=false;
      onOrientChange();
      draw(); ui();
      addLog(`Sesión cargada ✓ — ${Nx}×${Ny} · ${step} pasos previos · E=${E.toFixed(1)} eV`,'g');
      if(cg) addLog('Geometría personalizada (Constructor hBN/C o archivo importado) restaurada desde la sesión ✓','i');
      addLog('Puedes continuar la simulación desde este estado o reiniciar con RESET','i');
    }catch(err){
      addLog('Error al cargar sesión: '+err.message,'r');
    }
  };
  inp.click();
}

// ── Exportación automática en ZIP al finalizar ────────────────────────
// Empaqueta actualmente: PNG final, PNG inicial si existe, CSV, sesión JSON, POSCAR y video si existe.
// JSZip se carga bajo demanda para que la aplicación pueda iniciar sin conexión a internet.
/**
 * Carga JSZip 3.10.1 únicamente cuando el usuario solicita una exportación ZIP.
 * La carga diferida evita bloquear el arranque de la aplicación cuando no hay red.
 * @returns {Promise<Function>} Constructor JSZip disponible en window.
 */
function ensureJSZipLoaded(){
  return new Promise((resolve,reject)=>{
    if(typeof JSZip!=='undefined'){ resolve(JSZip); return; }
    const existing=document.querySelector('script[data-jszip-loader]');
    if(existing){
      existing.addEventListener('load',()=>typeof JSZip!=='undefined'?resolve(JSZip):reject(new Error('jszip-load-failed')),{once:true});
      existing.addEventListener('error',()=>reject(new Error('jszip-load-failed')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.async=true;
    script.dataset.jszipLoader='1';
    script.onload=()=>typeof JSZip!=='undefined'?resolve(JSZip):reject(new Error('jszip-load-failed'));
    script.onerror=()=>reject(new Error('jszip-load-failed'));
    document.head.appendChild(script);
  });
}

/**
 * [REGISTRO-DOC-EXPORT:060:exportAllAsZip]
 * Empaqueta resultados principales en un ZIP: PNG, CSV, sesión JSON, POSCAR y video si existe.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: btn.
 * Retorno: Promise<void>.
 */
async function exportAllAsZip(btn){
  if(btn) btn.disabled=true;
  let JSZipCtor;
  try{
    JSZipCtor=await ensureJSZipLoaded();
  }catch(err){
    if(btn) btn.disabled=false;
    addLog('JSZip no disponible — exporta los archivos individualmente','r');
    return;
  }
  const zip=new JSZipCtor();
  const ts=Date.now();
  const prefix=`hBN_${Nx}x${Ny}_${ts}`;

  // Helper: canvas a Blob PNG
  /**
   * [REGISTRO-DOC-EXPORT:061:canvasToPNGBlob]
   * Convierte un canvas a Blob PNG para inclusión en ZIP.
   * Alcance: auxiliar local.
   * Parámetros: canvas.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function canvasToPNGBlob(canvas){
    return new Promise(res=>{
      const tmp=document.createElement('canvas');
      tmp.width=canvas.width; tmp.height=canvas.height;
      const tc=tmp.getContext('2d');
      tc.fillStyle='#ffffff'; tc.fillRect(0,0,tmp.width,tmp.height);
      tc.drawImage(canvas,0,0);
      tmp.toBlob(blob=>res(blob),'image/png');
    });
  }

  try{
    // 1. PNG configuración final
    const finalBlob=await canvasToPNGBlob(cv);
    zip.file(`${prefix}_final.png`, finalBlob);

    // 2. PNG configuración inicial
    if(G_initial&&G_initial.length===G.length){
      const Gsave=new Uint8Array(G);
      G.set(G_initial); draw();
      const initBlob=await canvasToPNGBlob(cv);
      zip.file(`${prefix}_inicial.png`, initBlob);
      G.set(Gsave); draw();
    }

    // 3. CSV
    const csvRows=buildSimulationCSV();
    zip.file(`${prefix}_datos.csv`, csvRows);

    // 4. JSON sesión
    const session=buildSessionObject();
    zip.file(`${prefix}_sesion.json`, JSON.stringify(session,null,2));

    // 5. POSCAR (texto)
    const poscarLines=buildPOSCARLines();
    if(poscarLines) zip.file(`${prefix}.vasp`, poscarLines.join('\n'));

    // 6. Video (si existe grabación)
    if(recordingState&&recordingState.blob){
      zip.file(`${prefix}_video.webm`, recordingState.blob);
    }

    // Generar y descargar ZIP
    const zipBlob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
    const zipName=`${prefix}_completo.zip`;
    if(typeof saveFile==='function'){
      await saveFile(zipName,zipBlob,'application/zip');
    } else {
      const a=document.createElement('a');
      a.download=zipName;
      a.href=URL.createObjectURL(zipBlob);
      a.click();
      addLog(`ZIP exportado ✓ — ${zipName}`,'g');
    }
    if(btn){btn.textContent='✓ ZIP exportado';btn.style.background='#f0fdf4';btn.style.color='#16a34a';btn.style.borderColor='#86efac';}
  }catch(err){
    addLog('Error generando ZIP: '+err.message,'r');
    if(btn) btn.disabled=false;
  }
}

// Helper compartido: construir líneas POSCAR (para ZIP y exportación directa)
/**
 * [REGISTRO-DOC-EXPORT:062:buildPOSCARLines]
 * Construye las líneas de un archivo POSCAR/VASP en coordenadas directas.
 * Alcance: nivel superior / interfaz interna compartida.
 * Parámetros: ninguno explícito; utiliza estado global y/o DOM cuando corresponde.
 * Retorno: Array<string> | null.
 */
function buildPOSCARLines(){
  if(!ready||!GX.length) return null;
  const d=1.44, LXa=d/2, LYa=d*Math.sqrt(3)/2, DXa=3*d, DYa=2*LYa;
  const VACUUM=20.0;
  const custom=customPositionBBox();
  const PAD=6.0;
  const cellA=custom?(custom.mxX-custom.mnX+PAD):Nx*DXa/2;
  const cellB=custom?(custom.mxY-custom.mnY+PAD):Ny*DYa/2;
  const cellC=VACUUM;
  /**
   * [REGISTRO-DOC-EXPORT:063:posAt]
   * Calcula la posición exportable de un sitio según geometría regular o custom.
   * Alcance: auxiliar local.
   * Parámetros: i,j.
   * Retorno: valor auxiliar o void según el contexto.
   */
  function posAt(i,j){
    if(custom){
      const p=CUSTOM_POSITIONS[idx(i,j)];
      if(p && Number.isFinite(p.x) && Number.isFinite(p.y)) return [p.x-custom.mnX+PAD/2, p.y-custom.mnY+PAD/2];
    }
    const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
    const xoffs=[[LXa,LXa+d],[0,2*LXa+d]];
    const x=cc*DXa+xoffs[sr][sc], y=cr*DYa+(sr===0?LYa:0);
    return latticeOrient==='ZZ'?[y,x]:[x,y];
  }
  const N_a=[],B_a=[],C_a=[],H_a=[];
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j),t=G[k];
    if(t===V_T) continue;
    const[x,y]=posAt(i,j);
    const fx=(x/cellA+10)%1, fy=(y/cellB+10)%1;
    if(t===N_T) N_a.push([fx,fy,0.5]);
    else if(t===B_T) B_a.push([fx,fy,0.5]);
    else if(t===C_T) C_a.push([fx,fy,0.5]);
    if(hPass && !custom){
      for(const[ri,rj]of rawNB(i,j)){
        const nk=mapRawNeighborIndex(ri,rj);
        if(nk!==null&&G[nk]!==V_T) continue;
        const[xn,yn]=posAt(ri,rj);
        const hfr=1.09/1.44;
        H_a.push([(( x+hfr*(xn-x))/cellA+10)%1,((y+hfr*(yn-y))/cellB+10)%1,0.5]);
      }
    }
  }
  if(hPass && custom && Array.isArray(IMPORTED_H_SITES)){
    for(const h of IMPORTED_H_SITES){
      if(!h||!Number.isFinite(h.x)||!Number.isFinite(h.y)) continue;
      const parent=h.parent??-1;
      if(parent>=0 && parent<G.length && G[parent]===V_T) continue;
      H_a.push([((h.x-custom.mnX+PAD/2)/cellA+10)%1,((h.y-custom.mnY+PAD/2)/cellB+10)%1,0.5]);
    }
  }
  const opc=+document.getElementById('iPore')?.value||1;
  const opcLabel={1:'hBN_perfect',10:'Tri-N',11:'Tri-B',14:'Hexagon',20:'h-BNC',30:'C-ribbon',43:'Graphene',99:'constructor_hBNC'}[opc]||`opc${opc}`;
  const lines=[];
  lines.push(`${HBN_APP_NAME} v${HBN_VERSION}  ${opcLabel}  Nx=${Nx} Ny=${Ny}  T=${T.toFixed(0)}K`);
  lines.push('  1.00000000');
  lines.push(`  ${cellA.toFixed(6)}  0.000000  0.000000`);
  lines.push(`  0.000000  ${cellB.toFixed(6)}  0.000000`);
  lines.push(`  0.000000  0.000000  ${cellC.toFixed(6)}`);
  const types=[],counts=[];
  if(N_a.length){types.push('N');counts.push(N_a.length);}
  if(B_a.length){types.push('B');counts.push(B_a.length);}
  if(C_a.length){types.push('C');counts.push(C_a.length);}
  if(H_a.length){types.push('H');counts.push(H_a.length);}
  lines.push('  '+types.join('    '));
  lines.push('  '+counts.join('    '));
  lines.push('Direct');
  /**
   * [REGISTRO-DOC-EXPORT:064:fmt]
   * Formatea un valor numérico para presentación o serialización.
   * Alcance: auxiliar local.
   * Parámetros: v.
   * Retorno: valor auxiliar o void según el contexto.
   */
  const fmt=v=>v.toFixed(8).padStart(14);
  /**
   * [REGISTRO-DOC-EXPORT:065:addG]
   * Añade un grupo de coordenadas al texto POSCAR.
   * Alcance: auxiliar local.
   * Parámetros: arr,lb.
   * Retorno: valor auxiliar o void según el contexto.
   */
  const addG=(arr,lb)=>arr.forEach(([fx,fy,fz])=>lines.push(`${fmt(fx)} ${fmt(fy)} ${fmt(fz)}  ! ${lb}`));
  addG(N_a,'N');addG(B_a,'B');addG(C_a,'C');addG(H_a,'H');
  lines.push('');
  lines.push(`! ${HBN_APP_NAME} v${HBN_VERSION} · Mg. Manuel Alejandro Obando`);
  lines.push(`! Dpto. Física, Unicauca, Colombia & FIMAT-UFOP, Brasil`);
  lines.push(`! E=${E.toFixed(4)} eV  T=${T.toFixed(1)} K  pbcX=${pbcX} pbcY=${pbcY}`);
  return lines;
}
