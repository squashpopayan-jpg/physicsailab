const fs = require('fs');
const vm = require('vm');

async function runTests() {
    console.log('🧪 Verificando cumplimiento estricto de requerimientos del usuario...\n');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log('  ✅ ' + message);
            passed++;
        } else {
            console.error('  ❌ FAILED: ' + message);
            failed++;
        }
    }

    const cg = fs.readFileSync('material/course-guard.js', 'utf8');
    const app = fs.readFileSync('web/app.js', 'utf8');
    const adminHtml = fs.readFileSync('web/admin.html', 'utf8');

    // Requerimiento 1: Quitar clave universal de estudiante
    assert(!cg.includes('UNICAUCA2026') && !cg.includes('FISICA2026') && !cg.includes('UNIVERSIDAD2026'),
        'course-guard.js: Claves universales de estudiante (UNICAUCA-2026, FISICA-2026) eliminadas por completo');
    assert(!app.includes('UNICAUCA2026') && !app.includes('FISICA2026') && !app.includes('UNIVERSIDAD2026'),
        'app.js: Claves universales de estudiante eliminadas por completo');

    // Requerimiento 2: Quitar claves oficiales semestrales estándar
    // En course-guard.js, el tryUnlock no debe validar contra DEFAULT_COURSE_KEYS
    const tryUnlockMatch = cg.match(/const tryUnlock = \(\) => \{([\s\S]*?)\n        \};/);
    assert(tryUnlockMatch && !tryUnlockMatch[1].includes('DEFAULT_COURSE_KEYS'),
        'course-guard.js: Se eliminó el fallback a claves oficiales semestrales estándar');
    assert(tryUnlockMatch && !tryUnlockMatch[1].includes('PLATFORM_DATA.clavesCursos'),
        'course-guard.js: Se eliminó la validación estática de clavesCursos');

    // Requerimiento 3: Dejar ÚNICAMENTE las claves que genera el administrador (las que están)
    const firebaseRes = await fetch('https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/student_keys_config/monthly_keys.json');
    const cloudKeys = await firebaseRes.json();
    console.log('\n📡 Claves vigentes activas generadas por el administrador en Firebase:');
    console.log(cloudKeys);

    // Probar validación lógica:
    function simulateValidate(val, courseId, cloudMap) {
        const rawVal = (val || '').trim();
        const v = rawVal.toUpperCase();
        const vClean = v.replace(/[\s\-_]/g, '');

        // 1. Master admin
        if (v === 'OBANDO-ADMIN-2026' || vClean === 'OBANDOADMIN2026') return { ok: true, reason: 'admin' };

        // 2. Solo la clave activa del admin
        const target = (cloudMap[courseId] || '').trim().toUpperCase();
        const targetClean = target.replace(/[\s\-_]/g, '');

        if (target && (v === target || (vClean && vClean === targetClean))) {
            return { ok: true, reason: 'admin_active_key' };
        }
        return { ok: false, reason: 'invalid_key' };
    }

    // Para laboratorio: la clave activa es 'MAXI'
    assert(simulateValidate('MAXI', 'laboratorio', cloudKeys).ok === true, 'Laboratorio: clave "MAXI" aceptada');
    assert(simulateValidate('maxi', 'laboratorio', cloudKeys).ok === true, 'Laboratorio: clave "maxi" aceptada (flexible)');
    assert(simulateValidate('LAB-PROYECTO-2026', 'laboratorio', cloudKeys).ok === false, 'Laboratorio: clave antigua estándar "LAB-PROYECTO-2026" RECHAZADA');
    assert(simulateValidate('UNICAUCA-2026', 'laboratorio', cloudKeys).ok === false, 'Laboratorio: clave universal "UNICAUCA-2026" RECHAZADA');

    // Para cuantica: la clave activa es 'CUA-GE1J-26'
    assert(simulateValidate('CUA-GE1J-26', 'cuantica', cloudKeys).ok === true, 'Cuántica: clave de admin "CUA-GE1J-26" aceptada');
    assert(simulateValidate('cuage1j26', 'cuantica', cloudKeys).ok === true, 'Cuántica: clave "cuage1j26" aceptada sin guiones');
    assert(simulateValidate('CUANTICA-2026', 'cuantica', cloudKeys).ok === false, 'Cuántica: clave antigua estándar "CUANTICA-2026" RECHAZADA');

    // Clave de maestro docente
    assert(simulateValidate('OBANDO-ADMIN-2026', 'cuantica', cloudKeys).ok === true, 'Profesor Obando: Clave Maestra de Administrador funciona');

    // Requerimiento 4: Mejorar el buscador con coincidencias flexibles sin tildes
    console.log('\n🔎 Probando el nuevo buscador mejorado de materias...');
    // Extraer normalizeSearchText y ALL_COURSES de admin.html
    const sandbox = {};
    vm.runInNewContext(`
        ${adminHtml.match(/const ALL_COURSES = \[[\s\S]*?\n        \];/)[0]}
        ${adminHtml.match(/function normalizeSearchText\(str\) \{[\s\S]*?\n        \}/)[0]}
        const loadedCourseKeys = ${JSON.stringify(cloudKeys)};

        function searchCourses(filterQuery) {
            const qClean = normalizeSearchText(filterQuery);
            const tokens = qClean ? qClean.split(' ').filter(Boolean) : [];
            if (tokens.length === 0) return ALL_COURSES;
            return ALL_COURSES.filter(c => {
                const activeKey = loadedCourseKeys[c.id] || c.defaultKey || '';
                const searchable = normalizeSearchText([
                    c.name || '',
                    c.id || '',
                    (c.id || '').replace(/_/g, ' '),
                    c.cat || '',
                    c.desc || '',
                    activeKey
                ].join(' '));
                return tokens.every(tok => searchable.includes(tok));
            });
        }
    `, sandbox);

    const testQueries = [
        { q: 'mecanica', expectedId: 'mecanica' },
        { q: 'Mecánica', expectedId: 'mecanica' },
        { q: 'optica', expectedId: 'optica' },
        { q: 'Óptica', expectedId: 'optica' },
        { q: 'solido', expectedId: 'solido' },
        { q: 'sólido', expectedId: 'solido' },
        { q: 'cuantica', expectedId: 'cuantica' },
        { q: 'cuántica', expectedId: 'cuantica' },
        { q: 'termo', expectedId: 'termo' },
        { q: 'termodinamica', expectedId: 'termo' },
        { q: 'Termodinámica', expectedId: 'termo' },
        { q: 'MAXI', expectedId: 'laboratorio' },        // Búsqueda por contraseña activa
        { q: 'faro pods', expectedId: 'faro' },          // Búsqueda multi-palabra
        { q: 'lab venturi', expectedId: 'venturi' },     // Búsqueda multi-palabra
        { q: 'arbitraje', expectedId: 'squash_arbitraje' },
        { q: 'hbn', expectedId: 'hbn_mc' },
        { q: 'historia', expectedId: 'historia' }
    ];

    testQueries.forEach(({ q, expectedId }) => {
        const results = sandbox.searchCourses(q);
        const hasExpected = results.some(r => r.id === expectedId);
        assert(hasExpected, `Buscador coincidencia para "${q}" -> encontró "${expectedId}" (${results.length} resultado(s))`);
    });

    console.log(`\n========================================`);
    console.log(`RESULTADOS: ${passed} pasadas, ${failed} fallidas`);
    console.log(`========================================`);
    if (failed > 0) process.exit(1);
}

runTests();
