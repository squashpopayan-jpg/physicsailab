(async()=>{const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
// entrenador: respuesta correcta e incorrecta
LAB.mostrar('entrenador'); await sleep(200); LAB.entNueva();
const I=METRO.instr(LAB.ST.ent.instrId), q=LAB.ENT().q, L=METRO.lectura(I,q.pMM);
const $=id=>document.getElementById(id);
$('entInp').value='99'; $('entForm').dispatchEvent(new Event('submit',{cancelable:true}));
const r1=$('entFb').className;
$('entInp').value=String(L.valor).replace('.',','); $('entForm').dispatchEvent(new Event('submit',{cancelable:true}));
const r2=$('entFb').className;
LAB.ST_set(s=>{s.banco=7;});
// 
document.getElementById('docClave').value='calibre-unicauca';
LAB.mostrar('docente');
$('docForm').dispatchEvent(new Event('submit',{cancelable:true}));
await sleep(300);
return [r1,r2,LAB.ST.ent.ok+'/'+LAB.ST.ent.total, document.querySelectorAll('#docBody table').length+' tablas'];})()
