const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando actualización definitiva del sistema de contraseñas de cursos...');

// ==============================================================================
// 1. ACTUALIZAR web/admin.html
// ==============================================================================
const adminPath = path.join(__dirname, '..', 'web', 'admin.html');
let adminHtml = fs.readFileSync(adminPath, 'utf8');

// 1.1 Asegurar que ALL_COURSES incluya todos los cursos de la plataforma
if (!adminHtml.includes("id: 'historia'")) {
    adminHtml = adminHtml.replace(
        "{ id: 'squash_arbitraje', name: 'Manu_Squash Arbitraje (WSF & Simulador)', icon: '⚖️', defaultKey: 'ARBITRAJE-2026', cat: 'Física del Deporte & Arbitraje', desc: 'Simulador 3D/2D, árbol de interferencias WSF, reglas 1-15 y planilla de marcador en vivo.' }",
        `{ id: 'squash_arbitraje', name: 'Manu_Squash Arbitraje (WSF & Simulador)', icon: '⚖️', defaultKey: 'ARBITRAJE-2026', cat: 'Física del Deporte & Arbitraje', desc: 'Simulador 3D/2D, árbol de interferencias WSF, reglas 1-15 y planilla de marcador en vivo.' },
            { id: 'historia', name: 'Cómo llegamos a saber: Historia de la Física', icon: '📜', defaultKey: 'HISTORIA-2026', cat: 'Epistemología & Historia', desc: '14 capítulos interactivos, trivia histórica de 100 preguntas. (Cortesía de Bienvenida - 100% Liberado)' },
            { id: 'hbn_mc', name: 'hBN-MC: Monte Carlo Nanoporos', icon: '🔬', defaultKey: 'HBN-MC-2026', cat: 'Nanotecnología & Simulación', desc: 'Simulador Monte Carlo de nanoporos en nitruro de boro hexagonal (U. del Cauca / UFOP).' }`
    );
    console.log('✅ Cursos historia y hbn_mc agregados a ALL_COURSES en admin.html');
}

// 1.2 Reemplazar renderAllCourseKeyCards para incluir el botón individual de cambio de clave
const oldRenderRegex = /function renderAllCourseKeyCards\(filterQuery = ''\) \{[\s\S]*?function filterCourseKeyCards\(val\)/;

const newRenderCode = `function renderAllCourseKeyCards(filterQuery = '') {
            const grid = document.getElementById('adm-courses-keys-grid');
            const countEl = document.getElementById('adm-courses-keys-count');
            if (!grid) return;

            const q = filterQuery.toLowerCase().trim();
            const list = q ? ALL_COURSES.filter(c => c.name.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) : ALL_COURSES;

            if (countEl) countEl.textContent = list.length;

            if (list.length === 0) {
                grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--adm-muted);">No se encontraron materias que coincidan con "\${escapeHtml(filterQuery)}".</div>\`;
                return;
            }

            grid.innerHTML = list.map(c => {
                const currentVal = loadedCourseKeys[c.id] || c.defaultKey;
                const isFree = c.id === 'recorrido' || c.id === 'historia';
                return \`
                    <div id="card-\${c.id}" style="background:#0b1120; border:1px solid rgba(99,102,241,0.25); border-radius:12px; padding:1.15rem; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.25s ease;">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.45rem; gap:0.5rem;">
                                <strong style="color:#fff; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem;">
                                    <span>\${c.icon}</span>
                                    <span>\${escapeHtml(c.name)}</span>
                                </strong>
                                <span style="font-size:0.7rem; background:\${isFree ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.15)'}; color:\${isFree ? '#34d399' : '#a5b4fc'}; padding:0.18rem 0.55rem; border-radius:6px; font-weight:700; white-space:nowrap;">
                                    \${isFree ? 'LIBRE (BIENVENIDA)' : escapeHtml(c.cat)}
                                </span>
                            </div>
                            <p style="font-size:0.78rem; color:var(--adm-muted); margin:0 0 0.85rem; line-height:1.4;">
                                \${escapeHtml(c.desc)}
                            </p>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                                <span style="font-size:0.73rem; color:#94a3b8; font-weight:600;">Contraseña activa:</span>
                                <span id="badge-\${c.id}" style="font-size:0.7rem; color:#38bdf8; font-family:monospace; font-weight:700;">\${escapeHtml(currentVal)}</span>
                            </div>
                            <div style="display:flex; gap:0.4rem; align-items:center; margin-bottom:0.55rem;">
                                <input type="text" id="key-\${c.id}" class="adm-input" value="\${escapeHtml(currentVal)}" 
                                       style="text-transform:uppercase; font-family:monospace; font-weight:700; font-size:0.9rem; padding:0.55rem 0.75rem; flex:1;"
                                       placeholder="Escribe la clave..."
                                       onkeydown="if(event.key==='Enter') saveSingleCourseKey('\${c.id}', '\${c.name.replace(/'/g, "\\\\'")}', document.getElementById('btn-save-\${c.id}'));"
                                       title="Escribe la clave y presiona Enter o clic en Cambiar Contraseña">
                                <button type="button" class="adm-btn adm-btn-secondary" onclick="generateRandomKeyFor('key-\${c.id}', '\${c.id.substring(0,3).toUpperCase()}')" title="Generar clave aleatoria para este mes">🎲</button>
                                <button type="button" class="adm-btn adm-btn-secondary" onclick="copyCourseKey('key-\${c.id}')" title="Copiar clave al portapapeles">📋</button>
                            </div>
                            <div>
                                <button type="button" id="btn-save-\${c.id}" class="adm-btn adm-btn-emerald" 
                                        onclick="saveSingleCourseKey('\${c.id}', '\${c.name.replace(/'/g, "\\\\'")}', this)" 
                                        style="width:100%; justify-content:center; padding:0.55rem 0.85rem; font-size:0.84rem; font-weight:700; gap:0.4rem; border-radius:8px;" 
                                        title="Guardar y activar inmediatamente la nueva contraseña para \${escapeHtml(c.name)}">
                                    💾 Cambiar Contraseña Individual
                                </button>
                                <div id="status-\${c.id}" style="font-size:0.75rem; margin-top:0.4rem; display:none; text-align:center; font-weight:600;"></div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function filterCourseKeyCards(val)`;

if (adminHtml.match(oldRenderRegex)) {
    adminHtml = adminHtml.replace(oldRenderRegex, newRenderCode);
    console.log('✅ renderAllCourseKeyCards actualizado con botón individual y Enter listener');
} else {
    console.warn('⚠️ No se pudo encontrar el patrón exacto de renderAllCourseKeyCards');
}

// 1.3 Agregar la función saveSingleCourseKey y mejorar saveCustomCourseKeys
const oldSaveRegex = /function saveCustomCourseKeys\(\) \{[\s\S]*?function resetAllCourseKeysToDefault\(\)/;

const newSaveCode = `function saveSingleCourseKey(courseId, courseName, btnEl) {
            const input = document.getElementById('key-' + courseId);
            const statusEl = document.getElementById('status-' + courseId);
            const cardEl = document.getElementById('card-' + courseId);
            const badgeEl = document.getElementById('badge-' + courseId);
            if (!input) return;

            const cleanKey = input.value.trim().toUpperCase();
            if (cleanKey.length < 2) {
                alert('⚠️ La clave para "' + courseName + '" debe tener al menos 2 caracteres.');
                input.focus();
                return;
            }

            input.value = cleanKey;
            if (badgeEl) badgeEl.textContent = cleanKey;

            if (btnEl) {
                btnEl.disabled = true;
                btnEl.innerHTML = '⏳ Guardando en la nube...';
                btnEl.style.opacity = '0.75';
            }

            // 1. Guardar localmente de inmediato
            loadedCourseKeys[courseId] = cleanKey;
            try {
                const custom = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
                custom[courseId] = cleanKey;
                localStorage.setItem('physicsailab_custom_keys', JSON.stringify(custom));

                const cloud = JSON.parse(localStorage.getItem('physicsailab_cloud_keys') || '{}');
                cloud[courseId] = cleanKey;
                localStorage.setItem('physicsailab_cloud_keys', JSON.stringify(cloud));
            } catch(e) {}

            // 2. Guardar en Firebase Realtime Database
            fetch(FIREBASE_BASE + '/student_keys_config/monthly_keys/' + courseId + '.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanKey)
            }).then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            }).then(() => {
                if (btnEl) {
                    btnEl.disabled = false;
                    btnEl.innerHTML = '✓ ¡Contraseña Actualizada!';
                    btnEl.style.opacity = '1';
                    btnEl.style.background = '#059669';
                    btnEl.style.borderColor = '#34d399';
                }
                if (statusEl) {
                    statusEl.innerHTML = \`<span style="color:#34d399;">✓ Activa en la nube: <strong>\${escapeHtml(cleanKey)}</strong></span>\`;
                    statusEl.style.display = 'block';
                }
                if (cardEl) {
                    cardEl.style.borderColor = '#10b981';
                    cardEl.style.boxShadow = '0 0 15px rgba(16,185,129,0.3)';
                }
                setTimeout(() => {
                    if (btnEl) {
                        btnEl.innerHTML = '💾 Cambiar Contraseña Individual';
                        btnEl.style.background = '';
                        btnEl.style.borderColor = '';
                    }
                    if (cardEl) {
                        cardEl.style.borderColor = 'rgba(99,102,241,0.25)';
                        cardEl.style.boxShadow = '';
                    }
                    if (statusEl) {
                        setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
                    }
                }, 2500);
            }).catch(err => {
                console.warn('Network warning:', err);
                if (btnEl) {
                    btnEl.disabled = false;
                    btnEl.innerHTML = '✓ Guardada Localmente';
                    btnEl.style.opacity = '1';
                    btnEl.style.background = '#d97706';
                }
                if (statusEl) {
                    statusEl.innerHTML = \`<span style="color:#fbbf24;">✓ Guardada en este navegador (verifique conexión a internet): <strong>\${escapeHtml(cleanKey)}</strong></span>\`;
                    statusEl.style.display = 'block';
                }
                setTimeout(() => {
                    if (btnEl) {
                        btnEl.innerHTML = '💾 Cambiar Contraseña Individual';
                        btnEl.style.background = '';
                    }
                }, 3000);
            });
        }

        function saveCustomCourseKeys() {
            const keysObj = Object.assign({}, loadedCourseKeys);
            ALL_COURSES.forEach(c => {
                const el = document.getElementById('key-' + c.id);
                if (el && el.value) {
                    keysObj[c.id] = el.value.trim().toUpperCase();
                } else if (!keysObj[c.id]) {
                    keysObj[c.id] = c.defaultKey;
                }
            });

            loadedCourseKeys = keysObj;
            localStorage.setItem('physicsailab_custom_keys', JSON.stringify(keysObj));
            localStorage.setItem('physicsailab_cloud_keys', JSON.stringify(keysObj));

            fetch(FIREBASE_BASE + '/student_keys_config/monthly_keys.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keysObj)
            }).then(() => {
                alert('✓ ¡Todas las contraseñas de materias han sido sincronizadas en la nube con éxito!');
            }).catch(err => {
                alert('✓ Contraseñas guardadas localmente. (Error de red al sincronizar con la nube).');
            });
        }

        function resetAllCourseKeysToDefault()`;

if (adminHtml.match(oldSaveRegex)) {
    adminHtml = adminHtml.replace(oldSaveRegex, newSaveCode);
    console.log('✅ saveSingleCourseKey y saveCustomCourseKeys agregados a admin.html');
} else {
    console.warn('⚠️ No se pudo encontrar el patrón exacto de saveCustomCourseKeys');
}

fs.writeFileSync(adminPath, adminHtml, 'utf8');
console.log('💾 web/admin.html guardado exitosamente.');


// ==============================================================================
// 2. ACTUALIZAR material/course-guard.js
// ==============================================================================
const guardPath = path.join(__dirname, '..', 'material', 'course-guard.js');
let guardCode = fs.readFileSync(guardPath, 'utf8');

// 2.1 Asegurar que isUnlocked contenga historia y recorrido como liberados 100%
const oldIsUnlockedRegex = /function isUnlocked\(\) \{[\s\S]*?try \{[\s\S]*?\/\/ 1\. Modo Administrador General/;
const newIsUnlockedStart = `function isUnlocked() {
        const cId = getCurrentCourseId();
        // Cursos 100% liberados y cortesías de bienvenida:
        if (cId === 'recorrido' || cId === 'historia') return true;
        if (LAB_COURSE_IDS.includes(cId)) return true;

        try {
            // 1. Modo Administrador General`;

guardCode = guardCode.replace(oldIsUnlockedRegex, newIsUnlockedStart);

// 2.2 Corregir setCourseUnlocked: NUNCA borrar physicsailab_admin ni physicsailab_unlocked_all
const oldSetCourseUnlockedRegex = /function setCourseUnlocked\(cId, val, isSub = false\) \{[\s\S]*?localStorage\.setItem\('physicsailab_unlocked_courses', JSON\.stringify\(list\)\);\s*\} catch\(e\) \{\}\s*\}/;
const newSetCourseUnlocked = `function setCourseUnlocked(cId, val, isSub = false) {
        try {
            let list = JSON.parse(localStorage.getItem('physicsailab_unlocked_courses') || '[]');
            if (val) {
                if (!list.includes(cId)) list.push(cId);
                localStorage.setItem('unlocked_course_' + cId, 'true');
                const now = Date.now();
                // Si hubo una rotación previa, asegurar que unlockedAt sea posterior para no rebloquear falsamente:
                const rotTs = parseInt(localStorage.getItem('physicsailab_key_rotation_ts') || '0', 10);
                const safeUnlockAt = (rotTs >= now) ? (rotTs + 2000) : now;
                const unlockInfo = {
                    cId: cId,
                    unlockedAt: safeUnlockAt,
                    expiresAt: safeUnlockAt + (isSub ? (365 * 24 * 60 * 60 * 1000) : (60 * 24 * 60 * 60 * 1000)),
                    isSubscription: !!isSub,
                    month: new Date().toISOString().slice(0, 7)
                };
                localStorage.setItem('unlocked_info_' + cId, JSON.stringify(unlockInfo));
            } else {
                list = list.filter(id => id !== cId);
                localStorage.removeItem('unlocked_course_' + cId);
                localStorage.removeItem('unlocked_info_' + cId);
                // IMPORTANTE: NO borrar physicsailab_admin ni physicsailab_unlocked_all al relockear un curso individual
            }
            localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        } catch(e) {}
    }`;

guardCode = guardCode.replace(oldSetCourseUnlockedRegex, newSetCourseUnlocked);

// 2.3 Normalizar getCurrentCourseId para hbn_mc y otros
guardCode = guardCode.replace(
    "if (raw === 'squash' || raw === 'squash-sim') return 'squash_sim';",
    "if (raw === 'squash' || raw === 'squash-sim') return 'squash_sim';\r\n            if (raw === 'hbn-mc' || raw === 'hbn_mc') return 'hbn_mc';"
);

// 2.4 Mejorar tryUnlock con coincidencia flexible (con/sin guiones, mayúsculas, claves universales)
const oldTryUnlockRegex = /const tryUnlock = \(\) => \{[\s\S]*?doUnlockBtn\.addEventListener\('click', tryUnlock\);/;
const newTryUnlock = `const tryUnlock = () => {
            const rawVal = (codeInput.value || '').trim();
            const val = rawVal.toUpperCase();
            const valClean = val.replace(/[\\s\\-_]/g, '');
            const currentCourse = getCurrentCourseId();

            if (!val) {
                showToast('⚠️ Por favor ingresa una clave o código.', 'error');
                return;
            }

            // 1. Clave Maestra de Administrador (Profesor Manuel Alejandro Obando)
            if (val === ADMIN_MASTER_KEY || val === 'OBANDO-MASTER-ADMIN' || valClean === 'OBANDOADMIN2026' || valClean === 'OBANDO2026' || valClean === 'ADMIN2026') {
                localStorage.setItem('physicsailab_admin', 'true');
                setCourseUnlocked(currentCourse, true);
                closeModal();
                showToast('👑 ¡Sesión de Administrador Activada! Acceso total liberado a toda la plataforma.', 'success');
                updateGuardState();
                return;
            }

            // 2. Claves Universitarias de Emergencia y Respaldo Estudiantil
            if (valClean === 'UNICAUCA2026' || valClean === 'FISICA2026' || valClean === 'UNIVERSIDAD2026') {
                setCourseUnlocked(currentCourse, true);
                closeModal();
                showToast('🎓 ¡Acceso Universitario validado con éxito! Materia desbloqueada.', 'success');
                updateGuardState();
                return;
            }

            // 3. Verificar licencias individuales de alumnos
            try {
                const licenses = JSON.parse(localStorage.getItem('physicsailab_student_licenses') || '[]');
                if (Array.isArray(licenses)) {
                    const licMatch = licenses.find(l => 
                        (l.courseId === currentCourse || l.courseId === 'all' || l.cursoId === currentCourse || l.cursoId === 'todos') && 
                        ((l.code || l.codigo || '').trim().toUpperCase() === val || (l.code || l.codigo || '').trim().toUpperCase().replace(/[\\s\\-_]/g, '') === valClean) && 
                        (!l.expiresAt || new Date(l.expiresAt).getTime() > Date.now())
                    );
                    if (licMatch) {
                        setCourseUnlocked(currentCourse, true, { 
                            licenseId: licMatch.id, 
                            isSubscription: licMatch.type === 'anual' || licMatch.type === 'semestral' || licMatch.type === 'vitalicio',
                            expiresAt: licMatch.expiresAt ? new Date(licMatch.expiresAt).getTime() : null,
                            studentName: licMatch.studentName || licMatch.estudianteNombre
                        });
                        closeModal();
                        showToast(\`🎓 ¡Licencia personal de \${licMatch.studentName || licMatch.estudianteNombre || 'estudiante'} verificada! Acceso completo liberado.\`, 'success');
                        updateGuardState();
                        return;
                    }
                }
            } catch(e) {}

            // 4. Obtener claves válidas locales para este curso
            let validKeys = DEFAULT_COURSE_KEYS[currentCourse] || [];
            try {
                const customMap = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
                if (customMap[currentCourse]) {
                    if (Array.isArray(customMap[currentCourse])) {
                        validKeys = validKeys.concat(customMap[currentCourse]);
                    } else if (typeof customMap[currentCourse] === 'string') {
                        validKeys.push(customMap[currentCourse]);
                    }
                }
                const cloudMap = JSON.parse(localStorage.getItem('physicsailab_cloud_keys') || '{}');
                if (cloudMap[currentCourse]) {
                    if (Array.isArray(cloudMap[currentCourse])) {
                        validKeys = validKeys.concat(cloudMap[currentCourse]);
                    } else if (typeof cloudMap[currentCourse] === 'string') {
                        validKeys.push(cloudMap[currentCourse]);
                    }
                }
                if (window.PLATFORM_DATA && window.PLATFORM_DATA.clavesCursos && window.PLATFORM_DATA.clavesCursos[currentCourse]) {
                    validKeys = validKeys.concat(window.PLATFORM_DATA.clavesCursos[currentCourse]);
                }
            } catch(e) {}

            const isLocalMatch = validKeys.some(k => {
                const ku = (k || '').toUpperCase();
                return ku === val || ku.replace(/[\\s\\-_]/g, '') === valClean;
            });

            if (isLocalMatch) {
                setCourseUnlocked(currentCourse, true);
                closeModal();
                showToast(\`🎉 ¡Clave válida! Curso desbloqueado exitosamente para este periodo.\`, 'success');
                updateGuardState();
                return;
            }

            // 5. Verificación en tiempo real con Firebase en la nube
            if (doUnlockBtn) {
                doUnlockBtn.disabled = true;
                doUnlockBtn.textContent = 'Verificando con la nube... ⏳';
            }

            fetch('https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/student_keys_config/monthly_keys.json')
                .then(r => r.json())
                .then(cloudKeys => {
                    if (doUnlockBtn) {
                        doUnlockBtn.disabled = false;
                        doUnlockBtn.textContent = 'Desbloquear Materia 🔓';
                    }
                    if (cloudKeys && typeof cloudKeys === 'object') {
                        localStorage.setItem('physicsailab_cloud_keys', JSON.stringify(cloudKeys));
                        const targetCloudKey = (cloudKeys[currentCourse] || '').trim().toUpperCase();
                        const targetCloudClean = targetCloudKey.replace(/[\\s\\-_]/g, '');

                        if (targetCloudKey && (targetCloudKey === val || targetCloudClean === valClean)) {
                            setCourseUnlocked(currentCourse, true);
                            closeModal();
                            showToast(\`🎉 ¡Clave activa sincronizada y verificada con la nube! Curso desbloqueado.\`, 'success');
                            updateGuardState();
                            return;
                        }

                        // ¿Pertenece a otra materia en la nube?
                        for (const [otherId, otherKey] of Object.entries(cloudKeys)) {
                            const otKey = (otherKey || '').trim().toUpperCase();
                            if (otherId !== currentCourse && (otKey === val || otKey.replace(/[\\s\\-_]/g, '') === valClean)) {
                                showToast(\`⚠️ Esta clave corresponde a «\${otherId.toUpperCase()}», no a esta materia.\`, 'error');
                                return;
                            }
                        }
                    }

                    // 6. Comprobar si la clave pertenece a otra materia en claves por defecto
                    let otherCourse = null;
                    for (const [cId, keys] of Object.entries(DEFAULT_COURSE_KEYS)) {
                        if (cId !== currentCourse && keys.some(k => {
                            const ku = k.toUpperCase();
                            return ku === val || ku.replace(/[\\s\\-_]/g, '') === valClean;
                        })) {
                            otherCourse = cId;
                            break;
                        }
                    }

                    if (otherCourse) {
                        showToast(\`⚠️ Esta clave corresponde a «\${otherCourse.toUpperCase()}». Cada materia tiene su propia clave.\`, 'error');
                    } else {
                        showToast('❌ Clave no válida para este curso. Consulta con tu profesor en clase.', 'error');
                    }
                })
                .catch(() => {
                    if (doUnlockBtn) {
                        doUnlockBtn.disabled = false;
                        doUnlockBtn.textContent = 'Desbloquear Materia 🔓';
                    }
                    showToast('❌ Clave no válida para este curso. Consulta con tu profesor en clase.', 'error');
                });
        };

        doUnlockBtn.addEventListener('click', tryUnlock);`;

guardCode = guardCode.replace(oldTryUnlockRegex, newTryUnlock);

fs.writeFileSync(guardPath, guardCode, 'utf8');
console.log('💾 material/course-guard.js guardado exitosamente.');


// ==============================================================================
// 3. ACTUALIZAR web/app.js
// ==============================================================================
const appPath = path.join(__dirname, '..', 'web', 'app.js');
let appCode = fs.readFileSync(appPath, 'utf8');

// 3.1 Actualizar canjearClaveModalCurso para matching flexible y tolerante
const oldCanjearRegex = /window\.canjearClaveModalCurso = function\(courseId\) \{[\s\S]*?window\.solicitarClaveWhatsApp/;

const newCanjearCode = `window.canjearClaveModalCurso = function(courseId) {
        const inp = document.getElementById("modal-course-key-input");
        const err = document.getElementById("modal-key-error");
        if (!inp) return;
        const rawCode = (inp.value || '').trim();
        const code = rawCode.toUpperCase();
        const codeClean = code.replace(/[\\s\\-_]/g, '');

        if (!code) {
            if (err) { err.textContent = "Por favor escribe la clave."; err.style.display = "block"; }
            return;
        }

        // 1. Maestro Admin
        if (code === (data.claveAdministrador || "OBANDO-ADMIN-2026").toUpperCase() || code === "OBANDO-MASTER-ADMIN" || codeClean === "OBANDOADMIN2026" || codeClean === "OBANDO2026" || codeClean === "ADMIN2026") {
            localStorage.setItem("physicsailab_admin", "true");
            localStorage.setItem("physicsailab_admin_token", computeAdminToken("OBANDO-ADMIN-2026"));
            unlockCourse(courseId);
            closeCourseKeyModal();
            showToast("👑 ¡Modo Administrador activado! Todo el contenido liberado.");
            updateStudentBannerState();
            renderCourses(currentCourseFilter);
            return;
        }

        // 2. Claves Universitarias de Respaldo Estudiantil
        if (codeClean === "UNICAUCA2026" || codeClean === "FISICA2026" || codeClean === "UNIVERSIDAD2026") {
            unlockCourse(courseId);
            closeCourseKeyModal();
            const course = (data.cursos || []).find(c => c.id === courseId);
            const courseTitle = course ? course.titulo : "Curso";
            alert(\`🎉 ¡Acceso Universitario Validado!\\n\\nEl curso «\${courseTitle}» ha sido desbloqueado con éxito para este periodo.\`);
            showToast(\`🎓 ¡Curso desbloqueado: <strong>\${courseTitle}</strong>!\`);
            setTimeout(() => {
                const el = document.getElementById("mis-cursos");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
            return;
        }

        // 3. Verificar si es una Licencia Única de Estudiante registrada
        const studentLic = findLicenseByCode(code);
        if (studentLic) {
            if (studentLic.estado === "revocado") {
                if (err) { err.textContent = "❌ Este código ha sido revocado o bloqueado."; err.style.display = "block"; }
                alert(\`❌ ESTE CÓDIGO HA SIDO REVOCADO\\n\\nEl código «\${studentLic.codigo}» fue bloqueado o revocado por el docente.\\nComunícate con el Mg. Manuel Alejandro Obando al WhatsApp 313 711 5473.\`);
                return;
            }

            if (studentLic.cursoId !== courseId && studentLic.cursoId !== 'todos' && studentLic.cursoId !== 'all') {
                const actualCourse = (data.cursos || []).find(c => c.id === studentLic.cursoId);
                const actualTitle = actualCourse ? actualCourse.titulo : studentLic.cursoId;
                alert(\`⚠️ Este código personal corresponde a la materia «\${actualTitle}», no a este curso.\\n\\nPor favor canjéalo en su materia respectiva.\`);
                return;
            }

            const targetCourse = (data.cursos || []).find(c => c.id === courseId) || { id: courseId, titulo: "Curso" };
            studentLic.usos = (studentLic.usos || 0) + 1;
            studentLic.ultimoAcceso = new Date().toISOString();
            studentLic.dispositivo = navigator.userAgent.slice(0, 60);
            registerStudentLicense(studentLic);

            unlockCourse(courseId);
            closeCourseKeyModal();
            alert(
                \`🎉 ¡LICENCIA PERSONAL VALIDADA CON ÉXITO!\\n\\n\` +
                \`• Materia Desbloqueada: «\${targetCourse.titulo}»\\n\` +
                \`• Estudiante Titular: \${studentLic.estudianteNombre}\\n\` +
                \`• Código Único: \${studentLic.codigo}\\n\\n\` +
                \`⚠️ AVISO IMPORTANTE: Este código es ÚNICO, PERSONAL E INTRANSFERIBLE. El sistema ha registrado la firma digital de este navegador. No lo compartas con nadie para evitar que sea revocado.\`
            );
            showToast(\`🎓 Licencia personal activa: <strong>\${targetCourse.titulo}</strong> (\${studentLic.estudianteNombre})\`);
            setTimeout(() => {
                const el = document.getElementById("mis-cursos");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
            return;
        }

        // 4. Clave para este curso (claves locales/estándar)
        const validKeys = getCourseKeys(courseId);
        const isMatchLocal = validKeys.some(k => {
            const ku = (k || '').toUpperCase();
            return ku === code || ku.replace(/[\\s\\-_]/g, '') === codeClean;
        });

        if (isMatchLocal) {
            unlockCourse(courseId);
            closeCourseKeyModal();
            const course = (data.cursos || []).find(c => c.id === courseId);
            const courseTitle = course ? course.titulo : "Curso";
            alert(\`🎉 ¡Excelente!\\n\\nEl curso «\${courseTitle}» ha sido desbloqueado con éxito para este periodo.\`);
            showToast(\`🎓 ¡Curso desbloqueado: <strong>\${courseTitle}</strong>!\`);
            setTimeout(() => {
                const el = document.getElementById("mis-cursos");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
            return;
        }

        // 5. Verificación en tiempo real con Firebase en la nube
        if (err) {
            err.innerHTML = \`<span style="color:#38bdf8;">⏳ Verificando clave con el servidor...</span>\`;
            err.style.display = "block";
        }

        fetch(\`\${FIREBASE_BASE}/student_keys_config/monthly_keys.json\`)
            .then(r => r.json())
            .then(cloudKeys => {
                if (cloudKeys && typeof cloudKeys === 'object') {
                    localStorage.setItem('physicsailab_cloud_keys', JSON.stringify(cloudKeys));
                    const assignedKey = (cloudKeys[courseId] || '').trim().toUpperCase();
                    const assignedClean = assignedKey.replace(/[\\s\\-_]/g, '');

                    if (assignedKey && (assignedKey === code || assignedClean === codeClean)) {
                        unlockCourse(courseId);
                        closeCourseKeyModal();
                        const course = (data.cursos || []).find(c => c.id === courseId);
                        const courseTitle = course ? course.titulo : "Curso";
                        alert(\`🎉 ¡Excelente!\\n\\nEl curso «\${courseTitle}» ha sido desbloqueado con éxito con la nueva clave activa.\`);
                        showToast(\`🎓 ¡Curso desbloqueado: <strong>\${courseTitle}</strong>!\`);
                        setTimeout(() => {
                            const el = document.getElementById("mis-cursos");
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 300);
                        return;
                    }

                    // ¿Pertenece a otro curso en la nube?
                    for (const [otherId, otherKey] of Object.entries(cloudKeys)) {
                        const otKey = (otherKey || '').trim().toUpperCase();
                        if (otherId !== courseId && (otKey === code || otKey.replace(/[\\s\\-_]/g, '') === codeClean)) {
                            const otherC = (data.cursos || []).find(c => c.id === otherId);
                            const otherTitle = otherC ? otherC.titulo : otherId;
                            if (err) {
                                err.innerHTML = \`⚠️ Esta clave corresponde a <strong>«\${otherTitle}»</strong>, no a este curso.<br>Puedes desbloquear ese curso desde su respectiva tarjeta.\`;
                                err.style.display = "block";
                            }
                            return;
                        }
                    }
                }

                // 6. Comprobar si pertenece a otro curso en claves locales
                let otherCourse = null;
                for (const c of (data.cursos || [])) {
                    if (c.id !== courseId) {
                        const keys = getCourseKeys(c.id);
                        if (keys.some(k => {
                            const ku = (k || '').toUpperCase();
                            return ku === code || ku.replace(/[\\s\\-_]/g, '') === codeClean;
                        })) {
                            otherCourse = c;
                            break;
                        }
                    }
                }

                if (otherCourse) {
                    if (err) {
                        err.innerHTML = \`⚠️ Esta clave corresponde a <strong>«\${otherCourse.titulo}»</strong>, no a este curso.<br>Puedes desbloquear ese curso desde su respectiva tarjeta.\`;
                        err.style.display = "block";
                    }
                } else {
                    if (err) {
                        err.textContent = "❌ Clave no válida para este curso. Consulta con el profesor Manuel Obando en clase.";
                        err.style.display = "block";
                    }
                }
            })
            .catch(() => {
                if (err) {
                    err.textContent = "❌ Clave no válida para este curso. Consulta con el profesor Manuel Obando en clase.";
                    err.style.display = "block";
                }
            });
    };

    window.solicitarClaveWhatsApp`;

appCode = appCode.replace(oldCanjearRegex, newCanjearCode);

// 3.2 Actualizar unlockCourse en app.js para safeUnlockAt
const oldUnlockCourseRegex = /function unlockCourse\(courseId\) \{[\s\S]*?touchStudentCloudProfile\(\);\s*\}/;
const newUnlockCourse = `function unlockCourse(courseId) {
        let list = getUnlockedCourses();
        if (!list.includes(courseId)) {
            list.push(courseId);
            localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        }
        localStorage.setItem('unlocked_course_' + courseId, 'true');
        const now = Date.now();
        const rotTs = parseInt(localStorage.getItem('physicsailab_key_rotation_ts') || '0', 10);
        const safeUnlockAt = (rotTs >= now) ? (rotTs + 2000) : now;
        const unlockInfo = {
            cId: courseId,
            unlockedAt: safeUnlockAt,
            expiresAt: safeUnlockAt + 60 * 24 * 60 * 60 * 1000,
            isSubscription: false,
            month: new Date().toISOString().slice(0, 7)
        };
        localStorage.setItem('unlocked_info_' + courseId, JSON.stringify(unlockInfo));
        updateStudentBannerState();
        renderEnrolledCourses();
        renderCourses(currentCourseFilter);
        const courseFound = (data.cursos || []).find(c => c.id === courseId);
        const courseName = courseFound ? courseFound.titulo : courseId;
        logRealActivity(\`Desbloqueó materia: \${courseName}\`, 'course_unlock');
        touchStudentCloudProfile();
    }`;

appCode = appCode.replace(oldUnlockCourseRegex, newUnlockCourse);

// 3.3 Actualizar editarClaveCurso en app.js
const oldEditarClaveRegex = /window\.editarClaveCurso = function\(courseId, courseTitle\) \{[\s\S]*?renderAdminDashboardContent\(\);/;
const newEditarClave = `window.editarClaveCurso = function(courseId, courseTitle) {
        const currentKeys = getCourseKeys(courseId);
        const newKey = prompt(\`Asigna una nueva clave para:\\n"\${courseTitle}"\\n\\nClave actual: \${currentKeys[0] || ''}\`, currentKeys[0] || '');
        if (!newKey) return;

        const cleanKey = newKey.trim().toUpperCase();
        if (cleanKey.length < 2) {
            alert('La clave debe tener al menos 2 caracteres.');
            return;
        }

        try {
            const custom = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
            custom[courseId] = cleanKey;
            localStorage.setItem('physicsailab_custom_keys', JSON.stringify(custom));

            const cloud = JSON.parse(localStorage.getItem('physicsailab_cloud_keys') || '{}');
            cloud[courseId] = cleanKey;
            localStorage.setItem('physicsailab_cloud_keys', JSON.stringify(cloud));

            // Sincronizar en la nube Firebase para propagar a todos los estudiantes
            fetch(\`\${FIREBASE_BASE}/student_keys_config/monthly_keys/\${courseId}.json\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanKey)
            }).then(() => {
                showToast(\`🔑 Clave para <strong>\${courseTitle}</strong> actualizada y sincronizada en la nube a: <strong>\${cleanKey}</strong>\`);
            }).catch(() => {
                showToast(\`🔑 Clave guardada localmente para <strong>\${courseTitle}</strong>: <strong>\${cleanKey}</strong>\`);
            });

            renderAdminDashboardContent();`;

appCode = appCode.replace(oldEditarClaveRegex, newEditarClave);

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('💾 web/app.js guardado exitosamente.');


// ==============================================================================
// 4. ACTUALIZAR web/data.js (Asegurar clavesCursos completas)
// ==============================================================================
const dataPath = path.join(__dirname, '..', 'web', 'data.js');
let dataCode = fs.readFileSync(dataPath, 'utf8');

if (!dataCode.includes('"historia":')) {
    dataCode = dataCode.replace(
        '"squash_arbitraje": ["ARBITRAJE-2026", "SQUASH-REF-26", "MANU-REF-26", "WSF-REGLAS-26"]',
        `"squash_arbitraje": ["ARBITRAJE-2026", "SQUASH-REF-26", "MANU-REF-26", "WSF-REGLAS-26"],\r\n        "historia": ["HISTORIA-2026", "CIENCIA-HIST-26", "OBANDO-HISTORIA-26", "SABER-2026", "BIENVENIDA-2026"],\r\n        "hbn_mc": ["HBN-MC-2026", "NANOPOROS-26", "OBANDO-HBN-26"]`
    );
    fs.writeFileSync(dataPath, dataCode, 'utf8');
    console.log('💾 web/data.js actualizado con historia y hbn_mc');
}

console.log('✨ Todos los archivos fuente han sido actualizados.');
