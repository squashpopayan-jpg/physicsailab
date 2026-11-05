/* ===================================================================
   36-panels.js — Paneles de análisis del Taller: osciloscopio (Y–T, X–Y, FFT), Bode,
   curvas por barrido DC (familias) y tabla de operación. Cada fábrica recibe el Taller T.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, el = EM.el;
  const P = (EM.Panels = {});

  /* ---------- utilidades ---------- */
  const NICE = [1, 2, 5];
  P.niceUp = (x) => { if (!(x > 0)) return 1; const e = Math.floor(Math.log10(x)); for (let k = 0; k < 3; k++) for (const m of NICE) { const v = m * Math.pow(10, e + k); if (v >= x * (1 - 1e-9)) return v; } return 10 * Math.pow(10, e); };
  P.TDIVS = [1e-8, 2e-8, 5e-8, 1e-7, 2e-7, 5e-7, 1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5];
  P.VDIVS = [1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  const fmtT = (t) => EM.si(t, 's', 3), fmtV = (v) => EM.si(v, 'V', 3);

  /* Anillo de muestras */
  P.Ring = class {
    constructor(M) { this.M = M; this.buf = new Float32Array(M); this.n = 0; }
    push(v) { this.buf[this.n % this.M] = v; this.n++; }
    clear() { this.n = 0; this.buf.fill(0); }
    count() { return Math.min(this.n, this.M); }
    /* k últimas muestras en orden cronológico */
    last(k) { const c = this.count(); k = Math.min(k, c); const out = new Float32Array(k); for (let i = 0; i < k; i++) out[i] = this.buf[(this.n - k + i) % this.M]; return out; }
  };

  const mkSelect = (opts, val, onch, cls) => {
    const s = document.createElement('select'); s.className = cls || 'tl-sel';
    for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.append(o); }
    s.value = val; s.addEventListener('change', () => onch(s.value)); return s;
  };
  const mkLabel = (t, ctl) => { const l = el('label', 'tl-lab'); l.append(el('span', null, t), ctl); return l; };
  const mkBtn = (t, fn, cls) => { const b = el('button', 'btn ' + (cls || ''), t); b.type = 'button'; b.addEventListener('click', fn); return b; };

  P.stats = function (a, dt, full) {
      const n = a.length; if (!n) return null;
      let mn = Infinity, mx = -Infinity, s = 0, s2 = 0;
      for (let i = 0; i < n; i++) { const v = a[i]; if (v < mn) mn = v; if (v > mx) mx = v; s += v; s2 += v * v; }
      const mean = s / n, rms = Math.sqrt(s2 / n);
      let ac2 = 0; for (let i = 0; i < n; i++) ac2 += (a[i] - mean) * (a[i] - mean);
      /* frecuencia: cruces ascendentes por el valor medio */
      const lev = (mn + mx) / 2, cr = [];
      const fa = full || a, nf = fa.length;
      if (mx - mn > 1e-6 * Math.max(1, Math.abs(mx))) for (let i = 1; i < nf; i++) if (fa[i - 1] < lev && fa[i] >= lev) cr.push(i - (fa[i] - lev) / (fa[i] - fa[i - 1]));
      let f = NaN, duty = NaN;
      if (cr.length >= 2) { const per = (cr[cr.length - 1] - cr[0]) / (cr.length - 1); f = 1 / (per * dt);
        let hiN = 0; const i0 = Math.ceil(cr[0]), i1 = Math.floor(cr[cr.length - 1]); for (let i = i0; i < i1; i++) if (fa[i] >= lev) hiN++; duty = hiN / Math.max(1, i1 - i0); }
      return { mn, mx, mean, rms, rmsAC: Math.sqrt(ac2 / n), pp: mx - mn, f, duty };
    };

  /* ===================================================================
     Osciloscopio
     =================================================================== */
  P.scope = function (T, host) {
    const root = el('div', 'tl-panel');
    const st = (T.scope = Object.assign({ tdiv: 1e-3, mode: 'yt', hold: false, vdiv: {}, ac: {}, fftdb: false, cur: null }, T.scope));
    const bar = el('div', 'tl-pbar');
    const tsel = mkSelect(P.TDIVS.map((t) => [t, fmtT(t) + '/div']), st.tdiv, (v) => { T.setTdiv(+v); });
    st.tsel = tsel;
    bar.append(mkLabel('Base de tiempo', tsel));
    const msel = mkSelect([['yt', 'Y–T'], ['xy', 'X–Y'], ['fft', 'Espectro']], st.mode, (v) => { st.mode = v; T.redraw(); });
    bar.append(mkLabel('Modo', msel));
    const vbox = el('span', 'tl-vbox');
    bar.append(vbox);
    const hold = mkBtn('Congelar', () => { st.hold = !st.hold; hold.classList.toggle('on', st.hold); T.redraw(); });
    bar.append(hold);
    root.append(bar);
    const cvo = T.sim.canvas({ parent: root, aspect: 2.1, cls: 'fixed', label: 'Osciloscopio', optional: true });
    const meas = el('div', 'tl-meas');
    root.append(meas);

    let lastMeasT = 0;
    const chans = () => T.channels;
    function buildV() {
      vbox.innerHTML = '';
      for (const ch of chans()) {
        const s = mkSelect([['auto', 'auto'], ...P.VDIVS.map((v) => [v, EM.si(v, 'V', 2) + '/div'])], st.vdiv[ch.id] === undefined ? 'auto' : st.vdiv[ch.id], (v) => { st.vdiv[ch.id] = v === 'auto' ? 'auto' : +v; T.redraw(); });
        const c = el('label', 'tl-lab');
        const dot = el('span', 'tl-dot'); dot.style.background = ch.color;
        const acb = document.createElement('input'); acb.type = 'checkbox'; acb.checked = !!st.ac[ch.id]; acb.title = 'Acoplamiento CA';
        acb.addEventListener('change', () => { st.ac[ch.id] = acb.checked; T.redraw(); });
        c.append(dot, el('span', null, ch.label), s, el('span', 'tl-sm', 'CA'), acb);
        vbox.append(c);
      }
    }
    P._buildV = buildV;

    /* Selección de la ventana disparada */
    function window_(N) {
      const chs = chans();
      if (!chs.length) return null;
      const src = chs.find((c) => c.id === st.trigSrc) || chs[0];
      const r = T.rings[src.id];
      if (!r) return null;
      const avail = r.count();
      const need = Math.min(N, avail);
      const all = r.last(Math.min(avail, N * 3));
      if (st.hold && st.frozen) return st.frozen;
      let start = all.length - need;
      if (!st.noTrig && all.length >= N * 1.2) {
        let mn = Infinity, mx = -Infinity;
        for (let i = all.length - N; i < all.length; i++) { mn = Math.min(mn, all[i]); mx = Math.max(mx, all[i]); }
        if (mx - mn > 1e-9) {
          const lev = (mx + mn) / 2;
          const hi = all.length - Math.floor(N * 0.9), lo = Math.floor(N * 0.1);
          for (let i = hi; i >= lo; i--) { if (all[i - 1] < lev && all[i] >= lev) { start = i - Math.floor(N * 0.1); break; } }
        }
      }
      const out = { start, offs: all.length - Math.min(avail, N * 3), data: {} };
      const total = Math.min(avail, N * 3);
      for (const c of chs) { const rr = T.rings[c.id]; const a = rr.last(total); out.data[c.id] = a.subarray(Math.max(0, start), Math.max(0, start) + Math.min(N, a.length - Math.max(0, start))); }
      if (st.hold) st.frozen = out;
      return out;
    }

    const stats = (a, id) => { const r = id && T.rings[id]; const full = r ? r.last(Math.min(r.count(), T.N * 3)) : null; return P.stats(a, T.dt, full); };


    function draw() {
      const c = cvo.ctx, w = cvo.w, h = cvo.h;
      if (!w || !h) return;
      const chs = chans();
      c.save();
      c.fillStyle = '#0a130c'; c.fillRect(0, 0, w, h);
      const m = { l: 8, r: 8, t: 8, b: 22 };
      const gx = m.l, gy = m.t, gw = w - m.l - m.r, gh = h - m.t - m.b;
      const Nd = 10, Vd = 8;
      c.strokeStyle = 'rgba(90,200,100,.22)'; c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i <= Nd; i++) { const x = Math.round(gx + gw * i / Nd) + 0.5; c.moveTo(x, gy); c.lineTo(x, gy + gh); }
      for (let j = 0; j <= Vd; j++) { const y = Math.round(gy + gh * j / Vd) + 0.5; c.moveTo(gx, y); c.lineTo(gx + gw, y); }
      c.stroke();
      c.strokeStyle = 'rgba(120,230,130,.35)'; c.beginPath(); c.moveTo(gx, gy + gh / 2 + 0.5); c.lineTo(gx + gw, gy + gh / 2 + 0.5); c.moveTo(gx + gw / 2 + 0.5, gy); c.lineTo(gx + gw / 2 + 0.5, gy + gh); c.stroke();
      c.strokeStyle = 'rgba(120,230,130,.18)';
      for (let i = 0; i < Nd * 5; i++) { const x = gx + gw * i / (Nd * 5); c.beginPath(); c.moveTo(x, gy + gh / 2 - 3); c.lineTo(x, gy + gh / 2 + 3); c.stroke(); }
      if (!chs.length) { c.fillStyle = '#9fd9a4'; c.font = `13px ${EM.FONT_UI}`; c.textAlign = 'center'; c.fillText('Conecte un osciloscopio (o defina canales) para ver señales', w / 2, h / 2); c.restore(); return; }
      const N = T.N;
      const win = window_(N);
      if (!win) { c.restore(); return; }
      const vdivOf = {}, zero = {};
      for (const ch of chs) {
        let a = win.data[ch.id]; if (!a || !a.length) continue;
        let mean = 0; if (st.ac[ch.id]) { for (let i = 0; i < a.length; i++) mean += a[i]; mean /= a.length; }
        zero[ch.id] = mean;
        let vd = st.vdiv[ch.id];
        if (vd === undefined || vd === 'auto') { let pk = 0; for (let i = 0; i < a.length; i++) pk = Math.max(pk, Math.abs(a[i] - mean)); vd = P.niceUp(Math.max(pk, 1e-6) / 3.6); }
        vdivOf[ch.id] = vd;
      }
      if (st.mode === 'yt') {
        c.save(); c.beginPath(); c.rect(gx, gy, gw, gh); c.clip();
        for (const ch of chs) {
          const a = win.data[ch.id]; if (!a || !a.length) continue;
          const vd = vdivOf[ch.id], z = zero[ch.id];
          c.strokeStyle = ch.color; c.lineWidth = 1.7; c.shadowColor = ch.color; c.shadowBlur = 5;
          c.beginPath();
          const step = Math.max(1, Math.floor(a.length / (gw * 1.5)));
          for (let i = 0; i < a.length; i += step) {
            const x = gx + gw * (i / (N - 1));
            const y = gy + gh / 2 - ((a[i] - z) / vd) * (gh / Vd);
            i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke(); c.shadowBlur = 0;
        }
        c.restore();
        /* marcas de tierra */
        for (const ch of chs) {
          const vd = vdivOf[ch.id]; if (!vd) continue;
          const y = gy + gh / 2 - ((0 - zero[ch.id]) / vd) * (gh / Vd);
          if (y > gy && y < gy + gh) { c.fillStyle = ch.color; c.beginPath(); c.moveTo(gx, y - 4); c.lineTo(gx + 7, y); c.lineTo(gx, y + 4); c.fill(); }
        }
      } else if (st.mode === 'xy' && chs.length >= 2) {
        const A = chs[0], B = chs[1], a = win.data[A.id], b = win.data[B.id];
        if (a && b) {
          const n = Math.min(a.length, b.length);
          const va = vdivOf[A.id], vb = vdivOf[B.id];
          c.strokeStyle = '#7dff82'; c.lineWidth = 1.6; c.shadowColor = '#7dff82'; c.shadowBlur = 5; c.beginPath();
          for (let i = 0; i < n; i++) {
            const x = gx + gw / 2 + ((a[i] - zero[A.id]) / va) * (gw / Nd), y = gy + gh / 2 - ((b[i] - zero[B.id]) / vb) * (gh / Vd);
            i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke(); c.shadowBlur = 0;
        }
      } else if (st.mode === 'fft') {
        const ch = chs[0]; const r = T.rings[ch.id];
        const Nf = 2048;
        if (r && r.count() >= 512) {
          let nf = 512; while (nf * 2 <= Math.min(r.count(), Nf)) nf *= 2;
          const x = r.last(nf), wv = new Float64Array(nf);
          let sw = 0; for (let i = 0; i < nf; i++) { const hw = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (nf - 1)); wv[i] = x[i] * hw; sw += hw; }
          const amp = S.fft(wv); const fs = 1 / T.dt;
          const sc = nf / sw;
          let kmax = amp.length - 1;
          const A = Array.from(amp, (v) => v * sc);
          let pk = 0, kp = 1; for (let k = 1; k < A.length; k++) if (A[k] > pk) { pk = A[k]; kp = k; }
          const fmax = Math.min(fs / 2, kp > 0 ? Math.max(fs / nf * kp * 12, fs / nf * 40) : fs / 2);
          const kshow = Math.min(kmax, Math.ceil(fmax / (fs / nf)));
          const pl = new EM.Plot(c, { x: 0, y: 0, w, h: h - 0, xmin: 0, xmax: kshow * fs / nf, ymin: st.fftdb ? -100 : 0, ymax: st.fftdb ? 20 * Math.log10(Math.max(pk * 1.3, 1e-9)) : Math.max(pk * 1.2, 1e-9), ml: 54, mr: 12, mt: 10, mb: 30, xlabel: 'frecuencia (Hz)', ylabel: st.fftdb ? 'dB re 1 V' : 'amplitud (V)', bg: '#0a130c', xfmt: (v) => EM.si(v, '', 2) });
          c.fillStyle = '#0a130c'; c.fillRect(0, 0, w, h);
          pl.frame();
          pl.clip(() => {
            c.strokeStyle = ch.color; c.lineWidth = 1.5; c.beginPath();
            for (let k = 0; k <= kshow; k++) { const X = pl.X(k * fs / nf), Y = pl.Y(st.fftdb ? Math.max(-100, 20 * Math.log10(Math.max(A[k], 1e-12))) : A[k]); k ? c.lineTo(X, Y) : c.moveTo(X, Y); }
            c.stroke();
          });
          /* THD con los armónicos 2..10 */
          let h2 = 0; for (let m = 2; m <= 10; m++) { const kk = kp * m; if (kk >= A.length) break; let v = 0; for (let d = -2; d <= 2; d++) if (A[kk + d] !== undefined) v = Math.max(v, A[kk + d]); h2 += v * v; }
          st.fftInfo = { f1: kp * fs / nf, a1: pk, thd: Math.sqrt(h2) / Math.max(pk, 1e-12) };
          c.fillStyle = '#9fd9a4'; c.font = `12px ${EM.FONT_MONO}`; c.textAlign = 'right'; c.fillText(`f₁ ≈ ${EM.si(st.fftInfo.f1, 'Hz', 3)} · ${EM.si(pk, 'V', 3)} · THD ≈ ${(st.fftInfo.thd * 100).toFixed(1)} %`, w - 14, 18);
        } else { c.fillStyle = '#9fd9a4'; c.font = `13px ${EM.FONT_UI}`; c.textAlign = 'center'; c.fillText('Acumulando muestras…', w / 2, h / 2); }
      }
      /* rótulos */
      c.font = `600 11.5px ${EM.FONT_MONO}`; c.textBaseline = 'alphabetic';
      if (st.mode !== 'fft') {
        let x = gx + 4;
        for (const ch of chs) { const vd = vdivOf[ch.id]; if (!vd) continue; c.fillStyle = ch.color; c.textAlign = 'left'; const s = `${ch.label} ${EM.si(vd, 'V', 2)}/div${st.ac[ch.id] ? ' CA' : ''}`; c.fillText(s, x, h - 6); x += c.measureText(s).width + 14; }
        c.fillStyle = '#9fd9a4'; c.textAlign = 'right'; c.fillText(`${fmtT(T.tdiv)}/div${st.hold ? ' · CONGELADO' : ''}`, w - 10, h - 6);
      }
      /* cursor */
      if (st.cur && st.mode === 'yt') {
        const cx = Math.max(gx, Math.min(gx + gw, st.cur.x)), cy = Math.max(gy, Math.min(gy + gh, st.cur.y));
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(cx, gy); c.lineTo(cx, gy + gh); c.moveTo(gx, cy); c.lineTo(gx + gw, cy); c.stroke(); c.setLineDash([]);
        const t = ((cx - gx) / gw) * 10 * T.tdiv, ch0 = chs[0], vd = ch0 && vdivOf[ch0.id];
        const v = vd ? (gy + gh / 2 - cy) / (gh / Vd) * vd + (zero[ch0.id] || 0) : 0;
        c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(`t = ${fmtT(t)}  V = ${fmtV(v)}`, gx + 6, gy + 14);
      }
      c.restore();
      /* mediciones (≈ 4 por segundo) */
      const now = performance.now();
      if (now - lastMeasT > 250 && win && st.mode !== 'fft') {
        lastMeasT = now;
        let html = '<table class="tl-mt"><tr><th></th><th>Vpp</th><th>V máx</th><th>V mín</th><th>V med</th><th>V rms</th><th>f</th><th>T</th><th>Ciclo</th></tr>';
        for (const ch of chs) {
          const s = stats(win.data[ch.id], ch.id); if (!s) continue;
          html += `<tr><td><span class="tl-dot" style="background:${ch.color}"></span>${ch.label}</td><td>${EM.si(s.pp, 'V', 3)}</td><td>${EM.si(s.mx, 'V', 3)}</td><td>${EM.si(s.mn, 'V', 3)}</td><td>${EM.si(s.mean, 'V', 3)}</td><td>${EM.si(s.rms, 'V', 3)}</td><td>${isFinite(s.f) ? EM.si(s.f, 'Hz', 3) : '—'}</td><td>${isFinite(s.f) ? EM.si(1 / s.f, 's', 3) : '—'}</td><td>${isFinite(s.duty) ? (s.duty * 100).toFixed(0) + ' %' : '—'}</td></tr>`;
        }
        if (chs.length >= 2) {
          const a = win.data[chs[0].id], b = win.data[chs[1].id], sa = stats(a, chs[0].id), sb = stats(b, chs[1].id);
          if (sa && sb && isFinite(sa.f) && isFinite(sb.f) && Math.abs(sa.f - sb.f) < 0.05 * sa.f) {
            /* desfase por correlación cruzada */
            const n = Math.min(a.length, b.length), per = Math.round(1 / sa.f / T.dt); let best = 0, bd = 1e30;
            for (let d = 0; d < per; d++) { let e = 0; for (let i = 0; i + d < n && i < per * 2; i++) { const x = (a[i] - sa.mean) / (sa.pp || 1), y = (b[i + d] - sb.mean) / (sb.pp || 1); e += (x - y) * (x - y); } if (e < bd) { bd = e; best = d; } }
            let ph = -best / per * 360; if (ph < -180) ph += 360; if (ph > 180) ph -= 360;
            html += `<tr><td colspan="9" class="tl-sm">Desfase CH2 respecto a CH1 ≈ ${ph.toFixed(0)}° · relación de amplitudes ${(sb.pp / Math.max(sa.pp, 1e-12)).toFixed(3)}</td></tr>`;
          }
        }
        meas.innerHTML = html + '</table>';
      }
    }
    cvo.el.addEventListener('pointermove', (e) => { const r = cvo.el.getBoundingClientRect(); st.cur = { x: e.clientX - r.left, y: e.clientY - r.top }; T.redraw(); });
    cvo.el.addEventListener('pointerleave', () => { st.cur = null; T.redraw(); });
    return { el: root, draw, rebuild: buildV, title: 'Osciloscopio', cv: cvo };
  };

  /* ===================================================================
     Analizador de Bode / impedancia
     =================================================================== */
  /* Copia del circuito en reposo (solo continua) para el análisis de pequeña señal */
  P.tempNet = (T) => {
    const n = new EM.Net(Object.assign({}, T.net.cfg));
    n.load(T.net.doc);
    n.cfg.damage = false;
    for (const id in T.net.rt) { /* conserva el estado discreto (relés, SCR…) */ }
    n.rebuild();
    for (const e of n.cir.els) {
      if (e.type === 'V' && e.wave) { const w = e.wave; e.v = w.kind === 'pulse' ? (w.v0 || 0) : (w.offset || 0); e.wave = null; }
      if (e.type === 'I' && e.wave) { e.i = e.wave.offset || 0; e.wave = null; }
    }
    n.cir.hooks = n.cir.hooks || [];
    n.cir.solveDC();
    return n;
  };
  P.points = (T) => {
    const net = T.net; net.computeNets();
    const out = [], seen = new Set();
    for (const k in net.netInfo.labelNet) { const nn = net.netInfo.labelNet[k]; if (nn !== '0' && !seen.has(nn)) { seen.add(nn); out.push({ net: nn, name: k }); } }
    for (const part of net.doc.parts) {
      const c = EM.parts.CAT[part.t];
      if (c.ground || part.t === 'LBL' || c.instrument) continue;
      net.netInfo.pinNet[part.id].forEach((nn, i) => { if (nn !== '0' && !seen.has(nn) && (net.netInfo.members.get(nn) || 0) > 1) { seen.add(nn); out.push({ net: nn, name: part.id + '.' + c.pn[i] }); } });
    }
    return out;
  };

  P.bode = function (T, host) {
    const root = el('div', 'tl-panel');
    const st = (T.bode = Object.assign({ f0: 10, f1: 1e7, mode: 'gain', out: null }, T.bode));
    const bar = el('div', 'tl-pbar');
    const outSel = document.createElement('select'); outSel.className = 'tl-sel';
    const refresh = () => {
      const pts = P.points(T); outSel.innerHTML = '';
      for (const p of pts) { const o = document.createElement('option'); o.value = p.net; o.textContent = p.name; outSel.append(o); }
      if (!st.out || !pts.some((p) => p.net === st.out)) { const pref = pts.find((p) => /^(out|sal|vo)/i.test(p.name)) || pts[pts.length - 1]; st.out = pref ? pref.net : null; }
      if (st.out) outSel.value = st.out;
    };
    outSel.addEventListener('change', () => { st.out = outSel.value; });
    bar.append(mkLabel('Salida', outSel));
    bar.append(mkLabel('Magnitud', mkSelect([['gain', 'Ganancia (V/V con 1 V en la fuente de CA)'], ['z', 'Impedancia vista en el nodo (Ω)']], st.mode, (v) => { st.mode = v; })));
    const f0 = document.createElement('input'); f0.className = 'tl-in'; f0.value = EM.si(st.f0, '', 3).replace(' ', '');
    const f1 = document.createElement('input'); f1.className = 'tl-in'; f1.value = EM.si(st.f1, '', 3).replace(' ', '');
    bar.append(mkLabel('f inicial (Hz)', f0), mkLabel('f final (Hz)', f1));
    bar.append(mkBtn('Calcular', () => { const a = EM.parts.parseVal(f0.value), b = EM.parts.parseVal(f1.value); if (a > 0 && b > a) { st.f0 = a; st.f1 = b; } run(); }, 'primary'));
    root.append(bar);
    const cvo = T.sim.canvas({ parent: root, aspect: 1.9, cls: 'fixed', label: 'Diagrama de Bode', optional: true });
    const info = el('div', 'tl-meas'); root.append(info);
    let res = null;
    function run() {
      refresh();
      if (!st.out) { info.textContent = 'No hay nodos que analizar: conecte componentes y, si lo desea, ponga etiquetas.'; return; }
      const n = P.tempNet(T);
      const c = n.cir;
      if (!c.x) { info.textContent = 'El circuito no tiene solución en continua.'; return; }
      const nodeName = st.out;
      let hasAC = c.els.some((e) => e.type === 'V' && e.acmag);
      if (st.mode === 'gain' && !hasAC) { info.textContent = 'Agregue una fuente de CA (VAC, generador o red) para calcular la ganancia.'; return; }
      res = st.mode === 'z' ? c.acSweep(st.f0, st.f1, 240, (r) => r.at(nodeName), { inject: { node: c.node(nodeName), i: 1 } }) : c.acSweep(st.f0, st.f1, 240, nodeName);
      res.mode = st.mode;
      /* ganancia en banda y -3 dB */
      let html = '';
      if (res.f.length) {
        const mx = Math.max(...res.mag), imax = res.mag.indexOf(mx);
        html += `<b>Máximo:</b> ${st.mode === 'z' ? EM.si(Math.pow(10, mx / 20), 'Ω', 3) : mx.toFixed(2) + ' dB'} a ${EM.si(res.f[imax], 'Hz', 3)}`;
        if (st.mode === 'gain') {
          /* referencia: máximo si es interior (pasabanda); si no, el extremo mayor (pasabajos / pasaaltos) */
          const nF = res.f.length - 1;
          const ref = imax === 0 || imax === nF ? mx : mx;
          const lev = ref - 3.0103, ups = [];
          const magAt = (f) => { const r = c.ac(f); if (!r) return -400; const z = r.at(nodeName); return 20 * Math.log10(Math.max(Math.hypot(z[0], z[1]), 1e-30)); };
          for (let i = 1; i < res.f.length; i++) {
            const a = res.mag[i - 1] - lev, b = res.mag[i] - lev;
            if (a * b < 0) { let lo = res.f[i - 1], hi = res.f[i]; for (let it = 0; it < 40; it++) { const mid = Math.sqrt(lo * hi); const vm = magAt(mid) - lev; if (vm * a > 0) lo = mid; else hi = mid; } ups.push(Math.sqrt(lo * hi)); }
          }
          if (ups.length) html += ` · frecuencia(s) de −3 dB: ${ups.map((f) => EM.si(f, 'Hz', 3)).join(', ')}`;
          if (ups.length === 2) html += ` · ancho de banda ${EM.si(ups[1] - ups[0], 'Hz', 3)} · Q ≈ ${(Math.sqrt(ups[0] * ups[1]) / (ups[1] - ups[0])).toFixed(2)}`;
          res.f3 = ups;
        }
      }
      info.innerHTML = html;
      T.redraw();
    }
    function draw() {
      const c = cvo.ctx, w = cvo.w, h = cvo.h; if (!w) return;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      if (!res || !res.f.length) { EM.text(c, 'Pulse «Calcular» para ver la respuesta en frecuencia', w / 2, h / 2, { size: 13, color: '--ink-3', align: 'center' }); return; }
      const mags = res.mag, mn = Math.min(...mags), mx = Math.max(...mags);
      let lo = Math.floor((mn - 3) / 10) * 10, hi = Math.ceil((mx + 3) / 10) * 10; if (hi - lo < 20) hi = lo + 20; if (lo < mx - 100) lo = Math.ceil((mx - 100) / 10) * 10;
      const h1 = Math.round(h * 0.56);
      const mz = res.mode === 'z';
      const p1 = new EM.Plot(c, { x: 0, y: 0, w, h: h1, xmin: res.f[0], xmax: res.f[res.f.length - 1], xlog: true, ymin: lo, ymax: hi, ml: 56, mr: 12, mt: 10, mb: 8, ylabel: mz ? '|Z| (dB re 1 Ω)' : 'ganancia (dB)', xfmt: () => '' });
      p1.frame();
      p1.xy(res.f, mags.map((v) => Math.max(lo - 5, v)), { color: '--c1', width: 2.4 });
      if (!mz) { p1.hline(mx - 3.0103, { color: '--c2', dash: [5, 4], width: 1 }); }
      const ref = T.cfg.bodeRef;
      if (ref && !mz) { p1.xy(res.f, res.f.map((f) => Math.max(lo - 5, ref.fn(f)[0])), { color: '--c4', width: 1.6, dash: [6, 4] }); }
      const phs = res.ph, pmn = Math.floor(Math.min(...phs) / 45) * 45 - 0, pmx = Math.ceil(Math.max(...phs) / 45) * 45;
      const p2 = new EM.Plot(c, { x: 0, y: h1, w, h: h - h1, xmin: res.f[0], xmax: res.f[res.f.length - 1], xlog: true, ymin: Math.min(pmn, pmx - 90), ymax: Math.max(pmx, pmn + 90), ml: 56, mr: 12, mt: 6, mb: 36, xlabel: 'frecuencia (Hz)', ylabel: 'fase (°)' });
      p2.frame();
      p2.xy(res.f, phs, { color: '--c3', width: 2.2 });
      if (ref && !mz && ref.fn(res.f[0])[1] !== undefined) p2.xy(res.f, res.f.map((f) => ref.fn(f)[1]), { color: '--c4', width: 1.6, dash: [6, 4] });
      if (ref && !mz && ref.label) p1.legend([{ label: 'Taller (simulado)', color: '--c1' }, { label: ref.label, color: '--c4', kind: 'dash' }], 'bl');
      if (T.bode.cur) {
        const x = T.bode.cur.x; if (p1.inside(x, p1.iy + 2)) {
          const f = p1.invX(x); let k = 0; for (let i = 1; i < res.f.length; i++) if (Math.abs(Math.log(res.f[i] / f)) < Math.abs(Math.log(res.f[k] / f))) k = i;
          c.strokeStyle = EM.col('--ink-3'); c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h - 36); c.stroke(); c.setLineDash([]);
          EM.text(c, `${EM.si(res.f[k], 'Hz', 3)} · ${mz ? EM.si(Math.pow(10, res.mag[k] / 20), 'Ω', 3) : res.mag[k].toFixed(1) + ' dB'} · ${res.ph[k].toFixed(0)}°`, Math.min(x + 8, w - 190), 18, { size: 12, color: '--ink', weight: 600 });
        }
      }
    }
    cvo.el.addEventListener('pointermove', (e) => { const r = cvo.el.getBoundingClientRect(); T.bode.cur = { x: e.clientX - r.left }; T.redraw(); });
    cvo.el.addEventListener('pointerleave', () => { T.bode.cur = null; T.redraw(); });
    const setRange = (a, b) => { st.f0 = a; st.f1 = b; f0.value = EM.si(a, '', 3).replace(' ', ''); f1.value = EM.si(b, '', 3).replace(' ', ''); };
    return { el: root, draw, run, refresh, setRange, title: 'Bode', cv: cvo };
  };

  /* ===================================================================
     Curvas por barrido DC (familias): I(V), transferencia, curvas de salida
     =================================================================== */
  P.sweep = function (T, host) {
    const root = el('div', 'tl-panel');
    const st = (T.sweepCfg = Object.assign({ src: null, a: 0, b: 5, n: 120, src2: '', a2: 0, b2: 1e-3, n2: 5, meas: null }, T.sweepCfg));
    const bar = el('div', 'tl-pbar');
    const sSel = document.createElement('select'); sSel.className = 'tl-sel';
    const s2Sel = document.createElement('select'); s2Sel.className = 'tl-sel';
    const mSel = document.createElement('select'); mSel.className = 'tl-sel';
    const inp = (v) => { const i = document.createElement('input'); i.className = 'tl-in'; i.value = String(v); return i; };
    const ia = inp(st.a), ib = inp(st.b), ia2 = inp(st.a2), ib2 = inp(st.b2), in2 = inp(st.n2);
    bar.append(mkLabel('Fuente que se barre', sSel), mkLabel('desde', ia), mkLabel('hasta', ib));
    const bar2 = el('div', 'tl-pbar');
    bar2.append(mkLabel('Familia: 2.ª fuente', s2Sel), mkLabel('desde', ia2), mkLabel('hasta', ib2), mkLabel('curvas', in2));
    const bar3 = el('div', 'tl-pbar');
    bar3.append(mkLabel('Magnitud', mSel));
    bar3.append(mkBtn('Trazar', () => { st.src = sSel.value; st.src2 = s2Sel.value; st.meas = mSel.value; st.a = EM.parts.parseVal(ia.value); st.b = EM.parts.parseVal(ib.value); st.a2 = EM.parts.parseVal(ia2.value); st.b2 = EM.parts.parseVal(ib2.value); st.n2 = Math.max(1, Math.min(12, Math.round(+in2.value || 1))); run(); }, 'primary'));
    root.append(bar, bar2, bar3);
    const cvo = T.sim.canvas({ parent: root, aspect: 1.9, cls: 'fixed', label: 'Curvas por barrido', optional: true });
    const info = el('div', 'tl-meas'); root.append(info);
    let res = null;
    function refresh() {
      const net = T.net;
      const srcs = net.doc.parts.filter((p) => /^(VDC|BAT|PSU|IDC|VAC|FG)$/.test(p.t));
      const keep = [sSel.value, s2Sel.value, mSel.value];
      sSel.innerHTML = ''; s2Sel.innerHTML = '<option value="">(ninguna)</option>';
      for (const p of srcs) { for (const s of [sSel, s2Sel]) { const o = document.createElement('option'); o.value = p.id; o.textContent = p.id + ' (' + EM.parts.CAT[p.t].name + ')'; s.append(o); } }
      if (st.src && srcs.some((p) => p.id === st.src)) sSel.value = st.src; else if (srcs.length) sSel.value = srcs[0].id;
      if (st.src2 && srcs.some((p) => p.id === st.src2)) s2Sel.value = st.src2;
      mSel.innerHTML = '';
      for (const p of P.points(T)) { const o = document.createElement('option'); o.value = 'v:' + p.net; o.textContent = 'tensión en ' + p.name; mSel.append(o); }
      for (const p of net.doc.parts) { const c = EM.parts.CAT[p.t]; if (c.instrument || c.ground || p.t === 'LBL') continue; const o = document.createElement('option'); o.value = 'i:' + p.id; o.textContent = 'corriente por ' + p.id; mSel.append(o); }
      if (!st.meas && st.measLabel) { const q = P.points(T).find((x) => x.name === st.measLabel); if (q) st.meas = 'v:' + q.net; }
      if (st.meas && [...mSel.options].some((o) => o.value === st.meas)) mSel.value = st.meas;
    }
    function run() {
      refresh();
      if (!sSel.value) { info.textContent = 'Agregue una fuente de tensión o corriente para barrer.'; return; }
      const n = P.tempNet(T), c = n.cir;
      const sp = n.part(sSel.value), sp2 = s2Sel.value ? n.part(s2Sel.value) : null;
      const e1 = n.rt[sp.id].ref.src, e2 = sp2 ? n.rt[sp2.id].ref.src : null;
      const key1 = sp.t === 'IDC' ? 'i' : 'v';
      const measure = (cc) => {
        const [k, id] = (mSel.value || '').split(':');
        if (k === 'v') return cc.vNamed(id);
        const part = n.part(id); const r = n.rt[id].ref.main; if (!r) return 0;
        return r.type === 'V' ? -r.i : r.i;
      };
      const curves = [];
      const m2 = sp2 ? st.n2 : 1;
      for (let j = 0; j < m2; j++) {
        if (sp2) { const v2 = st.a2 + (st.b2 - st.a2) * (m2 === 1 ? 0 : j / (m2 - 1)); if (sp2.t === 'IDC') e2.i = v2; else e2.v = v2; e2.wave = null; }
        const sw = c.dcSweep(e1.id, st.a, st.b, st.n, measure);
        curves.push({ x: sw.x, y: sw.y, label: sp2 ? `${sp2.id} = ${EM.si(sp2.t === 'IDC' ? e2.i : e2.v, sp2.t === 'IDC' ? 'A' : 'V', 3)}` : '' });
      }
      res = { curves, xlab: `${sp.id} (${key1 === 'i' ? 'A' : 'V'})`, ylab: mSel.options[mSel.selectedIndex] ? mSel.options[mSel.selectedIndex].textContent : '' };
      info.textContent = 'Cada punto es un punto de operación en continua (no un transitorio).';
      T.redraw();
    }
    function draw() {
      const c = cvo.ctx, w = cvo.w, h = cvo.h; if (!w) return;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      if (!res) { EM.text(c, 'Elija la fuente y la magnitud y pulse «Trazar»', w / 2, h / 2, { size: 13, color: '--ink-3', align: 'center' }); return; }
      let ymin = Infinity, ymax = -Infinity;
      for (const cu of res.curves) for (const y of cu.y) if (y !== null && isFinite(y)) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
      if (!isFinite(ymin)) { ymin = 0; ymax = 1; }
      if (ymax - ymin < 1e-12) { ymax += 1; ymin -= 1; }
      const xr = res.curves[0].x, pad = (ymax - ymin) * 0.06;
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: Math.min(xr[0], xr[xr.length - 1]), xmax: Math.max(xr[0], xr[xr.length - 1]), ymin: ymin - pad, ymax: ymax + pad, ml: 62, mr: 14, mt: 12, mb: 40, xlabel: res.xlab, ylabel: res.ylab });
      pl.frame();
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--accent', '--gold'];
      res.curves.forEach((cu, k) => { const xs = [], ys = []; cu.x.forEach((x, i) => { if (cu.y[i] !== null && isFinite(cu.y[i])) { xs.push(x); ys.push(cu.y[i]); } }); pl.xy(xs, ys, { color: cols[k % cols.length], width: 2.2 }); });
      if (res.curves[0].label) pl.legend(res.curves.map((cu, k) => ({ label: cu.label, color: cols[k % cols.length] })), 'tl');
    }
    const setCfg = (o) => { Object.assign(st, o); ia.value = String(st.a); ib.value = String(st.b); ia2.value = String(st.a2); ib2.value = String(st.b2); in2.value = String(st.n2); refresh(); if (st.src) sSel.value = st.src; if (st.src2) s2Sel.value = st.src2; };
    return { el: root, draw, run, refresh, setCfg, title: 'Curvas', cv: cvo };
  };

  /* ===================================================================
     Tabla de operación (en vivo)
     =================================================================== */
  P.table = function (T, host) {
    const root = el('div', 'tl-panel');
    const body = el('div', 'tl-optable'); root.append(body);
    let t0 = 0;
    function refresh() {
      const now = performance.now(); if (now - t0 < 300) return; t0 = now;
      const net = T.net; if (!net.cir || !net.cir.x) { body.textContent = 'Sin solución.'; return; }
      let h = '<div class="tl-op2"><table class="tl-mt"><tr><th>Nodo</th><th>Tensión</th></tr>';
      for (const p of P.points(T)) h += `<tr><td>${p.name}</td><td>${EM.si(net.v(p.net), 'V', 4)}</td></tr>`;
      h += '</table><table class="tl-mt"><tr><th>Componente</th><th>V entre terminales</th><th>Corriente</th><th>Potencia</th><th>Temp.</th><th>Estado</th></tr>';
      for (const part of net.doc.parts) {
        const c = EM.parts.CAT[part.t]; if (c.ground || part.t === 'LBL') continue;
        const r = net.rt[part.id]; const m = r && r.ref && r.ref.main; if (!m) continue;
        const v = Math.abs(m.vab !== undefined ? m.vab : 0), i = net.iPart(part);
        const pw = r.pw !== undefined ? r.pw : Math.abs(m.p || 0);
        h += `<tr><td><b>${part.id}</b> ${c.name}</td><td>${EM.si(m.vab || 0, 'V', 3)}</td><td>${EM.si(i, 'A', 3)}</td><td>${EM.si(Math.abs(m.p || 0), 'W', 3)}</td><td>${r.T ? Math.round(r.T) + ' °C' : '—'}</td><td>${part.dead ? '<span class="tl-bad">' + part.dead.kind + '</span>' : part.fault ? '<span class="tl-bad">' + part.fault.kind + '</span>' : 'ok'}</td></tr>`;
      }
      body.innerHTML = h + '</table></div>';
    }
    return { el: root, draw() {}, refresh, title: 'Operación' };
  };
})();
