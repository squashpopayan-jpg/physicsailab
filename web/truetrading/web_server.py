import os
import sys
import json
import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import urllib.request
from collections import defaultdict

RESULTS_DIR = r"C:\Users\Administrator\Desktop\TrueTrading_Listo_Para_VPS\quant_trading\results"
if not os.path.exists(RESULTS_DIR):
    RESULTS_DIR = r"C:\Asesor_Oro\quant_trading\results"

PORT = 8080

# Cache para calendario económico
_CALENDAR_CACHE = {"timestamp": 0, "events": []}

def get_economic_calendar():
    global _CALENDAR_CACHE
    now = datetime.datetime.now().timestamp()
    if now - _CALENDAR_CACHE["timestamp"] < 3600 and _CALENDAR_CACHE["events"]:
        return _CALENDAR_CACHE["events"]

    url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
    events = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 TrueTrading Monitor"})
        with urllib.request.urlopen(req, timeout=5) as res:
            raw = json.loads(res.read().decode("utf-8"))
            for e in raw:
                country = e.get("country", "")
                impact = e.get("impact", "")
                if country in ("USD", "All") and impact in ("High", "Holiday"):
                    events.append({
                        "title": e.get("title", ""),
                        "country": country,
                        "date": e.get("date", ""),
                        "impact": impact,
                        "forecast": e.get("forecast", ""),
                        "previous": e.get("previous", "")
                    })
        _CALENDAR_CACHE = {"timestamp": now, "events": events}
    except Exception as ex:
        print("Error obteniendo calendario ForexFactory:", ex)
        if _CALENDAR_CACHE["events"]:
            return _CALENDAR_CACHE["events"]
    return events

def get_daily_history():
    """Genera el registro histórico de días y metas cumplidas combinando MT5 y snapshots."""
    history_days = []
    
    # 1. Intentar leer deals reales desde MT5
    try:
        import MetaTrader5 as mt5
        if mt5.initialize():
            from_d = datetime.datetime.now() - datetime.timedelta(days=60)
            deals = mt5.history_deals_get(from_d, datetime.datetime.now())
            days_map = defaultdict(lambda: {"pnl": 0.0, "trades": 0, "wins": 0, "losses": 0})
            if deals:
                for d in deals:
                    if d.entry == 1: # ENTRY_OUT
                        d_str = datetime.datetime.fromtimestamp(d.time).strftime("%Y-%m-%d")
                        net = d.profit + d.swap + d.commission
                        days_map[d_str]["pnl"] += net
                        days_map[d_str]["trades"] += 1
                        if net > 0:
                            days_map[d_str]["wins"] += 1
                        elif net < 0:
                            days_map[d_str]["losses"] += 1

            for d_str in sorted(days_map.keys(), reverse=True):
                v = days_map[d_str]
                pnl = round(v["pnl"], 2)
                wr = round((v["wins"] / v["trades"] * 100), 1) if v["trades"] > 0 else 0.0
                meta_cumplida = pnl >= 350.0
                
                status = "META_CUMPLIDA" if meta_cumplida else ("GANADOR" if pnl > 0 else ("NEUTRO" if pnl == 0 else "PERDEDOR"))
                history_days.append({
                    "date": d_str,
                    "pnl": pnl,
                    "trades": v["trades"],
                    "wins": v["wins"],
                    "losses": v["losses"],
                    "win_rate": wr,
                    "meta_cumplida": meta_cumplida,
                    "target_tp": 350.0,
                    "status": status
                })
            mt5.shutdown()
    except Exception as ex:
        print("Aviso al consultar MT5 para historial:", ex)

    # Si hay snapshot reciente de hoy en FTMO con meta cumplida, asegurar que esté reflejado
    f_ftmo = os.path.join(RESULTS_DIR, "snapshot_ftmo.json")
    if os.path.exists(f_ftmo):
        try:
            with open(f_ftmo, "r", encoding="utf-8") as f:
                snap = json.load(f)
            snap_date = snap.get("date", datetime.date.today().strftime("%Y-%m-%d"))
            snap_pnl = snap.get("pnl_neto", 0.0)
            
            # Buscar o actualizar el día del snapshot
            found = False
            for h in history_days:
                if h["date"] == snap_date:
                    found = True
                    if snap_pnl >= 350.0:
                        h["pnl"] = snap_pnl
                        h["meta_cumplida"] = True
                        h["status"] = "META_CUMPLIDA"
                        h["trades"] = snap.get("total_trades", h["trades"])
                        h["win_rate"] = snap.get("win_rate", h["win_rate"])
                    break
            if not found and snap_pnl != 0.0:
                history_days.insert(0, {
                    "date": snap_date,
                    "pnl": snap_pnl,
                    "trades": snap.get("total_trades", 0),
                    "wins": snap.get("wins", 0),
                    "losses": snap.get("losses", 0),
                    "win_rate": snap.get("win_rate", 100.0),
                    "meta_cumplida": snap_pnl >= 350.0,
                    "target_tp": 350.0,
                    "status": "META_CUMPLIDA" if snap_pnl >= 350.0 else "GANADOR"
                })
        except Exception:
            pass

    return history_days

class DashboardHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
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
        elif parsed.path == "/api/history":
            self.handle_api_history()
        elif parsed.path == "/api/calendar":
            self.handle_api_calendar()
        elif parsed.path == "/api/all":
            self.handle_api_all()
        else:
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

    def _get_accounts_data(self):
        data = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "accounts": {}
        }

        # 1. FTMO
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
                    "etiqueta": snap.get("etiqueta", "Reto FTMO 100k USD"),
                    "login": snap.get("login"),
                    "balance": snap.get("balance", 100000.0),
                    "equity": snap.get("equity", 100000.0),
                    "currency": snap.get("currency", "USD"),
                    "pnl_neto": pnl,
                    "flotante": flotante,
                    "pnl_total": round(tot, 2),
                    "trades": snap.get("total_trades", 0),
                    "wins": snap.get("wins", 0),
                    "losses": snap.get("losses", 0),
                    "win_rate": snap.get("win_rate", 0.0),
                    "target_tp": tp_target,
                    "target_sl": sl_limit,
                    "tp_pct": round(tp_pct, 1),
                    "sl_pct": round(sl_pct, 1),
                    "is_candado_zone": tp_pct >= 90.0,
                    "is_sl_warning": sl_pct >= 50.0,
                    "locked": is_locked_ftmo,
                    "closed_trades": snap.get("closed_trades", []),
                    "open_positions": snap.get("open_positions", [])
                }
            except Exception as ex:
                data["accounts"]["ftmo"] = {"error": str(ex)}

        # 2. VT Markets
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
                    "etiqueta": snap.get("etiqueta", "VT Markets (Cuenta Real)"),
                    "login": snap.get("login"),
                    "balance": snap.get("balance", 0.0),
                    "equity": snap.get("equity", 0.0),
                    "currency": snap.get("currency", "USC"),
                    "pnl_neto": pnl,
                    "flotante": flotante,
                    "pnl_total": round(tot, 2),
                    "trades": snap.get("total_trades", 0),
                    "wins": snap.get("wins", 0),
                    "losses": snap.get("losses", 0),
                    "win_rate": snap.get("win_rate", 0.0),
                    "target_tp": tp_target,
                    "target_sl": sl_limit,
                    "tp_pct": round(tp_pct, 1),
                    "sl_pct": round(sl_pct, 1),
                    "is_candado_zone": tp_pct >= 90.0,
                    "is_sl_warning": sl_pct >= 50.0,
                    "locked": is_locked_vt,
                    "closed_trades": snap.get("closed_trades", []),
                    "open_positions": snap.get("open_positions", [])
                }
            except Exception as ex:
                data["accounts"]["vt"] = {"error": str(ex)}

        return data

    def handle_api_status(self):
        data = self._get_accounts_data()
        self._send_json(data)

    def handle_api_history(self):
        history = get_daily_history()
        self._send_json({"history": history, "total_days": len(history)})

    def handle_api_calendar(self):
        events = get_economic_calendar()
        self._send_json({"events": events, "count": len(events)})

    def handle_api_all(self):
        accounts = self._get_accounts_data()
        history = get_daily_history()
        calendar = get_economic_calendar()
        payload = {
            "timestamp": accounts["timestamp"],
            "accounts": accounts["accounts"],
            "history": history,
            "calendar": calendar
        }
        self._send_json(payload)

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
        self._send_json(res)

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
        self._send_json(res)

    def _send_json(self, data):
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(("0.0.0.0", PORT), DashboardHandler)
    print("=" * 70)
    print(f" SERVIDOR WEB Y API TRUETRADING PROFESIONAL ACTIVO (PUERTO {PORT})")
    print("=" * 70)
    print(f" * GET  /api/status     (Estado en vivo, balances, barras)")
    print(f" * GET  /api/history    (Historial de días y metas cumplidas)")
    print(f" * GET  /api/calendar   (Noticias de alto impacto ForexFactory)")
    print(f" * GET  /api/all        (Todo consolidado en una sola llamada)")
    print(f" * POST /api/candado    (Bloquear con candado)")
    print(f" * POST /api/desbloquear(Levantar candado)")
    print("=" * 70)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor web detenido.")

if __name__ == "__main__":
    run()
