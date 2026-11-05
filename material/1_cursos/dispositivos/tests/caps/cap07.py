import numpy as np
print('Zref',100*8)
print('I2',12/8,'I1',12/8/10, 'P',12*12/8)
print('Phi',120/(4.44*60*600),'B',120/(4.44*60*600)/6e-4)
print('B 50Hz',120/(4.44*50*600)/6e-4)
print('reg',(12-11)/11*100,(12-11)/12*100)
print('eta',100/(100+2+3))
print('Im',120/(2*np.pi*60*5))
# regulacion con fp 0.8 en retardo: V1 = V2 + I(R+jX)
V2=12; I=1; R=1.0; X=0.5; 
for pf,lead in ((1,0),(0.8,0),(0.8,1)):
    phi=np.arccos(pf)*(1 if not lead else -1)
    Iph=I*np.exp(-1j*phi)
    V1=V2+Iph*(R+1j*X)
    print(pf,lead,abs(V1),(abs(V1)-V2)/V2*100)
# desde 12 V en vacío cae a: V2_FL con V20=12.0
print('n 120/12',10)
