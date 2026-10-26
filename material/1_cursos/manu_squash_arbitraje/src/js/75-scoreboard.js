/* Planilla y Marcador Oficial WSF PAR-11 con Protocolo Estricto de Llamados y Cronómetros */
MS.Scoreboard = (function () {
  const { U } = MS;

  const NUM_WORDS_EN = ['Love', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
  const NUM_WORDS_ES = ['Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince'];

  function numWord(n, lang = 'en') {
    const list = lang === 'en' ? NUM_WORDS_EN : NUM_WORDS_ES;
    return list[n] !== undefined ? list[n] : `${n}`;
  }

  let matchState = {
    nameA: 'Jugador A (Azul)',
    nameB: 'Jugador B (Rojo)',
    bestOf: 5,
    gamesA: 0,
    gamesB: 0,
    ptsA: 0,
    ptsB: 0,
    server: 'A', // 'A' o 'B'
    box: 'R',    // 'R' o 'L'
    history: [],
    lastCall: 'Love all, Play'
  };

  // Temporizadores
  let warmupTimer = {
    total: 240, // 4 minutos
    current: 240,
    interval: null,
    halfWarned: false
  };

  let intervalTimer = {
    total: 90,  // 90 segundos
    current: 90,
    interval: null,
    warn15: false
  };

  function init() {
    bindScoreEvents();
    bindTimerEvents();
    renderScore();
  }

  function addPoint(winner, eventType = null) {
    saveSnapshot();

    const wasServer = matchState.server;
    const isHandOut = winner !== wasServer;

    if (winner === 'A') matchState.ptsA++;
    else matchState.ptsB++;

    if (isHandOut) {
      matchState.server = winner;
      // Nuevo servidor puede elegir caja
      matchState.box = 'R';
    } else {
      // El mismo servidor alterna caja automáticamente
      matchState.box = matchState.box === 'R' ? 'L' : 'R';
    }

    // Verificar fin de game
    const pA = matchState.ptsA;
    const pB = matchState.ptsB;
    const diff = Math.abs(pA - pB);

    let gameWon = false;
    let matchWon = false;

    if ((pA >= 11 || pB >= 11) && diff >= 2) {
      gameWon = true;
      if (pA > pB) matchState.gamesA++;
      else matchState.gamesB++;

      const gamesNeeded = Math.ceil(matchState.bestOf / 2);
      if (matchState.gamesA >= gamesNeeded || matchState.gamesB >= gamesNeeded) {
        matchWon = true;
      }
    }

    // Registrar en historial
    matchState.history.push({
      time: new Date().toLocaleTimeString(),
      pA: matchState.ptsA,
      pB: matchState.ptsB,
      server: wasServer,
      winner,
      isHandOut,
      event: eventType,
      gameWon,
      matchWon
    });

    generateCall(winner, isHandOut, eventType, gameWon, matchWon);
    renderScore();

    if (gameWon) {
      U.whistle();
      if (!matchWon) startIntervalCountdown();
    } else {
      U.beep(750, 0.1);
    }
  }

  function generateCall(winner, isHandOut, eventType, gameWon, matchWon) {
    const s = matchState.server;
    const sName = s === 'A' ? matchState.nameA : matchState.nameB;
    const rName = s === 'A' ? matchState.nameB : matchState.nameA;
    const sPts = s === 'A' ? matchState.ptsA : matchState.ptsB;
    const rPts = s === 'A' ? matchState.ptsB : matchState.ptsA;

    let parts = [];

    // 1. Condición o evento
    if (eventType) {
      parts.push(eventType);
    }

    // 2. Hand out
    if (isHandOut && !gameWon) {
      parts.push('Hand out');
    }

    // 3. Tanteador
    if (!gameWon) {
      if (sPts === rPts) {
        if (sPts === 10) {
          parts.push('Ten all: a player must win by two points');
        } else {
          parts.push(`${numWord(sPts, 'en')} all`);
        }
      } else {
        parts.push(`${numWord(sPts, 'en')} – ${numWord(rPts, 'en')}`);
      }

      // 4. Estado especial
      const maxPts = Math.max(sPts, rPts);
      const minPts = Math.min(sPts, rPts);
      const isGameBall = maxPts >= 10 && (maxPts - minPts >= 1);
      const gamesNeeded = Math.ceil(matchState.bestOf / 2);
      const leaderGames = Math.max(matchState.gamesA, matchState.gamesB);
      const isMatchBall = isGameBall && (leaderGames === gamesNeeded - 1);

      if (isMatchBall) {
        parts.push('Match ball');
      } else if (isGameBall) {
        parts.push('Game ball');
      }
    } else if (matchWon) {
      const winnerName = matchState.gamesA > matchState.gamesB ? matchState.nameA : matchState.nameB;
      parts.push(`Game and Match to ${winnerName}`);
    } else {
      // Fin de game
      const winnerName = (matchState.ptsA > matchState.ptsB) ? matchState.nameA : matchState.nameB;
      const gA = matchState.gamesA;
      const gB = matchState.gamesB;
      parts.push(`Game to ${winnerName} (${matchState.ptsA}–${matchState.ptsB})`);
      if (gA === gB) {
        parts.push(`${numWord(gA, 'en')} game all`);
      } else if (gA > gB) {
        parts.push(`${matchState.nameA} leads ${numWord(gA, 'en')} game${gA > 1 ? 's' : ''} to ${gB === 0 ? 'love' : numWord(gB, 'en')}`);
      } else {
        parts.push(`${matchState.nameB} leads ${numWord(gB, 'en')} game${gB > 1 ? 's' : ''} to ${gA === 0 ? 'love' : numWord(gA, 'en')}`);
      }
      parts.push('Ninety seconds');
    }

    matchState.lastCall = parts.join(', ');
  }

  function saveSnapshot() {
    if (matchState.snapshots === undefined) matchState.snapshots = [];
    matchState.snapshots.push(JSON.parse(JSON.stringify({
      gamesA: matchState.gamesA,
      gamesB: matchState.gamesB,
      ptsA: matchState.ptsA,
      ptsB: matchState.ptsB,
      server: matchState.server,
      box: matchState.box,
      lastCall: matchState.lastCall
    })));
  }

  function undo() {
    if (!matchState.snapshots || matchState.snapshots.length === 0) return;
    const snap = matchState.snapshots.pop();
    matchState.gamesA = snap.gamesA;
    matchState.gamesB = snap.gamesB;
    matchState.ptsA = snap.ptsA;
    matchState.ptsB = snap.ptsB;
    matchState.server = snap.server;
    matchState.box = snap.box;
    matchState.lastCall = snap.lastCall;
    matchState.history.pop();
    renderScore();
  }

  function newGame() {
    matchState.ptsA = 0;
    matchState.ptsB = 0;
    matchState.lastCall = 'Love all, Play';
    renderScore();
  }

  function resetMatch() {
    matchState.gamesA = 0;
    matchState.gamesB = 0;
    matchState.ptsA = 0;
    matchState.ptsB = 0;
    matchState.server = 'A';
    matchState.box = 'R';
    matchState.history = [];
    matchState.snapshots = [];
    matchState.lastCall = 'Love all, Play';
    renderScore();
  }

  function renderScore() {
    const sA = U.$('#sbPtsA');
    const sB = U.$('#sbPtsB');
    const gA = U.$('#sbGamesA');
    const gB = U.$('#sbGamesB');
    const boxP1 = U.$('#sbPlayerBox1');
    const boxP2 = U.$('#sbPlayerBox2');
    const badgeS1 = U.$('#sbServeBadge1');
    const badgeS2 = U.$('#sbServeBadge2');
    const callText = U.$('#sbCallDisplay');

    if (sA) sA.textContent = matchState.ptsA;
    if (sB) sB.textContent = matchState.ptsB;
    if (gA) gA.textContent = `Juegos: ${matchState.gamesA}`;
    if (gB) gB.textContent = `Juegos: ${matchState.gamesB}`;

    const isServerA = matchState.server === 'A';
    if (boxP1) boxP1.classList.toggle('server', isServerA);
    if (boxP2) boxP2.classList.toggle('server', !isServerA);

    if (badgeS1) badgeS1.style.display = isServerA ? 'block' : 'none';
    if (badgeS2) badgeS2.style.display = !isServerA ? 'block' : 'none';

    if (callText) callText.textContent = matchState.lastCall;

    // Caja L / R
    U.$$('.box-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.box === matchState.box);
    });

    renderHistoryTable();
  }

  function renderHistoryTable() {
    const tbody = U.$('#sbHistoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    matchState.history.slice(-10).reverse().forEach((h, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="mono">${h.time}</td>
        <td><b>${h.winner === 'A' ? matchState.nameA : matchState.nameB}</b></td>
        <td class="num">${h.pA} – ${h.pB}</td>
        <td>${h.event || (h.isHandOut ? 'Hand Out' : 'Punto')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Cronómetro de Calentamiento (4 min)
  function startWarmupCountdown() {
    clearInterval(warmupTimer.interval);
    warmupTimer.halfWarned = false;
    warmupTimer.interval = setInterval(() => {
      warmupTimer.current--;
      const digits = U.$('#warmupDigits');
      if (digits) digits.textContent = U.fmtSecs(warmupTimer.current);

      // Aviso a los 2 minutos (Half-time: cambio de lado)
      if (warmupTimer.current === 120 && !warmupTimer.halfWarned) {
        warmupTimer.halfWarned = true;
        U.whistle();
        alertWarmup('¡HALF-TIME! Cambio de lado obligatorio (2:00)');
      }

      // Final (4:00)
      if (warmupTimer.current <= 0) {
        clearInterval(warmupTimer.interval);
        U.whistle();
        alertWarmup('¡TIME! Fin de calentamiento. 90 segundos para iniciar el 1.º juego.');
      }
    }, 1000);
  }

  function alertWarmup(msg) {
    const aEl = U.$('#warmupAlert');
    if (aEl) {
      aEl.textContent = msg;
      aEl.style.display = 'block';
    }
  }

  // Cronómetro de Intervalo (90s)
  function startIntervalCountdown() {
    clearInterval(intervalTimer.interval);
    intervalTimer.current = 90;
    intervalTimer.warn15 = false;
    const aEl = U.$('#intervalAlert');
    if (aEl) aEl.style.display = 'none';

    intervalTimer.interval = setInterval(() => {
      intervalTimer.current--;
      const digits = U.$('#intervalDigits');
      if (digits) digits.textContent = `${intervalTimer.current}s`;

      // Aviso 15 segundos antes (a los 75s transcurridos / 15s restantes)
      if (intervalTimer.current === 15 && !intervalTimer.warn15) {
        intervalTimer.warn15 = true;
        U.beep(880, 0.2);
        if (aEl) {
          aEl.textContent = '¡FIFTEEN SECONDS! Jugadores a la cancha.';
          aEl.style.display = 'block';
        }
      }

      if (intervalTimer.current <= 0) {
        clearInterval(intervalTimer.interval);
        U.whistle();
        if (aEl) {
          aEl.textContent = '¡TIME! Listos para jugar.';
          aEl.style.display = 'block';
        }
      }
    }, 1000);
  }

  function bindScoreEvents() {
    const btnPointA = U.$('#btnPointA');
    const btnPointB = U.$('#btnPointB');
    if (btnPointA) btnPointA.addEventListener('click', () => addPoint('A'));
    if (btnPointB) btnPointB.addEventListener('click', () => addPoint('B'));

    const btnUndo = U.$('#btnUndoScore');
    if (btnUndo) btnUndo.addEventListener('click', undo);

    const btnNewGame = U.$('#btnNewGame');
    if (btnNewGame) btnNewGame.addEventListener('click', newGame);

    const btnReset = U.$('#btnResetScore');
    if (btnReset) btnReset.addEventListener('click', resetMatch);

    // Selección de caja L / R
    U.$$('.box-btn').forEach((b) => {
      b.addEventListener('click', () => {
        matchState.box = b.dataset.box;
        renderScore();
      });
    });

    // Cambiar servidor manualmente
    const btnToggleServer = U.$('#btnToggleServer');
    if (btnToggleServer) {
      btnToggleServer.addEventListener('click', () => {
        matchState.server = matchState.server === 'A' ? 'B' : 'A';
        renderScore();
      });
    }

    // Botones rápidos de incidencias arbitrales
    const btnStrokeA = U.$('#btnCallStrokeA');
    const btnStrokeB = U.$('#btnCallStrokeB');
    const btnCallYesLet = U.$('#btnCallYesLet');
    const btnCallFootFault = U.$('#btnCallFootFault');
    const btnCallDown = U.$('#btnCallDown');
    const btnCallOut = U.$('#btnCallOut');
    const btnCallNotUp = U.$('#btnCallNotUp');

    if (btnStrokeA) btnStrokeA.addEventListener('click', () => addPoint('A', `Stroke to ${matchState.nameA}`));
    if (btnStrokeB) btnStrokeB.addEventListener('click', () => addPoint('B', `Stroke to ${matchState.nameB}`));
    if (btnCallYesLet) {
      btnCallYesLet.addEventListener('click', () => {
        matchState.lastCall = 'Yes Let';
        renderScore();
        U.whistle();
      });
    }
    if (btnCallFootFault) {
      btnCallFootFault.addEventListener('click', () => {
        const receiver = matchState.server === 'A' ? 'B' : 'A';
        addPoint(receiver, 'Foot fault');
      });
    }
    if (btnCallDown) {
      btnCallDown.addEventListener('click', () => {
        const other = matchState.server === 'A' ? 'B' : 'A';
        addPoint(other, 'Down');
      });
    }
    if (btnCallOut) {
      btnCallOut.addEventListener('click', () => {
        const other = matchState.server === 'A' ? 'B' : 'A';
        addPoint(other, 'Out');
      });
    }
    if (btnCallNotUp) {
      btnCallNotUp.addEventListener('click', () => {
        const other = matchState.server === 'A' ? 'B' : 'A';
        addPoint(other, 'Not up');
      });
    }

    // Nombres editables
    const inpA = U.$('#inpPlayerA');
    const inpB = U.$('#inpPlayerB');
    if (inpA) {
      inpA.addEventListener('change', (e) => {
        matchState.nameA = e.target.value.trim() || 'Jugador A';
        renderScore();
      });
    }
    if (inpB) {
      inpB.addEventListener('change', (e) => {
        matchState.nameB = e.target.value.trim() || 'Jugador B';
        renderScore();
      });
    }
  }

  function bindTimerEvents() {
    const btnStartWarmup = U.$('#btnStartWarmup');
    const btnPauseWarmup = U.$('#btnPauseWarmup');
    const btnResetWarmup = U.$('#btnResetWarmup');

    if (btnStartWarmup) btnStartWarmup.addEventListener('click', startWarmupCountdown);
    if (btnPauseWarmup) btnPauseWarmup.addEventListener('click', () => clearInterval(warmupTimer.interval));
    if (btnResetWarmup) {
      btnResetWarmup.addEventListener('click', () => {
        clearInterval(warmupTimer.interval);
        warmupTimer.current = 240;
        const d = U.$('#warmupDigits');
        if (d) d.textContent = '4:00';
        const a = U.$('#warmupAlert');
        if (a) a.style.display = 'none';
      });
    }

    const btnStartInterval = U.$('#btnStartInterval');
    const btnPauseInterval = U.$('#btnPauseInterval');
    const btnResetInterval = U.$('#btnResetInterval');

    if (btnStartInterval) btnStartInterval.addEventListener('click', startIntervalCountdown);
    if (btnPauseInterval) btnPauseInterval.addEventListener('click', () => clearInterval(intervalTimer.interval));
    if (btnResetInterval) {
      btnResetInterval.addEventListener('click', () => {
        clearInterval(intervalTimer.interval);
        intervalTimer.current = 90;
        const d = U.$('#intervalDigits');
        if (d) d.textContent = '90s';
        const a = U.$('#intervalAlert');
        if (a) a.style.display = 'none';
      });
    }
  }

  return {
    init
  };
})();
