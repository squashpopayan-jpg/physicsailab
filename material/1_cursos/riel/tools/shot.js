/* Capturas con Chrome sin ventana (WebGL por software).
   node tools/shot.js <salida.png> [--js "código"] [--jsfile f] [--mobile] [--dark] [--wait ms] [--wait2 ms] [--width n --height n] */
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../laboratorio/tools/node_modules/puppeteer-core'));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/Riel_de_Aire.html').split(path.sep).join('/');
const args = process.argv.slice(2);
const flag = (k) => args.includes('--' + k);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const page = await browser.newPage();
  await page.setViewport(flag('mobile') ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: +opt('width', 1440), height: +opt('height', 900), deviceScaleFactor: 1 });
  if (flag('dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); else if (m.type() === 'log') console.log('log:', m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await sleep(+opt('wait', 2500));
  const js = opt('jsfile', null) ? require('fs').readFileSync(opt('jsfile'), 'utf8') : opt('js', null);
  if (js) { const r = await page.evaluate(js); if (r !== undefined) console.log('resultado:', typeof r === 'string' ? r : JSON.stringify(r, null, 1)); await sleep(+opt('wait2', 1500)); }
  if (opt('seq', null)) {
    const seq = JSON.parse(require('fs').readFileSync(opt('seq'), 'utf8'));
    for (const q of seq) { if (q.js) { const r = await page.evaluate('(()=>{' + q.js + '})()'); if (r !== undefined && r !== true) console.log(q.out, '→', JSON.stringify(r)); } await sleep(q.wait || 1200); await page.screenshot({ path: q.out }); }
  } else await page.screenshot({ path: args[0] });
  console.log(errs.length ? errs.join('\n') : 'sin errores de consola');
  await browser.close();
})();
