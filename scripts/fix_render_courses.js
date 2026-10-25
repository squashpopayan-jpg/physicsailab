const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '..', 'web/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

const regex = /const isLab = c\.id === 'transformadores' \|\| c\.esLaboratorio;[\s\S]*?const tagClass = isLab \? 'lab-tag' : \(c\.destacado \? 'interactive' : ''\);/;

const replacement = `const isLab = c.id === 'transformadores' || c.esLaboratorio;
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
                openBtnText = 'Ver Catálogo Institucional 🏛️';
            } else if (isFaro) {
                openBtnText = courseUnlocked ? 'Abrir Manual de Taller 💡' : 'Vista Previa de Taller 👁️';
            } else {
                openBtnText = courseUnlocked
                    ? (isLab ? 'Abrir Laboratorio 🧪' : (isSquash ? 'Abrir Simulador Completo 🎮' : 'Abrir Curso Completo 📖'))
                    : (isLab ? 'Vista Previa del Banco 👁️' : (isSquash ? 'Vista Previa de Rutinas 👁️' : 'Vista Previa Gratuita 👁️'));
            }

            const buyBtnText = isLab ? 'Adquirir Lab 💳' : (isSquash ? 'Adquirir Simulador 💳' : (isFaro ? 'Adquirir Kit & Manual 💡' : (isDiagnosticas ? 'Cotizar Servicio 🏛️' : 'Comprar Curso 💳')));
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : (isDiagnosticas ? 'Bancos & Detalles 📋' : 'Temario 📑'));
            const tagClass = isLab ? 'lab-tag' : (c.destacado ? 'interactive' : '');`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    console.log('Successfully replaced renderCourses block via regex');
} else {
    console.error('Regex did not match');
}

// Also check lockStatusBadge
const badgeRegex = /let lockStatusBadge = '';[\s\S]*?lockStatusBadge = `<span class="badge"[^>]*>👁️ Vista Previa<\/span>`;[\s\S]*?}/;
const badgeReplacement = `let lockStatusBadge = '';
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

if (badgeRegex.test(code)) {
    code = code.replace(badgeRegex, badgeReplacement);
    console.log('Successfully replaced lockStatusBadge via regex');
}

fs.writeFileSync(appJsPath, code, 'utf8');
