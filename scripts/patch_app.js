const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '..', 'web/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

// 1. Admin buttons in student banner
const garminTag = '<a href="/garmin/" class="btn btn-secondary"';
if (code.includes(garminTag) && !code.includes('title="Abrir mi simulador científico privado MC hBN"')) {
    const extraButtons = `<a href="/material/1_cursos/hBN-MC/index.html" target="_blank" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem; border-color:rgba(168, 85, 247, 0.45); color:#c084fc; display:inline-flex; align-items:center; gap:0.35rem;" title="Abrir mi simulador científico privado MC hBN">
                            🔬 MC hBN
                        </a>
                        <a href="/material/1_cursos/diagnosticas/dist/public/panel.html" target="_blank" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem; border-color:rgba(56, 189, 248, 0.45); color:#38bdf8; display:inline-flex; align-items:center; gap:0.35rem;" title="Abrir panel docente de pruebas diagnósticas">
                            📊 Panel Pruebas
                        </a>
                        `;
    code = code.replace(garminTag, extraButtons + garminTag);
    console.log('1. Injected MC hBN and Panel Pruebas buttons into admin banner');
}

// 2. Modify renderCourses
const renderCoursesAnchor = 'coursesGrid.innerHTML = coursesToRender.map(c => {';
const pos = code.indexOf(renderCoursesAnchor);
if (pos !== -1) {
    const snippetStart = pos + renderCoursesAnchor.length;
    // Find where the card actions end
    const cardEndAnchor = '}).join(\'\');';
    const endPos = code.indexOf(cardEndAnchor, snippetStart);
    
    if (endPos !== -1) {
        let insideMap = code.substring(snippetStart, endPos);
        
        // Replace flags
        insideMap = insideMap.replace(
            `const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const courseUnlocked = isCourseUnlocked(c.id);
            const adminMode = isAdmin();`,
            `const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const isPrivado = !!c.esPrivado;
            const isDiagnosticas = c.id === 'diagnosticas';
            const isFaro = c.id === 'faro';
            const adminMode = isAdmin();
            const courseUnlocked = isPrivado ? adminMode : isCourseUnlocked(c.id);`
        );

        // Replace openBtnText and buyBtnText
        const oldOpenBlock = `            const openBtnText = courseUnlocked
                ? (isLab ? 'Abrir Laboratorio 🧪' : (isSquash ? 'Abrir Simulador Completo 🎮' : 'Abrir Curso Completo 📖'))
                : (isLab ? 'Vista Previa del Banco 👁️' : (isSquash ? 'Vista Previa de Rutinas 👁️' : 'Vista Previa Gratuita 👁️'));
            const buyBtnText = isLab ? 'Adquirir Lab 💳' : (isSquash ? 'Adquirir Simulador 💳' : 'Comprar Curso 💳');
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : 'Temario 📑');`;

        const newOpenBlock = `            let openBtnText = '';
            if (isPrivado) {
                openBtnText = adminMode ? 'Abrir Simulador (Docente) 🔬' : 'Acceso Privado Docente 🔒';
            } else if (isDiagnosticas) {
                openBtnText = 'Ver Portal Institucional 🏛️';
            } else if (isFaro) {
                openBtnText = courseUnlocked ? 'Abrir Manual de Taller 💡' : 'Vista Previa de Taller 👁️';
            } else {
                openBtnText = courseUnlocked
                    ? (isLab ? 'Abrir Laboratorio 🧪' : (isSquash ? 'Abrir Simulador Completo 🎮' : 'Abrir Curso Completo 📖'))
                    : (isLab ? 'Vista Previa del Banco 👁️' : (isSquash ? 'Vista Previa de Rutinas 👁️' : 'Vista Previa Gratuita 👁️'));
            }

            const buyBtnText = isLab ? 'Adquirir Lab 💳' : (isSquash ? 'Adquirir Simulador 💳' : (isFaro ? 'Adquirir Kit & Manual 💡' : (isDiagnosticas ? 'Cotizar Servicio 🏛️' : 'Comprar Curso 💳')));
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : (isDiagnosticas ? 'Bancos & Detalles 📋' : 'Temario 📑'));`;

        insideMap = insideMap.replace(oldOpenBlock, newOpenBlock);

        // Replace lockStatusBadge
        const oldBadgeBlock = `            let lockStatusBadge = '';
            if (adminMode) {
                lockStatusBadge = \`<span class="unlocked-tag admin-badge" title="Liberado con Permisos de Administrador">👑 Modo Docente</span>\`;
            } else if (courseUnlocked) {
                lockStatusBadge = \`<span class="unlocked-tag" title="Desbloqueado con clave estudiantil">🔓 Desbloqueado</span>\`;
            } else {
                lockStatusBadge = \`<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.12); color:var(--accent-amber); border-color:rgba(245,158,11,0.25);">👁️ Vista Previa</span>\`;
            }`;

        const newBadgeBlock = `            let lockStatusBadge = '';
            if (isPrivado) {
                lockStatusBadge = adminMode 
                    ? \`<span class="unlocked-tag admin-badge" style="border-color:rgba(168,85,247,0.4); color:#c084fc;" title="Herramienta privada de investigación del docente">🔬 Investigación Privada</span>\`
                    : \`<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(168,85,247,0.15); color:#c084fc; border-color:rgba(168,85,247,0.35);">🔬 Privado Docente</span>\`;
            } else if (adminMode) {
                lockStatusBadge = \`<span class="unlocked-tag admin-badge" title="Liberado con Permisos de Administrador">👑 Modo Docente</span>\`;
            } else if (courseUnlocked) {
                lockStatusBadge = \`<span class="unlocked-tag" title="Desbloqueado con clave estudiantil">🔓 Desbloqueado</span>\`;
            } else {
                lockStatusBadge = \`<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.12); color:var(--accent-amber); border-color:rgba(245,158,11,0.25);">👁️ Vista Previa</span>\`;
            }`;

        insideMap = insideMap.replace(oldBadgeBlock, newBadgeBlock);

        // Replace card action for demoPath
        const oldDemoAction = '${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center;">${openBtnText}</a>` : \'\'}';
        const newDemoAction = '${c.demoPath ? (isPrivado && !adminMode ? `<button type="button" class="btn btn-secondary" onclick="openAdminPanel()" style="flex:1; justify-content:center; border-color:rgba(168,85,247,0.4); color:#c084fc;">${openBtnText}</button>` : `<a href="${c.demoPath}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center; ${isPrivado ? "background:linear-gradient(135deg, #a855f7, #6366f1); border:none;" : ""}">${openBtnText}</a>`) : \'\'}\n                        ${(isDiagnosticas && adminMode) ? `<a href="/material/1_cursos/diagnosticas/dist/public/panel.html" target="_blank" class="btn btn-secondary" style="border-color:rgba(56,189,248,0.5); color:#38bdf8; display:inline-flex; align-items:center; gap:0.35rem;" title="Abrir panel docente de pruebas">📊 Panel Docente</a>` : \'\'}';

        insideMap = insideMap.replace(oldDemoAction, newDemoAction);

        code = code.substring(0, snippetStart) + insideMap + code.substring(endPos);
        console.log('2. Successfully updated renderCourses');
    }
}

// 3. Admin Projects Box in renderAdminDashboardContent
const adminProjectsBox = `
                <!-- Proyectos Especiales & Herramientas Docentes Exclusivas (MC hBN, Pruebas Diagnósticas, Faro & Apogeo) -->
                <div style="background:rgba(99, 102, 241, 0.08); border:1px solid rgba(99, 102, 241, 0.25); border-radius:12px; padding:1.25rem; margin-bottom:1.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem; flex-wrap:wrap; gap:0.5rem;">
                        <div>
                            <h4 style="color:#fff; font-size:1.1rem; margin:0 0 0.25rem; display:flex; align-items:center; gap:0.5rem;">
                                🔬 Espacio Docente: Proyectos Especiales & Herramientas de Investigación
                            </h4>
                            <div style="font-size:0.8rem; color:var(--text-muted);">
                                Acceso directo exclusivo para el Mg. Manuel Alejandro Obando a simuladores de tesis, plataforma institucional de evaluación y proyectos de física aplicada.
                            </div>
                        </div>
                        <span class="unlocked-tag admin-badge" style="font-size:0.72rem;">👑 Acceso Maestro</span>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem;">
                        <!-- Card 1: MC hBN -->
                        <div style="background:rgba(15,23,42,0.65); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                    <span style="font-size:0.75rem; color:#c084fc; font-weight:700; text-transform:uppercase;">Investigación DFT / UFOP</span>
                                    <span class="badge" style="font-size:0.65rem; background:rgba(168,85,247,0.2); color:#c084fc; border-color:rgba(168,85,247,0.4);">Privado</span>
                                </div>
                                <h5 style="color:#fff; font-size:0.98rem; margin:0 0 0.4rem;">hBN-MC: Simulador Monte Carlo</h5>
                                <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.85rem; line-height:1.4;">
                                    Nanoporos en nitruro de boro hexagonal y heteroestructuras h-BNC. Basado en cálculos DFT (SIESTA) y modelo de enlaces de tu maestría.
                                </p>
                            </div>
                            <a href="/material/1_cursos/hBN-MC/index.html" target="_blank" class="btn btn-primary" style="font-size:0.82rem; padding:0.45rem 0.85rem; background:linear-gradient(135deg, #a855f7, #6366f1); border:none; justify-content:center;">
                                🚀 Abrir Simulador Científico
                            </a>
                        </div>

                        <!-- Card 2: Pruebas Diagnósticas Panel -->
                        <div style="background:rgba(15,23,42,0.65); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                    <span style="font-size:0.75rem; color:#38bdf8; font-weight:700; text-transform:uppercase;">Servicio Institucional</span>
                                    <span class="badge" style="font-size:0.65rem; background:rgba(56,189,248,0.2); color:#38bdf8; border-color:rgba(56,189,248,0.4);">Panel Docente</span>
                                </div>
                                <h5 style="color:#fff; font-size:0.98rem; margin:0 0 0.4rem;">Pruebas Diagnósticas (Colegios/Univ.)</h5>
                                <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.85rem; line-height:1.4;">
                                    Control en vivo, emisión de códigos individuales por cohorte, monitoreo de estudiantes y generación de informes psicométricos institucionales.
                                </p>
                            </div>
                            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                                <a href="/material/1_cursos/diagnosticas/dist/public/panel.html" target="_blank" class="btn btn-primary" style="flex:1; font-size:0.82rem; padding:0.45rem 0.85rem; justify-content:center;">
                                    📊 Panel de Control
                                </a>
                                <a href="/material/1_cursos/diagnosticas/dist/public/index.html" target="_blank" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.65rem;" title="Ver presentación comercial para colegios">
                                    👁️
                                </a>
                            </div>
                        </div>

                        <!-- Card 3: Faro Pods de Reacción -->
                        <div style="background:rgba(15,23,42,0.65); border:1px solid rgba(251,191,36,0.3); border-radius:10px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                    <span style="font-size:0.75rem; color:#fbbf24; font-weight:700; text-transform:uppercase;">Hardware & Deporte</span>
                                    <span class="badge" style="font-size:0.65rem; background:rgba(251,191,36,0.2); color:#fbbf24; border-color:rgba(251,191,36,0.4);">En Venta</span>
                                </div>
                                <h5 style="color:#fff; font-size:0.98rem; margin:0 0 0.4rem;">Faro: Pods de Reacción Deportiva</h5>
                                <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.85rem; line-height:1.4;">
                                    Pods ToF ESP32-S3 para entrenamiento físico y squash. Manual de taller interactivo, despiece 3D, código de pods/hub y planos 1:1.
                                </p>
                            </div>
                            <a href="/material/1_cursos/faro/manual/dist/index.html" target="_blank" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem; justify-content:center; border-color:rgba(251,191,36,0.5); color:#fbbf24;">
                                💡 Abrir Taller & Manual 3D
                            </a>
                        </div>

                        <!-- Card 4: Apogeo Cohetes -->
                        <div style="background:rgba(15,23,42,0.65); border:1px solid rgba(34,197,94,0.3); border-radius:10px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                    <span style="font-size:0.75rem; color:#4ade80; font-weight:700; text-transform:uppercase;">Física Experimental</span>
                                    <span class="badge" style="font-size:0.65rem; background:rgba(34,197,94,0.2); color:#4ade80; border-color:rgba(34,197,94,0.4);">Cámara & IA</span>
                                </div>
                                <h5 style="color:#fff; font-size:0.98rem; margin:0 0 0.4rem;">Apogeo: Altimetría de Cohetes</h5>
                                <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.85rem; line-height:1.4;">
                                    Aplicación para celular Android: seguimiento visual por cámara, cálculo en vivo de altura máxima, curva CSV y tarjeta de apogeo.
                                </p>
                            </div>
                            <a href="/material/1_cursos/cohete/index.html" target="_blank" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem; justify-content:center; border-color:rgba(34,197,94,0.5); color:#4ade80;">
                                🚀 Abrir App Apogeo
                            </a>
                        </div>
                    </div>
                </div>
`;

const clavesTableMarker = '<!-- Tabla de Gestión de Claves de Estudiantes por Materia -->';
if (code.includes(clavesTableMarker) && !code.includes('🔬 Espacio Docente: Proyectos Especiales')) {
    code = code.replace(clavesTableMarker, adminProjectsBox + '\n                ' + clavesTableMarker);
    console.log('3. Injected adminProjectsBox into renderAdminDashboardContent');
}

fs.writeFileSync(appJsPath, code, 'utf8');
console.log('web/app.js patched successfully!');
