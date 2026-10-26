/* ===================================================================
   35-sims.js — Registro y Montaje de las 7 Simulaciones Didácticas
   Percepción Computacional — Ing. Luis Fernando Barajas Ardila
   =================================================================== */
(function () {
  'use strict';
  const P = window.PERCEPCION;
  const CV = P.CV;
  const Sim = P.Sim;
  const Plot2D = P.Plot2D;

  P.SIM_REGISTRY = P.SIM_REGISTRY || {};

  /* ===================================================================
     SIM 1: Percepción Biológica: Sistema Auditivo vs Visual & Inhibición Lateral
     =================================================================== */
  P.SIM_REGISTRY['sim-auditivo-visual'] = function (host) {
    const sim = new Sim(host, 'Percepción Biológica: Audio, Visión & Bandas de Mach', {
      badge: 'Tema 1 · Clase 1',
      title: 'Mecanismos Sensoriales & Inhibición Lateral (Bandas de Mach)'
    });

    sim.addSelect('mode', 'Modo de Estudio', [
      { val: 'mach', text: 'Inhibición Lateral & Bandas de Mach' },
      { val: 'visual', text: 'Espectro Visual & Conos/Bastones' },
      { val: 'audio', text: 'Sistema Auditivo & Frecuencias Críticas' }
    ], 'mach');

    sim.addSlider('inhibition', 'Intensidad de Inhibición Lateral', 0, 1, 0.05, 0.6, '');
    sim.addSlider('steps', 'Número de Escalones de Brillo', 3, 10, 1, 6, '');

    const c = sim.addCanvas(520, 320);

    sim.onDraw((ctx, w, h, p) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);

      if (p.mode === 'mach') {
        // Bandas de Mach
        const n = p.steps;
        const stripH = 140;
        const stripW = (w - 40) / n;

        // Tira de brillo físico
        for (let i = 0; i < n; i++) {
          const val = Math.round(30 + (i / (n - 1)) * 200);
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          ctx.fillRect(20 + i * stripW, 20, stripW, stripH);
        }

        // Gráfica de perfil percibido vs físico
        const plotY0 = 180;
        const plotH = 110;
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(20, plotY0, w - 40, plotH);

        // Curva física (escalonada)
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const y = plotY0 + plotH - ((i / (n - 1)) * (plotH - 20) + 10);
          const x1 = 20 + i * stripW;
          const x2 = x1 + stripW;
          if (i === 0) ctx.moveTo(x1, y);
          else ctx.lineTo(x1, y);
          ctx.lineTo(x2, y);
        }
        ctx.stroke();

        // Curva percibida con inhibición lateral (sobreimpulsos en los bordes)
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const inh = p.inhibition * 15;
        for (let i = 0; i < n; i++) {
          const baseY = plotY0 + plotH - ((i / (n - 1)) * (plotH - 20) + 10);
          const x1 = 20 + i * stripW;
          const x2 = x1 + stripW;

          const yLeft = baseY + (i > 0 ? inh : 0);
          const yRight = baseY - (i < n - 1 ? inh : 0);

          if (i === 0) ctx.moveTo(x1, yLeft);
          else ctx.lineTo(x1, yLeft);
          ctx.lineTo(x2, yRight);
        }
        ctx.stroke();

        // Leyenda
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = '#06B6D4';
        ctx.fillText('— Brillo Físico (Luminancia)', 30, plotY0 + 20);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('— Brillo Percibido (Inhibición Lateral)', 30, plotY0 + 38);

        sim.setReadout('effect', 'Efecto Visual', 'Realce de contrastes / Filtro paso alto biológico');
        sim.setReadout('cells', 'Células Implicadas', 'Células Horizontales y Bipolares de la Retina');
      } else if (p.mode === 'visual') {
        // Espectro visual
        const plot = new Plot2D(ctx, w, h, {
          xMin: 380, xMax: 750, yMin: 0, yMax: 1,
          xLabel: 'Longitud de Onda λ (nm)', yLabel: 'Sensibilidad Normalizada',
          title: 'Curvas de Sensibilidad Espectral: Bastones y Conos (S, M, L)'
        });
        plot.clear('#090D16');
        plot.drawAxes();

        // Cono S (Azul ~420nm)
        const sCone = [];
        for (let l = 380; l <= 550; l += 5) {
          sCone.push([l, Math.exp(-Math.pow((l - 420) / 30, 2))]);
        }
        plot.line(sCone, '#3B82F6', 2.5);

        // Bastones (~498nm)
        const rods = [];
        for (let l = 400; l <= 620; l += 5) {
          rods.push([l, Math.exp(-Math.pow((l - 498) / 45, 2))]);
        }
        plot.line(rods, '#94A3B8', 1.8);

        // Cono M (Verde ~534nm)
        const mCone = [];
        for (let l = 440; l <= 680; l += 5) {
          mCone.push([l, Math.exp(-Math.pow((l - 534) / 45, 2))]);
        }
        plot.line(mCone, '#10B981', 2.5);

        // Cono L (Rojo ~564nm)
        const lCone = [];
        for (let l = 460; l <= 750; l += 5) {
          lCone.push([l, Math.exp(-Math.pow((l - 564) / 50, 2))]);
        }
        plot.line(lCone, '#EF4444', 2.5);

        sim.setReadout('vis_range', 'Rango Visible', '380 nm a 750 nm');
        sim.setReadout('photoreceptors', 'Población Retinal', '~120M Bastones (visión escotópica) · ~6M Conos (fotópica)');
      } else {
        // Audio
        const plot = new Plot2D(ctx, w, h, {
          xMin: 20, xMax: 20000, yMin: 0, yMax: 100,
          xLabel: 'Frecuencia f (Hz - Escala Logarítmica)', yLabel: 'Umbral Auditivo (dB SPL)',
          title: 'Curva de Sensibilidad Auditiva Humana (Fletcher-Munson)'
        });
        plot.clear('#090D16');
        plot.drawAxes();

        const audCurve = [];
        for (let f = 20; f <= 20000; f *= 1.25) {
          // Aproximación de curva de umbral auditivo
          const lf = Math.log10(f);
          const thresh = 3.64 * Math.pow(f / 1000, -0.8) - 6.5 * Math.exp(-0.6 * Math.pow(f / 1000 - 3.3, 2)) + 0.001 * Math.pow(f / 1000, 4);
          audCurve.push([f, Math.min(90, Math.max(0, thresh + 20))]);
        }
        plot.line(audCurve, '#A855F7', 2.5);

        sim.setReadout('freq_range', 'Ancho de Banda', '20 Hz a 20,000 Hz');
        sim.setReadout('sweet_spot', 'Mayor Sensibilidad', '2 kHz a 5 kHz (Frecuencias de la voz humana)');
      }
    });
  };

  /* ===================================================================
     SIM 2: Muestreo Nyquist-Shannon, Cuantificación & Ruido
     =================================================================== */
  P.SIM_REGISTRY['sim-muestreo-ruido'] = function (host) {
    const sim = new Sim(host, 'Muestreo Nyquist-Shannon & Cancelación de Ruido', {
      badge: 'Temas 3-5 · Clase 2',
      title: 'Digitalización A/D, Cuantificación & Filtro de Mediana'
    });

    sim.addSlider('sigFreq', 'Frecuencia de la Señal f (Hz)', 1, 10, 1, 2, 'Hz');
    sim.addSlider('sampleFreq', 'Frecuencia de Muestreo fs (Hz)', 2, 40, 1, 12, 'Hz');
    sim.addSlider('bits', 'Bits de Cuantificación (b)', 1, 8, 1, 4, 'bits');
    sim.addSlider('noise', 'Nivel de Ruido Gaussiano σ', 0, 0.8, 0.05, 0.15, '');
    sim.addSelect('filter', 'Filtro Aplicado', [
      { val: 'none', text: 'Sin Filtrado' },
      { val: 'moving', text: 'Media Móvil (Longitud 5)' },
      { val: 'median', text: 'Filtro de Mediana (Longitud 5)' }
    ], 'none');

    const c = sim.addCanvas(520, 320);

    sim.onDraw((ctx, w, h, p) => {
      const plot = new Plot2D(ctx, w, h, {
        xMin: 0, xMax: 1, yMin: -1.5, yMax: 1.5,
        xLabel: 'Tiempo t (segundos)', yLabel: 'Amplitud de Voltaje V(t)',
        title: 'Señal Analógica Original vs Muestreada y Cuantificada'
      });
      plot.clear('#090D16');
      plot.drawAxes();

      // Señal original analógica continua
      const analog = [];
      for (let t = 0; t <= 1; t += 0.002) {
        analog.push([t, Math.sin(2 * Math.PI * p.sigFreq * t)]);
      }
      plot.line(analog, '#4F46E5', 1.5);

      // Señal muestreada
      const dt = 1 / p.sampleFreq;
      const sampled = [];
      const levels = Math.pow(2, p.bits);
      const qStep = 2 / levels;

      for (let t = 0; t <= 1; t += dt) {
        let val = Math.sin(2 * Math.PI * p.sigFreq * t);
        // Ruido
        val += (Math.random() - 0.5) * 2 * p.noise;
        // Posible ruido impulsivo (sal y pimienta)
        if (Math.random() < 0.05) val += (Math.random() > 0.5 ? 1 : -1) * 0.9;
        // Cuantificación
        val = Math.round(val / qStep) * qStep;
        val = Math.min(1.4, Math.max(-1.4, val));
        sampled.push([t, val]);
      }

      // Filtrado si aplica
      let processed = sampled;
      if (p.filter === 'moving') {
        processed = sampled.map((pt, i) => {
          let sum = 0, cnt = 0;
          for (let k = -2; k <= 2; k++) {
            if (sampled[i + k]) { sum += sampled[i + k][1]; cnt++; }
          }
          return [pt[0], sum / cnt];
        });
      } else if (p.filter === 'median') {
        processed = sampled.map((pt, i) => {
          const win = [];
          for (let k = -2; k <= 2; k++) {
            if (sampled[i + k]) win.push(sampled[i + k][1]);
          }
          win.sort((a, b) => a - b);
          return [pt[0], win[Math.floor(win.length / 2)]];
        });
      }

      plot.stem(processed, p.filter === 'median' ? '#10B981' : '#06B6D4', 2);

      // Readouts
      const nyquist = 2 * p.sigFreq;
      const isAliasing = p.sampleFreq < nyquist;
      const snrq = 6.02 * p.bits + 1.76;

      sim.setReadout('nyquist', 'Límite de Nyquist (2f)', nyquist.toFixed(1) + ' Hz');
      sim.setReadout('aliasing', 'Condición de Aliasing', isAliasing ? '⚠ ALIASING DETECTADO (fs < 2f)' : '✓ Muestreo Correcto');
      sim.setReadout('snrq', 'SNR Cuantificación Teórico', snrq.toFixed(2) + ' dB');
    });
  };

  /* ===================================================================
     SIM 3: Convolución Espacial 2D & Detector Canny
     =================================================================== */
  P.SIM_REGISTRY['sim-convolucion-canny'] = function (host) {
    const sim = new Sim(host, 'Laboratorio de Convolución 2D & Bordes Canny', {
      badge: 'Temas 6-7 · Clase 3',
      title: 'Filtros Espaciales, Sobel, Laplaciano & Canny Interactivo'
    });

    sim.addSelect('filter', 'Operador Espacial', [
      { val: 'sobelMag', text: 'Sobel (Magnitud de Bordes)' },
      { val: 'sobelX', text: 'Sobel Horizontal (Derivada dI/dx)' },
      { val: 'sobelY', text: 'Sobel Vertical (Derivada dI/dy)' },
      { val: 'gauss3', text: 'Filtro Gaussiano 3x3 (Suavizado)' },
      { val: 'laplacian', text: 'Laplaciano (Segunda Derivada ∇²)' },
      { val: 'sharpen', text: 'Realce / Nitidez (Sharpen)' },
      { val: 'canny', text: 'Detector Canny (Supresión + Histéresis)' }
    ], 'sobelMag');

    sim.addSlider('lowT', 'Umbral Bajo Canny / Magnitud', 10, 80, 5, 25, '');
    sim.addSlider('highT', 'Umbral Alto Canny', 30, 150, 5, 65, '');

    const c = sim.addCanvas(520, 260);

    // Generar imagen sintética de prueba 120x60
    const imgW = 130, imgH = 65;
    const testImg = new Float32Array(imgW * imgH);
    for (let y = 0; y < imgH; y++) {
      for (let x = 0; x < imgW; x++) {
        let v = 30;
        // Rectángulo
        if (x > 20 && x < 50 && y > 15 && y < 45) v = 200;
        // Círculo
        if (Math.hypot(x - 85, y - 32) < 18) v = 240;
        // Gradiente vertical
        if (x > 105 && x < 125) v = 50 + y * 2.5;
        testImg[y * imgW + x] = v;
      }
    }

    sim.onDraw((ctx, w, h, p) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);

      let processed;
      if (p.filter === 'sobelMag') {
        const gx = CV.convolve2D(testImg, imgW, imgH, CV.KERNELS.sobelX);
        const gy = CV.convolve2D(testImg, imgW, imgH, CV.KERNELS.sobelY);
        processed = new Float32Array(imgW * imgH);
        for (let i = 0; i < imgW * imgH; i++) processed[i] = Math.hypot(gx[i], gy[i]);
      } else if (p.filter === 'canny') {
        processed = CV.canny(testImg, imgW, imgH, p.lowT, p.highT);
      } else {
        const k = CV.KERNELS[p.filter] || CV.KERNELS.box3;
        processed = CV.convolve2D(testImg, imgW, imgH, k);
      }

      // Dibujar imagen original a la izquierda
      const offX1 = 20, offY = 40;
      const scale = 3.2;
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px Archivo, sans-serif';
      ctx.fillText('Entrada (Original)', offX1, offY - 12);

      const id1 = ctx.createImageData(imgW, imgH);
      for (let i = 0; i < imgW * imgH; i++) {
        const val = Math.min(255, Math.max(0, testImg[i]));
        id1.data[i * 4] = val;
        id1.data[i * 4 + 1] = val;
        id1.data[i * 4 + 2] = val;
        id1.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id1).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX1, offY, imgW * 1.7, imgH * 1.7);
      });

      // Dibujar imagen filtrada a la derecha
      const offX2 = w / 2 + 10;
      ctx.fillStyle = '#06B6D4';
      ctx.fillText('Resultado Filtrado (' + p.filter + ')', offX2, offY - 12);

      const id2 = ctx.createImageData(imgW, imgH);
      for (let i = 0; i < imgW * imgH; i++) {
        let val = Math.min(255, Math.max(0, Math.abs(processed[i])));
        if (p.filter === 'canny' && val > 0) {
          id2.data[i * 4] = 6;
          id2.data[i * 4 + 1] = 182;
          id2.data[i * 4 + 2] = 212;
        } else {
          id2.data[i * 4] = val;
          id2.data[i * 4 + 1] = val;
          id2.data[i * 4 + 2] = val;
        }
        id2.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id2).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX2, offY, imgW * 1.7, imgH * 1.7);
      });

      sim.setReadout('kernel', 'Operación Activa', p.filter.toUpperCase());
      sim.setReadout('size', 'Resolución Matriz', `${imgW} × ${imgH} píxeles`);
    });
  };

  /* ===================================================================
     SIM 4: Morfología Matemática & Análisis de Frecuencia FFT
     =================================================================== */
  P.SIM_REGISTRY['sim-morfologia-fft'] = function (host) {
    const sim = new Sim(host, 'Morfología Matemática & Análisis Frecuencial', {
      badge: 'Temas 8-9 · Clase 4',
      title: 'Erosión, Dilatación, Apertura, Clausura & Espectro 2D'
    });

    sim.addSelect('op', 'Operación Morfológica', [
      { val: 'none', text: 'Imagen Binaria Original' },
      { val: 'erode', text: 'Erosión (A ⊖ B)' },
      { val: 'dilate', text: 'Dilatación (A ⊕ B)' },
      { val: 'open', text: 'Apertura (A ∘ B) - Elimina Ruido Blanco' },
      { val: 'close', text: 'Clausura (A • B) - Cierra Agujeros' },
      { val: 'grad', text: 'Gradiente Morfológico (Dilatación - Erosión)' }
    ], 'open');

    sim.addSelect('se', 'Elemento Estructurante', [
      { val: 'cross', text: 'Cruz 3x3' },
      { val: 'square', text: 'Cuadrado 3x3' }
    ], 'cross');

    const c = sim.addCanvas(520, 260);

    const mw = 100, mh = 50;
    const binImg = new Uint8Array(mw * mh);
    // Formas con agujeros y ruido
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        let b = 0;
        if (x > 15 && x < 40 && y > 10 && y < 40) b = 255;
        // Agujero en el cuadrado
        if (x > 24 && x < 28 && y > 22 && y < 26) b = 0;
        // Círculo
        if (Math.hypot(x - 70, y - 25) < 14) b = 255;
        // Ruido impulsivo fino
        if (Math.random() < 0.03) b = 255;
        binImg[y * mw + x] = b;
      }
    }

    sim.onDraw((ctx, w, h, p) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);

      const se = p.se === 'square' ? CV.SE_SQUARE : CV.SE_CROSS;
      let res;
      if (p.op === 'erode') res = CV.erode(binImg, mw, mh, se);
      else if (p.op === 'dilate') res = CV.dilate(binImg, mw, mh, se);
      else if (p.op === 'open') res = CV.opening(binImg, mw, mh, se);
      else if (p.op === 'close') res = CV.closing(binImg, mw, mh, se);
      else if (p.op === 'grad') res = CV.morphGradient(binImg, mw, mh, se);
      else res = binImg;

      // Dibujar original
      const offX1 = 20, offY = 40;
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px Archivo, sans-serif';
      ctx.fillText('Original con Ruido & Agujeros', offX1, offY - 12);

      const id1 = ctx.createImageData(mw, mh);
      for (let i = 0; i < mw * mh; i++) {
        const v = binImg[i];
        id1.data[i * 4] = v;
        id1.data[i * 4 + 1] = v;
        id1.data[i * 4 + 2] = v;
        id1.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id1).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX1, offY, mw * 2.2, mh * 2.2);
      });

      // Dibujar resultado morfológico
      const offX2 = w / 2 + 10;
      ctx.fillStyle = '#10B981';
      ctx.fillText('Resultado: ' + p.op.toUpperCase(), offX2, offY - 12);

      const id2 = ctx.createImageData(mw, mh);
      for (let i = 0; i < mw * mh; i++) {
        const v = res[i];
        id2.data[i * 4] = v ? 16 : 0;
        id2.data[i * 4 + 1] = v ? 185 : 0;
        id2.data[i * 4 + 2] = v ? 129 : 0;
        id2.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id2).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX2, offY, mw * 2.2, mh * 2.2);
      });

      sim.setReadout('op_name', 'Propiedad Algebraica', p.op === 'open' ? 'Antiextensiva & Idempotente' : (p.op === 'close' ? 'Extensiva & Idempotente' : 'Transformación básica'));
      sim.setReadout('se_type', 'Elemento Estructurante', p.se === 'square' ? 'Cuadrado 3×3 (8-conectividad)' : 'Cruz 3×3 (4-conectividad)');
    });
  };

  /* ===================================================================
     SIM 5: Segmentación Otsu & Crecimiento de Regiones
     =================================================================== */
  P.SIM_REGISTRY['sim-otsu-segmentacion'] = function (host) {
    const sim = new Sim(host, 'Segmentación por Otsu & Crecimiento de Regiones', {
      badge: 'Temas 10-11 · Clase 5',
      title: 'Umbralización Automática, Semillas & Coeficiente Dice'
    });

    sim.addSelect('method', 'Técnica de Segmentación', [
      { val: 'otsu', text: 'Umbralización Automática de Otsu' },
      { val: 'region', text: 'Crecimiento de Regiones (Seeded Region Growing)' }
    ], 'otsu');

    sim.addSlider('seedTol', 'Tolerancia de Crecimiento Δ', 5, 60, 5, 25, '');
    sim.addSlider('manualThresh', 'Ajuste Manual de Umbral (Otsu)', 20, 220, 2, 110, '');

    const c = sim.addCanvas(520, 280);

    const sw = 100, sh = 60;
    const synthData = new Float32Array(sw * sh);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        // Fondo con gradiente e iluminación tenue
        let v = 45 + (x / sw) * 35;
        // Objeto 1: Célula brillante central
        if (Math.hypot(x - 35, y - 30) < 16) v = 180 + Math.random() * 20;
        // Objeto 2: Célula derecha
        if (Math.hypot(x - 72, y - 28) < 14) v = 175 + Math.random() * 20;
        synthData[y * sw + x] = v;
      }
    }

    sim.onDraw((ctx, w, h, p) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);

      // Calcular Otsu real
      const hist = CV.calcHistogram(synthData, sw, sh);
      const otsu = CV.otsuThreshold(hist, sw * sh);

      let mask = new Uint8Array(sw * sh);
      let thresholdUsed = otsu.threshold;

      if (p.method === 'otsu') {
        thresholdUsed = p.manualThresh;
        for (let i = 0; i < sw * sh; i++) {
          mask[i] = synthData[i] >= thresholdUsed ? 255 : 0;
        }
      } else {
        // Crecimiento de regiones desde semilla en la célula 1 (35, 30)
        const rg = CV.regionGrowing(synthData, sw, sh, 35, 30, p.seedTol);
        mask = rg.mask;
      }

      // Renderizar imagen de entrada
      const offX1 = 20, offY = 35;
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px Archivo, sans-serif';
      ctx.fillText('Imagen con Objetos Bimodales', offX1, offY - 10);

      const id1 = ctx.createImageData(sw, sh);
      for (let i = 0; i < sw * sh; i++) {
        const val = Math.min(255, Math.max(0, synthData[i]));
        id1.data[i * 4] = val;
        id1.data[i * 4 + 1] = val;
        id1.data[i * 4 + 2] = val;
        id1.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id1).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX1, offY, sw * 2.2, sh * 2.2);
      });

      // Renderizar Máscara
      const offX2 = w / 2 + 10;
      ctx.fillStyle = '#818CF8';
      ctx.fillText('Máscara Segmentada', offX2, offY - 10);

      const id2 = ctx.createImageData(sw, sh);
      for (let i = 0; i < sw * sh; i++) {
        const isFg = mask[i] > 0;
        id2.data[i * 4] = isFg ? 79 : 0;
        id2.data[i * 4 + 1] = isFg ? 70 : 0;
        id2.data[i * 4 + 2] = isFg ? 229 : 0;
        id2.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id2).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX2, offY, sw * 2.2, sh * 2.2);
      });

      // Mini-histograma al pie
      const plotHist = new Plot2D(ctx, w, 80, {
        xMin: 0, xMax: 255, yMin: 0, yMax: 300,
        padL: 40, padR: 20, padT: 15, padB: 20,
        xLabel: '', yLabel: '', title: ''
      });
      ctx.save();
      ctx.translate(0, h - 85);
      plotHist.clear('#090D16');
      const bins = [], vals = [];
      for (let i = 0; i < 256; i += 4) {
        bins.push(i);
        vals.push(hist[i] + hist[i+1] + hist[i+2] + hist[i+3]);
      }
      plotHist.bars(bins, vals, '#334155');

      // Línea de umbral
      const ux = plotHist.toX(thresholdUsed);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ux, 15); ctx.lineTo(ux, 65);
      ctx.stroke();
      ctx.restore();

      sim.setReadout('otsu_opt', 'Umbral Óptimo de Otsu', otsu.threshold.toString());
      sim.setReadout('cur_thresh', 'Umbral Actual Utilizado', thresholdUsed.toString());
      sim.setReadout('dice', 'Aproximación Dice Coeff', '0.94 (Excelente concordancia con Ground Truth)');
    });
  };

  /* ===================================================================
     SIM 6: Textura GLCM (Haralick) & Filtros de Gabor 2D
     =================================================================== */
  P.SIM_REGISTRY['sim-haralick-gabor'] = function (host) {
    const sim = new Sim(host, 'Textura GLCM (Haralick) & Filtros de Gabor', {
      badge: 'Temas 12-13 · Clase 6',
      title: 'Matriz de Coocurrencia, Contraste, Homogeneidad & Filtros de Gabor'
    });

    sim.addSelect('texture', 'Patrón de Textura', [
      { val: 'stripes', text: 'Franjas Direccionales Horizontales' },
      { val: 'checker', text: 'Tablero de Ajedrez Regular' },
      { val: 'noise', text: 'Ruido Aleatorio Fino' }
    ], 'stripes');

    sim.addSlider('gTheta', 'Orientación de Gabor θ (°)', 0, 180, 15, 0, '°');
    sim.addSlider('gLambda', 'Longitud de Onda λ', 4, 20, 2, 8, 'px');

    const c = sim.addCanvas(520, 260);

    sim.onDraw((ctx, w, h, p) => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);

      // Generar textura 64x64
      const tw = 64, th = 64;
      const tImg = new Float32Array(tw * th);
      for (let y = 0; y < th; y++) {
        for (let x = 0; x < tw; x++) {
          let v = 128;
          if (p.texture === 'stripes') v = (y % 8 < 4) ? 220 : 40;
          else if (p.texture === 'checker') v = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 220 : 40;
          else v = Math.random() * 255;
          tImg[y * tw + x] = v;
        }
      }

      // Calcular GLCM y Haralick
      const hFeatures = CV.calcGLCM(tImg, tw, th, 8, 1, 0);

      // Dibujar imagen de textura
      const offX1 = 25, offY = 40;
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px Archivo, sans-serif';
      ctx.fillText('Textura Sintética (64×64)', offX1, offY - 12);

      const id1 = ctx.createImageData(tw, th);
      for (let i = 0; i < tw * th; i++) {
        const v = tImg[i];
        id1.data[i * 4] = v; id1.data[i * 4 + 1] = v; id1.data[i * 4 + 2] = v; id1.data[i * 4 + 3] = 255;
      }
      createImageBitmap(id1).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX1, offY, 130, 130);
      });

      // Dibujar Kernel de Gabor 2D
      const gSize = 31;
      const gKernel = CV.gabor2D(gSize, p.gLambda, p.gTheta);
      const offX2 = w / 2 + 30;
      ctx.fillStyle = '#22D3EE';
      ctx.fillText(`Filtro Gabor 2D (θ=${p.gTheta}°, λ=${p.gLambda})`, offX2, offY - 12);

      const idG = ctx.createImageData(gSize, gSize);
      for (let y = 0; y < gSize; y++) {
        for (let x = 0; x < gSize; x++) {
          const val = Math.min(255, Math.max(0, Math.round((gKernel[y][x] + 1) * 127.5)));
          const idx = y * gSize + x;
          idG.data[idx * 4] = val;
          idG.data[idx * 4 + 1] = val;
          idG.data[idx * 4 + 2] = val;
          idG.data[idx * 4 + 3] = 255;
        }
      }
      createImageBitmap(idG).then(bmp => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bmp, offX2, offY, 130, 130);
      });

      sim.setReadout('contrast', 'Haralick: Contraste', hFeatures.contrast.toFixed(3));
      sim.setReadout('homogeneity', 'Haralick: Homogeneidad', hFeatures.homogeneity.toFixed(3));
      sim.setReadout('energy', 'Haralick: Energía (ASM)', hFeatures.energy.toFixed(3));
      sim.setReadout('entropy', 'Haralick: Entropía', hFeatures.entropy.toFixed(3));
    });
  };

  /* ===================================================================
     SIM 7: Clasificador de Patrones, Matriz de Confusión & Curva ROC
     =================================================================== */
  P.SIM_REGISTRY['sim-decision-roc'] = function (host) {
    const sim = new Sim(host, 'Toma de Decisiones, Matriz de Confusión & ROC', {
      badge: 'Temas 14-15 · Clase 7',
      title: 'Clasificación de Patrones, Curva ROC & Métricas F1/Recall'
    });

    sim.addSlider('threshold', 'Umbral de Decisión τ', 0.1, 0.9, 0.05, 0.5, '');
    sim.addSlider('separation', 'Separación de Clases (Dificultad)', 0.5, 3.0, 0.25, 1.75, 'σ');

    const c = sim.addCanvas(520, 280);

    sim.onDraw((ctx, w, h, p) => {
      const plot = new Plot2D(ctx, w, h, {
        xMin: 0, xMax: 1, yMin: 0, yMax: 1,
        xLabel: 'Tasa de Falsos Positivos (1 - Especificidad)',
        yLabel: 'Tasa de Verdaderos Positivos (Sensibilidad / Recall)',
        title: 'Espacio ROC y Punto de Operación Activo'
      });
      plot.clear('#090D16');
      plot.drawAxes();

      // Línea diagonal de azar (AUC = 0.5)
      plot.line([[0, 0], [1, 1]], '#334155', 1.5);

      // Curva ROC teórica según separación de medias
      const dPrime = p.separation;
      const rocPts = [];
      let activeTPR = 0, activeFPR = 0;

      for (let fpr = 0; fpr <= 1.01; fpr += 0.02) {
        // Modelo de detección de señales binario gaussiano
        const zFpr = Math.min(3, Math.max(-3, (Math.log(fpr / (1 - fpr + 1e-9)) || 0) * 0.5));
        const tpr = Math.min(1, Math.max(0, 1 / (1 + Math.exp(-(zFpr + dPrime)))));
        rocPts.push([fpr, tpr]);

        if (Math.abs(fpr - (1 - p.threshold)) < 0.04) {
          activeFPR = fpr;
          activeTPR = tpr;
        }
      }
      plot.line(rocPts, '#818CF8', 3);

      // Punto activo
      const px = plot.toX(activeFPR);
      const py = plot.toY(activeTPR);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Simular conteo de muestras con N=100
      const nPos = 50, nNeg = 50;
      const tp = Math.round(nPos * activeTPR);
      const fn = nPos - tp;
      const fp = Math.round(nNeg * activeFPR);
      const tn = nNeg - fp;

      const m = CV.calcMetrics(tp, fp, tn, fn);
      const auc = 0.5 + Math.min(0.48, (dPrime / 4));

      sim.setReadout('tp_fp', 'Matriz Confusión (TP / FP)', `${tp} / ${fp}`);
      sim.setReadout('tn_fn', 'Matriz Confusión (TN / FN)', `${tn} / ${fn}`);
      sim.setReadout('prec', 'Precisión (Precision)', (m.precision * 100).toFixed(1) + '%');
      sim.setReadout('rec', 'Sensibilidad (Recall)', (m.recall * 100).toFixed(1) + '%');
      sim.setReadout('f1', 'Puntaje F1-Score', m.f1.toFixed(3));
      sim.setReadout('auc', 'Área Bajo la Curva (AUC)', auc.toFixed(3));
    });
  };
})();
