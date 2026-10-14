/* Capítulo 14 — Neuromitos y pseudociencia */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, E = L.ev;

  /* ======================================================================
     14.1 Mozart frente a otra música y silencio (hipótesis de activación y ánimo)
     ====================================================================== */
  RC.defineSim('mozart', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Diferencias observadas en estudios de Mozart contra silencio y contra otra música' });
    sim.group('Realidad');
    sim.slider('ar', { label: 'Efecto de cualquier música animada (d)', min: 0, max: 0.6, step: 0.05, value: 0.35, fmt: (v) => RC.nf(v, 2) });
    sim.slider('moz', { label: 'Efecto específico de Mozart (d)', min: 0, max: 0.5, step: 0.05, value: 0, fmt: (v) => RC.nf(v, 2) });
    sim.slider('n', { label: 'Participantes por grupo', min: 10, max: 100, step: 5, value: 25, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Otros 40 estudios', () => { seed++; }, { id: 'otros' });
    sim.out('s1', 'Mozart vs silencio: estudios significativos', { hl: true });
    sim.out('s2', 'Mozart vs otra música: estudios significativos');
    sim.onDraw(() => {
      const rng = L.rng(seed * 41), K = 40, n = sim.p.n;
      const est = (dA, dB) => { const a = [], b = []; for (let i = 0; i < n; i++) { a.push(dA + rng.gauss()); b.push(dB + rng.gauss()); } return E.welch(a, b); };
      const r1 = [], r2 = [];
      for (let k = 0; k < K; k++) { r1.push(est(sim.p.ar + sim.p.moz, 0)); r2.push(est(sim.p.ar + sim.p.moz, sim.p.ar)); }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1, xmax: 1.6, ymin: 0, ymax: 2, yticks: [], xlabel: 'diferencia observada en la tarea espacial (d)', ml: 150 });
      pl.frame();
      const rj = L.rng(seed);
      const fila = (rs, y0, lab) => {
        RC.text(cv.ctx, lab, pl.ix - 8, pl.Y(y0 + 0.5), { size: 12, align: 'right', baseline: 'middle', color: '--ink' });
        rs.forEach((r) => {
          const px = pl.X(Math.max(-1, Math.min(1.6, r.d))), py = pl.Y(y0 + 0.15 + 0.7 * rj());
          cv.ctx.beginPath(); cv.ctx.arc(px, py, 3.8, 0, 7);
          if (r.p < 0.05 && r.t > 0) { cv.ctx.fillStyle = RC.col('--c2'); cv.ctx.fill(); } else { cv.ctx.strokeStyle = RC.col('--c6'); cv.ctx.lineWidth = 1.2; cv.ctx.stroke(); }
        });
      };
      fila(r1, 1, 'Mozart vs silencio');
      fila(r2, 0, 'Mozart vs otra música');
      pl.hline(1, { color: '--rule-strong', dash: [] });
      pl.vline(0, { color: '--ink-3' });
      const cnt = (rs) => rs.filter((r) => r.p < 0.05 && r.t > 0).length;
      sim.set('s1', `${cnt(r1)} de ${K}`);
      sim.set('s2', `${cnt(r2)} de ${K}`);
    });
  });

  RC.defineSim('quiz-neuromitos', function (sim) {
    const M = ['Mito', 'Realidad'];
    RC.quiz(sim, [
      { q: '«Solo usamos el 10 % de nuestro cerebro».', opts: M, ok: 0, fb: 'Todas las regiones muestran actividad; el cerebro consume cerca de 20 % de la energía en reposo.' },
      { q: '«Hay personas de cerebro derecho, creativas, y de cerebro izquierdo, lógicas».', opts: M, ok: 0, fb: 'Algunas funciones están lateralizadas, pero nadie usa globalmente un hemisferio más que el otro (Nielsen y otros, 2013).' },
      { q: '«El cerebro adulto puede cambiar sus conexiones con la práctica».', opts: M, ok: 1, fb: 'La plasticidad sináptica y la reorganización de mapas en adultos están bien documentadas (capítulos 4 y 6).' },
      { q: '«Escuchar a Mozart sube el coeficiente intelectual».', opts: M, ok: 0, fb: 'Otras músicas producen el mismo efecto breve; se explica por la activación y el ánimo.' },
      { q: '«Los juegos de entrenamiento cerebral mejoran la inteligencia general».', opts: M, ok: 0, fb: 'Mejoran en el juego practicado, sin transferencia a capacidades no entrenadas.' },
      { q: '«El azúcar vuelve hiperactivos a los niños».', opts: M, ok: 0, fb: 'Los ensayos doble ciego no lo muestran (Wolraich y otros, 1995).' },
      { q: '«Repasar espaciado en el tiempo produce mejor memoria a largo plazo que estudiar todo de una vez».', opts: M, ok: 1, fb: 'Uno de los hallazgos más sólidos de la psicología (capítulo 5).' },
      { q: '«Las explicaciones con palabras de neurociencia nos parecen más convincentes aunque no aporten nada».', opts: M, ok: 1, fb: 'Weisberg y otros (2008): el atractivo seductor de la neurociencia.' },
      { q: '«Dormir mal empeora la atención y la memoria».', opts: M, ok: 1, fb: 'Bien documentado.' },
      { q: '«Si una técnica no le funcionó, es porque no la aplicó bien».', opts: ['Señal de pseudociencia', 'Argumento válido'], ok: 0, fb: 'Hace la afirmación imposible de refutar: es una de las diez señales de alarma.' }
    ], { id: 'neuromitos', final: (ok, n) => (ok >= 9 ? 'excelente detector de mitos' : ok >= 7 ? 'buen criterio' : 'repase el capítulo') });
  });
})();
