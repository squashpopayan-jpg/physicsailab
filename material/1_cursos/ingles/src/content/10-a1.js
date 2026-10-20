/* Nivel A1 · n = 1 · Hα 656 nm */
window.QLE_LEVELS = window.QLE_LEVELS || [];
window.QLE_LEVELS.push({
  id: "a1", code: "A1", n: 1, name: "Fundamentos", nm: 656, line: "Hα",
  links: [
    ["BBC Real Easy English", "https://www.bbc.co.uk/learningenglish/english/features/real-easy-english", "Conversaciones cotidianas muy lentas y claras, con transcripción.", "A1,A2"],
    ["Tim's Pronunciation Workshop (BBC)", "https://www.bbc.co.uk/learningenglish/english/features/pronunciation", "Videos cortos sobre cómo suena el inglés hablado de verdad.", "A1,A2,B1"],
    ["News in Levels · nivel 1", "https://www.newsinlevels.com/level/level-1/", "Noticias reales contadas con vocabulario básico y audio.", "A1,A2"],
    ["ESL-Lab · fácil", "https://www.esl-lab.com/easy/", "Audios cortos con preguntas de comprensión.", "A1,A2"],
  ],
  units: [
    /* ---------------- A1·1 ---------------- */
    {
      title: "Preséntate", en: "Nice to meet you",
      goal: "saludar, decir tu nombre, de dónde eres y a qué te dedicas.",
      focus: "verb to be (am/is/are), subject pronouns, a/an with jobs",
      grammar: `
<h3>El verbo TO BE: ser y estar en uno solo</h3>
<p>En inglés, <b>ser</b> y <b>estar</b> son el mismo verbo: <b>to be</b>. Solo tiene tres formas en presente: <b>am</b>, <b>is</b>, <b>are</b>.</p>
<div class="tbl"><table>
<tr><th>Completa</th><th>Contraída (hablando)</th><th>Español</th></tr>
<tr><td>I am</td><td><em>I'm Daniel.</em></td><td class="es">Soy Daniel.</td></tr>
<tr><td>you are</td><td><em>You're very kind.</em></td><td class="es">Eres muy amable.</td></tr>
<tr><td>he / she / it is</td><td><em>She's a physicist.</em></td><td class="es">Ella es física.</td></tr>
<tr><td>we are</td><td><em>We're from Colombia.</em></td><td class="es">Somos de Colombia.</td></tr>
<tr><td>they are</td><td><em>They're in the lab.</em></td><td class="es">Están en el laboratorio.</td></tr>
</table></div>
<p>Al hablar, los nativos casi siempre contraen: <b>I'm, you're, she's</b>. Acostúmbrate a decirlo así desde el principio.</p>
<h3>Negativo y preguntas</h3>
<p>Negativo: agrega <b>not</b>. Pregunta: pon el verbo <b>antes</b> del sujeto.</p>
<ul class="ex">
<li><em>I'm not a student.</em> <span class="es">— No soy estudiante.</span></li>
<li><em>It isn't cold today.</em> <span class="es">— No hace frío hoy.</span></li>
<li><em>Are you an engineer?</em> — <em>Yes, I am.</em> / <em>No, I'm not.</em></li>
<li><em>Where are you from?</em> <span class="es">— ¿De dónde eres?</span></li>
</ul>
<h3>El sujeto nunca desaparece</h3>
<p>En español decimos «Es interesante» sin sujeto. En inglés <b>siempre</b> hay sujeto; si no hay persona, usa <b>it</b>: <em>It's interesting.</em> <em>It's nine o'clock.</em></p>
<h3>Profesiones con a / an</h3>
<p>Con profesiones se usa artículo: <em>I'm an engineer.</em> (no «I'm engineer»). Usa <b>an</b> antes de sonido vocálico: <em>an engineer</em>, <em>an hour</em>; y <b>a</b> antes de sonido consonante: <em>a physicist</em>, <em>a university</em> (suena «iu»).</p>
<div class="ojo"><p><del>I have 35 years.</del> → <em>I'm 35.</em> o <em>I'm 35 years old.</em> La edad se dice con <b>to be</b>, no con «have».</p></div>
<div class="tip"><p>«Ingeniero físico» se dice <em>engineering physicist</em>, o <em>I have a degree in Engineering Physics.</em> «Physics engineer» se entiende, pero es menos común.</p></div>`,
      sound: {
        t: "La H inglesa: un suspiro suave",
        tip: "La <b>h</b> inglesa no es muda (como en español) ni suena como <b>j</b>. Es solo aire, como cuando empañas un vidrio: <i>hhh-ello</i>. Escucha y repite cada palabra exagerando el aire.",
        w: ["hello", "hi", "how", "happy", "house", "who", "hotel", "hot|ot"],
      },
      vocab: [
        ["engineer", "ingeniero, ingeniera", "I'm an engineer."],
        ["physicist", "físico, física (persona)", "She's a physicist."],
        ["physics", "física (la ciencia)", "Physics is my passion."],
        ["job", "trabajo, empleo", "I love my job."],
        ["name", "nombre", "My name is Daniel."],
        ["country", "país", "Colombia is a beautiful country."],
        ["city", "ciudad", "Popayán is a city in the south."],
        ["from", "de (origen)", "I'm from Colombia."],
        ["university", "universidad", "I work at a university."],
        ["colleague", "colega, compañero de trabajo", "This is my colleague, Priya."],
        ["teacher", "profesor, profesora", "I'm a physics teacher."],
        ["nice", "agradable, amable", "Nice to meet you!"],
      ],
      phrases: [
        ["Hi, I'm Daniel.", "Hola, soy Daniel."],
        ["Nice to meet you.", "Mucho gusto."],
        ["Nice to meet you too.", "Igualmente, mucho gusto."],
        ["Where are you from?", "¿De dónde eres?"],
        ["I'm from Popayán, in Colombia.", "Soy de Popayán, en Colombia."],
        ["What do you do?", "¿A qué te dedicas?"],
        ["I'm an engineering physicist.", "Soy ingeniero físico."],
        ["How are you?", "¿Cómo estás?"],
        ["I'm fine, thanks. And you?", "Bien, gracias. ¿Y tú?"],
        ["Sorry, can you repeat that?", "Perdón, ¿puedes repetir eso?"],
      ],
      ex: [
        ["mc", "She ___ a physicist.", ["am", "is", "are"], 1, "Con he, she, it se usa «is»."],
        ["mc", "___ you from Colombia?", ["Is", "Am", "Are"], 2, "Con «you» siempre «are», también en preguntas."],
        ["mc", "¿Cómo se dice «Tengo 30 años»?", ["I have 30 years.", "I'm 30 years old.", "I have 30 years old."], 1, "La edad se expresa con el verbo to be."],
        ["gap", "I ___ an engineer.", ["am"], "Con «I» siempre «am»."],
        ["gap", "They ___ from Spain. (negativo)", ["aren't", "are not"], "Negativo de «are»: are not / aren't."],
        ["gap", "My name ___ Daniel.", ["is"], "«My name» equivale a «it»: is."],
        ["mc", "I'm ___ engineer.", ["a", "an", "(nada)"], 1, "«Engineer» empieza con sonido vocálico: an. Y las profesiones llevan artículo."],
        ["mc", "«Es muy interesante.»", ["Is very interesting.", "It's very interesting.", "Very interesting is."], 1, "En inglés siempre hay sujeto; aquí, «it»."],
        ["order", "Where|are|you|from?", "¿De dónde eres?"],
        ["order", "It's|a|beautiful|city.", "Es una ciudad hermosa."],
        ["tr", "Soy ingeniero físico y soy de Colombia.", ["I'm an engineering physicist and I'm from Colombia", "I'm a physics engineer and I'm from Colombia", "I'm an engineering physicist from Colombia", "I'm a physics engineer from Colombia"], "«Engineering physicist» es el término más usado."],
        ["tr", "Mucho gusto. ¿Cómo estás?", ["Nice to meet you. How are you?", "Pleased to meet you. How are you?", "Nice meeting you. How are you?"], ""],
      ],
      dialogue: {
        ctx: "Primer día de Daniel en el laboratorio de óptica de una universidad en Boulder, Colorado. Conoce a su supervisora, la doctora Sarah Chen, y al técnico del laboratorio, Mike.",
        lines: [
          ["Sarah", "Hi! Are you Daniel?", "¡Hola! ¿Eres Daniel?"],
          ["Daniel", "Yes, I am. Hi!", "Sí, soy yo. ¡Hola!"],
          ["Sarah", "I'm Sarah Chen. Welcome to the lab.", "Soy Sarah Chen. Bienvenido al laboratorio."],
          ["Daniel", "Thank you. Nice to meet you, Dr. Chen.", "Gracias. Mucho gusto, doctora Chen."],
          ["Sarah", "Nice to meet you too. Please, call me Sarah. Where are you from?", "Igualmente. Por favor, dime Sarah. ¿De dónde eres?"],
          ["Daniel", "I'm from Colombia. From Popayán, a city in the south.", "Soy de Colombia. De Popayán, una ciudad del sur."],
          ["Sarah", "Oh, great! Is this your first time in the US?", "¡Qué bien! ¿Es tu primera vez en Estados Unidos?"],
          ["Daniel", "Yes, it is. I'm very happy to be here.", "Sí. Estoy muy feliz de estar aquí."],
          ["Sarah", "So, what's your background?", "Y, ¿cuál es tu formación?"],
          ["Daniel", "I'm an engineering physicist. I work with lasers and optics.", "Soy ingeniero físico. Trabajo con láseres y óptica."],
          ["Sarah", "Perfect. Oh, this is Mike. He's our lab technician.", "Perfecto. Ah, él es Mike. Es nuestro técnico de laboratorio."],
          ["Mike", "Hey, Daniel. Nice to meet you!", "Hola, Daniel. ¡Mucho gusto!"],
        ],
      },
      mission: {
        who: "Una investigadora en la pausa de café de un congreso",
        role: "Sarah, a friendly researcher meeting the learner during a coffee break at a physics conference. Speak slowly and simply.",
        scene: "Estás en la pausa de café de un congreso. Una investigadora se acerca a saludarte. Preséntate y conócela.",
        goals: ["Saluda y di tu nombre", "Di de dónde eres", "Explica a qué te dedicas", "Hazle al menos una pregunta"],
        start: "Hi! I'm Sarah. What's your name?",
        guided: [
          ["Hi! I'm Sarah. What's your name?", "Hi Sarah, I'm Daniel. Nice to meet you."],
          ["Where are you from?", "I'm from Colombia, from a city called Popayán."],
          ["What do you do?", "I'm an engineering physicist. I teach physics at a university."],
          ["Is this your first conference?", "Yes, it is. It's very interesting! And you? Where are you from?"],
        ],
      },
      links: [
        ["Gramática: el verbo be (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/be", "Referencia clara con ejemplos del verbo to be.", "Gramática"],
        ["YouGlish: «nice to meet you»", "https://youglish.com/pronounce/nice%20to%20meet%20you/english", "Escucha a cientos de personas diciendo la frase en videos reales.", "Frases"],
        ["BBC Real Easy English", "https://www.bbc.co.uk/learningenglish/english/features/real-easy-english", "Presentaciones y conversaciones básicas, despacio.", "Escuchar"],
        ["Rachel's English (YouTube)", "https://www.youtube.com/@rachelsenglish", "Pronunciación americana explicada con detalle.", "Pronunciación"],
      ],
    },
    /* ---------------- A1·2 ---------------- */
    {
      title: "Tu gente: familia y trabajo", en: "This is my family",
      goal: "hablar de tu familia y de las personas con las que trabajas.",
      focus: "possessive adjectives (my, your, his, her, our, their), possessive 's, plurals",
      grammar: `
<h3>Posesivos: my, your, his, her…</h3>
<div class="tbl"><table>
<tr><th>Pronombre</th><th>Posesivo</th><th>Ejemplo</th></tr>
<tr><td>I</td><td>my</td><td><em>my sister</em></td></tr>
<tr><td>you</td><td>your</td><td><em>your office</em></td></tr>
<tr><td>he</td><td>his</td><td><em>his wife</em></td></tr>
<tr><td>she</td><td>her</td><td><em>her brother</em></td></tr>
<tr><td>it</td><td>its</td><td><em>its power supply</em></td></tr>
<tr><td>we</td><td>our</td><td><em>our lab</em></td></tr>
<tr><td>they</td><td>their</td><td><em>their children</em></td></tr>
</table></div>
<p>El posesivo depende de <b>quién posee</b>, no del objeto. «Sarah y <b>su</b> hermano» → <em>Sarah and her brother</em> (her porque Sarah es mujer). «Mike y <b>su</b> hija» → <em>Mike and his daughter</em>.</p>
<h3>El genitivo 's: «el laboratorio de Sarah»</h3>
<p>Para decir «de alguien», el inglés pone al dueño primero y agrega <b>'s</b>:</p>
<ul class="ex">
<li><em>Sarah's lab</em> <span class="es">— el laboratorio de Sarah</span></li>
<li><em>my wife's name</em> <span class="es">— el nombre de mi esposa</span></li>
<li><em>the students' office</em> <span class="es">— la oficina de los estudiantes (plural: solo apóstrofo)</span></li>
</ul>
<h3>Plurales</h3>
<p>Casi siempre se agrega <b>-s</b>: <em>lasers</em>, <em>sisters</em>. Después de s, sh, ch, x se agrega <b>-es</b>: <em>lenses</em>, <em>boxes</em>. Algunos son irregulares: <em>child → children</em>, <em>person → people</em>, <em>man → men</em>, <em>woman → women</em>.</p>
<div class="ojo"><p><del>The people is nice.</del> → <em>The people are nice.</em> «People» ya es plural.</p></div>
<div class="tip"><p><em>data</em> es técnicamente plural (de «datum»). En artículos científicos verás <em>the data are</em>; en conversación, <em>the data is</em> también es aceptado.</p></div>`,
      sound: {
        t: "La -s final: no te la comas",
        tip: "En español del sur solemos «aspirar» la s final. En inglés la <b>-s</b> es gramática: distingue singular de plural. Suena <b>/s/</b> tras sonidos sordos (<i>books</i>), <b>/z/</b> tras sonidos sonoros (<i>labs</i>) y <b>/ɪz/</b> tras s, sh, ch (<i>boxes</i>).",
        w: ["book|books", "lab|labs", "laser|lasers", "box|boxes", "lens|lenses", "colleagues"],
      },
      vocab: [
        ["family", "familia", "I have a small family."],
        ["brother / sister", "hermano / hermana", "My sister is a doctor."],
        ["wife / husband", "esposa / esposo", "My wife's name is Ana."],
        ["partner", "pareja", "Her partner is an engineer."],
        ["parents", "padres (papá y mamá)", "My parents live in Popayán."],
        ["children", "hijos, niños", "Do you have children?"],
        ["son / daughter", "hijo / hija", "His daughter is five."],
        ["married", "casado, casada", "I'm married."],
        ["coworker", "compañero de trabajo", "My coworkers are very friendly."],
        ["lab (laboratory)", "laboratorio", "Our lab is on the second floor."],
        ["lens (lenses)", "lente (lentes)", "Clean the lenses carefully."],
        ["people", "personas, gente", "The people here are nice."],
      ],
      phrases: [
        ["This is my wife, Ana.", "Ella es mi esposa, Ana."],
        ["I have one sister and two brothers.", "Tengo una hermana y dos hermanos."],
        ["Do you have any kids?", "¿Tienes hijos?"],
        ["I'm married. / I'm single.", "Estoy casado. / Estoy soltero."],
        ["My parents live in Cali.", "Mis padres viven en Cali."],
        ["What's your sister's name?", "¿Cómo se llama tu hermana?"],
        ["Her name is Laura.", "Se llama Laura."],
        ["It's a small family.", "Es una familia pequeña."],
        ["This is my colleague, Priya.", "Ella es mi colega, Priya."],
        ["We work together.", "Trabajamos juntos."],
      ],
      ex: [
        ["mc", "Sarah and ___ brother live in Denver.", ["his", "her", "their"], 1, "El posesivo concuerda con Sarah (mujer): her."],
        ["gap", "This is Mike. ___ office is next to the lab.", ["His"], "Mike es hombre: his."],
        ["mc", "Plural de «child»:", ["childs", "children", "childrens"], 1, "Plural irregular: children."],
        ["gap", "two ___ (lens)", ["lenses"], "Después de s se agrega -es."],
        ["mc", "«El laboratorio de Sarah»", ["the lab of Sarah", "Sarah's lab", "the Sarah lab"], 1, "Dueño + 's + cosa."],
        ["gap", "We love ___ new laser. (nuestro)", ["our"], "we → our."],
        ["mc", "The people in my lab ___ very friendly.", ["is", "are", "be"], 1, "«People» es plural."],
        ["mc", "___ university in Colorado", ["a", "an"], 0, "«University» empieza con sonido «iu» (consonante): a."],
        ["order", "This|is|my|colleague,|Priya.", "Ella es mi colega, Priya."],
        ["order", "What's|your|sister's|name?", "¿Cómo se llama tu hermana?"],
        ["tr", "Mi esposa se llama Ana.", ["My wife's name is Ana", "My wife is called Ana", "My wife is named Ana"], "Literalmente: «el nombre de mi esposa es Ana»."],
        ["tr", "Tengo dos hermanas.", ["I have two sisters", "I've got two sisters", "I have 2 sisters"], ""],
      ],
      dialogue: {
        ctx: "Hora del almuerzo. Priya, estudiante de doctorado del grupo, conversa con Daniel sobre sus familias.",
        lines: [
          ["Priya", "So, Daniel, is your family in Colombia?", "Entonces, Daniel, ¿tu familia está en Colombia?"],
          ["Daniel", "Yes, they are. My parents live in Popayán.", "Sí. Mis padres viven en Popayán."],
          ["Priya", "Do you have brothers or sisters?", "¿Tienes hermanos o hermanas?"],
          ["Daniel", "I have one sister. Her name is Laura. She's a doctor.", "Tengo una hermana. Se llama Laura. Es médica."],
          ["Priya", "Nice! My brother is a doctor too.", "¡Qué bien! Mi hermano también es médico."],
          ["Daniel", "And I'm married. My wife's name is Ana. She's a teacher.", "Y estoy casado. Mi esposa se llama Ana. Es profesora."],
          ["Priya", "Is she here with you?", "¿Está aquí contigo?"],
          ["Daniel", "Not yet. She's coming in December.", "Todavía no. Llega en diciembre."],
          ["Priya", "That's great. My partner, Alex, is an engineer. You can meet him at the party on Friday.", "Qué bien. Mi pareja, Alex, es ingeniero. Puedes conocerlo en la fiesta del viernes."],
          ["Daniel", "Sounds great!", "¡Suena genial!"],
        ],
      },
      mission: {
        who: "Priya, tu colega, a la hora del almuerzo",
        role: "Priya, a friendly PhD student and colleague, chatting with the learner at lunch about families.",
        scene: "Almuerzas con una colega. Habla de tu familia y pregúntale por la suya.",
        goals: ["Describe a dos personas de tu familia", "Di sus nombres o profesiones", "Usa un posesivo como his, her o their", "Pregúntale por su familia"],
        start: "So, tell me about your family. Is it big or small?",
        guided: [
          ["Is your family big or small?", "It's a small family. I have one sister and my parents."],
          ["What's your sister's name?", "Her name is Laura. She's a doctor."],
          ["Where do your parents live?", "My parents live in Popayán, in Colombia."],
          ["Do you have a photo?", "Yes! This is my sister, and these are my parents."],
        ],
      },
      links: [
        ["Posesión: 's y of (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/possession-john-s-car-a-friend-of-mine", "Cuándo usar 's y cuándo «of».", "Gramática"],
        ["Artículos a, an, the (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/a-an-and-the", "La guía de referencia de los artículos.", "Gramática"],
        ["YouGlish: «my family»", "https://youglish.com/pronounce/my%20family/english", "Nativos hablando de su familia.", "Frases"],
        ["ELLLO", "https://www.elllo.org/", "Miles de conversaciones reales cortas entre personas de todo el mundo.", "Escuchar"],
      ],
    },
    /* ---------------- A1·3 ---------------- */
    {
      title: "Tu rutina", en: "I usually start at nine",
      goal: "describir tu rutina diaria y semanal y preguntar por la de otros.",
      focus: "present simple (affirmative, negative, questions with do/does), adverbs of frequency",
      grammar: `
<h3>Presente simple: lo que haces normalmente</h3>
<p>Se usa para rutinas, hábitos y hechos generales. La forma es el verbo base; con <b>he / she / it</b> agrega <b>-s</b>:</p>
<ul class="ex">
<li><em>I work at a university.</em> <span class="es">— Trabajo en una universidad.</span></li>
<li><em>She works at a hospital.</em> <span class="es">— Ella trabaja en un hospital.</span></li>
<li><em>Light travels very fast.</em> <span class="es">— La luz viaja muy rápido (hecho).</span></li>
</ul>
<p>Ortografía con he/she/it: <em>watch → watches</em>, <em>go → goes</em>, <em>study → studies</em>, <em>have → has</em>.</p>
<h3>Negativo y preguntas con DO / DOES</h3>
<div class="formula">I/you/we/they don't + verbo · he/she/it doesn't + verbo<br>Do/Does + sujeto + verbo…?</div>
<ul class="ex">
<li><em>I don't work on weekends.</em> <span class="es">— No trabajo los fines de semana.</span></li>
<li><em>Mike doesn't drink coffee.</em> <span class="es">— Mike no toma café.</span></li>
<li><em>Do you like your job?</em> <span class="es">— ¿Te gusta tu trabajo?</span></li>
<li><em>What time does the lab open?</em> <span class="es">— ¿A qué hora abre el laboratorio?</span></li>
</ul>
<div class="ojo"><p>La -s va en <b>un solo</b> lugar. <del>Does she works?</del> → <em>Does she work?</em> · <del>She don't know.</del> → <em>She doesn't know.</em></p></div>
<h3>¿Con qué frecuencia? always, usually, often, sometimes, never</h3>
<p>Van <b>antes</b> del verbo principal, pero <b>después</b> de to be:</p>
<ul class="ex">
<li><em>I usually get up at six.</em></li>
<li><em>She never works on Sundays.</em></li>
<li><em>I'm always tired on Mondays.</em> <span class="es">(después de «am»)</span></li>
</ul>
<p>Para frecuencias exactas: <em>once a week</em>, <em>twice a month</em>, <em>three times a day</em>, <em>every morning</em>.</p>`,
      sound: {
        t: "La -s de la tercera persona",
        tip: "La <b>-s</b> de <i>works, reads, watches</i> sigue la misma regla que los plurales: /s/, /z/ o /ɪz/. Y ojo: <b>does</b> suena «das» (/dʌz/), no «dous».",
        w: ["work|works", "read|reads", "watch|watches", "study|studies", "does", "goes"],
      },
      vocab: [
        ["get up", "levantarse", "I get up at six."],
        ["have breakfast", "desayunar", "I have breakfast at home."],
        ["commute", "ir y venir del trabajo; trayecto", "My commute is twenty minutes."],
        ["start / finish", "empezar / terminar", "We start at nine and finish at five."],
        ["meeting", "reunión", "We have a meeting every Monday."],
        ["lunch", "almuerzo", "I have lunch at noon."],
        ["usually", "normalmente", "I usually take the bus."],
        ["sometimes", "a veces", "Sometimes I work from home."],
        ["never", "nunca", "I never work on Sundays."],
        ["weekend", "fin de semana", "What do you do on weekends?"],
        ["free time", "tiempo libre", "In my free time I play squash."],
        ["busy", "ocupado", "I'm busy in the mornings."],
      ],
      phrases: [
        ["I usually get up at six.", "Normalmente me levanto a las seis."],
        ["I take the bus to work.", "Voy al trabajo en bus."],
        ["What time do you start work?", "¿A qué hora empiezas a trabajar?"],
        ["I start at nine and finish at five.", "Empiezo a las nueve y termino a las cinco."],
        ["I don't work on weekends.", "No trabajo los fines de semana."],
        ["How often do you go to the gym?", "¿Con qué frecuencia vas al gimnasio?"],
        ["Twice a week.", "Dos veces por semana."],
        ["On Saturdays I play squash.", "Los sábados juego squash."],
        ["What do you do in your free time?", "¿Qué haces en tu tiempo libre?"],
        ["I'm usually busy in the mornings.", "Normalmente estoy ocupado en las mañanas."],
      ],
      ex: [
        ["mc", "Sarah ___ the lab at 8:00.", ["open", "opens", "opening"], 1, "He/she/it + verbo con -s."],
        ["mc", "___ Mike work on Saturdays?", ["Do", "Does", "Is"], 1, "Pregunta en presente simple con he/she/it: does."],
        ["gap", "I ___ drink coffee. (negativo)", ["don't", "do not"], "Negativo con I: don't + verbo."],
        ["gap", "He ___ (study) optics.", ["studies"], "Consonante + y → -ies."],
        ["mc", "Posición correcta:", ["I am always tired.", "I always am tired.", "Always I am tired."], 0, "Con to be, el adverbio va después."],
        ["gap", "She ___ (watch) the news every night.", ["watches"], "Después de ch se agrega -es."],
        ["mc", "Does she ___ in Boulder?", ["lives", "live", "living"], 1, "Después de does, el verbo va sin -s."],
        ["order", "I|usually|start|at|nine.", "Normalmente empiezo a las nueve."],
        ["order", "What|time|does|she|finish?", "¿A qué hora termina ella?"],
        ["tr", "No trabajo los domingos.", ["I don't work on Sundays", "I do not work on Sundays", "I never work on Sundays"], ""],
        ["tr", "¿A qué hora empiezas a trabajar?", ["What time do you start work?", "What time do you start working?", "When do you start work?", "What time do you start to work?", "When do you start working?"], ""],
      ],
      dialogue: {
        ctx: "Mike, el técnico, y Daniel comparan sus horarios mientras preparan el laboratorio.",
        lines: [
          ["Mike", "What time do you usually get here, Daniel?", "¿A qué hora llegas normalmente, Daniel?"],
          ["Daniel", "I usually arrive at eight thirty. And you?", "Normalmente llego a las ocho y media. ¿Y tú?"],
          ["Mike", "I start at seven. I like the lab when it's quiet.", "Empiezo a las siete. Me gusta el laboratorio cuando está tranquilo."],
          ["Daniel", "Wow, that's early! What time do you finish?", "¡Uf, qué temprano! ¿A qué hora terminas?"],
          ["Mike", "At three thirty. Then I pick up my kids from school.", "A las tres y media. Luego recojo a mis hijos en el colegio."],
          ["Daniel", "Do you work on weekends?", "¿Trabajas los fines de semana?"],
          ["Mike", "Never! On weekends I go hiking with my family. What about you?", "¡Nunca! Los fines de semana hago senderismo con mi familia. ¿Y tú?"],
          ["Daniel", "I play squash on Saturdays. Is there a squash court on campus?", "Juego squash los sábados. ¿Hay cancha de squash en el campus?"],
          ["Mike", "Yes, there is. It's at the sports center, next to the library.", "Sí. Está en el centro deportivo, al lado de la biblioteca."],
          ["Daniel", "Great, thanks!", "¡Genial, gracias!"],
        ],
      },
      mission: {
        who: "Mike, el técnico, organizando los turnos del laboratorio",
        role: "Mike, the lab technician, who is making the lab schedule and asks about the learner's routine. Friendly and practical.",
        scene: "Mike necesita organizar los turnos del laboratorio. Cuéntale tu rutina diaria y semanal.",
        goals: ["Di a qué hora empiezas y terminas", "Usa un adverbio de frecuencia", "Cuenta algo que haces el fin de semana", "Pregúntale por su rutina"],
        start: "Hey! I'm making the lab schedule. What time do you usually start work?",
        guided: [
          ["What time do you usually start work?", "I usually start at eight thirty."],
          ["And what time do you finish?", "I finish at five, but on Fridays I finish at three."],
          ["Do you work on weekends?", "No, I don't. On Saturdays I play squash with friends."],
          ["How often do you have classes?", "I teach three times a week: Monday, Wednesday and Friday."],
        ],
      },
      links: [
        ["Present simple (Perfect English Grammar)", "https://www.perfect-english-grammar.com/present-simple.html", "Explicación y ejercicios gratuitos.", "Gramática"],
        ["Present simple (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/present-simple", "Referencia completa con ejemplos.", "Gramática"],
        ["YouGlish: «I usually»", "https://youglish.com/pronounce/I%20usually/english", "Cómo hablan los nativos de sus rutinas.", "Frases"],
        ["ESL-Lab · fácil", "https://www.esl-lab.com/easy/", "Audios de la vida diaria con ejercicios.", "Escuchar"],
      ],
    },
    /* ---------------- A1·4 ---------------- */
    {
      title: "Números, fechas y unidades", en: "It's about 3.5 meters",
      goal: "leer en voz alta números, decimales, potencias de diez, unidades, fechas y horas.",
      focus: "numbers, decimals, powers of ten, units, dates and time",
      grammar: `
<h3>Números grandes</h3>
<ul class="ex">
<li><em>two hundred and fifty</em> <span class="es">— 250 (en EE. UU. también «two hundred fifty»)</span></li>
<li><em>three thousand</em> <span class="es">— 3000 (sin -s: «three thousands» es incorrecto)</span></li>
<li><em>one million</em> <span class="es">— 1 000 000</span></li>
<li><em>one billion</em> <span class="es">— 10⁹, es decir, mil millones</span></li>
</ul>
<div class="ojo"><p><b>billion</b> = 10⁹ (mil millones), <b>no</b> «billón». Nuestro billón (10¹²) es <b>trillion</b>. Y el inglés usa <b>punto decimal</b> y <b>coma para miles</b>: 3.5 y 1,000.</p></div>
<h3>Decimales, fracciones y potencias</h3>
<div class="tbl"><table>
<tr><th>Escrito</th><th>Se dice</th></tr>
<tr><td>3.14</td><td><em>three point one four</em> (cada dígito por separado)</td></tr>
<tr><td>0.02</td><td><em>zero point zero two</em></td></tr>
<tr><td>½ · ⅓ · ¾</td><td><em>a half</em> · <em>a third</em> · <em>three quarters</em></td></tr>
<tr><td>x² · x³</td><td><em>x squared</em> · <em>x cubed</em></td></tr>
<tr><td>10⁻⁶</td><td><em>ten to the minus six</em></td></tr>
<tr><td>6.02 × 10²³</td><td><em>six point oh two times ten to the twenty-third</em></td></tr>
<tr><td>√2</td><td><em>the square root of two</em></td></tr>
</table></div>
<h3>Unidades</h3>
<ul class="ex">
<li><em>nine point eight meters per second squared</em> <span class="es">— 9.8 m/s²</span></li>
<li><em>twenty-three degrees Celsius</em> <span class="es">— 23 °C</span></li>
<li><em>three hundred kelvin</em> <span class="es">— 300 K (sin «degrees»)</span></li>
<li><em>six hundred thirty-three nanometers</em> <span class="es">— 633 nm</span></li>
</ul>
<h3>Fechas y horas</h3>
<p>En EE. UU. la fecha se escribe <b>mes/día/año</b>: 03/04/2026 es <b>March 4th</b>. Se dice <em>March fourth</em>. Los años: <em>twenty twenty-six</em> (2026), <em>nineteen oh five</em> (1905).</p>
<ul class="ex">
<li><em>It's nine thirty.</em> / <em>It's half past nine.</em> <span class="es">— 9:30</span></li>
<li><em>It's a quarter to ten.</em> <span class="es">— 9:45</span></li>
</ul>`,
      sound: {
        t: "-teen o -ty: el acento lo cambia todo",
        tip: "<i>thirTEEN</i> (13) lleva el acento al final y una t clara; <i>THIRty</i> (30) lo lleva al principio, y en EE. UU. la t suena casi como una r suave. Confundirlos en un laboratorio es un error de un orden de magnitud… casi literal.",
        w: ["thirteen|thirty", "fourteen|forty", "fifteen|fifty", "sixteen|sixty", "seventeen|seventy", "eighteen|eighty"],
      },
      vocab: [
        ["decimal point", "coma decimal (punto)", "Put the decimal point here."],
        ["percent", "por ciento", "The error is five percent."],
        ["half / quarter", "mitad / cuarto", "It takes half an hour."],
        ["squared / cubed", "al cuadrado / al cubo", "The area is four meters squared."],
        ["per", "por (en unidades)", "ten meters per second"],
        ["degree", "grado", "It's twenty degrees Celsius."],
        ["measure", "medir", "Can you measure the length?"],
        ["length / width", "largo / ancho", "The length is two meters."],
        ["weight / mass", "peso / masa", "Mass is measured in kilograms."],
        ["temperature", "temperatura", "What's the temperature in the lab?"],
        ["about / roughly", "aproximadamente", "It's about three meters."],
        ["wavelength", "longitud de onda", "The wavelength is 633 nanometers."],
      ],
      phrases: [
        ["What's the temperature?", "¿Qué temperatura hay?"],
        ["It's twenty-three degrees Celsius.", "Hay veintitrés grados Celsius."],
        ["How long is it?", "¿Cuánto mide de largo?"],
        ["It's about three and a half meters.", "Mide unos tres metros y medio."],
        ["The speed is ten meters per second.", "La velocidad es de diez metros por segundo."],
        ["When is your birthday?", "¿Cuándo es tu cumpleaños?"],
        ["It's on May fifth.", "Es el cinco de mayo."],
        ["What time is it?", "¿Qué hora es?"],
        ["It's a quarter to ten.", "Son las diez menos cuarto."],
        ["Can you say that number again?", "¿Puedes repetir ese número?"],
      ],
      ex: [
        ["mc", "10⁹ en inglés es:", ["a million", "a billion", "a trillion"], 1, "Billion = mil millones."],
        ["mc", "3.14 se lee:", ["three comma fourteen", "three point one four", "three point fourteen"], 1, "Después del punto, los dígitos se leen uno por uno."],
        ["mc", "La fecha 03/04/2026 en EE. UU. es:", ["3 de abril", "4 de marzo"], 1, "Formato estadounidense: mes/día/año."],
        ["gap", "x² se lee «x ___».", ["squared"], ""],
        ["gap", "300 K se lee «three hundred ___».", ["kelvin"], "Con kelvin no se dice «degrees»."],
        ["mc", "¿Cuál lleva el acento en la primera sílaba?", ["thirteen", "thirty"], 1, "Las decenas (-ty) se acentúan al principio."],
        ["gap", "½ → a ___", ["half"], ""],
        ["mc", "10⁻³ se lee:", ["ten to the minus three", "ten minus three", "ten at the less three"], 0, ""],
        ["order", "nine|point|eight|meters|per|second|squared", "9.8 m/s²"],
        ["tr", "Son las diez y media.", ["It's half past ten", "It's ten thirty", "It is half past ten", "It is ten thirty"], ""],
        ["tr", "Mide unos dos metros.", ["It's about two meters", "It measures about two meters", "It's about two meters long", "It's roughly two meters", "It's around two meters", "It measures around two meters", "It's approximately two meters", "It measures approximately two meters"], ""],
      ],
      dialogue: {
        ctx: "Mike y Daniel toman medidas para instalar un montaje óptico nuevo.",
        lines: [
          ["Mike", "Can you help me measure the table?", "¿Me ayudas a medir la mesa?"],
          ["Daniel", "Sure. How long is it?", "Claro. ¿Cuánto mide de largo?"],
          ["Mike", "It's two point four meters. And it's one point two meters wide.", "Mide dos coma cuatro metros. Y uno coma dos de ancho."],
          ["Daniel", "OK. What's the room temperature?", "Bien. ¿Cuál es la temperatura del cuarto?"],
          ["Mike", "Twenty-one degrees Celsius. We keep it stable, plus or minus half a degree.", "Veintiún grados Celsius. La mantenemos estable, más o menos medio grado."],
          ["Daniel", "Great. And the laser wavelength is six hundred thirty-three nanometers, right?", "Perfecto. Y la longitud de onda del láser es de 633 nanómetros, ¿verdad?"],
          ["Mike", "Exactly. It's a helium-neon laser. Six thirty-three.", "Exacto. Es un láser de helio-neón. Seis treinta y tres."],
          ["Daniel", "When is the new laser coming?", "¿Cuándo llega el láser nuevo?"],
          ["Mike", "On October fifteenth. That's a Thursday.", "El 15 de octubre. Es un jueves."],
          ["Daniel", "Perfect. I'll write it on the calendar.", "Perfecto. Lo anoto en el calendario."],
        ],
      },
      mission: {
        who: "Mike, que te pide leerle datos por teléfono",
        role: "Mike, the lab technician, on the phone. He asks the learner to read values from the lab notebook aloud (the learner types them in words). Ask for one value at a time: a decimal voltage, a power of ten, a temperature, a date. Correct how numbers are said.",
        scene: "Mike está fuera y te llama: necesita que le leas los valores de tu cuaderno. Escríbelos en palabras, como los dirías en voz alta.",
        goals: ["Lee un número decimal", "Lee una potencia de diez", "Lee una temperatura con su unidad", "Di una fecha"],
        start: "Hi! I need the numbers from your notebook. The screen says 3.75 V. How do you say that?",
        guided: [
          ["How do you say 3.75 V?", "Three point seven five volts."],
          ["And 2 × 10⁻³ A?", "Two times ten to the minus three amperes. Or: two milliamps."],
          ["What's the temperature? It says 25 °C.", "Twenty-five degrees Celsius."],
          ["When is the next test? It says 10/15.", "On October fifteenth."],
        ],
      },
      links: [
        ["Números en inglés (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/numbers", "Cómo se leen cifras, decimales, fracciones y fechas.", "Gramática"],
        ["YouGlish: «to the minus»", "https://youglish.com/pronounce/to%20the%20minus/english", "Escucha a profesores y científicos leyendo potencias negativas.", "Frases,Física"],
        ["MinutePhysics (YouTube)", "https://www.youtube.com/@minutephysics", "Física en videos cortos, con números y unidades dichos en voz alta.", "Física"],
        ["Khan Academy Physics", "https://www.khanacademy.org/science/physics", "Clases de física en inglés claro; útil para oír unidades y cálculos.", "Física"],
      ],
    },
    /* ---------------- A1·5 ---------------- */
    {
      title: "Lugares y objetos", en: "There's a lab on the second floor",
      goal: "describir dónde están las cosas y dar indicaciones sencillas en un edificio.",
      focus: "there is / there are, some/any, prepositions of place, this/that/these/those",
      grammar: `
<h3>«Hay» = there is / there are</h3>
<p>El inglés no usa «have» para decir «hay». Usa <b>there is</b> (singular) y <b>there are</b> (plural):</p>
<ul class="ex">
<li><em>There's a printer next to the door.</em> <span class="es">— Hay una impresora junto a la puerta.</span></li>
<li><em>There are four optical tables in the lab.</em> <span class="es">— Hay cuatro mesas ópticas en el laboratorio.</span></li>
<li><em>Is there a kitchen?</em> — <em>Yes, there is.</em></li>
<li><em>There aren't any chairs.</em> <span class="es">— No hay sillas.</span></li>
</ul>
<p><b>some</b> en afirmativo, <b>any</b> en negativo y preguntas: <em>There are some cables in the drawer.</em> · <em>Are there any questions?</em></p>
<div class="ojo"><p><del>Have two lasers in the lab.</del> → <em>There are two lasers in the lab.</em></p></div>
<h3>Preposiciones de lugar</h3>
<div class="tbl"><table>
<tr><th>Inglés</th><th>Español</th><th>Ejemplo</th></tr>
<tr><td>in</td><td>dentro de, en</td><td><em>in the box</em></td></tr>
<tr><td>on</td><td>sobre, en (superficie)</td><td><em>on the table</em></td></tr>
<tr><td>next to</td><td>al lado de</td><td><em>next to the window</em></td></tr>
<tr><td>between</td><td>entre</td><td><em>between the laser and the lens</em></td></tr>
<tr><td>under / above</td><td>debajo de / encima de</td><td><em>under the desk</em></td></tr>
<tr><td>in front of / behind</td><td>delante de / detrás de</td><td><em>behind the door</em></td></tr>
<tr><td>across from</td><td>frente a (al otro lado)</td><td><em>across from the elevator</em></td></tr>
</table></div>
<p>Pisos: <em>on the second floor</em> (con <b>on</b>, no «in»).</p>
<h3>this, that, these, those</h3>
<p><b>this / these</b> = cerca (este, estos) · <b>that / those</b> = lejos (ese/aquel, esos/aquellos).</p>
<ul class="ex"><li><em>Is this your notebook?</em></li><li><em>Those are my samples.</em></li></ul>`,
      sound: {
        t: "El sonido TH",
        tip: "Pon la punta de la lengua entre los dientes y sopla. Hay dos versiones: sorda /θ/ como en <i>three, think</i> (parecida a la z de España) y sonora /ð/ como en <i>this, there</i> (como la d suave de «nada»). Evita decir «tree» cuando quieres decir <i>three</i>.",
        w: ["three|tree", "think|sink", "thanks", "this", "there", "these|those"],
      },
      vocab: [
        ["building", "edificio", "The lab is in the physics building."],
        ["floor", "piso (nivel); suelo", "My office is on the second floor."],
        ["room", "cuarto, sala", "This is the meeting room."],
        ["desk", "escritorio", "My desk is next to the window."],
        ["shelf (shelves)", "estante (estantes)", "The manuals are on the shelf."],
        ["drawer", "cajón", "The cables are in the drawer."],
        ["hallway", "pasillo", "The kitchen is at the end of the hallway."],
        ["stairs / elevator", "escaleras / ascensor", "Take the stairs to the third floor."],
        ["restroom", "baño (en lugar público)", "Where's the restroom?"],
        ["cabinet", "armario, gabinete", "The safety glasses are in the cabinet."],
        ["next to", "al lado de", "It's next to the printer."],
        ["upstairs / downstairs", "arriba / abajo (piso)", "The library is upstairs."],
      ],
      phrases: [
        ["Excuse me, where's the restroom?", "Disculpe, ¿dónde está el baño?"],
        ["It's down the hall, on the left.", "Está al fondo del pasillo, a la izquierda."],
        ["Is there a printer on this floor?", "¿Hay una impresora en este piso?"],
        ["There are some cables in the drawer.", "Hay unos cables en el cajón."],
        ["The oscilloscope is on the shelf, next to the power supply.", "El osciloscopio está en el estante, al lado de la fuente de poder."],
        ["Go upstairs to the second floor.", "Sube al segundo piso."],
        ["It's between the kitchen and my office.", "Está entre la cocina y mi oficina."],
        ["Is this your notebook?", "¿Este es tu cuaderno?"],
        ["Those are my samples.", "Esas son mis muestras."],
        ["Let me show you around.", "Déjame mostrarte el lugar."],
      ],
      ex: [
        ["mc", "___ two oscilloscopes in the lab.", ["There is", "There are", "They are"], 1, "Plural: there are."],
        ["mc", "The meeting room is ___ the third floor.", ["in", "on", "at"], 1, "Pisos: on."],
        ["gap", "Is there ___ coffee? (algo de)", ["any"], "En preguntas: any."],
        ["mc", "«Hay un problema.»", ["Have a problem.", "There is a problem.", "It has a problem."], 1, "«Hay» = there is."],
        ["gap", "The cables are ___ the box. (dentro de)", ["in", "inside"], ""],
        ["mc", "Objetos lejanos, en plural:", ["this", "these", "those"], 2, "Those = esos/aquellos."],
        ["mc", "The lens is ___ the laser and the detector.", ["between", "among", "next"], 0, "Entre dos cosas: between."],
        ["order", "The|laser|is|on|the|shelf.", "El láser está en el estante."],
        ["order", "Are|there|any|questions?", "¿Hay preguntas?"],
        ["tr", "Hay una impresora junto a la puerta.", ["There is a printer next to the door", "There's a printer next to the door", "There is a printer by the door", "There's a printer by the door", "Next to the door there is a printer"], ""],
        ["tr", "¿Dónde está el baño?", ["Where is the restroom?", "Where is the bathroom?", "Where is the toilet?", "Where are the restrooms?", "Where is the washroom?"], "En EE. UU., en lugares públicos: restroom."],
      ],
      dialogue: {
        ctx: "Priya le muestra a Daniel el laboratorio y el edificio.",
        lines: [
          ["Priya", "Let me show you around.", "Déjame mostrarte el lugar."],
          ["Daniel", "Thanks!", "¡Gracias!"],
          ["Priya", "This is the main lab. There are four optical tables here.", "Este es el laboratorio principal. Aquí hay cuatro mesas ópticas."],
          ["Daniel", "Wow, it's big. Where's my desk?", "¡Uf, es grande! ¿Dónde está mi escritorio?"],
          ["Priya", "Your desk is in the office, next to mine. It's on the second floor.", "Tu escritorio está en la oficina, al lado del mío. Está en el segundo piso."],
          ["Daniel", "Is there a kitchen?", "¿Hay cocina?"],
          ["Priya", "Yes, there's a small kitchen at the end of the hall. There's a coffee machine and a fridge.", "Sí, hay una cocina pequeña al fondo del pasillo. Hay una cafetera y una nevera."],
          ["Daniel", "Perfect. And where are the safety glasses?", "Perfecto. ¿Y dónde están las gafas de seguridad?"],
          ["Priya", "They're in the cabinet, behind the door. Always wear them with the lasers!", "Están en el armario, detrás de la puerta. ¡Úsalas siempre con los láseres!"],
          ["Daniel", "Of course. Safety first.", "Claro. La seguridad primero."],
        ],
      },
      mission: {
        who: "Un estudiante nuevo que se perdió en tu edificio",
        role: "Jake, a new undergraduate student who is lost in the learner's building and asks where things are. Ask one thing at a time: library, restroom, a lab, a printer.",
        scene: "Un estudiante nuevo te pregunta dónde están las cosas en tu edificio de trabajo. Describe el lugar real donde trabajas.",
        goals: ["Usa there is o there are", "Usa tres preposiciones de lugar", "Da una indicación (go upstairs, turn left…)", "Pregunta si necesita algo más"],
        start: "Hi, sorry, I'm new here. Is there a library in this building?",
        guided: [
          ["Is there a library in this building?", "Yes, there is. It's on the first floor, next to the cafeteria."],
          ["Where's the restroom?", "It's down the hall, on the right, between the elevator and the stairs."],
          ["Are there any printers on this floor?", "There's one in room 204, behind the door."],
          ["Thanks! Where's the physics lab?", "Go upstairs to the third floor. It's the second door on the left."],
        ],
      },
      links: [
        ["There is / there are (Perfect English Grammar)", "https://www.perfect-english-grammar.com/there-is-there-are.html", "Explicación y ejercicios.", "Gramática"],
        ["Preposiciones de lugar (Perfect English Grammar)", "https://www.perfect-english-grammar.com/prepositions-of-place.html", "in, on, at y compañía.", "Gramática"],
        ["Tim's Pronunciation Workshop (BBC)", "https://www.bbc.co.uk/learningenglish/english/features/pronunciation", "Incluye episodios sobre el sonido th.", "Pronunciación"],
        ["Sounds of Speech (Univ. de Iowa)", "https://soundsofspeech.uiowa.edu/", "Animaciones de la boca para cada sonido del inglés.", "Pronunciación"],
      ],
    },
    /* ---------------- A1·6 ---------------- */
    {
      title: "Pedir y preguntar", en: "Could you help me?",
      goal: "pedir cosas con cortesía, preguntar precios y pedir que te repitan.",
      focus: "can / could for requests and ability, I'd like, wh-questions and question word order",
      grammar: `
<h3>CAN: poder (habilidad y permiso)</h3>
<p><b>can</b> no cambia con la persona y el verbo que sigue va <b>sin «to»</b>:</p>
<ul class="ex">
<li><em>I can speak Spanish.</em> <span class="es">— Sé hablar español.</span></li>
<li><em>She can't come today.</em> <span class="es">— Ella no puede venir hoy.</span></li>
<li><em>Can I ask you a question?</em> <span class="es">— ¿Puedo hacerte una pregunta?</span></li>
</ul>
<div class="ojo"><p><del>Can you to help me?</del> → <em>Can you help me?</em></p></div>
<h3>Pedir con cortesía</h3>
<p><b>Could</b> suena más amable que can. <b>I'd like</b> (= I would like) es la forma educada de «quiero»; «I want» puede sonar brusco.</p>
<ul class="ex">
<li><em>Could you help me, please?</em></li>
<li><em>I'd like a coffee, please.</em></li>
<li><em>Can I get a muffin?</em> <span class="es">(muy común en cafeterías de EE. UU.)</span></li>
<li><em>Could you speak more slowly, please?</em></li>
</ul>
<h3>Preguntas con what, where, when, who, why, how</h3>
<div class="formula">palabra interrogativa + auxiliar (do/does/is/can…) + sujeto + verbo</div>
<ul class="ex">
<li><em>Where do you work?</em></li>
<li><em>How much is it?</em> / <em>How much does it cost?</em></li>
<li><em>What does "cryostat" mean?</em> <span class="es">— ¿Qué significa «cryostat»?</span></li>
<li><em>How do you spell that?</em> <span class="es">— ¿Cómo se escribe?</span></li>
</ul>
<div class="ojo"><p><del>How much costs it?</del> → <em>How much does it cost?</em> · <del>What means…?</del> → <em>What does … mean?</em></p></div>`,
      sound: {
        t: "can / can't: la diferencia está en la vocal",
        tip: "En una frase, <i>can</i> se reduce a /kən/ («kn»): <i>I can go</i> suena «ai-kn-GOU». En cambio <i>can't</i> conserva la vocal abierta /æ/ y se acentúa: «ai-KÆNT-gou». Fíjate más en la vocal y el acento que en la t final, que casi no se oye.",
        w: ["I can go.|I can't go.", "Can you help me?", "could", "I'd like", "would"],
      },
      vocab: [
        ["help", "ayudar; ayuda", "Could you help me?"],
        ["borrow", "pedir prestado", "Can I borrow your pen?"],
        ["lend", "prestar", "Can you lend me a pen?"],
        ["order", "pedir (en restaurante); orden", "Are you ready to order?"],
        ["price", "precio", "What's the price?"],
        ["receipt", "recibo", "Do you want a receipt?"],
        ["check", "la cuenta (restaurante, EE. UU.)", "Can I have the check, please?"],
        ["available", "disponible", "Is this room available?"],
        ["open / closed", "abierto / cerrado", "The library is closed on Sundays."],
        ["spell", "deletrear", "How do you spell your name?"],
        ["mean", "significar", "What does this word mean?"],
        ["slowly", "despacio", "Could you speak more slowly?"],
      ],
      phrases: [
        ["Could you help me, please?", "¿Podría ayudarme, por favor?"],
        ["Can I borrow your pen?", "¿Me prestas tu bolígrafo?"],
        ["I'd like a coffee, please.", "Quisiera un café, por favor."],
        ["How much is it?", "¿Cuánto cuesta?"],
        ["Can I pay by card?", "¿Puedo pagar con tarjeta?"],
        ["Could you speak more slowly, please?", "¿Podría hablar más despacio, por favor?"],
        ["What does this word mean?", "¿Qué significa esta palabra?"],
        ["How do you spell that?", "¿Cómo se escribe eso?"],
        ["Can I ask you a question?", "¿Puedo hacerte una pregunta?"],
        ["Excuse me, is this seat free?", "Disculpe, ¿está libre este asiento?"],
      ],
      ex: [
        ["mc", "Can you ___ me?", ["help", "to help", "helping"], 0, "Después de can, verbo sin «to»."],
        ["mc", "Pedido cortés:", ["I want water.", "I'd like some water, please.", "Give me water."], 1, ""],
        ["gap", "___ much is the ticket?", ["How"], ""],
        ["mc", "How much ___ it cost?", ["is", "does", "do"], 1, "Verbo «cost» en pregunta: does it cost."],
        ["gap", "I ___ see the screen. (no puedo)", ["can't", "cannot", "can not"], ""],
        ["mc", "¿Qué pregunta es correcta?", ["What means \"setup\"?", "What does \"setup\" mean?", "What does mean \"setup\"?"], 1, ""],
        ["mc", "Para pedir la cuenta en EE. UU.:", ["Can I have the check, please?", "Can I have the count, please?", "The bill me, please."], 0, ""],
        ["order", "Could|you|speak|more|slowly?", "¿Podría hablar más despacio?"],
        ["order", "How|do|you|spell|that?", "¿Cómo se escribe eso?"],
        ["tr", "¿Puedo pagar con tarjeta?", ["Can I pay by card?", "Can I pay with a card?", "Can I pay with card?", "Could I pay by card?", "May I pay by card?", "Can I pay by credit card?", "Can I pay with my card?"], ""],
        ["tr", "¿Me puedes ayudar, por favor?", ["Can you help me, please?", "Could you help me, please?", "Can you help me?", "Could you help me?"], ""],
      ],
      dialogue: {
        ctx: "Daniel pide algo en la cafetería del campus. Emma, la barista, habla rápido.",
        lines: [
          ["Emma", "Hi! What can I get you?", "¡Hola! ¿Qué te sirvo?"],
          ["Daniel", "Hi. I'd like a large coffee, please.", "Hola. Quisiera un café grande, por favor."],
          ["Emma", "Sure. Hot or iced?", "Claro. ¿Caliente o frío?"],
          ["Daniel", "Hot, please. And can I get a muffin?", "Caliente, por favor. ¿Y me das un muffin?"],
          ["Emma", "Of course. Blueberry or chocolate?", "Por supuesto. ¿De arándanos o de chocolate?"],
          ["Daniel", "Sorry, could you repeat that?", "Perdón, ¿puedes repetir?"],
          ["Emma", "Blueberry or chocolate?", "¿De arándanos o de chocolate?"],
          ["Daniel", "Chocolate, please. How much is it?", "De chocolate, por favor. ¿Cuánto es?"],
          ["Emma", "That's six fifty.", "Son seis cincuenta."],
          ["Daniel", "Can I pay by card?", "¿Puedo pagar con tarjeta?"],
          ["Emma", "Sure, tap here. Do you want a receipt?", "Claro, acércala aquí. ¿Quieres el recibo?"],
          ["Daniel", "No, thanks. Have a nice day!", "No, gracias. ¡Que tengas un buen día!"],
        ],
      },
      mission: {
        who: "Emma, barista de una cafetería muy concurrida",
        role: "Emma, a barista at a busy campus café. You speak a bit fast and offer options (size, hot or iced, milk, something to eat). Give a price when asked.",
        scene: "Pide algo en una cafetería. La barista habla rápido: pide con cortesía, pregunta el precio, pide que te repita algo y paga.",
        goals: ["Pide con I'd like o Can I get", "Pregunta el precio", "Pide que te repita algo", "Pregunta cómo pagar"],
        start: "Hi there! What can I get for you today?",
        guided: [
          ["What can I get for you today?", "Hi! I'd like a large coffee, please."],
          ["Sure! Hot or iced? And any milk?", "Sorry, could you repeat that, please?"],
          ["Hot or iced? Do you want milk?", "Hot, please, with a little milk. How much is it?"],
          ["That's four seventy-five.", "Can I pay by card? Thank you!"],
        ],
      },
      links: [
        ["Can (Cambridge)", "https://dictionary.cambridge.org/grammar/british-grammar/can", "Usos de can para habilidad, permiso y pedidos.", "Gramática"],
        ["Cómo formar preguntas (Perfect English Grammar)", "https://www.perfect-english-grammar.com/questions.html", "El orden de las palabras en preguntas.", "Gramática"],
        ["YouGlish: «could you»", "https://youglish.com/pronounce/could%20you/english", "Pedidos corteses en contexto real.", "Frases"],
        ["BBC Real Easy English", "https://www.bbc.co.uk/learningenglish/english/features/real-easy-english", "Situaciones de compras, cafés y transporte.", "Escuchar"],
      ],
    },
  ],
});
