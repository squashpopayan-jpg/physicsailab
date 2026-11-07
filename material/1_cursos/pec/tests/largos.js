const fs=require('fs'),vm=require('vm');const path=require('path');
const dir=path.join(__dirname,'..','src','data');
const sb={window:{}};vm.createContext(sb);
fs.readdirSync(dir).sort().forEach(f=>vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),sb));
const Q=sb.window.PEC.Q;const all=[];
for(const[k,v]of Object.entries(Q.checks))all.push([k,v]);
for(const[k,l]of Object.entries(Q.quiz))l.forEach((v,i)=>all.push([k+'#'+(i+1),v]));
Q.exam.forEach((v,i)=>all.push(['ex#'+(i+1),v]));
let n=0,big=0;
for(const[k,v]of all){const m=v.no.reduce((s,x)=>s+x.length,0)/3;const mx=Math.max(...v.no.map(x=>x.length));const r=v.ok.length/m;if(v.ok.length>mx)n++;if(r>1.4){big++;console.log(k,r.toFixed(2),'ok='+v.ok.length,'no='+v.no.map(x=>x.length).join('/'),'|',v.ok);}}
console.log('longest',n,'/',all.length,'ratio>1.4:',big);
