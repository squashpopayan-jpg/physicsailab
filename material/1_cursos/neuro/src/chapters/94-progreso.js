/* Apéndice A — Mi progreso: tablero personal de hábitos, cuerpo, entrenamiento y curso.
   Los datos viven en RC.track (core/40-track.js): base de datos privada del Artifact y localStorage. */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L;
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v) => { const x = RC.parseNum(v); return isFinite(x) ? x : null; };
  const AREAS = [['deporte', 'Deporte'], ['comida', 'Alimentación'], ['sueno', 'Sueño'], ['mente', 'Mente y estudio'], ['otro', 'Otro']];
  const TIPOS_ENT = ['Fuerza', 'Carrera', 'Ciclismo', 'Natación', 'Deporte de raqueta', 'Fútbol u otro deporte de equipo', 'Caminata', 'Intervalos (HIIT)', 'Movilidad o yoga', 'Otro'];

  /* Lienzo propio con nitidez en pantallas de alta densidad y redibujo al cambiar de tamaño o de tema */
  function chart(parent, drawFn) {
    const wrap = RC.el('div', 'chart');
    const c = document.createElement('canvas');
    wrap.append(c);
    parent.append(wrap);
    const cv = { el: c, wrap, ctx: c.getContext('2d'), w: 0, h: 0, dpr: 1 };
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

  RC.defineSim('mi-progreso', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const root = sim.html('trk');
    const T = RC.track;
    let tab = 'hoy', fecha = T.ymd(), habSel = null;
    try { tab = localStorage.getItem('recablear:tab') || 'hoy'; } catch (e) { /* */ }

    const TABS = [['hoy', 'Hoy'], ['habitos', 'Hábitos'], ['cuerpo', 'Cuerpo'], ['entreno', 'Entrenamiento'], ['curso', 'Curso'], ['datos', 'Datos']];
    root.innerHTML = `<div class="trk-tabs" role="tablist">${TABS.map(([k, t]) => `<button type="button" data-tab="${k}">${t}</button>`).join('')}</div>
      <div class="trk-status"><span><i class="dot"></i><span class="st"></span></span></div>
      <div class="trk-body"></div>`;
    const body = root.querySelector('.trk-body');
    root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; try { localStorage.setItem('recablear:tab', tab); } catch (e) { /* */ } render(); }));
    const status = () => {
      root.querySelector('.st').textContent = T.status;
      root.querySelector('.dot').className = 'dot ' + (T.backend === 'db' ? 'ok' : 'loc');
    };

    /* ================= Pestaña Hoy ================= */
    function renderHoy() {
      const d = T.dia(fecha) || {};
      const habs = T.state.habitos.filter((h) => h.activo);
      const hoy = T.ymd();
      const dt = T.parse(fecha);
      const dia = dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      body.innerHTML = `
        <div class="row"><button type="button" class="btn" data-act="prev">←</button><input type="date" class="fecha" value="${fecha}" max="${hoy}" style="width:auto"><button type="button" class="btn" data-act="next" ${fecha >= hoy ? 'disabled' : ''}>→</button>
          ${fecha !== hoy ? '<button type="button" class="btn" data-act="hoy">Ir a hoy</button>' : ''}<span class="muted">${esc(dia)}</span></div>
        <fieldset><legend>Hábitos</legend>
          ${habs.length ? `<div class="hab-list">${habs.map((h) => {
            const v = d.h ? d.h[h.id] : undefined;
            const st = rachas(h);
            return `<div class="hab-item"><button type="button" class="chk ${v === 1 ? 'si' : v === 0 ? 'no' : ''}" data-hab="${h.id}" aria-label="Marcar ${esc(h.nombre)}" title="Clic: cumplido → fallado → sin marcar">${v === 1 ? '✓' : v === 0 ? '✗' : ''}</button>
              <div><b>${esc(h.nombre)}</b><small>${esc(h.senal || '')}${h.tipo === 'evitar' ? ' · hábito para evitar: marque ✓ si lo evitó' : ''}</small></div>
              <div class="stk">racha ${st.actual}<br><span class="muted">mejor ${st.mejor}</span></div></div>`;
          }).join('')}</div><p class="muted" style="margin-top:8px">Un clic marca ✓ cumplido, el segundo ✗ fallado y el tercero lo deja sin marcar.</p>` : '<p>Aún no tiene hábitos. Créelos en la pestaña <b>Hábitos</b>.</p>'}
        </fieldset>
        <fieldset><legend>Medidas del día</legend><div class="grid">
          <label>Peso (kg)<input class="num" data-k="peso" inputmode="decimal" value="${d.peso ?? ''}" placeholder="—"></label>
          <label>Cintura (cm)<input class="num" data-k="cintura" inputmode="decimal" value="${d.cintura ?? ''}" placeholder="—"></label>
          <label>Sueño anoche (horas)<input class="num" data-k="sueno" inputmode="decimal" value="${d.sueno ?? ''}" placeholder="—"></label>
          <label>Pasos<input class="num" data-k="pasos" inputmode="numeric" value="${d.pasos ?? ''}" placeholder="—"></label>
        </div><label style="margin-top:10px">Nota del día<textarea data-k="nota" rows="2" placeholder="Cómo se sintió, qué facilitó o dificultó sus hábitos…">${esc(d.nota || '')}</textarea></label></fieldset>
        <fieldset><legend>Entrenamiento</legend>
          ${(d.ent || []).length ? `<div class="tablewrap"><table class="log"><thead><tr><th>Tipo</th><th>Min</th><th>RPE</th><th>Carga</th><th></th></tr></thead><tbody>${d.ent.map((e, i) => `<tr><td>${esc(e.tipo)}</td><td class="n">${e.min}</td><td class="n">${e.rpe}</td><td class="n">${Math.round(e.min * e.rpe)}</td><td><button type="button" class="btn" data-del="${i}">Quitar</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin sesiones registradas este día.</p>'}
          <div class="grid" style="margin-top:8px">
            <label>Tipo<select class="et">${TIPOS_ENT.map((t) => `<option>${t}</option>`).join('')}</select></label>
            <label>Minutos<input class="num em" inputmode="numeric" placeholder="45"></label>
            <label>Esfuerzo percibido (RPE 0–10)<input class="num er" inputmode="decimal" placeholder="6"></label>
            <label>&nbsp;<button type="button" class="btn primary" data-act="addent">Agregar sesión</button></label>
          </div><p class="muted">RPE: 0 reposo, 3 moderado, 5 duro, 7 muy duro, 10 máximo. Anótelo unos 30 minutos después de terminar.</p><div class="warnmsg entmsg"></div>
        </fieldset>`;
      body.querySelector('.fecha').addEventListener('change', (e) => { if (e.target.value) { fecha = e.target.value > hoy ? hoy : e.target.value; render(); } });
      body.querySelector('[data-act="prev"]').addEventListener('click', () => { fecha = T.addDays(fecha, -1); render(); });
      const nx = body.querySelector('[data-act="next"]');
      if (nx) nx.addEventListener('click', () => { if (fecha < hoy) { fecha = T.addDays(fecha, 1); render(); } });
      const bh = body.querySelector('[data-act="hoy"]');
      if (bh) bh.addEventListener('click', () => { fecha = hoy; render(); });
      body.querySelectorAll('[data-hab]').forEach((b) => b.addEventListener('click', () => {
        const cur = (T.dia(fecha) || {}).h || {};
        const v = cur[b.dataset.hab];
        T.setHabDia(fecha, b.dataset.hab, v === undefined ? 1 : v === 1 ? 0 : null);
      }));
      body.querySelectorAll('[data-k]').forEach((inp) => {
        inp.addEventListener('change', () => {
          const k = inp.dataset.k;
          if (k === 'nota') { T.setDia(fecha, { nota: inp.value.trim() || null }); return; }
          const v = num(inp.value);
          const lim = { peso: [25, 350], cintura: [40, 250], sueno: [0, 16], pasos: [0, 100000] }[k];
          if (v !== null && (v < lim[0] || v > lim[1])) { inp.value = ''; return; }
          T.setDia(fecha, { [k]: v });
        });
      });
      body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => T.delSesion(fecha, +b.dataset.del)));
      body.querySelector('[data-act="addent"]').addEventListener('click', () => {
        const m = num(body.querySelector('.em').value), r = num(body.querySelector('.er').value);
        const msg = body.querySelector('.entmsg');
        if (!(m > 0 && m <= 600) || !(r >= 0 && r <= 10)) { msg.textContent = 'Escriba los minutos (1–600) y el esfuerzo (0–10).'; return; }
        T.addSesion(fecha, { tipo: body.querySelector('.et').value, min: Math.round(m), rpe: Math.round(r * 10) / 10 });
      });
    }

    /* ================= Rachas y series de un hábito ================= */
    function serieHab(h) {
      const hoy = T.ymd(), ini = h.creado && h.creado < hoy ? h.creado : hoy;
      const out = [];
      for (let f = ini; f <= hoy; f = T.addDays(f, 1)) { const d = T.dia(f); out.push({ f, v: d && d.h && d.h[h.id] !== undefined ? d.h[h.id] : null }); }
      return out;
    }
    function rachas(h) {
      const s = serieHab(h);
      let i = s.length - 1;
      if (i >= 0 && s[i].v === null) i--;
      let actual = 0;
      while (i >= 0 && s[i].v === 1) { actual++; i--; }
      let mejor = 0, run = 0, dobles = 0, prev0 = false, hechos = 0, reg = 0;
      for (const x of s) {
        if (x.v === 1) { run++; mejor = Math.max(mejor, run); prev0 = false; hechos++; reg++; }
        else if (x.v === 0) { run = 0; if (prev0) dobles++; prev0 = true; reg++; }
        else { run = 0; prev0 = false; }
      }
      const ult = s.slice(-28).filter((x) => x.v !== null);
      return { actual, mejor, dobles, hechos, reg, dias: s.length, tasa28: ult.length ? ult.filter((x) => x.v === 1).length / ult.length : NaN };
    }

    /* ================= Pestaña Hábitos ================= */
    function renderHabitos() {
      const habs = T.state.habitos;
      if (habSel && !habs.find((h) => h.id === habSel)) habSel = null;
      if (!habSel && habs.length) habSel = (habs.find((h) => h.activo) || habs[0]).id;
      body.innerHTML = `
        <fieldset><legend>Nuevo hábito</legend><div class="grid">
          <label>Conducta (concreta y pequeña)<input class="hn" placeholder="Caminar 20 minutos"></label>
          <label>Señal: «Después de…»<input class="hs" placeholder="Después de almorzar"></label>
          <label>Tipo<select class="ht"><option value="hacer">Hacer algo</option><option value="evitar">Evitar algo</option></select></label>
          <label>Área<select class="ha">${AREAS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
        </div><div class="row" style="margin-top:10px"><button type="button" class="btn primary" data-act="addhab">Crear hábito</button><span class="warnmsg habmsg"></span></div>
        <p class="muted" style="margin-top:6px">Se registra como intención de implementación: «Después de <i>señal</i>, voy a <i>conducta</i>». Una señal estable (una hora, un lugar, otra rutina) acelera la automatización (capítulos 15 y 16).</p></fieldset>
        ${habs.length ? `<fieldset><legend>Sus hábitos</legend><div class="row">${habs.map((h) => `<button type="button" class="btn ${h.id === habSel ? 'on' : ''}" data-sel="${h.id}">${esc(h.nombre)}${h.activo ? '' : ' (archivado)'}</button>`).join('')}</div><div class="habdet" style="margin-top:12px"></div></fieldset>` : ''}`;
      body.querySelector('[data-act="addhab"]').addEventListener('click', () => {
        const n = body.querySelector('.hn').value.trim();
        if (!n) { body.querySelector('.habmsg').textContent = 'Escriba la conducta.'; return; }
        habSel = T.addHabito({ nombre: n.slice(0, 80), senal: body.querySelector('.hs').value.trim().slice(0, 100), tipo: body.querySelector('.ht').value, area: body.querySelector('.ha').value });
      });
      body.querySelectorAll('[data-sel]').forEach((b) => b.addEventListener('click', () => { habSel = b.dataset.sel; render(); }));
      if (habSel) detalleHabito(body.querySelector('.habdet'), habs.find((h) => h.id === habSel));
    }
    function detalleHabito(box, h) {
      const st = rachas(h), s = serieHab(h);
      /* calendario de 16 semanas, lunes arriba */
      const hoy = T.ymd(), dHoy = T.parse(hoy);
      const lunes = T.addDays(hoy, -((dHoy.getDay() + 6) % 7) - 15 * 7);
      const mapa = new Map(s.map((x) => [x.f, x.v]));
      let cells = '';
      for (let k = 0; k < 16 * 7; k++) {
        const f = T.addDays(lunes, k);
        const v = mapa.has(f) ? mapa.get(f) : undefined;
        cells += `<i class="${f > hoy ? 'fut' : v === 1 ? 's1' : v === 0 ? 's0' : ''}" title="${f}${v === 1 ? ': cumplido' : v === 0 ? ': fallado' : ''}"></i>`;
      }
      const sem = T.addDays(hoy, -((dHoy.getDay() + 6) % 7));   /* lunes de esta semana */
      const sr = T.srbaiSerie(h.id);
      const yaSem = sr.find((x) => x.fecha >= sem);
      box.innerHTML = `
        <div class="kpis">
          <div><small>Racha actual</small><b>${st.actual} días</b></div>
          <div><small>Mejor racha</small><b>${st.mejor} días</b></div>
          <div><small>Cumplimiento 28 días</small><b>${isFinite(st.tasa28) ? RC.pct(st.tasa28, 0) : '—'}</b></div>
          <div><small>Dobles fallas</small><b class="${st.dobles ? 'loss' : 'gain'}">${st.dobles}</b></div>
          <div><small>Días desde que empezó</small><b>${st.dias}</b></div>
        </div>
        <div><div class="muted">Últimas 16 semanas (cada columna es una semana, lunes arriba): verde cumplido, rojo fallado, gris sin registro.</div><div class="heat">${cells}</div></div>
        <fieldset><legend>Automaticidad de esta semana (SRBAI)</legend>
          <p class="muted">«${esc(h.nombre)}» es algo que… (1 = totalmente en desacuerdo, 7 = totalmente de acuerdo)</p>
          <div class="srbai">${L.hab.SRBAI_ITEMS.map((it, i) => `<div class="it"><span>${it}</span><span class="sc" data-it="${i}">${[1, 2, 3, 4, 5, 6, 7].map((k) => `<button type="button" data-v="${k}">${k}</button>`).join('')}</span></div>`).join('')}</div>
          <div class="row" style="margin-top:8px"><button type="button" class="btn primary" data-act="srbai">Guardar automaticidad de esta semana</button><span class="msg srmsg">${yaSem ? 'Ya respondió esta semana (' + RC.nf(yaSem.v, 2) + '); si guarda de nuevo, se reemplaza.' : ''}</span></div>
        </fieldset>
        <div class="srchart"></div>
        <div class="srfit muted"></div>
        <fieldset><legend>Editar</legend><div class="grid">
          <label>Conducta<input class="en" value="${esc(h.nombre)}"></label>
          <label>Señal<input class="es" value="${esc(h.senal || '')}"></label>
          <label>Empezó el<input type="date" class="ec" value="${h.creado}"></label>
        </div><div class="row" style="margin-top:10px">
          <button type="button" class="btn" data-act="guardar">Guardar cambios</button>
          <button type="button" class="btn" data-act="archivar">${h.activo ? 'Archivar (ya es automático o lo dejé)' : 'Reactivar'}</button>
          <button type="button" class="btn" data-act="borrar">Borrar</button></div>
          <div class="confirm" hidden>¿Borrar este hábito? Sus marcas diarias quedan en los registros pero dejarán de mostrarse. <button type="button" class="btn" data-act="si">Sí, borrar</button><button type="button" class="btn" data-act="no">Cancelar</button></div>
        </fieldset>`;
      const resp = [0, 0, 0, 0];
      box.querySelectorAll('.sc').forEach((sc) => sc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        resp[+sc.dataset.it] = +b.dataset.v;
        sc.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      })));
      box.querySelector('[data-act="srbai"]').addEventListener('click', () => {
        if (resp.some((v) => !v)) { box.querySelector('.srmsg').textContent = 'Responda las cuatro afirmaciones.'; return; }
        if (yaSem) T.setSrbai(yaSem.fecha, h.id, null);
        T.setSrbai(hoy, h.id, L.hab.srbai(resp));
      });
      /* curva de automaticidad */
      const pts = sr.map((x) => ({ t: T.diffDays(h.creado, x.fecha), v: x.v })).filter((p) => p.t >= 0);
      let fit = null;
      if (pts.length >= 4) {
        fit = L.hab.fitLally(pts.map((p) => p.t), pts.map((p) => p.v));
        if (!(fit.a > 1 && fit.a <= 7.5 && fit.c > 1e-4 && fit.b > 0)) fit = null;
      }
      chart(box.querySelector('.srchart'), (cv) => {
        RC.draw.clear(cv);
        const tmax = Math.max(84, st.dias + 7, fit && fit.t95 < 400 ? fit.t95 * 1.15 : 0);
        const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 1, ymax: 7, xlabel: 'días desde que empezó', ylabel: 'automaticidad (1–7)', mb: 38 });
        pl.frame();
        if (fit) {
          pl.fn((t) => L.hab.lallyF(t, [fit.a, fit.b, fit.c]), { color: '--c1', width: 2.2 });
          if (fit.t95 > 0 && fit.t95 < tmax) pl.vline(fit.t95, { color: '--c1', label: `95 % hacia el día ${Math.round(fit.t95)}`, labelY: 16 });
        }
        pl.vline(st.dias - 1, { color: '--ink-3', label: 'hoy', labelY: 34 });
        pts.forEach((p) => pl.dot(p.t, p.v, { color: '--c2', r: 4.5 }));
        if (!pts.length) RC.text(cv.ctx, 'Responda la escala una vez por semana para ver su curva.', pl.ix + 12, pl.iy + 22, { size: 12.5, color: '--ink-3' });
      });
      box.querySelector('.srfit').innerHTML = fit
        ? `Curva ajustada: asíntota ${RC.nf(fit.a, 2)} de 7, tasa ${RC.nf(fit.c, 3)} por día; se alcanzaría el 95 % de la asíntota hacia el día ${isFinite(fit.t95) ? Math.round(fit.t95) : '—'}. Con pocas semanas la estimación es muy incierta: en el estudio de Lally el rango fue de 18 a 254 días.`
        : pts.length ? `Lleva ${pts.length} respuesta${pts.length === 1 ? '' : 's'}; con 4 o más se ajusta la curva.` : '';
      box.querySelector('[data-act="guardar"]').addEventListener('click', () => {
        const n = box.querySelector('.en').value.trim();
        T.updHabito(h.id, { nombre: n ? n.slice(0, 80) : h.nombre, senal: box.querySelector('.es').value.trim().slice(0, 100), creado: box.querySelector('.ec').value || h.creado });
      });
      box.querySelector('[data-act="archivar"]').addEventListener('click', () => T.updHabito(h.id, { activo: !h.activo }));
      const conf = box.querySelector('.confirm');
      box.querySelector('[data-act="borrar"]').addEventListener('click', () => { conf.hidden = false; });
      box.querySelector('[data-act="no"]').addEventListener('click', () => { conf.hidden = true; });
      box.querySelector('[data-act="si"]').addEventListener('click', () => { T.delHabito(h.id); habSel = null; });
    }

    /* ================= Pestaña Cuerpo ================= */
    function serieDiaria(campo) {
      const dias = T.dias().filter((d) => d[campo] > 0);
      if (!dias.length) return null;
      const ini = dias[0].fecha, hoy = T.ymd(), n = T.diffDays(ini, hoy) + 1;
      const y = new Array(n).fill(null);
      dias.forEach((d) => { y[T.diffDays(ini, d.fecha)] = d[campo]; });
      return { ini, y, n, cuenta: dias.length };
    }
    function renderCuerpo() {
      const p = T.state.perfil;
      body.innerHTML = `
        <fieldset><legend>Perfil (para los cálculos de energía)</legend><div class="grid">
          <label>Sexo<select data-p="sexo"><option value="h" ${p.sexo === 'h' ? 'selected' : ''}>Hombre</option><option value="m" ${p.sexo === 'm' ? 'selected' : ''}>Mujer</option></select></label>
          <label>Edad<input class="num" data-p="edad" value="${p.edad || ''}"></label>
          <label>Talla (cm)<input class="num" data-p="talla" value="${p.talla || ''}"></label>
          <label>Grasa corporal (%) si la conoce<input class="num" data-p="grasaPct" value="${p.grasaPct || ''}" placeholder="se estima por IMC"></label>
          <label>Actividad habitual<select data-p="pal">${[[1.4, 'Sedentaria (1,4)'], [1.6, 'Ligera (1,6)'], [1.75, 'Moderada (1,75)'], [1.9, 'Activa (1,9)'], [2.1, 'Muy activa (2,1)']].map(([v, t]) => `<option value="${v}" ${Math.abs(p.pal - v) < 0.01 ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label>Meta de peso (kg, opcional)<input class="num" data-p="metaPeso" value="${p.metaPeso || ''}"></label>
        </div></fieldset>
        <div class="kpis bk"></div>
        <div class="wchart"></div>
        <p class="muted wnote"></p>
        <div class="cchart"></div>
        <p class="muted">Registre el peso y la cintura en la pestaña <b>Hoy</b>. La cintura es un indicador de grasa abdominal más útil que el peso cuando se entrena fuerza.</p>`;
      body.querySelectorAll('[data-p]').forEach((inp) => inp.addEventListener('change', () => {
        const k = inp.dataset.p;
        const v = k === 'sexo' ? inp.value : num(inp.value);
        if (k !== 'sexo' && v !== null && v < 0) return;
        T.setPerfil({ [k]: v === null ? 0 : v });
      }));
      const s = serieDiaria('peso');
      const kp = body.querySelector('.bk');
      if (!s) {
        kp.innerHTML = '<div><small>Peso</small><b>—</b></div>';
        body.querySelector('.wnote').textContent = 'Registre su peso en la pestaña Hoy. Con dos semanas de datos aparece la tendencia, el ritmo y la proyección.';
      }
      if (s) {
        const k = L.tend.kalman(s.y, { qN: 0.0025, qP: 2e-6, r: 0.45 });
        const ema = L.tend.ema(s.y, 0.1);
        const last = s.n - 1, lvl = k.lvl[last], sl = k.slope[last], sds = k.sdSlope[last];
        const primero = s.y.find((v) => v !== null);
        const edad = p.edad || 35, talla = p.talla || 170;
        const imc = L.en.imc(lvl, talla / 100);
        const grasaPct = p.grasaPct > 0 ? p.grasaPct : Math.max(5, L.en.deurenberg(p.sexo, imc, edad));
        const re = L.en.rhoEff((lvl * grasaPct) / 100);
        const suf = s.cuenta >= 10 && s.n >= 14;
        const bal = sl * re.kcalKg;
        kp.innerHTML = `
          <div><small>Tendencia actual</small><b>${RC.nf(lvl, 1)} kg</b></div>
          <div><small>Ritmo</small><b>${suf ? (sl * 7 >= 0 ? '+' : '−') + RC.nf(Math.abs(sl * 7), 2) + ' kg/sem' : '—'}</b></div>
          <div><small>Cambio desde el inicio</small><b>${RC.nf(lvl - primero, 1)} kg</b></div>
          <div><small>Balance estimado</small><b>${suf ? (bal >= 0 ? '+' : '−') + RC.nf(Math.abs(bal), 0) + ' kcal/día' : '—'}</b></div>
          <div><small>IMC (tendencia)</small><b>${RC.nf(imc, 1)}</b></div>`;
        let proy = null;
        if (suf && p.talla > 0 && p.edad > 0) {
          const hall = L.en.hallSim({ sexo: p.sexo, edad, talla, peso: lvl, pal: p.pal || 1.6, grasaPct: p.grasaPct || 0 }, (t, st) => ({ kcal: st.EI0 / 4.184 + bal }), 365, 1);
          proy = hall;
        }
        chart(body.querySelector('.wchart'), (cv) => {
          RC.draw.clear(cv);
          const horiz = proy ? Math.min(365, Math.max(84, s.n)) : 0;
          const vals = s.y.filter((v) => v !== null).concat(proy ? proy.BW.slice(0, horiz + 1) : []).concat(p.metaPeso > 0 ? [p.metaPeso] : []);
          const ymin = Math.floor(Math.min(...vals) - 1), ymax = Math.ceil(Math.max(...vals) + 1);
          const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(14, s.n - 1 + horiz), ymin, ymax, xlabel: `días desde ${s.ini}`, ylabel: 'peso (kg)' });
          pl.frame();
          if (p.metaPeso > 0) pl.hline(p.metaPeso, { color: '--gain', label: 'meta', labelRight: true });
          s.y.forEach((v, i) => { if (v !== null) pl.dot(i, v, { color: '--c6', r: 3 }); });
          pl.xy(ema.map((_, i) => i), ema, { color: '--c4', width: 1.4, dash: [4, 3] });
          pl.xy(k.lvl.map((_, i) => i), k.lvl, { color: '--c1', width: 2.6 });
          if (proy) pl.xy(proy.t.slice(0, horiz + 1).map((t) => last + t), proy.BW.slice(0, horiz + 1), { color: '--c2', width: 2, dash: [6, 4] });
          pl.legend([{ label: 'pesajes', color: '--c6', kind: 'dot' }, { label: 'tendencia (Kalman)', color: '--c1' }, { label: 'media móvil 10 %', color: '--c4', dash: [4, 3] }].concat(proy ? [{ label: 'proyección (Hall)', color: '--c2', dash: [6, 4] }] : []), 'tr');
        });
        let nota = suf
          ? `Intervalo aproximado del ritmo: ${RC.nf((sl - 1.96 * sds) * 7, 2)} a ${RC.nf((sl + 1.96 * sds) * 7, 2)} kg por semana. El balance se estima con la densidad energética del tejido que cambia (${RC.nf(re.kcalKg, 0)} kcal/kg con su composición; ${RC.pct(re.fracMagra, 0)} sería masa magra si no entrena fuerza).`
          : `Lleva ${s.cuenta} pesaje${s.cuenta === 1 ? '' : 's'} en ${s.n} día${s.n === 1 ? '' : 's'}. Con al menos 10 pesajes en 14 días se estima el ritmo y el balance.`;
        if (proy && p.metaPeso > 0) {
          const idx = proy.BW.findIndex((w) => (bal < 0 ? w <= p.metaPeso : w >= p.metaPeso));
          nota += idx > 0 ? ` Si mantiene el balance actual, el modelo de Hall llegaría a la meta en unos ${idx} días.` : ' Con el balance actual el modelo no llega a la meta en un año: el cambio se frena a medida que el cuerpo se adapta.';
        }
        if (suf && sl * 7 < -0.01 * lvl) nota += ' Atención: está perdiendo más de 1 % de su peso por semana.';
        body.querySelector('.wnote').textContent = nota;
      }
      const c = serieDiaria('cintura');
      if (c && c.cuenta >= 2) chart(body.querySelector('.cchart'), (cv) => {
        RC.draw.clear(cv);
        const vals = c.y.filter((v) => v !== null);
        const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(14, c.n - 1), ymin: Math.floor(Math.min(...vals) - 2), ymax: Math.ceil(Math.max(...vals) + 2), xlabel: `días desde ${c.ini}`, ylabel: 'cintura (cm)' });
        pl.frame();
        const pts = [];
        c.y.forEach((v, i) => { if (v !== null) { pl.dot(i, v, { color: '--c5', r: 4 }); pts.push([i, v]); } });
        pl.path(pts, { color: '--c5', width: 1.6 });
      });
    }

    /* ================= Pestaña Entrenamiento ================= */
    function renderEntreno() {
      const dias = T.dias();
      const conE = dias.filter((d) => (d.ent || []).length);
      if (!conE.length) { body.innerHTML = '<p>Todavía no hay sesiones. Regístrelas en la pestaña <b>Hoy</b> con minutos y esfuerzo percibido (RPE).</p>'; return; }
      const ini = T.addDays(conE[0].fecha, -1), hoy = T.ymd(), n = T.diffDays(ini, hoy) + 1;
      const loads = new Array(n).fill(0), sueno = new Array(n).fill(null);
      dias.forEach((d) => {
        const i = T.diffDays(ini, d.fecha);
        if (i < 0 || i >= n) return;
        loads[i] = (d.ent || []).reduce((s, e) => s + e.min * e.rpe, 0);
        if (d.sueno > 0) sueno[i] = d.sueno;
      });
      const b = L.dep.banister(loads);
      const sem = [];
      for (let w = 0; w < 8; w++) {
        const fin = n - 1 - 7 * w, a = fin - 6;
        if (fin < 0) break;
        const wk = []; for (let i = a; i <= fin; i++) wk.push(i >= 0 ? loads[i] : 0);
        const f = L.dep.foster(wk);
        const ses = dias.filter((d) => { const i = T.diffDays(ini, d.fecha); return i >= a && i <= fin; }).reduce((s, d) => s + (d.ent || []).length, 0);
        sem.push({ desde: T.addDays(ini, Math.max(0, a)), total: f.total, mono: f.monotonia, tension: f.tension, ses });
      }
      const acwr = n >= 35 ? L.dep.acwr(loads, n - 1, false) : NaN;
      const s7 = sueno.slice(-7).filter((v) => v !== null);
      const forma = b.p[n], fit = b.g[n], fat = b.h[n];
      body.innerHTML = `
        <div class="kpis">
          <div><small>Carga últimos 7 días</small><b>${RC.nf(sem[0].total, 0)} UA</b></div>
          <div><small>Monotonía</small><b class="${sem[0].mono > 2 ? 'loss' : ''}">${isFinite(sem[0].mono) ? RC.nf(sem[0].mono, 2) : '—'}</b></div>
          <div><small>Agudo:crónico (desacoplado)</small><b>${isFinite(acwr) ? RC.nf(acwr, 2) : '—'}</b></div>
          <div><small>Forma (Banister)</small><b class="${forma >= 0 ? 'gain' : 'loss'}">${RC.nf(forma, 0)}</b></div>
          <div><small>Sueño medio 7 días</small><b>${s7.length ? RC.nf(L.stat.mean(s7), 1) + ' h' : '—'}</b></div>
        </div>
        <div class="bchart"></div>
        <p class="muted">Estado físico (τ = 42 días) y fatiga (τ = 7 días) acumulan la carga de cada sesión y decaen con el tiempo; la forma es estado físico menos el doble de la fatiga, en unidades arbitrarias. Úsela para ver tendencias, no como predicción exacta (capítulo 21).</p>
        <div class="tablewrap"><table class="log"><thead><tr><th>Semana desde</th><th>Sesiones</th><th>Carga</th><th>Monotonía</th><th>Tensión</th></tr></thead><tbody>
          ${sem.map((w) => `<tr><td>${w.desde}</td><td class="n">${w.ses}</td><td class="n">${RC.nf(w.total, 0)}</td><td class="n">${isFinite(w.mono) ? RC.nf(w.mono, 2) : '—'}</td><td class="n">${isFinite(w.tension) ? RC.nf(w.tension, 0) : '—'}</td></tr>`).join('')}
        </tbody></table></div>
        <p class="muted">Foster asoció la monotonía alta (por encima de 2) junto con tensión alta a más enfermedades menores en deportistas. El cociente agudo:crónico tiene problemas matemáticos serios y no debe usarse como predictor de lesiones (Impellizzeri y otros, 2020); se muestra solo como referencia.</p>`;
      chart(body.querySelector('.bchart'), (cv) => {
        RC.draw.clear(cv);
        const k0 = Math.max(0, n - 120), xs = [];
        for (let i = k0; i <= n; i++) xs.push(i - n);
        const sl = (a) => a.slice(k0, n + 1);
        const gmax = Math.max(1, ...sl(b.g), ...sl(b.h).map((v) => 2 * v)), pmin = Math.min(0, ...sl(b.p));
        const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: xs[0] - 0.5, xmax: 0.5, ymin: pmin * 1.1, ymax: gmax * 1.08, xlabel: 'días (0 = hoy)', ylabel: 'unidades arbitrarias', ml: 62 });
        pl.frame();
        const lmax = Math.max(1, ...loads.slice(k0));
        pl.bars(xs.slice(0, -1), loads.slice(k0).map((v) => (v / lmax) * gmax * 0.35), { color: '--c6', alpha: 0.45, w: 0.8 });
        pl.xy(xs, sl(b.g), { color: '--c3', width: 2.2 });
        pl.xy(xs, sl(b.h).map((v) => 2 * v), { color: '--c2', width: 1.8 });
        pl.xy(xs, sl(b.p), { color: '--c1', width: 2.6 });
        pl.legend([{ label: 'estado físico', color: '--c3' }, { label: 'fatiga × 2', color: '--c2' }, { label: 'forma', color: '--c1' }, { label: 'carga diaria (escala relativa)', color: '--c6', kind: 'sq' }], 'tl');
      });
      if (window.RC.typeset) RC.typeset(body);
    }

    /* ================= Pestaña Curso ================= */
    function renderCurso() {
      const p = RC.progreso ? RC.progreso() : null;
      const caps = (RC.app.list || []).filter((c) => typeof c.num === 'number');
      body.innerHTML = `${p ? `<div class="kpis"><div><small>Capítulos estudiados</small><b>${p.leidos} de ${p.caps}</b></div><div><small>Autoevaluaciones</small><b>${p.quizHechos}</b></div><div><small>Aciertos</small><b>${p.qN ? RC.pct(p.qOk / p.qN, 0) : '—'}</b></div></div><div class="pbar"><i style="width:${(100 * p.frac).toFixed(1)}%"></i></div>` : ''}
        <div class="tablewrap"><table class="log"><thead><tr><th>Cap.</th><th>Título</th><th>Estudiado</th><th>Autoevaluación</th></tr></thead><tbody>
        ${caps.map((c) => { const q = T.quiz(c.id); return `<tr><td class="n">${c.num}</td><td><a href="#${c.id}">${esc(c.title)}</a></td><td>${T.leido(c.id) ? '✓ ' + T.state.curso.leidos[c.id] : '—'}</td><td>${q ? q.mejor + ' de ' + q.n : '—'}</td></tr>`; }).join('')}
        </tbody></table></div>
        ${(() => { const d = T.quiz('diagnostico'); return `<p class="muted">Evaluación diagnóstica «¿Mito o evidencia?» (<a href="#docente">apéndice D</a>): ${d ? `mejor resultado ${d.mejor} de ${d.n}` : 'todavía sin responder'}.</p>`; })()}`;
    }

    /* ================= Pestaña Datos ================= */
    function renderDatos() {
      const nd = T.dias().length, nh = T.state.habitos.length;
      body.innerHTML = `
        <p>${T.backend === 'db' ? 'Sus datos están en su cuenta, en un espacio privado de esta página: nadie más puede leerlos. También hay una copia en este navegador.' : 'Sus datos están guardados solo en este navegador. Si borra los datos del navegador o cambia de equipo, se pierden: exporte una copia de vez en cuando.'} Registros: ${nd} días, ${nh} hábitos.</p>
        <div class="row"><button type="button" class="btn primary" data-act="json">Exportar copia completa (JSON)</button><button type="button" class="btn" data-act="csv">Exportar tabla (CSV)</button></div>
        <div class="row"><label style="flex-direction:row;align-items:center;gap:8px">Importar una copia: <input type="file" accept=".json,application/json" class="imp" style="width:auto"></label></div>
        <div class="confirm impconf" hidden>Importar reemplaza todos los datos actuales por los del archivo. <button type="button" class="btn" data-act="impsi">Sí, reemplazar</button><button type="button" class="btn" data-act="impno">Cancelar</button></div>
        <div class="row"><button type="button" class="btn" data-act="borrar">Borrar todos mis datos</button></div>
        <div class="confirm delconf" hidden>¿Borrar todos sus registros, hábitos y avance del curso, en su cuenta y en este navegador? No se puede deshacer. <button type="button" class="btn" data-act="delsi">Sí, borrar todo</button><button type="button" class="btn" data-act="delno">Cancelar</button></div>
        <div class="msg dmsg"></div>`;
      const msg = body.querySelector('.dmsg');
      const put = (t, ok = true) => { msg.textContent = t; msg.className = ok ? 'msg dmsg' : 'warnmsg dmsg'; };
      body.querySelector('[data-act="json"]').addEventListener('click', async () => { const r = await T.descargar(`recablear-${T.ymd()}.json`, T.exportJSON(), 'application/json'); put(r === 'ok' ? 'Copia lista.' : r === 'no' ? 'Descarga cancelada.' : 'No se pudo descargar.', r === 'ok'); });
      body.querySelector('[data-act="csv"]').addEventListener('click', async () => { const r = await T.descargar(`recablear-${T.ymd()}.csv`, T.exportCSV(), 'text/csv'); put(r === 'ok' ? 'Tabla lista.' : r === 'no' ? 'Descarga cancelada.' : 'No se pudo descargar.', r === 'ok'); });
      let pendiente = null;
      body.querySelector('.imp').addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { pendiente = String(rd.result); body.querySelector('.impconf').hidden = false; };
        rd.readAsText(f);
      });
      body.querySelector('[data-act="impno"]').addEventListener('click', () => { pendiente = null; body.querySelector('.impconf').hidden = true; });
      body.querySelector('[data-act="impsi"]').addEventListener('click', () => {
        try { T.importJSON(pendiente); put('Datos importados.'); } catch (e) { put('No se pudo importar: ' + e.message, false); }
        body.querySelector('.impconf').hidden = true;
      });
      body.querySelector('[data-act="borrar"]').addEventListener('click', () => { body.querySelector('.delconf').hidden = false; });
      body.querySelector('[data-act="delno"]').addEventListener('click', () => { body.querySelector('.delconf').hidden = true; });
      body.querySelector('[data-act="delsi"]').addEventListener('click', async () => { await T.borrarTodo(); });
    }

    function render() {
      root.querySelectorAll('[data-tab]').forEach((b) => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'); });
      status();
      ({ hoy: renderHoy, habitos: renderHabitos, cuerpo: renderCuerpo, entreno: renderEntreno, curso: renderCurso, datos: renderDatos }[tab] || renderHoy)();
    }
    let pend = false;
    T.on((what) => {
      if (what === 'status') { status(); return; }
      /* mientras se escribe en un campo no se redibuja (el cambio ya está guardado) */
      if (pend) return;
      pend = true;
      requestAnimationFrame(() => { pend = false; const a = document.activeElement; if (a && root.contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type !== 'file' && a.type !== 'date'))) { status(); return; } render(); });
    });
    render();
  });
})();
