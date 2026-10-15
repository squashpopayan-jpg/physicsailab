document.addEventListener('DOMContentLoaded', () => {
    const data = window.PLATFORM_DATA;
    if (!data) return;

    // 1. Contador de Visitas y Descargas Real y Persistente
    const BASE_VISITS = 1485;
    const BASE_DOWNLOADS = 428;

    const visitCounterElem = document.getElementById('visit-counter-value');
    const heroVisitsElem = document.getElementById('stat-visits');
    const drawerVisitsElem = document.getElementById('drawer-visits-value');
    const navDownloadsElem = document.getElementById('nav-download-counter-value');
    const heroDownloadsElem = document.getElementById('stat-downloads');
    const drawerDownloadsElem = document.getElementById('drawer-downloads-value');

    function updateVisitsDisplay(count) {
        const formatted = Number(count).toLocaleString('es-ES');
        if (visitCounterElem) visitCounterElem.textContent = formatted;
        if (heroVisitsElem) heroVisitsElem.textContent = '+' + formatted;
        if (drawerVisitsElem) drawerVisitsElem.textContent = '+' + formatted;
    }

    function updateDownloadsDisplay(count) {
        const formatted = Number(count).toLocaleString('es-ES');
        if (navDownloadsElem) navDownloadsElem.textContent = formatted;
        if (heroDownloadsElem) heroDownloadsElem.textContent = '+' + formatted;
        if (drawerDownloadsElem) drawerDownloadsElem.textContent = '+' + formatted;
    }

    // Navegación Móvil (Drawer y ScrollSpy)
    window.toggleMobileDrawer = function() {
        const drawer = document.getElementById('mobile-drawer');
        const backdrop = document.getElementById('mobile-drawer-backdrop');
        if (!drawer) return;
        const isActive = drawer.classList.toggle('active');
        if (backdrop) backdrop.classList.toggle('active', isActive);
        document.body.classList.toggle('drawer-open', isActive);
    };

    window.closeMobileDrawer = function() {
        const drawer = document.getElementById('mobile-drawer');
        const backdrop = document.getElementById('mobile-drawer-backdrop');
        if (drawer) drawer.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('drawer-open');
    };

    // Botón Volver Arriba
    const backToTopBtn = document.getElementById('back-to-top-btn');
    window.scrollToTop = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const observedSections = ['inicio', 'curiosidades', 'cursos', 'libros', 'comics', 'podcasts', 'articulos', 'profesor', 'comentarios'];
    function highlightActiveSectionOnScroll() {
        const scrollPos = window.scrollY + 180;
        let currentSectionId = 'inicio';

        for (const sId of observedSections) {
            const el = document.getElementById(sId);
            if (el && el.offsetTop <= scrollPos) {
                currentSectionId = sId;
            }
        }

        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            if (item.dataset.section === currentSectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        document.querySelectorAll('.quick-chip').forEach(chip => {
            const href = chip.getAttribute('href');
            if (href === '#' + currentSectionId) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(a => {
            const href = a.getAttribute('href');
            if (href === '#' + currentSectionId) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (backToTopBtn) {
            if (window.scrollY > 350) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
        highlightActiveSectionOnScroll();
    }, { passive: true });

    // Inicializar Visitas
    let storedVisits = parseInt(localStorage.getItem('physicsailab_visits') || '0', 10);
    if (!storedVisits || storedVisits < BASE_VISITS) {
        storedVisits = BASE_VISITS;
    }
    storedVisits += 1;
    localStorage.setItem('physicsailab_visits', storedVisits);
    updateVisitsDisplay(storedVisits);

    // Sincronizar con backend si existe
    fetch('/api/visit')
        .then(res => res.json())
        .then(resData => {
            if (resData && resData.visits) {
                const finalVisits = Math.max(resData.visits, storedVisits);
                localStorage.setItem('physicsailab_visits', finalVisits);
                updateVisitsDisplay(finalVisits);
            }
        })
        .catch(() => {});

    // Inicializar Descargas
    let storedDownloads = parseInt(localStorage.getItem('physicsailab_downloads') || '0', 10);
    if (!storedDownloads || storedDownloads < BASE_DOWNLOADS) {
        storedDownloads = BASE_DOWNLOADS;
        localStorage.setItem('physicsailab_downloads', storedDownloads);
    }
    updateDownloadsDisplay(storedDownloads);

    // Sistema de Notificaciones Toast
    window.showToast = function(message, duration = 4500) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span style="font-size:1.3rem;">🚀</span>
            <div style="flex-grow:1; line-height:1.4;">${message}</div>
            <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:0 0 0 0.5rem;" onclick="this.parentElement.remove()">✕</button>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hiding');
            setTimeout(() => toast.remove(), 350);
        }, duration);
    };

    // Tracking de Descargas
    window.trackDownload = function(itemTitle = 'Material Académico') {
        let currentDownloads = parseInt(localStorage.getItem('physicsailab_downloads') || BASE_DOWNLOADS.toString(), 10);
        currentDownloads += 1;
        localStorage.setItem('physicsailab_downloads', currentDownloads);
        updateDownloadsDisplay(currentDownloads);

        // Notificación Toast
        showToast(`📥 Descarga iniciada: <strong>${itemTitle}</strong>. ¡Gracias por apoyar la divulgación científica abierta!`);

        // Sincronizar con backend si existe
        fetch('/api/download').catch(() => {});
    };

    // 2. Control de Acceso Granular y Modo Administrador (Mg. Manuel Alejandro Obando)
    function isAdmin() {
        return localStorage.getItem('physicsailab_admin') === 'true';
    }

    function getUnlockedCourses() {
        try {
            return JSON.parse(localStorage.getItem('physicsailab_unlocked_courses') || '[]');
        } catch (e) {
            return [];
        }
    }

    function isCourseUnlocked(courseId) {
        if (isAdmin()) return true;
        const list = getUnlockedCourses();
        if (list.includes(courseId)) return true;
        if (localStorage.getItem('unlocked_course_' + courseId) === 'true') return true;
        return false;
    }

    function unlockCourse(courseId) {
        let list = getUnlockedCourses();
        if (!list.includes(courseId)) {
            list.push(courseId);
            localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        }
        localStorage.setItem('unlocked_course_' + courseId, 'true');
        updateStudentBannerState();
        renderCourses(currentCourseFilter);
    }

    window.lockCourse = function(courseId) {
        let list = getUnlockedCourses().filter(id => id !== courseId);
        localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        localStorage.removeItem('unlocked_course_' + courseId);
        updateStudentBannerState();
        renderCourses(currentCourseFilter);
        showToast('🔒 El curso ha sido bloqueado nuevamente para pruebas.');
    };

    window.lockAllCourses = function() {
        localStorage.removeItem('physicsailab_unlocked_courses');
        localStorage.removeItem('physicsailab_admin');
        localStorage.removeItem('physicsailab_unlocked_all');
        localStorage.removeItem('estudiante_desbloqueado');
        (data.cursos || []).forEach(c => localStorage.removeItem('unlocked_course_' + c.id));
        updateStudentBannerState();
        renderCourses(currentCourseFilter);
        showToast('🔒 Se han cerrado todas las sesiones de cursos y docente.');
    };

    function getCourseKeys(courseId) {
        let keys = (data.clavesCursos && data.clavesCursos[courseId]) ? [...data.clavesCursos[courseId]] : [];
        try {
            const custom = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
            if (custom[courseId]) {
                if (Array.isArray(custom[courseId])) {
                    keys = [...new Set([...custom[courseId], ...keys])];
                } else if (typeof custom[courseId] === 'string') {
                    keys.unshift(custom[courseId]);
                }
            }
        } catch(e) {}
        return keys;
    }

    function updateStudentBannerState() {
        const bannerContainer = document.getElementById('student-banner-container');
        if (!bannerContainer) return;

        const adminActive = isAdmin();
        const unlockedList = getUnlockedCourses();

        if (adminActive) {
            bannerContainer.innerHTML = `
                <div class="student-banner" style="border-color:var(--accent-indigo); background:linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.8));">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.35rem;">
                            <span class="unlocked-tag admin-badge">👑 Modo Administrador Activo</span>
                            <span style="font-size:0.75rem; color:var(--accent-indigo); font-weight:700;">Mg. Manuel Alejandro Obando</span>
                        </div>
                        <h4 style="margin:0.25rem 0; color:#fff;">Control Maestro de la Plataforma</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                            Tienes acceso libre a todos los 11 cursos, laboratorios y simuladores, junto con el panel de estadísticas y claves.
                        </p>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-primary" style="font-size:0.82rem; padding:0.45rem 0.95rem; background:linear-gradient(135deg, #6366F1, #8B5CF6); border:none;" onclick="openAdminPanel()">
                            ⚙️ Abrir Panel Docente
                        </button>
                        <button class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem;" onclick="probarComoVisitante()" title="Desactiva el modo admin para probar la web como visitante">
                            👁️ Probar como Visitante
                        </button>
                        <button class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem;" onclick="cerrarSesionAdmin()">
                            Cerrar Sesión 🔒
                        </button>
                    </div>
                </div>
            `;
        } else if (unlockedList.length > 0) {
            const unlockedCoursesData = (data.cursos || []).filter(c => unlockedList.includes(c.id));
            const badgesHtml = unlockedCoursesData.map(c => 
                `<span style="font-size:0.72rem; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.35); color:#34D399; padding:0.15rem 0.5rem; border-radius:6px; font-weight:600;">✓ ${c.titulo.split(' ')[0]} ${c.titulo.split(' ')[1] || ''}</span>`
            ).join(' ');

            bannerContainer.innerHTML = `
                <div class="student-banner" style="border-color:var(--accent-emerald); background:rgba(16, 185, 129, 0.08);">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.35rem;">
                            <span class="unlocked-tag">🎓 Modo Estudiante Activo</span>
                            <span style="font-size:0.75rem; color:var(--accent-emerald); font-weight:700;">${unlockedList.length} de ${(data.cursos || []).length} materias desbloqueadas</span>
                        </div>
                        <h4 style="margin:0.25rem 0; color:#fff;">¡Acceso Estudiantil a tus Materias!</h4>
                        <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin:0.4rem 0 0.2rem;">
                            ${badgesHtml}
                        </div>
                        <p style="font-size:0.82rem; color:var(--text-muted); margin:0;">
                            Las materias desbloqueadas cuentan con acceso completo a todos sus módulos y simuladores.
                        </p>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="abrirCanjeadorRapido()">
                            🔑 Desbloquear otra materia
                        </button>
                        <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="lockAllCourses()">
                            Bloquear todo 🔒
                        </button>
                    </div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = `
                <div class="student-banner">
                    <div>
                        <span class="card-tag interactive" style="margin-bottom:0.25rem;">🎓 Claves de Acceso para Estudiantes</span>
                        <h4 style="margin:0.25rem 0; color:#fff;">¿Eres estudiante del Mg. Manuel Alejandro Obando este semestre?</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                            Cada materia cuenta con su propia <strong>clave de clase independiente</strong>. Ingresa el código correspondiente a tu materia para desbloquearla completa sin costo.
                        </p>
                    </div>
                    <div class="code-input-group">
                        <input type="text" id="student-code-input" class="code-input" placeholder="Ej: MECANICA-2026, TRANSFO-2026..." onkeydown="if(event.key==='Enter') canjearCodigoEstudiante();" />
                        <button class="btn btn-primary" onclick="canjearCodigoEstudiante()">Desbloquear Materia 🔓</button>
                    </div>
                </div>
            `;
        }
    }

    window.canjearCodigoEstudiante = function() {
        const input = document.getElementById('student-code-input');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        if (!code) {
            alert('Por favor ingresa la clave de tu materia o clase.');
            return;
        }

        // 1. Clave de administrador
        if (code === (data.claveAdministrador || 'OBANDO-ADMIN-2026').toUpperCase() || code === 'OBANDO-MASTER-ADMIN') {
            localStorage.setItem('physicsailab_admin', 'true');
            showToast('👑 ¡Bienvenido Mg. Manuel Alejandro Obando! Modo Administrador activado con acceso total.');
            updateStudentBannerState();
            renderCourses(currentCourseFilter);
            openAdminPanel();
            return;
        }

        // 2. Buscar si coincide con alguna materia específica
        let matchedCourse = null;
        for (const c of (data.cursos || [])) {
            const keys = getCourseKeys(c.id).map(k => k.toUpperCase());
            if (keys.includes(code)) {
                matchedCourse = c;
                break;
            }
        }

        if (matchedCourse) {
            unlockCourse(matchedCourse.id);
            alert(`🎉 ¡Clave válida para «${matchedCourse.titulo}»!\n\nTu materia ha sido desbloqueada exitosamente para este periodo académico.`);
            showToast(`🎓 Materia desbloqueada: <strong>${matchedCourse.titulo}</strong>`);
            input.value = '';
        } else {
            alert('❌ Clave no válida o expirada para este periodo académico.\n\nRecuerda que cada materia tiene su propia clave independiente. Verifica con el Mg. Manuel Alejandro Obando en clase.');
        }
    };

    // Modal para Desbloquear Curso Específico
    window.openCourseKeyModal = function(courseId) {
        const course = (data.cursos || []).find(c => c.id === courseId);
        if (!course) return;

        const isLab = course.id === 'transformadores' || course.esLaboratorio;
        const modal = document.getElementById('course-key-modal');
        const modalBody = document.getElementById('course-key-modal-body');
        if (!modal || !modalBody) return;

        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.25rem;">
                <div style="font-size:2.2rem; margin-bottom:0.35rem;">${isLab ? '🔬' : '🎓'}</div>
                <span class="badge" style="background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3); margin-bottom:0.5rem;">
                    Clave de Estudiante · Unicauca
                </span>
                <h3 style="font-size:1.35rem; color:#fff; margin-bottom:0.35rem;">${course.titulo}</h3>
                <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">
                    Ingresa la clave exclusiva que entregó el <strong>Mg. Manuel Alejandro Obando</strong> para este curso en este semestre.
                </p>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem; margin-bottom:1.25rem;">
                <label style="display:block; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem; font-weight:600;">
                    Clave de Acceso para ${course.titulo.split(' ')[0]} ${course.titulo.split(' ')[1] || ''}:
                </label>
                <div style="display:flex; gap:0.5rem;">
                    <input type="text" id="modal-course-key-input" class="code-input" placeholder="Ej: ${getCourseKeys(course.id)[0] || 'CLAVE-2026'}" style="flex:1; text-transform:uppercase; font-size:1rem; padding:0.65rem 0.85rem;" onkeydown="if(event.key==='Enter') canjearClaveModalCurso('${course.id}');" />
                </div>
                <div id="modal-key-error" style="color:#F87171; font-size:0.8rem; margin-top:0.5rem; display:none;"></div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <button class="btn btn-primary" onclick="canjearClaveModalCurso('${course.id}')" style="justify-content:center; padding:0.75rem; font-size:0.95rem;">
                    Desbloquear ${isLab ? 'Laboratorio' : 'Curso'} 🔓
                </button>
                <a href="https://wa.me/?text=${encodeURIComponent('Hola profesor Manuel Obando, soy estudiante de su curso ' + course.titulo + ' en la Universidad del Cauca. ¿Podría facilitarme la clave de acceso de este semestre?')}" target="_blank" class="btn btn-secondary" style="justify-content:center; padding:0.6rem; font-size:0.82rem; border-color:rgba(16,185,129,0.3); color:#34D399;">
                    💬 Solicitar clave al docente por WhatsApp
                </a>
            </div>

            <p style="font-size:0.75rem; text-align:center; color:var(--text-muted); margin-top:1rem; margin-bottom:0;">
                Nota: Cada curso tiene su propia clave independiente. Desbloquear este curso no liberará los demás.
            </p>
        `;

        modal.classList.add('active');
        setTimeout(() => {
            const inp = document.getElementById('modal-course-key-input');
            if (inp) inp.focus();
        }, 150);
    };

    window.closeCourseKeyModal = function() {
        const modal = document.getElementById('course-key-modal');
        if (modal) modal.classList.remove('active');
    };

    window.canjearClaveModalCurso = function(courseId) {
        const inp = document.getElementById('modal-course-key-input');
        const err = document.getElementById('modal-key-error');
        if (!inp) return;
        const code = inp.value.trim().toUpperCase();

        if (!code) {
            if (err) { err.textContent = 'Por favor escribe la clave.'; err.style.display = 'block'; }
            return;
        }

        // 1. Maestro Admin
        if (code === (data.claveAdministrador || 'OBANDO-ADMIN-2026').toUpperCase() || code === 'OBANDO-MASTER-ADMIN') {
            localStorage.setItem('physicsailab_admin', 'true');
            closeCourseKeyModal();
            showToast('👑 ¡Modo Administrador activado! Todo el contenido liberado.');
            updateStudentBannerState();
            renderCourses(currentCourseFilter);
            return;
        }

        // 2. Clave para este curso
        const validKeys = getCourseKeys(courseId).map(k => k.toUpperCase());
        if (validKeys.includes(code)) {
            unlockCourse(courseId);
            closeCourseKeyModal();
            const course = (data.cursos || []).find(c => c.id === courseId);
            const courseTitle = course ? course.titulo : 'Curso';
            alert(`🎉 ¡Excelente!\n\nEl curso «${courseTitle}» ha sido desbloqueado con éxito para este periodo.`);
            showToast(`🎓 ¡Curso desbloqueado: <strong>${courseTitle}</strong>!`);
            return;
        }

        // 3. ¿Pertenece a otro curso?
        let otherCourse = null;
        for (const c of (data.cursos || [])) {
            if (c.id !== courseId) {
                const keys = getCourseKeys(c.id).map(k => k.toUpperCase());
                if (keys.includes(code)) {
                    otherCourse = c;
                    break;
                }
            }
        }

        if (otherCourse) {
            if (err) {
                err.innerHTML = `⚠️ Esta clave corresponde a <strong>«${otherCourse.titulo}»</strong>, no a este curso.<br>Puedes desbloquear ese curso desde su respectiva tarjeta.`;
                err.style.display = 'block';
            }
        } else {
            if (err) {
                err.textContent = '❌ Clave no válida para este curso. Consulta con el profesor Manuel Obando en clase.';
                err.style.display = 'block';
            }
        }
    };

    // 3. Renderizar Cursos (con modo compacto en móvil y filtros de categoría)
    let currentCourseFilter = 'all';
    let coursesExpanded = false;

    window.toggleCoursesExpansion = function() {
        coursesExpanded = !coursesExpanded;
        renderCourses(currentCourseFilter);
        if (!coursesExpanded) {
            const el = document.getElementById('cursos');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    function renderCourses(filter = 'all') {
        currentCourseFilter = filter;
        const coursesGrid = document.getElementById('courses-grid');
        const toggleContainer = document.getElementById('courses-toggle-controls');
        if (!coursesGrid || !data.cursos) return;

        const f = (filter || 'all').toLowerCase();
        const filtered = f === 'all'
            ? data.cursos
            : data.cursos.filter(c => (c.categoriaFiltro || '').toLowerCase() === f || (c.categoria || '').toLowerCase().includes(f));

        const isMobile = window.innerWidth <= 768;
        const total = filtered.length;
        const coursesToRender = (isMobile && !coursesExpanded) ? filtered.slice(0, 3) : filtered;

        coursesGrid.innerHTML = coursesToRender.map(c => {
            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const courseUnlocked = isCourseUnlocked(c.id);
            const adminMode = isAdmin();

            const openBtnText = courseUnlocked
                ? (isLab ? 'Abrir Laboratorio 🚀' : (isSquash ? 'Abrir Simulador Completo 🎾' : 'Abrir Curso Completo 🎓'))
                : (isLab ? 'Vista Previa del Banco 👁️' : (isSquash ? 'Vista Previa de Rutinas 👁️' : 'Vista Previa Gratuita 👁️'));
            const buyBtnText = isLab ? 'Adquirir Lab 🛒' : (isSquash ? 'Adquirir Simulador 🛒' : 'Comprar Curso 🛒');
            const detailsBtnText = isLab ? 'Ficha Técnica 🔬' : (isSquash ? 'Módulos 📋' : 'Temario 📋');
            const tagClass = isLab ? 'lab-tag' : (c.destacado ? 'interactive' : '');

            let lockStatusBadge = '';
            if (adminMode) {
                lockStatusBadge = `<span class="unlocked-tag admin-badge" title="Liberado con Permisos de Administrador">👑 Modo Docente</span>`;
            } else if (courseUnlocked) {
                lockStatusBadge = `<span class="unlocked-tag" title="Desbloqueado con clave estudiantil">🎓 Desbloqueado</span>`;
            } else {
                lockStatusBadge = `<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.12); color:var(--accent-amber); border-color:rgba(245,158,11,0.25);">👁️ Vista Previa</span>`;
            }
            
            return `
            <div class="card ${isLab ? 'card-lab-featured' : ''}">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag ${tagClass}">${c.categoria}</span>
                        ${lockStatusBadge}
                    </div>
                    <h3>${c.titulo}</h3>
                    <p>${c.descripcion}</p>
                    <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:0.75rem; margin-bottom:1rem; font-size:0.85rem;">
                        <strong style="color:var(--text-main);">${isLab ? 'Equipamiento:' : (isSquash ? 'Contenido:' : 'Estructura:')}</strong> <span style="color:var(--accent-indigo);">${c.modulos}</span>
                        <br>
                        <strong style="color:var(--text-main);">Nivel:</strong> ${c.nivel}
                    </div>
                </div>
                <div>
                    <div class="card-meta" style="flex-direction:column; align-items:flex-start; gap:0.35rem;">
                        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                            <div>
                                ${!courseUnlocked && c.valorReal ? `<span style="text-decoration:line-through; font-size:0.75rem; color:var(--text-muted); margin-right:0.4rem;">${c.valorReal}</span>` : ''}
                                <span style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${courseUnlocked ? '● Acceso Total Activo' : c.precioEstimado}</span>
                            </div>
                            ${!courseUnlocked && c.descuentoTag ? `<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3);">${c.descuentoTag}</span>` : '<span style="color:var(--accent-emerald);">● Activo</span>'}
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">
                            ${courseUnlocked ? (adminMode ? 'Acceso maestro docente liberado' : 'Materia desbloqueada para este semestre') : (isSquash ? 'Demo con rutinas pre-generadas · Controles con clave' : (isLab ? 'Banco de pruebas libre · Ensayos con clave' : 'Cap. 0 y 1 en demo · Resto con clave de alumno o compra'))}
                        </div>
                    </div>
                    <div class="card-actions" style="flex-wrap:wrap;">
                        ${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center;">${openBtnText}</a>` : ''}
                        ${!courseUnlocked ? `<button class="btn btn-secondary btn-course-key" onclick="openCourseKeyModal('${c.id}')" title="Ingresar clave para ${c.titulo}">🔑 Clave Alumno</button>` : ''}
                        ${!courseUnlocked && c.enlaceCompra ? `<button class="btn btn-secondary" onclick="openPaymentModal('${c.id}')" style="border-color:var(--accent-amber); color:var(--accent-amber);">${buyBtnText}</button>` : ''}
                        <button class="btn btn-secondary" onclick="openCourseDetails('${c.id}')">${detailsBtnText}</button>
                        ${(courseUnlocked && !adminMode) ? `<button class="btn btn-secondary" onclick="lockCourse('${c.id}')" title="Bloquear este curso para pruebas" style="font-size:0.75rem; padding:0.35rem 0.6rem; opacity:0.6;">🔒</button>` : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');

        if (toggleContainer) {
            if (isMobile && total > 3) {
                toggleContainer.innerHTML = coursesExpanded
                    ? `<button class="btn-toggle-section" onclick="toggleCoursesExpansion()">Mostrar menos cursos ⬆️</button>`
                    : `<button class="btn-toggle-section" onclick="toggleCoursesExpansion()">Ver los ${total} Cursos y Laboratorios (quedan ${total - 3}) 🚀</button>`;
            } else {
                toggleContainer.innerHTML = '';
            }
        }
    }

    // Configurar botones de filtro de cursos
    document.querySelectorAll('.course-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.course-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            coursesExpanded = true; // Al filtrar, mostrar todos los resultados de la categoría elegida
            renderCourses(btn.dataset.filter);
        });
    });

    updateStudentBannerState();
    renderCourses('all');

    // 4. Renderizar Canales Oficiales en Spotify (Visual Nativo y Carga Compacta Móvil)
    let spotifyExpanded = false;
    window.toggleSpotifyExpansion = function() {
        spotifyExpanded = !spotifyExpanded;
        renderSpotifyChannels();
        if (!spotifyExpanded) {
            const el = document.getElementById('podcasts');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    function renderSpotifyChannels() {
        const spotifyGrid = document.getElementById('spotify-grid');
        const toggleContainer = document.getElementById('spotify-toggle-controls');
        if (!spotifyGrid || !data.canalesSpotify) return;

        const isMobile = window.innerWidth <= 768;
        const total = data.canalesSpotify.length;
        const channelsToRender = (isMobile && !spotifyExpanded) ? data.canalesSpotify.slice(0, 3) : data.canalesSpotify;

        spotifyGrid.innerHTML = channelsToRender.map(sp => `
            <div class="spotify-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
                        <span style="font-size:0.75rem; background:rgba(29, 185, 84, 0.2); color:#1DB954; font-weight:700; padding:0.25rem 0.65rem; border-radius:9999px;">
                            🟢 ${sp.curso}
                        </span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${sp.facultad}</span>
                    </div>

                    <div style="display:flex; gap:1.25rem; align-items:flex-start; margin-bottom:1rem;">
                        <img src="${sp.portada}" alt="${sp.titulo}" onerror="this.src='https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico'" style="width:105px; height:105px; border-radius:12px; object-fit:cover; box-shadow:0 8px 20px rgba(0,0,0,0.45); flex-shrink:0; border:1px solid rgba(255,255,255,0.1);" />
                        <div style="flex-grow:1;">
                            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:0.35rem; line-height:1.25;">${sp.titulo}</h3>
                            <div style="font-size:0.85rem; color:#1DB954; font-weight:600; margin-bottom:0.35rem;">
                                🎙️ Creador: ${sp.autor}
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">
                                📍 Universidad del Cauca
                            </div>
                        </div>
                    </div>

                    <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.25rem; line-height:1.5;">${sp.descripcion}</p>
                    
                    <div id="embed-container-${sp.id}" style="display:none; margin-bottom:1rem; border-radius:12px; overflow:hidden;"></div>
                </div>

                <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                    <a href="${sp.url}" target="_blank" class="btn btn-spotify" style="flex:1; justify-content:center; text-decoration:none;">
                        Escuchar en Spotify 🎧
                    </a>
                    <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.5rem 0.85rem;" onclick="toggleSpotifyPlayer('${sp.id}', '${sp.spotifyId}', this)">
                        Reproductor Web ⚡
                    </button>
                </div>
            </div>
        `).join('');

        if (toggleContainer) {
            if (isMobile && total > 3) {
                toggleContainer.innerHTML = spotifyExpanded
                    ? `<button class="btn-toggle-section" onclick="toggleSpotifyExpansion()">Mostrar menos canales ⬆️</button>`
                    : `<button class="btn-toggle-section" onclick="toggleSpotifyExpansion()">Ver los ${total} Canales Oficiales en Spotify 🎙️</button>`;
            } else {
                toggleContainer.innerHTML = '';
            }
        }
    }

    renderSpotifyChannels();

    window.toggleSpotifyPlayer = function(elemId, spotifyId, btn) {
        const container = document.getElementById('embed-container-' + elemId);
        if (!container) return;

        if (container.style.display === 'block') {
            container.style.display = 'none';
            container.innerHTML = '';
            btn.textContent = 'Reproductor Web ⚡';
        } else {
            container.style.display = 'block';
            container.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/show/${spotifyId}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            btn.textContent = 'Ocultar Reproductor ✕';
        }
    };

    // 5. Renderizar Cómics (con paginación progresiva)
    let comicDisplayLimit = 6;
    let currentComicCategory = 'all';

    window.loadMoreComics = function() {
        comicDisplayLimit += 6;
        renderComics(currentComicCategory);
    };

    window.showAllComics = function() {
        comicDisplayLimit = data.comics.length;
        renderComics(currentComicCategory);
    };

    window.showFewerComics = function() {
        comicDisplayLimit = 6;
        renderComics(currentComicCategory);
        const el = document.getElementById('comics');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const comicsGrid = document.getElementById('comics-grid');
    const comicsPaginationControls = document.getElementById('comics-pagination-controls');

    window.renderComics = function(category = 'all') {
        currentComicCategory = category;
        if (!comicsGrid) return;
        const cat = (category || 'all').toLowerCase().trim();
        const filtered = cat === 'all' 
            ? data.comics 
            : data.comics.filter(c => {
                const cCat = (c.categoria || '').toLowerCase();
                const cTit = (c.titulo || '').toLowerCase();
                const cCon = (c.conceptoFisico || '').toLowerCase();
                if (cat === 'moderna' || cat === 'cuantico' || cat === 'cuantica') {
                    return cCat.includes('moderna') || cCat.includes('cuánt') || cTit.includes('cuánt') || cCon.includes('cuánt') || cCat.includes('relatividad') || cTit.includes('tiempo');
                }
                if (cat === 'agro' || cat === 'agrofisica') {
                    return cCat.includes('agro') || cTit.includes('agro') || cCon.includes('suelo') || cCon.includes('riego') || cCon.includes('planta') || cCon.includes('bosque');
                }
                if (cat === 'fluidos' || cat === 'deporte') {
                    return cCat.includes('fluid') || cCat.includes('deporte') || cCon.includes('fluid') || cTit.includes('balón') || cTit.includes('final del mundo') || cTit.includes('submarino') || cTit.includes('parque') || cTit.includes('flot');
                }
                if (cat === 'mecanica') {
                    return cCat.includes('mecánica') || cCat.includes('mecanica');
                }
                if (cat === 'electromagnetismo' || cat === 'electro') {
                    return cCat.includes('electr');
                }
                if (cat === 'historia') {
                    return cCat.includes('historia');
                }
                return cCat.includes(cat) || cTit.includes(cat) || cCon.includes(cat);
            });
        
        if (filtered.length === 0) {
            comicsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:16px; border:1px solid var(--border-color);">
                    <p style="color:var(--text-muted); font-size:1.05rem; margin-bottom:1rem;">No se encontraron cómics en esta categoría.</p>
                    <button class="btn btn-secondary" onclick="renderComics('all')">Ver todos los cómics (${data.comics.length})</button>
                </div>
            `;
            if (comicsPaginationControls) comicsPaginationControls.innerHTML = '';
            return;
        }

        const displayed = filtered.slice(0, comicDisplayLimit);

        comicsGrid.innerHTML = displayed.map(c => `
            <div class="comic-card">
                <div class="comic-cover-wrap">
                    <img src="${c.portada}" alt="${c.titulo}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'400\\' viewBox=\\'0 0 300 400\\'><rect width=\\'300\\' height=\\'400\\' fill=\\'%23111827\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23F59E0B\\' font-family=\\'sans-serif\\' font-size=\\'48\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>🎨</text></svg>';" />
                    <span class="comic-cover-badge">🎨 ${c.categoria}</span>
                </div>
                <div class="comic-body">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">📖 Divulgación Estudiantil</span>
                            <span style="font-size:0.75rem; color:var(--accent-emerald); font-weight:700;">PDF Libre</span>
                        </div>
                        <h3 class="comic-title">${c.titulo}</h3>
                        
                        <div class="comic-authors-box">
                            <span class="comic-authors-icon">✍️</span>
                            <div>
                                <span class="comic-authors-label">Autores:</span>
                                <span class="comic-authors-names">${c.autores}</span>
                            </div>
                        </div>

                        <p class="comic-desc">${c.descripcion}</p>
                        
                        <div class="comic-concept-box">
                            <span style="color:var(--accent-blue); font-weight:600;">🔬 Concepto:</span>
                            <span style="color:var(--text-muted);">${c.conceptoFisico}</span>
                        </div>
                    </div>

                    <div class="card-actions" style="margin-top:auto;">
                        <a href="${c.archivo}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center; text-decoration:none;" onclick="trackDownload('${c.titulo.replace(/'/g, "\\'")}')">Leer Cómic (PDF) 📖</a>
                        <a href="${c.archivo}" download class="btn btn-secondary" onclick="trackDownload('${c.titulo.replace(/'/g, "\\'")}')" style="font-size:0.85rem; text-decoration:none;" title="Descargar PDF">⬇️ Descargar</a>
                    </div>
                </div>
            </div>
        `).join('');

        if (comicsPaginationControls) {
            if (filtered.length > comicDisplayLimit) {
                comicsPaginationControls.innerHTML = `
                    <div class="toggle-info-text">Mostrando ${displayed.length} de ${filtered.length} cómics estudiantiles</div>
                    <div style="display:flex; gap:0.6rem; flex-wrap:wrap; justify-content:center;">
                        <button class="btn-toggle-section" onclick="loadMoreComics()">📖 Cargar más cómics (+6)</button>
                        <button class="btn-toggle-section" onclick="showAllComics()">Mostrar los ${filtered.length} cómics completos ⚡</button>
                    </div>
                `;
            } else if (filtered.length > 6 && comicDisplayLimit >= filtered.length) {
                comicsPaginationControls.innerHTML = `
                    <div class="toggle-info-text">Mostrando todos los ${filtered.length} cómics disponibles</div>
                    <button class="btn-toggle-section" onclick="showFewerComics()">Mostrar menos (primeros 6) ⬆️</button>
                `;
            } else {
                comicsPaginationControls.innerHTML = '';
            }
        }
    };
    renderComics('all');

    // Comic Filter Buttons
    document.querySelectorAll('.comic-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.comic-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            comicDisplayLimit = 6; // Reset limit al cambiar filtro
            renderComics(btn.dataset.filter);
        });
    });

    // 6. Renderizar Episodios Locales de Podcasts
    const podcastsGrid = document.getElementById('podcasts-grid');
    if (podcastsGrid) {
        podcastsGrid.innerHTML = data.podcasts.map((p, idx) => `
            <div class="card">
                <div>
                    <span class="card-tag">${p.categoria}</span>
                    <h3>${p.titulo}</h3>
                    <p>${p.descripcion}</p>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
                        🎙️ Producción: ${p.creditos}
                    </div>
                </div>
                <div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="playPodcast('${p.archivo}', '${p.titulo.replace(/'/g, "\\'")}', '${p.categoria}')">
                            Reproducir Episodio ▶️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Audio Player setup
    window.playPodcast = function(url, title, category) {
        const playerCard = document.getElementById('podcast-player-card');
        const audioElement = document.getElementById('main-audio-player');
        const playerTitle = document.getElementById('current-podcast-title');
        const playerCat = document.getElementById('current-podcast-cat');

        if (playerCard && audioElement) {
            playerCard.style.display = 'block';
            playerTitle.textContent = title;
            playerCat.textContent = "Categoría: " + category;
            audioElement.src = url;
            audioElement.play().catch(e => console.log('Autoplay blocked: ', e));
            playerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Course Modal
    window.openCourseDetails = function(courseId) {
        const course = data.cursos.find(c => c.id === courseId);
        if (!course) return;

        const isLab = course.id === 'transformadores' || course.esLaboratorio;
        const entityWord = isLab ? 'Laboratorio' : 'Curso';
        const modal = document.getElementById('course-modal');
        const modalBody = document.getElementById('modal-course-body');
        modalBody.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                <span class="badge">${isLab ? '🔬 Laboratorio Virtual Autónomo' : '📚 Cuaderno Computacional'}</span>
            </div>
            <h2 style="font-size:1.85rem; margin-bottom:0.5rem; color:var(--accent-blue);">${course.titulo}</h2>
            <p style="color:var(--text-muted); margin-bottom:1.5rem;">${course.descripcion}</p>
            <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; border:1px solid var(--border-color);">
                <h4 style="margin-bottom:0.75rem; color:var(--text-main);">${isLab ? 'Prácticas y Ensayos del Laboratorio:' : 'Temario y Contenidos de la Suite:'}</h4>
                <ul style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:0.6rem; list-style:none;">
                    ${course.temas.map(t => `<li style="font-size:0.9rem; color:var(--text-muted);"><span style="color:var(--accent-emerald);">✓</span> ${t}</li>`).join('')}
                </ul>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                    <span style="font-size:0.85rem; color:var(--text-muted);">Modalidad:</span>
                    <strong style="color:var(--text-main); font-size:1rem; display:block;">${isLab ? 'Laboratorio Autónomo de Alta Precisión' : '100% Interactivo con simulación matemática'}</strong>
                </div>
                ${course.demoPath ? `<a href="${course.demoPath}" target="_blank" class="btn btn-primary">Abrir ${entityWord} 🚀</a>` : ''}
            </div>
        `;
        modal.classList.add('active');
    };

    window.closeModal = function() {
        document.getElementById('course-modal').classList.remove('active');
    };

    // 5. Renderizar Artículos de Squash & Física del Deporte
    function renderSquashArticles() {
        const grid = document.getElementById('articulos-grid');
        if (!grid || !data.articulosSquash) return;

        grid.innerHTML = data.articulosSquash.map(art => `
            <div class="card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag interactive">${art.tag}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${art.tiempoLectura}</span>
                    </div>
                    <h3 style="font-size:1.25rem; line-height:1.35; margin-bottom:0.4rem;">${art.icono} ${art.titulo}</h3>
                    <div style="font-size:0.85rem; color:var(--accent-blue); font-weight:600; margin-bottom:0.85rem;">
                        ${art.subtitulo}
                    </div>
                    <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5; margin-bottom:1.25rem;">
                        ${art.resumen}
                    </p>
                </div>
                <div>
                    <div class="card-actions" style="margin-top:auto;">
                        <button class="btn btn-primary" onclick="openArticle('${art.id}')" style="flex:1;">
                            Leer Artículo 📖
                        </button>
                        <a href="${art.demoPath}" target="_blank" class="btn btn-secondary" style="font-size:0.85rem;">
                            Probar Simulador 🎾
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSquashArticles();

    // Modal de Artículos de Squash
    window.openArticle = function(id) {
        const art = (data.articulosSquash || []).find(a => a.id === id);
        if (!art) return;

        const modal = document.getElementById('article-modal');
        const modalBody = document.getElementById('modal-article-body');
        modalBody.innerHTML = `
            <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
                <span class="badge" style="background:rgba(16, 185, 129, 0.1); border-color:rgba(16, 185, 129, 0.3); color:var(--accent-emerald);">${art.tag}</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">⏱️ ${art.tiempoLectura}</span>
            </div>
            <h2 style="font-size:1.85rem; line-height:1.3; color:#fff; margin-bottom:0.5rem;">${art.icono} ${art.titulo}</h2>
            <p style="color:var(--accent-blue); font-weight:600; margin-bottom:1.5rem;">${art.subtitulo}</p>
            <div style="line-height:1.75; color:var(--text-main); font-size:1rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1.25rem; margin-bottom:2rem;">
                ${art.contenido}
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:12px; padding:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                    <strong style="color:#fff; display:block;">¿Quieres experimentar la física interactiva?</strong>
                    <span style="font-size:0.85rem; color:var(--text-muted);">Prueba el modelo de cadena cinética y la simulación de impacto en tiempo real.</span>
                </div>
                <a href="${art.demoPath}" target="_blank" class="btn btn-primary">Abrir Simulador de Squash 🎾</a>
            </div>
        `;
        modal.classList.add('active');
    };

    window.closeArticleModal = function() {
        document.getElementById('article-modal').classList.remove('active');
    };

    // Modal de Checkout / Pasarela de Pago
    window.openPaymentModal = function(courseId) {
        const course = data.cursos.find(c => c.id === courseId);
        if (!course) return;

        const isLab = course.id === 'transformadores' || course.esLaboratorio;
        const entityWord = isLab ? 'Laboratorio' : 'Curso';
        const modal = document.getElementById('payment-modal');
        const modalBody = document.getElementById('modal-payment-body');
        
        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem;">
                <span class="badge" style="background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3); margin-bottom:0.5rem;">
                    🛒 Checkout Seguro · PhysicsAILab
                </span>
                <h2 style="font-size:1.75rem; color:#fff; margin-bottom:0.35rem;">${course.titulo}</h2>
                <div style="font-size:0.9rem; color:var(--text-muted);">${course.tipo} · ${course.modulos}</div>
            </div>

            <div style="background:linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8)); border:1px solid var(--border-color); border-radius:16px; padding:1.5rem; margin-bottom:1.5rem; text-align:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.25rem;">Precio de Lanzamiento</div>
                <div style="font-size:2.5rem; font-weight:800; color:#fff; margin-bottom:0.25rem;">
                    ${course.precioEstimado.split(' ')[0]} <span style="font-size:1.15rem; color:var(--accent-blue); font-weight:600;">USD</span>
                </div>
                <div style="font-size:0.95rem; color:var(--accent-emerald); font-weight:600; margin-bottom:0.75rem;">
                    ${course.precioEstimado.includes('COP') ? course.precioEstimado.substring(course.precioEstimado.indexOf('(~')) : 'Aproximadamente $115.000 - $195.000 COP'}
                </div>
                <div style="display:flex; justify-content:center; gap:1rem; font-size:0.8rem; color:var(--text-muted);">
                    <span>🔒 Acceso Permanente</span>
                    <span>⚡ Sin mensualidades</span>
                    <span>🎓 Soporte de Autor</span>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.85rem;">
                <a href="https://hotmart.com" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="justify-content:center; padding:0.85rem; font-size:1rem; background:linear-gradient(135deg, #f97316, #ea580c); border:none; box-shadow:0 8px 25px rgba(234,88,12,0.35);">
                    Adquirir en Hotmart (Tarjeta / PayPal / PSE) 💳
                </a>
                
                <a href="https://wa.me/?text=${encodeURIComponent('Hola Mg. Manuel Obando, me interesa adquirir: ' + course.titulo + ' en PhysicsAILab.com. ¿Cuáles son los datos para transferencia / Nequi?')}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="justify-content:center; padding:0.75rem; font-size:0.9rem; border-color:rgba(16,185,129,0.4); color:#34d399;">
                    💬 Pago Directo (Transferencia / Nequi / Bancolombia)
                </a>

                <a href="mailto:manuelobando@unicauca.edu.co?subject=${encodeURIComponent('Interés en: ' + course.titulo)}&body=${encodeURIComponent('Cordial saludo profesor Manuel,\n\nEstoy interesado en adquirir ' + course.titulo + ' en PhysicsAILab.com.\n\nPor favor indíqueme el método de pago.')}" class="btn btn-secondary" style="justify-content:center; padding:0.75rem; font-size:0.9rem;">
                    ✉️ Consultar al Docente por Correo
                </a>
            </div>

            <p style="font-size:0.75rem; text-align:center; color:var(--text-muted); margin-top:1.25rem;">
                Docente de autoría: Mg. Manuel Alejandro Obando (Universidad del Cauca) · Cuenta oficial Hotmart: @manuel_obando_963654
            </p>
        `;

        modal.classList.add('active');
    };

    window.openBookPaymentModal = function(bookId) {
        const book = (data.librosHotmart || []).find(b => b.id === bookId);
        if (!book) return;

        const modal = document.getElementById('payment-modal');
        const modalBody = document.getElementById('modal-payment-body');
        
        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem;">
                <span class="badge" style="background:rgba(234,88,12,0.15); color:#f97316; border-color:rgba(234,88,12,0.3); margin-bottom:0.5rem;">
                    📚 Librería Digital Oficial Hotmart
                </span>
                <h2 style="font-size:1.75rem; color:#fff; margin-bottom:0.35rem;">${book.titulo}</h2>
                <div style="font-size:0.9rem; color:var(--text-muted);">Autor: ${book.autor}</div>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:16px; padding:1.25rem; margin-bottom:1.5rem;">
                <p style="font-size:0.95rem; color:var(--text-main); margin-bottom:0.75rem; line-height:1.6;">${book.descripcion}</p>
                <div style="font-size:0.85rem; color:var(--accent-blue);">
                    Formatos: PDF de alta resolución + Códigos computacionales + ePub
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.85rem;">
                <a href="https://hotmart.com" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="justify-content:center; padding:0.85rem; font-size:1rem; background:linear-gradient(135deg, #f97316, #ea580c); border:none;">
                    Adquirir en Hotmart Oficial 🛒
                </a>

                <a href="mailto:manuelobando@unicauca.edu.co?subject=${encodeURIComponent('Consulta Libro: ' + book.titulo)}" class="btn btn-secondary" style="justify-content:center; padding:0.75rem; font-size:0.9rem;">
                    ✉️ Contactar al Autor por Correo
                </a>
            </div>

            <p style="font-size:0.75rem; text-align:center; color:var(--text-muted); margin-top:1.25rem;">
                Cuenta oficial en Hotmart: @manuel_obando_963654 · Garantía de satisfacción de 7 días.
            </p>
        `;

        modal.classList.add('active');
    };

    window.closePaymentModal = function() {
        document.getElementById('payment-modal').classList.remove('active');
    };

    // ========================================================
    // ESPACIO DOCENTE & PANEL DE CONTROL ADMINISTRADOR
    // ========================================================
    window.openAdminPanel = function() {
        const modal = document.getElementById('admin-modal');
        const modalBody = document.getElementById('admin-modal-body');
        if (!modal || !modalBody) return;

        if (isAdmin()) {
            renderAdminDashboardContent();
        } else {
            renderAdminLoginForm();
        }

        modal.classList.add('active');
    };

    window.closeAdminPanel = function() {
        const modal = document.getElementById('admin-modal');
        if (modal) modal.classList.remove('active');
    };

    window.renderAdminLoginForm = function() {
        const modalBody = document.getElementById('admin-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="admin-login-box">
                <div class="admin-avatar-badge">🔐</div>
                <span class="badge" style="background:rgba(99, 102, 241, 0.15); color:var(--accent-indigo); border-color:rgba(129, 140, 248, 0.35); margin-bottom:0.5rem;">
                    Acceso Exclusivo Docente
                </span>
                <h2 style="font-size:1.75rem; color:#fff; margin-bottom:0.35rem;">Espacio de Administración</h2>
                <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1.5rem;">
                    Mg. Manuel Alejandro Obando · Universidad del Cauca
                </div>

                <div style="background:rgba(255, 255, 255, 0.03); border:1px solid rgba(255, 255, 255, 0.08); border-radius:14px; padding:1.5rem; text-align:left;">
                    <label style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:600; display:block; margin-bottom:0.35rem;">
                        Clave Maestra Docente:
                    </label>
                    <div class="admin-input-group" style="margin-top:0.25rem;">
                        <input type="password" id="admin-pass-input" placeholder="Ingresa tu contraseña de docente..." onkeydown="if(event.key==='Enter') loginAdmin();" autofocus />
                    </div>
                    <div id="admin-login-error" style="color:#F87171; font-size:0.82rem; margin-top:0.5rem; display:none;"></div>

                    <p style="font-size:0.8rem; color:var(--text-muted); margin:0.75rem 0 1.25rem; line-height:1.4;">
                        Al iniciar sesión se liberará el acceso total a los 11 cursos, laboratorios, cómics y estadísticas en tiempo real.
                    </p>

                    <button class="btn btn-primary" onclick="loginAdmin()" style="width:100%; justify-content:center; padding:0.85rem; font-size:1rem; background:linear-gradient(135deg, #6366F1, #8B5CF6); border:none;">
                        Iniciar Sesión Docente 🚀
                    </button>
                </div>
            </div>
        `;
        setTimeout(() => {
            const inp = document.getElementById('admin-pass-input');
            if (inp) inp.focus();
        }, 150);
    };

    window.loginAdmin = function() {
        const inp = document.getElementById('admin-pass-input');
        const err = document.getElementById('admin-login-error');
        if (!inp) return;
        const pass = inp.value.trim();

        const masterKey = (data.claveAdministrador || 'OBANDO-ADMIN-2026').trim();
        if (pass.toUpperCase() === masterKey.toUpperCase() || pass === 'OBANDO-MASTER-ADMIN') {
            localStorage.setItem('physicsailab_admin', 'true');
            showToast('👑 ¡Bienvenido Mg. Manuel Alejandro Obando! Sesión de Administrador iniciada.');
            updateStudentBannerState();
            renderCourses(currentCourseFilter);
            renderAdminDashboardContent();
        } else {
            if (err) {
                err.textContent = '❌ Clave de docente incorrecta. Verifica e intenta de nuevo.';
                err.style.display = 'block';
            }
        }
    };

    window.cerrarSesionAdmin = function() {
        localStorage.removeItem('physicsailab_admin');
        updateStudentBannerState();
        renderCourses(currentCourseFilter);
        showToast('🔒 Sesión de Administrador cerrada correctamente.');
        closeAdminPanel();
    };

    window.probarComoVisitante = function() {
        localStorage.removeItem('physicsailab_admin');
        updateStudentBannerState();
        renderCourses(currentCourseFilter);
        showToast('👁️ Modo Visitante activado. Ahora estás viendo la web como un usuario sin privilegios.');
        closeAdminPanel();
        const el = document.getElementById('cursos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    window.abrirCanjeadorRapido = function() {
        const input = document.getElementById('student-code-input');
        if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
        } else {
            const el = document.getElementById('cursos');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Renderizar Dashboard del Administrador
    window.renderAdminDashboardContent = function() {
        const modalBody = document.getElementById('admin-modal-body');
        if (!modalBody) return;

        const currentVisits = parseInt(localStorage.getItem('physicsailab_visits') || BASE_VISITS.toString(), 10);
        const currentDownloads = parseInt(localStorage.getItem('physicsailab_downloads') || BASE_DOWNLOADS.toString(), 10);
        const userComments = getStoredComments();
        const baseComments = data.comentarios || [];
        const totalComments = userComments.length + baseComments.length;

        const coursesList = data.cursos || [];

        modalBody.innerHTML = `
            <div>
                <!-- Header del Panel -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:1.25rem; margin-bottom:1.5rem;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                            <span class="unlocked-tag admin-badge" style="font-size:0.8rem; padding:0.25rem 0.75rem;">👑 MODO ADMINISTRADOR ACTIVO</span>
                            <span style="font-size:0.75rem; color:#34D399; font-weight:700;">● Todo el contenido liberado</span>
                        </div>
                        <h2 style="font-size:1.85rem; color:#fff; margin:0 0 0.25rem;">Panel de Control Docente</h2>
                        <div style="font-size:0.88rem; color:var(--text-muted);">
                            Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <button class="btn btn-secondary" onclick="probarComoVisitante()" style="font-size:0.82rem; padding:0.45rem 0.85rem;" title="Desactiva temporalmente el modo admin para probar la experiencia de un alumno">
                            👁️ Probar como Visitante
                        </button>
                        <button class="btn btn-secondary" onclick="cerrarSesionAdmin()" style="font-size:0.82rem; padding:0.45rem 0.85rem; border-color:rgba(239,68,68,0.4); color:#FCA5A5;">
                            🚪 Cerrar Sesión
                        </button>
                    </div>
                </div>

                <!-- KPI Grid de Estadísticas en Vivo -->
                <div style="margin-bottom:1.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h4 style="color:#fff; font-size:1.05rem; margin:0; display:flex; align-items:center; gap:0.5rem;">
                            📊 Estadísticas y Tráfico de la Plataforma en Tiempo Real
                        </h4>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Actualizado automáticamente</span>
                    </div>

                    <div class="admin-kpi-grid">
                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Visitas Totales</span>
                                <span style="font-size:1.25rem;">👁️</span>
                            </div>
                            <div class="admin-kpi-num">${currentVisits.toLocaleString('es-ES')}</div>
                            <div style="display:flex; gap:0.35rem; margin-top:0.35rem;">
                                <button class="admin-btn-action" onclick="adminIncrementVisits(10)" title="Sumar 10 visitas de prueba">+10</button>
                                <button class="admin-btn-action" onclick="adminResetCounter('visits')" title="Restablecer contador a valor base">Reset</button>
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Descargas de Material</span>
                                <span style="font-size:1.25rem;">📥</span>
                            </div>
                            <div class="admin-kpi-num">${currentDownloads.toLocaleString('es-ES')}</div>
                            <div style="display:flex; gap:0.35rem; margin-top:0.35rem;">
                                <button class="admin-btn-action" onclick="adminIncrementDownloads(5)" title="Sumar 5 descargas de prueba">+5</button>
                                <button class="admin-btn-action" onclick="adminResetCounter('downloads')" title="Restablecer contador a valor base">Reset</button>
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Comentarios en Muro</span>
                                <span style="font-size:1.25rem;">💬</span>
                            </div>
                            <div class="admin-kpi-num">${totalComments}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
                                ${userComments.length} opiniones nuevas enviadas
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Cursos & Labs</span>
                                <span style="font-size:1.25rem;">🚀</span>
                            </div>
                            <div class="admin-kpi-num">${coursesList.length}</div>
                            <div style="font-size:0.75rem; color:#34D399; margin-top:0.35rem;">
                                100% Liberados para ti
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Cómics en PDF</span>
                                <span style="font-size:1.25rem;">🎨</span>
                            </div>
                            <div class="admin-kpi-num">${(data.comics || []).length}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
                                Creados por estudiantes
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Curiosidades Físicas</span>
                                <span style="font-size:1.25rem;">💡</span>
                            </div>
                            <div class="admin-kpi-num">${(data.datosCuriosos || []).length}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
                                Rotación diaria activa
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabla de Gestión de Claves de Estudiantes por Materia -->
                <div style="margin-bottom:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
                        <div>
                            <h4 style="color:#fff; font-size:1.05rem; margin:0 0 0.2rem; display:flex; align-items:center; gap:0.5rem;">
                                🔑 Claves de Acceso Estudiantil por Materia (${coursesList.length} Cursos)
                            </h4>
                            <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
                                Cada clave desbloquea <strong>únicamente</strong> su materia respectiva para los alumnos. Puedes copiar el mensaje listo para WhatsApp o editar la clave con un clic.
                            </p>
                        </div>
                    </div>

                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Materia / Laboratorio</th>
                                    <th>Categoría</th>
                                    <th>Clave Principal</th>
                                    <th>Clave Alternativa</th>
                                    <th style="text-align:right;">Acciones Rápidas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${coursesList.map(c => {
                                    const keys = getCourseKeys(c.id);
                                    const primaryKey = keys[0] || 'SIN-CLAVE';
                                    const secondaryKey = keys[1] || '---';
                                    const isLab = c.id === 'transformadores' || c.esLaboratorio;

                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight:700; color:#fff;">
                                                    ${isLab ? '🔬 ' : '📚 '}${c.titulo}
                                                </div>
                                                <div style="font-size:0.75rem; color:var(--text-muted);">
                                                    ${c.modulos}
                                                </div>
                                            </td>
                                            <td>
                                                <span class="card-tag ${isLab ? 'lab-tag' : ''}" style="font-size:0.7rem; padding:0.15rem 0.5rem;">
                                                    ${c.categoria}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="admin-key-pill" id="key-badge-${c.id}">${primaryKey}</span>
                                            </td>
                                            <td>
                                                <span style="font-family:monospace; font-size:0.8rem; color:var(--text-muted);">${secondaryKey}</span>
                                            </td>
                                            <td style="text-align:right;">
                                                <div style="display:inline-flex; gap:0.4rem; justify-content:flex-end;">
                                                    <button class="admin-btn-action" onclick="copiarMensajeClave('${c.id}', '${primaryKey}', '${c.titulo.replace(/'/g, "\\'")}', this)" title="Copiar mensaje de WhatsApp para enviar a tus alumnos">
                                                        📋 Copiar para WhatsApp
                                                    </button>
                                                    <button class="admin-btn-action" onclick="editarClaveCurso('${c.id}', '${c.titulo.replace(/'/g, "\\'")}')" title="Asignar una nueva clave personalizada">
                                                        ✏️ Cambiar
                                                    </button>
                                                    ${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="admin-btn-action" style="color:var(--accent-blue);" title="Abrir curso (desbloqueado en modo administrador)">🚀 Abrir</a>` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Moderación de Comentarios Recientes -->
                <div>
                    <h4 style="color:#fff; font-size:1.05rem; margin:0 0 0.5rem; display:flex; align-items:center; gap:0.5rem;">
                        💬 Moderación de Comentarios Publicados por Usuarios (${userComments.length})
                    </h4>
                    ${userComments.length === 0 ? `
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1.25rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
                            No hay comentarios agregados por visitantes recientemente. Se están mostrando las reseñas oficiales de base.
                        </div>
                    ` : `
                        <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:240px; overflow-y:auto;">
                            ${userComments.map(uc => `
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                                    <div style="flex-grow:1;">
                                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                                            <strong style="color:#fff; font-size:0.9rem;">${uc.nombre}</strong>
                                            <span style="font-size:0.75rem; color:var(--text-muted);">(${uc.rol})</span>
                                            <span style="font-size:0.8rem;">${'⭐'.repeat(uc.calificacion || 5)}</span>
                                        </div>
                                        <div style="font-size:0.85rem; color:var(--text-main); font-style:italic;">"${uc.texto}"</div>
                                    </div>
                                    <button class="admin-btn-action" onclick="adminEliminarComentario('${uc.id}')" style="border-color:rgba(239,68,68,0.4); color:#FCA5A5; flex-shrink:0;">
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    };

    // Funciones de acción del Dashboard
    window.copiarMensajeClave = function(courseId, key, courseTitle, btn) {
        const text = `¡Hola estudiantes de ${courseTitle}!\n\nAquí tienen la clave de acceso para desbloquear el contenido completo e interactivo del semestre en nuestra plataforma oficial:\n\n🔑 Clave de Acceso: *${key}*\n🌐 Enlace: https://physicsailab.com#cursos\n\nNos vemos en clase.\nMg. Manuel Alejandro Obando — Universidad del Cauca`;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ ¡Copiado!';
            btn.classList.add('copied');
            showToast(`📋 Mensaje de WhatsApp copiado para <strong>${courseTitle}</strong>. ¡Listo para pegar en tu grupo!`);
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('copied');
            }, 3000);
        }).catch(() => {
            alert(`Mensaje para WhatsApp:\n\n${text}`);
        });
    };

    window.editarClaveCurso = function(courseId, courseTitle) {
        const currentKeys = getCourseKeys(courseId);
        const newKey = prompt(`Asigna una nueva clave para:\n"${courseTitle}"\n\nClave actual: ${currentKeys[0] || ''}`, currentKeys[0] || '');
        if (!newKey) return;

        const cleanKey = newKey.trim().toUpperCase();
        if (cleanKey.length < 3) {
            alert('La clave debe tener al menos 3 caracteres.');
            return;
        }

        try {
            const custom = JSON.parse(localStorage.getItem('physicsailab_custom_keys') || '{}');
            custom[courseId] = [cleanKey, ...(currentKeys.slice(1))];
            localStorage.setItem('physicsailab_custom_keys', JSON.stringify(custom));
            showToast(`🔑 Clave para <strong>${courseTitle}</strong> actualizada a: <strong>${cleanKey}</strong>`);
            renderAdminDashboardContent();
            renderCourses(currentCourseFilter);
        } catch(e) {
            alert('Error al guardar la clave.');
        }
    };

    window.adminIncrementVisits = function(n = 10) {
        let v = parseInt(localStorage.getItem('physicsailab_visits') || BASE_VISITS.toString(), 10);
        v += n;
        localStorage.setItem('physicsailab_visits', v);
        updateVisitsDisplay(v);
        renderAdminDashboardContent();
        showToast(`👁️ Se agregaron +${n} visitas. Total: ${v.toLocaleString('es-ES')}`);
    };

    window.adminIncrementDownloads = function(n = 5) {
        let d = parseInt(localStorage.getItem('physicsailab_downloads') || BASE_DOWNLOADS.toString(), 10);
        d += n;
        localStorage.setItem('physicsailab_downloads', d);
        updateDownloadsDisplay(d);
        renderAdminDashboardContent();
        showToast(`📥 Se agregaron +${n} descargas. Total: ${d.toLocaleString('es-ES')}`);
    };

    window.adminResetCounter = function(type) {
        if (!confirm(`¿Estás seguro de restablecer el contador de ${type === 'visits' ? 'visitas' : 'descargas'} a su valor base inicial?`)) return;
        if (type === 'visits') {
            localStorage.setItem('physicsailab_visits', BASE_VISITS);
            updateVisitsDisplay(BASE_VISITS);
        } else {
            localStorage.setItem('physicsailab_downloads', BASE_DOWNLOADS);
            updateDownloadsDisplay(BASE_DOWNLOADS);
        }
        renderAdminDashboardContent();
        showToast(`🔄 Contador de ${type === 'visits' ? 'visitas' : 'descargas'} restablecido.`);
    };

    window.adminEliminarComentario = function(commentId) {
        if (!confirm('¿Deseas eliminar este comentario de la plataforma?')) return;
        let stored = getStoredComments();
        stored = stored.filter(c => c.id !== commentId);
        localStorage.setItem('physicsailab_user_comments', JSON.stringify(stored));
        renderComments();
        renderAdminDashboardContent();
        showToast('🗑️ Comentario eliminado correctamente.');
    };

    // ========================================================
    // 7. Renderizar Datos Fascinantes de la Física (Rotación Diaria Dinámica)
    // ========================================================
    const now = new Date();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaNombre = diasSemana[now.getDay()];
    const diaMes = now.getDate();
    const mesNombre = meses[now.getMonth()];
    const anio = now.getFullYear();
    const fechaHoyTexto = `${diaNombre}, ${diaMes} de ${mesNombre} de ${anio}`;

    // Cálculo del día del año (1..366) para rotación determinista diaria
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = (now - startOfYear) + ((startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Dato del día determinista para hoy (cambia cada 24 horas a medianoche)
    const totalFactsCount = (data.datosCuriosos && data.datosCuriosos.length) ? data.datosCuriosos.length : 31;
    const dailyFactIndex = dayOfYear % totalFactsCount;
    const todayFact = data.datosCuriosos[dailyFactIndex];

    function renderDailyFactBanner() {
        const container = document.getElementById('daily-fact-container');
        if (!container || !todayFact) return;

        container.innerHTML = `
            <div class="daily-fact-banner">
                <div class="daily-fact-header">
                    <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                        <span class="daily-pulse-tag">✨ DATO CURIOSO DEL DÍA</span>
                        <span class="daily-date-badge">📅 ${fechaHoyTexto}</span>
                    </div>
                    <span class="daily-refresh-indicator">🔄 Rotación Diaria Automática</span>
                </div>
                
                <div class="daily-fact-body">
                    <div class="daily-fact-icon-col">
                        <div class="daily-fact-icon">${todayFact.icono}</div>
                    </div>
                    <div class="daily-fact-content-col">
                        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap;">
                            <span class="fact-badge ${todayFact.categoriaTag || ''}">${todayFact.categoria}</span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">Curiosidad del día #${todayFact.id.replace('dato-', '')} de ${totalFactsCount}</span>
                        </div>
                        <h3 class="daily-fact-title">${todayFact.titulo}</h3>
                        <p class="daily-fact-desc">${todayFact.descripcion}</p>
                        
                        <div class="daily-fact-principle">
                            <span style="color:var(--accent-blue); font-weight:700;">🔬 Principio Científico:</span>
                            <span style="color:var(--text-main);">${todayFact.principio}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDailyFactBanner();

    // Rotación del listado general según el día del año para dinamizar la página
    function getDailyOrderedFacts() {
        if (!data.datosCuriosos) return [];
        const list = [...data.datosCuriosos];
        // Desplazamiento rotativo que refresca la portada cada día
        const offset = (dayOfYear * 5) % totalFactsCount;
        return list.slice(offset).concat(list.slice(0, offset));
    }

    let factsExpanded = false;
    window.toggleFactsExpansion = function() {
        factsExpanded = !factsExpanded;
        renderPhysicsFacts(currentFactFilter);
        if (!factsExpanded) {
            const el = document.getElementById('curiosidades');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    let currentFactFilter = 'all';
    const factsGrid = document.getElementById('facts-grid');
    const factsToggleControls = document.getElementById('facts-toggle-controls');

    window.renderPhysicsFacts = function(filter = 'all') {
        currentFactFilter = filter;
        if (!factsGrid || !data.datosCuriosos) return;
        const f = (filter || 'all').toLowerCase();
        
        // Si el filtro es 'all', usamos el orden dinámico del día; si es específico, filtramos el catálogo
        const baseList = f === 'all' ? getDailyOrderedFacts() : data.datosCuriosos;
        const filtered = f === 'all'
            ? baseList
            : baseList.filter(item => (item.categoriaTag || '').toLowerCase().includes(f));

        const isMobile = window.innerWidth <= 768;
        const factsToRender = (isMobile && !factsExpanded) ? filtered.slice(0, 4) : filtered;

        factsGrid.innerHTML = factsToRender.map(item => `
            <div class="fact-card" id="fact-card-${item.id}">
                <div>
                    <span class="fact-badge ${item.categoriaTag || ''}">
                        ${item.icono} ${item.categoria}
                    </span>
                    <h3 class="fact-title">${item.titulo}</h3>
                    <p class="fact-desc">${item.descripcion}</p>
                </div>
                <div class="fact-principle-box">
                    <span style="color:var(--accent-blue); font-weight:700;">🔬 Principio:</span>
                    <span style="color:var(--text-muted);">${item.principio}</span>
                </div>
            </div>
        `).join('');

        if (factsToggleControls) {
            if (isMobile && filtered.length > 4) {
                factsToggleControls.innerHTML = factsExpanded
                    ? `<button class="btn-toggle-section" onclick="toggleFactsExpansion()">Mostrar menos curiosidades ⬆️</button>`
                    : `<button class="btn-toggle-section" onclick="toggleFactsExpansion()">Ver todas las ${filtered.length} curiosidades (quedan ${filtered.length - 4}) 💡</button>`;
            } else {
                factsToggleControls.innerHTML = '';
            }
        }
    };

    renderPhysicsFacts('all');

    document.querySelectorAll('.fact-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fact-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            factsExpanded = true; // Al seleccionar categoría, mostrar todos
            renderPhysicsFacts(btn.dataset.filter);
        });
    });

    window.destacarDatoAleatorio = function() {
        if (!data.datosCuriosos || data.datosCuriosos.length === 0) return;
        document.querySelectorAll('.fact-filter-btn').forEach(b => b.classList.remove('active'));
        const allBtn = document.querySelector('.fact-filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
        factsExpanded = true; // Expandir para asegurar que el dato seleccionado sea visible
        renderPhysicsFacts('all');

        const randomIndex = Math.floor(Math.random() * data.datosCuriosos.length);
        const randomFact = data.datosCuriosos[randomIndex];
        const cardElem = document.getElementById('fact-card-' + randomFact.id);
        if (cardElem) {
            cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardElem.classList.add('fact-highlight');
            setTimeout(() => {
                cardElem.classList.remove('fact-highlight');
            }, 2500);
            showToast(`🎲 Curiosidad seleccionada: <strong>${randomFact.titulo}</strong>`);
        }
    };

    // ========================================================
    // 8. Muro de Opiniones y Comentarios de la Comunidad (con modo compacto)
    // ========================================================
    let commentsDisplayLimit = 3;
    window.toggleCommentsExpansion = function() {
        const userComments = getStoredComments();
        const baseComments = data.comentarios || [];
        const total = userComments.length + baseComments.length;

        if (commentsDisplayLimit >= total) {
            commentsDisplayLimit = 3;
            renderComments();
            const el = document.getElementById('comentarios');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            commentsDisplayLimit = total;
            renderComments();
        }
    };

    const commentsList = document.getElementById('comments-list');
    const commentsToggleControls = document.getElementById('comments-toggle-controls');
    const commentsTotalCounter = document.getElementById('comments-total-counter');

    function getStoredComments() {
        try {
            return JSON.parse(localStorage.getItem('physicsailab_user_comments') || '[]');
        } catch (e) {
            return [];
        }
    }

    window.renderComments = function() {
        if (!commentsList) return;
        const userComments = getStoredComments();
        const baseComments = data.comentarios || [];
        const allComments = [...userComments, ...baseComments];

        if (commentsTotalCounter) {
            commentsTotalCounter.textContent = allComments.length;
        }

        const displayed = allComments.slice(0, commentsDisplayLimit);

        commentsList.innerHTML = displayed.map(c => {
            const stars = '⭐'.repeat(c.calificacion || 5);
            const initials = (c.nombre || 'U').trim().substring(0, 2).toUpperCase();
            const isUser = !!c.isCustomUser;
            const bg = c.avatarBg || 'linear-gradient(135deg, #38BDF8, #818CF8)';

            return `
                <div class="comment-card ${isUser ? 'new-comment' : ''}">
                    <div>
                        <div class="comment-header">
                            <div class="comment-avatar" style="background:${bg};">
                                ${initials}
                            </div>
                            <div style="flex-grow:1;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div class="comment-name">${c.nombre}</div>
                                    ${isUser ? '<span style="font-size:0.7rem; background:rgba(16,185,129,0.2); color:var(--accent-emerald); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700;">Tu Reseña</span>' : ''}
                                </div>
                                <div class="comment-role-tag">${c.rolBadge || c.rol}</div>
                            </div>
                        </div>

                        <div class="comment-meta">
                            <div class="comment-stars">${stars}</div>
                            <div class="comment-date">${c.fecha}</div>
                        </div>

                        <p class="comment-text">"${c.texto}"</p>
                    </div>
                </div>
            `;
        }).join('');

        if (commentsToggleControls) {
            if (allComments.length > 3) {
                commentsToggleControls.innerHTML = (commentsDisplayLimit >= allComments.length)
                    ? `<button class="btn-toggle-section" onclick="toggleCommentsExpansion()">Mostrar menos opiniones ⬆️</button>`
                    : `<button class="btn-toggle-section" onclick="toggleCommentsExpansion()">Ver más opiniones (${allComments.length} en total) 💬</button>`;
            } else {
                commentsToggleControls.innerHTML = '';
            }
        }
    };

    renderComments();

    const starLabels = {
        1: '1 / 5 Regular',
        2: '2 / 5 Aceptable',
        3: '3 / 5 Bueno',
        4: '4 / 5 Muy Bueno',
        5: '5 / 5 Excelente'
    };

    window.setCommentRating = function(rating) {
        const ratingInput = document.getElementById('comment-rating');
        const ratingLabel = document.getElementById('star-rating-label');
        if (ratingInput) ratingInput.value = rating;
        if (ratingLabel) ratingLabel.textContent = starLabels[rating] || (rating + ' / 5');

        document.querySelectorAll('#star-selector .star-btn').forEach(btn => {
            const r = parseInt(btn.dataset.rating, 10);
            if (r <= rating) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    window.handleCommentSubmit = function(event) {
        event.preventDefault();
        const nameInput = document.getElementById('comment-name');
        const roleInput = document.getElementById('comment-role');
        const ratingInput = document.getElementById('comment-rating');
        const messageInput = document.getElementById('comment-message');

        if (!nameInput || !messageInput) return;

        const name = nameInput.value.trim();
        const role = roleInput ? roleInput.value : '🎓 Estudiante Unicauca';
        const rating = parseInt(ratingInput ? ratingInput.value : '5', 10);
        const text = messageInput.value.trim();

        if (!name || !text) {
            alert('Por favor completa tu nombre y comentario.');
            return;
        }

        const avatarGradients = [
            'linear-gradient(135deg, #06B6D4, #0284C7)',
            'linear-gradient(135deg, #10B981, #047857)',
            'linear-gradient(135deg, #F59E0B, #D97706)',
            'linear-gradient(135deg, #EC4899, #BE185D)',
            'linear-gradient(135deg, #8B5CF6, #6D28D9)'
        ];
        const randomBg = avatarGradients[Math.floor(Math.random() * avatarGradients.length)];

        const newComment = {
            id: 'user-com-' + Date.now(),
            nombre: name,
            rol: role,
            rolBadge: role,
            calificacion: rating,
            fecha: 'Recién publicado',
            texto: text,
            avatarBg: randomBg,
            isCustomUser: true
        };

        const existing = getStoredComments();
        existing.unshift(newComment);
        localStorage.setItem('physicsailab_user_comments', JSON.stringify(existing));

        commentsDisplayLimit = Math.max(commentsDisplayLimit, existing.length);
        renderComments();

        // Reset inputs
        nameInput.value = '';
        messageInput.value = '';
        setCommentRating(5);

        showToast(`💬 ¡Muchas gracias <strong>${name}</strong>! Tu comentario se ha publicado con éxito.`);

        setTimeout(() => {
            if (confirm('¿Deseas enviar también tu comentario directamente al WhatsApp del profesor Manuel Obando?')) {
                const waText = `Hola profesor Manuel, he dejado este comentario en PhysicsAILab.com:\n\n"${text}"\n- ${name} (${role})`;
                window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
            }
        }, 1200);
    };

    // Adaptar dinámicamente si cambia el tamaño de pantalla
    window.addEventListener('resize', () => {
        renderCourses();
        renderSpotifyChannels();
        renderPhysicsFacts(currentFactFilter);
    });
});
