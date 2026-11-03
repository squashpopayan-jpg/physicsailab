/* Capítulo 1 — Electricidad sin miedo */
(function () {
  'use strict';
  const EM = window.EM, sp = EM.spice, DW = EM.dw;
  const PT = EM.parts;

  /* 1.1 La analogía del agua ---------------------------------------- */
  EM.defineSim('agua', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('V', { label: 'Tensión de la fuente (presión de la bomba)', min: 0, max: 12, step: 0.5, value: 6, unit: 'V' });
    sim.slider('R', { label: 'Resistencia (estrechamiento del tubo)', min: 10, max: 1000, value: 200, unit: 'Ω', log: true, step: 10, fmt: (v) => String(Math.round(v)) });
    sim.out('I', 'Corriente (caudal): I = V / R', { hl: true });
    sim.out('P', 'Potencia que se convierte en calor: P = V · I');
    sim.out('Q', 'Cargas que pasan por segundo');
    const drops = [];
    for (let i = 0; i < 70; i++) drops.push(i / 70);
    let phase = 0, rot = 0;
    sim.animate((dt) => {
      const I = sim.p.V / sim.p.R;
      const sp_ = 0.02 + 0.55 * Math.min(1, I / 0.12);
      phase = (phase + dt * sp_ * (I > 0 ? 1 : 0)) % 1;
      rot += dt * 6 * (I / 0.12) * 2;
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, V = sim.p.V, R = sim.p.R, I = V / R;
      EM.draw.clear(cv);
      const m = 46, x0 = m + 30, x1 = W - m - 30, y0 = m + 14, y1 = H - m - 8, pw = Math.max(22, Math.min(34, H * 0.09));
      /* camino rectangular: s en [0,1) recorre desde la bomba (izquierda) por arriba hacia la derecha y vuelve por abajo */
      const L1 = x1 - x0, L2 = y1 - y0, per = 2 * (L1 + L2);
      const pt = (s) => {
        let d = s * per;
        if (d < L1) return [x0 + d, y0];
        d -= L1; if (d < L2) return [x1, y0 + d];
        d -= L2; if (d < L1) return [x1 - d, y1];
        d -= L1; return [x0, y1 - d];
      };
      /* tubería */
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.lineWidth = pw + 8; ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.stroke();
      ctx.strokeStyle = EM.mix('--c1', '--canvas', 0.78); ctx.lineWidth = pw; ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.stroke();
      /* estrechamiento a la derecha: dos cuñas */
      const open = Math.max(3, pw * Math.pow(0.1 + 0.9 * Math.min(1, 40 / R), 0.9) * 0.55);
      const cy = (y0 + y1) / 2, hw = 20;
      ctx.fillStyle = EM.col('--ink-2');
      for (const sg of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x1 - pw / 2 - 5, cy + sg * (pw / 2 + 5)); ctx.lineTo(x1 - pw / 2 - 5, cy + sg * (open / 2 + 0)); ctx.lineTo(x1 + pw / 2 + 5, cy + sg * (open / 2 + 0)); ctx.lineTo(x1 + pw / 2 + 5, cy + sg * (pw / 2 + 5)); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = EM.mix('--c1', '--canvas', 0.78); ctx.fillRect(x1 - open / 2, cy - open / 2, open, open);
      EM.text(ctx, 'Resistencia', x1 - pw / 2 - 12, cy - 2, { size: 13, color: '--ink', weight: 700, align: 'right' });
      EM.text(ctx, sim.p.R >= 1000 ? '1 kΩ' : Math.round(R) + ' Ω', x1 - pw / 2 - 12, cy + 14, { size: 12, color: '--ink-2', align: 'right', mono: true });
      /* gotas */
      ctx.fillStyle = EM.col('--c1');
      for (const d of drops) {
        const s = (d + phase) % 1, p = pt(s);
        ctx.beginPath(); ctx.arc(p[0], p[1], 3.1, 0, 7); ctx.fill();
      }
      /* bomba */
      const bx = x0, by = cy;
      ctx.fillStyle = EM.col('--surface'); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(bx, by, 34, 0, 7); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(bx, by); ctx.rotate(rot);
      ctx.fillStyle = EM.col('--accent');
      for (let k = 0; k < 3; k++) { ctx.rotate(2.094); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -6, 25, 4); ctx.lineTo(20, 10); ctx.quadraticCurveTo(10, 2, 0, 0); ctx.fill(); }
      ctx.restore();
      EM.text(ctx, 'Bomba = fuente', bx, by + 54, { size: 12.5, color: '--ink', weight: 700, align: 'center' });
      EM.text(ctx, V.toFixed(1) + ' V', bx, by - 46, { size: 14, color: '--accent', weight: 800, align: 'center', mono: true });
      /* flecha y medidor de caudal */
      const mid = pt(0.12);
      EM.draw.arrow(ctx, x0 + L1 * 0.28, y0 - pw / 2 - 18, x0 + L1 * 0.28 + 44, y0 - pw / 2 - 18, { color: '--c1', width: 2.4 });
      EM.text(ctx, 'caudal = corriente', x0 + L1 * 0.28 + 52, y0 - pw / 2 - 18, { size: 12.5, color: '--ink', align: 'left', weight: 700 });
      EM.text(ctx, EM.si(I, 'A', 3), x0 + L1 * 0.28 + 52, y0 - pw / 2 - 2, { size: 12, color: '--c1', align: 'left', mono: true, weight: 700 });
      ctx.restore();
      sim.set('I', `<b>${EM.si(I, 'A', 3)}</b> = ${EM.fix(V, 1)} V ÷ ${R >= 1000 ? '1 kΩ' : Math.round(R) + ' Ω'}`);
      sim.set('P', EM.si(V * I, 'W', 3));
      sim.set('Q', EM.sci(I / 1.602176634e-19, 3) + ' electrones por segundo');
    });
  });

  /* 1.2 Ley de Ohm --------------------------------------------------- */
  const schSimple = (vNum, rNum) => ({
    boards: [], mcus: [],
    parts: [{ id: 'FA', type: 'LAB', v: vNum, ilimit: 5, pins: ['#1', '#0'] }, { id: 'R1', type: 'R', value: rNum, watt: 0.25, pins: ['#1', '#0'] }],
    wires: [],
    sch: { w: 17, h: 10, parts: { FA: { at: [3, 5], rot: 90, lab: [-3.2, 0] }, R1: { at: [12, 5], rot: 90 } }, wires: [['FA.0', [3, 2], [12, 2], 'R1.0'], ['FA.1', [3, 8], [12, 8], 'R1.1']] }
  });
  const ohmPanel = {
    aspect: 3.3,
    label: 'Gráfica corriente contra tensión',
    draw(lab, cv) {
      const R1 = lab.scene.parts.find((p) => p.id === 'R1'), FA = lab.scene.parts.find((p) => p.id === 'FA');
      const R = PT.val(R1, 'value'), V = PT.val(FA, 'v');
      const ymax = Math.max(6, 12 / R * 1000 * 1.1);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 12, ymin: 0, ymax, xlabel: 'tensión V (V)', ylabel: 'corriente I (mA)', ml: 52, mr: 12, mt: 14, mb: 36 });
      pl.frame();
      for (const r of [100, 330, 1000, 4700]) if (r !== R) pl.fn((x) => x / r * 1000, { color: '--grid-2', width: 1.2, n: 2 });
      pl.fn((x) => x / R * 1000, { color: '--accent', width: 2.6, n: 2 });
      pl.dot(V, V / R * 1000, { color: '--accent', r: 6 });
      pl.label(V, V / R * 1000, ` ${EM.fix(V / R * 1000, 1)} mA`, { dx: 10, dy: -10, color: '--ink' });
    }
  };
  EM.defineSim('ohm', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.9, scene: schSimple(5, 330), meter: { mode: 'V' }, below: true, flow: true,
      hint: 'Arrastre las puntas del multímetro hasta los extremos de la resistencia para medir la tensión.',
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 12, step: 0.1, value: 5, unit: 'V', apply: (lab, v) => { lab.scene.parts[0].v = v; } },
        { type: 'select', id: 'r', label: 'Resistencia', options: [[47, '47 Ω'], [100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [470, '470 Ω'], [1000, '1 kΩ'], [2200, '2,2 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ']], value: 330, apply: (lab, v) => { lab.scene.parts[1].value = +v; } }
      ],
      outs: [
        { id: 'I', label: 'Corriente I = V / R', hl: true, fn: (lab) => { const e = lab.bench.c.find('R1:main'); return EM.fmtI(e.i); } },
        { id: 'P', label: 'Potencia P = V · I', fn: (lab) => { const e = lab.bench.c.find('R1:main'); return EM.si(e.p, 'W', 3) + ' (' + Math.round(e.p / 0.25 * 100) + ' % del límite de ¼ W)'; } }
      ],
      panel: ohmPanel
    });
  });

  /* 1.3 Potencia y calentamiento -------------------------------------- */
  EM.defineSim('potencia', function (sim) {
    const scene = {
      boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [],
      parts: [{ id: 'FA', type: 'LAB', v: 3, ilimit: 3, at: [-30, 24], pins: ['T+8', 'T-8'] }, { id: 'R1', type: 'R', value: 100, watt: 0.25, pins: ['h10', 'h15'] }],
      wires: [{ id: 'w1', a: 'T+9', b: 'j10' }, { id: 'w2', a: 'T-9', b: 'j15' }],
      sch: schSimple(3, 100).sch
    };
    scene.sch.w = 17;
    EM.Lab.mount(sim, {
      aspect: 1.9, scene, speeds: [[0.5, '0,5×'], [1, '1×'], [4, '4×']], hint: 'Suba la tensión y mire la resistencia: se calienta, humea y se quema.',
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 12, step: 0.5, value: 3, unit: 'V', apply: (lab, v) => { lab.scene.parts[0].v = v; } },
        { type: 'seg', id: 'w', label: 'Potencia nominal de la resistencia', options: [[0.125, '⅛ W'], [0.25, '¼ W'], [0.5, '½ W'], [1, '1 W']], value: 0.25, apply: (lab, v) => { lab.scene.parts[1].watt = +v; lab.touch(); } },
        { type: 'button', label: 'Reponer la resistencia', run: (lab) => { lab.bench.repairAll(); lab.alerts = []; lab.alertBox.innerHTML = ''; } }
      ],
      outs: [
        { id: 'P', label: 'Potencia que disipa', hl: true, fn: (lab) => { const R1 = lab.scene.parts[1]; if (R1.dead) return '<span class="bad">resistencia abierta (quemada)</span>'; const e = lab.bench.c.find('R1:main'); return EM.si(e.p, 'W', 3); } },
        { id: 'S', label: 'Porcentaje de su límite', fn: (lab) => { const R1 = lab.scene.parts[1]; if (R1.dead) return '—'; const st = (R1.stress || 0) * 100; return (st > 100 ? '<span class="bad">' : '') + Math.round(st) + ' %' + (st > 100 ? '</span>' : ''); } },
        { id: 'T', label: 'Estado', fn: (lab) => { const R1 = lab.scene.parts[1]; if (R1.dead) return '<span class="bad">quemada</span>'; const d = R1.dmg || 0; return d > 0.5 ? 'a punto de quemarse' : (R1.stress || 0) > 1 ? 'muy caliente' : (R1.stress || 0) > 0.8 ? 'caliente' : 'normal'; } }
      ]
    });
  });

  /* 1.4 Decodificador de colores --------------------------------------- */
  EM.defineSim('colores', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    const names = sp.COLORS.map((c) => c.n);
    const digitC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multC = [0, 1, 2, 3, 4, 5, 6, 7, 10, 11], tolC = [10, 11, 1, 2];
    const col = (i) => `${names[i][0].toUpperCase()}${names[i].slice(1)}`;
    sim.seg('mode', { label: 'Modo', options: [['free', 'Decodificar'], ['quiz', 'Reto']], value: 'free', onInput: () => newQuiz(true) });
    sim.group('Franjas');
    const opt = (list) => list.map((i) => [i, col(i)]);
    sim.select('b1', { label: '1.ª franja (primera cifra)', options: opt(digitC.slice(1)), value: 4 });
    sim.select('b2', { label: '2.ª franja (segunda cifra)', options: opt(digitC), value: 7 });
    sim.select('b3', { label: '3.ª franja (multiplicador)', options: opt(multC), value: 2 });
    sim.select('b4', { label: '4.ª franja (tolerancia)', options: [[10, 'Dorado (±5 %)'], [11, 'Plateado (±10 %)'], [1, 'Marrón (±1 %)'], [2, 'Rojo (±2 %)']], value: 10 });
    sim.group('Reto');
    sim.select('m', { label: 'Cifras del valor', options: sp.E12.map((m) => [m, String(m).replace('.', ',')]), value: 4.7 });
    sim.select('x', { label: 'Multiplicador', options: [[1, '× 1 Ω'], [10, '× 10 Ω'], [100, '× 100 Ω'], [1000, '× 1 kΩ'], [10000, '× 10 kΩ'], [100000, '× 100 kΩ'], [1e6, '× 1 MΩ']], value: 100 });
    sim.button('Comprobar', () => check(), { primary: true });
    sim.button('Otro reto', () => newQuiz(false));
    sim.out('val', 'Valor de la resistencia', { hl: true });
    sim.out('tol', 'Puede valer en realidad entre');
    sim.out('msg', 'Resultado');
    let score = 0, tries = 0, target = null, solved = false;
    let seed = 7;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    function newQuiz(keep) {
      const quiz = sim.p.mode === 'quiz';
      ['b1', 'b2', 'b3', 'b4'].forEach((k) => sim.ctl[k].show(!quiz));
      ['m', 'x'].forEach((k) => sim.ctl[k].show(quiz));
      if (quiz && !keep || (quiz && !target)) {
        const m = sp.E12[Math.floor(rnd() * 12)], x = [1, 10, 100, 1000, 10000, 100000][Math.floor(rnd() * 6)];
        target = m * x; solved = false;
        sim.set('msg', 'Mire las franjas y diga cuánto vale.');
      }
      if (!quiz) target = null;
    }
    function bandsNow() {
      if (sim.p.mode === 'quiz' && target) return sp.bands(target, 4, 5);
      return [sim.p.b1, sim.p.b2, sim.p.b3, sim.p.b4];
    }
    function check() {
      if (sim.p.mode !== 'quiz' || !target) return;
      const ans = sim.p.m * sim.p.x; tries++;
      if (Math.abs(ans - target) / target < 1e-6) { if (!solved) score++; solved = true; sim.set('msg', '✔ Correcto: ' + sp.fmtR(target) + '. Aciertos: ' + score + ' de ' + tries + '.'); }
      else sim.set('msg', '✘ No es ' + sp.fmtR(ans) + '. Repase: cifra, cifra, ceros. Intentos: ' + tries + '.');
    }
    sim.onChange = () => { if (sim.p.mode === 'quiz') { sim.ctl.m.show(true); } };
    newQuiz(true);
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const b = bandsNow();
      const val = sp.fromBands(b);
      const p = { type: 'R', id: 'R', value: target || val.ohm, tol: target ? 5 : val.tol };
      const s = Math.min(W / 26, H / 12);
      ctx.save(); ctx.translate(W / 2, H * 0.52); ctx.scale(s, s);
      DW.part(ctx, p, [[-11, 0], [11, 0]], { bench: { partCurrent: () => 0 }, glows: [], smoke: [], hit: [], t: 0 });
      ctx.restore();
      /* etiquetas bajo cada franja */
      const xs = [-1.9, -1.0, -0.1, 2.0], lab = ['1.ª cifra', '2.ª cifra', 'ceros', 'tolerancia'];
      const bands = sp.bands(p.value, 4, p.tol);
      xs.forEach((x, i) => {
        const px = W / 2 + x * s, py = H * 0.52 + 1.5 * s, lx = W * (0.14 + 0.24 * i) + 20, ly = H * 0.52 + 2.4 * s + 40;
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 14); ctx.lineTo(lx, ly - 22); ctx.stroke();
        EM.text(ctx, lab[i], lx, ly - 8, { size: 12, color: '--ink-2', align: 'center' });
        EM.text(ctx, sim.p.mode === 'quiz' && !solved ? '?' : names[bands[i]], lx, ly + 10, { size: 13, color: '--ink', align: 'center', weight: 700 });
      });
      if (sim.p.mode === 'quiz' && !solved) { sim.set('val', '¿?'); sim.set('tol', '—'); }
      else { sim.set('val', `<b>${sp.fmtR(p.value)}</b> ± ${p.tol} %`); sim.set('tol', sp.fmtR(p.value * (1 - p.tol / 100)) + ' y ' + sp.fmtR(p.value * (1 + p.tol / 100))); }
    });
  });

  /* 1.5 El primer circuito: pila, interruptor, resistencia y LED -------- */
  EM.defineSim('lazo', function (sim) {
    const scene = {
      boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [],
      parts: [
        { id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 22], pins: ['T+3', 'T-3'] },
        { id: 'SW1', type: 'SW', closed: false, pins: ['h8', 'h12'] },
        { id: 'R1', type: 'R', value: 470, watt: 0.25, pins: ['g12', 'g16'] },
        { id: 'D1', type: 'LED', color: 'rojo', pins: ['f16', 'f17'] }
      ],
      wires: [{ id: 'w1', a: 'T+4', b: 'j8' }, { id: 'wret', a: 'j17', b: 'T-4' }],
      sch: { w: 25, h: 11, parts: { B1: { at: [4, 6], rot: 90, lab: [-3.0, 0] }, SW1: { at: [10, 2] }, R1: { at: [17, 2] }, D1: { at: [22, 6], rot: 90, lab: [1.7, 0] } }, wires: [['B1.0', [4, 2], 'SW1.0'], ['SW1.1', 'R1.0'], ['R1.1', [22, 2], 'D1.0'], ['D1.1', [22, 10], [4, 10], 'B1.1']] }
    };
    EM.Lab.mount(sim, {
      aspect: 1.75, scene, meter: { mode: 'V' }, meterAt: [96, 4],
      hint: 'Toque el interruptor para cerrar el circuito. Arrastre las puntas del multímetro para medir en cualquier punto.',
      faults: [
        { id: 'cut', label: 'Cable desconectado (circuito abierto)', apply: (s) => { s.wires.find((w) => w.id === 'wret').cut = true; }, revert: (s) => { s.wires.find((w) => w.id === 'wret').cut = false; } },
        { id: 'rev', label: 'LED puesto al revés', apply: (s) => { const d = s.parts.find((p) => p.id === 'D1'); d.pins = ['f17', 'f16']; }, revert: (s) => { const d = s.parts.find((p) => p.id === 'D1'); d.pins = ['f16', 'f17']; } }
      ],
      outs: [
        { id: 'I', label: 'Corriente del lazo', hl: true, fn: (lab) => { const e = lab.bench.c.find('R1:main'); return EM.fmtI(e.i); } },
        { id: 'Vr', label: 'Tensión en la resistencia', fn: (lab) => EM.fmtV(lab.bench.c.find('R1:main').vab) },
        { id: 'Vd', label: 'Tensión en el LED', fn: (lab) => { const d = lab.scene.parts.find((p) => p.id === 'D1'); return EM.si(lab.bench.v(d.pins[0]) - lab.bench.v(d.pins[1]), 'V', 3); } }
      ]
    });
  });
})();
