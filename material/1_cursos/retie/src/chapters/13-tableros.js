/* Capítulo 13 — Tableros y protecciones de uso final */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, N = L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);
  const F = K.t / 2;

  /* Centro de cargas ponderado por la potencia de cada punto */
  function centroCargas() {
    let sx = 0, sy = 0, sw = 0;
    for (const p of K.electrico.puntos) {
      let w = L.Q.cargaPunto(p);
      if (p.c === 'C4' || p.c === 'C5' || p.c === 'C6') w = 1500 / K.electrico.puntos.filter((q) => q.c === p.c).length;
      if (!w) continue;
      sx += w * p.x; sy += w * p.y; sw += w;
    }
    return [sx / sw, sy / sw];
  }
  /* Ajusta un punto a la cara de muro más cercana; devuelve posición y dirección hacia el recinto */
  function aCara(x, y) {
    let best = null;
    for (const m of K.muros) {
      const len = C.dist(m.a, m.b), u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len], n = [-u[1], u[0]];
      for (const [d0, d1] of K.tramosMuro(m)) {
        let d = (x - m.a[0]) * u[0] + (y - m.a[1]) * u[1];
        d = Math.max(d0 + 0.2, Math.min(d1 - 0.2, d));
        if (d1 - d0 < 0.4) continue;
        const pa = [m.a[0] + u[0] * d, m.a[1] + u[1] * d];
        const side = (x - pa[0]) * n[0] + (y - pa[1]) * n[1] >= 0 ? 1 : -1;
        const q = [pa[0] + n[0] * F * side, pa[1] + n[1] * F * side];
        const dd = Math.hypot(q[0] - x, q[1] - y);
        if (!best || dd < best.dd) best = { x: q[0], y: q[1], dir: [n[0] * side, n[1] * side], muro: m, dd };
      }
    }
    return best;
  }
  const CAND = {
    A: { t: 'Sala, muro del eje B', x: 4.8 - F, y: 2.9, dir: [-1, 0] },
    B: { t: 'Hall, muro M5 (adoptada)', x: 6 - F, y: 3.95, dir: [-1, 0] },
    C: { t: 'Entrada, fachada', x: 2.6, y: F, dir: [0, 1] },
    D: { t: 'Dentro del baño', x: 6 + F, y: 5.9, dir: [1, 0] },
    E: { t: 'Cocina, entre lavaplatos y nevera', x: 2.75, y: 8 - F, dir: [0, -1] },
    F: { t: 'Alcoba principal, muro oriental', x: 8 - F, y: 8.1, dir: [-1, 0] }
  };
  function evaluar(pos) {
    const res = [];
    const amb = K.ambientes.find((a) => { const r = K.libre(a); return pos.x >= r[0] - 0.01 && pos.x <= r[2] + 0.01 && pos.y >= r[1] - 0.01 && pos.y <= r[3] + 0.01; });
    const enBano = amb && amb.id === 'bano';
    res.push([enBano ? 'falla' : 'ok', 'RETIE 3.17.19 f', enBano ? 'Queda dentro del baño.' : 'Fuera de espacios de bañeras o duchas.']);
    let dh = Infinity, quien = '';
    for (const m of K.muebles) if (['lavaplatos', 'lavadero', 'lavamanos', 'ducha'].includes(m.tipo) && (!amb || m.amb === amb.id)) { const d = C.distRect([pos.x, pos.y], m.rect); if (d < dh) { dh = d; quien = m.tipo; } }
    res.push([dh < 1.8 ? 'aviso' : 'ok', 'RETIE 3.17.8 y', dh < 1.8 ? `A ${f2(dh)} m de ${quien} en el mismo recinto: no es un lugar permanentemente seco.` : (isFinite(dh) ? `Lugar seco (a ${f2(dh)} m del aparato sanitario del recinto).` : 'Lugar seco: no hay aparatos sanitarios en el recinto.')]);
    /* espacio de trabajo: profundidad libre y muebles dentro del rectángulo de 0,9 × 0,76 m */
    const E = L.G.espacioTrabajo(K, Object.assign({}, pos));
    const t = [-pos.dir[1], pos.dir[0]];
    const esq = [[0, -0.38], [0.9, -0.38], [0.9, 0.38], [0, 0.38]].map(([a, b]) => [pos.x + pos.dir[0] * a + t[0] * b, pos.y + pos.dir[1] * a + t[1] * b]);
    const rx = [Math.min(...esq.map((q) => q[0])), Math.min(...esq.map((q) => q[1])), Math.max(...esq.map((q) => q[0])), Math.max(...esq.map((q) => q[1]))];
    const choque = K.muebles.find((m) => m.rect[0] < rx[2] && m.rect[2] > rx[0] && m.rect[1] < rx[3] && m.rect[3] > rx[1] && m.tipo !== 'cama');
    const okE = E.prof >= 0.9 && !choque;
    res.push([okE ? 'ok' : 'falla', 'RETIE Título 4 e', choque ? `El ${choque.tipo} ocupa el espacio de trabajo de 0,9 × 0,76 m.` : `Profundidad libre ${f2(Math.min(E.prof, 9.99))} m (≥ 0,9 m).`]);
    const vg = K.vigas(false).find((v) => C.distRect([pos.x, pos.y], v.rect) < 1e-6);
    res.push([vg ? 'aviso' : 'ok', 'Coordinación (NSR-10 C.6.3)', vg ? `El muro está bajo la viga ${vg.id}: las tuberías que suben a la losa la atraviesan.` : 'El muro no está bajo una viga: las tuberías suben a la losa sin atravesar vigas.']);
    res.push(['ok', 'RETIE 3.17.8 v', 'La casa no tiene escaleras.']);
    return res;
  }
  function longitudes(pos) {
    let home = 0;
    for (const c of K.electrico.circuitos) {
      const pts = K.electrico.puntos.filter((p) => p.c === c.id);
      home += Math.min(...pts.map((p) => C.dist([p.x, p.y], [pos.x, pos.y])));
    }
    const med = K.electrico.medidor;
    return { home, feeder: C.dist([med.x, med.y], [pos.x, pos.y]) };
  }

  RT.defineSim('ubicar-tablero', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '760px' });
    let pos = Object.assign({}, CAND.B);
    const cc = centroCargas();
    const plano = new RT.Plano(sim, cv, { capas: { tomas: true, ilum: true, esp: true, etiquetas: false } });
    plano.resaltar = () => '--ink-3';
    plano.extra = (ctx, pl) => {
      const X = (x) => pl.X(x), Y = (y) => pl.Y(y);
      /* centro de cargas */
      ctx.save();
      ctx.strokeStyle = RT.col('--c5'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(cc[0]), Y(cc[1]), 9, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(cc[0]) - 13, Y(cc[1])); ctx.lineTo(X(cc[0]) + 13, Y(cc[1])); ctx.moveTo(X(cc[0]), Y(cc[1]) - 13); ctx.lineTo(X(cc[0]), Y(cc[1]) + 13); ctx.stroke();
      RT.text(ctx, 'centro de cargas', X(cc[0]) + 12, Y(cc[1]) - 12, { size: 11.5, color: '--c5', weight: 600, halo: true });
      /* candidatos */
      for (const k in CAND) {
        const c = CAND[k];
        ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), 10, 0, 7); ctx.fillStyle = RT.col('--surface'); ctx.fill(); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1.2; ctx.stroke();
        RT.text(ctx, k, X(c.x), Y(c.y), { size: 12, align: 'center', baseline: 'middle', weight: 700 });
      }
      /* espacio de trabajo y tablero */
      const t = [-pos.dir[1], pos.dir[0]];
      const esq = [[0, -0.38], [0.9, -0.38], [0.9, 0.38], [0, 0.38]].map(([a, b]) => [pos.x + pos.dir[0] * a + t[0] * b, pos.y + pos.dir[1] * a + t[1] * b]);
      ctx.beginPath(); esq.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])))); ctx.closePath();
      ctx.fillStyle = RT.alpha('--accent', 0.16); ctx.fill(); ctx.strokeStyle = RT.col('--accent'); ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(X(pos.x), Y(pos.y), 9, 0, 7); ctx.fillStyle = RT.col('--accent'); ctx.fill();
      RT.text(ctx, 'TG', X(pos.x), Y(pos.y), { size: 10.5, align: 'center', baseline: 'middle', weight: 700, color: '--accent-ink' });
      ctx.restore();
    };
    plano.editable = true;
    plano.pick = (px, py) => (Math.hypot(plano.X(pos.x) - px, plano.Y(pos.y) - py) < 16 ? { id: 'TGm', p: pos, tip: 'Arrastre el tablero' } : null);
    plano.onDrag = (p, wx, wy) => { const q = aCara(wx, wy); if (q) pos = { t: 'Posición libre', x: q.x, y: q.y, dir: q.dir }; sim.ctl.c.set('libre', true); };
    sim.group('Ubicación');
    sim.select('c', { options: Object.keys(CAND).map((k) => [k, k + ' · ' + CAND[k].t]).concat([['libre', 'Arrastrada a mano']]), value: 'B', onInput: (k) => { if (CAND[k]) pos = Object.assign({}, CAND[k]); } });
    sim.out('res', 'Verificación', { wide: true });
    sim.out('dc', 'Distancia al centro de cargas', { hl: true });
    sim.out('home', 'Salidas del tablero (suma de recorridos directos)');
    sim.out('fe', 'Alimentador desde el medidor (en planta)');
    sim.onDraw(() => {
      plano.draw();
      const ev = evaluar(pos), lg = longitudes(pos);
      sim.set('res', '<ul class="hallazgos">' + ev.map(([e, r, t]) => `<li>${RT.estadoChip(e)}<span>${t} <span class="ref">${r}</span></span></li>`).join('') + '</ul>');
      sim.set('dc', f2(C.dist(cc, [pos.x, pos.y])) + ' m');
      sim.set('home', f1(lg.home) + ' m');
      sim.set('fe', f1(lg.feeder) + ' m');
    });
  });

  RT.defineSim('centro-carga', function (sim) {
    const cv = sim.canvas({ aspect: 1.15, maxH: '640px' });
    const filas = L.Q.cuadro(K);
    sim.group('Fase de cada circuito de 120 V');
    for (const r of filas) if (r.fase !== 'AB') sim.seg(r.id, { label: `${r.id} · ${r.nombre} (${f0(r.va)} VA)`, options: [['A', 'A'], ['B', 'B']], value: r.fase });
    sim.button('Volver a la asignación del ejemplo', () => { for (const r of filas) if (r.fase !== 'AB') sim.ctl[r.id].set(r.fase, true); });
    sim.out('A', 'Fase A');
    sim.out('B', 'Fase B');
    sim.out('IN', 'Neutro (cargas conectadas)', { hl: true });
    sim.out('d', 'Desbalance', { hl: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const asign = {};
      for (const r of filas) asign[r.id] = r.fase === 'AB' ? 'AB' : sim.p[r.id];
      const bal = L.Q.balance(K, asign);
      /* ubicar en posiciones: filas alternan A, B, A, B… */
      const rows = 6, slots = [];
      for (let i = 0; i < rows; i++) slots.push({ fase: i % 2 ? 'B' : 'A', izq: null, der: null });
      const libre = (fase) => { for (const s of slots) if (s.fase === fase) { if (!s.izq) return [s, 'izq']; if (!s.der) return [s, 'der']; } return null; };
      const c8 = filas.find((r) => r.fase === 'AB');
      slots[0].izq = { r: c8, dos: true }; slots[1].izq = { r: c8, cont: true };
      for (const r of filas) { if (r === c8) continue; const q = libre(asign[r.id]); if (q) q[0][q[1]] = { r }; }
      const bx = W * 0.2, by = H * 0.13, bw = W * 0.6, bh = H * 0.78, rh = (bh - 20) / rows;
      ctx.fillStyle = RT.col('--surface-2'); ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      /* barras de fase */
      ctx.fillStyle = RT.alpha('--cond-negro', 0.85); ctx.fillRect(bx + bw / 2 - 9, by + 10, 7, bh - 20);
      ctx.fillStyle = RT.alpha('--cond-rojo', 0.85); ctx.fillRect(bx + bw / 2 + 2, by + 10, 7, bh - 20);
      RT.text(ctx, 'totalizador 2P 60 A · fases A (negro) y B (rojo)', W / 2, by - 12, { size: 12, align: 'center', weight: 600 });
      slots.forEach((s, i) => {
        const y = by + 10 + i * rh;
        RT.text(ctx, s.fase, bx + bw / 2, y + rh / 2, { size: 11, align: 'center', baseline: 'middle', color: '--surface', weight: 700 });
        for (const lado of ['izq', 'der']) {
          const it = s[lado];
          const x = lado === 'izq' ? bx + 14 : bx + bw / 2 + 16, w = bw / 2 - 30;
          if (it && it.cont) continue;
          const hh = it && it.dos ? rh * 2 - 6 : rh - 6;
          ctx.fillStyle = RT.col(it ? '--surface' : '--surface-3'); ctx.fillRect(x, y + 3, w, hh); ctx.strokeStyle = RT.col('--ink-3'); ctx.lineWidth = 1; ctx.strokeRect(x, y + 3, w, hh);
          if (it) {
            RT.text(ctx, `${it.r.id} · ${it.r.prot.replace(' + diferencial 30 mA', ' + dif.')}`, x + 8, y + 3 + Math.min(hh, rh) / 2 - 6, { size: 12, weight: 700, baseline: 'middle' });
            RT.text(ctx, it.r.nombre.length > 28 ? it.r.nombre.slice(0, 27) + '…' : it.r.nombre, x + 8, y + 3 + Math.min(hh, rh) / 2 + 9, { size: 10.5, baseline: 'middle', color: '--ink-3' });
          } else RT.text(ctx, 'reserva', x + w / 2, y + rh / 2, { size: 11, align: 'center', baseline: 'middle', color: '--ink-3' });
        }
      });
      sim.set('A', f0(bal.A) + ' VA · ' + f1(bal.IA) + ' A');
      sim.set('B', f0(bal.B) + ' VA · ' + f1(bal.IB) + ' A');
      sim.set('IN', f1(bal.IN) + ' A');
      sim.set('d', C.fmt(100 * bal.desb, 1) + ' % ' + (bal.desb <= 0.1 ? '<span class="chip ok">bueno</span>' : bal.desb <= 0.2 ? '<span class="chip mid">aceptable</span>' : '<span class="chip bad">alto</span>'));
    });
  });
})();
