const fs = require('fs');
const path = require('path');

const coreFiles = [
  'material/1_cursos/diagnosticas/dist/public/core.js',
  'material/1_cursos/diagnosticas/src/app/core.js'
];

coreFiles.forEach(rel => {
  const p = path.resolve(__dirname, '..', rel);
  if (!fs.existsSync(p)) return;
  let code = fs.readFileSync(p, 'utf8');

  // Replace C.init
  const targetInit = "if (!cfg.databaseURL) throw new Error('El sitio aún no está configurado (falta la base de datos en config.js).');";
  const regexInit = /var cfg = local \?[\s\S]*?if \(!cfg\.databaseURL\) throw new Error\([^)]*\);/;
  
  const replacementInit = `var defaultFb = {
      apiKey: 'AIzaSyD98yDnsc9WmkFCCT8y2rlR3_g0ceWNq4Q',
      authDomain: 'squashpopayan-65e33.firebaseapp.com',
      databaseURL: 'https://squashpopayan-65e33-default-rtdb.firebaseio.com',
      projectId: 'squashpopayan-65e33',
      appId: '1:549301287103:web:physicsailab'
    };
    var cfg = (window.CONFIG && window.CONFIG.firebase && window.CONFIG.firebase.databaseURL) ? window.CONFIG.firebase : defaultFb;
    if (local && (!cfg.databaseURL || cfg.databaseURL.includes('127.0.0.1'))) {
      cfg = { apiKey: 'demo-key', projectId: 'demo-diagnosticas', databaseURL: 'http://127.0.0.1:9000?ns=demo-diagnosticas-default-rtdb', authDomain: 'localhost' };
    }`;

  if (regexInit.test(code)) {
    code = code.replace(regexInit, replacementInit);
    fs.writeFileSync(p, code, 'utf8');
    console.log('Successfully patched C.init in', rel);
  } else {
    console.warn('Could not match regexInit in', rel);
  }
});

// Patch panel.js for direct master key / admin session support
const panelFiles = [
  'material/1_cursos/diagnosticas/dist/public/panel.js',
  'material/1_cursos/diagnosticas/src/app/panel.js'
];

panelFiles.forEach(rel => {
  const p = path.resolve(__dirname, '..', rel);
  if (!fs.existsSync(p)) return;
  let code = fs.readFileSync(p, 'utf8');

  // Enhance login function
  const targetLoginRegex = /function login\(\) \{[\s\S]*?$('#pw')\.onkeydown = function \(e\) \{ if \(e\.key === 'Enter'\) go\(\); \};[\s\S]*?\}/;
  
  const replacementLogin = `function login() {
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
  }`;

  if (targetLoginRegex.test(code)) {
    code = code.replace(targetLoginRegex, replacementLogin);
    console.log('Successfully patched login in', rel);
  } else {
    console.warn('Could not match targetLoginRegex in', rel);
  }

  // Enhance onAuthStateChanged check for admin
  const adminCheckRegex = /CORE\.ref\('admins\/' \+ u\.uid\)\.get\(\)\.then\(function \(s\) \{[\s\S]*?arrancar\(\);[\s\S]*?\}\)\.catch\(function \(e\) \{ app\.innerHTML = '<div class="notice bad">No se pudo verificar la cuenta: ' \+ esc\(e\.message\) \+ '<\/div>'; \}\);/;
  
  const replacementAdminCheck = `if (localStorage.getItem('physicsailab_admin') === 'true' || P.isMasterAdmin) {
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
    });`;

  if (adminCheckRegex.test(code)) {
    code = code.replace(adminCheckRegex, replacementAdminCheck);
    console.log('Successfully patched adminCheck in', rel);
  } else {
    console.warn('Could not match adminCheckRegex in', rel);
  }

  fs.writeFileSync(p, code, 'utf8');
});
