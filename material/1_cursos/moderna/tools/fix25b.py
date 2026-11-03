# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\25-particulas.html'
lines = open(p, encoding='utf-8').read().split('\n')
lines[92] = lines[92].replace('=499.0', '=498.8')
lines[93] = lines[93].replace('499.0/167.2', '498.8/167.2')
open(p, 'w', encoding='utf-8').write('\n'.join(lines))
print(lines[92][:120]); print(lines[93][:120])
