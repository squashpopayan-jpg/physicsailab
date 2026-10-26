// ==========================================================================
// MOTOR GAMIFICADO DE LA GRAN TRIVIA DE SQUASH
// PhysicsAILab · Prof. Manuel Alejandro Obando
// "¿Qué tanto sabes sobre el squash?"
// Diseñado para evaluación progresiva honesta sin apuntes ni IA.
// Reglas: 3 vidas, recuperación por racha de 10 aciertos, preguntas barajadas aleatoriamente.
// ==========================================================================

(function() {
    'use strict';

    // Estado global de la trivia de squash
    
    const FAKE_TRIVIA_BENCHMARKS = [
        'laura camila mosquera', 'juan david benavides', 'mateo alejandro gómez', 'mateo alejandro gomez',
        'daniela sofía prado', 'daniela sofia prado', 'andrés felipe muñoz', 'andres felipe muñoz',
        'santiago rengifo', 'valentina ordóñez', 'valentina ordoñez', 'carlos mario vidal',
        'gabriela paz enríquez', 'gabriela paz enriquez', 'felipe santacruz',
        'marie curie', 'albert einstein', 'isaac newton', 'richard feynman', 'niels bohr',
        'werner heisenberg', 'galileo galilei', 'max planck', 'michael faraday', 'james clerk maxwell',
        'ali farag', 'paul coll', 'mostafa asal', 'diego elías', 'diego elias', 'mohamed elshorbagy',
        'karim abdel gawad', 'mazen hesham', 'tarek momen', 'victor crouin', 'miguel ángel rodríguez', 'miguel angel rodriguez'
    ];

    function isTriviaBenchmarkFake(r) {
        if (!r) return true;
        const id = String(r.id || '').toLowerCase();
        const name = String(r.name || '').toLowerCase().trim();
        if (id.startsWith('ref-') || id.startsWith('hist-') || id.startsWith('sq-')) return true;
        if (FAKE_TRIVIA_BENCHMARKS.includes(name)) return true;
        if (r.score >= 12000 && !r.realPlayer && (name.includes('laura') || name.includes('marie') || name.includes('einstein') || name.includes('farag') || name.includes('curie'))) return true;
        return false;
    }

    window.TRIVIA_SQUASH_ENGINE = {
        state: {
            user: null, // { name: '', institution: '' }
            currentIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            lives: 3,
            maxLives: 3,
            correctCount: 0,
            wrongCount: 0,
            answered: false,
            shuffledQuestions: [],
            currentView: 'welcome' // 'welcome' | 'game' | 'ranking'
        },

        gameOverTimeout: null,

        // Inicialización
        init: function() {
            this.loadSavedUser();
            this.updateWelcomeUI();
        },

        // Algoritmo Fisher-Yates para barajar aleatoriamente las preguntas
        // Algoritmo Fisher-Yates optimizado con descorrelación temática anti-agrupamiento
        shuffleArray: function(array) {
            const copy = [...array];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            // Pase de descorrelación: evita que aparezcan consecutivamente preguntas de la misma categoría o época
            for (let i = 1; i < copy.length - 1; i++) {
                const catCurrent = copy[i].categoria || copy[i].area || copy[i].epoca;
                const catPrev = copy[i - 1].categoria || copy[i - 1].area || copy[i - 1].epoca;
                if (catCurrent && catPrev && catCurrent === catPrev) {
                    for (let j = i + 1; j < copy.length; j++) {
                        const catNext = copy[j].categoria || copy[j].area || copy[j].epoca;
                        if (catNext && catNext !== catCurrent) {
                            const swapTemp = copy[i];
                            copy[i] = copy[j];
                            copy[j] = swapTemp;
                            break;
                        }
                    }
                }
            }
            return copy;
        },

        // Helper para renderizar los iconos de vidas
        getLivesHearts: function() {
            const l = Math.max(0, Math.min(3, this.state.lives !== undefined ? this.state.lives : 3));
            return '❤️'.repeat(l) + '🖤'.repeat(3 - l);
        },

        // Renderizar vidas en la UI
        renderLives: function() {
            const livesValEl = document.getElementById('squash-trivia-lives-val');
            const livesPill = document.getElementById('squash-trivia-lives-pill');
            if (livesValEl) {
                livesValEl.textContent = this.getLivesHearts();
            }
            if (livesPill) {
                if (this.state.lives === 1) {
                    livesPill.classList.add('danger');
                } else {
                    livesPill.classList.remove('danger');
                }
            }
        },

        // Cargar usuario y progreso guardado
        loadSavedUser: function() {
            try {
                // Perfil exclusivo de la trivia de squash
                const saved = JSON.parse(localStorage.getItem('physicsailab_squash_trivia_profile') || 'null');
                if (saved && saved.name) {
                    this.state.user = saved;
                    this.state.currentIndex = saved.lastIndex || 0;
                    this.state.score = saved.score || 0;
                    this.state.maxStreak = saved.maxStreak || 0;
                    this.state.lives = (typeof saved.lives === 'number' && saved.lives > 0) ? saved.lives : 3;
                } else {
                    // Si no hay perfil de squash, intentar cargar el perfil general de estudiante
                    const student = JSON.parse(localStorage.getItem('physicsailab_student_profile') || 'null');
                    if (student && student.nombre) {
                        this.state.user = {
                            name: student.nombre,
                            institution: student.universidad || 'Universidad del Cauca (Squash)'
                        };
                    }
                }
            } catch (e) {
                console.warn('Error al cargar perfil de trivia de squash:', e);
            }
        },

        // Actualizar UI de bienvenida
        updateWelcomeUI: function() {
            const nameInput = document.getElementById('squash-trivia-player-name');
            const instInput = document.getElementById('squash-trivia-player-inst');
            const resumeBox = document.getElementById('squash-trivia-resume-box');
            const resumeBtn = document.getElementById('squash-trivia-resume-btn');

            if (this.state.user && this.state.user.name) {
                if (nameInput) nameInput.value = this.state.user.name;
                if (instInput && this.state.user.institution) instInput.value = this.state.user.institution;
            }

            if (this.state.currentIndex > 0 && this.state.lives > 0 && resumeBox) {
                resumeBox.style.display = 'block';
                if (resumeBtn) {
                    resumeBtn.innerHTML = `▶️ Continuar Desafío de Squash (Pregunta #${this.state.currentIndex + 1} · ${this.state.score} pts · ${this.getLivesHearts()})`;
                }
            } else if (resumeBox) {
                resumeBox.style.display = 'none';
            }

            this.updateCommunityStats();
            this.fetchRankingFromCloud();
        },

        // Actualizar estadísticas de la comunidad de squash
        updateCommunityStats: function() {
            const ranking = this.getRanking();
            const totalParticipantsEl = document.getElementById('squash-trivia-stat-participants');
            const topScoreEl = document.getElementById('squash-trivia-stat-top-score');
            const topStreakEl = document.getElementById('squash-trivia-stat-top-streak');

            if (totalParticipantsEl) totalParticipantsEl.textContent = ranking.length;
            if (topScoreEl) {
                if (ranking.length > 0) {
                    const maxPts = Math.max(...ranking.map(r => r.score || 0));
                    topScoreEl.textContent = `${maxPts.toLocaleString('es-ES')} pts`;
                } else {
                    topScoreEl.textContent = '0 pts';
                }
            }
            if (topStreakEl) {
                if (ranking.length > 0) {
                    const maxStk = Math.max(...ranking.map(r => r.maxStreak || 0));
                    topStreakEl.textContent = `🔥 ${maxStk}`;
                } else {
                    topStreakEl.textContent = '🔥 0';
                }
            }
        },

        // Iniciar nuevo juego con preguntas barajadas y 3 vidas
        start: function(resetProgress) {
            if (this.gameOverTimeout) {
                clearTimeout(this.gameOverTimeout);
                this.gameOverTimeout = null;
            }

            const nameInput = document.getElementById('squash-trivia-player-name');
            const instInput = document.getElementById('squash-trivia-player-inst');

            const name = (nameInput ? nameInput.value.trim() : '') || (this.state.user ? this.state.user.name : '');
            const inst = (instInput ? instInput.value.trim() : '') || (this.state.user ? this.state.user.institution : '') || 'Club de Squash';

            if (!name) {
                alert('⚠️ Por favor escribe tu nombre completo para ingresar a la Trivia de Squash y registrar tu récord en el Ranking Oficial.');
                if (nameInput) nameInput.focus();
                return;
            }

            this.state.user = { name, institution: inst };

            // Barajar siempre las preguntas de squash para que cada sesión tenga un orden único y diferente
            const allQuestions = window.TRIVIA_SQUASH_QUESTIONS || [];
            this.state.shuffledQuestions = this.shuffleArray(allQuestions);

            this.state.currentIndex = 0;
            this.state.score = 0;
            this.state.streak = 0;
            this.state.lives = 3;
            this.state.maxLives = 3;
            this.state.correctCount = 0;
            this.state.wrongCount = 0;

            this.saveProfile();
            this.switchView('game');
            this.renderQuestion();
        },

        // Continuar partida existente
        resume: function() {
            if (this.state.lives <= 0) {
                this.start(true);
                return;
            }
            if (!this.state.shuffledQuestions || !this.state.shuffledQuestions.length) {
                this.state.shuffledQuestions = this.shuffleArray(window.TRIVIA_SQUASH_QUESTIONS || []);
            }
            this.switchView('game');
            this.renderQuestion();
        },

        // Guardar perfil local
        saveProfile: function() {
            try {
                const dataToSave = {
                    name: this.state.user.name,
                    institution: this.state.user.institution,
                    lastIndex: this.state.currentIndex,
                    score: this.state.score,
                    maxStreak: this.state.maxStreak,
                    lives: this.state.lives,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('physicsailab_squash_trivia_profile', JSON.stringify(dataToSave));
                this.updateRankingEntry();
            } catch (e) {}
        },

        // Cambiar entre Vistas (welcome, game, ranking)
        switchView: function(viewName) {
            this.state.currentView = viewName;
            const welcomeView = document.getElementById('squash-trivia-view-welcome');
            const gameView = document.getElementById('squash-trivia-view-game');
            const rankingView = document.getElementById('squash-trivia-view-ranking');

            if (welcomeView) welcomeView.style.display = (viewName === 'welcome' ? 'block' : 'none');
            if (gameView) gameView.style.display = (viewName === 'game' ? 'block' : 'none');
            if (rankingView) rankingView.style.display = (viewName === 'ranking' ? 'block' : 'none');

            if (viewName === 'welcome') {
                this.updateWelcomeUI();
            } else if (viewName === 'ranking') {
                this.renderRanking();
            }

            // Scroll suave hacia la sección
            const sec = document.getElementById('trivia-squash');
            if (sec && typeof sec.scrollIntoView === 'function') {
                sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        // Renderizar la pregunta actual
        renderQuestion: function() {
            if (!this.state.shuffledQuestions || !this.state.shuffledQuestions.length) {
                this.state.shuffledQuestions = this.shuffleArray(window.TRIVIA_SQUASH_QUESTIONS || []);
            }
            const questions = this.state.shuffledQuestions;
            if (!questions.length) {
                alert('⚠️ El banco de preguntas de squash no se ha cargado correctamente.');
                return;
            }

            if (this.state.currentIndex >= questions.length) {
                this.renderCompleted();
                return;
            }

            const q = questions[this.state.currentIndex];
            this.state.answered = false;

            // Elementos de la UI
            const qNumEl = document.getElementById('squash-trivia-question-number');
            const areaBadgeEl = document.getElementById('squash-trivia-area-badge');
            const difficultyBadgeEl = document.getElementById('squash-trivia-difficulty-badge');
            const progressBar = document.getElementById('squash-trivia-progress-bar-fill');
            const scoreEl = document.getElementById('squash-trivia-score-val');
            const streakEl = document.getElementById('squash-trivia-streak-val');
            const textEl = document.getElementById('squash-trivia-question-text');
            const optionsContainer = document.getElementById('squash-trivia-options-container');
            const feedbackCard = document.getElementById('squash-trivia-feedback-card');
            const nextBtn = document.getElementById('squash-trivia-next-btn');

            if (qNumEl) qNumEl.textContent = `Pregunta ${this.state.currentIndex + 1}`;
            if (areaBadgeEl) areaBadgeEl.textContent = q.area || 'Squash';
            if (difficultyBadgeEl) {
                difficultyBadgeEl.textContent = `Nivel ${q.nivel}: ${q.dificultad || 'Intermedio'}`;
                if (q.nivel === 1) difficultyBadgeEl.style.color = '#34d399';
                else if (q.nivel === 2) difficultyBadgeEl.style.color = '#38bdf8';
                else if (q.nivel === 3) difficultyBadgeEl.style.color = '#fbbf24';
                else difficultyBadgeEl.style.color = '#f87171';
            }

            const progressPct = Math.min(100, (((this.state.currentIndex + 1) / questions.length) * 100)).toFixed(1);
            if (progressBar) progressBar.style.width = `${progressPct}%`;

            if (scoreEl) scoreEl.textContent = `${this.state.score.toLocaleString('es-ES')} pts`;
            if (streakEl) {
                streakEl.innerHTML = `🔥 ${this.state.streak} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(Máx: ${this.state.maxStreak})</span>`;
            }

            // Renderizar vidas
            this.renderLives();

            if (textEl) textEl.textContent = q.pregunta;

            // Ocultar feedback y botón de siguiente
            if (feedbackCard) feedbackCard.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';

            // Generar botones de opciones
            if (optionsContainer) {
                optionsContainer.innerHTML = q.opciones.map((opt, idx) => `
                    <button type="button" class="trivia-option-btn squash-opt-btn" onclick="TRIVIA_SQUASH_ENGINE.handleSelectOption(${idx})" id="squash-trivia-opt-${idx}">
                        <div class="trivia-opt-letter squash-opt-letter">${['A', 'B', 'C', 'D'][idx]}</div>
                        <div class="trivia-opt-text">${opt.substring(3)}</div>
                    </button>
                `).join('');
            }
        },

        // Manejar selección de opción
        handleSelectOption: function(selectedIdx) {
            if (this.state.answered) return;
            this.state.answered = true;

            const questions = this.state.shuffledQuestions;
            const q = questions[this.state.currentIndex];
            if (!q) return;

            const isCorrect = (selectedIdx === q.correcta);
            const feedbackCard = document.getElementById('squash-trivia-feedback-card');
            const feedbackTitle = document.getElementById('squash-trivia-feedback-title');
            const feedbackText = document.getElementById('squash-trivia-feedback-text');
            const nextBtn = document.getElementById('squash-trivia-next-btn');

            // Deshabilitar botones y colorear acierto/error
            for (let i = 0; i < 4; i++) {
                const btn = document.getElementById(`squash-trivia-opt-${i}`);
                if (btn) {
                    btn.disabled = true;
                    if (i === q.correcta) {
                        btn.classList.add('correct');
                    } else if (i === selectedIdx && !isCorrect) {
                        btn.classList.add('wrong');
                    }
                }
            }

            if (isCorrect) {
                this.state.streak++;
                if (this.state.streak > this.state.maxStreak) {
                    this.state.maxStreak = this.state.streak;
                }
                this.state.correctCount++;

                // Puntos base: 100 pts + bono por racha
                const streakBonus = Math.min(100, (this.state.streak - 1) * 20);
                const pointsEarned = 100 + streakBonus;
                this.state.score += pointsEarned;

                // REGLA: Si tiene una racha de 10 preguntas acertadas seguidas, recupera 1 vida (máx 3)
                let lifeRecovered = false;
                if (this.state.streak > 0 && this.state.streak % 10 === 0) {
                    if (this.state.lives < 3) {
                        this.state.lives = Math.min(3, this.state.lives + 1);
                        lifeRecovered = true;
                        this.renderLives();
                        const pill = document.getElementById('squash-trivia-lives-pill');
                        if (pill) {
                            pill.classList.remove('trivia-lives-pulse');
                            void pill.offsetWidth;
                            pill.classList.add('trivia-lives-pulse');
                        }
                    }
                }

                if (feedbackCard) {
                    feedbackCard.className = 'trivia-feedback-card correct';
                    feedbackCard.style.display = 'block';
                }
                if (feedbackTitle) {
                    if (lifeRecovered) {
                        feedbackTitle.innerHTML = `🎉 ¡Punto Ganador (Nick)! ¡Racha de 10 Aciertos! <span style="font-size:0.85rem; color:#f43f5e; font-weight:bold;">(+1 ❤️ Vida Recuperada · ${this.state.lives}/3)</span>`;
                    } else {
                        feedbackTitle.innerHTML = `🎉 ¡Punto Ganador (Nick)! <span style="font-size:0.85rem; color:#34d399; font-weight:normal;">(+${pointsEarned} pts ${streakBonus > 0 ? `· Racha en la T 🔥` : ''})</span>`;
                    }
                }
                if (feedbackText) {
                    const recoveryNotice = lifeRecovered
                        ? `<div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); border-radius:6px; padding:0.45rem 0.75rem; margin-bottom:0.6rem; color:#fca5a5; font-weight:700;">
                            💖 ¡Racha impecable de 10 aciertos en la cancha! Has recuperado una vida perdida (${this.getLivesHearts()}).
                           </div>`
                        : '';
                    feedbackText.innerHTML = `${recoveryNotice}<strong>💡 Fundamento de Squash:</strong> ${q.explicacion}`;
                }

                if (nextBtn) {
                    nextBtn.innerHTML = `Siguiente Pregunta ➔`;
                    nextBtn.className = 'btn btn-primary btn-next-trivia';
                    nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    nextBtn.onclick = () => { window.TRIVIA_SQUASH_ENGINE.nextQuestion(); };
                    nextBtn.style.display = 'inline-flex';
                    if (typeof nextBtn.focus === 'function') nextBtn.focus();
                }
            } else {
                // RESPUESTA INCORRECTA -> Restar 1 vida y reiniciar racha
                this.state.streak = 0;
                this.state.wrongCount++;
                this.state.lives = Math.max(0, this.state.lives - 1);
                this.renderLives();

                if (this.state.lives > 0) {
                    // Todavía tiene vidas restantes
                    if (feedbackCard) {
                        feedbackCard.className = 'trivia-feedback-card wrong';
                        feedbackCard.style.display = 'block';
                    }
                    if (feedbackTitle) {
                        feedbackTitle.innerHTML = `❌ Tiro en la Chapa (Tin) o Falta <span style="font-size:0.85rem; color:#f87171; font-weight:normal;">(-1 ❤️ Vida · ${this.state.lives} / 3 restantes)</span>`;
                    }
                    if (feedbackText) {
                        feedbackText.innerHTML = `
                            <div style="margin-bottom:0.45rem; color:#fca5a5; font-weight:600;">
                                Te quedan <strong>${this.state.lives}</strong> vida${this.state.lives > 1 ? 's' : ''} (${this.getLivesHearts()}). ¡Vuelve al centro de la T!
                            </div>
                            <strong>💡 Fundamento de Squash:</strong> ${q.explicacion}
                        `;
                    }
                    if (nextBtn) {
                        nextBtn.innerHTML = `Siguiente Pregunta ➔`;
                        nextBtn.className = 'btn btn-primary btn-next-trivia';
                        nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                        nextBtn.onclick = () => { window.TRIVIA_SQUASH_ENGINE.nextQuestion(); };
                        nextBtn.style.display = 'inline-flex';
                        if (typeof nextBtn.focus === 'function') nextBtn.focus();
                    }
                } else {
                    // REGLA: GAME OVER AL AGOTAR LAS 3 VIDAS -> El sistema lo saca y lo ubica en el Ranking
                    if (feedbackCard) {
                        feedbackCard.className = 'trivia-feedback-card wrong';
                        feedbackCard.style.display = 'block';
                    }
                    if (feedbackTitle) {
                        feedbackTitle.innerHTML = `💔 ¡Te has quedado sin vidas! <span style="font-size:0.85rem; color:#f87171; font-weight:normal;">(3 errores cometidos · Fin del partido)</span>`;
                    }
                    if (feedbackText) {
                        feedbackText.innerHTML = `
                            <div style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.45); padding:0.75rem 1rem; border-radius:8px; margin-bottom:0.8rem; color:#fecaca;">
                                <strong style="display:block; font-size:0.95rem; margin-bottom:0.25rem;">🚨 Has agotado tus 3 vidas (${this.getLivesHearts()}).</strong>
                                Tu puntuación final (<strong>${this.state.score.toLocaleString('es-ES')} pts</strong>) ha sido registrada y el sistema te ubicará en la tabla oficial de Ranking.
                            </div>
                            <strong>💡 Fundamento de Squash:</strong> ${q.explicacion}
                        `;
                    }
                    if (nextBtn) {
                        nextBtn.innerHTML = `🏆 Ver mi Posición en el Ranking ➔`;
                        nextBtn.className = 'btn btn-primary btn-next-trivia';
                        nextBtn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
                        nextBtn.onclick = () => {
                            if (this.gameOverTimeout) clearTimeout(this.gameOverTimeout);
                            this.finishAndShowRanking();
                        };
                        nextBtn.style.display = 'inline-flex';
                        if (typeof nextBtn.focus === 'function') nextBtn.focus();
                    }

                    // Guardar resultado y redirigir automáticamente al ranking tras pausa pedagógica
                    this.saveProfile();
                    if (this.gameOverTimeout) clearTimeout(this.gameOverTimeout);
                    this.gameOverTimeout = setTimeout(() => {
                        if (this.state.currentView === 'game') {
                            this.finishAndShowRanking();
                        }
                    }, 3600);
                }
            }

            // Actualizar contadores
            const scoreEl = document.getElementById('squash-trivia-score-val');
            const streakEl = document.getElementById('squash-trivia-streak-val');
            if (scoreEl) scoreEl.textContent = `${this.state.score.toLocaleString('es-ES')} pts`;
            if (streakEl) {
                streakEl.innerHTML = `🔥 ${this.state.streak} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(Máx: ${this.state.maxStreak})</span>`;
            }

            this.saveProfile();
        },

        // Pasar a la siguiente pregunta
        nextQuestion: function() {
            this.state.currentIndex++;
            this.saveProfile();
            this.renderQuestion();
        },

        // Salir y ver ranking
        finishAndShowRanking: function() {
            if (this.gameOverTimeout) {
                clearTimeout(this.gameOverTimeout);
                this.gameOverTimeout = null;
            }
            this.saveProfile();
            this.switchView('ranking');
        },

        // Desafío completado
        renderCompleted: function() {
            const container = document.getElementById('squash-trivia-game-body');
            if (container) {
                container.innerHTML = `
                    <div style="text-align:center; padding:2.5rem 1rem;">
                        <span style="font-size:4rem; display:block; margin-bottom:1rem;">🏆 🎾 🥇</span>
                        <h3 style="font-size:1.8rem; color:#fff; margin-bottom:0.5rem;">¡HAS COMPLETADO EL GRAN DESAFÍO DE SQUASH!</h3>
                        <p style="color:var(--text-muted); max-width:600px; margin:0 auto 1.5rem; line-height:1.5;">
                            Maestría total de la cancha. Has dominado el reglamento WSF, la termodinámica de la pelota, la biomecánica de impacto, las leyendas mundiales y el squash olímpico LA28 con honor e individualidad.
                        </p>
                        <div style="display:inline-flex; gap:1.5rem; background:rgba(255,255,255,0.04); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:1.2rem 2rem; margin-bottom:2rem;">
                            <div>
                                <span style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Puntaje Final:</span>
                                <strong style="font-size:1.6rem; color:#34d399; display:block;">${this.state.score.toLocaleString('es-ES')} pts</strong>
                            </div>
                            <div>
                                <span style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Racha Récord:</span>
                                <strong style="font-size:1.6rem; color:#fbbf24; display:block;">🔥 ${this.state.maxStreak}</strong>
                            </div>
                            <div>
                                <span style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Vidas Finales:</span>
                                <strong style="font-size:1.4rem; color:#ef4444; display:block;">${this.getLivesHearts()}</strong>
                            </div>
                        </div>
                        <div>
                            <button type="button" class="btn btn-primary" onclick="TRIVIA_SQUASH_ENGINE.switchView('ranking')" style="background:linear-gradient(135deg, #10b981, #059669); padding:0.75rem 1.8rem; font-weight:700;">
                                🏆 Ver mi Lugar en el Ranking de Squash
                            </button>
                        </div>
                    </div>
                `;
            }
        },

        // ==========================================
        // GESTIÓN DE RANKING DE SQUASH
        // ==========================================
        
        fetchRankingFromCloud: function() {
            try {
                fetch('https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/trivia_rankings/squash.json')
                    .then(r => r.json())
                    .then(data => {
                        if (data && typeof data === 'object') {
                            const cloudList = Object.values(data).filter(r => !isTriviaBenchmarkFake(r));
                            cloudList.sort((a, b) => (b.score || 0) - (a.score || 0));
                            localStorage.setItem('physicsailab_squash_trivia_ranking', JSON.stringify(cloudList));
                            if (this.state && this.state.currentView === 'ranking') this.renderRanking();
                            if (typeof this.updateCommunityStats === 'function') this.updateCommunityStats();
                        }
                    }).catch(() => {});
            } catch(e) {}
        },
        getRanking: function() {
            try {
                const stored = JSON.parse(localStorage.getItem('physicsailab_squash_trivia_ranking') || 'null');
                if (stored && Array.isArray(stored)) {
                    const clean = stored.filter(r => !isTriviaBenchmarkFake(r));
                    if (clean.length !== stored.length) {
                        localStorage.setItem('physicsailab_squash_trivia_ranking', JSON.stringify(clean));
                    }
                    return clean;
                }
            } catch (e) {}
            return [];
        },

        // Actualizar registro en ranking
        updateRankingEntry: function() {
            if (!this.state.user || !this.state.user.name || this.state.score <= 0) return;

            const ranking = this.getRanking();
            const cleanName = this.state.user.name.trim();

            const existingIdx = ranking.findIndex(r => r.name.toLowerCase() === cleanName.toLowerCase());
            const entry = {
                id: existingIdx >= 0 ? ranking[existingIdx].id : 'sq-usr-' + Date.now(),
                name: cleanName,
                institution: this.state.user.institution || 'Comunidad Squash',
                score: this.state.score,
                highestQuestion: this.state.currentIndex + 1,
                maxStreak: this.state.maxStreak,
                date: new Date().toISOString().split('T')[0]
            };

            if (existingIdx >= 0) {
                if (entry.score > ranking[existingIdx].score) {
                    ranking[existingIdx] = entry;
                }
            } else {
                ranking.push(entry);
            }

            ranking.sort((a, b) => (b.score || 0) - (a.score || 0));

            try {
                localStorage.setItem('physicsailab_squash_trivia_ranking', JSON.stringify(ranking));

            try {
                const FIREBASE_BASE = 'https://squashpopayan-65e33-default-rtdb.firebaseio.com';
                fetch(`https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/trivia_rankings/squash/${entry.id}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry)
                }).catch(() => {});
            } catch(e) {}
            } catch (e) {}
        },

        // Renderizar tabla de ranking
        renderRanking: function() {
            const ranking = this.getRanking();
            const podiumEl = document.getElementById('squash-trivia-ranking-podium');
            const listEl = document.getElementById('squash-trivia-ranking-tbody');
            const searchInput = document.getElementById('squash-trivia-ranking-search');
            const query = (searchInput ? searchInput.value.toLowerCase().trim() : '');

            const filtered = query
                ? ranking.filter(r => r.name.toLowerCase().includes(query) || (r.institution || '').toLowerCase().includes(query))
                : ranking;

            // Actualizar botón de acción en cabecera de ranking
            const playBtn = document.getElementById('squash-trivia-ranking-play-btn');
            if (playBtn) {
                if (this.state.lives <= 0) {
                    playBtn.innerHTML = `🎮 Nueva Partida (3 Vidas ❤️)`;
                    playBtn.onclick = () => { TRIVIA_SQUASH_ENGINE.start(true); };
                } else {
                    playBtn.innerHTML = `🎾 Continuar Partida (${this.getLivesHearts()})`;
                    playBtn.onclick = () => { TRIVIA_SQUASH_ENGINE.switchView('game'); };
                }
            }

            // Podio Top 3
            if (podiumEl && !query) {
                podiumEl.style.display = 'grid';
                const p1 = ranking[0];
                const p2 = ranking[1];
                const p3 = ranking[2];

                podiumEl.innerHTML = `
                    <!-- 2do Lugar (Plata) -->
                    ${p2 ? `
                    <div class="podium-card silver">
                        <div class="podium-medal">🥈</div>
                        <h4 class="podium-name">${p2.name}</h4>
                        <div class="podium-inst">${p2.institution}</div>
                        <div class="podium-score" style="color:#38bdf8;">${p2.score.toLocaleString('es-ES')} pts</div>
                        <div class="podium-detail">Q#${p2.highestQuestion} · 🔥 ${p2.maxStreak}</div>
                    </div>` : ''}

                    <!-- 1er Lugar (Oro) -->
                    ${p1 ? `
                    <div class="podium-card gold" style="border-color:rgba(16,185,129,0.6); box-shadow:0 0 25px rgba(16,185,129,0.25);">
                        <div class="podium-medal">🥇</div>
                        <div class="podium-crown" style="color:#34d399;">👑 Campeón de la Cancha</div>
                        <h4 class="podium-name">${p1.name}</h4>
                        <div class="podium-inst">${p1.institution}</div>
                        <div class="podium-score" style="color:#34d399;">${p1.score.toLocaleString('es-ES')} pts</div>
                        <div class="podium-detail">Q#${p1.highestQuestion} · 🔥 ${p1.maxStreak} racha</div>
                    </div>` : ''}

                    <!-- 3er Lugar (Bronce) -->
                    ${p3 ? `
                    <div class="podium-card bronze">
                        <div class="podium-medal">🥉</div>
                        <h4 class="podium-name">${p3.name}</h4>
                        <div class="podium-inst">${p3.institution}</div>
                        <div class="podium-score" style="color:#fbbf24;">${p3.score.toLocaleString('es-ES')} pts</div>
                        <div class="podium-detail">Q#${p3.highestQuestion} · 🔥 ${p3.maxStreak}</div>
                    </div>` : ''}
                `;
            } else if (podiumEl) {
                podiumEl.style.display = 'none';
            }

            // Tabla completa
            if (listEl) {
                if (filtered.length === 0) {
                    listEl.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
                                No se encontraron squashistas con el criterio «${query}».
                            </td>
                        </tr>
                    `;
                } else {
                    const currentUserName = this.state.user ? this.state.user.name.toLowerCase() : '';
                    listEl.innerHTML = filtered.map((item, index) => {
                        const rankPos = ranking.indexOf(item) + 1;
                        const isMe = (item.name.toLowerCase() === currentUserName);
                        let badgeMedal = `#${rankPos}`;
                        if (rankPos === 1) badgeMedal = '🥇 1';
                        else if (rankPos === 2) badgeMedal = '🥈 2';
                        else if (rankPos === 3) badgeMedal = '🥉 3';

                        return `
                            <tr class="${isMe ? 'trivia-row-me' : ''}">
                                <td style="font-weight:800; font-family:monospace; color:${rankPos <= 3 ? '#34d399' : 'var(--text-muted)'};">
                                    ${badgeMedal}
                                </td>
                                <td>
                                    <strong style="color:${isMe ? '#34d399' : '#fff'}; font-size:0.92rem;">
                                        ${item.name} ${isMe ? '<span style="font-size:0.7rem; color:#34d399; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); padding:0.1rem 0.4rem; border-radius:4px; margin-left:0.3rem;">TÚ</span>' : ''}
                                    </strong>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${item.institution || 'Comunidad Squash'}</div>
                                </td>
                                <td style="text-align:center; font-weight:700; color:#34d399;">
                                    ${item.score.toLocaleString('es-ES')} pts
                                </td>
                                <td style="text-align:center; font-family:monospace; font-size:0.85rem;">
                                    Q#${item.highestQuestion || 1}
                                </td>
                                <td style="text-align:center; font-size:0.85rem; color:#fbbf24; font-weight:700;">
                                    🔥 ${item.maxStreak || 0}
                                </td>
                                <td style="text-align:right; font-size:0.75rem; color:var(--text-muted);">
                                    ${item.date || 'Reciente'}
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        },

        // Compartir en WhatsApp
        shareWhatsApp: function() {
            const name = this.state.user ? this.state.user.name : 'Squashista';
            const score = this.state.score;
            const qNum = this.state.currentIndex + 1;
            const streak = this.state.maxStreak;

            const text = encodeURIComponent(
                `🎾 ¡Acabo de registrar ${score.toLocaleString('es-ES')} puntos en la Gran Trivia de Squash de PhysicsAILab!\n` +
                `🎯 Nivel alcanzado: Pregunta #${qNum}\n` +
                `🔥 Mejor racha consecutiva: ${streak} aciertos seguidos en la T\n` +
                `❤️ Vidas finales: ${this.getLivesHearts()}\n` +
                `¿Qué tanto sabes sobre squash? Pon a prueba tus conocimientos sobre reglamento, física de la bola y leyendas mundiales: https://www.physicsailab.com/#trivia-squash`
            );

            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    // Inicializar al cargar el DOM
    document.addEventListener('DOMContentLoaded', () => {
        window.TRIVIA_SQUASH_ENGINE.init();
    });

})();
