// ==========================================================================
// MOTOR GAMIFICADO DE LA GRAN TRIVIA DE SQUASH (500 PREGUNTAS)
// PhysicsAILab · Prof. Manuel Alejandro Obando
// "¿Qué tanto sabes sobre el squash?"
// Diseñado para evaluación progresiva honesta sin apuntes ni IA.
// ==========================================================================

(function() {
    'use strict';

    // Estado global de la trivia de squash
    window.TRIVIA_SQUASH_ENGINE = {
        state: {
            user: null, // { name: '', institution: '' }
            currentIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctCount: 0,
            wrongCount: 0,
            answered: false,
            currentView: 'welcome' // 'welcome' | 'game' | 'ranking'
        },

        // Inicialización
        init: function() {
            this.loadSavedUser();
            this.updateWelcomeUI();
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

            if (this.state.currentIndex > 0 && resumeBox) {
                resumeBox.style.display = 'block';
                if (resumeBtn) {
                    resumeBtn.innerHTML = `▶️ Continuar Desafío de Squash (Pregunta #${this.state.currentIndex + 1} · ${this.state.score} pts)`;
                }
            } else if (resumeBox) {
                resumeBox.style.display = 'none';
            }

            this.updateCommunityStats();
        },

        // Actualizar estadísticas de la comunidad de squash
        updateCommunityStats: function() {
            const ranking = this.getRanking();
            const totalParticipantsEl = document.getElementById('squash-trivia-stat-participants');
            const topScoreEl = document.getElementById('squash-trivia-stat-top-score');
            const topStreakEl = document.getElementById('squash-trivia-stat-top-streak');

            if (totalParticipantsEl) totalParticipantsEl.textContent = ranking.length;
            if (topScoreEl && ranking.length > 0) {
                const maxPts = Math.max(...ranking.map(r => r.score || 0));
                topScoreEl.textContent = `${maxPts.toLocaleString('es-ES')} pts`;
            }
            if (topStreakEl && ranking.length > 0) {
                const maxStk = Math.max(...ranking.map(r => r.maxStreak || 0));
                topStreakEl.textContent = `🔥 ${maxStk}`;
            }
        },

        // Iniciar nuevo juego o continuar
        start: function(resetProgress) {
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

            if (resetProgress) {
                this.state.currentIndex = 0;
                this.state.score = 0;
                this.state.streak = 0;
                this.state.correctCount = 0;
                this.state.wrongCount = 0;
            }

            this.saveProfile();
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
            if (sec) {
                sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        // Renderizar la pregunta actual
        renderQuestion: function() {
            const questions = window.TRIVIA_SQUASH_QUESTIONS || [];
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

            if (qNumEl) qNumEl.textContent = `Pregunta ${q.id} de ${questions.length}`;
            if (areaBadgeEl) areaBadgeEl.textContent = q.area || 'Squash';
            if (difficultyBadgeEl) {
                difficultyBadgeEl.textContent = `Nivel ${q.nivel}: ${q.dificultad || 'Intermedio'}`;
                if (q.nivel === 1) difficultyBadgeEl.style.color = '#34d399';
                else if (q.nivel === 2) difficultyBadgeEl.style.color = '#38bdf8';
                else if (q.nivel === 3) difficultyBadgeEl.style.color = '#fbbf24';
                else difficultyBadgeEl.style.color = '#f87171';
            }

            const progressPct = ((q.id / questions.length) * 100).toFixed(1);
            if (progressBar) progressBar.style.width = `${progressPct}%`;

            if (scoreEl) scoreEl.textContent = `${this.state.score.toLocaleString('es-ES')} pts`;
            if (streakEl) {
                streakEl.innerHTML = `🔥 ${this.state.streak} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(Máx: ${this.state.maxStreak})</span>`;
            }

            if (textEl) textEl.textContent = q.pregunta;

            // Ocultar feedback y botón de siguiente
            if (feedbackCard) feedbackCard.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';

            // Generar botones de opciones
            if (optionsContainer) {
                optionsContainer.innerHTML = q.opciones.map((opt, idx) => `
                    <button type="button" class="trivia-option-btn" onclick="TRIVIA_SQUASH_ENGINE.handleSelectOption(${idx})" id="squash-trivia-opt-${idx}">
                        <div class="trivia-opt-letter" style="color:#10b981; border-color:rgba(16,185,129,0.3);">${['A', 'B', 'C', 'D'][idx]}</div>
                        <div class="trivia-opt-text">${opt.substring(3)}</div>
                    </button>
                `).join('');
            }
        },

        // Manejar selección de opción
        handleSelectOption: function(selectedIdx) {
            if (this.state.answered) return;
            this.state.answered = true;

            const questions = window.TRIVIA_SQUASH_QUESTIONS || [];
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

                if (feedbackCard) {
                    feedbackCard.className = 'trivia-feedback-card correct';
                    feedbackCard.style.display = 'block';
                }
                if (feedbackTitle) {
                    feedbackTitle.innerHTML = `🎉 ¡Punto Ganador (Nick)! <span style="font-size:0.85rem; color:#34d399; font-weight:normal;">(+${pointsEarned} pts ${streakBonus > 0 ? `· Racha en la T 🔥` : ''})</span>`;
                }
            } else {
                this.state.streak = 0;
                this.state.wrongCount++;

                if (feedbackCard) {
                    feedbackCard.className = 'trivia-feedback-card wrong';
                    feedbackCard.style.display = 'block';
                }
                if (feedbackTitle) {
                    feedbackTitle.innerHTML = `❌ Tiro en la Chapa (Tin) o Falta <span style="font-size:0.85rem; color:#f87171; font-weight:normal;">(Racha reiniciada)</span>`;
                }
            }

            if (feedbackText) {
                feedbackText.innerHTML = `<strong>💡 Fundamento de Squash:</strong> ${q.explicacion}`;
            }

            // Actualizar contadores
            const scoreEl = document.getElementById('squash-trivia-score-val');
            const streakEl = document.getElementById('squash-trivia-streak-val');
            if (scoreEl) scoreEl.textContent = `${this.state.score.toLocaleString('es-ES')} pts`;
            if (streakEl) {
                streakEl.innerHTML = `🔥 ${this.state.streak} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(Máx: ${this.state.maxStreak})</span>`;
            }

            // Mostrar botón siguiente
            if (nextBtn) {
                nextBtn.style.display = 'inline-flex';
                nextBtn.focus();
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
            this.saveProfile();
            this.switchView('ranking');
        },

        // Desafío completado (500 preguntas)
        renderCompleted: function() {
            const container = document.getElementById('squash-trivia-game-body');
            if (container) {
                container.innerHTML = `
                    <div style="text-align:center; padding:2.5rem 1rem;">
                        <span style="font-size:4rem; display:block; margin-bottom:1rem;">🏆 🎾 🥇</span>
                        <h3 style="font-size:1.8rem; color:#fff; margin-bottom:0.5rem;">¡HAZ COMPLETADO LAS 500 PREGUNTAS DE SQUASH!</h3>
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
        getRanking: function() {
            // Ranking benchmark de deportistas y clubes colombianos y sudamericanos
            const defaultRanking = [
                { id: 'sq-1', name: 'Miguel Ángel Rodríguez (Tributo)', institution: 'Bogotá D.C. (British Open Champion)', score: 14500, highestQuestion: 140, maxStreak: 35, date: '2026-10-23' },
                { id: 'sq-2', name: 'Diego Elías (Tributo)', institution: 'Lima, Perú (PSA World Champion)', score: 13900, highestQuestion: 132, maxStreak: 31, date: '2026-10-22' },
                { id: 'sq-3', name: 'Prof. Manuel Alejandro Obando', institution: 'Club Campestre Popayán / Unicauca', score: 12800, highestQuestion: 120, maxStreak: 28, date: '2026-10-21' },
                { id: 'sq-4', name: 'Laura Tovar (Tributo)', institution: 'Selección Colombia Femenina', score: 11200, highestQuestion: 105, maxStreak: 25, date: '2026-10-20' },
                { id: 'sq-5', name: 'Catalina Peláez (Tributo)', institution: 'Liga de Squash de Bogotá', score: 9800, highestQuestion: 92, maxStreak: 21, date: '2026-10-19' },
                { id: 'sq-6', name: 'Camilo Andrés Cifuentes', institution: 'Universidad del Cauca (Ing. Física)', score: 8600, highestQuestion: 81, maxStreak: 18, date: '2026-10-18' },
                { id: 'sq-7', name: 'Sebastián Echeverri', institution: 'Liga Vallecaucana de Squash', score: 7400, highestQuestion: 70, maxStreak: 15, date: '2026-10-17' },
                { id: 'sq-8', name: 'Valeria Mosquera Paz', institution: 'Club Campestre de Popayán', score: 6300, highestQuestion: 60, maxStreak: 13, date: '2026-10-16' },
                { id: 'sq-9', name: 'Felipe Santamaría', institution: 'Club El Nogal Bogotá', score: 5100, highestQuestion: 49, maxStreak: 11, date: '2026-10-15' },
                { id: 'sq-10', name: 'Santiago Rengifo', institution: 'Universidad del Valle', score: 4200, highestQuestion: 40, maxStreak: 9, date: '2026-10-14' }
            ];

            try {
                const stored = JSON.parse(localStorage.getItem('physicsailab_squash_trivia_ranking') || 'null');
                if (stored && Array.isArray(stored) && stored.length > 0) {
                    return stored;
                }
            } catch (e) {}

            return defaultRanking;
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
                                    Q#${item.highestQuestion || 1} / 500
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
                `🎯 Nivel alcanzado: Pregunta #${qNum} de 500\n` +
                `🔥 Mejor racha consecutiva: ${streak} aciertos seguidos en la T\n` +
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
