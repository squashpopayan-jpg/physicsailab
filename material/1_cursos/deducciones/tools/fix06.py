p='src/chapters/06-dinamica.html'; s=open(p,encoding='utf-8').read()
a="Pase \(\rho\) a 1000 (agua): \(v_t\) baja a 1.2 m/s en unos 0.12 s: por eso las caídas en agua son lentas."
assert a in s
s=s.replace(a,"Pase \(\rho\) a 1000 (agua): \(v_t\) baja a 1.497 m/s y el tiempo característico \(v_t/g\) a 0.153 s: por eso la caída en agua es lenta.")
a="; una esfera de acero cae casi como en el vacío durante \(\tau\) segundos."
assert a in s
s=s.replace(a,".")
open(p,'w',encoding='utf-8').write(s)
