/* Capturas y verificación con Chrome sin ventana.
   node tools/shot.js shot <hash> <salida.png> [--sim nombre] [--full] [--dark] [--mobile] [--wait ms] [--js "código"]
   node tools/shot.js check [ids...]   → monta todas las simulaciones de cada capítulo, avanza 240 pasos y reporta errores */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
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
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: +opt('width', 1200), height: +opt('height', 900), deviceScaleFactor: 1 });
  if (flag('dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/fonts\.g|ERR_INTERNET|ERR_NAME|Failed to load resource/.test(t)) errs.push(m.type() + ': ' + t); } });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  const mode = args[0];
  if (mode === 'shot') {
    const hash = args[1], out = args[2];
    await page.goto(PAGE + '#' + hash, { waitUntil: 'load' });
    await sleep(+opt('wait', 1500));
    const js = opt('js', null);
    if (js) { await page.evaluate(js); await sleep(+opt('wait2', 800)); }
    const simName = opt('sim', null);
    if (simName) {
      const el = await page.$(`.sim[data-sim="${simName}"]`);
      if (!el) console.log('No existe la simulación', simName);
      else {
        await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
        await sleep(+opt('wait3', 1500));
        const js2 = opt('js2', null);
        if (js2) { await page.evaluate(js2); await sleep(+opt('wait4', 600)); }
        await el.screenshot({ path: out });
      }
    } else if (opt('sel', null)) {
      const el = await page.$(opt('sel'));
      await el.evaluate((e) => e.scrollIntoView({ block: 'start' })); await sleep(800);
      await el.screenshot({ path: out });
    } else await page.screenshot({ path: out, fullPage: flag('full') });
    const simErr = await page.$$eval('.sim-error', (es) => es.map((e) => e.textContent));
    console.log(JSON.stringify({ errors: errs, simErrors: simErr }, null, 1));
  } else if (mode === 'check') {
    await page.goto(PAGE + '#inicio', { waitUntil: 'load' });
    await sleep(1200);
    let ids = args.slice(1).filter((a) => !a.startsWith('--'));
    if (!ids.length) ids = await page.evaluate(() => FK.chapters.map((c) => c.id).concat(Object.keys(FK.pages)));
    let bad = 0, nsim = 0;
    for (const id of ids) {
      errs.length = 0;
      await page.evaluate((h) => { location.hash = h; }, id);
      await sleep(500);
      const res = await page.evaluate(async () => {
        const art = document.querySelector('article.chapter');
        if (!art) return { missing: true };
        document.querySelectorAll('.sim[data-sim]').forEach((h) => FK.mountSim(h));
        await new Promise((r) => setTimeout(r, 150));
        const problems = [];
        let sims = 0;
        for (const g of FK.activeSims) {
          sims++;
          try { g._tick(240); } catch (e) { problems.push(g.name + ': ' + e.message); }
          if (g.cv && (g.cv.width === 0 || g.cv.height === 0)) problems.push(g.name + ': lienzo sin tamaño');
        }
        art.querySelectorAll('.sim-error').forEach((e) => problems.push(e.textContent));
        /* desbordes horizontales */
        const wide = Array.from(art.querySelectorAll('*')).filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 2 && !e.closest('.tablewrap, .chhero')).slice(0, 3).map((e) => e.tagName + '.' + e.className);
        return { sims, problems, wide };
      }, id);
      nsim += res.sims || 0;
      const isBad = res.missing || (res.problems && res.problems.length) || errs.length || (res.wide && res.wide.length);
      if (isBad) bad++;
      console.log((isBad ? '✗ ' : '✓ ') + id + ` · ${res.sims} sims` + (res.problems && res.problems.length ? ' · ' + res.problems.join(' | ') : '') + (errs.length ? ' · consola: ' + errs.slice(0, 4).join(' | ') : '') + (res.wide && res.wide.length ? ' · desborda: ' + res.wide.join(', ') : ''));
    }
    console.log(`${ids.length} páginas, ${nsim} simulaciones, ${bad} con problemas`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
