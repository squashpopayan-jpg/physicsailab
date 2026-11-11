/* Capítulo 36 — Agentes conversacionales */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, K = L.clf;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const ACTOS = {
    pregunta: ['¿qué hora es?', '¿dónde está la estación?', '¿cuánto cuesta el billete?', '¿cómo se llega al centro?', '¿quién ganó el partido?', '¿cuándo abren las tiendas?', '¿por qué llueve tanto?', '¿tienes hora?'],
    petición: ['pásame la sal por favor', 'cierra la puerta', 'ayúdame con la maleta', 'necesito que me envíes el archivo', 'por favor, baja el volumen', 'dime tu nombre', 'tráeme un vaso de agua', 'abre la ventana'],
    afirmación: ['hoy hace mucho calor', 'el tren llega a las ocho', 'me gusta el café con leche', 'mañana tengo examen', 'el museo está cerrado', 'vivo en una ciudad pequeña', 'ayer vi una película', 'mi hermano trabaja en un banco'],
    saludo: ['hola', 'buenos días', 'buenas tardes', 'qué tal estás', 'hola, cómo va todo', 'buenas noches', 'saludos a todos', 'hey, hola'],
    agradecimiento: ['gracias', 'muchas gracias por todo', 'te lo agradezco', 'mil gracias', 'gracias por tu ayuda', 'te agradezco mucho', 'qué amable, gracias', 'agradecido por la respuesta'],
    despedida: ['adiós', 'hasta luego', 'nos vemos mañana', 'hasta pronto', 'chao', 'me tengo que ir', 'que tengas un buen día', 'hasta la próxima']
  };
  let M = null;
  const modelo = () => M || (M = (() => { const x = [], y = []; Object.entries(ACTOS).forEach(([k, v]) => v.forEach((f) => { x.push(f); y.push(k); })); return K.tuberia({ modelo: 'nb', n: [1, 2], alpha: 0.3 })(x, y); })());
  NL.defineSim('actos-habla', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Enunciado');
    sim.text('t', { label: 'Escriba una frase', value: '¿Puede pasarme la sal?' });
    sim.out('a', 'Acto de habla predicho', { hl: true });
    sim.onDraw(() => {
      const info = modelo().info, p = K.nbProb(info.modelo, info.rep(sim.p.t)), cl = info.modelo.clases;
      const o = p.map((v, i) => [cl[i], v]).sort((a, b) => b[1] - a[1]);
      sim.set('a', `${o[0][0]} (${NL.fix(o[0][1], 2)})`);
      box.innerHTML = `<table class="mx"><tbody>${o.map(([c, v], i) => `<tr><td style="text-align:left">${esc(c)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(v, 3)}</td><td style="text-align:left"><span style="display:inline-block;height:9px;width:${Math.round(180 * v)}px;background:var(--c1,#4c78a8);border-radius:2px"></span></td></tr>`).join('')}</tbody></table>` +
        `<small style="color:var(--ink-3)">Clasificador de Bayes ingenuo entrenado con 48 frases de ejemplo. «¿Puede pasarme la sal?» tiene forma de pregunta pero es una petición indirecta (acto de habla indirecto): un modelo de palabras acierta si las palabras clave de la petición están en el entrenamiento.</small>`;
    });
  });
  NL.bank.add('agentes', [
    { q: 'Un agente conversacional es…', opts: ['Un sistema que mantiene un diálogo con una persona en lenguaje natural, por texto o voz', 'Un traductor', 'Un buscador', 'Un corrector ortográfico'], ok: 0, fb: 'Puede ser un chatbot de texto, un asistente de voz o un agente que actúa con herramientas.', lvl: 1 },
    { q: 'Según Grice, la máxima de cantidad pide…', opts: ['Dar tanta información como se necesita, ni más ni menos', 'Decir la verdad', 'Ser relevante', 'Ser claro'], ok: 0, fb: 'Las cuatro: cantidad, calidad, relación (relevancia) y modo.', lvl: 2 },
    { q: '«¿Puede pasarme la sal?» es un ejemplo de…', opts: ['Acto de habla indirecto: parece pregunta y es petición', 'Ambigüedad léxica', 'Una pregunta sobre capacidad solamente', 'Un saludo'], ok: 0, fb: 'La pragmática del capítulo 1: la intención no está en la forma literal.', lvl: 1 },
    { q: 'Entre turnos, las personas dejan pausas de unos 200 ms. Esto obliga a un agente de voz a…', opts: ['Predecir el final del turno del usuario y responder con baja latencia', 'Esperar 5 segundos', 'Hablar siempre primero', 'No interrumpir jamás'], ok: 0, fb: 'La latencia y la gestión de turnos son centrales en la voz.', lvl: 3 },
    { q: 'ELIZA mantiene la apariencia de conversación gracias a…', opts: ['Reglas de patrones y reflexión de pronombres, sin comprender', 'Una red neuronal', 'Un corpus enorme', 'Un diccionario semántico'], ok: 0, fb: 'Es el «efecto ELIZA»: la gente atribuye comprensión a respuestas simples.', lvl: 1 },
    { q: 'Los agentes orientados a tareas se diferencian de los de dominio abierto en que…', opts: ['Persiguen un objetivo concreto (reservar, consultar) con datos que rellenar', 'No usan lenguaje', 'Solo hablan de deportes', 'No necesitan gestor de diálogo'], ok: 0, fb: 'Suelen estructurarse en comprensión, gestor de diálogo y generación.', lvl: 2 },
    { q: 'Los tres módulos clásicos de un agente orientado a tareas son…', opts: ['Comprensión (NLU), gestor de diálogo y generación (NLG)', 'Tokenizador, etiquetador y analizador', 'Entrada, proceso y salida', 'Embeddings, atención y softmax'], ok: 0, fb: 'En los agentes basados en modelos grandes, estos módulos se funden en uno, a menudo con herramientas externas.', lvl: 2 }
  ]);
})();
