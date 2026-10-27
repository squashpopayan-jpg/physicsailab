/* Capítulo 34 — Nueva Granada y Colombia: Mutis, Caldas, Garavito */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 34.1 El hipsómetro de Caldas */
  EM.defineSim('hipsometro-caldas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('h', { label: 'Altura del lugar sobre el nivel del mar', min: 0, max: 6500, step: 10, value: 1738, fmt: (v) => v.toFixed(0) + ' m' });
    sim.slider('e', { label: 'Error de lectura del termómetro', min: 0, max: 0.5, step: 0.05, value: 0.1, fmt: (v) => '±' + v.toFixed(2) + ' °C' });
    sim.out('p', 'Presión atmosférica (atmósfera estándar)', { hl: true });
    sim.out('t', 'Temperatura de ebullición del agua');
    sim.out('r', 'Altura recuperada con el termómetro y su incertidumbre');
    sim.note('Caldas llevó un termómetro de precisión y una pequeña olla de ebullición («hipsómetro») en sus viajes y deducía la altura del lugar a partir de la temperatura a la que hierve el agua: el agua hierve cuando su presión de vapor iguala la de la atmósfera, y la presión baja con la altura. El método lo habían propuesto Fahrenheit (1724) y Wollaston; Caldas lo usó junto con el barómetro para medir las alturas de la cordillera, comparando sus resultados con los de Humboldt y de los académicos franceses. A razón de 1 °C por cada 300 m, un termómetro con 0.1 °C da la altura con ±30 m, bastante bien para entonces.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, pr = C.pStd(p.h), tb = C.tBoil(pr);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 6500, ymin: 76, ymax: 101, xlabel: 'altura sobre el mar (m)', ylabel: 'temperatura de ebullición (°C)' });
      pl.frame(); pl.fn((h) => C.tBoil(C.pStd(h)), { color: '--c1', width: 2.4 });
      C.PLACES.forEach((q) => { pl.dot(q[3], C.tBoil(C.pStd(q[3])), { color: '--accent', r: 4.5 }); EM.text(ctx, q[0], pl.X(q[3]) + 6, pl.Y(C.tBoil(C.pStd(q[3]))) - 8, { size: 10, color: '--ink-2' }); });
      pl.dot(p.h, tb, { color: '--c2', r: 7 });
      const hh = C.hypsoHeight(tb), dh = C.hypsoHeight(tb - p.e) - hh;
      const x0 = W * 0.7, y0 = H * 0.78; ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(x0, y0, W * 0.25, 10);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.moveTo(x0 + W * 0.12, y0 - (p.h / 6500) * (H * 0.55)); ctx.lineTo(x0 + W * 0.08, y0); ctx.lineTo(x0 + W * 0.16, y0); ctx.fill();
      EM.text(ctx, EM.fix(p.h, 0) + ' m', x0 + W * 0.12, y0 - (p.h / 6500) * (H * 0.55) - 8, { size: 11, align: 'center' });
      sim.set('p', EM.fix(pr / 1000, 2) + ' kPa (' + EM.fix(pr / 101325, 3) + ' atm)'); sim.set('t', EM.fix(tb, 2) + ' °C'); sim.set('r', EM.fix(hh, 0) + ' m ± ' + EM.fix(Math.abs(dh), 0) + ' m');
    });
  });

  /* 34.2 El Sol en Popayán */
  EM.defineSim('sol-popayan', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('lug', { label: 'Lugar', options: C.PLACES.filter((q) => q[0] !== 'Chimborazo' && q[0] !== 'Cumbal (volcán)').map((q) => [q[0], q[0] + ' (' + q[1].toFixed(2) + '°)']), value: 'Popayán' });
    sim.slider('d', { label: 'Día del año', min: 1, max: 365, step: 1, value: 87, fmt: (v) => v.toFixed(0) });
    sim.out('a', 'Altura del Sol al mediodía', { hl: true });
    sim.out('z', 'Días del año con el Sol en el cenit');
    sim.out('l', 'Latitud deducida de la altura y la declinación');
    sim.note('Entre los trópicos el Sol pasa dos veces al año por el cenit, cuando su declinación es igual a la latitud del lugar. En Popayán (2.44° N) ocurre hacia el 29 de marzo y el 14 de septiembre; en Quito, a la mitad (0.18° S), casi en los equinoccios. Caldas y Humboldt medían alturas del Sol con sextantes y cuadrantes para calcular la latitud: \\(\\varphi=90^\\circ-h_\\odot+\\delta\\). El Observatorio Astronómico de Santafé, comenzado en 1803 con apoyo de Mutis y dirigido por Caldas, es el primero de las Américas hispanas.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, q = C.PLACES.find((x) => x[0] === p.lug) || C.PLACES[0], lat = q[1];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1, xmax: 365, ymin: 60, ymax: 91, xlabel: 'día del año', ylabel: 'altura del Sol al mediodía (°)' });
      pl.frame(); pl.hline(90, { color: '--ink-3', label: 'cenit', labelRight: true });
      pl.fn((d) => C.noonAlt(lat, Math.round(d)), { color: '--c1', width: 2.4, n: 365 }); pl.dot(p.d, C.noonAlt(lat, p.d), { color: '--accent', r: 6 });
      const zd = C.zenithDays(lat);
      const dec = C.solarDecl(p.d);
      sim.set('a', EM.fix(C.noonAlt(lat, p.d), 2) + '° (declinación ' + EM.fix(dec, 2) + '°)');
      sim.set('z', zd.length ? 'día ' + [zd[0], zd[zd.length - 1]].join(' y día ') : '—');
      sim.set('l', EM.fix(lat >= dec ? C.latFromSun(C.noonAlt(lat, p.d), dec) : dec - 90 + C.noonAlt(lat, p.d), 3) + '° (Sol al ' + (lat >= dec ? 'sur' : 'norte') + ' del observador)');
    });
  });
})();
