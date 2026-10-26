const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '../web/index.html');
let html = fs.readFileSync(p, 'utf8');

const oldChunk = `            <!-- Filtros de Categorías de Cursos -->
            <div class="filter-bar" style="margin-bottom: 2rem;">
                <button class="filter-btn course-filter-btn active" data-filter="all">Todos los Cursos (21)</button>
                <button class="filter-btn course-filter-btn" data-filter="fundamental">⚛️ Física Fundamental (7)</button>
                <button class="filter-btn course-filter-btn" data-filter="materiales">🔬 Materiales & Labs (6)</button>
                <button class="filter-btn course-filter-btn" data-filter="ia">🧠 IA & Neurociencia (2)</button>
                <button class="filter-btn course-filter-btn" data-filter="aplicada">🎾 Deporte, Idiomas & Finanzas (4)</button>
            </div>`;

const newChunk = `            <!-- Filtros de Categorías de Cursos -->
            <div class="filter-bar" style="margin-bottom: 2rem;">
                <button class="filter-btn course-filter-btn active" data-filter="all">Todos los Cursos (26)</button>
                <button class="filter-btn course-filter-btn" data-filter="fundamental">⚛️ Física Fundamental (9)</button>
                <button class="filter-btn course-filter-btn" data-filter="materiales">🔬 Materiales & Labs (6)</button>
                <button class="filter-btn course-filter-btn" data-filter="ia">🧠 IA & Neurociencia (2)</button>
                <button class="filter-btn course-filter-btn" data-filter="aplicada">🎾 Deporte, Arbitraje & Aplicadas (7)</button>
            </div>`;

const normHtml = html.replace(/\r\n/g, '\n');
const normOld = oldChunk.replace(/\r\n/g, '\n');
const normNew = newChunk.replace(/\r\n/g, '\n');

if (normHtml.includes(normOld)) {
    const updated = normHtml.replace(normOld, normNew);
    const finalContent = html.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated;
    fs.writeFileSync(p, finalContent, 'utf8');
    console.log('✅ Successfully updated course filter buttons in web/index.html');
} else {
    console.error('❌ Could not find oldChunk in web/index.html');
}
