import re, sys
# Uso: python tools/fixe.py archivo.html  -> reemplaza \e (no seguido de letra) por \ee
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
n = len(re.findall(r'\\e(?![a-zA-Z])', s))
s = re.sub(r'\\e(?![a-zA-Z])', lambda m: r'\ee', s)
open(p, 'w', encoding='utf-8').write(s)
print(n, 'reemplazos')
