# hBN-MC v15.0.1

Simulador Monte Carlo de nanoporos en nitreto de boro hexagonal (h-BN) y
heteroestructuras h-BNC, basado en un modelo de enlaces parametrizado con
cálculos DFT (SIESTA).

**Autor del software:** Mg. Manuel Alejandro Obando Papamija — Departamento de
Física, Universidad del Cauca (Popayán, Colombia).
**Modelo y parámetros DFT:** tesis de maestría de M. A. Obando, FIMAT —
Universidade Federal de Ouro Preto (2019), orientador Prof. Ronaldo Junio
Campos Batista.

## Uso

La aplicación es una página web autónoma: no requiere instalación ni
compilación.

1. Abrir `index.html` en Chrome, Edge o Firefox, o
2. servirla localmente (recomendado para guardar archivos con diálogo):

```bash
python tools/start_server.py
```

y abrir `http://127.0.0.1:8000`.

Three.js (visor 3D) y JSZip (exportación ZIP) se cargan desde CDN solo cuando
se usan; el resto funciona sin conexión.

## Qué hace

* **Modelo de enlaces** E = Σ ε_αβ n_αβ con los parámetros de la tesis
  (Tablas 5.1, 5.7 y 5.8), editables con trazabilidad.
* **Monte Carlo Metropolis** con semilla reproducible, movimientos locales y
  globales, protocolos térmicos recocido / isotérmico / 3 fases / **ciclo**
  (histéresis) hasta 20 000 K.
* **Reservorio de hidrógeno** del modelo de la tesis o gran canónico respecto
  de H₂ con Δμ_H explícito.
* **Energía de formación** coherente (lámina perfecta = 0) con ventana química
  N-rica / B-rica y Δμ_H.
* **Estructuras**: poros geométricos (triángulos N/B, paralelogramos,
  hexágonos), redes aleatorias, h-BNC, nanocintas, constructor de
  heteroestructuras e importación XYZ / POSCAR / SIESTA XV / LAMMPS.
* **Modo LOTE**: réplicas independientes con estadística (IC95 con t de
  Student) e histograma de morfologías.
* **Pestaña INV (investigación)**: reajuste de parámetros por mínimos
  cuadrados con errores estándar y validación cruzada; energética de poros
  por forma y tamaño; barrido de temperatura con intercambio de réplicas y
  capacidad calorífica; calibración de ε_CH con nanocintas SIESTA; diagnóstico
  de la escala energética; orden de corto alcance (Warren–Cowley).
* **Exportación**: PNG, CSV autosuficientes (con todos los parámetros),
  sesión JSON, POSCAR, SIESTA XV, LAMMPS, vídeo y ZIP.

## Validación

Con Node.js ≥ 18:

```bash
npm test
```

Ejecuta 7 suites (motor, parches históricos, investigación, integración de la
aplicación completa, subsistemas, estrés PBC y estructura del paquete). Cada
suite devuelve código 1 si falla alguna prueba. Detalle en
`docs/VALIDACION.md`.

## Estructura

```
index.html            interfaz
assets/css/           estilos
src/core/             estado, red, energía, Monte Carlo, energía de formación
src/research/         herramientas de investigación (pestaña INV)
src/simulation/       modo LOTE
src/ui/               render 2D, controles, idiomas
src/io/               importación y exportación
src/geometry/         constructor de heteroestructuras
src/view/             visor 3D
tests/                suites de validación (npm test)
tools/                servidor local y generador de huellas SHA-256
docs/                 informe científico, revisión del artículo, validación,
                      arquitectura, manual y guía de registro
```

## Documentos

* `CHANGELOG.md` — cambios de v15 respecto de v14.8.0-CLEAN.
* `LIMITACIONES.md` — limitaciones conocidas y decisiones científicas abiertas.
* `docs/INFORME_CIENTIFICO.md` — validación del modelo y hallazgos.
* `docs/REVISION_ARTICULO.md` — revisión del manuscrito Obando & Batista.
* `docs/MANUAL_USUARIO.md` — guía de uso.
* `docs/REGISTRO_DNDA.md` — pasos para el registro de soporte lógico.

## Cita

Ver `CITATION.cff`. Cite también la tesis de la que procede el modelo.

## Licencia

Todos los derechos reservados. Autor y titular de los derechos patrimoniales:
Manuel Alejandro Obando Papamija (ver `LICENSE` y `docs/REGISTRO_DNDA.md`).
