# 👑 BRIEF DE INTEGRACIÓN PARA EL AGENTE DE PHYSICSAILAB.COM

**Destinatario:** Agente de Inteligencia Artificial (Antigravity / Cursor / Copilot) en el proyecto web `physicsailab.com`.  
**Cliente:** Mg. Manuel Alejandro Obando.  
**Objetivo:** Desplegar la plataforma ejecutiva de trading en vivo para el Reto FTMO 100k y VT Markets, conectada con el VPS mediante el túnel seguro HTTPS.

---

## 🎯 Requisitos Obligatorios del Cliente

1. **Cero Simuladores:** Eliminar por completo sliders de prueba, botones de "Modo Simulación", "Cargar Datos Demo" y presets ficticios. Todo debe consumir datos 100% reales de la API.
2. **Barra de Progreso de las Cuentas:**
   * **Meta Diaria (TP)**: Barra verde esmeralda. Al llegar al **90% - 100%**, cambia a **Dorado/Ámbar Brillante** con destello pulsante y etiqueta `🔒 ZONA DE CANDADO RECOMENDADO`.
   * **Freno de Pérdida (SL)**: Barra atenuada. Al llegar al **50% de consumo del SL**, cambia a **Naranja de Alerta** (`⚠️ ALERTA 50% SL CONSUMIDO`).
   * **Botones Interactivos de Candado**: Accionan el bloqueo remoto en el VPS.
3. **Desarrollo Diario (Métricas en Vivo):**
   * Saldo real, Equidad, Margen, PnL hoy en tiempo real, operaciones hoy (TPs, BEs, SLs), flotante y Win Rate.
4. **Calendario Histórico de Metas Cumplidas:**
   * Lista día a día que resalta los días que alcanzaron la meta de **+$350.00 USD** con la insignia dorada `🏆 META CUMPLIDA`.
5. **Calendario Macroeconómico de Alto Impacto:**
   * Tabla con las noticias clave de la semana (IPC, NFP, Elecciones, Tipos de Interés) para alertar de alta volatilidad en el Oro (XAUUSD).

---

## 📡 Especificación de la API en Vivo (Backend en VPS)

* **URL Base HTTPS (Cifrada con SSL Cloudflare):**  
  ```text
  https://terminals-riders-surrounded-gras.trycloudflare.com
  ```
* **CORS:** Totalmente habilitado (`Access-Control-Allow-Origin: *`). La llamada desde `https://physicsailab.com` funciona directo sin bloqueos.

### 1. `GET /api/all` (Endpoint Unificado Recomendado)
Devuelve todo el estado en una sola petición ligera:

```json
{
  "timestamp": "2026-11-07 01:19:55",
  "accounts": {
    "ftmo": {
      "tag": "ftmo",
      "etiqueta": "Reto FTMO 100k USD",
      "login": 1515194005,
      "balance": 100671.05,
      "equity": 100671.05,
      "currency": "USD",
      "pnl_total": 0.0,
      "trades": 0,
      "win_rate": 0.0,
      "target_tp": 350.0,
      "target_sl": 500.0,
      "tp_pct": 0.0,
      "sl_pct": 0.0,
      "is_candado_zone": false,
      "is_sl_warning": false,
      "locked": false,
      "open_positions": []
    },
    "vt": {
      "tag": "vtmarkets",
      "etiqueta": "VT Markets (Cuenta Real)",
      "login": 23083569,
      "balance": 4305.05,
      "equity": 9305.05,
      "currency": "USC",
      "pnl_total": 0.0,
      "target_tp": 2500.0,
      "target_sl": 5000.0,
      "tp_pct": 0.0,
      "sl_pct": 0.0,
      "locked": false
    }
  },
  "history": [
    {
      "date": "2026-11-06",
      "pnl": 350.55,
      "trades": 18,
      "wins": 18,
      "losses": 0,
      "win_rate": 100.0,
      "meta_cumplida": true,
      "status": "META_CUMPLIDA"
    }
  ],
  "calendar": [
    {
      "title": "Non-Farm Employment Change",
      "country": "USD",
      "date": "2026-11-06T08:30:00-05:00",
      "impact": "High",
      "forecast": "65K",
      "previous": "29K"
    }
  ]
}
```

### 2. `POST /api/candado` (Activar Candado Remoto)
* **Headers:** `Content-Type: application/json`
* **Body:**
  * Para FTMO: `{"account": "ftmo"}`
  * Para VT Markets: `{"account": "vt"}`
  * Para ambas: `{"account": "both"}`
* **Efecto:** Escribe el archivo `.lock` en el VPS. El bot de MT5 activa inmediatamente la `PAUSA_RIESGO` y no abre más operaciones hoy.

### 3. `POST /api/desbloquear` (Levantar Candado)
* **Headers:** `Content-Type: application/json`
* **Body:** `{"account": "ftmo"}` (o `"vt"`, o `"both"`)
* **Efecto:** Elimina el bloqueo y el bot reanuda su búsqueda de operaciones.

---

## 🛠️ Instrucción de Implementación para el Agente Web

1. Abre el archivo de ruta en `physicsailab.com` que maneja `/truetrading` (ej. `src/pages/truetrading.tsx`, `app/truetrading/page.tsx` o `public/truetrading/index.html`).
2. Mantén la cabecera de autenticación docente privada del proyecto (`← Volver a PhysicsAILab · 👑 Centro de Mando Docente`).
3. Reemplaza el cuerpo del dashboard por la plantilla limpia y moderna de `index.html` adjunta en este paquete.
4. Asegura que la variable de API use como valor por defecto:
   ```javascript
   const API_BASE = 'https://terminals-riders-surrounded-gras.trycloudflare.com';
   ```
5. Realiza un `fetch(API_BASE + '/api/all')` cada 3 segundos para refrescar en vivo las barras y métricas.
