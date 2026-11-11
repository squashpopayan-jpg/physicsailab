/* ===================================================================
   40-track.js — Almacén del avance personal en el curso.
   Guarda: capítulos estudiados, mejor resultado de cada autoevaluación,
   estado de cada pregunta del banco (repaso espaciado de Leitner) y el
   historial de pruebas del Centro de pruebas.
   Dónde: siempre en este navegador (localStorage) y, cuando la página
   corre como Artifact con el permiso «db», también en la base de datos
   privada del usuario (documento data/users/<id>/curso). Cada copia lleva
   su marca de tiempo; al cargar gana la más reciente.
   =================================================================== */
(function () {
  'use strict';
  const NL = window.NL;
  const KEY = 'pln:track';
  const T = (NL.track = {});
  const listeners = [];
  T.on = (fn) => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };
  const emit = (what) => listeners.slice().forEach((f) => { try { f(what); } catch (e) { console.error(e); } });

  const nuevo = () => ({
    v: 1,
    curso: { leidos: {}, quiz: {}, banco: {}, pruebas: [] },
    ts: 0
  });
  T.state = nuevo();
  T.backend = 'local';
  T.status = 'Guardado en este navegador.';

  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  T.ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  T.parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  T.diffDays = (a, b) => Math.round((T.parse(b) - T.parse(a)) / 86400000);

  /* ---------- Persistencia local ---------- */
  function guardarLocal() { try { localStorage.setItem(KEY, JSON.stringify(T.state)); } catch (e) { /* sin almacenamiento */ } }
  function cargarLocal() {
    try { const raw = localStorage.getItem(KEY); if (!raw) return null; const o = JSON.parse(raw); return o && o.v === 1 ? o : null; } catch (e) { return null; }
  }
  const loc = cargarLocal();
  if (loc) { T.state = Object.assign(nuevo(), loc); T.state.curso = Object.assign(nuevo().curso, loc.curso || {}); }

  /* ---------- Base de datos del Artifact (opcional) ---------- */
  let db = null, uid = null, dirty = false, timer = null, writing = false;
  const docRef = () => db.doc(`data/users/${uid}/curso`);
  function marcar() {
    T.state.ts = Date.now();
    guardarLocal();
    if (db && uid) { dirty = true; clearTimeout(timer); timer = setTimeout(vaciar, 1200); }
  }
  async function vaciar() {
    if (writing) { clearTimeout(timer); timer = setTimeout(vaciar, 1200); return; }
    writing = true;
    try {
      while (dirty) {
        dirty = false;
        try { await docRef().set({ v: 1, curso: T.state.curso, ts: T.state.ts }); }
        catch (e) {
          if (e && e.code === 'unavailable') { dirty = true; await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500)); }
          else { T.status = 'No se pudo guardar en su cuenta; sigue guardado en este navegador.'; emit('status'); console.warn('track db', e); break; }
        }
      }
    } finally { writing = false; }
  }
  async function conectar() {
    for (let k = 0; k < 12 && !(window.claude && typeof window.claude.use === 'function'); k++) await new Promise((r) => setTimeout(r, 250));
    if (!window.claude || typeof window.claude.use !== 'function') return;
    let user = null;
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { db = null; }
    if (!db || !user) { db = null; return; }
    try { uid = await user.id(); } catch (e) { uid = null; }
    if (!uid) { db = null; return; }
    try {
      const snap = await docRef().get();
      const r = snap && snap.exists ? snap.data() : null;
      const s = T.state;
      if (r && (r.ts || 0) >= (s.ts || 0)) {
        s.curso = Object.assign(nuevo().curso, r.curso || {});
        s.ts = r.ts || 0;
      } else if ((s.ts || 0) > 0) { dirty = true; clearTimeout(timer); timer = setTimeout(vaciar, 1200); }
      T.backend = 'db';
      T.status = 'Guardado en su cuenta (privado) y en este navegador.';
      guardarLocal();
      emit('load');
    } catch (e) {
      console.warn('track db', e);
      db = null;
      T.status = 'Guardado solo en este navegador (la base de datos no respondió).';
      emit('status');
    }
  }
  setTimeout(conectar, 0);

  /* ---------- Capítulos y autoevaluaciones ---------- */
  T.leido = (id) => !!T.state.curso.leidos[id];
  T.setLeido = function (id, v) { if (v) T.state.curso.leidos[id] = T.ymd(); else delete T.state.curso.leidos[id]; marcar(); emit('curso'); };
  T.setQuiz = function (id, ok, n) {
    const prev = T.state.curso.quiz[id];
    T.state.curso.quiz[id] = { ok, n, fecha: T.ymd(), mejor: Math.max(ok, prev ? prev.mejor || prev.ok || 0 : 0), intentos: (prev && prev.intentos || 0) + 1 };
    marcar(); emit('curso');
  };
  T.quiz = (id) => T.state.curso.quiz[id] || null;

  /* ---------- Banco de preguntas: repaso espaciado de Leitner ----------
     Cada pregunta tiene una caja 0..4. Acertar sube una caja; fallar vuelve a la 0.
     Intervalos de repaso (días): 0, 1, 3, 7, 21. */
  const INTERVALOS = [0, 1, 3, 7, 21];
  T.INTERVALOS = INTERVALOS;
  T.pregunta = (qid) => T.state.curso.banco[qid] || null;
  T.registrar = function (qid, ok) {
    const b = T.state.curso.banco;
    const p = b[qid] || { caja: 0, n: 0, ok: 0, ult: null };
    p.n += 1; if (ok) p.ok += 1;
    p.caja = ok ? Math.min(4, p.caja + 1) : 0;
    p.ult = T.ymd();
    b[qid] = p;
    marcar(); emit('banco');
  };
  /* ¿Toca repasar? (nunca vista no cuenta) */
  T.debe = function (qid, hoy = T.ymd()) {
    const p = T.state.curso.banco[qid];
    if (!p) return false;
    return T.diffDays(p.ult, hoy) >= INTERVALOS[p.caja] && (p.caja < 4 || T.diffDays(p.ult, hoy) >= 21);
  };
  T.fallidas = () => Object.keys(T.state.curso.banco).filter((q) => T.state.curso.banco[q].caja === 0);
  T.addPrueba = function (rec) {
    const arr = T.state.curso.pruebas;
    arr.push(Object.assign({ fecha: T.ymd(), t: Date.now() }, rec));
    if (arr.length > 60) arr.splice(0, arr.length - 60);
    marcar(); emit('pruebas');
  };

  /* ---------- Exportar, importar y borrar ---------- */
  T.exportJSON = () => JSON.stringify({ app: 'maquinas-que-leen', exportado: new Date().toISOString(), datos: T.state }, null, 1);
  T.importJSON = function (txt) {
    const obj = JSON.parse(txt);
    const s = obj && obj.datos ? obj.datos : obj;
    if (!s || s.v !== 1 || !s.curso) throw new Error('El archivo no es una copia de «Máquinas que leen».');
    T.state = Object.assign(nuevo(), s);
    T.state.curso = Object.assign(nuevo().curso, s.curso);
    marcar(); emit('load');
  };
  T.borrarTodo = async function () {
    T.state = nuevo();
    try { localStorage.removeItem(KEY); } catch (e) { /* */ }
    dirty = false;
    if (db && uid) { try { await docRef().delete(); } catch (e) { console.warn(e); } }
    emit('load');
  };
  T.descargar = async function (filename, data, mime) {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const dl = await window.claude.use('downloads');
        if (dl) { await dl.save({ filename, data }); return 'ok'; }
      }
    } catch (e) { if (e && (e.code === 'declined' || e.code === 'cancelled')) return 'no'; }
    try {
      const url = URL.createObjectURL(new Blob([data], { type: mime || 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return 'ok';
    } catch (e) { return 'error'; }
  };
})();
