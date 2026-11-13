/* ===================================================================
   ui/27-pruebas.js — Etapa 8: energizar y probar
   Pruebas sin tensión (megger, polarímetro y continuidad de tierra,
   botón de prueba del GFCI), reparación de los defectos de obra,
   energización con cargas que se encienden y se enchufan, tablero en
   vivo con disparo y calentamiento, fallas (cortocircuito, fuga a
   tierra, neutro abierto) y ensayo a plena carga.
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB, O = OB.O, L = OB.L, C = OB.C, N = OB.N;

  OB.etapas.pruebas = function (root) {
    const E = OB.E, pr = E.pruebas;
    const { trabajo, panel } = OB.pantalla(root, {
      num: 'Etapa 8', titulo: 'Energizar y probar',
      lead: 'La obra terminó, pero falta saber si funciona y si es segura. Primero se prueba sin tensión: aislamiento, polaridad, continuidad de tierra y GFCI, y se corrigen los defectos que aparezcan. Después se energiza, se prende la casa, se provocan fallas y se mira cómo reacciona cada protección.'
    });
    let modo = 'meggerH', P = O.prepSim(E), S = O.nuevoS(), energ = false, corre = false, vel = 10, timer = null;
    let aparato = 'plancha', tipoFalla = 'corto', piel = 'seca', pend = null, lectura = null, cidM = E.circuitos[0].id;
    const wrap = OB.h('div'), inst = OB.h('div'), en = OB.h('div'), vivo = OB.h('div'), fallas = OB.h('div'), logBox = OB.h('div', { class: 'log' });
    const reconstruir = () => { P = O.prepSim(E); };

    /* ---------- Plano ---------- */
    const pl = new OB.Planta(wrap, {
      E, capas: { ids: true }, aria: 'Planta con la instalación para probar y energizar',
      marca: (p) => {
        if (p.tipo === 'toma') {
          if (pr.pol[p.id] === false || pr.pe[p.id] === false || pr.gfci[p.id] === false) return 'falla';
          if (pr.pol[p.id] || pr.gfci[p.id]) return 'ok';
        }
        return null;
      },
      onPick: (id) => accion(id)
    });
    pl.extra = (svg, self, casa) => {
      const defs = OB.s('defs', null, svg);
      [['glowL', '#FFC107'], ['glowQ', '#E8431F']].forEach(([id, c]) => {
        const rg = OB.s('radialGradient', { id }, defs);
        OB.s('stop', { offset: '0%', 'stop-color': c, 'stop-opacity': 0.75 }, rg); OB.s('stop', { offset: '100%', 'stop-color': c, 'stop-opacity': 0 }, rg);
      });
      const g = OB.s('g', null, svg);
      // recorridos con calentamiento
      if (energ || Object.keys(S.T).length) {
        const r = O.sim(E, P, S);
        P.tr.forEach((t) => {
          const x = r.circ[t.c];
          if (!x || x.I < 0.05) return;
          const a = casa.punto(t.u), b = casa.punto(t.v);
          const m = Math.min(1.6, x.m);
          const col = m < 0.7 ? 'var(--ok)' : m < 1 ? 'var(--warn)' : 'var(--bad)';
          OB.s('line', { x1: a.x, y1: -a.y, x2: b.x, y2: -b.y, stroke: col, 'stroke-width': 0.05 + 0.1 * Math.min(1, x.I / 30), 'stroke-linecap': 'round', opacity: 0.9, 'pointer-events': 'none' }, g);
        });
      }
      casa.electrico.puntos.forEach((p) => {
        if ((p.tipo === 'lum' || p.tipo === 'aplique') && S.luces[p.s] && energ && !S.totalTrip && !S.trip[p.c] && !S.quemado[p.c]) OB.s('circle', { cx: p.x, cy: -p.y, r: 0.6, fill: 'url(#glowL)', 'pointer-events': 'none' }, g);
        if (p.tipo === 'toma' && (S.ench[p.id] || []).length) OB.s('text', { x: p.x + 0.16, y: -p.y - 0.18, class: 'pl-txt sw', fill: 'var(--accent)' }, g, (S.ench[p.id] || []).map((a) => N.APARATOS.find((q) => q.id === a).ico).join(''));
        if ((p.tipo === 'ducha' && S.ducha) || (p.tipo === 'estufa' && S.estufa)) OB.s('circle', { cx: p.x, cy: -p.y, r: 0.6, fill: 'url(#glowQ)', 'pointer-events': 'none' }, g);
      });
    };
    trabajo.append(OB.card('Planta · instrumentos y cargas', wrap, OB.h('p', { class: 'ayuda' }, 'Escoja una herramienta en el panel y toque el punto del plano donde la aplica. Cómo leer el plano: un halo amarillo suave es una luminaria encendida; un halo rojo, la ducha o la estufa funcionando; las letras junto a una toma son los aparatos enchufados (N nevera, P plancha…); los recorridos se colorean según la carga de su interruptor (verde normal, ámbar cerca de In, rojo sobre In). Anillos en las tomas: verde = prueba correcta, rojo = defecto.')), OB.card('Registro de eventos', logBox));

    /* ---------- Acciones sobre el plano ---------- */
    function log(txt, tipo) { S.eventos.push({ t: S.t, tipo: tipo || 'info', texto: txt }); pintaLog(); }
    function pintaLog() {
      OB.vaciar(logBox);
      const ev = S.eventos.slice(-40).reverse();
      if (!ev.length) logBox.append(OB.h('div', null, 'Sin eventos.'));
      ev.forEach((x) => logBox.append(OB.h('div', { class: x.tipo }, `[${OB.fmt(x.t, 0)} s] ${x.texto}`)));
    }
    function accion(id) {
      const casa = P.casa, p = casa.punto(id);
      if (!p) return;
      if (modo === 'meggerH') {
        if (id === 'TG') return;
        const r = O.meggerHasta(E, P, id);
        lectura = { texto: `Megger 500 V del tablero hasta ${id} (${p.c}): ${r.ok ? '> 500 MΩ' : OB.fmt(r.MOhm, 1) + ' MΩ, por debajo de 1 MΩ'}.`, ok: r.ok };
        pintaInst();
      } else if (modo === 'pol') {
        if (p.tipo !== 'toma') { OB.toast('El polarímetro se usa en tomacorrientes', 'bad'); return; }
        const pol = O.polaridad(E, P, id), pe = O.continuidadPE(E, P, id);
        pr.pol[id] = pol.ok; pr.pe[id] = pe.ok;
        lectura = { texto: `${id}: ${pol.texto}. Continuidad de tierra desde el tablero: ${pe.abierto ? 'abierta (OL)' : OB.fmt(pe.ohm, 2) + ' Ω'}.`, ok: pol.ok && pe.ok };
        OB.cambio('prueba');
      } else if (modo === 'gfci') {
        if (p.tipo !== 'toma' || p.ap === 'comun') { OB.toast('Toque una toma GFCI (círculo naranja)', 'bad'); return; }
        const r = O.testGFCI(E, P, id);
        pr.gfci[id] = r.ok;
        lectura = { texto: `${id}: ${r.texto}.`, ok: r.ok };
        OB.cambio('prueba');
      } else if (modo === 'reparar') {
        const d = O.defEn(E, id);
        if (!d) { lectura = { texto: `En ${id} no se encontró ninguna falla pendiente de reparar.`, ok: false }; pintaInst(); return; }
        pend = { pid: id, d }; lectura = null; pintaInst();
      } else if (modo === 'luces') {
        if (p.tipo === 'lum' || p.tipo === 'aplique') S.luces[p.s] = !S.luces[p.s];
        else if (['int', 'int2', 'conm'].includes(p.tipo)) { const nuevo = !S.luces[p.ctrl[0]]; p.ctrl.forEach((s) => { S.luces[s] = nuevo; }); }
        else if (p.tipo === 'ducha') S.ducha = !S.ducha;
        else if (p.tipo === 'estufa') S.estufa = !S.estufa;
        pl.render(); pintaVivo();
      } else if (modo === 'enchufar') {
        if (p.tipo !== 'toma') { OB.toast('Enchufe en un tomacorriente', 'bad'); return; }
        const l = S.ench[id] = S.ench[id] || [];
        const k = l.indexOf(aparato);
        if (k >= 0) l.splice(k, 1); else if (l.length < 2) l.push(aparato); else OB.toast('La toma doble ya tiene dos aparatos', 'bad');
        pl.render(); pintaVivo();
      } else if (modo === 'falla') {
        if (id === 'TG') return;
        const tip = p.tipo === 'toma' ? tipoFalla : (tipoFalla === 'fuga-sin-tierra' ? 'fuga-sin-tierra' : tipoFalla);
        const r = O.falla(E, P, tip, id, { piel });
        log(r.texto, r.ok ? 'info' : 'disparo');
        if (tip === 'corto') pr.fallas.corto = { ok: r.ok, texto: r.texto };
        if (tip === 'fuga') pr.fallas.fuga = { ok: r.ok, texto: r.texto };
        if (r.t != null && isFinite(r.t) && tip !== 'fuga-sin-tierra') S.trip[r.c] = true;
        if (tip === 'fuga-sin-tierra' && r.t != null && isFinite(r.t)) S.trip[r.c] = true;
        lectura = { texto: r.texto, ok: r.ok };
        OB.cambio('prueba');
      }
    }

    /* ---------- Paneles ---------- */
    function pintaInst() {
      OB.vaciar(inst);
      const mi = (k, t) => [k, t];
      inst.append(OB.chips([mi('meggerH', 'Megger por tramos'), mi('pol', 'Polarímetro y tierra'), mi('gfci', 'Botón TEST del GFCI'), mi('reparar', 'Reparar')], ['meggerH', 'pol', 'gfci', 'reparar'].includes(modo) ? modo : '', (v) => { modo = v; lectura = null; pend = null; pintaInst(); pintaEn(); pintaFallas(); }, 'Instrumento'));
      if (modo === 'meggerH') {
        inst.append(OB.h('p', { class: 'nota' }, 'Con el circuito sin tensión, el megger de 500 V mide el aislamiento entre los conductores y tierra. Toque un punto del plano: mide desde el tablero hasta ese punto. Si baja de 1 MΩ, el defecto está en ese camino.'));
        inst.append(OB.campo('Medida completa por circuito', OB.h('div', { class: 'fila' }, OB.chips(E.circuitos.map((c) => [c.id, c.id]), cidM, (v) => { cidM = v; pintaInst(); }, 'Circuito'), OB.h('button', { class: 'btn peq primario', type: 'button', onclick: () => {
          const r = O.megger(E, P, cidM); pr.megger[cidM] = r.MOhm;
          lectura = { texto: `${cidM}: ${r.MOhm >= 4000 ? '> 500' : OB.fmt(r.MOhm, r.MOhm < 10 ? 1 : 0)} MΩ a 500 V (${OB.fmt(r.Ltot, 0)} m de conductor). ${r.ok ? 'Cumple (≥ 1 MΩ).' : 'No cumple: menos de 1 MΩ.'}`, ok: r.ok }; OB.cambio('prueba');
        } }, 'Medir 500 V'))));
        const hechos = E.circuitos.filter((c) => pr.megger[c.id] != null);
        inst.append(OB.h('div', { class: 'leyenda' }, E.circuitos.map((c) => OB.h('span', { class: 'mono', style: { color: pr.megger[c.id] == null ? 'var(--ink-3)' : pr.megger[c.id] >= 1 ? 'var(--ok)' : 'var(--bad)' } }, c.id + ':' + (pr.megger[c.id] == null ? '—' : pr.megger[c.id] >= 4000 ? '>500' : OB.fmt(pr.megger[c.id], 1))))), OB.h('p', { class: 'ayuda' }, hechos.length + ' de ' + E.circuitos.length + ' circuitos medidos (valores en MΩ). Si repara, vuelva a medir.'));
      } else if (modo === 'pol') inst.append(OB.h('p', { class: 'nota' }, 'El probador de tomas enciende tres luces según la conexión y se complementa con la continuidad del conductor de tierra. Toque cada tomacorriente del plano: al menos una por circuito, y todas las que resulten sospechosas. Anillo verde: correcta; rojo: con defecto.'),
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { E.puntos.filter((p) => p.tipo === 'toma').forEach((p) => { const a = O.polaridad(E, P, p.id), b = O.continuidadPE(E, P, p.id); pr.pol[p.id] = a.ok; pr.pe[p.id] = b.ok; }); E.pistas = (E.pistas || 0) + 1; lectura = { texto: 'Barrido automático de todas las tomas (pista, −2 puntos). Revise los anillos rojos.', ok: true }; OB.cambio('prueba'); } }, 'Probar todas las tomas (pista, −2 puntos)'));
      else if (modo === 'gfci') inst.append(OB.h('p', { class: 'nota' }, 'Cada GFCI se prueba con su botón TEST: debe disparar y volver a rearmar. Toque cada toma con círculo naranja.'));
      else if (modo === 'reparar') {
        inst.append(OB.h('p', { class: 'nota' }, 'Toque en el plano el punto donde cree que está el defecto y diga cuál es la causa.'));
        if (pend) {
          inst.append(OB.h('div', { class: 'aviso-box' }, OB.h('strong', null, 'Punto ' + pend.pid + '. '), '¿Cuál es la causa?'));
          O.CAUSAS.forEach(([k, t]) => inst.append(OB.h('button', { class: 'btn peq', type: 'button', style: { margin: '0 6px 6px 0' }, onclick: () => {
            if (k === 'ninguna') { lectura = { texto: 'Ahí sí había una falla: revise las lecturas de los instrumentos.', ok: false }; pend = null; pintaInst(); return; }
            const r = O.reparar(E, pend.d.id, k);
            if (r.ok) OB.toast('Defecto reparado: ' + pend.d.texto, 'ok');
            lectura = { texto: r.ok ? 'Reparado. ' + pend.d.texto + ' Repita las pruebas.' : r.msg, ok: r.ok }; pend = null; OB.cambio('prueba');
          } }, t)));
        }
      }
      if (lectura) inst.append(OB.h('div', { class: 'aviso-box ' + (lectura.ok ? 'ok' : 'bad') }, lectura.texto));
      const rep = O.DEFECTOS.filter((d) => pr.def[d.id]).length;
      inst.append(OB.h('p', { class: 'ayuda' }, `Defectos reparados: ${rep} de ${O.DEFECTOS.length}.`));
    }

    function pintaEn() {
      OB.vaciar(en);
      en.append(OB.h('div', { class: 'fila' },
        OB.h('button', { class: 'btn ' + (energ ? 'peligro' : 'primario'), type: 'button', onclick: () => { energ = !energ; if (!energ) { corre = false; parar(); } else { corre = true; arrancar(); } log(energ ? 'Se cierra el interruptor principal: instalación energizada.' : 'Se abre el principal.'); pintaEn(); pintaVivo(); pl.render(); } }, energ ? 'Abrir el principal' : 'Energizar (cerrar el principal)'),
        OB.h('button', { class: 'btn', type: 'button', onclick: () => { S = O.nuevoS(); reconstruir(); log('Se reinicia la simulación.'); pintaEn(); pintaVivo(); pl.render(); } }, 'Reiniciar simulación')));
      if (!energ) { en.append(OB.h('p', { class: 'nota' }, 'La instalación está sin tensión. Puede preparar las cargas desde ya.')); }
      en.append(OB.campo('Qué hace un clic en el plano', OB.chips([['luces', 'Encender luces, ducha y estufa'], ['enchufar', 'Enchufar aparato'], ['falla', 'Provocar falla']], ['luces', 'enchufar', 'falla'].includes(modo) ? modo : '', (v) => { modo = v; pend = null; lectura = null; pintaEn(); pintaInst(); pintaFallas(); }, 'Acción')));
      if (modo === 'enchufar') en.append(OB.chips(N.APARATOS.map((a) => [a.id, a.ico + ' · ' + a.nombre + ' ' + a.W + ' W']), aparato, (v) => { aparato = v; pintaEn(); }, 'Aparato'));
      en.append(OB.campo('Velocidad del tiempo', OB.chips([[1, '×1'], [10, '×10'], [60, '×60'], [300, '×300']], vel, (v) => { vel = +v; pintaEn(); }, 'Velocidad'), 'Con ×60, un segundo real son 60 s de la simulación: así se ve calentarse un cable.'));
      en.append(OB.h('div', { class: 'fila' },
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { Object.keys(S.luces).forEach((k) => { S.luces[k] = false; }); P.casa.electrico.puntos.filter((p) => p.tipo === 'lum' || p.tipo === 'aplique').forEach((p) => { S.luces[p.s] = true; }); pl.render(); pintaVivo(); } }, 'Encender todas las luces'),
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { S.luces = {}; S.ench = {}; S.ducha = false; S.estufa = false; pl.render(); pintaVivo(); } }, 'Apagar todo'),
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { S.ducha = !S.ducha; pl.render(); pintaVivo(); } }, 'Ducha ' + (S.ducha ? 'apagar' : 'encender')),
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { S.estufa = !S.estufa; pl.render(); pintaVivo(); } }, 'Estufa ' + (S.estufa ? 'apagar' : 'encender'))));
    }

    function pintaVivo() {
      OB.vaciar(vivo);
      const eff = energ ? S : Object.assign({}, S, { totalTrip: true });
      const r = O.sim(E, P, eff);
      const rows = E.circuitos.map((c) => {
        const x = r.circ[c.id];
        const abierto = S.trip[c.id] || S.quemado[c.id];
        const tcol = x.Tss > 90 ? 'var(--bad)' : x.Tss > 60 ? 'var(--warn)' : 'var(--ink-3)';
        const T = S.T[c.id] == null ? O.TA : S.T[c.id];
        return [OB.h('span', null, OB.h('i', { class: 'dot', style: { background: OB.COL_C[c.id] } }), c.id),
          OB.h('span', { class: 'mono' }, OB.fmt(x.I, 1) + ' / ' + c.In + ' A'),
          OB.h('div', { class: 'barra-i', style: { minWidth: '60px' } }, OB.h('b', { class: x.m > 1 ? 'bad' : x.m > 0.8 ? 'warn' : '', style: { width: Math.min(100, x.m * 100) + '%' } })),
          OB.h('span', { class: 'mono', style: { color: T > 90 ? 'var(--bad)' : T > 60 ? 'var(--warn)' : 'inherit' } }, OB.fmt(T, 0) + ' °C'),
          OB.h('span', { class: 'mono' }, x.I > 0 ? OB.fmt(x.Vmin, 0) + ' V' : '—'),
          abierto ? OB.h('button', { class: 'btn peq peligro', type: 'button', disabled: S.quemado[c.id] ? true : null, onclick: () => { O.reponer(S, c.id); pintaVivo(); pl.render(); } }, S.quemado[c.id] ? 'quemado' : 'Reponer') : OB.h('span', { class: 'pill ok' }, 'cerrado')];
      });
      vivo.append(OB.tabla(['Circ.', 'Corriente', 'Carga', 'Cond.', 'Tensión', 'Interruptor'], rows, 'compacta'));
      const t = r.tot;
      vivo.append(OB.h('div', { class: 'kpis', style: { marginTop: '8px' } },
        OB.h('div', { class: 'kpi ' + (t.Itot > (E.tab.total || 60) ? 'bad' : '') }, OB.h('b', null, OB.fmt(t.IA, 1) + ' / ' + OB.fmt(t.IB, 1) + ' A'), OB.h('span', null, 'fases A / B (principal ' + (E.tab.total || 60) + ' A)')),
        OB.h('div', { class: 'kpi' }, OB.h('b', null, OB.fmt(t.IN, 1) + ' A'), OB.h('span', null, 'neutro')),
        OB.h('div', { class: 'kpi ' + (Math.max(t.VA, t.VB) > 132 || Math.min(t.VA, t.VB) < 108 ? 'bad' : '') }, OB.h('b', null, OB.fmt(t.VA, 0) + ' / ' + OB.fmt(t.VB, 0) + ' V'), OB.h('span', null, 'tensión en cada fase')),
        OB.h('div', { class: 'kpi' }, OB.h('b', null, OB.fmt(t.W / 1000, 2) + ' kW'), OB.h('span', null, 'potencia'))));
      if (S.totalTrip) vivo.append(OB.h('div', { class: 'aviso-box bad' }, 'El interruptor principal disparó. ', OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { O.reponer(S, 'TOT'); pintaVivo(); pl.render(); } }, 'Reponer el principal')));
    }

    function pintaFallas() {
      OB.vaciar(fallas);
      fallas.append(OB.chips([['corto', 'Cortocircuito fase–neutro'], ['fuga', 'Fuga a la carcasa (con tierra)'], ['fuga-sin-tierra', 'Fuga sin tierra: alguien toca']], tipoFalla, (v) => { tipoFalla = v; modo = 'falla'; pintaFallas(); pintaEn(); }, 'Falla'));
      if (tipoFalla === 'fuga-sin-tierra') fallas.append(OB.campo('Piel de la persona', OB.chips([['seca', 'Seca'], ['mojada', 'Mojada (baño, cocina)']], piel, (v) => { piel = v; pintaFallas(); }, 'Piel')));
      fallas.append(OB.h('p', { class: 'nota' }, modo === 'falla' ? 'Toque un punto del plano para aplicar la falla (se resuelve en el instante).' : 'Pulse una falla y luego un punto del plano.'));
      fallas.append(OB.h('div', { class: 'fila' },
        OB.h('button', { class: 'btn peq', type: 'button', onclick: () => { S.neutroAbierto = !S.neutroAbierto; log(S.neutroAbierto ? 'Se corta el neutro de la acometida: las fases quedan en serie a 240 V.' : 'Se restablece el neutro.', S.neutroAbierto ? 'disparo' : 'info'); pintaFallas(); pintaVivo(); } }, S.neutroAbierto ? 'Restablecer el neutro' : 'Cortar el neutro de la acometida')));
      fallas.append(OB.h('div', { style: { marginTop: '8px' } }, OB.h('div', { class: 'lbl' }, 'Ensayo a plena carga'), OB.h('p', { class: 'nota' }, 'Enciende toda la demanda de la vivienda durante 10 minutos simulados: ducha, estufa, luces, nevera, microondas, plancha, lavadora, licuadora y televisor.'),
        OB.h('button', { class: 'btn primario peq', type: 'button', onclick: ensayo }, 'Ejecutar el ensayo')));
      if (pr.carga) fallas.append(OB.h('div', { class: 'aviso-box ' + (pr.carga.ok ? 'ok' : 'bad') }, pr.carga.ok ? `Plena carga correcta: ${OB.fmt(pr.carga.I, 1)} A en la fase más cargada, tensión mínima ${OB.fmt(pr.carga.Vmin, 1)} V, sin disparos.` : pr.carga.motivo));
    }
    function ensayo() {
      reconstruir();
      const S2 = O.nuevoS();
      P.casa.electrico.puntos.filter((p) => p.tipo === 'lum' || p.tipo === 'aplique').forEach((p) => { S2.luces[p.s] = true; });
      S2.ducha = true; S2.estufa = true;
      Object.assign(S2.ench, { TN: ['nevera'], TP: ['plancha'], TL: ['lavadora'], TMa: ['micro'], TMb: ['licuadora'], TS3: ['tv'] });
      let motivo = null, Vmin = 999, Imax = 0;
      for (let t = 0; t < 600 && !motivo; t += 10) {
        const x = O.paso(E, P, S2, 10);
        Vmin = Math.min(Vmin, ...Object.values(x.r.circ).filter((c) => c.I > 0).map((c) => c.Vmin));
        Imax = Math.max(Imax, x.r.tot.Itot);
        const d = x.ev.find((e) => e.tipo === 'disparo' || e.tipo === 'incendio');
        if (d) motivo = 'Con toda la demanda encendida: ' + d.texto;
      }
      if (!motivo) { const r = O.sim(E, P, S2); Vmin = Math.min(...Object.values(r.circ).filter((c) => c.I > 0).map((c) => c.Vmin)); if (Vmin < 114) motivo = `Con toda la demanda la tensión baja a ${OB.fmt(Vmin, 1)} V (más de 5 % de caída).`; }
      pr.carga = { ok: !motivo, I: Imax, Vmin, motivo };
      log(motivo ? 'Ensayo a plena carga: ' + motivo : 'Ensayo a plena carga superado.', motivo ? 'disparo' : 'info');
      OB.cambio('prueba');
    }

    function arrancar() { parar(); timer = setInterval(() => { if (!energ || !corre) return; O.paso(E, P, S, 0.25 * vel); pintaVivo(); pl.render(); pintaLog(); }, 250); }
    function parar() { if (timer) { clearInterval(timer); timer = null; } }
    OB.limpieza = parar;

    panel.append(OB.card('Pruebas sin tensión y reparación', inst), OB.card('Energizar la casa', en), OB.card('Tablero en vivo', vivo), OB.card('Fallas y plena carga', fallas), OB.revision('pruebas'));
    OB.subs.push((q) => { if (q === 'tema') return; if (q !== 'prueba' && q !== 'sel') reconstruir(); pl.render(); pintaInst(); pintaFallas(); pintaVivo(); });
    pl.render(); pintaInst(); pintaEn(); pintaVivo(); pintaFallas(); pintaLog();
  };
})();
