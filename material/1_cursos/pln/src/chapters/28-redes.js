/* Capítulo 28 — Redes neuronales para texto */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, N = L.nn;

  /* ---- 1. Perceptrón multicapa en datos 2D ---- */
  NL.defineSim('red-mlp', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.15, label: 'Frontera de decisión de la red' });
    const cv2 = sim.canvas({ aspect: 1.15, label: 'Pérdida durante el entrenamiento' });
    let red = null, datos = null, hist = [], clave = '';
    const reiniciar = () => {
      datos = N.datos(sim.p.d, 200, 5);
      const ocultas = sim.p.a.split(',').map(Number);
      red = N.mlp([2, ...ocultas, 1], sim.p.f, 2); hist = []; clave = [sim.p.d, sim.p.a, sim.p.f].join('|');
    };
    sim.group('Datos y arquitectura');
    sim.select('d', { label: 'Conjunto de datos', options: [['xor', 'XOR (cuatro cúmulos)'], ['circulos', 'Dos círculos'], ['lunas', 'Dos lunas'], ['espirales', 'Dos espirales']], value: 'lunas' });
    sim.select('a', { label: 'Capas ocultas (neuronas)', options: [['1', '1'], ['2', '2'], ['4', '4'], ['8', '8'], ['8,8', '8 + 8'], ['16,16', '16 + 16']], value: '8' });
    sim.select('f', { label: 'Activación de las capas ocultas', options: [['tanh', 'tanh'], ['relu', 'ReLU'], ['sigmoide', 'sigmoide']], value: 'tanh' });
    sim.group('Optimización');
    sim.select('o', { label: 'Algoritmo', options: [['adam', 'Adam'], ['sgd', 'Descenso de gradiente']], value: 'adam' });
    sim.select('r', { label: 'Ritmo de aprendizaje', options: [['0.01', '0,01'], ['0.03', '0,03'], ['0.1', '0,1'], ['0.5', '0,5']], value: '0.03' });
    const entrenar = (n) => { if (!red || clave !== [sim.p.d, sim.p.a, sim.p.f].join('|')) reiniciar(); for (let i = 0; i < n; i++) hist.push(N.paso(red, datos.X, datos.y, +sim.p.r, sim.p.o)); };
    sim.button('Entrenar 50 pasos', () => { entrenar(50); }, { primary: true });
    sim.button('Entrenar 300 pasos', () => { entrenar(300); });
    sim.button('Reiniciar pesos', () => { reiniciar(); });
    sim.out('e', 'Pasos de entrenamiento', { hl: true });
    sim.out('l', 'Pérdida');
    sim.out('x', 'Exactitud (todos los puntos)');
    sim.out('p', 'Parámetros');
    sim.animate(() => { entrenar(6); }, { autoplay: false });
    sim.onDraw(() => {
      if (!red || clave !== [sim.p.d, sim.p.a, sim.p.f].join('|')) reiniciar();
      sim.set('e', String(hist.length)); sim.set('l', hist.length ? NL.fix(hist[hist.length - 1], 4) : '—'); sim.set('x', NL.pct(N.exactitud(red, datos.X, datos.y), 1)); sim.set('p', String(N.nParametros(red)));
      /* frontera */
      const ctx = cv.ctx; ctx.clearRect(0, 0, cv.w, cv.h);
      const pl = new NL.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -2.4, xmax: 2.4, ymin: -2.4, ymax: 2.4, xlabel: 'x₁', ylabel: 'x₂', mb: 34, zero: false });
      const G = 34, cw = pl.iw / G, ch = pl.ih / G;
      for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
        const x1 = pl.invX(pl.ix + (i + 0.5) * cw), x2 = pl.invY(pl.iy + (j + 0.5) * ch), p = N.prob(red, [x1, x2]);
        ctx.fillStyle = p >= 0.5 ? NL.alpha('--c2', 0.12 + 0.4 * (p - 0.5) * 2) : NL.alpha('--c1', 0.12 + 0.4 * (0.5 - p) * 2);
        ctx.fillRect(pl.ix + i * cw, pl.iy + j * ch, cw + 0.6, ch + 0.6);
      }
      pl.frame();
      datos.X.forEach((x, i) => pl.dot(x[0], x[1], { color: datos.y[i] ? '--c2' : '--c1', r: 3.2 }));
      /* pérdida */
      const p2 = new NL.Plot(cv2.ctx, { x: 0, y: 0, w: cv2.w, h: cv2.h, xmin: 0, xmax: Math.max(60, hist.length), ymin: 0, ymax: 0.9, xlabel: 'paso', ylabel: 'pérdida', mb: 34 });
      cv2.ctx.clearRect(0, 0, cv2.w, cv2.h); p2.frame();
      if (hist.length > 1) { const st = Math.max(1, Math.floor(hist.length / 300)); const xs = [], ys = []; for (let i = 0; i < hist.length; i += st) { xs.push(i + 1); ys.push(Math.min(hist[i], 0.9)); } p2.xy(xs, ys, { color: '--c3', width: 2 }); }
      p2.hline(Math.log(2), { color: '--ink-3', dash: [4, 4] });
    });
  });

  /* ---- 2. El gradiente que se desvanece: RNN frente a LSTM ---- */
  const rotar = (rng, H, rho) => {
    const W = Array.from({ length: H }, () => Float64Array.from({ length: H }, () => rng.gauss() / Math.sqrt(H)));
    /* norma espectral por iteración de potencias sobre WᵀW, para escalarla a rho */
    let v = Float64Array.from({ length: H }, () => rng.gauss()), s = 1;
    for (let it = 0; it < 60; it++) {
      const u = W.map((r) => r.reduce((a, w, j) => a + w * v[j], 0)), t = new Float64Array(H);
      for (let i = 0; i < H; i++) for (let j = 0; j < H; j++) t[j] += W[i][j] * u[i];
      const nm = Math.sqrt(t.reduce((a, b) => a + b * b, 0)) || 1; s = Math.sqrt(nm); v = t.map((x) => x / nm);
    }
    return W.map((r) => r.map((w) => w * rho / s));
  };
  NL.defineSim('rec-gradiente', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Norma del gradiente según la distancia' });
    sim.group('Red recurrente simple');
    sim.slider('rho', { label: 'Norma espectral de la matriz recurrente', min: 0.4, max: 2.2, step: 0.05, value: 0.9, fmt: (v) => NL.fix(v, 2) });
    sim.group('LSTM');
    sim.slider('b', { label: 'Sesgo de la puerta de olvido', min: -2, max: 5, step: 0.25, value: 1, fmt: (v) => NL.fix(v, 2) });
    sim.group('Secuencia');
    sim.slider('T', { label: 'Longitud de la secuencia', min: 10, max: 80, step: 5, value: 50, fmt: (v) => String(v) });
    sim.out('r', 'RNN: gradiente a 20 pasos', { hl: true });
    sim.out('l', 'LSTM: gradiente a 20 pasos');
    sim.onDraw(() => {
      const H = 16, T = sim.p.T, rng = L.rng(9), W = rotar(rng, H, sim.p.rho), U = Array.from({ length: H }, () => Float64Array.from({ length: 3 }, () => rng.gauss()));
      /* estados de la RNN con entradas aleatorias; jacobianos J_t = diag(1 − h²) W */
      let h = new Float64Array(H); const Js = [];
      for (let t = 0; t < T; t++) {
        const x = [rng.gauss(), rng.gauss(), rng.gauss()], z = W.map((r, i) => r.reduce((a, w, j) => a + w * h[j], 0) + U[i].reduce((a, u, j) => a + u * x[j], 0));
        h = Float64Array.from(z, Math.tanh); Js.push(W.map((r, i) => r.map((w) => w * (1 - h[i] * h[i]))));
      }
      const rnn = [], lstm = []; let P = null;
      for (let k = 1; k < T; k++) {
        const J = Js[T - k];
        P = P ? J.map((r, i) => Float64Array.from({ length: H }, (_, j) => r.reduce((a, v, m) => a + v * P[m][j], 0))) : J.map((r) => Float64Array.from(r));
        rnn.push(Math.sqrt(P.reduce((a, r) => a + r.reduce((b, v) => b + v * v, 0), 0)));
      }
      /* LSTM, trayectoria de la celda: ∂c_T/∂c_t = diag(f_T … f_{t+1}) */
      const prod = new Float64Array(H).fill(1), r2 = L.rng(11);
      const z0 = Float64Array.from({ length: H }, () => r2.gauss());
      for (let k = 1; k < T; k++) { for (let i = 0; i < H; i++) { const f = 1 / (1 + Math.exp(-(z0[i] * 0.5 + r2.gauss() * 0.3 + sim.p.b))); prod[i] *= f; } lstm.push(Math.sqrt(prod.reduce((a, v) => a + v * v, 0))); }
      const lg = (v) => Math.log10(Math.max(v, 1e-12));
      const at = Math.min(20, T - 1) - 1;
      sim.set('r', NL.sci(rnn[at], 2)); sim.set('l', NL.sci(lstm[at], 2));
      const ctx = cv.ctx; ctx.clearRect(0, 0, cv.w, cv.h);
      const lo = Math.min(-8, ...rnn.map(lg), ...lstm.map(lg)), hi = Math.max(1, ...rnn.map(lg), ...lstm.map(lg)), pl = new NL.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: T - 1, ymin: lo, ymax: hi, xlabel: 'distancia entre el paso final y el paso t', ylabel: 'log₁₀ de la norma del gradiente', mb: 36 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [4, 4] });
      const xs = rnn.map((_, i) => i + 1);
      pl.xy(xs, rnn.map(lg), { color: '--c1', width: 2.2 }); pl.xy(xs, lstm.map(lg), { color: '--c2', width: 2.2 });
      pl.legend([{ label: 'RNN simple: ∏ diag(1 − h²)·W', color: '--c1' }, { label: 'LSTM, trayectoria de la celda: ∏ f', color: '--c2' }], 'tr');
    });
  });

  NL.bank.add('redes', [
    { q: 'Una neurona artificial calcula…', opts: ['Una suma ponderada de sus entradas más un sesgo, seguida de una función de activación', 'El promedio de sus entradas', 'El máximo de sus entradas', 'Solo una función lineal'], ok: 0, fb: 'a = f(w·x + b). Sin la no linealidad f, varias capas equivaldrían a una sola.', lvl: 1 },
    { q: 'Un perceptrón multicapa con una capa oculta no lineal puede resolver XOR porque…', opts: ['La capa oculta crea una representación donde las clases son separables linealmente', 'Tiene más neuronas', 'Usa más datos', 'XOR es lineal'], ok: 0, fb: 'Un modelo lineal no puede separar XOR; una capa oculta con no linealidad, sí.', lvl: 2 },
    { q: 'La retropropagación sirve para…', opts: ['Calcular los gradientes de la pérdida respecto de todos los pesos aplicando la regla de la cadena', 'Hacer la predicción', 'Elegir la arquitectura', 'Tokenizar'], ok: 0, fb: 'Propaga el error desde la salida hacia atrás; el descenso de gradiente usa esos gradientes para actualizar.', lvl: 1 },
    { q: 'Un perceptrón 2-8-8-1 tiene cuántos parámetros (pesos y sesgos)?', num: 105, tol: 0, fb: '2·8 + 8 + 8·8 + 8 + 8·1 + 1 = 16 + 8 + 64 + 8 + 8 + 1 = 105.', lvl: 2 },
    { q: 'Una red recurrente procesa una secuencia…', opts: ['Paso a paso, con un estado oculto que resume lo visto hasta ahora', 'Toda a la vez sin memoria', 'Solo de derecha a izquierda', 'Solo palabras sueltas'], ok: 0, fb: 'h_t = f(x_t, h_{t−1}); los mismos pesos se reutilizan en todos los pasos.', lvl: 1 },
    { q: 'El gradiente se desvanece en una RNN simple porque…', opts: ['Se multiplica por muchas matrices y derivadas menores que 1 al retroceder en el tiempo', 'Las palabras desaparecen', 'Falta memoria en el ordenador', 'La pérdida se reinicia'], ok: 0, fb: 'Es un producto de jacobianos; si su norma es menor que 1, decae exponencialmente con la distancia.', lvl: 2 },
    { q: 'La LSTM combate el desvanecimiento del gradiente con…', opts: ['Un estado de celda con puertas, cuyo camino aditivo deja pasar el gradiente casi sin cambios', 'Más datos', 'Una activación distinta', 'Menos capas'], ok: 0, fb: 'c_t = f·c_{t−1} + i·g; con f ≈ 1, el gradiente atraviesa muchos pasos.', lvl: 2 },
    { q: 'En una convolución 1D con filtro de ancho 3 sobre un texto, cada posición del mapa de rasgos mira…', opts: ['Tres palabras consecutivas, como un detector de trigramas aprendido', 'Toda la frase', 'Una sola palabra', 'Solo la última palabra'], ok: 0, fb: 'El max-pooling temporal luego se queda con la posición donde el filtro más se activa.', lvl: 2 },
    { q: 'Una convolución 1D sobre T = 9 palabras con filtro de ancho 3 (sin relleno) da una salida de longitud…', num: 7, tol: 0, fb: 'T − k + 1 = 9 − 3 + 1 = 7.', lvl: 1 },
    { q: 'En el experimento del capítulo con 80 ejemplos, la LSTM obtuvo 0,819 frente a 0,944 de la CNN. Una explicación razonable es…', opts: ['Con pocos datos, la LSTM (más parámetros y entrenamiento secuencial) tiene más difícil generalizar que un modelo más simple', 'La LSTM no sirve para texto', 'La CNN es siempre mejor', 'El corpus está mal'], ok: 0, fb: 'Con corpus pequeños los modelos sencillos suelen ganar; las arquitecturas grandes necesitan datos o preentrenamiento.', lvl: 3 }
  ]);
})();
