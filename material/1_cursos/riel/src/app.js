/* Interfaz del laboratorio: controles, gráficas en tiempo real, fotocompuertas, resultados y sonido. */
(function () {
  'use strict';
  const E = window.RIEL, C = E.C;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const fmt = (n, d) => (n == null || !isFinite(n) ? '—' : n.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'));
  const COL1 = '#e4565e', COL2 = '#4c8be0';
  const st = { id: 'newton', P: null, sim: null, ideal: null, pausa: false, vel: 1, vv: true, va: false, auto: true, ghosts: [], hover: null, sound: false, acc: 0, sucio: true, evN: 0, tAuto: 0, ultimoLCD: '' };
  let escena = null, tokens = null, nTok = 0;

  /* ───────── tokens de color para los canvas ───────── */
  function leerTokens() {
    const cs = getComputedStyle(document.documentElement), g = (n) => cs.getPropertyValue(n).trim();
    tokens = { fondo: g('--plot'), ink: g('--ink'), mute: g('--mute'), linea: g('--line'), rejilla: g('--grid'), ideal: g('--ideal'), acento: g('--accent') };
  }

  /* ───────── gráficas ───────── */
  function paso(rango, n) {
    const raw = rango / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  function grafica(cv, o) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = o.W || cv.clientWidth, H = o.H || cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const K = o.K || tokens, fs = o.fs || 11;
    g.fillStyle = K.fondo; g.fillRect(0, 0, W, H);
    const ml = fs * 4.6, mr = 20, mt = fs * 1.9, mb = fs * 2.8, w = W - ml - mr, h = H - mt - mb;
    const X = (t) => ml + (t - o.t0) / (o.t1 - o.t0) * w, Y = (v) => mt + h - (v - o.y0) / (o.y1 - o.y0) * h;
    g.font = `500 ${fs}px "IBM Plex Mono", ui-monospace, monospace`; g.textBaseline = 'middle';
    // rejilla y ejes
    const sx = paso(o.t1 - o.t0, w / (fs * 6)), sy = paso(o.y1 - o.y0, h / (fs * 3.2));
    g.lineWidth = 1; g.strokeStyle = K.rejilla; g.fillStyle = K.mute;
    g.textAlign = 'center';
    for (let t = Math.ceil(o.t0 / sx) * sx; t <= o.t1 + 1e-9; t += sx) { const x = Math.round(X(t)) + 0.5; g.beginPath(); g.moveTo(x, mt); g.lineTo(x, mt + h); g.stroke(); g.fillText(fmt(t, sx < 1 ? 1 : 0), x, mt + h + fs * 1.1); }
    g.textAlign = 'right';
    for (let v = Math.ceil(o.y0 / sy) * sy; v <= o.y1 + 1e-9; v += sy) { const y = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(ml, y); g.lineTo(ml + w, y); g.stroke(); g.fillText(fmt(Math.abs(v) < 1e-9 ? 0 : v, sy < 1 ? (sy < 0.1 ? 2 : 1) : 0), ml - 6, y); }
    g.strokeStyle = K.mute; g.lineWidth = 1.2; g.strokeRect(ml + 0.5, mt + 0.5, w, h);
    if (o.y0 < 0 && o.y1 > 0) { g.strokeStyle = K.mute; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(ml, Y(0)); g.lineTo(ml + w, Y(0)); g.stroke(); g.setLineDash([]); }
    g.fillStyle = K.ink; g.textAlign = 'left'; g.font = `600 ${fs}px "Public Sans", system-ui, sans-serif`; g.fillText(o.titulo, ml, mt - fs * 0.95);
    g.textAlign = 'right'; g.fillStyle = K.mute; g.font = `500 ${fs}px "IBM Plex Mono", monospace`; g.fillText('t (s)', ml + w, mt + h + fs * 2.15);
    g.save(); g.beginPath(); g.rect(ml, mt, w, h); g.clip();
    const linea = (ts, ys, n, color, ancho, dash, alfa) => {
      if (!ts || n < 2) return; g.strokeStyle = color; g.lineWidth = ancho; g.globalAlpha = alfa == null ? 1 : alfa; g.setLineDash(dash || []); g.lineJoin = 'round';
      g.beginPath(); const salto = Math.max(1, Math.floor(n / (w * 1.2)));
      for (let i = 0; i < n; i += salto) { const x = X(ts[i]), y = Y(ys[i]); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      if ((n - 1) % salto) g.lineTo(X(ts[n - 1]), Y(ys[n - 1]));
      g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    };
    // corridas anteriores
    o.fantasmas.forEach((q, i) => linea(q.t, q.y, q.t.length, K.mute, 1.4, [], 0.45));
    // modelo ideal
    if (o.mostrarIdeal) o.ideal.forEach((y, i) => linea(o.idealT, y, y.length, K.ideal, 1.4, [5, 4], 0.95));
    // curvas medidas
    o.series.forEach((s) => linea(o.t, s.y, o.n, s.color, 2.2));
    // marcas verticales
    (o.vlineas || []).forEach((q) => { const x = X(q.t); g.strokeStyle = K.mute; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(x, mt); g.lineTo(x, mt + h); g.stroke(); g.setLineDash([]); g.fillStyle = K.mute; g.textAlign = 'left'; g.font = `500 ${fs * 0.9}px "IBM Plex Mono", monospace`; g.fillText(q.txt, x + 4, mt + fs * 0.9); });
    // puntos de las fotocompuertas
    (o.marcas || []).forEach((q) => { const x = X(q.t), y = Y(q.y); g.fillStyle = K.fondo; g.strokeStyle = q.color; g.lineWidth = 2; g.beginPath(); g.arc(x, y, fs * 0.42, 0, 7); g.fill(); g.stroke(); g.fillStyle = K.ink; g.textAlign = 'center'; g.font = `600 ${fs * 0.85}px "IBM Plex Mono", monospace`; g.fillText(q.txt, x, y - fs * 1.15); });
    // cabeza viva
    o.series.forEach((s) => { if (o.n > 0) { const x = X(o.t[o.n - 1]), y = Y(s.y[o.n - 1]); g.fillStyle = s.color; g.beginPath(); g.arc(x, y, fs * 0.38, 0, 7); g.fill(); g.strokeStyle = K.fondo; g.lineWidth = 1.5; g.stroke(); } });
    // cursor
    if (o.cursor != null && o.cursor >= o.t0 && o.cursor <= o.t1) { const x = X(o.cursor); g.strokeStyle = K.ink; g.globalAlpha = 0.5; g.setLineDash([]); g.beginPath(); g.moveTo(x, mt); g.lineTo(x, mt + h); g.stroke(); g.globalAlpha = 1; }
    g.restore();
    // leyenda
    g.textAlign = 'left'; g.font = `500 ${fs * 0.95}px "Public Sans", system-ui, sans-serif`;
    let lx = ml + w - 2, items = [];
    o.series.forEach((s) => items.push([s.color, s.nombre, false]));
    if (o.mostrarIdeal) items.push([K.ideal, 'modelo ideal', true]);
    o.fantasmas.slice(0, 3).forEach((q) => items.push([K.mute, q.etiqueta, false]));
    const anchos = items.map((q) => g.measureText(q[1]).width + 26); let tot = anchos.reduce((a, b) => a + b, 0), x = Math.max(ml + 90, lx - tot);
    if (o.leyenda !== false) items.forEach((q, i) => { g.strokeStyle = q[0]; g.lineWidth = 2.2; g.setLineDash(q[2] ? [4, 3] : []); g.beginPath(); g.moveTo(x, mt - fs * 0.95); g.lineTo(x + 16, mt - fs * 0.95); g.stroke(); g.setLineDash([]); g.fillStyle = K.mute; g.fillText(q[1], x + 20, mt - fs * 0.95); x += anchos[i]; });
    // lectura del cursor
    if (o.cursor != null && o.leer) {
      const lin = o.leer(o.cursor); if (lin) {
        g.font = `500 ${fs}px "IBM Plex Mono", monospace`; const wb = Math.max(...lin.map((s) => g.measureText(s).width)) + 14, hb = lin.length * fs * 1.35 + 8;
        let bx = X(o.cursor) + 10; if (bx + wb > ml + w) bx = X(o.cursor) - wb - 10; const by = mt + 6;
        g.fillStyle = K.fondo; g.globalAlpha = 0.94; g.fillRect(bx, by, wb, hb); g.globalAlpha = 1; g.strokeStyle = K.linea; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, wb, hb);
        g.fillStyle = K.ink; g.textAlign = 'left'; lin.forEach((s, i) => g.fillText(s, bx + 7, by + fs * 0.95 + i * fs * 1.35 + 3));
      }
    }
    return { ml, mr, mt, mb, w, h };
  }

  function opcionesGrafica(tipo, o2) {
    const s = st.sim, id = st.id, idl = st.ideal, M = E.MONTAJES.find((q) => q.id === id), P = st.P;
    const n = s.log.t.length, t = s.log.t;
    const tw = Math.max(4, Math.ceil((s.t + 0.6) / 2) * 2);
    const ng = s.g.length, cols = [COL1, COL2];
    const nombres = M.n === 2 ? ['carrito 1', 'carrito 2'] : ['carrito'];
    if (id === 'acoplados') { nombres[0] = 'carrito de atrás'; nombres[1] = 'carrito con polea'; }
    let y0, y1;
    if (tipo === 'x') {
      if (id === 'oscilador') { const A = P.A / 100 * 1.15; y0 = 1 - A; y1 = 1 + A; } else { y0 = 0; y1 = 2; }
    } else {
      let m = 0.4; for (let i = 0; i < ng; i++) for (let k = 0; k < n; k++) m = Math.max(m, Math.abs(s.log.v[i][k])); for (const q of st.ghosts) for (const v of q.vv) m = Math.max(m, Math.abs(v));
      const ref = (id === 'oscilador') ? E.teoria(id, P).vmax * 1.15 : 0; m = Math.max(m, ref);
      const pa = paso(m * 2, 4); y1 = Math.ceil(m * 1.08 / pa) * pa; y0 = (id === 'newton' || id === 'inclinado' || id === 'acoplados') && !s.log.v[0].some((v) => v < -0.01) && !st.ghosts.some((q) => q.vv.some((v) => v < -0.01)) ? 0 : -y1;
    }
    const serie = [];
    for (let i = 0; i < ng; i++) serie.push({ y: tipo === 'x' ? s.log.x[i] : s.log.v[i], color: cols[i], nombre: nombres[i] });
    const fant = st.ghosts.map((q) => ({ t: q.t, y: tipo === 'x' ? q.xx : q.vv, etiqueta: q.etiqueta }));
    const idealY = []; for (let i = 0; i < ng; i++) idealY.push(tipo === 'x' ? idl.log.x[i] : idl.log.v[i]);
    // marcas de fotocompuertas y sucesos
    const marcas = [], vl = [];
    for (const e of s.eventos) {
      const tm = (e.tin + e.tout) / 2;
      marcas.push({ t: tm, y: tipo === 'x' ? e.x : e.v, color: cols[e.glider], txt: 'G' + (e.gi + 1) });
    }
    if (s.hang && s.hang.tLand != null) vl.push({ t: s.hang.tLand, txt: 'cae la masa' });
    if (s.col) vl.push({ t: s.col.t, txt: 'choque' });
    if (s.expl) vl.push({ t: 0, txt: 'suelta' });
    const leer = (tc) => {
      const k = Math.max(0, Math.min(n - 1, Math.round(tc / C.ts))); if (n < 2 || k >= n) return null;
      const lin = [`t = ${fmt(t[k], 3)} s`];
      for (let i = 0; i < ng; i++) lin.push(`${ng > 1 ? 'x' + (i + 1) : 'x'} = ${fmt(s.log.x[i][k] * 100, 1)} cm`, `${ng > 1 ? 'v' + (i + 1) : 'v'} = ${fmt(s.log.v[i][k], 3)} m/s`);
      return lin;
    };
    return Object.assign({
      titulo: tipo === 'x' ? 'Posición x (m)' : 'Velocidad v (m/s)', t, n, t0: 0, t1: tw, y0, y1, series: serie, fantasmas: fant,
      ideal: idealY, idealT: idl.log.t, mostrarIdeal: true, marcas, vlineas: vl, cursor: st.hover, leer
    }, o2 || {});
  }

  function dibujarGraficas() {
    if (!st.sim) return;
    if (!tokens || (++nTok % 40 === 0)) leerTokens();
    grafica($('#gx'), opcionesGrafica('x'));
    grafica($('#gv'), opcionesGrafica('v'));
  }
  function dibujarLaptop() {
    if (!escena) return;
    const cv = escena.laptop(); if (!cv) return;
    const K = { fondo: '#0f1a22', ink: '#e8f1f5', mute: '#8aa0ac', linea: '#2b3f4b', rejilla: 'rgba(160,190,205,.16)', ideal: '#e9d18a', acento: '#35d0c4' };
    grafica(cv, Object.assign(opcionesGrafica('x', { W: 1024, H: 640, fs: 24, K, cursor: null, leer: null, leyenda: true, fantasmas: [] })));
    escena.laptopSucia();
  }

  /* ───────── corridas, reinicio ───────── */
  function etiquetaCorrida(P) {
    const id = st.id, f = (k) => `${P[k]} ${E.CTL[k].u}`;
    return { newton: 'm = ' + f('m'), acoplados: 'm = ' + f('m'), inclinado: 'θ = ' + P.th + '°', choque_el: `M₁ = ${P.M1} g`, choque_in: `M₁ = ${P.M1} g`, explosion: 'E = ' + f('E'), oscilador: 'k = ' + f('k') }[id];
  }
  function guardarFantasma() {
    const s = st.sim; if (!s || s.estado === 'listo' || s.log.t.length < 80) return;
    st.ghosts.unshift({ t: s.log.t.slice(), xx: s.log.x[0].slice(), vv: s.log.v[0].slice(), etiqueta: etiquetaCorrida(s.P) });
    st.ghosts.length = Math.min(st.ghosts.length, 3);
    actualizarBorrar();
  }
  function reiniciar(opts) {
    opts = opts || {};
    if (!opts.sinFantasma) guardarFantasma();
    st.sim = E.crear(st.id, st.P, { seed: 11 + Math.floor(Math.random() * 1000) });
    st.ideal = E.crear(st.id, st.P, { ideal: true });
    st.pausa = false; st.acc = 0; st.sucio = true; st.evN = 0; st.hover = null; st.ultimoLCD = '';
    escena.refrescarCarritos(st.P);
    setBtns(); tabla(); resultados(); lcd();
  }
  function soltar() {
    if (st.sim.estado === 'listo') { E.soltar(st.sim); E.soltar(st.ideal); st.pausa = false; audio.clic(); }
    else if (st.sim.estado === 'fin') { reiniciar(); soltar(); return; }
    setBtns();
  }

  /* ───────── interfaz ───────── */
  function construirMontajes() {
    const nav = $('#montajes');
    nav.innerHTML = E.MONTAJES.map((m) => `<button type="button" role="tab" class="chip" data-id="${m.id}"><b>${m.nombre}</b><small>${m.sub}</small></button>`).join('');
    nav.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) elegir(b.dataset.id); });
  }
  function elegir(id) {
    st.id = id; st.P = E.porDefecto(id); st.ghosts = [];
    $$('#montajes .chip').forEach((b) => { b.setAttribute('aria-selected', b.dataset.id === id); });
    const act = $('#montajes .chip[aria-selected="true"]'); if (act && act.scrollIntoView) { try { act.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { } }
    escena.setMontaje(id, st.P);
    controles(); reiniciar({ sinFantasma: true });
    $('#guia').textContent = E.MONTAJES.find((q) => q.id === id).guia;
    actualizarBorrar();
    escena.irA(id === 'oscilador' || id === 'inclinado' ? 'general' : 'general');
    st.vv = true; $('#tg-v').checked = true; $('#tg-a').checked = st.va;
  }
  function controles() {
    const M = E.MONTAJES.find((q) => q.id === st.id), cont = $('#controles'), cg = $('#compuertas-ctl');
    let h = '', hg = '';
    for (const k of M.ctl) {
      const c = E.CTL[k], v = st.P[k];
      if (c.compuerta) { hg += slider(k, c, v); continue; }
      if (c.bool) h += `<label class="sw"><input type="checkbox" id="c-${k}" data-k="${k}" ${v ? 'checked' : ''}><span class="sw-b"></span><span class="sw-t">${c.et}</span></label>`;
      else if (c.opciones) h += `<div class="row"><div class="lab"><span>${c.et}</span></div><div class="seg" role="group" aria-label="${c.et}">${c.opciones.map((o) => `<button type="button" data-k="${k}" data-v="${o}" aria-pressed="${o === v}">${fmt(o, o % 1 ? 1 : 0)} ${c.u}</button>`).join('')}</div></div>`;
      else h += slider(k, c, v, c.destacado);
    }
    cont.innerHTML = h; cg.innerHTML = hg;
    $$('input[type=range]', document).forEach(pintarRango);
  }
  function slider(k, c, v, grande) {
    return `<div class="row ${grande ? 'grande' : ''}"><div class="lab"><label for="c-${k}">${c.et}</label><output id="o-${k}" class="val">${fmt(v, c.step < 1 ? (c.step < 0.1 ? 2 : 1) : 0)} ${c.u}</output></div><input id="c-${k}" type="range" data-k="${k}" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}"></div>`;
  }
  function pintarRango(r) { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); }
  function cambioParam(k, v) {
    const c = E.CTL[k];
    st.P[k] = v;
    const o = $('#o-' + k); if (o) o.textContent = fmt(v, c.step < 1 ? (c.step < 0.1 ? 2 : 1) : 0) + ' ' + c.u;
    if (c.compuerta) {
      for (const s of [st.sim, st.ideal]) { const gt = s.gates.find((q) => q.key === k); if (gt) { gt.x = v / 100; gt.st.forEach((q, i) => { q.blq = Math.abs(s.g[i].x - gt.x) < s.flag / 2; }); } }
      st.sucio = true; return;
    }
    reiniciar();
    if (st.auto) { clearTimeout(st.tAuto); st.tAuto = setTimeout(() => { if (st.sim.estado === 'listo') soltar(); }, 650); }
  }
  function eventosUI() {
    const panel = $('.panel');
    panel.addEventListener('input', (e) => {
      const t = e.target; if (t.type === 'range') { pintarRango(t); cambioParam(t.dataset.k, +t.value); }
    });
    panel.addEventListener('change', (e) => { const t = e.target; if (t.type === 'checkbox' && t.dataset.k) cambioParam(t.dataset.k, t.checked); });
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('.seg button'); if (b) { $$('button', b.parentNode).forEach((x) => x.setAttribute('aria-pressed', x === b)); cambioParam(b.dataset.k, +b.dataset.v); }
    });
    $('#btn-soltar').addEventListener('click', soltar);
    $('#btn-pausa').addEventListener('click', () => { if (st.sim.estado === 'corriendo') { st.pausa = !st.pausa; setBtns(); } });
    $('#btn-reiniciar').addEventListener('click', () => { clearTimeout(st.tAuto); reiniciar(); });
    $$('#velocidad button').forEach((b) => b.addEventListener('click', () => { st.vel = +b.dataset.v; $$('#velocidad button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    $$('#camaras button').forEach((b) => b.addEventListener('click', () => { escena.irA(b.dataset.c); $$('#camaras button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    window.RIELUI = { alSoltarCamara: () => $$('#camaras button').forEach((x) => x.setAttribute('aria-pressed', 'false')) };
    $('#tg-v').addEventListener('change', (e) => { st.vv = e.target.checked; });
    $('#tg-a').addEventListener('change', (e) => { st.va = e.target.checked; });
    $('#tg-auto').addEventListener('change', (e) => { st.auto = e.target.checked; });
    $('#tg-snd').addEventListener('change', (e) => { st.sound = e.target.checked; audio.activar(st.sound); });
    $('#btn-borrar').addEventListener('click', () => { st.ghosts = []; actualizarBorrar(); st.sucio = true; });
    $('#btn-csv').addEventListener('click', copiarCSV);
    for (const id of ['gx', 'gv']) {
      const cv = $('#' + id);
      cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(), fs = 11, ml = fs * 4.6, w = r.width - ml - 20; const tw = Math.max(4, Math.ceil((st.sim.t + 0.6) / 2) * 2); st.hover = Math.max(0, Math.min(tw, (e.clientX - r.left - ml) / w * tw)); st.sucio = true; });
      cv.addEventListener('pointerleave', () => { st.hover = null; st.sucio = true; });
    }
    document.addEventListener('keydown', (e) => {
      const tg = e.target && e.target.matches ? e.target : document.body;
      if (tg.matches('input[type=range]') && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End')) return;
      if (e.code === 'Space' && !tg.matches('button, input')) { e.preventDefault(); if (st.sim.estado === 'listo') soltar(); else { st.pausa = !st.pausa; setBtns(); } }
      if (e.key === 'r' && !tg.matches('input')) { reiniciar(); }
    });
    escena.onGate = (i, cm) => {
      const k = 'g' + (i + 1), r = $('#c-' + k); const v = Math.round(cm);
      if (r) { r.value = v; pintarRango(r); } cambioParam(k, v);
    };
  }
  function setBtns() {
    const s = st.sim, bs = $('#btn-soltar'), bp = $('#btn-pausa');
    bs.disabled = s.estado === 'corriendo';
    bs.querySelector('span').textContent = s.estado === 'fin' ? 'Repetir' : 'Soltar';
    bp.disabled = s.estado !== 'corriendo'; bp.querySelector('span').textContent = st.pausa ? 'Seguir' : 'Pausa';
    const e = $('#estado'); e.dataset.e = s.estado === 'corriendo' ? (st.pausa ? 'pausa' : 'corre') : s.estado;
    e.textContent = { listo: 'Carrito sujeto', corre: 'En marcha', pausa: 'En pausa', fin: 'Registro lleno (20 s)' }[e.dataset.e];
  }
  function actualizarBorrar() { const b = $('#btn-borrar'); b.hidden = !st.ghosts.length; b.textContent = `Borrar ${st.ghosts.length} corrida${st.ghosts.length > 1 ? 's' : ''} anterior${st.ghosts.length > 1 ? 'es' : ''}`; }

  /* ───────── lecturas en pantalla ───────── */
  function lecturas() {
    const s = st.sim, q = s.g[0], q2 = s.g[1];
    const set = (id, v) => { const el = $(id); if (el.textContent !== v) el.textContent = v; };
    set('#r-t', fmt(s.t, 2)); set('#r-x', fmt(q.x * 100, 1)); set('#r-v', fmt(q.v, 3)); set('#r-a', fmt(s.acc ? s.acc[0] : 0, 2));
    $('#r2').hidden = !q2;
    if (q2) { set('#r-x2', fmt(q2.x * 100, 1)); set('#r-v2', fmt(q2.v, 3)); set('#r-a2', fmt(s.acc ? s.acc[1] : 0, 2)); }
  }
  function lcd() {
    const s = st.sim, ev = s.eventos, l = [];
    const prim = (g, c) => ev.find((e) => e.gi === g && e.glider === c);
    const e1 = prim(0, 0), e2 = prim(1, 0);
    l.push(e1 ? `G1 ${(e1.dt * 1000).toFixed(1)} ms` : 'G1  ---');
    l.push(e2 ? `G2 ${(e2.dt * 1000).toFixed(1)} ms` : 'G2  ---');
    l.push(e1 && e2 ? `T12 ${(e2.tin - e1.tin).toFixed(4)} s` : 'T12  ---');
    l.push(`t  ${s.t.toFixed(3)} s`);
    const k = l.join('|'); if (k !== st.ultimoLCD) { st.ultimoLCD = k; escena.lcd(l); }
  }
  function tabla() {
    const ev = st.sim.eventos, tb = $('#tb-ev');
    if (!ev.length) { tb.innerHTML = `<tr><td colspan="5" class="vacio">Sin lecturas. Las fotocompuertas registran el tiempo que la bandera tapa el haz.</td></tr>`; return; }
    tb.innerHTML = ev.slice(-12).map((e) => `<tr><td>G${e.gi + 1}</td><td><i class="pt" style="background:${e.glider ? COL2 : COL1}"></i>${st.sim.g.length > 1 ? e.glider + 1 : ''}</td><td>${fmt(e.tin, 3)}</td><td>${fmt(e.dt * 1000, 1)}</td><td>${fmt(e.v, 3)}</td></tr>`).join('');
  }
  function ajusteA(s, i, t0, t1) {
    const T = [], X = []; s.log.t.forEach((tt, k) => { if (tt >= t0 && tt <= t1) { T.push(tt); X.push(s.log.x[i][k]); } });
    if (T.length < 20) return null;
    let S = [0, 0, 0, 0, 0], B = [0, 0, 0];
    for (let k = 0; k < T.length; k++) { const u = T[k], x = X[k]; S[0]++; S[1] += u; S[2] += u * u; S[3] += u ** 3; S[4] += u ** 4; B[0] += x; B[1] += x * u; B[2] += x * u * u; }
    const m = [[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]];
    const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
    return 2 * det(m.map((r, i2) => r.map((v, j) => (j === 2 ? B[i2] : v)))) / det(m);
  }
  function fila(et, val, nota, cls) { return `<div class="res ${cls || ''}"><span>${et}</span><b>${val}</b>${nota ? `<small>${nota}</small>` : ''}</div>`; }
  function resultados() {
    const s = st.sim, id = st.id, P = st.P, th = E.teoria(id, P), ev = s.eventos, out = [];
    const porG = (g, c) => ev.filter((e) => e.gi === g && e.glider === c);
    if (id === 'newton' || id === 'acoplados' || id === 'inclinado') {
      out.push(fila('a teórica, ideal', fmt(th.aIdeal, 3) + ' m/s²', id === 'inclinado' ? 'g·sen θ' : 'm·g/(M+m), polea sin masa'));
      if (id !== 'inclinado') out.push(fila('a teórica, con polea', fmt(th.aPolea, 3) + ' m/s²', 'suma 6 g de inercia de la polea'));
      const e1 = porG(0, id === 'acoplados' ? 1 : 0)[0], e2 = porG(1, id === 'acoplados' ? 1 : 0)[0];
      if (e1 && e2) {
        const dx = e2.x - e1.x, a = (e2.v ** 2 - e1.v ** 2) / (2 * dx), a2 = (e2.v - e1.v) / (((e2.tin + e2.tout) - (e1.tin + e1.tout)) / 2);
        out.push(fila('a medida con las puertas', fmt(a, 3) + ' m/s²', `(v₂²−v₁²)/2Δx con v₁ = ${fmt(e1.v, 3)} y v₂ = ${fmt(e2.v, 3)} m/s`, 'dest'));
        out.push(fila('a por (v₂−v₁)/Δt', fmt(a2, 3) + ' m/s²', 'la velocidad es un promedio sobre la bandera'));
        out.push(fila('diferencia con la ideal', fmt((a - th.aIdeal) / th.aIdeal * 100, 1) + ' %', 'roce, polea, nivelación y turbulencia'));
      } else out.push(fila('a medida con las puertas', '—', 'suelta el carrito: tiene que pasar por G1 y G2'));
      if (s.hang && e2) { const xl = s.hang.x0 + s.hang.D; if (e2.x + s.flag / 2 > xl) out.push(fila('G2 queda después de la caída', `x > ${fmt(xl * 100, 0)} cm`, 'ahí la masa ya tocó la bandeja y la velocidad es constante: acerca G2 o aumenta la altura de caída', 'warn')); }
      const tl = s.hang && s.hang.tLand != null ? s.hang.tLand : null;
      const af = ajusteA(s, id === 'acoplados' ? 1 : 0, 0.08, tl || Math.min(s.t, 1.2));
      if (af != null) out.push(fila('a por ajuste de x(t)', fmt(af, 3) + ' m/s²', 'parábola de mínimos cuadrados mientras la masa cae'));
      if (th.T != null) out.push(fila(id === 'acoplados' ? 'tensión entre carritos' : 'tensión del hilo', fmt(th.T, 3) + ' N', id === 'acoplados' ? 'M_A·a' : 'M·m·g/(M+m)'));
      if (s.hang && s.hang.tLand != null) out.push(fila('la masa toca la bandeja', fmt(s.hang.tLand, 3) + ' s', 'el hilo se afloja: sigue con v constante'));
    } else if (id === 'choque_el' || id === 'choque_in') {
      const c = s.col, m1 = s.g[0].M, m2 = s.g[1].M, vi = ev.find((e) => e.glider === 0 && (!c || e.tin < c.t)), pos = (g) => ev.find((e) => e.glider === g && c && e.tin > c.t);
      const v1f = pos(0), v2f = pos(1);
      out.push(fila('v₁ antes del choque (G1)', vi ? fmt(vi.v, 3) + ' m/s' : '—', ''));
      if (c) {
        const w1 = v1f ? v1f.v : (id === 'choque_in' ? (v2f ? v2f.v : null) : null), w2 = v2f ? v2f.v : null;
        out.push(fila('v₁ después', w1 != null ? fmt(w1, 3) + ' m/s' : fmt(c.va2, 3) + ' m/s', v1f ? 'leída en una puerta' : (id === 'choque_in' ? 'pegados: igual que v₂' : 'valor exacto: no cruzó una puerta')));
        out.push(fila('v₂ después', w2 != null ? fmt(w2, 3) + ' m/s' : 'sin lectura', ''));
        const pA = m1 * c.va, pD = c.ma * c.va2 + c.mb * c.vb2, kA = 0.5 * m1 * c.va ** 2, kD = 0.5 * c.ma * c.va2 ** 2 + 0.5 * c.mb * c.vb2 ** 2;
        out.push(fila('ímpetu total antes → después', `${fmt(pA, 4)} → ${fmt(pD, 4)} kg·m/s`, 'valores exactos del simulador', 'dest'));
        out.push(fila('energía cinética antes → después', `${fmt(kA * 1000, 1)} → ${fmt(kD * 1000, 1)} mJ`, `se pierde el ${fmt((1 - kD / kA) * 100, 1)} %`));
        if (id === 'choque_el') out.push(fila('coeficiente de restitución', fmt(-(c.vb2 - c.va2) / (c.vb - c.va), 3), 'e = 1 sería un choque perfectamente elástico'));
      } else out.push(fila('choque', 'aún no ocurre', 'el carrito 2 está en reposo a 105 cm'));
    } else if (id === 'explosion') {
      const x = s.expl;
      if (x) {
        out.push(fila('ímpetu total', fmt(x.m1 * x.v1 + x.m2 * x.v2, 4) + ' kg·m/s', 'cero antes y cero después', 'dest'));
        out.push(fila('v₁ y v₂ al separarse', `${fmt(x.v1, 3)} y ${fmt(x.v2, 3)} m/s`, 'valores exactos'));
        out.push(fila('razón v₁/v₂', fmt(x.v1 / x.v2, 3), `−m₂/m₁ = ${fmt(-x.m2 / x.m1, 3)}`));
        out.push(fila('energía repartida', `${fmt(0.5 * x.m1 * x.v1 ** 2 * 1000, 1)} + ${fmt(0.5 * x.m2 * x.v2 ** 2 * 1000, 1)} mJ`, `suman ${fmt(x.E * 1000, 1)} mJ`));
      } else out.push(fila('resorte comprimido', fmt(P.E, 0) + ' mJ', 'suelta para liberarlo'));
    } else if (id === 'oscilador') {
      out.push(fila('período teórico', fmt(th.T, 3) + ' s', '2π√(M/2k)'));
      out.push(fila('v máxima teórica', fmt(th.vmax, 3) + ' m/s', 'ω·A'));
      const x = s.log.x[0], t = s.log.t, cr = [];
      for (let i = 1; i < x.length; i++) if (x[i - 1] < 1 && x[i] >= 1) cr.push(t[i - 1] + (1 - x[i - 1]) / (x[i] - x[i - 1]) * C.ts);
      if (cr.length >= 2) out.push(fila('período medido en x(t)', fmt((cr[cr.length - 1] - cr[0]) / (cr.length - 1), 3) + ' s', `${cr.length - 1} oscilaciones`, 'dest'));
      else out.push(fila('período medido en x(t)', '—', 'espera dos cruces por el centro'));
      const pv = ev.filter((e) => e.gi === 0); if (pv.length) out.push(fila('v en el centro (G1)', fmt(Math.abs(pv[pv.length - 1].v), 3) + ' m/s', 'cae un poco cada vuelta por el roce con el aire'));
    }
    $('#resultados').innerHTML = out.join('');
  }

  function copiarCSV() {
    const s = st.sim, f = (n, d) => n.toFixed(d).replace('.', ',');
    const lin = [`# Riel de aire · ${E.MONTAJES.find((q) => q.id === st.id).nombre}`, `# Parámetros: ${JSON.stringify(st.P)}`, 'puerta;carrito;t_entrada_s;dt_ms;v_m_s'];
    s.eventos.forEach((e) => lin.push(`G${e.gi + 1};${e.glider + 1};${f(e.tin, 4)};${f(e.dt * 1000, 1)};${f(e.v, 4)}`));
    lin.push('', 't_s;' + s.g.map((_, i) => `x${i + 1}_m;v${i + 1}_m_s`).join(';'));
    for (let k = 0; k < s.log.t.length; k += 4) lin.push(f(s.log.t[k], 3) + ';' + s.g.map((_, i) => f(s.log.x[i][k], 4) + ';' + f(s.log.v[i][k], 4)).join(';'));
    const txt = lin.join('\n'), toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2200); };
    const alt = () => { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); toast(ok ? 'Datos copiados. Pégalos en una hoja de cálculo.' : 'No se pudo copiar'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Datos copiados. Pégalos en una hoja de cálculo.'), alt); else alt();
  }

  /* ───────── sonido ───────── */
  const audio = (() => {
    let ctx = null, ruido = null, gSop = null, on = false;
    function crear() {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC(); const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0); let l = 0;
      for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
      ruido = ctx.createBufferSource(); ruido.buffer = buf; ruido.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; gSop = ctx.createGain(); gSop.gain.value = 0;
      ruido.connect(f); f.connect(gSop); gSop.connect(ctx.destination); ruido.start(); return true;
    }
    function tono(f, dur, vol, tipo) { if (!on || !ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur); }
    return {
      activar(v) { on = v; if (v && !ctx && !crear()) { on = false; return; } if (ctx) { if (v) ctx.resume(); gSop.gain.setTargetAtTime(v && st.P.blower ? 0.12 : 0, ctx.currentTime, 0.1); } },
      sopl() { if (ctx) gSop.gain.setTargetAtTime(on && st.P.blower ? 0.12 : 0, ctx.currentTime, 0.1); },
      puerta() { tono(1320, 0.06, 0.06, 'square'); }, clic() { tono(220, 0.05, 0.1, 'triangle'); },
      choque() { tono(150, 0.12, 0.22, 'triangle'); tono(2400, 0.03, 0.08, 'square'); }, golpe() { tono(95, 0.18, 0.25, 'sine'); }
    };
  })();

  /* ───────── bucle ───────── */
  let tPrev = 0, nFrame = 0;
  function bucle(ts) {
    const dt = Math.min(0.05, (ts - tPrev) / 1000 || 0.016); tPrev = ts; nFrame++;
    const s = st.sim, corre = s.estado === 'corriendo' && !st.pausa;
    if (corre) {
      st.acc += dt * st.vel; const n = Math.floor(st.acc / C.dt); st.acc -= n * C.dt;
      const ne = s.eventos.length, col = s.col, choT = s.choqueTope, land = s.hang && s.hang.mode;
      for (let i = 0; i < n; i++) { E.paso(s, C.dt); E.paso(st.ideal, C.dt); }
      if (s.eventos.length !== ne) { tabla(); resultados(); lcd(); audio.puerta(); }
      if (s.col && !col) { resultados(); audio.choque(); }
      if (s.choqueTope !== choT) audio.golpe();
      if (s.hang && s.hang.mode !== land && s.hang.mode === 'landed') { resultados(); audio.golpe(); }
      if (s.estado === 'fin') { setBtns(); resultados(); }
      if (nFrame % 6 === 0) { lcd(); if (st.id === 'oscilador' || st.id === 'inclinado' || nFrame % 12 === 0) resultados(); }
    }
    lecturas();
    if (corre || st.sucio || nFrame % 30 === 0) { dibujarGraficas(); st.sucio = false; }
    if (corre && nFrame % 4 === 0) dibujarLaptop();
    escena.render(s, st.ideal, { vectorV: st.vv, vectorA: st.va }, dt);
    requestAnimationFrame(bucle);
  }

  /* ───────── arranque ───────── */
  function iniciar() {
    const cv = $('#gl');
    try { escena = window.ESCENA.crear(cv); } catch (err) { $('#sinwebgl').hidden = false; console.error(err); return; }
    construirMontajes(); eventosUI();
    const ro = new ResizeObserver(() => { escena.redim(); st.sucio = true; }); ro.observe(cv.parentNode);
    escena.redim(); leerTokens();
    elegir('newton');
    escena.irA('general', true);
    dibujarLaptop();
    window.__riel = { st, escena, E, soltar, reiniciar, elegir, cambioParam, dibujarLaptop, resultados, tabla, lcd };
    requestAnimationFrame((t) => { tPrev = t; bucle(t); });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { leerTokens(); st.sucio = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
