/* Núcleo 34 — traductor del lenguaje de Arduino (EM.ino) frente a un evaluador de enteros de C independiente */
module.exports = function ({ chk, ref, EM, S, L }) {
  const I = EM.ino;
  const run = (src, bits) => {
    const out = [];
    const env = { bits, consts: { HIGH: 1, LOW: 0 }, funcs: new Set(['delay', 'map']), objects: new Set(['Serial']), classes: new Set(), blocking: new Set(['delay']) };
    const r = I.compile(src, env);
    if (!r.ok) return { err: r.errors[0].msg + ' (línea ' + r.errors[0].line + ')', out };
    const host = { tk: () => false, *delay() {}, map: (x, a, b, c, d) => (((((x - a) | 0) * ((d - c) | 0)) | 0) / ((b - a) | 0) | 0) + c | 0, Serial: { begin() {}, print(v, f, t) { out.push(I.fmtNum(v, t, f)); }, println(v, f, t) { out.push(I.fmtNum(v, t, f)); } } };
    const prog = I.instantiate(r.js, host);
    const g = prog.setup();
    for (let k = 0; k < 1e6; k++) if (g.next().done) break;
    return { out };
  };
  /* 1) expresiones aleatorias con tipos enteros (AVR de 16 bits y ESP32 de 32 bits) */
  for (const blk of ref.ino) {
    let n = 0;
    for (const cs of blk.cases) {
      const decls = Object.entries(cs.vars).map(([nm, [t, v]]) => `${t} ${nm} = ${v < 0 ? '(' + v + ')' : v};`).join(' ');
      const r = run(`void setup(){ Serial.begin(9600); ${decls} Serial.println(${cs.expr}); }\nvoid loop(){}`, blk.bits);
      const got = r.err ? NaN : +r.out[0];
      chk(S, `Traductor C (${blk.bits} bits): ${decls.replace(/ +/g, ' ')} ⇒ ${cs.expr}`, got, cs.val, 0, false);
      n++;
    }
  }
  /* 2) algoritmos */
  const A = ref.ino_alg;
  const chs = (g, name, got, exp) => chk(g, name, got === exp ? 1 : 0, 1, 0);
  { const r = run('void setup(){ Serial.begin(9600); long a=0,b=1; for(int i=0;i<10;i++){ Serial.println(a); long t=a+b; a=b; b=t; } }\nvoid loop(){}', 16);
    chs(L, 'Fibonacci(0…9) con bucle for', r.out.join(','), A.fib.join(',')); }
  { const r = run('void setup(){ Serial.begin(9600); for(int n=2;n<60;n++){ bool p=true; for(int q=2;q*q<=n;q++){ if(n%q==0){ p=false; break; } } if(p) Serial.println(n); } }\nvoid loop(){}', 16);
    chs(L, 'Primos menores que 60 (for anidado, break)', r.out.join(','), A.primes.join(',')); }
  { const r = run('int v[7]={9,3,7,1,8,2,5};\nvoid setup(){ Serial.begin(9600); for(int i=0;i<6;i++) for(int j=0;j<6-i;j++) if(v[j]>v[j+1]){ int t=v[j]; v[j]=v[j+1]; v[j+1]=t; } for(int i=0;i<7;i++) Serial.println(v[i]); }\nvoid loop(){}', 16);
    chs(L, 'Ordenamiento de burbuja de un arreglo', r.out.join(','), A.sorted.join(',')); }
  { const xs = A.maps.map((q) => q[0]);
    const r = run('void setup(){ Serial.begin(9600); ' + xs.map((x) => `Serial.println(map(${x}, 0, 1023, 0, 255));`).join(' ') + ' }\nvoid loop(){}', 16);
    chs(L, 'map(x, 0, 1023, 0, 255) con enteros (división truncada)', r.out.join(','), A.maps.map((q) => q[1]).join(',')); }
  { const r = run('void setup(){ Serial.begin(9600); int a=1000; int c=a*100; Serial.println(c); Serial.println(60*1000); unsigned long u=5; u=u-10; Serial.println(u); byte b=250; b+=10; Serial.println(b); Serial.println(7/2.0); Serial.println(7/2); Serial.println(-7/2); Serial.println(-7%3); }\nvoid loop(){}', 16);
    chs(L, 'Desbordamientos del AVR: 1000·100, 60·1000, ulong 5−10, byte 250+10, divisiones', r.out.join('|'), [A.overflow16, A.overflow16_60k, A.ulong_sub, A.byte_inc, '3.50', A.int_div, A.int_div_neg, A.int_mod_neg].join('|')); }
  /* 3) funciones, recursión, cadenas, switch, ternario */
  { const r = run('long fact(int n){ if(n<=1) return 1; return n*fact(n-1); }\nvoid setup(){ Serial.begin(9600); Serial.println(fact(10)); String s="Hola"; s+=" mundo"; Serial.println(s); Serial.println(s.length()); int k=3; switch(k){ case 1: Serial.println("uno"); break; case 3: Serial.println("tres"); break; default: Serial.println("otro"); } Serial.println(k>2?10:20); }\nvoid loop(){}', 32);
    chs(L, 'Recursión, String, switch y operador ternario', r.out.join('|'), '3628800|Hola mundo|10|tres|10'); }
  /* 4) errores de compilación en español */
  { const r = run('void setup(){ int x = 5 }\nvoid loop(){}', 16);
    chk(L, 'Error: falta «;» se informa con número de línea', /punto|;/.test(r.err || '') && /línea 1/.test(r.err) ? 1 : 0, 1, 0); }
  { const r = run('void setup(){ ledPin = 5; }\nvoid loop(){}', 16);
    chk(L, 'Error: variable no declarada', /no se declaró/.test(r.err || '') ? 1 : 0, 1, 0); }
  { const r = run('void setup(){}', 16);
    chk(L, 'Error: falta loop()', /loop/.test(r.err || '') ? 1 : 0, 1, 0); }
};
