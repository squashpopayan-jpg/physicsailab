/* Aplicación: práctica con el banco, entrenador de lectura, cuaderno (estadística, unidades, densidad), teoría y panel docente. */
(function () {
  'use strict';
  const M = METRO, R = RENDER;
  const $ = (id) => document.getElementById(id);
  const fmt = M.fmt;
  const CLAVE = 'metrologia-lab-v1', CLAVE_DOC = 'calibre-unicauca';
  const hora = () => new Date().toTimeString().slice(0, 8);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let toastTimer;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200); }
  const UN_LISTA = ['mm', 'cm', 'm', 'um', 'in', 'ft', 'km', 'nm'];
  const unSim = (u) => M.UNIDADES[u].sim;
  const parseNum = (s) => parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.'));

  /* ---------- estado ---------- */
  const nuevo = () => ({ v: 1, banco: 1, grupo: '', instrId: 'v005', objId: 'cil', attrId: 'D', pos: 0.5, angDeg: 0, metodo: 'trinquete',
    filas: [], log: [], res: {}, flags: {}, errores: {}, quiz: {}, ent: { instrId: 'v005', ok: 0, total: 0, racha: 0, mejor: 0, hist: [] }, ctr: 0 });
  let ST = nuevo();
  let u = 0;                                                     // apertura que la mano "quiere" (mm)
  let lens = null, ojo = 0, zoom = 6, lenteOn = true, ayuda = false, partes = false, sonido = true;
  let ultimaMed = null;

  /* ---------- almacenamiento ---------- */
  let gTimer = null;
  function guardar() {
    clearTimeout(gTimer);
    gTimer = setTimeout(() => { try { localStorage.setItem(CLAVE, JSON.stringify(ST)); } catch (e) { /* sin almacenamiento */ } }, 350);
  }
  function cargar() {
    try { const s = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (s && s.v === 1) ST = Object.assign(nuevo(), s, { ent: Object.assign(nuevo().ent, s.ent || {}) }); } catch (e) { /* ignorar */ }
  }
  function bit(txt) { ST.log.push(hora() + ' · ' + txt); if (ST.log.length > 400) ST.log.shift(); guardar(); }

  function confirmar(titulo, texto, si) {
    $('confirmTitle').textContent = titulo; $('confirmText').textContent = texto; $('confirmBox').hidden = false; $('confirmYes').focus();
    const cerrar = () => { $('confirmBox').hidden = true; $('confirmYes').onclick = null; $('confirmNo').onclick = null; };
    $('confirmYes').onclick = () => { cerrar(); si(); }; $('confirmNo').onclick = cerrar;
  }
  async function entregar(nombre, contenido) {
    const enMarco = !!(window.claude && typeof window.claude.use === 'function');
    if (enMarco) {
      let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
      if (dl) {
        try { await dl.save({ filename: nombre, data: contenido }); toast('Archivo entregado: ' + nombre); }
        catch (e) { toast(e && e.code === 'declined' ? 'Descarga cancelada.' : 'No se pudo descargar el archivo en esta vista.'); }
        return;
      }
      $('copyName').textContent = nombre; $('copyText').value = contenido; $('copyBox').hidden = false; $('copyText').focus(); $('copyText').select(); return;
    }
    const ext = nombre.split('.').pop(), tipo = ext === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
    const url = URL.createObjectURL(new Blob([ext === 'csv' ? '﻿' + contenido : contenido], { type: tipo })), a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Descarga preparada: ' + nombre);
  }
  $('copyClose').addEventListener('click', () => { $('copyBox').hidden = true; });

  /* ---------- sonido ---------- */
  let AC = null, ultClic = 0;
  function pip(freq, dur, vol) {
    if (!sonido) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = freq; g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
    } catch (e) { /* sin audio */ }
  }

  /* ======================================================================
     MEDIDA ACTUAL
     ====================================================================== */
  function medir() {
    const I = M.instr(ST.instrId), bco = M.banco(ST.banco), B = bco.instr[I.id];
    let kind = 'libre', S = 0, kobj = 1e6, a = null, o = null, aviso = '', mat = 'Acero', etiqueta = null, agujeroVis = 0;
    if (ST.objId === 'cero') { kind = 'cero'; }
    else if (ST.objId !== 'libre') {
      o = M.objeto(ST.objId); a = o.attrs.find((x) => x.id === ST.attrId) || o.attrs[0];
      S = M.tamLocal(ST.banco, o.id, a.id, ST.pos, ST.angDeg * Math.PI / 180);
      const comp = M.compatible(I, a, S);
      if (comp.ok) { kind = a.kind; kobj = o.k; mat = o.mat; }
      else { kind = 'libre'; aviso = comp.razon; a = null; S = 0; }
      if (a && a.dib === 'disco') { const ai = o.attrs.find((x) => x.id === 'Di'); if (ai) agujeroVis = M.pieza(ST.banco, o.id).attrs.Di.nomReal; }
      if (a && o.patron) etiqueta = fmt(a.nom, 0) + ' mm';
    }
    const kScene = kind === 'cero' ? 'ext' : kind;
    const win = I.tipo === 'vernier' ? R.ventanaV(I, kScene, S, partes) : null;
    const umax = I.tipo === 'vernier' ? win.uMax : I.rangoMM + 0.3, umin = -3;
    u = Math.max(umin, Math.min(umax, u));
    let c;
    if (kind === 'libre') c = u < 0 ? M.contacto(I, bco, 'cero', 0, u, ST.metodo, 1e6) : M.contacto(I, bco, 'libre', 0, u, ST.metodo, 1e6);
    else if (u < 0 && kind !== 'ext' && kind !== 'cero') c = M.contacto(I, bco, 'cero', 0, u, ST.metodo, 1e6);
    else c = M.contacto(I, bco, kind, S, u, ST.metodo, kobj);
    const g = c.g, p = M.posicion(I, bco, g);
    return { I, bco, B, o, a, kind, kScene, S, kobj, c, g, p, F: c.F, slip: c.slip, aviso, mat, etiqueta, agujeroVis, umax, umin };
  }

  function pasosDe(I) {
    const lcmm = I.lcMM;
    if (I.tipo === 'vernier') return I.unidad === 'mm'
      ? [['10 mm', 10], ['1 mm', 1], ['0,1 mm', 0.1], ['1 división (' + fmt(I.lc, I.dec) + ' mm)', I.lc]]
      : [['1 in', 25.4], ['0,1 in', 2.54], ['0,025 in', 0.635], ['1 división (0,001 in)', 0.0254]];
    if (I.unidad === 'mm') {
      const l = [['1 mm (2 vueltas)', 1], ['0,5 mm (1 vuelta)', 0.5], ['0,1 mm', 0.1], ['1 división del tambor (0,01 mm)', 0.01]];
      if (I.nonio) l.push(['0,001 mm (nonio)', 0.001]); return l;
    }
    return [['0,1 in', 2.54], ['0,025 in (1 vuelta)', 0.635], ['0,01 in', 0.254], ['1 división (0,001 in)', 0.0254]];
  }

  /* ---------- dibujo ---------- */
  let pendiente = false;
  function pedir() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; dibujar(); }); }
  function dibujar() {
    if (vista === 'practica') {
      const m = ultimaMed = medir();
      const I = m.I;
      const fe = R.fit($('escena'), 0.5);
      if (fe) {
        if (I.tipo === 'vernier') R.sceneVernier(fe.ctx, fe.W, fe.H, { I, kind: m.kScene, g: m.g, S: m.S, attr: m.a, mat: m.mat, etiqueta: m.etiqueta, F: m.F, partes, agujeroVis: m.agujeroVis });
        else R.sceneMicro(fe.ctx, fe.W, fe.H, { I, kind: m.kScene, g: m.g, S: m.S, attr: m.a, mat: m.mat, etiqueta: m.etiqueta, F: m.F, partes, e0: m.B.e0, slip: m.slip });
      }
      dibujaLupa($('lupa'), I, m.p, ayuda);
      actualizaFuerza(m);
      const msg = $('escenaMsg');
      if (m.aviso) { msg.textContent = m.aviso + ' Se muestra el instrumento libre.'; msg.hidden = false; } else msg.hidden = true;
      // sonidos de contacto
      if (m.c.contacto && !pedir.tocando) { pedir.tocando = true; pip(1700, 0.04, 0.05); }
      if (!m.c.contacto) pedir.tocando = false;
      if (m.slip && performance.now() - ultClic > 110) { ultClic = performance.now(); pip(2300, 0.03, 0.07); }
    } else if (vista === 'entrenador') {
      entDibuja();
    } else if (vista === 'teoria') {
      dibujaEjemplos();
    }
  }
  function lensDef(canvas, I, W, H, cursor) {
    const r = Math.min(120, W * 0.2);
    return cursor ? { x: cursor.x, y: cursor.y, r, z: zoom } : null;
  }
  function dibujaLupa(canvas, I, p, ay, ctlLente, cursor, zoomVal) {
    const f = R.fit(canvas, I.tipo === 'vernier' ? 0.3 : 0.46); if (!f) return;
    const st = { I, p, par: ojo, ayuda: ay, lens: null };
    const on = ctlLente === undefined ? lenteOn : ctlLente;
    if (on) { st.lens = lensDef(canvas, I, f.W, f.H, cursor === undefined ? lens : cursor); if (st.lens && zoomVal) st.lens.z = zoomVal; }
    (I.tipo === 'vernier' ? R.lupaVernier : R.lupaMicro)(f.ctx, f.W, f.H, st);
  }
  function actualizaFuerza(m) {
    const box = $('fuerzaBox'), F = m.F, micro = m.I.tipo === 'micro', tope = micro ? 20 : 20;
    $('fuerzaVal').textContent = fmt(F, 1) + ' N';
    $('fuerzaFill').style.width = Math.min(100, F / tope * 100) + '%';
    const mk = $('fuerzaMark');
    if (micro && ST.metodo === 'trinquete') { mk.hidden = false; mk.style.left = (m.B.Fr / tope * 100) + '%'; } else mk.hidden = true;
    box.classList.remove('medio', 'mucho');
    let nota = 'Sin contacto con la pieza.';
    if (m.c.contacto) {
      const d = m.c.d;
      const lim = micro ? (ST.metodo === 'trinquete' ? 999 : 12) : 8;
      if (F > lim * 2) box.classList.add('mucho'); else if (F > lim) box.classList.add('medio');
      nota = micro && ST.metodo === 'trinquete' ? (m.slip ? 'El trinquete patina: la fuerza ya es la normalizada.' : 'Siga girando hasta que el trinquete patine.') : 'Fuerza aplicada.';
      if (d > 0.0008) nota += ' Deformación estimada: ' + fmt(d, d < 0.1 ? 3 : 2) + ' mm' + (F > lim ? ' (apriete excesivo: la lectura queda alterada)' : '') + '.';
    }
    if (m.kind === 'libre') nota = 'Sin pieza: mueva el instrumento libremente.';
    $('fuerzaNota').textContent = nota;
  }

  /* ---------- interacción con la escena ---------- */
  let drag = null;
  const esc_ = $('escena');
  function scEscena() {
    const m = ultimaMed || medir(), f = esc_.getBoundingClientRect().width;
    return f / (m.I.tipo === 'vernier' ? R.ventanaV(m.I, m.kScene, m.S, partes).WW : R.ventanaM(m.I).WW);
  }
  esc_.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, u0: u, sc: scEscena() }; esc_.setPointerCapture(e.pointerId); esc_.focus(); });
  esc_.addEventListener('pointermove', (e) => {
    if (!drag) return;
    u = drag.u0 + (e.clientX - drag.x) / drag.sc * (e.shiftKey ? 0.1 : 1); pedir();
  });
  const fin = () => { drag = null; };
  esc_.addEventListener('pointerup', fin); esc_.addEventListener('pointercancel', fin);
  esc_.addEventListener('wheel', (e) => { e.preventDefault(); u += (e.deltaY > 0 ? 1 : -1) * pasoActual() * (e.shiftKey ? 5 : 1); pedir(); }, { passive: false });
  esc_.addEventListener('keydown', (e) => {
    const mult = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { u += pasoActual() * mult; e.preventDefault(); pedir(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { u -= pasoActual() * mult; e.preventDefault(); pedir(); }
  });
  const pasoActual = () => parseFloat($('selPaso').value) || 0.1;
  $('btnMas').addEventListener('click', () => { u += pasoActual(); pedir(); });
  $('btnMenos').addEventListener('click', () => { u -= pasoActual(); pedir(); });
  function posicionInicial() {
    const m0 = medir0();
    u = m0.u; pedir();
  }
  function medir0() {
    const I = M.instr(ST.instrId); let kind = 'libre', S = 0;
    if (ST.objId === 'cero') kind = 'cero';
    else if (ST.objId !== 'libre') {
      const o = M.objeto(ST.objId), a = o.attrs.find((x) => x.id === ST.attrId) || o.attrs[0];
      const s = M.tamLocal(ST.banco, o.id, a.id, ST.pos, ST.angDeg * Math.PI / 180);
      if (M.compatible(I, a, s).ok) { kind = a.kind; S = s; }
    }
    const micro = I.tipo === 'micro';
    if (kind === 'ext') return { u: S + (micro ? 3 : 12) };
    if (kind === 'cero') return { u: micro ? 4 : 10 };
    if (kind === 'int' || kind === 'prof') return { u: Math.max(0, S - 6) };
    return { u: micro ? 8.37 : 17.3 };
  }
  $('btnAbrir').addEventListener('click', () => { u = medir0().u; pedir(); });
  $('btnContacto').addEventListener('click', () => { const m = medir(); if (m.kind !== 'libre') { u = m.S; pedir(); } else toast('Elija una pieza para tocarla.'); });
  $('btnApretar').addEventListener('click', () => {
    const m = medir(); if (m.kind === 'libre') { toast('Elija una pieza para apretarla.'); return; }
    const extra = m.I.tipo === 'vernier' ? 0.25 : (ST.metodo === 'trinquete' ? 0.3 : 0.12);
    u = (m.kind === 'ext' || m.kind === 'cero') ? m.S - extra : m.S + extra; pedir();
    bit('Apretó ' + m.I.corto + (m.I.tipo === 'micro' ? ' (' + (ST.metodo === 'trinquete' ? 'trinquete' : 'tambor') + ')' : ''));
  });
  $('selMetodo').addEventListener('change', (e) => { ST.metodo = e.target.value; bit('Cambió la forma de cerrar: ' + e.target.value); guardar(); pedir(); });
  $('btnSonido').addEventListener('click', () => { sonido = !sonido; $('btnSonido').textContent = 'Sonido: ' + (sonido ? 'sí' : 'no'); $('btnSonido').setAttribute('aria-pressed', sonido); if (sonido) pip(1500, 0.05, 0.05); });
  $('chkPartes').addEventListener('change', (e) => { partes = e.target.checked; if (partes) { ST.flags.partes = true; guardar(); renderGuia(); } pedir(); });
  $('chkAyuda').addEventListener('change', (e) => { ayuda = e.target.checked; if (ayuda) bit('Activó la ayuda de lectura'); pedir(); });

  /* lupa */
  function lensHandlers(canvas, setter, redraw) {
    const mv = (e) => { const r = canvas.getBoundingClientRect(); setter({ x: e.clientX - r.left, y: e.clientY - r.top }); redraw(); };
    canvas.addEventListener('pointermove', mv); canvas.addEventListener('pointerdown', mv);
    canvas.addEventListener('pointerleave', () => { setter(null); redraw(); });
  }
  lensHandlers($('lupa'), (c) => { lens = c; }, pedir);
  $('rngZoom').addEventListener('input', (e) => { zoom = +e.target.value; $('outZoom').textContent = '×' + zoom; pedir(); });
  $('rngOjo').addEventListener('input', (e) => { ojo = +e.target.value; $('outOjo').textContent = ojo === 0 ? '0° (de frente)' : (ojo > 0 ? '+' : '') + ojo + '° (inclinado)'; pedir(); });
  $('chkLente').addEventListener('change', (e) => { lenteOn = e.target.checked; pedir(); });

  /* ======================================================================
     MONTAJE
     ====================================================================== */
  function llenaSelects() {
    const sb = $('selBanco'); sb.innerHTML = '';
    for (let i = 1; i <= 24; i++) sb.add(new Option('Banco ' + String(i).padStart(2, '0'), i));
    $('selInstr').innerHTML = ''; M.INSTRUMENTOS.forEach((I) => $('selInstr').add(new Option(I.nombre, I.id)));
    const so = $('selObj'); so.innerHTML = '';
    const g0 = document.createElement('optgroup'); g0.label = 'Comprobaciones';
    g0.append(new Option('Sin pieza: cerrar y leer el cero', 'cero'), new Option('Libre: practicar con el instrumento', 'libre'));
    so.append(g0);
    const g1 = document.createElement('optgroup'); g1.label = 'Bloques patrón (con certificado)';
    const g2 = document.createElement('optgroup'); g2.label = 'Piezas';
    M.OBJETOS.forEach((o) => (o.patron ? g1 : g2).append(new Option(o.nombre, o.id)));
    so.append(g1, g2);
    UN_LISTA.slice(0, 5).forEach((x) => $('selUn').add(new Option(unSim(x) + ' · ' + M.UNIDADES[x].nombre, x)));
  }
  function llenaAttr() {
    const sa = $('selAttr'); sa.innerHTML = '';
    if (ST.objId === 'cero' || ST.objId === 'libre') { sa.add(new Option('—', '')); sa.disabled = true; return; }
    sa.disabled = false;
    const o = M.objeto(ST.objId), I = M.instr(ST.instrId), pie = M.pieza(ST.banco, o.id);
    o.attrs.forEach((a) => {
      const comp = M.compatible(I, a, pie.attrs[a.id].nomReal);
      const tipo = { ext: 'exteriores', int: 'interiores', prof: 'profundidad' }[a.kind];
      sa.add(new Option(a.nombre + ' · ' + tipo + (comp.ok ? '' : ' (no mide este instrumento)'), a.id));
    });
    if (!o.attrs.some((a) => a.id === ST.attrId)) ST.attrId = o.attrs[0].id;
    sa.value = ST.attrId;
  }
  function llenaPasos() {
    const I = M.instr(ST.instrId), sp = $('selPaso'); sp.innerHTML = '';
    pasosDe(I).forEach((p) => sp.add(new Option(p[0], p[1])));
    sp.selectedIndex = sp.options.length - 1;
  }
  function infoPieza() {
    const el = $('infoPieza'), I = M.instr(ST.instrId);
    if (ST.objId === 'cero') { el.innerHTML = '<b>Cierre las mordazas</b> y lea el cero. Si no marca 0, anote esa lectura: es el <b>error de cero</b>. Haga la comprobación con la misma forma de cerrar que usará para medir.'; return; }
    if (ST.objId === 'libre') { el.innerHTML = '<b>Instrumento libre.</b> Mueva la corredera o el tambor a cualquier posición y practique la lectura. Para comprobar sus respuestas, use «Comprobar y anotar».'; return; }
    const o = M.objeto(ST.objId), a = o.attrs.find((x) => x.id === ST.attrId) || o.attrs[0];
    let h = '<b>' + esc(o.nombre) + '</b> · ' + esc(o.mat) + '<br>' + esc(o.nota);
    const ms = M.masaPieza(ST.banco, o.id);
    if (ms !== null) h += '<br>Masa en la balanza (±0,01 g): <b>' + fmt(ms, 2) + ' g</b>';
    if (o.patron) { const v = M.valorVerdadero(ST.banco, o.id, a.id); h += '<div class="cert">Certificado: ' + fmt(v, 4) + ' mm (±0,0002 mm) · ' + fmt(v / 25.4, 5) + ' in</div>'; }
    el.innerHTML = h;
  }
  function aplicaMontaje(resetPos) {
    llenaAttr(); llenaPasos(); infoPieza();
    $('metodoWrap').hidden = M.instr(ST.instrId).tipo !== 'micro';
    $('hInstr').textContent = M.instr(ST.instrId).nombre;
    $('selUn').value = M.instr(ST.instrId).unidad;
    $('fb').hidden = true; $('fbAcc').hidden = true; $('pasosLectura').hidden = true;
    posicionInicial();
  }
  $('selInstr').addEventListener('change', (e) => { ST.instrId = e.target.value; bit('Instrumento: ' + M.instr(ST.instrId).corto); guardar(); aplicaMontaje(); renderGuia(); });
  $('selObj').addEventListener('change', (e) => {
    ST.objId = e.target.value;
    if (ST.objId !== 'cero' && ST.objId !== 'libre') ST.attrId = M.objeto(ST.objId).attrs[0].id;
    bit('Pieza: ' + ST.objId); guardar(); aplicaMontaje();
  });
  $('selAttr').addEventListener('change', (e) => { ST.attrId = e.target.value; guardar(); aplicaMontaje(); });
  $('rngPos').addEventListener('input', (e) => { ST.pos = +e.target.value / 100; $('outPos').textContent = e.target.value + ' %'; guardar(); pedir(); });
  $('rngAng').addEventListener('input', (e) => { ST.angDeg = +e.target.value; $('outAng').textContent = e.target.value + '°'; guardar(); pedir(); });
  (function () {                                                   // botón de punto al azar
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost small-btn'; b.textContent = 'Otro punto al azar'; b.style.gridColumn = '1/-1';
    b.addEventListener('click', () => {
      ST.pos = Math.round(Math.random() * 100) / 100; ST.angDeg = Math.round(Math.random() * 180);
      $('rngPos').value = ST.pos * 100; $('rngAng').value = ST.angDeg; $('outPos').textContent = Math.round(ST.pos * 100) + ' %'; $('outAng').textContent = ST.angDeg + '°';
      guardar(); posicionInicial();
    });
    document.querySelector('.dos-sl').append(b);
  })();
  $('setupForm').addEventListener('submit', (e) => {
    e.preventDefault(); ST.banco = +$('selBanco').value; ST.grupo = $('inpGrupo').value.trim();
    bit('Banco ' + ST.banco + (ST.grupo ? ' · ' + ST.grupo : '')); guardar(); topChip(); aplicaMontaje(); toast('Banco ' + ST.banco + ' listo.');
  });
  function topChip() { $('topBanco').textContent = String(ST.banco).padStart(2, '0'); $('topGrupo').textContent = ST.grupo; }

  /* ======================================================================
     ANOTAR LECTURAS
     ====================================================================== */
  let pend = null;                                               // último intento fallido
  function evaluaActual() {
    const m = ultimaMed = medir();
    const txt = $('inpLect').value, un = $('selUn').value;
    const ev = M.evaluar(m.I, m.p, txt, un, { cero: m.B.e0 / m.I.f });
    return { m, ev, txt, un };
  }
  $('formLect').addEventListener('submit', (e) => {
    e.preventDefault();
    const { m, ev, txt, un } = evaluaActual();
    const fb = $('fb'); fb.hidden = false;
    if (ev.tipo === 'vacio') { fb.className = 'fb warn'; fb.textContent = ev.msg; $('fbAcc').hidden = true; return; }
    if (ev.ok) { registrar(m, txt, un, ev, true); fb.className = 'fb ok'; fb.textContent = '✓ ' + ev.msg + ' Anotada en el cuaderno.'; $('fbAcc').hidden = true; $('pasosLectura').hidden = true; $('inpLect').value = ''; pend = null; }
    else {
      ST.errores[ev.tipo] = (ST.errores[ev.tipo] || 0) + 1; guardar();
      fb.className = 'fb bad'; fb.innerHTML = '✗ ' + ev.msg; $('fbAcc').hidden = false; $('btnForzar').hidden = false; pend = { m, txt, un, ev };
      bit('Lectura incorrecta (' + ev.tipo + ') en ' + m.I.corto);
    }
  });
  $('btnForzar').addEventListener('click', () => {
    if (!pend) return;
    registrar(pend.m, pend.txt, pend.un, pend.ev, false); $('fb').className = 'fb warn'; $('fb').textContent = 'Anotada con la marca ⚠ (no coincide con el instrumento; no se usa en los cálculos).'; $('fbAcc').hidden = true; $('inpLect').value = ''; pend = null;
  });
  $('btnComo').addEventListener('click', () => {
    const m = medir(); const ol = $('pasosLectura'); ol.hidden = false;
    ol.innerHTML = M.pasos(m.I, m.p).map((s) => '<li>' + s + '</li>').join('');
    ST.flags.ayudaLectura = (ST.flags.ayudaLectura || 0) + 1; bit('Pidió ver cómo se lee'); guardar();
  });
  function registrar(m, txt, un, ev, ok) {
    const v = parseNum(txt), L = M.lectura(m.I, m.p);
    const tipo = m.kind === 'cero' ? 'cero' : (m.kind === 'libre' ? 'libre' : (m.o && m.o.patron ? 'patron' : 'med'));
    const fila = { id: ++ST.ctr, hora: hora(), banco: ST.banco, instrId: m.I.id, objId: tipo === 'cero' ? 'cero' : (m.kind === 'libre' ? 'libre' : m.o.id), attrId: m.a ? m.a.id : '',
      pos: Math.round(ST.pos * 100), ang: ST.angDeg, metodo: m.I.tipo === 'micro' ? ST.metodo : '', F: Math.round(m.F * 10) / 10, val: v, un, mm: M.aMM(v, un), ok, tipo,
      verd: L.valor, verdMM: L.valor * m.I.f, g: m.g };
    ST.filas.push(fila); bit((ok ? 'Anotó ' : 'Anotó (⚠) ') + txt + ' ' + unSim(un) + ' · ' + m.I.corto + (m.o ? ' · ' + m.o.nombre : ' · ' + m.kind)); guardar(); renderUltimas(); renderGuia();
  }
  function renderUltimas() {
    const el = $('ultimas'), f = ST.filas.slice(-5).reverse();
    if (!f.length) { el.innerHTML = '<p class="small muted">Todavía no hay lecturas.</p>'; return; }
    el.innerHTML = f.map((r) => `<div class="ult"><span>${esc(M.instr(r.instrId).corto)} · ${esc(nombreFila(r))}</span><b class="${r.ok ? 'bien' : 'mal'}">${fmt(r.val, 3)} ${unSim(r.un)}${r.ok ? '' : ' ⚠'}</b></div>`).join('');
  }
  function nombreFila(r) {
    if (r.objId === 'cero') return 'cero';
    if (r.objId === 'libre') return 'libre';
    const o = M.objeto(r.objId), a = o.attrs.find((x) => x.id === r.attrId);
    return o.nombre + (a && o.attrs.length > 1 ? ' · ' + a.nombre : '');
  }

  /* ---------- guía ---------- */
  function renderGuia() {
    const ok = ST.filas.filter((r) => r.ok), I = ST.instrId;
    const g = grupos();
    const items = [
      [!!ST.flags.partes, 'Reconozca las partes del instrumento (active «Nombres de las partes»).'],
      [!!ST.res[I], 'Calcule la resolución del instrumento (Cuaderno, sección 1).'],
      [ok.some((r) => r.tipo === 'cero' && r.instrId === I), 'Cierre las mordazas, lea el error de cero y anótelo.'],
      [ok.some((r) => r.tipo === 'patron' && r.instrId === I), 'Compruebe el instrumento con un bloque patrón y compare con el certificado.'],
      [g.some((x) => x.mm.length >= 5), 'Mida una pieza al menos 5 veces en puntos y giros distintos.'],
      [new Set(ok.filter((r) => r.tipo === 'med' && ['oring', 'goma', 'tubo', 'pila20', 'papel'].includes(r.objId) && r.instrId.startsWith('m')).map((r) => r.metodo)).size >= 2, 'Mida un material blando con el micrómetro de las dos formas (trinquete y tambor) y compare.'],
      [!!ST.flags.conv, 'Exprese un resultado con su incertidumbre en otras unidades (Cuaderno, sección 4).'],
      [!!ST.flags.dens, 'Calcule volumen y densidad con su incertidumbre e identifique el material (sección 5).'],
    ];
    $('guia').innerHTML = items.map((i) => `<li class="${i[0] ? 'hecho' : ''}"><span>${i[1]}</span></li>`).join('');
  }

  /* ======================================================================
     ENTRENADOR
     ====================================================================== */
  let ENT = { q: null, intentos: 0, verPasos: false, lens: null };
  function entNueva() {
    const I = M.instr(ST.ent.instrId), r = M.lecturaAleatoria(I, Math.random);
    let un = I.unidad;
    if ($('entOtra').checked) { const opts = I.unidad === 'mm' ? ['cm', 'in', 'm', 'um'] : ['mm', 'cm']; un = opts[Math.floor(Math.random() * opts.length)]; }
    ENT.q = { pMM: r.pMM, un }; ENT.intentos = 0; ENT.contada = false;
    $('entInp').value = ''; $('entFb').hidden = true; $('entAcc').hidden = true; $('entPasos').hidden = true;
    const L = M.lectura(I, r.pMM);
    $('entUn').innerHTML = '';
    (I.unidad === 'mm' ? ['mm', 'cm', 'm', 'um', 'in'] : ['in', 'mm', 'cm', 'm']).forEach((x) => $('entUn').add(new Option(unSim(x) + ' · ' + M.UNIDADES[x].nombre, x)));
    $('entUn').value = un; $('entUn').disabled = un !== I.unidad;
    $('entPregunta').innerHTML = un === I.unidad ? 'Lea la escala del instrumento. Escriba <b>todas</b> las cifras (incluidos los ceros finales).' : `Lea el instrumento y exprese la medida en <b>${M.UNIDADES[un].nombre}s (${unSim(un)})</b>. Escriba el valor completo, sin redondear.`;
    entDibuja(); entStats();
  }
  function entDibuja() {
    if (!ENT.q) return;
    const I = M.instr(ST.ent.instrId);
    $('entTitulo').textContent = I.nombre;
    dibujaLupa($('entLupa'), I, ENT.q.pMM, $('entAyuda').checked || ENT.verPasos, $('entLente').checked, ENT.lens, +$('entZoom').value);
  }
  lensHandlers($('entLupa'), (c) => { ENT.lens = c; }, () => requestAnimationFrame(entDibuja));
  $('entZoom').addEventListener('input', (e) => { $('entOutZoom').textContent = '×' + e.target.value; entDibuja(); });
  $('entLente').addEventListener('change', entDibuja);
  $('entAyuda').addEventListener('change', entDibuja);
  $('entInstr').addEventListener('change', (e) => { ST.ent.instrId = e.target.value; ENT.lens = null; ENT.verPasos = false; guardar(); entNueva(); });
  $('entOtra').addEventListener('change', entNueva);
  $('entNueva').addEventListener('click', () => { ENT.verPasos = false; entNueva(); });
  $('entSig').addEventListener('click', () => { ENT.verPasos = false; entNueva(); });
  $('entVer').addEventListener('click', () => {
    const I = M.instr(ST.ent.instrId); ENT.verPasos = true; $('entPasos').hidden = false;
    $('entPasos').innerHTML = M.pasos(I, ENT.q.pMM).map((s) => '<li>' + s + '</li>').join('');
    const L = M.lectura(I, ENT.q.pMM);
    if (ENT.q.un !== I.unidad) $('entPasos').innerHTML += `<li><b>Unidades.</b> ${fmt(L.valor, I.dec)} ${I.unidad} × (${fmt(M.UNIDADES[I.unidad].mm / M.UNIDADES[ENT.q.un].mm, 6).replace(/0+$/, '').replace(/,$/, '')} ${unSim(ENT.q.un)}/${I.unidad}) = <b>${fmt(M.convertir(L.valor, I.unidad, ENT.q.un), 6).replace(/0+$/, '').replace(/,$/, '')} ${unSim(ENT.q.un)}</b>.</li>`;
    entDibuja();
  });
  $('entForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const I = M.instr(ST.ent.instrId), un = $('entUn').value;
    const ev = M.evaluar(I, ENT.q.pMM, $('entInp').value, un);
    const fb = $('entFb'); fb.hidden = false;
    if (ev.tipo === 'vacio') { fb.className = 'fb warn'; fb.textContent = ev.msg; return; }
    const E = ST.ent;
    if (!ENT.contada) {
      ENT.contada = true; E.total++;
      if (ev.ok && ENT.intentos === 0) { E.ok++; E.racha++; E.mejor = Math.max(E.mejor, E.racha); E.hist.push(1); } else { E.racha = 0; E.hist.push(0); }
      E.hist = E.hist.slice(-20);
    }
    ENT.intentos++;
    if (ev.ok) { fb.className = 'fb ok'; fb.textContent = '✓ Correcto. ' + ev.msg; $('entAcc').hidden = false; $('entVer').hidden = false; }
    else { ST.errores[ev.tipo] = (ST.errores[ev.tipo] || 0) + 1; fb.className = 'fb bad'; fb.innerHTML = '✗ ' + ev.msg; $('entAcc').hidden = false; }
    guardar(); entStats();
  });
  function entStats() {
    const E = ST.ent, pct = E.total ? Math.round(E.ok / E.total * 100) : 0;
    $('entStats').innerHTML = `<div class="stat"><b>${E.ok}/${E.total}</b><span>aciertos a la primera</span></div><div class="stat"><b>${pct} %</b><span>porcentaje</span></div><div class="stat"><b>${E.racha}</b><span>racha (mejor ${E.mejor})</span></div><div class="hist" aria-label="Últimas 20 lecturas">${E.hist.map((h) => `<i class="${h ? 's' : 'n'}"></i>`).join('')}</div>`;
  }

  /* ======================================================================
     CUADERNO
     ====================================================================== */
  /* error de cero que escribió el estudiante (mm) para un instrumento */
  function ceroEst(id) {
    const r = ST.filas.filter((x) => x.ok && x.tipo === 'cero' && x.instrId === id);
    if (!r.length) return null;
    return r.reduce((a, b) => a + b.mm, 0) / r.length;
  }
  function grupos() {
    const map = new Map();
    ST.filas.filter((r) => r.ok && (r.tipo === 'med' || r.tipo === 'patron')).forEach((r) => {
      const k = r.instrId + '|' + r.objId + '|' + r.attrId;
      if (!map.has(k)) map.set(k, { k, instrId: r.instrId, objId: r.objId, attrId: r.attrId, filas: [], mm: [] });
      const g = map.get(k), e0 = ceroEst(r.instrId) || 0;
      g.filas.push(r); g.mm.push(r.mm - e0);
    });
    const out = [...map.values()];
    out.forEach((g) => {
      const I = M.instr(g.instrId); g.I = I; g.conCero = ceroEst(g.instrId) !== null;
      g.st = M.estadistica(g.mm); g.u = M.incertidumbre(I.lcMM, g.st, g.conCero);
      g.o = M.objeto(g.objId); g.a = g.o.attrs.find((x) => x.id === g.attrId);
      g.red = M.redondeoInc(g.st.media, g.u);
    });
    return out;
  }
  const nombreGrupo = (g) => g.o.nombre + (g.o.attrs.length > 1 ? ' · ' + g.a.nombre : '');

  function renderResolucion() {
    $('resGrid').innerHTML = M.INSTRUMENTOS.map((I) => {
      const dato = I.tipo === 'vernier' ? `División de la regla: <b>${fmt(I.div, I.unidad === 'mm' ? 0 : 3)} ${I.unidad}</b> · Nonio: <b>${I.N}</b> divisiones` : `Paso del husillo: <b>${fmt(I.paso, I.unidad === 'mm' ? 1 : 3)} ${I.unidad}</b> · Tambor: <b>${I.nT}</b> divisiones${I.nonio ? ' · Nonio del manguito: <b>10</b> líneas' : ''}`;
      const hecho = ST.res[I.id];
      return `<div class="res-card" data-i="${I.id}"><h4>${esc(I.corto)}</h4><p class="small">${dato}</p><div class="row"><label style="flex:1;margin:0">Resolución (${I.unidad})<input type="text" inputmode="decimal" placeholder="r = ?" ${hecho ? 'value="' + fmt(I.lc, I.dec) + '"' : ''}></label><button class="btn" type="button">Comprobar</button></div><div class="msg" aria-live="polite">${hecho ? '✓ r = ' + (I.tipo === 'vernier' ? `${fmt(I.div, I.unidad === 'mm' ? 0 : 3)} / ${I.N}` : `${fmt(I.paso, I.unidad === 'mm' ? 1 : 3)} / ${I.nT * (I.nonio || 1)}`) + ' = ' + fmt(I.lc, I.dec) + ' ' + I.unidad : ''}</div></div>`;
    }).join('');
    document.querySelectorAll('#resGrid .res-card').forEach((c) => {
      const I = M.instr(c.dataset.i), inp = c.querySelector('input'), msg = c.querySelector('.msg');
      c.querySelector('button').addEventListener('click', () => {
        const v = parseNum(inp.value);
        if (!Number.isFinite(v)) { msg.textContent = 'Escriba un número.'; return; }
        if (Math.abs(v - I.lc) < I.lc * 1e-6 + 1e-12) { ST.res[I.id] = true; guardar(); msg.textContent = '✓ Correcto: ' + (I.tipo === 'vernier' ? `r = a/N = ${fmt(I.div, I.unidad === 'mm' ? 0 : 3)}/${I.N}` : `r = p/n = ${fmt(I.paso, I.unidad === 'mm' ? 1 : 3)}/${I.nT * (I.nonio || 1)}`) + ' = ' + fmt(I.lc, I.dec) + ' ' + I.unidad; msg.style.color = 'var(--ok)'; renderGuia(); }
        else { msg.style.color = 'var(--danger)'; msg.textContent = '✗ No es ese valor. ' + (I.tipo === 'vernier' ? 'Recuerde: resolución = división de la regla ÷ número de divisiones del nonio.' : 'Recuerde: resolución = paso ÷ divisiones del tambor' + (I.nonio ? ' ÷ 10 (nonio)' : '') + '.'); }
      });
    });
  }
  function renderCero() {
    const el = $('ceroTabla'), ids = M.INSTRUMENTOS.filter((I) => ceroEst(I.id) !== null);
    if (!ids.length) { el.innerHTML = '<p class="small muted">Todavía no ha medido el cero. En la práctica elija «Sin pieza: cerrar y leer el cero», cierre y anote la lectura.</p>'; return; }
    el.innerHTML = '<div class="tabla-scroll"><table class="tabla compacta"><thead><tr><th>Instrumento</th><th class="num">Lecturas del cero</th><th class="num">e₀ (promedio)</th><th>Corrección</th></tr></thead><tbody>' + ids.map((I) => {
      const rows = ST.filas.filter((x) => x.ok && x.tipo === 'cero' && x.instrId === I.id), e = ceroEst(I.id);
      return `<tr><td>${esc(I.corto)}</td><td class="num">${rows.map((r) => fmt(r.val, 3) + ' ' + unSim(r.un)).join(' · ')}</td><td class="num">${fmt(M.deMM(e, I.unidad), I.dec + 1)} ${I.unidad}</td><td>${e === 0 ? 'No necesita corrección' : 'Restar ' + fmt(M.deMM(e, I.unidad), I.dec + 1) + ' ' + I.unidad + ' (con su signo) a cada lectura'}</td></tr>`;
    }).join('') + '</tbody></table></div>';
  }
  function resTxt(g, un) {
    const f = M.UNIDADES.mm.mm / M.UNIDADES[un].mm;
    const r = M.redondeoInc(g.st.media * f, g.u * f);
    return fmt(r.v, r.dec) + ' ± ' + fmt(r.u, r.dec) + ' ' + unSim(un);
  }
  function renderTabla() {
    const G = grupos(), t = $('tablaGrupos');
    if (!G.length) { t.innerHTML = '<tbody><tr><td class="muted">Aún no hay mediciones. Anote lecturas en la práctica (piezas o bloques patrón).</td></tr></tbody>'; }
    else t.innerHTML = '<thead><tr><th>Instrumento</th><th>Magnitud</th><th class="num">n</th><th class="num">Promedio (mm)</th><th class="num">s (mm)</th><th class="num">u (mm)</th><th>Resultado</th><th>Nota</th></tr></thead><tbody>' +
      G.map((g) => {
        const nota = [];
        if (!g.conCero) nota.push('<span class="tag bad">sin corrección de cero</span>');
        if (g.o.patron) { const v = M.valorVerdadero(ST.banco, g.o.id, g.a.id), dif = g.st.media - v; nota.push(`<span class="tag ${Math.abs(dif) <= 2 * g.u ? 'ok' : 'bad'}">${Math.abs(dif) <= 2 * g.u ? 'concuerda con el certificado' : 'difiere del certificado en ' + fmt(dif, 3) + ' mm'}</span>`); }
        if (g.st.n < 3) nota.push('<span class="tag">pocas lecturas</span>');
        return `<tr><td>${esc(g.I.corto)}</td><td>${esc(nombreGrupo(g))}</td><td class="num">${g.st.n}</td><td class="num">${fmt(g.st.media, g.I.dec + 1)}</td><td class="num">${fmt(g.st.s, 4)}</td><td class="num">${fmt(g.u, 4)}</td><td><b>${resTxt(g, 'mm')}</b></td><td>${nota.join(' ')}</td></tr>`;
      }).join('') + '</tbody>';
    const f = $('tablaFilas');
    f.innerHTML = ST.filas.length ? '<thead><tr><th>#</th><th>Hora</th><th>Instrumento</th><th>Pieza</th><th class="num">Punto / giro</th><th>Cierre</th><th class="num">F (N)</th><th class="num">Lectura</th><th class="num">En mm</th><th></th></tr></thead><tbody>' +
      ST.filas.map((r) => `<tr class="${r.ok ? '' : 'mal'}"><td>${r.id}</td><td>${r.hora}</td><td>${esc(M.instr(r.instrId).corto)}</td><td>${esc(nombreFila(r))}</td><td class="num">${r.pos} % / ${r.ang}°</td><td>${r.metodo === 'tambor' ? 'tambor' : (r.metodo ? 'trinquete' : '—')}</td><td class="num">${fmt(r.F, 1)}</td><td class="num">${fmt(r.val, 4)} ${unSim(r.un)}</td><td class="num">${fmt(r.mm, 4)}</td><td>${r.ok ? '' : '⚠'} <button class="btn ghost small-btn" data-del="${r.id}" type="button" aria-label="Borrar la lectura ${r.id}">Borrar</button></td></tr>`).join('') + '</tbody>' : '<tbody><tr><td class="muted">Sin lecturas.</td></tr></tbody>';
    f.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { ST.filas = ST.filas.filter((x) => x.id !== +b.dataset.del); guardar(); renderCuaderno(); renderUltimas(); renderGuia(); }));
    // selector de conversión
    const sel = $('selConv'), prev = sel.value; sel.innerHTML = '';
    G.forEach((g) => sel.add(new Option(`${g.I.corto} · ${nombreGrupo(g)}: ${resTxt(g, 'mm')}`, g.k)));
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
    renderConv();
  }
  function renderConv() {
    const G = grupos(), g = G.find((x) => x.k === $('selConv').value) || G[0], t = $('tablaConv');
    if (!g) { t.innerHTML = '<tbody><tr><td class="muted">Sin resultados todavía.</td></tr></tbody>'; return; }
    const rows = ['km', 'm', 'cm', 'mm', 'um', 'nm', 'in', 'ft', 'mil'].map((un) => {
      const f = 1 / M.UNIDADES[un].mm, v = g.st.media * f, uu = g.u * f;
      const r = M.redondeoInc(v, uu);
      let num;
      if (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4) { const e = Math.floor(Math.log10(Math.abs(v))), q = Math.pow(10, e), rs = M.redondeoInc(v / q, uu / q); num = '(' + fmt(rs.v, rs.dec) + ' ± ' + fmt(rs.u, rs.dec) + ')×10<sup>' + e + '</sup>'; }
      else num = fmt(r.v, r.dec) + ' ± ' + fmt(r.u, r.dec);
      return `<tr><td>${esc(M.UNIDADES[un].nombre)}</td><td>${unSim(un)}</td><td class="num">× ${M.cifras(M.UNIDADES.mm.mm / M.UNIDADES[un].mm, 6)}</td><td class="num"><b>${num}</b> ${unSim(un)}</td></tr>`;
    }).join('');
    t.innerHTML = '<thead><tr><th>Unidad</th><th>Símbolo</th><th class="num">Factor desde mm</th><th class="num">Resultado</th></tr></thead><tbody>' + rows + '</tbody>';
  }
  $('selConv').addEventListener('change', () => { ST.flags.conv = true; guardar(); renderConv(); renderGuia(); });

  /* densidad */
  function renderDens() {
    const sel = $('selDens'), prev = sel.value, G = grupos();
    sel.innerHTML = '';
    M.OBJETOS.filter((o) => o.masa).forEach((o) => {
      const dims = o.vol.slice(1), faltan = dims.filter((d) => !G.some((g) => g.objId === o.id && g.attrId === d));
      sel.add(new Option(o.nombre + (faltan.length ? ' — faltan: ' + faltan.map((d) => o.attrs.find((a) => a.id === d).nombre).join(', ') : ' — listo'), o.id));
    });
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
    const o = M.objeto(sel.value), out = $('densOut'); if (!o) return;
    const dims = o.vol.slice(1), best = {};
    dims.forEach((d) => { const c = G.filter((g) => g.objId === o.id && g.attrId === d).sort((a, b) => a.u / a.st.media - b.u / b.st.media)[0]; if (c) best[d] = c; });
    const faltan = dims.filter((d) => !best[d]);
    const ms = M.masaPieza(ST.banco, o.id);
    if (faltan.length) { out.innerHTML = `<p class="aviso">Para calcular el volumen de <b>${esc(o.nombre)}</b> falta medir: ${faltan.map((d) => esc(o.attrs.find((a) => a.id === d).nombre)).join(', ')}. Hágalo en la práctica y anote al menos 3 lecturas de cada una.</p><p class="small">Masa en la balanza: <b>${fmt(ms, 2)} g</b>.</p>`; return; }
    const x = {}, ux = {}; dims.forEach((d) => { x[d] = best[d].st.media; ux[d] = best[d].u; });
    const V = M.volumen(o.vol[0], x); let v2 = 0;
    dims.forEach((d) => { const h = Math.max(1e-6, x[d] * 1e-6), a = Object.assign({}, x), b = Object.assign({}, x); a[d] += h; b[d] -= h; const dv = (M.volumen(o.vol[0], a) - M.volumen(o.vol[0], b)) / (2 * h); v2 += (dv * ux[d]) * (dv * ux[d]); });
    const uV = Math.sqrt(v2), um = 0.005, rho = ms / (V / 1000), urho = rho * Math.sqrt((um / ms) ** 2 + (uV / V) ** 2);
    const rr = M.redondeoInc(rho, urho), rV = M.redondeoInc(V / 1000, uV / 1000);
    const cand = M.MATERIALES.map((mm) => ({ n: mm.n, rho: mm.rho, z: Math.abs(mm.rho - rho) / urho })).sort((a, b) => a.z - b.z);
    const compat = cand.filter((c) => c.z <= 2.5);
    const usados = dims.map((d) => `${esc(o.attrs.find((a) => a.id === d).nombre)} = ${resTxt(best[d], 'mm')} (${esc(best[d].I.corto)})`).join('<br>');
    const rel = (uV / V * 100);
    out.innerHTML = `<div class="dens-grid"><div class="dens-box"><span>Volumen</span><b>${fmt(rV.v, rV.dec)} ± ${fmt(rV.u, rV.dec)} cm³</b><br><small>incertidumbre relativa ${fmt(rel, 2)} %</small></div>
      <div class="dens-box"><span>Masa (balanza)</span><b>${fmt(ms, 2)} ± 0,005 g</b></div>
      <div class="dens-box"><span>Densidad</span><b>${fmt(rr.v, rr.dec)} ± ${fmt(rr.u, rr.dec)} g/cm³</b><br><small>= ${fmt(rr.v * 1000, Math.max(0, rr.dec - 3))} ± ${fmt(rr.u * 1000, Math.max(0, rr.dec - 3))} kg/m³</small></div></div>
      <p class="small"><b>Datos usados</b> (los de menor incertidumbre relativa):<br>${usados}</p>
      <p class="formula">V = ${{ esfera: 'π D³ / 6', cilindro: o.vol[2] === 'e' ? 'π D² e / 4' : 'π D² L / 4', bloque: 'a · b · ' + o.vol[3], arandela: 'π (De² − Di²) e / 4', tubo: 'π (De² − Di²) L / 4' }[o.vol[0]]} &nbsp;·&nbsp; ρ = m / V &nbsp;·&nbsp; u(V) por propagación de las incertidumbres de cada medida</p>
      <p><b>Material:</b> ${compat.length ? 'compatible con ' + compat.slice(0, 3).map((c) => `<b>${c.n}</b> (${fmt(c.rho, 2)} g/cm³)`).join(', ') + ' (dentro de 2,5 incertidumbres).' : 'ninguno de la tabla coincide dentro de la incertidumbre; revise las medidas. El más cercano es ' + cand[0].n + '.'}</p>
      <p class="small muted">Una incertidumbre pequeña separa mejor materiales parecidos (acero 7,85 · latón 8,50 · bronce 8,80 · cobre 8,96 g/cm³): por eso importa medir el diámetro con el micrómetro.</p>`;
    if (!ST.flags.dens) { ST.flags.dens = true; guardar(); renderGuia(); }
  }
  $('selDens').addEventListener('change', renderDens);

  function renderBitacora() { $('bitacora').innerHTML = ST.log.slice().reverse().map((l) => '<div>' + esc(l) + '</div>').join('') || '<div>Sin acciones registradas.</div>'; }
  function renderCuaderno() { renderResolucion(); renderCero(); renderTabla(); renderDens(); renderBitacora(); }

  /* exportación */
  function csv() {
    const L = ['hora;banco;grupo;instrumento;pieza;punto_%;giro_deg;cierre;fuerza_N;lectura;unidad;lectura_mm;coincide;tipo'];
    ST.filas.forEach((r) => L.push([r.hora, r.banco, '"' + (ST.grupo || '').replace(/"/g, '""') + '"', M.instr(r.instrId).corto, '"' + nombreFila(r) + '"', r.pos, r.ang, r.metodo, String(r.F).replace('.', ','), String(r.val).replace('.', ','), unSim(r.un), String(Math.round(r.mm * 1e5) / 1e5).replace('.', ','), r.ok ? 'sí' : 'no', r.tipo].join(';')));
    L.push(''); L.push('Resultados;;;;;;;;;;;;;');
    grupos().forEach((g) => L.push(['', '', '', g.I.corto, '"' + nombreGrupo(g) + '"', '', '', 'n=' + g.st.n, '', resTxt(g, 'mm'), '', '', '', ''].join(';')));
    return L.join('\n');
  }
  $('btnCSV').addEventListener('click', () => entregar('metrologia_banco' + String(ST.banco).padStart(2, '0') + '.csv', csv()));
  $('btnJSON').addEventListener('click', () => entregar('metrologia_banco' + String(ST.banco).padStart(2, '0') + '.json', JSON.stringify({ banco: ST.banco, grupo: ST.grupo, filas: ST.filas, resultados: grupos().map((g) => ({ instrumento: g.I.corto, pieza: nombreGrupo(g), n: g.st.n, media_mm: g.st.media, s_mm: g.st.s, u_mm: g.u })), log: ST.log, entrenador: ST.ent }, null, 1)));
  $('btnBorrar').addEventListener('click', () => confirmar('Borrar el cuaderno', 'Se eliminarán todas las lecturas, la bitácora y las comprobaciones de resolución. No se puede deshacer.', () => {
    const b = ST.banco, g = ST.grupo; ST = nuevo(); ST.banco = b; ST.grupo = g; guardar(); iniciaControles(); renderCuaderno(); renderUltimas(); renderGuia(); entStats(); toast('Cuaderno borrado.');
  }));

  /* ======================================================================
     TEORÍA
     ====================================================================== */
  const EJ = [{ id: 'v010', mm: 23.7 }, { id: 'v005', mm: 37.45 }, { id: 'v002', mm: 61.36 }, { id: 'vin', in: 2.337 }, { id: 'm010', mm: 7.34 }, { id: 'm001', mm: 12.583 }, { id: 'min', in: 0.472 }];
  function montaEjemplos() {
    $('ejemplos').innerHTML = EJ.map((e, i) => {
      const I = M.instr(e.id), p = e.mm !== undefined ? e.mm : e.in * 25.4, L = M.lectura(I, p);
      return `<div class="ej"><div><h3>${i + 1}. ${esc(I.nombre)}</h3><canvas id="ej${i}" aria-label="Escala de ${esc(I.nombre)} con la lectura ${fmt(L.valor, I.dec)} ${I.unidad}"></canvas></div><div><h3>Lectura: ${fmt(L.valor, I.dec)} ${I.unidad}</h3><ol>${M.pasos(I, p).map((s) => '<li>' + s + '</li>').join('')}</ol><p class="small muted">En otras unidades: ${fmt(M.convertir(L.valor, I.unidad, 'mm'), 4)} mm = ${fmt(M.convertir(L.valor, I.unidad, 'cm'), 5)} cm = ${fmt(M.convertir(L.valor, I.unidad, 'in'), 5)} in.</p></div></div>`;
    }).join('');
  }
  function dibujaEjemplos() {
    EJ.forEach((e, i) => {
      const c = $('ej' + i); if (!c) return; const I = M.instr(e.id), p = e.mm !== undefined ? e.mm : e.in * 25.4;
      const f = R.fit(c, I.tipo === 'vernier' ? 0.3 : 0.46); if (!f) return;
      (I.tipo === 'vernier' ? R.lupaVernier : R.lupaMicro)(f.ctx, f.W, f.H, { I, p, par: 0, ayuda: true, lens: null });
    });
  }
  function conversor() {
    const sel = $('cvUn'); UN_LISTA.forEach((x) => sel.add(new Option(unSim(x) + ' · ' + M.UNIDADES[x].nombre, x))); sel.value = 'mm';
    const calc = () => {
      const v = parseNum($('cvVal').value), un = sel.value, t = $('cvOut');
      if (!Number.isFinite(v)) { t.innerHTML = '<tbody><tr><td>Escriba un número.</td></tr></tbody>'; return; }
      t.innerHTML = '<tbody>' + ['km', 'm', 'cm', 'mm', 'um', 'nm', 'in', 'ft', 'mil'].map((x) => `<tr><td>${esc(M.UNIDADES[x].nombre)} (${unSim(x)})</td><td class="num"><b>${M.cifras(M.convertir(v, un, x), 6)}</b></td></tr>`).join('') + '</tbody>';
    };
    $('cvVal').addEventListener('input', calc); sel.addEventListener('change', calc); calc();
    const cz = () => {
      const L = parseNum($('czL').value), e = parseNum($('czE').value), r = parseNum($('czR').value);
      if (![L, e, r].every(Number.isFinite)) { $('czOut').textContent = 'Complete los tres datos.'; return; }
      const d = Math.max(0, Math.ceil(-Math.log10(r) - 1e-9));
      $('czOut').textContent = `Valor corregido = ${fmt(L, d)} − (${fmt(e, d)}) = ${fmt(L - e, d)} mm · incertidumbre ≈ ±${fmt(Math.sqrt(2) * r / 2, d + 1)} mm (resolución y cero)`;
    };
    ['czL', 'czE', 'czR'].forEach((id) => $(id).addEventListener('input', cz)); cz();
    const rs = () => {
      const a = parseNum($('rsA').value), n = parseNum($('rsN').value), p = parseNum($('rsP').value), t = parseNum($('rsT').value);
      const v = Number.isFinite(a / n) ? `Vernier: r = ${fmt(a, 3)} / ${fmt(n, 0)} = ${fmt(a / n, 4)} mm` : 'Vernier: complete los datos';
      const m = Number.isFinite(p / t) ? `Micrómetro: r = ${fmt(p, 3)} / ${fmt(t, 0)} = ${fmt(p / t, 4)} mm` : 'Micrómetro: complete los datos';
      $('rsOut').textContent = v + '   ·   ' + m;
    };
    ['rsA', 'rsN', 'rsP', 'rsT'].forEach((id) => $(id).addEventListener('input', rs)); rs();
  }

  const QUIZ = [
    { q: 'Un calibrador tiene la regla dividida en milímetros y un nonio de 50 divisiones. ¿Cuál es su resolución?', o: ['0,1 mm', '0,05 mm', '0,02 mm', '0,01 mm'], c: 2, e: 'r = 1 mm / 50 = 0,02 mm.' },
    { q: 'En un vernier de 0,05 mm, el cero del nonio pasó la marca de 23 mm y la línea 7 del nonio coincide con una de la regla. ¿Qué lee?', o: ['23,07 mm', '23,35 mm', '23,70 mm', '30 mm'], c: 1, e: '23 + 7 × 0,05 = 23,35 mm.' },
    { q: 'Con las mordazas cerradas, un micrómetro marca +0,02 mm. Al medir una pieza lee 7,46 mm. ¿Cuánto mide la pieza?', o: ['7,48 mm', '7,44 mm', '7,46 mm', '7,42 mm'], c: 1, e: 'Se resta el error de cero: 7,46 − 0,02 = 7,44 mm.' },
    { q: 'Convierta 0,5000 in a milímetros.', o: ['1,27 mm', '12,70 mm', '127,0 mm', '0,0197 mm'], c: 1, e: '0,5000 in × 25,4 mm/in = 12,70 mm.' },
    { q: '¿Cuántos micrómetros (µm) hay en 1,25 mm?', o: ['0,00125 µm', '12,5 µm', '125 µm', '1250 µm'], c: 3, e: '1 mm = 1000 µm, entonces 1,25 mm = 1250 µm.' },
    { q: 'Va a medir el diámetro de un cordón de caucho con el micrómetro. ¿Cómo cierra?', o: ['Girando el tambor hasta que no se mueva', 'Con el trinquete hasta que patine', 'Apretando el marco con la otra mano', 'Da igual'], c: 1, e: 'El trinquete limita la fuerza; con el tambor se aplasta el caucho y la lectura baja.' },
    { q: 'El error de cero es un error…', o: ['aleatorio, se reduce promediando', 'sistemático, se corrige restándolo', 'del observador que no se puede corregir', 'que desaparece al repetir la medida'], c: 1, e: 'Siempre actúa en el mismo sentido y con el mismo valor: se corrige.' },
    { q: 'Escriba correctamente un diámetro medido: promedio 12,3512 mm con incertidumbre 0,0273 mm.', o: ['12,3512 ± 0,0273 mm', '12,35 ± 0,03 mm', '12,4 ± 0,03 mm', '12 ± 0,0273 mm'], c: 1, e: 'La incertidumbre lleva 1–2 cifras significativas (0,03) y el valor se redondea a la misma posición decimal (12,35).' },
    { q: 'Mirando el nonio de reojo, la línea que parecía coincidir cambia. ¿Cómo se llama este efecto?', o: ['Dilatación térmica', 'Paralaje', 'Histéresis', 'Ruido electrónico'], c: 1, e: 'Paralaje: la escala móvil y la fija no están en el mismo plano, y la posición del ojo las desplaza aparentemente.' },
    { q: 'En el micrómetro métrico el manguito muestra 7 mm completos y la marca de 0,5 mm ya está descubierta; el tambor marca 34. ¿Qué lee?', o: ['7,34 mm', '7,84 mm', '7,534 mm', '7,5034 mm'], c: 1, e: '7 + 0,5 + 34 × 0,01 = 7,84 mm. Error clásico: olvidar la media división.' },
  ];
  function montaQuiz() {
    $('quiz').innerHTML = QUIZ.map((q, i) => `<div class="quiz-q"><p>${i + 1}. ${esc(q.q)}</p>${q.o.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}<div class="exp-q" id="qe${i}" hidden></div></div>`).join('');
    QUIZ.forEach((q, i) => {
      document.querySelectorAll(`input[name=q${i}]`).forEach((r) => r.addEventListener('change', () => {
        const ok = +r.value === q.c; ST.quiz[i] = ok ? 1 : 0; guardar();
        const e = $('qe' + i); e.hidden = false; e.style.background = ok ? 'var(--okbg)' : 'var(--badbg)'; e.innerHTML = (ok ? '✓ Correcto. ' : '✗ Revise. ') + esc(q.e); quizTotal();
      }));
      if (ST.quiz[i] !== undefined) { /* respuestas previas no se restauran para poder repetir */ }
    });
    quizTotal();
  }
  function quizTotal() {
    const n = Object.keys(ST.quiz).length, ok = Object.values(ST.quiz).reduce((a, b) => a + b, 0);
    $('quizTotal').textContent = n ? `Llevas ${ok} de ${QUIZ.length} correctas (${n} respondidas).` : '';
  }

  /* ======================================================================
     DOCENTE
     ====================================================================== */
  $('docForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('docClave').value === CLAVE_DOC) { $('docGate').hidden = true; $('docBody').hidden = false; renderDocente(); }
    else $('docMsg').textContent = 'Clave incorrecta.';
  });
  function renderDocente() {
    const n = ST.banco, bco = M.banco(n);
    let h = `<div class="panel"><h2>Banco ${String(n).padStart(2, '0')} · instrumentos</h2><p class="small muted">Valores que el banco le impone al estudiante. El error de cero se detecta cerrando las mordazas con la forma de cerrar que se usa para medir.</p><div class="tabla-scroll"><table class="tabla compacta"><thead><tr><th>Instrumento</th><th class="num">Error de cero (cuentas)</th><th class="num">e₀ (mm)</th><th class="num">Rigidez marco (N/mm)</th><th class="num">Fuerza trinquete (N)</th></tr></thead><tbody>` +
      M.INSTRUMENTOS.map((I) => { const B = bco.instr[I.id]; return `<tr><td>${esc(I.corto)}</td><td class="num">${B.z > 0 ? '+' : ''}${B.z}</td><td class="num">${fmt(B.e0, 4)}</td><td class="num">${fmt(B.kframe, 0)}</td><td class="num">${I.tipo === 'micro' ? fmt(B.Fr, 1) : '—'}</td></tr>`; }).join('') + '</tbody></table></div></div>';
    h += `<div class="panel"><h2>Piezas · valores de referencia de este banco</h2><p class="small muted">«Verdadero» es el promedio de la pieza concreta; el intervalo recorre todos los puntos y giros posibles (conicidad, ovalidad y rugosidad). Un grupo cuidadoso debería quedar dentro del intervalo.</p><div class="tabla-scroll"><table class="tabla compacta"><thead><tr><th>Pieza</th><th>Magnitud</th><th class="num">Nominal</th><th class="num">Verdadero (mm)</th><th class="num">Mínimo – máximo local (mm)</th><th class="num">Masa (g)</th></tr></thead><tbody>`;
    M.OBJETOS.forEach((o) => {
      o.attrs.forEach((a, i) => {
        let mn = 1e9, mx = -1e9; for (let p = 0; p <= 1.0001; p += 0.1) for (let g = 0; g <= 180; g += 15) { const s = M.tamLocal(n, o.id, a.id, p, g * Math.PI / 180); mn = Math.min(mn, s); mx = Math.max(mx, s); }
        const ms = M.masaPieza(n, o.id), d = a.nom < 1 ? 4 : 3;
        h += `<tr><td>${i === 0 ? esc(o.nombre) : ''}</td><td>${esc(a.nombre)}</td><td class="num">${fmt(a.nom, d)}</td><td class="num"><b>${fmt(M.valorVerdadero(n, o.id, a.id), d + 1)}</b></td><td class="num">${fmt(mn, d + 1)} – ${fmt(mx, d + 1)}</td><td class="num">${i === 0 && ms !== null ? fmt(ms, 2) : ''}</td></tr>`;
      });
    });
    h += '</tbody></table></div></div>';
    const G = grupos();
    h += `<div class="panel"><h2>Resultados del estudiante frente al valor verdadero</h2>` + (G.length ? '<div class="tabla-scroll"><table class="tabla compacta"><thead><tr><th>Instrumento</th><th>Magnitud</th><th class="num">n</th><th class="num">Resultado (mm)</th><th class="num">Verdadero (mm)</th><th class="num">Diferencia / u</th><th>Valoración</th></tr></thead><tbody>' + G.map((g) => {
      const v = M.valorVerdadero(n, g.objId, g.attrId), z = (g.st.media - v) / g.u;
      return `<tr><td>${esc(g.I.corto)}</td><td>${esc(nombreGrupo(g))}</td><td class="num">${g.st.n}</td><td class="num">${resTxt(g, 'mm')}</td><td class="num">${fmt(v, 4)}</td><td class="num">${fmt(z, 1)}</td><td>${Math.abs(z) <= 2 ? '<span class="tag ok">consistente</span>' : '<span class="tag bad">revisar (cero, apriete, pocos puntos)</span>'}</td></tr>`;
    }).join('') + '</tbody></table></div>' : '<p class="muted">Sin mediciones.</p>') + '</div>';
    const E = ST.errores, tot = Object.values(E).reduce((a, b) => a + b, 0);
    const nombres = { unidad: 'Confusión de unidades', cero: 'Restó el cero en la lectura bruta', paso: 'Vuelta / división de la escala principal', cerca: 'Línea vecina del nonio o del tambor', otra: 'Lectura equivocada', lejos: 'Lectura muy distinta' };
    h += `<div class="panel"><h2>Diagnóstico de errores de lectura</h2>` + (tot ? '<ul>' + Object.entries(E).map(([k, v]) => `<li>${esc(nombres[k] || k)}: <b>${v}</b></li>`).join('') + '</ul>' : '<p class="muted">Sin errores de lectura registrados.</p>') +
      `<p class="small">Entrenador: ${ST.ent.ok}/${ST.ent.total} aciertos a la primera · mejor racha ${ST.ent.mejor}. Cuestionario: ${Object.values(ST.quiz).reduce((a, b) => a + b, 0)}/${QUIZ.length} correctas. Ayudas de lectura pedidas: ${ST.flags.ayudaLectura || 0}.</p></div>`;
    h += `<div class="panel"><h2>Sugerencias de uso</h2><ol><li>Asigne un banco por grupo (1–24); los errores de cero y las piezas difieren, así que los datos no se pueden copiar.</li><li>Pida: resolución, cero, un bloque patrón, una pieza con ≥5 puntos, un material blando con ambos cierres y la densidad de una pieza con masa.</li><li>Evalúe: corrección del cero, cifras significativas, u con 1–2 cifras, conversión de unidades y el análisis de por qué el micrómetro separa mejor los materiales.</li></ol></div>`;
    $('docBody').innerHTML = h;
  }

  /* ======================================================================
     NAVEGACIÓN
     ====================================================================== */
  let vista = 'practica';
  function mostrar(tab) {
    if (!['practica', 'entrenador', 'cuaderno', 'teoria', 'docente'].includes(tab)) tab = 'practica';
    vista = tab;
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== 'v-' + tab; });
    document.querySelectorAll('.nav a').forEach((a) => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (tab === 'cuaderno') renderCuaderno();
    if (tab === 'entrenador') { if (!ENT.q) entNueva(); }
    window.scrollTo(0, 0);
    requestAnimationFrame(() => { dibujar(); setTimeout(dibujar, 120); });
  }
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h.startsWith('t-')) { mostrar('teoria'); setTimeout(() => { const el = document.getElementById(h); if (el) el.scrollIntoView(); }, 50); } else mostrar(h); });
  window.addEventListener('resize', () => pedir());
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pedir);

  function iniciaControles() {
    $('selBanco').value = ST.banco; $('inpGrupo').value = ST.grupo; topChip();
    $('selInstr').value = ST.instrId; $('selObj').value = ST.objId; $('selMetodo').value = ST.metodo;
    $('rngPos').value = Math.round(ST.pos * 100); $('outPos').textContent = Math.round(ST.pos * 100) + ' %';
    $('rngAng').value = ST.angDeg; $('outAng').textContent = ST.angDeg + '°';
    aplicaMontaje();
    $('entInstr').value = ST.ent.instrId;
  }

  /* ---------- arranque ---------- */
  cargar();
  llenaSelects();
  M.INSTRUMENTOS.forEach((I) => $('entInstr').add(new Option(I.nombre, I.id)));
  conversor(); montaEjemplos(); montaQuiz();
  iniciaControles(); renderUltimas(); renderGuia(); entStats();
  bit('Sesión iniciada · banco ' + ST.banco);
  const h0 = location.hash.slice(1);
  if (h0.startsWith('t-')) { mostrar('teoria'); setTimeout(() => { const el = document.getElementById(h0); if (el) el.scrollIntoView(); }, 200); } else mostrar(h0 || 'practica');
  document.fonts && document.fonts.ready && document.fonts.ready.then(pedir);

  /* ganchos para pruebas y capturas */
  window.LAB = { get ST() { return ST; }, set u(v) { u = v; pedir(); }, get u() { return u; }, medir, mostrar, ST_set(f) { f(ST); guardar(); iniciaControles(); pedir(); }, dibujar, setLens(c) { lens = c; pedir(); }, entNueva, ENT: () => ENT, renderCuaderno, renderDocente };
})();
