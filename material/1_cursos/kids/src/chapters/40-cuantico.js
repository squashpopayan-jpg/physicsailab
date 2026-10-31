/* Capítulo 40 — El mundo cuántico */
(function () {
  'use strict';
  const FK = window.FK, D = FK.d, M = FK.M, C = FK.calc;

  /* ---------- Efecto fotoeléctrico ---------- */
  const METAL = { cesio: ['Cesio', 2.1, '#E8C07A'], sodio: ['Sodio', 2.3, '#D8D8E8'], zinc: ['Zinc', 4.3, '#9AA3BC'], cobre: ['Cobre', 4.7, '#C9772B'] };
  FK.sim('fotoelectrico', function (g) {
    const ctx = g.canvas(2.3);
    g.choice('m', { label: 'Metal', icon: '🔩', options: Object.keys(METAL).map((k) => [k, METAL[k][0] + ' (' + METAL[k][1] + ' eV)']), value: 'zinc' });
    g.slider('l', { label: 'Color de la luz (longitud de onda)', icon: '🌈', min: 200, max: 750, step: 5, value: 650, unit: 'nm', fmt: (v) => FK.n(v, 0) });
    g.slider('i', { label: 'Intensidad (cuántos fotones)', icon: '💡', min: 0, max: 100, step: 5, value: 60, unit: '%', fmt: (v) => FK.n(v, 0) });
    g.out('E', 'Energía de cada fotón', { icon: '⚡', hl: true }); g.out('KE', 'Energía de los electrones', { icon: '🏃' }); g.out('ph', 'Electrones por segundo', { icon: '🔋' });
    const S = { el: [], acc: 0, noe: 0, yes: 0 };
    g.run({
      init() { S.el = []; S.noe = S.yes = 0; g.say('La luz llega al metal. ¿Saldrán electrones? Depende del color, no de la intensidad.'); },
      step(dt) {
        const E = C.photonEnergy(g.p.l), phi = METAL[g.p.m][1], KE = Math.max(0, E - phi), rate = KE > 0 ? g.p.i * 0.4 : 0;
        g.show('E', FK.n(E, 2) + ' eV (metal pide ' + FK.n(phi, 1) + ')'); g.show('KE', KE > 0 ? FK.n(KE, 2) + ' eV' : '— no salen —'); g.show('ph', FK.n(rate, 0));
        S.acc += rate * dt; while (S.acc >= 1) { S.acc -= 1; S.el.push({ x: M.rnd(250, 520), y: 250, vy: -60 - KE * 60, t: 0 }); }
        S.el.forEach((e) => { e.y += e.vy * dt; e.t += dt; }); S.el = S.el.filter((e) => e.y > -20);
        if (KE <= 0 && g.p.i >= 80) S.noe += dt; if (KE > 0 && g.p.i <= 30 && g.p.i > 0) S.yes += dt;
        if (S.noe > 1.2 && S.yes > 1.2 && !g.won()) g.win('¡Descubierto! Mucha luz roja no saca electrones, pero poquita luz ultravioleta sí: la energía de cada fotón es lo que cuenta.');
      },
      draw(c, W, H) {
        D.sky(c, W, H, '#1B1850', '#2A2560');
        D.box(c, 200, 260, 400, 50, METAL[g.p.m][2], { r: 8 }); D.text(c, METAL[g.p.m][0], 400, 286, { size: 18, align: 'center', weight: 700 });
        const col = g.p.l < 380 ? '#B678FF' : D.wave(g.p.l), n = Math.round(g.p.i / 12);
        for (let i = 0; i < n; i++) { const t = ((g.t * 0.9 + i * 0.27) % 1); D.circle(c, 160 + i * 52 + t * 80, 40 + t * 215, 6, col, '#fff', 1.5); }
        D.text(c, g.p.l < 380 ? 'ultravioleta (invisible)' : 'luz visible', 20, 24, { size: 14, color: col, weight: 700 });
        S.el.forEach((e) => D.circle(c, e.x, e.y, 5, '#3DE0FF', '#fff', 1.5));
        D.char(c, 'quarki', W - 60, 60, 70, S.el.length ? 'wow' : 'think');
      }
    });
  });

  /* ---------- Hidrógeno: niveles y colores ---------- */
  FK.sim('niveles-hidrogeno', function (g) {
    const ctx = g.canvas(2.2);
    g.choice('ni', { label: 'Salta desde el nivel', icon: '⬆️', options: [3, 4, 5, 6].map((n) => [n, String(n)]), value: 3, onchange: () => fix() });
    g.choice('nf', { label: 'Hasta el nivel', icon: '⬇️', options: [1, 2, 3, 4, 5].map((n) => [n, String(n)]), value: 2, onchange: () => fix() });
    g.button('⚡ ¡Saltar!', () => jump(), { kind: 'primary' });
    g.out('l', 'Longitud de onda', { icon: '〰️', hl: true }); g.out('E', 'Energía del fotón', { icon: '⚡' }); g.out('c', 'Colores logrados', { icon: '🌈' });
    const S = { t: 0, seen: new Set(), emit: null };
    const fix = () => { if (g.p.nf >= g.p.ni) g.setChoice('nf', g.p.ni - 1); };
    function jump() {
      if (g.p.nf >= g.p.ni) { g.say('El electrón solo emite luz si baja a un nivel menor.', 'think'); return; }
      const nm = C.hydrogenLambda(g.p.ni, g.p.nf), E = C.photonEnergy(nm); S.emit = { nm, t: 0, E }; S.t = 0; FK.sfx.pop();
      g.show('l', FK.n(nm, 0) + ' nm ' + (nm < 380 ? '(ultravioleta)' : nm > 750 ? '(infrarrojo)' : '(visible)')); g.show('E', FK.n(E, 2) + ' eV');
      if (nm >= 380 && nm <= 750) { S.seen.add(Math.round(nm / 30)); g.say(`¡Luz visible de ${FK.n(nm, 0)} nm! ${nm > 620 ? 'Roja' : nm > 560 ? 'Amarilla' : nm > 490 ? 'Verde' : nm > 450 ? 'Azul' : 'Violeta'}.`, 'wow'); } else g.say(`Fotón de ${FK.n(nm, 0)} nm: ${nm < 380 ? 'ultravioleta, ¡no lo ves!' : 'infrarrojo, ¡no lo ves!'}`, 'happy');
      g.show('c', S.seen.size + ' de 3'); if (S.seen.size >= 3 && !g.won()) g.win('¡Tres colores del hidrógeno! Cada salto emite un color distinto: una «huella» del átomo.');
    }
    g.run({
      init() { S.seen.clear(); S.emit = null; g.show('l', '—'); g.show('E', '—'); g.show('c', '0 de 3'); g.say('Escoge desde qué nivel baja el electrón y a cuál. Busca rojo, azul-verde y violeta (nivel final 2).'); },
      step(dt) { if (S.emit) S.emit.t += dt; },
      draw(c, W, H) {
        D.night(c, W, H, 31, 40);
        const x0 = 90, base = H - 40, Y = (n) => base - (1 - 1 / (n * n)) * (H - 90) * 1.05;
        for (let n = 1; n <= 6; n++) { const y = Y(n); D.line(c, x0, y, x0 + 260, y, n === g.p.ni ? '#FFE066' : n === g.p.nf ? '#12B76A' : 'rgba(255,255,255,.5)', 3); D.text(c, 'n = ' + n, x0 - 10, y, { size: 13, align: 'right', color: '#fff' }); D.text(c, FK.n(C.hydrogenLevel(n), 2) + ' eV', x0 + 266, y, { size: 12, color: '#B9B3E6' }); }
        const el = S.emit; const ey = el && el.t < 0.5 ? M.lerp(Y(g.p.ni), Y(g.p.nf), M.smooth(el.t / 0.5)) : Y(el ? g.p.nf : g.p.ni);
        D.circle(c, x0 + 130, ey, 11, '#3D9BFF', '#fff', 3); D.text(c, 'e⁻', x0 + 130, ey, { size: 12, align: 'center', color: '#fff' });
        if (el) { const col = el.nm < 380 ? '#B678FF' : el.nm > 750 ? '#FF4757' : D.wave(el.nm); const t = Math.min(1, el.t / 1.5); c.beginPath(); for (let x = 0; x < t * 330; x += 3) { const yy = (Y(g.p.ni) + Y(g.p.nf)) / 2 + Math.sin(x * M.TAU / Math.min(60, Math.max(14, el.nm / 12)) - el.t * 8) * 16; x ? c.lineTo(x0 + 290 + x, yy) : c.moveTo(x0 + 290, yy); } c.strokeStyle = col; c.lineWidth = 6; c.stroke(); D.text(c, `${FK.n(el.nm, 0)} nm`, x0 + 470, (Y(g.p.ni) + Y(g.p.nf)) / 2 - 36, { size: 20, align: 'center', color: col, weight: 700 }); }
        D.char(c, 'quarki', W - 56, H - 40, 60, 'happy');
      }
    });
  });

  /* ---------- Doble rendija ---------- */
  FK.sim('doble-rendija', function (g) {
    const ctx = g.canvas(2.2);
    g.toggle('obs', { label: '👁️ Observar por cuál rendija pasa', value: false, reset: true });
    g.slider('lam', { label: 'Longitud de onda del electrón', icon: '〰️', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => FK.n(v, 1) + ' ×' , reset: true });
    g.button('Disparar 20', () => fire(20), { icon: '⚛️' }); g.button('Disparar 200', () => fire(200), { icon: '⚛️', kind: 'ghost' });
    g.out('n', 'Electrones en la pantalla', { icon: '⚛️', hl: true }); g.out('m', 'Modo', { icon: '🔬' });
    const S = { dots: [], bins: new Array(60).fill(0), n: { on: 0, off: 0 } };
    const prof = (y) => { /* y en [-1,1] */ const lam = g.p.lam; if (g.p.obs) { const a = Math.exp(-Math.pow((y - 0.25) / 0.2, 2)), b = Math.exp(-Math.pow((y + 0.25) / 0.2, 2)); return (a + b) / 2; } return C.doubleSlit(y * 6, lam, 1.2, 0.35) ; };
    function fire(k) { let made = 0, tries = 0; while (made < k && tries < k * 200) { tries++; const y = M.rnd(-1, 1); if (Math.random() < prof(y)) { S.dots.push([M.rnd(0, 1), y]); S.bins[Math.min(59, Math.floor(((y + 1) / 2) * 60))]++; made++; } } if (S.dots.length > 4000) S.dots = S.dots.slice(-4000); FK.sfx.tick(); g.show('n', S.dots.length); S.n[g.p.obs ? 'on' : 'off'] += made; if (S.n.on >= 150 && S.n.off >= 150 && !g.won()) g.win('¡Sorprendente! Sin observar: franjas de onda. Observando: dos montones de partículas.'); }
    g.run({
      init() { S.dots = []; S.bins = new Array(60).fill(0); g.show('n', 0); g.show('m', g.p.obs ? 'observando la rendija' : 'sin observar'); g.say(g.p.obs ? 'Ahora «sabemos» por cuál rendija pasa cada electrón.' : 'Dispara electrones y mira cómo se acumulan en la pantalla.'); },
      draw(c, W, H) {
        D.night(c, W, H, 37, 20);
        D.emoji(c, '🔫', 40, H / 2, 40); D.text(c, 'electrones uno por uno', 100, H / 2 + 38, { size: 12, color: '#B9B3E6', align: 'center' });
        c.fillStyle = '#8A8AB0'; c.fillRect(210, 20, 18, H / 2 - 75); c.fillRect(210, H / 2 - 35, 18, 70); c.fillRect(210, H / 2 + 55, 18, H / 2 - 75);
        D.text(c, 'dos rendijas', 220, H - 8, { size: 12, align: 'center', color: '#B9B3E6' });
        if (g.p.obs) { D.emoji(c, '👁️', 250, H / 2 - 40, 26); D.emoji(c, '👁️', 250, H / 2 + 40, 26); }
        /* pantalla */
        const sx = 560, sw = 20; D.box(c, sx, 20, sw, H - 40, '#1B1850', { r: 4, stroke: '#fff', lw: 2 });
        S.dots.forEach((d) => { const y = H / 2 + d[1] * (H / 2 - 40); D.circle(c, sx + 4 + d[0] * (sw - 8), y, 1.6, '#FFE066'); });
        /* histograma */
        const hx = sx + 36, mx = Math.max(1, ...S.bins);
        S.bins.forEach((b, i) => { const y = 20 + (i / 60) * (H - 40), h = (b / mx) * 170; c.fillStyle = 'rgba(255,224,102,.8)'; c.fillRect(hx, y, h, (H - 40) / 60 - 1); });
        D.text(c, 'pantalla', sx + 10, 12, { size: 12, align: 'center', color: '#fff' });
        D.char(c, 'quarki', 120, 80, 64, 'happy');
      }
    });
  });
})();
