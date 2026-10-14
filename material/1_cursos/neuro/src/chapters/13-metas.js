/* Capítulo 13 — Visualizar, hablarse y fijar metas */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;

  /* ======================================================================
     13.1 Práctica física, mental y combinada (modelo didáctico)
     ====================================================================== */
  RC.defineSim('mental', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Habilidad a lo largo de las sesiones según el tipo de práctica' });
    sim.group('Práctica');
    sim.slider('n', { label: 'Sesiones', min: 5, max: 60, step: 1, value: 30, fmt: (v) => RC.nf(v) });
    sim.slider('k', { label: 'Eficacia de una sesión mental frente a una física', min: 0.1, max: 0.8, step: 0.05, value: 0.4, fmt: (v) => RC.pct(v, 0) });
    sim.slider('mix', { label: 'En la práctica combinada, fracción de sesiones mentales', min: 0, max: 0.8, step: 0.05, value: 0.5, fmt: (v) => RC.pct(v, 0) });
    sim.out('f', 'Solo física');
    sim.out('c', 'Combinada', { hl: true });
    sim.out('m', 'Solo mental');
    sim.out('z', 'Sin práctica');
    sim.onDraw(() => {
      const r = 0.08, n = sim.p.n;
      const curva = (tipo) => {
        let S = 0.1;
        const ys = [S];
        for (let s = 1; s <= n; s++) {
          let g = 0;
          if (tipo === 'f') g = r;
          else if (tipo === 'm') g = r * sim.p.k;
          else if (tipo === 'c') g = (s * sim.p.mix) % 1 < sim.p.mix && Math.floor(s * sim.p.mix) !== Math.floor((s - 1) * sim.p.mix) ? r * sim.p.k : r;
          S += g * (1 - S);
          ys.push(S);
        }
        return ys;
      };
      const F = curva('f'), C = curva('c'), M = curva('m'), Z = curva('z');
      const xs = F.map((_, i) => i);
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: 0, ymax: 1, xlabel: 'sesiones', ylabel: 'habilidad (fracción del máximo)', yfmt: RC.pctAxis });
      pl.frame();
      pl.xy(xs, F, { color: '--c3', width: 2.4 });
      pl.xy(xs, C, { color: '--c1', width: 2.6 });
      pl.xy(xs, M, { color: '--c4', width: 2.2, dash: [6, 4] });
      pl.xy(xs, Z, { color: '--c6', width: 1.6, dash: [2, 4] });
      pl.legend([{ label: 'física', color: '--c3' }, { label: 'combinada', color: '--c1' }, { label: 'mental', color: '--c4', dash: [6, 4] }, { label: 'sin práctica', color: '--c6', dash: [2, 4] }], 'br');
      sim.set('f', RC.pct(F[n], 0)); sim.set('c', RC.pct(C[n], 0)); sim.set('m', RC.pct(M[n], 0)); sim.set('z', RC.pct(Z[n], 0));
    });
  });

  /* ======================================================================
     13.2 Efectos de técnicas según sus metaanálisis
     ====================================================================== */
  const TEC = [
    ['Intenciones de implementación (Gollwitzer y Sheeran, 2006)', 0.65],
    ['Práctica mental (Driskell y otros, 1994)', 0.527],
    ['Autodiálogo en el deporte (Hatzigeorgiadis y otros, 2011)', 0.48],
    ['Registrar el progreso (Harkin y otros, 2016)', 0.40],
    ['Reevaluar la situación (Webb y otros, 2012)', 0.36],
    ['Contraste mental + intenciones (Wang y otros, 2021)', 0.336],
    ['Práctica mental, réplica corregida (Toth y otros, 2020)', 0.264]
  ];
  RC.defineSim('tecnicas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Tamaño del efecto de siete técnicas según sus metaanálisis' });
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.onDraw(() => {
      RC.draw.clear(cv);
      const n = TEC.length;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.85, ymin: 0, ymax: n, yticks: [], xlabel: 'tamaño del efecto (d)', ml: Math.min(330, cv.w * 0.5) });
      pl.frame();
      TEC.forEach(([name, d], i) => {
        const y = n - i - 0.5, ctx = cv.ctx;
        ctx.fillStyle = RC.alpha(i === n - 1 || i === 1 ? '--c4' : '--c3', 0.85);
        ctx.fillRect(pl.X(0), pl.Y(y + 0.32), pl.X(d) - pl.X(0), pl.Y(y - 0.32) - pl.Y(y + 0.32));
        RC.text(ctx, name, pl.ix - 8, pl.Y(y), { size: 11.5, align: 'right', baseline: 'middle', color: '--ink' });
        RC.text(ctx, `${RC.nf(d, 2)} · NNT ≈ ${RC.nf(L.ev.nnt(d), 1)}`, pl.X(d) + 6, pl.Y(y), { size: 11, baseline: 'middle', color: '--ink-2', mono: true });
      });
    });
  });

  /* ======================================================================
     13.3 Hoja WOOP conectada a «Mi progreso»
     ====================================================================== */
  RC.defineSim('woop', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const box = sim.html('trk');
    let st = { w: '', o: '', ob: '', p: '', senal: '' };
    try { st = Object.assign(st, JSON.parse(localStorage.getItem('recablear:woop') || '{}')); } catch (e) { /* */ }
    const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    box.innerHTML = `
      <div class="grid">
        <label><b>Deseo</b> (W): ¿qué quiere lograr en las próximas 4 a 8 semanas? Algo desafiante y posible.<textarea data-k="w" rows="2" placeholder="Correr 5 km sin parar">${esc(st.w)}</textarea></label>
        <label><b>Resultado</b> (O): ¿cuál sería el mejor resultado? Imagínelo un momento.<textarea data-k="o" rows="2" placeholder="Terminar la carrera del barrio sintiéndome bien">${esc(st.o)}</textarea></label>
        <label><b>Obstáculo</b> (O): ¿qué hay en usted que más se lo impide? Un pensamiento, una emoción, un hábito.<textarea data-k="ob" rows="2" placeholder="Al llegar cansado del trabajo me tiro al sofá">${esc(st.ob)}</textarea></label>
        <label><b>Plan</b> (P): ¿qué hará cuando aparezca ese obstáculo?<textarea data-k="p" rows="2" placeholder="Me pongo la ropa de correr antes de sentarme y salgo 10 minutos">${esc(st.p)}</textarea></label>
      </div>
      <div class="res" style="font-family:var(--font-text);font-size:16px;line-height:1.55"></div>
      <label>Señal diaria para el hábito (cuándo y dónde):<input data-k="senal" value="${esc(st.senal)}" placeholder="Al llegar a casa del trabajo"></label>
      <div class="row"><button type="button" class="btn primary" data-act="crear">Crear hábito en «Mi progreso»</button><span class="msg"></span></div>`;
    const res = box.querySelector('.res'), msg = box.querySelector('.msg');
    const upd = () => {
      res.innerHTML = st.ob && st.p ? `Su plan: <b>«Si ${esc(st.ob.replace(/^\s*si\s+/i, '').replace(/[.]+$/, ''))}, entonces ${esc(st.p.replace(/[.]+$/, ''))}».</b> Léalo en voz alta y repítalo. Mantenga visible el deseo y el resultado, pero empiece por el plan.` : '<span class="muted">Complete el obstáculo y el plan para ver su intención de implementación.</span>';
      try { localStorage.setItem('recablear:woop', JSON.stringify(st)); } catch (e) { /* */ }
    };
    box.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => { st[el.dataset.k] = el.value; upd(); }));
    box.querySelector('[data-act="crear"]').addEventListener('click', () => {
      if (!st.p.trim()) { msg.className = 'warnmsg'; msg.textContent = 'Escriba primero el plan.'; return; }
      RC.track.addHabito({ nombre: st.p.trim().slice(0, 80), senal: (st.senal || st.ob || '').trim().slice(0, 100), area: 'otro' });
      msg.className = 'msg';
      msg.innerHTML = 'Hábito creado. Márquelo cada día en <a href="#progreso">Mi progreso</a>.';
    });
    upd();
  });

  RC.defineSim('quiz-metas', function (sim) {
    RC.quiz(sim, [
      { q: '¿Qué dicen los metaanálisis sobre la práctica mental?', opts: ['Que reemplaza la práctica física', 'Que mejora el desempeño, con un efecto menor que el de la práctica física', 'Que no tiene efecto'], ok: 1, fb: 'd ≈ 0,53 en 1994 y ≈ 0,26 tras corregir sesgos en 2020.' },
      { q: 'Para un gesto de precisión (un drop en squash), ¿qué autodiálogo conviene?', opts: ['Motivacional: «¡vamos!»', 'Instruccional: «raqueta abierta, golpe suave»', 'Ninguno'], ok: 1, fb: 'El instruccional ayuda más en tareas finas y de precisión.' },
      { q: '¿Cuál es una intención de implementación?', opts: ['«Quiero estar en forma»', '«Si llego a casa a las 6, entonces camino 20 minutos»', '«Este año sí»'], ok: 1, fb: 'Ata la conducta a una señal concreta: si… entonces…' },
      { q: 'Según Oettingen, ¿qué pasa con quien fantasea con placer sobre su meta sin pensar en obstáculos?', opts: ['Se esfuerza más', 'Tiende a esforzarse menos y a lograr menos', 'Siempre lo logra'], ok: 1, fb: 'Las fantasías positivas se asociaron con menos esfuerzo y peores resultados.' },
      { q: 'WOOP combina…', opts: ['Visualización y afirmaciones', 'Deseo, resultado, obstáculo y un plan si-entonces', 'Respiración y meditación'], ok: 1, fb: 'Contraste mental más intenciones de implementación.' }
    ], { id: 'metas', shuffle: true });
  });
})();
