import os
import sys
import time
import re
import json
import subprocess
import urllib.request
import requests

BASE_DIR = r"C:\Users\Administrator\Desktop\TrueTrading_Web_Dashboard"
CLOUDFLARED_BIN = os.path.join(BASE_DIR, "cloudflared.exe")

def is_port_in_use(port=8080):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def start_web_server():
    if not is_port_in_use(8080):
        print("Iniciando servidor local web_server.py en puerto 8080...")
        subprocess.Popen(
            [sys.executable, os.path.join(BASE_DIR, "web_server.py")],
            cwd=BASE_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
        )
        time.sleep(1.5)
    else:
        print("Servidor web_server.py ya está escuchando en el puerto 8080.")

def run_tunnel():
    start_web_server()

    if not os.path.exists(CLOUDFLARED_BIN):
        print("Error: No se encontró cloudflared.exe en", CLOUDFLARED_BIN)
        sys.exit(1)

    print("Iniciando túnel seguro HTTPS con Cloudflare...")
    cmd = [CLOUDFLARED_BIN, "tunnel", "--url", "http://localhost:8080"]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    # Read stderr to extract the public URL
    start_time = time.time()
    while time.time() - start_time < 20:
        line = proc.stderr.readline()
        if not line and proc.poll() is not None:
            break
        if line:
            # print(line.strip())
            match = pattern.search(line)
            if match:
                tunnel_url = match.group(0)
                break

    if not tunnel_url:
        print("No se pudo obtener la URL de Cloudflare en 20 segundos.")
        sys.exit(1)

    print("=" * 70)
    print(" ¡TÚNEL HTTPS ACTIVO Y CONECTADO CON ÉXITO!")
    print("=" * 70)
    print(f" URL PÚBLICA SEGURA:  {tunnel_url}")
    print("=" * 70)

    # Save to files
    url_file = os.path.join(BASE_DIR, "URL_PUBLICA_HTTPS.txt")
    desktop_file = r"C:\Users\Administrator\Desktop\URL_PARA_PHYSICSAILAB.txt"
    for fp in [url_file, desktop_file]:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(tunnel_url.strip())

    # Send to Manuel via Telegram
    try:
        cred_path = r"C:\Users\Administrator\Desktop\TrueTrading_Listo_Para_VPS\quant_trading\secrets\telegram_truetrading.json"
        if os.path.exists(cred_path):
            with open(cred_path, "r", encoding="utf-8") as f:
                creds = json.load(f)
            token = creds.get("token")
            chat_id = creds.get("chat_id")
            
            tg_msg = (
                f"🌐 <b>ENLACE HTTPS PARA TU WEB (PhysicsAILab)</b>\n\n"
                f"Tu servidor de MetaTrader 5 ya está conectado a internet con cifrado seguro SSL:\n\n"
                f"🔗 <code>{tunnel_url}</code>\n\n"
                f"<b>Instrucciones para activar tu móvil:</b>\n"
                f"1. Abre <a href='https://physicsailab.com/truetrading'>physicsailab.com/truetrading</a> en tu teléfono.\n"
                f"2. En la parte inferior, donde dice <i>Configurar URL de Servidor API</i>, pega esa URL exacta:\n"
                f"   <code>{tunnel_url}</code>\n"
                f"3. Pulsa <b>Guardar</b>.\n\n"
                f"¡Y listo! Tu web mostrará en vivo tus balances, barras doradas y podrás accionar candados desde el móvil."
            )
            url_api = f"https://api.telegram.org/bot{token}/sendMessage"
            requests.post(url_api, data={"chat_id": chat_id, "text": tg_msg, "parse_mode": "HTML"}, timeout=5)
            print("Notificación enviada a Telegram con la URL pública.")
    except Exception as ex:
        print("Aviso al notificar a Telegram:", ex)

    # Keep tunnel running
    try:
        proc.wait()
    except KeyboardInterrupt:
        print("\nDeteniendo túnel...")
        proc.terminate()

if __name__ == "__main__":
    run_tunnel()
