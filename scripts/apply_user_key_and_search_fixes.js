const fs = require('fs');
const path = require('path');

console.log('🚀 Aplicando ajustes solicitados por el usuario:');
console.log('1. Quitar claves universales de estudiante (UNICAUCA-2026, FISICA-2026).');
console.log('2. Quitar claves oficiales semestrales estándar por defecto.');
console.log('3. Dejar ÚNICAMENTE las claves que genera el administrador (las que están).');
console.log('4. Mejorar el buscador con coincidencia flexible por palabras, sin tildes y con búsqueda por clave activa.');

// ==============================================================================
// 1. ACTUALIZAR web/admin.html
// ==============================================================================
const adminPath = path.join(__dirname, '..', 'web', 'admin.html');
let adminHtml = fs.readFileSync(adminPath, 'utf8');

// 1.1 Quitar botón de "Claves Estándar (MECANICA-2026...)" de la cabecera
const oldStandardBtn = `<button type="button" class="adm-btn adm-btn-secondary" onclick="resetAllCourseKeysToDefault()" style="border-color:rgba(56,189,248,0.5); color:#38bdf8;">
                                🔄 Claves Estándar (MECANICA-2026...)
                            </button>`;
if (adminHtml.includes(oldStandardBtn)) {
    adminHtml = adminHtml.replace(oldStandardBtn, '');
    console.log('✅ Botón "Claves Estándar" retirado de admin.html');
}

// 1.2 Mejorar barra de búsqueda en admin.html
const oldSearchBox = `<!-- Buscador en tiempo real de cursos -->
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
                        <input type="text" id="adm-courses-key-search" class="adm-input" placeholder="🔍 Filtrar entre los 25 cursos y laboratorios..." style="max-width:360px;" oninput="filterCourseKeyCards(this.value)">
                        <div style="font-size:0.82rem; color:var(--adm-muted);">
                            Mostrando <strong id="adm-courses-keys-count" style="color:#fff;">25</strong> cursos configurados
                        </div>
                    </div>`;

const newSearchBox = `<!-- Buscador inteligente por coincidencia de cursos -->
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
                        <div style="position:relative; flex:1; max-width:440px;">
                            <input type="text" id="adm-courses-key-search" class="adm-input" 
                                   placeholder="🔍 Buscar por coincidencia (ej: mecanica, optica, solido, termo, MAXI)..." 
                                   style="width:100%; padding-right:2.4rem;" 
                                   oninput="filterCourseKeyCards(this.value)">
                            <button type="button" id="adm-clear-search-btn" onclick="clearCourseKeySearch()" 
                                    style="position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--adm-muted); cursor:pointer; font-size:1.1rem; display:none;" title="Limpiar búsqueda">✕</button>
                        </div>
                        <div style="font-size:0.84rem; color:var(--adm-muted);">
                            Mostrando <strong id="adm-courses-keys-count" style="color:#fff;">27</strong> materias configuradas
                        </div>
                    </div>`;

if (adminHtml.includes('id="adm-courses-key-search"')) {
    adminHtml = adminHtml.replace(/<!-- Buscador[\s\S]*?id="adm-courses-key-search"[\s\S]*?<\/div>\s*<\/div>/, newSearchBox);
    console.log('✅ Barra de búsqueda mejorada en admin.html');
}

// 1.3 Mejorar función de búsqueda y renderizado en admin.html
const oldRenderFnRegex = /function renderAllCourseKeyCards\(filterQuery = ''\) \{[\s\S]*?function generateRandomKeyFor\(inputId, prefix\)/;

const newRenderFn = `function normalizeSearchText(str) {
            if (!str) return '';
            return str
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\\u0300-\\u036f]/g, '')
                .replace(/[^a-z0-9\\s]/g, ' ')
                .replace(/\\s+/g, ' ')
                .trim();
        }

        function filterCourseKeyCards(val) {
            const clearBtn = document.getElementById('adm-clear-search-btn');
            if (clearBtn) clearBtn.style.display = (val && val.trim()) ? 'block' : 'none';
            renderAllCourseKeyCards(val);
        }

        function clearCourseKeySearch() {
            const inp = document.getElementById('adm-courses-key-search');
            if (inp) {
                inp.value = '';
                filterCourseKeyCards('');
                inp.focus();
            }
        }

        function renderAllCourseKeyCards(filterQuery = '') {
            const grid = document.getElementById('adm-courses-keys-grid');
            const countEl = document.getElementById('adm-courses-keys-count');
            if (!grid) return;

            const qClean = normalizeSearchText(filterQuery);
            const tokens = qClean ? qClean.split(' ').filter(Boolean) : [];

            const list = tokens.length > 0 ? ALL_COURSES.filter(c => {
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
            }) : ALL_COURSES;

            if (countEl) countEl.textContent = list.length;

            if (list.length === 0) {
                grid.innerHTML = \`
                    <div style="grid-column:1/-1; text-align:center; padding:3rem 1.5rem; background:#0b1120; border:1px dashed rgba(99,102,241,0.3); border-radius:12px;">
                        <div style="font-size:2.2rem; margin-bottom:0.6rem;">🔍</div>
                        <h4 style="color:#fff; margin:0 0 0.4rem; font-size:1.1rem;">No se encontraron materias</h4>
                        <p style="color:var(--adm-muted); font-size:0.88rem; margin:0 auto 1.25rem; max-width:460px;">
                            Ningún curso coincide con "<strong>\${escapeHtml(filterQuery)}</strong>".
                            Puedes buscar por nombre (ej: <em>mecanica</em>, <em>optica</em>, <em>solido</em>), categoría o por la contraseña activa.
                        </p>
                        <button type="button" class="adm-btn adm-btn-secondary" onclick="clearCourseKeySearch()" style="margin:0 auto;">
                            Mostrar todas las 27 materias
                        </button>
                    </div>
                \`;
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
                                <span id="badge-\${c.id}" style="font-size:0.75rem; color:#38bdf8; font-family:monospace; font-weight:700;">\${escapeHtml(currentVal)}</span>
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

        function generateRandomKeyFor(inputId, prefix)`;

adminHtml = adminHtml.replace(oldRenderFnRegex, newRenderFn);
fs.writeFileSync(adminPath, adminHtml, 'utf8');
console.log('💾 web/admin.html guardado exitosamente.');


// ==============================================================================
// 2. ACTUALIZAR material/course-guard.js
// ==============================================================================
const guardPath = path.join(__dirname, '..', 'material', 'course-guard.js');
let guardCode = fs.readFileSync(guardPath, 'utf8');

// Quitar claves universales y claves estándar de tryUnlock
const oldGuardTryUnlockRegex = /const tryUnlock = \(\) => \{[\s\S]*?doUnlockBtn\.addEventListener\('click', tryUnlock\);/;

const newGuardTryUnlock = `const tryUnlock = () => {
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

            // 2. Verificar licencias individuales de alumnos (si el docente emitió una)
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

            // 3. Verificar ÚNICAMENTE la clave activa asignada por el Administrador (en caché local)
            let adminActiveKey = '';
            try {
                const cloudMap = JSON.parse(localStorage.getItem('physicsailab_cloud_keys') || '{}');
                if (cloudMap && cloudMap[currentCourse]) {
                    adminActiveKey = (cloudMap[currentCourse] || '').trim().toUpperCase();
                }
                if (!adminActiveKey) {
                    const customMap = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
                    if (customMap && customMap[currentCourse]) {
                        adminActiveKey = (customMap[currentCourse] || '').trim().toUpperCase();
                    }
                }
            } catch(e) {}

            const adminActiveClean = adminActiveKey.replace(/[\\s\\-_]/g, '');
            if (adminActiveKey && (val === adminActiveKey || (valClean && valClean === adminActiveClean))) {
                setCourseUnlocked(currentCourse, true);
                closeModal();
                showToast(\`🎉 ¡Clave válida! Curso desbloqueado exitosamente.\`, 'success');
                updateGuardState();
                return;
            }

            // 4. Verificación en tiempo real con Firebase en la nube (clave vigente asignada por el admin)
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

                        if (targetCloudKey && (val === targetCloudKey || (valClean && valClean === targetCloudClean))) {
                            setCourseUnlocked(currentCourse, true);
                            closeModal();
                            showToast(\`🎉 ¡Clave activa sincronizada y verificada con el servidor! Curso desbloqueado.\`, 'success');
                            updateGuardState();
                            return;
                        }

                        // ¿Pertenece a otra materia en la nube?
                        for (const [otherId, otherKey] of Object.entries(cloudKeys)) {
                            const otKey = (otherKey || '').trim().toUpperCase();
                            if (otherId !== currentCourse && (otKey === val || (otKey.replace(/[\\s\\-_]/g, '') === valClean && valClean.length >= 3))) {
                                showToast(\`⚠️ Esta clave corresponde a «\${otherId.toUpperCase()}», no a esta materia.\`, 'error');
                                return;
                            }
                        }
                    }

                    showToast('❌ Clave no válida para este curso. Consulta con tu profesor en clase.', 'error');
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

guardCode = guardCode.replace(oldGuardTryUnlockRegex, newGuardTryUnlock);
fs.writeFileSync(guardPath, guardCode, 'utf8');
console.log('💾 material/course-guard.js guardado exitosamente.');


// ==============================================================================
// 3. ACTUALIZAR web/app.js
// ==============================================================================
const appPath = path.join(__dirname, '..', 'web', 'app.js');
let appCode = fs.readFileSync(appPath, 'utf8');

// 3.1 canjearClaveModalCurso: Solo clave del administrador
const oldAppCanjearRegex = /window\.canjearClaveModalCurso = function\(courseId\) \{[\s\S]*?window\.solicitarClaveWhatsApp/;

const newAppCanjear = `window.canjearClaveModalCurso = function(courseId) {
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

        // 1. Maestro Admin (Profesor Manuel Obando)
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

        // 2. Verificar si es una Licencia Única de Estudiante registrada
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

        // 3. Verificar ÚNICAMENTE la clave activa asignada por el Administrador (en caché local)
        let adminActiveKey = '';
        try {
            const cloudMap = JSON.parse(localStorage.getItem('physicsailab_cloud_keys') || '{}');
            if (cloudMap && cloudMap[courseId]) {
                adminActiveKey = (cloudMap[courseId] || '').trim().toUpperCase();
            }
            if (!adminActiveKey) {
                const customMap = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
                if (customMap && customMap[courseId]) {
                    adminActiveKey = (customMap[courseId] || '').trim().toUpperCase();
                }
            }
        } catch(e) {}

        const adminActiveClean = adminActiveKey.replace(/[\\s\\-_]/g, '');
        if (adminActiveKey && (code === adminActiveKey || (codeClean && codeClean === adminActiveClean))) {
            unlockCourse(courseId);
            closeCourseKeyModal();
            const course = (data.cursos || []).find(c => c.id === courseId);
            const courseTitle = course ? course.titulo : "Curso";
            alert(\`🎉 ¡Excelente!\\n\\nEl curso «\${courseTitle}» ha sido desbloqueado con éxito.\`);
            showToast(\`🎓 ¡Curso desbloqueado: <strong>\${courseTitle}</strong>!\`);
            setTimeout(() => {
                const el = document.getElementById("mis-cursos");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
            return;
        }

        // 4. Verificación en tiempo real con Firebase en la nube (clave vigente asignada por el admin)
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

                    if (assignedKey && (code === assignedKey || (codeClean && codeClean === assignedClean))) {
                        unlockCourse(courseId);
                        closeCourseKeyModal();
                        const course = (data.cursos || []).find(c => c.id === courseId);
                        const courseTitle = course ? course.titulo : "Curso";
                        alert(\`🎉 ¡Excelente!\\n\\nEl curso «\${courseTitle}» ha sido desbloqueado con éxito.\`);
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
                        if (otherId !== courseId && (otKey === code || (otKey.replace(/[\\s\\-_]/g, '') === codeClean && codeClean.length >= 3))) {
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

                if (err) {
                    err.textContent = "❌ Clave no válida para este curso. Consulta con el profesor Manuel Obando en clase.";
                    err.style.display = "block";
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

appCode = appCode.replace(oldAppCanjearRegex, newAppCanjear);

// 3.2 getCourseKeys: Devolver únicamente la clave activa del admin
const oldGetCourseKeysRegex = /function getCourseKeys\(courseId\) \{[\s\S]*?return keys;\s*\}/;

const newGetCourseKeys = `function getCourseKeys(courseId) {
        let keys = [];
        try {
            const cloud = JSON.parse(localStorage.getItem('physicsailab_cloud_keys') || '{}');
            if (cloud && cloud[courseId] && typeof cloud[courseId] === 'string') {
                keys.push(cloud[courseId].trim().toUpperCase());
            }
        } catch(e) {}
        try {
            const custom = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
            if (custom && custom[courseId] && typeof custom[courseId] === 'string') {
                const k = custom[courseId].trim().toUpperCase();
                if (!keys.includes(k)) keys.unshift(k);
            }
        } catch(e) {}
        return keys;
    }`;

appCode = appCode.replace(oldGetCourseKeysRegex, newGetCourseKeys);

// 3.3 handleGlobalSearch: Búsqueda flexible por coincidencia sin tildes y multi-palabra
const oldGlobalSearchRegex = /window\.handleGlobalSearch = function\(query\) \{[\s\S]*?window\.clearGlobalSearch = function\(\)/;

const newGlobalSearch = `function normalizeSearchText(str) {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[^a-z0-9\\s]/g, ' ')
            .replace(/\\s+/g, ' ')
            .trim();
    }

    window.handleGlobalSearch = function(query) {
        const dropdown = document.getElementById('global-search-results-dropdown');
        const clearBtn = document.getElementById('global-search-clear-btn');
        if (!dropdown) return;

        const qRaw = (query || '').trim();
        const qClean = normalizeSearchText(qRaw);
        if (clearBtn) clearBtn.style.display = qRaw ? 'block' : 'none';

        if (qClean.length < 2) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
            return;
        }

        const tokens = qClean.split(' ').filter(Boolean);
        const results = [];

        // 1. Cursos y Laboratorios
        const courses = (typeof data !== 'undefined' && data.cursos) ? data.cursos : [];
        courses.forEach(c => {
            const searchable = normalizeSearchText([
                c.titulo || '',
                c.id || '',
                (c.id || '').replace(/_/g, ' '),
                c.categoria || '',
                c.descripcion || '',
                (c.temas || []).join(' ')
            ].join(' '));

            if (tokens.every(tok => searchable.includes(tok))) {
                results.push({
                    type: c.esPrivado ? '🔬 Privado Docente' : (c.categoria || 'Curso'),
                    title: c.titulo,
                    desc: c.descripcion,
                    link: c.demoPath || '#cursos',
                    isExternal: !!c.demoPath,
                    badgeColor: c.esPrivado ? '#c084fc' : '#38bdf8'
                });
            }
        });

        // 2. Cómics
        const comics = (typeof data !== 'undefined' && data.comics) ? data.comics : [];
        comics.forEach(cm => {
            const searchable = normalizeSearchText([cm.titulo || '', cm.descripcion || '', cm.categoria || ''].join(' '));
            if (tokens.every(tok => searchable.includes(tok))) {
                results.push({
                    type: '🎨 Cómic Científico',
                    title: cm.titulo,
                    desc: cm.descripcion,
                    link: cm.pdfPath || '#comics',
                    isExternal: !!cm.pdfPath,
                    badgeColor: '#fbbf24'
                });
            }
        });

        // 3. Podcasts
        const podcasts = (typeof data !== 'undefined' && data.podcasts) ? data.podcasts : [];
        podcasts.forEach(p => {
            const searchable = normalizeSearchText([p.titulo || '', p.descripcion || ''].join(' '));
            if (tokens.every(tok => searchable.includes(tok))) {
                results.push({
                    type: '🎙️ Podcast',
                    title: p.titulo,
                    desc: p.descripcion,
                    link: p.audioPath || '#podcasts',
                    isExternal: !!p.audioPath,
                    badgeColor: '#4ade80'
                });
            }
        });

        // 4. Trivias y Quizzes
        const trivias = [
            { title: 'Gran Trivia de Física', desc: '1.000 preguntas de física con sistema de 3 vidas y ranking oficial.', link: '#trivia', type: '🎯 Trivia Oficial' },
            { title: 'Trivia de Historia de la Física', desc: '500 preguntas con personajes, descubrimientos y biografías.', link: '#trivia-historia', type: '📜 Trivia Historia' },
            { title: 'Gran Trivia de Squash', desc: 'Reglamento, física del bote y táctica competitiva.', link: '#trivia-squash', type: '🎾 Trivia Squash' },
            { title: 'Quizzes Universitarios con PIN', desc: 'Evaluaciones de cinemática, dinámica y electromagnetismo con protocolo antifraude.', link: '#quizzes', type: '📝 Quiz Oficial' },
            { title: 'Simulador Manu Squash', desc: 'Suite de análisis biomecánico, rutinas tácticas y editor de trayectorias.', link: '/material/1_cursos/squash_sim/dist/index.html', isExternal: true, type: '🎮 Simulador Deportivo' },
            { title: 'Faro: Pods de Reacción', desc: 'Manual técnico de taller, firmware ESP32-S3 y planos de ensamble.', link: '/material/1_cursos/faro/manual/dist/index.html', isExternal: true, type: '💡 Hardware & Taller' },
            { title: 'hBN-MC: Simulador Monte Carlo', desc: 'Heteroestructuras 2D y nanoporos de grafeno/hBN.', link: '/material/1_cursos/hBN-MC/index.html', isExternal: true, type: '🔬 Simulación DFT' },
            { title: 'Pruebas Diagnósticas', desc: 'Plataforma institucional de evaluación para colegios y universidades.', link: '/material/1_cursos/diagnosticas/dist/public/index.html', isExternal: true, type: '🏛️ Servicio Académico' }
        ];

        trivias.forEach(t => {
            const searchable = normalizeSearchText([t.title, t.desc, t.type].join(' '));
            if (tokens.every(tok => searchable.includes(tok))) {
                results.push({
                    type: t.type,
                    title: t.title,
                    desc: t.desc,
                    link: t.link,
                    isExternal: !!t.isExternal,
                    badgeColor: '#a78bfa'
                });
            }
        });

        if (results.length === 0) {
            dropdown.innerHTML = \`
                <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.92rem;">
                    🔍 No se encontraron contenidos que coincidan con "<strong>\${escapeHtml(qRaw)}</strong>".
                </div>
            \`;
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = \`
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:0.25rem 0.5rem 0.6rem; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
                <span>Resultados encontrados (\${results.length})</span>
                <span style="color:#a5b4fc;">Haz clic para abrir</span>
            </div>
            \${results.map(r => \`
                <a href="\${r.link}" \${r.isExternal ? 'target="_blank"' : ''} onclick="closeGlobalSearchDropdown()" 
                   style="display:block; padding:0.65rem 0.75rem; border-radius:8px; text-decoration:none; transition:background 0.15s ease; border-bottom:1px solid rgba(255,255,255,0.04);" 
                   onmouseover="this.style.background='rgba(99,102,241,0.15)'" onmouseout="this.style.background='transparent'">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
                        <strong style="color:#fff; font-size:0.92rem;">\${escapeHtml(r.title)}</strong>
                        <span style="font-size:0.68rem; background:\${r.badgeColor}22; color:\${r.badgeColor}; border:1px solid \${r.badgeColor}44; padding:0.1rem 0.45rem; border-radius:4px; font-weight:700; white-space:nowrap;">
                            \${escapeHtml(r.type)}
                        </span>
                    </div>
                    <p style="margin:0; font-size:0.78rem; color:var(--text-muted); line-height:1.35; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        \${escapeHtml(r.desc)}
                    </p>
                </a>
            \`).join('')}
        \`;
        dropdown.style.display = 'block';
    };

    window.clearGlobalSearch = function()`;

appCode = appCode.replace(oldGlobalSearchRegex, newGlobalSearch);
fs.writeFileSync(appPath, appCode, 'utf8');
console.log('💾 web/app.js guardado exitosamente.');

console.log('✨ Todos los cambios han sido aplicados con éxito.');
