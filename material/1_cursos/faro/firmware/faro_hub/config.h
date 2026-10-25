// =====================================================================
//  FARO · configuración del hub
//  Sirve cualquier placa ESP32 con BLE (S3 Super Mini, C3 Super Mini,
//  XIAO, DevKit...). Se conecta al PC por USB o al celular por Bluetooth.
// =====================================================================
#pragma once

#define FARO_HUB_FW   "1.0.0"
#define CANAL_WIFI    1            // igual que en los pods
#define GRUPO         0            // igual que en los pods
#define PIN_BOTON     0            // botón BOOT: corto = empezar/parar, largo = identificar
#define MAX_PODS      12
#define NOMBRE_BLE    "Faro-Hub"
#define BALIZA_MS     500          // cada cuánto se anuncia el hub
#define POD_AUSENTE_MS 6000        // sin noticias de un pod → desconectado
