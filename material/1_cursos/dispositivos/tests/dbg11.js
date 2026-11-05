global.window = global; global.EM = { si: (x, u) => x + (u||''), el: ()=>({}) };
['30-spice','31-spice-ac','32-models','33-parts','34-net','38-cx'].forEach(f=>require('../src/core/'+f+'.js'));
const vd=(model,I,Ta)=>{ const net=new EM.Net({Ta,damage:false}); net.load(EM.Net.fromSpec(EM.cx.ladder({src:{id:'I1',t:'IDC',p:{i:I}},items:[{id:'D1',t:'D',p:{model},mode:'shunt',tap:'out'}]}))); net.rebuild(); net.cir.solveDC(); return net.v(net.netInfo.labelNet.out); };
for (const m of ['1N4148','1N4007','1N5819']) for (const I of [1e-3,1e-5]) { const a=vd(m,I,25),b=vd(m,I,125); console.log(m,I,'V25',a.toFixed(4),'V125',b.toFixed(4),'slope mV/K',((b-a)/100*1000).toFixed(2)); }
