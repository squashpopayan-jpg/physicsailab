/**
 * PhysicsAILab — Universal Course Access Guard & Paywall
 * Control de acceso freemium: Vista previa de módulos/capítulos iniciales liberada
 * y bloqueo con candados (🔒) para todo el contenido restante.
 * Desbloqueo mediante clave de clase estudiantil, código de licencia personal o administrador.
 * Autor: Mg. Manuel Alejandro Obando — Universidad del Cauca
 */
(function() {
    'use strict';

    const ADMIN_MASTER_KEY = "OBANDO-ADMIN-2026";
    // Sincronización proactiva de claves en la nube (Firebase)
    try {
        fetch('https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/student_keys_config/monthly_keys.json')
            .then(r => r.json())
            .then(data => {
                if (data && typeof data === 'object') {
                    localStorage.setItem('physicsailab_cloud_keys', JSON.stringify(data));
                }
            }).catch(() => {});
    } catch(e) {}

    const LAB_COURSE_IDS = [
        "transformadores",
        "pendulo",
        "venturi",
        "recorrido",
        "historia"
    ];
    const DEFAULT_COURSE_KEYS = {
        "mecanica": ["MECANICA-2026", "OBANDO-MEC-26", "MEC-QXN7-26"],
        "materiales": ["MATERIALES-2026", "SOLIDOS-UFOP-26", "MAT-DVCF-26"],
        "transformadores": ["TRANSFO-2026", "LAB-TRANS-26", "TRA-FXOL-26"],
        "ondas": ["ONDAS-2026", "VIBRACIONES-26", "OND-LVAR-26"],
        "neuro": ["RECABLEAR-2026", "NEURO-26", "NEU-FZ10-26"],
        "electromagnetismo": ["ELECTRO-2026", "FIET-EM-26", "ELE-1TAQ-26"],
        "ml": ["DATOS-IA-2026", "MACHINE-LEARNING-26", "ML-XZJD-26"],
        "cuantica": ["CUANTICA-2026", "MODERNA-26", "CUA-GE1J-26"],
        "retie": ["RETIE-2026", "NORMA-RETIE-26", "RET-LLP4-26"],
        "squash_sim": ["SQUASH-PRO-2026", "MANU-SQUASH-26", "SQU-PLLW-26"],
        "finanzas": ["FINANZAS-2026", "CUENTAS-CLARAS-26", "FIN-SEA8-26"],
        "termo": ["TERMO-2026", "CALOR-TERMO-26", "OBANDO-TERMO-26", "TER-E9WM-26"],
        "torneos": ["TORNEOS-2026", "SQUASH-POPAYAN-26", "SQUASH-TORNEOS-26", "TOR-KX9Q-26"],
        "laboratorio": ["LAB-PROYECTO-2026", "PROYECTO-LAB-26", "OBANDO-LAB-26", "LAB-7RAG-26"],
        "fluidos": ["FLUIDOS-2026", "BERNOULLI-26", "OBANDO-FLUIDOS-26", "FLU-CJTO-26"],
        "venturi": ["VENTURI-2026", "BERNOULLI-VENTURI-26", "OBANDO-VENTURI-26", "BERNOULLI-2026", "VEN-BQS2-26"],
        "pendulo": ["PENDULO-2026", "GRAVEDAD-26", "OBANDO-PENDULO-26", "FISICA-10-26", "PEN-A66O-26"],
        "guias": ["GUIAS-2026", "MONTAJES-26", "LAB-MONTAJES-26", "GUI-8MEI-26"],
        "ingles": ["INGLES-2026", "QUANTUM-ENGLISH-26", "LEAP-2026", "ING-WWUP-26"],
        "recorrido": ["RECORRIDO-2026", "DEPTO-FISICA-26", "OBANDO-RECORRIDO-26", "UNICAUCA-26", "REC-WERL-26"],
        "optica": ["OPTICA-2026", "FOTON-26", "OBANDO-OPTICA-26", "LUZ-RAYO-26", "MAXWELL-OPTICA-26", "OPT-ACB4-26"],
        "solido": ["SOLIDO-2026", "ESTADO-SOLIDO-26", "SOLIDOS-UFOP-26", "OBANDO-SOLIDO-26", "SOL-I5CX-26"],
        "faro": ["FARO-2026", "PODS-REACCION-26", "LUZ-FARO-26", "OBANDO-FARO-26", "FAR-PCK1-26"],
        "diagnosticas": ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26", "DIA-GHNR-26"],
        "squash_arbitraje": ["ARBITRAJE-2026", "SQUASH-REF-26", "MANU-REF-26", "WSF-REGLAS-26"],
        "historia": ["HISTORIA-2026", "CIENCIA-HIST-26", "OBANDO-HISTORIA-26", "SABER-2026", "BIENVENIDA-2026"]
    };

    function getCurrentCourseId() {
        const p = decodeURIComponent(location.pathname.toLowerCase());
        const m = p.match(/1_cursos\/([^\/]+)/);
        if (m && m[1]) {
            const raw = m[1];
            if (raw === 'manu_squash_arbitraje' || raw === 'squash_arbitraje' || raw === 'arbitraje') return 'squash_arbitraje';
            if (raw === 'squash' || raw === 'squash-sim') return 'squash_sim';
            return raw;
        }

        if (p.includes('historia') || p.includes('saber')) return 'historia';
        if (p.includes('solido') || p.includes('estado-solido')) return 'solido';
        if (p.includes('arbitraje') || p.includes('manu_squash_arbitraje')) return 'squash_arbitraje';
        if (p.includes('faro')) return 'faro';
        if (p.includes('diagnostica')) return 'diagnosticas';
        if (p.includes('optica')) return 'optica';
        if (p.includes('mecanica')) return 'mecanica';
        if (p.includes('pendulo')) return 'pendulo';
        if (p.includes('venturi')) return 'venturi';
        if (p.includes('transformador')) return 'transformadores';
        if (p.includes('onda') || p.includes('vibraci')) return 'ondas';
        if (p.includes('material')) return 'materiales';
        if (p.includes('electro')) return 'electromagnetismo';
        if (p.includes('cuantica')) return 'cuantica';
        if (p.includes('retie') || p.includes('cableado')) return 'retie';
        if (p.includes('squash')) return 'squash_sim';
        if (p.includes('finanzas') || p.includes('cuentas-claras')) return 'finanzas';
        if (p.includes('termo')) return 'termo';
        if (p.includes('torneo')) return 'torneos';
        if (p.includes('bolsillo') || p.includes('laboratorio-bolsillo') || p.includes('/laboratorio/')) return 'laboratorio';
        if (p.includes('fluido')) return 'fluidos';
        if (p.includes('guia') || p.includes('montaje')) return 'guias';
        if (p.includes('ingles') || p.includes('english')) return 'ingles';
        if (p.includes('recorrido')) return 'recorrido';
        if (p.includes('/ml/')) return 'ml';
        if (p.includes('/neuro/')) return 'neuro';

        const t = (document.title || '').toLowerCase();
        if (t.includes('historia') || t.includes('llegamos a saber') || t.includes('saber')) return 'historia';
        if (t.includes('sólido') || t.includes('solido')) return 'solido';
        if (t.includes('arbitraje')) return 'squash_arbitraje';
        if (t.includes('faro')) return 'faro';
        if (t.includes('diagnostica')) return 'diagnosticas';
        if (t.includes('óptica') || t.includes('optica')) return 'optica';
        if (t.includes('mecánica') || t.includes('mecanica')) return 'mecanica';
        if (t.includes('péndulo') || t.includes('pendulo')) return 'pendulo';
        if (t.includes('venturi')) return 'venturi';
        if (t.includes('transformador')) return 'transformadores';
        if (t.includes('onda') || t.includes('vibraci')) return 'ondas';
        if (t.includes('material')) return 'materiales';
        if (t.includes('electro')) return 'electromagnetismo';
        if (t.includes('cuántica') || t.includes('cuantica')) return 'cuantica';
        if (t.includes('retie') || t.includes('cableado')) return 'retie';
        if (t.includes('squash')) return 'squash_sim';
        if (t.includes('finanzas') || t.includes('cuentas claras')) return 'finanzas';
        if (t.includes('termodin') || t.includes('termo')) return 'termo';
        if (t.includes('torneo')) return 'torneos';
        if (t.includes('bolsillo')) return 'laboratorio';
        if (t.includes('fluido')) return 'fluidos';
        if (t.includes('guía') || t.includes('guia')) return 'guias';
        if (t.includes('english') || t.includes('inglés')) return 'ingles';
        if (t.includes('recorrido')) return 'recorrido';

        return 'general';
    }

    function isUnlocked() {
        const cId = getCurrentCourseId();
        // Todos los Laboratorios de física están 100% liberados para el público general:
        if (LAB_COURSE_IDS.includes(cId)) return true;

        try {
            // 1. Modo Administrador General (Profesor Obando): todo liberado
            const isPreviewTesting = location.search.includes('preview=1') || location.search.includes('demo=1') || localStorage.getItem('physicsailab_force_preview') === 'true';
            if (isPreviewTesting) return false;
            if (localStorage.getItem('physicsailab_admin') === 'true') return true;
            if (localStorage.getItem('physicsailab_unlocked_all') === 'true') return true;

            // 2. Revisar licencias activas emitidas al estudiante (Subscriptores y compras)
            const licenses = JSON.parse(localStorage.getItem('physicsailab_student_licenses') || '[]');
            if (Array.isArray(licenses)) {
                const hasActive = licenses.some(lic => {
                    const matchCourse = lic.cursoId === cId || lic.cursoId === 'todos' || lic.curso === cId;
                    const isActive = !lic.estado || lic.estado === 'activo' || lic.estado === 'aprobado';
                    if (!matchCourse || !isActive) return false;
                    // Los suscriptores no se bloquean con la rotación mensual
                    if (lic.tipo === 'suscripcion' || lic.esSuscripcion) {
                        if (lic.expiraEn && Date.now() > lic.expiraEn) return false;
                        return true;
                    }
                    return true;
                });
                if (hasActive) return true;
            }

            // 3. Revisar caducidad mensual (1 mes = 30 días) de clave de alumno
            const unlockInfo = JSON.parse(localStorage.getItem('unlocked_info_' + cId) || 'null');
            if (unlockInfo) {
                // Si el docente forzó rotación mensual de claves:
                const rotationTs = parseInt(localStorage.getItem('physicsailab_key_rotation_ts') || '0', 10);
                if (rotationTs > 0 && unlockInfo.unlockedAt && unlockInfo.unlockedAt < rotationTs) {
                    setCourseUnlocked(cId, false);
                    return false;
                }
                // Si pasaron los 30 días del ciclo mensual:
                if (unlockInfo.expiresAt && Date.now() > unlockInfo.expiresAt) {
                    setCourseUnlocked(cId, false);
                    return false;
                }
                return true;
            }

            // 4. Desbloqueo específico anterior
            const unlockedList = JSON.parse(localStorage.getItem('physicsailab_unlocked_courses') || '[]');
            if (unlockedList.includes(cId) || localStorage.getItem('unlocked_course_' + cId) === 'true') {
                return true;
            }

            return false;
        } catch(e) {
            return false;
        }
    }

    function setCourseUnlocked(cId, val, isSub = false) {
        try {
            let list = JSON.parse(localStorage.getItem('physicsailab_unlocked_courses') || '[]');
            if (val) {
                if (!list.includes(cId)) list.push(cId);
                localStorage.setItem('unlocked_course_' + cId, 'true');
                const now = Date.now();
                const unlockInfo = {
                    cId: cId,
                    unlockedAt: now,
                    expiresAt: isSub ? (now + 365 * 24 * 60 * 60 * 1000) : (now + 30 * 24 * 60 * 60 * 1000),
                    isSubscription: !!isSub,
                    month: new Date().toISOString().slice(0, 7)
                };
                localStorage.setItem('unlocked_info_' + cId, JSON.stringify(unlockInfo));
            } else {
                list = list.filter(id => id !== cId);
                localStorage.removeItem('unlocked_course_' + cId);
                localStorage.removeItem('unlocked_info_' + cId);
                localStorage.removeItem('physicsailab_admin');
                localStorage.removeItem('physicsailab_unlocked_all');
            }
            localStorage.setItem('physicsailab_unlocked_courses', JSON.stringify(list));
        } catch(e) {}
    }

    function setUnlocked(val) {
        const cId = getCurrentCourseId();
        setCourseUnlocked(cId, val);
    }

    // Identificar tipo de curso
    const courseId = getCurrentCourseId();
    const isTransformadores = courseId === 'transformadores' || !!document.querySelector('#benchSvg');
    const isSquash = courseId === 'squash_sim' || !!document.querySelector('#courtTop');
    const isVenturi = courseId === 'venturi';
    const isPendulo = courseId === 'pendulo' || !!document.querySelector('nav a[data-tab="matematico"]');
    const isIngles = courseId === 'ingles' || !!document.querySelector('.stepper');
    const isTorneos = courseId === 'torneos';
    const isArbitraje = courseId === 'squash_arbitraje';
    const isFaro = courseId === 'faro' || !!document.querySelector('.indice');
    const isRecorrido = courseId === 'recorrido';

    // Inyectar estilos CSS del modal, candados y barras
    const css = `
        
        /* Estilos de bloqueo estricto para Manual de Taller Faro */
        .pg-faro-locked {
            filter: blur(12px) grayscale(75%) !important;
            opacity: 0.22 !important;
            pointer-events: none !important;
            user-select: none !important;
            max-height: 220px !important;
            overflow: hidden !important;
            margin-bottom: 2rem !important;
            position: relative !important;
        }
        .pg-faro-barrier-card {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98)) !important;
            border: 2px solid rgba(245, 158, 11, 0.6) !important;
            border-radius: 16px !important;
            padding: 2.2rem 1.75rem !important;
            margin: 2.5rem auto !important;
            max-width: 820px !important;
            text-align: center !important;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.15) !important;
            position: relative !important;
            z-index: 100 !important;
        }
        .pg-faro-barrier-card h3 {
            color: #ffffff !important;
            font-size: 1.35rem !important;
            margin: 0.5rem 0 0.5rem !important;
        }
        .pg-faro-barrier-card p {
            color: #cbd5e1 !important;
            font-size: 0.92rem !important;
            line-height: 1.55 !important;
            max-width: 650px !important;
            margin: 0 auto 1.35rem !important;
        }

        /* Candados y tags en navegación */
        .pg-lock-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.82rem;
            line-height: 1;
            margin-left: auto;
            opacity: 0.9;
            filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
            transition: transform 0.2s;
            pointer-events: none;
        }
        .toc a.pg-locked, #toc a.pg-locked {
            position: relative;
            opacity: 0.85;
            padding-right: 28px !important;
        }
        .toc a.pg-locked .pg-lock-pill, #toc a.pg-locked .pg-lock-pill {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
        }
        .toc a.pg-locked:hover, #toc a.pg-locked:hover {
            opacity: 1;
            background: rgba(245, 158, 11, 0.08) !important;
        }
        .toc a.pg-locked:hover .pg-lock-pill, #toc a.pg-locked:hover .pg-lock-pill {
            transform: translateY(-50%) scale(1.25);
        }

        /* Home cards bloqueadas */
        .home-card.pg-locked {
            position: relative;
            border-color: rgba(245, 158, 11, 0.25) !important;
            opacity: 0.9;
        }
        .home-card.pg-locked:hover {
            border-color: #F59E0B !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.12);
        }
        .home-card-lock-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(245, 158, 11, 0.18);
            border: 1px solid rgba(245, 158, 11, 0.45);
            color: #F59E0B;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 9999px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            pointer-events: none;
            line-height: 1.2;
            letter-spacing: 0.3px;
        }

        /* Botón siguiente bloqueado */
        .ch-nav a.pg-locked, nav.ch-nav a.pg-locked {
            opacity: 0.85;
            border-color: rgba(245, 158, 11, 0.3) !important;
        }
        .ch-nav a.pg-locked .pg-lock-pill {
            margin-left: 6px;
        }

        /* Pestañas de laboratorio bloqueadas */
        .nav a.pg-locked-tab, nav a.pg-locked-tab {
            opacity: 0.85;
            position: relative;
        }
        .nav a.pg-locked-tab .pg-lock-pill, nav a.pg-locked-tab .pg-lock-pill {
            margin-left: 5px;
            font-size: 0.78rem;
        }
        .nav a.pg-locked-tab:hover, nav a.pg-locked-tab:hover {
            color: #F59E0B;
        }

        /* Squash y controles especiales */
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
        .pg-squash-demo-banner strong { color: #F59E0B; }
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
        .pg-squash-demo-banner button:hover { opacity: 0.85; }
        .pg-locked-control {
            position: relative;
            cursor: not-allowed !important;
            opacity: 0.55 !important;
        }

        /* Floating Top Bar */
        .pg-top-bar {
            position: fixed;
            top: 10px;
            right: 14px;
            z-index: 999999;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.35rem 0.85rem;
            background: rgba(15, 23, 42, 0.88);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(245, 158, 11, 0.45);
            border-radius: 9999px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 0.8rem;
            color: #F8FAFC;
            box-shadow: 0 4px 20px rgba(0,0,0,0.35);
            transition: all 0.3s;
        }
        .pg-top-bar.unlocked {
            border-color: rgba(16, 185, 129, 0.45);
            background: rgba(6, 78, 59, 0.88);
        }
        .pg-top-bar strong {
            color: #F59E0B;
        }
        .pg-top-bar.unlocked strong {
            color: #34D399;
        }
        .pg-top-bar button {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: #0A0E17;
            font-weight: 700;
            font-size: 0.76rem;
            border: none;
            padding: 0.28rem 0.7rem;
            border-radius: 9999px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .pg-top-bar button:hover { opacity: 0.9; }
        .pg-top-bar.unlocked button {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.25);
        }

        /* Modal Paywall Overlay */
        .pg-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000000;
            background: rgba(10, 14, 23, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: pgFadeIn 0.22s ease forwards;
        }
        @keyframes pgFadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }
        .pg-modal {
            background: linear-gradient(160deg, #111827 0%, #0F172A 100%);
            border: 1px solid rgba(56, 189, 248, 0.35);
            border-radius: 20px;
            max-width: 550px;
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
            font-size: 1.45rem;
            font-weight: 800;
            color: #fff;
            margin-bottom: 0.5rem;
            line-height: 1.25;
        }
        .pg-desc {
            color: #94A3B8;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 1.35rem;
        }

        /* Sección Estudiante */
        .pg-card-student {
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 14px;
            padding: 1.15rem;
            margin-bottom: 1.15rem;
        }
        .pg-card-student h4 {
            font-size: 0.95rem;
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
            line-height: 1.4;
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

        /* Sección Compra / Cupones */
        .pg-card-buy {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 1.15rem;
            margin-bottom: 1.15rem;
        }
        .pg-card-buy h4 {
            font-size: 0.95rem;
            color: #F1F5F9;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        .pg-card-buy p {
            font-size: 0.82rem;
            color: #94A3B8;
            margin-bottom: 0.75rem;
            line-height: 1.4;
        }
        .pg-coupon-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(245, 158, 11, 0.12);
            border: 1px dashed rgba(245, 158, 11, 0.4);
            color: #FBBF24;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 0.35rem 0.75rem;
            border-radius: 8px;
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

        
        @media (max-width: 768px) {
            .pg-modal {
                padding: 1.35rem 1rem !important;
                width: 94% !important;
                max-width: 94% !important;
                max-height: 85vh !important;
                max-height: 85dvh !important;
                border-radius: 16px !important;
            }
            .pg-input {
                font-size: 16px !important; /* Previene auto-zoom en iOS Safari */
                min-height: 44px;
            }
            .pg-input-group {
                flex-direction: column !important;
                gap: 0.5rem !important;
            }
            .pg-btn-unlock {
                width: 100% !important;
                padding: 0.75rem !important;
                min-height: 44px !important;
                justify-content: center;
            }
            .pg-buy-actions {
                flex-direction: column !important;
            }
            .pg-btn-buy, .pg-btn-whatsapp {
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
                min-height: 44px !important;
                justify-content: center;
            }
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
        .pg-toast.success { border-color: #10B981; color: #A7F3D0; }
        .pg-toast.error { border-color: #EF4444; color: #FCA5A5; }
        .pg-toast.info { border-color: #38BDF8; color: #BAE6FD; }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // Toast helper
    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `pg-toast ${type}`;
        toast.innerHTML = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Modal Paywall
    let activeModal = null;
    function openPaywall(attemptedTarget = '') {
        if (activeModal) activeModal.remove();

        const curCourse = getCurrentCourseId();
        const courseTitle = document.title.split('·')[0].split('—')[0].trim() || 'Curso Interactivo';
        const targetLabel = attemptedTarget ? ` el acceso a «${attemptedTarget}»` : ' este módulo completo';

        let modalTitle = 'Contenido Premium Bloqueado';
        let modalDesc = `Has llegado al límite de la vista previa gratuita. Para desbloquear${targetLabel}, los motores de simulación numérica, los ejercicios interactivos y la totalidad de los capítulos, ingresa tu clave de estudiante o adquiere la licencia completa.`;
        let buyEntityName = 'Curso';

        if (isTransformadores || isVenturi || isPendulo) {
            modalTitle = 'Laboratorio Completo Bloqueado';
            buyEntityName = 'Laboratorio';
            modalDesc = `Has llegado al límite de la demostración gratuita. Para registrar datos experimentales en el cuaderno virtual, realizar regresiones lineales, tratamiento riguroso de errores y acceder a las prácticas avanzadas, ingresa tu clave de estudiante o adquiere tu licencia.`;
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
                <span class="pg-badge">🔒 Vista Previa Gratuita</span>
                <h3 class="pg-title">${modalTitle}</h3>
                <p class="pg-desc">
                    ${modalDesc}
                </p>

                <!-- Opción 1: Clave Estudiante Aula o Licencia -->
                <div class="pg-card-student">
                    <h4>🎓 ¿Eres estudiante o ya compraste tu licencia?</h4>
                    <p>Ingresa la clave de clase proporcionada por el docente en el aula o el código de tu licencia personal para desbloquear el acceso completo permanente.</p>
                    <div class="pg-input-group">
                        <input type="text" class="pg-input" id="pg-student-code-input" placeholder="Ingresa clave o código de licencia..." />
                        <button class="pg-btn-unlock" id="pg-btn-do-unlock">Desbloquear 🔓</button>
                    </div>
                </div>

                <!-- Opción 2: Adquisición / Compra con Cupones -->
                <div class="pg-card-buy">
                    <h4>🛒 Adquirir Licencia del ${buyEntityName}</h4>
                    <div class="pg-coupon-pill">
                        🏷️ Cupón de Descuento: <strong>Solicita tu código de 30% o 40% al Profesor</strong>
                    </div>
                    <p>Acceso permanente de por vida · Sin mensualidades · Certificación y soporte directo de autor (Mg. Manuel Alejandro Obando — Universidad del Cauca).</p>
                    <div class="pg-buy-actions">
                        <a href="/?buy=${curCourse}#tienda" target="_blank" class="pg-btn-buy">
                            ⚡ Comprar con Descuento en PhysicsAILab (Wompi / PSE / Nequi)
                        </a>
                        <a href="https://wa.me/573137115473?text=${encodeURIComponent('Hola profesor Manuel Alejandro Obando, deseo adquirir la licencia completa para el ' + buyEntityName + ' «' + courseTitle + '» con cupón de descuento en PhysicsAILab.com')}" target="_blank" class="pg-btn-whatsapp">
                            💬 Consultar al Docente por WhatsApp (Nequi / Bancolombia)
                        </a>
                    </div>
                </div>

                <div style="text-align:center; margin-top:0.5rem;">
                    <button class="pg-close-btn" style="background:none; border:none; color:#94A3B8; font-size:0.84rem; cursor:pointer; text-decoration:underline;">
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
            const currentCourse = getCurrentCourseId();

            if (!val) {
                showToast('⚠️ Por favor ingresa una clave o código.', 'error');
                return;
            }

            // 1. Clave Maestra de Administrador (Profesor Obando)
            if (val === ADMIN_MASTER_KEY || val === 'OBANDO-MASTER-ADMIN') {
                localStorage.setItem('physicsailab_admin', 'true');
                closeModal();
                showToast('👑 ¡Sesión de Administrador Activada! Acceso total liberado a toda la plataforma.', 'success');
                updateGuardState();
                return;
            }

            // 2. Verificar licencias individuales de alumnos
            try {
                const licenses = JSON.parse(localStorage.getItem('physicsailab_student_licenses') || '[]');
                if (Array.isArray(licenses)) {
                    const licMatch = licenses.find(l => 
                        (l.courseId === currentCourse || l.courseId === 'all') && 
                        (l.code || '').trim().toUpperCase() === val && 
                        (!l.expiresAt || new Date(l.expiresAt).getTime() > Date.now())
                    );
                    if (licMatch) {
                        setCourseUnlocked(currentCourse, true, { 
                            licenseId: licMatch.id, 
                            isSubscription: licMatch.type === 'anual' || licMatch.type === 'semestral' || licMatch.type === 'vitalicio',
                            expiresAt: licMatch.expiresAt ? new Date(licMatch.expiresAt).getTime() : null,
                            studentName: licMatch.studentName
                        });
                        closeModal();
                        showToast(`🎓 ¡Licencia personal de ${licMatch.studentName} verificada! Acceso completo liberado.`, 'success');
                        updateGuardState();
                        return;
                    }
                }
            } catch(e) {}

            // 3. Obtener claves válidas para este curso (locales + nube en caché)
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

            validKeys = validKeys.map(k => (k || '').toUpperCase());

            if (validKeys.includes(val)) {
                setCourseUnlocked(currentCourse, true);
                closeModal();
                showToast(`🎉 ¡Clave válida! Curso desbloqueado exitosamente para este periodo.`, 'success');
                updateGuardState();
                return;
            }

            // 3. Revisar si es un código de licencia personal emitido en compras
            try {
                const licenses = JSON.parse(localStorage.getItem('physicsailab_student_licenses') || '[]');
                if (Array.isArray(licenses)) {
                    const matchLic = licenses.find(l => (l.codigo || '').toUpperCase() === val);
                    if (matchLic) {
                        setCourseUnlocked(currentCourse, true);
                        closeModal();
                        showToast(`🎉 ¡Licencia personal «${val}» activada con éxito!`, 'success');
                        updateGuardState();
                        return;
                    }
                }
            } catch(e) {}

            // 4. Verificación en tiempo real con Firebase por si el docente recién cambió la clave en la nube
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
                        if (targetCloudKey && targetCloudKey === val) {
                            setCourseUnlocked(currentCourse, true);
                            closeModal();
                            showToast(`🎉 ¡Clave activa sincronizada y verificada con la nube! Curso desbloqueado.`, 'success');
                            updateGuardState();
                            return;
                        }
                        // ¿Pertenece a otra materia en la nube?
                        for (const [otherId, otherKey] of Object.entries(cloudKeys)) {
                            if (otherId !== currentCourse && (otherKey || '').trim().toUpperCase() === val) {
                                showToast(`⚠️ Esta clave corresponde a «${otherId.toUpperCase()}», no a esta materia.`, 'error');
                                return;
                            }
                        }
                    }

                    // 5. Comprobar si la clave pertenece a otra materia en claves por defecto
                    let otherCourse = null;
                    for (const [cId, keys] of Object.entries(DEFAULT_COURSE_KEYS)) {
                        if (keys.some(k => k.toUpperCase() === val)) {
                            otherCourse = cId;
                            break;
                        }
                    }

                    if (otherCourse) {
                        showToast(`⚠️ Esta clave corresponde a «${otherCourse.toUpperCase()}». Cada curso tiene su propia clave independiente.`, 'error');
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

        doUnlockBtn.addEventListener('click', tryUnlock);
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryUnlock();
        });

        setTimeout(() => codeInput.focus(), 100);
    }

    // Floating bar
    let topBar = null;
    function renderTopBar() {
        if (isRecorrido) return; // Tour 3D liberado
        if (!topBar) {
            topBar = document.createElement('div');
            document.body.appendChild(topBar);
        }

        const curCourse = getCurrentCourseId();
        if (curCourse === 'historia') {
            topBar.className = 'pg-top-bar unlocked';
            topBar.innerHTML = `<span>🎁 <strong>«Cómo llegamos a saber»</strong> · Cortesía de Bienvenida · Acceso 100% Libre</span>`;
            return;
        }
        if (LAB_COURSE_IDS.includes(curCourse)) {
            topBar.className = 'pg-top-bar unlocked';
            topBar.innerHTML = `<span>🔬 <strong>Laboratorio Virtual Abierto</strong> · Acceso Libre al Público</span>`;
            return;
        }

        const unlocked = isUnlocked();
        const isAdmin = localStorage.getItem('physicsailab_admin') === 'true';
        if (unlocked) {
            topBar.className = 'pg-top-bar unlocked';
            topBar.innerHTML = isAdmin
                ? `<span>👑 <strong>Modo Administrador</strong> (Profesor Obando)</span>
                   <button type="button" id="pg-lock-again-btn" title="Cerrar sesión de administrador">Bloquear 🔒</button>`
                : `<span>🎓 <strong>Modo Estudiante Activo</strong></span>
                   <button type="button" id="pg-lock-again-btn" title="Cerrar sesión de estudiante en esta materia">Bloquear 🔒</button>`;
            const lockBtn = topBar.querySelector('#pg-lock-again-btn');
            if (lockBtn) {
                lockBtn.addEventListener('click', () => {
                    if (isAdmin) {
                        localStorage.removeItem('physicsailab_admin');
                    } else {
                        setCourseUnlocked(getCurrentCourseId(), false);
                    }
                    showToast('🔒 Sesión cerrada. Curso en vista previa.', 'info');
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

    // ----------------------------------------------------
    // Intercepción en Cuadernos Interactivos (Notebooks)
    // ----------------------------------------------------
    let cachedFirstThematicId = null;

    function getFirstThematicId() {
        if (cachedFirstThematicId) return cachedFirstThematicId;

        // 1. Buscar en templates
        const tmpls = Array.from(document.querySelectorAll('template.chapter-src'));
        for (const t of tmpls) {
            const dId = t.dataset.id;
            const dHome = t.dataset.home === 'true' || t.dataset.home === '';
            if (dId && dId !== 'inicio' && !dHome) {
                cachedFirstThematicId = dId;
                return cachedFirstThematicId;
            }
        }

        // 2. Buscar en #toc > a
        const tocLinks = Array.from(document.querySelectorAll('#toc > a, .toc > a'));
        for (const a of tocLinks) {
            const href = a.getAttribute('href') || '';
            const id = a.dataset.id || href.replace(/^#/, '').split('.')[0];
            if (id && id !== 'inicio') {
                cachedFirstThematicId = id;
                return cachedFirstThematicId;
            }
        }

        return cachedFirstThematicId;
    }

    function applyNotebookGuard() {
        const unlocked = isUnlocked();
        const firstThematic = getFirstThematicId();

        // 1. Sidebar TOC links (#toc a)
        const tocLinks = document.querySelectorAll('#toc a, .toc a');
        tocLinks.forEach((a) => {
            const href = a.getAttribute('href') || '';
            const id = a.dataset.id || href.replace(/^#/, '').split('.')[0];
            if (!id || id === 'inicio' || (firstThematic && id === firstThematic)) {
                // Portada y primer capítulo temático son 100% libres en la preview
                a.classList.remove('pg-locked');
                const p = a.querySelector('.pg-lock-pill');
                if (p) p.remove();
                return;
            }

            // Capítulos 2..N están bloqueados con candado
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

        // 2. Welcome cards (.home-card)
        const homeCards = document.querySelectorAll('.home-card');
        homeCards.forEach((card) => {
            const href = card.getAttribute('href') || '';
            const id = card.dataset.id || href.replace(/^#/, '').split('.')[0];
            if (!id || id === 'inicio' || (firstThematic && id === firstThematic)) {
                card.classList.remove('pg-locked');
                const b = card.querySelector('.home-card-lock-badge');
                if (b) b.remove();
                return;
            }

            const existingBadge = card.querySelector('.home-card-lock-badge');
            if (!unlocked) {
                card.classList.add('pg-locked');
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'home-card-lock-badge';
                    badge.textContent = '🔒 Premium';
                    card.appendChild(badge);
                }
            } else {
                card.classList.remove('pg-locked');
                if (existingBadge) existingBadge.remove();
            }
        });

        // 3. Bottom next chapter button (.ch-nav a.next)
        const nextButtons = document.querySelectorAll('.ch-nav a.next, nav.ch-nav a.next');
        nextButtons.forEach((btn) => {
            const href = btn.getAttribute('href') || '';
            const id = href.replace(/^#/, '').split('.')[0];
            if (!id || id === 'inicio' || (firstThematic && id === firstThematic)) {
                btn.classList.remove('pg-locked');
                const p = btn.querySelector('.pg-lock-pill');
                if (p) p.remove();
                return;
            }

            const existingPill = btn.querySelector('.pg-lock-pill');
            if (!unlocked) {
                btn.classList.add('pg-locked');
                if (!existingPill) {
                    const pill = document.createElement('span');
                    pill.className = 'pg-lock-pill';
                    pill.textContent = '🔒';
                    btn.appendChild(pill);
                }
            } else {
                btn.classList.remove('pg-locked');
                if (existingPill) existingPill.remove();
            }
        });

        // Intercepción global de clics en enlaces
        document.removeEventListener('click', handleNotebookClick, true);
        document.addEventListener('click', handleNotebookClick, true);

        // Validar hash actual
        checkCurrentNotebookHash(firstThematic);
    }

    function handleNotebookClick(e) {
        if (isUnlocked()) return;
        const targetA = e.target.closest('a');
        if (!targetA) return;

        const href = targetA.getAttribute('href') || '';
        if (!href.startsWith('#')) return;

        const id = (targetA.dataset && targetA.dataset.id) || href.replace(/^#/, '').split('.')[0];
        if (!id || id === 'inicio') return;

        const firstThematic = getFirstThematicId();
        if (firstThematic && id === firstThematic) return;

        // Cualquier otro capítulo está bloqueado en preview
        e.preventDefault();
        e.stopPropagation();
        const title = targetA.textContent.replace('🔒', '').replace('Premium', '').trim() || id;
        openPaywall(title);
    }

    function checkCurrentNotebookHash(firstThematic) {
        if (isUnlocked()) return;
        const h = decodeURIComponent(location.hash.replace(/^#/, '')).split('.')[0];
        if (!h || h === 'inicio') return;
        if (firstThematic && h === firstThematic) return;

        // Intentó entrar por hash directamente a un capítulo bloqueado
        setTimeout(() => {
            location.hash = firstThematic ? '#' + firstThematic : '#inicio';
            openPaywall(h);
        }, 150);
    }

    // ----------------------------------------------------
    // Intercepción en Laboratorio de Péndulo Simple
    // ----------------------------------------------------
    function applyPenduloGuard() {
        const unlocked = isUnlocked();
        // Tabs libres: 'banco' (simulador virtual de péndulo)
        // Tabs bloqueadas: 'real' (toma de datos reales), 'cuaderno' (cálculos y errores), 'matematico' (análisis no lineal), 'guia' (guía de práctica)
        const lockedTabs = ['real', 'cuaderno', 'matematico', 'guia'];

        lockedTabs.forEach((tabId) => {
            const navLink = document.querySelector(`.nav a[href="#${tabId}"], .nav a[data-tab="${tabId}"]`);
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

        document.removeEventListener('click', handlePenduloClick, true);
        document.addEventListener('click', handlePenduloClick, true);

        const currentHash = location.hash.replace(/^#/, '');
        if (!unlocked && lockedTabs.includes(currentHash)) {
            setTimeout(() => {
                const bLink = document.querySelector('.nav a[href="#banco"], .nav a[data-tab="banco"]');
                if (bLink) bLink.click();
                else location.hash = '#banco';
                openPaywall(currentHash);
            }, 200);
        }
    }

    function handlePenduloClick(e) {
        if (isUnlocked()) return;
        const targetA = e.target.closest('.nav a');
        if (!targetA) return;

        const href = targetA.getAttribute('href') || '';
        const tabId = (targetA.dataset && targetA.dataset.tab) || href.replace(/^#/, '');
        const lockedTabs = ['real', 'cuaderno', 'matematico', 'guia'];

        if (lockedTabs.includes(tabId)) {
            e.preventDefault();
            e.stopPropagation();
            const tabName = targetA.textContent.replace('🔒', '').trim();
            openPaywall(tabName);
        }
    }

    // ----------------------------------------------------
    // Intercepción en Laboratorio de Venturi
    // ----------------------------------------------------
    function applyVenturiGuard() {
        const unlocked = isUnlocked();
        // Tabs libres: 'banco' (simulador tubo Venturi)
        // Tabs bloqueadas: 'cuaderno' (registro de datos y cálculo de caudal), 'guia' (guía de laboratorio)
        const lockedTabs = ['cuaderno', 'guia'];

        lockedTabs.forEach((tabId) => {
            const navLink = document.querySelector(`.nav a[href="#${tabId}"], .nav a[data-tab="${tabId}"]`);
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

        document.removeEventListener('click', handleVenturiClick, true);
        document.addEventListener('click', handleVenturiClick, true);

        const currentHash = location.hash.replace(/^#/, '');
        if (!unlocked && lockedTabs.includes(currentHash)) {
            setTimeout(() => {
                const bLink = document.querySelector('.nav a[href="#banco"], .nav a[data-tab="banco"]');
                if (bLink) bLink.click();
                else location.hash = '#banco';
                openPaywall(currentHash);
            }, 200);
        }
    }

    function handleVenturiClick(e) {
        if (isUnlocked()) return;
        const targetA = e.target.closest('.nav a');
        if (!targetA) return;

        const href = targetA.getAttribute('href') || '';
        const tabId = (targetA.dataset && targetA.dataset.tab) || href.replace(/^#/, '');
        const lockedTabs = ['cuaderno', 'guia'];

        if (lockedTabs.includes(tabId)) {
            e.preventDefault();
            e.stopPropagation();
            const tabName = targetA.textContent.replace('🔒', '').trim();
            openPaywall(tabName);
        }
    }

    // ----------------------------------------------------
    // Intercepción en Laboratorio de Transformadores
    // ----------------------------------------------------
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

        const currentHash = location.hash.replace(/^#/, '');
        if (!unlocked && lockedTabs.includes(currentHash)) {
            setTimeout(() => {
                location.hash = '#banco';
                openPaywall(currentHash);
            }, 200);
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

    // ----------------------------------------------------
    // Intercepción en Simulador de Squash & Biomecánica
    // ----------------------------------------------------
    function applySquashGuard() {
        const unlocked = isUnlocked();
        const lockedNavs = ['editor', 'anatomia', 'fisiologia', 'biomecanica', 'lesiones', 'fundamentos'];

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

        document.removeEventListener('click', handleSquashClick, true);
        document.addEventListener('click', handleSquashClick, true);

        const currentHash = location.hash.replace(/^#/, '');
        if (!unlocked && lockedNavs.includes(currentHash)) {
            setTimeout(() => {
                const simBtn = document.querySelector('.nav button[data-go="simulador"]');
                if (simBtn) simBtn.click();
                openPaywall(currentHash);
            }, 200);
        }
    }

    function handleSquashClick(e) {
        if (isUnlocked()) return;

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

        const lockedCtrl = e.target.closest('#btnEditThis, #btnExport, [data-exp], #rtSel, .pg-locked-control');
        if (lockedCtrl) {
            e.preventDefault();
            e.stopPropagation();
            openPaywall('Edición y Parámetros del Simulador');
            return;
        }
    }

    // ----------------------------------------------------
    // Intercepción en Curso de Inglés (Quantum Leap English)
    // ----------------------------------------------------
    function applyInglesGuard() {
        const unlocked = isUnlocked();
        // Libre: primera unidad (#u-a1-1 o primer paso) y la ruta
        // Bloqueado: repaso, frases, recursos, metodo y unidades 2 en adelante
        const lockedNavs = ['repaso', 'frases', 'recursos', 'metodo'];

        lockedNavs.forEach((tabId) => {
            const navLink = document.querySelector(`.nav a[href="#${tabId}"], .nav a[data-nav="${tabId}"]`);
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

        // Unidades bloqueadas en la ruta
        const unitCards = document.querySelectorAll('.unit-card, .unit, [data-unit]');
        unitCards.forEach((card, idx) => {
            if (idx === 0) return; // Unidad 1 es libre
            const existingPill = card.querySelector('.pg-lock-pill');
            if (!unlocked) {
                card.classList.add('pg-locked-tab');
                if (!existingPill) {
                    const pill = document.createElement('span');
                    pill.className = 'pg-lock-pill';
                    pill.textContent = '🔒';
                    card.appendChild(pill);
                }
            } else {
                card.classList.remove('pg-locked-tab');
                if (existingPill) existingPill.remove();
            }
        });

        document.removeEventListener('click', handleInglesClick, true);
        document.addEventListener('click', handleInglesClick, true);
    }

    function handleInglesClick(e) {
        if (isUnlocked()) return;
        const targetA = e.target.closest('a');
        if (!targetA) return;

        const href = targetA.getAttribute('href') || '';
        const navId = (targetA.dataset && targetA.dataset.nav) || href.replace(/^#/, '');
        const lockedNavs = ['repaso', 'frases', 'recursos', 'metodo'];

        if (lockedNavs.includes(navId)) {
            e.preventDefault();
            e.stopPropagation();
            openPaywall(targetA.textContent.replace('🔒', '').trim());
            return;
        }

        // Si intentó ir a unidad >= 2 (por ejemplo #u-a1-2, etc.)
        const unitMatch = href.match(/^#u-[a-z0-9]+-(\d+)/i);
        if (unitMatch && parseInt(unitMatch[1], 10) > 1) {
            e.preventDefault();
            e.stopPropagation();
            openPaywall('Unidad ' + unitMatch[1]);
        }
    }

    // ----------------------------------------------------
    // Intercepción en Torneos Squash Popayán
    // ----------------------------------------------------
    
    function applyFaroGuard() {
        const unlocked = isUnlocked();
        const freeHrefs = ['#que-es', '#sistema'];
        const lockedSectionIds = ['sensores', 'materiales', 'electronica', 'carcasa', 'montaje', 'firmware', 'puesta', 'entrenar', 'problemas', 'seguridad', 'siguiente', 'archivos'];

        // 1. Bloqueo en índice lateral
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

        // 2. Bloqueo físico y visual de las secciones técnicas (electrónica, STL 3D, firmware)
        lockedSectionIds.forEach(id => {
            const sec = document.getElementById(id);
            if (!sec) return;
            if (!unlocked) {
                sec.style.display = 'none';
                sec.classList.add('pg-faro-locked');
            } else {
                sec.style.display = '';
                sec.classList.remove('pg-faro-locked');
            }
        });

        // 3. Tarjeta de barrera de paywall tras la sección gratuita #sistema
        const sistemaSec = document.getElementById('sistema');
        let barrier = document.getElementById('pg-faro-paywall-barrier');
        if (!unlocked) {
            if (!barrier && sistemaSec && sistemaSec.parentNode) {
                barrier = document.createElement('div');
                barrier.id = 'pg-faro-paywall-barrier';
                barrier.className = 'pg-faro-barrier-card';
                barrier.innerHTML = `
                    <div style="font-size:2.4rem; margin-bottom:0.5rem;">🔒</div>
                    <h3>Contenido Exclusivo · Kit y Manual de Taller Faro</h3>
                    <p>
                        Has completado la <strong>vista previa gratuita</strong> (Introducción y Sistema). Los módulos técnicos de esquemas eléctricos interactivos, firmware ESP32-S3 (2.700 líneas), despiece 3D y planos 1:1 requieren clave de alumno o adquisición del kit.
                    </p>
                    <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
                        <button type="button" id="pg-faro-barrier-unlock-btn" style="background:linear-gradient(135deg, #0284c7, #06b6d4); color:#fff; font-weight:700; border:none; padding:0.65rem 1.35rem; border-radius:10px; cursor:pointer; font-size:0.92rem; box-shadow:0 4px 15px rgba(2,132,199,0.35);">
                            🔑 Desbloquear con Clave de Alumno
                        </button>
                        <a href="https://physicsailab.com/#cursos" target="_blank" style="background:rgba(255,255,255,0.08); color:#e2e8f0; font-weight:600; border:1px solid rgba(255,255,255,0.2); padding:0.65rem 1.25rem; border-radius:10px; text-decoration:none; font-size:0.92rem;">
                            💳 Adquirir Kit &amp; Manual de Taller
                        </a>
                    </div>
                `;
                sistemaSec.parentNode.insertBefore(barrier, sistemaSec.nextSibling);
                const uBtn = barrier.querySelector('#pg-faro-barrier-unlock-btn');
                if (uBtn) {
                    uBtn.addEventListener('click', () => openPaywall('faro'));
                }
            }
        } else {
            if (barrier) barrier.remove();
        }

        // 4. Interceptores de interacción y scroll
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

            window.addEventListener('scroll', () => {
                if (isUnlocked()) return;
                const barrierEl = document.getElementById('pg-faro-paywall-barrier');
                if (barrierEl) {
                    const rect = barrierEl.getBoundingClientRect();
                    if (rect.bottom < -280) {
                        barrierEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        openPaywall('faro');
                    }
                }
            }, { passive: true });
        }
    }

    
    function applyArbitrajeGuard() {
        const unlocked = isUnlocked();
        // Módulos que requieren clave completa: Árbol de interferencias y Planilla/Marcador
        const lockedTabs = ['interferencia', 'marcador'];

        lockedTabs.forEach((tabId) => {
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

    function applyTorneosGuard() {
        const unlocked = isUnlocked();
        // Libre: vista de cuadros / partidos demo
        // Bloqueado: creación de torneos, exportación de reportes, sincronización en vivo
        const restrictedSelectors = ['#btnNewTournament', '#btnSyncFirebase', '#btnExportPdf', '[data-action="admin"]'];
        restrictedSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (!unlocked) {
                    el.classList.add('pg-locked-control');
                    el.setAttribute('title', '🔒 Bloqueado en Vista Previa');
                } else {
                    el.classList.remove('pg-locked-control');
                    el.removeAttribute('title');
                }
            });
        });
    }

    // ----------------------------------------------------
    // Actualización de estado general
    // ----------------------------------------------------
    function updateGuardState() {
        if (isRecorrido) return; // Tour 3D liberado

        renderTopBar();
        if (isPendulo) {
            applyPenduloGuard();
        } else if (isVenturi) {
            applyVenturiGuard();
        } else if (isTransformadores) {
            applyTransformadoresGuard();
        } else if (isSquash) {
            applySquashGuard();
        } else if (isIngles) {
            applyInglesGuard();
        } else if (isTorneos) {
            applyTorneosGuard();
        } else if (isFaro) {
            applyFaroGuard();
        } else {
            // Notebook interactivo por defecto (Óptica, Mecánica, Materiales, Ondas, Termo, Fluidos, Cuántica, RETIE, etc.)
            applyNotebookGuard();
        }
    }

    // Inicialización al cargar el DOM
    
    // Telemetría en vivo de sesiones activas (Anti-compartir cuentas y control de accesos)
    function initActiveSessionTelemetry(cId) {
        try {
            const FIREBASE_BASE = 'https://squashpopayan-65e33-default-rtdb.firebaseio.com';
            let sId = sessionStorage.getItem('physicsailab_session_id');
            if (!sId) {
                sId = 'ses_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
                sessionStorage.setItem('physicsailab_session_id', sId);
            }

            const profile = JSON.parse(localStorage.getItem('physicsailab_student_profile') || '{}');
            const isAdminUser = localStorage.getItem('physicsailab_admin') === 'true';
            const studentName = isAdminUser ? '👑 Profesor Manuel Obando' : (profile.name || 'Estudiante / Visitante');
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const dev = isMobile ? 'Móvil' : 'PC / Laptop';

            function beat() {
                const payload = {
                    sessionId: sId,
                    studentName: studentName,
                    courseId: cId,
                    pageTitle: document.title || cId,
                    path: location.pathname,
                    device: dev,
                    lastSeen: Date.now(),
                    isUnlocked: isUnlocked(),
                    isOnline: true
                };

                fetch(`${FIREBASE_BASE}/active_sessions/${sId}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => {});

                // Verificar si esta sesión fue expulsada por el docente
                fetch(`${FIREBASE_BASE}/revoked_sessions/${sId}.json`)
                    .then(r => r.json())
                    .then(rev => {
                        if (rev === true) {
                            setCourseUnlocked(cId, false);
                            alert('🔒 Tu sesión ha sido cerrada por el docente administrador. Por favor ingresa nuevamente tu clave.');
                            location.reload();
                        }
                    }).catch(() => {});
            }

            beat();
            setInterval(beat, 45000);
        } catch(e) {}
    }

    function init() {
        initActiveSessionTelemetry(getCurrentCourseId());
        updateGuardState();
        setTimeout(updateGuardState, 150);
        setTimeout(updateGuardState, 500);
        setTimeout(updateGuardState, 1200);

        // Observar cambios dinámicos en la tabla de contenidos si se construye asíncronamente
        const tocEl = document.querySelector('#toc, .toc, .nav, nav');
        if (tocEl && window.MutationObserver) {
            const obs = new MutationObserver(() => {
                updateGuardState();
            });
            obs.observe(tocEl, { childList: true, subtree: true });
        }

        window.addEventListener('hashchange', () => {
            setTimeout(updateGuardState, 80);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 30);
    }

    // Exportar a window para control manual si se requiere
    window.PhysicsAILabGuard = {
        isUnlocked,
        setUnlocked,
        openPaywall,
        update: updateGuardState,
        getCurrentCourseId
    };
})();
