/* Capítulo 8 — Programar neuronas */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;

  /* Conjuntos de datos 2D: puntos alrededor de las esquinas o nubes */
  function datos(tipo, seed) {
    const rng = L.rng(seed), X = [], y = [];
    const esquinas = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const tab = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], XOR: [0, 1, 1, 0] };
    if (tipo === 'NUBE') {
      for (let i = 0; i < 40; i++) { const c = i % 2; X.push([0.3 + 0.4 * c + 0.13 * rng.gauss(), 0.35 + 0.3 * c + 0.13 * rng.gauss()]); y.push(c); }
      return { X, y };
    }
    esquinas.forEach((e, k) => { for (let i = 0; i < 10; i++) { X.push([e[0] + 0.09 * rng.gauss(), e[1] + 0.09 * rng.gauss()]); y.push(tab[tipo][k]); } });
    return { X, y };
  }
  const puntos = (pl, X, y) => X.forEach((p, i) => pl.dot(p[0], p[1], { color: y[i] ? '--c2' : '--c1', r: 4.5 }));

  /* ======================================================================
     8.1 Perceptrón
     ====================================================================== */
  RC.defineSim('perceptron', function (sim) {
    const cv = sim.canvas({ aspect: 1.3, label: 'Puntos de dos clases y recta de decisión del perceptrón' });
    sim.group('Problema');
    sim.seg('tipo', { options: [['AND', 'AND'], ['OR', 'OR'], ['NUBE', 'Nubes'], ['XOR', 'XOR']], value: 'AND' });
    sim.slider('eta', { label: 'Tasa de aprendizaje η', min: 0.01, max: 0.5, step: 0.01, value: 0.1, fmt: (v) => RC.nf(v, 2) });
    let key = '', D, w, b, ep, i, errEp, histErr, acc = 0;
    const reset = () => { D = datos(sim.p.tipo, 3); w = [0.2, -0.5]; b = 0.1; ep = 0; i = 0; errEp = 0; histErr = []; };
    sim.resetButton(() => { key = ''; });
    sim.animate((dt) => {
      acc += dt;
      while (acc > 0.03) {
        acc -= 0.03;
        if (histErr.length && histErr[histErr.length - 1] === 0) return;
        if (ep >= 200) return;
        const x = D.X[i], t = D.y[i], out = w[0] * x[0] + w[1] * x[1] + b > 0 ? 1 : 0;
        if (out !== t) { w[0] += sim.p.eta * (t - out) * x[0]; w[1] += sim.p.eta * (t - out) * x[1]; b += sim.p.eta * (t - out); errEp++; }
        i++;
        if (i >= D.X.length) { histErr.push(errEp); errEp = 0; i = 0; ep++; }
      }
    });
    sim.out('ep', 'Épocas');
    sim.out('err', 'Errores en la última época', { hl: true });
    sim.out('w', 'Pesos y sesgo');
    sim.onDraw(() => {
      if (key !== sim.p.tipo) { key = sim.p.tipo; reset(); }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.4, xmax: 1.4, ymin: -0.4, ymax: 1.4, xlabel: 'x₁', ylabel: 'x₂' });
      pl.frame();
      /* semiplano de clase 1 */
      pl.clip((ctx) => {
        if (Math.abs(w[1]) > 1e-9) {
          const y1 = (x) => -(w[0] * x + b) / w[1];
          ctx.beginPath();
          ctx.moveTo(pl.X(-0.4), pl.Y(y1(-0.4))); ctx.lineTo(pl.X(1.4), pl.Y(y1(1.4)));
          const up = w[1] > 0;
          ctx.lineTo(pl.X(1.4), pl.Y(up ? 1.4 : -0.4)); ctx.lineTo(pl.X(-0.4), pl.Y(up ? 1.4 : -0.4)); ctx.closePath();
          ctx.fillStyle = RC.alpha('--c2', 0.1); ctx.fill();
        }
      });
      if (Math.abs(w[1]) > 1e-9) pl.fn((x) => -(w[0] * x + b) / w[1], { color: '--ink', width: 2 });
      puntos(pl, D.X, D.y);
      const last = histErr.length ? histErr[histErr.length - 1] : '—';
      sim.set('ep', String(ep) + (last === 0 ? ' <span class="gain">convergió</span>' : ep >= 200 ? ' <span class="loss">no converge</span>' : ''));
      sim.set('err', String(last));
      sim.set('w', `w = (${RC.nf(w[0], 2)}; ${RC.nf(w[1], 2)}), b = ${RC.nf(b, 2)}`);
    });
  });

  /* ======================================================================
     8.2 Red de dos capas con retropropagación
     ====================================================================== */
  RC.defineSim('mlp', function (sim) {
    const cv = sim.canvas({ aspect: 1.3, label: 'Salida de la red en el plano y puntos del problema XOR' });
    const ce = sim.canvas({ aspect: 3.4, label: 'Error de entrenamiento por época' });
    sim.group('Red');
    sim.slider('H', { label: 'Neuronas ocultas', min: 1, max: 8, step: 1, value: 3, fmt: (v) => RC.nf(v) });
    sim.slider('eta', { label: 'Tasa de aprendizaje', min: 0.05, max: 2, step: 0.05, value: 0.5, fmt: (v) => RC.nf(v, 2) });
    let seed = 1, key = '', net, D, ep, loss;
    sim.button('Otra inicialización', () => { seed++; key = ''; }, { id: 'init' });
    const sig = (z) => 1 / (1 + Math.exp(-z));
    const init = () => {
      const rng = L.rng(seed * 11), H = sim.p.H;
      net = { H, W1: Array.from({ length: H }, () => [rng.gauss(), rng.gauss()]), b1: new Array(H).fill(0).map(() => 0.5 * rng.gauss()), W2: Array.from({ length: H }, () => rng.gauss()), b2: 0 };
      D = datos('XOR', 5); ep = 0; loss = [];
    };
    const fwd = (x) => { const h = net.W1.map((w, j) => Math.tanh(w[0] * x[0] + w[1] * x[1] + net.b1[j])); const o = sig(h.reduce((s, v, j) => s + v * net.W2[j], net.b2)); return { h, o }; };
    const epoch = () => {
      let L2 = 0;
      const gW1 = net.W1.map(() => [0, 0]), gb1 = new Array(net.H).fill(0), gW2 = new Array(net.H).fill(0);
      let gb2 = 0;
      D.X.forEach((x, i) => {
        const { h, o } = fwd(x), e = o - D.y[i];
        L2 += e * e;
        const d2 = e * o * (1 - o);
        gb2 += d2;
        for (let j = 0; j < net.H; j++) {
          gW2[j] += d2 * h[j];
          const d1 = d2 * net.W2[j] * (1 - h[j] * h[j]);
          gW1[j][0] += d1 * x[0]; gW1[j][1] += d1 * x[1]; gb1[j] += d1;
        }
      });
      const n = D.X.length, eta = sim.p.eta * 4;
      for (let j = 0; j < net.H; j++) { net.W2[j] -= (eta * gW2[j]) / n; net.W1[j][0] -= (eta * gW1[j][0]) / n; net.W1[j][1] -= (eta * gW1[j][1]) / n; net.b1[j] -= (eta * gb1[j]) / n; }
      net.b2 -= (eta * gb2) / n;
      ep++;
      loss.push(L2 / n);
    };
    sim.animate(() => { if (ep < 3000) for (let k = 0; k < 15; k++) epoch(); });
    sim.out('ep', 'Épocas');
    sim.out('L', 'Error cuadrático medio', { hl: true });
    sim.out('ok', 'Puntos bien clasificados');
    sim.onDraw(() => {
      const kk = `${sim.p.H}|${seed}`;
      if (kk !== key) { key = kk; init(); }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.4, xmax: 1.4, ymin: -0.4, ymax: 1.4, xlabel: 'x₁', ylabel: 'x₂' });
      const G = 44, ctx = cv.ctx;
      for (let a = 0; a < G; a++) for (let c = 0; c < G; c++) {
        const x = -0.4 + (1.8 * (a + 0.5)) / G, y = -0.4 + (1.8 * (c + 0.5)) / G, o = fwd([x, y]).o;
        ctx.fillStyle = RC.alpha(o > 0.5 ? '--c2' : '--c1', 0.08 + 0.32 * Math.abs(2 * o - 1));
        ctx.fillRect(pl.X(-0.4 + (1.8 * a) / G), pl.Y(-0.4 + (1.8 * (c + 1)) / G), pl.iw / G + 1, pl.ih / G + 1);
      }
      pl.frame();
      puntos(pl, D.X, D.y);
      RC.draw.clear(ce);
      const pe = new RC.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: Math.max(100, ep), ymin: 0, ymax: 0.3, xlabel: 'época', ylabel: 'error', mt: 8 });
      pe.frame();
      if (loss.length > 1) pe.xy(loss.map((_, i) => i + 1), loss, { color: '--c1', width: 2 });
      const ok = D.X.filter((x, i) => (fwd(x).o > 0.5 ? 1 : 0) === D.y[i]).length;
      sim.set('ep', String(ep));
      sim.set('L', loss.length ? RC.nf(loss[loss.length - 1], 4) : '—');
      sim.set('ok', `${ok} de ${D.X.length}`);
    });
  });

  /* ======================================================================
     8.3 Integración óptima vista + tacto (Ernst y Banks, 2002)
     ====================================================================== */
  RC.defineSim('bayes', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Distribuciones de la altura estimada por la vista, el tacto y su combinación' });
    sim.group('Señales');
    sim.slider('sv', { label: 'Ruido de la imagen: desviación de la vista (mm)', min: 0.5, max: 8, step: 0.1, value: 1, fmt: (v) => RC.nf(v, 1) });
    sim.slider('sh', { label: 'Desviación del tacto (mm)', min: 0.5, max: 8, step: 0.1, value: 2.5, fmt: (v) => RC.nf(v, 1) });
    sim.slider('conf', { label: 'Discrepancia vista − tacto (mm)', min: -6, max: 6, step: 0.5, value: 3, fmt: (v) => RC.nf(v, 1) });
    sim.out('wv', 'Peso de la vista', { hl: true });
    sim.out('est', 'Altura percibida');
    sim.out('sc', 'Desviación combinada');
    sim.onDraw(() => {
      const s0 = 55, sV = s0 + sim.p.conf / 2, sH = s0 - sim.p.conf / 2;
      const c = L.learn.cueComb(sim.p.sv, sim.p.sh);
      const sC = c.wV * sV + c.wH * sH;
      const g = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
      RC.draw.clear(cv);
      const ymax = g(0, 0, c.s) * 1.12;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 40, xmax: 70, ymin: 0, ymax, yticks: [], xlabel: 'altura de la barra (mm)', ml: 16 });
      pl.frame();
      pl.fn((x) => g(x, sV, sim.p.sv), { color: '--c4', width: 2.2, fill: '--c4', fillAlpha: 0.08 });
      pl.fn((x) => g(x, sH, sim.p.sh), { color: '--c3', width: 2.2, fill: '--c3', fillAlpha: 0.08 });
      pl.fn((x) => g(x, sC, c.s), { color: '--c2', width: 2.8, fill: '--c2', fillAlpha: 0.12 });
      pl.vline(sC, { color: '--c2', dash: [] });
      pl.legend([{ label: 'vista', color: '--c4' }, { label: 'tacto', color: '--c3' }, { label: 'combinación óptima', color: '--c2' }], 'tr');
      sim.set('wv', RC.pct(c.wV, 0));
      sim.set('est', `${RC.nf(sC, 1)} mm (vista ${RC.nf(sV, 1)}, tacto ${RC.nf(sH, 1)})`);
      sim.set('sc', `${RC.nf(c.s, 2)} mm (mejor sentido solo: ${RC.nf(Math.min(sim.p.sv, sim.p.sh), 2)})`);
    });
  });

  RC.defineSim('quiz-programar', function (sim) {
    RC.quiz(sim, [
      { q: '¿Por qué un perceptrón no puede aprender XOR?', opts: ['Porque aprende muy lento', 'Porque las clases no se pueden separar con una recta', 'Porque necesita más datos'], ok: 1, fb: 'XOR no es linealmente separable; hace falta una capa oculta.' },
      { q: '¿Qué hace la retropropagación?', opts: ['Reparte el error de la salida hacia atrás con la regla de la cadena para ajustar cada peso', 'Copia los pesos de una red a otra', 'Elimina neuronas'], ok: 0, fb: 'Calcula cuánto contribuyó cada peso al error.' },
      { q: '¿Se sabe que el cerebro usa retropropagación?', opts: ['Sí', 'No: es una pregunta abierta; sus reglas conocidas son locales', 'Está refutado'], ok: 1, fb: 'Hay propuestas de aproximaciones biológicas, pero nada demostrado.' },
      { q: 'En el experimento de Ernst y Banks, al hacer borrosa la imagen…', opts: ['Las personas siguieron guiándose por la vista', 'Pasaron a guiarse más por el tacto, como predice la ponderación por confiabilidad', 'Dejaron de poder estimar'], ok: 1, fb: 'El peso de cada sentido es proporcional a su precisión.' },
      { q: '¿Qué afirmación sobre «programar» el cerebro es correcta?', opts: ['Unas frases bien dichas instalan un programa nuevo', 'El cerebro aprende cambiando sus sinapsis con la experiencia repetida; las palabras pueden iniciar el cambio, no instalarlo', 'El cerebro no cambia'], ok: 1, fb: 'El «programa» son las sinapsis, y cambian con lo que se hace.' }
    ], { id: 'programar', shuffle: true });
  });
})();
