# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\06-general.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"la razón medida/predicha de \(0.9990\pm0.0076\) (Pound y Snider, 1964)", r"la razón medida/predicha de \(0.9990\pm0.0076\) (Pound y Snider, 1965)"),
 (r"y el satélite MICROSCOPE (2022), que compara cilindros de titanio y platino en órbita, a \(|\eta|\lt3\times10^{-15}\).", r"y el satélite MICROSCOPE (2022), que compara cilindros de titanio y platino en órbita, midió una diferencia de aceleración relativa \(\eta=(-1.5\pm2.3\pm1.5)\times10^{-15}\), compatible con cero."),
 (r"la diferencia que Le Verrier detectó en 1859 entre las observaciones (574″/siglo) y los cálculos newtonianos con los demás planetas (531″), y que se atribuyó durante medio siglo a un planeta inexistente, Vulcano.", r"la diferencia entre la precesión observada (574″ por siglo) y la que explican las perturbaciones newtonianas de los demás planetas (531″). Le Verrier la detectó en 1859 (con un valor inicial de unos 38″ que Newcomb refinó a 43″ en 1882), y durante medio siglo se atribuyó a un planeta inexistente, Vulcano."),
 (r"que dejó uno de \(62\,M_\odot\) y radió \(3\,M_\odot c^2=5.4\times10^{47}\) J en menos de un segundo, más que la potencia luminosa de todas las estrellas del universo observable en ese momento. La deformación medida fue \(h\approx10^{-21}\): una variación de \(4\times10^{-18}\) m en un brazo de 4 km, miles de veces menor que un protón.", r"que dejó uno de \(62\,M_\odot\) y radió \(3\,M_\odot c^2=5.4\times10^{47}\) J, con una potencia máxima de unos \(3.6\times10^{49}\) W, mayor que la luminosidad conjunta de todas las estrellas del universo observable. La deformación medida fue \(h\approx10^{-21}\): una diferencia de \(hL=4\times10^{-18}\) m entre los dos brazos de 4 km, unas 200 veces menor que el diámetro de un protón."),
 (r"\(GM_c/c^3=1.3844\times10^{-4}\) s \(\times\)(28.10/1.0)... \(=1.3844\times10^{-4}\) s; \(\pi f=109.96\) s\(^{-1}\). \(\tau=0.1901\) s.", r"\(GM_\odot/c^3=4.9255\times10^{-6}\) s, así que \(GM_c/c^3=28.10\times4.9255\times10^{-6}=1.384\times10^{-4}\) s; \(\pi f=109.96\) s\(^{-1}\); \(\tau=0.1901\) s."),
]
for a, b in rep:
    assert a in s, a[:70]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
