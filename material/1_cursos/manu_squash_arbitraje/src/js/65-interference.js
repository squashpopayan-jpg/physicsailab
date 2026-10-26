/* Árbol de Decisión Oficial WSF: Reglas 8 y 9 (Interferencia y Pelota que golpea a un jugador) */
MS.Interference = (function () {
  const { U } = MS;

  let state = {
    step1: null, // 'yes', 'no_interf', 'late'
    step2: null, // 'yes', 'no'
    step3: null, // 'yes' (created), 'no'
    zone: null,  // 'access', 'swing', 'cone', 'turning'
    subOpt: null
  };

  function init() {
    bindTreeEvents();
    renderTreeState();
  }

  function reset() {
    state = {
      step1: null,
      step2: null,
      step3: null,
      zone: null,
      subOpt: null
    };
    renderTreeState();
  }

  function bindTreeEvents() {
    const btnReset = U.$('#btnResetTree');
    if (btnReset) btnReset.addEventListener('click', reset);

    // Delegación para botones de opciones del árbol
    const treeContainer = U.$('#treeFlowContainer');
    if (treeContainer) {
      treeContainer.addEventListener('click', (e) => {
        const optBtn = e.target.closest('.tree-opt-btn');
        if (!optBtn) return;

        const action = optBtn.dataset.action;
        const val = optBtn.dataset.val;

        if (action === 'step1') {
          state.step1 = val;
          state.step2 = null;
          state.step3 = null;
          state.zone = null;
          state.subOpt = null;
        } else if (action === 'step2') {
          state.step2 = val;
          state.step3 = null;
          state.zone = null;
          state.subOpt = null;
        } else if (action === 'step3') {
          state.step3 = val;
          state.zone = null;
          state.subOpt = null;
        } else if (action === 'zone') {
          state.zone = val;
          state.subOpt = null;
        } else if (action === 'subOpt') {
          state.subOpt = val;
        }

        renderTreeState();
      });
    }
  }

  function renderTreeState() {
    const s2Box = U.$('#treeStep2Box');
    const s3Box = U.$('#treeStep3Box');
    const s4Box = U.$('#treeStep4Box');
    const subZoneBox = U.$('#treeSubZoneBox');
    const resultBox = U.$('#treeResultBox');

    // Marcar activos en step 1
    U.$$('[data-action="step1"]').forEach((b) => {
      b.classList.toggle('active', b.dataset.val === state.step1);
    });

    if (state.step1 === 'no_interf') {
      showVerdict(
        'NO LET',
        'Regla 8.6.1 / 8.6.4 (Sin interferencia real)',
        'No existió estorbo suficiente que afectara la visión, carrera o swing del apelante.',
        'var(--bad)'
      );
      if (s2Box) s2Box.style.display = 'none';
      if (s3Box) s3Box.style.display = 'none';
      if (s4Box) s4Box.style.display = 'none';
      if (subZoneBox) subZoneBox.style.display = 'none';
      return;
    }

    if (state.step1 === 'late') {
      showVerdict(
        'NO LET',
        'Regla 8.6.2 (Accepting Interference)',
        'El apelante aceptó la interferencia al continuar la jugada y solo pidió Let tras errar su tiro.',
        'var(--bad)'
      );
      if (s2Box) s2Box.style.display = 'none';
      if (s3Box) s3Box.style.display = 'none';
      if (s4Box) s4Box.style.display = 'none';
      if (subZoneBox) subZoneBox.style.display = 'none';
      return;
    }

    if (state.step1 === 'yes') {
      if (s2Box) s2Box.style.display = 'block';
    } else {
      if (s2Box) s2Box.style.display = 'none';
    }

    // Step 2
    U.$$('[data-action="step2"]').forEach((b) => {
      b.classList.toggle('active', b.dataset.val === state.step2);
    });

    if (state.step2 === 'no') {
      showVerdict(
        'NO LET',
        'Regla 8.6.1 / 8.6.3 (Imposibilidad de buen retorno)',
        'La bola ya estaba fuera de alcance, moría en el nick o el apelante no habría podido ejecutar un buen retorno.',
        'var(--bad)'
      );
      if (s3Box) s3Box.style.display = 'none';
      if (s4Box) s4Box.style.display = 'none';
      if (subZoneBox) subZoneBox.style.display = 'none';
      return;
    }

    if (state.step2 === 'yes') {
      if (s3Box) s3Box.style.display = 'block';
    } else {
      if (s3Box) s3Box.style.display = 'none';
    }

    // Step 3
    U.$$('[data-action="step3"]').forEach((b) => {
      b.classList.toggle('active', b.dataset.val === state.step3);
    });

    if (state.step3 === 'created') {
      showVerdict(
        'NO LET',
        'Regla 8.6.4 (Created Interference)',
        'El apelante desvió su línea natural hacia el oponente para crear o fingir contacto artificial.',
        'var(--bad)'
      );
      if (s4Box) s4Box.style.display = 'none';
      if (subZoneBox) subZoneBox.style.display = 'none';
      return;
    }

    if (state.step3 === 'clean') {
      if (s4Box) s4Box.style.display = 'block';
    } else {
      if (s4Box) s4Box.style.display = 'none';
    }

    // Step 4 (Zonas)
    U.$$('[data-action="zone"]').forEach((b) => {
      b.classList.toggle('active', b.dataset.val === state.zone);
    });

    if (state.zone && subZoneBox) {
      subZoneBox.style.display = 'block';
      renderSubZoneOptions(state.zone);
    } else {
      if (subZoneBox) subZoneBox.style.display = 'none';
      if (resultBox) resultBox.style.display = 'none';
    }
  }

  function renderSubZoneOptions(zone) {
    const titleEl = U.$('#subZoneTitle');
    const optsEl = U.$('#subZoneOptions');
    if (!optsEl) return;

    optsEl.innerHTML = '';

    if (zone === 'access') {
      if (titleEl) titleEl.textContent = 'Paso 4.A — Acceso a la Bola (Carrera): ¿Esfuerzo de Despeje?';
      optsEl.innerHTML = `
        <button class="tree-opt-btn ${state.subOpt === 'effort' ? 'active' : ''}" data-action="subOpt" data-val="effort">
          <div class="tree-opt-title">Hizo todo el esfuerzo posible por despejar</div>
          <div class="tree-opt-desc">El oponente intentó salir de inmediato pero hubo fricción o contacto inevitable.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 'no_effort' ? 'active' : ''}" data-action="subOpt" data-val="no_effort">
          <div class="tree-opt-title">No hizo esfuerzo por despejar</div>
          <div class="tree-opt-desc">El oponente se quedó plantado en la T o mirando su golpe en la línea de carrera.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 'winning' ? 'active' : ''}" data-action="subOpt" data-val="winning">
          <div class="tree-opt-title">Apelante en posición de tiro ganador directo</div>
          <div class="tree-opt-desc">Iba a conectar un remate definitivo indiscutible (Regla 8.10).</div>
        </button>
      `;
      if (state.subOpt === 'effort') {
        showVerdict('YES LET', 'Regla 8.6.5', 'Existió interferencia con capacidad de retorno, pero el rival realizó todo el esfuerzo físico por despejar.', 'var(--warn)');
      } else if (state.subOpt === 'no_effort') {
        showVerdict('STROKE', 'Regla 8.6.6', 'El rival no hizo ningún esfuerzo por salir de la línea directa de carrera del apelante.', 'var(--ok)');
      } else if (state.subOpt === 'winning') {
        showVerdict('STROKE', 'Regla 8.10', 'Interferencia sobre un jugador en posición clara de ejecutar un tiro ganador indiscutible.', 'var(--ok)');
      } else {
        hideVerdict();
      }
    } else if (zone === 'swing') {
      if (titleEl) titleEl.textContent = 'Paso 4.B — Swing de Raqueta: ¿Tipo de Interferencia?';
      optsEl.innerHTML = `
        <button class="tree-opt-btn ${state.subOpt === 'excess' ? 'active' : ''}" data-action="subOpt" data-val="excess">
          <div class="tree-opt-title">Swing exagerado o desproporcionado</div>
          <div class="tree-opt-desc">Estiró el brazo de manera antinatural para provocar el roce.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 'touch' ? 'active' : ''}" data-action="subOpt" data-val="touch">
          <div class="tree-opt-title">Roce leve durante el despeje del rival</div>
          <div class="tree-opt-desc">El rival salía con esfuerzo y solo hubo contacto menor en la terminación.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 'prevented' ? 'active' : ''}" data-action="subOpt" data-val="prevented">
          <div class="tree-opt-title">Swing razonable bloqueado / impedido</div>
          <div class="tree-opt-desc">El rival invadió el radio de 1.12 m e impidió armar o culminar el golpe.</div>
        </button>
      `;
      if (state.subOpt === 'excess') {
        showVerdict('NO LET', 'Regla 8.9.3', 'El jugador solo tiene derecho a un swing razonable. El swing exagerado no otorga apelación.', 'var(--bad)');
      } else if (state.subOpt === 'touch') {
        showVerdict('YES LET', 'Regla 8.9.1', 'Interferencia leve en la terminación con esfuerzo de despeje del oponente.', 'var(--warn)');
      } else if (state.subOpt === 'prevented') {
        showVerdict('STROKE', 'Regla 8.9.2', 'El oponente invadió el cilindro de swing e impidió la ejecución normal del golpe.', 'var(--ok)');
      } else {
        hideVerdict();
      }
    } else if (zone === 'cone') {
      if (titleEl) titleEl.textContent = 'Paso 4.C — Cono a la Pared Frontal: ¿Ángulo Disponible?';
      optsEl.innerHTML = `
        <button class="tree-opt-btn ${state.subOpt === 'direct' ? 'active' : ''}" data-action="subOpt" data-val="direct">
          <div class="tree-opt-title">Podía jugar directo al frontón</div>
          <div class="tree-opt-desc">El oponente bloquea el triángulo y el apelante retiene el tiro por seguridad.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 'only_boast' ? 'active' : ''}" data-action="subOpt" data-val="only_boast">
          <div class="tree-opt-title">Solo podía jugar pared lateral (Boast)</div>
          <div class="tree-opt-desc">La bola estaba tan retrasada que el ángulo físico directo al frontón no existía.</div>
        </button>
      `;
      if (state.subOpt === 'direct') {
        showVerdict('STROKE', 'Regla 8.11.1', 'Oponente dentro del cono frontal. Retener el golpe por seguridad física otorga Stroke.', 'var(--ok)');
      } else if (state.subOpt === 'only_boast') {
        showVerdict('YES LET', 'Regla 8.11.2', 'Sin opción directa al frontón, la interferencia lateral se resuelve con Yes Let.', 'var(--warn)');
      } else {
        hideVerdict();
      }
    } else if (zone === 'turning') {
      if (titleEl) titleEl.textContent = 'Paso 4.D — Giro sobre la bola (Turning): ¿Causa del Giro?';
      optsEl.innerHTML = `
        <button class="tree-opt-btn ${state.subOpt === 't_nec' ? 'active' : ''}" data-action="subOpt" data-val="t_nec">
          <div class="tree-opt-title">Giro necesario por rebote en esquina</div>
          <div class="tree-opt-desc">La bola pasó alrededor del cuerpo y el jugador retiene el tiro por precaución.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 't_unnec' ? 'active' : ''}" data-action="subOpt" data-val="t_unnec">
          <div class="tree-opt-title">Giro innecesario / opción libre previa</div>
          <div class="tree-opt-desc">Decidió girar cuando podía volear o golpear normalmente sin rotar.</div>
        </button>
        <button class="tree-opt-btn ${state.subOpt === 't_delib' ? 'active' : ''}" data-action="subOpt" data-val="t_delib">
          <div class="tree-opt-title">Bloqueo deliberado del rival tras el giro</div>
          <div class="tree-opt-desc">El no-golpeador se interpuso intencionalmente para obstaculizar el tiro.</div>
        </button>
      `;
      if (state.subOpt === 't_nec') {
        showVerdict('YES LET', 'Regla 8.13.1', 'En un Turning justificado donde el jugador retiene el tiro, la decisión oficial es Yes Let.', 'var(--warn)');
      } else if (state.subOpt === 't_unnec') {
        showVerdict('NO LET', 'Regla 8.13.3', 'Giro prescindible que generó riesgo autoinfligido. No corresponde concesión de Let.', 'var(--bad)');
      } else if (state.subOpt === 't_delib') {
        showVerdict('STROKE', 'Regla 8.13.2', 'Obstrucción deliberada y maliciosa contra el jugador que gira.', 'var(--ok)');
      } else {
        hideVerdict();
      }
    }
  }

  function showVerdict(call, rule, exp, color) {
    const resBox = U.$('#treeResultBox');
    if (!resBox) return;

    resBox.style.display = 'block';
    resBox.innerHTML = `
      <div class="card" style="border-left: 6px solid ${color};">
        <div class="eyebrow" style="color: ${color};">Veredicto Reglamentario Oficial</div>
        <div style="font-family: var(--f-display); font-size: 1.8rem; font-weight: 800; color: ${color}; margin: 6px 0;">
          ${call}
        </div>
        <div style="font-family: var(--f-mono); font-size: .9rem; font-weight: 700; color: var(--ink); margin-bottom: 8px;">
          ${rule}
        </div>
        <div style="font-size: .95rem; color: var(--ink-2); line-height: 1.5;">
          ${exp}
        </div>
      </div>
    `;
    resBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideVerdict() {
    const resBox = U.$('#treeResultBox');
    if (resBox) resBox.style.display = 'none';
  }

  return {
    init,
    reset
  };
})();
