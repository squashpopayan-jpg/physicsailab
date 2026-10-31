/* ===================================================================
   20-sim.js — motor de simulaciones tipo juego
   FK.sim('nombre', (g) => { ... })  con g.canvas, g.slider, g.choice, g.button,
   g.toggle, g.out/show, g.say, g.goal, g.win, g.run, g.pointer
   =================================================================== */
(function () {
  'use strict';
  const FK = window.FK, M = FK.M;
  const LOGICAL_W = 800;
  const uid = (() => { let n = 0; return () => 'fk' + ++n; })();

  /* Observador de visibilidad compartido: las simulaciones sólo corren cuando se ven */
  const vis = new Map();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    for (const e of es) { const g = vis.get(e.target); if (g) g._setVisible(e.isIntersecting); }
  }, { rootMargin: '80px' }) : null;

  FK.winKey = (name) => 'win:' + name;
  FK.isWon = (name) => !!FK.store.get(FK.winKey(name), false);

  FK.mountSim = function (host) {
    if (host._mounted) return host._g;
    const name = host.dataset.sim, factory = FK.sims[name];
    const art = host.closest('article');
    const guide = host.dataset.guide || (art && art.dataset.guide) || 'buho';
    const fig = FK.el('figure', 'simbox');
    host._mounted = true;
    if (!factory) { fig.innerHTML = `<div class="sim-error">Falta la simulación «${name}».</div>`; host.replaceChildren(fig); return null; }
    const tips = host.querySelector('ul, ol');
    const goalText = host.dataset.goal || '';
    fig.innerHTML = `
      <div class="sim-head"><span class="sim-badge" aria-hidden="true">🎮</span><b class="sim-title">${host.dataset.title || name}</b><span class="sim-star" title="Reto superado">☆</span></div>
      <div class="sim-goal" ${goalText ? '' : 'hidden'}><span aria-hidden="true">🎯</span><span class="sim-goal-t">${goalText}</span></div>
      <div class="sim-say"><span class="sim-av">${FK.char(guide, 'happy', 46)}</span><div class="sim-bubble" aria-live="polite"></div></div>
      <div class="sim-stage"></div>
      <div class="sim-outs"></div>
      <div class="sim-ctrl"></div>
      <div class="sim-foot"><button type="button" class="btn ghost sim-reset">↺ Otra vez</button></div>`;
    const q = (s) => fig.querySelector(s);
    const stage = q('.sim-stage'), ctrl = q('.sim-ctrl'), outs = q('.sim-outs'), bubble = q('.sim-bubble'), av = q('.sim-av');
    if (tips) { const d = FK.el('details', 'sim-tips'); d.innerHTML = '<summary>💡 Prueba esto</summary>'; d.appendChild(tips); fig.appendChild(d); }
    host.replaceChildren(fig);

    const g = {
      name, guide, fig, stage, host, p: {}, t: 0, playing: true, speed: 1, W: LOGICAL_W, H: 450, ctx: null, cv: null,
      _vis: false, _dirty: true, _o: null, _raf: 0, _dead: false, _h: {}, _outs: {}, _sliders: {}, _ctl: ctrl
    };
    FK.activeSims = FK.activeSims || new Set();
    FK.activeSims.add(g);

    g._setVisible = function (v) { g._vis = v; if (!v && g._stopAudio) g._stopAudio(); if (v && g._o && !g._raf) g._start(); };
    g.dirty = () => { g._dirty = true; };

    /* ----- lienzo ----- */
    g.canvas = function (aspect = 16 / 9, o = {}) {
      const cv = FK.el('canvas', 'sim-canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', host.dataset.title || name);
      g.W = LOGICAL_W; g.H = Math.round(LOGICAL_W / aspect);
      stage.appendChild(cv);
      g.cv = cv; g.ctx = cv.getContext('2d');
      const fit = () => {
        const w = Math.max(160, Math.round(stage.clientWidth || cv.parentElement.clientWidth || 300));
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.style.height = Math.round((w * g.H) / g.W) + 'px';
        cv.width = Math.round(w * dpr); cv.height = Math.round(((w * g.H) / g.W) * dpr);
        g.ctx.setTransform((w * dpr) / g.W, 0, 0, (w * dpr) / g.W, 0, 0);
        g.dirty();
      };
      g._fit = fit;
      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage); else window.addEventListener('resize', fit);
      fit();
      return g.ctx;
    };
    /* Zona de HTML libre (juegos hechos con tarjetas y botones) */
    g.area = function (cls) { const d = FK.el('div', 'sim-area ' + (cls || '')); stage.appendChild(d); return d; };

    /* ----- controles ----- */
    const rowOf = (label, icon) => { const r = FK.el('div', 'ctl'); r.innerHTML = `<label>${icon ? `<span class="ctl-ic" aria-hidden="true">${icon}</span>` : ''}<span class="ctl-l">${label}</span></label>`; ctrl.appendChild(r); return r; };
    g.slider = function (key, o) {
      const id = uid();
      g.p[key] = o.value !== undefined ? o.value : o.min;
      const r = rowOf(o.label, o.icon);
      r.classList.add('ctl-slider');
      r.querySelector('label').setAttribute('for', id);
      const inp = FK.el('input'); inp.type = 'range'; inp.id = id;
      inp.min = o.min; inp.max = o.max; inp.step = o.step || 1; inp.value = g.p[key];
      const val = FK.el('output', 'ctl-v');
      const fmt = o.fmt || ((v) => FK.nice(v));
      const upd = () => { val.innerHTML = FK.supHtml(fmt(+inp.value) + (o.unit ? ' ' + o.unit : '')); const pct = ((+inp.value - o.min) / (o.max - o.min)) * 100; inp.style.setProperty('--pct', pct + '%'); };
      inp.addEventListener('input', () => {
        g.p[key] = +inp.value; upd(); g.dirty();
        if (o.onchange) o.onchange(g.p[key]);
        if (o.reset) g.restart();
      });
      r.append(inp, val); upd();
      g._sliders[key] = { inp, upd, o };
      return inp;
    };
    g.setSlider = function (key, v) { const s = g._sliders[key]; if (!s) return; s.inp.value = v; g.p[key] = +s.inp.value; s.upd(); g.dirty(); };
    g.choice = function (key, o) {
      g.p[key] = o.value !== undefined ? o.value : o.options[0][0];
      const r = rowOf(o.label, o.icon);
      r.classList.add('ctl-choice');
      const wrap = FK.el('div', 'chips');
      const btns = o.options.map(([v, lab, ic]) => {
        const b = FK.el('button', 'chip', `${ic ? `<span aria-hidden="true">${ic}</span>` : ''}${lab}`);
        b.type = 'button'; b.setAttribute('aria-pressed', v === g.p[key] ? 'true' : 'false');
        b.addEventListener('click', () => {
          g.p[key] = v; btns.forEach((x) => x.b.setAttribute('aria-pressed', x.v === v ? 'true' : 'false'));
          FK.sfx.tick(); g.dirty();
          if (o.onchange) o.onchange(v);
          if (o.reset) g.restart();
        });
        wrap.appendChild(b);
        return { b, v };
      });
      r.appendChild(wrap);
      g._h['choice_' + key] = (v) => { g.p[key] = v; btns.forEach((x) => x.b.setAttribute('aria-pressed', x.v === v ? 'true' : 'false')); g.dirty(); };
      return wrap;
    };
    g.setChoice = (key, v) => g._h['choice_' + key] && g._h['choice_' + key](v);
    g.toggle = function (key, o) {
      g.p[key] = !!o.value;
      const r = rowOf('', '');
      r.classList.add('ctl-toggle');
      const b = FK.el('button', 'switch', `<span class="knob"></span><span class="sw-l">${o.label}</span>`);
      b.type = 'button'; b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', g.p[key] ? 'true' : 'false');
      b.addEventListener('click', () => {
        g.p[key] = !g.p[key]; b.setAttribute('aria-checked', g.p[key] ? 'true' : 'false'); FK.sfx.tick(); g.dirty();
        if (o.onchange) o.onchange(g.p[key]);
        if (o.reset) g.restart();
      });
      r.appendChild(b);
      g._h['toggle_' + key] = (v) => { g.p[key] = v; b.setAttribute('aria-checked', v ? 'true' : 'false'); g.dirty(); };
      return b;
    };
    g.setToggle = (key, v) => g._h['toggle_' + key] && g._h['toggle_' + key](v);
    g.button = function (label, fn, o = {}) {
      let bar = ctrl.querySelector(':scope > .btnrow:last-child');
      if (!bar || o.newRow) { bar = FK.el('div', 'btnrow'); ctrl.appendChild(bar); }
      const b = FK.el('button', 'btn ' + (o.kind || 'primary'), `${o.icon ? `<span aria-hidden="true">${o.icon}</span> ` : ''}${label}`);
      b.type = 'button';
      b.addEventListener('click', (e) => { try { fn(e); } catch (er) { g.error(er); } g.dirty(); });
      bar.appendChild(b);
      return b;
    };
    /* Lecturas (cifras que cambian) */
    g.out = function (key, label, o = {}) {
      const c = FK.el('div', 'out' + (o.hl ? ' hl' : ''), `<span class="out-l">${o.icon ? `<span aria-hidden="true">${o.icon}</span> ` : ''}${label}</span><b class="out-v">—</b>`);
      outs.appendChild(c);
      g._outs[key] = c.querySelector('.out-v');
      return c;
    };
    g.show = function (key, text) { const e = g._outs[key]; const h = FK.supHtml(text); if (e && e._h !== h) { e._h = h; e.innerHTML = h; } };

    /* ----- mensajes y metas ----- */
    g.say = function (text, mood = 'happy', who) {
      bubble.innerHTML = text;
      av.innerHTML = FK.char(who || guide, mood, 46);
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    };
    g.goal = function (text) { const e = q('.sim-goal'); e.hidden = false; q('.sim-goal-t').innerHTML = text; };
    const starEl = q('.sim-star');
    const paintStar = () => { const w = FK.isWon(name); starEl.textContent = w ? '⭐' : '☆'; starEl.classList.toggle('on', w); };
    paintStar();
    g.won = () => FK.isWon(name);
    g.win = function (msg) {
      const first = !FK.isWon(name);
      if (first) {
        FK.store.set(FK.winKey(name), true); paintStar();
        FK.sfx.win(); FK.confetti(80);
        if (FK.updateProgress) FK.updateProgress();
        g.say(msg || '¡Reto superado! ¡Ganaste una estrella!', 'wow');
      } else {
        FK.sfx.ok(); g.say(msg || '¡Muy bien otra vez!', 'happy');
      }
      return first;
    };
    g.error = function (er) {
      console.error('[sim ' + name + ']', er);
      if (!fig.querySelector('.sim-error')) fig.appendChild(FK.el('div', 'sim-error', 'Error en la simulación «' + name + '»: ' + (er && er.message ? er.message : er)));
    };

    /* ----- bucle ----- */
    g.run = function (o) {
      g._o = o;
      try { if (o.init) o.init(); } catch (er) { g.error(er); }
      g.dirty();
      if (g._vis) g._start();
    };
    g.restart = function () {
      g.t = 0; g.playing = true;
      try { if (g._o && g._o.init) g._o.init(); } catch (er) { g.error(er); }
      g.dirty(); if (g._vis && !g._raf) g._start();
    };
    let last = 0;
    const frame = (now) => {
      if (!g._vis || g._dead || !document.body.contains(fig)) { g._raf = 0; return; }
      const dt = Math.min(0.05, (now - last) / 1000) * g.speed; last = now;
      const o = g._o;
      try {
        if (o.step && g.playing) { o.step(dt); g.t += dt; }
        if (o.draw && (!o.static || g._dirty || g.playing)) { g.ctx.save(); o.draw(g.ctx, g.W, g.H); g.ctx.restore(); g._dirty = false; }
      } catch (er) { g.error(er); g._raf = 0; return; }
      g._raf = requestAnimationFrame(frame);
    };
    g._start = function () { if (g._raf) return; last = performance.now(); g._raf = requestAnimationFrame(frame); };
    /* Para pruebas automáticas: avanza n pasos sin esperar al reloj */
    g._tick = function (n = 1, dt = 1 / 60) {
      const o = g._o; if (!o) return;
      for (let i = 0; i < n; i++) { if (o.step && g.playing) { o.step(dt); g.t += dt; } }
      if (o.draw && g.ctx) { g.ctx.save(); o.draw(g.ctx, g.W, g.H); g.ctx.restore(); }
    };

    /* ----- puntero (en coordenadas lógicas) ----- */
    g.pointer = function (h, target) {
      const cv = target || g.cv;
      cv.style.touchAction = 'none';
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) * g.W) / r.width, ((e.clientY - r.top) * g.H) / r.height]; };
      let down = false;
      cv.addEventListener('pointerdown', (e) => { down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* */ } const [x, y] = pos(e); if (h.down) h.down(x, y, e); g.dirty(); });
      cv.addEventListener('pointermove', (e) => { const [x, y] = pos(e); if (h.move) h.move(x, y, e, down); g.dirty(); });
      const up = (e) => { if (!down) return; down = false; const [x, y] = pos(e); if (h.up) h.up(x, y, e); g.dirty(); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    };

    q('.sim-reset').addEventListener('click', () => { FK.sfx.pop(); g.restart(); });

    host._g = g;
    try { factory(g); } catch (er) { g.error(er); }
    vis.set(fig, g);
    if (io) io.observe(fig); else g._setVisible(true);
    return g;
  };

  /* ===================================================================
     Kits de juegos hechos con tarjetas (sin lienzo)
     =================================================================== */
  const kit = (FK.kit = {});

  /* Une cada elemento de la izquierda con el de la derecha. pairs: [[izq, der], ...] (html) */
  kit.match = function (g, pairs, o = {}) {
    const area = g.area('kit-match');
    const L = M.shuffle(pairs.map((p, i) => ({ i, t: p[0] }))), R = M.shuffle(pairs.map((p, i) => ({ i, t: p[1] })));
    let selL = null, done = 0, errors = 0;
    area.innerHTML = '<div class="km-col km-l"></div><div class="km-col km-r"></div>';
    const cl = area.querySelector('.km-l'), cr = area.querySelector('.km-r');
    const mk = (it, col, side) => { const b = FK.el('button', 'km-card ' + side, it.t); b.type = 'button'; b.dataset.i = it.i; col.appendChild(b); it.b = b; };
    L.forEach((it) => mk(it, cl, 'l')); R.forEach((it) => mk(it, cr, 'r'));
    const click = (it, side) => {
      if (it.b.classList.contains('done')) return;
      if (side === 'l') { L.forEach((x) => x.b.classList.remove('sel')); selL = it; it.b.classList.add('sel'); FK.sfx.tick(); return; }
      if (!selL) { g.say(o.hint || 'Primero toca una tarjeta de la izquierda.', 'think'); return; }
      if (selL.i === it.i) {
        selL.b.classList.remove('sel'); selL.b.classList.add('done'); it.b.classList.add('done'); selL = null; done++; FK.sfx.ok();
        g.say('¡Correcto! ' + (o.okMsg || ''), 'happy');
        if (done === pairs.length) g.win(errors === 0 ? '¡Todo perfecto, sin errores!' : '¡Las uniste todas!');
      } else { errors++; it.b.classList.add('shake'); setTimeout(() => it.b.classList.remove('shake'), 400); FK.sfx.no(); g.say('Mmm, esa no. ¡Inténtalo otra vez!', 'sad'); }
    };
    L.forEach((it) => it.b.addEventListener('click', () => click(it, 'l')));
    R.forEach((it) => it.b.addEventListener('click', () => click(it, 'r')));
    g.run({ static: true, init() { done = 0; errors = 0; selL = null; area.querySelectorAll('.km-card').forEach((b) => b.classList.remove('done', 'sel')); g.say(o.start || 'Toca una tarjeta de la izquierda y luego la que le corresponde.'); } });
  };

  /* Ordena: el niño toca las tarjetas en el orden correcto. items en el orden CORRECTO. */
  kit.order = function (g, items, o = {}) {
    const area = g.area('kit-order');
    let next = 0, errors = 0;
    const deck = M.shuffle(items.map((t, i) => ({ i, t })));
    area.innerHTML = '<div class="ko-slots"></div><div class="ko-deck"></div>';
    const slots = area.querySelector('.ko-slots'), dk = area.querySelector('.ko-deck');
    items.forEach((_, i) => slots.appendChild(FK.el('div', 'ko-slot', `<span>${i + 1}</span>`)));
    deck.forEach((it) => { const b = FK.el('button', 'ko-card', it.t); b.type = 'button'; it.b = b; dk.appendChild(b);
      b.addEventListener('click', () => {
        if (b.classList.contains('used')) return;
        if (it.i === next) {
          b.classList.add('used'); const s = slots.children[next]; s.innerHTML = it.t; s.classList.add('full'); next++; FK.sfx.ok();
          g.say(next === items.length ? '' : (o.okMsg || '¡Bien! ¿Cuál sigue?'), 'happy');
          if (next === items.length) g.win(errors === 0 ? '¡En orden y sin errores!' : '¡Lo ordenaste!');
        } else { errors++; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); FK.sfx.no(); g.say('Esa no va todavía. ¡Piensa cuál fue antes!', 'think'); }
      }); });
    g.run({ static: true, init() { next = 0; errors = 0; deck.forEach((it) => it.b.classList.remove('used')); slots.querySelectorAll('.ko-slot').forEach((s, i) => { s.classList.remove('full'); s.innerHTML = `<span>${i + 1}</span>`; }); g.say(o.start || 'Toca las tarjetas en el orden correcto.'); } });
  };

  /* Clasifica: una tarjeta a la vez, el niño elige la caja. bins:[{id,label,icon}], items:[{t, bin}] */
  kit.sort = function (g, bins, items, o = {}) {
    const area = g.area('kit-sort');
    let order = [], k = 0, ok = 0, tries = 0;
    area.innerHTML = '<div class="ks-card"></div><div class="ks-bins"></div><div class="ks-count"></div>';
    const card = area.querySelector('.ks-card'), bb = area.querySelector('.ks-bins'), cnt = area.querySelector('.ks-count');
    bins.forEach((b) => { const x = FK.el('button', 'ks-bin', `<span class="ks-ic">${b.icon || ''}</span>${b.label}`); x.type = 'button'; x.addEventListener('click', () => pick(b.id)); bb.appendChild(x); });
    const show = () => {
      if (k >= order.length) { card.innerHTML = '🎉'; cnt.textContent = ''; const need = Math.ceil(order.length * (o.need || 0.8));
        if (ok >= need) g.win(ok === order.length ? '¡Todas bien!' : `¡${ok} de ${order.length}! ¡Muy bien!`); else g.say(`Acertaste ${ok} de ${order.length}. ¡Toca «Otra vez» para mejorar!`, 'think'); return; }
      card.innerHTML = order[k].t; card.classList.remove('bad', 'good'); cnt.textContent = `${k + 1} de ${order.length}`;
    };
    const pick = (id) => {
      if (k >= order.length) return;
      tries++;
      if (order[k].bin === id) { ok++; card.classList.add('good'); FK.sfx.ok(); g.say(order[k].why || '¡Sí!', 'happy'); } else { card.classList.add('bad'); FK.sfx.no(); const b = bins.find((x) => x.id === order[k].bin); g.say((order[k].why ? order[k].why + ' ' : '') + `Va en «${b.label}».`, 'sad'); }
      k++; setTimeout(show, 900);
    };
    g.run({ static: true, init() { order = M.shuffle(items); k = 0; ok = 0; tries = 0; g.say(o.start || 'Mira la tarjeta y elige a qué caja pertenece.'); show(); } });
  };
})();
