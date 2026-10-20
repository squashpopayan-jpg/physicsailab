/* ===================================================================
   30-lab.js — Herramientas del banco virtual:
   · azar reproducible, estadística, incertidumbre (GUM) y ajustes
   · formato «valor ± incertidumbre» y compatibilidad con la referencia
   · tabla de datos con copia y descarga CSV
   · lugar de trabajo (gravedad, presión, campo) elegido por el usuario
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const L = (EM.L = {});
  const D = EM.draw;

  /* ---------- Azar reproducible (mulberry32) ---------- */
  L.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.gauss = (mu = 0, s = 1) => {
      let u = 0, v = 0;
      while (u === 0) u = r();
      while (v === 0) v = r();
      return mu + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    r.uni = (a0, b0) => a0 + (b0 - a0) * r();
    return r;
  };
  L.semilla = () => (Math.random() * 4294967295) >>> 0;
  L.quant = (x, res) => (res > 0 ? Math.round(x / res) * res : x);

  /* ---------- Estadística ---------- */
  L.mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
  L.std = function (a) {
    if (a.length < 2) return NaN;
    const m = L.mean(a);
    return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1));
  };
  L.sem = (a) => L.std(a) / Math.sqrt(a.length);
  /* Cuantil 0,975 de la t de Student (bilateral 95 %) para ν grados de libertad */
  const T975 = [NaN, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
  L.t95 = (nu) => (nu < 1 ? NaN : nu <= 30 ? T975[Math.round(nu)] : 1.96 + 2.4 / nu);
  /* Incertidumbre tipo B por resolución: distribución rectangular de semiancho res/2 → res/√12 */
  L.uRes = (res) => res / Math.sqrt(12);
  L.uComb = (...u) => Math.sqrt(u.reduce((s, x) => s + x * x, 0));

  /* ---------- Ajustes ---------- */
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
      const w = sy ? 1 / (sy[i] * sy[i]) : 1, r = ys[i] - (m * xs[i] + b);
      ssr += w * r * r; sst += w * (ys[i] - my) * (ys[i] - my);
    }
    let sm, sb;
    if (sy) { sm = Math.sqrt(S / Dt); sb = Math.sqrt(Sxx / Dt); }
    else { const s2 = n > 2 ? ssr / (n - 2) : 0; sm = Math.sqrt((s2 * S) / Dt); sb = Math.sqrt((s2 * Sxx) / Dt); }
    return { m, b, sm, sb, r2: sst > 0 ? 1 - ssr / sst : 1, n, f: (x) => m * x + b };
  };
  L.fitProp = function (xs, ys) {
    const n = Math.min(xs.length, ys.length);
    if (n < 1) return null;
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; syy += ys[i] * ys[i]; }
    const m = sxy / sxx;
    let ssr = 0;
    for (let i = 0; i < n; i++) { const r = ys[i] - m * xs[i]; ssr += r * r; }
    return { m, b: 0, sm: n > 1 ? Math.sqrt(ssr / (n - 1) / sxx) : 0, sb: 0, n, r2: 1 - ssr / syy, f: (x) => m * x };
  };
  /* y = A x^p por regresión lineal en escala log–log */
  L.fitPow = function (xs, ys) {
    const X = [], Y = [];
    for (let i = 0; i < xs.length; i++) if (xs[i] > 0 && ys[i] > 0) { X.push(Math.log(xs[i])); Y.push(Math.log(ys[i])); }
    const r = L.fitLine(X, Y);
    if (!r) return null;
    const A = Math.exp(r.b);
    return { p: r.m, sp: r.sm, A, sA: A * r.sb, r2: r.r2, n: r.n, f: (x) => A * Math.pow(x, r.m) };
  };
  L.solve = function (A, b) {
    const n = b.length, a = A.map((r, i) => r.slice().concat([b[i]]));
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
    const n = A.length, cols = [];
    for (let j = 0; j < n; j++) { const e = new Array(n).fill(0); e[j] = 1; const c = L.solve(A, e); if (!c) return null; cols.push(c); }
    return A.map((_, i) => cols.map((c) => c[i]));
  };
  /* Levenberg–Marquardt: model(x, p) → y */
  L.fitLM = function (model, p0, xs, ys, o = {}) {
    const n = Math.min(xs.length, ys.length), k = p0.length;
    let p = p0.slice();
    const resid = (pp) => { let s = 0; for (let i = 0; i < n; i++) { const r = ys[i] - model(xs[i], pp); s += r * r; } return s; };
    let chi = resid(p), lam = 1e-3, JTJ = null;
    if (!isFinite(chi)) return null;
    for (let it = 0; it < (o.maxIt || 200); it++) {
      JTJ = Array.from({ length: k }, () => new Array(k).fill(0));
      const JTr = new Array(k).fill(0);
      for (let i = 0; i < n; i++) {
        const y0 = model(xs[i], p), row = [];
        for (let j = 0; j < k; j++) { const h = Math.max(1e-9, Math.abs(p[j]) * 1e-6), pp = p.slice(); pp[j] += h; row.push((model(xs[i], pp) - y0) / h); }
        const r = ys[i] - y0;
        for (let a = 0; a < k; a++) { JTr[a] += row[a] * r; for (let b = 0; b < k; b++) JTJ[a][b] += row[a] * row[b]; }
      }
      let improved = false;
      for (let tries = 0; tries < 12; tries++) {
        const A = JTJ.map((r, i) => r.map((v, j) => (i === j ? v * (1 + lam) + 1e-12 : v)));
        const dp = L.solve(A, JTr);
        if (!dp) { lam *= 10; continue; }
        const pn = p.map((v, i) => v + dp[i]), cn = resid(pn);
        if (isFinite(cn) && cn < chi) {
          const rel = (chi - cn) / Math.max(chi, 1e-300);
          p = pn; chi = cn; lam = Math.max(lam / 5, 1e-12); improved = true;
          if (rel < 1e-12) it = 1e9;
          break;
        }
        lam *= 8;
      }
      if (!improved) break;
    }
    const s2 = n > k ? chi / (n - k) : 0, inv = JTJ ? L.inverse(JTJ) : null;
    const sp = inv ? inv.map((r, i) => Math.sqrt(Math.max(0, s2 * r[i]))) : p.map(() => NaN);
    return { p, sp, chi2: chi, n, f: (x) => model(x, p) };
  };

  /* ---------- Formato ---------- */
  /* Valor ± incertidumbre con una o dos cifras significativas en la incertidumbre (GUM 7.2.6) */
  L.pm = function (v, s, unit = '') {
    if (!isFinite(v)) return '—';
    const U = unit ? ' ' + unit : '';
    if (!(s > 0) || !isFinite(s)) return EM.sci(v, 4) + U;
    const e = Math.floor(Math.log10(s)), lead = s / Math.pow(10, e), dig = lead < 2.5 ? 2 : 1;
    const dec = -(e - dig + 1);
    const big = Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0);
    if (big || dec > 8 || dec < -6) {
      const ev = Math.floor(Math.log10(Math.abs(v) || s)), f = Math.pow(10, ev), d2 = Math.max(0, ev - e + dig - 1);
      return '(' + EM.fix(v / f, d2) + ' ± ' + EM.fix(s / f, d2) + ')×10' + EM.sup(ev) + U;
    }
    const d = Math.max(0, dec);
    const r = (x) => (d > 0 ? EM.fix(x, d) : EM.fix(Math.round(x / Math.pow(10, -dec)) * Math.pow(10, -dec), 0));
    return r(v) + ' ± ' + r(s) + U;
  };
  /* Número para tablas: n decimales con coma */
  L.num = (x, d = 3) => (isFinite(x) ? EM.fix(x, d) : '—');
  /* Compatibilidad entre resultado y referencia: z = |x − ref| / √(u² + uref²) */
  L.compat = function (x, ux, ref, uref = 0) {
    const z = Math.abs(x - ref) / Math.sqrt(ux * ux + uref * uref || 1e-300);
    const er = (100 * (x - ref)) / ref;
    const v = z <= 2 ? ['ok', 'Compatibles'] : z <= 3 ? ['mid', 'Dudoso'] : ['bad', 'Incompatibles'];
    return { z, er, cls: v[0], txt: v[1], html: `<span class="chip ${v[0]}">${v[1]}</span> z = ${EM.fix(z, 1)} · diferencia ${EM.fix(er, 1)} %` };
  };

  /* ---------- Copiar y descargar ---------- */
  L.csv = (headers, rows) => [headers.join(';')].concat(rows.map((r) => r.map((v) => (typeof v === 'number' ? (isFinite(v) ? EM.coma(String(+v.toPrecision(7))) : '') : '"' + String(v).replace(/"/g, '""') + '"')).join(';'))).join('\r\n');
  L.tsv = (headers, rows) => [headers.join('\t')].concat(rows.map((r) => r.map((v) => (typeof v === 'number' ? (isFinite(v) ? EM.coma(String(+v.toPrecision(7))) : '') : v)).join('\t'))).join('\n');
  L.copiar = function (texto, btn) {
    const t0 = btn ? btn.textContent : '';
    const ok = () => { if (btn) { btn.textContent = 'Copiado ✓'; setTimeout(() => { btn.textContent = t0; }, 1500); } };
    const no = () => { if (btn) { btn.textContent = 'Seleccione y copie'; setTimeout(() => { btn.textContent = t0; }, 1800); } };
    try { navigator.clipboard.writeText(texto).then(ok, no); } catch (e) { no(); }
  };
  /* Descarga: capacidad «downloads» del artefacto publicado; en la copia local, enlace con blob */
  let dlP = null;
  const capDl = () => {
    if (!window.claude || typeof window.claude.use !== 'function') return Promise.resolve(null);
    if (!dlP) dlP = window.claude.use('downloads').catch(() => null);
    return dlP;
  };
  L.guardar = async function (nombre, datos, tipo = 'application/octet-stream') {
    const dl = await capDl();
    if (dl) {
      try { await dl.save({ filename: nombre, data: datos }); return 'ok'; }
      catch (e) { return e && e.code === 'declined' ? 'cancelado' : 'error:' + (e && e.message ? e.message : e); }
    }
    try {
      const blob = datos instanceof Blob ? datos : new Blob([datos], { type: tipo });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = nombre; document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return 'ok';
    } catch (e) { return 'error:' + e.message; }
  };
  L.botonDescarga = function (parent, texto, fn, o = {}) {
    const wrap = el('div', 'dl-row');
    const b = el('button', 'btn' + (o.primary ? ' primary' : ''), '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 6.8 8 10.3l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' + texto);
    b.type = 'button';
    const msg = el('span', 'dl-msg');
    b.addEventListener('click', async () => {
      msg.textContent = 'Preparando…';
      try {
        const [nombre, datos, tipo] = await fn();
        const r = await L.guardar(nombre, datos, tipo);
        msg.textContent = r === 'ok' ? 'Archivo entregado: ' + nombre : r === 'cancelado' ? 'Descarga cancelada.' : 'No se pudo descargar en esta vista.';
      } catch (e) { msg.textContent = 'Error: ' + e.message; }
    });
    wrap.append(b, msg);
    parent.append(wrap);
    return b;
  };

  /* ---------- Tabla de datos de un banco virtual ---------- */
  /* cols: [{k, t (título con unidad), d (decimales)}] */
  L.Tabla = class {
    constructor(sim, cols, o = {}) {
      this.sim = sim; this.cols = cols; this.rows = []; this.max = o.max || 60; this.nombre = o.nombre || sim.name;
      const box = el('div', 'sim-table');
      const bar = el('div', 'sim-table-bar');
      this.cap = el('span', 'sim-table-cap', o.titulo || 'Tabla de datos');
      const bc = el('button', 'btn small', 'Copiar'); bc.type = 'button';
      bc.addEventListener('click', () => L.copiar(L.tsv(this.cols.map((c) => c.t), this.rows.map((r) => this.cols.map((c) => r[c.k]))), bc));
      const bd = el('button', 'btn small', 'CSV'); bd.type = 'button';
      bd.title = 'Descargar los datos en CSV (separador punto y coma, coma decimal)';
      bd.addEventListener('click', async () => {
        const r = await L.guardar(this.nombre + '.csv', '﻿' + L.csv(this.cols.map((c) => c.t), this.rows.map((r) => this.cols.map((c) => r[c.k]))), 'text/csv');
        bd.textContent = r === 'ok' ? 'CSV ✓' : 'CSV';
        setTimeout(() => { bd.textContent = 'CSV'; }, 1500);
      });
      bar.append(this.cap, bc, bd);
      this.wrap = el('div', 'tablewrap');
      this.table = el('table', 'datos');
      this.wrap.append(this.table);
      box.append(bar, this.wrap);
      (o.parent || sim.stageCol).append(box);
      this.render();
    }
    add(r) { this.rows.push(r); if (this.rows.length > this.max) this.rows.shift(); this.render(); }
    set(rows) { this.rows = rows.slice(-this.max); this.render(); }
    clear() { this.rows = []; this.render(); }
    col(k) { return this.rows.map((r) => r[k]); }
    render() {
      const h = '<tr><th class="c">#</th>' + this.cols.map((c) => `<th class="c">${EM.supHTML(c.t)}</th>`).join('') + '</tr>';
      const b = this.rows.length ? this.rows.map((r, i) => `<tr><td class="c">${i + 1}</td>` + this.cols.map((c) => `<td class="c num">${typeof r[c.k] === 'number' ? L.num(r[c.k], c.d === undefined ? 3 : c.d) : r[c.k] === undefined ? '—' : r[c.k]}</td>`).join('') + '</tr>').join('')
        : `<tr><td class="c vacio" colspan="${this.cols.length + 1}">Sin datos: use «Medir» o «Serie completa».</td></tr>`;
      this.table.innerHTML = h + b;
    }
  };

  /* Puntos con barras de error y recta de ajuste en un EM.Plot */
  L.puntos = function (pl, xs, ys, o = {}) {
    const ctx = pl.ctx;
    for (let i = 0; i < xs.length; i++) {
      if (o.ey && o.ey[i] > 0) {
        ctx.save(); ctx.strokeStyle = EM.col(o.color || '--accent'); ctx.lineWidth = 1.2;
        const x = pl.X(xs[i]), y1 = pl.Y(ys[i] - o.ey[i]), y2 = pl.Y(ys[i] + o.ey[i]);
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.moveTo(x - 3, y1); ctx.lineTo(x + 3, y1); ctx.moveTo(x - 3, y2); ctx.lineTo(x + 3, y2); ctx.stroke(); ctx.restore();
      }
      pl.dot(xs[i], ys[i], { color: o.color || '--accent', r: o.r || 4 });
    }
  };
  /* Límites cómodos para un conjunto de datos */
  L.rango = function (vals, o = {}) {
    const v = vals.filter((x) => isFinite(x));
    let a = v.length ? Math.min(...v) : 0, b = v.length ? Math.max(...v) : 1;
    if (o.cero) { a = Math.min(0, a); b = Math.max(0, b); }
    if (b - a < 1e-12) { if (a === 0) { b = 1; } else { b = a + Math.abs(a) * 0.1; a -= Math.abs(a) * 0.1; } }
    const pad = (b - a) * (o.pad === undefined ? 0.08 : o.pad);
    return [o.cero && a === 0 ? 0 : a - pad, b + pad];
  };


  /* ---------- Banco virtual genérico ----------
     o = {nombre, cols, aspect:[montaje, gráfica], montaje(ctx, cv, p, st), paso(dt, st, p),
          medir(p, rnd, st) → fila | filas, serie(p, rnd, st) → filas,
          grafica(filas, p, st) → {x, y, ey, xl, yl, ajuste:'recta'|'origen'|'potencia'|null, curva, xr, yr, cero},
          resultado(fit, filas, p, st) → [[id, etiqueta, html, resaltar]] , controles(sim, st) } */
  EM.banco = function (sim, o) {
    const st = { semilla: L.semilla(), t: 0 };
    st.rnd = L.rng(st.semilla);
    if (o.estado) Object.assign(st, o.estado());
    sim.cols2();
    const cvM = sim.canvas({ aspect: (o.aspect && o.aspect[0]) || 1.15, label: 'Montaje' });
    const cvG = sim.canvas({ aspect: (o.aspect && o.aspect[1]) || 1.15, label: 'Gráfica' });
    st.cvM = cvM; st.cvG = cvG;
    if (o.controles) o.controles(sim, st);
    sim.group('Mediciones');
    const tabla = new L.Tabla(sim, o.cols, { nombre: o.nombre || sim.name, titulo: o.tituloTabla });
    st.tabla = tabla;
    const agregar = (r) => { if (Array.isArray(r)) r.forEach((x) => tabla.add(x)); else if (r) tabla.add(r); };
    sim.button(o.textoMedir || 'Medir', () => { agregar(o.medir(sim.p, st.rnd, st)); sim.redraw(); }, { primary: true });
    if (o.serie) sim.button('Serie completa', () => { tabla.clear(); agregar(o.serie(sim.p, st.rnd, st)); sim.redraw(); });
    sim.button('Borrar', () => { tabla.clear(); sim.redraw(); });
    sim.note('Cada medida incluye el error aleatorio del instrumento elegido; «Serie completa» reemplaza la tabla.');
    const outs = {};
    let fit = null;
    const draw = () => {
      const p = sim.p;
      D.clear(cvM);
      o.montaje(cvM.ctx, cvM, p, st);
      D.clear(cvG);
      const g = o.grafica(tabla.rows, p, st);
      fit = null;
      if (g) {
        const xs = g.x || [], ys = g.y || [];
        if (xs.length >= 2 && g.ajuste) {
          if (g.ajuste === 'recta') fit = L.fitLine(xs, ys);
          else if (g.ajuste === 'origen') fit = L.fitProp(xs, ys);
          else if (g.ajuste === 'potencia') fit = L.fitPow(xs, ys);
          else if (typeof g.ajuste === 'function') fit = g.ajuste(xs, ys);
        }
        const xr = g.xr || L.rango(xs.concat(g.xextra || []), { cero: g.cero !== false });
        const yr = g.yr || L.rango(ys.concat(g.yextra || []), { cero: g.cero !== false });
        const pl = new EM.Plot(cvG.ctx, { x: 0, y: 0, w: cvG.w, h: cvG.h, xmin: xr[0], xmax: xr[1], ymin: yr[0], ymax: yr[1], xlabel: g.xl, ylabel: g.yl, ml: g.ml || 58 });
        pl.frame();
        if (g.curva) pl.fn(g.curva, { color: '--ink-3', width: 1.4, dash: [5, 4] });
        if (g.curvas) for (const c of g.curvas) pl.fn(c.f, { color: c.color || '--ink-3', width: c.width || 1.4, dash: c.dash || [5, 4] });
        if (fit && fit.f) pl.fn(fit.f, { color: '--c2', width: 2.2 });
        L.puntos(pl, xs, ys, { ey: g.ey });
        if (!xs.length && !g.sinMensaje) EM.text(cvG.ctx, 'Tome medidas para ver la gráfica', cvG.w / 2, cvG.h / 2, { size: 13, align: 'center', color: '--ink-3' });
        if (g.leyenda) pl.legend(g.leyenda, g.esquina || 'tl');
        st.pl = pl;
      }
      const res = o.resultado ? o.resultado(fit, tabla.rows, p, st) : [];
      for (const [id, lab, html, hl] of res) {
        if (!outs[id]) outs[id] = sim.out(id, lab, { hl });
        sim.set(id, html);
      }
    };
    sim.onDraw(draw);
    if (o.paso) sim.animate((dt) => { st.t += dt; o.paso(dt, st, sim.p); }, { autoplay: true });
    sim.button('Nueva muestra', () => { st.semilla = L.semilla(); st.rnd = L.rng(st.semilla); tabla.clear(); sim.redraw(); }, { where: 'head', icon: 'reset' });
    EM.onLocal.push(() => sim.redraw());
    return st;
  };

  /* ---------- Lugar de trabajo ---------- */
  EM.onLocal = [];
  let lugarActual = null;
  EM.local = function () {
    if (lugarActual) return lugarActual;
    const g = EM.store.get('lugar', null);
    let base = EM.LOC.CAPITALES.find((c) => c.nombre === (g && g.nombre)) || null;
    if (g && g.custom) base = { nombre: g.nombre || 'Mi municipio', dep: g.dep || '', lat: +g.lat, lon: +g.lon, h: +g.h, custom: true };
    if (!base) base = EM.LOC.CAPITALES.find((c) => c.nombre === EM.LOC.POR_DEFECTO);
    lugarActual = EM.LOC.datos(base, new Date());
    return lugarActual;
  };
  EM.setLocal = function (lugar) {
    EM.store.set('lugar', lugar.custom ? { custom: true, nombre: lugar.nombre, dep: lugar.dep, lat: lugar.lat, lon: lugar.lon, h: lugar.h } : { nombre: lugar.nombre });
    lugarActual = null;
    const d = EM.local();
    EM.onLocal.forEach((f) => { try { f(d); } catch (e) { console.error(e); } });
    return d;
  };
})();
