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
    // Datos del Cuaderno Virtual (Simulación)
    datos: [
      { id: 1, L: 0.30, dL: 0.001, t1: 11.02, t2: 10.98, t3: 11.05 },
      { id: 2, L: 0.50, dL: 0.001, t1: 14.21, t2: 14.18, t3: 14.25 },
      { id: 3, L: 0.70, dL: 0.001, t1: 16.82, t2: 16.78, t3: 16.85 },
      { id: 4, L: 0.90, dL: 0.001, t1: 19.06, t2: 19.12, t3: 19.02 },
      { id: 5, L: 1.10, dL: 0.001, t1: 21.08, t2: 21.01, t3: 21.14 },
      { id: 6, L: 1.30, dL: 0.001, t1: 22.92, t2: 22.88, t3: 22.96 }
    ],
    // Datos del Laboratorio Real (Presencial)
    datosReales: [
      { id: 1, L: 0.35, dL: 0.001, t1: 11.90, t2: 11.85, t3: 11.95 },
      { id: 2, L: 0.55, dL: 0.001, t1: 14.92, t2: 14.88, t3: 14.95 },
      { id: 3, L: 0.75, dL: 0.001, t1: 17.41, t2: 17.38, t3: 17.46 },
      { id: 4, L: 0.95, dL: 0.001, t1: 19.62, t2: 19.58, t3: 19.68 },
      { id: 5, L: 1.15, dL: 0.001, t1: 21.58, t2: 21.52, t3: 21.62 },
      { id: 6, L: 1.35, dL: 0.001, t1: 23.38, t2: 23.32, t3: 23.44 }
    ],
    realConfig: {
      dL: 0.001,
      uTimer: 0.15,
      nOsc: 10,
      gRefKey: 'popayan',
      chartMode: 'linear',
      ultimaRegresion: null
    }
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
    initRealLab();
    initChartControls();
    initNonlinearCalculator();
    recalcularTodo();
    recalcularRealTodo();
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
        renderRealChart();
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
      if (['banco', 'real', 'cuaderno', 'matematico', 'guia'].includes(hash)) {
        switchTab(hash);
      }
    });

    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['banco', 'real', 'cuaderno', 'matematico', 'guia'].includes(hash)) {
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
    } else if (tabId === 'real') {
      setTimeout(() => renderRealChart(), 50);
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

    document.querySelectorAll('.preset-l').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lVal = parseFloat(btn.getAttribute('data-l'));
        if (rngLength) rngLength.value = lVal;
        bench.setParameters({ L: lVal });
        if (valLength) valLength.textContent = `${lVal.toFixed(2)} m (${(lVal * 100).toFixed(1)} cm)`;
        if (valLengthShort) valLengthShort.textContent = `${lVal.toFixed(2)} m`;
      });
    });

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

    const rngMass = document.getElementById('rngMass');
    const valMass = document.getElementById('valMass');
    if (rngMass) {
      rngMass.addEventListener('input', () => {
        const val = parseFloat(rngMass.value);
        bench.setParameters({ m: val });
        if (valMass) valMass.textContent = `${Math.round(val * 1000)} g`;
      });
    }

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

  // 8. Construcción y Lógica de la Tabla del Cuaderno Virtual
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
        if (confirm('¿Deseas vaciar la tabla de mediciones del simulador?')) {
          AppState.datos = [];
          reconstruirTablaHTML();
          recalcularTodo();
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => exportarCSV(false));
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
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-idx'), 10);
        AppState.datos.splice(i, 1);
        reconstruirTablaHTML();
        recalcularTodo();
      });
    });
  }

  // 9. Cálculos Metrológicos Completos del Cuaderno Virtual
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

        const T = prom10 / 10;
        const uA = st / Math.sqrt(tiempos.length);
        const uB = 0.10;
        const uC_10 = Math.sqrt(uA * uA + uB * uB);
        const deltaT = uC_10 / 10;

        const T2 = T * T;
        const deltaT2 = 2 * T * deltaT;
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

    if (cardZScore) cardZScore.className = `res-card ${comp.clase}`;
    if (cardGExp) cardGExp.className = `res-card ${comp.clase}`;

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

  // ==========================================================================
  // 11. MÓDULO EXCLUSIVO: LABORATORIO REAL (PRESENCIAL)
  // ==========================================================================

  function initRealLab() {
    const btnToggleImport = document.getElementById('btnToggleRealImport');
    const boxImport = document.getElementById('boxRealImport');
    const btnCloseImport = document.getElementById('btnCloseRealImport');
    const btnProcessImport = document.getElementById('btnProcessRealImport');
    const btnAddRealRow = document.getElementById('btnAddRealRow');
    const btnLoadSample = document.getElementById('btnLoadSampleRealData');
    const btnExportCSVReal = document.getElementById('btnExportRealCSV');
    const btnPrintReal = document.getElementById('btnPrintRealReport');
    const btnClearReal = document.getElementById('btnClearRealTable');

    const selLenInst = document.getElementById('selRealLenInst');
    const selTimerInst = document.getElementById('selRealTimerInst');
    const selOscCount = document.getElementById('selRealOscCount');
    const selGravity = document.getElementById('selRealGravity');

    const btnLinear = document.getElementById('btnRealChartLinear');
    const btnCurve = document.getElementById('btnRealChartCurve');

    if (btnToggleImport && boxImport) {
      btnToggleImport.addEventListener('click', () => {
        boxImport.hidden = !boxImport.hidden;
      });
    }

    if (btnCloseImport && boxImport) {
      btnCloseImport.addEventListener('click', () => {
        boxImport.hidden = true;
      });
    }

    if (btnProcessImport) {
      btnProcessImport.addEventListener('click', () => {
        const txt = document.getElementById('txtRealImport').value;
        procesarImportacionExcel(txt);
      });
    }

    if (btnAddRealRow) {
      btnAddRealRow.addEventListener('click', () => {
        const lastL = AppState.datosReales.length > 0 ? AppState.datosReales[AppState.datosReales.length - 1].L : 0.30;
        const newL = parseFloat((lastL + 0.15).toFixed(2));
        AppState.datosReales.push({
          id: Date.now(),
          L: Math.min(2.0, newL),
          dL: AppState.realConfig.dL,
          t1: null,
          t2: null,
          t3: null
        });
        reconstruirTablaRealHTML();
        recalcularRealTodo();
      });
    }

    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        cargarMuestraExperimentalReal();
      });
    }

    if (btnClearReal) {
      btnClearReal.addEventListener('click', () => {
        if (confirm('¿Deseas vaciar la tabla de laboratorio real?')) {
          AppState.datosReales = [];
          reconstruirTablaRealHTML();
          recalcularRealTodo();
        }
      });
    }

    if (btnExportCSVReal) {
      btnExportCSVReal.addEventListener('click', () => exportarCSV(true));
    }

    if (btnPrintReal) {
      btnPrintReal.addEventListener('click', () => {
        window.print();
      });
    }

    if (selLenInst) {
      selLenInst.addEventListener('change', () => {
        AppState.realConfig.dL = parseFloat(selLenInst.value);
        AppState.datosReales.forEach((r) => { r.dL = AppState.realConfig.dL; });
        reconstruirTablaRealHTML();
        recalcularRealTodo();
      });
    }

    if (selTimerInst) {
      selTimerInst.addEventListener('change', () => {
        AppState.realConfig.uTimer = parseFloat(selTimerInst.value);
        recalcularRealTodo();
      });
    }

    if (selOscCount) {
      selOscCount.addEventListener('change', () => {
        AppState.realConfig.nOsc = parseInt(selOscCount.value, 10) || 10;
        recalcularRealTodo();
      });
    }

    if (selGravity) {
      selGravity.addEventListener('change', () => {
        AppState.realConfig.gRefKey = selGravity.value;
        recalcularRealTodo();
      });
    }

    if (btnLinear && btnCurve) {
      btnLinear.addEventListener('click', () => {
        AppState.realConfig.chartMode = 'linear';
        btnLinear.classList.add('active');
        btnCurve.classList.remove('active');
        document.getElementById('chartRealSubtitle').textContent = 'Linealización con Datos Reales: T² vs L con barras de incertidumbre y recta de ajuste';
        renderRealChart();
      });

      btnCurve.addEventListener('click', () => {
        AppState.realConfig.chartMode = 'curve';
        btnCurve.classList.add('active');
        btnLinear.classList.remove('active');
        document.getElementById('chartRealSubtitle').textContent = 'Curva Real: Periodo T en función de L con ajuste potencial experimental';
        renderRealChart();
      });
    }

    reconstruirTablaRealHTML();
  }

  // Parsear texto copiado desde Excel o Google Sheets
  function procesarImportacionExcel(rawText) {
    if (!rawText || !rawText.trim()) {
      showToast('⚠️ Pega primero las filas copiadas desde Excel o Sheets.');
      return;
    }

    const lineas = rawText.trim().split(/\r?\n/);
    const nuevasFilas = [];

    lineas.forEach((line, idx) => {
      // Ignorar encabezados textuales si los copiaron
      if (/[a-zA-Z]/.test(line) && !line.includes('e-') && !line.includes('E-')) {
        return;
      }

      // Separar por tabulador, punto y coma, o comas/espacios
      let tokens = line.split(/\t|;/);
      if (tokens.length <= 1) {
        tokens = line.trim().split(/[\s,]+/);
      }

      const nums = tokens.map((t) => parseFloat(t.replace(',', '.'))).filter((n) => !isNaN(n));

      if (nums.length >= 2) {
        const L = nums[0];
        let t1 = null, t2 = null, t3 = null;

        if (nums.length >= 4) {
          t1 = nums[1];
          t2 = nums[2];
          t3 = nums[3];
        } else if (nums.length === 3) {
          t1 = nums[1];
          t2 = nums[2];
        } else if (nums.length === 2) {
          t1 = nums[1];
        }

        nuevasFilas.push({
          id: Date.now() + idx,
          L: L,
          dL: AppState.realConfig.dL,
          t1,
          t2,
          t3
        });
      }
    });

    if (nuevasFilas.length === 0) {
      showToast('⚠️ No se detectaron números válidos. Revisa el formato de copiado.');
      return;
    }

    AppState.datosReales = nuevasFilas;
    document.getElementById('boxRealImport').hidden = true;
    reconstruirTablaRealHTML();
    recalcularRealTodo();
    showToast(`✓ ¡${nuevasFilas.length} filas importadas desde Excel exitosamente!`);
  }

  function cargarMuestraExperimentalReal() {
    AppState.datosReales = [
      { id: 1, L: 0.35, dL: 0.001, t1: 11.90, t2: 11.85, t3: 11.95 },
      { id: 2, L: 0.55, dL: 0.001, t1: 14.92, t2: 14.88, t3: 14.95 },
      { id: 3, L: 0.75, dL: 0.001, t1: 17.41, t2: 17.38, t3: 17.46 },
      { id: 4, L: 0.95, dL: 0.001, t1: 19.62, t2: 19.58, t3: 19.68 },
      { id: 5, L: 1.15, dL: 0.001, t1: 21.58, t2: 21.52, t3: 21.62 },
      { id: 6, L: 1.35, dL: 0.001, t1: 23.38, t2: 23.32, t3: 23.44 }
    ];

    reconstruirTablaRealHTML();
    recalcularRealTodo();
    showToast('✓ Muestra experimental presencial cargada con éxito.');
  }

  function reconstruirTablaRealHTML() {
    const tbody = document.getElementById('tableRealBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (AppState.datosReales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="14" style="padding:24px; color:var(--sub);">No hay datos de laboratorio presencial. Haz clic en "Añadir Nueva Fila", "Pegar desde Excel" o "Cargar Muestra Experimental".</td></tr>`;
      return;
    }

    AppState.datosReales.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><input type="number" step="0.001" min="0.05" max="3.00" value="${row.L !== null ? row.L : ''}" data-idx="${idx}" data-field="L" placeholder="L (m)"></td>
        <td><input type="number" step="0.0005" min="0.00001" value="${row.dL !== null ? row.dL : AppState.realConfig.dL}" data-idx="${idx}" data-field="dL"></td>
        <td><input type="number" step="0.01" value="${row.t1 !== null ? row.t1 : ''}" placeholder="—" data-idx="${idx}" data-field="t1"></td>
        <td><input type="number" step="0.01" value="${row.t2 !== null ? row.t2 : ''}" placeholder="—" data-idx="${idx}" data-field="t2"></td>
        <td><input type="number" step="0.01" value="${row.t3 !== null ? row.t3 : ''}" placeholder="—" data-idx="${idx}" data-field="t3"></td>
        <td class="calc-col" id="col-real-prom-${idx}">—</td>
        <td class="calc-col" id="col-real-st-${idx}">—</td>
        <td class="calc-col" id="col-real-T-${idx}">—</td>
        <td class="calc-col" id="col-real-dT-${idx}">—</td>
        <td class="calc-col" id="col-real-T2-${idx}">—</td>
        <td class="calc-col" id="col-real-dT2-${idx}">—</td>
        <td class="calc-col" id="col-real-gi-${idx}">—</td>
        <td>
          <button type="button" class="btn small quiet btn-del-real-row" data-idx="${idx}" title="Eliminar fila">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const i = parseInt(e.target.getAttribute('data-idx'), 10);
        const f = e.target.getAttribute('data-field');
        const v = e.target.value.trim() !== '' ? parseFloat(e.target.value) : null;
        AppState.datosReales[i][f] = v;
        recalcularRealTodo();
      });
    });

    tbody.querySelectorAll('.btn-del-real-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-idx'), 10);
        AppState.datosReales.splice(i, 1);
        reconstruirTablaRealHTML();
        recalcularRealTodo();
      });
    });
  }

  function recalcularRealTodo() {
    const gRefObj = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.realConfig.gRefKey];
    const gRef = gRefObj.g;
    const uRef = gRefObj.u;
    const nOsc = AppState.realConfig.nOsc;
    const uTimer = AppState.realConfig.uTimer;

    const puntosValidos = [];
    let advertenciasDispersion = [];

    AppState.datosReales.forEach((row, idx) => {
      const elProm = document.getElementById(`col-real-prom-${idx}`);
      const elSt = document.getElementById(`col-real-st-${idx}`);
      const elT = document.getElementById(`col-real-T-${idx}`);
      const elDT = document.getElementById(`col-real-dT-${idx}`);
      const elT2 = document.getElementById(`col-real-T2-${idx}`);
      const elDT2 = document.getElementById(`col-real-dT2-${idx}`);
      const elGi = document.getElementById(`col-real-gi-${idx}`);

      const tiempos = [row.t1, row.t2, row.t3].filter((t) => typeof t === 'number' && !isNaN(t) && t > 0);

      if (tiempos.length > 0 && typeof row.L === 'number' && row.L > 0) {
        const promN = window.PenduloEngine.promedio(tiempos);
        const st = tiempos.length > 1 ? window.PenduloEngine.desviacionEstandar(tiempos, promN) : 0.05;

        // Comprobar si hay dispersión anómala entre ensayos
        if (tiempos.length > 1) {
          const maxT = Math.max(...tiempos);
          const minT = Math.min(...tiempos);
          if (maxT - minT > 0.35) {
            advertenciasDispersion.push(`Fila ${idx + 1} (L = ${row.L} m): diferencia de ${(maxT - minT).toFixed(2)} s entre ensayos.`);
          }
        }

        const T = promN / nOsc;
        const uA = st / Math.sqrt(tiempos.length);
        const uC_N = Math.sqrt(uA * uA + uTimer * uTimer);
        const deltaT = uC_N / nOsc;

        const T2 = T * T;
        const deltaT2 = 2 * T * deltaT;
        const gi = (4 * Math.PI * Math.PI * row.L) / T2;

        if (elProm) elProm.textContent = promN.toFixed(2);
        if (elSt) elSt.textContent = st.toFixed(2);
        if (elT) elT.textContent = T.toFixed(3);
        if (elDT) elDT.textContent = `±${deltaT.toFixed(3)}`;
        if (elT2) elT2.textContent = T2.toFixed(3);
        if (elDT2) elDT2.textContent = `±${deltaT2.toFixed(3)}`;
        if (elGi) elGi.textContent = gi.toFixed(2);

        puntosValidos.push({
          x: row.L,
          dx: row.dL || AppState.realConfig.dL,
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

    if (puntosValidos.length >= 2) {
      const reg = window.PenduloEngine.regresionLineal(puntosValidos);
      const comp = window.PenduloEngine.evaluarCompatibilidad(reg.g_exp, reg.u_g, gRef, uRef);

      actualizarCardsRealResultados(reg, comp);
      AppState.realConfig.ultimaRegresion = reg;
      diagnosticarMedicionesReales(reg, advertenciasDispersion);
    } else {
      resetCardsRealResultados();
      AppState.realConfig.ultimaRegresion = null;
      document.getElementById('txtRealDiagnostic').textContent = 'Ingresa o pega las mediciones del laboratorio real para analizar si la recta pasa por el origen o si existe un sesgo sistemático en la medición de la longitud al centro de gravedad de la plomada.';
    }

    renderRealChart();
  }

  function actualizarCardsRealResultados(reg, comp) {
    const elGExp = document.getElementById('resRealGExp');
    const elUG = document.getElementById('resRealUG');
    const elErrRel = document.getElementById('resRealErrRel');
    const elR2 = document.getElementById('resRealR2');
    const elZScore = document.getElementById('resRealZScore');
    const elZHint = document.getElementById('resRealZScoreHint');

    const cardGExp = document.getElementById('cardRealGExp');
    const cardZScore = document.getElementById('cardRealZScore');

    if (elGExp) elGExp.textContent = `${reg.g_exp.toFixed(3)} m/s²`;
    if (elUG) elUG.textContent = `± ${reg.u_g.toFixed(3)} m/s²`;
    if (elErrRel) elErrRel.textContent = `${comp.errorRelativoPct.toFixed(2)} %`;
    if (elR2) elR2.textContent = reg.r2.toFixed(4);

    if (elZScore) elZScore.textContent = `Z = ${comp.zScore.toFixed(2)}`;
    if (elZHint) elZHint.textContent = comp.veredicto;

    if (cardZScore) cardZScore.className = `res-card ${comp.clase}`;
    if (cardGExp) cardGExp.className = `res-card ${comp.clase}`;

    const eqText = document.getElementById('chartRealEquationText');
    const slopeText = document.getElementById('chartRealSlopeText');
    if (eqText) eqText.innerHTML = `Ecuación de la recta: <b>T² = (${reg.m.toFixed(3)})·L + (${reg.c.toFixed(3)})</b>`;
    if (slopeText) slopeText.innerHTML = `Pendiente: <b>m = ${reg.m.toFixed(3)} ± ${reg.u_m.toFixed(3)} s²/m</b> | R² = <b>${reg.r2.toFixed(4)}</b>`;
  }

  function resetCardsRealResultados() {
    const elGExp = document.getElementById('resRealGExp');
    const elUG = document.getElementById('resRealUG');
    const elErrRel = document.getElementById('resRealErrRel');
    const elR2 = document.getElementById('resRealR2');
    const elZScore = document.getElementById('resRealZScore');
    const elZHint = document.getElementById('resRealZScoreHint');

    if (elGExp) elGExp.textContent = '—';
    if (elUG) elUG.textContent = '—';
    if (elErrRel) elErrRel.textContent = '—';
    if (elR2) elR2.textContent = '—';
    if (elZScore) elZScore.textContent = '—';
    if (elZHint) elZHint.textContent = 'Requiere al menos 2 longitudes distintas';
  }

  // Diagnóstico Físico & Análisis del Intercepto al Centro de Masa
  function diagnosticarMedicionesReales(reg, advertencias) {
    const diagTxt = document.getElementById('txtRealDiagnostic');
    const diagPanel = document.getElementById('panelRealDiagnostic');
    if (!diagTxt) return;

    // Sesgo estimado en la longitud de la plomada delta_L = c / m (en cm)
    const deltaL_cm = reg.m > 0 ? (reg.c / reg.m) * 100 : 0;
    let mensaje = '';

    if (Math.abs(reg.c) <= 0.035) {
      diagPanel.className = 'diagnostic-panel success';
      mensaje = `✓ ¡Excelente precisión metrológica! El intercepto c está sumamente cercano al origen teórico (c = ${reg.c >= 0 ? '+' : ''}${reg.c.toFixed(3)} s²), lo que confirma que las longitudes L se midieron rigurosamente hasta el centro de masa de la plomada.`;
    } else if (reg.c > 0.035) {
      diagPanel.className = 'diagnostic-panel warn';
      mensaje = `⚠️ Intercepto positivo significativo (c = +${reg.c.toFixed(3)} s²). La recta corta el eje Y por encima del origen. En la teoría del péndulo físico, esto revela un sesgo sistemático en la longitud de aproximadamente +${deltaL_cm.toFixed(1)} cm: es muy probable que en el montaje presencial se haya medido hasta la parte superior de la plomada o hasta el nudo, en lugar de medir exactamente hasta el centro de masa de la esfera.`;
    } else {
      diagPanel.className = 'diagnostic-panel warn';
      mensaje = `⚠️ Intercepto negativo (c = ${reg.c.toFixed(3)} s²). La recta corta el eje Y por debajo del origen. Esto indica que la longitud efectiva de oscilación es aproximadamente ${Math.abs(deltaL_cm).toFixed(1)} cm menor que la registrada en el flexómetro.`;
    }

    if (advertencias.length > 0) {
      mensaje += `<br><br><strong>⚠️ Alerta de dispersión en el cronómetro:</strong> ` + advertencias.join(' ');
    }

    diagTxt.innerHTML = mensaje;
  }

  // Gráfica de Laboratorio Real
  function renderRealChart() {
    const svg = document.getElementById('svgRealChart');
    if (!svg) return;

    const w = 800;
    const h = 360;
    const padL = 65;
    const padR = 30;
    const padT = 25;
    const padB = 45;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const isLinear = AppState.realConfig.chartMode === 'linear';

    const puntos = [];
    AppState.datosReales.forEach((row) => {
      const tiempos = [row.t1, row.t2, row.t3].filter((t) => typeof t === 'number' && t > 0);
      if (tiempos.length > 0 && typeof row.L === 'number' && row.L > 0) {
        const promN = window.PenduloEngine.promedio(tiempos);
        const T = promN / AppState.realConfig.nOsc;
        const T2 = T * T;
        puntos.push({
          L: row.L,
          dL: row.dL || AppState.realConfig.dL,
          T: T,
          T2: T2,
          dT: 0.02,
          dT2: 2 * T * 0.02
        });
      }
    });

    if (puntos.length === 0) {
      svg.innerHTML = `
        <text x="${w / 2}" y="${h / 2}" fill="#64748b" text-anchor="middle" font-size="14" font-family="var(--body)">
          Introduce al menos 2 mediciones reales para generar la gráfica experimental
        </text>
      `;
      return;
    }

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

    svgContent += `
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#475569" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#475569" stroke-width="1.5" />
      <text x="${w / 2}" y="${h - 8}" fill="#cbd5e1" text-anchor="middle" font-size="12" font-family="var(--mono)" font-weight="bold">
        Longitud Real L (m)
      </text>
      <text x="18" y="${h / 2}" fill="#cbd5e1" text-anchor="middle" font-size="12" font-family="var(--mono)" font-weight="bold" transform="rotate(-90, 18, ${h / 2})">
        ${isLinear ? 'Periodo al Cuadrado T² (s²)' : 'Periodo Real T (s)'}
      </text>
    `;

    if (isLinear && AppState.realConfig.ultimaRegresion && AppState.realConfig.ultimaRegresion.valido) {
      const reg = AppState.realConfig.ultimaRegresion;
      const x1 = 0;
      const y1 = reg.m * x1 + reg.c;
      const x2 = maxX;
      const y2 = reg.m * x2 + reg.c;

      svgContent += `
        <line x1="${scaleX(x1)}" y1="${scaleY(y1)}" x2="${scaleX(x2)}" y2="${scaleY(y2)}" stroke="#10b981" stroke-width="2.2" stroke-dasharray="6,4" />
      `;
    } else if (!isLinear) {
      const gRef = window.PenduloEngine.GRAVEDADES_REFERENCIA[AppState.realConfig.gRefKey].g;
      let pathD = '';
      const steps = 60;
      for (let s = 0; s <= steps; s++) {
        const curL = (s / steps) * maxX;
        const curT = 2 * Math.PI * Math.sqrt(curL / gRef);
        const px = scaleX(curL);
        const py = scaleY(curT);
        pathD += (s === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
      }
      svgContent += `<path d="${pathD}" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="5,4" />`;
    }

    puntos.forEach((p) => {
      const cx = scaleX(p.L);
      const cy = scaleY(isLinear ? p.T2 : p.T);
      const dyVal = isLinear ? p.dT2 : p.dT;
      const cyTop = scaleY((isLinear ? p.T2 : p.T) + dyVal);
      const cyBot = scaleY((isLinear ? p.T2 : p.T) - dyVal);

      svgContent += `
        <line x1="${cx}" y1="${cyTop}" x2="${cx}" y2="${cyBot}" stroke="#f59e0b" stroke-width="1.8" />
        <line x1="${cx - 4}" y1="${cyTop}" x2="${cx + 4}" y2="${cyTop}" stroke="#f59e0b" stroke-width="1.8" />
        <line x1="${cx - 4}" y1="${cyBot}" x2="${cx + 4}" y2="${cyBot}" stroke="#f59e0b" stroke-width="1.8" />
      `;

      svgContent += `
        <circle cx="${cx}" cy="${cy}" r="5.5" fill="#10b981" stroke="#ffffff" stroke-width="1.5">
          <title>L: ${p.L} m, ${isLinear ? 'T²: ' + p.T2.toFixed(3) + ' s²' : 'T: ' + p.T.toFixed(3) + ' s'}</title>
        </circle>
      `;
    });

    svg.innerHTML = svgContent;
  }

  // 12. Gráfica SVG de Cuaderno Virtual (Simulación)
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

    puntos.forEach((p) => {
      const cx = scaleX(p.L);
      const cy = scaleY(isLinear ? p.T2 : p.T);
      const dyVal = isLinear ? p.dT2 : p.dT;
      const cyTop = scaleY((isLinear ? p.T2 : p.T) + dyVal);
      const cyBot = scaleY((isLinear ? p.T2 : p.T) - dyVal);

      svgContent += `
        <line x1="${cx}" y1="${cyTop}" x2="${cx}" y2="${cyBot}" stroke="#f59e0b" stroke-width="1.5" />
        <line x1="${cx - 4}" y1="${cyTop}" x2="${cx + 4}" y2="${cyTop}" stroke="#f59e0b" stroke-width="1.5" />
        <line x1="${cx - 4}" y1="${cyBot}" x2="${cx + 4}" y2="${cyBot}" stroke="#f59e0b" stroke-width="1.5" />
      `;

      svgContent += `
        <circle cx="${cx}" cy="${cy}" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5">
          <title>L: ${p.L} m, ${isLinear ? 'T²: ' + p.T2.toFixed(3) + ' s²' : 'T: ' + p.T.toFixed(3) + ' s'}</title>
        </circle>
      `;
    });

    svg.innerHTML = svgContent;
  }

  // 13. Calculadora de No Linealidad en Péndulo Matemático
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
        const gBias = -2 * deltaPct;

        if (lbl) lbl.textContent = `${deg.toFixed(1)}°`;
        if (elT0) elT0.textContent = `${T0.toFixed(3)} s`;
        if (elTExact) elTExact.textContent = `${TExact.toFixed(3)} s`;
        if (elPct) elPct.textContent = `+${deltaPct.toFixed(2)} %`;
        if (elGDelta) elGDelta.textContent = `${gBias.toFixed(2)} % de sesgo si no se corrige`;
      });
    }
  }

  // 14. Exportación a CSV (compatible con modo virtual y modo real)
  function exportarCSV(esModoReal = false) {
    const arr = esModoReal ? AppState.datosReales : AppState.datos;
    const nOsc = esModoReal ? AppState.realConfig.nOsc : 10;
    const gRef = esModoReal ? AppState.realConfig.gRefKey : AppState.gravedadRefKey;
    const reg = esModoReal ? AppState.realConfig.ultimaRegresion : AppState.ultimaRegresion;

    let csv = '\uFEFF';
    csv += esModoReal ? 'Laboratorio de Pendulo Simple - Mediciones Reales Presenciales\r\n' : 'Laboratorio de Pendulo Simple - Simulacion Virtual\r\n';
    csv += `Puesto N.o;${AppState.banco};Grupo;${AppState.grupo || 'Sin asignar'};Gravedad Referencia;${gRef};Oscilaciones;${nOsc}\r\n\r\n`;
    csv += `Fila;Longitud_L_m;Delta_L_m;t1_s;t2_s;t3_s;t_prom_${nOsc}s;st_s;Periodo_T_s;Delta_T_s;T2_s2;Delta_T2_s2;g_puntual_ms2\r\n`;

    arr.forEach((r, i) => {
      const tiempos = [r.t1, r.t2, r.t3].filter((t) => typeof t === 'number' && t > 0);
      const promN = tiempos.length > 0 ? window.PenduloEngine.promedio(tiempos) : 0;
      const st = tiempos.length > 1 ? window.PenduloEngine.desviacionEstandar(tiempos, promN) : 0;
      const T = promN / nOsc;
      const dT = 0.015;
      const T2 = T * T;
      const dT2 = 2 * T * dT;
      const gi = T2 > 0 ? (4 * Math.PI * Math.PI * r.L) / T2 : 0;

      csv += `${i + 1};${r.L};${r.dL};${r.t1 || ''};${r.t2 || ''};${r.t3 || ''};${promN.toFixed(2)};${st.toFixed(2)};${T.toFixed(3)};${dT.toFixed(3)};${T2.toFixed(3)};${dT2.toFixed(3)};${gi.toFixed(2)}\r\n`;
    });

    if (reg && reg.valido) {
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
    a.download = esModoReal ? `Pendulo_Datos_Reales_Puesto_${String(AppState.banco).padStart(2, '0')}.csv` : `Pendulo_Simulacion_Puesto_${String(AppState.banco).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✓ Archivo CSV (${esModoReal ? 'Datos Reales' : 'Simulación'}) descargado con éxito.`);
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
