/* ===================================================================
   90-app.js — Aplicación: índice, navegación, búsqueda, MathJax, montaje de simulaciones
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;
  const el = RT.el;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = {
    chapters: [],
    byId: {},
    built: {},
    sims: {},
    current: null,
    mathReady: false,
    pendingMath: []
  };
  RT.app = state;

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const stripMath = (s) => s.replace(/\\\(([\s\S]*?)\\\)/g, ' ').replace(/\\\[([\s\S]*?)\\\]/g, ' ').replace(/\s+/g, ' ').trim();
  const kids = (node, tag) => Array.from(node.children).filter((e) => e.tagName === tag);
  const pad = (n) => (typeof n === 'number' && n < 10 ? '0' + n : String(n));

  /* ---------- MathJax ---------- */
  RT.mathReady = function () {
    state.mathReady = true;
    const list = state.pendingMath.splice(0);
    list.forEach(typeset);
  };
  function typeset(node) {
    if (!state.mathReady || !window.MathJax || !MathJax.typesetPromise) { state.pendingMath.push(node); return Promise.resolve(); }
    node.classList.add('loading-math');
    return MathJax.typesetPromise([node]).catch((e) => console.warn('MathJax', e)).then(() => node.classList.remove('loading-math'));
  }
  RT.typeset = typeset;

  /* ---------- Lectura de capítulos ---------- */
  function readChapters() {
    $$('template.chapter-src').forEach((t) => {
      const d = t.dataset;
      const ch = {
        id: d.id, num: isNaN(+d.num) ? d.num : +d.num, title: d.title, part: d.part || '', short: d.short || '',
        tpl: t, home: d.id === 'inicio'
      };
      const frag = t.content;
      ch.sections = kids(frag, 'SECTION').map((s, i) => {
        const h = s.querySelector('h2');
        return { idx: i + 1, title: h ? stripMath(h.textContent) : 'Sección ' + (i + 1), id: s.id || d.id + '-s' + (i + 1) };
      });
      ch.simCount = $$('.sim[data-sim]', frag).length;
      state.chapters.push(ch);
      state.byId[ch.id] = ch;
    });
    state.list = state.chapters.filter((c) => !c.home);
  }

  /* ---------- Índice lateral ---------- */
  function buildToc() {
    const nav = $('#toc');
    nav.innerHTML = '';
    const home = el('a', null, '<span class="n">·</span><span>Portada</span>');
    home.href = '#inicio';
    home.dataset.id = 'inicio';
    nav.append(home);
    let part = null;
    for (const ch of state.list) {
      if (ch.part !== part) {
        part = ch.part;
        nav.append(el('div', 'toc-part', part));
      }
      const a = el('a', null, `<span class="n">${pad(ch.num)}</span><span>${ch.title}</span>`);
      a.href = '#' + ch.id;
      a.dataset.id = ch.id;
      nav.append(a);
      const secs = el('div', 'toc-secs');
      secs.hidden = true;
      secs.dataset.for = ch.id;
      ch.sections.forEach((s) => {
        const sa = el('a', null, `<span class="n">${ch.num}.${s.idx}</span><span>${s.title}</span>`);
        sa.href = '#' + ch.id + '.' + s.idx;
        sa.dataset.sec = s.idx;
        secs.append(sa);
      });
      nav.append(secs);
    }
  }
  function markToc(id) {
    $$('#toc > a').forEach((a) => a.classList.toggle('active', a.dataset.id === id));
    $$('#toc .toc-secs').forEach((s) => { s.hidden = s.dataset.for !== id; });
    const act = $('#toc > a.active');
    if (act && act.scrollIntoView) {
      const sb = $('#sidebar');
      const r = act.getBoundingClientRect(), rs = sb.getBoundingClientRect();
      if (r.top < rs.top + 60 || r.bottom > rs.bottom - 60) sb.scrollTop += r.top - rs.top - 120;
    }
  }

  /* ---------- Construcción de un capítulo ---------- */
  function build(ch) {
    if (state.built[ch.id]) return state.built[ch.id];
    const art = el('article', 'chapter');
    art.id = 'cap-' + ch.id;
    art.dataset.id = ch.id;
    art.setAttribute('lang', 'es');
    const frag = ch.tpl.content.cloneNode(true);
    if (!ch.home) {
      const head = el('header', 'ch-head');
      head.innerHTML = `<div class="ch-num" aria-hidden="true">${pad(ch.num)}</div><div><div class="ch-part">${ch.part}</div><h1 class="ch-title">${ch.title}</h1></div>`;
      const lead = frag.querySelector('.lead');
      if (lead) { lead.classList.add('ch-lead'); head.append(lead); }
      const chips = el('nav', 'ch-contents');
      chips.setAttribute('aria-label', 'Contenido del capítulo');
      head.append(chips);
      art.append(head);
      art.append(frag);
      /* Numeración de secciones */
      $$(':scope > section', art).forEach((s, i) => {
        if (!s.id) s.id = ch.id + '-s' + (i + 1);
        const h2 = s.querySelector('h2');
        const t = h2 ? stripMath(h2.textContent) : '';
        if (h2) h2.insertAdjacentHTML('afterbegin', `<span class="n">${ch.num}.${i + 1}</span>`);
        const a = el('a', null, `<span class="n">${ch.num}.${i + 1}</span>${t}`);
        a.href = '#' + ch.id + '.' + (i + 1);
        chips.append(a);
      });
      /* Simulaciones y ejemplos */
      $$('.sim[data-sim]', art).forEach((s, i) => { s.dataset.num = `Simulación ${ch.num}.${i + 1}`; s.id = ch.id + '-sim' + (i + 1); });
      $$('.box.ex', art).forEach((b, i) => { b.dataset.label = `Ejemplo ${ch.num}.${i + 1}`; });
      /* Navegación anterior/siguiente */
      const i = state.list.indexOf(ch);
      const nav = el('nav', 'ch-nav');
      nav.setAttribute('aria-label', 'Capítulos vecinos');
      const prev = state.list[i - 1], next = state.list[i + 1];
      if (prev) { const a = el('a', 'prev', `<small>← Anterior · ${pad(prev.num)}</small><span>${prev.title}</span>`); a.href = '#' + prev.id; nav.append(a); }
      if (next) { const a = el('a', 'next', `<small>Siguiente · ${pad(next.num)} →</small><span>${next.title}</span>`); a.href = '#' + next.id; nav.append(a); }
      art.append(nav);
    } else {
      art.append(frag);
      fillHome(art);
    }
    $('#chapters').append(art);
    /* Montaje de simulaciones */
    const sims = [];
    $$('.sim[data-sim]', art).forEach((host) => {
      const name = host.dataset.sim;
      const f = RT.sims[name];
      const sim = new RT.Sim(host, name);
      if (!f) { sim.fail(new Error('simulación no encontrada: ' + name)); return; }
      try { f(sim, host.dataset); } catch (e) { sim.fail(e); }
      sims.push(sim);
    });
    state.sims[ch.id] = sims;
    state.built[ch.id] = art;
    $$('[data-pasos]', art).forEach((h) => { try { RT.montarPasos(h); } catch (e) { console.error(e); } });
    wireExtras(art);
    typeset(art);
    return art;
  }

  /* ---------- Código copiable y enlaces externos ---------- */
  function wireExtras(art) {
    $$('a[href^="http"]', art).forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    $$('.pycode', art).forEach((box) => {
      const btn = $('button.copy', box), code = $('pre code', box);
      if (!btn || !code) return;
      btn.addEventListener('click', () => {
        const txt = code.textContent;
        const done = (ok) => { btn.textContent = ok ? 'Copiado' : 'Seleccionado: use Ctrl+C'; setTimeout(() => { btn.textContent = 'Copiar código'; }, 1800); };
        const select = () => { const r = document.createRange(); r.selectNodeContents(code); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); done(false); };
        try { navigator.clipboard.writeText(txt).then(() => done(true), select); } catch (e) { select(); }
      });
    });
  }

  /* ---------- Portada ---------- */
  function fillHome(art) {
    const box = $('.home-parts', art);
    if (!box) return;
    let part = null, grid = null;
    for (const ch of state.list) {
      if (ch.part !== part) {
        part = ch.part;
        const sec = el('div', 'home-part');
        sec.append(el('h3', null, part));
        grid = el('div', 'home-grid');
        sec.append(grid);
        box.append(sec);
      }
      const a = el('a', 'home-card', `<span class="n">${pad(ch.num)}</span><b>${ch.title}</b><small>${ch.short}</small>` + (ch.simCount ? `<span class="sims">${ch.simCount} simulacion${ch.simCount === 1 ? '' : 'es'} · ${ch.sections.length} secciones</span>` : `<span class="sims">${ch.sections.length} secciones</span>`));
      a.href = '#' + ch.id;
      grid.append(a);
    }
    const tot = state.list.reduce((s, c) => s + c.simCount, 0);
    const cnt = $('.home-count', art);
    const nCh = state.list.filter((c) => typeof c.num === 'number').length, nAp = state.list.length - nCh;
    if (cnt) cnt.textContent = `${nCh} capítulos` + (nAp ? ` · ${nAp} apéndice${nAp > 1 ? 's' : ''}` : '') + ` · ${tot} simulaciones interactivas`;
  }

  /* ---------- Navegación ---------- */
  function parseHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return { id: 'inicio' };
    const [id, sec] = h.split('.');
    if (!state.byId[id]) {
      /* ¿es un id de sección o simulación? */
      const target = document.getElementById(h);
      if (target) return { id: null, el: target };
      return { id: 'inicio' };
    }
    return { id, sec: sec ? +sec : null };
  }
  function show(id, sec) {
    const ch = state.byId[id] || state.byId.inicio;
    const art = build(ch);
    for (const k in state.built) {
      const on = k === ch.id;
      state.built[k].hidden = !on;
      (state.sims[k] || []).forEach((s) => s.setActive(on));
    }
    const changed = state.current !== ch.id;
    state.current = ch.id;
    markToc(ch.id);
    const crumb = $('#crumb');
    crumb.innerHTML = ch.home ? '<b>Cableado con criterio</b> · el RETIE aplicado a una vivienda' : `<span>${ch.part}</span> · <b>${pad(ch.num)} ${ch.title}</b>`;
    document.title = ch.home ? 'Cableado con criterio' : `${ch.title} · Cableado con criterio`;
    closeNav();
    requestAnimationFrame(() => {
      if (sec) {
        const s = $$(':scope > section', art)[sec - 1];
        if (s) { s.scrollIntoView({ block: 'start' }); return; }
      }
      if (changed) window.scrollTo(0, 0);
    });
    observeSections(art, ch);
    RT.store.set('last', ch.id);
  }
  function route() {
    const r = parseHash();
    if (r.el) {
      const art = r.el.closest('.chapter');
      if (art) show(art.dataset.id);
      r.el.scrollIntoView({ block: 'start' });
      return;
    }
    show(r.id, r.sec);
  }

  /* Resaltado de sección actual y barra de progreso */
  let secObs = null;
  function observeSections(art, ch) {
    if (secObs) secObs.disconnect();
    if (ch.home) return;
    const secs = $$(':scope > section', art);
    const links = $$(`#toc .toc-secs[data-for="${ch.id}"] a`);
    const vis = new Map();
    secObs = new IntersectionObserver((es) => {
      es.forEach((e) => vis.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
      let best = -1;
      secs.forEach((s, i) => { if ((vis.get(s) || 0) > 0 && best < 0) best = i; });
      links.forEach((a, i) => a.classList.toggle('here', i === best));
    }, { rootMargin: '-60px 0px -55% 0px', threshold: [0, 0.01] });
    secs.forEach((s) => secObs.observe(s));
  }
  function onScroll() {
    const bar = $('#progress');
    if (!bar) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (100 * h.scrollTop) / max : 0).toFixed(1) + '%';
  }

  /* ---------- Menú móvil ---------- */
  function openNav() {
    $('#app').classList.add('nav-open');
    if (!$('.scrim')) {
      const s = el('div', 'scrim');
      s.addEventListener('click', closeNav);
      $('#app').append(s);
    }
  }
  function closeNav() {
    $('#app').classList.remove('nav-open');
    const s = $('.scrim');
    if (s) s.remove();
  }

  /* ---------- Tema ---------- */
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const b = $('#themeBtn');
    if (b) {
      const lab = t === 'dark' ? 'Oscuro' : t === 'light' ? 'Claro' : 'Sistema';
      b.querySelector('span').textContent = lab;
      b.title = 'Tema: ' + lab + ' (clic para cambiar)';
    }
  }
  function cycleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const order = [null, 'light', 'dark'];
    const next = order[(order.indexOf(cur) + 1) % 3];
    RT.store.set('theme', next);
    applyTheme(next);
  }

  /* ---------- Búsqueda ---------- */
  let index = null;
  function buildIndex() {
    index = [];
    for (const ch of state.list) {
      const frag = ch.tpl.content;
      index.push({ ch, sec: null, title: ch.title, text: ch.short, n: norm(ch.title + ' ' + ch.short), w: 3 });
      kids(frag, 'SECTION').forEach((s, i) => {
        const h = s.querySelector('h2');
        const title = h ? stripMath(h.textContent) : '';
        index.push({ ch, sec: i + 1, title, text: '', n: norm(title), w: 2 });
        $$('h3, h4, .sim[data-title]', s).forEach((x) => {
          const t = x.dataset && x.dataset.title ? 'Simulación: ' + x.dataset.title : stripMath(x.textContent);
          index.push({ ch, sec: i + 1, title: t, text: title, n: norm(t), w: 1.5 });
        });
        $$('p, li', s).forEach((p) => {
          const t = stripMath(p.textContent);
          if (t.length > 20) index.push({ ch, sec: i + 1, title, text: t, n: norm(t), w: 1 });
        });
      });
    }
  }
  function search(q) {
    if (!index) buildIndex();
    const terms = norm(q).split(/\s+/).filter((t) => t.length > 1);
    if (!terms.length) return [];
    const res = [];
    const seen = new Set();
    for (const it of index) {
      if (!terms.every((t) => it.n.includes(t))) continue;
      const key = it.ch.id + '|' + it.sec + '|' + it.title + '|' + (it.w === 1 ? it.text.slice(0, 40) : '');
      if (seen.has(key)) continue;
      seen.add(key);
      res.push(it);
    }
    res.sort((a, b) => b.w - a.w);
    return res.slice(0, 14);
  }
  function highlight(text, q) {
    const terms = norm(q).split(/\s+/).filter((t) => t.length > 1);
    let s = text;
    if (s.length > 140) {
      const i = norm(s).indexOf(terms[0] || '');
      const st = Math.max(0, i - 50);
      s = (st > 0 ? '…' : '') + s.slice(st, st + 140) + '…';
    }
    const esc = s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    let out = esc;
    for (const t of terms) {
      const ns = norm(out);
      const i = ns.indexOf(t);
      if (i >= 0) out = out.slice(0, i) + '<mark>' + out.slice(i, i + t.length) + '</mark>' + out.slice(i + t.length);
    }
    return out;
  }
  function setupSearch() {
    const inp = $('#searchIn'), box = $('#searchRes');
    let sel = -1, items = [];
    const render = () => {
      const q = inp.value.trim();
      if (q.length < 2) { box.hidden = true; return; }
      items = search(q);
      box.innerHTML = '';
      if (!items.length) { box.append(el('div', 'sr-none', 'Sin resultados para “' + q.replace(/</g, '&lt;') + '”.')); box.hidden = false; return; }
      items.forEach((it, i) => {
        const b = el('button', i === sel ? 'sel' : '');
        b.type = 'button';
        b.innerHTML = `<div class="sr-ch">${pad(it.ch.num)} · ${it.ch.title}</div><div class="sr-t">${highlight(it.title, q)}</div>` + (it.w === 1 ? `<div class="sr-s">${highlight(it.text, q)}</div>` : '');
        b.addEventListener('click', () => go(it));
        box.append(b);
      });
      box.hidden = false;
    };
    const go = (it) => {
      box.hidden = true;
      inp.value = '';
      location.hash = it.ch.id + (it.sec ? '.' + it.sec : '');
    };
    inp.addEventListener('input', () => { sel = -1; render(); });
    inp.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { const it = items[Math.max(0, sel)]; if (it) go(it); }
      else if (e.key === 'Escape') { box.hidden = true; }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') { e.preventDefault(); inp.focus(); }
    });
  }

  /* ---------- Arranque ---------- */
  function init() {
    readChapters();
    buildToc();
    setupSearch();
    applyTheme(RT.store.get('theme', null));
    $('#themeBtn').addEventListener('click', cycleTheme);
    $('#menuBtn').addEventListener('click', () => ($('#app').classList.contains('nav-open') ? closeNav() : openNav()));
    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    route();
    if (window.__mjReady && !state.mathReady) RT.mathReady();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
