/* Revisión visual y de errores con Chrome sin interfaz (DevTools Protocol, sin dependencias).
   Uso: node tests/captura.js [--out DIR] [--sims] [--dark] [--w 1300] id1 id2 ...
   Para cada capítulo: errores de consola, simulaciones con error, macros de MathJax sin definir
   (texto rojo), captura de la página completa (JPEG) y, con --sims, una captura PNG por simulación. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const opt = { out: path.join(os.tmpdir(), 'cc-capturas'), sims: false, dark: false, w: 1300, wait: 2500 };
const ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') opt.out = args[++i];
  else if (a === '--sims') opt.sims = true;
  else if (a === '--dark') opt.dark = true;
  else if (a === '--w') opt.w = +args[++i];
  else if (a === '--wait') opt.wait = +args[++i];
  else if (a === '--js') opt.js = args[++i];
  else ids.push(a);
}
fs.mkdirSync(opt.out, { recursive: true });
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const port = 9300 + Math.floor(Math.random() * 400);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-prof-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', `--window-size=${opt.w},1000`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch (e) { /* esperando */ }
    await sleep(250);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let seq = 0;
  const pend = new Map();
  const logs = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text));
    else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.type.toUpperCase() + ' ' + m.params.args.map((a) => a.value || a.description || '').join(' '));
  });
  const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : undefined; };
  await send('Page.enable'); await send('Runtime.enable');
  if (opt.dark) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: opt.w, height: 1000, deviceScaleFactor: 1, mobile: opt.w < 700 });
  const url = 'file:///' + path.join(__dirname, '..', 'dist', 'index.html').replace(/\\/g, '/');
  await send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) { if (await ev('!!(window.__mjReady && window.CC && CC.app && CC.app.chapters.length)')) break; await sleep(250); }
  const report = [];
  for (const id of ids.length ? ids : ['inicio']) {
    logs.length = 0;
    await ev(`location.hash = '${id}'; window.scrollTo(0,0); true`);
    await sleep(600);
    if (opt.js) await ev(opt.js);
    const H = await ev('Math.min(document.documentElement.scrollHeight, 30000)');
    await send('Emulation.setDeviceMetricsOverride', { width: opt.w, height: H, deviceScaleFactor: 1, mobile: opt.w < 700 });
    await sleep(opt.wait);
    const info = await ev(`(async () => {
      if (window.MathJax && MathJax.startup) await MathJax.startup.promise;
      await new Promise(r => setTimeout(r, 300));
      const art = document.querySelector('#cap-${id}');
      const sims = art ? Array.from(art.querySelectorAll('.sim')) : [];
      return {
        sims: sims.length,
        simErr: sims.filter(s => s.querySelector('.sim-error')).map(s => s.dataset.sim + ': ' + s.querySelector('.sim-error').textContent),
        red: art ? Array.from(art.querySelectorAll('g[data-mml-node="mtext"][fill="red"], mjx-merror, [data-mjx-error]')).map(e => e.textContent || e.getAttribute('data-mjx-error')).slice(0, 20) : [],
        mathPending: art ? art.innerHTML.split('\\\\(').length - 1 : 0,
        height: document.documentElement.scrollHeight,
        rects: sims.map(s => { const r = s.getBoundingClientRect(); return [s.dataset.sim, r.x, r.y + window.scrollY, r.width, r.height]; })
      };
    })()`);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true });
    fs.writeFileSync(path.join(opt.out, `${id}.jpg`), Buffer.from(shot.result.data, 'base64'));
    if (opt.sims && info && info.rects) {
      for (let q = 0; q < info.rects.length; q++) {
        const [name, x, y, w, h] = await ev(`(() => { const s = document.querySelectorAll('#cap-${id} .sim')[${q}]; const r = s.getBoundingClientRect(); return [s.dataset.sim, r.x, r.y + window.scrollY, r.width, r.height]; })()`);
        const s = await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: 1 }, captureBeyondViewport: true });
        fs.writeFileSync(path.join(opt.out, `${id}--${name}.png`), Buffer.from(s.result.data, 'base64'));
      }
    }
    report.push({ id, ...info, rects: undefined, logs: logs.slice() });
    console.log(`[${id}] sims=${info && info.sims} errores=${info && info.simErr.length} rojo=${info && info.red.length} sinTipografiar=${info && info.mathPending} alto=${info && info.height} consola=${logs.length}`);
    if (info && info.simErr.length) console.log('   ' + info.simErr.join('\n   '));
    if (info && info.red.length) console.log('   rojo: ' + info.red.join(' | '));
    if (logs.length) console.log('   ' + logs.slice(0, 8).join('\n   '));
    await send('Emulation.setDeviceMetricsOverride', { width: opt.w, height: 1000, deviceScaleFactor: 1, mobile: opt.w < 700 });
  }
  fs.writeFileSync(path.join(opt.out, 'informe.json'), JSON.stringify(report, null, 1));
  ws.close();
  proc.kill();
  setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* */ } process.exit(0); }, 400);
})().catch((e) => { console.error(e); proc.kill(); process.exit(1); });
