/* ===================================================================
   40-hist.js — utilidades de datos históricos y simulaciones comunes
   (línea de tiempo, vidas que coincidieron)
   EM.hist = { people, events, formulas, myths } la inyecta build.js
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const H = (EM.hist = EM.hist || { people: [], events: [], formulas: [], myths: [] });
  const PI = Math.PI;

  H.byId = {};
  H.people.forEach((p) => { H.byId[p.id] = p; });
  H.person = (id) => H.byId[id];

  /* Año legible: negativos son a. C. (sin año cero, como en el uso histórico) */
  EM.yr = function (y, ap) {
    const s = y < 0 ? Math.abs(Math.round(y)) + ' a. C.' : String(Math.round(y));
    return (ap ? 'c. ' : '') + s;
  };

  /* Géneros de acontecimiento: carril, nombre y color */
  H.KINDS = [
    ['met', 'Método y sociedad', '--c5'],
    ['ast', 'Astronomía', '--c1'],
    ['mec', 'Mecánica', '--c4'],
    ['opt', 'Luz y ondas', '--c3'],
    ['cal', 'Calor y estadística', '--c2'],
    ['em', 'Electricidad y magnetismo', '--efield'],
    ['atm', 'Átomo y cuantos', '--cur'],
    ['rel', 'Relatividad y cosmos', '--water'],
    ['nuc', 'Núcleo y partículas', '--pos'],
    ['mat', 'Materia y técnica', '--gold']
  ];
  H.kindName = Object.fromEntries(H.KINDS.map((k) => [k[0], k[1]]));
  H.kindCol = Object.fromEntries(H.KINDS.map((k) => [k[0], k[2]]));

  /* Línea de tiempo con carriles por disciplina */
  EM.defineSim('timeline', function (sim, ds) {
    const cv = sim.canvas({ aspect: +(ds.aspect || 1.75) });
    const chs = ds.ch ? ds.ch.split(',') : null;
    let pool = H.events.filter((e) => !chs || chs.includes(e.ch));
    const ymin0 = ds.from !== undefined ? +ds.from : Math.min(...pool.map((e) => e.y)) - 5;
    const ymax0 = ds.to !== undefined ? +ds.to : Math.max(...pool.map((e) => e.y)) + 5;
    const master = !chs;
    if (master) {
      sim.slider('a', { label: 'Desde el año', min: -3000, max: 2024, step: 1, value: ymin0, fmt: (v) => EM.yr(v) });
      sim.slider('b', { label: 'Hasta el año', min: -3000, max: 2030, step: 1, value: ymax0, fmt: (v) => EM.yr(v) });
      sim.seg('pre', { label: 'Atajos', options: [['all', 'Todo'], ['ant', 'Antigüedad'], ['rev', 'Revolución científica'], ['xix', 'Siglo XIX'], ['xx', 'Siglo XX']], value: 'all', onInput: (v) => {
        const R = { all: [-3000, 2030], ant: [-3000, 500], rev: [1500, 1700], xix: [1750, 1900], xx: [1890, 2030] }[v];
        sim.ctl.a.set(R[0], true); sim.ctl.b.set(R[1], true);
      } });
    }
    const kinds = H.KINDS.filter((k) => pool.some((e) => e.k === k[0]));
    kinds.forEach((k) => sim.check('k_' + k[0], { label: k[1], value: true }));
    sim.out('sel', 'Acontecimiento', { hl: true });
    sim.out('anio', 'Año');
    sim.out('cap', 'Capítulo');
    sim.note('Pase el puntero (o toque) un punto para leer el acontecimiento; un clic abre el capítulo donde se cuenta.');
    let hit = null, sel = null;
    const margin = { l: 118, r: 14, t: 8, b: 30 };
    const layout = () => {
      const p = sim.p;
      const a = master ? p.a : ymin0, b = master ? Math.max(p.b, p.a + 5) : ymax0;
      const lanes = kinds.filter((k) => p['k_' + k[0]]);
      return { a, b, lanes };
    };
    const X = (y, L) => margin.l + ((y - L.a) / (L.b - L.a)) * (cv.w - margin.l - margin.r);
    const points = [];
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, Hh = cv.h;
      EM.draw.clear(cv);
      const L = layout();
      points.length = 0;
      const laneH = (Hh - margin.t - margin.b) / Math.max(1, L.lanes.length);
      /* eje */
      const ticks = EM.ticks(L.a, L.b, Math.max(4, Math.floor(W / 110)));
      ctx.strokeStyle = EM.col('--grid'); ctx.lineWidth = 1;
      for (const t of ticks.ticks) { const x = X(t, L); if (x < margin.l || x > W - margin.r) continue; ctx.beginPath(); ctx.moveTo(x, margin.t); ctx.lineTo(x, Hh - margin.b); ctx.stroke(); EM.text(ctx, EM.yr(t), x, Hh - margin.b + 15, { size: 11, color: '--axis', align: 'center' }); }
      L.lanes.forEach((k, i) => {
        const y0 = margin.t + i * laneH, yc = y0 + laneH / 2;
        ctx.fillStyle = i % 2 ? EM.alpha('--surface-2', 0.0) : EM.alpha('--surface-2', 0.45);
        ctx.fillRect(0, y0, W, laneH);
        EM.text(ctx, k[1], 6, yc, { size: 11, color: k[2], weight: 650, baseline: 'middle' });
        const evs = pool.filter((e) => e.k === k[0] && e.y >= L.a && e.y <= L.b).sort((u, v) => u.y - v.y);
        const ends = [-1e9, -1e9, -1e9];
        evs.forEach((e) => {
          const x = X(e.y, L);
          const isSel = sel === e;
          ctx.beginPath(); ctx.arc(x, yc, isSel ? 6.5 : 4.2, 0, 2 * PI);
          ctx.fillStyle = EM.col(k[2]); ctx.fill();
          if (isSel) { ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.6; ctx.stroke(); }
          points.push({ x, y: yc, e });
          const txt = e.s || e.t.slice(0, 22);
          ctx.font = '10.5px ' + EM.FONT_UI;
          const w = ctx.measureText(txt).width;
          if (laneH > 34) {
            for (let lv = 0; lv < 3; lv++) {
              if (x - 3 > ends[lv] + 4 && x + w < W - 4) {
                const yy = yc + (lv === 0 ? -9 : lv === 1 ? 14 : -19);
                if (yy > y0 + 6 && yy < y0 + laneH - 2) { EM.text(ctx, txt, x - 3, yy, { size: 10.5, color: '--ink-2' }); ends[lv] = x + w; break; }
              }
            }
          }
        });
      });
    });
    const find = (x, y) => {
      let best = null, bd = 14;
      for (const p of points) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p.e; } }
      return best;
    };
    const show = (e) => {
      sel = e;
      if (!e) { sim.set('sel', '—'); sim.set('anio', '—'); sim.set('cap', '—'); sim.redraw(); return; }
      sim.set('sel', e.t);
      sim.set('anio', EM.yr(e.y));
      sim.set('cap', e.ch ? '<a href="#' + e.ch + '">' + e.ch + '</a>' : '—');
      sim.redraw();
    };
    show(null);
    EM.pointer(cv, {
      hover: (x, y) => { const e = find(x, y); if (e !== sel) show(e); return e ? 'pointer' : false; },
      down: (x, y) => { const e = find(x, y); if (e) { show(e); if (e.ch && EM.app && EM.app.byId[e.ch]) location.hash = e.ch; } return null; },
      touch: 'pan-y'
    });
  });

  /* Quiénes pudieron conocerse: vidas superpuestas */
  EM.defineSim('vidas', function (sim, ds) {
    const ids = ds.ids.split(',').map((s) => s.trim());
    const ps = ids.map((i) => H.byId[i]).filter(Boolean).sort((a, b) => a.b - b.b);
    const cv = sim.canvas({ aspect: Math.max(1.2, Math.min(2.2, 1.9 - ps.length * 0.02)), minH: (60 + ps.length * 22) + 'px' });
    sim.select('quien', { label: 'Elegir un personaje', options: ps.map((p) => [p.id, p.n]), value: ps[0].id });
    sim.slider('edad', { label: 'Edad mínima para que cuente un encuentro', min: 0, max: 40, step: 1, value: 20, fmt: (v) => v + ' años' });
    sim.out('coin', 'Pudo coincidir (de adulto) con', { hl: true });
    sim.out('ant', 'Eran aún niños cuando murió');
    sim.note('La barra gris es la vida; la parte intensa, los años de adulto. «Pudo coincidir» exige que ambos sean mayores que la edad indicada a la vez; no prueba que se conocieran, y varios casos famosos (Galileo y Kepler, Newton y Leibniz) se resolvieron por carta.');
    const lo = Math.min(...ps.map((p) => p.b)) - 10, hi = Math.max(...ps.map((p) => p.d)) + 10;
    const margin = { l: 150, r: 14, t: 6, b: 26 };
    const over = (p, q, age) => {
      const s = Math.max(p.b + age, q.b + age), e = Math.min(p.d, q.d);
      return e - s;
    };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, Hh = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const X = (y) => margin.l + ((y - lo) / (hi - lo)) * (W - margin.l - margin.r);
      const rh = Math.min(26, (Hh - margin.t - margin.b) / ps.length);
      const me = H.byId[p.quien];
      for (const t of EM.ticks(lo, hi, Math.max(4, Math.floor(W / 100))).ticks) {
        const x = X(t); if (x < margin.l || x > W - margin.r) continue;
        ctx.strokeStyle = EM.col('--grid'); ctx.beginPath(); ctx.moveTo(x, margin.t); ctx.lineTo(x, Hh - margin.b); ctx.stroke();
        EM.text(ctx, EM.yr(t), x, Hh - margin.b + 15, { size: 11, color: '--axis', align: 'center' });
      }
      const co = [];
      ps.forEach((q, i) => {
        const y = margin.t + i * rh + rh / 2;
        const isMe = q === me;
        const coin = !isMe && over(me, q, p.edad) > 0;
        if (coin) co.push(q);
        const col = isMe ? '--accent' : coin ? '--c3' : '--ink-3';
        ctx.fillStyle = EM.alpha(col, 0.28);
        ctx.fillRect(X(q.b), y - 5, X(q.d) - X(q.b), 10);
        ctx.fillStyle = EM.col(col);
        const a0 = X(q.b + p.edad);
        if (a0 < X(q.d)) ctx.fillRect(a0, y - 5, X(q.d) - a0, 10);
        EM.text(ctx, q.n, margin.l - 6, y, { size: 11.5, color: isMe ? '--accent' : coin ? '--ink' : '--ink-2', weight: isMe || coin ? 650 : 400, align: 'right', baseline: 'middle' });
      });
      /* franja de la vida adulta del elegido */
      ctx.fillStyle = EM.alpha('--accent', 0.08);
      ctx.fillRect(X(me.b + p.edad), margin.t, X(me.d) - X(me.b + p.edad), Hh - margin.t - margin.b);
      sim.set('coin', co.length ? co.map((q) => q.n).join(', ') : 'nadie del grupo');
      const antes = ps.filter((q) => q !== me && q.b < me.d && q.b + p.edad > me.d);
      sim.set('ant', antes.length ? antes.map((q) => q.n).join(', ') : '—');
    });
  });
})();
