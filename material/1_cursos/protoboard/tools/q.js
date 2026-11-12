/* Ejecuta código en una simulación: node tools/q.js <capitulo> <simulacion> "<js con lab>" [--shot ruta.png] [--canvas] */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: +opt('width', 1320), height: +opt('height', 900), deviceScaleFactor: +opt('dpr', 1) });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[consola]', m.text()); else if (m.type() === 'log') console.log('[log]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.stack || e.message));
  await page.goto(PAGE + '#' + args[0], { waitUntil: 'load' });
  await sleep(2500);
  const el = (await page.$$(`.sim[data-sim="${args[1]}"]`))[+opt('idx', 0)];
  if (!el) { console.log('No existe la simulación'); await browser.close(); return; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await sleep(1200);
  const code = args[2] && !args[2].startsWith('--') ? args[2] : 'return 1';
  const res = await el.evaluate(async (e, code) => { const lab = e.__lab; const f = new Function('lab', 'EM', 'return (async()=>{ ' + code + ' })()'); return JSON.stringify(await f(lab, window.EM)); }, code);
  console.log(res);
  const shot = opt('shot', null);
  if (shot) { await sleep(+opt('wait', 600)); const t = args.includes('--canvas') ? ((await el.$('.sim-canvas')) || el) : el; await t.screenshot({ path: shot }); }
  await browser.close();
})();
