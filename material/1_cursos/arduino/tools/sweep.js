/* Barrido de robustez: en cada capítulo, para cada simulación pulsa Reiniciar, cada botón,
   cada casilla/deslizador/selector y vuelve a Reiniciar, y reporta cualquier error.
   node tools/sweep.js [ids...] */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1320, height: 900 });
  const errs = [];
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto('file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/') + '#inicio', { waitUntil: 'load' });
  await sleep(2500);
  let ids = process.argv.slice(2);
  if (!ids.length) ids = await pg.$$eval('template.chapter-src', (ts) => ts.map((t) => t.dataset.id));
  let nsim = 0, bad = 0;
  for (const id of ids) {
    await pg.evaluate((h) => { location.hash = h; }, id);
    await sleep(1500);
    await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } });
    await sleep(600);
    const n = await pg.$$eval('.sim[data-sim]', (e) => e.length);
    for (let i = 0; i < n; i++) {
      errs.length = 0;
      const name = await pg.evaluate((i) => {
        const el = document.querySelectorAll('.sim[data-sim]')[i];
        el.scrollIntoView();
        const reset = () => [...el.querySelectorAll('button')].find((x) => /reiniciar|restablecer/i.test(x.textContent + ' ' + (x.title || '') + ' ' + (x.getAttribute('aria-label') || '')))?.click();
        reset();
        return el.dataset.sim;
      }, i);
      await sleep(300);
      /* controles */
      await pg.evaluate(async (i) => {
        const el = document.querySelectorAll('.sim[data-sim]')[i];
        const w = (ms) => new Promise((r) => setTimeout(r, ms));
        for (const c of [...el.querySelectorAll('input[type=checkbox]')]) { c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles: true })); await w(120); }
        for (const c of [...el.querySelectorAll('input[type=range]')]) { for (const f of [1, 0, 0.5]) { c.value = +c.min + f * (+c.max - +c.min); c.dispatchEvent(new Event('input', { bubbles: true })); await w(80); } }
        for (const c of [...el.querySelectorAll('select')]) { for (let k = 0; k < c.options.length; k++) { c.selectedIndex = k; c.dispatchEvent(new Event('change', { bubbles: true })); await w(80); } }
        for (const x of [...el.querySelectorAll('button')]) { if (/borrar|eliminar|quitar todo/i.test(x.textContent)) continue; x.click(); await w(100); }
        await w(900);
        [...el.querySelectorAll('button')].find((x) => /reiniciar|restablecer/i.test(x.textContent + ' ' + (x.title || '') + ' ' + (x.getAttribute('aria-label') || '')))?.click();
        await w(400);
      }, i);
      await sleep(300);
      const simErr = await pg.evaluate((i) => [...document.querySelectorAll('.sim[data-sim]')[i].querySelectorAll('.sim-error')].map((e) => e.textContent), i);
      nsim++; console.log('ok', id, name);
      if (errs.length || simErr.length) { bad++; console.log(id, name, JSON.stringify({ errs: [...new Set(errs)], simErr })); }
    }
  }
  console.log('simulaciones recorridas:', nsim, ' con error:', bad);
  await b.close();
})();
