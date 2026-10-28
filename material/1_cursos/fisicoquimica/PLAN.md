# Fisicoquímica — plan de trabajo

Pedido 2026-10-27: «curso de Fisicoquímica como los anteriores, con rigurosidad científica, fuentes confiables, ampliando el contenido hasta donde más se pueda».
Arquitectura de ConCode/termo (namespace EM, build.js, shot.js, MathJax, sims por capítulo). Acento verde-azulado #0B7A75.
Reutiliza `30-thermo.js` (EM.th: RRHO, EOS, lnKp, Clapeyron…) y `29-tablas.js` (agua/R-134a). Núcleo nuevo: `31-fq.js` (EM.fq) y `29-datos.js` (GENERADO por tools/gen_datos.py con Cantera/CoolProp/thermo).
Validación: `python tests/referencias.py` (Cantera, CoolProp, thermo, SciPy, mpmath) → `node tests/validar.js`.
Build: `node build.js` → dist/fisicoquimica.html (artefacto). Comprobar: `node tools/shot.js check [ids]`.

## Capítulos (id · título)
Parte I · Termodinámica química
1 potencial · Potencial químico y propiedades molares parciales
2 gasesreales · Gases reales: virial, fugacidad
3 termoquimica · Termoquímica
4 gibbs · Entropía absoluta, tercera ley y energía de Gibbs de reacción (Ellingham)
5 equilibrio · Equilibrio químico
6 acidobase · Equilibrio iónico en disolución acuosa (ácido–base, buffers, solubilidad, sistema CO2)
Parte II · Fases y disoluciones
7 fases · Equilibrio de fases en sustancias puras
8 raoult · Disoluciones ideales, Raoult y Henry, destilación
9 noideal · Disoluciones no ideales: actividad, exceso, Margules/Wilson/NRTL, azeótropos, LLE
10 coligativas · Propiedades coligativas
11 solido-liquido · Equilibrio sólido–líquido: eutécticos, diagramas binarios y ternarios
Parte III · Electroquímica
12 electrolitos · Disoluciones de electrolitos: Debye–Hückel, conductividad
13 celdas · Celdas galvánicas, Nernst, Pourbaix
14 electrodica · Cinética de electrodos: Butler–Volmer, doble capa, voltametría cíclica, corrosión
15 baterias · Baterías, celdas de combustible y electrólisis
Parte IV · Cinética química
16 velocidad · Leyes de velocidad
17 arrhenius · Temperatura, colisiones y estado de transición
18 mecanismos · Mecanismos de reacción (SSA, Lindemann, cadenas)
19 catalisis · Catálisis y enzimas
20 oscilaciones · Dinámica no lineal: oscilaciones químicas y patrones de Turing
21 disolucion-foto · Reacciones en disolución, transferencia de electrones (Marcus) y fotoquímica
Parte V · Estructura cuántica y espectroscopía
22 cuantica · Mecánica cuántica para químicos
23 atomos · Átomos
24 enlace · Enlace químico: H2+, H2, LCAO, Hückel
25 scf · Química computacional: Hartree–Fock en STO-3G
26 simetria · Simetría molecular
27 rotvib · Espectroscopía rotacional y vibracional
28 electronica · Espectroscopía electrónica, Franck–Condon, RMN
Parte VI · Termodinámica estadística
29 particion · Funciones de partición y propiedades termodinámicas
30 estatica-k · Constantes de equilibrio y velocidades desde la mecánica estadística
31 liquidos · Interacciones intermoleculares, líquidos y g(r)
Parte VII · Superficies y macromoléculas
32 superficies · Tensión superficial y capilaridad
33 adsorcion · Adsorción
34 coloides · Coloides y DLVO
35 polimeros · Macromoléculas y biomoléculas
Parte VIII · Transporte
36 cinetica-gas · Teoría cinética y propiedades de transporte
37 difusion · Difusión
38 bioenergetica · Bioenergética y membranas
Apéndices: A formulario · B validación · C bibliografía

## Estado
Hecho (2026-10-27/28): caps 1–21 con tests (1170/1170; Parte IV completa: 19 catálisis/MM/MWC/volcán en 39-fq-cat.js, 20 oscilaciones/Turing/Gray–Scott en 39-fq-osc.js, 21 disolución/Marcus/fotoquímica en 39-fq-fot.js (FQ.sol2); caps 1–18 con tests (924/924; Parte III electroquímica completa; Parte IV: 16 velocidad, 17 Arrhenius/colisiones/Eyring, 18 mecanismos con H2/O2 de Li et al. 2004 = 10 especies/29 reacciones, falloff Troe, criterio 2k1=k5[M] contra Cantera). Núcleo 38-fq-cin.js: K.mechBuild/mechRun/mechTime/critP. Núcleos añadidos: 34-fq-ele.js (BV, Gouy–Chapman, CV por diferencias finitas, Evans), electrolitos y Pitzer en 33-fq-sol.js. Herramientas: `node tools/probe.js <cap> <sim> '[{"id":val}]'` lee lecturas de una sim (requiere que la sim ya esté en el HTML del capítulo); `node tools/shot.js shot <cap> shots/x.png --sim <sim>`; `node tools/shot.js check <cap>`.
Núcleo: 31-fq.js (álgebra, EDO DP45 + Rosenbrock rígido, NASA/Cantera, equil() Gibbs, tt = tabla NBS 91 especies, born, debye, Ellingham, etoh), 32-fq-gas.js (Peng–Robinson mezclas, fugacidad, virial, haber), 33-fq-sol.js (ácido–base, solubilidad, agua de mar/PyCO2SYS, fases puras, Antoine+NRTL+VLE+McCabe, modelos G^E, LLE, Pitzer NaCl/coligativas, Henry).
Datos: tools/gen_datos.py (CoolProp, Cantera, thermo/IPDB, chemicals) + tools/datos_termo.py. Regenerar con `python tools/gen_datos.py` (escribe src/core/29-datos.js).
Flujo por capítulo: js sims → html (con la herramienta Write, NO heredoc de bash: falla con apóstrofes) → build → probe/node números → corregir texto (scripts Python con r"" para todo texto con LaTeX; `	` de 	imes se rompe en cadenas normales) → tests en tests/referencias.py + tests/validar.js (insertar antes de "
const out = {" / "
ref['psat_pr']") → check/shot.
Pitfalls: ChemSep NRTL b en K (τ=b/T); Cantera GRI s° a 1 atm (se convierte a 1 bar); pyscf no instala; la regla de oro: verificar cada cifra con node antes de escribirla.
Pendiente: caps 12–38, portada (hero propio), apéndices A (formulario), B (validación), C (bibliografía); publicar artefacto (Artifact, icono flask).


## Pendiente al 2026-10-28
Caps 1–38 hechos (1958 pruebas; 38 bioenergética (39-fq-bio.js: ATP, E°′, quimiosmosis, GHK, Hodgkin–Huxley validado con SciPy Radau); 37 difusión (39-fq-dif.js: Fick/Crank–Nicolson/permeación/Thiele/Nernst–Einstein; refs SciPy expm_multiply, solve_ivp, solve_bvp y CoolProp); 34 coloides/DLVO (39-fq-dlvo.js), 35 polímeros (39-fq-pol.js), 36 cinética de gases (39-fq-kin.js; viscosidad vs CoolProp); herramienta tests/ref_incremental.py N… regenera solo capítulos nuevos; 33 adsorción en 39-fq-ads.js; 33 adsorción en 39-fq-ads.js; 32 superficies en 39-fq-surf.js; Parte VI completa; 31 líquidos LJ-MC en 39-fq-liq.js; 30 equilibrio desde q y Saha en 39-fq-stat.js; 29 partición en 39-fq-stat.js (RRHO vs Cantera); Parte V completa; 28 electrónica/RMN en 39-fq-esp.js; 27 rotvib en 39-fq-rv.js; 26 simetría en 39-fq-sym.js validado con pymatgen): 22 cuántica (39-fq-qm.js), 23 átomos (39-fq-atom.js), 24 enlace (39-fq-bond.js), 25 Hartree–Fock (39-fq-scf.js + 29-basis.js generado por tools/gen_basis.py; RHF/UHF/DIIS, optimización del agua; validado con S&O, Crawford, Hehre–Pople). Quedan portada, apéndices y publicación ( 32–35 superficies/adsorción/coloides/polímeros; 36–38 cinética de gases/difusión/bioenergética), portada 00-inicio (aún con texto de termo), apéndices 97/98/99, publicar artefacto (icono flask).


## COMPLETO 2026-10-28
38 caps + portada + apéndices A/B/C, 141 sims, 1958 pruebas. Publicado: https://claude.ai/artifact/Y514dTrHbaNzU5qNmCZBLq
