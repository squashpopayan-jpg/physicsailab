/* Aplicación: navegación, configuración del banco, registro rápido, cuaderno, exportación, guía y panel del docente. */
(function () {
  'use strict';
  const V = VENTURI, E = V.EQUIPO, N = E.tomas.length;
  const $ = (id) => document.getElementById(id);
  const CLAVE = 'venturi-lab-v1';
  const coma = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';
  const hora = () => new Date().toTimeString().slice(0, 8);
  let toastTimer;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200); }

  /* ---------- estado del cuaderno ---------- */
  const vacioMed = () => ({ q: '', h: new Array(N).fill(''), hora: '' });
  function nuevoCuaderno() {
    return {
      grupo: '', banco: 1,
      dim: { D1: '', d: '', beta: '', A1: '', A2: '', ntomas: '' },
      amb: { Tagua: '', Tfin: '', Tamb: '', Patm: '', rho: '', nu: '', g: '' },
      med: Array.from({ length: 6 }, vacioMed),
      ancha: '', garganta: '', cero: new Array(N).fill(''),
      vol: Array.from({ length: 3 }, () => ({ q: '', Vi: '', Vf: '', t: '' })),
      obs: '', checks: {},
    };
  }
  let nb = nuevoCuaderno();

  /* ---------- almacenamiento local ---------- */
  let guardarTimer = null;
  function claveStorage(b) { return 'venturi-lab-v1-b' + (b || nb.banco || 1); }
  function guardar() {
    clearTimeout(guardarTimer);
    guardarTimer = setTimeout(() => {
      try {
        const payload = JSON.stringify({ v: 1, nb, sim: BENCH.guardable(), log: BENCH.log });
        localStorage.setItem(CLAVE, payload);
        localStorage.setItem(claveStorage(nb.banco), payload);
      } catch (e) { /* almacenamiento no disponible */ }
    }, 400);
  }
  function cargar(b) {
    try {
      const s = b ? localStorage.getItem(claveStorage(b)) : (localStorage.getItem(CLAVE) || localStorage.getItem(claveStorage(1)));
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  /* ---------- confirmación dentro de la página ---------- */
  function confirmar(titulo, texto, si) {
    $('confirmTitle').textContent = titulo; $('confirmText').textContent = texto; $('confirmBox').hidden = false; $('confirmYes').focus();
    const cerrar = () => { $('confirmBox').hidden = true; $('confirmYes').onclick = null; $('confirmNo').onclick = null; };
    $('confirmYes').onclick = () => { cerrar(); si(); };
    $('confirmNo').onclick = cerrar;
  }

  /* ---------- archivos ---------- */
  async function entregar(nombre, contenido) {
    const enMarco = !!(window.claude && typeof window.claude.use === 'function');
    if (enMarco) {
      let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
      if (dl) {
        try { await dl.save({ filename: nombre, data: contenido }); toast('Archivo entregado: ' + nombre); }
        catch (e) { toast(e && e.code === 'declined' ? 'Descarga cancelada.' : 'No se pudo descargar el archivo en esta vista.'); }
        return;
      }
      mostrarCopia(nombre, contenido); return;
    }
    const ext = nombre.split('.').pop(), tipo = { csv: 'text/csv;charset=utf-8', json: 'application/json' }[ext] || 'text/plain';
    const url = URL.createObjectURL(new Blob([ext === 'csv' ? '﻿' + contenido : contenido], { type: tipo })), a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Descarga preparada: ' + nombre);
  }
  function mostrarCopia(nombre, contenido) {
    $('copyName').textContent = nombre; $('copyText').value = contenido; $('copyBox').hidden = false; $('copyText').focus(); $('copyText').select();
  }
  $('copyClose').addEventListener('click', () => { $('copyBox').hidden = true; });
  $('copyBtn').addEventListener('click', () => {
    const t = $('copyText');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(() => toast('Copiado.'), () => { t.select(); toast('Seleccionado: use Ctrl+C.'); });
    else { t.select(); toast('Seleccionado: use Ctrl+C.'); }
  });
  const sello = () => { const d = new Date(); return d.toISOString().slice(0, 10); };
  const archivoBase = () => `venturi_banco${String(nb.banco).padStart(2, '0')}_${sello()}`;
  function celda(x) { const s = String(x === undefined || x === null ? '' : x); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function csv() {
    const f = [], fila = (...xs) => f.push(xs.map(celda).join(';'));
    fila('Laboratorio virtual · Tubo de Venturi · Física de Fluidos');
    fila('Integrantes', nb.grupo); fila('Banco N.º', nb.banco); fila('Exportado', new Date().toLocaleString('es-CO'));
    fila('');
    fila('Tabla 2 · Dimensiones del tubo de Venturi'); fila('Parámetro', 'Símbolo', 'Valor');
    DIM.forEach((d) => fila(d.nombre, d.sim, nb.dim[d.k]));
    fila('');
    fila('Tabla 3 · Condiciones ambientales'); fila('Parámetro', 'Valor');
    AMB.forEach((d) => fila(d.nombre, nb.amb[d.k]));
    fila('');
    fila('Tabla 4 · Alturas manométricas [mm]'); fila('N.º', 'Qrot [L/min]', ...E.tomas.map((t) => 'h' + t.id), 'Hora');
    nb.med.forEach((m, k) => fila(k + 1, m.q, ...m.h, m.hora));
    fila('Toma de la sección ancha', nb.ancha); fila('Toma de la garganta', nb.garganta);
    fila('');
    fila('Verificación del cero [mm]'); fila(...E.tomas.map((t) => 'h' + t.id)); fila(...nb.cero);
    fila('');
    fila('Calibración volumétrica'); fila('Qrot [L/min]', 'V inicial [L]', 'V final [L]', 't [s]');
    nb.vol.forEach((v) => fila(v.q, v.Vi, v.Vf, v.t));
    fila('');
    fila('Observaciones'); fila(nb.obs);
    fila('');
    fila('Bitácora del banco'); fila('Hora', 'Tiempo de sesión', 'Acción');
    BENCH.log.forEach((e) => fila(e.reloj, e.t, e.msg));
    return f.join('\r\n');
  }

  /* ---------- navegación ---------- */
  const TABS = ['banco', 'cuaderno', 'guia'];
  function navegar() {
    const k = location.hash.slice(1), tab = TABS.includes(k) ? k : 'banco';
    TABS.forEach((t) => { $('v-' + t).hidden = t !== tab; });
    document.querySelectorAll('.nav a').forEach((a) => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (tab === 'cuaderno') pintarCuaderno();
  }
  window.addEventListener('hashchange', () => { navegar(); window.scrollTo(0, 0); });

  /* ---------- configuración del banco ---------- */
  const sel = $('selBanco');
  for (let n = 1; n <= E.numBancos; n++) { const o = document.createElement('option'); o.value = n; o.textContent = 'N.º ' + String(n).padStart(2, '0'); sel.append(o); }
  function pintarCabecera() {
    $('topBanco').textContent = String(nb.banco).padStart(2, '0');
    $('topGrupo').textContent = nb.grupo ? '· ' + nb.grupo : '';
    $('placaSerie').textContent = 'VT-2026-' + String(nb.banco).padStart(2, '0');
    sel.value = nb.banco; $('inpGrupo').value = nb.grupo;
  }
  $('setupForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const n = +sel.value, g = $('inpGrupo').value.trim();
    const aplicar = () => {
      const cambia = n !== nb.banco;
      if (cambia) {
        const previoNuevo = cargar(n);
        if (previoNuevo && previoNuevo.nb) {
          nb = Object.assign(nuevoCuaderno(), previoNuevo.nb);
          if (g) nb.grupo = g;
          BENCH.setBanco(n, previoNuevo.sim || null, previoNuevo.log || []);
        } else {
          nb.banco = n;
          nb.grupo = g;
          BENCH.setBanco(n, null, []);
        }
        BENCH.anotar(`Banco N.º ${String(n).padStart(2, '0')} asignado al grupo ${nb.grupo || ''}`);
        pintarCuaderno(); pintarRegN(); pintarChecks();
      } else if (g) {
        nb.grupo = g;
        BENCH.anotar('Integrantes registrados: ' + g);
      }
      pintarCabecera(); guardar(); toast(cambia ? `Banco N.º ${n} listo para el grupo.` : 'Datos del grupo guardados.');
    };
    if (n !== nb.banco && BENCH.log.length > 1) confirmar('¿Cambiar de banco?', 'Se cargarán los datos y condiciones del banco N.º ' + n + ' (burbujas, fuga, temperatura y cuaderno de ese puesto).', aplicar);
    else aplicar();
  });

  /* ---------- registro rápido ---------- */
  const regIn = E.tomas.map((_, i) => $('regh' + i));
  function siguienteFila() { const k = nb.med.findIndex((m) => !m.q && m.h.every((x) => !x)); return k < 0 ? nb.med.length : k; }
  function pintarRegN() { $('regN').textContent = 'Medición N.º ' + (siguienteFila() + 1); }
  regIn.forEach((inp, i) => inp.addEventListener('focus', () => BENCH.selectTube(i)));
  $('regQ').addEventListener('focus', () => BENCH.selectLupa2('rot'));
  $('regForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = $('regQ').value.trim(), h = regIn.map((x) => x.value.trim());
    if (!q && h.every((x) => !x)) { toast('Escriba al menos una lectura antes de guardar.'); return; }
    const k = siguienteFila();
    if (k >= nb.med.length) nb.med.push(vacioMed());
    nb.med[k] = { q, h, hora: hora() };
    BENCH.anotar(`Medición N.º ${k + 1} guardada en la tabla 4 (Qrot = ${q || '—'} L/min)`, 'registro');
    $('regQ').value = ''; regIn.forEach((x) => { x.value = ''; });
    pintarRegN(); guardar(); toast(`Medición N.º ${k + 1} guardada.`);
    $('regQ').focus();
  });
  $('regCero').addEventListener('click', () => {
    const h = regIn.map((x) => x.value.trim());
    if (h.every((x) => !x)) { toast('Escriba las ocho alturas con la válvula cerrada.'); return; }
    nb.cero = h; regIn.forEach((x) => { x.value = ''; });
    BENCH.anotar('Verificación del cero guardada', 'registro'); guardar(); toast('Verificación del cero guardada.');
  });

  /* ---------- cuaderno ---------- */
  const DIM = [
    { k: 'D1', nombre: 'Diámetro de la sección ancha [mm]', sim: 'D₁' }, { k: 'd', nombre: 'Diámetro de la garganta [mm]', sim: 'd' },
    { k: 'beta', nombre: 'Relación de diámetros', sim: 'β = d/D₁' }, { k: 'A1', nombre: 'Área de la sección ancha [mm²]', sim: 'A₁' },
    { k: 'A2', nombre: 'Área de la garganta [mm²]', sim: 'A₂' }, { k: 'ntomas', nombre: 'Número de tomas de presión', sim: '—' }];
  const AMB = [
    { k: 'Tagua', nombre: 'Temperatura del agua al inicio T [°C]' }, { k: 'Tfin', nombre: 'Temperatura del agua al final [°C]' },
    { k: 'Tamb', nombre: 'Temperatura ambiente [°C]' }, { k: 'Patm', nombre: 'Presión atmosférica [mbar]' },
    { k: 'rho', nombre: 'Densidad del agua ρ [kg/m³]' }, { k: 'nu', nombre: 'Viscosidad cinemática ν [m²/s]' }, { k: 'g', nombre: 'Gravedad g [m/s²]' }];
  function inp(valor, set, etiqueta, id) {
    const i = document.createElement('input'); i.type = 'text'; i.inputMode = 'decimal'; i.value = valor || ''; i.setAttribute('aria-label', etiqueta);
    if (id) i.id = id;
    i.addEventListener('input', () => { set(i.value); guardar(); if (set.regN) pintarRegN(); });
    return i;
  }
  function td(el, cls) { const c = document.createElement('td'); if (cls) c.className = cls; if (el instanceof Node) c.append(el); else c.textContent = el; return c; }
  function pintarCuaderno() {
    const tD = $('tbDim'); tD.textContent = '';
    DIM.forEach((d) => { const tr = document.createElement('tr'); const th = document.createElement('th'); th.textContent = d.nombre; tr.append(th, td(d.sim), td(inp(nb.dim[d.k], (v) => { nb.dim[d.k] = v; }, d.nombre, 'nbDim_' + d.k))); tD.append(tr); });
    const tA = $('tbAmb'); tA.textContent = '';
    AMB.forEach((d) => { const tr = document.createElement('tr'); const th = document.createElement('th'); th.textContent = d.nombre; tr.append(th, td(inp(nb.amb[d.k], (v) => { nb.amb[d.k] = v; }, d.nombre, 'nbAmb_' + d.k))); tA.append(tr); });
    const tM = $('tbMed'); tM.textContent = '';
    nb.med.forEach((m, k) => {
      const tr = document.createElement('tr');
      const fq = (v) => { m.q = v; }; fq.regN = true;
      tr.append(td(String(k + 1), 'num'), td(inp(m.q, fq, `Medición ${k + 1}: Q del rotámetro`, `nbQ_${k}`)));
      m.h.forEach((x, i) => { const fh = (v) => { m.h[i] = v; }; fh.regN = true; tr.append(td(inp(x, fh, `Medición ${k + 1}: h${E.tomas[i].id}`, `nbH_${k}_${i}`))); });
      tr.append(td(m.hora || '', 'hora'));
      const b = document.createElement('button'); b.className = 'quitar'; b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', `Quitar la medición ${k + 1}`);
      b.addEventListener('click', () => confirmar('¿Quitar esta fila?', `Se borra la medición N.º ${k + 1} del cuaderno.`, () => { nb.med.splice(k, 1); if (!nb.med.length) nb.med.push(vacioMed()); guardar(); pintarCuaderno(); pintarRegN(); }));
      tr.append(td(b)); tM.append(tr);
    });
    const tC = $('tbCero'); tC.textContent = '';
    const trc = document.createElement('tr'); nb.cero.forEach((x, i) => trc.append(td(inp(x, (v) => { nb.cero[i] = v; }, `Cero: h${E.tomas[i].id}`, `nbCero_${i}`)))); tC.append(trc);
    const tV = $('tbVol'); tV.textContent = '';
    nb.vol.forEach((v, k) => {
      const tr = document.createElement('tr');
      ['q', 'Vi', 'Vf', 't'].forEach((c) => tr.append(td(inp(v[c], (x) => { v[c] = x; }, `Calibración ${k + 1}: ${c}`, `nbVol_${k}_${c}`))));
      const b = document.createElement('button'); b.className = 'quitar'; b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', `Quitar la fila ${k + 1} de calibración`);
      b.addEventListener('click', () => { nb.vol.splice(k, 1); guardar(); pintarCuaderno(); });
      tr.append(td(b)); tV.append(tr);
    });
    $('tomaAncha').value = nb.ancha; $('tomaGarg').value = nb.garganta; $('obs').value = nb.obs;
  }
  $('addMed').addEventListener('click', () => { nb.med.push(vacioMed()); guardar(); pintarCuaderno(); });
  $('addVol').addEventListener('click', () => { nb.vol.push({ q: '', Vi: '', Vf: '', t: '' }); guardar(); pintarCuaderno(); });
  $('tomaAncha').addEventListener('input', (e) => { nb.ancha = e.target.value; guardar(); });
  $('tomaGarg').addEventListener('input', (e) => { nb.garganta = e.target.value; guardar(); });
  $('obs').addEventListener('input', (e) => { nb.obs = e.target.value; guardar(); });
  $('btnCSV').addEventListener('click', () => entregar(archivoBase() + '.csv', csv()));
  $('btnJSON').addEventListener('click', () => entregar(archivoBase() + '.json', JSON.stringify({ v: 1, nb, sim: BENCH.guardable(), log: BENCH.log }, null, 1)));
  $('fileJSON').addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !d.nb || !Array.isArray(d.nb.med)) throw new Error('formato');
        nb = Object.assign(nuevoCuaderno(), d.nb);
        BENCH.setBanco(nb.banco, d.sim || null, d.log || []);
        pintarCabecera(); pintarCuaderno(); pintarRegN(); pintarChecks(); guardar(); toast('Respaldo cargado.');
      } catch (e) { toast('Ese archivo no es un respaldo de este laboratorio.'); }
      ev.target.value = '';
    };
    r.readAsText(f);
  });
  $('btnBorrar').addEventListener('click', () => confirmar('¿Borrar el cuaderno?', 'Se borran las tablas, las observaciones y las casillas de la guía. El banco y su bitácora no cambian. Exporte antes si necesita los datos.', () => {
    const { banco, grupo } = nb; nb = nuevoCuaderno(); nb.banco = banco; nb.grupo = grupo; guardar(); pintarCuaderno(); pintarRegN(); pintarChecks(); toast('Cuaderno borrado.');
  }));

  /* ---------- guía: lista de pasos ---------- */
  const PASOS1 = [
    ['Verifique que el tanque del banco esté lleno de agua limpia.', 'El tanque de reserva del banco virtual siempre está lleno. Si el tanque volumétrico tiene agua, ábrale el vaciado.'],
    ['Abra completamente la válvula de regulación.', 'Botón «Abrir del todo» o cinco vueltas del volante.'],
    ['Encienda la bomba y deje circular el agua unos 2 minutos para purgar el aire.', 'Cuente el tiempo con el reloj de pared o el cronómetro. Si una manguera conserva una burbuja, dele golpecitos.'],
    ['Verifique que no haya fugas en las conexiones.', 'Observe la unión entre el Venturi y el rotámetro. Si gotea, apriétela: el agua que se escapa no pasa por el rotámetro.'],
    ['Mida y registre la temperatura del agua.', 'Pantalla «Agua del tanque» (también aparece en el frente del banco).'],
    ['Registre las dimensiones del tubo de Venturi.', 'Placa del equipo, debajo del banco: diámetro y posición de cada toma.'],
    ['Recomendado: verifique el cero.', 'Con la válvula cerrada, las ocho columnas deben quedar al mismo nivel. Anote los ocho valores con «Guardar como verificación del cero».'],
  ];
  const PASOS2 = [
    ['Ajuste el caudal con la válvula hasta la primera lectura del rotámetro.', 'Empiece con un caudal bajo, por ejemplo 4 L/min. Use los botones de ⅛ y 1/32 de vuelta para afinar.'],
    ['Espere unos 30 segundos a que el flujo se estabilice.', 'Las columnas oscilan después de cada cambio. No lea mientras se muevan de forma apreciable.'],
    ['Lea y registre las alturas de todas las columnas, de la A a la H.', 'Con la lupa, en el fondo del menisco y con el ojo a su altura.'],
    ['Registre la lectura del rotámetro.', 'En la arista superior del flotador.'],
    ['Repita los pasos 1 a 4 para al menos 5 caudales, de bajo al máximo posible.', 'El máximo útil lo fija la escala: el rotámetro llega a 20 L/min y la columna de la garganta no debe salir de la escala.'],
    ['Al finalizar, cierre la válvula lentamente y apague la bomba.', 'Quedará anotado en la bitácora.'],
  ];
  function pintarChecks() {
    [['checks1', PASOS1, 'a'], ['checks2', PASOS2, 'b']].forEach(([id, pasos, p]) => {
      const ol = $(id); ol.textContent = '';
      pasos.forEach(([txt, virt], k) => {
        const key = p + k, li = document.createElement('li'), lab = document.createElement('label'), c = document.createElement('input');
        c.type = 'checkbox'; c.id = 'chk_' + key; c.checked = !!nb.checks[key]; li.classList.toggle('hecho', c.checked);
        c.addEventListener('change', () => { nb.checks[key] = c.checked; li.classList.toggle('hecho', c.checked); guardar(); });
        const s = document.createElement('span'); s.textContent = txt; const v = document.createElement('span'); v.className = 'virt'; v.textContent = virt; s.append(v);
        lab.append(c, s); li.append(lab); ol.append(li);
      });
    });
  }
  function notaLupa2(k) { $('notaL2').innerHTML = k === 'rot' ? 'Rotámetro: lea en la <b>arista superior</b> del flotador (su parte más ancha).' : 'Mirilla: lea el <b>fondo del menisco</b> en litros, con el ojo a su altura.'; }

  /* ---------- panel del docente ---------- */
  function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; }
  const HASH_DOCENTE = 2122455255; // bernoulli-unicauca
  const HASH_ADMIN = 2823297577;   // obando-admin-2026
  $('docForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const h = fnv($('docClave').value.trim().toLowerCase());
    if (h !== HASH_DOCENTE && h !== HASH_ADMIN) { $('docError').hidden = false; return; }
    $('docError').hidden = true; $('docTabla').hidden = false; pintarDocente();
  });
  function pintarDocente() {
    const div = $('docTabla'); div.textContent = '';
    const p = document.createElement('p'); p.className = 'small muted';
    p.textContent = 'Valores sin ruido, a la temperatura inicial y con las mangueras purgadas. «Cd con rotámetro» es lo que debería obtener un grupo que mide bien (Qrot/Qteórico con los diámetros nominales); la columna con fuga es para quien no apretó la unión.';
    const wrap = document.createElement('div'); wrap.className = 'table-wrap';
    const t = document.createElement('table'); t.className = 'doc-tab';
    t.innerHTML = '<thead><tr><th>Banco</th><th>T₀ agua [°C]</th><th>Fuga [L/min]</th><th>Burbujas iniciales [mm]</th><th>Error rotámetro a 4 · 10 · 16 · 20 L/min</th><th>Cd real a 6 · 12 · 18 L/min</th><th>Cd con rotámetro</th><th>Cd con rotámetro y fuga</th></tr></thead>';
    const tb = document.createElement('tbody');
    for (let n = 1; n <= E.numBancos; n++) {
      const b = V.banco(n), qs = [6, 12, 18];
      const ref = qs.map((q) => V.referencia(b, q, b.T0, { apretada: true })), refF = qs.map((q) => V.referencia(b, q, b.T0, { apretada: false }));
      const tr = document.createElement('tr');
      [String(n).padStart(2, '0'), coma(b.T0, 1), b.fuga ? coma(b.fuga, 3) : 'no',
        b.burbujas.map((bu) => E.tomas[bu.i].id + ' ' + (bu.off > 0 ? '+' : '') + coma(bu.off, 1)).join(' · '),
        [4, 10, 16, 20].map((q) => (V.errorRot(b, q) >= 0 ? '+' : '') + coma(V.errorRot(b, q), 2)).join(' · '),
        ref.map((r) => coma(r.cd, 3)).join(' · '), ref.map((r) => coma(r.cdRot, 3)).join(' · '),
        b.fuga ? refF.map((r) => coma(r.cdRot, 3)).join(' · ') : '—'].forEach((x) => { const c = document.createElement('td'); c.textContent = x; tr.append(c); });
      tb.append(tr);
    }
    t.append(tb); wrap.append(t); div.append(p, wrap);
    // datos de referencia de un banco
    const box = document.createElement('div'); box.className = 'doc-ref';
    const h = document.createElement('h3'); h.textContent = 'Lecturas de referencia de un banco';
    const row = document.createElement('div'); row.className = 'ctl-row';
    const lab = document.createElement('label'); lab.htmlFor = 'docBanco'; lab.textContent = 'Banco';
    const s = document.createElement('select'); s.id = 'docBanco';
    for (let n = 1; n <= E.numBancos; n++) { const o = document.createElement('option'); o.value = n; o.textContent = 'N.º ' + String(n).padStart(2, '0'); s.append(o); }
    s.value = nb.banco; lab.append(s); row.append(lab);
    const w2 = document.createElement('div'); w2.className = 'table-wrap';
    const pintar = () => {
      const b = V.banco(+s.value), t2 = document.createElement('table'); t2.className = 'doc-tab';
      t2.innerHTML = '<thead><tr><th>Válvula [vueltas]</th><th>Q real [L/min]</th><th>Qrot</th>' + E.tomas.map((x) => `<th>h${x.id}</th>`).join('') + '<th>Δh [mm]</th><th>Re</th><th>Cd rot.</th></tr></thead>';
      const tb2 = document.createElement('tbody');
      [4, 7, 10, 13, 16, 19].forEach((q) => {
        const r = V.referencia(b, q, b.T0, { apretada: true }), tr = document.createElement('tr');
        [coma(V.valvulaPara(b, q), 2), coma(q, 1), coma(r.rot, 2), ...r.h.map((x) => coma(x, 1)), coma(r.dh, 1), Math.round(r.Re), coma(r.cdRot, 3)].forEach((x) => { const c = document.createElement('td'); c.textContent = x; tr.append(c); });
        tb2.append(tr);
      });
      t2.append(tb2); w2.textContent = ''; w2.append(t2);
    };
    s.addEventListener('change', pintar); pintar();
    const nota = document.createElement('p'); nota.className = 'small muted';
    nota.textContent = 'Las alturas incluyen la capilaridad propia de cada tubo. El estudiante verá además oscilaciones de ±0,5 a ±2 mm según el caudal y la toma.';
    box.append(h, row, w2, nota); div.append(box);
  }

  /* ---------- arranque ---------- */
  let previo = cargar();
  const urlP = new URLSearchParams(window.location.search);
  const uBanco = parseInt(urlP.get('banco'), 10);
  const uGrupo = (urlP.get('grupo') || '').trim();
  if (!isNaN(uBanco) && uBanco >= 1 && uBanco <= E.numBancos) {
    const previoB = cargar(uBanco);
    if (previoB && previoB.nb) {
      nb = Object.assign(nuevoCuaderno(), previoB.nb);
      previo = previoB;
    } else {
      nb.banco = uBanco;
    }
    if (uGrupo) nb.grupo = uGrupo;
  } else if (previo && previo.nb) {
    nb = Object.assign(nuevoCuaderno(), previo.nb);
  }

  BENCH.init({
    toast,
    onChange: guardar,
    onTube: (i) => regIn.forEach((x, k) => x.classList.toggle('activo', k === i)),
    onLupa2: notaLupa2,
  });
  BENCH.setBanco(nb.banco, previo && previo.sim, previo && previo.log);
  if (!previo || !previo.log || !previo.log.length) BENCH.anotar(`Sesión iniciada en el banco N.º ${String(nb.banco).padStart(2, '0')}${nb.grupo ? ' · ' + nb.grupo : ''}`);
  pintarCabecera(); pintarRegN(); pintarChecks(); navegar();
  BENCH.selectLupa2('rot');
  window.addEventListener('pagehide', () => { try { localStorage.setItem(CLAVE, JSON.stringify({ v: 1, nb, sim: BENCH.guardable(), log: BENCH.log })); localStorage.setItem(claveStorage(nb.banco), JSON.stringify({ v: 1, nb, sim: BENCH.guardable(), log: BENCH.log })); } catch (e) { /* sin almacenamiento */ } });
})();
