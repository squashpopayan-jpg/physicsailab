/* Busca fórmulas con error de MathJax en todos los capítulos (merror) y caracteres de control.
   node tools/mathcheck.js [ids...] */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1320, height: 900 });
  await page.goto(PAGE + '#inicio', { waitUntil: 'load' });
  await sleep(3000);
  let ids = process.argv.slice(2);
  if (!ids.length) ids = await page.$$eval('template.chapter-src', (ts) => ts.map((t) => t.dataset.id));
  let total = 0;
  for (const id of ids) {
    await page.evaluate((h) => { location.hash = h; }, id);
    await sleep(1500);
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
    });
    /* visita cada simulación para que corra y revisa sus lecturas */
    const nsim = await page.$$eval('#cap-' + id + ' .sim[data-sim]', (es) => es.length);
    for (let k = 0; k < nsim; k++) {
      await page.evaluate((cid, k) => document.querySelectorAll('#cap-' + cid + ' .sim[data-sim]')[k].scrollIntoView({ block: 'start' }), id, k);
      await sleep(900);
    }
    const simBad = await page.evaluate((cid) => Array.from(document.querySelectorAll('#cap-' + cid + ' .sim[data-sim]')).filter((e) => /NaN|undefined|Infinity|\[object|null/.test(e.innerText)).map((e) => e.dataset.sim + ': ' + (e.innerText.match(/.{0,30}(NaN|undefined|Infinity|\[object|null).{0,20}/) || [''])[0].replace(/\s+/g, ' ')), id);
    await sleep(500);
    if (await page.evaluate(() => window.MathJax && MathJax.typesetPromise && MathJax.startup && MathJax.startup.promise ? MathJax.startup.promise.then(() => 0) : 0)) {}
    const res = await page.evaluate((cid) => {
      const art = document.getElementById('cap-' + cid);
      if (!art) return { missing: true };
      const bad = [];
      art.querySelectorAll('[data-mml-node="merror"], mjx-merror, [data-mjx-error]').forEach((e) => {
        const c = e.closest('mjx-container');
        bad.push((e.getAttribute('data-mjx-error') || (e.textContent || '')).slice(0, 80) + ' ← ' + (c && c.previousSibling && c.previousSibling.textContent ? c.previousSibling.textContent.slice(-60) : ''));
      });
      const ctrl = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(art.textContent);
      const pend = art.querySelectorAll('.loading-math').length;
      const raw = (art.textContent.match(/\\\(|\\\)|\$\$/g) || []).length;   /* delimitadores sin procesar */
      const mj = art.querySelectorAll('mjx-container').length;
      return { bad, ctrl, pend, raw, mj };
    }, id);
    res.simBad = simBad;
    const flag = res.simBad.length || res.missing || res.bad.length || res.ctrl || res.pend || res.raw;
    if (flag) total++;
    console.log((flag ? '✗ ' : '✓ ') + id + ' · ' + (res.mj || 0) + ' fórmulas' + (res.bad && res.bad.length ? ' · ERRORES: ' + res.bad.join(' ; ') : '') + (res.simBad.length ? ' · LECTURAS RARAS: ' + res.simBad.join(' | ') : '') + (res.ctrl ? ' · caracteres de control' : '') + (res.pend ? ' · sin procesar ' + res.pend : '') + (res.raw ? ' · delimitadores crudos ' + res.raw : ''));
  }
  console.log(total ? 'CAPÍTULOS CON PROBLEMAS: ' + total : 'TODO LIMPIO');
  await browser.close();
})();
