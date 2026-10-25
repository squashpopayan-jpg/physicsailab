'use strict';
const {run}=require('./harness.js');
const result=run(`(()=>{
  let fail=0, directedEdges=0, cases=0, normalized=0;
  for(let nx=2;nx<=12;nx++) for(let ny=2;ny<=12;ny++)
    for(const orient of ['AC','ZZ']) for(const [px,py] of [[1,0],[0,1],[1,1]]){
      const d=normalizePeriodicGridDimensions(nx,ny,orient,!!px,!!py);
      if(d.changed) normalized++;
      Nx=d.nx; Ny=d.ny; latticeOrient=orient; pbcX=!!px; pbcY=!!py;
      buildGrid(1,0,4); buildPhysNB(); cases++;
      for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
        const k=idx(i,j);
        for(const [ni,nj] of PNB[k]){
          directedEdges++;
          const nk=idx(ni,nj);
          let reciprocal=false;
          for(const [ri,rj] of PNB[nk]) if(idx(ri,rj)===k){reciprocal=true;break;}
          if(!reciprocal) fail++;
        }
      }
    }
  return {cases,directedEdges,normalized,fail};
})()`);
if(result.fail!==0){console.error(result);process.exit(1);}
console.log(JSON.stringify({ok:true,...result},null,2));
