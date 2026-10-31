/* ===================================================================
   90-app.js — mapa de mundos, capítulos, pasaporte, glosario, experimentos
   =================================================================== */
(function () {
  'use strict';
  const FK = window.FK;
  const $ = FK.$, $$ = FK.$$;

  FK.WORLDS = [
    null,
    { id: 1, name: 'Orígenes', char: 'buho', branch: 'Historia y método de la física', blurb: 'Cómo empezó todo: preguntas, medidas y los primeros curiosos.' },
    { id: 2, name: 'Movimiento y fuerzas', char: 'newti', branch: 'Mecánica', blurb: 'Correr, caer, empujar, girar y chocar.' },
    { id: 3, name: 'Agua y aire', char: 'gotin', branch: 'Mecánica de fluidos', blurb: 'Flotar, presionar y volar.' },
    { id: 4, name: 'Calor y energía', char: 'flamo', branch: 'Termodinámica', blurb: 'Temperatura, hielo, vapor y por qué el tiempo va hacia adelante.' },
    { id: 5, name: 'Ondas y sonido', char: 'eco', branch: 'Ondas y acústica', blurb: 'Vaivenes, olas, ecos y música.' },
    { id: 6, name: 'Luz y color', char: 'lumi', branch: 'Óptica', blurb: 'Sombras, espejos, lentes y arcoíris.' },
    { id: 7, name: 'Electricidad y magnetismo', char: 'chispa', branch: 'Electromagnetismo', blurb: 'Chispas, circuitos, imanes y luz invisible.' },
    { id: 8, name: 'Cielo y espacio', char: 'cosmo', branch: 'Astronomía y cosmología', blurb: 'La Luna, los planetas, las estrellas y el universo.' },
    { id: 9, name: 'Lo muy, muy pequeño', char: 'quarki', branch: 'Física atómica, nuclear, cuántica y de partículas', blurb: 'Átomos, núcleos, cuántica, relatividad y partículas.' },
    { id: 10, name: 'Tierra y vida', char: 'terra', branch: 'Geofísica, biofísica y materiales', blurb: 'Terremotos, cuerpo, chips, azar y caos.' }
  ];
  const worldOf = (n) => FK.WORLDS[n];

  /* ---------- Índice de capítulos (desde las plantillas) ---------- */
  FK.chapters = [];
  FK.chapterInfo = {};
  FK.pages = {};
  $$('template.chapter-src').forEach((t) => {
    const d = t.dataset;
    const c = { id: d.id, num: +d.num || 0, title: d.title, short: d.short || '', world: +d.world || 0, tpl: t, kind: d.kind || 'chapter' };
    if (c.kind === 'chapter') {
      FK.chapters.push(c);
      const sims = Array.from(t.content.querySelectorAll('.sim[data-sim]')).map((s) => s.dataset.sim);
      FK.chapterInfo[c.id] = { sims, nq: t.content.querySelectorAll('.quiz .q').length, ne: t.content.querySelectorAll('.exp').length };
    } else FK.pages[c.id] = c;
  });
  FK.chapters.sort((a, b) => a.num - b.num);
  const byId = (id) => FK.chapters.find((c) => c.id === id);

  /* ---------- Referencias ---------- */
  const main = () => $('#chapters');
  const setTitle = (t) => { document.title = t ? `${t} · Física KIDS` : 'Física KIDS'; };

  const levelBtn = (c) => `<a class="lvl" data-prog="${c.id}" href="#${c.id}" title="${c.title}" style="--c:${FK.CHARS[worldOf(c.world).char].color}"><span class="lvl-n">${c.num}</span><span class="lvl-t">${c.title}</span></a>`;

  /* ---------- Portada / mapa ---------- */
  function renderHome() {
    const last = FK.store.get('last', null);
    const lc = last && byId(last);
    const crew = FK.CHAR_IDS.map((id) => { const c = FK.CHARS[id]; return `<a class="crew-c" href="#mundo-${c.world}" style="--c:${c.color};--cs:${c.soft}"><span class="crew-av">${FK.char(id, 'happy', 84)}</span><b>${c.name}</b><small>${c.role}</small></a>`; }).join('');
    const worlds = FK.WORLDS.filter(Boolean).map((w) => {
      const ch = FK.chapters.filter((c) => c.world === w.id);
      const c = FK.CHARS[w.char];
      return `<section class="world" id="mundo-${w.id}" style="--c:${c.color};--cs:${c.soft};--cd:${c.dark}">
        <div class="world-h"><div class="world-av">${FK.char(w.char, 'happy', 96)}</div><div><small>Mundo ${w.id} · con ${c.name}</small><h3>${w.name}</h3><p>${w.blurb}</p><span class="branch">🔬 ${w.branch}</span></div></div>
        <div class="levels">${ch.map(levelBtn).join('')}</div></section>`;
    }).join('');
    main().innerHTML = `
      <div class="home">
        <header class="hero">
          <div class="hero-t">
            <div class="kicker">Curso interactivo de física para niñas y niños</div>
            <h1 class="logo"><span>Física</span> <span class="kids"><i>K</i><i>I</i><i>D</i><i>S</i></span></h1>
            <p class="hero-p">Toda la física, desde los primeros curiosos hasta los átomos y las galaxias. ¡Con juegos, experimentos para hacer en casa, preguntas y diez amigos que te acompañan!</p>
            <div class="hero-b"><a class="btn big primary" href="#${lc ? lc.id : 'queesfisica'}">${lc ? '▶ Seguir donde quedé' : '🚀 ¡Empezar la aventura!'}</a><a class="btn big ghost" href="#pasaporte">🎫 Mi pasaporte</a></div>
          </div>
          <div class="hero-crew" aria-hidden="true">${['newti', 'cosmo', 'chispa', 'gotin', 'lumi'].map((id, i) => `<span class="float f${i}">${FK.char(id, i % 2 ? 'wink' : 'happy', 110)}</span>`).join('')}</div>
        </header>
        <section class="how"><div class="how-c"><b>🎮 Juega</b><span>Cada capítulo tiene simulaciones con retos. ¡Gana estrellas!</span></div><div class="how-c"><b>🧪 Experimenta</b><span>Hay un experimento fácil para hacer en tu casa.</span></div><div class="how-c"><b>🧠 Piensa</b><span>Preguntas sencillas para ver cuánto aprendiste.</span></div><div class="how-c"><b>🔊 Escucha</b><span>Toca el altavoz de cada parte y te la leemos.</span></div></section>
        <h2 class="sec-t">Conoce a tus amigos</h2>
        <div class="crew">${crew}</div>
        <h2 class="sec-t">El mapa de la física</h2>
        <p class="sec-p">La física tiene muchas ramas, como un árbol. Cada mundo es una rama. ¡Puedes empezar por la que más te guste!</p>
        ${worlds}
        <section class="extra"><a class="extra-c" href="#experimentos"><span>🧪</span><b>Cajón de experimentos</b><small>Todos los experimentos en un solo lugar</small></a><a class="extra-c" href="#glosario"><span>📖</span><b>Diccionario de palabras</b><small>Palabras de ciencia explicadas fácil</small></a><a class="extra-c" href="#familias"><span>👨‍👩‍👧</span><b>Para familias y maestros</b><small>Cómo acompañar el curso</small></a><a class="extra-c" href="#creditos"><span>🏷️</span><b>Créditos y fuentes</b><small>Quién lo hizo y de dónde salen los datos</small></a></section>
      </div>`;
    FK.updateProgress();
    setTitle('');
  }

  /* ---------- Capítulo ---------- */
  function renderChapter(c) {
    const w = worldOf(c.world), ch = FK.CHARS[w.char];
    const art = FK.el('article', 'chapter');
    art.id = 'cap-' + c.id; art.dataset.id = c.id; art.dataset.guide = w.char;
    art.style.setProperty('--w', ch.color); art.style.setProperty('--ws', ch.soft); art.style.setProperty('--wd', ch.dark);
    art.style.setProperty('--wt', ch.color === '#FFC21A' ? '#2B2350' : '#fff');
    const idx = FK.chapters.indexOf(c), prev = FK.chapters[idx - 1], next = FK.chapters[idx + 1];
    art.innerHTML = `
      <header class="chhero">
        <div class="chhero-t"><a class="crumb" href="#mundo-${w.id}">Mundo ${w.id} · ${w.name}</a><div class="chnum">Capítulo ${c.num}</div><h1>${c.title}</h1><p class="chshort">${c.short}</p>
          <div class="prog" data-prog="${c.id}"><span class="prog-bar"><i></i></span><span class="prog-t"></span><span class="prog-s">⭐</span></div></div>
        <div class="chchar"><span class="chbig">${FK.char(w.char, 'happy', 150)}</span></div>
      </header>
      <div class="chbody"></div>
      <footer class="chfoot">
        <div class="prog big" data-prog="${c.id}"><b>Tus estrellas en este capítulo</b><span class="prog-bar"><i></i></span><span class="prog-t"></span></div>
        <div class="navbtns">${prev ? `<a class="btn ghost" href="#${prev.id}">← ${prev.title}</a>` : '<span></span>'}${next ? `<a class="btn primary" href="#${next.id}">${next.title} →</a>` : `<a class="btn primary" href="#pasaporte">🎫 Ver mi pasaporte</a>`}</div>
      </footer>`;
    const body = art.querySelector('.chbody');
    body.appendChild(c.tpl.content.cloneNode(true));
    body.querySelectorAll('.learn').forEach((l) => l.insertAdjacentHTML('afterbegin', '<h3>🎒 Hoy aprenderás</h3>'));
    body.querySelectorAll('.lead').forEach((l) => {
      if (FK.speakOK()) { const b = FK.el('button', 'tts big', '🔊 Escuchar'); b.type = 'button'; b.addEventListener('click', () => { if (FK.speaking) { FK.stopSpeak(); b.classList.remove('on'); return; } b.classList.add('on'); FK.speak(l.textContent, () => b.classList.remove('on')); }); l.after(b); }
    });
    main().replaceChildren(art);
    FK.enhance(art);
    FK.updateProgress();
    FK.store.set('last', c.id);
    setTitle(`${c.num}. ${c.title}`);
  }

  /* ---------- Páginas de texto (familias, créditos) ---------- */
  function renderPage(p) {
    const art = FK.el('article', 'chapter page');
    art.dataset.id = p.id; art.dataset.guide = 'buho';
    art.style.setProperty('--w', '#00B3A4'); art.style.setProperty('--ws', '#D9F6F2'); art.style.setProperty('--wd', '#007A70');
    art.innerHTML = `<header class="chhero"><div class="chhero-t"><a class="crumb" href="#inicio">← Volver al mapa</a><h1>${p.title}</h1><p class="chshort">${p.short}</p></div><div class="chchar"><span class="chbig">${FK.char('buho', 'happy', 150)}</span></div></header><div class="chbody"></div>`;
    art.querySelector('.chbody').appendChild(p.tpl.content.cloneNode(true));
    main().replaceChildren(art);
    FK.enhance(art);
    setTitle(p.title);
  }

  /* ---------- Pasaporte ---------- */
  function renderPassport() {
    const tot = FK.totalStars();
    const pct = tot.total ? Math.round((100 * tot.done) / tot.total) : 0;
    const name = FK.store.get('nombre', '');
    const stamps = FK.WORLDS.filter(Boolean).map((w) => {
      const ch = FK.chapters.filter((c) => c.world === w.id);
      let d = 0, t = 0; ch.forEach((c) => { const s = FK.stats(c.id); d += s.done; t += s.total; });
      const p = t ? d / t : 0, c = FK.CHARS[w.char];
      const lvl = p >= 0.9 ? '🥇 Oro' : p >= 0.6 ? '🥈 Plata' : p >= 0.25 ? '🥉 Bronce' : 'Por descubrir';
      return `<a class="stamp ${p >= 0.25 ? 'got' : ''}" href="#mundo-${w.id}" style="--c:${c.color};--cs:${c.soft}"><span class="stamp-av">${FK.char(w.char, p >= 0.25 ? 'happy' : 'normal', 70)}</span><b>${w.name}</b><small>${d} / ${t} ⭐ · ${lvl}</small><span class="stamp-bar"><i style="width:${Math.round(p * 100)}%"></i></span></a>`;
    }).join('');
    const title = pct >= 90 ? 'Gran Físico / Física' : pct >= 60 ? 'Científico/a experto/a' : pct >= 30 ? 'Explorador/a de la ciencia' : pct >= 5 ? 'Aprendiz de científico/a' : 'Recién llegado/a';
    main().innerHTML = `<div class="home passport">
      <header class="pp-h"><div><div class="kicker">Mi pasaporte de la ciencia</div><h1>🎫 ${name ? name : 'Tu pasaporte'}</h1><p class="hero-p">Has ganado <b>${tot.done}</b> de <b>${tot.total}</b> estrellas (${pct}%). Eres: <b>${title}</b>.</p></div><div class="pp-big">⭐<b>${tot.done}</b></div></header>
      <div class="pp-bar"><i style="width:${pct}%"></i></div>
      <h2 class="sec-t">Mis sellos</h2><div class="stamps">${stamps}</div>
      <h2 class="sec-t">Mi diploma</h2>
      <div class="diploma-box"><label class="nm">¿Cómo te llamas? <input id="ppName" type="text" maxlength="40" placeholder="Escribe tu nombre" value="${String(name).replace(/"/g, '&quot;')}"></label>
        <div class="diploma" id="diploma"><div class="dp-in"><div class="dp-top">${FK.char('buho', 'happy', 70)}${FK.char('newti', 'happy', 70)}${FK.char('cosmo', 'happy', 70)}${FK.char('chispa', 'happy', 70)}${FK.char('quarki', 'happy', 70)}</div><small>Diploma de</small><h2>Física KIDS</h2><p>Se entrega con orgullo a</p><div class="dp-name" id="dpName">${name || '________________'}</div><p>por explorar el universo, hacer preguntas, experimentar y ganar <b>${tot.done}</b> estrellas.</p><p class="dp-t">${title}</p><div class="dp-sign">Mg. Manuel Alejandro Obando<br><small>Departamento de Física · Universidad del Cauca</small></div></div></div>
        <div class="btnrow"><button class="btn primary" id="ppPrint" type="button">🖨️ Imprimir mi diploma</button></div></div>
      <h2 class="sec-t">Opciones</h2>
      <div class="btnrow"><button class="btn ghost" id="ppReset" type="button">🗑️ Borrar mi progreso</button></div><p class="sec-p" id="ppResetMsg"></p></div>`;
    $('#ppName').addEventListener('input', (e) => { FK.store.set('nombre', e.target.value); $('#dpName').textContent = e.target.value || '________________'; });
    $('#ppPrint').addEventListener('click', () => { document.body.classList.add('print-dp'); try { window.print(); } catch (e) { /* sin impresión */ } FK.toast('Si no se abre la impresión, toma una captura de pantalla del diploma 📸'); setTimeout(() => document.body.classList.remove('print-dp'), 800); });
    let armed = false;
    $('#ppReset').addEventListener('click', (e) => {
      if (!armed) { armed = true; e.target.textContent = '⚠️ Toca otra vez para borrar todo'; $('#ppResetMsg').textContent = 'Se borrarán tus estrellas y experimentos. No se puede deshacer.'; setTimeout(() => { armed = false; e.target.textContent = '🗑️ Borrar mi progreso'; $('#ppResetMsg').textContent = ''; }, 5000); return; }
      FK.store.keys().filter((k) => /^(win|q|e):/.test(k)).forEach((k) => FK.store.del(k));
      FK.updateProgress(); renderPassport();
    });
    FK.updateProgress(); setTitle('Mi pasaporte');
  }

  /* ---------- Glosario (autogenerado de las palabras <dfn>) ---------- */
  function renderGlossary() {
    const map = new Map();
    FK.chapters.forEach((c) => c.tpl.content.querySelectorAll('dfn[data-def]').forEach((d) => {
      const k = d.textContent.trim().toLowerCase();
      if (!map.has(k)) map.set(k, { t: d.textContent.trim(), def: d.dataset.def, ch: c });
    }));
    const items = Array.from(map.values()).sort((a, b) => a.t.localeCompare(b.t, 'es'));
    let letter = '', html = '';
    items.forEach((it) => {
      const L = it.t[0].toUpperCase();
      if (L !== letter) { letter = L; html += `<h3 class="gl-l">${L}</h3>`; }
      html += `<div class="gl-i"><b>${it.t}</b><span>${it.def}</span><a href="#${it.ch.id}">cap. ${it.ch.num}</a></div>`;
    });
    main().innerHTML = `<div class="home"><header class="pp-h"><div><div class="kicker">Diccionario</div><h1>📖 Palabras de ciencia</h1><p class="hero-p">${items.length} palabras explicadas fácil. En los capítulos, toca las palabras subrayadas para ver su significado.</p></div></header><input class="gl-s" id="glS" type="search" placeholder="Buscar una palabra…" aria-label="Buscar una palabra"><div id="glList">${html}</div></div>`;
    $('#glS').addEventListener('input', (e) => {
      const v = e.target.value.trim().toLowerCase();
      $$('#glList .gl-i').forEach((x) => { x.style.display = !v || x.textContent.toLowerCase().includes(v) ? '' : 'none'; });
      $$('#glList .gl-l').forEach((x) => { let n = x.nextElementSibling, any = false; while (n && n.classList.contains('gl-i')) { if (n.style.display !== 'none') any = true; n = n.nextElementSibling; } x.style.display = any ? '' : 'none'; });
    });
    setTitle('Diccionario');
  }

  /* ---------- Cajón de experimentos ---------- */
  function renderExperiments() {
    const rows = [];
    FK.chapters.forEach((c) => c.tpl.content.querySelectorAll('.exp').forEach((e, i) => rows.push({ c, i, t: e.dataset.title, time: e.dataset.time || '10 min', lvl: { 1: 'Fácil', 2: 'Medio', 3: 'Reto' }[e.dataset.level] || 'Fácil', adult: e.dataset.adult === '1', mat: Array.from(e.querySelectorAll('ul.mat li')).map((x) => x.textContent) })));
    const html = FK.WORLDS.filter(Boolean).map((w) => {
      const rs = rows.filter((r) => r.c.world === w.id);
      if (!rs.length) return '';
      const ch = FK.CHARS[w.char];
      return `<h3 class="ex-w" style="--c:${ch.color}">${FK.char(w.char, 'happy', 38)} ${w.name}</h3>` + rs.map((r) => {
        const done = FK.store.get(FK.eKey(r.c.id, r.i), false);
        return `<a class="ex-i ${done ? 'done' : ''}" href="#${r.c.id}"><span class="ex-ck">${done ? '✅' : '🧪'}</span><span class="ex-b"><b>${r.t}</b><small>cap. ${r.c.num} · ⏱ ${r.time} · ⭐ ${r.lvl}${r.adult ? ' · 👩‍👧 con adulto' : ''}</small><small class="ex-m">${r.mat.join(' · ')}</small></span></a>`;
      }).join('');
    }).join('');
    const done = rows.filter((r) => FK.store.get(FK.eKey(r.c.id, r.i), false)).length;
    main().innerHTML = `<div class="home"><header class="pp-h"><div><div class="kicker">Cajón de experimentos</div><h1>🧪 ${rows.length} experimentos</h1><p class="hero-p">Todos con cosas que hay en casa. Has hecho <b>${done}</b>. Toca uno para ver los pasos.</p></div></header>${html}</div>`;
    setTitle('Cajón de experimentos');
  }

  /* ---------- Menú lateral ---------- */
  function buildDrawer() {
    const d = $('#drawerList');
    d.innerHTML = `<a class="dr-h" href="#inicio">🗺️ Mapa de mundos</a><a class="dr-h" href="#pasaporte">🎫 Mi pasaporte</a>` + FK.WORLDS.filter(Boolean).map((w) => {
      const c = FK.CHARS[w.char];
      return `<div class="dr-w" style="--c:${c.color}"><div class="dr-wt"><span>${FK.char(w.char, 'happy', 30)}</span>${w.id}. ${w.name}</div>${FK.chapters.filter((x) => x.world === w.id).map((x) => `<a class="dr-c" data-prog="${x.id}" data-id="${x.id}" href="#${x.id}"><span class="dr-n">${x.num}</span>${x.title}</a>`).join('')}</div>`;
    }).join('') + `<a class="dr-h" href="#experimentos">🧪 Cajón de experimentos</a><a class="dr-h" href="#glosario">📖 Diccionario</a><a class="dr-h" href="#familias">👨‍👩‍👧 Familias y maestros</a><a class="dr-h" href="#creditos">🏷️ Créditos</a>`;
  }
  function openDrawer(v) { document.body.classList.toggle('drawer-open', v); $('#menuBtn').setAttribute('aria-expanded', v ? 'true' : 'false'); }

  /* ---------- Rutas ---------- */
  function route() {
    FK.stopSpeak();
    FK.activeSims && FK.activeSims.forEach((g) => { g._dead = true; if (g._stopAudio) g._stopAudio(); });
    FK.activeSims = new Set();
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'inicio';
    openDrawer(false);
    let scroll = true;
    if (h === 'inicio') renderHome();
    else if (h.startsWith('mundo-')) { renderHome(); const el = document.getElementById(h); if (el) { el.scrollIntoView(); scroll = false; } }
    else if (h === 'pasaporte') renderPassport();
    else if (h === 'glosario') renderGlossary();
    else if (h === 'experimentos') renderExperiments();
    else if (FK.pages[h]) renderPage(FK.pages[h]);
    else if (byId(h)) renderChapter(byId(h));
    else { location.hash = '#inicio'; return; }
    $$('.dr-c').forEach((a) => a.classList.toggle('cur', a.dataset.id === h));
    if (scroll) window.scrollTo(0, 0);
    FK.updateProgress();
  }

  /* ---------- Tema ---------- */
  function applyTheme() {
    const t = FK.store.get('theme', 'auto');
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    const b = $('#themeBtn'); if (b) b.querySelector('span').textContent = t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '🌗';
  }
  function applySound() { const b = $('#soundBtn'); if (b) b.textContent = FK.soundOn() ? '🔊' : '🔇'; }

  /* ---------- Arranque ---------- */
  function boot() {
    buildDrawer();
    $('#menuBtn').addEventListener('click', () => openDrawer(!document.body.classList.contains('drawer-open')));
    $('#scrim').addEventListener('click', () => openDrawer(false));
    $('#themeBtn').addEventListener('click', () => { const o = ['auto', 'light', 'dark'], t = FK.store.get('theme', 'auto'); FK.store.set('theme', o[(o.indexOf(t) + 1) % 3]); applyTheme(); });
    $('#soundBtn').addEventListener('click', () => { FK.store.set('sound', !FK.soundOn()); applySound(); if (FK.soundOn()) FK.sfx.ok(); });
    $('#drawerSearch').addEventListener('input', (e) => {
      const v = e.target.value.trim().toLowerCase();
      $$('#drawerList .dr-c').forEach((a) => { const c = byId(a.dataset.id); a.style.display = !v || (c.title + ' ' + c.short).toLowerCase().includes(v) ? '' : 'none'; });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openDrawer(false); });
    applyTheme(); applySound();
    window.addEventListener('hashchange', route);
    route();
    if (FK.speakOK()) window.speechSynthesis.getVoices();
    FK.updateProgress();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
