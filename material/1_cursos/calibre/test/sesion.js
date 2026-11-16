(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);
  function anota(instr, obj, attr, pos, ang, metodo, apreta) {
    LAB.ST_set(s => { s.instrId = instr; s.objId = obj; s.attrId = attr || ''; s.pos = pos; s.angDeg = ang; s.metodo = metodo || 'trinquete'; });
    LAB.u = 0; // reinicia
    const m0 = LAB.medir();
    LAB.u = m0.kind === 'int' || m0.kind === 'prof' ? m0.S + (apreta || 0.3) : m0.S - (apreta === undefined ? 0.3 : apreta);
    if (obj === 'cero') LAB.u = -0.5;
    const m = LAB.medir();
    const I = m.I, L = METRO.lectura(I, m.p);
    $('inpLect').value = String(L.valor).replace('.', ',');
    $('selUn').value = I.unidad;
    $('formLect').dispatchEvent(new Event('submit', { cancelable: true }));
  }
  for (const ins of ['v002', 'm010']) {
    anota(ins, 'cero', '', 0.5, 0);
    anota(ins, 'p25', 'L', 0.5, 0);
  }
  [[0.1,0],[0.3,40],[0.5,90],[0.7,130],[0.9,170]].forEach(([p,a]) => { anota('m010','cil','D',p,a); anota('v002','cil','L',p,a); anota('m010','esfera','D',p,a); });
  [[0.1,0],[0.5,90],[0.9,170]].forEach(([p,a]) => { anota('m010','varilla','D',p,a); anota('v002','laton','a',p,a); anota('v002','laton','b',p,a); anota('v002','laton','c',p,a); anota('m010','oring','d',p,a,'trinquete'); anota('m010','oring','d',p,a,'tambor',0.1); });
  anota('v002','arandela','Di',0.5,0); 
  document.getElementById('selDens').value='esfera';
  LAB.mostrar('cuaderno');
  await sleep(300);
  return LAB.ST.filas.length + ' filas; ok=' + LAB.ST.filas.filter(f => f.ok).length;
})()
