/* Capítulo 35 — Herramientas y servicios */
(function () {
  'use strict';
  const NL = window.NL;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  NL.defineSim('elegir-herramienta', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Su proyecto');
    sim.select('t', { label: 'Tarea principal', options: [['cls', 'Clasificar textos'], ['ext', 'Extraer entidades y relaciones'], ['gen', 'Generar o resumir texto, responder preguntas'], ['rep', 'Buscar y comparar textos'], ['inv', 'Investigar o enseñar algoritmos']], value: 'cls' });
    sim.select('d', { label: 'Datos etiquetados disponibles', options: [['n', 'Ninguno'], ['p', 'Cientos'], ['m', 'Miles o más']], value: 'p' });
    sim.seg('p', { label: 'Privacidad de los textos', options: [['a', 'Pueden salir de la organización'], ['b', 'Deben quedarse dentro']], value: 'a' });
    sim.seg('v', { label: 'Volumen', options: [['b', 'Bajo'], ['a', 'Alto (millones de textos)']], value: 'b' });
    sim.out('r', 'Recomendación', { hl: true });
    sim.onDraw(() => {
      const { t, d, p, v } = sim.p, por = []; let r;
      if (t === 'inv') { r = 'NLTK, scikit-learn y PyTorch'; por.push('permiten ver y modificar cada paso; son los de este curso'); }
      else if (t === 'gen') {
        if (p === 'b') { r = 'Un modelo de pesos abiertos alojado por usted y, si hace falta, recuperación (RAG)'; por.push('los textos no salen de la organización'); }
        else { r = 'La API de un modelo grande en la nube, con mensajes bien diseñados y evaluación sistemática'; por.push('no requiere entrenar; el coste crece con el volumen'); }
        if (v === 'a') por.push('con volumen alto compare el coste por token de la API con el de un modelo propio más pequeño');
      } else if (t === 'rep') { r = 'TF-IDF o BM25 (scikit-learn, Elasticsearch) y, si no basta, embeddings con un índice vectorial'; por.push('es la línea de base rápida y barata; los embeddings añaden semántica'); }
      else {
        if (d === 'n') { r = t === 'cls' ? 'Aprendizaje en contexto con un modelo grande, o un servicio de nube de clasificación' : 'Un servicio de nube de entidades o un modelo de entidades preentrenado (spaCy, Stanza)'; por.push('sin etiquetas no hay entrenamiento; empiece por etiquetar 200 ejemplos para poder evaluar'); }
        else if (d === 'p') { r = 'Ajuste fino de un modelo preentrenado pequeño, con TF-IDF + regresión logística como línea de base'; por.push('con cientos de ejemplos el preentrenamiento aporta mucho; compare siempre con la línea de base'); }
        else { r = t === 'cls' ? 'Ajuste fino de un Transformer en español; TF-IDF + regresión logística como piso de comparación' : 'Ajuste fino de un modelo de etiquetado de secuencias (esquema BIO)'; por.push('con miles de ejemplos el ajuste fino supera con claridad a las reglas'); }
        if (p === 'b') por.push('hágalo en local: las API de la nube no son opción');
        if (v === 'a') por.push('con volumen alto, un modelo pequeño propio sale más barato que una API por texto');
      }
      sim.set('r', r);
      box.innerHTML = `<p style="margin:0 0 6px"><b>${esc(r)}</b></p><ul style="margin:0;padding-left:1.2em">${por.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><small style="color:var(--ink-3)">Reglas de orientación, no una receta: mida siempre con sus datos, empezando por la línea de base más sencilla.</small>`;
    });
  });
  NL.bank.add('herramientas', [
    { q: 'NLTK se caracteriza por…', opts: ['Ser una biblioteca pensada para enseñar y explorar el PLN, con muchos corpus y algoritmos', 'Ser un servicio de nube', 'Ser solo para inglés', 'Ser un modelo de lenguaje'], ok: 0, fb: 'Es lenta para producción, pero ideal para aprender.', lvl: 1 },
    { q: 'spaCy está orientada a…', opts: ['Uso industrial: canalizaciones rápidas con tokenización, etiquetado, análisis y entidades', 'La enseñanza únicamente', 'Imágenes', 'Hojas de cálculo'], ok: 0, fb: 'Ofrece modelos preentrenados en varios idiomas, español incluido.', lvl: 2 },
    { q: 'La biblioteca «transformers» de Hugging Face sirve para…', opts: ['Descargar y usar o ajustar modelos preentrenados de tipo Transformer', 'Tokenizar con expresiones regulares', 'Dibujar gráficas', 'Gestionar bases de datos'], ok: 0, fb: 'Con miles de modelos y conjuntos de datos en el Hub.', lvl: 1 },
    { q: 'Una razón para preferir un modelo propio a una API de nube es…', opts: ['Que los textos son confidenciales y no pueden salir de la organización', 'Que es siempre más barato', 'Que es siempre más preciso', 'Que no necesita mantenimiento'], ok: 0, fb: 'Otras: coste con volumen alto, latencia y control de versiones.', lvl: 1 },
    { q: 'En el programa del capítulo, ¿cuál tokeniza más rápido?', opts: ['str.split(), con unos 10 millones de tokens por segundo (frente a 0,12 de word_tokenize)', 'word_tokenize de NLTK', 'La expresión regular', 'Todos igual'], ok: 0, fb: 'Pero split no separa la puntuación: más rápido no es equivalente.', lvl: 2 },
    { q: 'Antes de elegir una herramienta compleja conviene…', opts: ['Medir una línea de base sencilla (TF-IDF + regresión logística) con los propios datos', 'Entrenar el modelo mayor posible', 'Evitar evaluar', 'Cambiar de idioma'], ok: 0, fb: 'A menudo la línea de base está a pocos puntos y cuesta mil veces menos.', lvl: 1 }
  ]);
})();
