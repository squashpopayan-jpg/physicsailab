const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
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
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log('📦 Empaquetando PhysicsAILab para producción...');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('👉 Copiando interfaz web a dist/...');
copyRecursive(webDir, distDir);

console.log('👉 Copiando material didáctico a dist/material/...');
copyRecursive(materialDir, path.join(distDir, 'material'));

console.log('✅ ¡Compilación completada con éxito en la carpeta dist/!');
