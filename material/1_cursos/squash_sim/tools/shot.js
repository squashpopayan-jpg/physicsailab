/* Capturas con Chrome sin ventana.
   node tools/shot.js <hash> <salida.png> [--js "código"] [--sel "#selector"] [--w 1400] [--h 900] [--dark] [--wait 1500] */
const puppeteer = require('C:/Users/User/Documents/Claude/ConCode/laboratorio/tools/node_modules/puppeteer-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const mobile = flag('mobile');
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: +opt('w', 1400), height: +opt('h', 900), deviceScaleFactor: +opt('dpr', 1) });
  if (flag('dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto('http://127.0.0.1:8793/#' + args[0], { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, +opt('wait', 1500)));
  const js = opt('js', null);
  let out = null;
  if (js) { out = await page.evaluate(js); await new Promise((r) => setTimeout(r, +opt('wait2', 700))); }
  const sel = opt('sel', null);
  if (sel) { const el = await page.$(sel); if (el) { await el.evaluate((e) => e.scrollIntoView({ block: 'start' })); await new Promise((r) => setTimeout(r, 300)); await el.screenshot({ path: args[1] }); } else console.log('No existe', sel); }
  else await page.screenshot({ path: args[1], fullPage: flag('full') });
  console.log(JSON.stringify({ out, errors: errs }, null, 1));
  await browser.close();
})();
