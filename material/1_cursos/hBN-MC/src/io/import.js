// import.js — carga de geometrías externas LAMMPS/XYZ/POSCAR/XV [v10.4]
'use strict';
/* [REGISTRO-DOC-START:IMPORT-MODULO]
 * Módulo de importación de geometrías externas.
 * Formatos soportados: XYZ, POSCAR/VASP, SIESTA XV, LAMMPS DATA y LAMMPS DUMP.
 * Responsabilidades: detectar/interpretar formato, normalizar especies y unidades,
 * reconstruir o aproximar la malla interna hBN/C y aplicar la geometría al simulador.
 * Esta documentación no modifica el código ejecutable del módulo.
 * [REGISTRO-DOC-END:IMPORT-MODULO] */


const IMPORT_A2B=1.88973;
const IMPORT_D=1.44;

/** [REGISTRO-DOC-START:importGeometryFile]
 * Abre el selector de archivos, lee el contenido como texto y coordina el parseo y aplicación de una geometría externa.
 *
 * Entradas: Sin parámetros. Usa DOM, FileReader, parseGeometryFile() y applyImportedGeometry().
 * Salida: void; inicia un flujo asíncrono mediante eventos del navegador.
 * Efectos/observaciones: Crea un input file temporal y registra mensajes de error si la importación falla.
 * [REGISTRO-DOC-END:importGeometryFile]
 */
function importGeometryFile(){
  const inp=document.createElement('input');
  inp.type='file';
  inp.accept='.data,.lmp,.dump,.lammpstrj,.xyz,.vasp,.poscar,.POSCAR,.xv,.XV,.txt';
  inp.onchange=()=>{
    const file=inp.files&&inp.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const text=String(reader.result||'');
        const parsed=parseGeometryFile(text,file.name);
        applyImportedGeometry(parsed,file.name,text);
      }catch(err){
        console.error(err);
        addLog('Error al importar geometría: '+err.message,'r');
      }
    };
    reader.readAsText(file);
  };
  inp.click();
}

/** [REGISTRO-DOC-START:parseGeometryFile]
 * Detecta el formato de una geometría textual y delega su interpretación al parser correspondiente.
 *
 * Entradas: text: contenido del archivo; name: nombre usado como pista de formato.
 * Salida: Objeto normalizado {format, atoms, cell, ...}.
 * Efectos/observaciones: Lanza Error si el formato no se reconoce o no contiene átomos válidos.
 * [REGISTRO-DOC-END:parseGeometryFile]
 */
function parseGeometryFile(text,name='geometry'){
  const lower=(name||'').toLowerCase();
  const trimmed=text.trim();
  let parsed=null;
  if(/ITEM:\s*TIMESTEP/i.test(text) && /ITEM:\s*ATOMS/i.test(text)) parsed=parseLAMMPSDump(text);
  else if(/\bMasses\b/i.test(text) && /\bAtoms\b/i.test(text)) parsed=parseLAMMPSData(text);
  else if(isLikelyXV(trimmed)) parsed=parseSIESTAXV(text);
  else if(lower.includes('poscar')||lower.endsWith('.vasp')||isLikelyPOSCAR(text)) parsed=parsePOSCAR(text);
  else if(lower.endsWith('.xyz')||isLikelyXYZ(text)) parsed=parseXYZ(text);
  else throw new Error('Formato no reconocido. Usa LAMMPS DATA/DUMP, XYZ, POSCAR/VASP o SIESTA XV.');
  if(!parsed.atoms||!parsed.atoms.length) throw new Error('El archivo no contiene átomos válidos.');
  parsed.format=parsed.format||'desconocido';
  return parsed;
}

/** [REGISTRO-DOC-START:cleanLine]
 * Elimina comentarios iniciados por # y espacios laterales de una línea de texto.
 *
 * Entradas: line: línea de entrada.
 * Salida: string limpio.
 * Efectos/observaciones: Función pura.
 * [REGISTRO-DOC-END:cleanLine]
 */
function cleanLine(line){return String(line||'').split('#')[0].trim();}
/** [REGISTRO-DOC-START:nums]
 * Extrae de una línea los tokens numéricos finitos después de retirar comentarios.
 *
 * Entradas: line: línea de entrada.
 * Salida: Array<number>.
 * Efectos/observaciones: Función pura.
 * [REGISTRO-DOC-END:nums]
 */
function nums(line){return cleanLine(line).split(/\s+/).map(Number).filter(Number.isFinite);}
/** [REGISTRO-DOC-START:elementFromZ]
 * Convierte número atómico a símbolo químico soportado por el simulador.
 *
 * Entradas: z: número atómico.
 * Salida: H, B, C o N; valores no reconocidos se mapean a C.
 * Efectos/observaciones: Función pura; convención usada especialmente por SIESTA XV.
 * [REGISTRO-DOC-END:elementFromZ]
 */
function elementFromZ(z){return ({1:'H',5:'B',6:'C',7:'N'}[Math.round(+z)]||'C');}
/** [REGISTRO-DOC-START:normalizeSymbol]
 * Normaliza una etiqueta de elemento y restringe el resultado a B, N, C o H.
 *
 * Entradas: s: símbolo o texto de especie.
 * Salida: string normalizado o null.
 * Efectos/observaciones: Función pura.
 * [REGISTRO-DOC-END:normalizeSymbol]
 */
function normalizeSymbol(s){
  s=String(s||'').replace(/[^A-Za-z]/g,'');
  if(!s) return null;
  s=s[0].toUpperCase()+s.slice(1).toLowerCase();
  if(['B','N','C','H'].includes(s)) return s;
  return null;
}
/** [REGISTRO-DOC-START:elementFromMass]
 * Infiere especie química a partir de masa atómica y, si existe, comentario de la línea Masses de LAMMPS.
 *
 * Entradas: m: masa; comment: comentario opcional.
 * Salida: H, B, C, N o null.
 * Efectos/observaciones: Función pura con tolerancias alrededor de masas atómicas nominales.
 * [REGISTRO-DOC-END:elementFromMass]
 */
function elementFromMass(m,comment=''){
  const cs=normalizeSymbol(comment);
  if(cs) return cs;
  m=+m;
  if(Math.abs(m-1.008)<0.8) return 'H';
  if(Math.abs(m-10.811)<1.5) return 'B';
  if(Math.abs(m-12.011)<1.5) return 'C';
  if(Math.abs(m-14.007)<1.8) return 'N';
  return null;
}
/** [REGISTRO-DOC-START:isLikelyXYZ]
 * Aplica una heurística mínima para identificar contenido en formato XYZ.
 *
 * Entradas: text: contenido textual.
 * Salida: boolean.
 * Efectos/observaciones: No valida exhaustivamente el archivo; solo sirve para selección de parser.
 * [REGISTRO-DOC-END:isLikelyXYZ]
 */
function isLikelyXYZ(text){
  const l=text.trim().split(/\r?\n/).filter(Boolean);
  return l.length>2 && /^\s*\d+\s*$/.test(l[0]||'') && /^[A-Za-z]{1,2}\s+[-+0-9.eE]+\s+[-+0-9.eE]+\s+[-+0-9.eE]+/.test(l[2]||'');
}
/** [REGISTRO-DOC-START:parseXYZ]
 * Interpreta un archivo XYZ estándar y extrae hasta el número declarado de átomos válidos.
 *
 * Entradas: text: contenido XYZ.
 * Salida: {format:"XYZ", atoms, cell:null}.
 * Efectos/observaciones: Las coordenadas se conservan en las unidades del archivo, asumidas como Å por el flujo de importación.
 * [REGISTRO-DOC-END:parseXYZ]
 */
function parseXYZ(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const n=parseInt(lines[0],10);
  const atoms=[];
  for(let i=2;i<lines.length&&atoms.length<n;i++){
    const t=lines[i].trim().split(/\s+/);
    const symbol=normalizeSymbol(t[0]);
    const x=+t[1],y=+t[2],z=+t[3];
    if(symbol&&Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z)) atoms.push({symbol,x,y,z});
  }
  return {format:'XYZ',atoms,cell:null};
}

/** [REGISTRO-DOC-START:isLikelyPOSCAR]
 * Aplica una heurística estructural para reconocer POSCAR/VASP mediante factor de escala y tres vectores de red.
 *
 * Entradas: text: contenido textual.
 * Salida: boolean.
 * Efectos/observaciones: Función de detección; no sustituye la validación del parser.
 * [REGISTRO-DOC-END:isLikelyPOSCAR]
 */
function isLikelyPOSCAR(text){
  const l=text.split(/\r?\n/).filter(x=>x.trim());
  if(l.length<8) return false;
  const sc=parseFloat(l[1]);
  const v1=nums(l[2]), v2=nums(l[3]), v3=nums(l[4]);
  return Number.isFinite(sc)&&v1.length>=3&&v2.length>=3&&v3.length>=3;
}
/** [REGISTRO-DOC-START:parsePOSCAR]
 * Interpreta POSCAR/VASP, incluyendo símbolos, conteos, coordenadas Direct/Cartesian y celda.
 *
 * Entradas: text: contenido POSCAR/VASP.
 * Salida: {format, atoms, cell, title}.
 * Efectos/observaciones: Convierte coordenadas Direct a cartesianas y aplica el factor de escala.
 * [REGISTRO-DOC-END:parsePOSCAR]
 */
function parsePOSCAR(text){
  const raw=text.split(/\r?\n/).filter(l=>l.trim());
  const title=raw[0]||'POSCAR';
  const scale=parseFloat(raw[1])||1;
  const lat=[nums(raw[2]).slice(0,3),nums(raw[3]).slice(0,3),nums(raw[4]).slice(0,3)].map(v=>v.map(x=>x*scale));
  let p=5;
  let symbols=raw[p].trim().split(/\s+/).map(normalizeSymbol);
  let counts;
  if(symbols.every(Boolean) && raw[p+1]){ counts=nums(raw[p+1]).map(v=>Math.round(v)); p+=2; }
  else { counts=nums(raw[p]).map(v=>Math.round(v)); symbols=['B','N','C','H'].slice(0,counts.length); p+=1; }
  if(/^s/i.test(raw[p]||'')) p++;
  const direct=/^d/i.test(raw[p]||'');
  const cart=/^c|^k/i.test(raw[p]||'');
  if(direct||cart) p++;
  const atoms=[];
  for(let sidx=0;sidx<counts.length;sidx++){
    const sym=symbols[sidx]||'C';
    for(let n=0;n<counts[sidx];n++){
      const v=nums(raw[p++]);
      if(v.length<3) continue;
      let x=v[0],y=v[1],z=v[2];
      if(direct){
        const fx=x,fy=y,fz=z;
        x=fx*lat[0][0]+fy*lat[1][0]+fz*lat[2][0];
        y=fx*lat[0][1]+fy*lat[1][1]+fz*lat[2][1];
        z=fx*lat[0][2]+fy*lat[1][2]+fz*lat[2][2];
      }else{ x*=scale; y*=scale; z*=scale; }
      atoms.push({symbol:sym,x,y,z});
    }
  }
  const cell={a:Math.hypot(...lat[0]),b:Math.hypot(...lat[1]),c:Math.hypot(...lat[2])};
  return {format:'POSCAR/VASP',atoms,cell,title};
}

/** [REGISTRO-DOC-START:isLikelyXV]
 * Detecta heurísticamente un archivo SIESTA XV por sus tres vectores de celda y conteo de átomos.
 *
 * Entradas: text: contenido textual.
 * Salida: boolean.
 * Efectos/observaciones: Función de selección de parser.
 * [REGISTRO-DOC-END:isLikelyXV]
 */
function isLikelyXV(text){
  const l=text.trim().split(/\r?\n/).filter(x=>x.trim());
  if(l.length<5) return false;
  return nums(l[0]).length>=3 && nums(l[1]).length>=3 && nums(l[2]).length>=3 && /^\s*\d+\s*$/.test(cleanLine(l[3]));
}
// [FIX v14.7 · D9 — CRÍTICO] Formato .XV de SIESTA, una línea por átomo:
//     is   iza   x  y  z   vx  vy  vz
//     │    └── número atómico Z          ← columna 1
//     └─────── índice de especie (1,2,3) ← columna 0
// v14.6 leía Z de la columna 0. Con el mapa {1:'H',5:'B',6:'C',7:'N'} y especies
// indexadas 1,2,3 el resultado era SIEMPRE: especie 1 → H, especies 2 y 3 → C.
// Verificado sobre una celda B-N-C-B: v14.6 devolvía "H, C, C, H".
// Es decir, cualquier estructura h-BN importada desde SIESTA llegaba como una
// mezcla de hidrógeno y carbono, y el motor energético (que es correcto)
// calculaba con total confianza la energía de una estructura inexistente.
/** [REGISTRO-DOC-START:parseSIESTAXV]
 * Interpreta SIESTA .XV usando la columna 1 como número atómico y convierte coordenadas/celda de bohr a Å.
 *
 * Entradas: text: contenido XV.
 * Salida: {format:"SIESTA XV", atoms, cell, warnings, speciesMap}.
 * Efectos/observaciones: Incluye la corrección D9 de v14.7 y genera advertencias ante números atómicos inesperados.
 * [REGISTRO-DOC-END:parseSIESTAXV]
 */
function parseSIESTAXV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  // Las 3 primeras líneas llevan vector de red (3) + velocidad de celda (3)
  const cellVec=[nums(lines[0]).slice(0,3),nums(lines[1]).slice(0,3),nums(lines[2]).slice(0,3)];
  const n=parseInt(cleanLine(lines[3]),10);
  const atoms=[];
  const speciesSeen=new Map();
  for(let i=4;i<lines.length&&atoms.length<n;i++){
    const v=nums(lines[i]);
    if(v.length<5) continue;
    const isp=Math.round(v[0]);   // índice de especie (informativo)
    const Z=Math.round(v[1]);     // [FIX D9] número atómico: columna 1
    speciesSeen.set(isp,Z);
    atoms.push({symbol:elementFromZ(Z),x:v[2]/IMPORT_A2B,y:v[3]/IMPORT_A2B,z:v[4]/IMPORT_A2B});
  }
  const cell={a:Math.hypot(...cellVec[0])/IMPORT_A2B,b:Math.hypot(...cellVec[1])/IMPORT_A2B,c:Math.hypot(...cellVec[2])/IMPORT_A2B};
  // Control de sanidad: avisa si aparece un Z inesperado para h-BNC + H
  const expected=new Set([1,5,6,7]);
  const rogue=[...new Set([...speciesSeen.values()])].filter(z=>!expected.has(z));
  const warnings=[];
  if(rogue.length) warnings.push(`Números atómicos no esperados en el .XV: ${rogue.join(', ')} (se mapean a C por defecto).`);
  if(!atoms.length) warnings.push('El .XV no produjo átomos: revisa el número de columnas por línea.');
  return {format:'SIESTA XV',atoms,cell,warnings,speciesMap:Object.fromEntries(speciesSeen)};
}

/** [REGISTRO-DOC-START:sectionLines]
 * Extrae líneas de una sección con nombre dentro de un archivo LAMMPS DATA.
 *
 * Entradas: lines: líneas del archivo; startName: encabezado de sección.
 * Salida: Array<string> de líneas pertenecientes a la sección.
 * Efectos/observaciones: Función auxiliar de parseLAMMPSData().
 * [REGISTRO-DOC-END:sectionLines]
 */
function sectionLines(lines,startName){
  const out=[];
  let on=false;
  for(const line of lines){
    const trimmed=line.trim();
    if(!on){ if(new RegExp('^'+startName+'\\b','i').test(trimmed)) on=true; continue; }
    if(!trimmed){ if(out.length) continue; else continue; }
    if(/^[A-Za-z][A-Za-z\s_#-]*$/.test(trimmed) && !/^\d/.test(trimmed)) break;
    if(!trimmed.startsWith('#')) out.push(line);
  }
  return out;
}
/** [REGISTRO-DOC-START:parseLAMMPSData]
 * Interpreta LAMMPS DATA: límites de caja, masas/tipos y sección Atoms, probando layouts comunes de columnas.
 *
 * Entradas: text: contenido LAMMPS DATA.
 * Salida: {format:"LAMMPS DATA", atoms, cell}.
 * Efectos/observaciones: Selecciona el layout de Atoms con mejor consistencia espacial y usa Masses/comentarios para inferir especies.
 * [REGISTRO-DOC-END:parseLAMMPSData]
 */
function parseLAMMPSData(text){
  const lines=text.split(/\r?\n/);
  const box={};
  for(const line of lines){
    let m=line.match(/([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+xlo\s+xhi/i); if(m){box.xlo=+m[1];box.xhi=+m[2];}
    m=line.match(/([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+ylo\s+yhi/i); if(m){box.ylo=+m[1];box.yhi=+m[2];}
    m=line.match(/([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+zlo\s+zhi/i); if(m){box.zlo=+m[1];box.zhi=+m[2];}
  }
  const masses={};
  for(const line of sectionLines(lines,'Masses')){
    const comment=(line.split('#')[1]||'').trim();
    const v=cleanLine(line).split(/\s+/);
    if(v.length>=2){
      const typ=parseInt(v[0],10), mass=parseFloat(v[1]);
      const el=elementFromMass(mass,comment);
      if(typ&&el) masses[typ]=el;
    }
  }
  const atomLines=sectionLines(lines,'Atoms');
  const candidates=[{typeIdx:1,xyzIdx:2},{typeIdx:1,xyzIdx:3},{typeIdx:2,xyzIdx:3},{typeIdx:2,xyzIdx:4}];
  let best=null;
  for(const cand of candidates){
    const atoms=[]; let score=0;
    for(const line of atomLines){
      const v=cleanLine(line).split(/\s+/).map(Number);
      if(v.length<=cand.xyzIdx+2 || !Number.isFinite(v[cand.typeIdx])) continue;
      const typ=Math.round(v[cand.typeIdx]);
      const x=v[cand.xyzIdx],y=v[cand.xyzIdx+1],z=v[cand.xyzIdx+2];
      if(![x,y,z].every(Number.isFinite)) continue;
      if(box.xlo!==undefined){
        if(x>=box.xlo-5&&x<=box.xhi+5&&y>=box.ylo-5&&y<=box.yhi+5) score++;
      }else score++;
      atoms.push({symbol:masses[typ]||({1:'B',2:'N',3:'C',4:'H'}[typ]||'C'),x,y,z});
    }
    if(!best||score>best.score) best={score,atoms,cand};
  }
  const cell=(box.xhi!==undefined)?{a:box.xhi-box.xlo,b:box.yhi-box.ylo,c:box.zhi-box.zlo}:null;
  return {format:'LAMMPS DATA',atoms:(best&&best.atoms)||[],cell};
}
/** [REGISTRO-DOC-START:parseLAMMPSDump]
 * Interpreta el último bloque ATOMS de un dump LAMMPS y admite coordenadas absolutas, unwrapped o escaladas.
 *
 * Entradas: text: contenido LAMMPS dump/lammpstrj.
 * Salida: {format:"LAMMPS DUMP", atoms, cell}.
 * Efectos/observaciones: Lanza Error si no existe sección ATOMS.
 * [REGISTRO-DOC-END:parseLAMMPSDump]
 */
function parseLAMMPSDump(text){
  const lines=text.split(/\r?\n/);
  let lastAtomsIdx=-1;
  for(let i=0;i<lines.length;i++) if(/^ITEM:\s*ATOMS/i.test(lines[i])) lastAtomsIdx=i;
  if(lastAtomsIdx<0) throw new Error('Dump LAMMPS sin sección ATOMS.');
  let boxIdx=-1;
  for(let i=lastAtomsIdx;i>=0;i--) if(/^ITEM:\s*BOX BOUNDS/i.test(lines[i])){boxIdx=i;break;}
  const box={xlo:0,xhi:1,ylo:0,yhi:1,zlo:0,zhi:1};
  if(boxIdx>=0){
    const x=nums(lines[boxIdx+1]), y=nums(lines[boxIdx+2]), z=nums(lines[boxIdx+3]);
    if(x.length>=2){box.xlo=x[0];box.xhi=x[1];}
    if(y.length>=2){box.ylo=y[0];box.yhi=y[1];}
    if(z.length>=2){box.zlo=z[0];box.zhi=z[1];}
  }
  const cols=lines[lastAtomsIdx].replace(/^ITEM:\s*ATOMS\s*/i,'').trim().split(/\s+/);
  const col=name=>cols.indexOf(name);
  const ix=col('x')>=0?col('x'):col('xu')>=0?col('xu'):col('xs');
  const iy=col('y')>=0?col('y'):col('yu')>=0?col('yu'):col('ys');
  const iz=col('z')>=0?col('z'):col('zu')>=0?col('zu'):col('zs');
  const it=col('type'), ie=col('element');
  const scaled=(cols[ix]||'').endsWith('s');
  const atoms=[];
  for(let i=lastAtomsIdx+1;i<lines.length;i++){
    if(/^ITEM:/i.test(lines[i])) break;
    const t=lines[i].trim().split(/\s+/); if(!t.length) continue;
    const typ=it>=0?Math.round(+t[it]):0;
    let symbol=ie>=0?normalizeSymbol(t[ie]):({1:'B',2:'N',3:'C',4:'H'}[typ]||'C');
    let x=+t[ix],y=+t[iy],z=+t[iz];
    if(scaled){x=box.xlo+x*(box.xhi-box.xlo);y=box.ylo+y*(box.yhi-box.ylo);z=box.zlo+z*(box.zhi-box.zlo);}
    if(symbol&&[x,y,z].every(Number.isFinite)) atoms.push({symbol,x,y,z});
  }
  return {format:'LAMMPS DUMP',atoms,cell:{a:box.xhi-box.xlo,b:box.yhi-box.ylo,c:box.zhi-box.zlo}};
}

/** [REGISTRO-DOC-START:inferNxNy]
 * Estima las dimensiones discretas Nx×Ny requeridas para representar la geometría importada.
 *
 * Entradas: parsed: geometría interpretada; text: texto original para pistas Nx/Ny.
 * Salida: {nx, ny, rowMap?}.
 * Efectos/observaciones: Prioriza preservación por filas, luego pistas textuales/celda y finalmente bounding box geométrico.
 * [REGISTRO-DOC-END:inferNxNy]
 */
function inferNxNy(parsed,text){
  const rowMap=mapAtomsByRows(parsed);
  if(rowMap && rowMap.nx && rowMap.ny) return {nx:clampInt(rowMap.nx,2,192),ny:clampInt(rowMap.ny,2,192),rowMap};
  const mNx=text&&text.match(/\bN[xX]\s*=\s*(\d+)/); const mNy=text&&text.match(/\bN[yY]\s*=\s*(\d+)/);
  if(mNx&&mNy) return {nx:clampInt(+mNx[1],2,192),ny:clampInt(+mNy[1],2,192)};
  if(parsed.cell&&parsed.cell.a&&parsed.cell.b){
    const nx=clampInt(Math.round(parsed.cell.a/(1.5*IMPORT_D)),2,192);
    const ny=clampInt(Math.round(parsed.cell.b/(Math.sqrt(3)*IMPORT_D/2)),2,192);
    if(nx>=2&&ny>=2) return {nx,ny};
  }
  const atoms=parsed.atoms.filter(a=>a.symbol!=='H');
  const bb=bounds(atoms);
  const nx=clampInt(Math.round((bb.maxX-bb.minX+2*IMPORT_D)/(1.5*IMPORT_D)),2,192);
  const ny=clampInt(Math.round((bb.maxY-bb.minY+2*IMPORT_D)/(Math.sqrt(3)*IMPORT_D/2)),2,192);
  return {nx,ny};
}
/** [REGISTRO-DOC-START:clampInt]
 * Redondea y limita un valor entero a un intervalo cerrado.
 *
 * Entradas: v: valor; min/max: límites.
 * Salida: integer.
 * Efectos/observaciones: Función pura.
 * [REGISTRO-DOC-END:clampInt]
 */
function clampInt(v,min,max){return Math.max(min,Math.min(max,Math.round(v)||min));}
/** [REGISTRO-DOC-START:bounds]
 * Calcula la caja envolvente XY de una colección de átomos.
 *
 * Entradas: atoms: lista de objetos con x,y.
 * Salida: {minX,minY,maxX,maxY}.
 * Efectos/observaciones: Devuelve ceros si no hay coordenadas finitas.
 * [REGISTRO-DOC-END:bounds]
 */
function bounds(atoms){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const a of atoms){ if(a.x<minX)minX=a.x;if(a.x>maxX)maxX=a.x;if(a.y<minY)minY=a.y;if(a.y>maxY)maxY=a.y; }
  if(!Number.isFinite(minX)) minX=minY=maxX=maxY=0;
  return {minX,minY,maxX,maxY};
}

// Agrupa coordenadas casi iguales. Se usa para importar sin crear vacancias
// geometrías rectangulares generadas fuera de la app, por ejemplo franjas hBN/C.
/** [REGISTRO-DOC-START:clusterCoordinateValues]
 * Agrupa coordenadas escalares próximas usando una tolerancia absoluta y actualiza la media de cada grupo.
 *
 * Entradas: values: valores numéricos; tol: tolerancia, 0.08 por defecto.
 * Salida: Array<{values,mean}>.
 * Efectos/observaciones: Utilidad para reconstruir filas de geometrías externas con ruido numérico.
 * [REGISTRO-DOC-END:clusterCoordinateValues]
 */
function clusterCoordinateValues(values,tol=0.08){
  const sorted=Array.from(values).filter(Number.isFinite).sort((a,b)=>a-b);
  const clusters=[];
  for(const v of sorted){
    const last=clusters[clusters.length-1];
    if(!last || Math.abs(v-last.mean)>tol){
      clusters.push({values:[v],mean:v});
    }else{
      last.values.push(v);
      last.mean=last.values.reduce((s,x)=>s+x,0)/last.values.length;
    }
  }
  return clusters;
}

/** [REGISTRO-DOC-START:mapAtomsByRows]
 * Reconstruye una malla rectangular preservando filas casi completas de átomos B/N/C.
 *
 * Entradas: parsed: geometría interpretada.
 * Salida: Objeto de mapeo con grid, nx, ny, atomToGrid y metadatos, o null.
 * Efectos/observaciones: Evita introducir vacancias artificiales en heteroestructuras rectangulares completas.
 * [REGISTRO-DOC-END:mapAtomsByRows]
 */
function mapAtomsByRows(parsed){
  const atoms=parsed.atoms.map((a,origIndex)=>({...a,origIndex})).filter(a=>['B','N','C'].includes(a.symbol));
  if(!atoms.length) return null;

  // Tolerancia relativa al enlace. La separación mínima entre filas del generador
  // es aproximadamente D/2 o D, por eso 0.12 Å es segura para ruido numérico.
  const yClusters=clusterCoordinateValues(atoms.map(a=>a.y),0.12);
  if(yClusters.length<2) return null;

  const rows=yClusters.map(c=>({y:c.mean,atoms:[]}));
  for(const a of atoms){
    let best=0,bestD=Infinity;
    for(let r=0;r<rows.length;r++){
      const d=Math.abs(a.y-rows[r].y);
      if(d<bestD){bestD=d;best=r;}
    }
    rows[best].atoms.push(a);
  }
  rows.forEach(r=>r.atoms.sort((a,b)=>a.x-b.x));

  const counts=rows.map(r=>r.atoms.length).filter(n=>n>0);
  if(!counts.length) return null;
  counts.sort((a,b)=>a-b);
  const nx=counts[Math.floor(counts.length/2)];
  const ny=rows.length;
  const nonH=atoms.length;

  // Solo se aplica cuando la geometría forma filas completas o casi completas.
  // Si no, dejamos que el mapeo geométrico tradicional resuelva el archivo.
  const fullRows=rows.filter(r=>r.atoms.length===nx).length;
  if(nx<2 || ny<2 || fullRows<Math.max(2,Math.floor(0.85*ny))) return null;
  if(Math.abs(nx*ny-nonH)>Math.max(2,Math.ceil(nonH*0.02))) return null;

  // En canvas la fila i=0 es la superior. En coordenadas cartesianas la y mayor
  // corresponde a la parte superior de la vista generada.
  rows.sort((a,b)=>b.y-a.y);

  const grid=new Uint8Array(nx*ny);
  const atomToGrid={};
  let mapped=0, truncated=0;
  for(let i=0;i<ny;i++){
    const row=rows[i].atoms;
    for(let j=0;j<Math.min(nx,row.length);j++){
      const a=row[j], k=i*nx+j;
      grid[k]=a.symbol==='B'?B_T:a.symbol==='N'?N_T:C_T;
      atomToGrid[a.origIndex]=k;
      mapped++;
    }
    if(row.length>nx) truncated += row.length-nx;
  }
  const vacancies=nx*ny-mapped;
  return {
    grid,mapped,score:0,collisions:truncated,scale:1,atomToGrid,
    nx,ny,vacancies,
    orient:'AC',
    method:'row-preserve'
  };
}

/** [REGISTRO-DOC-START:setImportedVacancyControlsToZero]
 * Sincroniza los controles de vacancias de la interfaz a cero después de una importación.
 *
 * Entradas: Sin parámetros.
 * Salida: void.
 * Efectos/observaciones: Modifica elementos DOM iVac y lVac cuando existen.
 * [REGISTRO-DOC-END:setImportedVacancyControlsToZero]
 */
function setImportedVacancyControlsToZero(){
  const vac=document.getElementById('iVac');
  const lab=document.getElementById('lVac');
  if(vac){
    vac.min='0';
    vac.value='0';
  }
  if(lab) lab.textContent='0%';
}
/** [REGISTRO-DOC-START:sitePosFor]
 * Calcula la posición cartesiana ideal de un sitio de la red interna para una orientación AC o ZZ.
 *
 * Entradas: i,j: índices de malla; orient: AC/ZZ.
 * Salida: [x,y] en Å.
 * Efectos/observaciones: Usa IMPORT_D y la geometría hexagonal interna de importación.
 * [REGISTRO-DOC-END:sitePosFor]
 */
function sitePosFor(i,j,orient){
  const sr=i&1,sc=j&1,cr=i>>1,cc=j>>1;
  const LX=IMPORT_D/2, LY=IMPORT_D*Math.sqrt(3)/2, DX=2*LX+2*IMPORT_D, DY=2*LY;
  const x=cc*DX+(sr===0?(sc===0?LX:LX+IMPORT_D):(sc===0?0:2*LX+IMPORT_D));
  const y=cr*DY+(sr===0?LY:0);
  return orient==='ZZ'?[y,x]:[x,y];
}
/** [REGISTRO-DOC-START:mapAtomsToGrid]
 * Asigna átomos B/N/C a los sitios libres más próximos de una malla interna Nx×Ny.
 *
 * Entradas: parsed, nx, ny, orient.
 * Salida: Objeto {grid,mapped,score,collisions,scale,atomToGrid}.
 * Efectos/observaciones: Calcula error RMS geométrico y evita asignar dos átomos al mismo sitio.
 * [REGISTRO-DOC-END:mapAtomsToGrid]
 */
function mapAtomsToGrid(parsed,nx,ny,orient){
  const atoms=parsed.atoms.map((a,origIndex)=>({...a,origIndex})).filter(a=>['B','N','C'].includes(a.symbol));
  const ab=bounds(atoms);
  const sites=[]; let sMinX=Infinity,sMinY=Infinity,sMaxX=-Infinity,sMaxY=-Infinity;
  for(let i=0;i<ny;i++) for(let j=0;j<nx;j++){
    const [x,y]=sitePosFor(i,j,orient);
    if(x<sMinX)sMinX=x;if(x>sMaxX)sMaxX=x;if(y<sMinY)sMinY=y;if(y>sMaxY)sMaxY=y;
    sites.push({k:i*nx+j,x,y});
  }
  const axRange=ab.maxX-ab.minX||1, ayRange=ab.maxY-ab.minY||1;
  const sx=(sMaxX-sMinX||1)/axRange, sy=(sMaxY-sMinY||1)/ayRange;
  const scale=(Math.abs(sx-1)<0.25&&Math.abs(sy-1)<0.25)?1:Math.min(sx,sy);
  const grid=new Uint8Array(nx*ny);
  const atomToGrid={};
  const used=new Set();
  let err=0,mapped=0,collisions=0;
  for(const atom of atoms){
    const x=(atom.x-ab.minX)*scale+sMinX;
    const y=(atom.y-ab.minY)*scale+sMinY;
    let best=null,bestD=Infinity;
    for(const s of sites){
      if(used.has(s.k)) continue;
      const d=Math.hypot(x-s.x,y-s.y);
      if(d<bestD){bestD=d;best=s;}
    }
    if(!best){collisions++;continue;}
    used.add(best.k); mapped++; err+=bestD*bestD;
    grid[best.k]=atom.symbol==='B'?B_T:atom.symbol==='N'?N_T:C_T;
    atomToGrid[atom.origIndex]=best.k;
  }
  return {grid,mapped,score:mapped?Math.sqrt(err/mapped):Infinity,collisions,scale,atomToGrid};
}

/** [REGISTRO-DOC-START:buildImportedHSites]
 * Relaciona cada H explícito importado con el átomo B/N/C más cercano y lo transforma a la representación interna de pasivación.
 *
 * Entradas: parsed: geometría; best: resultado de mapeo.
 * Salida: Array de sitios H virtuales/importados.
 * Efectos/observaciones: Depende de Nx, Ny, G, atomPos(), D y H_BOND_FRAC.
 * [REGISTRO-DOC-END:buildImportedHSites]
 */
function buildImportedHSites(parsed,best){
  const hs=[];
  if(!parsed || !parsed.atoms || !best || !best.grid) return hs;
  const nonH=[];
  for(let origIndex=0; origIndex<parsed.atoms.length; origIndex++){
    const a=parsed.atoms[origIndex];
    const s=normalizeSymbol(a.symbol);
    if(s && s!=='H') nonH.push({...a,origIndex});
  }
  const hAtoms=parsed.atoms.filter(a=>normalizeSymbol(a.symbol)==='H');
  if(!hAtoms.length || !nonH.length) return hs;
  // Relaciona cada H explícito con el B/N/C más cercano y lo convierte a coordenadas internas.
  for(let n=0;n<hAtoms.length;n++){
    const h=hAtoms[n];
    let bestAtom=-1,bestD=Infinity;
    for(let m=0;m<nonH.length;m++){
      const a=nonH[m];
      const d=Math.hypot((h.x||0)-(a.x||0),(h.y||0)-(a.y||0),(h.z||0)-(a.z||0));
      if(d<bestD){bestD=d;bestAtom=m;}
    }
    if(bestAtom<0) continue;
    const orig=nonH[bestAtom].origIndex;
    const parent=best.atomToGrid && best.atomToGrid[orig]!==undefined ? best.atomToGrid[orig] : -1;
    if(parent<0 || parent>=Nx*Ny) continue;
    const pi=(parent/Nx)|0, pj=parent%Nx;
    const [ax,ay]=atomPos(pi,pj);
    const a=nonH[bestAtom];
    const vx=(h.x||0)-(a.x||0), vy=(h.y||0)-(a.y||0);
    const len=Math.hypot(vx,vy)||1;
    // Si el archivo trae coordenadas externas, se usa la dirección real H-padre;
    // si no cuadra perfecto con la escala interna, se mantiene una longitud visual C/B/N-H razonable.
    const visualLen=D*H_BOND_FRAC;
    hs.push({id:`impH:${n}`,parent,type:G[parent]||C_T,kind:'imported',x:ax+vx/len*visualLen,y:ay+vy/len*visualLen,rawDistance:bestD});
  }
  return hs;
}

/** [REGISTRO-DOC-START:applyImportedGeometry]
 * Integra una geometría ya parseada en el estado del simulador, decide orientación/mapeo, configura PBC y reconstruye energía/render.
 *
 * Entradas: parsed: objeto del parser; filename: nombre del archivo; text: contenido original.
 * Salida: void.
 * Efectos/observaciones: Modifica Nx, Ny, G, IMPORTED_GRID/META/H_SITES, PBC, controles DOM, PNB, energía e historial; llama draw() y ui().
 * [REGISTRO-DOC-END:applyImportedGeometry]
 */
function applyImportedGeometry(parsed,filename,text){
  const dim=inferNxNy(parsed,text||'');
  const hCount=parsed.atoms.filter(a=>a.symbol==='H').length;
  let best=null;

  // Primero intentar preservación por filas. Esto evita que una geometría
  // rectangular hBN/C completa se remapee a una caja mayor y aparezcan vacancias.
  if(dim.rowMap && dim.rowMap.grid && dim.rowMap.grid.length===dim.nx*dim.ny){
    best=dim.rowMap;
  }else{
    const ac=mapAtomsToGrid(parsed,dim.nx,dim.ny,'AC');
    const zz=mapAtomsToGrid(parsed,dim.nx,dim.ny,'ZZ');
    best=ac.score<=zz.score?{...ac,orient:'AC',method:'nearest-AC'}:{...zz,orient:'ZZ',method:'nearest-ZZ'};
  }
  if(best.mapped<1) throw new Error('No se pudieron mapear átomos B/N/C a la red h-BN.');

  Nx=dim.nx; Ny=dim.ny; latticeOrient=best.orient||'AC';
  if(!best.atomToGrid){
    const nonHAtoms=parsed.atoms.filter(a=>normalizeSymbol(a.symbol)!=='H');
    const occupied=[];
    for(let k=0;k<best.grid.length;k++) if(best.grid[k]!==V_T) occupied.push(k);
    best.atomToGrid={};
    for(let n=0;n<Math.min(nonHAtoms.length,occupied.length);n++) best.atomToGrid[n]=occupied[n];
  }
  IMPORTED_GRID=new Uint8Array(best.grid);
  if(typeof CUSTOM_PNB!=='undefined') CUSTOM_PNB=null;
  if(typeof CUSTOM_POSITIONS!=='undefined') CUSTOM_POSITIONS=null;
  if(typeof CUSTOM_OPEN_VALENCE!=='undefined') CUSTOM_OPEN_VALENCE=null;
  IMPORTED_META={
    filename,format:parsed.format,importedAt:new Date().toISOString(),
    atoms:parsed.atoms.length,nonH:best.mapped,H:hCount,score:best.score,
    Nx,Ny,orient:latticeOrient,method:best.method||'nearest'
  };
  G=new Uint8Array(best.grid);
  IMPORTED_H_SITES=buildImportedHSites(parsed,best);
  // Dejar la pasivación encendida al importar: si hay H explícitos se muestran;
  // si no los hay, los H virtuales aparecen cuando el usuario usa bordes abiertos/no periódicos.
  hPass=true;
  ready=false;

  const setVal=(id,v)=>{const el=document.getElementById(id); if(el) el.value=v;};
  const setTxt=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
  // [FIX v13.9] mismo problema que el Constructor hBN/C: los sliders
  // #iNx/#iNy (min=2,max=48) clampan en silencio cualquier Nx/Ny fuera de
  // rango, lo que corrompe la reconstrucción al presionar INICIAR/RESET si
  // la estructura importada es más grande que 48 en algún eje.
  const lockRangeToImportedDims=(id,v)=>{
    const el=document.getElementById(id);
    if(!el) return;
    const num=Number(v)||0;
    if(num<Number(el.min)) el.min=String(num);
    if(num>Number(el.max)) el.max=String(num);
    el.value=num; el.disabled=true;
    el.title='Fijado por la geometría importada. Genera una red nueva en PASO 1 para volver a editar Nx/Ny.';
  };
  lockRangeToImportedDims('iNx',Nx); setTxt('lNx',Nx);
  lockRangeToImportedDims('iNy',Ny); setTxt('lNy',Ny); setTxt('lAt',Nx*Ny);
  setVal('iOrient',latticeOrient); setVal('iH',hPass?'1':'0');
  setVal('iPore',99);
  setImportedVacancyControlsToZero();

  // Para geometrías externas se conserva PBC XY si el archivo tiene celda.
  // Si viene de XYZ sin celda pero el comentario contiene periodic=xy/x/y,
  // también se respeta esa periodicidad.
  const comment=String(text||'').split(/\r?\n/)[1]||'';
  const pm=(comment.match(/\bperiodic\s*=\s*(xy|x|y|none)\b/i)||[])[1];
  const pbcValue=parsed.cell?'XY':pm?pm.toUpperCase():'none';
  pbcX=(pbcValue==='XY'||pbcValue==='X');
  pbcY=(pbcValue==='XY'||pbcValue==='Y');
  setVal('iPBC',pbcValue);

  buildPhysNB();
  buildScreenPos();
  E=calcFullE();
  if(typeof recalcEnergyReference==='function') recalcEnergyReference();
  if(typeof clearLiveRunStats==='function') clearLiveRunStats();
  hE.push(E);hT.push(T||Ti||0);hA.push(0);hBN.push(countBonds().cNB);
  if(typeof saveInitialConfig==='function') saveInitialConfig();
  ready=true;
  draw(); ui();
  const counts=typeof getSpeciesCounts==='function'?getSpeciesCounts():null;
  addLog(`Geometría importada ✓ ${parsed.format} · ${filename} · ${Nx}×${Ny} · mapeados=${best.mapped} · H explícitos=${hCount} · H dibujables=${IMPORTED_H_SITES.length}`,'g');
  if(pbcX&&pbcY) addLog('PBC X+Y activo: no hay bordes libres virtuales; cambia a PBC X/Y/none para ver H en los bordes libres.','w');
  if(counts) addLog(`Importación preservada: N=${counts.nN} · B=${counts.nB} · C=${counts.nC} · V=${counts.nV}`,'i');
  if(best.method==='row-preserve') addLog('Modo importación: filas completas preservadas, sin crear vacancias artificiales.','g');
  else {
    addLog(`Ajuste a red ${latticeOrient}: error RMS ≈ ${best.score.toFixed(3)} Å. Los H explícitos se reinterpretan como pasivación virtual de borde.`,'i');
    if(best.score>0.65) addLog('Aviso: el archivo no coincide perfectamente con la red interna; revisar visualmente antes de simular.','w');
  }
}
