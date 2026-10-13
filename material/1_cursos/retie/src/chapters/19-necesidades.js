/* Capítulo 19 — Necesidades eléctricas por ambiente */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, G = L.G;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);

  RT.defineSim('tomas-perimetro', function (sim) {
    const cv = sim.canvas({ aspect: 1.2, maxH: '640px' });
    const ROOMS = { sala: 'Sala-comedor', alc2: 'Alcoba 2', alc1: 'Alcoba principal', cocina: 'Cocina (paredes sin mesón)' };
    let tomas = [];
    const cargar = (id) => { tomas = K.electrico.puntos.filter((p) => p.amb === id && p.tipo === 'toma' && !p.meson).map((p) => ({ id: p.id, x: p.x, y: p.y })); };
    sim.group('Ambiente');
    sim.select('a', { options: Object.keys(ROOMS).map((k) => [k, ROOMS[k]]), value: 'sala', onInput: (k) => { cargar(k); ajustar(); } });
    sim.group('Tomas');
    sim.button('Agregar toma en el peor punto', () => { const r = calc(); const e = r.espacios.filter((x) => x.req && !x.ok).sort((a, b) => b.peor - a.peor)[0] || r.espacios.filter((x) => x.req).sort((a, b) => b.peor - a.peor)[0]; if (!e) return; const p = G.punto(r.per, e.peorS); tomas.push({ id: 'N' + (tomas.length + 1), x: p[0], y: p[1] }); });
    sim.button('Quitar la última', () => { tomas.pop(); });
    sim.button('Sugerir mínimo', () => {
      const r = calc(); tomas = [];
      r.espacios.forEach((e) => { if (!e.req) return; const n = Math.max(1, Math.ceil((e.L - 1e-9) / 3.6)); const paso = e.L / n; for (let k = 0; k < n; k++) { const p = G.punto(r.per, e.s0 + paso * (k + 0.5)); tomas.push({ id: 'N' + (tomas.length + 1), x: p[0], y: p[1] }); } });
    }, { newRow: true });
    sim.button('Volver al diseño del ejemplo', () => cargar(sim.p.a));
    sim.out('n', 'Tomas');
    sim.out('esp', 'Espacios de pared');
    sim.out('peor', 'Peor distancia a una toma', { hl: true });
    sim.out('r', 'Resultado', { wide: true });
    const plano = new RT.Plano(sim, cv, { capas: { tomas: false, ilum: false, etiquetas: false, muebles: true } });
    const amb = () => K.ambiente(sim.p.a);
    const calc = () => G.tomasPerimetro(K, amb(), tomas);
    const ajustar = () => { const r = K.libre(amb()); plano.bounds = [r[0] - 0.7, r[1] - 0.7, r[2] + 0.7, r[3] + 0.7]; plano.zoom = 1; plano.panX = 0; plano.panY = 0; };
    cargar('sala'); ajustar();
    plano.editable = true;
    plano.pick = (px, py) => { const t = tomas.find((q) => Math.hypot(plano.X(q.x) - px, plano.Y(q.y) - py) < 16); return t ? { id: t.id, p: t, tip: t.id } : null; };
    plano.onDrag = (t, wx, wy) => { const r = calc(), q = G.proyectar(r.per, [wx, wy]), p = G.punto(r.per, q.s); t.x = p[0]; t.y = p[1]; };
    plano.extra = (ctx, pl) => {
      const r = calc();
      ctx.save(); ctx.lineCap = 'round';
      for (const e of r.espacios) {
        for (let s = e.s0; s < e.s1; s += 0.05) {
          const a = G.punto(r.per, s), b = G.punto(r.per, Math.min(e.s1, s + 0.05));
          const d = e.tomas.length ? Math.min(...e.tomas.map((o) => Math.abs(o.s - s))) : Infinity;
          ctx.strokeStyle = RT.col(!e.req ? '--ink-3' : d <= 1.8 ? '--ok' : '--bad'); ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(pl.X(a[0]), pl.Y(a[1])); ctx.lineTo(pl.X(b[0]), pl.Y(b[1])); ctx.stroke();
        }
      }
      for (const t of tomas) {
        RT.simbolo(ctx, 'p-toma', pl.X(t.x), pl.Y(t.y), Math.max(9, 0.15 * pl.s), { color: '--l-toma', bg: '--canvas' });
        RT.text(ctx, t.id, pl.X(t.x) + 12, pl.Y(t.y) - 12, { size: 11, color: '--ink-2', halo: true, mono: true });
      }
      ctx.restore();
    };
    sim.onDraw(() => {
      plano.draw();
      const r = calc(), req = r.espacios.filter((e) => e.req);
      const peor = Math.max(0, ...req.map((e) => e.peor));
      sim.set('n', tomas.length);
      sim.set('esp', r.espacios.length + ' (' + r.espacios.map((e) => f2(e.L) + ' m').join(', ') + ')');
      sim.set('peor', isFinite(peor) ? f2(peor) + ' m' : 'hay un espacio sin toma');
      sim.set('r', r.ok ? '<span class="chip ok">Cumple</span> ningún punto a más de 1,8 m (NTC 2050, 210.52(A)).' : '<span class="chip bad">No cumple</span> hay tramos en rojo: agregue o mueva tomas.');
    });
  });

  RT.defineSim('meson', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    const base = K.electrico.puntos.filter((p) => p.meson).map((p) => Object.assign({}, p));
    let tomas = base.map((p) => Object.assign({}, p));
    sim.group('Tomas del mesón');
    sim.button('Quitar la última', () => { tomas.pop(); });
    sim.button('Agregar una', () => { const t = Object.assign({}, base[0], { id: 'TM' + (tomas.length + 1), x: 0.075, y: 6.9 }); tomas.push(t); });
    sim.button('Volver al ejemplo', () => { tomas = base.map((p) => Object.assign({}, p)); }, { newRow: true });
    sim.out('L', 'Longitud de mesón');
    sim.out('n', 'Tomas');
    sim.out('r', 'Resultado', { wide: true, hl: true });
    const casa = () => Object.assign({}, K, { electrico: Object.assign({}, K.electrico, { puntos: K.electrico.puntos.filter((p) => !p.meson).concat(tomas) }) });
    const plano = new RT.Plano(sim, cv, { bounds: [-0.4, 5.4, 4.9, 8.4], capas: { tomas: false, ilum: false, nombres: false, etiquetas: false, ejes: false } });
    plano.editable = true;
    plano.pick = (px, py) => { const t = tomas.find((q) => Math.hypot(plano.X(q.x) - px, plano.Y(q.y) - py) < 16); return t ? { id: t.id, p: t, tip: t.id } : null; };
    plano.onDrag = (t, wx, wy) => { const amb = K.ambiente('cocina'), per = G.perimetro(K.libre(amb)), q = G.proyectar(per, [wx, wy]), p = G.punto(per, q.s); t.x = p[0]; t.y = p[1]; };
    plano.extra = (ctx, pl) => {
      const m = G.meson(casa());
      ctx.save(); ctx.lineCap = 'round';
      for (const [a, b] of m.lineas) {
        for (let s = a; s < b; s += 0.025) {
          const p = G.punto(m.per, s), q = G.punto(m.per, Math.min(b, s + 0.025));
          const ex = m.excluidos.some((e) => s >= e.s0 && s <= e.s1);
          const d = m.tomas.length ? Math.min(...m.tomas.map((t) => Math.abs(t.s - s))) : Infinity;
          ctx.strokeStyle = RT.col(ex ? '--ink-3' : d <= 0.6 ? '--ok' : '--bad'); ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(pl.X(p[0]), pl.Y(p[1])); ctx.lineTo(pl.X(q[0]), pl.Y(q[1])); ctx.stroke();
        }
      }
      for (const t of tomas) {
        RT.simbolo(ctx, 'p-toma', pl.X(t.x), pl.Y(t.y), Math.max(9, 0.13 * pl.s), { color: '--l-toma', bg: '--canvas' });
        ctx.beginPath(); ctx.arc(pl.X(t.x), pl.Y(t.y), 0.6 * pl.s, 0, 7); ctx.strokeStyle = RT.alpha('--l-toma', 0.35); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        RT.text(ctx, t.id, pl.X(t.x) + 12, pl.Y(t.y) - 12, { size: 11, color: '--ink-2', halo: true, mono: true });
      }
      ctx.restore();
    };
    sim.onDraw(() => {
      plano.draw();
      const m = G.meson(casa());
      const Lm = m.lineas.reduce((s, [a, b]) => s + b - a, 0);
      sim.set('L', f2(Lm) + ' m');
      sim.set('n', tomas.length);
      const malos = m.tramos.filter((t) => !t.ok);
      sim.set('r', m.ok ? '<span class="chip ok">Cumple</span> todo el mesón a menos de 600 mm de una toma; gris: detrás de estufa y lavaplatos.' : `<span class="chip bad">No cumple</span> ${malos.length} tramo(s) con puntos a ${f2(Math.max(...malos.map((t) => t.peor)))} m.`);
    });
  });

  /* Inventario por ambiente desde el modelo */
  RT.CSV = RT.CSV || {};
  RT.CSV.inventario = function () {
    const f = RT.inventario();
    return '﻿' + ['Ambiente;Área libre (m²);Luminarias;Interruptores;Tomas generales;Tomas con GFCI;Salidas especiales;Carga (VA);Circuitos'].concat(f.map((r) => [r.n, r.area ? C.fmt(r.area, 2) : '', r.lum, r.int, r.tg, r.tf, r.esp, Math.round(r.va), r.circ].join(';'))).join('\r\n');
  };
  RT.inventario = function () {
    const out = [];
    const ambs = K.ambientes.map((a) => [a.id, a.nombre]).concat([['exterior', 'Exterior']]);
    for (const [id, n] of ambs) {
      const pts = K.electrico.puntos.filter((p) => p.amb === id);
      const c = (f) => pts.filter(f).length;
      const va = pts.reduce((s, p) => s + L.Q.cargaPunto(p), 0);
      out.push({ id, n, lum: c((p) => p.tipo === 'lum' || p.tipo === 'aplique'), int: c((p) => ['int', 'int2', 'conm'].includes(p.tipo)), tg: c((p) => p.tipo === 'toma' && !p.gfci && !p.gfciCarga), tf: c((p) => p.tipo === 'toma' && (p.gfci || p.gfciCarga)), esp: c((p) => p.tipo === 'ducha' || p.tipo === 'estufa'), va, circ: [...new Set(pts.map((p) => p.c))].join(', '), area: id === 'exterior' ? null : K.areaLibre(K.ambiente(id)) });
    }
    return out;
  };
  RT.defineSim('inventario', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Totales');
    sim.out('p', 'Puntos', { hl: true });
    sim.out('va', 'Carga conectada por puntos');
    sim.note('Tomas generales a 180 VA; luminarias y salidas especiales por su potencia. Los circuitos de cocina y ropas se cargan con 1 500 VA en el cuadro de cargas (capítulo 24).');
    RT.botonDescarga(sim.ctrlBox, 'Descargar inventario (CSV)', () => ['inventario-puntos-cargas.csv', RT.CSV.inventario(), 'text/csv']);
    sim.onDraw(() => {
      const f = RT.inventario();
      const tot = f.reduce((a, r) => ({ lum: a.lum + r.lum, int: a.int + r.int, tg: a.tg + r.tg, tf: a.tf + r.tf, esp: a.esp + r.esp, va: a.va + r.va }), { lum: 0, int: 0, tg: 0, tf: 0, esp: 0, va: 0 });
      box.innerHTML = '<table class="sim-tab cuadro" style="width:100%"><thead><tr><th>Ambiente</th><th class="num">Área</th><th class="num">Lum.</th><th class="num">Int.</th><th class="num">Tomas</th><th class="num">GFCI</th><th class="num">Esp.</th><th class="num">VA</th><th>Circuitos</th></tr></thead><tbody>' +
        f.map((r) => `<tr><td>${r.n}</td><td class="num">${r.area ? f2(r.area) : '—'}</td><td class="num">${r.lum}</td><td class="num">${r.int}</td><td class="num">${r.tg}</td><td class="num">${r.tf}</td><td class="num">${r.esp}</td><td class="num">${f0(r.va)}</td><td>${r.circ}</td></tr>`).join('') +
        `<tr class="tot"><td>Total</td><td class="num"></td><td class="num">${tot.lum}</td><td class="num">${tot.int}</td><td class="num">${tot.tg}</td><td class="num">${tot.tf}</td><td class="num">${tot.esp}</td><td class="num">${f0(tot.va)}</td><td></td></tr></tbody></table>`;
      sim.set('p', K.electrico.puntos.length);
      sim.set('va', f0(tot.va) + ' VA');
    });
  });
})();
