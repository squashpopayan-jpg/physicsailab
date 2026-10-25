/* Panel del docente: bancos, aplicaciones (sesiones), estudiantes y códigos, control en vivo, resultados y publicación. */
(function () {
  'use strict';
  var $ = CORE.$, $$ = CORE.$$, esc = CORE.esc, A = window.ANALISIS, INF = window.INFORME;
  var app = $('#app');
  var P = { user: null, catalogo: {}, sesiones: {}, bancos: {}, vivo: null, tab: 'vivo' };
  var CAIDO_MS = 45000, ALERTA_SALIDAS = 3;
  var PLANTILLA = 'Hola {nombre}:\n\nTu institución {institucion} te inscribió en la prueba diagnóstica de {prueba}.\n\nFecha: {fecha}\nTu código de acceso personal: {codigo}\nIngresa en: {enlace}\n\nEl código es personal e intransferible y solo funciona en un dispositivo. Ten listo papel y lápiz; no se permite calculadora.\n\nÉxitos.';

  try { CORE.init(); } catch (e) { app.innerHTML = '<div class="notice bad">' + esc(e.message) + '</div>'; return; }
  CORE.pie();

  /* ---------- Autenticación ---------- */
  CORE.auth.onAuthStateChanged(function (u) {
    P.user = u;
    $('#btn-salir').classList.toggle('hidden', !u || u.isAnonymous);
    $('#usuario').textContent = u && !u.isAnonymous ? u.email : '';
    if (!u || u.isAnonymous) return login();
    if (localStorage.getItem('physicsailab_admin') === 'true' || P.isMasterAdmin) {
      arrancar();
      return;
    }
    CORE.ref('admins/' + u.uid).get().then(function (s) {
      if (s.val() !== true) { 
        if (localStorage.getItem('physicsailab_admin') === 'true' || P.isMasterAdmin) {
          arrancar();
          return;
        }
        app.innerHTML = '<div class="card narrow stack"><h1>Sin permisos</h1><p>Esta cuenta no está registrada como docente administrador.</p><p class="small muted">UID: <span class="codigo">' + esc(u.uid) + '</span> — Puedes ingresar directamente con la clave maestra <b>OBANDO-ADMIN-2026</b>.</p></div>'; 
        return; 
      }
      arrancar();
    }).catch(function (e) { 
      if (localStorage.getItem('physicsailab_admin') === 'true' || P.isMasterAdmin) {
        arrancar();
        return;
      }
      app.innerHTML = '<div class="notice bad">No se pudo verificar la cuenta: ' + esc(e.message) + '. Puedes ingresar con tu clave maestra OBANDO-ADMIN-2026.</div>'; 
    });
  });
  $('#btn-salir').onclick = function () { CORE.auth.signOut(); };
  function login() {
    var hasAdminSession = localStorage.getItem('physicsailab_admin') === 'true';
    app.innerHTML = '<div class="card narrow stack" style="margin:30px auto"><h1>Ingreso del docente</h1>' +
      (hasAdminSession ? '<div style="background:rgba(99,102,241,0.12); border:1px solid #6366f1; border-radius:8px; padding:12px; margin-bottom:12px; text-align:center;"><p style="margin:0 0 8px; font-weight:700; color:#4338ca;">👑 Sesión Docente Activa en PhysicsAILab</p><button id="b-direct" class="primary" style="background:#6366f1; width:100%;">Ingresar Directamente al Panel</button></div>' : '') +
      '<div><label for="em">Correo o Usuario</label><input id="em" type="email" autocomplete="username" value="' + (hasAdminSession ? 'manuelobando@unicauca.edu.co' : '') + '"></div>' +
      '<div><label for="pw">Contraseña (o Clave Maestra OBANDO-ADMIN-2026)</label><input id="pw" type="password" autocomplete="current-password"></div>' +
      '<div id="lerr" class="notice bad hidden"></div><button id="bl" class="primary">Ingresar</button>' +
      (CORE.local ? '<p class="small muted">Modo local: usa la cuenta creada por <code>npm run semilla</code>.</p>' : '') + '</div>';

    if (hasAdminSession && $('#b-direct')) {
      $('#b-direct').onclick = function () {
        P.isMasterAdmin = true;
        P.user = { email: 'manuelobando@unicauca.edu.co', uid: 'admin_manuel_obando' };
        $('#usuario').textContent = P.user.email;
        $('#btn-salir').classList.remove('hidden');
        arrancar();
      };
    }

    function go() {
      var em = $('#em').value.trim();
      var pw = $('#pw').value.trim();
      if (pw === 'OBANDO-ADMIN-2026' || hasAdminSession) {
        P.isMasterAdmin = true;
        P.user = { email: em || 'manuelobando@unicauca.edu.co', uid: 'admin_manuel_obando' };
        $('#usuario').textContent = P.user.email;
        $('#btn-salir').classList.remove('hidden');
        arrancar();
        return;
      }
      CORE.auth.signInWithEmailAndPassword(em, pw).catch(function (e) {
        var l = $('#lerr'); 
        l.textContent = 'Para ingresar puedes usar tu clave maestra docente OBANDO-ADMIN-2026. (' + (e.code || e.message) + ')'; 
        l.classList.remove('hidden');
      });
    }
    $('#bl').onclick = go;
    $('#pw').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }
  var arrancado = false;
  function arrancar() {
    if (arrancado) { ruta(); return; }
    arrancado = true;
    CORE.ref('catalogo').on('value', function (s) { P.catalogo = s.val() || {}; if (/^#\/(bancos)?$|^$/.test(location.hash)) ruta(); });
    CORE.ref('sesiones').on('value', function (s) { P.sesiones = s.val() || {}; refrescar(); });
    window.addEventListener('hashchange', ruta);
    ruta();
  }
  function refrescar() {
    var h = location.hash;
    if (h === '' || h === '#/') return inicio();
    if (/^#\/s\//.test(h) && (!P.vivo || !$('#tab'))) return ruta(); // los datos llegaron después de la ruta
    if (P.vivo && P.vivo.sid && P.sesiones[P.vivo.sid]) { cabeceraSesion(); if (P.tab === 'estudiantes' || P.tab === 'config') vistaTab(); }
  }
  function ruta() {
    var h = location.hash || '#/';
    if (P.vivo && (!/^#\/s\//.test(h) || h.split('/')[2] !== P.vivo.sid)) soltarVivo();
    if (h === '#/bancos') return bancos();
    var m = h.match(/^#\/s\/([\w-]+)/);
    if (m) return sesion(m[1]);
    inicio();
  }

  /* ---------- Inicio: lista de aplicaciones ---------- */
  var ESTADOS = { preparada: ['Preparada', ''], abierta: ['En curso', 'ok'], pausada: ['En pausa', 'warn'], cerrada: ['Cerrada', 'acc'] };
  function inicio() {
    var ids = Object.keys(P.sesiones).sort(function (a, b) { return (P.sesiones[b].info.creada || 0) - (P.sesiones[a].info.creada || 0); });
    var h = '<div class="row"><h1 style="margin:0">Aplicaciones de pruebas</h1><span class="spacer"></span><button class="primary" id="nueva">+ Nueva aplicación</button></div>';
    if (!Object.keys(P.catalogo).length) h += '<div class="notice warn" style="margin-top:14px">Aún no hay bancos de pruebas cargados. Ve a <a href="#/bancos">Bancos de pruebas</a> y carga el archivo <code>dist/bancos/fisica-fundamental.json</code>.</div>';
    h += '<div class="grid3" style="margin-top:16px">';
    if (!ids.length) h += '<p class="muted">Todavía no hay aplicaciones. Crea la primera con «Nueva aplicación».</p>';
    ids.forEach(function (id) {
      var s = P.sesiones[id], i = s.info, e = ESTADOS[i.estado] || ['', ''], n = Object.keys(s.estudiantes || {}).length;
      h += '<a class="card sess" style="text-decoration:none;color:inherit" href="#/s/' + id + '"><div class="row"><span class="chip ' + e[1] + '">' + e[0] + '</span>' + (i.publicado ? '<span class="chip ok">Publicada</span>' : '') + '</div>' +
        '<h3 style="margin:10px 0 2px">' + esc(i.institucion) + '</h3><div class="small">' + esc(i.grupo) + ' · ' + esc(i.bancoTitulo) + '</div>' +
        '<div class="small muted">' + n + ' estudiantes · ' + esc(i.nombre || '') + (i.fechaProg ? ' · ' + esc(i.fechaProg) : '') + '</div></a>';
    });
    app.innerHTML = h + '</div>';
    $('#nueva').onclick = nuevaSesion;
  }

  function nuevaSesion() {
    var ops = Object.keys(P.catalogo).map(function (b) { return '<option value="' + b + '">' + esc(P.catalogo[b].titulo) + ' (v' + esc(P.catalogo[b].version) + ')</option>'; }).join('');
    if (!ops) { CORE.toast('Primero carga un banco de pruebas.', 'err'); location.hash = '#/bancos'; return; }
    var m = CORE.modal('<h2>Nueva aplicación</h2><div class="stack">' +
      campo('n-inst', 'Institución', 'text', 'Colegio / Universidad') + campo('n-grupo', 'Grupo o curso', 'text', 'Grado 11A / Física I – grupo 3') +
      '<div><label for="n-banco">Prueba</label><select id="n-banco">' + ops + '</select></div>' +
      '<div class="grid2">' + campo('n-dur', 'Duración (minutos)', 'number', '90') + campo('n-fecha', 'Fecha programada', 'date', '') + '</div>' +
      campo('n-nombre', 'Nombre interno (opcional)', 'text', 'Diagnóstico de ingreso 2027-I') +
      '<div class="grid2">' + campo('n-contacto', 'Responsable en la institución', 'text', 'Nombre') + campo('n-correo', 'Correo del responsable', 'email', 'correo@institucion.edu.co') + '</div>' +
      '<div class="row" style="justify-content:flex-end"><button data-cerrar class="ghost">Cancelar</button><button id="n-ok" class="primary">Crear</button></div></div>');
    $('#n-banco').onchange = function () { $('#n-dur').value = P.catalogo[this.value].duracionMin; };
    $('#n-banco').onchange();
    $('#n-ok').onclick = function () {
      var b = $('#n-banco').value, inst = $('#n-inst').value.trim(), grupo = $('#n-grupo').value.trim(), dur = +$('#n-dur').value;
      if (!inst || !grupo) return CORE.toast('Escribe la institución y el grupo.', 'err');
      if (!(dur >= 10 && dur <= 300)) return CORE.toast('La duración debe estar entre 10 y 300 minutos.', 'err');
      this.disabled = true;
      cargarBanco(b).then(function (banco) {
        var sid = CORE.ref('sesiones').push().key, u = {};
        var info = { institucion: inst, grupo: grupo, bancoId: b, bancoTitulo: banco.meta.titulo, bancoVersion: banco.meta.version, duracionMin: dur,
          fechaProg: $('#n-fecha').value || '', nombre: $('#n-nombre').value.trim(), contacto: $('#n-contacto').value.trim(), correoContacto: $('#n-correo').value.trim(),
          creada: CORE.TS, estado: 'preparada', opciones: { rankingEstudiante: false, solucionario: false } };
        u['sesiones/' + sid + '/info'] = info;
        u['publico/' + sid] = { titulo: banco.meta.titulo, institucion: inst, grupo: grupo, estado: 'preparada', duracionMin: dur, instrucciones: banco.publico.instrucciones,
          temas: Object.keys(banco.publico.temas).reduce(function (o, t) { o[t] = { nombre: banco.publico.temas[t].nombre }; return o; }, {}), preguntas: banco.publico.preguntas };
        return CORE.ref().update(u).then(function () { m.remove(); location.hash = '#/s/' + sid + '/estudiantes'; });
      }).catch(function (e) { $('#n-ok').disabled = false; CORE.toast('No se pudo crear: ' + e.message, 'err'); });
    };
  }
  function campo(id, lab, tipo, ph, val) { return '<div><label for="' + id + '">' + esc(lab) + '</label><input id="' + id + '" type="' + tipo + '" placeholder="' + esc(ph || '') + '" value="' + esc(val || '') + '"></div>'; }

  function cargarBanco(id) {
    if (P.bancos[id]) return Promise.resolve(P.bancos[id]);
    return CORE.ref('bancos/' + id).get().then(function (s) {
      var b = s.val(); if (!b) throw new Error('El banco ' + id + ' no está cargado.');
      b.publico.preguntas.forEach(function (q) { if (!q.fig) q.fig = null; });
      P.bancos[id] = b; return b;
    });
  }

  /* ---------- Bancos de pruebas ---------- */
  function bancos() {
    var h = '<h1>Bancos de pruebas</h1><p class="muted">Los bancos contienen las preguntas y la clave. Se cargan desde el archivo compilado (<code>dist/bancos/*.json</code>) y quedan en la base de datos con acceso solo de docente: nunca se publican en el sitio web.</p>' +
      '<div class="card row"><label for="fb" style="margin:0">Cargar o actualizar banco</label><input id="fb" type="file" accept=".json,application/json"></div><div class="grid3" style="margin-top:16px">';
    Object.keys(P.catalogo).forEach(function (b) {
      var c = P.catalogo[b];
      h += '<div class="card stack"><h3>' + esc(c.titulo) + '</h3><div class="small muted">' + c.n + ' preguntas · ' + c.duracionMin + ' min · versión ' + esc(c.version) + ' · ' + esc(c.publico || '') + '</div>' +
        '<div class="row"><button class="sm" data-prev="' + b + '" data-sol="1">Ver con respuestas</button><button class="sm ghost" data-prev="' + b + '" data-sol="0">Cuadernillo sin respuestas</button></div></div>';
    });
    app.innerHTML = h + '</div><div id="prev"></div>';
    $('#fb').onchange = function () {
      var f = this.files[0]; if (!f) return;
      f.text().then(function (t) {
        var b = JSON.parse(t);
        if (!b.meta || !b.meta.id || !b.publico || !b.clave || !b.publico.preguntas || !b.publico.preguntas.length) throw new Error('El archivo no es un banco compilado.');
        b.publico.preguntas.forEach(function (q) { if (!b.clave[q.id] || typeof b.clave[q.id].r !== 'number') throw new Error('Falta la clave de ' + q.id); });
        var u = {}; u['bancos/' + b.meta.id] = b; u['catalogo/' + b.meta.id] = b.meta;
        delete P.bancos[b.meta.id];
        return CORE.ref().update(u).then(function () { CORE.toast('Banco «' + b.meta.titulo + '» cargado (' + b.meta.n + ' preguntas).'); });
      }).catch(function (e) { CORE.toast('No se pudo cargar: ' + e.message, 'err'); });
    };
    $$('[data-prev]').forEach(function (b) { b.onclick = function () { previsualizar(b.dataset.prev, b.dataset.sol === '1'); }; });
  }
  function previsualizar(id, sol) {
    cargarBanco(id).then(function (b) {
      var h = '<div class="card" style="margin-top:18px"><div class="row noprint"><h2 style="margin:0">' + esc(b.meta.titulo) + (sol ? ' — con respuestas' : ' — cuadernillo') + '</h2><span class="spacer"></span><button onclick="print()">Imprimir</button></div>';
      if (!sol) h += '<p class="small">' + esc(b.publico.instrucciones) + '</p><p>Nombre: ______________________ Identificación: ____________ Grupo: _______</p>';
      b.publico.preguntas.forEach(function (q, k) {
        var c = b.clave[q.id];
        h += '<div class="qprev"><div class="small muted">' + (k + 1) + '. ' + esc(q.id) + ' · ' + esc(b.publico.temas[q.tema].nombre) + (sol ? ' · ' + q.nivel + ' · dificultad ' + c.dif : '') + '</div><div>' + q.txt + '</div>' +
          (q.fig ? '<div class="fig">' + q.fig + '</div>' : '') + '<ol type="A">' + q.ops.map(function (o, j) {
            return '<li' + (sol && j === c.r ? ' style="color:var(--ok);font-weight:700"' : '') + '>' + esc(o) + (sol && j !== c.r && c.err[j] ? ' <span class="small muted">— ' + esc(b.errores[c.err[j]] || '') + '</span>' : '') + '</li>';
          }).join('') + '</ol>' + (sol ? '<p class="small"><b>Explicación:</b> ' + esc(c.exp) + '</p>' : '') + '</div>';
      });
      $('#prev').innerHTML = h + '</div>';
      $('#prev').scrollIntoView();
    }).catch(function (e) { CORE.toast(e.message, 'err'); });
  }

  /* ---------- Sesión ---------- */
  function sesion(sid) {
    var tab = (location.hash.split('/')[3]) || 'vivo';
    if (!P.sesiones[sid]) { app.innerHTML = '<p class="muted">Cargando aplicación…</p>'; return; }
    if (!P.vivo || P.vivo.sid !== sid) iniciarVivo(sid);
    P.tab = tab;
    app.innerHTML = '<div id="cab"></div><div class="tabs" role="tablist">' +
      [['estudiantes', 'Estudiantes y códigos'], ['vivo', 'En vivo'], ['resultados', 'Resultados'], ['config', 'Configuración']].map(function (t) {
        return '<button class="' + (t[0] === tab ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div><div id="tab"></div>';
    $$('[data-tab]').forEach(function (b) { b.onclick = function () { location.hash = '#/s/' + sid + '/' + b.dataset.tab; }; });
    cabeceraSesion(); vistaTab();
  }
  function S() { return P.sesiones[P.vivo.sid]; }
  function cabeceraSesion() {
    var c = $('#cab'); if (!c) return;
    var i = S().info, e = ESTADOS[i.estado] || ['', ''];
    c.innerHTML = '<div class="row"><a href="#/" class="small">← Aplicaciones</a></div><div class="row" style="margin-top:6px"><h1 style="margin:0">' + esc(i.institucion) + ' · ' + esc(i.grupo) + '</h1><span class="chip ' + e[1] + '">' + e[0] + '</span>' + (i.publicado ? '<span class="chip ok">Resultados publicados</span>' : '') + '</div>' +
      '<div class="small muted">' + esc(i.bancoTitulo) + ' · ' + i.duracionMin + ' min' + (i.fechaProg ? ' · ' + esc(i.fechaProg) : '') + (i.nombre ? ' · ' + esc(i.nombre) : '') + '</div>';
  }
  function vistaTab() {
    var t = $('#tab'); if (!t) return;
    if (P.tab === 'estudiantes') return tabEstudiantes(t);
    if (P.tab === 'resultados') return tabResultados(t);
    if (P.tab === 'config') return tabConfig(t);
    tabVivo(t);
  }

  /* ---------- Estudiantes y códigos ---------- */
  function estudiantes() { var e = S().estudiantes || {}; return Object.keys(e).map(function (c) { var x = e[c]; x.code = c; return x; }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); }); }
  function tabEstudiantes(t) {
    var est = estudiantes(), i = S().info, bloqueado = i.estado !== 'preparada';
    var h = '<div class="grid2"><div class="card stack"><h2>Agregar estudiantes</h2><p class="small muted">Pega desde Excel tres columnas: <b>Nombre completo · Identificación · Correo</b>. Puede incluir fila de títulos.</p>' +
      '<textarea id="pegar" placeholder="Ana María Pérez&#9;1061234567&#9;ana.perez@correo.com"></textarea><div class="row"><input type="file" id="fcsv" accept=".csv,.txt"><span class="spacer"></span><button id="validar" class="primary">Revisar lista</button></div><div id="valid"></div></div>';
    h += '<div class="card stack"><h2>Enviar los códigos</h2><p class="small">Descarga el archivo para <b>combinar correspondencia</b> (Gmail, Outlook o Word): trae nombre, correo, código, enlace y el mensaje ya armado.</p>' +
      '<label for="plant">Mensaje (usa {nombre}, {codigo}, {enlace}, {institucion}, {prueba}, {fecha})</label><textarea id="plant" style="min-height:170px">' + esc(i.plantilla || PLANTILLA) + '</textarea>' +
      '<div class="row"><button id="csvmail" class="primary"' + (est.length ? '' : ' disabled') + '>Descargar CSV para correos</button><button id="tarjetas"' + (est.length ? '' : ' disabled') + '>Imprimir tarjetas de acceso</button></div>' +
      (CONFIG.urlSitio ? '' : '<p class="small notice warn">Falta <code>urlSitio</code> en config.js: el enlace del correo usará la dirección actual.</p>') + '</div></div>';
    h += '<div class="card" style="margin-top:16px"><div class="row"><h2 style="margin:0">Inscritos (' + est.length + ')</h2><span class="spacer"></span><input id="buscar" type="text" placeholder="Buscar…" style="max-width:240px"></div>' +
      (bloqueado ? '<p class="small muted">La prueba ya se abrió: puedes agregar estudiantes, pero no eliminar a quien ya ingresó.</p>' : '') +
      '<div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Nombre</th><th>Identificación</th><th>Correo</th><th>Código</th><th></th></tr></thead><tbody id="tb-est">' +
      est.map(function (e) {
        return '<tr data-q="' + esc((e.nombre + ' ' + e.doc + ' ' + e.correo).toLowerCase()) + '"><td>' + esc(e.nombre) + '</td><td>' + esc(e.doc) + '</td><td class="small">' + esc(e.correo) + '</td><td class="codigo">' + CORE.verCodigo(e.code) + '</td>' +
          '<td><button class="sm ghost" data-edit="' + e.code + '">Editar</button><button class="sm ghost danger" data-del="' + e.code + '">Quitar</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    t.innerHTML = h;
    $('#fcsv').onchange = function () { var f = this.files[0]; if (f) f.text().then(function (x) { $('#pegar').value = x; validar(); }); };
    $('#validar').onclick = validar;
    $('#buscar').oninput = function () { var q = this.value.toLowerCase(); $$('#tb-est tr').forEach(function (r) { r.classList.toggle('hidden', r.dataset.q.indexOf(q) < 0); }); };
    $('#plant').onchange = function () { CORE.ref('sesiones/' + P.vivo.sid + '/info/plantilla').set(this.value); };
    $('#csvmail').onclick = csvCorreos;
    $('#tarjetas').onclick = tarjetas;
    $$('[data-del]').forEach(function (b) { b.onclick = function () { quitar(b.dataset.del); }; });
    $$('[data-edit]').forEach(function (b) { b.onclick = function () { editar(b.dataset.edit); }; });
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function parsear(txt) {
    var filas = txt.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var sep = l.indexOf('\t') >= 0 ? '\t' : l.indexOf(';') >= 0 ? ';' : ',';
      return l.split(sep).map(function (c) { return c.trim().replace(/^"|"$/g, ''); });
    });
    if (filas.length && /nombre/i.test(filas[0][0] || '') && !EMAIL.test(filas[0][2] || '')) filas.shift();
    var exist = estudiantes(), docs = {}, mails = {};
    exist.forEach(function (e) { docs[CORE.normDoc(e.doc)] = 'ya inscrito'; mails[e.correo.toLowerCase()] = 'ya inscrito'; });
    return filas.map(function (f, k) {
      var r = { fila: k + 1, nombre: (f[0] || '').replace(/\s+/g, ' '), doc: (f[1] || '').replace(/\s+/g, ''), correo: (f[2] || '').toLowerCase(), err: [] };
      if (f.length < 3) r.err.push('faltan columnas');
      if (r.nombre.length < 5) r.err.push('nombre incompleto');
      if (!CORE.normDoc(r.doc)) r.err.push('sin identificación');
      if (!EMAIL.test(r.correo)) r.err.push('correo inválido');
      var d = CORE.normDoc(r.doc);
      if (d && docs[d]) r.err.push('identificación repetida (' + docs[d] + ')'); else if (d) docs[d] = 'fila ' + r.fila;
      if (r.correo && mails[r.correo]) r.err.push('correo repetido (' + mails[r.correo] + ')'); else if (r.correo) mails[r.correo] = 'fila ' + r.fila;
      return r;
    });
  }
  function validar() {
    var filas = parsear($('#pegar').value), ok = filas.filter(function (r) { return !r.err.length; }), mal = filas.filter(function (r) { return r.err.length; });
    var h = '<p><b>' + ok.length + '</b> listos para agregar' + (mal.length ? ' · <b style="color:var(--bad)">' + mal.length + ' con problemas</b> (no se agregarán)' : '') + '.</p>';
    if (mal.length) h += '<div class="tablewrap"><table><thead><tr><th>Fila</th><th>Nombre</th><th>Problema</th></tr></thead><tbody>' + mal.map(function (r) { return '<tr><td>' + r.fila + '</td><td>' + esc(r.nombre) + '</td><td class="small" style="color:var(--bad)">' + esc(r.err.join('; ')) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    if (ok.length) h += '<button id="agregar" class="primary">Agregar ' + ok.length + ' estudiantes y generar códigos</button>';
    $('#valid').innerHTML = h;
    if (ok.length) $('#agregar').onclick = function () { this.disabled = true; agregar(ok); };
  }
  function agregar(lista) {
    var i = S().info, sid = P.vivo.sid;
    return CORE.ref('accesos').orderByKey().get().then(function (s) {
      var usados = s.val() || {}, u = {};
      lista.forEach(function (r) {
        var c; do { c = CORE.nuevoCodigo(); } while (usados[c] || u['accesos/' + c]);
        usados[c] = 1;
        u['sesiones/' + sid + '/estudiantes/' + c] = { nombre: r.nombre, doc: r.doc, correo: r.correo, agregado: CORE.TS };
        u['accesos/' + c] = { sid: sid, nombre: r.nombre, extraMin: 0, prueba: i.bancoTitulo, institucion: i.institucion, grupo: i.grupo };
      });
      return CORE.ref().update(u);
    }).then(function () { CORE.toast(lista.length + ' estudiantes agregados.'); $('#pegar').value = ''; vistaTab(); })
      .catch(function (e) { CORE.toast('No se pudieron agregar: ' + e.message, 'err'); });
  }
  function quitar(code) {
    var e = S().estudiantes[code], v = P.vivo;
    if ((v.resp[code] && (v.resp[code].inicio || v.resp[code].r)) || (v.accesos[code] && v.accesos[code].uid)) return CORE.toast('Este estudiante ya ingresó a la prueba; no se puede quitar.', 'err');
    CORE.confirmar('¿Quitar a ' + e.nombre + '?', '<p>Su código <b>' + CORE.verCodigo(code) + '</b> dejará de funcionar.</p>', 'Quitar', true).then(function (si) {
      if (!si) return;
      var u = {}; u['sesiones/' + v.sid + '/estudiantes/' + code] = null; u['accesos/' + code] = null;
      CORE.ref().update(u).then(function () { CORE.toast('Estudiante quitado.'); });
    });
  }
  function editar(code) {
    var e = S().estudiantes[code];
    var m = CORE.modal('<h2>Editar estudiante</h2><div class="stack">' + campo('e-n', 'Nombre', 'text', '', e.nombre) + campo('e-d', 'Identificación', 'text', '', e.doc) + campo('e-c', 'Correo', 'email', '', e.correo) +
      '<div class="row" style="justify-content:flex-end"><button data-cerrar class="ghost">Cancelar</button><button id="e-ok" class="primary">Guardar</button></div></div>');
    $('#e-ok').onclick = function () {
      var n = $('#e-n').value.trim(), d = $('#e-d').value.trim(), c = $('#e-c').value.trim().toLowerCase();
      if (n.length < 5 || !CORE.normDoc(d) || !EMAIL.test(c)) return CORE.toast('Revisa nombre, identificación y correo.', 'err');
      var u = {}, b = 'sesiones/' + P.vivo.sid + '/estudiantes/' + code + '/';
      u[b + 'nombre'] = n; u[b + 'doc'] = d; u[b + 'correo'] = c; u['accesos/' + code + '/nombre'] = n;
      CORE.ref().update(u).then(function () { m.remove(); CORE.toast('Datos actualizados.'); });
    };
  }
  function enlace(code) { var base = CONFIG.urlSitio || location.href.replace(/panel(\.html)?.*$/, ''); return base.replace(/\/?$/, '/') + 'prueba.html?c=' + code; }
  function mensajePara(e) {
    var i = S().info, pl = $('#plant') ? $('#plant').value : (i.plantilla || PLANTILLA);
    var d = { nombre: e.nombre, codigo: CORE.verCodigo(e.code), enlace: enlace(e.code), institucion: i.institucion, prueba: i.bancoTitulo, fecha: i.fechaProg || 'la que indique tu docente' };
    return pl.replace(/\{(\w+)\}/g, function (m, k) { return k in d ? d[k] : m; });
  }
  function csvCorreos() {
    var i = S().info, filas = [['Nombre', 'Identificación', 'Correo', 'Código', 'Enlace', 'Asunto', 'Mensaje']];
    estudiantes().forEach(function (e) { filas.push([e.nombre, e.doc, e.correo, CORE.verCodigo(e.code), enlace(e.code), 'Tu código para la prueba diagnóstica de ' + i.bancoTitulo, mensajePara(e)]); });
    CORE.descargar('codigos-' + slug(i.institucion + '-' + i.grupo) + '.csv', A.csv(filas));
  }
  function tarjetas() {
    var i = S().info, w = window.open('', '_blank');
    if (!w) return CORE.toast('Permite las ventanas emergentes para imprimir.', 'err');
    w.document.write('<!doctype html><meta charset="utf-8"><title>Tarjetas de acceso</title><link rel="stylesheet" href="estilos.css"><body style="padding:16px"><h2>' + esc(i.institucion + ' · ' + i.grupo) + ' — ' + esc(i.bancoTitulo) + '</h2><div class="slips" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">' +
      estudiantes().map(function (e) { return '<div style="border:1px dashed #888;border-radius:8px;padding:10px;break-inside:avoid"><b>' + esc(e.nombre) + '</b><div style="font:700 1.4rem Consolas,monospace;letter-spacing:.1em;margin:6px 0">' + CORE.verCodigo(e.code) + '</div><div style="font-size:.8rem">' + esc(enlace(e.code).replace(/\?c=.*/, '')) + '</div></div>'; }).join('') +
      '</div><script>setTimeout(function(){print()},400)<\/script></body>');
    w.document.close();
  }
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  /* ---------- En vivo ---------- */
  function iniciarVivo(sid) {
    soltarVivo();
    var v = P.vivo = { sid: sid, pres: {}, resp: {}, accesos: {}, pub: {}, log: [], prev: {}, refs: [], caidos: {} };
    function on(ref, cb) { ref.on('value', cb); v.refs.push(ref); }
    on(CORE.ref('presencia/' + sid), function (s) { var nv = s.val() || {}; eventos(v, nv); v.pres = nv; pintarVivo(); });
    on(CORE.ref('respuestas/' + sid), function (s) { v.resp = s.val() || {}; pintarVivo(); });
    on(CORE.ref('accesos').orderByChild('sid').equalTo(sid), function (s) { v.accesos = s.val() || {}; pintarVivo(); });
    on(CORE.ref('publico/' + sid + '/fin'), function (s) { v.pub.fin = s.val(); });
    on(CORE.ref('publico/' + sid + '/pausadaEn'), function (s) { v.pub.pausadaEn = s.val(); });
    v.timer = setInterval(function () { relojVivo(); revisarCaidos(); horasVivo(); }, 1000);
  }
  function soltarVivo() {
    if (!P.vivo) return;
    P.vivo.refs.forEach(function (r) { r.off(); });
    clearInterval(P.vivo.timer);
    P.vivo = null;
  }
  function nombre(code) { var e = (S().estudiantes || {})[code]; return e ? e.nombre : code; }
  function evento(v, txt, tipo) {
    v.log.unshift({ t: CORE.ahora(), txt: txt, tipo: tipo || '' });
    if (v.log.length > 300) v.log.pop();
  }
  function eventos(v, nv) {
    Object.keys(nv).forEach(function (c) {
      var a = v.pres[c], b = nv[c];
      if (!a) { evento(v, nombre(c) + ' ingresó (' + (b.disp || '') + ')'); return; }
      if ((b.salidas || 0) > (a.salidas || 0)) evento(v, nombre(c) + ' salió de la prueba (' + b.salidas + (b.salidas === 1 ? ' vez' : ' veces') + ')', b.salidas >= ALERTA_SALIDAS ? 'bad' : 'warn');
      if (b.estado === 'entregado' && a.estado !== 'entregado') evento(v, nombre(c) + ' entregó la prueba (' + b.n + ' respondidas)', 'ok');
      if (v.caidos[c] && b.hb !== a.hb) { delete v.caidos[c]; evento(v, nombre(c) + ' recuperó la conexión', 'ok'); }
    });
  }
  function revisarCaidos() {
    var v = P.vivo; if (!v) return;
    var ahora = CORE.ahora(), cambio = false;
    Object.keys(v.pres).forEach(function (c) {
      var p = v.pres[c], caido = p.estado !== 'entregado' && ahora - (p.hb || 0) > CAIDO_MS && S().info.estado !== 'cerrada';
      if (caido && !v.caidos[c]) { v.caidos[c] = 1; evento(v, nombre(c) + ' perdió la conexión', 'bad'); cambio = true; }
    });
    if (cambio) pintarVivo();
  }
  function restante() {
    var v = P.vivo, i = S().info;
    if (!v.pub.fin) return null;
    return v.pub.fin - (i.estado === 'pausada' && v.pub.pausadaEn ? v.pub.pausadaEn : CORE.ahora());
  }
  function relojVivo() {
    var el = $('#v-reloj'); if (!el) return;
    var r = restante(), i = S().info;
    el.textContent = r === null ? CORE.mmss(i.duracionMin * 60000) : i.estado === 'cerrada' ? '0:00' : CORE.mmss(r);
    el.style.color = r !== null && r < 5 * 60000 && i.estado === 'abierta' ? 'var(--bad)' : '';
  }
  function filaEstado(code) {
    var v = P.vivo, p = v.pres[code], r = v.resp[code] || {}, a = v.accesos[code] || {};
    if (r.entregado || (p && p.estado === 'entregado')) return ['Entregó', 'ok'];
    if (!p) return a.uid ? ['Conectándose', ''] : ['Sin ingresar', ''];
    if (v.caidos[code]) return ['Sin conexión', 'bad'];
    if (p.fuera) return ['Fuera de la prueba', 'warn'];
    return { esperando: ['En espera', 'acc'], respondiendo: ['Respondiendo', 'ok'], pausa: ['En pausa', 'warn'] }[p.estado] || ['—', ''];
  }
  function tabVivo(t) {
    var i = S().info;
    t.innerHTML = '<div class="grid2"><div class="card stack"><div class="row"><div><div class="small muted">Tiempo restante</div><div class="bigtimer" id="v-reloj"></div></div><span class="spacer"></span><div id="v-ctrl" class="row"></div></div><div id="v-aviso"></div></div>' +
      '<div class="tiles" id="v-tiles"></div></div>' +
      '<div class="card" style="margin-top:16px"><div class="row"><h2 style="margin:0">Estudiantes</h2><span class="spacer"></span><select id="v-filtro" style="max-width:220px"><option value="">Todos</option><option value="alerta">Con alertas</option><option value="sin">Sin ingresar</option><option value="activo">Respondiendo</option><option value="entrego">Entregaron</option></select></div>' +
      '<div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Estudiante</th><th>Estado</th><th>Progreso</th><th class="num">Pregunta</th><th>Última señal</th><th class="num" title="Veces que salió de la pestaña">Salidas</th><th>Dispositivo</th><th class="num">Extra</th><th></th></tr></thead><tbody id="v-tb"></tbody></table></div></div>' +
      '<div class="grid2" style="margin-top:16px"><div class="card"><h3>Avance por pregunta</h3><p class="small muted">Cuántos estudiantes han respondido cada pregunta (orden del banco).</p><div class="heat" id="v-heat"></div></div><div class="card"><h3>Bitácora</h3><div class="log" id="v-log"></div></div></div>';
    $('#v-filtro').onchange = pintarVivo;
    controles();
    pintarVivo(); relojVivo();
  }
  function controles() {
    var c = $('#v-ctrl'); if (!c) return;
    var e = S().info.estado, n = Object.keys(S().estudiantes || {}).length, h = '';
    if (c.dataset.firma === e + n) return; // redibujar solo si cambia: un clic no se pierde por los latidos
    c.dataset.firma = e + n;
    if (e === 'preparada') h = '<button class="primary" id="c-abrir"' + (n ? '' : ' disabled title="Agrega estudiantes primero"') + '>▶ Abrir prueba</button>';
    if (e === 'abierta') h = '<button id="c-mas">+5 min a todos</button><button id="c-pausa">❚❚ Pausar</button><button class="danger" id="c-cerrar">■ Cerrar</button>';
    if (e === 'pausada') h = '<button class="primary" id="c-reanudar">▶ Reanudar</button><button class="danger" id="c-cerrar">■ Cerrar</button>';
    if (e === 'cerrada') h = '<button id="c-reabrir">Reabrir 10 min</button><a class="btn primary" href="#/s/' + P.vivo.sid + '/resultados">Ver resultados</a>';
    c.innerHTML = h;
    var av = $('#v-aviso');
    av.innerHTML = e === 'preparada' ? '<div class="notice small">Los estudiantes que ingresen con su código quedan <b>en espera</b>. Al abrir, la prueba les aparece a todos a la vez y empieza a correr el tiempo.</div>' :
      e === 'pausada' ? '<div class="notice warn small">Prueba en pausa: el tiempo está detenido y nadie puede responder.</div>' :
      e === 'cerrada' ? '<div class="notice small">Prueba cerrada ' + CORE.fecha(S().info.cerradaEn) + '. Ya puedes revisar y publicar los resultados.</div>' : '';
    var b;
    if ((b = $('#c-abrir'))) b.onclick = function () { CORE.confirmar('¿Abrir la prueba ahora?', '<p>Empieza a correr el tiempo (' + S().info.duracionMin + ' min) para todos.</p>', 'Abrir').then(function (si) { if (si) cambiarEstado('abierta'); }); };
    if ((b = $('#c-pausa'))) b.onclick = function () { cambiarEstado('pausada'); };
    if ((b = $('#c-reanudar'))) b.onclick = function () { cambiarEstado('reanudar'); };
    if ((b = $('#c-mas'))) b.onclick = function () { cambiarEstado('mas'); };
    if ((b = $('#c-reabrir'))) b.onclick = function () { cambiarEstado('reabrir'); };
    if ((b = $('#c-cerrar'))) b.onclick = function () {
      var activos = Object.keys(S().estudiantes || {}).filter(function (c) { return filaEstado(c)[0] !== 'Entregó' && filaEstado(c)[0] !== 'Sin ingresar'; }).length;
      CORE.confirmar('¿Cerrar la prueba?', (activos ? '<div class="notice warn">' + activos + ' estudiante(s) aún no han entregado. Se guardará lo que hayan respondido.</div>' : '') + '<p>Nadie podrá seguir respondiendo.</p>', 'Cerrar prueba', true).then(function (si) { if (si) cambiarEstado('cerrada'); });
    };
  }
  function cambiarEstado(acc) {
    var sid = P.vivo.sid, i = S().info, v = P.vivo, now = CORE.ahora(), u = {}, est = acc;
    var pi = 'sesiones/' + sid + '/info/', pp = 'publico/' + sid + '/';
    if (acc === 'abierta') { u[pp + 'fin'] = now + i.duracionMin * 60000; u[pi + 'abiertaEn'] = CORE.TS; evento(v, 'Prueba abierta', 'ok'); }
    if (acc === 'pausada') { u[pp + 'pausadaEn'] = now; evento(v, 'Prueba en pausa', 'warn'); }
    if (acc === 'reanudar') { est = 'abierta'; u[pp + 'fin'] = (v.pub.fin || now) + Math.max(0, now - (v.pub.pausadaEn || now)); u[pp + 'pausadaEn'] = null; evento(v, 'Prueba reanudada', 'ok'); }
    if (acc === 'mas') { est = 'abierta'; u[pp + 'fin'] = (v.pub.fin || now) + 5 * 60000; evento(v, 'Se agregaron 5 minutos para todos'); }
    if (acc === 'cerrada') { u[pi + 'cerradaEn'] = CORE.TS; u[pp + 'pausadaEn'] = null; evento(v, 'Prueba cerrada', 'bad'); }
    if (acc === 'reabrir') { est = 'abierta'; u[pp + 'fin'] = now + 10 * 60000; u[pi + 'cerradaEn'] = null; evento(v, 'Prueba reabierta 10 minutos', 'warn'); }
    u[pi + 'estado'] = est; u[pp + 'estado'] = est;
    CORE.ref().update(u).catch(function (e) { CORE.toast('No se pudo cambiar el estado: ' + e.message, 'err'); });
  }
  function pintarVivo() {
    var v = P.vivo; if (!v || P.tab !== 'vivo' || !$('#v-tb')) return;
    controles(); cabeceraSesion();
    var est = estudiantes(), ahora = CORE.ahora(), cuenta = { ingresaron: 0, respondiendo: 0, entregaron: 0, caidos: 0, alertas: 0 };
    var nq = 0, banco = P.bancos[S().info.bancoId];
    var filtro = $('#v-filtro').value;
    var filas = est.map(function (e) {
      var c = e.code, p = v.pres[c] || null, r = v.resp[c] || {}, a = v.accesos[c] || {}, st = filaEstado(c);
      var n = Object.keys(r.r || {}).length, sal = p ? p.salidas || 0 : 0, alerta = sal >= ALERTA_SALIDAS;
      if (p || a.uid) cuenta.ingresaron++;
      if (st[0] === 'Respondiendo' || st[0] === 'Fuera de la prueba') cuenta.respondiendo++;
      if (st[0] === 'Entregó') cuenta.entregaron++;
      if (st[0] === 'Sin conexión') cuenta.caidos++;
      if (alerta) cuenta.alertas++;
      var grupo = st[0] === 'Sin ingresar' ? 'sin' : st[0] === 'Entregó' ? 'entrego' : 'activo';
      if (filtro && filtro !== grupo && !(filtro === 'alerta' && (alerta || st[1] === 'bad'))) return '';
      var tot = (banco && banco.publico.preguntas.length) || 50;
      return '<tr data-code="' + c + '" class="' + (st[1] === 'bad' ? 'caido' : alerta ? 'alerta' : '') + '"><td>' + esc(e.nombre) + '<div class="small muted codigo">' + CORE.verCodigo(c) + '</div></td>' +
        '<td><span class="chip ' + st[1] + '">' + st[0] + '</span></td>' +
        '<td><span class="mini"><span class="bar"><i style="width:' + (100 * n / tot) + '%"></i></span></span> <span class="small">' + n + '/' + tot + '</span></td>' +
        '<td class="num">' + (p && p.vista && /Respondiendo|Fuera|pausa/.test(st[0]) ? p.vista : '—') + '</td>' +
        '<td class="small" data-hb="' + (p ? p.hb : '') + '">' + (p ? CORE.hace(ahora - p.hb) : '—') + '</td>' +
        '<td class="num">' + (alerta ? '<span class="chip warn">' + sal + '</span>' : sal) + '</td>' +
        '<td class="small muted">' + esc(p ? p.disp || '' : '') + '</td>' +
        '<td class="num">' + (a.extraMin ? '+' + a.extraMin : '') + '</td>' +
        '<td style="white-space:nowrap"><button class="sm ghost" data-acc="extra" data-c="' + c + '" title="Dar 10 minutos más a este estudiante">+10</button>' +
        (a.uid ? '<button class="sm ghost" data-acc="liberar" data-c="' + c + '" title="Permitir que ingrese desde otro dispositivo">Liberar</button>' : '') +
        (r.entregado ? '<button class="sm ghost" data-acc="reabrir" data-c="' + c + '">Reabrir</button>' : (p ? '<button class="sm ghost" data-acc="entregar" data-c="' + c + '">Entregar</button>' : '')) + '</td></tr>';
    }).filter(Boolean);
    pintarFilas($('#v-tb'), filas, filtro);
    $('#v-tiles').innerHTML = [['Inscritos', est.length], ['Ingresaron', cuenta.ingresaron], ['Respondiendo', cuenta.respondiendo], ['Entregaron', cuenta.entregaron], ['Sin conexión', cuenta.caidos], ['Alertas de salida', cuenta.alertas]]
      .map(function (x, k) { return '<div class="tile"' + (k >= 4 && x[1] ? ' style="border-color:var(--bad)"' : '') + '><div class="v">' + x[1] + '</div><div class="k">' + x[0] + '</div></div>'; }).join('');
    // Avance por pregunta
    if (banco) {
      var nEst = Math.max(1, cuenta.ingresaron);
      $('#v-heat').innerHTML = banco.publico.preguntas.map(function (q, k) {
        var c = 0; Object.keys(v.resp).forEach(function (x) { if (v.resp[x].r && q.id in v.resp[x].r) c++; });
        return '<div style="--p:' + Math.round(100 * c / nEst) + '" title="' + esc(q.id) + ': ' + c + ' respuestas">' + (k + 1) + '<br><b>' + c + '</b></div>';
      }).join('');
    } else { cargarBanco(S().info.bancoId).then(pintarVivo); }
    $('#v-log').innerHTML = v.log.length ? v.log.map(function (l) { return '<div style="' + (l.tipo ? 'color:var(--' + l.tipo + ')' : '') + '"><span class="muted">' + new Date(l.t).toLocaleTimeString('es-CO') + '</span> ' + esc(l.txt) + '</div>'; }).join('') : '<p class="muted small">Los eventos aparecerán aquí: ingresos, salidas de la pestaña, desconexiones y entregas.</p>';
  }
  /* Reemplaza solo las filas cuyo contenido cambió (sin contar la "última señal", que se actualiza como texto). */
  function pintarFilas(tb, filas, filtro) {
    if (!tb.dataset.on) {
      tb.dataset.on = 1;
      tb.addEventListener('click', function (e) { var b = e.target.closest('[data-acc]'); if (b) accionEstudiante(b.dataset.acc, b.dataset.c); });
    }
    if (!filas.length) { tb.innerHTML = '<tr><td colspan="9" class="muted">Sin estudiantes en este filtro.</td></tr>'; tb.dataset.filtro = filtro; return; }
    var actuales = Array.prototype.slice.call(tb.querySelectorAll('tr[data-code]'));
    var mismaLista = tb.dataset.filtro === filtro && actuales.length === filas.length;
    if (!mismaLista) { tb.innerHTML = filas.join(''); tb.dataset.filtro = filtro; }
    else {
      filas.forEach(function (h, k) {
        var firma = h.replace(/ data-hb="[^"]*">[^<]*</, '><');
        if (actuales[k].dataset.firma === firma) return;
        var t = document.createElement('tbody'); t.innerHTML = h;
        var nueva = t.firstElementChild; nueva.dataset.firma = firma;
        tb.replaceChild(nueva, actuales[k]);
      });
    }
    Array.prototype.forEach.call(tb.querySelectorAll('tr[data-code]'), function (r, k) { if (!r.dataset.firma) r.dataset.firma = filas[k].replace(/ data-hb="[^"]*">[^<]*</, '><'); });
  }
  function horasVivo() {
    var ahora = CORE.ahora();
    $$('#v-tb [data-hb]').forEach(function (td) { if (td.dataset.hb) td.textContent = CORE.hace(ahora - +td.dataset.hb); });
  }
  function accionEstudiante(acc, code) {
    var v = P.vivo, a = v.accesos[code] || {}, n = nombre(code), u = {};
    if (acc === 'extra') { u['accesos/' + code + '/extraMin'] = (a.extraMin || 0) + 10; evento(v, n + ': +10 minutos'); }
    if (acc === 'liberar') {
      return CORE.confirmar('¿Liberar el acceso de ' + n + '?', '<p>Podrá ingresar con el mismo código desde otro dispositivo y continuar con sus respuestas guardadas. El dispositivo actual quedará desconectado.</p>', 'Liberar').then(function (si) {
        if (!si) return;
        u['accesos/' + code + '/uid'] = null; if (a.uid) u['uids/' + a.uid] = null;
        evento(v, n + ': acceso liberado para otro dispositivo', 'warn');
        CORE.ref().update(u);
      });
    }
    if (acc === 'entregar') {
      return CORE.confirmar('¿Entregar la prueba de ' + n + '?', '<p>Se cierra su prueba con lo que lleve respondido.</p>', 'Entregar', true).then(function (si) {
        if (!si) return;
        CORE.ref('respuestas/' + v.sid + '/' + code + '/entregado').set(CORE.TS); evento(v, n + ': entrega forzada por el docente', 'warn');
      });
    }
    if (acc === 'reabrir') { u['respuestas/' + v.sid + '/' + code + '/entregado'] = null; evento(v, n + ': prueba reabierta', 'warn'); }
    CORE.ref().update(u).catch(function (e) { CORE.toast(e.message, 'err'); });
  }

  /* ---------- Resultados ---------- */
  function filasResultados() {
    var v = P.vivo;
    return estudiantes().map(function (e) {
      var r = v.resp[e.code] || {}, p = v.pres[e.code] || {};
      return { code: e.code, nombre: e.nombre, doc: e.doc, correo: e.correo, resp: r.r || {}, inicio: r.inicio || null, entregado: r.entregado || null, salidas: p.salidas || 0 };
    });
  }
  function tabResultados(t) {
    var i = S().info;
    t.innerHTML = '<p class="muted">Calculando…</p>';
    cargarBanco(i.bancoId).then(function (banco) {
      var calc = INF.calcular(banco, filasResultados(), i.cerradaEn || null);
      P.calc = { banco: banco, calc: calc };
      if (!calc.presentaron.length) { t.innerHTML = '<div class="notice">Todavía no hay respuestas para calcular resultados.</div>'; return; }
      var rep = INF.construirInforme(banco, i, calc);
      var h = '<div class="card row noprint">' + (i.estado !== 'cerrada' ? '<span class="chip warn">Resultados parciales: la prueba no está cerrada</span>' : '') +
        '<span class="spacer"></span><button id="r-csv">Descargar resultados (CSV)</button><button id="r-items">Análisis de ítems (CSV)</button><button onclick="print()">Imprimir informe</button>' +
        (i.publicado ? '<button id="r-link" class="primary">Enlace del informe</button><button id="r-despub" class="danger">Despublicar</button>' : '<button id="r-pub" class="primary"' + (i.estado === 'cerrada' ? '' : ' disabled title="Cierra la prueba primero"') + '>Publicar resultados</button>') + '</div>';
      h += INF.htmlInforme(rep, { integridad: true, acciones: true });
      t.innerHTML = h;
      $$('[data-ver]').forEach(function (b) {
        b.onclick = function () {
          var rk = rep.ranking[+b.dataset.ver], e = calc.presentaron.find(function (x) { return x.nombre === rk.nombre && x.doc === rk.doc; });
          var bol = INF.construirBoletin(banco, i, e, calc, { ranking: true, solucionario: true });
          CORE.modal('<div class="row noprint"><span class="spacer"></span><button data-cerrar>Cerrar</button></div>' + INF.htmlBoletin(bol), true);
        };
      });
      $('#r-csv').onclick = function () { csvResultados(banco, rep, i); };
      $('#r-items').onclick = function () { csvItems(rep, i); };
      if ($('#r-pub')) $('#r-pub').onclick = function () { publicar(banco, calc); };
      if ($('#r-link')) $('#r-link').onclick = mostrarEnlace;
      if ($('#r-despub')) $('#r-despub').onclick = despublicar;
    }).catch(function (e) { t.innerHTML = '<div class="notice bad">' + esc(e.message) + '</div>'; });
  }
  function csvResultados(banco, rep, i) {
    var ts = Object.keys(rep.temas), porDoc = {};
    estudiantes().forEach(function (e) { porDoc[e.doc] = e; });
    var filas = [['Puesto', 'Nombre', 'Identificación', 'Correo', 'Aciertos', 'Puntaje', 'Nivel'].concat(ts.map(function (t) { return rep.temas[t].nombre + ' (%)'; })).concat(['Minutos', 'Salidas de la pestaña', 'Temas a reforzar'])];
    rep.ranking.forEach(function (r) {
      filas.push([r.puesto, r.nombre, r.doc, (porDoc[r.doc] || {}).correo, r.aciertos, r.puntaje, (A.NIVELES.find(function (n) { return n.id === r.nivel; }) || {}).nombre]
        .concat(ts.map(function (t) { return String(r.porTema[t]).replace('.', ','); })).concat([r.min, r.salidas, r.debilidades.map(function (t) { return rep.temas[t].nombre; }).join(', ')]));
    });
    rep.ausentes.forEach(function (n) { filas.push(['', n, '', '', '', '', 'No presentó']); });
    CORE.descargar('resultados-' + slug(i.institucion + '-' + i.grupo) + '.csv', A.csv(filas));
  }
  function csvItems(rep, i) {
    var filas = [['N', 'Id', 'Tema', 'Pregunta', 'p (aciertos)', 'Discriminación', 'A', 'B', 'C', 'D', 'En blanco', 'Correcta', 'Distractor más elegido', 'Error que revela']];
    rep.items.forEach(function (it, k) {
      filas.push([k + 1, it.id, rep.temas[it.tema].nombre, it.txt, String(it.p).replace('.', ','), it.disc === null ? '' : String(it.disc).replace('.', ','), it.frec[0], it.frec[1], it.frec[2], it.frec[3], it.blanco, 'ABCD'[it.correcta],
        it.distractor && it.distractor.n ? 'ABCD'[it.distractor.op] : '', it.distractor && it.distractor.n ? it.distractor.texto : '']);
    });
    CORE.descargar('items-' + slug(i.institucion + '-' + i.grupo) + '.csv', A.csv(filas));
  }
  function publicar(banco, calc) {
    var i = S().info, sid = P.vivo.sid, op = i.opciones || {};
    CORE.confirmar('¿Publicar los resultados?', '<p>Cada estudiante podrá ver su diagnóstico en <b>Consultar resultado</b> con su código y su identificación. La institución recibirá un enlace privado al informe consolidado con el ranking.</p>' +
      '<label class="check"><input type="checkbox" id="o-rk"' + (op.rankingEstudiante ? ' checked' : '') + '> <span>Mostrar a cada estudiante su puesto en el grupo</span></label>' +
      '<label class="check"><input type="checkbox" id="o-sol"' + (op.solucionario ? ' checked' : '') + '> <span>Incluir la revisión pregunta por pregunta con respuestas correctas <span class="small muted">(expone el banco: no lo marques si vas a reutilizar la prueba)</span></span></label>', 'Publicar').then(function (si) {
      if (si) return publicarCon(banco, calc);
    });
    // las casillas viven dentro del diálogo, que se borra al cerrarlo: guardamos su estado al cambiar
    setTimeout(function () {
      var rk = $('#o-rk'), so = $('#o-sol');
      if (rk) rk.onchange = function () { op.rankingEstudiante = rk.checked; };
      if (so) so.onchange = function () { op.solucionario = so.checked; };
    }, 0);
    function publicarCon(banco, calc) {
      var opc = { ranking: !!op.rankingEstudiante, solucionario: !!op.solucionario }, token = i.informeToken || CORE.token(18), u = {};
      return Promise.all(calc.presentaron.map(function (e) {
        return CORE.claveBoletin(e.code, e.doc).then(function (k) { u['boletines/' + k] = INF.construirBoletin(banco, i, e, calc, opc); return k; });
      })).then(function (claves) {
        u['informes/' + token] = INF.construirInforme(banco, i, calc);
        u['sesiones/' + sid + '/info/informeToken'] = token;
        u['sesiones/' + sid + '/info/publicado'] = CORE.TS;
        u['sesiones/' + sid + '/info/boletines'] = claves.reduce(function (o, k) { o[k] = true; return o; }, {});
        u['sesiones/' + sid + '/info/opciones'] = { rankingEstudiante: opc.ranking, solucionario: opc.solucionario };
        return CORE.ref().update(u);
      }).then(function () { CORE.toast('Resultados publicados.'); mostrarEnlace(); vistaTab(); })
        .catch(function (e) { CORE.toast('No se pudo publicar: ' + e.message, 'err'); });
    }
  }
  function urlBase() { return (CONFIG.urlSitio || location.href.replace(/panel(\.html)?.*$/, '')).replace(/\/?$/, '/'); }
  function mostrarEnlace() {
    var i = S().info, url = urlBase() + 'resultado.html?i=' + i.informeToken;
    CORE.modal('<h2>Enlace del informe institucional</h2><p>Compártelo solo con el responsable de la institución' + (i.correoContacto ? ' (' + esc(i.correoContacto) + ')' : '') + '. Quien tenga el enlace ve el ranking y los resultados del grupo.</p>' +
      '<input type="text" readonly value="' + esc(url) + '" onclick="this.select()"><p class="small muted" style="margin-top:10px">Los estudiantes consultan su diagnóstico en <b>' + esc(urlBase() + 'resultado.html') + '</b> con su código y su número de identificación.</p>' +
      '<div class="row" style="justify-content:flex-end"><a class="btn" target="_blank" href="' + esc(url) + '">Abrir</a><button data-cerrar class="primary">Listo</button></div>');
  }
  function despublicar() {
    var i = S().info, sid = P.vivo.sid;
    CORE.confirmar('¿Despublicar los resultados?', '<p>Los estudiantes y la institución dejarán de ver los informes. Puedes volver a publicarlos después.</p>', 'Despublicar', true).then(function (si) {
      if (!si) return;
      var u = {};
      Object.keys(i.boletines || {}).forEach(function (k) { u['boletines/' + k] = null; });
      if (i.informeToken) u['informes/' + i.informeToken] = null;
      u['sesiones/' + sid + '/info/publicado'] = null; u['sesiones/' + sid + '/info/boletines'] = null;
      CORE.ref().update(u).then(function () { CORE.toast('Resultados despublicados.'); vistaTab(); });
    });
  }

  /* ---------- Configuración ---------- */
  function tabConfig(t) {
    var i = S().info;
    t.innerHTML = '<div class="grid2"><div class="card stack"><h2>Datos de la aplicación</h2>' +
      campo('g-inst', 'Institución', 'text', '', i.institucion) + campo('g-grupo', 'Grupo o curso', 'text', '', i.grupo) + campo('g-nombre', 'Nombre interno', 'text', '', i.nombre) +
      '<div class="grid2">' + campo('g-dur', 'Duración (min)', 'number', '', i.duracionMin) + campo('g-fecha', 'Fecha programada', 'date', '', i.fechaProg) + '</div>' +
      campo('g-contacto', 'Responsable', 'text', '', i.contacto) + campo('g-correo', 'Correo del responsable', 'email', '', i.correoContacto) +
      '<button id="g-ok" class="primary">Guardar cambios</button></div>' +
      '<div class="card stack"><h2>Zona de cuidado</h2><p class="small">Eliminar la aplicación borra estudiantes, códigos, respuestas y resultados publicados. No se puede deshacer: descarga antes los resultados.</p><button id="g-del" class="danger">Eliminar aplicación</button></div></div>';
    $('#g-ok').onclick = function () {
      var dur = +$('#g-dur').value, sid = P.vivo.sid, u = {}, b = 'sesiones/' + sid + '/info/';
      if (i.estado !== 'preparada' && dur !== i.duracionMin) return CORE.toast('La duración solo se cambia antes de abrir. Usa «+5 min» o el tiempo extra individual.', 'err');
      u[b + 'institucion'] = $('#g-inst').value.trim(); u[b + 'grupo'] = $('#g-grupo').value.trim(); u[b + 'nombre'] = $('#g-nombre').value.trim();
      u[b + 'duracionMin'] = dur; u[b + 'fechaProg'] = $('#g-fecha').value; u[b + 'contacto'] = $('#g-contacto').value.trim(); u[b + 'correoContacto'] = $('#g-correo').value.trim();
      u['publico/' + sid + '/institucion'] = u[b + 'institucion']; u['publico/' + sid + '/grupo'] = u[b + 'grupo']; u['publico/' + sid + '/duracionMin'] = dur;
      CORE.ref().update(u).then(function () { CORE.toast('Cambios guardados.'); });
    };
    $('#g-del').onclick = function () {
      CORE.confirmar('¿Eliminar esta aplicación?', '<p>Se borrarán <b>' + Object.keys(S().estudiantes || {}).length + '</b> estudiantes con sus códigos y respuestas.</p>', 'Eliminar definitivamente', true).then(function (si) {
        if (!si) return;
        var sid = P.vivo.sid, u = {};
        Object.keys(S().estudiantes || {}).forEach(function (c) { u['accesos/' + c] = null; var a = P.vivo.accesos[c]; if (a && a.uid) u['uids/' + a.uid] = null; });
        Object.keys(i.boletines || {}).forEach(function (k) { u['boletines/' + k] = null; });
        if (i.informeToken) u['informes/' + i.informeToken] = null;
        u['sesiones/' + sid] = null; u['publico/' + sid] = null; u['respuestas/' + sid] = null; u['presencia/' + sid] = null;
        soltarVivo();
        CORE.ref().update(u).then(function () { location.hash = '#/'; CORE.toast('Aplicación eliminada.'); });
      });
    };
  }
})();
