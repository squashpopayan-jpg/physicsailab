/* ===================================================================
   31-bb.js — Protoboard (EM.bb): geometría real en milímetros (paso 2,54 mm),
   conectividad por tiras y rieles, y conversión de una «escena» en redes eléctricas.
   Sin DOM: se prueba en Node.

   Nombres de agujero:  "e12" (fila e, columna 12)      filas a–e (mitad inferior) y f–j (mitad superior)
                        "T+7" / "T-7" / "B+7" / "B-7"   riel superior/inferior, positivo/negativo, posición 7
   Referencia completa: "bb:e12"  (protoboard «bb») o  "uno:D13" (pin de una placa).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const BB = (EM.bb = {});
  const P = (BB.PITCH = 2.54);

  /* Tipos de protoboard: columnas, agujeros por riel y tamaño (mm) */
  BB.KINDS = {
    mini: { cols: 17, rail: 0, w: 47.0, h: 35.0, name: 'Mini (170 puntos)' },
    half: { cols: 30, rail: 25, w: 83.0, h: 55.0, name: 'Media (400 puntos)' },
    full: { cols: 63, rail: 50, w: 165.5, h: 55.0, name: 'Completa (830 puntos)' }
  };
  const ROWS_TOP = ['j', 'i', 'h', 'g', 'f'], ROWS_BOT = ['e', 'd', 'c', 'b', 'a'];
  /* Ordenadas (mm desde el borde superior de la placa) */
  const Y = { 'T+': 3.6, 'T-': 6.14, j: 13.3, i: 15.84, h: 18.38, g: 20.92, f: 23.46, e: 31.08, d: 33.62, c: 36.16, b: 38.7, a: 41.24, 'B-': 48.9, 'B+': 51.44 };
  BB.ROW_Y = Y;

  BB.parse = function (h) {
    let m = /^([a-j])(\d+)$/.exec(h);
    if (m) return { kind: 'main', row: m[1], col: +m[2] };
    m = /^([TB])([+-])(\d+)$/.exec(h);
    if (m) return { kind: 'rail', side: m[1], pol: m[2], idx: +m[3] };
    return null;
  };
  BB.valid = (kind, h) => {
    const k = BB.KINDS[kind], p = BB.parse(h);
    if (!k || !p) return false;
    if (p.kind === 'main') return p.col >= 1 && p.col <= k.cols;
    return k.rail > 0 && p.idx >= 1 && p.idx <= k.rail;
  };
  /* Posición del agujero respecto de la esquina superior izquierda de la placa */
  BB.holePos = function (kind, h) {
    const k = BB.KINDS[kind], p = BB.parse(h);
    if (!p) throw new Error('agujero no válido: ' + h);
    if (p.kind === 'main') {
      const x0 = (k.w - (k.cols - 1) * P) / 2;
      return [x0 + (p.col - 1) * P, kind === 'mini' ? Y[p.row] - 6.14 + 6 : Y[p.row]];
    }
    const span = (k.rail - 1 + Math.floor((k.rail - 1) / 5)) * P;
    const x0 = (k.w - span) / 2;
    return [x0 + (p.idx - 1 + Math.floor((p.idx - 1) / 5)) * P, Y[p.side + p.pol]];
  };
  /* Clave de la tira conductora a la que pertenece un agujero */
  BB.strip = function (kind, h) {
    const p = BB.parse(h);
    if (p.kind === 'main') return (ROWS_TOP.includes(p.row) ? 'T' : 'B') + p.col;
    return 'R' + p.side + p.pol;
  };
  BB.allHoles = function (kind) {
    const k = BB.KINDS[kind], out = [];
    for (const r of [...ROWS_TOP, ...ROWS_BOT]) for (let c = 1; c <= k.cols; c++) out.push(r + c);
    if (k.rail) for (const s of ['T', 'B']) for (const pol of ['+', '-']) for (let i = 1; i <= k.rail; i++) out.push(s + pol + i);
    return out;
  };
  /* Agujero más cercano a un punto (mm relativos a la placa); null si está lejos */
  BB.nearest = function (kind, x, y, maxd = 2.2) {
    let best = null, bd = maxd * maxd;
    for (const h of BB.allHoles(kind)) {
      const [hx, hy] = BB.holePos(kind, h);
      const d = (hx - x) ** 2 + (hy - y) ** 2;
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  };

  /* ---------- Uniones: Union–Find ---------- */
  class UF {
    constructor() { this.p = new Map(); }
    find(a) {
      if (!this.p.has(a)) this.p.set(a, a);
      let r = a;
      while (this.p.get(r) !== r) r = this.p.get(r);
      while (this.p.get(a) !== r) { const n = this.p.get(a); this.p.set(a, r); a = n; }
      return r;
    }
    union(a, b) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.p.set(ra, rb); }
  }
  BB.UF = UF;

  /* Normaliza una escena escrita de forma abreviada:
     «e5» → «bb:e5» (protoboard única); «@D13» → «uno:D13» (primera placa); coloca las placas enchufadas. */
  BB.normalize = function (scene) {
    if (scene._norm) return scene;
    scene._norm = true;
    scene.boards = scene.boards || [];
    scene.parts = scene.parts || [];
    scene.wires = scene.wires || [];
    scene.mcus = scene.mcus || [];
    const b0 = scene.boards[0], m0 = scene.mcus[0];
    const fix = (r) => {
      if (!r || typeof r !== 'string') return r;
      if (r[0] === '#') return r;
      if (r[0] === '@' && m0) return m0.id + ':' + r.slice(1);
      if (r.indexOf(':') < 0 && b0) return b0.id + ':' + r;
      return r;
    };
    scene.parts.forEach((p) => { p.pins = (p.pins || []).map(fix); });
    scene.wires.forEach((w) => { w.a = fix(w.a); w.b = fix(w.b); });
    (scene.meters || []).forEach((m) => { m.red = fix(m.red); m.black = fix(m.black); });
    scene.wires.forEach((w, i) => { if (!w.id) w.id = 'w' + (i + 1); });
    for (const m of scene.mcus) {
      if (m.plug && EM.mcu) {
        const spec = EM.mcu.boards[m.kind];
        if (!m.plug.rows) m.plug.rows = spec.plugDefault;
        if (!m.plug.board && b0) m.plug.board = b0.id;
        const p0 = spec.pins.find((q) => q.row === 0 && q.idx === 0);
        const bd = BB.boardOf(scene, m.plug.board);
        const hp = BB.holePos(bd.kind, m.plug.rows[0] + m.plug.col);
        m.x = bd.x + hp[0] - p0.x; m.y = bd.y + hp[1] - p0.y; m.rot = 0;
      }
    }
    return scene;
  };

  /* ---------- Escena → redes ----------
     scene = { boards:[{id,kind,x,y}], mcus:[{id,kind,x,y,rot,plug?}], parts:[{id,type,pins:[ref,...],...}], wires:[{a,b,...}] } */
  BB.boardOf = (scene, id) => (scene.boards || []).find((b) => b.id === id);
  BB.keyOf = function (scene, ref) {
    if (ref[0] === '#') return ref; /* red con nombre (esquemas sin protoboard) */
    const i = ref.indexOf(':');
    if (i < 0) throw new Error('referencia sin placa: ' + ref);
    const id = ref.slice(0, i), h = ref.slice(i + 1);
    const b = BB.boardOf(scene, id);
    if (b) {
      if (!BB.valid(b.kind, h)) throw new Error('agujero fuera de la placa ' + id + ': ' + h);
      return id + ':' + BB.strip(b.kind, h);
    }
    return ref; /* pin de una placa o módulo */
  };
  /* Construye las redes: devuelve { net(ref) → nombre de red, groups, uf } */
  BB.nets = function (scene) {
    const uf = new UF();
    const keys = new Set();
    const add = (ref) => { const k = BB.keyOf(scene, ref); keys.add(k); uf.find(k); return k; };
    for (const w of scene.wires || []) {
      if (w.cut) continue;
      uf.union(add(w.a), add(w.b));
    }
    for (const p of scene.parts || []) for (const r of p.pins || []) if (r) add(r);
    /* placas conectadas directamente sobre la protoboard (modo «enchufada») */
    for (const m of scene.mcus || []) {
      if (m.plug) {
        const spec = EM.mcu && EM.mcu.boards[m.kind];
        if (spec) for (const [pin, hole] of Object.entries(BB.plugMap(scene, m))) uf.union(add(m.id + ':' + pin), add(hole));
      }
    }
    /* los pines del mismo nombre interno de una placa (p. ej. todos los GND) son la misma red */
    for (const m of scene.mcus || []) {
      const spec = EM.mcu && EM.mcu.boards[m.kind];
      if (!spec) continue;
      const tie = {};
      for (const pin of spec.pins) if (pin.net) { (tie[pin.net] = tie[pin.net] || []).push(pin.id); }
      for (const n in tie) { const k0 = add(m.id + ':' + tie[n][0]); for (const pid of tie[n]) uf.union(k0, add(m.id + ':' + pid)); }
    }
    return {
      uf,
      key: (ref) => add(ref),
      root: (ref) => uf.find(add(ref)),
      same: (a, b) => uf.find(add(a)) === uf.find(add(b))
    };
  };

  /* Pines de una placa enchufada en la protoboard: devuelve {pin: "bb:agujero"} */
  BB.plugMap = function (scene, m) {
    const spec = EM.mcu.boards[m.kind], out = {};
    const pl = m.plug; /* { board:'bb', col:5, rows:['i','b'] } */
    for (const pin of spec.pins) {
      if (pin.row === undefined) continue;
      out[pin.id] = pl.board + ':' + pl.rows[pin.row] + (pl.col + pin.idx);
    }
    return out;
  };

  /* Posición mundial (mm) de una referencia, para dibujar */
  BB.worldPos = function (scene, ref) {
    const i = ref.indexOf(':'), id = ref.slice(0, i), h = ref.slice(i + 1);
    const b = BB.boardOf(scene, id);
    if (b) { const [x, y] = BB.holePos(b.kind, h); return [b.x + x, b.y + y]; }
    const m = (scene.mcus || []).find((q) => q.id === id);
    if (m && EM.mcu) {
      const spec = EM.mcu.boards[m.kind], pin = spec.pins.find((q) => q.id === h);
      if (!pin) throw new Error('pin inexistente ' + ref);
      if (m.plug) { const pm = BB.plugMap(scene, m); return BB.worldPos(scene, pm[h]); }
      return EM.mcu.pinWorld(m, pin);
    }
    const mod = (scene.parts || []).find((q) => q.id === id);
    if (mod && mod.pinPos) return mod.pinPos[h];
    throw new Error('referencia desconocida ' + ref);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
