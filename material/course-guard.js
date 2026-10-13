/**
 * PhysicsAILab — Course Access Guard & Paywall
 * Control de acceso freemium: Vista previa de capítulos iniciales y bloqueo del contenido restante.
 * Desbloqueo mediante clave de clase estudiantil o compra de licencia.
 * Autor: Mg. Manuel Alejandro Obando — Universidad del Cauca
 */
(function() {
    'use strict';

    const STORAGE_KEY_STUDENT = 'estudiante_desbloqueado';
    const STORAGE_KEY_GLOBAL = 'physicsailab_unlocked_all';
    const VALID_CODES = [
        "UNICAUCA-FISICA-2026",
        "OBANDO-AULA-2026",
        "ELECTRO-FIET-2026",
        "AMBIENTAL-UNICA-26"
    ];

    function isUnlocked() {
        try {
            return localStorage.getItem(STORAGE_KEY_STUDENT) === 'true' ||
                   localStorage.getItem(STORAGE_KEY_GLOBAL) === 'true';
        } catch(e) {
            return false;
        }
    }

    function setUnlocked(val) {
        try {
            if (val) {
                localStorage.setItem(STORAGE_KEY_STUDENT, 'true');
                localStorage.setItem(STORAGE_KEY_GLOBAL, 'true');
            } else {
                localStorage.removeItem(STORAGE_KEY_STUDENT);
                localStorage.removeItem(STORAGE_KEY_GLOBAL);
            }
        } catch(e) {}
    }

    // Identificar curso y tipo
    const isTransformadores = !!document.querySelector('#benchSvg') || 
                             location.pathname.toLowerCase().includes('transformadores') ||
                             document.title.toLowerCase().includes('transformador');
    const isSquash = !!document.querySelector('#courtTop') ||
                     location.pathname.toLowerCase().includes('squash') ||
                     document.title.toLowerCase().includes('squash');

    // Inyectar estilos CSS del modal y candados
    const css = `
        /* Squash Demo Banner y Controles Bloqueados */
        .pg-squash-demo-banner {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.9));
            border: 1px solid rgba(245, 158, 11, 0.4);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            font-size: 0.85rem;
            color: #F1F5F9;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .pg-squash-demo-banner strong {
            color: #F59E0B;
        }
        .pg-squash-demo-banner button {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: #0A0E17;
            font-weight: 700;
            font-size: 0.8rem;
            border: none;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            cursor: pointer;
            white-space: nowrap;
            transition: opacity 0.2s;
        }
        .pg-squash-demo-banner button:hover {
            opacity: 0.85;
        }
        .pg-locked-control {
            position: relative;
            cursor: not-allowed !important;
            opacity: 0.55 !important;
        }

        /* Candados y tags en navegación */
        .pg-lock-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            margin-left: auto;
            opacity: 0.75;
            transition: transform 0.2s;
        }
        .pg-locked-tab .pg-lock-pill {
            margin-left: 0.35rem;
        }
        .pg-locked a, a.pg-locked {
            opacity: 0.85;
        }
        .pg-locked a:hover .pg-lock-pill, a.pg-locked:hover .pg-lock-pill {
            transform: scale(1.2);
            opacity: 1;
        }

        /* Banner superior flotante de estado */
        .pg-top-bar {
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 99999;
            background: rgba(15, 23, 42, 0.92);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 9999px;
            padding: 0.45rem 0.95rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 0.82rem;
            color: #F1F5F9;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            transition: all 0.25s ease;
        }
        .pg-top-bar.unlocked {
            border-color: rgba(16, 185, 129, 0.4);
            background: rgba(6, 78, 59, 0.9);
            color: #A7F3D0;
        }
        .pg-top-bar button {
            background: linear-gradient(135deg, #38BDF8, #818CF8);
            border: none;
            color: #0A0E17;
            font-weight: 700;
            font-size: 0.78rem;
            padding: 0.3rem 0.75rem;
            border-radius: 9999px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .pg-top-bar.unlocked button {
            background: rgba(255,255,255,0.15);
            color: #fff;
            font-weight: 500;
        }
        .pg-top-bar button:hover {
            opacity: 0.85;
        }

        /* Modal Overlay Paywall */
        .pg-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000000;
            background: rgba(10, 14, 23, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: pgFadeIn 0.25s ease forwards;
        }
        @keyframes pgFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .pg-modal {
            background: linear-gradient(160deg, #111827 0%, #0F172A 100%);
            border: 1px solid rgba(56, 189, 248, 0.35);
            border-radius: 20px;
            max-width: 540px;
            width: 100%;
            padding: 2rem;
            color: #F3F4F6;
            box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(56, 189, 248, 0.15);
            position: relative;
            max-height: 90vh;
            overflow-y: auto;
        }
        .pg-close {
            position: absolute;
            top: 1rem;
            right: 1.25rem;
            background: none;
            border: none;
            color: #94A3B8;
            font-size: 1.5rem;
            cursor: pointer;
            line-height: 1;
            padding: 0.25rem;
        }
        .pg-close:hover { color: #fff; }

        .pg-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.3rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: rgba(245, 158, 11, 0.15);
            color: #F59E0B;
            border: 1px solid rgba(245, 158, 11, 0.3);
            margin-bottom: 0.75rem;
        }
        .pg-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #fff;
            margin-bottom: 0.5rem;
            line-height: 1.25;
        }
        .pg-desc {
            color: #94A3B8;
            font-size: 0.92rem;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }

        /* Sección Estudiante */
        .pg-card-student {
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 14px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
        }
        .pg-card-student h4 {
            font-size: 0.98rem;
            color: #34D399;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        .pg-card-student p {
            font-size: 0.82rem;
            color: #94A3B8;
            margin-bottom: 0.75rem;
        }
        .pg-input-group {
            display: flex;
            gap: 0.5rem;
        }
        .pg-input {
            flex: 1;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 0.55rem 0.85rem;
            color: #fff;
            font-size: 0.88rem;
            outline: none;
            transition: border-color 0.2s;
        }
        .pg-input:focus {
            border-color: #34D399;
        }
        .pg-btn-unlock {
            background: linear-gradient(135deg, #10B981, #059669);
            color: #fff;
            font-weight: 700;
            font-size: 0.88rem;
            border: none;
            border-radius: 8px;
            padding: 0.55rem 1rem;
            cursor: pointer;
            white-space: nowrap;
            transition: opacity 0.2s;
        }
        .pg-btn-unlock:hover { opacity: 0.9; }

        /* Sección Compra */
        .pg-card-buy {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
        }
        .pg-card-buy h4 {
            font-size: 0.98rem;
            color: #F1F5F9;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        .pg-card-buy p {
            font-size: 0.82rem;
            color: #94A3B8;
            margin-bottom: 0.85rem;
        }
        .pg-buy-actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .pg-btn-buy {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #38BDF8, #818CF8);
            color: #0A0E17;
            font-weight: 700;
            font-size: 0.9rem;
            padding: 0.65rem 1rem;
            border-radius: 8px;
            text-decoration: none;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
        }
        .pg-btn-buy:hover {
            transform: translateY(-1px);
            opacity: 0.95;
        }
        .pg-btn-whatsapp {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(52, 211, 153, 0.3);
            color: #34D399;
            font-size: 0.85rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            text-decoration: none;
        }
        .pg-btn-whatsapp:hover {
            background: rgba(52, 211, 153, 0.1);
        }

        /* Toast feedback */
        .pg-toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000000;
            background: #111827;
            color: #fff;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            border: 1px solid #38BDF8;
            font-size: 0.9rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            animation: pgFadeIn 0.2s ease;
        }
        .pg-toast.success {
            border-color: #10B981;
            color: #A7F3D0;
        }
        .pg-toast.error {
            border-color: #EF4444;
            color: #FCA5A5;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // Toast helper
    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `pg-toast ${type}`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Modal Paywall
    let activeModal = null;
    function openPaywall(attemptedTarget = '') {
        if (activeModal) activeModal.remove();

        const courseTitle = document.title.split('·')[0].trim() || 'Curso Interactivo';
        const isLab = isTransformadores;
        const targetLabel = attemptedTarget ? ` el acceso a «${attemptedTarget}»` : ' este módulo completo';

        let modalTitle = 'Contenido Premium Bloqueado';
        let modalDesc = `Has llegado al límite de la demostración gratuita. Para desbloquear${targetLabel}, los motores de simulación numérica, la totalidad de los capítulos interactivos y la autoevaluación, ingresa tu clave de estudiante o adquiere la licencia completa.`;
        let buyEntityName = 'Curso';

        if (isLab) {
            modalTitle = 'Laboratorio Completo Bloqueado';
            buyEntityName = 'Laboratorio';
        } else if (isSquash) {
            modalTitle = 'Controles & Suite de Squash Bloqueados';
            modalDesc = `Has llegado al límite de la vista previa de rutinas pre-generadas. Para manipular los controles en tiempo real, personalizar velocidades y trayectorias, crear rutinas propias en el editor, exportar datos y acceder a la suite completa de biomecánica y análisis muscular, ingresa tu clave de estudiante o adquiere la licencia completa.`;
            buyEntityName = 'Simulador de Squash';
        }

        const overlay = document.createElement('div');
        overlay.className = 'pg-overlay';
        overlay.innerHTML = `
            <div class="pg-modal">
                <button class="pg-close" aria-label="Cerrar">✕</button>
                <span class="pg-badge">🔒 Vista Previa Gratuita Finalizada</span>
                <h3 class="pg-title">${modalTitle}</h3>
                <p class="pg-desc">
                    ${modalDesc}
                </p>

                <!-- Opción 1: Clave Estudiante Aula -->
                <div class="pg-card-student">
                    <h4>🎓 ¿Eres estudiante de la Universidad?</h4>
                    <p>Ingresa la clave de clase que dio el profesor en el aula para desbloquear el acceso completo sin costo durante este semestre.</p>
                    <div class="pg-input-group">
                        <input type="text" class="pg-input" id="pg-student-code-input" placeholder="Ingresa la clave de clase..." />
                        <button class="pg-btn-unlock" id="pg-btn-do-unlock">Desbloquear 🔓</button>
                    </div>
                </div>

                <!-- Opción 2: Adquisición / Compra -->
                <div class="pg-card-buy">
                    <h4>🛒 Adquirir Licencia del ${buyEntityName}</h4>
                    <p>Acceso permanente de por vida · Sin mensualidades · Certificación y soporte de autor (Mg. Manuel Alejandro Obando).</p>
                    <div class="pg-buy-actions">
                        <a href="https://physicsailab.com" target="_blank" class="pg-btn-buy">
                            Adquirir Licencia en PhysicsAILab.com 🚀
                        </a>
                        <a href="https://wa.me/?text=${encodeURIComponent('Hola Mg. Manuel Obando, me interesa adquirir la licencia completa para: ' + courseTitle + ' en PhysicsAILab.com')}" target="_blank" class="pg-btn-whatsapp">
                            💬 Consultar al Docente por WhatsApp / Nequi
                        </a>
                    </div>
                </div>

                <div style="text-align:center; margin-top:0.5rem;">
                    <button class="pg-close-btn" style="background:none; border:none; color:#64748B; font-size:0.82rem; cursor:pointer; text-decoration:underline;">
                        ← Continuar explorando la vista previa gratuita
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        activeModal = overlay;

        // Listeners
        const closeBtn = overlay.querySelector('.pg-close');
        const closeBtnBottom = overlay.querySelector('.pg-close-btn');
        const doUnlockBtn = overlay.querySelector('#pg-btn-do-unlock');
        const codeInput = overlay.querySelector('#pg-student-code-input');

        const closeModal = () => {
            if (activeModal) {
                activeModal.remove();
                activeModal = null;
            }
        };

        closeBtn.addEventListener('click', closeModal);
        closeBtnBottom.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        const tryUnlock = () => {
            const val = (codeInput.value || '').trim().toUpperCase();
            if (VALID_CODES.includes(val)) {
                setUnlocked(true);
                closeModal();
                showToast(`🎉 ¡Clave válida! Acceso completo desbloqueado con éxito.`, 'success');
                updateGuardState();
                // Si el usuario intentaba abrir algo específico, reintentar navegación
                if (attemptedTarget) {
                    if (isTransformadores) {
                        const tabLink = document.querySelector(`.nav a[href="#${attemptedTarget}"]`);
                        if (tabLink) tabLink.click();
                    } else {
                        location.hash = attemptedTarget;
                    }
                }
            } else {
                showToast('❌ Clave no válida o expirada. Consulta con tu profesor en clase.', 'error');
            }
        };

        doUnlockBtn.addEventListener('click', tryUnlock);
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryUnlock();
        });

        setTimeout(() => codeInput.focus(), 100);
    }

    // Floating bar
    let topBar = null;
    function renderTopBar() {
        if (!topBar) {
            topBar = document.createElement('div');
            document.body.appendChild(topBar);
        }

        const unlocked = isUnlocked();
        if (unlocked) {
            topBar.className = 'pg-top-bar unlocked';
            topBar.innerHTML = `
                <span>🎓 <strong>Modo Estudiante Activo</strong> · Acceso Completo</span>
                <button type="button" id="pg-lock-again-btn" title="Cerrar sesión de estudiante">Bloquear 🔒</button>
            `;
            const lockBtn = topBar.querySelector('#pg-lock-again-btn');
            if (lockBtn) {
                lockBtn.addEventListener('click', () => {
                    setUnlocked(false);
                    showToast('🔒 Modo estudiante cerrado. Curso en vista previa.', 'info');
                    updateGuardState();
                });
            }
        } else {
            topBar.className = 'pg-top-bar';
            topBar.innerHTML = `
                <span>👁️ <strong>Vista Previa Gratuita</strong></span>
                <button type="button" id="pg-unlock-modal-btn">Desbloquear 🔑</button>
            `;
            const unlockBtn = topBar.querySelector('#pg-unlock-modal-btn');
            if (unlockBtn) {
                unlockBtn.addEventListener('click', () => openPaywall());
            }
        }
    }

    // Intercepción en Cuadernos Interactivos (Mecánica, Electromagnetismo, Cuántica, RETIE)
    function applyNotebookGuard() {
        const unlocked = isUnlocked();
        const tocLinks = document.querySelectorAll('#toc a, .toc a, .home-card');

        // Determinar qué capítulos son libres en la demo:
        // Capítulo 0 (inicio / portada) y el primer capítulo temático son libres.
        // Capítulos con num >= 2 o después del primero quedan bloqueados.
        let firstThematicId = null;

        tocLinks.forEach((a) => {
            const href = a.getAttribute('href') || '';
            const id = (a.dataset && a.dataset.id) || href.replace(/^#/, '').split('.')[0];
            
            // Ignorar inicio o vacío
            if (!id || id === 'inicio') return;

            if (!firstThematicId) {
                firstThematicId = id; // Primer capítulo temático es libre
                return;
            }

            // Capítulos subsiguientes son bloqueados en preview
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

        // Interceptar clics en enlaces bloqueados
        document.removeEventListener('click', handleNotebookClick, true);
        document.addEventListener('click', handleNotebookClick, true);

        // Comprobar hash actual al cargar o cambiar
        checkCurrentHash(firstThematicId);
    }

    function handleNotebookClick(e) {
        if (isUnlocked()) return;
        const targetA = e.target.closest('a');
        if (!targetA) return;

        const href = targetA.getAttribute('href') || '';
        if (!href.startsWith('#')) return;

        const id = href.replace(/^#/, '').split('.')[0];
        if (!id || id === 'inicio') return;

        // Comprobar si es un enlace bloqueado
        if (targetA.classList.contains('pg-locked') || targetA.querySelector('.pg-lock-pill')) {
            e.preventDefault();
            e.stopPropagation();
            const title = targetA.textContent.replace('🔒', '').trim();
            openPaywall(title);
        }
    }

    function checkCurrentHash(firstThematicId) {
        if (isUnlocked()) return;
        const h = decodeURIComponent(location.hash.replace(/^#/, '')).split('.')[0];
        if (!h || h === 'inicio' || h === firstThematicId) return;

        // Si el usuario intentó acceder directamente por hash a un capítulo bloqueado
        const lockedLink = document.querySelector(`#toc a[href^="#${h}"].pg-locked, .toc a[href^="#${h}"].pg-locked`);
        if (lockedLink) {
            // Revertir a primer capítulo temático o portada
            setTimeout(() => {
                location.hash = firstThematicId ? '#' + firstThematicId : '#inicio';
                openPaywall(h);
            }, 300);
        }
    }

    // Intercepción en Laboratorio de Transformadores
    function applyTransformadoresGuard() {
        const unlocked = isUnlocked();
        // Tabs libres: 'banco' (mesa de pruebas) y 'teoria' (fundamento)
        // Tabs bloqueadas: 'cuaderno' (registro de datos y notas), 'exposicion' (diapositivas calificada), 'guia' (guía completa)
        const lockedTabs = ['cuaderno', 'exposicion', 'guia'];

        lockedTabs.forEach((tabId) => {
            const navLink = document.querySelector(`.nav a[href="#${tabId}"]`);
            if (navLink) {
                const existingPill = navLink.querySelector('.pg-lock-pill');
                if (!unlocked) {
                    navLink.classList.add('pg-locked-tab');
                    if (!existingPill) {
                        const pill = document.createElement('span');
                        pill.className = 'pg-lock-pill';
                        pill.textContent = '🔒';
                        navLink.appendChild(pill);
                    }
                } else {
                    navLink.classList.remove('pg-locked-tab');
                    if (existingPill) existingPill.remove();
                }
            }
        });

        document.removeEventListener('click', handleTransformadoresClick, true);
        document.addEventListener('click', handleTransformadoresClick, true);

        // Comprobar si el hash actual es una pestaña bloqueada
        const currentHash = location.hash.replace(/^#/, '');
        if (!unlocked && lockedTabs.includes(currentHash)) {
            setTimeout(() => {
                location.hash = '#banco';
                openPaywall(currentHash);
            }, 300);
        }
    }

    function handleTransformadoresClick(e) {
        if (isUnlocked()) return;
        const targetA = e.target.closest('.nav a');
        if (!targetA) return;

        const href = targetA.getAttribute('href') || '';
        const tabId = href.replace(/^#/, '');
        const lockedTabs = ['cuaderno', 'exposicion', 'guia'];

        if (lockedTabs.includes(tabId)) {
            e.preventDefault();
            e.stopPropagation();
            const tabName = targetA.textContent.replace('🔒', '').trim();
            openPaywall(tabName);
        }
    }

    // Intercepción en Simulador de Squash & Biomecánica
    function applySquashGuard() {
        const unlocked = isUnlocked();
        const lockedNavs = ['editor', 'anatomia', 'fisiologia', 'biomecanica', 'lesiones', 'fundamentos'];

        // 1. Candados en botones de navegación
        lockedNavs.forEach((tabId) => {
            const btn = document.querySelector(`.nav button[data-go="${tabId}"]`);
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

        // 2. Banner de demostración en panel de simulador
        let demoBanner = document.getElementById('pg-squash-demo-banner');
        const simPanel = document.querySelector('#p-simulador .panel') || document.querySelector('#p-simulador');
        if (!unlocked) {
            if (!demoBanner && simPanel) {
                demoBanner = document.createElement('div');
                demoBanner.id = 'pg-squash-demo-banner';
                demoBanner.className = 'pg-squash-demo-banner';
                demoBanner.innerHTML = `
                    <div>
                        <span>🔒 <strong>Modo Demostración</strong>: Reproduciendo rutina táctica pre-generada. Controles de edición y personalización bloqueados.</span>
                    </div>
                    <button type="button" id="pg-squash-banner-btn">Desbloquear Suite 🔑</button>
                `;
                simPanel.insertBefore(demoBanner, simPanel.firstChild);
                const bBtn = demoBanner.querySelector('#pg-squash-banner-btn');
                if (bBtn) bBtn.addEventListener('click', () => openPaywall('Controles del Simulador'));
            }
        } else {
            if (demoBanner) demoBanner.remove();
        }

        // 3. Estilo y estado para controles de edición y exportación
        const restrictedSelectors = [
            '#btnEditThis', '#btnExport', '[data-exp]',
            '#btnPrev', '#btnNext', '#rtSel',
            '[data-sp="0.25"]', '[data-sp="0.5"]', '[data-sp="1.5"]', '[data-sp="2"]'
        ];
        restrictedSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (!unlocked) {
                    el.classList.add('pg-locked-control');
                    el.setAttribute('title', '🔒 Bloqueado en Modo Demostración');
                } else {
                    el.classList.remove('pg-locked-control');
                    el.removeAttribute('title');
                }
            });
        });

        // Intercepción de clics
        document.removeEventListener('click', handleSquashClick, true);
        document.addEventListener('click', handleSquashClick, true);

        // Si intentó ir directamente a una sección bloqueada
        const currentHash = location.hash.replace(/^#/, '');
        if (!unlocked && lockedNavs.includes(currentHash)) {
            setTimeout(() => {
                const simBtn = document.querySelector('.nav button[data-go="simulador"]');
                if (simBtn) simBtn.click();
                openPaywall(currentHash);
            }, 300);
        }
    }

    function handleSquashClick(e) {
        if (isUnlocked()) return;

        // Clic en nav button bloqueado
        const navBtn = e.target.closest('.nav button[data-go]');
        if (navBtn) {
            const goTarget = navBtn.getAttribute('data-go');
            const lockedNavs = ['editor', 'anatomia', 'fisiologia', 'biomecanica', 'lesiones', 'fundamentos'];
            if (lockedNavs.includes(goTarget)) {
                e.preventDefault();
                e.stopPropagation();
                const name = navBtn.textContent.replace('🔒', '').trim();
                openPaywall(name);
                return;
            }
        }

        // Clic en controles bloqueados del simulador
        const lockedCtrl = e.target.closest('#btnEditThis, #btnExport, [data-exp], #rtSel, .pg-locked-control');
        if (lockedCtrl) {
            e.preventDefault();
            e.stopPropagation();
            openPaywall('Edición y Parámetros del Simulador');
            return;
        }
    }

    // Actualización de estado
    function updateGuardState() {
        renderTopBar();
        if (isTransformadores) {
            applyTransformadoresGuard();
        } else if (isSquash) {
            applySquashGuard();
        } else {
            applyNotebookGuard();
        }
    }

    // Inicialización al cargar el DOM
    function init() {
        updateGuardState();
        window.addEventListener('hashchange', () => {
            setTimeout(updateGuardState, 100);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 50);
    }

    // Exportar a window para control manual si se requiere
    window.PhysicsAILabGuard = {
        isUnlocked,
        setUnlocked,
        openPaywall,
        update: updateGuardState
    };
})();
