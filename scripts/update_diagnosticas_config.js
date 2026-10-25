const fs = require('fs');
const path = require('path');

const configContent = `/* Configuración de Pruebas Diagnósticas para PhysicsAILab */
window.CONFIG = {
  marca: 'Pruebas Diagnósticas',
  autor: 'Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca',
  contacto: 'manuelobando@unicauca.edu.co',
  whatsapp: '573137115473',
  urlSitio: 'https://physicsailab.com/material/1_cursos/diagnosticas/dist/public',
  firebase: {
    apiKey: 'AIzaSyD98yDnsc9WmkFCCT8y2rlR3_g0ceWNq4Q',
    authDomain: 'squashpopayan-65e33.firebaseapp.com',
    databaseURL: 'https://squashpopayan-65e33-default-rtdb.firebaseio.com',
    projectId: 'squashpopayan-65e33',
    appId: '1:549301287103:web:physicsailab'
  }
};
`;

const configPaths = [
  'material/1_cursos/diagnosticas/dist/public/config.js',
  'material/1_cursos/diagnosticas/src/app/config.js'
];

configPaths.forEach(p => {
  const fullPath = path.resolve(__dirname, '..', p);
  fs.writeFileSync(fullPath, configContent, 'utf8');
  console.log('Updated config:', p);
});
