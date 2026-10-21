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

                            <!-- Barra de Telemetría Dinámica (FUERA del canvas para no tapar el cañón ni el blanco) -->
                            <div class="game-telemetry-bar" id="cannon-telemetry">
                                <span>📐 θ = <strong id="t-angle">45°</strong></span>
                                <span>🚀 v₀ = <strong id="t-v0">38 m/s</strong></span>
                                <span>⏱️ T_vuelo = <strong id="t-time">---</strong></span>
                                <span>⛰️ H_max = <strong id="t-hmax">---</strong></span>
                                <span>🎯 R_teórico = <strong id="t-range">---</strong></span>
                            </div>

                            <!-- Botones de Acción Rápida -->
                            <div class="game-quick-fire-bar">
                                <button type="button" class="btn-game-primary btn-fire-large" id="btn-fire" onclick="window.CannonGame.fire()">
                                    🚀 ¡DISPARAR CAÑÓN!
                                </button>
                                <button type="button" class="btn-game-secondary" onclick="window.CannonGame.resetTarget()" title="Generar un nuevo objetivo a diferente distancia">
                                    🎯 Nuevo Blanco
                                </button>
                            </div>
                        </div>

                        <!-- Columna de Controles e Instrumentación -->
                        <div class="game-controls-col">
                            <div class="game-controls-panel">
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
                            <strong>Ecuaciones de Cinemática en 2D:</strong>
                            <p>
                                Posición horizontal: <code>x(t) = v₀·cos(θ)·t + ½·a_viento·t²</code> &nbsp;|&nbsp;
                                Posición vertical: <code>y(t) = v₀·sin(θ)·t - ½·g·t²</code> &nbsp;|&nbsp;
                                Alcance teórico ideal: <code>R = (v₀²·sin(2θ)) / g</code>
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
        },

        bindEvents() {
            const rngA = document.getElementById('rng-angle');
            const rngV = document.getElementById('rng-v0');

            if (rngA) {
                rngA.addEventListener('input', (e) => {
                    this.angle = parseInt(e.target.value, 10);
                    document.getElementById('lbl-angle').textContent = this.angle + '°';
                    document.getElementById('t-angle').textContent = this.angle + '°';
                    this.updateTelemetry();
                });
            }

            if (rngV) {
                rngV.addEventListener('input', (e) => {
                    this.v0 = parseInt(e.target.value, 10);
                    document.getElementById('lbl-v0').textContent = this.v0 + ' m/s';
                    document.getElementById('t-v0').textContent = this.v0 + ' m/s';
                    this.updateTelemetry();
                });
            }

            // Touch drag on canvas to aim
            const onPointerMove = (clientX, clientY) => {
                if (!this.isAiming) return;
                const r = this.canvas.getBoundingClientRect();
                const x = clientX - r.left;
                const y = clientY - r.top;
                const originX = 40;
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
                    document.getElementById('lbl-angle').textContent = clampedAng + '°';
                    document.getElementById('t-angle').textContent = clampedAng + '°';
                    document.getElementById('lbl-v0').textContent = v + ' m/s';
                    document.getElementById('t-v0').textContent = v + ' m/s';
                    this.updateTelemetry();
                }
            };

            this.canvas.addEventListener('mousedown', (e) => { this.isAiming = true; onPointerMove(e.clientX, e.clientY); });
            window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', () => { this.isAiming = false; });

            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches[0]) {
                    this.isAiming = true;
                    onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });

            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) {
                    onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });

            this.canvas.addEventListener('touchend', () => { this.isAiming = false; });
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
            const minX = Math.floor(this.w * 0.45);
            const maxX = Math.floor(this.w * 0.90);
            this.target.x = minX + Math.random() * (maxX - minX);
            this.target.minY = Math.floor(this.h * 0.25);
            this.target.maxY = Math.floor(this.h * 0.75);
            this.target.y = this.target.minY + Math.random() * (this.target.maxY - this.target.minY);
            this.target.r = Math.max(16, Math.min(26, Math.floor(this.w * 0.035)));
            this.target.vy = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.6);

            // Random wind: between -10 and +10 m/s
            this.wind = Math.round((Math.random() - 0.5) * 16);
            const windEl = document.getElementById('c-wind');
            if (windEl) {
                windEl.textContent = (this.wind > 0 ? `+${this.wind}` : `${this.wind}`) + ' m/s';
                windEl.style.color = this.wind > 0 ? '#34d399' : (this.wind < 0 ? '#f87171' : '#94a3b8');
            }
        },

        updateTelemetry() {
            const rad = (this.angle * Math.PI) / 180;
            const g = this.gravities[this.gravityKey].g;
            const vy = this.v0 * Math.sin(rad);
            const tFlight = (2 * vy) / g;
            const hMax = (vy * vy) / (2 * g);
            const rIdeal = (this.v0 * this.v0 * Math.sin(2 * rad)) / g;

            const tTime = document.getElementById('t-time');
            const tHmax = document.getElementById('t-hmax');
            const tRange = document.getElementById('t-range');

            if (tTime) tTime.textContent = tFlight.toFixed(2) + ' s';
            if (tHmax) tHmax.textContent = hMax.toFixed(1) + ' m';
            if (tRange) tRange.textContent = rIdeal.toFixed(1) + ' m';
        },

        fire() {
            if (this.projectile) return; // Ya hay uno en vuelo
            playSound('fire');
            this.shots++;

            const rad = (this.angle * Math.PI) / 180;
            const scale = this.w / 280; // Escala mundo -> pantalla
            const vx = this.v0 * Math.cos(rad) * scale * 0.28;
            const vy = -this.v0 * Math.sin(rad) * scale * 0.28;

            this.projectile = {
                x: 40 + Math.cos(rad) * 32,
                y: (this.h - 35) - Math.sin(rad) * 32,
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
            let simX = 40 + Math.cos(rad) * 32;
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
            // Floating target altitude indicator
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`h=${Math.round(groundY - this.target.y)}m`, 0, -this.target.r - 6);
            ctx.restore();

            // Draw Cannon Base & Barrel
            ctx.save();
            ctx.translate(40, groundY);
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

    // Public Switcher
    window.switchPhysicsGame = function(gameId) {
        if (currentGame === 'cannon') CannonGame.destroy();
        else if (currentGame === 'orbit') OrbitGame.destroy();
        else if (currentGame === 'circuit') CircuitGame.destroy();

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
    };

    window.CannonGame = CannonGame;
    window.OrbitGame = OrbitGame;
    window.CircuitGame = CircuitGame;

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
    });
})();
