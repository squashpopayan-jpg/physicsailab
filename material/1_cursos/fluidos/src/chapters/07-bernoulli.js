/* Capítulo 7 — La ecuación de Bernoulli */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, W = FL.water;

  /* 7.1 Tubo de Pitot */
  EM.defineSim('pitot', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V', { label: 'Velocidad verdadera', min: 5, max: 250, step: 1, value: 60, unit: 'm/s', fmt: (v) => v.toFixed(0) });
    sim.slider('z', { label: 'Altitud (atmósfera estándar)', min: 0, max: 12000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.out('dp', 'Presión medida <i>p</i>₀ − <i>p</i> (compresible)', { hl: true });
    sim.out('ias', 'Velocidad indicada (calibrada con ρ al nivel del mar)');
    sim.out('M', 'Número de Mach');
    sim.out('err', 'Error de ½ρ<i>V</i>² frente a la exacta');
    const dpc = (V, a) => { const M = V / a.a; return a.P * (Math.pow(1 + 0.2 * M * M, 3.5) - 1); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const a = FL.atm(p.z), a0 = FL.atm(0);
      const dp = dpc(p.V, a), dpi = 0.5 * a.rho * p.V * p.V;
      /* velocidad indicada: la que da el mismo Δp con la fórmula compresible al nivel del mar */
      const ias = FL.bisect((v) => dpc(v, a0) - dp, 0, 400, 1e-10);
      /* tubo */
      const y0 = H * 0.22, x0 = 30, x1 = Wc * 0.45;
      for (let k = 0; k < 7; k++) { const yy = y0 - 40 + k * 13; EM.draw.arrow(ctx, 10, yy, 60, yy, { color: '--grid-2', width: 1.2 }); }
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(x0 + 40, y0 - 5, x1 - x0 - 40, 10);
      ctx.beginPath(); ctx.arc(x0 + 40, y0, 5, Math.PI / 2, (3 * Math.PI) / 2); ctx.fill();
      ctx.fillRect(x1 - 10, y0, 10, H * 0.25);
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(x0 + 36, y0, 3, 0, 7); ctx.fill();
      for (const xx of [x0 + 110, x0 + 130]) { ctx.fillStyle = EM.col('--c1'); ctx.fillRect(xx, y0 - 6, 3, 2); ctx.fillRect(xx, y0 + 4, 3, 2); }
      EM.text(ctx, 'p₀ (punta)', x0 + 30, y0 - 14, { size: 11, color: '--c2' });
      EM.text(ctx, 'p (orificios laterales)', x0 + 100, y0 + 22, { size: 11, color: '--c1' });
      /* manómetro de agua (Δp en mm de columna, escalado) */
      const mh = Math.min(H * 0.45, (dp / (998.2 * g)) * 1000 * 0.25), mx = x1 - 50, my = H * 0.82;
      ctx.fillStyle = EM.alpha('--water', 0.55); ctx.fillRect(mx - 30, my - 40 + mh / 2, 8, 60 - mh / 2); ctx.fillRect(mx + 22, my - 40 - mh / 2, 8, 60 + mh / 2);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.2; ctx.strokeRect(mx - 31, my - 40 - H * 0.24, 10, 60 + H * 0.24); ctx.strokeRect(mx + 21, my - 40 - H * 0.24, 10, 60 + H * 0.24);
      EM.text(ctx, EM.fix((dp / (998.2 * g)) * 1000, 0) + ' mm de agua', mx, my + 36, { size: 11.5, align: 'center', color: '--ink-2' });
      /* gráfica */
      const pl = new EM.Plot(ctx, { x: Wc * 0.48, y: 0, w: Wc * 0.52, h: H, xmin: 0, xmax: 250, ymin: 0, ymax: 45, xlabel: 'velocidad verdadera (m/s)', ylabel: 'p₀ − p (kPa)' });
      pl.frame();
      pl.fn((v) => dpc(v, a0) / 1000, { color: '--ink-3', width: 1.6 });
      pl.fn((v) => dpc(v, a) / 1000, { color: '--accent', width: 2.4 });
      pl.fn((v) => (0.5 * a.rho * v * v) / 1000, { color: '--accent', width: 1.4, dash: [5, 4] });
      pl.dot(p.V, dp / 1000, { color: '--accent', r: 6 });
      pl.legend([{ label: 'nivel del mar', color: '--ink-3' }, { label: 'altitud elegida (exacta)', color: '--accent' }, { label: '½ρV² (incompresible)', color: '--accent', dash: [5, 4] }], 'tl');
      sim.set('dp', EM.fix(dp, 0) + ' Pa (ρ = ' + EM.fix(a.rho, 3) + ' kg/m³)');
      sim.set('ias', EM.fix(ias, 1) + ' m/s = ' + EM.fix(ias * 3.6, 0) + ' km/h (verdadera ' + EM.fix(p.V * 3.6, 0) + ' km/h)');
      sim.set('M', EM.fix(p.V / a.a, 3));
      sim.set('err', EM.fix((100 * (dp - dpi)) / dp, 2) + ' %');
    });
  });

  /* 7.2 Vaciado de un tanque (Torricelli) */
  EM.defineSim('torricelli', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.seg('shape', { label: 'Recipiente', options: [['cil', 'Cilindro'], ['clep', 'Clepsidra (r ∝ h¹ᐟ⁴)']], value: 'cil' });
    sim.slider('D', { label: 'Diámetro del tanque (máximo)', min: 0.3, max: 2, step: 0.05, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('d', { label: 'Diámetro del orificio', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('h0', { label: 'Nivel inicial sobre el orificio', min: 0.3, max: 3, step: 0.05, value: 2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('Cd', { label: 'Coeficiente de descarga', min: 0.6, max: 1, step: 0.01, value: 0.61, fmt: (v) => v.toFixed(2) });
    sim.out('t', 'Tiempo transcurrido', { hl: true });
    sim.out('tv', 'Tiempo total de vaciado');
    sim.out('V', 'Velocidad del chorro');
    const y0 = 1.0;
    let t = 0, h;
    const reset = () => { t = 0; h = sim.p.h0; };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    const area = (hh) => { const p = sim.p, R = p.D / 2; if (p.shape === 'cil') return Math.PI * R * R; const r = R * Math.pow(Math.max(hh, 1e-9) / p.h0, 0.25); return Math.PI * r * r; };
    const tTotal = () => { const p = sim.p, a = (Math.PI * Math.pow(p.d / 100, 2)) / 4; if (p.shape === 'cil') return FL.drainTime(area(1), a, p.Cd, p.h0); return (p.h0 * Math.PI * Math.pow(p.D / 2, 2)) / Math.sqrt(p.h0) / (p.Cd * a * Math.sqrt(2 * g)); };
    sim.animate((dt) => {
      const p = sim.p, a = (Math.PI * Math.pow(p.d / 100, 2)) / 4, T = tTotal(), sp = T / 14, n = 50, hh = (dt * sp) / n;
      for (let i = 0; i < n && h > 0; i++) { h -= (hh * p.Cd * a * Math.sqrt(2 * g * Math.max(h, 0))) / area(h); t += hh; }
      if (h <= 1e-6) { h = 0; }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, R = p.D / 2;
      EM.draw.clear(cv);
      const V = Math.sqrt(2 * g * Math.max(h, 0)), reach = 2 * Math.sqrt(Math.max(h, 0) * y0);
      const xmax = Math.max(R * 2 + 4.5, 2 * R + 2 * Math.sqrt(p.h0 * y0) + 0.5), v = EM.flow.view({ x: 6, y: 6, w: Wc * 0.55 - 12, h: H - 12 }, -0.2, xmax, -0.1, y0 + p.h0 + 0.3);
      ctx.fillStyle = EM.alpha('--sand', 0.35); ctx.fillRect(v.X(-0.2), v.Y(0), v.X(xmax) - v.X(-0.2), 8);
      /* recipiente */
      const prof = (hh) => (p.shape === 'cil' ? R : R * Math.pow(Math.max(hh, 0) / p.h0, 0.25));
      const left = [], right = [];
      for (let i = 0; i <= 40; i++) { const hh = (p.h0 * 1.05 * i) / 40; left.push([R - prof(hh), y0 + hh]); right.push([R + prof(hh), y0 + hh]); }
      const water = [];
      for (let i = 0; i <= 40; i++) { const hh = (h * i) / 40; water.push(v.map(R + prof(hh), y0 + hh)); }
      for (let i = 40; i >= 0; i--) { const hh = (h * i) / 40; water.push(v.map(R - prof(hh), y0 + hh)); }
      if (h > 0) EM.flow.waterFill(ctx, water, { alpha: 0.4 });
      EM.flow.drawPath(ctx, left, v.map, { color: '--ink-2', width: 2.2 }); EM.flow.drawPath(ctx, right, v.map, { color: '--ink-2', width: 2.2 });
      EM.flow.drawPath(ctx, [[R - prof(0), y0], [R + prof(0), y0]], v.map, { color: '--ink-2', width: 2.2 });
      EM.flow.drawPath(ctx, [[R + prof(0), y0], [R + prof(0), 0]], v.map, { color: '--ink-3', width: 1.2, dash: [3, 3] });
      if (h > 0.002) { const jet = []; for (let i = 0; i <= 40; i++) { const tt = (Math.sqrt((2 * y0) / g) * i) / 40; jet.push([R + prof(0) + V * tt, y0 + 0.02 - 0.5 * g * tt * tt]); } EM.flow.drawPath(ctx, jet, v.map, { color: '--water', width: 3 }); }
      /* gráfica h(t) */
      const T = tTotal();
      const pl = new EM.Plot(ctx, { x: Wc * 0.56, y: 0, w: Wc * 0.44, h: H, xmin: 0, xmax: (T / 60) * 1.05, ymin: 0, ymax: p.h0 * 1.05, xlabel: 't (min)', ylabel: 'h (m)' });
      pl.frame();
      const a = (Math.PI * Math.pow(p.d / 100, 2)) / 4;
      if (p.shape === 'cil') pl.fn((tm) => { const s = Math.sqrt(p.h0) - ((p.Cd * a * Math.sqrt(2 * g)) / (2 * area(1))) * tm * 60; return s > 0 ? s * s : 0; }, { color: '--c1', width: 2 });
      else pl.fn((tm) => Math.max(0, p.h0 * (1 - (tm * 60) / T)), { color: '--c1', width: 2 });
      pl.dot(t / 60, Math.max(0, h), { color: '--accent', r: 6 });
      sim.set('t', EM.fix(t / 60, 2) + ' min');
      sim.set('tv', EM.fix(T / 60, 2) + ' min');
      sim.set('V', EM.fix(V, 2) + ' m/s · alcance ' + EM.fix(reach, 2) + ' m');
    });
  });

  /* 7.3 Venturi */
  EM.defineSim('venturi', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Q', { label: 'Caudal de agua', min: 1, max: 40, step: 0.1, value: 12.6, unit: 'L/s', fmt: (v) => v.toFixed(1) });
    sim.slider('beta', { label: 'β = <i>d</i>/<i>D</i> (D = 10 cm)', min: 0.3, max: 0.8, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('p1', { label: 'Presión absoluta a la entrada', min: 60, max: 300, step: 1, value: 150, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura del agua', min: 5, max: 90, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('dp', 'Caída de presión entrada–garganta', { hl: true });
    sim.out('pt', 'Presión absoluta en la garganta');
    sim.out('loss', 'Pérdida permanente (difusor)');
    sim.out('cav', 'Cavitación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, T = p.T + 273.15, rho = W.rho(T), pv = W.psat(T);
      EM.draw.clear(cv);
      const D = 0.1, d = p.beta * D, Q = p.Q / 1000;
      const L1 = 0.15, L2 = 0.12, L3 = 0.06, L4 = 0.35, L5 = 0.12, Lt = L1 + L2 + L3 + L4 + L5;
      const Dx = (x) => { if (x < L1) return D; if (x < L1 + L2) return D - (D - d) * ((x - L1) / L2); if (x < L1 + L2 + L3) return d; if (x < L1 + L2 + L3 + L4) return d + (D - d) * ((x - L1 - L2 - L3) / L4); return D; };
      const V = (x) => Q / ((Math.PI * Dx(x) * Dx(x)) / 4), V1 = V(0), Vt = V(L1 + L2 + 0.01);
      /* presión: ideal en la contracción; pérdida 10 % de la carga dinámica de la garganta repartida en el difusor */
      const Kd = 0.1, xs = L1 + L2 + L3;
      const pr = (x) => { const ideal = p.p1 * 1000 + 0.5 * rho * (V1 * V1 - V(x) * V(x)); const f = Math.min(1, Math.max(0, (x - xs) / L4)); return ideal - Kd * 0.5 * rho * Vt * Vt * f; };
      const sx = (Wc - 40) / Lt, cy = H * 0.72, sy = (H * 0.3) / D;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = (Lt * i) / 200; ctx.lineTo(20 + x * sx, cy - (Dx(x) / 2) * sy); }
      for (let i = 200; i >= 0; i--) { const x = (Lt * i) / 200; ctx.lineTo(20 + x * sx, cy + (Dx(x) / 2) * sy); }
      ctx.closePath(); ctx.fillStyle = EM.alpha('--water', 0.3); ctx.fill(); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.stroke();
      /* piezómetros: altura = (p − p_atm)/ρg, con p_atm = 81.9 kPa (Popayán); escala común */
      const stations = [0.07, L1 + 0.06, L1 + L2 + 0.03, L1 + L2 + L3 + 0.12, L1 + L2 + L3 + 0.24, Lt - 0.06];
      const hmax = (p.p1 * 1000 - 81900 + 0.5 * rho * V1 * V1) / (rho * g), ks = (cy - (D / 2) * sy - 34) / Math.max(0.5, hmax); /* carga total a 34 px del borde */
      const H0 = (p.p1 * 1000 + 0.5 * rho * V1 * V1 - 81900) / (rho * g);
      for (const x of stations) {
        const px = 20 + x * sx, top = cy - (Dx(x) / 2) * sy, hcol = (pr(x) - 81900) / (rho * g);
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.strokeRect(px - 4, 22, 8, top - 22);
        if (hcol > 0) { ctx.fillStyle = EM.alpha('--water', 0.6); ctx.fillRect(px - 3, Math.max(22, top - hcol * ks), 6, Math.min(top - 22, hcol * ks)); }
        EM.text(ctx, EM.fix(pr(x) / 1000, 1), px, 16, { size: 10.5, align: 'center', color: '--ink-2' });
      }
      ctx.setLineDash([6, 4]); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const x = (Lt * i) / 100, f = Math.min(1, Math.max(0, (x - xs) / L4)), Hx = H0 - (Kd * 0.5 * Vt * Vt * f) / g; const yy = cy - (Dx(x) / 2) * sy - Hx * ks; i ? ctx.lineTo(20 + x * sx, yy) : ctx.moveTo(20 + x * sx, yy); }
      ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'carga total', Wc - 30, cy - (D / 2) * sy - H0 * ks - 6, { size: 11, color: '--c2', align: 'right', halo: true });
      const dp = pr(0) - pr(L1 + L2 + 0.03), ptr = pr(L1 + L2 + 0.03);
      sim.set('dp', EM.fix(dp / 1000, 2) + ' kPa (V garganta ' + EM.fix(Vt, 2) + ' m/s)');
      sim.set('pt', EM.fix(ptr / 1000, 2) + ' kPa (p_v = ' + EM.fix(pv / 1000, 2) + ' kPa)');
      sim.set('loss', EM.fix((Kd * 0.5 * rho * Vt * Vt) / 1000, 2) + ' kPa');
      sim.set('cav', ptr <= pv ? '<span class="warnv">sí: la garganta hierve</span>' : 'no');
    });
  });

  /* 7.4 Sifón */
  EM.defineSim('sifon', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('h2', { label: 'Altura de la cresta sobre la superficie', min: 0.2, max: 11, step: 0.05, value: 4, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('h3', { label: 'Profundidad de la salida bajo la superficie', min: 0.3, max: 8, step: 0.05, value: 2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('z', { label: 'Altitud del lugar', min: 0, max: 4000, step: 10, value: 0, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura del agua', min: 5, max: 90, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('V', 'Velocidad en el tubo', { hl: true });
    sim.out('p2', 'Presión absoluta en la cresta');
    sim.out('max', 'Altura máxima de la cresta para este caudal');
    sim.out('st', 'Estado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, T = p.T + 273.15, rho = W.rho(T), pv = W.psat(T), Pa = FL.atm(p.z).P;
      EM.draw.clear(cv);
      const V = Math.sqrt(2 * g * p.h3), q = 0.5 * rho * V * V;
      const pz = (z) => Pa - rho * g * z - q; /* z respecto a la superficie, dentro del tubo en movimiento */
      const p2 = pz(p.h2), hmax = (Pa - pv - q) / (rho * g), ok = p2 > pv;
      const v = EM.flow.view({ x: 10, y: 10, w: Wc - 20, h: H - 20 }, -1.5, 7.5, -Math.max(p.h3, 3) - 0.8, Math.max(p.h2, Math.min(Math.max(hmax, 0), 11.5)) + 1);
      /* depósito */
      EM.flow.waterRect(ctx, v.X(-1.5), v.Y(0), v.X(2) - v.X(-1.5), v.Y(-3) - v.Y(0));
      EM.flow.tank(ctx, v.X(-1.5), v.Y(1), v.X(2) - v.X(-1.5), v.Y(-3) - v.Y(1));
      /* tubo: entrada a −2, sube a la cresta en x = 3, baja a −h3 en x = 6.5 */
      const path = [[0.8, -2], [0.8, p.h2 - 0.6], [1.4, p.h2], [3.6, p.h2], [4.2, p.h2 - 0.6], [4.2, -p.h3]];
      const pts = [];
      for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < 20; k++) { const s = k / 20; pts.push([path[i][0] + s * (path[i + 1][0] - path[i][0]), path[i][1] + s * (path[i + 1][1] - path[i][1])]); }
      pts.push(path[path.length - 1]);
      for (let i = 0; i < pts.length - 1; i++) {
        const z = 0.5 * (pts[i][1] + pts[i + 1][1]), pp = pz(z);
        const tcol = Math.min(1, Math.max(0, (pp - pv) / (Pa + rho * g * 3)));
        ctx.strokeStyle = !ok && z > hmax ? EM.col('--c2') : EM.rgbStr(EM.cmap.viridis(tcol));
        ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...v.map(pts[i])); ctx.lineTo(...v.map(pts[i + 1])); ctx.stroke();
      }
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(-1.5), v.Y(0)); ctx.lineTo(v.X(8.5), v.Y(0)); ctx.stroke();
      if (hmax > 0) { ctx.strokeStyle = EM.col('--c2'); ctx.beginPath(); ctx.moveTo(v.X(0.5), v.Y(hmax)); ctx.lineTo(v.X(5), v.Y(hmax)); ctx.stroke(); EM.text(ctx, 'límite de cavitación', v.X(5) + 6, v.Y(hmax) + 4, { size: 11, color: '--c2' }); }
      ctx.setLineDash([]);
      if (ok) for (let k = 0; k < 6; k++) EM.draw.arrow(ctx, v.X(4.2), v.Y(-p.h3 - 0.1), v.X(4.2), v.Y(-p.h3 - 0.9), { color: '--water', width: 2 });
      EM.text(ctx, 'superficie', v.X(-1.4), v.Y(0) - 6, { size: 11, color: '--ink-3' });
      sim.set('V', ok ? EM.fix(V, 2) + ' m/s' : '0 (el sifón se corta)');
      sim.set('p2', EM.fix(p2 / 1000, 2) + ' kPa (vapor: ' + EM.fix(pv / 1000, 2) + ' kPa; atmósfera: ' + EM.fix(Pa / 1000, 1) + ' kPa)');
      sim.set('max', EM.fix(hmax, 2) + ' m');
      sim.set('st', ok ? 'funciona' : '<span class="warnv">cavita en la cresta: se forma vapor y el flujo se interrumpe</span>');
    });
  });
})();
