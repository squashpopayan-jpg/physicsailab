/* Coherencia interna de los datos históricos */
const fs = require('fs'), path = require('path');
module.exports = function (T) {
  const dir = path.join(__dirname, '..', 'src', 'data'), chDir = path.join(__dirname, '..', 'src', 'chapters');
  const H = { people: [], events: [], formulas: [], myths: [] };
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').split('\\').join('\\\\'));
    for (const k of Object.keys(H)) if (d[k]) H[k].push(...d[k]);
  }
  const plan = fs.readFileSync(path.join(__dirname, '..', 'PLAN.md'), 'utf8');
  const planIds = new Set([...plan.matchAll(/\|\s*\d+\s*\|\s*([a-z0-9]+)\s*\|/g)].map((m) => m[1]));
  const G = 'Datos';
  const dup = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);
  T.eq(G, 'identificadores de personajes únicos', dup(H.people.map((p) => p.id)), []);
  T.eq(G, 'identificadores de fórmulas únicos', dup(H.formulas.map((p) => p.id)), []);
  T.ok(G, 'todo personaje nace antes de morir', H.people.every((p) => p.b < p.d));
  T.ok(G, 'ninguna vida supera 110 años', H.people.every((p) => p.d - p.b <= 110));
  T.ok(G, 'personajes con capítulo del plan', H.people.every((p) => planIds.has(p.ch)));
  T.ok(G, 'acontecimientos con capítulo del plan', H.events.every((e) => planIds.has(e.ch)));
  T.ok(G, 'fórmulas con capítulo del plan', H.formulas.every((e) => planIds.has(e.ch)));
  T.ok(G, 'mitos con capítulo del plan', H.myths.every((e) => planIds.has(e.ch)));
  T.ok(G, 'veredictos válidos', H.myths.every((m) => ['falso', 'dudoso', 'cierto', 'matiz'].includes(m.v)));
  T.ok(G, 'categorías de acontecimientos válidas', H.events.every((e) => ['met', 'ast', 'mec', 'opt', 'cal', 'em', 'atm', 'rel', 'nuc', 'mat'].includes(e.k)));
  T.ok(G, 'acontecimientos con año numérico y texto', H.events.every((e) => Number.isFinite(e.y) && e.t && e.s));
  T.ok(G, 'etiquetas cortas (26 caracteres o menos)', H.events.every((e) => e.s.length <= 26));
  T.ok(G, 'fórmulas con TeX balanceado', H.formulas.every((f) => (f.tex.match(/\{/g) || []).length === (f.tex.match(/\}/g) || []).length));
  /* cada acontecimiento cae dentro del rango de años del capítulo al que se atribuye */
  const RANGE = require('./rangos.json');
  for (const [c, [a, b]] of Object.entries(RANGE)) {
    if (!H.events.some((e) => e.ch === c)) continue;
    T.ok(G, `acontecimientos de «${c}» entre ${a} y ${b}`, H.events.filter((e) => e.ch === c).every((e) => e.y >= a && e.y <= b));
  }
  /* un personaje vivo en un año de acontecimiento ligado a su capítulo: al menos uno coincide con la vida de algún personaje del capítulo */
  for (const c of new Set(H.events.map((e) => e.ch))) {
    const ps = H.people.filter((p) => p.ch === c), es = H.events.filter((e) => e.ch === c);
    if (ps.length) T.ok(G, `«${c}»: algún acontecimiento cae en la vida de algún personaje del capítulo`, es.some((e) => ps.some((p) => e.y >= p.b - 5 && e.y <= p.d + 150)));
  }
};
