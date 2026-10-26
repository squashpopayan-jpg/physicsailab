const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, 'test_interactivo_dump.html');
const outPath = path.join(__dirname, '..', 'material', '1_cursos', 'percepcion', 'src', 'core', '40-quiz.js');

const content = fs.readFileSync(dumpPath, 'utf8');
const match = content.match(/const ALL_QUESTIONS = (\[[\s\S]*?\]);/);

if (!match) {
  console.error('Could not find ALL_QUESTIONS in dump');
  process.exit(1);
}

const qs = eval(match[1]);
console.log('Extracted ' + qs.length + ' questions.');

const categorized = qs.map(q => {
  let cat = 'General';
  const text = (q.question + ' ' + (q.explanation || '')).toLowerCase();
  if (text.includes('visual') || text.includes('auditivo') || text.includes('fisiol') || text.includes('ojo') || text.includes('oído') || text.includes('percepción computacional') || text.includes('sensor')) {
    cat = 'Fundamentos & Sensores (Temas 1-2)';
  } else if (text.includes('nyquist') || text.includes('muestreo') || text.includes('cuantific') || text.includes('ruido') || text.includes('anomal') || text.includes('wiener') || text.includes('mediana')) {
    cat = 'Muestreo, Ruido & Anomalías (Temas 3-5)';
  } else if (text.includes('histograma') || text.includes('convoluci') || text.includes('sobel') || text.includes('canny') || text.includes('laplacian') || text.includes('espacial') || text.includes('morfolog') || text.includes('fourier') || text.includes('dft')) {
    cat = 'Procesamiento Espacial & Frecuencial (Temas 6-9)';
  } else if (text.includes('segment') || text.includes('otsu') || text.includes('región') || text.includes('regiones') || text.includes('watershed') || text.includes('hu') || text.includes('estadístic') || text.includes('dice') || text.includes('jaccard')) {
    cat = 'Segmentación & Características (Temas 10-11)';
  } else if (text.includes('textura') || text.includes('haralick') || text.includes('glcm') || text.includes('lbp') || text.includes('gabor') || text.includes('wavelet') || text.includes('sift')) {
    cat = 'Textura & Multiescala (Temas 12-13)';
  } else {
    cat = 'Decisión, Métricas & Aplicaciones (Temas 14-15)';
  }
  return { ...q, category: cat };
});

const jsCode = `/* ===================================================================
   40-quiz.js — Banco Oficial de 40 Preguntas de Examen de Percepción Computacional
   Autoría: Ing. Luis Fernando Barajas Ardila — Especialización en Inteligencia Artificial
   =================================================================== */
(function () {
  "use strict";
  window.PERCEPCION = window.PERCEPCION || {};
  window.PERCEPCION.QUESTIONS = ${JSON.stringify(categorized, null, 2)};
})();
`;

fs.writeFileSync(outPath, jsCode, 'utf8');
console.log('Saved 40-quiz.js successfully to ' + outPath);
