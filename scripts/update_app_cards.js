const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../web/app.js');
let code = fs.readFileSync(appPath, 'utf8');

const targetOld = `            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const isPrivado = !!c.esPrivado;
            const isDiagnosticas = c.id === 'diagnosticas';
            const isFaro = c.id === 'faro';`;

const targetNew = `            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const isArbitraje = c.id === 'squash_arbitraje';
            const isPrivado = !!c.esPrivado;
            const isDiagnosticas = c.id === 'diagnosticas';
            const isFaro = c.id === 'faro';`;

const targetOpenOld = `            } else if (isFaro) {
                openBtnText = courseUnlocked ? 'Abrir Manual de Taller 💡' : 'Vista Previa de Taller 👁️';
            } else {`;

const targetOpenNew = `            } else if (isFaro) {
                openBtnText = courseUnlocked ? 'Abrir Manual de Taller 💡' : 'Vista Previa de Taller 👁️';
            } else if (isArbitraje) {
                openBtnText = courseUnlocked ? 'Abrir Sistema de Arbitraje ⚖️' : 'Vista Previa del Arbitraje 👁️';
            } else {`;

const targetBuyOld = `const buyBtnText = isLab ? 'Adquirir Lab 💳' : (isSquash ? 'Adquirir Simulador 💳' : (isFaro ? 'Adquirir Kit & Manual 💡' : (isDiagnosticas ? 'Cotizar Servicio 🏛️' : 'Comprar Curso 💳')));
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : (isDiagnosticas ? 'Bancos & Detalles 📋' : 'Temario 📑'));`;

const targetBuyNew = `const buyBtnText = isLab ? 'Adquirir Lab 💳' : (isSquash ? 'Adquirir Simulador 💳' : (isArbitraje ? 'Adquirir Sistema Oficial ⚖️' : (isFaro ? 'Adquirir Kit & Manual 💡' : (isDiagnosticas ? 'Cotizar Servicio 🏛️' : 'Comprar Curso 💳'))));
            const detailsBtnText = isLab ? 'Ficha Técnica 📋' : (isSquash ? 'Módulos 📑' : (isArbitraje ? 'Reglamento & Módulos 📑' : (isDiagnosticas ? 'Bancos & Detalles 📋' : 'Temario 📑')));`;

code = code.replace(/\r\n/g, '\n');
code = code.replace(targetOld.replace(/\r\n/g, '\n'), targetNew.replace(/\r\n/g, '\n'));
code = code.replace(targetOpenOld.replace(/\r\n/g, '\n'), targetOpenNew.replace(/\r\n/g, '\n'));
code = code.replace(targetBuyOld.replace(/\r\n/g, '\n'), targetBuyNew.replace(/\r\n/g, '\n'));

fs.writeFileSync(appPath, code, 'utf8');
console.log('✅ Successfully updated app.js course cards rendering.');
