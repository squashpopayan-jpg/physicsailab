/* Capítulo 9 · LEGO como banco de montaje: modelos base, medidas y engranajes */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, LG = MC.lego;
  const { B, P, TX, BOX } = LG;
  const line = (a, b, c, o = {}) => Object.assign({ t: 'line', a, b, c }, o);
  const tilt = (ax, ay, az, len, d, h, ang, c, o = {}) => Object.assign({ t: 'tilt', ax, ay, az, len, d, h, ang, c }, o);
  MC.legoLine = line;
  MC.legoTilt = tilt;

  /* ---------- Soporte para el celular ---------- */
  LG.def('soporte-celular', {
    name: 'Soporte para el celular', rot: 0,
    steps: [
      { note: 'Base: dos placas de 6×16 y dos de 6×6, lado a lado, forman un piso de 12×22 módulos.', parts: [P(0, 0, 0, 16, 6, '--lego-dkgray'), P(0, 6, 0, 16, 6, '--lego-dkgray'), P(16, 0, 0, 6, 6, '--lego-dkgray'), P(16, 6, 0, 6, 6, '--lego-dkgray')] },
      { note: 'Paredes largas de un ladrillo de alto. Las uniones de las placas quedan cubiertas por los ladrillos.', parts: [B(0, 0, 1, 8, 1, '--lego-red'), B(8, 0, 1, 8, 1, '--lego-red'), B(16, 0, 1, 6, 1, '--lego-red'), B(0, 11, 1, 8, 1, '--lego-red'), B(8, 11, 1, 8, 1, '--lego-red'), B(16, 11, 1, 6, 1, '--lego-red')] },
      { note: 'Paredes cortas. En un extremo se deja un hueco de 4 módulos para el cable o el botón lateral.', parts: [B(0, 1, 1, 1, 4, '--lego-yellow'), B(0, 5, 1, 1, 6, '--lego-yellow'), B(21, 1, 1, 1, 3, '--lego-yellow'), B(21, 8, 1, 1, 3, '--lego-yellow')] },
      { note: 'El celular entra justo (deje la funda aparte). Debe quedar sin juego: si se mueve, rellene con una placa delgada.', parts: [BOX(1, 1, 1, 20, 10, 3, '--phone', { screen: '--screen', name: 'Celular (≈ 75 × 155 mm)' })] },
      { note: 'Dos bandas elásticas cruzadas sobre los bordes lo fijan. No tape el sensor de luz ni la cámara si se van a usar.', parts: [line([6, -0.1, 4.2], [6, 12.1, 4.2], '--lego-orange', { lw: 3, name: 'Banda elástica' }), line([16, -0.1, 4.2], [16, 12.1, 4.2], '--lego-orange', { lw: 3, name: 'Banda elástica' })] }
    ]
  });

  /* ---------- Rampa ---------- */
  {
    const layers = 5;
    const top = 1 + 3 * layers;
    const ang = M.deg(Math.atan(((top - 1) * 3.2) / (27 * 8)));
    const tower = [];
    for (let k = 0; k < layers; k++) {
      const z = 1 + 3 * k;
      if (k % 2 === 0) tower.push(B(28, 0, z, 4, 2, '--lego-blue'), B(28, 2, z, 4, 2, '--lego-blue'), B(28, 4, z, 4, 2, '--lego-blue'));
      else tower.push(B(28, 0, z, 2, 6, '--lego-azure', { name: 'Ladrillo 2×6' }), B(30, 0, z, 2, 6, '--lego-azure', { name: 'Ladrillo 2×6' }));
    }
    LG.def('rampa', {
      name: 'Rampa de ángulo conocido', rot: 0,
      dims: [{ a: [33, 6, 1], b: [33, 6, top], label: `${layers} ladrillos = ${MC.fix(layers * 9.6, 1)} mm`, off: -8 }, { a: [1, 6.5, 1], b: [28, 6.5, 1], label: '27 módulos = 216 mm', off: 10 }],
      steps: [
        { note: 'Base de 6×32 módulos con dos placas de 6×16.', parts: [P(0, 0, 0, 16, 6, '--lego-dkgray'), P(16, 0, 0, 16, 6, '--lego-dkgray')] },
        { note: `Torre de ${layers} ladrillos en el extremo, alternando la orientación de las capas para trabarla.`, parts: tower },
        { note: 'Tope en el extremo bajo: detiene el carrito sin que golpee la mesa.', parts: [B(0, 0, 1, 1, 6, '--lego-yellow', { name: 'Ladrillo 1×6' })] },
        { note: `Dos carriles de vigas Technic, apoyados en el tope y en la torre. Con estas medidas el ángulo es ${MC.fix(ang, 2)}°.`, parts: [tilt(1, 1, 1, 30, 1, 2, ang, '--lego-gray', { name: 'Viga Technic 1×15 (carril)' }), tilt(1, 4, 1, 30, 1, 2, ang, '--lego-gray', { name: 'Viga Technic 1×15 (carril)' })] }
      ]
    });
  }

  /* ---------- Torre de péndulo ---------- */
  {
    const n = 30;
    const colA = [], colB = [];
    for (let k = 0; k < n; k++) {
      const c = k % 2 ? '--lego-yellow' : '--lego-red';
      colA.push(B(6, 1, 1 + 3 * k, 4, 2, c));
      colB.push(B(6, 13, 1 + 3 * k, 4, 2, c));
    }
    const zt = 1 + 3 * n;
    LG.def('pendulo', {
      name: 'Torre de péndulo', rot: 0, aspect: 0.9,
      dims: [{ a: [11, 8, zt + 1.5], b: [11, 8, 36], label: 'L (pivote → centro del celular)', off: 0 }],
      steps: [
        { note: 'Base de 16×16 (dos placas de 8×16).', parts: [P(0, 0, 0, 16, 8, '--lego-dkgray'), P(0, 8, 0, 16, 8, '--lego-dkgray')] },
        { note: 'Dos columnas de ladrillos 2×4, de 30 ladrillos (288 mm). Revise que queden verticales.', parts: colA.concat(colB) },
        { note: 'Travesaño: un ladrillo Technic 1×16 une las columnas. Sus agujeros son los pivotes.', parts: [TX(7, 0, zt, 1, 16, '--lego-gray', { name: 'Ladrillo Technic 1×16' })] },
        { note: 'Eje Technic por el agujero central y el hilo (o un brazo de vigas Technic) del que cuelga el soporte del celular.', parts: [line([5, 8, zt + 1.5], [10, 8, zt + 1.5], '--lego-dkgray', { lw: 4, name: 'Eje Technic 6' }), line([7.5, 8, zt + 1.5], [7.5, 8, 60], '--rope', { lw: 1.6, name: 'Hilo de nailon' })] },
        { note: 'El celular cuelga en el plano de oscilación. Ponga peso sobre la base (un libro) para que la torre no se mueva.', parts: [BOX(7, 3.3, 12, 1.1, 9.4, 48, '--phone', { screen: null, name: 'Celular en su soporte' }), BOX(11, 3, 1, 4, 10, 4, '--lego-tan', { name: 'Peso sobre la base' })] }
      ]
    });
  }

  /* ---------- Marco de fotocompuerta ---------- */
  LG.def('marco-foto', {
    name: 'Marco de fotocompuerta', rot: 0,
    steps: [
      { note: 'Base 6×10.', parts: [P(0, 0, 0, 6, 10, '--lego-dkgray')] },
      { note: 'Dos columnas de cuatro ladrillos 2×2, separadas 6 módulos (48 mm): por ahí pasará el objeto.', parts: [0, 1, 2, 3].flatMap((k) => [B(2, 0, 1 + 3 * k, 2, 2, '--lego-blue'), B(2, 8, 1 + 3 * k, 2, 2, '--lego-blue')]) },
      { note: 'El LED infrarrojo y el fototransistor, frente a frente a la misma altura (pegados con masilla o en ladrillos Technic). El haz cruza el hueco.', parts: [BOX(2.6, 2, 9, 0.8, 0.8, 2, '--chip', { name: 'LED infrarrojo (940 nm)' }), BOX(2.6, 7.2, 9, 0.8, 0.8, 2, '--chip', { name: 'Fototransistor' }), line([3, 2.8, 10], [3, 7.2, 10], '--c2', { lw: 2 })] },
      { note: 'Un puente de placas arriba evita que las columnas se abran y desalineen el haz.', parts: [P(2, 0, 13, 2, 10, '--lego-gray', { name: 'Placa 2×10' })] }
    ]
  });

  /* ---------- Valla de franjas ---------- */
  LG.def('valla', {
    name: 'Valla de franjas (picket fence)', rot: 0, aspect: 1.1,
    dims: [{ a: [4.5, 1, 0], b: [4.5, 1, 6], label: '19.2 mm', off: 0 }],
    steps: [
      { note: 'Ladrillos 1×4 negros y transparentes alternados: cada franja mide 9.6 mm y cada periodo, 19.2 mm.', parts: Array.from({ length: 14 }, (_, k) => B(0, 0, 3 * k, 4, 1, k % 2 ? '--lego-trans' : '--lego-black')) },
      { note: 'Un remate arriba para tomarla y soltarla sin girarla. Déjela caer vertical a través de la fotocompuerta, sobre un cojín.', parts: [P(0, 0, 42, 4, 1, '--lego-red', { name: 'Placa 1×4' }), B(1, 0, 43, 2, 1, '--lego-red', { name: 'Ladrillo 1×2' })] }
    ]
  });

  /* ---------- Calculadora de medidas ---------- */
  MC.defineSim('lego-medidas', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Rampa sobre torre LEGO' });
    sim.group('Torre');
    sim.slider('nb', { label: 'Ladrillos', min: 0, max: 30, step: 1, value: 5, fmt: (v) => String(Math.round(v)) });
    sim.slider('np', { label: 'Placas adicionales', min: 0, max: 2, step: 1, value: 1, fmt: (v) => String(Math.round(v)) });
    sim.group('Rampa');
    sim.slider('run', { label: 'Largo de la rampa (entre apoyos)', min: 8, max: 48, step: 1, value: 30, unit: 'módulos', fmt: (v) => String(Math.round(v)) });
    sim.seg('mode', { label: 'El largo se mide…', options: [['hyp', 'sobre la rampa'], ['base', 'en horizontal']], value: 'hyp' });
    sim.out('h', 'Altura de la torre', { hl: true });
    sim.out('L', 'Largo');
    sim.out('ang', 'Ángulo θ', { hl: true });
    sim.out('s', 'sen θ');
    sim.out('a', '<i>g</i> sen θ (Popayán)');
    const tbl = sim.note('');
    const combos = (() => {
      const out = [];
      for (const target of [5, 10, 15, 20, 25, 30]) {
        let best = null;
        for (const run of [16, 20, 24, 30, 32, 40]) for (let nb = 0; nb <= 30; nb++) for (let np = 0; np <= 2; np++) {
          const h = nb * 9.6 + np * 3.2, s = h / (run * 8);
          if (s >= 1) continue;
          const a = M.deg(Math.asin(s));
          if (!best || Math.abs(a - target) < Math.abs(best.a - target)) best = { a, run, nb, np };
        }
        out.push([target, best]);
      }
      return out;
    })();
    tbl.innerHTML = '<b>Ángulos «redondos» (largo sobre la rampa)</b><br>' + combos.map(([t, b]) => `${t}° → ${b.nb} ladrillos + ${b.np} placas, rampa de ${b.run} módulos (${MC.fix(b.a, 2)}°)`).join('<br>');
    sim.onDraw(() => {
      const nb = Math.round(sim.p.nb), np = Math.round(sim.p.np), run = Math.round(sim.p.run);
      const h = nb * 9.6 + np * 3.2, Lmm = run * 8;
      let s, ang;
      if (sim.p.mode === 'hyp') { s = Math.min(1, h / Lmm); ang = Math.asin(s); } else { ang = Math.atan(h / Lmm); s = Math.sin(ang); }
      sim.set('h', `${MC.fix(h, 1)} mm`);
      sim.set('L', `${Lmm} mm`);
      sim.set('ang', h >= Lmm && sim.p.mode === 'hyp' ? 'imposible' : MC.fix(M.deg(ang), 2) + '°');
      sim.set('s', MC.fix(s, 4));
      sim.set('a', MC.fix(MC.K.gPop * s, 3) + ' m/s²');
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const run_h = sim.p.mode === 'hyp' ? Lmm * Math.cos(ang) : Lmm;
      const sc = Math.min((W - 80) / (run_h + 40), (H - 60) / Math.max(h + 30, 60));
      const x0 = 30, y0 = H - 24;
      const u = 8 * sc;
      D.ground(ctx, 0, y0, W, { depth: 8 });
      const tx = x0 + run_h * sc;
      for (let k = 0; k < nb; k++) D.brick2d(ctx, tx - u, y0 - k * 9.6 * sc, 4, 3, u, k % 2 ? '--lego-azure' : '--lego-blue', { studs: k === nb - 1 && !np });
      for (let k = 0; k < np; k++) D.brick2d(ctx, tx - u, y0 - nb * 9.6 * sc - k * 3.2 * sc, 4, 1, u, '--lego-yellow', { studs: k === np - 1 });
      ctx.save();
      ctx.strokeStyle = MC.col('--lego-gray');
      ctx.lineWidth = Math.max(3, 7.2 * sc);
      ctx.beginPath(); ctx.moveTo(x0, y0 - 3); ctx.lineTo(tx, y0 - h * sc - 3); ctx.stroke();
      ctx.restore();
      D.angle(ctx, x0, y0, 46, 0, ang, { label: 'θ', size: 14 });
      D.dim(ctx, tx + 4 * u + 10, y0, tx + 4 * u + 10, y0 - h * sc, MC.fix(h, 1) + ' mm', { off: 0, labelOff: 30 });
      if (sim.p.mode === 'hyp') D.dim(ctx, x0, y0 - 3, tx, y0 - h * sc - 3, `${Lmm} mm`, { off: -16 });
      else D.dim(ctx, x0, y0 + 2, tx, y0 + 2, `${Lmm} mm`, { off: 12 });
    });
  });

  /* ---------- Engranajes ---------- */
  MC.defineSim('engranajes', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Engranajes Technic' });
    const TEETH = [8, 12, 16, 20, 24, 36, 40];
    let a1 = 0;
    sim.group('Engranajes');
    sim.select('n1', { label: 'Motriz (entrada)', options: TEETH.map((t) => [t, t + ' dientes']), value: 8 });
    sim.check('idle', { label: 'Agregar un engranaje intermedio de 16', value: false });
    sim.select('n2', { label: 'Conducido (salida)', options: TEETH.map((t) => [t, t + ' dientes']), value: 40 });
    sim.slider('rpm', { label: 'Velocidad de entrada', min: 5, max: 120, step: 1, value: 30, unit: 'rpm', fmt: (v) => String(Math.round(v)) });
    sim.out('ratio', 'Relación ω<sub>salida</sub>/ω<sub>entrada</sub>', { hl: true });
    sim.out('out', 'Velocidad de salida');
    sim.out('tq', 'Torque de salida / entrada');
    sim.out('dist', 'Distancia entre ejes');
    sim.animate((dt) => { a1 += (sim.p.rpm / 60) * 2 * Math.PI * dt * 0.5; }, { button: true });
    function gear(ctx, cx, cy, N, ang, col) {
      const r = N / 2, ro = r + 1, ri = r - 1.2;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = ang + (i / N) * 2 * Math.PI, da = (2 * Math.PI) / N;
        const pts = [[ri, a], [ro, a + da * 0.2], [ro, a + da * 0.5], [ri, a + da * 0.7]];
        pts.forEach(([rr, aa], j) => { const x = cx + rr * Math.cos(aa) * S, y = cy - rr * Math.sin(aa) * S; if (i === 0 && j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      }
      ctx.closePath();
      ctx.fillStyle = MC.col(col); ctx.fill();
      ctx.strokeStyle = MC.shade(MC.col(col), 0.55); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = MC.col('--canvas');
      ctx.beginPath(); ctx.arc(cx, cy, 2.4 * S, 0, 7); ctx.fill();
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 1.6 * S * Math.cos(ang), cy - 1.6 * S * Math.sin(ang)); ctx.lineTo(cx - 1.6 * S * Math.cos(ang), cy + 1.6 * S * Math.sin(ang)); ctx.moveTo(cx + 1.6 * S * Math.cos(ang + Math.PI / 2), cy - 1.6 * S * Math.sin(ang + Math.PI / 2)); ctx.lineTo(cx - 1.6 * S * Math.cos(ang + Math.PI / 2), cy + 1.6 * S * Math.sin(ang + Math.PI / 2)); ctx.stroke();
      ctx.restore();
    }
    let S = 4;
    sim.onDraw(() => {
      const n1 = +sim.p.n1, n2 = +sim.p.n2, ni = 16;
      const chain = sim.p.idle ? [n1, ni, n2] : [n1, n2];
      const ratio = n1 / n2;
      sim.set('ratio', `${n1}/${n2} = ${MC.fix(ratio, 3)}` + (sim.p.idle ? ' (mismo sentido)' : ' (sentido opuesto)'));
      sim.set('out', MC.fix(sim.p.rpm * ratio, 1) + ' rpm');
      sim.set('tq', MC.fix(1 / ratio, 2) + ' (sin pérdidas)');
      const dists = []; for (let i = 0; i < chain.length - 1; i++) dists.push((chain[i] + chain[i + 1]) / 2);
      sim.set('dist', dists.map((d) => `${d} mm = ${MC.fix(d / 8, 2)} módulos`).join(' · ') + (dists.every((d) => d % 8 === 0) ? ' ✓ en línea' : ' (necesita montaje en diagonal o medio módulo)'));
      const ctx = cv.ctx;
      D.clear(cv);
      const totalW = dists.reduce((s, d) => s + d, 0) + chain[0] / 2 + chain[chain.length - 1] / 2 + 4;
      S = Math.min((cv.w - 40) / totalW, (cv.h - 40) / (Math.max(...chain) + 4));
      let x = 20 + (chain[0] / 2 + 2) * S;
      const cy = cv.h / 2;
      let ang = a1, sign = 1;
      const cols = ['--lego-gray', '--lego-dkgray', '--lego-tan'];
      chain.forEach((N, i) => {
        if (i > 0) { x += dists[i - 1] * S; ang = -ang * (chain[i - 1] / N) + Math.PI / N; sign = -sign; }
        gear(ctx, x, cy, N, ang, cols[i % 3]);
        MC.text(ctx, `${N} d`, x, cy + (N / 2 + 3) * S, { size: 12, align: 'center', mono: true, color: '--ink-2' });
      });
    });
  });
})();
