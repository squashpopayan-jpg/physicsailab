/* Nivel B1 · n = 3 · Hg 546 nm */
window.QLE_LEVELS = window.QLE_LEVELS || [];
window.QLE_LEVELS.push({
  id: "b1", code: "B1", n: 3, name: "Intermedio", nm: 546, line: "Hg",
  links: [
    ["BBC Learning English · Intermediate", "https://www.bbc.co.uk/learningenglish/english/course/intermediate", "Curso intermedio completo y gratuito.", "B1"],
    ["BBC 6 Minute English", "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", "Un episodio al día: vocabulario útil sobre ciencia, sociedad y tecnología.", "A2,B1,B2"],
    ["ESL-Lab · intermedio", "https://www.esl-lab.com/intermediate/", "Conversaciones de la vida real con ejercicios.", "B1"],
    ["TED-Ed (YouTube)", "https://www.youtube.com/@TEDEd", "Lecciones animadas de 5 minutos; muchas sobre física.", "B1,B2"],
  ],
  units: [
    /* ---------------- B1·1 ---------------- */
    {
      title: "Experiencia y duración", en: "I've been working here for two months",
      goal: "hablar de cuánto tiempo llevas haciendo algo y del avance de tus proyectos.",
      focus: "present perfect simple and continuous with for/since, how long, just/already/yet",
      grammar: `
<h3>«Llevo…»: presente perfecto + for / since</h3>
<p>El español dice «llevo dos años aquí» en presente. El inglés usa <b>presente perfecto</b> porque la acción empezó en el pasado y sigue ahora:</p>
<ul class="ex">
<li><em>I've been here since August.</em> <span class="es">— Estoy aquí desde agosto.</span></li>
<li><em>I've lived in Boulder for two months.</em> <span class="es">— Llevo dos meses viviendo en Boulder.</span></li>
<li><em>I've been studying English for two years.</em> <span class="es">— Llevo dos años estudiando inglés.</span></li>
</ul>
<p><b>for</b> + duración (<em>for ten minutes</em>, <em>for a long time</em>) · <b>since</b> + punto de inicio (<em>since 2020</em>, <em>since Monday</em>).</p>
<div class="ojo"><p><del>I am here since May.</del> → <em>I've been here since May.</em> · <del>I study English for two years.</del> → <em>I've been studying English for two years.</em></p></div>
<h3>Simple o continuo</h3>
<p><b>have been + -ing</b> enfatiza la actividad y su duración; <b>have + participio</b> enfatiza el resultado:</p>
<ul class="ex">
<li><em>I've been writing the report all morning.</em> <span class="es">(la actividad)</span></li>
<li><em>I've written three pages.</em> <span class="es">(el resultado)</span></li>
</ul>
<h3>just, already, yet</h3>
<ul class="ex">
<li><em>I've just sent it.</em> <span class="es">— Acabo de enviarlo.</span></li>
<li><em>I've already talked to Sarah.</em> <span class="es">— Ya hablé con Sarah.</span></li>
<li><em>Have you finished yet?</em> — <em>Not yet.</em> <span class="es">— ¿Ya terminaste? — Todavía no.</span></li>
</ul>
<p><b>yet</b> va al final en preguntas y negativas; <b>already</b> y <b>just</b> van en medio.</p>`,
      sound: {
        t: "Enlazar consonante con vocal",
        tip: "Los nativos unen la consonante final de una palabra con la vocal de la siguiente: <i>for_a while</i> suena «fo-ra-while», <i>been_in</i> suena «bi-nin». Escucha y repite las frases como una sola palabra.",
        w: ["for a while", "been in", "since April", "I've already", "not at all", "an hour ago"],
      },
      vocab: [
        ["so far", "hasta ahora", "So far, so good."],
        ["lately", "últimamente", "I've been busy lately."],
        ["recently", "recientemente", "I've recently started a new project."],
        ["since", "desde", "I've been here since August."],
        ["for", "durante (duración)", "I've worked here for two months."],
        ["yet", "todavía / ya (preguntas)", "Have you finished yet?"],
        ["already", "ya", "I've already done it."],
        ["just", "acabar de", "I've just arrived."],
        ["progress", "progreso, avance", "We've made good progress."],
        ["thesis", "tesis", "She's been writing her thesis for a year."],
        ["grant", "beca, subvención de investigación", "We've just received a new grant."],
        ["steep learning curve", "curva de aprendizaje empinada", "It's been a steep learning curve."],
      ],
      phrases: [
        ["How long have you been working here?", "¿Cuánto tiempo llevas trabajando aquí?"],
        ["I've been working here for two months.", "Llevo dos meses trabajando aquí."],
        ["I've lived in Boulder since August.", "Vivo en Boulder desde agosto."],
        ["Have you finished the report yet?", "¿Ya terminaste el informe?"],
        ["Not yet, I'm almost done.", "Todavía no, casi termino."],
        ["I've just sent it.", "Acabo de enviarlo."],
        ["I've already talked to Sarah about it.", "Ya hablé con Sarah de eso."],
        ["So far, so good.", "Hasta ahora, todo bien."],
        ["It's been a busy week.", "Ha sido una semana ocupada."],
        ["Lately I've been reading about quantum sensors.", "Últimamente he estado leyendo sobre sensores cuánticos."],
      ],
      ex: [
        ["mc", "I've been waiting ___ 20 minutes.", ["since", "for", "during"], 1, "Duración: for."],
        ["mc", "She has lived here ___ 2021.", ["for", "since", "from"], 1, "Punto de inicio: since."],
        ["gap", "How long ___ you been learning English?", ["have"], ""],
        ["gap", "I ___ the analysis. (acabar de terminar)", ["have just finished", "'ve just finished", "just finished"], "Just + presente perfecto."],
        ["mc", "Has the sample arrived ___?", ["yet", "already", "just"], 0, "Yet al final en preguntas."],
        ["mc", "«Llevo tres meses aquí.»", ["I am here for three months.", "I have been here for three months.", "I was here for three months."], 1, ""],
        ["gap", "We have ___ on this project since January. (trabajar, continuo)", ["been working"], ""],
        ["mc", "I've written three pages. I've ___ writing all morning.", ["be", "been", "being"], 1, ""],
        ["order", "How|long|have|you|been|waiting?", "¿Cuánto tiempo llevas esperando?"],
        ["tr", "Llevo dos años estudiando inglés.", ["I've been studying English for two years", "I have been studying English for two years", "I've been learning English for two years", "I have been learning English for two years", "I've studied English for two years"], ""],
        ["tr", "¿Ya terminaste el informe?", ["Have you finished the report yet?", "Did you finish the report yet?", "Have you already finished the report?", "Have you finished the report already?", "Did you already finish the report?"], "En inglés británico se prefiere el presente perfecto; en EE. UU. también se oye el pasado."],
      ],
      dialogue: {
        ctx: "El profesor Alan Brooks, investigador visitante, conversa con Daniel sobre su proyecto.",
        lines: [
          ["Brooks", "So, Daniel, how long have you been in Sarah's group?", "Entonces, Daniel, ¿cuánto tiempo llevas en el grupo de Sarah?"],
          ["Daniel", "I've been here for about two months. I joined in August.", "Llevo unos dos meses. Entré en agosto."],
          ["Brooks", "And what have you been working on?", "¿Y en qué has estado trabajando?"],
          ["Daniel", "I've been building an interferometer to measure very small vibrations.", "He estado construyendo un interferómetro para medir vibraciones muy pequeñas."],
          ["Brooks", "Interesting. Have you gotten any results yet?", "Interesante. ¿Ya tienes algún resultado?"],
          ["Daniel", "Not yet. I've just finished the alignment, and I've already tested the detectors.", "Todavía no. Acabo de terminar la alineación y ya probé los detectores."],
          ["Brooks", "That's good progress for two months.", "Es un buen avance para dos meses."],
          ["Daniel", "Thanks. It's been a steep learning curve, but so far, so good.", "Gracias. Ha sido una curva de aprendizaje empinada, pero hasta ahora, todo bien."],
          ["Brooks", "Have you worked with interferometers before?", "¿Habías trabajado antes con interferómetros?"],
          ["Daniel", "Yes, I have. I built a Michelson interferometer for my undergraduate thesis in Colombia.", "Sí. Construí un interferómetro de Michelson para mi tesis de pregrado en Colombia."],
        ],
      },
      mission: {
        who: "Un profesor visitante interesado en tu trabajo",
        role: "Dr. Alan Brooks, a visiting professor who is interested in the learner's career and current project (teaching, research or engineering). Ask how long, since when, and about progress.",
        scene: "Un profesor visitante te pregunta por tu trayectoria y tu proyecto actual.",
        goals: ["Usa for o since correctamente", "Usa el presente perfecto continuo (have been + -ing)", "Usa yet, already o just", "Usa el pasado simple para un hecho terminado con fecha"],
        start: "Nice to meet you! Sarah told me about your work. How long have you been working on your current project?",
        guided: [
          ["How long have you been working on your current project?", "I've been working on it for about six months."],
          ["How long have you been teaching?", "I've been teaching physics since 2015."],
          ["Have you published anything yet?", "Not yet, but I've already written a first draft."],
          ["Where did you study?", "I studied Engineering Physics in Popayán. I graduated in 2012."],
        ],
      },
      links: [
        ["Present perfect continuous (Perfect English Grammar)", "https://www.perfect-english-grammar.com/present-perfect-continuous.html", "Cuándo usar have been + -ing.", "Gramática"],
        ["BBC Lower intermediate: unidades de present perfect", "https://www.bbc.co.uk/learningenglish/english/course/lower-intermediate", "Lecciones en video con ejercicios.", "Gramática,Escuchar"],
        ["YouGlish: «how long have you been»", "https://youglish.com/pronounce/how%20long%20have%20you%20been/english", "Preguntas reales de duración.", "Frases"],
        ["Sixty Symbols (YouTube)", "https://www.youtube.com/@sixtysymbols", "Físicos de la Universidad de Nottingham hablando de su trabajo.", "Física"],
      ],
    },
    /* ---------------- B1·2 ---------------- */
    {
      title: "Si… entonces", en: "If you heat it, it expands",
      goal: "enunciar leyes y causas, y hablar de consecuencias futuras probables.",
      focus: "zero and first conditional, unless, as soon as, when vs if",
      grammar: `
<h3>Condicional cero: leyes y hechos</h3>
<div class="formula">If + presente, presente</div>
<p>Para lo que <b>siempre</b> ocurre. Es el condicional de la física:</p>
<ul class="ex">
<li><em>If you heat a gas, it expands.</em> <span class="es">— Si calientas un gas, se expande.</span></li>
<li><em>If you double the voltage, the current doubles.</em> <span class="es">(en un resistor óhmico)</span></li>
<li><em>If the temperature rises, the resistance increases.</em></li>
</ul>
<h3>Primer condicional: consecuencias probables</h3>
<div class="formula">If + presente, will + verbo</div>
<ul class="ex">
<li><em>If we finish early, we'll go for a coffee.</em></li>
<li><em>If you order it today, it will arrive on Friday.</em></li>
</ul>
<div class="ojo"><p>Después de <b>if</b> no va «will»: <del>If it will rain, …</del> → <em>If it rains, we'll stay inside.</em> Lo mismo con when, as soon as, unless, before, after.</p></div>
<h3>unless, as soon as, when</h3>
<ul class="ex">
<li><em>We won't finish unless we work this weekend.</em> <span class="es">— No terminaremos a menos que trabajemos este fin de semana.</span></li>
<li><em>I'll call you as soon as I get the results.</em> <span class="es">— Te llamo en cuanto tenga los resultados.</span></li>
<li><em>When I get home, I'll call you.</em> <span class="es">(seguro que llegaré)</span> vs. <em>If I have time, I'll call you.</em> <span class="es">(quizás)</span></li>
</ul>`,
      sound: {
        t: "Entonación en condicionales",
        tip: "En una oración condicional la voz <b>sube</b> al final de la parte con if (la pausa de la coma) y <b>baja</b> al final de la oración: <i>If you heat the gas ↗, it expands ↘.</i> Esto le dice al oyente «espera, falta la consecuencia».",
        w: ["If you heat the gas, it expands.", "If it rains, we'll stay inside.", "Unless we hurry, we'll be late.", "As soon as I know, I'll tell you."],
      },
      vocab: [
        ["increase / decrease", "aumentar / disminuir", "The signal increases with power."],
        ["double / halve", "duplicar / reducir a la mitad", "If you halve the distance, the force quadruples."],
        ["expand / contract", "dilatarse / contraerse", "Metals expand when heated."],
        ["heat / cool", "calentar / enfriar", "Heat the sample slowly."],
        ["pressure", "presión", "The pressure drops at high altitude."],
        ["voltage / current", "voltaje / corriente", "Measure the voltage and the current."],
        ["unless", "a menos que", "Unless we hurry, we'll be late."],
        ["as soon as", "en cuanto", "I'll tell you as soon as I know."],
        ["drift", "deriva (de una señal)", "The signal is drifting again."],
        ["trade-off", "compromiso (ganar algo perdiendo otra cosa)", "It's a trade-off between speed and noise."],
        ["noise", "ruido", "If we lower the power, the noise goes down."],
        ["ship", "enviar (un pedido)", "It usually ships the same day."],
      ],
      phrases: [
        ["If you double the voltage, the current doubles.", "Si duplicas el voltaje, la corriente se duplica."],
        ["If the temperature rises, the resistance increases.", "Si sube la temperatura, la resistencia aumenta."],
        ["If we finish early, we'll go for a coffee.", "Si terminamos temprano, iremos por un café."],
        ["I'll let you know as soon as I get the results.", "Te aviso en cuanto tenga los resultados."],
        ["We won't meet the deadline unless we work this weekend.", "No cumpliremos el plazo a menos que trabajemos este fin de semana."],
        ["What happens if we remove the filter?", "¿Qué pasa si quitamos el filtro?"],
        ["If you have any questions, just ask.", "Si tienes preguntas, solo pregunta."],
        ["Let me know if you need help.", "Avísame si necesitas ayuda."],
        ["It's a trade-off.", "Es un compromiso: ganas algo y pierdes otra cosa."],
        ["If in doubt, ask Mike.", "Si tienes dudas, pregúntale a Mike."],
      ],
      ex: [
        ["mc", "If you heat ice, it ___.", ["melts", "will melt", "melted"], 0, "Hecho general: condicional cero."],
        ["mc", "If it ___ tomorrow, we'll cancel the trip.", ["will snow", "snows", "snowed"], 1, "Después de if, presente."],
        ["gap", "If we don't hurry, we ___ (miss) the bus.", ["will miss", "'ll miss"], ""],
        ["mc", "___ you study, you won't pass.", ["If", "Unless", "When"], 1, "Unless = a menos que."],
        ["gap", "I'll call you as soon as I ___ (arrive).", ["arrive"], "Después de as soon as, presente."],
        ["mc", "«___ I get home, I'll call you.» (seguro que llego)", ["If", "When"], 1, "When: algo que seguro ocurrirá."],
        ["gap", "At constant temperature, if you increase the pressure of a gas, its volume ___ (decrease).", ["decreases"], "Ley de Boyle: condicional cero."],
        ["mc", "It's a ___: more speed means more noise.", ["trade-off", "take-off", "trade-in"], 0, ""],
        ["order", "What|happens|if|we|remove|the|filter?", "¿Qué pasa si quitamos el filtro?"],
        ["tr", "Si tienes preguntas, avísame.", ["If you have any questions, let me know", "If you have questions, let me know", "If you have any questions, tell me", "Let me know if you have any questions"], ""],
        ["tr", "Si terminamos temprano, iremos a tomar un café.", ["If we finish early, we'll go for a coffee", "If we finish early, we will go for a coffee", "If we finish early, we'll get a coffee", "If we finish early, we'll go for coffee", "If we finish early, we'll go get a coffee", "If we finish early, we will have a coffee", "If we finish early, we'll have a coffee"], ""],
      ],
      dialogue: {
        ctx: "Priya y Daniel intentan entender por qué la señal de su interferómetro deriva.",
        lines: [
          ["Priya", "The signal is drifting again. What do you think is happening?", "La señal está derivando otra vez. ¿Qué crees que pasa?"],
          ["Daniel", "If the temperature changes, the fiber length changes, and the phase drifts.", "Si cambia la temperatura, cambia la longitud de la fibra y la fase deriva."],
          ["Priya", "Right. So if we put the fiber in a box, will it help?", "Claro. Entonces, si ponemos la fibra en una caja, ¿ayudará?"],
          ["Daniel", "It'll help a bit. But unless we control the temperature actively, it won't be stable for hours.", "Ayudará un poco. Pero a menos que controlemos la temperatura activamente, no será estable por horas."],
          ["Priya", "OK. If I order a temperature controller today, when will it arrive?", "Bien. Si pido un controlador de temperatura hoy, ¿cuándo llegará?"],
          ["Daniel", "If you order it before noon, it usually ships the same day.", "Si lo pides antes del mediodía, normalmente lo envían el mismo día."],
          ["Priya", "Perfect. I'll order it now. And what happens if we lower the laser power?", "Perfecto. Lo pido ya. ¿Y qué pasa si bajamos la potencia del láser?"],
          ["Daniel", "If we lower the power, the noise goes down, but the signal gets weaker too.", "Si bajamos la potencia, el ruido baja, pero la señal también se debilita."],
          ["Priya", "The classic trade-off.", "El compromiso clásico."],
          ["Daniel", "As always! I'll let you know as soon as the new data is ready.", "¡Como siempre! Te aviso en cuanto estén los datos nuevos."],
        ],
      },
      mission: {
        who: "Un estudiante curioso en una feria de ciencias",
        role: "Lucas, a curious high-school student at a science fair who keeps asking 'What happens if...?' about the learner's experiment or about everyday physics.",
        scene: "En una feria de ciencias, un estudiante te hace preguntas «¿qué pasa si…?». Responde con condicionales.",
        goals: ["Enuncia dos leyes con el condicional cero", "Usa el primer condicional para una consecuencia", "Usa unless o as soon as", "Pregúntale algo al estudiante con if"],
        start: "Hi! This experiment looks cool. What happens if I push this button?",
        guided: [
          ["What happens if I push this button?", "If you push it, the laser turns on. So please don't look into the beam!"],
          ["Why does the balloon get bigger when you heat it?", "If you heat a gas, its molecules move faster, so it expands."],
          ["Will the experiment work if it's cold outside?", "It will work, but it won't be very precise unless we wait for it to warm up."],
          ["Can I try it?", "Sure! If you put on these glasses, you can try it."],
        ],
      },
      links: [
        ["Zero conditional (Perfect English Grammar)", "https://www.perfect-english-grammar.com/zero-conditional.html", "Leyes y hechos generales.", "Gramática"],
        ["First conditional (Perfect English Grammar)", "https://www.perfect-english-grammar.com/first-conditional.html", "Consecuencias probables.", "Gramática"],
        ["Condicionales (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/conditionals", "Panorama completo de los condicionales.", "Gramática"],
        ["MinutePhysics (YouTube)", "https://www.youtube.com/@minutephysics", "Muchos «¿qué pasaría si…?» de física en pocos minutos.", "Física"],
      ],
    },
    /* ---------------- B1·3 ---------------- */
    {
      title: "La voz pasiva", en: "The samples were cleaned",
      goal: "describir procedimientos y métodos experimentales como en un informe o artículo.",
      focus: "passive voice (present, past, present perfect, modals), by + agent, passive in methods sections",
      grammar: `
<h3>Pasiva = be + participio</h3>
<p>Se usa cuando importa <b>qué se hizo</b>, no quién lo hizo. El tiempo lo marca el verbo <b>be</b>:</p>
<div class="tbl"><table>
<tr><th>Tiempo</th><th>Ejemplo</th></tr>
<tr><td>presente</td><td><em>The results are shown in Figure 2.</em></td></tr>
<tr><td>pasado</td><td><em>The samples were cleaned with acetone.</em></td></tr>
<tr><td>presente perfecto</td><td><em>The sensor has been calibrated.</em></td></tr>
<tr><td>con modal</td><td><em>It can be measured with a spectrometer.</em></td></tr>
</table></div>
<h3>El «se» del español suele ser pasiva en inglés</h3>
<ul class="ex">
<li>«Se midió la temperatura cada hora.» → <em>The temperature was measured every hour.</em></li>
<li>«Aquí se habla inglés.» → <em>English is spoken here.</em></li>
<li>«Se ha pospuesto la reunión.» → <em>The meeting has been postponed.</em></li>
</ul>
<p>Añade <b>by</b> solo si el agente es importante: <em>The setup was built by Mike.</em></p>
<h3>¿Pasiva o «we» en un artículo?</h3>
<p>En la sección de métodos, la pasiva es clásica: <em>The sample was heated to 400 K.</em> Pero muchas revistas hoy prefieren la voz activa con <b>we</b> para las decisiones: <em>We chose this method because it is faster.</em> Combina ambas.</p>
<div class="ojo"><p><del>The data was collect over three days.</del> → <em>The data were collected over three days.</em> Siempre el <b>participio</b> (-ed o irregular).</p></div>`,
      sound: {
        t: "El acento se mueve dentro de la familia de palabras",
        tip: "En inglés, el acento cambia al añadir sufijos: <i>PHOtograph → phoTOGraphy → photoGRAPHic</i>. Lo mismo con <i>ANalyze → aNALysis</i> y <i>CALibrate → caliBRAtion</i>. Poner el acento en la sílaba equivocada dificulta más la comprensión que un sonido imperfecto.",
        w: ["photograph|photography", "analyze|analysis", "calibrate|calibration", "method|methodology", "measure|measurement"],
      },
      vocab: [
        ["sample", "muestra", "The samples were cleaned with acetone."],
        ["record", "registrar", "The data were recorded every second."],
        ["collect", "recolectar, tomar (datos)", "Data were collected over three days."],
        ["place / mount", "colocar / montar", "The mirror was mounted on a stage."],
        ["carry out", "llevar a cabo", "The experiment was carried out at room temperature."],
        ["perform", "realizar", "All measurements were performed twice."],
        ["obtain", "obtener", "Similar results were obtained."],
        ["estimate", "estimar", "Errors were estimated from repeated measurements."],
        ["chamber", "cámara (de vacío)", "The samples were placed in the chamber."],
        ["procedure", "procedimiento", "The procedure is described below."],
        ["room temperature", "temperatura ambiente", "It was measured at room temperature."],
        ["postpone", "posponer", "The meeting has been postponed."],
      ],
      phrases: [
        ["The samples were cleaned with acetone.", "Las muestras se limpiaron con acetona."],
        ["The data were collected over three days.", "Los datos se tomaron durante tres días."],
        ["The sensor has been calibrated.", "El sensor ha sido calibrado."],
        ["The results are shown in Figure 2.", "Los resultados se muestran en la Figura 2."],
        ["It can be measured with a spectrometer.", "Se puede medir con un espectrómetro."],
        ["The experiment was carried out at room temperature.", "El experimento se llevó a cabo a temperatura ambiente."],
        ["Errors were estimated from repeated measurements.", "Los errores se estimaron a partir de mediciones repetidas."],
        ["We chose this method because it is faster.", "Elegimos este método porque es más rápido."],
        ["The meeting has been postponed.", "La reunión se ha pospuesto."],
        ["It is widely known that...", "Es ampliamente conocido que…"],
      ],
      ex: [
        ["mc", "The samples ___ yesterday.", ["cleaned", "were cleaned", "have cleaned"], 1, "Pasiva en pasado: were + participio."],
        ["gap", "«Se midió la temperatura cada hora.» → The temperature ___ every hour.", ["was measured"], ""],
        ["gap", "The results ___ (show, pasiva presente) in Table 1.", ["are shown"], ""],
        ["mc", "The sensor has ___ calibrated.", ["be", "been", "being"], 1, "Presente perfecto pasivo: has been + participio."],
        ["gap", "This value can ___ (calculate) from Equation 3.", ["be calculated"], "Modal + be + participio."],
        ["mc", "¿Cuándo se usa «by» en la pasiva?", ["Siempre", "Solo cuando importa quién lo hizo"], 1, ""],
        ["gap", "English ___ (speak) all over the world.", ["is spoken"], ""],
        ["mc", "For a decision in a paper, many journals prefer:", ["The method was chosen.", "We chose this method because it is faster."], 1, "Voz activa con «we» para decisiones."],
        ["order", "The|experiment|was|carried|out|at|room|temperature.", "El experimento se llevó a cabo a temperatura ambiente."],
        ["tr", "Se tomaron las muestras en 2025.", ["The samples were taken in 2025", "The samples were collected in 2025"], ""],
        ["tr", "La reunión se ha pospuesto.", ["The meeting has been postponed", "The meeting's been postponed", "The meeting has been delayed", "The meeting has been put off"], ""],
      ],
      dialogue: {
        ctx: "Sarah revisa la sección de métodos que escribió Daniel para un informe.",
        lines: [
          ["Sarah", "I read your methods section. It's good, but some sentences are hard to follow.", "Leí tu sección de métodos. Está bien, pero algunas oraciones son difíciles de seguir."],
          ["Daniel", "Which ones?", "¿Cuáles?"],
          ["Sarah", "This one: 'We took the samples and we put them in the chamber and we heated them.'", "Esta: «Tomamos las muestras y las pusimos en la cámara y las calentamos»."],
          ["Daniel", "Too many 'we's?", "¿Demasiados «nosotros»?"],
          ["Sarah", "A bit. Try the passive: 'The samples were placed in the chamber and heated to 400 kelvin.'", "Un poco. Prueba la pasiva: «Las muestras se colocaron en la cámara y se calentaron a 400 kelvin»."],
          ["Daniel", "That sounds more formal. Should I use the passive everywhere?", "Suena más formal. ¿Debo usar la pasiva en todas partes?"],
          ["Sarah", "No. Many journals prefer the active voice now. Use 'we' for decisions: 'We chose this method because...'", "No. Muchas revistas prefieren ahora la voz activa. Usa «we» para las decisiones: «Elegimos este método porque…»."],
          ["Daniel", "And the passive for procedures?", "¿Y la pasiva para los procedimientos?"],
          ["Sarah", "Exactly. The reader cares about what was done, not who did it.", "Exacto. Al lector le importa qué se hizo, no quién lo hizo."],
          ["Daniel", "Got it. I'll revise it tonight.", "Entendido. Lo reviso esta noche."],
        ],
      },
      mission: {
        who: "Tu jefa, que revisa tu cuaderno de laboratorio",
        role: "Sarah, the learner's supervisor, asking about an experiment or lab practice the learner did (real or invented). Ask how things were prepared, measured and analyzed.",
        scene: "Describe un experimento o una práctica de laboratorio que hiciste (o inventado) como en la sección de métodos de un informe.",
        goals: ["Usa tres oraciones pasivas en pasado", "Usa una pasiva con modal (can be, must be)", "Usa «we» en voz activa para una decisión", "Menciona una unidad o condición experimental"],
        start: "Tell me about the experiment you did last week. How were the samples prepared?",
        guided: [
          ["How were the samples prepared?", "The samples were cut into small pieces and cleaned with alcohol."],
          ["How was the temperature controlled?", "The temperature was kept at 25 degrees Celsius with a water bath."],
          ["Why did you use that sensor?", "We chose it because it can be calibrated easily."],
          ["How were the errors estimated?", "Each measurement was repeated five times, and the standard deviation was calculated."],
        ],
      },
      links: [
        ["The passive (Perfect English Grammar)", "https://www.perfect-english-grammar.com/passive.html", "Todas las formas de la pasiva con ejercicios.", "Gramática"],
        ["Passive (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/passive", "Referencia completa.", "Gramática"],
        ["Academic Phrasebank: describir métodos", "https://www.phrasebank.manchester.ac.uk/describing-methods/", "Frases reales de artículos para la sección de métodos (Univ. de Manchester).", "Frases,Escritura"],
        ["Writing in the Sciences (Stanford, Coursera)", "https://www.coursera.org/learn/sciwrite", "El curso de referencia para escribir ciencia en inglés con claridad.", "Escritura"],
      ],
    },
    /* ---------------- B1·4 ---------------- */
    {
      title: "Obligación, consejo y deducción", en: "You should check the alignment",
      goal: "explicar reglas, dar consejos y hacer deducciones cuando algo falla.",
      focus: "modals: must, have to, don't have to vs mustn't, should, might/may/could, must be / can't be",
      grammar: `
<h3>Obligación y prohibición</h3>
<div class="tbl"><table>
<tr><th>Modal</th><th>Significado</th><th>Ejemplo</th></tr>
<tr><td>have to / must</td><td>obligación</td><td><em>You have to wear goggles in the lab.</em></td></tr>
<tr><td>mustn't</td><td>prohibido</td><td><em>You mustn't eat in the lab.</em></td></tr>
<tr><td>don't have to</td><td>no es necesario</td><td><em>You don't have to come if you're busy.</em></td></tr>
</table></div>
<div class="ojo"><p><b>mustn't</b> y <b>don't have to</b> parecen iguales pero son casi opuestos: <em>You mustn't come</em> = está prohibido venir; <em>You don't have to come</em> = no es obligatorio, puedes venir si quieres.</p></div>
<h3>Consejo: should</h3>
<ul class="ex">
<li><em>You should talk to Sarah about it.</em> <span class="es">— Deberías hablar con Sarah.</span></li>
<li><em>I'd recommend checking the connections first.</em> <span class="es">— Te recomendaría revisar primero las conexiones.</span></li>
</ul>
<h3>Deducción: ¿qué está pasando?</h3>
<ul class="ex">
<li><em>It must be the amplifier.</em> <span class="es">— Tiene que ser el amplificador (casi seguro).</span></li>
<li><em>It might be a loose cable.</em> / <em>It could be a grounding problem.</em> <span class="es">— Podría ser… (posible)</span></li>
<li><em>It can't be the laser. We just replaced it.</em> <span class="es">— No puede ser el láser (casi imposible).</span></li>
</ul>
<p>Todos los modales van seguidos del verbo <b>sin «to»</b> (excepto have to): <del>You must to go.</del> → <em>You must go.</em></p>
<p>Y ojo: <b>advice</b> (consejo) es sustantivo incontable; <b>advise</b> es el verbo. <em>Can I give you some advice?</em></p>`,
      sound: {
        t: "Letras mudas en los modales",
        tip: "En <i>should, could, would</i> la <b>l no suena</b>: «shud, kud, wud». En <i>mustn't</i> la primera t tampoco: «MAS-nt». Y <i>ought to</i> suena «O-tə».",
        w: ["should", "could", "would", "mustn't", "might", "ought to"],
      },
      vocab: [
        ["allowed", "permitido", "You're not allowed to eat here."],
        ["required", "obligatorio, requerido", "Safety training is required."],
        ["optional", "opcional", "The seminar is optional."],
        ["recommend", "recomendar", "I'd recommend checking the cables."],
        ["advice", "consejo (incontable)", "Can I give you some advice?"],
        ["likely / unlikely", "probable / improbable", "It's unlikely to be the laser."],
        ["loose", "flojo, suelto", "It might be a loose cable."],
        ["grounding", "conexión a tierra", "Could it be a grounding problem?"],
        ["unplug", "desenchufar", "Maybe someone unplugged it."],
        ["troubleshoot", "diagnosticar y resolver fallas", "Let's troubleshoot the detector."],
        ["rules", "reglas, normas", "What are the lab rules?"],
        ["safety", "seguridad", "Safety first!"],
      ],
      phrases: [
        ["You have to wear goggles in the lab.", "Tienes que usar gafas en el laboratorio."],
        ["You don't have to come to the seminar if you're busy.", "No tienes que venir al seminario si estás ocupado."],
        ["You mustn't eat in the lab.", "Está prohibido comer en el laboratorio."],
        ["You should talk to Sarah about it.", "Deberías hablar con Sarah de eso."],
        ["It might be a loose cable.", "Podría ser un cable flojo."],
        ["It must be the power supply.", "Tiene que ser la fuente de poder."],
        ["It can't be the laser. We just replaced it.", "No puede ser el láser. Lo acabamos de cambiar."],
        ["Could it be a grounding problem?", "¿Podría ser un problema de tierra?"],
        ["I'd recommend checking the connections first.", "Te recomendaría revisar primero las conexiones."],
        ["Can I give you some advice?", "¿Te puedo dar un consejo?"],
      ],
      ex: [
        ["mc", "Está prohibido comer aquí: You ___ eat in the lab.", ["don't have to", "mustn't", "shouldn't have"], 1, "Prohibición: mustn't."],
        ["mc", "No es obligatorio: You ___ come on Saturday.", ["mustn't", "don't have to", "can't"], 1, ""],
        ["gap", "You look tired. You ___ get some rest.", ["should", "ought to"], "Consejo."],
        ["mc", "The lights are off and nobody answers. They ___ be at home.", ["must", "can't", "should"], 1, "Deducción negativa: can't be."],
        ["gap", "I'm not sure. It ___ be a software bug. (posibilidad)", ["might", "may", "could"], ""],
        ["mc", "Can I give you some ___?", ["advice", "advise", "advices"], 0, "Advice: sustantivo incontable."],
        ["gap", "Visitors ___ sign in at the front desk. (tener que)", ["have to", "must"], ""],
        ["mc", "You must ___ the form.", ["sign", "to sign", "signing"], 0, "Modal + verbo sin to."],
        ["order", "It|might|be|a|loose|cable.", "Podría ser un cable flojo."],
        ["tr", "Deberías hablar con tu supervisor.", ["You should talk to your supervisor", "You should speak to your supervisor", "You should speak with your supervisor", "You should talk with your supervisor"], ""],
        ["tr", "No tienes que venir mañana.", ["You don't have to come tomorrow", "You do not have to come tomorrow", "You don't need to come tomorrow"], "No es necesario: don't have to (no mustn't)."],
      ],
      dialogue: {
        ctx: "El detector no da señal. Mike y Daniel buscan la causa.",
        lines: [
          ["Mike", "The detector isn't giving any signal. What's wrong with it?", "El detector no da señal. ¿Qué le pasa?"],
          ["Daniel", "It can't be the laser. I can see the beam on the card.", "No puede ser el láser. Veo el haz en la tarjeta."],
          ["Mike", "Then it might be the cable. Or the amplifier.", "Entonces podría ser el cable. O el amplificador."],
          ["Daniel", "It must be the amplifier. Look, the power light is off.", "Tiene que ser el amplificador. Mira, la luz de encendido está apagada."],
          ["Mike", "You're right. Maybe someone unplugged it.", "Tienes razón. Quizás alguien lo desenchufó."],
          ["Daniel", "Should I plug it back in?", "¿Lo vuelvo a enchufar?"],
          ["Mike", "Yes, but you have to turn off the high voltage first. You mustn't connect it while it's on.", "Sí, pero primero tienes que apagar el alto voltaje. No debes conectarlo mientras está encendido."],
          ["Daniel", "OK. Do I have to recalibrate it after that?", "Bien. ¿Tengo que recalibrarlo después?"],
          ["Mike", "No, you don't have to. The settings are saved.", "No, no hace falta. La configuración queda guardada."],
          ["Daniel", "Great. The signal's back!", "Genial. ¡Volvió la señal!"],
        ],
      },
      mission: {
        who: "Un estudiante nuevo que pregunta por las reglas",
        role: "Emma, a new student starting in the learner's lab, classroom or workplace next week, asking about rules and asking for advice for her first month. At some point, mention that her computer or instrument is not working and ask what the problem could be.",
        scene: "Una estudiante nueva pregunta por las reglas de tu laboratorio o lugar de trabajo y te pide consejos. Luego te consulta por un equipo que no funciona.",
        goals: ["Explica una obligación (have to / must)", "Distingue mustn't y don't have to", "Da un consejo con should", "Haz una deducción (might / must / can't be)"],
        start: "Hi! I'm starting in the lab next week. Are there any rules I need to know?",
        guided: [
          ["Are there any rules I need to know?", "Yes. You have to wear safety glasses, and you mustn't eat or drink in the lab."],
          ["Do I have to come every day?", "No, you don't have to come every day, but you should come to the Monday meeting."],
          ["Any advice for my first month?", "You should read the manuals first and ask Mike if you have questions."],
          ["My computer won't turn on. What could it be?", "It might be the power cable. It can't be the battery, because it's a desktop."],
        ],
      },
      links: [
        ["Modal verbs (Perfect English Grammar)", "https://www.perfect-english-grammar.com/modal-verbs.html", "Todos los modales con ejercicios.", "Gramática"],
        ["Modales (EnglishPage)", "https://www.englishpage.com/modals/modalintro.html", "Tabla completa de significados de cada modal.", "Gramática"],
        ["BBC Intermediate", "https://www.bbc.co.uk/learningenglish/english/course/intermediate", "Lecciones en video, varias sobre modales.", "Escuchar"],
        ["YouGlish: «you don't have to»", "https://youglish.com/pronounce/you%20don't%20have%20to/english", "La expresión en contexto real.", "Frases"],
      ],
    },
    /* ---------------- B1·5 ---------------- */
    {
      title: "Contar historias", en: "I was calibrating the laser when...",
      goal: "narrar una anécdota con fondo, interrupciones, antecedentes y desenlace.",
      focus: "past continuous vs past simple, past perfect, used to, narrative connectors",
      grammar: `
<h3>Fondo e interrupción</h3>
<p>El <b>pasado continuo</b> (was/were + -ing) describe la escena; el <b>pasado simple</b>, lo que la interrumpe:</p>
<ul class="ex">
<li><em>I was calibrating the laser when the power went out.</em> <span class="es">— Estaba calibrando el láser cuando se fue la luz.</span></li>
<li><em>While we were waiting, it started to snow.</em> <span class="es">— Mientras esperábamos, empezó a nevar.</span></li>
</ul>
<h3>Lo que había pasado antes: pasado perfecto</h3>
<div class="formula">had + participio</div>
<ul class="ex">
<li><em>When I arrived, the talk had already started.</em> <span class="es">— Cuando llegué, la charla ya había empezado.</span></li>
<li><em>By the time I got there, everyone had left.</em> <span class="es">— Para cuando llegué, todos se habían ido.</span></li>
</ul>
<p>Compara: <em>When I arrived, the talk started.</em> = empezó justo cuando llegué.</p>
<h3>Hábitos del pasado: used to</h3>
<ul class="ex">
<li><em>I used to play soccer every weekend.</em> <span class="es">— Solía jugar fútbol cada fin de semana (ya no).</span></li>
<li><em>Did you use to live in Cali?</em> <span class="es">(con did → use, sin -d)</span></li>
</ul>
<div class="ojo"><p><b>used to</b> es solo pasado. Para hábitos presentes: <del>I use to get up early.</del> → <em>I usually get up early.</em></p></div>
<h3>Conectores para narrar</h3>
<p><em>suddenly</em> (de repente), <em>meanwhile</em> (mientras tanto), <em>eventually</em> (finalmente, al final — ¡no «eventualmente»!), <em>it turned out that…</em> (resultó que…), <em>long story short</em> (en resumen).</p>`,
      sound: {
        t: "Ritmo: acentúa lo importante, reduce lo demás",
        tip: "El inglés tiene ritmo acentual: las palabras con contenido (sustantivos, verbos, adjetivos) se acentúan y las gramaticales (was, the, when, to) se reducen y se dicen rápido. <i>I was CAlibrating the LAser when the POWer went OUT</i>.",
        w: ["I was calibrating the laser when the power went out.", "While we were waiting, it started to snow.", "It turned out that the cable was broken.", "Long story short, we lost two days of data."],
      },
      vocab: [
        ["suddenly", "de repente", "Suddenly, the lights went out."],
        ["meanwhile", "mientras tanto", "Meanwhile, the pressure was rising."],
        ["eventually", "finalmente, al final", "Eventually, we found the problem."],
        ["it turned out", "resultó que", "It turned out that the cable was broken."],
        ["realize", "darse cuenta", "I realized the pumps had stopped."],
        ["notice", "notar", "Did you notice anything strange?"],
        ["go out", "apagarse (luz, fuego)", "The power went out at ten."],
        ["break down", "averiarse", "The pump broke down again."],
        ["spill", "derramar", "I spilled coffee on my notes."],
        ["figure out", "descifrar, entender", "We eventually figured it out."],
        ["luckily", "por suerte", "Luckily, the chamber was OK."],
        ["used to", "solía", "I used to work in a factory."],
      ],
      phrases: [
        ["You won't believe what happened yesterday.", "No vas a creer lo que pasó ayer."],
        ["I was calibrating the laser when the power went out.", "Estaba calibrando el láser cuando se fue la luz."],
        ["While we were waiting, it started to snow.", "Mientras esperábamos, empezó a nevar."],
        ["By the time I got there, everyone had left.", "Para cuando llegué, todos se habían ido."],
        ["It turned out that the cable was broken.", "Resultó que el cable estaba roto."],
        ["Eventually, we figured it out.", "Al final, lo resolvimos."],
        ["I used to work in a factory.", "Solía trabajar en una fábrica."],
        ["Long story short, we lost two days of data.", "En resumen, perdimos dos días de datos."],
        ["What happened next?", "¿Y qué pasó después?"],
        ["No way!", "¡No puede ser!"],
      ],
      ex: [
        ["mc", "I ___ the report when the phone rang.", ["wrote", "was writing", "had written"], 1, "Acción de fondo interrumpida: pasado continuo."],
        ["gap", "While we ___ (wait), it started to rain.", ["were waiting"], ""],
        ["mc", "When I arrived, the talk ___. (ya había empezado)", ["started", "had started", "was starting"], 1, "Algo anterior a otro pasado: pasado perfecto."],
        ["gap", "I ___ play soccer every weekend when I was a kid.", ["used to"], ""],
        ["mc", "It turned out ___ the sensor was broken.", ["that", "what", "as"], 0, ""],
        ["gap", "By the time we got there, they ___ (leave).", ["had left"], ""],
        ["mc", "Did you ___ to live in Cali?", ["use", "used", "using"], 0, "Con did, «use» sin -d."],
        ["mc", "«Eventually» significa:", ["eventualmente, quizás", "finalmente, al final"], 1, "Falso amigo frecuente."],
        ["order", "I|was|working|when|the|power|went|out.", "Estaba trabajando cuando se fue la luz."],
        ["tr", "Estaba alineando el láser cuando se fue la luz.", ["I was aligning the laser when the power went out", "I was aligning the laser when the lights went out", "I was aligning the laser when the power failed", "I was aligning the laser when there was a power outage", "I was aligning the laser when the electricity went out"], ""],
        ["tr", "Resultó que el cable estaba roto.", ["It turned out that the cable was broken", "It turned out the cable was broken", "It turned out that the cable was damaged"], ""],
      ],
      dialogue: {
        ctx: "Daniel le cuenta a Priya la noche desastrosa que tuvo en el laboratorio.",
        lines: [
          ["Daniel", "You won't believe what happened last night.", "No vas a creer lo que pasó anoche."],
          ["Priya", "What happened?", "¿Qué pasó?"],
          ["Daniel", "I was taking data at around ten p.m. when suddenly the power went out.", "Estaba tomando datos como a las diez de la noche cuando de repente se fue la luz."],
          ["Priya", "Oh no! Did you lose everything?", "¡Ay, no! ¿Perdiste todo?"],
          ["Daniel", "Almost. I had saved the first file, but the second one was still running.", "Casi. Había guardado el primer archivo, pero el segundo todavía estaba corriendo."],
          ["Priya", "What did you do?", "¿Y qué hiciste?"],
          ["Daniel", "I called the emergency number. While I was waiting, I realized the vacuum pumps had stopped too.", "Llamé al número de emergencias. Mientras esperaba, me di cuenta de que las bombas de vacío también se habían detenido."],
          ["Priya", "That's bad. Was the chamber OK?", "Eso es grave. ¿La cámara estaba bien?"],
          ["Daniel", "Yes, luckily. It turned out that the valves close automatically.", "Sí, por suerte. Resultó que las válvulas se cierran automáticamente."],
          ["Priya", "Thank goodness. So, long story short?", "Menos mal. ¿Y en resumen?"],
          ["Daniel", "Long story short, I got home at two a.m. and I have to repeat the measurement.", "En resumen, llegué a casa a las dos de la mañana y tengo que repetir la medición."],
          ["Priya", "I used to hate those nights. Coffee's on me.", "Yo odiaba esas noches. El café va por mi cuenta."],
        ],
      },
      mission: {
        who: "Un amigo al que le encantan las anécdotas",
        role: "Alex, a friend who loves stories. Ask the learner for a story (a problem at work, a trip, something funny) and react with interest, asking 'What happened next?' and questions about details.",
        scene: "Cuenta una anécdota real o inventada: un problema en el trabajo, un viaje, algo gracioso.",
        goals: ["Usa pasado continuo + pasado simple (interrupción)", "Usa el pasado perfecto (had + participio)", "Usa un conector: suddenly, eventually o it turned out", "Usa used to para un hábito pasado"],
        start: "So, tell me a story! What's the craziest thing that ever happened to you at work or on a trip?",
        guided: [
          ["What's the craziest thing that happened to you?", "Once I was giving a class when suddenly the fire alarm went off."],
          ["No way! What happened next?", "We all went outside. It turned out that someone had burned popcorn in the kitchen."],
          ["Ha! Did you finish the class?", "Eventually, yes. We went back after thirty minutes."],
          ["Do you have more stories like that?", "Many! When I was a student, I used to work in the lab until midnight."],
        ],
      },
      links: [
        ["Past continuous (Perfect English Grammar)", "https://www.perfect-english-grammar.com/past-continuous.html", "Pasado continuo con ejercicios.", "Gramática"],
        ["Past perfect (Perfect English Grammar)", "https://www.perfect-english-grammar.com/past-perfect.html", "Pasado perfecto con ejercicios.", "Gramática"],
        ["Used to (Perfect English Grammar)", "https://www.perfect-english-grammar.com/used-to.html", "Hábitos del pasado.", "Gramática"],
        ["BBC Drama", "https://www.bbc.co.uk/learningenglish/english/features/drama", "Historias narradas y dramatizadas para estudiantes.", "Escuchar"],
      ],
    },
    /* ---------------- B1·6 ---------------- */
    {
      title: "Opinar en reuniones", en: "I see your point, but...",
      goal: "dar tu opinión, estar de acuerdo o en desacuerdo con cortesía y llegar a acuerdos.",
      focus: "giving opinions, agreeing and disagreeing politely, interrupting, suggestions (why don't we, how about + -ing)",
      grammar: `
<h3>Dar tu opinión</h3>
<ul class="ex">
<li><em>In my opinion, we should focus on the simulation first.</em></li>
<li><em>I think the data is more interesting.</em></li>
<li><em>As I see it, the main problem is time.</em></li>
</ul>
<h3>Acuerdo y desacuerdo con cortesía</h3>
<p>En inglés profesional el desacuerdo se <b>suaviza</b>. Decir «You're wrong» o «No» a secas suena agresivo.</p>
<div class="tbl"><table>
<tr><th>Acuerdo</th><th>Desacuerdo suave</th></tr>
<tr><td><em>I agree with you.</em></td><td><em>I see your point, but…</em></td></tr>
<tr><td><em>That's a good point.</em></td><td><em>I'm not sure about that.</em></td></tr>
<tr><td><em>Exactly.</em></td><td><em>I'm afraid I disagree.</em></td></tr>
<tr><td><em>That makes sense.</em></td><td><em>That's true, but on the other hand…</em></td></tr>
</table></div>
<div class="ojo"><p><del>I am agree.</del> → <em>I agree.</em> «Agree» es verbo, no adjetivo. Y evita la redundancia <del>In my opinion, I think…</del>: usa una u otra.</p></div>
<h3>Interrumpir, aclarar y proponer</h3>
<ul class="ex">
<li><em>Sorry to interrupt, but can I add something?</em></li>
<li><em>What do you mean by "robust"?</em></li>
<li><em>Why don't we test both options?</em> <span class="es">— ¿Por qué no probamos las dos opciones?</span></li>
<li><em>How about meeting again on Friday?</em> <span class="es">(how about + -ing)</span></li>
<li><em>So, to sum up, we agree to…</em></li>
</ul>`,
      sound: {
        t: "Entonación amable",
        tip: "La misma frase puede sonar cortés o cortante según la melodía. Para suavizar, deja la voz <b>subir</b> en la primera parte y bajar suavemente al final: <i>I see your point ↗, but ↘…</i> Una entonación plana suena seca o molesta.",
        w: ["I see your point, but...", "Sorry to interrupt.", "That's a good point.", "I'm afraid I disagree.", "Why don't we try both?"],
      },
      vocab: [
        ["agenda", "orden del día", "First item on the agenda: the conference."],
        ["proposal", "propuesta", "I like your proposal."],
        ["point", "argumento, punto", "That's a good point."],
        ["suggestion", "sugerencia", "Can I make a suggestion?"],
        ["priority", "prioridad", "Our priority is the paper."],
        ["option", "opción", "Let's look at both options."],
        ["compromise", "acuerdo intermedio; ceder", "Let's find a compromise."],
        ["decision", "decisión", "We need to make a decision today."],
        ["agree / disagree", "estar de acuerdo / en desacuerdo", "I agree with Priya."],
        ["tight", "ajustado (plazo)", "The schedule is tight."],
        ["to sum up", "para resumir", "To sum up, we'll present both."],
        ["preliminary", "preliminar", "We have some preliminary data."],
      ],
      phrases: [
        ["In my opinion, we should focus on the simulation first.", "En mi opinión, deberíamos centrarnos primero en la simulación."],
        ["I agree with you.", "Estoy de acuerdo contigo."],
        ["I see your point, but I'm not sure it's the best option.", "Entiendo tu punto, pero no estoy seguro de que sea la mejor opción."],
        ["I'm afraid I disagree.", "Me temo que no estoy de acuerdo."],
        ["Sorry to interrupt, but can I add something?", "Perdón por interrumpir, ¿puedo añadir algo?"],
        ["What do you mean by \"robust\"?", "¿Qué quieres decir con «robusto»?"],
        ["Why don't we test both options?", "¿Por qué no probamos las dos opciones?"],
        ["How about meeting again on Friday?", "¿Qué tal si nos reunimos otra vez el viernes?"],
        ["That's a good point.", "Buena observación."],
        ["So, to sum up, we agree to present both.", "Entonces, para resumir, acordamos presentar las dos."],
      ],
      ex: [
        ["mc", "Forma correcta:", ["I am agree.", "I agree.", "I'm agree with you."], 1, ""],
        ["mc", "Desacuerdo cortés:", ["You're wrong.", "I'm afraid I disagree.", "No, that's bad."], 1, ""],
        ["gap", "How about ___ (meet) on Friday?", ["meeting"], "How about + -ing."],
        ["gap", "Why ___ we try a different approach?", ["don't"], ""],
        ["mc", "«I see your point» significa:", ["Veo tu punto en el mapa", "Entiendo lo que dices"], 1, ""],
        ["gap", "Sorry to ___, but I have a question.", ["interrupt"], ""],
        ["mc", "What do you mean ___ \"stable\"?", ["with", "by", "for"], 1, "What do you mean by…?"],
        ["mc", "Para cerrar una reunión:", ["So, to sum up, …", "So, for resume, …", "So, in resume, …"], 0, "«Resume» en inglés es otra cosa (reanudar; hoja de vida en EE. UU.)."],
        ["order", "Why|don't|we|test|both|options?", "¿Por qué no probamos las dos opciones?"],
        ["tr", "En mi opinión, deberíamos terminar la simulación primero.", ["In my opinion, we should finish the simulation first", "I think we should finish the simulation first", "In my opinion, we should complete the simulation first"], ""],
        ["tr", "Esa es una buena observación.", ["That's a good point", "That is a good point", "Good point"], ""],
      ],
      dialogue: {
        ctx: "Reunión de grupo: deciden qué presentar en un congreso en marzo.",
        lines: [
          ["Sarah", "OK, first item on the agenda: the conference in March. What should we present?", "Bien, primer punto del día: el congreso de marzo. ¿Qué deberíamos presentar?"],
          ["Priya", "In my opinion, we should present the simulation results. They're almost complete.", "En mi opinión, deberíamos presentar los resultados de la simulación. Están casi completos."],
          ["Daniel", "I see your point, but I think the experimental data is more interesting.", "Entiendo tu punto, pero creo que los datos experimentales son más interesantes."],
          ["Priya", "Maybe, but the data isn't ready yet.", "Quizás, pero los datos todavía no están listos."],
          ["Daniel", "That's true. Why don't we present both? The simulation and a preliminary measurement.", "Es cierto. ¿Por qué no presentamos las dos cosas? La simulación y una medición preliminar."],
          ["Mike", "Sorry to interrupt, but the new laser won't arrive until February.", "Perdón por interrumpir, pero el láser nuevo no llega hasta febrero."],
          ["Sarah", "That's a good point, Mike. Daniel, can you get data by mid-February?", "Buena observación, Mike. Daniel, ¿puedes tener datos para mediados de febrero?"],
          ["Daniel", "It's tight, but I think so.", "Está ajustado, pero creo que sí."],
          ["Sarah", "OK. So, to sum up: Priya prepares the simulation, Daniel adds preliminary data, and we review everything on March first.", "Bien. Para resumir: Priya prepara la simulación, Daniel agrega datos preliminares y revisamos todo el primero de marzo."],
          ["Priya", "Sounds good.", "Me parece bien."],
        ],
      },
      mission: {
        who: "Un colega con la opinión contraria",
        role: "Jordan, a colleague in a department meeting who strongly proposes replacing all physical lab sessions with virtual simulations. Defend your position with arguments, but be open to a compromise.",
        scene: "En una reunión de departamento, un colega propone reemplazar todos los laboratorios presenciales de física por simulaciones virtuales. Da tu opinión, discrepa con cortesía y busquen un acuerdo.",
        goals: ["Da tu opinión (In my opinion / I think)", "Discrepa con cortesía (I see your point, but…)", "Haz una propuesta (Why don't we… / How about…)", "Resume el acuerdo final (So, to sum up…)"],
        start: "I think we should replace all the physical lab sessions with virtual simulations. They're cheaper and safer. What do you think?",
        guided: [
          ["We should replace all lab sessions with simulations. What do you think?", "I see your point, but I'm not sure that's the best option for our students."],
          ["Why not? Simulations are cheaper and safer.", "That's true, but in my opinion students need to touch real instruments and deal with real errors."],
          ["So what do you propose?", "Why don't we use simulations to prepare, and then do the real experiment in the lab?"],
          ["That could work.", "Great. So, to sum up, we'll combine simulations and real labs, and try it next semester."],
        ],
      },
      links: [
        ["BBC English at Work", "https://www.bbc.co.uk/learningenglish/english/features/english-at-work", "Episodios sobre reuniones, desacuerdos y negociación.", "Escuchar"],
        ["EnglishClub: Speaking", "https://www.englishclub.com/speaking/", "Frases funcionales para opinar, acordar y discrepar.", "Frases,Hablar"],
        ["Business English Pod (YouTube)", "https://www.youtube.com/@BusinessEnglishPod", "Reuniones y negociaciones reales explicadas.", "Escuchar,Hablar"],
        ["Julian Treasure: How to speak so that people want to listen (TED)", "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen", "Voz, tono y entonación al hablar en público.", "Hablar"],
      ],
    },
  ],
});
