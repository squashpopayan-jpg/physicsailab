import numpy as np
k=1.380649e-23
rho=1.68e-8; L=100; d=0.5e-3; A=np.pi*(d/2)**2
print('Cu 100m 0.5mm:',rho*L/A)
print('Cu a 75C', 8.56*(1+0.0039*(75-20)))
print('carbon 1k +60K 500ppm',1000*500e-6*60)
for R,B in ((1e4,2e4),(1e6,1e6),(50,1e9),(1e3,1e4)):
    print('vn',R,B,np.sqrt(4*k*300*R*B))
print('derating 100C',0.25*(155-100)/(155-70))
print('E12 vals',[round(10**(i/12),2) for i in range(12)])
print('E24',[round(10**(i/24),2) for i in range(24)][:8])
print('fc 100k 0.3pF', 1/(2*np.pi*1e5*0.3e-12))
print('SRF 10nH 0.3pF',1/(2*np.pi*np.sqrt(10e-9*0.3e-12)))
# worst case divider
print('div 1%:',10.1/(10.1+9.9),10.1/20)
# shunt
print('shunt',0.1*2,0.1*4)
# thermal: R 100 ohm at 10 V
print('P',100/100)
# ratio of 2 resistors E24 to get 3.3V from 5V: R1,R2
best=None
E=[1.0,1.1,1.2,1.3,1.5,1.6,1.8,2.0,2.2,2.4,2.7,3.0,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1]
bs=[]
for a in E:
  for b in E:
    v=5*b/(a+b)
    bs.append((abs(v-3.3),a,b,v))
bs.sort(); print(bs[:5])
# resistance of 1k at 1 MHz with 10nH: |Z|
w=2*np.pi*1e6; print(abs(1000+1j*w*10e-9))
# 100k with 0.3pF at 1MHz
Z=1/(1/1e5+1j*w*0.3e-12); print(abs(Z),np.degrees(np.angle(Z)))
