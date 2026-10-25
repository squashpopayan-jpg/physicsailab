// =====================================================================
//  FARO hub · salida por USB y Bluetooth LE (servicio UART de Nordic)
// =====================================================================
#pragma once

#define NUS_SERVICIO "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_RX       "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"   // el celular escribe aquí
#define NUS_TX       "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"   // el hub notifica aquí

static BLECharacteristic *bleTx = nullptr;
static volatile bool bleConectado = false;
struct Trozo {
  uint8_t n;
  char t[100];
};
static QueueHandle_t colaBle = nullptr;
static volatile uint32_t bleUltimo_ms = 0;

static void bleEnviar(const char *s, size_t n) {
  if (!bleConectado || !bleTx) return;
  for (size_t i = 0; i < n; i += 20) {      // 20 bytes: funciona con cualquier MTU
    size_t k = min((size_t)20, n - i);
    bleTx->setValue((uint8_t *)s + i, k);
    bleTx->notify();
    delay(3);
  }
}

static void salida(const char *fmt, ...) {
  char buf[300];
  va_list ap;
  va_start(ap, fmt);
  int n = vsnprintf(buf, sizeof(buf) - 2, fmt, ap);
  va_end(ap);
  if (n < 0) return;
  n = min(n, (int)sizeof(buf) - 2);
  buf[n++] = '\n';
  buf[n] = 0;
  Serial.write((const uint8_t *)buf, n);
  bleEnviar(buf, n);
}

class AlServidor : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { bleConectado = true; }
  void onDisconnect(BLEServer *) override {
    bleConectado = false;
    BLEDevice::startAdvertising();
  }
};

class AlEscribir : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String v = c->getValue();
    for (size_t i = 0; i < v.length(); i += sizeof(Trozo::t)) {
      Trozo t;
      t.n = min(v.length() - i, sizeof(t.t));
      memcpy(t.t, v.c_str() + i, t.n);
      xQueueSend(colaBle, &t, 0);
    }
    bleUltimo_ms = millis();
  }
};

static void bleIniciar() {
  colaBle = xQueueCreate(12, sizeof(Trozo));
  BLEDevice::init(NOMBRE_BLE);
  BLEDevice::setMTU(185);
  BLEServer *srv = BLEDevice::createServer();
  srv->setCallbacks(new AlServidor());
  BLEService *svc = srv->createService(NUS_SERVICIO);
  bleTx = svc->createCharacteristic(NUS_TX, BLECharacteristic::PROPERTY_NOTIFY);
#if defined(CONFIG_BLUEDROID_ENABLED)
  bleTx->addDescriptor(new BLE2902());
#endif
  BLECharacteristic *rx =
      svc->createCharacteristic(NUS_RX, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  rx->setCallbacks(new AlEscribir());
  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(NUS_SERVICIO);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
}
