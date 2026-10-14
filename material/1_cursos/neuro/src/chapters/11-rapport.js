/* Capítulo 11 — Rapport, anclas y reencuadre */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;

  /* ======================================================================
     11.1 Ancla = condicionamiento: adquisición, extinción, recarga y contexto
     ====================================================================== */
  RC.defineSim('ancla', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Fuerza del ancla a lo largo de la instalación y de los usos' });
    sim.group('Instalación');
    sim.slider('ni', { label: 'Emparejamientos gesto + estado', min: 1, max: 20, step: 1, value: 5, fmt: (v) => RC.nf(v) });
    sim.slider('int', { label: 'Intensidad del estado evocado', min: 0.2, max: 1, step: 0.05, value: 0.8, fmt: (v) => RC.pct(v, 0) });
    sim.group('Uso');
    sim.slider('nu', { label: 'Usos del gesto solo', min: 5, max: 80, step: 1, value: 40, fmt: (v) => RC.nf(v) });
    sim.slider('rec', { label: 'Recarga cada… usos (0 = nunca)', min: 0, max: 20, step: 1, value: 0, fmt: (v) => (v ? RC.nf(v) : 'nunca') });
    sim.check('ctx', { label: 'Usarlo en un contexto distinto al del taller', value: false });
    sim.out('fin', 'Fuerza del ancla al final', { hl: true });
    sim.out('max', 'Fuerza tras la instalación');
    sim.onDraw(() => {
      const aA = 0.25, aE = 0.08, g = sim.p.ctx ? 0.6 : 1;
      let V = 0;
      const xs = [0], ys = [0], fase = [];
      for (let i = 0; i < sim.p.ni; i++) { V += aA * (sim.p.int - V); xs.push(xs.length); ys.push(V); }
      const Vi = V;
      for (let u = 1; u <= sim.p.nu; u++) {
        if (sim.p.rec && u % sim.p.rec === 0) { V += aA * (sim.p.int - V); fase.push(xs.length); }
        else V += aE * (0 - V);
        xs.push(xs.length); ys.push(V * g);
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: xs.length - 1, ymin: 0, ymax: 1, xlabel: 'ensayos (instalación y luego usos)', ylabel: 'fuerza del ancla', yfmt: RC.pctAxis });
      pl.frame();
      pl.band(0, sim.p.ni, { color: '--c3', alpha: 0.08 });
      pl.label(0.5, 0.95, 'instalación', { color: '--c3' });
      pl.label(sim.p.ni + 1, 0.95, sim.p.ctx ? 'uso (otro contexto)' : 'uso', { color: '--c1' });
      fase.forEach((x) => pl.vline(x, { color: '--c3', alpha: 0.5, dash: [2, 3] }));
      pl.xy(xs, ys, { color: '--c1', width: 2.6 });
      sim.set('fin', RC.pct(ys[ys.length - 1], 0));
      sim.set('max', RC.pct(Vi, 0));
    });
  });

  /* ======================================================================
     11.2 Estrategias de regulación emocional (Webb, Miles y Sheeran, 2012)
     ====================================================================== */
  const WEBB = [
    ['Tomar la perspectiva de otro', 0.45, 're'],
    ['Reevaluar la situación', 0.36, 're'],
    ['Suprimir la expresión', 0.32, 'su'],
    ['Distraerse', 0.27, 'at'],
    ['Reevaluar la propia respuesta', 0.23, 're'],
    ['Suprimir la experiencia', -0.04, 'su'],
    ['Suprimir los pensamientos', -0.12, 'su'],
    ['Concentrarse en la emoción', -0.26, 'at']
  ];
  RC.defineSim('regulacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Tamaño del efecto de ocho estrategias de regulación emocional' });
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.onDraw(() => {
      RC.draw.clear(cv);
      const n = WEBB.length;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.35, xmax: 0.55, ymin: 0, ymax: n, yticks: [], xlabel: 'efecto promedio sobre la emoción (d+)', ml: Math.min(220, cv.w * 0.36) });
      pl.frame();
      pl.vline(0, { color: '--ink-3', dash: [] });
      const col = { re: '--c3', su: '--c4', at: '--c5' };
      WEBB.forEach(([name, d, k], i) => {
        const y = n - i - 0.5, ctx = cv.ctx;
        ctx.fillStyle = RC.alpha(col[k], 0.85);
        const x0 = pl.X(Math.min(0, d)), x1 = pl.X(Math.max(0, d));
        ctx.fillRect(x0, pl.Y(y + 0.32), Math.max(1, x1 - x0), pl.Y(y - 0.32) - pl.Y(y + 0.32));
        RC.text(ctx, name, pl.ix - 8, pl.Y(y), { size: 12, align: 'right', baseline: 'middle', color: '--ink' });
        RC.text(ctx, RC.nf(d, 2), d >= 0 ? x1 + 5 : x0 - 5, pl.Y(y), { size: 11.5, align: d >= 0 ? 'left' : 'right', baseline: 'middle', color: '--ink-2', mono: true });
      });
      pl.legend([{ label: 'cambio cognitivo', color: '--c3', kind: 'sq' }, { label: 'modular la respuesta', color: '--c4', kind: 'sq' }, { label: 'dirigir la atención', color: '--c5', kind: 'sq' }], 'br');
    });
  });

  /* ======================================================================
     11.3 Demostración del efecto de encuadre
     ====================================================================== */
  RC.defineSim('marco', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const box = sim.html('quiz');
    let marco = null, eleccion = null;
    try { marco = localStorage.getItem('recablear:marco'); } catch (e) { /* */ }
    if (marco !== 'g' && marco !== 'p') { marco = Math.random() < 0.5 ? 'g' : 'p'; try { localStorage.setItem('recablear:marco', marco); } catch (e) { /* */ } }
    const TXT = {
      g: [['Programa A', 'Se salvarán 200 personas.'], ['Programa B', 'Con probabilidad de 1/3 se salvan las 600 personas; con probabilidad de 2/3 no se salva nadie.']],
      p: [['Programa C', 'Morirán 400 personas.'], ['Programa D', 'Con probabilidad de 1/3 no muere nadie; con probabilidad de 2/3 mueren las 600 personas.']]
    };
    const render = () => {
      const t = TXT[marco];
      let h = `<div class="q"><b>El país se prepara para una epidemia inusual que, si no se hace nada, matará a 600 personas. Hay dos programas posibles. ¿Cuál elige?</b>
        <div class="opts">${t.map(([n, d], k) => `<button type="button" data-k="${k}" class="${eleccion === k ? 'right' : ''}"><b>${n}:</b> ${d}</button>`).join('')}</div></div>`;
      if (eleccion !== null) {
        const otro = TXT[marco === 'g' ? 'p' : 'g'];
        h += `<div class="fb"><b>Usted eligió el programa ${eleccion === 0 ? 'seguro' : 'arriesgado'}.</b> A la mitad de los lectores de este curso se le muestra el problema descrito en <b>${marco === 'g' ? 'vidas salvadas' : 'muertes'}</b> (su versión) y a la otra mitad en <b>${marco === 'g' ? 'muertes' : 'vidas salvadas'}</b>: «${otro[0][0]}: ${otro[0][1]} ${otro[1][0]}: ${otro[1][1]}». Los cuatro programas son idénticos en sus consecuencias: 200 vivos y 400 muertos en promedio. En el estudio original, con la descripción en vidas salvadas 72 % eligió el programa seguro; con la descripción en muertes, solo 22 % (Tversky y Kahneman, 1981). Con ganancias evitamos el riesgo; con pérdidas lo buscamos.</div>`;
      }
      box.innerHTML = h;
      box.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { eleccion = +b.dataset.k; render(); }));
    };
    render();
  });

  RC.defineSim('quiz-rapport', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué mostró la réplica preregistrada de Hale y Hamilton (2016) sobre ser imitado?', opts: ['Que aumenta mucho la confianza', 'Que no tuvo efecto sobre el rapport ni la confianza', 'Que reduce el rapport'], ok: 1, fb: 'El efecto del primer estudio no se replicó con un diseño estricto.' },
      { q: 'En términos de la investigación, un «ancla» de la PNL es…', opts: ['Un programa del subconsciente', 'Un estímulo condicionado, sujeto a extinción si se usa sin refuerzo', 'Un reflejo innato'], ok: 1, fb: 'Es condicionamiento clásico: real, pero se extingue y depende del contexto.' },
      { q: 'Según Webb y otros (2012), ¿qué estrategia no reduce la emoción?', opts: ['Reevaluar la situación', 'Suprimir la experiencia emocional', 'Tomar la perspectiva de otro'], ok: 1, fb: 'Suprimir la experiencia: d = −0,04.' },
      { q: '¿Qué predice mejor el resultado de una psicoterapia?', opts: ['Espejear los gestos del paciente', 'La alianza terapéutica: acuerdo en metas, tareas y vínculo', 'Usar los predicados sensoriales del paciente'], ok: 1, fb: 'r = 0,28 en 295 estudios (Flückiger y otros, 2018).' },
      { q: 'El efecto de encuadre de Tversky y Kahneman muestra que…', opts: ['Las personas no saben sumar', 'Describir las mismas opciones como ganancias o pérdidas cambia la elección', 'El lenguaje no influye'], ok: 1, fb: '72 % frente a 22 % eligiendo el mismo programa según la descripción.' }
    ], { id: 'rapport', shuffle: true });
  });
})();
