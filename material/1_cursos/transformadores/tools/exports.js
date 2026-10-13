const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../laboratorio/tools/node_modules/puppeteer-core'));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [f, w, h, full] of [['export0.html', 1280, 800, false], ['export1.html', 1100, 900, true]]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///' + path.resolve(__dirname, '../shots', f).split(path.sep).join('/')); await new Promise(r => setTimeout(r, 800));
    if (f === 'export0.html') { for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight'); await new Promise(r => setTimeout(r, 300)); }
    await p.screenshot({ path: path.resolve(__dirname, '../shots', f.replace('.html', '.png')), fullPage: full });
    console.log(f, errs.length ? errs : 'ok', await p.title());
  }
  await b.close();
})();
