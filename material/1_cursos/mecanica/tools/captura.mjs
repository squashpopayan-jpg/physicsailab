// Captura de simulaciones con Chrome sin ventana (DevTools Protocol).
// Uso: node cdp.mjs <capítulo> <carpeta> <sim:situación:segundos[:js]> ... [--w=1280] [--h=900] [--dark] [--outs]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v]; }));
const [chapter, outDir, ...specs] = args.filter((a) => !a.startsWith('--'));
const W = +(flags.w || 1280), H = +(flags.h || 900), port = 9300 + Math.floor(Math.random() * 500);
mkdirSync(outDir, { recursive: true });
const prof = join(tmpdir(), 'cdp-prof-' + port);
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${Math.max(W, 800)},${H}`, 'about:blank'
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver = null;
for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); } }
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pend = new Map();
const logs = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.type + ': ' + m.params.args.map((a) => a.value || a.description).join(' '));
  else if (m.method === 'Runtime.exceptionThrown') logs.push('excepción: ' + m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJS = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: flags.dark ? 'dark' : 'light' }] });
await send('Page.navigate', { url: `http://localhost:8781/#${chapter}` });
await sleep(4500);
for (const spec of specs) {
  const [sim, preset, secs, js] = spec.split(':');
  const info = await evalJS(`(async () => {
    const s = [...MC.allSims].find((q) => q.name === ${JSON.stringify(sim)});
    if (!s) return { err: 'no existe ${sim}' };
    s.host.scrollIntoView({ block: 'start' });
    await new Promise((r) => setTimeout(r, 400));
    ${preset && preset !== '-' ? `s.applyPreset(${JSON.stringify(preset)});` : ''}
    ${js ? decodeURIComponent(js) : ''}
    await new Promise((r) => setTimeout(r, 300));
    if (${+secs || 0} > 0) { s.play(); await new Promise((r) => setTimeout(r, ${(+secs || 0) * 1000})); s.pause(); }
    s._draw();
    await new Promise((r) => setTimeout(r, 300));
    const b = s.host.getBoundingClientRect();
    const outs = Object.fromEntries(Object.entries(s._outs).map(([k, o]) => [k, o.dd.textContent]));
    return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height, dead: !!s._dead, outs };
  })()`);
  if (info.err) { console.log(spec, info.err); continue; }
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: info.x, y: info.y, width: info.w, height: info.h, scale: 1 } });
  const name = `${sim}-${preset || 'x'}${flags.dark ? '-dark' : ''}${W < 600 ? '-m' : ''}.png`;
  writeFileSync(join(outDir, name), Buffer.from(shot.result.data, 'base64'));
  console.log(name, info.dead ? 'MUERTA' : 'ok', Math.round(info.w) + 'x' + Math.round(info.h), flags.outs ? JSON.stringify(info.outs) : '');
}
if (logs.length) console.log('consola:\n' + logs.join('\n'));
ws.close();
chrome.kill();
await sleep(500);
try { rmSync(prof, { recursive: true, force: true }); } catch {}
