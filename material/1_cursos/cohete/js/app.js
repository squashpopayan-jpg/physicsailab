// Apogeo: interfaz, cámara, demostración, grabación, resultados y revisión cuadro a cuadro.

import * as G from './geom.js';
import { Orientation, screenAngle } from './orient.js';
import { Pipeline } from './pipeline.js';
import { drawHUD } from './hud.js';
import { computeHeights, analyze, toCSV } from './analysis.js';
import { drawChart, FONT } from './chart.js';
import { readBarcode } from './barcode.js';
import { Recorder, pickMime, saveBlob, shareBlob, stamp } from './recorder.js';
import { loadSettings, saveSettings, loadLast, saveLast } from './store.js';
import { SimScene } from './scene.js';
import { PRESETS } from './physics.js';

const $ = (id) => document.getElementById(id);
const view = $('view');
const vctx = view.getContext('2d');
const ana = document.createElement('canvas');
const actx = ana.getContext('2d', { willReadFrequently: true });
const camVideo = $('cam');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (x, d = 1) => (x == null || !isFinite(x) ? '—' : x.toFixed(d));

// En la demostración, la distancia y el lente son los de la escena simulada y no tocan los ajustes reales.
const DEMO_KEYS = ['d', 'sigD', 'fNorm', 'lensCalibrated'];

const S = {
  set: loadSettings(),
  demoCfg: {},
  source: null, // 'camera' | 'demo'
  stream: null,
  track: null,
  sim: null,
  W: 0,
  H: 0,
  orient: new Orientation(),
  pipe: null,
  pending: null, // 'base' | 'lens1' | 'lens2'
  lensA: null,
  lensPairs: [],
  recState: 'off', // 'off' | 'countdown' | 'on' | 'ending'
  recorder: null,
  recT0: 0,
  frames: [],
  autoStopAt: null,
  endRes: null,
  endChart: null,
  live: null,
  liveTick: 0,
  lastView: null,
  lastRs: null,
  lastT: 0,
  session: null,
  camStartedAt: 0,
  demoNeedsBase: false,
  rvIdx: null,
  rvBaseMode: false,
};

const cfg = () => (S.source === 'demo' ? { ...S.set, ...S.demoCfg } : S.set);
function setCfg(k, v) {
  if (S.source === 'demo' && DEMO_KEYS.includes(k)) S.demoCfg[k] = v;
  else { S.set[k] = v; saveSettings(S.set); }
  applyCfg();
}
function pipeCfg() {
  const c = cfg();
  return { mode: c.mode, d: c.d, sigD: c.sigD, lateralFix: c.lateralFix, fNorm: c.fNorm, sigSensorDeg: c.sigSensorDeg };
}
function applyCfg() {
  S.pipe.configure(pipeCfg());
  updateChips();
}
S.pipe = new Pipeline(pipeCfg());

/* ============================================================================================
 * Cuadros
 * ========================================================================================== */
function setupSizes(W, H) {
  S.W = W;
  S.H = H;
  view.width = W;
  view.height = H;
  const k = Math.min(1, cfg().ana / Math.max(W, H));
  ana.width = Math.max(2, Math.round(W * k));
  ana.height = Math.max(2, Math.round(H * k));
  S.pipe.setSizes(W, H, ana.width, ana.height);
}

function clockStr() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function liveParams() {
  const c = cfg();
  return { d: c.d, sigD: c.sigD, base: S.pipe.base, lateralFix: c.lateralFix, sigSensorDeg: c.sigSensorDeg, f: S.pipe.cam.f, W: S.W, H: S.H };
}
function livePoints() {
  const p = S.pipe;
  if (p.tLaunch == null) return [];
  return p.samples.map((s) => ({ ...s, t: s.t - p.tLaunch }));
}

function updateLive() {
  const p = S.pipe;
  if (!p.apoFlag || !p.base || S.liveTick++ % 10) return;
  const pts = computeHeights(livePoints(), liveParams());
  const res = analyze(pts, liveParams());
  if (!res) return;
  let best = null, bd = Infinity;
  for (const s of p.samples) {
    const dd = Math.abs(s.t - p.tLaunch - res.tApo);
    if (dd < bd) { bd = dd; best = s; }
  }
  S.live = { res, apoSample: best };
}

/** Procesa un cuadro: medición, registro y capa de información. tMs en la base de performance.now(). */
function processFrame(src, tMs, Rdev) {
  const W = S.W, H = S.H;
  // Cuadros procesados por segundo (promedio de los últimos ~2 s).
  const nowMs = performance.now();
  if (S.lastProcMs) S.fps = 0.95 * (S.fps || 30) + 0.05 * (1000 / Math.max(1, nowMs - S.lastProcMs));
  S.lastProcMs = nowMs;
  const R = Rdev || G.eulerToR(0, 90, 0); // sin sensor: se supone el celular vertical
  const Rs = S.source === 'demo' ? R : G.screenR(R, screenAngle());
  vctx.drawImage(src, 0, 0, W, H);
  actx.drawImage(src, 0, 0, ana.width, ana.height);
  const img = actx.getImageData(0, 0, ana.width, ana.height);
  const t = tMs / 1000;
  const v = S.pipe.process({ t, img, Rs });
  S.lastView = v;
  S.lastRs = Rs;
  S.lastT = t;
  const recOn = S.recState === 'on' || S.recState === 'ending';
  let idx = null;
  if (recOn) {
    idx = S.frames.length;
    S.frames.push({ i: idx, t, Rs });
  }
  if (S.recState === 'on') {
    updateLive();
    const p = S.pipe;
    if (p.state === 'done' && S.autoStopAt == null) S.autoStopAt = t + 2;
    if (p.apoFlag && p.state === 'lost' && t - p.lastDetT > 4 && S.autoStopAt == null) S.autoStopAt = t;
    if ((S.autoStopAt != null && t >= S.autoStopAt) || t - S.recT0 > 240) stopRecording();
  }
  const c = cfg();
  const chart = S.recState === 'ending' ? null : livePoints().filter((s) => s.h != null);
  drawHUD(vctx, {
    W, H, Rs, cam: S.pipe.cam, base: S.pipe.base, d: c.d, mode: c.mode, lateralFix: c.lateralFix, label: c.label,
    clock: clockStr(), view: v, samples: S.pipe.samples, tLaunch: S.pipe.tLaunch, maxH: S.pipe.maxH, apoFlag: S.pipe.apoFlag, outTop: S.pipe.outTop,
    live: S.live, rec: recOn ? { on: true, idx, elapsed: t - S.recT0 } : null,
    end: S.recState === 'ending' ? { res: S.endRes, chart: S.endChart } : null,
    chart, showRoi: c.showRoi,
  });
}

/* ============================================================================================
 * Fuentes: cámara y demostración
 * ========================================================================================== */
async function startCamera() {
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    introWarn('El navegador solo deja usar la cámara en páginas seguras (https://). Abre la dirección https:// que muestra el PC al iniciar el servidor (ver el README) o usa la demostración.');
    return false;
  }
  stopSource();
  const c = S.set;
  const [rw, rh] = c.res.split('x').map(Number);
  const video = { width: { ideal: rw }, height: { ideal: rh }, frameRate: { ideal: 30 } };
  if (c.camId) video.deviceId = { exact: c.camId };
  else video.facingMode = { ideal: 'environment' };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video });
  } catch (e) {
    if (c.camId) { S.set.camId = ''; saveSettings(S.set); return startCamera(); }
    introWarn(e.name === 'NotAllowedError'
      ? 'El permiso de cámara está bloqueado. Toca el candado junto a la dirección, permite la cámara y vuelve a intentarlo.'
      : `No se pudo abrir la cámara (${e.message}).`);
    return false;
  }
  S.stream = stream;
  S.track = stream.getVideoTracks()[0];
  camVideo.srcObject = stream;
  await camVideo.play().catch(() => {});
  if (!camVideo.videoWidth) await new Promise((r) => camVideo.addEventListener('loadedmetadata', r, { once: true }));
  S.source = 'camera';
  S.orient.buf = [];
  await S.orient.start();
  setupSizes(camVideo.videoWidth, camVideo.videoHeight);
  applyCfg();
  try { await S.track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch { /* opcional */ }
  S.camStartedAt = performance.now();
  enterApp();
  requestWake();
  listCameras();
  camLoop();
  return true;
}

function camLoop() {
  const vid = camVideo;
  const hasRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  const next = () => (hasRVFC ? vid.requestVideoFrameCallback(tick) : requestAnimationFrame((n) => tick(n, null)));
  function tick(now, meta) {
    if (S.source !== 'camera') return;
    try {
      if (vid.videoWidth && (vid.videoWidth !== S.W || vid.videoHeight !== S.H)) setupSizes(vid.videoWidth, vid.videoHeight);
      // Instante de captura del cuadro, para pedir la orientación de ese mismo instante.
      let tc = meta && meta.captureTime;
      if (!(tc > 0) || Math.abs(tc - performance.now()) > 1500) tc = now - cfg().latencyMs;
      const R = S.orient.at(tc, cfg().mode === 'tripod' ? 250 : 0);
      processFrame(vid, tc, R);
    } catch (e) { console.error(e); }
    next();
  }
  next();
}

function startDemo() {
  stopSource();
  const ds = S.set.demo;
  S.sim = new SimScene({ preset: ds.preset, Hobs: ds.Hobs, mode: S.set.mode, wind: ds.wind, windDirDeg: ds.windDir, fNorm: 0.78 });
  S.source = 'demo';
  S.demoCfg = { d: S.sim.o.d, sigD: 0.2, fNorm: 0.78, lensCalibrated: true };
  S.orient.stop();
  S.orient.buf = [];
  setupSizes(S.sim.o.W, S.sim.o.H);
  applyCfg();
  S.demoNeedsBase = true;
  enterApp();
  demoLoop();
  toast(`Demostración: ${PRESETS[ds.preset].nombre}. La distancia (${S.sim.o.d} m) y la base ya están fijadas. Pulsa grabar.`, 5500);
}

function demoStep(now) {
  try {
    const R = S.sim.render(now / 1000);
    S.orient.push(now, S.sim.sensorR(R));
    const Rm = S.orient.at(now, cfg().mode === 'tripod' ? 250 : 0);
    if (S.demoNeedsBase) {
      const p = S.sim.padPixel(R);
      if (p) { S.pipe.setBasePixel(p.u, p.v, Rm); S.demoNeedsBase = false; updateChips(); }
    }
    processFrame(S.sim.canvas, now, Rm);
  } catch (e) { console.error(e); }
}

function demoLoop() {
  let last = 0;
  const raf = (now) => {
    if (S.source !== 'demo') return;
    if (now - last >= 1000 / 30 - 4) { last = now; demoStep(now); }
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/** Banco de pruebas: avanza la demostración a 30 cuadros/s sin requestAnimationFrame (pestaña oculta). */
async function driveDemo(seconds) {
  const ch = new MessageChannel();
  const yieldNow = () => new Promise((r) => { ch.port1.onmessage = r; ch.port2.postMessage(0); });
  const end = performance.now() + seconds * 1000;
  let next = performance.now();
  while (performance.now() < end && S.source === 'demo') {
    while (performance.now() < next) await yieldNow();
    demoStep(performance.now());
    next += 1000 / 30;
  }
}

function stopSource() {
  if (S.recState !== 'off') abortRecording();
  if (S.stream) S.stream.getTracks().forEach((t) => t.stop());
  S.stream = null;
  S.track = null;
  S.sim = null;
  S.source = null;
  S.pipe.resetFlight();
  S.pipe.base = null;
  S.live = null;
  cancelTask();
}

async function listCameras() {
  try {
    const devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    const sel = $('inCam');
    sel.innerHTML = '<option value="">Trasera principal</option>';
    devs.forEach((d, i) => {
      const o = document.createElement('option');
      o.value = d.deviceId;
      o.textContent = d.label || `Cámara ${i + 1}`;
      sel.appendChild(o);
    });
    sel.value = S.set.camId || '';
  } catch { /* sin lista */ }
}

async function requestWake() {
  try { S.wake = await navigator.wakeLock.request('screen'); } catch { /* opcional */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.source) requestWake(); });

/* ============================================================================================
 * Grabación
 * ========================================================================================== */
let audio = null;
function beep(freq, dur) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.25, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  } catch { /* sin sonido */ }
}

async function onRec() {
  if (S.recState === 'on') return stopRecording();
  if (S.recState === 'countdown') { S.recState = 'off'; hideCountdown(); updateRecBtn(); return; }
  if (S.recState !== 'off' || !S.source) return;
  if (!S.pipe.base) { toast('Primero fija la base: toca la base de la rampa en la imagen.'); startBaseTask(); return; }
  if (S.source === 'camera' && !S.orient.live) { toast('El celular no está entregando su inclinación; así no se puede calcular la altura.', 4000); return; }
  cancelTask();
  const n = Number(cfg().countdown) || 0;
  S.recState = 'countdown';
  updateRecBtn();
  for (let i = n; i > 0; i--) {
    showCountdown(i);
    beep(i <= 3 ? 880 : 660, 0.12);
    await sleep(1000);
    if (S.recState !== 'countdown') { hideCountdown(); return; }
  }
  hideCountdown();
  startRecordingNow();
}

function startRecordingNow() {
  const mime = pickMime();
  S.frames = [];
  S.live = null;
  S.liveTick = 0;
  S.autoStopAt = null;
  S.endRes = null;
  S.endChart = null;
  S.recorder = null;
  if (mime) {
    try {
      S.recorder = new Recorder(view, mime, 30, cfg().res === '1920x1080' ? 10e6 : 6e6);
      S.recorder.start();
    } catch (e) {
      S.recorder = null;
      toast('No se pudo grabar el video; la medición sigue igual.');
    }
  } else toast('Este navegador no graba video; la medición sigue igual.');
  S.recT0 = performance.now() / 1000;
  S.pipe.configure(pipeCfg());
  S.pipe.arm(S.recT0);
  if (S.source === 'demo') { S.sim.reset(); S.sim.launchAt(S.recT0 + 2.0); }
  S.recState = 'on';
  updateRecBtn();
  beep(1320, 0.25);
}

async function stopRecording() {
  if (S.recState !== 'on') return;
  S.recState = 'ending';
  updateRecBtn();
  S.pipe.disarm();
  const P = liveParams();
  const pts = S.pipe.base ? computeHeights(livePoints(), P) : [];
  S.endRes = S.pipe.base ? analyze(pts, P) : null;
  S.endChart = pts;
  // Unos segundos de tarjeta de resumen al final del video.
  await sleep(S.recorder ? 2600 : 0);
  const out = S.recorder ? await S.recorder.stop() : null;
  S.recorder = null;
  buildSession(out);
  S.recState = 'off';
  updateRecBtn();
  if (S.source === 'demo' && S.sim) S.sim.reset();
  S.pipe.resetFlight();
  S.live = null;
  openResults();
}

function abortRecording() {
  if (S.recorder) S.recorder.stop().catch(() => {});
  S.recorder = null;
  S.recState = 'off';
  hideCountdown();
  updateRecBtn();
}

function updateRecBtn() {
  const b = $('btnRec');
  b.classList.toggle('on', S.recState === 'on');
  b.classList.toggle('armed', S.recState === 'countdown');
  b.disabled = S.recState === 'ending';
  b.setAttribute('aria-label', S.recState === 'on' ? 'Detener' : S.recState === 'countdown' ? 'Cancelar la cuenta regresiva' : 'Grabar');
}
function showCountdown(n) { const el = $('countdown'); el.textContent = n; el.hidden = false; }
function hideCountdown() { $('countdown').hidden = true; }

/* ============================================================================================
 * Sesión y resultados
 * ========================================================================================== */
const pickS = (s) => ({ el: s.el, az: s.az, u: s.u, v: s.v, src: s.src, sigPx: s.sigPx });

function buildSession(out) {
  const p = S.pipe, c = cfg();
  const byT = new Map(p.samples.map((s) => [s.t, s]));
  const frames = S.frames.map((f) => {
    const s = byT.get(f.t);
    return { i: f.i, t: f.t, Rs: f.Rs, s: s ? pickS(s) : null };
  });
  if (S.session && S.session.video && S.session.video.url) URL.revokeObjectURL(S.session.video.url);
  S.session = {
    date: new Date().toISOString(), label: c.label, mode: c.mode, d: c.d, sigD: c.sigD, lateralFix: c.lateralFix,
    sigSensorDeg: c.sigSensorDeg, fNorm: c.fNorm, W: S.W, H: S.H,
    base: p.base ? { el0: p.base.el0, az0: p.base.az0 } : null,
    tLaunch: p.tLaunch, recT0: S.recT0, frames, manual: {}, outTop: p.outTop,
    demo: S.source === 'demo' && S.sim ? S.sim.truth() : null,
    video: out ? { ...out, url: URL.createObjectURL(out.blob) } : null,
  };
  persistSession();
}

function persistSession() {
  const ses = S.session;
  if (!ses) return;
  const frames = [];
  for (const f of ses.frames) {
    const m = ses.manual[f.i];
    const s = m === undefined ? f.s : m;
    if (s) frames.push({ i: f.i, t: f.t, s });
  }
  saveLast({ ...ses, video: null, frames, manual: {} });
}

function sesParams(ses) {
  return { d: ses.d, sigD: ses.sigD, base: ses.base, lateralFix: ses.lateralFix, sigSensorDeg: ses.sigSensorDeg, f: ses.fNorm * Math.max(ses.W, ses.H), W: ses.W, H: ses.H };
}
function sesPoints(ses) {
  const out = [];
  if (ses.tLaunch == null) return out;
  for (const f of ses.frames) {
    const m = ses.manual[f.i];
    const s = m === undefined ? f.s : m;
    if (!s || f.t < ses.tLaunch - 0.02) continue;
    out.push({ ...s, i: f.i, t: f.t - ses.tLaunch });
  }
  return out;
}

function computeSession() {
  const ses = S.session;
  if (!ses || !ses.base) return { pts: [], res: null };
  const P = sesParams(ses);
  const pts = computeHeights(sesPoints(ses), P);
  return { pts, res: analyze(pts, P) };
}

function openResults() {
  if (!S.session) { toast('Todavía no hay lanzamientos. Pulsa grabar para el primero.'); return; }
  $('results').hidden = false;
  $('review').hidden = true;
  $('rReview').hidden = false;
  renderResults();
}
function closeResults() {
  $('results').hidden = true;
  $('rv').pause();
  S.rvBaseMode = false;
}

function renderResults() {
  const ses = S.session;
  if (!ses) return;
  const { pts, res } = computeSession();
  S.resCache = { pts, res };
  const date = new Date(ses.date);
  $('rTitle').textContent = ses.label || `Lanzamiento · ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  $('rApo').textContent = res ? `${res.clipped || ses.outTop ? '≥ ' : ''}${res.apogee.toFixed(1)} m` : '—';
  $('rApoSig').textContent = res
    ? `± ${res.sig.toFixed(1)} m de medición (ángulos, ajuste y distancia)`
    : ses.tLaunch == null
      ? 'No se detectó el despegue. Revisa el video cuadro a cuadro: marca el cohete y pulsa «El despegue es aquí».'
      : 'Hay muy pocos puntos. Revisa el video cuadro a cuadro y marca el cohete.';
  $('rClip').hidden = !(res && (res.clipped || ses.outTop));
  $('rDrift').textContent = res
    ? `Un solo celular no ve si el viento acercó o alejó el cohete de ti: cada metro que se acerca suma ${(res.apogee / ses.d).toFixed(2)} m de altura aparente. Con la deriva lateral medida (${fmt(res.latApo)} m), cuenta con ± ${res.sigDrift.toFixed(1)} m más. Ponerte de lado al viento lo reduce.`
    : '';
  const tr = $('rTruth');
  if (ses.demo && res) {
    tr.hidden = false;
    const e = res.apogee - ses.demo.apogee;
    tr.textContent = `Demostración: la altura verdadera fue ${ses.demo.apogee.toFixed(1)} m (diferencia ${e >= 0 ? '+' : ''}${e.toFixed(1)} m, ${((100 * e) / ses.demo.apogee).toFixed(1)} %).`;
  } else tr.hidden = true;
  const Hc = ses.base ? -ses.d * Math.tan(ses.base.el0) : null;
  const items = res ? [
    ['Tiempo al apogeo', `${res.tApo.toFixed(2)} s`],
    ['Rapidez vertical máx.', res.vmax != null ? `${res.vmax.toFixed(1)} m/s <small>${(res.vmax * 3.6).toFixed(0)} km/h</small>` : '—'],
    ['Deriva lateral en el apogeo', `${fmt(res.latApo)} m <small>+ derecha</small>`],
    ['Máximo medido sin ajustar', `${res.hmaxRaw.toFixed(1)} m`],
    ['Sin aire habría bastado', `${res.v0Ideal.toFixed(1)} m/s <small>v₀ = √(2gh)</small>`],
    ['Puntos', `${res.n} <small>${res.nAuto} app · ${res.nCross} cruz · ${res.nManual} tuyos</small>`],
    ['Celular sobre la base', `${fmt(Hc, 2)} m <small>compruébalo</small>`],
  ] : [['Celular sobre la base', `${fmt(Hc, 2)} m`]];
  $('rStats').innerHTML = items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('rD').value = +ses.d.toFixed(2);
  $('rSigD').value = +ses.sigD.toFixed(2);
  $('rSaveVid').disabled = $('rShareVid').disabled = !ses.video;
  $('rReview').disabled = !ses.video;
  $('rMethod').innerHTML = `<b>Cómo se calculó.</b> h = d·(tan θ / cos Δ − tan θ₀). θ es la elevación del cohete (inclinación del celular más su posición en la imagen), θ₀ la de la base de la rampa y Δ el giro horizontal respecto de la rampa; d = ${ses.d.toFixed(2)} m. El término −d·tan θ₀ es la altura del celular sobre la base, así que no hace falta medirla. El apogeo sale de ajustar una parábola a los puntos más altos. Lente: campo de visión ${G.fovDeg(ses.fNorm).toFixed(1)}°. Modo: ${ses.mode === 'tripod' ? 'trípode' : 'en la mano'}.`;
  drawResultsChart();
}

function drawResultsChart(cursorT = null) {
  const c = $('rChart');
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth || 600, h = c.clientHeight || 300;
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const { pts, res } = S.resCache || { pts: [], res: null };
  drawChart(ctx, 0, 0, w, h, pts, { res, scale: 1, cursorT });
}

function fileBase() {
  const ses = S.session;
  const slug = (ses.label || 'lanzamiento').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `apogeo_${slug}_${stamp(new Date(ses.date))}`;
}

$('rSaveVid').onclick = () => {
  const v = S.session && S.session.video;
  if (!v) return toast('Este lanzamiento no tiene video en memoria.');
  saveBlob(v.blob, `${fileBase()}.${v.ext}`);
  toast('Video guardado en Descargas.');
};
$('rShareVid').onclick = async () => {
  const v = S.session && S.session.video;
  if (!v) return;
  try { await shareBlob(v.blob, `${fileBase()}.${v.ext}`, 'Lanzamiento medido con Apogeo'); }
  catch (e) { if (e.name !== 'AbortError') toast('Este navegador no deja compartir archivos; usa «Guardar video».'); }
};
$('rCSV').onclick = () => {
  const ses = S.session;
  if (!ses || !ses.base) return;
  const { pts, res } = computeSession();
  saveBlob(new Blob([toCSV(ses, pts, res)], { type: 'text/csv' }), `${fileBase()}.csv`);
  toast('Datos guardados en Descargas.');
};
$('rPNG').onclick = () => {
  const ses = S.session;
  if (!ses) return;
  const { pts, res } = computeSession();
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1000;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1116';
  ctx.fillRect(0, 0, 1600, 1000);
  ctx.fillStyle = '#e9eff3';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText(`Apogeo · ${ses.label || 'lanzamiento'}`, 60, 80);
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = '#8fa1ad';
  ctx.fillText(`${new Date(ses.date).toLocaleString('es-CO')} · d = ${ses.d.toFixed(2)} m · ${ses.mode === 'tripod' ? 'trípode' : 'en la mano'}`, 60, 122);
  if (res) {
    ctx.fillStyle = '#ff8a3d';
    ctx.font = `700 64px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${res.apogee.toFixed(1)} ± ${res.sig.toFixed(1)} m`, 1540, 96);
    ctx.textAlign = 'left';
  }
  drawChart(ctx, 40, 160, 1520, 800, pts, { res, scale: 2 });
  ctx.fillStyle = '#8fa1ad';
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText('Elaborado con Apogeo · Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca', 60, 985);
  c.toBlob((b) => { saveBlob(b, `${fileBase()}.png`); toast('Gráfica guardada en Descargas.'); }, 'image/png');
};
$('rD').addEventListener('change', () => {
  const v = Number($('rD').value);
  if (S.session && v > 0) { S.session.d = v; renderResults(); persistSession(); }
});
$('rSigD').addEventListener('change', () => {
  const v = Number($('rSigD').value);
  if (S.session && v >= 0) { S.session.sigD = v; renderResults(); persistSession(); }
});

/* ---------- Revisión cuadro a cuadro ---------- */
const rv = $('rv'), rvOver = $('rvOver');
const rvScratch = document.createElement('canvas');
const rsctx = rvScratch.getContext('2d', { willReadFrequently: true });
const FPS = 30;

async function fixDuration(v) {
  if (isFinite(v.duration) && v.duration > 0) return;
  // Los videos de MediaRecorder no traen duración: se fuerza a calcularla saltando al final.
  await new Promise((res) => {
    const h = () => { if (isFinite(v.duration)) { v.removeEventListener('durationchange', h); res(); } };
    v.addEventListener('durationchange', h);
    v.currentTime = 1e101;
    setTimeout(res, 3000);
  });
  v.currentTime = 0;
}
function rvDuration() {
  const ses = S.session;
  if (isFinite(rv.duration) && rv.duration > 0) return rv.duration;
  return ses && ses.frames.length ? ses.frames[ses.frames.length - 1].t - ses.recT0 + 0.1 : 1;
}

async function openReview() {
  const ses = S.session;
  if (!ses || !ses.video) return toast('Este lanzamiento no tiene el video en memoria (se pierde si la página se recarga).');
  $('review').hidden = false;
  $('rReview').hidden = true;
  rv.src = ses.video.url;
  if (!rv.videoWidth) await new Promise((r) => rv.addEventListener('loadedmetadata', r, { once: true }));
  await fixDuration(rv);
  // El video empieza un poco después que el registro: el desfase se mide leyendo el número de cuadro.
  S.rvOffset = 0;
  seekTo(0.3);
  await new Promise((r) => rv.addEventListener('seeked', r, { once: true }));
  seekTo(ses.tLaunch != null ? Math.max(0, ses.tLaunch - ses.recT0 - S.rvOffset - 0.2) : 0);
  $('review').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function seekTo(t) {
  rv.pause();
  $('rvPlay').textContent = '▶';
  rv.currentTime = Math.max(0, Math.min(t, rvDuration() - 0.02));
}
function frameAtTime(t) {
  const fr = S.session.frames;
  let best = null, bd = Infinity;
  for (const f of fr) { const d = Math.abs(f.t - t); if (d < bd) { bd = d; best = f; } }
  return best;
}

function onReviewFrame() {
  const ses = S.session;
  if (!ses || $('review').hidden) return;
  rvScratch.width = ses.W;
  rvScratch.height = ses.H;
  rsctx.drawImage(rv, 0, 0, ses.W, ses.H);
  let idx = readBarcode(rsctx, ses.W, ses.H);
  if (idx != null && ses.frames[idx]) S.rvOffset = ses.frames[idx].t - ses.recT0 - rv.currentTime;
  else { const f = frameAtTime(ses.recT0 + rv.currentTime + (S.rvOffset || 0)); idx = f ? f.i : null; }
  S.rvIdx = idx;
  const f = idx != null ? ses.frames[idx] : null;
  const m = f ? ses.manual[f.i] : undefined;
  const s = f ? (m === undefined ? f.s : m) : null;
  let txt = f ? `Cuadro ${f.i}` : 'Cuadro —';
  if (f && ses.tLaunch != null) txt += ` · T${f.t >= ses.tLaunch ? '+' : '−'} ${Math.abs(f.t - ses.tLaunch).toFixed(2)} s`;
  if (s && ses.base) {
    const r = G.heightAt(s.el, s.az, ses.base, ses.d, ses.lateralFix);
    if (r) txt += ` · h = ${r.h.toFixed(2)} m (${s.src === 'manual' ? 'marcado por ti' : s.src === 'cruz' ? 'cruz' : 'app'})`;
  } else if (f) txt += m === null ? ' · punto quitado' : ' · sin punto';
  if (S.rvBaseMode) txt = 'Toca la base de la rampa en esta imagen.';
  $('rvInfo').textContent = txt;
  $('rvSlider').value = Math.round((1000 * rv.currentTime) / rvDuration());
  drawReviewOverlay(f, s);
  drawResultsChart(f && ses.tLaunch != null ? f.t - ses.tLaunch : null);
}

function overlayMap() {
  const ses = S.session;
  const w = rvOver.clientWidth, h = rvOver.clientHeight;
  const sc = Math.min(w / ses.W, h / ses.H);
  return { w, h, sc, ox: (w - ses.W * sc) / 2, oy: (h - ses.H * sc) / 2 };
}

function drawReviewOverlay(f, s) {
  const ses = S.session;
  const dpr = window.devicePixelRatio || 1;
  const m = overlayMap();
  rvOver.width = Math.round(m.w * dpr);
  rvOver.height = Math.round(m.h * dpr);
  const ctx = rvOver.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, m.w, m.h);
  if (!f) return;
  const X = (u) => m.ox + u * m.sc, Y = (v) => m.oy + v * m.sc;
  // Trayectoria de los puntos efectivos re-proyectada con la orientación de este cuadro.
  const cam = G.camFor(ses.W, ses.H, ses.fNorm);
  ctx.strokeStyle = 'rgba(255,209,102,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (const q of sesPoints(ses)) {
    const p = G.worldToPixel(f.Rs, cam, G.dirFromElAz(q.el, q.az));
    if (!p) { started = false; continue; }
    if (started) ctx.lineTo(X(p.u), Y(p.v)); else { ctx.moveTo(X(p.u), Y(p.v)); started = true; }
  }
  ctx.stroke();
  if (s) {
    ctx.strokeStyle = s.src === 'manual' ? '#ffd166' : s.src === 'cruz' ? '#7fe0ff' : '#ff8a3d';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(X(s.u), Y(s.v), 14, 0, 2 * Math.PI); ctx.stroke();
  }
}

rvOver.addEventListener('pointerup', (e) => {
  const ses = S.session;
  if (!ses || S.rvIdx == null) return;
  const m = overlayMap();
  const r = rvOver.getBoundingClientRect();
  const u = (e.clientX - r.left - m.ox) / m.sc, v = (e.clientY - r.top - m.oy) / m.sc;
  if (u < 0 || v < 0 || u > ses.W || v > ses.H) return;
  const f = ses.frames[S.rvIdx];
  const cam = G.camFor(ses.W, ses.H, ses.fNorm);
  const { el, az } = G.elAz(G.pixelToWorld(f.Rs, cam, u, v));
  if (S.rvBaseMode) {
    ses.base = { el0: el, az0: az };
    S.rvBaseMode = false;
    toast(`Base corregida. Celular a ${(-ses.d * Math.tan(el)).toFixed(2)} m sobre la base.`);
  } else {
    ses.manual[f.i] = { el, az, u, v, src: 'manual', sigPx: 3 };
    if (ses.tLaunch == null) ses.tLaunch = f.t;
  }
  persistSession();
  renderResults();
  onReviewFrame();
});

rv.addEventListener('seeked', onReviewFrame);
rv.addEventListener('timeupdate', () => { if (!rv.paused) onReviewFrame(); });
rv.addEventListener('ended', () => { $('rvPlay').textContent = '▶'; });
const step = (n) => seekTo(rv.currentTime + n / FPS);
$('rvPrev').onclick = () => step(-1);
$('rvNext').onclick = () => step(1);
$('rvPrev10').onclick = () => step(-10);
$('rvNext10').onclick = () => step(10);
$('rvPlay').onclick = () => {
  if (rv.paused) { rv.playbackRate = 0.5; rv.play(); $('rvPlay').textContent = '⏸'; }
  else { rv.pause(); $('rvPlay').textContent = '▶'; }
};
$('rvSlider').addEventListener('input', () => seekTo((Number($('rvSlider').value) / 1000) * rvDuration()));
$('rvDel').onclick = () => {
  const ses = S.session;
  if (!ses || S.rvIdx == null) return;
  ses.manual[S.rvIdx] = null;
  persistSession();
  renderResults();
  onReviewFrame();
};
$('rvLaunch').onclick = () => {
  const ses = S.session;
  if (!ses || S.rvIdx == null) return;
  ses.tLaunch = ses.frames[S.rvIdx].t;
  toast('Despegue fijado en este cuadro.');
  persistSession();
  renderResults();
  onReviewFrame();
};
$('rvBase').onclick = () => { S.rvBaseMode = true; onReviewFrame(); };
$('rReview').onclick = openReview;

/* ============================================================================================
 * Tareas guiadas: base y lente
 * ========================================================================================== */
function showTask(text, mainLabel, mainFn, altLabel = null, altFn = null) {
  $('taskText').textContent = text;
  const m = $('taskMain'), a = $('taskAlt');
  m.hidden = !mainLabel;
  m.textContent = mainLabel || '';
  m.onclick = mainFn;
  a.hidden = !altLabel;
  a.textContent = altLabel || '';
  a.onclick = altFn;
  $('task').hidden = false;
}
function hideTask() { $('task').hidden = true; }
function cancelTask() { S.pending = null; hideTask(); }
$('taskCancel').onclick = cancelTask;

function startBaseTask() {
  if (!S.source) return;
  if (S.recState !== 'off') return toast('Termina la grabación antes de cambiar la base.');
  S.pending = 'base';
  showTask(
    cfg().mode === 'tripod'
      ? 'Toca en la imagen la base de la rampa (donde se apoya el cohete). También puedes apuntar la cruz central y pulsar «Usar la cruz».'
      : 'Apunta la cruz central a la base de la rampa y pulsa «Usar la cruz».',
    'Usar la cruz', () => setBase(S.W / 2, S.H / 2),
  );
}

function setBase(u, v) {
  if (!S.lastRs) return;
  S.pipe.setBasePixel(u, v, S.lastRs);
  S.pending = null;
  hideTask();
  const Hc = -cfg().d * Math.tan(S.pipe.base.el0);
  toast(`Base fijada. Con d = ${cfg().d} m, tu celular queda ${Math.abs(Hc).toFixed(1)} m ${Hc >= 0 ? 'por encima' : 'por debajo'} de la base: compruébalo.`, 5000);
  updateChips();
}

function startLensTask(keep = false) {
  if (S.source !== 'camera') return toast(S.source === 'demo' ? 'En la demostración el lente ya está calibrado.' : 'Inicia la cámara primero.');
  closeSheet();
  if (!keep) S.lensPairs = [];
  S.pending = 'lens1';
  showTask('Calibrar lente (1 de 2): apunta la cruz central a algo lejano y nítido, como la punta de una torre de luz, y pulsa «Marcar».', 'Marcar', lensMark);
}
function lensMark() {
  if (!S.lastRs) return;
  S.lensA = { u: S.W / 2, v: S.H / 2, Rs: S.lastRs.slice() };
  S.pending = 'lens2';
  showTask('Calibrar lente (2 de 2): inclina el celular despacio hasta que ese mismo objeto quede cerca del borde superior o inferior de la imagen, y tócalo ahí.', null, null);
}
function lensTap(u, v) {
  const off = Math.hypot(u - S.W / 2, v - S.H / 2) / Math.max(S.W, S.H);
  if (off < 0.2) return toast('Llévalo más cerca del borde de la imagen: así la calibración sale más precisa.');
  S.lensPairs.push({ a: S.lensA, b: { u, v, Rs: S.lastRs.slice() } });
  const r = G.solveFocal(S.lensPairs, S.W, S.H);
  setCfg('fNorm', r.fNorm);
  setCfg('lensCalibrated', true);
  S.pending = null;
  const n = S.lensPairs.length;
  showTask(
    `Lente calibrado: ${G.fovDeg(r.fNorm).toFixed(1)}° de campo de visión en el lado largo (desajuste ${r.residualDeg.toFixed(2)}°, ${n} ${n === 1 ? 'medida' : 'medidas'}). Repite con otro objeto para promediar, o termina.`,
    'Terminar', cancelTask, 'Repetir', () => startLensTask(true),
  );
}

/* ---------- Toques sobre la imagen ---------- */
function toImage(el, e, W, H) {
  const r = el.getBoundingClientRect();
  const sc = Math.min(r.width / W, r.height / H);
  const ox = (r.width - W * sc) / 2, oy = (r.height - H * sc) / 2;
  const u = (e.clientX - r.left - ox) / sc, v = (e.clientY - r.top - oy) / sc;
  if (u < 0 || v < 0 || u > W || v > H) return null;
  return { u, v };
}
view.addEventListener('pointerup', (e) => {
  if (!S.source || !S.W) return;
  const p = toImage(view, e, S.W, S.H);
  if (!p) return;
  if (S.pending === 'lens2') return lensTap(p.u, p.v);
  if (S.pending === 'lens1') return;
  if (S.pending === 'base' || (!S.pipe.base && S.recState === 'off' && cfg().mode === 'tripod')) return setBase(p.u, p.v);
  if (S.recState === 'on' && ['armed', 'flight', 'lost'].includes(S.pipe.state)) {
    S.pipe.tap(p.u, p.v);
    toast('Cohete marcado: lo sigo desde ahí.', 1500);
    return;
  }
  if (S.pipe.base && S.lastRs && S.recState === 'off') {
    const q = G.elAz(G.pixelToWorld(S.lastRs, S.pipe.cam, p.u, p.v));
    const r = G.heightAt(q.el, q.az, S.pipe.base, cfg().d, cfg().lateralFix);
    if (r) toast(`Ese punto está a ${r.h.toFixed(2)} m sobre la rampa (si está a la misma distancia que ella).`, 3000);
  }
});

/* ============================================================================================
 * GPS y altura del observador
 * ========================================================================================== */
const gps = { pad: null, obs: null };
function gpsCollect(which) {
  if (!navigator.geolocation) return toast('Este navegador no entrega la ubicación.');
  const info = $(which === 'pad' ? 'gpsPadInfo' : 'gpsObsInfo');
  const acc = [];
  info.textContent = 'midiendo 10 s… quédate quieto';
  const id = navigator.geolocation.watchPosition(
    (pos) => { acc.push(pos.coords); info.textContent = `${acc.length} lecturas · ±${Math.round(pos.coords.accuracy)} m`; },
    (err) => { info.textContent = `sin ubicación (${err.message})`; },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  );
  setTimeout(() => {
    navigator.geolocation.clearWatch(id);
    if (!acc.length) return;
    let sw = 0, la = 0, lo = 0;
    for (const c of acc) { const w = 1 / Math.max(1, c.accuracy) ** 2; sw += w; la += w * c.latitude; lo += w * c.longitude; }
    const a = acc.map((c) => c.accuracy).sort((x, y) => x - y)[Math.floor(acc.length / 2)];
    gps[which] = { lat: la / sw, lon: lo / sw, acc: a };
    info.textContent = `listo · ±${Math.round(a)} m`;
    if (gps.pad && gps.obs) {
      const d = G.gpsDistance(gps.pad, gps.obs);
      const sig = Math.hypot(gps.pad.acc, gps.obs.acc) * 0.7;
      $('gpsResult').textContent = `Distancia por GPS: ${d.toFixed(1)} m ± ${sig.toFixed(1)} m`;
      $('gpsUse').hidden = false;
      $('gpsUse').onclick = () => { setCfg('d', +d.toFixed(1)); setCfg('sigD', +sig.toFixed(1)); fillSetup(); toast('Distancia actualizada.'); };
    }
  }, 10000);
}
$('gpsPad').onclick = () => gpsCollect('pad');
$('gpsObs').onclick = () => gpsCollect('obs');
$('btnHobs').onclick = () => {
  const Hh = Number($('inHobs').value);
  const b = S.pipe.base;
  if (!b) return ($('hobsResult').textContent = 'Primero fija la base (toca la rampa en la imagen).');
  if (!(Hh > 0)) return ($('hobsResult').textContent = 'Escribe tu altura sobre la base de la rampa.');
  if (b.el0 > -3 * G.DEG) return ($('hobsResult').textContent = `Miras la rampa casi horizontal (${(b.el0 / G.DEG).toFixed(1)}°): así el cálculo no es confiable. Mide la distancia con cinta.`);
  const d = Hh / Math.tan(-b.el0);
  const sig = (Hh / Math.sin(b.el0) ** 2) * cfg().sigSensorDeg * G.DEG;
  $('hobsResult').textContent = `d = ${d.toFixed(1)} m ± ${sig.toFixed(1)} m (ángulo a la base ${(b.el0 / G.DEG).toFixed(1)}°).`;
  setCfg('d', +d.toFixed(2));
  setCfg('sigD', +Math.max(0.1, sig).toFixed(2));
  fillSetup();
};

/* ============================================================================================
 * Preparación (hoja de ajustes)
 * ========================================================================================== */
const MODE_HELP = {
  tripod: 'El celular queda quieto en un trípode o apoyado firme. La app aprende el fondo, detecta sola el despegue y sigue el movimiento del cohete. Es lo más preciso. Encuadra con la rampa cerca del borde inferior y revisa que «el cuadro cubre» supere la altura esperada.',
  follow: 'Sigues el cohete con la cruz central. La app usa la inclinación del celular y, cuando el cohete se ve contra el cielo, su posición exacta en la imagen. Sirve para cohetes que suben más de lo que cabe en el cuadro; es menos preciso al comienzo del vuelo.',
};

function fillSetup() {
  const c = cfg();
  $('inD').value = +(+c.d).toFixed(2);
  $('inSigD').value = c.sigD;
  $('modeTripod').setAttribute('aria-checked', String(c.mode === 'tripod'));
  $('modeFollow').setAttribute('aria-checked', String(c.mode === 'follow'));
  $('modeHelp').textContent = MODE_HELP[c.mode];
  $('lensInfo').textContent = `Campo de visión ${G.fovDeg(c.fNorm).toFixed(1)}° en el lado largo · ${c.lensCalibrated ? 'calibrado' : 'valor típico, sin calibrar'}`;
  $('inLabel').value = c.label;
  $('inCountdown').value = String(c.countdown);
  $('inRes').value = c.res;
  $('inLateral').checked = !!c.lateralFix;
  $('inShowRoi').checked = !!c.showRoi;
  $('inAna').value = String(c.ana);
  $('inSigS').value = c.sigSensorDeg;
  $('inLat').value = c.latencyMs;
  $('fpsInfo').textContent = S.fps ? `Ahora procesa ${Math.round(S.fps)} cuadros por segundo.` : '';
  $('demoGroup').hidden = S.source !== 'demo';
  $('demoPreset').value = S.set.demo.preset;
  $('demoWind').value = S.set.demo.wind;
  $('demoWindDir').value = String(S.set.demo.windDir);
  $('demoH').value = S.set.demo.Hobs;
  $('srcCam').setAttribute('aria-pressed', String(S.source === 'camera'));
  $('srcDemo').setAttribute('aria-pressed', String(S.source === 'demo'));
}
function openSheet() { fillSetup(); $('setup').hidden = false; }
function closeSheet() { $('setup').hidden = true; }

const onNum = (id, key, ok = (v) => v > 0) => $(id).addEventListener('change', () => {
  const v = Number($(id).value);
  if (ok(v)) setCfg(key, v); else fillSetup();
});
onNum('inD', 'd');
onNum('inSigD', 'sigD', (v) => v >= 0);
onNum('inSigS', 'sigSensorDeg', (v) => v >= 0);
onNum('inLat', 'latencyMs', (v) => v >= 0);
$('inLabel').addEventListener('input', () => setCfg('label', $('inLabel').value.trim()));
$('inCountdown').addEventListener('change', () => setCfg('countdown', Number($('inCountdown').value)));
$('inLateral').addEventListener('change', () => setCfg('lateralFix', $('inLateral').checked));
$('inShowRoi').addEventListener('change', () => setCfg('showRoi', $('inShowRoi').checked));
$('inAna').addEventListener('change', () => { setCfg('ana', Number($('inAna').value)); if (S.W) setupSizes(S.W, S.H); });
$('inRes').addEventListener('change', () => { setCfg('res', $('inRes').value); if (S.source === 'camera') startCamera(); });
$('inCam').addEventListener('change', () => { setCfg('camId', $('inCam').value); if (S.source === 'camera') startCamera(); });
function setMode(m) {
  if (S.recState !== 'off') return toast('Termina la grabación antes de cambiar el modo.');
  setCfg('mode', m);
  fillSetup();
  if (S.source === 'demo') startDemo();
}
$('modeTripod').onclick = () => setMode('tripod');
$('modeFollow').onclick = () => setMode('follow');
$('btnLens').onclick = () => startLensTask(false);
$('btnLensReset').onclick = () => { setCfg('fNorm', 0.8); setCfg('lensCalibrated', false); fillSetup(); };
const demoField = (id, key, conv) => $(id).addEventListener('change', () => {
  S.set.demo[key] = conv($(id).value);
  saveSettings(S.set);
});
demoField('demoPreset', 'preset', String);
demoField('demoWind', 'wind', Number);
demoField('demoWindDir', 'windDir', Number);
demoField('demoH', 'Hobs', Number);
$('demoRestart').onclick = () => { closeSheet(); startDemo(); };
$('srcCam').onclick = async () => { closeSheet(); await startCamera(); };
$('srcDemo').onclick = () => { closeSheet(); startDemo(); };
document.querySelectorAll('[data-close]').forEach((b) => {
  b.onclick = () => (b.dataset.close === 'results' ? closeResults() : closeSheet());
});

/* ============================================================================================
 * Barra superior, pistas y avisos
 * ========================================================================================== */
function updateChips() {
  const c = cfg();
  const cd = $('chipD'), cb = $('chipBase'), cl = $('chipLens'), cm = $('chipMode');
  cd.textContent = `d ${fmt(+c.d, 1)} m`;
  cd.className = 'chip ink';
  if (S.pipe.base) {
    const Hc = -c.d * Math.tan(S.pipe.base.el0);
    cb.textContent = `base ✓ · cel. ${Hc.toFixed(1)} m`;
    cb.className = 'chip ok';
  } else {
    cb.textContent = 'sin base';
    cb.className = 'chip warn';
  }
  cl.textContent = `lente ${G.fovDeg(c.fNorm).toFixed(0)}°${c.lensCalibrated ? '' : ' típico'}`;
  cl.className = c.lensCalibrated ? 'chip' : 'chip warn';
  cm.textContent = c.mode === 'tripod' ? 'trípode' : 'en la mano';
  cm.className = 'chip';
}
['chipD', 'chipLens', 'chipMode'].forEach((id) => { $(id).onclick = openSheet; });
$('chipBase').onclick = startBaseTask;
$('btnSetup').onclick = openSheet;
$('btnBase').onclick = startBaseTask;
$('btnRec').onclick = onRec;
$('btnResults').onclick = openResults;

function updateHint() {
  let h = '';
  const c = cfg();
  if (S.source && S.recState !== 'countdown' && $('task').hidden) {
    if (S.source === 'camera' && !S.orient.live && performance.now() - S.camStartedAt > 2500) {
      h = 'No llegan datos de inclinación del celular. Usa Chrome en Android y no bloquees los sensores de movimiento.';
    } else if (S.recState === 'off' && S.source === 'camera' && S.fps && S.fps < 18 && performance.now() - S.camStartedAt > 4000) {
      h = `El celular procesa solo ${Math.round(S.fps)} cuadros/s. En ⚙ → Avanzado baja la resolución de análisis a 480.`;
    } else if (S.recState === 'on') {
      const st = S.pipe.state;
      if (st === 'armed') h = c.mode === 'follow' ? 'Apunta la cruz a la rampa y síguelo cuando despegue.' : 'Esperando el despegue. Si no lo detecta, toca el cohete en la imagen.';
      else if (st === 'lost') h = S.pipe.outTop ? 'El cohete salió del cuadro por arriba: la altura medida es solo un mínimo.' : 'Perdí el cohete: tócalo en la imagen.';
      else if (st === 'flight') h = c.mode === 'follow' ? 'Mantén la cruz sobre el cohete.' : '';
      else if (st === 'done') h = 'Aterrizó. Termino de grabar en un momento…';
    } else if (S.recState === 'off') {
      if (!S.pipe.base) h = c.mode === 'tripod' ? 'Toca la base de la rampa en la imagen.' : 'Apunta la cruz a la base de la rampa y pulsa «Base».';
      else h = c.mode === 'tripod' ? 'Listo. Revisa que el cuadro cubra la altura esperada y pulsa grabar.' : 'Listo. Pulsa grabar y sigue al cohete con la cruz.';
    }
  }
  const el = $('hint');
  el.hidden = !h;
  if (h && el.textContent !== h) el.textContent = h;
}
setInterval(updateHint, 400);

let toastTimer = null;
function toast(msg, ms = 2600) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}
function introWarn(msg) { const el = $('introWarn'); el.textContent = msg; el.hidden = false; }
function enterApp() { $('intro').hidden = true; updateChips(); }

/* ============================================================================================
 * Inicio
 * ========================================================================================== */
$('btnStartCam').onclick = () => startCamera();
$('btnStartDemo').onclick = () => startDemo();
const last = loadLast();
if (last && last.frames) {
  $('btnLast').hidden = false;
  $('btnLast').onclick = () => {
    S.session = { ...last, manual: {}, video: null, frames: last.frames.map((f) => ({ ...f, Rs: null })) };
    openResults();
  };
}
if (!window.isSecureContext) introWarn('Esta página no es segura (http://), así que el navegador no dejará usar la cámara ni los sensores. Ábrela con https:// (ver el README). La demostración sí funciona.');
updateChips();
updateRecBtn();
if ('serviceWorker' in navigator && window.isSecureContext && location.hostname !== '127.0.0.1') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
/**
 * Autoprueba: un lanzamiento simulado procesado cuadro a cuadro con el mismo dibujo, rastreador y capa de
 * información de la app, sin depender de la animación del navegador. Devuelve el apogeo medido y el verdadero.
 */
function selfTest(opts = {}) {
  const ds = { ...S.set.demo, ...opts };
  const mode = opts.mode || 'tripod';
  const sim = new SimScene({ preset: ds.preset, d: opts.d || null, Hobs: ds.Hobs, mode, wind: ds.wind, windDirDeg: ds.windDir, fNorm: 0.78, seed: opts.seed || 11 });
  const pipe = new Pipeline({ ...pipeCfg(), mode, d: sim.o.d, sigD: 0.2, fNorm: 0.78 });
  const W = sim.o.W, H = sim.o.H, k = Math.min(1, (opts.ana || 640) / H);
  const ac = document.createElement('canvas');
  ac.width = Math.round(W * k);
  ac.height = Math.round(H * k);
  const ax = ac.getContext('2d', { willReadFrequently: true });
  const hud = document.createElement('canvas');
  hud.width = W;
  hud.height = H;
  const hx = hud.getContext('2d');
  pipe.setSizes(W, H, ac.width, ac.height);
  const R0 = sim.render(0);
  const p0 = sim.padPixel(R0);
  pipe.setBasePixel(p0.u + 1, p0.v - 1, sim.sensorR(R0));
  pipe.arm(0);
  sim.launchAt(1.0);
  const tEnd = 1.0 + (sim.rocket.tLand || sim.rocket.tEnd) + 1;
  let n = 0, tr = 0, tp = 0;
  for (let t = 1 / 30; t < tEnd; t += 1 / 30) {
    const a = performance.now();
    const R = sim.render(t);
    const b = performance.now();
    ax.drawImage(sim.canvas, 0, 0, ac.width, ac.height);
    const v = pipe.process({ t, img: ax.getImageData(0, 0, ac.width, ac.height), Rs: sim.sensorR(R) });
    hx.drawImage(sim.canvas, 0, 0);
    drawHUD(hx, { W, H, Rs: R, cam: pipe.cam, base: pipe.base, d: sim.o.d, mode, lateralFix: true, label: 'autoprueba', clock: '', view: v,
      samples: pipe.samples, tLaunch: pipe.tLaunch, maxH: pipe.maxH, apoFlag: pipe.apoFlag, live: null, rec: { on: true, idx: n, elapsed: t }, chart: [], showRoi: true });
    tr += b - a;
    tp += performance.now() - b;
    n++;
    if (pipe.state === 'done' || (opts.stopAt && t >= opts.stopAt)) break;
  }
  const P = { d: sim.o.d, sigD: 0.2, base: pipe.base, lateralFix: true, sigSensorDeg: 0.3, f: pipe.cam.f, W, H };
  const pts = computeHeights(pipe.samples.map((s) => ({ ...s, t: s.t - pipe.tLaunch })), P);
  const res = analyze(pts, P);
  return {
    preset: ds.preset, mode, truth: +sim.rocket.apo.toFixed(2), apogee: res && +res.apogee.toFixed(2), sig: res && +res.sig.toFixed(2),
    drift: res && +res.sigDrift.toFixed(2), launchErrMs: pipe.tLaunch == null ? null : Math.round((pipe.tLaunch - 1) * 1000),
    tApo: res && [+sim.rocket.tApo.toFixed(2), +res.tApo.toFixed(2)], n: pts.length, auto: pts.filter((q) => q.src === 'auto').length,
    clipped: res && res.clipped, outTop: pipe.outTop, frames: n, msRender: +(tr / n).toFixed(1), msPipelineHud: +(tp / n).toFixed(1), hud: hud,
  };
}

window.__apogeo = { S, startDemo, startCamera, onRec, startRecordingNow, stopRecording, openResults, selfTest, driveDemo, G, cfg };
