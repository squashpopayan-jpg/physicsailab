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

    // 2. Estado de Desbloqueo Estudiantil
    let isStudentUnlocked = localStorage.getItem('estudiante_desbloqueado') === 'true';

    function updateStudentBannerState() {
        const bannerContainer = document.getElementById('student-banner-container');
        if (!bannerContainer) return;

        if (isStudentUnlocked) {
            bannerContainer.innerHTML = `
                <div class="student-banner" style="border-color:var(--accent-emerald); background:rgba(16, 185, 129, 0.1);">
                    <div>
                        <span class="unlocked-tag">🎓 Modo Estudiante Activo</span>
                        <h4 style="margin:0.25rem 0; color:#fff;">¡Acceso Completo Desbloqueado!</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                            Tienes acceso libre a todos los capítulos, simuladores y laboratorios de la Universidad del Cauca.
                        </p>
                    </div>
                    <div>
                        <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="bloquearModoEstudiante()">
                            Cerrar sesión de estudiante 🔒
                        </button>
                    </div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = `
                <div class="student-banner">
                    <div>
                        <span class="card-tag interactive" style="margin-bottom:0.25rem;">🎓 Control de Acceso Académico</span>
                        <h4 style="margin:0.25rem 0; color:#fff;">¿Eres estudiante del profesor este semestre?</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                            Los cursos cuentan con <strong>Vista Previa Gratuita</strong>. Ingresa el código que dio el profesor en clase para liberar todos los capítulos completos sin costo.
                        </p>
                    </div>
                    <div class="code-input-group">
                        <input type="text" id="student-code-input" class="code-input" placeholder="Ingresa la clave de clase..." />
                        <button class="btn btn-primary" onclick="canjearCodigoEstudiante()">Desbloquear Todo 🔓</button>
                    </div>
                </div>
            `;
        }
    }

    window.canjearCodigoEstudiante = function() {
        const input = document.getElementById('student-code-input');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        
        if (data.codigosEstudiantilesValidos.includes(code)) {
            isStudentUnlocked = true;
            localStorage.setItem('estudiante_desbloqueado', 'true');
            localStorage.setItem('physicsailab_unlocked_all', 'true');
            alert(`🎉 ¡Código ${code} válido!\n\nBienvenido(a). Todos los cursos y laboratorios han sido desbloqueados para ti sin costo durante este periodo académico.`);
            updateStudentBannerState();
            renderCourses();
        } else {
            alert('❌ Código no válido o expirado para este periodo académico. Consulta con tu profesor en clase.');
        }
    };

    window.bloquearModoEstudiante = function() {
        isStudentUnlocked = false;
        localStorage.removeItem('estudiante_desbloqueado');
        localStorage.removeItem('physicsailab_unlocked_all');
        updateStudentBannerState();
        renderCourses();
    };

    // 3. Renderizar Cursos (con modo compacto en móvil)
    let coursesExpanded = false;
    window.toggleCoursesExpansion = function() {
        coursesExpanded = !coursesExpanded;
        renderCourses();
        if (!coursesExpanded) {
            const el = document.getElementById('cursos');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    function renderCourses() {
        const coursesGrid = document.getElementById('courses-grid');
        const toggleContainer = document.getElementById('courses-toggle-controls');
        if (!coursesGrid) return;

        const isMobile = window.innerWidth <= 768;
        const total = data.cursos.length;
        const coursesToRender = (isMobile && !coursesExpanded) ? data.cursos.slice(0, 3) : data.cursos;

        coursesGrid.innerHTML = coursesToRender.map(c => {
            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const isSquash = c.id === 'squash_sim';
            const openBtnText = isStudentUnlocked
                ? (isLab ? 'Abrir Laboratorio 🚀' : (isSquash ? 'Abrir Simulador Completo 🎾' : 'Abrir Curso Completo 🎓'))
                : (isLab ? 'Vista Previa del Banco 👁️' : (isSquash ? 'Vista Previa de Rutinas 👁️' : 'Vista Previa Gratuita 👁️'));
            const buyBtnText = isLab ? 'Adquirir Lab 🛒' : (isSquash ? 'Adquirir Simulador 🛒' : 'Comprar Curso 🛒');
            const detailsBtnText = isLab ? 'Ficha Técnica 🔬' : (isSquash ? 'Módulos 📋' : 'Temario 📋');
            const tagClass = isLab ? 'lab-tag' : (c.destacado ? 'interactive' : '');
            const lockStatusBadge = isStudentUnlocked
                ? '<span class="unlocked-tag">🎓 Libre Estudiante</span>' 
                : `<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.12); color:var(--accent-amber); border-color:rgba(245,158,11,0.25);">👁️ Vista Previa</span>`;
            
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
                                ${!isStudentUnlocked && c.valorReal ? `<span style="text-decoration:line-through; font-size:0.75rem; color:var(--text-muted); margin-right:0.4rem;">${c.valorReal}</span>` : ''}
                                <span style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${isStudentUnlocked ? 'Gratis (Semestre Académico)' : c.precioEstimado}</span>
                            </div>
                            ${!isStudentUnlocked && c.descuentoTag ? `<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3);">${c.descuentoTag}</span>` : '<span style="color:var(--accent-emerald);">● Activo</span>'}
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">
                            ${isStudentUnlocked ? 'Acceso 100% completo activado' : (isSquash ? 'Demo con rutinas pre-generadas · Controles de edición bloqueados' : (isLab ? 'Banco de pruebas y teoría libres · Ensayos bloqueados' : 'Cap. 0 y 1 abiertos en demo · Resto con clave o compra'))}
                        </div>
                    </div>
                    <div class="card-actions">
                        ${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="btn btn-primary">${openBtnText}</a>` : ''}
                        ${!isStudentUnlocked && c.enlaceCompra ? `<button class="btn btn-secondary" onclick="openPaymentModal('${c.id}')" style="border-color:var(--accent-amber); color:var(--accent-amber);">${buyBtnText}</button>` : ''}
                        <button class="btn btn-secondary" onclick="openCourseDetails('${c.id}')">${detailsBtnText}</button>
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

    updateStudentBannerState();
    renderCourses();

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
    // 7. Renderizar Datos Fascinantes de la Física (con modo compacto en móvil)
    // ========================================================
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
        const filtered = f === 'all'
            ? data.datosCuriosos
            : data.datosCuriosos.filter(item => (item.categoriaTag || '').toLowerCase().includes(f));

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
