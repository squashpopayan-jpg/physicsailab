/* Ejecuta los casos de tests/casos.json con el motor JavaScript y guarda tests/out/js_trades.json.
   Después: python tests/comparar_motor.py  compara con el motor de referencia en Python. */
const fs = require('fs');
const path = require('path');
const ML = require('./cargar');
const E = ML.L.eng;
(async () => {
  const casos = JSON.parse(fs.readFileSync(path.join(__dirname, 'casos.json'), 'utf8'));
  const out = {};
  const sets = {};
  const get = async (k) => (sets[k] = sets[k] || (await E.load(k)));
  for (const c of casos) {
    const S = await get(c.serie), ctx = c.ctx ? await get(c.ctx) : null;
    const P = E.params(c.p);
    const X = E.prep(S, ctx);
    const t0 = Date.now();
    const tr = E.run(S, X, P);
    out[c.id] = tr.map((t) => ({ i: t.i, j: t.j, k: t.k, d: t.d, ent: t.ent, px: t.px, lots: t.lots, motivo: t.reason, usd: t.usd, R: t.R, mfe: t.mfe, mae: t.mae, dia: t.day }));
    const s = E.stats(tr, P);
    console.log(c.id.padEnd(16), 'n', String(s.n).padStart(4), 'aciertos', (100 * s.winPct).toFixed(1).padStart(5), '%  R medio', s.avgR.toFixed(3).padStart(7), ' USD', s.usd.toFixed(0).padStart(6), ' ', Date.now() - t0, 'ms');
  }
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'js_trades.json'), JSON.stringify(out));
})();
