/* Capítulo 21 — Planta de tomacorrientes (E02) */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, G = L.G;
  const f0 = (v) => C.fmt(v, 0);
  RT.COLCIRC = { C1: '--l-ilum', C2: '--c1', C3: '--c3', C4: '--c4', C5: '--c2', C6: '--c5', C7: '--k2', C8: '--c6', C9: '--k5' };

  RT.defineSim('plano-e02', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '780px' });
    const plano = new RT.Plano(sim, cv, { capas: { tomas: true, esp: true, muebles: true, gfci: false } });
    plano.resaltar = (p) => RT.COLCIRC[p.c];
    sim.group('Vista');
    const ops = [['todos', 'Todos']].concat(K.electrico.circuitos.filter((c) => c.id !== 'C1').map((c) => [c.id, c.id]));
    sim.select('f', { label: 'Circuito', options: ops.map(([v, t]) => [v, v === 'todos' ? t : t + ' · ' + K.circuito(v).nombre]), value: 'todos', onInput: (v) => { plano.filtroCirc = v === 'todos' ? null : (c) => c === v; } });
    sim.check('gfci', { label: 'Zonas de 1,8 m (GFCI)', value: false, onInput: (v) => { plano.capas.gfci = v; } });
    sim.seg('lab', { label: 'Etiquetas', options: [['id', 'Código'], ['circ', 'Circuito']], value: 'id', onInput: (v) => { plano.capas.circ = v === 'circ'; } });
    sim.out('sel', 'Punto', { wide: true });
    sim.out('c', 'Circuito', { wide: true });
    plano.onPick = (h) => { sim.set('sel', h ? h.tip : '—'); };
    const ley = RT.el('div', 'leyenda');
    ley.innerHTML = K.electrico.circuitos.filter((c) => c.id !== 'C1').map((c) => `<span><b class="sw sq" style="display:inline-block;width:12px;height:12px;border-radius:2px;background:var(${RT.COLCIRC[c.id]})"></b>${c.id}</span>`).join('') + `<span>${RT.simboloSVG('p-toma', 22)}Toma doble</span><span>${RT.simboloSVG('p-ducha', 22)}Ducha</span><span>${RT.simboloSVG('p-estufa', 22)}Estufa 240 V</span>`;
    sim.stageCol.append(ley);
    sim.onDraw(() => {
      plano.draw();
      const v = sim.p.f;
      if (v === 'todos') sim.set('c', 'Seleccione un circuito para ver sus datos');
      else { const r = L.Q.cuadro(K).find((x) => x.id === v); sim.set('c', `${r.nombre}: ${r.pts.length} puntos, ${f0(r.va)} VA, ${r.prot}, ${r.awg} AWG, fase ${r.fase}`); }
      if (!plano.sel) sim.set('sel', 'Haga clic en un punto');
    });
  });

  RT.defineSim('revision-e02', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '760px' });
    let pts = K.electrico.puntos.map((p) => Object.assign({}, p));
    const casa = () => Object.assign({}, K, { electrico: Object.assign({}, K.electrico, { puntos: pts }) });
    const plano = new RT.Plano(sim, cv, { casa: casa(), capas: { tomas: true, esp: true, ilum: false, gfci: true, etiquetas: true } });
    plano.editable = true;
    plano.onDrag = (p, wx, wy) => {
      if (p.tipo !== 'toma' || p.ext) return;
      const amb = K.ambiente(p.amb), per = G.perimetro(K.libre(amb)), q = G.proyectar(per, [wx, wy]), pp = G.punto(per, q.s);
      p.x = pp[0]; p.y = pp[1];
    };
    sim.group('Diseño');
    sim.button('Volver al diseño del ejemplo', () => { pts = K.electrico.puntos.map((p) => Object.assign({}, p)); plano.casa = casa(); plano.invalidar(); });
    sim.note('Arrastre cualquier toma interior a lo largo de los muros de su ambiente.');
    sim.out('res', 'Resumen', { hl: true });
    sim.out('h', 'Hallazgos', { wide: true });
    sim.onDraw(() => {
      plano.casa = casa();
      plano.draw();
      const H = G.verificar(casa());
      const mal = H.filter((h) => h.estado !== 'ok');
      sim.set('res', `${H.length - mal.length} cumplen · ${mal.length} por revisar`);
      const orden = mal.concat(H.filter((h) => h.estado === 'ok'));
      sim.set('h', '<ul class="hallazgos">' + orden.map((h) => `<li>${RT.estadoChip(h.estado)}<span>${h.texto} <span class="ref">${h.ref}</span></span></li>`).join('') + '</ul>');
    });
  });
})();
