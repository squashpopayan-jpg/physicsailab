# TrueTrading Web Dashboard & API

Paquete completo para visualizar el progreso diario (TP y SL) de tus cuentas de trading (FTMO 100k y VT Markets Cent) e interactuar poniendo o levantando candados de forma remota desde cualquier página web o navegador.

---

## 📁 Archivos Incluidos

1. **`index.html`**: Panel web completo, responsive y en modo oscuro (Tailwind CSS).
   * Barras de progreso dinámicas con animaciones.
   * **Zona 90-100% Candado**: Iluminación dorada pulsante.
   * **Zona 50% Stop Loss**: Alerta naranja/roja.
   * **Botones de Candado interactivos**: Permiten bloquear o desbloquear FTMO, VT Markets o ambas cuentas desde la web.
2. **`web_server.py`**: Servidor REST API en Python puro (sin dependencias externas).
   * Lee en tiempo real los snapshots generados por TrueTrading.
   * Escribe y elimina los archivos `.lock` de candado cuando pulsas los botones en la web.
   * Soporta CORS completo para que puedas alojar el frontend en cualquier dominio web externo (ej. `mi-web.com`).
3. **`widget.js`**: Componente integrable en 1 sola línea para incrustar el monitor en WordPress, Elementor, PHP, React o cualquier sitio existente.
4. **`Iniciar_Web_Dashboard.bat`**: Doble clic para arrancar el servidor web local y abrir el panel en tu navegador.

---

## 🚀 Cómo Usarlo

### Modo 1: Uso directo en tu VPS o PC local
1. Haz doble clic en `Iniciar_Web_Dashboard.bat` en tu Escritorio.
2. Se abrirá automáticamente tu navegador en `http://localhost:8080`.
3. Verás el progreso en vivo y podrás activar candados con un solo clic.

### Modo 2: Integrarlo en tu propia página web (WordPress, PHP, React, etc.)
1. El servidor `web_server.py` debe estar corriendo en tu VPS o máquina con MT5 (en el puerto 8080 o el puerto que elijas).
2. En tu página web externa, puedes:
   * **Opción A (Incrustar el Widget)**:
     ```html
     <div id="truetrading-widget" data-api="http://TU_IP_O_DOMINIO:8080"></div>
     <script src="widget.js"></script>
     ```
   * **Opción B (Copiar el código de `index.html`)**:
     Sube `index.html` a tu hosting y en la barra inferior escribe la URL de tu API (ej: `http://TU_IP_O_DOMINIO:8080`).

---

## 📡 Endpoints de la API REST

* **`GET /api/status`**: Devuelve el estado en tiempo real, balance, equidad, PnL del día, porcentajes de TP/SL, zonas de alerta y estado de los candados.
* **`POST /api/candado`**:
  * Body: `{"account": "ftmo"}` (o `"vt"`, o `"both"`)
  * Activa el candado de inmediato en el bot de trading correspondiente.
* **`POST /api/desbloquear`**:
  * Body: `{"account": "ftmo"}` (o `"vt"`, o `"both"`)
  * Levanta el candado y reanuda la búsqueda de entradas.
