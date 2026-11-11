/* Genera los apéndices A (formulario), B (validación) y C (bibliografía) a partir de los capítulos y de tests/resultados.json */
const fs = require('fs');
const path = require('path');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

module.exports = function apendices(chDir, chFiles, VR) {
  const chapters = [];
  for (const f of chFiles.filter((x) => x.endsWith('.html') && !x.startsWith('00-'))) {
    const t = fs.readFileSync(path.join(chDir, f), 'utf8');
    const head = t.match(/<template[^>]*>/)[0];
    const attr = (n) => { const m = head.match(new RegExp(n + '="([^"]*)"')); return m ? m[1] : ''; };
    if (!/^\d+$/.test(attr('data-num'))) continue;
    const parts = t.split(/(?=<deriv\s)/).slice(1);
    const derivs = parts.map((p, i) => {
      const body = p.split('</deriv>')[0];
      return {
        id: (body.match(/id="([^"]+)"/) || [])[1], title: (body.match(/title="([^"]*)"/) || [])[1] || '', k: i + 1,
        results: [...body.matchAll(/<result name="([^"]*)">([\s\S]*?)<\/result>/g)].map((m) => ({ name: m[1], tex: m[2].trim() }))
      };
    });
    const refs = [...(t.match(/<ul class="refs">([\s\S]*?)<\/ul>/) || [, ''])[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    chapters.push({ id: attr('data-id'), num: +attr('data-num'), title: attr('data-title'), part: attr('data-part'), derivs, refs });
  }
  const partsOrder = [...new Set(chapters.map((c) => c.part))];
  const nDer = chapters.reduce((s, c) => s + c.derivs.length, 0);
  const tpl = (id, num, title, short, body) => `<template class="chapter-src" data-id="${id}" data-num="${num}" data-title="${title}" data-part="Apéndices" data-short="${short}">\n${body}\n</template>`;
  const pad2 = (n) => String(n).padStart(2, '0');

  /* A — formulario */
  let A = `<p class="lead">Los resultados finales de las ${nDer} deducciones del curso, en orden de capítulos. Cada fila lleva al desarrollo completo de la deducción.</p>`;
  for (const part of partsOrder) {
    A += `<section><h2>${part}</h2><div class="tablewrap"><table><tr><th>Deducción</th><th>Resultado</th></tr>`;
    for (const c of chapters.filter((x) => x.part === part)) {
      for (const d of c.derivs) for (const r of d.results) {
        A += `<tr><td><a href="#${c.id}.${d.k}"><b>D${c.num}.${d.k}</b></a> ${d.title}<br><small>${r.name}</small></td><td>${r.tex}</td></tr>`;
      }
    }
    A += '</table></div></section>';
  }

  /* B — validación */
  const rows = VR.rows || [];
  const groups = [['Pasos de las deducciones (SymPy)', 'Pasos'], ['Análisis dimensional de los resultados', 'Unidades'], ['Explorador de fórmulas contra SymPy', 'Explorador'], ['Cifras de los ejemplos', 'Cifras']];
  const by = {};
  for (const r of rows) { if (!r.deriv) continue; const o = (by[r.deriv] = by[r.deriv] || { n: {}, bad: 0, tot: 0 }); o.n[r.group] = (o.n[r.group] || 0) + 1; o.tot++; if (!r.pass) o.bad++; }
  const total = rows.length, bad = rows.filter((r) => !r.pass).length;
  const cell = (o, g) => (o && o.n[g] ? o.n[g] : '·');
  let B = `<p class="lead"><b>${total - bad} de ${total} pruebas superadas</b>${VR.fecha ? ` (ejecución del ${VR.fecha})` : ''}. Cada deducción se comprueba en cuatro frentes; la tabla muestra cuántas pruebas hay en cada uno.</p>`;
  B += '<section><h2>Qué se comprueba</h2><ul>' +
    '<li><b>Pasos</b>: cada paso algebraico, integral, serie, solución de ecuación diferencial o sistema de ecuaciones se verifica con SymPy (cálculo simbólico exacto) y, cuando hace falta, con una integración o diagonalización numérica independiente (SciPy, mpmath, NumPy) o con una simulación de Monte Carlo.</li>' +
    '<li><b>Unidades</b>: cada resultado pasa por un analizador de dimensiones que usa las unidades de la tabla de variables de la deducción.</li>' +
    '<li><b>Explorador</b>: cada salida de cada explorador se compara con la expresión exacta (SymPy a 40 cifras) o con una referencia numérica independiente en muestras aleatorias de los parámetros, y los exponentes de la tabla de sensibilidad se comparan con la derivada logarítmica exacta.</li>' +
    '<li><b>Cifras</b>: cada número que aparece en el texto (efectos, ejemplos, valores iniciales de los exploradores) se recalcula y se compara con redondeo exacto.</li>' +
    '<li>Las constantes son las de CODATA 2018 / SI 2019 y los datos de partida (masas, anchuras, módulos, abundancias) proceden de las tablas del PDG, NIST, AME2020 o de los textos citados en cada capítulo.</li></ul></section>';
  for (const part of partsOrder) {
    B += `<section><h2>${part}</h2><div class="tablewrap"><table><tr><th>Deducción</th>${groups.map((g) => `<th class="c">${g[1]}</th>`).join('')}<th class="c">Total</th><th class="c">Estado</th></tr>`;
    for (const c of chapters.filter((x) => x.part === part)) {
      for (const d of c.derivs) {
        const o = by[d.id];
        B += `<tr><td><a href="#${c.id}.${d.k}"><b>D${c.num}.${d.k}</b></a> ${d.title}</td>${groups.map((g) => `<td class="c">${cell(o, g[0])}</td>`).join('')}<td class="c">${o ? o.tot : 0}</td><td class="c">${o && !o.bad ? '✓' : '✗'}</td></tr>`;
      }
    }
    B += '</table></div></section>';
  }

  /* C — bibliografía */
  let C = `<p class="lead">Las fuentes de cada capítulo, reunidas. Los libros de texto se citan por capítulos; los artículos originales, por revista, volumen y año.</p>`;
  for (const part of partsOrder) {
    C += `<section><h2>${part}</h2>`;
    for (const c of chapters.filter((x) => x.part === part)) C += `<h3>${pad2(c.num)} · ${c.title}</h3><ul class="refs">${c.refs.map((r) => `<li>${r}</li>`).join('')}</ul>`;
    C += '</section>';
  }
  return [
    tpl('formulario', 'A', 'Formulario de resultados', `Los resultados de las ${nDer} deducciones, en una sola tabla`, A),
    tpl('validacion', 'B', 'Validación', `${total - bad} de ${total} pruebas: pasos, unidades, exploradores y cifras de cada deducción`, B),
    tpl('bibliografia', 'C', 'Bibliografía', 'Las fuentes de todos los capítulos', C)
  ];
};
