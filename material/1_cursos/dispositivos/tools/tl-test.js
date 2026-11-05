/* Prueba interactiva del Taller con ratón real: node tools/tl-test.js */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1320, height: 1000, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(PAGE + '#prueba', { waitUntil: 'load' });
  await sleep(2500);
  const el = (await page.$$('.sim[data-sim="t-libre"]'))[0];
  await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await sleep(1200);
  const btns = await el.$$('.tl-b');
  for (const b of btns) { const t = await b.evaluate((x) => x.textContent); if (/Editar/.test(t)) { await b.click(); break; } }
  await sleep(400);
  const box = await (await el.$('.sim-canvas')).boundingBox();
  const info = await page.evaluate(() => { const T = EM.tallers.find((t) => t.sim.name === 't-libre'); return { s: T.view.s, ox: T.view.ox, oy: T.view.oy, parts: T.net.doc.parts.length }; });
  console.log('vista', info);
  const WW = async (x, y) => page.evaluate((x, y) => { const T = EM.tallers.find((t) => t.sim.name === 't-libre'); const r = T.cv.el.getBoundingClientRect(); return [r.left + T.view.ox + x * T.view.s, r.top + T.view.oy + y * T.view.s]; }, x, y);
  const chips = await el.$$('.tl-chip');
  for (const c of chips) { const t = await c.evaluate((x) => x.textContent); if (t === 'Resistor') { await c.click(); break; } }
  await el.evaluate((e) => e.scrollIntoView({ block: 'start' })); let p1 = await WW(10, 4); await page.mouse.click(p1[0], p1[1]);
  await sleep(200);
  const tabs = await el.$$('.tl-ptab');
  for (const t of tabs) { const tx = await t.evaluate((x) => x.textContent); if (tx === 'Diodos') { await t.click(); break; } }
  const chips2 = await el.$$('.tl-chip');
  for (const c of chips2) { const t = await c.evaluate((x) => x.textContent); if (t === 'LED') { await c.click(); break; } }
  p1 = await WW(16, 8); await page.mouse.click(p1[0], p1[1]);
  await page.keyboard.press('Escape');
  await sleep(200);
  const drag = async (a, b) => { const A = await WW(...a), B = await WW(...b); await page.mouse.move(A[0], A[1]); await page.mouse.down(); await page.mouse.move((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, { steps: 4 }); await page.mouse.move(B[0], B[1], { steps: 4 }); await page.mouse.up(); await sleep(100); };
  const res = await page.evaluate(() => { const T = EM.tallers.find((t) => t.sim.name === 't-libre'); return T.net.doc.parts.map((p) => [p.id, p.t, p.x, p.y, p.rot]); });
  console.log('partes', JSON.stringify(res));
  await drag([4, 6], [8, 4]);
  await drag([12, 4], [16, 6]);
  await drag([16, 10], [4, 10]);
  await sleep(1500);
  const out = await page.evaluate(() => { const T = EM.tallers.find((t) => t.sim.name === 't-libre'); T.net.rebuild(); T.net.solveOP(); const D = T.net.part('D1'); return { wires: T.net.doc.wires.length, i: T.net.iPart(D), vd: T.net.vDiff(D, 0, 1), pts: T.net.doc.wires.map((w) => JSON.stringify(w.pts)) }; });
  console.log('resultado', JSON.stringify(out));
  await el.screenshot({ path: path.resolve(__dirname, '../shots/tl-edit.png') });
  console.log('errores', errs);
  await browser.close();
})();
