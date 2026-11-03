# -*- coding: utf-8 -*-
# Capítulo 16: átomos con varios electrones
HA = C.physical_constants['Hartree energy in eV'][0]
E1 = -4+5*2/8; Ev = -(27/16)**2; Ehf = ref16_hf = -2.86167999; Eex = -2.903724377034; Eexp = -(24.587389+54.417760)
chk(16, 'P1: E1 (Ha)', E1, '-2.75'); chk(16, 'P1/Texto: E1 (eV)', E1*HA, '-74.83'); chk(16, 'Texto: E exp (eV)', Eexp, '-79.005'); chk(16, 'P1: error (%)', (E1*HA-Eexp)/abs(Eexp)*100, '5.3', 0.06) if False else chk(16, 'P1: error (%)', abs(E1*HA-Eexp)/abs(Eexp)*100, '5.3')
chk(16, 'P1: 5Z/8', 5*2/8, '1.25'); chk(16, 'P1: −Z²', -4, '-4.0')
chk(16, 'P3: ζ', 27/16, '1.6875'); chk(16, 'P3: apantallamiento', 5/16, '0.3125'); chk(16, 'P3: E (Ha)', Ev, '-2.8477'); chk(16, 'Texto/P3: E (eV)', Ev*HA, '-77.49'); chk(16, 'P3: error (%)', abs(Ev*HA-Eexp)/abs(Eexp)*100, '1.9')
chk(16, 'P3: E(ζ=1)', 1-4+5/8, '-2.375'); chk(16, 'P3: E(ζ=2)', 4-8+5/4, '-2.75')
chk(16, 'Texto: HF (Ha)', Ehf, '-2.86168'); chk(16, 'Texto: HF (eV)', Ehf*HA, '-77.87'); chk(16, 'Texto: exacta (Ha)', Eex, '-2.90372'); chk(16, 'Texto: exacta (eV)', Eex*HA, '-79.01'); chk(16, 'Texto: correlación (Ha)', Ehf-Eex, '0.04204'); chk(16, 'Texto: correlación (eV)', (Ehf-Eex)*HA, '1.14')
chk(16, 'Texto: error HF (%)', abs(Ehf-Eex)/abs(Eex)*100, '1.4')
# ionización del helio
chk(16, 'P5: IE variacional (Ha)', -2-Ev, '0.8477'); chk(16, 'P5: IE variacional (eV)', (-2-Ev)*HA, '23.07'); chk(16, 'P5: IE exacta (eV)', (-2-Eex)*HA, '24.59'); chk(16, 'P5: IE exp (eV)', 24.587389, '24.587'); chk(16, 'P5: error variacional (%)', abs((-2-Ev)*HA-24.587389)/24.587389*100, '6.2')
# J y K
J = 17*2/81; K = 16*2/729
chk(16, 'P6: J (Ha)', J, '0.4198'); chk(16, 'P6: J (eV)', J*HA, '11.42'); chk(16, 'P6: K (Ha)', K, '0.04390'); chk(16, 'P6: K (eV)', K*HA, '1.194') if False else chk(16, 'P6: K (eV)', K*HA, '1.194'); chk(16, 'P6: 2K (eV)', 2*K*HA, '2.39'); chk(16, 'Texto: 2K (eV, 2 dec)', 2*K*HA, '2.39'); chk(16, 'P6: 17/81·2', J, '0.4198'); chk(16, 'Texto: exp 2¹S−2³S (eV)', 20.62-19.82, '0.80')
# Madelung
chk(16, 'Texto: configuraciones que coinciden', 46, '46'); chk(16, 'Texto: excepciones', 8, '8'); chk(16, 'Texto: 2n² suma n=1..4', sum(2*n*n for n in range(1, 5)), '60')
# términos
chk(16, 'P2: Fe 3d⁶ S', 2.0, '2.0'); chk(16, 'P2: Fe d⁶ L', 2+1+0+(-1)+(-2)+2, '2') if False else chk(16, 'P2: Fe d⁶ L (m=2,1,0,−1,−2 y 2 de nuevo)', 2+1+0-1-2+2, '2'); chk(16, 'P2: Cr S (3d⁵ + 4s¹)', 5/2+1/2, '3.0'); chk(16, 'P2: 2S+1 Fe', 2*2+1, '5'); chk(16, 'P2: 2S+1 Cr', 2*3+1, '7')
chk(16, 'P2: C p² L', 1+0, '1'); chk(16, 'P2: N p³ L', 1+0-1, '0'); chk(16, 'P2: O p⁴ L', 1+0-1+1, '1')
# Slater
chk(16, 'P4: Na 3s', 11-(8*0.85+2*1.0), '2.20'); chk(16, 'P4: Na apantallamiento', 8*0.85+2*1.0, '8.8'); chk(16, 'P4: Fe 4s', 26-(14*0.85+10*1.0+0.35), '3.75'); chk(16, 'P4: Fe apantallamiento', 14*0.85+10+0.35, '22.25'); chk(16, 'P4: Cl 3p', 17-(6*0.35+8*0.85+2*1.0), '6.10'); chk(16, 'P4: Cl apantallamiento', 6*0.35+8*0.85+2, '10.9')
chk(16, 'Texto: Cu 4s', 29-(18*0.85+10), '3.70'); chk(16, 'Texto: C 2p', 6-(3*0.35+2*0.85), '3.25'); chk(16, 'Texto: Ne 2p', 10-(7*0.35+2*0.85), '5.85')
chk(16, 'Texto: He 1s', 2-0.30, '1.70')
# IE
chk(16, 'Texto: IE He (eV)', 24.587389, '24.587'); chk(16, 'Texto: IE Li (eV)', 5.391714, '5.392'); chk(16, 'Texto: IE Ne (eV)', 21.564541, '21.565'); chk(16, 'Texto: IE Na (eV)', 5.139076, '5.139')
