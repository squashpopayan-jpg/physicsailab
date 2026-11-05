/* Muestra la traza completa de los errores de una simulación: node tools/err.js <capitulo> */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1320, height: 900 });
  page.on('console', async (m) => {
    if (m.type() !== 'error') return;
    const parts = [];
    for (const a of m.args()) { try { parts.push(await a.evaluate((x) => (x && x.stack) ? x.stack : String(x))); } catch (e) { parts.push('?'); } }
    console.log('[consola]', parts.join(' | ').split('\n').slice(0, 6).join('\n'));
  });
  page.on('pageerror', (e) => console.log('[pageerror]', e.stack || e.message));
  await page.goto(PAGE + '#' + (process.argv[2] || 'inicio'), { waitUntil: 'load' });
  await sleep(2000);
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } });
  await sleep(1500);
  await browser.close();
})();
