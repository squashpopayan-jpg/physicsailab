/* ===================================================================
   45-lab.js — Banco virtual (EM.Lab): escena realista + multímetro + código + monitor serie + fallas.
   Se monta dentro de un EM.Sim. cfg: ver EM.Lab.mount.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw, BB = EM.bb, PT = EM.parts, el = EM.el;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- Resaltado de sintaxis para el editor de sketch ---------- */
  const KW = /\b(void|int|long|float|double|bool|boolean|byte|char|unsigned|const|static|volatile|short|String|if|else|for|while|do|switch|case|default|break|continue|return|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t)\b/g;
  const FN = /\b(setup|loop|pinMode|digitalWrite|digitalRead|analogRead|analogWrite|delay|delayMicroseconds|millis|micros|map|constrain|min|max|abs|sqrt|pow|random|randomSeed|tone|noTone|pulseIn|attachInterrupt|ledcWrite|ledcAttach|ledcSetup|ledcAttachPin|dacWrite|Serial|Wire|WiFi|sizeof)\b/g;
  function hilite(src) {
    const toks = [];
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*")|('(?:[^'\\\n]|\\.)')|(#\s*\w+[^\n]*)|(\b0[xXbB][0-9a-fA-F]+\b|\b\d+\.?\d*(?:[eE][-+]?\d+)?[fFuUlL]*\b)/g;
    let last = 0, m, out = '';
    const plain = (t) => esc(t).replace(KW, '<i class="k">$1</i>').replace(FN, (x) => `<i class="f">${x}</i>`);
    while ((m = re.exec(src))) {
      out += plain(src.slice(last, m.index));
      const cls = m[1] ? 'c' : m[2] || m[3] ? 's' : m[4] ? 'p' : 'n';
      out += `<i class="${cls}">${esc(m[0])}</i>`;
      last = m.index + m[0].length;
    }
    out += plain(src.slice(last));
    return out;
  }

  class Lab {
    constructor(sim, cfg) {
      this.sim = sim; this.cfg = cfg;
      this.mode = cfg.view || (cfg.scene && cfg.scene.boards && cfg.scene.boards.length ? 'board' : 'sch');
      this.initScene();
      this.speed = cfg.speed || 1;
      this.showFlow = cfg.flow !== false;
      this.showVolt = !!cfg.volt;
      this.showLabels = !!cfg.labels;
      this.t = 0; this.zoom = 1; this.pan = [0, 0];
      this.alerts = []; this.serialText = ''; this.serialDirty = false;
      this.fx = new EM.fx.Particles();
      this.hit = []; this.hover = null; this.sel = null;
      this.tipEl = null;
      if (cfg.below !== false) sim.below();
      this.buildUI();
      this.reload();
      sim.onDraw(() => this.draw());
      sim.animate((dt) => this.step(dt), { autoplay: cfg.autoplay !== false });
      sim.resetButton(() => this.reset());
      if (cfg.onReady) cfg.onReady(this);
      this.refresh();
      /* anti-reentrada: el dibujo solo ocurre con el lienzo listo */
    }

    /* ---------------- escena ---------------- */
    initScene() {
      const c = this.cfg;
      const sc = typeof c.scene === 'function' ? c.scene() : JSON.parse(JSON.stringify(c.scene));
      sc.env = Object.assign({ lux: 300, temp: 25 }, sc.env || {});
      sc.meters = sc.meters || [];
      if (c.meter && !sc.meters.length) {
        sc.meters.push(Object.assign({ id: 'm1', mode: c.meter.mode || 'V', jack: 'VΩmA', red: null, black: null }, c.meter === true ? {} : c.meter));
      }
      sc.meters.forEach((m, i) => {
        if (!m.at) m.at = [i * 50 + (c.meterAt ? c.meterAt[0] : 100), c.meterAt ? c.meterAt[1] : 0];
        m.scale = m.scale || (this.mode === 'sch' ? 0.44 : 0.5);
        m.jack = m.jack || 'VΩmA';
        const L = DW.meterLayout(m);
        m.redRest = [L.jacks.V[0] + 10 * m.scale, L.jacks.V[1] + 22 * m.scale];
        m.blackRest = [L.jacks.COM[0] + 10 * m.scale, L.jacks.COM[1] + 22 * m.scale];
        m.redTip = m.redTip || m.redRest.slice(); m.blackTip = m.blackTip || m.blackRest.slice();
        if (sc.sch) {
          const S = sc.sch, U = DW.sch.U;
          m.sat = m.sat || [(S.w + 2.5) * U, 0];
          const Ls = DW.meterLayout(Object.assign({}, m, { at: m.sat }));
          m.sredRest = [Ls.jacks.V[0] + 10 * m.scale, Ls.jacks.V[1] + 22 * m.scale]; m.sblackRest = [Ls.jacks.COM[0] + 10 * m.scale, Ls.jacks.COM[1] + 22 * m.scale];
          m.sredTip = m.sredTip || m.sredRest.slice(); m.sblackTip = m.sblackTip || m.sblackRest.slice();
          m.bat = m.at.slice(); m.bredTip = m.redTip.slice(); m.bblackTip = m.blackTip.slice();
        }
        if (this.mode === 'sch' && sc.sch) { m.at = m.sat.slice(); m.redRest = m.sredRest.slice(); m.blackRest = m.sblackRest.slice(); m.redTip = m.sredTip.slice(); m.blackTip = m.sblackTip.slice(); }
        else {
          if (m.red) { try { m.redTip = BB.worldPos(sc, m.red).slice(); } catch (e) { /* */ } }
          if (m.black) { try { m.blackTip = BB.worldPos(sc, m.black).slice(); } catch (e) { /* */ } }
        }
      });
      this.scene = BB.normalize(sc);
      this.scene0 = JSON.stringify(sc);
    }
    reload() {
      this.scene._norm = false;
      this.bench = new EM.Bench(this.scene, this.cfg.bench || {});
      this.mcu = null;
      const sc = this.scene;
      if (sc.mcus.length) {
        this.mcu = new EM.mcu.Mcu(this.bench, sc.mcus[0].id, { onSerial: (t, n) => this.serialAppend(t, n), noise: this.cfg.noise, wifi: this.cfg.wifi, seed: this.cfg.seed });
        if (this.cfg.code !== undefined) this.loadCode(this.code !== undefined ? this.code : this.cfg.code, true);
      }
      this.world = this.cfg.world ? this.cfg.world(this) : null;
      this.fx.clear();
    }
    rebuild() { /* topología cambió */
      if (!this.bench) return;
      this.scene._norm = false;
      this.bench.dirty = true;
      this.bench.build();
      if (this.mcu) { this.mcu.memoKey = null; this.mcu.bench = this.bench; }
      this.refresh();
    }
    touch() { /* parámetros cambiaron sin cambiar la topología */
      if (!this.bench) return;
      this.bench.version = (this.bench.version || 0) + 1;
      if (this.mcu) this.mcu.memoKey = null;
      this.refresh();
    }
    refresh() {
      if (!this.bench) return;
      /* resuelve el estado actual sin avanzar el tiempo, para que los cambios se vean en pausa */
      try {
        const pins = this.mcu ? (this.mcu.bench.lastPins || {}) : {};
        if (this.mcu) { this.mcu.solveCurrent(); this.bench.frame([{ w: 1, pins: this.bench.lastPins || {} }], 0); }
        else this.bench.frame([{ w: 1, pins }], 0);
      } catch (e) { console.error(e); }
      this.updateOuts();
      this.sim.redraw();
    }
    reset() {
      this.scene = JSON.parse(this.scene0); this.scene._norm = false;
      /* restaurar posiciones de puntas del multímetro */
      this.scene.meters.forEach((m) => { m.redTip = m.redRest.slice(); m.blackTip = m.blackRest.slice(); if (m.red) m.redTip = BB.worldPos(BB.normalize(this.scene), m.red).slice(); });
      this.scene = BB.normalize(this.scene);
      this.t = 0; this.alerts = []; this.serialText = ''; if (this.serialPre) this.serialPre.textContent = ''; this.alertBox.innerHTML = '';
      this.faultState = {};
      this.reload();
      (this.cfg.controls || []).forEach((c) => c._api && c._api.apply && c._api.apply());
      this.refresh();
    }

    /* ---------------- interfaz ---------------- */
    buildUI() {
      const sim = this.sim, cfg = this.cfg;
      this.cv = sim.canvas({ aspect: cfg.aspect || 1.7, minH: cfg.minH || '300px' });
      this.cv.wrap.classList.add('lab-canvas');
      this.alertBox = el('div', 'lab-alerts');
      sim.stageCol.append(this.alertBox);
      this.tipEl = el('div', 'lab-tip'); this.tipEl.hidden = true;
      this.cv.wrap.append(this.tipEl);
      /* barra de herramientas del lienzo */
      const tb = el('div', 'lab-tools');
      const mk = (txt, fn, title) => { const b = el('button', 'lab-tool', txt); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.addEventListener('click', fn); tb.append(b); return b; };
      mk('+', () => { this.zoom = Math.min(4, this.zoom * 1.25); this.sim.redraw(); }, 'Acercar');
      mk('−', () => { this.zoom = Math.max(0.5, this.zoom / 1.25); this.sim.redraw(); }, 'Alejar');
      mk('⤢', () => { this.zoom = 1; this.pan = [0, 0]; this.sim.redraw(); }, 'Ajustar a la ventana');
      this.cv.wrap.append(tb);
      sim.hint(cfg.hint || 'Toque los pulsadores, interruptores y potenciómetros. Arrastre las puntas del multímetro a un agujero para medir.', this.cv);

      const showSpeed = cfg.speeds !== false && (this.scene.mcus.length || cfg.speeds || cfg.world);
      if (showSpeed) sim.group('Simulación');
      if (showSpeed) sim.seg('speed', { label: 'Velocidad del tiempo', options: (cfg.speeds || [[0.1, '0,1×'], [1, '1×'], [5, '5×'], [25, '25×']]), value: this.speed, onInput: (v) => { this.speed = v; } });
      if (!cfg.bare) sim.group('Vista');
      if (!cfg.bare && this.scene.sch && this.scene.boards.length) sim.seg('view', { label: 'Cómo verlo', options: [['board', 'Protoboard'], ['sch', 'Esquema']], value: this.mode, onInput: (v) => this.setMode(v) });
      if (!cfg.bare) sim.check('flow', { label: 'Mostrar el paso de la corriente', value: this.showFlow, onInput: (v) => { this.showFlow = v; } });
      if (!cfg.bare) sim.check('volt', { label: 'Colorear según el voltaje de cada fila', value: this.showVolt, onInput: (v) => { this.showVolt = v; } });
      if (!cfg.bare) sim.check('labels', { label: 'Mostrar nombres y valores', value: this.showLabels, onInput: (v) => { this.showLabels = v; } });
      if (cfg.sound) sim.check('sound', { label: 'Sonido (zumbador)', value: false, onInput: (v) => this.setSound(v) });

      /* controles propios de la simulación */
      if ((cfg.controls || []).length) {
        sim.group(cfg.controlsTitle || 'Ajustes');
        for (const c of cfg.controls) this.addControl(c);
      }
      /* fallas */
      if ((cfg.faults || []).length) {
        sim.group('Fallas para provocar');
        this.faultState = {};
        for (const f of cfg.faults) {
          sim.check('fault-' + f.id, {
            label: f.label, value: !!f.on, onInput: (on) => {
              this.faultState[f.id] = on;
              if (on && cfg.faultsExclusive) for (const o of cfg.faults) if (o.id !== f.id) { this.faultState[o.id] = false; if (sim.ctl['fault-' + o.id]) sim.ctl['fault-' + o.id].set(false, true); }
              if (on) f.apply(this.scene, this); else if (f.revert) f.revert(this.scene, this);
              this.rebuild();
            }
          });
          if (f.on) { this.faultState[f.id] = true; }
        }
        sim.button('Reponer piezas dañadas', () => { this.bench.repairAll(); this.alerts = []; this.alertBox.innerHTML = ''; this.refresh(); }, { newRow: true });
      }
      /* lecturas */
      if (!cfg.bare) { this.outSel = sim.out('sel', 'Pieza elegida', { hl: true });
      this.outV = sim.out('v', 'Tensión entre sus terminales');
      this.outI = sim.out('i', 'Corriente que la atraviesa');
      this.outP = sim.out('p', 'Potencia que consume'); }
      for (const o of cfg.outs || []) o._out = sim.out(o.id, o.label, { hl: o.hl });
      if (!cfg.bare && this.scene.meters.length) { this.outM = sim.out('meter', 'Lo que marca el multímetro', { hl: true }); }
      if (!cfg.bare) this.outT = sim.out('t', 'Tiempo simulado');

      if (cfg.scope) {
        this.scv = sim.canvas({ aspect: cfg.scope.aspect || 4.2, parent: sim.stageCol, minH: '150px', label: 'Osciloscopio virtual' });
        this.scv.wrap.classList.add('lab-scope');
        this.scopeBuf = cfg.scope.channels.map(() => ({ t: [], v: [] }));
      }
      if (cfg.panel) { this.pcv = sim.canvas({ aspect: cfg.panel.aspect || 3.2, parent: sim.stageCol, minH: cfg.panel.minH || '170px', label: cfg.panel.label || 'Gráfica' }); this.pcv.wrap.classList.add('lab-scope'); }
      if (cfg.edit) this.buildEditUI();
      if (cfg.code !== undefined && this.scene.mcus.length) this.buildCodePanel();
      if (cfg.web) this.buildWeb();
      if (cfg.bt) this.buildBT();
      this.bindPointer();
    }
    addControl(c) {
      const sim = this.sim, lab = this;
      const api = { apply() { const v = sim.p[c.id]; if (c.apply) c.apply(lab, v, lab.scene); } };
      c._api = api;
      const onInput = (v) => { if (c.apply) c.apply(lab, v, lab.scene); lab.touch(); };
      if (c.type === 'slider') sim.slider(c.id, Object.assign({}, c, { onInput }));
      else if (c.type === 'seg') sim.seg(c.id, Object.assign({}, c, { onInput }));
      else if (c.type === 'select') sim.select(c.id, Object.assign({}, c, { onInput }));
      else if (c.type === 'check') sim.check(c.id, Object.assign({}, c, { onInput }));
      else if (c.type === 'button') sim.button(c.label, () => { c.run(lab); lab.touch(); }, { newRow: c.newRow });
      else if (c.type === 'note') sim.note(c.html);
      if (c.apply && c.type !== 'button' && c.type !== 'note') c.apply(lab, sim.p[c.id], lab.scene);
    }

    /* ---------------- sketch ---------------- */
    buildCodePanel() {
      const cfg = this.cfg, sim = this.sim;
      const box = el('div', 'lab-code');
      const head = el('div', 'lab-code-head');
      head.innerHTML = `<b>Sketch</b><span class="lab-board">${esc(EM.mcu.boards[this.scene.mcus[0].kind].name)}</span>`;
      const btns = el('div', 'lab-code-btns');
      const run = el('button', 'btn primary', '▶ Compilar y subir'); run.type = 'button';
      const rst = el('button', 'btn', 'Restablecer sketch'); rst.type = 'button';
      btns.append(run, rst);
      head.append(btns);
      const ed = el('div', 'lab-ed');
      this.gutter = el('div', 'lab-gut'); this.gutter.setAttribute('aria-hidden', 'true');
      const wrapc = el('div', 'lab-edwrap');
      this.pre = el('pre', 'lab-pre'); this.pre.setAttribute('aria-hidden', 'true');
      this.ta = document.createElement('textarea');
      this.ta.className = 'lab-ta'; this.ta.spellcheck = false; this.ta.setAttribute('aria-label', 'Código del sketch');
      this.ta.id = sim._id('sketch');
      this.ta.value = cfg.code;
      this.code = cfg.code;
      wrapc.append(this.pre, this.ta);
      ed.append(this.gutter, wrapc);
      this.errBox = el('div', 'lab-errs');
      this.errBox.hidden = true;
      const ser = el('div', 'lab-serial');
      const sh = el('div', 'lab-serial-head');
      sh.innerHTML = '<b>Monitor serie</b>';
      this.baudEl = el('span', 'lab-baud', 'sin abrir');
      const clr = el('button', 'btn', 'Borrar'); clr.type = 'button';
      sh.append(this.baudEl, clr);
      this.serialPre = el('pre', 'lab-serial-out');
      this.serialPre.setAttribute('aria-live', 'off');
      const sinput = el('form', 'lab-serial-in');
      this.serIn = document.createElement('input'); this.serIn.type = 'text'; this.serIn.placeholder = 'Escriba un mensaje y pulse Enviar'; this.serIn.id = sim._id('serial-in'); this.serIn.setAttribute('aria-label', 'Mensaje para la placa');
      const sendb = el('button', 'btn', 'Enviar'); sendb.type = 'submit';
      sinput.append(this.serIn, sendb);
      ser.append(sh, this.serialPre, sinput);
      box.append(head, ed, this.errBox, ser);
      sim.stageCol.append(box);
      const sync = () => {
        const v = this.ta.value;
        this.pre.innerHTML = hilite(v) + '\n';
        const n = v.split('\n').length;
        let g = '';
        for (let i = 1; i <= n; i++) g += `<span data-l="${i}">${i}</span>`;
        this.gutter.innerHTML = g;
        this.ta.style.height = this.pre.style.height = 'auto';
        const h = Math.max(120, this.pre.scrollHeight);
        this.ta.style.height = h + 'px';
      };
      this.syncEd = sync;
      this.ta.addEventListener('input', sync);
      this.ta.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); const s = this.ta.selectionStart, t = this.ta.selectionEnd; this.ta.setRangeText('  ', s, t, 'end'); sync(); }
        else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run.click(); }
      });
      run.addEventListener('click', () => { this.loadCode(this.ta.value); this.refresh(); });
      rst.addEventListener('click', () => { this.ta.value = cfg.code; sync(); this.loadCode(cfg.code); this.refresh(); });
      clr.addEventListener('click', () => { this.serialText = ''; this.serialPre.textContent = ''; });
      sinput.addEventListener('submit', (e) => { e.preventDefault(); if (this.mcu) { this.mcu.sendSerial(this.serIn.value + '\n'); this.serialAppend('» ' + this.serIn.value + '\r\n', 'echo'); } this.serIn.value = ''; });
      sync();
    }
    loadCode(src, silent) {
      if (!this.mcu) return;
      this.code = src;
      const r = this.mcu.load(src);
      if (this.errBox) {
        if (!r.ok) {
          this.errBox.hidden = false;
          this.errBox.innerHTML = '<b>Error de compilación</b>' + r.errors.map((e) => `<div><code>línea ${e.line}</code> ${esc(e.msg)}</div>`).join('') + '<small>La placa conserva el programa anterior… o ninguno si es la primera vez.</small>';
          if (this.gutter) { this.gutter.querySelectorAll('.err').forEach((n) => n.classList.remove('err')); r.errors.forEach((e) => { const n = this.gutter.querySelector(`[data-l="${e.line}"]`); if (n) n.classList.add('err'); }); }
        } else { this.errBox.hidden = true; if (this.gutter) this.gutter.querySelectorAll('.err').forEach((n) => n.classList.remove('err')); }
      }
      if (r.ok) { this.serialText = ''; if (this.serialPre) this.serialPre.textContent = ''; this.alerts = []; this.alertBox.innerHTML = ''; }
      return r;
    }
    setCode(src) { if (this.ta) { this.ta.value = src; this.syncEd(); } this.loadCode(src); this.refresh(); }
    serialAppend(t, name) {
      if (name === 'SerialBT') { this.btText = (this.btText || '') + t; if (this.btText.length > 4000) this.btText = this.btText.slice(-3000); this.btDirty = true; return; } this.serialText += t; if (this.serialText.length > 6000) this.serialText = this.serialText.slice(-5000); this.serialDirty = true; if (this.mcu) this.mcu.lastTx = this.t; }

    /* ---------------- osciloscopio / graficador ---------------- */
    sampleScope(vdt) {
      const sc = this.cfg.scope, span = sc.span || 5;
      sc.channels.forEach((ch, i) => {
        const B = this.scopeBuf[i];
        let v;
        try { v = ch.fn ? ch.fn(this) : this.bench.v(ch.ref); } catch (e) { v = NaN; }
        B.t.push(this.t); B.v.push(v);
        while (B.t.length && B.t[0] < this.t - span * 1.05) { B.t.shift(); B.v.shift(); }
      });
    }
    drawScope() {
      const cv = this.scv, ctx = cv.ctx, sc = this.cfg.scope, span = sc.span || 5;
      EM.draw.clear(cv);
      const t1 = Math.max(this.t, span), t0 = t1 - span;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: t0, xmax: t1, ymin: sc.ymin === undefined ? 0 : sc.ymin, ymax: sc.ymax === undefined ? 5.5 : sc.ymax, xlabel: 'tiempo (s)', ylabel: sc.unit || 'V', ml: 46, mr: 10, mt: 12, mb: 30 });
      pl.frame();
      sc.channels.forEach((ch, i) => { const B = this.scopeBuf[i]; if (B.t.length > 1) pl.xy(B.t, B.v, { color: ch.color || ['--c1', '--c2', '--c3', '--c4'][i % 4], width: 2 }); });
      pl.legend(sc.channels.map((ch, i) => ({ label: ch.label, color: ch.color || ['--c1', '--c2', '--c3', '--c4'][i % 4] })), 'tr');
    }

    /* ---------------- modo de edición ---------------- */
    buildEditUI() {
      const sim = this.sim, cfg = this.cfg, e = cfg.edit;
      this.tool = null; this.nextId = {};
      sim.group('Construir');
      const row = el('div', 'lab-tray');
      this.trayBtns = {};
      const NAMES = { R: 'Resistencia', LED: 'LED', BTN: 'Pulsador', POT: 'Potenciómetro', LDR: 'LDR', NTC: 'Termistor', C: 'Condensador', ECAP: 'Electrolítico', D: 'Diodo', BJT: 'Transistor', NMOS: 'MOSFET', BUZ: 'Zumbador', SW: 'Interruptor', MOTOR: 'Motor' };
      const arm = (name, tool, label) => { const b = el('button', 'btn', label); b.type = 'button'; b.addEventListener('click', () => { this.tool = this.tool && this.tool.name === name ? null : Object.assign({ name }, tool); this.syncTray(); }); row.append(b); this.trayBtns[name] = b; };
      for (const t of e.tray || ['R', 'LED', 'BTN']) arm(t, { kind: 'part', type: t }, '＋ ' + (NAMES[t] || t));
      if (e.wires !== false) arm('wire', { kind: 'wire', a: null }, '＋ Cable');
      sim._parent().append(row);
      this.editMsg = sim.note('Elija una pieza y toque un agujero de la protoboard. Arrastre las patas (círculos) para moverlas.');
      sim.button('Quitar lo elegido', () => this.removeSel(), { newRow: true });
      sim.button('Quitar todo', () => { this.scene.parts = this.scene.parts.filter((p) => p.fixed); this.scene.wires = this.scene.wires.filter((w) => w.fixed); this.sel = null; this.rebuild(); });
      if (e.goal) this.outGoal = sim.out('goal', 'Objetivo', { hl: true });
    }
    syncTray() {
      for (const k in this.trayBtns) this.trayBtns[k].classList.toggle('primary', !!this.tool && this.tool.name === k);
      this.editMsg.textContent = this.tool ? (this.tool.kind === 'wire' ? 'Toque el agujero (o pin de la placa) donde empieza el cable y luego donde termina.' : 'Toque el agujero donde quiere poner la pieza.') : 'Elija una pieza y toque un agujero de la protoboard. Arrastre las patas (círculos) para moverlas.';
    }
    uid(t) {
      const pre = { R: 'R', LED: 'D', BTN: 'S', POT: 'RV', LDR: 'LDR', NTC: 'NTC', C: 'C', ECAP: 'C', D: 'D', BJT: 'Q', NMOS: 'Q', BUZ: 'BZ', SW: 'SW', MOTOR: 'M' }[t] || 'P';
      let n = 1;
      while (this.scene.parts.find((p) => p.id === pre + n)) n++;
      return pre + n;
    }
    holeRef(ref, dc) { /* desplaza un agujero principal dc columnas */
      const bd = ref.split(':')[0], h = BB.parse(ref.split(':')[1]), kind = BB.boardOf(this.scene, bd).kind;
      if (h.kind !== 'main') return null;
      const nh = h.row + (h.col + dc);
      return BB.valid(kind, nh) ? bd + ':' + nh : null;
    }
    placePart(type, ref) {
      const spec = { R: [0, 4], LED: [0, 1], D: [0, 3], C: [0, 2], ECAP: [0, 2], BUZ: [0, 2], SW: [0, 2], LDR: [0, 3], NTC: [0, 2], POT: [0, 1, 2], BJT: [0, 1, 2], NMOS: [0, 1, 2] }[type];
      let pins;
      if (type === 'BTN') {
        const bd = ref.split(':')[0], h = BB.parse(ref.split(':')[1]);
        if (h.kind !== 'main') { this.editMsg.textContent = 'Ponga el pulsador sobre el canal central de la protoboard.'; return; }
        pins = [bd + ':f' + h.col, bd + ':f' + (h.col + 2), bd + ':e' + h.col, bd + ':e' + (h.col + 2)];
      } else if (spec) {
        pins = spec.map((d) => this.holeRef(ref, d) || this.holeRef(ref, -d));
      } else return;
      if (pins.some((q) => !q)) { this.editMsg.textContent = 'Esa posición no es válida; pruebe en otro agujero.'; return; }
      const p = { id: this.uid(type), type, pins };
      if (type === 'R') p.value = (this.cfg.edit.rvalue || 330);
      if (type === 'LED') p.color = 'rojo';
      if (type === 'POT') p.pos = 0.5;
      this.scene.parts.push(p);
      this.sel = p.id; this.tool = null; this.syncTray(); this.rebuild();
    }
    removeSel() {
      if (!this.sel) return;
      this.scene.parts = this.scene.parts.filter((p) => p.id !== this.sel || p.fixed);
      this.scene.wires = this.scene.wires.filter((w) => w.id !== this.sel || w.fixed);
      this.sel = null; this.rebuild();
    }
    evalGoal() {
      const g = this.cfg.edit && this.cfg.edit.goal;
      if (!g || !this.outGoal) return;
      let r; try { r = g(this); } catch (e) { r = { ok: false, msg: 'Aún no hay nada que evaluar.' }; }
      this.outGoal.set((r.ok ? '<span class="ok">✔ ' : '') + esc(r.msg) + (r.ok ? '</span>' : ''));
    }

    /* ---------------- navegador web virtual (servidor del ESP32) ---------------- */
    buildWeb() {
      const sim = this.sim, w = this.cfg.web;
      const box = el('div', 'lab-web');
      const head = el('div', 'lab-code-head'); head.innerHTML = '<b>Navegador del teléfono</b><span class="lab-board" id="' + sim._id('ip') + '">sin WiFi</span>';
      const bar = el('form', 'lab-serial-in');
      this.urlIn = document.createElement('input'); this.urlIn.type = 'text'; this.urlIn.value = '/'; this.urlIn.id = sim._id('url'); this.urlIn.setAttribute('aria-label', 'Dirección dentro del servidor');
      const go = el('button', 'btn primary', 'Ir'); go.type = 'submit';
      bar.append(this.urlIn, go);
      const links = el('div', 'lab-tray'); links.style.padding = '0 14px 8px';
      for (const [t, path] of w.links || []) { const b = el('button', 'btn', t); b.type = 'button'; b.addEventListener('click', () => { this.urlIn.value = path; this.goWeb(path); }); links.append(b); }
      this.webStatus = el('div', 'lab-baud', 'Esperando…'); this.webStatus.style.padding = '0 14px 6px';
      this.webView = el('div', 'lab-web-view'); this.webView.textContent = 'Pulse «Ir» para pedir la página al ESP32.';
      box.append(head, bar, links, this.webStatus, this.webView);
      sim.stageCol.append(box);
      bar.addEventListener('submit', (e) => { e.preventDefault(); this.goWeb(this.urlIn.value); });
      this.ipEl = head.querySelector('.lab-board');
    }
    goWeb(path) {
      if (!this.mcu) return;
      const u = String(path || '/').trim() || '/', q = u.indexOf('?'), args = {};
      if (q >= 0) u.slice(q + 1).split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) args[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
      if (!this.mcu.host || this.mcu.host.WiFi.status() !== 3) { this.webStatus.textContent = 'Sin conexión: la placa todavía no se unió a la red WiFi (espere unos segundos).'; return; }
      this.mcu.httpQueue.push({ path: q >= 0 ? u.slice(0, q) : u, args });
      this.webStatus.textContent = 'Pidiendo ' + u + ' …';
      this.webWait = this.t;
    }
    showResponse(r) {
      this.webStatus.textContent = 'Respuesta ' + r.code + ' · ' + r.type;
      const body = String(r.body).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
      this.webView.innerHTML = /html/.test(r.type) ? body : '<pre>' + esc(body) + '</pre>';
    }
    /* ---------------- terminal Bluetooth del teléfono ---------------- */
    buildBT() {
      const sim = this.sim, box = el('div', 'lab-web');
      const head = el('div', 'lab-code-head'); head.innerHTML = '<b>Teléfono (terminal Bluetooth)</b><span class="lab-board">emparejado con «ESP32-Curso»</span>';
      this.btPre = el('pre', 'lab-serial-out'); this.btText = '';
      const f = el('form', 'lab-serial-in'); const inp = document.createElement('input'); inp.type = 'text'; inp.id = sim._id('bt-in'); inp.placeholder = 'Comando para la placa (por ejemplo: 1 o 0)'; inp.setAttribute('aria-label', 'Mensaje desde el teléfono');
      const b = el('button', 'btn', 'Enviar'); b.type = 'submit'; f.append(inp, b);
      box.append(head, this.btPre, f); sim.stageCol.append(box);
      f.addEventListener('submit', (e) => { e.preventDefault(); if (this.mcu) { this.mcu.btIn += inp.value; this.btText += '» ' + inp.value + '\r\n'; this.btDirty = true; } inp.value = ''; });
    }

    /* ---------------- sonido ---------------- */
    setSound(on) {
      this.soundOn = on;
      if (on && !this.actx) { try { this.actx = new (window.AudioContext || window.webkitAudioContext)(); this.osc = this.actx.createOscillator(); this.gain = this.actx.createGain(); this.osc.type = 'square'; this.gain.gain.value = 0; this.osc.connect(this.gain); this.gain.connect(this.actx.destination); this.osc.start(); } catch (e) { this.actx = null; } }
      if (this.actx && this.actx.state === 'suspended') this.actx.resume();
      if (!on && this.gain) this.gain.gain.value = 0;
    }
    updateSound() {
      if (!this.soundOn || !this.actx) return;
      let f = 0;
      for (const p of this.scene.parts) {
        if (p.dead) continue;
        if (p.type === 'BUZ' || p.type === 'PIEZO' || p.type === 'SPEAKER') {
          if (this.mcu) for (const ref in this.mcu.tones) { if (this.bench.nets.same(p.pins[0], this.mcu.id + ':' + ref)) f = this.mcu.tones[ref]; }
          if (!f && p.type === 'BUZ' && Math.abs(this.bench.partCurrent(p)) > 0.004) f = 2700;
        }
      }
      if (f > 0) { this.osc.frequency.setTargetAtTime(Math.min(f, 8000), this.actx.currentTime, 0.01); this.gain.gain.setTargetAtTime(0.04, this.actx.currentTime, 0.01); } else this.gain.gain.setTargetAtTime(0, this.actx.currentTime, 0.02);
    }

    /* ---------------- paso de tiempo ---------------- */
    step(dt) {
      const vdt = dt * this.speed;
      let segs;
      if (this.mcu) segs = this.mcu.advance(vdt, this.world);
      else { if (this.world && this.world.update) { if (this.world.update(this.t * 1e6 + vdt * 1e6, null)) { this.bench.version++; } } segs = [{ w: vdt, pins: {} }]; }
      this.bench.frame(segs, vdt);
      this.t += vdt;
      this.animateParts(vdt);
      this.consumeEvents(dt);
      if (this.cfg.scope) this.sampleScope(vdt);
      if (this.cfg.onFrame) this.cfg.onFrame(this, vdt);
      this.fx.update(dt);
      /* humo de piezas dañadas / chispas */
      this.updateSound();
      if (this.ipEl && this.mcu && this.mcu.host) this.ipEl.textContent = this.mcu.host.WiFi.status() === 3 ? 'conectado · http://192.168.1.57' : 'sin WiFi';
      if (this.btDirty && this.btPre) { this.btDirty = false; this.btPre.textContent = this.btText; this.btPre.scrollTop = this.btPre.scrollHeight; }
      if (this.mcu && this.mcu.httpResp && this.webView) { const r = this.mcu.httpResp; this.mcu.httpResp = null; this.showResponse(r); }
      if (this.serialDirty) { this.serialDirty = false; if (this.serialPre) { this.serialPre.textContent = this.serialText; this.serialPre.scrollTop = this.serialPre.scrollHeight; } }
      if (this.baudEl && this.mcu) this.baudEl.textContent = this.mcu.baud ? this.mcu.baud + ' baudios' : 'sin abrir';
      this._outAcc = (this._outAcc || 0) + dt;
      if (this._outAcc > 0.1) { this._outAcc = 0; this.updateOuts(); }
    }
    animateParts(vdt) {
      const sc = this.scene, b = this.bench;
      for (const p of sc.parts) {
        if (p.type === 'MOTOR') p.angle = ((p.angle || 0) + (p.omega || 0) * vdt) % (Math.PI * 2);
        if (p.type === 'SERVO') {
          const si = PT.SERVO.pinNames.indexOf('SIG'), ref = p.pins[si];
          let target = null;
          if (this.mcu && ref) for (const id in this.mcu.pins) { const q = this.mcu.pins[id]; if (q.pwm && q.pwm.servo && b.nets.same(this.mcu.id + ':' + id, ref)) target = clamp((q.pwm.duty * 20000 - 544) / (2400 - 544) * 180, 0, 180); }
          const pw = b.modPower(p);
          if (p.angleNow === undefined) p.angleNow = 90;
          let moving = false;
          if (target !== null && pw.ok) { const d = target - p.angleNow, st = 600 * vdt; if (Math.abs(d) > 0.3) moving = true; p.angleNow += Math.abs(d) <= st ? d : Math.sign(d) * st; }
          p.iload = pw.ok ? (moving ? 0.21 : (target !== null ? 0.012 : 0.006)) : 0.0001;
        }
        if (p.type === 'RELAYMOD') {
          const ii = PT.RELAYMOD.pinNames.indexOf('IN'), pw = b.modPower(p);
          if (p.pins[ii]) p.on = pw.ok && b.v(p.pins[ii]) < 1.0; /* los módulos de relé comunes se activan con nivel bajo */
          p.iload = pw.ok ? (p.on ? 0.07 : 0.005) : 0.0001;
        }
      }
    }
    consumeEvents(dt) {
      const evs = this.bench.events;
      while (evs.length) {
        const e = evs.shift();
        this.alerts.push(e);
        if (this.alerts.length > 4) this.alerts.shift();
        const p = this.scene.parts.find((q) => q.id === e.part);
        let pos = null;
        if (p && p.pins.length) { const ps = p.pins.filter(Boolean).map((r) => BB.worldPos(this.scene, r)); pos = ps.reduce((s, q) => [s[0] + q[0] / ps.length, s[1] + q[1] / ps.length], [0, 0]); }
        else if (e.kind === 'pin' || e.kind === 'ptc') { const m = this.scene.mcus[0]; const sp = EM.mcu.boards[m.kind]; pos = [m.x + sp.w / 2, m.y + sp.h / 2]; }
        if (pos) this.fx.sparks(pos[0], pos[1], e.kind === 'ptc' ? 4 : 18);
        this.alertBox.innerHTML = this.alerts.map((a) => `<div class="lab-alert"><b>⚠</b> ${esc(a.msg)}</div>`).join('');
        if (this.cfg.onEvent) this.cfg.onEvent(this, e);
      }
      /* cortocircuito en curso */
      const st = this.bench.status();
      if (st.shorts.length && dt > 0 && Math.random() < dt * 5) { const s = st.shorts[0]; const el0 = this.bench.c.find(s.id); void el0; }
      this.shortNow = st.shorts.length > 0;
      if (this.shortBox !== this.shortNow) {
        this.shortBox = this.shortNow;
        this.sim.host.classList.toggle('lab-short', this.shortNow);
      }
    }

    /* ---------------- lecturas ---------------- */
    updateOuts() {
      const b = this.bench, sc = this.scene;
      const p = this.sel ? sc.parts.find((q) => q.id === this.sel) : null;
      if (!this.outSel) { /* sin panel de pieza */ }
      else if (p) {
        const def = PT[p.type];
        const pins = p.pins.filter(Boolean);
        let v = NaN;
        if (pins.length >= 2 && !def.module && p.pins.length <= 2) v = b.v(p.pins[0]) - b.v(p.pins[1]);
        const I = b.partCurrent(p);
        this.outSel.set(`${esc(def.label)} <b>${esc(p.id)}</b>` + (p.dead ? ' — <span class="bad">dañada</span>' : '') + this.valueText(p));
        this.outV.set(isNaN(v) ? '—' : EM.fmtV(v));
        this.outI.set(isNaN(v) ? '—' : EM.fmtI(I));
        this.outP.set(isNaN(v) ? '—' : EM.fmtP(Math.abs(v * I)) + (p.stress > 1 ? ` · <span class="bad">${(p.stress * 100).toFixed(0)} % de su límite</span>` : (p.stress ? ` · ${(p.stress * 100).toFixed(0)} % de su límite` : '')));
      } else { this.outSel.set('Haga clic en una pieza'); this.outV.set('—'); this.outI.set('—'); this.outP.set('—'); }
      if (this.outM) {
        this.outM.set(sc.meters.map((m) => { const r = b.readMeter(m); const t = DW.meterText(m, r); return (t.text || '—') + ' ' + t.unit + (t.note ? ` <small>(${esc(t.note)})</small>` : ''); }).join(' · '));
      }
      this.evalGoal();
      if (this.outT) this.outT.set(EM.fix(this.t, 2) + ' s' + (this.mcu && this.mcu.errorMsg ? ` · <span class="bad">error: ${esc(this.mcu.errorMsg)}</span>` : (this.mcu && this.mcu.halted ? ' · programa detenido' : '')));
      for (const o of this.cfg.outs || []) { try { o._out.set(o.fn(this)); } catch (e) { o._out.set('—'); } }
    }
    valueText(p) {
      switch (p.type) {
        case 'R': return ' · ' + sp.fmtR(PT.val(p, 'value'));
        case 'POT': return ' · ' + sp.fmtR(PT.val(p, 'value')) + ' (cursor al ' + Math.round(PT.val(p, 'pos') * 100) + ' %)';
        case 'LED': return ' · ' + PT.val(p, 'color');
        case 'C': case 'ECAP': return ' · ' + EM.si(PT.val(p, 'value'), 'F', 3);
        case 'LDR': return ' · ' + sp.fmtR(sp.ldr(p.lux !== undefined ? p.lux : this.scene.env.lux, PT.val(p, 'r10'), PT.val(p, 'gamma')));
        case 'NTC': return ' · ' + sp.fmtR(sp.ntc(p.temp !== undefined ? p.temp : this.scene.env.temp, PT.val(p, 'r25'), PT.val(p, 'beta')));
        case 'BJT': case 'NMOS': case 'D': return ' · ' + PT.val(p, 'model');
        default: return '';
      }
    }

    setMode(mode) {
      if (mode === this.mode) return;
      const sc = this.scene;
      const keys = ['at', 'redTip', 'blackTip'];
      for (const m of sc.meters) {
        const from = this.mode === 'sch' ? 's' : 'b', to = mode === 'sch' ? 's' : 'b';
        m[from + 'at'] = m.at.slice(); m[from + 'redTip'] = m.redTip.slice(); m[from + 'blackTip'] = m.blackTip.slice();
        m.at = (m[to + 'at'] || m.at).slice(); m.redTip = (m[to + 'redTip'] || m.redTip).slice(); m.blackTip = (m[to + 'blackTip'] || m.blackTip).slice();
        m.redRest = (to === 's' ? m.sredRest : m.redRest0 || m.redRest).slice(); m.blackRest = (to === 's' ? m.sblackRest : m.blackRest0 || m.blackRest).slice();
        if (to === 'b') { m.redRest0 = m.redRest; m.blackRest0 = m.blackRest; }
      }
      this.mode = mode;
      for (const m of sc.meters) this.placeTips(m);
      this.zoom = 1; this.pan = [0, 0];
      this.sim.redraw();
    }
    placeTips(m) {
      const sc = this.scene;
      for (const [w, k, rest] of [['red', 'redTip', 'redRest'], ['black', 'blackTip', 'blackRest']]) {
        if (!m[w]) { m[k] = m[rest].slice(); continue; }
        let pos = null;
        if (this.mode === 'sch') pos = this.findTermPos(m[w]); else { try { pos = BB.worldPos(sc, m[w]); } catch (e) { pos = null; } }
        if (pos) m[k] = pos.slice(); else { m[w] = null; m[k] = m[rest].slice(); }
      }
    }
    /* posición, en el esquema, de un terminal cuya red coincide con la referencia dada */
    findTermPos(ref) {
      const sc = this.scene, s = sc.sch, b = this.bench;
      let best = null;
      for (const p of sc.parts) {
        if (!s.parts[p.id]) continue;
        p.pins.forEach((r, k) => { if (!r) return; const q = DW.sch.termPos(sc, p.id, k); if (!q) return; if (r === ref) { if (!best || best.exact !== true) best = { q, exact: true }; } else if (!best && b.nets.same(r, ref)) best = { q, exact: false }; });
      }
      for (const id in s.boxes || {}) { const bx = s.boxes[id]; for (const k in bx.pins) { const r = bx.refs && bx.refs[k]; if (!r) continue; const q = DW.sch.termPos(sc, id, k); if (r === ref) best = { q, exact: true }; else if (!best && b.nets.same(r, ref)) best = { q, exact: false }; } }
      return best ? best.q : null;
    }

    /* ---------------- geometría de la vista ---------------- */
    bounds() {
      const sc = this.scene;
      if (this.mode === 'sch' && sc.sch) { let [a, b, c, d] = DW.sch.bounds(sc); for (const m of sc.meters) { const L = DW.meterLayout(m); c = Math.max(c, m.at[0] + L.w + 8); d = Math.max(d, m.at[1] + L.h + 20 * m.scale + 10); } return [a, b, c, d]; }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
      if (this.cfg.focusParts && sc.parts.length) {
        for (const p of sc.parts) {
          const d = PT[p.type], q = p.pins.filter(Boolean).map((r) => BB.worldPos(sc, r));
          q.forEach((a) => { add(a[0] - 8, a[1] - 11); add(a[0] + 8, a[1] + 8); });
          if (d.module && q.length) { const lay = DW.MOD[p.type] || DW.MOD.GENERIC; add(q[0][0] - 4, q[0][1] - lay.h - 2); add(q[0][0] + lay.w + 2, q[0][1] + 6); }
          if (p.at) { add(p.at[0] - 18, p.at[1] - 24); add(p.at[0] + 18, p.at[1] + 16); }
        }
        const mw = x1 - x0, mh = y1 - y0;
        if (mw < 58) { const c = (x0 + x1) / 2; x0 = c - 29; x1 = c + 29; }
        if (mh < 36) { const c = (y0 + y1) / 2; y0 = c - 18; y1 = c + 18; }
        return [x0, y0, x1, y1];
      }
      if (this.cfg.focus) return this.cfg.focus.slice();
      for (const b of sc.boards) { const k = BB.KINDS[b.kind]; add(b.x - 2, b.y - 2); add(b.x + k.w + 2, b.y + k.h + 2); }
      for (const m of sc.mcus) { const s = EM.mcu.boards[m.kind]; const r = ((m.rot || 0) % 180) === 90; const w = r ? s.h : s.w, h = r ? s.w : s.h; add(m.x - 7, m.y - 3); add(m.x + w + 3, m.y + h + 3); }
      for (const p of sc.parts) {
        const d = PT[p.type];
        if (p.at) { const pad = d.power ? 30 : (d.module ? 42 : 26); add(p.at[0] - pad, p.at[1] - pad); add(p.at[0] + pad, p.at[1] + pad * 0.7); }
        else if (d.module) { const lay = DW.MOD[p.type] || DW.MOD.GENERIC; const q = p.pins.filter(Boolean).map((r) => BB.worldPos(sc, r)); if (q.length) { const down = p.dir === 'down'; add(q[0][0] - 4, q[0][1] + (down ? lay.h : -lay.h)); add(q[0][0] + lay.w, q[0][1] + (down ? 4 : 2)); } }
        else for (const r of p.pins) if (r) { const q = BB.worldPos(sc, r); add(q[0] - 6, q[1] - 8); add(q[0] + 6, q[1] + 6); }
      }
      for (const m of sc.meters) { const L = DW.meterLayout(m); add(m.at[0] - 2, m.at[1] - 2); add(m.at[0] + L.w + 8, m.at[1] + L.h + 20 * m.scale + 10); }
      if (x0 > x1) return [0, 0, 100, 60];
      return [x0 - 4, y0 - 6, x1 + 4, y1 + 4];
    }
    fit() {
      const cv = this.cv, [x0, y0, x1, y1] = this.bounds();
      const bw = x1 - x0, bh = y1 - y0;
      const s0 = Math.min(cv.w / bw, cv.h / bh);
      const s = s0 * this.zoom;
      const ox = (cv.w - bw * s) / 2 - x0 * s + this.pan[0] * s0, oy = (cv.h - bh * s) / 2 - y0 * s + this.pan[1] * s0;
      this.view = { s, s0, ox, oy };
      return this.view;
    }
    toWorld(px, py) { const v = this.view || this.fit(); return [(px - v.ox) / v.s, (py - v.oy) / v.s]; }

    /* ---------------- dibujo ---------------- */
    draw() {
      const cv = this.cv, ctx = cv.ctx, sc = this.scene, b = this.bench;
      EM.draw.clear(cv);
      const V = this.fit();
      const dpr = cv.dpr;
      ctx.save();
      /* fondo: tapete de trabajo */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, cv.w, cv.h);
      ctx.strokeStyle = EM.col('--grid'); ctx.lineWidth = 1;
      const gs = 10 * V.s;
      ctx.beginPath();
      for (let x = ((V.ox % gs) + gs) % gs; x < cv.w; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, cv.h); }
      for (let y = ((V.oy % gs) + gs) % gs; y < cv.h; y += gs) { ctx.moveTo(0, y); ctx.lineTo(cv.w, y); }
      ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.setTransform(dpr * V.s, 0, 0, dpr * V.s, dpr * V.ox, dpr * V.oy);
      const v = { bench: b, t: this.t, glows: [], smoke: [], hit: [], hover: this.hover, scale: V.s, dpr, cur: [0, 0] };
      if (this.mode === 'sch' && sc.sch) { const hs = DW.sch.draw(ctx, this, v); this.partHits = hs; }
      else {
      /* protoboards */
      for (const bd of sc.boards) DW.board(ctx, bd, { scale: V.s, dpr });
      /* colores según el voltaje de las filas */
      if (this.showVolt) this.drawVolt(ctx, v);
      /* placas de microcontrolador */
      for (const m of sc.mcus) DW.mcu(ctx, m, b, this.mcu, this.t);
      /* piezas: primero módulos y fuentes, luego pasivos */
      const order = (p) => (PT[p.type].power ? 0 : PT[p.type].module ? 1 : p.type === 'MOTOR' ? 1 : 2);
      const parts = sc.parts.slice().sort((a, c) => order(a) - order(c));
      for (const p of parts) {
        const pins = p.pins.map((r) => (r ? BB.worldPos(sc, r) : null));
        if (pins.some((q) => !q)) { if (!PT[p.type].module && pins.filter(Boolean).length < 2) continue; }
        const ps = PT[p.type].module ? pins : pins.map((q) => q || [0, 0]);
        const pp = p.flip && p.pins.length === 3 && !PT[p.type].module ? ps.slice().reverse() : ps;
        try { DW.part(ctx, p, pp, v); } catch (e) { console.error('dibujo', p.id, e); }
        this.addPartHit(p, ps, v);
      }
      /* flujo de corriente */
      if (this.showFlow) this.drawFlow(ctx);
      /* cables */
      sc.wires.forEach((w, i) => {
        if (w.cut) return;
        const a = BB.worldPos(sc, w.a), c = BB.worldPos(sc, w.b);
        DW.wire(ctx, a, c, w.color || this.autoColor(w, i), { lift: w.lift });
      });
      }
      this.editHits = [];
      if (this.cfg.edit && this.mode !== 'sch') {
        ctx.save();
        for (const p of sc.parts) if (!p.fixed) p.pins.forEach((r, k) => { if (!r) return; const q = BB.worldPos(sc, r); ctx.beginPath(); ctx.arc(q[0], q[1], 1.15, 0, Math.PI * 2); ctx.strokeStyle = this.sel === p.id ? 'rgba(255,170,0,.95)' : 'rgba(40,120,255,.7)'; ctx.lineWidth = 0.3; ctx.stroke(); this.editHits.push({ kind: 'pin', id: p.id, k, x: q[0], y: q[1], r: 1.7 }); });
        for (const w of sc.wires) if (!w.fixed) for (const end of ['a', 'b']) { const q = BB.worldPos(sc, w[end]); ctx.beginPath(); ctx.arc(q[0], q[1], 1.25, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(40,120,255,.8)'; ctx.lineWidth = 0.3; ctx.stroke(); this.editHits.push({ kind: 'wend', id: w.id, end, x: q[0], y: q[1], r: 1.8 }); }
        if (this.tool && this.tool.kind === 'wire' && this.tool.a) { const q = BB.worldPos(sc, this.tool.a); ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,170,0,.95)'; ctx.lineWidth = 0.4; ctx.stroke(); }
        ctx.restore();
      }
      /* resaltado de agujero cercano a una punta */
      if (this.snapHole) { ctx.save(); ctx.strokeStyle = 'rgba(255,190,30,.95)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.arc(this.snapHole.p[0], this.snapHole.p[1], 1.5, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); if (this.snapHole.ref.indexOf(':') > 0) { const bd = BB.boardOf(sc, this.snapHole.ref.split(':')[0]); if (bd) DW.hiliteStrip(ctx, bd, this.snapHole.ref.split(':')[1], 'rgba(255,190,30,.28)'); } }
      /* tira señalada y marcadores */
      if (this.exploreHole && this.mode !== 'sch') { const [bid, h] = this.exploreHole.ref.split(':'); const bd = BB.boardOf(sc, bid); if (bd) DW.hiliteStrip(ctx, bd, h, 'rgba(255,170,0,.4)'); }
      for (const mk of this.markers || []) {
        try {
          const q = BB.worldPos(sc, mk.ref);
          ctx.save(); ctx.strokeStyle = mk.color || '#e8590c'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(q[0], q[1], 2.0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = mk.color || '#e8590c'; DW.rr(ctx, q[0] - 2.3, q[1] - 7.3, 4.6, 4.2, 1); ctx.fill(); ctx.restore();
          DW.text(ctx, mk.text || '', q[0], q[1] - 5.1, 2.8, '#fff', { weight: 800 });
        } catch (e) { /* */ }
      }
      /* multímetros */
      this.meterTexts = [];
      for (const m of sc.meters) {
        const r = b.readMeter(m);
        this.meterTexts.push(DW.meter(ctx, m, r, v));
        if (r && DW.meterText(m, r).beep && this.soundOn) { /* pitido */ }
      }
      /* resplandores, humo, partículas */
      EM.fx.glows(ctx, v.glows);
      for (const s of v.smoke) this.fx.smoke(s.id, s.x, s.y - 1, 1 / 60, 1);
      this.fx.draw(ctx);
      /* nombres */
      if (this.showLabels) this.drawLabels(ctx, v);
      if (this.sel) this.drawSel(ctx);
      ctx.restore();
      this.hit = (this.editHits || []).concat(v.hit, this.partHits || []);
      this.partHits = [];
      if (this.scv) { try { this.drawScope(); } catch (e) { console.error(e); } }
      if (this.pcv) { try { EM.draw.clear(this.pcv); this.cfg.panel.draw(this, this.pcv); } catch (e) { console.error(e); } }
    }
    autoColor(w, i) {
      const s = (w.a + ' ' + w.b);
      if (/GND/.test(s)) return '#1e1e22';
      if (/:5V|:VIN|\+/.test(s)) return '#d73a31';
      if (/:3V3/.test(s)) return '#e9772a';
      return DW.WIRE_COLORS[(i * 3 + 2) % DW.WIRE_COLORS.length];
    }
    addPartHit(p, pins, v) {
      const q = pins.filter(Boolean);
      if (!q.length) return;
      let cx = q.reduce((s, a) => s + a[0], 0) / q.length, cy = q.reduce((s, a) => s + a[1], 0) / q.length;
      let r = Math.max(4, Math.max(...q.map((a) => Math.hypot(a[0] - cx, a[1] - cy))) + 2);
      if (p._pos) { cx = p._pos[0]; cy = p._pos[1]; r = 16; }
      if (PT[p.type].module && !p.at) r = 14;
      (this.partHits = this.partHits || []).push({ kind: 'part', id: p.id, x: cx, y: cy, r });
    }
    drawSel(ctx) {
      if (this.cfg.bare) return;
      const h = (this.partHits || []).find((q) => q.id === this.sel) || this.hit.find((q) => q.kind === 'part' && q.id === this.sel);
      if (!h) return;
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 0.45; ctx.setLineDash([1.2, 0.9]);
      ctx.beginPath(); ctx.arc(h.x, h.y, Math.min(h.r, 9) + 0.8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    drawVolt(ctx, v) {
      const sc = this.scene, b = this.bench;
      const seen = new Set();
      let vmax = 5;
      if (this.mcu) vmax = this.mcu.vcc;
      for (const bd of sc.boards) {
        const refs = new Set();
        for (const p of sc.parts) for (const r of p.pins) if (r && r.startsWith(bd.id + ':')) refs.add(r);
        for (const w of sc.wires) { if (w.a.startsWith(bd.id + ':')) refs.add(w.a); if (w.b.startsWith(bd.id + ':')) refs.add(w.b); }
        for (const r of refs) {
          const h = r.split(':')[1], key = bd.id + ':' + BB.strip(bd.kind, h);
          if (seen.has(key)) continue; seen.add(key);
          const volt = b.v(r);
          vmax = Math.max(vmax, volt);
        }
        seen.clear();
        for (const r of refs) {
          const h = r.split(':')[1], key = bd.id + ':' + BB.strip(bd.kind, h);
          if (seen.has(key)) continue; seen.add(key);
          DW.hiliteStrip(ctx, bd, h, EM.fx.voltColor(b.v(r), vmax, 0.5));
        }
      }
      this.vmaxShown = vmax;
    }
    drawFlow(ctx) {
      const sc = this.scene, b = this.bench;
      for (const p of sc.parts) {
        if (p.dead) continue;
        const def = PT[p.type];
        if (def.module || p.pins.length > 2) continue;
        const pins = p.pins.map((r) => (r ? BB.worldPos(sc, r) : null));
        if (pins.some((q) => !q)) continue;
        let I = 0;
        try { I = b.partCurrent(p); } catch (e) { I = 0; }
        if (def.power) I = -I;
        const mid = [(pins[0][0] + pins[1][0]) / 2, (pins[0][1] + pins[1][1]) / 2];
        EM.fx.flow(ctx, [pins[0], mid, pins[1]], I, this.t, p.type === 'LED' ? '#fff3a0' : '#ffd23a');
      }
    }
    drawLabels(ctx, v) {
      const sc = this.scene;
      for (const p of sc.parts) {
        if (PT[p.type].module || PT[p.type].power) continue;
        let q;
        try { q = p.pins.filter(Boolean).map((r) => BB.worldPos(sc, r)); } catch (e) { continue; } /* pines de nodo (#n), sin agujero que rotular */
        if (!q.length) continue;
        const cx = q.reduce((s, a) => s + a[0], 0) / q.length, cy = Math.min(...q.map((a) => a[1])) - 5.5;
        let txt = p.id;
        if (p.type === 'R') txt = sp.fmtR(PT.val(p, 'value'));
        else if (p.type === 'LED') txt = p.id;
        else if (p.type === 'C' || p.type === 'ECAP') txt = EM.si(PT.val(p, 'value'), 'F', 2);
        ctx.save(); ctx.font = `700 2.3px ${EM.FONT_UI}`; ctx.textAlign = 'center';
        const w = ctx.measureText(txt).width + 1.6;
        ctx.fillStyle = 'rgba(255,253,245,.92)'; DW.rr(ctx, cx - w / 2, cy - 1.7, w, 3.4, 1.0); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 0.15; ctx.stroke();
        ctx.fillStyle = '#26211a'; ctx.textBaseline = 'middle'; ctx.fillText(txt, cx, cy + 0.1);
        ctx.restore();
      }
    }

    /* ---------------- interacción ---------------- */
    bindPointer() {
      const cv = this.cv;
      let drag = null;
      EM.pointer(cv, {
        down: (x, y, e) => {
          const [wx, wy] = this.toWorld(x, y);
          const sc = this.scene;
          if (this.cfg.edit && this.tool) {
            const hole = this.nearestHole(wx, wy);
            if (hole) {
              if (this.tool.kind === 'part') this.placePart(this.tool.type, hole.ref);
              else if (this.tool.kind === 'wire') {
                if (!this.tool.a) { this.tool.a = hole.ref; this.sim.redraw(); }
                else if (this.tool.a !== hole.ref) { sc.wires.push({ id: 'w' + (Date.now() % 100000), a: this.tool.a, b: hole.ref }); this.tool = null; this.syncTray(); this.rebuild(); }
              }
            }
            return { kind: 'tool' };
          }
          const h = this.findHit(wx, wy);
          if (!h) { drag = { kind: 'pan', x, y, pan: this.pan.slice() }; return drag; }
          if (h.kind === 'pin') { this.sel = h.id; drag = { kind: 'pin', id: h.id, k: h.k }; return drag; }
          if (h.kind === 'wend') { drag = { kind: 'wend', id: h.id, end: h.end }; return drag; }
          if (h.kind === 'btn') { const p = sc.parts.find((q) => q.id === h.id); p.pressed = true; this.sel = h.id; this.touch(); drag = { kind: 'btn', id: h.id }; return drag; }
          if (h.kind === 'sw') { const p = sc.parts.find((q) => q.id === h.id); p.closed = !p.closed; this.sel = h.id; this.touch(); drag = { kind: 'sw' }; return drag; }
          if (h.kind === 'pot') { this.sel = h.id; drag = { kind: 'pot', id: h.id, cx: h.x, cy: h.y }; this.dragPot(drag, wx, wy); return drag; }
          if (h.kind === 'dial') { const m = sc.meters.find((q) => q.id === h.id); drag = { kind: 'dial', id: h.id, cx: h.x, cy: h.y }; this.dragDial(drag, wx, wy); return drag; }
          if (h.kind === 'jack') { const m = sc.meters.find((q) => q.id === h.id); m.jack = m.jack === '10A' ? 'VΩmA' : '10A'; this.rebuild(); return { kind: 'jack' }; }
          if (h.kind === 'probe') { const m = sc.meters.find((q) => q.id === h.id); drag = { kind: 'probe', id: h.id, which: h.which }; m[h.which] = null; this.bench.dirty = true; this.rebuild(); this.dragProbe(drag, wx, wy); return drag; }
          if (h.kind === 'part') { this.sel = h.id; this.updateOuts(); this.sim.redraw(); drag = { kind: 'sel' }; return drag; }
          return null;
        },
        move: (d, x, y) => {
          const [wx, wy] = this.toWorld(x, y);
          if (d.kind === 'pan') { if (this.zoom > 1.02) { this.pan = [d.pan[0] + (x - d.x) / this.view.s0, d.pan[1] + (y - d.y) / this.view.s0]; this.sim.redraw(); } }
          else if (d.kind === 'pot') this.dragPot(d, wx, wy);
          else if (d.kind === 'dial') this.dragDial(d, wx, wy);
          else if (d.kind === 'probe') this.dragProbe(d, wx, wy);
          else if (d.kind === 'pin' || d.kind === 'wend') { this.snapHole = this.nearestHole(wx, wy); this.sim.redraw(); }
        },
        up: (d) => {
          if (d.kind === 'btn') { const p = this.scene.parts.find((q) => q.id === d.id); if (p) { p.pressed = false; this.touch(); } }
          if (d.kind === 'probe') this.dropProbe(d);
          if (d.kind === 'pin' || d.kind === 'wend') {
            const h = this.snapHole; this.snapHole = null;
            if (h) {
              if (d.kind === 'pin') { const p = this.scene.parts.find((q) => q.id === d.id); if (p) p.pins[d.k] = h.ref; }
              else { const w = this.scene.wires.find((q) => q.id === d.id); if (w) w[d.end] = h.ref; }
              this.rebuild();
            }
          }
        },
        hover: (x, y) => {
          const [wx, wy] = this.toWorld(x, y);
          const h = this.findHit(wx, wy);
          const id = h && h.kind === 'part' ? h.id : (h && (h.kind === 'btn' || h.kind === 'sw' || h.kind === 'pot') ? h.id : null);
          if (this.cfg.explore) { const hh = this.nearestHole(wx, wy); const key = hh ? hh.ref : null; if (key !== (this.exploreHole && this.exploreHole.ref)) { this.exploreHole = hh; this.updateOuts(); this.sim.redraw(); } }
          if (id !== this.hover) { this.hover = id; this.showTip(id, x, y); this.sim.redraw(); } else if (id) this.showTip(id, x, y);
          return h ? (h.kind === 'part' ? 'help' : h.kind === 'probe' ? 'grab' : 'pointer') : false;
        },
        leave: () => { this.hover = null; this.tipEl.hidden = true; this.sim.redraw(); }
      });
    }
    describeHole(ref) {
      const [bid, h] = ref.split(':'), bd = BB.boardOf(this.scene, bid), p = BB.parse(h);
      if (!bd || !p) return ref;
      if (p.kind === 'main') {
        const top = ['j', 'i', 'h', 'g', 'f'].includes(p.row), rows = top ? ['j', 'i', 'h', 'g', 'f'] : ['e', 'd', 'c', 'b', 'a'];
        return `<b>${h}</b>: columna ${p.col}, mitad ${top ? 'superior (f–j)' : 'inferior (a–e)'}. Conectado con ` + rows.filter((r) => r !== p.row).map((r) => r + p.col).join(', ') + '.';
      }
      return `<b>${h}</b>: riel ${p.pol === '+' ? 'positivo (+)' : 'negativo (−)'} ${p.side === 'T' ? 'superior' : 'inferior'}. Conectado con todos los agujeros de su riel.`;
    }
    findHit(wx, wy) {
      const hs = this.hit;
      let best = null, bd = 1e9;
      /* los controles específicos tienen prioridad sobre el genérico */
      for (const h of hs) {
        const d = Math.hypot(h.x - wx, h.y - wy);
        if (d <= h.r) { const pr = h.kind === 'part' ? 1000 : 0; if (d + pr < bd) { bd = d + pr; best = h; } }
      }
      return best;
    }
    showTip(id, x, y) {
      if (this.cfg.noTip) { this.tipEl.hidden = true; return; }
      if (!id) { this.tipEl.hidden = true; return; }
      const p = this.scene.parts.find((q) => q.id === id);
      if (!p) { this.tipEl.hidden = true; return; }
      const def = PT[p.type], b = this.bench;
      let html = `<b>${esc(def.label)}</b> ${esc(p.id)}${this.valueText(p)}`;
      if (!def.module && p.pins.length <= 2 && p.pins.every(Boolean)) {
        const v = b.v(p.pins[0]) - b.v(p.pins[1]), I = b.partCurrent(p);
        html += `<br>${EM.si(v, 'V', 3)} · ${EM.si(I, 'A', 3)}`;
      }
      if (p.dead) html += '<br><span class="bad">dañada</span>';
      this.tipEl.innerHTML = html;
      this.tipEl.hidden = false;
      this.tipEl.style.left = Math.min(x + 14, this.cv.w - 170) + 'px';
      this.tipEl.style.top = Math.max(4, y - 44) + 'px';
    }
    dragPot(d, wx, wy) {
      const p = this.scene.parts.find((q) => q.id === d.id);
      let a = Math.atan2(wy - d.cy, wx - d.cx);
      /* el rango útil es de −135° a +135° respecto de la vertical (ángulo −2.35…2.35 desde +x → ajustar) */
      let t = a + Math.PI / 2; /* 0 = arriba */
      if (t > Math.PI) t -= 2 * Math.PI;
      const pos = clamp((t + 2.35) / 4.7, 0, 1);
      p.pos = Math.round(pos * 200) / 200;
      this.touch();
    }
    dragDial(d, wx, wy) {
      const m = this.scene.meters.find((q) => q.id === d.id);
      let a = Math.atan2(wx - d.cx, -(wy - d.cy)) * 180 / Math.PI; if (a < 0) a += 360;
      let best = DW.DIAL[0], bd = 1e9;
      for (const q of DW.DIAL) { const dd = Math.min(Math.abs(q.ang - a), 360 - Math.abs(q.ang - a)); if (dd < bd) { bd = dd; best = q; } }
      if (best.mode !== m.mode) { m.mode = best.mode; this.rebuild(); }
    }
    dragProbe(d, wx, wy) {
      const m = this.scene.meters.find((q) => q.id === d.id);
      const tipKey = d.which === 'red' ? 'redTip' : 'blackTip';
      m[tipKey] = [wx, wy - 5];
      const hole = this.nearestHole(wx, wy - 5);
      this.snapHole = hole;
      this.sim.redraw();
    }
    dropProbe(d) {
      const m = this.scene.meters.find((q) => q.id === d.id);
      const tipKey = d.which === 'red' ? 'redTip' : 'blackTip';
      const h = this.snapHole;
      this.snapHole = null;
      if (h) { m[d.which] = h.ref; m[tipKey] = h.p.slice(); } else m[d.which] = null;
      this.rebuild();
    }
    nearestHole(wx, wy) {
      const sc = this.scene;
      if (this.mode === 'sch' && sc.sch) {
        let best = null, bd2 = 3.2 * 3.2;
        for (const p of sc.parts) { if (!sc.sch.parts[p.id]) continue; p.pins.forEach((r, k) => { if (!r) return; const q = DW.sch.termPos(sc, p.id, k); if (!q) return; const dd = (q[0] - wx) ** 2 + (q[1] - wy) ** 2; if (dd < bd2) { bd2 = dd; best = { ref: r, p: q }; } }); }
        for (const id in sc.sch.boxes || {}) { const bx = sc.sch.boxes[id]; for (const k in bx.pins) { const r = bx.refs && bx.refs[k]; if (!r) continue; const q = DW.sch.termPos(sc, id, k); const dd = (q[0] - wx) ** 2 + (q[1] - wy) ** 2; if (dd < bd2) { bd2 = dd; best = { ref: r, p: q }; } } }
        return best;
      }
      let best = null, bd = 2.6 * 2.6;
      for (const bd0 of sc.boards) {
        const lx = wx - bd0.x, ly = wy - bd0.y;
        const h = BB.nearest(bd0.kind, lx, ly, 2.6);
        if (h) { const [hx, hy] = BB.holePos(bd0.kind, h); const dd = (hx - lx) ** 2 + (hy - ly) ** 2; if (dd < bd) { bd = dd; best = { ref: bd0.id + ':' + h, p: [bd0.x + hx, bd0.y + hy] }; } }
      }
      for (const m of sc.mcus) {
        if (m.plug) continue;
        const spec = EM.mcu.boards[m.kind];
        for (const pn of spec.pins) {
          const [px, py] = EM.mcu.pinWorld(m, pn);
          const dd = (px - wx) ** 2 + (py - wy) ** 2;
          if (dd < bd) { bd = dd; best = { ref: m.id + ':' + pn.id, p: [px, py] }; }
        }
      }
      return best;
    }
  }
  const sp = EM.spice;
  /* formatos de lectura que evitan «7 nA» fantasmas */
  EM.fmtI = (i) => (Math.abs(i) < 5e-9 ? '0 mA' : EM.si(i, 'A', 3));
  EM.fmtV = (v) => (Math.abs(v) < 5e-6 ? '0 V' : EM.si(v, 'V', 3));
  EM.fmtP = (p) => (Math.abs(p) < 5e-9 ? '0 W' : EM.si(p, 'W', 3));

  EM.Lab = {
    /* cfg: {scene, code?, meter?, controls?, faults?, outs?, world?, aspect?, speeds?, hint?, focus?, sound?, volt?, labels?, noise?, wifi?} */
    mount(sim, cfg) { const lab = new Lab(sim, cfg); sim.lab = lab; return lab; }
  };
})();
