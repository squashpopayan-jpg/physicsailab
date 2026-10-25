/* Utilidades comunes: conexión a Firebase (o a los emuladores en localhost), hora del servidor,
   códigos de acceso, avisos y diálogos dentro de la página. */
(function () {
  'use strict';
  var C = window.CORE = {};
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  C.local = local;
  C.TS = { '.sv': 'timestamp' };
  C.offset = 0;

  /* nombre: instancia de Firebase. Estudiantes y docente usan instancias distintas para que, en un mismo
     navegador, la sesión anónima del estudiante no se mezcle con la cuenta del docente. */
  C.init = function (nombre) {
    if (C.db) return C;
    if (typeof firebase === 'undefined') throw new Error('No se pudo cargar Firebase. Revisa tu conexión a internet.');
    var cfg = local ? { apiKey: 'demo-key', projectId: 'demo-diagnosticas', databaseURL: 'http://127.0.0.1:9000?ns=demo-diagnosticas-default-rtdb', authDomain: 'localhost' } : CONFIG.firebase;
    if (!cfg.databaseURL) throw new Error('El sitio aún no está configurado (falta la base de datos en config.js).');
    var app = nombre ? firebase.initializeApp(cfg, nombre) : firebase.initializeApp(cfg);
    C.auth = firebase.auth(app);
    C.db = firebase.database(app);
    if (local) { C.auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); C.db.useEmulator('127.0.0.1', 9000); }
    C.db.ref('.info/serverTimeOffset').on('value', function (s) { C.offset = s.val() || 0; });
    C.conectado = false;
    C.db.ref('.info/connected').on('value', function (s) { C.conectado = !!s.val(); document.dispatchEvent(new CustomEvent('conexion', { detail: C.conectado })); });
    return C;
  };
  C.ahora = function () { return Date.now() + C.offset; };
  C.ref = function (p) { return C.db.ref(p); };

  /* Códigos: 8 caracteres sin letras ni números que se confundan (sin 0, O, 1, I, L). */
  var ALF = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  C.nuevoCodigo = function () {
    var a = new Uint32Array(8), s = '';
    crypto.getRandomValues(a);
    for (var i = 0; i < 8; i++) s += ALF[a[i] % ALF.length];
    return s;
  };
  C.token = function (n) {
    var a = new Uint8Array(n || 18), s = '';
    crypto.getRandomValues(a);
    for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    return s;
  };
  C.normCodigo = function (s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  C.verCodigo = function (c) { return c.slice(0, 4) + '-' + c.slice(4); };
  C.normDoc = function (s) { return String(s || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase(); };
  C.sha256 = function (txt) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function (b) {
      return Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  };
  /* Clave del boletín individual: solo quien conoce el código Y la identificación puede abrirlo. */
  C.claveBoletin = function (code, doc) { return C.sha256('boletin:' + C.normCodigo(code) + ':' + C.normDoc(doc)); };

  C.esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  C.$ = function (sel, el) { return (el || document).querySelector(sel); };
  C.$$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  C.mmss = function (ms) {
    ms = Math.max(0, Math.round(ms / 1000));
    var h = Math.floor(ms / 3600), m = Math.floor(ms % 3600 / 60), s = ms % 60;
    return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + s).slice(-2);
  };
  C.hace = function (ms) {
    var s = Math.round(ms / 1000);
    if (s < 60) return 'hace ' + Math.max(0, s) + ' s';
    if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min';
    return 'hace ' + Math.round(s / 3600) + ' h';
  };
  C.fecha = function (ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  C.dispositivo = function () {
    var u = navigator.userAgent, so = /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'Mac' : /CrOS/.test(u) ? 'Chromebook' : /Linux/.test(u) ? 'Linux' : 'Otro';
    var nav = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Navegador';
    return so + ' · ' + nav + ' · ' + Math.round(screen.width) + 'px';
  };

  C.toast = function (msg, tipo) {
    var t = document.createElement('div');
    t.className = 'toast' + (tipo === 'err' ? ' err' : '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, tipo === 'err' ? 6000 : 3000);
  };
  /* Diálogo de confirmación dentro de la página. Devuelve una promesa con true/false. */
  C.confirmar = function (titulo, html, ok, peligro) {
    return new Promise(function (res) {
      var bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h2>' + C.esc(titulo) + '</h2><div class="stack">' + (html || '') +
        '</div><div class="row" style="margin-top:18px;justify-content:flex-end"><button class="ghost" data-r="0">Cancelar</button><button class="' + (peligro ? 'danger solid' : 'primary') + '" data-r="1">' + C.esc(ok || 'Aceptar') + '</button></div></div>';
      document.body.appendChild(bg);
      bg.querySelector('[data-r="1"]').focus();
      bg.addEventListener('click', function (e) {
        var b = e.target.closest('[data-r]');
        if (b || e.target === bg) { bg.remove(); res(!!(b && b.dataset.r === '1')); }
      });
    });
  };
  C.modal = function (html, wide) {
    var bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('[data-cerrar]')) bg.remove(); });
    return bg;
  };
  C.descargar = function (nombre, contenido, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: tipo || 'text/csv;charset=utf-8' }));
    a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  C.pie = function () {
    var f = document.createElement('footer');
    f.className = 'pie';
    f.innerHTML = C.esc(CONFIG.marca) + ' · ' + C.esc(CONFIG.autor) + (local ? ' · <b>modo local (emuladores)</b>' : '');
    document.body.appendChild(f);
  };
})();
