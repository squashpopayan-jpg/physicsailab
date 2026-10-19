/* Capítulo 2 · Medir bien: incertidumbre y ajuste de datos */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;

  /* ---------- Repetir mediciones ---------- */
  MC.defineSim('medir-repetir', function (sim) {
    sim.cols2('1.15fr 1fr');
    const cvH = sim.canvas({ aspect: 1.25, label: 'Histograma de las mediciones' });
    const cvR = sim.canvas({ aspect: 1.25, label: 'Media acumulada' });
    const T0 = 1.4320;
    const INST = {
      manual: { s: 0.12, res: 0.01, bias: 0.09, lab: 'Cronómetro manual' },
      acus: { s: 0.0025, res: 1 / 48000, bias: 0.003, lab: 'Cronómetro acústico' },
      foto: { s: 0.0006, res: 1e-6, bias: 0.0002, lab: 'Fotocompuerta + ESP32' }
    };
    let data = [];
    sim.group('Instrumento');
    sim.seg('inst', { options: [['manual', 'Manual'], ['acus', 'Acústico'], ['foto', 'Fotocompuerta']], value: 'manual', onInput: () => regen() });
    sim.check('bias', { label: 'Error sistemático (reacción tardía, retardo)', value: false, onInput: () => regen() });
    sim.group('Repeticiones');
    sim.slider('n', { label: 'Número de mediciones <i>N</i>', min: 2, max: 200, step: 1, value: 20, fmt: (v) => String(Math.round(v)), onInput: () => regen(true) });
    sim.button('Medir otra vez', () => regen(), { primary: true });
    sim.out('mean', 'Media \\(\\bar T\\)');
    sim.out('s', 'Desviación estándar <i>s</i>');
    sim.out('se', 'Error estándar <i>s</i>/√<i>N</i>');
    sim.out('res', 'Resultado', { hl: true });
    sim.out('true', 'Valor verdadero (oculto en la práctica)');
    sim.dataCopy(() => ({ headers: ['i', 'T (s)'], rows: data.map((v, i) => [i + 1, v]) }));
    const one = () => {
      const I = INST[sim.p.inst];
      return L.quant(T0 + M.gauss(0, I.s) + (sim.p.bias ? I.bias : 0), I.res);
    };
    function regen(keep) {
      const n = Math.round(sim.p.n);
      if (keep && data.length) { while (data.length < n) data.push(one()); data.length = n; }
      else { data = []; for (let i = 0; i < n; i++) data.push(one()); }
      sim.redraw();
    }
    regen();
    sim.onDraw(() => {
      const I = INST[sim.p.inst];
      const n = data.length, mu = M.mean(data), s = M.std(data), se = s / Math.sqrt(n);
      sim.set('mean', MC.fix(mu, 5) + ' s');
      sim.set('s', MC.sci(s, 2) + ' s');
      sim.set('se', MC.sci(se, 2) + ' s');
      sim.set('res', 'T = ' + L.pm(mu, Math.max(se, I.res / Math.sqrt(12)), 's'));
      sim.set('true', MC.fix(T0, 4) + ' s');
      /* histograma */
      let ctx = cvH.ctx;
      D.clear(cvH);
      const span = Math.max(4 * I.s, 6 * (s || I.s));
      const lo = T0 - span * 0.6 + (sim.p.bias ? I.bias / 2 : 0), hi = T0 + span * 0.6 + (sim.p.bias ? I.bias / 2 : 0);
      const nb = 21, bw = (hi - lo) / nb, cnt = new Array(nb).fill(0);
      for (const v of data) { const k = Math.floor((v - lo) / bw); if (k >= 0 && k < nb) cnt[k]++; }
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cvH.w, h: cvH.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(4, MC.niceCeil(Math.max(...cnt) * 1.15)), xlabel: ['T', 's'], ylabel: 'frecuencia', mt: 26, title: 'Histograma de las N mediciones' });
      P.frame();
      P.hband(0, 0, {});
      P.band(mu - s, mu + s, { color: '--ink-3', alpha: 0.12 });
      P.band(mu - se, mu + se, { color: '--accent', alpha: 0.28 });
      P.clip((c) => {
        for (let k = 0; k < nb; k++) {
          if (!cnt[k]) continue;
          const x0 = P.X(lo + k * bw), x1 = P.X(lo + (k + 1) * bw), y = P.Y(cnt[k]);
          c.fillStyle = MC.alpha('--c1', 0.75);
          c.fillRect(x0 + 1, y, x1 - x0 - 2, P.Y(0) - y);
        }
      });
      P.vline(mu, { color: '--accent', dash: [], width: 2, label: 'media' });
      P.vline(T0, { color: '--c3', dash: [4, 3], width: 1.5, label: 'verdadero', align: 'right', labelY: 26 });
      /* media acumulada */
      ctx = cvR.ctx;
      D.clear(cvR);
      const xs = [], ys = [], up = [], dn = [];
      let acc = 0;
      for (let i = 0; i < n; i++) {
        acc += data[i]; const m = acc / (i + 1);
        xs.push(i + 1); ys.push(m);
        const sk = i > 0 ? M.std(data.slice(0, i + 1)) : I.s;
        up.push(m + sk / Math.sqrt(i + 1)); dn.push(m - sk / Math.sqrt(i + 1));
      }
      const yr = Math.max(I.s * 1.2, Math.abs(ys[0] - T0) * 1.2, 1e-5);
      const Q = new MC.Plot(ctx, { x: 0, y: 0, w: cvR.w, h: cvR.h, xmin: 0, xmax: Math.max(10, n), ymin: T0 - yr, ymax: T0 + yr + (sim.p.bias ? I.bias : 0), xlabel: ['N', ''], ylabel: ['T̄', 's'], mt: 26, title: 'Media acumulada ± error estándar' });
      Q.frame();
      Q.xy(xs, up, { color: '--accent', width: 1, alpha: 0.6 });
      Q.xy(xs, dn, { color: '--accent', width: 1, alpha: 0.6 });
      Q.xy(xs, ys, { color: '--c1', width: 2 });
      Q.hline(T0, { color: '--c3', label: 'verdadero', labelRight: true });
    });
  });

  /* ---------- Propagación ---------- */
  const FUNCS = {
    g: { lab: 'g = 4π² L / T²', unit: 'm/s²', vars: [['L', 'L', 0.50, 'm', 1], ['T', 'T', 1.419, 's', 1]], f: (v) => (4 * Math.PI * Math.PI * v.L) / (v.T * v.T), pw: { L: 1, T: -2 } },
    rho: { lab: 'ρ = 4m / (π d² h)', unit: 'kg/m³', vars: [['m', 'm', 0.0191, 'kg', 0.05], ['d', 'd', 0.020, 'm', 0.25], ['h', 'h', 0.0225, 'm', 0.44]], f: (v) => (4 * v.m) / (Math.PI * v.d * v.d * v.h), pw: { m: 1, d: -2, h: -1 } },
    dip: { lab: 'm = 2π B r³ / μ₀', unit: 'A·m²', vars: [['B', 'B', 120e-6, 'T', 1], ['r', 'r', 0.08, 'm', 2]], f: (v) => (2 * Math.PI * v.B * Math.pow(v.r, 3)) / (4e-7 * Math.PI), pw: { B: 1, r: 3 } },
    k: { lab: 'k = 4π² m / T²', unit: 'N/m', vars: [['m', 'm', 0.180, 'kg', 0.5], ['T', 'T', 0.62, 's', 1]], f: (v) => (4 * Math.PI * Math.PI * v.m) / (v.T * v.T), pw: { m: 1, T: -2 } }
  };
  MC.defineSim('propagacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Distribución del resultado' });
    let samples = [];
    sim.group('Fórmula');
    sim.select('fn', { options: Object.keys(FUNCS).map((k) => [k, FUNCS[k].lab]), value: 'g', onInput: () => build() });
    sim.group('Incertidumbres relativas de las variables');
    const ids = ['u0', 'u1', 'u2'];
    ids.forEach((id) => sim.slider(id, { label: '', min: 0, max: 25, step: 0.1, value: 1, unit: '%', fmt: (v) => MC.fix(v, 1), onInput: () => mc() }));
    sim.button('Repetir Monte Carlo', () => mc());
    sim.out('f0', 'Valor central');
    sim.out('uf', 'Incertidumbre (fórmula)', { hl: true });
    sim.out('umc', 'Incertidumbre (Monte Carlo)');
    sim.out('dom', 'Variable dominante');
    function build() {
      const F = FUNCS[sim.p.fn];
      ids.forEach((id, i) => {
        const v = F.vars[i];
        sim.ctl[id].show(!!v);
        if (v) { sim.ctl[id].label(`<i>u</i>(${v[1]})/${v[1]} &nbsp;·&nbsp; ${v[1]} = ${MC.sci(v[2], 3)} ${v[3]}`); sim.ctl[id].set(v[4], true); }
      });
      mc();
    }
    function mc() {
      const F = FUNCS[sim.p.fn];
      samples = [];
      for (let k = 0; k < 20000; k++) {
        const v = {};
        F.vars.forEach((q, i) => { v[q[0]] = q[2] * (1 + M.gauss(0, sim.p[ids[i]] / 100)); });
        const y = F.f(v);
        if (isFinite(y)) samples.push(y);
      }
      sim.redraw();
    }
    build();
    sim.onDraw(() => {
      const F = FUNCS[sim.p.fn];
      const v0 = {};
      F.vars.forEach((q) => { v0[q[0]] = q[2]; });
      const f0 = F.f(v0);
      const parts = F.vars.map((q, i) => Math.abs(F.pw[q[0]]) * sim.p[ids[i]] / 100);
      const rel = Math.sqrt(parts.reduce((s, p) => s + p * p, 0));
      const uf = Math.abs(f0) * rel;
      const mu = M.mean(samples), umc = M.std(samples);
      sim.set('f0', MC.sci(f0, 4) + ' ' + F.unit);
      sim.set('uf', MC.sci(uf, 2) + ' ' + F.unit + ` (${MC.fix(rel * 100, 2)} %)`);
      sim.set('umc', MC.sci(umc, 2) + ' ' + F.unit + ` (media ${MC.sci(mu, 4)})`);
      const im = parts.indexOf(Math.max(...parts));
      sim.set('dom', `${F.vars[im][1]} (aporta ${MC.fix((100 * parts[im] * parts[im]) / Math.max(rel * rel, 1e-30), 0)} % de la varianza)`);
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const lo = f0 - 4.5 * Math.max(uf, umc, Math.abs(f0) * 1e-4), hi = f0 + 4.5 * Math.max(uf, umc, Math.abs(f0) * 1e-4);
      const nb = 60, bw = (hi - lo) / nb, cnt = new Array(nb).fill(0);
      for (const y of samples) { const k = Math.floor((y - lo) / bw); if (k >= 0 && k < nb) cnt[k]++; }
      const dens = cnt.map((c) => c / (samples.length * bw));
      const gmax = uf > 0 ? 1 / (uf * Math.sqrt(2 * Math.PI)) : 1;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...dens, gmax) * 1.12, xlabel: [F.lab.split('=')[0].trim(), F.unit], ylabel: 'densidad', mt: 26, title: '20 000 cálculos con valores sorteados', yfmt: () => '' });
      P.frame();
      P.clip((c) => {
        for (let k = 0; k < nb; k++) {
          const x0 = P.X(lo + k * bw), x1 = P.X(lo + (k + 1) * bw), y = P.Y(dens[k]);
          c.fillStyle = MC.alpha('--c1', 0.55);
          c.fillRect(x0, y, x1 - x0 - 0.5, P.Y(0) - y);
        }
      });
      if (uf > 0) P.fn((x) => gmax * Math.exp(-0.5 * ((x - f0) / uf) ** 2), { color: '--accent', width: 2 });
      P.vline(f0, { color: '--accent', dash: [4, 3] });
      P.legend([{ label: 'Monte Carlo', color: '--c1', kind: 'sq' }, { label: 'fórmula (gaussiana)', color: '--accent' }], 'tl');
      /* barras de contribución */
      const bx = W * 0.7, bwid = W * 0.27;
      MC.text(ctx, 'Contribución a u²', bx, 26, { size: 12, weight: 600, color: '--ink-2' });
      F.vars.forEach((q, i) => {
        const share = (parts[i] * parts[i]) / Math.max(rel * rel, 1e-30);
        const y = 46 + i * 46;
        MC.text(ctx, `${q[1]}  (exponente ${F.pw[q[0]]})`, bx, y, { size: 12, color: '--ink' });
        ctx.fillStyle = MC.col('--surface-3');
        ctx.fillRect(bx, y + 8, bwid, 14);
        ctx.fillStyle = MC.col(i === im ? '--accent' : '--c1');
        ctx.fillRect(bx, y + 8, bwid * share, 14);
        MC.text(ctx, MC.fix(share * 100, 0) + ' %', bx + bwid - 2, y + 19, { size: 11, mono: true, align: 'right', color: '--ink', halo: true });
      });
    });
  });

  /* ---------- Regresión lineal ---------- */
  const DATASETS = {
    hooke: { lab: 'Ley de Hooke: F contra x', x: ['x', 'cm'], y: ['F', 'N'], m: 0.245, b: 0.0, x0: 1, x1: 12, sig: 0.03, deriv: (f) => `k = ${L.pm(f.m * 100, f.sm * 100, 'N/m')}` },
    ohm: { lab: 'Ley de Ohm: V contra I', x: ['I', 'mA'], y: ['V', 'V'], m: 0.0997, b: 0.005, x0: 2, x1: 28, sig: 0.02, deriv: (f) => `R = ${L.pm(f.m * 1000, f.sm * 1000, 'Ω')}` },
    pend: { lab: 'Péndulo: T² contra L', x: ['L', 'm'], y: ['T²', 's²'], m: 4.038, b: 0.02, x0: 0.15, x1: 0.9, sig: 0.02, deriv: (f) => `g = 4π²/m = ${L.pm((4 * Math.PI * Math.PI) / f.m, (4 * Math.PI * Math.PI * f.sm) / (f.m * f.m), 'm/s²')}` },
    malo: { lab: 'Modelo equivocado: caída y contra t', x: ['t', 's'], y: ['y', 'm'], quad: 4.89, m: 0, b: 0, x0: 0.05, x1: 0.6, sig: 0.004, deriv: () => 'Los residuos forman una parábola: y depende de t², no de t' }
  };
  MC.defineSim('regresion', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, label: 'Datos, recta ajustada y residuos' });
    let pts = [];
    sim.presets([
      { id: 'hooke', label: 'Resorte (Ley de Hooke)', v: { ds: 'hooke' } },
      { id: 'ohm', label: 'Resistencia (Ley de Ohm)', v: { ds: 'ohm' } },
      { id: 'pend', label: 'Péndulo: T² contra L', v: { ds: 'pend' } },
      { id: 'malo', label: 'Modelo equivocado', v: { ds: 'malo' }, note: 'La caída libre no es lineal en t. Aun así el ajuste da un R² alto: sólo los residuos delatan el problema.' }
    ], { initial: 'hooke' });
    sim.group('Datos');
    sim.select('ds', { label: 'Conjunto', options: Object.keys(DATASETS).map((k) => [k, DATASETS[k].lab]), value: 'hooke', onInput: () => gen() });
    sim.slider('n', { label: 'Número de puntos', min: 3, max: 40, step: 1, value: 8, fmt: (v) => String(Math.round(v)), onInput: () => gen() });
    sim.slider('sig', { label: 'Ruido (× valor típico)', min: 0, max: 5, step: 0.1, value: 1, fmt: (v) => MC.fix(v, 1), onInput: () => gen() });
    sim.button('Nuevos datos', () => gen(), { primary: true });
    sim.note('Arrastre cualquier punto para ver cómo cambia el ajuste.');
    sim.out('m', 'Pendiente <i>m</i>', { hl: true });
    sim.out('b', 'Intercepto <i>b</i>');
    sim.out('r2', '<i>R</i>²');
    sim.out('der', 'Resultado físico');
    sim.dataCopy(() => { const d = DATASETS[sim.p.ds]; return { headers: [`${d.x[0]} (${d.x[1]})`, `${d.y[0]} (${d.y[1]})`], rows: pts.map((p) => [p[0], p[1]]) }; });
    sim.onChange = (id) => { if (id === 'preset') gen(); };
    function gen() {
      const d = DATASETS[sim.p.ds];
      const n = Math.round(sim.p.n);
      pts = [];
      for (let i = 0; i < n; i++) {
        const x = d.x0 + ((d.x1 - d.x0) * i) / Math.max(1, n - 1);
        const y0 = d.quad ? d.quad * x * x : d.m * x + d.b;
        pts.push([+x.toPrecision(4), y0 + M.gauss(0, d.sig * sim.p.sig)]);
      }
      sim.redraw();
    }
    gen();
    let P = null, R = null;
    MC.pointer(cv, {
      down: (x, y) => { if (!P) return null; let best = -1, bd = 14; pts.forEach((p, i) => { const d = Math.hypot(P.X(p[0]) - x, P.Y(p[1]) - y); if (d < bd) { bd = d; best = i; } }); return best >= 0 ? best : null; },
      move: (i, x, y) => { pts[i][1] = P.invY(y); sim.redraw(); },
      hover: (x, y) => P && pts.some((p) => Math.hypot(P.X(p[0]) - x, P.Y(p[1]) - y) < 14)
    });
    sim.onDraw(() => {
      const d = DATASETS[sim.p.ds];
      const ctx = cv.ctx;
      D.clear(cv);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const f = L.fitLine(xs, ys);
      const H1 = cv.h * 0.68;
      const [ylo, yhi] = MC.niceRange(Math.min(...ys), Math.max(...ys), { zero: true });
      P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: H1, xmin: 0, xmax: d.x1 * 1.05, ymin: ylo, ymax: yhi, xlabel: d.x, ylabel: d.y, mt: 14 });
      P.frame();
      if (f) {
        P.fn(f.f, { color: '--accent', width: 2 });
        sim.set('m', L.pm(f.m, f.sm) + ` ${d.y[1]}/${d.x[1]}`);
        sim.set('b', L.pm(f.b, f.sb) + ' ' + d.y[1]);
        sim.set('r2', MC.fix(f.r2, 5));
        sim.set('der', d.deriv(f));
      }
      P.scatter(xs, ys, { color: '--c1', r: 4.5 });
      /* residuos */
      const res = f ? pts.map((p) => p[1] - f.f(p[0])) : [];
      const rm = Math.max(1e-9, ...res.map(Math.abs)) * 1.3;
      R = new MC.Plot(ctx, { x: 0, y: H1 + 4, w: cv.w, h: cv.h - H1 - 4, xmin: 0, xmax: d.x1 * 1.05, ymin: -rm, ymax: rm, xlabel: d.x, ylabel: 'residuo', mt: 18, title: 'Residuos: y − (m x + b)' });
      R.frame();
      R.hline(0, { color: '--ink-3', dash: [] });
      R.clip((c) => { for (let i = 0; i < res.length; i++) { c.strokeStyle = MC.col('--c1'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(R.X(xs[i]), R.Y(0)); c.lineTo(R.X(xs[i]), R.Y(res[i])); c.stroke(); } });
      R.scatter(xs, res, { color: '--c1', r: 3.5 });
    });
  });

  /* ---------- Linealización ---------- */
  const LDATA = {
    pend: { lab: 'Péndulo: T contra L', x: ['L', 'm'], y: ['T', 's'], gen: () => Array.from({ length: 9 }, (_, i) => { const x = 0.1 + i * 0.1; return [x, 2 * Math.PI * Math.sqrt(x / 9.777) * (1 + M.gauss(0, 0.003))]; }), goal: 'T² contra L (o log–log con pendiente ½)' },
    dip: { lab: 'Imán: B contra r', x: ['r', 'cm'], y: ['B', 'µT'], gen: () => Array.from({ length: 9 }, (_, i) => { const x = 4 + i * 1.5; return [x, 2.0e5 / Math.pow(x, 3) * (1 + M.gauss(0, 0.02))]; }), goal: 'log–log: pendiente −3' },
    rc: { lab: 'Descarga RC: V contra t', x: ['t', 's'], y: ['V', 'V'], gen: () => Array.from({ length: 12 }, (_, i) => { const x = i * 0.4; return [x, 3.2 * Math.exp(-x / 1.47) + M.gauss(0, 0.004)]; }), goal: 'ln V contra t: pendiente −1/τ' },
    torr: { lab: 'Vaciado: h contra t', x: ['t', 's'], y: ['h', 'cm'], gen: () => Array.from({ length: 12 }, (_, i) => { const x = i * 8; const s = Math.max(0, Math.sqrt(20) - 0.042 * x); return [x, s * s + M.gauss(0, 0.05)]; }), goal: '√h contra t' },
    caida: { lab: 'Caída libre: y contra t', x: ['t', 's'], y: ['y', 'm'], gen: () => Array.from({ length: 10 }, (_, i) => { const x = 0.05 + i * 0.05; return [x, 0.5 * 9.777 * x * x + M.gauss(0, 0.002)]; }), goal: 'y contra t²: pendiente g/2' }
  };
  const TX = {
    id: ['sin cambio', (v) => v, (s, u) => [s, u]],
    sq: ['al cuadrado', (v) => v * v, (s, u) => [s + '²', u ? u + '²' : '']],
    sqrt: ['raíz', (v) => Math.sqrt(v), (s, u) => ['√' + s, u ? '√' + u : '']],
    ln: ['logaritmo', (v) => Math.log(v), (s) => ['ln ' + s, '']],
    inv: ['inverso', (v) => 1 / v, (s, u) => ['1/' + s, u ? '1/' + u : '']]
  };
  MC.defineSim('linealizacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.55, label: 'Datos transformados' });
    let pts = [];
    sim.group('Datos');
    sim.select('ds', { options: Object.keys(LDATA).map((k) => [k, LDATA[k].lab]), value: 'dip', onInput: () => { pts = LDATA[sim.p.ds].gen(); } });
    sim.group('Transformaciones');
    const opts = Object.keys(TX).map((k) => [k, TX[k][0]]);
    sim.select('tx', { label: 'Eje horizontal', options: opts, value: 'id' });
    sim.select('ty', { label: 'Eje vertical', options: opts, value: 'id' });
    sim.note('Pista: busque la transformación que vuelve recta la gráfica y lea el significado de la pendiente.');
    sim.out('curv', 'Curvatura de los residuos', { hl: true });
    sim.out('m', 'Pendiente');
    sim.out('b', 'Intercepto');
    sim.out('goal', 'Objetivo');
    pts = LDATA.dip.gen();
    sim.onDraw(() => {
      const d = LDATA[sim.p.ds];
      const fx = TX[sim.p.tx], fy = TX[sim.p.ty];
      const xs = [], ys = [];
      for (const [x, y] of pts) { const a = fx[1](x), b = fy[1](y); if (isFinite(a) && isFinite(b)) { xs.push(a); ys.push(b); } }
      const [sx, ux] = fx[2](d.x[0], d.x[1]), [sy, uy] = fy[2](d.y[0], d.y[1]);
      const ctx = cv.ctx;
      D.clear(cv);
      const [xl, xh] = MC.niceRange(Math.min(...xs), Math.max(...xs), { zero: false });
      const [yl, yh] = MC.niceRange(Math.min(...ys), Math.max(...ys), { zero: false });
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: xl, xmax: xh, ymin: yl, ymax: yh, xlabel: [sx, ux], ylabel: [sy, uy], mt: 14 });
      P.frame();
      const f = L.fitLine(xs, ys);
      const q = L.fitPoly(xs, ys, 2);
      let straight = false;
      if (f && q) {
        const span = (Math.max(...xs) - Math.min(...xs)) ** 2;
        const c = Math.abs(q.a[2]) * span / Math.max(1e-12, Math.max(...ys) - Math.min(...ys));
        const sig = Math.abs(q.a[2]) / Math.max(q.sa[2], 1e-300);
        straight = sig < 3 || c < 0.004;
        sim.set('curv', straight ? '≈ 0 · ¡recta!' : MC.fix(100 * c, 1) + ' % del rango');
        sim.set('m', MC.sci(f.m, 4));
        sim.set('b', MC.sci(f.b, 4));
        P.fn(f.f, { color: straight ? '--c3' : '--ink-3', width: 1.8, dash: straight ? [] : [5, 4] });
      }
      sim.set('goal', d.goal);
      P.scatter(xs, ys, { color: straight ? '--c3' : '--c1', r: 4.5 });
      if (straight) MC.text(ctx, '✓ Los puntos quedan en una recta', P.ix + 10, P.iy + 18, { size: 13, weight: 700, color: '--c3', halo: true });
    });
  });
})();
