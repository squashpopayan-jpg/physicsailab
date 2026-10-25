const fs = require('fs');
const path = require('path');

function createRedirect(filePath, targetUrl, title) {
    const fullPath = path.resolve(__dirname, '..', filePath);
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${targetUrl}">
<title>${title}</title>
<script>location.replace("${targetUrl}");</script>
</head>
<body style="font-family:sans-serif; background:#0e1319; color:#eaf0f6; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
<div style="text-align:center;">
    <h2>Cargando ${title}...</h2>
    <p>Si no eres redirigido autom\u00e1ticamente, <a href="${targetUrl}" style="color:#38bdf8;">haz clic aqu\u00ed</a>.</p>
</div>
</body>
</html>\n`;
    fs.writeFileSync(fullPath, html, 'utf8');
    console.log('Created redirect:', filePath);
}

createRedirect('material/1_cursos/solido/index.html', 'dist/index.html', 'F\u00edsica del Estado S\u00f3lido');
createRedirect('material/1_cursos/faro/index.html', 'manual/dist/index.html', 'Faro - Pods de Reacci\u00f3n');
createRedirect('material/1_cursos/diagnosticas/index.html', 'dist/public/index.html', 'Pruebas Diagn\u00f3sticas Institucionales');
createRedirect('material/1_cursos/diagnosticas/panel.html', 'dist/public/panel.html', 'Panel de Control Docente - Pruebas Diagn\u00f3sticas');
