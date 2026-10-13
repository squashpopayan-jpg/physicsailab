/* Capítulo 31 — Errores frecuentes y el modelo en producción */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     31.1 Detective de errores: puntaje reportado frente a real
     ====================================================================== */
  const SC = {
    dup: {
      n: 'Duplicados entre entrenamiento y prueba', m: 'exactitud (1-NN)',
      d: 'Cada caso aparece dos veces (por ejemplo, la misma foto con distinto nombre). Al partir al azar, la copia de cada caso de prueba está en entrenamiento y el vecino más cercano la reconoce. Separar por grupo de duplicados da el valor real.',
      run(r) {
        const base = L.data.make2d('moons', 150, 0.6, r), X = [], y = [], g = [];
        base.X.forEach((x, i) => { for (let c = 0; c < 2; c++) { X.push([x[0] + 0.01 * r.gauss(), x[1] + 0.01 * r.gauss()]); y.push(base.y[i]); g.push(i); } });
        const s = L.data.split(X.length, 0.3, r), m1 = L.knn.classifier(s.train.map((i) => X[i]), s.train.map((i) => y[i]), 1);
        const rep = L.met.accuracy(s.test.map((i) => y[i]), m1.predict(s.test.map((i) => X[i])));
        const ids = r.perm(150), teG = new Set(ids.slice(0, 45)), tr = U.range(X.length).filter((i) => !teG.has(g[i])), te = U.range(X.length).filter((i) => teG.has(g[i]));
        const m2 = L.knn.classifier(tr.map((i) => X[i]), tr.map((i) => y[i]), 1);
        return [rep, L.met.accuracy(te.map((i) => y[i]), m2.predict(te.map((i) => X[i])))];
      }
    },
    time: {
      n: 'Validación al azar en una serie temporal', m: 'R² (k-NN sobre el tiempo)',
      d: 'Se predice una serie con su propia fecha como variable. Con partición al azar, cada día de prueba tiene vecinos de ayer y mañana en entrenamiento: el modelo interpola. Prediciendo el futuro (últimos 30 %), el R² se desploma.',
      run(r) {
        const n = 300, X = [], y = []; let v = 0;
        for (let t = 0; t < n; t++) { v = 0.95 * v + r.gauss(); X.push([t]); y.push(v); }
        const s = L.data.split(n, 0.3, r), m1 = L.knn.regressor(s.train.map((i) => X[i]), s.train.map((i) => y[i]), 3);
        const rep = L.met.r2(s.test.map((i) => y[i]), m1.predict(s.test.map((i) => X[i])));
        const cut = Math.round(0.7 * n), m2 = L.knn.regressor(X.slice(0, cut), y.slice(0, cut), 3);
        return [rep, L.met.r2(y.slice(cut), m2.predict(X.slice(cut)))];
      }
    },
    leak: {
      n: 'Una variable que se conoce después del resultado', m: 'AUC (logística)',
      d: 'La variable «días de cobranza» solo existe si el cliente ya incumplió. Con ella el modelo parece casi perfecto; en producción, al momento de decidir, no está disponible y el AUC real es el de las otras variables.',
      run(r) {
        const n = 1500, X = [], y = [];
        for (let i = 0; i < n; i++) { const a = r.gauss(), b = r.gauss(), yy = r() < U.sigmoid(-1 + 0.8 * a + 0.5 * b) ? 1 : 0; X.push([a, b, yy * (20 + 10 * r()) + 2 * r.gauss()]); y.push(yy); }
        const tr = U.range(1000), te = U.range(500).map((i) => i + 1000);
        const m1 = L.lin.logistic(tr.map((i) => X[i]), tr.map((i) => y[i]), { C: 1 }), m2 = L.lin.logistic(tr.map((i) => X[i].slice(0, 2)), tr.map((i) => y[i]), { C: 1 });
        return [L.met.auc(te.map((i) => y[i]), m1.proba(te.map((i) => X[i]))), L.met.auc(te.map((i) => y[i]), m2.proba(te.map((i) => X[i].slice(0, 2))))];
      }
    },
    imb: {
      n: 'Exactitud con clases desbalanceadas', m: 'exactitud frente a exactitud balanceada',
      d: 'Con 2 % de positivos, un modelo que nunca detecta nada obtiene 98 % de exactitud. La métrica correcta (exactitud balanceada, AP, exhaustividad) revela que no sirve.',
      run(r) {
        const y = U.range(2000).map(() => (r() < 0.02 ? 1 : 0)), p = y.map(() => 0), m = L.met.binary(y, p);
        return [m.acc, m.bacc];
      }
    },
    sel: {
      n: 'Seleccionar variables antes de validar', m: 'exactitud (centroide más cercano)',
      d: 'Con 500 variables aleatorias, se eligen las 10 más asociadas a la etiqueta usando todos los datos y luego se valida: el puntaje sale muy por encima del azar. Repitiendo la selección dentro de cada pliegue, vuelve al 50 %.',
      run(r) {
        const n = 50, p = 500, X = Array.from({ length: n }, () => Array.from({ length: p }, () => r.gauss())), y = U.range(n).map((i) => i % 2);
        const top = (idx) => { const sc = U.range(p).map((j) => { const a = L.stat.mean(idx.filter((i) => y[i]).map((i) => X[i][j])), b = L.stat.mean(idx.filter((i) => !y[i]).map((i) => X[i][j])); return Math.abs(a - b); }); return U.argsort(sc, true).slice(0, 10); };
        const folds = L.data.stratKfold(y, 5, r);
        const evalF = (f, feats) => { const c = [0, 1].map((k) => feats.map((j) => L.stat.mean(f.train.filter((i) => y[i] === k).map((i) => X[i][j])))); return L.stat.mean(f.test.map((i) => { const d0 = feats.reduce((s, j, q) => s + (X[i][j] - c[0][q]) ** 2, 0), d1 = feats.reduce((s, j, q) => s + (X[i][j] - c[1][q]) ** 2, 0); return (d1 < d0 ? 1 : 0) === y[i] ? 1 : 0; })); };
        const g = top(U.range(n));
        return [L.stat.mean(folds.map((f) => evalF(f, g))), L.stat.mean(folds.map((f) => evalF(f, top(f.train))))];
      }
    }
  };
  ML.defineSim('detective-errores', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.group('Caso');
    sim.select('sc', { label: 'Error metodológico', options: Object.keys(SC).map((k) => [k, SC[k].n]), value: 'dup' });
    sim.button('Repetir con otros datos', () => { seed++; cache = null; }, { id: 'seed' });
    sim.out('rep', 'Lo que se reporta', { hl: true });
    sim.out('real', 'Lo que ocurrirá en realidad', { hl: true });
    sim.out('why', 'Qué pasó', { wide: true });
    let seed = 1, cache = null;
    sim.onChange = () => { cache = null; };
    sim.onDraw(() => {
      const s = SC[sim.p.sc];
      if (!cache) cache = s.run(L.rng(40 + seed));
      const [rep, real] = cache;
      ML.draw.clear(cv);
      ML.text(cv.ctx, s.m, 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      const lo = Math.min(0, real, rep);
      ML.hbars(cv.ctx, { x: 6, y: 30, w: cv.w - 12, h: cv.h - 40 }, [{ label: 'evaluación con el error', value: rep, color: '--c2' }, { label: 'evaluación correcta', value: real, color: '--c3' }], { labelW: 170, min: lo, max: 1, fmt: f3, barH: 34 });
      sim.set('rep', f3(rep));
      sim.set('real', f3(real));
      sim.set('why', s.d);
    });
  });

  /* ======================================================================
     31.2 Deriva de datos y de concepto
     ====================================================================== */
  ML.defineSim('deriva-datos', function (sim) {
    sim.cols2();
    const ch = sim.canvas({ aspect: 1.05 }), cc = sim.canvas({ aspect: 1.05 });
    sim.group('Cambios después del entrenamiento');
    sim.slider('shift', { label: 'Deriva de las entradas (desplazamiento de x₁)', min: 0, max: 2, step: 0.05, value: 0, fmt: f2 });
    sim.slider('concept', { label: 'Deriva de concepto (cambio del efecto de x₂)', min: 0, max: 2.5, step: 0.05, value: 0, fmt: f2 });
    sim.out('psi', 'PSI de x₁', { hl: true });
    sim.out('auc', 'AUC: al entrenar / ahora');
    sim.out('cal', 'Tasa real / tasa predicha ahora');
    sim.out('alert', 'Alerta');
    const gen = (n, mu, dc, r) => { const X = [], y = []; for (let i = 0; i < n; i++) { const a = mu + r.gauss(), b = r.gauss(); X.push([a, b]); y.push(r() < U.sigmoid(-0.5 + 1.2 * a + (0.8 - dc) * b) ? 1 : 0); } return { X, y }; };
    const ref = gen(3000, 0, 0, L.rng(1)), m = L.lin.logistic(ref.X, ref.y, { C: 1 });
    const aucRef = L.met.auc(ref.y, m.proba(ref.X));
    const psi = (a, b) => { const qs = Array.from(L.util.linspace(0, 1, 11), (q) => L.stat.quantile(a, q)); qs[0] = -Infinity; qs[10] = Infinity; let s = 0; for (let k = 0; k < 10; k++) { const pa = Math.max(1e-6, a.filter((v) => v > qs[k] && v <= qs[k + 1]).length / a.length), pb = Math.max(1e-6, b.filter((v) => v > qs[k] && v <= qs[k + 1]).length / b.length); s += (pb - pa) * Math.log(pb / pa); } return s; };
    sim.onDraw(() => {
      const now = gen(3000, sim.p.shift, sim.p.concept, L.rng(2)), pr = m.proba(now.X);
      const a = ref.X.map((x) => x[0]), b = now.X.map((x) => x[0]), P = psi(a, b);
      ML.draw.clear(ch);
      const ph = new ML.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: -4, xmax: 6, ymin: 0, ymax: 0.5, xlabel: 'x₁', ylabel: 'densidad', title: 'distribución de x₁' });
      ph.frame();
      ML.drawHist(ph, L.stat.hist(a, -4, 6, 40), { color: '--c6', alpha: 0.4 });
      ML.drawHist(ph, L.stat.hist(b, -4, 6, 40), { color: '--c1', alpha: 0.45 });
      ph.legend([{ label: 'entrenamiento', color: '--c6', kind: 'sq' }, { label: 'ahora', color: '--c1', kind: 'sq' }]);
      ML.draw.clear(cc);
      const c = L.met.calibration(now.y, pr, 10);
      const pc = new ML.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'probabilidad predicha', ylabel: 'frecuencia real', title: 'calibración con datos de ahora' });
      pc.frame();
      pc.fn((x) => x, { color: '--ink-3', dash: [5, 4], width: 1.3 });
      pc.path(c.pred.map((p, i) => [p, c.true[i]]), { color: '--c2', width: 2.2 });
      c.pred.forEach((p, i) => pc.dot(p, c.true[i], { color: '--c2', r: 3.5 }));
      const aucNow = L.met.auc(now.y, pr);
      sim.set('psi', f3(P) + (P > 0.25 ? '  (cambio grande)' : P > 0.1 ? '  (cambio moderado)' : '  (estable)'));
      sim.set('auc', `${f3(aucRef)} / ${f3(aucNow)}`);
      sim.set('cal', `${f3(L.stat.mean(now.y))} / ${f3(L.stat.mean(pr))}`);
      sim.set('alert', P > 0.25 && aucRef - aucNow < 0.02 ? 'las entradas cambiaron pero el modelo sigue funcionando: vigile' : aucRef - aucNow > 0.03 ? '<b>el modelo se degradó: reentrene o revise</b>' : 'sin alerta');
    });
  });

  /* ======================================================================
     31.3 Equidad: umbrales y criterios incompatibles
     ====================================================================== */
  ML.defineSim('equidad-umbral', function (sim) {
    const cv = sim.canvas({ aspect: 2.7 });
    sim.group('Grupos');
    sim.slider('pa', { label: 'Prevalencia del grupo A', min: 0.1, max: 0.7, step: 0.01, value: 0.5, fmt: pct });
    sim.slider('pb', { label: 'Prevalencia del grupo B', min: 0.1, max: 0.7, step: 0.01, value: 0.3, fmt: pct });
    sim.group('Umbrales');
    sim.slider('ta', { label: 'Umbral del grupo A', min: -1, max: 2, step: 0.01, value: 0.5, fmt: f2 });
    sim.slider('tb', { label: 'Umbral del grupo B', min: -1, max: 2, step: 0.01, value: 0.5, fmt: f2 });
    sim.out('tab', 'Resultados por grupo', { wide: true });
    sim.out('gaps', 'Diferencias entre grupos', { wide: true });
    sim.onDraw(() => {
      const r = L.rng(5), mk = (n, prev, sd) => { const y = [], s = []; for (let i = 0; i < n; i++) { const v = r() < prev ? 1 : 0; y.push(v); s.push(v + sd * r.gauss()); } return { y, s }; };
      const A = mk(3000, sim.p.pa, 0.6), B = mk(3000, sim.p.pb, 0.9);
      const mA = L.met.binary(A.y, A.s.map((v) => (v > sim.p.ta ? 1 : 0))), mB = L.met.binary(B.y, B.s.map((v) => (v > sim.p.tb ? 1 : 0)));
      const sel = (m) => (m.tp + m.fp) / m.n;
      ML.draw.clear(cv);
      const keys = [['tasa de aprobación', (m) => sel(m)], ['exhaustividad (TPR)', (m) => m.rec], ['falsos positivos (FPR)', (m) => m.fpr], ['precisión', (m) => m.prec]];
      const w2 = cv.w / 2;
      [['grupo A', mA, '--k0'], ['grupo B', mB, '--k1']].forEach(([nm, m, col], k) => {
        ML.text(cv.ctx, nm, k * w2 + 14, 18, { size: 12, color: '--ink-2', weight: 650 });
        ML.hbars(cv.ctx, { x: k * w2 + 6, y: 28, w: w2 - 12, h: cv.h - 36 }, keys.map(([lab, f]) => ({ label: lab, value: f(m), color: col })), { labelW: 140, min: 0, max: 1, fmt: f2, barH: 22 });
      });
      sim.set('tab', `<table class="sim-tab"><tr><th></th><th>aprob.</th><th>TPR</th><th>FPR</th><th>prec.</th></tr>${[['A', mA], ['B', mB]].map(([g, m]) => `<tr><td>grupo ${g}</td><td>${f2(sel(m))}</td><td>${f2(m.rec)}</td><td>${f2(m.fpr)}</td><td>${f2(m.prec)}</td></tr>`).join('')}</table>`);
      const d = (x) => ML.fix(Math.abs(x), 2);
      sim.set('gaps', `paridad demográfica (aprobación): ${d(sel(mA) - sel(mB))} · igualdad de oportunidades (TPR): ${d(mA.rec - mB.rec)} · igualdad de errores (FPR): ${d(mA.fpr - mB.fpr)} · paridad predictiva (precisión): ${d(mA.prec - mB.prec)}`);
    });
  });
})();
