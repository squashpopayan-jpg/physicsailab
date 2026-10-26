/* ===================================================================
   10-ui.js — Controlador de Simulaciones y Paneles Interactivos
   Percepción Computacional — Ing. Luis Fernando Barajas Ardila
   =================================================================== */
(function () {
  'use strict';
  const P = window.PERCEPCION;
  const el = P.el;

  class Sim {
    constructor(host, name, opts = {}) {
      this.host = host;
      this.name = name;
      this.opts = opts;
      this.p = {};
      this.canvases = [];
      this.readouts = {};
      this.animId = null;
      this.isPlaying = false;
      this.t = 0;

      this.initLayout();
      P.onTheme.push(() => this.redraw());
    }

    initLayout() {
      const h = this.host;
      h.innerHTML = '';
      h.className = 'sim-container';

      // Header
      const header = el('div', 'sim-header');
      const titleGroup = el('div', 'sim-title-group');
      const badge = el('span', 'sim-badge', this.opts.badge || 'Laboratorio');
      const title = el('h3', 'sim-title', this.opts.title || this.name);
      titleGroup.append(badge, title);

      const topCtrls = el('div', 'sim-controls-top');
      if (this.opts.hasPlay) {
        this.btnPlay = el('button', 'btn-sim-action', '▶ Iniciar');
        this.btnPlay.onclick = () => this.togglePlay();
        topCtrls.appendChild(this.btnPlay);
      }
      if (this.opts.hasReset) {
        const btnReset = el('button', 'btn-sim-action', '↺ Reiniciar');
        btnReset.onclick = () => {
          if (this.opts.onReset) this.opts.onReset(this);
          this.redraw();
        };
        topCtrls.appendChild(btnReset);
      }
      header.append(titleGroup, topCtrls);

      // Body (Stage + Sidebar)
      this.body = el('div', 'sim-body');
      this.stage = el('div', 'sim-stage');
      this.sidebar = el('div', 'sim-sidebar');

      // Readouts panel
      this.readoutsBox = el('div', 'sim-readouts');
      this.sidebar.appendChild(this.readoutsBox);

      this.body.append(this.stage, this.sidebar);
      h.append(header, this.body);
    }

    addCanvas(w = 500, h = 340) {
      const cv = document.createElement('canvas');
      cv.className = 'sim-canvas';
      cv.width = w;
      cv.height = h;
      this.stage.appendChild(cv);
      const ctx = cv.getContext('2d');
      const obj = { cv, ctx, w, h };
      this.canvases.push(obj);
      return obj;
    }

    addSlider(key, label, min, max, step, initial, unit = '', onChange = null) {
      this.p[key] = initial;
      const grp = el('div', 'sim-ctrl-group');
      const lbl = el('label', 'sim-ctrl-label');
      const nameSpan = el('span', '', label);
      const valSpan = el('span', 'sim-ctrl-val', initial + (unit ? ' ' + unit : ''));
      lbl.append(nameSpan, valSpan);

      const input = el('input', 'sim-range');
      input.type = 'range';
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = initial;

      input.oninput = (e) => {
        const v = parseFloat(e.target.value);
        this.p[key] = v;
        valSpan.textContent = v + (unit ? ' ' + unit : '');
        if (onChange) onChange(v, this);
        this.redraw();
      };

      grp.append(lbl, input);
      this.sidebar.insertBefore(grp, this.readoutsBox);
      return input;
    }

    addSelect(key, label, options, initial, onChange = null) {
      this.p[key] = initial;
      const grp = el('div', 'sim-ctrl-group');
      const lbl = el('label', 'sim-ctrl-label');
      lbl.appendChild(el('span', '', label));

      const sel = el('select', 'sim-select');
      options.forEach(opt => {
        const val = typeof opt === 'object' ? opt.val : opt;
        const text = typeof opt === 'object' ? opt.text : opt;
        const o = el('option', '', text);
        o.value = val;
        if (val === initial) o.selected = true;
        sel.appendChild(o);
      });

      sel.onchange = (e) => {
        this.p[key] = e.target.value;
        if (onChange) onChange(e.target.value, this);
        this.redraw();
      };

      grp.append(lbl, sel);
      this.sidebar.insertBefore(grp, this.readoutsBox);
      return sel;
    }

    addButton(label, onClick) {
      const btn = el('button', 'btn-sim-action', label);
      btn.style.width = '100%';
      btn.style.justifyContent = 'center';
      btn.style.padding = '0.5rem';
      btn.style.marginTop = '0.35rem';
      btn.onclick = () => {
        if (onClick) onClick(this);
        this.redraw();
      };
      this.sidebar.insertBefore(btn, this.readoutsBox);
      return btn;
    }

    setReadout(key, name, val) {
      if (!this.readouts[key]) {
        const row = el('div', 'sim-readout-row');
        const n = el('span', 'sim-readout-name', name);
        const v = el('span', 'sim-readout-val', val);
        row.append(n, v);
        this.readoutsBox.appendChild(row);
        this.readouts[key] = { row, v };
      } else {
        this.readouts[key].v.textContent = val;
      }
    }

    onDraw(fn) {
      this.drawFn = fn;
      this.redraw();
    }

    redraw() {
      if (this.drawFn && this.canvases.length > 0) {
        this.canvases.forEach(c => {
          this.drawFn(c.ctx, c.w, c.h, this.p, this);
        });
      }
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      if (this.btnPlay) {
        this.btnPlay.textContent = this.isPlaying ? '⏸ Pausar' : '▶ Iniciar';
      }
      if (this.isPlaying) {
        const loop = () => {
          if (!this.isPlaying) return;
          this.t += 0.03;
          if (this.opts.onStep) this.opts.onStep(this.t, this);
          this.redraw();
          this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(this.animId);
      }
    }
  }

  P.Sim = Sim;
})();
