/* Capítulo 37 — Diseño de chatbots */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, K = L.clf;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const DATOS = {
    reservar: ['quiero reservar una mesa', 'necesito una mesa para cuatro personas', 'reserva una mesa para mañana', 'me gustaría reservar para esta noche', 'mesa para dos el viernes por favor', 'puedo hacer una reserva', 'quisiera reservar a las nueve', 'apúntame una mesa para el sábado'],
    cancelar: ['quiero cancelar mi reserva', 'cancela la mesa de mañana', 'ya no voy a poder ir, anula la reserva', 'necesito anular mi reserva', 'borra mi reserva por favor', 'no podré asistir, cancélala', 'deseo cancelar la mesa del viernes', 'elimina la reserva a nombre de ana'],
    horario: ['a qué hora abren', 'cuál es el horario', 'hasta qué hora cierran', 'abren los domingos', 'cuándo abren por la mañana', 'tienen horario de almuerzo', 'qué días están cerrados', 'a qué hora cierra la cocina'],
    menu: ['qué platos tienen', 'tienen opciones vegetarianas', 'me puede decir el menú', 'hay platos sin gluten', 'cuánto cuesta el menú del día', 'qué postres hay', 'quiero ver la carta', 'tienen comida para niños'],
    saludo: ['hola', 'buenas tardes', 'buenos días', 'qué tal', 'hola, buenas', 'saludos', 'buenas noches', 'hey, hola'],
    adios: ['adiós', 'hasta luego', 'gracias, nada más', 'eso es todo, gracias', 'chao', 'hasta pronto', 'muchas gracias, adiós', 'nos vemos']
  };
  const NUM = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 };
  const RESP = { saludo: '¡Hola! Puedo reservar una mesa, cancelarla o informarle del horario y la carta.', horario: 'Abrimos de martes a domingo, de 13:00 a 16:00 y de 20:00 a 23:30.', menu: 'Tenemos menú del día, opciones vegetarianas y sin gluten. ¿Quiere reservar?', adios: '¡Hasta pronto!', cancelar: 'Su reserva ha quedado cancelada.' };
  let NB = null;
  const intenciones = (t) => {
    if (!NB) { const x = [], y = []; Object.entries(DATOS).forEach(([k, v]) => v.forEach((f) => { x.push(f); y.push(k); })); NB = K.tuberia({ modelo: 'nb', n: [1, 2], alpha: 0.3 })(x, y); }
    const i = NB.info, p = K.nbProb(i.modelo, i.rep(t));
    return i.modelo.clases.map((c, k) => [c, p[k]]).sort((a, b) => b[1] - a[1]);
  };
  const nuevoEstado = () => ({ fase: 'libre', personas: null, dia: null });
  NL.defineSim('chatbot-reservas', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const log = document.createElement('div'); log.className = 'mono-box'; log.style.whiteSpace = 'pre-wrap'; log.style.minHeight = '9em'; box.append(log);
    const info = document.createElement('div'); info.style.marginTop = '8px'; box.append(info);
    let e = nuevoEstado();
    const add = (q, t) => { log.insertAdjacentHTML('beforeend', `<b>${q}</b> ${esc(t)}\n`); };
    sim.group('Conversación');
    const inp = sim.text('m', { label: 'Su mensaje', value: '', placeholder: 'Escriba y pulse Enviar' });
    sim.slider('u', { label: 'Umbral de confianza para entender', min: 0.2, max: 0.95, step: 0.05, value: 0.5, fmt: (v) => NL.fix(v, 2) });
    const send = () => {
      const t = (sim.p.m || '').trim(); if (!t) return;
      add('Usted:', t);
      const ps = intenciones(t), mejor = ps[0], s = t.toLowerCase();
      const n = s.match(/\b(\d+|un|una|dos|tres|cuatro|cinco|seis)\s+personas?\b/), d = s.match(/\b(hoy|mañana|esta noche|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/);
      let intent = mejor[1] < sim.p.u ? null : mejor[0];
      if (e.fase === 'esperando_personas' && /^\s*(\d+|un|una|dos|tres|cuatro|cinco|seis)\s*$/.test(s)) { e.personas = NUM[s.trim()] || +s; intent = 'reservar'; }
      else if (e.fase === 'esperando_dia' && d) intent = 'reservar';
      if (intent === 'reservar') { if (n) e.personas = NUM[n[1]] || +n[1]; if (d) e.dia = d[1]; }
      let resp;
      if (intent === null) resp = 'No lo he entendido. Puedo reservar o cancelar una mesa, o decirle el horario y la carta.';
      else if (intent === 'reservar') {
        if (!e.personas) { resp = '¿Para cuántas personas?'; e.fase = 'esperando_personas'; }
        else if (!e.dia) { resp = '¿Para qué día?'; e.fase = 'esperando_dia'; }
        else { resp = `Listo: mesa para ${e.personas} el ${e.dia}. ¿Algo más?`; e = nuevoEstado(); }
      } else { resp = RESP[intent]; if (intent === 'cancelar' || intent === 'adios') e = nuevoEstado(); }
      add('Bot:', resp);
      info.innerHTML = `<small style="color:var(--ink-3)">Intención: <b>${intent || 'ninguna (confianza ' + NL.fix(mejor[1], 2) + ' bajo el umbral)'}</b> · más probables: ${ps.slice(0, 3).map(([c, v]) => c + ' ' + NL.fix(v, 2)).join(', ')} · huecos: personas = ${e.personas || '—'}, día = ${e.dia || '—'} · estado del diálogo: <b>${e.fase}</b></small>`;
      inp.set('', true); inp.input.value = '';
    };
    inp.input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); send(); } });
    sim.button('Enviar', send, { primary: true });
    sim.button('Reiniciar', () => { log.innerHTML = ''; info.innerHTML = ''; e = nuevoEstado(); add('Bot:', RESP.saludo); });
    add('Bot:', RESP.saludo);
  });
  NL.bank.add('chatbots', [
    { q: 'En un chatbot orientado a tareas, una «intención» es…', opts: ['Lo que el usuario quiere hacer (reservar, cancelar, preguntar el horario)', 'Una palabra clave', 'Un error', 'La emoción del usuario'], ok: 0, fb: 'Se detecta con un clasificador de texto (capítulo 27).', lvl: 1 },
    { q: 'Los «huecos» (slots) son…', opts: ['Los datos que hay que rellenar para cumplir la intención (número de personas, día, hora)', 'Las pausas de la voz', 'Las respuestas', 'Los saludos'], ok: 0, fb: 'Se extraen con expresiones regulares, etiquetado de entidades o un modelo.', lvl: 1 },
    { q: 'El gestor de diálogo…', opts: ['Decide qué hacer en cada turno según el estado: qué falta, qué preguntar, cuándo ejecutar', 'Traduce', 'Clasifica el idioma', 'Genera audio'], ok: 0, fb: 'Puede ser una máquina de estados, un modelo aprendido o un modelo de lenguaje con herramientas.', lvl: 2 },
    { q: 'Un buen chatbot, cuando la confianza en la intención es baja, debe…', opts: ['Decir que no ha entendido y ofrecer opciones o pasar a una persona', 'Inventar una respuesta', 'Ignorar al usuario', 'Repetir la última respuesta'], ok: 0, fb: 'El umbral de confianza evita respuestas equivocadas dichas con seguridad.', lvl: 1 },
    { q: 'En el programa, «Quisiera comer pizza en Marte» recibe 0,31 de confianza para «reservar». Con un umbral de 0,5, el bot…', opts: ['Dice que no la ha entendido', 'Reserva una mesa', 'Cancela una reserva', 'Se cierra'], ok: 0, fb: 'Fuera del dominio (out-of-domain): ninguna intención lo cubre.', lvl: 2 },
    { q: 'Para evaluar un chatbot no basta la exactitud del clasificador de intenciones porque…', opts: ['Hay que medir si la conversación completa cumple el objetivo (tareas completadas, turnos, satisfacción)', 'La exactitud no se puede calcular', 'Solo importa la velocidad', 'Los usuarios no importan'], ok: 0, fb: 'Se combinan métricas automáticas con pruebas con usuarios reales.', lvl: 2 },
    { q: 'Un riesgo de los chatbots basados en modelos grandes es…', opts: ['Alucinaciones, fugas de datos privados y respuestas fuera de las políticas del negocio', 'Que no entienden español', 'Que son siempre lentos', 'Que no pueden usar herramientas'], ok: 0, fb: 'Se mitigan con recuperación de fuentes, filtros, límites de acciones y supervisión humana.', lvl: 2 }
  ]);
})();
