const g = sim('gran-reto'); const area = g.host.querySelector('.sim-area');
let n = 0;
while (!area.querySelector('.gr-end') && n < 40) { const o = area.querySelector('.opt'); if (!o) break; o.click(); const nx = area.querySelector('.gr-next'); nx.click(); n++; }
const end = area.querySelector('.gr-end'); const t = end ? end.textContent.slice(0, 80) : null;
const qs = FK.chapters.reduce((s, c) => s + c.tpl.content.querySelectorAll('.quiz .q').length, 0);
return { pasos: n, fin: t, totalPreguntas: qs, stats: FK.totalStars() };
