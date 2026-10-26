const fs = require('fs');
const path = require('path');

const preserved = JSON.parse(fs.readFileSync(path.join(__dirname, '../web/preserved-base.json'), 'utf8'));
const mod1 = require('./questions_module1_mecanica.js');
const mod2 = require('./questions_module2_fluidos_termo.js');
const mod3 = require('./scripts_em' ? './questions_module3_em_optica.js' : './questions_module3_em_optica.js');
const mod4 = require('./questions_module4_relatividad_cuantica.js');
const mod5 = require('./questions_module5_solido_nuclear_cosmo.js');

console.log('Preserved base count:', preserved.length);
console.log('Module 1 count:', mod1.length);
console.log('Module 2 count:', mod2.length);
console.log('Module 3 count:', mod3.length);
console.log('Module 4 count:', mod4.length);
console.log('Module 5 count:', mod5.length);

const rawCombined = [...preserved, ...mod1, ...mod2, ...mod3, ...mod4, ...mod5];
console.log('Combined total:', rawCombined.length);

// Area standardization map
const areaMap = {
  'Física Fundamental y Metrología': 'Física Fundamental',
  'Dinámica y Leyes de Newton': 'Dinámica y Fuerzas',
  'Trabajo, Energía y Conservación': 'Trabajo y Energía',
  'Oscilaciones y Péndulo Simple': 'Oscilaciones y Ondas',
  'Termodinámica y Calor': 'Termodinámica',
  'Circuitos y Corriente Eléctrica': 'Electromagnetismo',
  'Óptica Geométrica y Ondulatoria': 'Óptica y Fotónica'
};

const standardized = rawCombined.map((q, idx) => {
  let area = q.area;
  if (areaMap[area]) {
    area = areaMap[area];
  }
  // Specific fix for the microwave question kept as representative
  if (q.pregunta && q.pregunta.includes('radiofrecuencia (microondas)')) {
    area = 'Electromagnetismo';
    q.subtema = 'Ondas Electromagnéticas';
  }
  if (q.pregunta && q.pregunta.includes('adquiere una aceleración constante') && q.pregunta.includes('magnitud de la fuerza neta')) {
    area = 'Dinámica y Fuerzas';
    q.subtema = 'Segunda Ley de Newton';
  }

  return {
    id: idx + 1,
    area: area,
    subtema: q.subtema || 'General',
    nivel: q.nivel || 2,
    dificultad: q.dificultad || 'Intermedio',
    pregunta: q.pregunta.trim(),
    opciones: q.opciones.map(opt => opt.trim()),
    correcta: q.correcta,
    explicacion: q.explicacion.trim()
  };
});

// Final Validation
let errors = 0;
const stemSet = new Set();

standardized.forEach((q, idx) => {
  const norm = q.pregunta.toLowerCase().replace(/\s+/g, ' ').trim();
  if (stemSet.has(norm)) {
    console.error(`Error: Duplicate question detected at ID ${q.id}: ${q.pregunta}`);
    errors++;
  }
  stemSet.add(norm);

  if (!Array.isArray(q.opciones) || q.opciones.length !== 4) {
    console.error(`Error: Question ID ${q.id} does not have exactly 4 options.`);
    errors++;
  } else {
    q.opciones.forEach((opt, oidx) => {
      const prefix = ['A. ', 'B. ', 'C. ', 'D. '][oidx];
      if (!opt.startsWith(prefix)) {
        console.error(`Error: Option prefix missing at ID ${q.id}, opt ${oidx}: ${opt}`);
        errors++;
      }
    });
  }

  if (typeof q.correcta !== 'number' || q.correcta < 0 || q.correcta > 3) {
    console.error(`Error: Invalid 'correcta' index at ID ${q.id}: ${q.correcta}`);
    errors++;
  }

  if (!q.explicacion || q.explicacion.length < 5) {
    console.error(`Error: Missing explanation at ID ${q.id}`);
    errors++;
  }
});

if (errors > 0) {
  console.error(`Build failed with ${errors} errors.`);
  process.exit(1);
}

console.log('✅ All questions passed 100% of validation rules!');

// Generate the final JavaScript file content
const fileHeader = `/**
 * BANCO OFICIAL DE PREGUNTAS: LA GRAN TRIVIA DE FÍSICA
 * Plataforma Universitaria PhysicsAILab
 * 
 * Contenido: ${standardized.length} preguntas únicas, no repetitivas y rigurosamente diversificadas.
 * Áreas cubiertas:
 *  - Física Fundamental y Metrología
 *  - Cinemática Clásica y Dinámica de Fuerzas
 *  - Trabajo, Energía y Leyes de Conservación
 *  - Rotación, Gravitación, Órbitas y Leyes de Kepler
 *  - Mecánica de Fluidos y Fenómenos de Transporte
 *  - Oscilaciones, Acústica y Ondas
 *  - Termodinámica y Mecánica Estadística
 *  - Electrostática, Circuitos y Electromagnetismo
 *  - Óptica Geométrica y Ondulatoria
 *  - Relatividad Especial y General
 *  - Física Cuántica y Estructura Atómica
 *  - Ciencia de Materiales, Física del Estado Sólido, Grafeno y Nitruro de Boro (hBN)
 *  - Física Nuclear y Partículas Elementales
 *  - Astrofísica, Cosmología y Experimentos Históricos Cruciales
 * 
 * Cada pregunta incluye: id, area, subtema, nivel, dificultad, pregunta, 4 opciones normalizadas, correcta y explicación pedagógica.
 */

window.TRIVIA_QUESTIONS = ${JSON.stringify(standardized, null, 2)};

console.log('✓ Banco de Gran Trivia de Física cargado: ' + window.TRIVIA_QUESTIONS.length + ' preguntas únicas y diversificadas.');
`;

const outputPath = path.join(__dirname, '../web/trivia-questions.js');
fs.writeFileSync(outputPath, fileHeader, 'utf8');
console.log(`✅ Successfully wrote ${standardized.length} questions to ${outputPath}`);
