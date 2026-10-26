/* Controlador del Simulador 3D / 2D de Arbitraje y Sistema de Veredicto Interactivo */
MS.Sim = (function () {
  const { U, C, Ball, Player, RenderTop, RenderTV, Cases } = MS;

  let currentCase = Cases[0];
  let curTime = 0;
  let isPlaying = false;
  let hasAppealed = false;
  let userChoice = null;
  let animId = null;
  let lastTimestamp = 0;
  let camPreset = 'arbitro';
  let camObj = Object.assign({}, C.PRESETS.arbitro);

  function init() {
    renderCaseList();
    loadCase(Cases[0].id);
    bindControls();
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        resizeCanvases();
      });
      const target = U.$('.canvases-split') || U.$('#section-simulador');
      if (target) ro.observe(target);
    }
  }

  function resizeCanvases() {
    const cTop = U.$('#canvasTop');
    const c3D = U.$('#canvas3D');
    if (!cTop || !c3D) return;

    const wrapTop = cTop.parentElement;
    const wrap3D = c3D.parentElement;

    const clientWTop = wrapTop ? wrapTop.clientWidth : 0;
    const clientW3D = wrap3D ? wrap3D.clientWidth : 0;

    const wTop = clientWTop > 40 ? clientWTop : (cTop.width > 40 ? cTop.width : 420);
    const w3D = clientW3D > 40 ? clientW3D : (c3D.width > 40 ? c3D.width : 560);
    const h = (cTop.clientHeight && cTop.clientHeight > 100)
      ? cTop.clientHeight
      : (window.innerWidth <= 600 ? 360 : 440);

    if (cTop.width !== wTop || cTop.height !== h) {
      cTop.width = wTop;
      cTop.height = h;
    }
    if (c3D.width !== w3D || c3D.height !== h) {
      c3D.width = w3D;
      c3D.height = h;
    }
    draw();
  }

  function onActivate() {
    resizeCanvases();
    if (!animId) {
      startLoop();
    }
  }

  function renderCaseList(filterCat = 'all') {
    const listEl = U.$('#simCaseList');
    if (!listEl) return;

    listEl.innerHTML = '';
    const filtered = filterCat === 'all'
      ? Cases
      : Cases.filter((c) => c.cat === filterCat);

    filtered.forEach((c) => {
      const card = document.createElement('div');
      card.className = `case-card ${c.id === currentCase.id ? 'active' : ''}`;
      card.dataset.id = c.id;
      card.innerHTML = `
        <div class="case-card-header">
          <span class="case-num">CASO #${c.num}</span>
          <span class="case-cat">${c.cat}</span>
        </div>
        <div class="case-title">${c.titulo}</div>
      `;
      card.addEventListener('click', () => {
        loadCase(c.id);
      });
      listEl.appendChild(card);
    });
  }

  function loadCase(id) {
    const found = Cases.find((c) => c.id === id);
    if (!found) return;

    currentCase = found;
    curTime = 0;
    isPlaying = true;
    hasAppealed = false;
    userChoice = null;

    // Actualizar UI
    U.$$('.case-card').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    const infoTitle = U.$('#simCaseTitle');
    const infoDesc = U.$('#simCaseDesc');
    const infoCat = U.$('#simCaseCat');
    const infoFreeze = U.$('#simCaseFreeze');

    if (infoTitle) infoTitle.textContent = `#${currentCase.num} ${currentCase.titulo}`;
    if (infoDesc) infoDesc.textContent = currentCase.desc;
    if (infoCat) infoCat.textContent = currentCase.cat;
    if (infoFreeze) infoFreeze.textContent = `${currentCase.tFreeze.toFixed(1)}s`;

    // Ocultar banner de apelación y veredicto
    const banner = U.$('#appealBanner');
    if (banner) banner.style.display = 'none';

    const vPanel = U.$('#verdictPanel');
    if (vPanel) vPanel.classList.remove('show');

    // Resetear botones de decisión
    U.$$('.btn-decision').forEach((btn) => btn.classList.remove('selected'));

    const btnPlay = U.$('#btnSimPlay');
    if (btnPlay) btnPlay.textContent = '⏸ Pausa';

    startLoop();
  }

  function startLoop() {
    if (animId) cancelAnimationFrame(animId);
    lastTimestamp = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function loop(now) {
    if (!lastTimestamp) lastTimestamp = now;
    const dt = Math.min(0.06, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    if (isPlaying && currentCase) {
      curTime += dt;

      // Comprobar congelación tFreeze
      if (curTime >= currentCase.tFreeze && !hasAppealed) {
        curTime = currentCase.tFreeze;
        isPlaying = false;
        hasAppealed = true;
        triggerAppeal();
      }

      // Tiempo límite del caso
      const maxT = currentCase.ball[currentCase.ball.length - 1].t;
      if (curTime > maxT) {
        curTime = maxT;
        isPlaying = false;
      }
    }

    try {
      draw();
    } catch (err) {
      console.warn('MS.Sim draw warning:', err);
    }

    const timeBar = U.$('#simTimeDisplay');
    if (timeBar) timeBar.textContent = `${curTime.toFixed(2)}s`;

    const btnPlay = U.$('#btnSimPlay');
    if (btnPlay) btnPlay.textContent = isPlaying ? '⏸ Pausa' : '▶ Reproducir';

    animId = requestAnimationFrame(loop);
  }

  function triggerAppeal() {
    U.whistle();
    const banner = U.$('#appealBanner');
    if (banner) {
      banner.style.display = 'flex';
      banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function draw() {
    const cTop = U.$('#canvasTop');
    const c3D = U.$('#canvas3D');

    const ball = Ball.interpolateTrajectory(currentCase.ball, curTime);
    const pA = Player.interpolateState(currentCase.pA, curTime);
    const pB = Player.interpolateState(currentCase.pB, curTime);

    const state = {
      ball,
      pA,
      pB,
      activePlayer: currentCase.striker,
      appeal: hasAppealed,
      curTime,
      caseData: currentCase
    };

    if (cTop) RenderTop.render(cTop, state);
    if (c3D) RenderTV.render(c3D, state, camObj);
  }

  function makeDecision(choice) {
    userChoice = choice;
    U.$$('.btn-decision').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.decision === choice);
    });

    const isCorrect = choice === currentCase.decision;
    if (isCorrect) {
      U.beep(880, 0.15, 'sine');
      setTimeout(() => U.beep(1100, 0.25, 'sine'), 120);
    } else {
      U.beep(330, 0.35, 'sawtooth');
    }

    showVerdict(isCorrect);
  }

  function showVerdict(isCorrect) {
    const vPanel = U.$('#verdictPanel');
    if (!vPanel) return;

    const callEl = U.$('#verdictCall');
    const ruleEl = U.$('#verdictRule');
    const expEl = U.$('#verdictExp');
    const pInterf = U.$('#pilarInterf');
    const pRetorno = U.$('#pilarRetorno');
    const pCreado = U.$('#pilarCreado');
    const pDespeje = U.$('#pilarDespeje');

    if (callEl) {
      callEl.textContent = `${isCorrect ? '✅ ¡DECISIÓN CORRECTA!' : '❌ DECISIÓN INCORRECTA'} — ${currentCase.decision}`;
      callEl.style.color = isCorrect ? 'var(--ok)' : 'var(--bad)';
    }
    if (ruleEl) ruleEl.textContent = currentCase.regla;
    if (expEl) expEl.textContent = currentCase.explicacion;

    if (pInterf) pInterf.textContent = currentCase.pilares.interf;
    if (pRetorno) pRetorno.textContent = currentCase.pilares.retorno;
    if (pCreado) pCreado.textContent = currentCase.pilares.creado;
    if (pDespeje) pDespeje.textContent = currentCase.pilares.despeje;

    vPanel.classList.add('show');
    vPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function bindControls() {
    const btnPlay = U.$('#btnSimPlay');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        isPlaying = !isPlaying;
        btnPlay.textContent = isPlaying ? '⏸ Pausa' : '▶ Reproducir';
        if (isPlaying) {
          lastTimestamp = performance.now();
          if (!animId) startLoop();
        }
      });
    }

    const btnReplay = U.$('#btnSimReplay');
    if (btnReplay) {
      btnReplay.addEventListener('click', () => {
        curTime = 0;
        isPlaying = true;
        hasAppealed = false;
        userChoice = null;
        const banner = U.$('#appealBanner');
        if (banner) banner.style.display = 'none';
        const vPanel = U.$('#verdictPanel');
        if (vPanel) vPanel.classList.remove('show');
        U.$$('.btn-decision').forEach((btn) => btn.classList.remove('selected'));
        if (btnPlay) btnPlay.textContent = '⏸ Pausa';
        startLoop();
      });
    }

    const camSelect = U.$('#camPresetSelect');
    if (camSelect) {
      camSelect.addEventListener('change', (e) => {
        camPreset = e.target.value;
        camObj = Object.assign({}, C.PRESETS[camPreset] || C.PRESETS.arbitro);
        draw();
      });
    }

    // Rotación orbital interactiva de la cámara 3D con arrastre (pointer drag tipo squash_sim)
    const c3D = U.$('#canvas3D');
    if (c3D) {
      let drag = null;
      c3D.style.cursor = 'grab';
      c3D.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, az: camObj.az, el: camObj.el };
        c3D.setPointerCapture(e.pointerId);
        c3D.style.cursor = 'grabbing';
      });
      c3D.addEventListener('pointermove', (e) => {
        if (!drag) return;
        camObj.az = drag.az - (e.clientX - drag.x) * 0.008;
        camObj.el = U.clamp(drag.el + (e.clientY - drag.y) * 0.006, 0.04, 1.42);
        if (!isPlaying) draw();
      });
      const endDrag = (e) => {
        if (drag) {
          drag = null;
          c3D.style.cursor = 'grab';
        }
      };
      c3D.addEventListener('pointerup', endDrag);
      c3D.addEventListener('pointercancel', endDrag);
    }

    const catSelect = U.$('#simCategoryFilter');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        renderCaseList(e.target.value);
      });
    }

    U.$$('.btn-decision').forEach((btn) => {
      btn.addEventListener('click', () => {
        makeDecision(btn.dataset.decision);
      });
    });

    const btnNextCase = U.$('#btnNextCase');
    if (btnNextCase) {
      btnNextCase.addEventListener('click', () => {
        const nextIdx = (currentCase.num % Cases.length);
        loadCase(Cases[nextIdx].id);
      });
    }
  }

  return {
    init,
    loadCase,
    resizeCanvases,
    onActivate
  };
})();
