/* Nivel B2 · n = 4 · Hβ 486 nm */
window.QLE_LEVELS = window.QLE_LEVELS || [];
window.QLE_LEVELS.push({
  id: "b2", code: "B2", n: 4, name: "Intermedio alto", nm: 486, line: "Hβ",
  links: [
    ["BBC Learning English · Upper intermediate", "https://www.bbc.co.uk/learningenglish/english/course/upper-intermediate", "Curso gratuito de nivel B2.", "B2"],
    ["BBC English at University", "https://www.bbc.co.uk/learningenglish/english/features/english-at-university", "Inglés académico en situaciones de universidad.", "B1,B2"],
    ["NPR Short Wave (podcast)", "https://www.npr.org/podcasts/510351/short-wave", "Ciencia en 10–15 minutos, en inglés americano natural.", "B2,C1"],
    ["PBS Space Time (YouTube)", "https://www.youtube.com/@pbsspacetime", "Física moderna rigurosa: relatividad, cuántica, cosmología.", "B2,C1"],
  ],
  units: [
    /* ---------------- B2·1 ---------------- */
    {
      title: "Hipótesis y lo que pudo ser", en: "If we had more time, we would...",
      goal: "plantear situaciones hipotéticas, hablar de lo que habría pasado y de lo que desearías.",
      focus: "second, third and mixed conditionals, wish / if only, I'd rather, if I were you",
      grammar: `
<h3>Segundo condicional: hipótesis sobre el presente</h3>
<div class="formula">If + pasado, would + verbo</div>
<ul class="ex">
<li><em>If we had more funding, we would hire another student.</em> <span class="es">— Si tuviéramos más financiación, contrataríamos a otro estudiante.</span></li>
<li><em>If I were you, I'd talk to the committee.</em> <span class="es">— Yo que tú, hablaría con el comité.</span></li>
</ul>
<p>Con <b>if</b> se prefiere <b>were</b> para todas las personas en estilo cuidado: <em>If I were…</em>, <em>If it were…</em></p>
<h3>Tercer condicional: el pasado que no ocurrió</h3>
<div class="formula">If + had + participio, would have + participio</div>
<ul class="ex">
<li><em>If I had known, I would have told you.</em> <span class="es">— Si hubiera sabido, te lo habría dicho.</span></li>
<li><em>If we hadn't changed the filter, we wouldn't have seen the effect.</em></li>
</ul>
<div class="ojo"><p><del>If I would have known…</del> → <em>If I had known…</em> El «would» nunca va en la parte del if.</p></div>
<h3>Condicional mixto: pasado → presente</h3>
<ul class="ex"><li><em>If I had studied English as a child, I would be fluent now.</em> <span class="es">— Si hubiera estudiado inglés de niño, ahora hablaría con fluidez.</span></li></ul>
<h3>wish, if only, I'd rather</h3>
<ul class="ex">
<li><em>I wish I had more time.</em> <span class="es">— Ojalá tuviera más tiempo (presente).</span></li>
<li><em>I wish I had checked the noise floor.</em> <span class="es">— Ojalá hubiera revisado el nivel de ruido (pasado).</span></li>
<li><em>I'd rather work late than come in on Sunday.</em> <span class="es">— Prefiero trabajar tarde que venir el domingo.</span></li>
</ul>`,
      sound: {
        t: "Contracciones en condicionales",
        tip: "En la conversación: <i>I would</i> → <i>I'd</i>; <i>would have</i> → «WUD-əv», casi «wuda»; <i>wouldn't have</i> → «WUD-nt-əv»; <i>If I had known</i> → «if aid NOUN». Entenderlas es la mitad de la batalla.",
        w: ["I would|I'd", "would have", "wouldn't have", "If I'd known", "I would have told you"],
      },
      vocab: [
        ["hypothesis", "hipótesis", "Our hypothesis was wrong."],
        ["assume", "suponer, asumir", "Let's assume the signal is real."],
        ["suppose", "suponer", "Suppose we double the power."],
        ["scenario", "escenario, situación", "In the worst-case scenario, we repeat everything."],
        ["outcome", "resultado", "The outcome was unexpected."],
        ["regret", "arrepentirse; arrepentimiento", "I regret not checking the noise."],
        ["afford", "permitirse (económicamente)", "We can't afford a new camera."],
        ["funding", "financiación", "If we had more funding, we would hire someone."],
        ["feasible", "factible", "Is the project feasible in two years?"],
        ["upper limit", "cota superior", "At least we can set an upper limit."],
        ["negative result", "resultado negativo", "Negative results matter."],
        ["integration time", "tiempo de integración", "I'd increase the integration time."],
      ],
      phrases: [
        ["If we had more funding, we would hire another student.", "Si tuviéramos más financiación, contrataríamos a otro estudiante."],
        ["If I were you, I'd talk to the committee.", "Yo que tú, hablaría con el comité."],
        ["If I had known, I would have told you.", "Si hubiera sabido, te lo habría dicho."],
        ["What would you do if you were in my position?", "¿Qué harías si estuvieras en mi lugar?"],
        ["If we hadn't changed the filter, we wouldn't have seen the effect.", "Si no hubiéramos cambiado el filtro, no habríamos visto el efecto."],
        ["I wish I had more time.", "Ojalá tuviera más tiempo."],
        ["If only I had started earlier!", "¡Si tan solo hubiera empezado antes!"],
        ["Suppose the signal is real. What then?", "Supongamos que la señal es real. ¿Entonces qué?"],
        ["I'd rather work late than come in on Sunday.", "Prefiero trabajar tarde que venir el domingo."],
        ["In an ideal world, we would repeat everything.", "En un mundo ideal, repetiríamos todo."],
      ],
      ex: [
        ["mc", "If I ___ you, I'd accept the offer.", ["am", "were", "would be"], 1, "If I were you = yo que tú."],
        ["gap", "If we had more time, we ___ (repeat) the test.", ["would repeat", "'d repeat"], ""],
        ["mc", "If I had known about the meeting, I ___.", ["would come", "would have come", "will come"], 1, "Tercer condicional."],
        ["gap", "If she ___ the flight, she would have been at the conference. (negativo de miss)", ["hadn't missed", "had not missed"], ""],
        ["mc", "Mixto: If I had studied English as a kid, I ___ fluent now.", ["would be", "would have been", "will be"], 0, "Pasado → consecuencia en el presente."],
        ["gap", "I wish I ___ (have) more time.", ["had"], "Wish + pasado para el presente."],
        ["mc", "I'd rather ___ from home.", ["work", "to work", "working"], 0, "I'd rather + verbo base."],
        ["mc", "«If I would have known» es:", ["correcto", "incorrecto: If I had known"], 1, ""],
        ["order", "What|would|you|do|if|you|were|in|my|position?", "¿Qué harías si estuvieras en mi lugar?"],
        ["tr", "Si hubiera sabido, te habría dicho.", ["If I had known, I would have told you", "If I'd known, I would have told you", "If I'd known, I'd have told you", "Had I known, I would have told you"], ""],
        ["tr", "Si tuviéramos más financiación, contrataríamos a otro estudiante.", ["If we had more funding, we would hire another student", "If we had more funding, we'd hire another student", "If we had more money, we would hire another student", "If we had more money, we'd hire another student"], ""],
      ],
      dialogue: {
        ctx: "Una medición no salió como esperaban. Daniel y Sarah analizan qué habría pasado y qué harán ahora.",
        lines: [
          ["Daniel", "The results aren't what we expected. If we had used the new detector, we would have seen the peak.", "Los resultados no son lo que esperábamos. Si hubiéramos usado el detector nuevo, habríamos visto el pico."],
          ["Sarah", "Maybe. But if we had waited for it, we wouldn't have any data at all.", "Quizás. Pero si lo hubiéramos esperado, no tendríamos ningún dato."],
          ["Daniel", "True. I wish I had checked the noise floor before the run.", "Cierto. Ojalá hubiera revisado el nivel de ruido antes de la medición."],
          ["Sarah", "Don't be too hard on yourself. What would you do differently if you ran it again tomorrow?", "No seas tan duro contigo. ¿Qué harías distinto si la repitieras mañana?"],
          ["Daniel", "I'd increase the integration time and I'd shield the cables.", "Aumentaría el tiempo de integración y blindaría los cables."],
          ["Sarah", "Good. And if the peak still doesn't appear?", "Bien. ¿Y si el pico sigue sin aparecer?"],
          ["Daniel", "Then I'd accept that the effect is smaller than the model predicts.", "Entonces aceptaría que el efecto es menor de lo que predice el modelo."],
          ["Sarah", "That would be a result too. Negative results matter.", "Eso también sería un resultado. Los resultados negativos importan."],
          ["Daniel", "If I were a reviewer, I'd want to see the upper limit.", "Si yo fuera revisor, querría ver la cota superior."],
          ["Sarah", "Exactly. Let's set up the new run for Thursday.", "Exacto. Preparemos la nueva medición para el jueves."],
        ],
      },
      mission: {
        who: "Un amigo filosófico con preguntas hipotéticas",
        role: "Sofia, a friend who loves hypothetical questions: working at any lab in the world, winning the lottery, having studied something other than physics, living in another century. React and share your own answers.",
        scene: "Conversación filosófica de «¿qué harías si…?»: si pudieras trabajar en cualquier laboratorio del mundo, si no hubieras estudiado física, si pudieras cambiar algo de tu pasado…",
        goals: ["Usa el segundo condicional", "Usa el tercer condicional", "Usa un condicional mixto", "Usa wish o if only"],
        start: "Here's a question for you: if you could work at any lab or company in the world, which one would you choose, and why?",
        guided: [
          ["If you could work anywhere, where would you work?", "If I could work anywhere, I'd work at CERN. It would be amazing to see the detectors."],
          ["What if you hadn't studied physics?", "If I hadn't studied physics, I would have studied music."],
          ["Would you be happier now?", "Hmm, if I had studied music, I would probably be poorer but maybe more relaxed!"],
          ["Is there anything you regret?", "I wish I had started learning English earlier. If only I had practiced more as a student!"],
        ],
      },
      links: [
        ["Second conditional (Perfect English Grammar)", "https://www.perfect-english-grammar.com/second-conditional.html", "Hipótesis sobre el presente.", "Gramática"],
        ["Third conditional (Perfect English Grammar)", "https://www.perfect-english-grammar.com/third-conditional.html", "El pasado que no ocurrió.", "Gramática"],
        ["Mixed conditionals (Perfect English Grammar)", "https://www.perfect-english-grammar.com/mixed-conditionals.html", "Combinaciones pasado-presente.", "Gramática"],
        ["BBC Upper intermediate", "https://www.bbc.co.uk/learningenglish/english/course/upper-intermediate", "Lecciones B2 con video.", "Escuchar"],
      ],
    },
    /* ---------------- B2·2 ---------------- */
    {
      title: "Reportar lo que dicen otros", en: "The authors reported that...",
      goal: "resumir lo que dijo un colega o lo que afirma un artículo, con verbos precisos.",
      focus: "reported speech (backshift), reporting verbs (claim, suggest, point out, admit), reported questions and commands, according to",
      grammar: `
<h3>El estilo indirecto: un paso atrás en el tiempo</h3>
<div class="tbl"><table>
<tr><th>Lo que dijo</th><th>Lo reportas</th></tr>
<tr><td><em>"I'm busy."</em></td><td><em>She said she was busy.</em></td></tr>
<tr><td><em>"I will send it."</em></td><td><em>He said he would send it.</em></td></tr>
<tr><td><em>"We have finished."</em></td><td><em>They said they had finished.</em></td></tr>
<tr><td><em>"We saw the drift."</em></td><td><em>She said they had seen the drift.</em></td></tr>
</table></div>
<p>Si lo dicho sigue siendo cierto, se puede mantener el tiempo: <em>She said the effect is thermal.</em></p>
<h3>say o tell</h3>
<p><b>tell</b> lleva persona; <b>say</b> no (o lleva «to»): <em>She told me…</em> · <em>She said…</em> · <em>She said to me…</em></p>
<div class="ojo"><p><del>She said me that…</del> → <em>She told me that…</em></p></div>
<h3>Preguntas y órdenes reportadas</h3>
<ul class="ex">
<li><em>They asked whether we had tried a different wavelength.</em> <span class="es">(sí/no → if / whether)</span></li>
<li><em>He asked me where I worked.</em> <span class="es">(orden de afirmación: <del>where did I work</del>)</span></li>
<li><em>She told me to check the alignment.</em> · <em>He asked us not to touch it.</em></li>
</ul>
<h3>Verbos para reportar con precisión</h3>
<p><em>claim</em> (afirmar, sin garantía), <em>argue</em> (sostener), <em>point out</em> (señalar), <em>suggest</em> (sugerir), <em>admit</em> (admitir), <em>deny</em> (negar), <em>confirm</em>, <em>report</em>, <em>find</em>, <em>show</em>.</p>
<ul class="ex">
<li><em>She suggested using a lock-in amplifier.</em> <span class="es">(suggest + -ing, <del>suggested me to use</del>)</span></li>
<li><em>According to the paper, the effect is temperature-dependent.</em></li>
</ul>
<div class="tip"><p>En artículos científicos, para citar trabajos se suele usar presente: <em>Smith et al. (2020) show that…</em>, o pasado para el hallazgo concreto: <em>…reported a threefold increase.</em></p></div>`,
      sound: {
        t: "said, says, asked",
        tip: "<i>said</i> suena «sed» (no «seid») y <i>says</i> suena «sez». <i>asked</i> tiene tres consonantes seguidas: «æskt»; no digas «as-ked». <i>explained</i> termina en /d/: «ik-SPLEIND».",
        w: ["said", "says", "told", "asked", "explained", "suggested"],
      },
      vocab: [
        ["claim", "afirmar (sin garantía)", "The authors claim their method is faster."],
        ["argue", "sostener, argumentar", "She argues that the model is incomplete."],
        ["point out", "señalar", "He pointed out a mistake in Table 2."],
        ["suggest", "sugerir", "She suggested using a lock-in amplifier."],
        ["admit / deny", "admitir / negar", "He admitted he hadn't checked it."],
        ["confirm", "confirmar", "They confirmed our results."],
        ["mention", "mencionar", "Did she mention the deadline?"],
        ["according to", "según", "According to the paper, the effect is small."],
        ["findings", "hallazgos, resultados", "Their findings are consistent with ours."],
        ["evidence", "evidencia (incontable)", "There is strong evidence for this."],
        ["et al.", "y colaboradores (en citas)", "Chen et al. reported a similar effect."],
        ["acknowledge", "reconocer (dar crédito)", "Please acknowledge our contribution."],
      ],
      phrases: [
        ["She said she would send the data on Monday.", "Dijo que enviaría los datos el lunes."],
        ["He told me to check the alignment again.", "Me dijo que revisara otra vez la alineación."],
        ["They asked whether we had tried a different wavelength.", "Preguntaron si habíamos probado otra longitud de onda."],
        ["According to the paper, the effect is temperature-dependent.", "Según el artículo, el efecto depende de la temperatura."],
        ["The authors claim that their method is ten times faster.", "Los autores afirman que su método es diez veces más rápido."],
        ["Brooks pointed out that the error bars were too small.", "Brooks señaló que las barras de error eran demasiado pequeñas."],
        ["She suggested using a lock-in amplifier.", "Sugirió usar un amplificador lock-in."],
        ["He admitted that he hadn't checked the calibration.", "Admitió que no había revisado la calibración."],
        ["The reviewer asked us to clarify Figure 3.", "El revisor nos pidió aclarar la Figura 3."],
        ["As far as I know, nobody has measured it yet.", "Hasta donde sé, nadie lo ha medido todavía."],
      ],
      ex: [
        ["mc", "She ___ me that the meeting was canceled.", ["said", "told", "explained"], 1, "Tell + persona."],
        ["gap", "\"I will send it tomorrow.\" → He said he ___ send it the next day.", ["would"], "will → would."],
        ["mc", "He asked me where ___.", ["did I work", "I worked", "do I work"], 1, "Pregunta reportada: orden de afirmación."],
        ["gap", "They asked ___ we had tried another laser. (si)", ["if", "whether"], ""],
        ["mc", "She suggested ___ a lock-in amplifier.", ["to use", "using", "me to use"], 1, "Suggest + -ing."],
        ["gap", "\"Don't touch it.\" → She told me ___ touch it.", ["not to"], ""],
        ["gap", "\"We have finished.\" → They said they ___ finished.", ["had"], "have → had."],
        ["mc", "Para una afirmación que no garantizas:", ["The authors claim that…", "The authors prove that…"], 0, ""],
        ["order", "The|reviewer|asked|us|to|clarify|Figure 3.", "El revisor nos pidió aclarar la Figura 3."],
        ["tr", "Me dijo que revisara la alineación.", ["He told me to check the alignment", "She told me to check the alignment", "He told me to review the alignment", "She told me to review the alignment", "He told me to check the alignment again", "She told me to check the alignment again"], ""],
        ["tr", "Según el artículo, el efecto depende de la temperatura.", ["According to the paper, the effect depends on temperature", "According to the paper, the effect depends on the temperature", "According to the article, the effect depends on temperature", "According to the article, the effect depends on the temperature", "According to the paper, the effect is temperature-dependent", "According to the paper, the effect is temperature dependent"], ""],
      ],
      dialogue: {
        ctx: "Daniel le cuenta a Sarah su llamada con la doctora Weber, de un grupo de Múnich que trabaja en algo parecido.",
        lines: [
          ["Sarah", "Did you talk to Dr. Weber from the Munich group?", "¿Hablaste con la doctora Weber, del grupo de Múnich?"],
          ["Daniel", "Yes, this morning. She said they had seen the same drift in their setup.", "Sí, esta mañana. Dijo que habían visto la misma deriva en su montaje."],
          ["Sarah", "Really? Did she explain what was causing it?", "¿En serio? ¿Explicó qué la causaba?"],
          ["Daniel", "She told me it was probably thermal. She suggested putting the fiber in a temperature-controlled box.", "Me dijo que probablemente era térmica. Sugirió poner la fibra en una caja con control de temperatura."],
          ["Sarah", "That's what we thought. Did she mention the timeline for their paper?", "Es lo que pensábamos. ¿Mencionó los plazos de su artículo?"],
          ["Daniel", "She said they would submit it next month. And she asked whether we wanted to compare data before that.", "Dijo que lo enviarían el mes que viene. Y preguntó si queríamos comparar datos antes."],
          ["Sarah", "Interesting. What did you tell her?", "Interesante. ¿Qué le dijiste?"],
          ["Daniel", "I told her I'd need to check with you first.", "Le dije que tenía que consultarlo contigo primero."],
          ["Sarah", "Good call. Tell her we're happy to share, as long as both groups are acknowledged.", "Bien hecho. Dile que con gusto compartimos, siempre que se reconozca a ambos grupos."],
          ["Daniel", "I'll email her this afternoon.", "Le escribo esta tarde."],
        ],
      },
      mission: {
        who: "Tu jefa, que quiere un resumen",
        role: "Sarah, the learner's supervisor, asking the learner to summarize a paper they read (real or invented) or a conversation with a colleague. Ask what the authors claimed, what they found, what others said about it.",
        scene: "Resume para tu jefa lo que dice un artículo que leíste (puede ser real) o lo que te dijo un colega.",
        goals: ["Usa tres verbos de reporte distintos de say", "Reporta una pregunta (asked if / whether…)", "Reporta una orden o pedido (told me to…)", "Usa according to"],
        start: "So, you read that new paper on quantum sensors, right? What did the authors say? What did they find?",
        guided: [
          ["What did the authors say?", "They claim that their sensor is ten times more sensitive than previous ones."],
          ["Do they have evidence?", "According to the paper, they tested it for six months. They found that it was very stable."],
          ["Any weaknesses?", "They admitted that it only works at very low temperatures."],
          ["Did you talk to anyone about it?", "Yes, I asked Priya whether she had read it. She told me to look at the supplementary material."],
        ],
      },
      links: [
        ["Reported speech (Perfect English Grammar)", "https://www.perfect-english-grammar.com/reported-speech.html", "Reglas y ejercicios del estilo indirecto.", "Gramática"],
        ["Reported speech (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/reported-speech", "Referencia completa con verbos de reporte.", "Gramática"],
        ["Academic Phrasebank: referirse a fuentes", "https://www.phrasebank.manchester.ac.uk/referring-to-sources/", "Cómo citar y reportar trabajos de otros en inglés académico.", "Frases,Escritura"],
        ["Quanta Magazine", "https://www.quantamagazine.org/", "Periodismo científico excelente: modelo de cómo se reporta la investigación.", "Física,Leer"],
      ],
    },
    /* ---------------- B2·3 ---------------- */
    {
      title: "Precisión con relativos", en: "The laser, which we bought last year, ...",
      goal: "describir equipos, personas y lugares con precisión usando oraciones de relativo.",
      focus: "defining and non-defining relative clauses (who, which, that, whose, where), ', which means...', reduced relatives",
      grammar: `
<h3>Relativas especificativas: ¿cuál exactamente?</h3>
<p>Identifican de qué hablamos. Sin comas. Puedes usar <b>that</b>:</p>
<ul class="ex">
<li><em>The student who built this setup graduated last year.</em></li>
<li><em>The paper that you sent me is really useful.</em></li>
<li><em>This is the lab where we test the detectors.</em></li>
<li><em>She's the professor whose book we use in class.</em> <span class="es">(whose = cuyo)</span></li>
</ul>
<p>Si el relativo es el <b>objeto</b>, puedes omitirlo: <em>The paper (that) you sent me…</em> · <em>Is this the cable (that) you were looking for?</em></p>
<h3>Relativas explicativas: información extra</h3>
<p>Van <b>entre comas</b>, y nunca con <b>that</b>:</p>
<ul class="ex">
<li><em>The laser, which we bought in 2020, still works perfectly.</em></li>
<li><em>Priya, who is finishing her PhD, built most of this.</em></li>
</ul>
<div class="ojo"><p><del>The laser, that we bought…</del> → <em>The laser, which we bought…</em> · <del>The person who I talked</del> → <em>The person I talked to</em></p></div>
<h3>«…, which means that…»</h3>
<p><b>which</b> puede referirse a <b>toda la oración anterior</b>: <em>The noise dropped by 50%, which means the shielding works.</em> <span class="es">— …lo que significa que el blindaje funciona.</span></p>
<h3>Relativas reducidas</h3>
<p><em>The data collected last week look consistent.</em> = the data <i>that were</i> collected. Muy común en textos científicos.</p>
<div class="tip"><p>Abreviaturas latinas que verás en papers: <b>i.e.</b> = <em>that is</em> (es decir), <b>e.g.</b> = <em>for example</em>, <b>et al.</b> = <em>and colleagues</em>, <b>cf.</b> = <em>compare</em>. Al hablar, se suele decir su equivalente en inglés.</p></div>`,
      sound: {
        t: "Las comas se oyen",
        tip: "En una relativa explicativa, las comas son <b>pausas cortas</b> y la información extra se dice un poco más bajo y rápido, como un paréntesis: <i>The laser | which we bought in 2020 | still works.</i> En una especificativa no hay pausa.",
        w: ["The laser, which we bought in 2020, still works.", "The student who built this setup graduated.", "The noise dropped, which means the shielding works.", "That's the lab where we test the detectors."],
      },
      vocab: [
        ["device", "dispositivo", "This device measures pressure."],
        ["setup", "montaje experimental", "Who built this setup?"],
        ["component", "componente", "Each component was tested."],
        ["feature", "característica", "The main feature is its low noise."],
        ["property", "propiedad", "Graphene has remarkable properties."],
        ["whose", "cuyo, cuya", "She's the one whose paper we read."],
        ["namely", "a saber, es decir", "One problem remains, namely the drift."],
        ["the former / the latter", "el primero / el segundo (de dos)", "We tested Si and Ge; the latter performed better."],
        ["respectively", "respectivamente", "The values were 3 and 5 K, respectively."],
        ["i.e. / e.g.", "es decir / por ejemplo", "Use a noble gas, e.g. argon."],
        ["optical table", "mesa óptica", "The optical table floats on air."],
        ["enclosure", "caja, cerramiento", "The enclosure reduced the drift."],
      ],
      phrases: [
        ["The student who built this setup graduated last year.", "El estudiante que construyó este montaje se graduó el año pasado."],
        ["This is the lab where we test the detectors.", "Este es el laboratorio donde probamos los detectores."],
        ["The paper that you sent me is really useful.", "El artículo que me enviaste es muy útil."],
        ["The laser, which we bought in 2020, still works perfectly.", "El láser, que compramos en 2020, todavía funciona perfectamente."],
        ["The noise dropped by 50%, which means the shielding works.", "El ruido bajó un 50 %, lo que significa que el blindaje funciona."],
        ["That's the professor whose book we use in class.", "Ese es el profesor cuyo libro usamos en clase."],
        ["The data collected last week look consistent.", "Los datos tomados la semana pasada parecen consistentes."],
        ["Is this the cable you were looking for?", "¿Es este el cable que buscabas?"],
        ["The main advantage, namely the low noise, comes from the cooling.", "La principal ventaja, a saber, el bajo ruido, viene del enfriamiento."],
        ["We tested silicon and germanium; the former performed better.", "Probamos silicio y germanio; el primero funcionó mejor."],
      ],
      ex: [
        ["mc", "The engineer ___ designed the chip is here.", ["who", "which", "whose"], 0, "Personas: who (o that)."],
        ["mc", "The laser, ___ we bought in 2020, still works.", ["that", "which", "what"], 1, "Explicativa (con comas): which, nunca that."],
        ["gap", "That's the lab ___ we test the detectors.", ["where"], ""],
        ["gap", "She's the researcher ___ group published the paper.", ["whose"], "Whose = cuyo."],
        ["mc", "¿En cuál se puede omitir el relativo?", ["The man who called you is here.", "The paper that you sent me is useful."], 1, "Se omite cuando es objeto."],
        ["mc", "En «…, which means that…», «which» se refiere a:", ["el último sustantivo", "toda la oración anterior"], 1, ""],
        ["gap", "Is this the cable you were looking ___?", ["for"], "Look for: la preposición queda al final."],
        ["mc", "«e.g.» significa:", ["es decir", "por ejemplo", "etcétera"], 1, ""],
        ["order", "The|data|collected|last week|look|consistent.", "Los datos tomados la semana pasada parecen consistentes."],
        ["tr", "Este es el laboratorio donde trabajo.", ["This is the lab where I work", "This is the laboratory where I work", "This is the lab I work in", "This is the lab that I work in", "This is the lab in which I work"], ""],
        ["tr", "El ruido bajó un 50 %, lo que significa que el blindaje funciona.", ["The noise dropped by 50%, which means that the shielding works", "The noise dropped by 50%, which means the shielding works", "The noise decreased by 50%, which means that the shielding works", "The noise decreased by 50%, which means the shielding works", "The noise went down by 50%, which means the shielding works", "The noise fell by 50%, which means the shielding works"], ""],
      ],
      dialogue: {
        ctx: "Daniel guía una visita al laboratorio para estudiantes de secundaria.",
        lines: [
          ["Daniel", "Welcome, everyone. This is the room where we do most of our measurements.", "Bienvenidos. Esta es la sala donde hacemos la mayoría de nuestras mediciones."],
          ["Student", "What's that big table?", "¿Qué es esa mesa grande?"],
          ["Daniel", "That's an optical table, which floats on air to isolate vibrations.", "Es una mesa óptica, que flota sobre aire para aislar las vibraciones."],
          ["Student", "And the box that's covered in foil?", "¿Y la caja que está cubierta de papel aluminio?"],
          ["Daniel", "That's the vacuum chamber, where we place the samples. The foil, which looks a bit funny, helps it heat evenly.", "Es la cámara de vacío, donde colocamos las muestras. El aluminio, que se ve un poco raro, ayuda a que se caliente de forma pareja."],
          ["Student", "Who built all this?", "¿Quién construyó todo esto?"],
          ["Daniel", "Most of it was built by Priya, who's finishing her PhD this year, and by Mike, whose electronics skills are amazing.", "La mayor parte la construyeron Priya, que termina su doctorado este año, y Mike, cuyas habilidades en electrónica son increíbles."],
          ["Student", "Is that the laser you use for the experiments?", "¿Ese es el láser que usan para los experimentos?"],
          ["Daniel", "Yes, the one on the left. The one on the right is older; we use it for alignment.", "Sí, el de la izquierda. El de la derecha es más viejo; lo usamos para alinear."],
          ["Student", "What's the most important thing you've learned here?", "¿Qué es lo más importante que has aprendido aquí?"],
          ["Daniel", "That the problem you're looking for is usually in the last place you check. Usually a cable.", "Que el problema que buscas suele estar en el último lugar donde miras. Normalmente, un cable."],
        ],
      },
      mission: {
        who: "Un periodista científico que visita tu trabajo",
        role: "Nora, a science journalist visiting the learner's workplace (lab, university or company) and asking for precise descriptions of the place, the equipment and the people.",
        scene: "Un periodista científico visita tu lugar de trabajo. Descríbelo con precisión usando oraciones de relativo.",
        goals: ["Usa una relativa especificativa (who / that)", "Usa una relativa explicativa con comas (which / who)", "Usa whose o where", "Usa «…, which means (that)…»"],
        start: "Thanks for having me! Can you describe the place where you work and the equipment you use?",
        guided: [
          ["Can you describe the place where you work?", "I work in a building that was built in the 1970s. It's the place where all the physics labs are."],
          ["What's the most important equipment?", "The spectrometer, which we bought five years ago, is the one we use most."],
          ["Who do you work with?", "I work with a colleague whose research is on solar cells."],
          ["Any recent achievement?", "Our students built a new setup last year, which means we can now do more experiments."],
        ],
      },
      links: [
        ["Relative clauses (Perfect English Grammar)", "https://www.perfect-english-grammar.com/relative-clauses.html", "Especificativas y explicativas, con ejercicios.", "Gramática"],
        ["Relative clauses (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/relative-clauses", "Referencia completa.", "Gramática"],
        ["Physics World", "https://physicsworld.com/", "Noticias de física del Institute of Physics: mucha descripción precisa de equipos.", "Física,Leer"],
        ["Oxford Learner's Dictionaries", "https://www.oxfordlearnersdictionaries.com/", "Diccionario para estudiantes con ejemplos y audio.", "Frases"],
      ],
    },
    /* ---------------- B2·4 ---------------- */
    {
      title: "Describir datos y gráficas", en: "The signal peaks at 5 K",
      goal: "presentar una gráfica: ejes, tendencias, valores, aproximaciones y valores atípicos.",
      focus: "describing trends (rise, drop, peak, level off, fluctuate), adverbs (sharply, steadily), prepositions (by/to/from), approximations, describing figures",
      grammar: `
<h3>Verbos de tendencia</h3>
<div class="tbl"><table>
<tr><th>Sube</th><th>Baja</th><th>Otros</th></tr>
<tr><td><em>increase, rise, grow, climb</em></td><td><em>decrease, fall, drop, decline</em></td><td><em>remain stable, level off, plateau, fluctuate, peak, reach a minimum</em></td></tr>
</table></div>
<p>Con adverbios: <em>sharply</em> (bruscamente), <em>dramatically</em>, <em>steadily</em> (de forma constante), <em>gradually</em>, <em>slightly</em> (ligeramente).</p>
<ul class="ex">
<li><em>The resistance drops sharply below 90 kelvin.</em></li>
<li><em>The curve peaks at around 5 kelvin and then levels off.</em></li>
</ul>
<h3>Las preposiciones importan</h3>
<ul class="ex">
<li><em>The efficiency rose by 6%.</em> <span class="es">— by = la diferencia</span></li>
<li><em>The efficiency rose to 18%.</em> <span class="es">— to = el valor final</span></li>
<li><em>It rose from 12% to 18%.</em></li>
<li><em>There was an increase of 6%.</em> <span class="es">(con el sustantivo: of)</span></li>
</ul>
<div class="ojo"><p><del>It increased in 20%.</del> → <em>It increased by 20%.</em></p></div>
<h3>Presentar una figura</h3>
<ul class="ex">
<li><em>The x-axis shows time, and the y-axis shows voltage.</em></li>
<li><em>Voltage is plotted against time.</em></li>
<li><em>As shown in Figure 2, the signal increases linearly with power.</em></li>
<li><em>The error bars represent one standard deviation.</em></li>
<li><em>This point is an outlier.</em> <span class="es">— Este punto es un valor atípico.</span></li>
</ul>
<h3>Aproximar</h3>
<p><em>roughly</em>, <em>approximately</em>, <em>about</em>, <em>nearly</em>, <em>just under / just over</em>, <em>of the order of</em>, <em>an order of magnitude larger</em>.</p>`,
      sound: {
        t: "Misma palabra, distinto acento: sustantivo o verbo",
        tip: "Muchas palabras de dos sílabas se acentúan en la <b>primera</b> como sustantivo y en la <b>segunda</b> como verbo: <i>an INcrease / to inCREASE</i>, <i>a REcord / to reCORD</i>, <i>a DEcrease / to deCREASE</i>. Al describir gráficas las usarás constantemente.",
        w: ["an increase|to increase", "a record|to record", "a decrease|to decrease", "a present|to present", "an object|to object", "a contrast|to contrast"],
      },
      vocab: [
        ["trend", "tendencia", "There's a clear upward trend."],
        ["rise / drop", "subir / caer", "The signal drops below 20 K."],
        ["peak", "pico; alcanzar el máximo", "The curve peaks at 5 K."],
        ["level off", "estabilizarse", "The temperature levels off after an hour."],
        ["fluctuate", "fluctuar", "The pressure fluctuates slightly."],
        ["steadily", "de forma constante", "It increases steadily with time."],
        ["sharply", "bruscamente", "The resistance drops sharply."],
        ["axis (axes)", "eje (ejes)", "The y-axis shows voltage."],
        ["plotted against", "graficado en función de", "Current is plotted against voltage."],
        ["outlier", "valor atípico", "That point looks like an outlier."],
        ["error bar", "barra de error", "The error bars are too small."],
        ["fit", "ajuste; ajustarse", "The data fit well to an exponential."],
      ],
      phrases: [
        ["As you can see in this graph, the signal increases linearly with power.", "Como se ve en esta gráfica, la señal aumenta linealmente con la potencia."],
        ["The resistance drops sharply below 90 kelvin.", "La resistencia cae bruscamente por debajo de 90 kelvin."],
        ["The curve peaks at around 5 kelvin and then levels off.", "La curva alcanza un máximo cerca de 5 kelvin y luego se estabiliza."],
        ["The efficiency rose from 12% to 18%.", "La eficiencia subió del 12 % al 18 %."],
        ["The error bars represent one standard deviation.", "Las barras de error representan una desviación estándar."],
        ["The x-axis shows time, and the y-axis shows voltage.", "El eje x muestra el tiempo y el eje y, el voltaje."],
        ["This point is an outlier; we think it's a measurement error.", "Este punto es atípico; creemos que es un error de medición."],
        ["The data fit well to an exponential decay.", "Los datos se ajustan bien a un decaimiento exponencial."],
        ["It's roughly an order of magnitude larger than expected.", "Es aproximadamente un orden de magnitud mayor de lo esperado."],
        ["There's a slight dip at 300 nanometers.", "Hay una pequeña caída en 300 nanómetros."],
      ],
      ex: [
        ["mc", "The price rose ___ 20%. (diferencia)", ["in", "by", "of"], 1, "By = la diferencia."],
        ["mc", "Sales rose ___ 80 units. (valor final)", ["by", "to", "at"], 1, "To = el valor final."],
        ["gap", "The resistance drops ___ below 90 K. (bruscamente)", ["sharply", "dramatically", "abruptly", "suddenly"], ""],
        ["mc", "«Level off» significa:", ["cae de golpe", "se estabiliza después de cambiar", "oscila"], 1, ""],
        ["gap", "The error ___ represent one standard deviation.", ["bars"], ""],
        ["mc", "Voltage is plotted ___ time.", ["against", "with", "in"], 0, "Plotted against = graficado en función de."],
        ["gap", "The curve ___ at 5 K. (alcanza el máximo)", ["peaks"], ""],
        ["mc", "Acento del verbo «increase»:", ["INcrease", "inCREASE"], 1, "Verbo: acento en la segunda sílaba."],
        ["order", "The|data|fit|well|to|an|exponential|decay.", "Los datos se ajustan bien a un decaimiento exponencial."],
        ["tr", "La eficiencia aumentó del 12 % al 18 %.", ["The efficiency increased from 12% to 18%", "The efficiency rose from 12% to 18%", "Efficiency increased from 12% to 18%", "Efficiency rose from 12% to 18%", "The efficiency went up from 12% to 18%", "Efficiency went up from 12% to 18%"], ""],
        ["tr", "Como se ve en la Figura 2, la señal aumenta linealmente.", ["As shown in Figure 2, the signal increases linearly", "As you can see in Figure 2, the signal increases linearly", "As can be seen in Figure 2, the signal increases linearly", "As seen in Figure 2, the signal increases linearly", "As we can see in Figure 2, the signal increases linearly"], ""],
      ],
      dialogue: {
        ctx: "Reunión de grupo: Daniel presenta su gráfica principal.",
        lines: [
          ["Daniel", "This plot shows the signal as a function of temperature.", "Esta gráfica muestra la señal en función de la temperatura."],
          ["Sarah", "What are the units on the y-axis?", "¿Cuáles son las unidades del eje y?"],
          ["Daniel", "Microvolts. As you can see, the signal stays roughly constant down to 20 kelvin.", "Microvoltios. Como ven, la señal se mantiene aproximadamente constante hasta 20 kelvin."],
          ["Priya", "And then?", "¿Y luego?"],
          ["Daniel", "Below 20 kelvin, it rises sharply and peaks at around 5 kelvin.", "Por debajo de 20 kelvin, sube bruscamente y alcanza un máximo cerca de 5 kelvin."],
          ["Sarah", "How big is the increase?", "¿De qué tamaño es el aumento?"],
          ["Daniel", "It goes from about 2 to 18 microvolts, so almost an order of magnitude.", "Va de unos 2 a 18 microvoltios: casi un orden de magnitud."],
          ["Priya", "What about that point at 12 kelvin? It looks like an outlier.", "¿Y ese punto en 12 kelvin? Parece un valor atípico."],
          ["Daniel", "Yes, I think the temperature wasn't stable during that measurement. I'll repeat it.", "Sí, creo que la temperatura no estaba estable durante esa medición. La repetiré."],
          ["Sarah", "Good. And the error bars?", "Bien. ¿Y las barras de error?"],
          ["Daniel", "They show one standard deviation from ten repeated measurements.", "Muestran una desviación estándar de diez mediciones repetidas."],
          ["Sarah", "Nice work. This is the plot for the conference.", "Buen trabajo. Esta es la gráfica para el congreso."],
        ],
      },
      mission: {
        who: "Un miembro del comité en la revisión de tu proyecto",
        role: "Dr. Patel, a committee member at a project review. Ask the learner to walk you through their main figure (the learner invents or uses real data: temperature vs time, I-V curve, student grades vs hours of study...). Ask about axes, units, trends, error bars and outliers.",
        scene: "Describe una gráfica de datos (real de tu trabajo o inventada). El comité te hará preguntas.",
        goals: ["Explica los ejes y las unidades", "Usa dos verbos de tendencia con adverbio", "Usa by, to o from…to con un número", "Explica un valor atípico o las barras de error"],
        start: "Please walk me through your main figure. What does it show?",
        guided: [
          ["What does your main figure show?", "It shows the temperature of the sample plotted against time."],
          ["What happens at the beginning?", "At first, the temperature rises steadily from 20 to 80 degrees."],
          ["And after that?", "After about ten minutes, it levels off at roughly 80 degrees."],
          ["What's that strange point?", "That's an outlier. The sensor moved during that measurement. The error bars show one standard deviation."],
        ],
      },
      links: [
        ["Academic Phrasebank: describir tendencias", "https://www.phrasebank.manchester.ac.uk/describing-trends/", "Vocabulario exacto para gráficas y tendencias.", "Frases,Escritura"],
        ["Academic Phrasebank: describir cantidades", "https://www.phrasebank.manchester.ac.uk/describing-quantities/", "Proporciones, aproximaciones y cifras.", "Frases,Escritura"],
        ["3Blue1Brown (YouTube)", "https://www.youtube.com/@3blue1brown", "Matemáticas visuales: aprende a hablar de curvas, ejes y funciones.", "Física"],
        ["BBC English at University", "https://www.bbc.co.uk/learningenglish/english/features/english-at-university", "Presentaciones y seminarios en contexto universitario.", "Escuchar"],
      ],
    },
    /* ---------------- B2·5 ---------------- */
    {
      title: "Phrasal verbs esenciales", en: "Let's figure it out",
      goal: "usar con naturalidad los phrasal verbs más frecuentes del trabajo técnico y científico.",
      focus: "phrasal verbs: separable vs inseparable, pronoun position; carry out, set up, figure out, come up with, point out, turn out, rule out, look into, go over, run out of, put off, follow up",
      grammar: `
<h3>¿Qué es un phrasal verb?</h3>
<p>Verbo + partícula (up, out, off, into…) con un significado que a menudo no se deduce de las partes: <em>figure out</em> = descifrar, <em>turn out</em> = resultar. Los nativos los usan todo el tiempo al hablar.</p>
<h3>Separables e inseparables</h3>
<p>Muchos son <b>separables</b>: el objeto puede ir en medio o al final… <b>pero si es un pronombre, va en medio</b>:</p>
<ul class="ex">
<li><em>Turn off the laser.</em> = <em>Turn the laser off.</em></li>
<li><em>Turn it off.</em> <span class="es">(<del>Turn off it</del>)</span></li>
<li><em>Set it up for tomorrow.</em></li>
</ul>
<p>Otros son <b>inseparables</b>: <em>look into it</em>, <em>deal with it</em>, <em>run out of it</em>.</p>
<h3>Los doce del laboratorio</h3>
<div class="tbl"><table>
<tr><th>Phrasal verb</th><th>Significado</th><th>Equivalente formal</th></tr>
<tr><td>carry out</td><td>llevar a cabo</td><td>perform, conduct</td></tr>
<tr><td>set up</td><td>montar, preparar</td><td>assemble, establish</td></tr>
<tr><td>figure out</td><td>descifrar, entender</td><td>determine</td></tr>
<tr><td>find out</td><td>averiguar</td><td>discover</td></tr>
<tr><td>come up with</td><td>idear, proponer</td><td>propose, devise</td></tr>
<tr><td>point out</td><td>señalar</td><td>note, indicate</td></tr>
<tr><td>turn out</td><td>resultar</td><td>prove to be</td></tr>
<tr><td>rule out</td><td>descartar</td><td>exclude</td></tr>
<tr><td>look into</td><td>investigar</td><td>investigate</td></tr>
<tr><td>go over</td><td>repasar, revisar</td><td>review</td></tr>
<tr><td>run out of</td><td>quedarse sin</td><td>exhaust</td></tr>
<tr><td>put off</td><td>posponer</td><td>postpone</td></tr>
</table></div>
<div class="tip"><p>Al <b>hablar</b>, usa el phrasal verb (suena natural). Al <b>escribir</b> un artículo, prefiere el verbo formal: <em>We carried out</em> → <em>We performed</em>; <em>find out</em> → <em>determine</em>.</p></div>`,
      sound: {
        t: "Phrasal verbs encadenados",
        tip: "Con pronombre, todo se une en un bloque con acento en la partícula: <i>figure_it_OUT</i> suena «FI-gyə-ri-DAUT» (en EE. UU. la t entre vocales suena como una r suave), <i>set_it_UP</i> «se-di-DAP», <i>turn_it_OFF</i> «tur-ni-DOF».",
        w: ["figure it out", "set it up", "turn it off", "look into it", "point it out", "rule it out"],
      },
      vocab: [
        ["carry out", "llevar a cabo", "We carried out twenty measurements."],
        ["set up", "montar, preparar", "Can you set up the experiment?"],
        ["figure out", "descifrar, entender", "We need to figure out why."],
        ["come up with", "idear, proponer", "She came up with a great idea."],
        ["point out", "señalar", "He pointed out an error."],
        ["turn out", "resultar", "It turned out to be a loose connector."],
        ["rule out", "descartar", "Let's rule out the software first."],
        ["look into", "investigar", "I'll look into it."],
        ["go over", "repasar", "Let's go over the results."],
        ["run out of", "quedarse sin", "We've run out of liquid nitrogen."],
        ["put off", "posponer", "We had to put off the measurement."],
        ["follow up", "hacer seguimiento", "I'll follow up with an email."],
      ],
      phrases: [
        ["We need to figure out why the signal drops.", "Tenemos que descifrar por qué cae la señal."],
        ["Can you set up the experiment for tomorrow?", "¿Puedes montar el experimento para mañana?"],
        ["We carried out twenty measurements.", "Llevamos a cabo veinte mediciones."],
        ["She came up with a brilliant idea.", "Se le ocurrió una idea brillante."],
        ["Let's rule out the software first.", "Descartemos primero el software."],
        ["I'll look into it and get back to you.", "Lo investigo y te respondo."],
        ["We've run out of liquid nitrogen.", "Nos quedamos sin nitrógeno líquido."],
        ["Let's go over the results before the meeting.", "Repasemos los resultados antes de la reunión."],
        ["I'll follow up with an email.", "Haré seguimiento con un correo."],
        ["It turned out to be a loose connector.", "Resultó ser un conector flojo."],
      ],
      ex: [
        ["mc", "The laser is on. Please turn ___.", ["off it", "it off"], 1, "Con pronombre, va en medio."],
        ["mc", "We've run ___ of helium.", ["out", "off", "away"], 0, "Run out of = quedarse sin."],
        ["gap", "I'll look ___ it and get back to you.", ["into"], ""],
        ["gap", "She came up ___ a great idea.", ["with"], ""],
        ["mc", "«Rule out» significa:", ["descartar", "establecer una regla", "medir con regla"], 0, ""],
        ["mc", "Equivalente formal de «carry out» en un artículo:", ["perform", "carry", "do up"], 0, ""],
        ["gap", "Let's ___ over the slides before the talk. (repasar)", ["go"], ""],
        ["gap", "It turned ___ to be a software bug.", ["out"], ""],
        ["order", "We|need|to|figure|out|why.", "Tenemos que descifrar por qué."],
        ["tr", "Tenemos que averiguar qué está causando el ruido.", ["We need to figure out what is causing the noise", "We have to figure out what is causing the noise", "We need to find out what is causing the noise", "We have to find out what is causing the noise", "We must figure out what is causing the noise"], ""],
        ["tr", "Pospusimos la reunión hasta el lunes.", ["We put off the meeting until Monday", "We put the meeting off until Monday", "We postponed the meeting until Monday", "We postponed the meeting to Monday", "We put off the meeting to Monday", "We moved the meeting to Monday", "We pushed the meeting to Monday"], ""],
      ],
      dialogue: {
        ctx: "El criostato no enfría. Mike y Daniel buscan la causa.",
        lines: [
          ["Mike", "Bad news. The cryostat won't cool down below 50 kelvin.", "Malas noticias. El criostato no baja de 50 kelvin."],
          ["Daniel", "Did we run out of helium?", "¿Nos quedamos sin helio?"],
          ["Mike", "No, I checked. The tank is almost full.", "No, lo revisé. El tanque está casi lleno."],
          ["Daniel", "OK, so we can rule that out. Could it be a leak?", "Bien, entonces podemos descartarlo. ¿Podría ser una fuga?"],
          ["Mike", "Maybe. Let's look into it. I'll set up the leak detector.", "Quizás. Investiguemos. Voy a montar el detector de fugas."],
          ["Daniel", "While you do that, I'll go over the log files from last night.", "Mientras tanto, reviso los registros de anoche."],
          ["Mike", "Good idea. ... Found it! The O-ring on this flange is cracked.", "Buena idea. … ¡Lo encontré! El anillo tórico de esta brida está agrietado."],
          ["Daniel", "Great, so it turned out to be something simple.", "Genial, entonces resultó ser algo simple."],
          ["Mike", "Simple, yes. Cheap, no. We'll have to put off the measurement until Monday.", "Simple, sí. Barato, no. Tendremos que posponer la medición hasta el lunes."],
          ["Daniel", "No problem. I'll follow up with Sarah and let her know.", "No hay problema. Le escribo a Sarah para avisarle."],
        ],
      },
      mission: {
        who: "Tu colega, resolviendo un problema juntos",
        role: "Sam, a lab mate whose simulation (or instrument, or class platform) keeps failing. Troubleshoot together with the learner, asking what to check next and reacting to suggestions.",
        scene: "Algo no funciona (un equipo, un código, un experimento). Resuélvanlo juntos usando phrasal verbs.",
        goals: ["Usa cinco phrasal verbs distintos", "Usa un separable con pronombre (turn it off, set it up)", "Descarta una causa (rule out)", "Propón el siguiente paso (I'll look into it / follow up)"],
        start: "Hey, I've got a problem. My simulation keeps crashing after ten minutes, and I have no idea why. Can you help me?",
        guided: [
          ["My simulation keeps crashing. Can you help me?", "Sure. First, let's figure out when exactly it crashes."],
          ["It always crashes after ten minutes.", "Maybe the computer runs out of memory. Can you check it?"],
          ["Memory looks fine.", "OK, then we can rule that out. Let's go over the code together."],
          ["Look, there's a loop with no end.", "That's it! It turned out to be a bug. Fix it, run it again, and I'll follow up tomorrow."],
        ],
      },
      links: [
        ["Phrasal verbs (Perfect English Grammar)", "https://www.perfect-english-grammar.com/phrasal-verbs.html", "Separables, inseparables y ejercicios.", "Gramática"],
        ["Phrasal verbs (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/phrasal-verbs", "Referencia completa.", "Gramática"],
        ["Diccionario de phrasal verbs (EnglishClub)", "https://www.englishclub.com/ref/Phrasal_Verbs/", "Cientos de phrasal verbs con definición y ejemplo.", "Frases"],
        ["Adam's English Lessons · engVid (YouTube)", "https://www.youtube.com/@engvidAdam", "Clases claras de phrasal verbs y vocabulario avanzado.", "Escuchar"],
      ],
    },
    /* ---------------- B2·6 ---------------- */
    {
      title: "Entrevista y carrera", en: "Tell me about yourself",
      goal: "presentar tu trayectoria, contar logros con números y responder preguntas de entrevista.",
      focus: "talking about your career, STAR method, mixed tenses, false friends (actually, currently, career, attend, sensible, eventually)",
      grammar: `
<h3>Tu historia en tres tiempos</h3>
<ul class="ex">
<li><b>Presente:</b> <em>I'm currently a research associate at a university optics lab.</em></li>
<li><b>Presente perfecto:</b> <em>I've been working with lasers for over five years.</em></li>
<li><b>Pasado simple (logros concretos):</b> <em>I reduced the measurement noise by 40%.</em></li>
</ul>
<h3>El método STAR para preguntas de comportamiento</h3>
<p>Ante «Tell me about a time when…», responde en cuatro pasos:</p>
<ul class="ex">
<li><b>S</b>ituation — <em>Last spring, our interferometer had a drift problem.</em></li>
<li><b>T</b>ask — <em>My task was to find the cause.</em></li>
<li><b>A</b>ction — <em>I tested each component and designed a temperature-controlled enclosure.</em></li>
<li><b>R</b>esult — <em>As a result, the drift dropped by ninety percent.</em></li>
</ul>
<h3>Falsos amigos que arruinan una entrevista</h3>
<div class="tbl"><table>
<tr><th>Inglés</th><th>Significa</th><th>No significa</th></tr>
<tr><td>actually</td><td>en realidad</td><td>actualmente (= currently)</td></tr>
<tr><td>career</td><td>trayectoria profesional</td><td>carrera universitaria (= degree, major)</td></tr>
<tr><td>attend</td><td>asistir (a un evento)</td><td>atender</td></tr>
<tr><td>sensible</td><td>sensato</td><td>sensible (= sensitive)</td></tr>
<tr><td>eventually</td><td>finalmente</td><td>eventualmente (= possibly)</td></tr>
<tr><td>assist</td><td>ayudar</td><td>asistir a (= attend)</td></tr>
</table></div>
<div class="ojo"><p>«Estudié la carrera de ingeniería física» → <em>I have a degree in Engineering Physics.</em> (no «I studied the career of…»).</p></div>`,
      sound: {
        t: "El acento en palabras profesionales",
        tip: "Palabras largas que se parecen al español pero con otro acento: <i>engiNEER</i>, <i>techNOLogy</i>, <i>deVELopment</i>, <i>anaLYTical</i>, <i>exPERience</i>, <i>PHYSics</i>. Márcalo con claridad: en una entrevista, el acento correcto transmite seguridad.",
        w: ["engineer", "technology", "development", "analytical", "experience", "physics"],
      },
      vocab: [
        ["background", "formación, trayectoria", "Tell me about your background."],
        ["degree", "título universitario", "I have a degree in Engineering Physics."],
        ["major", "carrera, especialidad (EE. UU.)", "What was your major?"],
        ["strength / weakness", "fortaleza / debilidad", "What's your main strength?"],
        ["achievement", "logro", "My biggest achievement was the new setup."],
        ["skill", "habilidad", "Problem-solving is one of my skills."],
        ["teamwork", "trabajo en equipo", "Teamwork is essential in a lab."],
        ["challenge", "reto", "Tell me about a challenge you faced."],
        ["position", "puesto", "I'm applying for the research position."],
        ["currently", "actualmente", "I'm currently teaching three courses."],
        ["actually", "en realidad", "Actually, I prefer applied research."],
        ["look forward to", "esperar con interés", "I look forward to hearing from you."],
      ],
      phrases: [
        ["I have a degree in Engineering Physics from the University of Cauca.", "Soy ingeniero físico de la Universidad del Cauca."],
        ["I'm currently working as a researcher in an optics lab.", "Actualmente trabajo como investigador en un laboratorio de óptica."],
        ["I've been working with lasers for over five years.", "Llevo más de cinco años trabajando con láseres."],
        ["One of my main strengths is problem-solving.", "Una de mis principales fortalezas es resolver problemas."],
        ["For example, I reduced the measurement noise by 40%.", "Por ejemplo, reduje el ruido de medición en un 40 %."],
        ["I'm working on improving my public speaking.", "Estoy trabajando en mejorar al hablar en público."],
        ["I'm really interested in this position because...", "Me interesa mucho este puesto porque…"],
        ["Could you tell me more about the team?", "¿Podría contarme más sobre el equipo?"],
        ["What would a typical day look like?", "¿Cómo sería un día típico?"],
        ["Thank you for your time. I look forward to hearing from you.", "Gracias por su tiempo. Quedo atento a su respuesta."],
      ],
      ex: [
        ["mc", "«Actually» significa:", ["actualmente", "en realidad"], 1, "Actualmente = currently."],
        ["mc", "«Currently» significa:", ["actualmente", "corrientemente"], 0, ""],
        ["gap", "I have a ___ in Engineering Physics. (título)", ["degree"], ""],
        ["mc", "«Attend a conference» significa:", ["asistir a un congreso", "atender un congreso"], 0, ""],
        ["gap", "I've ___ working here for three years.", ["been"], ""],
        ["mc", "En el método STAR, la R significa:", ["Result", "Reason", "Role"], 0, "Situation, Task, Action, Result."],
        ["gap", "I look forward to ___ (hear) from you.", ["hearing"], "Look forward to + -ing."],
        ["mc", "«Sensible» en inglés significa:", ["sensible", "sensato"], 1, "Sensible (español) = sensitive."],
        ["order", "One of|my main|strengths|is|problem-solving.", "Una de mis principales fortalezas es resolver problemas."],
        ["tr", "Actualmente trabajo como investigador.", ["I'm currently working as a researcher", "I currently work as a researcher", "Currently I work as a researcher", "Currently, I'm working as a researcher", "I am currently working as a researcher"], "Actualmente = currently, no «actually»."],
        ["tr", "Reduje el ruido de medición en un 40 %.", ["I reduced the measurement noise by 40%", "I reduced measurement noise by 40%", "I cut the measurement noise by 40%", "I reduced the noise of the measurement by 40%", "I reduced the measurement noise by forty percent"], ""],
      ],
      dialogue: {
        ctx: "Daniel tiene una entrevista para un puesto de desarrollo en Clearwave Photonics (empresa ficticia). Lo entrevista Rachel Adams.",
        lines: [
          ["Rachel", "Thanks for coming in, Daniel. So, tell me a little about yourself.", "Gracias por venir, Daniel. Cuéntame un poco sobre ti."],
          ["Daniel", "Sure. I'm an engineering physicist from Colombia. I'm currently a research associate at a university optics lab in Boulder, where I've been working on precision interferometry for the past year.", "Claro. Soy ingeniero físico de Colombia. Actualmente soy investigador asociado en un laboratorio de óptica universitario en Boulder, donde he trabajado en interferometría de precisión este último año."],
          ["Rachel", "What made you apply for this position?", "¿Qué te motivó a postularte a este puesto?"],
          ["Daniel", "I'm really interested in moving from research to product development. Your work on fiber sensors is exactly the kind of applied physics I enjoy.", "Me interesa mucho pasar de la investigación al desarrollo de productos. Su trabajo en sensores de fibra es justo el tipo de física aplicada que disfruto."],
          ["Rachel", "Can you tell me about a challenge you faced and how you handled it?", "¿Puedes contarme sobre un reto que enfrentaste y cómo lo manejaste?"],
          ["Daniel", "Last spring, our interferometer had a drift that made the data useless. My task was to find the cause. I tested each component and found that temperature changes in the fiber were responsible.", "La primavera pasada, nuestro interferómetro tenía una deriva que inutilizaba los datos. Mi tarea era encontrar la causa. Probé cada componente y descubrí que los cambios de temperatura en la fibra eran los responsables."],
          ["Daniel", "So I designed a temperature-controlled enclosure, and as a result, the drift dropped by ninety percent.", "Así que diseñé una caja con control de temperatura y, como resultado, la deriva bajó un noventa por ciento."],
          ["Rachel", "Impressive. What would you say is your main weakness?", "Impresionante. ¿Cuál dirías que es tu principal debilidad?"],
          ["Daniel", "Sometimes I spend too long perfecting details. I'm learning to set time limits and focus on what matters most for the project.", "A veces dedico demasiado tiempo a perfeccionar detalles. Estoy aprendiendo a ponerme límites de tiempo y a enfocarme en lo que más importa para el proyecto."],
          ["Rachel", "Great. Do you have any questions for us?", "Muy bien. ¿Tienes alguna pregunta para nosotros?"],
          ["Daniel", "Yes. What would a typical day look like for someone in this role?", "Sí. ¿Cómo sería un día típico para alguien en este puesto?"],
        ],
      },
      mission: {
        who: "Una gerente de contratación",
        role: "Rachel Adams, a hiring manager interviewing the learner for a position they choose (university lecturer, R&D engineer, researcher, data scientist...). Ask classic questions one at a time: tell me about yourself, why this position, a challenge (STAR), strengths and weaknesses, questions for us.",
        scene: "Entrevista de trabajo en inglés para un puesto que te interese: investigador, profesor universitario, ingeniero de I+D…",
        goals: ["Preséntate en 3–4 frases (Tell me about yourself)", "Cuenta un reto con el método STAR e incluye un número", "Habla de una fortaleza y una debilidad", "Haz una pregunta al final"],
        start: "Hi, thanks for joining us today. Let's start with the classic: tell me a little about yourself.",
        guided: [
          ["Tell me a little about yourself.", "I'm an engineering physicist with ten years of experience in teaching and applied research. I'm currently a lecturer at a university in Colombia."],
          ["Tell me about a challenge you faced.", "Our students had low results in lab courses. My task was to improve them. I redesigned the practices, and as a result, pass rates increased by 25%."],
          ["What's your main weakness?", "Sometimes I take on too many projects. I'm learning to prioritize and say no."],
          ["Do you have any questions for us?", "Yes. Could you tell me more about the team I would be working with?"],
        ],
      },
      links: [
        ["BBC English at Work", "https://www.bbc.co.uk/learningenglish/english/features/english-at-work", "Situaciones laborales, incluida una entrevista.", "Escuchar"],
        ["EnglishClub: Business English", "https://www.englishclub.com/business-english/", "Vocabulario y frases para el trabajo y entrevistas.", "Frases"],
        ["Linguamarina (YouTube)", "https://www.youtube.com/@linguamarina", "Carrera, entrevistas y vida profesional en inglés.", "Escuchar,Hablar"],
        ["English for Science, Technology, Engineering, and Mathematics (Coursera)", "https://www.coursera.org/learn/stem", "Curso de la Universidad de Pensilvania para profesionales STEM.", "Escuchar,Escritura"],
      ],
    },
  ],
});
