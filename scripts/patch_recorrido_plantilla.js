const fs = require('fs');
const path = require('path');

console.log('Iniciando actualizacion de plantilla de roles y 4 salas...');

// 1. Cargar web/recorrido/recorrido3d.html
const file3d = 'web/recorrido/recorrido3d.html';
let content = fs.readFileSync(file3d, 'utf8');

// A. Actualizar labs
content = content.replace(
  "const labs=[['Lab. de Mecánica 1',8],['Lab. de Mecánica 2',22],['Lab. de Fluidos',36],['Lab. de Óptica',50]];",
  "const labs=[['Lab. de Mecánica 1',8],['Lab. de Mecánica 2',22],['Lab. de Fluidos',36],['Sala 4 · Pasillo (lado izquierdo)',50]];"
);

// B. Actualizar places
content = content.replace(
  "['Fluidos',43,CW+6,Math.PI],['Óptica',57,CW+6,Math.PI],['Distribución de grupos',midC2,3.6,Math.PI],",
  "['Fluidos',43,CW+6,Math.PI],['Sala 4 (Pasillo)',57,CW+2.5,Math.PI],['Distribución de grupos',midC2,3.6,Math.PI],"
);

// C. Actualizar RN y RSH
content = content.replace(
  "const RN=['Sala 1 · Mecánica 1','Sala 2 · Mecánica 2','Sala 3 · Fluidos','Sala 4 · Óptica'],RSH=['Sala 1','Sala 2','Sala 3','Sala 4'];",
  "const RN=['Sala 1 · Mecánica 1','Sala 2 · Mecánica 2','Sala 3 · Fluidos','Sala 4 · Pasillo (lado izquierdo)'],RSH=['Sala 1','Sala 2','Sala 3','Sala 4 (Pasillo)'];"
);

// D. Insertar botón en #top
const topTarget = '<div id="loc">Entrega</div></div>';
const topReplacement = '<div id="loc">Entrega</div><button id="topBtnSheet" style="margin-top:6px;background:var(--ac);border:1px solid #ff7e47;color:#fff;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:5px;box-shadow:0 2px 6px rgba(224,101,43,0.35);">📋 Plantilla de Roles (Hoja Completa)</button></div>';
if (content.includes(topTarget)) {
  content = content.replace(topTarget, topReplacement);
}

// E. Añadir estilos CSS para la plantilla y soporte para impresión
const cssToInsert = `
/* ===== Estilos de Plantilla de Roles en 1 Hoja ===== */
.sheet-modal{position:fixed;inset:0;background:rgba(8,12,17,.88);backdrop-filter:blur(8px);z-index:9999;overflow-y:auto;padding:16px;box-sizing:border-box}
.sheet-container{max-width:1240px;margin:0 auto;background:#131c26;border:1px solid #2e4359;border-radius:14px;padding:22px 24px;color:#eaf0f6;box-shadow:0 12px 36px rgba(0,0,0,.6)}
.sheet-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #28394a;flex-wrap:wrap}
.sheet-badge{display:inline-block;background:rgba(224,101,43,.18);border:1px solid #e0652b;color:#ff8d57;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:4px;letter-spacing:.5px}
.sheet-header h2{margin:2px 0;font-size:20px;color:#fff}
.sheet-header p{margin:0;font-size:12.5px;color:#9fb0c2}
.sheet-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.btn-sheet{background:#1d2a38;color:#eaf0f6;border:1px solid #364b60;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.btn-sheet:hover{background:#27394c}
.btn-sheet.btn-primary{background:#e0652b;border-color:#ff7e47;color:#fff}
.btn-sheet.btn-primary:hover{background:#f07033}
.btn-sheet.btn-danger{background:#5a1f26;border-color:#852d36;color:#fca5a5}
.btn-sheet.btn-danger:hover{background:#752831}
.sheet-def-box{background:#17222f;border:1px solid #2b3d4f;border-radius:10px;padding:12px 14px;margin-bottom:16px}
.sheet-def-box h3{margin:0 0 8px;font-size:13.5px;color:#ff9863;display:flex;align-items:center;gap:6px}
.sheet-def-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
.sheet-def-card{padding:6px 10px;border-radius:6px;background:#0f1720;border-left:3px solid #e0652b;font-size:11px;line-height:1.35}
.sheet-def-card b{display:block;margin-bottom:2px;font-size:11.5px}
.sheet-def-card span{color:#9fb0c2}
.sheet-row-top{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
.sheet-block{background:#17222f;border:1px solid #2b3d4f;border-radius:10px;padding:12px 14px}
.sheet-block h4{margin:0 0 10px;font-size:13px;color:#fff;display:flex;align-items:center;gap:6px;border-bottom:1px solid #263647;padding-bottom:6px}
.sheet-inputs-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sheet-lbl{display:flex;flex-direction:column;font-size:11px;color:#9fb0c2;margin-bottom:6px}
.sheet-lbl input{background:#0e1620;border:1px solid #32475c;border-radius:6px;padding:5px 8px;color:#fff;font-size:12px;margin-top:2px}
.sheet-lbl input:focus{outline:none;border-color:#e0652b}
.sheet-guides-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.guide-pill{display:inline-block;padding:1px 6px;border-radius:4px;font-weight:700;font-size:10.5px;margin-bottom:2px}
.pill-a{background:#e53935;color:#fff}.pill-b{background:#1e88e5;color:#fff}.pill-c{background:#43a047;color:#fff}.pill-d{background:#fdd835;color:#111}
.sheet-stations-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.station-col{background:#17222f;border:1px solid #2b3d4f;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}
.station-col.pasillo-col{border-color:#e0652b;background:rgba(224,101,43,.06)}
.station-head{border-bottom:1px solid #2b3d4f;padding-bottom:6px}
.station-badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:#203142;color:#9fb0c2;margin-bottom:4px}
.pasillo-col .station-badge{background:#e0652b;color:#fff}
.station-title{font-size:12px;font-weight:700;color:#fff}
.station-ctrl{background:#0f1720;border-radius:6px;padding:6px;border-left:3px solid #fb8c00}
.station-exp-box{background:#0e1620;border:1px solid #243545;border-radius:6px;padding:6px;margin-bottom:6px}
.station-exp-box b{display:block;font-size:11px;color:#ff9863;margin-bottom:3px}
.station-exp-box .exp-name{width:100%;background:#14202c;border:1px solid #314456;border-radius:5px;padding:4px 6px;color:#fff;font-size:11.5px;margin-bottom:4px;box-sizing:border-box}
.station-exp-box .expo-inputs{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.station-exp-box .expo-inputs input{background:#14202c;border:1px solid #2c3e50;border-radius:4px;padding:3px 6px;color:#fff;font-size:11px;width:100%;box-sizing:border-box}
@media(max-width:960px){
  .sheet-stations-grid{grid-template-columns:1fr 1fr}
  .sheet-row-top{grid-template-columns:1fr}
}
@media(max-width:560px){
  .sheet-stations-grid{grid-template-columns:1fr}
  .sheet-inputs-grid{grid-template-columns:1fr}
}
@media print{
  html,body{background:#fff!important;color:#000!important;overflow:visible!important}
  #c,.pn,#help,#cred{display:none!important}
  .sheet-modal{position:static!important;background:#fff!important;padding:0!important;overflow:visible!important}
  .sheet-container{border:none!important;box-shadow:none!important;background:#fff!important;color:#000!important;padding:0!important;max-width:100%!important}
  .no-print{display:none!important}
  .sheet-def-box,.sheet-block,.station-col,.sheet-def-card,.station-ctrl,.station-exp-box{background:#fff!important;border:1px solid #888!important;color:#000!important}
  .sheet-def-card b,.sheet-block h4,.station-title,.station-exp-box b{color:#000!important}
  input{background:#fff!important;border:1px solid #666!important;color:#000!important}
  .sheet-badge,.station-badge{border:1px solid #000!important;color:#000!important;background:#eee!important}
  .pill-a,.pill-b,.pill-c,.pill-d{color:#000!important;border:1px solid #000!important;background:#eee!important}
  .sheet-stations-grid{grid-template-columns:repeat(4,1fr)!important;gap:6px!important}
}
`;

content = content.replace('</style></head>', cssToInsert + '\n</style></head>');

// F. Añadir el botón en tab-n (en la parte superior de nombres)
const tabNTarget = '<div id="tab-n" class="tab" style="display:none"><div class="sd">Escriba los nombres: aparecen en los letreros del modelo y se guardan en este navegador.</div><div id="names"></div>';
const tabNReplacement = '<div id="tab-n" class="tab" style="display:none"><button id="btnOpenSheetTab" style="width:100%;background:var(--ac);border:1px solid #ff7e47;color:#fff;font-weight:700;padding:8px 10px;margin-bottom:10px;border-radius:8px;cursor:pointer;">📋 Ver / Editar Plantilla en 1 Hoja</button><div class="sd">Escriba los nombres: aparecen en los letreros del modelo y se guardan en este navegador.</div><div id="names"></div>';
if (content.includes(tabNTarget)) {
  content = content.replace(tabNTarget, tabNReplacement);
}

// G. Insertar el HTML del modal antes del script
const modalHTML = `
<!-- ===== Modal de Plantilla de Roles en 1 Hoja ===== -->
<div id="modalPlantilla" class="sheet-modal" style="display:none;">
  <div class="sheet-container">
    <div class="sheet-header">
      <div class="sheet-title-box">
        <span class="sheet-badge">📋 PLANTILLA OFICIAL DE RECORRIDO · 1 HOJA</span>
        <h2>Asignación de Roles y Estaciones del Recorrido</h2>
        <p>Departamento de Física · Universidad del Cauca | 3 Salas (Mecánica 1, Mecánica 2, Fluidos) + 1 Estación en Pasillo Izquierdo</p>
      </div>
      <div class="sheet-actions no-print">
        <button id="btnPrintSheet" class="btn-sheet btn-primary">🖨️ Imprimir / Guardar PDF (1 Hoja)</button>
        <button id="btnExportJSON" class="btn-sheet">📥 Exportar JSON</button>
        <button id="btnImportJSON" class="btn-sheet">📤 Importar JSON</button>
        <input type="file" id="fileImportJSON" accept=".json" style="display:none;">
        <button id="btnDemoData" class="btn-sheet">⚡ Cargar Ejemplo</button>
        <button id="btnCloseSheet" class="btn-sheet btn-danger">✕ Cerrar</button>
      </div>
    </div>

    <!-- Guía y Definición de Roles -->
    <div class="sheet-def-box">
      <h3>📌 Definición de Roles y Responsabilidades (Guía Oficial)</h3>
      <div class="sheet-def-grid">
        <div class="sheet-def-card" style="border-left-color:#8e24aa;">
          <b style="color:#d8b4fe;">🟣 Recepción y Registro</b>
          <span>Recibe en la llegada (Salida sur) y toma lista de asistencia de colegios/estudiantes.</span>
        </div>
        <div class="sheet-def-card" style="border-left-color:#8e24aa;">
          <b style="color:#d8b4fe;">🟣 Reparto de Grupos</b>
          <span>Divide a los alumnos en 4 grupos homogéneos (A, B, C, D) y entrega escarapelas.</span>
        </div>
        <div class="sheet-def-card" style="border-left-color:#3949ab;">
          <b style="color:#93c5fd;">🔵 Guías de Grupo (A, B, C, D)</b>
          <span>Conducen a su grupo por las 4 estaciones; controlan traslados y puntualidad.</span>
        </div>
        <div class="sheet-def-card" style="border-left-color:#fb8c00;">
          <b style="color:#fdba74;">🟠 Control de Sala / Estación</b>
          <span>Supervisa el cronómetro (8-10 min por sala, rotación de 2 min), modera y da la señal de cambio.</span>
        </div>
        <div class="sheet-def-card" style="border-left-color:#00acc1;">
          <b style="color:#67e8f9;">🟢 Expositores de Mesa</b>
          <span>Demuestran y explican el fenómeno físico a cada subgrupo en rotación simultánea.</span>
        </div>
        <div class="sheet-def-card" style="border-left-color:#d81b60;">
          <b style="color:#f472b6;">🔴 Entrega y Refrigerios</b>
          <span>Recibe a los grupos en la Entrega (fin del pasillo) y coordina la entrega con refrigerio.</span>
        </div>
      </div>
    </div>

    <!-- Fila Superior: Coordinación General y Guías -->
    <div class="sheet-row-top">
      <!-- Recepción y Entrega -->
      <div class="sheet-block">
        <h4>🟣 Coordinación General (Llegada y Cierre)</h4>
        <div class="sheet-inputs-grid">
          <label class="sheet-lbl">Recepción · Llegada (Salida sur):
            <input data-sheet="rec.0" placeholder="Nombre del encargado">
          </label>
          <label class="sheet-lbl">Reparto de Grupos (Distribución):
            <input data-sheet="rec.1" placeholder="Nombre del encargado">
          </label>
          <label class="sheet-lbl" style="grid-column:span 2;">Entrega de Estudiantes y Refrigerios:
            <input data-sheet="ent.0" placeholder="Nombre del encargado">
          </label>
        </div>
      </div>

      <!-- Guías de Grupos -->
      <div class="sheet-block">
        <h4>🔵 Guías de Grupo (Acompañamiento por Colores)</h4>
        <div class="sheet-guides-grid">
          <label class="sheet-lbl"><span class="guide-pill pill-a">Guía Grupo A (Rojo)</span>
            <input data-sheet="guia.0" placeholder="Nombre del guía">
          </label>
          <label class="sheet-lbl"><span class="guide-pill pill-b">Guía Grupo B (Azul)</span>
            <input data-sheet="guia.1" placeholder="Nombre del guía">
          </label>
          <label class="sheet-lbl"><span class="guide-pill pill-c">Guía Grupo C (Verde)</span>
            <input data-sheet="guia.2" placeholder="Nombre del guía">
          </label>
          <label class="sheet-lbl"><span class="guide-pill pill-d">Guía Grupo D (Amarillo)</span>
            <input data-sheet="guia.3" placeholder="Nombre del guía">
          </label>
        </div>
      </div>
    </div>

    <!-- Bloque Inferior: 4 Estaciones (3 Salas + Pasillo Izquierdo) -->
    <div class="sheet-block">
      <h4>🔬 Estaciones Experimentales (3 Salas de lado izquierdo + 1 Estación en Pasillo Izquierdo)</h4>
      <div class="sheet-stations-grid">
        <!-- Sala 1 -->
        <div class="station-col">
          <div class="station-head">
            <span class="station-badge">SALA 1 (Lado Izq.)</span>
            <div class="station-title">Lab. Mecánica 1</div>
          </div>
          <div class="station-ctrl">
            <label class="sheet-lbl" style="margin:0;">Control de Sala 1:
              <input data-sheet="ctrl.0" placeholder="Nombre coordinador">
            </label>
          </div>
          <div class="station-exp-box">
            <b>Mesa 1</b>
            <input class="exp-name" data-sheet="ex.0.0" placeholder="Nombre del experimento 1">
            <div class="expo-inputs">
              <input data-sheet="expo.0.0.0" placeholder="Expositor 1">
              <input data-sheet="expo.0.0.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 2</b>
            <input class="exp-name" data-sheet="ex.0.1" placeholder="Nombre del experimento 2">
            <div class="expo-inputs">
              <input data-sheet="expo.0.1.0" placeholder="Expositor 1">
              <input data-sheet="expo.0.1.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 3</b>
            <input class="exp-name" data-sheet="ex.0.2" placeholder="Nombre del experimento 3">
            <div class="expo-inputs">
              <input data-sheet="expo.0.2.0" placeholder="Expositor 1">
              <input data-sheet="expo.0.2.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 4</b>
            <input class="exp-name" data-sheet="ex.0.3" placeholder="Nombre del experimento 4">
            <div class="expo-inputs">
              <input data-sheet="expo.0.3.0" placeholder="Expositor 1">
              <input data-sheet="expo.0.3.1" placeholder="Expositor 2">
            </div>
          </div>
        </div>

        <!-- Sala 2 -->
        <div class="station-col">
          <div class="station-head">
            <span class="station-badge">SALA 2 (Lado Izq.)</span>
            <div class="station-title">Lab. Mecánica 2</div>
          </div>
          <div class="station-ctrl">
            <label class="sheet-lbl" style="margin:0;">Control de Sala 2:
              <input data-sheet="ctrl.1" placeholder="Nombre coordinador">
            </label>
          </div>
          <div class="station-exp-box">
            <b>Mesa 1</b>
            <input class="exp-name" data-sheet="ex.1.0" placeholder="Nombre del experimento 1">
            <div class="expo-inputs">
              <input data-sheet="expo.1.0.0" placeholder="Expositor 1">
              <input data-sheet="expo.1.0.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 2</b>
            <input class="exp-name" data-sheet="ex.1.1" placeholder="Nombre del experimento 2">
            <div class="expo-inputs">
              <input data-sheet="expo.1.1.0" placeholder="Expositor 1">
              <input data-sheet="expo.1.1.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 3</b>
            <input class="exp-name" data-sheet="ex.1.2" placeholder="Nombre del experimento 3">
            <div class="expo-inputs">
              <input data-sheet="expo.1.2.0" placeholder="Expositor 1">
              <input data-sheet="expo.1.2.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 4</b>
            <input class="exp-name" data-sheet="ex.1.3" placeholder="Nombre del experimento 4">
            <div class="expo-inputs">
              <input data-sheet="expo.1.3.0" placeholder="Expositor 1">
              <input data-sheet="expo.1.3.1" placeholder="Expositor 2">
            </div>
          </div>
        </div>

        <!-- Sala 3 -->
        <div class="station-col">
          <div class="station-head">
            <span class="station-badge">SALA 3 (Lado Izq.)</span>
            <div class="station-title">Lab. Fluidos</div>
          </div>
          <div class="station-ctrl">
            <label class="sheet-lbl" style="margin:0;">Control de Sala 3:
              <input data-sheet="ctrl.2" placeholder="Nombre coordinador">
            </label>
          </div>
          <div class="station-exp-box">
            <b>Mesa 1</b>
            <input class="exp-name" data-sheet="ex.2.0" placeholder="Nombre del experimento 1">
            <div class="expo-inputs">
              <input data-sheet="expo.2.0.0" placeholder="Expositor 1">
              <input data-sheet="expo.2.0.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 2</b>
            <input class="exp-name" data-sheet="ex.2.1" placeholder="Nombre del experimento 2">
            <div class="expo-inputs">
              <input data-sheet="expo.2.1.0" placeholder="Expositor 1">
              <input data-sheet="expo.2.1.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 3</b>
            <input class="exp-name" data-sheet="ex.2.2" placeholder="Nombre del experimento 3">
            <div class="expo-inputs">
              <input data-sheet="expo.2.2.0" placeholder="Expositor 1">
              <input data-sheet="expo.2.2.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 4</b>
            <input class="exp-name" data-sheet="ex.2.3" placeholder="Nombre del experimento 4">
            <div class="expo-inputs">
              <input data-sheet="expo.2.3.0" placeholder="Expositor 1">
              <input data-sheet="expo.2.3.1" placeholder="Expositor 2">
            </div>
          </div>
        </div>

        <!-- Sala 4: Pasillo Lado Izquierdo -->
        <div class="station-col pasillo-col">
          <div class="station-head">
            <span class="station-badge">SALA 4 (En Pasillo)</span>
            <div class="station-title" style="color:#ff8d57;">Pasillo Lado Izquierdo</div>
          </div>
          <div class="station-ctrl">
            <label class="sheet-lbl" style="margin:0;">Control Estación Pasillo:
              <input data-sheet="ctrl.3" placeholder="Nombre coordinador">
            </label>
          </div>
          <div class="station-exp-box">
            <b>Mesa 1 (Pasillo)</b>
            <input class="exp-name" data-sheet="ex.3.0" placeholder="Nombre del experimento 1">
            <div class="expo-inputs">
              <input data-sheet="expo.3.0.0" placeholder="Expositor 1">
              <input data-sheet="expo.3.0.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 2 (Pasillo)</b>
            <input class="exp-name" data-sheet="ex.3.1" placeholder="Nombre del experimento 2">
            <div class="expo-inputs">
              <input data-sheet="expo.3.1.0" placeholder="Expositor 1">
              <input data-sheet="expo.3.1.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 3 (Pasillo)</b>
            <input class="exp-name" data-sheet="ex.3.2" placeholder="Nombre del experimento 3">
            <div class="expo-inputs">
              <input data-sheet="expo.3.2.0" placeholder="Expositor 1">
              <input data-sheet="expo.3.2.1" placeholder="Expositor 2">
            </div>
          </div>
          <div class="station-exp-box">
            <b>Mesa 4 (Pasillo)</b>
            <input class="exp-name" data-sheet="ex.3.3" placeholder="Nombre del experimento 4">
            <div class="expo-inputs">
              <input data-sheet="expo.3.3.0" placeholder="Expositor 1">
              <input data-sheet="expo.3.3.1" placeholder="Expositor 2">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

content = content.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js">', modalHTML + '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js">');

// H. Añadir la lógica JavaScript de sincronización del Modal
const jsModalLogic = `
// ===== Sincronización y Control de la Plantilla de Roles en 1 Hoja =====
const modalP = $('modalPlantilla');
function openSheetModal(){
  if(!modalP) return;
  modalP.style.display = 'block';
  // Cargar datos actuales de NAMES en todos los campos del modal
  modalP.querySelectorAll('[data-sheet]').forEach(inp => {
    const p = inp.dataset.sheet;
    inp.value = String(nget(p) || '');
  });
}
function closeSheetModal(){
  if(!modalP) return;
  modalP.style.display = 'none';
}

if($('topBtnSheet')) $('topBtnSheet').onclick = openSheetModal;
if($('btnOpenSheetTab')) $('btnOpenSheetTab').onclick = openSheetModal;
if($('btnCloseSheet')) $('btnCloseSheet').onclick = closeSheetModal;

// Sincronización al escribir en la plantilla
if(modalP){
  modalP.oninput = e => {
    const p = e.target.dataset && e.target.dataset.sheet;
    if(!p) return;
    nset(p, e.target.value);
    // Sincronizar campo en la barra lateral #names
    const sideInp = $('names').querySelector('[data-p="'+p+'"]');
    if(sideInp) sideInp.value = e.target.value;
    refreshTags();
  };
}

// Botón Imprimir
if($('btnPrintSheet')){
  $('btnPrintSheet').onclick = () => window.print();
}

// Botón Exportar JSON
if($('btnExportJSON')){
  $('btnExportJSON').onclick = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(NAMES, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', 'plantilla_recorrido_fisica_unicauca.json');
    dl.click();
  };
}

// Botón Importar JSON
if($('btnImportJSON') && $('fileImportJSON')){
  $('btnImportJSON').onclick = () => $('fileImportJSON').click();
  $('fileImportJSON').onchange = e => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const loaded = JSON.parse(ev.target.result);
        if(loaded){
          NAMES = loaded;
          try{ localStorage.setItem('fisicaTourNames', JSON.stringify(NAMES)); }catch(err){}
          openSheetModal();
          // refrescar panel lateral
          $('names').querySelectorAll('input').forEach(i => {
            const p = i.dataset && i.dataset.p;
            if(p) i.value = String(nget(p) || '');
          });
          refreshTags();
          alert('¡Plantilla importada con éxito!');
        }
      } catch(err){
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    r.readAsText(file);
  };
}

// Botón Cargar Datos de Ejemplo
if($('btnDemoData')){
  $('btnDemoData').onclick = () => {
    NAMES.rec = ['Carlos Muñoz (Llegada)', 'Prof. Andrés Gómez (Reparto)'];
    NAMES.guia = ['Laura Rivera (Guía A)', 'Mateo Valencia (Guía B)', 'Sofía Castro (Guía C)', 'David Paz (Guía D)'];
    NAMES.ent = ['Dra. Carmen Solarte (Refrigerios)'];
    NAMES.ctrl = [
      'Ing. Felipe Morales (Mecánica 1)',
      'Dra. Patricia Ortiz (Mecánica 2)',
      'Prof. Javier Delgado (Fluidos)',
      'Mg. Camilo Erazo (Pasillo Izquierdo)'
    ];
    NAMES.ex[0] = ['Péndulo Simple y Resonancia', 'Conservación del Momento', 'Plano Inclinado y Fricción', 'Leyes de Newton con Sensores'];
    NAMES.expo[0] = [
      ['Juan José Vidal', 'Ana María Ruiz'],
      ['Camilo Restrepo', 'Daniela Muñoz'],
      ['Esteban Narváez', 'Laura Jimena Mera'],
      ['Alejandro Ordóñez', 'Carolina Bolaños']
    ];
    NAMES.ex[1] = ['Choques Elásticos en Carril', 'Movimiento Circular y Centrípeta', 'Giroscopio y Momento Angular', 'Oscilador Armónico Amortiguado'];
    NAMES.expo[1] = [
      ['Santiago Benavides', 'Valentina Rengifo'],
      ['Manuel Hoyos', 'Isabella Burbano'],
      ['Nicolás Caicedo', 'Mariana Tobar'],
      ['Julián Montenegro', 'Gabriela Rosero']
    ];
    NAMES.ex[2] = ['Principio de Bernoulli y Tubo Venturi', 'Tensión Superficial y Capilaridad', 'Flotabilidad y Principio de Arquímedes', 'Viscosímetro de Esferas Descendentes'];
    NAMES.expo[2] = [
      ['Felipe Meneses', 'Andrea Pardo'],
      ['Sebastián Cerón', 'Lucía Guzmán'],
      ['Mateo Quintero', 'Tatiana Chaves'],
      ['Andrés Bastidas', 'Valeria Cifuentes']
    ];
    NAMES.ex[3] = ['Difracción Láser y Óptica de Rendijas', 'Efecto Doppler y Ondas Acústicas', 'Bobina de Tesla y Plasma', 'Electroimanes y Levitación Magnética'];
    NAMES.expo[3] = [
      ['Cristian Salazar', 'Dayana Dorado'],
      ['Brayan Rivera', 'Paula Ramos'],
      ['Kevin Guauña', 'Natalia Cerón'],
      ['Gustavo Arcos', 'Yuliana Prado']
    ];
    try{ localStorage.setItem('fisicaTourNames', JSON.stringify(NAMES)); }catch(err){}
    openSheetModal();
    $('names').querySelectorAll('input').forEach(i => {
      const p = i.dataset && i.dataset.p;
      if(p) i.value = String(nget(p) || '');
    });
    refreshTags();
  };
}
`;

// Insertar lógica JS antes de </script></body>
content = content.replace('</script></body>', jsModalLogic + '\n</script></body>');

// Guardar en web/recorrido/recorrido3d.html
fs.writeFileSync(file3d, content, 'utf8');
console.log('✅ web/recorrido/recorrido3d.html actualizado correctamente.');

// Copiar a material/1_cursos/recorrido/recorrido3d.html
fs.writeFileSync('material/1_cursos/recorrido/recorrido3d.html', content, 'utf8');
console.log('✅ material/1_cursos/recorrido/recorrido3d.html sincronizado.');
