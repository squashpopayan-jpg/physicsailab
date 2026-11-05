/* Capítulo 27 — Instrumentación y medición */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* ---------- 27.1 Efecto de carga del voltímetro y del amperímetro ---------- */
  EM.defineSim('c27-carga', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table'], net: { damage: false },
      hint: 'Un divisor de tensión con una fuente de 10 V; el voltímetro se modela por su resistencia de entrada R_V y el amperímetro por su resistencia interna R_A. (Los nodos con la misma etiqueta están unidos.)',
      spec: {
        parts: [['VS', 'VDC', 2, 12, 0, { v: 10 }], ['R1', 'R', 12, 6, 1, { r: 100000 }], ['R2', 'R', 12, 16, 1, { r: 100000 }], ['RV', 'R', 22, 16, 1, { r: 10e6 }], ['RA', 'R', 30, 8, 0, { r: 1 }], ['RC', 'R', 38, 12, 1, { r: 100 }]],
        wires: [['VS.0', '@vs:u'], ['VS.1', 'gnd'], ['R1.0', '@vs:u'], ['R1.1', '@m:d'], ['R2.0', '@m:u'], ['R2.1', 'gnd'], ['RV.0', '@m:u'], ['RV.1', 'gnd'], ['RA.0', '@vs:l'], ['RA.1', '@c:r'], ['RC.0', '@c:u'], ['RC.1', 'gnd']]
      },
      controls: [
        { type: 'slider', id: 'r', label: 'Resistencias del divisor R₁ = R₂', min: 1000, max: 10e6, value: 100000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('R1', 'r', v); T.set('R2', 'r', v); } },
        { type: 'select', id: 'rv', label: 'Voltímetro (resistencia de entrada R_V)', options: [[10e6, 'Multímetro digital: 10 MΩ'], [1e6, 'Osciloscopio: 1 MΩ'], [20e3, 'Analógico (20 kΩ/V en 1 V): 20 kΩ'], [10e9, 'Electrómetro: 10 GΩ']], value: 10e6, apply: (T, v) => T.set('RV', 'r', +v) },
        { type: 'slider', id: 'ra', label: 'Resistencia interna del amperímetro R_A', min: 0.01, max: 100, value: 1, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 2), apply: (T, v) => T.set('RA', 'r', v) },
        { type: 'slider', id: 'rc', label: 'Resistencia de carga del circuito del amperímetro', min: 1, max: 1000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RC', 'r', v) }
      ],
      outs: [
        { id: 'vt', label: 'Tensión verdadera en el divisor (sin instrumento)', fn: (T) => fmt(10 * T.net.part('R2').p.r / (T.net.part('R1').p.r + T.net.part('R2').p.r), 'V', 4) },
        { id: 'vm', label: 'Tensión que indica el voltímetro', hl: true, fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.m), 'V', 4) },
        { id: 've', label: 'Error del voltímetro', hl: true, fn: (T) => { const t = 10 * T.net.part('R2').p.r / (T.net.part('R1').p.r + T.net.part('R2').p.r), m = T.net.v(T.net.netInfo.labelNet.m); return EM.fix(100 * (m - t) / t, 2) + ' %'; } },
        { id: 'it', label: 'Corriente verdadera en la carga (sin amperímetro)', fn: (T) => fmt(10 / T.net.part('RC').p.r, 'A', 4) },
        { id: 'im', label: 'Corriente que indica el amperímetro', hl: true, fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.c) / T.net.part('RC').p.r, 'A', 4) },
        { id: 'ie', label: 'Error del amperímetro', hl: true, fn: (T) => { const t = 10 / T.net.part('RC').p.r, m = T.net.v(T.net.netInfo.labelNet.c) / T.net.part('RC').p.r; return EM.fix(100 * (m - t) / t, 2) + ' %'; } },
        { id: 'bv', label: 'Tensión de carga del amperímetro (burden) R_A·I', fn: (T) => fmt(T.net.part('RA').p.r * T.net.v(T.net.netInfo.labelNet.c) / T.net.part('RC').p.r, 'V') }
      ]
    });
  });

  /* ---------- 27.2 Sonda de osciloscopio ×10: compensación ---------- */
  EM.defineSim('c27-sonda', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['scope', 'bode'], tdiv: 2e-4, net: { damage: false },
      hint: 'Onda cuadrada de 1 kHz con una resistencia de fuente de 50 Ω. La sonda ×10 tiene 9 MΩ en paralelo con un condensador ajustable C_c; el osciloscopio presenta 1 MΩ y 120 pF (entrada y cable). (Los nodos con la misma etiqueta están unidos.)',
      probes: [{ label: 'señal', at: 'sig', color: '#ffd84a' }, { label: 'en el osciloscopio', at: 'osc', color: '#4ae3ff' }],
      spec: {
        parts: [['FG1', 'FG', 2, 12, 0, { wave: 'square', amp: 2.5, off: 2.5, f: 1000, rs: 50 }], ['Rp', 'R', 14, 10, 0, { r: 9e6 }], ['Cc', 'C', 14, 6, 0, { c: 13.3e-12, kind: 'c0g' }], ['Ri', 'R', 26, 16, 1, { r: 1e6 }], ['Ci', 'C', 32, 16, 1, { c: 120e-12, kind: 'c0g' }]],
        wires: [['FG1.OUT', '@sig:r'], ['FG1.GND', 'gnd'], ['Rp.0', '@sig:l'], ['Cc.0', '@sig:l'], ['Rp.1', '@osc:r'], ['Cc.1', '@osc:r'], ['Ri.0', '@osc:u'], ['Ri.1', 'gnd'], ['Ci.0', '@osc:u'], ['Ci.1', 'gnd']]
      },
      controls: [
        { type: 'slider', id: 'cc', label: 'Condensador de compensación C_c', min: 3e-12, max: 30e-12, step: 0.1e-12, value: 13.3e-12, unit: 'F', fmt: (v) => EM.fix(v * 1e12, 1) + ' p', apply: (T, v) => T.set('Cc', 'c', v) },
        { type: 'slider', id: 'ci', label: 'Capacitancia de entrada del osciloscopio y cable C_i', min: 50e-12, max: 300e-12, step: 1e-12, value: 120e-12, unit: 'F', fmt: (v) => EM.fix(v * 1e12, 0) + ' p', apply: (T, v) => T.set('Ci', 'c', v) }
      ],
      outs: [
        { id: 'ccx', label: 'C_c ideal = C_i/9', hl: true, fn: (T) => fmt(T.net.part('Ci').p.c / 9, 'F') },
        { id: 'dc', label: 'Atenuación en continua R_i/(R_p+R_i)', fn: (T) => EM.fix(T.net.part('Ri').p.r / (T.net.part('Rp').p.r + T.net.part('Ri').p.r), 4) },
        { id: 'est', label: 'Compensación', hl: true, fn: (T) => { const cc = T.net.part('Cc').p.c, id = T.net.part('Ci').p.c / 9, e = (cc - id) / id; return Math.abs(e) < 0.03 ? 'compensada (ondas cuadradas)' : e < 0 ? '<b style="color:var(--warn-ink)">subcompensada (esquinas redondeadas)</b>' : '<b style="color:var(--warn-ink)">sobrecompensada (esquinas con pico)</b>'; } },
        { id: 'ba', label: 'Ancho de banda de la sonda sin compensar 1/(2π·R_p∥R_i·(C_c+C_i))', fn: (T) => { const p = (id) => T.net.part(id).p, rp = p('Rp').r * p('Ri').r / (p('Rp').r + p('Ri').r); return fmt(1 / (2 * Math.PI * rp * (p('Cc').c + p('Ci').c)), 'Hz'); } }
      ]
    });
    T.setBode(10, 1e7);
  });

  /* ---------- 27.3 Tolerancias y propagación de errores (Monte Carlo) ---------- */
  EM.defineSim('c27-montecarlo', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Histograma de 4000 circuitos con componentes reales' });
    sim.group('Circuito y componentes');
    sim.select('c', { label: 'Circuito', options: [['div', 'Divisor 10 kΩ / 10 kΩ → V_sal/V_ent'], ['inv', 'Amplificador inversor (R_f/R_1 = 10)'], ['fc', 'Filtro RC: f_c = 1/(2πRC) (1 kHz nominal)'], ['res', 'Resistencia en serie: 1 kΩ + 2.2 kΩ + 4.7 kΩ']], value: 'div' });
    sim.select('t', { label: 'Tolerancia de los componentes', options: [[0.05, '5 % (carbón)'], [0.01, '1 % (película metálica)'], [0.001, '0.1 % (precisión)']], value: 0.05 });
    sim.slider('n', { label: 'Número de circuitos simulados', min: 500, max: 20000, step: 500, value: 4000, unit: '', log: true, fmt: (v) => EM.fix(v, 0) });
    sim.button('Otra muestra', () => { sim.seed = (sim.seed || 1) + 1; sim.redraw && sim.redraw(); });
    sim.out('nom', 'Valor nominal', { hl: true }); sim.out('mean', 'Media de la muestra'); sim.out('sd', 'Desviación típica σ', { hl: true }); sim.out('rng', 'Intervalo de ±2σ (95 %)', { hl: true }); sim.out('worst', 'Peor caso (todas las tolerancias en contra)'); sim.out('rel', 'σ relativa');
    const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
    /* componente con tolerancia t: distribución gaussiana con σ = t/2 (≈ 95 % dentro de la banda) */
    const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, t = +p.t, N = Math.round(p.n), r = rng(1234 + 977 * (sim.seed || 0));
      const comp = (nom) => nom * (1 + gauss(r) * t / 2);
      let f, nom, worst, unit;
      if (p.c === 'div') { f = () => { const a = comp(10000), b = comp(10000); return b / (a + b); }; nom = 0.5; unit = ''; worst = [(10000 * (1 - t)) / (10000 * (1 - t) + 10000 * (1 + t)), (10000 * (1 + t)) / (10000 * (1 + t) + 10000 * (1 - t))]; }
      else if (p.c === 'inv') { f = () => comp(100000) / comp(10000); nom = 10; unit = ''; worst = [10 * (1 - t) / (1 + t), 10 * (1 + t) / (1 - t)]; }
      else if (p.c === 'fc') { f = () => 1 / (2 * Math.PI * comp(1591.55) * comp(1e-7)); nom = 1000; unit = 'Hz'; worst = [1000 / ((1 + t) * (1 + t)), 1000 / ((1 - t) * (1 - t))]; }
      else { f = () => comp(1000) + comp(2200) + comp(4700); nom = 7900; unit = 'Ω'; worst = [7900 * (1 - t), 7900 * (1 + t)]; }
      const xs = []; let s = 0, s2 = 0;
      for (let i = 0; i < N; i++) { const x = f(); xs.push(x); s += x; s2 += x * x; }
      const mean = s / N, sd = Math.sqrt(Math.max(0, s2 / N - mean * mean));
      const lo = Math.min(...xs), hi = Math.max(...xs), span = Math.max(hi - lo, 1e-12);
      const nb = 41, bins = new Array(nb).fill(0);
      for (const x of xs) bins[Math.min(nb - 1, Math.floor((x - lo) / span * nb))]++;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const xmin = Math.min(lo, worst[0]) - 0.02 * span, xmax = Math.max(hi, worst[1]) + 0.02 * span;
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin, xmax, ymin: 0, ymax: Math.max(...bins) * 1.15, ml: 56, mr: 14, mt: 14, mb: 40, xlabel: 'valor' + (unit ? ' (' + unit + ')' : ''), ylabel: 'número de circuitos' });
      pl.frame();
      const bw = span / nb;
      for (let i = 0; i < nb; i++) pl.xy([lo + i * bw, lo + i * bw, lo + (i + 1) * bw, lo + (i + 1) * bw], [0, bins[i], bins[i], 0], { color: '--c1', width: 1.5 });
      pl.vline(nom, { color: '--ink-3', dash: [4, 4] });
      pl.vline(worst[0], { color: '--c2', dash: [6, 4] }); pl.vline(worst[1], { color: '--c2', dash: [6, 4] });
      pl.vline(mean - 2 * sd, { color: '--c3', dash: [2, 3] }); pl.vline(mean + 2 * sd, { color: '--c3', dash: [2, 3] });
      const f4 = (x) => (Math.abs(x) >= 100 ? EM.fix(x, 1) : Math.abs(x) >= 1 ? EM.fix(x, 3) : EM.fix(x, 4)) + (unit ? ' ' + unit : '');
      sim.set('nom', f4(nom)); sim.set('mean', f4(mean)); sim.set('sd', f4(sd)); sim.set('rng', f4(mean - 2 * sd) + ' a ' + f4(mean + 2 * sd)); sim.set('worst', f4(worst[0]) + ' a ' + f4(worst[1])); sim.set('rel', EM.fix(100 * sd / nom, 2) + ' %');
    });
  });
})();
