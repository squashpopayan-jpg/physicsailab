/* ===================================================================
   build.js — Compilador del Curso Percepción Computacional
   Empaqueta los estilos, módulos JS del núcleo y plantillas de capítulos
   en un único archivo autónomo de producción: dist/index.html
   =================================================================== */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const coreDir = path.join(srcDir, 'core');
const chapDir = path.join(srcDir, 'chapters');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('🚀 Compilando curso: Percepción Computacional...');

// 1. Leer estilos CSS
const css = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');

// 2. Leer módulos del núcleo JS en orden
const coreFiles = [
  '00-base.js',
  '10-ui.js',
  '20-plot.js',
  '30-cv.js',
  '35-sims.js',
  '40-quiz.js',
  '90-app.js'
];
const coreJs = coreFiles.map(f => {
  const p = path.join(coreDir, f);
  if (fs.existsSync(p)) {
    return `/* ==== core/${f} ==== */\n` + fs.readFileSync(p, 'utf8');
  }
  console.warn(`Aviso: Archivo ${f} no encontrado en core/`);
  return '';
}).join('\n\n');

// 3. Leer plantillas de capítulos
const chapFiles = fs.readdirSync(chapDir).filter(f => f.endsWith('.html')).sort();
console.log(`📦 Ensamblando ${chapFiles.length} capítulos...`);
const templatesHtml = chapFiles.map(f => {
  return `<!-- ==================== ${f} ==================== -->\n` + fs.readFileSync(path.join(chapDir, f), 'utf8');
}).join('\n\n');

// 4. Construir documento HTML completo
const fullHtml = `<!doctype html>
<html lang="es" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Percepción Computacional — Ing. Luis Fernando Barajas Ardila</title>
  <meta name="description" content="Curso interactivo de Percepción Computacional: Visión Artificial, Tratamiento Digital de Señales, Detección de Bordes Canny, Morfología Matemática, Segmentación Otsu, Textura Haralick, Filtros de Gabor, SIFT, Toma de Decisiones y 40 preguntas de examen.">
  <meta name="author" content="Ing. Luis Fernando Barajas Ardila — Especialización en Inteligencia Artificial">

  <!-- Favicon e Identidad -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👁️</text></svg>">

  <!-- Fuentes Tipográficas Oficiales -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..600&display=swap" rel="stylesheet">

  <!-- MathJax para Fórmulas Matemáticas LaTeX -->
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
        displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
        processEscapes: true
      },
      svg: { fontCache: 'global' },
      options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] }
    };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>

  <style>
${css}
  </style>
</head>
<body>

  <!-- Barra Superior (Topbar) -->
  <header class="topbar">
    <div class="topbar-left">
      <button type="button" class="btn-sidebar-toggle" id="btn-sidebar-toggle" title="Alternar menú lateral" aria-label="Menú">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <a href="#inicio" class="course-brand" onclick="window.PERCEPCION && window.PERCEPCION.navigateTo('inicio')">
        <div class="course-icon-badge">👁️</div>
        <div>
          <div class="course-title-text">Percepción Computacional</div>
          <div class="course-sub-text">Ing. Luis Fernando Barajas Ardila · Especialización en IA</div>
        </div>
      </a>
    </div>

    <div class="topbar-right">
      <a href="/" class="btn-portal-back" title="Volver al Portal Principal de PhysicsAILab">
        <span>←</span> <span>PhysicsAILab</span>
      </a>
      <button type="button" class="btn-theme-toggle" id="btn-theme-toggle" title="Cambiar tema claro/oscuro">
        🌙
      </button>
    </div>

    <!-- Barra de Progreso de Lectura -->
    <div class="read-progress-bar" id="read-progress-bar"></div>
  </header>

  <!-- Layout Principal -->
  <div class="app-layout">

    <!-- Menú Lateral (Sidebar) -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="sidebar-search-input" placeholder="Buscar temas, fórmulas, algoritmos..." aria-label="Buscar en el curso">
        </div>
      </div>

      <!-- Lista Generada Dinámicamente por 90-app.js -->
      <nav class="toc" id="sidebar-toc" aria-label="Tabla de Contenidos"></nav>

      <div class="sidebar-footer">
        <div><strong>Percepción Computacional</strong></div>
        <div>Especialización en Inteligencia Artificial</div>
        <div style="margin-top:0.35rem; font-size:0.72rem; color:var(--ink-3);">UNIR · Edición 2026</div>
      </div>
    </aside>

    <!-- Escenario Principal de Contenido -->
    <main class="main-content" id="main-content">
      <div id="main-chapter-container">
        <!-- Inyectado dinámicamente según hash -->
      </div>

      <footer class="course-footer">
        <p><strong>Percepción Computacional</strong> — Diseñado por el <strong>Ing. Luis Fernando Barajas Ardila</strong></p>
        <p style="margin-top:0.25rem;">Especialización en Inteligencia Artificial · Integrado oficialmente en la plataforma educativa <a href="/" style="color:var(--accent); font-weight:700;">PhysicsAILab</a></p>
      </footer>
    </main>

  </div>

  <!-- ==================== PLANTILLAS DE CAPÍTULOS ==================== -->
  <div id="templates-store" style="display:none;" aria-hidden="true">
${templatesHtml}
  </div>

  <!-- ==================== CÓDIGO JS DEL NÚCLEO ==================== -->
  <script>
${coreJs}
  </script>
</body>
</html>
`;

// 5. Escribir dist/index.html
const outIndex = path.join(distDir, 'index.html');
fs.writeFileSync(outIndex, fullHtml, 'utf8');

console.log(`✅ ¡Compilación exitosa! Archivo generado en: ${outIndex} (${(fs.statSync(outIndex).size / 1024).toFixed(1)} KB)`);
