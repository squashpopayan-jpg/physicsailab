/* Capítulo 27 — Láminas, memoria, matriz normativa y sustentación */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, N = L.N, R = L.R;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);
  const VERSION = 'Res. 40117 de 2024 modificada por las Res. 40304 de 2025 y 40284 de 2026';

  RT.defineSim('escala-formato', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const FMT = { A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841], A0: [841, 1189] };
    sim.group('Lámina');
    sim.seg('e', { label: 'Escala', options: [[20, '1:20'], [25, '1:25'], [50, '1:50'], [75, '1:75'], [100, '1:100']], value: 50 });
    sim.seg('f', { label: 'Formato', options: Object.keys(FMT).map((k) => [k, k]), value: 'A3' });
    sim.seg('o', { label: 'Orientación', options: [['v', 'Vertical'], ['h', 'Horizontal']], value: 'v' });
    sim.out('dib', 'Dibujo en papel');
    sim.out('util', 'Área útil');
    sim.out('ok', '¿Cabe?', { hl: true });
    sim.out('txt', 'Texto de 2,5 mm en el modelo');
    sim.out('min', 'Formato mínimo para esta escala');
    const ext = [8.15 + 3, 10.15 + 3]; /* casa más ejes y cotas */
    const cabe = (e, f, o) => { let [w, h] = FMT[f]; if (o === 'h') [w, h] = [h, w]; const uw = w - 35, uh = h - 20 - 55; const dw = (ext[0] * 1000) / e, dh = (ext[1] * 1000) / e; return { w, h, uw, uh, dw, dh, ok: dw <= uw && dh <= uh }; };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const e = +sim.p.e, r = cabe(e, sim.p.f, sim.p.o);
      const sc = Math.min((W - 40) / r.w, (H - 40) / r.h), ox = (W - r.w * sc) / 2, oy = (H - r.h * sc) / 2;
      ctx.fillStyle = RT.col('--surface'); ctx.fillRect(ox, oy, r.w * sc, r.h * sc); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 1.5; ctx.strokeRect(ox, oy, r.w * sc, r.h * sc);
      ctx.strokeStyle = RT.col('--ink-3'); ctx.lineWidth = 1; ctx.strokeRect(ox + 25 * sc, oy + 10 * sc, (r.w - 35) * sc, (r.h - 20) * sc);
      /* rótulo */
      const rw = Math.min(175, r.w - 35);
      ctx.fillStyle = RT.alpha('--accent', 0.12); ctx.fillRect(ox + (r.w - 10 - rw) * sc, oy + (r.h - 10 - 55) * sc, rw * sc, 55 * sc); ctx.strokeRect(ox + (r.w - 10 - rw) * sc, oy + (r.h - 10 - 55) * sc, rw * sc, 55 * sc);
      RT.text(ctx, 'rótulo', ox + (r.w - 10 - rw / 2) * sc, oy + (r.h - 10 - 27) * sc, { size: 11, align: 'center', baseline: 'middle', color: '--accent' });
      /* casa a escala */
      const px = ox + 25 * sc + 4, py = oy + 10 * sc + 4, s = (1000 / e) * sc;
      ctx.save(); ctx.translate(px + 1.5 * s, py + 1.5 * s);
      ctx.fillStyle = RT.alpha(r.ok ? '--c1' : '--bad', 0.12); ctx.fillRect(-1.5 * s, -1.5 * s, ext[0] * s, ext[1] * s);
      ctx.strokeStyle = RT.col('--l-muro'); ctx.lineWidth = Math.max(1, 0.15 * s);
      for (const m of K.muros) { ctx.beginPath(); ctx.moveTo(m.a[0] * s, (10 - m.a[1]) * s); ctx.lineTo(m.b[0] * s, (10 - m.b[1]) * s); ctx.stroke(); }
      ctx.restore();
      sim.set('dib', `${f0(r.dw)} × ${f0(r.dh)} mm`);
      sim.set('util', `${f0(r.uw)} × ${f0(r.uh)} mm (sin márgenes ni rótulo)`);
      sim.set('ok', r.ok ? '<span class="chip ok">Sí</span>' : '<span class="chip bad">No</span>');
      sim.set('txt', `${C.fmt(2.5 * e / 1000, 3)} m`);
      const minF = Object.keys(FMT).find((f) => cabe(e, f, 'v').ok || cabe(e, f, 'h').ok);
      sim.set('min', minF || 'más de A0');
    });
  });

  RT.MATRIZ_EJEMPLO = [
    ['Tablero', 'Libro 3, 3.17.8 r, v y y; 3.17.19 f y g; Título 4 e', 'Tablero general en el hall (muro M5), fuera del baño, con 1,05 m libres al frente y palanca a 1,80 m; el muro no está bajo viga (criterio)', 'E02, M3D', 'Norma y criterio'],
    ['Toma en área húmeda', 'Libro 3, 3.28.1 g → NTC 2050 210.8(A)(1) y (A)(7); 3.17.15 g', 'TB con GFCI a 0,20 m del lavamanos y 1,73 m de la ducha; protegida contra falla a tierra', 'E02, E04', 'Norma'],
    ['Ducha eléctrica', 'Libro 3, 3.17.15 b, c, d, e, f y h; 3.28.1 m', 'Circuito exclusivo C7, 1P 30 A con diferencial de 30 mA en el TG, 10 AWG con tierra, conexión a prueba de agua', 'E02, E04, MEM', 'Norma'],
    ['Canalización', 'Libro 3, 3.17.6.6 c, f y g; 3.17.13 e → NTC 2050 Cap. 9 Tabla 1; NSR-10 C.6.3', 'PVC de 1/2 in embebido en losa y contrapiso, llenado máximo 22 %, tapones antes del vaciado; cruce de la viga V-2 coordinado', 'E03, M3D', 'Norma'],
    ['Puesta a tierra', 'Libro 3, 3.12.1 b, c y d; Tabla 3.12.3.a; Título 27; Libro 2, 2.3.15.1.1 f', 'Dos varillas Cu de 5/8 in × 2,4 m (≈ 23 Ω), conductor del electrodo 8 AWG, caja de 30 × 30 cm, puente N–T solo en el TG', 'E04', 'Norma'],
    ['Código de colores', 'Libro 3, Título 5, Tabla 3.5.a', 'Fase A negra, fase B roja, neutro blanco, tierra verde; retornos amarillos y viajeros azules (criterio)', 'E03, MEM', 'Norma y criterio'],
    ['Tomas por ambiente', 'Libro 3, 3.28.1 o → NTC 2050 210.52(A)', 'Tomas a no más de 1,8 m de cualquier punto de la línea de piso en sala y alcobas (peor caso 1,75 m)', 'E02', 'Norma'],
    ['Mesón de cocina', 'Libro 3, 3.28.1 g → NTC 2050 210.52(C) y 210.8(A)(6)', 'Cuatro tomas GFCI en 4,35 m de mesón en L, ningún punto a más de 600 mm', 'E02', 'Norma'],
    ['Estufa eléctrica', 'Libro 3, 3.28.1 n', 'Circuito C8 de 240 V, 2P 30 A, 10 AWG', 'E02, E04', 'Norma'],
    ['Acometida y trámite', 'Libro 3, Título 26 d y f; 3.3.2; Libro 1 (capacidad instalable); Libro 4, 4.3.5', 'Cu 6 AWG, caída 0,70 %; 13,2 kVA instalables → esquema constructivo y declaración del constructor', 'E04, MEM', 'Norma'],
    ['Iluminación', 'Criterio de diseño (RETILAP 2026, Libro 3, 3.1.4.2 exceptúa áreas privadas residenciales); RETIE 3.14.1 b', '150 lx en sala-comedor con tres luminarias de 2 400 lm; niveles de referencia declarados', 'E01, MEM', 'Criterio'],
    ['DPS', 'Libro 3, 3.3.3.1 y 3.17.14', 'Espacio previsto en el TG para un DPS tipo 2; instalación sujeta a la evaluación de riesgo del diseñador', 'E04, MEM', 'Criterio']
  ];

  RT.CSV = RT.CSV || {};
  RT.CSV.matriz = function (filas) {
    filas = filas || RT.store.get('matriz', null) || RT.MATRIZ_EJEMPLO;
    const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    return '﻿' + ['Aspecto;Fuente exacta;Versión;Decisión;Evidencia;Tipo'].concat(filas.map((r) => [r[0], r[1], VERSION, r[2], r[3], r[4]].map(esc).join(';'))).join('\r\n');
  };

  RT.defineSim('matriz-normativa', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    let filas = RT.store.get('matriz', null) || RT.MATRIZ_EJEMPLO.map((r) => r.slice());
    sim.group('Matriz');
    sim.button('Agregar decisión', () => { filas.push(['', '', '', '', 'Norma']); guardar(); });
    sim.button('Restaurar el ejemplo', () => { filas = RT.MATRIZ_EJEMPLO.map((r) => r.slice()); guardar(); }, { newRow: true });
    sim.out('n', 'Decisiones', { hl: true });
    sim.out('rev', 'Revisión', { wide: true });
    RT.botonDescarga(sim.ctrlBox, 'Descargar matriz (CSV)', () => ['matriz-normativa.csv', RT.CSV.matriz(filas), 'text/csv']);
    const guardar = () => { RT.store.set('matriz', filas); pintar(); };
    const valida = (r) => {
      const p = [];
      if (!r[0].trim()) p.push('falta el aspecto');
      if (!/(Libro|NTC|NSR|RETILAP|Criterio|Título|\d\.\d)/i.test(r[1])) p.push('fuente sin libro, artículo o literal');
      if (!/(A01|M3D|E0[1-4]|MEM)/.test(r[3])) p.push('evidencia sin código de entregable');
      if (r[2].trim().length < 20) p.push('decisión sin aplicar al caso');
      return p;
    };
    const pintar = () => {
      box.innerHTML = '<table class="sim-tab" style="width:100%;table-layout:fixed"><thead><tr><th style="width:14%">Aspecto</th><th style="width:26%">Fuente exacta</th><th style="width:32%">Decisión aplicada al caso</th><th style="width:12%">Evidencia</th><th style="width:11%">Tipo</th><th style="width:5%"></th></tr></thead><tbody>' +
        filas.map((r, i) => { const p = valida(r); return `<tr style="${p.length ? 'background:color-mix(in srgb, var(--bad) 7%, transparent)' : ''}">` + [0, 1, 2, 3].map((k) => `<td><textarea data-i="${i}" data-k="${k}" rows="3" style="width:100%;font:12px var(--font-ui);border:1px solid var(--rule);border-radius:3px;background:var(--surface);color:var(--ink);resize:vertical" aria-label="Fila ${i + 1}, columna ${k + 1}">${r[k].replace(/</g, '&lt;')}</textarea></td>`).join('') + `<td><select data-i="${i}" data-k="4" style="width:100%;font:12px var(--font-ui)">${['Norma', 'Criterio', 'Norma y criterio'].map((t) => `<option${t === r[4] ? ' selected' : ''}>${t}</option>`).join('')}</select></td><td><button type="button" class="btn" data-del="${i}" title="Quitar" aria-label="Quitar fila ${i + 1}">✕</button></td></tr>`; }).join('') +
        `</tbody></table><p style="font:12.5px var(--font-ui);color:var(--ink-3)">Versión registrada en todas las filas: ${VERSION}.</p>`;
      box.querySelectorAll('textarea,select').forEach((el) => el.addEventListener('change', () => { filas[+el.dataset.i][+el.dataset.k] = el.value; guardar(); }));
      box.querySelectorAll('button[data-del]').forEach((b) => b.addEventListener('click', () => { filas.splice(+b.dataset.del, 1); guardar(); }));
      const malas = filas.map((r, i) => [i, valida(r)]).filter(([, p]) => p.length);
      sim.set('n', filas.length + (filas.length >= 8 ? ' <span class="chip ok">≥ 8</span>' : ' <span class="chip bad">faltan</span>'));
      sim.set('rev', malas.length ? malas.map(([i, p]) => `Fila ${i + 1}: ${p.join(', ')}`).join('<br>') : 'Todas las filas tienen fuente, decisión aplicada y evidencia.');
    };
    pintar();
  });

  RT.memoriaMD = function (equipo) {
    const ac = L.Q.acometida(K), d = ac.dem, cu = L.Q.cuadro(K), bal = L.Q.balance(K);
    const it = R.interferencias(K).filter((i) => i.tipo !== 'cim');
    const varr = C.rVarillas(100, 2.4, 15.9, K.electrico.tierra.varillas);
    const c7 = RT.calcCircuito ? RT.calcCircuito('C7') : null;
    const L1 = [];
    L1.push('# Memoria del proyecto eléctrico (propuesta académica)', '', `**Caso:** ${K.nombre} · ${K.lugar}  `, `**Equipo:** ${equipo || '(nombres)'}  `, `**RETIE consultado:** ${VERSION}`, '');
    L1.push('## 1. Objeto y alcance', 'Propuesta académica de coordinación de la instalación eléctrica de uso final de una vivienda unifamiliar de un piso. No apta para construcción: la ejecución real exige diseño, construcción e inspección por personas legalmente competentes (RETIE Libro 3, 3.2.1).', '');
    L1.push('## 2. Descripción de la edificación', `Área construida ${f2(K.areaConstruida())} m² (por caras exteriores), seis ambientes y un hall. ${K.estructura.descripcion} Fondo de losa a ${f2(K.H.fondoLosa)} m y fondo de vigas a ${f2(K.H.fondoViga)} m del piso.`, '');
    L1.push('## 3. Alimentación y supuestos', `${K.electrico.tension}, desde la red del operador de red. Acometida aérea concéntrica de cobre; medidor en la fachada sur. Supuestos: temperatura ambiente 30 °C, factor de potencia 1, ducha de 3 500 W a 120 V y estufa de 6 kW a 240 V según placa típica, resistividad del suelo 100 Ω·m.`, '');
    L1.push('## 4. Cargas y circuitos', `Demanda por el método estándar (NTC 2050, 220): ${f0(d.total)} VA (${f1(d.I240)} A a 240 V) frente a una carga instalada de ${f0(d.instalada)} VA. Nueve circuitos ramales:`, '');
    L1.push('| Circuito | Descripción | VA | Protección | Conductor | Fase |', '|---|---|---:|---|---|---|');
    for (const r of cu) L1.push(`| ${r.id} | ${r.nombre} | ${f0(r.va)} | ${r.prot} | ${r.awg} AWG (T ${r.tierra}) | ${r.fase} |`);
    L1.push('', `Balance: fase A ${f0(bal.A)} VA, fase B ${f0(bal.B)} VA (desbalance ${C.fmt(100 * bal.desb, 1)} %).`, '');
    L1.push('## 5. Tablero y protecciones', `Tablero general monofásico trifilar de 12 espacios en el hall, muro M5 (fuera del baño, espacio de trabajo libre, palanca a 1,80 m; RETIE 3.17.8, 3.17.19 y Título 4). Totalizador 2P ${ac.In} A. Diferencial de 30 mA en el circuito de la ducha (3.17.15 c); tomas GFCI donde lo exige 3.28.1 g.`, '');
    L1.push('## 6. Puesta a tierra', `Dos varillas Cu de 5/8 in × 2,4 m separadas 2,4 m (R calculada ≈ ${f1(varr.R)} Ω con ρ = 100 Ω·m; referencia 25 Ω, Tabla 3.12.3.a), conductor del electrodo Cu 8 AWG (Tabla 250-66), caja de inspección de 30 × 30 cm (3.12.1 d). Puente neutro-tierra solo en el tablero general (Título 27); régimen TN-C-S (Título 25).`, '');
    L1.push('## 7. Canalizaciones y coordinación con la estructura', `Tubería PVC de 1/2 in embebida en la losa (alumbrado y ducha) y en el contrapiso (tomas y estufa). Revisión de interferencias: ${it.length} puntos de coordinación (cruces de viga en la losa, bajantes en muros bajo vigas y cajas cercanas a columnas), ninguno en zona de confinamiento. Conflictos documentados: (1) cruce del tramo LC–LK1 con la viga V-2(A-B); (2) caja TS5 desplazada 0,40 m de la columna B-2.`, '');
    L1.push('## 8. Cálculos', c7 ? c7.texto : '', `Acometida y alimentador: ${f1(ac.I)} A, Cu ${ac.awg} AWG, ${f2(ac.Lal)} m, caída ${f2(ac.dv.pct)} % (≤ 3 %, Título 26 f). Capacidad instalable ${C.fmt(ac.ci.kVA, 1)} kVA → esquema constructivo (3.3.2) y declaración de cumplimiento del constructor (Libro 4, 4.3.5).`, '');
    L1.push('## 9. Análisis de riesgos', 'Matriz del Libro 1 (1.5.1.4.1): contacto indirecto en ducha y lavadora mitigado con conductor de tierra y diferencial (nivel BAJO); arco en el tablero mitigado con tapas y espacio de trabajo (MEDIO); incendio por sobrecarga mitigado con coordinación conductor-protección (BAJO).', '');
    L1.push('## 10. Matriz normativa', 'Ver tabla anexa (ocho decisiones o más con fuente exacta, versión y evidencia).', '');
    L1.push('## 11. Calculado, supuesto y pendiente', '- Calculado: demanda, acometida, circuito C7, llenado de tubos, resistencia teórica de tierra, iluminancia media.', '- Supuesto: potencias de placa, temperatura ambiente, resistividad del suelo, longitudes del modelo.', '- Pendiente: corriente de cortocircuito del operador de red, capacidad de interrupción, medición de la resistencia de tierra, evaluación del DPS.', '');
    L1.push('## 12. Ítems que no aplican', '- Campos electromagnéticos: la corriente de la acometida es muy inferior a 1 000 A (3.3.3.2).', '- Instalaciones especiales, equipos especiales y bandejas portacables: no hay en la vivienda (3.17.6.2 s).', '');
    L1.push('## Anexos', '- Planos A01, E01, E02, E03, E04 y vistas del M3D.', '- Lista de materiales con referencias del Libro 2.', '- Borrador del manual de operación y mantenimiento (Título 6).');
    return L1.join('\n');
  };

  RT.defineSim('memoria', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('Datos');
    const row = RT.el('div', 'ctrl');
    row.innerHTML = '<label for="mem-eq">Integrantes del equipo</label>';
    const inp = document.createElement('input'); inp.type = 'text'; inp.id = 'mem-eq'; inp.className = 'num-in'; inp.value = RT.store.get('mem:eq', '');
    row.append(inp); sim._parent().append(row);
    inp.addEventListener('input', () => { RT.store.set('mem:eq', inp.value); pintar(); });
    RT.botonDescarga(sim.ctrlBox, 'Descargar memoria (Markdown)', () => ['memoria-proyecto-retie.md', RT.memoriaMD(inp.value), 'text/markdown']);
    RT.botonDescarga(sim.ctrlBox, 'Descargar memoria (HTML)', () => ['memoria-proyecto-retie.html', '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Memoria del proyecto</title><style>body{font:15px/1.55 Georgia,serif;max-width:48rem;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:4px 6px}</style></head><body>' + md2html(RT.memoriaMD(inp.value)) + '</body></html>', 'text/html']);
    const md2html = (md) => {
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const lines = md.split('\n'); let h = '', tabla = false, lista = false;
      for (const l of lines) {
        if (l.startsWith('|')) { if (/^\|[-:|]+\|$/.test(l)) continue; const cells = l.split('|').slice(1, -1); if (!tabla) { h += '<table>'; tabla = true; h += '<tr>' + cells.map((c) => `<th>${esc(c.trim())}</th>`).join('') + '</tr>'; } else h += '<tr>' + cells.map((c) => `<td>${esc(c.trim())}</td>`).join('') + '</tr>'; continue; }
        if (tabla) { h += '</table>'; tabla = false; }
        if (l.startsWith('- ')) { if (!lista) { h += '<ul>'; lista = true; } h += `<li>${esc(l.slice(2))}</li>`; continue; }
        if (lista) { h += '</ul>'; lista = false; }
        if (l.startsWith('# ')) h += `<h3>${esc(l.slice(2))}</h3>`;
        else if (l.startsWith('## ')) h += `<h4>${esc(l.slice(3))}</h4>`;
        else if (l.trim()) h += `<p>${esc(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`;
      }
      if (tabla) h += '</table>'; if (lista) h += '</ul>';
      return h;
    };
    const pintar = () => { box.innerHTML = md2html(RT.memoriaMD(inp.value)); };
    pintar();
  });

  RT.defineSim('rubrica', function (sim) {
    const CRIT = [
      ['ex', 'Exposición', 15, 'Explicación comprensible, fuentes localizadas y ejemplo aplicado'],
      ['an', 'Aplicación normativa', 25, 'Decisiones justificadas y matriz trazable al plano y al caso'],
      ['pl', 'Planos eléctricos', 20, 'Lectura clara, circuitos identificados y correspondencia entre láminas'],
      ['m3', 'Modelo 3D', 15, 'Dimensiones coherentes y correspondencia con los planos'],
      ['me', 'Memoria y coordinación', 15, 'Datos consistentes, alcance de cálculos claro y conflictos resueltos'],
      ['su', 'Sustentación', 10, 'Participación del equipo y explicación individual del trabajo']
    ];
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Nivel alcanzado en cada criterio');
    const NIV = [[0, 'Ausente'], [0.4, 'Inicial'], [0.7, 'Aceptable'], [0.9, 'Bueno'], [1, 'Excelente']];
    for (const [id, n, pts] of CRIT) sim.seg(id, { label: `${n} (${pts} pts)`, options: NIV.map(([v, t]) => [v, t]), value: RT.store.get('rub:' + id, 0.7), onInput: (v) => RT.store.set('rub:' + id, v) });
    sim.out('t', 'Puntaje estimado', { hl: true });
    sim.out('d', 'Dónde mejorar', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      let tot = 0, x = 20;
      const sc = (W - 40) / 100;
      CRIT.forEach(([id, n, pts], i) => {
        const v = +sim.p[id] * pts; tot += v;
        ctx.fillStyle = RT.alpha(['--c1', '--accent', '--c3', '--c5', '--c4', '--c6'][i], 0.25); ctx.fillRect(x, H * 0.35, pts * sc, H * 0.3);
        ctx.fillStyle = RT.alpha(['--c1', '--accent', '--c3', '--c5', '--c4', '--c6'][i], 0.85); ctx.fillRect(x, H * 0.35, v * sc, H * 0.3);
        ctx.strokeStyle = RT.col('--surface'); ctx.lineWidth = 2; ctx.strokeRect(x, H * 0.35, pts * sc, H * 0.3);
        RT.text(ctx, n, x + (pts * sc) / 2, H * 0.3, { size: 11, align: 'center', color: '--ink-2' });
        RT.text(ctx, C.fmt(v, 1) + '/' + pts, x + (pts * sc) / 2, H * 0.75, { size: 11, align: 'center', mono: true });
        x += pts * sc;
      });
      sim.set('t', C.fmt(tot, 1) + ' / 100');
      const bajo = CRIT.filter(([id]) => +sim.p[id] < 0.7);
      sim.set('d', bajo.length ? bajo.map(([, n, , d]) => `<b>${n}</b>: ${d}.`).join('<br>') : 'Todos los criterios en nivel aceptable o mejor.');
    });
  });
})();
