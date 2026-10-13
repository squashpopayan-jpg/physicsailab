/* Prueba de interacción: exportaciones, importación por código, editor y simulador.
   node tools/test_ui.js <carpeta-de-descargas> */
const puppeteer = require('C:/Users/User/Documents/Claude/ConCode/laboratorio/tools/node_modules/puppeteer-core');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(process.argv[2] || 'tests/descargas');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  const cdp = await page.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });
  await page.goto('http://127.0.0.1:8793/#simulador', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  const res = {};
  res.code = await page.evaluate(async () => {
    const rt = MS.Routines.byId.rotacion3;
    const code = await MS.Export.encode(MS.Export.clean(rt));
    const back = await MS.Export.importText(code);
    return { len: code.length, prefix: code.slice(0, 5), ok: back.length === 1 && back[0].secuencia.length === rt.secuencia.length && back[0].jugadores.length === 3 };
  });
  res.open = await page.evaluate(() => { const bad = []; for (const r of MS.Routines.LIB) { try { MS.Sim.open(r, { key: 'lib:' + r.id }); if (!MS.Sim.S.tl.shots.length) bad.push(r.id); } catch (e) { bad.push(r.id + ': ' + e.message); } } return bad; });
  for (const k of ['json', 'png', 'pdf']) {
    await page.evaluate((k) => MS.Export.run(k, MS.Routines.byId.boastDrive), k);
    await new Promise((r) => setTimeout(r, k === 'pdf' ? 5000 : 1500));
  }
  res.video = await page.evaluate(async () => {
    const rt = MS.Routines.byId.ghost6; const tl = MS.Compile.compile(rt); tl.duration = 2.5;
    const t0 = performance.now(); await MS.Export.run('video', rt, tl); return Math.round(performance.now() - t0);
  });
  await new Promise((r) => setTimeout(r, 2500));
  res.editor = await page.evaluate(() => {
    MS.App.go('editor');
    document.getElementById('edNew').click();
    document.getElementById('edAddP').click();
    document.getElementById('edAddS').click();
    document.getElementById('edSave').click();
    return { mine: MS.Editor.mine().length, steps: MS.Editor.E.rt.secuencia.length, players: MS.Editor.E.rt.jugadores.length };
  });
  await new Promise((r) => setTimeout(r, 800));
  res.files = fs.readdirSync(OUT).filter((f) => f.startsWith('manu-squash')).map((f) => f + ' ' + fs.statSync(path.join(OUT, f)).size);
  console.log(JSON.stringify({ res, errs }, null, 1));
  await browser.close();
})();
