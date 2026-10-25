// =====================================================================
//  FARO hub · utilidades de texto: colores, sensores y argumentos
// =====================================================================
#pragma once

struct NombreColor {
  const char *n;
  Color c;
};
static const NombreColor COLORES[] = {
    {"rojo", {255, 0, 0}},      {"verde", {0, 255, 0}},       {"azul", {0, 60, 255}},     {"amarillo", {255, 170, 0}},
    {"cian", {0, 255, 255}},    {"magenta", {255, 0, 255}},   {"blanco", {255, 255, 255}}, {"naranja", {255, 70, 0}},
    {"morado", {130, 0, 255}},  {"rosa", {255, 40, 110}},     {"lima", {130, 255, 0}},
};
static const int N_COLORES = sizeof(COLORES) / sizeof(COLORES[0]);

static bool leerColor(const String &s, Color &c, bool &aleatorio) {
  aleatorio = false;
  if (s == "aleatorio") {
    aleatorio = true;
    c = COLORES[0].c;
    return true;
  }
  if (s.length() == 7 && s[0] == '#') {
    long v = strtol(s.c_str() + 1, nullptr, 16);
    c = {(uint8_t)(v >> 16), (uint8_t)(v >> 8), (uint8_t)v};
    return true;
  }
  for (auto &nc : COLORES)
    if (s == nc.n) {
      c = nc.c;
      return true;
    }
  return false;
}

static uint8_t leerSensores(const String &s) {
  if (s == "todos") return SEN_TODOS;
  uint8_t m = 0;
  if (s.indexOf("golpe") >= 0) m |= SEN_GOLPE;
  if (s.indexOf("toque") >= 0) m |= SEN_TOQUE;
  if (s.indexOf("cerca") >= 0) m |= SEN_CERCA;
  if (s.indexOf("dist") >= 0) m |= SEN_DISTANCIA;
  return m;
}

static String textoSensores(uint8_t m) {
  String s;
  if (m & SEN_GOLPE) s += "golpe,";
  if (m & SEN_TOQUE) s += "toque,";
  if (m & SEN_CERCA) s += "cerca,";
  if (m & SEN_DISTANCIA) s += "distancia,";
  if (s.length()) s.remove(s.length() - 1);
  return s;
}

static const char *nombreEvento(uint8_t tipo) {
  switch (tipo) {
    case SEN_GOLPE: return "golpe";
    case SEN_TOQUE: return "toque";
    case SEN_CERCA: return "cerca";
    case SEN_DISTANCIA: return "distancia";
    default: return "tiempo";
  }
}

// Argumentos "clave=valor" y posicionales
struct Args {
  String pos[4];
  int nPos = 0;
  String clave[12], valor[12];
  int nKv = 0;
  String operator()(const char *k, const char *def = "") const {
    for (int i = 0; i < nKv; i++)
      if (clave[i] == k) return valor[i];
    return def;
  }
  bool tiene(const char *k) const {
    for (int i = 0; i < nKv; i++)
      if (clave[i] == k) return true;
    return false;
  }
};

static Args partir(const String &resto) {
  Args a;
  int i = 0, n = resto.length();
  while (i < n) {
    while (i < n && resto[i] == ' ') i++;
    int j = i;
    while (j < n && resto[j] != ' ') j++;
    if (j > i) {
      String t = resto.substring(i, j);
      int k = t.indexOf('=');
      if (k > 0 && a.nKv < 12) {
        a.clave[a.nKv] = t.substring(0, k);
        a.valor[a.nKv] = t.substring(k + 1);
        a.nKv++;
      } else if (k < 0 && a.nPos < 4) {
        a.pos[a.nPos++] = t;
      }
    }
    i = j;
  }
  return a;
}

// Destino: número de pod o "*" (todos los conectados)
template <typename F>
static void paraCada(const String &dest, F f) {
  if (dest == "" || dest == "*") {
    for (auto &p : pods)
      if (p.usado && p.conectado) f(p);
    return;
  }
  Pod *p = porId(dest.toInt());
  if (p) f(*p);
  else salida("{\"ev\":\"error\",\"msg\":\"no hay pod %s\"}", dest.c_str());
}
