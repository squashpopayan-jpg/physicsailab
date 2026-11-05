/* Prueba de extremo a extremo del botón Cortocircuito en la simulación 12.3 */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1320, height: 900 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/') + '#union-pn');
  await sleep(3000);
  const sim = await p.$('.sim[data-sim="c12-temperatura"]');
  await sim.evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await sleep(1500);
  const vd = () => p.evaluate(() => { const rows = [...document.querySelectorAll('.sim[data-sim="c12-temperatura"] *')].filter((e) => e.children.length === 0 && /Tensión del diodo/.test(e.parentElement.textContent)); const t = document.querySelector('.sim[data-sim="c12-temperatura"]').innerText; const m = t.match(/Tensión del diodo V_D\s*([^\n]*)/); return m && m[1]; });
  console.log('V_D inicial:', await vd());
  await p.evaluate(() => [...document.querySelectorAll('.sim[data-sim="c12-temperatura"] button')].find((x) => /Cortocircuito/.test(x.textContent)).click());
  await sleep(500);
  const box = await sim.boundingBox();
  console.log('caja', box.x, box.y, box.width);
  const click = async (x, y) => { await p.mouse.click(box.x + x, box.y + y); await sleep(400); };
  await click(321, 284);            /* terminal superior del diodo */
  console.log('hint 2:', await p.evaluate(() => (document.querySelector('.tl-toolhint') || {}).textContent));
  await click(321, 358);            /* terminal inferior del diodo */
  await sleep(2500);
  console.log('hint tras unir:', await p.evaluate(() => { const h = document.querySelector('.tl-toolhint'); return h && !h.hidden; }));
  console.log('V_D con cortocircuito:', await vd());
  await sim.screenshot({ path: path.resolve(__dirname, '../shots/cc2.png') });
  await p.evaluate(() => [...document.querySelectorAll('.sim[data-sim="c12-temperatura"] button')].find((x) => /Reparar/.test(x.textContent)).click());
  await sleep(2500);
  console.log('V_D tras reparar:', await vd());
  console.log('errores:', JSON.stringify(errs));
  await b.close();
})();
