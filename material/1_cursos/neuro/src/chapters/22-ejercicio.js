/* Capítulo 22 — El ejercicio y el cerebro */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, E = L.ev;

  /* ======================================================================
     22.1 Controles pasivos, sesgo de publicación y corrección PET
     Cada ensayo: d observado = d real + expectativa (si el control es pasivo) + error de muestreo.
     PET = pendiente de la regresión de Egger (equivale al intercepto de y frente a su error estándar con pesos 1/v).
     ====================================================================== */
  function literatura(o) {
    const rng = L.rng(o.seed), out = [];
    for (let i = 0; i < 80; i++) {
      const n = Math.round(10 + 140 * Math.pow(rng(), 2.2));
      const pas = rng() < o.pPas;
      const v = 2 / n + (o.d * o.d) / (4 * n);
      const y = o.d + (pas ? o.exp : 0) + Math.sqrt(v) * rng.gauss();
      const sig = y / Math.sqrt(v) > 1.959964;
      out.push({ y, v, pas, pub: sig || rng() < o.pNull });
    }
    return out;
  }
  RC.defineSim('controles', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Gráfico de embudo de ensayos simulados de ejercicio y cognición según el tipo de control' });
    sim.group('El mundo simulado');
    sim.slider('d', { label: 'Efecto real del ejercicio (d)', min: 0, max: 0.4, step: 0.01, value: 0.05, fmt: (v) => RC.nf(v, 2) });
    sim.slider('exp', { label: 'Expectativa con control pasivo', min: 0, max: 0.4, step: 0.01, value: 0.15, fmt: (v) => RC.nf(v, 2) });
    sim.slider('pPas', { label: 'Ensayos con control pasivo', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => RC.pct(v, 0) });
    sim.slider('pNull', { label: 'Se publican los resultados nulos', min: 0.05, max: 1, step: 0.05, value: 0.3, fmt: (v) => RC.pct(v, 0) });
    let seed = 3;
    sim.button('Otra literatura', () => { seed++; }, { id: 'otra' });
    sim.out('all', 'Todos los publicados', { hl: true });
    sim.out('act', 'Solo control activo');
    sim.out('pet', 'Control activo con corrección PET');
    sim.out('n', 'Publicados (activos)');
    sim.onDraw(() => {
      const lit = literatura({ seed: seed * 31, d: sim.p.d, exp: sim.p.exp, pPas: sim.p.pPas, pNull: sim.p.pNull });
      const pub = lit.filter((s) => s.pub), act = pub.filter((s) => !s.pas);
      const ys = (a) => a.map((s) => s.y), vs = (a) => a.map((s) => s.v);
      const mAll = pub.length > 2 ? E.metaDL(ys(pub), vs(pub)).mu : NaN;
      const mAct = act.length > 2 ? E.metaDL(ys(act), vs(act)).mu : NaN;
      const pet = act.length > 3 ? E.egger(ys(act), vs(act)).slope : NaN;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.9, xmax: 1.6, ymin: 0.48, ymax: 0, yticks: [0, 0.1, 0.2, 0.3, 0.4], xlabel: 'efecto observado sobre la cognición (d)', ylabel: 'error estándar (más preciso arriba)' });
      pl.frame();
      const se = L.util.linspace(0.001, 0.48, 30);
      pl.xy(se.map((s) => 1.96 * s), se, { color: '--ink-3', width: 1, dash: [3, 4] });
      pl.label(1.96 * 0.3 + 0.05, 0.3, 'p = 0,05', { color: '--ink-3' });
      lit.forEach((s) => {
        const px = pl.X(s.y), py = pl.Y(Math.sqrt(s.v)), ctx = cv.ctx;
        ctx.beginPath(); ctx.arc(px, py, 3.8, 0, 7);
        const col = RC.col(s.pas ? '--c2' : '--c1');
        if (s.pub) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = col; ctx.globalAlpha = 0.45; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; }
      });
      pl.vline(sim.p.d, { color: '--gain', dash: [], width: 2.2, label: 'real', labelY: 14 });
      if (isFinite(mAll)) pl.vline(mAll, { color: '--c2', width: 1.8, label: 'todos', labelY: 30 });
      if (isFinite(pet)) pl.vline(pet, { color: '--c1', width: 1.8, dash: [2, 3], label: 'PET', labelY: 46 });
      pl.legend([{ label: 'control activo', color: '--c1', kind: 'dot' }, { label: 'control pasivo', color: '--c2', kind: 'dot' }, { label: 'hueco = no publicado', color: '--ink-3', kind: 'dot' }], 'br');
      const f = (x) => (isFinite(x) ? RC.nf(x, 2) : '—');
      sim.set('all', f(mAll));
      sim.set('act', f(mAct));
      sim.set('pet', f(pet));
      sim.set('n', `${pub.length} de 80 (${act.length})`);
    });
  });

  /* ======================================================================
     22.2 Lo que dicen los metaanálisis: cognición frente a ánimo
     ====================================================================== */
  const EVI = [
    ['Cognición · efecto bruto de los ensayos', 0.22, 'cog'],
    ['Cognición · con control activo y sin diferencias de base', 0.13, 'cog'],
    ['Cognición · corregido por sesgo de publicación', 0.05, 'cog'],
    ['Depresión · caminar o trotar', 0.62, 'dep'],
    ['Depresión · yoga', 0.55, 'dep'],
    ['Depresión · fuerza', 0.49, 'dep'],
    ['Depresión · aeróbico mixto', 0.43, 'dep'],
    ['Depresión · taichí o qigong', 0.42, 'dep']
  ];
  RC.defineSim('ejercicio-evidencia', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Tamaños de efecto del ejercicio sobre la cognición en personas sanas y sobre la depresión' });
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.onDraw(() => {
      RC.draw.clear(cv);
      const n = EVI.length;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.8, ymin: 0, ymax: n, yticks: [], xlabel: 'tamaño del efecto (d o g; en depresión, reducción de síntomas)', ml: Math.min(330, cv.w * 0.5) });
      pl.frame();
      EVI.forEach(([name, d, k], i) => {
        const y = n - i - 0.5, ctx = cv.ctx;
        ctx.fillStyle = RC.alpha(k === 'cog' ? '--c2' : '--c3', 0.85);
        ctx.fillRect(pl.X(0), pl.Y(y + 0.3), pl.X(d) - pl.X(0), pl.Y(y - 0.3) - pl.Y(y + 0.3));
        RC.text(ctx, name, pl.ix - 8, pl.Y(y), { size: 11.5, align: 'right', baseline: 'middle', color: '--ink' });
        RC.text(ctx, RC.nf(d, 2), pl.X(i === 2 ? 0.14 : d) + 6, pl.Y(y), { size: 11.5, baseline: 'middle', color: '--ink-2', mono: true });
      });
      /* intervalo de credibilidad del efecto corregido (−0,09 a 0,14) */
      const yc = n - 2.5;
      pl.xy([0, 0.14], [yc, yc], { color: '--ink', width: 1.5 });
      pl.legend([{ label: 'cognición, personas sanas (Ciria y otros, 2023)', color: '--c2', kind: 'sq' }, { label: 'depresión frente a control activo (Noetel y otros, 2024)', color: '--c3', kind: 'sq' }], 'tr');
    });
  });

  RC.defineSim('quiz-ejercicio', function (sim) {
    RC.quiz(sim, [
      { q: 'En ratones, correr de forma voluntaria…', opts: ['No cambia el cerebro', 'Aumenta la formación de neuronas nuevas en el hipocampo', 'Duplica el tamaño del cerebro'], ok: 1, fb: 'van Praag y otros (1999).' },
      { q: 'El metaanálisis de Firth y otros (2018) sobre el volumen del hipocampo en humanos encontró…', opts: ['Un gran aumento del volumen total', 'Ningún efecto sobre el volumen total y uno positivo en el lado izquierdo, sobre todo por frenar la pérdida con la edad', 'Que el ejercicio reduce el hipocampo'], ok: 1, fb: 'El beneficio parece venir de frenar el deterioro más que de crecer.' },
      { q: '¿Qué le pasó al efecto del ejercicio sobre la cognición en personas sanas al corregir sesgos (Ciria y otros, 2023)?', opts: ['Aumentó', 'Pasó de 0,22 a 0,05, con un intervalo que incluye el cero', 'No cambió'], ok: 1, fb: 'Controles activos, diferencias de base y sesgo de publicación explican buena parte del efecto bruto.' },
      { q: 'Para los síntomas de depresión, el ejercicio…', opts: ['No sirve', 'Tiene efectos moderados en ensayos, con certeza baja, del orden de la psicoterapia', 'Sustituye siempre al tratamiento médico'], ok: 1, fb: 'Noetel y otros (2024). En depresión moderada o grave, el ejercicio se suma al tratamiento, no lo reemplaza.' },
      { q: 'La «euforia del corredor» parece depender sobre todo de…', opts: ['Las endorfinas, que cruzan fácilmente al cerebro', 'El sistema endocannabinoide, según estudios en ratones y un ensayo con naltrexona en humanos', 'El ácido láctico'], ok: 1, fb: 'Bloquear los receptores opioides con naltrexona no eliminó la euforia (Siebers y otros, 2021).' }
    ], { id: 'ejercicio', shuffle: true });
  });
})();
