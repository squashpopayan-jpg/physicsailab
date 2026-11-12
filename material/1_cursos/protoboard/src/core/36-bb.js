/* ===================================================================
   36-bb.js — Protoboard (EM.bb): geometría real en milímetros (paso 2,54 mm), conectividad por
   tiras y rieles, huellas (patas) de cada tipo de pieza y catálogo de piezas del laboratorio.
   Sin DOM: se prueba en Node.

   Agujeros:  "e12" (fila e, columna 12)   filas a–e (mitad inferior) y f–j (mitad superior)
              "T+7" / "T-7" / "B+7" / "B-7"  riel superior/inferior, positivo/negativo, posición 7
   Referencia completa: "bb:e12" (placa «bb», agujero e12).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const PT = EM.parts, CAT = PT.CAT;
  const BB = (EM.bb = {});
  const P = (BB.PITCH = 2.54);

  /* ---------- Tipos de protoboard ---------- */
  BB.KINDS = {
    mini: { cols: 17, rail: 0, w: 47.0, h: 35.0, name: 'Mini (170 puntos)' },
    half: { cols: 30, rail: 25, w: 83.0, h: 55.0, name: 'Media (400 puntos)' },
    full: { cols: 63, rail: 50, w: 165.5, h: 55.0, name: 'Completa (830 puntos)' }
  };
  const ROWS_TOP = ['j', 'i', 'h', 'g', 'f'], ROWS_BOT = ['e', 'd', 'c', 'b', 'a'];
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
  const tabCache = {};
  BB.table = function (kind) {
    if (tabCache[kind]) return tabCache[kind];
    const t = BB.allHoles(kind).map((h) => { const [x, y] = BB.holePos(kind, h); return { h, x, y }; });
    return (tabCache[kind] = t);
  };

  /* ---------- Rotación de desplazamientos (90° en sentido horario en pantalla) ---------- */
  BB.rot = (dx, dy, rot) => {
    rot = ((rot % 4) + 4) % 4;
    for (let i = 0; i < rot; i++) { const t = dx; dx = -dy; dy = t; }
    return [dx, dy];
  };

  /* ---------- Huellas ---------- */
  const rowOffs = (n) => Array.from({ length: n }, (_, i) => [i * P, 0]);
  const dipOffs = (n) => { const h = n / 2, o = []; for (let k = 1; k <= n; k++) o.push(k <= h ? [(k - 1) * P, 0] : [(n - k) * P, -3 * P]); return o; };
  const letters = (ct, s) => { const tab = { NPN: 'CBE', PNP: 'CBE', DARL: 'CBE', NMOS: 'DGS', PMOS: 'DGS', JFN: 'DGS', JFP: 'DGS', SCR: 'AKG' }[ct]; return s.split('').map((ch) => tab.indexOf(ch)); };
  const to = (pkg, map, label) => ({ pkg, offs: rowOffs(map.length), map, label });
  const PINOUT = {
    BC547: ['to92', 'CBE'], BC557: ['to92', 'CBE'], '2N3904': ['to92', 'EBC'], '2N3906': ['to92', 'EBC'], '2N2222': ['to92', 'EBC'],
    TIP31: ['to220', 'BCE'], TIP32: ['to220', 'BCE'], TIP120: ['to220', 'BCE'],
    '2N7000': ['to92', 'SGD'], IRLZ44N: ['to220', 'GDS'], IRF540N: ['to220', 'GDS'], IRF9540: ['to220', 'GDS'], '2N5457': ['to92', 'DSG'], '2N5460': ['to92', 'DSG']
  };
  BB.PINOUT = PINOUT;

  /* ---------- Catálogo de piezas del laboratorio ----------
     key → { name, cat (bandeja), ct (tipo de EM.parts), preset, flex:{span,tether}  |  geo(P) → {pkg, offs, map} }
     Las piezas «flex» (axiales y radiales) tienen cada pata libre; las rígidas (circuitos integrados, transistores,
     pulsadores…) se mueven completas y sus patas quedan a paso de 2,54 mm. */
  const T = (BB.TYPES = {});
  const def = (key, o) => { o.key = key; T[key] = o; return o; };
  const flex = (span, extra) => Object.assign({ span }, extra);

  def('R', { name: 'Resistor', cat: 'Pasivos', ct: 'R', preset: { r: 1000 }, flex: flex(4) });
  def('POT', { name: 'Potenciómetro (trimmer)', cat: 'Pasivos', ct: 'POT', preset: { r: 10000 }, geo: () => to('trim', [0, 2, 1], 'A · cursor · B') });
  def('C', { name: 'Condensador cerámico', cat: 'Pasivos', ct: 'C', preset: { c: 1e-7, kind: 'ceramic', vmax: 50 }, flex: flex(2) });
  def('CF', { name: 'Condensador de poliéster', cat: 'Pasivos', ct: 'C', preset: { c: 1e-6, kind: 'film', vmax: 100 }, flex: flex(3) });
  def('CE', { name: 'Condensador electrolítico', cat: 'Pasivos', ct: 'C', preset: { c: 1e-4, kind: 'elec', vmax: 16 }, flex: flex(2) });
  def('L', { name: 'Inductor', cat: 'Pasivos', ct: 'L', preset: { l: 1e-2, kind: 'ferrite', imax: 0.5 }, flex: flex(4) });
  def('NTC', { name: 'Termistor NTC', cat: 'Pasivos', ct: 'NTC', preset: {}, flex: flex(2) });
  def('LDR', { name: 'Fotorresistencia (LDR)', cat: 'Pasivos', ct: 'LDR', preset: {}, flex: flex(2) });
  def('FUSE', { name: 'Fusible', cat: 'Pasivos', ct: 'FUSE', preset: { ir: 0.5 }, flex: flex(4) });
  def('BTN', { name: 'Pulsador (4 patas)', cat: 'Pasivos', ct: 'BTN4', preset: {}, geo: () => ({ pkg: 'btn', offs: [[0, 0], [2 * P, 0], [0, -3 * P], [2 * P, -3 * P]], map: [2, 3, 0, 1], label: 'pulsador 6×6' }) });
  def('SW', { name: 'Interruptor deslizante', cat: 'Pasivos', ct: 'SPDT', preset: { pos: 0 }, geo: () => to('slide', [1, 0, 2], 'A · COM · B') });
  def('RELAY', { name: 'Relé 5 V (SPDT)', cat: 'Cargas', ct: 'RELAY', preset: { vnom: 5, rc: 70 }, geo: () => ({ pkg: 'relay', offs: [[0, 0], [0, -3 * P], [5 * P, 0], [4 * P, -3 * P], [6 * P, -3 * P]], map: [0, 1, 2, 3, 4], label: 'bobina · COM · NA · NC' }) });

  def('D', { name: 'Diodo', cat: 'Diodos y LED', ct: 'D', preset: { model: '1N4007' }, flex: flex(4) });
  def('LED', { name: 'LED 5 mm', cat: 'Diodos y LED', ct: 'LED', preset: { color: 'rojo' }, flex: flex(1) });
  def('ZD', { name: 'Diodo Zener', cat: 'Diodos y LED', ct: 'ZD', preset: { vz: 5.1 }, flex: flex(4) });
  def('PD', { name: 'Fotodiodo', cat: 'Diodos y LED', ct: 'PD', preset: {}, flex: flex(2) });
  def('SOLAR', { name: 'Celda solar', cat: 'Diodos y LED', ct: 'SOLAR', preset: { kind: 'panel' }, flex: flex(2, { tether: true }) });
  def('BR', { name: 'Puente rectificador', cat: 'Diodos y LED', ct: 'BR', preset: { model: '1N4007' }, geo: () => to('bridge', [0, 2, 1, 3], '~ · + · ~ · −') });
  def('SEG7', { name: 'Display de 7 segmentos', cat: 'Diodos y LED', ct: 'SEG7', preset: {}, geo: () => ({ pkg: 'seg7', offs: dipOffs(10).map((o) => [o[0], o[1] ? -6 * P : 0]), map: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], label: 'e d K c DP · b a K f g' }) });

  def('NPN', { name: 'Transistor NPN', cat: 'Transistores', ct: 'NPN', preset: { model: 'BC547' }, geo: (p) => { const [pk, s] = PINOUT[p.p.model] || PINOUT.BC547; return to(pk, letters('NPN', s), s.split('').join(' · ')); } });
  def('PNP', { name: 'Transistor PNP', cat: 'Transistores', ct: 'PNP', preset: { model: 'BC557' }, geo: (p) => { const [pk, s] = PINOUT[p.p.model] || PINOUT.BC557; return to(pk, letters('PNP', s), s.split('').join(' · ')); } });
  def('DARL', { name: 'Darlington TIP120', cat: 'Transistores', ct: 'DARL', preset: {}, geo: () => to('to220', letters('DARL', 'BCE'), 'B · C · E') });
  def('NMOS', { name: 'MOSFET canal N', cat: 'Transistores', ct: 'NMOS', preset: { model: '2N7000' }, geo: (p) => { const [pk, s] = PINOUT[p.p.model] || PINOUT['2N7000']; return to(pk, letters('NMOS', s), s.split('').join(' · ')); } });
  def('PMOS', { name: 'MOSFET canal P', cat: 'Transistores', ct: 'PMOS', preset: { model: 'IRF9540' }, geo: (p) => { const [pk, s] = PINOUT[p.p.model] || PINOUT.IRF9540; return to(pk, letters('PMOS', s), s.split('').join(' · ')); } });
  def('JFN', { name: 'JFET canal N', cat: 'Transistores', ct: 'JFN', preset: { model: '2N5457' }, geo: () => to('to92', letters('JFN', 'DSG'), 'D · S · G') });
  def('SCR', { name: 'Tiristor (SCR)', cat: 'Transistores', ct: 'SCR', preset: {}, geo: () => to('to92', letters('SCR', 'KGA'), 'K · G · A') });
  def('OPTO', { name: 'Optoacoplador PC817', cat: 'Transistores', ct: 'OPTO', preset: {}, geo: () => ({ pkg: 'dip4', offs: dipOffs(4), map: [0, 1, 3, 2], label: 'A · K · E · C' }) });

  def('T555', { name: 'Temporizador 555', cat: 'Circuitos integrados', ct: 'T555', preset: {}, geo: () => ({ pkg: 'dip8', offs: dipOffs(8), map: [7, 1, 4, 0, 3, 2, 5, 6], label: 'GND TRIG OUT RES CTRL THR DIS VCC' }) });
  def('OA', { name: 'Amplificador operacional', cat: 'Circuitos integrados', ct: 'OA', preset: { model: 'LM741' }, geo: () => ({ pkg: 'dip8', offs: dipOffs(8), map: [-1, 1, 0, 4, -1, 2, 3, -1], label: 'NC IN− IN+ V− NC OUT V+ NC' }) });
  def('LM358', { name: 'LM358 (doble A.O.)', cat: 'Circuitos integrados', ct: 'LM358', preset: {}, geo: () => ({ pkg: 'dip8', offs: dipOffs(8), map: [0, 1, 2, 3, 4, 5, 6, 7], label: 'OUT1 IN1− IN1+ V− IN2+ IN2− OUT2 V+' }) });
  def('LM393', { name: 'LM393 (doble comparador)', cat: 'Circuitos integrados', ct: 'LM393', preset: {}, geo: () => ({ pkg: 'dip8', offs: dipOffs(8), map: [0, 1, 2, 3, 4, 5, 6, 7], label: 'OUT1 IN1− IN1+ GND IN2+ IN2− OUT2 VCC' }) });
  def('REG', {
    name: 'Regulador de tensión', cat: 'Circuitos integrados', ct: 'REG', preset: { model: '7805' },
    geo: (p) => {
      const m = p.p.model;
      if (m === 'LM317') return to('to220', [2, 1, 0], 'ADJ · OUT · IN');
      if (m === '7905') return to('to220', [2, 0, 1], 'GND · IN · OUT');
      return to('to220', [0, 2, 1], 'IN · GND · OUT');
    }
  });

  def('LAMP', { name: 'Bombillo', cat: 'Cargas', ct: 'LAMP', preset: { model: '6V' }, flex: flex(2, { tether: true }) });
  def('MOT', { name: 'Motor de CC', cat: 'Cargas', ct: 'MOT', preset: { vnom: 6 }, flex: flex(2, { tether: true }) });
  def('SPK', { name: 'Altavoz 8 Ω', cat: 'Cargas', ct: 'SPK', preset: {}, flex: flex(2, { tether: true }) });
  def('BUZA', { name: 'Zumbador activo 5 V', cat: 'Cargas', ct: 'BUZA', preset: {}, flex: flex(2, { tether: true }) });
  def('BATP', { name: 'Batería / pilas', cat: 'Cargas', ct: 'BATP', preset: { kind: 'alk9' }, flex: flex(2, { tether: true }) });

  /* Variantes de la bandeja (un clic coloca la pieza con ese valor) */
  BB.TRAY = [
    { k: 'R', label: 'Resistor', preset: { r: 330 } },
    { k: 'R', label: 'Resistor 1 kΩ', preset: { r: 1000 } },
    { k: 'R', label: 'Resistor 10 kΩ', preset: { r: 10000 } },
    { k: 'POT', label: 'Potenciómetro 10 kΩ' },
    { k: 'C', label: 'Cerámico 100 nF' },
    { k: 'CF', label: 'Poliéster 1 µF' },
    { k: 'CE', label: 'Electrolítico 100 µF' },
    { k: 'L', label: 'Inductor 10 mH' },
    { k: 'NTC', label: 'NTC 10 kΩ' },
    { k: 'LDR', label: 'LDR' },
    { k: 'FUSE', label: 'Fusible 0,5 A' },
    { k: 'BTN', label: 'Pulsador' },
    { k: 'SW', label: 'Interruptor' },
    { k: 'D', label: 'Diodo 1N4007', preset: { model: '1N4007' } },
    { k: 'D', label: 'Diodo 1N4148', preset: { model: '1N4148' } },
    { k: 'D', label: 'Schottky 1N5819', preset: { model: '1N5819' } },
    { k: 'LED', label: 'LED rojo', preset: { color: 'rojo' } },
    { k: 'LED', label: 'LED verde', preset: { color: 'verde' } },
    { k: 'LED', label: 'LED azul', preset: { color: 'azul' } },
    { k: 'LED', label: 'LED amarillo', preset: { color: 'amarillo' } },
    { k: 'LED', label: 'LED blanco', preset: { color: 'blanco' } },
    { k: 'ZD', label: 'Zener 5,1 V' },
    { k: 'PD', label: 'Fotodiodo' },
    { k: 'BR', label: 'Puente rectificador' },
    { k: 'SEG7', label: '7 segmentos' },
    { k: 'NPN', label: 'NPN BC547', preset: { model: 'BC547' } },
    { k: 'NPN', label: 'NPN 2N2222', preset: { model: '2N2222' } },
    { k: 'NPN', label: 'NPN 2N3904', preset: { model: '2N3904' } },
    { k: 'NPN', label: 'Potencia TIP31', preset: { model: 'TIP31' } },
    { k: 'PNP', label: 'PNP BC557', preset: { model: 'BC557' } },
    { k: 'PNP', label: 'PNP 2N3906', preset: { model: '2N3906' } },
    { k: 'DARL', label: 'Darlington TIP120' },
    { k: 'NMOS', label: 'MOSFET 2N7000', preset: { model: '2N7000' } },
    { k: 'NMOS', label: 'MOSFET IRLZ44N', preset: { model: 'IRLZ44N' } },
    { k: 'PMOS', label: 'MOSFET P IRF9540' },
    { k: 'JFN', label: 'JFET 2N5457' },
    { k: 'SCR', label: 'Tiristor SCR' },
    { k: 'OPTO', label: 'Optoacoplador' },
    { k: 'T555', label: '555' },
    { k: 'OA', label: 'LM741', preset: { model: 'LM741' } },
    { k: 'OA', label: 'TL081', preset: { model: 'TL081' } },
    { k: 'LM358', label: 'LM358' },
    { k: 'LM393', label: 'LM393' },
    { k: 'REG', label: 'Regulador 7805', preset: { model: '7805' } },
    { k: 'REG', label: 'Regulador 7812', preset: { model: '7812' } },
    { k: 'REG', label: 'LM317', preset: { model: 'LM317' } },
    { k: 'LAMP', label: 'Bombillo 6 V', preset: { model: '6V' } },
    { k: 'LAMP', label: 'Bombillo 3 V', preset: { model: '3V' } },
    { k: 'MOT', label: 'Motor 6 V' },
    { k: 'SPK', label: 'Altavoz' },
    { k: 'BUZA', label: 'Zumbador activo' },
    { k: 'RELAY', label: 'Relé 5 V' },
    { k: 'BATP', label: 'Batería 9 V', preset: { kind: 'alk9' } },
    { k: 'BATP', label: '2 pilas AA', preset: { kind: 'aa2' } },
    { k: 'BATP', label: '4 pilas AA', preset: { kind: 'aa4' } },
    { k: 'BATP', label: 'Cargador USB 5 V', preset: { kind: 'usb' } }
  ];
  BB.TRAY_CATS = ['Pasivos', 'Diodos y LED', 'Transistores', 'Circuitos integrados', 'Cargas'];

  /* ---------- Pieza nueva ---------- */
  BB.newPart = (key, id, preset) => {
    const t = T[key];
    if (!t) throw new Error('Tipo de pieza desconocido: ' + key);
    const c = CAT[t.ct];
    const Pp = { id, k: key, t: t.ct, rot: 0, flip: false, x: 0, y: 0, p: Object.assign({}, c.defaults, t.preset, preset || {}) };
    if (c.apply) { const keep = Object.assign({}, t.preset, preset || {}); c.apply(Pp); Object.assign(Pp.p, keep); }
    return Pp;
  };
  BB.isFlex = (Pp) => !!T[Pp.k].flex;
  BB.geoOf = (Pp) => { const t = T[Pp.k]; return t.geo ? t.geo(Pp) : null; };

  /* Posiciones de las patas en el mundo (mm):
     piezas «flex» → Pp.pos[i]; rígidas → Pp.at + huella girada. Devuelve {cat:[[x,y]...], pkg:[{x,y,cat}...]} */
  BB.pinsWorld = (Pp) => {
    const t = T[Pp.k], n = CAT[t.ct].pins.length;
    if (t.flex) return { cat: Pp.pos.map((q) => [q[0], q[1]]), pkg: Pp.pos.map((q, i) => ({ x: q[0], y: q[1], cat: i })) };
    const g = t.geo(Pp), cat = new Array(n).fill(null), pkg = [];
    g.offs.forEach((o, j) => {
      const [dx, dy] = BB.rot(o[0], o[1], Pp.rot);
      const q = [Pp.at[0] + dx, Pp.at[1] + dy], ci = g.map[j];
      pkg.push({ x: q[0], y: q[1], cat: ci });
      if (ci >= 0) cat[ci] = q;
    });
    return { cat, pkg, geo: g };
  };

  /* Agujero más cercano a (x,y) en una lista de placas [{id,kind,x,y}]; null si hay más de maxd mm */
  BB.holeAt = (boards, x, y, maxd = 1.3) => {
    let best = null, bd = maxd * maxd;
    for (const b of boards) {
      const k = BB.KINDS[b.kind];
      const lx = x - b.x, ly = y - b.y;
      if (lx < -3 || ly < -3 || lx > k.w + 3 || ly > k.h + 3) continue;
      for (const q of BB.table(b.kind)) {
        const d = (q.x - lx) ** 2 + (q.y - ly) ** 2;
        if (d < bd) { bd = d; best = { ref: b.id + ':' + q.h, board: b, hole: q.h, x: b.x + q.x, y: b.y + q.y, d: Math.sqrt(d) }; }
      }
    }
    return best;
  };
  BB.holeWorld = (boards, ref) => {
    const i = ref.indexOf(':'), id = ref.slice(0, i), h = ref.slice(i + 1);
    const b = boards.find((q) => q.id === id);
    if (!b) throw new Error('Placa desconocida: ' + ref);
    if (!BB.valid(b.kind, h)) throw new Error('Agujero fuera de la placa ' + id + ': ' + h);
    const [x, y] = BB.holePos(b.kind, h);
    return [b.x + x, b.y + y];
  };
  BB.stripKey = (boards, ref) => {
    const i = ref.indexOf(':'), id = ref.slice(0, i), h = ref.slice(i + 1);
    const b = boards.find((q) => q.id === id);
    return id + ':' + BB.strip(b.kind, h);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
