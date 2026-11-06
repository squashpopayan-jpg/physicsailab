import os
import sys
import json
import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

# Ruta base hacia la carpeta results de TrueTrading
RESULTS_DIR = r"C:\Users\Administrator\Desktop\TrueTrading_Listo_Para_VPS\quant_trading\results"
if not os.path.exists(RESULTS_DIR):
    RESULTS_DIR = r"C:\Asesor_Oro\quant_trading\results"

PORT = 8080

class DashboardHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilitar CORS completo para integración con sitios web externos
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            self.handle_api_status()
        else:
            # Servir archivos estáticos del directorio actual
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/candado":
            self.handle_api_candado()
        elif parsed.path == "/api/desbloquear":
            self.handle_api_desbloquear()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'{"error": "Ruta no encontrada"}')

    def handle_api_status(self):
        data = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "accounts": {}
        }

        # 1. Leer snapshot de FTMO
        f_ftmo = os.path.join(RESULTS_DIR, "snapshot_ftmo.json")
        lock_ftmo = os.path.join(RESULTS_DIR, "candado_ftmo.lock")
        is_locked_ftmo = False
        if os.path.exists(lock_ftmo):
            try:
                with open(lock_ftmo, "r", encoding="utf-8") as lf:
                    is_locked_ftmo = json.load(lf).get("locked", False)
            except Exception:
                is_locked_ftmo = True

        if os.path.exists(f_ftmo):
            try:
                with open(f_ftmo, "r", encoding="utf-8") as sf:
                    snap = json.load(sf)
                pnl = snap.get("pnl_neto", 0.0)
                flotante = snap.get("flotante", 0.0)
                tot = pnl + flotante
                tp_target = 350.0
                sl_limit = 500.0

                tp_pct = min(100.0, max(0.0, (tot / tp_target) * 100.0)) if tot > 0 else 0.0
                sl_pct = min(100.0, max(0.0, (abs(tot) / sl_limit) * 100.0)) if tot < 0 else 0.0

                data["accounts"]["ftmo"] = {
                    "tag": "ftmo",
                    "etiqueta": snap.get("etiqueta", "Reto FTMO 100k"),
                    "login": snap.get("login"),
                    "balance": snap.get("balance", 100000.0),
                    "equity": snap.get("equity", 100000.0),
                    "currency": snap.get("currency", "USD"),
                    "pnl_neto": pnl,
                    "flotante": flotante,
                    "pnl_total": round(tot, 2),
                    "trades": snap.get("total_trades", 0),
                    "win_rate": snap.get("win_rate", 0.0),
                    "target_tp": tp_target,
                    "target_sl": sl_limit,
                    "tp_pct": round(tp_pct, 1),
                    "sl_pct": round(sl_pct, 1),
                    "is_candado_zone": tp_pct >= 90.0,
                    "is_sl_warning": sl_pct >= 50.0,
                    "locked": is_locked_ftmo,
                    "open_positions": snap.get("open_positions", [])
                }
            except Exception as ex:
                data["accounts"]["ftmo"] = {"error": str(ex)}

        # 2. Leer snapshot de VT Markets
        f_vt = os.path.join(RESULTS_DIR, "snapshot_vtmarkets.json")
        lock_vt = os.path.join(RESULTS_DIR, "candado_vtmarkets.lock")
        is_locked_vt = False
        if os.path.exists(lock_vt):
            try:
                with open(lock_vt, "r", encoding="utf-8") as lf:
                    is_locked_vt = json.load(lf).get("locked", False)
            except Exception:
                is_locked_vt = True

        if os.path.exists(f_vt):
            try:
                with open(f_vt, "r", encoding="utf-8") as sf:
                    snap = json.load(sf)
                pnl = snap.get("pnl_neto", 0.0)
                flotante = snap.get("flotante", 0.0)
                tot = pnl + flotante
                tp_target = 2500.0
                sl_limit = 5000.0

                tp_pct = min(100.0, max(0.0, (tot / tp_target) * 100.0)) if tot > 0 else 0.0
                sl_pct = min(100.0, max(0.0, (abs(tot) / sl_limit) * 100.0)) if tot < 0 else 0.0

                data["accounts"]["vt"] = {
                    "tag": "vtmarkets",
                    "etiqueta": snap.get("etiqueta", "VT Markets Real"),
                    "login": snap.get("login"),
                    "balance": snap.get("balance", 0.0),
                    "equity": snap.get("equity", 0.0),
                    "currency": snap.get("currency", "USC"),
                    "pnl_neto": pnl,
                    "flotante": flotante,
                    "pnl_total": round(tot, 2),
                    "trades": snap.get("total_trades", 0),
                    "win_rate": snap.get("win_rate", 0.0),
                    "target_tp": tp_target,
                    "target_sl": sl_limit,
                    "tp_pct": round(tp_pct, 1),
                    "sl_pct": round(sl_pct, 1),
                    "is_candado_zone": tp_pct >= 90.0,
                    "is_sl_warning": sl_pct >= 50.0,
                    "locked": is_locked_vt,
                    "open_positions": snap.get("open_positions", [])
                }
            except Exception as ex:
                data["accounts"]["vt"] = {"error": str(ex)}

        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def handle_api_candado(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            req = json.loads(body.decode("utf-8"))
        except Exception:
            req = {}

        target = req.get("account", "both").lower()
        today_str = str(datetime.date.today())
        time_str = datetime.datetime.now().strftime("%H:%M:%S")

        tags_to_lock = []
        if target in ("ftmo", "both"):
            tags_to_lock.append("ftmo")
        if target in ("vt", "vtmarkets", "both"):
            tags_to_lock.append("vtmarkets")

        for tag in tags_to_lock:
            lock_f = os.path.join(RESULTS_DIR, f"candado_{tag}.lock")
            with open(lock_f, "w", encoding="utf-8") as lf:
                json.dump({
                    "locked": True,
                    "date": today_str,
                    "time": time_str,
                    "tag": tag,
                    "source": "web_dashboard"
                }, lf, indent=2)

        res = {"ok": True, "message": f"🔒 Candado activado para: {', '.join(tags_to_lock).upper()}", "locked_accounts": tags_to_lock}
        resp_b = json.dumps(res, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(resp_b)))
        self.end_headers()
        self.wfile.write(resp_b)

    def handle_api_desbloquear(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            req = json.loads(body.decode("utf-8"))
        except Exception:
            req = {}

        target = req.get("account", "both").lower()
        tags_to_unlock = []
        if target in ("ftmo", "both"):
            tags_to_unlock.append("ftmo")
        if target in ("vt", "vtmarkets", "both"):
            tags_to_unlock.append("vtmarkets")

        today_str = str(datetime.date.today())
        for tag in tags_to_unlock:
            lock_f = os.path.join(RESULTS_DIR, f"candado_{tag}.lock")
            if os.path.exists(lock_f):
                try:
                    os.remove(lock_f)
                except Exception:
                    with open(lock_f, "w", encoding="utf-8") as lf:
                        json.dump({"locked": False, "date": today_str}, lf)

        res = {"ok": True, "message": f"🔓 Candado levantado para: {', '.join(tags_to_unlock).upper()}", "unlocked_accounts": tags_to_unlock}
        resp_b = json.dumps(res, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(resp_b)))
        self.end_headers()
        self.wfile.write(resp_b)

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(("0.0.0.0", PORT), DashboardHandler)
    print("=" * 70)
    print(f" SERVIDOR WEB Y API DE TRUETRADING ACTIVO")
    print("=" * 70)
    print(f" * Panel Web Local:       http://localhost:{PORT}")
    print(f" * API REST de Estado:    http://localhost:{PORT}/api/status")
    print(f" * Endpoint Candado:      POST http://localhost:{PORT}/api/candado")
    print(f" * Endpoint Desbloquear:  POST http://localhost:{PORT}/api/desbloquear")
    print("=" * 70)
    print(" Presione Ctrl+C para detener.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor web detenido.")

if __name__ == "__main__":
    run()
