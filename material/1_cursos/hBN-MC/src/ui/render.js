// render.js — renderizado 2D, mini-gráficas, estado visual y ciclo de ejecución
'use strict';

/**
 * Módulo de presentación y ciclo interactivo de hBN-MC.
 *
 * Responsabilidades principales:
 *   1. Renderizar la red atómica, enlaces, H de pasivación, poros y especies volátiles.
 *   2. Mantener las mini-gráficas y los indicadores numéricos de la interfaz.
 *   3. Inicializar una corrida a partir de los controles de usuario.
 *   4. Ejecutar el ciclo temporal que coordina los pasos Monte Carlo y la animación.
 *   5. Consolidar la salida visual y estadística al finalizar una corrida.
 *
 * Este módulo consume el estado físico definido en core.js, pero no define el
 * Hamiltoniano ni las reglas de ΔE. Las decisiones energéticas se delegan a
 * calcFullE(), calcDeltaE()/calcDeltaE_global(), metro() y metro_global().
 */

// ─────────────────────────────────────────────────────────────────────
// 1. RENDERIZADO 2D PRINCIPAL
// ─────────────────────────────────────────────────────────────────────
/**
 * Renderiza el estado completo de la simulación sobre el Canvas 2D principal.
 *
 * Dibuja fondo, enlaces, H de pasivación, overlay de poros, átomos, vacancias
 * de borde, especies volátiles y el estado transitorio de las animaciones.
 * La función es puramente visual respecto del modelo físico: consulta G, PNB,
 * GX/GY y banderas de vista, pero no ejecuta movimientos Monte Carlo.
 *
 * @returns {void}
 */
function draw(){
  const W=cv.width,H=cv.height;
  if(W<10||H<10) return;
  ctx.clearRect(0,0,W,H);
  // Fondo claro
  ctx.fillStyle='#e2e8f0'; ctx.fillRect(0,0,W,H);

  if(!ready||!GX.length||GX.length<Nx*Ny) return;

  ctx.save();
  apply2DViewport(ctx,W,H);

  const r=Math.max(0.8,SCALE*D*0.34);
  const rH=Math.max(0.5,r*0.28);
  const lw=Math.max(1.0,r*0.28); // más grueso para que se vean bien
  const MAX_B=SCALE*D*1.35;
  const ovl=document.getElementById('iOvl')?.value||'off';
  const hideVolatile2D=!!VIEW_FLAGS.hideVolatile2D;
  const volatileMarkerMask=getVolatileSpeciesMask();
  const volatileMask=hideVolatile2D?volatileMarkerMask:null;
  const viewType=(k)=>volatileMask&&volatileMask[k]?V_T:G[k];

  const anim=SA&&AS.p<1;
  const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
  const ep=anim?ease(AS.p):0;
  const gx=(i,j)=>{const k=idx(i,j);if(!anim)return GX[k];if(i===AS.i1&&j===AS.j1)return AS.x1+(AS.x2-AS.x1)*ep;if(i===AS.i2&&j===AS.j2)return AS.x2+(AS.x1-AS.x2)*ep;return GX[k];};
  const gy=(i,j)=>{const k=idx(i,j);if(!anim)return GY[k];if(i===AS.i1&&j===AS.j1)return AS.y1+(AS.y2-AS.y1)*ep;if(i===AS.i2&&j===AS.j2)return AS.y2+(AS.y1-AS.y2)*ep;return GY[k];};

  // Precomputar vacBorde: vacante con al menos un vecino átomo = borde del poro
  // Vacante rodeada solo de vacantes = interior del poro (agujero real, no se dibuja)
  const vacBorde=new Uint8Array(Nx*Ny);
  if(ready){
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
      const k=idx(i,j);
      if(viewType(k)!==V_T) continue;
      for(const[ni,nj]of PNB[k]){
        if(viewType(idx(ni,nj))!==V_T){vacBorde[k]=1;break;}
      }
    }
  }

  // ── ENLACES ────────────────────────────────────────────────────────
  // Colores por tipo de enlace — bien visibles sobre fondo claro
  const BOND={
    NB:'rgba(22,163,74,0.85)',   // N–B: verde medio (el más común, el más visible)
    NN:'rgba(37,99,235,0.70)',   // N–N: azul
    BB:'rgba(21,128,61,0.70)',   // B–B: verde oscuro
    CC:'rgba(71,85,105,0.80)',   // C–C: gris oscuro
    CN:'rgba(124,58,237,0.75)',  // C–N: violeta
    CB:'rgba(5,150,105,0.75)',   // C–B: teal
    VAC:'rgba(148,163,184,0.50)',// vacancia
  };
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    const a=viewType(k); const x1=gx(i,j),y1=gy(i,j);
    for(const[ni,nj]of PNB[k]){
      const nk=idx(ni,nj);
      if(nk<=k) continue;
      const b=viewType(nk); const x2=gx(ni,nj),y2=gy(ni,nj);
      if(Math.hypot(x2-x1,y2-y1)>MAX_B) continue;
      let col,bw=lw;
      if(a!==V_T&&b!==V_T){
        // Enlace entre dos átomos reales
        if((a===N_T&&b===B_T)||(a===B_T&&b===N_T)){col=BOND.NB;bw=lw*1.15;}
        else if(a===N_T&&b===N_T) col=BOND.NN;
        else if(a===B_T&&b===B_T) col=BOND.BB;
        else if(a===C_T&&b===C_T){col=BOND.CC;bw=lw*1.1;}
        else if((a===C_T&&b===N_T)||(a===N_T&&b===C_T)) col=BOND.CN;
        else if((a===C_T&&b===B_T)||(a===B_T&&b===C_T)) col=BOND.CB;
        else col=BOND.NB;
      } else if(a===V_T&&b===V_T){
        // Dos vacancias: interior del poro → NO dibujar
        continue;
      } else {
        // Un átomo y una vacancia → el H se dibuja en la sección H EN BORDES
        continue;
      }
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=bw;
      ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
      // flash animación en enlace que cambia
      if(anim&&AS.p>0.1&&AS.p<0.9&&
        ((i===AS.i1&&j===AS.j1)||(i===AS.i2&&j===AS.j2)||
         (ni===AS.i1&&nj===AS.j1)||(ni===AS.i2&&nj===AS.j2))){
        const fl=Math.sin(AS.p*Math.PI*2)*0.65;
        ctx.beginPath();ctx.strokeStyle=`rgba(251,146,60,${fl})`;
        ctx.lineWidth=bw*2.8;
        ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
      }
    }
  }

  // ── H EN BORDES Y POROS ───────────────────────────────────────────
  // Usa la misma geometría que el cálculo energético: H en vacancias de poro
  // y H en bordes abiertos cuando la celda solo es periódica en un eje.
  if(hPass&&rH>=0.6){
    const hs=(typeof collectPassivationHydrogensScreen==='function')?collectPassivationHydrogensScreen():[];
    for(const h of hs){
      const k=h.parent;
      if(k<0||k>=Nx*Ny||viewType(k)===V_T) continue;
      const x1=GX[k], y1=GY[k];
      const hx=h.x, hy=h.y;
      // Evitar dibujar H de imágenes periódicas demasiado alejadas del canvas visible.
      if(Math.hypot(hx-x1,hy-y1)>MAX_B*1.1) continue;
      ctx.beginPath();ctx.strokeStyle=h.kind==='edge'?'rgba(234,88,12,0.62)':'rgba(148,163,184,0.60)';
      ctx.lineWidth=Math.max(0.5,lw*0.55);
      ctx.moveTo(x1,y1);ctx.lineTo(hx,hy);ctx.stroke();
      ctx.beginPath();ctx.arc(hx,hy,Math.max(0.5,rH),0,Math.PI*2);
      ctx.fillStyle=COL_H;ctx.fill();
      ctx.strokeStyle=h.kind==='edge'?'#ea580c':COL_H_B;
      ctx.lineWidth=Math.max(0.4,rH*0.25);ctx.stroke();
      if(rH>5){
        ctx.fillStyle='#64748b';
        ctx.font=`bold ${Math.max(6,Math.floor(rH*1.1))}px sans-serif`;
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('H',hx,hy);
      }
    }
  }

  // ── PORE OVERLAY (antes de átomos para que quede debajo) ────────────
  drawPoreOverlay(ovl,r,volatileMask);

  // ── TRAIL ANIMACIÓN ────────────────────────────────────────────────
  if(anim&&r>3){
    const{x1,y1,x2,y2,t1,t2}=AS;
    [[x1,y1,x2,y2,t1],[x2,y2,x1,y1,t2]].forEach(([ax,ay,bx,by,tp])=>{
      const col=tp===N_T?'37,99,235':'22,163,74';
      for(let tr=4;tr>=0;tr--){
        const te=Math.max(0,ep-tr*0.07),tx=ax+(bx-ax)*te,ty=ay+(by-ay)*te;
        const alpha=(1-tr/4)*0.2*Math.sin(AS.p*Math.PI);
        if(alpha<0.01) continue;
        ctx.beginPath();ctx.arc(tx,ty,Math.max(0.5,r*(1-tr*0.11)),0,Math.PI*2);
        ctx.fillStyle=`rgba(${col},${alpha})`;ctx.fill();
      }
    });
  }

  // ── ÁTOMOS ────────────────────────────────────────────────────────
  // vacBorde ya está computado arriba (antes de ENLACES)

  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);const x=gx(i,j),y=gy(i,j);const tp=viewType(k);
    if(tp===V_T){
      if(vacBorde[k]){
        // Vacancia de BORDE: pequeño indicador de sitio vacío
        // (el átomo fue expulsado — solo se marca el sitio de red)
        ctx.beginPath();ctx.arc(x,y,Math.max(0.5,r*0.15),0,Math.PI*2);
        ctx.fillStyle='rgba(148,163,184,0.35)';ctx.fill();
      }
      // Interior del poro: NO dibujar nada → es un agujero real
      // (físicamente: los átomos fueron expulsados por irradiación)
      continue;
    }
    const isA=anim&&((i===AS.i1&&j===AS.j1)||(i===AS.i2&&j===AS.j2));
    const rr=Math.max(0.8,isA?r*(1+0.14*Math.sin(AS.p*Math.PI)):r);
    const [cL,cM,cD]=tp===N_T?[COL_N_L,COL_N,COL_N_D]:
                      tp===B_T?[COL_B_L,COL_B,COL_B_D]:
                               [COL_C_L,COL_C,COL_C_D];
    // Glow suave
    if(rr>5){
      try{
        const rg=rr*2.1;
        const gl=ctx.createRadialGradient(x,y,0,x,y,rg);
        gl.addColorStop(0,cM+'28');gl.addColorStop(1,cM+'00');
        ctx.beginPath();ctx.arc(x,y,rg,0,Math.PI*2);ctx.fillStyle=gl;ctx.fill();
      }catch(_){}
    }
    // Cuerpo con gradiente esférico
    try{
      const gr=ctx.createRadialGradient(x-rr*.3,y-rr*.3,Math.max(0.05,rr*.04),x,y,rr);
      gr.addColorStop(0,cL);gr.addColorStop(.45,cM);gr.addColorStop(1,cD);
      ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fillStyle=gr;ctx.fill();
    }catch(_){
      ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fillStyle=cM;ctx.fill();
    }
    // Borde
    ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);
    ctx.strokeStyle=isA?'rgba(251,146,60,0.9)':'rgba(255,255,255,0.45)';
    ctx.lineWidth=isA?1.8:0.7;ctx.stroke();
    // Etiqueta
    if(rr>10){
      ctx.fillStyle='#fff';
      ctx.font=`bold ${Math.max(8,Math.floor(rr*.65))}px sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(tp===N_T?'N':tp===B_T?'B':'C',x,y);
    }
  }
  drawVolatileMarkers2D(r,volatileMarkerMask,gx,gy,MAX_B);
  ctx.restore();
  if(typeof renderRecordingFrame==='function') renderRecordingFrame();
}


// ─────────────────────────────────────────────────────────────────────
// 2. ESPECIES VOLÁTILES EN LA VISTA 2D
// ─────────────────────────────────────────────────────────────────────

/**
 * Sincroniza el texto, estilo y atributo aria-pressed del botón que controla
 * la visibilidad 2D de especies volátiles BH₃/NH₃.
 *
 * @returns {void}
 */
function update2DVolatileButton(){
  const btn=document.getElementById('btn2DVolatile');
  if(!btn) return;
  const on=!!VIEW_FLAGS.hideVolatile2D;
  btn.textContent=on?'BH₃/NH₃ ocultos':'BH₃/NH₃ visibles';
  btn.setAttribute('aria-pressed',on?'true':'false');
  btn.style.background=on?'#dbeafe':'#f8fafc';
  btn.style.color=on?'#1d4ed8':'#1e293b';
  btn.style.border=on?'1px solid #93c5fd':'none';
}
/**
 * Activa, desactiva o alterna la ocultación de especies volátiles en 2D.
 *
 * @param {boolean} [forceValue] Valor explícito; si se omite, alterna el estado.
 * @returns {void}
 */
function toggle2DVolatileVisibility(forceValue){
  VIEW_FLAGS.hideVolatile2D = typeof forceValue==='boolean' ? forceValue : !VIEW_FLAGS.hideVolatile2D;
  update2DVolatileButton();
  if(ready) draw();
}


/**
 * Dibuja los marcadores 2D de especies volátiles sobre los sitios indicados.
 *
 * @param {number} r Radio visual base de los átomos.
 * @param {Uint8Array|Array<number>} volatileMarkerMask Máscara de sitios volátiles.
 * @param {Function} gx Conversor de índice de red a coordenada X visual.
 * @param {Function} gy Conversor de índice de red a coordenada Y visual.
 * @param {number} maxBondLength Longitud máxima admisible para representar un enlace.
 * @returns {void}
 */
function drawVolatileMarkers2D(r,volatileMarkerMask,gx,gy,maxBondLength){
  if(!volatileMarkerMask||r<3) return;
  ctx.save();
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    if(!volatileMarkerMask[k]||G[k]===V_T) continue;
    const style=getVolatileSpeciesMarkerStyle(G[k]);
    const x=gx(i,j), y=gy(i,j);
    const ringR=Math.max(r*1.55,8);
    ctx.beginPath();
    ctx.arc(x,y,ringR,0,Math.PI*2);
    ctx.fillStyle=style.fill;
    ctx.fill();
    ctx.setLineDash([Math.max(3,r*0.45),Math.max(2,r*0.35)]);
    ctx.lineWidth=Math.max(1.2,r*0.16);
    ctx.strokeStyle=style.stroke;
    ctx.stroke();
    ctx.setLineDash([]);

    let spokeCount=0;
    for(const [ni,nj] of PNB[k]){
      const nk=idx(ni,nj);
      if(G[nk]!==V_T) continue;
      const vx=gx(ni,nj), vy=gy(ni,nj);
      const dist=Math.hypot(vx-x,vy-y);
      if(dist>maxBondLength) continue;
      const hx=x+(vx-x)*0.56, hy=y+(vy-y)*0.56;
      ctx.beginPath();
      ctx.moveTo(x,y); ctx.lineTo(hx,hy);
      ctx.strokeStyle=style.stroke;
      ctx.lineWidth=Math.max(1.0,r*0.12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx,hy,Math.max(1.8,r*0.19),0,Math.PI*2);
      ctx.fillStyle='#f8fafc';
      ctx.fill();
      ctx.strokeStyle=style.stroke;
      ctx.lineWidth=Math.max(0.8,r*0.10);
      ctx.stroke();
      spokeCount++;
    }
    if(spokeCount===0){
      for(let m=0;m<3;m++){
        const ang=-Math.PI/2 + m*(2*Math.PI/3);
        const hx=x+Math.cos(ang)*ringR*0.85, hy=y+Math.sin(ang)*ringR*0.85;
        ctx.beginPath();
        ctx.arc(hx,hy,Math.max(1.6,r*0.18),0,Math.PI*2);
        ctx.fillStyle='#f8fafc';
        ctx.fill();
        ctx.strokeStyle=style.stroke;
        ctx.lineWidth=Math.max(0.8,r*0.10);
        ctx.stroke();
      }
    }

    const ly=y-ringR-Math.max(7,r*0.55);
    ctx.font=`700 ${Math.max(10,Math.floor(r*0.62))}px sans-serif`;
    ctx.lineWidth=Math.max(2.5,r*0.18);
    ctx.strokeStyle='rgba(255,255,255,0.96)';
    ctx.strokeText(style.label,x,ly);
    ctx.fillStyle=style.accent;
    ctx.fillText(style.label,x,ly);
  }
  ctx.restore();
}

// ── Mini gráficas ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
// 3. MINI-GRÁFICAS DE MONITORIZACIÓN
// ─────────────────────────────────────────────────────────────────────

/**
 * Renderiza una serie temporal compacta en un Canvas auxiliar.
 *
 * @param {string} id ID del Canvas de destino.
 * @param {number[]} data Serie numérica a representar.
 * @param {string} color Color CSS de la serie.
 * @param {string} valId ID del elemento que muestra el último valor.
 * @returns {void}
 */
function miniChart(id,data,color,valId){
  const c=document.getElementById(id);if(!c||!c.parentElement)return;
  const W=c.parentElement.clientWidth||230,H=parseInt(c.getAttribute('height'))||70;
  c.width=W;c.height=H;
  const x=c.getContext('2d');
  x.clearRect(0,0,W,H);x.fillStyle='#fff';x.fillRect(0,0,W,H);
  if(data.length<2)return;
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const pt=18,pb=4,pl=6,pr=6,pw=W-pl-pr,ph=H-pt-pb;
  // Líneas de cuadrícula
  x.strokeStyle='rgba(226,232,240,0.8)';x.lineWidth=0.8;
  for(let g=0;g<=3;g++){const y2=pt+ph*g/3;x.beginPath();x.moveTo(pl,y2);x.lineTo(W-pr,y2);x.stroke();}
  // Etiqueta min/max
  x.fillStyle='#94a3b8';x.font=`${Math.max(8,Math.floor(H*0.14))}px sans-serif`;
  x.textAlign='right';x.fillText(mx.toFixed(0),W-pr-2,pt+4);
  x.fillText(mn.toFixed(0),W-pr-2,pt+ph-2);
  // Área rellena
  x.beginPath();
  data.forEach((v,i)=>{const px2=pl+pw*i/(data.length-1),py=pt+ph*(1-(v-mn)/rng);i===0?x.moveTo(px2,py):x.lineTo(px2,py);});
  x.lineTo(pl+pw,pt+ph);x.lineTo(pl,pt+ph);x.closePath();
  try{const f=x.createLinearGradient(0,pt,0,pt+ph);f.addColorStop(0,color+'55');f.addColorStop(1,color+'08');x.fillStyle=f;}
  catch(_){x.fillStyle=color+'22';}
  x.fill();
  // Línea
  x.beginPath();
  data.forEach((v,i)=>{const px2=pl+pw*i/(data.length-1),py=pt+ph*(1-(v-mn)/rng);i===0?x.moveTo(px2,py):x.lineTo(px2,py);});
  x.strokeStyle=color;x.lineWidth=2;x.stroke();
  // Punto final
  const lv=data[data.length-1];
  x.beginPath();x.arc(pl+pw,pt+ph*(1-(lv-mn)/rng),3.5,0,Math.PI*2);x.fillStyle=color;x.fill();
  x.strokeStyle='#fff';x.lineWidth=1.5;x.stroke();
  // Valor actual
  const el=document.getElementById(valId);
  if(el)el.textContent=Math.abs(lv)>9999?lv.toFixed(0):lv.toFixed(1);
}

/**
 * Dibuja E frente a T como trayectoria. En el modo 'cycle' el tramo de
 * calentamiento y el de enfriamiento se distinguen por color, lo que permite
 * ver la histéresis térmica.
 *
 * @param {string} id ID del Canvas de destino.
 * @param {number[]} xs Temperaturas.
 * @param {number[]} ys Energías.
 * @returns {void}
 */
function miniChartXY(id,xs,ys){
  const c=document.getElementById(id);if(!c||!c.parentElement)return;
  const W=c.parentElement.clientWidth||230,H=parseInt(c.getAttribute('height'))||110;
  c.width=W;c.height=H;
  const x=c.getContext('2d');
  x.clearRect(0,0,W,H);x.fillStyle='#fff';x.fillRect(0,0,W,H);
  const n=Math.min(xs.length,ys.length);
  if(n<2)return;
  const xmn=Math.min(...xs.slice(0,n)),xmx=Math.max(...xs.slice(0,n));
  const ymn=Math.min(...ys.slice(0,n)),ymx=Math.max(...ys.slice(0,n));
  const xr=xmx-xmn||1,yr=ymx-ymn||1;
  const pl=8,pr=8,pt=14,pb=14,pw=W-pl-pr,ph=H-pt-pb;
  const px=(v)=>pl+pw*(v-xmn)/xr, py=(v)=>pt+ph*(1-(v-ymn)/yr);
  x.strokeStyle='rgba(226,232,240,0.8)';x.lineWidth=0.8;
  for(let g=0;g<=3;g++){const y2=pt+ph*g/3;x.beginPath();x.moveTo(pl,y2);x.lineTo(W-pr,y2);x.stroke();}
  // Punto de retorno: máximo de T para el ciclo; si no, se dibuja un solo tramo.
  let turn=n;
  if(tMode==='cycle'){let im=0;for(let i=1;i<n;i++) if(xs[i]>xs[im]) im=i; turn=im+1;}
  const seg=(a,b,color)=>{
    if(b-a<2) return;
    x.beginPath();
    for(let i=a;i<b;i++){i===a?x.moveTo(px(xs[i]),py(ys[i])):x.lineTo(px(xs[i]),py(ys[i]));}
    x.strokeStyle=color;x.lineWidth=1.8;x.stroke();
  };
  seg(0,Math.min(turn,n),'#dc2626');
  if(turn<n) seg(turn-1,n,'#2563eb');
  x.fillStyle='#94a3b8';x.font='9px sans-serif';
  x.textAlign='left';x.fillText(`${xmn.toFixed(0)} K`,pl,H-3);
  x.textAlign='right';x.fillText(`${xmx.toFixed(0)} K`,W-pr,H-3);
  x.fillText(ymx.toFixed(0),W-pr,pt-3);
  if(tMode==='cycle'){x.textAlign='left';x.fillStyle='#dc2626';x.fillText('calentamiento',pl+34,pt-3);
    x.fillStyle='#2563eb';x.fillText('enfriamiento',pl+106,pt-3);}
}

// ── Update UI ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
// 4. ACTUALIZACIÓN DE INDICADORES DE INTERFAZ
// ─────────────────────────────────────────────────────────────────────

/**
 * Sincroniza la interfaz con el estado actual de la simulación.
 *
 * Actualiza energía, temperatura, progreso, aceptación, energía de formación,
 * penalización H-H, composición, conteos de enlaces y mini-gráficas.
 *
 * @returns {void}
 */
function ui(){
  const tot=accepted+rejected||1;
  const pctA=(accepted/tot*100).toFixed(1);
  const pctP=Math.min(100,step/total*100).toFixed(0);
  document.getElementById('hE').textContent=E.toFixed(0);
  document.getElementById('hT').textContent=T.toFixed(0);
  document.getElementById('hS').textContent=step.toLocaleString();
  document.getElementById('hAcc').textContent=pctA;
  document.getElementById('pf').style.width=pctP+'%';
  document.getElementById('pct').textContent=pctP+'%';
  document.getElementById('sE').textContent=E.toFixed(1)+' eV';
  const hBox=document.getElementById('hPenaltyBox');
  if(hBox&&typeof calcHOverlapPenalty==='function'&&hPass){
    const hp=calcHOverlapPenalty(G);
    hBox.style.display='';
    const hov=document.getElementById('sHHOverlap'); if(hov) hov.textContent=hp.nOverlap.toLocaleString();
    const he=document.getElementById('sHHEnergy'); if(he) he.textContent=`E_HH=${hp.energy.toFixed(4)} eV · modo=${hp.mode} · geom=${hp.geomPairs}/${hp.geomEnergy.toFixed(2)} eV · topo=${hp.topoPairs}/${hp.topoEnergy.toFixed(2)} eV · H=${hp.nH} · d_min=${hp.minDist?hp.minDist.toFixed(3):'—'} Å`;
  } else if(hBox) hBox.style.display='none';

  const formBox=document.getElementById('formBox');
  const formv=typeof calcFormationEnergyDFTLike==='function'?calcFormationEnergyDFTLike():null;
  if(formBox&&formv){
    formBox.style.display='';
    const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;};
    set('sFormE',formv.Eform.toFixed(4));
    set('sFormPerAtom',formv.perH!==null?formv.perH.toFixed(4):'—');
    const envName={Nrich:'rico en N',Brich:'rico en B',mid:'intermedio',custom:'manual'}[formv.env]||formv.env;
    set('sFormDetail',`ambiente ${envName} · μ_BN=${formv.muBNref==='dft'?'E(BN) DFT':'3ε_NB'} · B=${formv.nB} · N=${formv.nN} · C=${formv.nC} · H=${formv.nH} · Vac=${formv.nV}${formv.EHH>0?` · penalización H–H aparte: +${formv.EHH.toFixed(2)} eV`:''}`);
    set('sFormDFTDelta',formv.deltaDFT!==null?`Δ vs DFT = ${formv.deltaDFT.toFixed(4)} eV`: '');
  } else if(formBox) formBox.style.display='none';
  document.getElementById('sT').textContent=T.toFixed(0)+' K';
  document.getElementById('sA').textContent=accepted.toLocaleString();
  document.getElementById('sR').textContent=rejected.toLocaleString();
  document.getElementById('legE').textContent='E='+E.toFixed(0)+' eV';
  const counts=getSpeciesCounts();
  const setTxt=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
  setTxt('sCountN', counts.nN.toLocaleString());
  setTxt('sCountB', counts.nB.toLocaleString());
  setTxt('sCountC', counts.nC.toLocaleString());
  setTxt('sCountV', counts.nV.toLocaleString());
  setTxt('sCountAtoms', counts.nAtoms.toLocaleString());
  setTxt('sCountSites', counts.nSites.toLocaleString());
  const bc=countBonds();
  const maxB=Math.max(bc.cNB,bc.cNN,bc.cBB,bc.cXN,bc.cXB,bc.cXX,bc.cCC,bc.cCN,bc.cCB,bc.cXC,1);
  const setB=(tid,bid,val)=>{const el=document.getElementById(tid);if(el)el.textContent=val;const bar=document.getElementById(bid);if(bar)bar.style.width=Math.round(val/maxB*55)+'px';};
  setB('tNB','bNB',bc.cNB);setB('tNN','bNN',bc.cNN);setB('tBB','bBB',bc.cBB);
  setB('tCC','bCC',bc.cCC||0);setB('tCN','bCN',bc.cCN||0);setB('tCB','bCB',bc.cCB||0);
  setB('tXN','bXN',bc.cXN);setB('tXB','bXB',bc.cXB);setB('tXC','bXC',bc.cXC||0);setB('tXX','bXX',bc.cXX);
  // ε efectivos del Monte Carlo (parámetros activos + reservorio de H).
  [['epNB',EPS_NB],['epNN',EPS_NN],['epBB',EPS_BB],['epCC',EPS_CC],['epCN',EPS_CN],['epCB',EPS_CB],
   ['epXN',epsEff(V_T,N_T)],['epXB',epsEff(V_T,B_T)],['epXC',epsEff(V_T,C_T)],['epXX',epsVacVac()]]
    .forEach(([id,v])=>setTxt(id,v.toFixed(2).replace('-','−')));
  // [FIX] solo actualizar gráficas si hay datos
  if(hE.length>1){
    miniChart('gE',hE,'#7c3aed','gEv');
    miniChart('gT',hT,'#b45309','gTv');
    miniChart('gA',hA,'#16a34a','gAv');
    miniChart('gB',hBN,'#2563eb','gBv');
    miniChartXY('gET',hT,hE);
  }
}

// ── Init ──────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
// 5. INICIALIZACIÓN DE UNA CORRIDA
// ─────────────────────────────────────────────────────────────────────

/**
 * Inicializa una corrida a partir de los controles de la interfaz.
 *
 * Lee dimensiones y condiciones físicas, construye la geometría y vecinos,
 * calcula E y E_ref, reinicia históricos/contadores y registra la composición
 * inicial. En geometrías importadas/custom preserva las dimensiones reales.
 *
 * @returns {void}
 */
function init(){
  ready=false;
  // [FIX v13.9] misma protección que initParams(): no pisar Nx/Ny reales de
  // una geometría personalizada con los valores (posiblemente clampados por
  // el slider #iNx/#iNy) leídos del DOM. Ver comentario detallado en
  // controls.js → initParams().
  const keepCustomDims = typeof hasConsistentImportedGeometry==='function' && hasConsistentImportedGeometry();
  if(!keepCustomDims){
    Nx=+document.getElementById('iNx').value;
    Ny=+document.getElementById('iNy').value;
  }
  tMode=document.getElementById('iTmode')?.value||'anneal';
  readHydrogenReservoirInputs();
  nRuns=+(document.getElementById('iNruns')?.value||1);
  const opc=+document.getElementById('iPore').value;
  isCarbon=(opc===20)||(opc===4)||(opc>=30&&opc!==99);
  // Leer orientación de la red
  latticeOrient=document.getElementById('iOrient')?.value||'AC';
  latticeStart=document.getElementById('iStart')?.value||'B';
  // Periodicidad por eje
  const pbcMode=document.getElementById('iPBC')?.value||'XY';
  pbcX=(pbcMode==='XY'||pbcMode==='X');
  pbcY=(pbcMode==='XY'||pbcMode==='Y');
  if(!keepCustomDims && typeof enforcePeriodicGridParity==='function') enforcePeriodicGridParity(true,true);
  // Porcentaje de intercambio global para h-BN puro
  globalSwapPct=isCarbon?0:+(document.getElementById('iGlobal')?.value||0);

  // Para segregación de C: ajustar parámetros automáticamente
  Ti=+document.getElementById('iTi').value;
  Tf=+document.getElementById('iTf').value;T=Ti;
  total=+document.getElementById('iSt').value;
  hPass=document.getElementById('iH').value==='1';
  H_OVERLAP_K=Math.max(0,+(document.getElementById('iHHK')?.value??H_OVERLAP_K));
  H_OVERLAP_DMIN=Math.max(0.1,+(document.getElementById('iHHD')?.value??H_OVERLAP_DMIN));
  const vf=(opc===99)?0:(+document.getElementById('iVac').value/100);
  const psz=+document.getElementById('iPsz').value;
  const spd=document.getElementById('iSpd').value;
  doAnim=spd==='normal'||spd==='slow';
  accepted=0;rejected=0;step=0;SA=null;AS.p=1;
  hE=[];hS=[];hT=[];hA=[];hBN=[];

  const nVac=Math.floor(Nx*Ny*vf);
  buildGrid(opc,nVac,psz);
  buildPhysNB();
  buildScreenPos();
  E=calcFullE();
  hE.push(E);hS.push(0);hT.push(T);hA.push(0);hBN.push(countBonds().cNB);

  const opcLabels={1:'Red perfecta',2:'Real+vac',3:'Aleatoria',
    6:'Paralelogramo',7:'Triangular',8:'Aleatorio',
    10:'Tri-N',11:'Tri-B',12:'Paralelogramo A',13:'Paralelogramo B',14:'Hexágono',
    20:'h-BNC (carbono)',30:'Fita C horiz.(BNC)',31:'Fita C vert.(BNC)',32:'Heteroestr. BNC',33:'BN en C',34:'C|BN|C',40:'Fita C pura',41:'Fita BN pura',42:'C|BN|C 3z',43:'Grafeno puro',44:'BN aislada',99:'Geometría importada'};
  addLog(`n=${N}×${N} · ${opcLabels[opc]||opc} · T:${Ti}→${Tf}K`,'i');
  if(opc===20){
    addLog(`C=${nVac} átomos (${(vf*100).toFixed(0)}%) · intercambio mixto 70%local+30%global`,'w');
    const dMix=(EPS_CN+EPS_CB)-(EPS_CC+EPS_NB);
    addLog(`ΔE_mix=(ε_CN+ε_CB)−(ε_CC+ε_NB)=${dMix>=0?'+':''}${dMix.toFixed(2)} eV → ${dMix>0?'inmiscible':'miscible'} · escala ΔE/k_B≈${Math.round(Math.abs(dMix)/KB).toLocaleString()} K`,'');
  } else if([30,31,32].includes(opc)){
    const fw=document.getElementById('iFw')?.value||3;
    const ft=document.getElementById('iFt')?.value||'arm';
    const ftL={arm:'armchair',zN:'zigzag-N',zB:'zigzag-B'}[ft]||ft;
    addLog(`Fita C ancho=${fw} · terminación ${ftL} · intercambio mixto`,'w');
  } else {
    addLog(`E₀=${E.toFixed(1)} eV · vac=${nVac} · H=${hPass?'sí':'no'}`,'');
  }
  const counts=getSpeciesCounts();
  addLog(`Composición: N=${counts.nN} · B=${counts.nB} · C=${counts.nC} · V=${counts.nV} · total=${counts.nAtoms}`,'i');
}

// ── Bucle MC ──────────────────────────────────────────────────────────
// Duración de la interpolación visual de un intercambio por modo de velocidad.
const ANIM_DUR={normal:160,slow:290};
// Retardo mínimo entre frames de cálculo por modo de velocidad.
const FDELAY={turbo:0,fast:14,normal:38,slow:80};
// Timestamp del último frame procesado y bandera de estrategia para sistemas con C.
let lastF=0;
let isCarbon=false; // flag para usar metro_global

// ─────────────────────────────────────────────────────────────────────
// 6. CICLO DE SIMULACIÓN MONTE CARLO
// ─────────────────────────────────────────────────────────────────────

/**
 * Ejecuta un frame del ciclo interactivo de simulación.
 *
 * Coordina animación, limitación de frecuencia, calendario de temperatura,
 * selección local/global de movimientos, muestreo de históricos y redibujado.
 * Las decisiones físicas de aceptación se delegan a metro()/metro_global().
 *
 * @param {number} ts Marca temporal de requestAnimationFrame en milisegundos.
 * @returns {void}
 */
function loop(ts){
  if(!run||!ready||paused) return;
  const spd=document.getElementById('iSpd').value;
  if(SA&&doAnim&&AS.p<1){
    AS.p=Math.min(1,(ts-AS.ts)/(ANIM_DUR[spd]||160));
    draw();
    if(AS.p<1){raf=requestAnimationFrame(loop);return;}
    SA=null;AS.p=1;
  }
  const fd=FDELAY[spd]||14;
  if(fd>0&&ts-lastF<fd){raf=requestAnimationFrame(loop);return;}
  lastF=ts;
  const spf=spd==='turbo'?Math.max(200,total/120):spd==='fast'?Math.max(20,total/350):spd==='normal'?Math.max(5,total/550):2;
  const rec=Math.max(1,Math.floor(total/HMAX));
  let lastSwap=null;
  // Fracción de intercambio global: carbono=30%, h-BN puro según globalSwapPct.
  // En geometrías explícitas del Constructor hBN/C no se fuerza el 30% de carbono:
  // la política importada controla si puede moverse algo y el slider controla solo
  // intentos globales permitidos por esa política.
  const globalFrac=usingCustomConstructorGeometry()?((importedMCPolicy==='fixed')?0:(globalSwapPct/100)):(isCarbon?0.30:(globalSwapPct/100));
  for(let s=0;s<spf&&step<total;s++){
    // Temperatura según el protocolo (misma función que el modo lote).
    T=temperatureAtStep(step,total);
    curPhase=temperaturePhaseAtStep(step,total);
    // Selección de algoritmo según modo:
    // globalFrac=0 → solo primeros vecinos (metro)
    // globalFrac>0 → mezcla local+global (mejora ergodicidad a T baja)
    // Para carbono: 30% global fijo (Martins & Chacham, ACS Nano 2010)
    // Para h-BN puro: ajustable por slider (0..50%) — 0 preserva comportamiento previo
    const res=(globalFrac>0&&rand()<globalFrac)?metro_global():metro(); // [v14.0] rand() reproducible
    step++;
    if(res?.ok) lastSwap=res;
    if(step%rec===0){
      const t2=accepted+rejected||1;
      hE.push(E);hS.push(step);hT.push(T);hA.push(accepted/t2*100);hBN.push(countBonds().cNB);
    }
  }
  if(lastSwap&&doAnim&&!isCarbon){
    const{i1,j1,i2,j2,t1,t2}=lastSwap;
    const x1=GX[idx(i1,j1)],y1=GY[idx(i1,j1)],x2=GX[idx(i2,j2)],y2=GY[idx(i2,j2)];
    if(Math.hypot(x2-x1,y2-y1)<SCALE*D*1.4){
      SA=lastSwap;Object.assign(AS,{p:0,i1,j1,i2,j2,x1,y1,x2,y2,t1,t2,ts});
    }
  }
  ui();if(!SA) draw();
  // Animación de geometría de poro en tiempo real (si overlay activo)
  const ovlActive=document.getElementById('iOvl')?.value!=='off';
  if(ovlActive&&ready&&!SA) draw(); // ya dibujado arriba, no duplicar
  if(step>=total){done();return;}
  raf=requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────────────────
// 7. CIERRE Y CONSOLIDACIÓN DE RESULTADOS
// ─────────────────────────────────────────────────────────────────────

/**
 * Finaliza la corrida activa y consolida sus resultados en la interfaz.
 *
 * Detiene la ejecución, actualiza el estado visual, registra enlaces y E_f,
 * acumula estadísticas de ensemble, detiene grabaciones y abre el flujo de
 * exportación de resultados.
 *
 * @returns {void}
 */
function done(){
  run=false;
  setUI('dn','✓ Equilibrio — E='+E.toFixed(1)+' eV','DONE','dn');
  setBtn(false);ui();draw();
  const bc=countBonds();
  addLog(`✓ ${step.toLocaleString()} pasos | E=${E.toFixed(1)} eV | T=${T.toFixed(0)} K`,'g');
  addLog(`cNB=${bc.cNB} cNN=${bc.cNN} cBB=${bc.cBB} · accept=${(accepted/(accepted+rejected||1)*100).toFixed(1)}%`,'i');
  const pore=classifyPore();
  if(pore) addLog(`Geometría detectada: ${pore.label}`,'g');
  const formv=calcFormationEnergyDFTLike();
  if(formv&&formv.nV>0){
    addLog(`E_form = ${formv.Eform.toFixed(3)} eV${formv.perH!==null?` · ${formv.perH.toFixed(4)} eV/H de borde`:''} (ambiente ${formv.env})`,'g');
  }
  const wasRecording=(typeof recordingState!=='undefined' && recordingState.active);
  if(typeof stopSimulationRecording==='function'&&recordingState.active) stopSimulationRecording(false);
  // Mostrar botón 3D y preguntar exportar
  const btn3d=document.getElementById('btn3D');
  if(btn3d) btn3d.style.display='';
  // Generar informe automáticamente al terminar
  setTimeout(()=>{
    showExportDialog();
    // Pre-generar canvas para tener datos listos (no descarga aún)
    addLog('Simulación completa — usa el diálogo para exportar el informe','i');
  },wasRecording?900:400);
}
