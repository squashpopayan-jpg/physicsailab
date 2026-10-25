const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'web', 'app.js');
let content = fs.readFileSync(appPath, 'utf8');

// Normalize for finding or check exact string
if (content.includes("'trivia-historia'")) {
    console.log('trivia-historia already present in app.js');
} else {
    content = content.replace(
        /'trivia',([\r\n\s]+)'trivia-squash',/,
        `'trivia',$1'trivia-historia',$1'trivia-squash',`
    );

    const initSquash = "if (sectionId === 'trivia-squash') {";
    const initHistoria = `if (sectionId === 'trivia-historia') {
            setTimeout(() => {
                if (window.TRIVIA_HISTORIA_ENGINE && typeof window.TRIVIA_HISTORIA_ENGINE.init === 'function') {
                    window.TRIVIA_HISTORIA_ENGINE.init();
                }
            }, 50);
        }

        if (sectionId === 'trivia-squash') {`;

    content = content.replace(initSquash, initHistoria);
    fs.writeFileSync(appPath, content, 'utf8');
    console.log('app.js updated successfully!');
}
