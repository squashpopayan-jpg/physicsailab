const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.resolve(__dirname, '..', 'web/index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const targetSnippet = '<!-- Instalaciones Universitarias & Gemelo Digital (Ubicación No Intrusiva) -->';
// Also handle potential encoding differences
const targetRegex = /<!-- Instalaciones Universitarias[\s\S]*?Gemelo Digital[\s\S]*?-->[\s\S]*?<div style="margin-top:2rem; background:linear-gradient[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newSection = `
            <!-- Investigación Científica & Servicios Académicos Especializados -->
            <div style="margin-top:2rem; display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
                <!-- Card Investigación hBN-MC -->
                <div style="background:linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(15, 23, 42, 0.8)); border:1px solid rgba(168,85,247,0.3); border-radius:18px; padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                            <span class="badge" style="background:rgba(168,85,247,0.15); color:#c084fc; border-color:rgba(168,85,247,0.35); font-size:0.75rem;">
                                🔬 Investigación & Tesis M.Sc.
                            </span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">UFOP (Brasil) / Unicauca</span>
                        </div>
                        <h4 style="color:#fff; font-size:1.15rem; margin:0 0 0.5rem;">Simulador Monte Carlo hBN-MC (Nanoporos en h-BN)</h4>
                        <p style="font-size:0.86rem; color:var(--text-muted); line-height:1.5; margin:0 0 1rem;">
                            Software científico desarrollado por el Mg. Manuel Alejandro Obando a partir de cálculos de primeros principios DFT (código SIESTA) durante su maestría en Física de Materiales en la UFOP. Modela la estabilidad energética, termodinámica y dinámica de nanoporos en monocapas de nitruro de boro hexagonal y heteroestructuras h-BNC con visor 3D interactivo.
                        </p>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem;">
                        <span style="font-size:0.75rem; color:#a855f7; font-weight:600;">Herramienta Científica de Investigación</span>
                        <button type="button" class="btn btn-secondary" onclick="openAdminPanel()" style="font-size:0.8rem; padding:0.4rem 0.8rem; border-color:rgba(168,85,247,0.4); color:#c084fc;">
                            Acceso Docente 🔒
                        </button>
                    </div>
                </div>

                <!-- Card Servicio Institucional Pruebas Diagnósticas -->
                <div style="background:linear-gradient(135deg, rgba(8, 47, 73, 0.6), rgba(15, 23, 42, 0.8)); border:1px solid rgba(56,189,248,0.3); border-radius:18px; padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                            <span class="badge" style="background:rgba(56,189,248,0.15); color:#38bdf8; border-color:rgba(56,189,248,0.35); font-size:0.75rem;">
                                🏛️ Servicio Institucional
                            </span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">Colegios & Universidades</span>
                        </div>
                        <h4 style="color:#fff; font-size:1.15rem; margin:0 0 0.5rem;">Pruebas Diagnósticas & Analítica Curricular</h4>
                        <p style="font-size:0.86rem; color:var(--text-muted); line-height:1.5; margin:0 0 1rem;">
                            Servicio integral de diagnóstico estandarizado sin calculadora para 9 asignaturas clave (Física Fundamental, Matemáticas Universitarias, Cálculo I, II, III, Álgebra Lineal, Mecánica, Electromagnetismo y Ondas). La institución contrata el servicio por cohorte; el docente coordina la aplicación en vivo con códigos individuales y emite informes psicométricos de prioridades y errores conceptuales.
                        </p>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem;">
                        <span style="font-size:0.75rem; color:#38bdf8; font-weight:600;">Catálogo y Muestras Disponibles</span>
                        <a href="/material/1_cursos/diagnosticas/dist/public/index.html" target="_blank" class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem; border-color:rgba(56,189,248,0.4); color:#38bdf8;">
                            Ver Portal Institucional 🏛️
                        </a>
                    </div>
                </div>
            </div>
`;

const marker = '<!-- Navegación Inferior entre Páginas -->';
const markerRegex = /<!-- Navegaci[óo]n Inferior entre P[áa]ginas -->/;

if (markerRegex.test(html) && !html.includes('Simulador Monte Carlo hBN-MC (Nanoporos en h-BN)')) {
    html = html.replace(markerRegex, newSection + '\n\n            <!-- Navegación Inferior entre Páginas -->');
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('Successfully injected research & services card into #profesor in web/index.html');
} else {
    console.warn('Marker not found or already injected');
}
