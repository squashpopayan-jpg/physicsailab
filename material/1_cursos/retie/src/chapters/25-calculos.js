/* Capítulo 25 — Un circuito representativo, calculado completo */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, N = L.N, R = L.R, G = L.G;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);
  const tierra250122 = (In) => (In <= 15 ? '14' : In <= 20 ? '12' : In <= 60 ? '10' : In <= 100 ? '8' : '6');

  RT.calcCircuito = function (id, opt = {}) {
    const c = Object.assign({}, K.circuito(id), opt.awg ? { awg: opt.awg } : {}, opt.In ? { In: opt.In } : {});
    const r = L.Q.cuadro(K).find((x) => x.id === id);
    const pasos = [];
    const Ic = r.va / c.V, cont = !!opt.cont, Ib = cont ? 1.25 * Ic : Ic;
    pasos.push({ n: 1, t: 'Carga y corriente de diseño', v: `S = ${f0(r.va)} VA a ${c.V} V → I = ${f1(Ic)} A${cont ? `; continua: Ib = ${f1(Ib)} A` : '; Ib = I'}`, ok: true, ref: 'NTC 2050, 220 y 210.19' });
    pasos.push({ n: 2, t: 'Protección', v: `Interruptor ${c.polos === 2 ? '2P' : '1P'} de ${c.In} A ≥ Ib = ${f1(Ib)} A`, ok: c.In >= Ib - 1e-9, ref: 'NTC 2050, 240.6(A); RETIE 3.17.19' });
    const tr = R.tramos(K).filter((t) => t.c === id);
    const port = Math.max(...tr.map((t) => t.senales.filter((s) => s !== 'T').length));
    const Ta = opt.Ta || 30;
    const Iz = C.ampacidad(c.awg, 60, Ta, port), pmax = C.protMax(c.awg, 60, Ta, port);
    pasos.push({ n: 3, t: 'Conductor', v: `${c.awg} AWG Cu THHN/THWN-2: Iz(60 °C) = ${N.AMPACIDAD[c.awg][0]} A; protección máxima ${pmax} A ${c.In <= pmax ? '≥' : '<'} In = ${c.In} A`, ok: c.In <= pmax + 1e-9, ref: 'NTC 2050, 310.15(B)(16), 240.4(D); RETIE 3.17.13 h, 3.27.3 c' });
    pasos.push({ n: 4, t: 'Correcciones', v: `Ambiente ${Ta} °C: factor ${f2(C.factorTemp(60, Ta))}; máximo ${port} portadores en un tubo: factor ${f2(C.factorN(port))} → Iz corregida ${f1(Iz)} A`, ok: Iz >= Ib - 1e-9, ref: 'NTC 2050, 310.15(B)(2) y (B)(3)(a)' });
    const cd = L.Q.caidas(K).find((x) => x.id === id);
    const dv = C.caida({ I: Ib, L: cd.Lmax, awg: c.awg, V: c.V });
    const ac = L.Q.acometida(K);
    pasos.push({ n: 5, t: 'Caída de tensión', v: `Hasta ${cd.lejano}: L = ${f2(cd.Lmax)} m con bajantes; ΔV = 2 × ${f1(Ib)} A × ${f2(C.rCu(c.awg, 75))} Ω/km × ${f2(cd.Lmax)} m = ${f2(dv.dV)} V (${f2(dv.pct)} %); con la acometida (${f2(ac.dv.pct)} %): ${f2(dv.pct + ac.dv.pct)} % ≤ 5 %`, ok: dv.pct + ac.dv.pct <= 5, ref: 'RETIE Título 26 f' });
    const llen = (t) => C.llenado(t.senales.map((x) => (x === 'T' ? c.tierra : c.awg)), 'PVC', c.tubo);
    const peor = tr.reduce((a, t) => (!a || llen(t).pct > llen(a).pct ? t : a), null);
    const lp = llen(peor);
    peor.llenado = lp;
    pasos.push({ n: 6, t: 'Tubo', v: `Tramo más cargado ${peor.u}–${peor.v}: ${peor.senales.length} conductores en PVC ${c.tubo} in → ${f1(lp.pct)} % (límite ${f0(100 * lp.lim)} %)`, ok: lp.ok, ref: 'NTC 2050, Cap. 9 Tabla 1; RETIE 3.17.13 e' });
    const tq = tierra250122(c.In);
    pasos.push({ n: 7, t: 'Conductor de tierra', v: `${c.tierra} AWG en todos los tramos; mínimo por Tabla 250-122 para ${c.In} A: ${tq} AWG`, ok: N.awgNum(c.tierra) <= N.awgNum(tq), ref: 'RETIE 3.12.2.3 a y d' });
    const pts = K.electrico.puntos.filter((p) => p.c === id);
    const req = pts.filter((p) => p.tipo === 'toma' && G.razonesGFCI(K, p).some((x) => !x.ref.startsWith('RETIE 3.27.2')));
    const sinProt = req.filter((p) => !G.protegidaGFCI(K, p));
    let v8 = req.length ? `${req.length} tomas exigen GFCI; ${req.length - sinProt.length} protegidas` : 'Ningún punto exige GFCI';
    if (c.diferencial) v8 = 'Diferencial de 30 mA en el tablero (ducha sin resistencia blindada)';
    pasos.push({ n: 8, t: 'Protección de las personas', v: v8, ok: sinProt.length === 0, ref: c.diferencial ? 'RETIE 3.17.15 c; Libro 2, 2.3.17.2.1 a' : 'RETIE 3.28.1 g; NTC 2050, 210.8(A)' });
    const ok = pasos.every((p) => p.ok);
    const texto = `Circuito ${id} (${c.nombre}). Carga de ${f0(r.va)} VA a ${c.V} V, corriente de diseño ${f1(Ib)} A. Se protege con un interruptor ${c.polos === 2 ? 'bipolar' : 'monopolar'} de ${c.In} A${c.diferencial ? ' con protección diferencial de 30 mA' : ''} y se alambra con ${c.awg} AWG de cobre THHN/THWN-2, cuya capacidad a 60 °C es de ${N.AMPACIDAD[c.awg][0]} A (protección máxima ${pmax} A). La caída de tensión hasta ${cd.lejano}, a ${f2(cd.Lmax)} m incluidas las bajantes, es de ${f2(dv.pct)} %, y con la acometida suma ${f2(dv.pct + ac.dv.pct)} %, por debajo del 5 % del Título 26 f del RETIE. El tramo más cargado lleva ${peor.senales.length} conductores en tubo PVC de ${c.tubo} in (${f1(peor.llenado.pct)} % de llenado). El conductor de tierra es de ${c.tierra} AWG en todos los tramos. Supuestos: temperatura ambiente de ${Ta} °C, factor de potencia 1, longitudes medidas en el modelo.`;
    return { pasos, ok, texto, c };
  };

  RT.defineSim('circuito-rep', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('Circuito');
    sim.select('c', { options: K.electrico.circuitos.map((c) => [c.id, c.id + ' · ' + c.nombre]), value: 'C7', onInput: (id) => { const c = K.circuito(id); sim.ctl.awg.set(c.awg, true); sim.ctl.In.set(c.In, true); sim.ctl.cont.set(false, true); } });
    sim.seg('awg', { label: 'Conductor (para probar)', options: [['14', '14'], ['12', '12'], ['10', '10'], ['8', '8 AWG']], value: '10' });
    sim.seg('In', { label: 'Interruptor (para probar)', options: [[15, '15'], [20, '20'], [30, '30'], [40, '40 A']], value: 30 });
    sim.check('cont', { label: 'Tratar la carga como continua (125 %)', value: false });
    sim.slider('Ta', { label: 'Temperatura ambiente', min: 15, max: 45, step: 1, value: 30, unit: '°C', fmt: f0 });
    sim.out('ok', 'Resultado', { hl: true });
    const bt = sim.button('Copiar texto para la memoria', () => RT.copiar(bt, RT.calcCircuito(sim.p.c, { awg: sim.p.awg, In: +sim.p.In, cont: sim.p.cont, Ta: sim.p.Ta }).texto), { newRow: true });
    const pintar = () => {
      const r = RT.calcCircuito(sim.p.c, { awg: sim.p.awg, In: +sim.p.In, cont: sim.p.cont, Ta: sim.p.Ta });
      sim.set('ok', r.ok ? '<span class="chip ok">Los ocho pasos cumplen</span>' : '<span class="chip bad">Hay pasos que no cumplen</span>');
      box.innerHTML = `<h4>${r.c.id} · ${r.c.nombre}</h4><table><tr><th>Paso</th><th>Cálculo</th><th></th><th>Fuente</th></tr>` + r.pasos.map((p) => `<tr><td><b>${p.n}.</b> ${p.t}</td><td>${p.v}</td><td>${p.ok ? '<span class="chip ok">✓</span>' : '<span class="chip bad">✗</span>'}</td><td style="font-size:12px">${p.ref}</td></tr>`).join('') + `</table><h4>Texto para la memoria</h4><p>${r.texto}</p>`;
    };
    sim.onChange = pintar;
    pintar();
  });
})();
