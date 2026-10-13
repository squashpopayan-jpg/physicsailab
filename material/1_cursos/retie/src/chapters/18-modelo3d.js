/* Capítulo 18 — El modelo 3D del espacio */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;
  const f2 = (v) => C.fmt(v, 2);

  /* Cantidades aproximadas del modelo (para comparar con el presupuesto) */
  function cantidades() {
    const H = K.H, F = K.t / 2;
    let muro = 0;
    const enViga = (m) => (m.a[0] === m.b[0] && K.ejes.x.includes(m.a[0])) || (m.a[1] === m.b[1] && K.ejes.y.includes(m.a[1]));
    for (const m of K.muros) {
      const top = enViga(m) ? H.fondoViga : H.fondoLosa, len = C.dist(m.a, m.b);
      let a = len * top;
      for (const v of m.vanos) a -= (v.d1 - v.d0) * Math.min(top, v.z1 - v.z0);
      muro += a;
    }
    const col = K.columnas().length * 0.3 * 0.3 * (H.topeLosa + H.cim + H.contrapiso);
    const vig = K.vigas(false).reduce((s, v) => s + (v.b - v.a) * 0.3 * (H.viga - H.losa), 0);
    const losa = (8 + 2 * F) * (10 + 2 * F) * H.losa;
    const cim = K.vigas(true).reduce((s, v) => s + (v.b - v.a) * 0.3 * 0.3, 0);
    return { muro, col, vig, losa, cim };
  }

  RT.defineSim('casa-3d', function (sim) {
    const v3 = new RT.Casa3D(sim, { aspect: 1.45, maxH: '720px' });
    sim.group('Escenas');
    sim.seg('esc', { options: [['general', 'General'], ['puntos', 'Puntos'], ['coordinacion', 'Coordinar'], ['planta', 'Planta']], value: 'general', onInput: (e) => escena(e) });
    sim.group('Etiquetas visibles');
    const capas = [['muros', 'A-MUROS', true], ['columnas', 'S-ESTRUCTURA: columnas', true], ['vigas', 'S-ESTRUCTURA: vigas', true], ['losa', 'S-ESTRUCTURA: losa', true], ['cim', 'Vigas de cimentación', false], ['puntos', 'E-PUNTOS', true], ['tubos', 'E-CANAL', false], ['inter', 'Interferencias', false], ['etiquetas', 'E-TEXTO (códigos)', false]];
    capas.forEach(([id, label, v]) => sim.check(id, { label, value: v }));
    sim.slider('corte', { label: 'Plano de corte horizontal', min: 0.3, max: 3.0, step: 0.05, value: 3.0, unit: 'm', fmt: f2 });
    const q = cantidades();
    sim.out('mu', 'Muro neto (sin vanos)');
    sim.out('co', 'Concreto en columnas');
    sim.out('vi', 'Concreto en vigas (bajo la losa)');
    sim.out('lo', 'Concreto en losa');
    sim.out('ci', 'Concreto en vigas de cimentación');
    sim.out('pu', 'Puntos eléctricos modelados', { hl: true });
    function escena(e) {
      const pre = {
        general: { muros: true, columnas: true, vigas: true, losa: true, cim: false, puntos: true, tubos: false, inter: false, etiquetas: false, corte: 3.0 },
        puntos: { muros: true, columnas: true, vigas: false, losa: false, cim: false, puntos: true, tubos: false, inter: false, etiquetas: true, corte: 2.4 },
        coordinacion: { muros: true, columnas: true, vigas: true, losa: true, cim: false, puntos: true, tubos: true, inter: true, etiquetas: false, corte: 3.0 },
        planta: { muros: true, columnas: true, vigas: false, losa: false, cim: false, puntos: true, tubos: false, inter: false, etiquetas: false, corte: 1.5 }
      }[e];
      for (const k in pre) if (sim.ctl[k]) sim.ctl[k].set(pre[k], true);
      v3.escena(e);
    }
    sim.onDraw(() => {
      if (!v3.ok) return;
      const vis = {};
      capas.forEach(([id]) => { vis[id] = sim.p[id]; });
      vis.piso = true;
      vis.corte = sim.p.corte >= 2.99 ? null : sim.p.corte;
      v3.aplicar(vis);
      v3.render();
      sim.set('mu', f2(q.muro) + ' m²');
      sim.set('co', f2(q.col) + ' m³');
      sim.set('vi', f2(q.vig) + ' m³');
      sim.set('lo', f2(q.losa) + ' m³');
      sim.set('ci', f2(q.cim) + ' m³');
      sim.set('pu', K.electrico.puntos.length + ' + tablero');
    });
  });

  RT.defineSim('fases-modelo', function (sim) {
    const v3 = new RT.Casa3D(sim, { aspect: 1.6, maxH: '620px' });
    const FASES = [
      { t: 'Plano importado y escalado', h: 'Archivo ▸ Importar (PNG o JPG) · Cinta métrica (T) sobre la cota de 8,00 m', tag: 'A-BASE', vis: { muros: false, columnas: false, vigas: false, losa: false, puntos: false, corte: 0.05 } },
      { t: 'Muros levantados', h: 'Línea (L), Rectángulo (R) y Empujar/Tirar (P) hasta 2,27 m o 2,50 m', tag: 'A-MUROS', vis: { muros: true, columnas: false, vigas: false, losa: false, puntos: false } },
      { t: 'Vanos de puertas y ventanas', h: 'Rectángulo sobre la cara del muro y Empujar/Tirar a través del espesor', tag: 'A-MUROS', vis: { muros: true, columnas: false, vigas: false, losa: false, puntos: false, corte: 2.6 } },
      { t: 'Columnas', h: 'Rectángulo de 0,30 × 0,30 m, Empujar/Tirar, Hacer grupo; copiar con Mover (M) + Ctrl', tag: 'S-ESTRUCTURA', vis: { muros: true, columnas: true, vigas: false, losa: false, puntos: false } },
      { t: 'Vigas descolgadas y losa', h: 'Grupos de 0,30 × 0,35 m sobre los ejes; losa de 0,12 m como otro grupo', tag: 'S-ESTRUCTURA', vis: { muros: true, columnas: true, vigas: true, losa: true, puntos: false } },
      { t: 'Puntos eléctricos como componentes', h: 'Crear componente (G) por tipo; insertar cada punto a su altura y rotularlo', tag: 'E-PUNTOS · E-TEXTO', vis: { muros: true, columnas: true, vigas: true, losa: false, puntos: true, etiquetas: true, corte: 2.45 } },
      { t: 'Recorrido de canalización', h: 'Trazar la ruta con Línea y aplicar Sígueme (Follow Me) a un círculo de 21 mm', tag: 'E-CANAL', vis: { muros: true, columnas: true, vigas: true, losa: true, puntos: true, tubos: true, inter: true } }
    ];
    sim.group('Fase');
    sim.slider('f', { label: 'Fase de modelado', min: 1, max: FASES.length, step: 1, value: 1, fmt: (v) => v + ' de ' + FASES.length });
    sim.out('t', 'Resultado', { wide: true });
    sim.out('h', 'Herramientas', { wide: true });
    sim.out('tag', 'Etiqueta', { hl: true });
    sim.onDraw(() => {
      if (!v3.ok) return;
      const F = FASES[Math.round(sim.p.f) - 1];
      v3.aplicar(Object.assign({ piso: true, corte: null, cim: false, tubos: false, inter: false, etiquetas: false }, F.vis));
      if (Math.round(sim.p.f) === 1) v3.escena('planta'); else if (sim._last !== 'g') v3.escena('general');
      sim._last = Math.round(sim.p.f) === 1 ? 'p' : 'g';
      v3.render();
      sim.set('t', `<b>${Math.round(sim.p.f)}. ${F.t}</b>`);
      sim.set('h', F.h);
      sim.set('tag', F.tag);
    });
  });
})();
