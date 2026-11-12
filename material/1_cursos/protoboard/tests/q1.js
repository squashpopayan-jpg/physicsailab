global.window = global; global.EM = { si: (x, u) => Number(x).toPrecision(3) + ' ' + (u || '') };
['30-spice','31-spice-ac','32-models','33-parts','34-net','35-labparts','36-bb','37-bench'].forEach((f) => require('../src/core/' + f + '.js'));
const mk = (r) => { const b = new EM.Bench({ boards: ['half'] }); b.loadSpec({ parts: [['B1','BATP',{kind:'alk9'},'B+1','B-1'], ...(r ? [['R1','R',{r},'e5','e9']] : []), ['D1','LED',{color:'rojo'}, r?'d9':'a5','d12']], wires: r ? [['a5','B+2'],['a12','B-2']] : [['a5','B+2'],['a12','B-2']] }); b.rebuild(); return b; };
for (const r of [330, 470, 1000, 4700]) { const b = mk(r); console.log(r, (b.iPart('D1') * 1000).toFixed(2), 'mA  Vled', b.vPart('D1').toFixed(3)); }
const b = mk(0); console.log('sin R', b.iPart('D1'), b.vPart('D1'));
for (let k = 0; k < 40 && !b.part('D1').dead; k++) b.frame(0.05);
console.log('LED dead', JSON.stringify(b.part('D1').dead));
