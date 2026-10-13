/* Capítulo 16 — Preparar la exposición y la ficha normativa */
(function () {
  'use strict';
  const RT = window.RT;
  const TEMAS = ['Alcance y riesgos eléctricos', 'Diseño y responsabilidades', 'Productos eléctricos', 'Conductores e identificación', 'Cajas y canalizaciones', 'Tableros y protecciones', 'Puesta a tierra', 'Uso final y conformidad'];
  const EJEMPLO = {
    tema: 'Puesta a tierra', equipo: 'Equipo 7', numerales: 'Libro 3, Título 12 (3.12.1, 3.12.2, 3.12.3); Título 25; Título 27; Libro 2, 2.3.15. Versión: Res. 40117 de 2024 modificada por la Res. 40284 de 2026.',
    r1: 'Los elementos metálicos del refuerzo estructural deben tener conexión permanente con el sistema de puesta a tierra (3.12.1 b).',
    r2: 'El neutro y la tierra van separados y se unen con un puente equipotencial solo en el tablero general (Título 27).',
    r3: 'El electrodo tipo varilla mide mínimo 2,4 m y su conexión queda accesible en una caja de inspección de 30 × 30 cm (2.3.15.1.1 f y 3.12.1 d).',
    ejemplo: 'Casa ejemplo: dos varillas Cu de 5/8 in × 2,4 m en el antejardín separadas 2,4 m (≈ 23 Ω con ρ = 100 Ω·m), conductor del electrodo 8 AWG hasta el tablero general del hall, puente neutro-tierra solo en ese tablero y conductor de tierra en cada tramo de tubería (plano E04).',
    error: 'Unir neutro y tierra en una caja de toma: la corriente de carga circula por las carcasas y el conductor de protección (Título 27).'
  };
  const CAMPOS = [['tema', 'Tema'], ['equipo', 'Equipo e integrantes'], ['numerales', 'Numerales consultados y versión'], ['r1', 'Requisito relevante 1'], ['r2', 'Requisito relevante 2'], ['r3', 'Requisito relevante 3'], ['ejemplo', 'Ejemplo aplicado'], ['error', 'Error frecuente']];

  RT.defineSim('ficha-exposicion', function (sim) {
    const out = RT.el('div', 'doc-out');
    sim.stage.append(out);
    const form = RT.el('div', 'sim-form');
    sim.ctrlBox.append(form);
    const datos = RT.store.get('ficha', { tema: TEMAS[6] });
    const ins = {};
    for (const [k, t] of CAMPOS) {
      const lab = RT.el('label', null, t);
      let el;
      if (k === 'tema') { el = document.createElement('select'); TEMAS.forEach((x) => { const o = document.createElement('option'); o.value = x; o.textContent = x; el.append(o); }); }
      else if (k === 'equipo') { el = document.createElement('input'); el.type = 'text'; }
      else el = document.createElement('textarea');
      el.id = 'ficha-' + k;
      el.value = datos[k] || '';
      el.addEventListener('input', () => { datos[k] = el.value; RT.store.set('ficha', datos); pintar(); });
      el.addEventListener('change', () => { datos[k] = el.value; RT.store.set('ficha', datos); pintar(); });
      lab.htmlFor = el.id;
      lab.append(el);
      form.append(lab);
      ins[k] = el;
    }
    const fila = RT.el('div', 'ctrl-row');
    const bEj = RT.el('button', 'btn', 'Cargar ejemplo de puesta a tierra'); bEj.type = 'button';
    bEj.addEventListener('click', () => { Object.assign(datos, EJEMPLO); for (const k in ins) ins[k].value = datos[k] || ''; RT.store.set('ficha', datos); pintar(); });
    const bCp = RT.el('button', 'btn', 'Copiar texto'); bCp.type = 'button';
    bCp.addEventListener('click', () => RT.copiar(bCp, texto()));
    fila.append(bEj, bCp);
    form.append(fila);
    const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const html = () => `<h4>Ficha normativa · ${esc(datos.tema)}</h4><p style="font:13px var(--font-ui);color:var(--ink-3)">${esc(datos.equipo)} · Proyecto RETIE, Ingeniería Civil</p>
      <table><tr><th style="width:28%">Numerales</th><td>${esc(datos.numerales)}</td></tr>
      <tr><th>Requisito 1</th><td>${esc(datos.r1)}</td></tr><tr><th>Requisito 2</th><td>${esc(datos.r2)}</td></tr><tr><th>Requisito 3</th><td>${esc(datos.r3)}</td></tr>
      <tr><th>Ejemplo aplicado</th><td>${esc(datos.ejemplo)}</td></tr><tr><th>Error frecuente</th><td>${esc(datos.error)}</td></tr></table>`;
    const texto = () => CAMPOS.map(([k, t]) => `${t}: ${datos[k] || ''}`).join('\n');
    RT.botonDescarga(form, 'Descargar ficha (HTML)', () => ['ficha-' + (datos.tema || 'tema').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-') + '.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ficha normativa · ${esc(datos.tema)}</title><style>body{font:15px/1.5 Georgia,serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#1b1f22}h4{font:700 22px Arial Narrow,Arial,sans-serif;margin:0 0 4px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eee;font:600 13px Arial,sans-serif}</style></head><body>${html().replace(/var\(--[a-z0-9-]+\)/g, '#555')}</body></html>`, 'text/html']);
    const pintar = () => { out.innerHTML = html(); };
    pintar();
  });
})();
