/* Manual Completo de Arbitraje de la World Squash Federation (Reglas 1 a 15) */
MS.Rules = [
  {
    num: 1,
    titulo: 'El Juego (The Game)',
    puntos: 'Juego entre dos jugadores en cancha individual con raquetas y bola aprobadas por la WSF. Todo peloteo inicia con un saque y los jugadores alternan golpes hasta que el punto termina.',
    criterios: 'El árbitro vela por la seguridad física, el juego limpio y el estricto cumplimiento de las especificaciones de equipamiento homologadas.',
    llamados: ['"Warm-up time, 4 minutes" / "Tiempo de calentamiento, 4 minutos"', '"Play" / "Juegue"']
  },
  {
    num: 2,
    titulo: 'La Puntuación (Scoring)',
    puntos: 'Sistema PAR-11 (Point-A-Rally a 11 puntos). Quien gana el peloteo suma 1 punto. Si el marcador llega a 10-iguales, un jugador debe ganar por 2 puntos de diferencia (12-10, 13-11, etc.). Los partidos se disputan al mejor de 3 o 5 juegos.',
    criterios: 'El marcador anuncia el tanteador diciendo primero el puntaje del servidor. En 10-10 debe realizarse el anuncio reglamentario obligatorio.',
    llamados: ['"10 all: a player must win by 2 points" / "10 iguales: se debe ganar por diferencia de 2"', '"Game ball" / "Punto de juego"', '"Match ball" / "Punto de partido"']
  },
  {
    num: 3,
    titulo: 'Oficiales (Officials)',
    puntos: 'Compuesto por un Marcador (Marker, quien anuncia el tanteador, cantos de falta/fuera y repite la decisión del Árbitro) y un Árbitro (Referee, quien toma la decisión final en apelaciones, aplica el código de conducta y controla los tiempos). En arbitraje de un solo oficial (Single Official), la misma persona cumple ambos roles.',
    criterios: 'Ubicación centrada detrás de la pared trasera por encima de la línea de 2.13 m del vidrio. Decisiones firmes y fundamentadas.',
    llamados: ['"Play" · "Stop" · "Let, please" · "Decision is..."']
  },
  {
    num: 4,
    titulo: 'El Calentamiento (The Warm-up)',
    puntos: 'Duración total de 4 minutos (2 minutos de cada lado). Al cumplirse los primeros 2 minutos el Árbitro anuncia "Half-time" y los jugadores deben cambiar de lado. Ambos tienen derecho a golpear la bola de forma equitativa (máximo 2-3 toques individuales).',
    criterios: 'Control estricto con cronómetro. Si un jugador monopoliza la bola en el calentamiento, el árbitro debe intervenir de inmediato.',
    llamados: ['"Half-time" (a los 2:00)', '"Time" (a los 4:00)']
  },
  {
    num: 5,
    titulo: 'El Saque (The Serve)',
    puntos: 'El ganador del sorteo de raqueta elige caja. Al ganar un punto se cambia de caja; al recuperar el saque (Hand Out) el nuevo servidor elige cualquier caja. 6 requisitos del saque válido: 1) Pie dentro de caja sin pisar líneas; 2) Bola lanzada con mano/raqueta; 3) Golpeada al primer intento; 4) Frontis entre 1.78m y 4.57m; 5) Primer bote en cuarto trasero opuesto sin tocar líneas; 6) No salir fuera.',
    criterios: 'Pisar cualquier línea que delimita el cuadro de saque (línea corta o de media cancha) es Foot Fault inmediato en el instante del impacto.',
    llamados: ['"Foot fault" (Falta de pie)', '"Fault" (Falta de bote)', '"Down" (Bajo la línea de saque)', '"Out" (Sobre línea de fuera)']
  },
  {
    num: 6,
    titulo: 'El Juego / Buen Retorno (The Play)',
    puntos: 'Un retorno es bueno si la bola, antes del segundo bote, es golpeada correctamente una sola vez y llega a la pared frontal por encima del tin (0.48 m) y por debajo de la línea de fuera (4.57 m), sin tocar el suelo ni a jugadores previamente. Todas las líneas rojas son fuera.',
    criterios: 'Tocar el borde de madera del tin o la cinta roja de fuera es mala/fuera automáticamente.',
    llamados: ['"Down" (Toca el tin o 2.º bote)', '"Out" (Toca o supera línea de fuera)', '"Not up" (Doble bote, arrastre o doble golpe)']
  },
  {
    num: 7,
    titulo: 'Continuidad del Juego (Continuity)',
    puntos: 'El juego debe ser continuo. Máximo de 90 segundos entre calentamiento y 1.º juego, y de 90 segundos entre juegos consecutivos. Avisos obligatorios con cronómetro.',
    criterios: 'A los 75 s el Árbitro canta "Fifteen seconds" y a los 90 s "Time". Plazo razonable para cambio de indumentaria dañada.',
    llamados: ['"Fifteen seconds" (a los 75 s)', '"Time" (a los 90 s)']
  },
  {
    num: 8,
    titulo: 'Interferencia (Interference)',
    puntos: 'El no-golpeador debe otorgar: 1) Vista despejada tras rebote en frontis; 2) Acceso directo e irrestricto; 3) Espacio para swing razonable (1.12 m); 4) Libertad de tiro a cualquier sector del frontón. Subreglas 8.1 a 8.13.',
    criterios: 'Evaluar siempre: 1) Interferencia real y a tiempo; 2) Capacidad de buen retorno; 3) Contacto no creado; 4) Esfuerzo de despeje.',
    llamados: ['"No Let"', '"Yes Let"', '"Stroke to [Player]"']
  },
  {
    num: 9,
    titulo: 'Pelota que Golpea a un Jugador (Ball Hitting a Player)',
    puntos: '9.1.1: Si iba directa a frontón y golpea al oponente: STROKE para el golpeador. 9.1.2: Si iba vía pared lateral/trasera (boast) y golpea al oponente: YES LET. 9.2: Si hubo Turning o segundo intento: STROKE para el oponente. 9.3: Si rebota en frontis y pega en quien golpeó: STROKE al rival.',
    criterios: 'Priorizar seguridad física. En giros la responsabilidad recae enteramente en el golpeador.',
    llamados: ['"Ball hit opponent going directly to front wall: Stroke to [Player]"', '"Ball hit opponent off side wall: Yes Let"']
  },
  {
    num: 10,
    titulo: 'Apelaciones (Appeals)',
    puntos: 'Cualquier jugador puede detener el punto diciendo "Appeal, please" ante fallos de saque o retorno no cantados por el Marcador. Si el Árbitro está seguro, otorga o quita el punto; si no está seguro (Uncertain), concede YES LET.',
    criterios: 'No se admiten apelaciones extemporáneas por jugadas previas al último tiro ejecutado.',
    llamados: ['"Good"', '"Down"', '"Out"', '"Referee uncertain: Yes Let"']
  },
  {
    num: 11,
    titulo: 'La Bola (The Ball)',
    puntos: 'Si la bola se rompe durante un peloteo, se reemplaza por otra homologada (calentándola hasta que tome temperatura de juego) y se concede LET para el punto en disputa, si se apela antes del saque siguiente.',
    criterios: 'El árbitro debe inspeccionar físicamente la bola para constatar la rajadura.',
    llamados: ['"Broken ball: Let"']
  },
  {
    num: 12,
    titulo: 'Distracción (Distraction)',
    puntos: 'Cualquier jugador puede pedir Let por distracción externa o imprevista. Si fue involuntaria: YES LET (si podía continuar el punto). Si fue deliberada por el rival: STROKE para el apelante y posible sanción de conducta.',
    criterios: 'Distinguir ruidos accidentales de acciones antideportivas intencionales para desconcentrar.',
    llamados: ['"Distraction: Yes Let"', '"Deliberate distraction: Stroke to [Player]"']
  },
  {
    num: 13,
    titulo: 'Objeto Caído (Fallen Object)',
    puntos: '13.1 (Raqueta): Se puede recoger y seguir jugando salvo contacto con bola o distracción. 13.2 (Cualquier otro objeto): Si cae gafas, gorra, muñequera o bola del bolsillo, el punto se detiene con STROKE inmediato para el oponente.',
    criterios: 'Regla estricta de seguridad para prevenir torceduras graves al pisar objetos en pista.',
    llamados: ['"Object fallen on court: Stroke to [Opponent]"']
  },
  {
    num: 14,
    titulo: 'Enfermedad, Discapacidad y Lesión (Injury)',
    puntos: '14.1 (Calambres/Fatiga): No dan tiempo de recuperación. 14.2 (Sangrado): Pausa razonable hasta cortar hemorragia. 14.3.1 (Autoinfligida): 3 minutos de recuperación. 14.3.2 (Contribuida): 15 minutos (prorrogables otros 15 min). 14.3.3 (Causada por oponente accidental): 15 min; deliberada: partido para el lesionado.',
    criterios: 'Clasificar la lesión antes de iniciar el cronómetro de asistencia.',
    llamados: ['"Recovery time: 3 minutes (Self-inflicted)"', '"Recovery time: 15 minutes (Contributed)"']
  },
  {
    num: 15,
    titulo: 'Conducta (Conduct)',
    puntos: 'Escala disciplinaria progresiva o directa ante abusos verbales, raquetazos a la pared, demora deliberada o coaching fuera de tiempo: 1. Conduct Warning (Advertencia); 2. Conduct Stroke (Punto al rival); 3. Conduct Game (Juego al rival); 4. Conduct Match (Partido al rival).',
    criterios: 'Firmeza absoluta. Actuar a tiempo previene escaladas de violencia o descontrol en cancha.',
    llamados: ['"Conduct Warning [Player] for [Offence]"', '"Conduct Stroke [Player] for [Offence], point to [Opponent]"']
  }
];

MS.RulesApp = (function () {
  const { U, Rules } = MS;

  function init() {
    renderRuleTOC();
    renderRuleAccordion();
    bindSearch();
  }

  function renderRuleTOC() {
    const tocEl = U.$('#ruleTOC');
    if (!tocEl) return;
    tocEl.innerHTML = '';

    Rules.forEach((r) => {
      const btn = document.createElement('button');
      btn.className = 'rule-toc-btn';
      btn.textContent = `R.${r.num}`;
      btn.title = r.titulo;
      btn.addEventListener('click', () => {
        const item = U.$(`#ruleItem-${r.num}`);
        if (item) {
          item.open = true;
          item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      tocEl.appendChild(btn);
    });
  }

  function renderRuleAccordion(filtered = Rules) {
    const accEl = U.$('#ruleAccordion');
    if (!accEl) return;
    accEl.innerHTML = '';

    filtered.forEach((r) => {
      const details = document.createElement('details');
      details.className = 'rule-item';
      details.id = `ruleItem-${r.num}`;

      details.innerHTML = `
        <summary>
          <span><b>Regla ${r.num}</b> · ${r.titulo}</span>
          <span style="font-size: .85rem; color: var(--brand);">Ver detalles ▾</span>
        </summary>
        <div class="rule-content">
          <p><b>Puntos Clave Reglamentarios:</b> ${r.puntos}</p>
          <p style="margin-top: 10px;"><b>Criterios de Aplicación del Árbitro:</b> ${r.criterios}</p>
          <div class="rule-calls-box">
            <div style="font-family: var(--f-mono); font-size: .78rem; font-weight: 700; color: var(--ink-3); text-transform: uppercase; margin-bottom: 6px;">
              Llamados Oficiales WSF (Inglés / Español):
            </div>
            ${r.llamados.map((c) => `<span class="call-badge">${c}</span>`).join('')}
          </div>
        </div>
      `;
      accEl.appendChild(details);
    });
  }

  function bindSearch() {
    const inpSearch = U.$('#ruleSearchInput');
    if (!inpSearch) return;

    inpSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderRuleAccordion(Rules);
        return;
      }
      const match = Rules.filter((r) =>
        r.titulo.toLowerCase().includes(term) ||
        r.puntos.toLowerCase().includes(term) ||
        r.criterios.toLowerCase().includes(term) ||
        `regla ${r.num}`.includes(term)
      );
      renderRuleAccordion(match);
    });
  }

  return {
    init
  };
})();
