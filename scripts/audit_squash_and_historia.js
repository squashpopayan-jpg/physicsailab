const fs = require('fs');

global.window = {};

console.log('=== AUDITORÍA DE TRIVIA DE HISTORIA DE LA FÍSICA ===');
require('../web/trivia-historia-questions.js');
const hq = window.TRIVIA_HISTORIA_QUESTIONS || [];
console.log('Total preguntas historia:', hq.length);

function auditBank(name, questions) {
  let issues = 0;
  const exactStems = new Map();
  const normStems = {};

  questions.forEach((q, idx) => {
    // 1. Check required fields
    if (!q.pregunta || !q.opciones || q.correcta === undefined || !q.explicacion) {
      console.log(`[${name}] Pregunta #${idx} ID:${q.id} le faltan campos obligatorios`);
      issues++;
    }

    // 2. Check options prefix
    if (!Array.isArray(q.opciones) || q.opciones.length !== 4) {
      console.log(`[${name}] Pregunta #${idx} ID:${q.id} no tiene 4 opciones (tiene ${q.opciones ? q.opciones.length : 0})`);
      issues++;
    } else {
      q.opciones.forEach((opt, oidx) => {
        const pfx = ['A. ', 'B. ', 'C. ', 'D. '][oidx];
        if (!opt.startsWith(pfx)) {
          console.log(`[${name}] ID:${q.id} opción ${oidx} no empieza por '${pfx}': "${opt.slice(0, 30)}"`);
          issues++;
        }
      });
    }

    // 3. Check correcta range
    if (typeof q.correcta !== 'number' || q.correcta < 0 || q.correcta > 3) {
      console.log(`[${name}] ID:${q.id} indice 'correcta' inválido: ${q.correcta}`);
      issues++;
    }

    // 4. Exact duplicate
    const cleanExact = q.pregunta.trim().toLowerCase();
    if (exactStems.has(cleanExact)) {
      console.log(`[${name}] DUPLICADO EXACTO entre ID:${q.id} y ID:${exactStems.get(cleanExact)}: "${q.pregunta.slice(0, 60)}"`);
      issues++;
    } else {
      exactStems.set(cleanExact, q.id);
    }

    // 5. Normalized stem (detect cloned templates with just altered numbers or names)
    const norm = q.pregunta.replace(/[0-9]+(\.[0-9]+)?/g, 'NUM')
                           .replace(/≈/g, '=')
                           .replace(/\s+/g, ' ')
                           .trim().toLowerCase();
    normStems[norm] = (normStems[norm] || 0) + 1;
  });

  const repeatedTemplates = Object.entries(normStems).filter(([s, c]) => c > 1);
  console.log(`[${name}] Total plantillas con variación numérica repetidas (>1):`, repeatedTemplates.length);
  repeatedTemplates.forEach(([s, c]) => {
    console.log(`   -> ${c} veces: ${s.slice(0, 80)}`);
  });

  console.log(`[${name}] Resumen: ${questions.length} preguntas evaluadas. Problemas detectados: ${issues}`);
  return { issues, repeatedTemplates: repeatedTemplates.length };
}

auditBank('HISTORIA', hq);

console.log('\n=== AUDITORÍA DE TRIVIA DE SQUASH ===');
require('../web/trivia-squash-questions.js');
const sq = window.TRIVIA_SQUASH_QUESTIONS || [];
console.log('Total preguntas squash:', sq.length);
auditBank('SQUASH', sq);
