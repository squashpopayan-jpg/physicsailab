/* Banco virtual: dibujo del equipo, lupas de lectura, mandos, bitácora y bucle de simulación. */
const BENCH = (function () {
  'use strict';
  const V = VENTURI, E = V.EQUIPO, N = E.tomas.length;
  const $ = (id) => document.getElementById(id);
  const coma = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- geometría del dibujo (coordenadas del mundo: 1200 × 800) ---------- */
  const W = 1200, H = 770, MESA = 650, EJE = 590;
  const XMM0 = -14, XMM1 = 140, VX0 = 330, VX1 = 760, VS = (VX1 - VX0) / (XMM1 - XMM0);
  const vx = (xmm) => VX0 + (xmm - XMM0) * VS;
  const BLOQ = 19.5;                                   // semialtura del bloque de acrílico [mm]
  const TAB = { x0: 345, x1: 745, y0: 22, y1: 488 };
  const tuboX = (i) => 396 + i * (694 - 396) / (N - 1);
  const mmY = (mm) => 452 - (mm - E.escala.tuboMin) * (390 / (E.escala.tuboMax - E.escala.tuboMin));
  const NIP = EJE - BLOQ * VS - 14, CONEX = 468;     // boquilla de la toma y conexión al tubo
  const ROT = { x: 870, y0: 568, y1: 178 };
  const rotY = (mm) => ROT.y0 - mm * (ROT.y0 - ROT.y1) / E.rot.largo;
  const TQ = { x0: 955, x1: 1118, y0: 340, y1: MESA, g: 1140, boq: 1036 };
  const tqY = (L) => MESA - 9 - L * 7;
  const SW = { x: 130, y: 702 }, VOL = { x: 258, y: EJE, r: 30 }, UNI = { x: 801, y: EJE }, DREN = { x: 1036, y: 702 };
  const RELOJ = { x: 170, y: 300, r: 62 };

  function diam(xmm) {
    const c = E.contorno;
    if (xmm <= c[0][0]) return c[0][1];
    for (let k = 1; k < c.length; k++) if (xmm <= c[k][0]) { const [x0, d0] = c[k - 1], [x1, d1] = c[k]; return d0 + (d1 - d0) * (xmm - x0) / (x1 - x0); }
    return c[c.length - 1][1];
  }
  function bez(p, t) {
    const u = 1 - t;
    return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]];
  }
  const manguera = (i) => { const tx = vx(E.tomas[i].x), ux = tuboX(i); return [[tx, NIP], [tx, NIP - 26], [ux, CONEX + 26], [ux, CONEX]]; };

  /* ---------- estado de la interfaz ---------- */
  let sim = null, nBanco = 1, L = null, cb = {};
  let tubo = 0, ojoM = E.hEstatica, lupa2 = 'rot', ojoR = V.mmRot(4), ojoT = 30;
  const log = [];
  let t0Reloj = Date.now();
  const particulas = [], gotas = [], salientes = [];
  let charco = 0, golpe = { i: -1, t: 0 }, prevVivas = null;
  let colores = {};
  let valvTimer = null, hover = null, arrastre = null;

  function leerColores() {
    const cs = getComputedStyle(document.documentElement), g = (k) => cs.getPropertyValue(k).trim();
    colores = {
      wall: g('--wall'), wall2: g('--wall-2'), cab: g('--cab'), cab2: g('--cab-2'), top: g('--worktop'), pipe: g('--pipe'), pipe2: g('--pipe-2'),
      steel: g('--steel'), brass: g('--brass'), water: g('--water'), water2: g('--water-2'), acrylic: g('--acrylic'), board: g('--board'),
      bink: g('--board-ink'), bline: g('--board-line'), hose: g('--hose'), lcd: g('--lcd'), lcdInk: g('--lcd-ink'), accent: g('--accent'),
      danger: g('--danger'), ok: g('--ok'), ink: g('--ink'), sub: g('--sub'), wheel: g('--wheel'), glass: g('--glass'),
      display: g('--display') || 'sans-serif', mono: g('--mono') || 'monospace', body: g('--body') || 'sans-serif',
    };
  }

  /* ---------- bitácora ---------- */
  const relojTxt = (d) => d.toTimeString().slice(0, 8);
  const tSesion = () => { const s = Math.floor((Date.now() - t0Reloj) / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function anotar(msg, tipo) {
    const e = { reloj: relojTxt(new Date()), t: tSesion(), msg, tipo: tipo || 'accion' };
    log.push(e); if (log.length > 400) log.shift();
    pintarLog(); if (cb.onChange) cb.onChange();
  }
  function pintarLog() {
    const ul = $('logList'); if (!ul) return;
    ul.textContent = '';
    if (!log.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Aquí quedan registradas sus acciones sobre el banco, con la hora.'; ul.append(li); return; }
    log.slice().reverse().slice(0, 80).forEach((e) => {
      const li = document.createElement('li'); li.className = 'log-' + e.tipo;
      const t = document.createElement('time'); t.textContent = e.reloj; li.append(t, document.createTextNode(' ' + e.msg)); ul.append(li);
    });
  }

  function vueltasTxt(v) {
    const k = Math.round(v * 32);
    if (k <= 0) return 'cerrada';
    if (k >= E.valvula.vueltas * 32) return `abierta del todo (${E.valvula.vueltas} vueltas)`;
    const ent = Math.floor(k / 32); let a = k % 32, b = 32;
    while (a && a % 2 === 0) { a /= 2; b /= 2; }
    const fr = a ? `${a}/${b}` : '';
    const txt = ent ? ent + (fr ? ' ' + fr : '') : fr;
    return txt + (k === 32 ? ' vuelta' : ' vueltas');
  }

  /* ---------- dibujo del banco ---------- */
  let cv, ctx, esc = 1;
  function tamCanvas() {
    const w = cv.parentElement.clientWidth, dpr = window.devicePixelRatio || 1;
    esc = w / W;
    cv.style.width = w + 'px'; cv.style.height = (w * H / W) + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
    ctx.setTransform(esc * dpr, 0, 0, esc * dpr, 0, 0);
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  function tubo3d(c, pts, ancho, col, col2) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = col2; c.lineWidth = ancho + 3; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    c.strokeStyle = col; c.lineWidth = ancho; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1.5, ancho * 0.18);
    c.beginPath(); pts.forEach((p, k) => { const q = [p[0] - ancho * 0.18, p[1] - ancho * 0.18]; k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
  }
  function texto(c, s, x, y, o) {
    const p = o || {};
    c.font = `${p.peso || 600} ${p.tam || 14}px ${p.fam || colores.body}`;
    c.fillStyle = p.col || colores.ink; c.textAlign = p.al || 'left'; c.textBaseline = p.base || 'alphabetic';
    if (p.esp && 'letterSpacing' in c) c.letterSpacing = p.esp + 'px';
    c.fillText(s, x, y);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  }

  function dibujar(ahora) {
    const c = ctx, C = colores;
    c.clearRect(0, 0, W, H);
    // pared
    const gw = c.createLinearGradient(0, 0, 0, MESA); gw.addColorStop(0, C.wall); gw.addColorStop(1, C.wall2);
    c.fillStyle = gw; c.fillRect(0, 0, W, MESA);
    dibujarEstacion(c); dibujarReloj(c);
    // mueble del banco
    const gc = c.createLinearGradient(0, MESA, 0, H); gc.addColorStop(0, C.cab); gc.addColorStop(1, C.cab2);
    c.fillStyle = gc; c.fillRect(24, MESA, W - 48, H - MESA - 8);
    c.fillStyle = C.top; c.fillRect(18, MESA - 2, W - 36, 14);
    c.fillStyle = C.cab2; c.fillRect(40, H - 10, 40, 10); c.fillRect(W - 80, H - 10, 40, 10);
    // placa del banco
    rr(c, 520, 682, 160, 40, 4); c.fillStyle = C.steel; c.fill();
    texto(c, 'BANCO HIDRÁULICO', 600, 698, { al: 'center', tam: 11, fam: C.display, col: C.bink, esp: 1.5 });
    texto(c, `N.º ${String(nBanco).padStart(2, '0')}`, 600, 716, { al: 'center', tam: 15, fam: C.mono, col: C.bink });
    dibujarInterruptor(c); dibujarTermo(c); dibujarDrenaje(c);
    dibujarBomba(c, ahora);
    // tubería de entrada y válvula
    tubo3d(c, [[180, EJE], [322, EJE]], 22, C.pipe, C.pipe2);
    dibujarValvula(c);
    // salida: unión, codo y rotámetro
    tubo3d(c, [[768, EJE], [ROT.x, EJE], [ROT.x, ROT.y0 + 8]], 22, C.pipe, C.pipe2);
    dibujarUnion(c);
    dibujarRotametro(c);
    tubo3d(c, [[ROT.x, ROT.y1 - 6], [ROT.x, 128], [TQ.boq, 128], [TQ.boq, TQ.y0 - 6]], 20, C.pipe, C.pipe2);
    dibujarTanque(c, ahora);
    dibujarTablero(c);
    dibujarMangueras(c, ahora);
    dibujarVenturi(c);
    dibujarGotas(c);
    if (hover) {
      c.save(); c.strokeStyle = C.accent; c.lineWidth = 2.5; c.setLineDash([6, 4]);
      const r = hover.marco; if (r) { rr(c, r[0], r[1], r[2], r[3], 8); c.stroke(); }
      c.restore();
    }
  }

  function dibujarEstacion(c) {
    const C = colores;
    rr(c, 40, 30, 250, 100, 8); c.fillStyle = C.steel; c.fill(); c.strokeStyle = C.bline; c.lineWidth = 1; c.stroke();
    texto(c, 'ESTACIÓN AMBIENTAL', 56, 52, { tam: 11, fam: C.display, col: C.bink, esp: 1.5 });
    rr(c, 56, 62, 218, 54, 4); c.fillStyle = C.lcd; c.fill();
    if (L) {
      texto(c, `${coma(L.Tamb, 1)} °C`, 66, 86, { tam: 17, fam: C.mono, col: C.lcdInk, peso: 500 });
      texto(c, `${coma(L.Patm, 1)} hPa`, 264, 86, { al: 'right', tam: 17, fam: C.mono, col: C.lcdInk, peso: 500 });
      texto(c, `HR ${Math.round(L.HR)} %`, 66, 108, { tam: 13, fam: C.mono, col: C.lcdInk, peso: 400 });
      texto(c, 'g = 9,777 m/s²', 264, 108, { al: 'right', tam: 13, fam: C.mono, col: C.lcdInk, peso: 400 });
    }
  }
  function dibujarReloj(c) {
    const C = colores, R = RELOJ, d = new Date();
    c.beginPath(); c.arc(R.x, R.y, R.r + 6, 0, 7); c.fillStyle = C.cab2; c.fill();
    c.beginPath(); c.arc(R.x, R.y, R.r, 0, 7); c.fillStyle = C.board; c.fill();
    for (let k = 0; k < 60; k++) {
      const a = k / 60 * 2 * Math.PI, r1 = k % 5 ? R.r - 6 : R.r - 12;
      c.beginPath(); c.moveTo(R.x + Math.sin(a) * r1, R.y - Math.cos(a) * r1); c.lineTo(R.x + Math.sin(a) * (R.r - 2), R.y - Math.cos(a) * (R.r - 2));
      c.strokeStyle = C.bink; c.lineWidth = k % 5 ? 1 : 2.5; c.stroke();
    }
    const s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    const mano = (ang, len, w, col) => { c.beginPath(); c.moveTo(R.x - Math.sin(ang) * 8, R.y + Math.cos(ang) * 8); c.lineTo(R.x + Math.sin(ang) * len, R.y - Math.cos(ang) * len); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); };
    mano(h / 12 * 2 * Math.PI, R.r * 0.5, 5, C.bink); mano(m / 60 * 2 * Math.PI, R.r * 0.78, 3.5, C.bink); mano(Math.floor(s) / 60 * 2 * Math.PI, R.r * 0.86, 1.5, C.danger);
    c.beginPath(); c.arc(R.x, R.y, 4, 0, 7); c.fillStyle = C.danger; c.fill();
  }
  function dibujarInterruptor(c) {
    const C = colores, on = sim && sim.s.bomba;
    rr(c, SW.x - 44, SW.y - 24, 88, 48, 6); c.fillStyle = C.top; c.fill();
    rr(c, SW.x - 30, SW.y - 14, 34, 28, 4); c.fillStyle = on ? C.ok : '#5c6a73'; c.fill();
    c.beginPath(); c.arc(SW.x + 22, SW.y, 7, 0, 7); c.fillStyle = on ? '#7dff9a' : '#3a2522'; c.fill();
    if (on) { c.beginPath(); c.arc(SW.x + 22, SW.y, 12, 0, 7); c.fillStyle = 'rgba(125,255,154,.25)'; c.fill(); }
    texto(c, 'BOMBA', SW.x, SW.y + 40, { al: 'center', tam: 11, fam: C.display, col: C.board, esp: 1.5 });
  }
  function dibujarTermo(c) {
    const C = colores, x = 300, y = SW.y;
    rr(c, x - 64, y - 22, 128, 44, 6); c.fillStyle = C.top; c.fill();
    rr(c, x - 54, y - 14, 108, 28, 3); c.fillStyle = C.lcd; c.fill();
    if (L) texto(c, `${coma(L.Tagua, 1)} °C`, x, y + 7, { al: 'center', tam: 18, fam: C.mono, col: C.lcdInk, peso: 500 });
    texto(c, 'AGUA DEL TANQUE', x, y + 40, { al: 'center', tam: 11, fam: C.display, col: C.board, esp: 1.5 });
  }
  function dibujarDrenaje(c) {
    const C = colores, ab = sim && sim.s.vaciado;
    c.beginPath(); c.arc(DREN.x, DREN.y, 12, 0, 7); c.fillStyle = C.top; c.fill();
    c.save(); c.translate(DREN.x, DREN.y); c.rotate(ab ? -Math.PI / 2 : 0);
    rr(c, -4, -5, 48, 10, 5); c.fillStyle = C.danger; c.fill(); c.restore();
    texto(c, ab ? 'VACIADO ABIERTO' : 'VACIADO CERRADO', DREN.x + 8, DREN.y + 40, { al: 'center', tam: 11, fam: C.display, col: C.board, esp: 1.2 });
  }
  function dibujarBomba(c, ahora) {
    const C = colores, on = sim && sim.s.bomba;
    rr(c, 40, 600, 100, 48, 8); c.fillStyle = C.cab; c.fill();
    for (let k = 0; k < 8; k++) { const x = 50 + k * 11 + (on ? (ahora / 18) % 11 : 0); if (x < 136) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, 604, 4, 40); } }
    c.fillStyle = C.steel; c.fillRect(136, 612, 10, 24);
    c.beginPath(); c.arc(168, 620, 28, 0, 7); c.fillStyle = C.cab2; c.fill();
    c.beginPath(); c.arc(168, 620, 12, 0, 7); c.fillStyle = C.steel; c.fill();
    c.fillStyle = C.pipe2; c.fillRect(160, 586, 22, 18);
    rr(c, 36, 646, 152, 6, 2); c.fillStyle = C.top; c.fill();
  }
  function dibujarValvula(c) {
    const C = colores, v = sim ? sim.s.valvula : 0;
    rr(c, 228, 566, 60, 48, 10); c.fillStyle = C.brass; c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(228, 566, 6, 48); c.fillRect(282, 566, 6, 48);
    c.save(); c.translate(VOL.x, VOL.y); c.rotate(-v * 2 * Math.PI);
    c.beginPath(); c.arc(0, 0, VOL.r, 0, 7); c.lineWidth = 7; c.strokeStyle = C.wheel; c.stroke();
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(VOL.r, 0); c.lineWidth = 5; c.stroke(); }
    c.beginPath(); c.arc(VOL.r, 0, 5, 0, 7); c.fillStyle = C.ink; c.fill();
    c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fillStyle = C.steel; c.fill();
    c.restore();
    texto(c, 'VÁLVULA', VOL.x, VOL.y - VOL.r - 14, { al: 'center', tam: 11, fam: C.display, col: C.sub, esp: 1.5 });
  }
  function dibujarUnion(c) {
    const C = colores;
    c.beginPath();
    for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * Math.PI + Math.PI / 6; c.lineTo(UNI.x + Math.cos(a) * 16, UNI.y + Math.sin(a) * 19); }
    c.closePath(); c.fillStyle = C.brass; c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(UNI.x - 1, UNI.y - 19, 2, 38);
  }
  function dibujarGotas(c) {
    const C = colores;
    if (charco > 0.02) { c.beginPath(); c.ellipse(UNI.x + 4, MESA + 1, 8 + 40 * Math.min(1, charco), 3 + 2 * Math.min(1, charco), 0, 0, 7); c.fillStyle = C.water; c.globalAlpha = 0.7; c.fill(); c.globalAlpha = 1; }
    gotas.forEach((g) => { c.beginPath(); c.ellipse(g.x, g.y, 2.2, 3.2, 0, 0, 7); c.fillStyle = C.water2; c.fill(); });
  }
  function dibujarRotametro(c) {
    const C = colores, R = E.rot;
    rr(c, 836, 150, 68, 444, 6); c.fillStyle = C.steel; c.fill(); c.strokeStyle = C.bline; c.lineWidth = 1; c.stroke();
    c.fillStyle = C.pipe2; c.fillRect(ROT.x - 16, ROT.y0, 32, 14); c.fillRect(ROT.x - 16, ROT.y1 - 14, 32, 14);
    // vidrio cónico
    const ancho = (y) => 14 + 8 * (ROT.y0 - y) / (ROT.y0 - ROT.y1);
    c.beginPath(); c.moveTo(ROT.x - 7, ROT.y0); c.lineTo(ROT.x - 11, ROT.y1); c.lineTo(ROT.x + 11, ROT.y1); c.lineTo(ROT.x + 7, ROT.y0); c.closePath();
    c.fillStyle = C.water; c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1; c.strokeStyle = C.glass; c.lineWidth = 1.5; c.stroke();
    for (let q = R.min; q <= R.max + 1e-9; q += R.div) {
      const y = rotY(V.mmRot(q)), mayor = Math.abs(q % 2) < 1e-9;
      c.beginPath(); c.moveTo(ROT.x - ancho(y) / 2 - (mayor ? 9 : 4), y); c.lineTo(ROT.x - ancho(y) / 2, y); c.strokeStyle = C.bink; c.lineWidth = 1; c.stroke();
      if (mayor) texto(c, String(q), ROT.x - ancho(y) / 2 - 11, y + 4, { al: 'right', tam: 11, fam: C.mono, col: C.bink, peso: 500 });
    }
    texto(c, 'L/min', ROT.x, 166, { al: 'center', tam: 11, fam: C.display, col: C.bink });
    if (L) {
      const y = rotY(V.mmRot(L.flot)), w = ancho(y) - 3;
      c.beginPath(); c.moveTo(ROT.x - w / 2, y); c.lineTo(ROT.x + w / 2, y); c.lineTo(ROT.x + w / 2, y + 3); c.lineTo(ROT.x + 2, y + 16); c.lineTo(ROT.x - 2, y + 16); c.lineTo(ROT.x - w / 2, y + 3); c.closePath();
      c.fillStyle = '#5b6770'; c.fill(); c.fillStyle = '#c9d1d6'; c.fillRect(ROT.x - w / 2, y, w, 2);
    }
    if (lupa2 === 'rot') marcoSel(c, 830, 144, 80, 456);
  }
  function marcoSel(c, x, y, w, h) { c.save(); rr(c, x, y, w, h, 9); c.strokeStyle = colores.accent; c.lineWidth = 2.5; c.stroke(); c.restore(); }
  function dibujarTanque(c, ahora) {
    const C = colores;
    rr(c, TQ.x0, TQ.y0, TQ.x1 - TQ.x0, TQ.y1 - TQ.y0, 4); c.fillStyle = C.acrylic; c.fill(); c.strokeStyle = C.glass; c.lineWidth = 2; c.stroke();
    texto(c, 'TANQUE VOLUMÉTRICO', (TQ.x0 + TQ.x1) / 2, TQ.y0 + 22, { al: 'center', tam: 11, fam: C.display, col: C.sub, esp: 1.2 });
    if (L) {
      const y = tqY(L.Vsup);
      c.fillStyle = C.water; c.globalAlpha = 0.75; c.fillRect(TQ.x0 + 3, y, TQ.x1 - TQ.x0 - 6, TQ.y1 - 3 - y); c.globalAlpha = 1;
      if (L.qr > 0.05) {
        const w = 1.5 + Math.sqrt(L.qr) * 0.9;
        c.beginPath(); c.moveTo(TQ.boq - w, TQ.y0 - 6);
        for (let yy = TQ.y0 - 6; yy <= y; yy += 8) c.lineTo(TQ.boq - w * 0.7 + Math.sin(yy / 9 + ahora / 60) * 0.8, yy);
        c.lineTo(TQ.boq + w * 0.7, y);
        for (let yy = y; yy >= TQ.y0 - 6; yy -= 8) c.lineTo(TQ.boq + w * 0.7 + Math.sin(yy / 7 + ahora / 50) * 0.8, yy);
        c.closePath(); c.fillStyle = C.water2; c.globalAlpha = 0.8; c.fill(); c.globalAlpha = 1;
      }
      // mirilla
      c.fillStyle = C.glass; c.fillRect(TQ.g - 6, tqY(41) - 4, 12, tqY(0) - tqY(41) + 8);
      c.fillStyle = C.water; c.fillRect(TQ.g - 3, tqY(L.Vsup), 6, tqY(0) - tqY(L.Vsup));
      c.fillStyle = C.pipe2; c.fillRect(TQ.x1, tqY(0) + 2, TQ.g - TQ.x1, 6);
      for (let v = 0; v <= 40; v += 1) {
        const yy = tqY(v), m5 = v % 5 === 0;
        c.beginPath(); c.moveTo(TQ.g + 6, yy); c.lineTo(TQ.g + (m5 ? 16 : 10), yy); c.strokeStyle = C.ink; c.lineWidth = 1; c.stroke();
        if (v % 10 === 0) texto(c, String(v), TQ.g + 18, yy + 4, { tam: 11, fam: C.mono, col: C.ink, peso: 500 });
      }
      texto(c, 'L', TQ.g + 12, tqY(41) - 10, { tam: 11, fam: C.display, col: C.sub });
    }
    if (lupa2 === 'tanque') marcoSel(c, TQ.x0 - 8, TQ.y0 - 8, TQ.g + 46 - TQ.x0, TQ.y1 - TQ.y0 + 4);
  }
  function dibujarTablero(c) {
    const C = colores;
    rr(c, TAB.x0, TAB.y0, TAB.x1 - TAB.x0, TAB.y1 - TAB.y0, 6); c.fillStyle = C.board; c.fill(); c.strokeStyle = C.bline; c.lineWidth = 1.5; c.stroke();
    texto(c, 'PIEZÓMETROS · mm DE COLUMNA DE AGUA', (TAB.x0 + TAB.x1) / 2, TAB.y0 + 22, { al: 'center', tam: 12, fam: C.display, col: C.bink, esp: 1.6 });
    for (let mm = 0; mm <= E.escala.max; mm += 50) {
      const y = mmY(mm);
      texto(c, String(mm), TAB.x0 + 26, y + 4, { al: 'right', tam: 11, fam: C.mono, col: C.bink, peso: 500 });
      texto(c, String(mm), TAB.x1 - 26, y + 4, { al: 'left', tam: 11, fam: C.mono, col: C.bink, peso: 500 });
    }
    for (let i = 0; i < N; i++) {
      const x = tuboX(i);
      for (let mm = 0; mm <= E.escala.max; mm += 10) {
        const y = mmY(mm), l = mm % 50 === 0 ? 9 : 4;
        c.beginPath(); c.moveTo(x - 7 - l, y); c.lineTo(x - 7, y); c.strokeStyle = C.bink; c.lineWidth = mm % 100 === 0 ? 1.4 : 0.8; c.stroke();
      }
      const yTop = mmY(E.escala.tuboMax), yBot = mmY(E.escala.tuboMin);
      c.fillStyle = C.glass; c.globalAlpha = 0.5; c.fillRect(x - 5, yTop, 10, yBot - yTop); c.globalAlpha = 1;
      if (L) {
        const yl = clamp(mmY(L.h[i]), yTop, yBot + 14);
        if (yl < yBot) { c.fillStyle = C.water2; c.globalAlpha = 0.85; c.fillRect(x - 3.5, yl, 7, yBot - yl); c.globalAlpha = 1; }
      }
      c.strokeStyle = C.glass; c.lineWidth = 1.2; c.strokeRect(x - 5, yTop, 10, yBot - yTop);
      c.fillStyle = C.steel; c.fillRect(x - 6, yBot, 12, CONEX - yBot);
      texto(c, E.tomas[i].id, x, TAB.y1 - 10, { al: 'center', tam: 14, fam: C.display, col: C.bink, peso: 700 });
      if (i === tubo) {
        marcoSel(c, x - 22, yTop - 8, 44, yBot - yTop + 16);
        const ye = mmY(ojoM);
        c.beginPath(); c.moveTo(x + 9, ye); c.lineTo(x + 19, ye - 6); c.lineTo(x + 19, ye + 6); c.closePath(); c.fillStyle = C.accent; c.fill();
      }
    }
  }
  function dibujarMangueras(c, ahora) {
    const C = colores;
    for (let i = 0; i < N; i++) {
      let p = manguera(i);
      if (golpe.i === i && ahora - golpe.t < 450) { const d = Math.sin((ahora - golpe.t) / 22) * 4 * (1 - (ahora - golpe.t) / 450); p = p.map((q, k) => k === 1 || k === 2 ? [q[0] + d, q[1]] : q); }
      c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
      c.strokeStyle = C.hose; c.lineWidth = 7; c.stroke();
      c.strokeStyle = C.water; c.lineWidth = 3.4; c.stroke();
      if (L) L.burbujas.forEach((bu) => { if (bu.i === i && bu.viva) burbujaEn(c, p, bu.pos, bu.largo); });
      salientes.forEach((sa) => { if (sa.i === i) burbujaEn(c, p, sa.pos * (1 - Math.min(1, (ahora - sa.t) / 900)), sa.largo * (1 - Math.min(1, (ahora - sa.t) / 900) * 0.6)); });
    }
  }
  function burbujaEn(c, p, t, largo) {
    const a = bez(p, Math.max(0.02, t - largo / 140)), b = bez(p, Math.min(0.98, t + largo / 140));
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 4.2;
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore();
  }
  function dibujarVenturi(c) {
    const C = colores;
    c.fillStyle = C.steel; c.fillRect(VX0 - 8, EJE - 46, 8, 92); c.fillRect(VX1, EJE - 46, 8, 92);
    rr(c, VX0, EJE - BLOQ * VS, VX1 - VX0, 2 * BLOQ * VS, 6); c.fillStyle = C.acrylic; c.fill(); c.strokeStyle = C.glass; c.lineWidth = 1.5; c.stroke();
    // canal interno
    c.beginPath();
    for (let x = XMM0; x <= XMM1; x += 1) c.lineTo(vx(x), EJE - diam(x) / 2 * VS);
    for (let x = XMM1; x >= XMM0; x -= 1) c.lineTo(vx(x), EJE + diam(x) / 2 * VS);
    c.closePath(); c.fillStyle = C.water; c.globalAlpha = 0.8; c.fill(); c.globalAlpha = 1; c.strokeStyle = C.glass; c.lineWidth = 1; c.stroke();
    // partículas y burbujas arrastradas
    particulas.forEach((p) => { const r = diam(p.x) / 2 * VS * p.r; c.beginPath(); c.arc(vx(p.x), EJE + r, p.tam, 0, 7); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); });
    // tomas
    E.tomas.forEach((t, i) => {
      const x = vx(t.x), yIn = EJE - t.D / 2 * VS;
      c.fillStyle = C.water; c.fillRect(x - 1.5, EJE - BLOQ * VS, 3, yIn - (EJE - BLOQ * VS));
      c.fillStyle = C.brass; c.fillRect(x - 4, NIP, 8, EJE - BLOQ * VS - NIP + 2);
      texto(c, t.id, x + 7, EJE - BLOQ * VS + 13, { tam: 11, fam: C.display, col: C.sub, peso: 700 });
    });
    c.fillStyle = C.cab2; c.fillRect(VX0 + 30, EJE + BLOQ * VS, 14, MESA - EJE - BLOQ * VS); c.fillRect(VX1 - 44, EJE + BLOQ * VS, 14, MESA - EJE - BLOQ * VS);
  }

  /* ---------- animaciones secundarias ---------- */
  function animar(dt, ahora) {
    if (!L) return;
    const Q = L.q / 60000;
    // partículas dentro del Venturi
    const objetivo = L.q > 0.2 ? Math.round(4 + 38 * L.aire) : 0;
    if (particulas.length < objetivo && Math.random() < dt * 12) particulas.push({ x: XMM0, r: (Math.random() * 2 - 1) * 0.85, tam: 1.2 + Math.random() * (L.aire > 0.2 ? 2.6 : 1.2) });
    for (let k = particulas.length - 1; k >= 0; k--) {
      const p = particulas[k], d = diam(p.x) / 1000, v = Q / (Math.PI * d * d / 4);
      p.x += v * 1000 * 0.06 * dt;
      if (p.x > XMM1 || (L.q < 0.05 && Math.random() < dt * 0.3)) particulas.splice(k, 1);
    }
    // goteo por la unión
    if (L.fuga > 0 && Math.random() < dt * Math.min(10, 2 + L.fuga * 60)) gotas.push({ x: UNI.x + 6 + Math.random() * 3, y: UNI.y + 16, v: 0 });
    for (let k = gotas.length - 1; k >= 0; k--) { const g = gotas[k]; g.v += 900 * dt; g.y += g.v * dt; if (g.y > MESA) { gotas.splice(k, 1); charco += 0.004; } }
    charco = Math.max(0, charco - dt * 0.0006);
    for (let k = salientes.length - 1; k >= 0; k--) if (ahora - salientes[k].t > 900) salientes.splice(k, 1);
    if (prevVivas) L.burbujas.forEach((bu, k) => { if (prevVivas[k] && !bu.viva) salientes.push({ i: bu.i, pos: bu.pos, largo: bu.largo, t: ahora }); });
    prevVivas = L.burbujas.map((bu) => bu.viva);
  }

  /* ---------- lupas ---------- */
  const lupas = {};
  function prepLupa(id, miniId) {
    const cvL = $(id), mini = $(miniId);
    const o = { cv: cvL, c: cvL.getContext('2d'), mini, mc: mini.getContext('2d'), w: 0, h: 0, mw: 0 };
    lupas[id] = o; return o;
  }
  function tamLupa(o) {
    const dpr = window.devicePixelRatio || 1;
    o.w = o.cv.clientWidth; o.h = o.cv.clientHeight; o.cv.width = Math.round(o.w * dpr); o.cv.height = Math.round(o.h * dpr); o.c.setTransform(dpr, 0, 0, dpr, 0, 0);
    o.mw = o.mini.clientWidth; o.mh = o.mini.clientHeight; o.mini.width = Math.round(o.mw * dpr); o.mini.height = Math.round(o.mh * dpr); o.mc.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const M_MAN = 11, M_ROT = 7, M_TQ = 6;
  function ojitos(c, w, cy) {
    c.fillStyle = colores.accent;
    c.beginPath(); c.moveTo(0, cy - 7); c.lineTo(9, cy); c.lineTo(0, cy + 7); c.fill();
    c.beginPath(); c.moveTo(w, cy - 7); c.lineTo(w - 9, cy); c.lineTo(w, cy + 7); c.fill();
  }
  function vidrio(c, x0, x1, y0, y1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(160,190,205,.55)'); g.addColorStop(0.12, 'rgba(255,255,255,.35)'); g.addColorStop(0.3, 'rgba(255,255,255,.05)');
    g.addColorStop(0.8, 'rgba(255,255,255,.08)'); g.addColorStop(0.92, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(150,180,195,.6)');
    c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  function columna(c, cx, R, yNivel, prof, cy, M, ojo, hBot) {
    // agua bajo un menisco cóncavo (fondo del menisco en yNivel [mm]); profundidad prof [mm]
    const Y = (mm) => cy - M * (mm - ojo);
    c.beginPath();
    for (let k = 0; k <= 40; k++) { const u = -1 + 2 * k / 40, x = cx + u * R; c.lineTo(x, Y(yNivel + prof * (1 - Math.sqrt(Math.max(0, 1 - u * u * 0.985))))); }
    c.lineTo(cx + R, Y(hBot)); c.lineTo(cx - R, Y(hBot)); c.closePath();
    c.fillStyle = colores.water; c.globalAlpha = 0.42; c.fill(); c.globalAlpha = 1;
    c.beginPath();
    for (let k = 0; k <= 40; k++) { const u = -1 + 2 * k / 40, x = cx + u * R; c.lineTo(x, Y(yNivel + prof * (1 - Math.sqrt(Math.max(0, 1 - u * u * 0.985))))); }
    c.strokeStyle = 'rgba(18,52,70,.85)'; c.lineWidth = 2.6; c.stroke();
    c.beginPath();
    for (let k = 0; k <= 40; k++) { const u = -1 + 2 * k / 40, x = cx + u * R * 0.98; c.lineTo(x, Y(yNivel - 0.45 + prof * (1 - Math.sqrt(Math.max(0, 1 - u * u * 0.985))))); }
    c.strokeStyle = 'rgba(18,52,70,.22)'; c.lineWidth = 4; c.stroke();
  }
  function lupaManometro(o) {
    const c = o.c, w = o.w, h = o.h, C = colores, cy = h / 2, M = M_MAN, p = E.paralaje.manometro, kS = 1 / (1 + p);
    c.fillStyle = C.board; c.fillRect(0, 0, w, h);
    const cx = Math.round(w * 0.64), R = (E.escala.diametro / 2) * M, vid = 1.3 * M;
    const visto = (h / 2) / (M * kS) + 2, lo = Math.floor(ojoM - visto), hi = Math.ceil(ojoM + visto);
    for (let s = lo; s <= hi; s++) {
      if (s < E.escala.min || s > E.escala.max) continue;
      const y = cy - M * (s - ojoM) * kS, l = s % 10 === 0 ? 46 : s % 5 === 0 ? 30 : 17;
      c.beginPath(); c.moveTo(cx - R - vid - 6 - l, y); c.lineTo(cx - R - vid - 6, y); c.strokeStyle = C.bink; c.lineWidth = s % 10 === 0 ? 2 : 1.2; c.stroke();
      c.beginPath(); c.moveTo(cx - R, y); c.lineTo(cx + R, y); c.strokeStyle = C.bline; c.globalAlpha = 0.55; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
      if (s % 10 === 0) texto(c, String(s), cx - R - vid - 58, y + 6, { al: 'right', tam: 17, fam: C.mono, col: C.bink, peso: 600 });
    }
    if (L) {
      const nivel = L.h[tubo];
      if (nivel > E.escala.tuboMin) columna(c, cx, R, nivel, 1.4, cy, M, ojoM, Math.min(nivel, ojoM) - visto - 4);
    }
    vidrio(c, cx - R - vid, cx - R, 0, h); vidrio(c, cx + R, cx + R + vid, 0, h);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(cx - R, 0, 2 * R, h);
    ojitos(c, w, cy);
    texto(c, `Tubo ${E.tomas[tubo].id}`, 10, 22, { tam: 14, fam: C.display, col: C.bink, peso: 700, esp: 1 });
    // minimapa
    const m = o.mc, mw = o.mw, mh = o.mh;
    m.fillStyle = C.board; m.fillRect(0, 0, mw, mh);
    const lo2 = E.escala.tuboMin, hi2 = E.escala.tuboMax, my = (mm) => mh - 6 - (mm - lo2) / (hi2 - lo2) * (mh - 12);
    const tx = mw / 2 + 8;
    m.fillStyle = C.glass; m.globalAlpha = 0.6; m.fillRect(tx - 4, my(hi2), 8, my(lo2) - my(hi2)); m.globalAlpha = 1;
    if (L) { const yl = clamp(my(L.h[tubo]), my(hi2), my(lo2)); m.fillStyle = C.water2; m.fillRect(tx - 3, yl, 6, my(lo2) - yl); }
    for (let mm = 0; mm <= 500; mm += 100) { m.fillStyle = C.bink; m.fillRect(tx - 9, my(mm), 4, 1); texto(m, String(mm), tx - 11, my(mm) + 3.5, { al: 'right', tam: 9, fam: C.mono, col: C.bink, peso: 500 }); }
    const vv = (h / 2) / M;
    m.strokeStyle = C.accent; m.lineWidth = 2; m.strokeRect(tx - 8, my(ojoM + vv), 16, my(ojoM - vv) - my(ojoM + vv));
  }
  function lupaRotametro(o) {
    const c = o.c, w = o.w, h = o.h, C = colores, cy = h / 2, M = M_ROT, p = E.paralaje.rotametro, kS = 1 / (1 - p), R = E.rot;
    c.fillStyle = C.steel; c.fillRect(0, 0, w, h);
    const cx = Math.round(w * 0.6), Rt = 13 * M * 0.62;
    c.fillStyle = C.water; c.globalAlpha = 0.35; c.fillRect(cx - Rt, 0, 2 * Rt, h); c.globalAlpha = 1;
    if (L) {
      const yF = cy - M * (V.mmRot(L.flot) - ojoR), wF = Rt * 0.94;
      c.beginPath(); c.moveTo(cx - wF, yF); c.lineTo(cx + wF, yF); c.lineTo(cx + wF, yF + 2.2 * M); c.lineTo(cx + 0.18 * wF, yF + 11 * M); c.lineTo(cx - 0.18 * wF, yF + 11 * M); c.lineTo(cx - wF, yF + 2.2 * M); c.closePath();
      const gf = c.createLinearGradient(cx - wF, 0, cx + wF, 0); gf.addColorStop(0, '#4a555d'); gf.addColorStop(0.35, '#cfd7dc'); gf.addColorStop(0.6, '#8a979f'); gf.addColorStop(1, '#3f4950');
      c.fillStyle = gf; c.fill();
      c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(cx - wF, yF, 2 * wF, 1.6);
    }
    vidrio(c, cx - Rt - 10, cx - Rt + 4, 0, h); vidrio(c, cx + Rt - 4, cx + Rt + 10, 0, h);
    // escala grabada en el vidrio (delante del flotador)
    for (let q = R.min; q <= R.max + 1e-9; q += R.div) {
      const y = cy - M * (V.mmRot(q) - ojoR) * kS;
      if (y < -20 || y > h + 20) continue;
      const ent = Math.abs(q - Math.round(q)) < 1e-9, par = ent && Math.round(q) % 2 === 0, l = par ? 0.9 * Rt : ent ? 0.65 * Rt : 0.4 * Rt;
      c.beginPath(); c.moveTo(cx - Rt, y); c.lineTo(cx - Rt + l, y); c.strokeStyle = '#13202a'; c.lineWidth = par ? 2 : 1.3; c.stroke();
      if (ent) texto(c, String(Math.round(q)), cx - Rt - 16, y + 6, { al: 'right', tam: par ? 18 : 14, fam: C.mono, col: C.bink, peso: par ? 700 : 500 });
    }
    ojitos(c, w, cy);
    texto(c, 'Rotámetro · L/min', 10, 22, { tam: 14, fam: C.display, col: C.bink, peso: 700, esp: 1 });
    const m = o.mc, mw = o.mw, mh = o.mh;
    m.fillStyle = C.steel; m.fillRect(0, 0, mw, mh);
    const my = (mm) => mh - 6 - mm / R.largo * (mh - 12), tx = mw / 2 + 8;
    m.fillStyle = C.water; m.globalAlpha = 0.6; m.fillRect(tx - 4, my(R.largo), 8, my(0) - my(R.largo)); m.globalAlpha = 1;
    for (let q = 2; q <= 20; q += 4) { m.fillStyle = C.bink; m.fillRect(tx - 9, my(V.mmRot(q)), 4, 1); texto(m, String(q), tx - 11, my(V.mmRot(q)) + 3.5, { al: 'right', tam: 9, fam: C.mono, col: C.bink, peso: 500 }); }
    if (L) { m.fillStyle = '#3f4950'; m.fillRect(tx - 4, my(V.mmRot(L.flot)), 8, 4); }
    const vv = (h / 2) / M;
    m.strokeStyle = C.accent; m.lineWidth = 2; m.strokeRect(tx - 8, my(ojoR + vv), 16, my(ojoR - vv) - my(ojoR + vv));
  }
  function lupaTanque(o) {
    const c = o.c, w = o.w, h = o.h, C = colores, cy = h / 2, M = M_TQ, p = E.paralaje.tanque, kS = 1 / (1 + p), T = E.tanque;
    c.fillStyle = C.board; c.fillRect(0, 0, w, h);
    const cx = Math.round(w * 0.62), R = 6 * M, vid = 1.6 * M;
    const visto = (h / 2) / (M * kS) + 3;
    for (let k = Math.floor((ojoT - visto) / 5); k <= Math.ceil((ojoT + visto) / 5); k++) {
      const v = k * T.div; if (v < 0 || v > T.max) continue;
      const y = cy - M * (v * T.mmPorL - ojoT) * kS, ent = Math.abs(v - Math.round(v)) < 1e-9, c5 = ent && Math.round(v) % 5 === 0, l = c5 ? 46 : ent ? 30 : 17;
      c.beginPath(); c.moveTo(cx - R - vid - 6 - l, y); c.lineTo(cx - R - vid - 6, y); c.strokeStyle = C.bink; c.lineWidth = c5 ? 2 : 1.2; c.stroke();
      if (ent) texto(c, String(Math.round(v)), cx - R - vid - 58, y + 6, { al: 'right', tam: c5 ? 18 : 15, fam: C.mono, col: C.bink, peso: c5 ? 700 : 500 });
    }
    if (L) columna(c, cx, R, L.Vsup * T.mmPorL, 1.6, cy, M, ojoT, Math.min(L.Vsup * T.mmPorL, ojoT) - visto - 4);
    vidrio(c, cx - R - vid, cx - R, 0, h); vidrio(c, cx + R, cx + R + vid, 0, h);
    ojitos(c, w, cy);
    texto(c, 'Mirilla del tanque · litros', 10, 22, { tam: 14, fam: C.display, col: C.bink, peso: 700, esp: 1 });
    const m = o.mc, mw = o.mw, mh = o.mh;
    m.fillStyle = C.board; m.fillRect(0, 0, mw, mh);
    const tope = T.rebose * T.mmPorL, my = (mm) => mh - 6 - mm / tope * (mh - 12), tx = mw / 2 + 8;
    m.fillStyle = C.glass; m.globalAlpha = 0.6; m.fillRect(tx - 4, my(tope), 8, my(0) - my(tope)); m.globalAlpha = 1;
    if (L) { const yl = my(L.Vsup * T.mmPorL); m.fillStyle = C.water2; m.fillRect(tx - 3, yl, 6, my(0) - yl); }
    for (let v = 0; v <= 40; v += 10) { m.fillStyle = C.bink; m.fillRect(tx - 9, my(v * T.mmPorL), 4, 1); texto(m, String(v), tx - 11, my(v * T.mmPorL) + 3.5, { al: 'right', tam: 9, fam: C.mono, col: C.bink, peso: 500 }); }
    const vv = (h / 2) / M;
    m.strokeStyle = C.accent; m.lineWidth = 2; m.strokeRect(tx - 8, my(ojoT + vv), 16, my(ojoT - vv) - my(ojoT + vv));
  }

  /* ---------- interacción con el dibujo ---------- */
  function mundo(ev) { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / esc, (ev.clientY - r.top) / esc]; }
  function zona(x, y) {
    if (Math.hypot(x - VOL.x, y - VOL.y) < VOL.r + 10) return { tipo: 'valvula', txt: 'Válvula de regulación: arrastre en círculo (antihorario abre) o use los botones', marco: [VOL.x - 42, VOL.y - 42, 84, 84] };
    if (Math.abs(x - SW.x) < 46 && Math.abs(y - SW.y) < 26) return { tipo: 'bomba', txt: sim.s.bomba ? 'Apagar la bomba' : 'Encender la bomba', marco: [SW.x - 48, SW.y - 28, 96, 56] };
    if (Math.abs(x - UNI.x) < 20 && Math.abs(y - UNI.y) < 24) return { tipo: 'union', txt: 'Unión de salida: toque para apretarla', marco: [UNI.x - 22, UNI.y - 26, 44, 52] };
    if (Math.abs(x - (DREN.x + 18)) < 40 && Math.abs(y - DREN.y) < 24) return { tipo: 'drenaje', txt: sim.s.vaciado ? 'Cerrar el vaciado del tanque' : 'Abrir el vaciado del tanque', marco: [DREN.x - 18, DREN.y - 26, 80, 52] };
    for (let i = 0; i < N; i++) {
      const p = manguera(i);
      for (let k = 0; k <= 20; k++) { const q = bez(p, k / 20); if (Math.hypot(x - q[0], y - q[1]) < 8) return { tipo: 'manguera', i, txt: `Manguera ${E.tomas[i].id}: toque para darle golpecitos`, marco: [Math.min(p[0][0], p[3][0]) - 12, CONEX - 6, Math.abs(p[0][0] - p[3][0]) + 24, NIP - CONEX + 12] }; }
    }
    for (let i = 0; i < N; i++) { const tx = tuboX(i); if (Math.abs(x - tx) < 19 && y > TAB.y0 + 30 && y < CONEX) return { tipo: 'tubo', i, txt: `Tubo ${E.tomas[i].id}: ver en la lupa`, marco: null }; }
    if (x > 830 && x < 910 && y > 144 && y < 600) return { tipo: 'rot', txt: 'Rotámetro: ver en la lupa', marco: null };
    if (x > TQ.x0 - 8 && x < TQ.g + 40 && y > TQ.y0 - 8 && y < TQ.y1) return { tipo: 'tanque', txt: 'Mirilla del tanque: ver en la lupa', marco: null };
    return null;
  }
  function etiqueta(ev, z) {
    const t = $('stageTip'); if (!t) return;
    if (!z) { t.hidden = true; return; }
    const r = cv.getBoundingClientRect(); t.textContent = z.txt; t.hidden = false;
    t.style.left = Math.min(r.width - 230, Math.max(4, ev.clientX - r.left + 14)) + 'px'; t.style.top = Math.max(4, ev.clientY - r.top - 34) + 'px';
  }
  function accion(z, x, y) {
    if (!z) return;
    if (z.tipo === 'bomba') setBomba(!sim.s.bomba);
    else if (z.tipo === 'union') apretar();
    else if (z.tipo === 'drenaje') setVaciado(!sim.s.vaciado);
    else if (z.tipo === 'manguera') golpear(z.i);
    else if (z.tipo === 'tubo') { selectTube(z.i); const mm = E.escala.tuboMin + (452 - y) * (E.escala.tuboMax - E.escala.tuboMin) / 390; ojoM = clamp(Math.round(mm), E.escala.tuboMin, E.escala.tuboMax); }
    else if (z.tipo === 'rot') { selectLupa2('rot'); ojoR = clamp((ROT.y0 - y) * E.rot.largo / (ROT.y0 - ROT.y1), 0, E.rot.largo); }
    else if (z.tipo === 'tanque') { selectLupa2('tanque'); if (x > TQ.x1) ojoT = clamp((MESA - 9 - y) / 7 * E.tanque.mmPorL, 0, 420); }
  }
  function enlazarCanvas() {
    let abajo = null;
    cv.addEventListener('pointerdown', (ev) => {
      const [x, y] = mundo(ev), z = zona(x, y);
      abajo = { x, y, z, mov: false };
      if (z && z.tipo === 'valvula') { arrastre = { ang: Math.atan2(y - VOL.y, x - VOL.x) }; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); }
    });
    cv.addEventListener('pointermove', (ev) => {
      const [x, y] = mundo(ev);
      if (arrastre) {
        const a = Math.atan2(y - VOL.y, x - VOL.x); let d = a - arrastre.ang;
        if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
        arrastre.ang = a; setValvula(sim.s.valvula - d / (2 * Math.PI));
        if (abajo) abajo.mov = true; return;
      }
      if (abajo && Math.hypot(x - abajo.x, y - abajo.y) > 6) abajo.mov = true;
      const z = zona(x, y); hover = z; cv.style.cursor = z ? 'pointer' : 'default'; etiqueta(ev, z);
    });
    const fin = (ev) => {
      if (arrastre) { arrastre = null; try { cv.releasePointerCapture(ev.pointerId); } catch (e) { /* sin captura */ } }
      else if (abajo && !abajo.mov) accion(abajo.z, abajo.x, abajo.y);
      abajo = null;
    };
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', () => { arrastre = null; abajo = null; });
    cv.addEventListener('pointerleave', () => { hover = null; etiqueta(null, null); });
    cv.addEventListener('wheel', (ev) => {
      const [x, y] = mundo(ev);
      if (Math.hypot(x - VOL.x, y - VOL.y) < VOL.r + 10) { ev.preventDefault(); setValvula(sim.s.valvula + (ev.deltaY < 0 ? 1 : -1) / 32); }
    }, { passive: false });
  }
  function enlazarLupa(o, mover, minimapa) {
    let y0 = null;
    o.cv.addEventListener('pointerdown', (ev) => { y0 = ev.clientY; o.cv.setPointerCapture(ev.pointerId); });
    o.cv.addEventListener('pointermove', (ev) => { if (y0 === null) return; const d = ev.clientY - y0; y0 = ev.clientY; mover(d, 'px'); });
    o.cv.addEventListener('pointerup', () => { y0 = null; });
    o.cv.addEventListener('pointercancel', () => { y0 = null; });
    o.cv.addEventListener('keydown', (ev) => {
      const k = { ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[ev.key];
      if (k) { ev.preventDefault(); mover(k, 'mm'); }
    });
    let arr = false;
    const salto = (ev) => { const r = o.mini.getBoundingClientRect(); minimapa((ev.clientY - r.top) / r.height); };
    o.mini.addEventListener('pointerdown', (ev) => { arr = true; o.mini.setPointerCapture(ev.pointerId); salto(ev); });
    o.mini.addEventListener('pointermove', (ev) => { if (arr) salto(ev); });
    o.mini.addEventListener('pointerup', () => { arr = false; });
  }

  /* ---------- acciones ---------- */
  function setBomba(on) {
    if (!sim || sim.s.bomba === on) return;
    sim.bomba(on);
    anotar(on ? `Bomba encendida (válvula ${vueltasTxt(sim.s.valvula)})` : `Bomba apagada (válvula ${vueltasTxt(sim.s.valvula)})`, 'bomba');
    sincronizar();
  }
  function setValvula(v) {
    if (!sim) return;
    const antes = sim.s.valvula; sim.valvula(v);
    if (Math.abs(sim.s.valvula - antes) < 1e-9) return;
    sincronizar();
    clearTimeout(valvTimer);
    valvTimer = setTimeout(() => anotar(`Válvula en ${vueltasTxt(sim.s.valvula)}`, 'valvula'), 1200);
  }
  function apretar() {
    if (!sim) return;
    if (sim.s.apretada) { anotar('Se revisó la unión de salida: ya estaba apretada'); return; }
    sim.apretar(); anotar('Unión de salida apretada con la llave');
    if (cb.toast) cb.toast('Unión apretada. Observe si sigue goteando.');
  }
  function setVaciado(ab) { if (!sim) return; sim.vaciado(ab); anotar(ab ? 'Vaciado del tanque volumétrico abierto' : 'Vaciado del tanque volumétrico cerrado', 'tanque'); sincronizar(); }
  function golpear(i) {
    if (!sim) return;
    golpe = { i, t: performance.now() };
    const salio = sim.golpear(i);
    anotar(`Golpecitos en la manguera ${E.tomas[i].id}` + (salio ? ': subió una burbuja' : ''));
  }
  function selectTube(i) {
    tubo = clamp(i, 0, N - 1);
    document.querySelectorAll('[data-tubo]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.tubo === tubo)));
    if (cb.onTube) cb.onTube(tubo);
  }
  function selectLupa2(k) {
    lupa2 = k === 'tanque' ? 'tanque' : 'rot';
    document.querySelectorAll('[data-l2]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l2 === lupa2)));
    if (cb.onLupa2) cb.onLupa2(lupa2);
  }
  function sincronizar() {
    if (!sim) return;
    const b = $('btnBomba'), on = sim.s.bomba;
    b.textContent = on ? 'Apagar la bomba' : 'Encender la bomba'; b.setAttribute('aria-pressed', String(on));
    $('bombaInfo').textContent = on ? 'En marcha' : 'Apagada';
    $('bombaInfo').className = 'pill ' + (on ? 'on' : 'off');
    $('valvInfo').textContent = 'Apertura: ' + vueltasTxt(sim.s.valvula);
    $('btnVaciado').textContent = sim.s.vaciado ? 'Cerrar el vaciado' : 'Abrir el vaciado';
    $('vaciadoInfo').textContent = sim.s.vaciado ? 'Vaciado abierto: el tanque se desocupa' : 'Vaciado cerrado: el tanque acumula el agua';
    if (cb.onChange) cb.onChange();
  }

  /* ---------- cronómetro ---------- */
  const crono = { corre: false, t0: 0, acum: 0 };
  function cronoTxt(ms) { const cs = Math.floor(ms / 10), s = Math.floor(cs / 100); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')},${String(cs % 100).padStart(2, '0')}`; }
  function cronoMs() { return crono.acum + (crono.corre ? performance.now() - crono.t0 : 0); }
  function enlazarCrono() {
    $('cronoGo').addEventListener('click', () => {
      if (crono.corre) { crono.acum += performance.now() - crono.t0; crono.corre = false; anotar(`Cronómetro detenido en ${cronoTxt(crono.acum)}`, 'crono'); }
      else { crono.t0 = performance.now(); crono.corre = true; anotar('Cronómetro en marcha', 'crono'); }
      $('cronoGo').textContent = crono.corre ? 'Detener' : 'Iniciar';
    });
    $('cronoReset').addEventListener('click', () => { crono.corre = false; crono.acum = 0; $('cronoGo').textContent = 'Iniciar'; });
  }

  /* ---------- bucle ---------- */
  let ult = 0, guardadoT = 0;
  function cuadro(ahora) {
    const dt = ult ? Math.min((ahora - ult) / 1000, 900) : 0; ult = ahora;
    if (sim && dt > 0) {
      sim.paso(dt);
      while (sim.eventos.length) { const e = sim.eventos.shift(); anotar(e.msg, e.tipo); }
      L = sim.lecturas();
      animar(Math.min(dt, 0.1), ahora);
    }
    if (ctx) dibujar(ahora);
    if (lupas.lupaM && lupas.lupaM.w) lupaManometro(lupas.lupaM);
    if (lupas.lupaR && lupas.lupaR.w) (lupa2 === 'rot' ? lupaRotametro : lupaTanque)(lupas.lupaR);
    if (L) {
      $('dispT').textContent = `${coma(L.Tagua, 1)} °C`;
      $('dispAmb').textContent = `${coma(L.Tamb, 1)} °C`;
      $('dispP').textContent = `${coma(L.Patm, 1)} hPa`;
      $('dispHR').textContent = `${Math.round(L.HR)} %`;
    }
    $('crono').textContent = cronoTxt(cronoMs());
    if (cb.onChange && ahora - guardadoT > 5000) { guardadoT = ahora; cb.onChange(); }
    requestAnimationFrame(cuadro);
  }

  function init(opciones) {
    cb = opciones || {};
    cv = $('bench'); ctx = cv.getContext('2d');
    leerColores();
    const lm = prepLupa('lupaM', 'miniM'), lr = prepLupa('lupaR', 'miniR');
    const re = () => { tamCanvas(); tamLupa(lm); tamLupa(lr); };
    re();
    if (window.ResizeObserver) new ResizeObserver(re).observe(cv.parentElement); else window.addEventListener('resize', re);
    window.addEventListener('resize', re);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', leerColores);
    new MutationObserver(leerColores).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(leerColores);
    enlazarCanvas();
    enlazarLupa(lm, (d, u) => { ojoM = clamp(ojoM + (u === 'px' ? d / M_MAN : d), E.escala.tuboMin, E.escala.tuboMax); },
      (f) => { ojoM = clamp(Math.round(E.escala.tuboMax - f * (E.escala.tuboMax - E.escala.tuboMin)), E.escala.tuboMin, E.escala.tuboMax); });
    enlazarLupa(lr, (d, u) => {
      if (lupa2 === 'rot') ojoR = clamp(ojoR + (u === 'px' ? d / M_ROT : d), 0, E.rot.largo);
      else ojoT = clamp(ojoT + (u === 'px' ? d / M_TQ : d), 0, E.tanque.rebose * E.tanque.mmPorL);
    }, (f) => {
      if (lupa2 === 'rot') ojoR = clamp((1 - f) * E.rot.largo, 0, E.rot.largo);
      else ojoT = clamp((1 - f) * E.tanque.rebose * E.tanque.mmPorL, 0, E.tanque.rebose * E.tanque.mmPorL);
    });
    document.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => {
      const [cual, d] = b.dataset.mover.split(':'), k = +d;
      if (cual === 'm') ojoM = clamp(ojoM + k, E.escala.tuboMin, E.escala.tuboMax);
      else if (lupa2 === 'rot') ojoR = clamp(ojoR + k * 1.3, 0, E.rot.largo);
      else ojoT = clamp(ojoT + k, 0, E.tanque.rebose * E.tanque.mmPorL);
    }));
    document.querySelectorAll('[data-tubo]').forEach((b) => b.addEventListener('click', () => selectTube(+b.dataset.tubo)));
    document.querySelectorAll('[data-l2]').forEach((b) => b.addEventListener('click', () => selectLupa2(b.dataset.l2)));
    $('btnBomba').addEventListener('click', () => setBomba(!sim.s.bomba));
    document.querySelectorAll('[data-dv]').forEach((b) => b.addEventListener('click', () => {
      const d = b.dataset.dv;
      setValvula(d === 'cerrar' ? 0 : d === 'abrir' ? E.valvula.vueltas : sim.s.valvula + Number(d));
    }));
    document.querySelectorAll('[data-golpe]').forEach((b) => b.addEventListener('click', () => golpear(+b.dataset.golpe)));
    $('btnApretar').addEventListener('click', apretar);
    $('btnVaciado').addEventListener('click', () => setVaciado(!sim.s.vaciado));
    enlazarCrono();
    selectTube(0); selectLupa2('rot');
    requestAnimationFrame(cuadro);
  }
  function setBanco(n, guardado, logGuardado) {
    nBanco = n; sim = V.Simulador(n, guardado);
    particulas.length = 0; gotas.length = 0; salientes.length = 0; charco = 0; prevVivas = null;
    log.length = 0; if (Array.isArray(logGuardado)) logGuardado.forEach((e) => log.push(e));
    if (guardado && typeof guardado.t0Reloj === 'number') t0Reloj = guardado.t0Reloj; else t0Reloj = Date.now();
    L = sim.lecturas(); pintarLog(); sincronizar();
  }
  return {
    init, setBanco, selectTube, selectLupa2, anotar, vueltasTxt,
    get sim() { return sim; }, get banco() { return nBanco; }, get log() { return log.slice(); }, get tubo() { return tubo; },
    guardable() { return sim ? Object.assign(sim.guardable(), { t0Reloj }) : null; },
    // Posición de la vista de las lupas (para pruebas automáticas).
    ojo(cual, v) { if (cual === 'm') ojoM = v; else if (cual === 'r') ojoR = V.mmRot(v); else ojoT = v * E.tanque.mmPorL; },
    lecturas() { return L; },
  };
})();
