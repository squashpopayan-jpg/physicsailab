global.window = global; global.EM = { si: (x, u) => x + (u||''), el: ()=>({}) };
['30-spice','31-spice-ac','32-models','33-parts','34-net','38-cx'].forEach(f=>require('../src/core/'+f+'.js'));
for (const open of [false,true]) {
  const net=new EM.Net({damage:false}); net.load(EM.Net.fromSpec(EM.cx.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 12 } }, items: [{ id: 'L1', t: 'L', p: { l: 1e-4, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'VR1', t: 'VAR', p: { vn: 18, alpha: 25, ej: 100 }, mode: 'shunt' }, { id: 'RL', t: 'R', p: { r: 120, watt: 5 }, mode: 'shunt', tap: 'carga' }, { id: 'I1', t: 'IDC', p: { i: 2, mode: 'pulse', f: 10000, duty: 0.1 }, mode: 'shunt', rot: 0 }] })));
  if (open) net.part('VR1').fault={kind:'open'};
  net.rebuild(); net.cir.solveDC(); let mx=-1e9,mn=1e9;
  for(let k=0;k<3000;k++){ net.step(2e-7); if(k>1000){const v=net.v(net.netInfo.labelNet.carga); mx=Math.max(mx,v); mn=Math.min(mn,v);} }
  console.log(open?'sin MOV':'con MOV', mx.toFixed(1), mn.toFixed(1));
}
