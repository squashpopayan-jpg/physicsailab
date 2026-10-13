global.window={EM:{M:{bisect(f,a,b,tol=1e-12){let fa=f(a);for(let i=0;i<200;i++){const m=(a+b)/2,fm=f(m);if(fa*fm<=0)b=m;else{a=m;fa=fm}}return (a+b)/2}},draw:{}}};
require('../src/core/30-waves.js');
const EM=window.EM;
console.log(EM.besselJn(0,2.404825557695773), EM.besselJn(1,10), EM.besselJn(0,20), EM.besselJn(3,25));
console.log(EM.besselZeros(0,4), EM.besselZeros(1,3), EM.besselZeros(2,2));
