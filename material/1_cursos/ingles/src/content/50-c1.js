/* Nivel C1 · n = 5 · Hγ 434 nm */
window.QLE_LEVELS = window.QLE_LEVELS || [];
window.QLE_LEVELS.push({
  id: "c1", code: "C1", n: 5, name: "Avanzado", nm: 434, line: "Hγ",
  links: [
    ["BBC Learning English · Towards Advanced", "https://www.bbc.co.uk/learningenglish/english/course/towards-advanced", "Curso gratuito de nivel avanzado.", "B2,C1"],
    ["The Infinite Monkey Cage (BBC Radio 4)", "https://www.bbc.co.uk/programmes/b00snr0w", "Ciencia con humor: Brian Cox y Robin Ince con físicos invitados.", "C1"],
    ["Mindscape, de Sean Carroll (podcast)", "https://www.preposterousuniverse.com/podcast/", "Conversaciones largas y profundas con científicos.", "C1"],
    ["How to Speak, Patrick Winston (MIT OCW)", "https://ocw.mit.edu/courses/res-tll-005-how-to-speak-january-iap-2018/", "La clase clásica del MIT sobre cómo dar charlas.", "B2,C1"],
  ],
  units: [
    /* ---------------- C1·1 ---------------- */
    {
      title: "Matizar y ser cauteloso", en: "The results suggest that...",
      goal: "expresar conclusiones científicas con el grado justo de certeza, sin exagerar ni quedarte corto.",
      focus: "hedging (may, might, suggest, appear, likely, to some extent), boosters, limitations; avoiding overclaiming",
      grammar: `
<h3>Hedging: la cautela como estilo</h3>
<p>En inglés académico, afirmar demasiado se percibe como poco riguroso. Se «matiza» con varios recursos:</p>
<div class="tbl"><table>
<tr><th>Recurso</th><th>Ejemplos</th></tr>
<tr><td>modales</td><td><em>may, might, could</em> — <em>This may be due to residual gas.</em></td></tr>
<tr><td>verbos</td><td><em>suggest, indicate, appear, seem, tend to</em> — <em>The data appear to be consistent with the model.</em></td></tr>
<tr><td>adverbios</td><td><em>likely, possibly, presumably, arguably, largely, predominantly</em></td></tr>
<tr><td>expresiones</td><td><em>to some extent</em>, <em>it is likely that</em>, <em>there is some evidence that</em>, <em>to our knowledge</em></td></tr>
</table></div>
<h3>No «demuestres» con un experimento</h3>
<p>En ciencias experimentales se evita <b>prove</b>: los datos <em>support</em>, <em>are consistent with</em>, <em>provide evidence for</em> una hipótesis.</p>
<ul class="ex">
<li><del>This proves that the drift is thermal.</del></li>
<li><em>The strong correlation with temperature suggests that the drift is predominantly thermal in origin.</em></li>
</ul>
<h3>Reforzar sin exagerar</h3>
<p>Los <b>boosters</b> (<em>clearly, strongly, undoubtedly</em>) se usan con moderación y con evidencia: <em>These results strongly suggest…</em></p>
<h3>Reconocer límites</h3>
<ul class="ex">
<li><em>One limitation of this study is the small sample size.</em></li>
<li><em>We cannot rule out the possibility that…</em></li>
<li><em>Further measurements are needed to confirm this.</em></li>
<li><em>These findings should be interpreted with caution.</em></li>
</ul>
<div class="ojo"><p>Tampoco te pases de cauteloso: <del>It might possibly perhaps suggest…</del> Un hedge por afirmación basta.</p></div>`,
      sound: {
        t: "Palabras académicas que se pronuncian mal",
        tip: "<i>suggest</i>: «sə-JEST» (EE. UU.). <i>hypothesis</i>: «hai-PÁ-thə-sis», y el plural <i>hypotheses</i> termina en «-siiz». Igual <i>analysis → analyses</i> («ə-NÁ-lə-siiz»). <i>phenomenon</i> (singular) / <i>phenomena</i> (plural). <i>data</i>: «DEI-tə» o «DÆ-tə».",
        w: ["suggest", "hypothesis|hypotheses", "analysis|analyses", "phenomenon|phenomena", "data", "preliminary"],
      },
      vocab: [
        ["suggest", "sugerir, indicar", "These results suggest a thermal origin."],
        ["indicate", "indicar", "The data indicate a small effect."],
        ["appear to", "parecer", "The model appears to hold."],
        ["tend to", "tender a", "Larger samples tend to be noisier."],
        ["likely", "probable, probablemente", "The discrepancy is likely due to calibration."],
        ["presumably", "presumiblemente", "The gas presumably leaked overnight."],
        ["arguably", "posiblemente, se podría decir que", "It is arguably the best method."],
        ["to some extent", "hasta cierto punto", "To some extent, this explains the drift."],
        ["consistent with", "consistente con", "Our results are consistent with theory."],
        ["limitation", "limitación", "One limitation is the sample size."],
        ["caveat", "salvedad, advertencia", "There is one important caveat."],
        ["tentative", "provisional, tentativo", "These conclusions are tentative."],
      ],
      phrases: [
        ["These results suggest that the effect is thermal in origin.", "Estos resultados sugieren que el efecto es de origen térmico."],
        ["The data appear to be consistent with the model.", "Los datos parecen ser consistentes con el modelo."],
        ["This may be due to residual gas in the chamber.", "Esto puede deberse a gas residual en la cámara."],
        ["It is likely that the discrepancy arises from calibration errors.", "Es probable que la discrepancia se deba a errores de calibración."],
        ["To some extent, this explains the observed drift.", "Hasta cierto punto, esto explica la deriva observada."],
        ["We cannot rule out the possibility that the sample was contaminated.", "No podemos descartar la posibilidad de que la muestra estuviera contaminada."],
        ["Further measurements are needed to confirm this.", "Se necesitan más mediciones para confirmarlo."],
        ["One limitation of this study is the small sample size.", "Una limitación de este estudio es el tamaño reducido de la muestra."],
        ["Our findings are broadly in line with previous work.", "Nuestros hallazgos concuerdan en general con trabajos previos."],
        ["This should be interpreted with caution.", "Esto debe interpretarse con cautela."],
      ],
      ex: [
        ["mc", "La frase más adecuada para un artículo:", ["This proves our theory.", "These results support our model.", "This is the truth."], 1, "Los datos apoyan; no demuestran."],
        ["gap", "The data ___ to be consistent with the model. (parecen)", ["appear", "seem"], ""],
        ["mc", "Hedge adecuado:", ["The error is due to temperature.", "The error may be due to temperature."], 1, ""],
        ["gap", "We cannot rule ___ the possibility of contamination.", ["out"], ""],
        ["mc", "«Arguably» significa:", ["se podría decir que, posiblemente", "de forma argumentativa", "discutiendo"], 0, ""],
        ["gap", "Further measurements ___ needed to confirm this.", ["are"], ""],
        ["mc", "Plural de «hypothesis»:", ["hypothesises", "hypotheses", "hypothesis"], 1, ""],
        ["gap", "This should be interpreted with ___. (cautela)", ["caution"], ""],
        ["order", "Our findings|are|consistent|with|previous work.", "Nuestros hallazgos son consistentes con trabajos previos."],
        ["tr", "Es probable que la discrepancia se deba a errores de calibración.", ["It is likely that the discrepancy is due to calibration errors", "The discrepancy is likely due to calibration errors", "The discrepancy is probably due to calibration errors", "It is likely that the discrepancy arises from calibration errors", "The discrepancy is likely to be due to calibration errors", "The discrepancy likely arises from calibration errors"], ""],
        ["tr", "Estos resultados sugieren que el efecto es de origen térmico.", ["These results suggest that the effect is thermal in origin", "These results suggest the effect is thermal in origin", "These results suggest that the effect has a thermal origin", "These results suggest the effect has a thermal origin", "These results suggest that the effect is of thermal origin"], ""],
      ],
      dialogue: {
        ctx: "Sarah y Daniel editan la discusión de su artículo.",
        lines: [
          ["Sarah", "I like your discussion, but some claims are too strong. Look here: 'This proves that the drift is thermal.'", "Me gusta tu discusión, pero algunas afirmaciones son demasiado fuertes. Mira aquí: «Esto demuestra que la deriva es térmica»."],
          ["Daniel", "But the correlation with temperature is very clear.", "Pero la correlación con la temperatura es muy clara."],
          ["Sarah", "It is. But correlation isn't proof, and reviewers will jump on that. Try 'strongly suggests'.", "Lo es. Pero correlación no es prueba, y los revisores se van a lanzar sobre eso. Prueba con «sugiere fuertemente»."],
          ["Daniel", "OK: 'The strong correlation with temperature suggests that the drift is predominantly thermal in origin.'", "Bien: «La fuerte correlación con la temperatura sugiere que la deriva es predominantemente de origen térmico»."],
          ["Sarah", "Much better. And 'predominantly' leaves room for other effects.", "Mucho mejor. Y «predominantemente» deja espacio para otros efectos."],
          ["Daniel", "What about this sentence: 'Our method is better than all previous methods'?", "¿Y esta oración: «Nuestro método es mejor que todos los anteriores»?"],
          ["Sarah", "Too broad. Be specific: better in what, and compared to what?", "Demasiado amplia. Sé específico: ¿mejor en qué y comparado con qué?"],
          ["Daniel", "'To our knowledge, this represents a threefold improvement in sensitivity over comparable room-temperature setups.'", "«Hasta donde sabemos, esto representa una mejora de tres veces en sensibilidad respecto a montajes comparables a temperatura ambiente»."],
          ["Sarah", "Perfect. Precise, cautious, and still confident.", "Perfecto. Preciso, cauteloso y aun así seguro."],
          ["Daniel", "It's a fine balance.", "Es un equilibrio delicado."],
          ["Sarah", "That's academic English for you.", "Así es el inglés académico."],
        ],
      },
      mission: {
        who: "Un colega escéptico",
        role: "Dr. Kim, a skeptical but fair colleague who read the learner's abstract and challenges overclaims. Push back on strong words like 'prove', 'solve', 'always'. Acknowledge good hedging.",
        scene: "Presentas un resultado (real o inventado). Un colega escéptico cuestiona tus afirmaciones; defiende tu conclusión con lenguaje matizado, sin exagerar.",
        goals: ["Usa tres expresiones de cautela distintas", "Reconoce una limitación", "Propón trabajo futuro para confirmar", "Evita «prove»: usa suggest, support o consistent with"],
        start: "I read your abstract. You say your method 'solves' the noise problem. Isn't that a bit strong? What exactly did you show?",
        guided: [
          ["You say your method 'solves' the noise problem. Isn't that too strong?", "You're right. Our results suggest that the method reduces the noise significantly, by about 60%."],
          ["Does it work in all conditions?", "Not necessarily. It appears to work well at room temperature, but we haven't tested it at low temperatures."],
          ["So what are the limitations?", "One limitation is that we only tested three samples, so the results should be interpreted with caution."],
          ["What would convince me?", "Further measurements with more samples are needed. If the trend holds, it would strongly support our conclusion."],
        ],
      },
      links: [
        ["Academic Phrasebank: discutir hallazgos", "https://www.phrasebank.manchester.ac.uk/discussing-findings/", "Frases para la discusión de un artículo, con cautela.", "Frases,Escritura"],
        ["Academic Phrasebank: ser crítico", "https://www.phrasebank.manchester.ac.uk/being-critical/", "Cómo señalar limitaciones y debilidades con elegancia.", "Frases,Escritura"],
        ["Hedges (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/hedges", "Hedging en inglés hablado y escrito.", "Gramática"],
        ["Writing in the Sciences (Stanford, Coursera)", "https://www.coursera.org/learn/sciwrite", "Claridad, concisión y tono en la escritura científica.", "Escritura"],
      ],
    },
    /* ---------------- C1·2 ---------------- */
    {
      title: "Dar una charla", en: "Let me walk you through...",
      goal: "estructurar y dar una presentación técnica con señales claras para el público.",
      focus: "signposting in presentations: opening, outline, transitions, referring to visuals, emphasizing, concluding, inviting questions",
      grammar: `
<h3>Un público que escucha necesita señales</h3>
<p>Un lector puede volver atrás; un oyente no. Por eso las charlas en inglés usan mucho <b>signposting</b>: frases que anuncian dónde estás y a dónde vas.</p>
<div class="tbl"><table>
<tr><th>Momento</th><th>Frases</th></tr>
<tr><td>Abrir</td><td><em>Good morning, everyone. Thank you for having me.</em> · <em>Today I'd like to talk about…</em></td></tr>
<tr><td>Anunciar la estructura</td><td><em>I've divided my talk into three parts.</em> · <em>First…, then…, and finally…</em></td></tr>
<tr><td>Transiciones</td><td><em>Let's move on to…</em> · <em>This brings me to…</em> · <em>Turning now to…</em></td></tr>
<tr><td>Referirse a lo visual</td><td><em>As you can see on this slide, …</em> · <em>Let me draw your attention to…</em> · <em>What's interesting here is…</em></td></tr>
<tr><td>Enfatizar</td><td><em>The key point is…</em> · <em>I want to stress that…</em></td></tr>
<tr><td>Explicar un montaje</td><td><em>Let me walk you through the setup.</em></td></tr>
<tr><td>Cerrar</td><td><em>To wrap up, …</em> · <em>The take-home message is…</em> · <em>I'd be happy to take any questions.</em></td></tr>
</table></div>
<h3>Consejos que funcionan</h3>
<ul>
<li>Empieza con una pregunta o un problema, no con tu índice: <em>How do you measure something a billion times smaller than a meter?</em></li>
<li>Frases cortas. Una idea por diapositiva. Deja que la diapositiva muestre y tú expliques.</li>
<li>Repite tu mensaje principal al principio y al final.</li>
<li>Haz pausas: el silencio da tiempo al público para entender (y a ti, para respirar).</li>
</ul>
<div class="tip"><p>Patrick Winston (MIT) recomendaba terminar con tus <b>contribuciones</b>, no con «Thank you» ni con una diapositiva de «Questions?». La última diapositiva es la que el público mira durante las preguntas.</p></div>`,
      sound: {
        t: "Pausas y acento de contraste",
        tip: "Divide las frases en bloques de sentido con pausas breves: <i>Today | I'd like to talk about | quantum sensors | and why they matter.</i> Y para contrastar, acentúa fuerte la palabra clave: <i>It's not the LASER, it's the DETECTOR.</i>",
        w: ["Today, I'd like to talk about quantum sensors, and why they matter.", "It's not the laser, it's the detector.", "The key point is temperature.", "To wrap up, the take-home message is simple."],
      },
      vocab: [
        ["slide", "diapositiva", "As you can see on this slide..."],
        ["outline", "esquema, índice", "Here's the outline of my talk."],
        ["overview", "panorama general", "Let me give you a quick overview."],
        ["take-home message", "mensaje principal", "The take-home message is simple."],
        ["audience", "público", "Know your audience."],
        ["highlight", "destacar", "I'd like to highlight two results."],
        ["stress / emphasize", "enfatizar", "I want to stress that these are preliminary."],
        ["illustrate", "ilustrar", "This example illustrates the problem."],
        ["walk someone through", "explicar paso a paso", "Let me walk you through the setup."],
        ["in a nutshell", "en pocas palabras", "In a nutshell, it works."],
        ["wrap up", "concluir, cerrar", "To wrap up, ..."],
        ["acknowledgments", "agradecimientos", "My acknowledgments go to the whole team."],
      ],
      phrases: [
        ["Good morning, everyone. Thank you for having me.", "Buenos días a todos. Gracias por invitarme."],
        ["Today I'd like to talk about how we measure tiny vibrations with light.", "Hoy quiero hablar de cómo medimos vibraciones diminutas con luz."],
        ["I've divided my talk into three parts.", "He dividido mi charla en tres partes."],
        ["Let me start with a bit of background.", "Permítanme empezar con un poco de contexto."],
        ["As you can see on this slide, the noise drops dramatically.", "Como pueden ver en esta diapositiva, el ruido cae drásticamente."],
        ["This brings me to my next point.", "Esto me lleva a mi siguiente punto."],
        ["I want to stress that these results are preliminary.", "Quiero enfatizar que estos resultados son preliminares."],
        ["Let me walk you through the setup.", "Déjenme explicarles el montaje paso a paso."],
        ["To wrap up, the take-home message is that temperature control is everything.", "Para cerrar, el mensaje principal es que el control de temperatura lo es todo."],
        ["I'd be happy to take any questions.", "Con gusto respondo sus preguntas."],
      ],
      ex: [
        ["mc", "Transición natural:", ["Now slide 7.", "This brings me to my next point.", "Next thing."], 1, ""],
        ["gap", "I've divided my talk ___ three parts.", ["into"], ""],
        ["gap", "Let me walk you ___ the setup.", ["through"], ""],
        ["mc", "«Take-home message» significa:", ["la idea principal que el público debe recordar", "la tarea para la casa"], 0, ""],
        ["gap", "As you can ___ on this slide, the signal doubles.", ["see"], ""],
        ["mc", "Para cerrar una charla:", ["To wrap up, …", "To wrap on, …", "For finishing, …"], 0, ""],
        ["gap", "I want to ___ that these results are preliminary. (enfatizar)", ["stress", "emphasize", "emphasise", "highlight"], ""],
        ["gap", "Thank you for ___ me. (invitarme)", ["having", "inviting"], ""],
        ["order", "Let|me|start|with|a bit of|background.", "Permítanme empezar con un poco de contexto."],
        ["tr", "Para concluir, el mensaje principal es que la técnica funciona.", ["To wrap up, the take-home message is that the technique works", "To conclude, the main message is that the technique works", "To sum up, the main message is that the technique works", "To conclude, the take-home message is that the technique works", "In conclusion, the main message is that the technique works", "To wrap up, the main message is that the technique works", "In conclusion, the take-home message is that the technique works"], ""],
        ["tr", "Como pueden ver en esta diapositiva, el ruido cae drásticamente.", ["As you can see on this slide, the noise drops dramatically", "As you can see in this slide, the noise drops dramatically", "As you can see on this slide, the noise falls dramatically", "As you can see on this slide, noise drops dramatically", "As you can see on this slide, the noise decreases dramatically"], ""],
      ],
      dialogue: {
        ctx: "Congreso en marzo. El moderador presenta a Daniel, que da el inicio y el cierre de su charla.",
        me: "Daniel",
        lines: [
          ["Chair", "Our next speaker is Daniel Ruiz, from Boulder. Daniel, the floor is yours.", "Nuestro siguiente ponente es Daniel Ruiz, de Boulder. Daniel, tienes la palabra."],
          ["Daniel", "Thank you, and good morning, everyone. Thanks for having me.", "Gracias, y buenos días a todos. Gracias por invitarme."],
          ["Daniel", "Today I'd like to talk about how we can measure vibrations smaller than an atom using nothing but light.", "Hoy quiero hablar de cómo podemos medir vibraciones más pequeñas que un átomo usando solo luz."],
          ["Daniel", "I've divided my talk into three parts. First, a bit of background on interferometry. Then, our setup. And finally, our latest results.", "He dividido mi charla en tres partes. Primero, un poco de contexto sobre interferometría. Luego, nuestro montaje. Y finalmente, nuestros últimos resultados."],
          ["Daniel", "So, let me start with a simple question: how do you measure something a billion times smaller than a meter?", "Entonces, déjenme empezar con una pregunta sencilla: ¿cómo se mide algo mil millones de veces más pequeño que un metro?"],
          ["Daniel", "As you can see on this slide, the answer is interference.", "Como pueden ver en esta diapositiva, la respuesta es la interferencia."],
          ["Daniel", "This brings me to our setup. What's interesting here is the fiber enclosure, which reduced the drift by ninety percent.", "Esto me lleva a nuestro montaje. Lo interesante aquí es la caja de la fibra, que redujo la deriva un noventa por ciento."],
          ["Daniel", "I want to stress that these results are still preliminary.", "Quiero enfatizar que estos resultados todavía son preliminares."],
          ["Daniel", "To wrap up, the take-home message is simple: temperature control is everything.", "Para cerrar, el mensaje principal es simple: el control de temperatura lo es todo."],
          ["Daniel", "Thank you. I'd be happy to take any questions.", "Gracias. Con gusto respondo sus preguntas."],
          ["Chair", "Thank you, Daniel. We have time for a couple of questions.", "Gracias, Daniel. Tenemos tiempo para un par de preguntas."],
        ],
      },
      mission: {
        who: "El moderador de una sesión de congreso",
        role: "Professor Grant, chair of a conference session. First invite the learner to give the introduction of a short talk on a topic of their choice (they type it). Then give brief, specific feedback on their signposting in character, ask them to continue with a transition and a conclusion, and finally ask one audience question.",
        scene: "Prepara y «da» (escribe) una charla corta sobre un tema de física o de tu trabajo. El moderador te irá guiando.",
        goals: ["Abre la charla y presenta el tema", "Anuncia la estructura en tres partes", "Usa dos transiciones (This brings me to…, Let's move on to…)", "Cierra con un take-home message e invita a preguntas"],
        start: "Welcome to the session! You have three minutes. Please begin with your introduction whenever you're ready.",
        guided: [
          ["Please begin with your introduction.", "Good morning, everyone, and thank you for having me. Today I'd like to talk about how we teach optics with low-cost experiments."],
          ["How is your talk organized?", "I've divided my talk into three parts: the problem, our experiments, and the results with students."],
          ["Please continue to your results.", "This brings me to our results. As you can see on this slide, students' scores improved by 20 percent."],
          ["Please conclude.", "To wrap up, the take-home message is that good physics doesn't need expensive equipment. I'd be happy to take any questions."],
        ],
      },
      links: [
        ["How to Speak, Patrick Winston (MIT OCW)", "https://ocw.mit.edu/courses/res-tll-005-how-to-speak-january-iap-2018/", "Una hora que cambiará tus presentaciones.", "Hablar"],
        ["TED's secret to great public speaking (Chris Anderson)", "https://www.ted.com/talks/chris_anderson_ted_s_secret_to_great_public_speaking", "Cómo construir una charla alrededor de una sola idea.", "Hablar"],
        ["How to speak so that people want to listen (Julian Treasure, TED)", "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen", "Voz, ritmo y presencia.", "Hablar,Pronunciación"],
        ["Richard Feynman: Physics is fun to imagine (TED)", "https://www.ted.com/talks/richard_feynman_physics_is_fun_to_imagine", "El maestro explicando física con palabras simples.", "Física,Escuchar"],
      ],
    },
    /* ---------------- C1·3 ---------------- */
    {
      title: "Preguntas difíciles", en: "That's a fair point, however...",
      goal: "responder preguntas difíciles con diplomacia: ganar tiempo, aclarar, conceder y contraargumentar.",
      focus: "handling Q&A: buying time, clarifying, conceding and countering; concession linkers (although, despite, whereas, however, nevertheless)",
      grammar: `
<h3>Estrategias para la ronda de preguntas</h3>
<div class="tbl"><table>
<tr><th>Estrategia</th><th>Frases</th></tr>
<tr><td>Ganar tiempo</td><td><em>That's a great question. Let me think about it for a second.</em></td></tr>
<tr><td>Aclarar</td><td><em>If I understand correctly, you're asking whether…</em> · <em>Could you elaborate on what you mean by…?</em></td></tr>
<tr><td>Conceder y contraargumentar</td><td><em>That's a fair point. However, our control measurements rule that out.</em></td></tr>
<tr><td>Respuesta parcial</td><td><em>I don't have the exact figure here, but it's of the order of ten percent.</em></td></tr>
<tr><td>Admitir que no sabes</td><td><em>To be honest, I'm not sure. I'd be happy to look into it and follow up.</em></td></tr>
<tr><td>Redirigir</td><td><em>That's slightly beyond the scope of this work, but…</em></td></tr>
<tr><td>Discrepar con alguien senior</td><td><em>With respect, I'd argue that the model still holds in this regime.</em></td></tr>
</table></div>
<h3>Conectores de concesión y contraste</h3>
<ul class="ex">
<li><em>Although the sample is small, the trend is consistent.</em> <span class="es">(although + oración)</span></li>
<li><em>Despite the noise, the peak is clearly visible.</em> <span class="es">(despite + sustantivo o -ing)</span></li>
<li><em>The model predicts a linear trend, whereas our data show saturation.</em> <span class="es">(contraste)</span></li>
<li><em>The effect is small. Nevertheless, it is statistically significant.</em></li>
</ul>
<div class="ojo"><p><del>Despite of the noise</del> → <em>Despite the noise</em> o <em>In spite of the noise</em>. Y nunca <del>Although…, but…</del>: se usa solo uno de los dos.</p></div>`,
      sound: {
        t: "Entonación de reserva (fall-rise)",
        tip: "Para mostrar acuerdo <b>parcial</b> («sí, pero…»), la voz baja y vuelve a subir en la palabra clave: <i>That's TRUE… (↘↗) but…</i> Le indica al oyente que viene una objeción, y suaviza el desacuerdo.",
        w: ["That's true, but...", "In principle, yes.", "That's a fair point. However...", "With respect, I'd argue that..."],
      },
      vocab: [
        ["fair point", "observación válida", "That's a fair point."],
        ["scope", "alcance", "That's beyond the scope of this work."],
        ["assumption", "supuesto", "Our main assumption is linearity."],
        ["address", "abordar, tratar", "Let me address your second question."],
        ["clarify", "aclarar", "Could you clarify what you mean?"],
        ["elaborate", "ampliar, desarrollar", "Could you elaborate on that?"],
        ["concede", "conceder, admitir", "I concede that the sample is small."],
        ["counterargument", "contraargumento", "Here's a counterargument."],
        ["whereas", "mientras que (contraste)", "The model predicts X, whereas we see Y."],
        ["nevertheless", "sin embargo, no obstante", "Nevertheless, the result is significant."],
        ["artifact", "artefacto (efecto espurio)", "Could it be an artifact of the setup?"],
        ["rigorous", "riguroso", "We need a more rigorous test."],
      ],
      phrases: [
        ["That's a great question. Let me think about it for a second.", "Excelente pregunta. Déjeme pensarlo un segundo."],
        ["If I understand correctly, you're asking whether the effect depends on the wavelength.", "Si entiendo bien, pregunta si el efecto depende de la longitud de onda."],
        ["That's a fair point. However, our control measurements rule that out.", "Es una observación válida. Sin embargo, nuestras mediciones de control lo descartan."],
        ["I don't have the exact figure here, but it's of the order of ten percent.", "No tengo la cifra exacta aquí, pero es del orden del diez por ciento."],
        ["To be honest, I'm not sure. I'd be happy to follow up after the session.", "Para ser honesto, no estoy seguro. Con gusto le respondo después de la sesión."],
        ["That's slightly beyond the scope of this work, but...", "Eso está un poco fuera del alcance de este trabajo, pero…"],
        ["With respect, I'd argue that the model still holds in this regime.", "Con todo respeto, yo diría que el modelo sigue siendo válido en este régimen."],
        ["Although the sample is small, the trend is consistent.", "Aunque la muestra es pequeña, la tendencia es consistente."],
        ["Despite the noise, the peak is clearly visible.", "A pesar del ruido, el pico es claramente visible."],
        ["Could you elaborate on what you mean by 'systematic'?", "¿Podría ampliar a qué se refiere con «sistemático»?"],
      ],
      ex: [
        ["mc", "___ the noise, the peak is visible.", ["Despite", "Although", "Despite of"], 0, "Despite + sustantivo."],
        ["mc", "Correcto:", ["Although it's small, but it's useful.", "Although it's small, it's useful."], 1, "No se combinan although y but."],
        ["gap", "That's a ___ point. However, our data show otherwise. (válido)", ["fair", "good", "valid"], ""],
        ["gap", "If I ___ correctly, you're asking about the calibration.", ["understand"], ""],
        ["mc", "«Beyond the scope of this work» significa:", ["fuera del alcance de este trabajo", "más allá del telescopio"], 0, ""],
        ["gap", "Could you ___ on that? (ampliar)", ["elaborate", "expand"], ""],
        ["mc", "Admitir que no sabes, de forma profesional:", ["I don't know.", "I'm not sure, but I'd be happy to look into it.", "No idea."], 1, ""],
        ["gap", "The model predicts a linear trend, ___ our data show saturation. (mientras que)", ["whereas", "while"], ""],
        ["order", "Let|me|think|about|it|for|a second.", "Déjeme pensarlo un segundo."],
        ["tr", "Es una buena pregunta; no tengo el dato exacto aquí.", ["That's a good question; I don't have the exact figure here", "That's a great question. I don't have the exact number here", "That's a good question. I don't have the exact data here", "That's a good question, I don't have the exact number here", "Good question, I don't have the exact figure here", "That's a good question. I don't have the exact figure with me", "That's a good question. I don't have the exact number with me"], ""],
        ["tr", "Aunque la muestra es pequeña, la tendencia es consistente.", ["Although the sample is small, the trend is consistent", "Even though the sample is small, the trend is consistent", "Although the sample size is small, the trend is consistent", "While the sample is small, the trend is consistent"], ""],
      ],
      dialogue: {
        ctx: "Ronda de preguntas tras la charla de Daniel. El profesor Hoffmann, investigador veterano, no está convencido.",
        lines: [
          ["Hoffmann", "Thank you for the talk. I'm not convinced the drift is thermal. Couldn't it be mechanical creep in the mounts?", "Gracias por la charla. No estoy convencido de que la deriva sea térmica. ¿No podría ser fluencia mecánica en los soportes?"],
          ["Daniel", "That's a fair point. We considered that. However, when we added the enclosure and kept the same mounts, the drift dropped by ninety percent.", "Es una observación válida. Lo consideramos. Sin embargo, cuando pusimos la caja y mantuvimos los mismos soportes, la deriva bajó un noventa por ciento."],
          ["Hoffmann", "But the enclosure also changes the air flow, doesn't it?", "Pero la caja también cambia el flujo de aire, ¿no?"],
          ["Daniel", "If I understand correctly, you're asking whether the enclosure also damped vibrations. That's possible, and to be honest, we can't completely rule it out yet.", "Si entiendo bien, pregunta si la caja también amortiguó vibraciones. Es posible y, para ser honesto, todavía no podemos descartarlo por completo."],
          ["Hoffmann", "So how would you separate the two effects?", "¿Entonces cómo separaría los dos efectos?"],
          ["Daniel", "Good question. We're planning to heat the enclosure deliberately and see if the drift follows the temperature. If it does, that would strongly support the thermal hypothesis.", "Buena pregunta. Planeamos calentar la caja a propósito y ver si la deriva sigue a la temperatura. Si lo hace, eso apoyaría fuertemente la hipótesis térmica."],
          ["Audience", "What's the noise floor in absolute units?", "¿Cuál es el nivel de ruido en unidades absolutas?"],
          ["Daniel", "I don't have the exact number on hand, but it's of the order of ten picometers per root hertz. I'd be happy to send you the data.", "No tengo el número exacto a mano, pero es del orden de diez picómetros por raíz de hertz. Con gusto le envío los datos."],
          ["Hoffmann", "Fair enough. I look forward to seeing the results.", "Me parece justo. Espero ver los resultados."],
          ["Daniel", "Thank you. I appreciate the feedback.", "Gracias. Agradezco los comentarios."],
        ],
      },
      mission: {
        who: "Un profesor veterano, exigente pero justo",
        role: "Professor Hoffmann, a tough but fair senior scientist in the audience after the learner's talk (on any topic the learner chooses). Ask hard, specific questions: artifacts, alternative explanations, sample size, generalization. Accept good answers graciously.",
        scene: "Después de tu charla, un profesor experimentado cuestiona tu trabajo con preguntas difíciles. Responde con diplomacia y precisión.",
        goals: ["Gana tiempo con elegancia", "Aclara la pregunta (If I understand correctly…)", "Concede y contraargumenta (fair point… however…)", "Admite una limitación y ofrece seguimiento"],
        start: "Thank you for your presentation. I have to say, I'm not fully convinced by your main conclusion. How do you know your result isn't just an artifact of your measurement setup?",
        guided: [
          ["How do you know your result isn't an artifact of your setup?", "That's a great question. Let me think about it for a second. We repeated the measurement with a different detector and got the same result."],
          ["But you changed only one thing. What about temperature?", "If I understand correctly, you're asking whether temperature changes could explain it. That's a fair point. However, the lab temperature was stable within 0.5 degrees."],
          ["Your sample is very small.", "I concede that the sample is small. Although we only had ten measurements, the trend was consistent in all of them."],
          ["Would it work in other materials?", "To be honest, that's beyond the scope of this work, but it's a great idea. I'd be happy to follow up after the session."],
        ],
      },
      links: [
        ["Academic Phrasebank: comparar y contrastar", "https://www.phrasebank.manchester.ac.uk/compare-and-contrast/", "Conectores de contraste y concesión en contexto académico.", "Frases,Escritura"],
        ["Academic Phrasebank: ser crítico", "https://www.phrasebank.manchester.ac.uk/being-critical/", "Lenguaje para cuestionar y responder críticas.", "Frases"],
        ["BBC Towards Advanced", "https://www.bbc.co.uk/learningenglish/english/course/towards-advanced", "Lecciones de nivel avanzado.", "Escuchar"],
        ["Lex Fridman Podcast (YouTube)", "https://www.youtube.com/@lexfridman", "Conversaciones largas con científicos: preguntas difíciles y respuestas matizadas.", "Escuchar,Física"],
      ],
    },
    /* ---------------- C1·4 ---------------- */
    {
      title: "Escritura formal: emails y papers", en: "I am writing to follow up on...",
      goal: "escribir emails formales efectivos y usar el registro correcto en textos académicos.",
      focus: "formal register: email openings, requests (I would be grateful if), attachments, follow-ups, closings; responses to reviewers; formal vs informal vocabulary",
      grammar: `
<h3>Estructura de un email formal</h3>
<div class="tbl"><table>
<tr><th>Parte</th><th>Frases</th></tr>
<tr><td>Saludo</td><td><em>Dear Dr. Weber,</em> · <em>Dear Professor Lindqvist,</em> (con apellido)</td></tr>
<tr><td>Apertura</td><td><em>I hope this email finds you well.</em> (opcional)</td></tr>
<tr><td>Propósito</td><td><em>I am writing to follow up on our conversation last week.</em> · <em>I am writing to request…</em></td></tr>
<tr><td>Pedido</td><td><em>I would be grateful if you could send me…</em> · <em>Could you please let me know…?</em> · <em>Would it be possible to…?</em></td></tr>
<tr><td>Adjuntos</td><td><em>Please find attached the revised manuscript.</em></td></tr>
<tr><td>Cierre</td><td><em>Thank you in advance for your help.</em> · <em>I look forward to hearing from you.</em></td></tr>
<tr><td>Despedida</td><td><em>Kind regards,</em> · <em>Best regards,</em> · <em>Sincerely,</em></td></tr>
</table></div>
<div class="ojo"><p>Calcos del español que suenan raros: <del>Estimated Dr.</del> → <em>Dear Dr.</em> · <del>Waiting for your answer.</del> → <em>I look forward to hearing from you.</em> · <del>Dear Mr. Sarah</del> → <em>Dear Dr. Chen</em> (título + apellido).</p></div>
<h3>Registro formal en textos académicos</h3>
<div class="tbl"><table>
<tr><th>Informal</th><th>Formal</th></tr>
<tr><td>get</td><td><em>obtain</em></td></tr>
<tr><td>find out</td><td><em>determine</em></td></tr>
<tr><td>show</td><td><em>demonstrate</em></td></tr>
<tr><td>a lot of</td><td><em>considerable, substantial</em></td></tr>
<tr><td>about</td><td><em>approximately</em></td></tr>
<tr><td>look into</td><td><em>investigate</em></td></tr>
<tr><td>don't, can't</td><td><em>do not, cannot</em> (sin contracciones)</td></tr>
</table></div>
<h3>Responder a revisores</h3>
<ul class="ex">
<li><em>We thank the reviewer for this insightful comment.</em></li>
<li><em>We have revised the manuscript accordingly.</em></li>
<li><em>As suggested, we have added a discussion of systematic errors (p. 7).</em></li>
<li><em>We respectfully disagree with this point, for the following reasons.</em></li>
</ul>`,
      sound: {
        t: "Leer abreviaturas en voz alta",
        tip: "Al leer un texto en voz alta (o citar en una charla), las abreviaturas se expanden: <i>e.g.</i> = «for example», <i>i.e.</i> = «that is», <i>et al.</i> = «et AL», <i>Fig.</i> = «figure», <i>Eq.</i> = «equation», <i>vs.</i> = «versus», <i>approx.</i> = «approximately».",
        w: ["for example", "that is", "et al.", "figure", "equation", "versus"],
      },
      vocab: [
        ["attached", "adjunto", "Please find attached the report."],
        ["regarding", "con respecto a", "I'm writing regarding your application."],
        ["follow up", "dar seguimiento", "I'm writing to follow up on our meeting."],
        ["grateful", "agradecido", "I would be grateful if you could help."],
        ["request", "solicitar; solicitud", "I am writing to request an extension."],
        ["revise", "revisar y corregir", "We have revised the manuscript."],
        ["submit", "enviar, someter", "We will submit the paper next month."],
        ["manuscript", "manuscrito", "Please find attached the revised manuscript."],
        ["reviewer", "revisor, árbitro", "We thank the reviewer for the comment."],
        ["accordingly", "en consecuencia", "We have changed the text accordingly."],
        ["availability", "disponibilidad", "Could you let me know your availability?"],
        ["deadline extension", "extensión del plazo", "I would like to request a deadline extension."],
      ],
      phrases: [
        ["Dear Dr. Weber,", "Estimada doctora Weber:"],
        ["I hope this email finds you well.", "Espero que se encuentre bien."],
        ["I am writing to follow up on our conversation last week.", "Le escribo para dar seguimiento a nuestra conversación de la semana pasada."],
        ["I would be grateful if you could send me the calibration data.", "Le agradecería si pudiera enviarme los datos de calibración."],
        ["Please find attached the revised manuscript.", "Adjunto encontrará el manuscrito revisado."],
        ["Could you please let me know your availability next week?", "¿Podría indicarme su disponibilidad la próxima semana?"],
        ["We thank the reviewer for this insightful comment.", "Agradecemos al revisor este comentario tan acertado."],
        ["We have revised the manuscript accordingly.", "Hemos revisado el manuscrito en consecuencia."],
        ["I look forward to hearing from you.", "Quedo atento a su respuesta."],
        ["Kind regards, Daniel Ruiz", "Saludos cordiales, Daniel Ruiz"],
      ],
      ex: [
        ["mc", "Saludo formal:", ["Dear Dr. Weber,", "Estimated Dr. Weber,", "Hi Weber!"], 0, ""],
        ["mc", "Cierre natural:", ["Waiting for your answer.", "I look forward to hearing from you.", "I wait your response."], 1, ""],
        ["gap", "Please find ___ the revised manuscript.", ["attached"], ""],
        ["gap", "I would be ___ if you could send me the data. (agradecido)", ["grateful"], ""],
        ["mc", "Equivalente formal de «find out»:", ["determine", "find up", "discover out"], 0, ""],
        ["mc", "Equivalente formal de «a lot of»:", ["considerable", "lots", "plenty"], 0, ""],
        ["gap", "I am writing to follow ___ on our meeting.", ["up"], ""],
        ["mc", "«i.e.» se lee:", ["for example", "that is", "and so on"], 1, ""],
        ["order", "We|thank|the reviewer|for|this insightful comment.", "Agradecemos al revisor este comentario tan acertado."],
        ["tr", "Le escribo para solicitar una extensión del plazo.", ["I am writing to request an extension of the deadline", "I am writing to request a deadline extension", "I am writing to ask for an extension of the deadline", "I am writing to request an extension to the deadline", "I am writing to ask for a deadline extension", "I'm writing to request a deadline extension"], ""],
        ["tr", "¿Podría indicarme su disponibilidad la próxima semana?", ["Could you please let me know your availability next week?", "Could you let me know your availability next week?", "Could you please tell me your availability next week?", "Could you let me know your availability for next week?", "Could you please let me know your availability for next week?", "Could you please indicate your availability next week?"], ""],
      ],
      dialogue: {
        ctx: "Antes de enviar un email a la doctora Weber, Daniel se lo lee a Sarah para que lo revise.",
        lines: [
          ["Sarah", "Let me see your email to Dr. Weber before you send it.", "Déjame ver tu email a la doctora Weber antes de que lo envíes."],
          ["Daniel", "Sure. It starts: 'Hi Weber, I need the calibration data ASAP.'", "Claro. Empieza: «Hola Weber, necesito los datos de calibración lo antes posible»."],
          ["Sarah", "Hmm. That's a bit too direct for someone you've met once. Try: 'Dear Dr. Weber, I hope this email finds you well.'", "Mmm. Es demasiado directo para alguien a quien viste una vez. Prueba: «Estimada doctora Weber, espero que se encuentre bien»."],
          ["Daniel", "OK. Then: 'I am writing to follow up on our conversation last week.'", "Bien. Luego: «Le escribo para dar seguimiento a nuestra conversación de la semana pasada»."],
          ["Sarah", "Good. Now the request.", "Bien. Ahora el pedido."],
          ["Daniel", "'I would be grateful if you could send me the calibration data for your setup.'", "«Le agradecería si pudiera enviarme los datos de calibración de su montaje»."],
          ["Sarah", "Perfect. Maybe add why you need it, and a soft deadline.", "Perfecto. Quizás añade por qué lo necesitas y un plazo suave."],
          ["Daniel", "'We would like to compare it with our results before the conference in March. Would it be possible to receive it by the end of February?'", "«Nos gustaría compararlos con nuestros resultados antes del congreso de marzo. ¿Sería posible recibirlos a finales de febrero?»"],
          ["Sarah", "Very nice. And the ending?", "Muy bien. ¿Y el final?"],
          ["Daniel", "'Thank you in advance for your help. I look forward to hearing from you. Kind regards, Daniel.'", "«Gracias de antemano por su ayuda. Quedo atento a su respuesta. Saludos cordiales, Daniel»."],
          ["Sarah", "That's an email she'll actually answer.", "Ese es un email que sí va a responder."],
        ],
      },
      mission: {
        who: "Una profesora que recibe tu email",
        role: "Professor Lindqvist, a senior professor and journal editor. The learner writes a formal email (asking for data, requesting a deadline extension, answering a reviewer, or asking about a postdoc position). First reply briefly in character as the recipient would; then add one line starting with 'Editor's note:' with specific advice on register and structure.",
        scene: "Escribe un email formal completo: pedir datos, pedir una extensión de plazo, responder a un revisor o contactar a un profesor por un posdoctorado. La profesora te responde y te da una nota de estilo.",
        goals: ["Saludo formal (Dear + título + apellido)", "Propósito claro (I am writing to…)", "Pedido cortés (I would be grateful if… / Could you please…)", "Cierre y despedida formales"],
        start: "Hello. I'm Professor Lindqvist. I understand you'd like to contact me. Please write your email below, exactly as you would send it.",
        guided: [
          ["How would you start an email to a professor you don't know?", "Dear Professor Lindqvist, I hope this email finds you well."],
          ["How do you state your purpose?", "I am writing to ask whether there are any postdoctoral positions available in your group."],
          ["How do you make a polite request?", "I would be grateful if you could let me know about any opportunities. Please find attached my CV."],
          ["How do you close the email?", "Thank you for your time and consideration. I look forward to hearing from you. Kind regards, Daniel Ruiz."],
        ],
      },
      links: [
        ["Academic Phrasebank: introducir tu trabajo", "https://www.phrasebank.manchester.ac.uk/introducing-work/", "Frases para la introducción de un artículo.", "Frases,Escritura"],
        ["Academic Phrasebank: conclusiones", "https://www.phrasebank.manchester.ac.uk/writing-conclusions/", "Frases para cerrar un artículo.", "Frases,Escritura"],
        ["Purdue OWL", "https://owl.purdue.edu/", "Guía de referencia de escritura académica y profesional.", "Escritura"],
        ["Write & Improve (Cambridge)", "https://writeandimprove.com/", "Escribe textos y recibe corrección automática gratuita.", "Escritura"],
      ],
    },
    /* ---------------- C1·5 ---------------- */
    {
      title: "Énfasis e inversión", en: "Not only did the noise drop, but...",
      goal: "dar énfasis y fuerza retórica a tus ideas, al hablar y al escribir.",
      focus: "inversion after negative adverbials (never, not only, only when, rarely, under no circumstances), cleft sentences (it was... that, what... was), emphatic do",
      grammar: `
<h3>Inversión: orden de pregunta para dar fuerza</h3>
<p>Tras ciertas expresiones negativas o restrictivas al inicio, el verbo auxiliar va <b>antes</b> del sujeto. Es formal y retórico:</p>
<ul class="ex">
<li><em>Never have I seen such a clean spectrum.</em> <span class="es">— Nunca había visto un espectro tan limpio.</span></li>
<li><em>Not only did the noise drop, but the signal also doubled.</em></li>
<li><em>Only when we cooled the sample did the peak appear.</em></li>
<li><em>Rarely do we see such a strong effect.</em></li>
<li><em>Under no circumstances should you open the chamber while it's hot.</em></li>
</ul>
<div class="ojo"><p>Si no hay auxiliar, se usa <b>do / does / did</b>: <del>Not only the noise dropped…</del> → <em>Not only did the noise drop…</em></p></div>
<h3>Oraciones hendidas (cleft sentences)</h3>
<p>Muy frecuentes al hablar. Ponen el foco en un elemento:</p>
<ul class="ex">
<li><em>It was the cable that caused the problem, not the laser.</em> <span class="es">— Fue el cable lo que causó el problema.</span></li>
<li><em>What we found was completely unexpected.</em> <span class="es">— Lo que encontramos fue totalmente inesperado.</span></li>
<li><em>What I mean is that we need more data.</em> <span class="es">— Lo que quiero decir es que…</span></li>
<li><em>The thing is, we don't have enough time.</em></li>
</ul>
<h3>El do enfático</h3>
<p>Para insistir o contradecir: <em>We did check the calibration — twice.</em> <span class="es">— Sí revisamos la calibración.</span> · <em>I do understand your concern.</em></p>`,
      sound: {
        t: "El acento enfático",
        tip: "En estas estructuras, el énfasis se oye: acentúa con fuerza la palabra que contrasta. <i>We DID check it.</i> · <i>What we FOUND was…</i> · <i>It was the CABLE that failed.</i> Sin ese acento, la estructura pierde su efecto.",
        w: ["We did check it.", "What we found was surprising.", "It was the cable that failed.", "Never have I seen such a clean result.", "Not only did it work, it was fast."],
      },
      vocab: [
        ["remarkably", "notablemente", "The results were remarkably consistent."],
        ["strikingly", "sorprendentemente", "The effect is strikingly large."],
        ["crucially", "de forma crucial", "Crucially, the effect disappears above 20 K."],
        ["notably", "en particular, notablemente", "Notably, no drift was observed."],
        ["indeed", "de hecho, en efecto", "Indeed, the model predicts this."],
        ["not only... but also", "no solo... sino también", "Not only is it faster, but it's also cheaper."],
        ["by no means", "de ninguna manera", "It is by no means a small effect."],
        ["under no circumstances", "bajo ninguna circunstancia", "Under no circumstances touch the beam."],
        ["the thing is", "lo que pasa es que", "The thing is, we need more time."],
        ["the point is", "la cuestión es", "The point is that it works."],
        ["what matters is", "lo que importa es", "What matters is reproducibility."],
        ["breakthrough", "avance decisivo", "This could be a real breakthrough."],
      ],
      phrases: [
        ["Not only did the noise drop, but the signal also doubled.", "No solo bajó el ruido, sino que la señal se duplicó."],
        ["Never have I seen such a clean spectrum.", "Nunca había visto un espectro tan limpio."],
        ["Only when we cooled the sample did the peak appear.", "Solo cuando enfriamos la muestra apareció el pico."],
        ["Under no circumstances should you open the chamber while it's hot.", "Bajo ninguna circunstancia debes abrir la cámara mientras está caliente."],
        ["What we found was completely unexpected.", "Lo que encontramos fue completamente inesperado."],
        ["It was the cable that caused the problem, not the laser.", "Fue el cable el que causó el problema, no el láser."],
        ["What I mean is that we need more data.", "Lo que quiero decir es que necesitamos más datos."],
        ["We did check the calibration, twice.", "Sí revisamos la calibración, dos veces."],
        ["The thing is, we don't have enough time.", "Lo que pasa es que no tenemos suficiente tiempo."],
        ["Crucially, the effect disappears above 20 kelvin.", "Lo crucial es que el efecto desaparece por encima de 20 kelvin."],
      ],
      ex: [
        ["mc", "Never ___ such a clean result.", ["I have seen", "have I seen", "I saw"], 1, "Inversión tras never."],
        ["gap", "Not only ___ the noise drop, but the signal also doubled.", ["did"], "Sin auxiliar: did."],
        ["mc", "Only when we cooled the sample ___ the peak appear.", ["did", "does", "has"], 0, ""],
        ["gap", "___ we found was completely unexpected.", ["What"], "Cleft con what."],
        ["mc", "Cleft correcta:", ["It was the cable that caused the problem.", "It was the cable what caused the problem."], 0, ""],
        ["gap", "Under no circumstances ___ you open the chamber while it's hot.", ["should"], ""],
        ["gap", "Rarely ___ we see such a strong effect.", ["do"], ""],
        ["mc", "Énfasis: «Sí revisamos la calibración»", ["We checked the calibration.", "We did check the calibration.", "We do checked the calibration."], 1, ""],
        ["order", "Only|then|did|the peak|appear.", "Solo entonces apareció el pico."],
        ["tr", "Lo que encontramos fue sorprendente.", ["What we found was surprising", "What we found was astonishing", "What we found was remarkable", "What we discovered was surprising"], ""],
        ["tr", "No solo bajó el ruido, sino que la señal se duplicó.", ["Not only did the noise drop, but the signal also doubled", "Not only did the noise decrease, but the signal also doubled", "Not only did the noise drop, but also the signal doubled", "Not only did the noise go down, but the signal also doubled", "Not only did the noise drop, the signal also doubled", "Not only did the noise decrease, the signal also doubled", "Not only did the noise fall, but the signal also doubled"], ""],
      ],
      dialogue: {
        ctx: "Nueve de la mañana. Daniel acaba de ver los datos de la medición nocturna y se lo cuenta a Priya.",
        lines: [
          ["Priya", "So? How did the night run go?", "¿Y? ¿Cómo salió la medición nocturna?"],
          ["Daniel", "You won't believe it. Not only did the drift disappear, but the sensitivity also improved by a factor of three.", "No lo vas a creer. No solo desapareció la deriva, sino que la sensibilidad mejoró en un factor de tres."],
          ["Priya", "No way! What changed?", "¡No puede ser! ¿Qué cambió?"],
          ["Daniel", "It was the second enclosure that made the difference. What we didn't expect was how much the air currents mattered.", "Fue la segunda caja la que marcó la diferencia. Lo que no esperábamos era cuánto importaban las corrientes de aire."],
          ["Priya", "So Hoffmann was partly right about the mechanical effects?", "¿Entonces Hoffmann tenía algo de razón con los efectos mecánicos?"],
          ["Daniel", "He was. And I did tell him I'd send him the data. Now I actually have something to send.", "La tenía. Y sí le dije que le enviaría los datos. Ahora sí tengo algo que enviar."],
          ["Priya", "Never have I seen you this happy at nine a.m.", "Nunca te había visto tan feliz a las nueve de la mañana."],
          ["Daniel", "Only when I saw the plot did I realize we had it.", "Solo cuando vi la gráfica me di cuenta de que lo habíamos logrado."],
          ["Priya", "What you need now is sleep. And then a paper.", "Lo que necesitas ahora es dormir. Y después, un artículo."],
          ["Daniel", "What I need now is coffee. The paper can wait until noon.", "Lo que necesito ahora es café. El artículo puede esperar hasta el mediodía."],
        ],
      },
      mission: {
        who: "Una periodista que busca una frase memorable",
        role: "Maya, a science journalist writing a feature about a scientific discovery (the learner's own result or a famous one: the Higgs boson, gravitational waves, the first black hole image, high-temperature superconductivity). She wants dramatic, quotable sentences.",
        scene: "Una periodista quiere una frase memorable sobre un hallazgo (tuyo o famoso: el bosón de Higgs, las ondas gravitacionales…). Usa énfasis e inversión.",
        goals: ["Usa una oración hendida (What… was / It was… that)", "Usa una inversión (Not only / Never / Only when)", "Usa el do enfático", "Explica por qué importó el hallazgo"],
        start: "I'm writing a piece about a big scientific discovery. Tell me: what was the most surprising part, and why did it matter so much?",
        guided: [
          ["What was the most surprising part?", "What surprised everyone was how clean the signal of the gravitational waves was."],
          ["Why did it matter so much?", "Not only did it confirm Einstein's prediction, but it also opened a new way to observe the universe."],
          ["Some people doubted it at first.", "They did doubt it, and that's healthy. Only when a second detector saw the same signal did people really believe it."],
          ["Give me a line for the headline.", "Never had we heard the universe like that before."],
        ],
      },
      links: [
        ["Inversion (Perfect English Grammar)", "https://www.perfect-english-grammar.com/inversion.html", "Todas las estructuras de inversión con ejercicios.", "Gramática"],
        ["Inversion (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/inversion", "Referencia completa.", "Gramática"],
        ["Cleft sentences (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/cleft-sentences", "It was… that, What… was.", "Gramática"],
        ["Emphasis (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/emphasis", "Recursos de énfasis en inglés hablado y escrito.", "Gramática"],
      ],
    },
    /* ---------------- C1·6 ---------------- */
    {
      title: "Explicar física a no especialistas", en: "Think of it like...",
      goal: "explicar ideas complejas con analogías, lenguaje sencillo y comprobando que te entienden.",
      focus: "explaining to non-experts: analogies (think of it like, imagine), simplifying (in simple terms, in a nutshell), defining jargon, checking understanding, handling misconceptions",
      grammar: `
<h3>La caja de herramientas del divulgador</h3>
<div class="tbl"><table>
<tr><th>Función</th><th>Frases</th></tr>
<tr><td>Analogía</td><td><em>Think of it like a ripple on a pond.</em> · <em>It's a bit like…</em> · <em>Imagine…</em></td></tr>
<tr><td>Simplificar</td><td><em>In simple terms, …</em> · <em>Basically, …</em> · <em>In a nutshell, …</em> · <em>Roughly speaking, …</em></td></tr>
<tr><td>Definir jerga</td><td><em>…entanglement, which basically means that two particles share a single state.</em></td></tr>
<tr><td>Comprobar</td><td><em>Does that make sense so far?</em> · <em>Are you with me?</em></td></tr>
<tr><td>Reformular</td><td><em>Let me put it another way.</em> · <em>In other words, …</em></td></tr>
<tr><td>Corregir un mito</td><td><em>A common misconception is that heavier objects fall faster.</em> · <em>Actually, it's the other way around.</em></td></tr>
<tr><td>Enganchar</td><td><em>Here's the mind-blowing part.</em> · <em>It sounds counterintuitive, but…</em></td></tr>
</table></div>
<h3>Gramática al servicio de la claridad</h3>
<ul>
<li><b>«You» y «we» genéricos</b> en vez de la pasiva: <em>If you heat a gas, it expands.</em></li>
<li><b>Condicionales para experimentos mentales:</b> <em>If you could shrink down to the size of an atom, you would see…</em></li>
<li><b>Frases cortas.</b> Una idea por frase.</li>
</ul>
<div class="ojo"><p><em>Do you understand me?</em> puede sonar condescendiente. Mejor: <em>Does that make sense?</em> — pone la responsabilidad en tu explicación, no en el oyente.</p></div>
<div class="tip"><p>La técnica Feynman: si no puedes explicarlo con palabras simples, no lo entiendes del todo. Explicar física en inglés sencillo es, a la vez, la mejor práctica de inglés y de física.</p></div>`,
      sound: {
        t: "Habla conectada a velocidad natural",
        tip: "A velocidad natural, las palabras se funden: <i>what it does is</i> → «wa-di-DUZ-iz», <i>kind of</i> → «KAIN-də», <i>a lot of</i> → «ə-LA-də», <i>you know</i> → «yə-NOU». Pon la velocidad en «natural» (en Ajustes) y escucha varias veces.",
        w: ["What it does is...", "kind of", "a lot of", "sort of", "you know", "Does that make sense?"],
      },
      vocab: [
        ["analogy", "analogía", "Let me use an analogy."],
        ["misconception", "idea errónea", "It's a common misconception."],
        ["in a nutshell", "en pocas palabras", "In a nutshell, it's all about energy."],
        ["roughly speaking", "a grandes rasgos", "Roughly speaking, it doubles."],
        ["basically", "básicamente", "Basically, light is a wave."],
        ["counterintuitive", "contraintuitivo", "It sounds counterintuitive, but it's true."],
        ["mind-blowing", "alucinante", "Here's the mind-blowing part."],
        ["jargon", "jerga técnica", "Avoid jargon with a general audience."],
        ["layperson", "persona no especialista", "Explain it to a layperson."],
        ["thought experiment", "experimento mental", "Let's do a thought experiment."],
        ["picture", "imaginar, visualizar", "Picture a ball rolling down a hill."],
        ["outreach", "divulgación", "I love doing science outreach."],
      ],
      phrases: [
        ["Think of it like a ripple spreading across a pond.", "Piénsalo como una onda que se extiende en un estanque."],
        ["In simple terms, light behaves like both a wave and a particle.", "En términos simples, la luz se comporta como onda y como partícula."],
        ["Imagine you could shrink down to the size of an atom.", "Imagina que pudieras encogerte al tamaño de un átomo."],
        ["A common misconception is that heavier objects fall faster.", "Una idea errónea común es que los objetos más pesados caen más rápido."],
        ["Actually, it's the other way around.", "En realidad, es al revés."],
        ["Does that make sense so far?", "¿Tiene sentido hasta aquí?"],
        ["In a nutshell, temperature is just how fast the atoms are jiggling.", "En pocas palabras, la temperatura es qué tan rápido se agitan los átomos."],
        ["It sounds counterintuitive, but it's true.", "Suena contraintuitivo, pero es cierto."],
        ["Here's the mind-blowing part.", "Aquí viene lo alucinante."],
        ["Let me put it another way.", "Déjame decirlo de otra manera."],
      ],
      ex: [
        ["mc", "Para simplificar:", ["In a nutshell, …", "In a nut, …", "Summarizing short, …"], 0, ""],
        ["gap", "Think of it ___ a ripple on a pond.", ["like", "as"], ""],
        ["gap", "A common ___ is that heavy objects fall faster. (idea errónea)", ["misconception"], ""],
        ["mc", "Comprobar comprensión sin sonar condescendiente:", ["Do you understand me?", "Does that make sense so far?", "Understood?"], 1, ""],
        ["gap", "Let me put it ___ way.", ["another"], ""],
        ["mc", "«Counterintuitive» significa:", ["contraintuitivo", "contraproducente"], 0, ""],
        ["gap", "Actually, it's the other way ___.", ["around", "round"], ""],
        ["mc", "Mejor uso de la jerga con un público general:", ["Entanglement is when the wavefunction is non-separable.", "Entanglement, which basically means two particles share a single state, ..."], 1, ""],
        ["order", "Imagine|you|could|shrink down to|the size|of an atom.", "Imagina que pudieras encogerte al tamaño de un átomo."],
        ["tr", "En pocas palabras, la temperatura es qué tan rápido se mueven los átomos.", ["In a nutshell, temperature is how fast the atoms are moving", "In a nutshell, temperature is how fast atoms move", "In simple terms, temperature is how fast the atoms are moving", "In a nutshell, temperature is how fast the atoms move", "Basically, temperature is how fast the atoms are moving", "In short, temperature is how fast the atoms are moving", "In a nutshell, temperature is just how fast the atoms are moving", "In a nutshell, temperature is how fast atoms are moving"], ""],
        ["tr", "Suena contraintuitivo, pero es cierto.", ["It sounds counterintuitive, but it's true", "It sounds counterintuitive, but it is true", "It sounds counter-intuitive, but it's true", "It may sound counterintuitive, but it's true"], ""],
      ],
      dialogue: {
        ctx: "Jornada de puertas abiertas. Lily, de doce años, y su papá visitan el laboratorio.",
        lines: [
          ["Lily", "What do you do in your lab?", "¿Qué haces en tu laboratorio?"],
          ["Daniel", "I measure really, really tiny movements using light. Smaller than an atom!", "Mido movimientos muy, muy pequeños usando luz. ¡Más pequeños que un átomo!"],
          ["Lily", "How can light measure things?", "¿Cómo puede la luz medir cosas?"],
          ["Daniel", "Good question! Think of light like waves in a swimming pool. When two waves meet, they can add up or cancel out.", "¡Buena pregunta! Piensa en la luz como olas en una piscina. Cuando dos olas se encuentran, pueden sumarse o anularse."],
          ["Lily", "Like when my brother and I jump in at the same time?", "¿Como cuando mi hermano y yo saltamos al mismo tiempo?"],
          ["Daniel", "Exactly! If the waves meet just right, they get bigger. If not, they can disappear. By watching that, we can tell if something moved, even a tiny bit.", "¡Exacto! Si las olas se encuentran justo bien, se hacen más grandes. Si no, pueden desaparecer. Observando eso, sabemos si algo se movió, aunque sea un poquito."],
          ["Dad", "So it's like a super-sensitive ruler?", "¿Entonces es como una regla supersensible?"],
          ["Daniel", "That's a great way to put it. A ruler made of light.", "Es una gran forma de decirlo. Una regla hecha de luz."],
          ["Lily", "So is light a wave?", "¿Entonces la luz es una ola?"],
          ["Daniel", "Here's the mind-blowing part: sometimes it acts like a wave, and sometimes like tiny particles. Does that make sense?", "Aquí viene lo alucinante: a veces actúa como ola y a veces como partículas diminutas. ¿Tiene sentido?"],
          ["Lily", "Not really.", "No mucho."],
          ["Daniel", "Honestly? It doesn't fully make sense to physicists either. That's what makes it fun.", "¿Sinceramente? Tampoco tiene del todo sentido para los físicos. Eso es lo que lo hace divertido."],
        ],
      },
      mission: {
        who: "Una niña curiosa de doce años (y luego un adulto escéptico)",
        role: "Lily, a curious 12-year-old who asks the learner to explain something cool in physics and keeps asking 'But why?'. Use simple language. After four or five exchanges, her skeptical dad joins with one common misconception (for example, that heavier objects fall faster, or that seasons are caused by the distance to the Sun).",
        scene: "Explica un concepto de física (el que quieras: por qué el cielo es azul, qué es un láser, la entropía, la relatividad) a una niña curiosa. Luego su papá llega con una idea errónea.",
        goals: ["Usa una analogía (Think of it like… / Imagine…)", "Define una palabra técnica con palabras simples", "Comprueba que te entienden (Does that make sense?)", "Corrige una idea errónea con tacto"],
        start: "Hi! My teacher said you're a physicist. Can you explain something cool to me? Like... why is the sky blue?",
        guided: [
          ["Why is the sky blue?", "Great question! Sunlight looks white, but it's actually a mix of all colors, like a rainbow hiding inside."],
          ["So why do we only see blue?", "Think of the air like a pinball machine. Blue light bounces around much more than red light, so blue comes at us from every direction. Does that make sense?"],
          ["Kind of! And why are sunsets red?", "At sunset, light travels through much more air. Most of the blue bounces away, so the red and orange reach your eyes."],
          ["Dad: I thought the sky was blue because it reflects the ocean.", "That's a common misconception! Actually, it's the other way around: the ocean looks blue partly because it reflects the sky."],
        ],
      },
      links: [
        ["Richard Feynman: Physics is fun to imagine (TED)", "https://www.ted.com/talks/richard_feynman_physics_is_fun_to_imagine", "El gran explicador, con analogías cotidianas.", "Física,Escuchar"],
        ["MinutePhysics (YouTube)", "https://www.youtube.com/@minutephysics", "Explicaciones de física en lenguaje simple y rápido.", "Física"],
        ["The Infinite Monkey Cage (BBC)", "https://www.bbc.co.uk/programmes/b00snr0w", "Divulgación con humor: el inglés natural de los científicos británicos.", "Física,Escuchar"],
        ["Kurzgesagt (YouTube)", "https://www.youtube.com/@Kurzgesagt", "Ciencia animada con analogías brillantes.", "Física"],
      ],
    },
  ],
});
