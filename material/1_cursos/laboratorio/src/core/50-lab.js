/* ===================================================================
   50-lab.js — Herramientas del laboratorio:
   · análisis de datos (regresión, ajuste no lineal, FFT, filtros, CSV)
   · modelos de sensores (ruido, cuantización, muestreo)
   · resaltado de código Arduino y bloques de App Inventor
   · dibujos: celular, placa ESP32, imanes, bobinas, componentes
   · motor isométrico de piezas LEGO con instrucciones por pasos
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC;
  const M = MC.M;
  const D = MC.draw;
  const C = (c) => MC.col(c);
  const L = (MC.lab = {});

  /* ================= Análisis de datos ================= */
  L.gauss = (s = 1) => M.gauss(0, s);
  L.quant = (x, lsb) => (lsb > 0 ? Math.round(x / lsb) * lsb : x);

  /* Regresión lineal y = m x + b. sy opcional (incertidumbres de y) → ajuste ponderado */
  L.fitLine = function (xs, ys, sy) {
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return null;
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
    for (let i = 0; i < n; i++) {
      const w = sy ? 1 / (sy[i] * sy[i]) : 1;
      S += w; Sx += w * xs[i]; Sy += w * ys[i]; Sxx += w * xs[i] * xs[i]; Sxy += w * xs[i] * ys[i];
    }
    const Dt = S * Sxx - Sx * Sx;
    if (Math.abs(Dt) < 1e-300) return null;
    const m = (S * Sxy - Sx * Sy) / Dt, b = (Sxx * Sy - Sx * Sxy) / Dt;
    let ssr = 0, sst = 0;
    const my = Sy / S;
    for (let i = 0; i < n; i++) {
      const w = sy ? 1 / (sy[i] * sy[i]) : 1;
      const r = ys[i] - (m * xs[i] + b);
      ssr += w * r * r;
      sst += w * (ys[i] - my) * (ys[i] - my);
    }
    let sm, sb;
    if (sy) { sm = Math.sqrt(S / Dt); sb = Math.sqrt(Sxx / Dt); }
    else {
      const s2 = n > 2 ? ssr / (n - 2) : 0;
      sm = Math.sqrt((s2 * S) / Dt); sb = Math.sqrt((s2 * Sxx) / Dt);
    }
    return { m, b, sm, sb, r2: sst > 0 ? 1 - ssr / sst : 1, chi2: ssr, n, f: (x) => m * x + b };
  };
  /* Recta por el origen y = m x */
  L.fitProp = function (xs, ys) {
    let sxx = 0, sxy = 0;
    const n = Math.min(xs.length, ys.length);
    for (let i = 0; i < n; i++) { sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
    const m = sxy / sxx;
    let ssr = 0;
    for (let i = 0; i < n; i++) { const r = ys[i] - m * xs[i]; ssr += r * r; }
    return { m, sm: n > 1 ? Math.sqrt(ssr / (n - 1) / sxx) : 0, n, f: (x) => m * x };
  };
  /* Resuelve A x = b (Gauss con pivoteo); devuelve x o null */
  L.solve = function (A, b) {
    const n = b.length;
    const a = A.map((r, i) => r.slice().concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      if (Math.abs(a[p][c]) < 1e-300) return null;
      [a[c], a[p]] = [a[p], a[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = a[r][c] / a[c][c];
        for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
      }
    }
    return a.map((r, i) => r[n] / r[i]);
  };
  L.inverse = function (A) {
    const n = A.length;
    const out = [];
    for (let j = 0; j < n; j++) {
      const e = new Array(n).fill(0); e[j] = 1;
      const col = L.solve(A, e);
      if (!col) return null;
      out.push(col);
    }
    return A.map((_, i) => out.map((c) => c[i]));
  };
  /* Polinomio de grado deg: coeficientes a0..adeg y sus incertidumbres */
  L.fitPoly = function (xs, ys, deg) {
    const n = Math.min(xs.length, ys.length), k = deg + 1;
    if (n < k) return null;
    const A = Array.from({ length: k }, () => new Array(k).fill(0));
    const B = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const pw = [1];
      for (let j = 1; j < 2 * k; j++) pw.push(pw[j - 1] * xs[i]);
      for (let r = 0; r < k; r++) { B[r] += pw[r] * ys[i]; for (let c = 0; c < k; c++) A[r][c] += pw[r + c]; }
    }
    const a = L.solve(A, B);
    if (!a) return null;
    const f = (x) => { let s = 0, p = 1; for (let j = 0; j < k; j++) { s += a[j] * p; p *= x; } return s; };
    let ssr = 0;
    for (let i = 0; i < n; i++) { const r = ys[i] - f(xs[i]); ssr += r * r; }
    const s2 = n > k ? ssr / (n - k) : 0;
    const inv = L.inverse(A);
    const sa = inv ? inv.map((r, i) => Math.sqrt(Math.max(0, s2 * r[i]))) : a.map(() => NaN);
    return { a, sa, f, chi2: ssr, n };
  };
  /* Ajuste no lineal de Levenberg–Marquardt. model(x, p) → y */
  L.fitLM = function (model, p0, xs, ys, o = {}) {
    const n = Math.min(xs.length, ys.length), k = p0.length;
    let p = p0.slice();
    const resid = (pp) => { let s = 0; for (let i = 0; i < n; i++) { const r = ys[i] - model(xs[i], pp); s += r * r; } return s; };
    let chi = resid(p), lam = 1e-3, ok = true, it = 0;
    if (!isFinite(chi)) return null;
    const maxIt = o.maxIt || 200;
    let JTJ = null;
    for (it = 0; it < maxIt; it++) {
      const J = [];
      for (let i = 0; i < n; i++) {
        const row = [];
        const y0 = model(xs[i], p);
        for (let j = 0; j < k; j++) {
          const h = Math.max(1e-8, Math.abs(p[j]) * 1e-6);
          const pp = p.slice(); pp[j] += h;
          row.push((model(xs[i], pp) - y0) / h);
        }
        J.push([row, ys[i] - y0]);
      }
      JTJ = Array.from({ length: k }, () => new Array(k).fill(0));
      const JTr = new Array(k).fill(0);
      for (const [row, r] of J) for (let a = 0; a < k; a++) { JTr[a] += row[a] * r; for (let b = 0; b < k; b++) JTJ[a][b] += row[a] * row[b]; }
      let improved = false;
      for (let tries = 0; tries < 12; tries++) {
        const A = JTJ.map((r, i) => r.map((v, j) => (i === j ? v * (1 + lam) + 1e-12 : v)));
        const dp = L.solve(A, JTr);
        if (!dp) { lam *= 10; continue; }
        const pn = p.map((v, i) => v + dp[i]);
        const cn = resid(pn);
        if (isFinite(cn) && cn < chi) {
          const rel = (chi - cn) / Math.max(chi, 1e-300);
          p = pn; chi = cn; lam = Math.max(lam / 5, 1e-12); improved = true;
          if (rel < 1e-10) it = maxIt;
          break;
        }
        lam *= 8;
      }
      if (!improved) break;
    }
    const s2 = n > k ? chi / (n - k) : 0;
    const inv = JTJ ? L.inverse(JTJ) : null;
    if (!inv) ok = false;
    const sp = inv ? inv.map((r, i) => Math.sqrt(Math.max(0, s2 * r[i]))) : p.map(() => NaN);
    return { p, sp, chi2: chi, n, ok, f: (x) => model(x, p) };
  };

  /* FFT radix-2 en el lugar */
  L.fft = function (re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let j = 0; j < len / 2; j++) {
          const ar = re[i + j], ai = im[i + j];
          const br = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
          const bi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
          re[i + j] = ar + br; im[i + j] = ai + bi;
          re[i + j + len / 2] = ar - br; im[i + j + len / 2] = ai - bi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  };
  /* Espectro de amplitud con ventana de Hann. Devuelve {f, a, peak} */
  L.spectrum = function (ys, dt, o = {}) {
    const n0 = ys.length;
    if (n0 < 4) return { f: [], a: [], peak: NaN };
    let N = 1;
    while (N < n0 * (o.pad || 2)) N <<= 1;
    N = Math.min(N, 1 << 16);
    const mean = M.mean(ys);
    const re = new Array(N).fill(0), im = new Array(N).fill(0);
    let wsum = 0;
    for (let i = 0; i < Math.min(n0, N); i++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n0 - 1)); wsum += w; re[i] = (ys[i] - mean) * w; }
    L.fft(re, im);
    const f = [], a = [];
    let best = 1;
    for (let k = 0; k <= N / 2; k++) {
      f.push(k / (N * dt));
      a.push((2 * Math.hypot(re[k], im[k])) / wsum);
      if (k > 0 && a[k] > a[best]) best = k;
    }
    /* interpolación parabólica del pico */
    let peak = f[best];
    if (best > 0 && best < a.length - 1) {
      const y0 = a[best - 1], y1 = a[best], y2 = a[best + 1];
      const d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2));
      if (isFinite(d)) peak = (best + d) / (N * dt);
    }
    return { f, a, peak, amp: a[best] };
  };
  L.movAvg = function (ys, n) {
    if (n <= 1) return ys.slice();
    const out = new Array(ys.length);
    const h = Math.floor(n / 2);
    for (let i = 0; i < ys.length; i++) {
      let s = 0, c = 0;
      for (let j = Math.max(0, i - h); j <= Math.min(ys.length - 1, i + h); j++) { s += ys[j]; c++; }
      out[i] = s / c;
    }
    return out;
  };
  /* Filtro pasa-bajas exponencial (EMA) */
  L.ema = function (ys, alpha) {
    const out = new Array(ys.length);
    let y = ys[0];
    for (let i = 0; i < ys.length; i++) { y = y + alpha * (ys[i] - y); out[i] = y; }
    return out;
  };
  L.deriv = function (xs, ys) {
    const n = ys.length, out = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      out[i] = b > a ? (ys[b] - ys[a]) / (xs[b] - xs[a]) : NaN;
    }
    return out;
  };
  L.cumtrapz = function (xs, ys, y0 = 0) {
    const out = [y0];
    for (let i = 1; i < ys.length; i++) out.push(out[i - 1] + 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]));
    return out;
  };
  /* Cruces por un nivel (con interpolación lineal); dir = +1 subida, -1 bajada, 0 ambos */
  L.crossings = function (xs, ys, level = 0, dir = 1) {
    const out = [];
    for (let i = 1; i < ys.length; i++) {
      const a = ys[i - 1] - level, b = ys[i] - level;
      if ((dir >= 0 && a < 0 && b >= 0) || (dir <= 0 && a > 0 && b <= 0)) out.push(xs[i - 1] + ((xs[i] - xs[i - 1]) * a) / (a - b));
    }
    return out;
  };

  /* Lectura de CSV/TSV con coma o punto decimal */
  L.parseCSV = function (text) {
    const lines = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim().length);
    if (!lines.length) return null;
    const cand = ['\t', ';', ','];
    let sep = ',';
    for (const s of cand) if (lines[0].split(s).length > 1) { sep = s; break; }
    const split = (l) => {
      const out = [];
      let cur = '', q = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i];
        if (ch === '"') { q = !q; continue; }
        if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch;
      }
      out.push(cur);
      return out.map((s) => s.trim());
    };
    const num = (s) => {
      if (s === '') return NaN;
      let t = s.replace(/\s/g, '');
      if (sep !== ',' && /^[-+]?\d+,\d+([eE][-+]?\d+)?$/.test(t)) t = t.replace(',', '.');
      const v = Number(t);
      return isFinite(v) ? v : NaN;
    };
    const rows = lines.map(split);
    let headers = rows[0];
    let start = 1;
    if (headers.every((h) => isFinite(num(h)))) { headers = headers.map((_, i) => 'col' + (i + 1)); start = 0; }
    const cols = headers.map(() => []);
    for (let r = start; r < rows.length; r++) {
      const row = rows[r];
      if (row.length < 2 && headers.length > 1) continue;
      headers.forEach((_, i) => cols[i].push(num(row[i] === undefined ? '' : row[i])));
    }
    return { headers, cols, sep };
  };
  /* Valor ± incertidumbre con cifras significativas coherentes */
  L.pm = function (v, s, unit = '') {
    if (!isFinite(v)) return '—';
    if (!(s > 0) || !isFinite(s)) return MC.sci(v, 4) + (unit ? ' ' + unit : '');
    const e = Math.floor(Math.log10(s));
    const lead = s / Math.pow(10, e);
    const dig = lead < 2.5 ? 2 : 1;
    const dec = -(e - dig + 1);
    const big = Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0);
    if (big || dec > 8 || dec < -6) {
      const ev = Math.floor(Math.log10(Math.abs(v) || s));
      const f = Math.pow(10, ev);
      const d2 = Math.max(0, ev - e + dig - 1);
      return '(' + MC.fix(v / f, d2) + ' ± ' + MC.fix(s / f, d2) + ')×10' + MC.sup(ev) + (unit ? ' ' + unit : '');
    }
    const d = Math.max(0, dec);
    const r = (x) => (d > 0 ? MC.fix(x, d) : MC.fix(Math.round(x / Math.pow(10, -dec)) * Math.pow(10, -dec), 0));
    return r(v) + ' ± ' + r(s) + (unit ? ' ' + unit : '');
  };
  /* Copiar texto al portapapeles desde un botón */
  L.copy = function (text, btn, host) {
    const ok = () => { if (btn) { btn.classList.add('done'); const t = btn.dataset.lbl || btn.textContent; btn.dataset.lbl = t; if (btn.tagName === 'BUTTON' && !btn.querySelector('svg')) btn.textContent = 'Copiado ✓'; setTimeout(() => { btn.classList.remove('done'); if (btn.tagName === 'BUTTON' && !btn.querySelector('svg')) btn.textContent = t; }, 1500); } };
    const fallback = () => {
      const ta = MC.el('textarea', 'copy-fallback');
      ta.value = text;
      (host || document.body).append(ta);
      ta.select();
      setTimeout(() => ta.remove(), 15000);
    };
    try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
  };
  L.tsv = (headers, rows) => [headers.join('\t')].concat(rows.map((r) => r.map((v) => (typeof v === 'number' ? (isFinite(v) ? String(+v.toPrecision(7)) : '') : v)).join('\t'))).join('\n');

  /* ================= Modelos de sensor ================= */
  /* Sensor genérico: bias, ruido gaussiano, resolución (LSB), rango (saturación) */
  L.Sensor = class {
    constructor(o = {}) { this.o = Object.assign({ noise: 0, bias: 0, lsb: 0, range: Infinity, gain: 1 }, o); }
    read(v) {
      const o = this.o;
      let y = o.gain * v + o.bias + (o.noise ? M.gauss(0, o.noise) : 0);
      y = M.clamp(y, -o.range, o.range);
      return L.quant(y, o.lsb);
    }
  };
  /* Perfiles típicos (órdenes de magnitud de celulares de gama media) */
  L.PHONE = {
    acc: { noise: 0.012, lsb: 0.0024, range: 78, rate: 400, unit: 'm/s²' },
    gyr: { noise: 0.0015, lsb: 0.0011, range: 34.9, rate: 400, unit: 'rad/s' },
    mag: { noise: 0.3, lsb: 0.06, range: 4900, rate: 100, unit: 'µT' },
    pre: { noise: 0.6, lsb: 0.1, range: 1.1e5, rate: 25, unit: 'Pa' },
    lux: { noise: 0.5, lsb: 1, range: 4e4, rate: 10, unit: 'lx' }
  };

  /* ================= Resaltado de código ================= */
  const KW = new Set('void int float double long short unsigned signed const volatile static if else for while do return break continue switch case default true false bool boolean char byte struct class public private new delete sizeof auto enum typedef using namespace nullptr'.split(' '));
  const TY = new Set('uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t size_t String HIGH LOW INPUT OUTPUT INPUT_PULLUP INPUT_PULLDOWN FALLING RISING CHANGE IRAM_ATTR LED_BUILTIN PI DEC HEX'.split(' '));
  const FN = new Set('setup loop pinMode digitalWrite digitalRead analogRead analogReadMilliVolts analogReadResolution analogSetAttenuation analogWrite dacWrite delay delayMicroseconds millis micros attachInterrupt detachInterrupt digitalPinToInterrupt pulseIn constrain map abs sqrt sq pow sin cos atan2 fabs log exp min max noInterrupts interrupts ledcAttach ledcWrite tone noTone'.split(' '));
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  MC.highlight = function (code, lang) {
    if (lang && !/^(cpp|ino|arduino|c)$/.test(lang)) return esc(code);
    let out = '', i = 0;
    const n = code.length;
    const span = (cls, s) => `<span class="tk-${cls}">${esc(s)}</span>`;
    let lineStart = true;
    while (i < n) {
      const ch = code[i];
      if (ch === '\n') { out += ch; i++; lineStart = true; continue; }
      if (lineStart && /\s/.test(ch)) { out += ch; i++; continue; }
      if (lineStart && ch === '#') {
        let j = code.indexOf('\n', i); if (j < 0) j = n;
        const line = code.slice(i, j);
        const m = line.match(/^(#\s*\w+)(.*)$/);
        if (m) out += span('pp', m[1]) + (m[2].includes('//') ? esc(m[2].slice(0, m[2].indexOf('//'))) + span('co', m[2].slice(m[2].indexOf('//'))) : esc(m[2]));
        else out += span('pp', line);
        i = j; lineStart = false; continue;
      }
      lineStart = false;
      if (ch === '/' && code[i + 1] === '/') { let j = code.indexOf('\n', i); if (j < 0) j = n; out += span('co', code.slice(i, j)); i = j; continue; }
      if (ch === '/' && code[i + 1] === '*') { let j = code.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; out += span('co', code.slice(i, j)); i = j; continue; }
      if (ch === '"' || ch === '\'') {
        let j = i + 1;
        while (j < n && code[j] !== ch && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
        out += span('st', code.slice(i, j + 1)); i = j + 1; continue;
      }
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i + 1] || ''))) {
        const m = code.slice(i).match(/^(0x[0-9a-fA-F]+|\d*\.?\d+(?:[eE][-+]?\d+)?[fFuUlL]*)/);
        out += span('nu', m[0]); i += m[0].length; continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        const m = code.slice(i).match(/^[A-Za-z_]\w*/)[0];
        const next = code.slice(i + m.length).match(/^\s*\(/);
        if (KW.has(m)) out += span('kw', m);
        else if (TY.has(m)) out += span('ty', m);
        else if (FN.has(m) || (next && /^[a-z]/.test(m) && code[i - 1] === '.')) out += span('fn', m);
        else if (next && /^[a-z]/.test(m)) out += span('fn', m);
        else out += esc(m);
        i += m.length; continue;
      }
      out += esc(ch); i++;
    }
    return out;
  };

  /* ================= Bloques de App Inventor =================
     Mini lenguaje por sangría (2 espacios):
       when Comp.Evento (p1, p2)      → bloque de evento
       set Comp.Prop to EXPR          → asignación de propiedad
       set global x to EXPR / set x to EXPR
       call Comp.Metodo arg=EXPR ...  → llamada (instrucción)
       if EXPR / else if EXPR / else
       for each item in list EXPR
       initialize global x to EXPR
       to proc (a, b)                 → procedimiento
       ?? / ??s                       → hueco vacío (valor / instrucción)
     Expresiones entre corchetes:
       [get x] ["texto"] [3.5] [Comp.Prop] [call Comp.M a=..] [join A B]
       [+ A B] [- A B] [* A B] [/ A B] [= A B] [> A B] [< A B] [and A B] [not A] [true]
       [round A] [sqrt A] [abs A] [split text=A at=B] [select list=A index=B]
       [create empty list] [length of list A] [is empty A] */
  const AI_COLOR = {
    math: ['+', '-', '*', '/', '×', '÷', '^', 'round', 'sqrt', 'abs', 'atan2', 'sin', 'cos', 'min', 'max', 'random integer', 'number', '=', '≠', '<', '>', '≤', '≥', 'format as decimal', 'modulo of', 'neg'],
    logic: ['true', 'false', 'and', 'or', 'not'],
    txt: ['join', 'split', 'length', 'segment', 'contains', 'trim', 'upcase', 'replace all', 'is empty', 'split at first'],
    list: ['create empty list', 'make a list', 'select list item', 'select', 'length of list', 'add items to list', 'is list empty', 'index in list', 'list to csv row', 'list from csv row', 'list to csv table']
  };
  const aiTok = function (s) {
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '[') {
        let d = 0, j = i;
        for (; j < s.length; j++) { if (s[j] === '[') d++; else if (s[j] === ']') { d--; if (!d) break; } else if (s[j] === '"') { j = s.indexOf('"', j + 1); } }
        toks.push({ t: 'expr', v: s.slice(i + 1, j) });
        i = j + 1; continue;
      }
      if (ch === '"') { const j = s.indexOf('"', i + 1); toks.push({ t: 'str', v: s.slice(i + 1, j < 0 ? s.length : j) }); i = j < 0 ? s.length : j + 1; continue; }
      let j = i;
      while (j < s.length && !/\s/.test(s[j]) && s[j] !== '[') j++;
      toks.push({ t: 'word', v: s.slice(i, j) });
      i = j;
    }
    return toks;
  };
  const bk = (cls, rowHtml, bodyHtml) => `<div class="bk ${cls}"><div class="bk-row">${rowHtml}</div>${bodyHtml || ''}</div>`;
  const fld = (s, drop) => `<span class="bk-field${drop ? ' drop' : ''}">${esc(s)}</span>`;
  const slotHtml = (id, stmt) => `<span class="bk-slot${stmt ? ' stmt' : ''}" data-slot="${id}"></span>`;
  /* Renderiza una expresión (texto dentro de corchetes o token) */
  function aiExpr(tok, ctx) {
    if (!tok) return '';
    if (tok.t === 'str') return bk('txt', `<span>“</span>${fld(tok.v)}<span>”</span>`);
    if (tok.t === 'word') {
      const v = tok.v;
      if (/^\?\?(\d*)$/.test(v)) return slotHtml(ctx && ctx.slot ? ctx.slot(v) : v.slice(2), false);
      if (/^-?\d*\.?\d+$/.test(v)) return bk('math', fld(v));
      if (/^".*"$/.test(v)) return bk('txt', `<span>“</span>${fld(v.slice(1, -1))}<span>”</span>`);
      return `<span class="bk-kw">${esc(v)}</span>`;
    }
    const s = tok.v.trim();
    if (/^"[^"]*"$/.test(s)) return bk('txt', `<span>“</span>${fld(s.slice(1, -1))}<span>”</span>`);
    if (/^-?\d*\.?\d+$/.test(s)) return bk('math', fld(s));
    const toks = aiTok(s);
    const head = toks[0] ? toks[0].v : '';
    const rest = toks.slice(1);
    const args = (list) => list.map((t) => {
      if (t.t === 'word' && /=$/.test(t.v)) return `<span>${esc(t.v.slice(0, -1))}</span>`;
      if (t.t === 'word' && /^\w+=/.test(t.v)) { const [k, v] = t.v.split('='); return `<span>${esc(k)}</span>` + (v ? aiExpr({ t: 'word', v }, ctx) : ''); }
      return aiExpr(t, ctx);
    }).join('');
    if (head === 'get') {
      const g = rest.map((t) => t.v).join(' ');
      return bk('var', `<span class="bk-kw">get</span>${fld(g, true)}`);
    }
    if (head === 'call') {
      const name = rest[0] ? rest[0].v : '';
      return bk('call', `<span class="bk-kw">call</span>${fld(name, true)}${args(rest.slice(1))}`);
    }
    if (/^[A-Z]\w*\.\w+$/.test(head) && toks.length === 1) {
      const [c, p] = head.split('.');
      return bk('get', `${fld(c, true)}<span>.</span>${fld(p, true)}`);
    }
    if (['+', '-', '*', '/', '×', '÷', '^', '=', '≠', '<', '>', '≤', '≥'].includes(head) && rest.length === 2) {
      const op = { '*': '×', '/': '÷' }[head] || head;
      const cls = ['=', '≠', '<', '>', '≤', '≥'].includes(head) ? 'math' : 'math';
      return bk(cls, `${aiExpr(rest[0], ctx)}<span class="bk-kw">${esc(op)}</span>${aiExpr(rest[1], ctx)}`);
    }
    if (['and', 'or'].includes(head) && rest.length === 2) return bk('logic', `${aiExpr(rest[0], ctx)}<span class="bk-kw">${head}</span>${aiExpr(rest[1], ctx)}`);
    if (head === 'true' || head === 'false') return bk('logic', fld(head, true));
    let cls = 'math';
    const phrase = toks.filter((t) => t.t === 'word' && !/=/.test(t.v) && !/^\?\?/.test(t.v)).map((t) => t.v).join(' ');
    for (const k of Object.keys(AI_COLOR)) if (AI_COLOR[k].some((w) => phrase.startsWith(w) || head === w)) { cls = k; break; }
    if (head === 'join') cls = 'txt';
    /* palabras iniciales como rótulo, el resto como argumentos */
    let li = 0;
    const lab = [];
    while (li < toks.length && toks[li].t === 'word' && !/=/.test(toks[li].v) && !/^\?\?/.test(toks[li].v) && !/^-?\d*\.?\d+$/.test(toks[li].v)) lab.push(toks[li++].v);
    return bk(cls, `<span class="bk-kw">${esc(lab.join(' '))}</span>${args(toks.slice(li))}`);
  }
  /* Parsea el texto en árbol de instrucciones por sangría */
  function aiParse(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    const root = { kids: [], ind: -1 };
    const stack = [root];
    for (const raw of lines) {
      const ind = raw.match(/^ */)[0].length;
      const line = raw.trim();
      while (stack.length > 1 && stack[stack.length - 1].ind >= ind) stack.pop();
      const parent = stack[stack.length - 1];
      const node = { line, ind, kids: [] };
      /* else / else if se cuelgan del if hermano anterior */
      if (/^else\b/.test(line)) {
        const sib = parent.kids[parent.kids.length - 1];
        if (sib && /^if\b/.test(sib.line)) { sib.alts = sib.alts || []; sib.alts.push(node); stack.push(node); continue; }
      }
      parent.kids.push(node);
      stack.push(node);
    }
    return root.kids;
  }
  function aiStmt(node, ctx) {
    const line = node.line;
    const body = (kids) => `<div class="bk-body">${kids.length ? kids.map((k) => aiStmt(k, ctx)).join('') : ''}</div>`;
    let m;
    if (/^\?\?s(\d*)$/.test(line)) return slotHtml(ctx && ctx.slot ? ctx.slot(line) : line.slice(3), true);
    if ((m = line.match(/^when\s+(\w+)\.(\w+)\s*(?:\((.*)\))?$/))) {
      const ps = m[3] ? m[3].split(',').map((p) => p.trim()).filter(Boolean) : [];
      const row = `<span class="bk-kw">when</span>${fld(m[1], true)}<span>.${esc(m[2])}</span>` + ps.map((p) => `<span class="bk-param">${esc(p)}</span>`).join('');
      return `<div class="bk ev"><div class="bk-row">${row}</div><div class="bk-row" style="padding-top:0"><span class="bk-kw">do</span></div>${body(node.kids)}</div>`;
    }
    if ((m = line.match(/^to\s+(\w+)\s*(?:\((.*)\))?$/))) {
      const ps = m[2] ? m[2].split(',').map((p) => p.trim()).filter(Boolean) : [];
      return `<div class="bk proc"><div class="bk-row"><span class="bk-kw">to</span>${fld(m[1])}${ps.map((p) => `<span class="bk-param">${esc(p)}</span>`).join('')}<span class="bk-kw">do</span></div>${body(node.kids)}</div>`;
    }
    if ((m = line.match(/^initialize global\s+(\w+)\s+to\s+(.*)$/))) {
      return bk('var', `<span class="bk-kw">initialize global</span>${fld(m[1])}<span class="bk-kw">to</span>${aiTok(m[2]).map((t) => aiExpr(t, ctx)).join('')}`);
    }
    if ((m = line.match(/^set\s+(global\s+)?(\w+)\s+to\s+(.*)$/))) {
      return bk('var', `<span class="bk-kw">set</span>${fld((m[1] ? 'global ' : '') + m[2], true)}<span class="bk-kw">to</span>${aiTok(m[3]).map((t) => aiExpr(t, ctx)).join('')}`);
    }
    if ((m = line.match(/^set\s+(\w+)\.(\w+)\s+to\s+(.*)$/))) {
      return bk('set', `<span class="bk-kw">set</span>${fld(m[1], true)}<span>.</span>${fld(m[2], true)}<span class="bk-kw">to</span>${aiTok(m[3]).map((t) => aiExpr(t, ctx)).join('')}`);
    }
    if ((m = line.match(/^call\s+(\S+)\s*(.*)$/))) {
      const toks = aiTok(m[2]);
      const args = toks.map((t) => {
        if (t.t === 'word' && /^\w+=$/.test(t.v)) return `<span>${esc(t.v.slice(0, -1))}</span>`;
        if (t.t === 'word' && /^\w+=/.test(t.v)) { const [k, v] = t.v.split('='); return `<span>${esc(k)}</span>` + aiExpr({ t: 'word', v }, ctx); }
        return aiExpr(t, ctx);
      }).join('');
      return bk('call', `<span class="bk-kw">call</span>${fld(m[1], true)}${args}`);
    }
    if ((m = line.match(/^if\s+(.*)$/))) {
      let html = `<div class="bk ctl"><div class="bk-row"><span class="bk-kw">if</span>${aiTok(m[1]).map((t) => aiExpr(t, ctx)).join('')}</div><div class="bk-row" style="padding-top:0"><span class="bk-kw">then</span></div>${body(node.kids)}`;
      for (const a of node.alts || []) {
        const mm = a.line.match(/^else if\s+(.*)$/);
        if (mm) html += `<div class="bk-row"><span class="bk-kw">else if</span>${aiTok(mm[1]).map((t) => aiExpr(t, ctx)).join('')}</div><div class="bk-row" style="padding-top:0"><span class="bk-kw">then</span></div>${body(a.kids)}`;
        else html += `<div class="bk-row"><span class="bk-kw">else</span></div>${body(a.kids)}`;
      }
      return html + '</div>';
    }
    if ((m = line.match(/^for each\s+(\w+)\s+in list\s+(.*)$/))) {
      return `<div class="bk ctl"><div class="bk-row"><span class="bk-kw">for each</span>${fld(m[1])}<span class="bk-kw">in list</span>${aiTok(m[2]).map((t) => aiExpr(t, ctx)).join('')}</div><div class="bk-row" style="padding-top:0"><span class="bk-kw">do</span></div>${body(node.kids)}</div>`;
    }
    if ((m = line.match(/^(add items to list)\s+(.*)$/))) {
      return bk('list', `<span class="bk-kw">${m[1]}</span>${aiTok(m[2]).map((t) => (t.t === 'word' && /=$/.test(t.v) ? `<span>${esc(t.v.slice(0, -1))}</span>` : aiExpr(t, ctx))).join('')}`);
    }
    if (line.startsWith('[')) return aiTok(line).map((t) => aiExpr(t, ctx)).join('');
    return bk('ctl', `<span>${esc(line)}</span>`);
  }
  MC.aiBlocks = function (text, ctx) {
    return `<div class="bk-stack">${aiParse(text).map((n) => aiStmt(n, ctx)).join('')}</div>`;
  };
  MC.aiExprHTML = (s, ctx) => aiTok(s).map((t) => aiExpr(t, ctx)).join('');
  MC.aiStmtHTML = (s, ctx) => aiParse(s).map((n) => aiStmt(n, ctx)).join('');

  /* ================= Vectores 3D (orientación del celular) ================= */
  const V3 = (MC.V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]),
    unit(a) { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; },
    /* Matriz 3×3 (filas) por vector */
    mul: (R, v) => [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]],
    mm: (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])),
    T: (A) => [0, 1, 2].map((i) => [A[0][i], A[1][i], A[2][i]]),
    rx: (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]],
    ry: (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]],
    rz: (a) => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]]
  });

  /* ================= Dibujos ================= */
  /* Celular visto de frente. (cx, cy) centro en px, w×h en px, o = {ang, screen(ctx,x,y,w,h), axes, label, alpha} */
  D.phone = function (ctx, cx, cy, w, h, o = {}) {
    ctx.save();
    ctx.translate(cx, cy);
    if (o.ang) ctx.rotate(-o.ang);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    const r = Math.min(w, h) * 0.14;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r); else ctx.rect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = C('--phone');
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = MC.shade(C('--phone'), 0.6);
    ctx.stroke();
    const bz = Math.max(2.5, w * 0.06);
    const sx = -w / 2 + bz, sy = -h / 2 + bz * 1.6, sw = w - 2 * bz, sh = h - bz * 3.2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx, sy, sw, sh, r * 0.5); else ctx.rect(sx, sy, sw, sh);
    ctx.fillStyle = C('--screen');
    ctx.fill();
    /* cámara frontal */
    ctx.beginPath();
    ctx.arc(0, -h / 2 + bz * 0.8, Math.max(1, bz * 0.28), 0, 7);
    ctx.fillStyle = MC.shade(C('--phone'), 1.5);
    ctx.fill();
    if (o.screen) { ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); o.screen(ctx, sx, sy, sw, sh); ctx.restore(); }
    ctx.restore();
    if (o.axes) D.phoneAxes(ctx, cx, cy, Math.min(w, h) * 0.55, o.ang || 0, o.axesOpt || {});
  };
  /* Ejes del sensor (convención Android): x a la derecha, y hacia arriba de la pantalla, z saliendo */
  D.phoneAxes = function (ctx, cx, cy, len, ang, o = {}) {
    const ux = [Math.cos(ang), -Math.sin(ang)], uy = [-Math.sin(ang), -Math.cos(ang)];
    D.vec(ctx, cx, cy, ux[0] * len, ux[1] * len, { color: '--ax', label: 'x', width: 2, size: 12, vec: false });
    D.vec(ctx, cx, cy, uy[0] * len, uy[1] * len, { color: '--ay', label: 'y', width: 2, size: 12, vec: false });
    if (o.z !== false) {
      D.outIn(ctx, cx, cy, 6, 1, { color: '--az' });
      MC.text(ctx, 'z', cx + 9, cy + 14, { size: 12, math: true, color: '--az', halo: true });
    }
  };
  /* Celular visto de canto (rectángulo delgado) entre dos puntos */
  D.phoneEdge = function (ctx, x, y, len, th, ang, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-ang);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-len / 2, -th / 2, len, th, th * 0.4); else ctx.rect(-len / 2, -th / 2, len, th);
    ctx.fillStyle = C('--phone');
    ctx.fill();
    ctx.fillStyle = C('--screen');
    ctx.fillRect(-len / 2 + 2, -th / 2, len - 4, Math.max(1, th * 0.3));
    if (o.label) MC.text(ctx, o.label, 0, -th / 2 - 6, { size: 11, align: 'center', color: '--ink-2', halo: true });
    ctx.restore();
  };

  /* Placa ESP32 DevKit V1 (30 pines). Pines en orden de arriba (antena) a abajo (USB) */
  MC.ESP32_PINS = {
    L: ['EN', 'VP·36', 'VN·39', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'],
    R: ['D23', 'D22', 'TX0·1', 'RX0·3', 'D21', 'D19', 'D18', 'D5', 'TX2·17', 'RX2·16', 'D4', 'D2', 'D15', 'GND', '3V3']
  };
  /* Dibuja la placa con su esquina superior izquierda en (x, y) y ancho w (px). Devuelve {pin(nombre) → [px,py], w, h} */
  D.esp32 = function (ctx, x, y, w, o = {}) {
    const h = w * 2.0;
    const pitch = (h * 0.78) / 14;
    const y0 = y + h * 0.15;
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, w * 0.04); else ctx.rect(x, y, w, h);
    ctx.fillStyle = C('--pcb');
    ctx.fill();
    ctx.strokeStyle = MC.shade(C('--pcb'), 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();
    /* módulo WROOM con antena */
    const mx = x + w * 0.3, my = y + h * 0.02, mw = w * 0.4, mh = h * 0.45;
    ctx.fillStyle = C('--metal');
    ctx.fillRect(mx, my + mh * 0.22, mw, mh * 0.78);
    ctx.strokeStyle = MC.shade(C('--metal'), 0.7);
    ctx.strokeRect(mx + 0.5, my + mh * 0.22 + 0.5, mw - 1, mh * 0.78 - 1);
    ctx.fillStyle = C('--chip');
    ctx.fillRect(mx, my, mw, mh * 0.22);
    ctx.strokeStyle = C('--wire-y');
    ctx.lineWidth = Math.max(1, w * 0.012);
    ctx.beginPath();
    let ax = mx + mw * 0.1;
    ctx.moveTo(ax, my + mh * 0.18);
    for (let k = 0; k < 5; k++) { ctx.lineTo(ax, my + mh * 0.04); ax += mw * 0.08; ctx.lineTo(ax, my + mh * 0.04); ctx.lineTo(ax, my + mh * 0.18); ax += mw * 0.08; ctx.lineTo(ax, my + mh * 0.18); }
    ctx.stroke();
    ctx.save();
    ctx.translate(mx + mw / 2, my + mh * 0.6);
    ctx.rotate(-Math.PI / 2);
    MC.text(ctx, 'ESP32-WROOM-32', 0, 0, { size: Math.max(6.5, w * 0.06), align: 'center', baseline: 'middle', mono: true, color: '--ink-2', weight: 600 });
    ctx.restore();
    /* botones y USB */
    for (const [bx, by, lab] of [[x + w * 0.4, y + h * 0.74, 'EN'], [x + w * 0.6, y + h * 0.74, 'BOOT']]) {
      ctx.fillStyle = C('--metal'); ctx.fillRect(bx - w * 0.06, by - w * 0.05, w * 0.12, w * 0.1);
      ctx.fillStyle = C('--chip'); ctx.beginPath(); ctx.arc(bx, by, w * 0.03, 0, 7); ctx.fill();
      MC.text(ctx, lab, bx, by + w * 0.12, { size: Math.max(6, w * 0.05), align: 'center', mono: true, color: '--screen-ink' });
    }
    ctx.fillStyle = C('--metal');
    ctx.fillRect(x + w * 0.36, y + h - h * 0.06, w * 0.28, h * 0.07);
    /* LED azul integrado (GPIO2) */
    ctx.fillStyle = o.led ? '#5AB4FF' : MC.shade(C('--pcb'), 1.4);
    ctx.beginPath(); ctx.arc(x + w * 0.6, y + h * 0.56, w * 0.03, 0, 7); ctx.fill();
    if (o.led) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(x + w * 0.6, y + h * 0.56, w * 0.09, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    const pins = {};
    const pr = Math.max(2, w * 0.035);
    const fs = Math.max(6, Math.min(10, w * 0.055));
    for (const side of ['L', 'R']) {
      MC.ESP32_PINS[side].forEach((name, i) => {
        const px = side === 'L' ? x + w * 0.07 : x + w * 0.93;
        const py = y0 + i * pitch;
        const key = name.split('·')[0];
        pins[key] = pins[key] && key === 'GND' ? pins[key] : [px, py];
        if (key === 'GND') pins['GND' + side] = [px, py];
        const hl = o.hl && (o.hl.includes(key) || o.hl.includes(name));
        ctx.beginPath();
        ctx.arc(px, py, pr * (hl ? 1.5 : 1), 0, 7);
        ctx.fillStyle = hl ? C('--marker-solid') : '#C9A227';
        ctx.fill();
        if (o.labels !== false) MC.text(ctx, key, side === 'L' ? px + pr + 3 : px - pr - 3, py, { size: fs, mono: true, align: side === 'L' ? 'left' : 'right', baseline: 'middle', color: hl ? '--marker-solid' : '--screen-ink', weight: hl ? 700 : 400 });
      });
    }
    return { pin: (k) => pins[k], pins, w, h, pitch };
  };

  /* Imán de barra (N rojo, S azul) centrado en (x,y), largo len, grosor th, ángulo ang (rad, N hacia +ang) */
  D.magnet = function (ctx, x, y, len, th, ang = 0, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-ang);
    ctx.fillStyle = C('--magN');
    ctx.fillRect(0, -th / 2, len / 2, th);
    ctx.fillStyle = C('--magS');
    ctx.fillRect(-len / 2, -th / 2, len / 2, th);
    ctx.strokeStyle = MC.alpha('--ink', 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(-len / 2 + 0.5, -th / 2 + 0.5, len - 1, th - 1);
    if (o.labels !== false && len > 24) {
      const fs = Math.min(13, th * 0.7);
      ctx.rotate(ang);
      const c = Math.cos(ang), s = Math.sin(ang);
      MC.text(ctx, 'N', (len / 4) * c, -(len / 4) * s, { size: fs, align: 'center', baseline: 'middle', color: '#fff', weight: 700 });
      MC.text(ctx, 'S', -(len / 4) * c, (len / 4) * s, { size: fs, align: 'center', baseline: 'middle', color: '#fff', weight: 700 });
    }
    ctx.restore();
  };
  /* Bobina vista de lado: rectángulo con espiras (x,y) centro */
  D.coilSide = function (ctx, x, y, w, h, turns = 10, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--copper');
    ctx.lineWidth = Math.max(1.5, (h / turns) * 0.55);
    for (let i = 0; i < turns; i++) {
      const yy = y - h / 2 + (h * (i + 0.5)) / turns;
      ctx.beginPath();
      ctx.ellipse(x, yy, w / 2, Math.max(1.5, (h / turns) * 0.45), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };
  /* Resistencia esquemática (zigzag) entre dos puntos */
  D.resistor = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, Lr = Math.hypot(dx, dy);
    const ux = dx / Lr, uy = dy / Lr, px = -uy, py = ux;
    const body = Math.min(Lr * 0.6, 44), a = (Lr - body) / 2, amp = o.amp || 6;
    const pts = [[x1, y1], [x1 + ux * a, y1 + uy * a]];
    for (let i = 0; i < 6; i++) { const s = a + (body * (i + 0.5)) / 6; const sg = i % 2 ? -1 : 1; pts.push([x1 + ux * s + px * amp * sg, y1 + uy * s + py * amp * sg]); }
    pts.push([x1 + ux * (a + body), y1 + uy * (a + body)], [x2, y2]);
    D.poly(ctx, pts, { color: o.color || '--ink', width: o.width || 1.8 });
    if (o.label) MC.text(ctx, o.label, (x1 + x2) / 2 + px * (amp + 12), (y1 + y2) / 2 + py * (amp + 12), { size: 12, align: 'center', baseline: 'middle', color: '--ink-2', halo: true, mono: o.mono });
  };
  D.capacitor = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, Lc = Math.hypot(dx, dy);
    const ux = dx / Lc, uy = dy / Lc, px = -uy, py = ux;
    const g = 5, pl = o.plate || 11;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    D.line(ctx, x1, y1, mx - ux * g, my - uy * g, { color: o.color || '--ink', width: 1.8 });
    D.line(ctx, x2, y2, mx + ux * g, my + uy * g, { color: o.color || '--ink', width: 1.8 });
    D.line(ctx, mx - ux * g + px * pl, my - uy * g + py * pl, mx - ux * g - px * pl, my - uy * g - py * pl, { color: o.color || '--ink', width: 2.4 });
    D.line(ctx, mx + ux * g + px * pl, my + uy * g + py * pl, mx + ux * g - px * pl, my + uy * g - py * pl, { color: o.color || '--ink', width: 2.4 });
    if (o.label) MC.text(ctx, o.label, mx + px * (pl + 12), my + py * (pl + 12), { size: 12, align: 'center', baseline: 'middle', color: '--ink-2', halo: true, mono: o.mono });
  };
  D.groundSym = function (ctx, x, y, o = {}) {
    const col = o.color || '--ink';
    D.line(ctx, x - 10, y, x + 10, y, { color: col, width: 1.8 });
    D.line(ctx, x - 6, y + 4, x + 6, y + 4, { color: col, width: 1.6 });
    D.line(ctx, x - 2.5, y + 8, x + 2.5, y + 8, { color: col, width: 1.4 });
  };
  /* Diodo / LED esquemático de (x1,y1) a (x2,y2): ánodo → cátodo */
  D.diode = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, Ld = Math.hypot(dx, dy);
    const ux = dx / Ld, uy = dy / Ld, px = -uy, py = ux;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, s = 8;
    const col = o.color || '--ink';
    D.line(ctx, x1, y1, mx - ux * s, my - uy * s, { color: col, width: 1.8 });
    D.line(ctx, mx + ux * s, my + uy * s, x2, y2, { color: col, width: 1.8 });
    D.poly(ctx, [[mx - ux * s + px * s, my - uy * s + py * s], [mx + ux * s, my + uy * s], [mx - ux * s - px * s, my - uy * s - py * s]], { color: col, width: 1.6, close: true, fill: o.on ? '--marker-solid' : null, fillAlpha: 0.9 });
    D.line(ctx, mx + ux * s + px * s, my + uy * s + py * s, mx + ux * s - px * s, my + uy * s - py * s, { color: col, width: 2 });
    if (o.led) for (const k of [-1, 1]) D.arrow(ctx, mx + px * (s + 3) + ux * k * 4, my + py * (s + 3) + uy * k * 4, mx + px * (s + 13) + ux * (k * 4 + 5), my + py * (s + 13) + uy * (k * 4 + 5), { color: o.on ? '--accent' : col, width: 1.2, head: 5 });
    if (o.label) MC.text(ctx, o.label, mx - px * (s + 14), my - py * (s + 14), { size: 12, align: 'center', baseline: 'middle', color: '--ink-2', halo: true });
  };
  /* Fuente/batería esquemática (x1,y1)=negativo → (x2,y2)=positivo */
  D.battery = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, Lb = Math.hypot(dx, dy);
    const ux = dx / Lb, uy = dy / Lb, px = -uy, py = ux;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, g = 4;
    D.line(ctx, x1, y1, mx - ux * g, my - uy * g, { width: 1.8 });
    D.line(ctx, mx + ux * g, my + uy * g, x2, y2, { width: 1.8 });
    D.line(ctx, mx - ux * g + px * 6, my - uy * g + py * 6, mx - ux * g - px * 6, my - uy * g - py * 6, { width: 3 });
    D.line(ctx, mx + ux * g + px * 13, my + uy * g + py * 13, mx + ux * g - px * 13, my + uy * g - py * 13, { width: 1.8 });
    if (o.label) MC.text(ctx, o.label, mx + px * 24, my + py * 24, { size: 12, align: 'center', baseline: 'middle', color: '--ink-2', halo: true, mono: true });
  };
  /* Módulo sensor genérico (placa con rótulo y pines abajo) */
  D.module = function (ctx, x, y, w, h, label, o = {}) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3); else ctx.rect(x, y, w, h);
    ctx.fillStyle = C(o.fill || '--pcb-2');
    ctx.fill();
    ctx.strokeStyle = MC.shade(C(o.fill || '--pcb-2'), 0.6);
    ctx.stroke();
    ctx.restore();
    MC.text(ctx, label, x + w / 2, y + (o.pins ? h * 0.42 : h / 2), { size: o.size || 10.5, align: 'center', baseline: 'middle', color: '--screen-ink', mono: true, weight: 600 });
    const out = {};
    if (o.pins) {
      const n = o.pins.length;
      o.pins.forEach((p, i) => {
        const px = x + (w * (i + 0.5)) / n, py = y + h - 5;
        ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 7); ctx.fillStyle = '#C9A227'; ctx.fill();
        MC.text(ctx, p, px, py - 9, { size: 7.5, align: 'center', mono: true, color: '--screen-ink' });
        out[p] = [px, py];
      });
    }
    return out;
  };
  /* Cable curvo entre dos puntos */
  D.wire = function (ctx, a, b, color, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(color || '--wire-r');
    ctx.lineWidth = o.width || 2.6;
    ctx.lineCap = 'round';
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    if (o.route) { for (const p of o.route) ctx.lineTo(p[0], p[1]); ctx.lineTo(b[0], b[1]); }
    else {
      const sag = o.sag === undefined ? 0.25 : o.sag;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + Math.abs(b[0] - a[0]) * sag;
      ctx.quadraticCurveTo(mx, my, b[0], b[1]);
    }
    ctx.stroke();
    ctx.restore();
  };

  /* Ladrillo LEGO en vista lateral (2D) con esquina inferior izquierda en (x, y) px.
     studs: ancho en módulos; plates: alto en placas; u: px por módulo (8 mm) */
  D.brick2d = function (ctx, x, y, studs, plates, u, color, o = {}) {
    const w = studs * u, h = plates * u * 0.4;
    const col = C(color);
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.fillStyle = col;
    ctx.fillRect(x, y - h, w, h);
    ctx.strokeStyle = MC.shade(col, 0.62);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y - h + 0.5, w - 1, h - 1);
    if (o.studs !== false) {
      const sw = u * 0.6, sh = u * 0.21;
      for (let i = 0; i < studs; i++) {
        const sx = x + (i + 0.5) * u - sw / 2;
        ctx.fillStyle = MC.shade(col, 1.08);
        ctx.fillRect(sx, y - h - sh, sw, sh);
        ctx.strokeRect(sx + 0.5, y - h - sh + 0.5, sw - 1, sh);
      }
    }
    if (o.holes) {
      ctx.fillStyle = MC.shade(col, 0.45);
      for (let i = 1; i < studs; i++) { ctx.beginPath(); ctx.arc(x + i * u, y - h * 0.6, u * 0.24, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  };

  /* ================= Motor isométrico de piezas LEGO =================
     Pieza: {x, y, z, w, d, h, c, t, ...}
       x, y en módulos (8 mm); z y h en placas (3.2 mm); w a lo largo de x, d a lo largo de y
       t: 'brick' | 'plate' | 'tile' (sin pivotes) | 'tech' (agujeros a lo largo de x)
          'techy' (agujeros a lo largo de y) | 'box' (objeto liso) | 'cyl' (rueda, eje paralelo a y)
       c: nombre de color (--lego-red…) o color CSS; top: color de la cara superior (opcional)
       label: rótulo sobre la cara superior; name: nombre en la lista de piezas */
  const ISO_C = Math.cos(Math.PI / 6), ISO_S = Math.sin(Math.PI / 6);
  const LG = (MC.lego = {});
  LG.ZU = 0.4; /* placas → módulos */
  LG.COLORNAME = {
    '--lego-red': 'rojo', '--lego-yellow': 'amarillo', '--lego-blue': 'azul', '--lego-green': 'verde', '--lego-black': 'negro',
    '--lego-white': 'blanco', '--lego-gray': 'gris claro', '--lego-dkgray': 'gris oscuro', '--lego-tan': 'beige', '--lego-orange': 'naranja',
    '--lego-lime': 'lima', '--lego-azure': 'celeste', '--lego-trans': 'transparente'
  };
  LG.partName = function (p) {
    if (p.name) return p.name;
    const dims = `${Math.min(p.w, p.d)}×${Math.max(p.w, p.d)}`;
    const kind = p.t === 'plate' ? 'Placa' : p.t === 'tile' ? 'Loseta' : p.t === 'tech' || p.t === 'techy' ? 'Ladrillo Technic' : p.t === 'cyl' ? 'Rueda' : p.t === 'box' ? 'Objeto' : 'Ladrillo';
    const extra = (p.t === 'brick' || p.t === 'tech' || p.t === 'techy') && p.h !== 3 ? ` (alto ${p.h / 3})` : '';
    return `${kind} ${dims}${extra}`;
  };
  /* Piezas especiales:
     'tilt' (placa o viga inclinada): {ax, ay, az, len, d, h, ang, u:[ux,uy], v:[vx,vy]}
        ancla en placas/módulos; len y d en módulos; h en placas; ang en grados; u dirección del largo
     'line' (cuerda o hilo): {a:[x,y,z], b:[x,y,z], lw} con z en placas */
  function tiltVerts(p) {
    const th = M.rad(p.ang || 0), c = Math.cos(th), sn = Math.sin(th);
    const u = p.u || [1, 0], v = p.v || [0, 1], hU = (p._h0 !== undefined ? p._h0 : p.h) * LG.ZU, dd = p._d0 !== undefined ? p._d0 : p.d;
    const out = [];
    for (const s of [0, p.len]) for (const j of [0, dd]) for (const k of [0, hU]) {
      const a = s * c - k * sn;
      out.push([p.ax + u[0] * a + v[0] * j, p.ay + u[1] * a + v[1] * j, p.az * LG.ZU + s * sn + k * c]);
    }
    return out;
  }
  function prep(p) {
    if (p.t !== 'tilt' && p.t !== 'line') return p;
    if (p.t === 'tilt' && p._h0 === undefined) { p._h0 = p.h; p._d0 = p.d; }
    const vs = p.t === 'tilt' ? tiltVerts(p) : [[p.a[0], p.a[1], p.a[2] * LG.ZU], [p.b[0], p.b[1], p.b[2] * LG.ZU]];
    const mn = [0, 1, 2].map((i) => Math.min(...vs.map((q) => q[i]))), mx = [0, 1, 2].map((i) => Math.max(...vs.map((q) => q[i])));
    return Object.assign(p, { _v: vs, x: mn[0], y: mn[1], w: Math.max(1e-3, mx[0] - mn[0]), d: Math.max(1e-3, mx[1] - mn[1]), z: mn[2] / LG.ZU, h: Math.max(1e-3, (mx[2] - mn[2]) / LG.ZU) });
  }
  LG.prep = prep;
  /* rotación de la pieza k cuartos de vuelta alrededor de (cx, cy) */
  function rotP(p, k, cx, cy) {
    const rp = (q) => [cx - (q[1] - cy), cy + (q[0] - cx)];
    if (p.t === 'tilt') {
      let a = [p.ax, p.ay], u = p.u || [1, 0], v = p.v || [0, 1];
      for (let i = 0; i < k; i++) { a = rp(a); u = [-u[1], u[0]]; v = [-v[1], v[0]]; }
      return prep(Object.assign({}, p, { ax: a[0], ay: a[1], u, v }));
    }
    if (p.t === 'line') {
      let a = p.a.slice(0, 2), b = p.b.slice(0, 2);
      for (let i = 0; i < k; i++) { a = rp(a); b = rp(b); }
      return prep(Object.assign({}, p, { a: [a[0], a[1], p.a[2]], b: [b[0], b[1], p.b[2]] }));
    }
    let { x, y, w, d } = p;
    let t = p.t;
    for (let i = 0; i < k; i++) {
      const nx = cx - (y + d - cy), ny = cy + (x - cx);
      x = nx; y = ny; [w, d] = [d, w];
      if (t === 'tech') t = 'techy'; else if (t === 'techy') t = 'tech';
      else if (t === 'cyl') t = 'cylx'; else if (t === 'cylx') t = 'cyl';
    }
    return Object.assign({}, p, { x, y, w, d, t });
  }
  LG.project = (X, Y, Z, o) => [o.cx + (X - Y) * ISO_C * o.s, o.cy + (X + Y) * ISO_S * o.s - Z * o.s];
  LG.bounds = function (parts) {
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    const o = { cx: 0, cy: 0, s: 1 };
    for (const p0 of parts) {
      const p = prep(p0);
      const z0 = p.z * LG.ZU, z1 = (p.z + p.h) * LG.ZU + (p.t === 'brick' || p.t === 'plate' || p.t === 'tech' || p.t === 'techy' ? 0.22 : 0);
      for (const X of [p.x, p.x + p.w]) for (const Y of [p.y, p.y + p.d]) for (const Z of [z0, z1]) {
        const [px, py] = LG.project(X, Y, Z, o);
        a = Math.min(a, px); b = Math.max(b, px); c = Math.min(c, py); d = Math.max(d, py);
      }
    }
    return { x0: a, x1: b, y0: c, y1: d };
  };
  /* Orden de pintado: A delante de B si está separada por un eje con A del lado positivo */
  function sortParts(ps, o) {
    const n = ps.length;
    const box = ps.map((p) => {
      const z0 = p.z * LG.ZU, z1 = (p.z + p.h) * LG.ZU;
      let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
      for (const X of [p.x, p.x + p.w]) for (const Y of [p.y, p.y + p.d]) for (const Z of [z0, z1 + 0.25]) {
        const [px, py] = LG.project(X, Y, Z, o);
        a = Math.min(a, px); b = Math.max(b, px); c = Math.min(c, py); d = Math.max(d, py);
      }
      return { p, z0, z1, a, b, c, d };
    });
    const front = (A, B) => {
      const e = 1e-6;
      if (A.p.x >= B.p.x + B.p.w - e) return true;
      if (A.p.y >= B.p.y + B.p.d - e) return true;
      if (A.z0 >= B.z1 - e) return true;
      return false;
    };
    const behindCount = new Array(n).fill(0);
    const adj = Array.from({ length: n }, () => []);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const A = box[i], B = box[j];
      if (A.a >= B.b || B.a >= A.b || A.c >= B.d || B.c >= A.d) continue;
      if (front(A, B) && !front(B, A)) { adj[j].push(i); behindCount[i]++; }
    }
    const out = [];
    const q = [];
    for (let i = 0; i < n; i++) if (!behindCount[i]) q.push(i);
    q.sort((i, j) => (ps[i].x + ps[i].y + ps[i].z * LG.ZU) - (ps[j].x + ps[j].y + ps[j].z * LG.ZU));
    while (q.length) {
      const i = q.shift();
      out.push(ps[i]);
      for (const j of adj[i]) if (--behindCount[j] === 0) q.push(j);
    }
    if (out.length < n) {
      const rest = ps.filter((p) => !out.includes(p));
      rest.sort((a, b) => (a.x + a.w / 2 + a.y + a.d / 2 + (a.z + a.h / 2) * LG.ZU) - (b.x + b.w / 2 + b.y + b.d / 2 + (b.z + b.h / 2) * LG.ZU));
      out.push(...rest);
    }
    return out;
  }
  function polyFill(ctx, pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 0.8; ctx.stroke(); }
  }
  function drawPart(ctx, p, o, hl) {
    const P = (X, Y, Z) => LG.project(X, Y, Z, o);
    if (p.t === 'line') {
      const a = P(...p._v[0]), b = P(...p._v[1]);
      ctx.save();
      ctx.strokeStyle = C(p.c || '--rope');
      ctx.lineWidth = p.lw || Math.max(1.2, o.s * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.restore();
      return;
    }
    if (p.t === 'tilt') {
      const V = p._v.map((q) => P(q[0], q[1], q[2]));
      const th = M.rad(p.ang || 0), c = Math.cos(th), sn = Math.sin(th), u = p.u || [1, 0], v = p.v || [0, 1];
      const base = C(p.c || '--lego-gray');
      const idx = (s, j, k) => s * 4 + j * 2 + k;
      const faces = [
        [[idx(0, 0, 1), idx(1, 0, 1), idx(1, 1, 1), idx(0, 1, 1)], [-sn * u[0], -sn * u[1], c], 1.14],
        [[idx(0, 0, 0), idx(1, 0, 0), idx(1, 1, 0), idx(0, 1, 0)], [sn * u[0], sn * u[1], -c], 0.6],
        [[idx(0, 1, 0), idx(1, 1, 0), idx(1, 1, 1), idx(0, 1, 1)], [v[0], v[1], 0], 0.8],
        [[idx(0, 0, 0), idx(1, 0, 0), idx(1, 0, 1), idx(0, 0, 1)], [-v[0], -v[1], 0], 0.8],
        [[idx(1, 0, 0), idx(1, 1, 0), idx(1, 1, 1), idx(1, 0, 1)], [c * u[0], c * u[1], sn], 0.95],
        [[idx(0, 0, 0), idx(0, 1, 0), idx(0, 1, 1), idx(0, 0, 1)], [-c * u[0], -c * u[1], -sn], 0.95]
      ];
      ctx.save();
      for (const [ids, n, sh] of faces) {
        if (n[0] + n[1] + n[2] <= 1e-9) continue;
        polyFill(ctx, ids.map((i) => V[i]), MC.shade(base, sh), MC.shade(base, 0.5, 0.9));
        if (hl) polyFill(ctx, ids.map((i) => V[i]), null, C('--marker-solid'), 2.2);
      }
      if (p.label) { const m = V.reduce((s, q) => [s[0] + q[0] / 8, s[1] + q[1] / 8], [0, 0]); MC.text(ctx, p.label, m[0], m[1], { size: 11, align: 'center', baseline: 'middle', color: '--ink', halo: true, weight: 700 }); }
      ctx.restore();
      return;
    }
    const base = C(p.c || '--lego-gray');
    const trans = /rgba/.test(base) || p.c === '--lego-trans';
    const z0 = p.z * LG.ZU, z1 = (p.z + p.h) * LG.ZU;
    const x0 = p.x, x1 = p.x + p.w, y0 = p.y, y1 = p.y + p.d;
    const edge = trans ? MC.alpha('--ink', 0.35) : MC.shade(base, 0.5, 0.9);
    const top = p.top ? C(p.top) : MC.shade(base, 1.12);
    const right = base, left = MC.shade(base, 0.78);
    ctx.save();
    if (p.alpha !== undefined) ctx.globalAlpha = p.alpha;
    if (p.t === 'cyl' || p.t === 'cylx') {
      /* rueda: eje paralelo a y (cyl) o a x (cylx) */
      const R = Math.min(p.t === 'cyl' ? p.w : p.d, p.h * LG.ZU) / 2;
      const ccx = (x0 + x1) / 2, ccy = (y0 + y1) / 2, ccz = z0 + R;
      const circ = (fixed) => {
        const pts = [];
        for (let k = 0; k < 28; k++) {
          const a = (k / 28) * Math.PI * 2;
          pts.push(p.t === 'cyl' ? P(ccx + R * Math.cos(a), fixed, ccz + R * Math.sin(a)) : P(fixed, ccy + R * Math.cos(a), ccz + R * Math.sin(a)));
        }
        return pts;
      };
      const back = circ(p.t === 'cyl' ? y0 : x0), frontC = circ(p.t === 'cyl' ? y1 : x1);
      polyFill(ctx, back, MC.shade(base, 0.6), edge);
      /* banda lateral: envolvente aproximada uniendo puntos */
      for (let k = 0; k < 28; k++) {
        const k2 = (k + 1) % 28;
        polyFill(ctx, [back[k], back[k2], frontC[k2], frontC[k]], MC.shade(base, 0.7 + 0.25 * Math.sin((k / 28) * Math.PI * 2)), null);
      }
      polyFill(ctx, frontC, MC.shade(base, 0.95), edge);
      const hub = p.hub ? C(p.hub) : C('--lego-gray');
      const hubPts = [];
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2, r = R * 0.55;
        hubPts.push(p.t === 'cyl' ? P(ccx + r * Math.cos(a), y1 + 0.01, ccz + r * Math.sin(a)) : P(x1 + 0.01, ccy + r * Math.cos(a), ccz + r * Math.sin(a)));
      }
      polyFill(ctx, hubPts, hub, MC.shade(hub, 0.6));
      ctx.restore();
      return;
    }
    const Ftop = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
    const Fright = [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)];
    const Fleft = [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)];
    if (trans) {
      /* aristas traseras visibles a través de la pieza */
      polyFill(ctx, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], base, edge);
      polyFill(ctx, [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], base, edge);
    }
    polyFill(ctx, Fright, right, edge);
    polyFill(ctx, Fleft, left, edge);
    polyFill(ctx, Ftop, top, edge);
    /* agujeros Technic */
    if (p.t === 'tech' || p.t === 'techy') {
      const hz = z0 + (p.h * LG.ZU) * 0.6, r = 0.24;
      const holeCol = MC.shade(base, 0.35);
      if (p.t === 'tech') for (let i = 1; i < p.w; i++) {
        const pts = [];
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; pts.push(P(x0 + i + r * Math.cos(a), y1 + 0.001, hz + r * Math.sin(a))); }
        polyFill(ctx, pts, holeCol, null);
      }
      else for (let i = 1; i < p.d; i++) {
        const pts = [];
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; pts.push(P(x1 + 0.001, y0 + i + r * Math.cos(a), hz + r * Math.sin(a))); }
        polyFill(ctx, pts, holeCol, null);
      }
    }
    if (p.screen) {
      /* cara superior tipo pantalla (celular, placa) con margen */
      const m = Math.min(p.w, p.d) * 0.08;
      polyFill(ctx, [P(x0 + m, y0 + m, z1), P(x1 - m, y0 + m, z1), P(x1 - m, y1 - m, z1), P(x0 + m, y1 - m, z1)], C(p.screen), null);
    }
    if (hl) {
      for (const F of [Fright, Fleft, Ftop]) polyFill(ctx, F, null, C('--marker-solid'), 2.2);
    }
    /* pivotes */
    const studs = p.t === 'brick' || p.t === 'plate' || p.t === 'tech' || p.t === 'techy';
    if (studs && p.studs !== false && o.s > 7) {
      const r = 0.3, hz = 0.21;
      const a = r * o.s * Math.SQRT2 * ISO_C, b = r * o.s * Math.SQRT2 * ISO_S;
      for (let i = 0; i < p.w; i++) for (let j = 0; j < p.d; j++) {
        const [sx, sy] = P(x0 + i + 0.5, y0 + j + 0.5, z1);
        const sh = hz * o.s;
        ctx.beginPath();
        ctx.ellipse(sx, sy, a, b, 0, 0, Math.PI);
        ctx.lineTo(sx - a, sy - sh);
        ctx.ellipse(sx, sy - sh, a, b, 0, Math.PI, 0, true);
        ctx.closePath();
        ctx.fillStyle = left;
        ctx.fill();
        ctx.strokeStyle = edge;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(sx, sy - sh, a, b, 0, 0, Math.PI * 2);
        ctx.fillStyle = MC.shade(base, 1.2);
        ctx.fill();
        ctx.stroke();
      }
    }
    if (p.label) {
      const [lx, ly] = P((x0 + x1) / 2, (y0 + y1) / 2, z1);
      MC.text(ctx, p.label, lx, ly, { size: Math.max(8, Math.min(12, o.s * 0.5)), align: 'center', baseline: 'middle', color: p.labelColor || '--screen-ink', weight: 700, mono: true });
    }
    ctx.restore();
  }
  /* Dibuja una lista de piezas. o = {cx, cy, s, rot, hl:Set, dim} */
  LG.render = function (ctx, parts, o) {
    parts.forEach((p) => prep(p));
    const rot = ((o.rot || 0) % 4 + 4) % 4;
    let cx = 0, cy = 0;
    if (rot) {
      const bb = parts.reduce((acc, p) => [Math.min(acc[0], p.x), Math.max(acc[1], p.x + p.w), Math.min(acc[2], p.y), Math.max(acc[3], p.y + p.d)], [Infinity, -Infinity, Infinity, -Infinity]);
      cx = (bb[0] + bb[1]) / 2; cy = (bb[2] + bb[3]) / 2;
    }
    const ps = parts.map((p) => { const q = rot ? rotP(prep(p), rot, cx, cy) : prep(Object.assign({}, p)); q._src = p; return q; });
    const sorted = sortParts(ps, o);
    for (const p of sorted) drawPart(ctx, p, o, o.hl && o.hl.has(p._src));
    return ps;
  };
  /* Ajusta escala y centro para que las piezas quepan en un rectángulo (px) */
  LG.fit = function (parts, rect, rot = 0, pad = 16) {
    parts = parts.map((p) => prep(Object.assign({}, p)));
    const rp = rot ? (() => {
      const bb = parts.reduce((acc, p) => [Math.min(acc[0], p.x), Math.max(acc[1], p.x + p.w), Math.min(acc[2], p.y), Math.max(acc[3], p.y + p.d)], [Infinity, -Infinity, Infinity, -Infinity]);
      const cx = (bb[0] + bb[1]) / 2, cy = (bb[2] + bb[3]) / 2;
      return parts.map((p) => rotP(p, rot, cx, cy));
    })() : parts;
    const b = LG.bounds(rp);
    const s = Math.min((rect.w - 2 * pad) / Math.max(1e-6, b.x1 - b.x0), (rect.h - 2 * pad) / Math.max(1e-6, b.y1 - b.y0));
    return { s, cx: rect.x + rect.w / 2 - ((b.x0 + b.x1) / 2) * s, cy: rect.y + rect.h / 2 - ((b.y0 + b.y1) / 2) * s, rot };
  };
  /* Atajos para definir piezas */
  LG.B = (x, y, z, w, d, c, o = {}) => Object.assign({ x, y, z, w, d, h: 3, c, t: 'brick' }, o);
  LG.P = (x, y, z, w, d, c, o = {}) => Object.assign({ x, y, z, w, d, h: 1, c, t: 'plate' }, o);
  LG.T = (x, y, z, w, d, c, o = {}) => Object.assign({ x, y, z, w, d, h: 1, c, t: 'tile' }, o);
  LG.TX = (x, y, z, w, d, c, o = {}) => Object.assign({ x, y, z, w, d, h: 3, c, t: w >= d ? 'tech' : 'techy' }, o);
  LG.BOX = (x, y, z, w, d, h, c, o = {}) => Object.assign({ x, y, z, w, d, h, c, t: 'box' }, o);
  LG.models = {};
  /* Registro de modelos: {name, steps:[{note, parts:[...]}], rot, dims:[{a:[x,y,z], b:[x,y,z], label}]} */
  LG.def = (k, m) => { LG.models[k] = m; return m; };
  /* Registro de esquemas de conexión (ver simulación "conexion") */
  MC.wiring = { cfgs: {}, def(k, c) { this.cfgs[k] = c; return c; } };
  /* Lista de piezas agrupadas: [[nombre, color, cantidad]] */
  LG.bom = function (parts) {
    const m = new Map();
    for (const p of parts) {
      if ((p.t === 'box' && !p.name) || (p.t === 'line' && !p.name)) continue;
      const k = LG.partName(p) + '|' + (LG.COLORNAME[p.c] || '');
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).map(([k, n]) => { const [a, b] = k.split('|'); return [a, b, n]; });
  };
})();
