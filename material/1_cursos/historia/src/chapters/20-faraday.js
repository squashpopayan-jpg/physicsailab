/* Capítulo 20 — Œrsted, Ampère y Faraday */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 20.1 La brújula de Œrsted */
  EM.defineSim('oersted-brujula', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('I', { label: 'Corriente en el hilo', min: 0.5, max: 50, step: 0.5, value: 10, fmt: (v) => v.toFixed(1) + ' A' });
    sim.slider('r', { label: 'Distancia de la brújula al hilo', min: 1, max: 15, step: 0.1, value: 2, fmt: (v) => v.toFixed(1) + ' cm' });
    sim.check('inv', { label: 'Invertir el sentido de la corriente', value: false });
    sim.out('B', 'Campo del hilo en la brújula', { hl: true });
    sim.out('th', 'Desviación de la aguja');
    sim.out('r0', 'Distancia a la que la desviación baja a 5°');
    sim.note('En abril de 1820, durante una clase en Copenhague, Œrsted vio que la aguja de una brújula próxima a un hilo con corriente se desviaba: la corriente actúa sobre el imán, y <em>no en línea con el hilo, sino en círculos a su alrededor</em>. Con una pila voltaica de 20 pares (≈ 5 A) y una brújula a 2 cm, la desviación es de varios decenas de grados: un efecto que nadie había visto porque se buscaba una fuerza en la dirección del hilo, como la gravedad o la electrostática.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, B = C.bWire(p.I, p.r / 100), th = C.compassDeflection(B) * (p.inv ? -1 : 1);
      EM.draw.clear(cv);
      const cx = W * 0.28, cy = H * 0.5;
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, H * 0.08); ctx.lineTo(cx, H * 0.92); ctx.stroke();
      for (const rr of [30, 55, 85]) { ctx.strokeStyle = EM.alpha('--c1', 0.35); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.35, 0, 0, TAU); ctx.stroke(); }
      /* vista superior: brújula a la distancia r, norte hacia arriba */
      const bx = cx + 60 + p.r * 9, by = cy + 36;
      ctx.save(); ctx.translate(bx, by); ctx.rotate((th * PI) / 180); ctx.fillStyle = EM.col('--pos'); ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(-6, 0); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = EM.col('--neg'); ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(-6, 0); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill(); ctx.restore();
      EM.text(ctx, 'N magnético', bx, by - 36, { size: 11, align: 'center', color: '--ink-3' });
      EM.text(ctx, 'corriente I', cx - 12, H * 0.08 + 12, { size: 11, align: 'right', color: '--c4' });
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 8, w: W * 0.43, h: H - 16, xmin: 1, xmax: 15, ymin: 0, ymax: 90, xlabel: 'distancia al hilo (cm)', ylabel: 'desviación (°)' });
      pl.frame(); pl.fn((x) => C.compassDeflection(C.bWire(p.I, x / 100)), { color: '--c1', width: 2.2 }); pl.hline(5, { color: '--ink-3', label: '5°', labelRight: true }); pl.dot(p.r, Math.abs(th), { color: '--accent', r: 6 });
      const r5 = (C.bWire(p.I, 1) * 1) / (Math.tan((5 * PI) / 180) * 2.4e-5);
      sim.set('B', EM.sci(B, 3) + ' T  (campo terrestre horizontal ≈ 2.4×10⁻⁵ T)');
      sim.set('th', EM.fix(th, 1) + '°');
      sim.set('r0', EM.fix(r5, 1) + ' cm');
    });
  });

  /* 20.2 Inducción: un imán atraviesa una bobina */
  EM.defineSim('induccion-faraday', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('v', { label: 'Velocidad del imán', min: 0.1, max: 3, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' m/s' });
    sim.slider('N', { label: 'Vueltas de la bobina', min: 10, max: 2000, step: 10, value: 400, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Momento magnético del imán', min: 0.1, max: 10, step: 0.1, value: 2, fmt: (v) => v.toFixed(1) + ' A·m²' });
    sim.check('sup', { label: 'Galvanómetro lento (promedia 0.1 s), como el de Colladon (1825)', value: false });
    sim.out('pk', 'Fem máxima', { hl: true });
    sim.out('Q', 'Carga neta que circula (∫ε dt / R): flujo total / R');
    sim.out('z', 'Posición del imán');
    sim.note('Faraday (29 de agosto de 1831): una corriente variable en una bobina induce una corriente en otra bobina, pero solo <em>mientras cambia</em>. Un imán que entra y sale de una espira da dos pulsos de signo opuesto (ley de Lenz). Ampère, Arago y Colladon habían intentado producir electricidad con imanes, pero colocaban el galvanómetro en otra habitación para evitar su influencia: se perdían el breve pulso. Con el interruptor «galvanómetro lento» se ve por qué.');
    let t = -0.4;
    sim.animate((dt) => { t += dt * 0.35; if (t > 0.4) t = -0.4; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, a = 0.03, v = p.v;
      EM.draw.clear(cv);
      const E = (tt) => C.dipoleEmf(p.m, a, -v * tt, v, p.N);
      const T = 0.4 / Math.max(v, 0.5), tspan = 0.6 / v;
      const pl = new EM.Plot(ctx, { x: W * 0.36, y: 8, w: W * 0.62, h: H - 16, xmin: -tspan, xmax: tspan, ymin: -1, ymax: 1, xlabel: 'tiempo (s)', ylabel: 'fem relativa' });
      let mx = 0; const ts = []; const es = []; for (let i = 0; i <= 400; i++) { const tt = -tspan + (2 * tspan * i) / 400; ts.push(tt); const e = E(tt); es.push(e); mx = Math.max(mx, Math.abs(e)); }
      pl.o.ymin = -mx * 1.15; pl.o.ymax = mx * 1.15; pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      let shown = es;
      if (p.sup) { const w = Math.max(1, Math.round((0.1 / (2 * tspan)) * 400)); shown = es.map((_, i) => { let s = 0, n = 0; for (let k = Math.max(0, i - w); k <= i; k++) { s += es[k]; n++; } return s / n; }); }
      pl.xy(ts, es, { color: p.sup ? '--ink-3' : '--c1', width: p.sup ? 1 : 2.4, alpha: p.sup ? 0.5 : 1 });
      if (p.sup) pl.xy(ts, shown, { color: '--c2', width: 2.4 });
      const tt = t * (tspan / 0.4); pl.vline(tt, { color: '--accent', dash: [] });
      /* dibujo: bobina e imán */
      const cx = W * 0.17, cy = H * 0.5;
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, 14, 52, 0, 0, TAU); ctx.stroke();
      const my = cy + (tt / tspan) * 110;
      ctx.fillStyle = EM.col('--pos'); ctx.fillRect(cx - 12, my - 22, 24, 22); ctx.fillStyle = EM.col('--neg'); ctx.fillRect(cx - 12, my, 24, 22);
      EM.text(ctx, 'N', cx, my - 8, { size: 11, align: 'center', color: '--surface' }); EM.text(ctx, 'S', cx, my + 15, { size: 11, align: 'center', color: '--surface' });
      const flux = C.dipoleFlux(p.m, a, 0) * p.N, R = 10;
      sim.set('pk', EM.sci(mx, 3) + ' V' + (p.sup ? '  (con galvanómetro lento: ' + EM.sci(Math.max(...shown.map(Math.abs)), 3) + ' V)' : ''));
      sim.set('Q', 'Φ_total/R = ' + EM.sci((2 * flux) / R, 3) + ' C (con R = 10 Ω, de un extremo al otro)');
      sim.set('z', EM.fix(-tt * v * 100, 1) + ' cm sobre el plano de la bobina');
    });
  });

  /* 20.3 El disco de Faraday */
  EM.defineSim('disco-faraday', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('B', { label: 'Campo magnético uniforme', min: 0.05, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' T' });
    sim.slider('f', { label: 'Frecuencia de giro', min: 1, max: 200, step: 1, value: 50, fmt: (v) => v.toFixed(0) + ' Hz' });
    sim.slider('R', { label: 'Radio del disco', min: 0.02, max: 0.3, step: 0.005, value: 0.1, fmt: (v) => (v * 100).toFixed(1) + ' cm' });
    sim.out('e', 'Fem entre el eje y el borde, ε = ½ B ω R²', { hl: true });
    sim.out('i', 'Corriente con una carga de 1 mΩ');
    sim.note('El 28 de octubre de 1831 Faraday hizo girar un disco de cobre entre los polos de un imán de herradura y recogió corriente con dos contactos deslizantes: la primera dinamo, que da corriente <em>continua</em>. Es el origen de los generadores. La fem aparece porque cada elemento del disco se mueve en un campo, \\(\\vb v\\times\\vb B\\), a lo largo del radio.');
    let ph = 0;
    sim.animate((dt) => { ph += dt * Math.min(sim.p.f, 4) * TAU * 0.5; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, e = C.faradayDisc(p.B, p.f, p.R);
      EM.draw.clear(cv);
      const cx = W * 0.28, cy = H * 0.5, r = Math.min(W * 0.2, H * 0.38);
      ctx.fillStyle = EM.alpha('--c4', 0.55); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = EM.alpha('--ink', 0.7); ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = ph + (k * PI) / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); ctx.stroke(); }
      for (let i = 0; i < 6; i++) { EM.text(ctx, '⊗', cx - r * 0.7 + i * r * 0.28, cy - r - 14, { size: 14, color: '--c1' }); }
      ctx.fillStyle = EM.col('--ink'); ctx.fillRect(cx - 4, cy - 4, 8, 8); ctx.fillRect(cx + r - 3, cy - 3, 8, 6);
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 8, w: W * 0.43, h: H - 16, xmin: 1, xmax: 200, ymin: 0, ymax: 3, xlabel: 'frecuencia (Hz)', ylabel: 'fem (V)' });
      pl.o.ymax = Math.max(0.5, C.faradayDisc(p.B, 200, p.R) * 1.05); pl.frame(); pl.fn((x) => C.faradayDisc(p.B, x, p.R), { color: '--c1', width: 2.2 }); pl.dot(p.f, e, { color: '--accent', r: 6 });
      sim.set('e', EM.fix(e * 1000, 2) + ' mV');
      sim.set('i', EM.fix(e / 1e-3, 1) + ' A');
    });
  });
})();
