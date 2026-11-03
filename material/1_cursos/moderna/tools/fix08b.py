# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\08-fotones.html'
s = open(p, encoding='utf-8').read()
rep = [
 (r"la conservación del momento y de la energía relativista da (la deducción está en el apéndice de este capítulo: \(p_e^2=p^2+p'^2-2pp'\cos\theta\), \(E_e=(p-p')c+mc^2\) y \(E_e^2=p_e^2c^2+m^2c^4\)):",
  r"la conservación del momento (\(p_e^2=p^2+p'^2-2pp'\cos\theta\)) y de la energía relativista (\(E_e=(p-p')c+m_ec^2\), con \(E_e^2=p_e^2c^2+m_e^2c^4\)) permite eliminar \(p_e\) y llegar a \((p-p')m_ec=pp'(1-\cos\theta)\); dividiendo por \(pp'm_ec\) y recordando que \(1/p=\lambda/h\):"),
 (r"\(\lambda'=13.611\) pm", r"\(\lambda'=13.612\) pm"),
 (r"875\,576/1834.3", r"875\,582/1834.3"),
]
for a, b in rep:
    assert a in s, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
