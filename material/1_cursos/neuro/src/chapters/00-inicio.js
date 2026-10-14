/* Portada: red que aprende por coactivación (Hebb) y completa un recuerdo; panel de progreso */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;

  RC.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.1, label: 'Red de 28 neuronas que fortalece las sinapsis entre neuronas que se activan juntas' });
    const N = 28, A = [0, 2, 5, 7, 11, 13, 16], B = [3, 9, 15, 19, 21, 24, 26];
    const rng = L.rng(5);
    const pos = Array.from({ length: N }, (_, i) => { const a = (2 * Math.PI * i) / N - Math.PI / 2, r = 0.36 + 0.06 * Math.sin(i * 2.3); return [0.5 + r * Math.cos(a), 0.52 + r * Math.sin(a)]; });
    let W, act, glow, t, fase, ens, cue, step;
    const reset = () => {
      W = Array.from({ length: N }, () => new Float64Array(N).map(() => 0.04 * rng()));
      act = new Float64Array(N); glow = new Float64Array(N);
      t = 0; fase = 'aprender'; ens = 0; cue = null; step = 0;
    };
    reset();
    const fire = (set) => { for (const i of set) { act[i] = 1; glow[i] = 1; } };
    const hebb = () => {
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) {
        if (act[i] > 0.5 && act[j] > 0.5) W[i][j] += 0.18 * (1 - W[i][j]);
        else if (act[i] > 0.5 || act[j] > 0.5) W[i][j] *= 0.985;
      }
    };
    sim.animate((dt) => {
      t += dt;
      for (let i = 0; i < N; i++) glow[i] = Math.max(0, glow[i] - dt * 1.6);
      if (fase === 'aprender') {
        if (t > 0.55) {
          t = 0; act.fill(0);
          const grupo = ens % 2 ? B : A;
          fire(grupo);
          /* ruido: una neurona al azar también se activa */
          const k = Math.floor(rng() * N); act[k] = 1; glow[k] = 1;
          hebb();
          ens++;
          if (ens >= 16) { fase = 'pausa'; t = 0; }
        }
      } else if (fase === 'pausa') {
        if (t > 1.2) { fase = 'recordar'; t = 0; act.fill(0); cue = ens % 4 < 2 ? A : B; step = 0; fire(cue.slice(0, 2)); }
      } else if (fase === 'recordar') {
        if (t > 0.35 && step < 4) {
          t = 0; step++;
          const nuevo = new Float64Array(N);
          for (let j = 0; j < N; j++) { let h = 0; for (let i = 0; i < N; i++) h += act[i] * W[i][j]; if (act[j] || h > 0.9) nuevo[j] = 1; }
          for (let j = 0; j < N; j++) if (nuevo[j] && !act[j]) glow[j] = 1;
          act = nuevo;
        } else if (step >= 4 && t > 2.4) { reset(); }
      }
    });
    sim.onDraw(() => {
      RC.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, s = Math.min(w, h);
      const ox = (w - s) / 2, P = (i) => [ox + pos[i][0] * s, pos[i][1] * h];
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const ww = 0.5 * (W[i][j] + W[j][i]);
        if (ww < 0.06) continue;
        const [x1, y1] = P(i), [x2, y2] = P(j);
        ctx.strokeStyle = RC.alpha('--c1', Math.min(0.85, ww));
        ctx.lineWidth = 0.6 + 3.2 * ww;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      for (let i = 0; i < N; i++) {
        const [x, y] = P(i), g = glow[i];
        if (g > 0) { ctx.fillStyle = RC.alpha('--c2', 0.35 * g); ctx.beginPath(); ctx.arc(x, y, 9 + 12 * g, 0, 7); ctx.fill(); }
        ctx.fillStyle = act[i] > 0.5 ? RC.col('--c2') : RC.col('--surface');
        ctx.strokeStyle = RC.col('--ink-2'); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 7); ctx.fill(); ctx.stroke();
      }
      const msg = fase === 'aprender' ? `Experiencia ${ens} de 16: se activa el grupo ${ens % 2 ? 'A' : 'B'}` : fase === 'pausa' ? 'Pausa' : `Pista: 2 neuronas del grupo ${cue === A ? 'A' : 'B'} → recuerdo`;
      RC.text(ctx, msg, 12, 22, { size: 13.5, weight: 700, color: '--ink' });
      RC.text(ctx, fase === 'recordar' ? 'la red completa el patrón por sí sola' : 'las sinapsis entre neuronas que se activan juntas se fortalecen', 12, 41, { size: 11.5, color: '--ink-3' });
    });
  });

  /* Panel de progreso de la portada (lo llama 90-app cada vez que cambia el progreso) */
  RC.fillHomeProgress = function (p) {
    const box = document.querySelector('#cap-inicio .home-prog');
    if (!box) return;
    const T = RC.track, hoy = T.ymd();
    const habs = T.state.habitos.filter((h) => h.activo);
    const d = T.dia(hoy) || {};
    const hechos = habs.filter((h) => d.h && d.h[h.id] === 1).length;
    const pesos = T.dias().filter((x) => x.peso > 0);
    let pesoTxt = 'Sin registros todavía';
    if (pesos.length >= 2) {
      const k = L.tend.kalman(pesos.map((x) => x.peso));
      pesoTxt = `${RC.nf(k.lvl[k.lvl.length - 1], 1)} kg (tendencia)`;
    } else if (pesos.length === 1) pesoTxt = `${RC.nf(pesos[0].peso, 1)} kg`;
    box.innerHTML = `
      <div><small>Curso</small><b>${p.leidos} de ${p.caps}</b><span>capítulos estudiados</span><div class="pbar"><i style="width:${(100 * p.frac).toFixed(1)}%"></i></div></div>
      <div><small>Autoevaluaciones</small><b>${p.quizHechos ? Math.round((100 * p.qOk) / p.qN) + ' %' : '—'}</b><span>${p.quizHechos} hechas · aciertos acumulados</span></div>
      <div><small>Hábitos de hoy</small><b>${habs.length ? hechos + ' de ' + habs.length : '—'}</b><span>${habs.length ? 'cumplidos hoy' : 'aún no ha creado hábitos'}</span></div>
      <div><small>Peso</small><b style="font-size:19px">${pesoTxt}</b><span><a href="#progreso">Abrir «Mi progreso» →</a></span></div>`;
  };
})();
