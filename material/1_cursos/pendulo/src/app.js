/* ==========================================================================
   LÓGICA DE APLICACIÓN, CUADERNO DIGITAL & GRÁFICAS SVG · PÉNDULO SIMPLE
   Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca
   ========================================================================== */

(function (window, document) {
  'use strict';

  // Estado global del cuaderno y la aplicación
  const AppState = {
    banco: 1,
    grupo: '',
    gravedadRefKey: 'popayan',
    chartMode: 'linear', // 'linear' (T² vs L) o 'curve' (T vs L)
    activeRowIndex: 0,
    datos: [
      { id: 1, L: 0.30, dL: 0.001, t1: 11.02, t2: 10.98, t3: 11.05 },
      { id: 2, L: 0.50, dL: 0.001, t1: 14.21, t2: 14.18, t3: 14.25 },
      { id: 3, L: 0.70, dL: 0.001, t1: 16.82, t2: 16.78, t3: 16.85 },
      { id: 4, L: 0.90, dL: 0.001, t1: 19.06, t2: 19.12, t3: 19.02 },
      { id: 5, L: 1.10, dL: 0.001, t1: 21.08, t2: 21.01, t3: 21.14 },
      { id: 6, L: 1.30, dL: 0.001, t1: 22.92, t2: 22.88, t3: 22.96 }
    ]
  };

  let bench = null;

  document.addEventListener('DOMContentLoaded', () => {
    initUrlParams();
    initTheme();
    initTabs();
    initBench();
    initSetupPanel();
    initControls();
    initStopwatchUI();
    initNotebookTable();
    initChartControls();
    initNonlinearCalculator();
    recalcularTodo();
  });

  // 1. Lectura de parámetros en URL (?banco=X&grupo=Y)
  function initUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const b = parseInt(params.get('banco'), 10);
    if (b >= 1 && b <= 24) {
      AppState.banco = b;
    }
    const g = params.get('grupo');
    if (g) {
      AppState.grupo = decodeURIComponent(g);
    } else {
      AppState.grupo = localStorage.getItem(`pendulo_grupo_banco_${AppState.banco}`) || '';
    }
  }

  // 2. Control de Tema Oscuro / Claro
  function initTheme() {
    const btn = document.getElementById('btnThemeToggle');
    const savedTheme = localStorage.getItem('pendulo_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (btn) {
      btn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
      btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pendulo_theme', next);
        btn.textContent = next === 'light' ? '🌙' : '☀️';
        if (bench) bench.render();
        renderChart();
      });
    }
  }

  // 3. Navegación entre Pestañas
  function initTabs() {
    const navLinks = document.querySelectorAll('.nav a[data-tab]');
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (['banco', 'cuaderno', 'matematico', 'guia'].includes(hash)) {
        switchTab(hash);
      }
    });

    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['banco', 'cuaderno', 'matematico', 'guia'].includes(hash)) {
        switchTab(hash);
      }
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('.nav a[data-tab]').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.view-panel').forEach((panel) => {
      const isTarget = panel.id === `tab-${tabId}`;
      panel.hidden = !isTarget;
      panel.classList.toggle('active', isTarget);
    });

    if (tabId === 'banco' && bench) {
      setTimeout(() => bench.resize(), 50);
    } else if (tabId === 'cuaderno') {
      setTimeout(() => renderChart(), 50);
    }
  }

  // 4. Inicialización del Banco de Simulación
  function initBench() {
    bench = new window.PenduloBench('pendulumCanvas', {
      onStateChange: (st) => updateHUD(st),
      onLapComplete: (laps) => updateLapDisplay(laps)
    });

    // Cargar parámetros específicos del banco determinístico
    aplicarParametrosBanco();
  }

  function updateHUD(st) {
    const elAngle = document.getElementById('hudAngle');
    const elPeriod = document.getElementById('hudPeriod');
    const elOsc = document.getElementById('hudOscCount');

    if (elAngle) elAngle.textContent = `${st.thetaDeg.toFixed(1)}°`;
    if (elPeriod) elPeriod.textContent = `${st.T_teorico.toFixed(2)} s`;
    if (elOsc) elOsc.textContent = `${st.oscillationCount} / 10`;

    // Si llega a 10 oscilaciones y el cronómetro de la fotocompuerta estaba activo
    if (st.oscillationCount === 10 && bench.running) {
      showToast('✓ ¡10 oscilaciones completadas por la fotocompuerta!');
    }
  }

  function updateLapDisplay(laps) {
    const elLapCount = document.getElementById('stopwatchLapCount');
    const elTUnit = document.getElementById('stopwatchTUnit');
    if (elLapCount) elLapCount.textContent = laps.length;

    if (laps.length > 0 && elTUnit) {
      const totalSec = laps[laps.length - 1] / 1000;
      const unitT = totalSec / laps.length;
      elTUnit.textContent = `${unitT.toFixed(2)} s`;
    } else if (elTUnit) {
      elTUnit.textContent = '0.00 s';
    }
  }

  // 5. Configuración de Puesto (1 a 24) y Grupo
  function initSetupPanel() {
    const selBanco = document.getElementById('selBanco');
    const inpGrupo = document.getElementById('inpGrupo');
    const btnGuardar = document.getElementById('btnAplicarGrupo');

    if (selBanco) {
      selBanco.innerHTML = '';
      for (let i = 1; i <= 24; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Puesto N.º ${String(i).padStart(2, '0')}`;
        if (i === AppState.banco) opt.selected = true;
        selBanco.appendChild(opt);
      }

      selBanco.addEventListener('change', () => {
        AppState.banco = parseInt(selBanco.value, 10);
        AppState.grupo = localStorage.getItem(`pendulo_grupo_banco_${AppState.banco}`) || '';
        if (inpGrupo) inpGrupo.value = AppState.grupo;
        aplicarParametrosBanco();
        actualizarTopChip();
        showToast(`📍 Puesto N.º ${String(AppState.banco).padStart(2, '0')} activado.`);
      });
    }

    if (inpGrupo) {
      inpGrupo.value = AppState.grupo;
    }

    if (btnGuardar) {
      btnGuardar.addEventListener('click', () => {
        if (inpGrupo) {
          AppState.grupo = inpGrupo.value.trim();
          localStorage.setItem(`pendulo_grupo_banco_${AppState.banco}`, AppState.grupo);
          actualizarTopChip();
          showToast('✓ Integrantes del grupo guardados.');
        }
      });
    }

    actualizarTopChip();
  }

  function actualizarTopChip() {
    const elBanco = document.getElementById('topBanco');
    const elGrupo = document.getElementById('topGrupo');
    if (elBanco) elBanco.textContent = String(AppState.banco).padStart(2, '0');
    if (elGrupo) elGrupo.textContent = AppState.grupo || 'Sin asignar';
  }

  function aplicarParametrosBanco() {
    const bParams = window.PenduloEngine.getBancoParams(AppState.banco);
    const gRef = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.gravedadRefKey].g;

    bench.setParameters({
      g: gRef,
      m: bParams.masaReal,
      amort: bParams.amortiguamientoAire
    });
  }

  // 6. Controles del Banco de Simulación
  function initControls() {
    // Botones de simulación
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnReset = document.getElementById('btnReset');
    const selSpeed = document.getElementById('selSpeed');
    const btnVectors = document.getElementById('btnToggleVectors');
    const btnPhotogate = document.getElementById('btnTogglePhotogate');

    if (btnStart) btnStart.addEventListener('click', () => bench.start());
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        bench.pause();
        btnPause.textContent = bench.paused ? '▶ Reanudar' : '⏸ Pausar';
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        bench.reset();
        if (btnPause) btnPause.textContent = '⏸ Pausar';
      });
    }

    if (selSpeed) {
      selSpeed.addEventListener('change', () => {
        bench.timeSpeed = parseFloat(selSpeed.value);
      });
    }

    if (btnVectors) {
      btnVectors.addEventListener('click', () => {
        bench.showVectors = !bench.showVectors;
        btnVectors.classList.toggle('primary', bench.showVectors);
      });
    }

    if (btnPhotogate) {
      btnPhotogate.classList.add('primary');
      btnPhotogate.addEventListener('click', () => {
        bench.showPhotogate = !bench.showPhotogate;
        btnPhotogate.classList.toggle('primary', bench.showPhotogate);
      });
    }

    // Slider de Longitud (L)
    const rngLength = document.getElementById('rngLength');
    const valLength = document.getElementById('valLength');
    const valLengthShort = document.getElementById('valLengthShort');

    if (rngLength) {
      rngLength.addEventListener('input', () => {
        const val = parseFloat(rngLength.value);
        bench.setParameters({ L: val });
        if (valLength) valLength.textContent = `${val.toFixed(2)} m (${(val * 100).toFixed(1)} cm)`;
        if (valLengthShort) valLengthShort.textContent = `${val.toFixed(2)} m`;
      });
    }

    // Botones preset de longitud
    document.querySelectorAll('.preset-l').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lVal = parseFloat(btn.getAttribute('data-l'));
        if (rngLength) rngLength.value = lVal;
        bench.setParameters({ L: lVal });
        if (valLength) valLength.textContent = `${lVal.toFixed(2)} m (${(lVal * 100).toFixed(1)} cm)`;
        if (valLengthShort) valLengthShort.textContent = `${lVal.toFixed(2)} m`;
      });
    });

    // Slider de Ángulo Inicial (θ₀)
    const rngAngle0 = document.getElementById('rngAngle0');
    const valAngle0 = document.getElementById('valAngle0');
    const valAngle0Short = document.getElementById('valAngle0Short');
    const angleWarning = document.getElementById('angleWarning');

    if (rngAngle0) {
      rngAngle0.addEventListener('input', () => {
        const val = parseFloat(rngAngle0.value);
        bench.setParameters({ theta0Deg: val });
        if (valAngle0) valAngle0.textContent = `${val.toFixed(1)}°`;
        if (valAngle0Short) valAngle0Short.textContent = `${val.toFixed(0)}°`;
        if (angleWarning) angleWarning.style.display = val > 10 ? 'block' : 'none';
      });
    }

    // Slider de Masa (m)
    const rngMass = document.getElementById('rngMass');
    const valMass = document.getElementById('valMass');
    if (rngMass) {
      rngMass.addEventListener('input', () => {
        const val = parseFloat(rngMass.value);
        bench.setParameters({ m: val });
        if (valMass) valMass.textContent = `${Math.round(val * 1000)} g`;
      });
    }

    // Selector de Entorno Gravitacional
    const selGravity = document.getElementById('selGravity');
    if (selGravity) {
      selGravity.addEventListener('change', () => {
        AppState.gravedadRefKey = selGravity.value;
        const gVal = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.gravedadRefKey].g;
        bench.setParameters({ g: gVal });
        recalcularTodo();
      });
    }
  }

  // 7. Interfaz del Cronómetro Digital
  function initStopwatchUI() {
    const elDisplay = document.getElementById('stopwatchDisplay');
    const btnStart = document.getElementById('btnSwStart');
    const btnLap = document.getElementById('btnSwLap');
    const btnReset = document.getElementById('btnSwReset');
    const btnSend = document.getElementById('btnSendToNotebook');

    function updateDisplayLoop() {
      if (bench) {
        const ms = bench.getStopwatchTime();
        if (elDisplay) elDisplay.textContent = formatStopwatchTime(ms);
      }
      requestAnimationFrame(updateDisplayLoop);
    }
    requestAnimationFrame(updateDisplayLoop);

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        bench.stopwatchToggle();
        btnStart.textContent = bench.stopwatchRunning ? '⏸ Detener' : '⏱ Iniciar';
      });
    }

    if (btnLap) {
      btnLap.addEventListener('click', () => {
        bench.stopwatchLap();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        bench.stopwatchReset();
        if (btnStart) btnStart.textContent = '⏱ Iniciar / Detener';
      });
    }

    if (btnSend) {
      btnSend.addEventListener('click', () => {
        const totalMs = bench.getStopwatchTime();
        if (totalMs <= 0) {
          showToast('⚠️ El cronómetro está en cero. Mide primero el tiempo.');
          return;
        }

        const sec = parseFloat((totalMs / 1000).toFixed(2));
        enviarTiempoACuaderno(sec);
      });
    }
  }

  function formatStopwatchTime(ms) {
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSec = Math.floor(totalCentis / 100);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60);

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  function enviarTiempoACuaderno(tiempoSec) {
    // Buscar la primera celda de t1, t2 o t3 que esté vacía o en cero
    let insertado = false;
    for (let i = 0; i < AppState.datos.length; i++) {
      const row = AppState.datos[i];
      if (!row.t1) {
        row.t1 = tiempoSec;
        insertado = true;
        break;
      } else if (!row.t2) {
        row.t2 = tiempoSec;
        insertado = true;
        break;
      } else if (!row.t3) {
        row.t3 = tiempoSec;
        insertado = true;
        break;
      }
    }

    // Si todas las celdas de las filas existentes están llenas, añadir una nueva fila
    if (!insertado) {
      const currentL = bench ? bench.L : 0.80;
      AppState.datos.push({
        id: AppState.datos.length + 1,
        L: currentL,
        dL: 0.001,
        t1: tiempoSec,
        t2: null,
        t3: null
      });
    }

    reconstruirTablaHTML();
    recalcularTodo();
    showToast(`✓ Tiempo ${tiempoSec} s transferido al Cuaderno.`);
  }

  // 8. Construcción y Lógica de la Tabla del Cuaderno
  function initNotebookTable() {
    const btnAdd = document.getElementById('btnAddRow');
    const btnAuto = document.getElementById('btnAutoFillGroupData');
    const btnClear = document.getElementById('btnClearTable');
    const btnExport = document.getElementById('btnExportCSV');

    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const lastL = AppState.datos.length > 0 ? AppState.datos[AppState.datos.length - 1].L : 0.20;
        const newL = parseFloat((lastL + 0.15).toFixed(2));
        AppState.datos.push({
          id: Date.now(),
          L: Math.min(1.50, newL),
          dL: 0.001,
          t1: null,
          t2: null,
          t3: null
        });
        reconstruirTablaHTML();
        recalcularTodo();
      });
    }

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        generarDatosDeterministasBanco();
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('¿Deseas vaciar la tabla de mediciones?')) {
          AppState.datos = [];
          reconstruirTablaHTML();
          recalcularTodo();
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => exportarCSV());
    }

    reconstruirTablaHTML();
  }

  function reconstruirTablaHTML() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (AppState.datos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="14" style="padding:24px; color:var(--sub);">No hay mediciones registradas. Pulsa "Añadir Nueva Fila" o "Autollenar con Datos del Banco".</td></tr>`;
      return;
    }

    AppState.datos.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><input type="number" step="0.01" min="0.10" max="2.00" value="${row.L !== null ? row.L : ''}" data-idx="${idx}" data-field="L"></td>
        <td><input type="number" step="0.0005" min="0.0001" value="${row.dL !== null ? row.dL : 0.001}" data-idx="${idx}" data-field="dL"></td>
        <td><input type="number" step="0.01" value="${row.t1 !== null ? row.t1 : ''}" placeholder="—" data-idx="${idx}" data-field="t1"></td>
        <td><input type="number" step="0.01" value="${row.t2 !== null ? row.t2 : ''}" placeholder="—" data-idx="${idx}" data-field="t2"></td>
        <td><input type="number" step="0.01" value="${row.t3 !== null ? row.t3 : ''}" placeholder="—" data-idx="${idx}" data-field="t3"></td>
        <td class="calc-col" id="col-prom-${idx}">—</td>
        <td class="calc-col" id="col-st-${idx}">—</td>
        <td class="calc-col" id="col-T-${idx}">—</td>
        <td class="calc-col" id="col-dT-${idx}">—</td>
        <td class="calc-col" id="col-T2-${idx}">—</td>
        <td class="calc-col" id="col-dT2-${idx}">—</td>
        <td class="calc-col" id="col-gi-${idx}">—</td>
        <td>
          <button type="button" class="btn small quiet btn-del-row" data-idx="${idx}" title="Eliminar fila">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Eventos de inputs
    tbody.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const i = parseInt(e.target.getAttribute('data-idx'), 10);
        const f = e.target.getAttribute('data-field');
        const v = e.target.value.trim() !== '' ? parseFloat(e.target.value) : null;
        AppState.datos[i][f] = v;
        recalcularTodo();
      });
    });

    tbody.querySelectorAll('.btn-del-row').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(btn.getAttribute('data-idx'), 10);
        AppState.datos.splice(i, 1);
        reconstruirTablaHTML();
        recalcularTodo();
      });
    });
  }

  // 9. Cálculos Metrológicos Completos y Actualización de Tarjetas
  function recalcularTodo() {
    const gRefObj = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.gravedadRefKey];
    const gRef = gRefObj.g;
    const uRef = gRefObj.u;

    const puntosValidos = [];

    AppState.datos.forEach((row, idx) => {
      const elProm = document.getElementById(`col-prom-${idx}`);
      const elSt = document.getElementById(`col-st-${idx}`);
      const elT = document.getElementById(`col-T-${idx}`);
      const elDT = document.getElementById(`col-dT-${idx}`);
      const elT2 = document.getElementById(`col-T2-${idx}`);
      const elDT2 = document.getElementById(`col-dT2-${idx}`);
      const elGi = document.getElementById(`col-gi-${idx}`);

      const tiempos = [row.t1, row.t2, row.t3].filter((t) => typeof t === 'number' && !isNaN(t) && t > 0);

      if (tiempos.length > 0 && typeof row.L === 'number' && row.L > 0) {
        const prom10 = window.PenduloEngine.promedio(tiempos);
        const st = tiempos.length > 1 ? window.PenduloEngine.desviacionEstandar(tiempos, prom10) : 0.05;

        // Periodo de 1 oscilación: T = prom10 / 10
        const T = prom10 / 10;

        // Incertidumbre combinada del tiempo:
        // uA = st / sqrt(N), uB = 0.10s (tiempo de reacción de cronometrista), uC = sqrt(uA² + uB²)
        const uA = st / Math.sqrt(tiempos.length);
        const uB = 0.10;
        const uC_10 = Math.sqrt(uA * uA + uB * uB);
        const deltaT = uC_10 / 10; // incertidumbre en el periodo individual

        const T2 = T * T;
        const deltaT2 = 2 * T * deltaT;

        // g_i puntual = 4*pi²*L / T²
        const gi = (4 * Math.PI * Math.PI * row.L) / T2;

        if (elProm) elProm.textContent = prom10.toFixed(2);
        if (elSt) elSt.textContent = st.toFixed(2);
        if (elT) elT.textContent = T.toFixed(3);
        if (elDT) elDT.textContent = `±${deltaT.toFixed(3)}`;
        if (elT2) elT2.textContent = T2.toFixed(3);
        if (elDT2) elDT2.textContent = `±${deltaT2.toFixed(3)}`;
        if (elGi) elGi.textContent = gi.toFixed(2);

        puntosValidos.push({
          x: row.L,
          dx: row.dL || 0.001,
          y: T2,
          dy: deltaT2,
          T: T,
          dT: deltaT
        });
      } else {
        if (elProm) elProm.textContent = '—';
        if (elSt) elSt.textContent = '—';
        if (elT) elT.textContent = '—';
        if (elDT) elDT.textContent = '—';
        if (elT2) elT2.textContent = '—';
        if (elDT2) elDT2.textContent = '—';
        if (elGi) elGi.textContent = '—';
      }
    });

    // Ejecutar regresión lineal
    if (puntosValidos.length >= 2) {
      const reg = window.PenduloEngine.regresionLineal(puntosValidos);
      const comp = window.PenduloEngine.evaluarCompatibilidad(reg.g_exp, reg.u_g, gRef, uRef);

      actualizarCardsResultados(reg, comp);
      AppState.ultimaRegresion = reg;
    } else {
      resetCardsResultados();
      AppState.ultimaRegresion = null;
    }

    renderChart();
  }

  function actualizarCardsResultados(reg, comp) {
    const elGExp = document.getElementById('resGExp');
    const elUG = document.getElementById('resUG');
    const elErrRel = document.getElementById('resErrRel');
    const elR2 = document.getElementById('resR2');
    const elZScore = document.getElementById('resZScore');
    const elZHint = document.getElementById('resZScoreHint');

    const cardGExp = document.getElementById('cardGExp');
    const cardZScore = document.getElementById('cardZScore');

    if (elGExp) elGExp.textContent = `${reg.g_exp.toFixed(3)} m/s²`;
    if (elUG) elUG.textContent = `± ${reg.u_g.toFixed(3)} m/s²`;
    if (elErrRel) elErrRel.textContent = `${comp.errorRelativoPct.toFixed(2)} %`;
    if (elR2) elR2.textContent = reg.r2.toFixed(4);

    if (elZScore) elZScore.textContent = `Z = ${comp.zScore.toFixed(2)}`;
    if (elZHint) elZHint.textContent = comp.veredicto;

    if (cardZScore) {
      cardZScore.className = `res-card ${comp.clase}`;
    }
    if (cardGExp) {
      cardGExp.className = `res-card ${comp.clase}`;
    }

    const eqText = document.getElementById('chartEquationText');
    const slopeText = document.getElementById('chartSlopeText');
    if (eqText) eqText.innerHTML = `Ecuación de la recta: <b>T² = (${reg.m.toFixed(3)})·L + (${reg.c.toFixed(3)})</b>`;
    if (slopeText) slopeText.innerHTML = `Pendiente: <b>m = ${reg.m.toFixed(3)} ± ${reg.u_m.toFixed(3)} s²/m</b> | R² = <b>${reg.r2.toFixed(4)}</b>`;
  }

  function resetCardsResultados() {
    const elGExp = document.getElementById('resGExp');
    const elUG = document.getElementById('resUG');
    const elErrRel = document.getElementById('resErrRel');
    const elR2 = document.getElementById('resR2');
    const elZScore = document.getElementById('resZScore');
    const elZHint = document.getElementById('resZScoreHint');

    if (elGExp) elGExp.textContent = '—';
    if (elUG) elUG.textContent = '—';
    if (elErrRel) elErrRel.textContent = '—';
    if (elR2) elR2.textContent = '—';
    if (elZScore) elZScore.textContent = '—';
    if (elZHint) elZHint.textContent = 'Requiere al menos 2 longitudes distintas';
  }

  // 10. Generador de Datos Deterministas por Banco
  function generarDatosDeterministasBanco() {
    const bParams = window.PenduloEngine.getBancoParams(AppState.banco);
    const gRef = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.gravedadRefKey].g;
    const rng = window.PenduloEngine.createRng(AppState.banco * 999 + 55);

    const longitudes = [0.30, 0.50, 0.70, 0.90, 1.10, 1.30];

    AppState.datos = longitudes.map((lBase, i) => {
      const L_real = lBase + bParams.offsetLongitud;
      const T_teorico = 2 * Math.PI * Math.sqrt(L_real / gRef);
      const t10_base = T_teorico * 10;

      // Ensayos con dispersión humana
      const t1 = parseFloat((t10_base + (rng() - 0.5) * bParams.ruidoCronometro + bParams.tiempoReaccion * 0.1).toFixed(2));
      const t2 = parseFloat((t10_base + (rng() - 0.5) * bParams.ruidoCronometro - bParams.tiempoReaccion * 0.08).toFixed(2));
      const t3 = parseFloat((t10_base + (rng() - 0.5) * bParams.ruidoCronometro + (rng() - 0.5) * 0.05).toFixed(2));

      return {
        id: i + 1,
        L: lBase,
        dL: 0.001,
        t1,
        t2,
        t3
      };
    });

    reconstruirTablaHTML();
    recalcularTodo();
    showToast(`✓ Datos del Puesto N.º ${String(AppState.banco).padStart(2, '0')} cargados con éxito.`);
  }

  // 11. Gráficas SVG Interactivas
  function initChartControls() {
    const btnLinear = document.getElementById('btnChartLinear');
    const btnCurve = document.getElementById('btnChartCurve');
    const subtitle = document.getElementById('chartSubtitle');

    if (btnLinear) {
      btnLinear.addEventListener('click', () => {
        AppState.chartMode = 'linear';
        btnLinear.classList.add('active');
        if (btnCurve) btnCurve.classList.remove('active');
        if (subtitle) subtitle.textContent = 'Linealización: T² en función de L con barras de error e intervalo de ajuste';
        renderChart();
      });
    }

    if (btnCurve) {
      btnCurve.addEventListener('click', () => {
        AppState.chartMode = 'curve';
        btnCurve.classList.add('active');
        if (btnLinear) btnLinear.classList.remove('active');
        if (subtitle) subtitle.textContent = 'Curva Real: Periodo T en función de la longitud L (Comportamiento Potencial T ∝ √L)';
        renderChart();
      });
    }
  }

  function renderChart() {
    const svg = document.getElementById('svgChart');
    if (!svg) return;

    const w = 800;
    const h = 360;
    const padL = 65;
    const padR = 30;
    const padT = 25;
    const padB = 45;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const isLinear = AppState.chartMode === 'linear';

    // Extraer puntos con datos completos
    const puntos = [];
    AppState.datos.forEach((row) => {
      const tiempos = [row.t1, row.t2, row.t3].filter((t) => typeof t === 'number' && t > 0);
      if (tiempos.length > 0 && typeof row.L === 'number' && row.L > 0) {
        const prom10 = window.PenduloEngine.promedio(tiempos);
        const T = prom10 / 10;
        const T2 = T * T;
        puntos.push({
          L: row.L,
          dL: row.dL || 0.001,
          T: T,
          T2: T2,
          dT: 0.015,
          dT2: 2 * T * 0.015
        });
      }
    });

    if (puntos.length === 0) {
      svg.innerHTML = `
        <text x="${w / 2}" y="${h / 2}" fill="#64748b" text-anchor="middle" font-size="14" font-family="var(--body)">
          Registra al menos 2 mediciones en la tabla para graficar
        </text>
      `;
      return;
    }

    // Rangos de escala
    const maxX = Math.max(1.5, ...puntos.map((p) => p.L * 1.15));
    const minX = 0;

    let maxY = 0;
    let minY = 0;
    if (isLinear) {
      maxY = Math.max(6.0, ...puntos.map((p) => p.T2 * 1.15));
    } else {
      maxY = Math.max(2.5, ...puntos.map((p) => p.T * 1.15));
    }

    const scaleX = (x) => padL + ((x - minX) / (maxX - minX)) * chartW;
    const scaleY = (y) => padT + chartH - ((y - minY) / (maxY - minY)) * chartH;

    let svgContent = '';

    // Cuadrícula y ejes
    for (let i = 0; i <= 5; i++) {
      const yVal = minY + (i / 5) * (maxY - minY);
      const yPos = scaleY(yVal);
      svgContent += `
        <line x1="${padL}" y1="${yPos}" x2="${w - padR}" y2="${yPos}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3" />
        <text x="${padL - 10}" y="${yPos + 4}" fill="#94a3b8" text-anchor="end" font-size="11" font-family="var(--mono)">
          ${yVal.toFixed(1)}
        </text>
      `;
    }

    for (let i = 0; i <= 6; i++) {
      const xVal = minX + (i / 6) * (maxX - minX);
      const xPos = scaleX(xVal);
      svgContent += `
        <line x1="${xPos}" y1="${padT}" x2="${xPos}" y2="${h - padB}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3" />
        <text x="${xPos}" y="${h - padB + 18}" fill="#94a3b8" text-anchor="middle" font-size="11" font-family="var(--mono)">
          ${xVal.toFixed(2)}
        </text>
      `;
    }

    // Ejes principales
    svgContent += `
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#475569" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#475569" stroke-width="1.5" />
      <text x="${w / 2}" y="${h - 8}" fill="#cbd5e1" text-anchor="middle" font-size="12" font-family="var(--mono)" font-weight="bold">
        Longitud L (m)
      </text>
      <text x="18" y="${h / 2}" fill="#cbd5e1" text-anchor="middle" font-size="12" font-family="var(--mono)" font-weight="bold" transform="rotate(-90, 18, ${h / 2})">
        ${isLinear ? 'Periodo al Cuadrado T² (s²)' : 'Periodo T (s)'}
      </text>
    `;

    // Si es lineal y hay regresión, dibujar la recta de ajuste
    if (isLinear && AppState.ultimaRegresion && AppState.ultimaRegresion.valido) {
      const reg = AppState.ultimaRegresion;
      const x1 = 0;
      const y1 = reg.m * x1 + reg.c;
      const x2 = maxX;
      const y2 = reg.m * x2 + reg.c;

      svgContent += `
        <line x1="${scaleX(x1)}" y1="${scaleY(y1)}" x2="${scaleX(x2)}" y2="${scaleY(y2)}" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" />
      `;
    } else if (!isLinear) {
      // Dibujar la curva teórica T = 2π√(L/g)
      const gRef = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.gravedadRefKey].g;
      let pathD = '';
      const steps = 60;
      for (let s = 0; s <= steps; s++) {
        const curL = (s / steps) * maxX;
        const curT = 2 * Math.PI * Math.sqrt(curL / gRef);
        const px = scaleX(curL);
        const py = scaleY(curT);
        pathD += (s === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
      }
      svgContent += `<path d="${pathD}" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="5,4" />`;
    }

    // Dibujar puntos experimentales y barras de error
    puntos.forEach((p) => {
      const cx = scaleX(p.L);
      const cy = scaleY(isLinear ? p.T2 : p.T);
      const dyVal = isLinear ? p.dT2 : p.dT;
      const cyTop = scaleY((isLinear ? p.T2 : p.T) + dyVal);
      const cyBot = scaleY((isLinear ? p.T2 : p.T) - dyVal);

      // Barras de error verticales
      svgContent += `
        <line x1="${cx}" y1="${cyTop}" x2="${cx}" y2="${cyBot}" stroke="#f59e0b" stroke-width="1.5" />
        <line x1="${cx - 4}" y1="${cyTop}" x2="${cx + 4}" y2="${cyTop}" stroke="#f59e0b" stroke-width="1.5" />
        <line x1="${cx - 4}" y1="${cyBot}" x2="${cx + 4}" y2="${cyBot}" stroke="#f59e0b" stroke-width="1.5" />
      `;

      // Punto experimental
      svgContent += `
        <circle cx="${cx}" cy="${cy}" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5">
          <title>L: ${p.L} m, ${isLinear ? 'T²: ' + p.T2.toFixed(3) + ' s²' : 'T: ' + p.T.toFixed(3) + ' s'}</title>
        </circle>
      `;
    });

    svg.innerHTML = svgContent;
  }

  // 12. Calculadora de No Linealidad en Péndulo Matemático
  function initNonlinearCalculator() {
    const rng = document.getElementById('rngMathAngle');
    const lbl = document.getElementById('mathAngleLabel');
    const elT0 = document.getElementById('mathT0');
    const elTExact = document.getElementById('mathTExact');
    const elPct = document.getElementById('mathDeltaPct');
    const elGDelta = document.getElementById('mathGDelta');

    if (rng) {
      rng.addEventListener('input', () => {
        const deg = parseFloat(rng.value);
        const rad = deg * (Math.PI / 180);
        const L = 0.80;
        const g = 9.776;

        const T0 = 2 * Math.PI * Math.sqrt(L / g);
        const TExact = window.PenduloEngine.calcularPeriodoTeorico(L, g, rad);
        const deltaPct = ((TExact - T0) / T0) * 100;
        const gBias = -2 * deltaPct; // porque g ~ 1/T²

        if (lbl) lbl.textContent = `${deg.toFixed(1)}°`;
        if (elT0) elT0.textContent = `${T0.toFixed(3)} s`;
        if (elTExact) elTExact.textContent = `${TExact.toFixed(3)} s`;
        if (elPct) elPct.textContent = `+${deltaPct.toFixed(2)} %`;
        if (elGDelta) elGDelta.textContent = `${gBias.toFixed(2)} % de sesgo si no se corrige`;
      });
    }
  }

  // 13. Exportación a CSV
  function exportarCSV() {
    let csv = '\uFEFF'; // BOM para Excel
    csv += 'Laboratorio de Pendulo Simple y Medicion de Gravedad - PhysicsAILab\r\n';
    csv += `Puesto N.o;${AppState.banco};Grupo;${AppState.grupo || 'Sin asignar'};Gravedad Referencia;${AppState.gravedadRefKey}\r\n\r\n`;
    csv += 'Fila;Longitud_L_m;Delta_L_m;t1_s;t2_s;t3_s;t_prom_10s;st_s;Periodo_T_s;Delta_T_s;T2_s2;Delta_T2_s2;g_puntual_ms2\r\n';

    AppState.datos.forEach((r, i) => {
      const tiempos = [r.t1, r.t2, r.t3].filter((t) => typeof t === 'number' && t > 0);
      const prom10 = tiempos.length > 0 ? window.PenduloEngine.promedio(tiempos) : 0;
      const st = tiempos.length > 1 ? window.PenduloEngine.desviacionEstandar(tiempos, prom10) : 0;
      const T = prom10 / 10;
      const dT = 0.015;
      const T2 = T * T;
      const dT2 = 2 * T * dT;
      const gi = T2 > 0 ? (4 * Math.PI * Math.PI * r.L) / T2 : 0;

      csv += `${i + 1};${r.L};${r.dL};${r.t1 || ''};${r.t2 || ''};${r.t3 || ''};${prom10.toFixed(2)};${st.toFixed(2)};${T.toFixed(3)};${dT.toFixed(3)};${T2.toFixed(3)};${dT2.toFixed(3)};${gi.toFixed(2)}\r\n`;
    });

    if (AppState.ultimaRegresion && AppState.ultimaRegresion.valido) {
      const reg = AppState.ultimaRegresion;
      csv += '\r\nResultados de Regresion Lineal (T2 vs L);\r\n';
      csv += `Pendiente m (s2/m);${reg.m.toFixed(4)};Incertidumbre m;${reg.u_m.toFixed(4)}\r\n`;
      csv += `Intercepto c (s2);${reg.c.toFixed(4)};Incertidumbre c;${reg.u_c.toFixed(4)}\r\n`;
      csv += `Coeficiente R2;${reg.r2.toFixed(4)}\r\n`;
      csv += `Gravedad Experimental g_exp (m/s2);${reg.g_exp.toFixed(3)};Incertidumbre g (m/s2);${reg.u_g.toFixed(3)}\r\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pendulo_Simple_Puesto_${String(AppState.banco).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Archivo CSV descargado exitosamente.');
  }

  // Notificación Toast
  function showToast(msg) {
    const prev = document.querySelector('.lab-toast');
    if (prev) prev.remove();

    const toast = document.createElement('div');
    toast.className = 'lab-toast';
    toast.innerHTML = `<span>⚛️</span> <span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

})(window, document);
