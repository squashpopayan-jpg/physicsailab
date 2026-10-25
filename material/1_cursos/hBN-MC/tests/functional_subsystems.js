'use strict';
const assert = require('assert');
const {sandbox,windowObj,evalIn} = require('./smoke_full_app.js');

function run(src){ return evalIn(src); }

// 1) Importadores
const xyz=`3\nXYZ sample\nB 0 0 0\nN 1.42 0 0\nC 0.71 1.23 0`;
const xyzOut=run(`parseXYZ(${JSON.stringify(xyz)})`);
assert.equal(xyzOut.atoms.length,3); assert.deepEqual(xyzOut.atoms.map(a=>a.symbol),['B','N','C']);

const poscar=`hBN\n1.0\n2.84 0 0\n0 2.46 0\n0 0 20\nB N\n1 1\nCartesian\n0 0 0\n1.42 0 0`;
const posOut=run(`parsePOSCAR(${JSON.stringify(poscar)})`);
assert.equal(posOut.atoms.length,2); assert.deepEqual(posOut.atoms.map(a=>a.symbol),['B','N']);

const xv=`4.723600 0 0 0 0 0\n0 4.723600 0 0 0 0\n0 0 18.897300 0 0 0\n4\n1 5 0 0 0 0 0 0\n2 7 2.683 0 0 0 0 0\n3 6 1.3415 2.323 0 0 0 0\n1 5 4.0245 2.323 0 0 0 0`;
const xvOut=run(`parseSIESTAXV(${JSON.stringify(xv)})`);
assert.deepEqual(xvOut.atoms.map(a=>a.symbol),['B','N','C','B']);
assert(Math.abs(xvOut.atoms[1].x-1.4198)<0.002);

const lmpData=`sample\n\n3 atoms\n3 atom types\n\n0 10 xlo xhi\n0 10 ylo yhi\n0 20 zlo zhi\n\nMasses\n\n1 10.81 # B\n2 14.007 # N\n3 12.011 # C\n\nAtoms\n\n1 1 0.0 0.0 0.0\n2 2 1.42 0.0 0.0\n3 3 0.71 1.23 0.0\n`;
const ldOut=run(`parseLAMMPSData(${JSON.stringify(lmpData)})`);
assert.equal(ldOut.atoms.length,3); assert.deepEqual(ldOut.atoms.map(a=>a.symbol),['B','N','C']);

const lmpDump=`ITEM: TIMESTEP\n0\nITEM: NUMBER OF ATOMS\n3\nITEM: BOX BOUNDS pp pp pp\n0 10\n0 10\n0 20\nITEM: ATOMS id type x y z\n1 1 0 0 0\n2 2 1.42 0 0\n3 3 0.71 1.23 0\n`;
const dumpOut=run(`parseLAMMPSDump(${JSON.stringify(lmpDump)})`);
assert.equal(dumpOut.atoms.length,3); assert.deepEqual(dumpOut.atoms.map(a=>a.symbol),['B','N','C']);

// 2) Estadística batch
const st=run('batchStats([1,2,3,4,5])');
assert.equal(st.n,5); assert.equal(st.mean,3); assert(Math.abs(st.ci95-1.9629284245738559)<1e-12);

// 3) Regla PBC (paridad de dimensiones periódicas)
const pbc=run("normalizePeriodicGridDimensions(9,7,'AC',true,true)");
assert.equal(pbc.nx%2,0); assert.equal(pbc.ny%2,0); assert.equal(pbc.changed,true);
const open=run("normalizePeriodicGridDimensions(9,7,'AC',false,false)");
assert.equal(open.nx,9); assert.equal(open.ny,7); assert.equal(open.changed,false);

// 4) Exportadores textuales y versión de release
const pl=run('buildPOSCARLines()');
assert(pl[0].includes('v'+evalIn('HBN_VERSION'))); assert(pl.some(x=>x.trim()==='Direct'));
const ll=run('buildLAMMPSDataLines()');
assert(ll[0].includes('v'+evalIn('HBN_VERSION'))); assert(ll.some(x=>/atoms$/.test(x.trim())));

// 5) Constructor hBN/C
const structure=windowObj.HBNCBandGenerator.generateAlternatingBands({widthCells:4,heightCells:4});
assert(structure.validation.ok===true); assert.equal(structure.counts.B,16); assert.equal(structure.counts.N,16);
assert(structure.atoms.length>0); assert(structure.bonds.length>0);

// 6) i18n
const lang0=run('curLang'); run('toggleLang()'); const lang1=run('curLang'); run('toggleLang()'); const lang2=run('curLang');
assert.notEqual(lang0,lang1); assert.equal(lang0,lang2); assert.equal(typeof run("t('btn_start')"),'string');

// 7) Fallback 3D: debe inicializar y dibujar sin Three.js.
run('init3DFallback()');
assert(windowObj._3dFallback); run('draw3DFallback()');

// 8) RNG de vacancias manuales: misma semilla => mismo patrón.
function vacancyPattern(seed){
  run(`setRandomSeed(${seed});`);
  run("document.getElementById('iVac').value='10'; init(); applyRandomVacancies();");
  return run('Array.from(G)').join(',');
}
const v1=vacancyPattern(123456); const v2=vacancyPattern(123456); const v3=vacancyPattern(654321);
assert.equal(v1,v2); assert.notEqual(v1,v3);

console.log(JSON.stringify({
  ok:true,
  importers:['XYZ','POSCAR','SIESTA XV','LAMMPS DATA','LAMMPS DUMP'],
  batchStats:true,pbc:true,exports:true,structureGenerator:true,i18n:true,viewerFallback:true,manualVacancyRng:true
},null,2));
