/* Práctica M1 · Caída libre */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const yL = (i) => 0.05 + 0.9 * 0.15 + i * ((0.9 * 0.78) / 14);
  MC.wiring.yL = yL;

  MC.wiring.def('foto-led', {
    mods: [{ id: 'pt', label: 'Fototransistor', fx: 0.72, fy: 0.42, fw: 0.16, fh: 0.15, pins: ['C', 'E'], fill: '--chip', size: 10 }],
    nodes: { v1: [0.5, 0.12], a1: [0.5, 0.34], k1: [0.5, 0.62], v2: [0.76, 0.12], c: [0.76, 0.33] }, dots: ['c'],
    parts: [{ type: 'res', a: 'n:v1', b: 'n:a1', label: '100 Ω' }, { type: 'led', a: 'n:a1', b: 'n:k1', label: 'LED IR' }, { type: 'res', a: 'n:v2', b: 'n:c', label: '10 kΩ' }],
    wires: [
      { a: 'esp:3V3', b: 'n:v1', c: '--wire-r', note: '3.3 V para el LED infrarrojo', sag: 0.02, route: [[0.42, 0.887], [0.42, 0.12]] },
      { a: 'n:v1', b: 'n:v2', c: '--wire-r', note: '3.3 V también para el fototransistor', sag: 0 },
      { a: 'n:k1', b: 'esp:GNDR', c: '--wire-k', note: 'cátodo del LED a tierra' },
      { a: 'n:c', b: 'pt:C', c: '--wire-y', note: 'colector del fototransistor', sag: 0 },
      { a: 'pt:E', b: 'esp:GNDR', c: '--wire-k', note: 'emisor a tierra' },
      { a: 'n:c', b: 'esp:D27', c: '--wire-y', note: 'señal: 0 V con luz, 3.3 V con el haz cortado → GPIO 27', route: [[0.66, 0.33], [0.66, 0.975], [0.012, 0.975], [0.012, yL(9)]] }
    ],
    labels: [{ text: 'haz infrarrojo →', fx: 0.56, fy: 0.5, size: 11, color: '--c2' }]
  });

  MC.defineSim('m1-caida', function (sim) {
    sim.cols2('0.8fr 1.4fr');
    const cs = sim.canvas({ aspect: 0.72, label: 'Escena' });
    const cg = sim.canvas({ aspect: 1.3, label: 'Datos y ajuste' });
    const tabA = MC.results(sim, ['Caída', '<i>v</i>₀ (m/s)', '<i>g</i> (m/s²)', '<i>u</i>(<i>g</i>) (m/s²)'], { decimals: [0, 3, 3, 3], title: 'Método A · una fila por caída', copy: false });
    const tabB = MC.results(sim, ['<i>h</i> (m)', '<i>t</i><sub>v</sub> (s)', '<i>t</i><sub>v</sub>² (s²)'], { decimals: [3, 4, 5], title: 'Método B · caídas del celular', copy: false });
    let last = null, lastB = null, nDrop = 0;
    sim.group('Método');
    sim.seg('met', { options: [['A', 'A · Valla + fotocompuerta'], ['B', 'B · Celular en vuelo']], value: 'A', onInput: () => sync() });
    const gA = sim.group('Método A');
    sim.slider('h0', { label: 'Altura de la primera franja sobre el haz', min: 1, max: 30, step: 0.5, value: 5, unit: 'cm', fmt: (v) => MC.fix(v, 1) });
    sim.slider('jit', { label: 'Incertidumbre de cada flanco', min: 1, max: 60, step: 1, value: 4, unit: 'µs', fmt: (v) => String(Math.round(v)) });
    sim.check('gira', { label: 'La valla gira al caer', value: false });
    sim.check('aire', { label: 'Incluir el arrastre del aire', value: true });
    sim.button('Soltar la valla', () => dropA(), { primary: true });
    const gB = sim.group('Método B');
    sim.slider('h', { label: 'Altura de caída del celular', min: 0.2, max: 1.5, step: 0.01, value: 0.8, unit: 'm', fmt: (v) => MC.fix(v, 2) });
    sim.slider('mano', { label: 'Lentitud al abrir la mano', min: 0, max: 80, step: 1, value: 25, unit: 'ms', fmt: (v) => String(Math.round(v)) });
    sim.button('Soltar el celular', () => dropB(), { primary: true });
    sim.group('Tabla');
    sim.button('Borrar la última', () => (sim.p.met === 'A' ? tabA : tabB).undo());
    sim.button('Borrar todo', () => (sim.p.met === 'A' ? tabA : tabB).clear());
    sim.out('res', 'Resultado del ajuste', { hl: true });
    sim.out('ref', 'Referencia (Popayán)');
    sim.dataCopy(() => (sim.p.met === 'A' ? (last ? { headers: ['i', 't_medio (s)', 'v (m/s)'], rows: last.tm.map((t, i) => [i + 1, t, last.v[i]]) } : { headers: [], rows: [] }) : { headers: ['h (m)', 't_v (s)'], rows: tabB.rows.map((r) => [r[0], r[1]]) }), 'Copiar los datos');
    function sync() {
      const a = sim.p.met === 'A';
      gA.hidden = !a; gB.hidden = a;
      tabA.show(a); tabB.show(!a);
      sim.redraw();
    }
    function dropA() {
      const v0 = Math.sqrt(2 * G * sim.p.h0 / 100);
      const m = 0.025, c = sim.p.aire ? (0.5 * 0.98 * 1.05 * 2.6e-4) / m : 0;
      const omega = sim.p.gira ? M.rad(25) * (Math.random() < 0.5 ? -1 : 1) : 0;
      let t = 0, v = v0, y = 0, phi = 0;
      const edges = [0];
      const h = 1e-6;
      let k = 1;
      while (k < 7 && t < 1) {
        v += (G - c * v * v) * h; y += v * h * Math.cos(phi) + 0 * h; t += h; phi = omega * t * 4;
        if (y >= 0.0192 * k) { edges.push(t); k++; }
      }
      const te = edges.map((x) => x + M.gauss(0, sim.p.jit * 1e-6));
      const tm = [], vv = [];
      for (let i = 1; i < te.length; i++) { tm.push((te[i] + te[i - 1]) / 2 - te[0]); vv.push(0.0192 / (te[i] - te[i - 1])); }
      const f = L.fitLine(tm, vv);
      nDrop++;
      last = { tm, v: vv, f, v0 };
      tabA.add([nDrop, f.b, f.m, f.sm]);
    }
    function dropB() {
      const h = sim.p.h, tv = Math.sqrt((2 * h) / G);
      const rel = sim.p.mano / 1000;
      const fs = 400, tr = [], fr = [];
      const t0 = 0.6;
      for (let i = 0; i < (t0 + rel + tv + 0.6) * fs; i++) {
        const t = i / fs;
        let f;
        if (t < t0) f = G + M.gauss(0, 0.15);
        else if (t < t0 + rel) f = G * (1 - (t - t0) / rel) + M.gauss(0, 0.4);
        else if (t < t0 + rel + tv) f = 0.05 + Math.abs(M.gauss(0, 0.04));
        else { const u = t - (t0 + rel + tv); f = G + 45 * Math.exp(-u / 0.02) * Math.abs(Math.cos(u * 60)) + 3 * Math.exp(-u / 0.15) * Math.sin(u * 30); }
        tr.push(t); fr.push(Math.max(0, f));
      }
      /* detección del vuelo: |f| < 3 m/s² */
      let a = -1, b = -1;
      for (let i = 0; i < fr.length; i++) { if (a < 0 && fr[i] < 3) a = i; if (a >= 0 && fr[i] >= 3 && i > a + 5) { b = i; break; } }
      const tvm = (b - a) / fs;
      lastB = { tr, fr, a: a / fs, b: b / fs };
      tabB.add([h, tvm, tvm * tvm]);
    }
    sync();
    dropA();
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const A = sim.p.met === 'A';
      if (A) {
        /* marco y valla */
        const u = Math.min(W / 14, H / 32);
        const gx = W / 2, gy = H * 0.62;
        for (let k = 0; k < 6; k++) { D.brick2d(ctx, gx - u * 5, gy + u * 1.2 * (6 - k) - 10 + u, 2, 3, u, '--lego-blue', { studs: false }); D.brick2d(ctx, gx + u * 3, gy + u * 1.2 * (6 - k) - 10 + u, 2, 3, u, '--lego-blue', { studs: false }); }
        D.line(ctx, gx - u * 3, gy, gx + u * 3, gy, { color: '--c2', width: 2, dash: [4, 3] });
        MC.text(ctx, 'haz IR', gx + u * 5.2, gy + 4, { size: 11, color: '--c2' });
        const top = gy - sim.p.h0 / 100 * (u / 0.008) - 14 * u * 1.2;
        for (let k = 0; k < 14; k++) {
          const y = top + (k + 1) * u * 1.2;
          ctx.fillStyle = MC.col(k % 2 ? '--lego-black' : '--lego-trans');
          ctx.fillRect(gx - u * 0.5, y - u * 1.2, u, u * 1.2);
          ctx.strokeStyle = MC.alpha('--ink', 0.3); ctx.strokeRect(gx - u * 0.5, y - u * 1.2, u, u * 1.2);
        }
        D.dim(ctx, gx + u * 1.2, gy, gx + u * 1.2, gy - sim.p.h0 / 100 * (u / 0.008), MC.fix(sim.p.h0, 1) + ' cm', { labelOff: 22 });
      } else {
        const sc = (H - 60) / 1.7;
        const fy = H - 24;
        ctx.fillStyle = MC.col('--body-e'); ctx.fillRect(W * 0.25, fy - 14, W * 0.5, 14);
        MC.text(ctx, 'cojín', W / 2, fy - 2, { size: 11, align: 'center', color: '--body-ink' });
        D.ground(ctx, 0, fy, W, { depth: 8 });
        const py = fy - 14 - sim.p.h * sc;
        D.phone(ctx, W / 2, py - 30, 30, 60, {});
        D.person(ctx, W * 0.2, py + 50, 110, { arms: 0.9 });
        D.dim(ctx, W * 0.8, fy - 14, W * 0.8, py, MC.fix(sim.p.h, 2) + ' m', { labelOff: 26 });
      }
      /* gráfica */
      const c2 = cg.ctx;
      D.clear(cg);
      if (A) {
        sim.set('ref', '9.777 m/s²');
        if (!last) return;
        const gs = tabA.col(2);
        const gm = M.mean(gs), su = gs.length > 1 ? M.std(gs) / Math.sqrt(gs.length) : last.f.sm;
        sim.set('res', `última: ${L.pm(last.f.m, last.f.sm, 'm/s²')}<br>promedio (${gs.length}): ${L.pm(gm, su, 'm/s²')}`);
        const { P } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, last.tm, last.v, { xlabel: ['t_{medio}', 's'], ylabel: ['v̄', 'm/s'], title: `Caída ${nDrop}: velocidad media en cada periodo de la valla`, zeroX: true });
        P.label(P.o.xmin + (P.o.xmax - P.o.xmin) * 0.05, P.o.ymax - (P.o.ymax - P.o.ymin) * 0.08, `pendiente = ${L.pm(last.f.m, last.f.sm)} m/s²`, { color: '--accent', mono: true, size: 12 });
      } else {
        sim.set('ref', 'pendiente esperada g/2 = 4.889 m/s²');
        const h1 = cg.h * 0.45;
        if (lastB) {
          const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: lastB.tr[lastB.tr.length - 1], ymin: 0, ymax: 30, xlabel: ['t', 's'], ylabel: ['|f|', 'm/s²'], mt: 22, title: 'Última caída: acelerómetro (absoluto)' });
          P.frame();
          P.band(lastB.a, lastB.b, { color: '--accent', alpha: 0.15 });
          P.hline(3, { color: '--ink-3', label: 'umbral 3 m/s²', labelRight: true });
          P.xy(lastB.tr, lastB.fr, { color: '--c5', width: 1.2 });
          P.label((lastB.a + lastB.b) / 2, 20, `t_v = ${MC.fix(lastB.b - lastB.a, 3)} s`, { align: 'center', color: '--accent', mono: true });
        }
        const xs = tabB.col(2), ys = tabB.col(0);
        const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, xs, ys, { xlabel: ['t_v^2', 's²'], ylabel: ['h', 'm'], title: 'h contra t_v²', zeroX: true, zeroY: true });
        sim.set('res', f && xs.length >= 3 && Math.max(...ys) - Math.min(...ys) > 0.05 ? `pendiente ${L.pm(f.m, f.sm, 'm/s²')} → g = ${L.pm(2 * f.m, 2 * f.sm, 'm/s²')}` : 'mida al menos 3 alturas distintas');
      }
    });
  });
})();
