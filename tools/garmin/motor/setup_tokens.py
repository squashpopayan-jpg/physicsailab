#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║   GARMIN SETUP — Primer login                           ║
║   Córrelo en TU PC, una vez (o cuando expiren tokens).  ║
╚══════════════════════════════════════════════════════════╝

Qué hace:
  1. Te pide email, contraseña y (si aplica) el código MFA de Garmin Connect
  2. Hace login y guarda los tokens en datos/garmin_tokens.json
  3. Verifica que la conexión funciona

No guarda tu contraseña en ningún lado. El archivo de tokens sí da acceso a tu
cuenta: trátalo como una contraseña (nunca a GitHub, nunca público).

Para el servidor: copia datos/garmin_tokens.json a la carpeta datos/ del servidor,
o pega su contenido en la variable de entorno GARMINTOKENS.

Uso:
    python motor/setup_tokens.py
"""

import os
import sys
from datetime import date
from getpass import getpass
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
try:  # respeta GARMIN_DATA_DIR si está en el .env
    for _line in (PROJECT_DIR / ".env").read_text(encoding="utf-8").splitlines():
        if _line.strip().startswith("GARMIN_DATA_DIR="):
            os.environ.setdefault("GARMIN_DATA_DIR", _line.split("=", 1)[1].strip().strip("\"'"))
except FileNotFoundError:
    pass
DATA_DIR =Path(os.getenv("GARMIN_DATA_DIR") or PROJECT_DIR / "datos").expanduser().resolve()
TOKEN_FILE = DATA_DIR / "garmin_tokens.json"
DATA_DIR.mkdir(parents=True, exist_ok=True)

for _stream in (sys.stdout, sys.stderr):
    try: _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

print("""
╔══════════════════════════════════════════════════════════╗
║   GARMIN SETUP — Primer login                           ║
╚══════════════════════════════════════════════════════════╝
""")

try:
    from garminconnect import (Garmin, GarminConnectAuthenticationError,
                               GarminConnectTooManyRequestsError)
except ImportError:
    print("❌ Instala dependencias:  pip install -r requirements.txt")
    sys.exit(1)

email    = input("📧 Email de Garmin Connect: ").strip()
password = getpass("🔑 Contraseña: ")

print("\n  🔄 Conectando con Garmin...")
try:
    g = Garmin(email=email, password=password, is_cn=False,
               prompt_mfa=lambda: input("🔐 Código MFA/2FA (o Enter si no tienes): ").strip())
    g.login(str(TOKEN_FILE))
    print(f"  ✅ Login exitoso. Tokens guardados en: {TOKEN_FILE}")
except GarminConnectTooManyRequestsError:
    print("\n❌ Demasiados intentos. Espera 15–30 minutos e intenta de nuevo.")
    sys.exit(1)
except GarminConnectAuthenticationError as e:
    print(f"\n❌ Credenciales incorrectas: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback; traceback.print_exc()
    sys.exit(1)
finally:
    password = None

print("\n  🧪 Verificando conexión...")
try:
    summary = g.get_user_summary(date.today().isoformat())
    print(f"  ✅ Pasos hoy: {summary.get('totalSteps', 0):,}")
except Exception as e:
    print(f"  ⚠️  Login correcto pero falló la lectura de prueba: {e}")

print(f"""
  ✅ Listo. Ahora puedes correr:
       python motor/garmin_training_system_v2.py --auto --no-upload

  Para el servidor, sube este archivo a su carpeta datos/:
       {TOKEN_FILE}
  La librería renueva el token sola; si algún día falla, repite este paso.
""")
