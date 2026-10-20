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

    // ========================================================
    // TELEMETRÍA EN TIEMPO REAL & PERFILES EN LA NUBE (FIREBASE)
    // ========================================================
    const FIREBASE_BASE = 'https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab';

    function getOrCreateStudentId() {
        let id = localStorage.getItem('physicsailab_student_id');
        if (!id) {
            id = 'std_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
            localStorage.setItem('physicsailab_student_id', id);
        }
        return id;
    }

    function getDeviceInfo() {
        const ua = navigator.userAgent || '';
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
        let os = 'PC / Escritorio';
        if (/Android/i.test(ua)) os = 'Android (Móvil)';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (Apple)';
        else if (/Windows/i.test(ua)) os = 'Windows (PC)';
        else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS (Mac)';
        else if (/Linux/i.test(ua)) os = 'Linux';
        return isMobile ? `📱 ${os}` : `💻 ${os}`;
    }

    function formatRelativeTime(isoStr) {
        if (!isoStr) return '---';
        try {
            const d = new Date(isoStr);
            const now = new Date();
            const diffMs = now - d;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMin / 60);
            const diffDays = Math.floor(diffHours / 24);

            const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            if (diffMin < 1) return 'Hace unos segundos 🟢';
            if (diffMin < 60) return `Hace ${diffMin} min (${timeStr})`;
            if (diffHours < 24) return `Hoy (${timeStr}) · Hace ${diffHours}h`;
            if (diffDays === 1) return `Ayer (${timeStr})`;
            return `${d.toLocaleDateString('es-ES')} (${timeStr})`;
        } catch(e) {
            return isoStr;
        }
    }

    function logRealActivity(action, type = 'general') {
        const profile = getStudentProfile();
        const studentId = getOrCreateStudentId();
        const isDocente = isAdmin();
        const isCustomized = profile && profile.name && profile.name !== 'Estudiante Universitario';

        const act = {
            id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            studentId: studentId,
            studentName: isDocente ? 'Mg. Manuel Obando (Docente)' : (isCustomized ? profile.name : 'Visitante en línea'),
            career: profile ? (profile.career || '') : '',
            institution: profile ? (profile.institution || '') : '',
            avatar: isDocente ? '👑' : (profile ? (profile.avatar || '👤') : '👤'),
            role: isDocente ? 'docente' : (isCustomized ? 'estudiante' : 'visitante'),
            device: getDeviceInfo(),
            action: action,
            type: type,
            timestamp: new Date().toISOString()
        };

        fetch(`${FIREBASE_BASE}/activity/${act.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(act)
        }).catch(() => {});
    }

    function touchStudentCloudProfile() {
        const profile = getStudentProfile();
        const isCustomized = profile && profile.name && profile.name !== 'Estudiante Universitario';
        if (!isCustomized) return;

        const studentId = getOrCreateStudentId();
        let visits = parseInt(localStorage.getItem('physicsailab_student_visit_count') || '1', 10) + 1;
        localStorage.setItem('physicsailab_student_visit_count', visits);

        fetch(`${FIREBASE_BASE}/profiles/${studentId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastActive: new Date().toISOString(),
                totalVisits: visits,
                device: getDeviceInfo(),
                enrolledCourses: getUnlockedCourses()
            })
        }).catch(() => {});
    }

    function syncStudentProfileToCloud(profile) {
        const studentId = getOrCreateStudentId();
        const unlockedIds = getUnlockedCourses();
        const savedComicIds = getSavedComics();
        const savedPodcastsList = getSavedPodcasts();
        const atomLikesState = getAtomLikesState();
        const likedItemIds = Object.keys(atomLikesState).filter(k => atomLikesState[k]?.liked);
        let visits = parseInt(localStorage.getItem('physicsailab_student_visit_count') || '1', 10);

        const cloudData = {
            id: studentId,
            name: profile.name || 'Estudiante Universitario',
            career: profile.career || 'Física / Ingeniería',
            institution: profile.institution || 'Universidad del Cauca',
            avatar: profile.avatar || '⚛️',
            createdAt: profile.created || new Date().toISOString(),
            lastActive: new Date().toISOString(),
            enrolledCourses: unlockedIds,
            savedComicsCount: savedComicIds.length,
            savedPodcastsCount: savedPodcastsList.length,
            totalLikes: likedItemIds.length,
            device: getDeviceInfo(),
            totalVisits: visits,
            updatedAt: new Date().toISOString()
        };

        fetch(`${FIREBASE_BASE}/profiles/${studentId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudData)
        }).catch(() => {});

        logRealActivity(`Guardó/actualizó su perfil de estudiante: ${profile.name}`, 'profile_save');
    }

    function recordRealVisit() {
        const isSessionActive = sessionStorage.getItem('physicsailab_session_active');
        fetch(`${FIREBASE_BASE}/counters.json`)
            .then(res => res.json())
            .then(c => {
                let realVisits = (c && typeof c.real_visits === 'number') ? c.real_visits : 14;
                let realDownloads = (c && typeof c.real_downloads === 'number') ? c.real_downloads : 6;

                if (!isSessionActive) {
                    sessionStorage.setItem('physicsailab_session_active', '1');
                    realVisits += 1;
                    fetch(`${FIREBASE_BASE}/counters.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            real_visits: realVisits,
                            last_visit: new Date().toISOString()
                        })
                    }).catch(() => {});

                    logRealActivity('Visita a la portada principal', 'visit');
                    touchStudentCloudProfile();
                }

                localStorage.setItem('physicsailab_real_visits', realVisits);
                localStorage.setItem('physicsailab_real_downloads', realDownloads);
                updateVisitsDisplay(BASE_VISITS + realVisits);
                updateDownloadsDisplay(BASE_DOWNLOADS + realDownloads);
            })
            .catch(() => {
                let realVisits = parseInt(localStorage.getItem('physicsailab_real_visits') || '14', 10);
                let realDownloads = parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10);
                if (!isSessionActive) {
                    sessionStorage.setItem('physicsailab_session_active', '1');
                    realVisits += 1;
                    localStorage.setItem('physicsailab_real_visits', realVisits);
                }
                updateVisitsDisplay(BASE_VISITS + realVisits);
                updateDownloadsDisplay(BASE_DOWNLOADS + realDownloads);
            });
    }

    function recordRealDownload(itemTitle = 'Material Académico') {
        fetch(`${FIREBASE_BASE}/counters.json`)
            .then(res => res.json())
            .then(c => {
                let realDownloads = (c && typeof c.real_downloads === 'number') ? c.real_downloads : 6;
                realDownloads += 1;
                fetch(`${FIREBASE_BASE}/counters.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        real_downloads: realDownloads,
                        last_download: new Date().toISOString()
                    })
                }).catch(() => {});

                localStorage.setItem('physicsailab_real_downloads', realDownloads);
                updateDownloadsDisplay(BASE_DOWNLOADS + realDownloads);
                logRealActivity(`Descargó: ${itemTitle}`, 'download');
            })
            .catch(() => {
                let realDownloads = parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10) + 1;
                localStorage.setItem('physicsailab_real_downloads', realDownloads);
                updateDownloadsDisplay(BASE_DOWNLOADS + realDownloads);
            });
    }

    // Rastreo automático de acceso a cursos interactivos y simuladores
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        if (href.includes('/cursos/') || href.includes('torneos-squash') || href.includes('garmin')) {
            const rawText = (link.textContent || '').trim().replace(/[\r\n\t]+/g, ' ');
            const title = link.getAttribute('title') || rawText || href;
            logRealActivity(`Abrió contenido interactivo: ${title}`, 'course_view');
        }
    });

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

    const observedSections = ['inicio', 'curiosidades', 'cursos', 'comics', 'podcasts', 'articulos', 'profesor', 'comentarios'];
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

    // Inicializar Visitas Reales y Métricas Públicas Persistentes
    recordRealVisit();

    // Inicializar Descargas
    let initialRealDownloads = parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10);
    updateDownloadsDisplay(BASE_DOWNLOADS + initialRealDownloads);

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
        recordRealDownload(itemTitle);
        showToast(`📥 Descarga iniciada: <strong>${itemTitle}</strong>. ¡Gracias por apoyar la divulgación científica abierta!`);
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

    // ========================================================
    // PERFIL DEL ESTUDIANTE Y ESPACIO PERSONAL
    // ========================================================
    function getStudentProfile() {
        try {
            const raw = localStorage.getItem('physicsailab_student_profile');
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return {
            name: 'Estudiante Universitario',
            career: 'Física / Ingeniería',
            institution: 'Universidad del Cauca',
            avatar: '⚛️',
            created: new Date().toISOString()
        };
    }

    function saveStudentProfile(profile) {
        localStorage.setItem('physicsailab_student_profile', JSON.stringify(profile));
        updateProfileNavDisplay();
        syncStudentProfileToCloud(profile);
    }

    function updateProfileNavDisplay() {
        const profile = getStudentProfile();
        const avatarEl = document.getElementById('nav-profile-avatar');
        const labelEl = document.getElementById('nav-profile-label');
        if (avatarEl) avatarEl.textContent = profile.avatar || '👤';
        if (labelEl) {
            const firstName = (profile.name || '').trim().split(' ')[0] || 'Mi Espacio';
            labelEl.textContent = firstName.length > 12 ? 'Mi Espacio' : firstName;
        }
    }

    // ========================================================
    // LIMPIEZA Y ENCODING SEGURO DE URLs DE PDFs (CÓMICS)
    // ========================================================
    function cleanPdfUrl(path) {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const parts = path.split('/').map(part => {
            try {
                return encodeURIComponent(decodeURIComponent(part));
            } catch (e) {
                return encodeURIComponent(part);
            }
        });
        return parts.join('/');
    }
    window.cleanPdfUrl = cleanPdfUrl;

    // ========================================================
    // VISOR MODAL DE CÓMICS (LECTOR MULTIDISPOSITIVO CON PDF.JS)
    // ========================================================
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    let currentViewerComic = null;
    let currentViewerMode = 'canvas'; // 'canvas' | 'google' | 'direct'
    let currentPdfDoc = null;
    let currentPdfPage = 1;
    let currentPdfScale = 1.0;
    let isPdfRendering = false;
    let pageRenderingQueue = null;

    function renderPdfPage(pageNum) {
        if (!currentPdfDoc) return;
        isPdfRendering = true;

        currentPdfDoc.getPage(pageNum).then(page => {
            const canvas = document.getElementById('comic-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            const wrapper = document.getElementById('comic-canvas-wrapper');
            const containerWidth = wrapper ? Math.max(300, wrapper.clientWidth - 32) : 800;

            const unscaledViewport = page.getViewport({ scale: 1.0 });
            let fitScale = (containerWidth > 0 && unscaledViewport.width > 0) ? (containerWidth / unscaledViewport.width) : 1.0;
            if (fitScale > 2.0) fitScale = 2.0;
            if (fitScale < 0.5) fitScale = 0.5;

            const appliedScale = fitScale * currentPdfScale;
            const viewport = page.getViewport({ scale: appliedScale });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);
            renderTask.promise.then(() => {
                isPdfRendering = false;
                if (pageRenderingQueue !== null) {
                    renderPdfPage(pageRenderingQueue);
                    pageRenderingQueue = null;
                }
                const spinner = document.getElementById('comic-loading-spinner');
                if (spinner) spinner.classList.add('hidden');
            }).catch(err => {
                isPdfRendering = false;
            });
        }).catch(err => {
            console.error('Error al cargar página PDF:', err);
            isPdfRendering = false;
        });

        // Actualizar contadores y estados de botones
        const curEl = document.getElementById('comic-current-page');
        if (curEl) curEl.textContent = pageNum;

        const prevBtn = document.getElementById('comic-prev-btn');
        const nextBtn = document.getElementById('comic-next-btn');
        if (prevBtn) prevBtn.disabled = (pageNum <= 1);
        if (nextBtn) nextBtn.disabled = (currentPdfDoc ? pageNum >= currentPdfDoc.numPages : false);
    }

    function queueRenderPage(num) {
        if (isPdfRendering) {
            pageRenderingQueue = num;
        } else {
            renderPdfPage(num);
        }
    }

    window.prevComicPage = function() {
        if (!currentPdfDoc || currentPdfPage <= 1) return;
        currentPdfPage--;
        queueRenderPage(currentPdfPage);
        const wrapper = document.getElementById('comic-canvas-wrapper');
        if (wrapper) wrapper.scrollTop = 0;
    };

    window.nextComicPage = function() {
        if (!currentPdfDoc || currentPdfPage >= currentPdfDoc.numPages) return;
        currentPdfPage++;
        queueRenderPage(currentPdfPage);
        const wrapper = document.getElementById('comic-canvas-wrapper');
        if (wrapper) wrapper.scrollTop = 0;
    };

    window.changeComicZoom = function(delta) {
        currentPdfScale = Math.max(0.6, Math.min(2.5, currentPdfScale + delta));
        const label = document.getElementById('comic-zoom-display');
        if (label) label.textContent = Math.round(currentPdfScale * 100) + '%';
        queueRenderPage(currentPdfPage);
    };

    window.resetComicZoom = function() {
        currentPdfScale = 1.0;
        const label = document.getElementById('comic-zoom-display');
        if (label) label.textContent = '100%';
        queueRenderPage(currentPdfPage);
    };

    window.openComicViewer = function(comicId, preferredMode) {
        const comic = (data.comics || []).find(c => String(c.id) === String(comicId));
        if (!comic) {
            showToast('⚠️ No se encontró la información del cómic.');
            return;
        }

        currentViewerComic = comic;

        // Por defecto usar Lector Canvas si PDF.js está disponible; de lo contrario fallback a Google Docs
        if (preferredMode) {
            currentViewerMode = preferredMode;
        } else {
            currentViewerMode = window.pdfjsLib ? 'canvas' : 'google';
        }

        const modal = document.getElementById('comic-viewer-modal');
        const titleEl = document.getElementById('comic-viewer-title');
        const subtitleEl = document.getElementById('comic-viewer-subtitle');
        const downloadBtn = document.getElementById('comic-viewer-download-btn');
        const iframe = document.getElementById('comic-viewer-iframe');
        const canvasContainer = document.getElementById('comic-canvas-container');
        const spinner = document.getElementById('comic-loading-spinner');
        const spinnerText = document.querySelector('.comic-spinner-text');
        const spinnerDetail = document.getElementById('comic-spinner-subtext');
        const modeIndicator = document.getElementById('comic-viewer-mode-indicator');
        const toggleBtn = document.getElementById('comic-viewer-toggle-btn');

        if (!modal) return;

        if (titleEl) titleEl.textContent = comic.titulo;
        if (subtitleEl) subtitleEl.textContent = `🎨 ${comic.categoria} · ✍️ ${comic.autores}`;

        const cleanPath = cleanPdfUrl(comic.archivo);
        const hostOrigin = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
            ? 'https://www.physicsailab.com'
            : window.location.origin;
        const fullAbsUrl = cleanPath.startsWith('http') ? cleanPath : (hostOrigin + (cleanPath.startsWith('/') ? '' : '/') + cleanPath);

        const safeFilename = (comic.titulo || 'comic').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '').trim().replace(/\s+/g, '_') + '.pdf';

        if (downloadBtn) {
            downloadBtn.href = cleanPath;
            downloadBtn.setAttribute('download', safeFilename);
            downloadBtn.onclick = () => trackDownload(comic.titulo);
        }

        if (spinner) {
            spinner.classList.remove('hidden');
            if (spinnerText) spinnerText.textContent = 'Cargando cómic optimizado...';
            if (spinnerDetail) spinnerDetail.textContent = 'Descarga ultraliviana para lectura inmediata';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (currentViewerMode === 'canvas' && window.pdfjsLib) {
            if (canvasContainer) canvasContainer.style.display = 'flex';
            if (iframe) {
                iframe.style.display = 'none';
                iframe.src = 'about:blank';
            }
            if (modeIndicator) modeIndicator.textContent = 'Modo: Lector Interactivo (Páginas) ⚡';
            if (toggleBtn) toggleBtn.innerHTML = '☁️ Ver en Google Docs';

            currentPdfPage = 1;
            currentPdfScale = 1.0;
            const zoomLabel = document.getElementById('comic-zoom-display');
            if (zoomLabel) zoomLabel.textContent = '100%';

            pdfjsLib.getDocument(cleanPath).promise.then(pdfDoc => {
                currentPdfDoc = pdfDoc;
                const totalEl = document.getElementById('comic-total-pages');
                if (totalEl) totalEl.textContent = pdfDoc.numPages;
                renderPdfPage(1);
            }).catch(err => {
                console.warn('PDF.js falló, cambiando automáticamente a Google Docs:', err);
                window.openComicViewer(comic.id, 'google');
            });

        } else if (currentViewerMode === 'google') {
            if (canvasContainer) canvasContainer.style.display = 'none';
            if (iframe) {
                iframe.style.display = 'block';
                iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(fullAbsUrl)}&embedded=true`;
                iframe.onload = () => {
                    if (spinner) spinner.classList.add('hidden');
                };
            }
            if (modeIndicator) modeIndicator.textContent = 'Modo: Visor Nube (Google Docs) ☁️';
            if (toggleBtn) toggleBtn.innerHTML = '🖥️ Visor Directo';

            setTimeout(() => {
                if (spinner) spinner.classList.add('hidden');
            }, 3500);

        } else {
            // Modo Directo
            if (canvasContainer) canvasContainer.style.display = 'none';
            if (iframe) {
                iframe.style.display = 'block';
                iframe.src = `${cleanPath}#toolbar=1&navpanes=0&view=FitH`;
                iframe.onload = () => {
                    if (spinner) spinner.classList.add('hidden');
                };
            }
            if (modeIndicator) modeIndicator.textContent = 'Modo: Visor Nativo / Directo 🖥️';
            if (toggleBtn) toggleBtn.innerHTML = '⚡ Lector Interactivo';

            setTimeout(() => {
                if (spinner) spinner.classList.add('hidden');
            }, 2500);
        }

        // Registrar analítica
        trackDownload(comic.titulo);
    };

    window.closeComicViewer = function() {
        const modal = document.getElementById('comic-viewer-modal');
        const iframe = document.getElementById('comic-viewer-iframe');
        if (modal) modal.classList.remove('active');
        if (iframe) iframe.src = 'about:blank';
        currentPdfDoc = null;
        document.body.style.overflow = '';
    };

    window.toggleComicViewerMode = function() {
        if (!currentViewerComic) return;
        let nextMode = 'canvas';
        if (currentViewerMode === 'canvas') {
            nextMode = 'google';
        } else if (currentViewerMode === 'google') {
            nextMode = 'direct';
        } else {
            nextMode = window.pdfjsLib ? 'canvas' : 'google';
        }
        window.openComicViewer(currentViewerComic.id, nextMode);
    };

    // Gestos táctiles Swipe en celulares para pasar páginas en modo canvas
    const canvasWrapper = document.getElementById('comic-canvas-wrapper');
    if (canvasWrapper) {
        let touchStartX = 0;
        canvasWrapper.addEventListener('touchstart', e => {
            if (e.touches && e.touches.length > 0) {
                touchStartX = e.touches[0].screenX;
            }
        }, { passive: true });

        canvasWrapper.addEventListener('touchend', e => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touchEndX = e.changedTouches[0].screenX;
                const diff = touchEndX - touchStartX;
                if (Math.abs(diff) > 55) {
                    if (diff < 0) window.nextComicPage();
                    else window.prevComicPage();
                }
            }
        }, { passive: true });
    }

    // Escuchar clics en el backdrop y tecla Escape para cerrar el visor de cómic, o flechas para pasar página
    const comicModalEl = document.getElementById('comic-viewer-modal');
    if (comicModalEl) {
        comicModalEl.addEventListener('click', (e) => {
            if (e.target === comicModalEl) {
                window.closeComicViewer();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        const m = document.getElementById('comic-viewer-modal');
        if (m && m.classList.contains('active')) {
            if (e.key === 'Escape') {
                window.closeComicViewer();
            } else if (e.key === 'ArrowRight') {
                window.nextComicPage();
            } else if (e.key === 'ArrowLeft') {
                window.prevComicPage();
            }
        }
    });

    // ========================================================
    // MARCADORES Y FAVORITOS (CÓMICS Y PODCASTS GUARDADOS)
    // ========================================================
    function normalizeComicId(id) {
        if (!id) return '';
        const s = String(id).trim();
        return s.startsWith('com-') ? s : ('com-' + s);
    }

    function getSavedComics() {
        try {
            const raw = JSON.parse(localStorage.getItem('physicsailab_saved_comics') || '[]');
            if (!Array.isArray(raw)) return [];
            return raw
                .filter(id => id !== null && id !== undefined && id !== '' && String(id) !== 'NaN')
                .map(id => normalizeComicId(id));
        } catch(e) {
            return [];
        }
    }

    window.toggleSaveComic = function(comicId, event) {
        if (event) event.stopPropagation();
        if (!comicId) return;
        const normId = normalizeComicId(comicId);
        let saved = getSavedComics();
        const exists = saved.includes(normId);
        if (exists) {
            saved = saved.filter(id => id !== normId);
            localStorage.setItem('physicsailab_saved_comics', JSON.stringify(saved));
            showToast('🔖 Cómic removido de tus guardados.');
        } else {
            saved.push(normId);
            localStorage.setItem('physicsailab_saved_comics', JSON.stringify(saved));
            showToast('🔖 ¡Cómic guardado en tu perfil para leer después! <a href="javascript:void(0)" onclick="openStudentProfileModal(\'comics\')" style="color:#38BDF8; font-weight:700; margin-left:6px; text-decoration:underline;">Ver en mi perfil ➔</a>');
        }
        renderComics(currentComicCategory);
        updateProfileNavDisplay();
        const modal = document.getElementById('student-profile-modal');
        if (modal && modal.classList.contains('active')) {
            renderStudentProfileBody('comics');
        }
    };

    function getSavedPodcasts() {
        try {
            return JSON.parse(localStorage.getItem('physicsailab_saved_podcasts') || '[]');
        } catch(e) {
            return [];
        }
    }

    window.toggleSavePodcast = function(podId, event) {
        if (event) event.stopPropagation();
        let saved = getSavedPodcasts();
        const exists = saved.includes(podId);
        if (exists) {
            saved = saved.filter(id => id !== podId);
            localStorage.setItem('physicsailab_saved_podcasts', JSON.stringify(saved));
            showToast('🎙️ Podcast removido de tus guardados.');
        } else {
            saved.push(podId);
            localStorage.setItem('physicsailab_saved_podcasts', JSON.stringify(saved));
            showToast('🎙️ ¡Podcast guardado en tu perfil para escuchar después!');
        }
        renderSpotifyChannels();
        if (typeof renderLocalPodcasts === 'function') renderLocalPodcasts();
        updateProfileNavDisplay();
        const modal = document.getElementById('student-profile-modal');
        if (modal && modal.classList.contains('active')) {
            renderStudentProfileBody('podcasts');
        }
    };

    // ========================================================
    // ÁTOMO DE ME GUSTA (⚛️ LIKE SYSTEM)
    // ========================================================
    function getBaseAtomLikes(itemId) {
        let hash = 0;
        const str = String(itemId);
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return 18 + (Math.abs(hash) % 36);
    }

    function getAtomLikesState() {
        try {
            return JSON.parse(localStorage.getItem('physicsailab_atom_likes') || '{}');
        } catch(e) {
            return {};
        }
    }

    function getItemLikeInfo(itemId) {
        const state = getAtomLikesState();
        const base = getBaseAtomLikes(itemId);
        const itemState = state[itemId] || { liked: false, delta: 0 };
        return {
            liked: !!itemState.liked,
            count: base + (itemState.delta || 0)
        };
    }

    window.toggleAtomLike = function(itemId, itemType, btnElem) {
        const state = getAtomLikesState();
        const current = state[itemId] || { liked: false, delta: 0 };
        const newLiked = !current.liked;
        const newDelta = newLiked ? (current.delta || 0) + 1 : Math.max(0, (current.delta || 0) - 1);

        state[itemId] = {
            liked: newLiked,
            delta: newDelta,
            type: itemType || 'general',
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('physicsailab_atom_likes', JSON.stringify(state));

        const base = getBaseAtomLikes(itemId);
        const finalCount = base + newDelta;

        if (newLiked) {
            showToast('⚛️ ¡Has impulsado este contenido con un átomo de energía!');
        }

        const buttons = document.querySelectorAll(`[data-atom-id="${itemId}"]`);
        buttons.forEach(btn => {
            btn.classList.toggle('liked', newLiked);
            const countSpan = btn.querySelector('.atom-count');
            if (countSpan) countSpan.textContent = finalCount;
            if (newLiked) {
                const icon = btn.querySelector('.atom-icon');
                if (icon) {
                    icon.style.animation = 'none';
                    icon.offsetHeight;
                    icon.style.animation = 'atom-quantum-spin 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }
            }
        });

        const modal = document.getElementById('student-profile-modal');
        if (modal && modal.classList.contains('active')) {
            renderStudentProfileBody('likes');
        }
    };

    // ========================================================
    // ZONA PRIORITARIA DE CURSOS INSCRITOS (ESTUDIANTE)
    // ========================================================
    window.renderEnrolledCourses = function() {
        const section = document.getElementById('mis-cursos');
        const container = document.getElementById('my-enrolled-courses-container');
        const quickChip = document.getElementById('quick-chip-my-courses');
        const drawerItem = document.getElementById('drawer-my-courses-item');
        const drawerLabel = document.getElementById('drawer-my-courses-label');
        if (!container || !section) return;

        const unlockedIds = getUnlockedCourses();
        const adminMode = isAdmin();

        let enrolledCourses = [];
        if (adminMode) {
            enrolledCourses = data.cursos || [];
        } else if (unlockedIds.length > 0) {
            enrolledCourses = (data.cursos || []).filter(c => unlockedIds.includes(c.id));
        }

        const count = enrolledCourses.length;

        // Actualizar chips de acceso rápido
        if (quickChip) {
            if (count > 0) {
                quickChip.style.display = 'inline-flex';
                quickChip.textContent = `🎓 Mis Cursos (${count})`;
            } else {
                quickChip.style.display = 'none';
            }
        }

        // Actualizar drawer móvil
        if (drawerItem) {
            if (count > 0) {
                drawerItem.style.display = 'block';
                if (drawerLabel) drawerLabel.textContent = `Mis Cursos Inscritos (${count})`;
            } else {
                drawerItem.style.display = 'none';
            }
        }

        if (count === 0) {
            section.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = `
            <div class="enrolled-shelf-header">
                <div>
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.35rem;">
                        <span class="unlocked-tag" style="background:rgba(16,185,129,0.22); border-color:rgba(16,185,129,0.5);">
                            🎓 Tus Materias Inscritas · Periodo 2026
                        </span>
                        <span style="font-size:0.75rem; color:#34D399; font-weight:700;">
                            ● ${count} ${count === 1 ? 'materia activa' : 'materias activas'} sin necesidad de buscar abajo
                        </span>
                    </div>
                    <h3 style="color:#fff; font-size:1.35rem; margin:0 0 0.25rem 0;">Acceso Directo a tus Cursos y Laboratorios</h3>
                    <p style="font-size:0.83rem; color:var(--text-muted); margin:0;">
                        ${adminMode ? '👑 Modo Administrador: tienes acceso completo a todos los cursos y bancos de prueba.' : 'Aquí tienes acceso inmediato a los simuladores de tus materias desbloqueadas.'}
                    </p>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                    <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem; border-color:rgba(56,189,248,0.4); color:var(--accent-blue);" onclick="openStudentProfileModal('courses')">
                        👤 Ver en Mi Espacio
                    </button>
                    ${!adminMode ? `
                    <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="abrirCanjeadorRapido()">
                        🔑 Canjear otra materia
                    </button>
                    ` : ''}
                </div>
            </div>

            <div class="enrolled-grid">
                ${enrolledCourses.map(c => {
                    const isLab = c.id === 'transformadores' || c.esLaboratorio;
                    const likeInfo = getItemLikeInfo('curso-' + c.id);
                    return `
                    <div class="enrolled-card">
                        <div>
                            <div class="enrolled-card-header">
                                <span class="card-tag ${isLab ? 'lab-tag' : 'interactive'}">${c.categoria}</span>
                                <span style="font-size:0.72rem; color:#34D399; font-weight:700; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); padding:0.15rem 0.45rem; border-radius:9999px;">
                                    ● Activo
                                </span>
                            </div>
                            <h4 class="enrolled-card-title">${c.titulo}</h4>
                            <p class="enrolled-card-desc">${c.descripcion.length > 120 ? c.descripcion.substring(0, 117) + '...' : c.descripcion}</p>
                            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
                                <strong>Módulos:</strong> <span style="color:var(--accent-indigo);">${c.modulos}</span>
                            </div>
                        </div>

                        <div class="enrolled-card-actions">
                            ${c.demoPath ? `
                            <a href="${c.demoPath}" target="_blank" class="btn-open-enrolled" title="Abrir simulador directo de ${c.titulo}">
                                <span>Abrir Curso Directo 🚀</span>
                            </a>
                            ` : ''}
                            <button class="btn btn-secondary" onclick="openCourseDetails('${c.id}')" style="font-size:0.8rem; padding:0.4rem 0.7rem;" title="Ver temario completo">
                                Temario 📋
                            </button>
                            <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="curso-${c.id}" onclick="toggleAtomLike('curso-${c.id}', 'curso', this)" title="Dar un átomo de me gusta">
                                <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    };

    // ========================================================
    // MODAL DE PERFIL DEL ESTUDIANTE Y GUARDADOS
    // ========================================================
    let currentProfileTab = 'courses';

    window.openStudentProfileModal = function(initialTab = 'courses') {
        currentProfileTab = initialTab;
        const modal = document.getElementById('student-profile-modal');
        if (!modal) return;
        renderStudentProfileBody(initialTab);
        modal.classList.add('active');
    };

    window.closeStudentProfileModal = function() {
        const modal = document.getElementById('student-profile-modal');
        if (modal) modal.classList.remove('active');
    };

    window.switchProfileTab = function(tabId) {
        currentProfileTab = tabId;
        renderStudentProfileBody(tabId);
    };

    function renderProfileCoursesTab(enrolledCourses) {
        if (!enrolledCourses || enrolledCourses.length === 0) {
            return `
                <div style="text-align:center; padding:2.5rem 1rem; background:rgba(255,255,255,0.02); border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
                    <div style="font-size:2.5rem; margin-bottom:0.75rem;">🎓</div>
                    <h3 style="color:#fff; margin-bottom:0.5rem;">Aún no tienes cursos inscritos</h3>
                    <p style="color:var(--text-muted); font-size:0.88rem; max-width:480px; margin:0 auto 1.25rem;">
                        Si eres estudiante del Mg. Manuel Alejandro Obando este semestre, canjea el código exclusivo de tu materia para desbloquearla gratis y tenerla aquí a la mano.
                    </p>
                    <button class="btn btn-primary" onclick="closeStudentProfileModal(); abrirCanjeadorRapido();">
                        Ingresar Clave de Clase 🔑
                    </button>
                </div>
            `;
        }

        return `
            <div class="saved-items-grid">
                ${enrolledCourses.map(c => `
                    <div class="saved-card" style="border-left:3px solid #10B981;">
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                <span class="card-tag interactive" style="font-size:0.7rem;">${c.categoria}</span>
                                <span style="font-size:0.7rem; color:#34D399; font-weight:700;">● Inscrito</span>
                            </div>
                            <h4 style="font-size:1.05rem; margin:0 0 0.35rem 0; color:#fff;">${c.titulo}</h4>
                            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.75rem;">${c.descripcion.substring(0, 95)}...</p>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto;">
                            ${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center; font-size:0.82rem; padding:0.45rem;">Abrir Curso 🚀</a>` : ''}
                            <button class="btn btn-secondary" onclick="closeStudentProfileModal(); openCourseDetails('${c.id}');" style="font-size:0.82rem; padding:0.45rem 0.75rem;">Temario</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderProfileComicsTab(savedComicIds) {
        const normSaved = (savedComicIds || []).map(normalizeComicId);
        const savedList = (data.comics || []).filter(c => normSaved.includes(normalizeComicId(c.id)));
        if (savedList.length === 0) {
            return `
                <div style="text-align:center; padding:2.5rem 1rem; background:rgba(255,255,255,0.02); border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
                    <div style="font-size:2.5rem; margin-bottom:0.75rem;">🎨</div>
                    <h3 style="color:#fff; margin-bottom:0.5rem;">No tienes cómics guardados</h3>
                    <p style="color:var(--text-muted); font-size:0.88rem; max-width:480px; margin:0 auto 1.25rem;">
                        Explora la galería de 56 cómics creados por estudiantes de física y presiona <strong>🔖 Guardar</strong> en cualquiera para armar tu biblioteca personal de lectura.
                    </p>
                    <button class="btn btn-secondary" onclick="closeStudentProfileModal(); location.href='#comics';">
                        Explorar Cómics Estudiantiles 🎨
                    </button>
                </div>
            `;
        }

        return `
            <div class="saved-items-grid">
                ${savedList.map(c => {
                    const cleanUrl = cleanPdfUrl(c.archivo);
                    const safeDownloadName = (c.titulo || 'comic').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '').trim().replace(/\s+/g, '_') + '.pdf';
                    return `
                    <div class="saved-card">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <span class="comic-cover-badge" style="position:static; font-size:0.7rem; padding:0.2rem 0.5rem;">🎨 ${c.categoria}</span>
                                <button onclick="toggleSaveComic('${c.id}', event)" title="Quitar de guardados" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem;">✕ Quitar</button>
                            </div>
                            <h4 style="font-size:1.05rem; margin:0 0 0.35rem 0; color:#fff; cursor:pointer;" onclick="openComicViewer('${c.id}')" title="Abrir lector interactivo">${c.titulo}</h4>
                            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;">✍️ ${c.autores}</div>
                            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.75rem;">${c.descripcion.substring(0, 95)}...</p>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto;">
                            <button onclick="openComicViewer('${c.id}')" class="btn btn-primary" style="flex:1; justify-content:center; font-size:0.82rem; padding:0.45rem;">Leer Cómic 📖</button>
                            <a href="${cleanUrl}" download="${safeDownloadName}" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.75rem;" title="Descargar PDF">⬇️</a>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderProfilePodcastsTab(savedPodcastsList) {
        const savedSpotify = (data.canalesSpotify || []).filter(sp => savedPodcastsList.includes(sp.id));
        const savedLocals = (data.podcasts || []).filter((p, idx) => savedPodcastsList.includes('podcast-local-' + idx));

        if (savedSpotify.length === 0 && savedLocals.length === 0) {
            return `
                <div style="text-align:center; padding:2.5rem 1rem; background:rgba(255,255,255,0.02); border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
                    <div style="font-size:2.5rem; margin-bottom:0.75rem;">🎙️</div>
                    <h3 style="color:#fff; margin-bottom:0.5rem;">No tienes podcasts guardados</h3>
                    <p style="color:var(--text-muted); font-size:0.88rem; max-width:480px; margin:0 auto 1.25rem;">
                        Guarda los canales oficiales en Spotify o los episodios universitarios pulsando <strong>🔖 Guardar</strong> para escucharlos más tarde mientras estudias.
                    </p>
                    <button class="btn btn-secondary" onclick="closeStudentProfileModal(); location.href='#podcasts';">
                        Explorar Canales de Spotify 🎙️
                    </button>
                </div>
            `;
        }

        return `
            <div class="saved-items-grid">
                ${savedSpotify.map(sp => `
                    <div class="saved-card" style="border-left:3px solid #1DB954;">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <span style="font-size:0.7rem; color:#1DB954; font-weight:700;">🟢 Spotify · ${sp.curso}</span>
                                <button onclick="toggleSavePodcast('${sp.id}', event)" title="Quitar de guardados" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem;">✕ Quitar</button>
                            </div>
                            <h4 style="font-size:1.05rem; margin:0 0 0.35rem 0; color:#fff;">${sp.titulo}</h4>
                            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;">🎙️ ${sp.autor}</div>
                            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.75rem;">${sp.descripcion.substring(0, 95)}...</p>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto;">
                            <a href="${sp.url}" target="_blank" class="btn btn-spotify" style="flex:1; justify-content:center; font-size:0.82rem; padding:0.45rem;">Abrir Spotify 🎧</a>
                        </div>
                    </div>
                `).join('')}

                ${savedLocals.map((p, idx) => `
                    <div class="saved-card">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <span class="card-tag" style="font-size:0.7rem;">${p.categoria}</span>
                                <button onclick="toggleSavePodcast('podcast-local-${idx}', event)" title="Quitar de guardados" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem;">✕ Quitar</button>
                            </div>
                            <h4 style="font-size:1.05rem; margin:0 0 0.35rem 0; color:#fff;">${p.titulo}</h4>
                            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;">🎙️ ${p.creditos}</div>
                            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.75rem;">${p.descripcion.substring(0, 95)}...</p>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto;">
                            <button class="btn btn-primary" onclick="closeStudentProfileModal(); playPodcast('${p.archivo}', '${p.titulo.replace(/'/g, "\\'")}', '${p.categoria}');" style="flex:1; justify-content:center; font-size:0.82rem; padding:0.45rem;">Reproducir ▶️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderProfileLikesTab(likedItemIds) {
        if (!likedItemIds || likedItemIds.length === 0) {
            return `
                <div style="text-align:center; padding:2.5rem 1rem; background:rgba(255,255,255,0.02); border-radius:14px; border:1px dashed rgba(255,255,255,0.12);">
                    <div style="font-size:2.5rem; margin-bottom:0.75rem;">⚛️</div>
                    <h3 style="color:#fff; margin-bottom:0.5rem;">Aún no has impulsado contenidos con átomos</h3>
                    <p style="color:var(--text-muted); font-size:0.88rem; max-width:480px; margin:0 auto 1.25rem;">
                        Presiona el botón cuántico <strong>⚛️</strong> en cualquier curso, cómic, podcast, dato curioso o artículo de squash para dejar tu huella y verlos listados aquí.
                    </p>
                </div>
            `;
        }

        return `
            <div class="saved-items-grid">
                ${likedItemIds.map(id => {
                    const likeInfo = getItemLikeInfo(id);
                    let label = id;
                    let typeBadge = '⚛️ Contenido';
                    if (id.startsWith('curso-')) {
                        const c = (data.cursos || []).find(x => 'curso-' + x.id === id);
                        if (c) label = c.titulo;
                        typeBadge = '🚀 Curso';
                    } else if (id.startsWith('comic-')) {
                        const c = (data.comics || []).find(x => 'comic-' + x.id === id);
                        if (c) label = c.titulo;
                        typeBadge = '🎨 Cómic';
                    } else if (id.startsWith('spotify-')) {
                        const sp = (data.canalesSpotify || []).find(x => 'spotify-' + x.id === id);
                        if (sp) label = sp.titulo;
                        typeBadge = '🎙️ Spotify';
                    } else if (id.startsWith('fact-')) {
                        const f = (data.datosCuriosos || []).find(x => 'fact-' + x.id === id);
                        if (f) label = f.titulo;
                        typeBadge = '💡 Curiosidad';
                    } else if (id.startsWith('squash-')) {
                        const s = (data.articulosSquash || []).find(x => 'squash-' + x.id === id);
                        if (s) label = s.titulo;
                        typeBadge = '🎾 Squash';
                    }
                    return `
                        <div class="saved-card" style="border-left:3px solid #38BDF8;">
                            <div>
                                <span class="badge" style="font-size:0.68rem; margin-bottom:0.5rem; background:rgba(56,189,248,0.12); color:#38BDF8; border-color:rgba(56,189,248,0.3);">${typeBadge}</span>
                                <h4 style="font-size:1rem; margin:0 0 0.5rem 0; color:#fff;">${label}</h4>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.5rem;">
                                <span style="font-size:0.75rem; color:var(--text-muted);">Tu voto está activo</span>
                                <button class="atom-like-btn liked" data-atom-id="${id}" onclick="toggleAtomLike('${id}', 'saved', this)">
                                    <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderProfileEditTab(profile) {
        const avatars = ['⚛️', '🔬', '🚀', '🧠', '⚡', '🌌', '🎾', '📚', '📐', '💻', '🔋', '🔭'];
        return `
            <div style="max-width:560px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.5rem;">
                <h3 style="color:#fff; font-size:1.2rem; margin:0 0 1rem 0;">Configuración de tu Perfil Estudiantil</h3>

                <div class="payment-form-group">
                    <label style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase; font-weight:700;">Selecciona tu Avatar Científico:</label>
                    <div class="avatar-selector-grid">
                        ${avatars.map(av => `
                            <button type="button" class="avatar-option-btn ${profile.avatar === av ? 'selected' : ''}" onclick="selectStudentAvatar('${av}', this)">
                                ${av}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="payment-form-group">
                    <label style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase; font-weight:700;">Nombre Completo:</label>
                    <input type="text" id="edit-profile-name" class="payment-form-input" value="${(profile.name || '').replace(/"/g, '&quot;')}" placeholder="Tu nombre..." />
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                    <div class="payment-form-group">
                        <label style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase; font-weight:700;">Carrera / Programa:</label>
                        <input type="text" id="edit-profile-career" class="payment-form-input" value="${(profile.career || '').replace(/"/g, '&quot;')}" placeholder="Ej. Ingeniería Física" />
                    </div>
                    <div class="payment-form-group">
                        <label style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase; font-weight:700;">Universidad / Institución:</label>
                        <input type="text" id="edit-profile-inst" class="payment-form-input" value="${(profile.institution || 'Universidad del Cauca').replace(/"/g, '&quot;')}" placeholder="Universidad del Cauca" />
                    </div>
                </div>

                <div style="margin-top:1.25rem; display:flex; gap:0.75rem; justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="switchProfileTab('courses')">Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarDatosPerfilEstudiante()">Guardar Cambios 💾</button>
                </div>
            </div>
        `;
    }

    let selectedAvatarTemp = null;
    window.selectStudentAvatar = function(av, btn) {
        selectedAvatarTemp = av;
        document.querySelectorAll('.avatar-option-btn').forEach(b => b.classList.remove('selected'));
        if (btn) btn.classList.add('selected');
    };

    window.guardarDatosPerfilEstudiante = function() {
        const nameInp = document.getElementById('edit-profile-name');
        const careerInp = document.getElementById('edit-profile-career');
        const instInp = document.getElementById('edit-profile-inst');

        const current = getStudentProfile();
        const updated = {
            ...current,
            name: nameInp ? (nameInp.value.trim() || current.name) : current.name,
            career: careerInp ? (careerInp.value.trim() || current.career) : current.career,
            institution: instInp ? (instInp.value.trim() || current.institution) : current.institution,
            avatar: selectedAvatarTemp || current.avatar || '⚛️',
            updatedAt: new Date().toISOString()
        };

        saveStudentProfile(updated);
        showToast('✓ ¡Tu perfil estudiantil ha sido actualizado exitosamente!');
        switchProfileTab('courses');
    };

    function renderStudentProfileBody(activeTab = 'courses') {
        const body = document.getElementById('student-profile-body');
        if (!body) return;

        const profile = getStudentProfile();
        selectedAvatarTemp = profile.avatar || '⚛️';
        const unlockedIds = getUnlockedCourses();
        const adminMode = isAdmin();
        const enrolledCourses = adminMode ? (data.cursos || []) : (data.cursos || []).filter(c => unlockedIds.includes(c.id));
        const savedComicIds = getSavedComics();
        const savedPodcastsList = getSavedPodcasts();
        const atomLikesState = getAtomLikesState();
        const likedItemIds = Object.keys(atomLikesState).filter(k => atomLikesState[k]?.liked);

        body.innerHTML = `
            <!-- Encabezado de Perfil -->
            <div class="profile-header-card">
                <div class="profile-avatar-circle" id="profile-avatar-display">
                    ${profile.avatar || '⚛️'}
                </div>
                <div class="profile-info">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
                        <div>
                            <h2 class="profile-name">${profile.name || 'Estudiante Universitario'}</h2>
                            <p class="profile-meta-text">🎓 ${profile.career || 'Física / Ingeniería'} · ${profile.institution || 'Universidad del Cauca'}</p>
                        </div>
                        <button class="btn btn-secondary" onclick="switchProfileTab('edit')" style="font-size:0.8rem; padding:0.35rem 0.75rem;">
                            ✏️ Editar Perfil
                        </button>
                    </div>
                    <div class="profile-stats-bar">
                        <span class="profile-stat-badge">
                            <strong>${enrolledCourses.length}</strong> Cursos Inscritos 🎓
                        </span>
                        <span class="profile-stat-badge">
                            <strong>${savedComicIds.length}</strong> Cómics Guardados 🎨
                        </span>
                        <span class="profile-stat-badge">
                            <strong>${savedPodcastsList.length}</strong> Podcasts Guardados 🎙️
                        </span>
                        <span class="profile-stat-badge">
                            <strong>${likedItemIds.length}</strong> Átomos Me Gusta ⚛️
                        </span>
                    </div>
                </div>
            </div>

            <!-- Navegación de Pestañas -->
            <div class="profile-tabs-nav">
                <button class="profile-tab-btn ${activeTab === 'courses' ? 'active' : ''}" onclick="switchProfileTab('courses')">
                    🎓 Mis Cursos (${enrolledCourses.length})
                </button>
                <button class="profile-tab-btn ${activeTab === 'comics' ? 'active' : ''}" onclick="switchProfileTab('comics')">
                    🎨 Cómics Guardados (${savedComicIds.length})
                </button>
                <button class="profile-tab-btn ${activeTab === 'podcasts' ? 'active' : ''}" onclick="switchProfileTab('podcasts')">
                    🎙️ Podcasts Guardados (${savedPodcastsList.length})
                </button>
                <button class="profile-tab-btn ${activeTab === 'likes' ? 'active' : ''}" onclick="switchProfileTab('likes')">
                    ⚛️ Mis 'Me Gusta' (${likedItemIds.length})
                </button>
                <button class="profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}" onclick="switchProfileTab('edit')">
                    ⚙️ Configuración
                </button>
            </div>

            <!-- Contenido de Pestañas -->
            <div class="profile-tab-panel ${activeTab === 'courses' ? 'active' : ''}" id="profile-tab-courses">
                ${renderProfileCoursesTab(enrolledCourses)}
            </div>

            <div class="profile-tab-panel ${activeTab === 'comics' ? 'active' : ''}" id="profile-tab-comics">
                ${renderProfileComicsTab(savedComicIds)}
            </div>

            <div class="profile-tab-panel ${activeTab === 'podcasts' ? 'active' : ''}" id="profile-tab-podcasts">
                ${renderProfilePodcastsTab(savedPodcastsList)}
            </div>

            <div class="profile-tab-panel ${activeTab === 'likes' ? 'active' : ''}" id="profile-tab-likes">
                ${renderProfileLikesTab(likedItemIds)}
            </div>

            <div class="profile-tab-panel ${activeTab === 'edit' ? 'active' : ''}" id="profile-tab-edit">
                ${renderProfileEditTab(profile)}
            </div>
        `;
    }

    function unlockCourse(courseId) {
        let list = getUnlockedCourses();
        if (!list.includes(courseId)) {
            list.push(courseId);
            localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        }
        localStorage.setItem('unlocked_course_' + courseId, 'true');
        updateStudentBannerState();
        renderEnrolledCourses();
        renderCourses(currentCourseFilter);
        const courseFound = (data.cursos || []).find(c => c.id === courseId);
        const courseName = courseFound ? courseFound.titulo : courseId;
        logRealActivity(`Desbloqueó materia: ${courseName}`, 'course_unlock');
        touchStudentCloudProfile();
    }

    window.lockCourse = function(courseId) {
        let list = getUnlockedCourses().filter(id => id !== courseId);
        localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        localStorage.removeItem('unlocked_course_' + courseId);
        updateStudentBannerState();
        renderEnrolledCourses();
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
        renderEnrolledCourses();
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
        const adminActive = isAdmin();
        const unlockedList = getUnlockedCourses();

        const navGarminBtn = document.getElementById('nav-garmin-btn');
        const mobileGarminBtn = document.getElementById('mobile-garmin-btn');
        const drawerGarminItem = document.getElementById('drawer-garmin-item');
        const navAdminBtnLabel = document.getElementById('nav-admin-btn-label');
        const mobileAdminBtnLabel = document.getElementById('mobile-admin-btn-label');

        if (navGarminBtn) {
            navGarminBtn.style.display = adminActive ? 'inline-flex' : 'none';
        }
        if (mobileGarminBtn) {
            mobileGarminBtn.style.display = adminActive ? 'inline-flex' : 'none';
        }
        if (drawerGarminItem) {
            drawerGarminItem.style.display = adminActive ? 'block' : 'none';
        }
        if (navAdminBtnLabel) {
            navAdminBtnLabel.textContent = adminActive ? 'Admin 👑' : 'Docente';
        }
        if (mobileAdminBtnLabel) {
            mobileAdminBtnLabel.textContent = adminActive ? 'Admin 👑' : 'Docente';
        }

        if (!bannerContainer) return;

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
                        <a href="/garmin/" class="btn btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem; border-color:rgba(34, 211, 238, 0.45); color:#22d3ee; display:inline-flex; align-items:center; gap:0.35rem;" title="Abrir mi monitor personal Garmin AI Pro">
                            ⌚ Garmin Pro
                        </a>
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
                        <a href="#mis-cursos" class="btn btn-primary" style="font-size:0.8rem; padding:0.4rem 0.8rem; background:linear-gradient(135deg, #059669, #10B981); border:none; text-decoration:none;">
                            Ver Mis Cursos Arriba 🚀
                        </a>
                        <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="openStudentProfileModal('courses')">
                            👤 Mi Espacio
                        </button>
                        <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="abrirCanjeadorRapido()">
                            🔑 Otra materia
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
                        <input type="text" id="student-code-input" class="code-input" placeholder="Ingresa la clave de tu curso..." onkeydown="if(event.key==='Enter') canjearCodigoEstudiante();" />
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
            setTimeout(() => {
                const el = document.getElementById('mis-cursos');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
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
                    <input type="text" id="modal-course-key-input" class="code-input" placeholder="Ingresa la clave del curso..." style="flex:1; text-transform:uppercase; font-size:1rem; padding:0.65rem 0.85rem;" onkeydown="if(event.key==='Enter') canjearClaveModalCurso('${course.id}');" />
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
            setTimeout(() => {
                const el = document.getElementById('mis-cursos');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
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
            const likeInfo = getItemLikeInfo('curso-' + c.id);

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
                    <div class="card-actions" style="flex-wrap:wrap; gap:0.4rem;">
                        ${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center;">${openBtnText}</a>` : ''}
                        ${!courseUnlocked ? `<button class="btn btn-secondary btn-course-key" onclick="openCourseKeyModal('${c.id}')" title="Ingresar clave para ${c.titulo}">🔑 Clave Alumno</button>` : ''}
                        ${!courseUnlocked && c.enlaceCompra ? `<button class="btn btn-secondary" onclick="openPaymentModal('${c.id}')" style="border-color:var(--accent-amber); color:var(--accent-amber);">${buyBtnText}</button>` : ''}
                        <button class="btn btn-secondary" onclick="openCourseDetails('${c.id}')">${detailsBtnText}</button>
                        <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="curso-${c.id}" onclick="toggleAtomLike('curso-${c.id}', 'curso', this)" title="Dar un átomo de me gusta">
                            <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                        </button>
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

    updateProfileNavDisplay();
    renderEnrolledCourses();
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

        spotifyGrid.innerHTML = channelsToRender.map(sp => {
            const isSaved = getSavedPodcasts().includes(sp.id);
            const likeInfo = getItemLikeInfo('spotify-' + sp.id);
            return `
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

                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                    <a href="${sp.url}" target="_blank" class="btn btn-spotify" style="flex:1; justify-content:center; text-decoration:none;">
                        Spotify 🎧
                    </a>
                    <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.5rem 0.75rem;" onclick="toggleSpotifyPlayer('${sp.id}', '${sp.spotifyId}', this)">
                        Web ⚡
                    </button>
                    <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleSavePodcast('${sp.id}', event)" title="${isSaved ? 'Quitar de guardados' : 'Guardar en mi perfil'}">
                        ${isSaved ? '🔖' : '🔖 Guardar'}
                    </button>
                    <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="spotify-${sp.id}" onclick="toggleAtomLike('spotify-${sp.id}', 'spotify', this)" title="Dar un átomo de me gusta">
                        <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');

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

        comicsGrid.innerHTML = displayed.map(c => {
            const isSaved = getSavedComics().includes(normalizeComicId(c.id));
            const likeInfo = getItemLikeInfo('comic-' + c.id);
            const cleanUrl = cleanPdfUrl(c.archivo);
            const safeDownloadName = (c.titulo || 'comic').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '').trim().replace(/\s+/g, '_') + '.pdf';
            return `
            <div class="comic-card">
                <div class="comic-cover-wrap" onclick="openComicViewer('${c.id}')" style="cursor:pointer;" title="Abrir lector interactivo">
                    <img src="${c.portada}" alt="${c.titulo}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'400\\' viewBox=\\'0 0 300 400\\'><rect width=\\'300\\' height=\\'400\\' fill=\\'%23111827\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23F59E0B\\' font-family=\\'sans-serif\\' font-size=\\'48\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>🎨</text></svg>';" />
                    <span class="comic-cover-badge">🎨 ${c.categoria}</span>
                </div>
                <div class="comic-body">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">📖 Divulgación Estudiantil</span>
                            <span style="font-size:0.75rem; color:var(--accent-emerald); font-weight:700;">PDF Libre</span>
                        </div>
                        <h3 class="comic-title" onclick="openComicViewer('${c.id}')" style="cursor:pointer;" title="Abrir lector interactivo">${c.titulo}</h3>
                        
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

                    <div class="card-actions" style="margin-top:auto; flex-wrap:wrap; gap:0.4rem;">
                        <button onclick="openComicViewer('${c.id}')" class="btn btn-primary" style="flex:1; justify-content:center; text-decoration:none;">Leer Cómic 📖</button>
                        <a href="${cleanUrl}" download="${safeDownloadName}" class="btn btn-secondary" onclick="trackDownload('${c.titulo.replace(/'/g, "\\'")}')" style="font-size:0.82rem; padding:0.45rem 0.65rem; text-decoration:none;" title="Descargar PDF">⬇️</a>
                        <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveComic('${c.id}', event)" title="${isSaved ? 'Quitar de guardados' : 'Guardar en mi perfil'}">
                            ${isSaved ? '🔖 Guardado' : '🔖 Guardar'}
                        </button>
                        <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="comic-${c.id}" onclick="toggleAtomLike('comic-${c.id}', 'comic', this)" title="Dar un átomo de me gusta">
                            <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

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
    function renderLocalPodcasts() {
        const podcastsGrid = document.getElementById('podcasts-grid');
        if (!podcastsGrid || !data.podcasts) return;
        podcastsGrid.innerHTML = data.podcasts.map((p, idx) => {
            const podId = 'podcast-local-' + idx;
            const isSaved = getSavedPodcasts().includes(podId);
            const likeInfo = getItemLikeInfo(podId);
            return `
            <div class="card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag">${p.categoria}</span>
                        <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="${podId}" onclick="toggleAtomLike('${podId}', 'podcast', this)" title="Dar un átomo de me gusta">
                            <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                        </button>
                    </div>
                    <h3>${p.titulo}</h3>
                    <p>${p.descripcion}</p>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
                        🎙️ Producción: ${p.creditos}
                    </div>
                </div>
                <div>
                    <div class="card-actions" style="flex-wrap:wrap; gap:0.4rem;">
                        <button class="btn btn-primary" style="flex:1;" onclick="playPodcast('${p.archivo}', '${p.titulo.replace(/'/g, "\\'")}', '${p.categoria}')">
                            Reproducir ▶️
                        </button>
                        <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleSavePodcast('${podId}', event)" title="${isSaved ? 'Quitar de guardados' : 'Guardar en mi perfil'}">
                            ${isSaved ? '🔖' : '🔖 Guardar'}
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }
    renderLocalPodcasts();

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

        grid.innerHTML = data.articulosSquash.map(art => {
            const likeInfo = getItemLikeInfo('squash-' + art.id);
            return `
            <div class="card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag interactive">${art.tag}</span>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="font-size:0.75rem; color:var(--text-muted);">${art.tiempoLectura}</span>
                            <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="squash-${art.id}" onclick="toggleAtomLike('squash-${art.id}', 'squash', this)" title="Dar un átomo de me gusta">
                                <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                            </button>
                        </div>
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
            `;
        }).join('');
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

    // ========================================================
    // GESTIÓN DE CONFIGURACIÓN DE PASARELAS Y CHECKOUT
    // ========================================================
    function getPaymentConfig() {
        const base = data.configuracionPasarela || {};
        try {
            const custom = JSON.parse(localStorage.getItem('physicsailab_payment_config') || '{}');
            return {
                wompi: { ...base.wompi, ...(custom.wompi || {}) },
                pagoDirecto: { ...base.pagoDirecto, ...(custom.pagoDirecto || {}) },
                hotmart: { ...base.hotmart, ...(custom.hotmart || {}) }
            };
        } catch (e) {
            return base;
        }
    }

    function savePaymentConfig(cfg) {
        localStorage.setItem('physicsailab_payment_config', JSON.stringify(cfg));
        showToast('💾 Configuración de pasarela de pagos guardada con éxito.');
    }

    window.switchCheckoutTab = function(tabId) {
        document.querySelectorAll('.checkout-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabId);
        });
        document.querySelectorAll('.checkout-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === 'tab-' + tabId);
        });
    };

    window.copiarDatoPago = function(texto, btn) {
        navigator.clipboard.writeText(texto).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = '✓ Copiado';
            btn.classList.add('copied');
            showToast(`📋 Dato copiado: <strong>${texto}</strong>`);
            setTimeout(() => {
                btn.innerHTML = orig;
                btn.classList.remove('copied');
            }, 2500);
        });
    };

    // Modal de Checkout / Pasarela de Pagos (Wompi PSE / Nequi / Hotmart)
    window.openPaymentModal = function(courseId) {
        const course = (data.cursos || []).find(c => c.id === courseId);
        if (!course) return;

        const isLab = course.id === 'transformadores' || course.esLaboratorio;
        const entityWord = isLab ? 'Laboratorio' : 'Curso';
        const modal = document.getElementById('payment-modal');
        const modalBody = document.getElementById('modal-payment-body');
        if (!modal || !modalBody) return;

        const cfg = getPaymentConfig();
        const wompi = cfg.wompi || {};
        const directo = cfg.pagoDirecto || {};
        const hotmart = cfg.hotmart || {};

        const priceCOPFormatted = '$' + (course.precioCOP || 115000).toLocaleString('es-ES') + ' COP';
        const priceUSDFormatted = '$' + (course.precioUSD || 29) + ' USD';
        const isSandbox = wompi.modo !== 'produccion';

        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.25rem;">
                <div style="display:flex; justify-content:center; gap:0.4rem; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap;">
                    <span class="badge" style="background:rgba(16,185,129,0.12); color:#34D399; border-color:rgba(16,185,129,0.3);">
                        🔒 Checkout Seguro SSL · 256-Bit
                    </span>
                    <span class="badge" style="background:rgba(56,189,248,0.12); color:var(--accent-blue); border-color:rgba(56,189,248,0.3);">
                        ⚡ Acceso Permanente de por Vida
                    </span>
                </div>
                <h2 style="font-size:1.65rem; color:#fff; margin-bottom:0.25rem;">${course.titulo}</h2>
                <div style="font-size:0.85rem; color:var(--text-muted);">${course.modulos} · Nivel: ${course.nivel}</div>
            </div>

            <!-- Resumen de Inversión -->
            <div class="payment-summary-box">
                <div class="payment-price-row">
                    <div>
                        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-muted); font-weight:700;">
                            Inversión Única (Sin mensualidades)
                        </div>
                        <div class="payment-price-cop">${priceCOPFormatted}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="text-decoration:line-through; font-size:0.8rem; color:var(--text-muted); display:block;">${course.valorReal || '$49 USD'}</span>
                        <div class="payment-price-usd">${priceUSDFormatted}</div>
                    </div>
                </div>

                <div class="payment-methods-strip">
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Medios Habilitados:</span>
                    <span class="payment-method-badge highlight">🇨🇴 PSE (Todos los bancos)</span>
                    <span class="payment-method-badge">Nequi</span>
                    <span class="payment-method-badge">Bancolombia QR</span>
                    <span class="payment-method-badge">Visa / MasterCard</span>
                    <span class="payment-method-badge">PayPal</span>
                </div>
            </div>

            <!-- Selector de Métodos de Pago (Tabs) -->
            <div class="checkout-tabs">
                <button class="checkout-tab-btn active" data-tab="pse" onclick="switchCheckoutTab('pse')">
                    🇨🇴 PSE / Tarjetas (Wompi)
                </button>
                <button class="checkout-tab-btn" data-tab="directo" onclick="switchCheckoutTab('directo')">
                    📱 Nequi / Bancolombia Directo
                </button>
                <button class="checkout-tab-btn" data-tab="hotmart" onclick="switchCheckoutTab('hotmart')">
                    🌎 Internacional / Hotmart
                </button>
            </div>

            <!-- Tab 1: Pasarela Automática Wompi / Bancolombia (PSE y Tarjetas) -->
            <div class="checkout-tab-content active" id="tab-pse">
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem; margin-bottom:1rem;">
                    <p style="font-size:0.84rem; color:var(--text-muted); margin:0 0 0.85rem; line-height:1.4;">
                        Paga en segundos con débito <strong>PSE</strong> de cualquier banco de Colombia, Nequi o tarjeta de crédito a través de la pasarela oficial segura <strong>Wompi (Bancolombia)</strong>.
                    </p>

                    ${isSandbox ? `
                        <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.75rem; color:#FCD34D; margin-bottom:0.85rem; display:flex; align-items:center; gap:0.4rem;">
                            <span>🧪</span>
                            <span><strong>Modo de Pruebas Activo (Wompi Sandbox):</strong> Puedes simular la compra para comprobar cómo el estudiante recibe su clave y desbloquea el curso al instante.</span>
                        </div>
                    ` : ''}

                    <div class="payment-form-group">
                        <label>Nombre y Apellido del Estudiante:</label>
                        <input type="text" id="buyer-name" class="payment-form-input" placeholder="Nombre y apellido completo" />
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                        <div class="payment-form-group">
                            <label>Correo Electrónico:</label>
                            <input type="email" id="buyer-email" class="payment-form-input" placeholder="tu-correo@ejemplo.com" />
                        </div>
                        <div class="payment-form-group">
                            <label>Teléfono Celular / WhatsApp:</label>
                            <input type="tel" id="buyer-phone" class="payment-form-input" placeholder="312 000 0000" />
                        </div>
                    </div>
                </div>

                <button class="btn-wompi-pay" onclick="iniciarPagoWompi('${course.id}')">
                    <span>⚡ Pagar ${priceCOPFormatted} con PSE / Tarjeta (Wompi)</span>
                </button>

                <p style="font-size:0.72rem; text-align:center; color:var(--text-muted); margin-top:0.75rem; margin-bottom:0;">
                    Al confirmarse la transacción bancaria, el curso se desbloquea de inmediato en tu pantalla y recibirás tu clave permanente.
                </p>
            </div>

            <!-- Tab 2: Pago Directo Nequi / Bancolombia -->
            <div class="checkout-tab-content" id="tab-directo">
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem; margin-bottom:1rem;">
                    <p style="font-size:0.84rem; color:var(--text-muted); margin:0 0 0.85rem; line-height:1.4;">
                        ¿Prefieres pagar sin intermediación bancaria? Transfiere directamente el valor de <strong>${priceCOPFormatted}</strong> desde tu app Nequi, Daviplata o Bancolombia a las cuentas oficiales del docente:
                    </p>

                    <div class="direct-pay-card">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Nequi & Daviplata</div>
                            <div class="direct-pay-number" id="nequi-number-val">${directo.nequi || '312 874 5821'}</div>
                            <div style="font-size:0.75rem; color:#34D399;">Titular: ${directo.titular || 'Manuel Alejandro Obando'}</div>
                        </div>
                        <button class="admin-btn-action" onclick="copiarDatoPago('${directo.nequi || '312 874 5821'}', this)">
                            📋 Copiar
                        </button>
                    </div>

                    <div class="direct-pay-card">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Bancolombia (${directo.bancolombiaTipo || 'Ahorros'})</div>
                            <div class="direct-pay-number" id="bancolombia-number-val">${directo.bancolombiaNumero || '865-000124-91'}</div>
                            <div style="font-size:0.75rem; color:#34D399;">Titular: ${directo.titular || 'Manuel Alejandro Obando'}</div>
                        </div>
                        <button class="admin-btn-action" onclick="copiarDatoPago('${directo.bancolombiaNumero || '865-000124-91'}', this)">
                            📋 Copiar
                        </button>
                    </div>
                </div>

                <a href="https://wa.me/${directo.whatsapp || '573128745821'}?text=${encodeURIComponent('Hola profesor Manuel Alejandro Obando, acabo de realizar la transferencia de ' + priceCOPFormatted + ' para adquirir la licencia permanente de «' + course.titulo + '» en PhysicsAILab.com. Adjunto mi comprobante para recibir mi clave de acceso.')}" target="_blank" class="btn btn-secondary" style="width:100%; justify-content:center; padding:0.85rem; font-size:0.95rem; border-color:rgba(16,185,129,0.4); color:#34D399; font-weight:700;">
                    💬 Enviar Comprobante al Docente por WhatsApp
                </a>
            </div>

            <!-- Tab 3: Hotmart Internacional -->
            <div class="checkout-tab-content" id="tab-hotmart">
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1.25rem; margin-bottom:1rem; text-align:center;">
                    <span style="font-size:2.2rem; display:block; margin-bottom:0.5rem;">🌎</span>
                    <h4 style="color:#fff; margin:0 0 0.5rem; font-size:1.15rem;">Checkout Multimoneda Hotmart</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin:0 0 1rem; line-height:1.5;">
                        Para estudiantes y profesionales fuera de Colombia. Paga en tu moneda local con tarjeta de crédito internacional o PayPal a través de la infraestructura global de Hotmart.
                    </p>
                    <div style="font-size:1.6rem; font-weight:800; color:#fff; margin-bottom:0.75rem;">
                        ${priceUSDFormatted}
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">
                        Docente verificado: Mg. Manuel Alejandro Obando (${hotmart.usuario || '@manuel_obando_963654'}) · Garantía de satisfacción de 7 días.
                    </div>
                </div>

                <a href="${course.enlaceCompra || 'https://hotmart.com'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.85rem; font-size:1rem; background:linear-gradient(135deg, #f97316, #ea580c); border:none; box-shadow:0 8px 25px rgba(234,88,12,0.35);">
                    Adquirir en Hotmart Oficial 🛒
                </a>
            </div>
        `;

        modal.classList.add('active');
    };

    window.iniciarPagoWompi = function(courseId) {
        const course = (data.cursos || []).find(c => c.id === courseId);
        if (!course) return;

        const nameInp = document.getElementById('buyer-name');
        const emailInp = document.getElementById('buyer-email');
        const phoneInp = document.getElementById('buyer-phone');

        const name = nameInp ? nameInp.value.trim() : '';
        const email = emailInp ? emailInp.value.trim() : '';
        const phone = phoneInp ? phoneInp.value.trim() : '3000000000';

        if (!name || !email) {
            alert('Por favor completa tu nombre y correo electrónico para vincular tu licencia y entregarte tu clave.');
            if (!name && nameInp) nameInp.focus();
            else if (emailInp) emailInp.focus();
            return;
        }

        const cfg = getPaymentConfig();
        const wompi = cfg.wompi || {};
        const isSandbox = wompi.modo !== 'produccion';
        const publicKey = (isSandbox ? wompi.llavePublicaTest : wompi.llavePublicaProd) || wompi.llavePublicaTest;
        const amountInCents = (course.precioCOP || 115000) * 100;
        const reference = 'PHYSICSAILAB-' + course.id.toUpperCase() + '-' + Date.now();

        // 1. Si Wompi Widget oficial está cargado en el navegador
        if (typeof window.WidgetCheckout === 'function') {
            try {
                const checkout = new window.WidgetCheckout({
                    currency: 'COP',
                    amountInCents: amountInCents,
                    reference: reference,
                    publicKey: publicKey,
                    customerData: {
                        email: email,
                        fullName: name,
                        phoneNumber: phone
                    }
                });

                checkout.open(function (result) {
                    const transaction = result.transaction;
                    if (transaction && (transaction.status === 'APPROVED' || transaction.status === 'OK')) {
                        finalizarCompraExitosa(courseId, transaction.id || reference, email, name);
                    } else if (transaction && transaction.status === 'DECLINED') {
                        alert('❌ La transacción fue rechazada por tu entidad bancaria. Por favor intenta con otro medio de pago o mediante Nequi directo.');
                    }
                });
                return;
            } catch (err) {
                console.warn('Wompi Widget launch error, falling back to simulator:', err);
            }
        }

        // 2. Si estamos en modo de pruebas / sandbox y no hay popup externo bloqueado:
        const simulated = confirm(
            `🛒 SIMULADOR DE PASARELA WOMPI (Bancolombia / PSE)\n\n` +
            `• Curso: ${course.titulo}\n` +
            `• Valor: $${(course.precioCOP || 115000).toLocaleString('es-ES')} COP\n` +
            `• Comprador: ${name} (${email})\n` +
            `• Medio: Débito PSE / Nequi / Tarjeta Bancolombia\n\n` +
            `¿Deseas simular una transacción bancaria APROBADA con éxito?`
        );

        if (simulated) {
            finalizarCompraExitosa(courseId, 'SIM-WOMPI-' + Date.now(), email, name);
        }
    };

    window.finalizarCompraExitosa = function(courseId, transactionId, email, name) {
        unlockCourse(courseId);
        const course = (data.cursos || []).find(c => c.id === courseId);
        const keys = getCourseKeys(courseId);
        const primaryKey = keys[0] || 'COMPRA-VALIDADA';

        const modalBody = document.getElementById('modal-payment-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="payment-success-box">
                <div style="font-size:3.5rem; animation:fadeInSlide 0.5s ease;">🎉</div>
                <span class="badge" style="background:rgba(16,185,129,0.2); color:#34D399; border-color:rgba(16,185,129,0.5); font-size:0.85rem; padding:0.3rem 0.85rem; margin-bottom:0.75rem;">
                    ✓ ¡PAGO APROBADO EXITOSAMENTE!
                </span>
                <h2 style="font-size:1.85rem; color:#fff; margin-bottom:0.5rem;">¡Bienvenido al Curso!</h2>
                <p style="font-size:0.95rem; color:var(--text-main); line-height:1.5; margin-bottom:1.25rem;">
                    Gracias <strong>${name}</strong>. Tu compra de <strong>${course.titulo}</strong> ha sido validada. La materia ha quedado <strong>100% desbloqueada</strong> de forma permanente en este navegador.
                </p>

                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem; margin-bottom:1.5rem;">
                    <div style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-muted); font-weight:700;">
                        Tu Clave de Acceso Permanente (Guárdala)
                    </div>
                    <div class="payment-key-display">${primaryKey}</div>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
                        Referencia de Transacción: <span style="font-family:monospace; color:#38BDF8;">${transactionId}</span>
                    </p>
                </div>

                <div style="display:flex; flex-direction:column; gap:0.65rem;">
                    ${course.demoPath ? `
                        <a href="${course.demoPath}" target="_blank" class="btn btn-primary" onclick="closePaymentModal()" style="justify-content:center; padding:0.9rem; font-size:1.05rem;">
                            Comenzar a Estudiar Ahora 🚀
                        </a>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closePaymentModal()" style="justify-content:center; padding:0.65rem; font-size:0.85rem;">
                        Volver a la Plataforma
                    </button>
                </div>
            </div>
        `;

        showToast(`🎉 ¡Felicitaciones! Has adquirido <strong>${course.titulo}</strong>.`);
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

    // ========================================================
    // TELEMETRÍA Y DASHBOARD DE ADMINISTRACIÓN DOCENTE
    // ========================================================
    window.adminTelemetryCache = window.adminTelemetryCache || {
        counters: {
            real_visits: parseInt(localStorage.getItem('physicsailab_real_visits') || '14', 10),
            real_downloads: parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10)
        },
        profiles: {},
        activity: {},
        quizResults: {},
        quizConfig: null,
        activeActivityFilter: 'all',
        studentSearchQuery: '',
        quizFilterQuery: ''
    };

    function getCourseTitleById(id) {
        if (!id) return '';
        const found = (data.cursos || []).find(c => c.id === id);
        if (found) return found.titulo;
        const map = {
            termo: 'Termodinámica Computacional',
            torneos: 'Torneos Squash Pro',
            mecanica: 'Mecánica Clásica & Lagrangiana',
            materiales: 'Ciencia de Materiales & Nanotec.',
            electromagnetismo: 'Electromagnetismo & Maxwell',
            ondas: 'Ondas & Óptica Cuántica',
            cuantica: 'Mecánica Cuántica',
            relatividad: 'Relatividad General',
            biofisica: 'Biofísica Médica',
            transformadores: 'Lab Transformadores',
            astronomia: 'Astrofísica Moderna',
            estado_solido: 'Física del Estado Sólido',
            fluidos: 'Mecánica de Fluidos',
            laboratorio: 'Proyecto Laboratorio: Kits de Física'
        };
        return map[id] || id;
    }

    function renderAdminProfilesHtml(profilesObj, query = '') {
        const list = Object.values(profilesObj || {});
        if (list.length === 0) {
            return `
                <div style="grid-column: 1 / -1; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">👥</span>
                    Cargando perfiles estudiantiles sincronizados desde la nube...
                </div>
            `;
        }

        const q = (query || '').toLowerCase().trim();
        const filtered = list.filter(p => {
            if (!q) return true;
            const name = (p.name || '').toLowerCase();
            const career = (p.career || '').toLowerCase();
            const inst = (p.institution || '').toLowerCase();
            return name.includes(q) || career.includes(q) || inst.includes(q);
        });

        if (filtered.length === 0) {
            return `
                <div style="grid-column: 1 / -1; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    No se encontraron perfiles que coincidan con "<strong>${query}</strong>".
                </div>
            `;
        }

        filtered.sort((a, b) => {
            const timeA = new Date(a.lastActive || a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.lastActive || b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
        });

        return filtered.map(p => {
            const enrolled = Array.isArray(p.enrolledCourses) ? p.enrolledCourses : [];
            const isDocente = p.role === 'docente' || (p.name || '').toLowerCase().includes('obando');
            const lastActiveStr = formatRelativeTime(p.lastActive || p.updatedAt || p.createdAt);

            return `
                <div class="admin-student-card">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div class="admin-student-avatar">${p.avatar || '⚛️'}</div>
                                <div>
                                    <h5 style="color: #fff; font-size: 1rem; margin: 0 0 0.2rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
                                        ${p.name || 'Estudiante'}
                                        ${isDocente ? '<span class="admin-badge" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Docente</span>' : ''}
                                    </h5>
                                    <div style="font-size: 0.78rem; color: #A5B4FC; font-weight: 600;">${p.career || 'Física / Ingeniería'}</div>
                                </div>
                            </div>
                        </div>

                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
                            <span>🏛️</span> <span>${p.institution || 'Universidad del Cauca'}</span>
                        </div>

                        <div style="margin-bottom: 0.75rem;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.35rem; letter-spacing: 0.4px;">
                                Materias Desbloqueadas (${enrolled.length}):
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                                ${enrolled.length > 0 ? enrolled.map(cId => `
                                    <span class="admin-student-course-pill" title="${cId}">
                                        ✓ ${getCourseTitleById(cId)}
                                    </span>
                                `).join('') : '<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Ningún curso desbloqueado aún</span>'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.74rem; color: var(--text-muted); margin-bottom: 0.6rem;">
                            <span>👁️ <strong>${p.totalVisits || 1}</strong> visitas</span>
                            <span>🎨 <strong>${p.savedComicsCount || 0}</strong> cómics</span>
                            <span>❤️ <strong>${p.totalLikes || 0}</strong> likes</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.5rem;">
                            <span style="color: var(--text-muted);">${p.device || 'Navegador Web'}</span>
                            <span style="color: #34D399; font-weight: 600;">⏱️ ${lastActiveStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderAdminActivityHtml(activityObj, filterType = 'all') {
        const list = Object.values(activityObj || {});
        if (list.length === 0) {
            return `
                <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    <span style="font-size: 1.5rem; display: block; margin-bottom: 0.35rem;">⚡</span>
                    Cargando registro de telemetría y visitantes en tiempo real...
                </div>
            `;
        }

        const filtered = list.filter(item => {
            if (filterType === 'all') return true;
            if (filterType === 'visit') return item.type === 'visit';
            if (filterType === 'profile') return item.type === 'profile_save';
            if (filterType === 'download') return item.type === 'download';
            if (filterType === 'course') return item.type === 'course_view' || item.type === 'course_unlock';
            return true;
        });

        if (filtered.length === 0) {
            return `
                <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    No hay eventos registrados en la categoría seleccionada.
                </div>
            `;
        }

        filtered.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

        return filtered.slice(0, 35).map(item => {
            let icon = '⚡';
            let badgeBg = 'rgba(99, 102, 241, 0.15)';
            let badgeColor = '#A5B4FC';

            if (item.type === 'visit') {
                icon = '👁️';
                badgeBg = 'rgba(56, 189, 248, 0.15)';
                badgeColor = '#38BDF8';
            } else if (item.type === 'download') {
                icon = '📥';
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                badgeColor = '#34D399';
            } else if (item.type === 'profile_save') {
                icon = '👤';
                badgeBg = 'rgba(236, 72, 153, 0.15)';
                badgeColor = '#F472B6';
            } else if (item.type === 'course_view' || item.type === 'course_unlock') {
                icon = '📚';
                badgeBg = 'rgba(245, 158, 11, 0.15)';
                badgeColor = '#FBBF24';
            }

            const relTime = formatRelativeTime(item.timestamp);

            return `
                <div class="admin-activity-item">
                    <div style="display: flex; align-items: center; gap: 0.85rem; flex-grow: 1; min-width: 0;">
                        <div style="width: 38px; height: 38px; border-radius: 10px; background: ${badgeBg}; color: ${badgeColor}; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.08);">
                            ${item.avatar || icon}
                        </div>
                        <div style="min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <strong style="color: #fff; font-size: 0.88rem;">${item.studentName || 'Visitante en línea'}</strong>
                                ${item.career ? `<span style="font-size: 0.72rem; color: #A5B4FC;">(${item.career})</span>` : ''}
                            </div>
                            <div style="font-size: 0.82rem; color: #E2E8F0; margin-top: 0.15rem; word-break: break-word;">
                                ${item.action}
                            </div>
                            ${item.institution ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem;">🏛️ ${item.institution}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0;">
                        <span class="admin-activity-device-pill">${item.device || 'Navegador Web'}</span>
                        <span style="font-size: 0.72rem; color: #34D399; font-weight: 600; white-space: nowrap;">⏱️ ${relTime}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========================================================
    // GESTIÓN DOCENTE DE QUIZZES, CONTRASEÑAS INDEPENDIENTES Y CALIFICACIONES EN GRUPO
    // ========================================================
    const DEFAULT_QUIZ_PASSWORDS = {
        'electromagnetismo-10': 'ELECTRO2026',
        'quiz-completo': 'FISICA60',
        'quiz-cinematica': 'CINEMATICA15',
        'quiz-dinamica': 'DINAMICA15',
        'quiz-express': 'EXPRESS10'
    };

    function getStoredQuizPasswords() {
        let passwords = Object.assign({}, DEFAULT_QUIZ_PASSWORDS);
        try {
            const stored = localStorage.getItem('physicsailab_quiz_passwords');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    passwords = Object.assign(passwords, parsed);
                }
            }
        } catch (e) {}
        if (window.adminTelemetryCache && window.adminTelemetryCache.quizPasswords) {
            passwords = Object.assign(passwords, window.adminTelemetryCache.quizPasswords);
        }
        return passwords;
    }

    function getQuizPassword(quizId) {
        const map = getStoredQuizPasswords();
        return (map[quizId] || DEFAULT_QUIZ_PASSWORDS[quizId] || 'FISICA2026').trim().toUpperCase();
    }

    function setQuizPassword(quizId, newPassword) {
        const map = getStoredQuizPasswords();
        const pin = (newPassword || '').trim().toUpperCase();
        map[quizId] = pin;
        try {
            localStorage.setItem('physicsailab_quiz_passwords', JSON.stringify(map));
        } catch (e) {}
        if (window.adminTelemetryCache) {
            window.adminTelemetryCache.quizPasswords = map;
        }
        fetch(`${FIREBASE_BASE}/quiz_passwords.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(map)
        }).catch(() => {});
        return map;
    }

    window.adminSaveSingleQuizPassword = function(quizId) {
        const input = document.getElementById(`admin-pin-${quizId}`);
        if (!input) return;
        const pin = input.value.trim().toUpperCase();
        if (pin.length < 3) {
            alert('La contraseña del quiz debe tener al menos 3 caracteres.');
            input.focus();
            return;
        }
        setQuizPassword(quizId, pin);
        const qData = window.QUIZZES_DATA;
        const preset = qData ? qData.presets.find(p => p.id === quizId) : null;
        const title = preset ? preset.title : quizId;
        showToast(`🔑 Contraseña de "${title}" actualizada a: <strong>${pin}</strong>`);
        logRealActivity(`Docente asignó nueva contraseña [${pin}] al quiz "${title}"`, 'admin');
    };

    window.adminSaveAllQuizPasswords = function() {
        const qData = window.QUIZZES_DATA;
        if (!qData || !qData.presets) return;
        const map = getStoredQuizPasswords();
        let updatedCount = 0;
        qData.presets.forEach(p => {
            const input = document.getElementById(`admin-pin-${p.id}`);
            if (input && input.value.trim()) {
                map[p.id] = input.value.trim().toUpperCase();
                updatedCount++;
            }
        });
        try {
            localStorage.setItem('physicsailab_quiz_passwords', JSON.stringify(map));
        } catch (e) {}
        if (window.adminTelemetryCache) {
            window.adminTelemetryCache.quizPasswords = map;
        }
        fetch(`${FIREBASE_BASE}/quiz_passwords.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(map)
        }).catch(() => {});
        showToast(`💾 Se guardaron correctamente las contraseñas de las ${updatedCount} evaluaciones.`);
        logRealActivity(`Docente guardó todas las contraseñas de los quizzes (${updatedCount} evaluaciones)`, 'admin');
    };

    window.adminCopyWhatsAppForQuiz = function(quizId) {
        const qData = window.QUIZZES_DATA;
        const preset = qData ? qData.presets.find(p => p.id === quizId) : null;
        if (!preset) return;
        const pin = getQuizPassword(quizId);

        const text = `¡Hola estudiantes!\n\nYa está habilitada la evaluación oficial en nuestra plataforma:\n\n📝 Evaluación: *${preset.title}*\n🎯 Total: *${preset.totalPreguntas} preguntas*\n🔑 Contraseña / PIN de Ingreso: *${pin}*\n🌐 Enlace directo: https://physicsailab.com/#quizzes\n\nInstrucciones:\n1. En el menú desplegable selecciona "${preset.title}".\n2. Ingresa con tu Nombre y Apellidos completos.\n3. Escribe la contraseña oficial: *${pin}*\n4. La prueba cuenta con protocolo antifraude: preguntas en orden aleatorio, sin cambio de pestañas ni capturas de pantalla.\n5. Avanza pregunta por pregunta (no está permitido retroceder).\n\nMuchos éxitos en la prueba.\nMg. Manuel Alejandro Obando — Universidad del Cauca`;

        navigator.clipboard.writeText(text).then(() => {
            showToast(`📋 Invitación de WhatsApp copiada para "${preset.title}".`);
        }).catch(() => {
            alert(text);
        });
    };

    window.openAdminQuizPreview = function(quizId) {
        window.openQuizPreviewModal(quizId);
    };

    function getAdminQuizConfig() {
        try {
            const stored = localStorage.getItem('physicsailab_quiz_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.pin) return parsed;
            }
        } catch (e) {}
        return {
            pin: 'FISICA-2026',
            presetId: 'quiz-completo',
            antiFraudEnabled: true,
            isActive: true,
            updatedAt: new Date().toISOString()
        };
    }

    function getStoredQuizResults() {
        try {
            const stored = localStorage.getItem('physicsailab_quiz_results') || localStorage.getItem('physicsailab_quiz_results_list');
            if (stored) return JSON.parse(stored);
        } catch (e) {}
        return [];
    }

    function renderAdminQuizResultsHtml(filterQuery = '') {
        const cloudResults = window.adminTelemetryCache && window.adminTelemetryCache.quizResults 
            ? Object.values(window.adminTelemetryCache.quizResults) 
            : [];
        const localResults = getStoredQuizResults();

        const map = new Map();
        [...cloudResults, ...localResults].forEach(item => {
            if (item && item.id) map.set(item.id, item);
        });
        let list = Array.from(map.values());

        const q = (filterQuery || '').toLowerCase().trim();
        if (q) {
            list = list.filter(r => 
                (r.studentName || '').toLowerCase().includes(q) ||
                (r.course || '').toLowerCase().includes(q) ||
                (r.quizTitle || '').toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

        if (list.length === 0) {
            return `
                <div style="background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px; padding:1.75rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
                    <span style="font-size:1.75rem; display:block; margin-bottom:0.4rem;">📝</span>
                    Aún no hay calificaciones de quizzes registradas${q ? ` para "${q}"` : ''}. Cuando los estudiantes envíen sus pruebas con la contraseña activa, aquí aparecerán con su nota oficial, aciertos y auditoría antifraude.
                </div>
            `;
        }

        return `
            <div class="admin-quiz-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Estudiante &amp; Curso</th>
                            <th>Evaluación Oficial</th>
                            <th style="text-align:center;">Nota (0.0-5.0)</th>
                            <th style="text-align:center;">Aciertos</th>
                            <th style="text-align:center;">Precisión</th>
                            <th style="text-align:center;">Seguridad Antifraude</th>
                            <th style="text-align:right;">Fecha / Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(r => {
                            const gradeNum = parseFloat(r.grade !== undefined ? r.grade : (r.gradeStr || '0'));
                            let gradeClass = 'grade-high';
                            if (gradeNum < 3.0) gradeClass = 'grade-low';
                            else if (gradeNum < 4.0) gradeClass = 'grade-mid';

                            const switches = r.tabSwitches || 0;
                            const dateStr = r.completedAt ? formatRelativeTime(r.completedAt) : '---';

                            return `
                                <tr>
                                    <td>
                                        <div style="font-weight:700; color:#fff;">👤 ${r.studentName || 'Estudiante'}</div>
                                        <div style="font-size:0.75rem; color:var(--accent-blue);">📚 ${r.course || 'General'}</div>
                                    </td>
                                    <td>
                                        <div style="font-weight:600; color:#e2e8f0; font-size:0.85rem;">${r.quizTitle || 'Quiz'}</div>
                                        <span style="font-family:monospace; font-size:0.72rem; color:var(--text-muted);">PIN: ${r.roomPin || '---'}</span>
                                    </td>
                                    <td style="text-align:center;">
                                        <span class="admin-grade-badge ${gradeClass}">${(gradeNum).toFixed(1)}</span>
                                    </td>
                                    <td style="text-align:center; font-weight:700; color:#fff; font-size:0.85rem;">
                                        ${r.correctCount || 0} / ${r.totalQuestions || 0}
                                    </td>
                                    <td style="text-align:center; font-weight:700; color:var(--accent-blue); font-size:0.85rem;">
                                        ${r.accuracy || 0}%
                                    </td>
                                    <td style="text-align:center;">
                                        ${switches === 0 ? `
                                            <span class="sec-alert-pill sec-pill-clean" title="Sin salidas de pantalla registradas">
                                                🟢 0 Salidas
                                            </span>
                                        ` : `
                                            <span class="sec-alert-pill sec-pill-warn" title="${switches} cambios de pestaña detectados">
                                                ⚠️ ${switches} Salida${switches > 1 ? 's' : ''}
                                            </span>
                                        `}
                                    </td>
                                    <td style="text-align:right; font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">
                                        ${dateStr}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    window.filterAdminQuizTable = function(val) {
        window.adminTelemetryCache.quizFilterQuery = val;
        const container = document.getElementById('admin-quiz-table-container');
        if (container) {
            container.innerHTML = renderAdminQuizResultsHtml(val);
        }
    };

    window.adminSaveQuizConfig = function() {
        const pinEl = document.getElementById('admin-quiz-pin-input');
        const presetEl = document.getElementById('admin-quiz-preset-select');
        const antifraudEl = document.getElementById('admin-quiz-antifraud');

        if (!pinEl || !presetEl) return;
        const pin = pinEl.value.trim().toUpperCase();
        if (pin.length < 3) {
            alert('El PIN debe tener al menos 3 caracteres.');
            pinEl.focus();
            return;
        }

        const newCfg = {
            pin: pin,
            presetId: presetEl.value,
            antiFraudEnabled: antifraudEl ? antifraudEl.checked : true,
            isActive: true,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('physicsailab_quiz_config', JSON.stringify(newCfg));
        window.adminTelemetryCache.quizConfig = newCfg;

        // Guardar en Firebase
        fetch(`${FIREBASE_BASE}/quiz_config.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCfg)
        }).catch(() => {});

        showToast(`🎯 Contraseña del Quiz actualizada a: <strong>${pin}</strong>`);
        logRealActivity(`Docente actualizó la contraseña del Quiz a [${pin}] (Modo: ${newCfg.presetId})`, 'admin');
        renderAdminDashboardContent();
    };

    window.adminCopyQuizWhatsApp = function() {
        const cfg = getAdminQuizConfig();
        const qData = window.QUIZZES_DATA;
        const preset = qData ? qData.presets.find(p => p.id === cfg.presetId) : null;
        const title = preset ? preset.title : 'Cinemática y Dinámica';

        const text = `¡Hola estudiantes!\n\nYa está habilitada la evaluación oficial en nuestra plataforma:\n\n📝 Evaluación: *${title}*\n🔑 Contraseña / PIN de Ingreso: *${cfg.pin}*\n🌐 Enlace: https://physicsailab.com/#quizzes\n\nInstrucciones:\n1. Ingresen con su Nombre y Apellidos completos.\n2. La prueba cuenta con protocolo antifraude: no cambien de pestaña ni tomen capturas de pantalla.\n3. Avancen pregunta por pregunta (no está permitido devolverse).\n\nMuchos éxitos en la prueba.\nMg. Manuel Alejandro Obando — Universidad del Cauca`;

        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Mensaje de WhatsApp copiado con el PIN y el enlace directo.');
        }).catch(() => {
            alert(text);
        });
    };

    window.adminDownloadQuizCsv = function() {
        const cloudResults = window.adminTelemetryCache && window.adminTelemetryCache.quizResults 
            ? Object.values(window.adminTelemetryCache.quizResults) 
            : [];
        const localResults = getStoredQuizResults();

        const map = new Map();
        [...cloudResults, ...localResults].forEach(item => {
            if (item && item.id) map.set(item.id, item);
        });
        const allResults = Array.from(map.values());

        if (allResults.length === 0) {
            alert('No hay calificaciones registradas aún para exportar.');
            return;
        }

        allResults.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

        const headers = [
            'Estudiante',
            'Curso / Materia',
            'Evaluacion',
            'PIN Utilizado',
            'Calificacion (0.0 a 5.0)',
            'Aciertos',
            'Fallos',
            'Total Preguntas',
            'Precision (%)',
            'Puntaje',
            'Tiempo Empleado (Seg)',
            'Salidas de Pestana (Alertas)',
            'Intentos Captura (Alertas)',
            'Fecha',
            'Hora',
            'Dispositivo'
        ];

        const rows = allResults.map(r => {
            const dateObj = r.completedAt ? new Date(r.completedAt) : new Date();
            const fecha = dateObj.toLocaleDateString('es-ES');
            const hora = dateObj.toLocaleTimeString('es-ES');
            const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

            return [
                escapeCsv(r.studentName),
                escapeCsv(r.course),
                escapeCsv(r.quizTitle),
                escapeCsv(r.roomPin),
                (r.grade !== undefined ? Number(r.grade).toFixed(1).replace('.', ',') : '0,0'),
                r.correctCount || 0,
                r.wrongCount || 0,
                r.totalQuestions || 0,
                `${r.accuracy || 0}%`,
                r.score || 0,
                r.timeSpentSeconds || 0,
                r.tabSwitches || 0,
                r.screenshotAttempts || 0,
                escapeCsv(fecha),
                escapeCsv(hora),
                escapeCsv(r.device || '')
            ].join(';');
        });

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `Planilla_Calificaciones_Quizzes_PhysicsAILab_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`📥 Plantilla descargada con <strong>${allResults.length}</strong> calificaciones registradas.`);
    };

    window.fetchAdminCloudTelemetry = function(showFeedback = false) {
        if (showFeedback) {
            showToast('🔄 Consultando telemetría, perfiles y calificaciones en tiempo real...');
        }

        Promise.all([
            fetch(`${FIREBASE_BASE}/counters.json`).then(r => r.json()).catch(() => null),
            fetch(`${FIREBASE_BASE}/profiles.json`).then(r => r.json()).catch(() => null),
            fetch(`${FIREBASE_BASE}/activity.json`).then(r => r.json()).catch(() => null),
            fetch(`${FIREBASE_BASE}/quiz_results.json`).then(r => r.json()).catch(() => null),
            fetch(`${FIREBASE_BASE}/quiz_config.json`).then(r => r.json()).catch(() => null),
            fetch(`${FIREBASE_BASE}/quiz_passwords.json`).then(r => r.json()).catch(() => null)
        ]).then(([counters, profiles, activity, quizResults, quizConfig, quizPasswords]) => {
            if (quizPasswords && typeof quizPasswords === 'object') {
                window.adminTelemetryCache.quizPasswords = Object.assign({}, DEFAULT_QUIZ_PASSWORDS, quizPasswords);
                localStorage.setItem('physicsailab_quiz_passwords', JSON.stringify(window.adminTelemetryCache.quizPasswords));
            }
            if (counters) {
                window.adminTelemetryCache.counters = counters;
                if (typeof counters.real_visits === 'number') {
                    localStorage.setItem('physicsailab_real_visits', counters.real_visits);
                    updateVisitsDisplay(BASE_VISITS + counters.real_visits);
                }
                if (typeof counters.real_downloads === 'number') {
                    localStorage.setItem('physicsailab_real_downloads', counters.real_downloads);
                    updateDownloadsDisplay(BASE_DOWNLOADS + counters.real_downloads);
                }
            }
            if (profiles) {
                window.adminTelemetryCache.profiles = profiles;
            }
            if (activity) {
                window.adminTelemetryCache.activity = activity;
            }
            if (quizResults) {
                window.adminTelemetryCache.quizResults = quizResults;
            }
            if (quizConfig && quizConfig.pin) {
                window.adminTelemetryCache.quizConfig = quizConfig;
                localStorage.setItem('physicsailab_quiz_config', JSON.stringify(quizConfig));
            }

            const realVisitsEl = document.getElementById('admin-kpi-real-visits');
            const publicVisitsEl = document.getElementById('admin-kpi-public-visits');
            const realDownloadsEl = document.getElementById('admin-kpi-real-downloads');
            const publicDownloadsEl = document.getElementById('admin-kpi-public-downloads');
            const profilesCountEl = document.getElementById('admin-kpi-profiles-count');
            const profilesHeaderCountEl = document.getElementById('admin-profiles-header-count');

            const currentRealVisits = (window.adminTelemetryCache.counters && typeof window.adminTelemetryCache.counters.real_visits === 'number')
                ? window.adminTelemetryCache.counters.real_visits
                : parseInt(localStorage.getItem('physicsailab_real_visits') || '14', 10);
            const currentRealDownloads = (window.adminTelemetryCache.counters && typeof window.adminTelemetryCache.counters.real_downloads === 'number')
                ? window.adminTelemetryCache.counters.real_downloads
                : parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10);
            const totalProfiles = Object.keys(window.adminTelemetryCache.profiles || {}).length;

            if (realVisitsEl) realVisitsEl.textContent = currentRealVisits.toLocaleString('es-ES');
            if (publicVisitsEl) publicVisitsEl.textContent = (BASE_VISITS + currentRealVisits).toLocaleString('es-ES');
            if (realDownloadsEl) realDownloadsEl.textContent = currentRealDownloads.toLocaleString('es-ES');
            if (publicDownloadsEl) publicDownloadsEl.textContent = (BASE_DOWNLOADS + currentRealDownloads).toLocaleString('es-ES');
            if (profilesCountEl) profilesCountEl.textContent = totalProfiles;
            if (profilesHeaderCountEl) profilesHeaderCountEl.textContent = `(${totalProfiles})`;

            const profilesContainer = document.getElementById('admin-student-profiles-container');
            if (profilesContainer) {
                profilesContainer.innerHTML = renderAdminProfilesHtml(window.adminTelemetryCache.profiles, window.adminTelemetryCache.studentSearchQuery);
            }

            const activityContainer = document.getElementById('admin-activity-timeline-container');
            if (activityContainer) {
                activityContainer.innerHTML = renderAdminActivityHtml(window.adminTelemetryCache.activity, window.adminTelemetryCache.activeActivityFilter);
            }

            const quizTableContainer = document.getElementById('admin-quiz-table-container');
            if (quizTableContainer) {
                quizTableContainer.innerHTML = renderAdminQuizResultsHtml(window.adminTelemetryCache.quizFilterQuery);
            }

            if (showFeedback) {
                showToast('✓ ¡Telemetría, perfiles y calificaciones actualizadas!');
            }
        }).catch(err => {
            console.warn('Error fetching telemetry:', err);
            if (showFeedback) {
                showToast('⚠️ No se pudo sincronizar la telemetría con la nube.');
            }
        });
    };

    window.filterAdminStudentProfiles = function(query) {
        window.adminTelemetryCache.studentSearchQuery = query;
        const container = document.getElementById('admin-student-profiles-container');
        if (container) {
            container.innerHTML = renderAdminProfilesHtml(window.adminTelemetryCache.profiles, query);
        }
    };

    window.filterAdminActivityFeed = function(filterType, btn) {
        window.adminTelemetryCache.activeActivityFilter = filterType;
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.admin-btn-action').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        const container = document.getElementById('admin-activity-timeline-container');
        if (container) {
            container.innerHTML = renderAdminActivityHtml(window.adminTelemetryCache.activity, filterType);
        }
    };

    // Renderizar Dashboard del Administrador
    window.renderAdminDashboardContent = function() {
        const modalBody = document.getElementById('admin-modal-body');
        if (!modalBody) return;

        const realVisits = (window.adminTelemetryCache.counters && typeof window.adminTelemetryCache.counters.real_visits === 'number')
            ? window.adminTelemetryCache.counters.real_visits
            : parseInt(localStorage.getItem('physicsailab_real_visits') || '14', 10);
        const realDownloads = (window.adminTelemetryCache.counters && typeof window.adminTelemetryCache.counters.real_downloads === 'number')
            ? window.adminTelemetryCache.counters.real_downloads
            : parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10);

        const publicVisits = BASE_VISITS + realVisits;
        const publicDownloads = BASE_DOWNLOADS + realDownloads;

        const profilesCount = Object.keys(window.adminTelemetryCache.profiles || {}).length;

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
                        <h2 style="font-size:1.85rem; color:#fff; margin:0 0 0.25rem;">Panel de Control Docente & Telemetría</h2>
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

                <!-- KPI Grid de Estadísticas en Vivo: Datos Reales vs. Promocionales -->
                <div style="margin-bottom:1.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                        <h4 style="color:#fff; font-size:1.05rem; margin:0; display:flex; align-items:center; gap:0.5rem;">
                            📊 Telemetría y Métricas de la Plataforma en Tiempo Real
                        </h4>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Métricas reales sincronizadas con Firebase</span>
                    </div>

                    <div class="admin-kpi-grid">
                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Visitas Reales</span>
                                <span class="admin-real-badge">● Tráfico Real</span>
                            </div>
                            <div class="admin-kpi-num" id="admin-kpi-real-visits">${realVisits.toLocaleString('es-ES')}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
                                Público en Web: <strong id="admin-kpi-public-visits" style="color:#38BDF8;">${publicVisits.toLocaleString('es-ES')}</strong>
                            </div>
                            <div style="display:flex; gap:0.35rem; margin-top:0.5rem;">
                                <button class="admin-btn-action" onclick="adminIncrementVisits(10)" title="Sumar 10 visitas de prueba">+10</button>
                                <button class="admin-btn-action" onclick="adminResetCounter('visits')" title="Restablecer contador real a 1">Reset</button>
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Descargas Reales</span>
                                <span class="admin-real-badge">● Verificadas</span>
                            </div>
                            <div class="admin-kpi-num" id="admin-kpi-real-downloads">${realDownloads.toLocaleString('es-ES')}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
                                Público en Web: <strong id="admin-kpi-public-downloads" style="color:#38BDF8;">${publicDownloads.toLocaleString('es-ES')}</strong>
                            </div>
                            <div style="display:flex; gap:0.35rem; margin-top:0.5rem;">
                                <button class="admin-btn-action" onclick="adminIncrementDownloads(5)" title="Sumar 5 descargas de prueba">+5</button>
                                <button class="admin-btn-action" onclick="adminResetCounter('downloads')" title="Restablecer contador real a 0">Reset</button>
                            </div>
                        </div>

                        <div class="admin-kpi-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="admin-kpi-label">Perfiles de Alumnos</span>
                                <span class="admin-marketing-badge">● Guardados</span>
                            </div>
                            <div class="admin-kpi-num" id="admin-kpi-profiles-count">${profilesCount}</div>
                            <div style="font-size:0.75rem; color:#34D399; margin-top:0.35rem;">
                                Directorio activo en nube
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
                                <span class="admin-kpi-label">Cómics en PDF</span>
                                <span style="font-size:1.25rem;">🎨</span>
                            </div>
                            <div class="admin-kpi-num">${(data.comics || []).length}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">
                                Creados por estudiantes
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 1: Directorio de Perfiles de Estudiantes -->
                <div style="margin-bottom:2.25rem; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem 1.4rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
                        <div>
                            <h4 style="color:#fff; font-size:1.15rem; margin:0 0 0.25rem; display:flex; align-items:center; gap:0.5rem;">
                                👥 Directorio de Perfiles de Estudiantes Creados <span id="admin-profiles-header-count" style="font-size:0.92rem; color:#A5B4FC; font-weight:600;">(${profilesCount})</span>
                            </h4>
                            <p style="font-size:0.82rem; color:var(--text-muted); margin:0;">
                                Consulta quiénes han personalizado y guardado su perfil en la plataforma, sus carreras, materias inscritas y actividad.
                            </p>
                        </div>
                        <div class="admin-search-box">
                            <span class="admin-search-icon">🔍</span>
                            <input type="text" id="admin-student-search-input" class="admin-search-input" placeholder="Buscar por nombre, carrera o universidad..." oninput="window.filterAdminStudentProfiles(this.value)" value="${window.adminTelemetryCache.studentSearchQuery || ''}">
                        </div>
                    </div>

                    <div id="admin-student-profiles-container" class="admin-student-grid">
                        ${renderAdminProfilesHtml(window.adminTelemetryCache.profiles, window.adminTelemetryCache.studentSearchQuery)}
                    </div>
                </div>

                <!-- SECCIÓN 2: Monitoreo de Audiencia y Frecuentación en Tiempo Real -->
                <div style="margin-bottom:2.25rem; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem 1.4rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
                        <div>
                            <h4 style="color:#fff; font-size:1.15rem; margin:0 0 0.25rem; display:flex; align-items:center; gap:0.5rem;">
                                ⚡ Monitoreo de Audiencia y Frecuentación en Vivo
                            </h4>
                            <p style="font-size:0.82rem; color:var(--text-muted); margin:0;">
                                Registra con datos reales quiénes están frecuentando la plataforma, desde qué dispositivos (móvil o PC) y qué acciones realizan.
                            </p>
                        </div>
                        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                            <button class="admin-btn-action ${window.adminTelemetryCache.activeActivityFilter === 'all' ? 'active' : ''}" onclick="window.filterAdminActivityFeed('all', this)">Todos</button>
                            <button class="admin-btn-action ${window.adminTelemetryCache.activeActivityFilter === 'visit' ? 'active' : ''}" onclick="window.filterAdminActivityFeed('visit', this)">👁️ Visitas</button>
                            <button class="admin-btn-action ${window.adminTelemetryCache.activeActivityFilter === 'profile' ? 'active' : ''}" onclick="window.filterAdminActivityFeed('profile', this)">👤 Perfiles</button>
                            <button class="admin-btn-action ${window.adminTelemetryCache.activeActivityFilter === 'download' ? 'active' : ''}" onclick="window.filterAdminActivityFeed('download', this)">📥 Descargas</button>
                            <button class="admin-btn-action ${window.adminTelemetryCache.activeActivityFilter === 'course' ? 'active' : ''}" onclick="window.filterAdminActivityFeed('course', this)">📚 Cursos</button>
                            <button class="btn btn-secondary" onclick="window.fetchAdminCloudTelemetry(true)" style="font-size:0.78rem; padding:0.35rem 0.75rem; margin-left:0.4rem; display:inline-flex; align-items:center; gap:0.35rem;">
                                🔄 Actualizar en Vivo
                            </button>
                        </div>
                    </div>

                    <div id="admin-activity-timeline-container" class="admin-activity-timeline">
                        ${renderAdminActivityHtml(window.adminTelemetryCache.activity, window.adminTelemetryCache.activeActivityFilter)}
                    </div>
                </div>

                <!-- SECCIÓN 2.5: Gestión de Quizzes Oficiales, Contraseñas Independientes y Planilla de Calificaciones -->
                <div class="admin-quiz-box" style="margin-bottom:2.25rem;">
                    <div class="admin-quiz-header">
                        <div>
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                                <h4 style="color:#fff; font-size:1.15rem; margin:0; display:flex; align-items:center; gap:0.5rem;">
                                    📝 Gestión de Quizzes, Contraseñas por Evaluación y Planilla de Notas
                                </h4>
                                <span class="badge" style="background:rgba(124, 58, 237, 0.25); color:#c4b5fd; border:1px solid rgba(167, 139, 250, 0.4); font-size:0.72rem; padding:0.18rem 0.55rem;">
                                    MODO EVALUACIÓN OFICIAL
                                </span>
                            </div>
                            <p style="font-size:0.83rem; color:var(--text-muted); margin:0;">
                                Cada quiz de la lista tiene su contraseña independiente asignada. Los estudiantes seleccionan el quiz de la lista desplegable e ingresan con la clave correspondiente.
                            </p>
                        </div>
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                            <button class="btn btn-primary" onclick="window.adminSaveAllQuizPasswords()" style="font-size:0.8rem; padding:0.4rem 0.85rem; background:#7c3aed; border:none; display:inline-flex; align-items:center; gap:0.35rem; font-weight:700;">
                                💾 Guardar Todas las Contraseñas
                            </button>
                            <button class="btn btn-secondary" onclick="window.fetchAdminCloudTelemetry(true)" style="font-size:0.8rem; padding:0.4rem 0.85rem; display:inline-flex; align-items:center; gap:0.35rem;">
                                🔄 Refrescar Notas
                            </button>
                            <button class="btn btn-primary" onclick="window.adminDownloadQuizCsv()" style="font-size:0.8rem; padding:0.4rem 0.95rem; background:linear-gradient(135deg, #10b981, #059669); border:none; display:inline-flex; align-items:center; gap:0.35rem; font-weight:700;">
                                📥 Descargar Planilla Excel (CSV)
                            </button>
                        </div>
                    </div>

                    <!-- Configuración de Contraseñas Individuales por Quiz -->
                    <div style="margin-bottom:1.5rem; background:rgba(0,0,0,0.28); padding:1.2rem; border-radius:12px; border:1px solid rgba(255,255,255,0.07);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                            <span style="font-size:0.85rem; font-weight:700; color:#e2e8f0; text-transform:uppercase; letter-spacing:0.7px;">
                                🔑 Lista de Evaluaciones y sus Contraseñas de Ingreso:
                            </span>
                            <span style="font-size:0.75rem; color:#a78bfa; background:rgba(124,58,237,0.15); padding:0.2rem 0.6rem; border-radius:6px; border:1px solid rgba(124,58,237,0.3);">
                                5 Quizzes Oficiales Configurados
                            </span>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:0.85rem;">
                            ${(window.QUIZZES_DATA && window.QUIZZES_DATA.presets ? window.QUIZZES_DATA.presets : []).map(p => {
                                const currentPwd = getQuizPassword(p.id);
                                return `
                                    <div style="background:#0b1120; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem 1rem; display:flex; flex-direction:column; justify-content:space-between; gap:0.6rem;">
                                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                                            <div>
                                                <div style="font-size:0.72rem; color:#38bdf8; font-weight:700; text-transform:uppercase;">${p.badge || 'Quiz'}</div>
                                                <div style="font-weight:700; color:#fff; font-size:0.9rem; line-height:1.3;">${p.title}</div>
                                                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">🎯 ${p.totalPreguntas} preguntas · ⏱️ ~${p.tiempoSugeridoMin} min</div>
                                            </div>
                                        </div>

                                        <div style="display:flex; gap:0.4rem; align-items:center;">
                                            <div style="flex:1;">
                                                <label for="admin-pin-${p.id}" style="display:block; font-size:0.68rem; color:var(--text-muted); margin-bottom:0.2rem; text-transform:uppercase;">Contraseña / PIN:</label>
                                                <input type="text" id="admin-pin-${p.id}" value="${currentPwd}" style="width:100%; font-family:monospace; font-size:0.92rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:0.42rem 0.6rem; background:#0f172a; border:1px solid #7c3aed; color:#c4b5fd; border-radius:6px;" maxlength="16">
                                            </div>
                                            <button class="btn btn-primary" onclick="window.adminSaveSingleQuizPassword('${p.id}')" style="align-self:flex-end; font-size:0.75rem; padding:0.45rem 0.65rem; background:#7c3aed; border:none; height:34px; font-weight:700;" title="Guardar contraseña de este quiz">
                                                💾 Guardar
                                            </button>
                                            <button class="btn btn-secondary" onclick="window.openAdminQuizPreview('${p.id}')" style="align-self:flex-end; font-size:0.75rem; padding:0.45rem 0.65rem; border:1px solid #38bdf8; color:#38bdf8; height:34px;" title="Ver las preguntas de este quiz (Exclusivo Docente)">
                                                👁️ Ver
                                            </button>
                                            <button class="btn btn-secondary" onclick="window.adminCopyWhatsAppForQuiz('${p.id}')" style="align-self:flex-end; font-size:0.75rem; padding:0.45rem 0.65rem; border:1px solid #22c55e; color:#4ade80; height:34px;" title="Copiar invitación de WhatsApp con este PIN">
                                                📱 WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div style="margin-top:1rem; padding-top:0.85rem; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;">
                            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.82rem; color:#e2e8f0; cursor:pointer;">
                                <input type="checkbox" id="admin-quiz-antifraud" checked style="accent-color:#7c3aed; width:16px; height:16px;">
                                <span>🛡️ Protocolo Antifraude Estricto Activado (bloqueo de capturas, bloqueo de cambio de pestaña y orden aleatorio de preguntas)</span>
                            </label>
                            <span style="font-size:0.78rem; color:var(--text-muted);">
                                Cada estudiante recibe las preguntas en orden diferente.
                            </span>
                        </div>
                    </div>

                    <!-- Buscador y Tabla de Calificaciones de Estudiantes -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.6rem;">
                        <h5 style="color:#e2e8f0; font-size:0.95rem; margin:0; display:flex; align-items:center; gap:0.4rem;">
                            📊 Planilla de Estudiantes Evaluados
                        </h5>
                        <div class="admin-search-box" style="margin:0; max-width:320px;">
                            <span class="admin-search-icon">🔍</span>
                            <input type="text" id="admin-quiz-search-input" class="admin-search-input" placeholder="Buscar por estudiante, curso o PIN..." oninput="window.filterAdminQuizTable(this.value)" value="${window.adminTelemetryCache.quizFilterQuery || ''}">
                        </div>
                    </div>

                    <div id="admin-quiz-table-container">
                        ${renderAdminQuizResultsHtml(window.adminTelemetryCache.quizFilterQuery)}
                    </div>
                </div>

                <!-- Módulo Exclusivo y Privado: ManuSquash Garmin AI Pro -->
                <div style="margin-bottom:2rem; padding:1.25rem 1.5rem; background:linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(15, 23, 42, 0.9)); border:1px solid rgba(34, 211, 238, 0.35); border-radius:14px; box-shadow:0 8px 24px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem;">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div style="font-size:2.2rem; background:rgba(34,211,238,0.15); width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:14px; border:1px solid rgba(34,211,238,0.35); flex-shrink:0;">
                                ⌚
                            </div>
                            <div>
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem; flex-wrap:wrap;">
                                    <h4 style="color:#fff; font-size:1.15rem; margin:0; font-weight:700;">ManuSquash · Garmin AI Pro</h4>
                                    <span style="font-size:0.7rem; background:#0e7490; color:#cffafe; padding:0.18rem 0.6rem; border-radius:999px; font-weight:700; letter-spacing:0.5px;">PRIVADO · SOLO DOCENTE</span>
                                </div>
                                <p style="font-size:0.84rem; color:var(--text-muted); margin:0;">
                                    Tu monitor adaptativo personal (HRV, Readiness, Carga ACWR, Squash & Running en Popayán) sincronizado con tu Forerunner 970.
                                </p>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center;">
                            <a href="/garmin/" class="btn btn-primary" style="font-size:0.88rem; padding:0.55rem 1.15rem; background:linear-gradient(135deg, #0284c7, #06b6d4); border:none; display:inline-flex; align-items:center; gap:0.4rem; font-weight:700; box-shadow:0 0 16px rgba(6,182,212,0.35);">
                                <span>🚀 Abrir Garmin AI Pro</span>
                            </a>
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

                <!-- Configuración de Pasarela de Pagos (Wompi PSE / Nequi / Bancolombia) -->
                <div class="admin-payment-config-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem; flex-wrap:wrap; gap:0.5rem;">
                        <div>
                            <h4 style="color:#fff; font-size:1.1rem; margin:0 0 0.25rem; display:flex; align-items:center; gap:0.5rem;">
                                💳 Pasarela de Pagos & Recaudos (Wompi PSE / Nequi / Bancolombia)
                            </h4>
                            <div style="font-size:0.8rem; color:var(--text-muted);">
                                Configura cómo y dónde recibes los pagos cuando un estudiante o profesional adquiere cualquier curso en la web.
                            </div>
                        </div>
                        <span class="badge" style="${(getPaymentConfig().wompi.modo === 'produccion') ? 'background:rgba(16,185,129,0.2); color:#34D399; border-color:rgba(16,185,129,0.4);' : 'background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3);'} font-size:0.75rem;">
                            ${(getPaymentConfig().wompi.modo === 'produccion') ? '🟢 Modo Producción (Cobros Reales)' : '🧪 Modo Sandbox (Pruebas)'}
                        </span>
                    </div>

                    <!-- Guía rápida para el profesor -->
                    <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.2); border-radius:10px; padding:0.85rem 1rem; margin-bottom:1.25rem; font-size:0.82rem; line-height:1.45; color:#E2E8F0;">
                        <strong style="color:#38BDF8;">¿Cómo vincular tu cuenta bancaria para recibir dinero por PSE y Tarjeta?</strong><br>
                        1. Regístrate gratis en <a href="https://wompi.co" target="_blank" style="color:#38BDF8; font-weight:700; text-decoration:underline;">wompi.co</a> (Pasarela oficial de Bancolombia para Colombia).<br>
                        2. Vincula tu cuenta de ahorros Bancolombia o Nequi para recibir los desembolsos automáticos de tus ventas.<br>
                        3. En tu panel de Wompi ve a <em>Desarrolladores → Llaves de API</em>, copia tu <strong>Llave Pública</strong> (comienza con <code>pub_prod_...</code> para cobros reales o <code>pub_test_...</code> para pruebas) y pégala a continuación.
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
                        <div>
                            <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; display:block; margin-bottom:0.35rem;">
                                Modo de Operación Wompi:
                            </label>
                            <select id="cfg-wompi-mode" class="payment-form-input">
                                <option value="sandbox" ${getPaymentConfig().wompi.modo !== 'produccion' ? 'selected' : ''}>🧪 Modo Sandbox (Pruebas de pago sin costo)</option>
                                <option value="produccion" ${getPaymentConfig().wompi.modo === 'produccion' ? 'selected' : ''}>🟢 Modo Producción (PSE y Tarjetas Reales)</option>
                            </select>
                        </div>

                        <div>
                            <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; display:block; margin-bottom:0.35rem;">
                                Llave Pública Wompi (Public Key):
                            </label>
                            <input type="text" id="cfg-wompi-key" class="payment-form-input" style="font-family:monospace; font-size:0.82rem;" placeholder="pub_prod_... o pub_test_..." value="${getPaymentConfig().wompi.modo === 'produccion' ? (getPaymentConfig().wompi.llavePublicaProd || '') : (getPaymentConfig().wompi.llavePublicaTest || '')}" />
                        </div>

                        <div>
                            <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; display:block; margin-bottom:0.35rem;">
                                Celular Nequi / Daviplata:
                            </label>
                            <input type="text" id="cfg-direct-nequi" class="payment-form-input" value="${getPaymentConfig().pagoDirecto.nequi || '312 874 5821'}" />
                        </div>

                        <div>
                            <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; display:block; margin-bottom:0.35rem;">
                                Cuenta Bancolombia (Ahorros):
                            </label>
                            <input type="text" id="cfg-direct-bancolombia" class="payment-form-input" value="${getPaymentConfig().pagoDirecto.bancolombiaNumero || '865-000124-91'}" />
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                        <button class="btn btn-primary" onclick="guardarConfiguracionPasarelaAdmin()" style="font-size:0.88rem; padding:0.6rem 1.25rem;">
                            💾 Guardar Configuración de Pagos
                        </button>
                        <button class="btn btn-secondary" onclick="openPaymentModal('mecanica')" style="font-size:0.85rem; padding:0.55rem 0.95rem;">
                            🧪 Probar Checkout como Estudiante
                        </button>
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

        // Sincronizar automáticamente en segundo plano telemetría y perfiles
        fetchAdminCloudTelemetry(false);
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
        let v = parseInt(localStorage.getItem('physicsailab_real_visits') || '14', 10);
        v += n;
        localStorage.setItem('physicsailab_real_visits', v);
        fetch(`${FIREBASE_BASE}/counters.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ real_visits: v, last_visit: new Date().toISOString() })
        }).catch(() => {});
        updateVisitsDisplay(BASE_VISITS + v);
        renderAdminDashboardContent();
        showToast(`👁️ Se agregaron +${n} visitas reales. Total real: ${v.toLocaleString('es-ES')}`);
    };

    window.adminIncrementDownloads = function(n = 5) {
        let d = parseInt(localStorage.getItem('physicsailab_real_downloads') || '6', 10);
        d += n;
        localStorage.setItem('physicsailab_real_downloads', d);
        fetch(`${FIREBASE_BASE}/counters.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ real_downloads: d, last_download: new Date().toISOString() })
        }).catch(() => {});
        updateDownloadsDisplay(BASE_DOWNLOADS + d);
        renderAdminDashboardContent();
        showToast(`📥 Se agregaron +${n} descargas reales. Total real: ${d.toLocaleString('es-ES')}`);
    };

    window.adminResetCounter = function(type) {
        if (!confirm(`¿Estás seguro de restablecer el contador real de ${type === 'visits' ? 'visitas' : 'descargas'}?`)) return;
        if (type === 'visits') {
            localStorage.setItem('physicsailab_real_visits', 1);
            fetch(`${FIREBASE_BASE}/counters.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ real_visits: 1, last_visit: new Date().toISOString() })
            }).catch(() => {});
            updateVisitsDisplay(BASE_VISITS + 1);
        } else {
            localStorage.setItem('physicsailab_real_downloads', 0);
            fetch(`${FIREBASE_BASE}/counters.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ real_downloads: 0, last_download: new Date().toISOString() })
            }).catch(() => {});
            updateDownloadsDisplay(BASE_DOWNLOADS);
        }
        renderAdminDashboardContent();
        showToast(`🔄 Contador real de ${type === 'visits' ? 'visitas' : 'descargas'} restablecido.`);
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

    window.guardarConfiguracionPasarelaAdmin = function() {
        const modeElem = document.getElementById('cfg-wompi-mode');
        const keyElem = document.getElementById('cfg-wompi-key');
        const nequiElem = document.getElementById('cfg-direct-nequi');
        const bancoElem = document.getElementById('cfg-direct-bancolombia');

        const mode = modeElem ? modeElem.value : 'sandbox';
        const key = keyElem ? keyElem.value.trim() : '';
        const nequi = nequiElem ? nequiElem.value.trim() : '';
        const banco = bancoElem ? bancoElem.value.trim() : '';

        const current = getPaymentConfig();
        const updated = {
            ...current,
            wompi: {
                ...current.wompi,
                modo: mode,
                ...(mode === 'produccion' ? { llavePublicaProd: key } : { llavePublicaTest: key })
            },
            pagoDirecto: {
                ...current.pagoDirecto,
                nequi: nequi,
                daviplata: nequi,
                bancolombiaNumero: banco
            }
        };

        savePaymentConfig(updated);
        renderAdminDashboardContent();
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
        const likeInfo = getItemLikeInfo('fact-' + todayFact.id);

        container.innerHTML = `
            <div class="daily-fact-banner">
                <div class="daily-fact-header">
                    <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                        <span class="daily-pulse-tag">✨ DATO CURIOSO DEL DÍA</span>
                        <span class="daily-date-badge">📅 ${fechaHoyTexto}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
                        <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="fact-${todayFact.id}" onclick="toggleAtomLike('fact-${todayFact.id}', 'fact', this)" title="Dar un átomo de me gusta al dato del día">
                            <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                        </button>
                        <span class="daily-refresh-indicator">🔄 Rotación Diaria Automática</span>
                    </div>
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

        factsGrid.innerHTML = factsToRender.map(item => {
            const likeInfo = getItemLikeInfo('fact-' + item.id);
            return `
            <div class="fact-card" id="fact-card-${item.id}">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="fact-badge ${item.categoriaTag || ''}">
                            ${item.icono} ${item.categoria}
                        </span>
                        <button class="atom-like-btn ${likeInfo.liked ? 'liked' : ''}" data-atom-id="fact-${item.id}" onclick="toggleAtomLike('fact-${item.id}', 'fact', this)" title="Dar un átomo de me gusta">
                            <span class="atom-icon">⚛️</span> <span class="atom-count">${likeInfo.count}</span>
                        </button>
                    </div>
                    <h3 class="fact-title">${item.titulo}</h3>
                    <p class="fact-desc">${item.descripcion}</p>
                </div>
                <div class="fact-principle-box">
                    <span style="color:var(--accent-blue); font-weight:700;">🔬 Principio:</span>
                    <span style="color:var(--text-muted);">${item.principio}</span>
                </div>
            </div>
            `;
        }).join('');

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

    // =========================================================================
    // MÓDULO DE QUIZZES GAMIFICADOS ESTILO QUIZIZZ / WAYGROUND CON CÓDIGO PIN
    // =========================================================================
    const quizzesCatalogContainer = document.getElementById('quizzes-grid');
    const quizPlayerModal = document.getElementById('quiz-player-modal');
    const quizQuestionScreen = document.getElementById('quiz-question-screen');
    const quizResultsScreen = document.getElementById('quiz-results-screen');
    const quizFeedbackBanner = document.getElementById('quiz-feedback-banner');
    
    let quizSoundEnabled = localStorage.getItem('physicsailab_quiz_sound') !== 'false';
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playQuizAudio(type) {
        if (!quizSoundEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'correct') {
                // Arpegio brillante en Do Mayor (C5 - E5 - G5 - C6)
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + i * 0.08);
                    gain.gain.setValueAtTime(0, now + i * 0.08);
                    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.36);
                });
            } else if (type === 'incorrect') {
                // Zumbido grave descendente
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(140, now + 0.28);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.31);
            } else if (type === 'finish') {
                // Fanfarria victoriosa al culminar el examen
                const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                melody.forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, now + i * 0.1);
                    gain.gain.setValueAtTime(0, now + i * 0.1);
                    gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.46);
                });
            } else if (type === 'click') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            }
        } catch (e) {}
    }

    window.toggleQuizSound = function() {
        quizSoundEnabled = !quizSoundEnabled;
        localStorage.setItem('physicsailab_quiz_sound', quizSoundEnabled);
        const btn = document.getElementById('player-sound-btn');
        if (btn) {
            btn.textContent = quizSoundEnabled ? '🔊' : '🔇';
            btn.title = quizSoundEnabled ? 'Sonido activado (clic para silenciar)' : 'Sonido silenciado (clic para activar)';
        }
        if (quizSoundEnabled) playQuizAudio('click');
    };

    let activeQuiz = {
        preset: null,
        title: '',
        roomCode: '',
        questions: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctCount: 0,
        wrongCount: 0,
        answeredCurrent: false,
        userAnswers: [],
        startTime: null
    };

    function renderQuizzesCatalog() {
        if (!quizzesCatalogContainer) return;
        const qData = window.QUIZZES_DATA;
        if (!qData || !qData.presets) {
            quizzesCatalogContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Cargando banco oficial de quizzes...</p>';
            return;
        }

        quizzesCatalogContainer.innerHTML = qData.presets.map(p => `
            <div class="quiz-preset-card">
                <div class="quiz-preset-top">
                    <span class="quiz-preset-badge">${p.badge || '🎮 Quiz Oficial'}</span>
                    <h3 class="quiz-preset-title">${p.title}</h3>
                    <div class="quiz-preset-sub">${p.subtitle}</div>
                    <p class="quiz-preset-desc">${p.description}</p>
                    <div class="quiz-preset-meta">
                        <span class="quiz-meta-pill">🎯 ${p.totalPreguntas} Preguntas</span>
                        <span class="quiz-meta-pill">⏱️ ~${p.tiempoSugeridoMin} Min</span>
                        <span class="quiz-meta-pill pin-pill">🔒 Con Contraseña del Docente</span>
                    </div>
                </div>
                <button type="button" class="quiz-play-btn" onclick="selectQuizAndScrollToForm('${p.id}')">
                    <span>🚀 Presentar Evaluación</span>
                </button>
            </div>
        `).join('');
    }

    window.selectQuizAndScrollToForm = function(quizId) {
        const selectDropdown = document.getElementById('quiz-select-dropdown');
        if (selectDropdown) selectDropdown.value = quizId;
        const formEl = document.getElementById('quiz-join-form');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInput = document.getElementById('quiz-student-name');
        if (nameInput && !nameInput.value.trim()) {
            setTimeout(() => nameInput.focus(), 400);
            showToast('✍️ Escribe tu Nombre y Apellidos y la contraseña asignada por tu docente.');
        } else {
            const pinInput = document.getElementById('quiz-pin-input');
            if (pinInput) setTimeout(() => pinInput.focus(), 400);
        }
    };

    function updateQuizWatermark(studentName, pin) {
        const watermarkEl = document.getElementById('quiz-security-watermark');
        if (!watermarkEl) return;
        const sessId = (activeQuiz && activeQuiz.sessionId) || ('UNICAUCA-' + Math.random().toString(36).substring(2, 6).toUpperCase());
        const text = `👤 ${studentName} · 🔑 PIN: ${pin} · 🛡️ UNICAUCA OFICIAL #${sessId}`;
        let stamps = '';
        for (let i = 0; i < 36; i++) {
            stamps += `<span class="watermark-stamp">${text}</span>`;
        }
        watermarkEl.innerHTML = stamps;
        watermarkEl.style.display = 'grid';
    }

    let antiCheatActive = false;

    function triggerAntiCheatAlert(type, message) {
        const banner = document.getElementById('quiz-security-banner');
        const textEl = document.getElementById('quiz-security-text') || document.getElementById('sec-banner-desc');
        if (banner) {
            if (textEl) textEl.innerHTML = message;
            banner.style.display = 'flex';
            if (window._securityBannerTimeout) clearTimeout(window._securityBannerTimeout);
            window._securityBannerTimeout = setTimeout(() => {
                banner.style.display = 'none';
            }, 6500);
        }

        const qScreen = document.getElementById('quiz-question-screen');
        if (qScreen) qScreen.style.filter = 'blur(25px)';

        const shield = document.getElementById('quiz-blackout-shield');
        if (shield) {
            shield.style.display = 'flex';
            shield.style.opacity = '1';
            if (type === 'screenshot') {
                setTimeout(() => {
                    shield.style.opacity = '0';
                    setTimeout(() => { 
                        shield.style.display = 'none'; 
                        shield.style.opacity = '1';
                        if (qScreen) qScreen.style.filter = 'none';
                    }, 250);
                }, 1800);
            }
        }

        playQuizAudio('incorrect');
    }

    function onTouchStartGuard(e) {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
            activeQuiz.tabSwitches = (activeQuiz.tabSwitches || 0) + 1;
            triggerAntiCheatAlert('touch', `⚠️ <strong>GESTO NO PERMITIDO:</strong> Se detectó toque con múltiples dedos en pantalla (#${activeQuiz.tabSwitches}). Solo se permite un dedo para contestar.`);
            logRealActivity(`[ANTIFRAUDE] Alumno "${activeQuiz.studentName}" ejecutó gesto multi-touch (#${activeQuiz.tabSwitches})`, 'quiz');
            return false;
        }
    }

    function onTouchCancelGuard(e) {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        activeQuiz.tabSwitches = (activeQuiz.tabSwitches || 0) + 1;
        triggerAntiCheatAlert('touch', `⚠️ <strong>ALERTA DE SEGURIDAD MÓVIL:</strong> Se detectó interrupción touch o captura de pantalla (#${activeQuiz.tabSwitches}).`);
        logRealActivity(`[ANTIFRAUDE] Interrupción touch en iPhone/móvil para "${activeQuiz.studentName}" (#${activeQuiz.tabSwitches})`, 'quiz');
    }

    function onGestureGuard(e) {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        e.preventDefault();
        return false;
    }

    function onPageHideGuard() {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        activeQuiz.tabSwitches = (activeQuiz.tabSwitches || 0) + 1;
        triggerAntiCheatAlert('tab', `⚠️ <strong>ALERTA DE SEGURIDAD MÓVIL:</strong> Se detectó cambio de aplicación o suspensión (#${activeQuiz.tabSwitches}).`);
        logRealActivity(`[ANTIFRAUDE] Dispositivo móvil suspendido/cambio de app para "${activeQuiz.studentName}" (#${activeQuiz.tabSwitches})`, 'quiz');
    }

    function onVisibilityChange() {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        if (document.hidden || document.visibilityState === 'hidden') {
            activeQuiz.tabSwitches = (activeQuiz.tabSwitches || 0) + 1;
            
            const shield = document.getElementById('quiz-blackout-shield');
            if (shield) {
                shield.style.display = 'flex';
                shield.style.opacity = '1';
                shield.innerHTML = `
                    <div class="blackout-message" style="max-width:540px; text-align:center;">
                        <div style="font-size:2.8rem; margin-bottom:0.75rem;">🚫</div>
                        <h3 style="margin:0 0 0.5rem 0; color:#fff; font-size:1.3rem;">CAMBIO DE PESTAÑA DETECTADO</h3>
                        <p style="font-size:0.95rem; color:#fca5a5; line-height:1.45; margin-bottom:1.25rem;">
                            Se detectó que minimizaste el navegador o cambiaste de pestaña o aplicación.<br>
                            <strong>Incidencia registrada: #${activeQuiz.tabSwitches}</strong> en la planilla oficial de notas.
                        </p>
                        <button type="button" onclick="resumeQuizFromBlackout()" style="background:#dc2626; color:#fff; border:none; padding:0.75rem 1.6rem; font-weight:800; border-radius:10px; cursor:pointer; font-size:1rem; box-shadow:0 4px 15px rgba(220,38,38,0.5);">
                            ⚠️ Reanudar Evaluación
                        </button>
                    </div>
                `;
            }
            triggerAntiCheatAlert('tab', `⚠️ <strong>ALERTA DE SEGURIDAD:</strong> Se detectó cambio de pestaña o aplicación. Incidencia registrada en el informe del docente (#${activeQuiz.tabSwitches}).`);
            logRealActivity(`[ANTIFRAUDE] Alumno "${activeQuiz.studentName}" cambió de pestaña en evaluación "${activeQuiz.title}" (Incidente #${activeQuiz.tabSwitches})`, 'quiz');
        }
    }

    function onWindowBlur() {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        // Si la ventana pierde el foco (ej. alt-tab, clic en otra pantalla o recorte de captura), oscurecer de inmediato
        const shield = document.getElementById('quiz-blackout-shield');
        if (shield && shield.style.display !== 'flex') {
            shield.style.display = 'flex';
            shield.style.opacity = '1';
            shield.innerHTML = `
                <div class="blackout-message" style="max-width:540px; text-align:center;">
                    <div style="font-size:2.8rem; margin-bottom:0.75rem;">🚫</div>
                    <h3 style="margin:0 0 0.5rem 0; color:#fff; font-size:1.3rem;">VENTANA FUERA DE FOCO</h3>
                    <p style="font-size:0.95rem; color:#fca5a5; line-height:1.45; margin-bottom:1.25rem;">
                        La ventana de la evaluación perdió el foco activo.<br>
                        Por seguridad académica no se permite interactuar con otras ventanas.
                    </p>
                    <button type="button" onclick="resumeQuizFromBlackout()" style="background:#dc2626; color:#fff; border:none; padding:0.75rem 1.6rem; font-weight:800; border-radius:10px; cursor:pointer; font-size:1rem;">
                        ⚠️ Volver a la Evaluación
                    </button>
                </div>
            `;
        }
        activeQuiz.tabSwitches = (activeQuiz.tabSwitches || 0) + 1;
        triggerAntiCheatAlert('tab', `⚠️ <strong>ALERTA DE SEGURIDAD:</strong> La ventana del examen perdió el foco (#${activeQuiz.tabSwitches}).`);
        logRealActivity(`[ANTIFRAUDE] Alumno "${activeQuiz.studentName}" perdió foco de la ventana en "${activeQuiz.title}" (Incidente #${activeQuiz.tabSwitches})`, 'quiz');
    }

    function onFullscreenChange() {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
        if (!isFullscreen) {
            activeQuiz.tabSwitches = (activeQuiz.tabSwitches || 0) + 1;
            const shield = document.getElementById('quiz-blackout-shield');
            if (shield) {
                shield.style.display = 'flex';
                shield.style.opacity = '1';
                shield.innerHTML = `
                    <div class="blackout-message" style="max-width:540px; text-align:center;">
                        <div style="font-size:2.8rem; margin-bottom:0.75rem;">🖥️</div>
                        <h3 style="margin:0 0 0.5rem 0; color:#fff; font-size:1.3rem;">PANTALLA COMPLETA OBLIGATORIA</h3>
                        <p style="font-size:0.95rem; color:#fca5a5; line-height:1.45; margin-bottom:1.25rem;">
                            Has salido del modo de pantalla completa. Por protocolo antifraude la prueba debe realizarse a pantalla completa.<br>
                            <strong>Incidencia registrada: #${activeQuiz.tabSwitches}</strong>.
                        </p>
                        <button type="button" onclick="resumeQuizFullscreen()" style="background:#7c3aed; color:#fff; border:none; padding:0.75rem 1.6rem; font-weight:800; border-radius:10px; cursor:pointer; font-size:1rem; box-shadow:0 4px 15px rgba(124,58,237,0.5);">
                            🖥️ Volver a Pantalla Completa
                        </button>
                    </div>
                `;
            }
            triggerAntiCheatAlert('tab', `⚠️ <strong>ALERTA DE SEGURIDAD:</strong> Salida de pantalla completa registrada (#${activeQuiz.tabSwitches}).`);
            logRealActivity(`[ANTIFRAUDE] Alumno "${activeQuiz.studentName}" salió de pantalla completa en "${activeQuiz.title}" (Incidente #${activeQuiz.tabSwitches})`, 'quiz');
        }
    }

    window.resumeQuizFromBlackout = function() {
        const shield = document.getElementById('quiz-blackout-shield');
        if (shield) shield.style.display = 'none';
        const qScreen = document.getElementById('quiz-question-screen');
        if (qScreen) qScreen.style.filter = 'none';
        try {
            if (document.documentElement && document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}
    };

    window.resumeQuizFullscreen = function() {
        const shield = document.getElementById('quiz-blackout-shield');
        if (shield) shield.style.display = 'none';
        try {
            if (document.documentElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}
    };

    function onKeyDownGuard(e) {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;

        const key = (e.key || '').toLowerCase();
        const code = (e.code || '').toLowerCase();

        const isPrintScreen = (key === 'printscreen' || code === 'printscreen');
        const isSnippingTool = (e.shiftKey && (e.metaKey || key === 's') && (e.ctrlKey || e.metaKey));
        const isMacScreenshot = (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key));
        const isInspect = (key === 'f12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)));
        const isCopySave = ((e.ctrlKey || e.metaKey) && ['c', 'u', 's', 'p', 'a', 'x', 'v'].includes(key));

        if (isPrintScreen || isSnippingTool || isMacScreenshot || isInspect || isCopySave) {
            e.preventDefault();
            e.stopPropagation();
            activeQuiz.screenshotAttempts = (activeQuiz.screenshotAttempts || 0) + 1;
            
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('');
                }
            } catch (err) {}

            const shield = document.getElementById('quiz-blackout-shield');
            if (shield) {
                shield.style.display = 'flex';
                shield.style.opacity = '1';
                shield.innerHTML = `
                    <div class="blackout-message" style="max-width:540px; text-align:center;">
                        <div style="font-size:2.8rem; margin-bottom:0.75rem;">🚫</div>
                        <h3 style="margin:0 0 0.5rem 0; color:#fff; font-size:1.3rem;">CAPTURA BLOQUEADA</h3>
                        <p style="font-size:0.95rem; color:#fca5a5; line-height:1.45; margin-bottom:1.25rem;">
                            Por seguridad académica está prohibido capturar, copiar o inspeccionar preguntas.<br>
                            <strong>Intento registrado: #${activeQuiz.screenshotAttempts}</strong> en el reporte docente.
                        </p>
                        <button type="button" onclick="resumeQuizFromBlackout()" style="background:#dc2626; color:#fff; border:none; padding:0.75rem 1.6rem; font-weight:800; border-radius:10px; cursor:pointer; font-size:1rem;">
                            Continuar Evaluación
                        </button>
                    </div>
                `;
            }

            triggerAntiCheatAlert('screenshot', `🚫 <strong>CAPTURA BLOQUEADA:</strong> Por seguridad académica está prohibido capturar o copiar preguntas. Intento registrado (#${activeQuiz.screenshotAttempts}).`);
            logRealActivity(`[ANTIFRAUDE] Intento de captura de pantalla bloqueado para "${activeQuiz.studentName}" en "${activeQuiz.title}" (#${activeQuiz.screenshotAttempts})`, 'quiz');
            return false;
        }
    }

    function onClipboardGuard(e) {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        e.preventDefault();
        return false;
    }

    function onContextMenuGuard(e) {
        if (!antiCheatActive || !activeQuiz || !activeQuiz.antiFraudEnabled) return;
        e.preventDefault();
        return false;
    }

    function onPopStateGuard(e) {
        if (!antiCheatActive || !activeQuiz) return;
        history.pushState({ inQuiz: true }, '');
        alert('⚠️ ATENCIÓN: No está permitido regresar a preguntas anteriores durante la evaluación oficial. Continúa hacia adelante.');
    }

    function onBeforeUnloadGuard(e) {
        if (!antiCheatActive || !activeQuiz) return;
        e.preventDefault();
        e.returnValue = '¿Seguro que deseas salir de la evaluación oficial? Tus respuestas no se guardarán.';
        return e.returnValue;
    }

    function setupAntiCheatListeners() {
        antiCheatActive = true;
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focusout', onWindowBlur);
        window.addEventListener('pagehide', onPageHideGuard);
        window.addEventListener('freeze', onPageHideGuard);
        window.addEventListener('keydown', onKeyDownGuard, true);
        window.addEventListener('contextmenu', onContextMenuGuard);
        window.addEventListener('popstate', onPopStateGuard);
        window.addEventListener('beforeunload', onBeforeUnloadGuard);

        // Touch & gestos en iPhone y Android
        document.addEventListener('touchstart', onTouchStartGuard, { passive: false });
        document.addEventListener('touchcancel', onTouchCancelGuard, { passive: false });
        document.addEventListener('gesturestart', onGestureGuard, { passive: false });
        document.addEventListener('gesturechange', onGestureGuard, { passive: false });
        document.addEventListener('gestureend', onGestureGuard, { passive: false });

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('copy', onClipboardGuard);
        document.addEventListener('cut', onClipboardGuard);
        document.addEventListener('paste', onClipboardGuard);
        document.addEventListener('selectstart', onClipboardGuard);

        try {
            history.pushState({ inQuiz: true }, '');
        } catch (e) {}

        try {
            if (document.documentElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}
    }

    function removeAntiCheatListeners() {
        antiCheatActive = false;
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onWindowBlur);
        window.removeEventListener('focusout', onWindowBlur);
        window.removeEventListener('pagehide', onPageHideGuard);
        window.removeEventListener('freeze', onPageHideGuard);
        window.removeEventListener('keydown', onKeyDownGuard, true);
        window.removeEventListener('contextmenu', onContextMenuGuard);
        window.removeEventListener('popstate', onPopStateGuard);
        window.removeEventListener('beforeunload', onBeforeUnloadGuard);

        document.removeEventListener('touchstart', onTouchStartGuard);
        document.removeEventListener('touchcancel', onTouchCancelGuard);
        document.removeEventListener('gesturestart', onGestureGuard);
        document.removeEventListener('gesturechange', onGestureGuard);
        document.removeEventListener('gestureend', onGestureGuard);

        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('copy', onClipboardGuard);
        document.removeEventListener('cut', onClipboardGuard);
        document.removeEventListener('paste', onClipboardGuard);
        document.removeEventListener('selectstart', onClipboardGuard);

        if (window._quizClockInterval) {
            clearInterval(window._quizClockInterval);
            window._quizClockInterval = null;
        }
        const stamp = document.getElementById('q-mobile-security-stamp');
        if (stamp) stamp.remove();

        const banner = document.getElementById('quiz-security-banner');
        if (banner) banner.style.display = 'none';

        const shield = document.getElementById('quiz-blackout-shield');
        if (shield) shield.style.display = 'none';

        const watermarkEl = document.getElementById('quiz-security-watermark');
        if (watermarkEl) watermarkEl.style.display = 'none';

        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        } catch (e) {}
    }

    function startQuizWithPreset(preset, studentName, studentCourse, customPin) {
        const qData = window.QUIZZES_DATA;
        if (!qData || !qData.questions) {
            alert('El banco de preguntas no está disponible en este momento.');
            return;
        }

        // Función para barajar aleatoriamente las preguntas (Fisher-Yates shuffle)
        function shuffleQuestionsArray(arr) {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            return copy;
        }

        // Obtener preguntas completas asociadas a este preset
        const rawQuestions = (preset.questionIds || [])
            .map(id => qData.questions.find(q => q.id === id))
            .filter(Boolean);

        if (rawQuestions.length === 0) {
            alert('No se encontraron preguntas para este cuestionario.');
            return;
        }

        // Mezclar las preguntas en orden aleatorio único para cada estudiante
        const questions = shuffleQuestionsArray(rawQuestions);

        const adminCfg = getAdminQuizConfig();
        const activeStudent = studentName || (activeQuiz && activeQuiz.studentName) || 'Estudiante';
        const activeCourse = studentCourse || (activeQuiz && activeQuiz.studentCourse) || '';
        const roomCode = customPin || adminCfg.pin || preset.code;

        activeQuiz = {
            preset: preset,
            title: preset.title,
            roomCode: roomCode,
            studentName: activeStudent,
            studentCourse: activeCourse,
            antiFraudEnabled: adminCfg.antiFraudEnabled !== false,
            tabSwitches: 0,
            screenshotAttempts: 0,
            questions: questions,
            currentIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctCount: 0,
            wrongCount: 0,
            answeredCurrent: false,
            userAnswers: [],
            startTime: Date.now()
        };

        // Configurar UI del reproductor
        if (quizPlayerModal) {
            quizPlayerModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        // Badge de estudiante en cabecera
        const studentBadge = document.getElementById('player-student-badge');
        if (studentBadge) {
            studentBadge.innerHTML = `👤 <strong>${activeStudent}</strong>${activeCourse ? ` · <span style="opacity:0.85;">(${activeCourse})</span>` : ''}`;
            studentBadge.style.display = 'inline-flex';
        }

        // Activar marca de agua antifraude personalizada
        updateQuizWatermark(activeStudent, roomCode);

        // Activar sistema antifraude
        setupAntiCheatListeners();

        const soundBtn = document.getElementById('player-sound-btn');
        if (soundBtn) {
            soundBtn.textContent = quizSoundEnabled ? '🔊' : '🔇';
        }

        playQuizAudio('click');
        renderCurrentQuizQuestion();

        // Registrar en telemetría Firebase
        logRealActivity(`Estudiante "${activeStudent}" inició evaluación "${preset.title}" con PIN [${roomCode}] (${questions.length} preguntas)`, 'quiz');
    }

    function renderCurrentQuizQuestion() {
        if (!activeQuiz.questions || activeQuiz.currentIndex >= activeQuiz.questions.length) {
            showQuizFinalResults();
            return;
        }

        activeQuiz.answeredCurrent = false;
        const q = activeQuiz.questions[activeQuiz.currentIndex];
        const total = activeQuiz.questions.length;
        const currNum = activeQuiz.currentIndex + 1;

        // Topbar
        const roomBadge = document.getElementById('player-room-badge');
        if (roomBadge) roomBadge.textContent = `🎯 PIN: ${activeQuiz.roomCode}`;

        const streakBadge = document.getElementById('player-streak-badge');
        if (streakBadge) streakBadge.textContent = `🔥 Racha x${activeQuiz.streak}`;

        const currentIdxEl = document.getElementById('player-current-idx');
        if (currentIdxEl) currentIdxEl.textContent = currNum;

        const totalCountEl = document.getElementById('player-total-count');
        if (totalCountEl) totalCountEl.textContent = total;

        const progressFill = document.getElementById('player-progress-fill');
        if (progressFill) {
            const pct = Math.round(((currNum - 1) / total) * 100);
            progressFill.style.width = `${pct}%`;
        }

        const scoreEl = document.getElementById('player-score-value');
        if (scoreEl) scoreEl.textContent = activeQuiz.score.toLocaleString('es-ES');

        // Question Screen
        if (quizQuestionScreen) quizQuestionScreen.style.display = 'flex';
        if (quizResultsScreen) quizResultsScreen.style.display = 'none';

        // Question Meta
        const numTag = document.getElementById('q-num-tag');
        if (numTag) numTag.textContent = `Pregunta ${q.num || currNum}`;

        const topicTag = document.getElementById('q-topic-tag');
        if (topicTag) topicTag.textContent = q.tema || 'Cinemática & Dinámica';

        const catTag = document.getElementById('q-cat-tag');
        if (catTag) {
            const catMap = {
                'concepto': '🧠 Concepto',
                'calculo': '📐 Cálculo',
                'grafica': '📊 Gráfica'
            };
            catTag.textContent = catMap[q.categoria] || (q.categoria ? q.categoria.toUpperCase() : 'GENERAL');
        }

        // Sello de Seguridad Dinámico Móvil con Reloj en Tiempo Real
        let secStamp = document.getElementById('q-mobile-security-stamp');
        if (!secStamp) {
            const qBox = document.querySelector('.quiz-question-box');
            if (qBox) {
                secStamp = document.createElement('div');
                secStamp.id = 'q-mobile-security-stamp';
                secStamp.className = 'mobile-security-stamp';
                qBox.insertBefore(secStamp, qBox.firstChild);
            }
        }
        if (secStamp) {
            secStamp.innerHTML = `
                <span>👤 <strong>${activeQuiz.studentName}</strong> (${activeQuiz.studentCourse || 'Evaluación Oficial'})</span>
                <span>🔑 PIN: <strong>${activeQuiz.roomCode}</strong></span>
                <span>🕒 <strong id="q-live-clock">${new Date().toLocaleTimeString('es-ES')}</strong> · <span style="color:#ef4444; font-weight:800;">AUDITADO</span></span>
            `;
        }
        if (!window._quizClockInterval) {
            window._quizClockInterval = setInterval(() => {
                const clockEl = document.getElementById('q-live-clock');
                if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('es-ES');
            }, 1000);
        }

        // Question Text
        const qTextEl = document.getElementById('q-question-text');
        if (qTextEl) qTextEl.textContent = q.pregunta;

        // Diagram / Gráfica (16 preguntas del cuestionario tienen gráfica)
        const diagramWrapper = document.getElementById('q-diagram-wrapper');
        const diagramContainer = document.getElementById('q-diagram-container');
        if (diagramWrapper && diagramContainer) {
            if (q.graficaSvg) {
                diagramWrapper.style.display = 'flex';
                diagramContainer.innerHTML = q.graficaSvg;
            } else if (q.imagen) {
                diagramWrapper.style.display = 'flex';
                diagramContainer.innerHTML = `<img src="${q.imagen}" alt="Diagrama de evaluación">`;
            } else {
                diagramWrapper.style.display = 'none';
                diagramContainer.innerHTML = '';
            }
        }

        // Cuadrícula de 4 Opciones Estilo Quizizz / Kahoot
        const optionsContainer = document.getElementById('q-options-container');
        if (optionsContainer) {
            const optStyles = [
                { cls: 'opt-red', shape: '▲', letter: 'A' },
                { cls: 'opt-blue', shape: '◆', letter: 'B' },
                { cls: 'opt-yellow', shape: '●', letter: 'C' },
                { cls: 'opt-green', shape: '■', letter: 'D' }
            ];

            optionsContainer.innerHTML = (q.opciones || []).map((optStr, idx) => {
                const style = optStyles[idx] || optStyles[0];
                // Limpiar prefijo "A. ", "B. ", etc. si existe para no duplicarlo visualmente
                const cleanText = optStr.replace(/^[A-D]\.\s*/, '');
                return `
                    <button type="button" class="quiz-opt-btn ${style.cls}" data-letter="${style.letter}" onclick="handleQuizOptionSelect('${style.letter}', ${idx})">
                        <span class="opt-badge">
                            <span class="opt-shape">${style.shape}</span>
                            <span class="opt-letter">${style.letter}</span>
                        </span>
                        <span class="opt-text">${cleanText}</span>
                    </button>
                `;
            }).join('');
        }

        // Ocultar banner de feedback
        if (quizFeedbackBanner) quizFeedbackBanner.style.display = 'none';

        // Scroll al inicio del modal
        if (quizPlayerModal) quizPlayerModal.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.handleQuizOptionSelect = function(letter, optIndex) {
        if (activeQuiz.answeredCurrent) return;
        activeQuiz.answeredCurrent = true;

        const q = activeQuiz.questions[activeQuiz.currentIndex];
        if (!q) return;

        const isCorrect = (letter.trim().toUpperCase() === q.correcta.trim().toUpperCase());
        const optionsContainer = document.getElementById('q-options-container');
        const allButtons = optionsContainer ? optionsContainer.querySelectorAll('.quiz-opt-btn') : [];

        // Deshabilitar y resaltar opciones visualmente
        allButtons.forEach(btn => {
            btn.disabled = true;
            const btnLetter = btn.getAttribute('data-letter');
            if (btnLetter === q.correcta) {
                btn.classList.add('is-correct');
            } else if (!isCorrect && btnLetter === letter) {
                btn.classList.add('is-incorrect');
            } else {
                btn.classList.add('is-dimmed');
            }
        });

        // Actualizar estadísticas y puntaje
        let pointsGained = 0;
        if (isCorrect) {
            activeQuiz.streak++;
            if (activeQuiz.streak > activeQuiz.maxStreak) {
                activeQuiz.maxStreak = activeQuiz.streak;
            }
            pointsGained = 100 + ((activeQuiz.streak - 1) * 25);
            activeQuiz.score += pointsGained;
            activeQuiz.correctCount++;
            playQuizAudio('correct');

            // Animación de racha
            const streakBadge = document.getElementById('player-streak-badge');
            if (streakBadge) {
                streakBadge.textContent = `🔥 Racha x${activeQuiz.streak}`;
                streakBadge.classList.add('streak-pop');
                setTimeout(() => streakBadge.classList.remove('streak-pop'), 300);
            }
        } else {
            activeQuiz.streak = 0;
            activeQuiz.wrongCount++;
            playQuizAudio('incorrect');

            const streakBadge = document.getElementById('player-streak-badge');
            if (streakBadge) streakBadge.textContent = `🔥 Racha x0`;
        }

        const scoreEl = document.getElementById('player-score-value');
        if (scoreEl) scoreEl.textContent = activeQuiz.score.toLocaleString('es-ES');

        // Guardar respuesta del estudiante para la revisión final
        const selectedOptText = (q.opciones || []).find(o => o.startsWith(letter + '.')) || `${letter}. ${letter}`;
        const correctOptText = (q.opciones || []).find(o => o.startsWith(q.correcta + '.')) || `${q.correcta}. ${q.correcta}`;
        activeQuiz.userAnswers.push({
            question: q,
            selectedLetter: letter,
            selectedText: selectedOptText,
            isCorrect: isCorrect,
            correctLetter: q.correcta,
            correctText: correctOptText
        });

        // Configurar y mostrar banner de feedback inmediato
        if (quizFeedbackBanner) {
            quizFeedbackBanner.className = 'quiz-feedback-banner ' + (isCorrect ? 'feedback-correct' : 'feedback-incorrect');
            
            const iconEl = document.getElementById('feedback-icon');
            if (iconEl) iconEl.textContent = isCorrect ? '🎉' : '❌';

            const titleEl = document.getElementById('feedback-title');
            if (titleEl) titleEl.textContent = isCorrect ? '¡RESPUESTA CORRECTA!' : '¡RESPUESTA INCORRECTA!';

            const descEl = document.getElementById('feedback-desc');
            if (descEl) {
                descEl.textContent = isCorrect 
                    ? `+${pointsGained} Puntos · ¡Racha de ${activeQuiz.streak} seguidas!` 
                    : `La respuesta correcta era la opción ${q.correcta}`;
            }

            const expTextEl = document.getElementById('feedback-explanation-text');
            if (expTextEl) {
                expTextEl.textContent = q.explicacion || 'Revisa los principios físicos del tema.';
            }

            const nextBtn = document.getElementById('feedback-next-btn');
            if (nextBtn) {
                const isLast = (activeQuiz.currentIndex + 1 >= activeQuiz.questions.length);
                nextBtn.innerHTML = isLast ? '<span>Ver Resultados Finales 🏆</span>' : '<span>Siguiente Pregunta ➔</span>';
            }

            quizFeedbackBanner.style.display = 'block';

            // Scroll suave hacia el feedback si la pantalla es móvil
            setTimeout(() => {
                quizFeedbackBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    };

    window.nextQuizQuestion = function() {
        playQuizAudio('click');
        activeQuiz.currentIndex++;
        if (activeQuiz.currentIndex < activeQuiz.questions.length) {
            renderCurrentQuizQuestion();
        } else {
            showQuizFinalResults();
        }
    };

    function showQuizFinalResults() {
        playQuizAudio('finish');
        removeAntiCheatListeners();

        const total = activeQuiz.questions.length;
        const correct = activeQuiz.correctCount;
        const wrong = activeQuiz.wrongCount;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const gradeNum = total > 0 ? ((correct / total) * 5.0) : 0;
        const grade = gradeNum.toFixed(1);
        const timeSpentSeconds = Math.round((Date.now() - activeQuiz.startTime) / 1000);

        // Barra de progreso llena
        const progressFill = document.getElementById('player-progress-fill');
        if (progressFill) progressFill.style.width = '100%';

        // Guardar registro de la evaluación para planilla de notas
        const recordId = 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const evalRecord = {
            id: recordId,
            studentName: activeQuiz.studentName || 'Estudiante Anónimo',
            course: activeQuiz.studentCourse || 'General',
            quizTitle: activeQuiz.title,
            presetId: activeQuiz.preset ? activeQuiz.preset.id : 'custom',
            roomPin: activeQuiz.roomCode,
            grade: Number(gradeNum.toFixed(1)),
            correctCount: correct,
            wrongCount: wrong,
            totalQuestions: total,
            accuracy: accuracy,
            score: activeQuiz.score,
            timeSpentSeconds: timeSpentSeconds,
            tabSwitches: activeQuiz.tabSwitches || 0,
            screenshotAttempts: activeQuiz.screenshotAttempts || 0,
            completedAt: new Date().toISOString(),
            device: (/Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Móvil' : 'PC / Laptop')
        };

        // Guardar localmente
        const localResults = getStoredQuizResults();
        localResults.unshift(evalRecord);
        localStorage.setItem('physicsailab_quiz_results', JSON.stringify(localResults.slice(0, 200)));

        if (!window.adminTelemetryCache.quizResults) {
            window.adminTelemetryCache.quizResults = {};
        }
        window.adminTelemetryCache.quizResults[recordId] = evalRecord;

        // Guardar en Firebase Realtime Database
        fetch(`${FIREBASE_BASE}/quiz_results/${recordId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(evalRecord)
        }).catch(() => {});

        // Preguntas falladas
        const failedList = activeQuiz.userAnswers.filter(a => !a.isCorrect);

        // Rangos de calificación académica universitaria
        let trophy = '🏆';
        let rankTitle = '¡Sobresaliente! Maestro de la Física';
        let rankSub = 'Dominas con excelencia los conceptos, ecuaciones y gráficas evaluadas.';
        if (gradeNum < 3.0) {
            trophy = '📚';
            rankTitle = 'Necesitas Repasar Conceptos Clave';
            rankSub = 'La física premia el análisis constante. Revisa con detalle cada pregunta fallada a continuación.';
        } else if (gradeNum < 3.8) {
            trophy = '💡';
            rankTitle = '¡Aprobado! Buen Esfuerzo';
            rankSub = 'Tienes una base sólida. Analiza las explicaciones de tus fallos para alcanzar el nivel sobresaliente.';
        } else if (gradeNum < 4.5) {
            trophy = '🎯';
            rankTitle = '¡Notable Desempeño!';
            rankSub = 'Has superado el examen con un porcentaje muy alto de aciertos.';
        }

        // Construir HTML del desglose de errores ("en qué preguntas falló")
        let failedSectionHtml = '';
        if (failedList.length === 0) {
            failedSectionHtml = `
                <div class="perfect-score-banner">
                    <h4>🌟 ¡Puntaje Perfecto! Cero Fallos</h4>
                    <p>Respondiste correctamente todas las <strong>${total}</strong> preguntas del cuestionario. ¡Dominio total de los conceptos evaluados!</p>
                </div>
            `;
        } else {
            failedSectionHtml = `
                <div class="quiz-failed-list">
                    ${failedList.map((item, idx) => {
                        const q = item.question;
                        return `
                            <div class="quiz-failed-item">
                                <div class="failed-item-header">
                                    <span class="failed-item-num">Pregunta ${q.num || (idx + 1)}</span>
                                    <span class="failed-item-topic">📌 ${q.tema || 'Física'} · ${q.categoria ? q.categoria.toUpperCase() : ''}</span>
                                </div>
                                <div class="failed-item-question">${q.pregunta}</div>
                                ${q.graficaSvg ? `<div class="failed-item-diagram">${q.graficaSvg}</div>` : ''}
                                <div class="failed-answers-compare">
                                    <div class="answer-card student-picked">
                                        <span class="answer-card-label">❌ Tu Elección:</span>
                                        <div>${item.selectedText}</div>
                                    </div>
                                    <div class="answer-card correct-key">
                                        <span class="answer-card-label">✅ Respuesta Correcta:</span>
                                        <div>${item.correctText}</div>
                                    </div>
                                </div>
                                <div class="failed-explanation-box">
                                    <strong>💡 Explicación del Mg. Manuel Obando:</strong>
                                    <div>${q.explicacion}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        if (quizQuestionScreen) quizQuestionScreen.style.display = 'none';
        if (quizResultsScreen) {
            quizResultsScreen.style.display = 'block';
            quizResultsScreen.innerHTML = `
                <div class="quiz-results-card">
                    <div class="results-hero">
                        <div class="results-trophy">${trophy}</div>
                        <div style="font-size:0.95rem; color:#a78bfa; margin-bottom:0.35rem; font-weight:700;">
                            👤 ${activeQuiz.studentName} ${activeQuiz.studentCourse ? `· (${activeQuiz.studentCourse})` : ''}
                        </div>
                        <div class="results-grade">${grade} <span style="font-size:1.4rem; color:var(--text-muted); font-weight:600;">/ 5.0</span></div>
                        <h2 class="results-title">${rankTitle}</h2>
                        <p class="results-subtitle">${rankSub}</p>

                        <!-- Indicador de Integridad Antifraude -->
                        <div style="margin-top:0.8rem; display:inline-flex; align-items:center; gap:0.4rem; font-size:0.8rem; padding:0.3rem 0.8rem; border-radius:999px; ${
                            (activeQuiz.tabSwitches === 0 && activeQuiz.screenshotAttempts === 0)
                                ? 'background:rgba(34,197,94,0.15); color:#86efac; border:1px solid rgba(34,197,94,0.3);'
                                : 'background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.3);'
                        }">
                            ${(activeQuiz.tabSwitches === 0 && activeQuiz.screenshotAttempts === 0)
                                ? '🛡️ Evaluación 100% Verificada (Sin incidencias de fraude)'
                                : `⚠️ Registro de Auditoría: ${activeQuiz.tabSwitches} salidas de pestaña · ${activeQuiz.screenshotAttempts} intentos de captura`}
                        </div>
                    </div>

                    <div class="results-stats-grid">
                        <div class="result-stat-box stat-correct">
                            <div class="result-stat-val">${correct} / ${total}</div>
                            <div class="result-stat-lbl">Aciertos</div>
                        </div>
                        <div class="result-stat-box stat-wrong">
                            <div class="result-stat-val">${wrong} / ${total}</div>
                            <div class="result-stat-lbl">Fallos</div>
                        </div>
                        <div class="result-stat-box stat-acc">
                            <div class="result-stat-val">${accuracy}%</div>
                            <div class="result-stat-lbl">Precisión</div>
                        </div>
                        <div class="result-stat-box stat-score">
                            <div class="result-stat-val">${activeQuiz.score}</div>
                            <div class="result-stat-lbl">Puntaje Total</div>
                        </div>
                    </div>

                    <!-- Sección Detallada de Preguntas en las que Falló -->
                    <div class="results-review-section">
                        <div class="results-review-header">
                            <h3 class="results-review-title">
                                <span>📋</span> ¿En Qué Preguntas Falló?
                                ${wrong > 0 ? `<span class="review-badge-count">${wrong} falladas para repasar</span>` : ''}
                            </h3>
                            <span style="font-size:0.85rem; color:var(--text-muted);">
                                ${wrong === 0 ? 'Examen impecable sin errores' : 'Repasa las soluciones para afianzar el aprendizaje'}
                            </span>
                        </div>
                        ${failedSectionHtml}
                    </div>

                    <div class="results-actions">
                        <button type="button" class="btn-quiz-retry" onclick="restartCurrentQuiz()">
                            🔄 Repetir Este Quiz
                        </button>
                        <button type="button" class="btn-quiz-share" onclick="shareQuizResultsWhatsApp('${grade}', ${correct}, ${total})">
                            📱 Compartir en WhatsApp
                        </button>
                        <button type="button" class="btn-quiz-exit" onclick="closeQuizModal()">
                            🚪 Volver a la Sala de Quizzes
                        </button>
                    </div>
                </div>
            `;
        }

        // Scroll al inicio del modal para ver la nota y el podio
        if (quizPlayerModal) quizPlayerModal.scrollTo({ top: 0, behavior: 'smooth' });

        // Registrar en telemetría de Firebase
        logRealActivity(`Completó Quiz "${activeQuiz.title}" (Alumno: ${activeQuiz.studentName}, PIN: ${activeQuiz.roomCode}) con nota ${grade}/5.0 (${correct}/${total} aciertos, ${accuracy}% de precisión, ${activeQuiz.tabSwitches} salidas de pestaña)`, 'quiz');
    }

    window.shareQuizResultsWhatsApp = function(grade, correct, total) {
        const text = `¡Hola! Acabo de completar el quiz universitario de física en PhysicsAILab.com:\n\n👤 Estudiante: ${activeQuiz.studentName}\n🏆 Quiz: ${activeQuiz.title}\n📊 Calificación: ${grade} / 5.0\n🎯 Aciertos: ${correct} de ${total} preguntas\n\n¿Te animas a superarme? Ingresa en: https://physicsailab.com/#quizzes`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    window.handleQuizJoinSubmit = function(event) {
        if (event) event.preventDefault();

        const nameInput = document.getElementById('quiz-student-name');
        const courseInput = document.getElementById('quiz-student-course');
        const pinInput = document.getElementById('quiz-pin-input');
        const selectDropdown = document.getElementById('quiz-select-dropdown');

        if (!nameInput || !pinInput) return;

        const studentName = nameInput.value.trim();
        const studentCourse = courseInput ? courseInput.value.trim() : '';
        const rawPin = pinInput.value.trim().toUpperCase();
        const selectedQuizId = selectDropdown ? selectDropdown.value : 'electromagnetismo-10';

        if (!studentName) {
            alert('⚠️ Por favor escribe tu Nombre y Apellidos completos para registrar tu nota en la evaluación oficial.');
            nameInput.focus();
            return;
        }

        if (!rawPin) {
            alert('⚠️ Por favor escribe la contraseña asignada por tu docente para esta evaluación.');
            pinInput.focus();
            return;
        }

        const qData = window.QUIZZES_DATA;
        if (!qData || !qData.presets) {
            alert('El banco de cuestionarios no está cargado.');
            return;
        }

        const matched = qData.presets.find(p => p.id === selectedQuizId) || qData.presets[0];
        const expectedPin = getQuizPassword(matched.id);

        const isValid = (rawPin === expectedPin) || 
                        (rawPin === matched.code.toUpperCase()) || 
                        (matched.aliases && matched.aliases.some(a => a.toUpperCase() === rawPin));

        if (isValid) {
            startQuizWithPreset(matched, studentName, studentCourse, rawPin);
        } else {
            alert(`⚠️ Contraseña incorrecta para "${matched.title}".\n\nPor favor solicita la contraseña de esta evaluación a tu docente e inténtalo nuevamente.`);
            pinInput.focus();
        }
    };

    window.joinQuizByCode = function(code) {
        const pinInput = document.getElementById('quiz-pin-input');
        if (pinInput) pinInput.value = code;
        const nameInput = document.getElementById('quiz-student-name');
        if (nameInput && !nameInput.value.trim()) {
            nameInput.focus();
            showToast('✍️ Escribe tu Nombre y Apellidos antes de ingresar a la evaluación.');
        } else {
            window.handleQuizJoinSubmit();
        }
    };

    window.startQuizWithPresetId = function(presetId) {
        const qData = window.QUIZZES_DATA;
        if (!qData || !qData.presets) return;
        const preset = qData.presets.find(p => p.id === presetId);
        if (!preset) return;

        const nameInput = document.getElementById('quiz-student-name');
        let studentName = nameInput ? nameInput.value.trim() : '';
        const courseInput = document.getElementById('quiz-student-course');
        let studentCourse = courseInput ? courseInput.value.trim() : '';

        if (!studentName) {
            studentName = prompt('Ingresa tu Nombre y Apellidos para registrar tu nota en la evaluación:') || '';
            if (!studentName.trim()) {
                alert('Es obligatorio ingresar tu nombre para iniciar la evaluación.');
                return;
            }
            if (nameInput) nameInput.value = studentName.trim();
        }

        startQuizWithPreset(preset, studentName.trim(), studentCourse, preset.code);
    };

    window.restartCurrentQuiz = function() {
        if (activeQuiz && activeQuiz.preset) {
            startQuizWithPreset(activeQuiz.preset, activeQuiz.studentName, activeQuiz.studentCourse, activeQuiz.roomCode);
        }
    };

    window.confirmExitQuiz = function() {
        if (activeQuiz.userAnswers && activeQuiz.userAnswers.length > 0 && activeQuiz.userAnswers.length < activeQuiz.questions.length) {
            if (confirm('¿Seguro que deseas abandonar la evaluación en curso? Tu nota quedará registrada con las preguntas respondidas hasta el momento.')) {
                showQuizFinalResults();
            }
        } else {
            closeQuizModal();
        }
    };

    window.closeQuizModal = function() {
        removeAntiCheatListeners();
        if (quizPlayerModal) {
            quizPlayerModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    window.toggleQuizPinVisibility = function() {
        const pinInput = document.getElementById('quiz-pin-input');
        const toggleBtn = document.getElementById('quiz-pwd-toggle-btn') || document.querySelector('.quiz-pwd-toggle-btn');
        if (!pinInput) return;

        if (pinInput.type === 'password') {
            pinInput.type = 'text';
            if (toggleBtn) {
                toggleBtn.innerHTML = '🙈';
                toggleBtn.title = 'Ocultar contraseña';
                toggleBtn.style.color = '#38bdf8';
            }
        } else {
            pinInput.type = 'password';
            if (toggleBtn) {
                toggleBtn.innerHTML = '👁️';
                toggleBtn.title = 'Mostrar contraseña';
                toggleBtn.style.color = '';
            }
        }
        pinInput.focus();
    };

    window.openQuizPreviewModal = function(presetId) {
        const qData = window.QUIZZES_DATA;
        if (!qData || !qData.presets || !qData.questions) return;

        let targetPreset = null;
        if (presetId) {
            targetPreset = qData.presets.find(p => p.id === presetId);
        }
        if (!targetPreset) {
            const dropdown = document.getElementById('quiz-select-dropdown');
            const selectedId = dropdown ? dropdown.value : null;
            if (selectedId) targetPreset = qData.presets.find(p => p.id === selectedId);
        }
        if (!targetPreset) {
            targetPreset = qData.presets.find(p => p.id === 'electromagnetismo-10') || qData.presets[0];
        }

        window._currentPreviewPreset = targetPreset;

        const badgeEl = document.getElementById('preview-quiz-badge');
        const pinBadgeEl = document.getElementById('preview-quiz-pin-badge');
        const titleEl = document.getElementById('preview-quiz-title');
        const descEl = document.getElementById('preview-quiz-desc');
        const listEl = document.getElementById('preview-quiz-questions-list');

        const activePin = getQuizPassword(targetPreset.id);

        if (badgeEl) badgeEl.textContent = targetPreset.badge || '⚡ Evaluación Oficial';
        if (pinBadgeEl) pinBadgeEl.textContent = `PIN: ${activePin}`;
        if (titleEl) titleEl.textContent = targetPreset.title;
        if (descEl) descEl.textContent = `${targetPreset.totalPreguntas} Preguntas Universitarias · Solucionario Exclusivo para Docente`;

        if (listEl) {
            const questions = (targetPreset.questionIds || [])
                .map(id => qData.questions.find(q => q.id === id))
                .filter(Boolean);

            listEl.innerHTML = questions.map((q, idx) => `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.4rem;">
                        <span style="font-size:0.75rem; font-weight:800; color:var(--accent-blue); letter-spacing:1px;">
                            PREGUNTA ${idx + 1} DE ${questions.length}
                        </span>
                        <div style="display:flex; gap:0.4rem;">
                            <span class="badge" style="background:rgba(56,189,248,0.15); color:#7dd3fc; font-size:0.72rem; padding:0.18rem 0.55rem; border-radius:4px;">
                                ${q.tema || 'Física'}
                            </span>
                            <span class="badge" style="background:rgba(124,58,237,0.15); color:#c4b5fd; font-size:0.72rem; padding:0.18rem 0.55rem; border-radius:4px;">
                                ${q.categoria ? q.categoria.toUpperCase() : 'GENERAL'}
                            </span>
                        </div>
                    </div>
                    <div style="color:#f8fafc; font-size:1rem; font-weight:600; line-height:1.45; margin-bottom:0.8rem;">
                        ${q.pregunta}
                    </div>
                    ${q.graficaSvg ? `<div style="margin:0.8rem 0; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">${q.graficaSvg}</div>` : ''}
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.5rem; margin-bottom:0.8rem;">
                        ${(q.opciones || []).map(opt => {
                            const optLetter = opt.charAt(0);
                            const isCorrect = (optLetter === q.correcta);
                            return `
                                <div style="padding:0.6rem 0.8rem; border-radius:8px; font-size:0.85rem; border:1px solid ${isCorrect ? '#22c55e' : 'rgba(255,255,255,0.08)'}; background:${isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.2)'}; color:${isCorrect ? '#86efac' : '#cbd5e1'}; font-weight:${isCorrect ? '700' : 'normal'}; display:flex; align-items:center; justify-content:space-between;">
                                    <span>${opt}</span>
                                    ${isCorrect ? '<span style="color:#4ade80;">✅ Correcta</span>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="background:rgba(15, 23, 42, 0.6); padding:0.75rem 1rem; border-radius:8px; border-left:3px solid #7c3aed; font-size:0.82rem; color:#94a3b8; line-height:1.45;">
                        <strong style="color:#c4b5fd;">💡 Explicación del Mg. Manuel Obando:</strong>
                        <div style="margin-top:0.25rem;">${q.explicacion}</div>
                    </div>
                </div>
            `).join('');
        }

        const modal = document.getElementById('quiz-preview-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeQuizPreviewModal = function() {
        const modal = document.getElementById('quiz-preview-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Renderizar catálogo inicial de quizzes
    renderQuizzesCatalog();

    // Soporte para entrada directa por URL con ?quiz=CODIGO o ?pin=CODIGO
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const quizParam = urlParams.get('quiz') || urlParams.get('pin');
        if (quizParam) {
            setTimeout(() => {
                window.joinQuizByCode(quizParam);
            }, 600);
        }
    } catch (e) {}

    // Adaptar dinámicamente si cambia el tamaño de pantalla
    window.addEventListener('resize', () => {
        renderCourses();
        renderSpotifyChannels();
        renderPhysicsFacts(currentFactFilter);
    });

    // Abrir checkout directo si la URL viene con ?buy=cursoId
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const buyParam = urlParams.get('buy');
        if (buyParam) {
            setTimeout(() => {
                openPaymentModal(buyParam);
            }, 500);
        }
    } catch (e) {}
});
