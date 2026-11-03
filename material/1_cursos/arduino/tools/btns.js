/* Pulsa uno a uno los botones de una simulación y reporta cuál produce error.
   node tools/btns.js <capitulo> <sim> */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const [chap, sim] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1320, height: 900 });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto('file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/') + '#' + chap, { waitUntil: 'load' });
  await sleep(2500);
  await pg.evaluate((s) => document.querySelector('.sim[data-sim="' + s + '"]').scrollIntoView(), sim);
  await sleep(800);
  const labels = await pg.evaluate((s) => [...document.querySelector('.sim[data-sim="' + s + '"]').querySelectorAll('button')].map((x) => (x.textContent || x.title || x.getAttribute('aria-label') || '?').trim()), sim);
  console.log('botones:', JSON.stringify(labels));
  for (let k = 0; k < labels.length; k++) {
    errs.length = 0;
    await pg.evaluate((s, k) => document.querySelector('.sim[data-sim="' + s + '"]').querySelectorAll('button')[k].click(), sim, k);
    await sleep(700);
    const se = await pg.$$eval('.sim[data-sim="' + sim + '"] .sim-error', (e) => e.map((x) => x.textContent));
    console.log(k, JSON.stringify(labels[k]), errs.length || se.length ? JSON.stringify({ errs, se }) : 'ok');
  }
  await b.close();
})();
