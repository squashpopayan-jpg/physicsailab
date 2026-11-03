# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\25-particulas.html'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b)
rep('\\(pp\\to p\\Lambda\\) (viola \\(S\\) en una interacción fuerte)', '\\(np\\to p\\Lambda\\) (viola \\(S\\) en una interacción fuerte)')
i = s.index('<li>Con \\(\\pi^-+p\\to K^0+\\Lambda\\) en modo'); j = s.index('</li>', i) + 5
s = s[:i] + '<li>Con \\(\\pi^-+p\\to K^0+\\Lambda\\) en modo «fuerte», se conserva todo: la extrañeza \\(0\\to(+1)+(-1)\\). Pase a \\(n+p\\to p+\\Lambda\\): solo se viola la extrañeza (\\(0\\to-1\\)); es un proceso posible únicamente por la interacción débil (cambie el modo a «débil»). Con un \\(K^0\\) o \\(K^+\\) adicional en el estado final la extrañeza se compensa.</li>' + s[j:]
rep('<b>(c)</b> \\(S:0\\to-1\\): violada por la interacción fuerte; falta un \\(K^+\\) (\\(S=+1\\)).', '<b>(c)</b> Con \\(p+p\\) la carga no se conserva (\\(+2\\to+1\\)); con \\(n+p\\to p+\\Lambda\\) se conserva la carga pero \\(S:0\\to-1\\): violada por la interacción fuerte (haría falta un \\(K^0\\), \\(S=+1\\), en el estado final).')
rep('(c) \\(p+p\\to p+\\Lambda\\);', '(c) \\(p+p\\to p+\\Lambda\\) (y \\(n+p\\to p+\\Lambda\\));')
open(p, 'w', encoding='utf-8').write(s)
q = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\val\val25.js'
t = open(q, encoding='utf-8').read()
t = t.replace("['p + p → p + Λ (extrañeza)', ['p', 'p'], ['p', 'Lambda'], 'extrañeza']", "['n + p → p + Λ (extrañeza)', ['n', 'p'], ['p', 'Lambda'], 'extrañeza'], ['p + p → p + Λ (carga)', ['p', 'p'], ['p', 'Lambda'], 'carga']")
open(q, 'w', encoding='utf-8').write(t)
print('ok')
