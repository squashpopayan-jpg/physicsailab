/* Capítulo 17 — Del calórico a la energía */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 17.1 Joule y las paletas */
  EM.defineSim('joule-paletas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('m', { label: 'Masa total de los dos pesos', min: 5, max: 60, step: 0.5, value: 27.2, fmt: (v) => v.toFixed(1) + ' kg' });
    sim.slider('h', { label: 'Altura de cada caída', min: 1, max: 15, step: 0.1, value: 10.9, fmt: (v) => v.toFixed(1) + ' m' });
    sim.slider('n', { label: 'Número de caídas', min: 1, max: 40, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('M', { label: 'Masa de agua', min: 5, max: 80, step: 1, value: 30, fmt: (v) => v.toFixed(0) + ' kg' });
    sim.slider('eta', { label: 'Fracción del trabajo que llega al agua', min: 0.5, max: 1, step: 0.01, value: 0.95, fmt: (v) => (100 * v).toFixed(0) + ' %' });
    sim.out('E', 'Trabajo mecánico total', { hl: true });
    sim.out('dT', 'Aumento de temperatura del agua');
    sim.out('J', 'J deducido (J por caloría)');
    sim.out('det', 'Frente a la precisión del termómetro de Joule (≈ 0.003 K)');
    sim.note('Joule (1845) hacía bajar dos pesos que giraban unas paletas dentro de un calorímetro de agua. Con cada caída el agua se calentaba unas centésimas de grado; repitiendo veinte veces, unas décimas. Sus termómetros distinguían 1/200 de grado Fahrenheit (≈ 0.003 K). Obtuvo 772 libras-pie por grado F y libra: 4.15 J por caloría, cerca del valor actual, 4.184 J/cal. Hacía falta controlar las pérdidas, corregir por la evaporación, la temperatura del cuarto y hasta el calor de su propio cuerpo.');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const E = p.m * K.g * p.h * p.n, dT = C.joulePaddle(p.m, p.h, p.n, p.M, p.eta);
      const cx = W * 0.3, top = 30, hh = H * 0.62;
      ctx.fillStyle = EM.alpha('--water', 0.35); ctx.fillRect(cx - 60, H * 0.62, 120, H * 0.28); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(cx - 60, H * 0.62, 120, H * 0.28);
      const fall = (t % 2) / 2, py = top + 20 + fall * hh * 0.5;
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 100, top); ctx.lineTo(cx + s * 100, py); ctx.stroke(); ctx.fillStyle = EM.col('--c6'); ctx.fillRect(cx + s * 100 - 12, py, 24, 22); ctx.beginPath(); ctx.moveTo(cx + s * 100, top); ctx.lineTo(cx + s * 30, H * 0.7); ctx.stroke(); }
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.save(); ctx.translate(cx, H * 0.76); ctx.rotate(t * 6); ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke(); ctx.restore();
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 8, w: W * 0.43, h: H - 16, xmin: 0, xmax: 40, ymin: 0, ymax: 3, xlabel: 'número de caídas', ylabel: 'ΔT del agua (K)' });
      pl.frame(); pl.fn((x) => C.joulePaddle(p.m, p.h, x, p.M, p.eta), { color: '--c2', width: 2.2 }); pl.hline(0.003, { color: '--ink-3', label: 'precisión de Joule', labelRight: true }); pl.dot(p.n, dT, { color: '--accent', r: 6 });
      sim.set('E', EM.fix(E / 1000, 1) + ' kJ');
      sim.set('dT', EM.fix(dT, 3) + ' K  (' + EM.fix(dT * 1.8, 3) + ' °F)');
      sim.set('J', EM.fix(E / (1000 * p.M * dT), 3) + ' J/cal sin corregir las pérdidas (valor real 4.184)');
      sim.set('det', dT > 0.003 ? 'medible: ' + EM.fix(dT / 0.003, 0) + ' veces la resolución' : 'por debajo de la resolución');
    });
  });

  /* 17.2 El ciclo de Carnot */
  EM.defineSim('ciclo-carnot', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Th', { label: 'Temperatura del foco caliente', min: 350, max: 900, step: 5, value: 423, fmt: (v) => v.toFixed(0) + ' K (' + (v - 273.15).toFixed(0) + ' °C)' });
    sim.slider('Tc', { label: 'Temperatura del foco frío', min: 280, max: 400, step: 5, value: 313, fmt: (v) => v.toFixed(0) + ' K (' + (v - 273.15).toFixed(0) + ' °C)' });
    sim.slider('r', { label: 'Razón de expansión isoterma V₂/V₁', min: 1.2, max: 4, step: 0.05, value: 3, fmt: (v) => v.toFixed(2) });
    sim.out('eta', 'Rendimiento del ciclo', { hl: true });
    sim.out('ec', 'Rendimiento de Carnot 1 − T_f/T_c');
    sim.out('Q', 'Calor absorbido y cedido (por mol)');
    sim.out('W', 'Trabajo = área encerrada');
    sim.out('hist', 'Máquina de vapor de 1824 (≈ 3 %)');
    sim.note('Carnot (1824) demostró que ninguna máquina térmica que opere entre dos temperaturas puede superar a la reversible, y que el rendimiento de ésta no depende de la sustancia, solo de las temperaturas. Lo hizo con el modelo del salto de agua y con el calórico, que él mismo puso en duda. La teoría fue ignorada hasta que Clapeyron la presentó con gráficas (1834) y Kelvin la rescató (1848).');
    let ph = 0;
    sim.animate((dt) => { ph = (ph + dt * 0.12) % 1; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, V1 = 1e-3, V2 = V1 * p.r, R = 8.314462618, g = 1.4;
      EM.draw.clear(cv);
      const cy = C.carnot(p.Th, Math.min(p.Tc, p.Th - 10), V1, V2, g, 1), Tc = Math.min(p.Tc, p.Th - 10);
      const Pmax = (R * p.Th) / V1 / 1000, Vmax = cy.V3 * 1.05;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Vmax * 1000, ymin: 0, ymax: Pmax * 1.08, xlabel: 'volumen (litros)', ylabel: 'presión (kPa)' });
      pl.frame();
      const seg = [];
      const iso = (T, a, b) => { const o = []; for (let i = 0; i <= 80; i++) { const V = a + ((b - a) * i) / 80; o.push([V * 1000, (R * T) / V / 1000]); } return o; };
      const adi = (T0, V0, V1b) => { const o = [], P0 = (R * T0) / V0; for (let i = 0; i <= 80; i++) { const V = V0 + ((V1b - V0) * i) / 80; o.push([V * 1000, (P0 * Math.pow(V0 / V, g)) / 1000]); } return o; };
      const s1 = iso(p.Th, V1, V2), s2 = adi(p.Th, V2, cy.V3), s3 = iso(Tc, cy.V3, cy.V4), s4 = adi(Tc, cy.V4, V1);
      const all = s1.concat(s2, s3, s4);
      ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.beginPath(); all.forEach((q, i) => (i ? ctx.lineTo(pl.X(q[0]), pl.Y(q[1])) : ctx.moveTo(pl.X(q[0]), pl.Y(q[1])))); ctx.closePath(); ctx.fill();
      [[s1, '--c2'], [s2, '--c1'], [s3, '--c3'], [s4, '--c5']].forEach(([s, col]) => pl.path(s, { color: col, width: 2.6 }));
      const idx = Math.floor(ph * (all.length - 1)); pl.dot(all[idx][0], all[idx][1], { color: '--accent', r: 6 });
      pl.label(s1[40][0], s1[40][1] + 18, 'isoterma caliente', { size: 11, color: '--c2' }); pl.label(s3[40][0], s3[40][1] - 22, 'isoterma fría', { size: 11, color: '--c3' });
      sim.set('eta', EM.fix(100 * cy.eta, 2) + ' %');
      sim.set('ec', EM.fix(100 * cy.etaCarnot, 2) + ' %');
      sim.set('Q', EM.fix(cy.Qh, 0) + ' J  y  ' + EM.fix(cy.Qc, 0) + ' J');
      sim.set('W', EM.fix(cy.W, 0) + ' J');
      sim.set('hist', 'límite teórico 150 °C / 40 °C: 26 %');
    });
  });

  /* 17.3 El cálculo de Mayer */
  EM.defineSim('mayer', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('cp', { label: 'Calor específico del aire a presión constante', min: 0.2, max: 0.3, step: 0.001, value: 0.267, fmt: (v) => v.toFixed(3) + ' cal/(g·K)' });
    sim.slider('g', { label: 'Razón de calores específicos γ = c_p/c_v', min: 1.3, max: 1.5, step: 0.001, value: 1.421, fmt: (v) => v.toFixed(3) });
    sim.out('J', 'Equivalente mecánico del calor J = R/(c_p − c_v)', { hl: true });
    sim.out('e', 'Respecto del valor actual (4.184 J/cal)');
    sim.out('m', 'Mayer (1842): 365 kgf·m/kcal = 3.58 J/cal; Joule (1850): 4.15');
    sim.note('Mayer razonó: al calentar un gas a presión constante hay que dar más calor que a volumen constante, porque el gas se expande y <em>realiza trabajo</em>. La diferencia \\(c_p-c_v\\) es el calor convertido en trabajo, y como el trabajo \\(R\\,\\Delta T\\) es medible, se obtiene la equivalencia sin ningún experimento nuevo. Pero con los datos de 1840 para el aire (\\(c_p=0.267\\), \\(\\gamma=1.421\\)) sale 3.6, no 4.18: la teoría era correcta y la constante dependía de la calidad de los datos de otros.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, J = C.mayerJ(p.cp, p.g);
      EM.draw.clear(cv);
      const x0 = 40, x1 = W - 20, y = H * 0.55, sc = (x1 - x0) / 2.5;
      ctx.strokeStyle = EM.col('--axis'); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      for (let v = 3; v <= 5.5; v += 0.5) { const x = x0 + (v - 3) * sc; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); EM.text(ctx, v.toFixed(1), x, y + 22, { size: 11, align: 'center', color: '--axis' }); }
      const mark = (v, col, lab, dy) => { const x = x0 + (v - 3) * sc; ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); EM.text(ctx, lab, x, y + dy, { size: 11.5, align: 'center', color: col }); };
      mark(3.58, '--c1', 'Mayer 1842', -34); mark(4.15, '--c3', 'Joule 1850', -34); mark(4.184, '--c5', 'actual', -50); mark(5.6, '--c4', 'Rumford', -34);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.moveTo(x0 + (J - 3) * sc, y + 10); ctx.lineTo(x0 + (J - 3) * sc - 8, y + 34); ctx.lineTo(x0 + (J - 3) * sc + 8, y + 34); ctx.closePath(); ctx.fill();
      EM.text(ctx, 'J (J por caloría)', x0, 20, { size: 12, color: '--ink-3' });
      sim.set('J', EM.fix(J, 3) + ' J/cal');
      sim.set('e', (J > 4.184 ? '+' : '') + EM.fix((100 * (J - 4.184)) / 4.184, 1) + ' %');
      sim.set('m', 'Rumford (1798): 5.6');
    });
  });
})();
