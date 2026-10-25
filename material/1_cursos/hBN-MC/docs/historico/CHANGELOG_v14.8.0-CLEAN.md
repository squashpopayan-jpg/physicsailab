# Changelog — hBN-MC v14.8.0-CLEAN

## Base
Derivada de `hBN-MC v14.7.1-RC1-REGISTRO`. El RC1 permanece intacto en `reference/`.

## Cambios de ingeniería
1. Reorganización de los 9 módulos JavaScript por responsabilidad (`core`, `ui`, `io`, `geometry`, `simulation`, `view`).
2. Restauración de `assets/css/styles.css` en la distribución CLEAN; el ZIP RC1 usado como referencia no incluía ese archivo aunque `index.html` lo referenciaba.
3. Actualización de rutas de scripts en `index.html`.
4. Identidad visible actualizada a `v14.8.0-CLEAN` en interfaz y salidas principales.
5. JSZip 3.10.1 pasa a carga diferida bajo demanda; se elimina su carga bloqueante durante el arranque.
6. Se conserva la carga diferida de Three.js r128 y el fallback Canvas 3D.
7. Se añade una batería reproducible de pruebas (`npm test`) sin dependencias npm externas.
8. Inventario actualizado a 401 unidades nombradas por la incorporación de `ensureJSZipLoaded()`.

## No cambiado
- Hamiltoniano y fórmulas energéticas.
- Criterio de Metropolis.
- Parámetros científicos existentes.
- Política PBC corregida en Fase 12.
- Formatos científicos, salvo rótulos de versión de software.
- Esquema histórico `session.version='v10.4'`, cuya semántica sigue pendiente de formalización.

## Pendientes científicos heredados
- Revisión D3 / εBN.
- `EPS_XC=-70.41 eV` continúa como calibración provisional documentada.
