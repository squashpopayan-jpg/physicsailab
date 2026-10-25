// Escenario sintético para las pruebas: se "fotografía" un vuelo simulado (cielo con nubes, línea de árboles,
// ruido de cámara, cohete con su chorro o humo), se pasa por el seguimiento y se compara el apogeo medido con el
// verdadero. La orientación que recibe la app tiene sesgo y ruido como la de un celular real.
import * as G from '../js/geom.js';
import { Pipeline } from '../js/pipeline.js';
import { RocketSim, PRESETS } from '../js/physics.js';
import { computeHeights, analyze } from '../js/analysis.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function rotAxis(R, ax, ang) {
  // R · rotación (marco del dispositivo) alrededor del eje 'x' | 'y' | 'z'
  const c = Math.cos(ang), s = Math.sin(ang);
  const M = ax === 'x' ? [1, 0, 0, 0, c, -s, 0, s, c] : ax === 'y' ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
  const o = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = R[i * 3] * M[j] + R[i * 3 + 1] * M[3 + j] + R[i * 3 + 2] * M[6 + j];
  return o;
}

export function runScenario(o, onFrame = null) {
  const W = 720, H = 1280;
  const aw = Math.round((W * o.ana) / H), ah = o.ana;
  const rand = rng(o.seed || 1);
  const p = PRESETS[o.preset];
  const sim = new RocketSim(o.preset, { wind: o.wind, railTiltDeg: 1.5, railAzDeg: 200 });
  const eye = [0, 0, o.Hobs], pad = [0, o.d, 0];
  const dirTo = (P) => G.unit([P[0] - eye[0], P[1] - eye[1], P[2] - eye[2]]);
  const camT = G.camFor(W, H, o.fTrue);
  const fa = o.fTrue * ah;
  const xs = new Float32Array(aw), ys = new Float32Array(ah);
  for (let x = 0; x < aw; x++) xs[x] = (x + 0.5 - aw / 2) / fa;
  for (let y = 0; y < ah; y++) ys[y] = -(y + 0.5 - ah / 2) / fa;
  const clouds = Array.from({ length: 7 }, () => ({ el: (12 + rand() * 45) * G.DEG, az: (rand() - 0.5) * 1.6, r: (2 + rand() * 4) * G.DEG }));
  const img = { data: new Uint8ClampedArray(aw * ah * 4), width: aw, height: ah };
  const tL = 1.0;
  const rocketAt = (t) => { const s = sim.at(t - tL); return { P: [pad[0] + s.p[0], pad[1] + s.p[1], pad[2] + s.p[2]], s }; };

  // Orientación verdadera de la cámara.
  const padDir = dirTo(pad);
  const vf = 2 * Math.atan(0.5 / o.fTrue);
  const triAxis = G.dirFromElAz(G.elAz(padDir).el + 0.37 * vf, 0.03);
  let axis = dirTo([pad[0], pad[1], 0.6]);
  const camR = (t, dt) => {
    if (o.mode === 'tripod') return G.lookR(triAxis, 0.015);
    const target = t >= tL ? dirTo(rocketAt(t - 0.12).P) : dirTo([pad[0], pad[1], 0.6]);
    const a = 1 - Math.exp(-dt / 0.13);
    axis = G.unit([axis[0] + (target[0] - axis[0]) * a, axis[1] + (target[1] - axis[1]) * a, axis[2] + (target[2] - axis[2]) * a]);
    const ea = G.elAz(axis);
    const tremor = G.dirFromElAz(ea.el + 0.25 * G.DEG * Math.sin(27 * t) + 0.15 * G.DEG * Math.sin(44.6 * t + 1), ea.az + 0.2 * G.DEG * Math.sin(23.2 * t + 2));
    return G.lookR(tremor, 0.05 * Math.sin(0.3 * t));
  };
  const sensor = (R) => {
    let S = rotAxis(R, 'x', o.biasDeg * G.DEG + (rand() - 0.5) * 2 * o.noiseDeg * G.DEG);
    S = rotAxis(S, 'y', (rand() - 0.5) * 2 * o.noiseDeg * G.DEG);
    return S;
  };

  const render = (R, t) => {
    const d = img.data;
    const hz = [215, 225, 232], ze = [112, 152, 200];
    const cl = clouds.map((c) => ({ v: G.dirFromElAz(c.el, c.az + 0.003 * t), r: c.r }));
    const treeEl = Math.atan(13 / (o.d + 60));
    let i = 0;
    for (let y = 0; y < ah; y++) {
      for (let x = 0; x < aw; x++, i += 4) {
        const X = xs[x], Y = ys[y];
        let wx = R[0] * X + R[1] * Y - R[2], wy = R[3] * X + R[4] * Y - R[5], wz = R[6] * X + R[7] * Y - R[8];
        const n = Math.sqrt(wx * wx + wy * wy + wz * wz); wx /= n; wy /= n; wz /= n;
        const el = Math.asin(wz), az = Math.atan2(wx, wy);
        let r, g, b;
        if (el < 0) { r = 72; g = 122; b = 62; }
        else if (el < treeEl + 0.012 * Math.sin(az * 31) + 0.008 * Math.sin(az * 77)) { r = 38; g = 66; b = 40; }
        else {
          const s = Math.min(1, el / (60 * G.DEG));
          r = hz[0] + (ze[0] - hz[0]) * s; g = hz[1] + (ze[1] - hz[1]) * s; b = hz[2] + (ze[2] - hz[2]) * s;
          for (const c of cl) {
            const dt = wx * c.v[0] + wy * c.v[1] + wz * c.v[2];
            if (dt < 0.98) continue;
            const ang = Math.acos(Math.min(1, dt)) / c.r;
            const a = 0.85 * Math.exp(-ang * ang);
            r += (246 - r) * a; g += (246 - g) * a; b += (248 - b) * a;
          }
        }
        const nz = () => (rand() + rand() + rand() - 1.5) * 3;
        d[i] = r + nz(); d[i + 1] = g + nz(); d[i + 2] = b + nz(); d[i + 3] = 255;
      }
    }
    const k = aw / W;
    const blob = (Pw, radM, col, alpha) => {
      const pp = G.worldToPixel(R, camT, dirTo(Pw));
      if (!pp) return;
      const range = Math.hypot(Pw[0] - eye[0], Pw[1] - eye[1], Pw[2] - eye[2]);
      const rp = Math.max(0.6, (radM * fa) / range), cx = pp.u * k, cy = pp.v * k;
      for (let y = Math.floor(cy - 2 * rp); y <= Math.ceil(cy + 2 * rp); y++) {
        if (y < 0 || y >= ah) continue;
        for (let x = Math.floor(cx - 2 * rp); x <= Math.ceil(cx + 2 * rp); x++) {
          if (x < 0 || x >= aw) continue;
          const q = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / rp;
          const a = alpha * Math.exp(-q * q);
          const j = (y * aw + x) * 4;
          d[j] += (col[0] - d[j]) * a; d[j + 1] += (col[1] - d[j + 1]) * a; d[j + 2] += (col[2] - d[j + 2]) * a;
        }
      }
    };
    // Chorro de agua o humo detrás del cohete.
    if (t >= tL) {
      const tr = t - tL;
      if (o.preset === 'agua') {
        for (let tau = 0; tau < 0.35; tau += 0.01) {
          if (tr - tau < 0 || tr - tau > 0.2) continue;
          const st = sim.at(tr - tau);
          const tail = [pad[0] + st.p[0] - st.axis[0] * p.len / 2, pad[1] + st.p[1] - st.axis[1] * p.len / 2, pad[2] + st.p[2] - st.axis[2] * p.len / 2 - tau * 3];
          blob(tail, 0.08 + 0.6 * tau, [236, 239, 242], 0.55 * (1 - tau / 0.35));
        }
      } else {
        for (let tau = 0; tau < 3; tau += 0.04) {
          const te = tr - tau;
          if (te < 0 || te > sim.tBurn + 4) continue;
          const st = sim.at(te);
          const tail = [pad[0] + st.p[0] - st.axis[0] * p.len / 2 + o.wind[0] * tau, pad[1] + st.p[1] - st.axis[1] * p.len / 2 + o.wind[1] * tau, pad[2] + st.p[2] - st.axis[2] * p.len / 2];
          blob(tail, 0.06 + 0.3 * tau, [196, 198, 200], (te < sim.tBurn ? 0.45 : 0.18) * Math.exp(-tau / 1.4));
        }
      }
    }
    // Cohete: segmento con antialiasing.
    const { P, s } = rocketAt(t);
    const ax = t >= tL ? s.axis : [0, 0, 1];
    const n1 = G.worldToPixel(R, camT, dirTo([P[0] + ax[0] * p.len / 2, P[1] + ax[1] * p.len / 2, P[2] + ax[2] * p.len / 2]));
    const n0 = G.worldToPixel(R, camT, dirTo([P[0] - ax[0] * p.len / 2, P[1] - ax[1] * p.len / 2, P[2] - ax[2] * p.len / 2]));
    if (n1 && n0) {
      const range = Math.hypot(P[0] - eye[0], P[1] - eye[1], P[2] - eye[2]);
      const hw = Math.max(0.5, (p.diam * fa) / range / 2);
      const ax0 = n0.u * k, ay0 = n0.v * k, ax1 = n1.u * k, ay1 = n1.v * k;
      const L2 = (ax1 - ax0) ** 2 + (ay1 - ay0) ** 2;
      const col = o.preset === 'agua' ? [43, 96, 70] : [210, 70, 50];
      for (let y = Math.floor(Math.min(ay0, ay1) - 3); y <= Math.ceil(Math.max(ay0, ay1) + 3); y++) {
        if (y < 0 || y >= ah) continue;
        for (let x = Math.floor(Math.min(ax0, ax1) - 3); x <= Math.ceil(Math.max(ax0, ax1) + 3); x++) {
          if (x < 0 || x >= aw) continue;
          const px = x + 0.5, py = y + 0.5;
          let u = L2 > 0 ? ((px - ax0) * (ax1 - ax0) + (py - ay0) * (ay1 - ay0)) / L2 : 0;
          u = Math.max(0, Math.min(1, u));
          const dd = Math.hypot(px - (ax0 + u * (ax1 - ax0)), py - (ay0 + u * (ay1 - ay0)));
          const cov = Math.max(0, Math.min(1, hw + 0.5 - dd)) * Math.min(1, 2 * hw + 0.3);
          if (cov <= 0) continue;
          const j = (y * aw + x) * 4;
          d[j] += (col[0] - d[j]) * cov; d[j + 1] += (col[1] - d[j + 1]) * cov; d[j + 2] += (col[2] - d[j + 2]) * cov;
        }
      }
    }
  };

  const pipe = new Pipeline({ mode: o.mode, d: o.d, sigD: 0.3, fNorm: o.fUsed, lateralFix: true, sigSensorDeg: 0.3 });
  pipe.setSizes(W, H, aw, ah);
  // Fijar la base: en trípode se toca la rampa en la imagen; en la mano se apunta la cruz.
  const R0 = camR(0, 0);
  if (o.mode === 'tripod') {
    const pp = G.worldToPixel(R0, camT, padDir);
    pipe.setBasePixel(pp.u + (rand() - 0.5) * 3, pp.v + (rand() - 0.5) * 3, sensor(R0));
  } else {
    pipe.setBasePixel(W / 2, H / 2, sensor(G.lookR(padDir, 0)));
  }
  pipe.arm(0);
  const tEnd = tL + Math.min(sim.tLand ?? sim.tEnd, 25) + 0.5;
  let tPrev = 0;
  for (let t = 0; t <= tEnd; t += 1 / 30) {
    const R = camR(t, t - tPrev);
    tPrev = t;
    render(R, t);
    const view = pipe.process({ t, img, Rs: sensor(R) });
    if (onFrame) onFrame({ t, view, pipe, truth: rocketAt(t), tL, R, camT, eye, dirTo, k: aw / W });
    if (pipe.state === 'done') break;
  }
  const P = { d: o.d, sigD: 0.3, base: pipe.base, lateralFix: true, sigSensorDeg: 0.3, f: o.fUsed * H };
  const pts = computeHeights(pipe.samples.map((s) => ({ ...s, t: s.t - (pipe.tLaunch ?? 0) })), P);
  const res = analyze(pts, P);
  // Error de la curva h(t) contra la altura verdadera del centro del cohete.
  // Errores en la parte que importa: desde que el cohete pasa el 30 % del apogeo hasta que vuelve a bajar de él.
  let se = 0, nn = 0, sa = 0, st = 0, nt = 0;
  for (const q of pts) {
    const tt = q.t + (pipe.tLaunch - tL);
    const z = sim.at(tt).p[2];
    if (z < 0.3 * sim.apo) continue;
    se += (q.h - z) ** 2; nn++;
    const td = dirTo(rocketAt(tt + tL).P);
    const a2 = (G.angleBetween(td, G.dirFromElAz(q.el, q.az)) / G.DEG) ** 2;
    sa += a2;
    if (z > 0.7 * sim.apo) { st += a2; nt++; } // cerca del apogeo, que es lo que define el resultado
  }
  // Apogeo "aparente": lo que mediría un instrumento perfecto con un solo observador (incluye el efecto de que el
  // cohete se acerque o se aleje). Separa el error del rastreador del error geométrico inevitable.
  const bTrue = G.elAz(padDir);
  let apparent = -Infinity;
  for (let tt = 0; tt < sim.tEnd; tt += 0.01) {
    const q = G.elAz(dirTo(rocketAt(tt + tL).P));
    const hh = G.heightAt(q.el, q.az, { el0: bTrue.el, az0: bTrue.az }, o.d, true);
    if (hh) apparent = Math.max(apparent, hh.h);
  }
  return {
    truth: sim.apo, apparent, tApoTrue: sim.tApo, res, tLaunchErr: pipe.tLaunch == null ? null : pipe.tLaunch - tL,
    rms: Math.sqrt(se / Math.max(1, nn)), angRms: Math.sqrt(sa / Math.max(1, nn)), angTop: Math.sqrt(st / Math.max(1, nt)), n: pts.length, nAuto: pts.filter((q) => q.src === 'auto').length,
  };
}

