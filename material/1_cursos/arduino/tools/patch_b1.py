# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/34-ino.js', [
    ("    const L32 = (t) => t === 'long' || t === 'ulong';",
     "    if (bits === 16) { if (a === 'ushort') a = 'uint'; if (b === 'ushort') b = 'uint'; }\n    const L32 = (t) => t === 'long' || t === 'ulong';"),
    ("      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {\n        if (a.type === 'String' && b.type === 'String')",
     "      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {\n        if (isInt(a.type) && isInt(b.type)) { const t0 = arith(a.type, b.type, this.bits); if (t0 === 'uint' || t0 === 'ulong') { a = { code: this.w(t0, a.code), type: t0 }; b = { code: this.w(t0, b.code), type: t0 }; } }\n        if (a.type === 'String' && b.type === 'String')"),
    ("      const t = arith(a.type, b.type, this.bits);\n      const ia = isInt(t);",
     "      const t = arith(a.type, b.type, this.bits);\n      const ia = isInt(t);\n      if (ia && (t === 'uint' || t === 'ulong') && ['/', '%'].includes(op)) { a = { code: this.w(t, a.code), type: t }; b = { code: this.w(t, b.code), type: t }; }"),
])
# val34: comparar cadenas
p = 'tests/val/val34.js'
s = open(p, encoding='utf-8').read()
s = s.replace("const A = ref.ino_alg;", "const A = ref.ino_alg;\n  const chs = (g, name, got, exp) => chk(g, name, got === exp ? 1 : 0, 1, 0);")
import re
s = s.replace("chk(L, 'Fibonacci(0…9) con bucle for', r.out.join(','), A.fib.join(','), 0)", "chs(L, 'Fibonacci(0…9) con bucle for', r.out.join(','), A.fib.join(','))")
s = s.replace("chk(L, 'Primos menores que 60 (for anidado, break)', r.out.join(','), A.primes.join(','), 0)", "chs(L, 'Primos menores que 60 (for anidado, break)', r.out.join(','), A.primes.join(','))")
s = s.replace("chk(L, 'Ordenamiento de burbuja de un arreglo', r.out.join(','), A.sorted.join(','), 0)", "chs(L, 'Ordenamiento de burbuja de un arreglo', r.out.join(','), A.sorted.join(','))")
s = s.replace("chk(L, 'map(x, 0, 1023, 0, 255) con enteros (división truncada)', r.out.join(','), A.maps.map((q) => q[1]).join(','), 0)", "chs(L, 'map(x, 0, 1023, 0, 255) con enteros (división truncada)', r.out.join(','), A.maps.map((q) => q[1]).join(','))")
s = s.replace("chk(L, 'Desbordamientos del AVR: 1000·100, 60·1000, ulong 5−10, byte 250+10, divisiones', r.out.join('|'), [A.overflow16, A.overflow16_60k, A.ulong_sub, A.byte_inc, '3.50', A.int_div, A.int_div_neg, A.int_mod_neg].join('|'), 0)", "chs(L, 'Desbordamientos del AVR: 1000·100, 60·1000, ulong 5−10, byte 250+10, divisiones', r.out.join('|'), [A.overflow16, A.overflow16_60k, A.ulong_sub, A.byte_inc, '3.50', A.int_div, A.int_div_neg, A.int_mod_neg].join('|'))")
s = s.replace("chk(L, 'Recursión, String, switch y operador ternario', r.out.join('|'), '3628800|Hola mundo|10|tres|10', 0)", "chs(L, 'Recursión, String, switch y operador ternario', r.out.join('|'), '3628800|Hola mundo|10|tres|10')")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
