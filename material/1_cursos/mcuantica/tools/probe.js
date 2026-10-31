/* Lee las lecturas numéricas de una simulación tras fijar sus controles.
   node tools/probe.js <capitulo> <sim> '[{"id":valor,...}, {...}]'
   Cada objeto del arreglo es un escenario: se fijan sliders/selects/casillas por id y se imprimen las lecturas (dd). */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const [chap, sim, json] = process.argv.slice(2);
const scenarios = JSON.parse(json || '[{}]');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1320, height: 900 });
  pg.on('pageerror', (e) => console.log('pageerror', e.message));
  await pg.goto('file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/') + '#' + chap, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 2500));
  for (const sc of scenarios) {
    const res = await pg.evaluate(async (sim, sc) => {
      const el = document.querySelector('.sim[data-sim="' + sim + '"]');
      el.scrollIntoView();
      await new Promise((r) => setTimeout(r, 700));
      for (const [id, v] of Object.entries(sc)) {
        const i = document.getElementById(sim + '-' + id.replace(/[^A-Za-z0-9_-]/g, '_'));
        if (i) {
          if (i.type === 'checkbox') { i.checked = !!v; i.dispatchEvent(new Event('change', { bubbles: true })); }
          else if (i.type === 'range') { i.value = i.dataset.log ? (1000 * Math.log(v / +i.dataset.lo)) / Math.log(+i.dataset.hi / +i.dataset.lo) : v; i.dispatchEvent(new Event('input', { bubbles: true })); }
          else { i.value = v; i.dispatchEvent(new Event('change', { bubbles: true })); }
        } else { const bt = document.getElementById(sim + '-' + id + '-' + v); if (bt) bt.click(); else if (id.startsWith('btn:')) { [...el.querySelectorAll('button')].find((x) => x.textContent.includes(id.slice(4)))?.click(); } }
        await new Promise((r) => setTimeout(r, 120));
      }
      await new Promise((r) => setTimeout(r, 500));
      const dts = [...el.querySelectorAll('.sim-out dt')].map((e) => e.textContent), dds = [...el.querySelectorAll('.sim-out dd')].map((e) => e.textContent);
      return dts.map((t, i) => t + ' = ' + dds[i]).join('\n    ');
    }, sim, sc);
    console.log(JSON.stringify(sc) + '\n    ' + res);
  }
  await b.close();
})();
