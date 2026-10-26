/* ===================================================================
   20-plot.js — Motor de Gráficos 2D para Señales, Espectros e Histogramas
   Percepción Computacional — Ing. Luis Fernando Barajas Ardila
   =================================================================== */
(function () {
  'use strict';
  const P = window.PERCEPCION;

  class Plot2D {
    constructor(ctx, w, h, opts = {}) {
      this.ctx = ctx;
      this.w = w;
      this.h = h;
      this.opts = Object.assign({
        xMin: 0, xMax: 1, yMin: 0, yMax: 1,
        padL: 50, padR: 20, padT: 25, padB: 40,
        xLabel: '', yLabel: '', title: '',
        grid: true
      }, opts);

      this.plotW = this.w - this.opts.padL - this.opts.padR;
      this.plotH = this.h - this.opts.padT - this.opts.padB;
    }

    toX(x) {
      return this.opts.padL + ((x - this.opts.xMin) / (this.opts.xMax - this.opts.xMin)) * this.plotW;
    }

    toY(y) {
      return this.opts.padT + (1 - (y - this.opts.yMin) / (this.opts.yMax - this.opts.yMin)) * this.plotH;
    }

    clear(bg = '#090D16') {
      const ctx = this.ctx;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    drawAxes() {
      const ctx = this.ctx;
      const { padL, padR, padT, padB, xLabel, yLabel, title, grid } = this.opts;

      // Grid
      if (grid) {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const gx = padL + (i / 5) * this.plotW;
          const gy = padT + (i / 5) * this.plotH;
          ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + this.plotH);
          ctx.moveTo(padL, gy); ctx.lineTo(padL + this.plotW, gy);
        }
        ctx.stroke();
      }

      // Border frame
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padL, padT, this.plotW, this.plotH);

      // Labels & Title
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      if (xLabel) ctx.fillText(xLabel, padL + this.plotW / 2, this.h - 10);

      ctx.save();
      ctx.translate(15, padT + this.plotH / 2);
      ctx.rotate(-Math.PI / 2);
      if (yLabel) ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      if (title) {
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 12px Archivo, sans-serif';
        ctx.fillText(title, padL + this.plotW / 2, padT - 8);
      }
    }

    line(points, color = '#4F46E5', width = 2) {
      const ctx = this.ctx;
      if (!points || points.length === 0) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      points.forEach((pt, i) => {
        const px = this.toX(pt[0]);
        const py = this.toY(pt[1]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    stem(points, color = '#06B6D4', width = 1.5) {
      const ctx = this.ctx;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      const y0 = this.toY(0);
      points.forEach(pt => {
        const px = this.toX(pt[0]);
        const py = this.toY(pt[1]);
        ctx.beginPath();
        ctx.moveTo(px, y0);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    bars(bins, values, color = '#4F46E5') {
      const ctx = this.ctx;
      const n = bins.length;
      const barW = Math.max(1, (this.plotW / n) - 1);
      ctx.fillStyle = color;
      values.forEach((v, i) => {
        const px = this.toX(bins[i]);
        const py = this.toY(v);
        const y0 = this.toY(0);
        ctx.fillRect(px, py, barW, y0 - py);
      });
    }
  }

  P.Plot2D = Plot2D;
})();
