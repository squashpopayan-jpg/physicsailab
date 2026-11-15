// =========================================================================
// PhysicsAILab - Zona Arcade de Física Interactiva
// Juegos educativos con motores físicos reales en Canvas:
// 1. Tiro Parabólico Pro (Cinemática, Balística & Gravedad Planetaria)
// 2. Gravedad Orbital & Slingshot Cósmico (Leyes de Kepler & Gravitación de Newton)
// 3. Electric Rush (Ley de Ohm, Circuitos & Redes de Resistencias)
// =========================================================================

(function() {
    let currentGame = 'cannon';
    let audioCtx = null;

    function getAudioCtx() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'fire') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'hit') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.setValueAtTime(660, now + 0.08);
                osc.frequency.setValueAtTime(880, now + 0.16);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'boom') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === 'spark') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.linearRampToValueAtTime(150, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'tunnel') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(740, now + 0.25);
                gain.gain.setValueAtTime(0.24, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'eat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'powerup') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(330, now);
                osc.frequency.setValueAtTime(440, now + 0.08);
                osc.frequency.setValueAtTime(554, now + 0.16);
                osc.frequency.setValueAtTime(659, now + 0.24);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'gameover') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(75, now + 0.45);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            }
        } catch (e) {}
    }

    // Helper: Retina canvas setup
    function setupRetinaCanvas(canvas, w, h) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        return { ctx, dpr, w, h };
    }

    // =========================================================================
    // JUEGO 1: TIRO PARABÓLICO PRO (CANON FÍSICO)
    // =========================================================================
    const CannonGame = {
        canvas: null,
        ctx: null,
        animId: null,
        angle: 45,
        v0: 38,
        cannonX: 40,
        showTrajectory: true,
        gravityKey: 'earth',
        gravities: {
            earth: { name: '🌍 Tierra', g: 9.8, color: '#38bdf8' },
            moon: { name: '🌕 Luna', g: 1.62, color: '#cbd5e1' },
            mars: { name: '🪐 Marte', g: 3.71, color: '#f97316' },
            jupiter: { name: '⚡ Júpiter', g: 24.79, color: '#eab308' }
        },
        wind: 0,
        score: 0,
        streak: 0,
        shots: 0,
        hits: 0,
        target: { x: 260, y: 70, r: 24, vy: 0.6, minY: 50, maxY: 140 },
        projectile: null,
        trajectoryTrail: [],
        particles: [],
        isAiming: false,

        toggleTrajectory() {
            this.showTrajectory = !this.showTrajectory;
            playSound('click');
            const btn = document.getElementById('btn-toggle-traj');
            if (btn) {
                if (this.showTrajectory) {
                    btn.classList.add('active');
                    btn.classList.remove('hidden-traj');
                    btn.innerHTML = '👁️ Trayectoria: <strong>Visible</strong>';
                } else {
                    btn.classList.remove('active');
                    btn.classList.add('hidden-traj');
                    btn.innerHTML = '🙈 Trayectoria: <strong>Oculta</strong>';
                }
            }
        },

        setCannonX(val) {
            const maxCannonX = Math.min(Math.floor(this.w * 0.42), 220);
            this.cannonX = Math.max(15, Math.min(maxCannonX, Math.round(val)));
            const rng = document.getElementById('rng-cannon-x');
            const lbl = document.getElementById('lbl-cannon-x');
            if (rng) rng.value = this.cannonX;
            if (lbl) lbl.textContent = this.cannonX + ' m';
            this.updateTelemetry();
        },

        nudgeCannonX(delta) {
            this.setCannonX(this.cannonX + delta);
        },

        setTargetX(val) {
            const minTargetX = Math.max(this.cannonX + 45, Math.floor(this.w * 0.35));
            const maxTargetX = Math.floor(this.w - 30);
            this.target.x = Math.max(minTargetX, Math.min(maxTargetX, Math.round(val)));
            const rng = document.getElementById('rng-target-x');
            const lbl = document.getElementById('lbl-target-x');
            if (rng) rng.value = Math.round(this.target.x);
            if (lbl) lbl.textContent = Math.round(this.target.x) + ' m';
            this.updateTelemetry();
        },

        nudgeTargetX(delta) {
            this.setTargetX(this.target.x + delta);
        },

        nudgeAngle(delta) {
            const rngA = document.getElementById('rng-angle');
            const newAng = Math.max(5, Math.min(85, this.angle + delta));
            this.angle = newAng;
            if (rngA) rngA.value = newAng;
            const lbl = document.getElementById('lbl-angle');
            const tLbl = document.getElementById('t-angle');
            if (lbl) lbl.textContent = newAng + '°';
            if (tLbl) tLbl.textContent = newAng + '°';
            this.updateTelemetry();
        },

        nudgeV0(delta) {
            const rngV = document.getElementById('rng-v0');
            const newV = Math.max(15, Math.min(60, this.v0 + delta));
            this.v0 = newV;
            if (rngV) rngV.value = newV;
            const lbl = document.getElementById('lbl-v0');
            const tLbl = document.getElementById('t-v0');
            if (lbl) lbl.textContent = newV + ' m/s';
            if (tLbl) tLbl.textContent = newV + ' m/s';
            this.updateTelemetry();
        },

        init(container) {
            container.innerHTML = `
                <div class="game-layout">
                    <!-- HUD Superior: Estadísticas en vivo -->
                    <div class="game-hud-bar">
                        <div class="hud-pill">🏆 Puntaje: <strong id="c-score">0</strong></div>
                        <div class="hud-pill">🔥 Racha: <strong id="c-streak">x0</strong></div>
                        <div class="hud-pill">🎯 Precisión: <strong id="c-acc">0%</strong></div>
                        <div class="hud-pill">💨 Viento: <strong id="c-wind">0 m/s</strong></div>
                        <div class="hud-pill">🪐 Entorno: <strong id="c-env" style="color:#38bdf8;">🌍 Tierra (9.8 m/s²)</strong></div>
                    </div>

                    <!-- Fila Cockpit: Canvas a la izquierda, Controles a la derecha en PC -->
                    <div class="game-main-row">
                        <!-- Columna de Simulación / Canvas 100% Despejado -->
                        <div class="game-stage-col">
                            <div class="game-canvas-wrap">
                                <canvas id="cannon-canvas"></canvas>
                            </div>

                            <!-- Barra de Telemetría Dinámica -->
                            <div class="game-telemetry-bar" id="cannon-telemetry">
                                <span>📐 θ = <strong id="t-angle">45°</strong></span>
                                <span>🚀 v₀ = <strong id="t-v0">38 m/s</strong></span>
                                <span>📏 ΔX = <strong id="t-dist">220 m</strong></span>
                                <span>⏱️ T_vuelo = <strong id="t-time">---</strong></span>
                                <span>⛰️ H_max = <strong id="t-hmax">---</strong></span>
                                <span>🎯 R_teórico = <strong id="t-range">---</strong></span>
                            </div>

                            <!-- Botones de Acción Rápida -->
                            <div class="game-quick-fire-bar">
                                <button type="button" class="btn-game-primary btn-fire-large" id="btn-fire" onclick="window.CannonGame.fire()">
                                    🚀 ¡DISPARAR CAÑÓN!
                                </button>
                                <button type="button" class="btn-game-toggle ${this.showTrajectory ? 'active' : 'hidden-traj'}" id="btn-toggle-traj" onclick="window.CannonGame.toggleTrajectory()" title="Ocultar o mostrar la guía y estela del tiro">
                                    ${this.showTrajectory ? '👁️ Trayectoria: <strong>Visible</strong>' : '🙈 Trayectoria: <strong>Oculta</strong>'}
                                </button>
                                <button type="button" class="btn-game-secondary" onclick="window.CannonGame.resetTarget()" title="Generar un nuevo objetivo a diferente distancia">
                                    🎯 Blanco Aleatorio
                                </button>
                            </div>
                        </div>

                        <!-- Columna de Controles e Instrumentación -->
                        <div class="game-controls-col">
                            <div class="game-controls-panel">
                                <!-- Ángulo -->
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>📐 Ángulo de Tiro (θ): <strong id="lbl-angle">45°</strong></label>
                                        <span class="ctrl-badge">Elevación</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeAngle(-1)" title="Restar 1 grado">−1°</button>
                                        <input type="range" id="rng-angle" min="5" max="85" value="45" class="game-slider" aria-label="Ángulo de tiro">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeAngle(+1)" title="Sumar 1 grado">+1°</button>
                                    </div>
                                </div>

                                <!-- Rapidez inicial -->
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>🚀 Rapidez Inicial (v₀): <strong id="lbl-v0">38 m/s</strong></label>
                                        <span class="ctrl-badge">Velocidad</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeV0(-1)" title="Restar 1 m/s">−1</button>
                                        <input type="range" id="rng-v0" min="15" max="60" value="38" class="game-slider" aria-label="Rapidez inicial">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeV0(+1)" title="Sumar 1 m/s">+1</button>
                                    </div>
                                </div>

                                <!-- Cañón Móvil X0 -->
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>🚀 Posición Cañón (X₀): <strong id="lbl-cannon-x">40 m</strong></label>
                                        <span class="ctrl-badge" style="background:rgba(168,85,247,0.15); color:#c084fc;">Lanzamiento</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeCannonX(-5)" title="Retroceder cañón 5m">−5m</button>
                                        <input type="range" id="rng-cannon-x" min="15" max="180" value="40" class="game-slider" aria-label="Posición inicial X del cañón">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeCannonX(+5)" title="Avanzar cañón 5m">+5m</button>
                                    </div>
                                </div>

                                <!-- Blanco Móvil X -->
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>🎯 Posición Blanco (X): <strong id="lbl-target-x">260 m</strong></label>
                                        <span class="ctrl-badge" style="background:rgba(239,68,68,0.15); color:#f87171;">Objetivo</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeTargetX(-10)" title="Mover blanco 10m a la izquierda">−10m</button>
                                        <input type="range" id="rng-target-x" min="70" max="420" value="260" class="game-slider" aria-label="Posición X del blanco">
                                        <button type="button" class="btn-nudge" onclick="window.CannonGame.nudgeTargetX(+10)" title="Mover blanco 10m a la derecha">+10m</button>
                                    </div>
                                </div>

                                <!-- Entorno Gravitacional -->
                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">🪐 Gravedad Planetaria:</span>
                                    <div class="btn-group-row">
                                        <button type="button" class="btn-planet active" onclick="window.CannonGame.setGravity('earth')">🌍 Tierra (9.8)</button>
                                        <button type="button" class="btn-planet" onclick="window.CannonGame.setGravity('moon')">🌕 Luna (1.62)</button>
                                        <button type="button" class="btn-planet" onclick="window.CannonGame.setGravity('mars')">🪐 Marte (3.71)</button>
                                        <button type="button" class="btn-planet" onclick="window.CannonGame.setGravity('jupiter')">⚡ Júpiter (24.8)</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="game-physics-note">
                        <span class="note-icon">💡</span>
                        <div class="note-content">
                            <strong>Ecuaciones de Cinemática en 2D & Tiro de Precisión:</strong>
                            <p>
                                Posición horizontal: <code>x(t) = X₀ + v₀·cos(θ)·t + ½·a_viento·t²</code> &nbsp;|&nbsp;
                                Posición vertical: <code>y(t) = v₀·sin(θ)·t - ½·g·t²</code> &nbsp;|&nbsp;
                                Distancia al objetivo: <code>ΔX = X_blanco - X₀</code>
                            </p>
                        </div>
                    </div>
                </div>
            `;

            this.canvas = document.getElementById('cannon-canvas');
            this.resize();
            this.bindEvents();
            this.resetTarget();
            this.updateTelemetry();
            this.loop();
        },

        resize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const w = Math.max(340, Math.floor(rect.width));
            const h = Math.min(420, Math.max(280, Math.floor(w * 0.52)));
            const s = setupRetinaCanvas(this.canvas, w, h);
            this.ctx = s.ctx;
            this.w = w;
            this.h = h;

            // Update bounds for sliders
            const rngT = document.getElementById('rng-target-x');
            if (rngT) {
                rngT.max = Math.floor(w - 30);
            }
            const rngC = document.getElementById('rng-cannon-x');
            if (rngC) {
                rngC.max = Math.min(Math.floor(w * 0.42), 220);
            }
        },

        bindEvents() {
            const rngA = document.getElementById('rng-angle');
            const rngV = document.getElementById('rng-v0');
            const rngC = document.getElementById('rng-cannon-x');
            const rngT = document.getElementById('rng-target-x');

            if (rngA) {
                rngA.addEventListener('input', (e) => {
                    this.angle = parseInt(e.target.value, 10);
                    const lblA = document.getElementById('lbl-angle');
                    const tA = document.getElementById('t-angle');
                    if (lblA) lblA.textContent = this.angle + '°';
                    if (tA) tA.textContent = this.angle + '°';
                    this.updateTelemetry();
                });
            }

            if (rngV) {
                rngV.addEventListener('input', (e) => {
                    this.v0 = parseInt(e.target.value, 10);
                    const lblV = document.getElementById('lbl-v0');
                    const tV = document.getElementById('t-v0');
                    if (lblV) lblV.textContent = this.v0 + ' m/s';
                    if (tV) tV.textContent = this.v0 + ' m/s';
                    this.updateTelemetry();
                });
            }

            if (rngC) {
                rngC.addEventListener('input', (e) => {
                    this.setCannonX(parseInt(e.target.value, 10));
                });
            }

            if (rngT) {
                rngT.addEventListener('input', (e) => {
                    this.setTargetX(parseInt(e.target.value, 10));
                });
            }

            let dragMode = null; // null | 'aim' | 'cannon' | 'target'

            const getCanvasPos = (clientX, clientY) => {
                const r = this.canvas.getBoundingClientRect();
                return {
                    x: clientX - r.left,
                    y: clientY - r.top
                };
            };

            const aimAt = (x, y) => {
                const originX = this.cannonX;
                const originY = this.h - 35;
                const dx = x - originX;
                const dy = originY - y;
                if (dx > 5 && dy > 5) {
                    const ang = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
                    const clampedAng = Math.max(5, Math.min(85, ang));
                    this.angle = clampedAng;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const v = Math.max(15, Math.min(60, Math.round(len * 0.22)));
                    this.v0 = v;

                    if (rngA) rngA.value = clampedAng;
                    if (rngV) rngV.value = v;
                    const lblA = document.getElementById('lbl-angle');
                    const tA = document.getElementById('t-angle');
                    const lblV = document.getElementById('lbl-v0');
                    const tV = document.getElementById('t-v0');
                    if (lblA) lblA.textContent = clampedAng + '°';
                    if (tA) tA.textContent = clampedAng + '°';
                    if (lblV) lblV.textContent = v + ' m/s';
                    if (tV) tV.textContent = v + ' m/s';
                    this.updateTelemetry();
                }
            };

            const onPointerDown = (clientX, clientY) => {
                const pos = getCanvasPos(clientX, clientY);
                const groundY = this.h - 32;
                const dTarget = Math.hypot(pos.x - this.target.x, pos.y - this.target.y);
                const dCannon = Math.hypot(pos.x - this.cannonX, pos.y - groundY);

                if (dTarget <= this.target.r + 14) {
                    dragMode = 'target';
                } else if (dCannon <= 32) {
                    dragMode = 'cannon';
                } else {
                    dragMode = 'aim';
                    this.isAiming = true;
                    aimAt(pos.x, pos.y);
                }
            };

            const onPointerMove = (clientX, clientY) => {
                const pos = getCanvasPos(clientX, clientY);

                if (dragMode === 'target') {
                    this.setTargetX(pos.x);
                } else if (dragMode === 'cannon') {
                    this.setCannonX(pos.x);
                } else if (dragMode === 'aim' && this.isAiming) {
                    aimAt(pos.x, pos.y);
                } else if (!dragMode) {
                    // Update hover cursor
                    const groundY = this.h - 32;
                    const dTarget = Math.hypot(pos.x - this.target.x, pos.y - this.target.y);
                    const dCannon = Math.hypot(pos.x - this.cannonX, pos.y - groundY);
                    if (dTarget <= this.target.r + 14) {
                        this.canvas.style.cursor = 'grab';
                    } else if (dCannon <= 32) {
                        this.canvas.style.cursor = 'ew-resize';
                    } else {
                        this.canvas.style.cursor = 'crosshair';
                    }
                }
            };

            const onPointerUp = () => {
                dragMode = null;
                this.isAiming = false;
            };

            this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', onPointerUp);

            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches[0]) {
                    onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });

            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) {
                    onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });

            this.canvas.addEventListener('touchend', onPointerUp);
        },

        setGravity(k) {
            this.gravityKey = k;
            playSound('click');
            const gInfo = this.gravities[k];
            const envEl = document.getElementById('c-env');
            if (envEl) {
                envEl.textContent = `${gInfo.name} (${gInfo.g} m/s²)`;
                envEl.style.color = gInfo.color;
            }
            document.querySelectorAll('.btn-planet').forEach(b => b.classList.remove('active'));
            const targetBtn = Array.from(document.querySelectorAll('.btn-planet')).find(b => b.getAttribute('onclick').includes(k));
            if (targetBtn) targetBtn.classList.add('active');
            this.updateTelemetry();
        },

        resetTarget() {
            const minX = Math.max(this.cannonX + 55, Math.floor(this.w * 0.45));
            const maxX = Math.floor(this.w * 0.90);
            this.target.x = minX + Math.random() * (maxX - minX);
            this.target.minY = Math.floor(this.h * 0.25);
            this.target.maxY = Math.floor(this.h * 0.75);
            this.target.y = this.target.minY + Math.random() * (this.target.maxY - this.target.minY);
            this.target.r = Math.max(16, Math.min(26, Math.floor(this.w * 0.035)));
            this.target.vy = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.6);

            const rngT = document.getElementById('rng-target-x');
            const lblT = document.getElementById('lbl-target-x');
            if (rngT) rngT.value = Math.round(this.target.x);
            if (lblT) lblT.textContent = Math.round(this.target.x) + ' m';

            // Random wind: between -10 and +10 m/s
            this.wind = Math.round((Math.random() - 0.5) * 16);
            const windEl = document.getElementById('c-wind');
            if (windEl) {
                windEl.textContent = (this.wind > 0 ? `+${this.wind}` : `${this.wind}`) + ' m/s';
                windEl.style.color = this.wind > 0 ? '#34d399' : (this.wind < 0 ? '#f87171' : '#94a3b8');
            }
            this.updateTelemetry();
        },

        updateTelemetry() {
            const rad = (this.angle * Math.PI) / 180;
            const g = this.gravities[this.gravityKey].g;
            const vy = this.v0 * Math.sin(rad);
            const tFlight = (2 * vy) / g;
            const hMax = (vy * vy) / (2 * g);
            const rIdeal = (this.v0 * this.v0 * Math.sin(2 * rad)) / g;
            const deltaX = Math.round(this.target.x - this.cannonX);

            const tTime = document.getElementById('t-time');
            const tHmax = document.getElementById('t-hmax');
            const tRange = document.getElementById('t-range');
            const tDist = document.getElementById('t-dist');

            if (tTime) tTime.textContent = tFlight.toFixed(2) + ' s';
            if (tHmax) tHmax.textContent = hMax.toFixed(1) + ' m';
            if (tRange) tRange.textContent = rIdeal.toFixed(1) + ' m';
            if (tDist) tDist.textContent = deltaX + ' m';
        },

        fire() {
            if (this.projectile) return; // Ya hay uno en vuelo
            playSound('fire');
            this.shots++;

            const rad = (this.angle * Math.PI) / 180;
            const scale = this.w / 280; // Escala mundo -> pantalla
            const vx = this.v0 * Math.cos(rad) * scale * 0.28;
            const vy = -this.v0 * Math.sin(rad) * scale * 0.28;
            const groundY = this.h - 32;

            this.projectile = {
                x: this.cannonX + Math.cos(rad) * 32,
                y: groundY - Math.sin(rad) * 32,
                vx: vx,
                vy: vy,
                t: 0
            };

            this.trajectoryTrail = [];

            // Spawn smoke puff at nozzle
            for (let i = 0; i < 14; i++) {
                this.particles.push({
                    x: this.projectile.x,
                    y: this.projectile.y,
                    vx: (Math.random() - 0.5) * 2 + vx * 0.15,
                    vy: (Math.random() - 0.5) * 2 + vy * 0.15,
                    life: 25,
                    maxLife: 25,
                    color: 'rgba(203, 213, 225, 0.7)',
                    size: 4 + Math.random() * 5
                });
            }
        },

        createExplosion(x, y, success) {
            playSound(success ? 'hit' : 'boom');
            const count = success ? 45 : 20;
            const colors = success 
                ? ['#38bdf8', '#34d399', '#facc15', '#f43f5e', '#a855f7'] 
                : ['#f97316', '#ef4444', '#78716c', '#e2e8f0'];

            for (let i = 0; i < count; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * (success ? 6.5 : 3.5);
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    life: 30 + Math.floor(Math.random() * 20),
                    maxLife: 45,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: 3 + Math.random() * 4
                });
            }
        },

        update() {
            // Target oscillation
            this.target.y += this.target.vy;
            if (this.target.y <= this.target.minY || this.target.y >= this.target.maxY) {
                this.target.vy *= -1;
            }

            // Projectile physics
            if (this.projectile) {
                const g = this.gravities[this.gravityKey].g;
                const scale = this.w / 280;
                const gPix = (g * 0.009) * scale;
                const windPix = (this.wind * 0.003) * scale;

                this.projectile.vx += windPix;
                this.projectile.vy += gPix;
                this.projectile.x += this.projectile.vx;
                this.projectile.y += this.projectile.vy;
                this.projectile.t += 0.016;

                this.trajectoryTrail.push({ x: this.projectile.x, y: this.projectile.y });
                if (this.trajectoryTrail.length > 70) this.trajectoryTrail.shift();

                // Hit test target
                const dx = this.projectile.x - this.target.x;
                const dy = this.projectile.y - this.target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= this.target.r + 6) {
                    // Impacto directo!
                    this.hits++;
                    this.streak++;
                    const pts = 100 * this.streak + Math.round(dist * 2);
                    this.score += pts;
                    this.createExplosion(this.projectile.x, this.projectile.y, true);
                    this.projectile = null;
                    this.resetTarget();
                    this.updateScoreHud();
                } else if (this.projectile.y >= this.h - 32) {
                    // Choque contra el suelo
                    this.streak = 0;
                    this.createExplosion(this.projectile.x, this.h - 32, false);
                    this.projectile = null;
                    this.updateScoreHud();
                } else if (this.projectile.x > this.w + 40 || this.projectile.x < -40) {
                    // Salió del mapa
                    this.streak = 0;
                    this.projectile = null;
                    this.updateScoreHud();
                }
            }

            // Particles update
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        },

        updateScoreHud() {
            const scEl = document.getElementById('c-score');
            const stEl = document.getElementById('c-streak');
            const accEl = document.getElementById('c-acc');
            if (scEl) scEl.textContent = this.score.toLocaleString('es-ES');
            if (stEl) stEl.textContent = `x${this.streak}`;
            if (accEl) {
                const acc = this.shots > 0 ? Math.round((this.hits / this.shots) * 100) : 0;
                accEl.textContent = `${acc}% (${this.hits}/${this.shots})`;
            }
        },

        draw() {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;
            if (!ctx) return;

            // Sky background with subtle gradient
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#0a101d');
            grad.addColorStop(0.7, '#131e33');
            grad.addColorStop(1, '#1e293b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Ground & Grass
            const groundY = h - 32;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, groundY, w, 32);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(0, groundY, w, 3);

            // Grid markers (Distance scale)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.font = '10px monospace';
            for (let x = 60; x < w; x += 60) {
                ctx.fillRect(x, groundY, 1, 6);
                ctx.fillText(`${x}m`, x - 10, groundY + 18);
            }

            // Trajectory trail & Theoretical Aiming Arc (if enabled)
            if (this.showTrajectory) {
                // Trajectory trail of fired shot
                if (this.trajectoryTrail.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([4, 4]);
                    ctx.moveTo(this.trajectoryTrail[0].x, this.trajectoryTrail[0].y);
                    for (let i = 1; i < this.trajectoryTrail.length; i++) {
                        ctx.lineTo(this.trajectoryTrail[i].x, this.trajectoryTrail[i].y);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Theoretical Aiming Arc (Dotted line preview)
                const rad = (this.angle * Math.PI) / 180;
                const scale = w / 280;
                const g = this.gravities[this.gravityKey].g;
                const gPix = (g * 0.009) * scale;
                const windPix = (this.wind * 0.003) * scale;
                let simVx = this.v0 * Math.cos(rad) * scale * 0.28;
                let simVy = -this.v0 * Math.sin(rad) * scale * 0.28;
                let simX = this.cannonX + Math.cos(rad) * 32;
                let simY = groundY - Math.sin(rad) * 32;

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([2, 5]);
                ctx.moveTo(simX, simY);
                for (let step = 0; step < 35; step++) {
                    simVx += windPix;
                    simVy += gPix;
                    simX += simVx;
                    simY += simVy;
                    if (simY > groundY) break;
                    ctx.lineTo(simX, simY);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw Target (Moving Bullseye)
            ctx.save();
            ctx.translate(this.target.x, this.target.y);
            // Outer ring
            ctx.beginPath();
            ctx.arc(0, 0, this.target.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Middle ring
            ctx.beginPath();
            ctx.arc(0, 0, this.target.r * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            // Bullseye core
            ctx.beginPath();
            ctx.arc(0, 0, this.target.r * 0.32, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            // Floating target altitude and distance indicator
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            const deltaX = Math.round(this.target.x - this.cannonX);
            ctx.fillText(`ΔX=${deltaX}m · h=${Math.round(groundY - this.target.y)}m`, 0, -this.target.r - 6);
            ctx.restore();

            // Draw Cannon Base & Barrel
            const rad = (this.angle * Math.PI) / 180;
            ctx.save();
            ctx.translate(this.cannonX, groundY);
            // Rotating barrel
            ctx.save();
            ctx.rotate(-rad);
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.fillRect(0, -6, 32, 12);
            ctx.strokeRect(0, -6, 32, 12);
            // Muzzle ring
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(28, -7, 6, 14);
            ctx.restore();

            // Mount & Wheel
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI, true);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Axle pin
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f8fafc';
            ctx.fill();

            // Cannon base label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`X₀=${this.cannonX}m`, 0, 16);
            ctx.restore();

            // Projectile if in flight
            if (this.projectile) {
                ctx.beginPath();
                ctx.arc(this.projectile.x, this.projectile.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Glow
                ctx.beginPath();
                ctx.arc(this.projectile.x, this.projectile.y, 11, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
                ctx.fill();
            }

            // Particles
            this.particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
        },

        loop() {
            this.update();
            this.draw();
            this.animId = requestAnimationFrame(() => this.loop());
        },

        destroy() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    };

    // =========================================================================
    // JUEGO 2: GRAVEDAD ORBITAL & SLINGSHOT CÓSMICO
    // =========================================================================
    const OrbitGame = {
        canvas: null,
        ctx: null,
        animId: null,
        planet: { x: 0, y: 0, r: 36, mass: 2400 },
        station: { x: 0, y: 0, r: 18, angle: 0, orbitR: 140, speed: 0.012 },
        probe: null,
        crystals: [],
        crystalsCollected: 0,
        score: 0,
        level: 1,
        isAiming: false,
        aimStart: { x: 0, y: 0 },
        aimCurrent: { x: 0, y: 0 },
        trail: [],

        init(container) {
            container.innerHTML = `
                <div class="game-layout">
                    <!-- HUD Superior: Estado Orbital -->
                    <div class="game-hud-bar">
                        <div class="hud-pill">🚀 Nivel: <strong id="o-lvl">1</strong></div>
                        <div class="hud-pill">💎 Cristales: <strong id="o-crys">0/3</strong></div>
                        <div class="hud-pill">🏆 Puntos: <strong id="o-score">0</strong></div>
                        <div class="hud-pill">🛰️ Velocidad Sonda: <strong id="o-speed">0.0 km/s</strong></div>
                        <div class="hud-pill">⚡ E_Mecánica: <strong id="o-energy">---</strong></div>
                    </div>

                    <div class="game-main-row">
                        <!-- Columna de Simulación / Canvas 100% Despejado -->
                        <div class="game-stage-col">
                            <div class="game-canvas-wrap">
                                <canvas id="orbit-canvas"></canvas>
                            </div>

                            <!-- Barra de Telemetría Dinámica (FUERA del canvas para no tapar los planetas ni las órbitas) -->
                            <div class="game-telemetry-bar" id="orbit-telemetry">
                                <span>🪐 Ley Gravitación: <strong>F = G·(M·m)/r²</strong></span>
                                <span>🛸 Control: <strong>Arrastra sobre la sonda y suelta para lanzar</strong></span>
                            </div>

                            <div class="game-quick-fire-bar">
                                <button type="button" class="btn-game-secondary" onclick="window.OrbitGame.resetProbe()" style="flex:1;">
                                    🔄 Reiniciar Sonda
                                </button>
                                <button type="button" class="btn-game-primary" onclick="window.OrbitGame.nextLevel()" style="flex:1;">
                                    🚀 Siguiente Nivel
                                </button>
                            </div>
                        </div>

                        <!-- Columna de Controles e Información -->
                        <div class="game-controls-col">
                            <div class="game-controls-panel">
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>🎯 Misión Orbital:</label>
                                        <span class="ctrl-badge">Nivel <span id="o-lvl-badge">1</span></span>
                                    </div>
                                    <p style="font-size:0.85rem; color:#cbd5e1; line-height:1.5; margin:0.35rem 0 0.65rem 0;">
                                        Lanza la sonda espacial con el vector inicial adecuado. Recolecta los <strong>3 cristales de energía</strong> y acóplate con éxito en la <strong>Estación Espacial verde</strong> sin colisionar con el planeta central.
                                    </p>
                                </div>

                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">🪐 Seleccionar Nivel:</span>
                                    <div class="btn-group-row">
                                        <button type="button" class="btn-planet btn-orbit-lvl active" onclick="window.OrbitGame.setupLevel(1)">Nivel 1</button>
                                        <button type="button" class="btn-planet btn-orbit-lvl" onclick="window.OrbitGame.setupLevel(2)">Nivel 2</button>
                                        <button type="button" class="btn-planet btn-orbit-lvl" onclick="window.OrbitGame.setupLevel(3)">Nivel 3</button>
                                        <button type="button" class="btn-planet btn-orbit-lvl" onclick="window.OrbitGame.setupLevel(4)">Nivel 4</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="game-physics-note">
                        <span class="note-icon">💡</span>
                        <div class="note-content">
                            <strong>Mecánica Orbital Newtoniana:</strong>
                            <p>
                                Fuerza centrípeta gravitatoria: <code>a = -G·M / r²</code>. 
                                Si la rapidez es menor que la velocidad circular <code>v_c = √(GM/r)</code> la sonda cae en espiral hacia el planeta. 
                                Si supera la velocidad de escape <code>v_e = √(2GM/r)</code> escapa a la infinidad en trayectoria hiperbólica.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            this.canvas = document.getElementById('orbit-canvas');
            this.resize();
            this.setupLevel(1);
            this.bindEvents();
            this.loop();
        },

        resize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const w = Math.max(340, Math.floor(rect.width));
            const h = Math.min(440, Math.max(300, Math.floor(w * 0.55)));
            const s = setupRetinaCanvas(this.canvas, w, h);
            this.ctx = s.ctx;
            this.w = w;
            this.h = h;
            this.planet.x = w * 0.5;
            this.planet.y = h * 0.5;
            this.station.orbitR = Math.min(w, h) * 0.38;
        },

        setupLevel(lvl) {
            this.level = lvl;
            const lvlEl = document.getElementById('o-lvl');
            if (lvlEl) lvlEl.textContent = lvl;

            this.crystals = [];
            this.crystalsCollected = 0;
            const rMin = this.planet.r + 30;
            const rMax = this.station.orbitR - 20;

            for (let i = 0; i < 3; i++) {
                const ang = (i * 2 * Math.PI) / 3 + Math.random() * 0.5;
                const dist = rMin + Math.random() * (rMax - rMin);
                this.crystals.push({
                    x: this.planet.x + Math.cos(ang) * dist,
                    y: this.planet.y + Math.sin(ang) * dist,
                    collected: false,
                    r: 9
                });
            }

            const badge = document.getElementById('o-lvl-badge');
            if (badge) badge.textContent = this.level;
            document.querySelectorAll('.btn-orbit-lvl').forEach((b, idx) => {
                b.classList.toggle('active', idx + 1 === this.level);
            });
            this.resetProbe();
            this.updateHud();
        },

        resetProbe() {
            this.probe = {
                x: 60,
                y: this.h - 50,
                vx: 0,
                vy: 0,
                active: false,
                docked: false,
                crashed: false
            };
            this.trail = [];
            this.aimStart = { x: 60, y: this.h - 50 };
            this.aimCurrent = { x: 60, y: this.h - 50 };
        },

        nextLevel() {
            playSound('hit');
            this.setupLevel(this.level + 1);
        },

        bindEvents() {
            const onDown = (clientX, clientY) => {
                const r = this.canvas.getBoundingClientRect();
                const x = clientX - r.left;
                const y = clientY - r.top;
                if (!this.probe.active) {
                    this.isAiming = true;
                    this.aimStart = { x: this.probe.x, y: this.probe.y };
                    this.aimCurrent = { x, y };
                }
            };

            const onMove = (clientX, clientY) => {
                if (this.isAiming) {
                    const r = this.canvas.getBoundingClientRect();
                    this.aimCurrent = { x: clientX - r.left, y: clientY - r.top };
                }
            };

            const onUp = () => {
                if (this.isAiming && !this.probe.active) {
                    this.isAiming = false;
                    const dx = this.aimStart.x - this.aimCurrent.x;
                    const dy = this.aimStart.y - this.aimCurrent.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 10) {
                        playSound('fire');
                        this.probe.active = true;
                        this.probe.vx = dx * 0.055;
                        this.probe.vy = dy * 0.055;
                    }
                }
            };

            this.canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', onUp);

            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });

            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });

            this.canvas.addEventListener('touchend', onUp);
        },

        update() {
            // Space Station Orbit
            this.station.angle += this.station.speed;
            this.station.x = this.planet.x + Math.cos(this.station.angle) * this.station.orbitR;
            this.station.y = this.planet.y + Math.sin(this.station.angle) * this.station.orbitR;

            // Probe gravity simulation
            if (this.probe && this.probe.active && !this.probe.docked && !this.probe.crashed) {
                const dx = this.planet.x - this.probe.x;
                const dy = this.planet.y - this.probe.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                if (dist <= this.planet.r + 5) {
                    // Colisión con el planeta
                    playSound('boom');
                    this.probe.crashed = true;
                } else {
                    // Newton's law: a = G*M / r^2
                    const a = this.planet.mass / distSq;
                    this.probe.vx += (dx / dist) * a;
                    this.probe.vy += (dy / dist) * a;
                    this.probe.x += this.probe.vx;
                    this.probe.y += this.probe.vy;

                    this.trail.push({ x: this.probe.x, y: this.probe.y, spd: Math.sqrt(this.probe.vx * this.probe.vx + this.probe.vy * this.probe.vy) });
                    if (this.trail.length > 85) this.trail.shift();

                    // Check crystals collection
                    this.crystals.forEach(c => {
                        if (!c.collected) {
                            const cdx = this.probe.x - c.x;
                            const cdy = this.probe.y - c.y;
                            if (Math.sqrt(cdx * cdx + cdy * cdy) < c.r + 10) {
                                c.collected = true;
                                this.crystalsCollected++;
                                this.score += 250;
                                playSound('click');
                                this.updateHud();
                            }
                        }
                    });

                    // Check docking at station
                    const sdx = this.probe.x - this.station.x;
                    const sdy = this.probe.y - this.station.y;
                    const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
                    if (sDist < this.station.r + 12) {
                        playSound('hit');
                        this.probe.docked = true;
                        this.score += 500 + this.crystalsCollected * 200;
                        this.updateHud();
                    }

                    // Lost in space
                    if (this.probe.x < -100 || this.probe.x > this.w + 100 || this.probe.y < -100 || this.probe.y > this.h + 100) {
                        this.probe.crashed = true;
                    }
                }
            }
        },

        updateHud() {
            const crysEl = document.getElementById('o-crys');
            const scoreEl = document.getElementById('o-score');
            const speedEl = document.getElementById('o-speed');
            const energyEl = document.getElementById('o-energy');

            if (crysEl) crysEl.textContent = `${this.crystalsCollected}/3`;
            if (scoreEl) scoreEl.textContent = this.score.toLocaleString('es-ES');

            if (this.probe && this.probe.active && !this.probe.crashed) {
                const spd = Math.sqrt(this.probe.vx * this.probe.vx + this.probe.vy * this.probe.vy) * 2.8;
                if (speedEl) speedEl.textContent = `${spd.toFixed(1)} km/s`;
                const dist = Math.sqrt(Math.pow(this.planet.x - this.probe.x, 2) + Math.pow(this.planet.y - this.probe.y, 2));
                const k = 0.5 * spd * spd;
                const u = -(this.planet.mass / dist) * 10;
                const eTotal = k + u;
                if (energyEl) energyEl.textContent = `${eTotal.toFixed(0)} J (${eTotal < 0 ? 'Ligada 🌀' : 'Escape 🚀'})`;
            }
        },

        draw() {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;
            if (!ctx) return;

            // Deep space background
            ctx.fillStyle = '#050811';
            ctx.fillRect(0, 0, w, h);

            // Orbit line guide
            ctx.beginPath();
            ctx.arc(this.planet.x, this.planet.y, this.station.orbitR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Trajectory trail
            if (this.trail.length > 1) {
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.beginPath();
                    ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                    const spd = this.trail[i].spd;
                    ctx.strokeStyle = spd > 5 ? '#f43f5e' : (spd > 2.8 ? '#facc15' : '#38bdf8');
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            // Slingshot Aim Arrow
            if (this.isAiming) {
                const dx = this.aimStart.x - this.aimCurrent.x;
                const dy = this.aimStart.y - this.aimCurrent.y;
                ctx.beginPath();
                ctx.moveTo(this.aimStart.x, this.aimStart.y);
                ctx.lineTo(this.aimStart.x + dx, this.aimStart.y + dy);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Arrow head
                const ang = Math.atan2(dy, dx);
                ctx.beginPath();
                ctx.arc(this.aimStart.x + dx, this.aimStart.y + dy, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#34d399';
                ctx.fill();
            }

            // Central Planet with atmosphere glow
            ctx.save();
            ctx.translate(this.planet.x, this.planet.y);
            // Atmosphere
            const atmGrad = ctx.createRadialGradient(0, 0, this.planet.r * 0.8, 0, 0, this.planet.r * 1.4);
            atmGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
            atmGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = atmGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.planet.r * 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Core planet
            const pGrad = ctx.createRadialGradient(-8, -8, 2, 0, 0, this.planet.r);
            pGrad.addColorStop(0, '#38bdf8');
            pGrad.addColorStop(0.6, '#0284c7');
            pGrad.addColorStop(1, '#082f49');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.planet.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Crystals
            this.crystals.forEach(c => {
                if (!c.collected) {
                    ctx.save();
                    ctx.translate(c.x, c.y);
                    ctx.rotate(Date.now() * 0.002);
                    ctx.fillStyle = '#facc15';
                    ctx.fillRect(-6, -6, 12, 12);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(-6, -6, 12, 12);
                    ctx.restore();
                }
            });

            // Space Station (Green docking beacon)
            ctx.save();
            ctx.translate(this.station.x, this.station.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.station.r + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
            ctx.fill();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Solar panels
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-18, -3, 36, 6);
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Spacecraft Probe
            if (this.probe) {
                ctx.save();
                ctx.translate(this.probe.x, this.probe.y);
                if (this.probe.crashed) {
                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillText('💥', -10, 5);
                } else if (this.probe.docked) {
                    ctx.fillStyle = '#22c55e';
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillText('✅', -10, 5);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(0, 0, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.restore();
            }
        },

        loop() {
            this.update();
            this.draw();
            this.animId = requestAnimationFrame(() => this.loop());
        },

        destroy() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    };

    // =========================================================================
    // JUEGO 3: ELECTRIC RUSH (LEY DE OHM & CIRCUITOS)
    // =========================================================================
    const CircuitGame = {
        canvas: null,
        ctx: null,
        animId: null,
        voltage: 12,
        resistors: [6, 0], // R1, R2
        circuitMode: 'single', // 'single', 'series', 'parallel'
        currentA: 2.0,
        powerW: 24,
        targetCurrent: 2.0,
        fuseLimit: 3.5,
        fuseBlown: false,
        score: 0,
        level: 1,
        electronOffset: 0,

        nudgeVoltage(delta) {
            playSound('click');
            this.voltage = Math.max(2, Math.min(24, this.voltage + delta));
            const rngV = document.getElementById('rng-cr-v');
            if (rngV) rngV.value = this.voltage;
            const lbl = document.getElementById('lbl-cr-v');
            if (lbl) lbl.textContent = this.voltage + ' V';
            this.recalculate();
        },

        init(container) {
            container.innerHTML = `
                <div class="game-layout">
                    <div class="game-hud-bar">
                        <div class="hud-pill">🏆 Nivel: <strong id="cr-lvl">1</strong></div>
                        <div class="hud-pill">🎯 Meta Corriente: <strong id="cr-target">2.00 A</strong></div>
                        <div class="hud-pill">⚠️ Límite Fusible: <strong id="cr-fuse">3.50 A</strong></div>
                        <div class="hud-pill">⭐ Puntos: <strong id="cr-score">0</strong></div>
                    </div>

                    <div class="game-main-row">
                        <!-- Columna Principal / Canvas -->
                        <div class="game-stage-col">
                            <div class="game-canvas-wrap">
                                <canvas id="circuit-canvas"></canvas>
                            </div>

                            <!-- Barra de Telemetría Eléctrica (FUERA del canvas para no tapar cables ni instrumentos) -->
                            <div class="game-telemetry-bar" id="circuit-telemetry">
                                <span>🔋 Voltaje: <strong id="cr-v">12 V</strong></span>
                                <span>⚡ Corriente: <strong id="cr-i">2.00 A</strong></span>
                                <span>💡 Potencia: <strong id="cr-p">24.0 W</strong></span>
                                <span>🎚️ R_Eq: <strong id="cr-req">6.0 Ω</strong></span>
                            </div>

                            <div class="game-quick-fire-bar">
                                <button type="button" class="btn-game-primary btn-fire-large" onclick="window.CircuitGame.checkSolution()">
                                    ⚡ COMPROBAR SOLUCIÓN & ACTIVAR
                                </button>
                                <button type="button" class="btn-game-secondary" onclick="window.CircuitGame.resetFuse()" title="Reemplazar fusible quemado">
                                    🔧 Cambiar Fusible
                                </button>
                            </div>
                        </div>

                        <!-- Columna de Controles / Instrumentación -->
                        <div class="game-controls-col">
                            <div class="game-controls-panel">
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>🔋 Voltaje de Fuente (V): <strong id="lbl-cr-v">12 V</strong></label>
                                        <span class="ctrl-badge">Fuente DC</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.CircuitGame.nudgeVoltage(-1)" title="Restar 1 Voltio">−1V</button>
                                        <input type="range" id="rng-cr-v" min="2" max="24" value="12" class="game-slider" aria-label="Voltaje">
                                        <button type="button" class="btn-nudge" onclick="window.CircuitGame.nudgeVoltage(+1)" title="Sumar 1 Voltio">+1V</button>
                                    </div>
                                </div>

                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">🔀 Topología de Conexión:</span>
                                    <div class="btn-group-row">
                                        <button type="button" class="btn-topol active" onclick="window.CircuitGame.setTopology('single')">Simple (R₁)</button>
                                        <button type="button" class="btn-topol" onclick="window.CircuitGame.setTopology('series')">En Serie (R₁+R₂)</button>
                                        <button type="button" class="btn-topol" onclick="window.CircuitGame.setTopology('parallel')">En Paralelo (R₁||R₂)</button>
                                    </div>
                                </div>

                                <div class="ctrl-group-buttons">
                                    <span class="ctrl-sublabel">Resistencia R₁ (Ω):</span>
                                    <div class="btn-group-row" id="r1-buttons">
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR1(2)">2Ω</button>
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR1(4)">4Ω</button>
                                        <button type="button" class="btn-res active" onclick="window.CircuitGame.setR1(6)">6Ω</button>
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR1(8)">8Ω</button>
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR1(12)">12Ω</button>
                                    </div>
                                </div>

                                <div class="ctrl-group-buttons" id="r2-group" style="display:none;">
                                    <span class="ctrl-sublabel">Resistencia R₂ (Ω):</span>
                                    <div class="btn-group-row" id="r2-buttons">
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR2(2)">2Ω</button>
                                        <button type="button" class="btn-res active" onclick="window.CircuitGame.setR2(4)">4Ω</button>
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR2(6)">6Ω</button>
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR2(8)">8Ω</button>
                                        <button type="button" class="btn-res" onclick="window.CircuitGame.setR2(12)">12Ω</button>
                                    </div>
                                </div>
                            </div>

                            <div class="game-physics-note">
                                <span class="note-icon">💡</span>
                                <div class="note-content">
                                    <strong>Leyes Fundamentales de Circuitos:</strong>
                                    <p>
                                        <strong>Ley de Ohm:</strong> <code>I = V / R_eq</code> &nbsp;|&nbsp;
                                        <strong>Potencia:</strong> <code>P = V · I = I² · R</code><br>
                                        <strong>Serie:</strong> <code>R_eq = R₁ + R₂</code> &nbsp;|&nbsp;
                                        <strong>Paralelo:</strong> <code>1/R_eq = 1/R₁ + 1/R₂</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.canvas = document.getElementById('circuit-canvas');
            this.resize();
            this.bindEvents();
            this.setupMission(1);
            this.recalculate();
            this.loop();
        },

        resize() {
            if (!this.canvas) return;
            const parent = this.canvas.parentElement;
            const rect = parent ? parent.getBoundingClientRect() : { width: 360 };
            const isMobile = window.innerWidth <= 768;
            const w = Math.max(260, Math.floor(rect.width) || (window.innerWidth - 32));
            const h = isMobile 
                ? Math.max(230, Math.min(300, Math.floor(w * 0.65))) 
                : Math.min(380, Math.max(260, Math.floor(w * 0.42)));
            const s = setupRetinaCanvas(this.canvas, w, h);
            this.ctx = s.ctx;
            this.w = w;
            this.h = h;
        },

        setupMission(lvl) {
            this.level = lvl;
            const missions = [
                { targetI: 2.0, fuse: 3.5, desc: 'Ajusta el voltaje y resistencia para lograr exactamente 2.00 A.' },
                { targetI: 1.5, fuse: 2.8, desc: 'En serie: ajusta R₁ y R₂ para calibrar la corriente a 1.50 A.' },
                { targetI: 3.0, fuse: 4.2, desc: 'En paralelo: divide la carga para alcanzar 3.00 A sin quemar el fusible.' },
                { targetI: 2.5, fuse: 3.2, desc: 'Nivel Avanzado: Diseña la red para alimentar la bombilla a 2.50 A exactos.' }
            ];

            const m = missions[(lvl - 1) % missions.length];
            this.targetCurrent = m.targetI;
            this.fuseLimit = m.fuse;
            this.fuseBlown = false;

            document.getElementById('cr-lvl').textContent = lvl;
            document.getElementById('cr-target').textContent = m.targetI.toFixed(2) + ' A';
            document.getElementById('cr-fuse').textContent = m.fuse.toFixed(2) + ' A';
            this.recalculate();
        },

        bindEvents() {
            const rngV = document.getElementById('rng-cr-v');
            if (rngV) {
                rngV.addEventListener('input', (e) => {
                    this.voltage = parseInt(e.target.value, 10);
                    document.getElementById('lbl-cr-v').textContent = this.voltage + ' V';
                    this.recalculate();
                });
            }
        },

        setTopology(topol) {
            this.circuitMode = topol;
            playSound('click');
            document.querySelectorAll('.btn-topol').forEach(b => b.classList.remove('active'));
            const btn = Array.from(document.querySelectorAll('.btn-topol')).find(b => b.getAttribute('onclick').includes(topol));
            if (btn) btn.classList.add('active');

            const r2Group = document.getElementById('r2-group');
            if (r2Group) r2Group.style.display = (topol === 'single') ? 'none' : 'block';

            if (topol !== 'single' && this.resistors[1] === 0) {
                this.resistors[1] = 4;
            }
            this.recalculate();
        },

        setR1(val) {
            this.resistors[0] = val;
            playSound('click');
            const btns = document.querySelectorAll('#r1-buttons .btn-res');
            btns.forEach(b => b.classList.remove('active'));
            const b = Array.from(btns).find(x => x.getAttribute('onclick').includes(`(${val})`));
            if (b) b.classList.add('active');
            this.recalculate();
        },

        setR2(val) {
            this.resistors[1] = val;
            playSound('click');
            const btns = document.querySelectorAll('#r2-buttons .btn-res');
            btns.forEach(b => b.classList.remove('active'));
            const b = Array.from(btns).find(x => x.getAttribute('onclick').includes(`(${val})`));
            if (b) b.classList.add('active');
            this.recalculate();
        },

        recalculate() {
            let req = this.resistors[0];
            if (this.circuitMode === 'series') {
                req = this.resistors[0] + (this.resistors[1] || 0);
            } else if (this.circuitMode === 'parallel') {
                const r1 = this.resistors[0];
                const r2 = this.resistors[1] || 1;
                req = (r1 * r2) / (r1 + r2);
            }

            this.req = req;
            if (req > 0) {
                this.currentA = this.voltage / req;
                this.powerW = this.voltage * this.currentA;
            } else {
                this.currentA = 0;
                this.powerW = 0;
            }

            if (this.currentA > this.fuseLimit && !this.fuseBlown) {
                this.fuseBlown = true;
                playSound('spark');
            }

            const crV = document.getElementById('cr-v');
            const crI = document.getElementById('cr-i');
            const crP = document.getElementById('cr-p');
            const crReq = document.getElementById('cr-req');

            if (crV) crV.textContent = this.voltage + ' V';
            if (crI) crI.textContent = (this.fuseBlown ? '0.00 A (FUSIBLE QUEMADO)' : this.currentA.toFixed(2) + ' A');
            if (crP) crP.textContent = (this.fuseBlown ? '0.0 W' : this.powerW.toFixed(1) + ' W');
            if (crReq) crReq.textContent = this.req.toFixed(1) + ' Ω';
        },

        resetFuse() {
            playSound('click');
            this.fuseBlown = false;
            this.recalculate();
        },

        checkSolution() {
            if (this.fuseBlown) {
                alert('⚠️ El fusible está quemado por sobrecorriente. Haz clic en "Cambiar Fusible" y reduce el voltaje o aumenta la resistencia.');
                return;
            }

            const diff = Math.abs(this.currentA - this.targetCurrent);
            if (diff <= 0.08) {
                playSound('hit');
                this.score += 400;
                document.getElementById('cr-score').textContent = this.score.toLocaleString('es-ES');
                alert(`🎉 ¡EXCELENTE! Has calibrado el circuito con exactitud:\n\n• Voltaje: ${this.voltage}V\n• Resistencia Equivalente: ${this.req.toFixed(1)}Ω\n• Corriente Lograda: ${this.currentA.toFixed(2)}A (Meta: ${this.targetCurrent.toFixed(2)}A)\n• Potencia: ${this.powerW.toFixed(1)}W\n\n¡Avanzas al siguiente desafío!`);
                this.setupMission(this.level + 1);
            } else {
                playSound('spark');
                alert(`⚠️ Corriente fuera del rango objetivo.\n\n• Corriente actual: ${this.currentA.toFixed(2)}A\n• Meta requerida: ${this.targetCurrent.toFixed(2)}A\n\nRecuerda: I = V / R. Ajusta el voltaje o cambia las resistencias.`);
            }
        },

        update() {
            if (!this.fuseBlown && this.currentA > 0) {
                this.electronOffset += this.currentA * 1.5;
            }
        },

        draw() {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;
            if (!ctx) return;

            // Blueprint background
            ctx.fillStyle = '#0a101d';
            ctx.fillRect(0, 0, w, h);

            // Circuit rectangular loop coordinates
            const padX = Math.floor(w * 0.12);
            const padY = Math.floor(h * 0.18);
            const cw = w - padX * 2;
            const ch = h - padY * 2;

            // Wires
            ctx.strokeStyle = this.fuseBlown ? '#ef4444' : '#38bdf8';
            ctx.lineWidth = 4;
            ctx.strokeRect(padX, padY, cw, ch);

            // Flowing electrons along wire
            if (!this.fuseBlown && this.currentA > 0) {
                ctx.fillStyle = '#facc15';
                const perimeter = (cw + ch) * 2;
                const count = 28;
                for (let i = 0; i < count; i++) {
                    const dist = (i * (perimeter / count) + this.electronOffset) % perimeter;
                    let ex = padX, ey = padY;
                    if (dist < cw) {
                        ex = padX + dist;
                        ey = padY;
                    } else if (dist < cw + ch) {
                        ex = padX + cw;
                        ey = padY + (dist - cw);
                    } else if (dist < cw * 2 + ch) {
                        ex = padX + cw - (dist - (cw + ch));
                        ey = padY + ch;
                    } else {
                        ex = padX;
                        ey = padY + ch - (dist - (cw * 2 + ch));
                    }
                    ctx.beginPath();
                    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Power Supply (Left side)
            const srcX = padX;
            const srcY = padY + ch * 0.5;
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(srcX - 18, srcY - 26, 36, 52);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(srcX - 18, srcY - 26, 36, 52);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.voltage}V`, srcX, srcY + 4);

            // Resistors (Top side)
            const topY = padY;
            if (this.circuitMode === 'single') {
                const rx = padX + cw * 0.5;
                this.drawResistorBox(ctx, rx, topY, `R₁=${this.resistors[0]}Ω`);
            } else if (this.circuitMode === 'series') {
                const r1x = padX + cw * 0.35;
                const r2x = padX + cw * 0.65;
                this.drawResistorBox(ctx, r1x, topY, `R₁=${this.resistors[0]}Ω`);
                this.drawResistorBox(ctx, r2x, topY, `R₂=${this.resistors[1]}Ω`);
            } else if (this.circuitMode === 'parallel') {
                const rx = padX + cw * 0.5;
                this.drawResistorBox(ctx, rx, topY - 18, `R₁=${this.resistors[0]}Ω`);
                this.drawResistorBox(ctx, rx, topY + 18, `R₂=${this.resistors[1]}Ω`);
                // Parallel branch wires
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(rx - 40, topY);
                ctx.lineTo(rx - 40, topY - 18);
                ctx.lineTo(rx - 25, topY - 18);
                ctx.moveTo(rx + 25, topY - 18);
                ctx.lineTo(rx + 40, topY - 18);
                ctx.lineTo(rx + 40, topY);

                ctx.moveTo(rx - 40, topY);
                ctx.lineTo(rx - 40, topY + 18);
                ctx.lineTo(rx - 25, topY + 18);
                ctx.moveTo(rx + 25, topY + 18);
                ctx.lineTo(rx + 40, topY + 18);
                ctx.lineTo(rx + 40, topY);
                ctx.stroke();
            }

            // Lightbulb (Right side)
            const bulbX = padX + cw;
            const bulbY = padY + ch * 0.5;
            const brightness = this.fuseBlown ? 0 : Math.min(1, this.currentA / 3.0);

            // Glow aura
            if (brightness > 0) {
                const gGrad = ctx.createRadialGradient(bulbX, bulbY, 6, bulbX, bulbY, 28 + brightness * 20);
                gGrad.addColorStop(0, `rgba(253, 224, 71, ${brightness})`);
                gGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
                ctx.fillStyle = gGrad;
                ctx.beginPath();
                ctx.arc(bulbX, bulbY, 32 + brightness * 20, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bulb glass
            ctx.fillStyle = brightness > 0 ? `rgba(254, 240, 138, ${0.4 + brightness * 0.6})` : '#334155';
            ctx.beginPath();
            ctx.arc(bulbX, bulbY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Filament
            ctx.fillStyle = brightness > 0 ? '#ea580c' : '#64748b';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💡', bulbX, bulbY + 5);

            // Fuse / Ammeter (Bottom side)
            const fuseX = padX + cw * 0.5;
            const fuseY = padY + ch;
            ctx.fillStyle = this.fuseBlown ? '#7f1d1d' : '#065f46';
            ctx.fillRect(fuseX - 35, fuseY - 14, 70, 28);
            ctx.strokeStyle = this.fuseBlown ? '#ef4444' : '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(fuseX - 35, fuseY - 14, 70, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.fuseBlown ? 'FUSIBLE: QUEMADO' : `FUSIBLE: ${this.fuseLimit}A`, fuseX, fuseY + 4);
        },

        drawResistorBox(ctx, x, y, label) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x - 30, y - 12, 60, 24);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 30, y - 12, 60, 24);
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y + 4);
        },

        loop() {
            this.update();
            this.draw();
            this.animId = requestAnimationFrame(() => this.loop());
        },

        destroy() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    };


    // =========================================================================
    // JUEGO 4: QUANTUM SNAKE (ONDAS DE BROGLIE & EFECTO TÚNEL CUÁNTICO)
    // =========================================================================
    const QuantumSnakeGame = {
        canvas: null,
        ctx: null,
        animId: null,
        w: 560,
        h: 380,
        cols: 28,
        rows: 19,
        cellW: 20,
        cellH: 20,

        // Estado cuántico
        n: 1, // Nivel cuántico principal
        scoreEV: 0,
        quantaCount: 0,
        tunnelGauge: 100, // 0-100%
        isTunneling: false,
        barrierV0: 15.0, // eV
        boundaryMode: 'barrier', // 'barrier' o 'periodic'
        speedFactor: 1.0,

        // Estado de la serpiente / paquete de onda
        body: [],
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        lastMoveTime: 0,
        moveInterval: 110,
        wavePhase: 0,
        isGameOver: false,
        isPaused: false,

        // Cuantos / Fotones en el pozo
        quanta: [],
        quantaPalette: [
            { type: 'red', name: 'Fotón Rojo (700nm)', ev: 1.77, lambda: 700, color: '#ef4444', pts: 20, tunnel: 15 },
            { type: 'green', name: 'Fotón Verde (530nm)', ev: 2.34, lambda: 530, color: '#10b981', pts: 45, tunnel: 25 },
            { type: 'blue', name: 'Fotón Azul (450nm)', ev: 2.75, lambda: 450, color: '#38bdf8', pts: 80, tunnel: 40 },
            { type: 'uv', name: 'Paquete UV / Higgs (380nm)', ev: 3.26, lambda: 380, color: '#c084fc', pts: 150, tunnel: 100 }
        ],

        particles: [],
        keyListener: null,

        init(container) {
            container.innerHTML = `
                <div class="game-layout">
                    <!-- HUD Superior: Estado Cuántico en Vivo -->
                    <div class="game-hud-bar">
                        <div class="hud-pill">⚛️ Nivel: <strong id="qs-level">n = 1</strong></div>
                        <div class="hud-pill">⚡ Energía: <strong id="qs-score">0.00 eV</strong></div>
                        <div class="hud-pill">🌊 λ De Broglie: <strong id="qs-lambda">650 nm</strong></div>
                        <div class="hud-pill">🌀 Túnel Cuántico: <strong id="qs-tunnel">100%</strong></div>
                        <div class="hud-pill">✨ Cuantos: <strong id="qs-quanta">0</strong></div>
                    </div>

                    <!-- Fila Cockpit: Canvas + D-Pad a la izquierda, Controles a la derecha -->
                    <div class="game-main-row">
                        <div class="game-stage-col">
                            <div class="game-canvas-wrap">
                                <canvas id="snake-canvas"></canvas>
                            </div>

                            <!-- Barra de Telemetría Dinámica -->
                            <div class="game-telemetry-bar" id="snake-telemetry">
                                <span>Momento p: <strong id="qs-p">1.05 ×10⁻²⁷ kg·m/s</strong></span>
                                <span>Vel. Grupo vg: <strong id="qs-vg">1.15 ×10⁵ m/s</strong></span>
                                <span>Barrera V₀: <strong id="qs-v0">15.0 eV</strong></span>
                                <span>Transmisión T: <strong id="qs-trans">0.02%</strong></span>
                            </div>

                            <!-- Controles Arcade & D-Pad para Táctil y PC -->
                            <div class="arcade-controller-row">
                                <div class="arcade-dpad-grid">
                                    <div class="arcade-dpad-cell"></div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-qs-up" onclick="window.QuantumSnakeGame.setDirection(0, -1)" title="Arriba (W / ↑)">▲</button>
                                    </div>
                                    <div class="arcade-dpad-cell"></div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-qs-left" onclick="window.QuantumSnakeGame.setDirection(-1, 0)" title="Izquierda (A / ←)">◀</button>
                                    </div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-qs-down" onclick="window.QuantumSnakeGame.setDirection(0, 1)" title="Abajo (S / ↓)">▼</button>
                                    </div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-qs-right" onclick="window.QuantumSnakeGame.setDirection(1, 0)" title="Derecha (D / →)">▶</button>
                                    </div>
                                </div>

                                <div class="arcade-action-wrap">
                                    <button type="button" class="arcade-btn-action pulsing" id="btn-qs-tunnel" onclick="window.QuantumSnakeGame.toggleTunnel()" title="Activar Efecto Túnel Cuántico (Barra Espaciadora)">
                                        ⚡ Tunelar (ESPACIO)
                                    </button>
                                    <button type="button" class="arcade-btn-secondary" onclick="window.QuantumSnakeGame.resetGame()">
                                        🔄 Reiniciar Onda
                                    </button>
                                    <div class="arcade-key-hints">
                                        <span>Teclado:</span>
                                        <span class="arcade-key-badge">WASD</span>
                                        <span class="arcade-key-badge">Flechas</span>
                                        <span class="arcade-key-badge">Espacio</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Columna de Controles e Instrumentación Científica -->
                        <div class="game-controls-col">
                            <div class="game-controls-panel">
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>🧪 Barrera de Potencial V₀: <strong id="lbl-qs-v0">15.0 eV</strong></label>
                                        <span class="ctrl-badge">Pozo Cuántico</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.QuantumSnakeGame.nudgeBarrier(-2.5)">−2.5eV</button>
                                        <input type="range" id="rng-qs-v0" min="5" max="30" step="0.5" value="15" class="game-slider" aria-label="Barrera de Potencial">
                                        <button type="button" class="btn-nudge" onclick="window.QuantumSnakeGame.nudgeBarrier(+2.5)">+2.5eV</button>
                                    </div>
                                </div>

                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">🌌 Condiciones de Contorno:</span>
                                    <div class="btn-group-row">
                                        <button type="button" class="btn-topol active" id="btn-mode-barrier" onclick="window.QuantumSnakeGame.setBoundaryMode('barrier')">Pozo Finito (Colisión Mortal)</button>
                                        <button type="button" class="btn-topol" id="btn-mode-periodic" onclick="window.QuantumSnakeGame.setBoundaryMode('periodic')">Periódico Libre (Toroidal)</button>
                                    </div>
                                </div>

                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">🌈 Espectro de Cuantos Absorbibles:</span>
                                    <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.78rem; font-family:monospace; background:rgba(0,0,0,0.3); padding:0.6rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#ef4444;">●</span> <span>Fotón Rojo (700nm): +1.77 eV | +15% Túnel</span></div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#10b981;">●</span> <span>Fotón Verde (530nm): +2.34 eV | +25% Túnel</span></div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#38bdf8;">●</span> <span>Fotón Azul (450nm): +2.75 eV | +40% Túnel</span></div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#c084fc;">●</span> <span>Paquete UV (380nm): +3.26 eV | Recarga 100%</span></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Ficha Didáctica de Física -->
                            <div class="game-physics-note">
                                <span class="note-icon">⚛️</span>
                                <div class="note-content">
                                    <strong>Física Cuántica: Dualidad Onda-Partícula &amp; Túnel</strong>
                                    Louis de Broglie postuló en 1924 que toda partícula posee una longitud de onda asociada: <code>λ = h / p</code>. Al absorber fotones, la serpiente aumenta su momento y su nivel cuántico <code>n</code>. Con la barra espaciadora activas el <strong>Efecto Túnel</strong> (<code>T ≈ e^(-2κL)</code>), permitiendo a la onda atravesar barreras de potencial sin colapsar.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.canvas = document.getElementById('snake-canvas');
            this.resize();
            this.bindEvents();
            this.resetGame();
            this.loop();
        },

        resize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const w = Math.max(320, Math.floor(rect.width));
            const h = Math.min(420, Math.max(260, Math.floor(w * 0.62)));
            const s = setupRetinaCanvas(this.canvas, w, h);
            this.ctx = s.ctx;
            this.w = w;
            this.h = h;
            this.cellW = w / this.cols;
            this.cellH = h / this.rows;
        },

        bindEvents() {
            const rngV0 = document.getElementById('rng-qs-v0');
            if (rngV0) {
                rngV0.addEventListener('input', (e) => {
                    this.barrierV0 = parseFloat(e.target.value);
                    const lbl = document.getElementById('lbl-qs-v0');
                    if (lbl) lbl.textContent = this.barrierV0.toFixed(1) + ' eV';
                    this.updateTelemetry();
                });
            }

            this.keyListener = (e) => {
                const key = e.key;
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
                    e.preventDefault();
                }
                if (key === 'ArrowUp' || key === 'w' || key === 'W') this.setDirection(0, -1);
                else if (key === 'ArrowDown' || key === 's' || key === 'S') this.setDirection(0, 1);
                else if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.setDirection(-1, 0);
                else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.setDirection(1, 0);
                else if (key === ' ') this.toggleTunnel();
                else if (key === 'r' || key === 'R') this.resetGame();
            };
            window.addEventListener('keydown', this.keyListener);
        },

        setDirection(dx, dy) {
            // Prevenir giro instantáneo de 180° contra el cuerpo
            if (this.dir.x + dx === 0 && this.dir.y + dy === 0) return;
            this.nextDir = { x: dx, y: dy };
            playSound('click');
        },

        toggleTunnel() {
            if (this.isTunneling) {
                this.isTunneling = false;
                playSound('click');
            } else {
                if (this.tunnelGauge > 8) {
                    this.isTunneling = true;
                    playSound('tunnel');
                    // Generar destello cuántico en la cabeza
                    if (this.body.length > 0) {
                        const h = this.body[0];
                        this.spawnParticles((h.x + 0.5) * this.cellW, (h.y + 0.5) * this.cellH, '#c084fc', 14);
                    }
                }
            }
            this.updateTunnelButton();
        },

        updateTunnelButton() {
            const btn = document.getElementById('btn-qs-tunnel');
            if (btn) {
                if (this.isTunneling) {
                    btn.classList.add('active');
                    btn.innerHTML = '⚡ TÚNEL ACTIVO (' + Math.round(this.tunnelGauge) + '%)';
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '⚡ Tunelar (' + Math.round(this.tunnelGauge) + '%)';
                }
            }
        },

        nudgeBarrier(delta) {
            this.barrierV0 = Math.max(5, Math.min(30, +(this.barrierV0 + delta).toFixed(1)));
            const rng = document.getElementById('rng-qs-v0');
            const lbl = document.getElementById('lbl-qs-v0');
            if (rng) rng.value = this.barrierV0;
            if (lbl) lbl.textContent = this.barrierV0.toFixed(1) + ' eV';
            this.updateTelemetry();
            playSound('click');
        },

        setBoundaryMode(mode) {
            this.boundaryMode = mode;
            const btnB = document.getElementById('btn-mode-barrier');
            const btnP = document.getElementById('btn-mode-periodic');
            if (btnB) btnB.classList.toggle('active', mode === 'barrier');
            if (btnP) btnP.classList.toggle('active', mode === 'periodic');
            playSound('click');
        },

        resetGame() {
            this.n = 1;
            this.scoreEV = 0;
            this.quantaCount = 0;
            this.tunnelGauge = 100;
            this.isTunneling = false;
            this.isGameOver = false;
            this.moveInterval = 110;
            this.dir = { x: 1, y: 0 };
            this.nextDir = { x: 1, y: 0 };
            this.particles = [];

            const startX = 8;
            const startY = 9;
            this.body = [
                { x: startX, y: startY },
                { x: startX - 1, y: startY },
                { x: startX - 2, y: startY },
                { x: startX - 3, y: startY }
            ];

            this.quanta = [];
            for (let i = 0; i < 3; i++) {
                this.spawnQuantum();
            }

            this.updateTelemetry();
            this.updateTunnelButton();
            playSound('hit');
        },

        spawnQuantum() {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                attempts++;
                const qx = Math.floor(Math.random() * (this.cols - 2)) + 1;
                const qy = Math.floor(Math.random() * (this.rows - 2)) + 1;
                const onSnake = this.body.some(b => b.x === qx && b.y === qy);
                const onQuanta = this.quanta.some(q => q.x === qx && q.y === qy);
                if (!onSnake && !onQuanta) {
                    const template = this.quantaPalette[Math.floor(Math.random() * this.quantaPalette.length)];
                    this.quanta.push({
                        x: qx,
                        y: qy,
                        ...template,
                        phase: Math.random() * Math.PI * 2
                    });
                    placed = true;
                }
            }
        },

        spawnParticles(x, y, color, count = 8) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.2 + Math.random() * 2.8;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    life: 1.0,
                    decay: 0.03 + Math.random() * 0.03,
                    size: 2.5 + Math.random() * 2.5
                });
            }
        },

        step() {
            if (this.isGameOver) return;
            this.dir = { ...this.nextDir };
            const head = this.body[0];
            let nx = head.x + this.dir.x;
            let ny = head.y + this.dir.y;

            // Manejo de contornos / barrera
            const hitWall = nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows;
            if (hitWall) {
                if (this.isTunneling || this.boundaryMode === 'periodic') {
                    // Efecto túnel a través del contorno
                    nx = (nx + this.cols) % this.cols;
                    ny = (ny + this.rows) % this.rows;
                    this.tunnelGauge = Math.max(0, this.tunnelGauge - 6);
                    this.spawnParticles((nx + 0.5) * this.cellW, (ny + 0.5) * this.cellH, '#38bdf8', 10);
                    playSound('tunnel');
                } else {
                    this.isGameOver = true;
                    playSound('gameover');
                    this.spawnParticles((head.x + 0.5) * this.cellW, (head.y + 0.5) * this.cellH, '#ef4444', 25);
                    return;
                }
            }

            // Colisión contra la propia cola (Interferencia cuántica)
            const hitSelf = this.body.some(b => b.x === nx && b.y === ny);
            if (hitSelf) {
                if (this.isTunneling) {
                    // Superposición cuántica sin colapso
                    this.tunnelGauge = Math.max(0, this.tunnelGauge - 12);
                    this.spawnParticles((nx + 0.5) * this.cellW, (ny + 0.5) * this.cellH, '#c084fc', 10);
                    playSound('spark');
                } else {
                    this.isGameOver = true;
                    playSound('gameover');
                    this.spawnParticles((head.x + 0.5) * this.cellW, (head.y + 0.5) * this.cellH, '#f59e0b', 25);
                    return;
                }
            }

            // Absorción de cuantos fotónicos
            const qIdx = this.quanta.findIndex(q => q.x === nx && q.y === ny);
            if (qIdx !== -1) {
                const q = this.quanta[qIdx];
                this.quanta.splice(qIdx, 1);
                this.quantaCount++;
                this.scoreEV = +(this.scoreEV + q.ev).toFixed(2);
                this.tunnelGauge = Math.min(100, this.tunnelGauge + q.tunnel);
                this.spawnParticles((nx + 0.5) * this.cellW, (ny + 0.5) * this.cellH, q.color, 16);
                playSound('eat');

                // Nivel cuántico n
                const newN = 1 + Math.floor(this.quantaCount / 4);
                if (newN > this.n) {
                    this.n = newN;
                    this.moveInterval = Math.max(65, 110 - (this.n - 1) * 6);
                    playSound('powerup');
                }

                this.spawnQuantum();
                // Al absorber fotón, la serpiente crece (no hace pop)
            } else {
                this.body.pop();
            }

            this.body.unshift({ x: nx, y: ny });
            this.updateTelemetry();
        },

        update(dt) {
            this.wavePhase += 0.12;

            // Drenaje o regeneración pasiva del efecto túnel
            if (this.isTunneling) {
                this.tunnelGauge = Math.max(0, this.tunnelGauge - dt * 20);
                if (this.tunnelGauge <= 0) {
                    this.isTunneling = false;
                    playSound('spark');
                }
            } else {
                this.tunnelGauge = Math.min(100, this.tunnelGauge + dt * 2.8);
            }
            this.updateTunnelButton();

            // Partículas
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        },

        updateTelemetry() {
            const lambdaNm = Math.max(120, Math.round(650 / Math.sqrt(this.n)));
            const pVal = (1.05 * Math.sqrt(this.n)).toFixed(2);
            const vgVal = (1.15 * Math.sqrt(this.n)).toFixed(2);
            const transProb = this.isTunneling ? 98.4 : Math.min(15.0, (this.tunnelGauge * 0.12)).toFixed(2);

            const elLvl = document.getElementById('qs-level');
            const elScr = document.getElementById('qs-score');
            const elLmb = document.getElementById('qs-lambda');
            const elTun = document.getElementById('qs-tunnel');
            const elQnt = document.getElementById('qs-quanta');

            if (elLvl) elLvl.textContent = `n = ${this.n}`;
            if (elScr) elScr.textContent = `${this.scoreEV.toFixed(2)} eV`;
            if (elLmb) elLmb.textContent = `${lambdaNm} nm`;
            if (elTun) elTun.textContent = `${Math.round(this.tunnelGauge)}% ${this.isTunneling ? '(ACTIVO)' : ''}`;
            if (elQnt) elQnt.textContent = `${this.quantaCount}`;

            const elP = document.getElementById('qs-p');
            const elVg = document.getElementById('qs-vg');
            const elV0 = document.getElementById('qs-v0');
            const elTr = document.getElementById('qs-trans');

            if (elP) elP.textContent = `${pVal} ×10⁻²⁷ kg·m/s`;
            if (elVg) elVg.textContent = `${vgVal} ×10⁵ m/s`;
            if (elV0) elV0.textContent = `${this.barrierV0.toFixed(1)} eV`;
            if (elTr) elTr.textContent = `${transProb}%`;
        },

        draw() {
            const ctx = this.ctx;
            if (!ctx) return;

            // Fondo del pozo cuántico
            ctx.fillStyle = '#060913';
            ctx.fillRect(0, 0, this.w, this.h);

            // Rejilla cuántica sutil
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
            ctx.lineWidth = 1;
            for (let c = 0; c <= this.cols; c++) {
                ctx.beginPath();
                ctx.moveTo(c * this.cellW, 0);
                ctx.lineTo(c * this.cellW, this.h);
                ctx.stroke();
            }
            for (let r = 0; r <= this.rows; r++) {
                ctx.beginPath();
                ctx.moveTo(0, r * this.cellH);
                ctx.lineTo(this.w, r * this.cellH);
                ctx.stroke();
            }

            // Borde de la barrera de potencial V0
            ctx.strokeStyle = this.isTunneling ? '#c084fc' : (this.boundaryMode === 'periodic' ? 'rgba(56, 189, 248, 0.4)' : '#38bdf8');
            ctx.lineWidth = this.isTunneling ? 3 : 2;
            ctx.strokeRect(1, 1, this.w - 2, this.h - 2);

            // Dibujar cuantos fotónicos
            for (const q of this.quanta) {
                const cx = (q.x + 0.5) * this.cellW;
                const cy = (q.y + 0.5) * this.cellH;
                const pulse = Math.sin(this.wavePhase * 2 + q.phase);
                const r = this.cellW * 0.35 + pulse * 1.8;

                // Anillo de onda de probabilidad
                ctx.save();
                ctx.strokeStyle = q.color;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.5 + 0.4 * pulse;
                ctx.beginPath();
                ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
                ctx.stroke();

                // Núcleo cuántico
                ctx.globalAlpha = 0.95;
                ctx.fillStyle = q.color;
                ctx.shadowColor = q.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Dibujar serpiente como función de onda cuántica continua
            if (this.body.length > 0) {
                ctx.save();
                ctx.shadowColor = this.isTunneling ? '#c084fc' : '#38bdf8';
                ctx.shadowBlur = this.isTunneling ? 18 : 10;

                // Trazar línea de onda a lo largo de los segmentos
                ctx.beginPath();
                for (let i = 0; i < this.body.length; i++) {
                    const seg = this.body[i];
                    const cx = (seg.x + 0.5) * this.cellW;
                    const cy = (seg.y + 0.5) * this.cellH;

                    // Ondulación senoidal perpendicular a la trayectoria
                    const waveOffset = Math.sin(i * 0.8 - this.wavePhase * 1.5) * 3.5;
                    const perpX = -this.dir.y * waveOffset;
                    const perpY = this.dir.x * waveOffset;

                    const px = cx + perpX;
                    const py = cy + perpY;

                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.strokeStyle = this.isTunneling ? '#e879f9' : '#38bdf8';
                ctx.lineWidth = Math.max(6, this.cellW * 0.55);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();

                // Nodos cuánticos sobre cada segmento
                for (let i = 0; i < this.body.length; i++) {
                    const seg = this.body[i];
                    const cx = (seg.x + 0.5) * this.cellW;
                    const cy = (seg.y + 0.5) * this.cellH;
                    const isHead = (i === 0);

                    ctx.fillStyle = isHead ? '#ffffff' : (this.isTunneling ? '#c084fc' : '#0284c7');
                    ctx.beginPath();
                    const nodeR = isHead ? this.cellW * 0.42 : this.cellW * 0.28;
                    ctx.arc(cx, cy, nodeR, 0, Math.PI * 2);
                    ctx.fill();

                    // Ojos con espín cuántico en la cabeza
                    if (isHead) {
                        ctx.fillStyle = '#0f172a';
                        const eyeOffset = this.cellW * 0.18;
                        const eyeX1 = cx - this.dir.y * eyeOffset + this.dir.x * 2;
                        const eyeY1 = cy + this.dir.x * eyeOffset + this.dir.y * 2;
                        const eyeX2 = cx + this.dir.y * eyeOffset + this.dir.x * 2;
                        const eyeY2 = cy - this.dir.x * eyeOffset + this.dir.y * 2;

                        ctx.beginPath();
                        ctx.arc(eyeX1, eyeY1, 2.2, 0, Math.PI * 2);
                        ctx.arc(eyeX2, eyeY2, 2.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }

            // Partículas
            for (const p of this.particles) {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Pantalla de Game Over (Colapso de Función de Onda)
            if (this.isGameOver) {
                ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
                ctx.fillRect(0, 0, this.w, this.h);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 22px system-ui, sans-serif';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 12;
                ctx.fillText('⚡ COLAPSO DE FUNCIÓN DE ONDA', this.w * 0.5, this.h * 0.42);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '14px system-ui, sans-serif';
                ctx.fillText(`Energía recolectada: ${this.scoreEV.toFixed(2)} eV | Nivel n = ${this.n}`, this.w * 0.5, this.h * 0.52);

                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 13px system-ui, sans-serif';
                ctx.fillText('Presiona [R] o "Reiniciar Onda" para un nuevo paquete cuántico', this.w * 0.5, this.h * 0.65);
            }
        },

        loop() {
            const now = performance.now();
            const dt = Math.min(0.1, (now - (this.lastFrameTime || now)) / 1000);
            this.lastFrameTime = now;

            if (now - this.lastMoveTime >= this.moveInterval) {
                this.step();
                this.lastMoveTime = now;
            }

            this.update(dt);
            this.draw();
            this.animId = requestAnimationFrame(() => this.loop());
        },

        destroy() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.animId = null;
            if (this.keyListener) {
                window.removeEventListener('keydown', this.keyListener);
                this.keyListener = null;
            }
        }
    };

    // =========================================================================
    // JUEGO 5: PAC-COULOMB (ELECTROSTÁTICA, LEY DE COULOMB & JAULA DE FARADAY)
    // =========================================================================
    const PacCoulombGame = {
        canvas: null,
        ctx: null,
        animId: null,
        w: 520,
        h: 440,
        cols: 19,
        rows: 17,
        tileW: 27,
        tileH: 26,

        // Mapa del laberinto electrostático:
        // 1 = Pared dieléctrica aislante (barrera de potencial)
        // 0 = Canal conductor con electrón (-e)
        // 2 = Canal vacío (sin carga)
        // 3 = Supercondensador (Jaula de Faraday / Inversión)
        // 4 = Puerta cámara de iones
        mazeLayout: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,3,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1],
            [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
            [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
            [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
            [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
            [1,1,1,1,0,1,2,1,1,4,1,1,2,1,0,1,1,1,1],
            [0,0,0,0,0,2,2,1,2,2,2,1,2,2,0,0,0,0,0],
            [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
            [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
            [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
            [1,3,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,3,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        grid: [],

        // Pac-Coulomb (Carga de prueba)
        pac: {
            x: 9, y: 13,
            dx: 0, dy: 0,
            reqDx: 0, reqDy: 0,
            speed: 0.088,
            charge: +1, // +1 = Protón (+e)
            mouthAngle: 0.2,
            mouthDir: 1
        },

        // 4 Iones Fantasmas (Cationes y Aniones)
        ghosts: [],

        // Modos y Estado
        level: 1,
        scoreEV: 0,
        lives: 3,
        dotsRemaining: 0,
        superTimer: 0, // Segundos restantes de Jaula Faraday
        coulombK: 1.0, // Constante de fuerza relativa
        isGameOver: false,
        isLevelClear: false,
        particles: [],
        keyListener: null,

        init(container) {
            container.innerHTML = `
                <div class="game-layout">
                    <!-- HUD Superior: Electrostática -->
                    <div class="game-hud-bar">
                        <div class="hud-pill">⚡ Carga Pac-Man: <strong id="pc-charge">+1e (Protón)</strong></div>
                        <div class="hud-pill">🔋 Energía: <strong id="pc-score">0 eV</strong></div>
                        <div class="hud-pill">🛡️ Vidas: <strong id="pc-lives">⚡⚡⚡</strong></div>
                        <div class="hud-pill">📡 Modo Jaula: <strong id="pc-mode">Aislante Normal</strong></div>
                        <div class="hud-pill">🎯 Nivel: <strong id="pc-level">1</strong></div>
                    </div>

                    <!-- Fila Cockpit: Canvas + D-Pad a la izquierda, Controles a la derecha -->
                    <div class="game-main-row">
                        <div class="game-stage-col">
                            <div class="game-canvas-wrap">
                                <canvas id="pacman-canvas"></canvas>
                            </div>

                            <!-- Barra de Telemetría Dinámica de Campos -->
                            <div class="game-telemetry-bar" id="pacman-telemetry">
                                <span>Campo Eléctrico ||E||: <strong id="pc-efield">0.0 N/C</strong></span>
                                <span>Fuerza Coulomb Fe: <strong id="pc-force">0.0 pN</strong></span>
                                <span>Potencial V(r): <strong id="pc-volt">0.0 V</strong></span>
                                <span>Electrones Libres: <strong id="pc-dots">0</strong></span>
                            </div>

                            <!-- Controles Arcade & D-Pad para Táctil y PC -->
                            <div class="arcade-controller-row">
                                <div class="arcade-dpad-grid">
                                    <div class="arcade-dpad-cell"></div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-pc-up" onclick="window.PacCoulombGame.setDirection(0, -1)" title="Arriba (W / ↑)">▲</button>
                                    </div>
                                    <div class="arcade-dpad-cell"></div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-pc-left" onclick="window.PacCoulombGame.setDirection(-1, 0)" title="Izquierda (A / ←)">◀</button>
                                    </div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-pc-down" onclick="window.PacCoulombGame.setDirection(0, 1)" title="Abajo (S / ↓)">▼</button>
                                    </div>
                                    <div class="arcade-dpad-cell">
                                        <button type="button" class="arcade-btn-dir" id="btn-pc-right" onclick="window.PacCoulombGame.setDirection(1, 0)" title="Derecha (D / →)">▶</button>
                                    </div>
                                </div>

                                <div class="arcade-action-wrap">
                                    <button type="button" class="arcade-btn-action pulsing" id="btn-pc-invert" onclick="window.PacCoulombGame.togglePolarity()" title="Invertir Signo de Polaridad (+/-)">
                                        🧲 Invertir Carga (ESPACIO)
                                    </button>
                                    <button type="button" class="arcade-btn-secondary" onclick="window.PacCoulombGame.resetLevel()">
                                        🔄 Reiniciar Nivel
                                    </button>
                                    <div class="arcade-key-hints">
                                        <span>Teclado:</span>
                                        <span class="arcade-key-badge">WASD</span>
                                        <span class="arcade-key-badge">Flechas</span>
                                        <span class="arcade-key-badge">Espacio</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Columna de Controles e Instrumentación Científica -->
                        <div class="game-controls-col">
                            <div class="game-controls-panel">
                                <div class="ctrl-group">
                                    <div class="ctrl-header-row">
                                        <label>⚡ Constante Coulomb ke: <strong id="lbl-pc-ke">1.0× (Normal)</strong></label>
                                        <span class="ctrl-badge">Permitividad ε₀</span>
                                    </div>
                                    <div class="slider-with-nudge">
                                        <button type="button" class="btn-nudge" onclick="window.PacCoulombGame.nudgeCoupling(-0.2)">−Débil</button>
                                        <input type="range" id="rng-pc-ke" min="0.4" max="2.0" step="0.1" value="1.0" class="game-slider" aria-label="Acoplamiento Coulomb">
                                        <button type="button" class="btn-nudge" onclick="window.PacCoulombGame.nudgeCoupling(+0.2)">+Fuerte</button>
                                    </div>
                                </div>

                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">👻 Espectro de Iones Fantasmas:</span>
                                    <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.78rem; font-family:monospace; background:rgba(0,0,0,0.3); padding:0.6rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#ef4444;">●</span> <span>Blinky (+2e, Catión Alfa): Repulsión homóloga</span></div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#ec4899;">●</span> <span>Pinky (-e, Anión Beta): Atracción culombiana</span></div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#06b6d4;">●</span> <span>Inky (-2e, Anión Gamma): Atracción doble (1/r²)</span></div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#f97316;">●</span> <span>Clyde (±e, Ion Delta): Polaridad oscilante</span></div>
                                    </div>
                                </div>

                                <div class="ctrl-group">
                                    <span class="ctrl-sublabel">🔋 Supercondensadores (Nodos Dieléctricos):</span>
                                    <p style="font-size:0.78rem; color:#94a3b8; margin:0; line-height:1.4;">
                                        Los 4 grandes nodos en las esquinas activan una <strong>Jaula de Faraday</strong> durante 9 segundos. Las cargas de los iones se polarizan en reversa, permitiendo que Pac-Coulomb los absorba para ganar hasta 1600 eV.
                                    </p>
                                </div>
                            </div>

                            <!-- Ficha Didáctica de Electrostática -->
                            <div class="game-physics-note">
                                <span class="note-icon">⚡</span>
                                <div class="note-content">
                                    <strong>Ley de Coulomb &amp; Blindaje Electrostático</strong>
                                    La fuerza entre dos cargas es inversamente proporcional al cuadrado de la distancia: <code>F = k·(q₁·q₂)/r²</code>. Cargas del mismo signo se repelen; cargas opuestas se atraen. Las líneas de campo eléctrico en el fondo del laberinto revelan el gradiente de potencial <code>E = -∇V</code> que guía a los iones.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.canvas = document.getElementById('pacman-canvas');
            this.resize();
            this.bindEvents();
            this.resetGame();
            this.loop();
        },

        resize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const w = Math.max(320, Math.floor(rect.width));
            const h = Math.min(440, Math.max(280, Math.floor(w * 0.76)));
            const s = setupRetinaCanvas(this.canvas, w, h);
            this.ctx = s.ctx;
            this.w = w;
            this.h = h;
            this.tileW = w / this.cols;
            this.tileH = h / this.rows;
        },

        bindEvents() {
            const rngKe = document.getElementById('rng-pc-ke');
            if (rngKe) {
                rngKe.addEventListener('input', (e) => {
                    this.coulombK = parseFloat(e.target.value);
                    const lbl = document.getElementById('lbl-pc-ke');
                    if (lbl) lbl.textContent = `${this.coulombK.toFixed(1)}× (${this.coulombK > 1 ? 'Fuerte' : (this.coulombK < 1 ? 'Débil' : 'Normal')})`;
                    playSound('click');
                });
            }

            this.keyListener = (e) => {
                const key = e.key;
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
                    e.preventDefault();
                }
                if (key === 'ArrowUp' || key === 'w' || key === 'W') this.setDirection(0, -1);
                else if (key === 'ArrowDown' || key === 's' || key === 'S') this.setDirection(0, 1);
                else if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.setDirection(-1, 0);
                else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.setDirection(1, 0);
                else if (key === ' ') this.togglePolarity();
                else if (key === 'r' || key === 'R') this.resetLevel();
            };
            window.addEventListener('keydown', this.keyListener);
        },

        setDirection(dx, dy) {
            this.pac.reqDx = dx;
            this.pac.reqDy = dy;
            playSound('click');
        },

        togglePolarity() {
            this.pac.charge = (this.pac.charge === +1) ? -1 : +1;
            playSound('tunnel');
            this.spawnParticles((this.pac.x + 0.5) * this.tileW, (this.pac.y + 0.5) * this.tileH, this.pac.charge > 0 ? '#38bdf8' : '#ec4899', 14);
            const elCh = document.getElementById('pc-charge');
            if (elCh) {
                elCh.textContent = this.pac.charge > 0 ? '+1e (Protón)' : '−1e (Electrón)';
                elCh.style.color = this.pac.charge > 0 ? '#38bdf8' : '#ec4899';
            }
        },

        nudgeCoupling(delta) {
            this.coulombK = Math.max(0.4, Math.min(2.0, +(this.coulombK + delta).toFixed(1)));
            const rng = document.getElementById('rng-pc-ke');
            const lbl = document.getElementById('lbl-pc-ke');
            if (rng) rng.value = this.coulombK;
            if (lbl) lbl.textContent = `${this.coulombK.toFixed(1)}× (${this.coulombK > 1 ? 'Fuerte' : (this.coulombK < 1 ? 'Débil' : 'Normal')})`;
            playSound('click');
        },

        resetGame() {
            this.level = 1;
            this.scoreEV = 0;
            this.lives = 3;
            this.resetLevel();
        },

        resetLevel() {
            this.isGameOver = false;
            this.isLevelClear = false;
            this.superTimer = 0;
            this.particles = [];

            // Copiar mapa y contar electrones
            this.grid = this.mazeLayout.map(row => [...row]);
            this.dotsRemaining = 0;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.grid[r][c] === 0 || this.grid[r][c] === 3) {
                        this.dotsRemaining++;
                    }
                }
            }

            // Posición inicial de Pac-Coulomb
            this.pac.x = 9;
            this.pac.y = 13;
            this.pac.dx = 0;
            this.pac.dy = 0;
            this.pac.reqDx = 0;
            this.pac.reqDy = 0;
            this.pac.charge = +1;

            // Inicializar los 4 Iones Fantasmas
            this.ghosts = [
                { id: 'blinky', name: 'Alfa', charge: +2, color: '#ef4444', x: 9, y: 7, dx: 0, dy: -1, eaten: false },
                { id: 'pinky',  name: 'Beta',  charge: -1, color: '#ec4899', x: 8, y: 9, dx: -1, dy: 0, eaten: false },
                { id: 'inky',   name: 'Gamma', charge: -2, color: '#06b6d4', x: 9, y: 9, dx: 0, dy: -1, eaten: false },
                { id: 'clyde',  name: 'Delta', charge: +1, color: '#f97316', x: 10, y: 9, dx: 1, dy: 0, eaten: false, oscTimer: 0 }
            ];

            this.updateTelemetry();
            playSound('hit');
        },

        spawnParticles(x, y, color, count = 10) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.0 + Math.random() * 2.5;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    life: 1.0,
                    decay: 0.03 + Math.random() * 0.03,
                    size: 2.2 + Math.random() * 2.2
                });
            }
        },

        isWall(tileX, tileY) {
            if (tileX < 0 || tileX >= this.cols) return false; // Túneles laterales
            if (tileY < 0 || tileY >= this.rows) return true;
            return this.grid[tileY][tileX] === 1;
        },

        update(dt) {
            if (this.isGameOver || this.isLevelClear) return;

            // Timer de Jaula de Faraday (Supercondensador)
            if (this.superTimer > 0) {
                this.superTimer -= dt;
                if (this.superTimer <= 0) {
                    this.superTimer = 0;
                    playSound('spark');
                }
            }

            // Movimiento suave de Pac-Coulomb
            const p = this.pac;
            p.mouthAngle += 0.08 * p.mouthDir;
            if (p.mouthAngle > 0.45 || p.mouthAngle < 0.05) p.mouthDir *= -1;

            // Intentar girar en la dirección solicitada
            const snapThreshold = p.speed * 0.95;
            const rx = Math.round(p.x);
            const ry = Math.round(p.y);
            const atCenter = Math.abs(p.x - rx) < snapThreshold && Math.abs(p.y - ry) < snapThreshold;

            if (p.reqDx !== 0 || p.reqDy !== 0) {
                // Giros opuestos inmediatos (ej: iba derecha y presiona izquierda)
                if (p.reqDx === -p.dx && p.reqDx !== 0) {
                    p.dx = p.reqDx; p.dy = 0;
                } else if (p.reqDy === -p.dy && p.reqDy !== 0) {
                    p.dy = p.reqDy; p.dx = 0;
                } else if (atCenter) {
                    const nextX = rx + p.reqDx;
                    const nextY = ry + p.reqDy;
                    if (!this.isWall(nextX, nextY)) {
                        p.x = rx;
                        p.y = ry;
                        p.dx = p.reqDx;
                        p.dy = p.reqDy;
                    }
                }
            }

            // Comprobar pared frontal
            if (atCenter && (p.dx !== 0 || p.dy !== 0)) {
                const frontX = rx + p.dx;
                const frontY = ry + p.dy;
                if (this.isWall(frontX, frontY)) {
                    p.x = rx;
                    p.y = ry;
                    p.dx = 0;
                    p.dy = 0;
                }
            }

            p.x += p.dx * p.speed;
            p.y += p.dy * p.speed;

            // Túneles laterales de transporte de carga
            if (p.x < -0.5) p.x = this.cols - 0.5;
            if (p.x > this.cols - 0.5) p.x = -0.5;

            // Recolección de electrones y supercondensadores
            const curTileX = Math.round(p.x);
            const curTileY = Math.round(p.y);
            if (curTileX >= 0 && curTileX < this.cols && curTileY >= 0 && curTileY < this.rows) {
                const cell = this.grid[curTileY][curTileX];
                if (cell === 0) {
                    // Electrón (-e) consumido
                    this.grid[curTileY][curTileX] = 2;
                    this.scoreEV += 10;
                    this.dotsRemaining--;
                    playSound('eat');
                } else if (cell === 3) {
                    // Supercondensador activado (Jaula de Faraday)
                    this.grid[curTileY][curTileX] = 2;
                    this.scoreEV += 50;
                    this.dotsRemaining--;
                    this.superTimer = 9.0;
                    playSound('powerup');
                    this.spawnParticles((curTileX + 0.5) * this.tileW, (curTileY + 0.5) * this.tileH, '#a855f7', 16);
                }

                if (this.dotsRemaining <= 0) {
                    this.isLevelClear = true;
                    this.level++;
                    playSound('powerup');
                    setTimeout(() => this.resetLevel(), 1800);
                }
            }

            // Actualización de los 4 Iones Fantasmas (Coulomb AI)
            const ghostSpeed = (this.superTimer > 0 ? 0.048 : 0.072) * (1 + (this.level - 1) * 0.06);

            for (const g of this.ghosts) {
                // Oscilación de polaridad de Clyde (Delta)
                if (g.id === 'clyde') {
                    g.oscTimer = (g.oscTimer || 0) + dt;
                    if (g.oscTimer > 7.0) {
                        g.oscTimer = 0;
                        g.charge *= -1;
                        this.spawnParticles((g.x + 0.5) * this.tileW, (g.y + 0.5) * this.tileH, '#f97316', 8);
                    }
                }

                const gx = Math.round(g.x);
                const gy = Math.round(g.y);
                const gAtCenter = Math.abs(g.x - gx) < ghostSpeed * 0.95 && Math.abs(g.y - gy) < ghostSpeed * 0.95;

                if (gAtCenter) {
                    g.x = gx;
                    g.y = gy;

                    // Posibles direcciones sin chocar con paredes
                    const possibleDirs = [
                        { dx: 0, dy: -1 },
                        { dx: 0, dy: 1 },
                        { dx: -1, dy: 0 },
                        { dx: 1, dy: 0 }
                    ].filter(d => {
                        // Evitar retroceso instantáneo estricto salvo callejón sin salida
                        if (d.dx === -g.dx && d.dy === -g.dy) return false;
                        return !this.isWall(gx + d.dx, gy + d.dy);
                    });

                    const validDirs = possibleDirs.length > 0 ? possibleDirs : [{ dx: -g.dx, dy: -g.dy }];

                    // Cálculo de objetivo guiado por Fuerza de Coulomb
                    let targetX = p.x;
                    let targetY = p.y;

                    if (this.superTimer > 0) {
                        // En Jaula de Faraday huyen a las esquinas
                        targetX = (g.x > this.cols * 0.5) ? this.cols - 1 : 0;
                        targetY = (g.y > this.rows * 0.5) ? this.rows - 1 : 0;
                    } else {
                        // Ley de Coulomb: cargas del mismo signo se repelen, opuestas se atraen
                        const sameSign = (g.charge * p.charge) > 0;
                        if (sameSign) {
                            // Repulsión: busca rodear a distancia de 4 tiles
                            targetX = p.x + p.dx * 3;
                            targetY = p.y + p.dy * 3;
                        } else {
                            // Atracción culombiana directa hacia Pac-Coulomb
                            targetX = p.x;
                            targetY = p.y;
                        }
                    }

                    // Elegir la dirección que minimice la distancia euclídea al objetivo
                    let bestDir = validDirs[0];
                    let bestDist = 999999;
                    for (const d of validDirs) {
                        const dist = Math.hypot((gx + d.dx) - targetX, (gy + d.dy) - targetY);
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = d;
                        }
                    }

                    g.dx = bestDir.dx;
                    g.dy = bestDir.dy;
                }

                g.x += g.dx * ghostSpeed;
                g.y += g.dy * ghostSpeed;

                if (g.x < -0.5) g.x = this.cols - 0.5;
                if (g.x > this.cols - 0.5) g.x = -0.5;

                // Colisión Pac-Man <-> Ion Fantasma
                const colDist = Math.hypot(p.x - g.x, p.y - g.y);
                if (colDist < 0.68) {
                    if (this.superTimer > 0 && !g.eaten) {
                        // Neutralización electrostática del ion
                        g.eaten = true;
                        g.x = 9; g.y = 8; g.dx = 0; g.dy = -1;
                        this.scoreEV += 400;
                        playSound('spark');
                        this.spawnParticles((p.x + 0.5) * this.tileW, (p.y + 0.5) * this.tileH, g.color, 20);
                    } else if (!g.eaten) {
                        // Ruptura Dieléctrica: Pérdida de vida
                        this.lives--;
                        playSound('gameover');
                        this.spawnParticles((p.x + 0.5) * this.tileW, (p.y + 0.5) * this.tileH, '#ef4444', 24);

                        if (this.lives <= 0) {
                            this.isGameOver = true;
                        } else {
                            // Reposicionar
                            p.x = 9; p.y = 13; p.dx = 0; p.dy = 0; p.reqDx = 0; p.reqDy = 0;
                            this.ghosts.forEach(gh => { gh.x = 9; gh.y = 8; });
                        }
                        break;
                    }
                }
            }

            // Partículas
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const pt = this.particles[i];
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life -= pt.decay;
                if (pt.life <= 0) this.particles.splice(i, 1);
            }

            this.updateTelemetry();
        },

        updateTelemetry() {
            // Calcular campo eléctrico y fuerza resultante sobre Pac-Coulomb
            let Ex = 0;
            let Ey = 0;
            let netF = 0;

            for (const g of this.ghosts) {
                const dx = (this.pac.x - g.x);
                const dy = (this.pac.y - g.y);
                const r2 = Math.max(1.2, dx * dx + dy * dy);
                const r = Math.sqrt(r2);
                const chargeProd = g.charge * this.pac.charge;

                // F = ke * q1 * q2 / r^2
                const fVal = this.coulombK * (chargeProd / r2);
                netF += Math.abs(fVal);
                Ex += (g.charge / r2) * (dx / r);
                Ey += (g.charge / r2) * (dy / r);
            }

            const totalE = (Math.sqrt(Ex * Ex + Ey * Ey) * 4.2).toFixed(1);
            const totalF = (netF * 3.8).toFixed(1);
            const voltV = (netF * 1.5).toFixed(1);

            const elScr = document.getElementById('pc-score');
            const elLiv = document.getElementById('pc-lives');
            const elMod = document.getElementById('pc-mode');
            const elLvl = document.getElementById('pc-level');
            const elDot = document.getElementById('pc-dots');

            if (elScr) elScr.textContent = `${this.scoreEV} eV`;
            if (elLiv) elLiv.textContent = '⚡'.repeat(Math.max(0, this.lives)) || 'AGOTADAS';
            if (elMod) {
                if (this.superTimer > 0) {
                    elMod.textContent = `FARADAY (${this.superTimer.toFixed(1)}s)`;
                    elMod.style.color = '#c084fc';
                } else {
                    elMod.textContent = 'Aislante Normal';
                    elMod.style.color = '#38bdf8';
                }
            }
            if (elLvl) elLvl.textContent = `${this.level}`;
            if (elDot) elDot.textContent = `${this.dotsRemaining}`;

            const elE = document.getElementById('pc-efield');
            const elF = document.getElementById('pc-force');
            const elV = document.getElementById('pc-volt');

            if (elE) elE.textContent = `${totalE} N/C`;
            if (elF) elF.textContent = `${totalF} pN`;
            if (elV) elV.textContent = `${voltV} V`;
        },

        draw() {
            const ctx = this.ctx;
            if (!ctx) return;

            // Fondo profundo
            ctx.fillStyle = '#050814';
            ctx.fillRect(0, 0, this.w, this.h);

            // 1. Dibujar líneas de campo electrostático tenue en corredores
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.lineWidth = 1;
            for (let r = 1; r < this.rows - 1; r += 2) {
                for (let c = 1; c < this.cols - 1; c += 2) {
                    if (this.grid[r][c] !== 1) {
                        const px = (c + 0.5) * this.tileW;
                        const py = (r + 0.5) * this.tileH;
                        // Pequeño vector que apunta hacia el ion más cercano
                        const g = this.ghosts[0];
                        const angle = Math.atan2(g.y - r, g.x - c);
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px + Math.cos(angle) * 6, py + Math.sin(angle) * 6);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();

            // 2. Dibujar paredes dieléctricas y electrones del laberinto
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const x = c * this.tileW;
                    const y = r * this.tileH;
                    const cell = this.grid[r][c];

                    if (cell === 1) {
                        // Pared aislante dieléctrica
                        ctx.fillStyle = '#0f172a';
                        ctx.fillRect(x + 1, y + 1, this.tileW - 2, this.tileH - 2);
                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(x + 1, y + 1, this.tileW - 2, this.tileH - 2);
                    } else if (cell === 0) {
                        // Electrón (-e)
                        ctx.fillStyle = '#38bdf8';
                        ctx.shadowColor = '#38bdf8';
                        ctx.shadowBlur = 4;
                        ctx.beginPath();
                        ctx.arc(x + this.tileW * 0.5, y + this.tileH * 0.5, 3.2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    } else if (cell === 3) {
                        // Supercondensador / Nodo Dieléctrico
                        const pulse = Math.sin(performance.now() * 0.008) * 1.5;
                        ctx.fillStyle = '#a855f7';
                        ctx.shadowColor = '#c084fc';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(x + this.tileW * 0.5, y + this.tileH * 0.5, 6.5 + pulse, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // 3. Arcos de Interacción de Coulomb (entre Pac-Coulomb y Fantasmas cercanos)
            ctx.save();
            for (const g of this.ghosts) {
                const dist = Math.hypot(this.pac.x - g.x, this.pac.y - g.y);
                if (dist < 4.5 && !g.eaten) {
                    const px = (this.pac.x + 0.5) * this.tileW;
                    const py = (this.pac.y + 0.5) * this.tileH;
                    const gx = (g.x + 0.5) * this.tileW;
                    const gy = (g.y + 0.5) * this.tileH;

                    const sameSign = (g.charge * this.pac.charge) > 0;
                    ctx.strokeStyle = sameSign ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.5)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(gx, gy);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // 4. Dibujar Iones Fantasmas
            for (const g of this.ghosts) {
                const gx = (g.x + 0.5) * this.tileW;
                const gy = (g.y + 0.5) * this.tileH;
                const r = this.tileW * 0.42;

                ctx.save();
                const isVulnerable = (this.superTimer > 0 && !g.eaten);
                const gColor = isVulnerable ? '#3b82f6' : g.color;

                ctx.fillStyle = gColor;
                ctx.shadowColor = gColor;
                ctx.shadowBlur = isVulnerable ? 14 : 8;

                // Cúpula superior
                ctx.beginPath();
                ctx.arc(gx, gy - r * 0.2, r, Math.PI, 0, false);
                // Falda inferior ondulada
                ctx.lineTo(gx + r, gy + r);
                ctx.lineTo(gx + r * 0.5, gy + r * 0.6);
                ctx.lineTo(gx, gy + r);
                ctx.lineTo(gx - r * 0.5, gy + r * 0.6);
                ctx.lineTo(gx - r, gy + r);
                ctx.closePath();
                ctx.fill();

                // Ojos indicadores de dirección
                ctx.fillStyle = '#ffffff';
                const eyeXOff = (g.dx || 0) * 3;
                const eyeYOff = (g.dy || 0) * 3;
                ctx.beginPath();
                ctx.arc(gx - 4 + eyeXOff, gy - 3 + eyeYOff, 3.2, 0, Math.PI * 2);
                ctx.arc(gx + 4 + eyeXOff, gy - 3 + eyeYOff, 3.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(gx - 4 + eyeXOff * 1.3, gy - 3 + eyeYOff * 1.3, 1.8, 0, Math.PI * 2);
                ctx.arc(gx + 4 + eyeXOff * 1.3, gy - 3 + eyeYOff * 1.3, 1.8, 0, Math.PI * 2);
                ctx.fill();

                // Placa de carga electrostática sobre el ion
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(g.charge > 0 ? `+${g.charge}` : `${g.charge}`, gx, gy - r - 3);

                ctx.restore();
            }

            // 5. Dibujar Pac-Coulomb (Carga de Prueba)
            const px = (this.pac.x + 0.5) * this.tileW;
            const py = (this.pac.y + 0.5) * this.tileH;
            const pr = this.tileW * 0.44;

            ctx.save();
            ctx.fillStyle = this.pac.charge > 0 ? '#facc15' : '#ec4899';
            ctx.shadowColor = this.pac.charge > 0 ? '#facc15' : '#ec4899';
            ctx.shadowBlur = 12;

            // Determinar ángulo de orientación según dirección
            let baseAngle = 0;
            if (this.pac.dx === 1) baseAngle = 0;
            else if (this.pac.dx === -1) baseAngle = Math.PI;
            else if (this.pac.dy === 1) baseAngle = Math.PI * 0.5;
            else if (this.pac.dy === -1) baseAngle = Math.PI * 1.5;

            const mouth = this.pac.mouthAngle;
            ctx.beginPath();
            ctx.arc(px, py, pr, baseAngle + mouth, baseAngle + Math.PI * 2 - mouth, false);
            ctx.lineTo(px, py);
            ctx.closePath();
            ctx.fill();

            // Símbolo de carga al centro (+ o -)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.pac.charge > 0 ? '+' : '−', px, py);
            ctx.restore();

            // 6. Dibujar partículas
            for (const pt of this.particles) {
                ctx.save();
                ctx.globalAlpha = pt.life;
                ctx.fillStyle = pt.color;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 7. Carteles de fin de partida
            if (this.isGameOver) {
                ctx.fillStyle = 'rgba(5, 8, 20, 0.85)';
                ctx.fillRect(0, 0, this.w, this.h);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 22px system-ui, sans-serif';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 12;
                ctx.fillText('⚡ RUPTURA DIELÉCTRICA (GAME OVER)', this.w * 0.5, this.h * 0.44);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '14px system-ui, sans-serif';
                ctx.fillText(`Energía final recolectada: ${this.scoreEV} eV | Nivel ${this.level}`, this.w * 0.5, this.h * 0.54);

                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 13px system-ui, sans-serif';
                ctx.fillText('Presiona [R] o "Reiniciar Nivel" para intentar de nuevo', this.w * 0.5, this.h * 0.65);
            } else if (this.isLevelClear) {
                ctx.fillStyle = 'rgba(5, 8, 20, 0.78)';
                ctx.fillRect(0, 0, this.w, this.h);

                ctx.textAlign = 'center';
                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 22px system-ui, sans-serif';
                ctx.shadowColor = '#10b981';
                ctx.shadowBlur = 12;
                ctx.fillText('🎉 ¡CANAL COMPLETAMENTE DESCARGADO!', this.w * 0.5, this.h * 0.45);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '14px system-ui, sans-serif';
                ctx.fillText(`Avanzando al Nivel ${this.level}...`, this.w * 0.5, this.h * 0.55);
            }
        },

        loop() {
            const now = performance.now();
            const dt = Math.min(0.1, (now - (this.lastFrameTime || now)) / 1000);
            this.lastFrameTime = now;

            this.update(dt);
            this.draw();
            this.animId = requestAnimationFrame(() => this.loop());
        },

        destroy() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.animId = null;
            if (this.keyListener) {
                window.removeEventListener('keydown', this.keyListener);
                this.keyListener = null;
            }
        }
    };

    // Public Switcher
    window.switchPhysicsGame = function(gameId) {
        if (currentGame === 'cannon') CannonGame.destroy();
        else if (currentGame === 'orbit') OrbitGame.destroy();
        else if (currentGame === 'circuit') CircuitGame.destroy();
        else if (currentGame === 'snake') QuantumSnakeGame.destroy();
        else if (currentGame === 'pacman') PacCoulombGame.destroy();

        currentGame = gameId;
        playSound('click');

        document.querySelectorAll('.game-tab-btn').forEach(b => b.classList.remove('active'));
        const activeTab = document.getElementById(`tab-game-${gameId}`);
        if (activeTab) activeTab.classList.add('active');

        const arena = document.getElementById('game-arena-card');
        if (!arena) return;

        if (gameId === 'cannon') CannonGame.init(arena);
        else if (gameId === 'orbit') OrbitGame.init(arena);
        else if (gameId === 'circuit') CircuitGame.init(arena);
        else if (gameId === 'snake') QuantumSnakeGame.init(arena);
        else if (gameId === 'pacman') PacCoulombGame.init(arena);
    };

    window.CannonGame = CannonGame;
    window.OrbitGame = OrbitGame;
    window.CircuitGame = CircuitGame;
    window.QuantumSnakeGame = QuantumSnakeGame;
    window.PacCoulombGame = PacCoulombGame;

    // Auto-init when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const arena = document.getElementById('game-arena-card');
        if (arena) {
            window.switchPhysicsGame('cannon');
        }
    });

    window.addEventListener('resize', () => {
        if (currentGame === 'cannon') CannonGame.resize();
        else if (currentGame === 'orbit') OrbitGame.resize();
        else if (currentGame === 'circuit') CircuitGame.resize();
        else if (currentGame === 'snake') QuantumSnakeGame.resize();
        else if (currentGame === 'pacman') PacCoulombGame.resize();
    });
})();
