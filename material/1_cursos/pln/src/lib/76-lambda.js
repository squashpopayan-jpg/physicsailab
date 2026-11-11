/* ===================================================================
   lib/76-lambda.js — Cálculo lambda para la semántica composicional:
   análisis de términos, β-reducción con sustitución sin captura, forma
   canónica, y un analizador semántico dirigido por la sintaxis con
   adjuntos semánticos para una gramática del español.
   Sintaxis (compatible con NLTK): \x.cuerpo  f(a, b)  all x.(…)  exists x.(…)  - & | -> <->
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const S = (L.sem = {});

  const esVar = (n) => /^([a-df-z]|[A-Z])\d*$/.test(n);
  const TOK = /\s*(<->|->|[\\().,&|\-=]|[A-Za-zÁÉÍÓÚÜáéíóúüÑñ_][A-Za-zÁÉÍÓÚÜáéíóúüÑñ_0-9]*)/y;
  /* Nodos: {k:'var'|'cte', n} {k:'app', f, a} {k:'lam', v, b} {k:'and'|'or'|'imp'|'iff', a, b} {k:'not', a} {k:'all'|'exists', v, b} */
  S.parsear = function (s) {
    const t = []; TOK.lastIndex = 0; let m;
    while (TOK.lastIndex < s.length && (m = TOK.exec(s)) !== null) t.push(m[1]);
    if (TOK.lastIndex < s.replace(/\s+$/, '').length) throw new Error('símbolo no válido');
    let i = 0; const peek = () => t[i], next = () => t[i++];
    const esp = (x) => { if (next() !== x) throw new Error('se esperaba «' + x + '»'); };
    const expr = () => {
      const p = peek();
      if (p === '\\') { next(); const vs = []; while (peek() !== '.') vs.push(next()); next(); let b = expr(); for (let q = vs.length - 1; q >= 0; q--) b = { k: 'lam', v: vs[q], b }; return b; }
      if (p === 'all' || p === 'exists') { next(); const vs = []; while (peek() !== '.') vs.push(next()); next(); let b = expr(); for (let q = vs.length - 1; q >= 0; q--) b = { k: p, v: vs[q], b }; return b; }
      return iff();
    };
    const iff = () => { let a = imp(); while (peek() === '<->') { next(); a = { k: 'iff', a, b: imp() }; } return a; };
    const imp = () => { const a = or(); if (peek() === '->') { next(); return { k: 'imp', a, b: imp() }; } return a; };
    const or = () => { let a = and(); while (peek() === '|') { next(); a = { k: 'or', a, b: and() }; } return a; };
    const and = () => { let a = un(); while (peek() === '&') { next(); a = { k: 'and', a, b: un() }; } return a; };
    const un = () => { if (peek() === '-') { next(); return { k: 'not', a: un() }; } return app(); };
    const app = () => {
      let a = atom();
      while (peek() === '(') { next(); const args = [expr()]; while (peek() === ',') { next(); args.push(expr()); } esp(')'); for (const x of args) a = { k: 'app', f: a, a: x }; }
      return a;
    };
    const atom = () => {
      const p = next();
      if (p === '(') { const e = expr(); esp(')'); return e; }
      if (p === '\\' || p === 'all' || p === 'exists') { i--; return expr(); }
      if (p === undefined || !/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ_]/.test(p)) throw new Error('término no válido');
      return esVar(p) ? { k: 'var', n: p } : { k: 'cte', n: p };
    };
    const e = expr(); if (i < t.length) throw new Error('sobra «' + t[i] + '»'); return e;
  };

  const libres = (e, s = new Set()) => {
    switch (e.k) {
      case 'var': s.add(e.n); break; case 'cte': break;
      case 'app': libres(e.f, s); libres(e.a, s); break;
      case 'lam': case 'all': case 'exists': { const t = new Set(); libres(e.b, t); t.delete(e.v); t.forEach((x) => s.add(x)); break; }
      case 'not': libres(e.a, s); break;
      default: libres(e.a, s); libres(e.b, s);
    }
    return s;
  };
  let contador = 0;
  const fresco = (n, evitar) => { let m; do { m = n.replace(/\d+$/, '') + (++contador); } while (evitar.has(m)); return m; };
  /* e[v := r] sin captura */
  const subst = (e, v, r) => {
    switch (e.k) {
      case 'var': return e.n === v ? r : e;
      case 'cte': return e;
      case 'app': return { k: 'app', f: subst(e.f, v, r), a: subst(e.a, v, r) };
      case 'not': return { k: 'not', a: subst(e.a, v, r) };
      case 'lam': case 'all': case 'exists': {
        if (e.v === v) return e;
        const lr = libres(r);
        if (lr.has(e.v) && libres(e.b).has(v)) {
          const nv = fresco(e.v, new Set([...lr, ...libres(e.b)]));
          return { k: e.k, v: nv, b: subst(subst(e.b, e.v, { k: 'var', n: nv }), v, r) };
        }
        return { k: e.k, v: e.v, b: subst(e.b, v, r) };
      }
      default: return { k: e.k, a: subst(e.a, v, r), b: subst(e.b, v, r) };
    }
  };
  /* Forma normal por reducción de orden normal. pasos: contador de β-reducciones */
  S.reducir = function (e, traza) {
    let pasos = 0;
    const red = (x) => {
      switch (x.k) {
        case 'app': {
          const f = red(x.f);
          if (f.k === 'lam') { pasos++; const r = subst(f.b, f.v, x.a); if (traza) traza.push(S.texto(r)); return red(r); }
          return { k: 'app', f, a: red(x.a) };
        }
        case 'lam': case 'all': case 'exists': return { k: x.k, v: x.v, b: red(x.b) };
        case 'not': return { k: 'not', a: red(x.a) };
        case 'var': case 'cte': return x;
        default: return { k: x.k, a: red(x.a), b: red(x.b) };
      }
    };
    const r = red(e); S.pasos = pasos; return r;
  };
  /* Texto estilo NLTK; los predicados con varios argumentos se escriben f(a, b) */
  S.texto = function (e) {
    const aplanar = (x) => { const args = []; while (x.k === 'app') { args.unshift(x.a); x = x.f; } return [x, args]; };
    const P = { iff: 0, imp: 1, or: 2, and: 3, not: 4 };
    const par = (x, p) => { const s = S.texto(x); return P[x.k] !== undefined && P[x.k] < p ? '(' + s + ')' : (x.k === 'lam' || x.k === 'all' || x.k === 'exists') && p > 0 ? '(' + s + ')' : s; };
    switch (e.k) {
      case 'var': case 'cte': return e.n;
      case 'app': { const [h, args] = aplanar(e); return (h.k === 'var' || h.k === 'cte' ? h.n : '(' + S.texto(h) + ')') + '(' + args.map((a) => S.texto(a)).join(', ') + ')'; }
      case 'lam': return '\\' + e.v + '.' + S.texto(e.b);
      case 'all': case 'exists': return e.k + ' ' + e.v + '.' + (['and', 'or', 'imp', 'iff'].includes(e.b.k) ? '(' + S.texto(e.b) + ')' : S.texto(e.b));
      case 'not': return '-' + par(e.a, 4);
      case 'and': return par(e.a, 3) + ' & ' + par(e.b, 4);
      case 'or': return par(e.a, 2) + ' | ' + par(e.b, 3);
      case 'imp': return par(e.a, 2) + ' -> ' + par(e.b, 1);
      case 'iff': return par(e.a, 1) + ' <-> ' + par(e.b, 1);
    }
  };
  /* Forma canónica: variables ligadas renombradas x1, x2… por orden de aparición */
  S.canonica = function (e) {
    let n = 0;
    const ren = (x, env) => {
      switch (x.k) {
        case 'var': return env.has(x.n) ? { k: 'var', n: env.get(x.n) } : x;
        case 'cte': return x;
        case 'app': return { k: 'app', f: ren(x.f, env), a: ren(x.a, env) };
        case 'not': return { k: 'not', a: ren(x.a, env) };
        case 'lam': case 'all': case 'exists': { const nv = 'x' + (++n), e2 = new Map(env); e2.set(x.v, nv); return { k: x.k, v: nv, b: ren(x.b, e2) }; }
        default: return { k: x.k, a: ren(x.a, env), b: ren(x.b, env) };
      }
    };
    return S.texto(ren(e, new Map())).replace(/\s+/g, ' ');
  };

  /* ---------- Analizador semántico dirigido por la sintaxis ---------- */
  S.GRAMATICA = `
S -> SN SV
SN -> Det N | Nom
SV -> V SN | V
Det -> 'todo' | 'un' | 'ningún'
N -> 'estudiante' | 'libro' | 'profesor' | 'gato'
Nom -> 'marta' | 'juan'
V -> 'lee' | 've' | 'duerme'
`;
  S.LEX = {
    todo: '\\P.\\Q.all x.(P(x) -> Q(x))', un: '\\P.\\Q.exists x.(P(x) & Q(x))', 'ningún': '\\P.\\Q.-exists x.(P(x) & Q(x))',
    estudiante: '\\x.estudiante(x)', libro: '\\x.libro(x)', profesor: '\\x.profesor(x)', gato: '\\x.gato(x)',
    marta: '\\P.P(marta)', juan: '\\P.P(juan)',
    lee: '\\Y.\\x.Y(\\y.lee(x,y))', ve: '\\Y.\\x.Y(\\y.ve(x,y))', duerme: '\\x.duerme(x)'
  };
  /* Devuelve la cadena lambda de un árbol de CKY; lectura = 'sujeto' (el sujeto abarca) o 'objeto' (el objeto abarca) */
  S.componer = function (t, lectura = 'sujeto') {
    const hoja = (n) => (typeof n[1] === 'string' ? n[1] : null);
    const sem = (n) => {
      if (n.length === 2 && typeof n[1] === 'string') return '(' + S.LEX[n[1]] + ')';
      const [sim, ...h] = n;
      if (sim === 'S') {
        const sv = h[1];
        if (lectura === 'objeto' && sv.length === 3) {
          /* el cuantificador del objeto abarca al del sujeto */
          const V = sem(sv[1]), subj = sem(h[0]), obj = sem(sv[2]);
          return `${obj}(\\y.${subj}(\\x.${V}(\\Z.Z(y))(x)))`;
        }
        return sem(h[0]) + '(' + sem(h[1]) + ')';
      }
      if (sim === 'SN' && h.length === 2) return sem(h[0]) + '(' + sem(h[1]) + ')';
      if (sim === 'SV' && h.length === 2) return sem(h[0]) + '(' + sem(h[1]) + ')';
      return sem(h[0]);
    };
    return sem(t);
  };
  S.analizar = function (frase, lectura) {
    const g = L.cfg.leer(S.GRAMATICA), r = L.cfg.cky(g, frase.toLowerCase().split(/\s+/), { arboles: 2 });
    if (!r.ok) return null;
    const lam = S.componer(r.arboles[0], lectura), red = S.reducir(S.parsear(lam));
    return { arbol: r.arboles[0], lambda: lam, formula: S.texto(red), canon: S.canonica(red), pasos: S.pasos };
  };
})(typeof window !== 'undefined' ? window : globalThis);


