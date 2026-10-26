const fs = require('fs');
const path = require('path');

function updateEngine(filePath, name) {
    let code = fs.readFileSync(filePath, 'utf8');
    const oldCode = `        shuffleArray: function(array) {
            const copy = [...array];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            return copy;
        },`;

    const newCode = `        // Algoritmo Fisher-Yates optimizado con descorrelación temática anti-agrupamiento
        shuffleArray: function(array) {
            const copy = [...array];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            // Pase de descorrelación: evita que aparezcan consecutivamente preguntas de la misma categoría o época
            for (let i = 1; i < copy.length - 1; i++) {
                const catCurrent = copy[i].categoria || copy[i].area || copy[i].epoca;
                const catPrev = copy[i - 1].categoria || copy[i - 1].area || copy[i - 1].epoca;
                if (catCurrent && catPrev && catCurrent === catPrev) {
                    for (let j = i + 1; j < copy.length; j++) {
                        const catNext = copy[j].categoria || copy[j].area || copy[j].epoca;
                        if (catNext && catNext !== catCurrent) {
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
    const normOld = oldCode.replace(/\r\n/g, '\n');
    const normNew = newCode.replace(/\r\n/g, '\n');

    if (normCode.includes(normOld)) {
        const updated = normCode.replace(normOld, normNew);
        const finalContent = code.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated;
        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log(`✅ Successfully updated shuffleArray in ${name}`);
    } else {
        console.log(`ℹ️ Pattern not found in ${name} (may be already updated)`);
    }
}

updateEngine(path.join(__dirname, '../web/trivia-squash-engine.js'), 'trivia-squash-engine.js');
updateEngine(path.join(__dirname, '../web/trivia-historia-engine.js'), 'trivia-historia-engine.js');
