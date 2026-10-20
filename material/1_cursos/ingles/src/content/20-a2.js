/* Nivel A2 · n = 2 · Na D 589 nm */
window.QLE_LEVELS = window.QLE_LEVELS || [];
window.QLE_LEVELS.push({
  id: "a2", code: "A2", n: 2, name: "Básico", nm: 589, line: "Na D",
  links: [
    ["BBC Learning English · Lower intermediate", "https://www.bbc.co.uk/learningenglish/english/course/lower-intermediate", "Curso completo y gratuito con videos, audio y ejercicios.", "A2,B1"],
    ["VOA Learning English", "https://learningenglish.voanews.com/", "Noticias leídas despacio, con texto completo.", "A2,B1"],
    ["News in Levels · nivel 2", "https://www.newsinlevels.com/level/level-2/", "La misma noticia con un poco más de complejidad.", "A2"],
    ["English with Lucy (YouTube)", "https://www.youtube.com/@EnglishwithLucy", "Gramática, vocabulario y pronunciación (acento británico).", "A2,B1,B2"],
  ],
  units: [
    /* ---------------- A2·1 ---------------- */
    {
      title: "Lo que hiciste", en: "What did you do last weekend?",
      goal: "contar lo que hiciste ayer, el fin de semana o hace años, y preguntar a otros.",
      focus: "past simple: regular -ed and common irregular verbs, did / didn't, time expressions (ago, last)",
      grammar: `
<h3>Pasado simple: acciones terminadas</h3>
<p>Para hechos terminados en un momento del pasado. Los verbos regulares agregan <b>-ed</b>; la forma es igual para todas las personas:</p>
<ul class="ex">
<li><em>I worked late yesterday.</em> <span class="es">— Trabajé hasta tarde ayer.</span></li>
<li><em>We measured the voltage twice.</em> <span class="es">— Medimos el voltaje dos veces.</span></li>
</ul>
<h3>Los irregulares más útiles</h3>
<div class="tbl"><table>
<tr><th>Base</th><th>Pasado</th><th>Base</th><th>Pasado</th></tr>
<tr><td>go</td><td><em>went</em></td><td>see</td><td><em>saw</em></td></tr>
<tr><td>have</td><td><em>had</em></td><td>make</td><td><em>made</em></td></tr>
<tr><td>take</td><td><em>took</em></td><td>get</td><td><em>got</em></td></tr>
<tr><td>come</td><td><em>came</em></td><td>write</td><td><em>wrote</em></td></tr>
<tr><td>find</td><td><em>found</em></td><td>buy</td><td><em>bought</em></td></tr>
<tr><td>think</td><td><em>thought</em></td><td>leave</td><td><em>left</em></td></tr>
</table></div>
<h3>Negativo y preguntas con DID</h3>
<p>Con <b>did / didn't</b> el verbo vuelve a su forma base: el pasado ya está en «did».</p>
<ul class="ex">
<li><em>I didn't see the email.</em> <span class="es">— No vi el correo.</span></li>
<li><em>Did you go to the seminar?</em> — <em>Yes, I did.</em></li>
<li><em>Where did you study?</em> <span class="es">— ¿Dónde estudiaste?</span></li>
</ul>
<div class="ojo"><p><del>Did you went?</del> → <em>Did you go?</em> · <del>I didn't saw it.</del> → <em>I didn't see it.</em></p></div>
<h3>Expresiones de tiempo</h3>
<p><em>yesterday</em>, <em>last week</em>, <em>last year</em>, <em>in 2019</em>, <em>two days ago</em>. Ojo con <b>ago</b>: va <b>después</b> del tiempo. «Hace dos años» → <em>two years ago</em>.</p>`,
      sound: {
        t: "Las tres formas de -ed",
        tip: "La terminación <b>-ed</b> casi nunca suena «ed». Suena <b>/t/</b> después de sonidos sordos (<i>worked</i> = «workt»), <b>/d/</b> después de sonoros (<i>measured</i> = «méshurd») y solo suena <b>/ɪd/</b> después de t o d (<i>wanted, needed</i>). Decir «work-ed» es uno de los errores más reconocibles de los hispanohablantes.",
        w: ["worked", "stopped", "measured", "played", "wanted", "needed", "started"],
      },
      vocab: [
        ["go → went", "ir → fui, fue", "I went to the mountains."],
        ["have → had", "tener → tuve", "We had a great time."],
        ["see → saw", "ver → vi", "I saw a great movie."],
        ["take → took", "tomar, llevar → tomé", "I took a lot of photos."],
        ["write → wrote", "escribir → escribí", "She wrote ten pages."],
        ["buy → bought", "comprar → compré", "They bought a new laser."],
        ["find → found", "encontrar → encontré", "I found the problem."],
        ["leave → left", "salir, dejar → salí", "He left at six."],
        ["yesterday", "ayer", "I worked late yesterday."],
        ["ago", "hace (tiempo)", "I arrived two weeks ago."],
        ["last weekend", "el fin de semana pasado", "What did you do last weekend?"],
        ["stay home", "quedarse en casa", "I stayed home and relaxed."],
      ],
      phrases: [
        ["What did you do last weekend?", "¿Qué hiciste el fin de semana pasado?"],
        ["I went hiking with some friends.", "Fui de caminata con unos amigos."],
        ["How was your weekend?", "¿Qué tal tu fin de semana?"],
        ["It was great, thanks!", "¡Estuvo genial, gracias!"],
        ["I didn't do much. I just relaxed.", "No hice mucho. Solo descansé."],
        ["When did you arrive?", "¿Cuándo llegaste?"],
        ["I arrived two weeks ago.", "Llegué hace dos semanas."],
        ["Where did you study?", "¿Dónde estudiaste?"],
        ["I studied Engineering Physics at the University of Cauca.", "Estudié Ingeniería Física en la Universidad del Cauca."],
        ["That sounds fun!", "¡Suena divertido!"],
      ],
      ex: [
        ["mc", "Did you ___ the email?", ["send", "sent", "sending"], 0, "Después de did, verbo en forma base."],
        ["gap", "Yesterday I ___ (go) to the lab early.", ["went"], "Pasado irregular de go."],
        ["gap", "We ___ the experiment. (negativo de finish)", ["didn't finish", "did not finish"], ""],
        ["mc", "«Hace tres años»", ["three years ago", "ago three years", "before three years"], 0, "Ago va después del tiempo."],
        ["gap", "She ___ (write) the report last night.", ["wrote"], ""],
        ["mc", "¿Cómo suena la -ed de «wanted»?", ["/t/", "/d/", "/ɪd/"], 2, "Después de t o d suena /ɪd/."],
        ["mc", "¿Cómo suena la -ed de «worked»?", ["/t/", "/d/", "/ɪd/"], 0, "Después del sonido sordo /k/ suena /t/."],
        ["gap", "They ___ (buy) a new laser in 2024.", ["bought"], ""],
        ["order", "Where|did|you|study?", "¿Dónde estudiaste?"],
        ["tr", "Llegué hace dos semanas.", ["I arrived two weeks ago", "I got here two weeks ago", "I came two weeks ago", "I arrived 2 weeks ago"], ""],
        ["tr", "No vi la presentación.", ["I didn't see the presentation", "I did not see the presentation", "I didn't see the talk", "I missed the presentation", "I missed the talk"], ""],
      ],
      dialogue: {
        ctx: "Lunes por la mañana. Priya le pregunta a Daniel por su fin de semana en Boulder.",
        lines: [
          ["Priya", "Morning, Daniel! How was your weekend?", "¡Buenos días, Daniel! ¿Qué tal tu fin de semana?"],
          ["Daniel", "It was great, thanks. On Saturday I went to Chautauqua Park.", "Genial, gracias. El sábado fui al parque Chautauqua."],
          ["Priya", "Oh, nice! Did you hike the Flatirons?", "¡Qué bien! ¿Subiste a los Flatirons?"],
          ["Daniel", "Yes, I did. The view was amazing. I took a lot of photos.", "Sí. La vista era increíble. Tomé muchas fotos."],
          ["Priya", "And what did you do on Sunday?", "¿Y qué hiciste el domingo?"],
          ["Daniel", "Not much. I called my family and cooked some Colombian food. What about you?", "No mucho. Llamé a mi familia y cociné comida colombiana. ¿Y tú?"],
          ["Priya", "I stayed home and worked on my thesis. I wrote ten pages!", "Me quedé en casa trabajando en mi tesis. ¡Escribí diez páginas!"],
          ["Daniel", "Wow, that's productive!", "¡Uf, qué productiva!"],
          ["Priya", "Well, I also watched three movies.", "Bueno, también vi tres películas."],
          ["Daniel", "Ha! That sounds like a good balance.", "¡Ja! Suena a un buen equilibrio."],
        ],
      },
      mission: {
        who: "Priya, un lunes por la mañana",
        role: "Priya, a friendly colleague, asking about the learner's weekend on Monday morning. Show interest and ask follow-up questions in the past simple.",
        scene: "Es lunes. Tu colega te pregunta por tu fin de semana. Cuenta al menos tres cosas que hiciste.",
        goals: ["Usa tres verbos en pasado", "Usa al menos un verbo irregular", "Usa una expresión de tiempo (last, ago, on Saturday)", "Pregúntale por su fin de semana"],
        start: "Good morning! How was your weekend? Did you do anything fun?",
        guided: [
          ["How was your weekend? Did you do anything fun?", "It was great, thanks! On Saturday I went to the park with my family."],
          ["Nice! What did you do there?", "We walked a lot and had lunch at a small restaurant."],
          ["And on Sunday?", "I stayed home, prepared my classes and watched a movie."],
          ["Sounds relaxing!", "It was. What about you? What did you do?"],
        ],
      },
      links: [
        ["Past simple (Perfect English Grammar)", "https://www.perfect-english-grammar.com/past-simple.html", "Reglas y ejercicios del pasado simple.", "Gramática"],
        ["Lista de verbos irregulares (EnglishPage)", "https://www.englishpage.com/irregularverbs/irregularverbs.html", "La lista completa, para consultar.", "Gramática"],
        ["BBC 6 Minute English", "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", "Episodios de 6 minutos sobre temas interesantes, con transcripción.", "Escuchar"],
        ["YouGlish: «last weekend»", "https://youglish.com/pronounce/last%20weekend/english", "Nativos contando qué hicieron.", "Frases"],
      ],
    },
    /* ---------------- A2·2 ---------------- */
    {
      title: "Ahora mismo", en: "I'm working on it",
      goal: "explicar qué estás haciendo en este momento y distinguirlo de lo que haces siempre.",
      focus: "present continuous vs present simple, stative verbs",
      grammar: `
<h3>Presente continuo: lo que pasa ahora</h3>
<div class="formula">am / is / are + verbo-ing</div>
<ul class="ex">
<li><em>I'm aligning the laser right now.</em> <span class="es">— Estoy alineando el láser ahora.</span></li>
<li><em>She's talking on the phone.</em> <span class="es">— Está hablando por teléfono.</span></li>
<li><em>What are you working on?</em> <span class="es">— ¿En qué estás trabajando?</span></li>
</ul>
<p>También para situaciones temporales: <em>These days I'm reading a lot about photonics.</em></p>
<h3>¿Simple o continuo?</h3>
<div class="tbl"><table>
<tr><th>Presente simple</th><th>Presente continuo</th></tr>
<tr><td>Hábitos y hechos</td><td>Ahora, o temporal</td></tr>
<tr><td><em>Water boils at 100 °C.</em></td><td><em>Look! The water is boiling.</em></td></tr>
<tr><td><em>I usually work in the lab.</em></td><td><em>This week I'm working from home.</em></td></tr>
<tr><td><em>What do you do?</em> <span class="es">¿A qué te dedicas?</span></td><td><em>What are you doing?</em> <span class="es">¿Qué estás haciendo?</span></td></tr>
</table></div>
<h3>Verbos que no van en -ing</h3>
<p>Los verbos de estado (pensar, sentir, poseer) normalmente no se usan en continuo: <b>know, understand, want, need, like, believe, seem, mean, own</b>.</p>
<div class="ojo"><p><del>I'm knowing the answer.</del> → <em>I know the answer.</em> · <del>I'm understanding.</del> → <em>I understand.</em></p></div>
<p>Ortografía: <em>make → making</em>, <em>run → running</em>, <em>study → studying</em>.</p>`,
      sound: {
        t: "-ing: una n que suena en la garganta",
        tip: "La terminación <b>-ing</b> es /ɪŋ/: una sola nasal hecha con la parte de atrás de la lengua, como la n de «tengo» pero <b>sin</b> pronunciar la g. No digas «workingue». Compara <i>sin</i> y <i>sing</i>.",
        w: ["sin|sing", "thin|thing", "working", "thinking", "measuring", "running"],
      },
      vocab: [
        ["right now", "ahora mismo", "I'm busy right now."],
        ["at the moment", "en este momento", "She's in a meeting at the moment."],
        ["currently", "actualmente", "I'm currently working on a new setup."],
        ["these days", "estos días, últimamente", "These days I'm reading a lot."],
        ["work on", "trabajar en (un proyecto)", "What are you working on?"],
        ["align", "alinear", "I'm aligning the mirrors."],
        ["adjust", "ajustar", "Can you adjust the focus?"],
        ["fix", "arreglar", "Mike is fixing the pump."],
        ["run (a test)", "correr, hacer (una prueba)", "We're running a test."],
        ["wait for", "esperar a", "I'm waiting for the results."],
        ["look for", "buscar", "I'm looking for the manual."],
        ["beam", "haz (de luz)", "The beam is moving a little."],
      ],
      phrases: [
        ["What are you working on?", "¿En qué estás trabajando?"],
        ["I'm working on a new setup.", "Estoy trabajando en un montaje nuevo."],
        ["I'm aligning the laser right now.", "Estoy alineando el láser ahora mismo."],
        ["Sorry, I'm busy at the moment.", "Lo siento, estoy ocupado en este momento."],
        ["Are you using this computer?", "¿Estás usando este computador?"],
        ["I'm just looking for the manual.", "Solo estoy buscando el manual."],
        ["We're running a test.", "Estamos haciendo una prueba."],
        ["These days I'm reading a lot about photonics.", "Estos días estoy leyendo mucho sobre fotónica."],
        ["Hang on a second.", "Espera un segundo."],
        ["I'm on my way.", "Voy en camino."],
      ],
      ex: [
        ["mc", "Look! The laser ___.", ["overheats", "is overheating", "overheat"], 1, "Algo que pasa ahora: presente continuo."],
        ["mc", "Water ___ at 100 °C at sea level.", ["boils", "is boiling"], 0, "Hecho general: presente simple."],
        ["gap", "Shh! Sarah ___ (talk) on the phone.", ["is talking", "'s talking"], ""],
        ["mc", "I ___ what you mean.", ["understand", "am understanding"], 0, "Understand es verbo de estado."],
        ["gap", "What ___ you doing?", ["are"], ""],
        ["gap", "We ___ that lab this week. (negativo de use, continuo)", ["aren't using", "are not using"], ""],
        ["mc", "«What do you do?» significa:", ["¿Qué estás haciendo?", "¿A qué te dedicas?"], 1, ""],
        ["mc", "This week I ___ from home.", ["work", "am working"], 1, "Situación temporal: continuo."],
        ["order", "What|are|you|working|on?", "¿En qué estás trabajando?"],
        ["tr", "Estoy buscando el manual.", ["I'm looking for the manual", "I am looking for the manual"], "Look for = buscar."],
        ["tr", "Ahora estoy trabajando en un experimento nuevo.", ["I'm working on a new experiment now", "Right now I'm working on a new experiment", "I'm currently working on a new experiment", "Now I'm working on a new experiment", "I'm working on a new experiment right now", "At the moment I'm working on a new experiment"], ""],
      ],
      dialogue: {
        ctx: "Sarah llama a Daniel desde su oficina mientras él trabaja en el laboratorio.",
        lines: [
          ["Sarah", "Hi Daniel, it's Sarah. Are you in the lab?", "Hola Daniel, soy Sarah. ¿Estás en el laboratorio?"],
          ["Daniel", "Hi Sarah. Yes, I'm aligning the new laser right now.", "Hola Sarah. Sí, estoy alineando el láser nuevo ahora mismo."],
          ["Sarah", "Great. How's it going?", "Genial. ¿Cómo va?"],
          ["Daniel", "It's going well, but the beam is moving a little.", "Va bien, pero el haz se está moviendo un poco."],
          ["Sarah", "Hmm. Is the air conditioning running?", "Mmm. ¿Está funcionando el aire acondicionado?"],
          ["Daniel", "Yes, it is. Maybe that's the problem.", "Sí. Tal vez ese es el problema."],
          ["Sarah", "Probably. Mike usually turns it off during alignment. Is he there?", "Probablemente. Mike normalmente lo apaga durante la alineación. ¿Está ahí?"],
          ["Daniel", "No, he's having lunch. He's coming back at one.", "No, está almorzando. Vuelve a la una."],
          ["Sarah", "OK. I'm leaving for a meeting now, but call me if you need anything.", "Bien. Salgo para una reunión, pero llámame si necesitas algo."],
          ["Daniel", "Will do. Thanks!", "Así lo haré. ¡Gracias!"],
        ],
      },
      mission: {
        who: "Tu jefa, que te llama desde un congreso",
        role: "Sarah, the learner's supervisor, calling from a conference to ask what is happening at the lab or at work right now.",
        scene: "Tu jefa te llama. Explícale qué estás haciendo ahora y qué están haciendo tus colegas, y compáralo con lo que hacen normalmente.",
        goals: ["Describe dos acciones en progreso", "Contrasta con un hábito (usually…)", "Usa bien un verbo de estado (know, need, understand)", "Pregúntale cómo va el congreso"],
        start: "Hi! I'm calling from the conference. How are things there? What are you working on?",
        guided: [
          ["What are you working on?", "Right now I'm preparing the lab session for tomorrow."],
          ["And the rest of the team?", "Mike is fixing the vacuum pump and Priya is analyzing data."],
          ["Is that normal?", "Not really. We usually meet on Tuesdays, but this week we're working separately."],
          ["Do you need anything from me?", "I need the password for the new software. And how is the conference going?"],
        ],
      },
      links: [
        ["Present continuous (Perfect English Grammar)", "https://www.perfect-english-grammar.com/present-continuous.html", "Explicación y ejercicios.", "Gramática"],
        ["Present continuous (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/present-continuous-i-am-working", "Referencia completa, incluye verbos de estado.", "Gramática"],
        ["BBC English at Work", "https://www.bbc.co.uk/learningenglish/english/features/english-at-work", "Serie cómica en una oficina: inglés de trabajo real.", "Escuchar"],
        ["YouGlish: «I'm working on»", "https://youglish.com/pronounce/I'm%20working%20on/english", "Cómo lo dicen los nativos.", "Frases"],
      ],
    },
    /* ---------------- A2·3 ---------------- */
    {
      title: "Planes y futuro", en: "What are you doing this weekend?",
      goal: "hablar de tus planes, hacer predicciones, aceptar o rechazar invitaciones.",
      focus: "going to, will, present continuous for arrangements",
      grammar: `
<h3>Tres formas de hablar del futuro</h3>
<div class="tbl"><table>
<tr><th>Forma</th><th>Uso</th><th>Ejemplo</th></tr>
<tr><td>be going to</td><td>planes e intenciones; predicción con evidencia</td><td><em>I'm going to visit Denver.</em><br><em>Look at those clouds. It's going to rain.</em></td></tr>
<tr><td>presente continuo</td><td>citas y planes ya organizados (hora, lugar)</td><td><em>I'm meeting Sarah at ten.</em><br><em>We're flying to Chicago on Friday.</em></td></tr>
<tr><td>will</td><td>decisiones en el momento, promesas, ofertas, opiniones sobre el futuro</td><td><em>I'll send you the file tonight.</em><br><em>I think it'll be difficult.</em></td></tr>
</table></div>
<p>Truco práctico: si ya lo decidiste antes, <b>going to</b>; si ya está en tu calendario, <b>presente continuo</b>; si lo decides al hablar, <b>will</b>.</p>
<ul class="ex">
<li>— <em>The phone's ringing!</em> — <em>I'll get it.</em> <span class="es">(decisión instantánea)</span></li>
<li><em>I'm going to present my results on Monday.</em> <span class="es">(plan)</span></li>
</ul>
<div class="ojo"><p>«Mañana voy al congreso» (ya organizado) → <em>I'm going to the conference tomorrow.</em> Es más natural que «I will go…», que suena a decisión repentina o promesa.</p></div>
<h3>Aceptar y rechazar</h3>
<ul class="ex">
<li><em>Sounds great! I'd love to.</em></li>
<li><em>Sorry, I can't make it. I'm working that day.</em></li>
<li><em>Maybe another time!</em></li>
</ul>`,
      sound: {
        t: "Formas relajadas: gonna, wanna, I'll",
        tip: "En conversación rápida, <i>going to</i> suena «gonna», <i>want to</i> suena «wanna» y <i>I will</i> casi siempre es «I'll» (una sílaba). No tienes que decirlo así, pero sí entenderlo. Escucha la diferencia.",
        w: ["going to|gonna", "want to|wanna", "I will|I'll", "it will|it'll", "we will|we'll"],
      },
      vocab: [
        ["plan", "plan; planear", "Any plans for the weekend?"],
        ["schedule", "horario, agenda", "Let me check my schedule."],
        ["deadline", "fecha límite", "The deadline is next Monday."],
        ["conference", "congreso, conferencia", "I'm going to a conference in March."],
        ["trip", "viaje", "How was your trip?"],
        ["flight", "vuelo", "My flight leaves at seven."],
        ["book", "reservar", "I booked a hotel."],
        ["postpone", "posponer", "They postponed the meeting."],
        ["cancel", "cancelar", "The seminar is canceled."],
        ["soon", "pronto", "See you soon!"],
        ["probably", "probablemente", "I'll probably be late."],
        ["pick up", "recoger (a alguien)", "I'm picking her up at the airport."],
      ],
      phrases: [
        ["What are you doing this weekend?", "¿Qué vas a hacer este fin de semana?"],
        ["I'm meeting some friends on Saturday.", "Voy a ver a unos amigos el sábado."],
        ["I'm going to visit Denver.", "Voy a visitar Denver."],
        ["Are you free on Friday?", "¿Estás libre el viernes?"],
        ["Let's grab lunch next week.", "Almorcemos la próxima semana."],
        ["I'll send you the file tonight.", "Te envío el archivo esta noche."],
        ["I think it'll rain tomorrow.", "Creo que va a llover mañana."],
        ["The deadline is next Monday.", "La fecha límite es el próximo lunes."],
        ["Sorry, I can't make it.", "Lo siento, no puedo ir."],
        ["Maybe another time!", "¡Quizás en otra ocasión!"],
      ],
      ex: [
        ["mc", "The phone's ringing! — I ___ get it.", ["'ll", "'m going to", "'m getting"], 0, "Decisión en el momento: will."],
        ["mc", "Tickets are booked: we ___ to Chicago on May 3rd.", ["will fly", "are flying", "fly"], 1, "Plan organizado: presente continuo."],
        ["gap", "Look at those clouds. It ___ rain.", ["is going to", "'s going to"], "Predicción con evidencia: going to."],
        ["gap", "Don't worry, I ___ send you the data tonight. (promesa)", ["will", "'ll"], "Promesa: will."],
        ["mc", "Are you free ___ Friday?", ["on", "in", "at"], 0, "Días: on."],
        ["gap", "What ___ you doing this weekend?", ["are"], ""],
        ["mc", "Sorry, I can't ___ it.", ["do", "make", "go"], 1, "Can't make it = no poder asistir."],
        ["order", "I'm|going|to|visit|Denver.", "Voy a visitar Denver."],
        ["tr", "Voy a presentar mis resultados el lunes.", ["I'm going to present my results on Monday", "I'm presenting my results on Monday", "I will present my results on Monday", "I'm going to present my results Monday", "I'm presenting my results Monday"], ""],
        ["tr", "Te envío el archivo esta noche.", ["I'll send you the file tonight", "I will send you the file tonight", "I'll send the file to you tonight", "I'll send you the file this evening"], "Oferta espontánea: will."],
      ],
      dialogue: {
        ctx: "Viernes por la tarde. Mike le pregunta a Daniel por sus planes: su esposa llega a Colorado.",
        lines: [
          ["Mike", "Any plans for the weekend, Daniel?", "¿Planes para el fin de semana, Daniel?"],
          ["Daniel", "Yes! Ana is arriving on Saturday morning. I'm picking her up at the airport.", "¡Sí! Ana llega el sábado por la mañana. La recojo en el aeropuerto."],
          ["Mike", "That's great news! Are you going to show her around Boulder?", "¡Qué buena noticia! ¿Le vas a mostrar Boulder?"],
          ["Daniel", "Definitely. We're going to walk down Pearl Street and maybe go to the mountains.", "Claro. Vamos a caminar por Pearl Street y quizás ir a las montañas."],
          ["Mike", "You should visit Rocky Mountain National Park. It's beautiful this time of year.", "Deberían visitar el Parque Nacional de las Montañas Rocosas. Es hermoso en esta época."],
          ["Daniel", "Good idea. I think we'll go on Sunday.", "Buena idea. Creo que iremos el domingo."],
          ["Mike", "Check the weather first. They say it's going to snow.", "Revisa el clima primero. Dicen que va a nevar."],
          ["Daniel", "Snow? In October?", "¿Nieve? ¿En octubre?"],
          ["Mike", "Welcome to Colorado!", "¡Bienvenido a Colorado!"],
          ["Daniel", "OK, I'll check. Have a good weekend!", "Bueno, lo reviso. ¡Buen fin de semana!"],
        ],
      },
      mission: {
        who: "Un amigo que te invita a varios planes",
        role: "Chris, a friend from work, inviting the learner to several plans (a concert on Friday, a hike on Saturday, dinner next week). React naturally to acceptances and refusals.",
        scene: "Un amigo te invita a planes. Acepta uno, rechaza otro con cortesía explicando qué vas a hacer, y propone una alternativa.",
        goals: ["Acepta una invitación", "Rechaza otra con cortesía y da una razón", "Usa going to o presente continuo para un plan", "Usa will para una decisión espontánea u oferta"],
        start: "Hey! A few of us are going to a concert on Friday night. Do you want to come?",
        guided: [
          ["Do you want to come to a concert on Friday?", "Sounds great! What time does it start?"],
          ["At eight. And are you free on Saturday? We're going hiking.", "Sorry, I can't make it. I'm going to grade exams all day."],
          ["No problem. What about dinner next week?", "I'd love to. Are you free on Wednesday?"],
          ["Wednesday works! Can you book the restaurant?", "Sure, I'll book it tonight and send you the details."],
        ],
      },
      links: [
        ["Futuro simple con will (Perfect English Grammar)", "https://www.perfect-english-grammar.com/simple-future.html", "Cuándo usar will.", "Gramática"],
        ["Be going to (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/going-to", "Planes y predicciones con going to.", "Gramática"],
        ["The English We Speak (BBC)", "https://www.bbc.co.uk/learningenglish/english/features/the-english-we-speak", "Expresiones coloquiales en episodios de 3 minutos.", "Escuchar,Frases"],
        ["Rachel's English (YouTube)", "https://www.youtube.com/@rachelsenglish", "Busca sus videos sobre «reductions» (gonna, wanna).", "Pronunciación"],
      ],
    },
    /* ---------------- A2·4 ---------------- */
    {
      title: "Comparar", en: "It's faster than the old one",
      goal: "comparar equipos, opciones o lugares y hacer una recomendación.",
      focus: "comparatives and superlatives, as...as, twice as...as",
      grammar: `
<h3>Comparativos</h3>
<div class="tbl"><table>
<tr><th>Adjetivo</th><th>Comparativo</th><th>Superlativo</th></tr>
<tr><td>corto: fast</td><td><em>faster than</em></td><td><em>the fastest</em></td></tr>
<tr><td>termina en -y: noisy</td><td><em>noisier than</em></td><td><em>the noisiest</em></td></tr>
<tr><td>largo: expensive</td><td><em>more expensive than</em></td><td><em>the most expensive</em></td></tr>
<tr><td>good / bad / far</td><td><em>better / worse / farther</em></td><td><em>the best / the worst / the farthest</em></td></tr>
</table></div>
<ul class="ex">
<li><em>This sensor is more sensitive than that one.</em></li>
<li><em>It's much cheaper.</em> / <em>It's a bit heavier.</em> <span class="es">(much, a bit, a lot + comparativo)</span></li>
<li><em>It's the most reliable option we have.</em></li>
</ul>
<div class="ojo"><p><del>more big</del> → <em>bigger</em> · <del>more better</del> → <em>better</em> · <del>faster that</del> → <em>faster than</em></p></div>
<h3>Igualdad y proporciones</h3>
<ul class="ex">
<li><em>It's as stable as the old one.</em> <span class="es">— Es tan estable como el viejo.</span></li>
<li><em>It's not as sensitive as the Orion.</em> <span class="es">— No es tan sensible como el Orion.</span></li>
<li><em>It's twice as fast.</em> <span class="es">— Es el doble de rápido.</span></li>
<li><em>It's three times as heavy as this one.</em></li>
<li><em>It's an order of magnitude larger.</em> <span class="es">— Es un orden de magnitud mayor.</span></li>
</ul>
<div class="tip"><p><b>accurate</b> = exacto (cerca del valor real) · <b>precise</b> = preciso (resultados repetibles, poca dispersión). En inglés técnico no son sinónimos: <em>Our measurement is precise but not accurate.</em></p></div>`,
      sound: {
        t: "La schwa /ə/: la vocal más común del inglés",
        tip: "Casi todas las sílabas <b>sin acento</b> se reducen a una vocal neutra y relajada, la schwa /ə/, como una «e» floja. <i>than</i> suena «ðən», <i>faster</i> suena «FÆS-tər», <i>about</i> suena «ə-BAUT». Si pronuncias todas las vocales con claridad, suenas robótico.",
        w: ["than", "faster", "about", "better", "problem", "precision"],
      },
      vocab: [
        ["accurate", "exacto (cerca del valor real)", "The new scale is more accurate."],
        ["precise", "preciso (repetible)", "The measurements are very precise."],
        ["reliable", "confiable", "It's the most reliable option."],
        ["expensive / cheap", "caro / barato", "This model is much cheaper."],
        ["heavy / light", "pesado / liviano", "The new laser is lighter."],
        ["sensitive", "sensible (instrumento)", "This detector is very sensitive."],
        ["efficient", "eficiente", "LEDs are more efficient than bulbs."],
        ["powerful", "potente", "It's the most powerful laser in the lab."],
        ["noisy", "ruidoso", "The pump is noisier than I expected."],
        ["stable", "estable", "The temperature is very stable."],
        ["option", "opción", "Which option is better?"],
        ["budget", "presupuesto", "It depends on the budget."],
      ],
      phrases: [
        ["This sensor is more sensitive than that one.", "Este sensor es más sensible que ese."],
        ["It's much cheaper.", "Es mucho más barato."],
        ["It's the most reliable option.", "Es la opción más confiable."],
        ["It's not as stable as the old one.", "No es tan estable como el viejo."],
        ["Which one is better?", "¿Cuál es mejor?"],
        ["It's twice as fast.", "Es el doble de rápido."],
        ["The new model is a bit heavier.", "El modelo nuevo es un poco más pesado."],
        ["In my opinion, the second one is better.", "En mi opinión, el segundo es mejor."],
        ["It depends on the budget.", "Depende del presupuesto."],
        ["They're pretty similar.", "Son bastante parecidos."],
      ],
      ex: [
        ["mc", "This laser is ___ than that one.", ["more powerful", "powerfuller", "most powerful"], 0, "Adjetivo largo: more + adjetivo + than."],
        ["gap", "It's ___ (good) option we have.", ["the best"], "Superlativo irregular."],
        ["mc", "The new detector is ___ the old one.", ["as sensitive as", "as sensitive than", "so sensitive as"], 0, ""],
        ["gap", "This room is ___ (noisy) than the lab.", ["noisier"], "-y → -ier."],
        ["mc", "«Accurate» significa:", ["exacto, cercano al valor real", "preciso, repetible"], 0, ""],
        ["gap", "The problem is ___ (bad) than we thought.", ["worse"], ""],
        ["mc", "«Twice as fast» significa:", ["el doble de rápido", "la mitad de rápido"], 0, ""],
        ["mc", "This is the fastest camera ___ the market.", ["in", "on", "of"], 1, "On the market = en el mercado."],
        ["order", "It's|much|cheaper|than|the|old|one.", "Es mucho más barato que el viejo."],
        ["tr", "Este es el sensor más caro del laboratorio.", ["This is the most expensive sensor in the lab", "This is the most expensive sensor in the laboratory"], "Superlativo + in (lugar)."],
        ["tr", "No es tan estable como el viejo.", ["It's not as stable as the old one", "It isn't as stable as the old one", "It is not as stable as the old one", "It's less stable than the old one"], ""],
      ],
      dialogue: {
        ctx: "Sarah y Daniel deciden qué cámara comprar para el experimento. (Los modelos Orion, Vega y Lyra son ficticios.)",
        lines: [
          ["Sarah", "We need a new camera for the experiment. What do you think, Daniel?", "Necesitamos una cámara nueva para el experimento. ¿Qué opinas, Daniel?"],
          ["Daniel", "I compared three models. The Lyra is the cheapest, but it's also the noisiest.", "Comparé tres modelos. La Lyra es la más barata, pero también la más ruidosa."],
          ["Sarah", "And the other two?", "¿Y las otras dos?"],
          ["Daniel", "The Orion is more sensitive than the Vega, but it's much more expensive.", "La Orion es más sensible que la Vega, pero mucho más cara."],
          ["Sarah", "How much more expensive?", "¿Cuánto más cara?"],
          ["Daniel", "About twice as expensive. Almost twenty thousand dollars.", "Casi el doble. Casi veinte mil dólares."],
          ["Sarah", "Hmm. Is the Vega good enough for our signal?", "Mmm. ¿La Vega es suficientemente buena para nuestra señal?"],
          ["Daniel", "I think so. It's not as sensitive as the Orion, but it's faster and more reliable.", "Creo que sí. No es tan sensible como la Orion, pero es más rápida y más confiable."],
          ["Sarah", "OK, faster is better for us. Let's go with the Vega.", "Bien, para nosotros lo rápido es mejor. Nos quedamos con la Vega."],
          ["Daniel", "Great, I'll ask for a quote.", "Perfecto, pediré una cotización."],
        ],
      },
      mission: {
        who: "Tu jefa, que debe decidir una compra",
        role: "Sarah, the learner's supervisor, who can buy only one new instrument (the learner chooses: oscilloscope, laptop, camera, projector…) and asks for a comparison and a recommendation. Ask about price, reliability and performance.",
        scene: "Debes recomendar uno de tres equipos (tú eliges el tipo y te inventas los datos). Compáralos y da una recomendación final.",
        goals: ["Usa dos comparativos", "Usa un superlativo", "Usa as … as o not as … as", "Da una recomendación final con razones"],
        start: "I need your advice. We can only buy one new oscilloscope this year. Which one do you recommend, and why?",
        guided: [
          ["Which one do you recommend?", "I recommend the second one. It's faster than the others."],
          ["Is it the most expensive?", "No, the first one is the most expensive, but it's not as reliable as the second."],
          ["What about the third one?", "It's the cheapest, but it's much noisier and less accurate."],
          ["So, final decision?", "The second one: it's a bit more expensive than the third, but it's the best option for our lab."],
        ],
      },
      links: [
        ["Comparativos (Perfect English Grammar)", "https://www.perfect-english-grammar.com/comparatives.html", "Reglas y ejercicios.", "Gramática"],
        ["Comparación de adjetivos (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/comparison-adjectives-bigger-biggest-more-interesting", "Referencia completa con excepciones.", "Gramática"],
        ["Veritasium (YouTube)", "https://www.youtube.com/@veritasium", "Ciencia y experimentos; muchas comparaciones y órdenes de magnitud.", "Física"],
        ["YouGlish: «more accurate than»", "https://youglish.com/pronounce/more%20accurate%20than/english", "Comparaciones técnicas en contexto.", "Frases"],
      ],
    },
    /* ---------------- A2·5 ---------------- */
    {
      title: "Experiencias", en: "Have you ever...?",
      goal: "hablar de tus experiencias de vida y preguntar por las de otros.",
      focus: "present perfect for life experience (ever, never), been vs gone, contrast with past simple",
      grammar: `
<h3>Presente perfecto: experiencias sin fecha</h3>
<div class="formula">have / has + participio pasado</div>
<p>Se usa cuando importa <b>la experiencia</b>, no cuándo ocurrió:</p>
<ul class="ex">
<li><em>I've been to three international conferences.</em> <span class="es">— He ido a tres congresos internacionales.</span></li>
<li><em>She has published two papers.</em> <span class="es">— Ha publicado dos artículos.</span></li>
<li><em>Have you ever seen snow?</em> <span class="es">— ¿Alguna vez has visto nieve?</span></li>
<li><em>I've never tried sushi.</em> <span class="es">— Nunca he probado el sushi.</span></li>
</ul>
<h3>Participios útiles</h3>
<p><em>be → been</em>, <em>do → done</em>, <em>see → seen</em>, <em>go → gone</em>, <em>eat → eaten</em>, <em>write → written</em>, <em>meet → met</em>, <em>take → taken</em>, <em>work → worked</em>, <em>try → tried</em>.</p>
<h3>¿Presente perfecto o pasado simple?</h3>
<p>Si dices <b>cuándo</b> (una fecha, «last year», «in 2019»), usa el pasado simple:</p>
<ul class="ex">
<li><em>I've been to Canada.</em> <span class="es">(experiencia, sin fecha)</span></li>
<li><em>I went to Canada in 2019.</em> <span class="es">(con fecha → pasado)</span></li>
</ul>
<div class="ojo"><p><del>I have been in London last year.</del> → <em>I went to London last year.</em></p></div>
<h3>been o gone</h3>
<p><em>He has been to Denver.</em> = fue y ya volvió. <em>He has gone to Denver.</em> = se fue y todavía está allá.</p>`,
      sound: {
        t: "Contracciones del presente perfecto",
        tip: "En la conversación casi nunca se oye «I have been». Se dice <i>I've been</i> (una sílaba para «I've»), <i>she's been</i>, <i>haven't</i>. Practica decirlas rápido y unidas.",
        w: ["I have been|I've been", "she has|she's", "we have|we've", "haven't", "hasn't", "I've never"],
      },
      vocab: [
        ["ever", "alguna vez (en preguntas)", "Have you ever been to Mexico?"],
        ["never", "nunca", "I've never seen snow."],
        ["abroad", "en el extranjero", "Have you ever lived abroad?"],
        ["travel", "viajar", "I've traveled a lot for work."],
        ["experience", "experiencia", "It was an amazing experience."],
        ["publish", "publicar", "I've published two papers."],
        ["paper", "artículo científico", "Have you read her paper?"],
        ["award", "premio", "She has won several awards."],
        ["try", "probar, intentar", "Have you tried Colombian coffee?"],
        ["once / twice", "una vez / dos veces", "I've been there twice."],
        ["several times", "varias veces", "I've seen that movie several times."],
        ["What was it like?", "¿Cómo fue? ¿Qué tal estuvo?", "You went to Japan? What was it like?"],
      ],
      phrases: [
        ["Have you ever been to Canada?", "¿Has estado alguna vez en Canadá?"],
        ["Yes, I have. I went there in 2019.", "Sí. Fui en 2019."],
        ["No, I've never been there.", "No, nunca he estado allí."],
        ["I've been to three international conferences.", "He ido a tres congresos internacionales."],
        ["Have you ever published a paper?", "¿Alguna vez has publicado un artículo?"],
        ["I've published two papers on optics.", "He publicado dos artículos sobre óptica."],
        ["I've never tried sushi.", "Nunca he probado el sushi."],
        ["What was it like?", "¿Cómo fue?"],
        ["It was an amazing experience.", "Fue una experiencia increíble."],
        ["How many times have you been there?", "¿Cuántas veces has estado allí?"],
      ],
      ex: [
        ["mc", "Have you ever ___ to Japan?", ["went", "been", "gone"], 1, "Experiencia de viaje: have been to."],
        ["gap", "I've never ___ (see) snow before.", ["seen"], ""],
        ["mc", "I ___ to Paris in 2018.", ["have been", "went"], 1, "Con fecha: pasado simple."],
        ["gap", "She has ___ (write) three papers.", ["written"], ""],
        ["mc", "«He has gone to Denver» significa:", ["Fue y ya volvió.", "Se fue y todavía está allá."], 1, ""],
        ["gap", "___ you ever met a Nobel laureate?", ["Have"], ""],
        ["gap", "We ___ the report yet. (negativo de finish)", ["haven't finished", "have not finished"], ""],
        ["mc", "— Have you tried this? — Yes, I ___.", ["have", "did", "tried"], 0, "Respuesta corta: Yes, I have."],
        ["order", "Have|you|ever|published|a|paper?", "¿Alguna vez has publicado un artículo?"],
        ["tr", "Nunca he estado en Europa.", ["I've never been to Europe", "I have never been to Europe"], ""],
        ["tr", "He publicado dos artículos.", ["I've published two papers", "I have published two papers", "I've published two articles", "I have published two articles", "I have published 2 papers"], "«Paper» es la palabra habitual para un artículo científico."],
      ],
      dialogue: {
        ctx: "Cena del grupo en casa de Mike. Ana, la esposa de Daniel, ya llegó a Boulder y conoce a los colegas.",
        lines: [
          ["Priya", "Ana, have you ever been to the US before?", "Ana, ¿habías estado antes en Estados Unidos?"],
          ["Ana", "No, I haven't. This is my first time. But I've been to Mexico and Argentina.", "No. Es mi primera vez. Pero he estado en México y Argentina."],
          ["Mike", "And have you ever seen snow?", "¿Y alguna vez has visto nieve?"],
          ["Ana", "Only once, in the Andes. It was very cold!", "Solo una vez, en los Andes. ¡Hacía mucho frío!"],
          ["Daniel", "Mike, have you ever been to Colombia?", "Mike, ¿alguna vez has ido a Colombia?"],
          ["Mike", "No, I haven't, but I've always wanted to go. What's it like?", "No, pero siempre he querido ir. ¿Cómo es?"],
          ["Daniel", "It's beautiful. You have to try the coffee.", "Es hermosa. Tienes que probar el café."],
          ["Priya", "I've tried Colombian coffee! We have some in the lab kitchen.", "¡Yo he probado café colombiano! Tenemos en la cocina del laboratorio."],
          ["Ana", "Then you've tried the best coffee in the world!", "¡Entonces has probado el mejor café del mundo!"],
          ["Mike", "Ha! I've heard that before.", "¡Ja! Eso ya lo he oído antes."],
        ],
      },
      mission: {
        who: "Alguien curioso en una fiesta",
        role: "Sam, a curious and fun person at a party, playing 'Have you ever...?' with the learner. Answer the learner's questions too, sometimes with a short story.",
        scene: "En una fiesta juegan «Have you ever…?». Responde preguntas sobre tus experiencias y haz tú también preguntas.",
        goals: ["Haz dos preguntas con Have you ever…?", "Responde con never al menos una vez", "Da un detalle en pasado simple (cuándo, cómo fue)", "Pregunta What was it like?"],
        start: "Let's play a game! I ask 'Have you ever...?' and you answer, then you ask me. Ready? Have you ever been to a country where you didn't speak the language?",
        guided: [
          ["Have you ever been to a country where you didn't speak the language?", "Yes, I have. I went to Brazil in 2018. It was difficult but fun!"],
          ["Have you ever met someone famous?", "No, I've never met anyone famous. Have you?"],
          ["Yes! I met an astronaut once.", "Really? What was it like?"],
          ["Amazing. Have you ever tried something really strange to eat?", "I've tried ants! In Colombia we eat hormigas culonas. They were crunchy."],
        ],
      },
      links: [
        ["Present perfect (Perfect English Grammar)", "https://www.perfect-english-grammar.com/present-perfect.html", "Usos y ejercicios.", "Gramática"],
        ["Present perfect o past simple (Perfect English Grammar)", "https://www.perfect-english-grammar.com/present-perfect-or-past-simple.html", "La diferencia que más confunde, con ejercicios.", "Gramática"],
        ["Present perfect (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-have-worked", "Referencia completa.", "Gramática"],
        ["YouGlish: «have you ever»", "https://youglish.com/pronounce/have%20you%20ever/english", "Preguntas reales sobre experiencias.", "Frases"],
      ],
    },
    /* ---------------- A2·6 ---------------- */
    {
      title: "Instrucciones y procesos", en: "First, turn on the power supply",
      goal: "explicar un procedimiento paso a paso y dar advertencias de seguridad.",
      focus: "imperatives, sequencers (first, then, next, after that, finally), safety language, make sure",
      grammar: `
<h3>El imperativo: instrucciones directas</h3>
<p>Es el verbo en forma base, sin sujeto. Para el negativo, <b>Don't</b> + verbo:</p>
<ul class="ex">
<li><em>Turn on the power supply.</em> <span class="es">— Enciende la fuente de poder.</span></li>
<li><em>Don't touch the optics with your fingers.</em> <span class="es">— No toques la óptica con los dedos.</span></li>
<li><em>Never look directly into the beam.</em> <span class="es">— Nunca mires directamente al haz.</span></li>
</ul>
<div class="ojo"><p><del>No touch.</del> → <em>Don't touch.</em> El imperativo negativo siempre lleva <b>don't</b> (o <b>never</b>).</p></div>
<h3>Ordenar los pasos</h3>
<p><em>First, …</em> → <em>Then, …</em> → <em>Next, …</em> → <em>After that, …</em> → <em>Finally, …</em></p>
<h3>Asegurarse y advertir</h3>
<ul class="ex">
<li><em>Make sure the shutter is closed.</em> <span class="es">— Asegúrate de que el obturador esté cerrado.</span></li>
<li><em>Be careful, it's hot.</em> <span class="es">— Cuidado, está caliente.</span></li>
<li><em>Wait until the pump cools down.</em> <span class="es">— Espera hasta que la bomba se enfríe.</span></li>
<li><em>Please wear safety glasses.</em> <span class="es">— Por favor usa gafas de seguridad.</span></li>
</ul>
<p>Para suavizar: <em>Could you…?</em>, <em>Please…</em>, o <em>You need to…</em>. Para comprobar que te entienden: <em>Does that make sense?</em></p>
<div class="tip"><p>Los manuales en inglés usan exactamente estas estructuras. Si lees el manual de un equipo de tu laboratorio, estarás practicando esta unidad.</p></div>`,
      sound: {
        t: "El acento en los verbos con partícula",
        tip: "En <i>turn ON</i>, <i>switch OFF</i>, <i>plug IN</i>, <i>set UP</i> el acento cae en la <b>partícula</b>, no en el verbo. Y se unen: «tur-nON», «plu-gIN».",
        w: ["turn on", "switch off", "plug in", "set up", "warm up", "cool down"],
      },
      vocab: [
        ["turn on / off", "encender / apagar", "Turn off the laser before you leave."],
        ["plug in / unplug", "enchufar / desenchufar", "Unplug the amplifier."],
        ["press", "presionar", "Press the red button."],
        ["hold", "mantener presionado; sostener", "Press and hold for three seconds."],
        ["tighten / loosen", "apretar / aflojar", "Tighten the screw a little."],
        ["check", "revisar, verificar", "Check the pressure again."],
        ["wait until", "esperar hasta que", "Wait until it cools down."],
        ["warm up / cool down", "calentarse / enfriarse", "The laser needs to warm up."],
        ["wear", "llevar puesto, usar (ropa, equipo)", "Wear gloves and goggles."],
        ["safety glasses", "gafas de seguridad", "Where are the safety glasses?"],
        ["valve", "válvula", "Open the valve slowly."],
        ["logbook", "bitácora", "Write the value in the logbook."],
      ],
      phrases: [
        ["First, turn on the power supply.", "Primero, enciende la fuente de poder."],
        ["Then wait for five minutes.", "Luego espera cinco minutos."],
        ["Make sure the shutter is closed.", "Asegúrate de que el obturador esté cerrado."],
        ["Be careful, it's hot.", "Cuidado, está caliente."],
        ["Don't touch the optics with your fingers.", "No toques la óptica con los dedos."],
        ["Never look directly into the beam.", "Nunca mires directamente al haz."],
        ["Press and hold the button.", "Mantén presionado el botón."],
        ["After that, check the reading.", "Después, revisa la lectura."],
        ["Finally, write the value in the logbook.", "Finalmente, anota el valor en la bitácora."],
        ["Does that make sense?", "¿Tiene sentido? ¿Me explico?"],
      ],
      ex: [
        ["mc", "___ touch the lens!", ["No", "Don't", "Not"], 1, "Imperativo negativo: don't."],
        ["gap", "___ sure the laser is off.", ["Make"], "Make sure = asegúrate."],
        ["mc", "Advertencia correcta:", ["Be careful!", "Have careful!", "Take careful!"], 0, ""],
        ["gap", "Turn ___ the power supply. (encender)", ["on"], ""],
        ["gap", "Wait until the pump ___ (cool) down.", ["cools"], "Después de until, presente simple."],
        ["mc", "«Wear safety glasses» significa:", ["usa gafas de seguridad (puestas)", "lleva gafas a otro lugar", "compra gafas"], 0, "Wear = llevar puesto."],
        ["mc", "El último paso se introduce con:", ["Finally,", "Firstly,", "At finally,"], 0, ""],
        ["order", "Never|look|directly|into|the|beam.", "Nunca mires directamente al haz."],
        ["order", "After|that,|check|the|reading.", "Después, revisa la lectura."],
        ["tr", "No toques las ópticas con los dedos.", ["Don't touch the optics with your fingers", "Do not touch the optics with your fingers"], ""],
        ["tr", "Primero, enciende la fuente de poder.", ["First, turn on the power supply", "First, switch on the power supply", "First, turn the power supply on", "First, switch the power supply on"], ""],
      ],
      dialogue: {
        ctx: "Daniel le enseña a Jake, un estudiante de pregrado recién llegado, a encender el sistema de vacío.",
        lines: [
          ["Daniel", "OK, Jake, today I'm going to show you how to start the vacuum system.", "Bien, Jake, hoy te voy a mostrar cómo encender el sistema de vacío."],
          ["Jake", "Great. What do I do first?", "Genial. ¿Qué hago primero?"],
          ["Daniel", "First, make sure all the valves are closed.", "Primero, asegúrate de que todas las válvulas estén cerradas."],
          ["Jake", "All closed. What's next?", "Todas cerradas. ¿Qué sigue?"],
          ["Daniel", "Then turn on the roughing pump and wait until the pressure drops below 0.1 millibars.", "Luego enciende la bomba primaria y espera a que la presión baje de 0,1 milibares."],
          ["Jake", "OK, it's going down.", "Bien, está bajando."],
          ["Daniel", "Good. Now open this valve slowly. Don't open it too fast.", "Bien. Ahora abre esta válvula despacio. No la abras muy rápido."],
          ["Jake", "Like this?", "¿Así?"],
          ["Daniel", "Perfect. After that, turn on the turbo pump. It takes about ten minutes to reach full speed.", "Perfecto. Después, enciende la bomba turbomolecular. Tarda unos diez minutos en llegar a máxima velocidad."],
          ["Jake", "And when do we turn on the laser?", "¿Y cuándo encendemos el láser?"],
          ["Daniel", "Not yet! Finally, check the pressure again. Never start the experiment above ten to the minus six.", "¡Todavía no! Finalmente, revisa otra vez la presión. Nunca empieces el experimento por encima de diez a la menos seis."],
          ["Jake", "Got it. Does it always make that noise?", "Entendido. ¿Siempre hace ese ruido?"],
          ["Daniel", "Yes, that's normal. Don't worry.", "Sí, es normal. No te preocupes."],
        ],
      },
      mission: {
        who: "Un estudiante nuevo que quiere aprender un procedimiento",
        role: "Jake, a new undergraduate student who wants the learner to teach him a procedure (the learner chooses: using an instrument, calibrating a sensor, making coffee, preparing a lab practice). Ask clarifying questions after each step.",
        scene: "Explica paso a paso un procedimiento que conozcas bien. El estudiante hará preguntas.",
        goals: ["Da cuatro pasos con First, Then, After that, Finally", "Da una advertencia (Be careful, Don't, Never)", "Usa make sure", "Comprueba que te entendió (Does that make sense?)"],
        start: "Hi! Sarah told me you can teach me a procedure. What are we doing today, and what's the first step?",
        guided: [
          ["What are we doing today?", "Today I'm going to show you how to use the oscilloscope."],
          ["OK! What's the first step?", "First, plug it in and turn it on. Then connect the probe to channel one."],
          ["Is there anything dangerous?", "Be careful with high voltage. Never touch the circuit when it's on."],
          ["And then?", "After that, press Auto Set. Finally, make sure the signal is stable. Does that make sense?"],
        ],
      },
      links: [
        ["Imperativos (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/imperatives", "Formas y usos del imperativo.", "Gramática"],
        ["BBC English at Work", "https://www.bbc.co.uk/learningenglish/english/features/english-at-work", "Instrucciones y pedidos en el trabajo.", "Escuchar"],
        ["Practical Engineering (YouTube)", "https://www.youtube.com/@PracticalEngineeringChannel", "Ingeniería explicada paso a paso, con inglés muy claro.", "Física"],
        ["YouGlish: «make sure»", "https://youglish.com/pronounce/make%20sure/english", "La expresión en contexto real.", "Frases"],
      ],
    },
  ],
});
