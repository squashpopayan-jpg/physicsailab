import math, scipy.constants as C
h,c,kB,e,me,hbar=C.h,C.c,C.k,C.e,C.m_e,C.hbar
muB=C.physical_constants['Bohr magneton'][0]; al=C.alpha; Ry=13.605693122994
print('muB/h GHz/T',muB/h/1e9,'muB eV/T',muB/e)
lam=643.8e-9; dnu=muB/h; print('dlam nm',lam**2*dnu/c*1e9)
m=107.868*C.u; v=math.sqrt(8*kB*1200/(math.pi*m)); a=muB*1000/m; z=a*0.035*(0.035/2+0.01)/v**2
print('m',m,'v',v,'F',muB*1000,'a',a,'z mm',z*1e3,'v2',v*v)
print('NaD2 ext 5/3 muB ueV',5/3*muB/e*1e6,'GHz',5/3*muB/h/1e9,'muB ueV',muB/e*1e6, '4/3',4/3*muB/e*1e6)
print('fine eV',al**2*Ry/16,'GHz',al**2*Ry/16*e/h/1e9,'cm-1',al**2*Ry/16*e/h/c/100,'al2',al**2)
mu3=(C.m_p/(C.m_p+me))**3
print('hf',4/3*5.5856946893*(me/C.m_p)*al**4*me*c*c*mu3/h/1e6,'me/mp',me/C.m_p,'al4',al**4,'mc2',me*c*c/e,'mu3',mu3)
E=4/3*5.5856946893*(me/C.m_p)*al**4*me*c*c*mu3; print('E eV',E/e,'meas', h*1420.405751768e6/e, 'T K',h*1420.405751768e6/kB, 'ratio',1418.84/1420.405751768-1)
print('lambda cm',c/1420.405751768e6*100)
gp=C.physical_constants['proton gyromag. ratio in MHz/T'][0]
for B in (1.5,3,7): print(B,gp*B, math.tanh(h*gp*1e6*B/(2*kB*300)), h*gp*1e6*B/e*1e6, c/(gp*1e6*B))
print('4K 3T',math.tanh(h*gp*1e6*3/(2*kB*4)))
print('kT meV',kB*300/e*1e3)
gn=C.physical_constants['neutron gyromag. ratio in MHz/T'][0]; ge=C.physical_constants['electron gyromag. ratio in MHz/T'][0]
print('n 3T',gn*3,'e 3T GHz',ge*3/1e3,'e 0.339',ge*.339/1e3, 'ratio e/p',ge/gp)
print('h dE 3T J',h*gp*1e6*3)
print('A Na',2/3*2.132,'B*',2/3*2.132e-3/(muB/e),'H A',2/3*al**2*Ry/16,'B* H',2/3*al**2*Ry/16/(muB/e))
print('lifetime 21cm: A=2.869e-15 s-1 ->',1/2.869e-15/3.156e7)
print('Lamb eV',1057.845e6*h/e*1e6,'ueV')
print('weak slopes',[4/3*1.5,4/3*.5,2/3*.5])
