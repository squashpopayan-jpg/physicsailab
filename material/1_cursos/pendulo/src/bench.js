/* ==========================================================================
   INTERFAZ Y RENDERIZADO DEL BANCO DE PÉNDULO (CANVAS 2D & INTERACCIÓN)
   Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca
   ========================================================================== */

(function (window) {
  'use strict';

  class PenduloBench {
    constructor(canvasId, options = {}) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');

      this.options = Object.assign({
        onStateChange: () => {},
        onLapComplete: () => {}
      }, options);

      // Estado físico actual
      this.L = 0.80; // metros (0.20m a 1.50m)
      this.m = 0.050; // kg (50g)
      this.g = 9.776; // m/s² (Popayán)
      this.theta0 = 10 * (Math.PI / 180); // 10 grados en rad
      this.theta = this.theta0;
      this.omega = 0;
      this.amort = 0.002; // amortiguamiento aire

      // Estado de simulación
      this.running = false;
      this.paused = false;
      this.timeSpeed = 1.0; // 1.0 = tiempo real, 0.5 = slow-mo
      this.showVectors = false;
      this.showPhotogate = true;
      this.showProtractor = true;
      this.showCenterOfMass = true;

      // Fotocompuerta y conteo de oscilaciones
      this.oscillationCount = 0;
      this.prevTheta = this.theta;
      this.direction = 0; // +1 o -1
      this.passCount = 0;
      this.lastZeroCrossTime = null;
      this.photogateTriggered = false;
      this.photogateLedTimer = 0;

      // Cronómetro manual integrado
      this.stopwatchRunning = false;
      this.stopwatchStartTime = 0;
      this.stopwatchElapsed = 0;
      this.stopwatchLaps = [];
      this.stopwatchAnimId = null;

      // Interacción de arrastre
      this.isDragging = false;
      this.pivotX = 0;
      this.pivotY = 70;
      this.pixelsPerMeter = 280;

      // Loop de animación
      this.lastTimestamp = performance.now();
      this.initEvents();
      this.resize();
      this.animate(this.lastTimestamp);
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.resetTransform();
      this.ctx.scale(dpr, dpr);
      this.width = rect.width;
      this.height = rect.height;
      this.pivotX = this.width / 2;
      this.pivotY = 65;

      // Ajustar escala visual de metros a píxeles según altura del canvas
      const maxVisualLength = this.height - 130;
      this.pixelsPerMeter = maxVisualLength / 1.50; // máximo 1.5m
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize());

      // Arrastre con ratón o touch
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const bobPos = () => {
        const visualLen = this.L * this.pixelsPerMeter;
        return {
          x: this.pivotX + Math.sin(this.theta) * visualLen,
          y: this.pivotY + Math.cos(this.theta) * visualLen
        };
      };

      const isNearBob = (pos) => {
        const b = bobPos();
        const dist = Math.hypot(pos.x - b.x, pos.y - b.y);
        return dist < 36; // radio de tolerancia de toque
      };

      const startDrag = (e) => {
        const pos = getPos(e);
        if (isNearBob(pos) || pos.y > this.pivotY) {
          this.isDragging = true;
          this.running = false;
          this.omega = 0;
          this.updateAngleFromPos(pos);
          if (e.cancelable) e.preventDefault();
        }
      };

      const moveDrag = (e) => {
        if (!this.isDragging) return;
        const pos = getPos(e);
        this.updateAngleFromPos(pos);
        if (e.cancelable) e.preventDefault();
      };

      const endDrag = () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.theta0 = this.theta;
          this.running = true;
          this.resetOscillationCounter();
        }
      };

      this.canvas.addEventListener('mousedown', startDrag);
      window.addEventListener('mousemove', moveDrag);
      window.addEventListener('mouseup', endDrag);

      this.canvas.addEventListener('touchstart', startDrag, { passive: false });
      window.addEventListener('touchmove', moveDrag, { passive: false });
      window.addEventListener('touchend', endDrag);
    }

    updateAngleFromPos(pos) {
      const dx = pos.x - this.pivotX;
      const dy = pos.y - this.pivotY;
      let angle = Math.atan2(dx, dy);

      // Limitar ángulo máximo a ±60 grados para fidelidad experimental
      const maxAngle = 60 * (Math.PI / 180);
      angle = Math.max(-maxAngle, Math.min(maxAngle, angle));

      this.theta = angle;
      this.omega = 0;
      this.theta0 = angle;
      this.resetOscillationCounter();
      this.options.onStateChange(this.getState());
    }

    setParameters({ L, m, g, amort, theta0Deg }) {
      if (L !== undefined) this.L = Math.max(0.20, Math.min(1.50, L));
      if (m !== undefined) this.m = Math.max(0.01, Math.min(0.50, m));
      if (g !== undefined) this.g = Math.max(1.0, Math.min(30.0, g));
      if (amort !== undefined) this.amort = amort;
      if (theta0Deg !== undefined) {
        this.theta0 = theta0Deg * (Math.PI / 180);
        this.theta = this.theta0;
        this.omega = 0;
        this.resetOscillationCounter();
      }
      this.options.onStateChange(this.getState());
    }

    start() {
      this.running = true;
      this.paused = false;
      this.resetOscillationCounter();
    }

    pause() {
      this.paused = !this.paused;
    }

    reset() {
      this.running = false;
      this.paused = false;
      this.theta = this.theta0;
      this.omega = 0;
      this.resetOscillationCounter();
      this.stopwatchReset();
      this.options.onStateChange(this.getState());
    }

    resetOscillationCounter() {
      this.oscillationCount = 0;
      this.passCount = 0;
      this.prevTheta = this.theta;
      this.photogateTriggered = false;
    }

    // Cronómetro manual
    stopwatchStart() {
      if (!this.stopwatchRunning) {
        this.stopwatchRunning = true;
        this.stopwatchStartTime = performance.now() - this.stopwatchElapsed;
      }
    }

    stopwatchPause() {
      if (this.stopwatchRunning) {
        this.stopwatchRunning = false;
        this.stopwatchElapsed = performance.now() - this.stopwatchStartTime;
      }
    }

    stopwatchToggle() {
      if (this.stopwatchRunning) {
        this.stopwatchPause();
      } else {
        this.stopwatchStart();
      }
    }

    stopwatchLap() {
      if (this.stopwatchRunning || this.stopwatchElapsed > 0) {
        const currentMs = this.stopwatchRunning ? performance.now() - this.stopwatchStartTime : this.stopwatchElapsed;
        this.stopwatchLaps.push(currentMs);
        this.options.onLapComplete(this.stopwatchLaps);
      }
    }

    stopwatchReset() {
      this.stopwatchRunning = false;
      this.stopwatchStartTime = 0;
      this.stopwatchElapsed = 0;
      this.stopwatchLaps = [];
      this.options.onLapComplete([]);
    }

    getStopwatchTime() {
      return this.stopwatchRunning ? performance.now() - this.stopwatchStartTime : this.stopwatchElapsed;
    }

    getState() {
      const deg = this.theta * (180 / Math.PI);
      const T_teorico = window.PenduloEngine.calcularPeriodoTeorico(this.L, this.g, this.theta0);
      const energias = window.PenduloEngine.calcularEnergias(this.theta, this.omega, this.L, this.m, this.g);
      return {
        L: this.L,
        m: this.m,
        g: this.g,
        thetaDeg: deg,
        theta0Deg: this.theta0 * (180 / Math.PI),
        omega: this.omega,
        T_teorico,
        running: this.running,
        paused: this.paused,
        oscillationCount: this.oscillationCount,
        energias
      };
    }

    // Loop de física y dibujo
    animate(currentTimestamp) {
      const dtMs = currentTimestamp - this.lastTimestamp;
      this.lastTimestamp = currentTimestamp;

      // Limitar dt para evitar inestabilidad si la pestaña estuvo en segundo plano
      const dt = Math.min(dtMs / 1000, 0.05) * this.timeSpeed;

      if (this.running && !this.paused && !this.isDragging) {
        // Ejecutar RK4 con micro-pasos para precisión ultra-alta
        const subSteps = 6;
        const subDt = dt / subSteps;
        for (let i = 0; i < subSteps; i++) {
          const res = window.PenduloEngine.pasoRK4(
            this.theta,
            this.omega,
            this.L,
            this.m,
            this.g,
            this.amort,
            subDt
          );
          this.theta = res.theta;
          this.omega = res.omega;

          // Detección de paso por la posición de equilibrio (cero) para fotocompuerta
          if ((this.prevTheta < 0 && this.theta >= 0) || (this.prevTheta > 0 && this.theta <= 0)) {
            this.passCount++;
            this.photogateLedTimer = 0.15; // LED brilla 150ms

            // Una oscilación completa = 2 cruces por el cero en la misma dirección
            if (this.passCount % 2 === 0) {
              this.oscillationCount++;
              if (this.oscillationCount <= 10) {
                // Notificar al oyente si está activo
                this.options.onStateChange(this.getState());
              }
            }
          }
          this.prevTheta = this.theta;
        }
      }

      if (this.photogateLedTimer > 0) {
        this.photogateLedTimer -= dt;
      }

      this.render();
      requestAnimationFrame((t) => this.animate(t));
    }

    // Dibujo en Canvas
    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Fondo de cuadrícula milimétrica de laboratorio
      this.drawBackgroundGrid(ctx, w, h);

      // 2. Soporte universal con varilla vertical y base de fundición
      this.drawStand(ctx);

      // 3. Transportador semicircular de precisión
      if (this.showProtractor) {
        this.drawProtractor(ctx);
      }

      // 4. Fotocompuerta infrarroja en el punto más bajo
      if (this.showPhotogate) {
        this.drawPhotogate(ctx);
      }

      // 5. Cuerda, suspensión y esfera (bob)
      this.drawPendulum(ctx);

      // 6. Vectores físicos dinámicos (velocidad, fuerzas)
      if (this.showVectors) {
        this.drawVectors(ctx);
      }
    }

    drawBackgroundGrid(ctx, w, h) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawStand(ctx) {
      const px = this.pivotX;
      const py = this.pivotY;

      ctx.save();
      // Varilla vertical del soporte universal (lado izquierdo)
      const standX = px - 110;
      const baseW = 160;
      const baseY = this.height - 30;

      // Base pesada de hierro colado con relieve
      ctx.fillStyle = '#263445';
      ctx.strokeStyle = '#435569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(standX - baseW / 2, baseY, baseW, 20, [4, 4, 2, 2]);
      ctx.fill();
      ctx.stroke();

      // Varilla vertical cilíndrica de acero inoxidable con brillo
      const gradRod = ctx.createLinearGradient(standX - 7, 0, standX + 7, 0);
      gradRod.addColorStop(0, '#64748b');
      gradRod.addColorStop(0.5, '#cbd5e1');
      gradRod.addColorStop(1, '#475569');
      ctx.fillStyle = gradRod;
      ctx.fillRect(standX - 7, py - 20, 14, baseY - (py - 20));

      // Nuez doble de apriete
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.fillRect(standX - 12, py - 12, 24, 24);
      ctx.strokeRect(standX - 12, py - 12, 24, 24);

      // Brazo horizontal que se proyecta hasta el centro
      const gradArm = ctx.createLinearGradient(0, py - 5, 0, py + 5);
      gradArm.addColorStop(0, '#94a3b8');
      gradArm.addColorStop(0.5, '#e2e8f0');
      gradArm.addColorStop(1, '#64748b');
      ctx.fillStyle = gradArm;
      ctx.fillRect(standX, py - 5, px - standX + 16, 10);

      // Pinza o mordaza de ropa de madera / fijación que define el punto exacto de giro
      ctx.fillStyle = '#a16207';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.fillRect(px - 14, py - 10, 28, 14);
      ctx.strokeRect(px - 14, py - 10, 28, 14);

      // Tornillo de presión en el pivote
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawProtractor(ctx) {
      const px = this.pivotX;
      const py = this.pivotY;
      const radius = 95;

      ctx.save();
      ctx.translate(px, py);

      // Fondo semitransparente del transportador
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Arco desde 30° hasta 150° (es decir, ±60° respecto a la vertical)
      const startAngle = Math.PI / 2 - (65 * Math.PI) / 180;
      const endAngle = Math.PI / 2 + (65 * Math.PI) / 180;
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.stroke();

      // Graduaciones cada 5° y números cada 10°
      ctx.font = '9px var(--mono)';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let a = -60; a <= 60; a += 5) {
        const rad = Math.PI / 2 + (a * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const isTen = a % 10 === 0;
        const isTenDegZone = Math.abs(a) <= 10;
        const tickLen = isTen ? 12 : 7;

        ctx.strokeStyle = isTenDegZone ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isTen ? 1.5 : 1;

        ctx.beginPath();
        ctx.moveTo(cos * (radius - tickLen), sin * (radius - tickLen));
        ctx.lineTo(cos * radius, sin * radius);
        ctx.stroke();

        if (isTen && Math.abs(a) <= 50) {
          const textDist = radius - 22;
          ctx.fillStyle = isTenDegZone ? '#38bdf8' : '#64748b';
          ctx.fillText(`${Math.abs(a)}°`, cos * textDist, sin * textDist);
        }
      }

      // Zona resaltada recomendada para pequeñas oscilaciones (≤ 10°)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const a10_start = Math.PI / 2 - (10 * Math.PI) / 180;
      const a10_end = Math.PI / 2 + (10 * Math.PI) / 180;
      ctx.arc(0, 0, radius + 3, a10_start, a10_end);
      ctx.stroke();

      // Línea de referencia vertical central (0°)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, this.height - py - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    drawPhotogate(ctx) {
      const px = this.pivotX;
      const visualLen = this.L * this.pixelsPerMeter;
      const py = this.pivotY + visualLen;

      ctx.save();
      // Bloque en forma de U de la fotocompuerta infrarroja
      const uWidth = 54;
      const uHeight = 36;
      const gx = px - uWidth / 2;
      const gy = py - uHeight / 2;

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(gx, gy, uWidth, uHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Hueco central por donde cruza la esfera
      ctx.clearRect(px - 16, gy - 2, 32, uHeight + 4);

      // Haz infrarrojo (línea roja delgada)
      const isBeamBroken = Math.abs(this.theta * visualLen) < 14;
      ctx.strokeStyle = isBeamBroken ? '#ef4444' : 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - 16, py);
      ctx.lineTo(px + 16, py);
      ctx.stroke();

      // LED indicador óptico
      const ledColor = this.photogateLedTimer > 0 ? '#10b981' : '#64748b';
      ctx.fillStyle = ledColor;
      ctx.shadowColor = ledColor;
      ctx.shadowBlur = this.photogateLedTimer > 0 ? 10 : 0;
      ctx.beginPath();
      ctx.arc(gx + 10, gy + 10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Soporte metálico lateral de la fotocompuerta
      ctx.fillStyle = '#334155';
      ctx.fillRect(gx - 20, py - 4, 20, 8);

      ctx.restore();
    }

    drawPendulum(ctx) {
      const px = this.pivotX;
      const py = this.pivotY;
      const visualLen = this.L * this.pixelsPerMeter;

      const bobX = px + Math.sin(this.theta) * visualLen;
      const bobY = py + Math.cos(this.theta) * visualLen;

      ctx.save();

      // 1. Cuerda / Hilo de nailon con textura sutil
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // 2. Marcas métricas en la cuerda cada 10 cm si la longitud lo permite
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      const numTicks = Math.floor(this.L / 0.10);
      for (let i = 1; i <= numTicks; i++) {
        const frac = (i * 0.10) / this.L;
        const tx = px + Math.sin(this.theta) * visualLen * frac;
        const ty = py + Math.cos(this.theta) * visualLen * frac;
        const perpX = Math.cos(this.theta) * 3;
        const perpY = -Math.sin(this.theta) * 3;
        ctx.beginPath();
        ctx.moveTo(tx - perpX, ty - perpY);
        ctx.lineTo(tx + perpX, ty + perpY);
        ctx.stroke();
      }

      // 3. Gancho / Nudo en la plomada
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bobX, bobY - 14, 3, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Plomada / Esfera metálica con gradiente esférico 3D realista
      const bobRadius = 15 + (this.m - 0.02) * 20; // 15px a 25px según masa
      const gradSphere = ctx.createRadialGradient(
        bobX - bobRadius * 0.35,
        bobY - bobRadius * 0.35,
        bobRadius * 0.1,
        bobX,
        bobY,
        bobRadius
      );
      gradSphere.addColorStop(0, '#f8fafc');
      gradSphere.addColorStop(0.3, '#94a3b8');
      gradSphere.addColorStop(0.8, '#334155');
      gradSphere.addColorStop(1, '#0f172a');

      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = gradSphere;
      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 5. Cruz de Centro de Masa (CM) en el centro geométrico
      if (this.showCenterOfMass) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        const cLen = 5;
        ctx.beginPath();
        ctx.moveTo(bobX - cLen, bobY);
        ctx.lineTo(bobX + cLen, bobY);
        ctx.moveTo(bobX, bobY - cLen);
        ctx.lineTo(bobX, bobY + cLen);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Etiqueta flotante mientras se arrastra
      if (this.isDragging) {
        const deg = Math.abs(this.theta * (180 / Math.PI)).toFixed(1);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bobX + 24, bobY - 14, 76, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px var(--mono)';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText(`θ = ${deg}°`, bobX + 62, bobY + 3);
      }

      ctx.restore();
    }

    drawVectors(ctx) {
      const px = this.pivotX;
      const py = this.pivotY;
      const visualLen = this.L * this.pixelsPerMeter;

      const bobX = px + Math.sin(this.theta) * visualLen;
      const bobY = py + Math.cos(this.theta) * visualLen;

      ctx.save();
      ctx.translate(bobX, bobY);

      // Vector Velocidad (Tangencial) v = L * omega (Cian)
      const v = this.L * this.omega;
      const vScale = 35; // factor visual
      const vx = Math.cos(this.theta) * v * vScale;
      const vy = -Math.sin(this.theta) * v * vScale;

      if (Math.hypot(vx, vy) > 2) {
        this.drawArrow(ctx, 0, 0, vx, vy, '#22d3ee', 'v');
      }

      // Vector Fuerza Recuperadora Tangencial F_t = -m * g * sin(theta) (Naranja)
      const Ft = -this.m * this.g * Math.sin(this.theta);
      const fScale = 120;
      const fx = Math.cos(this.theta) * Ft * fScale;
      const fy = -Math.sin(this.theta) * Ft * fScale;

      if (Math.hypot(fx, fy) > 2) {
        this.drawArrow(ctx, 0, 0, fx, fy, '#f59e0b', 'F_t');
      }

      ctx.restore();
    }

    drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
      const headlen = 8;
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      if (label) {
        ctx.font = 'bold 11px var(--mono)';
        ctx.fillText(label, toX + 6 * Math.cos(angle), toY + 6 * Math.sin(angle));
      }
    }
  }

  window.PenduloBench = PenduloBench;

})(window);
