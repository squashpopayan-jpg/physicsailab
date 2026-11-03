# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\06-general.html'
s = open(p, encoding='utf-8').read()
rep = [("=1.50068\\times10^7", "=1.50066\\times10^7"), ("62\\,636\\,856-15\\,006\\,806", "62\\,636\\,856-15\\,006\\,558"), ("5.2994\\times10^{-10}", "5.2996\\times10^{-10}"),
       ("-0.75034\\times10^7", "-0.75033\\times10^7"), ("-8.348\\times10^{-11}", "-8.349\\times10^{-11}"), ("5.79091\\times10^{10}", "5.79092\\times10^{10}")]
for a, b in rep:
    assert a in s, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
