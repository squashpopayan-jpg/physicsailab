const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'web', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Scripts at bottom
if (!html.includes('trivia-historia-engine.js')) {
    const targetScript = `<script src="trivia-squash-engine.js"></script>`;
    const repScript = `<script src="trivia-squash-engine.js"></script>\r\n    <script src="trivia-historia-questions.js"></script>\r\n    <script src="trivia-historia-engine.js"></script>`;
    if (html.includes(targetScript)) {
        html = html.replace(targetScript, repScript);
        console.log('✅ Scripts added at bottom of index.html');
    } else {
        console.warn('⚠️ targetScript not found with exact CRLF, trying regex');
        html = html.replace(/<script src="trivia-squash-engine\.js"><\/script>/,
            `<script src="trivia-squash-engine.js"></script>\n    <script src="trivia-historia-questions.js"></script>\n    <script src="trivia-historia-engine.js"></script>`);
    }
}

// 2. Hero button
if (!html.includes('href="#trivia-historia"')) {
    // In hero actions:
    const targetHero = `<a href="#trivia-squash" class="btn btn-secondary"`;
    const repHero = `<a href="#trivia-historia" class="btn btn-secondary" style="border-color:rgba(217,119,6,0.65); color:#f59e0b; background:rgba(217,119,6,0.12); font-weight:700;">📜 Trivia Historia</a>\r\n                <a href="#trivia-squash" class="btn btn-secondary"`;
    if (html.includes(targetHero)) {
        html = html.replace(targetHero, repHero);
        console.log('✅ Hero button added');
    }
    
    // Quick chips:
    const targetChip = `<a href="#trivia-squash" class="quick-chip"`;
    const repChip = `<a href="#trivia-historia" class="quick-chip" style="background:rgba(217,119,6,0.18); border-color:rgba(217,119,6,0.5); color:#f59e0b; font-weight:700;">📜 Historia de la Física</a>\r\n                <a href="#trivia-squash" class="quick-chip"`;
    if (html.includes(targetChip)) {
        html = html.replace(targetChip, repChip);
        console.log('✅ Quick chip added');
    }
    
    // Mobile drawer:
    const targetDrawer = `<li><a href="#trivia-squash" onclick="closeMobileDrawer()"`;
    const repDrawer = `<li><a href="#trivia-historia" onclick="closeMobileDrawer()" style="color:#f59e0b; font-weight:700;"><span class="drawer-icon">📜</span> <span>Gran Trivia de Historia de la Física</span></a></li>\r\n                <li><a href="#trivia-squash" onclick="closeMobileDrawer()"`;
    if (html.includes(targetDrawer)) {
        html = html.replace(targetDrawer, repDrawer);
        console.log('✅ Mobile drawer link added');
    }
    
    // Portal cards (after portal card 2.6):
    const targetPortal = `<!-- Tarjeta 2.6: Gran Trivia de Squash -->`;
    const repPortal = `<!-- Tarjeta 2.55: Gran Trivia de Historia de la Física -->
                    <div class="portal-card" onclick="navigateToSection('trivia-historia')" style="border-color:rgba(217,119,6,0.45); background:linear-gradient(135deg, rgba(217,119,6,0.12), rgba(15,23,42,0.7));">
                        <div class="portal-card-header">
                            <span class="portal-card-icon" style="background:rgba(217,119,6,0.2); color:#f59e0b;">📜</span>
                            <span class="portal-card-badge" style="background:rgba(217,119,6,0.2); color:#f59e0b; border-color:rgba(217,119,6,0.4);">3 Vidas · Ranking</span>
                        </div>
                        <h3 class="portal-card-title">Gran Trivia: ¿Qué tanto sabes sobre la Historia de la Física?</h3>
                        <p class="portal-card-desc">Explora personajes, grandes descubrimientos, fechas y eventos históricos clave con 3 vidas, racha de 10 aciertos y ranking oficial.</p>
                        <div class="portal-card-action" style="color:#f59e0b;">
                            <span>Iniciar Trivia &amp; Ver Ranking</span>
                            <span class="action-arrow">➔</span>
                        </div>
                    </div>

                    ${targetPortal}`;
    if (html.includes(targetPortal)) {
        html = html.replace(targetPortal, repPortal);
        console.log('✅ Portal card added');
    }
}

// 3. Section #trivia-historia insertion
if (!html.includes('id="trivia-historia"')) {
    const sectionHtml = `
    <!-- ==========================================================================
         SECCIÓN DEDICADA: GRAN TRIVIA DE HISTORIA DE LA FÍSICA
         ========================================================================== -->
    <section class="section section-trivia-historia" id="trivia-historia">
        <div class="container">

            <!-- Barra de Navegación de Página Dedicada -->
            <div class="dedicated-view-header">
                <button type="button" class="btn-back-portal" onclick="navigateToSection('inicio')">
                    <span class="back-arrow">←</span> <strong>Volver al Portal de Bienvenida</strong>
                </button>
                <div class="view-breadcrumbs">
                    <a href="javascript:void(0)" onclick="navigateToSection('inicio')">🏠 Inicio</a>
                    <span class="bc-sep">/</span>
                    <span class="bc-title">📜 Gran Trivia de Historia de la Física</span>
                </div>
                <div class="view-jump-chips">
                    <span class="jump-label">Saltar a:</span>
                    <button type="button" onclick="navigateToSection('trivia')">🎯 Trivia Física</button>
                    <button type="button" onclick="navigateToSection('trivia-squash')">🎾 Trivia Squash</button>
                    <button type="button" onclick="navigateToSection('cursos')">🚀 Cursos</button>
                    <button type="button" onclick="navigateToSection('quizzes')">🎮 Quizzes</button>
                    <button type="button" onclick="navigateToSection('juegos')">🕹️ Juegos</button>
                    <button type="button" onclick="navigateToSection('curiosidades')">💡 Curiosidades</button>
                </div>
            </div>

            <!-- Encabezado de la Sección -->
            <div class="section-header">
                <div style="display:inline-flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem; flex-wrap:wrap;">
                    <span class="badge" style="background:rgba(217, 119, 6, 0.15); border-color:rgba(217, 119, 6, 0.4); color:#f59e0b; font-weight:700;">
                        📜 Desafío Histórico con 3 Vidas
                    </span>
                    <span class="badge" style="background:rgba(56, 189, 248, 0.15); border-color:rgba(56, 189, 248, 0.4); color:#38bdf8; font-weight:700;">
                        🏆 Salón de la Fama y Ranking Oficial
                    </span>
                    <span class="badge" style="background:rgba(245, 158, 11, 0.15); border-color:rgba(245, 158, 11, 0.4); color:#fbbf24; font-weight:700;">
                        🧠 Cultura Científica · Sin Consultas ni IA
                    </span>
                </div>
                <h2>¿Qué Tanto Sabes Sobre la Historia de la Física?</h2>
                <p>
                    Recorre la fascinante aventura del pensamiento científico en un banco dinámico de <strong>preguntas aleatorias de selección múltiple con 3 vidas</strong>. Desde los filósofos presocráticos y la revolución copernicana hasta Newton, Maxwell, la relatividad de Einstein, la mecánica cuántica y los descubrimientos del siglo XXI.
                </p>
            </div>

            <!-- CONTENEDOR PRINCIPAL DE LA TRIVIA DE HISTORIA -->
            <div class="trivia-container" id="historia-trivia-container">

                <!-- VISTA 1: BIENVENIDA, REGLAS Y REGISTRO -->
                <div id="historia-trivia-view-welcome" class="trivia-view">
                    <div class="trivia-welcome-card">
                        <div class="trivia-welcome-decor" aria-hidden="true">
                            <span>📜</span>
                            <span>⚛️</span>
                            <span>🔭</span>
                            <span>🏆</span>
                        </div>

                        <div class="trivia-welcome-header">
                            <span class="trivia-main-icon">📜</span>
                            <div>
                                <h3 class="trivia-welcome-title">El Gran Desafío de Historia de la Física</h3>
                                <p class="trivia-welcome-desc">
                                    Explora los personajes, experimentos célebres, fechas y debates que transformaron nuestra comprensión del universo. Tu puntuación y racha quedarán registradas en el <strong>Salón Oficial de la Fama</strong>.
                                </p>
                            </div>
                        </div>

                        <!-- Métricas rápidas de la comunidad -->
                        <div class="trivia-community-stats">
                            <div class="trivia-stat-box">
                                <span class="stat-icon">📚</span>
                                <strong class="stat-val" style="color:#ef4444; letter-spacing:1px;">❤️❤️❤️</strong>
                                <span class="stat-label">3 Vidas por Partida</span>
                            </div>
                            <div class="trivia-stat-box">
                                <span class="stat-icon">👥</span>
                                <strong class="stat-val" id="historia-trivia-stat-participants">10</strong>
                                <span class="stat-label">En el Salón de la Fama</span>
                            </div>
                            <div class="trivia-stat-box">
                                <span class="stat-icon">🏆</span>
                                <strong class="stat-val" id="historia-trivia-stat-top-score" style="color:#f59e0b;">15.200 pts</strong>
                                <span class="stat-label">Puntaje Récord</span>
                            </div>
                            <div class="trivia-stat-box">
                                <span class="stat-icon">🔥</span>
                                <strong class="stat-val" id="historia-trivia-stat-top-streak" style="color:#fbbf24;">🔥 42</strong>
                                <span class="stat-label">Mejor Racha de Aciertos</span>
                            </div>
                        </div>

                        <!-- CAJA OBLIGATORIA DE INSTRUCCIONES Y REGLA DE HONOR -->
                        <div class="trivia-rules-card">
                            <div class="rules-card-header">
                                <span style="font-size:1.3rem;">📋</span>
                                <div>
                                    <h4 style="margin:0; color:#fff; font-size:1.05rem;">Instrucciones Oficiales &amp; Regla de Honor</h4>
                                    <span style="font-size:0.78rem; color:#cbd5e1;">Lee con atención antes de iniciar tu viaje en la historia</span>
                                </div>
                            </div>
                            <div class="rules-card-body">
                                <div class="rule-item" style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); border-radius:8px; padding:0.85rem 1rem;">
                                    <span class="rule-icon">❤️</span>
                                    <div>
                                        <strong style="color:#f87171;">Sistema de 3 Vidas (Game Over al agotarlas):</strong>
                                        <p style="color:#fca5a5; margin:0.25rem 0 0;">
                                            Inicias con <strong>3 vidas</strong> (❤️❤️❤️). Si cometes 3 errores en tus respuestas históricas, el sistema finaliza tu partida, guarda tus puntos y te ubica directamente en el <strong>Salón de la Fama</strong>.
                                        </p>
                                    </div>
                                </div>
                                <div class="rule-item" style="background:rgba(16,185,129,0.09); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:0.85rem 1rem;">
                                    <span class="rule-icon">💖</span>
                                    <div>
                                        <strong style="color:#34d399;">Recuperación de Vida por Racha de 10 Aciertos:</strong>
                                        <p style="color:#a7f3d0; margin:0.25rem 0 0;">
                                            Si logras conectar una racha de <strong>10 aciertos seguidos</strong> sin equivocarte, ¡recuperas automáticamente 1 vida perdida! (máximo acumulable: 3 vidas).
                                        </p>
                                    </div>
                                </div>
                                <div class="rule-item" style="background:rgba(217,119,6,0.08); border:1px solid rgba(217,119,6,0.3); border-radius:8px; padding:0.85rem 1rem;">
                                    <span class="rule-icon">🔀</span>
                                    <div>
                                        <strong style="color:#f59e0b;">Orden Aleatorio de Preguntas:</strong>
                                        <p style="color:#fde68a; margin:0.25rem 0 0;">
                                            Cada ingreso baraja aleatoriamente el banco de preguntas abarcando Grecia Antigua, Revolución Científica, Mecánica Newtoniana, Termodinámica, Electromagnetismo, Relatividad, Cuántica, Nuclear y Física Contemporánea.
                                        </p>
                                    </div>
                                </div>
                                <div class="rule-item highlight-rule">
                                    <span class="rule-icon">🚫</span>
                                    <div>
                                        <strong style="color:#f87171;">Sin consultas a libros ni Inteligencia Artificial:</strong>
                                        <p style="color:#fca5a5; margin:0.25rem 0 0;">
                                            Todas las preguntas son de selección múltiple (A, B, C, D). En este reto <strong>NO necesitas consultar enciclopedias ni preguntar a la IA</strong>. Mide tu cultura científica y memoria histórica real.
                                        </p>
                                    </div>
                                </div>
                                <div class="rule-item">
                                    <span class="rule-icon">🔥</span>
                                    <div>
                                        <strong>Puntaje y Bonos por Racha:</strong>
                                        <p style="margin:0.25rem 0 0;">Cada acierto suma 100 puntos base más multiplicador progresivo por racha consecutiva.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Formulario de Registro para el Ranking de Historia -->
                        <div class="trivia-register-card">
                            <div style="font-size:0.95rem; font-weight:800; color:#fff; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
                                <span>✍️</span> Registro de Participante para el Salón de la Fama:
                            </div>
                            <div class="trivia-form-grid">
                                <div>
                                    <label for="historia-trivia-player-name" class="trivia-form-label">
                                        Nombre Completo o Alias: <strong style="color:#f87171;">*</strong>
                                    </label>
                                    <input type="text" id="historia-trivia-player-name" class="trivia-form-input" placeholder="Tu nombre completo o usuario" maxlength="60" required />
                                </div>
                                <div>
                                    <label for="historia-trivia-player-inst" class="trivia-form-label">
                                        Universidad / Colegio / Ciudad: <span style="color:var(--text-muted); font-size:0.75rem;">(Opcional)</span>
                                    </label>
                                    <input type="text" id="historia-trivia-player-inst" class="trivia-form-input" placeholder="Ej: Universidad del Cauca / Popayán" maxlength="70" />
                                </div>
                            </div>

                            <!-- Botones de Acción -->
                            <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:1.25rem;">
                                <button type="button" class="btn btn-primary btn-start-trivia" onclick="TRIVIA_HISTORIA_ENGINE.start(true)">
                                    📜 Iniciar Viaje Histórico (Desde la Pregunta #1)
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="TRIVIA_HISTORIA_ENGINE.switchView('ranking')" style="border-color:rgba(217,119,6,0.5); color:#f59e0b;">
                                    🏆 Ver Salón de la Fama
                                </button>
                            </div>

                            <!-- Opción de continuar progreso -->
                            <div id="historia-trivia-resume-box" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px dashed rgba(255,255,255,0.1);">
                                <button type="button" class="btn btn-secondary" id="historia-trivia-resume-btn" onclick="TRIVIA_HISTORIA_ENGINE.resume()" style="border-color:rgba(245,158,11,0.5); color:#f59e0b; font-weight:700;">
                                    ▶️ Continuar donde quedé en la historia
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VISTA 2: TABLERO DE JUEGO ACTIVO -->
                <div id="historia-trivia-view-game" class="trivia-view" style="display:none;">
                    <div class="trivia-game-card">
                        <!-- Barra Superior de Estado Gamificada -->
                        <div class="trivia-game-header">
                            <div class="trivia-header-left">
                                <span class="trivia-area-tag" id="historia-trivia-area-badge" style="background:rgba(217,119,6,0.15); border-color:rgba(217,119,6,0.4); color:#f59e0b;">Historia de la Física</span>
                                <span class="trivia-diff-tag" id="historia-trivia-difficulty-badge">Nivel 1: Básico</span>
                            </div>
                            <div class="trivia-header-center">
                                <span class="trivia-q-num" id="historia-trivia-question-number">Pregunta 1</span>
                            </div>
                            <div class="trivia-header-right">
                                <div class="trivia-stat-pill lives" id="historia-trivia-lives-pill" title="3 vidas por partida. Racha de 10 aciertos recupera 1 vida.">
                                    <span>❤️</span> <strong id="historia-trivia-lives-val">❤️❤️❤️</strong>
                                </div>
                                <div class="trivia-stat-pill score" style="border-color:rgba(217,119,6,0.35);">
                                    <span>🏆</span> <strong id="historia-trivia-score-val">0 pts</strong>
                                </div>
                                <div class="trivia-stat-pill streak">
                                    <strong id="historia-trivia-streak-val">🔥 0</strong>
                                </div>
                                <button type="button" class="btn-trivia-pause" onclick="TRIVIA_HISTORIA_ENGINE.finishAndShowRanking()" title="Guardar progreso y ver ranking">
                                    💾 Salir y Guardar
                                </button>
                            </div>
                        </div>

                        <!-- Barra de Progreso Dinámica -->
                        <div class="trivia-progress-bar-wrap">
                            <div class="trivia-progress-bar-fill" id="historia-trivia-progress-bar-fill" style="width: 0.3%;"></div>
                        </div>

                        <!-- Cuerpo de la Pregunta -->
                        <div class="trivia-game-body" id="historia-trivia-game-body">
                            <div class="trivia-question-card">
                                <h3 class="trivia-question-text" id="historia-trivia-question-text">
                                    Cargando pregunta de historia de la física...
                                </h3>
                            </div>

                            <!-- Opciones de Selección Múltiple (A, B, C, D) -->
                            <div class="trivia-options-grid" id="historia-trivia-options-container">
                                <!-- Generadas dinámicamente -->
                            </div>

                            <!-- Tarjeta de Retroalimentación Inmediata con Explicación -->
                            <div id="historia-trivia-feedback-card" class="trivia-feedback-card" style="display:none;">
                                <div class="feedback-title" id="historia-trivia-feedback-title"></div>
                                <div class="feedback-text" id="historia-trivia-feedback-text"></div>
                            </div>

                            <!-- Botón Siguiente Pregunta -->
                            <div style="text-align:right; margin-top:1.25rem;">
                                <button type="button" class="btn btn-primary btn-next-trivia" id="historia-trivia-next-btn" onclick="TRIVIA_HISTORIA_ENGINE.nextQuestion()" style="display:none;">
                                    Siguiente Pregunta ➔
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VISTA 3: TABLA DE LÍDERES / RANKING -->
                <div id="historia-trivia-view-ranking" class="trivia-view" style="display:none;">
                    <div class="trivia-ranking-card">
                        <div class="ranking-header">
                            <div>
                                <span class="badge" style="background:rgba(217, 119, 6, 0.15); border-color:rgba(217, 119, 6, 0.4); color:#f59e0b;">
                                    🏆 Salón Oficial de la Fama
                                </span>
                                <h3 style="color:#fff; font-size:1.45rem; margin:0.35rem 0 0.25rem;">Tabla Histórica de Clasificación</h3>
                                <p style="font-size:0.84rem; color:var(--text-muted); margin:0;">
                                    Mejores puntuaciones registradas en la Gran Trivia de Historia de la Física.
                                </p>
                            </div>
                            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                <button type="button" class="btn btn-primary" id="historia-trivia-ranking-play-btn" onclick="TRIVIA_HISTORIA_ENGINE.start(true)" style="background:linear-gradient(135deg, #d97706, #b45309); border:none; font-size:0.85rem; padding:0.5rem 1rem;">
                                    🎮 Nueva Partida (3 Vidas ❤️)
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="TRIVIA_HISTORIA_ENGINE.switchView('welcome')" style="font-size:0.85rem; padding:0.5rem 1rem;">
                                    📋 Menú Principal
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="TRIVIA_HISTORIA_ENGINE.shareWhatsApp()" style="border-color:#25D366; color:#25D366; font-size:0.85rem; padding:0.5rem 1rem;">
                                    💬 Compartir Récord
                                </button>
                            </div>
                        </div>

                        <!-- Podio Top 3 -->
                        <div class="trivia-podium-grid" id="historia-trivia-ranking-podium">
                            <!-- Inyectado dinámicamente -->
                        </div>

                        <!-- Filtro de Búsqueda -->
                        <div style="margin-bottom:1rem; display:flex; gap:0.75rem; align-items:center;">
                            <input type="text" id="historia-trivia-ranking-search" class="trivia-form-input" placeholder="🔍 Buscar participante, universidad o ciudad..." oninput="TRIVIA_HISTORIA_ENGINE.renderRanking()" style="max-width:380px;" />
                        </div>

                        <!-- Tabla Completa de Posiciones -->
                        <div class="trivia-table-wrap">
                            <table class="trivia-table">
                                <thead>
                                    <tr>
                                        <th style="width:70px;">Posición</th>
                                        <th>Participante / Universidad</th>
                                        <th style="text-align:center;">Puntaje</th>
                                        <th style="text-align:center;">Nivel Máximo</th>
                                        <th style="text-align:center;">Racha Récord</th>
                                        <th style="text-align:right;">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody id="historia-trivia-ranking-tbody">
                                    <!-- Inyectado dinámicamente -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Navegación Inferior entre Páginas -->
            <div class="dedicated-view-footer">
                <button type="button" class="btn btn-secondary" onclick="navigateToSection('trivia')" style="font-weight:700;">
                    ← Gran Trivia de Física
                </button>
                <button type="button" class="btn btn-primary" onclick="navigateToSection('trivia-squash')" style="font-weight:700;">
                    Gran Trivia de Squash →
                </button>
            </div>
        </div>
    </section>
`;

    // Insert right after </section> of #trivia (before #juegos)
    const targetEndSection = `Zona Arcade de Juegos →\r\n                </button>\r\n            </div>\r\n        </div>\r\n    </section>`;
    if (html.includes(targetEndSection)) {
        html = html.replace(targetEndSection, `${targetEndSection}\r\n${sectionHtml}`);
        console.log('✅ Section #trivia-historia inserted cleanly');
    } else {
        // Try regex
        const regexEnd = /(Zona Arcade de Juegos →[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/section>)/;
        if (regexEnd.test(html)) {
            html = html.replace(regexEnd, `$1\n${sectionHtml}`);
            console.log('✅ Section #trivia-historia inserted via regex');
        } else {
            console.warn('⚠️ Could not find exact insertion point for #trivia-historia');
        }
    }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 web/index.html updated successfully!');
