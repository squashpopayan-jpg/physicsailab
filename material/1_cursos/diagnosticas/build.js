/* Compila las pruebas diagnósticas.
     dist/public/          sitio web (Firebase Hosting). NO contiene preguntas ni claves.
     dist/bancos/<id>.json banco compilado (preguntas + clave). Es PRIVADO: el docente lo carga desde el panel
                           y queda en la base de datos con acceso solo de administrador.
   Uso: node build.js */
'use strict';
var fs = require('fs'), path = require('path');
var A = require('./src/app/analisis');
var HERE = __dirname, SRC = path.join(HERE, 'src'), OUT = path.join(HERE, 'dist');

function compilarBanco(b) {
  var rnd = A.rng('banco:' + b.id + ':' + b.version), clave = {}, preguntas = [];
  b.preguntas.forEach(function (q) {
    var ops = [{ t: q.ok, err: null }].concat(q.mal.map(function (m) { return { t: m[0], err: m[1] }; }));
    ops = q.num ? ops.slice().sort(function (x, y) { return A.valorOpcion(x.t) - A.valorOpcion(y.t); }) : A.barajar(ops, rnd);
    var r = ops.findIndex(function (o) { return o.err === null; });
    preguntas.push({ id: q.id, tema: q.tema, nivel: q.nivel, txt: q.txt, fig: q.fig || null, ops: ops.map(function (o) { return o.t; }), fijo: q.orden === 'fijo' });
    clave[q.id] = { r: r, err: ops.map(function (o) { return o.err; }), exp: q.exp, dif: q.dif };
  });
  var temas = {};
  Object.keys(b.temas).forEach(function (t) { temas[t] = b.temas[t]; });
  return {
    meta: { id: b.id, titulo: b.titulo, publico: b.publico, version: b.version, duracionMin: b.duracionMin, n: preguntas.length, compilado: new Date().toISOString().slice(0, 10) },
    publico: { titulo: b.titulo, instrucciones: b.instrucciones, temas: temas, preguntas: preguntas },
    clave: clave,
    errores: b.errores
  };
}

function copiarDir(de, a) {
  fs.mkdirSync(a, { recursive: true });
  fs.readdirSync(de).forEach(function (f) {
    var s = path.join(de, f), d = path.join(a, f);
    if (fs.statSync(s).isDirectory()) copiarDir(s, d); else fs.copyFileSync(s, d);
  });
}

/* Informe y boletín de ejemplo para la página principal: estudiantes simulados y sin enunciados. */
function ejemplos(banco) {
  var INF = require('./src/app/informe'), SIM = require('./tools/simulador');
  var sims = SIM.generar(banco, 36, { semilla: 'demo', media: -0.2, errGrupo: ['normal_peso', 'fuerza_mov', 'presion_forma'], debilTema: { ele: -0.9, din: -0.5 } });
  var calc = INF.calcular(banco, sims, null);
  var info = { institucion: 'Institución Educativa de Ejemplo', grupo: 'Grado 11-A', nombre: 'Diagnóstico de ingreso', abiertaEn: Date.UTC(2026, 9, 20, 13), duracionMin: 90 };
  var rep = INF.construirInforme(banco, info, calc, { sinTextos: true });
  rep.ranking.forEach(function (r) { r.doc = ''; });
  var e = calc.presentaron.slice().sort(function (a, b) { return Math.abs(a.cal.puntaje - 55) - Math.abs(b.cal.puntaje - 55); })[0];
  var bol = INF.construirBoletin(banco, info, e, calc, { ranking: true });
  fs.writeFileSync(path.join(OUT, 'public', 'demo-informe.json'), JSON.stringify(rep));
  fs.writeFileSync(path.join(OUT, 'public', 'demo-boletin.json'), JSON.stringify(bol));
}

/* Agrega ?v=<huella> a los .js y .css locales de cada página: tras actualizar el sitio,
   ningún navegador se queda con una versión vieja en caché. */
function versionar(dir) {
  var crypto = require('crypto');
  fs.readdirSync(dir).filter(function (f) { return /\.html$/.test(f); }).forEach(function (f) {
    var p = path.join(dir, f), h = fs.readFileSync(p, 'utf8');
    h = h.replace(/(src|href)="([\w-]+\.(?:js|css))"/g, function (m, attr, archivo) {
      var huella = crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, archivo))).digest('hex').slice(0, 10);
      return attr + '="' + archivo + '?v=' + huella + '"';
    });
    fs.writeFileSync(p, h);
  });
}

function main() {
  fs.rmSync(path.join(OUT, 'public'), { recursive: true, force: true });
  copiarDir(path.join(SRC, 'app'), path.join(OUT, 'public'));
  versionar(path.join(OUT, 'public'));
  fs.mkdirSync(path.join(OUT, 'bancos'), { recursive: true });
  var catalogo = [];
  fs.readdirSync(path.join(SRC, 'bancos')).filter(function (f) { return /\.js$/.test(f); }).forEach(function (f) {
    var mod = path.join(SRC, 'bancos', f);
    delete require.cache[require.resolve(mod)];
    var c = compilarBanco(require(mod));
    fs.writeFileSync(path.join(OUT, 'bancos', c.meta.id + '.json'), JSON.stringify(c));
    catalogo.push(c.meta);
    if (c.meta.id === 'fisica-fundamental') ejemplos(c);
    console.log('banco', c.meta.id, c.meta.n, 'preguntas');
  });
  console.log('sitio en', path.join(OUT, 'public'));
}
if (require.main === module) main();
module.exports = { compilarBanco: compilarBanco };
