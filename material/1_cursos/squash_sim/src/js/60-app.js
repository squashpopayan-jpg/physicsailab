/* Aplicación: navegación, tema, logo y diálogo modal propio (el visor bloquea alert/confirm). */
MS.App = (function () {
  const { U } = MS;
  const pages = {};
  const hooks = {};
  let current = null;

  function initLogo() {
    const src = window.MS_LOGO;
    for (const im of U.$$('img[data-logo]')) { im.src = src; }
    const img = new Image(); img.src = src; MS.logoImg = img;
    MS.TV.setLogo(img);
  }
  function go(id, push = true) {
    if (!pages[id]) id = 'inicio';
    for (const k in pages) pages[k].classList.toggle('on', k === id);
    for (const b of U.$$('.nav [data-go]')) b.setAttribute('aria-current', b.dataset.go === id ? 'page' : 'false');
    const prev = current; current = id;
    if (push) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* visor sin historial */ } }
    if (hooks[id] && hooks[id].show) hooks[id].show(prev);
    if (prev && prev !== id && hooks[prev] && hooks[prev].hide) hooks[prev].hide();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  function on(id, h) { hooks[id] = Object.assign(hooks[id] || {}, h); }
  function theme() {
    const root = document.documentElement;
    const saved = U.store.get('ms.theme', null);
    if (saved) root.setAttribute('data-theme', saved);
    U.$('#themeBtn').addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') ? root.getAttribute('data-theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      const nx = dark ? 'light' : 'dark';
      root.setAttribute('data-theme', nx); U.store.set('ms.theme', nx);
      for (const k in hooks) if (hooks[k].theme) hooks[k].theme();
    });
  }
  /* Diálogo: modal({title, body (nodo o html), buttons:[{label, primary, onClick}]}) */
  function modal(o) {
    const m = U.$('#modal');
    U.$('#modalTitle').textContent = o.title || '';
    const body = U.$('#modalBody'); body.innerHTML = '';
    if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.append(o.body);
    const row = U.$('#modalRow'); row.innerHTML = '';
    const close = () => { m.classList.remove('on'); if (o.onClose) o.onClose(); };
    for (const b of o.buttons || [{ label: 'Cerrar' }]) {
      const el = U.h('button', { class: 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''), text: b.label });
      el.addEventListener('click', async () => { if (b.onClick) { const keep = await b.onClick(); if (keep === true) return; } close(); });
      row.append(el);
    }
    m.classList.add('on');
    m.onclick = (e) => { if (e.target === m) close(); };
    const first = row.querySelector('.btn.primary') || row.querySelector('.btn'); if (first) first.focus();
    return { close, body, row };
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = U.$('#modal'); if (m && m.classList.contains('on')) m.classList.remove('on'); } });

  function init() {
    for (const s of U.$$('[data-page]')) pages[s.dataset.page] = s;
    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]');
      if (g) { e.preventDefault(); go(g.dataset.go); }
    });
    initLogo();
    theme();
    for (const k in hooks) if (hooks[k].init) { try { hooks[k].init(); } catch (err) { console.error('init ' + k, err); } }
    const h = (location.hash || '').replace('#', '');
    go(pages[h] ? h : 'inicio', false);
  }
  return { init, go, on, modal, pages, get current() { return current; } };
})();
