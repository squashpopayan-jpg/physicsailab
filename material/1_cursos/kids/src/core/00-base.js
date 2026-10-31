/* ===================================================================
   00-base.js — espacio de nombres FK, utilidades, sonido, voz, confeti
   =================================================================== */
(function () {
  'use strict';
  const FK = (window.FK = window.FK || {});
  FK.sims = {};
  FK.sim = function (name, factory) { FK.sims[name] = factory; };

  /* ---------- Matemática pequeña ---------- */
  const M = (FK.M = {
    TAU: Math.PI * 2,
    clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
    lerp: (a, b, t) => a + (b - a) * t,
    rad: (d) => (d * Math.PI) / 180,
    deg: (r) => (r * 180) / Math.PI,
    sq: (x) => x * x,
    sign: (x) => (x > 0 ? 1 : x < 0 ? -1 : 0),
    rnd: (a = 0, b = 1) => a + Math.random() * (b - a),
    rndInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    smooth: (t) => t * t * (3 - 2 * t),
    gauss() { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    map: (x, a, b, c, d) => c + ((x - a) * (d - c)) / (b - a)
  });

  /* ---------- Formato (coma decimal, espacio para miles) ---------- */
  FK.n = function (x, d = 1) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    let s = Math.abs(x).toFixed(d);
    let [i, f] = s.split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const neg = x < 0 && /[1-9]/.test(s);
    return (neg ? '−' : '') + i + (f ? ',' + f : '');
  };
  FK.int = (x) => FK.n(Math.round(x), 0);
  const SUPS = { '-': '⁻', '.': '·', ',': ',', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  FK.sup = (n) => String(n).split('').map((c) => SUPS[c] || c).join('');
  const UNSUP = { '⁻': '−', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '·': ',' };
  /* Convierte exponentes en unicode (10⁻¹⁰) a <sup> para que se vean bien con cualquier fuente */
  FK.supHtml = (s) => String(s).replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '<sup>' + m.split('').map((c) => UNSUP[c] || c).join('') + '</sup>');
  FK.pow10 = (e) => '10' + FK.sup(Math.round(e * 10) / 10 === Math.round(e) ? Math.round(e) : (Math.round(e * 10) / 10).toString().replace('.', ','));
  /* Número «bonito»: pocas cifras, sin ceros de sobra */
  FK.nice = function (x, sig = 3) {
    if (!isFinite(x)) return FK.n(x);
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e7 || a < 1e-3) {
      const e = Math.floor(Math.log10(a));
      const m = (x / Math.pow(10, e)).toFixed(sig - 1).replace(/\.?0+$/, '').replace('.', ',');
      const sup = String(e).split('').map((c) => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c])).join('');
      return m + ' × 10' + sup;
    }
    const dec = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
    return FK.n(x, Math.min(dec, 6)).replace(/,?0+$/, (m) => (m.includes(',') ? '' : m));
  };

  /* ---------- DOM ---------- */
  FK.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  };
  FK.$ = (s, r) => (r || document).querySelector(s);
  FK.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  FK.reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Almacenamiento (progreso) ---------- */
  const mem = {};
  FK.store = {
    get(k, d) { try { const v = localStorage.getItem('fisicakids:' + k); return v === null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem('fisicakids:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    del(k) { delete mem[k]; try { localStorage.removeItem('fisicakids:' + k); } catch (e) { /* */ } },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('fisicakids:')) out.push(k.slice(11)); } } catch (e) { /* */ } return out.concat(Object.keys(mem).filter((k) => !out.includes(k))); }
  };

  /* ---------- Sonido (WebAudio) ---------- */
  let ac = null;
  FK.soundOn = () => FK.store.get('sound', true) !== false;
  FK.audioCtx = function () {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  };
  FK.tone = function (freq, dur = 0.2, o = {}) {
    if (!FK.soundOn()) return;
    const a = FK.audioCtx(); if (!a) return;
    const t = a.currentTime + (o.delay || 0);
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  };
  /* Tono sostenido (para simulaciones de sonido): devuelve { set(freq, vol), stop() } */
  FK.hum = function (freq = 440, vol = 0.1, type = 'sine') {
    if (!FK.soundOn()) return { set() {}, stop() {}, off: true };
    const a = FK.audioCtx(); if (!a) return { set() {}, stop() {}, off: true };
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = type; osc.frequency.value = freq; g.gain.value = 0.0001;
    osc.connect(g); g.connect(a.destination); osc.start();
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), a.currentTime + 0.05);
    let dead = false;
    return {
      set(f, v) { if (dead) return; const t = a.currentTime; if (f) osc.frequency.setTargetAtTime(f, t, 0.02); if (v !== undefined) g.gain.setTargetAtTime(Math.max(0.0001, v), t, 0.03); },
      stop() { if (dead) return; dead = true; const t = a.currentTime; g.gain.setTargetAtTime(0.0001, t, 0.03); osc.stop(t + 0.2); }
    };
  };
  FK.sfx = {
    ok() { FK.tone(660, 0.12); FK.tone(880, 0.18, { delay: 0.1 }); },
    no() { FK.tone(240, 0.25, { type: 'triangle', to: 150, vol: 0.18 }); },
    win() { [523, 659, 784, 1047].forEach((f, i) => FK.tone(f, 0.22, { delay: i * 0.11, type: 'triangle', vol: 0.16 })); },
    pop() { FK.tone(420, 0.09, { to: 900, vol: 0.12 }); },
    tick() { FK.tone(1000, 0.03, { vol: 0.05 }); },
    boom() { FK.tone(140, 0.4, { type: 'sawtooth', to: 40, vol: 0.2 }); },
    whoosh() { FK.tone(300, 0.3, { type: 'sawtooth', to: 900, vol: 0.05 }); }
  };

  /* ---------- Voz: leer en voz alta ---------- */
  FK.speakOK = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  FK.speaking = false;
  FK.speak = function (text, onend) {
    if (!FK.speakOK()) return false;
    const s = window.speechSynthesis;
    s.cancel();
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (!clean) return false;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'es-CO';
    const vs = s.getVoices();
    const v = vs.find((x) => /^es[-_](CO|MX|US|419)/i.test(x.lang)) || vs.find((x) => /^es/i.test(x.lang));
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.92; u.pitch = 1.1;
    u.onend = u.onerror = () => { FK.speaking = false; if (onend) onend(); };
    FK.speaking = true;
    s.speak(u);
    return true;
  };
  FK.stopSpeak = function () { if (FK.speakOK()) window.speechSynthesis.cancel(); FK.speaking = false; };

  /* ---------- Confeti ---------- */
  FK.confetti = function (n = 70) {
    if (FK.reduced()) return;
    const cv = FK.el('canvas', 'confetti');
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const cols = ['#FF4757', '#FF8A1F', '#FFC21A', '#12B76A', '#1E88FF', '#8E5CF6', '#FF3E9D'];
    const ps = Array.from({ length: n }, () => ({
      x: cv.width / 2 + (Math.random() - 0.5) * cv.width * 0.3, y: cv.height * 0.35,
      vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 3, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4,
      c: cols[(Math.random() * cols.length) | 0]
    }));
    const t0 = performance.now();
    (function f(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of ps) {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - t / 2.2);
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      }
      if (t < 2.2) requestAnimationFrame(f); else cv.remove();
    })(t0);
  };

  /* ---------- Aviso breve ---------- */
  FK.toast = function (html) {
    const t = FK.el('div', 'toast', html);
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2600);
  };

  /* Animación breve: fn(p) con p de 0 a 1 */
  FK.tween = function (dur, fn, done) {
    const t0 = performance.now(); let stop = false;
    const tick = (now) => { if (stop) return; const p = Math.min(1, (now - t0) / (dur * 1000)); fn(p); if (p < 1) requestAnimationFrame(tick); else if (done) done(); };
    requestAnimationFrame(tick);
    return () => { stop = true; };
  };
})();
