const fs = require('fs');
const path = require('path');

const guardPath = path.resolve(__dirname, '..', 'material/course-guard.js');
let code = fs.readFileSync(guardPath, 'utf8');

// 1. Add keys in DEFAULT_COURSE_KEYS
if (!code.includes('"solido":')) {
    const target = '"optica": ["OPTICA-2026", "FOTON-26", "OBANDO-OPTICA-26", "LUZ-RAYO-26", "MAXWELL-OPTICA-26"]';
    const addition = '"optica": ["OPTICA-2026", "FOTON-26", "OBANDO-OPTICA-26", "LUZ-RAYO-26", "MAXWELL-OPTICA-26"],\n' +
        '        "solido": ["SOLIDO-2026", "ESTADO-SOLIDO-26", "SOLIDOS-UFOP-26", "OBANDO-SOLIDO-26"],\n' +
        '        "faro": ["FARO-2026", "PODS-REACCION-26", "LUZ-FARO-26", "OBANDO-FARO-26"],\n' +
        '        "diagnosticas": ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26"]';
    code = code.replace(target, addition);
    console.log('Added solido, faro, diagnosticas keys');
}

// 2. Add course identification in getCurrentCourseId()
if (!code.includes("p.includes('solido')")) {
    const target = "if (p.includes('optica')) return 'optica';";
    const addition = "if (p.includes('solido') || p.includes('estado-solido')) return 'solido';\n" +
        "        if (p.includes('faro')) return 'faro';\n" +
        "        if (p.includes('diagnostica')) return 'diagnosticas';\n" +
        "        if (p.includes('optica')) return 'optica';";
    code = code.replace(target, addition);

    const titleTarget = "if (t.includes('óptica') || t.includes('optica')) return 'optica';";
    const titleAddition = "if (t.includes('sólido') || t.includes('solido')) return 'solido';\n" +
        "        if (t.includes('faro')) return 'faro';\n" +
        "        if (t.includes('diagnostica')) return 'diagnosticas';\n" +
        "        if (t.includes('óptica') || t.includes('optica')) return 'optica';";
    code = code.replace(titleTarget, titleAddition);
    console.log('Added course detection in getCurrentCourseId()');
}

// 3. Add isFaro definition
if (!code.includes("const isFaro =")) {
    const target = "const isTorneos = courseId === 'torneos';";
    const addition = "const isTorneos = courseId === 'torneos';\n    const isFaro = courseId === 'faro' || !!document.querySelector('.indice');";
    code = code.replace(target, addition);
    console.log('Added isFaro boolean');
}

// 4. Add applyFaroGuard function and hook into updateGuardState
if (!code.includes("function applyFaroGuard()")) {
    const faroGuardFunction = `
    function applyFaroGuard() {
        const unlocked = isUnlocked();
        const freeHrefs = ['#que-es', '#sistema'];
        const links = document.querySelectorAll('nav.indice a, .indice a');
        links.forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (freeHrefs.includes(href)) {
                a.classList.remove('pg-locked');
                const p = a.querySelector('.pg-lock-pill');
                if (p) p.remove();
                return;
            }
            const existingPill = a.querySelector('.pg-lock-pill');
            if (!unlocked) {
                a.classList.add('pg-locked');
                if (!existingPill) {
                    const pill = document.createElement('span');
                    pill.className = 'pg-lock-pill';
                    pill.textContent = '🔒';
                    a.appendChild(pill);
                }
            } else {
                a.classList.remove('pg-locked');
                if (existingPill) existingPill.remove();
            }
        });

        if (!window.__faroGuardBound) {
            window.__faroGuardBound = true;
            document.addEventListener('click', (e) => {
                if (isUnlocked()) return;
                const a = e.target.closest('nav.indice a, .indice a');
                if (!a) return;
                const href = a.getAttribute('href') || '';
                if (!freeHrefs.includes(href)) {
                    e.preventDefault();
                    e.stopPropagation();
                    openPaywall('faro');
                }
            }, true);
        }
    }
`;
    const target = "function applyTorneosGuard() {";
    code = code.replace(target, faroGuardFunction + '\n    ' + target);

    const updateTarget = "} else if (isTorneos) {\n            applyTorneosGuard();";
    const updateAddition = "} else if (isTorneos) {\n            applyTorneosGuard();\n        } else if (isFaro) {\n            applyFaroGuard();";
    code = code.replace(updateTarget, updateAddition);
    console.log('Added applyFaroGuard and updateGuardState hook');
}

fs.writeFileSync(guardPath, code, 'utf8');
console.log('material/course-guard.js updated successfully!');
