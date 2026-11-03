/* ===================================================================
   34-ino.js — Traductor del lenguaje de Arduino (subconjunto de C/C++) a JavaScript (EM.ino).
   Convierte un sketch en generadores JS que se ejecutan en tiempo virtual (delay, millis, loops).
   Respeta los tamaños de los tipos de la placa (int de 16 bits en AVR, de 32 bits en ESP32),
   la división entera, el desbordamiento y el formato de Serial.print.
   Mensajes de error en español con número de línea. Sin DOM: se prueba en Node.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const I = (EM.ino = {});

  /* ---------------- tipos ---------------- */
  const INT_TYPES = new Set(['bool', 'char', 'byte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong']);
  const isInt = (t) => INT_TYPES.has(t);
  const isFloat = (t) => t === 'float' || t === 'double';
  const TYPE_WORDS = new Set(['void', 'bool', 'boolean', 'char', 'byte', 'short', 'int', 'long', 'float', 'double', 'unsigned', 'signed', 'const', 'static', 'volatile', 'String',
    'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'size_t', 'word']);
  const SIMPLE = { uint8_t: 'byte', uint16_t: 'ushort', uint32_t: 'ulong', uint64_t: 'ulong', int8_t: 'char', int16_t: 'short', int32_t: 'long', int64_t: 'long', size_t: 'uint', word: 'uint', boolean: 'bool', byte: 'byte' };
  const KW = new Set(['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'sizeof', 'true', 'false', 'NULL']);

  function wrap(t, c, bits) {
    switch (t) {
      case 'int': return bits === 16 ? `((${c})<<16>>16)` : `((${c})|0)`;
      case 'uint': return bits === 16 ? `((${c})&65535)` : `((${c})>>>0)`;
      case 'long': return `((${c})|0)`;
      case 'ulong': return `((${c})>>>0)`;
      case 'short': return `((${c})<<16>>16)`;
      case 'ushort': return `((${c})&65535)`;
      case 'char': return `((${c})<<24>>24)`;
      case 'byte': return `((${c})&255)`;
      case 'bool': return `((${c})?1:0)`;
      case 'float': return `Math.fround(${c})`;
      case 'double': return bits === 16 ? `Math.fround(${c})` : c;
      default: return c;
    }
  }
  I.wrap = wrap;
  function arith(a, b, bits) {
    if (a === 'String' || b === 'String') return 'String';
    if (a === 'double' || b === 'double') return 'double';
    if (a === 'float' || b === 'float') return 'float';
    if (bits === 16) { if (a === 'ushort') a = 'uint'; if (b === 'ushort') b = 'uint'; }
    const L32 = (t) => t === 'long' || t === 'ulong';
    if (a === 'ulong' || b === 'ulong') return 'ulong';
    if (L32(a) || L32(b)) {
      if (bits === 32 && (a === 'uint' || b === 'uint')) return 'ulong';
      return 'long';
    }
    if (a === 'uint' || b === 'uint') return 'uint';
    return 'int';
  }
  const elemCtor = (t, bits) => ({ int: bits === 16 ? 'Int16Array' : 'Int32Array', uint: bits === 16 ? 'Uint16Array' : 'Uint32Array', long: 'Int32Array', ulong: 'Uint32Array', short: 'Int16Array', ushort: 'Uint16Array', char: 'Int8Array', byte: 'Uint8Array', bool: 'Uint8Array', float: 'Float32Array', double: bits === 16 ? 'Float32Array' : 'Float64Array' }[t]);
  I.sizeOf = (t, bits) => ({ bool: 1, char: 1, byte: 1, short: 2, ushort: 2, int: bits / 8, uint: bits / 8, long: 4, ulong: 4, float: 4, double: bits === 16 ? 4 : 8 }[t] || 4);

  /* tipo de retorno de funciones del entorno */
  const RET = { digitalRead: 'int', analogRead: 'int', millis: 'ulong', micros: 'ulong', map: 'long', pow: 'double', sqrt: 'double', sin: 'double', cos: 'double', tan: 'double', atan: 'double', atan2: 'double', asin: 'double', acos: 'double',
    log: 'double', log10: 'double', exp: 'double', floor: 'double', ceil: 'double', round: 'long', fabs: 'double', random: 'long', pulseIn: 'ulong', sq: 'double', radians: 'double', degrees: 'double', hypot: 'double',
    bitRead: 'int', bitWrite: 'void', lowByte: 'byte', highByte: 'byte', touchRead: 'int', hallRead: 'int', analogReadResolution: 'void', isnan: 'int', isinf: 'int', fmod: 'double', cbrt: 'double', ledcRead: 'int', dacWrite: 'void' };
  const VOIDLIKE = new Set(['delay', 'delayMicroseconds', 'pinMode', 'digitalWrite', 'analogWrite', 'tone', 'noTone', 'randomSeed', 'attachInterrupt', 'detachInterrupt', 'setup', 'loop']);

  /* ---------------- léxico ---------------- */
  const OPS = ['<<=', '>>=', '...', '->', '++', '--', '&&', '||', '==', '!=', '<=', '>=', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '::', '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}', '#'];
  function lex(src) {
    const toks = [];
    let i = 0, line = 1;
    const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (ch === '\n') { line++; i++; continue; }
      if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }
      if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (ch === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
      if (ch === '#') { /* directiva: línea completa */
        let j = i; while (j < n && src[j] !== '\n') { if (src[j] === '\\' && src[j + 1] === '\n') { j += 2; line++; continue; } j++; }
        toks.push({ k: 'pp', v: src.slice(i, j), line });
        i = j; continue;
      }
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i, isF = false;
        if (ch === '0' && /[xX]/.test(src[i + 1] || '')) { j = i + 2; while (/[0-9a-fA-F]/.test(src[j] || '')) j++; toks.push({ k: 'num', v: parseInt(src.slice(i + 2, j), 16), t: 'int', line }); }
        else if (ch === '0' && /[bB]/.test(src[i + 1] || '') && /[01]/.test(src[i + 2] || '')) { j = i + 2; while (/[01]/.test(src[j] || '')) j++; toks.push({ k: 'num', v: parseInt(src.slice(i + 2, j), 2), t: 'int', line }); }
        else {
          while (/[0-9]/.test(src[j] || '')) j++;
          if (src[j] === '.') { isF = true; j++; while (/[0-9]/.test(src[j] || '')) j++; }
          if (/[eE]/.test(src[j] || '') && /[-+0-9]/.test(src[j + 1] || '')) { isF = true; j += 2; while (/[0-9]/.test(src[j] || '')) j++; }
          const v = parseFloat(src.slice(i, j));
          toks.push({ k: 'num', v, t: isF ? 'double' : 'int', line });
        }
        const last = toks[toks.length - 1];
        let suf = '';
        while (/[uUlLfF]/.test(src[j] || '')) { suf += src[j]; j++; }
        if (/[fF]/.test(suf) && !suf.match(/[uUlL]/)) last.t = 'float';
        if (/[lL]/.test(suf)) last.t = /[uU]/.test(suf) ? 'ulong' : 'long';
        else if (/[uU]/.test(suf)) last.t = 'uint';
        if (last.t === 'int' && (last.v > 32767)) last.t = last.v > 2147483647 ? 'ulong' : 'long'; /* literales grandes */
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(ch)) { let j = i; while (/[A-Za-z0-9_]/.test(src[j] || '')) j++; toks.push({ k: 'id', v: src.slice(i, j), line }); i = j; continue; }
      if (ch === '"') {
        let j = i + 1, s = '';
        while (j < n && src[j] !== '"') { if (src[j] === '\\') { const e = src[j + 1]; s += ({ n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', '"': '"', "'": "'" }[e] ?? e); j += 2; } else { s += src[j]; j++; } }
        toks.push({ k: 'str', v: s, line }); i = j + 1; continue;
      }
      if (ch === "'") {
        let j = i + 1, s = '';
        if (src[j] === '\\') { const e = src[j + 1]; s = ({ n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"' }[e] ?? e); j += 2; } else { s = src[j]; j++; }
        toks.push({ k: 'num', v: s.charCodeAt(0), t: 'char', line }); i = j + 1; continue;
      }
      let op = null;
      for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
      if (!op) throw new CompileError(line, `carácter inesperado '${ch}'`);
      toks.push({ k: 'op', v: op, line }); i += op.length;
    }
    toks.push({ k: 'eof', v: '', line });
    return toks;
  }
  class CompileError extends Error { constructor(line, msg) { super(msg); this.line = line; } }
  I.CompileError = CompileError;

  /* ---------------- preprocesador: #define simples e #include ---------------- */
  function preprocess(toks) {
    const macros = new Map(), includes = [], out = [];
    for (const t of toks) {
      if (t.k === 'pp') {
        const m = /^#\s*define\s+([A-Za-z_]\w*)(\(?)\s*(.*)$/.exec(t.v.replace(/\\\n/g, ' '));
        if (m && !m[2]) { macros.set(m[1], lex(m[3].replace(/\/\/.*$/, '')).filter((x) => x.k !== 'eof').map((x) => Object.assign({}, x, { line: t.line }))); continue; }
        const inc = /^#\s*include\s*[<"]([^>"]+)[>"]/.exec(t.v);
        if (inc) includes.push(inc[1]);
        continue;
      }
      out.push(t);
    }
    /* expansión de macros (sin recursión profunda) */
    const expand = (arr, depth) => {
      const res = [];
      for (const t of arr) {
        if (t.k === 'id' && macros.has(t.v) && depth < 6) res.push(...expand(macros.get(t.v).map((x) => Object.assign({}, x, { line: t.line })), depth + 1));
        else res.push(t);
      }
      return res;
    };
    return { toks: expand(out, 0), includes, macros };
  }

  /* ---------------- sintaxis ---------------- */
  class Parser {
    constructor(toks, classes) { this.t = toks; this.p = 0; this.classes = classes; }
    get cur() { return this.t[this.p]; }
    peek(n = 1) { return this.t[Math.min(this.p + n, this.t.length - 1)]; }
    isOp(v) { const c = this.cur; return c.k === 'op' && c.v === v; }
    isId(v) { const c = this.cur; return c.k === 'id' && c.v === v; }
    err(msg, tok) { throw new CompileError((tok || this.cur).line, msg); }
    desc(t) { return t.k === 'eof' ? 'el final del archivo' : t.k === 'str' ? '"' + t.v + '"' : `'${t.v}'`; }
    eat(v) {
      if (this.isOp(v)) return this.t[this.p++];
      const prev = this.t[Math.max(0, this.p - 1)];
      if (v === ';' || v === ')' || v === '}' || v === ']') this.err(`se esperaba '${v}' antes de ${this.desc(this.cur)}`, v === ';' ? prev : this.cur);
      this.err(`se esperaba '${v}' pero se encontró ${this.desc(this.cur)}`);
    }
    accept(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
    ident() { if (this.cur.k !== 'id') this.err(`se esperaba un nombre pero se encontró ${this.desc(this.cur)}`); return this.t[this.p++].v; }

    isTypeStart() {
      const c = this.cur;
      if (c.k !== 'id') return false;
      if (TYPE_WORDS.has(c.v)) return true;
      /* clase de biblioteca: Id Id  (Servo miServo;) o Id Id( o Id Id[ */
      if (this.classes.has(c.v) && this.peek().k === 'id') return true;
      return false;
    }
    parseType() {
      let unsigned = false, signed = false, longs = 0, base = null, isConst = false, isStatic = false;
      let seen = false;
      while (this.cur.k === 'id' && (TYPE_WORDS.has(this.cur.v) || (!seen && this.classes.has(this.cur.v)))) {
        const w = this.cur.v; this.p++; seen = true;
        if (w === 'const') isConst = true;
        else if (w === 'static') isStatic = true;
        else if (w === 'volatile') { /* ignorado */ }
        else if (w === 'unsigned') unsigned = true;
        else if (w === 'signed') signed = true;
        else if (w === 'long') longs++;
        else base = SIMPLE[w] || w;
        if (this.classes.has(w)) { base = w; break; }
      }
      let t;
      if (base === 'char' || base === 'byte') t = unsigned || base === 'byte' ? 'byte' : 'char';
      else if (base === 'short') t = unsigned ? 'ushort' : 'short';
      else if (base === 'int' || base === null) t = longs ? (unsigned ? 'ulong' : 'long') : (unsigned ? 'uint' : 'int');
      else if (base === 'double' && longs) t = 'double';
      else t = base;
      if (base === null && !unsigned && !signed && !longs) this.err('tipo desconocido');
      if (longs && base === 'int') t = unsigned ? 'ulong' : 'long';
      let ptr = false;
      while (this.isOp('*')) { this.p++; ptr = true; }
      while (this.isOp('&')) { this.p++; ptr = ptr || false; this.byRef = true; }
      if (ptr && t === 'char') t = 'cstr';
      else if (ptr) this.err('los punteros no están disponibles en este simulador (use arreglos)');
      return { t, isConst, isStatic };
    }

    parseProgram() {
      const decls = [];
      while (this.cur.k !== 'eof') decls.push(this.parseTop());
      return decls;
    }
    parseTop() {
      if (this.cur.k === 'id' && this.cur.v === 'struct') this.err('struct no está disponible en este simulador');
      if (this.cur.k === 'id' && (this.cur.v === 'class' || this.cur.v === 'enum' || this.cur.v === 'typedef' || this.cur.v === 'template')) this.err(`'${this.cur.v}' no está disponible en este simulador`);
      if (!this.isTypeStart()) {
        const c = this.cur;
        if (c.k === 'id') this.err(`'${c.v}' no nombra un tipo (¿falta una biblioteca o está mal escrito?)`);
        this.err(`no se esperaba ${this.desc(c)} fuera de una función`);
      }
      const line = this.cur.line;
      const ty = this.parseType();
      const name = this.ident();
      if (this.isOp('(') && !this.classes.has(ty.t)) return this.parseFunc(ty, name, line);
      return this.parseVarRest(ty, name, line, true);
    }
    parseFunc(ty, name, line) {
      this.eat('(');
      const params = [];
      if (this.isId('void') && this.peek().v === ')') this.p++;
      else while (!this.isOp(')')) {
        this.byRef = false;
        const pt = this.parseType();
        const pn = this.ident();
        let isArr = false;
        while (this.accept('[')) { while (!this.isOp(']')) this.p++; this.eat(']'); isArr = true; }
        if (this.byRef) this.err(`el paso por referencia (&) no está disponible; devuelva el valor con return`);
        params.push({ type: pt.t, name: pn, isArr });
        if (!this.accept(',')) break;
      }
      this.eat(')');
      if (this.accept(';')) return { kind: 'proto', name, line };
      const body = this.parseBlock();
      return { kind: 'func', ret: ty.t, name, params, body, line };
    }
    parseVarRest(ty, name, line, global) {
      const items = [];
      for (;;) {
        const it = { name, dims: [], init: null, args: null, line: this.cur.line };
        while (this.accept('[')) { it.dims.push(this.isOp(']') ? null : this.parseExpr()); this.eat(']'); }
        if (this.accept('=')) it.init = this.isOp('{') ? this.parseInitList() : this.parseAssign();
        else if (this.isOp('(') && this.classes.has(ty.t)) { this.eat('('); it.args = []; while (!this.isOp(')')) { it.args.push(this.parseAssign()); if (!this.accept(',')) break; } this.eat(')'); }
        items.push(it);
        if (this.accept(',')) { while (this.isOp('*')) this.p++; name = this.ident(); continue; }
        break;
      }
      this.eat(';');
      return { kind: 'var', type: ty.t, isConst: ty.isConst, isStatic: ty.isStatic, items, line, global };
    }
    parseInitList() {
      this.eat('{');
      const els = [];
      while (!this.isOp('}')) { els.push(this.isOp('{') ? this.parseInitList() : this.parseAssign()); if (!this.accept(',')) break; }
      this.eat('}');
      return { kind: 'init', els };
    }
    parseBlock() {
      const line = this.cur.line;
      this.eat('{');
      const body = [];
      while (!this.isOp('}')) {
        if (this.cur.k === 'eof') this.err("se esperaba '}' al final del archivo (hay una llave '{' sin cerrar)", this.t[this.p]);
        body.push(this.parseStmt());
      }
      this.eat('}');
      return { kind: 'block', body, line };
    }
    parseStmt() {
      const c = this.cur, line = c.line;
      if (c.k === 'op') {
        if (c.v === '{') return this.parseBlock();
        if (c.v === ';') { this.p++; return { kind: 'empty', line }; }
      }
      if (c.k === 'id') {
        switch (c.v) {
          case 'if': { this.p++; this.eat('('); const cond = this.parseExpr(); this.eat(')'); const th = this.parseStmt(); let el = null; if (this.isId('else')) { this.p++; el = this.parseStmt(); } return { kind: 'if', cond, th, el, line }; }
          case 'while': { this.p++; this.eat('('); const cond = this.parseExpr(); this.eat(')'); return { kind: 'while', cond, body: this.parseStmt(), line }; }
          case 'do': { this.p++; const body = this.parseStmt(); if (!this.isId('while')) this.err("se esperaba 'while' después del cuerpo de do"); this.p++; this.eat('('); const cond = this.parseExpr(); this.eat(')'); this.eat(';'); return { kind: 'do', cond, body, line }; }
          case 'for': {
            this.p++; this.eat('(');
            let init = null, cond = null, inc = null;
            if (!this.isOp(';')) init = this.isTypeStart() ? this.parseDeclStmt() : (() => { const e = this.parseExpr(); this.eat(';'); return { kind: 'expr', e, line }; })();
            else this.eat(';');
            if (!this.isOp(';')) cond = this.parseExpr();
            this.eat(';');
            if (!this.isOp(')')) { inc = this.parseExpr(); }
            this.eat(')');
            return { kind: 'for', init, cond, inc, body: this.parseStmt(), line };
          }
          case 'switch': {
            this.p++; this.eat('('); const e = this.parseExpr(); this.eat(')'); this.eat('{');
            const cases = [];
            while (!this.isOp('}')) {
              let test = undefined;
              if (this.isId('case')) { this.p++; test = this.parseTernary(); this.eat(':'); }
              else if (this.isId('default')) { this.p++; this.eat(':'); test = null; }
              else this.err("se esperaba 'case' o 'default'");
              const body = [];
              while (!this.isOp('}') && !this.isId('case') && !this.isId('default')) body.push(this.parseStmt());
              cases.push({ test, body });
            }
            this.eat('}');
            return { kind: 'switch', e, cases, line };
          }
          case 'return': { this.p++; let e = null; if (!this.isOp(';')) e = this.parseExpr(); this.eat(';'); return { kind: 'return', e, line }; }
          case 'break': this.p++; this.eat(';'); return { kind: 'break', line };
          case 'continue': this.p++; this.eat(';'); return { kind: 'continue', line };
        }
        if (this.isTypeStart()) return this.parseDeclStmt();
      }
      const e = this.parseExpr();
      this.eat(';');
      return { kind: 'expr', e, line };
    }
    parseDeclStmt() {
      const line = this.cur.line;
      const ty = this.parseType();
      const name = this.ident();
      return this.parseVarRest(ty, name, line, false);
    }

    /* expresiones */
    parseExpr() { return this.parseComma(); }
    parseComma() { let e = this.parseAssign(); while (this.isOp(',') && this.commaOK) { this.p++; e = { kind: 'comma', a: e, b: this.parseAssign(), line: e.line }; } return e; }
    parseAssign() {
      const l = this.parseTernary();
      const c = this.cur;
      if (c.k === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='].includes(c.v)) {
        this.p++;
        const r = this.parseAssign();
        if (!['id', 'index', 'member'].includes(l.kind)) this.err('no se puede asignar a esta expresión', c);
        return { kind: 'assign', op: c.v, l, r, line: c.line };
      }
      return l;
    }
    parseTernary() {
      const c = this.parseBin(0);
      if (this.isOp('?')) { const line = this.cur.line; this.p++; const a = this.parseAssign(); this.eat(':'); const b = this.parseAssign(); return { kind: 'cond', c, a, b, line }; }
      return c;
    }
    parseBin(minPrec) {
      const PREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
      let l = this.parseUnary();
      for (;;) {
        const c = this.cur;
        const pr = c.k === 'op' ? PREC[c.v] : undefined;
        if (pr === undefined || pr <= minPrec) break;
        this.p++;
        const r = this.parseBin(pr);
        l = { kind: 'bin', op: c.v, l, r, line: c.line };
      }
      return l;
    }
    parseUnary() {
      const c = this.cur;
      if (c.k === 'op') {
        if (['!', '-', '+', '~'].includes(c.v)) { this.p++; return { kind: 'un', op: c.v, e: this.parseUnary(), line: c.line }; }
        if (c.v === '++' || c.v === '--') { this.p++; return { kind: 'pre', op: c.v, e: this.parseUnary(), line: c.line }; }
        if (c.v === '&') this.err("el operador '&' (dirección) no está disponible en este simulador", c);
        if (c.v === '*') this.err("los punteros ('*') no están disponibles en este simulador; use arreglos", c);
        if (c.v === '(' && this.isCastAhead()) {
          this.p++; const ty = this.parseType(); this.eat(')');
          return { kind: 'cast', type: ty.t, e: this.parseUnary(), line: c.line };
        }
      }
      if (c.k === 'id' && c.v === 'sizeof') {
        this.p++; this.eat('(');
        let node;
        if (this.isTypeStart()) { const ty = this.parseType(); node = { kind: 'sizeof', type: ty.t, line: c.line }; }
        else node = { kind: 'sizeof', e: this.parseUnary(), line: c.line };
        this.eat(')');
        return node;
      }
      return this.parsePostfix();
    }
    isCastAhead() {
      const n = this.peek();
      if (n.k !== 'id') return false;
      if (TYPE_WORDS.has(n.v) && n.v !== 'String' && n.v !== 'const') return true;
      return false;
    }
    parsePostfix() {
      let e = this.parsePrimary();
      for (;;) {
        const c = this.cur;
        if (c.k !== 'op') break;
        if (c.v === '(') {
          if (e.kind !== 'id' && e.kind !== 'member') this.err('llamada a algo que no es una función', c);
          this.p++;
          const args = [];
          while (!this.isOp(')')) { args.push(this.parseAssign()); if (!this.accept(',')) break; }
          this.eat(')');
          e = { kind: 'call', callee: e, args, line: c.line };
        } else if (c.v === '[') { this.p++; const idx = this.parseExpr(); this.eat(']'); e = { kind: 'index', obj: e, idx, line: c.line }; }
        else if (c.v === '.' || c.v === '->') { this.p++; const name = this.ident(); e = { kind: 'member', obj: e, name, line: c.line }; }
        else if (c.v === '++' || c.v === '--') { this.p++; e = { kind: 'post', op: c.v, e, line: c.line }; }
        else break;
      }
      return e;
    }
    parsePrimary() {
      const c = this.cur;
      if (c.k === 'num') { this.p++; return { kind: 'num', v: c.v, t: c.t, line: c.line }; }
      if (c.k === 'str') { this.p++; let s = c.v; while (this.cur.k === 'str') { s += this.cur.v; this.p++; } return { kind: 'str', v: s, line: c.line }; }
      if (c.k === 'id') {
        if (c.v === 'true' || c.v === 'false') { this.p++; return { kind: 'num', v: c.v === 'true' ? 1 : 0, t: 'bool', line: c.line }; }
        if (c.v === 'NULL') { this.p++; return { kind: 'num', v: 0, t: 'int', line: c.line }; }
        if (KW.has(c.v)) this.err(`no se esperaba '${c.v}' aquí`, c);
        this.p++;
        /* conversión tipo función: int(x), float(x), String(x), byte(x) */
        if ((TYPE_WORDS.has(c.v) && c.v !== 'const' && c.v !== 'static') && this.isOp('(')) {
          const ty = SIMPLE[c.v] || c.v;
          this.eat('('); const args = []; while (!this.isOp(')')) { args.push(this.parseAssign()); if (!this.accept(',')) break; } this.eat(')');
          return { kind: 'conv', type: ty, args, line: c.line };
        }
        return { kind: 'id', name: c.v, line: c.line };
      }
      if (c.k === 'op' && c.v === '(') { this.p++; const e = this.parseExpr(); this.eat(')'); return { kind: 'paren', e, line: c.line }; }
      this.err(`se esperaba una expresión antes de ${this.desc(c)}`);
    }
  }

  /* ---------------- generación de código ---------------- */
  class Gen {
    constructor(prog, env) {
      this.env = env; this.bits = env.bits || 16;
      this.prog = prog;
      this.scopes = [new Map()];
      this.funcs = new Map();
      this.statics = [];
      this.tmp = 0;
      this.curFn = null;
      this.errors = [];
      this.uid = 0;
      this.warnings = [];
    }
    err(line, msg) { throw new CompileError(line, msg); }
    declare(name, info, line) {
      const sc = this.scopes[this.scopes.length - 1];
      if (sc.has(name) && this.scopes.length > 1) this.err(line, `redeclaración de '${name}'`);
      const js = 'v_' + name;
      sc.set(name, Object.assign({ js }, info));
      return js;
    }
    lookup(name) { for (let i = this.scopes.length - 1; i >= 0; i--) if (this.scopes[i].has(name)) return this.scopes[i].get(name); return null; }
    push() { this.scopes.push(new Map()); }
    pop() { this.scopes.pop(); }
    w(t, c) { return wrap(t, c, this.bits); }
    tick() { return 'if($.tk())yield;'; }

    program() {
      const top = this.prog;
      /* registrar funciones primero */
      for (const d of top) if (d.kind === 'func') {
        if (this.funcs.has(d.name) && this.funcs.get(d.name).kind === 'func') this.err(d.line, `redefinición de '${d.name}'`);
        this.funcs.set(d.name, d);
      }
      for (const d of top) if (d.kind === 'proto' && !this.funcs.has(d.name)) this.funcs.set(d.name, { kind: 'proto', name: d.name, ret: 'int', params: [] });
      if (!this.funcs.has('setup')) this.err(1, "undefined reference to `setup': falta la función void setup()");
      if (!this.funcs.has('loop')) this.err(1, "undefined reference to `loop': falta la función void loop()");
      let globals = '', fns = '';
      this.globalInit = '';
      for (const d of top) {
        if (d.kind === 'var') globals += this.genVar(d, true);
        else if (d.kind === 'func') fns += this.genFunc(d);
      }
      return ['let $t;', globals, fns, 'return {setup:f_setup,loop:f_loop};'].join('\n');
    }
    genFunc(f) {
      this.curFn = f;
      this.push();
      const ps = [];
      let pre = '';
      for (const p of f.params) {
        const js = this.declare(p.name, { type: p.type, arr: p.isArr, kind: 'var' }, f.line);
        ps.push(js);
        if (!p.isArr && isInt(p.type) || isFloat(p.type)) pre += `${js}=${this.w(p.type, js)};`;
      }
      const body = this.genBlockBody(f.body.body);
      this.pop();
      this.curFn = null;
      const name = f.name;
      return `function* f_${name}(${ps.join(',')}){let $t;${pre}${body}${f.ret !== 'void' && f.ret !== undefined ? 'return 0;' : ''}}\n`;
    }
    genBlockBody(stmts) {
      let s = '';
      for (const st of stmts) s += this.genStmt(st);
      return s;
    }
    genStmt(st) {
      switch (st.kind) {
        case 'block': { this.push(); const s = '{' + this.genBlockBody(st.body) + '}'; this.pop(); return s; }
        case 'empty': return ';';
        case 'var': return this.genVar(st, false);
        case 'expr': return this.genExprStmt(st.e) + ';';
        case 'if': { const c = this.cond(st.cond); return `if(${c.code}){${this.genScoped(st.th)}}` + (st.el ? `else{${this.genScoped(st.el)}}` : ''); }
        case 'while': return `while(${this.cond(st.cond).code}){${this.tick()}${this.genScoped(st.body)}}`;
        case 'do': return `do{${this.tick()}${this.genScoped(st.body)}}while(${this.cond(st.cond).code});`;
        case 'for': {
          this.push();
          let init = '';
          if (st.init) init = st.init.kind === 'var' ? this.genVar(st.init, false).replace(/;let /g, ',').replace(/;$/, '') : this.genExprStmt(st.init.e);
          const cond = st.cond ? this.cond(st.cond).code : 'true';
          const inc = st.inc ? this.genExprStmt(st.inc) : '';
          const body = this.genScoped(st.body);
          this.pop();
          return `for(${init};${cond};${inc}){${this.tick()}${body}}`;
        }
        case 'switch': {
          const e = this.expr(st.e);
          let s = `switch(${e.code}){`;
          this.push();
          for (const c of st.cases) {
            if (c.test === undefined) continue;
            s += c.test === null ? 'default:' : `case ${this.expr(c.test).code}:`;
            s += '{' + this.genBlockBodyNoScope(c.body) + '}';
          }
          this.pop();
          return s + '}';
        }
        case 'return': {
          if (!st.e) return 'return;';
          const f = this.curFn;
          const e = this.expr(st.e);
          return `return ${isInt(f.ret) || isFloat(f.ret) ? this.w(f.ret, e.code) : e.code};`;
        }
        case 'break': return 'break;';
        case 'continue': return 'continue;';
      }
      throw new Error('instrucción desconocida ' + st.kind);
    }
    genBlockBodyNoScope(stmts) { let s = ''; for (const st of stmts) s += this.genStmt(st); return s; }
    genScoped(st) { if (st.kind === 'block') { this.push(); const s = this.genBlockBody(st.body); this.pop(); return s; } this.push(); const s = this.genStmt(st); this.pop(); return s; }
    cond(e) { const x = this.expr(e); return { code: x.type === 'String' ? `(${x.code}).length>0` : x.code, type: x.type }; }

    /* declaraciones de variables */
    genVar(d, global) {
      let s = '';
      for (const it of d.items) {
        const isArr = it.dims.length > 0;
        const type = d.type;
        let js;
        if (d.isStatic && !global) {
          js = 'st' + (++this.uid) + '_' + it.name;
        } else js = null;
        const info = { type, arr: isArr, dims: it.dims.length, kind: 'var', isConst: d.isConst, cls: this.env.classes.has(type) };
        const name = this.declare(it.name, info, it.line);
        if (js) { this.scopes[this.scopes.length - 1].get(it.name).js = js; }
        const jn = js || name;
        let init;
        if (this.env.classes.has(type)) {
          const args = (it.args || []).map((a) => this.expr(a).code);
          const argl = it.init ? [this.expr(it.init).code] : args;
          init = `new $.${type}(${argl.join(',')})`;
          info.cls = true;
        } else if (isArr) {
          init = this.genArray(type, it, info);
        } else if (it.init) {
          if (it.init.kind === 'init') this.err(it.line, 'lista de inicialización para una variable simple');
          const e = this.expr(it.init);
          init = this.convert(type, e);
        } else init = type === 'String' || type === 'cstr' ? '""' : '0';
        const decl = d.isStatic && !global ? '' : (global ? 'let ' : 'let ');
        if (global) { s += `let ${jn}=${init};\n`; }
        else if (d.isStatic) {
          this.statics.push(`let ${jn}=${init};`);
          this.staticsCode = (this.staticsCode || '') + `let ${jn}=${init};\n`;
          s += '';
        } else s += `let ${jn}=${init};`;
        /* los constructores y las inicializaciones con llamadas a funciones se ejecutan en el arranque */
      }
      return s;
    }
    convert(type, e) {
      if (isInt(type) || isFloat(type)) {
        if (e.type === 'String') this.err(0, `no se puede convertir 'String' a '${type}'`);
        return this.w(type, e.code);
      }
      return e.code;
    }
    genArray(type, it, info) {
      const ctor = elemCtor(type, this.bits);
      const dims = it.dims.map((d) => (d ? this.expr(d).code : null));
      const strT = type === 'String' || type === 'cstr' || this.env.classes.has(type);
      if (it.init && it.init.kind === 'init') {
        const flat = (n) => n.kind === 'init' ? `[${n.els.map(flat).join(',')}]` : this.expr(n).code;
        if (it.dims.length === 1) {
          const inner = it.init.els.map((x) => (x.kind === 'init' ? flat(x) : (isInt(type) || isFloat(type) ? this.w(type, this.expr(x).code) : this.expr(x).code)));
          if (strT) return `[${inner.join(',')}]`;
          return `new ${ctor}([${inner.join(',')}]${dims[0] ? ',' + dims[0] : ''})`.replace(/new (\w+)\(\[(.*)\]\)$/, 'new $1([$2])') + (dims[0] ? '' : '');
        }
        const rows = it.init.els.map((r) => (strT ? flat(r) : `new ${ctor}(${flat(r)})`));
        return `[${rows.join(',')}]`;
      }
      if (it.init && it.init.kind === 'str') return `$.cstrBuf(${JSON.stringify(it.init.v)},${dims[0] || 'null'})`;
      if (it.dims.length === 1) {
        if (!dims[0]) this.err(it.line, `el arreglo '${it.name}' necesita un tamaño`);
        return strT ? `new Array(${dims[0]}).fill(${type === 'String' || type === 'cstr' ? '""' : 'null'})` : `new ${ctor}(${dims[0]})`;
      }
      if (it.dims.length === 2) {
        if (!dims[0] || !dims[1]) this.err(it.line, `el arreglo '${it.name}' necesita tamaño en ambas dimensiones`);
        return `Array.from({length:${dims[0]}},()=>${strT ? `new Array(${dims[1]}).fill("")` : `new ${ctor}(${dims[1]})`})`;
      }
      this.err(it.line, 'arreglos de más de 2 dimensiones no disponibles');
    }

    /* expresiones usadas como instrucción (pueden ser asignaciones, ++, llamadas) */
    genExprStmt(e) {
      if (e.kind === 'post' || e.kind === 'pre') return this.incdec(e, true).code;
      if (e.kind === 'call' && e.callee.kind === 'member') {
        const mutating = new Set(['trim', 'toUpperCase', 'toLowerCase', 'concat', 'replace', 'remove']);
        const ot = this.typeOfObj(e.callee.obj);
        if (ot === 'String' && mutating.has(e.callee.name)) {
          const lv = this.expr(e.callee.obj);
          const args = e.args.map((a) => this.expr(a).code);
          return `${lv.code}=$S.${e.callee.name}(${[lv.code, ...args].join(',')})`;
        }
      }
      if (e.kind === 'comma') return this.genExprStmt(e.a) + ',' + this.genExprStmt(e.b);
      return this.expr(e).code;
    }
    typeOfObj(e) {
      if (e.kind === 'id') { const v = this.lookup(e.name); return v ? v.type : null; }
      return null;
    }
    lval(e) {
      if (e.kind === 'id') {
        const v = this.lookup(e.name);
        if (!v) this.err(e.line, `'${e.name}' no se declaró en este ámbito`);
        if (v.isConst) this.err(e.line, `asignación a la constante '${e.name}'`);
        if (v.arr) this.err(e.line, `no se puede asignar al arreglo '${e.name}' completo`);
        return { code: v.js, type: v.type };
      }
      if (e.kind === 'index') {
        const o = this.expr(e.obj);
        return { code: `${o.code}[${this.expr(e.idx).code}]`, type: o.elem || 'int', elemOfArr: true };
      }
      this.err(e.line, 'asignación no válida');
    }
    incdec(e, stmt) {
      const lv = this.lval(e.e);
      const op = e.op === '++' ? '+' : '-';
      const t = lv.type;
      const upd = isFloat(t) ? this.w(t, `${lv.code}${op}1`) : (lv.elemOfArr ? `${lv.code}${op}1` : this.w(t, `${lv.code}${op}1`));
      if (stmt) return { code: `${lv.code}=${upd}`, type: t };
      if (e.kind === 'pre') return { code: `(${lv.code}=${upd})`, type: t };
      return { code: `($t=${lv.code},${lv.code}=${isFloat(t) ? this.w(t, `$t${op}1`) : (lv.elemOfArr ? `$t${op}1` : this.w(t, `$t${op}1`))},$t)`, type: t };
    }
    expr(e) {
      switch (e.kind) {
        case 'num': return { code: String(e.v), type: e.t };
        case 'str': return { code: JSON.stringify(e.v), type: 'String' };
        case 'paren': { const x = this.expr(e.e); return { code: `(${x.code})`, type: x.type, elem: x.elem }; }
        case 'id': {
          const v = this.lookup(e.name);
          if (v) { return { code: v.js, type: v.type, elem: v.arr ? v.type : undefined, arr: v.arr, dims: v.dims, cls: v.cls }; }
          if (this.funcs.has(e.name)) return { code: 'f_' + e.name, type: 'func' };
          const k = this.env.consts[e.name];
          if (k !== undefined) return { code: typeof k === 'number' ? (k < 0 ? `(${k})` : String(k)) : `$.${e.name}`, type: typeof k === 'number' && !Number.isInteger(k) ? 'double' : 'int' };
          if (this.env.objects.has(e.name)) return { code: `$.${e.name}`, type: 'object', obj: true };
          this.err(e.line, `'${e.name}' no se declaró en este ámbito`);
        }
        case 'index': {
          const o = this.expr(e.obj);
          if (!o.arr && o.type !== 'String' && o.type !== 'cstr') this.err(e.line, 'se indexa algo que no es un arreglo');
          const i = this.expr(e.idx);
          if (o.type === 'String' || o.type === 'cstr') return { code: `$S.charAt(${o.code},${i.code})`, type: 'char' };
          const t = o.dims === 2 ? o.type : o.type;
          return { code: `${o.code}[${i.code}]`, type: t, elem: o.dims === 2 ? o.type : undefined, arr: o.dims === 2, dims: o.dims === 2 ? 1 : undefined };
        }
        case 'member': {
          const o = this.expr(e.obj);
          if (o.obj) return { code: `${o.code}.${e.name}`, type: 'int', member: true };
          return { code: `${o.code}.${e.name}`, type: 'int', member: true };
        }
        case 'call': return this.call(e);
        case 'conv': return this.conv(e);
        case 'cast': { const x = this.expr(e.e); return { code: isInt(e.type) || isFloat(e.type) ? this.w(e.type, x.code) : x.code, type: e.type }; }
        case 'sizeof': {
          if (e.type) return { code: String(I.sizeOf(e.type, this.bits)), type: 'uint' };
          const x = this.expr(e.e);
          if (x.arr) return { code: `${x.code}.byteLength`, type: 'uint' };
          return { code: String(I.sizeOf(x.type, this.bits)), type: 'uint' };
        }
        case 'un': {
          const x = this.expr(e.e);
          if (e.op === '!') return { code: `(${x.type === 'String' ? `(${x.code}).length` : x.code}?0:1)`, type: 'int' };
          if (e.op === '-') { const t = isFloat(x.type) ? x.type : arith(x.type, 'int', this.bits); return { code: this.w(t, `-(${x.code})`), type: t }; }
          if (e.op === '+') return x;
          if (e.op === '~') { const t = arith(x.type, 'int', this.bits); return { code: this.w(t, `~(${x.code})`), type: t }; }
          break;
        }
        case 'pre': case 'post': return this.incdec(e, false);
        case 'cond': {
          const c = this.cond(e.c), a = this.expr(e.a), b = this.expr(e.b);
          const t = (isInt(a.type) || isFloat(a.type)) && (isInt(b.type) || isFloat(b.type)) ? arith(a.type, b.type, this.bits) : a.type;
          return { code: `(${c.code}?${a.code}:${b.code})`, type: t };
        }
        case 'comma': { const a = this.genExprStmt(e.a), b = this.expr(e.b); return { code: `(${a},${b.code})`, type: b.type }; }
        case 'assign': return this.assign(e);
        case 'bin': return this.bin(e);
      }
      throw new Error('expresión desconocida ' + e.kind);
    }
    assign(e) {
      const lv = this.lval(e.l);
      const r = this.expr(e.r);
      const t = lv.type;
      if (e.op === '=') {
        if (lv.elemOfArr) return { code: `(${lv.code}=${isInt(t) || isFloat(t) ? this.w(t, r.code) : r.code})`, type: t };
        if (t === 'String' || t === 'cstr') return { code: `(${lv.code}=$S.str(${r.code},${JSON.stringify(r.type)}))`, type: t };
        return { code: `(${lv.code}=${isInt(t) || isFloat(t) ? this.w(t, r.code) : r.code})`, type: t };
      }
      const op = e.op.slice(0, -1);
      if (t === 'String' && op === '+') return { code: `(${lv.code}=${lv.code}+$S.str(${r.code},${JSON.stringify(r.type)}))`, type: t };
      const b = this.binary(op, { code: lv.code, type: t }, r, e.line);
      return { code: `(${lv.code}=${isInt(t) || isFloat(t) ? this.w(t, b.code) : b.code})`, type: t };
    }
    bin(e) {
      if (e.op === '&&' || e.op === '||') {
        const a = this.cond(e.l), b = this.cond(e.r);
        return { code: `((${a.code})${e.op}(${b.code})?1:0)`, type: 'int' };
      }
      return this.binary(e.op, this.expr(e.l), this.expr(e.r), e.line);
    }
    binary(op, a, b, line) {
      if (op === '+' && (a.type === 'String' || b.type === 'String' || a.type === 'cstr' || b.type === 'cstr')) {
        return { code: `($S.str(${a.code},${JSON.stringify(a.type)})+$S.str(${b.code},${JSON.stringify(b.type)}))`, type: 'String' };
      }
      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
        if (isInt(a.type) && isInt(b.type)) { const t0 = arith(a.type, b.type, this.bits); if (t0 === 'uint' || t0 === 'ulong') { a = { code: this.w(t0, a.code), type: t0 }; b = { code: this.w(t0, b.code), type: t0 }; } }
        if (a.type === 'String' && b.type === 'String') return { code: `(${a.code}${op === '==' ? '===' : op === '!=' ? '!==' : op}${b.code}?1:0)`, type: 'int' };
        return { code: `(${a.code}${op === '==' ? '===' : op === '!=' ? '!==' : op}${b.code}?1:0)`, type: 'int' };
      }
      if (a.type === 'String' || b.type === 'String') this.err(line, `operación '${op}' no válida entre cadenas`);
      const t = arith(a.type, b.type, this.bits);
      const ia = isInt(t);
      if (ia && (t === 'uint' || t === 'ulong') && ['/', '%'].includes(op)) { a = { code: this.w(t, a.code), type: t }; b = { code: this.w(t, b.code), type: t }; }
      switch (op) {
        case '+': case '-': return { code: this.w(t, `${a.code}${op}${b.code}`), type: t };
        case '*': return { code: ia ? (t === 'int' && this.bits === 16 || t === 'uint' && this.bits === 16 ? this.w(t, `${a.code}*${b.code}`) : this.w(t, `Math.imul(${a.code},${b.code})`)) : this.w(t, `${a.code}*${b.code}`), type: t };
        case '/': return { code: ia ? this.w(t, `Math.trunc(${a.code}/${b.code})`) : this.w(t, `${a.code}/${b.code}`), type: t };
        case '%': if (!ia) this.err(line, "el operador '%' necesita enteros (use fmod para decimales)"); return { code: this.w(t, `${a.code}%${b.code}`), type: t };
        case '<<': return { code: this.w(arith(a.type, 'int', this.bits), `${a.code}<<${b.code}`), type: arith(a.type, 'int', this.bits) };
        case '>>': { const ty = arith(a.type, 'int', this.bits); const unsig = ty === 'uint' || ty === 'ulong'; return { code: this.w(ty, `${a.code}${unsig ? '>>>' : '>>'}${b.code}`), type: ty }; }
        case '&': case '|': case '^': return { code: this.w(t, `${a.code}${op}${b.code}`), type: t };
      }
      throw new Error('operador ' + op);
    }
    conv(e) {
      const a = e.args.map((x) => this.expr(x));
      if (e.type === 'String') return { code: `$S.conv(${a.map((x, i) => (i === 0 ? x.code + ',' + JSON.stringify(x.type) : x.code)).join(',')})`, type: 'String' };
      if (a.length !== 1) this.err(e.line, `la conversión ${e.type}(...) necesita un valor`);
      return { code: this.w(e.type, a[0].code), type: e.type };
    }
    call(e) {
      const cal = e.callee;
      /* método de objeto: x.metodo(args) */
      if (cal.kind === 'member') {
        const o = this.expr(cal.obj);
        const args = e.args.map((a) => this.expr(a));
        if (o.type === 'String' || o.type === 'cstr') {
          const retT = { length: 'uint', toInt: 'long', toFloat: 'float', indexOf: 'int', lastIndexOf: 'int', charAt: 'char', equals: 'int', equalsIgnoreCase: 'int', startsWith: 'int', endsWith: 'int', substring: 'String', toUpperCase: 'String', toLowerCase: 'String', trim: 'String', replace: 'void', concat: 'int', c_str: 'cstr', isEmpty: 'int', remove: 'void' }[cal.name];
          if (retT === undefined) this.err(e.line, `'String' no tiene el método '${cal.name}'`);
          return { code: `$S.${cal.name}(${[o.code, ...args.map((x) => x.code)].join(',')})`, type: retT };
        }
        const tagged = ['print', 'println', 'write'].includes(cal.name) && !this.isUserObj(cal.obj);
        let argl = args.map((x) => x.code);
        if (tagged && cal.name !== 'write') { if (argl.length === 0) argl = []; else { while (argl.length < 2) argl.push('undefined'); argl.push(JSON.stringify(args[0].type)); } }
        const rt = this.memberRet(cal.obj, cal.name);
        const blocking = this.env.blocking.has((cal.obj.kind === 'id' ? cal.obj.name : '') + '.' + cal.name) || this.env.blocking.has('.' + cal.name);
        const callc = `${o.code}.${cal.name}(${argl.join(',')})`;
        return { code: blocking ? `(yield* ${callc})` : callc, type: rt };
      }
      const name = cal.name;
      const args = e.args.map((a) => this.expr(a));
      if (this.funcs.has(name)) {
        const f = this.funcs.get(name);
        if (f.params && f.kind === 'func' && f.params.length !== args.length) this.err(e.line, `la función '${name}' espera ${f.params.length} argumento(s) pero recibió ${args.length}`);
        return { code: `(yield* f_${name}(${args.map((x) => x.code).join(',')}))`, type: f.ret || 'int' };
      }
      if (this.lookup(name)) this.err(e.line, `'${name}' no es una función`);
      /* funciones del entorno */
      switch (name) {
        case 'F': case 'PSTR': return args[0];
        case 'min': case 'max': { if (args.length !== 2) this.err(e.line, `${name} necesita 2 argumentos`); const t = arith(args[0].type, args[1].type, this.bits); return { code: `Math.${name}(${args[0].code},${args[1].code})`, type: t }; }
        case 'abs': { const t = args[0].type; return { code: this.w(isFloat(t) ? t : arith(t, 'int', this.bits), `Math.abs(${args[0].code})`), type: isFloat(t) ? t : arith(t, 'int', this.bits) }; }
        case 'constrain': { const t = arith(args[0].type, arith(args[1].type, args[2].type, this.bits), this.bits); return { code: `Math.min(Math.max(${args[0].code},${args[1].code}),${args[2].code})`, type: t }; }
        case 'sq': { const t = isFloat(args[0].type) ? args[0].type : arith(args[0].type, 'int', this.bits); return { code: this.w(t, `(${args[0].code})*(${args[0].code})`), type: t }; }
        case 'map': return { code: `$.map(${args.map((a) => a.code).join(',')})`, type: 'long' };
        case 'sqrt': return { code: `Math.sqrt(${args[0].code})`, type: 'double' };
        case 'pow': return { code: `Math.pow(${args[0].code},${args[1].code})`, type: 'double' };
        case 'fabs': return { code: `Math.abs(${args[0].code})`, type: 'double' };
        case 'floor': case 'ceil': case 'sin': case 'cos': case 'tan': case 'atan': case 'asin': case 'acos': case 'exp': case 'log': return { code: `Math.${name}(${args.map((a) => a.code).join(',')})`, type: 'double' };
        case 'atan2': return { code: `Math.atan2(${args[0].code},${args[1].code})`, type: 'double' };
        case 'log10': return { code: `Math.log10(${args[0].code})`, type: 'double' };
        case 'round': return { code: `Math.round(${args[0].code})`, type: 'long' };
        case 'radians': return { code: `(${args[0].code}*Math.PI/180)`, type: 'double' };
        case 'degrees': return { code: `(${args[0].code}*180/Math.PI)`, type: 'double' };
        case 'isnan': return { code: `(Number.isNaN(${args[0].code})?1:0)`, type: 'int' };
        case 'isinf': return { code: `(Number.isFinite(${args[0].code})||Number.isNaN(${args[0].code})?0:1)`, type: 'int' };
        case 'bitRead': return { code: `((${args[0].code}>>>${args[1].code})&1)`, type: 'int' };
        case 'lowByte': return { code: `((${args[0].code})&255)`, type: 'byte' };
        case 'highByte': return { code: `(((${args[0].code})>>8)&255)`, type: 'byte' };
        case '_BV': return { code: `(1<<${args[0].code})`, type: 'int' };
        case 'bit': return { code: `(1<<${args[0].code})`, type: 'int' };
      }
      if (!this.env.funcs.has(name)) this.err(e.line, `'${name}' no se declaró en este ámbito (¿falta incluir una biblioteca o está mal escrito?)`);
      const blocking = this.env.blocking.has(name);
      const t = RET[name] || 'void';
      const c = `$.${name}(${args.map((a) => a.code).join(',')})`;
      return { code: blocking ? `(yield* ${c})` : c, type: t };
    }
    isUserObj(o) { return false; }
    memberRet(obj, name) {
      const R = { available: 'int', read: 'int', peek: 'int', readString: 'String', readStringUntil: 'String', parseInt: 'long', parseFloat: 'float', readTemperature: 'float', readHumidity: 'float', getDistance: 'float', get_units: 'float', length: 'uint', read_average: 'float', height: 'int', getAddress: 'int', printf: 'int', availableForWrite: 'int', connected: 'int', status: 'int', localIP: 'String', macAddress: 'String', RSSI: 'long', begin: 'int', requestFrom: 'int', endTransmission: 'int', getEvent: 'int', isConnected: 'int', hasClient: 'int', getAcceleration: 'float', getRotation: 'float', read_angle: 'int', is_ready: 'int', touchRead: 'int', ping_cm: 'uint', readAngle: 'int', toString: 'String', uid: 'String', PICC_IsNewCardPresent: 'int', PICC_ReadCardSerial: 'int', readFrom: 'int', receive: 'int', getText: 'String', hasText: 'int', arg: 'String', uri: 'String', method: 'int', hasArg: 'int', attached: 'int', readMicroseconds: 'int', getTemperature: 'float', temperature: 'float', humidity: 'float', gyro: 'float', accel: 'float', rawAccelX: 'int', readAccel: 'float', value: 'int' };
      return R[name] || 'int';
    }
  }

  /* ---------------- biblioteca de String (Arduino) ---------------- */
  const fmtF = (x, d = 2) => (Number.isNaN(x) ? 'nan' : !Number.isFinite(x) ? (x > 0 ? 'inf' : '-inf') : x.toFixed(d));
  I.fmtNum = (v, tag, digits) => {
    if (tag === 'String' || tag === 'cstr') return String(v);
    if (tag === 'char') return String.fromCharCode(v);
    if (tag === 'float' || tag === 'double') return fmtF(v, digits === undefined ? 2 : digits);
    return String(v);
  };
  const S = I.S = {
    str(v, tag) { return tag === 'String' || tag === 'cstr' || typeof v === 'string' ? String(v) : I.fmtNum(v, tag); },
    conv(v, tag, base) {
      if (typeof v === 'string') return v;
      if (tag === 'float' || tag === 'double') return fmtF(v, base === undefined ? 2 : base);
      if (tag === 'char') return String.fromCharCode(v);
      if (base === 16) return (v >>> 0).toString(16).toUpperCase();
      if (base === 2) return (v >>> 0).toString(2);
      if (base === 8) return (v >>> 0).toString(8);
      return String(v);
    },
    length: (s) => s.length, toInt: (s) => { const m = /^\s*[-+]?\d+/.exec(s); return m ? parseInt(m[0], 10) | 0 : 0; }, toFloat: (s) => { const m = /^\s*[-+]?(\d+\.?\d*|\.\d+)/.exec(s); return m ? Math.fround(parseFloat(m[0])) : 0; },
    indexOf: (s, x, from) => s.indexOf(typeof x === 'number' ? String.fromCharCode(x) : x, from), lastIndexOf: (s, x) => s.lastIndexOf(typeof x === 'number' ? String.fromCharCode(x) : x),
    charAt: (s, i) => (i >= 0 && i < s.length ? s.charCodeAt(i) : 0), equals: (s, o) => (s === o ? 1 : 0), equalsIgnoreCase: (s, o) => (s.toLowerCase() === o.toLowerCase() ? 1 : 0),
    startsWith: (s, o) => (s.startsWith(o) ? 1 : 0), endsWith: (s, o) => (s.endsWith(o) ? 1 : 0), substring: (s, a, b) => s.substring(a, b === undefined ? s.length : b),
    toUpperCase: (s) => s.toUpperCase(), toLowerCase: (s) => s.toLowerCase(), trim: (s) => s.trim(), replace: (s, a, b) => s.split(a).join(b), concat: (s, o) => s + o, c_str: (s) => s, isEmpty: (s) => (s.length ? 0 : 1),
    remove: (s, i, n) => (n === undefined ? s.slice(0, i) : s.slice(0, i) + s.slice(i + n))
  };

  /* ---------------- API pública ----------------
     env: {bits:16|32, consts:{NOMBRE:valor}, funcs:Set, objects:Set, classes:Set, blocking:Set} */
  I.compile = function (src, env) {
    env = Object.assign({ bits: 16, consts: {}, funcs: new Set(), objects: new Set(), classes: new Set(), blocking: new Set() }, env);
    try {
      const lx = lex(src);
      const pp = preprocess(lx);
      const P = new Parser(pp.toks, env.classes);
      P.commaOK = true;
      const prog = P.parseProgram();
      const g = new Gen(prog, env);
      let js = g.program();
      /* variables estáticas locales: se declaran al inicio del programa */
      if (g.staticsCode) js = js.replace('let $t;\n', 'let $t;\n' + g.staticsCode);
      return { ok: true, js, includes: pp.includes };
    } catch (e) {
      if (e instanceof CompileError) return { ok: false, errors: [{ line: e.line, msg: e.message }] };
      throw e;
    }
  };
  /* Instancia un programa compilado con un host. Devuelve {setup, loop, globals} (generadores) */
  I.instantiate = function (js, host) {
    const f = new Function('$', '$S', js);
    return f(host, S);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
