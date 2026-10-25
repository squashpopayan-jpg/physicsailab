/* Captura con Chrome sin ventana.
   node tools/captura.js <archivo.svg|html> <salida.png> [ancho] [alto] [--dark] [--full] [--mobile]
   Usa puppeteer-core (de ../laboratorio/tools si no está instalado aquí). */
const path = require('path');
let puppeteer;
try { puppeteer = require('puppeteer-core'); } catch (e) {
  puppeteer = require(path.resolve(__dirname, '../../laboratorio/tools/node_modules/puppeteer-core'));
}
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const flag = (k) => args.includes('--' + k);
const pos = args.filter((a) => !a.startsWith('--'));
const [entrada, salida] = pos;
const ancho = +(pos[2] || 1680), alto = +(pos[3] || 1060);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  if (flag('mobile')) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
  if (flag('dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const url = 'file:///' + path.resolve(entrada).replace(/\\/g, '/') + (args.find((a) => a.startsWith('#')) || '');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, +(args.find((a) => a.startsWith('--wait='))?.slice(7) || 600)));
  const js = args.find((a) => a.startsWith('--js='));
  if (js) { const r = await page.evaluate(js.slice(5)); if (r !== undefined) console.log(JSON.stringify(r)); await new Promise((r) => setTimeout(r, 500)); }
  await page.screenshot({ path: salida, fullPage: flag('full') });
  if (errs.length) console.log(errs.join('\n'));
  await browser.close();
})();
