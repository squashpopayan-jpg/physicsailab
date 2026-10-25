'use strict';
/**
 * Smoke test de integración para hBN-MC.
 * Carga todos los scripts en el orden de index.html dentro de un DOM mínimo,
 * dispara DOMContentLoaded/load y verifica que la inicialización principal no falle.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function decode(s=''){
  return s.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'");
}

// Obtiene IDs y valores iniciales declarados en el HTML real.
const defaults = new Map();
for(const m of html.matchAll(/<([a-zA-Z0-9]+)([^>]*\sid="([^"]+)"[^>]*)>/g)){
  const attrs=m[2], id=m[3];
  const vmv=/\svalue="([^"]*)"/.exec(attrs);
  const checked=/\schecked(?:\s|>|=)/.test(attrs);
  defaults.set(id,{value:vmv?decode(vmv[1]):'',checked});
}

const listeners={window:{},document:{}};
const elements=new Map();

function eventTarget(obj){
  obj._listeners={};
  obj.addEventListener=function(type,fn){(this._listeners[type]??=[]).push(fn);};
  obj.removeEventListener=function(type,fn){if(this._listeners[type])this._listeners[type]=this._listeners[type].filter(x=>x!==fn);};
  obj.dispatchEvent=function(ev){for(const fn of this._listeners[ev.type]||[]) fn.call(this,ev); return true;};
  return obj;
}

function makeGradient(){ return {addColorStop(){}}; }
function makeCtx(){
  const base={
    canvas:null,
    measureText(txt){return {width:String(txt??'').length*7};},
    createLinearGradient(){return makeGradient();},
    createRadialGradient(){return makeGradient();},
    createPattern(){return {};},
    getImageData(){return {data:new Uint8ClampedArray(4)};},
    setLineDash(){},
  };
  return new Proxy(base,{get(t,p){if(p in t)return t[p]; return ()=>{};},set(t,p,v){t[p]=v;return true;}});
}

function makeClassList(){
  const s=new Set();
  return {add(...x){x.forEach(v=>s.add(v));},remove(...x){x.forEach(v=>s.delete(v));},toggle(x,force){if(force===true){s.add(x);return true;}if(force===false){s.delete(x);return false;}if(s.has(x)){s.delete(x);return false;}s.add(x);return true;},contains(x){return s.has(x);}};
}

function makeElement(id='',tag='div'){
  if(id && elements.has(id)) return elements.get(id);
  const d=defaults.get(id)||{};
  const el=eventTarget({
    id,tagName:String(tag).toUpperCase(),value:d.value??'',checked:!!d.checked,disabled:false,
    min:'0',max:'100',step:'1',type:'',textContent:'',innerHTML:'',title:'',href:'',download:'',
    width:800,height:600,clientWidth:800,clientHeight:600,offsetWidth:800,offsetHeight:600,
    style:{display:'',width:'',height:'',cssText:''},dataset:{},classList:makeClassList(),
    children:[],parentElement:null,options:[],selectedIndex:0,files:[],
    appendChild(ch){if(ch){this.children.push(ch);ch.parentElement=this;}return ch;},
    prepend(ch){if(ch){this.children.unshift(ch);ch.parentElement=this;}return ch;},
    removeChild(ch){this.children=this.children.filter(x=>x!==ch);},remove(){},replaceChildren(...ch){this.children=[...ch];},
    setAttribute(k,v){this[k]=String(v);},getAttribute(k){return this[k]??null;},removeAttribute(k){delete this[k];},
    querySelector(){return null;},querySelectorAll(){return [];},closest(){return null;},
    getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight,right:this.clientWidth,bottom:this.clientHeight};},
    focus(){},blur(){},click(){if(typeof this.onclick==='function')this.onclick({target:this,preventDefault(){}});},
    getContext(type){if(type!=='2d')return null; if(!this._ctx){this._ctx=makeCtx();this._ctx.canvas=this;}return this._ctx;},
    toBlob(cb,type){cb(new Blob(['png'],{type:type||'image/png'}));},
    toDataURL(){return 'data:image/png;base64,';},
    captureStream(){return {getTracks(){return [];}};},
  });
  if(id) elements.set(id,el);
  return el;
}

// Precrear todos los elementos del HTML.
for(const id of defaults.keys()) makeElement(id);

// Valores importantes para una inicialización física válida.
const forceVals={
  iNx:'16',iNy:'16',iTi:'5000',iTf:'500',iSt:'5000',iH:'1',iVac:'0',iPsz:'4',iSpd:'turbo',
  iPore:'1',iPBC:'XY',iGlobal:'0',iCarb:'0',iFw:'4',iFp:'50',iFt:'ac',iWx:'8',iWy:'8',iWpos:'25',
  iHHK:'35',iHHD:'1.2',iHHMode:'max',iNruns:'3',iTmode:'anneal',iOvl:'off',iHRes:'tesis',iMuH:'0',
  iChemEnv:'Nrich',iDmuHForm:'0',iMuBNRef:'model'
};
for(const [id,v] of Object.entries(forceVals)) makeElement(id).value=v;
makeElement('cv','canvas').width=1000; makeElement('cv').height=700;
makeElement('cv3','canvas').width=900; makeElement('cv3').height=650;

const document=eventTarget({
  readyState:'complete',
  body:makeElement('body','body'),head:makeElement('head','head'),documentElement:makeElement('html','html'),
  getElementById(id){return makeElement(id);},
  querySelector(sel){
    if(sel==='script[data-jszip-loader]'||sel==='script[data-three-loader]') return null;
    if(sel.startsWith('#')) return makeElement(sel.slice(1));
    return null;
  },
  querySelectorAll(sel){
    if(sel==='[data-i18n]') return [];
    return [];
  },
  createElement(tag){return makeElement('',tag);},
  createElementNS(ns,tag){return makeElement('',tag);},
});

const winEvents={};
const windowObj=eventTarget({
  innerWidth:1400,innerHeight:900,devicePixelRatio:1,
  scrollX:0,scrollY:0,
  open(){return null;},
});

let timerId=0;
function immediateTimeout(fn){const id=++timerId; if(typeof fn==='function') fn(); return id;}

class FakeFileReader extends class {} {
  readAsText(){ if(typeof this.onload==='function')this.onload({target:{result:''}}); }
  readAsDataURL(){ if(typeof this.onload==='function')this.onload({target:{result:'data:'}}); }
}

const sandbox={
  console,Math,Number,Array,Object,Set,Map,WeakMap,Uint8Array,Uint8ClampedArray,Int32Array,Float32Array,Float64Array,
  JSON,String,Boolean,isFinite,parseInt,parseFloat,Date,Promise,RegExp,Error,TypeError,
  Blob,FileReader:FakeFileReader,URL:{createObjectURL(){return 'blob:mock';},revokeObjectURL(){}},
  document,window:windowObj,navigator:{userAgent:'node-smoke',mediaDevices:{}},
  localStorage:{getItem(){return null;},setItem(){},removeItem(){}},
  getComputedStyle(){return {display:'block',width:'800px',height:'600px'};},
  requestAnimationFrame(){return 1;},cancelAnimationFrame(){},
  setTimeout:immediateTimeout,clearTimeout(){},setInterval(){return 1;},clearInterval(){},
  ResizeObserver:class{observe(){}disconnect(){}},
  MutationObserver:class{observe(){}disconnect(){}},
  performance:{now(){return 0;}},
  crypto:{getRandomValues(arr){for(let i=0;i<arr.length;i++)arr[i]=i+1;return arr;}},
  alert(){},confirm(){return true;},prompt(){return '';},
};
sandbox.globalThis=sandbox;
Object.assign(windowObj,sandbox);
windowObj.window=windowObj; windowObj.document=document;
vm.createContext(sandbox);

const scripts=[...html.matchAll(/<script\s[^>]*src="([^"]+)"/gi)].map(m=>m[1].split('?')[0]);
if(scripts.length<10){console.error('SMOKE: index.html declara',scripts.length,'scripts');process.exit(1);}
for(const rel of scripts){
  const code=fs.readFileSync(path.join(ROOT,rel),'utf8');
  try{vm.runInContext(code,sandbox,{filename:rel});}
  catch(err){console.error(`SMOKE LOAD FAIL ${rel}:`,err.stack||err);process.exit(1);}
}
// En navegador window es el objeto global; refleja el alias histórico window.N en el sandbox VM.
if(Object.getOwnPropertyDescriptor(windowObj,'N')){
  Object.defineProperty(sandbox,'N',{get(){return windowObj.N;},set(v){windowObj.N=v;},configurable:true});
}

function fire(target,type){
  for(const fn of target._listeners?.[type]||[]){
    try{fn.call(target,{type,target,preventDefault(){},stopPropagation(){}});}
    catch(err){console.error(`SMOKE EVENT FAIL ${type}:`,err.stack||err);process.exit(1);}
  }
}
fire(document,'DOMContentLoaded');
fire(windowObj,'load');

const required=[
  'setRandomSeed','rand','buildGrid','buildPhysNB','calcFullE','calcDeltaE','calcDeltaE_global','attemptSwapPair',
  'init','draw','ui','startSim','pauseSim','resetSim','parseXYZ','parsePOSCAR','parseSIESTAXV','parseLAMMPSData',
  'exportCSV','exportPOSCAR','saveSession','loadSession','ensureJSZipLoaded','startBatch','batchStats','open3D','applyLang',
  'buildSimulationCSV','buildSessionObject','exportChartsPNG','initResearchPanel','fitBondModel','runTemperatureSweep',
  'poreShapeEnergetics','calibrateEpsXCFromRibbon','energyScaleDiagnostics','temperatureAtStep','calcFormationEnergyDFTLike'
];
const missing=required.filter(name=>typeof sandbox[name]!=='function' && typeof windowObj[name]!=='function');
if(missing.length){console.error('SMOKE missing functions:',missing.join(', '));process.exit(1);}
if(!windowObj.HBNCBandGenerator || typeof windowObj.HBNCBandGenerator.generateAlternatingBands!=='function'){
  console.error('SMOKE missing HBNCBandGenerator API'); process.exit(1);
}

// Estado mínimo inicializado por el flujo real de carga.
const evalIn=(src)=>vm.runInContext(src,sandbox);
const nx=evalIn('Nx'), ny=evalIn('Ny'), energy=evalIn('E'), ready=evalIn('ready');
if(!(nx>=2&&ny>=2&&Number.isFinite(energy)&&ready===true)){
  console.error('SMOKE invalid initialized state',{nx,ny,energy,ready});process.exit(1);
}
// v15: tras el arranque la interfaz no debe sobrescribir ε_CH con un valor distinto
// del núcleo (en v14.8 quedaba en −69.80 aunque el núcleo declaraba −70.41).
const epsXC=evalIn('EPS_XC');
if(Math.abs(epsXC+70.41)>1e-9){console.error('SMOKE eps_XC tras el arranque =',epsXC);process.exit(1);}
const paramSet=evalIn('MODEL_PARAM_SET');
if(paramSet!=='tesis2019'){console.error('SMOKE conjunto de parámetros tras el arranque =',paramSet);process.exit(1);}
// Ejecutar realmente las exportaciones y herramientas (en v14.8 exportCSV y
// exportChartsPNG lanzaban ReferenceError: bcPre is not defined).
const exercised={};
for(const call of ['buildSimulationCSV()','exportCSV()','exportChartsPNG()','JSON.stringify(buildSessionObject()).length',
  'researchRunFit()','researchRunScale()','researchRunStruct()','exportFormationVsMu()','reportParameterConsistency(true).length']){
  try{ exercised[call]=evalIn(call); }
  catch(err){console.error(`SMOKE CALL FAIL ${call}:`,err.stack||err);process.exit(1);}
}
const csv=exercised['buildSimulationCSV()'];
if(!/paso_MC,E_eV,T_K,accept_pct,cNB/.test(csv)||!/eps_NB=-128\.1626/.test(csv)){console.error('SMOKE CSV incompleto');process.exit(1);}
const result={
  ok:true,version:evalIn('HBN_VERSION'),scriptsLoaded:scripts.length,requiredFunctions:required.length,
  initialized:{Nx:nx,Ny:ny,E:energy,ready,EPS_XC:epsXC,paramSet},exercisedCalls:Object.keys(exercised).length,
  generatorAPI:true,cssPresent:fs.existsSync(path.join(ROOT,'assets/css/styles.css'))
};
module.exports={sandbox,windowObj,document,elements,evalIn,result,ROOT};
if(require.main===module) console.log(JSON.stringify(result,null,2));
