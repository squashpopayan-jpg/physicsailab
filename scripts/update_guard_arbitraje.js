const fs = require('fs');
const path = require('path');

const guardPath = path.join(__dirname, '../material/course-guard.js');
let code = fs.readFileSync(guardPath, 'utf8');

// 1. Add "squash_arbitraje" to DEFAULT_COURSE_KEYS
if (!code.includes('"squash_arbitraje":')) {
    code = code.replace(
        '"diagnosticas": ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26"]',
        `"diagnosticas": ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26"],\n        "squash_arbitraje": ["ARBITRAJE-2026", "SQUASH-REF-26", "MANU-REF-26", "WSF-REGLAS-26"]`
    );
}

// 2. Add resolution in getCurrentCourseId
if (!code.includes("raw === 'manu_squash_arbitraje'")) {
    code = code.replace(
        `if (raw === 'squash' || raw === 'squash-sim') return 'squash_sim';`,
        `if (raw === 'manu_squash_arbitraje' || raw === 'squash_arbitraje' || raw === 'arbitraje') return 'squash_arbitraje';\n            if (raw === 'squash' || raw === 'squash-sim') return 'squash_sim';`
    );
}

// 3. Fallbacks in getCurrentCourseId
if (!code.includes("p.includes('arbitraje')")) {
    code = code.replace(
        `if (p.includes('faro')) return 'faro';`,
        `if (p.includes('arbitraje') || p.includes('manu_squash_arbitraje')) return 'squash_arbitraje';\n        if (p.includes('faro')) return 'faro';`
    );
}

if (!code.includes("t.includes('arbitraje')")) {
    code = code.replace(
        `if (t.includes('faro')) return 'faro';`,
        `if (t.includes('arbitraje')) return 'squash_arbitraje';\n        if (t.includes('faro')) return 'faro';`
    );
}

// 4. Boolean flag isArbitraje
if (!code.includes('const isArbitraje =')) {
    code = code.replace(
        `const isTorneos = courseId === 'torneos';`,
        `const isTorneos = courseId === 'torneos';\n    const isArbitraje = courseId === 'squash_arbitraje';`
    );
}

// 5. Add applyArbitrajeGuard function
if (!code.includes('function applyArbitrajeGuard()')) {
    const arbitrajeGuardFn = `
    function applyArbitrajeGuard() {
        const unlocked = isUnlocked();
        // Módulos que requieren clave completa: Árbol de interferencias y Planilla/Marcador
        const lockedTabs = ['interferencia', 'marcador'];

        lockedTabs.forEach((tabId) => {
            const btn = document.querySelector(\`.nav button[data-go="\${tabId}"]\`);
            if (btn) {
                const existingPill = btn.querySelector('.pg-lock-pill');
                if (!unlocked) {
                    btn.classList.add('pg-locked-tab');
                    if (!existingPill) {
                        const pill = document.createElement('span');
                        pill.className = 'pg-lock-pill';
                        pill.textContent = '🔒';
                        btn.appendChild(pill);
                    }
                } else {
                    btn.classList.remove('pg-locked-tab');
                    if (existingPill) existingPill.remove();
                }
            }
        });

        if (!window.__arbitrajeGuardBound) {
            window.__arbitrajeGuardBound = true;
            document.addEventListener('click', (e) => {
                if (isUnlocked()) return;
                const btn = e.target.closest('.nav button[data-go]');
                if (btn) {
                    const go = btn.getAttribute('data-go');
                    if (lockedTabs.includes(go)) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        openPaywall('squash_arbitraje');
                    }
                }
            }, true);
        }
    }
`;
    code = code.replace(
        `function applyTorneosGuard()`,
        `${arbitrajeGuardFn}\n    function applyTorneosGuard()`
    );
}

// 6. Hook into updateGuardState
if (!code.includes('} else if (isArbitraje) {')) {
    code = code.replace(
        `} else if (isTorneos) {
            applyTorneosGuard();`,
        `} else if (isTorneos) {
            applyTorneosGuard();
        } else if (isArbitraje) {
            applyArbitrajeGuard();`
    );
}

fs.writeFileSync(guardPath, code, 'utf8');
console.log('✅ Successfully updated course-guard.js with squash_arbitraje protection.');
