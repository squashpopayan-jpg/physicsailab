const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../web/trivia-squash-questions.js');
let code = fs.readFileSync(filePath, 'utf8');

// Load window.TRIVIA_SQUASH_QUESTIONS
global.window = {};
eval(code);
const questions = window.TRIVIA_SQUASH_QUESTIONS;

console.log('Total questions loaded:', questions.length);

const letters = ['A. ', 'B. ', 'C. ', 'D. '];

questions.forEach((q, idx) => {
  q.opciones = q.opciones.map((opt, oidx) => {
    const clean = opt.replace(/^[A-D][\.\)]\s*/, '').trim();
    return `${letters[oidx]}${clean}`;
  });
});

const output = `/**
 * BANCO OFICIAL DE PREGUNTAS: LA GRAN TRIVIA DE SQUASH
 * Plataforma Universitaria PhysicsAILab
 * 
 * Contenido: ${questions.length} preguntas únicas y estructuradas sobre squash profesional:
 *  - Reglamento Oficial WSF y Arbitraje
 *  - Física, Termodinámica y Rebote de la Pelota
 *  - Geometría, Dimensiones y Especificaciones de la Cancha
 *  - Técnica de Golpeo, Biomecánica y Cadenas Cinéticas
 *  - Estrategia, Táctica y Control de la T
 *  - Equipamiento: Raquetas, Cuerdas, Grip y Calzado
 *  - Leyendas, Campeones Mundiales y Récords Históricos
 *  - Squash Colombiano y Sudamericano
 *  - Historia, Origen, PSA World Tour y Juegos Olímpicos LA28
 *  - Fisiología, Entrenamiento (Ghosting), Condición Física y Nutrición
 */

window.TRIVIA_SQUASH_QUESTIONS = ${JSON.stringify(questions, null, 2)};

console.log('✓ Banco de Gran Trivia de Squash cargado: ' + window.TRIVIA_SQUASH_QUESTIONS.length + ' preguntas.');
`;

fs.writeFileSync(filePath, output, 'utf8');
console.log('✅ Standardized options in web/trivia-squash-questions.js successfully.');
