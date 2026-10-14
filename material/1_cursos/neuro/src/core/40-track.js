/* ===================================================================
   40-track.js — Almacén del progreso personal.
   Guarda: perfil, hábitos, registro diario (hábitos cumplidos, peso,
   cintura, sueño, pasos, entrenamientos con RPE), automaticidad SRBAI
   semanal y avance del curso (capítulos estudiados y autoevaluaciones).
   Dónde: siempre en este navegador (localStorage) y, cuando la página
   corre como Artifact con el permiso «db», también en la base de datos
   privada del usuario: data/users/<id>/perfil y data/users/<id>/m-AAAA-MM
   (un documento por mes). Cada documento lleva su marca de tiempo; al
   cargar gana la copia más reciente y la otra se actualiza.
   =================================================================== */
(function () {
  'use strict';
  const RC = window.RC;
  const KEY = 'recablear:track';
  const T = (RC.track = {});
  const listeners = [];
  T.on = (fn) => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };
  const emit = (what) => listeners.slice().forEach((f) => { try { f(what); } catch (e) { console.error(e); } });

  const nuevo = () => ({
    v: 1,
    perfil: { nombre: '', sexo: 'h', edad: 35, talla: 170, peso0: 0, grasaPct: 0, pal: 1.6, metaPeso: 0, inicio: '' },
    habitos: [],
    curso: { leidos: {}, quiz: {} },
    meses: {},       /* 'AAAA-MM' → { dias: { 'AAAA-MM-DD': {...} }, srbai: { habitoId: { 'AAAA-MM-DD': puntaje } } } */
    ts: { perfil: 0 } /* marcas de tiempo por documento: 'perfil' y 'm-AAAA-MM' */
  });
  T.state = nuevo();
  T.backend = 'local';    /* 'local' | 'db' */
  T.status = 'Guardado en este navegador.';

  /* ---------- Fechas locales ---------- */
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  T.ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  T.parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  T.addDays = (s, k) => { const d = T.parse(s); d.setDate(d.getDate() + k); return T.ymd(d); };
  T.diffDays = (a, b) => Math.round((T.parse(b) - T.parse(a)) / 86400000);
  const mesDe = (s) => s.slice(0, 7);

  /* ---------- Persistencia local ---------- */
  function guardarLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(T.state)); } catch (e) { /* sin almacenamiento */ }
  }
  function cargarLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && obj.v === 1 ? obj : null;
    } catch (e) { return null; }
  }
  const loc = cargarLocal();
  if (loc) T.state = Object.assign(nuevo(), loc);

  /* ---------- Base de datos del Artifact (opcional) ---------- */
  let db = null, uid = null;
  const dirty = new Set();
  let timer = null, writing = false;
  const docRef = (k) => db.doc(`data/users/${uid}/${k}`);
  function cuerpo(k) {
    const s = T.state;
    if (k === 'perfil') return { v: 1, perfil: s.perfil, habitos: s.habitos, curso: s.curso, ts: s.ts.perfil || 0 };
    const m = k.slice(2);
    return { v: 1, mes: m, datos: s.meses[m] || { dias: {}, srbai: {} }, ts: s.ts[k] || 0 };
  }
  function marcar(k) {
    T.state.ts[k] = Date.now();
    guardarLocal();
    if (db && uid) { dirty.add(k); programar(); }
  }
  function programar() {
    clearTimeout(timer);
    timer = setTimeout(vaciar, 1200);
  }
  async function vaciar() {
    if (writing) { programar(); return; }
    writing = true;
    try {
      while (dirty.size) {
        const k = dirty.values().next().value;
        dirty.delete(k);
        try { await docRef(k).set(cuerpo(k)); }
        catch (e) {
          if (e && e.code === 'unavailable') { dirty.add(k); await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500)); }
          else if (e && e.code === 'quota_exceeded') { T.status = 'La base de datos está llena: exporte sus datos y borre meses antiguos.'; emit('status'); }
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
      const snap = await db.collection(`data/users/${uid}`).get();
      const remotos = {};
      snap.docs.forEach((d) => { if (d.exists) remotos[d.id] = d.data(); });
      const s = T.state;
      /* perfil */
      const rp = remotos.perfil;
      if (rp && (rp.ts || 0) >= (s.ts.perfil || 0)) {
        s.perfil = Object.assign(nuevo().perfil, rp.perfil || {});
        s.habitos = Array.isArray(rp.habitos) ? rp.habitos.map((h) => Object.assign({}, h)) : [];
        s.curso = { leidos: Object.assign({}, (rp.curso || {}).leidos || {}), quiz: Object.assign({}, (rp.curso || {}).quiz || {}) };
        s.ts.perfil = rp.ts || 0;
      } else if ((s.ts.perfil || 0) > 0) dirty.add('perfil');
      /* meses */
      const claves = new Set(Object.keys(s.meses).map((m) => 'm-' + m).concat(Object.keys(remotos).filter((k) => k.startsWith('m-'))));
      for (const k of claves) {
        const m = k.slice(2), r = remotos[k];
        if (r && (r.ts || 0) >= (s.ts[k] || 0)) { s.meses[m] = JSON.parse(JSON.stringify(r.datos || { dias: {}, srbai: {} })); s.ts[k] = r.ts || 0; }
        else if (s.meses[m]) dirty.add(k);
      }
      T.backend = 'db';
      T.status = 'Guardado en su cuenta (privado) y en este navegador.';
      guardarLocal();
      if (dirty.size) programar();
      emit('load');
    } catch (e) {
      console.warn('track db', e);
      db = null;
      T.status = 'Guardado solo en este navegador (la base de datos no respondió).';
      emit('status');
    }
  }
  setTimeout(conectar, 0);

  /* ---------- API: curso ---------- */
  T.leido = (id) => !!T.state.curso.leidos[id];
  T.setLeido = function (id, v) {
    if (v) T.state.curso.leidos[id] = T.ymd(); else delete T.state.curso.leidos[id];
    marcar('perfil'); emit('curso');
  };
  T.setQuiz = function (id, ok, n) {
    const prev = T.state.curso.quiz[id];
    T.state.curso.quiz[id] = { ok, n, fecha: T.ymd(), mejor: Math.max(ok, prev ? prev.mejor || prev.ok || 0 : 0) };
    marcar('perfil'); emit('curso');
  };
  T.quiz = (id) => T.state.curso.quiz[id] || null;

  /* ---------- API: perfil y hábitos ---------- */
  T.setPerfil = function (patch) { Object.assign(T.state.perfil, patch); marcar('perfil'); emit('perfil'); };
  T.addHabito = function (h) {
    const id = 'h' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    T.state.habitos.push(Object.assign({ id, nombre: '', senal: '', tipo: 'hacer', creado: T.ymd(), activo: true, area: 'otro' }, h));
    marcar('perfil'); emit('habitos');
    return id;
  };
  T.updHabito = function (id, patch) { const h = T.state.habitos.find((x) => x.id === id); if (h) { Object.assign(h, patch); marcar('perfil'); emit('habitos'); } };
  T.delHabito = function (id) { T.state.habitos = T.state.habitos.filter((x) => x.id !== id); marcar('perfil'); emit('habitos'); };

  /* ---------- API: registro diario ---------- */
  const mes = (m) => (T.state.meses[m] = T.state.meses[m] || { dias: {}, srbai: {} });
  T.dia = (fecha) => { const m = T.state.meses[mesDe(fecha)]; return (m && m.dias[fecha]) || null; };
  T.setDia = function (fecha, patch) {
    const M = mes(mesDe(fecha));
    const d = (M.dias[fecha] = M.dias[fecha] || {});
    for (const k in patch) {
      if (patch[k] === null || patch[k] === '' || (typeof patch[k] === 'number' && !isFinite(patch[k]))) delete d[k];
      else d[k] = patch[k];
    }
    if (!Object.keys(d).length) delete M.dias[fecha];
    marcar('m-' + mesDe(fecha)); emit('dia');
  };
  T.setHabDia = function (fecha, hid, val) {
    const d = T.dia(fecha) || {};
    const h = Object.assign({}, d.h || {});
    if (val === null) delete h[hid]; else h[hid] = val;
    T.setDia(fecha, { h: Object.keys(h).length ? h : null });
  };
  T.addSesion = function (fecha, s) {
    const d = T.dia(fecha) || {};
    T.setDia(fecha, { ent: (d.ent || []).concat([s]) });
  };
  T.delSesion = function (fecha, i) {
    const d = T.dia(fecha) || {};
    const e = (d.ent || []).slice();
    e.splice(i, 1);
    T.setDia(fecha, { ent: e.length ? e : null });
  };
  T.setSrbai = function (fecha, hid, val) {
    const M = mes(mesDe(fecha));
    M.srbai[hid] = M.srbai[hid] || {};
    if (val === null) delete M.srbai[hid][fecha]; else M.srbai[hid][fecha] = val;
    marcar('m-' + mesDe(fecha)); emit('srbai');
  };
  /* Recorre los días registrados en orden: devuelve [{fecha, ...datos}] */
  T.dias = function () {
    const out = [];
    for (const m of Object.keys(T.state.meses).sort()) {
      const dd = T.state.meses[m].dias;
      for (const f of Object.keys(dd).sort()) out.push(Object.assign({ fecha: f }, dd[f]));
    }
    return out;
  };
  T.srbaiSerie = function (hid) {
    const out = [];
    for (const m of Object.keys(T.state.meses).sort()) {
      const s = (T.state.meses[m].srbai || {})[hid] || {};
      for (const f of Object.keys(s).sort()) out.push({ fecha: f, v: s[f] });
    }
    return out;
  };

  /* ---------- Exportar, importar y borrar ---------- */
  T.exportJSON = () => JSON.stringify({ app: 'recablear', exportado: new Date().toISOString(), datos: T.state }, null, 1);
  T.exportCSV = function () {
    const H = T.state.habitos;
    const head = ['fecha', 'peso_kg', 'cintura_cm', 'sueno_h', 'pasos', 'carga_sRPE', 'sesiones'].concat(H.map((h) => 'habito:' + h.nombre.replace(/[,;\n]/g, ' ')));
    const rows = [head.join(',')];
    for (const d of T.dias()) {
      const carga = (d.ent || []).reduce((s, e) => s + (e.rpe || 0) * (e.min || 0), 0);
      rows.push([d.fecha, d.peso ?? '', d.cintura ?? '', d.sueno ?? '', d.pasos ?? '', carga || '', (d.ent || []).length || ''].concat(H.map((h) => (d.h && d.h[h.id] !== undefined ? d.h[h.id] : ''))).join(','));
    }
    return rows.join('\n');
  };
  T.importJSON = function (txt) {
    const obj = JSON.parse(txt);
    const s = obj && obj.datos ? obj.datos : obj;
    if (!s || s.v !== 1 || !s.perfil || !s.meses) throw new Error('El archivo no es una copia de «Recablear».');
    T.state = Object.assign(nuevo(), s);
    const ahora = Date.now();
    T.state.ts = { perfil: ahora };
    for (const m of Object.keys(T.state.meses)) T.state.ts['m-' + m] = ahora;
    guardarLocal();
    if (db && uid) { dirty.add('perfil'); for (const m of Object.keys(T.state.meses)) dirty.add('m-' + m); programar(); }
    emit('load');
  };
  T.borrarTodo = async function () {
    const meses = Object.keys(T.state.meses);
    T.state = nuevo();
    try { localStorage.removeItem(KEY); } catch (e) { /* */ }
    dirty.clear();
    if (db && uid) {
      try { await docRef('perfil').delete(); for (const m of meses) await docRef('m-' + m).delete(); } catch (e) { console.warn(e); }
    }
    emit('load');
  };
  /* Descarga de un archivo: capacidad «downloads» del Artifact o enlace local */
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
