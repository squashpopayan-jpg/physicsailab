/* Capítulo 2 — Creencias, guiones y la promesa de cambiar la mentalidad */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L;

  /* ======================================================================
     2.1 Guiones de dinero (ejercicio de reflexión)
     ====================================================================== */
  const GUIONES = [
    ['ev', 'Evitación', '--c2', ['Tener mucho dinero vuelve egoísta a la gente.', 'Me incomoda revisar mis cuentas o mi saldo.', 'Siento culpa cuando gano o tengo más que otros.'],
      'Tiende a alejarse del dinero: no revisar, no negociar, deshacerse de lo que llega. Lo útil: no pone el dinero por encima de las personas. El paso siguiente: mirar las cifras una vez por semana, sin juzgarse.'],
    ['ad', 'Adoración', '--c4', ['Si tuviera más dinero, sería mucho más feliz.', 'La mayoría de mis problemas se acabarían con más ingresos.', 'Nunca se tiene suficiente dinero.'],
      'Espera que el dinero resuelva lo que no puede resolver. Lo útil: motivación para progresar. El paso siguiente: el capítulo 4 sobre dinero y bienestar, y definir qué es «suficiente».'],
    ['es', 'Estatus', '--c5', ['Lo que tengo dice cuánto valgo.', 'Me importa que otros vean que me va bien.', 'Compro cosas para no quedarme atrás de mis amigos o colegas.'],
      'Mide el valor propio con lo que se ve. Lo útil: ambición y cuidado de la imagen profesional. El paso siguiente: separar gasto visible de patrimonio (capítulo 11) y revisar las compras hechas para otros.'],
    ['vi', 'Vigilancia', '--c3', ['Me pongo nervioso si no tengo un ahorro guardado.', 'Prefiero no contarle a nadie cuánto gano.', 'Gastar en mí mismo me hace sentir que desperdicio.'],
      'Prudencia y control. Lo útil: suele ahorrar y evitar deudas. El riesgo: ansiedad, no disfrutar y guardar todo en efectivo. El paso siguiente: un plan que incluya gasto con permiso y dinero invertido, no solo guardado.']
  ];
  CC.defineSim('guiones', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 1.5, label: 'Gráfico de radar con los cuatro guiones de dinero' });
    GUIONES.forEach(([id, nombre, , frases]) => {
      sim.group(nombre);
      frases.forEach((f, k) => sim.slider(id + k, { label: f, min: 1, max: 6, step: 1, value: 3, fmt: (v) => CC.nf(v) }));
    });
    sim.out('top', 'Guion más marcado', { hl: true, wide: true });
    sim.out('txt', '', { wide: true });
    sim.onDraw(() => {
      const sc = GUIONES.map(([id]) => (sim.p[id + 0] + sim.p[id + 1] + sim.p[id + 2]) / 3);
      CC.draw.clear(cv);
      const ctx = cv.ctx, cx = cv.w / 2, cy = cv.h / 2 + 4, R = Math.min(cv.w * 0.32, cv.h * 0.38);
      const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
      const pt = (k, v) => [cx + ((R * (v - 1)) / 5) * Math.cos(ang[k]), cy + ((R * (v - 1)) / 5) * Math.sin(ang[k])];
      ctx.strokeStyle = CC.col('--grid-2');
      ctx.lineWidth = 1;
      for (let v = 2; v <= 6; v++) {
        ctx.beginPath();
        for (let k = 0; k < 4; k++) { const [x, y] = pt(k, v); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
      }
      for (let k = 0; k < 4; k++) { const [x, y] = pt(k, 6); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.beginPath();
      sc.forEach((v, k) => { const [x, y] = pt(k, v); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath();
      ctx.fillStyle = CC.alpha('--accent', 0.2); ctx.fill();
      ctx.strokeStyle = CC.col('--accent'); ctx.lineWidth = 2.4; ctx.stroke();
      sc.forEach((v, k) => {
        const [x, y] = pt(k, v);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = CC.col(GUIONES[k][2]); ctx.fill();
        const [lx, ly] = pt(k, 7.1);
        CC.text(ctx, `${GUIONES[k][1]} · ${CC.nf(v, 1)}`, lx, ly, { size: 13, weight: 700, align: k === 1 ? 'left' : k === 3 ? 'right' : 'center', baseline: 'middle', color: GUIONES[k][2], halo: true });
      });
      CC.text(ctx, '1 = nada de acuerdo · 6 = totalmente', 10, cv.h - 10, { size: 11, color: '--ink-3' });
      const mx = Math.max(...sc), k = sc.indexOf(mx);
      if (mx <= 3.01) { sim.set('top', 'Ninguno destaca'); sim.set('txt', 'Sus respuestas están en la zona media. Vuelva a leer las frases y piense en situaciones concretas: ¿qué hace cuando llega la prima? ¿Y cuando un amigo estrena carro?'); }
      else { sim.set('top', `${GUIONES[k][1]} (${CC.nf(mx, 1)} de 6)`); sim.set('txt', GUIONES[k][4]); }
    });
  });

  /* ======================================================================
     2.2 Plan WOOP
     ====================================================================== */
  const EJ = {
    w: 'Tener un fondo de emergencia de tres meses de gastos en los próximos 12 meses.',
    o: 'Dormir tranquilo, no volver a usar la tarjeta para imprevistos y poder decir que no a un préstamo caro.',
    b: 'El día de pago me siento con plata y gasto en antojos el primer fin de semana.',
    p: 'Si es día de pago, entonces, antes de salir de la oficina, programo una transferencia de $300.000 a la cuenta del fondo.'
  };
  CC.defineSim('woop', function (sim) {
    const saved = CC.store.get('woop', null) || EJ;
    sim.group('Su plan');
    sim.text('w', { label: '<b>W</b> · Deseo: ¿qué quiere lograr con su dinero?', value: saved.w, rows: 2 });
    sim.text('o', { label: '<b>O</b> · Mejor resultado: ¿cómo se sentirá o qué cambiará?', value: saved.o, rows: 2 });
    sim.text('b', { label: '<b>O</b> · Obstáculo interno: ¿qué hábito o emoción suya lo impide?', value: saved.b, rows: 2 });
    sim.text('p', { label: '<b>P</b> · Plan: si [obstáculo o momento], entonces [acción]', value: saved.p, rows: 2 });
    sim.stage.style.display = 'none';
    const card = sim.html();
    card.style.minHeight = '320px';
    const msg = CC.el('div', 'ctrl-note');
    sim.button('Copiar tarjeta', () => {
      const txt = `MI PLAN WOOP\nDeseo: ${sim.p.w}\nMejor resultado: ${sim.p.o}\nObstáculo: ${sim.p.b}\nPlan: ${sim.p.p}`;
      const done = (ok) => { msg.textContent = ok ? 'Copiada. Péguela en su celular o en un papel visible.' : 'Seleccione el texto de la tarjeta y cópielo con Ctrl+C.'; };
      try { navigator.clipboard.writeText(txt).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    }, { id: 'copy' });
    sim.button('Volver al ejemplo', () => { for (const k of ['w', 'o', 'b', 'p']) sim.ctl[k].set(EJ[k], true); sim.changed('w'); }, { id: 'ej' });
    sim.ctrlBox.append(msg);
    const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const render = () => {
      CC.store.set('woop', { w: sim.p.w, o: sim.p.o, b: sim.p.b, p: sim.p.p });
      const plan = esc(sim.p.p);
      const ok = /^\s*si\b/i.test(sim.p.p) && /entonces/i.test(sim.p.p);
      card.innerHTML = `<div style="border:2px solid var(--accent);border-radius:8px;padding:16px 18px;max-width:34rem;background:var(--surface)">
        <div style="font:700 11px var(--font-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)">Mi plan WOOP</div>
        <p style="margin:10px 0 6px"><b>Deseo.</b> ${esc(sim.p.w)}</p>
        <p style="margin:0 0 6px"><b>Mejor resultado.</b> ${esc(sim.p.o)}</p>
        <p style="margin:0 0 6px"><b>Obstáculo.</b> ${esc(sim.p.b)}</p>
        <p style="margin:0;padding:8px 10px;background:var(--accent-soft);border-radius:5px"><b>Plan.</b> ${plan}</p>
        </div><p class="ctrl-note" style="margin-top:10px">${ok ? 'El plan tiene la forma «si…, entonces…». Bien.' : 'Sugerencia: escriba el plan como «Si [situación], entonces [acción concreta]». Esa forma es la que tiene evidencia.'} La tarjeta se guarda solo en este navegador.</p>`;
    };
    sim.onChange = render;
    render();
  });

  /* ======================================================================
     2.3 Cuatro caminos con el mismo ingreso
     ====================================================================== */
  CC.defineSim('tres-caminos', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Patrimonio de cuatro personas con el mismo ingreso' });
    sim.group('Las cuatro personas');
    sim.slider('ing', { label: 'Ingreso mensual (en pesos de hoy)', min: 1000000, max: 15000000, step: 100000, value: 3000000, fmt: CC.copS });
    sim.slider('base', { label: 'Ahorro habitual (personas 1 y 2)', min: 0, max: 0.1, step: 0.005, value: 0.03, fmt: (v) => CC.pct(v) });
    sim.slider('s', { label: 'Ahorro automático (personas 3 y 4)', min: 0.05, max: 0.4, step: 0.01, value: 0.1, fmt: (v) => CC.pct(v, 0) });
    sim.slider('r', { label: 'Rentabilidad real de la persona 4', min: 0, max: 0.08, step: 0.005, value: 0.04, fmt: (v) => CC.pct(v) });
    sim.slider('Y', { label: 'Años', min: 5, max: 40, step: 1, value: 25, fmt: (v) => CC.nf(v) });
    sim.out('p1', '1 · Sigue igual');
    sim.out('p2', '2 · Solo «cambia la mentalidad»');
    sim.out('p3', '3 · Ahorro automático');
    sim.out('p4', '4 · Ahorro automático + inversión', { hl: true });
    sim.out('x', 'Persona 4 frente a persona 1');
    sim.onDraw(() => {
      const Y = Math.round(sim.p.Y), M = Y * 12;
      const run = (s, r) => L.tvm.savingsPath({ p0: 0, aporte: s * sim.p.ing, im: L.tvm.eaToPeriodic(r, 12), meses: M }).saldo;
      const a = run(sim.p.base, 0), c = run(sim.p.s, 0), d = run(sim.p.s, sim.p.r);
      const xs = a.map((_, k) => k / 12);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Y, ymin: 0, ymax: d[M] * 1.08, xlabel: 'años', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.xy(xs, d, { color: '--c3', width: 2.6 });
      pl.xy(xs, c, { color: '--c1', width: 2.4 });
      pl.xy(xs, a, { color: '--c6', width: 5, alpha: 0.5 });
      pl.xy(xs, a, { color: '--c5', width: 1.8, dash: [6, 5] });
      pl.legend([{ label: '1 · sigue igual', color: '--c6', width: 5 }, { label: '2 · solo mentalidad (misma línea)', color: '--c5', dash: [6, 5] }, { label: '3 · ahorro automático', color: '--c1' }, { label: '4 · ahorro + inversión', color: '--c3' }], 'tl');
      sim.set('p1', CC.copS(a[M]));
      sim.set('p2', CC.copS(a[M]));
      sim.set('p3', CC.copS(c[M]));
      sim.set('p4', CC.copS(d[M]));
      sim.set('x', a[M] > 0 ? CC.nf(d[M] / a[M], 1) + ' veces' : '—');
    });
  });
})();
