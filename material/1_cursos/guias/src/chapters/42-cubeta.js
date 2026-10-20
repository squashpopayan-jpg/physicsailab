/* Capítulo 42 — Cubeta de ondas casera */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('cubeta-banco', function (sim) {
    const lam = (f, hmm) => MO.lambdaAgua(f, hmm / 1000, EM.local().g);
    const refr = (p) => { const l1 = lam(p.f, p.h), l2 = lam(p.f, Math.min(p.h2, p.h)), t1 = (p.ang * Math.PI) / 180; return { l1, l2, t1, t2: Math.asin(Math.min(1, (Math.sin(t1) * l2) / l1)) }; };
    EM.banco(sim, {
      nombre: 'cubeta', aspect: [1.2, 1.2],
      cols: [{ k: 'h', t: 'h (mm)', d: 1 }, { k: 'f', t: 'f (Hz)', d: 1 }, { k: 'l', t: 'λ (mm)', d: 1 }, { k: 'v', t: 'v (m/s)', d: 3 }],
      controles(sim) {
        sim.group('Cubeta');
        sim.slider('h', { label: 'Profundidad del agua', min: 2, max: 20, step: 0.5, value: 5, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
        sim.slider('h2', { label: 'Profundidad sobre la placa', min: 1, max: 10, step: 0.5, value: 2, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
        sim.slider('f', { label: 'Frecuencia del generador', min: 3, max: 30, step: 0.5, value: 5, unit: 'Hz', fmt: (v) => EM.fix(v, 1) });
        sim.slider('ang', { label: 'Ángulo de incidencia en el borde', min: 0, max: 60, step: 1, value: 40, unit: '°', fmt: (v) => v.toFixed(0) });
      },
      paso() {},
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, R = refr(p), sc = W / 0.2; /* 20 cm de cubeta a lo ancho */
        const k1 = (2 * Math.PI) / (R.l1 * sc), k2 = (2 * Math.PI) / (R.l2 * sc); /* rad por píxel */
        const nx = Math.cos(R.t1), ny = Math.sin(R.t1), tx = Math.sin(R.t1), ty = -Math.cos(R.t1);
        const d2x = Math.cos(R.t2) * nx + Math.sin(R.t2) * tx, d2y = Math.cos(R.t2) * ny + Math.sin(R.t2) * ty;
        const xb = W * 0.42, yb = H / 2, ph = 2 * Math.PI * 0.6 * (st.t || 0);
        const s = 2, w = Math.ceil(W / s), h = Math.ceil(H / s);
        if (!st.off || st.off.width !== w || st.off.height !== h) { st.off = document.createElement('canvas'); st.off.width = w; st.off.height = h; }
        const octx = st.off.getContext('2d'), img = octx.createImageData(w, h), dark = EM.isDark();
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          const X = i * s, Y = j * s, sd = (X - xb) * nx + (Y - yb) * ny;
          /* fase continua en el borde: k1·sen θ1 = k2·sen θ2 */
          const phase = sd < 0 ? k1 * X : k1 * xb + k2 * ((X - xb) * d2x + (Y - yb) * d2y);
          const I = Math.pow(0.5 + 0.5 * Math.cos(phase - ph), 3);
          const c = dark ? 25 + 175 * I : 120 + 135 * I, q = (j * w + i) * 4;
          img.data[q] = sd < 0 ? c * 0.86 : c * 0.8; img.data[q + 1] = sd < 0 ? c * 0.93 : c * 0.97; img.data[q + 2] = sd < 0 ? c : c * 0.86; img.data[q + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(st.off, 0, 0, W, H); ctx.restore();
        const Lb = Math.hypot(W, H);
        D.line(ctx, xb - tx * Lb, yb - ty * Lb, xb + tx * Lb, yb + ty * Lb, { color: '--c2', width: 2, dash: [6, 4] });
        const a = Math.min(W, H) * 0.18;
        D.arrow(ctx, W * 0.1, H * 0.34, W * 0.1 + a, H * 0.34, { color: '#FFD54A', width: 2.4 });
        const cx = xb + tx * H * 0.1 + nx * W * 0.2, cy = yb + ty * H * 0.1 + ny * W * 0.2;
        D.arrow(ctx, cx, cy, cx + d2x * a, cy + d2y * a, { color: '#FFD54A', width: 2.4 });
        const halo = 'rgba(0,0,0,0.55)';
        EM.text(ctx, 'zona profunda: ' + EM.fix(p.h, 1) + ' mm · λ₁ = ' + EM.fix(R.l1 * 1000, 1) + ' mm', 8, 16, { color: '#FFFFFF', halo, weight: 650, size: 11.5 });
        EM.text(ctx, 'sobre la placa: ' + EM.fix(Math.min(p.h2, p.h), 1) + ' mm · λ₂ = ' + EM.fix(R.l2 * 1000, 1) + ' mm', W - 8, H - 10, { align: 'right', color: '#FFFFFF', halo, weight: 650, size: 11.5 });
        EM.text(ctx, 'θ₁ = ' + p.ang.toFixed(0) + '° → θ₂ = ' + EM.fix((R.t2 * 180) / Math.PI, 1) + '°', 8, 36, { color: '#FFD54A', halo, weight: 700, size: 12 });
      },
      medir(p, rnd) { const l = lam(p.f, p.h), l5 = L.quant(5 * l * 1000 + rnd.gauss(0, 1), 0.5); return { h: p.h, f: p.f, l: l5 / 5, v: (l5 / 5000) * p.f }; },
      serie(p, rnd, st) { const out = []; for (const f of [4, 5, 6, 8, 10, 15, 20]) out.push(this.medir(Object.assign({}, p, { f }), rnd, st)); return out; },
      grafica(rows, p) {
        const g = EM.local().g, r = rows.filter((x) => Math.abs(x.h - p.h) < 1e-9), c0 = Math.sqrt((g * p.h) / 1000);
        return {
          x: r.map((x) => x.f), y: r.map((x) => x.v), xl: 'f (Hz)', yl: 'v (m/s)', ajuste: null, xr: [0, 30], yextra: [0, c0 * 1.25, 0.3],
          curvas: [{ f: (f) => (f < 0.5 ? c0 : lam(f, p.h) * f), color: '--ink-3' }, { f: () => c0, color: '--c3', dash: [2, 4] }],
          leyenda: [{ label: 'datos', color: '--accent', kind: 'dot' }, { label: 'dispersión completa', color: '--ink-3', dash: [5, 4], width: 1.4 }, { label: '√(gh)', color: '--c3', dash: [2, 4], width: 1.4 }], esquina: 'br'
        };
      },
      resultado(fit, rows, p) {
        const g = EM.local().g, R = refr(p);
        return [
          ['l', 'λ₁ profunda / λ₂ sobre la placa', EM.fix(R.l1 * 1000, 1) + ' / ' + EM.fix(R.l2 * 1000, 1) + ' mm', true],
          ['v', 'v = λf frente a √(gh)', EM.fix(R.l1 * p.f, 3) + ' frente a ' + EM.fix(Math.sqrt((g * p.h) / 1000), 3) + ' m/s'],
          ['r', 'Ángulo refractado (sen θ₂ = sen θ₁·λ₂/λ₁)', EM.fix((R.t2 * 180) / Math.PI, 1) + '°']
        ];
      }
    });
  });
})();
