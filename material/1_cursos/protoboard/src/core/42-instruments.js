/* ===================================================================
   42-instruments.js — Caras de los instrumentos (EM.Inst): fuente de laboratorio, generador de
   funciones, multímetro y osciloscopio. Cada uno lee y escribe el estado de bench.inst.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, el = EM.el;
  const Inst = (EM.Inst = {});
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  Inst.TDIVS = [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5];
  Inst.VDIVS = [1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
  const fmtT = (t) => EM.si(t, 's', 2).replace('.0', ''), fmtV = (v) => EM.si(v, 'V', 2).replace('.0', '');

  const mk = (tag, cls, html) => el(tag, cls, html);
  const select = (opts, val, fn, cls) => { const s = document.createElement('select'); s.className = cls || 'bl-sel'; for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.append(o); } s.value = val; s.addEventListener('change', () => fn(s.value)); return s; };
  const field = (t, ctl, cls) => { const l = mk('label', 'bl-f' + (cls ? ' ' + cls : '')); l.append(mk('span', null, t), ctl); return l; };
  const btn = (t, fn, cls) => { const b = mk('button', 'bl-b' + (cls ? ' ' + cls : ''), t); b.type = 'button'; b.addEventListener('click', (e) => { e.preventDefault(); fn(e); }); return b; };

  /* ---------- Perilla giratoria (arrastre vertical, rueda, teclado) ---------- */
  function knob(o) {
    const wrap = mk('div', 'bl-knob');
    const cv = document.createElement('canvas'); const S = 58;
    cv.width = S * 2; cv.height = S * 2; cv.style.width = S + 'px'; cv.style.height = S + 'px'; cv.tabIndex = 0; cv.setAttribute('role', 'slider'); cv.setAttribute('aria-label', o.label);
    const lab = mk('div', 'bl-knob-l', o.label); const val = mk('div', 'bl-knob-v');
    wrap.append(cv, lab, val);
    let u = o.get(); /* 0..1 */
    const draw = () => {
      const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, S, S);
      const cx = S / 2, cy = S / 2;
      c.strokeStyle = 'rgba(150,160,170,.55)'; c.lineWidth = 1;
      for (let k = 0; k <= 10; k++) { const a = Math.PI * 0.75 + (k / 10) * Math.PI * 1.5; c.beginPath(); c.moveTo(cx + Math.cos(a) * 23, cy + Math.sin(a) * 23); c.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); c.stroke(); }
      const g = c.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, 21); g.addColorStop(0, '#6c717b'); g.addColorStop(0.6, '#2d3037'); g.addColorStop(1, '#16181c');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 20, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(cx, cy, 19.5, 0, TAU); c.stroke();
      const a = Math.PI * 0.75 + clamp(u, 0, 1) * Math.PI * 1.5;
      c.strokeStyle = o.color || '#f5f5f5'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); c.lineTo(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17); c.stroke();
    };
    const set = (nu, fire = true) => { u = clamp(nu, 0, 1); draw(); val.textContent = o.fmt(u); if (fire) o.set(u); };
    let y0 = 0, u0 = 0, drag = false;
    cv.addEventListener('pointerdown', (e) => { drag = true; y0 = e.clientY; u0 = u; cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    cv.addEventListener('pointermove', (e) => { if (drag) set(u0 + (y0 - e.clientY) / (e.shiftKey ? 600 : 160)); });
    cv.addEventListener('pointerup', () => { drag = false; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); set(u - Math.sign(e.deltaY) * (e.shiftKey ? 0.002 : 0.01)); }, { passive: false });
    cv.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(u + 0.01); e.preventDefault(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(u - 0.01); e.preventDefault(); } });
    set(u, false);
    return { el: wrap, set, refresh: () => { u = o.get(); set(u, false); } };
  }

  function lcd(lines, cls) { const d = mk('div', 'bl-lcd' + (cls ? ' ' + cls : '')); lines.forEach((l) => d.append(l)); return d; }

  /* ===================================================================
     Fuente de laboratorio: dos canales
     =================================================================== */
  Inst.psu = function (bench, host) {
    const root = mk('div', 'bl-inst bl-psu');
    root.append(mk('div', 'bl-iname', 'Fuente de laboratorio · 2 canales · 0–30 V / 0–3 A'));
    const row = mk('div', 'bl-chs'); root.append(row);
    const parts = [];
    [1, 2].forEach((ch) => {
      const st = bench.inst.ps[ch];
      const box = mk('div', 'bl-ch'); box.append(mk('div', 'bl-chn', 'CANAL ' + ch));
      const dv = mk('span', 'bl-dig', '0.00'), di = mk('span', 'bl-dig sm', '0.000');
      const dispV = mk('div', 'bl-line'); dispV.append(dv, mk('small', null, 'V'));
      const dispI = mk('div', 'bl-line'); dispI.append(di, mk('small', null, 'A'));
      const led = mk('span', 'bl-led', 'C.V.');
      const scr = lcd([dispV, dispI, led]);
      const kv = knob({ label: 'Tensión', color: '#ffd23a', get: () => st.v / 30, set: (u) => { st.v = Math.round(u * 30 * 100) / 100; bench.invalidate(); }, fmt: (u) => (u * 30).toFixed(2) + ' V' });
      const ki = knob({ label: 'Límite I', color: '#ff7a5c', get: () => Math.sqrt(st.ilim / 3), set: (u) => { st.ilim = Math.max(0.001, Math.round(u * u * 3 * 1000) / 1000); bench.invalidate(); }, fmt: (u) => (u * u * 3).toFixed(3) + ' A' });
      const on = btn('SALIDA: apagada', () => { st.on = !st.on; bench.invalidate(); upd(); }, 'bl-onoff');
      const upd = () => { on.textContent = 'SALIDA: ' + (st.on ? 'encendida' : 'apagada'); on.classList.toggle('on', st.on); };
      box.append(scr, mk('div', 'bl-knobs'), on);
      box.querySelector('.bl-knobs').append(kv.el, ki.el);
      row.append(box);
      parts.push({ dv, di, led, upd, kv, ki, ch });
      upd();
    });
    root.append(mk('div', 'bl-note', 'Las salidas están <b>flotantes</b>: ni «+» ni «−» están unidos a tierra (⏚). Conecte cables desde las tomas del banco a la protoboard. Con la salida apagada no hay tensión.'));
    return {
      el: root,
      update() { for (const p of parts) { const o = bench.psuOut(p.ch); p.dv.textContent = (o.on ? o.v : 0).toFixed(2); p.di.textContent = (o.on ? o.i : 0).toFixed(3); p.led.textContent = o.cc ? 'C.C.' : 'C.V.'; p.led.classList.toggle('cc', o.cc); } },
      refresh() { for (const p of parts) { p.upd(); p.kv.refresh(); p.ki.refresh(); } }
    };
  };

  /* ===================================================================
     Generador de funciones
     =================================================================== */
  Inst.fg = function (bench, host) {
    const root = mk('div', 'bl-inst bl-fg');
    root.append(mk('div', 'bl-iname', 'Generador de funciones · 1 mHz – 1 MHz · salida 50 Ω'));
    const st = bench.inst.fg;
    const dF = mk('span', 'bl-dig', ''), dA = mk('span', 'bl-dig sm', ''), dW = mk('small', null, '');
    const l1 = mk('div', 'bl-line'); l1.append(dF);
    const l2 = mk('div', 'bl-line'); l2.append(dA, dW);
    root.append(lcd([l1, l2], 'amber'));
    const waves = [['sin', '∿ Seno'], ['square', '⎍ Cuadrada'], ['tri', '△ Triángulo'], ['saw', '◿ Sierra'], ['pulse', '▯ Pulsos']];
    const wb = mk('div', 'bl-seg');
    const wbtn = waves.map(([k, t]) => { const b = btn(t, () => { st.wave = k; bench.invalidate(); upd(); }, 'seg'); wb.append(b); return [k, b]; });
    root.append(wb);
    const knobs = mk('div', 'bl-knobs');
    const lf = (u) => Math.pow(10, -3 + u * 9) / 1; /* 1 mHz … 1 MHz */
    const kf = knob({ label: 'Frecuencia', color: '#ffd23a', get: () => clamp((Math.log10(st.f) + 3) / 9, 0, 1), set: (u) => { st.f = +lf(u).toPrecision(3); bench.invalidate(); upd(); }, fmt: (u) => EM.si(lf(u), 'Hz', 3) });
    const ka = knob({ label: 'Amplitud pp', color: '#7cd6ff', get: () => clamp(Math.log10(st.amp * 2 / 0.01) / 3, 0, 1), set: (u) => { st.amp = +(Math.pow(10, u * 3) * 0.01 / 2).toPrecision(3); bench.invalidate(); upd(); }, fmt: (u) => EM.si(Math.pow(10, u * 3) * 0.01, 'Vpp', 3) });
    const ko = knob({ label: 'Desplazamiento DC', color: '#c4a1ff', get: () => (st.off + 10) / 20, set: (u) => { st.off = +(u * 20 - 10).toFixed(2); bench.invalidate(); upd(); }, fmt: (u) => (u * 20 - 10).toFixed(2) + ' V' });
    const kd = knob({ label: 'Ciclo de trabajo', color: '#9dffa6', get: () => (st.duty - 0.01) / 0.98, set: (u) => { st.duty = +(0.01 + u * 0.98).toFixed(2); bench.invalidate(); upd(); }, fmt: (u) => Math.round((0.01 + u * 0.98) * 100) + ' %' });
    knobs.append(kf.el, ka.el, ko.el, kd.el); root.append(knobs);
    const on = btn('SALIDA', () => { st.on = !st.on; bench.invalidate(); upd(); }, 'bl-onoff');
    root.append(on);
    root.append(mk('div', 'bl-note', 'La amplitud se indica <b>pico a pico, sin carga</b>. El generador tiene 50 Ω de salida: con una carga de 50 Ω la señal baja a la mitad. Su borne «GND» está conectado a tierra.'));
    function upd() {
      dF.textContent = EM.si(st.f, 'Hz', 4); dA.textContent = (st.amp * 2).toPrecision(3); dW.textContent = ' Vpp  ' + (st.off ? '· DC ' + st.off.toFixed(2) + ' V ' : '') + (st.wave === 'pulse' || st.wave === 'square' ? '· ' + Math.round(st.duty * 100) + ' %' : '');
      wbtn.forEach(([k, b]) => b.classList.toggle('on', st.wave === k)); on.classList.toggle('on', st.on); on.textContent = 'SALIDA: ' + (st.on ? 'encendida' : 'apagada');
    }
    upd();
    return { el: root, update() {}, refresh() { upd(); kf.refresh(); ka.refresh(); ko.refresh(); kd.refresh(); } };
  };

  /* ===================================================================
     Multímetro digital
     =================================================================== */
  const DMM_POS = [['V=', 'V⎓', -2.2], ['V~', 'V~', -1.45], ['Ω', 'Ω', -0.7], ['·)))', '·))', 0.0], ['→|', '→|', 0.7], ['A~', 'A~', 1.45], ['A=', 'A⎓', 2.2]];
  Inst.dmm = function (bench, host) {
    const root = mk('div', 'bl-inst bl-dmm');
    root.append(mk('div', 'bl-iname', 'Multímetro digital · 3½ dígitos · 10 MΩ'));
    const st = bench.inst.dmm;
    const txt = mk('span', 'bl-dig big', '0.000'), unit = mk('small', 'bl-unit', 'V'), tag = mk('small', 'bl-tag', '');
    const l1 = mk('div', 'bl-line'); l1.append(txt, unit);
    const screen = lcd([l1, tag], 'dmm');
    const note = mk('div', 'bl-dnote', '');
    root.append(screen, note);
    /* selector giratorio */
    const dial = mk('div', 'bl-dial');
    const dc = document.createElement('canvas'); const Sz = 150; dc.width = Sz * 2; dc.height = Sz * 2; dc.style.width = Sz + 'px'; dc.style.height = Sz + 'px'; dc.tabIndex = 0; dc.setAttribute('aria-label', 'Selector de función del multímetro');
    dial.append(dc); root.append(dial);
    const drawDial = () => {
      const c = dc.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, Sz, Sz);
      const cx = Sz / 2, cy = Sz / 2 + 4;
      const cur = DMM_POS.find((p) => p[0] === st.mode);
      c.fillStyle = '#d4a017'; c.font = '700 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const [m, t, a] of DMM_POS) { const ang = a - Math.PI / 2; const on = m === st.mode; c.fillStyle = on ? (EM.isDark() ? '#ffd23a' : '#b36b00') : (EM.isDark() ? 'rgba(210,214,222,.9)' : 'rgba(40,50,66,.9)'); c.fillText(t, cx + Math.cos(ang) * 58, cy + Math.sin(ang) * 58); }
      const g = c.createRadialGradient(cx - 8, cy - 9, 3, cx, cy, 40); g.addColorStop(0, '#6c717b'); g.addColorStop(0.7, '#2c2f36'); g.addColorStop(1, '#15171b');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 38, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(cx, cy, 37, 0, TAU); c.stroke();
      const a = (cur ? cur[2] : 0) - Math.PI / 2;
      c.save(); c.translate(cx, cy); c.rotate(a); c.fillStyle = '#e9ebef'; c.beginPath(); c.moveTo(0, -4); c.lineTo(36, -2.2); c.lineTo(36, 2.2); c.lineTo(0, 4); c.closePath(); c.fill(); c.restore();
      c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
    };
    dc.addEventListener('pointerdown', (e) => {
      const r = dc.getBoundingClientRect(); const x = (e.clientX - r.left) - Sz / 2, y = (e.clientY - r.top) - (Sz / 2 + 4);
      const ang = Math.atan2(y, x) + Math.PI / 2; /* 0 = arriba */
      let best = null, bd = 9;
      for (const p of DMM_POS) { const d = Math.abs(Math.atan2(Math.sin(ang - p[2]), Math.cos(ang - p[2]))); if (d < bd) { bd = d; best = p; } }
      if (best) { st.mode = best[0]; bench.invalidate(); upd(); }
    });
    dc.addEventListener('keydown', (e) => { const i = DMM_POS.findIndex((p) => p[0] === st.mode); if (e.key === 'ArrowRight') { st.mode = DMM_POS[Math.min(DMM_POS.length - 1, i + 1)][0]; bench.invalidate(); upd(); } if (e.key === 'ArrowLeft') { st.mode = DMM_POS[Math.max(0, i - 1)][0]; bench.invalidate(); upd(); } });
    /* tomas de la punta roja */
    const jacks = mk('div', 'bl-jk'); jacks.append(mk('span', null, 'Punta roja en la toma:'));
    const jb = [['v', 'V Ω'], ['ma', 'mA'], ['a10', '10 A']].map(([k, t]) => { const b = btn(t, () => { st.jack = k; bench.invalidate(); upd(); }, 'jk'); jacks.append(b); return [k, b]; });
    root.append(jacks);
    const fuses = mk('div', 'bl-fuse');
    const fb = btn('Cambiar fusible', () => { st.blown = { ma: false, a10: false }; bench.invalidate(); upd(); }, 'bl-small');
    fuses.append(mk('span', 'bl-fl', ''), fb); root.append(fuses);
    root.append(mk('div', 'bl-note', 'El voltímetro se pone <b>en paralelo</b>; el amperímetro, <b>en serie</b> (abra el circuito). El ohmímetro solo se usa con el circuito <b>apagado</b>. Con la punta roja en «mA» o «10 A» el multímetro es casi un cable: no mida tensión así.'));
    function upd() {
      drawDial();
      jb.forEach(([k, b]) => b.classList.toggle('on', st.jack === k));
      const fl = fuses.querySelector('.bl-fl'); const bl = st.blown.ma || st.blown.a10;
      fl.textContent = bl ? '⚠ Fusible(s) fundido(s): ' + [st.blown.ma ? '0,2 A (mA)' : '', st.blown.a10 ? '10 A' : ''].filter(Boolean).join(' y ') : 'Fusibles: 0,2 A (mA) · 10 A — en buen estado';
      fl.classList.toggle('bad', bl); fb.hidden = !bl;
    }
    upd();
    let beepOn = false;
    return {
      el: root, upd,
      update() {
        const r = bench.readDMM();
        txt.textContent = r.text; unit.textContent = r.unit || ''; tag.textContent = ({ 'V=': 'DC', 'V~': 'AC rms', 'A=': 'DC', 'A~': 'AC rms', 'Ω': '', '→|': 'diodo', '·)))': 'continuidad' })[r.mode] || '';
        note.textContent = r.note || ''; note.classList.toggle('bad', !!r.warn || /fusible/i.test(r.note || ''));
        screen.classList.toggle('beep', !!r.beep);
        if (r.beep !== beepOn) { beepOn = r.beep; if (EM.beep) EM.beep(r.beep ? 2400 : 0); }
      },
      refresh() { upd(); }
    };
  };

  /* ===================================================================
     Osciloscopio de dos canales
     =================================================================== */
  Inst.scope = function (bench, host, sim) {
    const root = mk('div', 'bl-inst bl-osc');
    root.append(mk('div', 'bl-iname', 'Osciloscopio · 2 canales · 8 × 10 divisiones'));
    const I = bench.inst.osc;
    const cvo = sim.canvas({ parent: root, aspect: 1.55, cls: 'bl-scr', label: 'Pantalla del osciloscopio', optional: true });
    const meas = mk('div', 'bl-meas'); root.append(meas);
    const ctl = mk('div', 'bl-octl'); root.append(ctl);
    const colors = ['#ffd23a', '#38d9ff'];
    const chBoxes = [0, 1].map((k) => {
      const c = I.ch[k], box = mk('div', 'bl-och'); box.style.setProperty('--chc', colors[k]);
      box.append(mk('div', 'bl-ocht', 'CANAL ' + (k + 1)));
      const on = mk('input'); on.type = 'checkbox'; on.checked = c.on; on.addEventListener('change', () => { c.on = on.checked; });
      const lon = mk('label', 'bl-chk'); lon.append(on, mk('span', null, 'Visible'));
      const vd = select(Inst.VDIVS.map((v) => [v, fmtV(v) + '/div']), c.vdiv, (v) => { c.vdiv = +v; });
      const pos = mk('input'); pos.type = 'range'; pos.min = -4; pos.max = 4; pos.step = 0.05; pos.value = c.pos; pos.addEventListener('input', () => { c.pos = +pos.value; });
      const cp = select([['dc', 'DC'], ['ac', 'AC'], ['gnd', 'GND']], c.cpl, (v) => { c.cpl = v; });
      const sw = select([[1, '×1'], [10, '×10']], c.sw, (v) => { c.sw = +v; bench.invalidate(); });
      const st = select([[1, '×1'], [10, '×10']], c.set, (v) => { c.set = +v; });
      box.append(lon, field('Escala vertical', vd), field('Posición', pos), field('Acoplamiento', cp), field('Interruptor de la punta', sw), field('Punta (menú del osciloscopio)', st));
      return box;
    });
    const common = mk('div', 'bl-och');
    common.append(mk('div', 'bl-ocht', 'HORIZONTAL · DISPARO'));
    const td = select(Inst.TDIVS.map((t) => [t, fmtT(t) + '/div']), I.tdiv, (v) => { bench.setTdiv(+v); I.tdiv = +v; });
    const mode = select([['yt', 'Y–T'], ['xy', 'X–Y']], I.mode, (v) => { I.mode = v; });
    const src = select([[0, 'Canal 1'], [1, 'Canal 2']], I.trig.src, (v) => { I.trig.src = +v; });
    const slope = select([['up', 'Subida ↗'], ['down', 'Bajada ↘']], I.trig.slope, (v) => { I.trig.slope = v; });
    const tm = select([['auto', 'Automático'], ['normal', 'Normal']], I.trig.mode, (v) => { I.trig.mode = v; });
    const lvl = mk('input'); lvl.type = 'range'; lvl.min = -4; lvl.max = 4; lvl.step = 0.05; lvl.value = I.trig.level; lvl.addEventListener('input', () => { I.trig.level = +lvl.value; });
    const hold = btn('Congelar', () => { I.hold = !I.hold; hold.classList.toggle('on', I.hold); if (!I.hold) frozen = null; }, 'bl-small');
    const auto = btn('Autoajuste', () => autoset(), 'bl-small');
    common.append(field('Base de tiempo', td), field('Modo', mode), field('Fuente de disparo', src), field('Flanco', slope), field('Nivel (div.)', lvl), field('Modo de disparo', tm), mk('div', 'bl-row', ''));
    common.lastChild.append(hold, auto);
    ctl.append(chBoxes[0], chBoxes[1], common);
    let frozen = null, lastHold = null;
    const chans = () => [0, 1].filter((k) => I.ch[k].on);

    function autoset() {
      const s = EM.sigStats(bench.rings.c1.last(bench.N * 3), bench.dt) || null;
      const ref = s && isFinite(s.f) ? s : EM.sigStats(bench.rings.c2.last(bench.N * 3), bench.dt);
      if (ref && isFinite(ref.f)) {
        const want = 3 / ref.f / 10; let best = Inst.TDIVS[0];
        for (const t of Inst.TDIVS) if (t <= want * 1.2) best = t;
        bench.setTdiv(best); I.tdiv = best; td.value = best;
      }
      [0, 1].forEach((k) => {
        const r = EM.sigStats(bench.rings['c' + (k + 1)].last(bench.N), bench.dt);
        if (!r) return;
        const need = Math.max(r.pp, 0.01) / 6; let best = Inst.VDIVS[0];
        for (const v of Inst.VDIVS) if (v <= need * 1.4) best = v;
        I.ch[k].vdiv = best; I.ch[k].pos = -Math.round((r.mx + r.mn) / 2 / best); chBoxes[k].querySelectorAll('select')[0].value = best; chBoxes[k].querySelector('input[type=range]').value = I.ch[k].pos;
      });
    }

    function window_(N) {
      const src = I.trig.src, r = bench.rings['c' + (src + 1)];
      const total = Math.min(r.count(), N * 3);
      const all = r.last(total);
      const c = I.ch[src], scale = c.set / c.sw;
      if (all.length < N) return { start: 0, n: all.length, total, trig: false };
      const lev = I.trig.level * c.vdiv / scale + (c.cpl === 'ac' ? meanOf(all, N) : 0);
      let start = all.length - N, found = false;
      const hi = all.length - Math.floor(N * 0.9), lo = Math.floor(N * 0.1);
      for (let i = hi; i >= lo; i--) {
        const a = all[i - 1], b = all[i];
        if (I.trig.slope === 'up' ? (a < lev && b >= lev) : (a > lev && b <= lev)) { start = i - Math.floor(N * 0.1); found = true; break; }
      }
      return { start, n: N, total, trig: found, all };
    }
    const meanOf = (a, N) => { let s = 0; const n = Math.min(N, a.length); for (let i = a.length - n; i < a.length; i++) s += a[i]; return s / n; };

    function chData(k, w, N) {
      const r = bench.rings['c' + (k + 1)], total = w.total, all = r.last(total);
      const seg = all.subarray(Math.max(0, w.start), Math.max(0, w.start) + N);
      return seg;
    }
    function draw() {
      const c = cvo.ctx, w = cvo.w, h = cvo.h; if (!w || !h) return;
      const N = bench.N;
      c.save();
      c.fillStyle = '#07110a'; c.fillRect(0, 0, w, h);
      const m = { l: 8, r: 8, t: 8, b: 20 }, gx = m.l, gy = m.t, gw = w - m.l - m.r, gh = h - m.t - m.b;
      c.strokeStyle = 'rgba(90,200,100,.22)'; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i <= 10; i++) { const x = Math.round(gx + gw * i / 10) + 0.5; c.moveTo(x, gy); c.lineTo(x, gy + gh); }
      for (let j = 0; j <= 8; j++) { const y = Math.round(gy + gh * j / 8) + 0.5; c.moveTo(gx, y); c.lineTo(gx + gw, y); }
      c.stroke(); c.strokeStyle = 'rgba(120,230,130,.4)'; c.beginPath(); c.moveTo(gx, gy + gh / 2 + 0.5); c.lineTo(gx + gw, gy + gh / 2 + 0.5); c.moveTo(gx + gw / 2 + 0.5, gy); c.lineTo(gx + gw / 2 + 0.5, gy + gh); c.stroke();
      c.strokeStyle = 'rgba(120,230,130,.2)';
      for (let i = 0; i < 50; i++) { const x = gx + gw * i / 50; c.beginPath(); c.moveTo(x, gy + gh / 2 - 3); c.lineTo(x, gy + gh / 2 + 3); c.stroke(); }
      for (let j = 0; j < 40; j++) { const y = gy + gh * j / 40; c.beginPath(); c.moveTo(gx + gw / 2 - 3, y); c.lineTo(gx + gw / 2 + 3, y); c.stroke(); }
      c.save(); c.beginPath(); c.rect(gx, gy, gw, gh); c.clip();
      const W = frozen || window_(N);
      if (I.hold && !frozen && W) frozen = W;
      const dt = bench.dt;
      const data = {};
      for (const k of chans()) { const ch = I.ch[k]; const raw = W && W.total ? chData(k, W, N) : new Float32Array(0); data[k] = raw; }
      const scaleOf = (k) => I.ch[k].set / I.ch[k].sw;
      const val = (k, v, mean) => { const ch = I.ch[k]; if (ch.cpl === 'gnd') return 0; return (ch.cpl === 'ac' ? v - mean : v) * scaleOf(k); };
      const meanOfK = {};
      for (const k of chans()) meanOfK[k] = (() => { const a = data[k]; if (!a.length) return 0; let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; })();
      if (I.mode === 'xy' && chans().length === 2 && data[0].length) {
        c.strokeStyle = '#7dff9a'; c.lineWidth = 1.6; c.beginPath();
        const n = Math.min(data[0].length, data[1].length);
        for (let i = 0; i < n; i++) {
          const x = gx + gw / 2 + (val(0, data[0][i], meanOfK[0]) / I.ch[0].vdiv + I.ch[0].pos) * gw / 10 * 1, y = gy + gh / 2 - (val(1, data[1][i], meanOfK[1]) / I.ch[1].vdiv + I.ch[1].pos) * gh / 8;
          i ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      } else {
        for (const k of chans()) {
          const a = data[k], ch = I.ch[k];
          c.strokeStyle = colors[k]; c.lineWidth = 1.7; c.shadowColor = colors[k]; c.shadowBlur = 4; c.beginPath();
          const n = a.length;
          for (let i = 0; i < n; i++) {
            const x = gx + (i / (N - 1)) * gw, y = gy + gh / 2 - (val(k, a[i], meanOfK[k]) / ch.vdiv + ch.pos) * gh / 8;
            i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke(); c.shadowBlur = 0;
        }
        /* marcas de nivel de tierra */
        for (const k of chans()) { const ch = I.ch[k]; const y = gy + gh / 2 - ch.pos * gh / 8; c.fillStyle = colors[k]; c.beginPath(); c.moveTo(gx, y); c.lineTo(gx + 7, y - 4); c.lineTo(gx + 7, y + 4); c.fill(); c.font = '9px sans-serif'; c.fillText(String(k + 1), gx + 8, y - 1); }
        /* disparo */
        const tc = I.ch[I.trig.src]; const ty = gy + gh / 2 - I.trig.level * gh / 8; c.fillStyle = colors[I.trig.src]; c.beginPath(); c.moveTo(gx + gw, ty); c.lineTo(gx + gw - 7, ty - 4); c.lineTo(gx + gw - 7, ty + 4); c.fill(); void tc;
      }
      c.restore();
      c.font = `11px ${EM.FONT_MONO}`; c.textBaseline = 'alphabetic';
      let tx = gx;
      for (const k of chans()) { const ch = I.ch[k]; c.fillStyle = colors[k]; const s = `CH${k + 1} ${fmtV(ch.vdiv)}/div${ch.cpl === 'ac' ? ' ~' : ch.cpl === 'gnd' ? ' ⏚' : ''}${ch.set !== 1 ? ' ×' + ch.set : ''}`; c.fillText(s, tx, h - 6); tx += c.measureText(s).width + 14; }
      c.fillStyle = '#9fe6ad'; const s2 = `${fmtT(I.tdiv)}/div  ${I.hold ? 'CONGELADO' : (W && W.trig ? 'DISPARADO' : I.trig.mode === 'auto' ? 'AUTO' : 'ESPERA')}`; c.textAlign = 'right'; c.fillText(s2, gx + gw, h - 6); c.textAlign = 'left';
      c.restore();
      /* mediciones */
      if (!draw.t || performance.now() - draw.t > 250) {
        draw.t = performance.now();
        meas.innerHTML = '';
        for (const k of chans()) {
          const a = data[k]; if (!a || !a.length) continue;
          const sc = scaleOf(k);
          const r = EM.sigStats(a, dt); if (!r) continue;
          const row = mk('div', 'bl-mrow'); row.style.setProperty('--chc', colors[k]);
          const mean = r.mean * sc, ppv = r.pp * sc, rms = r.rms * sc;
          row.innerHTML = `<b>CH${k + 1}</b><span>Vpp ${EM.si(ppv, 'V', 3)}</span><span>Vmed ${EM.si(mean, 'V', 3)}</span><span>Vrms ${EM.si(rms, 'V', 3)}</span><span>${isFinite(r.f) ? 'f ' + EM.si(r.f, 'Hz', 4) + ' · T ' + EM.si(r.T, 's', 3) : 'f —'}</span><span>${isFinite(r.duty) ? 'ciclo ' + Math.round(r.duty * 100) + ' %' : ''}</span>`;
          meas.append(row);
        }
      }
    }
    return { el: root, update() {}, draw, autoset, refresh() { td.value = I.tdiv; } };
  };


  /* ===================================================================
     Transformador reductor (secundario aislado)
     =================================================================== */
  Inst.ac = function (bench, host) {
    const root = mk('div', 'bl-inst bl-ac');
    root.append(mk('div', 'bl-iname', 'Transformador reductor · secundario aislado · 60 Hz'));
    const st = bench.inst.ac;
    const sel = select([[6, '6 V ~'], [9, '9 V ~'], [12, '12 V ~'], [15, '15 V ~'], [18, '18 V ~'], [24, '24 V ~']], st.vrms, (v) => { st.vrms = +v; bench.invalidate(); upd(); });
    const disp = mk('div', 'bl-note', '');
    root.append(field('Tensión eficaz en vacío', sel), disp);
    const upd = () => { disp.innerHTML = 'Valor <b>eficaz</b> ' + st.vrms + ' V → <b>pico</b> ' + (st.vrms * Math.SQRT2).toFixed(1) + ' V, 60 Hz. Resistencia del bobinado ≈ ' + st.rs + ' Ω (la tensión baja al tomar corriente) y fusible térmico: más de ≈ 1 A lo daña. El secundario está <b>aislado</b>: ninguna de las dos tomas está unida a tierra. Conéctelo siempre a un rectificador antes de alimentar un circuito.'; };
    upd();
    return { el: root, update() {}, refresh() { sel.value = st.vrms; upd(); } };
  };

  /* ===================================================================
     Contenedor con pestañas
     =================================================================== */
  Inst.mount = function (bench, parent, sim, which) {
    const box = mk('div', 'bl-insts');
    const tabs = mk('div', 'bl-itabs'), body = mk('div', 'bl-ibody');
    box.append(tabs, body); parent.append(box);
    const defs = { psu: ['Fuente', Inst.psu], ac: ['Transformador', Inst.ac], fg: ['Generador', Inst.fg], dmm: ['Multímetro', Inst.dmm], scope: ['Osciloscopio', Inst.scope] };
    const list = [];
    for (const k of which) {
      if (!defs[k]) continue;
      const o = defs[k][1](bench, body, sim); o.id = k;
      const b = btn(defs[k][0], () => show(o), 'bl-itab'); o.tab = b; tabs.append(b); o.el.hidden = true; body.append(o.el); list.push(o);
    }
    let cur = null;
    function show(o) { list.forEach((q) => { q.el.hidden = q !== o; q.tab.classList.toggle('on', q === o); }); cur = o; sim._resize && sim._resize(); sim.redraw(); }
    if (list.length) show(list.find((o) => o.id === 'dmm') || list[0]);
    if (list.length < 2) tabs.hidden = true;
    let acc = 0;
    return {
      el: box, list, show: (id) => { const o = list.find((q) => q.id === id); if (o) show(o); },
      get(id) { return list.find((q) => q.id === id); },
      update(dt) { acc += dt; if (acc > 0.1) { acc = 0; for (const o of list) if (!o.el.hidden && o.update) o.update(); } },
      draw() { for (const o of list) if (!o.el.hidden && o.draw) o.draw(); },
      refresh() { for (const o of list) if (o.refresh) o.refresh(); }
    };
  };
})();
