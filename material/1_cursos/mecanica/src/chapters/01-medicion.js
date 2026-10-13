/* Capítulo 1 — Física y medición */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;

  /* ======================================================================
     1.2  Escalas del universo (órdenes de magnitud)
     ====================================================================== */
  const SCALES = {
    L: {
      unit: 'm', name: 'Longitud', items: [
        [1.7e-15, 'Diámetro de un protón'], [1.4e-14, 'Núcleo de un átomo de oro'], [1.1e-10, 'Átomo de hidrógeno'],
        [2e-9, 'Ancho de la doble hélice de ADN'], [1e-7, 'Virus de la influenza'], [5.5e-7, 'Longitud de onda de la luz verde'],
        [2e-6, 'Bacteria E. coli'], [7.5e-6, 'Glóbulo rojo'], [7e-5, 'Grosor de un cabello'], [5e-4, 'Grano de arena'],
        [5e-3, 'Hormiga'], [2.4e-2, 'Moneda (diámetro)'], [0.22, 'Balón de fútbol'], [1.7, 'Estatura de una persona'],
        [18, 'Bus articulado'], [105, 'Cancha de fútbol'], [828, 'Edificio más alto del mundo'], [8849, 'Altura del monte Everest'],
        [1.8e6, 'Colombia de norte a sur'], [1.27e7, 'Diámetro de la Tierra'], [3.84e8, 'Distancia Tierra–Luna'],
        [1.39e9, 'Diámetro del Sol'], [1.5e11, 'Distancia Tierra–Sol (1 UA)'], [4.5e12, 'Distancia Sol–Neptuno'],
        [9.46e15, 'Un año luz'], [4.0e16, 'Estrella más cercana (Próxima Centauri)'], [9.5e20, 'Diámetro de la Vía Láctea'],
        [2.4e22, 'Distancia a la galaxia de Andrómeda'], [8.8e26, 'Universo observable (diámetro)']
      ]
    },
    Mm: {
      unit: 'kg', name: 'Masa', items: [
        [9.11e-31, 'Electrón'], [1.67e-27, 'Protón'], [3.0e-26, 'Molécula de agua'], [1.1e-22, 'Molécula de hemoglobina'],
        [6e-19, 'Virus de la influenza'], [1e-15, 'Bacteria E. coli'], [2.7e-14, 'Glóbulo rojo'], [1.7e-7, 'Grano de arena'],
        [2.5e-6, 'Mosquito'], [7e-3, 'Moneda'], [0.15, 'Manzana'], [70, 'Persona adulta'], [1.3e3, 'Automóvil'],
        [1.5e5, 'Ballena azul'], [5.75e5, 'Avión Airbus A380 (al despegar)'], [6e9, 'Gran pirámide de Guiza'],
        [7.35e22, 'Luna'], [5.97e24, 'Tierra'], [1.9e27, 'Júpiter'], [1.99e30, 'Sol'], [2e42, 'Vía Láctea'],
        [1.5e53, 'Materia ordinaria del universo observable']
      ]
    },
    T: {
      unit: 's', name: 'Tiempo', items: [
        [3e-23, 'La luz atraviesa un núcleo'], [1.8e-15, 'Una oscilación de la luz verde'], [3.3e-10, 'Ciclo de reloj de un procesador de 3 GHz'],
        [2.2e-6, 'Vida media de un muón'], [1.7e-3, 'Aleteo de un mosquito'], [0.3, 'Parpadeo'], [0.86, 'Latido del corazón'],
        [9.58, 'Récord mundial de 100 m'], [5.4e3, 'Un partido de fútbol'], [8.64e4, 'Un día'], [3.16e7, 'Un año'],
        [2.4e9, 'Vida humana (75 años)'], [1.4e11, 'Desde las pirámides de Egipto'], [9.5e12, 'Existencia del Homo sapiens'],
        [2.1e15, 'Desde la extinción de los dinosaurios'], [1.43e17, 'Edad de la Tierra'], [4.35e17, 'Edad del universo']
      ]
    }
  };
  const PREF = { '-18': 'a', '-15': 'f', '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', '0': '', '3': 'k', '6': 'M', '9': 'G', '12': 'T', '15': 'P', '18': 'E' };

  MC.defineSim('escalas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    let cur = 0;
    sim.group('Magnitud');
    sim.seg('q', { options: [['L', 'Longitud'], ['Mm', 'Masa'], ['T', 'Tiempo']], value: 'L', onInput: () => { const it = SCALES[sim.p.q].items; sim.ctl.n.range(Math.floor(Math.log10(it[0][0])) - 1, Math.ceil(Math.log10(it[it.length - 1][0])) + 1, 0.01); jump(0, true); } });
    sim.group('Recorrido');
    sim.slider('n', { label: 'Exponente <i>n</i> (potencia de diez)', min: -16, max: 28, step: 0.01, value: 0.23, fmt: (v) => MC.fix(v, 2) });
    sim.button('◀ Anterior', () => jump(-1));
    sim.button('Siguiente ▶', () => jump(1));
    let stop = null;
    sim.button('Viaje completo', () => {
      if (stop) stop();
      const it = SCALES[sim.p.q].items;
      const a = Math.log10(it[0][0]), b = Math.log10(it[it.length - 1][0]);
      stop = MC.tween(14, (p) => { sim.ctl.n.set(a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * p)), true); sim.redraw(); }, () => { stop = null; });
    }, { icon: 'play', newRow: true });
    sim.out('obj', 'Objeto más cercano', { hl: true });
    sim.out('val', 'Valor');
    sim.out('sci', 'Notación científica');
    sim.out('ord', 'Orden de magnitud');
    function nearest() {
      const it = SCALES[sim.p.q].items;
      let best = 0, bd = Infinity;
      it.forEach((x, i) => { const d = Math.abs(Math.log10(x[0]) - sim.p.n); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function jump(dir, abs) {
      const it = SCALES[sim.p.q].items;
      if (abs) cur = dir; else cur = M.clamp(nearest() + dir, 0, it.length - 1);
      if (stop) { stop(); stop = null; }
      const from = sim.p.n, to = Math.log10(it[cur][0]);
      if (abs) { sim.ctl.n.set(to); return; }
      stop = MC.tween(0.6, (p) => { sim.ctl.n.set(from + (to - from) * (1 - Math.pow(1 - p, 3)), true); sim.redraw(); }, () => { stop = null; });
    }
    const pinch = (v, u) => {
      /* valor con prefijo SI razonable */
      if (u !== 's') return MC.si(v, u, 3);
      return MC.si(v, 's', 3);
    };
    sim.onDraw(() => {
      const S = SCALES[sim.p.q], it = S.items;
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      D.clear(cv);
      const n = sim.p.n;
      const span = Math.max(5, Math.min(9, w / 110));
      const a = n - span / 2, b = n + span / 2;
      const X = (lg) => 30 + ((lg - a) / (b - a)) * (w - 60);
      const axY = h * 0.72;
      /* bandas por década */
      for (let d = Math.floor(a); d <= Math.ceil(b); d++) {
        const x1 = X(d), x2 = X(d + 1);
        if (d % 2 === 0) { ctx.fillStyle = MC.alpha('--grid', 0.9); ctx.fillRect(x1, 36, x2 - x1, axY - 36); }
      }
      D.line(ctx, 10, axY, w - 10, axY, { color: '--axis', width: 1.5 });
      for (let d = Math.floor(a); d <= Math.ceil(b); d++) {
        const x = X(d);
        if (x < 8 || x > w - 8) continue;
        D.line(ctx, x, axY - 6, x, axY + 6, { color: '--axis', width: 1.3 });
        for (let k = 2; k <= 9; k++) { const xm = X(d + Math.log10(k)); if (xm > 8 && xm < w - 8) D.line(ctx, xm, axY - 2.5, xm, axY + 2.5, { color: '--axis', width: 1 }); }
        MC.text(ctx, `10^{${MC.minus(d)}}`, x, axY + 22, { size: 12, mono: true, align: 'center', color: '--ink-2' });
        const e3 = Math.floor(d / 3) * 3;
        if (d % 3 === 0 && PREF[String(d)] !== undefined && S.unit !== 'kg') MC.text(ctx, `1 ${PREF[String(d)]}${S.unit}`, x, axY + 38, { size: 10.5, mono: true, align: 'center', color: '--ink-3' });
        if (S.unit === 'kg' && (d + 3) % 3 === 0 && PREF[String(d + 3)] !== undefined) MC.text(ctx, `1 ${PREF[String(d + 3)]}g`, x, axY + 38, { size: 10.5, mono: true, align: 'center', color: '--ink-3' });
        void e3;
      }
      /* objetos visibles */
      const vis = it.map((x, i) => ({ x, i, lg: Math.log10(x[0]) })).filter((o) => o.lg >= a - 0.1 && o.lg <= b + 0.1);
      const near = nearest();
      let lastX = [-1e9, -1e9, -1e9];
      vis.forEach((o) => {
        const x = X(o.lg);
        const sel = o.i === near;
        const label = o.x[1];
        ctx.font = `${sel ? 600 : 400} 12px ${MC.FONT_UI}`;
        const tw = ctx.measureText(label).width;
        let row = 0;
        for (let r = 0; r < 3; r++) { if (x - tw / 2 > lastX[r] + 10) { row = r; break; } row = 2; }
        lastX[row] = x + tw / 2;
        const ly = axY - 34 - row * 34;
        D.line(ctx, x, axY, x, ly + 6, { color: sel ? '--accent' : '--ink-3', width: sel ? 2 : 1 });
        D.circle(ctx, x, axY, sel ? 6 : 4, { fill: sel ? '--accent' : '--c1', color: '--canvas', width: 1.5 });
        MC.text(ctx, label, x, ly, { size: 12, align: 'center', weight: sel ? 600 : 400, color: sel ? '--ink' : '--ink-2', halo: true });
        MC.text(ctx, MC.sci(o.x[0], 2) + ' ' + S.unit, x, ly + 13, { size: 10, mono: true, align: 'center', color: '--ink-3', halo: true });
      });
      /* cursor */
      const cx = X(n);
      D.line(ctx, cx, 40, cx, axY + 8, { color: '--accent', width: 1.2, dash: [4, 3] });
      /* encabezado */
      const val = Math.pow(10, n);
      const human = S.unit === 's' ? MC.time(val) : (val < 1e-15 || val >= 1e19) ? '' : S.unit === 'kg' ? MC.si(val * 1000, 'g', 3) : MC.si(val, S.unit, 3);
      MC.text(ctx, `10^{${MC.fix(n, 2)}} ${S.unit}` + (human ? `   ≈   ${human}` : ''), 14, 26, { size: 15, mono: true, color: '--ink', weight: 600 });
      /* barra de vista general */
      const oy = h - 16, ox0 = 30, ox1 = w - 30;
      const A = Math.log10(it[0][0]) - 1, B = Math.log10(it[it.length - 1][0]) + 1;
      const OX = (lg) => ox0 + ((lg - A) / (B - A)) * (ox1 - ox0);
      ctx.fillStyle = MC.col('--surface-2');
      ctx.fillRect(ox0, oy - 5, ox1 - ox0, 10);
      ctx.fillStyle = MC.alpha('--accent', 0.25);
      ctx.fillRect(OX(a), oy - 7, OX(b) - OX(a), 14);
      it.forEach((x) => D.line(ctx, OX(Math.log10(x[0])), oy - 4, OX(Math.log10(x[0])), oy + 4, { color: '--c1', width: 1 }));
      MC.text(ctx, `10^{${MC.minus(Math.round(A))}}`, ox0, oy - 9, { size: 9.5, mono: true, color: '--ink-3' });
      MC.text(ctx, `10^{${Math.round(B)}}`, ox1, oy - 9, { size: 9.5, mono: true, color: '--ink-3', align: 'right' });
      const o = it[near];
      sim.set('obj', o[1]);
      const vv = o[0];
      sim.set('val', S.unit === 's' ? MC.time(vv) : (vv < 1e-15 || vv >= 1e19) ? MC.sci(vv, 3) + ' ' + S.unit : S.unit === 'kg' ? (vv >= 1 && vv < 1e4 ? MC.sci(vv, 3) + ' kg' : MC.si(vv * 1000, 'g', 3)) : pinch(vv, S.unit));
      sim.set('sci', MC.sci(o[0], 3) + ' ' + S.unit);
      sim.set('ord', '10' + MC.sup(Math.round(Math.log10(o[0]))) + ' ' + S.unit);
    });
  });

  /* ======================================================================
     1.3  Conversor con factores unitarios
     ====================================================================== */
  /* Átomos: [clave, símbolo, átomo SI, potencia del átomo SI, lado unidad, lado SI] ; factor: 1 unidad = k SI */
  const AT = {
    m: { s: 'm', si: 'm', p: 1, k: 1 }, km: { s: 'km', si: 'm', p: 1, k: 1000, pair: ['1 km', '1000 m'] },
    cm: { s: 'cm', si: 'm', p: 1, k: 0.01, pair: ['100 cm', '1 m'] }, mm: { s: 'mm', si: 'm', p: 1, k: 1e-3, pair: ['1000 mm', '1 m'] },
    um: { s: 'µm', si: 'm', p: 1, k: 1e-6, pair: ['10⁶ µm', '1 m'] }, in: { s: 'in', si: 'm', p: 1, k: 0.0254, pair: ['1 in', '0.0254 m'] },
    ft: { s: 'ft', si: 'm', p: 1, k: 0.3048, pair: ['1 ft', '0.3048 m'] }, mi: { s: 'mi', si: 'm', p: 1, k: 1609.344, pair: ['1 mi', '1609.344 m'] },
    s: { s: 's', si: 's', p: 1, k: 1 }, min: { s: 'min', si: 's', p: 1, k: 60, pair: ['1 min', '60 s'] }, h: { s: 'h', si: 's', p: 1, k: 3600, pair: ['1 h', '3600 s'] },
    dia: { s: 'día', si: 's', p: 1, k: 86400, pair: ['1 día', '86 400 s'] }, anio: { s: 'año', si: 's', p: 1, k: 3.156e7, pair: ['1 año', '3.156×10⁷ s'] },
    kg: { s: 'kg', si: 'kg', p: 1, k: 1 }, g: { s: 'g', si: 'kg', p: 1, k: 1e-3, pair: ['1000 g', '1 kg'] }, mg: { s: 'mg', si: 'kg', p: 1, k: 1e-6, pair: ['10⁶ mg', '1 kg'] },
    t: { s: 't', si: 'kg', p: 1, k: 1000, pair: ['1 t', '1000 kg'] }, lb: { s: 'lb', si: 'kg', p: 1, k: 0.45359237, pair: ['1 lb', '0.4536 kg'] },
    arroba: { s: '@', si: 'kg', p: 1, k: 12.5, pair: ['1 @', '12.5 kg'] },
    L: { s: 'L', si: 'm', p: 3, k: 1e-3, pair: ['1000 L', '1 m³'] }, mL: { s: 'mL', si: 'm', p: 3, k: 1e-6, pair: ['10⁶ mL', '1 m³'] },
    gal: { s: 'gal', si: 'm', p: 3, k: 3.785411784e-3, pair: ['1 gal', '3.785×10⁻³ m³'] }, ha: { s: 'ha', si: 'm', p: 2, k: 1e4, pair: ['1 ha', '10⁴ m²'] },
    kn: { s: 'nudo', si: 'm/s', p: 1, k: 0.514444, pair: ['1 nudo', '0.5144 m/s'] },
    Pa: { s: 'Pa', si: 'Pa', p: 1, k: 1 }, kPa: { s: 'kPa', si: 'Pa', p: 1, k: 1000, pair: ['1 kPa', '1000 Pa'] },
    atm: { s: 'atm', si: 'Pa', p: 1, k: 101325, pair: ['1 atm', '101 325 Pa'] }, mmHg: { s: 'mmHg', si: 'Pa', p: 1, k: 133.322, pair: ['1 mmHg', '133.32 Pa'] },
    psi: { s: 'psi', si: 'Pa', p: 1, k: 6894.76, pair: ['1 psi', '6894.8 Pa'] }, bar: { s: 'bar', si: 'Pa', p: 1, k: 1e5, pair: ['1 bar', '10⁵ Pa'] },
    J: { s: 'J', si: 'J', p: 1, k: 1 }, kJ: { s: 'kJ', si: 'J', p: 1, k: 1000, pair: ['1 kJ', '1000 J'] }, cal: { s: 'cal', si: 'J', p: 1, k: 4.186, pair: ['1 cal', '4.186 J'] },
    kcal: { s: 'kcal', si: 'J', p: 1, k: 4186, pair: ['1 kcal', '4186 J'] }, kWh: { s: 'kWh', si: 'J', p: 1, k: 3.6e6, pair: ['1 kWh', '3.6×10⁶ J'] }
  };
  /* Unidades compuestas: lista de [átomo, potencia] */
  const Q = {
    long: { name: 'Longitud', units: { m: [['m', 1]], km: [['km', 1]], cm: [['cm', 1]], mm: [['mm', 1]], 'µm': [['um', 1]], in: [['in', 1]], ft: [['ft', 1]], mi: [['mi', 1]] } },
    area: { name: 'Área', units: { 'm²': [['m', 2]], 'cm²': [['cm', 2]], 'km²': [['km', 2]], ha: [['ha', 1]], 'ft²': [['ft', 2]] } },
    vol: { name: 'Volumen', units: { 'm³': [['m', 3]], L: [['L', 1]], mL: [['mL', 1]], 'cm³': [['cm', 3]], gal: [['gal', 1]] } },
    vel: { name: 'Rapidez', units: { 'm/s': [['m', 1], ['s', -1]], 'km/h': [['km', 1], ['h', -1]], 'mi/h': [['mi', 1], ['h', -1]], 'ft/s': [['ft', 1], ['s', -1]], 'cm/s': [['cm', 1], ['s', -1]], nudo: [['kn', 1]] } },
    acc: { name: 'Aceleración', units: { 'm/s²': [['m', 1], ['s', -2]], 'km/h²': [['km', 1], ['h', -2]], 'ft/s²': [['ft', 1], ['s', -2]], 'cm/s²': [['cm', 1], ['s', -2]] } },
    masa: { name: 'Masa', units: { kg: [['kg', 1]], g: [['g', 1]], mg: [['mg', 1]], t: [['t', 1]], lb: [['lb', 1]], 'arroba (@)': [['arroba', 1]] } },
    dens: { name: 'Densidad', units: { 'kg/m³': [['kg', 1], ['m', -3]], 'g/cm³': [['g', 1], ['cm', -3]], 'g/L': [['g', 1], ['L', -1]], 'kg/L': [['kg', 1], ['L', -1]] } },
    tiempo: { name: 'Tiempo', units: { s: [['s', 1]], min: [['min', 1]], h: [['h', 1]], día: [['dia', 1]], año: [['anio', 1]] } },
    pres: { name: 'Presión', units: { Pa: [['Pa', 1]], kPa: [['kPa', 1]], atm: [['atm', 1]], mmHg: [['mmHg', 1]], psi: [['psi', 1]], bar: [['bar', 1]] } },
    ener: { name: 'Energía', units: { J: [['J', 1]], kJ: [['kJ', 1]], cal: [['cal', 1]], kcal: [['kcal', 1]], kWh: [['kWh', 1]] } }
  };
  const supN = (n) => (n === 1 ? '' : MC.sup(n));

  MC.defineSim('conversor', function (sim) {
    const box = MC.el('div', 'conv-stage');
    sim.stage.append(box);
    sim.group('Magnitud');
    const qOpts = Object.keys(Q).map((k) => [k, Q[k].name]);
    sim.select('q', { label: 'Tipo de magnitud', value: 'vel', options: qOpts, onInput: (v) => { const u = Object.keys(Q[v].units); sim.ctl.from.options(u.map((x) => [x, x]), u[1] || u[0]); sim.ctl.to.options(u.map((x) => [x, x]), u[0]); } });
    sim.number('val', { label: 'Valor', value: 72 });
    const u0 = Object.keys(Q.vel.units);
    sim.select('from', { label: 'De la unidad', value: 'km/h', options: u0.map((x) => [x, x]) });
    sim.select('to', { label: 'A la unidad', value: 'm/s', options: u0.map((x) => [x, x]) });
    sim.button('⇄ Invertir', () => { const a = sim.p.from, b = sim.p.to; sim.ctl.from.set(b, true); sim.ctl.to.set(a); });
    sim.out('res', 'Resultado', { hl: true });
    sim.out('fac', 'Factor total');
    sim.presets([
      { id: 'kmh', label: '72 km/h en m/s', fn: () => setQ('vel', 72, 'km/h', 'm/s') },
      { id: 'luz', label: 'Rapidez de la luz en km/h', fn: () => setQ('vel', 299792458, 'm/s', 'km/h') },
      { id: 'agua', label: 'Densidad del agua: 1 g/cm³ en kg/m³', fn: () => setQ('dens', 1, 'g/cm³', 'kg/m³') },
      { id: 'cancha', label: 'Cancha de fútbol (105 m × 68 m) en hectáreas', fn: () => setQ('area', 7140, 'm²', 'ha') },
      { id: 'galon', label: 'Un galón de gasolina en litros', fn: () => setQ('vol', 1, 'gal', 'L') },
      { id: 'arroba', label: 'Una arroba en libras', fn: () => setQ('masa', 1, 'arroba (@)', 'lb'), note: 'En las plazas de mercado de Colombia se usa la “libra” de 500 g, así que una arroba son 25 de esas libras.' },
      { id: 'kcal', label: 'Una barra de chocolate (250 kcal) en kJ', fn: () => setQ('ener', 250, 'kcal', 'kJ') },
      { id: 'atm', label: 'Presión atmosférica en mmHg', fn: () => setQ('pres', 1, 'atm', 'mmHg') },
      { id: 'g', label: 'Aceleración de la gravedad en km/h²', fn: () => setQ('acc', 9.8, 'm/s²', 'km/h²') }
    ]);
    function setQ(q, v, a, b) {
      sim.ctl.q.set(q, true);
      sim.ctl.val.set(v, true);
      sim.ctl.from.set(a, true);
      sim.ctl.to.set(b, true);
    }
    function factorHTML(num, den, pw, cancelNum, cancelDen) {
      const wrap = (s, c) => { const i = s.lastIndexOf(' '); const n = s.slice(0, i), u = s.slice(i + 1); return `${n} <span class="${c ? 'cancel' : ''}">${u}</span>`; };
      const f = `<span class="frac"><span>${wrap(num, cancelNum)}</span><span>${wrap(den, cancelDen)}</span></span>`;
      return pw === 1 ? `<span class="fp">${f}</span>` : `<span class="fp">(${f})<sup>${pw}</sup></span>`;
    }
    sim.onDraw(() => {
      const q = Q[sim.p.q];
      const A = q.units[sim.p.from], B = q.units[sim.p.to];
      if (!A || !B) return;
      const v = sim.p.val;
      /* factor total */
      let kA = 1, kB = 1;
      for (const [a, p] of A) kA *= Math.pow(AT[a].k, p);
      for (const [b, p] of B) kB *= Math.pow(AT[b].k, p);
      const res = (v * kA) / kB;
      const bConv = new Set(B.filter(([b]) => AT[b].pair).map(([b]) => AT[b].si));
      const parts = [];
      const unitHTML = (U, cancelAll) => U.map(([a, p]) => {
        const at = AT[a];
        const c = cancelAll === true ? true : cancelAll === 'si' ? (!at.pair && bConv.has(at.si)) || !!at.pair : false;
        return `<span class="${c ? 'cancel' : ''}">${at.s}${supN(Math.abs(p))}</span>`;
      });
      const fmtU = (U, cancelMode) => {
        const num = U.filter((x) => x[1] > 0), den = U.filter((x) => x[1] < 0);
        const n = unitHTML(num, cancelMode).join('·') || '1';
        const d = unitHTML(den, cancelMode).join('·');
        return d ? `${n}/${d}` : n;
      };
      parts.push(`<span>${MC.sci(v, 4)} ${fmtU(A, 'si')}</span>`);
      for (const [a, p] of A) {
        const at = AT[a];
        if (!at.pair) continue;
        const siCancel = bConv.has(at.si);
        /* unidad → SI: (lado SI / lado unidad) */
        if (p > 0) parts.push('<span class="x">×</span>' + factorHTML(at.pair[1], at.pair[0], p, siCancel, true));
        else parts.push('<span class="x">×</span>' + factorHTML(at.pair[0], at.pair[1], -p, true, siCancel));
      }
      for (const [b, p] of B) {
        const at = AT[b];
        if (!at.pair) continue;
        if (p > 0) parts.push('<span class="x">×</span>' + factorHTML(at.pair[0], at.pair[1], p, false, true));
        else parts.push('<span class="x">×</span>' + factorHTML(at.pair[1], at.pair[0], -p, true, false));
      }
      parts.push(`<span class="x">=</span><span class="res">${MC.sci(res, 4)} ${fmtU(B, false)}</span>`);
      box.innerHTML = `<div class="conv-title">${q.name}: de ${sim.p.from} a ${sim.p.to}</div><div class="chain">${parts.join(' ')}</div>` +
        `<div class="conv-note">Cada fracción vale exactamente 1: sólo cambia la forma de escribir la cantidad. Las unidades tachadas se cancelan entre numerador y denominador.</div>`;
      sim.set('res', `${MC.sci(res, 4)} ${sim.p.to}`);
      sim.set('fac', `1 ${sim.p.from} = ${MC.sci(kA / kB, 4)} ${sim.p.to}`);
    });
  });

  /* ======================================================================
     1.4  Análisis dimensional del péndulo
     ====================================================================== */
  MC.defineSim('dimensional', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const G = 9.8;
    /* datos "medidos" (con 1 % de ruido reproducible) */
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const noise = () => 1 + 0.012 * (rnd() + rnd() + rnd() - 1.5);
    const T = (L, g) => 2 * Math.PI * Math.sqrt(L / g);
    const dL = [0.2, 0.4, 0.6, 0.8, 1.0, 1.3, 1.6, 2.0].map((L) => ({ L, m: 0.2, g: G, T: T(L, G) * noise() }));
    const dm = [0.05, 0.1, 0.2, 0.4, 0.8, 1.2].map((m) => ({ L: 1, m, g: G, T: T(1, G) * noise() }));
    const planets = [['Luna', 1.62], ['Marte', 3.71], ['Venus', 8.87], ['Tierra', 9.8], ['Neptuno', 11.15], ['Júpiter', 24.79]];
    const dg = planets.map(([, g]) => ({ L: 1, m: 0.2, g, T: T(1, g) * noise() }));
    const all = dL.concat(dm, dg);
    sim.group('Propuesta: <span class="nt">T = C · Lᵃ · mᵇ · gᶜ</span>');
    const fh = (v) => (Math.abs(v - Math.round(v)) < 1e-9 ? MC.minus(Math.round(v)) : MC.minus((v > 0 ? '' : '-') + (Math.abs(v) === 0.5 ? '1/2' : Math.abs(v) === 1.5 ? '3/2' : MC.fix(Math.abs(v), 1))));
    sim.slider('a', { label: 'Exponente de la longitud <i>a</i>', min: -2, max: 2, step: 0.5, value: 1, fmt: fh });
    sim.slider('b', { label: 'Exponente de la masa <i>b</i>', min: -2, max: 2, step: 0.5, value: 1, fmt: fh });
    sim.slider('c', { label: 'Exponente de la gravedad <i>c</i>', min: -2, max: 2, step: 0.5, value: 0, fmt: fh });
    sim.button('Mostrar solución', () => { sim.ctl.a.set(0.5, true); sim.ctl.b.set(0, true); sim.ctl.c.set(-0.5); });
    sim.note('Datos simulados de un laboratorio: se varía la longitud (con m = 0.2 kg, en la Tierra), la masa (con L = 1 m) y el planeta (con L = 1 m).');
    sim.out('dim', 'Dimensiones de C·Lᵃmᵇgᶜ');
    sim.out('ok', '¿Homogénea con [T]?', { hl: true });
    sim.out('C', 'Mejor valor de C');
    sim.out('rms', 'Desajuste con los datos');
    sim.onDraw(() => {
      const { a, b, c } = sim.p;
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      D.clear(cv);
      const eL = a + c, eM = b, eT = -2 * c;
      const ok = Math.abs(eL) < 1e-9 && Math.abs(eM) < 1e-9 && Math.abs(eT - 1) < 1e-9;
      /* barras de exponentes */
      const top = 14, bh = h * 0.36;
      MC.text(ctx, 'Exponentes de las dimensiones', 16, top + 12, { size: 12, weight: 600, color: '--ink-2' });
      const dims = [['L', eL, 0], ['M', eM, 0], ['T', eT, 1]];
      const bx0 = 40, bw = (w - 60) / 3;
      const Yz = top + 26 + bh / 2, sc = bh / 2 / 3;
      dims.forEach(([n, e, goal], i) => {
        const x = bx0 + i * bw;
        D.line(ctx, x, Yz, x + bw - 30, Yz, { color: '--axis', width: 1 });
        for (let k = -3; k <= 3; k++) { MC.text(ctx, MC.minus(k), x - 6, Yz - k * sc + 3, { size: 9.5, mono: true, align: 'right', color: '--ink-3' }); }
        const good = Math.abs(e - goal) < 1e-9;
        ctx.fillStyle = MC.col(good ? '--vel' : '--c4');
        ctx.globalAlpha = 0.85;
        const ye = Yz - M.clamp(e, -3, 3) * sc;
        ctx.fillRect(x + 14, Math.min(Yz, ye), bw - 58, Math.abs(ye - Yz) || 2);
        ctx.globalAlpha = 1;
        const yg = Yz - goal * sc;
        D.line(ctx, x + 6, yg, x + bw - 36, yg, { color: '--ink', width: 2, dash: [5, 3] });
        MC.text(ctx, `[${n}]`, x + (bw - 30) / 2, top + 26 + bh + 14, { size: 13, align: 'center', weight: 600 });
        MC.text(ctx, `${fh(e)} (meta ${goal})`, x + (bw - 30) / 2, top + 26 + bh + 28, { size: 11, align: 'center', mono: true, color: good ? '--vel' : '--c4' });
      });
      /* ajuste: C por mínimos cuadrados en escala logarítmica */
      let s = 0;
      for (const d of all) s += Math.log(d.T) - a * Math.log(d.L) - b * Math.log(d.m) - c * Math.log(d.g);
      const C = Math.exp(s / all.length);
      const model = (L, m, g) => C * Math.pow(L, a) * Math.pow(m, b) * Math.pow(g, c);
      let err = 0;
      for (const d of all) err += M.sq(Math.log(model(d.L, d.m, d.g) / d.T));
      const rms = Math.sqrt(err / all.length);
      /* tres gráficas */
      const py = top + 26 + bh + 44, ph = h - py - 4, pw = w / 3;
      const sets = [
        { d: dL, x: 'L', lab: ['L', 'm'], xmax: 2.2, f: (x) => model(x, 0.2, G), from: 0.05 },
        { d: dm, x: 'm', lab: ['m', 'kg'], xmax: 1.3, f: (x) => model(1, x, G), from: 0.03 },
        { d: dg, x: 'g', lab: ['g', 'm/s²'], xmax: 26, f: (x) => model(1, 0.2, x), from: 0.8 }
      ];
      sets.forEach((S, i) => {
        const P = new MC.Plot(ctx, { x: i * pw, y: py, w: pw, h: ph, xmin: 0, xmax: S.xmax, ymin: 0, ymax: 6, xlabel: S.lab, ylabel: i === 0 ? ['T', 's'] : '', ml: i === 0 ? 44 : 30, mr: 8, mt: 8, mb: 34 });
        P.frame();
        P.fn(S.f, { color: ok ? '--vel' : '--c4', width: 2, from: S.from });
        P.scatter(S.d.map((d) => d[S.x]), S.d.map((d) => d.T), { color: '--c1', r: 3.5 });
      });
      sim.set('dim', `L${MC.sup(MC.fix(eL, 1).replace('.0', ''))} M${MC.sup(MC.fix(eM, 1).replace('.0', ''))} T${MC.sup(MC.fix(eT, 1).replace('.0', ''))}`.replace(/−/g, '⁻').replace(/\.5/g, '·5'));
      sim.set('ok', ok ? '<span class="goodv">sí: T = C√(L/g)</span>' : '<span class="warnv">no</span>');
      sim.set('C', MC.fix(C, 3) + (ok ? ` ≈ 2π = ${MC.fix(2 * Math.PI, 3)}` : ''));
      sim.set('rms', MC.fix(rms * 100, 1) + ' %');
    });
  });

  /* ======================================================================
     1.5  Mediciones repetidas del periodo de un péndulo
     ====================================================================== */
  MC.defineSim('mediciones', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    const TRUE = 2.0;
    const data = [];
    let last = null;
    sim.group('Cronometrista');
    sim.slider('sig', { label: 'Error aleatorio (tiempo de reacción) σ', min: 0, max: 0.25, step: 0.005, value: 0.08, unit: 's', fmt: (v) => MC.fix(v, 3) });
    sim.slider('bias', { label: 'Error sistemático (se detiene tarde +)', min: -0.3, max: 0.3, step: 0.01, value: 0, unit: 's', fmt: (v) => MC.fix(v, 2) });
    sim.check('ten', { label: 'Cronometrar 10 oscilaciones y dividir entre 10', value: false });
    sim.group('Medir');
    const meas = (n) => {
      for (let i = 0; i < n; i++) {
        const k = sim.p.ten ? 10 : 1;
        const t = (k * TRUE + M.gauss(0, sim.p.sig) + sim.p.bias) / k;
        data.push(t);
        last = t;
      }
    };
    sim.button('Medir 1', () => meas(1), { primary: true });
    sim.button('Medir 10', () => meas(10));
    sim.button('Medir 100', () => meas(100));
    sim.button('Borrar', () => { data.length = 0; last = null; }, { newRow: true });
    sim.out('n', 'Número de mediciones <i>N</i>');
    sim.out('last', 'Última medición');
    sim.out('mean', 'Promedio <i>T̄</i>');
    sim.out('s', 'Desviación estándar <i>s</i>');
    sim.out('se', 'Error estándar <i>s</i>/√<i>N</i>');
    sim.out('res', 'Resultado', { hl: true });
    sim.out('dev', 'Diferencia con el valor verdadero');
    let ang = 0;
    sim.animate((dt) => { ang += dt; }, { button: false, autoplay: true });
    function report(x, u) {
      if (!(u > 0)) return MC.fix(x, 3);
      const e = Math.floor(Math.log10(u));
      const d = u / Math.pow(10, e);
      const sig = d < 2 ? 2 : 1;
      const dec = Math.max(0, -(e - (sig - 1)));
      return `(${x.toFixed(dec)} ± ${u.toFixed(dec)})`;
    }
    sim.onDraw(() => {
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      D.clear(cv);
      /* péndulo decorativo con T = 2 s */
      const px = 70, py = 26, L = Math.min(110, h * 0.42);
      const th = 0.35 * Math.cos((2 * Math.PI * ang) / TRUE);
      D.ceiling(ctx, px - 30, py, px + 30);
      const bx = px + L * Math.sin(th), by = py + L * Math.cos(th);
      D.line(ctx, px, py, bx, by, { color: '--ink-2', width: 1.3 });
      D.ball(ctx, bx, by, 9, { fill: '--body-b' });
      MC.text(ctx, 'T verdadero = 2.000 s', px, py + L + 34, { size: 11.5, mono: true, align: 'center', color: '--ink-2' });
      if (last !== null) MC.text(ctx, `⏱ ${MC.fix(last, 2)} s`, px, py + L + 52, { size: 14, mono: true, align: 'center', color: '--accent', weight: 600 });
      /* histograma */
      const x0 = 150;
      const P = new MC.Plot(ctx, { x: x0, y: 0, w: w - x0, h: h, xmin: 1.5, xmax: 2.5, ymin: 0, ymax: 1, xlabel: ['T', 's'], ylabel: 'número de mediciones', ml: 48, mb: 40, mt: 14 });
      const N = data.length;
      const lo = 1.5, hi = 2.5;
      const bw = sim.p.ten ? 0.005 : 0.02;
      const nb = Math.round((hi - lo) / bw);
      const bins = new Array(nb).fill(0);
      for (const t of data) { const i = Math.floor((t - lo) / bw); if (i >= 0 && i < nb) bins[i]++; }
      const mx = Math.max(4, ...bins);
      P.set({ ymax: MC.niceCeil(mx * 1.15) });
      P.frame();
      P.clip(() => {
        ctx.fillStyle = MC.alpha('--c1', 0.55);
        ctx.strokeStyle = MC.col('--c1');
        bins.forEach((c, i) => {
          if (!c) return;
          const X1 = P.X(lo + i * bw), X2 = P.X(lo + (i + 1) * bw), Y = P.Y(c);
          ctx.fillRect(X1, Y, X2 - X1 - 0.5, P.Y(0) - Y);
        });
      });
      const mean = M.mean(data), s = M.std(data);
      if (N >= 3 && s > 0) P.fn((t) => (N * bw * Math.exp(-0.5 * M.sq((t - mean) / s))) / (s * Math.sqrt(2 * Math.PI)), { color: '--c4', width: 2 });
      P.vline(TRUE, { color: '--ink', dash: [6, 4], label: 'valor verdadero', labelY: 14 });
      if (N) P.vline(mean, { color: '--accent', dash: [], width: 2, label: 'promedio', labelY: 30 });
      if (N >= 2) {
        const se = s / Math.sqrt(N);
        P.band(mean - se, mean + se, { color: '--accent', alpha: 0.18 });
      }
      /* franja de puntos individuales */
      const yb = P.iy + P.ih - 6;
      ctx.fillStyle = MC.alpha('--ink', 0.45);
      data.slice(-300).forEach((t) => { const X = P.X(t); if (X > P.ix && X < P.ix + P.iw) ctx.fillRect(X - 0.5, yb - 4, 1.2, 8); });
      sim.set('n', String(N));
      sim.set('last', last === null ? '—' : MC.fix(last, 3) + ' s');
      sim.set('mean', N ? MC.fix(mean, 4) + ' s' : '—');
      sim.set('s', N >= 2 ? MC.fix(s, 4) + ' s' : '—');
      sim.set('se', N >= 2 ? MC.fix(s / Math.sqrt(N), 4) + ' s' : '—');
      sim.set('res', N >= 2 ? `T = ${report(mean, s / Math.sqrt(N))} s` : '—');
      sim.set('dev', N ? MC.fix(mean - TRUE, 3) + ' s' : '—');
    });
  });
})();
