/* Capítulo 28 — Circuitos */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Conductores y aislantes ---------- */
  FK.sim('conductores', function (g) {
    FK.kit.sort(g, [{ id: 'c', label: 'Conduce', icon: '⚡' }, { id: 'a', label: 'Aísla', icon: '🧱' }], [
      { t: '🪙 Una moneda de cobre', bin: 'c', why: 'El cobre es un metal: conduce muy bien.' },
      { t: '📎 Un clip de acero', bin: 'c', why: 'Los metales conducen.' },
      { t: '🥄 Una cuchara de madera', bin: 'a', why: 'La madera seca es aislante.' },
      { t: '✏️ La mina de un lápiz (grafito)', bin: 'c', why: 'El grafito conduce la electricidad.' },
      { t: '🧴 Una botella de plástico', bin: 'a', why: 'El plástico es aislante.' },
      { t: '🔑 Una llave', bin: 'c', why: 'Las llaves son de metal.' },
      { t: '🧽 Una goma de borrar', bin: 'a', why: 'La goma es aislante.' },
      { t: '🪟 Un vidrio', bin: 'a', why: 'El vidrio no deja pasar corriente.' },
      { t: '🧂 Agua con sal', bin: 'c', why: 'El agua salada tiene iones que llevan la corriente.' },
      { t: '🧶 Un hilo de lana', bin: 'a', why: 'La lana es aislante.' }
    ], { need: 0.8 });
  });

  /* ---------- Constructor de circuitos ---------- */
  const OPT = [['vacio', 'vacío'], ['cable', 'cable'], ['bombillo', 'bombillo'], ['abierto', 'interruptor abierto'], ['cerrado', 'interruptor cerrado'], ['pila', 'pila'], ['goma', 'aislante']];
  const COND = { cable: 1, bombillo: 1, cerrado: 1, pila: 1 };
  FK.sim('constructor-circuito', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('lay', { label: 'Tipo de circuito', icon: '🔀', options: [['serie', 'En serie'], ['par', 'En paralelo']], value: 'serie', onchange: () => g.restart() });
    g.out('est', 'Estado', { icon: '💡', hl: true }); g.out('goal', 'Retos', { icon: '🎯' });
    const S = { s: [], done: { serie: false, par: false } };
    const SL = { serie: [[400, 70], [690, 200], [400, 330], [110, 200]], par: [[110, 200], [330, 90], [520, 90], [330, 310], [520, 310]] };
    const res = () => {
      const s = S.s;
      if (g.p.lay === 'serie') { const closed = s.every((x) => COND[x]) && s.includes('pila'); const bulbs = s.filter((x) => x === 'bombillo').length, cells = s.filter((x) => x === 'pila').length; return { closed, lit: [closed && bulbs > 0 ? M.clamp(Math.pow(cells / bulbs, 2), 0.15, 1) : 0], bulbs }; }
      const bat = s[0] === 'pila'; const A = bat && COND[s[1]] && COND[s[2]] && (s[1] === 'bombillo' || s[2] === 'bombillo'), B = bat && COND[s[3]] && COND[s[4]] && (s[3] === 'bombillo' || s[4] === 'bombillo');
      return { closed: bat && (A || B), lit: [A ? 1 : 0, B ? 1 : 0], A, B };
    };
    g.pointer({
      down(x, y) {
        const pts = SL[g.p.lay]; let k = -1; pts.forEach((p, i) => { if (Math.abs(x - p[0]) < 46 && Math.abs(y - p[1]) < 36) k = i; });
        if (k < 0) return; const i = OPT.findIndex((o) => o[0] === S.s[k]); S.s[k] = OPT[(i + 1) % OPT.length][0]; FK.sfx.tick(); evalGoals();
      }
    });
    function evalGoals() {
      const r = res();
      if (g.p.lay === 'serie') { g.show('est', r.closed ? (r.lit[0] > 0 ? '💡 ¡encendido!' : '✅ cerrado, sin bombillo') : '❌ circuito abierto'); if (r.lit[0] > 0 && !S.done.serie) { S.done.serie = true; FK.sfx.ok(); g.say('¡Se encendió! El camino está completo. Ahora prueba el circuito en paralelo.', 'wow'); } }
      else { g.show('est', r.A && r.B ? '💡💡 los dos encendidos' : r.A ? '💡 solo el de arriba' : r.B ? '💡 solo el de abajo' : '❌ ninguno'); if (((r.A && !r.B && S.s[3] && S.s[3] !== 'vacio') || (r.B && !r.A && S.s[1] && S.s[1] !== 'vacio')) && !S.done.par) { S.done.par = true; FK.sfx.ok(); g.say('¡Uno encendido y el otro apagado, y cada uno en su propio camino! Eso es un circuito en paralelo.', 'wow'); } }
      g.show('goal', (S.done.serie ? '✅' : '⬜') + ' serie · ' + (S.done.par ? '✅' : '⬜') + ' paralelo');
      if (S.done.serie && S.done.par && !g.won()) g.win('¡Dominas los circuitos! En serie un solo camino, en paralelo varios.');
    }
    g.run({
      init() { S.s = g.p.lay === 'serie' ? ['pila', 'vacio', 'vacio', 'vacio'] : ['pila', 'vacio', 'vacio', 'vacio', 'vacio']; g.say(g.p.lay === 'serie' ? 'Toca los cuadros vacíos para poner cables y un bombillo y cerrar el camino.' : 'Pon un bombillo en cada rama. Luego «apaga» una rama con un interruptor abierto o un aislante.'); evalGoals(); },
      draw(c, W, H) {
        D.night(c, W, H, 6, 30);
        const pts = SL[g.p.lay], r = res(), t = g.t;
        const wire = '#FFC21A', dim = 'rgba(255,255,255,.25)';
        const path = (arr, on) => { c.beginPath(); arr.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = on ? wire : dim; c.lineWidth = 6; c.lineJoin = 'round'; c.stroke(); };
        const dots = (arr, on) => { if (!on) return; let L = 0; const seg = []; for (let i = 0; i < arr.length - 1; i++) { const d = Math.hypot(arr[i + 1][0] - arr[i][0], arr[i + 1][1] - arr[i][1]); seg.push(d); L += d; } for (let k = 0; k < 14; k++) { let s = ((k / 14) * L + t * 70) % L, i = 0; while (s > seg[i]) { s -= seg[i]; i++; } const a = arr[i], b = arr[i + 1], f = s / seg[i]; D.circle(c, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 4, '#3DE0FF'); } };
        if (g.p.lay === 'serie') {
          const loop = [[110, 70], [690, 70], [690, 330], [110, 330], [110, 70]]; path(loop, r.closed); dots(loop, r.closed);
        } else {
          const top = [[110, 200], [110, 90], [690, 90], [690, 200]], bot = [[110, 200], [110, 310], [690, 310], [690, 200]];
          path(top, r.A); path(bot, r.B); dots(top, r.A); dots(bot, r.B);
          D.text(c, 'rama A', 640, 70, { size: 14, color: '#fff' }); D.text(c, 'rama B', 640, 335, { size: 14, color: '#fff' });
        }
        pts.forEach((p, i) => {
          const kind = S.s[i] || 'vacio'; D.box(c, p[0] - 44, p[1] - 30, 88, 60, 'rgba(26,22,80,.92)', { r: 12, lw: 3, stroke: kind === 'vacio' ? '#fff' : '#FFC21A' });
          const cx = p[0], cy = p[1];
          if (kind === 'cable') D.line(c, cx - 36, cy, cx + 36, cy, '#FFC21A', 8);
          else if (kind === 'bombillo') { const lit = g.p.lay === 'serie' ? r.lit[0] : (i <= 2 ? (r.A ? 1 : 0) : (r.B ? 1 : 0)); if (lit > 0) { c.fillStyle = `rgba(255,240,120,${0.2 + 0.5 * lit})`; c.beginPath(); c.arc(cx, cy, 40, 0, M.TAU); c.fill(); } D.emoji(c, lit > 0 ? '💡' : '🔅', cx, cy, 36); }
          else if (kind === 'abierto') { D.line(c, cx - 36, cy, cx - 10, cy, '#FFC21A', 6); D.line(c, cx - 10, cy, cx + 20, cy - 24, '#FFC21A', 6); D.line(c, cx + 26, cy, cx + 36, cy, '#FFC21A', 6); }
          else if (kind === 'cerrado') { D.line(c, cx - 36, cy, cx + 36, cy, '#12B76A', 8); D.circle(c, cx, cy, 6, '#fff'); }
          else if (kind === 'pila') { D.box(c, cx - 26, cy - 14, 52, 28, '#FF8A1F', { r: 5, lw: 2 }); D.text(c, '+', cx + 14, cy, { size: 20, align: 'center', color: '#fff', weight: 700 }); D.text(c, '−', cx - 14, cy, { size: 22, align: 'center', color: '#fff', weight: 700 }); }
          else if (kind === 'goma') D.box(c, cx - 22, cy - 18, 44, 36, '#8A4A2A', { r: 6, lw: 2 });
          else D.text(c, '+ toca', cx, cy, { size: 15, align: 'center', color: '#B9B3E6' });
          D.text(c, (OPT.find((o) => o[0] === kind) || OPT[0])[1], cx, cy + 40, { size: 11, align: 'center', color: '#fff' });
        });
        D.char(c, 'chispa', W - 60, 40, 60, r.closed ? 'wow' : 'happy');
      }
    });
  });
})();
