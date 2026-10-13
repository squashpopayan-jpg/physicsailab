/* Corre la práctica de prueba y captura cada diapositiva: node tools/slides.js */
const path = require('path'), fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../../laboratorio/tools/node_modules/puppeteer-core'));
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/Transformadores_Laboratorio.html').replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(PAGE + '#banco'); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(1200);
  await page.evaluate(fs.readFileSync(path.join(__dirname, '../shots/t2.js'), 'utf8'));
  await page.evaluate(fs.readFileSync(path.join(__dirname, '../shots/t3.js'), 'utf8'));
  await sleep(800);
  const n = await page.evaluate(() => +document.getElementById('slideNum').innerText.split('/')[1]);
  for (let i = 0; i < n; i++) {
    const el = await page.$('#stageBox'); await el.screenshot({ path: path.join(__dirname, `../shots/slide${String(i + 1).padStart(2, '0')}.png`) });
    await page.evaluate(() => document.getElementById('nextSlide').click()); await sleep(250);
  }
  await page.screenshot({ path: path.join(__dirname, '../shots/expo-page.png'), fullPage: true });
  /* exportaciones en el archivo local: capturar el HTML generado */
  const rep = await page.evaluate(() => { const a = []; const orig = URL.createObjectURL; URL.createObjectURL = (b) => { a.push(b); return orig(b); }; document.getElementById('exportSlides').click(); location.hash = 'cuaderno'; return new Promise(r => setTimeout(async () => { document.getElementById('exportReport').click(); setTimeout(async () => r(await Promise.all(a.map(b => b.text()))), 300); }, 500)); });
  rep.forEach((t, i) => fs.writeFileSync(path.join(__dirname, `../shots/export${i}.html`), t));
  console.log('diapositivas:', n, '· exportados:', rep.length, '·', errs.length ? errs.join(' | ') : 'sin errores');
  await browser.close();
})();
