/* Capítulo 1 · El kit de bajo costo */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;

  /* ---------- Guía de selección de sensores ---------- */
  const OPT = {
    acel: { label: 'Aceleración', unit: 'm/s²', items: [
      { n: 'Acelerómetro del celular', k: 'cel', res: 0.003, rate: 400, range: '±80 m/s² (±8 g)', cost: 0, pro: 'Sin cables, calibrado, se monta en carritos y péndulos.', con: 'Incluye la gravedad; hay que restarla o usar «aceleración sin g».' },
      { n: 'MPU6050 + ESP32', k: 'esp', res: 0.0006, rate: 1000, range: '±2 g a ±16 g', cost: 13000, pro: 'Pequeño y liviano: va en un carrito LEGO; muestreo estable.', con: 'Necesita cables o enviar los datos por Bluetooth.' },
      { n: 'Video (segunda derivada de la posición)', k: 'vid', res: 0.1, rate: 60, range: 'según la toma', cost: 0, pro: 'Muestra todo el movimiento; sirve para varios cuerpos.', con: 'Derivar dos veces amplifica mucho el ruido.' }] },
    gyr: { label: 'Velocidad angular', unit: 'rad/s', items: [
      { n: 'Giroscopio del celular', k: 'cel', res: 0.001, rate: 400, range: '±35 rad/s', cost: 0, pro: 'Ideal para péndulos, plataformas giratorias y objetos que ruedan.', con: 'Deriva lenta: integrar para obtener el ángulo acumula error.' },
      { n: 'MPU6050 + ESP32', k: 'esp', res: 0.00013, rate: 1000, range: '±4.4 rad/s (±250 °/s)', cost: 13000, pro: 'Resolución fina; se fija en el eje.', con: 'Rango corto en la escala más sensible.' },
      { n: 'Encoder óptico (rueda ranurada)', k: 'esp', res: 0.31, rate: 2000, range: 'ilimitado', cost: 7000, pro: 'Cuenta vueltas sin deriva; robusto.', con: 'Resolución angular gruesa (20 ranuras = 18°).' }] },
    mag: { label: 'Campo magnético', unit: 'T', items: [
      { n: 'Magnetómetro del celular', k: 'cel', res: 1e-7, rate: 100, range: '±4.9 mT', cost: 0, pro: 'Muy sensible: mide el campo terrestre (29 µT en Popayán).', con: 'Se satura cerca de un imán de neodimio; no se sabe dónde está el sensor.' },
      { n: 'Sensor Hall SS49E + ESP32', k: 'esp', res: 1e-4, rate: 10000, range: '±100 mT', cost: 3000, pro: 'Pequeño, rápido y de rango amplio: mide junto al imán.', con: 'Poco sensible: no ve el campo terrestre.' },
      { n: 'Bobina + ADC (inducción)', k: 'esp', res: 1e-5, rate: 10000, range: 'sólo campos variables', cost: 5000, pro: 'Mide la fem de Faraday directamente.', con: 'No mide campos constantes.' }] },
    pres: { label: 'Presión', unit: 'Pa', items: [
      { n: 'Barómetro del celular', k: 'cel', res: 1, rate: 25, range: '300–1100 hPa', cost: 0, pro: 'Detecta desniveles de 10 cm de aire.', con: 'Sólo en celulares de gama media o alta.' },
      { n: 'BMP280 + ESP32', k: 'esp', res: 0.2, rate: 100, range: '300–1100 hPa', cost: 12000, pro: 'Se mete en una jeringa o en una bolsa sumergida.', con: 'Rango limitado: no sirve para presiones altas.' }] },
    dist: { label: 'Distancia y posición', unit: 'm', items: [
      { n: 'Ultrasonido HC-SR04 + ESP32', k: 'esp', res: 0.003, rate: 30, range: '2 cm a 4 m', cost: 8000, pro: 'Sin contacto: sigue un carrito o el nivel de un líquido.', con: 'Cono ancho (≈ 15°); depende de la temperatura del aire.' },
      { n: 'Video y Tracker', k: 'vid', res: 0.001, rate: 120, range: 'campo de la cámara', cost: 0, pro: 'Ve trayectorias en dos dimensiones.', con: 'Paralaje y desenfoque si la toma no es perpendicular.' },
      { n: 'Potenciómetro (ángulo) + ESP32', k: 'esp', res: 0.002, rate: 5000, range: '≈ 270°', cost: 1500, pro: 'Mide el ángulo de un péndulo con mucha frecuencia.', con: 'Añade fricción al eje.' }] },
    tiempo: { label: 'Tiempo entre eventos', unit: 's', items: [
      { n: 'Fotocompuerta + ESP32 (micros)', k: 'esp', res: 1e-5, rate: null, range: 'µs a horas', cost: 7000, pro: 'La opción más precisa del kit.', con: 'El objeto debe interrumpir un haz angosto.' },
      { n: 'Cronómetro acústico (phyphox)', k: 'cel', res: 0.001, rate: null, range: 'ms a minutos', cost: 0, pro: 'Sólo necesita dos golpes o aplausos.', con: 'El sonido viaja: 3 ms por metro de distancia.' },
      { n: 'Video a 240 fps', k: 'vid', res: 0.004, rate: 240, range: 'segundos', cost: 0, pro: 'Ve el evento completo.', con: 'Archivos pesados; luz intensa.' },
      { n: 'Cronómetro manual', k: 'otro', res: 0.2, rate: null, range: '—', cost: 0, pro: 'Siempre disponible.', con: 'El tiempo de reacción humano es de 0.15–0.3 s.' }] },
    fuerza: { label: 'Fuerza y masa', unit: 'N', items: [
      { n: 'Celda de carga 1 kg + HX711', k: 'esp', res: 1e-4, rate: 80, range: '0–10 N', cost: 20000, pro: 'Pesa con 0.01 g de resolución; registra fuerzas en el tiempo.', con: 'Hay que calibrarla con masas conocidas y deriva con la temperatura.' },
      { n: 'Resorte y regla', k: 'otro', res: 0.01, rate: null, range: 'según el resorte', cost: 2000, pro: 'Directo y visual.', con: 'Lectura gruesa; sólo en equilibrio.' }] },
    temp: { label: 'Temperatura', unit: '°C', items: [
      { n: 'DS18B20 sumergible + ESP32', k: 'esp', res: 0.0625, rate: 1.3, range: '−55 a 125 °C', cost: 10000, pro: 'Sellado: se mete en agua o glicerina.', con: 'Lento: 0.75 s por lectura con 12 bits.' },
      { n: 'Termistor NTC + ADC', k: 'esp', res: 0.1, rate: 1000, range: '−40 a 125 °C', cost: 1000, pro: 'Barato y rápido.', con: 'No lineal: requiere la ecuación de Steinhart–Hart.' }] },
    luz: { label: 'Intensidad de luz', unit: 'lx', items: [
      { n: 'Sensor de luz del celular', k: 'cel', res: 1, rate: 10, range: '0–40 000 lx', cost: 0, pro: 'Calibrado en lux.', con: 'Lento y con filtros; está bajo el vidrio.' },
      { n: 'Fotorresistencia (LDR) + ADC', k: 'esp', res: 2, rate: 1000, range: 'relativa', cost: 500, pro: 'Muy barata.', con: 'No lineal y lenta (decenas de ms).' },
      { n: 'Módulo BH1750 + ESP32', k: 'esp', res: 0.5, rate: 8, range: '1–65 000 lx', cost: 9000, pro: 'Digital y calibrado.', con: 'Muestreo lento.' }] },
    volt: { label: 'Voltaje y corriente', unit: 'V', items: [
      { n: 'ADC de la ESP32', k: 'esp', res: 0.0008, rate: 20000, range: '0–3.1 V', cost: 0, pro: 'Ya está en la placa; muestrea rápido.', con: 'No lineal cerca de 0 V y de 3.1 V; ruido de unos mV.' },
      { n: 'INA219 + ESP32', k: 'esp', res: 0.004, rate: 1000, range: '0–26 V, ±3.2 A', cost: 18000, pro: 'Mide corriente y voltaje a la vez, calibrado.', con: 'Resolución de corriente de 0.1 mA.' },
      { n: 'Multímetro', k: 'otro', res: 0.001, rate: 2, range: 'según la escala', cost: 30000, pro: 'Referencia confiable para calibrar.', con: 'No registra datos en el tiempo.' }] },
    son: { label: 'Sonido y frecuencia', unit: 'Hz', items: [
      { n: 'Micrófono del celular (phyphox)', k: 'cel', res: 0.5, rate: 48000, range: '20 Hz – 20 kHz', cost: 0, pro: 'Espectro de audio en vivo; mide frecuencias de resonancia.', con: 'Filtros automáticos del celular a veces alteran la señal.' },
      { n: 'Micrófono MAX4466 + ESP32', k: 'esp', res: 2, rate: 10000, range: '20 Hz – 5 kHz', cost: 9000, pro: 'Señal analógica cruda.', con: 'Muestreo limitado del ADC.' }] }
  };
  const KITC = { cel: '--c1', esp: '--c7', vid: '--c5', otro: '--c6' };
  const KITN = { cel: 'Celular', esp: 'ESP32', vid: 'Video', otro: 'Otro' };

  MC.defineSim('kit-selector', function (sim) {
    const cv = sim.canvas({ aspect: 2.5, label: 'Comparación de sensores' });
    const card = MC.el('div', 'sim-html');
    sim.stageCol.append(card);
    sim.group('Magnitud que quiero medir');
    sim.select('mag', { options: Object.keys(OPT).map((k) => [k, OPT[k].label]), value: 'acel' });
    sim.note('Valores típicos de resolución y frecuencia de muestreo. Cada celular y cada módulo varía un poco: consulte su hoja de datos.');
    const fmtU = (v, u) => (u === 'T' ? MC.si(v, 'T', 2) : u === '°C' ? MC.sci(v, 2) + ' °C' : MC.sci(v, 2) + ' ' + u);
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const o = OPT[sim.p.mag];
      const n = o.items.length;
      const W = cv.w, H = cv.h;
      let nameW = 0;
      for (const q of o.items) nameW = Math.max(nameW, MC.textWidth(ctx, q.n, { size: 13, weight: 600 }));
      const left = Math.min(W * 0.42, nameW + 40), top = 46, rowH = Math.min(62, (H - top - 16) / n);
      const colW = (W - left - 30) / 2;
      MC.text(ctx, 'Resolución (menor = mejor)', left, 22, { size: 12, weight: 600, color: '--ink-2' });
      MC.text(ctx, 'Muestras por segundo', left + colW + 20, 22, { size: 12, weight: 600, color: '--ink-2' });
      const ress = o.items.map((q) => q.res);
      const lo = Math.floor(Math.log10(Math.min(...ress))) - 0.5, hi = Math.ceil(Math.log10(Math.max(...ress))) + 0.5;
      const bar = (x, w, v, a, b, col, y, h, txt) => {
        const f = M.clamp((Math.log10(v) - a) / (b - a), 0.02, 1);
        ctx.fillStyle = MC.alpha(col, 0.85);
        ctx.fillRect(x, y, w * f, h);
        MC.text(ctx, txt, x + w * f + 6, y + h / 2, { size: 11.5, mono: true, baseline: 'middle', color: '--ink', halo: true });
      };
      o.items.forEach((q, i) => {
        const y = top + i * rowH;
        const col = KITC[q.k];
        ctx.fillStyle = MC.col(col);
        ctx.fillRect(12, y + 4, 4, rowH - 14);
        MC.text(ctx, q.n, 24, y + 14, { size: 13, weight: 600, color: '--ink' });
        MC.text(ctx, `${KITN[q.k]} · ${q.cost ? '$ ' + q.cost.toLocaleString('es-CO') : 'sin costo extra'}`, 24, y + 31, { size: 11.5, color: '--ink-3' });
        bar(left, colW - 70, q.res, lo, hi, col, y + 6, rowH * 0.42, fmtU(q.res, o.unit));
        if (q.rate) bar(left + colW + 20, colW - 70, q.rate, -0.5, 5, col, y + 6, rowH * 0.42, MC.sci(q.rate, 2) + ' Hz');
        else MC.text(ctx, 'por evento (marca de tiempo)', left + colW + 20, y + 6 + rowH * 0.21, { size: 11.5, color: '--ink-3', baseline: 'middle' });
      });
      card.innerHTML = '<div class="modgrid" style="margin:0">' + o.items.map((q) => `<div class="mod"><div class="mod-top"><b>${q.n}</b><span>${q.range}</span></div><p><b>A favor:</b> ${q.pro}</p><p><b>En contra:</b> ${q.con}</p></div>`).join('') + '</div>';
    });
  });

  /* ---------- Calculadora de presupuesto ---------- */
  MC.defineSim('kit-presupuesto', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, label: 'Presupuesto por módulo' });
    const mods = [
      ['base', 'Kit base ESP32', 75000, '--c7'],
      ['mec', 'Mecánica', 55000, '--c1'],
      ['em', 'Electromagnetismo', 80000, '--c5'],
      ['flu', 'Fluidos', 80000, '--c3'],
      ['lego', 'Lote LEGO', 90000, '--c4']
    ];
    sim.group('Curso');
    sim.slider('grupos', { label: 'Número de grupos', min: 1, max: 20, step: 1, value: 8, fmt: (v) => String(Math.round(v)) });
    sim.slider('est', { label: 'Estudiantes por grupo', min: 2, max: 5, step: 1, value: 3, fmt: (v) => String(Math.round(v)) });
    sim.slider('rep', { label: 'Repuestos', min: 0, max: 30, step: 1, value: 10, unit: '%', fmt: (v) => String(Math.round(v)) });
    sim.group('Módulos (precio por grupo, en pesos)');
    for (const [id, lab, p] of mods) {
      sim.check('on_' + id, { label: lab, value: true });
      sim.slider('p_' + id, { label: 'Precio', min: 10000, max: 300000, step: 1000, value: p, fmt: (v) => '$ ' + Math.round(v).toLocaleString('es-CO') });
    }
    sim.outSep('Resultado');
    sim.out('grupo', 'Costo por grupo', { hl: true });
    sim.out('total', 'Costo total (con repuestos)', { hl: true });
    sim.out('est', 'Costo por estudiante');
    sim.out('ref', 'Equivale a sensores comerciales de ≈ $ 600 000 c/u');
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const g = Math.round(sim.p.grupos), rep = sim.p.rep / 100;
      const on = mods.filter(([id]) => sim.p['on_' + id]);
      const per = on.reduce((s, [id]) => s + sim.p['p_' + id], 0);
      const total = per * g * (1 + rep);
      sim.set('grupo', '$ ' + Math.round(per).toLocaleString('es-CO'));
      sim.set('total', '$ ' + Math.round(total).toLocaleString('es-CO'));
      sim.set('est', '$ ' + Math.round(total / (g * Math.round(sim.p.est))).toLocaleString('es-CO'));
      sim.set('ref', MC.fix(total / 600000, 1) + ' sensores');
      /* barra apilada por módulo */
      const x0 = 24, x1 = cv.w - 24, y = cv.h * 0.38, h = cv.h * 0.26;
      MC.text(ctx, `Presupuesto total para ${g} grupos: $ ${Math.round(total).toLocaleString('es-CO')}`, x0, 26, { size: 15, weight: 700, color: '--ink' });
      let x = x0;
      for (const [id, lab, , col] of on) {
        const w = ((x1 - x0) * sim.p['p_' + id] * g * (1 + rep)) / Math.max(total, 1);
        ctx.fillStyle = MC.alpha(col, 0.85);
        ctx.fillRect(x, y, Math.max(0, w - 2), h);
        if (w > 70) {
          MC.text(ctx, lab, x + 6, y + h + 16, { size: 12, color: col, weight: 600 });
          MC.text(ctx, MC.fix((100 * sim.p['p_' + id]) / per, 0) + ' %', x + 6, y + h / 2, { size: 12, mono: true, color: '#fff', baseline: 'middle', weight: 700 });
        }
        x += w;
      }
      if (!on.length) MC.text(ctx, 'Seleccione al menos un módulo', cv.w / 2, y + h / 2, { size: 13, color: '--ink-3', align: 'center' });
    });
  });
})();
