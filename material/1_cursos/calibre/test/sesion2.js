(async()=>{const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
LAB.mostrar('entrenador'); await sleep(200);
LAB.ST_set(s=>{s.ent.instrId='m001';}); LAB.entNueva();
document.getElementById('entInstr').value='m001';
document.getElementById('entAyuda').checked=true;
await sleep(100); LAB.entNueva();
return 'ok';})()
