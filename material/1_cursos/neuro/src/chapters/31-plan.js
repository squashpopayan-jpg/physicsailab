/* Capítulo 31 — Su plan: de la evidencia a la rutina, conectado con «Mi progreso» */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, En = L.en;
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v) => { const x = RC.parseNum(v); return isFinite(x) ? x : NaN; };

  /* Hábitos sugeridos: [clave, nombre, señal, área, para qué metas] */
  const HAB = [
    ['pesar', 'Pesarme y anotarlo', 'Al levantarme, después de ir al baño', 'otro', ['grasa']],
    ['prot', 'Proteína en cada comida (palma de la mano o más)', 'Al servir cada comida', 'comida', ['grasa', 'deporte']],
    ['verdura', 'Media porción del plato con verduras o frutas', 'Al servir el almuerzo y la cena', 'comida', ['grasa']],
    ['fuerza', 'Entrenamiento de fuerza', 'Lunes y jueves al salir del trabajo', 'deporte', ['grasa', 'deporte']],
    ['caminar', 'Caminar 20 minutos', 'Después de almorzar', 'deporte', ['grasa', 'habito']],
    ['rpe', 'Anotar minutos y esfuerzo (RPE) de cada sesión', 'Al terminar de entrenar, antes de bañarme', 'deporte', ['deporte']],
    ['dormir', 'Apagar pantallas y acostarme a la hora fijada', 'A las 22:00, alarma en el celular', 'sueno', ['grasa', 'deporte', 'habito']],
    ['tecnica', 'Práctica técnica deliberada con una meta concreta', 'Al llegar a la cancha, antes de jugar', 'deporte', ['deporte']],
    ['mente', '10 minutos de lectura o estudio del curso', 'Con el café de la mañana', 'mente', ['habito']],
    ['agua', 'Llevar la botella de agua y tenerla a la vista', 'Al salir de casa', 'otro', ['habito']]
  ];

  function chart(parent, drawFn) {
    const wrap = RC.el('div', 'chart');
    const c = document.createElement('canvas');
    wrap.append(c);
    parent.append(wrap);
    const cv = { el: c, ctx: c.getContext('2d'), w: 0, h: 0, dpr: 1 };
    const draw = () => {
      const w = Math.round(wrap.clientWidth), h = Math.round(wrap.clientHeight);
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w !== cv.w || h !== cv.h || dpr !== cv.dpr) { cv.w = w; cv.h = h; cv.dpr = dpr; c.width = w * dpr; c.height = h * dpr; cv.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      try { drawFn(cv); } catch (e) { console.error(e); }
    };
    new ResizeObserver(draw).observe(wrap);
    RC.onTheme.push(draw);
    cv.redraw = draw;
    return cv;
  }

  RC.defineSim('mi-plan', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const root = sim.html('trk');
    const T = RC.track, P = T.state.perfil;
    const st = {
      meta: 'grasa', sexo: P.sexo || 'h', edad: P.edad || 35, talla: P.talla || 170, peso: P.peso0 || 80,
      grasa: P.grasaPct || '', pal: [1.4, 1.55, 1.75, 1.95].reduce((a, b) => (Math.abs(b - (P.pal || 1.55)) < Math.abs(a - (P.pal || 1.55)) ? b : a)), metaPeso: P.metaPeso || '', ritmo: 0.5
    };
    root.innerHTML = `
      <fieldset><legend>1 · Su objetivo principal</legend>
        <div class="row" role="group">
          <label style="flex-direction:row;gap:6px;align-items:center;font-size:14px;color:var(--ink)"><input type="radio" name="pl-meta" value="grasa"> Perder grasa sin perder músculo</label>
          <label style="flex-direction:row;gap:6px;align-items:center;font-size:14px;color:var(--ink)"><input type="radio" name="pl-meta" value="deporte"> Rendir mejor en mi deporte</label>
          <label style="flex-direction:row;gap:6px;align-items:center;font-size:14px;color:var(--ink)"><input type="radio" name="pl-meta" value="habito"> Construir hábitos y bienestar</label>
        </div>
      </fieldset>
      <fieldset><legend>2 · Sus datos</legend>
        <div class="grid">
          <label>Sexo<select data-k="sexo"><option value="h">Hombre</option><option value="m">Mujer</option></select></label>
          <label>Edad (años)<input class="num" data-k="edad" inputmode="numeric"></label>
          <label>Estatura (cm)<input class="num" data-k="talla" inputmode="numeric"></label>
          <label>Peso actual (kg)<input class="num" data-k="peso" inputmode="decimal"></label>
          <label>Grasa corporal (%; opcional)<input class="num" data-k="grasa" inputmode="decimal" placeholder="se estima"></label>
          <label>Actividad habitual<select data-k="pal"><option value="1.4">Sedentaria</option><option value="1.55">Poco activa</option><option value="1.75">Activa</option><option value="1.95">Muy activa</option></select></label>
          <label class="solograsa">Peso meta (kg)<input class="num" data-k="metaPeso" inputmode="decimal"></label>
          <label class="solograsa">Ritmo inicial<select data-k="ritmo"><option value="0.25">0,25 % del peso por semana (suave)</option><option value="0.5">0,5 % por semana (recomendado)</option><option value="0.75">0,75 % por semana</option><option value="1">1 % por semana (exigente)</option></select></label>
        </div>
      </fieldset>
      <fieldset><legend>3 · Su plan</legend>
        <div class="kpis"></div>
        <div class="proy"></div>
        <div class="notas"></div>
      </fieldset>
      <fieldset><legend>4 · Hábitos para empezar</legend>
        <p>Elija dos o tres, no más: es mejor sostener pocos que abandonar muchos (capítulo 16). Puede editar la señal antes de crearlos.</p>
        <div class="hab-sug hab-list"></div>
        <div class="row" style="margin-top:10px"><button type="button" class="btn primary" data-act="crear">Crear los elegidos en «Mi progreso»</button><button type="button" class="btn" data-act="perfil">Guardar mis datos en «Mi progreso»</button><span class="msg"></span></div>
      </fieldset>`;
    const $ = (s) => root.querySelector(s);
    root.querySelectorAll('input[name="pl-meta"]').forEach((r) => { r.checked = r.value === st.meta; r.addEventListener('change', () => { st.meta = r.value; render(); }); });
    root.querySelectorAll('[data-k]').forEach((el) => {
      el.value = String(st[el.dataset.k]);
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { st[el.dataset.k] = el.value; render(); });
    });
    let proy = null, cv = null;

    function calcular() {
      const sexo = st.sexo, edad = num(st.edad), talla = num(st.talla), peso = num(st.peso), pal = +st.pal;
      const grasa = num(st.grasa), meta = num(st.metaPeso), ritmo = +st.ritmo;
      if (!(edad >= 15 && edad <= 95 && talla >= 120 && talla <= 230 && peso >= 30 && peso <= 300)) return { error: 'Revise edad, estatura y peso.' };
      const o = { sexo, edad, talla, peso, pal, grasaPct: grasa > 3 && grasa < 70 ? grasa : 0 };
      const s = En.hallInit(o);
      const mant = s.EI0 / En.KJ;
      const r = { o, s, mant, peso, talla, imc: En.imc(peso, talla / 100), pct: s.pct, meta, ritmo };
      if (st.meta === 'grasa' && meta > 0 && meta < peso) {
        const rho = En.rhoEff(s.F0).kcalKg;
        r.deficit = Math.min(1000, ((ritmo / 100) * peso / 7) * rho);
        const sim2 = En.hallSim(o, (t, ss) => ({ kcal: ss.EI0 / En.KJ - r.deficit }), 730, 1);
        r.sim = sim2;
        r.dia = sim2.BW.findIndex((b) => b <= meta);
        r.mantMeta = mant - 24 * (peso - meta);
        r.imcMeta = En.imc(meta, talla / 100);
      }
      const pRef = st.meta === 'grasa' && meta > 0 && meta < peso ? meta : peso;
      r.prot = st.meta === 'habito' ? [1.0 * pRef, 1.2 * pRef] : st.meta === 'deporte' ? [1.4 * pRef, 2.0 * pRef] : [1.6 * pRef, 2.2 * pRef];
      return r;
    }

    function render() {
      root.querySelectorAll('.solograsa').forEach((el) => { el.hidden = st.meta !== 'grasa'; });
      const r = calcular();
      const k = $('.kpis'), notas = $('.notas');
      if (r.error) { k.innerHTML = ''; notas.innerHTML = `<p class="warnmsg">${r.error}</p>`; $('.proy').innerHTML = ''; proy = null; return; }
      const items = [
        ['Mantenimiento estimado', RC.nf(r.mant, 0) + ' kcal/día'],
        ['Grasa estimada', RC.nf(r.pct, 0) + ' %'],
        ['Proteína', `${RC.nf(r.prot[0], 0)}–${RC.nf(r.prot[1], 0)} g/día`]
      ];
      if (r.deficit) {
        items.push(['Comer al día', RC.nf(r.mant - r.deficit, 0) + ' kcal']);
        items.push(['Meta alcanzada', r.dia > 0 ? `≈ ${RC.nf(r.dia / 7, 0)} semanas` : 'más de 2 años']);
        items.push(['Mantenimiento en la meta', RC.nf(r.mantMeta, 0) + ' kcal/día']);
      }
      k.innerHTML = items.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('');
      const n = [];
      if (st.meta === 'grasa') {
        if (!r.deficit) n.push('<p class="muted">Escriba un peso meta menor que su peso actual para proyectar la pérdida.</p>');
        else {
          n.push(`<p>Con ${RC.nf(r.deficit, 0)} kcal/día menos que su gasto inicial, el modelo de Hall (capítulo 23) proyecta la curva de arriba. Al principio la báscula baja más rápido por el agua y el glucógeno; después, cada vez más despacio. En la práctica, el apetito aumentará a medida que baje (capítulo 26): espere mesetas y revise el plan con la tendencia de su peso en <a href="#progreso">Mi progreso</a>, no con el dato de un día.</p>`);
          if (r.imcMeta < 18.5) n.push(`<p class="warnmsg">Su peso meta da un índice de masa corporal de ${RC.nf(r.imcMeta, 1)}, por debajo de 18,5. Consulte con un profesional antes de buscar ese peso.</p>`);
          if (r.ritmo >= 1) n.push('<p class="warnmsg">Un ritmo de 1 % semanal es exigente: aumenta la pérdida de masa magra y el riesgo de energía disponible baja si entrena mucho (capítulo 21).</p>');
        }
        n.push('<p>Entrenamiento: fuerza 2 o 3 veces por semana (todo el cuerpo), actividad aeróbica que disfrute hasta sumar 150 a 300 minutos semanales, y pasos a lo largo del día. Sueño: 7 a 9 horas.</p>');
      } else if (st.meta === 'deporte') {
        n.push('<p>Carga: registre minutos × RPE de cada sesión; aumente la carga semanal de forma gradual y programe una semana de descarga cada 3 a 6 semanas (capítulo 21). Antes de una competencia importante, reduzca el volumen 40–60 % durante unas dos semanas manteniendo la intensidad.</p>');
        n.push('<p>Técnica: práctica variada y mezclada, con metas concretas por bloque (capítulo 19); imaginería PETTLEP y una rutina previa para los golpes cerrados (capítulo 20). Fuerza 2 veces por semana. Sueño: 7 a 9 horas, más si entrena mucho.</p>');
        n.push(`<p>Energía: coma al menos su mantenimiento (unas ${RC.nf(Math.round(r.mant / 10) * 10, 0)} kcal/día más el gasto de los entrenamientos fuertes) para no caer en energía disponible baja.</p>`);
      } else {
        n.push('<p>Empiece con dos hábitos pequeños atados a señales que ya existen en su día (capítulo 15). Márquelos cada día en <a href="#progreso">Mi progreso</a> y responda cada semana el índice de automaticidad (SRBAI): verá su propia curva de formación de hábito.</p>');
        n.push('<p>Si falla un día, no pasa nada: lo que predice el abandono es fallar dos seguidos. Use la regla «nunca dos veces» y diseñe el entorno para que lo fácil sea lo correcto (capítulo 16). Actividad: 150 a 300 minutos semanales; sueño de 7 a 9 horas.</p>');
      }
      n.push('<p class="muted">Estimaciones educativas basadas en modelos validados en promedio; no sustituyen la valoración de un profesional de la salud, sobre todo si tiene una enfermedad o toma medicamentos.</p>');
      notas.innerHTML = n.join('');
      const box = $('.proy');
      if (r.deficit) {
        if (!proy) { box.innerHTML = ''; cv = chart(box, (c) => dibujar(c)); proy = true; }
        proy = r;
        cv.redraw();
      } else { box.innerHTML = ''; proy = null; cv = null; }
    }
    function dibujar(c) {
      const r = proy;
      if (!r || !r.sim) return;
      RC.draw.clear(c);
      const D = r.dia > 0 ? Math.min(730, Math.max(84, Math.ceil(r.dia * 1.4 / 7) * 7)) : 730;
      const t = r.sim.t.slice(0, D + 1), bw = r.sim.BW.slice(0, D + 1);
      const pl = new RC.Plot(c.ctx, { x: 0, y: 0, w: c.w, h: c.h, xmin: 0, xmax: D / 7, ymin: Math.floor(Math.min(r.meta, ...bw) - 2), ymax: Math.ceil(r.peso + 1), xlabel: 'semanas', ylabel: 'peso (kg)' });
      pl.frame();
      pl.hline(r.meta, { color: '--gain', label: 'meta', labelRight: true });
      pl.xy(t.map((d) => d / 7), bw, { color: '--c1', width: 2.6 });
      if (r.dia > 0 && r.dia <= D) pl.dot(r.dia / 7, r.meta, { color: '--c1', label: `semana ${RC.nf(r.dia / 7, 0)}` });
    }

    const sug = $('.hab-sug');
    const pintarSug = () => {
      const lista = HAB.filter((h) => h[4].includes(st.meta));
      sug.innerHTML = lista.map(([key, nom, sen]) => `<div class="hab-item" style="grid-template-columns:auto minmax(0,1fr)"><input type="checkbox" id="pl-h-${key}" data-h="${key}" style="width:20px;height:20px"><div style="display:grid;gap:4px;min-width:0"><b><label for="pl-h-${key}" style="display:inline;font-size:14.5px;color:var(--ink)">${esc(nom)}</label></b><input data-s="${key}" value="${esc(sen)}" aria-label="Señal para ${esc(nom)}"></div></div>`).join('');
    };
    root.querySelectorAll('input[name="pl-meta"]').forEach((r) => r.addEventListener('change', pintarSug));
    const msg = $('.msg');
    $('[data-act="crear"]').addEventListener('click', () => {
      const elegidos = [...sug.querySelectorAll('input[data-h]:checked')].map((c) => c.dataset.h);
      if (!elegidos.length) { msg.className = 'warnmsg'; msg.textContent = 'Marque al menos un hábito.'; return; }
      let n = 0;
      elegidos.forEach((key) => {
        const h = HAB.find((x) => x[0] === key);
        if (T.state.habitos.some((x) => x.nombre === h[1])) return;
        T.addHabito({ nombre: h[1], senal: (sug.querySelector(`input[data-s="${key}"]`).value || h[2]).trim().slice(0, 100), area: h[3] });
        n++;
      });
      msg.className = 'msg';
      msg.innerHTML = n ? `${n} hábito${n > 1 ? 's' : ''} creado${n > 1 ? 's' : ''}. Márquelos cada día en <a href="#progreso">Mi progreso</a>.` : 'Esos hábitos ya estaban en «Mi progreso».';
    });
    $('[data-act="perfil"]').addEventListener('click', () => {
      const r = calcular();
      if (r.error) { msg.className = 'warnmsg'; msg.textContent = r.error; return; }
      T.setPerfil({ sexo: st.sexo, edad: num(st.edad), talla: num(st.talla), peso0: num(st.peso), grasaPct: r.o.grasaPct || 0, pal: +st.pal, metaPeso: num(st.metaPeso) > 0 ? num(st.metaPeso) : 0, inicio: T.state.perfil.inicio || T.ymd() });
      msg.className = 'msg';
      msg.innerHTML = 'Datos guardados. La pestaña <a href="#progreso">Cuerpo</a> los usará para su proyección.';
    });
    pintarSug();
    render();
  });

  RC.defineSim('quiz-plan', function (sim) {
    RC.quiz(sim, [
      { q: 'Su peso no bajó esta semana pese a cumplir el plan. ¿Qué hace?', opts: ['Corta 500 kcal más de inmediato', 'Mira la tendencia de 2 a 3 semanas antes de cambiar nada', 'Abandona el plan'], ok: 1, fb: 'El ruido diario del peso es de 1 a 2 kg (capítulo 18).' },
      { q: '¿Cuántos hábitos nuevos conviene empezar a la vez?', opts: ['Diez', 'Dos o tres, atados a señales que ya existen', 'Ninguno'], ok: 1, fb: 'Capítulos 15 y 16.' },
      { q: 'Si falla un día su hábito…', opts: ['Ya no sirve: empezar de cero', 'No importa mucho; evite fallar dos días seguidos', 'Debe compensar con el doble'], ok: 1, fb: 'En el estudio de Lally, fallar un día no afectó la formación del hábito.' },
      { q: 'La señal más fiable para ajustar las calorías es…', opts: ['Lo que dice la app de calorías', 'La tendencia del peso medido con regularidad', 'El hambre de cada día'], ok: 1, fb: 'Medir la ingesta tiene errores grandes (capítulo 23).' }
    ], { id: 'plan', shuffle: true });
  });
})();
