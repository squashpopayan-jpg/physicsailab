/* Apéndice C — Bibliografía: se construye a partir de los recuadros de referencias de cada capítulo */
(function () {
  'use strict';
  const RC = window.RC;
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function recolectar() {
    const map = new Map();
    document.querySelectorAll('template.chapter-src').forEach((t) => {
      const num = t.dataset.num, id = t.dataset.id;
      if (id === 'bibliografia') return;
      t.content.querySelectorAll('.box.links li').forEach((li) => {
        const a = li.querySelector('a');
        if (!a) return;
        const href = a.getAttribute('href');
        const key = href.replace(/^https?:\/\/(dx\.)?doi\.org\//i, 'doi:').toLowerCase();
        const small = li.querySelector('small');
        const e = map.get(key) || { href, texto: a.textContent.trim(), fuente: small ? small.textContent.trim() : '', caps: [] };
        if (!e.caps.some((c) => c.id === id)) e.caps.push({ id, num });
        map.set(key, e);
      });
    });
    return [...map.values()].sort((x, y) => norm(x.texto).localeCompare(norm(y.texto), 'es'));
  }

  RC.defineSim('bibliografia', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const root = sim.html('trk');
    const refs = recolectar();
    const doi = refs.filter((r) => /doi\.org/.test(r.href)).length;
    root.innerHTML = `
      <div class="row"><label style="flex:1 1 260px">Buscar autor, tema o revista<input type="search" class="q" placeholder="por ejemplo: Hall, hábitos, Lancet"></label></div>
      <p class="muted cuenta"></p>
      <ol class="biblio"></ol>`;
    const list = root.querySelector('.biblio'), q = root.querySelector('.q'), cuenta = root.querySelector('.cuenta');
    const pintar = () => {
      const t = norm(q.value.trim());
      const vis = t ? refs.filter((r) => norm(r.texto + ' ' + r.fuente).includes(t)) : refs;
      cuenta.textContent = `${vis.length} de ${refs.length} referencias (${doi} con DOI). Cada una indica los capítulos donde se cita.`;
      list.innerHTML = vis.map((r) => `<li><a href="${esc(r.href)}" target="_blank" rel="noopener">${esc(r.texto)}</a>${r.fuente ? ` <small>${esc(r.fuente)}</small>` : ''} <span class="caps">${r.caps.map((c) => `<a href="#${esc(c.id)}">${esc(String(c.num))}</a>`).join(', ')}</span></li>`).join('');
    };
    q.addEventListener('input', pintar);
    pintar();
  });
})();
