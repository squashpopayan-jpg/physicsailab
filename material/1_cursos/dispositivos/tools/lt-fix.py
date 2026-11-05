import re, glob, sys
apply = '--apply' in sys.argv
BS = chr(92)
OPEN = re.compile(re.escape(BS) + r'([(\[])')
tot = 0
files = sorted(glob.glob('src/chapters/*.html') + glob.glob('src/chapters/*.js') + glob.glob('src/core/*.js') + ['src/shell.html'])
for f in files:
    s = open(f, encoding='utf-8').read()
    out = []; i = 0; n = 0
    while True:
        m = OPEN.search(s, i)
        if not m:
            out.append(s[i:]); break
        close = BS + (')' if m.group(1) == '(' else ']')
        j = s.find(close, m.end())
        if j < 0:
            print('SIN CIERRE', f, s[:m.start()].count('\n') + 1); out.append(s[i:]); break
        body = s[m.end():j]
        if BS + '(' in body or BS + '[' in body:
            print('ANIDADO?', f, s[:m.start()].count('\n') + 1, body[:60])
        k = len(re.findall(r'<', body))
        if k:
            n += k
            print(f, s[:m.start()].count('\n') + 1, k, repr(body[:70]))
            body = body.replace('<', '&lt;')
        out.append(s[i:m.end()]); out.append(body); i = j
    if n:
        tot += n
        if apply:
            open(f, 'w', encoding='utf-8', newline='').write(''.join(out))
print('total', tot)
