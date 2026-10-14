/* ===================================================================
   30-money.js — Formato colombiano de cifras, gráficas de dinero
   (barras, abanicos de percentiles) y controles extra de las simulaciones
   (entradas numéricas, texto, cifras grandes y contenido HTML).
   =================================================================== */
(function () {
  'use strict';
  const RC = window.RC;
  const el = RC.el;

  /* ---------- Formato: miles con punto, decimales con coma ---------- */
  const NB = ' '; /* espacio sin separación */
  RC.nf = function (x, d = 0) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    let s = Math.abs(x).toFixed(d);
    if (+s === 0) x = 0;
    let [ent, dec] = s.split('.');
    ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (x < 0 ? '−' : '') + ent + (dec ? ',' + dec : '');
  };
  RC.cop = (x, d = 0) => (x < 0 ? '−$' + NB + RC.nf(-x, d) : '$' + NB + RC.nf(x, d));
  /* Pesos en palabras cortas: «$ 12,3 millones», «$ 1,2 mil millones» */
  RC.copS = function (x, d = 1) {
    const a = Math.abs(x), sg = x < 0 ? '−' : '';
    if (!isFinite(x)) return '—';
    if (a >= 1e12) return sg + '$' + NB + RC.nf(a / 1e12, d) + NB + (a >= 2e12 ? 'billones' : 'billón');
    if (a >= 1e9) return sg + '$' + NB + RC.nf(a / 1e9, d) + NB + 'mil millones';
    if (a >= 1e6) return sg + '$' + NB + RC.nf(a / 1e6, d) + NB + (a >= 1.95e6 || d > 0 ? 'millones' : 'millón');
    return RC.cop(x);
  };
  /* Para ejes: «$12 M», «$500 mil», «$1,2 mil M» */
  RC.copAxis = function (x) {
    const a = Math.abs(x), sg = x < 0 ? '−' : '';
    const t = (v) => RC.nf(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);
    if (a >= 1e12) return sg + '$' + t(a / 1e12) + ' B';
    if (a >= 1e9) return sg + '$' + t(a / 1e9) + ' mil M';
    if (a >= 1e6) return sg + '$' + t(a / 1e6) + ' M';
    if (a >= 1e3) return sg + '$' + t(a / 1e3) + ' mil';
    return sg + '$' + t(a);
  };
  RC.pct = (x, d = 1) => (x === null || x === undefined || Number.isNaN(x) ? '—' : !isFinite(x) ? (x > 0 ? '∞' : '−∞') : RC.nf(100 * x, d) + NB + '%');
  RC.pctAxis = (x) => RC.nf(100 * x, Math.abs(100 * x - Math.round(100 * x)) < 1e-9 ? 0 : 1) + '%';
  RC.yrs = (x, d = 1) => (isFinite(x) ? RC.nf(x, d) + NB + (Math.abs(x - 1) < 1e-9 ? 'año' : 'años') : 'nunca');
  RC.mes = (x) => (isFinite(x) ? RC.nf(x, 0) + NB + (Math.round(x) === 1 ? 'mes' : 'meses') : 'nunca');
  /* Lee una cifra escrita a la colombiana o a la inglesa */
  RC.parseNum = function (s) {
    s = String(s).replace(/[$\s ]/g, '').replace(/−/g, '-');
    if (!s) return NaN;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return parseFloat(s.replace(/,/g, ''));
    return parseFloat(s.replace(',', '.'));
  };

  /* ---------- Gráficas de dinero ---------- */
  const P = RC.Plot.prototype;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? RC.col(c) : c);
  /* Barras verticales centradas en xs; st = {color, w (ancho en unidades de x), base, colors[], alpha, labels, fmt} */
  P.bars = function (xs, ys, st = {}) {
    const ctx = this.ctx, w = st.w || 0.7, base = st.base || 0;
    this.clip(() => {
      xs.forEach((x, i) => {
        const y = ys[i];
        if (!isFinite(y)) return;
        const x0 = this.X(x - w / 2), x1 = this.X(x + w / 2), y0 = this.Y(base), y1 = this.Y(y);
        ctx.fillStyle = C((st.colors && st.colors[i]) || (st.signed ? (y >= base ? '--gain' : '--loss') : st.color || '--c1'));
        ctx.globalAlpha = st.alpha === undefined ? 0.88 : st.alpha;
        ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.max(1, Math.abs(x1 - x0)), Math.abs(y1 - y0));
      });
    });
    ctx.globalAlpha = 1;
    if (st.labels) xs.forEach((x, i) => { if (isFinite(ys[i])) RC.text(ctx, (st.fmt || RC.copAxis)(ys[i]), this.X(x), this.Y(ys[i]) + (ys[i] >= base ? -5 : 13), { size: 11, align: 'center', color: '--ink-2', halo: true, mono: true }); });
    return this;
  };
  /* Barras apiladas: series = [{ys, color}] */
  P.stack = function (xs, series, st = {}) {
    const ctx = this.ctx, w = st.w || 0.7;
    this.clip(() => {
      xs.forEach((x, i) => {
        let acc = 0;
        for (const s of series) {
          const v = s.ys[i];
          if (!(v > 0)) continue;
          const x0 = this.X(x - w / 2), x1 = this.X(x + w / 2), ya = this.Y(acc), yb = this.Y(acc + v);
          ctx.fillStyle = C(s.color);
          ctx.globalAlpha = s.alpha === undefined ? 0.88 : s.alpha;
          ctx.fillRect(x0, yb, Math.max(1, x1 - x0), ya - yb);
          acc += v;
        }
      });
    });
    ctx.globalAlpha = 1;
    return this;
  };
  /* Relleno entre dos curvas */
  P.between = function (xs, lo, hi, st = {}) {
    const ctx = this.ctx;
    this.clip(() => {
      ctx.save();
      ctx.fillStyle = C(st.color || '--c1');
      ctx.globalAlpha = st.alpha === undefined ? 0.15 : st.alpha;
      ctx.beginPath();
      xs.forEach((x, i) => { const px = this.X(x), py = this.Y(Math.min(hi[i], this.o.ymax * 10)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(this.X(xs[i]), this.Y(Math.max(lo[i], this.o.ylog ? this.o.ymin : -1e300)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    return this;
  };
  /* Abanico de percentiles: q = [p5, p25, p50, p75, p95] */
  P.fan = function (xs, q, st = {}) {
    const col = st.color || '--c1';
    this.between(xs, q[0], q[4], { color: col, alpha: 0.12 });
    this.between(xs, q[1], q[3], { color: col, alpha: 0.22 });
    this.xy(xs, q[2], { color: col, width: 2.4 });
    return this;
  };
  /* Rótulo al final de una curva */
  P.endLabel = function (x, y, text, st = {}) {
    RC.text(this.ctx, text, this.X(x) - 4, this.Y(y) + (st.dy || -6), { size: 11.5, align: 'right', color: st.color || '--ink-2', halo: true, weight: st.weight || 600 });
    return this;
  };

  /* ---------- Controles extra del panel ---------- */
  const S = RC.Sim.prototype;
  /* Entrada numérica con formato colombiano. o = {label, value, min, max, money, dec, unit} */
  S.num = function (id, o) {
    const row = el('div', 'ctrl');
    const lab = el('label', null, o.label);
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.inputMode = 'decimal';
    inp.className = 'num-in';
    inp.id = this._id(id);
    lab.htmlFor = inp.id;
    const fmt = (v) => (o.money ? RC.cop(v) : RC.nf(v, o.dec || 0)) + (o.unit ? ' ' + o.unit : '');
    this.p[id] = o.value;
    inp.value = fmt(o.value);
    const commit = () => {
      let v = RC.parseNum(inp.value.replace(o.unit || '\u0000', ''));
      if (!isFinite(v)) v = this.p[id];
      if (o.min !== undefined) v = Math.max(o.min, v);
      if (o.max !== undefined) v = Math.min(o.max, v);
      this.p[id] = v;
      inp.value = fmt(v);
      if (o.onInput) o.onInput(v);
      this.changed(id);
    };
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    inp.addEventListener('focus', () => { inp.select(); });
    row.append(lab, inp);
    this._parent().append(row);
    const api = { el: row, input: inp, get: () => this.p[id], set: (v, silent) => { this.p[id] = v; inp.value = fmt(v); if (!silent) this.changed(id); }, show: (vis) => { row.hidden = !vis; } };
    this.ctl[id] = api;
    return api;
  };
  /* Texto libre (una línea o varias). o = {label, value, placeholder, rows} */
  S.text = function (id, o) {
    const row = el('div', 'ctrl');
    const lab = el('label', null, o.label);
    const inp = document.createElement(o.rows ? 'textarea' : 'input');
    if (!o.rows) { inp.type = 'text'; inp.className = 'txt-in'; } else inp.rows = o.rows;
    inp.id = this._id(id);
    lab.htmlFor = inp.id;
    inp.value = o.value || '';
    if (o.placeholder) inp.placeholder = o.placeholder;
    this.p[id] = inp.value;
    inp.addEventListener('input', () => { this.p[id] = inp.value; if (o.onInput) o.onInput(inp.value); this.changed(id); });
    row.append(lab, inp);
    this._parent().append(row);
    const api = { el: row, input: inp, get: () => this.p[id], set: (v, silent) => { this.p[id] = v; inp.value = v; if (!silent) this.changed(id); } };
    this.ctl[id] = api;
    return api;
  };
  /* Bloque HTML dentro del escenario (debajo de los lienzos) */
  S.html = function (cls) {
    const d = el('div', 'sim-html' + (cls ? ' ' + cls : ''));
    this.stageCol.append(d);
    return d;
  };
  /* Fila de cifras grandes encima de los lienzos. items = [[id, rótulo]] */
  S.bignums = function (items) {
    const box = el('div', 'bignums');
    const map = {};
    for (const [id, label] of items) {
      const d = el('div');
      const b = el('b', null, '—');
      d.append(el('small', null, label), b);
      box.append(d);
      map[id] = b;
    }
    this.stageCol.prepend(box);
    return { set: (id, html, cls) => { map[id].innerHTML = html; map[id].className = cls || ''; }, el: box };
  };
  /* Tabla HTML simple para lecturas: rows = [[...celdas]], head = [...] */
  RC.table = function (head, rows) {
    const h = head ? '<thead><tr>' + head.map((x) => `<th>${x}</th>`).join('') + '</tr></thead>' : '';
    return `<table class="sim-tab">${h}<tbody>` + rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  };
  /* Chip de semáforo: nivel 'ok' | 'mid' | 'bad' */
  RC.chip = (txt, nivel) => `<span class="chip ${nivel}">${txt}</span>`;

  /* Cuestionario de opción múltiple dentro de una simulación (sin lienzo).
     qs = [{q, opts: [...], ok: índice correcto, fb: explicación}] */
  RC.quiz = function (sim, qs, o = {}) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const box = sim.html('quiz');
    const score = el('div', 'score');
    const answered = new Array(qs.length).fill(null);
    const prevTxt = () => { const q = o.id && RC.track ? RC.track.quiz(o.id) : null; return q ? ` · su mejor resultado guardado: ${q.mejor} de ${q.n}` : ''; };
    const upd = (fin) => {
      const n = answered.filter((a) => a !== null).length, ok = answered.filter((a) => a === true).length;
      if (fin && n === qs.length && o.id && RC.track) RC.track.setQuiz(o.id, ok, qs.length);
      score.textContent = n ? `Respondidas ${n} de ${qs.length} · correctas ${ok}` + (n === qs.length && o.final ? ' · ' + o.final(ok, qs.length) : '') + (n === qs.length ? prevTxt() : '') : 'Elija una opción en cada pregunta.' + prevTxt();
    };
    if (o.shuffle) qs = qs.map((item, qi) => {
      /* permutación reproducible de las opciones, para que la respuesta correcta no quede siempre en el mismo lugar */
      const rng = RC.L.rng(31 * qi + 7), idx = item.opts.map((_, k) => k);
      for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
      return Object.assign({}, item, { opts: idx.map((k) => item.opts[k]), ok: idx.indexOf(item.ok) });
    });
    qs.forEach((item, qi) => {
      const d = el('div', 'q');
      d.append(el('b', null, `${qi + 1}. ${item.q}`));
      const ops = el('div', 'opts');
      const fb = el('div', 'fb');
      fb.hidden = true;
      item.opts.forEach((t, k) => {
        const b = el('button', null, t);
        b.type = 'button';
        b.addEventListener('click', () => {
          if (answered[qi] !== null) return;
          answered[qi] = k === item.ok;
          b.classList.add(k === item.ok ? 'right' : 'wrong');
          ops.children[item.ok].classList.add('right');
          fb.innerHTML = (k === item.ok ? '<b class="gain">Correcto.</b> ' : '<b class="loss">No es así.</b> ') + item.fb;
          fb.hidden = false;
          if (window.RC.typeset) window.RC.typeset(fb);
          upd(true);
        });
        ops.append(b);
      });
      d.append(ops, fb);
      box.append(d);
    });
    const again = el('button', 'btn', 'Volver a empezar');
    again.type = 'button';
    again.addEventListener('click', () => {
      answered.fill(null);
      box.querySelectorAll('.opts button').forEach((b) => b.classList.remove('right', 'wrong'));
      box.querySelectorAll('.fb').forEach((f) => { f.hidden = true; });
      upd();
    });
    const foot = el('div', 'ctrl-row');
    foot.append(score, again);
    foot.style.alignItems = 'center';
    foot.style.justifyContent = 'space-between';
    box.append(foot);
    upd();
    return box;
  };
})();
