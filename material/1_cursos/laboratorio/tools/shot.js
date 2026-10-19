/* Capturas y verificación con Chrome sin ventana.
   node shot.js shot <hash> <salida.png> [--sim nombre] [--full] [--dark] [--mobile] [--wait ms] [--js "código"]
   node shot.js check [ids...]     → recorre capítulos y reporta errores de simulaciones, consola y MathJax */
const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
const args = process.argv.slice(2);
const flag = (k) => args.includes('--' + k);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const mobile = flag('mobile');
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: +opt('width', 1320), height: +opt('height', 900), deviceScaleFactor: 1 });
  if (flag('dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  const mode = args[0];
  if (mode === 'shot') {
    const hash = args[1], out = args[2];
    await page.goto(PAGE + '#' + hash, { waitUntil: 'load' });
    await sleep(+opt('wait', 2500));
    const js = opt('js', null);
    if (js) { await page.evaluate(js); await sleep(+opt('wait2', 800)); }
    const simName = opt('sim', null);
    if (simName) {
      const idx = +opt('idx', 0);
      const els = await page.$$(`.sim[data-sim="${simName}"]`);
      const el = els[idx];
      if (!el) { console.log('No existe la simulación', simName); }
      else {
        await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
        await sleep(+opt('wait3', 1200));
        await el.screenshot({ path: out });
      }
    } else {
      await page.screenshot({ path: out, fullPage: flag('full') });
    }
    const simErr = await page.$$eval('.sim-error', (es) => es.map((e) => e.textContent));
    console.log(JSON.stringify({ errors: errs, simErrors: simErr }, null, 1));
  } else if (mode === 'check') {
    await page.goto(PAGE + '#inicio', { waitUntil: 'load' });
    await sleep(2500);
    let ids = args.slice(1).filter((a) => !a.startsWith('--'));
    if (!ids.length) ids = await page.$$eval('template.chapter-src', (ts) => ts.map((t) => t.dataset.id));
    const report = [];
    for (const id of ids) {
      errs.length = 0;
      await page.evaluate((h) => { location.hash = h; }, id);
      await sleep(1800);
      /* recorrer la página para activar todas las simulaciones */
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      });
      await sleep(600);
      const res = await page.evaluate((cid) => {
        const art = document.getElementById('cap-' + cid);
        if (!art) return { missing: true };
        const simErr = Array.from(art.querySelectorAll('.sim-error')).map((e) => e.closest('.sim').dataset.sim + ': ' + e.textContent);
        const red = art.querySelectorAll('g[data-mml-node="mtext"][fill="red"], mjx-merror').length;
        const emptyCanvas = Array.from(art.querySelectorAll('.sim canvas')).filter((c) => c.width === 0 || c.height === 0).length;
        const sims = art.querySelectorAll('.sim[data-sim]').length;
        const wide = Array.from(art.querySelectorAll('*')).filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 2 && !e.closest('.tablewrap, .codebox, .aib, mjx-container, .sim-table, .workspace, pre, .ide')).slice(0, 3).map((e) => e.tagName + '.' + e.className);
        return { sims, simErr, red, emptyCanvas, wide };
      }, id);
      report.push(Object.assign({ id, errors: errs.slice(0, 6) }, res));
    }
    for (const r of report) {
      const bad = r.missing || r.simErr.length || r.red || r.errors.length || r.wide.length;
      console.log((bad ? '✗ ' : '✓ ') + r.id + ` · ${r.sims} sims` + (r.simErr && r.simErr.length ? ' · ' + r.simErr.join(' | ') : '') + (r.red ? ` · ${r.red} fórmulas con error` : '') + (r.errors.length ? ' · consola: ' + r.errors.join(' | ') : '') + (r.wide && r.wide.length ? ' · desborda: ' + r.wide.join(', ') : '') + (r.emptyCanvas ? ` · ${r.emptyCanvas} lienzos sin tamaño` : ''));
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
