/* Etapas del barrido sobre UNA simulación, reportando en cuál aparece el error.
   node tools/stages.js <capitulo> <sim> */
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
  const stage = async (name, fn, arg) => {
    errs.length = 0;
    await pg.evaluate(fn, sim, arg);
    await sleep(600);
    const se = await pg.$$eval('.sim[data-sim="' + sim + '"] .sim-error', (e) => e.map((x) => x.textContent));
    console.log(name, errs.length || se.length ? JSON.stringify({ errs, se }) : 'ok');
  };
  const root = (s) => document.querySelector('.sim[data-sim="' + s + '"]');
  const ctl = await pg.evaluate((s) => [...document.querySelector('.sim[data-sim="' + s + '"]').querySelectorAll('input,select')].map((c) => c.type + ':' + c.id), sim);
  console.log('controles', JSON.stringify(ctl));
  for (let k = 0; k < ctl.length; k++) {
    await stage('control ' + ctl[k], (s, k) => {
      const c = document.querySelector('.sim[data-sim="' + s + '"]').querySelectorAll('input,select')[k];
      if (c.type === 'checkbox') { c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles: true })); }
      else if (c.type === 'range') { for (const f of [1, 0, 0.5]) { c.value = +c.min + f * (+c.max - +c.min); c.dispatchEvent(new Event('input', { bubbles: true })); } }
      else if (c.tagName === 'SELECT') { for (let i = 0; i < c.options.length; i++) { c.selectedIndex = i; c.dispatchEvent(new Event('change', { bubbles: true })); } }
    }, k);
  }
  await stage('reset', (s) => [...document.querySelector('.sim[data-sim="' + s + '"]').querySelectorAll('button')].find((x) => /Reiniciar/.test(x.textContent))?.click());
  await b.close();
})();
