const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../web/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Add course object to ALL_COURSES
const targetCourse = `{ id: 'diagnosticas', name: 'Servicio de Pruebas Diagnósticas (Colegios & Univ.)', icon: '📊', defaultKey: 'DIAGNOSTICAS-2026', cat: 'Evaluación Institucional', desc: '450 preguntas validadas en 9 bancos, supervisión en vivo e informes.' }`;

const newCourses = `{ id: 'diagnosticas', name: 'Servicio de Pruebas Diagnósticas (Colegios & Univ.)', icon: '📊', defaultKey: 'DIAGNOSTICAS-2026', cat: 'Evaluación Institucional', desc: '450 preguntas validadas en 9 bancos, supervisión en vivo e informes.' },\n            { id: 'squash_arbitraje', name: 'Manu_Squash Arbitraje (WSF & Simulador)', icon: '⚖️', defaultKey: 'ARBITRAJE-2026', cat: 'Física del Deporte & Arbitraje', desc: 'Simulador 3D/2D, árbol de interferencias WSF, reglas 1-15 y planilla de marcador en vivo.' }`;

html = html.replace(/\r\n/g, '\n');
html = html.replace(targetCourse, newCourses);

// 2. Update numbers 24 to 25 where appropriate
html = html.replace('24 Cursos y Laboratorios Virtuales de la Plataforma', '25 Cursos y Laboratorios Virtuales de la Plataforma');
html = html.replace('Claves Vigentes de Acceso a Simuladores & Cursos (24 Materias)', 'Claves Vigentes de Acceso a Simuladores & Cursos (25 Materias)');
html = html.replace('Filtrar entre los 24 cursos y laboratorios...', 'Filtrar entre los 25 cursos y laboratorios...');
html = html.replace('>24</strong> cursos configurados', '>25</strong> cursos configurados');
html = html.replace('<!-- Se llena dinámicamente con los 24 cursos -->', '<!-- Se llena dinámicamente con los 25 cursos -->');
html = html.replace('<!-- Opciones de los 24 cursos inyectadas dinámicamente -->', '<!-- Opciones de los 25 cursos inyectadas dinámicamente -->');
html = html.replace('Claves Mensuales de Acceso a Todos los 24 Cursos', 'Claves Mensuales de Acceso a Todos los 25 Cursos');

fs.writeFileSync(adminPath, html, 'utf8');
console.log('✅ Successfully updated web/admin.html with squash_arbitraje in ALL_COURSES.');
