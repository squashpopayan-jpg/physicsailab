global.window = global; global.EM = { si: (x, u) => x + (u||''), el: ()=>({}) };
['30-spice','31-spice-ac','32-models','33-parts','34-net','38-cx'].forEach(f=>require('../src/core/'+f+'.js'));
for (const vb of [0.3,0.6,0.65,0.7,0.75,0.8,1,2,5]) { const net=new EM.Net({damage:false}); net.load(EM.Net.fromSpec(EM.cx.ce({vb}))); net.rebuild(); net.cir.solveDC(); const q=net.rt.Q1.ref.main; console.log(vb,'IB',(q.ib*1e6).toFixed(2),'uA IC',(q.ic*1e3).toFixed(3),'mA VBE',q.vbe.toFixed(3),'VCE',q.vce.toFixed(3),'beta',(q.ic/q.ib).toFixed(0)); }
