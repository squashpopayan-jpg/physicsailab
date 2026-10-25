// =====================================================================
//  FARO · protocolo de radio (ESP-NOW) entre el hub y los pods
//  ¡Este archivo debe ser IDÉNTICO en faro_pod/ y faro_hub/!
//  Todos los mensajes empiezan con la misma cabecera de 6 bytes.
// =====================================================================
#pragma once
#include <stdint.h>

#define FARO_MAGIA    0xFA
#define FARO_VERSION  1
#define POD_TODOS     0xFF     // destino "todos los pods"

enum TipoMsg : uint8_t {
  MSG_BALIZA      = 1,  // hub → difusión: "aquí está el hub" (cada 0,5 s)
  MSG_HOLA        = 2,  // pod → hub: estado del pod (cada 2 s)
  MSG_ENCENDER    = 3,  // hub → pod: enciende un color y espera el estímulo
  MSG_APAGAR      = 4,  // hub → pod: apaga y cancela la ronda
  MSG_CONFIG      = 5,  // hub → pod: umbrales y brillo
  MSG_IDENTIFICAR = 6,  // hub → pod: muestra su número
  MSG_DORMIR      = 7,  // hub → pod: sueño profundo
  MSG_CALIBRAR    = 8,  // hub → pod: vuelve a medir la línea base del electrodo
  MSG_EVENTO      = 9,  // pod → hub: estímulo detectado o tiempo agotado
};

// Sensores (máscara de bits)
#define SEN_GOLPE      0x01   // acelerómetro: golpe o impacto
#define SEN_TOQUE      0x02   // electrodo capacitivo: contacto con la piel
#define SEN_CERCA      0x04   // electrodo capacitivo: mano a pocos centímetros
#define SEN_DISTANCIA  0x08   // VL53L0X: objeto más cerca que dist_mm
#define SEN_TODOS      0x0F

// Qué hace el pod cuando termina la ronda
#define FIN_APAGAR     0
#define FIN_DESTELLO   1     // destello blanco corto y apaga
#define FIN_MANTENER   2     // deja el color (el hub lo apagará)

#define EV_TIEMPO      0     // tipo de evento: se agotó el tiempo de espera

#define NO_CAMBIAR8    0xFF
#define NO_CAMBIAR16   0xFFFF

typedef struct __attribute__((packed)) {
  uint8_t magia;     // FARO_MAGIA
  uint8_t version;   // FARO_VERSION
  uint8_t tipo;      // TipoMsg
  uint8_t pod;       // destino (hub → pod) u origen (pod → hub)
  uint16_t seq;      // contador del emisor
} Cabecera;

typedef struct __attribute__((packed)) {
  Cabecera c;
  uint8_t grupo;     // solo responden los pods del mismo grupo
  uint8_t activo;    // 1 si hay un ejercicio en curso (evita que los pods se duerman)
  uint32_t t_ms;
} MsgBaliza;

#define HOLA_USB       0x01   // cargador conectado
#define HOLA_BAT_BAJA  0x02

typedef struct __attribute__((packed)) {
  Cabecera c;
  uint8_t grupo;
  uint16_t vbat_mV;
  uint8_t carga_pct;
  uint8_t flags;       // HOLA_*
  uint8_t sensores;    // sensores presentes (SEN_*)
  uint8_t estado;      // 0 reposo, 1 armado, 2 modo solo
  uint8_t golpe_dg;    // umbral de golpe en décimas de g
  uint16_t toque_pm;   // umbral de toque en ‰
  uint16_t cerca_pm;   // umbral de cercanía capacitiva en ‰
  uint16_t dist_mm;    // umbral de cercanía óptica en mm
  uint8_t brillo;
  char fw[8];
} MsgHola;

typedef struct __attribute__((packed)) {
  Cabecera c;
  uint16_t ronda;      // identifica la ronda (el pod ignora duplicados)
  uint8_t r, g, b;
  uint8_t sensores;    // qué estímulos cuentan (SEN_*); 0 = solo mostrar el color
  uint16_t espera_ms;  // tiempo máximo de espera; 0 = sin límite
  uint16_t retardo_ms; // espera antes de encender
  uint8_t fin;         // FIN_*
} MsgEncender;

typedef struct __attribute__((packed)) {
  Cabecera c;
  uint8_t golpe_dg;    // NO_CAMBIAR8 para dejar el valor actual
  uint16_t toque_pm;   // NO_CAMBIAR16 para dejar el valor actual
  uint16_t cerca_pm;
  uint16_t dist_mm;
  uint8_t brillo;
} MsgConfig;

typedef struct __attribute__((packed)) {
  Cabecera c;
  uint8_t r, g, b;
} MsgIdentificar;

typedef struct __attribute__((packed)) {
  Cabecera c;
  uint16_t ronda;
  uint8_t tipo;         // SEN_* que disparó, o EV_TIEMPO
  uint32_t tr_us;       // tiempo de reacción medido en el pod (µs)
  uint16_t intensidad;  // golpe: pico en mg · táctil: ‰ · distancia: mm
} MsgEvento;

static inline void faroCabecera(Cabecera &c, uint8_t tipo, uint8_t pod, uint16_t seq) {
  c.magia = FARO_MAGIA;
  c.version = FARO_VERSION;
  c.tipo = tipo;
  c.pod = pod;
  c.seq = seq;
}

static inline bool faroValido(const uint8_t *d, int n) {
  return n >= (int)sizeof(Cabecera) && d[0] == FARO_MAGIA && d[1] == FARO_VERSION;
}

static_assert(sizeof(Cabecera) == 6, "cabecera de 6 bytes");
static_assert(sizeof(MsgHola) <= 250 && sizeof(MsgEncender) <= 250, "ESP-NOW admite hasta 250 bytes");
