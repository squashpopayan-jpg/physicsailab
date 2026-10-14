/* Capítulo 29 — Terapia neural de Huneke: anestésicos locales, bloqueo y evidencia */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, N = L.neuro;

  /* ======================================================================
     29.1 Bloqueo de la conducción en un cable de Hodgkin-Huxley: mapa espacio-tiempo del voltaje
     ====================================================================== */
  RC.defineSim('bloqueo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Voltaje a lo largo del axón en el tiempo con un tramo bloqueado por anestésico local' });
    sim.group('Anestésico local');
    sim.slider('f', { label: 'Canales de sodio bloqueados', min: 0, max: 1, step: 0.05, value: 1, fmt: (v) => RC.pct(v, 0) });
    sim.slider('l', { label: 'Largo del tramo bloqueado (cm)', min: 0.1, max: 3, step: 0.1, value: 1, fmt: (v) => RC.nf(v, 1) });
    sim.out('pasa', 'Resultado', { hl: true });
    sim.out('v', 'Velocidad antes del bloqueo');
    sim.out('t', 'Llegada al extremo');
    sim.onDraw(() => {
      const c = new N.Cable({ n: 60 });
      const i0 = 20, i1 = Math.min(59, i0 + Math.round(sim.p.l / c.dx));
      for (let i = i0; i < i1; i++) c.block[i] = sim.p.f;
      c.stimulate(200, 0.5);
      const T = 12, dt = 0.005, every = 10, frames = [];
      while (c.t < T) { if (Math.round(c.t / dt) % every === 0) frames.push(Float64Array.from(c.V)); c.step(dt); }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: 0, ymax: T, xlabel: 'posición a lo largo del axón (cm)', ylabel: 'tiempo (ms)' });
      pl.frame();
      const ctx = cv.ctx, nF = frames.length, dtF = T / nF;
      pl.clip(() => {
        for (let k = 0; k < nF; k++) {
          const y0 = pl.Y(k * dtF), y1 = pl.Y((k + 1) * dtF);
          for (let i = 0; i < 60; i++) {
            const a = RC.M.clamp((frames[k][i] + 68) / 100, 0, 1);
            if (a < 0.05) continue;
            ctx.fillStyle = RC.alpha('--c1', a);
            ctx.fillRect(pl.X(i * 0.1), y1, pl.X((i + 1) * 0.1) - pl.X(i * 0.1) + 0.5, y0 - y1 + 0.5);
          }
        }
      });
      if (sim.p.f > 0) {
        pl.band(i0 * 0.1, i1 * 0.1, { color: '--c2', alpha: 0.14 });
        pl.label((i0 + i1) * 0.05, T * 0.94, 'anestésico', { align: 'center', color: '--c2' });
      }
      const llega = !isNaN(c.crossT[59]);
      sim.set('pasa', llega ? 'el impulso pasa' : '<span class="loss">conducción bloqueada</span>');
      sim.set('v', RC.nf(c.velocity(5, 15), 2) + ' m/s');
      sim.set('t', llega ? RC.nf(c.crossT[59], 2) + ' ms' : '—');
    });
  });

  /* ======================================================================
     29.2 Bloqueo dependiente del uso: los axones que disparan rápido se bloquean más
     ====================================================================== */
  RC.defineSim('uso-dependiente', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Voltaje de membrana y fracción de canales bloqueados durante un tren de estímulos' });
    sim.group('Estímulo y fármaco');
    sim.slider('fr', { label: 'Frecuencia de los impulsos (Hz)', min: 5, max: 100, step: 5, value: 50, fmt: (v) => RC.nf(v) });
    sim.slider('c', { label: 'Concentración del anestésico (relativa)', min: 0, max: 2, step: 0.1, value: 1, fmt: (v) => RC.nf(v, 1) });
    sim.out('sp', 'Espigas / estímulos con anestésico', { hl: true });
    sim.out('sp0', 'Sin anestésico');
    sim.out('b', 'Canales bloqueados al final');
    sim.onDraw(() => {
      const per = 1000 / sim.p.fr, I = (t) => (t % per < 1 ? 15 : 0);
      const o = { kon: 0.03, koff: 0.001, p: 6, T: 1000, I };
      const r = N.useDepSim(Object.assign({ c: sim.p.c }, o));
      const r0 = N.useDepSim(Object.assign({ c: 0 }, o));
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1000, ymin: -90, ymax: 60, xlabel: 'tiempo (ms)', ylabel: 'voltaje (mV)' });
      pl.frame();
      pl.xy(r.t, r.V, { color: '--c1', width: 1 });
      pl.xy(r.t, r.b.map((b) => -90 + 150 * b), { color: '--c2', width: 2.6 });
      pl.label(990, -90 + 150 * r.b[r.b.length - 1] + 8, 'canales bloqueados', { align: 'right', color: '--c2' });
      pl.legend([{ label: 'voltaje', color: '--c1' }, { label: 'bloqueo (0 a 100 %, escala propia)', color: '--c2' }], 'tl');
      const nP = Math.floor(999 / per) + 1;
      sim.set('sp', r.spikes.length + ' / ' + nP);
      sim.set('sp0', r0.spikes.length + ' / ' + nP);
      sim.set('b', RC.pct(r.b[r.b.length - 1], 0));
    });
  });

  /* ======================================================================
     29.3 Una serie de casos sin grupo control: regresión a la media e historia natural
     Dolor de cada persona: nivel propio + fluctuación autocorrelacionada semana a semana.
     Consultan cuando el dolor supera el umbral; se mide de nuevo meses después.
     ====================================================================== */
  RC.defineSim('serie-casos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Distribución del cambio de dolor en pacientes tratados y en un grupo sin tratamiento simulado' });
    sim.group('Pacientes');
    sim.slider('ef', { label: 'Efecto real del tratamiento (puntos de 0 a 10)', min: 0, max: 3, step: 0.1, value: 0, fmt: (v) => RC.nf(v, 1) });
    sim.slider('umb', { label: 'Dolor con el que consultan', min: 5, max: 8.5, step: 0.5, value: 7, fmt: (v) => RC.nf(v, 1) });
    let seed = 1;
    sim.button('Otra muestra', () => { seed++; }, { id: 'otra' });
    sim.out('m', 'Mejora media de los tratados', { hl: true });
    sim.out('c30', 'Tratados con mejora ≥ 30 %');
    sim.out('mc', 'Mejora media sin tratamiento');
    sim.onDraw(() => {
      const rng = L.rng(seed * 29 + 3);
      const gen = (ef) => {
        const out = [];
        while (out.length < 280) {
          const mu = 4.8 + 1.2 * rng.gauss();
          let x = 1.4 * rng.gauss(), dolor = 0, sem = 0;
          do { x = 0.85 * x + 1.4 * Math.sqrt(1 - 0.85 * 0.85) * rng.gauss(); dolor = mu + x; sem++; } while (dolor < sim.p.umb && sem < 200);
          if (dolor < sim.p.umb) continue;
          for (let k = 0; k < 26; k++) x = 0.85 * x + 1.4 * Math.sqrt(1 - 0.85 * 0.85) * rng.gauss();
          const despues = RC.M.clamp(mu + x - ef, 0, 10);
          out.push([Math.min(10, dolor), despues]);
        }
        return out;
      };
      const Tt = gen(sim.p.ef), Cc = gen(0);
      const ch = (a) => a.map(([b, d]) => b - d);
      const dT = ch(Tt), dC = ch(Cc);
      const bins = [], bw = 0.5;
      for (let x = -3; x < 8; x += bw) bins.push(x);
      const hist = (d) => bins.map((x) => d.filter((v) => v >= x && v < x + bw).length);
      const hT = hist(dT), hC = hist(dC);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -3, xmax: 8, ymin: 0, ymax: Math.max(...hT, ...hC) * 1.15, xlabel: 'mejora del dolor (puntos de 0 a 10)', ylabel: 'pacientes' });
      pl.frame();
      pl.bars(bins.map((x) => x + bw / 2 - 0.1), hC, { color: '--ink-3', w: 0.2, alpha: 0.7 });
      pl.bars(bins.map((x) => x + bw / 2 + 0.1), hT, { color: '--c3', w: 0.2 });
      pl.vline(0, { color: '--ink-3', dash: [] });
      pl.legend([{ label: 'serie de casos tratados', color: '--c3', kind: 'sq' }, { label: 'grupo sin tratamiento (lo que falta en la serie)', color: '--ink-3', kind: 'sq' }], 'tr');
      const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
      sim.set('m', RC.nf(mean(dT), 1) + ' puntos');
      sim.set('c30', RC.pct(Tt.filter(([b, d]) => d <= 0.7 * b).length / Tt.length, 0));
      sim.set('mc', RC.nf(mean(dC), 1) + ' puntos');
    });
  });

  RC.defineSim('quiz-terapia-neural', function (sim) {
    RC.quiz(sim, [
      { q: '¿Cómo actúan la procaína y la lidocaína?', opts: ['Reprograman el sistema nervioso autónomo', 'Bloquean de forma reversible los canales de sodio dependientes de voltaje, lo que impide la conducción del impulso', 'Destruyen los nervios'], ok: 1, fb: 'Es farmacología bien conocida; su efecto dura de minutos a pocas horas.' },
      { q: 'Según la simulación del cable, un tramo bloqueado muy corto…', opts: ['Siempre detiene el impulso', 'Puede ser saltado por la corriente que fluye dentro del axón', 'Acelera el impulso'], ok: 1, fb: 'Hace falta un bloqueo profundo y lo bastante largo.' },
      { q: 'El bloqueo dependiente del uso significa que…', opts: ['El anestésico funciona mejor si el paciente lo desea', 'Los axones que disparan a alta frecuencia se bloquean más que los que disparan poco', 'Hay que usarlo muchas veces'], ok: 1, fb: 'El fármaco se une con más afinidad a los canales abiertos o inactivados.' },
      { q: 'El estudio suizo de 280 pacientes tratados con terapia neural…', opts: ['Fue un ensayo controlado con placebo', 'Fue una serie de casos sin grupo control: no permite saber cuánto de la mejora se debió al tratamiento', 'Demostró que los «campos de interferencia» existen'], ok: 1, fb: 'Egli y otros (2015); los propios autores lo reconocen.' },
      { q: 'En el dolor miofascial, inyectar anestésico en un punto gatillo frente a la punción seca sin sustancia…', opts: ['El anestésico es muy superior', 'Los resultados son parecidos: la sustancia inyectada parece importar poco', 'La punción seca es peligrosa'], ok: 1, fb: 'Cummings y White (2001).' }
    ], { id: 'terapia-neural', shuffle: true });
  });
})();
