# Física del Estado Sólido — plan de trabajo

Arquitectura de ConCode/optica (namespace EM, build.js, shot.js) + View3D de materiales.
Estado (2026-10-24): COMPLETO — 30 caps + apéndices A–D, 119 sims, 833/833 pruebas. Artefacto https://claude.ai/artifact/A4wdi6gFZUrRK2dTayQzGJ
Biblioteca científica: `src/core/29-lin.js` (álgebra lineal), `30-ss.js` y `31-ss2.js` (EM.ss),
`29-data.js` (tablas de datos), `29-xrd.js` (pymatgen), `35-draw.js` (dibujo), `36-crystal.js` (cristales 3D).
Validación: `python tests/referencias.py` (SciPy, mpmath, NumPy, ASE, spglib, pymatgen) → `node tests/validar.js`.

## Capítulos (id · título · simulaciones)
Parte I · Cristales
1 solido · El estado sólido · escalas, densidad de estados de átomos→bandas (N pozos), enlace
2 redes · Redes de Bravais y estructuras · visor 3D de estructuras, empaquetamiento, red 2D y celda primitiva, planos de Miller
3 reciproca · Red recíproca y zonas de Brillouin · red recíproca 2D, zonas de Brillouin n-ésimas, BZ 3D (fcc/bcc), planos y G
4 difraccion · Difracción de rayos X · Bragg, esfera de Ewald, factor de estructura/ausencias, patrón de polvo, factor atómico
5 enlace · El enlace cristalino · Lennard-Jones gas noble, Madelung/Ewald, Born–Mayer, tendencias de cohesión

Parte II · Vibraciones de la red
6 cadena · La cadena lineal · cadena monoatómica animada, diatómica, velocidad de grupo, cadena con vecinos lejanos
7 fonones3d · Fonones en tres dimensiones · dispersión fcc, densidad de estados, dispersión de neutrones, modos cuantizados
8 calor · Calor específico de la red · Einstein vs Debye, ley T³, θ_D a partir de datos, DOS de Debye vs real
9 anarmonico · Efectos anarmónicos · dilatación térmica (Morse), Grüneisen, conductividad térmica (Umklapp), segundo sonido?

Parte III · Electrones en sólidos
10 drude · El modelo de Drude · gas clásico/colisiones, efecto Hall, σ(ω) y reflectividad, Wiedemann–Franz
11 sommerfeld · El gas de Fermi · esfera de Fermi, f(E,T) y μ(T), calor específico electrónico, emisión termoiónica
12 bloch · Teorema de Bloch y Kronig–Penney · funciones de Bloch, Kronig–Penney, bandas de N pozos → banda
13 casilibre · Electrones casi libres · red vacía, brecha en el borde de zona, ecuación central, red vacía fcc
14 enlacefuerte · Enlace fuerte · cadena TB, red cuadrada y DOS, grafeno, modelo SSH
15 bandas · Bandas reales: metales, aislantes y semiconductores · llenado de bandas, pseudopotencial Si/Ge/GaAs, superficie de Fermi 2D
16 dinamica · Dinámica semiclásica · paquete en banda, masa efectiva, oscilaciones de Bloch, huecos
17 campo · Electrones en campo magnético · órbitas ciclotrón, niveles de Landau, dHvA, Hall cuántico, mariposa de Hofstadter

Parte IV · Semiconductores
18 intrinseco · Semiconductores intrínsecos · Eg(T), n_i(T), DOS·f, masa efectiva
19 dopado · Dopaje · donador hidrogenoide, nivel de Fermi vs T, regímenes n(T), compensación
20 transporte · Transporte en semiconductores · movilidad vs dopaje/T, Haynes–Shockley, recombinación, Hall
21 union · La unión p–n · Poisson numérico vs agotamiento, diodo de Shockley, capacitancia
22 dispositivos · Dispositivos · celda solar y Shockley–Queisser, LED, MOSFET, BJT
23 nano · Heteroestructuras y nanoestructuras · pozos cuánticos, DOS por dimensión, puntos cuánticos, superredes

Parte V · Respuesta dieléctrica y óptica
24 dielectrico · Propiedades dieléctricas · Clausius–Mossotti, oscilador de Lorentz, LST y reststrahlen, polaritones, ferroeléctricos (Landau)
25 optica · Propiedades ópticas · plasma y reflectividad de metales, absorción interbanda, excitones, plasmones

Parte VI · Magnetismo
26 para · Diamagnetismo y paramagnetismo · Brillouin, reglas de Hund, Pauli/Landau, desmagnetización adiabática
27 ferro · Ferromagnetismo · campo medio de Weiss, Ising Monte Carlo, Curie–Weiss, intercambio
28 magnones · Ondas de espín, antiferromagnetismo y dominios · magnones, ley T^{3/2}, AFM, Stoner–Wohlfarth

Parte VII · Superconductividad y defectos
29 super · Superconductividad · Meissner/London, BCS gap, GL tipo I/II, Josephson
30 defectos · Defectos y desorden · vacancias, difusión, dislocaciones, localización de Anderson, cuasicristales

Apéndices: A formulario · B datos · C validación · D bibliografía
