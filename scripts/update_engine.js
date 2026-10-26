const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '../web/trivia-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

const oldPattern = `        // Algoritmo Fisher-Yates para barajar aleatoriamente las preguntas
        shuffleArray: function(array) {
            const copy = [...array];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            return copy;
        },`;

const newPattern = `        // Algoritmo Fisher-Yates optimizado con descorrelación temática anti-agrupamiento
        shuffleArray: function(array) {
            const copy = [...array];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            // Pase de descorrelación: evita que aparezcan consecutivamente preguntas de la misma área temática
            for (let i = 1; i < copy.length - 1; i++) {
                if (copy[i].area && copy[i - 1].area && copy[i].area === copy[i - 1].area) {
                    for (let j = i + 1; j < copy.length; j++) {
                        if (copy[j].area && copy[j].area !== copy[i].area) {
                            const swapTemp = copy[i];
                            copy[i] = copy[j];
                            copy[j] = swapTemp;
                            break;
                        }
                    }
                }
            }
            return copy;
        },`;

const normCode = code.replace(/\r\n/g, '\n');
const normOld = oldPattern.replace(/\r\n/g, '\n');
const normNew = newPattern.replace(/\r\n/g, '\n');

if (normCode.includes(normOld)) {
    const updated = normCode.replace(normOld, normNew);
    const finalContent = code.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated;
    fs.writeFileSync(enginePath, finalContent, 'utf8');
    console.log('✅ Successfully updated shuffleArray in web/trivia-engine.js');
} else {
    console.error('❌ Could not find oldPattern in web/trivia-engine.js');
}
