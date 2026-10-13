/* Controlador del simulador de cancha. */
MS.Sim = (function () {
  const { U, C, Compile, TL, Player, Muscles, Shots, Routines, Top, TV } = MS;
  const S = {
    rt: null, base: null, tl: null, t: 0, playing: true, speed: 1, cam: Object.assign({}, TV.PRESETS.tv), camName: 'tv',
    opts: { huellas: true, trayectoria: true, prediccion: false, recorridos: false, calor: false, zonas: false, distancias: false, angulos: true, musculos: false },
    focus: null, cache: {}, view: 'both', lastBody: 0, holdEnd: 0, over: {}, srcLabel: '',
  };
  let cvTV, cvTop, body, raf = 0, lastTs = 0, visible = false;
  const PH_DESC = {
    espera: 'Posición de espera: pies a la anchura de los hombros, rodillas semiflexionadas, raqueta arriba y mirada en la bola.',
    split: 'Pequeño salto que cae justo cuando el rival impacta: estira gemelos y cuádriceps para salir con energía elástica.',
    salida: 'Primer paso explosivo hacia la bola, con la raqueta ya preparada («radar prendido»).',
    carrera: 'Pasos de desplazamiento: el centro de masa avanza en línea recta, sin saltos.',
    estocada: 'Última zancada: frena con cuádriceps y glúteo (trabajo excéntrico). Rodilla cerca de 90° y talón trasero anclado.',
    golpe: 'Impacto coordinado con el apoyo del pie delantero: «dos sonidos», raqueta-bola y pie-piso.',
    empuje: 'Empuje con la pierna delantera para salir de la estocada (trabajo concéntrico de cuádriceps y glúteo).',
    recuperacion: 'Regreso a la T de frente al frontón, caminando la cancha.',
  };

  function allRoutines() {
    const mine = MS.Editor ? MS.Editor.mine() : [];
    return { lib: Routines.LIB, mine };
  }
  function fillSelect(selId) {
    const sel = U.$('#rtSel');
    sel.innerHTML = '';
    const { lib, mine } = allRoutines();
    const groups = {};
    for (const r of lib) (groups[r.cat] = groups[r.cat] || []).push(r);
    for (const g of ['Solo', 'Dos jugadores', 'Tres jugadores', 'Partido']) {
      if (!groups[g]) continue;
      const og = U.h('optgroup', { label: g === 'Solo' ? 'Un jugador' : g });
      for (const r of groups[g]) og.append(U.h('option', { value: 'lib:' + r.id, text: r.nombre }));
      sel.append(og);
    }
    if (mine.length) {
      const og = U.h('optgroup', { label: 'Mis rutinas' });
      mine.forEach((r, i) => og.append(U.h('option', { value: 'mine:' + i, text: r.nombre || 'Sin nombre' })));
      sel.append(og);
    }
    if (S.temp) sel.append(U.h('optgroup', { label: 'En edición' }, U.h('option', { value: 'temp', text: (S.temp.nombre || 'Rutina') + ' (sin guardar)' })));
    if (selId) sel.value = selId;
  }
  function routineFromKey(key) {
    if (key === 'temp') return S.temp;
    if (key.startsWith('lib:')) return Routines.byId[key.slice(4)];
    if (key.startsWith('mine:')) return allRoutines().mine[+key.slice(5)];
    return Routines.LIB[0];
  }

  function overrides() {
    const o = {};
    const nv = U.$('#setNivel').value, tc = U.$('#setTec').value, rm = U.$('#setRitmo').value, cy = +U.$('#setCiclos').value;
    if (nv) o.nivelGlobal = nv;
    if (tc) o.tecnicaGlobal = tc;
    if (rm) o.ritmo = rm;
    if (cy > 0) o.ciclos = Math.min(20, cy);
    o.temp = +U.$('#setTemp').value; o.alt = +U.$('#setAlt').value;
    return o;
  }

  function load(rt, keepTime) {
    S.base = rt;
    const frac = S.tl ? S.t / S.tl.duration : 0;
    S.tl = Compile.compile(rt, overrides());
    S.cache = {};
    S.t = keepTime ? frac * S.tl.duration : 0;
    if (!S.tl.players.find((p) => p.id === S.focus)) S.focus = S.tl.players[0] ? S.tl.players[0].id : null;
    renderTabs(); renderInfo(); renderShots(); renderStats(); renderTicks(); renderMatch();
    draw();
  }

  /* ---------- paneles ---------- */
  function renderTabs() {
    const box = U.$('#pTabs'); box.innerHTML = '';
    for (const p of S.tl.players) {
      const b = U.h('button', { 'aria-pressed': String(p.id === S.focus), style: `--pc:${p.color}` }, U.h('span', { class: 'sw', style: { background: p.color } }), p.nombre);
      b.addEventListener('click', () => { S.focus = p.id; renderTabs(); renderStats(); draw(); });
      box.append(b);
    }
  }
  function renderInfo() {
    const r = S.base, box = U.$('#rtInfo');
    const chips = U.$('#rtChips'); chips.innerHTML = '';
    const n = (r.jugadores || []).length;
    chips.append(U.h('span', { class: 'tag brand' }, n === 1 ? '1 jugador' : n + ' jugadores'));
    if (r.nivel) chips.append(U.h('span', { class: 'tag' }, r.nivel));
    chips.append(U.h('span', { class: 'tag' }, r.modo === 'partido' ? 'Partido' : S.tl.shots.length + ' golpes · ' + U.num(S.tl.duration, 0) + ' s'));
    box.innerHTML = '';
    box.append(U.h('p', { class: 'eyebrow' }, r.cat || 'Rutina personalizada'));
    box.append(U.h('h3', { style: { fontSize: '1.35rem', fontStyle: 'italic', fontWeight: 800, margin: '4px 0 8px' } }, r.nombre || 'Rutina'));
    if (r.objetivo) box.append(U.h('p', { class: 'notebox' }, U.h('b', null, 'Objetivo: '), r.objetivo));
    if (r.descripcion) box.append(U.h('p', { style: { marginTop: '10px' } }, r.descripcion));
    if (r.claves && r.claves.length) { box.append(U.h('h4', { style: { marginTop: '12px' } }, 'Puntos clave')); box.append(U.h('ul', { class: 'keys' }, r.claves.map((k) => U.h('li', null, k)))); }
    const row = U.h('div', { class: 'chips', style: { marginTop: '12px' } });
    if (r.series) row.append(U.h('span', { class: 'tag' }, 'Series: ' + r.series));
    for (const m of r.musculos || []) { const g = Muscles.byId[m]; if (g) { const c = U.h('button', { class: 'chip', text: g.nombre }); c.addEventListener('click', () => { MS.App.go('anatomia'); MS.Anat && MS.Anat.select(m); }); row.append(c); } }
    box.append(row);
  }
  function clsTag(s) {
    if (!s.cls) return '';
    const c = Shots.CLS[s.cls];
    return c ? (c.cod !== '—' ? c.cod + ' · ' : '') + c.nombre : s.cls;
  }
  function renderShots() {
    const tb = U.$('#shotTbl'); tb.innerHTML = '';
    tb.append(U.h('thead', null, U.h('tr', null, ['#', 's', 'Jugador', 'Golpe', 'Impacto', 'Altura', 'Llegada'].map((x) => U.h('th', null, x)))));
    const body = U.h('tbody');
    S.tl.shots.forEach((s, i) => {
      const pl = S.tl.players.find((p) => p.id === s.j);
      const def = Shots.CAT[s.golpe];
      const late = s.late > 0.02 ? U.h('span', { class: 'tag bad' }, '+' + U.num(s.late * 1000, 0) + ' ms') : U.h('span', { class: 'tag ok' }, 'a tiempo');
      const tr = U.h('tr', { class: 'click', 'data-i': i },
        U.h('td', { class: 'n' }, String(i + 1)), U.h('td', { class: 'n' }, U.num(s.t0, 1)),
        U.h('td', null, U.h('span', { class: 'dot', style: { background: pl ? pl.color : '#888' } }), pl ? pl.nombre : s.j),
        U.h('td', null, def ? def.nombre : 'Fantasma · ' + ((C.ghost[s.zona] || {}).nombre || ''), s.error ? U.h('span', { class: 'tag bad', style: { marginLeft: '6px' } }, 'error') : '', s.fin ? U.h('div', { class: 'tiny muted' }, s.fin) : ''),
        U.h('td', null, clsTag(s)), U.h('td', { class: 'n' }, s.contact ? U.num(s.contact.z, 2) + ' m' : '–'),
        U.h('td', null, s.golpe === 'saque' || s.cls === 'alimentacion' || s.golpe === 'fantasma' ? '–' : late));
      tr.addEventListener('click', () => { S.t = Math.max(0, s.t0 - 0.6); S.playing = false; syncPlay(); draw(); });
      body.append(tr);
    });
    tb.append(body);
    const w = U.$('#simWarn'); w.innerHTML = '';
    if (S.tl.warnings.length) {
      const ul = U.h('ul', { class: 'keys' }, S.tl.warnings.slice(0, 8).map((x) => U.h('li', null, x)));
      w.append(U.h('div', { class: 'warnbox' }, U.h('b', null, 'Avisos del motor'), ul, S.tl.warnings.length > 8 ? U.h('p', { class: 'tiny' }, `y ${S.tl.warnings.length - 8} más.`) : ''));
    }
  }
  function renderTicks() {
    const box = U.$('#ticks'); box.innerHTML = '';
    for (const s of S.tl.shots) {
      const pl = S.tl.players.find((p) => p.id === s.j);
      box.append(U.h('i', { style: { left: (100 * s.t0 / S.tl.duration) + '%', background: pl ? pl.color : '#666' } }));
    }
  }
  function renderStats() {
    const box = U.$('#statsBox'); box.innerHTML = '';
    const pl = S.tl.players.find((p) => p.id === S.focus) || S.tl.players[0];
    if (!pl) return;
    const st = pl.stats;
    const tiles = [
      ['Distancia recorrida', U.num(st.dist, 1) + ' m'],
      ['Pasos', String(st.steps)],
      ['Golpes', String(st.golpes)],
      ['Velocidad máxima', U.num(st.vmax, 1) + ' m/s'],
      ['Distancia media a la T', st.dT != null ? U.num(st.dT, 2) + ' m' : '–'],
      ['Tiempo en movimiento', U.pct(st.work / Math.max(1, st.T))],
      ['Rodilla delantera (mín.)', st.kneeMin != null ? Math.round(st.kneeMin) + '°' : '–'],
      ['Llegadas tarde', String(st.late)],
    ];
    const grid = U.h('div', { class: 'statgrid' }, tiles.map(([a, b]) => U.h('div', { class: 'stat' }, U.h('b', null, b), U.h('span', null, a))));
    box.append(U.h('p', { class: 'small', style: { marginBottom: '8px' } }, U.h('span', { class: 'dot', style: { background: pl.color } }), U.h('b', null, pl.nombre), ' · ', Player.LEVELS[pl.nivel] ? Player.LEVELS[pl.nivel].nombre : '', pl.mano === 'Z' ? ' · zurdo' : ' · diestro', pl.tecnica !== 'ok' ? ' · técnica: ' + (pl.tecnica === 'cambiada' ? 'pierna cambiada' : 'encimado') : ''));
    box.append(grid);
    /* balance de estocadas */
    const tot = st.lungI + st.lungD;
    if (tot) {
      const pI = st.lungI / tot;
      const bal = U.h('div', { style: { marginTop: '12px' } },
        U.h('div', { class: 'small', style: { display: 'flex', justifyContent: 'space-between' } }, U.h('span', null, 'Estocadas con pierna izquierda: ', U.h('b', { class: 'mono' }, String(st.lungI))), U.h('span', null, 'derecha: ', U.h('b', { class: 'mono' }, String(st.lungD)))),
        U.h('div', { class: 'bal' }, U.h('i', { style: { width: pI * 100 + '%', background: '#1f6fb2' } }), U.h('i', { style: { width: (1 - pI) * 100 + '%', background: '#d4442e' } })));
      box.append(bal);
      if (Math.abs(pI - 0.5) > 0.3 && tot >= 4) box.append(U.h('p', { class: 'tiny muted', style: { marginTop: '4px' } }, 'Carga asimétrica: el manual advierte que usar casi siempre la misma pierna delantera (por ejemplo, con la pierna cambiada en el drive) lleva al sobreuso y a la lesión por desgaste. En las rutinas de un solo lado, alterna el lado en la siguiente serie.'));
    }
    if (st.kneeOver) box.append(U.h('p', { class: 'warnbox', style: { marginTop: '10px' } }, `En ${st.kneeOver} estocada(s) la rodilla pasa la punta del pie: más carga patelofemoral y más distancia para volver a la T.`));
    /* carga muscular acumulada */
    if (pl.load) {
      const arr = Object.entries(pl.load).map(([id, v]) => ({ id, tot: v.tot, ecc: v.ecc })).filter((x) => x.id !== 'oculares').sort((a, b) => b.tot - a.tot).slice(0, 8);
      const mx = arr[0] ? arr[0].tot : 1;
      box.append(U.h('h4', { style: { margin: '14px 0 6px' } }, 'Carga muscular acumulada en la rutina'));
      const list = U.h('div', { class: 'actlist' });
      for (const x of arr) {
        const g = Muscles.byId[x.id];
        const pe = x.tot ? x.ecc / x.tot : 0;
        list.append(U.h('div', { class: 'actrow' }, U.h('span', null, g.nombre),
          U.h('span', { class: 'bar', title: 'Parte excéntrica en tono oscuro' }, U.h('i', { style: { width: (100 * x.tot / mx) + '%', background: `linear-gradient(90deg, #b8432f ${pe * 100}%, #f0a35a ${pe * 100}%)` } })),
          U.h('span', { class: 'ty mono' }, U.num(x.tot, 1))));
      }
      box.append(list);
      box.append(U.h('p', { class: 'tiny muted', style: { marginTop: '6px' } }, 'Unidades: activación × segundos. El tramo oscuro de cada barra es trabajo excéntrico (frenado), el que más daño muscular y agujetas produce.'));
    }
  }
  function renderMatch() {
    const box = U.$('#matchCard');
    if (!S.tl.rallies) { box.hidden = true; return; }
    box.hidden = false; box.innerHTML = '';
    const [A, B] = S.tl.players;
    box.append(U.h('h3', null, 'Marcador del partido simulado'));
    box.append(U.h('div', { class: 'score' }, U.h('span', { style: { color: A.color } }, A.nombre + ' ' + S.tl.score[A.id]), U.h('span', { class: 'muted' }, '–'), U.h('span', { style: { color: B.color } }, S.tl.score[B.id] + ' ' + B.nombre)));
    const tb = U.h('table', { class: 'tbl', style: { marginTop: '8px' } }, U.h('thead', null, U.h('tr', null, ['Punto', 'Saca', 'Golpes', 'Gana', 'Cómo', 'Marcador'].map((x) => U.h('th', null, x)))));
    const bd = U.h('tbody');
    for (const r of S.tl.rallies) {
      const w = S.tl.players.find((p) => p.id === r.winner);
      const tr = U.h('tr', { class: 'click' }, U.h('td', { class: 'n' }, String(r.n)), U.h('td', null, r.server), U.h('td', { class: 'n' }, String(r.shots)), U.h('td', null, U.h('span', { class: 'dot', style: { background: w.color } }), w.nombre), U.h('td', { class: 'small' }, r.reason), U.h('td', { class: 'n' }, r.score));
      tr.addEventListener('click', () => { S.t = r.t0; S.playing = true; syncPlay(); });
      bd.append(tr);
    }
    tb.append(bd);
    box.append(U.h('div', { class: 'tbl-wrap' }, tb));
    const [sa, sb] = [A.stats, B.stats];
    box.append(U.h('p', { class: 'small', style: { marginTop: '8px' } }, `Distancia: ${A.nombre} ${U.num(sa.dist, 0)} m · ${B.nombre} ${U.num(sb.dist, 0)} m. Distancia media a la T cuando golpea el rival: ${U.num(sa.dT, 2)} m frente a ${U.num(sb.dT, 2)} m. En el circuito profesional, quien mantiene menor distancia a la T suele ganar más puntos.`));
  }

  /* ---------- panel en vivo ---------- */
  function renderLive(force) {
    const now = performance.now();
    if (!force && now - S.lastBody < 110) return;
    S.lastBody = now;
    const pl = S.tl && S.tl.players.find((p) => p.id === S.focus);
    if (!pl) return;
    const A = Muscles.activation(pl, S.t);
    body.activation(A.act);
    U.$('#phName').textContent = Muscles.PHASE_NAMES[A.phase] || A.phase;
    U.$('#phDesc').textContent = PH_DESC[A.phase] || '';
    let side = '';
    if (A.phase === 'golpe' && A.meta) side = A.meta.fh === false ? 'Revés' : 'Drive';
    else if (A.phase === 'estocada' && A.meta) side = 'Pierna ' + (A.meta.pie === 'I' ? 'izquierda' : 'derecha') + ' adelante';
    if (pl.tecnica !== 'ok' && (A.phase === 'golpe' || A.phase === 'estocada')) side += (side ? ' · ' : '') + (pl.tecnica === 'cambiada' ? 'pierna cambiada' : 'encimado');
    const tag = U.$('#phSide'); tag.textContent = side; tag.hidden = !side; tag.className = 'tag' + (pl.tecnica !== 'ok' && side ? ' warn' : '');
    const k0 = Player.keyAt(pl, S.t - 0.05), k1 = Player.keyAt(pl, S.t + 0.05);
    U.$('#kvV').textContent = U.num(Math.hypot(k1.x - k0.x, k1.y - k0.y) / 0.1, 1) + ' m/s';
    U.$('#kvT').textContent = U.num(U.dist(k1, C.T), 1) + ' m';
    let d = 0; for (let i = 1; i < pl.keys.length && pl.keys[i].t <= S.t; i++) d += Math.hypot(pl.keys[i].x - pl.keys[i - 1].x, pl.keys[i].y - pl.keys[i - 1].y);
    U.$('#kvD').textContent = U.num(d, 0) + ' m';
    const rows = Object.entries(A.act).filter(([id, v]) => v.v > 0.12 && id !== 'oculares').sort((a, b) => b[1].v - a[1].v).slice(0, 7);
    const list = U.$('#actList'); list.innerHTML = '';
    for (const [id, v] of rows) {
      const g = Muscles.byId[id];
      list.append(U.h('div', { class: 'actrow' }, U.h('span', null, g.nombre), U.h('span', { class: 'bar' }, U.h('i', { style: { width: v.v * 100 + '%', background: TV.heatCol(v.v, '#d6c2b6') } })), U.h('span', { class: 'ty' }, ({ c: 'conc.', e: 'exc.', i: 'isom.', ce: 'CEA' })[v.tipo] || '')));
    }
    /* fila actual en la tabla */
    const i = TL.shotIndexAt(S.tl, S.t);
    for (const tr of U.$$('#shotTbl tbody tr')) tr.classList.toggle('cur', +tr.dataset.i === i);
    /* HUD */
    const L = TL.label(S.tl, S.t);
    const hud = U.$('#hudTV'); hud.innerHTML = '';
    if (L) {
      hud.append(U.h('span', { class: 'pill' }, `Golpe ${L.n}/${S.tl.shots.length}`));
      hud.append(U.h('span', { class: 'pill', style: { background: L.pl ? L.pl.color : '' } }, (L.pl ? L.pl.nombre + ' · ' : '') + L.nombre));
      if (L.cls && L.s.cls !== 'alimentacion' && L.s.cls !== 'saque' && L.s.cls !== 'fantasma') hud.append(U.h('span', { class: 'pill' }, (L.cls.cod !== '—' ? L.cls.cod + ' · ' : '') + L.cls.nombre));
      if (L.s.res && L.s.res.v) hud.append(U.h('span', { class: 'pill' }, U.h('b', null, U.num(L.s.res.v * 3.6, 0)), ' km/h'));
    }
    if (S.tl.rallies) { const [A1, B1] = S.tl.players; let sa = 0, sb = 0; for (const r of S.tl.rallies) if (r.t1 <= S.t) { if (r.winner === A1.id) sa++; else sb++; } hud.append(U.h('span', { class: 'pill' }, `${A1.id} ${sa} – ${sb} ${B1.id}`)); }
  }

  /* ---------- dibujo ---------- */
  function sizeOf(cv) { const r = cv.getBoundingClientRect(); return { w: Math.max(50, r.width), h: Math.max(50, r.height) }; }
  function draw() {
    if (!S.tl) return;
    if (S.view !== 'top') { const { w, h } = sizeOf(cvTV); const ctx = U.fitCanvas(cvTV, w, h); TV.draw(ctx, w, h, S.tl, S.t, S.cam, S.opts); }
    if (S.view !== 'tv') { const { w, h } = sizeOf(cvTop); const ctx = U.fitCanvas(cvTop, w, h); Top.draw(ctx, w, h, S.tl, S.t, Object.assign({ foco: S.focus }, S.opts), S.cache); }
    U.$('#scrub').value = Math.round(1000 * S.t / S.tl.duration);
    U.$('#timeLbl').textContent = U.num(S.t, 1) + ' / ' + U.num(S.tl.duration, 1) + ' s';
    renderLive();
  }
  function frame(ts) {
    raf = 0;
    if (!visible) return;
    const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (S.playing && S.tl) {
      S.t += dt * S.speed;
      if (S.t > S.tl.duration) { if (!S.holdEnd) S.holdEnd = ts; S.t = S.tl.duration; if (ts - S.holdEnd > 900) { S.t = 0; S.holdEnd = 0; } }
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) { lastTs = 0; raf = requestAnimationFrame(frame); } }
  function syncPlay() {
    const b = U.$('#btnPlay');
    b.innerHTML = S.playing ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    b.setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
  }
  function camButtons() {
    const box = U.$('#camBtns'); box.innerHTML = '';
    for (const k in TV.PRESETS) {
      const b = U.h('button', { 'aria-pressed': String(S.camName === k), text: TV.PRESETS[k].nombre });
      b.addEventListener('click', () => { S.cam = Object.assign({}, TV.PRESETS[k]); S.camName = k; camButtons(); draw(); });
      box.append(b);
    }
  }

  function init() {
    cvTV = U.$('#cvTV'); cvTop = U.$('#cvTop');
    body = MS.Body.create(U.$('#simBody'), { interactive: true, onSelect: (id) => { MS.App.go('anatomia'); MS.Anat && MS.Anat.select(id); } });
    fillSelect('lib:boastDrive');
    U.$('#rtSel').addEventListener('change', (e) => { load(routineFromKey(e.target.value)); S.playing = true; syncPlay(); });
    U.$('#btnPlay').addEventListener('click', () => { S.playing = !S.playing; if (S.t >= S.tl.duration) S.t = 0; syncPlay(); });
    U.$('#btnPrev').addEventListener('click', () => { const i = TL.shotIndexAt(S.tl, S.t - 0.7); const s = S.tl.shots[Math.max(0, i)]; S.t = s ? Math.max(0, s.t0 - 0.6) : 0; draw(); });
    U.$('#btnNext').addEventListener('click', () => { const i = TL.shotIndexAt(S.tl, S.t + 0.61); const s = S.tl.shots[i + 1]; if (s) S.t = Math.max(0, s.t0 - 0.6); draw(); });
    U.$('#scrub').addEventListener('input', (e) => { S.t = (+e.target.value / 1000) * S.tl.duration; draw(); });
    for (const b of U.$$('#speedSeg button')) b.addEventListener('click', () => { S.speed = +b.dataset.sp; for (const c of U.$$('#speedSeg button')) c.setAttribute('aria-pressed', String(c === b)); });
    for (const b of U.$$('#togChips [data-tog]')) b.addEventListener('click', () => { const k = b.dataset.tog; S.opts[k] = !S.opts[k]; b.setAttribute('aria-pressed', String(S.opts[k])); draw(); });
    for (const b of U.$$('#viewSeg button')) b.addEventListener('click', () => {
      S.view = b.dataset.v; for (const c of U.$$('#viewSeg button')) c.setAttribute('aria-pressed', String(c === b));
      const v = U.$('#views'); v.classList.toggle('only-tv', S.view === 'tv'); v.classList.toggle('only-top', S.view === 'top'); draw();
    });
    camButtons();
    /* cámara orbital */
    let drag = null;
    cvTV.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, az: S.cam.az, el: S.cam.el }; cvTV.setPointerCapture(e.pointerId); cvTV.style.cursor = 'grabbing'; });
    cvTV.addEventListener('pointermove', (e) => { if (!drag) return; S.cam.az = drag.az - (e.clientX - drag.x) * 0.008; S.cam.el = U.clamp(drag.el + (e.clientY - drag.y) * 0.006, 0.04, 1.42); S.camName = 'libre'; if (!S.playing) draw(); });
    const up = () => { if (drag) { drag = null; cvTV.style.cursor = ''; camButtons(); } };
    cvTV.addEventListener('pointerup', up); cvTV.addEventListener('pointercancel', up);
    cvTV.addEventListener('wheel', (e) => { e.preventDefault(); S.cam.dist = U.clamp(S.cam.dist * (e.deltaY > 0 ? 1.07 : 0.93), 4.5, 18); if (!S.playing) draw(); }, { passive: false });
    /* ajustes */
    const re = () => load(S.base, true);
    for (const id of ['#setNivel', '#setTec', '#setRitmo', '#setCiclos']) U.$(id).addEventListener('change', re);
    U.$('#setTemp').addEventListener('input', (e) => { U.$('#tempLbl').textContent = e.target.value + ' °C'; });
    U.$('#setTemp').addEventListener('change', re);
    U.$('#setAlt').addEventListener('input', (e) => { U.$('#altLbl').textContent = Number(e.target.value).toLocaleString('es-CO') + ' m'; });
    U.$('#setAlt').addEventListener('change', re);
    U.$('#btnEditThis').addEventListener('click', () => { MS.Editor.edit(U.clone(S.base)); MS.App.go('editor'); });
    /* exportar */
    const menu = U.$('#expMenu');
    U.$('#btnExport').addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); U.$('#btnExport').setAttribute('aria-expanded', String(menu.classList.contains('open'))); });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) menu.classList.remove('open'); });
    for (const b of U.$$('#expMenu [data-exp]')) b.addEventListener('click', () => { menu.classList.remove('open'); MS.Export.run(b.dataset.exp, S.base, S.tl, overrides()); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => draw()).observe(U.$('#views'));
    load(Routines.byId.boastDrive);
    syncPlay();
  }
  function show() { visible = true; start(); setTimeout(draw, 30); }
  function hide() { visible = false; }

  /* Carga una rutina externa (desde el editor o lesiones) */
  function open(rt, opt = {}) {
    if (opt.temp) S.temp = rt;
    fillSelect(opt.key || (opt.temp ? 'temp' : undefined));
    if (opt.tec != null) U.$('#setTec').value = opt.tec;
    if (opt.view) { const b = U.$(`#viewSeg [data-v="${opt.view}"]`); if (b) b.click(); }
    if (opt.cam && TV.PRESETS[opt.cam]) { S.cam = Object.assign({}, TV.PRESETS[opt.cam]); S.camName = opt.cam; camButtons(); }
    load(rt);
    S.playing = true; syncPlay();
    if (opt.musculos) { S.opts.musculos = true; const b = U.$('#togChips [data-tog="musculos"]'); if (b) b.setAttribute('aria-pressed', 'true'); }
  }
  function refreshList() { const v = U.$('#rtSel').value; fillSelect(v); }

  MS.App.on('simulador', { init, show, hide, theme: () => { body && renderLive(true); } });
  return { S, open, load, refreshList, overrides, draw };
})();
