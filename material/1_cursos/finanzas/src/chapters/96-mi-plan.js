/* Apéndice B — Mi plan financiero: hoja de trabajo interactiva (datos solo en este navegador) */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm;

  const EJEMPLO = {
    edad: 42, dep: 2, ing: 6500000, gas: 4300000, cuo: 1600000, liq: 5000000, inv: 20000000, uso: 335000000, cara: 6000000, otras: 208000000, tcara: 2.4,
    mcol: 3, sVida: false, sSalud: true, sHogar: true, sVeh: true, sInc: false,
    m1n: 'Fondo de emergencia completo', m1v: 17700000, m1a: 2, m1r: 2,
    m2n: 'Cuota inicial para cambiar de carro sin crédito', m2v: 30000000, m2a: 5, m2r: 3,
    m3n: 'Complemento para el retiro', m3v: 450000000, m3a: 20, m3r: 4,
    paso: 'Abrir una cuenta separada para el fondo de emergencia y programar $300.000 el día de pago.',
    auto: 'Transferencia automática el 1 y el 16 de cada mes; pago de la tarjeta por débito automático.',
    regla: 'Ninguna compra mayor de $300.000 sin esperar 48 horas.',
    rev: ''
  };
  const MONEY = new Set(['ing', 'gas', 'cuo', 'liq', 'inv', 'uso', 'cara', 'otras', 'm1v', 'm2v', 'm3v']);

  CC.defineSim('mi-plan', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const box = sim.html('plan');
    let st = Object.assign({}, EJEMPLO, CC.store.get('plan', null) || {});
    const esEjemplo = () => JSON.stringify(Object.keys(EJEMPLO).map((k) => st[k])) === JSON.stringify(Object.keys(EJEMPLO).map((k) => EJEMPLO[k]));
    const fmt = (k, v) => (MONEY.has(k) ? CC.cop(v) : CC.nf(v, k === 'tcara' || k.endsWith('r') ? 2 : 0));
    const inp = (k, label, o = {}) => {
      const id = 'plan-' + k;
      if (o.type === 'check') return `<label style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="${id}" data-k="${k}" ${st[k] ? 'checked' : ''} style="width:auto"> ${label}</label>`;
      if (o.type === 'text') return `<label for="${id}">${label}<textarea id="${id}" data-k="${k}" rows="2">${String(st[k] || '').replace(/</g, '&lt;')}</textarea></label>`;
      if (o.type === 'line') return `<label for="${id}">${label}<input type="text" id="${id}" data-k="${k}" value="${String(st[k] || '').replace(/"/g, '&quot;')}"></label>`;
      if (o.type === 'date') return `<label for="${id}">${label}<input type="date" id="${id}" data-k="${k}" value="${st[k] || ''}"></label>`;
      return `<label for="${id}">${label}<input type="text" inputmode="decimal" class="num" id="${id}" data-k="${k}" data-num="1" value="${fmt(k, st[k])}"></label>`;
    };
    box.innerHTML = `
      <div class="bar"><span class="saved" id="plan-msg"></span></div>
      <fieldset><legend>1 · Situación</legend><div class="grid">
        ${inp('edad', 'Edad')}${inp('dep', 'Personas que dependen de su ingreso')}
        ${inp('ing', 'Ingreso neto mensual del hogar')}${inp('gas', 'Gastos de vida al mes (sin cuotas)')}${inp('cuo', 'Cuotas de deudas al mes')}
        ${inp('liq', 'Ahorros líquidos (cuentas, CDT cortos)')}${inp('inv', 'Inversiones (fondos, cesantías, pensiones voluntarias)')}${inp('uso', 'Activos de uso (vivienda, vehículo)')}
        ${inp('cara', 'Saldo de deudas caras (tarjetas, consumo)')}${inp('tcara', 'Tasa mensual de esas deudas (%)')}${inp('otras', 'Saldo de otras deudas (hipoteca, vehículo)')}
      </div></fieldset>
      <fieldset><legend>2 · Diagnóstico</legend><div class="res" id="plan-diag"></div></fieldset>
      <fieldset><legend>3 · Protección</legend><div class="grid">
        ${inp('mcol', 'Meta de fondo de emergencia (meses de gasto)')}
        ${inp('sVida', 'Tengo seguro de vida suficiente para quienes dependen de mí', { type: 'check' })}
        ${inp('sSalud', 'Tengo cobertura de salud adecuada', { type: 'check' })}
        ${inp('sHogar', 'La vivienda y sus contenidos están asegurados', { type: 'check' })}
        ${inp('sVeh', 'Tengo SOAT y responsabilidad civil del vehículo (o no tengo vehículo)', { type: 'check' })}
        ${inp('sInc', 'Tengo protección por incapacidad o invalidez', { type: 'check' })}
      </div><div class="res" id="plan-prot" style="margin-top:8px"></div></fieldset>
      <fieldset><legend>4 · Metas (en pesos de hoy)</legend>
        ${[1, 2, 3].map((i) => `<div class="grid" style="margin-bottom:10px">${inp('m' + i + 'n', `Meta ${i}`, { type: 'line' })}${inp('m' + i + 'v', 'Valor')}${inp('m' + i + 'a', 'Años')}${inp('m' + i + 'r', 'Rentabilidad real supuesta (%)')}</div>`).join('')}
        <div class="res" id="plan-metas"></div></fieldset>
      <fieldset><legend>5 · Orden de prioridades</legend><div class="res" id="plan-prior"></div></fieldset>
      <fieldset><legend>6 · Plan de acción</legend><div class="grid">
        ${inp('paso', 'Mi primer paso, esta semana', { type: 'text' })}
        ${inp('auto', 'Lo que voy a automatizar, y cuándo', { type: 'text' })}
        ${inp('regla', 'Mi regla personal contra mi sesgo principal', { type: 'text' })}
        ${inp('rev', 'Fecha de mi próxima revisión', { type: 'date' })}
      </div></fieldset>
      <fieldset><legend>7 · Resumen</legend><div class="res" id="plan-res"></div>
        <div class="bar" style="margin-top:10px">
          <button type="button" class="btn primary" id="plan-copy">Copiar resumen</button>
          <button type="button" class="btn" id="plan-ej">Cargar el ejemplo</button>
          <button type="button" class="btn" id="plan-del">Borrar mis datos</button>
          <span class="saved" id="plan-copied"></span>
        </div>
        <div class="confirm" id="plan-conf" hidden>¿Borrar todos los datos de esta hoja en este navegador? <button type="button" class="btn" id="plan-yes">Sí, borrar</button><button type="button" class="btn" id="plan-no">Cancelar</button></div>
      </fieldset>`;
    const $ = (s) => box.querySelector(s);
    const leer = (el) => {
      const k = el.dataset.k;
      if (el.type === 'checkbox') st[k] = el.checked;
      else if (el.dataset.num) { const v = CC.parseNum(el.value); if (isFinite(v)) st[k] = v; }
      else st[k] = el.value;
    };
    box.querySelectorAll('[data-k]').forEach((el) => {
      el.addEventListener(el.type === 'checkbox' || el.type === 'date' ? 'change' : 'input', () => { leer(el); guardar(); calc(); });
      if (el.dataset.num) el.addEventListener('change', () => { el.value = fmt(el.dataset.k, st[el.dataset.k]); });
    });
    const guardar = () => { CC.store.set('plan', st); $('#plan-msg').textContent = esEjemplo() ? 'Datos de ejemplo: reemplácelos por los suyos. Lo que escriba se guarda solo en este navegador.' : 'Guardado en este navegador.'; };
    const chip = (t, n) => CC.chip(t, n);
    let resumen = '';
    const calc = () => {
      const ah = st.ing - st.gas - st.cuo, tas = st.ing > 0 ? ah / st.ing : 0, carga = st.ing > 0 ? st.cuo / st.ing : 0;
      const gm = st.gas + st.cuo, col = gm > 0 ? st.liq / gm : 0, act = st.liq + st.inv + st.uso, pas = st.cara + st.otras;
      const W = act - pas, end = act > 0 ? pas / act : 0, caraM = st.ing > 0 ? st.cara / st.ing : 0;
      const nv = (v, ok, mid, up) => (up ? (v >= ok ? 'ok' : v >= mid ? 'mid' : 'bad') : v <= ok ? 'ok' : v <= mid ? 'mid' : 'bad');
      $('#plan-diag').innerHTML = `Ahorro mensual: <b>${CC.cop(ah)}</b> · Patrimonio: <b>${CC.copS(W)}</b><br>
        Tasa de ahorro ${chip(CC.pct(tas), nv(tas, 0.15, 0.05, true))} · Carga de deuda ${chip(CC.pct(carga), nv(carga, 0.3, 0.4, false))} · Colchón ${chip(CC.nf(col, 1) + ' meses', nv(col, 3, 1, true))} · Endeudamiento ${chip(CC.pct(end, 0), nv(end, 0.4, 0.6, false))} · Deuda cara ${chip(CC.nf(caraM, 1) + ' meses de ingreso', caraM === 0 ? 'ok' : caraM <= 1 ? 'mid' : 'bad')}`;
      const falta = [];
      if (st.dep > 0 && !st.sVida) falta.push('seguro de vida');
      if (!st.sSalud) falta.push('cobertura de salud');
      if (!st.sHogar) falta.push('seguro de la vivienda');
      if (!st.sVeh) falta.push('SOAT y responsabilidad civil');
      if (!st.sInc) falta.push('protección por incapacidad');
      const metaCol = st.mcol * gm;
      $('#plan-prot').innerHTML = `Fondo de emergencia objetivo: <b>${CC.copS(metaCol)}</b> (tiene ${CC.copS(st.liq)}). ` + (falta.length ? `Revisar: <b>${falta.join(', ')}</b> (capítulo 13).` : 'Las coberturas básicas están marcadas.');
      const metas = [1, 2, 3].map((i) => { const v = st['m' + i + 'v'], a = st['m' + i + 'a'], r = st['m' + i + 'r'] / 100; const c = a > 0 && v > 0 ? -T.pmt(T.eaToPeriodic(r, 12), Math.round(a * 12), 0, v) : 0; return { n: st['m' + i + 'n'] || `Meta ${i}`, v, a, c }; });
      const sumC = metas.reduce((s, m) => s + m.c, 0);
      $('#plan-metas').innerHTML = metas.map((m) => `${m.n}: <b>${CC.cop(m.c)}</b> al mes durante ${CC.nf(m.a)} años`).join('<br>') + `<br>Total: <b>${CC.cop(sumC)}</b> al mes, frente a un ahorro actual de ${CC.cop(ah)}. ` + (sumC > ah ? '<span class="loss">No alcanza: hay que priorizar, alargar plazos o aumentar el ahorro.</span>' : '<span class="gain">Cabe en el ahorro actual.</span>');
      const pasos = [
        ['Gastar menos de lo que entra', ah > 0],
        ['Colchón mínimo de un mes', st.liq >= gm],
        ['Pagar las deudas caras', st.cara <= 0],
        [`Colchón completo de ${CC.nf(st.mcol)} meses`, st.liq >= metaCol],
        ['Proteger con seguros los riesgos grandes', falta.length === 0],
        ['Ahorro para el retiro', st.inv > 0],
        ['Metas de mediano y largo plazo', false]
      ];
      const primero = pasos.findIndex((p) => !p[1]);
      $('#plan-prior').innerHTML = '<ol style="margin:0;padding-left:1.3em">' + pasos.map((p, i) => `<li>${p[0]} ${p[1] ? CC.chip('listo', 'ok') : i === primero ? CC.chip('ahora', 'bad') : CC.chip('después', 'mid')}</li>`).join('') + '</ol>';
      if (st.cara > 0 && ah > 0) {
        const plan = L.cred.debtPlan([{ nombre: 'deuda cara', saldo: st.cara, im: st.tcara / 100, minimo: ah }], ah, 'avalancha');
        $('#plan-prior').innerHTML += `<p style="margin:8px 0 0">Con todo el ahorro mensual (${CC.cop(ah)}) dirigido a la deuda cara, se pagaría en unos <b>${isFinite(plan.meses) ? plan.meses + ' meses' : 'más de 50 años'}</b>, con ${CC.cop(plan.totalInteres)} de intereses.</p>`;
      }
      resumen = [
        'MI PLAN FINANCIERO' + (st.rev ? ` (próxima revisión: ${st.rev})` : ''),
        `Ingreso neto ${CC.cop(st.ing)} · gasto ${CC.cop(st.gas)} · cuotas ${CC.cop(st.cuo)} · ahorro ${CC.cop(ah)} (${CC.pct(tas)})`,
        `Patrimonio ${CC.copS(W)} · colchón ${CC.nf(col, 1)} meses · carga de deuda ${CC.pct(carga)} · deuda cara ${CC.cop(st.cara)}`,
        `Prioridad actual: ${primero >= 0 ? pasos[primero][0] : 'mantener y revisar'}`,
        'Metas: ' + metas.map((m) => `${m.n} (${CC.copS(m.v)} en ${m.a} años, ${CC.cop(m.c)}/mes)`).join('; '),
        `Primer paso: ${st.paso}`,
        `Automatizar: ${st.auto}`,
        `Mi regla: ${st.regla}`
      ].join('\n');
      $('#plan-res').innerHTML = resumen.split('\n').map((l, i) => (i === 0 ? `<b>${l}</b>` : l.replace(/</g, '&lt;'))).join('<br>');
    };
    $('#plan-copy').addEventListener('click', () => {
      const ok = () => { $('#plan-copied').textContent = 'Copiado.'; };
      const no = () => { const r = document.createRange(); r.selectNodeContents($('#plan-res')); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); $('#plan-copied').textContent = 'Texto seleccionado: use Ctrl+C.'; };
      try { navigator.clipboard.writeText(resumen).then(ok, no); } catch (e) { no(); }
    });
    const recargar = (obj) => {
      st = Object.assign({}, obj);
      box.querySelectorAll('[data-k]').forEach((el) => { const k = el.dataset.k; if (el.type === 'checkbox') el.checked = !!st[k]; else if (el.dataset.num) el.value = fmt(k, st[k]); else el.value = st[k] || ''; });
      guardar(); calc();
    };
    $('#plan-ej').addEventListener('click', () => recargar(EJEMPLO));
    $('#plan-del').addEventListener('click', () => { $('#plan-conf').hidden = false; });
    $('#plan-no').addEventListener('click', () => { $('#plan-conf').hidden = true; });
    $('#plan-yes').addEventListener('click', () => {
      $('#plan-conf').hidden = true;
      const vacio = {};
      Object.keys(EJEMPLO).forEach((k) => { vacio[k] = typeof EJEMPLO[k] === 'number' ? 0 : typeof EJEMPLO[k] === 'boolean' ? false : ''; });
      vacio.mcol = 3; vacio.m1a = 1; vacio.m2a = 1; vacio.m3a = 1;
      recargar(vacio);
      try { localStorage.removeItem('cuentasClaras:plan'); } catch (e) { /* sin almacenamiento */ }
      CC.store.set('plan', st);
      $('#plan-msg').textContent = 'Datos borrados.';
    });
    guardar();
    calc();
  });
})();
