/* Capítulo 22 — Circuitos y canalizaciones (E03) */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, R = L.R, N = L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);
  const colSen = (s, c) => { const n = R.colorSenal(s, c); const v = N.COLOR_HEX[n]; return v && v.startsWith('--') ? RT.col(v) : v || '#888'; };

  RT.defineSim('arbol-c1', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, maxH: '640px' });
    sim.group('Circuito y señal');
    sim.select('c', { label: 'Circuito', options: K.electrico.circuitos.map((c) => [c.id, c.id + ' · ' + c.nombre]), value: 'C1', onInput: () => { opciones(); } });
    const selS = sim.select('s', { label: 'Señal', options: [['todas', 'Todas']], value: 'todas' });
    function opciones() {
      const c = K.circuito(sim.p.c), cond = R.conductores(c, K);
      const set = new Set(); Object.values(cond).forEach((l) => l.forEach((s) => set.add(s)));
      const ops = [['todas', 'Todas']].concat([...set].map((s) => [s, R.nombreSenal(s)]));
      selS.input.innerHTML = ''; ops.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; selS.input.append(o); });
      selS.set('todas', true);
      sim.ctl.s = selS;
    }
    opciones();
    sim.out('n', 'Tramos');
    sim.out('max', 'Tramo con más conductores', { hl: true });
    sim.out('sen', 'Recorrido de la señal', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const c = K.circuito(sim.p.c), cond = R.conductores(c, K);
      const hijos = {}; c.arbol.forEach(([u, v]) => (hijos[u] = hijos[u] || []).push(v));
      /* posiciones: profundidad en x, hojas en y */
      const pos = {}; let fila = 0; let maxD = 0;
      const dfs = (n, d) => { maxD = Math.max(maxD, d); const hs = hijos[n] || []; if (!hs.length) { pos[n] = [d, fila++]; return pos[n][1]; } const ys = hs.map((h) => dfs(h, d + 1)); pos[n] = [d, (Math.min(...ys) + Math.max(...ys)) / 2]; return pos[n][1]; };
      dfs('TG', 0);
      const X = (d) => 50 + (d * (W - 110)) / Math.max(1, maxD), Y = (r) => 26 + (r * (H - 52)) / Math.max(1, fila - 1);
      const sel = sim.p.s;
      let max = null;
      for (const [u, v] of c.arbol) {
        const l = cond[u + '>' + v], a = pos[u], b = pos[v];
        if (!max || l.length > max[1].length) max = [u + '–' + v, l];
        const on = sel === 'todas' || l.includes(sel);
        ctx.strokeStyle = RT.col(on ? '--l-canal' : '--rule-strong'); ctx.lineWidth = on ? 2.4 : 1.2;
        ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke();
        /* marcas por señal */
        const mx = (X(a[0]) + X(b[0])) / 2, my = (Y(a[1]) + Y(b[1])) / 2;
        l.forEach((s, i) => { const o = (i - (l.length - 1) / 2) * 7; ctx.fillStyle = colSen(s, c); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.rect(mx + o - 3, my - 7, 6, 14); ctx.fill(); ctx.stroke(); if (sel === s) { ctx.strokeStyle = RT.col('--accent'); ctx.lineWidth = 2; ctx.strokeRect(mx + o - 4, my - 8, 8, 16); } });
      }
      for (const n in pos) {
        const p = K.punto(n), [d, r] = pos[n];
        const t = n === 'TG' ? 'tablero' : { lum: 'luminaria', aplique: 'aplique', int: 'interruptor', int2: 'int. doble', conm: 'conmutable', toma: 'toma', ducha: 'ducha', estufa: 'estufa' }[p.tipo];
        ctx.fillStyle = RT.col(n === 'TG' ? '--accent-soft' : '--surface'); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1;
        const w = 58, h = 26;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(X(d) - w / 2, Y(r) - h / 2, w, h, 4); else ctx.rect(X(d) - w / 2, Y(r) - h / 2, w, h); ctx.fill(); ctx.stroke();
        RT.text(ctx, n, X(d), Y(r) - 3, { size: 11.5, align: 'center', weight: 700, mono: true });
        RT.text(ctx, t, X(d), Y(r) + 9, { size: 9.5, align: 'center', color: '--ink-3' });
      }
      sim.set('n', c.arbol.length);
      sim.set('max', max ? `${max[0]}: ${max[1].length} conductores (${max[1].map((s) => R.nombreSenal(s)).join(', ')})` : '—');
      if (sel === 'todas') sim.set('sen', 'Escoja una señal para resaltar su camino. Colores: fase negra o roja, neutro blanco, tierra verde, retornos amarillos, viajeros azules.');
      else { const tr = c.arbol.filter(([u, v]) => cond[u + '>' + v].includes(sel)).map(([u, v]) => u + '–' + v); sim.set('sen', `${R.nombreSenal(sel)} (${R.colorSenal(sel, c)}): ${tr.join(', ')}`); }
    });
  });

  RT.defineSim('plano-e03', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '780px' });
    const tramos = R.tramos(K);
    const plano = new RT.Plano(sim, cv, { capas: { ilum: true, tomas: true, esp: true, canal: true, marcas: true, muebles: false, etiquetas: false, estr: true } });
    plano.colorCirc = (c) => RT.COLCIRC[c] || '--l-canal';
    sim.group('Vista');
    sim.seg('niv', { label: 'Nivel', options: [['todos', 'Todos'], ['losa', 'Losa'], ['piso', 'Contrapiso']], value: 'todos', onInput: (v) => { plano.filtroCirc = v === 'todos' ? null : (c) => K.circuito(c).nivel === v; } });
    sim.check('marcas', { label: 'Marcas de conductores', value: true, onInput: (v) => { plano.capas.marcas = v; } });
    sim.check('et', { label: 'Códigos de los puntos', value: false, onInput: (v) => { plano.capas.etiquetas = v; } });
    sim.out('t', 'Tramo', { hl: true });
    sim.out('d', 'Recorrido', { wide: true });
    sim.out('cond', 'Conductores', { wide: true });
    sim.out('ll', 'Llenado del tubo');
    sim.out('tot', 'Tubería total');
    /* selección de tramos por cercanía a la curva dibujada */
    const curva = (t) => {
      const a = K.punto(t.u), b = K.punto(t.v), k = t.nivel === 'losa' ? 0.12 : 0;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, cx = mx - dy * k, cy = my + dx * k;
      const pts = []; for (let i = 0; i <= 20; i++) { const s = i / 20; pts.push([(1 - s) * (1 - s) * a.x + 2 * s * (1 - s) * cx + s * s * b.x, (1 - s) * (1 - s) * a.y + 2 * s * (1 - s) * cy + s * s * b.y]); }
      return pts;
    };
    const basePick = plano.pick.bind(plano);
    plano.pick = (px, py) => {
      const h = basePick(px, py);
      if (h && h.p) return h;
      const wx = plano.wx(px), wy = plano.wy(py);
      let best = null, bd = 0.15;
      for (const t of tramos) {
        if (plano.filtroCirc && !plano.filtroCirc(t.c)) continue;
        const pts = curva(t);
        for (let i = 0; i < pts.length - 1; i++) { const d = C.distSeg([wx, wy], pts[i], pts[i + 1]); if (d < bd) { bd = d; best = t; } }
      }
      return best ? { id: 'T' + best.c + best.u + best.v, tramo: best, tip: `<b>${best.c}</b> ${best.u}–${best.v}<br>${best.senales.length} conductores · tubo ${best.tubo} in` } : h;
    };
    const mostrar = (t) => {
      if (!t) { sim.set('t', 'Haga clic en un tramo'); sim.set('d', '—'); sim.set('cond', '—'); sim.set('ll', '—'); return; }
      const c = K.circuito(t.c);
      sim.set('t', `${t.c} · ${t.u} → ${t.v}`);
      const za = t.pts[0][2], zb = t.pts[3][2], zl = t.pts[1][2];
      sim.set('d', `${t.nivel === 'losa' ? 'Por la losa' : 'Por el contrapiso'}: ${za > zl ? 'baja' : 'sube'} ${f2(Math.abs(zl - za))} m en ${t.u}, ${f2(t.Lh)} m horizontales, ${zb > zl ? 'sube' : 'baja'} ${f2(Math.abs(zb - zl))} m en ${t.v}. Total ${f2(t.L)} m.`);
      sim.set('cond', t.senales.map((s) => `<span style="display:inline-block;width:10px;height:10px;border:1px solid var(--ink);background:${colSen(s, c)};margin-right:4px"></span>${R.nombreSenal(s)} ${R.calibre(s, c)} AWG`).join('<br>'));
      sim.set('ll', `${f1(t.llenado.pct)} % en PVC ${t.tubo} in (límite ${f0(100 * t.llenado.lim)} %)`);
    };
    plano.onPick = (h) => mostrar(h && h.tramo ? h.tramo : null);
    const tot = {};
    tramos.forEach((t) => { tot[t.tubo] = (tot[t.tubo] || 0) + t.L; });
    sim.onDraw(() => {
      plano.draw();
      sim.set('tot', Object.entries(tot).map(([d, l]) => `${f1(l)} m de ${d} in`).join(' · '));
      if (!plano.sel || !plano.sel.tramo) mostrar(null);
    });
  });
})();
