/* Aplicación: navegación, cuaderno de datos, análisis por ensayo, preinforme, modelo, informe y exposición. */
(function () {
  'use strict';
  const E = window.TLEngine, B = window.TLBench, K = E.KIT;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const KEY = 'transformadores-lab-v2';
  const CREDIT = 'Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca';
  const IN_FRAME = !!(window.claude && typeof window.claude.use === 'function');
  const META_IDS = ['student', 'group', 'date', 'teacher', 'equipment', 'instruments'];
  const ANSWER_IDS = ['a1', 'a2', 'a3', 'a4', 'a5', 'conclusion'];
  const STAGE_NAMES = B.STAGES;
  const SRC = { banco: 'Banco virtual', real: 'Laboratorio real', modelo: 'Modelo' };
  let rows = [], nextId = 1, prelab = { answers: {}, checked: false, score: null };

  /* ---------- utilidades ---------- */
  let toastTimer;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4800); }
  const f = (x, d = 3) => Number.isFinite(x) ? x.toFixed(d) : '—';
  function sig(x, u) {
    if (!Number.isFinite(x)) return '—';
    if (!Number.isFinite(u) || u <= 0) return String(+x.toPrecision(4));
    const e = Math.floor(Math.log10(u)), d = Math.max(0, -(e - 1));
    return `${x.toFixed(d)} ± ${u.toFixed(d)}`;
  }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { if (a.length < 2) return NaN; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const coilName = (id) => id === 'cX' ? 'X' : id ? String(K.coils.find(c => c.id === id).N) : '?';
  const subs = (h) => String(h).replace(/(^|[^A-Za-z0-9])([RXZLPNk]′?)_(eq|c|m|L|Cu|Fe|X|exp)(?![A-Za-z0-9])/g, '$1$2<sub>$3</sub>');
  const fmtR = (R) => R >= 1000 ? (R / 1000) + ' kΩ' : String(R) + ' Ω';
  function doubleTap(btn, label, armedLabel, fn) {
    let armed = 0;
    btn.addEventListener('click', () => {
      if (Date.now() - armed > 3200) { armed = Date.now(); btn.textContent = armedLabel; setTimeout(() => { if (armed) btn.textContent = label; }, 3200); return; }
      armed = 0; btn.textContent = label; fn();
    });
  }

  /* ---------- guardado ---------- */
  function session() {
    const meta = {}; META_IDS.forEach(id => { meta[id] = $(id).value; });
    const ans = {}; ANSWER_IDS.forEach(id => { ans[id] = $(id).value; });
    return { format: 'transformadores-lab', version: 2, savedAt: new Date().toISOString(), bench: B.getState(), log: B.getLog(), rows, nextId, meta, answers: ans, prelab };
  }
  let saveT;
  function saveLocal() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      let ok = true; try { localStorage.setItem(KEY, JSON.stringify(session())); } catch (e) { ok = false; }
      const s = $('storageStatus'); if (s) s.textContent = ok ? 'Se guarda automáticamente en este navegador. Descarga una copia de la sesión para continuar en otro equipo o entregarla.' : 'Este navegador no permite el guardado automático. Descarga la sesión antes de cerrar.';
    }, 300);
  }
  function validate(s) {
    if (!s || s.format !== 'transformadores-lab') throw Error('El archivo no es una sesión de esta práctica.');
    if (s.version === 1) return migrate(s);
    if (s.version !== 2 || !Array.isArray(s.rows) || s.rows.length > 5000) throw Error('Versión de sesión no reconocida.');
    for (const r of s.rows) {
      if (!r || !Number.isInteger(r.id) || !['banco', 'real', 'modelo'].includes(r.source) || !STAGE_NAMES[r.stage] || typeof r.m !== 'object' || !r.cfg) throw Error('Hay un registro dañado en el archivo.');
      for (const [k, v] of Object.entries(r.m)) {
        if (k === 'R' || k === 'otras') { if (!Array.isArray(v)) throw Error('Registro de resistencias inválido.'); continue; }
        if (!v || !Number.isFinite(v.v)) throw Error('Hay una lectura inválida en el registro ' + r.id + '.');
      }
    }
    return s;
  }
  function migrate(s) {
    const out = { format: 'transformadores-lab', version: 2, rows: [], nextId: 1, meta: {}, answers: {}, prelab: { answers: {}, checked: false, score: null }, bench: null, log: [] };
    (s.rows || []).forEach((r, i) => {
      const m = {}; const put = (k, v) => { if (Number.isFinite(v)) m[k] = { v, u: 0, inst: 'v1' }; };
      put('V1', r.v1); put('V2', r.v2); put('I1', r.i1); put('I2', r.i2); if (r.pin !== null) put('P1', r.pin); if (r.v20 !== null) put('V20', r.v20);
      out.rows.push({ id: i + 1, source: r.source === 'lab' ? 'real' : 'modelo', stage: { A: 'A', B: 'B', C: 'D', Libre: 'L' }[r.stage] || 'L', time: r.time, cfg: { n1: r.n1, n2: r.n2, kNom: r.kNom, sec: r.open ? 'vacío' : 'carga', RL: r.rl, yoke: 'apretado' }, m, note: (r.note || '') + ' (importado de la versión 1)' });
    });
    out.nextId = out.rows.length + 1;
    const mm = s.meta || {}; out.meta = { student: mm.student, group: mm.group, date: mm.date, equipment: mm.equipment, instruments: mm.instruments };
    out.answers = { conclusion: mm.conclusion || '' };
    return out;
  }
  function restore(s) {
    rows = s.rows.map(r => ({ ...r })); nextId = Math.max(s.nextId || 1, ...rows.map(r => r.id + 1), 1);
    META_IDS.forEach(id => { if (s.meta && s.meta[id] !== undefined) $(id).value = s.meta[id] || ''; });
    ANSWER_IDS.forEach(id => { $(id).value = (s.answers && s.answers[id]) || ''; });
    prelab = s.prelab && s.prelab.answers ? s.prelab : { answers: {}, checked: false, score: null };
    if (s.bench) B.setState(s.bench);
    if (s.log) B.setLog(s.log);
    renderPrelab(); renderData(); syncStage();
  }
  async function saveFile(name, content) {
    if (IN_FRAME) {
      let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
      if (dl) {
        try { await dl.save({ filename: name, data: content }); toast('Archivo entregado: ' + name); }
        catch (e) { toast(e && e.code === 'declined' ? 'Descarga cancelada.' : 'No se pudo descargar el archivo en esta vista.'); }
        return;
      }
      showCopy(name, content); return;
    }
    const ext = name.split('.').pop(), type = { csv: 'text/csv;charset=utf-8', json: 'application/json', html: 'text/html;charset=utf-8' }[ext] || 'text/plain';
    const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Descarga preparada: ' + name);
  }
  function showCopy(name, content) {
    $('copyName').textContent = name; $('copyText').value = content; $('copyBox').hidden = false; $('copyText').focus(); $('copyText').select();
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  /* ---------- navegación ---------- */
  const TABS = ['banco', 'guia', 'teoria', 'cuaderno', 'exposicion'];
  function navigate() {
    const key = location.hash.slice(1), tab = TABS.includes(key) ? key : 'banco';
    document.querySelectorAll('.tab').forEach(el => { el.hidden = el.id !== tab; });
    document.querySelectorAll('.nav a').forEach(a => { if (a.hash === '#' + tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (tab === 'cuaderno') renderData();
    if (tab === 'exposicion') buildSlides();
    if (tab === 'teoria') renderModel();
    if (tab === 'banco') B.refresh();
    window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0);
  }

  /* ---------- registro desde el banco ---------- */
  function syncStage() { const s = B.stage(); $('recStage').textContent = STAGE_NAMES[s]; }
  function record() {
    const cap = B.capture(); if (!cap) return;
    const stage = B.stage(), keys = Object.keys(cap.m);
    if (!cap.cfg.on && stage !== 'R') { toast('La fuente está apagada o sin fusible: no hay nada que anotar todavía.'); return; }
    if (stage === 'R' && cap.cfg.on) { toast('Las resistencias de devanado se miden con la fuente apagada.'); return; }
    if (!keys.length) { toast('Ningún instrumento tiene una magnitud asignada. Revisa la columna «Registra».'); return; }
    if (rows.length >= 5000) { toast('Se alcanzó el límite de 5000 datos. Descarga la sesión y empieza otra.'); return; }
    const an = B.analyze();
    if (cap.m.R && an) cap.m.R.forEach(r => { r.coil = guessCoil(r, an); });
    const row = { id: nextId++, source: 'banco', stage, time: new Date().toISOString(), cfg: cap.cfg, m: cap.m, inst: cap.inst, note: $('recNote').value.trim() };
    rows.push(row); $('recNote').value = '';
    saveLocal();
    const parts = ['V1', 'V2', 'I1', 'I2', 'P1'].filter(k => row.m[k]).map(k => `${B.ROLE_TXT[k]} ${row.m[k].v.toPrecision(4)}`);
    $('recLast').textContent = `Dato ${row.id} · ${STAGE_NAMES[stage]} · ${parts.join(' · ') || (row.m.R ? 'R = ' + row.m.R.map(r => r.v.toFixed(2) + ' Ω').join(', ') : '')}`;
    toast(`Dato ${row.id} anotado en el cuaderno.`);
  }
  function guessCoil(r, an) {
    const cands = [an.prim, an.sec].filter(Boolean);
    let best = null, bd = 1e9;
    for (const w of cands) { const d = Math.abs(w.R - (r.v - K.dmm.lead)); if (d < bd) { bd = d; best = w; } }
    return best ? best.coil.id : null;
  }

  /* ---------- magnitudes derivadas ---------- */
  function val(r, k) { return r.m[k] ? r.m[k].v : null; }
  function unc(r, k) { return r.m[k] ? (r.m[k].u || 0) : 0; }
  function derive(r) {
    const V1 = val(r, 'V1'), V2 = val(r, 'V2'), I1 = val(r, 'I1'), I2 = val(r, 'I2'), P1 = val(r, 'P1');
    const c = r.cfg, d = {};
    d.kRef = c.n1 && c.n2 ? c.n2 / c.n1 : (c.kNom || null);
    if (V1 > 0 && V2 !== null) { d.kExp = V2 / V1; d.uk = d.kExp * Math.hypot(unc(r, 'V2') / (V2 || 1), unc(r, 'V1') / V1); }
    if (d.kRef && d.kExp !== undefined) d.dev = 100 * (d.kExp - d.kRef) / d.kRef;
    if (V1 !== null && I1 !== null) d.S1 = V1 * I1;
    if (P1 !== null && d.S1 > 0) d.pf = P1 / d.S1;
    if (c.sec === 'carga' && V2 !== null && I2 !== null) { d.P2 = V2 * I2; d.uP2 = d.P2 * Math.hypot(unc(r, 'V2') / (V2 || 1), unc(r, 'I2') / (I2 || 1)); }
    if (d.P2 !== undefined && P1 > 0) { d.eta = 100 * d.P2 / P1; d.ueta = d.eta * Math.hypot((d.uP2 || 0) / (d.P2 || 1), unc(r, 'P1') / P1); }
    if (c.sec === 'vacío' && V1 > 0 && I1 > 0) {
      if (P1 !== null && P1 > 0) { d.Rc = V1 * V1 / P1; const Q = Math.sqrt(Math.max(d.S1 * d.S1 - P1 * P1, 0)); d.Xm = Q > 0 ? V1 * V1 / Q : null; d.Ife = P1 / V1; d.Imu = Q / V1; }
    }
    if (c.sec === 'corto' && V1 > 0 && I1 > 0) {
      d.Zeq = V1 / I1; d.uZ = d.Zeq * Math.hypot(unc(r, 'V1') / V1, unc(r, 'I1') / I1);
      if (P1 !== null) { d.Req = P1 / (I1 * I1); d.Xeq = Math.sqrt(Math.max(d.Zeq ** 2 - d.Req ** 2, 0)); }
      if (I2 > 0) d.iRatio = I1 / I2;
    }
    if (c.sec === 'carga') {
      let V20 = val(r, 'V20');
      if (V20 === null && V1 > 0) {
        const ref = rows.filter(x => x.cfg.sec === 'vacío' && x.source === r.source && x.cfg.coilP === c.coilP && x.cfg.coilS === c.coilS && x.cfg.yoke === c.yoke && val(x, 'V1') > 0 && val(x, 'V2') !== null && Math.abs(val(x, 'V1') / V1 - 1) < 0.05)
          .sort((a, b) => Math.abs(val(a, 'V1') - V1) - Math.abs(val(b, 'V1') - V1))[0];
        if (ref) { V20 = val(ref, 'V2') * V1 / val(ref, 'V1'); d.V20from = ref.id; }
      }
      if (V20 !== null && V2 > 0) { d.V20 = V20; d.reg = 100 * (V20 - V2) / V2; }
    }
    return d;
  }

  /* ---------- gráficas SVG ---------- */
  function ticks(min, max, n) {
    const span = max - min || 1, step0 = span / n, mag = 10 ** Math.floor(Math.log10(step0)), r = step0 / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(+v.toPrecision(10));
    return out;
  }
  function chartSVG(o) {
    const W = o.w || 560, H = o.h || 320, L = 62, R = 18, T = 26, Bm = 46, w = W - L - R, h = H - T - Bm;
    const all = o.series.flatMap(s => s.pts), lp = (o.lines || []).flatMap(l => l.pts);
    const xs = all.map(p => p.x + (p.ux || 0)).concat(lp.map(p => p[0])), ys = all.map(p => p.y + (p.uy || 0)).concat(lp.map(p => p[1]));
    const ysMin = all.map(p => p.y - (p.uy || 0)).concat(lp.map(p => p[1]));
    let x0 = o.xmin ?? 0, x1 = o.xmax ?? (xs.length ? Math.max(...xs) * 1.08 : 1), y0 = o.ymin ?? 0, y1 = o.ymax ?? (ys.length ? Math.max(...ys) * 1.1 : 1);
    if (o.yZoom && all.length) { const lo = Math.min(...ysMin), hi = Math.max(...ys), pad = Math.max((hi - lo) * 0.25, hi * 0.01); y0 = Math.max(0, lo - pad); y1 = hi + pad; }
    if (!(x1 > x0)) x1 = x0 + 1; if (!(y1 > y0)) y1 = y0 + 1;
    const X = (v) => L + w * (v - x0) / (x1 - x0), Y = (v) => T + h * (1 - (v - y0) / (y1 - y0));
    let g = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.title || o.y.label + ' frente a ' + o.x.label)}">`;
    const tx = ticks(x0, x1, W < 420 ? 4 : 6), ty = ticks(y0, y1, 5);
    const lab = (v) => Math.abs(v) >= 1e4 ? v.toExponential(1) : String(+v.toPrecision(4));
    tx.forEach(v => { g += `<path d="M${X(v).toFixed(1)} ${T}V${T + h}" class="c-grid"/><text x="${X(v).toFixed(1)}" y="${T + h + 18}" text-anchor="middle" class="c-tick">${lab(v)}</text>`; });
    ty.forEach(v => { g += `<path d="M${L} ${Y(v).toFixed(1)}H${L + w}" class="c-grid"/><text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" class="c-tick">${lab(v)}</text>`; });
    g += `<rect x="${L}" y="${T}" width="${w}" height="${h}" class="c-frame"/><text x="${L}" y="${T - 10}" class="c-lab">${esc(o.y.label)}</text><text x="${L + w}" y="${H - 6}" text-anchor="end" class="c-lab">${esc(o.x.label)}</text>`;
    g += `<defs><clipPath id="clip${o.id || 'c'}"><rect x="${L}" y="${T}" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#clip${o.id || 'c'})">`;
    (o.lines || []).forEach(l => { if (l.pts.length > 1) g += `<path d="${l.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('')}" class="${l.cls}" fill="none"/>`; });
    o.series.forEach(s => s.pts.forEach(p => {
      const x = X(p.x), y = Y(p.y);
      if (p.uy) g += `<path d="M${x.toFixed(1)} ${Y(p.y - p.uy).toFixed(1)}V${Y(p.y + p.uy).toFixed(1)}M${(x - 4).toFixed(1)} ${Y(p.y - p.uy).toFixed(1)}h8M${(x - 4).toFixed(1)} ${Y(p.y + p.uy).toFixed(1)}h8" class="c-err ${s.cls}"/>`;
      if (p.ux) g += `<path d="M${X(p.x - p.ux).toFixed(1)} ${y.toFixed(1)}H${X(p.x + p.ux).toFixed(1)}" class="c-err ${s.cls}"/>`;
      const t = p.t ? `<title>${esc(p.t)}</title>` : '';
      g += s.shape === 'diamond' ? `<path d="M${x} ${y - 6}L${x + 6} ${y}L${x} ${y + 6}L${x - 6} ${y}Z" class="c-pt ${s.cls}">${t}</path>` : s.shape === 'square' ? `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" class="c-pt ${s.cls}">${t}</rect>` : `<circle cx="${x}" cy="${y}" r="5" class="c-pt ${s.cls}">${t}</circle>`;
    }));
    g += '</g>';
    if (!all.length) g += `<text x="${L + w / 2}" y="${T + h / 2}" text-anchor="middle" class="c-tick">Aún no hay datos para esta gráfica</text>`;
    return g + '</svg>';
  }
  const SHAPE = { banco: ['s-banco', 'circle'], real: ['s-real', 'diamond'], modelo: ['s-modelo', 'square'] };
  function bySource(list, fn) {
    return Object.keys(SHAPE).map(src => ({ cls: SHAPE[src][0], shape: SHAPE[src][1], pts: list.filter(r => r.source === src).map(fn).filter(Boolean) })).filter(s => s.pts.length);
  }
  const LEGEND = `<div class="legend"><span><i class="lg s-banco"></i>Banco virtual</span><span><i class="lg lg-d s-real"></i>Laboratorio real</span><span><i class="lg lg-s s-modelo"></i>Modelo</span></div>`;

  /* ---------- análisis por ensayo ---------- */
  function fitOrigin(pts) {
    const ws = pts.map(p => 1 / Math.max(p.uy * p.uy, 1e-12));
    const useW = pts.every(p => p.uy > 0);
    let Sxx = 0, Sxy = 0;
    pts.forEach((p, i) => { const w = useW ? ws[i] : 1; Sxx += w * p.x * p.x; Sxy += w * p.x * p.y; });
    const m = Sxy / Sxx;
    let u;
    if (useW) u = 1 / Math.sqrt(Sxx);
    if (!useW || pts.length > 2) { const res = pts.reduce((s, p) => s + (p.y - m * p.x) ** 2, 0); const us = pts.length > 1 ? Math.sqrt(res / (pts.length - 1) / pts.reduce((s, p) => s + p.x * p.x, 0)) : NaN; u = useW ? Math.max(u, us || 0) : us; }
    return { m, u };
  }
  function analyzeStage(stage, rs) {
    const list = rs.filter(r => r.stage === stage);
    const out = { stage, n: list.length, html: '', chart: '', key: '', notes: [] };
    if (stage === 'A') {
      const pts = list.map(r => ({ r, d: derive(r) })).filter(p => p.d.kExp !== undefined);
      const known = pts.filter(p => p.d.kRef);
      out.chart = chartSVG({ id: 'A', x: { label: 'N₂/N₁ (o k nominal)' }, y: { label: 'V₂/V₁ medido' }, title: 'Relación de tensiones frente a relación de espiras',
        series: bySource(known.map(p => p.r), r => { const d = derive(r); return { x: d.kRef, y: d.kExp, uy: d.uk, t: `#${r.id} · k = ${f(d.kExp, 4)}` }; }),
        lines: known.length ? [{ cls: 'l-ideal', pts: [[0, 0], [Math.max(...known.map(p => p.d.kRef)) * 1.1, Math.max(...known.map(p => p.d.kRef)) * 1.1]] }] : [] });
      if (known.length >= 2) { const ft = fitOrigin(known.map(p => ({ x: p.d.kRef, y: p.d.kExp, uy: p.d.uk || 0 }))); out.fit = ft; out.key = `Pendiente de V₂/V₁ frente a N₂/N₁: ${sig(ft.m, ft.u)} (ideal: 1).`; }
      const xs = pts.filter(p => p.r.cfg.coilS === 'cX' || p.r.cfg.coilP === 'cX').map(p => {
        const c = p.r.cfg; let N, u;
        if (c.coilS === 'cX' && c.n1) { N = c.n1 * p.d.kExp; u = c.n1 * (p.d.uk || 0); }
        else if (c.coilP === 'cX' && c.n2) { N = c.n2 / p.d.kExp; u = c.n2 * (p.d.uk || 0) / p.d.kExp ** 2; }
        return N ? { N, u, id: p.r.id } : null;
      }).filter(Boolean);
      if (xs.length) { const Nm = mean(xs.map(x => x.N)), uN = Math.max(Math.sqrt(mean(xs.map(x => x.u * x.u))), sd(xs.map(x => x.N)) / Math.sqrt(xs.length) || 0); out.Nx = { N: Nm, u: uN, n: xs.length }; out.key += ` Bobina X: N = ${sig(Nm, uN)} espiras (${xs.length} medida${xs.length > 1 ? 's' : ''}).`; }
      out.html = table(['#', 'Origen', 'N₁ / N₂', 'Yugo', 'V₁ (V)', 'V₂ (V)', 'k ref.', 'V₂/V₁', 'δ (%)'], pts.map(p => [p.r.id, SRC[p.r.source], `${coilName(p.r.cfg.coilP) || p.r.cfg.n1} / ${coilName(p.r.cfg.coilS) || p.r.cfg.n2}`, p.r.cfg.yoke || '—', meas(p.r, 'V1'), meas(p.r, 'V2'), f(p.d.kRef, 4), sig(p.d.kExp, p.d.uk), f(p.d.dev, 2)]));
    }
    if (stage === 'B') {
      const pts = list.map(r => ({ r, d: derive(r) })).filter(p => val(p.r, 'V1') !== null && val(p.r, 'I1') !== null);
      out.chart = chartSVG({ id: 'B', x: { label: 'V₁ (V)' }, y: { label: 'I₀ (mA)' }, title: 'Corriente de vacío frente a tensión',
        series: bySource(pts.map(p => p.r).filter(r => (r.cfg.yoke || 'apretado') === 'apretado'), r => ({ x: val(r, 'V1'), y: 1000 * val(r, 'I1'), uy: 1000 * unc(r, 'I1'), t: `#${r.id}` })) });
      const tight = pts.filter(p => p.r.cfg.yoke === 'apretado' && p.d.Rc).sort((a, b) => Math.abs(val(a.r, 'V1') - 12) - Math.abs(val(b.r, 'V1') - 12));
      if (tight.length) { const p = tight[0]; out.exc = { Rc: p.d.Rc, Xm: p.d.Xm, V1: val(p.r, 'V1'), coilP: p.r.cfg.coilP, I0: val(p.r, 'I1'), P0: val(p.r, 'P1') }; out.key = `Con yugo apretado y V₁ = ${f(val(p.r, 'V1'), 2)} V: I₀ = ${f(1000 * val(p.r, 'I1'), 1)} mA, P₀ = ${f(val(p.r, 'P1'), 3)} W, R_c ≈ ${f(p.d.Rc, 0)} Ω y X_m ≈ ${f(p.d.Xm, 0)} Ω (referidos a la bobina de ${coilName(p.r.cfg.coilP)} espiras).`; }
      const yk = [...new Set(pts.map(p => p.r.cfg.yoke))]; if (yk.length > 1) out.notes.push('La gráfica usa solo los datos con yugo apretado. Los datos con yugo flojo o retirado están en la tabla: compáralos a la misma V₁.');
      out.html = table(['#', 'Origen', 'Yugo', 'V₁ (V)', 'I₀ (mA)', 'P₀ (W)', 'V₂ (V)', 'cos φ₀', 'R_c (Ω)', 'X_m (Ω)'], pts.map(p => [p.r.id, SRC[p.r.source], p.r.cfg.yoke || '—', meas(p.r, 'V1'), p.r.m.I1 ? sig(1000 * val(p.r, 'I1'), 1000 * unc(p.r, 'I1')) : '—', meas(p.r, 'P1'), meas(p.r, 'V2'), f(p.d.pf, 3), f(p.d.Rc, 0), f(p.d.Xm, 0)]));
    }
    if (stage === 'C') {
      const pts = list.map(r => ({ r, d: derive(r) })).filter(p => p.d.Zeq);
      out.chart = chartSVG({ id: 'C', x: { label: 'I₁ (A)' }, y: { label: 'V₁ (V)' }, title: 'Tensión de cortocircuito frente a corriente',
        series: bySource(pts.map(p => p.r), r => ({ x: val(r, 'I1'), y: val(r, 'V1'), uy: unc(r, 'V1'), t: `#${r.id}` })),
        lines: pts.length ? [{ cls: 'l-pred', pts: [[0, 0], [Math.max(...pts.map(p => val(p.r, 'I1'))) * 1.1, Math.max(...pts.map(p => val(p.r, 'I1'))) * 1.1 * mean(pts.map(p => p.d.Zeq))]] }] : [] });
      if (pts.length) {
        const Z = pts.map(p => p.d.Zeq), Rr = pts.map(p => p.d.Req).filter(Number.isFinite), Xx = pts.map(p => p.d.Xeq).filter(Number.isFinite);
        out.eq = { Zeq: mean(Z), Req: Rr.length ? mean(Rr) : null, Xeq: Xx.length ? mean(Xx) : null, coilP: pts[0].r.cfg.coilP, coilS: pts[0].r.cfg.coilS, n1: pts[0].r.cfg.n1, n2: pts[0].r.cfg.n2 };
        out.key = `Referido al primario: Z_eq = ${sig(mean(Z), Math.max(mean(pts.map(p => p.d.uZ || 0)), Z.length > 1 ? sd(Z) / Math.sqrt(Z.length) : 0))} Ω` + (Rr.length ? `, R_eq = ${f(mean(Rr), 2)} Ω y X_eq = ${f(mean(Xx), 2)} Ω.` : '. Sin P₁ no se separan R_eq y X_eq.');
        const Rdc = rs.filter(r => r.stage === 'R' && r.m.R).flatMap(r => r.m.R);
        const r1 = Rdc.filter(x => x.coil === out.eq.coilP).map(x => x.v - K.dmm.lead), r2 = Rdc.filter(x => x.coil === out.eq.coilS).map(x => x.v - K.dmm.lead);
        if (r1.length && r2.length && out.eq.n1 && out.eq.n2 && out.eq.Req) { const Rcc = mean(r1) + mean(r2) * (out.eq.n1 / out.eq.n2) ** 2; out.key += ` Con el óhmetro: R₁ + (N₁/N₂)²R₂ = ${f(Rcc, 2)} Ω.`; out.Rdc = Rcc; }
      }
      out.html = table(['#', 'Origen', 'N₁ / N₂', 'V₁ (V)', 'I₁ (A)', 'I₂ (A)', 'P₁ (W)', 'Z_eq (Ω)', 'R_eq (Ω)', 'X_eq (Ω)', 'I₁/I₂'], pts.map(p => [p.r.id, SRC[p.r.source], `${coilName(p.r.cfg.coilP)} / ${coilName(p.r.cfg.coilS)}`, meas(p.r, 'V1'), meas(p.r, 'I1'), meas(p.r, 'I2'), meas(p.r, 'P1'), sig(p.d.Zeq, p.d.uZ), f(p.d.Req, 2), f(p.d.Xeq, 2), f(p.d.iRatio, 3)]));
    }
    if (stage === 'D') {
      const pts = list.map(r => ({ r, d: derive(r) })).filter(p => p.r.cfg.sec === 'carga' && val(p.r, 'V2') !== null && val(p.r, 'I2') !== null);
      const lines = [];
      const eq = analyzeStage('C', rs).eq, exc = analyzeStage('B', rs).exc;
      if (eq && eq.Req !== null && pts.length) {
        const p0 = pts[0].r, n1 = p0.cfg.n1, n2 = p0.cfg.n2, V1 = val(p0, 'V1');
        if (n1 && n2 && eq.n1 === n1 && eq.n2 === n2) {
          const a = n1 / n2, curve = [];
          const iMax = Math.max(...pts.map(p => val(p.r, 'I2'))) * 1.25;
          for (let RL = 2; RL <= 4000; RL *= 1.08) { const Rp = RL * a * a, den = Math.hypot(eq.Req + Rp, eq.Xeq), I = V1 / den; if (I * a <= iMax) curve.push([I * a, I * Rp / a]); }
          curve.sort((x, y) => x[0] - y[0]); lines.push({ cls: 'l-pred', pts: curve }); out.pred = true;
          out.notes.push(`La curva es la predicción del circuito equivalente aproximado con R_eq y X_eq del ensayo C, para V₁ = ${f(V1, 2)} V.`);
        }
      }
      out.chart = chartSVG({ id: 'D', x: { label: 'I₂ (A)' }, y: { label: 'V₂ (V)' }, yZoom: true, title: 'Característica de carga',
        series: bySource(pts.map(p => p.r), r => ({ x: val(r, 'I2'), y: val(r, 'V2'), uy: unc(r, 'V2'), ux: unc(r, 'I2'), t: `#${r.id} · R_L ${r.cfg.RL ?? '?'} Ω` })), lines });
      const etas = pts.filter(p => Number.isFinite(p.d.eta));
      if (pts.length) out.key = `${pts.length} puntos con carga.` + (etas.length ? ` Eficiencia entre ${f(Math.min(...etas.map(p => p.d.eta)), 1)} % y ${f(Math.max(...etas.map(p => p.d.eta)), 1)} %.` : ' Sin P₁ no se calcula la eficiencia.') + (pts.some(p => Number.isFinite(p.d.reg)) ? ` Regulación máxima: ${f(Math.max(...pts.filter(p => Number.isFinite(p.d.reg)).map(p => p.d.reg)), 1)} %.` : '');
      out.html = table(['#', 'Origen', 'R_L (Ω)', 'V₁ (V)', 'V₂ (V)', 'I₁ (A)', 'I₂ (A)', 'P₁ (W)', 'P₂ (W)', 'η (%)', 'V₂₀ (V)', 'Reg (%)'], pts.map(p => [p.r.id, SRC[p.r.source], p.r.cfg.RL ?? '—', meas(p.r, 'V1'), meas(p.r, 'V2'), meas(p.r, 'I1'), meas(p.r, 'I2'), meas(p.r, 'P1'), sig(p.d.P2, p.d.uP2), sig(p.d.eta, p.d.ueta), f(p.d.V20, 3), f(p.d.reg, 2)]));
      out.etaPts = etas.map(p => ({ I2: val(p.r, 'I2'), eta: p.d.eta }));
    }
    if (stage === 'E') {
      const pts = list.filter(r => val(r, 'V1') && r.m.otras && r.m.otras.length);
      out.html = table(['#', 'N₁ / N₂', 'V₁ (V)', 'V entre bornes 1–1 (V)', 'V/V₁', '1 − k', '1 + k', 'Conexión'], pts.map(r => {
        const V1 = val(r, 'V1'), Vs = r.m.otras[0].v, k = r.cfg.n1 && r.cfg.n2 ? r.cfg.n2 / r.cfg.n1 : null, q = Vs / V1;
        const kind = k ? (Math.abs(q - (1 - k)) < Math.abs(q - (1 + k)) ? 'sustractiva: los bornes • tienen la misma polaridad' : 'aditiva: los bornes • tienen polaridad opuesta') : '—';
        return [r.id, `${coilName(r.cfg.coilP)} / ${coilName(r.cfg.coilS)}`, meas(r, 'V1'), sig(Vs, r.m.otras[0].u), f(q, 3), f(k !== null ? Math.abs(1 - k) : NaN, 3), f(k !== null ? 1 + k : NaN, 3), kind];
      }));
      if (pts.length) out.key = 'Compara V/V₁ con 1 − k (sustractiva) y 1 + k (aditiva) para identificar la polaridad.';
    }
    if (stage === 'R') {
      const ms = list.flatMap(r => (r.m.R || []).map(x => ({ ...x, id: r.id, source: r.source })));
      out.html = table(['#', 'Bobina', 'Lectura (Ω)', 'Sin cables de prueba (Ω)', 'Instrumento'], ms.map(x => [x.id, x.coil ? coilName(x.coil) + ' espiras' : '¿?', sig(x.v, x.u), f(x.v - K.dmm.lead, 2), x.inst]));
      if (ms.length) out.key = 'Resta la resistencia de los cables de prueba (une las puntas del óhmetro para medirla: ≈ 0,2 Ω).';
    }
    if (!out.n) out.key = '';
    return out;
  }
  function meas(r, k) { const m = r.m[k]; return m ? sig(m.v, m.u) : '—'; }
  function table(head, body) {
    if (!body.length) return '<p class="empty">Sin datos de este ensayo con los filtros actuales.</p>';
    return `<div class="table-wrap"><table><thead><tr>${head.map(h => `<th>${subs(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map((c, i) => `<td${i > 1 ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- cuaderno ---------- */
  function filtered() { const s = $('fSource').value, t = $('fStage').value; return rows.filter(r => (s === 'all' || r.source === s) && (t === 'all' || r.stage === t)); }
  function renderData() {
    const rs = filtered();
    $('rowCount').textContent = `${rs.length} de ${rows.length} datos`;
    $('emptyData').hidden = rs.length > 0; $('dataTable').hidden = !rs.length;
    $('rowsBody').innerHTML = rs.map(r => {
      const d = derive(r), c = r.cfg;
      const conf = `${c.n1 || c.n2 || c.coilP ? `${coilName(c.coilP) !== '?' ? coilName(c.coilP) : c.n1 ?? '?'} → ${coilName(c.coilS) !== '?' ? coilName(c.coilS) : c.n2 ?? '?'}` : c.kNom ? 'k nom. ' + c.kNom : '—'}<br>${c.sec || '—'}${c.RL ? ' · ' + fmtR(c.RL) : ''}${c.yoke && c.yoke !== 'apretado' ? ' · yugo ' + c.yoke : ''}`;
      const R = r.m.R ? r.m.R.map(x => `${x.v.toFixed(2)} Ω`).join('<br>') : '';
      return `<tr><td><b class="mono">${r.id}</b><br><span class="badge b-${r.source}">${SRC[r.source]}</span></td><td>${esc(r.stage)}</td><td class="small">${conf}</td>
        <td class="num">${meas(r, 'V1')}<br>${meas(r, 'V2')}</td><td class="num">${meas(r, 'I1')}<br>${meas(r, 'I2')}</td><td class="num">${meas(r, 'P1')}${R ? '<br>' + R : ''}</td>
        <td class="num">${f(d.kExp, 4)}</td><td class="num">${f(d.eta, 1)}</td><td class="small">${esc(r.note)}</td>
        <td class="no-print"><button class="btn small quiet" data-del="${r.id}" aria-label="Eliminar el dato ${r.id}">×</button></td></tr>`;
    }).join('');
    const stages = ['A', 'B', 'C', 'D', 'E', 'R'];
    $('stageCards').innerHTML = stages.map(s => {
      const a = analyzeStage(s, rs); if (!a.n) return '';
      return `<article class="panel stage-card"><header class="panel-head"><h3>${esc(STAGE_NAMES[s])}</h3><span class="count">${a.n} datos</span></header><div class="panel-pad">
        ${a.key ? `<p class="key">${subs(esc(a.key))}</p>` : ''}${a.notes.map(n => `<p class="small muted">${subs(esc(n))}</p>`).join('')}
        ${a.chart ? `<div class="chart-box">${a.chart}${LEGEND}</div>` : ''}${a.html}</div></article>`;
    }).join('') || '<p class="empty panel panel-pad">Anota lecturas en el banco o agrega mediciones reales: aquí aparecerá el análisis de cada ensayo.</p>';
  }

  /* ---------- medición real manual ---------- */
  function addReal(e) {
    e.preventDefault();
    const num = (id) => { const v = $(id).value.trim(); return v === '' ? null : Number(v.replace(',', '.')); };
    const stage = $('rStage').value, sec = $('rSec').value, nominal = $('rRef').value === 'nominal';
    const m = {}; let bad = null;
    [['V1', 'rV1'], ['V2', 'rV2'], ['I1', 'rI1'], ['I2', 'rI2'], ['P1', 'rP1'], ['V20', 'rV20']].forEach(([k, id]) => {
      const v = num(id), u = num(id + 'u');
      if (v === null) return; if (!Number.isFinite(v) || v < 0) { bad = `Revisa el valor de ${k}.`; return; }
      m[k] = { v, u: Number.isFinite(u) && u > 0 ? u : 0, inst: 'manual' };
    });
    const R = num('rR'); if (R !== null) m.R = [{ v: R + K.dmm.lead, u: 0, inst: 'manual', coil: null }];
    if (bad) { $('rErr').textContent = bad; return; }
    if (!Object.keys(m).length) { $('rErr').textContent = 'Escribe al menos una lectura.'; return; }
    if (stage !== 'R' && !m.V1) { $('rErr').textContent = 'V₁ es obligatoria en los ensayos A a E.'; return; }
    const cfg = { n1: nominal ? null : num('rN1'), n2: nominal ? null : num('rN2'), kNom: nominal ? num('rK') : null, sec, RL: sec === 'carga' ? num('rRL') : null, yoke: 'apretado' };
    if (!nominal && (!(cfg.n1 > 0) || !(cfg.n2 > 0))) { $('rErr').textContent = 'Escribe N₁ y N₂, o elige «relación nominal».'; return; }
    rows.push({ id: nextId++, source: 'real', stage, time: new Date().toISOString(), cfg, m, note: $('rNote').value.trim() });
    $('rErr').textContent = ''; ['rV1', 'rV2', 'rI1', 'rI2', 'rP1', 'rR', 'rNote'].forEach(id => { $(id).value = ''; });
    saveLocal(); renderData(); toast(`Medición real ${nextId - 1} guardada.`);
  }

  /* ---------- exportaciones ---------- */
  function csv() {
    const rs = filtered(); if (!rs.length) { toast('No hay datos visibles para exportar.'); return; }
    const head = ['id', 'origen', 'ensayo', 'bobina_primaria', 'bobina_secundaria', 'N1', 'N2', 'k_nominal', 'yugo', 'secundario', 'RL_ohm', 'V1_V', 'u_V1', 'V2_V', 'u_V2', 'I1_A', 'u_I1', 'I2_A', 'u_I2', 'P1_W', 'u_P1', 'R_CC_ohm', 'k_exp', 'eficiencia_pct', 'regulacion_pct', 'fecha', 'observacion'];
    const n = (v) => v === null || v === undefined || !Number.isFinite(v) ? '' : String(+v.toPrecision(10)).replace('.', ',');
    const t = (s) => { let x = String(s ?? ''); if (/^[\s]*[=+\-@]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; };
    const lines = [head.join(';')];
    rs.forEach(r => { const d = derive(r), c = r.cfg; lines.push([r.id, t(SRC[r.source]), t(r.stage), t(coilName(c.coilP)), t(coilName(c.coilS)), n(c.n1), n(c.n2), n(c.kNom), t(c.yoke), t(c.sec), n(c.RL), n(val(r, 'V1')), n(unc(r, 'V1')), n(val(r, 'V2')), n(unc(r, 'V2')), n(val(r, 'I1')), n(unc(r, 'I1')), n(val(r, 'I2')), n(unc(r, 'I2')), n(val(r, 'P1')), n(unc(r, 'P1')), t(r.m.R ? r.m.R.map(x => x.v.toFixed(3)).join(' / ') : ''), n(d.kExp), n(d.eta), n(d.reg), t(r.time), t(r.note)].join(';')); });
    saveFile(`Transformadores_datos_${stamp()}.csv`, '﻿' + lines.join('\r\n'));
  }
  const DOC_CSS = `body{font:14px/1.5 system-ui,"Segoe UI",sans-serif;color:#172638;margin:0;padding:28px;max-width:1000px;margin-inline:auto}h1,h2,h3{font-family:Georgia,serif;font-weight:400}h1{font-size:30px;margin:0 0 6px}h2{font-size:22px;margin:28px 0 8px;border-bottom:1px solid #d6dee6;padding-bottom:4px}table{border-collapse:collapse;width:100%;font-size:12px;margin:8px 0}th,td{border:1px solid #d6dee6;padding:5px 7px;text-align:left}th{background:#f4f6f9}.num{text-align:right;font-variant-numeric:tabular-nums}.muted{color:#536476}.key{background:#faeee5;border-left:3px solid #a65122;padding:8px 12px}.chart{width:100%;max-width:620px;height:auto}.c-grid{stroke:#e3e8ee}.c-frame{fill:none;stroke:#c3cdd8}.c-tick{font-size:11px;fill:#536476}.c-lab{font-size:12px;font-weight:600;fill:#172638}.c-pt.s-banco{fill:#245db5}.c-pt.s-real{fill:#fff;stroke:#187d6e;stroke-width:2}.c-pt.s-modelo{fill:#a65122}.c-err{stroke-width:1.2}.c-err.s-banco{stroke:#245db5}.c-err.s-real{stroke:#187d6e}.c-err.s-modelo{stroke:#a65122}.l-ideal{stroke:#7d8b99;stroke-dasharray:6 4;stroke-width:1.5}.l-pred{stroke:#a65122;stroke-width:2}.legend{display:flex;gap:14px;font-size:11px;color:#536476}.lg{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}.lg.s-banco{background:#245db5}.lg.s-real{background:#187d6e;border-radius:0;transform:rotate(45deg) scale(.8)}.lg.s-modelo{background:#a65122;border-radius:0}.ans{white-space:pre-wrap;border-left:2px solid #d6dee6;padding:4px 10px;min-height:40px}.foot{margin-top:30px;font-size:11px;color:#536476}@media print{body{padding:0}h2{break-after:avoid}.chart{max-width:520px}table{break-inside:auto}tr{break-inside:avoid}}`;
  function reportHTML() {
    const rs = filtered(), mt = {}; META_IDS.forEach(id => { mt[id] = $(id).value; });
    const log = B.getLog(), nS = log.filter(l => l.type === 'seguridad').length, nD = log.filter(l => l.type === 'daño').length;
    let h = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe · Transformadores</title><style>[hidden]{display:none!important}${DOC_CSS}</style></head><body>
      <p class="muted">Práctica de laboratorio · Transformadores monofásicos</p><h1>Informe de laboratorio</h1>
      <table><tr><th>Integrantes</th><td>${esc(mt.student)}</td><th>Grupo</th><td>${esc(mt.group)}</td></tr><tr><th>Fecha</th><td>${esc(mt.date)}</td><th>Docente</th><td>${esc(mt.teacher)}</td></tr><tr><th>Banco</th><td>${B.getState().bench}</td><th>Equipo</th><td>${esc(mt.equipment)}</td></tr></table>
      <p><b>Instrumentos y condiciones:</b> ${esc(mt.instruments) || '—'}</p>
      <p><b>Preinforme:</b> ${prelab.checked ? `${prelab.score} de ${PRELAB.length} respuestas correctas` : 'sin revisar'} · <b>Bitácora del banco:</b> ${nS} avisos de seguridad y ${nD} daños.</p>`;
    ['A', 'B', 'C', 'D', 'E', 'R'].forEach(s => { const a = analyzeStage(s, rs); if (!a.n) return; h += `<h2>${esc(STAGE_NAMES[s])}</h2>${a.key ? `<p class="key">${subs(esc(a.key))}</p>` : ''}${a.notes.map(n => `<p class="muted">${subs(esc(n))}</p>`).join('')}${a.chart && s !== 'R' && s !== 'E' ? a.chart + LEGEND : ''}${a.html}`; });
    h += '<h2>Análisis y conclusiones</h2>';
    QUESTIONS.forEach((q, i) => { h += `<p><b>${i + 1}. ${esc(q)}</b></p><div class="ans">${esc($(ANSWER_IDS[i]).value) || '—'}</div>`; });
    h += `<p><b>Conclusión.</b></p><div class="ans">${esc($('conclusion').value) || '—'}</div>`;
    if (log.length) h += `<h2>Bitácora del banco</h2><table><tr><th>Tiempo</th><th>Tipo</th><th>Evento</th></tr>${log.map(l => `<tr><td>${esc(l.t)}</td><td>${esc(l.type)}</td><td>${esc(l.msg)}</td></tr>`).join('')}</table>`;
    h += `<p class="foot">Datos del banco virtual: lecturas tal como las mostraron los instrumentos, con incertidumbre estándar tomada de su exactitud (distribución rectangular). ${esc(CREDIT)}.</p></body></html>`;
    return h;
  }

  /* ---------- preinforme ---------- */
  const PRELAB = [
    { q: 'Primario de 500 espiras, secundario de 250 espiras y V₁ = 12 V (RMS). ¿Cuánto vale V₂ en el modelo ideal, en voltios?', type: 'num', a: 6, tol: 0.02, hint: 'V₂ = V₁·N₂/N₁.' },
    { q: 'Con ese mismo transformador ideal y una carga de 22 Ω en el secundario, ¿cuánto vale I₁ en amperios?', type: 'num', a: 6 / 22 * 0.5, tol: 0.03, hint: 'I₂ = V₂/R_L e I₁ = (N₂/N₁)·I₂.' },
    { q: '¿Cómo se conecta un amperímetro?', type: 'mc', opts: ['En paralelo con la bobina', 'En serie con el elemento cuya corriente se mide', 'Entre un borne y la tierra', 'Da igual, si el selector está en A'], a: 1, hint: 'Su resistencia interna es casi cero.' },
    { q: 'Vas a medir una corriente que esperas de unos 150 mA con el multímetro del banco. ¿En qué borne va el cable rojo?', type: 'mc', opts: ['VΩ', 'mA (máx. 600 mA)', '10 A', 'COM'], a: 1, hint: 'Elige el borne cuyo máximo supera la corriente esperada con la mejor resolución.' },
    { q: 'Con 12 V en la bobina de 500 espiras a 60 Hz, ¿cuál es la densidad de flujo pico B̂ en el núcleo de 4,0 cm², en teslas?', type: 'num', a: Math.SQRT2 * 12 / (2 * Math.PI * 60 * 500 * 4e-4), tol: 0.04, hint: 'B̂ = √2·V/(2π f N A).' },
    { q: '¿Por qué el ensayo de cortocircuito se hace con tensión reducida?', type: 'mc', opts: ['Para que el núcleo se sature', 'Porque con la tensión nominal la corriente sería muchas veces la nominal', 'Para que el vatímetro marque más', 'Porque el secundario no admite tensión'], a: 1, hint: 'Con el secundario en corto, solo la impedancia de los devanados limita la corriente.' },
    { q: 'Un multímetro con exactitud ±(1,0 % + 3 dígitos) lee 5,682 V en el rango de 6 V (resolución 0,001 V). ¿Cuál es el límite de error en voltios?', type: 'num', a: 0.01 * 5.682 + 0.003, tol: 0.05, hint: '1 % de la lectura más 3 veces la resolución.' },
    { q: '¿Qué pasa si alimentas el primario con corriente continua?', type: 'mc', opts: ['V₂ es constante e igual a k·V₁', 'No se induce tensión en régimen permanente y la corriente solo la limita la resistencia del devanado', 'El transformador funciona igual con menos pérdidas', 'Se invierte la polaridad'], a: 1, hint: 'Faraday: solo un flujo variable induce fem.' }
  ];
  function renderPrelab() {
    $('prelabList').innerHTML = PRELAB.map((p, i) => {
      const a = prelab.answers[i], st = prelab.checked ? checkOne(p, a) : null;
      const fb = st === null ? '' : `<p class="fb ${st ? 'good' : 'bad'}">${st ? 'Correcto.' : 'Revisa: ' + esc(p.hint)}</p>`;
      const body = p.type === 'num' ? `<input type="text" inputmode="decimal" id="pl${i}" value="${esc(a ?? '')}" aria-label="Respuesta ${i + 1}" placeholder="Número">`
        : p.opts.map((o, k) => `<label class="check"><input type="radio" name="pl${i}" value="${k}" ${String(a) === String(k) ? 'checked' : ''}> ${esc(o)}</label>`).join('');
      return `<li><p>${esc(p.q)}</p>${body}${fb}</li>`;
    }).join('');
    $('prelabScore').textContent = prelab.checked ? `${prelab.score} de ${PRELAB.length} correctas` : '';
  }
  function checkOne(p, a) {
    if (a === undefined || a === null || a === '') return false;
    if (p.type === 'num') { const x = Number(String(a).replace(',', '.')); return Number.isFinite(x) && Math.abs(x - p.a) <= p.tol * Math.abs(p.a); }
    return Number(a) === p.a;
  }
  function readPrelab() {
    PRELAB.forEach((p, i) => {
      if (p.type === 'num') prelab.answers[i] = $('pl' + i).value.trim();
      else { const c = document.querySelector(`input[name="pl${i}"]:checked`); prelab.answers[i] = c ? c.value : ''; }
    });
  }

  /* ---------- modelo (predicción) ---------- */
  function renderModel() {
    const host = $('modelOut'); if (!host) return;
    const p = $('mP').value, s = $('mS').value, yoke = $('mY').value, V = Number($('mV').value) || 0, sec = $('mSec').value, RL = Number($('mRL').value);
    if (p === s) { host.innerHTML = '<p class="error-text">Elige bobinas distintas para el primario y el secundario.</p>'; return; }
    const cp = E.coilSpec(p), cs = E.coilSpec(s), core = E.coreParams(yoke);
    const c = { nNets: 4, f: K.f, core, elems: [{ k: 'V', a: 1, b: 0, E: [V, 0], r: 1e-6, l: 0 }], windings: [{ a: 1, b: 0, N: cp.N, R: cp.R, Ls: cp.N ** 2 * core.leak }, { a: 2, b: 3, N: cs.N, R: cs.R, Ls: cs.N ** 2 * core.leak }] };
    if (sec === 'carga') c.elems.push({ k: 'R', a: 2, b: 3, R: RL }); if (sec === 'corto') c.elems.push({ k: 'R', a: 2, b: 3, R: 0.012 });
    const r = E.solve(c), cOpen = { ...c, elems: c.elems.slice(0, 1) }, rOpen = E.solve(cOpen);
    const i1 = E.irmsW(r, 0), i2 = E.irmsW(r, 1), v2 = sec === 'vacío' ? E.vrms(r, 2, 3) : sec === 'corto' ? 0 : i2 * RL, v20 = E.vrms(rOpen, 2, 3);
    const pin = E.power(E.HS.map(h => E.vph(r, 1, 0, h)), E.HS.map(h => E.iW(r, 0, h))), pout = sec === 'carga' ? i2 * i2 * RL : 0;
    const k = cs.N / cp.N, i2i = sec === 'carga' ? V * k / RL : sec === 'corto' ? Infinity : 0, i1i = k * i2i;
    const pcu = i1 * i1 * cp.R + i2 * i2 * cs.R;
    const row = (lab, a, b, u) => `<tr><th scope="row">${lab}</th><td class="num">${a}</td><td class="num">${b}</td><td>${u}</td></tr>`;
    host.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Magnitud</th><th>Ideal</th><th>Con pérdidas</th><th>Unidad</th></tr></thead><tbody>
      ${row('V₂', f(V * k, 3), f(v2, 3), 'V')}${row('I₁', sec === 'corto' ? '∞' : f(i1i, 4), f(i1, 4), 'A')}${row('I₂', sec === 'corto' ? '∞' : f(i2i, 4), f(i2, 4), 'A')}
      ${row('P₁', sec === 'corto' ? '—' : f(V * i1i, 3), f(pin, 3), 'W')}${row('P₂', f(sec === 'carga' ? V * k * i2i : 0, 3), f(pout, 3), 'W')}
      ${row('Pérdidas en el cobre', '0', f(pcu, 3), 'W')}${row('Pérdidas en el núcleo', '0', f(r.Pfe, 3), 'W')}
      ${row('Eficiencia η', sec === 'carga' ? '100' : '—', sec === 'carga' && pin > 0 ? f(100 * pout / pin, 1) : '—', '%')}
      ${row('Regulación', '0', sec === 'carga' && v2 > 0 ? f(100 * (v20 - v2) / v2, 2) : '—', '%')}
      ${row('B̂ en el núcleo', f(Math.SQRT2 * V / (2 * Math.PI * K.f * cp.N * core.A), 3), f(r.B, 3), 'T')}</tbody></table></div>
      <p class="small muted">Relación k = N₂/N₁ = ${f(k, 3)}. ${r.sat > 0.02 ? `<b>El núcleo está saturado</b>: la permeancia efectiva bajó un ${f(100 * r.sat, 0)} % y la corriente de vacío deja de ser sinusoidal.` : 'El núcleo trabaja en la zona lineal.'} ${i1 > K.supply.fuseA ? '<b>Con la fuente del banco (3,15 A) se fundiría el fusible.</b>' : ''}${i1 > cp.Imax || i2 > cs.Imax ? ' <b>Se supera la corriente máxima de una bobina.</b>' : ''}</p>`;
    $('phasor').innerHTML = phasorSVG(r, c, sec, RL, cp, cs);
    lastModel = { stage: sec === 'vacío' ? 'B' : sec === 'corto' ? 'C' : 'D', cfg: { coilP: p, coilS: s, n1: cp.N, n2: cs.N, yoke, sec, RL: sec === 'carga' ? RL : null },
      m: { V1: { v: V, u: 0, inst: 'modelo' }, V2: { v: v2, u: 0, inst: 'modelo' }, I1: { v: i1, u: 0, inst: 'modelo' }, I2: { v: i2, u: 0, inst: 'modelo' }, P1: { v: pin, u: 0, inst: 'modelo' } } };
  }
  let lastModel = null;
  function recordModel() {
    if (!lastModel) return;
    rows.push({ id: nextId++, source: 'modelo', stage: lastModel.stage, time: new Date().toISOString(), cfg: { ...lastModel.cfg }, m: JSON.parse(JSON.stringify(lastModel.m)), note: 'predicción del modelo con pérdidas' });
    saveLocal(); toast(`Predicción anotada como dato ${nextId - 1} (ensayo ${lastModel.stage}).`);
  }
  function phasorSVG(r, c, sec, RL, cp, cs) {
    const s = r.sol[1], V1 = [Number($('mV').value) || 0, 0], I1 = s.Iw[0], E1 = [s.e[0] * cp.N, s.e[1] * cp.N], I2r = [s.Iw[1][0] * cs.N / cp.N, s.Iw[1][1] * cs.N / cp.N];
    const vmax = Math.max(Math.hypot(...V1), 1e-9), imax = Math.max(Math.hypot(...I1), Math.hypot(...I2r), 1e-9);
    const cx = 150, cy = 150, Rv = 120, Ri = 95;
    const arrow = (z, scale, cls, lab, dy) => { const x = cx + z[0] / scale, y = cy - z[1] / scale, a = Math.atan2(cy - y, x - cx), L = Math.hypot(x - cx, y - cy); if (L < 3) return ''; const hx = x - 9 * Math.cos(a - 0.4), hy = y + 9 * Math.sin(a - 0.4), kx = x - 9 * Math.cos(a + 0.4), ky = y + 9 * Math.sin(a + 0.4); return `<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}M${hx.toFixed(1)} ${hy.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${kx.toFixed(1)} ${ky.toFixed(1)}" class="${cls}" fill="none"/><text x="${(x + 4).toFixed(1)}" y="${(y + dy).toFixed(1)}" class="ph-lab">${lab}</text>`; };
    return `<svg viewBox="0 0 330 300" class="phasor" role="img" aria-label="Diagrama fasorial del primario"><path d="M20 150H300M150 20V280" class="c-grid"/>
      ${arrow(V1, vmax / Rv, 'ph-v', 'V₁', -10)}${arrow(E1, vmax / Rv, 'ph-e', 'E₁', 20)}${arrow(I1, imax / Ri, 'ph-i', 'I₁', 18)}${sec !== 'vacío' ? arrow([-I2r[0], -I2r[1]], imax / Ri, 'ph-i2', 'I₂′', -12) : ''}
      <text x="20" y="40" class="c-tick">φ₁ = ${f(Math.atan2(-I1[1], I1[0]) * 180 / Math.PI, 1)}° (I₁ atrasada respecto a V₁)</text>
      <text x="20" y="292" class="c-tick">Tensiones a escala de V₁ · corrientes a otra escala</text></svg>`;
  }

  /* ---------- exposición (diapositivas) ---------- */
  let slides = [], cur = 0;
  function buildSlides() {
    const rs = rows, mt = {}; META_IDS.forEach(id => { mt[id] = $(id).value; });
    const st = B.getState(), log = B.getLog();
    const A = analyzeStage('A', rs), Bs = analyzeStage('B', rs), C = analyzeStage('C', rs), D = analyzeStage('D', rs), Rr = analyzeStage('R', rs), Es = analyzeStage('E', rs);
    const names = (mt.student || 'Integrantes del grupo').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    const S = [];
    S.push({ cls: 'title', html: `<p class="sl-eyebrow">Práctica de laboratorio · Física</p><h1>Transformadores monofásicos: del modelo ideal al banco</h1><p class="sl-names">${names.map(esc).join(' · ')}</p><p class="sl-meta">${esc(mt.group || 'Grupo')} · ${esc(mt.date || '')} · Banco ${st.bench}</p><p class="sl-credit">Guía de la práctica: ${esc(CREDIT)}</p>`,
      notes: 'Presenten al grupo y digan en una frase qué querían averiguar. Un minuto como máximo.' });
    S.push({ html: `<p class="sl-eyebrow">Pregunta</p><h2>¿Qué tan cerca está un transformador real del ideal?</h2><div class="sl-two"><div><h3>Lo que predice el modelo ideal</h3><ul><li>V₂/V₁ = N₂/N₁</li><li>I₁/I₂ = N₂/N₁</li><li>P₁ = P₂ (sin pérdidas)</li></ul></div><div><h3>Nuestra predicción</h3><p>Primario de 500 y secundario de 250 espiras a 12 V: V₂ = ${prelab.answers[0] ? esc(prelab.answers[0]) : '___'} V. Con 22 Ω: I₁ = ${prelab.answers[1] ? esc(prelab.answers[1]) : '___'} A.</p><p class="sl-small">Preinforme: ${prelab.checked ? prelab.score + ' de ' + PRELAB.length + ' correctas' : 'sin revisar'}.</p></div></div>`,
      notes: 'Expliquen la ley de Faraday en dos frases y por qué el modelo ideal no puede ser exacto: resistencia de los devanados, flujo de dispersión y pérdidas en el núcleo.' });
    S.push({ html: `<p class="sl-eyebrow">Montaje</p><h2>El banco y cómo lo conectamos</h2><div class="sl-two wide-l"><div class="sl-bench">${B.snapshotSVG().replace(/id="([^"]+)"/g, 'id="sn-$1"').replace(/url\(#([^)]+)\)/g, 'url(#sn-$1)').replace(/ tabindex="0"/g, '')}</div><div><ul class="sl-small"><li>Fuente de CA aislada 0–24 V, 3 A, fusible 3,15 A.</li><li>Transformador desmontable: núcleo de 20 × 20 mm, bobinas de 100, 250, 500 y 1000 espiras y una sin rótulo.</li><li>Amperímetros en serie, voltímetros en paralelo, analizador para P₁.</li><li>Multímetros TRMS de 6000 cuentas: ±(1,0 % + 3 d) en V~.</li></ul></div></div>`,
      notes: 'Señalen en la imagen dónde va cada instrumento y por qué. Mencionen la regla de la mano libre y encender con la perilla en cero.' });
    if (A.n) S.push({ html: `<p class="sl-eyebrow">Ensayo A · vacío</p><h2>La relación de tensiones sigue a la de espiras</h2><div class="sl-two wide-l"><div>${A.chart}</div><div><p class="sl-key">${subs(esc(A.key))}</p><p class="sl-small">Cada punto lleva barras de incertidumbre calculadas con la exactitud de los multímetros.</p></div></div>`, notes: 'Comenten si la pendiente es compatible con 1 dentro de la incertidumbre y cómo encontraron las espiras de la bobina X.' });
    if (Bs.n) S.push({ html: `<p class="sl-eyebrow">Ensayo B · vacío</p><h2>Sin carga, el primario igual consume</h2><div class="sl-two wide-l"><div>${Bs.chart}</div><div><p class="sl-key">${subs(esc(Bs.key || 'Midan P₀ con el analizador para separar R_c y X_m.'))}</p><p class="sl-small">I₀ magnetiza el núcleo; P₀ son casi todo pérdidas en el hierro.</p></div></div>`, notes: 'Si aflojaron o retiraron el yugo, muestren cuánto subió I₀ y relaciónenlo con la reluctancia del entrehierro.' });
    if (C.n) S.push({ html: `<p class="sl-eyebrow">Ensayo C · cortocircuito</p><h2>Unos pocos voltios bastan para la corriente nominal</h2><div class="sl-two wide-l"><div>${C.chart}</div><div><p class="sl-key">${subs(esc(C.key))}</p></div></div>`, notes: 'Expliquen por qué se hace a tensión reducida y por qué en este ensayo casi no hay pérdidas en el núcleo.' });
    if (Bs.exc || C.eq) S.push({ html: `<p class="sl-eyebrow">Modelo</p><h2>Circuito equivalente referido al primario</h2>${eqCircuitSVG(C.eq, Bs.exc)}<p class="sl-small">Valores obtenidos de nuestros ensayos B y C.</p>`, notes: 'Recorran el circuito: rama serie (cobre y dispersión) y rama paralela (magnetización y pérdidas en el hierro).' });
    if (D.n) S.push({ html: `<p class="sl-eyebrow">Ensayo D · carga</p><h2>Con carga, V₂ cae y aparecen las pérdidas</h2><div class="sl-two wide-l"><div>${D.chart}</div><div><p class="sl-key">${subs(esc(D.key))}</p>${D.pred ? '<p class="sl-small">Línea: predicción del circuito equivalente. Puntos: lo medido.</p>' : ''}</div></div>`, notes: 'Comparen la predicción con la medición. ¿Dónde se separan y por qué?' });
    if (Es.n || Rr.n) S.push({ html: `<p class="sl-eyebrow">Ensayos complementarios</p><h2>Polaridad y resistencia de los devanados</h2><div class="sl-small">${Es.n ? Es.html : ''}${Rr.n ? Rr.html : ''}</div>`, notes: 'Expliquen qué significan los puntos de polaridad y para qué sirve conocerlos.' });
    const safety = log.filter(l => l.type === 'seguridad' || l.type === 'daño');
    S.push({ html: `<p class="sl-eyebrow">Seguridad</p><h2>Lo que aprendimos de nuestros errores</h2>${safety.length ? `<ul class="sl-small">${safety.slice(0, 6).map(l => `<li><span class="mono">${esc(l.t)}</span> ${esc(l.msg)}</li>`).join('')}</ul><p class="sl-small">${safety.length} eventos en la bitácora del banco.</p>` : '<p>La bitácora del banco no registró incidentes de seguridad.</p>'}`, notes: 'Cuenten un error y cómo lo evitarían en el laboratorio real. Esto también se evalúa.' });
    const concl = $('conclusion').value.split(/\n+/).map(s => s.trim()).filter(Boolean);
    S.push({ html: `<p class="sl-eyebrow">Conclusiones</p><h2>Qué podemos afirmar con nuestros datos</h2>${concl.length ? `<ul>${concl.slice(0, 6).map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '<p class="sl-small">Escriban las conclusiones en el cuaderno (una por línea) y aparecerán aquí.</p>'}`, notes: 'Cada conclusión debe citar un número medido con su incertidumbre.' });
    S.push({ cls: 'title', html: `<h1>Preguntas</h1><p class="sl-names">${names.map(esc).join(' · ')}</p><p class="sl-credit">${esc(CREDIT)}</p>`, notes: 'Prepárense para explicar cualquier punto de las gráficas.' });
    slides = S; cur = Math.min(cur, S.length - 1); showSlide();
  }
  function eqCircuitSVG(eq, exc) {
    const v = (x, d = 1) => Number.isFinite(x) ? x.toFixed(d) + ' Ω' : '¿?';
    const sb = (t) => `<tspan baseline-shift="sub" font-size="75%">${t}</tspan>`;
    return `<svg viewBox="0 0 800 250" class="eqc" role="img" aria-label="Circuito equivalente referido al primario">
      <path d="M40 60H120M200 60H280M360 60H690M40 210H690M40 60V210M690 60V100M690 170V210M450 60V95M450 175V210M560 60V95M560 175V210" class="eq-w"/>
      <rect x="120" y="48" width="80" height="24" class="eq-r"/><path d="M280 60c8-16 16-16 20 0c4-16 12-16 20 0c4-16 12-16 20 0c4-16 12-16 20 0" class="eq-l"/>
      <rect x="438" y="95" width="24" height="80" class="eq-r"/><path d="M560 95c-16 8-16 16 0 20c-16 4-16 12 0 20c-16 4-16 12 0 20c-16 4-16 12 0 20" class="eq-l"/>
      <rect x="678" y="100" width="24" height="70" class="eq-r"/>
      <text x="160" y="36" text-anchor="middle" class="eq-t">R${sb('eq')} = ${eq ? v(eq.Req, 2) : '¿?'}</text><text x="320" y="36" text-anchor="middle" class="eq-t">X${sb('eq')} = ${eq ? v(eq.Xeq, 2) : '¿?'}</text>
      <text x="426" y="140" text-anchor="end" class="eq-t">R${sb('c')} = ${exc ? v(exc.Rc, 0) : '¿?'}</text><text x="578" y="140" class="eq-t">X${sb('m')} = ${exc ? v(exc.Xm, 0) : '¿?'}</text>
      <text x="714" y="140" class="eq-t">R′${sb('L')}</text><text x="30" y="140" text-anchor="end" class="eq-t">V₁</text></svg>`;
  }
  function showSlide() {
    const s = slides[cur]; if (!s) return;
    $('slide').className = 'slide' + (s.cls ? ' ' + s.cls : '');
    $('slide').innerHTML = s.html;
    $('slideNotes').textContent = s.notes || '';
    $('slideNum').textContent = `${cur + 1} / ${slides.length}`;
    $('prevSlide').disabled = cur === 0; $('nextSlide').disabled = cur === slides.length - 1;
    fitSlide();
  }
  function fitSlide() { const stg = $('stage'), box = $('stageBox'); if (!stg || !box.clientWidth) return; const sc = box.clientWidth / 1280; stg.style.transform = `scale(${sc})`; box.style.height = (720 * sc) + 'px'; }
  function slidesHTML() {
    const css = $('slideCss').textContent;
    const body = slides.map((s, i) => `<section class="slide${s.cls ? ' ' + s.cls : ''}" data-i="${i}" ${i ? 'hidden' : ''}>${s.html}<aside class="notes">${esc(s.notes || '')}</aside></section>`).join('');
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Exposición · Transformadores</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"><style>[hidden]{display:none!important}
      html,body{margin:0;height:100%;background:#0d141c}body{display:grid;place-items:center;font:20px/1.45 system-ui,"Segoe UI",sans-serif}
      .deck{width:1280px;height:720px;transform-origin:center;position:relative}${css}
      .notes{display:none}.show-notes .notes{display:block;position:absolute;left:0;right:0;bottom:-130px;background:#1c2733;color:#dfe7ef;padding:10px 16px;font-size:16px}
      .bar{position:fixed;bottom:10px;right:14px;color:#9fb0c2;font:13px system-ui}</style></head><body><div class="deck" id="deck">${body}</div>
      <div class="bar">← → para avanzar · N notas · F pantalla completa</div>
      <script>(function(){var s=[].slice.call(document.querySelectorAll('.slide')),i=0,d=document.getElementById('deck');function fit(){var k=Math.min(innerWidth/1280,innerHeight/720)*0.96;d.style.transform='scale('+k+')'}function go(n){i=Math.max(0,Math.min(s.length-1,n));s.forEach(function(x,j){x.hidden=j!==i})}addEventListener('resize',fit);fit();addEventListener('keydown',function(e){if(['ArrowRight','PageDown',' '].indexOf(e.key)>=0)go(i+1);if(['ArrowLeft','PageUp'].indexOf(e.key)>=0)go(i-1);if(e.key==='n'||e.key==='N')document.body.classList.toggle('show-notes');if(e.key==='f'||e.key==='F'){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(function(){})}});addEventListener('click',function(e){go(e.clientX>innerWidth/2?i+1:i-1)})})();<\/script></body></html>`;
  }

  /* ---------- esquemas de conexión de la guía ---------- */
  function schem(kind) {
    const W = (d) => `<path d="${d}" class="sc-w"/>`;
    const src = (x, y) => `<circle cx="${x}" cy="${y}" r="20" class="sc-c"/><path d="M${x - 10} ${y}q5 -10 10 0t10 0" class="sc-w"/><text x="${x - 30}" y="${y + 5}" text-anchor="end" class="sc-t">Fuente</text>`;
    const met = (x, y, l) => `<circle cx="${x}" cy="${y}" r="15" class="sc-c"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="sc-m">${l}</text>`;
    const coil = (x, y1, y2, right) => { let d = `M${x} ${y1}`; const n = 5, h = (y2 - y1) / n; for (let i = 0; i < n; i++) d += `a${h / 2} ${h / 2} 0 0 ${right ? 0 : 1} 0 ${h}`; return `<path d="${d}" class="sc-w"/>`; };
    const res = (x, y1, y2) => `<rect x="${x - 8}" y="${y1}" width="16" height="${y2 - y1}" class="sc-c"/>`;
    const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" class="sc-dot"/>`;
    const tx = `${coil(300, 60, 160, false)}${coil(360, 60, 160, true)}<path d="M323 50V170M337 50V170" class="sc-core"/>${dot(290, 58)}${dot(370, 58)}<text x="300" y="190" text-anchor="middle" class="sc-t">N₁</text><text x="360" y="190" text-anchor="middle" class="sc-t">N₂</text>`;
    const wmBox = `<rect x="150" y="18" width="50" height="32" class="sc-c"/><text x="175" y="39" text-anchor="middle" class="sc-m">W</text>${W('M190 50V200')}`;
    const prim = (withW) => `${src(60, 110)}${W('M60 90V40H140')}${withW ? wmBox + W('M140 40H150M200 40H215') : W('M140 40H215')}${met(230, 40, 'A₁')}${W('M245 40H300V60M300 160V200H60V130')}${W('M265 40V95M265 125V200')}${met(265, 110, 'V₁')}`;
    let body = '', cap = '';
    if (kind === 'vacio') { body = prim(true) + tx + W('M360 60V40H470M360 160V200H470M440 40V95M440 125V200') + met(440, 110, 'V₂') + `<circle cx="490" cy="40" r="4" class="sc-c"/><circle cx="490" cy="200" r="4" class="sc-c"/>${W('M470 40H486M470 200H486')}<text x="500" y="124" class="sc-t">abierto</text>`; cap = 'Ensayos A y B: secundario abierto. A₁ mide I₀; W mide P₀.'; }
    if (kind === 'corto') { body = prim(true) + tx + W('M360 60V40H455M485 40H540V200H360V160') + met(470, 40, 'A₂'); cap = 'Ensayo C: el secundario se cierra solo a través de A₂ (borne 10 A). Empieza en 0 V.'; }
    if (kind === 'carga') { body = prim(true) + tx + W('M360 60V40H455M485 40H560V95M560 155V200H360V160M420 40V95M420 125V200') + met(470, 40, 'A₂') + met(420, 110, 'V₂') + res(560, 95, 155) + `<text x="578" y="130" class="sc-t">R<tspan baseline-shift="sub" font-size="75%">L</tspan></text>`; cap = 'Ensayo D: R_L y A₂ en serie; V₂ en los bornes de la bobina.'; }
    if (kind === 'polaridad') { body = prim(false) + tx + W('M300 160V200M360 160V215H300V200') + W('M300 60V30M360 60V30') + W('M300 30H310M350 30H360') + met(330, 22, 'V') + `<text x="380" y="210" class="sc-t">puente 2–2</text>`; cap = 'Ensayo E: une los bornes 2 de ambas bobinas y mide entre los bornes 1.'; }
    if (kind === 'ohm') { body = tx + W('M300 60V40H250M300 160V200H250M250 40V95M250 125V200') + met(250, 110, 'Ω') + W('M360 60V40H410M360 160V200H410M410 40V95M410 125V200') + met(410, 110, 'Ω'); cap = 'Ensayo R: fuente apagada y bobinas desconectadas de la fuente.'; }
    return `<figure class="schem"><svg viewBox="-40 0 640 225" role="img" aria-label="${esc(cap.replace(/_/g, ''))}">${body}</svg><figcaption>${subs(esc(cap))}</figcaption></figure>`;
  }

  /* ---------- clave del docente ---------- */
  function hash(s) { let h = 5381; for (const ch of s) h = ((h << 5) + h + ch.codePointAt(0)) | 0; return h >>> 0; }
  function teacher() {
    if (hash($('tKey').value.trim().toLowerCase()) !== 41273075) { $('tOut').innerHTML = '<p class="error-text">Clave incorrecta.</p>'; return; }
    let h = '<div class="table-wrap"><table><thead><tr><th>Banco</th><th>N de la bobina X</th><th>R de X (Ω)</th><th>Error del dial</th><th>Error del voltímetro de panel</th><th>Entrehierro (× nominal)</th><th>μr (× nominal)</th></tr></thead><tbody>';
    for (let b = 1; b <= 24; b++) { const v = E.benchVariant(b), cx = E.coilSpec('cX', v); h += `<tr><td>${b}</td><td class="num">${v.Nx}</td><td class="num">${cx.R.toFixed(2)}</td><td class="num">${(100 * v.dialErr).toFixed(1)} %</td><td class="num">${(100 * v.panelErr).toFixed(1)} %</td><td class="num">${v.gapF.toFixed(2)}</td><td class="num">${v.murF.toFixed(2)}</td></tr>`; }
    $('tOut').innerHTML = h + '</tbody></table></div>';
  }

  /* ---------- arranque ---------- */
  const QUESTIONS = [
    '¿Se cumple V₂/V₁ = N₂/N₁ en vacío? Usa la pendiente y su incertidumbre. ¿Cuántas espiras tiene la bobina X?',
    '¿Por qué el primario consume corriente y potencia en vacío? ¿Qué cambió al aflojar o retirar el yugo?',
    '¿Qué representan R_eq y X_eq del ensayo de cortocircuito? Compara R_eq con lo que mediste con el óhmetro.',
    'Con el circuito equivalente, predice V₂ con carga y compárala con lo medido. ¿Cómo varían η y la regulación al disminuir R_L?',
    '¿Qué incidentes registró la bitácora y cómo los evitarían en el laboratorio real?'
  ];
  function init() {
    $('date').value = new Date().toLocaleDateString('en-CA');
    $('qList').innerHTML = QUESTIONS.map((q, i) => `<div class="field"><label for="a${i + 1}">${i + 1}. ${esc(q)}</label><textarea id="a${i + 1}" maxlength="10000"></textarea></div>`).join('');
    document.querySelectorAll('[data-schem]').forEach(el => { el.innerHTML = schem(el.dataset.schem); });
    const coilOpts = K.coils.filter(c => c.id !== 'cX').map(c => `<option value="${c.id}">${c.N} espiras</option>`).join('');
    $('mP').innerHTML = coilOpts; $('mS').innerHTML = coilOpts; $('mP').value = 'c500'; $('mS').value = 'c250';
    $('mRL').innerHTML = K.loads.map(R => `<option value="${R}" ${R === 22 ? 'selected' : ''}>${fmtR(R)}</option>`).join('');
    ['mP', 'mS', 'mY', 'mV', 'mSec', 'mRL'].forEach(id => $(id).addEventListener('input', renderModel));
    $('mRecord').addEventListener('click', recordModel);
    $('coilTable').innerHTML = K.coils.filter(c => c.id !== 'cX').map(c => `<tr><td>${c.N}</td><td class="num">${String(c.Imax).replace('.', ',')} A</td><td class="num">≈ ${String(c.R).replace('.', ',')} Ω</td><td class="num">${(c.N * c.N * E.permeanceLin(E.coreParams('apretado')) * 1000).toFixed(c.N < 300 ? 1 : 0)} mH</td></tr>`).join('') + '<tr><td>X</td><td colspan="3" class="muted">sin rótulo: hay que averiguar N en el ensayo A</td></tr>';
    B.init({ toast, onChange: saveLocal, onStage: () => syncStage() });
    let s = null; try { const c = localStorage.getItem(KEY); if (c) s = validate(JSON.parse(c)); } catch (e) { s = null; }
    if (s) restore(s); else { renderPrelab(); renderData(); syncStage(); }
    $('btnRecord').addEventListener('click', record);
    $('stageSel').addEventListener('change', syncStage);
    META_IDS.concat(ANSWER_IDS).forEach(id => $(id).addEventListener('input', saveLocal));
    $('fSource').addEventListener('change', renderData); $('fStage').addEventListener('change', renderData);
    $('rowsBody').addEventListener('click', (e) => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = '¿Borrar?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = '×'; }, 3000); return; }
      rows = rows.filter(r => r.id !== +b.dataset.del); saveLocal(); renderData();
    });
    doubleTap($('clearData'), 'Borrar todos los datos', '¿Seguro? Toca de nuevo', () => { rows = []; nextId = 1; saveLocal(); renderData(); toast('Cuaderno vacío.'); });
    $('realForm').addEventListener('submit', addReal);
    $('rRef').addEventListener('change', () => { const nom = $('rRef').value === 'nominal'; $('rNWrap').hidden = nom; $('rKWrap').hidden = !nom; });
    $('rSec').addEventListener('change', () => { $('rRLWrap').hidden = $('rSec').value !== 'carga'; });
    $('exportCsv').addEventListener('click', csv);
    $('exportReport').addEventListener('click', () => saveFile(`Transformadores_informe_${stamp()}.html`, reportHTML()));
    const saveSession = () => saveFile(`Transformadores_sesion_${stamp()}.json`, JSON.stringify(session(), null, 1));
    $('saveSession').addEventListener('click', saveSession); $('saveSession2').addEventListener('click', saveSession);
    $('loadSession').addEventListener('click', () => $('sessionFile').click());
    $('sessionFile').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { if (file.size > 15e6) throw Error('El archivo es demasiado grande.'); const s2 = validate(JSON.parse(await file.text())); restore(s2); saveLocal(); toast(`Sesión abierta: ${rows.length} datos.`); }
      catch (err) { toast('No se pudo abrir: ' + err.message); } finally { e.target.value = ''; }
    });
    $('copyClose').addEventListener('click', () => { $('copyBox').hidden = true; });
    $('copyBtn').addEventListener('click', () => { const t = $('copyText'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('Copiado. Pégalo en un archivo de texto con el nombre indicado.'), () => toast('Selecciona el texto y cópialo con Ctrl+C.')); });
    $('checkPrelab').addEventListener('click', () => { readPrelab(); prelab.checked = true; prelab.score = PRELAB.filter((p, i) => checkOne(p, prelab.answers[i])).length; renderPrelab(); saveLocal(); toast(`Preinforme: ${prelab.score} de ${PRELAB.length} correctas.`); });
    $('prelabList').addEventListener('input', () => { readPrelab(); saveLocal(); });
    $('prevSlide').addEventListener('click', () => { cur--; showSlide(); }); $('nextSlide').addEventListener('click', () => { cur++; showSlide(); });
    $('notesBtn').addEventListener('click', () => { const n = $('slideNotes'); n.hidden = !n.hidden; $('notesBtn').setAttribute('aria-pressed', String(!n.hidden)); });
    $('fullBtn').addEventListener('click', () => { const el = $('stageBox'); (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => toast('Este navegador no permite pantalla completa aquí. Descarga la presentación.')); });
    document.addEventListener('fullscreenchange', () => setTimeout(fitSlide, 60));
    $('exportSlides').addEventListener('click', () => { buildSlides(); saveFile(`Transformadores_exposicion_${stamp()}.html`, slidesHTML()); });
    document.addEventListener('keydown', (e) => {
      if ($('exposicion').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (['ArrowRight', 'PageDown'].includes(e.key) && cur < slides.length - 1) { cur++; showSlide(); }
      if (['ArrowLeft', 'PageUp'].includes(e.key) && cur > 0) { cur--; showSlide(); }
    });
    window.addEventListener('resize', fitSlide);
    $('tBtn').addEventListener('click', teacher);
    if (IN_FRAME) document.querySelectorAll('.only-file').forEach(el => { el.hidden = true; });
    $('printGuide').addEventListener('click', () => { document.body.classList.add('print-guide'); window.print(); setTimeout(() => document.body.classList.remove('print-guide'), 1500); });
    window.addEventListener('hashchange', navigate);
    navigate();
    window.TransformerLab = Object.freeze({ engine: E, getData: () => JSON.parse(JSON.stringify(rows)), derive, analyzeStage });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
