/* Maneja una simulación con el ratón real: node tools/drive.js <capitulo> <simulacion> <guion.js>
   El guion exporta async ({ drag, click, hole, pos, ev, shot, sleep, page }) => {…}; coordenadas del mundo en mm. */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const [cap, sim, script] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1320, height: 1000, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[consola]', m.text()); else if (m.type() === 'log') console.log('[log]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.stack || e.message));
  await page.goto(PAGE + '#' + cap, { waitUntil: 'load' });
  await sleep(2500);
  const el = (await page.$$(`.sim[data-sim="${sim}"]`))[0];
  await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await sleep(1000);
  const cv = await el.$('canvas.bl-main, .bl-main canvas');
  const view = async () => el.evaluate((e) => { const l = e.__lab; const r = l.cv.el.getBoundingClientRect(); return { s: l.view.s, ox: l.view.ox, oy: l.view.oy, l: r.left, t: r.top }; });
  const pos = async (x, y) => { const v = await view(); return [v.l + v.ox + x * v.s, v.t + v.oy + y * v.s]; };
  const api = {
    page, sleep,
    pos,
    hole: async (h) => el.evaluate((e, h) => { const l = e.__lab; return EM.bb.holeWorld(l.bench.boards, h.includes(':') ? h : 'bb:' + h); }, h),
    drag: async (x0, y0, x1, y1, steps = 12) => {
      const [a, b] = await pos(x0, y0); const [c, d] = await pos(x1, y1);
      await page.mouse.move(a, b); await page.mouse.down();
      for (let i = 1; i <= steps; i++) { await page.mouse.move(a + (c - a) * i / steps, b + (d - b) * i / steps); await sleep(8); }
      await page.mouse.up(); await sleep(60);
    },
    click: async (x, y) => { const [a, b] = await pos(x, y); await page.mouse.click(a, b); await sleep(60); },
    ev: async (code) => el.evaluate(async (e, code) => { const lab = e.__lab; const f = new Function('lab', 'EM', 'return (async()=>{ ' + code + ' })()'); return JSON.stringify(await f(lab, window.EM)); }, code),
    shot: async (file, canvasOnly) => { const t = canvasOnly ? ((await el.$('.sim-canvas')) || el) : el; await t.screenshot({ path: file }); }
  };
  const fn = require(path.resolve(script));
  await fn(api);
  await browser.close();
})();
