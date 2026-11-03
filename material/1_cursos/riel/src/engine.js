/* Motor físico del riel de aire.
   Unidades SI dentro del motor; los parámetros de la interfaz (P) vienen en g, cm, grados, mJ.
   Un modelo "ideal" (polea sin masa, sin roce, riel perfectamente nivelado, choques elásticos)
   corre en paralelo con el "real" para dibujar la curva teórica y mostrar de dónde sale la diferencia. */
(function (root) {
  'use strict';

  const C = {
    g: 9.775,          // g local en Popayán (2,4° N, 1760 m): 9,7804 − 3,086e-6·1760
    L: 2.00,           // longitud útil del riel (m)
    len: 0.22,         // longitud del carrito (m)
    bump: 0.010,       // espesor del amortiguador de cada extremo (m)
    Ip: 0.006,         // masa equivalente de la polea: I/r² = ½·12 g
    Fp: 0.0016,        // rozamiento del eje de la polea (N)
    cd: 0.0022,        // arrastre viscoso del colchón de aire (N·s/m para 0,2 kg)
    muK: 0.12,         // riel sin aire: carrito arrastrándose sobre el aluminio
    muS: 0.16,
    sigma: 0.0035,     // turbulencia del soplador (m/s²)
    tau: 0.15,         // correlación de la turbulencia (s)
    eWall: 0.88,       // rebote en los topes de los extremos
    dt: 0.0005,
    ts: 0.005,         // muestreo del registro (s)
    Tmax: 20,
    res: 1e-4          // resolución del cronómetro (s)
  };

  /* Controles de la interfaz. u = unidad visible, def = valor inicial. */
  const CTL = {
    m:    { et: 'Masa colgante', u: 'g', min: 5, max: 200, step: 1, def: 50, destacado: true },
    M1:   { et: 'Masa del carrito', u: 'g', min: 150, max: 500, step: 5, def: 200 },
    M2:   { et: 'Masa del carrito 2', u: 'g', min: 150, max: 500, step: 5, def: 200 },
    MA:   { et: 'Carrito de atrás', u: 'g', min: 150, max: 500, step: 5, def: 200 },
    MB:   { et: 'Carrito con la polea', u: 'g', min: 150, max: 500, step: 5, def: 200 },
    D:    { et: 'Altura de caída', u: 'cm', min: 30, max: 70, step: 1, def: 60 },
    th:   { et: 'Inclinación del riel', u: '°', min: 0, max: 6, step: 0.1, def: 2.5 },
    k:    { et: 'Constante de cada resorte', u: 'N/m', min: 1, max: 20, step: 0.5, def: 6 },
    A:    { et: 'Amplitud inicial', u: 'cm', min: 5, max: 40, step: 1, def: 20 },
    v0:   { et: 'Rapidez de lanzamiento', u: 'cm/s', min: 20, max: 150, step: 1, def: 60 },
    e:    { et: 'Elasticidad del choque', u: '', min: 0.5, max: 1, step: 0.01, def: 0.96 },
    E:    { et: 'Energía del resorte', u: 'mJ', min: 10, max: 200, step: 1, def: 60 },
    level:{ et: 'Tornillo de nivelación', u: '°', min: -0.3, max: 0.3, step: 0.01, def: 0.02 },
    flag: { et: 'Ancho de la bandera', u: 'cm', opciones: [2.5, 5, 10], def: 5 },
    g1:   { et: 'Fotocompuerta 1', u: 'cm', min: 10, max: 190, step: 1, def: 45, compuerta: true },
    g2:   { et: 'Fotocompuerta 2', u: 'cm', min: 10, max: 190, step: 1, def: 90, compuerta: true },
    blower:{ et: 'Soplador de aire', bool: true, def: true }
  };

  /* Cada montaje: lista de controles, posiciones de las fotocompuertas y texto de la guía. */
  const MONTAJES = [
    { id: 'newton', nombre: 'Segunda ley', sub: 'Carrito y masa colgante', n: 1, hanger: true,
      ctl: ['m', 'M1', 'D', 'level', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 35, g2: 68 },
      guia: 'Suelta el carrito y compara la aceleración medida con m·g/(M+m). Cambia la masa colgante y mira cómo se curva distinto la gráfica.' },
    { id: 'acoplados', nombre: 'Dos carritos', sub: 'Carritos unidos por un hilo', n: 2, hanger: true,
      ctl: ['m', 'MA', 'MB', 'D', 'level', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 65, g2: 100 },
      guia: 'La masa colgante arrastra al carrito de adelante y éste tira del de atrás. La tensión del hilo entre ambos es MA·a.' },
    { id: 'inclinado', nombre: 'Plano inclinado', sub: 'Riel con bloques bajo un extremo', n: 1, hanger: false,
      ctl: ['th', 'M1', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 55, g2: 130 },
      guia: 'Sin masa colgante, la aceleración es g·sen θ y no depende de la masa del carrito. Compruébalo cambiando M.' },
    { id: 'choque_el', nombre: 'Choque elástico', sub: 'Topes magnéticos', n: 2, hanger: false,
      ctl: ['M1', 'M2', 'v0', 'e', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 60, g2: 160 }, choque: true,
      guia: 'El carrito 1 sale lanzado y golpea al carrito 2, que está en reposo. Revisa si se conserva el ímpetu y la energía cinética.' },
    { id: 'choque_in', nombre: 'Choque inelástico', sub: 'Velcro: quedan pegados', n: 2, hanger: false,
      ctl: ['M1', 'M2', 'v0', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 60, g2: 160 }, choque: true, pegado: true,
      guia: 'Los carritos quedan pegados. El ímpetu se conserva, la energía cinética no: calcula cuánta se pierde.' },
    { id: 'explosion', nombre: 'Retroceso', sub: 'Resorte entre dos carritos', n: 2, hanger: false,
      ctl: ['M1', 'M2', 'E', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 55, g2: 145 }, explosion: true,
      guia: 'El resorte comprimido empuja a los carritos en sentidos opuestos. El ímpetu total sigue siendo cero; la energía del resorte se reparte.' },
    { id: 'oscilador', nombre: 'Oscilador', sub: 'Carrito entre dos resortes', n: 1, hanger: false,
      ctl: ['M1', 'k', 'A', 'flag', 'blower', 'g1', 'g2'], gates: { g1: 100, g2: 115 },
      guia: 'Mide el período con x(t) y compáralo con 2π√(M/2k). La fotocompuerta del centro da la rapidez máxima.' }
  ];

  function porDefecto(id) {
    const M = MONTAJES.find((q) => q.id === id), P = {};
    for (const k of M.ctl) P[k] = CTL[k].def;
    if (M.gates) { P.g1 = M.gates.g1; P.g2 = M.gates.g2; }
    return P;
  }

  function rng32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }

  /* Crea una simulación. o.ideal = modelo sin pérdidas. */
  function crear(id, Pin, o) {
    o = o || {};
    const M = MONTAJES.find((q) => q.id === id);
    const P = Object.assign(porDefecto(id), Pin);
    const ideal = !!o.ideal;
    const s = {
      id, M, P, ideal, t: 0, estado: 'listo', rand: rng32(o.seed || 7), nz: 0,
      g: [], links: [], hang: null, gates: [], eventos: [], col: null, expl: null, Tlink: [],
      kt: 0, xc: 0, Ip: ideal ? 0 : C.Ip, Fp: ideal ? 0 : C.Fp, eW: ideal ? 1 : C.eWall,
      e: ideal ? 1 : (P.e == null ? 1 : P.e),
      flag: (P.flag || 5) / 100, nextS: 0, T_h: 0,
      log: { t: [], x: [[], []], v: [[], []] }
    };
    const grados = id === 'inclinado' ? P.th : (ideal ? 0 : (P.level || 0));
    s.th = grados * Math.PI / 180;
    const half = C.len / 2 + C.bump;
    const mk = (x, Mi) => ({ x, v: 0, M: Mi, x0: x });
    if (id === 'newton') s.g.push(mk(0.14, P.M1 / 1000));
    else if (id === 'inclinado') s.g.push(mk(0.16, P.M1 / 1000));
    else if (id === 'oscilador') { s.xc = 1.0; s.kt = 2 * P.k; s.g.push(mk(1.0 + P.A / 100, P.M1 / 1000)); }
    else if (id === 'acoplados') {
      s.dist = 0.36; s.g.push(mk(0.13, P.MA / 1000)); s.g.push(mk(0.13 + s.dist, P.MB / 1000));
      s.links.push({ type: 'string', taut: true, dist: s.dist });
    } else if (M.choque) { s.g.push(mk(0.20, P.M1 / 1000)); s.g.push(mk(1.05, P.M2 / 1000)); s.links.push({ type: 'none' }); }
    else if (M.explosion) {
      s.g.push(mk(1.0 - half - 0.002, P.M1 / 1000)); s.g.push(mk(1.0 + half + 0.002, P.M2 / 1000));
      s.links.push({ type: 'none' });
    }
    for (const q of s.g) q.x0 = q.x;
    if (M.hanger) {
      const ult = s.g[s.g.length - 1];
      s.hang = { m: P.m / 1000, mode: 'taut', delta: 0, x0: ult.x, D: P.D / 100, tLand: null };
    }
    const claves = ['g1', 'g2'];
    for (const c of claves) if (P[c] != null && M.ctl.includes(c)) s.gates.push({ key: c, x: P[c] / 100, st: s.g.map(() => ({ blq: false, tin: 0 })), bloq: false });
    for (const gt of s.gates) s.g.forEach((q, i) => { gt.st[i].blq = Math.abs(q.x - gt.x) < s.flag / 2; });
    return s;
  }

  function rigido(l) { return l.type === 'stuck' || (l.type === 'string' && l.taut); }
  function grupos(s) {
    const n = s.g.length, cl = [];
    let i = 0;
    while (i < n) { let j = i; while (j < n - 1 && rigido(s.links[j])) j++; cl.push([i, j]); i = j + 1; }
    return cl;
  }
  function masaGrupo(s, a, b) { let m = 0; for (let k = a; k <= b; k++) m += s.g[k].M; return m; }
  function fijarV(s, a, b, v) { for (let k = a; k <= b; k++) s.g[k].v = v; }
  function mover(s, a, b, dx) { for (let k = a; k <= b; k++) s.g[k].x += dx; }

  function soltar(s) {
    if (s.estado !== 'listo') return;
    s.estado = 'corriendo';
    const P = s.P, M = s.M;
    if (M.choque) s.g[0].v = P.v0 / 100;
    if (M.explosion) {
      const m1 = s.g[0].M, m2 = s.g[1].M, E = P.E / 1000;
      const v1 = -Math.sqrt(2 * E * m2 / (m1 * (m1 + m2))), v2 = Math.sqrt(2 * E * m1 / (m2 * (m1 + m2)));
      s.g[0].v = v1; s.g[1].v = v2;
      s.expl = { t: 0, v1, v2, m1, m2, E };
    }
    muestrear(s);
  }

  function muestrear(s) {
    while (s.t >= s.nextS - 1e-12) {
      s.log.t.push(+s.nextS.toFixed(4));
      s.g.forEach((q, i) => { s.log.x[i].push(+q.x.toFixed(5)); s.log.v[i].push(+q.v.toFixed(5)); });
      s.nextS += C.ts;
    }
  }

  function cuant(dt) { const q = Math.round(dt / C.res) * C.res; return Math.max(C.res, q); }

  function paso(s, dt) {
    if (s.estado !== 'corriendo') return;
    const P = s.P, G = C.g, n = s.g.length;
    const sn = Math.sin(s.th), cs = Math.cos(s.th);
    const prev = s.g.map((q) => q.x);
    const cl = grupos(s);
    // turbulencia del soplador: proceso de Ornstein-Uhlenbeck
    if (!s.ideal && P.blower) s.nz += (-s.nz / C.tau) * dt + C.sigma * Math.sqrt(2 / C.tau) * gauss(s.rand) * Math.sqrt(dt);
    else s.nz = 0;
    const hang = s.hang;
    s.T_h = 0;
    s.Tlink = [];
    for (const [a, b] of cl) {
      const Mc = masaGrupo(s, a, b), v = s.g[a].v;
      let F = Mc * G * sn;
      if (s.id === 'oscilador') F += -s.kt * (s.g[a].x - s.xc);
      if (!s.ideal) F += Mc * s.nz;
      let Me = Mc, Fh = 0, pf = 0;
      const ultimo = b === n - 1;
      if (hang && ultimo && hang.mode === 'taut') { Me += hang.m + s.Ip; Fh = hang.m * G; pf = s.Fp; }
      const Fsin = F + Fh;                     // fuerzas sin roce
      let Ffb = 0, Ffp = 0, vn;                // roce del carrito y roce de la polea
      if (!s.ideal) {
        if (P.blower) { Ffb = -C.cd * (Mc / 0.2) * v; Ffp = -(Math.abs(v) > 1e-4 ? Math.sign(v) * pf : 0); }
        else {
          const N = Mc * G * cs;
          if (Math.abs(v) < 5e-4 && Math.abs(Fsin) <= C.muS * N + pf) { Ffb = -Fsin; }
          else { const sg = Math.sign(Math.abs(v) > 5e-4 ? v : Fsin); Ffb = -sg * C.muK * N; Ffp = -sg * pf; }
        }
      }
      const acc = (Fsin + Ffb + Ffp) / Me;
      vn = v + acc * dt;
      if (!s.ideal && !P.blower && v * vn < 0 && Math.abs(Fsin) <= C.muS * Mc * G * cs + pf) vn = 0;
      for (let k = a; k <= b; k++) { s.g[k].v = vn; s.g[k].x += vn * dt; }
      // tensión de los hilos entre carritos del mismo grupo
      const aext = (F + Ffb) / Mc;
      let acum = 0;
      for (let k = a; k < b; k++) {
        acum += s.g[k].M * (acc - aext);
        s.Tlink[k] = acum;
        if (s.links[k].type === 'string' && acum < -1e-6) s.links[k].taut = false;
      }
      if (hang && ultimo && hang.mode === 'taut') s.T_h = hang.m * (G - acc);
      s.acc = s.acc || []; s.acc[a] = acc; for (let k = a; k <= b; k++) s.acc[k] = acc;
    }
    s.t += dt;

    // masa colgante: aterrizaje y regreso del hilo
    if (hang) {
      const q = s.g[n - 1];
      hang.delta = q.x - hang.x0;
      if (hang.mode === 'taut' && hang.delta >= hang.D && q.v > 0) { hang.mode = 'landed'; hang.tLand = s.t; hang.delta = hang.D; }
      else if (hang.mode === 'landed' && q.x - hang.x0 <= hang.D && q.v < 0) {
        const cg = grupos(s).find(([a, b]) => b === n - 1), Mc = masaGrupo(s, cg[0], cg[1]);
        fijarV(s, cg[0], cg[1], Mc * q.v / (Mc + hang.m + s.Ip));
        hang.mode = 'taut';
      }
      if (hang.mode === 'landed') hang.delta = Math.min(hang.D, q.x - hang.x0 > hang.D ? hang.D : q.x - hang.x0);
    }

    // hilo entre carritos: se tensa de golpe si estaba flojo
    for (let k = 0; k < n - 1; k++) {
      const l = s.links[k];
      if (l.type === 'string' && !l.taut && s.g[k + 1].x - s.g[k].x >= l.dist && s.g[k + 1].v > s.g[k].v) {
        const A = grupos(s).find(([a, b]) => a <= k && k <= b), B = grupos(s).find(([a, b]) => a <= k + 1 && k + 1 <= b);
        const Ma = masaGrupo(s, A[0], A[1]), Mb = masaGrupo(s, B[0], B[1]);
        const vc = (Ma * s.g[k].v + Mb * s.g[k + 1].v) / (Ma + Mb);
        l.taut = true; fijarV(s, A[0], B[1], vc);
        const dx = s.g[k + 1].x - s.g[k].x - l.dist; mover(s, B[0], B[1], -dx / 2); mover(s, A[0], A[1], dx / 2);
      }
    }

    // topes de los extremos
    const half = C.len / 2 + C.bump;
    {
      const [a, b] = grupos(s)[0];
      if (s.g[0].x - half <= 0 && s.g[0].v < 0) { mover(s, a, b, half - (s.g[0].x)); fijarV(s, a, b, -s.eW * s.g[0].v); s.choqueTope = s.t; }
      const [c, d] = grupos(s)[grupos(s).length - 1];
      const ul = s.g[n - 1];
      if (ul.x + half >= C.L && ul.v > 0) { mover(s, c, d, C.L - half - ul.x); fijarV(s, c, d, -s.eW * ul.v); s.choqueTope = s.t; }
    }
    // choques entre carritos
    for (let k = 0; k < n - 1; k++) {
      const l = s.links[k];
      if (rigido(l)) continue;
      const hueco = s.g[k + 1].x - s.g[k].x - C.len - 2 * C.bump;
      if (hueco <= 0 && s.g[k].v > s.g[k + 1].v) {
        const A = grupos(s).find(([a, b]) => a <= k && k <= b), B = grupos(s).find(([a, b]) => a <= k + 1 && k + 1 <= b);
        const Ma = masaGrupo(s, A[0], A[1]), Mb = masaGrupo(s, B[0], B[1]);
        const va = s.g[k].v, vb = s.g[k + 1].v;
        const pegar = s.M.pegado;
        const e = pegar ? 0 : s.e;
        const va2 = (Ma * va + Mb * vb - Mb * e * (va - vb)) / (Ma + Mb);
        const vb2 = (Ma * va + Mb * vb + Ma * e * (va - vb)) / (Ma + Mb);
        fijarV(s, A[0], A[1], va2); fijarV(s, B[0], B[1], vb2);
        mover(s, A[0], A[1], hueco / 2); mover(s, B[0], B[1], -hueco / 2);
        if (!s.col) s.col = { t: s.t, ma: Ma, mb: Mb, va, vb, va2, vb2 };
        if (pegar) { l.type = 'stuck'; l.dist = s.g[k + 1].x - s.g[k].x; }
        s.choque = s.t;
      }
    }

    // fotocompuertas
    if (!s.ideal) {
      for (const gt of s.gates) {
        const hw = s.flag / 2;
        let alguna = false;
        s.g.forEach((q, i) => {
          const st = gt.st[i], was = Math.abs(prev[i] - gt.x) < hw, now = Math.abs(q.x - gt.x) < hw;
          if (!was && now) {
            const xb = prev[i] < gt.x ? gt.x - hw : gt.x + hw, fr = (xb - prev[i]) / (q.x - prev[i] || 1e-9);
            st.tin = s.t - dt + dt * fr; st.dir = prev[i] < gt.x ? 1 : -1; st.blq = true;
          } else if (was && !now) {
            const xb = q.x > gt.x ? gt.x + hw : gt.x - hw, fr = (xb - prev[i]) / (q.x - prev[i] || 1e-9);
            const tout = s.t - dt + dt * fr, d = cuant(tout - st.tin);
            s.eventos.push({ gate: gt.key, gi: s.gates.indexOf(gt), glider: i, tin: st.tin, tout, dt: d, v: st.dir * s.flag / d, x: gt.x });
            st.blq = false;
          }
          if (st.blq) alguna = true;
        });
        gt.bloq = alguna;
      }
    }
    muestrear(s);
    if (s.t >= C.Tmax) s.estado = 'fin';
  }

  function avanzar(s, T) {
    const N = Math.round(T / C.dt);
    for (let i = 0; i < N; i++) paso(s, C.dt);
  }

  /* Cantidades teóricas para mostrar en el panel. */
  function teoria(id, P) {
    const g = C.g, M1 = (P.M1 || P.MA || 0) / 1000;
    if (id === 'newton') { const m = P.m / 1000; return { aIdeal: m * g / (M1 + m), aPolea: m * g / (M1 + m + C.Ip), T: M1 * m * g / (M1 + m) }; }
    if (id === 'acoplados') { const m = P.m / 1000, MA = P.MA / 1000, MB = P.MB / 1000; return { aIdeal: m * g / (MA + MB + m), aPolea: m * g / (MA + MB + m + C.Ip), T: MA * m * g / (MA + MB + m) }; }
    if (id === 'inclinado') { const a = g * Math.sin(P.th * Math.PI / 180); return { aIdeal: a, aPolea: a }; }
    if (id === 'oscilador') { const w = Math.sqrt(2 * P.k / M1); return { w, T: 2 * Math.PI / w, vmax: w * P.A / 100 }; }
    return {};
  }

  const API = { C, CTL, MONTAJES, porDefecto, crear, soltar, paso, avanzar, teoria, grupos };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.RIEL = API;
})(typeof window !== 'undefined' ? window : globalThis);
