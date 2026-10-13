/* ===================================================================
   80-extras.js — Utilidades de la guía: descargas, pasos de software,
   listas de chequeo que se recuerdan, copiar texto, tablas en simulaciones
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;
  const el = RT.el;

  /* ---------- Descargas ----------
     En el artefacto publicado se usa la capacidad «downloads» (el visor pide confirmación);
     en la copia local se usa un enlace con blob. */
  RT.b64aBytes = function (b64) {
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  let dlPromise = null;
  const capDescargas = () => {
    if (!window.claude || typeof window.claude.use !== 'function') return Promise.resolve(null);
    if (!dlPromise) dlPromise = window.claude.use('downloads').catch(() => null);
    return dlPromise;
  };
  RT.guardar = async function (nombre, datos, tipo = 'application/octet-stream') {
    const dl = await capDescargas();
    if (dl) {
      try { await dl.save({ filename: nombre, data: datos }); return 'ok'; }
      catch (e) { return e && e.code === 'declined' ? 'cancelado' : 'error:' + (e && e.message ? e.message : e); }
    }
    try {
      const blob = datos instanceof Blob ? datos : new Blob([datos], { type: tipo });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = nombre; document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return 'ok';
    } catch (e) { return 'error:' + e.message; }
  };
  /* Botón de descarga con mensaje de estado */
  RT.botonDescarga = function (parent, texto, fn, o = {}) {
    const wrap = el('div', 'dl-row');
    const b = el('button', 'btn' + (o.primary ? ' primary' : ''), '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 6.8 8 10.3l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' + texto);
    b.type = 'button';
    const msg = el('span', 'dl-msg');
    b.addEventListener('click', async () => {
      msg.textContent = 'Preparando…';
      try {
        const [nombre, datos, tipo] = await fn();
        const r = await RT.guardar(nombre, datos, tipo);
        msg.textContent = r === 'ok' ? 'Archivo entregado: ' + nombre : r === 'cancelado' ? 'Descarga cancelada.' : 'No se pudo descargar en esta vista. Use la copia local de la guía.';
      } catch (e) { msg.textContent = 'Error: ' + e.message; }
    });
    wrap.append(b, msg);
    parent.append(wrap);
    return b;
  };

  /* ---------- Copiar texto ---------- */
  RT.copiar = function (btn, texto) {
    const done = (ok) => { const t = btn.textContent; btn.textContent = ok ? 'Copiado' : 'Seleccione y use Ctrl+C'; setTimeout(() => { btn.textContent = t; }, 1800); };
    try { navigator.clipboard.writeText(texto).then(() => done(true), () => done(false)); } catch (e) { done(false); }
  };

  /* ---------- Lista de chequeo que se recuerda en este navegador ---------- */
  RT.checklist = function (host, clave, items, o = {}) {
    const st = RT.store.get('chk:' + clave, {});
    const ul = el('ul', 'checklist');
    const prog = el('div', 'chk-prog');
    const upd = () => {
      const n = items.length, k = items.filter((it, i) => st[it.id || i]).length;
      prog.innerHTML = `<span style="width:${(100 * k) / n}%"></span><b>${k} de ${n}</b>`;
      if (o.onChange) o.onChange(k, n);
    };
    items.forEach((it, i) => {
      const id = it.id || String(i);
      const li = el('li');
      const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = 'chk-' + clave + '-' + id; inp.checked = !!st[id];
      const lab = el('label', null, it.t + (it.ref ? ` <span class="ref">${it.ref}</span>` : ''));
      lab.htmlFor = inp.id;
      inp.addEventListener('change', () => { st[id] = inp.checked; RT.store.set('chk:' + clave, st); upd(); });
      li.append(inp, lab);
      ul.append(li);
    });
    host.append(prog, ul);
    upd();
    return { estado: st };
  };

  /* ---------- Tabla HTML compacta ---------- */
  RT.tabla = function (cab, filas, o = {}) {
    const esc = (v) => (v === null || v === undefined ? '' : String(v));
    let h = `<table class="sim-tab${o.cls ? ' ' + o.cls : ''}"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
    for (const f of filas) h += `<tr${f._cls ? ` class="${f._cls}"` : ''}>${(f.cells || f).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;
    return h + '</tbody></table>';
  };

  /* ---------- Paso a paso de un programa ----------
     <div class="pasos" data-pasos="clave"></div> con los datos en RT.PASOS[clave]:
     [{ t, donde, html, verif, ojo, fig }]. El avance se recuerda en este navegador. */
  RT.PASOS = RT.PASOS || {};
  RT.montarPasos = function (host) {
    const clave = host.dataset.pasos, pasos = RT.PASOS[clave];
    if (!pasos) { host.textContent = 'Pasos no encontrados: ' + clave; throw new Error('pasos no encontrados: ' + clave); }
    const st = RT.store.get('pasos:' + clave, { cur: 0, hecho: {} });
    if (!(st.cur >= 0 && st.cur < pasos.length)) st.cur = 0;
    host.innerHTML = '';
    const lista = el('div', 'pasos-lista');
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', 'Pasos');
    const det = el('div', 'pasos-det');
    det.setAttribute('role', 'tabpanel');
    det.setAttribute('aria-live', 'polite');
    host.append(lista, det);
    const botones = pasos.map((p, i) => {
      const b = el('button', null, `<span class="n">${i + 1}</span><span>${p.t}</span>`);
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.addEventListener('click', () => { st.cur = i; pintar(true); });
      lista.append(b);
      return b;
    });
    const guardar = () => RT.store.set('pasos:' + clave, st);
    const pintar = (foco) => {
      const i = st.cur, p = pasos[i];
      botones.forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('hecho', !!st.hecho[k]); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      const n = Object.keys(st.hecho).filter((k) => st.hecho[k]).length;
      det.innerHTML = `<h4>${i + 1}. ${p.t}</h4>` + (p.donde ? `<div class="donde">${p.donde}</div>` : '') + (p.html || '') +
        (p.fig ? `<div class="pasos-fig">${typeof p.fig === 'function' ? p.fig() : p.fig}</div>` : '') +
        (p.verif ? `<div class="verif"><b>Compruebe:</b> ${p.verif}</div>` : '') +
        (p.ojo ? `<div class="ojo"><b>Error frecuente:</b> ${p.ojo}</div>` : '');
      const nav = el('div', 'pasos-nav');
      const bA = el('button', 'btn', '← Anterior'); bA.type = 'button'; bA.disabled = i === 0;
      const bH = el('button', 'btn' + (st.hecho[i] ? ' on' : ''), st.hecho[i] ? '✓ Hecho' : 'Marcar como hecho'); bH.type = 'button';
      const bS = el('button', 'btn primary', 'Siguiente →'); bS.type = 'button'; bS.disabled = i === pasos.length - 1;
      const prog = el('span', 'dl-msg', `${n} de ${pasos.length} pasos hechos`);
      bA.addEventListener('click', () => { st.cur = Math.max(0, i - 1); pintar(); });
      bS.addEventListener('click', () => { st.cur = Math.min(pasos.length - 1, i + 1); pintar(); });
      bH.addEventListener('click', () => { st.hecho[i] = !st.hecho[i]; if (st.hecho[i] && i < pasos.length - 1) st.cur = i + 1; pintar(); });
      nav.append(bA, bH, bS, prog);
      det.append(nav);
      guardar();
      if (foco) { const b = botones[i]; if (b.scrollIntoView && lista.scrollHeight > lista.clientHeight) b.scrollIntoView({ block: 'nearest' }); }
    };
    pintar();
  };

  /* ---------- Formato con coma decimal ---------- */
  RT.f = (x, d = 1) => RT.L.C.fmt(x, d);
  RT.estadoChip = (e) => `<span class="chip ${e === 'ok' ? 'ok' : e === 'falla' ? 'bad' : 'mid'}">${e === 'ok' ? 'Cumple' : e === 'falla' ? 'No cumple' : 'Revisar'}</span>`;
})();
