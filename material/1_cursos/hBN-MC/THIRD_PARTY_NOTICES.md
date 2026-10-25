# Componentes de terceros

## JSZip 3.10.1
La aplicación referencia JSZip 3.10.1 desde CDN únicamente cuando se solicita una exportación ZIP.
El proyecto JSZip declara licencia dual `(MIT OR GPL-3.0-or-later)`. Para fines de esta distribución se documenta la opción MIT.

## Three.js r128
La aplicación referencia Three.js r128 desde CDN para el visor 3D avanzado.
Three.js se distribuye bajo licencia MIT. La aplicación dispone de un fallback Canvas cuando la librería no puede cargarse.

## Observación
Las librerías anteriores no se incluyen como archivos JavaScript dentro de este paquete RELEASE; se descargan desde CDN bajo demanda. El código científico y de interfaz de hBN-MC permanece separado de estas dependencias.
