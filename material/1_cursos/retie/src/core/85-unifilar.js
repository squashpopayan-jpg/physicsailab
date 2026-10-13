/* ===================================================================
   85-unifilar.js — Diagrama unifilar en SVG generado desde el modelo
   Usa los símbolos de la Tabla 1.3.4.a (50-simbolos.js). Sirve en la
   página y en las herramientas de exportación (Node).
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;

  RT.unifilarSVG = function (casa, o = {}) {
    const L = RT.L, C = L.C, Q = L.Q, R = L.R;
    const ink = o.ink || 'currentColor', acc = o.acc || '#B9500F', verde = o.verde || '#2F7D4A', gris = o.gris || '#6B7175';
    const filas = Q.cuadro(casa), n = filas.length;
    const dx = 104, x0 = 230, W = x0 + n * dx + 30, H = 640;
    const yBus = 270;
    const S = (name, x, y, s, col = ink, lw = 1.5) => RT.simboloSVGen(name, x, y, s, col, lw);
    const T = (t, x, y, sz = 12, extra = '') => `<text x="${x}" y="${y}" font-size="${sz}" font-family="Barlow, Arial, sans-serif" fill="${ink}" ${extra}>${t}</text>`;
    const ln = (x1, y1, x2, y2, col = ink, w = 1.6, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Diagrama unifilar de la casa ejemplo" style="color:${ink};background:${o.bg || 'transparent'}">`];
    const ac = Q.acometida(casa), dem = Q.demanda(casa);
    /* red, acometida, medidor */
    const xm = 80;
    out.push(T('Red de baja tensión 120/240 V', 14, 22, 12.5, 'font-weight="700"'));
    out.push(T('(operador de red)', 14, 37, 11, `fill="${gris}"`));
    out.push(S('transformador', xm, 68, 16));
    out.push(ln(xm, 84, xm, 112));
    out.push(T('Acometida aérea concéntrica', xm + 12, 98, 11), T(`Cu ${ac.awg} AWG · ${C.fmt(ac.dem.total / 1000, 1)} kVA de demanda`, xm + 12, 111, 11, `fill="${gris}"`));
    out.push(`<rect x="${xm - 20}" y="114" width="40" height="30" fill="none" stroke="${ink}" stroke-width="1.6"/>`, T('kWh', xm, 134, 12, 'text-anchor="middle" font-weight="700"'));
    out.push(T('Medidor', xm + 26, 133, 11));
    out.push(ln(xm, 144, xm, 172));
    out.push(T(`Alimentador 2F + N Cu ${ac.awg} AWG`, xm + 12, 162, 11), T(`PVC 1 in · ${C.fmt(ac.Lal, 1)} m · ΔV ${C.fmt(ac.dv.pct, 2)} %`, xm + 12, 175, 11, `fill="${gris}"`));
    /* tablero */
    out.push(`<rect x="${xm - 50}" y="182" width="${W - xm + 40}" height="${H - 196}" fill="none" stroke="${acc}" stroke-width="1.4" stroke-dasharray="8 5" rx="6"/>`);
    out.push(T('TABLERO GENERAL TG · monofásico trifilar 120/240 V · 12 espacios · hall, muro M5', xm - 40, 200, 12, `fill="${acc}" font-weight="700"`));
    out.push(ln(xm, 172, xm, 212));
    out.push(S('interruptor-termomagnetico', xm, 232, 20));
    out.push(T('Totalizador', xm + 16, 228, 11.5, 'font-weight="700"'), T(`2P ${ac.In} A`, xm + 16, 242, 11.5));
    out.push(ln(xm, 252, xm, yBus));
    out.push(ln(xm, yBus, W - 30, yBus, ink, 4));
    out.push(T('Barras de fase A y B', xm + 6, yBus - 7, 11, `fill="${gris}"`));
    /* barras de neutro y tierra */
    const yN = H - 90, yT = H - 62;
    out.push(ln(40, yN, 190, yN, gris, 4), T('Barra de neutro', 196, yN + 4, 11));
    out.push(ln(40, yT, 190, yT, verde, 4), T('Barra de tierra', 196, yT + 4, 11, `fill="${verde}"`));
    out.push(ln(60, yN, 60, yT, verde, 2.4), T('puente N–T (solo aquí)', 66, (yN + yT) / 2 + 4, 10.5, `fill="${verde}"`));
    out.push(ln(xm, yBus, xm, yBus), ln(150, yT, 150, H - 30, verde, 1.8));
    out.push(S('tierra', 150, H - 20, 11, verde));
    out.push(T('SPT: 2 varillas Cu 5/8 in × 2,4 m separadas 2,4 m', 168, H - 22, 11, `fill="${verde}"`), T('Conductor del electrodo Cu 8 AWG · caja de inspección 30 × 30 cm', 168, H - 9, 10.5, `fill="${verde}"`));
    /* DPS previsto */
    out.push(ln(140, yBus, 140, yBus + 30, gris, 1.4, '4 3'), S('dps', 140, yBus + 48, 12, gris), ln(140, yBus + 66, 140, yN - 4, gris, 1.4, '4 3'));
    out.push(T('DPS tipo 2 previsto', 148, yBus + 46, 10.5, `fill="${gris}"`), T('(según evaluación 3.3.3.1)', 148, yBus + 59, 10.5, `fill="${gris}"`));
    /* circuitos */
    const CORTO = { C1: 'Alumbrado', C2: 'Tomas sala-comedor', C3: 'Tomas alcobas', C4: 'Cocina 1', C5: 'Cocina 2', C6: 'Ropas', C7: 'Ducha', C8: 'Estufa', C9: 'Baño' };
    filas.forEach((r, i) => {
      const x = x0 + i * dx + dx / 2, c = r.c;
      const tr = R.tramos(casa).filter((t) => t.c === c.id && t.u === 'TG');
      const sen = tr.length ? tr[0].senales : [];
      const nF = sen.filter((s) => s.startsWith('F')).length, nN = sen.filter((s) => s === 'N').length;
      out.push(ln(x, yBus, x, yBus + 22));
      out.push(S('interruptor-termomagnetico', x, yBus + 40, 17));
      let y = yBus + 60;
      if (c.polos === 2) { out.push(ln(x + 7, yBus, x + 7, yBus + 22), T('2P', x + 12, yBus + 16, 10.5, 'font-weight="700"')); }
      out.push(ln(x, y, x, y + 10)); y += 10;
      if (c.diferencial) { out.push(S('interruptor-diferencial', x, y + 18, 17, acc)); y += 38; out.push(T('30 mA', x + 14, y - 16, 10, `fill="${acc}"`)); }
      out.push(ln(x, y, x, 470));
      out.push(T(`<tspan font-weight="700">${c.id}</tspan> · ${c.polos === 2 ? '2P' : '1P'} ${c.In} A`, x - 46, 416, 11.5));
      out.push(T(`${nF}F${nN ? ' + ' + nN + 'N' : ''} ${c.awg} AWG`, x - 46, 430, 10.5, `fill="${gris}"`));
      out.push(T(`T ${c.tierra} AWG · PVC ${c.tubo} in`, x - 46, 443, 10.5, `fill="${gris}"`));
      out.push(`<rect x="${x - 46}" y="472" width="92" height="44" rx="4" fill="none" stroke="${ink}" stroke-width="1.2"/>`);
      out.push(T(CORTO[c.id] || c.nombre, x, 488, 11, 'text-anchor="middle" font-weight="700"'));
      out.push(T(`${C.fmt(r.va, 0)} VA · ${C.fmt(r.I, 1)} A`, x, 502, 10.5, 'text-anchor="middle"'));
      out.push(T(`fase ${c.fase === 'AB' ? 'A-B (240 V)' : c.fase}`, x, 514, 10, `text-anchor="middle" fill="${gris}"`));
    });
    out.push(T(`Demanda ${C.fmt(dem.total, 0)} VA · ${C.fmt(dem.I240, 1)} A a 240 V · capacidad instalable ${C.fmt(ac.ci.kVA, 1)} kVA · elaborado con la guía «Cableado con criterio» (propuesta académica)`, x0, H - 120, 10.5, `fill="${gris}"`));
    out.push('</svg>');
    return out.join('');
  };
})();
