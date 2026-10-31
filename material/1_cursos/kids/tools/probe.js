/* Ejecuta un archivo JS (cuerpo de función async) dentro de la página de un capítulo, con todas las simulaciones montadas.
   node tools/probe.js <capítulo> <archivo.js>   → imprime lo que el archivo devuelva (JSON) */
const puppeteer = require('../../laboratorio/tools/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
(async () => {
  const [hash, file] = process.argv.slice(2);
  const code = fs.readFileSync(file, 'utf8');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto(PAGE + '#' + hash, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 700));
  const out = await page.evaluate(async (c) => {
    document.querySelectorAll('.sim[data-sim]').forEach((h) => FK.mountSim(h));
    await new Promise((r) => setTimeout(r, 150));
    const sim = (n) => [...FK.activeSims].find((x) => x.name === n);
    return await new Function('FK', 'sim', 'return (async()=>{' + c + '})()')(FK, sim);
  }, code);
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
