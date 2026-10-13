# Cuentas claras — psicología del dinero y finanzas personales

Curso interactivo en una sola página HTML: 25 capítulos en 5 partes, 5 apéndices,
79 simulaciones, datos históricos reales y cifras colombianas de octubre de 2026.
Elaborado por Mg. Manuel Alejandro Obando, Departamento de Física, Universidad del Cauca.

## Estructura

- `src/chapters/NN-id.html|js`: cada capítulo (plantilla HTML y simulaciones).
- `src/core/`: interfaz (panel de simulación, gráficas, formato colombiano de cifras, app).
- `src/lib/`: núcleo de cálculo sin DOM (valor del dinero en el tiempo, créditos, hogar,
  inversión, conducta, retiro, vivienda, impuestos, fraudes, datos), validado en Node.
- `src/lib/80-datos.js`: generado por `tests/datos.py` desde `docs/fuentes/`
  (Damodaran 1928-2025 y Banco Mundial para Colombia 1960-2025).
- `src/lib/85-ref.js`: referencias generadas por `tests/referencias.py`
  (numpy-financial, SciPy y la hoja original de Damodaran).

## Comandos

```
node build.js                       # genera dist/index.html y dist/cuentas-claras.html
node tests/validar.js               # 66 pruebas; escribe docs/VALIDACION.md
node tests/captura.js --out DIR --sims [--dark] [--w 390] id1 id2 ...   # revisión visual con Chrome sin interfaz
node serve.js 8786                  # servidor local de dist/
python tests/datos.py               # regenera los datos históricos
python tests/referencias.py         # regenera las referencias (requiere numpy-financial)
```

## Actualizar cada año

Las cifras colombianas están en `src/lib/70-impuestos.js` (objeto `L.tax.CO`), en el
apéndice A (`95-formulario.html`) y en los recuadros «En Colombia» de los capítulos
7, 8, 11, 12, 13, 15, 21 y 23: salario mínimo, UVT, usura, inflación, Fogafín,
semanas de pensión y estado de la reforma pensional (Ley 2381 de 2024).
