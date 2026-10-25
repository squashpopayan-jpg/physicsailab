/* Estudiantes simulados para pruebas y para el informe de ejemplo.
   Modelo: cada estudiante tiene una habilidad θ, un ajuste por tema y algunos errores conceptuales "activos".
   P(acierto) = logística(θ + ajusteTema − b), con b según la dificultad del ítem.
   Si falla, elige con más probabilidad el distractor asociado a uno de sus errores activos. */
'use strict';
var A = require('../src/app/analisis');
var NOMBRES = ['Ana', 'Juan', 'María', 'Carlos', 'Laura', 'Andrés', 'Valentina', 'Santiago', 'Camila', 'Daniel', 'Sofía', 'Felipe', 'Isabela', 'Mateo', 'Daniela', 'Sebastián', 'Paula', 'Nicolás', 'Juliana', 'David', 'Mariana', 'Alejandro', 'Natalia', 'Samuel', 'Sara', 'Tomás', 'Gabriela', 'Diego', 'Luciana', 'Esteban'];
var APELLIDOS = ['Gómez', 'Muñoz', 'Rodríguez', 'López', 'Martínez', 'Ordóñez', 'Pérez', 'Castillo', 'Bolaños', 'Zúñiga', 'Hurtado', 'Velasco', 'Chaves', 'Mosquera', 'Rivera', 'Cerón', 'Paz', 'Díaz', 'Vivas', 'Imbachí'];
var B_DIF = { 1: -1.0, 2: 0.1, 3: 1.0 };

function normal(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); }

/* opc: {semilla, media, errGrupo:[ids de errores muy comunes en el grupo], debilTema:{tema: ajuste}} */
function generar(banco, n, opc) {
  opc = opc || {};
  var rnd = A.rng(opc.semilla || 'sim'), temas = Object.keys(banco.publico.temas);
  var errores = Object.keys(banco.errores).filter(function (e) { return e !== 'otro'; });
  var out = [];
  for (var i = 0; i < n; i++) {
    var theta = (opc.media || 0) + normal(rnd) * (opc.desv || 1), ajuste = {}, activos = {};
    temas.forEach(function (t) { ajuste[t] = normal(rnd) * 0.5 + ((opc.debilTema || {})[t] || 0); });
    errores.forEach(function (e) { if (rnd() < 0.12) activos[e] = 1; });
    (opc.errGrupo || []).forEach(function (e) { if (rnd() < 0.7) activos[e] = 1; });
    var resp = {}, omite = opc.omision || 0;
    banco.publico.preguntas.forEach(function (q) {
      if (rnd() < omite) return;
      var k = banco.clave[q.id], pr = 1 / (1 + Math.exp(-(theta + ajuste[q.tema] - B_DIF[k.dif] + 0.3)));
      var tieneErr = k.err.some(function (e) { return e && activos[e]; });
      if (tieneErr) pr *= 0.45;
      if (rnd() < pr) { resp[q.id] = k.r; return; }
      var pesos = k.err.map(function (e, j) { return j === k.r ? 0 : (activos[e] ? 6 : 1); });
      var tot = pesos.reduce(function (a, b) { return a + b; }, 0), x = rnd() * tot;
      for (var j = 0; j < pesos.length; j++) { x -= pesos[j]; if (x <= 0 && pesos[j]) { resp[q.id] = j; break; } }
      if (!(q.id in resp)) resp[q.id] = (k.r + 1) % q.ops.length;
    });
    var nom = NOMBRES[Math.floor(rnd() * NOMBRES.length)] + ' ' + APELLIDOS[Math.floor(rnd() * APELLIDOS.length)] + ' ' + APELLIDOS[Math.floor(rnd() * APELLIDOS.length)];
    out.push({ code: 'SIM' + ('0000' + i).slice(-5), nombre: nom, doc: String(1061000000 + Math.floor(rnd() * 900000)), correo: 'estudiante' + (i + 1) + '@ejemplo.edu.co',
      theta: theta, activos: activos, resp: resp, inicio: 1, entregado: 1 + Math.round((45 + rnd() * 40) * 60000), salidas: rnd() < 0.1 ? Math.floor(rnd() * 5) : 0 });
  }
  return out;
}
module.exports = { generar: generar };
