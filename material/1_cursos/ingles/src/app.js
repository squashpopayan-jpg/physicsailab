/* Quantum Leap English — motor de la aplicación.
   Contenido: window.QLE_LEVELS (src/content/NN-*.js) y window.QLE_EXTRA (src/content/90-extra.js). */
(function () {
  'use strict';

  const LEVELS = window.QLE_LEVELS || [];
  const X = window.QLE_EXTRA || {};
  const PASS = 0.7;          // nota mínima de la práctica para completar la unidad
  const NEW_PER_DAY = 12;    // tarjetas nuevas por día en el repaso
  const IV = [0, 1, 2, 4, 8, 16, 32, 64, 120]; // intervalos (días) por caja Leitner
  const STEPS = [
    { k: 'learn', n: 'Entiende' }, { k: 'vocab', n: 'Vocabulario' }, { k: 'phrases', n: 'Frases' },
    { k: 'practice', n: 'Practica' }, { k: 'listen', n: 'Escucha' }, { k: 'talk', n: 'Conversa' }, { k: 'links', n: 'Recursos' },
  ];
  const UNITS = [], UNIT = {};
  LEVELS.forEach((L, li) => {
    L.li = li;
    L.units.forEach((u, ui) => { u.level = L; u.ui = ui; u.id = L.id + '-' + (ui + 1); u.gi = UNITS.length; UNITS.push(u); UNIT[u.id] = u; });
  });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (x) => Math.round(x * 100);

  const I = {
    play: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
    check: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    right: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    left: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3.5M7 4.5 3.5 8 7 11.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gear: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.6-2-3.4-2.4.9a7.6 7.6 0 0 0-2.6-1.5L14 2.4h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.4l-2.4-.9-2 3.4 2 1.6a7.7 7.7 0 0 0 0 3l-2 1.6 2 3.4 2.4-.9a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4.9 2-3.4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    spark: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l1.6 4.3 4.4 1.7-4.4 1.7L8 13.5 6.4 9.2 2 7.5l4.4-1.7z" fill="currentColor"/></svg>',
    ext: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v4H2.5V4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    stop: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor"/></svg>',
  };
  const photonSVG = (color) => `<svg class="photon" viewBox="0 0 180 60" aria-hidden="true"><path d="M0 30 ${Array.from({ length: 18 }, (_, i) => `Q ${i * 10 + 5} ${i % 2 ? 48 : 12} ${i * 10 + 10} 30`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><path d="M168 22l10 8-10 8" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* ================= Estado y progreso ================= */
  const LS_KEY = 'qle-progress-v1';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayNum = (s) => { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const freshDaily = () => ({ day: today(), reviews: 0, newSeen: 0, steps: 0, talk: false, listen: false });
  function blank() {
    return { v: 1, updatedAt: 0, placement: null, units: {}, srs: {}, custom: [], daily: freshDaily(), streak: { last: null, count: 0, best: 0 }, settings: { rate: 0.95, voice: '', dir: 'es-en', autoSpeak: true }, last: null };
  }
  function fix(o) {
    const b = blank();
    o = Object.assign(b, o || {});
    o.settings = Object.assign(blank().settings, o.settings || {});
    o.streak = Object.assign(blank().streak, o.streak || {});
    o.daily = Object.assign(freshDaily(), o.daily || {});
    if (o.daily.day !== today()) o.daily = freshDaily();
    return o;
  }
  let S = (() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) return fix(JSON.parse(raw)); } catch (e) { /* sin almacenamiento */ } return blank(); })();

  function save() {
    S.updatedAt = Date.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ }
    Cloud.schedule();
  }
  function rollDay() { if (S.daily.day !== today()) S.daily = freshDaily(); }
  function activity(kind) {
    rollDay();
    const t = today();
    if (S.streak.last !== t) {
      S.streak.count = (S.streak.last && dayNum(S.streak.last) === dayNum(t) - 1) ? S.streak.count + 1 : 1;
      S.streak.last = t;
      S.streak.best = Math.max(S.streak.best || 0, S.streak.count);
    }
    if (kind === 'step') S.daily.steps++;
    if (kind === 'review') S.daily.reviews++;
    if (kind === 'talk') S.daily.talk = true;
    if (kind === 'listen') S.daily.listen = true;
    save();
  }
  const streakNow = () => (S.streak.last && dayNum(today()) - dayNum(S.streak.last) <= 1) ? S.streak.count : 0;

  const up = (id) => S.units[id] || (S.units[id] = { steps: {}, best: 0 });
  const unitDone = (id) => !!(S.units[id] && S.units[id].done);
  const unitFrac = (id) => { const p = S.units[id]; return p ? STEPS.filter((s) => p.steps[s.k]).length / STEPS.length : 0; };
  function markStep(u, k) {
    const p = up(u.id);
    if (!p.steps[k]) { p.steps[k] = 1; activity('step'); }
    checkUnit(u);
    save();
  }
  function checkUnit(u) {
    const p = up(u.id);
    if (!p.done && STEPS.every((s) => p.steps[s.k]) && (p.best || 0) >= PASS) {
      p.done = true; p.doneAt = today();
      const nx = UNITS[u.gi + 1];
      const lvlDone = u.level.units.every((x) => unitDone(x.id));
      toast(lvlDone ? `Nivel ${u.level.code} completado. Salto a n = ${u.level.n + 1}.` : `Unidad completada${nx ? ' · Siguiente: ' + nx.title : ''}`, true);
    }
  }
  function startIndex() {
    if (!S.placement) return 0;
    const i = UNITS.findIndex((u) => u.level.id === S.placement.level);
    return i < 0 ? 0 : i;
  }
  function contUnit() {
    if (S.last && UNIT[S.last.unit] && !unitDone(S.last.unit)) return UNIT[S.last.unit];
    for (let i = startIndex(); i < UNITS.length; i++) if (!unitDone(UNITS[i].id)) return UNITS[i];
    for (let i = 0; i < UNITS.length; i++) if (!unitDone(UNITS[i].id)) return UNITS[i];
    return null;
  }
  function nextStepOf(u) {
    const p = S.units[u.id];
    if (S.last && S.last.unit === u.id && !(p && p.steps[S.last.step])) return S.last.step;
    const s = STEPS.find((x) => !(p && p.steps[x.k]));
    return s ? s.k : 'learn';
  }

  /* ---------- Repetición espaciada (Leitner) ---------- */
  function cardsOf(u) {
    return u.vocab.map((v, i) => ({ id: u.id + ':v' + i, en: v[0], es: v[1], ex: v[2] || '', src: u }))
      .concat(u.phrases.map((p, i) => ({ id: u.id + ':p' + i, en: p[0], es: p[1], ex: '', src: u })));
  }
  function cardMap() {
    const m = {};
    UNITS.forEach((u) => cardsOf(u).forEach((c) => { m[c.id] = c; }));
    (S.custom || []).forEach((c) => { m['c:' + c.id] = { id: 'c:' + c.id, en: c.en, es: c.es, ex: c.note || '', src: null }; });
    return m;
  }
  function enroll(u) {
    let n = 0;
    cardsOf(u).forEach((c) => { if (!S.srs[c.id]) { S.srs[c.id] = { b: 0, d: 0 }; n++; } });
    if (n) save();
  }
  function dueInfo() {
    rollDay();
    const t = dayNum(today()), m = cardMap(), due = [], fresh = [];
    for (const id in S.srs) {
      const c = m[id]; if (!c) continue;
      const r = S.srs[id];
      if (r.b === 0) fresh.push(c); else if (r.d <= t) due.push(c);
    }
    const left = Math.max(0, NEW_PER_DAY - S.daily.newSeen);
    return { due, fresh: fresh.slice(0, left), freshTotal: fresh.length, total: Object.keys(S.srs).length };
  }
  function grade(id, g) {
    const t = dayNum(today()), r = S.srs[id]; if (!r) return;
    const wasNew = r.b === 0;
    if (g === 'again') { r.b = 1; r.d = t; }
    else if (g === 'hard') { r.b = Math.max(1, r.b); r.d = t + 1; }
    else if (g === 'good') { r.b = Math.min(IV.length - 1, r.b + 1); r.d = t + IV[r.b]; }
    else { r.b = Math.min(IV.length - 1, r.b + 2); r.d = t + IV[r.b]; }
    if (wasNew) S.daily.newSeen++;
    activity('review');
  }
  const nextIv = (r, g) => {
    if (g === 'again') return 'hoy';
    if (g === 'hard') return '1 d';
    const b = Math.min(IV.length - 1, (r ? r.b : 0) + (g === 'good' ? 1 : 2));
    return IV[b] + ' d';
  };

  /* ---------- Normalización de respuestas ---------- */
  const NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
  const UKUS = { metres: 'meters', metre: 'meter', centre: 'center', colour: 'color', analyse: 'analyze', analysed: 'analyzed', emphasise: 'emphasize', realise: 'realize', realised: 'realized', organise: 'organize', programme: 'program', optimise: 'optimize', behaviour: 'behavior', favourite: 'favorite', labour: 'labor' };
  function norm(s) {
    s = String(s || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"');
    s = s.replace(/%/g, ' percent').replace(/\bper cent\b/g, 'percent').replace(/-/g, ' ');
    s = s.replace(/\bcan't\b/g, 'cannot').replace(/\bcan not\b/g, 'cannot').replace(/\bwon't\b/g, 'will not').replace(/\bshan't\b/g, 'shall not')
      .replace(/\b(\w+)n't\b/g, '$1 not').replace(/\bi'm\b/g, 'i am').replace(/\b(you|we|they)'re\b/g, '$1 are')
      .replace(/\b(i|you|we|they|who|would|could|should|might|must)'ve\b/g, '$1 have').replace(/\b(\w+)'ll\b/g, '$1 will')
      .replace(/\b(he|she|it|that|what|where|who|there|here|how|this)'s\b/g, '$1 is').replace(/\blet's\b/g, 'let us').replace(/\b(\w+)'d\b/g, '$1 would');
    s = s.replace(/[^a-z0-9'\s]+/g, ' ').replace(/\bplease\b/g, ' ');
    s = s.split(/\s+/).filter(Boolean).map((w) => (w in NUMW ? String(NUMW[w]) : (UKUS[w] || w))).join(' ');
    return s.trim();
  }
  const matches = (input, answers) => { const n = norm(input); return !!n && answers.some((a) => norm(a) === n); };

  /* ================= Voz (síntesis del navegador) ================= */
  const Voice = {
    ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    list: [], a: null, b: null, current: null,
    init() {
      if (!this.ok) { document.documentElement.classList.add('no-voice'); return; }
      const load = () => {
        try { this.list = speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang)); } catch (e) { this.list = []; }
        this.pick(); fillVoiceSelect();
      };
      load();
      try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { speechSynthesis.onvoiceschanged = load; }
    },
    score(v) {
      let s = 0;
      if (/en[-_]US/i.test(v.lang)) s += 3; else if (/en[-_]GB/i.test(v.lang)) s += 2;
      if (/natural|neural|online/i.test(v.name)) s += 4;
      if (/google/i.test(v.name)) s += 2;
      if (/aria|jenny|guy|samantha|ava|allison|zira|david|mark/i.test(v.name)) s += 1;
      return s;
    },
    sorted() { return this.list.slice().sort((x, y) => this.score(y) - this.score(x)); },
    pick() {
      const sv = this.sorted();
      this.a = sv.find((v) => v.name === S.settings.voice) || sv[0] || null;
      this.b = sv.find((v) => v !== this.a && v.lang.slice(0, 5) === (this.a ? this.a.lang.slice(0, 5) : 'en-US')) || sv.find((v) => v !== this.a) || this.a;
    },
    speak(text, o = {}) {
      if (!this.ok || !text) { if (o.onend) setTimeout(o.onend, 10); return; }
      try { speechSynthesis.cancel(); } catch (e) { /* nada */ }
      const u = new SpeechSynthesisUtterance(String(text).replace(/→/g, ',').replace(/_{2,}/g, 'blank'));
      const v = o.voice || this.a;
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
      u.rate = o.rate || S.settings.rate || 1;
      let ended = false;
      const done = () => { if (ended) return; ended = true; clearTimeout(guard); if (this.current === u) this.current = null; if (o.onend) o.onend(); };
      const words = String(text).split(/\s+/).length;
      const guard = setTimeout(done, (words * 650) / u.rate + 4000); // por si el navegador no dispara onend
      u.onend = done; u.onerror = done;
      this.current = u;
      try { speechSynthesis.speak(u); } catch (e) { done(); }
    },
    stop() { if (this.ok) { try { speechSynthesis.cancel(); } catch (e) { /* nada */ } } this.current = null; $$('.speaking').forEach((e) => e.classList.remove('speaking')); },
  };

  /* ================= Nube: progreso en tu cuenta (db + user) ================= */
  const Cloud = {
    ref: null, timer: null, busy: false, dirty: false, state: 'local',
    async init() {
      if (!window.claude || typeof window.claude.use !== 'function') { syncBadge(); return; }
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) { syncBadge(); return; }
        const uid = await user.id();
        if (!uid) { syncBadge(); return; }
        this.ref = db.doc('data/users/' + uid + '/progress');
        const snap = await this.ref.get();
        if (snap.exists) {
          const remote = JSON.parse(JSON.stringify(snap.data() || {}));
          if ((remote.updatedAt || 0) > (S.updatedAt || 0)) {
            S = fix(remote);
            try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* nada */ }
            route();
          } else if ((S.updatedAt || 0) > (remote.updatedAt || 0)) this.schedule();
        } else if (S.updatedAt) this.schedule();
        this.state = 'cloud';
      } catch (e) { this.ref = null; this.state = 'local'; }
      syncBadge();
    },
    schedule() { if (!this.ref) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 1500); },
    async flush() {
      if (!this.ref) return;
      if (this.busy) { this.dirty = true; return; }
      this.busy = true;
      try { await this.ref.set(JSON.parse(JSON.stringify(S))); this.state = 'cloud'; }
      catch (e) { this.state = 'err'; if (e && (e.code === 'revoked' || e.code === 'invalid_argument')) this.ref = null; }
      this.busy = false; syncBadge();
      if (this.dirty) { this.dirty = false; this.schedule(); }
    },
  };
  function syncBadge() {
    const el = $('#sync'); if (!el) return;
    el.className = 'sync' + (Cloud.state === 'cloud' ? ' cloud' : Cloud.state === 'err' ? ' err' : '');
    el.innerHTML = `<span>${Cloud.state === 'cloud' ? 'Guardado en tu cuenta' : Cloud.state === 'err' ? 'Sin conexión: guardado local' : 'Guardado en este navegador'}</span>`;
    el.title = Cloud.state === 'cloud' ? 'Tu progreso se guarda en tu cuenta de Claude y te sigue a otros dispositivos.' : 'Tu progreso se guarda en este navegador.';
  }

  /* ================= Tutor con IA (sample) ================= */
  const AI = {
    fn: null, denied: false,
    get on() { return !!this.fn && !this.denied; },
    async init() {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      try { this.fn = await window.claude.use('sample'); } catch (e) { this.fn = null; }
      applyAI();
    },
    fail(e) {
      if (e && ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e.code)) { this.denied = true; applyAI(); }
      return this.msg(e);
    },
    msg(e) {
      const c = e && e.code;
      if (c === 'cancelled') return '';
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) return 'El tutor con IA no está disponible en esta vista. Puedes seguir con el modo guiado.';
      if (c === 'rate_limited') return 'Demasiadas consultas seguidas o límite de uso alcanzado. Espera un momento e inténtalo de nuevo.';
      if (c === 'session_expired') return 'Tu sesión expiró. Vuelve a iniciar sesión en Claude y recarga la página.';
      if (c === 'invalid_json' || c === 'empty_completion') return 'El tutor respondió en un formato inesperado. Inténtalo otra vez.';
      if (c === 'refused') return 'El tutor no pudo responder a ese mensaje. Prueba a reformularlo.';
      return 'No pude contactar al tutor. Revisa tu conexión e inténtalo de nuevo.';
    },
    json(prompt, o = {}) { return this.fn.json(prompt, Object.assign({ modelTier: 'quick', cache: false }, o)); },
    text(prompt, o = {}) { return this.fn(prompt, Object.assign({ modelTier: 'default', cache: false }, o)); },
  };
  function applyAI() {
    $$('[data-ai]').forEach((el) => { el.hidden = !AI.on; });
    $$('[data-noai]').forEach((el) => { el.hidden = AI.on; });
  }
  // Markdown mínimo y seguro para las respuestas del tutor
  function md(t) {
    const lines = esc(t).split(/\n/);
    let out = '', list = false;
    const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<i>$2</i>');
    for (let ln of lines) {
      ln = ln.trimEnd();
      const li = ln.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (li) { if (!list) { out += '<ul>'; list = true; } out += '<li>' + inline(li[1]) + '</li>'; continue; }
      if (list) { out += '</ul>'; list = false; }
      const hd = ln.match(/^#{1,4}\s+(.*)$/);
      if (hd) out += '<h4>' + inline(hd[1]) + '</h4>';
      else if (ln.trim()) out += '<p>' + inline(ln) + '</p>';
    }
    if (list) out += '</ul>';
    return out;
  }
  const learnerCtx = (u) => `The learner is a Spanish-speaking engineering physicist from Colombia (a university physics teacher) learning English. Current CEFR level: ${u ? u.level.code : 'unknown'}.`;

  /* ================= Navegación ================= */
  let current = (location.hash || '').replace(/^#/, '') || 'ruta';
  const main = () => $('#main');
  function go(h) {
    h = String(h).replace(/^#/, '');
    current = h;
    try { history.pushState(null, '', '#' + h); } catch (e) { /* entorno sin historial */ }
    route();
  }
  function setNav(name) { $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === name)); }
  function route() {
    Voice.stop(); Stop.all();
    const h = current || 'ruta';
    let m = h.match(/^u-([abc][12])-(\d)(?:-(\w+))?$/);
    let name = h, fn;
    if (m && UNIT[m[1] + '-' + m[2]]) {
      const u = UNIT[m[1] + '-' + m[2]];
      const k = STEPS.some((s) => s.k === m[3]) ? m[3] : nextStepOf(u);
      name = 'ruta'; fn = () => renderUnit(u, k);
    } else {
      const map = { ruta: renderHome, repaso: renderReview, frases: renderSay, recursos: renderLibrary, metodo: renderMethod, prueba: renderTest };
      if (!map[h]) name = 'ruta';
      fn = map[name];
    }
    setNav(name);
    main().innerHTML = '';
    fn();
    applyAI();
    updateBadge();
    window.scrollTo(0, 0);
  }
  // Tareas que deben cancelarse al cambiar de vista (reproducción, IA)
  const Stop = { fns: [], add(f) { this.fns.push(f); }, all() { this.fns.splice(0).forEach((f) => { try { f(); } catch (e) { /* nada */ } }); } };
  function updateBadge() {
    const d = dueInfo();
    const b = $('#dueBadge'); if (b) b.textContent = (d.due.length + d.fresh.length) || '';
  }
  let toastT = null;
  function toast(msg, photon) {
    const t = $('#toast');
    t.innerHTML = (photon ? '<svg class="photon-line" viewBox="0 0 26 10" aria-hidden="true"><path d="M0 5 Q3 0 6 5 T12 5 T18 5 T24 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>' : '') + '<span>' + esc(msg) + '</span>';
    t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3800);
  }
  const linkCard = (l) => {
    let host = ''; try { host = new URL(l[1]).hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
    return `<a class="link" href="${esc(l[1])}" target="_blank" rel="noopener noreferrer"><span class="lt">${esc(l[0])}${I.ext}</span><span class="host">${esc(host)}</span>${l[2] ? `<span class="ln">${esc(l[2])}</span>` : ''}${l[3] ? `<span class="tags">${String(l[3]).split(',').map((t) => `<span class="chip">${esc(t.trim())}</span>`).join('')}</span>` : ''}</a>`;
  };
  const sayBtn = (text, sm) => `<button class="play${sm ? ' sm' : ''}" data-say="${esc(text)}" aria-label="Escuchar: ${esc(text)}">${I.play}</button>`;
  const lvStyle = (L) => `--lv: var(--${L.id})`;

  /* ================= Inicio ================= */
  function renderHome() {
    const nu = contUnit();
    const done = UNITS.filter((u) => unitDone(u.id)).length;
    const d = dueInfo();
    const dueN = d.due.length + d.fresh.length;
    const k = nu ? nextStepOf(nu) : null;
    const si = k ? STEPS.findIndex((s) => s.k === k) : 0;
    const talkOk = S.daily.talk || S.daily.listen;
    const revOk = S.daily.reviews >= 10 || (S.daily.reviews > 0 && dueN === 0);
    const stepsOk = S.daily.steps >= 2;
    const nDone = [revOk, stepsOk, talkOk].filter(Boolean).length;
    const start = startIndex();
    const levelNow = nu ? nu.level : LEVELS[LEVELS.length - 1];
    main().innerHTML = `
      <section class="home-top">
        <div class="card continue" style="${lvStyle(levelNow)}">
          ${photonSVG(`var(--${levelNow.id})`)}
          <p class="eyebrow">Tu siguiente paso</p>
          ${nu ? `
            <p class="lvl-tag"><span class="spec"></span>n = ${nu.level.n} · ${nu.level.code} ${esc(nu.level.name)} · Unidad ${nu.ui + 1} de 6</p>
            <h1>${esc(nu.title)}</h1>
            <p class="en-sub" data-say="${esc(nu.en)}">${esc(nu.en)} ${I.play}</p>
            <div class="progress" aria-label="Progreso de la unidad"><i style="width:${pct(unitFrac(nu.id))}%"></i></div>
            <p class="muted">Paso ${si + 1} de 7 · ${STEPS[si].n}</p>
            <div class="actions">
              <a class="btn primary big" href="#u-${nu.id}-${k}">Continuar ${I.right}</a>
              ${S.placement ? '' : '<a class="btn big ghost" href="#prueba">¿Dónde empiezo? Prueba de nivel</a>'}
            </div>` : `
            <h1>Completaste las 30 unidades</h1>
            <p class="muted">Sigue con el repaso diario, conversa con el tutor y usa la biblioteca de recursos de nivel C1.</p>
            <div class="actions"><a class="btn primary big" href="#repaso">Ir al repaso</a></div>`}
        </div>
        <div class="card today">
          <div class="sec-head"><h2>Sesión de hoy</h2><span class="chip">${nDone}/3 · ≈ 30 min</span></div>
          <ol>
            <li class="${revOk ? 'done' : ''}"><span class="tick">${I.check}</span><div><p class="t-title">Repasa tus tarjetas</p><p class="t-sub">${d.total ? (dueN ? `${dueN} esperando · <a href="#repaso">empezar</a>` : 'Nada pendiente por hoy') : 'Se crean al abrir Vocabulario y Frases'}</p></div><span class="t-min">5 min</span></li>
            <li class="${stepsOk ? 'done' : ''}"><span class="tick">${I.check}</span><div><p class="t-title">Avanza 2 pasos de tu unidad</p><p class="t-sub">${Math.min(2, S.daily.steps)} de 2 hoy</p></div><span class="t-min">15 min</span></li>
            <li class="${talkOk ? 'done' : ''}"><span class="tick">${I.check}</span><div><p class="t-title">Conversa o escucha inglés real</p><p class="t-sub">${talkOk ? 'Hecho' : 'Una misión de Conversa o 10 min de un recurso · <button class="btn sm ghost" id="listenDone">Ya lo hice</button>'}</p></div><span class="t-min">10 min</span></li>
          </ol>
        </div>
      </section>
      <section class="stats">
        <div class="stat"><b>${done}<span class="muted" style="font-size:1rem"> / 30</span></b><span>unidades completadas</span></div>
        <div class="stat"><b>${streakNow()}</b><span>días seguidos${S.streak.best ? ` · récord ${S.streak.best}` : ''}</span></div>
        <div class="stat"><b>${d.total}</b><span>frases y palabras en tu memoria</span></div>
        <div class="stat"><b>${levelNow.code}</b><span>nivel actual${S.placement ? ` · prueba: ${S.placement.level.toUpperCase()}` : ''}</span></div>
      </section>
      <div class="map-head">
        <div><h2>Tu ruta, nivel a nivel</h2><p class="muted">Cada unidad es un estado; completar las seis de un nivel te excita al siguiente.</p></div>
        <div class="legend"><span><i></i>por empezar</span><span><i class="h"></i>en curso</span><span><i class="f"></i>completada</span></div>
      </div>
      <div class="energy" role="list">
        <span class="e-axis">E</span>
        ${LEVELS.slice().reverse().map((L) => {
          const n = L.units.filter((u) => unitDone(u.id)).length;
          return `<div class="level-row" style="${lvStyle(L)}" role="listitem">
            <div class="level-label"><span class="n">n = ${L.n}</span><strong>${L.code}</strong><span class="lname">${esc(L.name)}</span><span class="meta">λ ${L.nm} nm · ${esc(L.line)} · ${n}/6</span></div>
            <ol class="states">${L.units.map((u) => {
              const dn = unitDone(u.id), f = unitFrac(u.id), cur = nu && nu.id === u.id;
              const cls = ['state', dn ? 'done' : '', cur ? 'current' : '', (S.placement && u.gi === start && !dn && !cur) ? 'start-here' : ''].join(' ');
              return `<li><a class="${cls}" href="#u-${u.id}" title="${esc(u.title)}"><span class="dot" style="--p:${pct(f)}">${dn ? I.check : u.ui + 1}</span><span class="st-title">${esc(u.title)}</span></a></li>`;
            }).join('')}</ol>
          </div>`;
        }).join('')}
      </div>`;
    const ld = $('#listenDone');
    if (ld) ld.onclick = () => { activity('listen'); renderHome(); };
  }

  /* ================= Unidad ================= */
  function renderUnit(u, k) {
    const L = u.level;
    S.last = { unit: u.id, step: k }; save();
    if (k === 'vocab' || k === 'phrases') enroll(u);
    const p = S.units[u.id] || { steps: {} };
    const si = STEPS.findIndex((s) => s.k === k);
    const prev = STEPS[si - 1], next = STEPS[si + 1];
    main().innerHTML = `
      <div class="unit" style="${lvStyle(L)}">
        <header class="unit-head">
          <a class="crumb" href="#ruta">${I.left} Ruta</a>
          <p class="lvl-tag"><span class="spec"></span>n = ${L.n} · ${L.code} ${esc(L.name)} · Unidad ${u.ui + 1} de 6${unitDone(u.id) ? ' · completada' : ''}</p>
          <h1>${esc(u.title)}</h1>
          <p class="en-sub" data-say="${esc(u.en)}">${esc(u.en)} ${I.play}</p>
          <p class="goal"><strong>Al terminar podrás:</strong> ${esc(u.goal)}</p>
        </header>
        <nav class="stepper" aria-label="Pasos de la unidad">${STEPS.map((s, i) => `<a href="#u-${u.id}-${s.k}" class="${s.k === k ? 'on' : ''} ${p.steps && p.steps[s.k] ? 'ok' : ''}" ${s.k === k ? 'aria-current="step"' : ''}><span class="num">${p.steps && p.steps[s.k] ? I.check : i + 1}</span>${s.n}</a>`).join('')}</nav>
        <section class="step" id="step"></section>
        <nav class="step-nav">
          ${prev ? `<a class="btn ghost" href="#u-${u.id}-${prev.k}">${I.left} ${prev.n}</a>` : `<a class="btn ghost" href="#ruta">${I.left} Ruta</a>`}
          ${next ? `<button class="btn primary" id="nextStep">${['practice', 'talk'].includes(k) ? 'Ir a ' + next.n : 'Listo · ' + next.n} ${I.right}</button>`
                 : `<button class="btn primary" id="nextStep">Terminar unidad ${I.right}</button>`}
        </nav>
      </div>`;
    const el = $('#step');
    ({ learn: stepLearn, vocab: stepVocab, phrases: stepPhrases, practice: stepPractice, listen: stepListen, talk: stepTalk, links: stepLinks })[k](u, el);
    const stick = $('.stepper .on'); if (stick && stick.scrollIntoView) stick.scrollIntoView({ block: 'nearest', inline: 'center' });
    $('#nextStep').onclick = () => {
      if (!['practice', 'talk'].includes(k)) markStep(u, k);
      if (next) go(`u-${u.id}-${next.k}`);
      else {
        const nu = unitDone(u.id) ? UNITS[u.gi + 1] : null;
        if (!unitDone(u.id)) {
          const pp = up(u.id);
          const miss = STEPS.filter((s) => !pp.steps[s.k]).map((s) => s.n);
          toast(miss.length ? 'Te falta: ' + miss.join(', ') : `Necesitas ${pct(PASS)} % en Practica para completar la unidad.`);
          go(`u-${u.id}-${miss.length ? STEPS.find((s) => !pp.steps[s.k]).k : 'practice'}`);
        } else go(nu ? `u-${nu.id}-learn` : 'ruta');
      }
    };
  }

  /* ---------- 1. Entiende ---------- */
  function stepLearn(u, el) {
    el.innerHTML = `<div class="learn-grid">
      <article class="prose">${u.grammar}</article>
      <aside class="side">
        <div class="note-card"><p class="eyebrow">Cómo estudiar esto</p><p>Toca cualquier ejemplo <em style="font-style:italic;font-weight:700">en cursiva</em> para escucharlo y repítelo en voz alta. No memorices reglas: entiende el patrón y pasa a practicar.</p></div>
        <div class="ai-box" data-ai hidden>
          <p class="eyebrow">${I.spark} Pregunta al tutor</p>
          <textarea id="askIn" rows="3" placeholder="Ej.: ¿Por qué se dice 'an hour' y no 'a hour'?"></textarea>
          <div class="row"><button class="btn sm primary" id="askBtn">Preguntar</button><button class="btn sm ghost" id="askStop" hidden>${I.stop} Detener</button></div>
          <div class="ai-out" id="askOut"></div>
        </div>
      </aside></div>`;
    $$('.prose em', el).forEach((e) => { e.setAttribute('data-say', e.textContent); e.setAttribute('tabindex', '0'); e.setAttribute('role', 'button'); });
    let ctl = null;
    $('#askStop').onclick = () => ctl && ctl.abort();
    Stop.add(() => ctl && ctl.abort());
    $('#askBtn').onclick = async () => {
      const q = $('#askIn').value.trim(); if (!q || !AI.on) return;
      const out = $('#askOut'), btn = $('#askBtn');
      ctl = new AbortController(); btn.disabled = true; $('#askStop').hidden = false;
      out.innerHTML = '<span class="thinking">Pensando…</span>';
      try {
        await AI.text(`${learnerCtx(u)}
Unit: "${u.en}" — language focus: ${u.focus}.
Answer the learner's question in Spanish, clearly and concisely (max 170 words). Include 2–3 short English examples in **bold**. If the question is about something outside this unit, answer it anyway. Use short paragraphs or bullets; no tables.
Question: «${q}»`, { signal: ctl.signal, onText: ({ text }) => { out.innerHTML = md(text); } });
      } catch (e) { const m = AI.fail(e); out.innerHTML = (e && e.text ? md(e.text) : '') + (m ? `<p class="err-msg">${esc(m)}</p>` : ''); }
      btn.disabled = false; $('#askStop').hidden = true;
    };
  }

  /* ---------- 2. Vocabulario ---------- */
  function stepVocab(u, el) {
    const s = u.sound;
    const key = (w) => String(w).split('→')[0].replace(/\(.*?\)/g, '').trim();
    el.innerHTML = `
      <div class="sec-head"><h2>Vocabulario clave</h2><label class="check"><input type="checkbox" id="hideEs"> Ocultar español para autoevaluarme</label></div>
      <p class="lead">Escucha cada palabra, repítela y lee el ejemplo en voz alta. Estas palabras ya entraron a tu <a href="#repaso">repaso diario</a>; «YouGlish» te muestra a nativos diciéndola en videos reales.</p>
      <div class="vgrid" id="vgrid">${u.vocab.map((v) => `
        <div class="vcard">
          <div class="vhead">${sayBtn(v[0])}<span class="ven">${esc(v[0])}</span></div>
          <div class="ves">${esc(v[1])}</div>
          ${v[2] ? `<div class="vex">${sayBtn(v[2], true)}<span>${esc(v[2])}</span></div>` : ''}
          <div class="vlinks"><a href="https://youglish.com/pronounce/${encodeURIComponent(key(v[0]))}/english" target="_blank" rel="noopener noreferrer">YouGlish</a><a href="https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(key(v[0]).toLowerCase().replace(/\s+/g, '-'))}" target="_blank" rel="noopener noreferrer">Cambridge</a></div>
        </div>`).join('')}</div>
      <section class="sound">
        <p class="eyebrow">Sonido de la unidad</p>
        <h3>${esc(s.t)}</h3>
        <p>${s.tip}</p>
        <div class="sound-words">${s.w.map((w) => w.includes('|')
          ? `<span class="sw pair">${w.split('|').map((x, i) => (i ? '<span class="vs">vs</span>' : '') + `<span data-say="${esc(x)}" role="button" tabindex="0">${esc(x)}</span>`).join('')}</span>`
          : `<span class="sw" data-say="${esc(w)}" role="button" tabindex="0">${sayBtn(w)}${esc(w)}</span>`).join('')}</div>
      </section>`;
    $('#hideEs').onchange = (e) => el.classList.toggle('hide-es', e.target.checked);
  }

  /* ---------- 3. Frases ---------- */
  function searchTool(prefill) {
    return `<section class="panel">
      <h3>Busca cómo lo dicen los nativos</h3>
      <p class="muted">Escribe una expresión en inglés (o en español para Reverso y Linguee) y ábrela en ejemplos reales: videos, textos traducidos y frases de hablantes nativos.</p>
      <input type="search" id="sq" placeholder="p. ej. figure out, I'm working on, en mi opinión" value="${esc(prefill || '')}">
      <div class="search-links" id="sqLinks"></div>
    </section>`;
  }
  function wireSearch() {
    const inp = $('#sq'), box = $('#sqLinks'); if (!inp) return;
    const draw = () => {
      const q = inp.value.trim();
      if (!q) { box.innerHTML = '<span class="muted" style="font-size:.85rem">Escribe algo para generar los enlaces.</span>'; return; }
      const e = encodeURIComponent(q);
      const L = [
        ['YouGlish · videos', `https://youglish.com/pronounce/${e}/english`],
        ['Reverso Context', `https://context.reverso.net/translation/english-spanish/${e.replace(/%20/g, '+')}`],
        ['Linguee', `https://www.linguee.com/english-spanish/search?query=${e}`],
        ['Tatoeba', `https://tatoeba.org/en/sentences/search?query=${e}&from=eng&to=spa`],
        ['Cambridge', `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}`],
      ];
      box.innerHTML = L.map(([n, h]) => `<a class="btn sm" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(n)} ${I.ext}</a>`).join('');
    };
    inp.addEventListener('input', draw); draw();
  }
  function stepPhrases(u, el) {
    const dk = 'qle-own-' + u.id;
    let draft = ''; try { draft = localStorage.getItem(dk) || ''; } catch (e) { draft = ''; }
    el.innerHTML = `
      <div class="sec-head"><h2>Frases para conversar</h2><div class="row"><label class="check"><input type="checkbox" id="hideEs2"> Ocultar español</label><button class="btn sm" id="playAll" data-voice-only>${I.play} Escuchar todas</button></div></div>
      <p class="lead">Aprende bloques completos, no palabras sueltas: son piezas listas para usar en una conversación. Escucha cada frase, repítela tres veces y dila pensando en tu propia vida.</p>
      <ol class="phrases" id="phr">${u.phrases.map((p) => `<li>${sayBtn(p[0])}<div><p class="en">${esc(p[0])}</p><p class="es">${esc(p[1])}</p></div></li>`).join('')}</ol>
      <section class="panel">
        <h3>Crea tus propias frases</h3>
        <p class="muted">Escribe tres frases sobre tu vida o tu trabajo usando lo de esta unidad. Producir tus propias frases es lo que las fija en la memoria.</p>
        <textarea id="own" rows="4" placeholder="1. ...&#10;2. ...&#10;3. ...">${esc(draft)}</textarea>
        <div class="row"><button class="btn primary" id="checkOwn" data-ai hidden>${I.spark} Revisar con el tutor</button><span class="muted" data-noai>Compáralas con las frases de arriba y léelas en voz alta.</span></div>
        <div id="ownOut"></div>
      </section>
      ${searchTool()}`;
    $('#hideEs2').onchange = (e) => el.classList.toggle('hide-es', e.target.checked);
    $('#own').addEventListener('input', (e) => { try { localStorage.setItem(dk, e.target.value); } catch (er) { /* nada */ } });
    wireSearch();
    let playing = false;
    $('#playAll').onclick = () => {
      if (playing) { playing = false; Voice.stop(); return; }
      playing = true; const lis = $$('#phr li'); let i = 0;
      const nx = () => {
        lis.forEach((l) => l.classList.remove('speaking'));
        if (!playing || i >= lis.length) { playing = false; return; }
        const li = lis[i]; li.classList.add('speaking'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        Voice.speak(u.phrases[i][0], { onend: () => { i++; setTimeout(nx, 900); } });
      };
      nx();
    };
    Stop.add(() => { playing = false; });
    $('#checkOwn').onclick = async () => {
      const txt = $('#own').value.trim(); if (!txt || !AI.on) return;
      const out = $('#ownOut'), btn = $('#checkOwn'); btn.disabled = true;
      out.innerHTML = '<span class="thinking">Revisando…</span>';
      try {
        const r = await AI.json(`${learnerCtx(u)}
Unit focus: ${u.focus}. The learner wrote these sentences about their own life:
"""${txt.slice(0, 1500)}"""
For each sentence: say if it is correct and natural English. If not, give a corrected, natural version and a very short explanation in Spanish.
Reply with only JSON: {"items":[{"original":"...","ok":true,"corrected":"...","note":"..."}]}`);
        const items = (r && Array.isArray(r.items)) ? r.items : [];
        out.innerHTML = items.length ? `<div class="fb-list">${items.map((it) => `<div class="fb-item ${it.ok ? 'ok' : 'fix'}">
          ${it.ok ? `<span class="fixd">${I.check} ${esc(it.original)} ${sayBtn(it.original, true)}</span><span class="muted">${esc(it.note || 'Correcta y natural.')}</span>`
                  : `<span class="orig">${esc(it.original)}</span><span class="fixd">${esc(it.corrected)} ${sayBtn(it.corrected || '', true)}</span><span class="muted">${esc(it.note || '')}</span>`}</div>`).join('')}</div>` : '<p class="muted">No encontré frases para revisar.</p>';
      } catch (e) { out.innerHTML = `<p class="err-msg">${esc(AI.fail(e))}</p>`; }
      btn.disabled = false;
    };
  }

  /* ---------- 4. Practica ---------- */
  const TYPE_NAME = { mc: 'Elige la opción correcta', gap: 'Completa el espacio', order: 'Ordena la frase', tr: 'Traduce al inglés' };
  function stepPractice(u, el) {
    const qs = u.ex;
    let i = 0, right = 0, wrong = [];
    const done = () => {
      const sc = right / qs.length, p = up(u.id);
      const first = !p.steps.practice;
      p.best = Math.max(p.best || 0, sc); p.last = sc;
      if (sc >= PASS) { if (first) { p.steps.practice = 1; activity('step'); } checkUnit(u); }
      save();
      el.innerHTML = `<div class="quiz"><div class="q-card result">
        <p class="eyebrow">Resultado</p>
        <p class="score">${pct(sc)} %</p>
        <p>${sc >= PASS ? `Superaste la práctica (mínimo ${pct(PASS)} %). ${sc === 1 ? 'Perfecto.' : 'Revisa tus errores abajo y sigue a Escucha.'}` : `Necesitas ${pct(PASS)} % para completar la unidad. Vuelve a leer <a href="#u-${u.id}-learn">Entiende</a> y repite la práctica.`}</p>
        ${wrong.length ? `<div><h3>Para repasar</h3><ul class="review-list">${wrong.map((w) => `<li><span class="muted">${esc(w.q)}</span><br><b>${esc(w.a)}</b>${w.why ? `<br><span class="muted">${esc(w.why)}</span>` : ''}</li>`).join('')}</ul></div>` : ''}
        <div class="row"><button class="btn" id="again">Repetir práctica</button>${sc >= PASS ? `<a class="btn primary" href="#u-${u.id}-listen">Seguir: Escucha ${I.right}</a>` : ''}</div>
        <p class="muted" style="font-size:.85rem">Mejor nota: ${pct(p.best)} %</p>
      </div></div>`;
      $('#again').onclick = () => stepPractice(u, el);
    };
    const draw = () => {
      if (i >= qs.length) return done();
      const q = qs[i], t = q[0];
      let body = '';
      if (t === 'mc') body = `<p class="q-text">${esc(q[1])}</p><div class="opts">${q[2].map((o, j) => `<button class="opt" data-j="${j}"><kbd>${j + 1}</kbd>${esc(o)}</button>`).join('')}</div>`;
      if (t === 'gap') body = `<p class="q-text">${esc(q[1])}</p><input type="text" id="gapIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe la palabra o palabras que faltan"><div class="row"><button class="btn primary" id="chk">Comprobar</button></div>`;
      if (t === 'order') body = `${q[2] ? `<p class="q-es">«${esc(q[2])}»</p>` : ''}<div class="built" id="built" aria-label="Tu frase"></div><div class="tokens" id="toks">${shuffle(q[1].split('|').map((w, j) => ({ w, j }))).map((o) => `<button class="tok" data-j="${o.j}">${esc(o.w)}</button>`).join('')}</div><div class="row"><button class="btn primary" id="chk">Comprobar</button><button class="btn ghost" id="clr">Borrar</button></div>`;
      if (t === 'tr') body = `<p class="q-text">«${esc(q[1])}»</p><textarea id="trIn" rows="2" autocapitalize="sentences" spellcheck="false" placeholder="Escribe tu traducción en inglés"></textarea><div class="row"><button class="btn primary" id="chk">Comprobar</button></div>`;
      el.innerHTML = `<div class="quiz">
        <div class="q-top"><span>Pregunta ${i + 1} de ${qs.length}</span><span>${right} correctas</span></div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${pct(i / qs.length)}%"></i></div>
        <div class="q-card"><p class="q-type">${TYPE_NAME[t]}</p>${body}<div id="fb"></div></div></div>`;
      let answered = false;
      const finish = (ok, shown, why, userAns) => {
        if (answered) return; answered = true;
        if (ok) right++; else wrong.push({ q: t === 'tr' ? q[1] : (t === 'order' ? (q[2] || '') : q[1]), a: shown, why });
        const fb = $('#fb');
        fb.innerHTML = `<div class="feedback ${ok ? 'right' : 'wrong'}">
          <p class="verdict">${ok ? I.check + ' ¡Correcto!' : I.x + ' No exactamente'}</p>
          ${!ok || t === 'tr' || t === 'order' ? `<p class="ans">${sayBtn(shown, true)} ${esc(shown)}</p>` : ''}
          ${why ? `<p>${esc(why)}</p>` : ''}
          ${!ok && t === 'tr' && userAns ? `<div class="row"><button class="btn sm" id="aiChk" data-ai hidden>${I.spark} ¿Mi versión también es válida?</button><button class="btn sm ghost" id="selfOk" data-noai>Mi versión dice lo mismo</button></div><div id="aiOut"></div>` : ''}
          <div class="row"><button class="btn primary" id="nx">${i + 1 < qs.length ? 'Siguiente' : 'Ver resultado'} ${I.right}</button></div>
        </div>`;
        applyAI();
        $$('#chk, #gapIn, #trIn, .opt, .tok, #clr').forEach((b) => { b.disabled = true; });
        const nx = $('#nx'); nx.focus(); nx.onclick = () => { i++; draw(); };
        const flip = () => { right++; wrong.pop(); const v = $('.feedback'); v.className = 'feedback right'; v.querySelector('.verdict').innerHTML = I.check + ' Válida'; };
        const so = $('#selfOk'); if (so) so.onclick = () => { flip(); so.remove(); };
        const ab = $('#aiChk');
        if (ab) ab.onclick = async () => {
          ab.disabled = true; const out = $('#aiOut'); out.innerHTML = '<span class="thinking">Revisando…</span>';
          try {
            const r = await AI.json(`${learnerCtx(u)}
Spanish sentence: «${q[1]}». Reference translations: ${q[2].map((a) => '"' + a + '"').join(', ')}.
Learner's translation: «${userAns}».
Is the learner's translation correct, natural English with the same meaning? Minor punctuation or capitalization issues do not matter.
Reply with only JSON: {"ok": true, "better": "a natural corrected version if needed, else empty", "note": "one short sentence in Spanish"}`);
            if (r && r.ok) { flip(); out.innerHTML = `<p>${esc(r.note || 'Tu versión es correcta.')}</p>`; }
            else out.innerHTML = `<p>${r && r.better ? `<b>${esc(r.better)}</b><br>` : ''}${esc((r && r.note) || 'Tu versión no es del todo correcta.')}</p>`;
          } catch (e) { out.innerHTML = `<p class="err-msg">${esc(AI.fail(e))}</p>`; }
        };
      };
      if (t === 'mc') $$('.opt', el).forEach((b) => b.onclick = () => {
        const j = +b.dataset.j, ok = j === q[3];
        b.classList.add(ok ? 'right' : 'wrong'); $$('.opt', el)[q[3]].classList.add('right');
        finish(ok, q[2][q[3]], q[4]);
      });
      if (t === 'gap') {
        const inp = $('#gapIn'); inp.focus();
        const chk = () => { const v = inp.value.trim(); if (!v) return; finish(matches(v, q[2]), q[2][0], q[3]); };
        $('#chk').onclick = chk; inp.onkeydown = (e) => { if (e.key === 'Enter') chk(); };
      }
      if (t === 'order') {
        const toks = q[1].split('|'), built = [], bEl = $('#built');
        const redraw = () => { bEl.innerHTML = built.map((j, n) => `<button class="tok" data-n="${n}">${esc(toks[j])}</button>`).join(''); $$('.tok', bEl).forEach((b) => b.onclick = () => { if (answered) return; const j = built.splice(+b.dataset.n, 1)[0]; $(`#toks .tok[data-j="${j}"]`).classList.remove('used'); redraw(); }); };
        $$('#toks .tok').forEach((b) => b.onclick = () => { if (answered || b.classList.contains('used')) return; b.classList.add('used'); built.push(+b.dataset.j); redraw(); });
        $('#clr').onclick = () => { built.length = 0; $$('#toks .tok').forEach((b) => b.classList.remove('used')); redraw(); };
        $('#chk').onclick = () => { if (!built.length) return; const ans = toks.join(' '); finish(norm(built.map((j) => toks[j]).join(' ')) === norm(ans), ans, q[3]); };
      }
      if (t === 'tr') {
        const inp = $('#trIn'); inp.focus();
        const chk = () => { const v = inp.value.trim(); if (!v) return; finish(matches(v, q[2]), q[2][0], q[3], v); };
        $('#chk').onclick = chk; inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chk(); } };
      }
    };
    const key = (e) => {
      if (!el.isConnected) { document.removeEventListener('keydown', key); return; }
      if (/^[1-4]$/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { const b = $$('.opt', el)[+e.key - 1]; if (b && !b.disabled) b.click(); }
    };
    document.addEventListener('keydown', key);
    Stop.add(() => document.removeEventListener('keydown', key));
    el.innerHTML = `<div class="quiz"><div class="q-card"><p class="eyebrow">Practica · ${qs.length} ejercicios</p><h2>Pon a prueba lo que aprendiste</h2>
      <p class="muted">Cuenta solo el primer intento. Necesitas ${pct(PASS)} % para completar la unidad; puedes repetir cuantas veces quieras. Las contracciones (I'm = I am) y los números en letra o cifra se aceptan igual.</p>
      ${S.units[u.id] && S.units[u.id].best ? `<p class="muted">Tu mejor nota: <b>${pct(S.units[u.id].best)} %</b></p>` : ''}
      <div class="row"><button class="btn primary big" id="startQ">Empezar ${I.right}</button></div></div></div>`;
    $('#startQ').onclick = draw;
  }

  /* ---------- 5. Escucha ---------- */
  function stepListen(u, el) {
    const d = u.dialogue;
    const speakers = [...new Set(d.lines.map((l) => l[0]))];
    const me = d.me || 'Daniel';
    el.innerHTML = `
      <div class="sec-head"><h2>Escucha y repite</h2></div>
      <p class="lead">${esc(d.ctx)}</p>
      <div class="listen-controls" data-voice-only>
        <button class="btn primary" id="playD">${I.play} Reproducir</button>
        <button class="btn" id="shadowD" title="Pausa después de cada línea para que la repitas">Modo sombra</button>
        <button class="btn ghost" id="stopD">${I.stop} Detener</button>
        <label class="check"><input type="checkbox" id="showEn" checked> Texto en inglés</label>
        <label class="check"><input type="checkbox" id="showEs"> Traducción</label>
        <label class="check">Velocidad <select id="rateD"><option value="0.7">lenta</option><option value="0.85">media</option><option value="1">natural</option></select></label>
      </div>
      <ol class="dlg" id="dlg">${d.lines.map((l, i) => `<li class="${l[0] === me ? 'me' : ''}" data-i="${i}">${sayBtn(l[1])}<div><p class="who">${esc(l[0])}</p><p class="en">${esc(l[1])}</p><p class="es">${esc(l[2])}</p></div></li>`).join('')}</ol>
      <details class="howto" open><summary>Cómo practicar: tres pasadas</summary><ol>
        <li><b>Solo oído.</b> Desmarca «Texto en inglés» y escucha el diálogo completo. ¿Qué entendiste? Está bien no entender todo.</li>
        <li><b>Oído + texto.</b> Vuelve a escucharlo leyendo. Toca las líneas difíciles para oírlas otra vez; activa la traducción solo si la necesitas.</li>
        <li><b>Sombra (shadowing).</b> Pulsa «Modo sombra»: tras cada línea hay una pausa para que la repitas en voz alta imitando ritmo y entonación. Hazlo como si fueras ${esc(me)}.</li>
      </ol></details>`;
    const r0 = S.settings.rate <= 0.75 ? '0.7' : S.settings.rate <= 0.9 ? '0.85' : '1';
    $('#rateD').value = r0;
    $('#showEn').onchange = (e) => el.classList.toggle('hide-en', !e.target.checked);
    $('#showEs').onchange = (e) => el.classList.toggle('show-es', e.target.checked);
    let run = 0;
    const play = (shadow) => {
      const my = ++run; const rate = +$('#rateD').value; const lis = $$('#dlg li'); let i = 0;
      const voiceOf = (sp) => (speakers.indexOf(sp) % 2 === 0 ? Voice.a : Voice.b);
      const nx = () => {
        lis.forEach((l) => l.classList.remove('now'));
        if (my !== run || i >= lis.length) { if (my === run && i >= lis.length) { activity('listen'); } return; }
        const li = lis[i], l = d.lines[i]; li.classList.add('now'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        Voice.speak(l[1], { voice: voiceOf(l[0]), rate, onend: () => {
          if (my !== run) return;
          const words = l[1].split(/\s+/).length;
          const pause = shadow ? Math.min(9000, 900 + (words * 430) / rate) : 450;
          i++; setTimeout(nx, pause);
        } });
      };
      nx();
    };
    $('#playD').onclick = () => play(false);
    $('#shadowD').onclick = () => play(true);
    $('#stopD').onclick = () => { run++; Voice.stop(); $$('#dlg li').forEach((l) => l.classList.remove('now')); };
    Stop.add(() => { run++; });
    $$('#dlg li .play').forEach((b) => {
      const li = b.closest('li'), l = d.lines[+li.dataset.i];
      b.removeAttribute('data-say');
      b.onclick = () => { run++; Voice.speak(l[1], { voice: speakers.indexOf(l[0]) % 2 === 0 ? Voice.a : Voice.b, rate: +$('#rateD').value }); };
    });
  }

  /* ---------- 6. Conversa ---------- */
  const TALK = {};
  function stepTalk(u, el) {
    const m = u.mission;
    const st = TALK[u.id] || (TALK[u.id] = { msgs: [{ r: 'tutor', t: m.start }], goals: [], sent: 0 });
    el.innerHTML = `
      <div class="talk-grid">
        <div>
          <div class="mission">
            <p class="eyebrow">Misión de conversación</p>
            <h2>${esc(m.who)}</h2>
            <p>${esc(m.scene)}</p>
            <ul class="goals" id="goals">${m.goals.map((g, i) => `<li data-g="${i}">${esc(g)}</li>`).join('')}</ul>
          </div>
          <div data-ai hidden>
            <div class="chat" id="chat" aria-live="polite"></div>
            <form class="composer" id="composer">
              <label class="sr" for="chatIn">Tu mensaje</label>
              <textarea id="chatIn" rows="2" placeholder="Escribe en inglés. Si te bloqueas, escríbelo en español y el tutor te ayuda."></textarea>
              <button class="btn primary" id="sendBtn" type="submit">Enviar</button>
            </form>
            <div class="row" style="margin-top:10px">
              <button class="btn sm" id="hintBtn">Dame una idea</button>
              <button class="btn sm" id="evalBtn">Terminar y evaluar</button>
              <button class="btn sm ghost" id="resetBtn">Reiniciar</button>
              <label class="check" data-voice-only><input type="checkbox" id="autoSp" ${S.settings.autoSpeak ? 'checked' : ''}> Leer respuestas en voz alta</label>
            </div>
            <div id="hintOut" class="ai-out" style="margin-top:10px"></div>
            <div id="evalOut" class="ai-out card" style="margin-top:14px" hidden></div>
          </div>
          <div data-noai>
            <p class="lead" style="margin-bottom:14px">Modo guiado: escucha cada pregunta, escribe (y di en voz alta) tu respuesta, y compárala con la respuesta modelo. Cuando el tutor con IA está disponible, aquí conversas libremente.</p>
            <div class="guided" id="guided">${m.guided.map((g, i) => `<div class="g-item" data-i="${i}">
              <p class="g-q">${sayBtn(g[0])} ${esc(g[0])}</p>
              <textarea rows="2" placeholder="Tu respuesta en inglés"></textarea>
              <div class="row"><button class="btn sm" data-show="${i}">Ver respuesta modelo</button></div>
              <div class="g-model" hidden>${sayBtn(g[1], true)}<span>${esc(g[1])}</span></div>
            </div>`).join('')}</div>
          </div>
        </div>
        <aside class="side">
          <div class="note-card"><p class="eyebrow">Frases útiles · toca para insertar</p><div class="bank" id="bank">${u.phrases.map((p) => `<button type="button" data-ins="${esc(p[0])}" title="${esc(p[1])}">${esc(p[0])}</button>`).join('')}</div></div>
          <div class="note-card"><p class="eyebrow">Consejo</p><p>Escribe frases cortas y completas. Después de cada respuesta, léela en voz alta: estás entrenando la boca, no solo los dedos.</p></div>
        </aside>
      </div>`;
    const goalsEl = $('#goals');
    const paintGoals = () => $$('li', goalsEl).forEach((li) => li.classList.toggle('met', st.goals.includes(+li.dataset.g)));
    const chat = $('#chat');
    const paint = () => {
      chat.innerHTML = st.msgs.map((x) => x.r === 'tutor'
        ? `<div class="msg tutor"><div class="bubble">${sayBtn(x.t, true)}<span>${esc(x.t)}</span></div></div>`
        : `<div class="msg me"><div class="bubble">${esc(x.t)}</div>${x.corr ? `<div class="corr"><b>${esc(x.corr)}</b>${esc(x.note || '')}</div>` : (x.checked ? '<div class="corr good">✓ Correcto y natural</div>' : '')}</div>`).join('')
        + (st.busy ? '<div class="msg tutor"><div class="bubble"><span class="thinking">Escribiendo…</span></div></div>' : '');
      chat.scrollTop = chat.scrollHeight;
      paintGoals();
    };
    paint();
    let ctl = null;
    Stop.add(() => ctl && ctl.abort());
    $$('#bank button').forEach((b) => b.onclick = () => { const ta = $('#chatIn'); if (!ta) return; ta.value = (ta.value ? ta.value.trimEnd() + ' ' : '') + b.dataset.ins; ta.focus(); });
    $('#autoSp').onchange = (e) => { S.settings.autoSpeak = e.target.checked; save(); };
    const transcript = () => st.msgs.slice(-24).map((x) => (x.r === 'tutor' ? 'PARTNER: ' : 'LEARNER: ') + x.t).join('\n');
    const send = async (e) => {
      if (e) e.preventDefault();
      const ta = $('#chatIn'), txt = ta.value.trim();
      if (!txt || st.busy || !AI.on) return;
      ta.value = '';
      const mine = { r: 'me', t: txt.slice(0, 800) };
      st.msgs.push(mine); st.busy = true; paint();
      ctl = new AbortController();
      try {
        const r = await AI.json(`You are the conversation partner in an English course. ${learnerCtx(u)}
Unit: "${u.en}" — language focus: ${u.focus}.
Role-play: you are ${m.role}
Scene (in Spanish, for context): ${m.scene}
Learner's goals: ${m.goals.map((g, i) => i + ') ' + g).join(' | ')}

Conversation so far:
${transcript()}

Write your next turn. Rules:
- Stay in character. "reply": natural spoken English suited to ${u.level.code} level, 1–3 short sentences, ending with a question that invites the learner to use the unit's language.
- Check ONLY the learner's last message. If it has grammar mistakes, wrong words or unnatural phrasing, put the full corrected sentence(s) in "correction" and a one-line explanation in Spanish in "note". If it is correct and natural, set both to "". Ignore capital letters and final punctuation.
- If the learner wrote in Spanish or mixed languages, put a natural English version in "correction" and an encouraging one-line note in Spanish.
- "goals": indices (0-based) of the learner's goals clearly achieved anywhere in the conversation.
Reply with only JSON: {"reply":"...","correction":"...","note":"...","goals":[0]}`, { signal: ctl.signal });
        st.busy = false;
        mine.corr = (r && r.correction && norm(r.correction) !== norm(txt)) ? String(r.correction) : '';
        mine.note = mine.corr ? String((r && r.note) || '') : '';
        mine.checked = true;
        const reply = String((r && r.reply) || '').trim() || 'Sorry, could you say that again?';
        st.msgs.push({ r: 'tutor', t: reply });
        if (r && Array.isArray(r.goals)) st.goals = [...new Set(st.goals.concat(r.goals.map(Number).filter((n) => n >= 0 && n < m.goals.length)))];
        st.sent++;
        activity('talk');
        if (st.sent >= 4) { const p = up(u.id); if (!p.steps.talk) markStep(u, 'talk'); }
        paint();
        if (S.settings.autoSpeak) Voice.speak(reply);
      } catch (er) {
        st.busy = false; paint();
        const msg = AI.fail(er);
        if (msg) chat.insertAdjacentHTML('beforeend', `<p class="err-msg">${esc(msg)}</p>`);
      }
    };
    $('#composer').onsubmit = send;
    $('#chatIn').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    $('#hintBtn').onclick = async () => {
      if (!AI.on) return;
      const out = $('#hintOut'); out.innerHTML = '<span class="thinking">Pensando ideas…</span>';
      try {
        const r = await AI.json(`${learnerCtx(u)} Role-play: the partner is ${m.role}. Language focus: ${u.focus}.
Conversation so far:
${transcript()}
Suggest 2 different things the LEARNER could say next (in English, ${u.level.code} level, 1–2 sentences each, using the unit's language), each with a Spanish translation.
Reply with only JSON: {"ideas":[{"en":"...","es":"..."}]}`);
        const ideas = (r && Array.isArray(r.ideas)) ? r.ideas.slice(0, 3) : [];
        out.innerHTML = ideas.map((x) => `<div class="opt-card"><p class="en">${sayBtn(x.en, true)}<span>${esc(x.en)}</span></p><p class="es">${esc(x.es)}</p><div class="row"><button class="btn sm" data-use="${esc(x.en)}">Usar como base</button></div></div>`).join('') || '<p class="muted">Sin ideas por ahora.</p>';
        $$('[data-use]', out).forEach((b) => b.onclick = () => { $('#chatIn').value = b.dataset.use; $('#chatIn').focus(); });
      } catch (e) { out.innerHTML = `<p class="err-msg">${esc(AI.fail(e))}</p>`; }
    };
    $('#resetBtn').onclick = () => { if (ctl) ctl.abort(); TALK[u.id] = null; stepTalk(u, el); applyAI(); };
    $('#evalBtn').onclick = async () => {
      if (!AI.on) return;
      const out = $('#evalOut');
      if (st.msgs.filter((x) => x.r === 'me').length < 2) { out.hidden = false; out.innerHTML = '<p class="muted">Escribe al menos dos mensajes antes de pedir la evaluación.</p>'; return; }
      out.hidden = false; out.innerHTML = '<span class="thinking">Analizando tu conversación… (puede tardar unos segundos)</span>';
      ctl = new AbortController();
      try {
        const res = await AI.text(`You are an encouraging but honest English teacher. ${learnerCtx(u)}
Evaluate ONLY the LEARNER's English in this role-play (target level ${u.level.code}; unit focus: ${u.focus}; scene: ${m.scene}).
Write in Spanish, with these Markdown headings (##) and short bullet points:
## Lo que hiciste bien
(2–3 bullets)
## Correcciones clave
(up to 4 bullets: learner's sentence → corrected sentence — brief reason)
## Frases que sonarían más naturales
(4 useful English phrases for this situation, each with its Spanish meaning)
## Nivel estimado en esta conversación
(CEFR level + one sentence)
## Tu reto para la próxima vez
(one concrete task)

Conversation:
${transcript()}`, { signal: ctl.signal, onText: ({ text }) => { out.innerHTML = md(text); } });
        const p = up(u.id); p.feedback = String(res.text || '').slice(0, 2500); save();
      } catch (e) { const msg = AI.fail(e); out.innerHTML = (e && e.text ? md(e.text) : '') + (msg ? `<p class="err-msg">${esc(msg)}</p>` : ''); }
    };
    // Modo guiado
    let shown = new Set();
    $$('[data-show]').forEach((b) => b.onclick = () => {
      const i = +b.dataset.show, item = b.closest('.g-item');
      item.querySelector('.g-model').hidden = false; b.remove(); shown.add(i);
      if (shown.size === m.guided.length) { activity('talk'); markStep(u, 'talk'); toast('Misión guiada completada'); }
    });
  }

  /* ---------- 7. Recursos ---------- */
  function stepLinks(u, el) {
    const L = u.level, p = S.units[u.id] || { steps: {} };
    el.innerHTML = `
      <h2>Recursos de esta unidad</h2>
      <p class="lead">Elige uno y dedícale 10 minutos hoy. La unidad te da la estructura; escuchar y leer inglés real es lo que la convierte en fluidez.</p>
      <div class="links">${u.links.map(linkCard).join('')}</div>
      <h3 style="margin-top:30px">Para todo el nivel ${L.code}</h3>
      <div class="links">${L.links.map(linkCard).join('')}</div>
      <section class="panel done-box">
        <h3>${unitDone(u.id) ? 'Unidad completada' : 'Para completar la unidad'}</h3>
        <ul class="checklist">${STEPS.map((s) => {
          const ok = s.k === 'links' ? true : !!(p.steps && p.steps[s.k]);
          return `<li class="${ok ? 'ok' : ''}">${ok ? I.check : '○'} ${s.n}${s.k === 'practice' ? ` (${pct((S.units[u.id] || {}).best || 0)} %)` : ''}</li>`;
        }).join('')}</ul>
        ${p.feedback ? `<details style="margin-top:8px"><summary style="cursor:pointer;font-weight:700">Tu última evaluación de conversación</summary><div class="ai-out" style="margin-top:8px">${md(p.feedback)}</div></details>` : ''}
      </section>`;
  }

  /* ================= Repaso ================= */
  function renderReview() {
    const d = dueInfo();
    const m = cardMap();
    const boxes = Array(IV.length).fill(0);
    Object.values(S.srs).forEach((r) => { boxes[Math.min(r.b, IV.length - 1)]++; });
    const maxB = Math.max(1, ...boxes);
    main().innerHTML = `<div class="page-head">
        <p class="eyebrow">Repetición espaciada</p>
        <h1>Repaso diario</h1>
        <p class="lead">Ves cada frase justo antes de olvidarla. Primero intenta decirla en voz alta, luego revela la respuesta y sé honesto con la calificación: así el sistema ajusta cuándo volver a mostrártela.</p>
      </div>
      <div class="rev-wrap" id="rev"></div>`;
    const rev = $('#rev');
    if (!d.total) {
      rev.innerHTML = `<div class="card stack"><h2>Aún no tienes tarjetas</h2><p class="muted">Cada vez que abres Vocabulario o Frases en una unidad, sus palabras y frases entran aquí automáticamente. También puedes guardar frases desde <a href="#frases">¿Cómo se dice?</a>.</p><div class="row"><a class="btn primary" href="#ruta">Ir a mi ruta</a></div></div>`;
      return;
    }
    const queue = shuffle(d.due).concat(d.fresh);
    const summary = () => `<div class="card stack">
        <div class="sec-head"><h2>${queue.length ? `${queue.length} tarjetas para hoy` : 'Listo por hoy'}</h2><span class="chip">${d.due.length} repaso · ${d.fresh.length} nuevas</span></div>
        <p class="muted">${queue.length ? 'Unos 5 minutos. Di cada respuesta en voz alta antes de revelarla.' : `Vuelve mañana. ${d.freshTotal > d.fresh.length ? `Tienes ${d.freshTotal - d.fresh.length} tarjetas nuevas esperando (máx. ${NEW_PER_DAY} por día).` : ''}`}</p>
        <div class="row">
          <label class="check">Dirección <select id="dir" style="width:auto;margin-left:6px"><option value="es-en">Español → Inglés (hablar)</option><option value="en-es">Inglés → Español (entender)</option></select></label>
        </div>
        ${queue.length ? `<div class="row"><button class="btn primary big" id="go">Empezar ${I.right}</button></div>` : ''}
        <div><p class="eyebrow" style="margin-top:6px">Tus tarjetas por caja (más a la derecha = más consolidadas)</p>
        <div class="boxes">${boxes.map((n, i) => `<div style="height:${Math.max(4, (n / maxB) * 100)}%" title="${n} tarjetas"><span>${i === 0 ? 'nuevas' : IV[i] + 'd'}</span></div>`).join('')}</div></div>
      </div>`;
    rev.innerHTML = summary();
    $('#dir').value = S.settings.dir;
    $('#dir').onchange = (e) => { S.settings.dir = e.target.value; save(); };
    const goB = $('#go'); if (!goB) return;
    goB.onclick = () => {
      let n = 0, seen = 0;
      const show = () => {
        if (!queue.length) { renderReview(); toast(`Repaso terminado: ${seen} tarjetas`); return; }
        const c = queue[0], r = S.srs[c.id], esEn = S.settings.dir === 'es-en';
        rev.innerHTML = `<div class="rev-meta"><span>${queue.length} restantes</span><span>${c.src ? esc(c.src.level.code + ' · ' + c.src.title) : 'Mis frases'}${r && r.b === 0 ? ' · nueva' : ''}</span></div>
          <div class="flash">
            <p class="eyebrow">${esEn ? '¿Cómo lo dices en inglés?' : '¿Qué significa?'}</p>
            <p class="front">${esc(esEn ? c.es : c.en)}</p>
            ${esEn ? '' : `<div data-voice-only>${sayBtn(c.en)}</div>`}
            <div class="back" id="back" hidden>
              <p class="big-en">${esEn ? `${sayBtn(c.en)}${esc(c.en)}` : esc(c.es)}</p>
              ${c.ex ? `<p class="muted"><i>${esc(c.ex)}</i></p>` : ''}
            </div>
            <button class="btn primary" id="reveal">Mostrar respuesta <span class="chip" style="margin-left:4px">espacio</span></button>
          </div>
          <div class="grades" id="grades" hidden>
            <button class="btn g-again" data-g="again">Otra vez<small>${nextIv(r, 'again')}</small></button>
            <button class="btn" data-g="hard">Difícil<small>${nextIv(r, 'hard')}</small></button>
            <button class="btn" data-g="good">Bien<small>${nextIv(r, 'good')}</small></button>
            <button class="btn g-easy" data-g="easy">Fácil<small>${nextIv(r, 'easy')}</small></button>
          </div>`;
        const reveal = () => {
          if (!$('#back') || !$('#back').hidden) return;
          $('#back').hidden = false; $('#reveal').remove(); $('#grades').hidden = false;
          if (esEn) Voice.speak(c.en);
        };
        $('#reveal').onclick = reveal;
        $$('#grades button').forEach((b) => b.onclick = () => {
          grade(c.id, b.dataset.g); seen++; n++;
          queue.shift();
          if (b.dataset.g === 'again') queue.splice(Math.min(queue.length, 3 + Math.floor(Math.random() * 3)), 0, c);
          updateBadge(); show();
        });
        keyH = (e) => {
          if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if ($('#back') && $('#back').hidden) reveal(); }
          const map = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
          if (map[e.key] && $('#grades') && !$('#grades').hidden) $(`#grades [data-g="${map[e.key]}"]`).click();
        };
      };
      let keyH = null;
      const onKey = (e) => { if (!rev.isConnected) { document.removeEventListener('keydown', onKey); return; } if (keyH) keyH(e); };
      document.addEventListener('keydown', onKey);
      Stop.add(() => document.removeEventListener('keydown', onKey));
      show();
    };
    void m;
  }

  /* ================= ¿Cómo se dice? ================= */
  function renderSay() {
    const lastU = contUnit() || UNITS[0];
    main().innerHTML = `<div class="page-head">
        <p class="eyebrow">Generador de frases</p>
        <h1>¿Cómo se dice…?</h1>
        <p class="lead">Escribe en español lo que quieres decir en una conversación real y obtén varias formas naturales de decirlo en inglés, del registro casual al formal. Guarda las que te sirvan: entran a tu repaso.</p>
      </div>
      <div class="say-grid">
        <div class="stack">
          <div class="card stack" data-ai hidden>
            <label for="sayIn" style="font-weight:700">Lo que quiero decir</label>
            <textarea id="sayIn" rows="3" placeholder="Ej.: No estoy seguro de que los datos sean confiables todavía, necesitamos repetir la medición."></textarea>
            <div class="row">
              <label class="check">Contexto <select id="sayCtx" style="width:auto;margin-left:6px"><option value="conversación casual">Conversación casual</option><option value="trabajo o laboratorio">Trabajo / laboratorio</option><option value="académico: clase, congreso o artículo">Académico / congreso</option><option value="email formal">Email formal</option></select></label>
              <button class="btn primary" id="sayBtn">${I.spark} Dame opciones</button>
            </div>
            <div id="sayOut" class="stack"></div>
          </div>
          <div class="card stack" data-noai>
            <h2>Sin tutor con IA en esta vista</h2>
            <p class="muted">Usa el buscador de la derecha: pega una expresión en español o inglés y ábrela en Reverso Context o Linguee para ver cómo la traducen en textos reales.</p>
          </div>
          <div class="card stack">
            <div class="sec-head"><h2>Mis frases guardadas</h2><span class="chip">${(S.custom || []).length}</span></div>
            <div id="mine"></div>
          </div>
        </div>
        <div>${searchTool()}</div>
      </div>`;
    wireSearch();
    const drawMine = () => {
      const box = $('#mine'), list = S.custom || [];
      box.innerHTML = list.length ? `<ol class="phrases">${list.slice().reverse().map((c) => `<li>${sayBtn(c.en)}<div><p class="en">${esc(c.en)}</p><p class="es">${esc(c.es)}</p><button class="btn sm ghost" data-del="${esc(c.id)}" style="margin-top:6px">Quitar</button></div></li>`).join('')}</ol>` : '<p class="muted">Aún no guardaste frases.</p>';
      $$('[data-del]', box).forEach((b) => b.onclick = () => { S.custom = S.custom.filter((c) => c.id !== b.dataset.del); delete S.srs['c:' + b.dataset.del]; save(); drawMine(); updateBadge(); });
    };
    drawMine();
    const btn = $('#sayBtn');
    btn.onclick = async () => {
      const txt = $('#sayIn').value.trim(); if (!txt || !AI.on) return;
      const out = $('#sayOut'); btn.disabled = true; out.innerHTML = '<span class="thinking">Buscando formas naturales…</span>';
      try {
        const r = await AI.json(`${learnerCtx(lastU)}
The learner wants to say this in English: «${txt.slice(0, 600)}»
Context: ${$('#sayCtx').value}.
Give 3 natural ways to say it, from simplest to most advanced, as a native speaker would in that context. For each: the English sentence, its register (casual, neutral or formal) and a short note in Spanish about nuance or when to use it. Then list up to 4 key chunks from your answers with their Spanish meaning.
Reply with only JSON: {"options":[{"en":"...","register":"...","note":"..."}],"chunks":[{"en":"...","es":"..."}]}`);
        const opts = (r && Array.isArray(r.options)) ? r.options.slice(0, 4) : [];
        const chunks = (r && Array.isArray(r.chunks)) ? r.chunks.slice(0, 6) : [];
        out.innerHTML = opts.map((o, i) => `<div class="opt-card"><p class="en">${sayBtn(o.en, true)}<span>${esc(o.en)}</span></p><p class="muted"><span class="chip">${esc(o.register || '')}</span> ${esc(o.note || '')}</p><div class="row"><button class="btn sm" data-save="${i}">Guardar en mi repaso</button></div></div>`).join('')
          + (chunks.length ? `<div><p class="eyebrow" style="margin:6px 0">Bloques clave</p><div class="bank">${chunks.map((c) => `<button type="button" data-say="${esc(c.en)}" title="${esc(c.es)}">${esc(c.en)} · <span class="muted">${esc(c.es)}</span></button>`).join('')}</div></div>` : '');
        $$('[data-save]', out).forEach((b) => b.onclick = () => {
          const o = opts[+b.dataset.save]; if (!o) return;
          const id = String(Date.now()) + Math.floor(Math.random() * 1000);
          S.custom = (S.custom || []).concat([{ id, en: String(o.en).slice(0, 300), es: txt.slice(0, 300), note: String(o.note || '').slice(0, 200) }]);
          S.srs['c:' + id] = { b: 0, d: 0 };
          save(); drawMine(); updateBadge(); b.disabled = true; b.textContent = 'Guardada';
        });
      } catch (e) { out.innerHTML = `<p class="err-msg">${esc(AI.fail(e))}</p>`; }
      btn.disabled = false;
    };
  }

  /* ================= Biblioteca ================= */
  function renderLibrary() {
    let f = 'Todos';
    const draw = () => {
      main().innerHTML = `<div class="page-head">
          <p class="eyebrow">Biblioteca verificada</p>
          <h1>Recursos de calidad</h1>
          <p class="lead">${esc(X.libraryIntro || '')}</p>
        </div>
        <div class="filters" role="group" aria-label="Filtrar por nivel">${['Todos', 'A1', 'A2', 'B1', 'B2', 'C1'].map((x) => `<button class="${x === f ? 'on' : ''}" data-f="${x}">${x}</button>`).join('')}</div>
        ${(X.library || []).map((sec) => {
          const items = sec.items.filter((l) => f === 'Todos' || !l[3] || l[3].split(',').map((s) => s.trim()).includes(f));
          if (!items.length) return '';
          return `<section class="lib-sec"><h2>${esc(sec.t)}</h2><p class="muted">${esc(sec.d)}</p><div class="links">${items.map(linkCard).join('')}</div></section>`;
        }).join('')}`;
      $$('.filters button').forEach((b) => b.onclick = () => { f = b.dataset.f; draw(); });
    };
    draw();
  }

  /* ================= Método ================= */
  function renderMethod() {
    main().innerHTML = X.methodHTML || '';
  }

  /* ================= Prueba de nivel ================= */
  function renderTest() {
    const qs = X.placement || [];
    let i = -1; const ans = [];
    const intro = () => {
      main().innerHTML = `<div class="page-head">
          <p class="eyebrow">Prueba de ubicación · 25 preguntas · 8 min</p>
          <h1>¿Dónde empiezo?</h1>
          <p class="lead">Preguntas de gramática y uso de A1 a C1. No busques respuestas ni adivines al azar: si no sabes, elige «No lo sé». El resultado te sugiere el nivel donde empezar tu ruta; siempre puedes volver a unidades anteriores.</p>
        </div>
        ${S.placement ? `<div class="card" style="max-width:760px;margin-bottom:16px"><p>Tu último resultado: <b>${S.placement.level.toUpperCase()}</b> (${esc(S.placement.date)}).</p></div>` : ''}
        <button class="btn primary big" id="startT">Empezar ${I.right}</button>`;
      $('#startT').onclick = () => { i = 0; q(); };
    };
    const q = () => {
      if (i >= qs.length) return result();
      const it = qs[i];
      main().innerHTML = `<div class="quiz" style="margin:0 auto">
        <div class="q-top"><span>Pregunta ${i + 1} de ${qs.length}</span><span>Prueba de nivel</span></div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${pct(i / qs.length)}%"></i></div>
        <div class="q-card"><p class="q-text">${esc(it[1])}</p><div class="opts">${it[2].map((o, j) => `<button class="opt" data-j="${j}"><kbd>${j + 1}</kbd>${esc(o)}</button>`).join('')}<button class="opt" data-j="-1"><kbd>?</kbd>No lo sé</button></div></div></div>`;
      $$('.opt').forEach((b) => b.onclick = () => { ans[i] = +b.dataset.j === it[3]; i++; q(); });
    };
    const result = () => {
      const lv = ['a1', 'a2', 'b1', 'b2', 'c1'];
      const sc = {}; lv.forEach((l) => { sc[l] = 0; });
      qs.forEach((it, k) => { if (ans[k]) sc[it[0]]++; });
      let start = 'c1';
      for (const l of lv) { if (sc[l] < 4) { start = l; break; } }
      const L = LEVELS.find((x) => x.id === start);
      main().innerHTML = `<div class="page-head"><p class="eyebrow">Resultado</p><h1>Empieza en ${start.toUpperCase()} · ${esc(L ? L.name : '')}</h1>
        <p class="lead">Consideramos un nivel superado con 4 de 5 aciertos. La prueba mide gramática y comprensión; si al conversar te sientes más lento, repasa las unidades de conversación del nivel anterior.</p></div>
        <div class="card" style="max-width:760px"><div class="lvbars">${lv.map((l) => `<div class="lvbar" style="--lv: var(--${l})"><span>${l.toUpperCase()}</span><div class="progress"><i style="width:${sc[l] * 20}%"></i></div><span>${sc[l]}/5</span></div>`).join('')}</div></div>
        <div class="row" style="margin-top:18px"><button class="btn primary big" id="setLv">Empezar mi ruta en ${start.toUpperCase()} ${I.right}</button><a class="btn big ghost" href="#ruta">Volver sin cambiar</a></div>`;
      $('#setLv').onclick = () => {
        S.placement = { level: start, date: today(), scores: sc };
        const first = UNITS.find((u) => u.level.id === start);
        S.last = first ? { unit: first.id, step: 'learn' } : S.last;
        save(); go(first ? `u-${first.id}-learn` : 'ruta');
      };
    };
    intro();
  }

  /* ================= Ajustes ================= */
  function fillVoiceSelect() {
    const sel = $('#voiceSel'); if (!sel) return;
    const sv = Voice.sorted();
    sel.innerHTML = sv.length ? sv.map((v) => `<option value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('') : '<option value="">Voz predeterminada del navegador</option>';
    if (Voice.a) sel.value = Voice.a.name;
  }
  function wireSettings() {
    const sh = $('#settings');
    const open = () => { sh.hidden = false; fillVoiceSelect(); $('#rateSel').value = String(S.settings.rate); $('#rateVal').textContent = S.settings.rate.toFixed(2) + '×'; $('#impOut').textContent = ''; $('#resetZone').hidden = true; };
    const close = () => { sh.hidden = true; };
    $('#settingsBtn').onclick = open;
    $('#closeSet').onclick = close;
    sh.addEventListener('click', (e) => { if (e.target === sh) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sh.hidden) close(); });
    $('#voiceSel').onchange = (e) => { S.settings.voice = e.target.value; Voice.pick(); save(); };
    $('#rateSel').oninput = (e) => { S.settings.rate = +e.target.value; $('#rateVal').textContent = S.settings.rate.toFixed(2) + '×'; };
    $('#rateSel').onchange = () => save();
    $('#testVoice').onclick = () => Voice.speak('Hi! I measure tiny vibrations with light. Nice to meet you.');
    $('#expBtn').onclick = async () => {
      const data = JSON.stringify(S);
      const ta = $('#impIn'); ta.value = data;
      try { await navigator.clipboard.writeText(data); $('#impOut').textContent = 'Copiado al portapapeles. Guárdalo en un archivo de texto.'; }
      catch (e) { ta.focus(); ta.select(); $('#impOut').textContent = 'Selecciona el texto del cuadro y cópialo (Ctrl+C).'; }
    };
    $('#impBtn').onclick = () => {
      try {
        const o = JSON.parse($('#impIn').value);
        if (!o || typeof o !== 'object' || !o.units) throw new Error('formato');
        S = fix(o); save(); $('#impOut').textContent = 'Progreso importado.'; route();
      } catch (e) { $('#impOut').textContent = 'No reconozco ese texto. Pega exactamente lo que copiaste con «Copiar mi progreso».'; }
    };
    $('#resetBtn1').onclick = () => { $('#resetZone').hidden = false; };
    $('#resetNo').onclick = () => { $('#resetZone').hidden = true; };
    $('#resetYes').onclick = () => {
      const keepSettings = S.settings;
      S = blank(); S.settings = keepSettings; save(); close(); go('ruta'); toast('Progreso reiniciado');
    };
  }

  /* ================= Arranque ================= */
  function measureTop() {
    const t = $('.top'); if (t) document.documentElement.style.setProperty('--top-h', t.offsetHeight + 'px');
  }
  function boot() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (a && !e.defaultPrevented && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(a.getAttribute('href')); return; }
      const s = e.target.closest('[data-say]');
      if (s) {
        e.preventDefault();
        const btn = s.classList.contains('play') ? s : s.querySelector('.play');
        $$('.speaking').forEach((x) => x.classList.remove('speaking'));
        if (btn) btn.classList.add('speaking');
        Voice.speak(s.getAttribute('data-say'), { onend: () => btn && btn.classList.remove('speaking') });
      }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-say][role="button"]')) { e.preventDefault(); e.target.click(); }
    });
    window.addEventListener('popstate', () => { current = (location.hash || '').replace(/^#/, '') || 'ruta'; route(); });
    window.addEventListener('resize', measureTop);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && Cloud.ref) { clearTimeout(Cloud.timer); Cloud.flush(); } });
    Voice.init();
    wireSettings();
    measureTop();
    syncBadge();
    route();
    Cloud.init();
    AI.init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
