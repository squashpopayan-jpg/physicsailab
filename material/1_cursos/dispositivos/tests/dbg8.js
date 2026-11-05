global.window = global; global.EM = { si: (x, u) => x + (u||'') };
['30-spice','31-spice-ac','32-models','33-parts','34-net'].forEach(f=>require('../src/core/'+f+'.js'));
const run = (C, par) => {
  const net = new EM.Net({ par });
  net.load(EM.Net.fromSpec({
    parts: [['V1','VDC',4,8,0,{v:5}],['L1','L',10,6,0,{l:1e-6,kind:'air'}],['C1','C',16,8,1,{c:C,kind:'ceramic'}],['I1','IDC',22,8,0,{i:0.2,mode:'sin',f:2e6}]],
    wires:[['V1.0',[4,6],'L1.0'],['L1.1','C1.0'],['C1.0',[22,6],'I1.0'],[[4,10],[22,10]],['V1.1','gnd'],['C1.1',[16,10]],['I1.1',[22,10]]]
  }));
  net.rebuild(); net.cir.solveDC();
  const dt = 2e-9; let mn=1e9,mx=-1e9;
  for (let k=0;k<4000;k++){ net.step(dt); if(k>2000){ const v=net.v(net.netInfo.pinNet.C1[0]); mn=Math.min(mn,v); mx=Math.max(mx,v);} }
  return [mn,mx,mx-mn];
};
console.log('sin C', run(1e-12,false), 'con 100nF', run(1e-7,false), 'con 100nF+par', run(1e-7,true), '10uF', run(1e-5,true));
