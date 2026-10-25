# Revisión del manuscrito “Estabilidade dependente da temperatura de nanoporos em nitreto de boro hexagonal: uma abordagem de modelo de ligações com Monte Carlo” (Obando & Batista)

Revisión técnica del PDF en portugués (14 páginas), contrastada con la tesis
(FIMAT-UFOP 2019), con el código Fortran del Apéndice y con hBN-MC v15.0.1.
Las comprobaciones numéricas se reproducen con la aplicación (pestaña INV) y
con `npm test`. Se ordenan por gravedad. Donde conviene, se propone texto en
portugués.

---

## A. Problemas que un revisor detectará (corregir antes de enviar)

### A1. Qué se ajustó y sobre cuántas estructuras (Resumen, §2.2, Conclusiones)
El resumen dice “Ajustamos seis energias de interação —B-N, B-H, N-H, C-C, C-N
e C-B— por mínimos quadrados sobre vinte e sete estruturas”, y las
conclusiones repiten “seis parâmetros ajustados sobre vinte e sete estruturas”.
Según la tesis (§5.2 y Tabla 5.8), el ajuste por mínimos cuadrados determina
**N–N, B–N, B–B, C–C, C–N y C–B sobre las 20 estructuras de Mazzoni**; B–H y
N–H se obtienen **aparte**, promediando poros triangulares (Tablas 5.6–5.7).
La Tabla 2 del propio artículo lista ocho parámetros.

> *Texto sugerido:* “Ajustamos por mínimos quadrados as energias de ligação
> N–N, B–N, B–B, C–C, C–N e C–B sobre as vinte estruturas BxCyNz de Mazzoni
> et al. [15] e obtivemos as energias B–H e N–H a partir de supercélulas de
> h-BN com poros triangulares de terminação B–H e N–H.”

Reportar además la calidad del ajuste, que hoy no aparece: RMS = 0,63 eV por
célula de 8 átomos (0,079 eV/átomo), resíduo máximo 1,19 eV, R² = 0,99996,
RMS de validação cruzada leave-one-out = 0,90 eV, e os erros-padrão de cada
parâmetro (0,07–0,30 eV). Todos se obtienen con INV → *Reajuste*.

### A2. La “validación” de la Tabla 3 es circular
El texto afirma que las cinco estructuras con poros “não fizeram parte do
ajuste”. Pero los poros triangulares NH y BH son precisamente las estructuras
de las que se extrajeron ε_NH y ε_BH (Tabla 5.6 de la tesis). Solo los poros
hexagonales (Tabla 5.5) son independientes de los parámetros de H. Hay que:
(i) retirar la afirmación; (ii) presentar como validación independiente solo
los hexágonos o nuevas estructuras; (iii) añadir la validación cruzada
leave-one-out del ajuste principal.

### A3. La métrica “< 0,01 %” oculta errores de varios eV
Sobre energías totales de ~45 000 eV, 0,01 % son 4,5 eV, un error enorme
frente a las diferencias que determinan la morfología (y frente a k_BT). Hay
que reportar errores **por átomo o por enlace** y el error absoluto máximo.

### A4. La Tabla 3 no es reproducible con los parámetros de la Tabla 2
* Con ε_BN = −128,16 eV (Tabla 2): 351·(−128,1626) + 6·(−109,80) =
  −45 643,9 eV, no −45 906,1 eV como indica la tabla (262 eV de diferencia).
  La columna “E_modelo” solo se reproduce con ε_BN = E(BN)/3 = −128,9067 eV.
  El artículo usa, sin decirlo, dos valores distintos de ε_BN (defecto D3).
* Filas y columnas están desplazadas (la extracción del PDF muestra, por
  ejemplo, “(II) NH 240 342 6 −44539,35”, y −44539,35 es la energía del poro
  (I)BH en la Tabla 5.4 de la tesis). Con ε_BN = E(BN)/3, −44539,35 eV solo
  da un ε_BH físico (−50,36 eV) con 342 enlaces B–N y 9 B–H, no con 351 y 6
  (+117,8 eV). Ver `docs/INFORME_CIENTIFICO.md` §5 para todos los
  emparejamientos.
* En la Tabla 5.3 de la tesis las etiquetas “terminação N / B” de los poros
  hidrogenados parecen intercambiadas.

**Acción:** re-extraer las energías de las salidas de SIESTA, rehacer la
Tabla 3 con columnas N_átomos, n_BN, n_NH, n_BH, E_DFT, E_modelo, erro
(eV/átomo), y declarar qué ε_BN se usa. Lo ideal es un ajuste global único
(INV → *Reajuste*, estructuras adicionales en CSV) que resuelva D3.

### A5. Temperaturas y la afirmación sobre 700 °C (§3.3)
El artículo compara con los HRTEM a 500–900 °C y concluye “A transição ocorre
em torno de 700 °C, e nossas simulações a reproduzem bem”, pero las
simulaciones usan 9800 K y un ciclo hasta 20 000 K. En este modelo un
intercambio B↔N cuesta 6,24 eV (aceptación 5×10⁻⁷ a 5000 K) y el avance de un
borde ~18 eV; las temperaturas son un **parámetro de control**, no
temperaturas físicas, y no existe una correspondencia calibrada entre ambas.
La afirmación debe retirarse o reformularse:

> *Texto sugerido:* “As temperaturas de simulação são parâmetros efetivos do
> amostrador: como os ε absorvem energias atômicas totais, os movimentos
> elementares custam dezenas de eV. A comparação com os experimentos HRTEM é,
> portanto, qualitativa e se baseia na ordem relativa das energias de formação
> das geometrias de poro.”

Para una comparación cuantitativa, usar la energía de formación de cada forma
frente a μ_N (INV → *Energética de poros*), que no depende de la escala de T.

### A6. Términos del Hamiltoniano que no se describen
La ecuación (1) y la Tabla 2 no incluyen:
* el término vacancia–vacancia ε_XX = E(H₂)/2 = −15,031 eV que usa el
  código; equivale a un potencial químico implícito del H de E(H₂)/4, y con
  él la energía de borde por H es −8,46 eV, es decir, **el modelo favorece
  fragmentar los poros en monovacancias**;
* en la aplicación, la penalización estérica H–H (K = 35 eV por par), que es
  lo único que impide esa fragmentación (experimento en
  `docs/INFORME_CIENTIFICO.md` §3.2).

Ambos deben declararse. Se recomienda presentar los resultados en el
ensamble gran canónico respecto de H₂ con Δμ_H explícito (reservorio *H₂* de
la aplicación): con Δμ_H = −1,5 eV y sin ninguna penalización empírica el poro
triangular permanece compacto a 5000 K y a 10 000 K se fragmenta parcialmente
(el fragmento mayor es un paralelogramo de 14 vacancias).

### A7. El listado Fortran del Apéndice de la tesis
En la subrutina `calculo_energia` (línea 382 del listado impreso) los términos
X–B, X–N y X–X aparecen detrás del carácter de comentario `!`. Si el fuente
era así, esa versión solo contaba enlaces N–N, B–N y B–B. Hay que confirmar
qué versión produjo las Figuras 3–5 y 8 (que vienen de la tesis) antes de
atribuirlas al modelo de la ecuación (1).

### A8. Potenciales químicos (ecuación 4)
El artículo no da los valores de μ usados. Con la Tabla 1,
E(NH₃) + E(BH₃) − 3E(H₂) = −388,06 eV < E(BN) = −386,72 eV: con
μ_H = E(H₂)/2 la lámina es menos estable que NH₃ + BH₃, y la ventana de
μ_N entre los límites “rico em N” y “rico em B” está **vacía** (solo se abre
para Δμ_H ≤ −0,22 eV). Esto debe discutirse (¿convergencia de la referencia
de H₂?) y las energías de formación deben presentarse como función de μ_N y
Δμ_H.

### A9. Tabla 1: ¿moléculas o láminas?
El texto llama “moléculas simples” a BN y C2, pero sus energías
(−386,72 y −324,68 eV) son más negativas que 3ε_BN y 3ε_CC, lo que solo es
coherente si son la lámina h-BN y el grafeno por unidad de fórmula. Aclararlo;
cambia la interpretación de μ_BN.

---

## B. Metodología incompleta

* **Detalles DFT.** Faltan base (DZ/DZP), pseudopotenciales, mesh cutoff,
  malla de puntos k, tamaño de supercelda y vacío, polarización de espín,
  criterio de convergencia SCF. Solo se indica 0,05 eV/Å.
* **Tamaño de red, número de vacancias, semilla y número de réplicas** en cada
  figura. Ningún resultado de morfología debería basarse en una sola
  trayectoria: usar el modo LOTE (≥ 20 réplicas, IC95 con t de Student).
* **Histéresis (Fig. 5).** Un solo ciclo; repetir con varias semillas y
  velocidades de rampa, y mostrar ambas ramas (la aplicación dibuja E(T) con
  calentamiento y enfriamiento en colores distintos).
* **Distancia de enlace.** La ecuación (5) usa 1,42 Å; el código (Fortran y
  aplicación) usa 1,44 Å. Unificar (la B–N experimental en h-BN es 1,45 Å).
* **Segregación (§3.4).** Sustituir el argumento cualitativo por el criterio
  cuantitativo ΔE_mix = (ε_CN + ε_CB) − (ε_CC + ε_NB) = +0,45 eV por par de
  enlaces mixtos, y cuantificar la segregación con el parámetro de
  Warren–Cowley α_C (INV → *Análisis*).
* **Disponibilidad de código y datos.** Añadir una sección con el software
  (hBN-MC v15.0.1, repositorio y DOI de Zenodo cuando exista) y los CSV de
  cada figura (la aplicación los genera con todos los parámetros en la
  cabecera).

## C. Forma y referencias

* Figura 7 vacía con la leyenda “Enter Caption”: eliminarla y renumerar.
* Notas en español dentro de la bibliografía ([2] “Citado como Tokoyama2015
  en el artículo…”, [4], [19]): eliminarlas.
* [18] D'Souza *et al.* (J. Phys.: Condens. Matter 29, 425503, 2017) es un
  estudio de primeros principios de monocapas CxBN; el texto lo cita como
  combinación de modelo de enlaces con Monte Carlo. Verificar la referencia
  correcta.
* [16] Martins & Chacham: ACS Nano **5**(1), 385–393 corresponde a 2011
  (publicación en línea en 2010). Unificar año y volumen.
* [10] y [12]: verificar datos bibliográficos completos (autores, páginas).
* “Metrópolis” → “Metropolis”; revisar saltos de línea del título.
* Añadir la afiliación actual del primer autor (Departamento de Física,
  Universidad del Cauca).

## D. Qué aporta la versión 15 al artículo

| Necesidad del artículo | Herramienta en hBN-MC v15 |
|---|---|
| Barras de error de los parámetros | INV → Reajuste (σ, correlación, LOO) |
| Ajuste global que resuelva D3 | INV → Reajuste con estructuras en CSV y parámetros fijos/libres |
| Forma de poro más estable vs ambiente | INV → Energética de poros (E_form vs μ_N, Δμ_H) |
| Transiciones con T y equilibrado | INV → Barrido con intercambio de réplicas; C_v por fluctuaciones |
| Histéresis | CTRL → modo Ciclo + gráfica E(T); LOTE con semillas |
| Segregación cuantitativa | INV → Análisis (α_C, f_BN) |
| Calibración C–H | INV → Calibración ε_CH con nanocintas SIESTA |
| Reproducibilidad | Semillas, CSV autosuficientes, sesión con esquema versionado |
