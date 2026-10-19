const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'public');
const webDir = path.join(__dirname, 'web');
const materialDir = path.join(__dirname, 'material');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            // Ignorar videos pesados y temporales
            if (/\.(mov|mp4)$/i.test(item)) continue;
            if (item === 'node_modules' || item === '.git') continue;
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log('📦 Empaquetando PhysicsAILab para producción en public/...');
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

console.log('👉 Copiando interfaz web a public/...');
copyRecursive(webDir, outputDir);

console.log('👉 Copiando material didáctico a public/material/...');
copyRecursive(materialDir, path.join(outputDir, 'material'));

console.log('✅ ¡Compilación completada con éxito en la carpeta public/!');
