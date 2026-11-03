/* Captura de la portada y comprueba el índice de partes. node tools/portada.js out.png */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1320, height: 1500 });
  pg.on('pageerror', (e) => console.log('pageerror', e.message));
  await pg.goto('file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/') + '#inicio', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 3500));
  const info = await pg.evaluate(() => ({ parts: document.querySelectorAll('.home-parts > *').length, count: (document.querySelector('.home-count') || {}).textContent, title: document.title }));
  console.log(JSON.stringify(info));
  await pg.screenshot({ path: process.argv[2] || 'shots/portada.png' });
  await b.close();
})();
