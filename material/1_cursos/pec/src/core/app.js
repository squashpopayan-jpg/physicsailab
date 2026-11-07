/* Tejiendo el PEC — núcleo de la interfaz: navegación, progreso, pausas de repaso, quizzes y examen. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const PEC = (window.PEC = window.PEC || {});

  /* ---------- Almacenamiento (puede fallar: ventana privada, datos bloqueados) ---------- */
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pec:' + k); if (v !== null) return JSON.parse(v); } catch (e) { /* sin acceso */ } return k in mem ? mem[k] : d; },
    set(k, v) { mem[k] = v; try { localStorage.setItem('pec:' + k, JSON.stringify(v)); } catch (e) { /* sin acceso */ } },
  };
  PEC.store = store;

  const ICON = {
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M6.5 12.5l3.6 3.6 7.4-7.6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bad: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>',
    q: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1-1.5 2.1" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.5" fill="#fff"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  PEC.ICON = ICON;

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const strip = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const LET = ['A', 'B', 'C', 'D', 'E'];

  /* ---------- Capítulos ---------- */
  const chapters = [];
  const byId = {};
  function loadChapters() {
    $$('template.chapter-src').forEach((t) => {
      const c = { id: t.dataset.id, num: t.dataset.num || '', title: t.dataset.title, part: t.dataset.part || '', kind: t.dataset.kind || 'lesson', tpl: t, wide: t.dataset.wide === '1' };
      c.text = strip(t.content.textContent.replace(/\s+/g, ' '));
      chapters.push(c); byId[c.id] = c;
    });
  }
  PEC.chapterTitle = (id) => (byId[id] ? byId[id].title : id);

  /* ---------- Progreso ---------- */
  const readSet = () => new Set(store.get('read', []));
  const markRead = (id) => { const s = readSet(); s.add(id); store.set('read', Array.from(s)); renderToc(); };
  const best = (id) => store.get('best:' + id, null);
  const lessons = () => chapters.filter((c) => c.kind === 'lesson' && c.num !== '0');
  const tests = () => chapters.filter((c) => c.kind === 'quiz' || c.kind === 'exam');

  /* ---------- Índice lateral ---------- */
  function renderToc() {
    const toc = $('#toc'); const rd = readSet(); let last = null; let html = '';
    chapters.forEach((c) => {
      if (c.part && c.part !== last) { html += `<div class="toc-part">${c.part}</div>`; last = c.part; }
      if (!c.part && last !== '') { last = ''; }
      const b = best(c.id);
      const done = c.kind === 'lesson' ? rd.has(c.id) : b !== null;
      const tag = (c.kind === 'quiz' || c.kind === 'exam') && b !== null ? `<span class="tag">${b} %</span>` : '';
      const num = done ? '✓' : (c.kind === 'quiz' ? '?' : c.kind === 'exam' ? '★' : (c.num || '·'));
      html += `<a href="#${c.id}" data-id="${c.id}" class="${done ? 'done' : ''}"><span class="num" aria-hidden="true">${num}</span><span>${c.title}</span>${tag}</a>`;
    });
    toc.innerHTML = html;
    markCurrent();
  }
  function markCurrent() {
    $$('#toc a').forEach((a) => { if (a.dataset.id === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const cur = $('#toc a[aria-current]'); if (cur) { const sb = $('#sidebar'); const r = cur.getBoundingClientRect(), s = sb.getBoundingClientRect(); if (r.top < s.top + 10 || r.bottom > s.bottom - 10) sb.scrollTop += (r.top + r.height / 2) - (s.top + s.height / 2); }
  }

  /* ---------- Enrutador ---------- */
  let current = null;
  function go() {
    let id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!byId[id]) id = chapters[0].id;
    show(id);
  }
  function show(id) {
    const c = byId[id]; current = id;
    const host = $('#chapters');
    host.innerHTML = '';
    const art = document.createElement('article');
    art.className = 'chapter' + (c.wide ? ' wide' : '');
    art.id = 'cap-' + id;
    art.appendChild(c.tpl.content.cloneNode(true));
    host.appendChild(art);
    mount(art, c);
    document.title = c.title + ' · Tejiendo el PEC';
    $('#crumb').innerHTML = `${c.part ? c.part : 'Tejiendo el PEC'}<b>${c.title}</b>`;
    $('#app').classList.remove('open');
    markCurrent();
    window.scrollTo(0, 0);
    $('#main').focus({ preventScroll: true });
    updateProgress();
  }
  function neighbors(id) { const i = chapters.findIndex((c) => c.id === id); return [chapters[i - 1], chapters[i + 1]]; }

  function mount(art, c) {
    $$('.check[data-check]', art).forEach(mountCheck);
    $$('.qz[data-quiz]', art).forEach((el) => mountQuiz(el, el.dataset.quiz, 'quiz'));
    $$('.qz[data-exam]', art).forEach((el) => mountQuiz(el, 'examen', 'exam'));
    $$('.gen[data-gen]', art).forEach((el) => { const g = PEC.figs && PEC.figs[el.dataset.gen]; if (g) el.innerHTML = g(); });
    $$('.progbox', art).forEach(fillProgress);
    const f = $('.gl-filter input', art); if (f) f.addEventListener('input', () => { const q = strip(f.value.trim()); $$('.gl .it', art).forEach((it) => { it.hidden = q && !strip(it.textContent).includes(q); }); });
    const [prev, next] = neighbors(c.id);
    let tail = '';
    if (c.kind === 'lesson' && c.num !== '0') {
      const done = readSet().has(c.id);
      tail += `<div class="readbar"><p>${done ? '✓ Ya marcaste esta lección como leída.' : '¿Terminaste de leer esta lección?'}</p><button class="btn good" type="button" id="readBtn">${done ? 'Seguir' : 'Sí, la terminé'} ${ICON.arrowR}</button></div>`;
    }
    tail += '<nav class="pager" aria-label="Navegación entre lecciones">' +
      (prev ? `<a class="prev" href="#${prev.id}" rel="prev"><small>← Anterior</small><b>${prev.title}</b></a>` : '') +
      (next ? `<a class="next" href="#${next.id}" rel="next"><small>Siguiente →</small><b>${next.title}</b></a>` : '') + '</nav>';
    art.insertAdjacentHTML('beforeend', tail);
    const rb = $('#readBtn', art);
    if (rb) rb.addEventListener('click', () => { markRead(c.id); if (next) location.hash = '#' + next.id; });
    if (c.kind === 'lesson' && c.num === '0') { /* portada: sin marca */ }
  }
  function fillProgress(el) {
    const ls = lessons(), rd = readSet(); const n = ls.filter((c) => rd.has(c.id)).length;
    const ts = tests(); const m = ts.filter((c) => best(c.id) !== null).length;
    const pct = Math.round(((n + m) / (ls.length + ts.length)) * 100);
    el.innerHTML = `<b>Tu avance: ${pct} %</b><div class="tr" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div><span>${n} de ${ls.length} lecciones leídas · ${m} de ${ts.length} pruebas hechas</span>`;
  }

  /* ---------- Una pregunta (UI compartida) ---------- */
  const prep = (q) => ({ q: q.q, e: q.e, r: q.r, p: q.p, opts: shuffle([{ t: q.ok, c: true }].concat(q.no.map((t) => ({ t, c: false })))) });
  function optsHtml(qq, sel, reveal) {
    return qq.opts.map((o, i) => {
      let cls = 'opt', mark = '';
      if (reveal) { if (o.c) { cls += ' ok'; mark = ' <span class="mark">✓ Correcta</span>'; } else if (sel === i) { cls += ' bad'; mark = ' <span class="mark">✗ Tu respuesta</span>'; } }
      return `<button type="button" class="${cls}" data-i="${i}" aria-pressed="${sel === i}" ${reveal ? 'disabled' : ''}><span class="ltr" aria-hidden="true">${LET[i]}</span><span>${o.t}${mark}</span></button>`;
    }).join('');
  }
  function fbHtml(qq, sel) {
    const good = qq.opts[sel] && qq.opts[sel].c;
    const ref = qq.r && byId[qq.r] ? `<p class="ref">Repasa: <a href="#${qq.r}">${byId[qq.r].title}</a></p>` : '';
    return `<div class="fb ${good ? 'ok' : 'bad'}" role="status"><div class="fbt">${good ? '<span style="color:var(--ok)">' + ICON.ok + '</span> ¡Correcto!' : '<span style="color:var(--bad)">' + ICON.bad + '</span> Todavía no'}</div><p>${qq.e}</p>${good ? '' : ref}</div>`;
  }

  /* ---------- Pausa de repaso (una pregunta dentro de la lección) ---------- */
  function mountCheck(el) {
    const bank = (PEC.Q && PEC.Q.checks) || {}; const q = bank[el.dataset.check];
    if (!q) { el.innerHTML = '<p>(pregunta no encontrada)</p>'; return; }
    let qq = prep(q), sel = null;
    const draw = () => {
      el.innerHTML = `<div class="ck-h" style="color:var(--accent)">${ICON.q} Pausa de repaso</div><p class="qtext">${qq.q}</p><div class="opts">${optsHtml(qq, sel, sel !== null)}</div>${sel !== null ? fbHtml(qq, sel) + `<p style="margin:14px 0 0"><button class="btn sec" type="button" data-redo>${ICON.redo} Probar otra vez</button></p>` : ''}`;
      $$('.opt', el).forEach((b) => b.addEventListener('click', () => { sel = +b.dataset.i; draw(); const f = $('.fb', el); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }));
      const r = $('[data-redo]', el); if (r) r.addEventListener('click', () => { qq = prep(q); sel = null; draw(); });
    };
    draw();
  }

  /* ---------- Quiz por parte y examen final ---------- */
  function mountQuiz(el, key, mode) {
    const bank = (PEC.Q && (mode === 'exam' ? PEC.Q.exam : PEC.Q.quiz[key])) || [];
    if (!bank.length) { el.innerHTML = '<p>(banco de preguntas vacío)</p>'; return; }
    const title = el.dataset.title || 'Quiz';
    let run, i, ans, done;
    function start(list) {
      run = (mode === 'exam' ? shuffle(list) : list).map(prep); i = 0; ans = run.map(() => null); done = false; draw();
    }
    function pctNow() { return Math.round((run.filter((q, k) => ans[k] !== null && q.opts[ans[k]].c).length / run.length) * 100); }
    function dots() {
      return `<div class="qz-dots" role="group" aria-label="Ir a la pregunta">${run.map((q, k) => {
        let c = ''; if (k === i) c = 'cur'; else if (ans[k] !== null) c = mode === 'quiz' ? (q.opts[ans[k]].c ? 'ok' : 'bad') : 'set';
        return `<button type="button" class="${c}" data-k="${k}" aria-label="Pregunta ${k + 1}">${k + 1}</button>`;
      }).join('')}</div>`;
    }
    function draw() {
      if (done) return results();
      const qq = run[i], sel = ans[i], reveal = mode === 'quiz' && sel !== null;
      const answered = ans.filter((a) => a !== null).length;
      const last = i === run.length - 1;
      let nav = '';
      if (mode === 'quiz') {
        nav = `<div class="qz-nav"><span></span>${reveal ? `<button class="btn" type="button" data-next>${last ? 'Ver mi resultado' : 'Siguiente pregunta'} ${ICON.arrowR}</button>` : '<span class="qz-hint">Toca una respuesta (o presiona A, B, C o D).</span>'}</div>`;
      } else {
        nav = `<div class="qz-nav"><button class="btn sec" type="button" data-prev ${i === 0 ? 'disabled' : ''}>${ICON.arrowL} Anterior</button>` +
          (last ? `<button class="btn good" type="button" data-finish>Terminar el examen (${answered}/${run.length})</button>` : `<button class="btn" type="button" data-next>Siguiente ${ICON.arrowR}</button>`) + '</div>' +
          (last && answered < run.length ? `<p class="qz-hint">Te faltan ${run.length - answered} preguntas por responder. Toca los números de arriba para volver a ellas.</p>` : '<p class="qz-hint">En el examen verás las respuestas correctas al final. Puedes cambiar tu respuesta cuando quieras.</p>');
      }
      el.innerHTML = `<div class="qz-top"><span class="qz-count">${title} · Pregunta ${i + 1} de ${run.length}</span><div class="qz-bar" aria-hidden="true"><i style="width:${(answered / run.length) * 100}%"></i></div></div>${dots()}<p class="qtext" id="qq">${qq.q}</p><div class="opts" role="group" aria-labelledby="qq">${optsHtml(qq, sel, reveal)}</div>${reveal ? fbHtml(qq, sel) : ''}${nav}`;
      $$('.opt', el).forEach((b) => b.addEventListener('click', () => pick(+b.dataset.i)));
      $$('.qz-dots button', el).forEach((b) => b.addEventListener('click', () => { i = +b.dataset.k; draw(); }));
      const nx = $('[data-next]', el); if (nx) nx.addEventListener('click', next);
      const pv = $('[data-prev]', el); if (pv) pv.addEventListener('click', () => { if (i > 0) { i--; draw(); } });
      const fn = $('[data-finish]', el); if (fn) fn.addEventListener('click', finish);
      if (reveal) { const f = $('.fb', el); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }
    function pick(k) {
      if (mode === 'quiz' && ans[i] !== null) return;
      ans[i] = k; draw();
    }
    function next() {
      if (i < run.length - 1) { i++; draw(); const t = $('.qz-count', el); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      else finish();
    }
    function finish() { done = true; const p = pctNow(); const prev = best(key === 'examen' ? 'examen' : el.dataset.quiz); if (prev === null || p > prev) store.set('best:' + (mode === 'exam' ? 'examen' : el.dataset.quiz), p); renderToc(); draw(); window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90), behavior: 'smooth' }); }
    function results() {
      const ok = run.filter((q, k) => ans[k] !== null && q.opts[ans[k]].c).length, n = run.length, p = Math.round((ok / n) * 100);
      const col = p >= 80 ? 'var(--ok)' : p >= 60 ? 'var(--gold)' : 'var(--earth)';
      const circ = 2 * Math.PI * 80;
      const msg = p >= 90 ? '¡Excelente! Dominas muy bien esta parte. Puedes avanzar con tranquilidad.' : p >= 75 ? 'Muy bien. Entendiste lo principal. Mira abajo las preguntas que fallaste para afinar los detalles.' : p >= 50 ? 'Vas por buen camino. Repasa las lecciones que te indicamos abajo y vuelve a intentarlo.' : 'No te preocupes: así se aprende. Vuelve a leer las lecciones indicadas abajo y repite la prueba cuando quieras.';
      const wrong = run.map((q, k) => ({ q, k })).filter((o) => ans[o.k] === null || !o.q.opts[ans[o.k]].c);
      const refs = Array.from(new Set(wrong.map((o) => o.q.r).filter((r) => r && byId[r])));
      let bd = '';
      if (mode === 'exam') {
        const parts = {};
        run.forEach((q, k) => { const pp = q.p || 'General'; parts[pp] = parts[pp] || { ok: 0, n: 0 }; parts[pp].n++; if (ans[k] !== null && q.opts[ans[k]].c) parts[pp].ok++; });
        bd = '<h3>Resultado por parte</h3><div class="breakdown">' + Object.keys(parts).map((pp) => { const o = parts[pp], pc = Math.round((o.ok / o.n) * 100); return `<div class="row"><span>${pp}</span><span><b>${o.ok}</b> de ${o.n}</span><div class="tr"><i class="${pc < 60 ? 'low' : ''}" style="width:${pc}%"></i></div></div>`; }).join('') + '</div>';
      }
      const rev = (list, label) => list.length ? `<div class="review"><h3>${label}</h3>${list.map((o) => {
        const q = o.q, sel = ans[o.k], good = sel !== null && q.opts[sel].c; const corr = q.opts.find((x) => x.c).t;
        return `<div class="rev-item ${good ? 'ok' : 'bad'}"><p class="qtext"><span class="rev-tag ${good ? 'ok' : 'bad'}">${good ? '✓' : '✗'} ${o.k + 1}</span>${q.q}</p>${good ? '' : `<p><b>Tu respuesta:</b> ${sel === null ? '(sin responder)' : q.opts[sel].t}</p>`}<p><b>Respuesta correcta:</b> ${corr}</p><p>${q.e}</p>${q.r && byId[q.r] ? `<p class="ref">Repasa: <a href="#${q.r}">${byId[q.r].title}</a></p>` : ''}</div>`;
      }).join('')}</div>` : '';
      const all = run.map((q, k) => ({ q, k }));
      el.innerHTML = `<div class="score"><svg class="ring" viewBox="0 0 190 190" role="img" aria-label="${p} por ciento"><circle cx="95" cy="95" r="80" fill="none" stroke="var(--surface-2)" stroke-width="18"/><circle cx="95" cy="95" r="80" fill="none" stroke="${col}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${(circ * p) / 100} ${circ}" transform="rotate(-90 95 95)"/><text x="95" y="108" text-anchor="middle" font-size="44" fill="var(--ink)">${p} %</text></svg><h2>${ok} de ${n} correctas</h2><p class="msg">${msg}</p><p style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center"><button class="btn" type="button" data-again>${ICON.redo} Repetir ${mode === 'exam' ? 'el examen' : 'el quiz'}</button>${wrong.length ? `<button class="btn sec" type="button" data-wrong>Practicar solo las ${wrong.length} que fallé</button>` : ''}</p></div>${bd}${refs.length ? `<h3>Lecciones para repasar</h3><ul>${refs.map((r) => `<li><a href="#${r}">${byId[r].title}</a></li>`).join('')}</ul>` : ''}${rev(wrong, wrong.length ? 'Preguntas que fallaste' : '')}${wrong.length === 0 ? '<p class="msg" style="text-align:center"><b>¡No fallaste ninguna!</b></p>' : ''}<details style="margin-top:20px"><summary style="cursor:pointer;font-weight:700">Ver todas las preguntas con su explicación</summary>${rev(all, 'Todas las preguntas')}</details>`;
      const ag = $('[data-again]', el); if (ag) ag.addEventListener('click', () => { start(bank); window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90) }); });
      const wr = $('[data-wrong]', el); if (wr) wr.addEventListener('click', () => { const idx = wrong.map((o) => bank.findIndex((b) => b.q === o.q.q)).filter((x) => x >= 0); start(idx.map((x) => bank[x])); window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90) }); });
    }
    start(bank);
  }
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === '/') { e.preventDefault(); const s = $('#searchIn'); if (s) s.focus(); return; }
    const qz = $('.qz'); if (!qz) return;
    const k = e.key.toLowerCase(); const idx = ['a', 'b', 'c', 'd', 'e'].indexOf(k); const idx2 = ['1', '2', '3', '4', '5'].indexOf(k);
    const n = idx >= 0 ? idx : idx2;
    if (n >= 0) { const b = $$('.opt', qz)[n]; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    else if (e.key === 'Enter') { const nx = $('[data-next]', qz); if (nx && document.activeElement === document.body) { e.preventDefault(); nx.click(); } }
  });

  /* ---------- Búsqueda ---------- */
  function setupSearch() {
    const inp = $('#searchIn'), res = $('#searchRes');
    inp.addEventListener('input', () => {
      const q = strip(inp.value.trim());
      if (q.length < 2) { res.hidden = true; return; }
      const hits = chapters.map((c) => { const t = strip(c.title).includes(q) ? 3 : 0; const i = c.text.indexOf(q); return { c, s: t + (i >= 0 ? 1 : 0), i }; }).filter((h) => h.s > 0).sort((a, b) => b.s - a.s).slice(0, 8);
      res.innerHTML = hits.length ? hits.map((h) => { const sn = h.i >= 0 ? '…' + h.c.text.slice(Math.max(0, h.i - 30), h.i + 60) + '…' : ''; return `<a href="#${h.c.id}"><b>${h.c.title}</b><small>${sn}</small></a>`; }).join('') : '<a href="#" onclick="return false"><small>No hay resultados para esa palabra.</small></a>';
      res.hidden = false;
    });
    res.addEventListener('click', () => { res.hidden = true; inp.value = ''; });
    document.addEventListener('click', (e) => { if (!res.contains(e.target) && e.target !== inp) res.hidden = true; });
  }

  /* ---------- Tema, tamaño de letra, menú ---------- */
  const SIZES = [18, 20, 22, 25, 28, 32];
  function applySize() {
    let k = store.get('size', 2); if (!(k >= 0 && k < SIZES.length)) k = 2;
    document.documentElement.style.setProperty('--fs', SIZES[k] + 'px');
    const m = $('#sizeMinus'), p = $('#sizePlus'); if (m) m.disabled = k === 0; if (p) p.disabled = k === SIZES.length - 1;
    return k;
  }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    const b = $('#themeBtn span.lbl'); if (b) b.textContent = t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Auto';
  }
  function updateProgress() {
    const h = document.documentElement; const max = h.scrollHeight - h.clientHeight;
    const bar = $('#progress i'); if (bar) bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
  }

  function init() {
    loadChapters();
    renderToc();
    setupSearch();
    applySize(); applyTheme(store.get('theme', null));
    $('#sizeMinus').addEventListener('click', () => { const k = Math.max(0, store.get('size', 2) - 1); store.set('size', k); applySize(); });
    $('#sizePlus').addEventListener('click', () => { const k = Math.min(SIZES.length - 1, store.get('size', 2) + 1); store.set('size', k); applySize(); });
    $('#themeBtn').addEventListener('click', () => { const cur = store.get('theme', null); const nx = cur === null ? 'light' : cur === 'light' ? 'dark' : null; store.set('theme', nx); applyTheme(nx); });
    $('#menuBtn').addEventListener('click', () => $('#app').classList.toggle('open'));
    $('#scrim').addEventListener('click', () => $('#app').classList.remove('open'));
    window.addEventListener('hashchange', go);
    window.addEventListener('scroll', updateProgress, { passive: true });
    go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
