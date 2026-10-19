/* Apéndice A · Analizador de datos reales (CSV de phyphox, ESP32, App Inventor o tablas) */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const gs = (s) => M.gauss(0, s);
  const TAU = 2 * Math.PI;

  /* ---------- Archivos de ejemplo (sintéticos, con el ruido típico de cada sensor) ---------- */
  const EX = {
    pend: {
      name: 'péndulo, giroscopio de phyphox',
      preset: { cy: 3, a: 7, b: 100, mod: 'dsin', g2: 'res', sm: 1 },
      gen() {
        const r = ['"Time (s)","Gyroscope x (rad/s)","Gyroscope y (rad/s)","Gyroscope z (rad/s)"'];
        for (let i = 0; i < 2000; i++) {
          const t = i * 0.01 + 0.0042, s = t - 1.31;
          const wz = s < 0 ? gs(0.004) : -1.84 * Math.exp(-0.036 * s) * Math.sin(TAU * 0.6172 * s) + gs(0.006);
          r.push([t.toFixed(4), (gs(0.006) + 0.03 * Math.sin(TAU * 1.234 * t) * (s > 0)).toFixed(5), gs(0.006).toFixed(5), wz.toFixed(5)].join(','));
        }
        return r.join('\n');
      }
    },
    carro: {
      name: 'carrito en rampa, HC-SR04 con ESP32',
      preset: { cy: 1, a: 20, b: 76, mod: 'quad', g2: 'res', sm: 1 },
      gen() {
        const r = ['t (s),d (m)'];
        for (let i = 0; i <= 90; i++) {
          const t = i * 0.04, s = Math.max(0, t - 0.62);
          let d = Math.min(1.62, 0.214 + 0.5 * 0.412 * s * s) + gs(0.002);
          if (Math.random() < 0.02) d += 0.04 + 0.05 * Math.random();
          r.push(`${t.toFixed(3)},${d.toFixed(4)}`);
        }
        return r.join('\n');
      }
    },
    rc: {
      name: 'descarga RC, ADC de la ESP32 (punto y coma, coma decimal)',
      preset: { cy: 1, a: 8, b: 100, mod: 'exp', g2: 'res', sm: 1 },
      gen() {
        const r = ['t (s);V (V)'];
        for (let i = 0; i < 260; i++) {
          const t = i * 0.01, s = t - 0.2;
          let v = s < 0 ? 3.28 : 3.28 * Math.exp(-s / 0.47);
          v = Math.max(0.075, v + gs(0.006));
          v = Math.round(v / (3.3 / 4095)) * (3.3 / 4095);
          r.push(`${t.toFixed(2).replace('.', ',')};${v.toFixed(4).replace('.', ',')}`);
        }
        return r.join('\n');
      }
    },
    baro: {
      name: 'barómetro del celular subiendo tres pisos',
      preset: { cy: 1, a: 17, b: 31, mod: 'lin', g2: 'der', sm: 21 },
      gen() {
        const r = ['"Time (s)","Pressure (hPa)"'];
        const z = (t) => { const tr = [[15, 0], [33, 3], [43, 3], [61, 6], [71, 6], [89, 9]]; if (t <= 15) return 0; for (let k = 1; k < tr.length; k++) if (t <= tr[k][0]) { const [t0, z0] = tr[k - 1], [t1, z1] = tr[k]; return z0 + ((z1 - z0) * (t - t0)) / (t1 - t0); } return 9; };
        for (let i = 0; i < 1100; i++) { const t = i * 0.1; const p = 822.4 - (0.98 * 9.777 * z(t)) / 100 + 0.0004 * t + gs(0.012); r.push(`${t.toFixed(2)},${p.toFixed(4)}`); }
        return r.join('\n');
      }
    },
    ohm: {
      name: 'tabla V–I de un resistor (tabulador)',
      preset: { cy: 1, a: 0, b: 100, mod: 'prop', g2: 'res', sm: 1 },
      gen() {
        const r = ['V (V)\tI (mA)'], R = 1000 * (1 + gs(0.01));
        for (let i = 1; i <= 10; i++) { const v = 0.3 * i + gs(0.004); r.push(`${v.toFixed(3)}\t${((v / R) * 1000 + gs(0.006)).toFixed(3)}`); }
        return r.join('\n');
      }
    },
    ruido: {
      name: 'celular quieto: ruido del acelerómetro',
      preset: { cy: 1, a: 0, b: 100, mod: 'none', g2: 'hist', sm: 1 },
      gen() {
        const r = ['"Time (s)","Linear Acceleration z (m/s^2)"'];
        for (let i = 0; i < 1500; i++) r.push(`${(i * 0.0101).toFixed(4)},${(0.004 + gs(0.0125)).toFixed(5)}`);
        return r.join('\n');
      }
    }
  };
  const MODELS = [['none', 'Sin ajuste'], ['lin', 'Recta: y = a + b·x'], ['prop', 'Proporcional: y = b·x'], ['quad', 'Parábola: y = a + b·x + c·x²'], ['pow', 'Potencia: y = a·xᵇ'], ['exp', 'Exponencial: y = A·e^(−(x−x₀)/τ) + C'], ['sin', 'Seno: y = A·sen(2πf(x−x₀)+φ) + C'], ['dsin', 'Seno amortiguado: A·e^(−β(x−x₀))·sen(…) + C']];

  /* ---------- Unidades a partir de los encabezados «nombre (unidad)» ---------- */
  const unitOf = (h) => { const m = String(h).match(/\(([^()]*)\)\s*$/); return m ? m[1].trim().replace(/\^\(?(-?\d+)\)?/g, (_, d) => MC.sup(+d)) : ''; };
  const nameOf = (h) => String(h).replace(/\s*\([^()]*\)\s*$/, '').trim() || String(h);
  const par = (u) => (/[/·*]/.test(u) ? '(' + u + ')' : u);
  const uDiv = (a, b) => { if (!b) return a; if (!a) return b === 's' ? 'Hz' : '1/' + b; if (a.endsWith('/' + b)) return a + '²'; return par(a) + '/' + b; };
  const uDiv2 = (a, b) => (b ? (a ? par(a) : '1') + '/' + b + '²' : a);
  const uInv = (u) => (u === 's' ? 'Hz' : u ? '1/' + u : '');
  const uRate = (u) => (u === 's' ? 's⁻¹' : u ? '1/' + u : '');

  /* Polinomio de grado 1 o 2 con x centrada y escalada; devuelve coeficientes en x original y su covarianza */
  function polyFit(xs, ys, deg) {
    const n = xs.length, k = deg + 1;
    if (n < k + 1) return null;
    const xm = M.mean(xs), sx = M.std(xs) || 1;
    const A = Array.from({ length: k }, () => new Array(k).fill(0)), B = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const X = (xs[i] - xm) / sx, pw = [1, X, X * X, X * X * X, X * X * X * X];
      for (let r = 0; r < k; r++) { B[r] += pw[r] * ys[i]; for (let c = 0; c < k; c++) A[r][c] += pw[r + c]; }
    }
    const al = L.solve(A, B), inv = L.inverse(A);
    if (!al || !inv) return null;
    const fS = (x) => { const X = (x - xm) / sx; let s = 0, p = 1; for (let j = 0; j < k; j++) { s += al[j] * p; p *= X; } return s; };
    let ssr = 0;
    for (let i = 0; i < n; i++) { const r = ys[i] - fS(xs[i]); ssr += r * r; }
    const s2 = ssr / (n - k);
    const cov = inv.map((r) => r.map((v) => v * s2));
    /* α → coeficientes en x: y = Σ c_j x^j */
    let J;
    if (deg === 1) J = [[1, -xm / sx], [0, 1 / sx]];
    else J = [[1, -xm / sx, (xm * xm) / (sx * sx)], [0, 1 / sx, (-2 * xm) / (sx * sx)], [0, 0, 1 / (sx * sx)]];
    const c = J.map((row) => row.reduce((s, v, j) => s + v * al[j], 0));
    const C = J.map((ri) => J.map((rj) => { let s = 0; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) s += ri[a] * cov[a][b] * rj[b]; return s; }));
    return { c, C, f: fS };
  }
  const thin = (xs, ys, max) => { if (xs.length <= max) return [xs, ys]; const st = Math.ceil(xs.length / max), a = [], b = []; for (let i = 0; i < xs.length; i += st) { a.push(xs[i]); b.push(ys[i]); } return [a, b]; };
  const mm = (a) => { let lo = Infinity, hi = -Infinity; for (const v of a) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; };
  const medDt = (xs) => { if (xs.length < 3) return NaN; const d = []; for (let i = 1; i < xs.length; i++) d.push(xs[i] - xs[i - 1]); d.sort((p, q) => p - q); return d[d.length >> 1]; };

  /* ---------- Ajustes ---------- */
  function doFit(mod, xs, ys, ux, uy) {
    const n = xs.length, x0 = xs[0];
    const P = (name, v, s, u) => ({ name, v, s, u });
    let out = null;
    if (mod === 'lin') {
      const r = polyFit(xs, ys, 1);
      if (!r) return { err: 'Hacen falta al menos 3 puntos.' };
      const [a, b] = r.c, sa = Math.sqrt(r.C[0][0]), sb = Math.sqrt(r.C[1][1]);
      const xi = -a / b, sxi = Math.abs(xi) * Math.sqrt(r.C[0][0] / (a * a) + r.C[1][1] / (b * b) - (2 * r.C[0][1]) / (a * b));
      out = { f: (x) => a + b * x, params: [P('a', a, sa, uy), P('b (pendiente)', b, sb, uDiv(uy, ux))], extra: [P('corte con el eje x, −a/b', xi, isFinite(sxi) ? sxi : 0, ux)] };
    } else if (mod === 'prop') {
      const r = L.fitProp(xs, ys);
      if (!r || !isFinite(r.m)) return { err: 'No se pudo ajustar.' };
      out = { f: r.f, params: [P('b (pendiente)', r.m, r.sm, uDiv(uy, ux))], extra: [P('1/b', 1 / r.m, r.sm / (r.m * r.m), uDiv(ux, uy))] };
    } else if (mod === 'quad') {
      const r = polyFit(xs, ys, 2);
      if (!r) return { err: 'Hacen falta al menos 4 puntos.' };
      const [a, b, c] = r.c, s = r.C.map((q, i) => Math.sqrt(q[i]));
      out = { f: (x) => a + b * x + c * x * x, params: [P('a', a, s[0], uy), P('b', b, s[1], uDiv(uy, ux)), P('c', c, s[2], uDiv2(uy, ux))], extra: [P('2c (aceleración si x es el tiempo)', 2 * c, 2 * s[2], uDiv2(uy, ux))] };
    } else if (mod === 'pow') {
      const px = [], py = [];
      for (let i = 0; i < n; i++) if (xs[i] > 0 && ys[i] !== 0) { px.push(xs[i]); py.push(ys[i]); }
      if (px.length < 3) return { err: 'La potencia necesita al menos 3 puntos con x > 0.' };
      const sg = Math.sign(M.mean(py)) || 1;
      const ll = L.fitLine(px.map(Math.log), py.map((y) => Math.log(Math.abs(y))));
      const [tx, ty] = thin(px, py, 3000);
      const r = L.fitLM((x, p) => p[0] * Math.pow(x, p[1]), [sg * Math.exp(ll.b), ll.m], tx, ty);
      if (!r) return { err: 'El ajuste no convergió.' };
      out = { f: (x) => (x > 0 ? r.p[0] * Math.pow(x, r.p[1]) : NaN), params: [P('a', r.p[0], r.sp[0], ''), P('b (exponente)', r.p[1], r.sp[1], '')], extra: [], note: 'Pendiente de la recta en escala log–log: ' + MC.fix(ll.m, 4) };
    } else if (mod === 'exp') {
      if (n < 5) return { err: 'Hacen falta al menos 5 puntos.' };
      const m10 = Math.max(1, Math.round(n * 0.1));
      const C0 = M.mean(ys.slice(n - m10)), A0 = M.mean(ys.slice(0, Math.min(5, n))) - C0;
      let tau0 = (xs[n - 1] - x0) / 3;
      for (let i = 0; i < n; i++) if (Math.abs(ys[i] - C0) < Math.abs(A0) / Math.E) { tau0 = Math.max(xs[i] - x0, 1e-9); break; }
      const [tx, ty] = thin(xs, ys, 3000);
      const model = (x, p) => p[0] * Math.exp(-(x - x0) / p[1]) + p[2];
      const r = L.fitLM(model, [A0, tau0, C0], tx, ty);
      if (!r) return { err: 'El ajuste no convergió.' };
      out = { f: (x) => model(x, r.p), params: [P('A', r.p[0], r.sp[0], uy), P('τ', r.p[1], r.sp[1], ux), P('C', r.p[2], r.sp[2], uy)], extra: [P('semivida τ·ln 2', r.p[1] * Math.LN2, r.sp[1] * Math.LN2, ux)] };
    } else if (mod === 'sin' || mod === 'dsin') {
      if (n < 8) return { err: 'Hacen falta al menos 8 puntos.' };
      const dt = medDt(xs), span = xs[n - 1] - x0;
      const sp = L.spectrum(ys, dt, { pad: 4 });
      const f0 = isFinite(sp.peak) && sp.peak > 0 ? sp.peak : 1 / span;
      const C0 = M.mean(ys), A0 = Math.SQRT2 * M.std(ys);
      const [tx, ty] = thin(xs, ys, 2500);
      const ms = (x, p) => p[0] * Math.sin(TAU * p[1] * (x - x0) + p[2]) + p[3];
      let best = null;
      for (const ph of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) { const r = L.fitLM(ms, [A0, f0, ph, C0], tx, ty); if (r && (!best || r.chi2 < best.chi2)) best = r; }
      if (!best) return { err: 'El ajuste no convergió.' };
      let model = ms, r = best;
      if (mod === 'dsin') {
        const md = (x, p) => p[0] * Math.exp(-p[4] * (x - x0)) * Math.sin(TAU * p[1] * (x - x0) + p[2]) + p[3];
        let bd = null;
        for (const k of [0.3, 1.5, 4]) { const b0 = k / span; const q = L.fitLM(md, [best.p[0] * (1 + b0 * span / 2), best.p[1], best.p[2], best.p[3], b0], tx, ty); if (q && (!bd || q.chi2 < bd.chi2)) bd = q; }
        if (!bd) return { err: 'El ajuste no convergió.' };
        model = md; r = bd;
      }
      const p = r.p.slice();
      if (p[0] < 0) { p[0] = -p[0]; p[2] += Math.PI; }
      if (p[1] < 0) { p[1] = -p[1]; p[2] = Math.PI - p[2]; }
      p[2] = ((p[2] % TAU) + 3 * Math.PI) % TAU - Math.PI;
      const params = [P('A', p[0], r.sp[0], uy), P('f', p[1], r.sp[1], uInv(ux)), P('φ', p[2], r.sp[2], 'rad'), P('C', p[3], r.sp[3], uy)];
      const extra = [P('periodo T = 1/f', 1 / p[1], r.sp[1] / (p[1] * p[1]), ux), P('ω = 2πf', TAU * p[1], TAU * r.sp[1], ux === 's' ? 'rad/s' : 'rad/' + ux)];
      if (mod === 'dsin') { params.push(P('β', p[4], r.sp[4], uRate(ux))); extra.push(P('τ = 1/β', 1 / p[4], r.sp[4] / (p[4] * p[4]), ux), P('Q = πf/β', (Math.PI * p[1]) / p[4], (Math.PI * p[1] / p[4]) * Math.hypot(r.sp[1] / p[1], r.sp[4] / p[4]), '')); }
      out = { f: (x) => model(x, p), params, extra };
    }
    if (!out) return null;
    let ssr = 0, sst = 0;
    const my = M.mean(ys);
    for (let i = 0; i < n; i++) { const e = ys[i] - out.f(xs[i]); if (isFinite(e)) ssr += e * e; sst += (ys[i] - my) ** 2; }
    out.r2 = sst > 0 ? 1 - ssr / sst : 1;
    out.rms = Math.sqrt(ssr / n);
    out.x0 = x0;
    return out;
  }

  MC.defineSim('analizador', function (sim) {
    const cv = sim.canvas({ aspect: 1.3, label: 'Datos, ajuste y segunda gráfica' });
    const pbox = MC.el('div', 'sim-html');
    pbox.style.cssText = 'padding-top:8px;border-top:1px solid var(--rule);background:var(--surface)';
    sim.stageCol.append(pbox);
    let pHTML = '';
    const setP = (h) => { if (h !== pHTML) { pHTML = h; pbox.innerHTML = h; } };
    let data = null, src = 'pend', fname = '', raw = '', shown = '', res = null, key = '';
    sim.group('1 · Datos');
    sim.select('ej', { label: 'Archivo', options: Object.keys(EX).map((k) => [k, 'Ejemplo: ' + EX[k].name]).concat([['mis', 'Mis datos (pegados o abiertos)']]), value: 'pend' });
    const ta = MC.el('textarea', 'an-text');
    ta.spellcheck = false;
    ta.wrap = 'off';
    ta.setAttribute('aria-label', 'Datos en formato CSV');
    ta.placeholder = 'Pegue aquí los datos: una fila por medición, columnas separadas por coma, punto y coma o tabulador. La primera fila puede tener los nombres.';
    sim._parent().append(ta);
    const bUse = sim.button('Usar estos datos', () => parse(ta.value === shown ? raw : ta.value, 'mis', ta.value === shown ? fname : 'Datos pegados'), { primary: true });
    const lab = MC.el('label', 'btn an-file', '<span>Abrir archivo…</span>');
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.csv,.txt,.tsv,.dat,text/csv,text/plain';
    lab.append(inp);
    bUse.parentElement.append(lab);
    const msgEl = MC.el('div', 'an-msg');
    sim._parent().append(msgEl);
    const msg = (t, err) => { msgEl.textContent = t; msgEl.classList.toggle('err', !!err); };
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0];
      inp.value = '';
      if (!f) return;
      if (f.size > 30e6) { msg('El archivo pesa más de 30 MB: recórtelo antes en la hoja de cálculo.', true); return; }
      const rd = new FileReader();
      rd.onload = () => { show(String(rd.result)); parse(raw, 'mis', f.name); };
      rd.onerror = () => msg('No se pudo leer el archivo.', true);
      rd.readAsText(f);
    });
    sim.group('2 · Columnas y rango');
    sim.select('cx', { label: 'Eje horizontal (x)', options: [[0, '—']], value: 0 });
    sim.select('cy', { label: 'Eje vertical (y)', options: [[0, '—']], value: 0 });
    sim.slider('a', { label: 'Desde', min: 0, max: 100, step: 0.5, value: 0, unit: '%', fmt: (q) => MC.fix(q, 1) });
    sim.slider('b', { label: 'Hasta', min: 0, max: 100, step: 0.5, value: 100, unit: '%', fmt: (q) => MC.fix(q, 1) });
    sim.group('3 · Procesar y ajustar');
    sim.slider('sm', { label: 'Suavizado (media móvil)', min: 1, max: 51, step: 2, value: 1, unit: 'puntos', fmt: (q) => String(Math.round(q)) });
    sim.select('mod', { label: 'Modelo de ajuste', options: MODELS, value: 'none' });
    sim.select('g2', { label: 'Segunda gráfica', options: [['res', 'Residuos del ajuste'], ['der', 'Derivada dy/dx (curva suavizada)'], ['fft', 'Espectro de amplitud (FFT)'], ['hist', 'Histograma de y']], value: 'res' });
    sim.button('Copiar resultados', (e) => L.copy(report(), e.currentTarget), { newRow: true });
    sim.out('n', 'Datos en el rango');
    sim.out('st', 'Media de y ± error estándar');
    sim.out('q', 'Calidad del ajuste');
    sim.out('x2', 'Segunda gráfica');
    sim.dataCopy(() => {
      const r = compute();
      if (!r || r.err) return { headers: [], rows: [] };
      const hx = data.headers[+sim.p.cx], hy = data.headers[+sim.p.cy];
      const rows = r.xs.map((x, i) => [x, r.ys[i], r.yss[i], r.fit && !r.fit.err ? r.fit.f(x) : '', r.fit && !r.fit.err ? r.ys[i] - r.fit.f(x) : '', r.der[i] === undefined ? '' : r.der[i]]);
      return { headers: [hx, hy, 'y suavizada', 'y del ajuste', 'residuo', 'dy/dx'], rows };
    }, 'Copiar los datos del rango (con ajuste y residuos)');

    function show(text) {
      raw = text;
      const lines = text.split(/\r?\n/);
      shown = lines.length > 400 ? lines.slice(0, 400).join('\n') + `\n… (${lines.length - 400} líneas más: el análisis usa el archivo completo)` : text;
      ta.value = shown;
    }
    function parse(text, from, name) {
      const d = L.parseCSV(text);
      if (!d || !d.cols.length || !d.cols[0].length) { msg('No encontré datos. Revise que haya una fila por medición y columnas separadas por coma, punto y coma o tabulador.', true); return false; }
      const keep = d.headers.map((_, i) => i).filter((i) => d.cols[i].some((v) => isFinite(v)));
      if (!keep.length) { msg('Ninguna columna tiene números. ¿El separador decimal es coherente con el separador de columnas?', true); return false; }
      data = { headers: keep.map((i) => d.headers[i] || 'col' + (i + 1)), cols: keep.map((i) => d.cols[i]) };
      if (data.cols.length === 1) { data.headers.unshift('n (índice)'); data.cols.unshift(data.cols[0].map((_, i) => i)); }
      if (from !== 'mis') { raw = text; shown = ta.value; }
      src = from; fname = name || '';
      const opts = data.headers.map((h, i) => [i, h]);
      sim.ctl.cx.options(opts, 0);
      sim.ctl.cy.options(opts, Math.min(1, opts.length - 1));
      sim.ctl.ej.set(from, true);
      const sepName = { ',': 'coma', ';': 'punto y coma', '\t': 'tabulador' }[d.sep] || d.sep;
      msg(`${fname ? fname + ': ' : ''}${data.cols[0].length} filas y ${data.headers.length} columnas (separador: ${sepName}).`);
      key = '';
      return true;
    }
    function loadExample(k) {
      const ex = EX[k];
      show(ex.gen());
      parse(raw, k, 'Ejemplo: ' + ex.name);
      const p = ex.preset;
      sim.ctl.cy.set(p.cy, true);
      sim.ctl.a.set(p.a, true); sim.ctl.b.set(p.b, true);
      sim.ctl.sm.set(p.sm, true);
      sim.ctl.mod.set(p.mod, true); sim.ctl.g2.set(p.g2, true);
      key = '';
    }
    sim.onChange = (id) => {
      if (id === 'ej') {
        if (sim.p.ej === 'mis') { if (src !== 'mis') { ta.value = ''; shown = ''; raw = ''; data = null; res = null; key = ''; src = 'mis'; msg('Pegue sus datos en el cuadro y pulse «Usar estos datos», o abra un archivo.'); } }
        else loadExample(sim.p.ej);
      }
    };

    function compute() {
      if (!data) return null;
      const k = [src, fname, data.cols[0].length, sim.p.cx, sim.p.cy, sim.p.a, sim.p.b, sim.p.sm, sim.p.mod, sim.p.g2].join('|');
      if (k === key && res) return res;
      key = k;
      const X0 = data.cols[+sim.p.cx], Y0 = data.cols[+sim.p.cy];
      const all = [];
      for (let i = 0; i < X0.length; i++) if (isFinite(X0[i]) && isFinite(Y0[i])) all.push([X0[i], Y0[i]]);
      let sorted = true;
      for (let i = 1; i < all.length; i++) if (all[i][0] < all[i - 1][0]) { sorted = false; break; }
      if (!sorted) all.sort((p, q) => p[0] - q[0]);
      const ax = all.map((p) => p[0]), ay = all.map((p) => p[1]);
      if (all.length < 2) return (res = { err: 'Hacen falta al menos dos filas con x e y numéricos.', ax, ay });
      const lo = Math.min(sim.p.a, sim.p.b), hi = Math.max(sim.p.a, sim.p.b);
      const x1 = ax[0], x2 = ax[ax.length - 1];
      const xa = x1 + ((x2 - x1) * lo) / 100, xb = x1 + ((x2 - x1) * hi) / 100, eps = 1e-12 * (Math.abs(x2 - x1) + 1);
      const xs = [], ys = [];
      for (let i = 0; i < ax.length; i++) if (ax[i] >= xa - eps && ax[i] <= xb + eps) { xs.push(ax[i]); ys.push(ay[i]); }
      if (xs.length < 2) return (res = { err: 'El rango elegido tiene menos de dos puntos: amplíelo.', ax, ay, xa, xb });
      const sm = Math.round(sim.p.sm);
      const yss = sm > 1 ? L.movAvg(ys, sm) : ys.slice();
      const der = xs.length > 2 ? L.deriv(xs, yss).map((v) => (isFinite(v) ? v : NaN)) : [];
      const hx = data.headers[+sim.p.cx], hy = data.headers[+sim.p.cy];
      let fit = null;
      try { fit = sim.p.mod === 'none' ? null : doFit(sim.p.mod, xs, ys, unitOf(hx), unitOf(hy)); } catch (e) { fit = { err: 'El ajuste falló: ' + e.message }; }
      const dt = medDt(xs);
      const spec = sim.p.g2 === 'fft' && xs.length >= 8 && dt > 0 ? L.spectrum(ys, dt, { pad: 2 }) : null;
      return (res = { ax, ay, xs, ys, yss, der, fit, spec, xa, xb, dt, ux: unitOf(hx), uy: unitOf(hy), hx, hy });
    }
    const pmStr = (q) => L.pm(q.v, q.s, q.u);
    function report() {
      const r = compute();
      if (!r || r.err) return 'Sin datos';
      const L2 = [`Analizador de datos · ${fname || 'datos'}`, `x: ${r.hx}   y: ${r.hy}`, `Rango: ${MC.sci(r.xa, 5)} a ${MC.sci(r.xb, 5)} ${r.ux} (${r.xs.length} puntos)`];
      L2.push(`Media de y: ${L.pm(M.mean(r.ys), M.std(r.ys) / Math.sqrt(r.xs.length), r.uy)}   desviación estándar: ${MC.sci(M.std(r.ys), 3)} ${r.uy}`);
      if (r.fit && !r.fit.err) {
        L2.push('Modelo: ' + MODELS.find((m) => m[0] === sim.p.mod)[1] + (['exp', 'sin', 'dsin'].includes(sim.p.mod) ? `  (x₀ = ${MC.sci(r.fit.x0, 6)} ${r.ux})` : ''));
        for (const q of r.fit.params.concat(r.fit.extra)) L2.push(`  ${q.name} = ${pmStr(q)}`);
        L2.push(`  R² = ${MC.fix(r.fit.r2, 6)}   residuo rms = ${MC.sci(r.fit.rms, 3)} ${r.uy}`);
      }
      if (r.spec) L2.push(`Pico del espectro: ${MC.sci(r.spec.peak, 5)} ${uInv(r.ux)}`);
      return L2.join('\n').replace(/<[^>]+>/g, '');
    }

    loadExample('pend');

    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const r = compute();
      if (!r) { MC.text(ctx, 'Pegue o abra sus datos (o elija un ejemplo)', W / 2, H / 2, { size: 14, align: 'center', color: '--ink-3' }); ['n', 'st', 'q', 'x2'].forEach((id) => sim.set(id, '—')); setP(''); return; }
      const h1 = H * 0.58;
      const span = r.ax[r.ax.length - 1] - r.ax[0] || 1;
      const xl = r.ax[0] - 0.01 * span, xh = r.ax[r.ax.length - 1] + 0.01 * span;
      let ymn = Infinity, ymx = -Infinity;
      for (const v of r.ay) { if (v < ymn) ymn = v; if (v > ymx) ymx = v; }
      const ysp = ymx - ymn || Math.abs(ymx) * 0.1 || 1;
      const yl = ymn - 0.07 * ysp, yh = ymx + 0.07 * ysp;
      const P1 = new MC.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: xl, xmax: xh, ymin: yl, ymax: yh, xlabel: r.hx, ylabel: '', mt: 24, ml: 60, title: r.hy });
      P1.frame();
      if (r.err && !r.xs) { sim.set('n', r.err); }
      if (isFinite(r.xa)) P1.band(r.xa, r.xb, { color: '--accent', alpha: 0.07 });
      const many = r.ax.length > 400;
      const [dx, dy] = thin(r.ax, r.ay, 6000);
      if (many) P1.xy(dx, dy, { color: '--ink-3', width: 1, alpha: 0.6 }); else P1.scatter(dx, dy, { color: '--ink-3', r: 2.6, alpha: 0.6 });
      if (r.err) { sim.set('n', r.err); ['st', 'q', 'x2'].forEach((id) => sim.set(id, '—')); setP(''); return; }
      const [sx, sy] = thin(r.xs, r.ys, 6000);
      if (many) P1.xy(sx, sy, { color: '--c1', width: 2.6, alpha: 0.55 }); else P1.scatter(sx, sy, { color: '--c1', r: 3.6 });
      if (Math.round(sim.p.sm) > 1) { const [qx, qy] = thin(r.xs, r.yss, 6000); P1.xy(qx, qy, { color: '--c4', width: 2 }); }
      const okFit = r.fit && !r.fit.err;
      if (okFit) P1.fn(r.fit.f, { color: '--accent', width: many ? 1.4 : 2, from: r.xa, to: r.xb, n: 800 });
      /* segunda gráfica */
      const rect = { x: 0, y: h1, w: W, h: H - h1 };
      const g2 = sim.p.g2;
      let info = '—';
      if (g2 === 'res') {
        if (okFit) {
          const e = r.xs.map((x, i) => r.ys[i] - r.fit.f(x));
          const [e1, e2] = mm(e), a = Math.max(Math.abs(e1), Math.abs(e2)) || 1;
          const P2 = new MC.Plot(ctx, Object.assign({ xmin: xl, xmax: xh, ymin: -a * 1.15, ymax: a * 1.15, xlabel: r.hx, mt: 24, ml: 60, title: 'Residuos: y − ajuste' + (r.uy ? ` (${r.uy})` : '') }, rect));
          P2.frame();
          P2.hband(-r.fit.rms, r.fit.rms, { color: '--accent', alpha: 0.08 });
          P2.hline(0, { color: '--ink-3' });
          const [ex, ey] = thin(r.xs, e, 6000);
          if (many) P2.xy(ex, ey, { color: '--c5', width: 1 }); else P2.scatter(ex, ey, { color: '--c5', r: 3 });
          info = `banda: ±rms = ±${MC.sci(r.fit.rms, 3)} ${r.uy}`;
        } else {
          MC.text(ctx, 'Elija un modelo de ajuste para ver los residuos', W / 2, h1 + (H - h1) / 2, { size: 13, align: 'center', color: '--ink-3' });
        }
      } else if (g2 === 'der') {
        const v = r.der.filter(isFinite);
        if (v.length > 1) {
          const [v1, v2] = mm(v), [dl, dh] = MC.niceRange(v1, v2, { zero: true, pad: 0.06 });
          const P2 = new MC.Plot(ctx, Object.assign({ xmin: xl, xmax: xh, ymin: dl, ymax: dh, xlabel: r.hx, mt: 24, ml: 60, title: 'Derivada dy/dx' + (uDiv(r.uy, r.ux) ? ` (${uDiv(r.uy, r.ux)})` : '') + (Math.round(sim.p.sm) > 1 ? ` · suavizada con ${Math.round(sim.p.sm)} puntos` : ' · sin suavizar: ¡mucho ruido!') }, rect));
          P2.frame();
          const [qx, qy] = thin(r.xs, r.der, 6000);
          P2.xy(qx, qy, { color: '--c2', width: 1.3 });
          info = `media de dy/dx en el rango: ${MC.sci(M.mean(v), 4)} ${uDiv(r.uy, r.ux)}`;
        }
      } else if (g2 === 'fft') {
        if (r.spec && r.spec.f.length > 2) {
          const fmax = r.spec.f[r.spec.f.length - 1];
          const P2 = new MC.Plot(ctx, Object.assign({ xmin: 0, xmax: fmax, ymin: 0, ymax: (r.spec.amp || 1) * 1.2, xlabel: 'f' + (uInv(r.ux) ? ` (${uInv(r.ux)})` : ''), mt: 24, ml: 60, title: 'Espectro de amplitud (ventana de Hann)' }, rect));
          P2.frame();
          P2.xy(r.spec.f, r.spec.a, { color: '--c5', width: 1.3 });
          P2.vline(r.spec.peak, { color: '--accent', label: MC.sci(r.spec.peak, 4), labelY: 14 });
          info = `pico en ${MC.sci(r.spec.peak, 5)} ${uInv(r.ux)} · resolución 1/T = ${MC.sci(1 / (r.xs[r.xs.length - 1] - r.xs[0]), 3)} ${uInv(r.ux)}`;
        } else MC.text(ctx, 'El espectro necesita al menos 8 puntos igualmente espaciados', W / 2, h1 + (H - h1) / 2, { size: 13, align: 'center', color: '--ink-3' });
      } else if (g2 === 'hist') {
        const ys = r.ys, n = ys.length, mu = M.mean(ys), sd = M.std(ys);
        const nb = Math.max(5, Math.min(40, Math.round(Math.sqrt(n))));
        const [lo, hi] = mm(ys), bw = (hi - lo) / nb || 1;
        const cnt = new Array(nb).fill(0);
        for (const y of ys) cnt[Math.min(nb - 1, Math.floor((y - lo) / bw))]++;
        const cmax = Math.max(...cnt, (n * bw) / (sd * Math.sqrt(TAU) || 1));
        const P2 = new MC.Plot(ctx, Object.assign({ xmin: lo - bw, xmax: hi + bw, ymin: 0, ymax: cmax * 1.15, xlabel: r.hy, mt: 24, ml: 60, title: `Histograma de y (${nb} clases) y la gaussiana con la misma media y σ` }, rect));
        P2.frame();
        ctx.save();
        ctx.fillStyle = MC.alpha('--c1', 0.45);
        ctx.strokeStyle = MC.col('--c1');
        for (let i = 0; i < nb; i++) { const x0 = P2.X(lo + i * bw), x1 = P2.X(lo + (i + 1) * bw), y0 = P2.Y(0), y1 = P2.Y(cnt[i]); ctx.fillRect(x0, y1, x1 - x0, y0 - y1); ctx.strokeRect(x0 + 0.5, y1 + 0.5, x1 - x0 - 1, y0 - y1); }
        ctx.restore();
        if (sd > 0) P2.fn((x) => ((n * bw) / (sd * Math.sqrt(TAU))) * Math.exp(-0.5 * ((x - mu) / sd) ** 2), { color: '--accent', width: 2 });
        info = `${n} datos · σ = ${MC.sci(sd, 3)} ${r.uy}`;
      }
      /* salidas */
      const nfull = r.ax.length;
      sim.set('n', `${r.xs.length} de ${nfull} · x de ${MC.sci(r.xa, 4)} a ${MC.sci(r.xb, 4)} ${r.ux}` + (isFinite(r.dt) && r.dt > 0 && r.ux === 's' ? ` · ${MC.sci(1 / r.dt, 3)} Hz` : ''));
      const mu = M.mean(r.ys), sd = M.std(r.ys);
      sim.set('st', `${L.pm(mu, sd / Math.sqrt(r.ys.length), r.uy)} (σ = ${MC.sci(sd, 3)})`);
      const mname = MODELS.find((m) => m[0] === sim.p.mod)[1].split(':')[0];
      if (!r.fit) setP('<div class="ctrl-note">Elija un modelo de ajuste en el grupo 3 para obtener sus parámetros con incertidumbre.</div>');
      else if (r.fit.err) setP(`<div class="ctrl-note warnv">${r.fit.err}</div>`);
      else {
        const row = (q, b) => `<tr><td>${b ? '<b>' + q.name + '</b>' : q.name}</td><td>${MC.supHTML(L.pm(q.v, q.s))}</td><td>${MC.supHTML(q.u || '—')}</td></tr>`;
        const x0n = ['exp', 'sin', 'dsin'].includes(sim.p.mod) ? ` · x₀ = ${MC.sci(r.fit.x0, 5)} ${r.ux}` : '';
        setP(`<div class="mini-label" style="margin:0">Parámetros del ajuste · ${mname}${x0n}</div><div class="sim-table"><table><thead><tr><th>Parámetro</th><th>Valor ± incertidumbre</th><th>Unidad</th></tr></thead><tbody>${r.fit.params.map((q) => row(q, true)).join('')}${r.fit.extra.map((q) => row(q, false)).join('')}</tbody></table></div>${r.fit.note ? `<div class="ctrl-note">${r.fit.note}</div>` : ''}`);
      }
      sim.set('q', okFit ? `R² = ${MC.fix(r.fit.r2, 5)} · rms = ${MC.sci(r.fit.rms, 3)} ${r.uy}` : '—');
      sim.set('x2', info);
    });
  });
})();
