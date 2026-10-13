/* Editor de rutinas: jugadores, secuencia, alimentación, vista previa, mis rutinas e importación. */
MS.Editor = (function () {
  const { U, C, Shots, Compile, Top, Player, Routines } = MS;
  const KEY = 'ms.mine.v1';
  const COLORS = ['#1f6fb2', '#d4442e', '#2f9e5b'];
  const E = { rt: null, idx: null, pick: 'A', tl: null, timer: 0 };

  const mine = () => U.store.get(KEY, []) || [];
  const setMine = (arr) => { const ok = U.store.set(KEY, arr); if (!ok) U.toast('Este navegador no permite guardar; exporta la rutina a un archivo.', 'warn'); MS.Sim && MS.Sim.refreshList(); renderMine(); return ok; };

  function blank() {
    return { nombre: 'Mi rutina', nivel: 'Intermedio', objetivo: '', descripcion: '', ritmo: 'medio', ciclos: 4, intensidad: 'alta', series: '',
      jugadores: [{ id: 'A', nombre: 'Jugador A', color: COLORS[0], mano: 'D', nivel: 'avanzado', base: [3.0, 7.4] }, { id: 'B', nombre: 'Jugador B', color: COLORS[1], mano: 'D', nivel: 'avanzado', base: [3.4, 5.9] }],
      secuencia: [{ j: 'A', golpe: 'boast', rec: 'BC' }, { j: 'B', golpe: 'drive', rec: 'T' }], inicio: { x: 0.9, y: 8.5, z: 0.6 } };
  }
  function edit(rt, idx = null) {
    E.rt = U.clone(rt); E.idx = idx;
    if (!E.rt.secuencia) E.rt.secuencia = [];
    if (E.rt.modo === 'partido') U.toast('El partido simulado no tiene secuencia fija: aquí se editan jugadores y niveles.');
    if (!E.rt.inicio) E.rt.inicio = { x: 0.9, y: 8.5, z: 0.6 };
    for (const j of E.rt.jugadores) { if (!j.base) j.base = [C.Twait.x, C.Twait.y]; if (!j.nivel) j.nivel = 'avanzado'; if (!j.mano) j.mano = 'D'; }
    E.pick = E.rt.jugadores[0].id;
    renderAll();
  }

  const opt = (v, t, sel) => U.h('option', { value: v, selected: sel ? true : null, text: t });
  function renderForm() {
    const r = E.rt;
    U.$('#edName').value = r.nombre || ''; U.$('#edNivel').value = r.nivel || ''; U.$('#edObj').value = r.objetivo || ''; U.$('#edDesc').value = r.descripcion || '';
    U.$('#edRitmo').value = r.ritmo || 'medio'; U.$('#edCiclos').value = r.ciclos || ''; U.$('#edInt').value = r.intensidad || 'alta'; U.$('#edSeries').value = r.series || '';
    U.$('#edIx').value = r.inicio.x; U.$('#edIy').value = r.inicio.y; U.$('#edIz').value = r.inicio.z;
  }
  function renderPlayers() {
    const box = U.$('#edPlayers'); box.innerHTML = '';
    E.rt.jugadores.forEach((j, i) => {
      const col = U.h('input', { type: 'color', value: j.color || COLORS[i], 'aria-label': 'Color del jugador ' + j.id });
      col.addEventListener('input', () => { j.color = col.value; schedule(); });
      const nm = U.h('input', { type: 'text', value: j.nombre || '', 'aria-label': 'Nombre del jugador ' + j.id, maxlength: 30 });
      nm.addEventListener('input', () => { j.nombre = nm.value; schedule(); renderPick(); });
      const mano = U.h('select', { 'aria-label': 'Mano hábil' }, opt('D', 'Diestro', j.mano !== 'Z'), opt('Z', 'Zurdo', j.mano === 'Z'));
      mano.addEventListener('change', () => { j.mano = mano.value; schedule(); });
      const lv = U.h('select', { class: 'lv', 'aria-label': 'Nivel físico' }, Object.entries(Player.LEVELS).map(([k, v]) => opt(k, v.nombre, j.nivel === k)));
      lv.addEventListener('change', () => { j.nivel = lv.value; schedule(); });
      const del = U.h('button', { class: 'iconbtn del', title: 'Quitar jugador', 'aria-label': 'Quitar jugador ' + j.id, disabled: E.rt.jugadores.length <= 1 ? true : null }, '✕');
      del.addEventListener('click', () => {
        if (E.rt.secuencia.some((s) => s.j === j.id)) { U.toast('Primero quita sus golpes de la secuencia.', 'warn'); return; }
        E.rt.jugadores.splice(i, 1); renderAll();
      });
      box.append(U.h('div', { class: 'ed-player' }, col, U.h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 } }, U.h('b', { class: 'mono' }, j.id), nm), mano, lv, del));
    });
    U.$('#edAddP').disabled = E.rt.jugadores.length >= 3;
  }
  function renderSteps() {
    const box = U.$('#edSteps'); box.innerHTML = '';
    if (E.rt.modo === 'partido') { box.append(U.h('p', { class: 'small muted' }, 'Partido simulado: los golpes se eligen durante el juego. Usa el simulador para verlo.')); return; }
    const shotOpts = (sel) => {
      const s = U.h('select', { 'aria-label': 'Golpe' }, opt('fantasma', 'Fantasma (ghosting)', sel === 'fantasma'));
      const groups = {};
      for (const k of Shots.ORDER) { const d = Shots.CAT[k]; (groups[d.grupo] = groups[d.grupo] || []).push([k, d]); }
      for (const g in groups) s.append(U.h('optgroup', { label: g }, groups[g].map(([k, d]) => opt(k, d.nombre, sel === k))));
      return s;
    };
    E.rt.secuencia.forEach((st, i) => {
      const pj = U.h('select', { 'aria-label': 'Jugador' }, E.rt.jugadores.map((j) => opt(j.id, j.id + ' · ' + (j.nombre || ''), st.j === j.id)));
      pj.addEventListener('change', () => { st.j = pj.value; schedule(); });
      const g = shotOpts(st.golpe);
      g.addEventListener('change', () => { st.golpe = g.value; if (st.golpe === 'fantasma' && !st.zona) st.zona = 'aleatoria'; renderSteps(); schedule(); });
      const dz = U.h('select', { 'aria-label': 'Destino' });
      if (st.golpe === 'fantasma') { dz.append(opt('aleatoria', 'Esquina aleatoria', !st.zona || st.zona === 'aleatoria')); for (const k in C.ghost) dz.append(opt(k, C.ghost[k].nombre, st.zona === k)); }
      else { dz.append(opt('', 'Destino auto', !st.zona)); for (const k in C.zones) dz.append(opt(k, 'Bote ' + C.zones[k].nombre.toLowerCase(), st.zona === k)); }
      dz.addEventListener('change', () => { st.zona = dz.value || undefined; schedule(); });
      const im = U.h('select', { 'aria-label': 'Impacto', disabled: st.golpe === 'fantasma' ? true : null }, [['auto', 'Impacto auto'], ['volea', 'Volea (B4)'], ['sobrepique', 'Sobre pique (B5)'], ['maximo', 'Punto máximo (B6)'], ['bajo', 'Bajo (B7)']].map(([v, t]) => opt(v, t, (st.impacto || 'auto') === v)));
      im.addEventListener('change', () => { st.impacto = im.value === 'auto' ? undefined : im.value; schedule(); });
      const rec = U.h('select', { 'aria-label': 'Recupera a' }, opt('T', 'Recupera a la T', !st.rec || st.rec === 'T'), opt('base', 'Recupera a su base', st.rec === 'base'), Object.entries(C.spots).filter(([k]) => k !== 'T').map(([k, v]) => opt(k, v.nombre, st.rec === k)));
      if (Array.isArray(st.rec)) rec.append(opt('__custom', 'Punto propio', true));
      rec.addEventListener('change', () => { st.rec = rec.value === 'T' ? undefined : rec.value; schedule(); });
      const mv = (d) => { const k = i + d; if (k < 0 || k >= E.rt.secuencia.length) return; const a = E.rt.secuencia; [a[i], a[k]] = [a[k], a[i]]; renderSteps(); schedule(); };
      const acts = U.h('span', { class: 'acts' },
        U.h('button', { title: 'Subir', 'aria-label': 'Subir golpe', onclick: () => mv(-1) }, '↑'), U.h('button', { title: 'Bajar', 'aria-label': 'Bajar golpe', onclick: () => mv(1) }, '↓'),
        U.h('button', { title: 'Duplicar', 'aria-label': 'Duplicar golpe', onclick: () => { E.rt.secuencia.splice(i + 1, 0, U.clone(st)); renderSteps(); schedule(); } }, '⧉'),
        U.h('button', { title: 'Quitar', 'aria-label': 'Quitar golpe', onclick: () => { E.rt.secuencia.splice(i, 1); renderSteps(); schedule(); } }, '✕'));
      box.append(U.h('div', { class: 'ed-step', 'data-i': i }, U.h('span', { class: 'num' }, String(i + 1)), pj, g, dz, im, rec, acts));
    });
    if (!E.rt.secuencia.length) box.append(U.h('p', { class: 'small muted' }, 'Sin golpes. Pulsa «Añadir golpe».'));
  }
  function renderPick() {
    const box = U.$('#edPick'); box.innerHTML = '';
    const items = E.rt.jugadores.map((j) => [j.id, j.id]).concat([['inicio', 'Primera bola']]);
    for (const [k, t] of items) {
      const b = U.h('button', { 'aria-pressed': String(E.pick === k), text: t, title: k === 'inicio' ? 'Tocar la cancha para ubicar la primera bola' : 'Tocar la cancha para ubicar la base de ' + k });
      b.addEventListener('click', () => { E.pick = k; renderPick(); });
      box.append(b);
    }
  }
  function renderAll() { renderForm(); renderPlayers(); renderSteps(); renderPick(); schedule(true); }

  function schedule(now) { clearTimeout(E.timer); E.timer = setTimeout(preview, now ? 10 : 260); }
  function preview() {
    const cv = U.$('#edCanvas');
    const r = cv.getBoundingClientRect(); const w = Math.max(200, r.width), h = Math.max(300, r.height);
    const ctx = U.fitCanvas(cv, w, h);
    const warn = U.$('#edWarn'); warn.innerHTML = '';
    let tl = null;
    try { MS.Export.validate(E.rt); tl = Compile.compile(E.rt); } catch (e) { warn.append(U.h('div', { class: 'warnbox' }, e.message)); }
    E.tl = tl;
    ctx.clearRect(0, 0, w, h);
    if (tl) MS.Export.diagram(ctx, 0, 0, w, h, E.rt, tl);
    else { const L = Top.layout(w, h); Top.court(ctx, L, {}); }
    /* marca de la primera bola */
    const L = Top.layout(w, h);
    if (E.rt.inicio && E.rt.modo !== 'partido') { ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(L.X(E.rt.inicio.x), L.Y(E.rt.inicio.y), 6, 0, Math.PI * 2); ctx.stroke(); }
    if (tl) {
      const late = tl.shots.filter((s) => s.late > 0.02).length;
      const lines = [];
      lines.push(`${tl.shots.length} golpes · ${U.num(tl.duration, 1)} s simulados · cálculo en ${U.num(tl.ms || 0, 0)} ms`);
      for (const p of tl.players) lines.push(`${p.id}: ${U.num(p.stats.dist, 1)} m · ${p.stats.lungI + p.stats.lungD} estocadas (izq. ${p.stats.lungI} / der. ${p.stats.lungD})`);
      warn.append(U.h('p', { class: 'small muted' }, lines.join(' · ')));
      if (tl.warnings.length) warn.append(U.h('div', { class: 'warnbox', style: { marginTop: '6px' } }, U.h('b', null, late ? 'Hay golpes difíciles de alcanzar' : 'Avisos'), U.h('ul', { class: 'keys' }, tl.warnings.slice(0, 5).map((x) => U.h('li', null, x)))));
    }
  }

  function renderMine() {
    const box = U.$('#myList'); if (!box) return; box.innerHTML = '';
    const arr = mine();
    if (!arr.length) { box.append(U.h('p', { class: 'small muted' }, 'Todavía no guardas rutinas. Edita una y pulsa «Guardar en mis rutinas».')); return; }
    arr.forEach((r, i) => {
      const it = U.h('div', { class: 'it' }, U.h('div', { style: { minWidth: 0 } }, U.h('b', null, r.nombre || 'Sin nombre'), U.h('div', { class: 'tiny muted' }, (r.jugadores || []).length + ' jugador(es) · ' + ((r.secuencia || []).length) + ' golpes')),
        U.h('span', { class: 'chips' },
          U.h('button', { class: 'btn', onclick: () => { edit(r, i); U.toast('Rutina cargada en el editor'); } }, 'Editar'),
          U.h('button', { class: 'btn', onclick: () => { MS.App.go('simulador'); MS.Sim.open(r, { key: 'mine:' + i }); } }, 'Simular'),
          U.h('button', { class: 'btn danger', onclick: () => MS.App.modal({ title: 'Borrar rutina', body: `<p>¿Borrar «${U.esc(r.nombre || 'Sin nombre')}» de este navegador? Si la exportaste, el archivo sigue disponible.</p>`, buttons: [{ label: 'Cancelar' }, { label: 'Borrar', danger: true, onClick: () => { const a = mine(); a.splice(i, 1); setMine(a); if (E.idx === i) E.idx = null; } }] }) }, 'Borrar')));
      box.append(it);
    });
  }

  function doImport() {
    const ta = U.h('textarea', { rows: 5, placeholder: 'Pega aquí el código (MSQ1.…) o el contenido del archivo .json', 'aria-label': 'Código o JSON de la rutina' });
    const drop = U.h('div', { class: 'notebox', style: { marginTop: '8px', textAlign: 'center', cursor: 'pointer' } }, 'O elige / arrastra aquí un archivo .json');
    drop.addEventListener('click', () => U.$('#edFile').click());
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.outline = '2px dashed var(--brand)'; });
    drop.addEventListener('dragleave', () => { drop.style.outline = ''; });
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.outline = ''; const f = e.dataTransfer.files[0]; if (f) f.text().then((t) => { ta.value = t; }); });
    const msg = U.h('p', { class: 'small', style: { marginTop: '8px', color: 'var(--bad)' } });
    const dlg = MS.App.modal({ title: 'Importar rutinas', body: U.h('div', null, ta, drop, msg), buttons: [{ label: 'Cancelar' }, { label: 'Importar', primary: true, onClick: async () => {
      try { const list = await MS.Export.importText(ta.value); accept(list); } catch (e) { msg.textContent = e.message; return true; }
    } }] });
    E.importBox = ta;
    return dlg;
  }
  function accept(list) {
    if (list.length === 1) { edit(list[0], null); U.toast('Rutina importada: revísala y guárdala.'); MS.App.go('editor'); }
    else { const a = mine().concat(list); setMine(a); U.toast(list.length + ' rutinas añadidas a «Mis rutinas».'); }
  }

  function init() {
    const bind = (id, key, num) => U.$(id).addEventListener('input', (e) => { E.rt[key] = num ? (e.target.value === '' ? undefined : +e.target.value) : e.target.value; schedule(); });
    bind('#edName', 'nombre'); bind('#edNivel', 'nivel'); bind('#edObj', 'objetivo'); bind('#edDesc', 'descripcion'); bind('#edSeries', 'series'); bind('#edCiclos', 'ciclos', true);
    U.$('#edRitmo').addEventListener('change', (e) => { E.rt.ritmo = e.target.value; schedule(); });
    U.$('#edInt').addEventListener('change', (e) => { E.rt.intensidad = e.target.value; schedule(); });
    for (const k of ['x', 'y', 'z']) U.$('#edI' + k).addEventListener('input', (e) => { const v = +e.target.value; if (Number.isFinite(v)) { E.rt.inicio[k] = v; schedule(); } });
    U.$('#edAddP').addEventListener('click', () => {
      if (E.rt.jugadores.length >= 3) return;
      const id = ['A', 'B', 'C'].find((x) => !E.rt.jugadores.some((j) => j.id === x));
      E.rt.jugadores.push({ id, nombre: 'Jugador ' + id, color: COLORS[['A', 'B', 'C'].indexOf(id)], mano: 'D', nivel: 'avanzado', base: [3.2, id === 'C' ? 3.6 : 7.6] });
      renderAll();
    });
    U.$('#edAddS').addEventListener('click', () => {
      const last = E.rt.secuencia[E.rt.secuencia.length - 1];
      const ids = E.rt.jugadores.map((j) => j.id);
      const nextJ = last ? ids[(ids.indexOf(last.j) + 1) % ids.length] : ids[0];
      E.rt.secuencia.push({ j: nextJ, golpe: last && last.golpe === 'fantasma' ? 'fantasma' : 'drive', zona: last && last.golpe === 'fantasma' ? 'aleatoria' : undefined });
      renderSteps(); schedule();
    });
    U.$('#edNew').addEventListener('click', () => { edit(blank()); U.toast('Rutina nueva'); });
    U.$('#edImport').addEventListener('click', doImport);
    U.$('#edFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      const txt = await f.text();
      if (E.importBox && document.body.contains(E.importBox)) { E.importBox.value = txt; return; }
      try { accept(await MS.Export.importText(txt)); } catch (err) { MS.App.modal({ title: 'No se pudo importar', body: `<p>${U.esc(err.message)}</p>` }); }
    });
    U.$('#edTry').addEventListener('click', () => {
      try { MS.Export.validate(E.rt); } catch (e) { U.toast(e.message, 'warn'); return; }
      MS.App.go('simulador'); MS.Sim.open(U.clone(E.rt), { temp: true });
    });
    U.$('#edSave').addEventListener('click', () => {
      try { MS.Export.validate(E.rt); } catch (e) { U.toast(e.message, 'warn'); return; }
      const a = mine(); const o = MS.Export.clean(E.rt);
      if (E.idx != null && a[E.idx]) a[E.idx] = o; else { a.push(o); E.idx = a.length - 1; }
      if (setMine(a)) U.toast('Guardada en «Mis rutinas»');
    });
    for (const b of U.$$('[data-edexp]')) b.addEventListener('click', () => {
      try { MS.Export.validate(E.rt); } catch (e) { U.toast(e.message, 'warn'); return; }
      MS.Export.run(b.dataset.edexp, E.rt, E.tl);
    });
    U.$('#myExportAll').addEventListener('click', () => { const a = mine(); if (!a.length) { U.toast('No hay rutinas guardadas.', 'warn'); return; } MS.Export.exportPack(a); });
    const cv = U.$('#edCanvas');
    cv.addEventListener('click', (e) => {
      const r = cv.getBoundingClientRect(); const L = Top.layout(r.width, r.height);
      const p = L.inv(e.clientX - r.left, e.clientY - r.top);
      if (p.x < 0 || p.x > C.W || p.y < 0 || p.y > C.L) return;
      const q = { x: Math.round(U.clamp(p.x, 0.15, C.W - 0.15) * 20) / 20, y: Math.round(U.clamp(p.y, 0.3, C.L - 0.2) * 20) / 20 };
      if (E.pick === 'inicio') { E.rt.inicio.x = q.x; E.rt.inicio.y = q.y; renderForm(); }
      else { const j = E.rt.jugadores.find((x) => x.id === E.pick); if (j) j.base = [q.x, q.y]; }
      schedule(true);
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => schedule(true)).observe(cv);
    edit(Routines.byId.boastDrive);
    renderMine();
  }
  MS.App.on('editor', { init, show: () => schedule(true) });
  return { mine, edit, E };
})();
