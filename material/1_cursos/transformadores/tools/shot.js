/* Capturas y pruebas con Chrome sin ventana.
   node tools/shot.js <hash> <salida.png> [--js "código"] [--mobile] [--dark] [--wait ms] [--full] [--clip selector] */
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../laboratorio/tools/node_modules/puppeteer-core'));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/Transformadores_Laboratorio.html').replace(/\\/g, '/');
const args = process.argv.slice(2);
const flag = (k) => args.includes('--' + k);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport(flag('mobile') ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: +opt('width', 1440), height: +opt('height', 960), deviceScaleFactor: 1 });
  if (flag('dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); else if (m.type() === 'log') console.log('log:', m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(PAGE + '#' + args[0], { waitUntil: 'load' });
  if (!flag('keep')) await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  if (!flag('keep')) await page.reload({ waitUntil: 'load' });
  await sleep(+opt('wait', 1500));
  const js = opt('jsfile', null) ? require('fs').readFileSync(opt('jsfile'), 'utf8') : opt('js', null);
  if (js) { const r = await page.evaluate(js); if (r !== undefined) console.log('resultado:', typeof r === 'string' ? r : JSON.stringify(r, null, 1)); await sleep(+opt('wait2', 1500)); }
  const clip = opt('clip', null);
  if (clip) { const el = await page.$(clip); await el.screenshot({ path: args[1] }); }
  else await page.screenshot({ path: args[1], fullPage: flag('full') });
  console.log(errs.length ? errs.join('\n') : 'sin errores de consola');
  await browser.close();
})();
