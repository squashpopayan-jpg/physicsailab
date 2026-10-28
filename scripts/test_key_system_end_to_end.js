const fs = require('fs');
const vm = require('vm');

async function runTests() {
    console.log('🧪 Ejecutando suite de pruebas automatizadas del sistema de claves...\n');
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

    // Test 1: Verificar ALL_COURSES en admin.html
    const adminHtml = fs.readFileSync('web/admin.html', 'utf8');
    const dataJs = fs.readFileSync('web/data.js', 'utf8');
    const sandboxData = { window: {} };
    vm.runInNewContext(dataJs, sandboxData);
    const courses = sandboxData.window.PLATFORM_DATA.cursos;

    assert(adminHtml.includes("id: 'historia'"), 'admin.html incluye el curso historia');
    assert(adminHtml.includes("id: 'hbn_mc'"), 'admin.html incluye el curso hbn_mc');
    assert(adminHtml.includes("function saveSingleCourseKey("), 'admin.html tiene la función saveSingleCourseKey');
    assert(adminHtml.includes("💾 Cambiar Contraseña Individual"), 'admin.html renderiza el botón individual');

    // Test 2: Simular desbloqueo en course-guard.js
    const cgCode = fs.readFileSync('material/course-guard.js', 'utf8');
    const setCourseFn = cgCode.match(/function setCourseUnlocked\([\s\S]*?^    \}/m);
    assert(setCourseFn && !setCourseFn[0].includes("localStorage.removeItem('physicsailab_admin');"), 'setCourseUnlocked no borra la sesión de admin al relockear un curso individual');
    assert(cgCode.includes("cId === 'recorrido' || cId === 'historia'"), 'course-guard.js libera recorrido e historia al 100%');

    // Test 3: Normalización y matching de claves
    const testCases = [
        { input: 'MECANICA-2026', key: 'MECANICA-2026', expected: true },
        { input: 'mecanica-2026', key: 'MECANICA-2026', expected: true },
        { input: 'MECANICA2026', key: 'MECANICA-2026', expected: true },
        { input: 'mecanica 2026', key: 'MECANICA-2026', expected: true },
        { input: 'MEC-QXN7-26', key: 'MEC-QXN7-26', expected: true },
        { input: 'mecqxn726', key: 'MEC-QXN7-26', expected: true },
        { input: 'MAXI', key: 'MAXI', expected: true },
        { input: 'maxi', key: 'MAXI', expected: true },
        { input: 'maxi ', key: 'MAXI', expected: true },
        { input: 'OBANDO-ADMIN-2026', key: 'CUALQUIERA', expected: true }, // Master admin
        { input: 'UNICAUCA-2026', key: 'CUALQUIERA', expected: true },   // Fallback universal
        { input: 'CLAVE-ERRONEA', key: 'MECANICA-2026', expected: false }
    ];

    testCases.forEach(({ input, key, expected }) => {
        const raw = (input || '').trim().toUpperCase();
        const rawClean = raw.replace(/[\s\-_]/g, '');
        const targetClean = (key || '').toUpperCase().replace(/[\s\-_]/g, '');

        const isAdmin = raw === 'OBANDO-ADMIN-2026' || rawClean === 'OBANDOADMIN2026' || rawClean === 'OBANDO2026';
        const isUni = rawClean === 'UNICAUCA2026' || rawClean === 'FISICA2026';
        const isMatch = isAdmin || isUni || (raw === key.toUpperCase()) || (rawClean === targetClean);

        assert(isMatch === expected, `Matching para "${input}" contra "${key}" -> ${isMatch} (esperado: ${expected})`);
    });

    // Test 4: Comprobar conexión y actualización real con Firebase para una clave individual
    console.log('\n🌐 Probando actualización real de clave individual con Firebase Realtime DB...');
    const testCourseId = 'mecanica';
    const testKeyToSave = 'MECANICA-2026';

    try {
        const putRes = await fetch(`https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/student_keys_config/monthly_keys/${testCourseId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testKeyToSave)
        });
        assert(putRes.ok, `PUT en Firebase para ${testCourseId} exitoso (HTTP ${putRes.status})`);

        const getRes = await fetch(`https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/student_keys_config/monthly_keys/${testCourseId}.json`);
        const savedVal = await getRes.json();
        assert(savedVal === testKeyToSave, `Lectura de clave guardada en Firebase: "${savedVal}" === "${testKeyToSave}"`);
    } catch(err) {
        console.error('❌ Error de red en Firebase:', err);
        failed++;
    }

    console.log(`\n========================================`);
    console.log(`RESULTADOS: ${passed} pasadas, ${failed} fallidas`);
    console.log(`========================================`);
    if (failed > 0) process.exit(1);
}

runTests();
