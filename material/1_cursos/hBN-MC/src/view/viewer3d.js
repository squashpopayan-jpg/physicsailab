/** [REGISTRO-DOC-V3D000]
 * Módulo: viewer3d.js — visualización tridimensional opcional.
 * Responsabilidad: representar la estructura atómica, enlaces, hidrógenos de pasivación, poros y especies volátiles mediante Three.js r128, con fallback Canvas 2D cuando WebGL/Three.js no está disponible.
 * Nota de trazabilidad: la documentación añadida no modifica el código ejecutable.
 */
// viewer3d.js — visualización 3D opcional
'use strict';
// ══ VISUALIZADOR 3D — Three.js r128 ════════════════════════════════════
'use strict';
let _3d=null;
const PORE3D_COLORS={
  auto:0xf59e0b,
  triangle:0xf97316,
  parallelogram:0x06b6d4,
  hexagon:0x7c3aed,
  irregular:0xef4444
};
/** [REGISTRO-DOC-V3D001]
 * Detecta componentes conexos de vacancias para representarlos como poros en la vista 3D.
 * Salida: Array<Array<number>>.
 */
function collect3DPoreClusters(){
  if(!ready) return [];
  const visited=new Uint8Array(Nx*Ny), clusters=[];
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    if(G[k]!==V_T||visited[k]) continue;
    const cluster=[],queue=[k];visited[k]=1;
    while(queue.length){
      const cur=queue.shift(); cluster.push(cur);
      const ci=Math.floor(cur/Nx),cj=cur%Nx;
      for(const [ni,nj] of PNB[idx(ci,cj)]){
        const nk=idx(ni,nj);
        if(G[nk]===V_T&&!visited[nk]){visited[nk]=1; queue.push(nk);}
      }
    }
    if(cluster.length) clusters.push(cluster);
  }
  return clusters;
}
/** [REGISTRO-DOC-V3D002]
 * Normaliza una etiqueta de forma de poro a la clave geométrica usada por la paleta 3D.
 * Entradas: shapeLabel: etiqueta textual de forma.
 * Salida: string.
 */
function get3DGeometryKey(shapeLabel=''){
  const s=(shapeLabel||'').toLowerCase();
  if(s.includes('tri')) return 'triangle';
  if(s.includes('para')) return 'parallelogram';
  if(s.includes('hex')) return 'hexagon';
  return 'irregular';
}

/** [REGISTRO-DOC-V3D003]
 * Obtiene la etiqueta traducida que se muestra para el modo de visualización del poro.
 * Entradas: mode: modo seleccionado; poreClass: clasificación automática del poro.
 * Salida: string.
 */
function get3DModeLabel(mode, poreClass){
  if(mode==='auto') return poreClass?.shape || t('pore_auto');
  if(mode==='triangle') return t('pore_triangle');
  if(mode==='parallelogram') return t('pore_parallelogram');
  if(mode==='hexagon') return t('pore_hexagon');
  return t('pore_irregular');
}
/** [REGISTRO-DOC-V3D004]
 * Construye la superficie y el contorno Three.js de un poro a partir del casco convexo de sus átomos de borde.
 * Entradas: cluster: índices de vacancias; toW: conversión a coordenadas 3D; r3d: escala atómica; colorHex: color.
 * Salida: object {surface, outline}.
 */
function build3DPoreSurface(cluster,toW,r3d,colorHex){
  if(!cluster||cluster.length<1) return {surface:null,outline:null};
  const edgePts=[];
  const MAX_B=SCALE*D*1.35;
  for(const ck of cluster){
    const ci=Math.floor(ck/Nx), cj=ck%Nx;
    for(const [ni,nj] of PNB[idx(ci,cj)]){
      const nk=idx(ni,nj);
      if(G[nk]!==V_T && Math.hypot(GX[ck]-GX[nk],GY[ck]-GY[nk])<MAX_B) edgePts.push([GX[nk],GY[nk]]);
    }
  }
  if(edgePts.length<3) return {surface:null,outline:null};
  const hull=convexHull(edgePts);
  if(!hull||hull.length<3) return {surface:null,outline:null};
  const centerX=hull.reduce((s,p)=>s+p[0],0)/hull.length;
  const centerY=hull.reduce((s,p)=>s+p[1],0)/hull.length;
  const expand=r3d*0.35;
  const pts=hull.map(([x,y])=>{
    const dx=x-centerX, dy=y-centerY, len=Math.hypot(dx,dy)||1;
    const [wx,wy]=toW(x+dx/len*expand, y+dy/len*expand);
    return new THREE.Vector2(wx,wy);
  });
  const shape=new THREE.Shape(pts);
  const geom=new THREE.ShapeGeometry(shape);
  /** [REGISTRO-DOC-V3D012]
   * Crea un material físico MeshStandardMaterial para una especie o enlace visual.
   * Entradas: hex: color; m: metalness; r: roughness.
   * Salida: THREE.MeshStandardMaterial.
   */
  const mat=new THREE.MeshBasicMaterial({
    color:colorHex, transparent:true, opacity:0.28, side:THREE.DoubleSide, depthWrite:false
  });
  const surface=new THREE.Mesh(geom,mat);
  surface.position.z=-Math.max(0.2,r3d*0.16);
  const outlineGeom=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(p.x,p.y,Math.max(0.18,r3d*0.08))));
  const outline=new THREE.LineLoop(outlineGeom,new THREE.LineBasicMaterial({color:colorHex,transparent:true,opacity:0.95}));
  return {surface,outline};
}

// Colores 3D (fondo BLANCO, átomos vivos)
const COL3D={
  N:0x2563eb, B:0x16a34a, C:0x475569, H:0xf8fafc,
  bondNB:0x22c55e, bondNN:0x93c5fd, bondBB:0x86efac,
  bondCC:0x64748b, bondCN:0x7c3aed, bondCB:0x0d9488,
  bondVAC:0xd1d5db, bg:0xffffff
};


/** [REGISTRO-DOC-V3D005]
 * Genera una etiqueta tipo sprite para identificar una especie volátil en la escena Three.js.
 * Entradas: text: etiqueta; colorHex: color; baseScale: escala base.
 * Salida: THREE.Sprite.
 */
function createVolatileLabelSprite(text,colorHex,baseScale){
  const canvas=document.createElement('canvas');
  canvas.width=256; canvas.height=128;
  const g=canvas.getContext('2d');
  g.clearRect(0,0,canvas.width,canvas.height);
  g.fillStyle='rgba(255,255,255,0.94)';
  g.strokeStyle='#cbd5e1';
  g.lineWidth=6;
  const x=14,y=18,w=canvas.width-28,h=canvas.height-36,r=24;
  g.beginPath();
  g.moveTo(x+r,y);
  g.lineTo(x+w-r,y);
  g.quadraticCurveTo(x+w,y,x+w,y+r);
  g.lineTo(x+w,y+h-r);
  g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  g.lineTo(x+r,y+h);
  g.quadraticCurveTo(x,y+h,x,y+h-r);
  g.lineTo(x,y+r);
  g.quadraticCurveTo(x,y,x+r,y);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle='#0f172a';
  g.font='700 52px sans-serif';
  g.textAlign='center';
  g.textBaseline='middle';
  g.fillText(text,canvas.width/2,canvas.height/2+3);
  const tex=new THREE.CanvasTexture(canvas);
  tex.needsUpdate=true;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sprite.scale.set(baseScale*2.9,baseScale*1.45,1);
  sprite.userData.baseScale=baseScale;
  return sprite;
}
/** [REGISTRO-DOC-V3D006]
 * Construye el marcador compuesto (halo, anillo, punto y etiqueta) de una especie volátil.
 * Entradas: type: tipo atómico; wx/wy/wz: posición; baseScale: escala.
 * Salida: THREE.Group.
 */
function createVolatileMarker3D(type,wx,wy,wz,baseScale){
  const style=getVolatileSpeciesMarkerStyle(type);
  const group=new THREE.Group();
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(baseScale*0.72,baseScale*0.08,10,34),
    new THREE.MeshBasicMaterial({color:style.hex,transparent:true,opacity:0.92,depthWrite:false})
  );
  ring.position.z=baseScale*0.08;
  group.add(ring);
  const halo=new THREE.Mesh(
    new THREE.CircleGeometry(baseScale*0.86,32),
    new THREE.MeshBasicMaterial({color:style.hex,transparent:true,opacity:0.10,side:THREE.DoubleSide,depthWrite:false})
  );
  halo.position.z=-baseScale*0.04;
  group.add(halo);
  const dot=new THREE.Mesh(
    new THREE.SphereGeometry(baseScale*0.10,10,8),
    new THREE.MeshBasicMaterial({color:style.hex,transparent:true,opacity:0.96,depthWrite:false})
  );
  dot.position.set(0,baseScale*0.96,baseScale*0.10);
  group.add(dot);
  const label=createVolatileLabelSprite(style.label,style.hex,baseScale);
  label.position.set(0,baseScale*1.52,baseScale*0.18);
  group.add(label);
  group.position.set(wx,wy,wz+baseScale*0.05);
  group.userData.baseScale=baseScale;
  return group;
}

/** [REGISTRO-DOC-V3D007]
 * Garantiza que Three.js r128 esté disponible; reutiliza una carga existente o inserta el script CDN dinámicamente.
 * Salida: Promise<THREE>.
 */
function ensureThreeLoaded(){
  return new Promise((resolve,reject)=>{
    if(window.THREE){ resolve(window.THREE); return; }
    const existing=document.querySelector('script[data-three-loader]');
    if(existing){ existing.addEventListener('load',()=>resolve(window.THREE)); existing.addEventListener('error',()=>reject(new Error('three-load-failed'))); return; }
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.async=true;
    s.dataset.threeLoader='1';
    s.onload=()=>resolve(window.THREE);
    s.onerror=()=>reject(new Error('three-load-failed'));
    document.head.appendChild(s);
  });
}

/** [REGISTRO-DOC-V3D008]
 * Abre el modal del visor 3D, carga Three.js si es necesario y activa el fallback Canvas cuando la carga falla.
 * Salida: Promise<void>.
 */
async function open3D(){
  if(!ready||!GX.length){addLog('Genera una estructura primero','r');return;}
  const modal=document.getElementById('modal3D');
  if(!modal) return;
  try{
    await ensureThreeLoaded();
  }catch(err){
    modal.style.display='flex';
    addLog('Three.js no cargó; se abre vista 3D básica en Canvas','w');
    setTimeout(init3DFallback,60);
    return;
  }
  modal.style.display='flex';
  setTimeout(init3D, 60);
}

/** [REGISTRO-DOC-V3D009]
 * Cierra el visor 3D y libera el bucle de animación, renderer y estado del fallback.
 * Salida: void.
 */
function close3D(){
  const modal=document.getElementById('modal3D');
  if(modal) modal.style.display='none';
  if(_3d&&_3d.raf){cancelAnimationFrame(_3d.raf);_3d.raf=0;}
  if(_3d&&_3d.renderer){_3d.renderer.dispose();}
  _3d=null;
  if(window._3dFallback&&window._3dFallback.raf){cancelAnimationFrame(window._3dFallback.raf);}
  window._3dFallback=null;
}

/** [REGISTRO-DOC-V3D010]
 * Inicializa la escena Three.js: cámara, iluminación, materiales, átomos instanciados, enlaces, H, poros, especies volátiles e interacción.
 * Salida: void.
 */
function init3D(){
  const cv3=document.getElementById('cv3d');
  if(!cv3) return;

  const cz3=document.getElementById('cv3dWrap');
  const W=cz3?cz3.clientWidth:cv3.clientWidth||780;
  const H=cz3?cz3.clientHeight:cv3.clientHeight||480;
  cv3.width=W; cv3.height=H;

  // Escena con fondo blanco
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(COL3D.bg);

  // Cámara
  const cam=new THREE.PerspectiveCamera(45,W/H,0.1,5000);

  // Renderer
  const renderer=new THREE.WebGLRenderer({canvas:cv3,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.shadowMap.enabled=true;

  // Iluminación para fondo blanco
  scene.add(new THREE.AmbientLight(0xffffff,0.70));
  const sun=new THREE.DirectionalLight(0xffffff,0.80);
  sun.position.set(500,800,600);
  sun.castShadow=true;
  scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe0e8ff,0.35);
  fill.position.set(-400,-200,300);
  scene.add(fill);
  // Luz de abajo para iluminar desde debajo de la red 2D
  const bottom=new THREE.DirectionalLight(0xfff8e8,0.25);
  bottom.position.set(0,-500,-300);
  scene.add(bottom);

  // Calcular centro y extensión de la red
  const xs=Array.from(GX).filter((_,k)=>G[k]!==V_T);
  const ys=Array.from(GY).filter((_,k)=>G[k]!==V_T);
  const mnX=xs.length?Math.min(...xs):0, mxX=xs.length?Math.max(...xs):100;
  const mnY=ys.length?Math.min(...ys):0, mxY=ys.length?Math.max(...ys):100;
  const cx3d=(mnX+mxX)/2, cy3d=(mnY+mxY)/2;
  const span=Math.max(mxX-mnX, mxY-mnY, 50);

  // Convertir px 2D → coordenadas 3D (Y invertido para Three.js)
  /** [REGISTRO-DOC-V3D011]
   * Convierte coordenadas de pantalla de la red a coordenadas centradas de la escena 3D.
   * Entradas: px/py: coordenadas 2D.
   * Salida: [x,y,z].
   */
  const toW=(px,py)=>[px-cx3d, -(py-cy3d), 0];

  // Radio de esfera proporcional al espaciado de red
  const r3d=Math.max(3, span/Math.max(Nx,Ny)*0.42);
  const sphereGeo=new THREE.SphereGeometry(r3d,18,14);
  const sphereGeoH=new THREE.SphereGeometry(r3d*0.38,10,8);
  const volatileMask=getVolatileSpeciesMask();
  const h3DList=(typeof collectPassivationHydrogensScreen==='function')?collectPassivationHydrogensScreen():[];

  // Materiales
  const mat=(hex,m=0.15,r=0.35)=>new THREE.MeshStandardMaterial({color:hex,metalness:m,roughness:r});
  const mats={
    N:mat(COL3D.N,0.05,0.3),
    B:mat(COL3D.B,0.05,0.3),
    C:mat(COL3D.C,0.25,0.5),
    H:mat(COL3D.H,0.0,0.6),
  };

  // Contar átomos por tipo y separar especies volátiles visuales (BH3/NH3)
  let cN=0,cB=0,cC=0,cH=0;
  let cNVol=0,cBVol=0,cCVol=0,cHVol=0;
  const MAX_B=SCALE*D*1.35;
  for(let k=0;k<Nx*Ny;k++){
    const t=G[k];
    const isVol=!!volatileMask[k];
    if(t===N_T){ if(isVol) cNVol++; else cN++; }
    else if(t===B_T){ if(isVol) cBVol++; else cB++; }
    else if(t===C_T){ if(isVol) cCVol++; else cC++; }
  }
  if(hPass){
    for(const h of h3DList){
      if(volatileMask[h.parent]) cHVol++; else cH++;
    }
  }

  // InstancedMesh
  /** [REGISTRO-DOC-V3D013]
   * Crea una malla instanciada cuando el conteo de elementos es mayor que cero.
   * Entradas: geo: geometría; mat: material; cnt: número de instancias.
   * Salida: THREE.InstancedMesh | null.
   */
  const mkInst=(geo,mat,cnt)=>cnt>0?new THREE.InstancedMesh(geo,mat,cnt):null;
  const instN=mkInst(sphereGeo,mats.N,cN);
  const instB=mkInst(sphereGeo,mats.B,cB);
  const instC=mkInst(sphereGeo,mats.C,cC);
  const instH=mkInst(sphereGeoH,mats.H,cH);
  const instNVol=mkInst(sphereGeo,mats.N,cNVol);
  const instBVol=mkInst(sphereGeo,mats.B,cBVol);
  const instCVol=mkInst(sphereGeo,mats.C,cCVol);
  const instHVol=mkInst(sphereGeoH,mats.H,cHVol);
  const regularAtomMeshes=[instN,instB,instC,instH].filter(Boolean);
  const volatileAtomMeshes=[instNVol,instBVol,instCVol,instHVol].filter(Boolean);
  [...regularAtomMeshes,...volatileAtomMeshes].forEach(m=>{if(m){m.castShadow=true;scene.add(m);}});

  const dummy=new THREE.Object3D();
  let iN=0,iB=0,iC=0,iH=0,iNVol=0,iBVol=0,iCVol=0,iHVol=0;

  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);const t=G[k];
    if(t===V_T) continue;
    const isVol=!!volatileMask[k];
    const[wx,wy,wz]=toW(GX[k],GY[k]);
    dummy.position.set(wx,wy,wz);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    if(t===N_T){ if(isVol&&instNVol) instNVol.setMatrixAt(iNVol++,dummy.matrix); else if(instN) instN.setMatrixAt(iN++,dummy.matrix); }
    else if(t===B_T){ if(isVol&&instBVol) instBVol.setMatrixAt(iBVol++,dummy.matrix); else if(instB) instB.setMatrixAt(iB++,dummy.matrix); }
    else if(t===C_T){ if(isVol&&instCVol) instCVol.setMatrixAt(iCVol++,dummy.matrix); else if(instC) instC.setMatrixAt(iC++,dummy.matrix); }
    // H pasivadores: ahora se colocan desde collectPassivationHydrogensScreen()
    if(false&&hPass){
      for(const[ni,nj]of PNB[k]){
        const nk=idx(ni,nj);
        if(G[nk]!==V_T) continue;
        const dx=GX[nk]-GX[k],dy=GY[nk]-GY[k];
        if(Math.hypot(dx,dy)>MAX_B) continue;
        const[hx3,hy3]=toW(GX[k]+dx*0.38,GY[k]+dy*0.38);
        dummy.position.set(hx3,hy3,0);
        dummy.updateMatrix();
        if(isVol){ if(iHVol<cHVol&&instHVol) instHVol.setMatrixAt(iHVol++,dummy.matrix); }
        else { if(iH<cH&&instH) instH.setMatrixAt(iH++,dummy.matrix); }
      }
    }
  }
  if(hPass&&h3DList.length){
    for(const h of h3DList){
      const [hx3,hy3]=toW(h.x,h.y);
      dummy.position.set(hx3,hy3,0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      if(volatileMask[h.parent]){ if(iHVol<cHVol&&instHVol) instHVol.setMatrixAt(iHVol++,dummy.matrix); }
      else { if(iH<cH&&instH) instH.setMatrixAt(iH++,dummy.matrix); }
    }
  }
  const volatileMarkerGroups=[];
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    if(!volatileMask[k]||G[k]===V_T) continue;
    const [wx,wy,wz]=toW(GX[k],GY[k]);
    const marker=createVolatileMarker3D(G[k],wx,wy,wz,r3d);
    volatileMarkerGroups.push(marker);
    scene.add(marker);
  }
  [...regularAtomMeshes,...volatileAtomMeshes].forEach(m=>{if(m)m.instanceMatrix.needsUpdate=true;});

  // ── ENLACES (separando especies volátiles para poder ocultarlas) ─────
  const bondV=[],bondC=[],bondVolV=[],bondVolC=[];
  const c3=new THREE.Color();
  let bondMesh=null,bondMeshVol=null,hBondMesh=null,hBondMeshVol=null;
  /** [REGISTRO-DOC-V3D014]
   * Selecciona el color 3D de un enlace de acuerdo con el par de especies conectado.
   * Entradas: a/b: tipos de especie.
   * Salida: number (color hexadecimal).
   */
  const bmap=(a,b)=>{
    if((a===N_T&&b===B_T)||(a===B_T&&b===N_T))return COL3D.bondNB;
    if(a===N_T&&b===N_T)return COL3D.bondNN;
    if(a===B_T&&b===B_T)return COL3D.bondBB;
    if(a===C_T&&b===C_T)return COL3D.bondCC;
    if((a===C_T&&b===N_T)||(a===N_T&&b===C_T))return COL3D.bondCN;
    if((a===C_T&&b===B_T)||(a===B_T&&b===C_T))return COL3D.bondCB;
    return COL3D.bondVAC;
  };
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);const a=G[k];
    if(a===V_T) continue;
    const[x1,y1]=toW(GX[k],GY[k]);
    for(const[ni,nj]of PNB[k]){
      const nk=idx(ni,nj);const b=G[nk];
      if(nk<=k||b===V_T) continue;
      if(Math.hypot(GX[k]-GX[nk],GY[k]-GY[nk])>MAX_B) continue;
      const[x2,y2]=toW(GX[nk],GY[nk]);
      const tgt=(volatileMask[k]||volatileMask[nk])?[bondVolV,bondVolC]:[bondV,bondC];
      tgt[0].push(x1,y1,0,x2,y2,0);
      c3.setHex(bmap(a,b));
      tgt[1].push(c3.r,c3.g,c3.b,c3.r,c3.g,c3.b);
    }
  }
  if(bondV.length){
    const bg=new THREE.BufferGeometry();
    bg.setAttribute('position',new THREE.Float32BufferAttribute(bondV,3));
    bg.setAttribute('color',new THREE.Float32BufferAttribute(bondC,3));
    bondMesh=new THREE.LineSegments(bg,
      new THREE.LineBasicMaterial({vertexColors:true,linewidth:2,transparent:false,opacity:1.0}));
    scene.add(bondMesh);
  }
  if(bondVolV.length){
    const bgv=new THREE.BufferGeometry();
    bgv.setAttribute('position',new THREE.Float32BufferAttribute(bondVolV,3));
    bgv.setAttribute('color',new THREE.Float32BufferAttribute(bondVolC,3));
    bondMeshVol=new THREE.LineSegments(bgv,
      new THREE.LineBasicMaterial({vertexColors:true,linewidth:2,transparent:false,opacity:1.0}));
    scene.add(bondMeshVol);
  }

  // ── H bonds (líneas hacia H pasivadores) ──────────────────────────
  if(false&&hPass){
    const hbV=[],hbC=[],hbVolV=[],hbVolC=[];
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
      const k=idx(i,j);if(G[k]===V_T) continue;
      const[ax,ay]=toW(GX[k],GY[k]);
      for(const[ni,nj]of PNB[k]){
        const nk=idx(ni,nj);
        if(G[nk]!==V_T) continue;
        const dx=GX[nk]-GX[k],dy=GY[nk]-GY[k];
        if(Math.hypot(dx,dy)>MAX_B) continue;
        const[hx,hy]=toW(GX[k]+dx*0.38,GY[k]+dy*0.38);
        const tgt=volatileMask[k]?[hbVolV,hbVolC]:[hbV,hbC];
        tgt[0].push(ax,ay,0,hx,hy,0);
        tgt[1].push(0.6,0.6,0.65,0.6,0.6,0.65);
      }
    }
    if(hbV.length){
      const hbg=new THREE.BufferGeometry();
      hbg.setAttribute('position',new THREE.Float32BufferAttribute(hbV,3));
      hbg.setAttribute('color',new THREE.Float32BufferAttribute(hbC,3));
      hBondMesh=new THREE.LineSegments(hbg,
        new THREE.LineBasicMaterial({vertexColors:true,linewidth:1,transparent:true,opacity:0.5}));
      scene.add(hBondMesh);
    }
    if(hbVolV.length){
      const hbgv=new THREE.BufferGeometry();
      hbgv.setAttribute('position',new THREE.Float32BufferAttribute(hbVolV,3));
      hbgv.setAttribute('color',new THREE.Float32BufferAttribute(hbVolC,3));
      hBondMeshVol=new THREE.LineSegments(hbgv,
        new THREE.LineBasicMaterial({vertexColors:true,linewidth:1,transparent:true,opacity:0.5}));
      scene.add(hBondMeshVol);
    }
  }

  if(hPass&&h3DList.length){
    const hbV=[],hbC=[],hbVolV=[],hbVolC=[];
    for(const h of h3DList){
      const k=h.parent;
      if(k<0||k>=Nx*Ny||G[k]===V_T) continue;
      const [ax,ay]=toW(GX[k],GY[k]);
      const [hx,hy]=toW(h.x,h.y);
      const tgt=volatileMask[k]?[hbVolV,hbVolC]:[hbV,hbC];
      tgt[0].push(ax,ay,0,hx,hy,0);
      tgt[1].push(0.6,0.6,0.65,0.6,0.6,0.65);
    }
    if(hbV.length){
      const hbg=new THREE.BufferGeometry();
      hbg.setAttribute('position',new THREE.Float32BufferAttribute(hbV,3));
      hbg.setAttribute('color',new THREE.Float32BufferAttribute(hbC,3));
      hBondMesh=new THREE.LineSegments(hbg,
        new THREE.LineBasicMaterial({vertexColors:true,linewidth:1,transparent:true,opacity:0.55}));
      scene.add(hBondMesh);
    }
    if(hbVolV.length){
      const hbgv=new THREE.BufferGeometry();
      hbgv.setAttribute('position',new THREE.Float32BufferAttribute(hbVolV,3));
      hbgv.setAttribute('color',new THREE.Float32BufferAttribute(hbVolC,3));
      hBondMeshVol=new THREE.LineSegments(hbgv,
        new THREE.LineBasicMaterial({vertexColors:true,linewidth:1,transparent:true,opacity:0.55}));
      scene.add(hBondMeshVol);
    }
  }

  // ── Poros: zonas coloreadas y geometría manual/automática ────────
  const poreClusters=(getPoreClusters&&getPoreClusters()) || collect3DPoreClusters().sort((a,b)=>b.length-a.length);
  const poreObjects=[];
  for(const poreCluster of poreClusters){
    if(!poreCluster||!poreCluster.length) continue;
    const poreClass=(typeof classifyPoreCluster==='function' ? classifyPoreCluster(poreCluster) : null) || classifyPore() || {shape:'Irregular',key:'irregular'};
    const palette=(typeof getPoreVisualPalette==='function') ? getPoreVisualPalette(poreClass.key||poreClass.shape) : {key:get3DGeometryKey(poreClass.shape),hex:PORE3D_COLORS[get3DGeometryKey(poreClass.shape)]||PORE3D_COLORS.auto};
    const poreData=[], poreColors=[];
    const colorHex=palette.hex||PORE3D_COLORS[palette.key]||PORE3D_COLORS.auto;
    const col=new THREE.Color(colorHex);
    const surfacePack=build3DPoreSurface(poreCluster,toW,r3d,colorHex);
    if(surfacePack.surface) scene.add(surfacePack.surface);
    if(surfacePack.outline) scene.add(surfacePack.outline);
    for(const ck of poreCluster){
      const [px,py]=toW(GX[ck],GY[ck]);
      poreData.push(px,py,Math.max(0.12,r3d*0.06));
      poreColors.push(col.r,col.g,col.b);
    }
    let porePoints=null;
    if(poreData.length){
      const pg=new THREE.BufferGeometry();
      pg.setAttribute('position',new THREE.Float32BufferAttribute(poreData,3));
      pg.setAttribute('color',new THREE.Float32BufferAttribute(poreColors,3));
      porePoints=new THREE.Points(pg,new THREE.PointsMaterial({size:r3d*1.2,vertexColors:true,transparent:true,opacity:0.92,depthWrite:false}));
      scene.add(porePoints);
    }

    let volatilePoints=null;
    poreObjects.push({cluster:poreCluster,poreClass,porePoints,volatilePoints,poreSurface:surfacePack.surface,poreOutline:surfacePack.outline,autoKey:palette.key||get3DGeometryKey(poreClass.shape)});
  }
  // Estado orbital
  // Radio inicial que encuadra toda la lámina con el campo de visión vertical
  // de la cámara (45°), con un 15 % de margen.
  const fitRadius=(span/2)/Math.tan((cam.fov/2)*Math.PI/180);
  const initRadius=Math.max(span*1.0,fitRadius*1.15);
  _3d={scene,cam,renderer,
    isDragging:false,isShift:false,lastX:0,lastY:0,
    theta:0, phi:Math.PI/4,
    radius:initRadius, initRadius,
    cx3d, cy3d, span,
    panX:0, panY:0, panZ:0,
    styleMode:0,
    atomScale:1,
    volatileHidden:false,
    poreMode:'auto',
    instN,instB,instC,instH,instNVol,instBVol,instCVol,instHVol, mats, r3d,
    regularAtomMeshes,
    volatileAtomMeshes,
    regularHBondObjects:[hBondMesh].filter(Boolean),
    volatileHBondObjects:[hBondMeshVol].filter(Boolean),
    regularBondObjects:[bondMesh].filter(Boolean),
    volatileBondObjects:[bondMeshVol].filter(Boolean),
    volatileMarkerGroups,
    poreObjects,
    raf:0
  };

  // Info
  const counts=getSpeciesCounts();
  const el=document.getElementById('3dInfo');
  if(el){
    const poreClass=classifyPore();
    el.textContent=`${counts.nAtoms} ${t('view3d_atoms')} · N=${counts.nN} B=${counts.nB} C=${counts.nC} V=${counts.nV} · sitios=${counts.nSites}${poreClass?' · '+poreClass.label:''}`;
  }

  // Sincronizar controles visuales
  const atomScaleInput=document.getElementById('i3DAtomScale'); if(atomScaleInput) atomScaleInput.value='100';
  const poreModeInput=document.getElementById('i3DPoreMode'); if(poreModeInput) poreModeInput.value='auto';
  const hideVolInput=document.getElementById('i3DHideVolatile'); if(hideVolInput) hideVolInput.checked=false;

  // Posición inicial: vista desde arriba-frente
  positionCamera3D(0, Math.PI/4, initRadius);
  update3DPoreVisual();
  toggle3DVolatileVisibility();

  // ── CONTROLES DE RATÓN ────────────────────────────────────────────
  cv3.onmousedown=e=>{
    _3d.isDragging=true; _3d.isShift=e.shiftKey;
    _3d.lastX=e.clientX; _3d.lastY=e.clientY;
    cv3.style.cursor=e.shiftKey?'move':'grabbing';
  };
  window.onmouseup=()=>{if(_3d)_3d.isDragging=false; cv3.style.cursor='grab';};
  cv3.onmousemove=e=>{
    if(!_3d||!_3d.isDragging) return;
    const dx=e.clientX-_3d.lastX, dy=e.clientY-_3d.lastY;
    _3d.lastX=e.clientX; _3d.lastY=e.clientY;
    if(_3d.isShift){
      const ps=_3d.radius*0.0015;
      _3d.panX-=dx*ps; _3d.panY+=dy*ps;
    } else {
      _3d.theta-=dx*0.007;
      _3d.phi=Math.max(0.02,Math.min(Math.PI-0.02,_3d.phi-dy*0.007));
    }
    update3DCamera();
  };
  cv3.onwheel=e=>{
    e.preventDefault();
    _3d.radius*=e.deltaY>0?1.10:0.91;
    _3d.radius=Math.max(r3d*3,Math.min(span*8,_3d.radius));
    update3DCamera();
  };
  // Touch
  let _td=0;
  cv3.ontouchstart=e=>{
    if(e.touches.length===1){
      _3d.isDragging=true;
      _3d.lastX=e.touches[0].clientX; _3d.lastY=e.touches[0].clientY;
    } else if(e.touches.length===2){
      _td=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,
                     e.touches[0].clientY-e.touches[1].clientY);
    }
  };
  cv3.ontouchend=()=>{if(_3d)_3d.isDragging=false;};
  cv3.ontouchmove=e=>{
    e.preventDefault();
    if(!_3d) return;
    if(e.touches.length===1&&_3d.isDragging){
      const dx=e.touches[0].clientX-_3d.lastX, dy=e.touches[0].clientY-_3d.lastY;
      _3d.lastX=e.touches[0].clientX; _3d.lastY=e.touches[0].clientY;
      _3d.theta-=dx*0.007;
      _3d.phi=Math.max(0.02,Math.min(Math.PI-0.02,_3d.phi-dy*0.007));
      update3DCamera();
    } else if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,
                         e.touches[0].clientY-e.touches[1].clientY);
      if(_td>0){_3d.radius*=_td/d; _3d.radius=Math.max(r3d*3,Math.min(span*8,_3d.radius));}
      _td=d; update3DCamera();
    }
  };

  render3D();
}

/** [REGISTRO-DOC-V3D015]
 * Fija orientación y radio de la cámara 3D, reinicia desplazamientos y actualiza su posición.
 * Entradas: theta: azimut; phi: polar; radius: distancia.
 * Salida: void.
 */
function positionCamera3D(theta,phi,radius){
  if(!_3d) return;
  _3d.theta=theta; _3d.phi=phi; _3d.radius=radius;
  _3d.panX=0; _3d.panY=0;
  update3DCamera();
}

/** [REGISTRO-DOC-V3D016]
 * Calcula la posición cartesiana de la cámara a partir de ángulos, radio y pan, y orienta la vista hacia el centro.
 * Salida: void.
 */
function update3DCamera(){
  if(!_3d) return;
  const{cam,theta,phi,radius,panX,panY}=_3d;
  const tx=panX, ty=panY;
  // La escena ya está centrada en el origen (toW resta cx3d y cy3d), así que la
  // cámara apunta al origen más el desplazamiento (pan) elegido por el usuario.
  cam.position.x=tx+radius*Math.sin(phi)*Math.sin(theta);
  cam.position.y=ty+radius*Math.cos(phi);
  cam.position.z=radius*Math.sin(phi)*Math.cos(theta);
  cam.lookAt(tx,ty,0);
}

/** [REGISTRO-DOC-V3D017]
 * Ejecuta el bucle requestAnimationFrame y renderiza continuamente la escena Three.js.
 * Salida: void.
 */
function render3D(){
  if(!_3d) return;
  _3d.raf=requestAnimationFrame(render3D);
  _3d.renderer.render(_3d.scene,_3d.cam);
}

/** [REGISTRO-DOC-V3D018]
 * Actualiza el texto informativo del visor con conteos de especies y clasificación de poro.
 * Salida: void.
 */
function refresh3DInfoLabel(){
  if(!_3d) return;
  const info=document.getElementById('3dInfo');
  if(!info) return;
  const counts=getSpeciesCounts();
  const poreClass=classifyPore();
  info.textContent=`${counts.nAtoms} ${t('view3d_atoms')} · N=${counts.nN} B=${counts.nB} C=${counts.nC} V=${counts.nV} · sitios=${counts.nSites}${poreClass?' · '+poreClass.label:''}`;
}

/** [REGISTRO-DOC-V3D019]
 * Aplica la escala de átomos seleccionada a mallas instanciadas, H y marcadores volátiles respetando el estilo activo.
 * Salida: void.
 */
function apply3DAtomScale(){
  if(!_3d) return;
  const base=_3d.atomScale||1;
  const styleMul=_3d.styleMode===1?1.8:1.0;
  const totalScale=base*styleMul;
  const dummy=new THREE.Object3D();
  [_3d.instN,_3d.instB,_3d.instC,_3d.instNVol,_3d.instBVol,_3d.instCVol].forEach(inst=>{
    if(!inst) return;
    for(let i=0;i<inst.count;i++){
      inst.getMatrixAt(i,dummy.matrix);
      dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);
      dummy.scale.setScalar(totalScale);
      dummy.updateMatrix();
      inst.setMatrixAt(i,dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate=true;
  });
  [_3d.instH,_3d.instHVol].forEach(inst=>{
    if(!inst) return;
    for(let i=0;i<inst.count;i++){
      inst.getMatrixAt(i,dummy.matrix);
      dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);
      dummy.scale.setScalar(Math.max(0.25,base*0.55));
      dummy.updateMatrix();
      inst.setMatrixAt(i,dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate=true;
  });
  if(Array.isArray(_3d.volatileMarkerGroups)) _3d.volatileMarkerGroups.forEach(group=>{
    if(!group) return;
    const markerScale=Math.max(0.7,base);
    group.scale.setScalar(markerScale);
  });
}
/** [REGISTRO-DOC-V3D020]
 * Normaliza el valor del control de escala atómica y solicita su aplicación a la escena.
 * Entradas: v: valor porcentual del control.
 * Salida: void.
 */
function update3DAtomScale(v){
  if(!_3d) return;
  _3d.atomScale=Math.max(0.35,Math.min(1.8,(+v||100)/100));
  apply3DAtomScale();
}
/** [REGISTRO-DOC-V3D021]
 * Actualiza color, opacidad y etiqueta de los objetos de poro según modo auto/triángulo/paralelogramo/hexágono.
 * Salida: void.
 */
function update3DPoreVisual(){
  if(!_3d) return;
  const mode=document.getElementById('i3DPoreMode')?.value||'auto';
  _3d.poreMode=mode;
  const poreClass=classifyPore()||{shape:t('pore_irregular')};
  (_3d.poreObjects||[]).forEach(obj=>{
    const key=mode==='auto'?(obj.autoKey||get3DGeometryKey(obj.poreClass?.shape||'')):mode;
    const hex=PORE3D_COLORS[key]||PORE3D_COLORS.auto;
    const color=new THREE.Color(hex);
    if(obj.porePoints){
      const cols=obj.porePoints.geometry.getAttribute('color');
      for(let i=0;i<cols.count;i++) cols.setXYZ(i,color.r,color.g,color.b);
      cols.needsUpdate=true;
      obj.porePoints.material.opacity=0.92;
    }
    if(obj.poreSurface){ obj.poreSurface.material.color.setHex(hex); obj.poreSurface.material.opacity=0.30; }
    if(obj.poreOutline){ obj.poreOutline.material.color.setHex(hex); obj.poreOutline.material.opacity=0.98; }
  });
  const info=document.getElementById('3dInfo');
  if(info){
    const base=info.textContent.split(` · ${t('pore_type')}:`)[0].split(' · tipo de poro:')[0].split(' · pore type:')[0];
    info.textContent=`${base} · ${t('pore_type')}: ${get3DModeLabel(mode,poreClass)}`;
  }
}

/** [REGISTRO-DOC-V3D022]
 * Muestra u oculta átomos, enlaces, H y marcadores asociados a especies volátiles.
 * Salida: void.
 */
function toggle3DVolatileVisibility(){
  if(!_3d) return;
  const hide=!!document.getElementById('i3DHideVolatile')?.checked;
  _3d.volatileHidden=hide;
  if(Array.isArray(_3d.volatileAtomMeshes)) _3d.volatileAtomMeshes.forEach(m=>{ if(m) m.visible=!hide && _3d.styleMode!==2; });
  if(Array.isArray(_3d.volatileHBondObjects)) _3d.volatileHBondObjects.forEach(o=>{ if(o) o.visible=!hide; });
  if(Array.isArray(_3d.volatileBondObjects)) _3d.volatileBondObjects.forEach(o=>{ if(o) o.visible=!hide; });
  if(Array.isArray(_3d.volatileMarkerGroups)) _3d.volatileMarkerGroups.forEach(o=>{ if(o) o.visible=!hide; });
  (_3d.poreObjects||[]).forEach(obj=>{ if(obj.volatilePoints) obj.volatilePoints.visible=!hide; });
}

/** [REGISTRO-DOC-V3D023]
 * Restablece la cámara Three.js o el fallback Canvas a su vista inicial.
 * Salida: void.
 */
function reset3DCamera(){
  if(!_3d&&window._3dFallback){
    const f=window._3dFallback; f.theta=0.7; f.zoom=1; f.panX=0; f.panY=0; draw3DFallback(); return;
  }
  if(!_3d) return;
  positionCamera3D(0,Math.PI/4,_3d.initRadius);
}

// Vistas predefinidas
/** [REGISTRO-DOC-V3D024]
 * Selecciona una vista predefinida: superior, frontal, lateral, isométrica o perspectiva.
 * Entradas: v: identificador de vista.
 * Salida: void.
 */
function set3DView(v){
  if(!_3d&&window._3dFallback){
    const f=window._3dFallback;
    const views={top:0,front:0,side:Math.PI/2,iso:Math.PI/4,persp:0.3};
    if(views[v]!==undefined){f.theta=views[v]; draw3DFallback();}
    return;
  }
  if(!_3d) return;
  const r=_3d.initRadius;
  const views={
    top:   [0, Math.PI/2, r],   // Planta: cámara sobre +z, perpendicular a la lámina
    front: [0, 0.01, r*0.9],    // Frente: lámina de canto vista desde +y
    side:  [Math.PI/2, Math.PI/2, r], // Lateral
    iso:   [Math.PI/4, Math.PI/4, r*1.1], // Isométrica
    persp: [0.3, Math.PI/3.5, r*1.2],    // Perspectiva
  };
  const p=views[v];
  if(p) positionCamera3D(p[0],p[1],p[2]);
}

/** [REGISTRO-DOC-V3D025]
 * Alterna entre bolas+palos, solo átomos y solo enlaces, actualizando visibilidad y escala.
 * Salida: void.
 */
function toggle3DStyle(){
  if(!_3d) return;
  _3d.styleMode=(_3d.styleMode+1)%3;
  const labels=curLang==='es' ? ['⚪ Bolas+Palos','🔵 Solo bolas','🔲 Solo enlaces'] : ['⚪ Balls+Sticks','🔵 Atoms only','🔲 Bonds only'];
  const btnS=document.getElementById('btn3Dstyle');
  if(btnS) btnS.textContent=labels[_3d.styleMode];
  // Mostrar/ocultar instancias según el modo
  const showAtoms=_3d.styleMode!==2;
  if(Array.isArray(_3d.regularAtomMeshes)) _3d.regularAtomMeshes.forEach(m=>{ if(m) m.visible=showAtoms; });
  if(Array.isArray(_3d.volatileAtomMeshes)) _3d.volatileAtomMeshes.forEach(m=>{ if(m) m.visible=showAtoms && !_3d.volatileHidden; });
  apply3DAtomScale();
  toggle3DVolatileVisibility();
}


// ── Fallback Canvas 3D: funciona offline cuando Three.js/CDN no carga ──
/** [REGISTRO-DOC-V3D026]
 * Inicializa el visor 3D básico basado en Canvas 2D cuando Three.js/WebGL no está disponible.
 * Salida: void.
 */
function init3DFallback(){
  const cv3=document.getElementById('cv3d');
  const wrap=document.getElementById('cv3dWrap');
  if(!cv3||!wrap) return;
  const W=wrap.clientWidth||780,H=wrap.clientHeight||480;
  cv3.width=W;cv3.height=H;
  const xs=Array.from(GX).filter((_,k)=>G[k]!==V_T);
  const ys=Array.from(GY).filter((_,k)=>G[k]!==V_T);
  const mnX=xs.length?Math.min(...xs):0,mxX=xs.length?Math.max(...xs):100;
  const mnY=ys.length?Math.min(...ys):0,mxY=ys.length?Math.max(...ys):100;
  const cx=(mnX+mxX)/2,cy=(mnY+mxY)/2;
  const span=Math.max(mxX-mnX,mxY-mnY,50);
  const counts=getSpeciesCounts();
  const info=document.getElementById('3dInfo');
  if(info) info.textContent=`Vista 3D básica · ${counts.nAtoms} ${t('view3d_atoms')} · N=${counts.nN} B=${counts.nB} C=${counts.nC} V=${counts.nV}`;
  window._3dFallback={cv:cv3,ctx:cv3.getContext('2d'),W,H,cx,cy,span,theta:0.7,zoom:1,panX:0,panY:0,drag:false,lastX:0,lastY:0};
  cv3.onmousedown=e=>{const f=window._3dFallback;f.drag=true;f.shift=e.shiftKey;f.lastX=e.clientX;f.lastY=e.clientY;cv3.style.cursor=e.shiftKey?'move':'grabbing';};
  window.addEventListener('mouseup',()=>{const f=window._3dFallback;if(f){f.drag=false;cv3.style.cursor='grab';}});
  cv3.onmousemove=e=>{const f=window._3dFallback;if(!f||!f.drag)return;const dx=e.clientX-f.lastX,dy=e.clientY-f.lastY;f.lastX=e.clientX;f.lastY=e.clientY;if(f.shift){f.panX+=dx;f.panY+=dy;}else{f.theta+=dx*0.008;f.panY+=dy*0.10;}draw3DFallback();};
  cv3.onwheel=e=>{e.preventDefault();const f=window._3dFallback;if(!f)return;f.zoom*=e.deltaY>0?0.91:1.10;f.zoom=Math.max(0.25,Math.min(4,f.zoom));draw3DFallback();};
  draw3DFallback();
}
/** [REGISTRO-DOC-V3D027]
 * Dibuja la proyección pseudo-3D en Canvas: enlaces, átomos, H y controles de cámara del fallback.
 * Salida: void.
 */
function draw3DFallback(){
  const f=window._3dFallback;if(!f) return;
  const {ctx,W,H,cx,cy,span}=f;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  const baseScale=Math.min(W,H)/(span*1.35)*f.zoom;
  const ct=Math.cos(f.theta),st=Math.sin(f.theta);
  /** [REGISTRO-DOC-V3D028]
   * Proyecta una coordenada del modelo sobre el Canvas del fallback aplicando giro, zoom y pan.
   * Entradas: x/y/z: coordenadas del modelo.
   * Salida: [x,y].
   */
  const proj=(x,y,z=0)=>{
    const X=x-cx,Y=-(y-cy);
    const xr=X*ct-Y*st;
    const yr=X*st+Y*ct;
    return [W/2+f.panX+xr*baseScale,H/2+f.panY+(yr*0.55-z)*baseScale];
  };
  const colorType=t=>t===N_T?'#2563eb':t===B_T?'#16a34a':t===C_T?'#475569':'#f8fafc';
  /** [REGISTRO-DOC-V3D029]
   * Devuelve el color CSS de un enlace en el fallback Canvas según el par de especies.
   * Entradas: a/b: tipos de especie.
   * Salida: string.
   */
  const bondColor=(a,b)=>{
    if((a===N_T&&b===B_T)||(a===B_T&&b===N_T))return 'rgba(22,163,74,.7)';
    if(a===C_T&&b===C_T)return 'rgba(71,85,105,.72)';
    if(a===C_T||b===C_T)return 'rgba(124,58,237,.65)';
    if(a===N_T&&b===N_T)return 'rgba(37,99,235,.45)';
    if(a===B_T&&b===B_T)return 'rgba(21,128,61,.45)';
    return 'rgba(148,163,184,.5)';
  };
  const maxB=SCALE*D*1.35;
  ctx.lineCap='round';
  for(let k=0;k<Nx*Ny;k++){
    const a=G[k]; if(a===V_T) continue;
    const [x1,y1]=proj(GX[k],GY[k]);
    for(const [ni,nj] of PNB[k]){
      const nk=idx(ni,nj); if(nk<=k||G[nk]===V_T) continue;
      if(Math.hypot(GX[k]-GX[nk],GY[k]-GY[nk])>maxB) continue;
      const [x2,y2]=proj(GX[nk],GY[nk]);
      ctx.strokeStyle=bondColor(a,G[nk]);ctx.lineWidth=Math.max(1,2.2*f.zoom);
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
  }
  if(hPass&&typeof collectPassivationHydrogensScreen==='function'){
    ctx.strokeStyle='rgba(148,163,184,.55)';ctx.lineWidth=Math.max(1,1.1*f.zoom);
    for(const h of collectPassivationHydrogensScreen()){
      const [ax,ay]=proj(GX[h.parent],GY[h.parent]); const [hx,hy]=proj(h.x,h.y);
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(hx,hy);ctx.stroke();
    }
  }
  const atoms=[];
  for(let k=0;k<Nx*Ny;k++) if(G[k]!==V_T){const [sx,sy]=proj(GX[k],GY[k],G[k]===C_T?0.25:0);atoms.push({k,sx,sy,depth:sy,type:G[k]});}
  atoms.sort((a,b)=>a.depth-b.depth);
  for(const a of atoms){
    const r=(a.type===C_T?5.2:5.6)*Math.max(.7,Math.min(1.8,f.zoom));
    const grad=ctx.createRadialGradient(a.sx-r*.35,a.sy-r*.45,r*.2,a.sx,a.sy,r);
    grad.addColorStop(0,'#ffffff');grad.addColorStop(.28,colorType(a.type));grad.addColorStop(1,colorType(a.type));
    ctx.fillStyle=grad;ctx.strokeStyle='rgba(15,23,42,.35)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(a.sx,a.sy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  if(hPass&&typeof collectPassivationHydrogensScreen==='function'){
    for(const h of collectPassivationHydrogensScreen()){
      const [hx,hy]=proj(h.x,h.y);const r=2.8*Math.max(.7,Math.min(1.6,f.zoom));
      ctx.fillStyle='#f8fafc';ctx.strokeStyle='#94a3b8';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(hx,hy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
  }
  ctx.fillStyle='rgba(15,23,42,.65)';ctx.font='600 11px system-ui,sans-serif';
  ctx.fillText('Vista 3D básica Canvas · Carbono incluido · H de poro/borde incluido',12,H-14);
}
