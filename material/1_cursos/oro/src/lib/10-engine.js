/* ===================================================================
   10-engine.js — Motor de la estrategia (sin DOM; se prueba en Node).
   Contrato (idéntico en py/motor.py):
   · Serie base: velas Bid UTC de bm minutos. Contexto: M15 (EMA20, ATR14 Wilder) y H4 (EMA50),
     construidos con los cierres de velas COMPLETAMENTE cerradas en el instante del cierre de la barra.
   · Señal al cierre de la barra i; entrada al open de la barra i+1 (compra al Ask = Bid + spread).
   · Gestión barra a barra con orden intrabarra O→L→H→C (alcista) u O→H→L→C (bajista),
     o pesimista (el extremo adverso primero).
   =================================================================== */
(function () {
  'use strict';
  const ML = (window.ML = window.ML || {});
  const L = (ML.L = ML.L || {});
  const E = (L.eng = {});
  const PIP = 0.1;
  E.PIP = PIP;

  /* ---------- Tiempo: Madrid = UTC+1 (invierno) / UTC+2 (verano) ---------- */
  const dstCache = {};
  function dstBounds(y) {
    let b = dstCache[y];
    if (b) return b;
    const lastSun = (m) => Date.UTC(y, m, 31 - new Date(Date.UTC(y, m, 31)).getUTCDay()) / 60000;
    b = [lastSun(2) + 60, lastSun(9) + 60];
    dstCache[y] = b;
    return b;
  }
  /* Desfase de Madrid (horas) para un instante UTC en minutos desde 1970 */
  E.madridOffset = function (tmin) {
    const y = new Date(tmin * 60000).getUTCFullYear();
    const b = dstBounds(y);
    return tmin >= b[0] && tmin < b[1] ? 2 : 1;
  };
  /* Día de la semana (lunes = 0) de un instante en minutos */
  E.weekday = (mm) => (Math.floor(mm / 1440) + 3) % 7;
  E.hhmm = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  E.dateStr = function (tmin) { return new Date(tmin * 60000).toISOString().slice(0, 10); };
  E.dateTimeStr = function (tmin) { return new Date(tmin * 60000).toISOString().slice(0, 16).replace('T', ' '); };

  /* ---------- Parámetros por defecto: manual v1.3, FTMO 100k ---------- */
  E.DEFAULTS = {
    /* horario (minutos del día en Madrid) */
    ws: 8 * 60 + 57, we: 13 * 60,
    /* entrada */
    w1m: 30, w2m: 120, modo: 'tocar', maxdist: 8, dema: 0, techo: 20, tol: 60, banda: 15,
    dir: 'ambas', contra: false, rechazo: true,
    /* salida */
    slk: 0.8, slmin: 45, slmax: 60, tpk: 1.4, tpmin: 80, tpmax: 100, compsp: true,
    sld: true, sldact: 20, sldpips: 20, be: true, beratio: 0.42, bemargin: 5,
    stag: true, stagmin: 30, stagprog: 15, stagflo: 5,
    tstop: 20 * 60, vier: 21 * 60, pess: false,
    /* costos y riesgo */
    risk: 125, comm: 0, slip: 0,
    balas: 2, onedone: true, meta: 180, maxloss: 250, coolm: 5
  };
  E.params = (over) => Object.assign({}, E.DEFAULTS, over || {});

  /* ---------- Decodificación de las series reales ---------- */
  function b64bytes(s) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(s, 'base64'));
    const bin = atob(s), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  async function inflateRaw(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  E.decodeRaw = async function (raw) {
    const n = raw.n;
    const buf = await inflateRaw(b64bytes(raw.b64));
    let off = 0;
    const take = (Ctor, size) => { const a = new Ctor(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + n * size)); off += n * size; return a; };
    const gap = take(Uint16Array, 2), dO = take(Int32Array, 4), body = take(Int32Array, 4), up = take(Int32Array, 4), dn = take(Int32Array, 4), spr = take(Uint16Array, 2);
    const t = new Float64Array(n), o = new Float64Array(n), h = new Float64Array(n), l = new Float64Array(n), c = new Float64Array(n), sp = new Float64Array(n);
    let tt = raw.t0, prev = raw.c0;
    for (let i = 0; i < n; i++) {
      tt += gap[i];
      const oc = prev + dO[i], cc = oc + body[i];
      t[i] = tt; o[i] = oc / 100; c[i] = cc / 100;
      h[i] = (Math.max(oc, cc) + up[i]) / 100; l[i] = (Math.min(oc, cc) - dn[i]) / 100; sp[i] = spr[i] / 100;
      prev = cc;
    }
    return { n, t, o, h, l, c, sp, bm: raw.minutes, name: raw.name || '', start: raw.start, end: raw.end };
  };
  const loaded = {};
  /* Devuelve (promesa de) la serie 'm1' | 'm5' | 'm15' | 'h1' */
  E.load = function (name) {
    if (!loaded[name]) loaded[name] = E.decodeRaw(Object.assign({ name }, ML.RAW[name]));
    return loaded[name];
  };
  E.loadAll = async function () { const r = {}; for (const k of Object.keys(ML.RAW)) r[k] = await E.load(k); return r; };
  /* Subserie [a, b) de una serie (copia ligera con subarray) */
  E.slice = function (S, a, b) {
    return { n: b - a, t: S.t.subarray(a, b), o: S.o.subarray(a, b), h: S.h.subarray(a, b), l: S.l.subarray(a, b), c: S.c.subarray(a, b), sp: S.sp.subarray(a, b), bm: S.bm, name: S.name, start: S.start, end: S.end, base: a };
  };

  /* ---------- Indicadores ---------- */
  E.emaSeq = function (x, p) {
    const out = new Float64Array(x.length).fill(NaN);
    if (x.length < p) return out;
    const a = 2 / (p + 1);
    let e = 0;
    for (let i = 0; i < p; i++) e += x[i];
    e /= p;
    out[p - 1] = e;
    for (let i = p; i < x.length; i++) { e = x[i] * a + e * (1 - a); out[i] = e; }
    return out;
  };
  E.atrWilder = function (h, l, c, p) {
    const n = c.length, out = new Float64Array(n).fill(NaN);
    if (n < p) return out;
    const tr = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const pc = i ? c[i - 1] : c[0];
      tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - pc), Math.abs(l[i] - pc));
    }
    let a = 0;
    for (let i = 0; i < p; i++) a += tr[i];
    a /= p;
    out[p - 1] = a;
    for (let i = p; i < n; i++) { a = (a * (p - 1) + tr[i]) / p; out[i] = a; }
    return out;
  };
  /* Máximo / mínimo de las W barras ANTERIORES a i (sin incluir i) */
  function rollPrior(arr, W, isMax) {
    const n = arr.length, out = new Float64Array(n).fill(NaN);
    const dq = new Int32Array(n);
    let head = 0, tail = 0;
    for (let i = 0; i < n; i++) {
      /* ventana de i = [i-W, i-1]: antes de procesar i, la cola ya contiene hasta i-1 */
      while (head < tail && dq[head] < i - W) head++;
      if (i >= W && head < tail) out[i] = arr[dq[head]];
      if (isMax) while (head < tail && arr[dq[tail - 1]] <= arr[i]) tail--;
      else while (head < tail && arr[dq[tail - 1]] >= arr[i]) tail--;
      dq[tail++] = i;
    }
    return out;
  }
  E.rollPrior = rollPrior;
  /* Remuestreo a velas de `size` minutos alineadas con múltiplos de `size` desde la época UTC */
  E.resample = function (S, size) {
    const st = [], o = [], h = [], l = [], c = [];
    let cur = -1, k = -1;
    for (let i = 0; i < S.n; i++) {
      const b = Math.floor(S.t[i] / size) * size;
      if (b !== cur) { cur = b; k++; st.push(b); o.push(S.o[i]); h.push(S.h[i]); l.push(S.l[i]); }
      else { if (S.h[i] > h[k]) h[k] = S.h[i]; if (S.l[i] < l[k]) l[k] = S.l[i]; }
      c[k] = S.c[i];
    }
    return { n: st.length, t: Float64Array.from(st), o: Float64Array.from(o), h: Float64Array.from(h), l: Float64Array.from(l), c: Float64Array.from(c), size };
  };

  /* Contexto de una serie base: todo lo que no depende de los parámetros de la estrategia.
     ctxS (opcional) es otra serie, más larga, de la que salen M15 y H4 (calentamiento de la EMA50 de H4). */
  E.prep = function (S, ctxS) {
    const key = ctxS ? ctxS.name || 'ctx' : '';
    S._prep = S._prep || {};
    if (S._prep[key]) return S._prep[key];
    const src = ctxS || S;
    const fast = E.resample(src, 15), slow = E.resample(src, 240);
    const ema20 = E.emaSeq(fast.c, 20), atr14 = E.atrWilder(fast.h, fast.l, fast.c, 14), ema50 = E.emaSeq(slow.c, 50);
    const n = S.n, im = new Int32Array(n), ih = new Int32Array(n);
    let a = -1, b = -1;
    for (let i = 0; i < n; i++) {
      const ct = S.t[i] + S.bm;
      while (a + 1 < fast.n && fast.t[a + 1] + 15 <= ct) a++;
      while (b + 1 < slow.n && slow.t[b + 1] + 240 <= ct) b++;
      im[i] = a; ih[i] = b;
    }
    /* Reloj de Madrid al CIERRE de cada barra */
    const mad = new Float64Array(n), mmd = new Int32Array(n), wd = new Int8Array(n), day = new Int32Array(n);
    let offCache = -1, offY = -1;
    for (let i = 0; i < n; i++) {
      const y = new Date(S.t[i] * 60000).getUTCFullYear();
      if (y !== offY) { offY = y; }
      const off = E.madridOffset(S.t[i]);
      const m = S.t[i] + S.bm + off * 60;
      mad[i] = m; mmd[i] = ((m % 1440) + 1440) % 1440; day[i] = Math.floor(m / 1440); wd[i] = E.weekday(m);
    }
    const P = { S, fast, slow, ema20, atr14, ema50, im, ih, mad, mm: mmd, wd, day, scans: new Map(), roll: {} };
    S._prep[key] = P;
    return P;
  };
  function rollOf(X, W) {
    const k = 'r' + W;
    if (!X.roll[k]) {
      const S = X.S;
      X.roll[k] = { hmax: rollPrior(S.h, W, true), lmin: rollPrior(S.l, W, false) };
    }
    return X.roll[k];
  }

  /* ---------- Escaneo de señales (no depende del estado diario) ---------- */
  const ENTRY_KEYS = ['ws', 'we', 'w1m', 'w2m', 'modo', 'maxdist', 'dema', 'techo', 'tol', 'banda', 'dir', 'contra', 'rechazo'];
  E.scan = function (X, P) {
    const key = ENTRY_KEYS.map((k) => P[k]).join('|');
    const hit = X.scans.get(key);
    if (hit) return hit;
    const S = X.S, bm = S.bm;
    const W1 = Math.max(1, Math.round(P.w1m / bm)), W2 = Math.max(1, Math.round(P.w2m / bm));
    const r1 = rollOf(X, W1), r2 = rollOf(X, W2);
    const ci = [], cs = [], ca = [];
    const band = P.banda * PIP, dema = P.dema * PIP, techo = P.techo * PIP, tol = P.tol * PIP, maxd = P.maxdist * PIP;
    const o = S.o, h = S.h, l = S.l, c = S.c;
    const start = Math.max(W1, W2) + 1;
    for (let i = start; i < S.n - 2; i++) {
      const mm = X.mm[i];
      if (!(P.ws <= mm && mm < P.we) || X.wd[i] >= 5) continue;
      const im = X.im[i], ih = X.ih[i];
      if (im < 20 || ih < 50) continue;
      const e50 = X.ema50[ih], atr = X.atr14[im], e20 = X.ema20[im];
      if (e50 !== e50 || atr !== atr || e20 !== e20) continue;
      const diff = X.slow.c[ih] - e50;
      const bias = diff < -band ? -1 : diff > band ? 1 : 0;
      if (bias === 0) continue;
      const H30 = r1.hmax[i], L30 = r1.lmin[i], H120 = r2.hmax[i], L120 = r2.lmin[i];
      let pro = false, con = false;
      if (bias === -1) {
        if (P.modo === 'tocar') pro = h[i] >= H30 && (!P.rechazo || c[i] <= o[i]) && Math.abs(H30 - c[i]) <= maxd && c[i] > e20 + dema && c[i] <= H120 + techo;
        else if (P.modo === 'zona') pro = c[i] >= e20 + dema && H120 - tol <= c[i] && c[i] <= H120 + techo && (!P.rechazo || c[i] <= o[i]);
        else if (P.modo === 'ruptura') pro = l[i] <= L30 && c[i] < L30 && L30 - c[i] <= maxd && (!P.rechazo || c[i] <= o[i]);
        else pro = h[i] >= e20 && c[i] < e20 && e20 - c[i] <= maxd && (!P.rechazo || c[i] <= o[i]);
        if (P.contra) con = (l[i] <= L30 || c[i] <= L30) && (!P.rechazo || c[i] >= o[i]) && c[i] < e20;
      } else {
        if (P.modo === 'tocar') pro = l[i] <= L30 && (!P.rechazo || c[i] >= o[i]) && Math.abs(c[i] - L30) <= maxd && c[i] < e20 - dema && c[i] >= L120 - techo;
        else if (P.modo === 'zona') pro = c[i] <= e20 - dema && L120 - techo <= c[i] && c[i] <= L120 + tol && (!P.rechazo || c[i] >= o[i]);
        else if (P.modo === 'ruptura') pro = h[i] >= H30 && c[i] > H30 && c[i] - H30 <= maxd && (!P.rechazo || c[i] >= o[i]);
        else pro = l[i] <= e20 && c[i] > e20 && c[i] - e20 <= maxd && (!P.rechazo || c[i] >= o[i]);
        if (P.contra) con = (h[i] >= H30 || c[i] >= H30) && (!P.rechazo || c[i] <= o[i]) && c[i] > e20;
      }
      let sig = 0;
      if (pro && con) sig = 0;
      else if (pro) sig = bias === -1 ? -1 : 1;
      else if (con) sig = bias === -1 ? 1 : -1;
      if (sig === 0) continue;
      if (P.dir === 'venta' && sig === 1) continue;
      if (P.dir === 'compra' && sig === -1) continue;
      ci.push(i); cs.push(sig); ca.push(atr / PIP);
    }
    const res = { ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca), bias: null };
    if (X.scans.size > 80) X.scans.clear();
    X.scans.set(key, res);
    return res;
  };

  /* ---------- Simulación de una operación ---------- */
  E.simTrade = function (S, X, i, d, atrPips, P, trace) {
    const n = S.n, bm = S.bm, j = i + 1;
    if (j >= n) return null;
    const o = S.o, h = S.h, l = S.l, c = S.c, sp = S.sp;
    const spr = sp[j];
    const slp = Math.min(P.slmax, Math.max(P.slmin, P.slk * atrPips));
    const tpp = Math.min(P.tpmax, Math.max(P.tpmin, P.tpk * atrPips));
    const D = slp * PIP + (P.compsp ? spr : 0);               /* distancia real del stop en USD */
    const lots = Math.floor((100 * P.risk) / (D * 100 + P.comm)) / 100;
    if (!(lots > 0)) return null;
    const ent = d === 1 ? o[j] + spr + P.slip * PIP : o[j] - P.slip * PIP;
    let sl = ent - d * D;
    const tp = ent + d * tpp * PIP;
    if (trace) trace.push({ k: j, stage: 0, sl, tp, ent, slp, tpp, D });
    let mfe = 0, mae = 0, stage = 0;
    const coolBars = Math.ceil(P.coolm / bm);
    for (let k = j; k < n; k++) {
      const add = d === -1 ? sp[k] : 0;
      const ok = o[k] + add, hk = h[k] + add, lk = l[k] + add, ck = c[k] + add;
      const F = d === 1 ? hk : lk, A = d === 1 ? lk : hk;
      const bull = ck >= ok;
      const advFirst = P.pess ? true : (d === 1 ? bull : !bull);
      for (let ph = 0; ph < 2; ph++) {
        const adverse = advFirst ? ph === 0 : ph === 1;
        if (adverse) {
          const aa = (A - ent) * d / PIP;
          if (aa < mae) mae = aa;
          if (d === 1 ? A <= sl : A >= sl) {
            const gap = (ok - sl) * d <= 0;
            return fin(i, j, k, d, ent, gap ? ok : sl, lots, stage === 0 ? 'SL' : stage === 1 ? 'SLD' : 'BE', P, mfe, mae, coolBars);
          }
        } else {
          if (d === 1 ? F >= tp : F <= tp) return fin(i, j, k, d, ent, tp, lots, 'TP', P, Math.max(mfe, (tp - ent) * d / PIP), mae, coolBars);
          const m = (F - ent) * d / PIP;
          if (m > mfe) {
            mfe = m;
            if (P.be && mfe >= P.beratio * tpp && stage < 2) { sl = ent + d * P.bemargin * PIP; stage = 2; if (trace) trace.push({ k, stage: 2, sl }); }
            else if (P.sld && mfe >= P.sldact && stage < 1) { sl = ent - d * P.sldpips * PIP; stage = 1; if (trace) trace.push({ k, stage: 1, sl }); }
          }
        }
      }
      const flo = (ck - ent) * d / PIP;
      if (P.stag && (k - j + 1) * bm >= P.stagmin && mfe < P.stagprog && flo <= -P.stagflo) return fin(i, j, k, d, ent, ck, lots, 'STAG', P, mfe, mae, coolBars);
      const mm = X.mm[k];
      if (mm >= P.tstop || (X.wd[k] === 4 && mm >= P.vier)) return fin(i, j, k, d, ent, ck, lots, 'TIME', P, mfe, mae, coolBars);
      if (k >= n - 1) return fin(i, j, k, d, ent, ck, lots, 'END', P, mfe, mae, coolBars);
    }
    return null;
  };
  function fin(i, j, k, d, ent, px, lots, reason, P, mfe, mae, coolBars) {
    const usd = (px - ent) * d * lots * 100 - P.comm * lots;
    return { i, j, k, d, ent, px, lots, reason, usd, R: usd / P.risk, mfe, mae, cb: coolBars };
  }

  /* ---------- Bucle de operaciones con reglas diarias ---------- */
  /* Universo del modelo nulo: todas las barras de la ventana con sesgo H4 definido, en la dirección del sesgo */
  E.scanBias = function (X, P) {
    const S = X.S, bm = S.bm, band = P.banda * PIP;
    const W = Math.max(1, Math.round(P.w1m / bm), Math.round(P.w2m / bm));
    const ci = [], cs = [], ca = [];
    for (let i = W + 1; i < S.n - 2; i++) {
      const mm = X.mm[i];
      if (!(P.ws <= mm && mm < P.we) || X.wd[i] >= 5) continue;
      const im = X.im[i], ih = X.ih[i];
      if (im < 20 || ih < 50) continue;
      const e50 = X.ema50[ih], atr = X.atr14[im];
      if (e50 !== e50 || atr !== atr) continue;
      const diff = X.slow.c[ih] - e50;
      const bias = diff < -band ? -1 : diff > band ? 1 : 0;
      if (bias === 0) continue;
      if (P.dir === 'venta' && bias === 1) continue;
      if (P.dir === 'compra' && bias === -1) continue;
      ci.push(i); cs.push(bias); ca.push(atr / PIP);
    }
    return { ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca) };
  };
  E.run = function (S, X, P, cand) {
    const sc = cand || E.scan(X, P);
    const trades = [];
    let day = null, cnt = 0, dpnl = 0, locked = false, coolUntil = -1, busyUntil = -1;
    for (let q = 0; q < sc.ci.length; q++) {
      const i = sc.ci[q];
      if (i <= busyUntil) continue;
      const dy = X.day[i];
      if (dy !== day) { day = dy; cnt = 0; dpnl = 0; locked = false; }
      if (locked || cnt >= P.balas || i <= coolUntil) continue;
      const tr = E.simTrade(S, X, i, sc.cs[q], sc.ca[q], P);
      if (!tr) continue;
      tr.day = dy;
      trades.push(tr);
      cnt++; dpnl += tr.usd;
      if (tr.usd > 0 && tr.reason === 'TP' && P.onedone) locked = true;
      if (dpnl >= P.meta || dpnl <= -P.maxloss) locked = true;
      coolUntil = tr.k + tr.cb;
      busyUntil = tr.k;
      /* el estado diario del día de salida: si la operación cruza medianoche no ocurre (cierre 20:00) */
    }
    return trades;
  };

  /* ---------- Estadísticos de una lista de operaciones ---------- */
  E.stats = function (tr, P) {
    const n = tr.length;
    const out = { n, wins: 0, winPct: NaN, avgR: NaN, sdR: NaN, seR: NaN, t: NaN, sumR: 0, usd: 0, pf: NaN, avgWin: NaN, avgLoss: NaN, ddUsd: 0, ddR: 0, reasons: {}, avgMfe: NaN };
    if (!n) return out;
    let gw = 0, gl = 0, nw = 0, nl = 0, eq = 0, peak = 0, eqR = 0, peakR = 0, mf = 0;
    for (const t of tr) {
      out.sumR += t.R; out.usd += t.usd;
      if (t.usd > 0) { out.wins++; gw += t.usd; nw++; } else { gl += -t.usd; nl++; }
      eq += t.usd; if (eq > peak) peak = eq; if (peak - eq > out.ddUsd) out.ddUsd = peak - eq;
      eqR += t.R; if (eqR > peakR) peakR = eqR; if (peakR - eqR > out.ddR) out.ddR = peakR - eqR;
      out.reasons[t.reason] = (out.reasons[t.reason] || 0) + 1;
      mf += t.mfe;
    }
    out.winPct = out.wins / n; out.avgR = out.sumR / n;
    let v = 0;
    for (const t of tr) v += (t.R - out.avgR) * (t.R - out.avgR);
    out.sdR = n > 1 ? Math.sqrt(v / (n - 1)) : NaN;
    out.seR = out.sdR / Math.sqrt(n); out.t = out.avgR / out.seR;
    out.pf = gl > 0 ? gw / gl : (gw > 0 ? Infinity : NaN);
    out.avgWin = nw ? gw / nw / (P ? P.risk : 1) : NaN; out.avgLoss = nl ? -gl / nl / (P ? P.risk : 1) : NaN;
    out.avgMfe = mf / n;
    return out;
  };
  /* PnL diario (USD) a partir de la lista de operaciones */
  E.daily = function (tr) {
    const m = new Map();
    for (const t of tr) m.set(t.day, (m.get(t.day) || 0) + t.usd);
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  };
})();
