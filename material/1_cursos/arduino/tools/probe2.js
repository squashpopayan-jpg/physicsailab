/* Como probe.js pero con pasos: controles, botones, esperas, y devuelve salidas + puerto serie.
   node tools/probe2.js <capitulo> <sim> '[["set","L",1],["btn","Soltar"],["wait",8000],["out"]]' */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const [chap, sim, json] = process.argv.slice(2);
const steps = JSON.parse(json || '[["out"]]');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1320, height: 900 });
  pg.on('pageerror', (e) => console.log('pageerror', e.message));
  pg.on('console', (m) => { if (m.type() === 'error') console.log('console.error', m.text()); });
  await pg.goto('file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/') + '#' + chap, { waitUntil: 'load' });
  await sleep(2500);
  await pg.evaluate((sim) => document.querySelector('.sim[data-sim="' + sim + '"]').scrollIntoView(), sim);
  await sleep(700);
  for (const st of steps) {
    if (st[0] === 'wait') await sleep(st[1]);
    else if (st[0] === 'set') {
      await pg.evaluate((sim, id, v) => {
        const i = document.getElementById(sim + '-' + id.replace(/[^A-Za-z0-9_-]/g, '_'));
        if (i) { if (i.type === 'checkbox') { i.checked = !!v; i.dispatchEvent(new Event('change', { bubbles: true })); return; } if (i.type === 'range') i.value = i.dataset.log ? (1000 * Math.log(v / +i.dataset.lo)) / Math.log(+i.dataset.hi / +i.dataset.lo) : v; else i.value = v; i.dispatchEvent(new Event(i.type === 'range' ? 'input' : 'change', { bubbles: true })); return; }
        const bt = document.getElementById((sim + '-' + id + '-' + v).replace(/[^A-Za-z0-9_-]/g, '_')); if (bt) bt.click(); else console.error('sin control ' + id);
      }, sim, st[1], st[2]);
    } else if (st[0] === 'btn') {
      await pg.evaluate((sim, txt) => { const el = document.querySelector('.sim[data-sim="' + sim + '"]'); [...el.querySelectorAll('button')].find((x) => x.textContent.includes(txt))?.click(); }, sim, st[1]);
    } else if (st[0] === 'speed') {
      await pg.evaluate((sim, txt) => { const el = document.querySelector('.sim[data-sim="' + sim + '"]'); [...el.querySelectorAll('button')].find((x) => x.textContent.trim() === txt)?.click(); }, sim, st[1]);
    } else if (st[0] === 'web') {
      console.log('WEB:', await pg.evaluate((sim) => { const el = document.querySelector('.sim[data-sim="' + sim + '"]'); const w = el.querySelector('.lab-web-view'); return (el.querySelector('.lab-baud') ? [...el.querySelectorAll('.lab-baud')].map((x) => x.textContent).join(' | ') : '') + ' :: ' + (w ? w.textContent : ''); }, sim));
    } else if (st[0] === 'out') {
      const r = await pg.evaluate((sim, n) => {
        const el = document.querySelector('.sim[data-sim="' + sim + '"]');
        const dts = [...el.querySelectorAll('.sim-out dt')].map((e) => e.textContent), dds = [...el.querySelectorAll('.sim-out dd')].map((e) => e.textContent);
        const ser = el.querySelector('.lab-serial-out');
        return dts.map((t, i) => t + ' = ' + dds[i]).join('\n  ') + '\n  --serie--\n' + (ser ? ser.textContent.split('\n').slice(-n).join('\n') : '');
      }, sim, +st[1] || 8);
      console.log(r);
    }
  }
  if (process.env.SHOT) { const el = await pg.$('.sim[data-sim="' + sim + '"]'); await el.screenshot({ path: process.env.SHOT }); }
  await b.close();
})();
