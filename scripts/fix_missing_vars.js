const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '..', 'web/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

// Target the exact block inside renderCourses
const targetBlock = `        coursesGrid.innerHTML = coursesToRender.map(c => {
            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const courseUnlocked = isCourseUnlocked(c.id);
            const adminMode = isAdmin();
            const likeInfo = getItemLikeInfo('curso-' + c.id);

            const openBtnText = courseUnlocked
                ? (isLab ? 'Abrir Laboratorio 🧪' : (isSquash ? 'Abrir Simulador Completo 🎮' : 'Abrir Curso Completo 📖'))
                : (isLab ? 'Vista Previa del Banco 👁️' : (isSquash ? 'Vista Previa de Rutinas 👁️' : 'Vista Previa Gratuita 👁️'));
            const buyBtnText = isLab ? 'Adquirir Lab 💳' : (isSquash ? 'Adquirir Simulador 💳' : 'Comprar Curso 💳');
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : 'Temario 📑');
            const tagClass = isLab ? 'lab-tag' : (c.destacado ? 'interactive' : '');

            let lockStatusBadge = '';
            if (adminMode) {
                lockStatusBadge = \`<span class="unlocked-tag admin-badge" title="Liberado con Permisos de Administrador">👑 Modo Docente</span>\`;
            } else if (courseUnlocked) {
                lockStatusBadge = \`<span class="unlocked-tag" title="Desbloqueado con clave estudiantil">🔓 Desbloqueado</span>\`;
            } else {
                lockStatusBadge = \`<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.12); color:var(--accent-amber); border-color:rgba(245,158,11,0.25);">👁️ Vista Previa</span>\`;
            }`;

const fixedBlock = `        coursesGrid.innerHTML = coursesToRender.map(c => {
            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const isPrivado = !!c.esPrivado;
            const isDiagnosticas = c.id === 'diagnosticas';
            const isFaro = c.id === 'faro';
            const adminMode = isAdmin();
            const courseUnlocked = isPrivado ? adminMode : isCourseUnlocked(c.id);
            const likeInfo = getItemLikeInfo('curso-' + c.id);

            let openBtnText = '';
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
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : (isDiagnosticas ? 'Bancos & Detalles 📋' : 'Temario 📑'));
            const tagClass = isLab ? 'lab-tag' : (c.destacado ? 'interactive' : '');

            let lockStatusBadge = '';
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

if (code.includes(targetBlock)) {
    code = code.replace(targetBlock, fixedBlock);
    console.log('Successfully replaced targetBlock directly');
} else {
    console.log('Target block string mismatch, searching with regex...');
    const regex = /coursesGrid\.innerHTML = coursesToRender\.map\(c => \{[\s\S]*?let lockStatusBadge = '';[\s\S]*?lockStatusBadge = `<span class="badge"[^>]*>👁️ Vista Previa<\/span>`;[\s\S]*?\}/;
    if (regex.test(code)) {
        code = code.replace(regex, fixedBlock);
        console.log('Successfully replaced targetBlock via regex');
    } else {
        console.error('Neither direct string nor regex matched');
    }
}

fs.writeFileSync(appJsPath, code, 'utf8');
