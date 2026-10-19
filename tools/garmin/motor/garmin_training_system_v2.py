#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║   GARMIN ADAPTIVE TRAINING SYSTEM v2.0                  ║
║   by ManuSquash | Forerunner 970 | Popayán 1760m        ║
╚══════════════════════════════════════════════════════════╝

Genera entrenamientos ADAPTATIVOS basados en tu condición física
real: VO2max, Training Readiness, ACWR, HRV, Training Load Balance.
Cada sesión se calcula para el día específico, nunca genérica.

Módulos:
  1. Extracción completa de Garmin
  2. Auto-calibración de zonas FC (Karvonen)
  3. Motor adaptativo de entrenamientos
  4. Análisis de condición física + recomendaciones
  5. Dashboards separados y legibles
  6. Exportación JSON para app móvil

Requisitos:
    pip install garminconnect>=0.3.0 pandas matplotlib numpy pydantic

Autor: Manuel Obando (ManuSquash) | Mayo 2026
"""

import json, logging, os, sys, traceback
from collections  import Counter, defaultdict
from datetime     import date, datetime, timedelta, timezone
from getpass      import getpass
from pathlib      import Path
from typing       import Optional

# La consola de Windows (cp1252) no imprime emojis; en Linux esto no cambia nada.
for _stream in (sys.stdout, sys.stderr):
    try: _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

# ── Rutas del proyecto y .env ────────────────────────────────────────────────
# motor/ vive dentro del proyecto; los datos van en <proyecto>/datos salvo que
# GARMIN_DATA_DIR diga otra cosa. Así el script corre igual desde cualquier cwd
# (PC, servidor, cron, GitHub Actions).
MOTOR_DIR   = Path(__file__).resolve().parent
PROJECT_DIR = MOTOR_DIR.parent

def _load_dotenv(path: Path):
    """Carga KEY=VALUE de un .env sin pisar variables ya definidas."""
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except FileNotFoundError:
        pass

_load_dotenv(PROJECT_DIR / ".env")

# ── Zona horaria Colombia ────────────────────────────────────────────────────
# Los servidores corren en UTC. Colombia = UTC-5.
# Usar _now() y _today() en lugar de datetime.now() / date.today()
# para que days_since_run, squash_48h, FatOx semanal y health_daily
# sean siempre correctos sin importar a qué hora corre el script.
TZ_OFFSET_H: int = int(os.getenv("TZ_OFFSET_H", "-5"))   # -5 = Colombia (UTC-5)

def _now() -> datetime:
    """datetime.now() ajustado a la zona horaria de Colombia (naive, como antes)."""
    return datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=TZ_OFFSET_H)

def _today() -> date:
    """date.today() ajustado a la zona horaria de Colombia."""
    return _now().date()

# ── Dependencias opcionales ──────────────────────────────
try:
    import numpy as np
    HAS_NP = True
except ImportError:
    HAS_NP = False
    print("⚠️  pip install numpy")

try:
    import pandas as pd
    HAS_PD = True
except ImportError:
    HAS_PD = False
    print("⚠️  pip install pandas")

try:
    # PythonAnywhere y otros servidores corren en modo headless: no hay ventana Tk.
    # Agg genera PNG/PDF sin interfaz grafica y conserva los dashboards.
    os.environ["MPLBACKEND"] = "Agg"
    import matplotlib
    matplotlib.use("Agg", force=True)
    import matplotlib.pyplot    as plt
    import matplotlib.dates     as mdates
    import matplotlib.gridspec  as gridspec
    import matplotlib.patches   as mpatches
    HAS_PLT = True
    DARK = {
        "figure.facecolor": "#0d1117",
        "axes.facecolor":   "#161b22",
        "axes.edgecolor":   "#21262d",
        "axes.labelcolor":  "#8b949e",
        "text.color":       "#e6edf3",
        "xtick.color":      "#6e7681",
        "ytick.color":      "#6e7681",
        "grid.color":       "#21262d",
        "grid.alpha":       0.6,
        "legend.facecolor": "#161b22",
        "legend.edgecolor": "#30363d",
        "font.family":      "DejaVu Sans",
        "font.size":        9,
        "axes.spines.top":  False,
        "axes.spines.right":False,
    }
    plt.rcParams.update(DARK)

    def _safe_show_dashboard(fig=None):
        """Muestra figuras solo si existe interfaz grafica; en servidor no bloquea."""
        backend = str(matplotlib.get_backend()).lower()
        headless = not os.getenv("DISPLAY") or "agg" in backend
        if not headless:
            try:
                plt.show()
            except Exception:
                pass

except ImportError:
    HAS_PLT = False
    print("⚠️  pip install matplotlib")

from garminconnect import (
    Garmin,
    GarminConnectAuthenticationError,
    GarminConnectConnectionError,
    GarminConnectTooManyRequestsError,
)

logging.getLogger("garminconnect").setLevel(logging.CRITICAL)

# ── Rutas ────────────────────────────────────────────────
OUT   = Path(os.getenv("GARMIN_DATA_DIR") or PROJECT_DIR / "datos").expanduser().resolve()
OUT.mkdir(parents=True, exist_ok=True)
P_FILE = OUT / "profile.json"
TOKEN_FILE = OUT / "garmin_tokens.json"

# ── Colores ──────────────────────────────────────────────
C = {
    "cyan":   "#22d3ee",
    "blue":   "#3b82f6",
    "green":  "#4ade80",
    "yellow": "#fbbf24",
    "orange": "#fb923c",
    "red":    "#f87171",
    "purple": "#a78bfa",
    "gray":   "#6e7681",
    "white":  "#e6edf3",
}
ZONE_COLORS = [C["gray"], C["blue"], C["green"], C["yellow"], C["red"]]

# ── Perfil base ──────────────────────────────────────────
BASE_PROFILE = {
    "name": "Manuel Obando",
    "weight_kg": 85.0,
    "height_m": 1.70,
    "target_weight_kg": 70.0,
    "birth_date": "1989-03-28",       # Manuel Alejandro Obando
    "sex": "male",
    "body_fat_pct": None,             # % grasa si disponible
    "waist_cm": None,                 # Cintura en cm
    "injury_status": "none",          # none / minor / moderate / rest
    "main_goal": "fat_loss_performance",
    "secondary_goal": "squash_running",
    "experience_level": "intermediate",
    "fc_max": 193,
    "fc_reposo": 54,
    "vo2max": 45.0,
    "vo2max_peak": 51.0,
    "hrv_weekly": 43,
    "hrv_baseline_low": 44,
    "hrv_baseline_high": 57,
    "altitude_m": 1760,
    "device": "Forerunner 970",
    "training_status": "DETRAINING",
    "training_readiness": 80,
    # Variables subjetivas diarias (actualizables manualmente)
    "subjective": {
        "energy": None,       # 1-10
        "muscle_pain": None,  # 1-10
        "joint_pain": None,   # 1-10
        "hunger": None,       # 1-10
        "stress": None,       # 1-10
        "motivation": None,   # 1-10
        "rpe_last": None,     # 1-10 RPE entrenamiento anterior
        "sick": False,
    },
}



# ═══════════════════════════════════════════════════════
# ZONAS FC  (Karvonen / FC Reserva)
# ═══════════════════════════════════════════════════════
def calc_zones(fc_max: int, fc_rep: int) -> list[dict]:
    R = fc_max - fc_rep
    raw = [
        (1, "Recuperación",        0.50, 0.60),
        (2, "Base Aeróbica",       0.60, 0.70),
        (3, "Umbral Aeróbico",     0.70, 0.80),
        (4, "Umbral Anaeróbico",   0.80, 0.90),
        (5, "VO2max",              0.90, 1.00),
    ]
    return [{"zone": z, "name": n,
             "pct_low": pl, "pct_high": ph,
             "bpm_low":  round(fc_rep + R * pl),
             "bpm_high": round(fc_rep + R * ph),
             "color":    ZONE_COLORS[z-1]}
            for z, n, pl, ph in raw]


def print_zones(zones, fc_max, fc_rep):
    R = fc_max - fc_rep
    sep = "─" * 62
    print(f"\n{sep}")
    print(f"  ❤️  ZONAS FC  (Karvonen)  |  FCmáx {fc_max}  FCrp {fc_rep}  FCR {R}")
    print(sep)
    for z in zones:
        bar = "█" * ((z["bpm_high"] - z["bpm_low"]) // 3)
        print(f"  Z{z['zone']}  {z['name']:22s}  "
              f"{z['bpm_low']:3d}–{z['bpm_high']:3d} bpm  "
              f"({z['pct_low']*100:.0f}–{z['pct_high']*100:.0f}%)  {bar}")
    print(sep)


# ═══════════════════════════════════════════════════════
# AUTENTICACIÓN
# ═══════════════════════════════════════════════════════
def _get_token_dir():
    """
    Busca tokens en este orden:
      1. Variable de entorno GARMINTOKENS (ruta a archivo/carpeta o el JSON mismo,
         útil como secreto en un servidor o en GitHub Actions)
      2. <datos>/garmin_tokens.json   (setup_tokens.py lo guarda aquí)
      3. <datos>/tokens/garmin_tokens.json
      4. garmin_data/ junto al script (instalaciones antiguas)
      5. ~/.garminconnect (fallback)
    Retorna siempre un string (ruta de archivo/directorio o JSON).
    """
    env_val = (os.getenv("GARMINTOKENS") or "").strip()
    if env_val:
        if env_val.startswith("{"):
            return env_val
        p = Path(env_val).expanduser()
        if not p.is_absolute():
            p = PROJECT_DIR / p
        if p.exists():
            return str(p)

    candidates = [
        TOKEN_FILE,
        OUT / "tokens" / "garmin_tokens.json",
        MOTOR_DIR / "garmin_data" / "garmin_tokens.json",
        MOTOR_DIR / "garmin_data" / "tokens" / "garmin_tokens.json",
    ]
    for c in candidates:
        if c.exists():
            return str(c)

    legacy_home = Path("~/.garminconnect").expanduser()
    if legacy_home.exists():
        return str(legacy_home)
    # Destino por defecto para un login nuevo
    return str(TOKEN_FILE)


def _interactive() -> bool:
    """True solo si hay una persona en la terminal (no cron, no servidor web)."""
    if os.getenv("GARMIN_NONINTERACTIVE", "").lower() in {"1", "true", "yes"}:
        return False
    try:
        return sys.stdin is not None and sys.stdin.isatty()
    except Exception:
        return False


def init_api() -> Optional[Garmin]:
    tokenstore = _get_token_dir()
    is_json = tokenstore.startswith("{")
    print(f"  🔍 Tokens: {'variable GARMINTOKENS (JSON)' if is_json else tokenstore}")

    # ── Intento 1: tokens guardados (la librería los renueva y re-guarda sola) ──
    if is_json or Path(tokenstore).exists():
        try:
            g = Garmin()
            g.login(tokenstore)
            print("✅ Sesión restaurada")
            return g
        except GarminConnectTooManyRequestsError:
            print("  ❌ Garmin respondió 429 (demasiadas solicitudes). Espera 15–30 min.")
            return None
        except Exception as e:
            print(f"  ⚠️  Tokens no válidos: {e}")

    # ── Sin tokens válidos ─────────────────────────────
    if not _interactive():
        print("""
  ❌ No hay tokens válidos y este proceso no es interactivo (servidor/cron).
     En tu PC corre:  python motor/setup_tokens.py
     y copia datos/garmin_tokens.json al servidor (o a la variable GARMINTOKENS).
""")
        return None

    print(f"""
  ⚠️  No se encontraron tokens válidos.

  Lo recomendado es correr una vez:
    python motor/setup_tokens.py

  O ingresa tus credenciales ahora (solo esta vez):
    """)

    email    = os.getenv("GARMIN_EMAIL")    or input("  📧 Email: ").strip()
    password = os.getenv("GARMIN_PASSWORD") or getpass("  🔑 Contraseña: ")

    try:
        g = Garmin(email=email, password=password, is_cn=False,
                   prompt_mfa=lambda: input("  🔐 MFA: ").strip())
        save_path = str(TOKEN_FILE) if is_json else tokenstore
        if Path(save_path).is_dir():
            save_path = str(Path(save_path) / "garmin_tokens.json")
        g.login(save_path)
        print(f"  ✅ Login exitoso. Tokens guardados en: {save_path}")
        return g
    except GarminConnectTooManyRequestsError:
        print("  ❌ Rate limit. Espera unos minutos.")
    except GarminConnectAuthenticationError as e:
        print(f"  ❌ Credenciales incorrectas: {e}")
    except Exception as e:
        print(f"  ❌ {e}"); traceback.print_exc()
    return None



# =======================================================
# RUTAS / MAPAS - helpers no invasivos
# =======================================================
def _to_float_safe(v):
    try:
        if v is None or v == "": return None
        return float(v)
    except Exception:
        return None


def _garmin_latlon_to_deg(v):
    """Garmin a veces entrega coordenadas en semicirculos."""
    x = _to_float_safe(v)
    if x is None: return None
    if abs(x) > 360:
        x = x * 180.0 / (2 ** 31)
    return round(x, 7)


def _normalize_route_point(lat, lon, hr=None, sec=None, idx=None):
    la = _garmin_latlon_to_deg(lat)
    lo = _garmin_latlon_to_deg(lon)
    if la is None or lo is None: return None
    if not (-90 <= la <= 90 and -180 <= lo <= 180): return None
    if abs(la) < 0.0001 and abs(lo) < 0.0001: return None
    p = {"lat": la, "lon": lo}
    h = _to_float_safe(hr)
    if h is not None: p["hr"] = round(h)
    s2 = _to_float_safe(sec)
    if s2 is not None: p["sec"] = round(s2)
    if idx is not None: p["idx"] = idx
    return p


def _route_points_from_detail(detail):
    """Extrae puntos lat/lon de varias formas posibles de respuesta Garmin."""
    if not isinstance(detail, dict): return []
    points = []
    def scan_list(rows):
        out = []
        if not isinstance(rows, list): return out
        for i, row in enumerate(rows):
            if not isinstance(row, dict): continue
            lat = row.get("latitude") or row.get("lat") or row.get("directLatitude") or row.get("startLatitude")
            lon = row.get("longitude") or row.get("lon") or row.get("directLongitude") or row.get("startLongitude")
            hr  = row.get("heartRate") or row.get("hr") or row.get("heartRateBpm")
            sec = row.get("timerDuration") or row.get("sumElapsedDuration") or row.get("elapsedDuration")
            pnt = _normalize_route_point(lat, lon, hr, sec, i)
            if pnt: out.append(pnt)
        return out
    for key in ("activityDetailMetrics", "geoPoints", "trackPoints", "samples", "laps"):
        points.extend(scan_list(detail.get(key)))
    rows = detail.get("activityDetailMetrics") or []
    desc = detail.get("metricDescriptors") or detail.get("metricsDescriptors") or detail.get("activityDetailMetricDescriptors") or []
    if rows and desc and isinstance(rows, list) and isinstance(desc, list):
        names = []
        for d in desc:
            if isinstance(d, dict):
                names.append(str(d.get("key") or d.get("metricsIndex") or d.get("metricKey") or d.get("displayName") or "").lower())
            else:
                names.append(str(d).lower())
        lat_i = next((i for i,n in enumerate(names) if "lat" in n), None)
        lon_i = next((i for i,n in enumerate(names) if "lon" in n or "lng" in n), None)
        hr_i  = next((i for i,n in enumerate(names) if "heart" in n or n == "hr"), None)
        sec_i = next((i for i,n in enumerate(names) if "time" in n or "duration" in n), None)
        if lat_i is not None and lon_i is not None:
            for i, row in enumerate(rows):
                vals = row.get("metrics") if isinstance(row, dict) else None
                if not isinstance(vals, list): continue
                def getv(k):
                    try:
                        v = vals[k]
                        return v.get("value") if isinstance(v, dict) else v
                    except Exception:
                        return None
                pnt = _normalize_route_point(getv(lat_i), getv(lon_i), getv(hr_i) if hr_i is not None else None, getv(sec_i) if sec_i is not None else None, i)
                if pnt: points.append(pnt)
    dedup = []
    last = None
    for pnt in points:
        key = (pnt["lat"], pnt["lon"])
        if key != last:
            dedup.append(pnt); last = key
    if len(dedup) > 600:
        step = max(1, len(dedup) // 600)
        dedup = dedup[::step]
    return dedup


def _best_effort_route_points(api, activity_id):
    if not activity_id or api is None: return []
    try:
        detail = None
        if hasattr(api, "get_activity_details"):
            detail = api.get_activity_details(activity_id)
        elif hasattr(api, "get_activity_detail"):
            detail = api.get_activity_detail(activity_id)
        return _route_points_from_detail(detail)
    except Exception:
        return []


def _activity_record_from_summary(a: dict, api=None, fetch_route: bool = False) -> dict:
    rec = {
        "id": a.get("activityId"),
        "name": a.get("activityName"),
        "type": a.get("activityType", {}).get("typeKey", "unknown"),
        "date": a.get("startTimeLocal"),
        "date_gmt": a.get("startTimeGMT"),
        "dur_min": round(a.get("duration", 0) / 60, 1),
        "elapsed_min": round((a.get("elapsedDuration") or a.get("duration") or 0) / 60, 1),
        "moving_min": round((a.get("movingDuration") or a.get("duration") or 0) / 60, 1),
        "dist_km": round(a.get("distance", 0) / 1000, 2) if a.get("distance") else 0,
        "cal": a.get("calories", 0),
        "avg_hr": a.get("averageHR"),
        "max_hr": a.get("maxHR"),
        "min_hr": a.get("minHR"),
        "speed_kmh": round(a.get("averageSpeed", 0) * 3.6, 2) if a.get("averageSpeed") else None,
        "max_speed_kmh": round(a.get("maxSpeed", 0) * 3.6, 2) if a.get("maxSpeed") else None,
        "elevation": a.get("elevationGain"),
        "elevation_loss": a.get("elevationLoss"),
        "te_aer": a.get("aerobicTrainingEffect"),
        "te_ana": a.get("anaerobicTrainingEffect"),
        "vo2max": a.get("vO2MaxValue"),
        "cadence": a.get("averageRunningCadenceInStepsPerMinute") or a.get("averageCadence"),
        "max_cadence": a.get("maxRunningCadenceInStepsPerMinute") or a.get("maxCadence"),
        "stride_length": a.get("averageStrideLength"),
        "ground_contact_time": a.get("avgGroundContactTime"),
        "vertical_oscillation": a.get("avgVerticalOscillation"),
        "training_load": a.get("activityTrainingLoad"),
        "intensity_minutes": a.get("intensityMinutes"),
        "moderate_intensity_min": a.get("moderateIntensityMinutes"),
        "vigorous_intensity_min": a.get("vigorousIntensityMinutes"),
        "avg_power": a.get("avgPower"),
        "max_power": a.get("maxPower"),
        "normalized_power": a.get("normalizedPower"),
    }
    # Guardar tambien los campos escalares que Garmin entregue y que no esten mapeados.
    # Esto permite auditar nuevos datos sin romper el contrato JSON ni inflar el archivo con objetos grandes.
    used_keys = {
        "activityId", "activityName", "activityType", "startTimeLocal", "startTimeGMT", "duration",
        "elapsedDuration", "movingDuration", "distance", "calories", "averageHR", "maxHR", "minHR",
        "averageSpeed", "maxSpeed", "elevationGain", "elevationLoss", "aerobicTrainingEffect",
        "anaerobicTrainingEffect", "vO2MaxValue", "averageRunningCadenceInStepsPerMinute", "averageCadence",
        "maxRunningCadenceInStepsPerMinute", "maxCadence", "averageStrideLength", "avgGroundContactTime",
        "avgVerticalOscillation", "activityTrainingLoad", "intensityMinutes", "moderateIntensityMinutes",
        "vigorousIntensityMinutes", "avgPower", "maxPower", "normalizedPower"
    }
    extra = {}
    for k, v in a.items():
        if k in used_keys:
            continue
        if isinstance(v, (str, int, float, bool)) or v is None:
            extra[k] = v
    rec["garmin_scalar_fields"] = sorted(extra.keys())
    if extra:
        rec["garmin_extra_metrics"] = extra
    start_lat = a.get("startLatitude") or a.get("startLatitudeInDegree") or a.get("startLat")
    start_lon = a.get("startLongitude") or a.get("startLongitudeInDegree") or a.get("startLon")
    end_lat   = a.get("endLatitude") or a.get("endLatitudeInDegree") or a.get("endLat")
    end_lon   = a.get("endLongitude") or a.get("endLongitudeInDegree") or a.get("endLon")
    sp = _normalize_route_point(start_lat, start_lon)
    ep = _normalize_route_point(end_lat, end_lon)
    if sp: rec["start_point"] = sp
    if ep: rec["end_point"] = ep
    if fetch_route:
        rp = _best_effort_route_points(api, rec.get("id"))
        if rp:
            rec["route_points"] = rp
            rec["route_point_count"] = len(rp)
            rec["route_available"] = True
        else:
            rec["route_available"] = bool(sp or ep)
    else:
        rec["route_available"] = bool(sp or ep)
    return rec

# ═══════════════════════════════════════════════════════
# EXTRACCIÓN COMPLETA
# ═══════════════════════════════════════════════════════
def extract_all(api: Garmin, days: int = 90) -> dict:
    print(f"\n{'═'*62}")
    print(f"  🔄  EXTRACCIÓN COMPLETA — últimos {days} días")
    print(f"{'═'*62}\n")

    raw = {"extracted_at": _now().isoformat(),
           "health_daily": [], "activities": [], "sleep_data": []}

    # ── Día a día ────────────────────────────────────────
    print("  📅 Datos diarios...")
    for i in range(days):
        d = (_today() - timedelta(days=i)).isoformat()
        rec = {"date": d}

        # Summary
        try:
            s = api.get_user_summary(d)
            rec |= {
                "steps": s.get("totalSteps", 0),
                "cal_total": s.get("totalKilocalories", 0),
                "cal_active": s.get("activeKilocalories", 0),
                "cal_bmr": s.get("bmrKilocalories", 0),
                "dist_m": s.get("totalDistanceMeters", 0),
                "floors": s.get("floorsClimbed", 0),
                "mod_min": s.get("moderateIntensityMinutes", 0),
                "vig_min": s.get("vigorousIntensityMinutes", 0),
                "avg_stress": s.get("averageStressLevel"),
                "bb_high": s.get("bodyBatteryHighestValue"),
                "bb_low": s.get("bodyBatteryLowestValue"),
                "bb_charged": s.get("bodyBatteryChargedValue"),
                "bb_drained": s.get("bodyBatteryDrainedValue"),
            }
        except Exception: pass

        # HR
        try:
            hr = api.get_heart_rates(d)
            rec |= {"rhr": hr.get("restingHeartRate"),
                    "hr_max": hr.get("maxHeartRate"),
                    "hr_min": hr.get("minHeartRate"),
                    "rhr_7d": hr.get("lastSevenDaysAvgRestingHeartRate")}
        except Exception: pass

        # HRV
        try:
            hrv = api.get_hrv_data(d)
            sv = hrv.get("hrvSummary", {}) if isinstance(hrv, dict) else {}
            bl = sv.get("baseline", {}) or {}
            rec |= {"hrv_night": sv.get("lastNightAvg"),
                    "hrv_week":  sv.get("weeklyAvg"),
                    "hrv_5min":  sv.get("lastNight5MinHigh"),
                    "hrv_status":sv.get("status"),
                    "hrv_bl_lo": bl.get("balancedLow"),
                    "hrv_bl_hi": bl.get("balancedUpper")}
        except Exception: pass

        # Stress
        try:
            st = api.get_stress_data(d)
            if isinstance(st, dict):
                rec |= {"stress_max": st.get("maxStressLevel"),
                        "stress_high_dur": st.get("highStressDuration"),
                        "stress_low_dur": st.get("lowStressDuration")}
        except Exception: pass

        # Sleep
        try:
            sl = api.get_sleep_data(d)
            dto = sl.get("dailySleepDTO", {}) if isinstance(sl, dict) else {}
            if dto:
                total  = dto.get("sleepTimeSeconds", 0) or 1
                awake  = dto.get("awakeSleepSeconds", 0) or 0
                deep   = dto.get("deepSleepSeconds", 0) or 0
                rem    = dto.get("remSleepSeconds",  0) or 0
                light  = dto.get("lightSleepSeconds", 0) or 0
                sleep_start = dto.get("sleepStartTimestampLocal") or dto.get("sleepStartTimestampGMT")
                sleep_end   = dto.get("sleepEndTimestampLocal")   or dto.get("sleepEndTimestampGMT")
                overall_score  = dto.get("overallScore") or dto.get("sleepScore") or dto.get("score")
                bb_recovered   = dto.get("bodyBatteryChange") or dto.get("bodyBatteryRecovered")

                rec |= {
                    "sleep_total_h":        round(total / 3600, 2),
                    "sleep_deep_pct":       round(deep  / total * 100, 1),
                    "sleep_rem_pct":        round(rem   / total * 100, 1),
                    "sleep_light_pct":      round(light / total * 100, 1),
                    "sleep_awake_min":      round(awake / 60, 1),
                    "sleep_start":          sleep_start,
                    "sleep_end":            sleep_end,
                    "sleep_hr":             dto.get("avgHeartRate"),
                    "sleep_spo2":           dto.get("averageSpO2Value"),
                    "sleep_resp":           dto.get("averageRespirationValue"),
                    "sleep_stress":         dto.get("avgSleepStress"),
                    "sleep_bb_recovered":   bb_recovered,
                    "sleep_score_overall":  overall_score,
                    "sleep_score_quality":  dto.get("qualityScore"),
                    "sleep_score_duration": dto.get("durationScore"),
                    "sleep_feedback":       dto.get("sleepScoreFeedback"),
                }

                # ── Siestas (napDTO) ──────────────────────────
                nap_dtos = sl.get("napDTO") or sl.get("naps") or []
                if isinstance(nap_dtos, dict): nap_dtos = [nap_dtos]
                naps = []
                for nap in nap_dtos:
                    if not isinstance(nap, dict): continue
                    nap_total = nap.get("sleepTimeSeconds") or nap.get("duration") or 0
                    if nap_total < 60: continue
                    naps.append({
                        "date":     d,
                        "dur_min":  round(nap_total / 60, 1),
                        "start":    nap.get("startTimestampLocal") or nap.get("napStartTimestampGMT"),
                        "end":      nap.get("endTimestampLocal")   or nap.get("napEndTimestampGMT"),
                        "deep_pct": round(nap.get("deepSleepSeconds", 0) / max(nap_total,1) * 100, 1),
                        "rem_pct":  round(nap.get("remSleepSeconds",  0) / max(nap_total,1) * 100, 1),
                        "hr":       nap.get("avgHeartRate"),
                    })
                if naps:
                    rec["naps"] = naps

                raw["sleep_data"].append({
                    "date":      d,
                    "total_h":   round(total / 3600, 2),
                    "deep_pct":  round(deep  / total * 100, 1),
                    "rem_pct":   round(rem   / total * 100, 1),
                    "light_pct": round(light / total * 100, 1),
                    "awake_min": round(awake / 60, 1),
                    "spo2":      dto.get("averageSpO2Value"),
                    "hr":        dto.get("avgHeartRate"),
                    "resp":      dto.get("averageRespirationValue"),
                    "stress":    dto.get("avgSleepStress"),
                    "score":     overall_score,
                    "bb_recovered": bb_recovered,
                    "sleep_start":  sleep_start,
                    "sleep_end":    sleep_end,
                    "naps":      naps,
                    "feedback":  dto.get("sleepScoreFeedback"),
                })
        except Exception: pass

        # SpO2
        try:
            sp = api.get_spo2_data(d)
            if isinstance(sp, dict):
                rec |= {"spo2_avg": sp.get("averageSpO2"),
                        "spo2_low": sp.get("lowestSpO2")}
        except Exception: pass

        raw["health_daily"].append(rec)
        print(f"    {'✓' if rec.get('steps') else '○'}  {d}", end="\r")

    print(f"    ✅ {len(raw['health_daily'])} días                    ")

    # ── Training Readiness & Status ──────────────────────
    print("  ⚡ Training status...")
    today = _today().isoformat()

    try:
        tr_list = api.get_training_readiness(today)
        if tr_list and isinstance(tr_list, list):
            tr = tr_list[0]
            raw["training_readiness"] = {
                "score": tr.get("score"), "level": tr.get("level"),
                "sleep_score": tr.get("sleepScore"),
                "sleep_feedback": tr.get("sleepScoreFactorFeedback"),
                "recovery_h": tr.get("recoveryTime"),
                "recovery_feedback": tr.get("recoveryTimeFactorFeedback"),
                "acwr_pct": tr.get("acwrFactorPercent"),
                "acwr_feedback": tr.get("acwrFactorFeedback"),
                "acute_load": tr.get("acuteLoad"),
                "stress_pct": tr.get("stressHistoryFactorPercent"),
                "hrv_pct": tr.get("hrvFactorPercent"),
                "hrv_feedback": tr.get("hrvFactorFeedback"),
                "hrv_weekly": tr.get("hrvWeeklyAverage"),
            }
            print(f"    ✅ Readiness {tr.get('score')}/100 — {tr.get('level')}")
    except Exception as e:
        print(f"    ⚠️  Readiness: {e}")

    try:
        ts = api.get_training_status(today)
        if isinstance(ts, dict):
            vo2 = ts.get("mostRecentVO2Max", {}).get("generic", {}) or {}
            latest = {}
            for v in ts.get("mostRecentTrainingStatus", {}).get("latestTrainingStatusData", {}).values():
                latest = v; break
            acwr_dto = latest.get("acuteTrainingLoadDTO", {}) or {}
            raw["training_status"] = {
                "vo2max_precise": vo2.get("vo2MaxPreciseValue"),
                "vo2max": vo2.get("vo2MaxValue"),
                "vo2max_date": vo2.get("calendarDate"),
                "phrase": latest.get("trainingStatusFeedbackPhrase"),
                "fitness_trend": latest.get("fitnessTrend"),
                "acute_load": acwr_dto.get("dailyTrainingLoadAcute", 0),
                "chronic_load": acwr_dto.get("dailyTrainingLoadChronic", 0),
                "acwr": acwr_dto.get("dailyAcuteChronicWorkloadRatio", 0.0),
                "acwr_status": acwr_dto.get("acwrStatus"),
                "chr_min": acwr_dto.get("minTrainingLoadChronic", 0),
                "chr_max": acwr_dto.get("maxTrainingLoadChronic", 0),
            }
            print(f"    ✅ Status: {latest.get('trainingStatusFeedbackPhrase')} | "
                  f"VO2max: {vo2.get('vo2MaxPreciseValue')} ({vo2.get('calendarDate')})")

            tlb_map = ts.get("mostRecentTrainingLoadBalance", {}).get("metricsTrainingLoadBalanceDTOMap", {})
            for v in tlb_map.values():
                raw["training_load_balance"] = {
                    "aer_low":   v.get("monthlyLoadAerobicLow", 0),
                    "aer_high":  v.get("monthlyLoadAerobicHigh", 0),
                    "anaer":     v.get("monthlyLoadAnaerobic", 0),
                    "aer_low_min": v.get("monthlyLoadAerobicLowTargetMin", 0),
                    "aer_low_max": v.get("monthlyLoadAerobicLowTargetMax", 0),
                    "aer_high_min":v.get("monthlyLoadAerobicHighTargetMin", 0),
                    "aer_high_max":v.get("monthlyLoadAerobicHighTargetMax", 0),
                    "feedback":  v.get("trainingBalanceFeedbackPhrase"),
                }
                print(f"    ✅ Load balance: {v.get('trainingBalanceFeedbackPhrase')}")
                break
    except Exception as e:
        print(f"    ⚠️  Training status: {e}")

    # ── Actividades ─────────────────────────────────────
    print(f"  🏃 Actividades (hasta {days} días)...")
    try:
        start = (_today() - timedelta(days=max(days, 180))).isoformat()
        acts  = api.get_activities_by_date(start, today)
        route_fetch_limit = int(os.getenv("GARMIN_ROUTE_LIMIT", "12"))
        route_fetch_count = 0
        for a in acts:
            a_type = a.get("activityType", {}).get("typeKey", "unknown")
            fetch_route = a_type in ("running", "trail_running", "cycling", "walking") and route_fetch_count < route_fetch_limit
            rec_act = _activity_record_from_summary(a, api=api, fetch_route=fetch_route)
            if fetch_route: route_fetch_count += 1
            raw["activities"].append(rec_act)
        print(f"    ✅ {len(raw['activities'])} actividades")
    except Exception as e:
        print(f"    ❌ {e}")

    # ── Laps de la última actividad ──────────────────────
    print("  🏁 Laps última actividad...")
    try:
        last_act = raw["activities"][0] if raw["activities"] else None
        if last_act and last_act.get("id"):
            detail = None
            if hasattr(api, "get_activity_details"):
                detail = api.get_activity_details(last_act["id"])
            elif hasattr(api, "get_activity_detail"):
                detail = api.get_activity_detail(last_act["id"])
            if detail:
                raw["last_activity_laps"] = _extract_laps(detail)
                raw["last_activity_detail_id"] = last_act["id"]
                print(f"    ✅ {len(raw['last_activity_laps'])} laps")
    except Exception as e:
        print(f"    ❌ {e}")

    # ── Race Predictor ───────────────────────────────────
    print("  🏆 Race Predictor...")
    try:
        if hasattr(api, "get_race_predictions"):
            rp = api.get_race_predictions()
            raw["race_predictions"] = rp if isinstance(rp, dict) else {}
            print("    ✅ Race predictions")
        else:
            raw["race_predictions"] = {}
    except Exception as e:
        print(f"    ❌ {e}")
        raw["race_predictions"] = {}

    # ── Respiración nocturna ─────────────────────────────
    print("  🫁 Respiración nocturna (7 días)...")
    try:
        resp_days = []
        for i in range(7):
            d = (_today() - timedelta(days=i)).isoformat()
            try:
                if hasattr(api, "get_respiration_data"):
                    rd = api.get_respiration_data(d)
                    avg = None
                    if isinstance(rd, dict):
                        avg = rd.get("avgWakingRespirationValue") or rd.get("averageRespirationValue")
                    if avg:
                        resp_days.append({"date": d, "avg_brpm": round(avg, 1)})
            except Exception:
                pass
        raw["respiration_series"] = resp_days
        print(f"    ✅ {len(resp_days)} días")
    except Exception as e:
        print(f"    ❌ {e}")

    # ── Peso corporal ────────────────────────────────────
    print("  ⚖️ Peso corporal (Garmin Scale)...")
    try:
        if hasattr(api, "get_body_composition"):
            wt = api.get_body_composition(
                (_today() - timedelta(days=30)).isoformat(), today
            )
            if isinstance(wt, dict) and wt.get("totalAverage"):
                raw["garmin_weight"] = {
                    "weight_kg": round(wt["totalAverage"].get("weight", 0) / 1000, 1),
                    "bmi":       wt["totalAverage"].get("bmi"),
                    "body_fat":  wt["totalAverage"].get("bodyFat"),
                    "muscle_mass": wt["totalAverage"].get("muscleMass"),
                    "bone_mass": wt["totalAverage"].get("boneMass"),
                    "date":      today,
                }
                print(f"    ✅ {raw['garmin_weight']['weight_kg']} kg")
            else:
                raw["garmin_weight"] = {}
        else:
            raw["garmin_weight"] = {}
    except Exception as e:
        print(f"    ❌ {e}")
        raw["garmin_weight"] = {}

    # ── Guardar ─────────────────────────────────────────
    fp = OUT / "full_extract.json"
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(raw, f, indent=2, default=str)
    if HAS_PD:
        pd.DataFrame(raw["health_daily"]).to_csv(OUT / "health_daily.csv", index=False)
        pd.DataFrame(raw["activities"]).to_csv(OUT / "activities.csv", index=False)
    print(f"\n  💾 Guardado: {fp}")
    return raw


# ═══════════════════════════════════════════════════════
# AUTO-CALIBRACIÓN
# ═══════════════════════════════════════════════════════
def auto_calibrate(raw: dict) -> dict:
    print(f"\n{'═'*62}\n  🔧  AUTO-CALIBRACIÓN DE PERFIL\n{'═'*62}\n")
    p = BASE_PROFILE.copy()
    if P_FILE.exists():
        with open(P_FILE) as f: p.update(json.load(f))
    # Siempre forzar birth_date del código (evita que profile.json desactualizado pise la fecha real)
    p["birth_date"] = BASE_PROFILE["birth_date"]

    h  = raw.get("health_daily", [])
    tr = raw.get("training_readiness", {})
    ts = raw.get("training_status", {})
    acts = raw.get("activities", [])

    # FC reposo — promedio 7 días más recientes con dato
    rhr = [x["rhr"] for x in h if x.get("rhr")]
    if rhr:
        p["fc_reposo"] = round(sum(rhr[:7]) / min(7, len(rhr)))
        p["fc_reposo_min"] = min(rhr);  p["fc_reposo_max"] = max(rhr)
        print(f"  FC reposo:  {p['fc_reposo']} bpm  (min {min(rhr)}, max {max(rhr)})")

    # FC máx — del historial de actividades
    mx = [a["max_hr"] for a in acts if a.get("max_hr")]
    if mx and max(mx) > p["fc_max"]:
        p["fc_max"] = int(max(mx))
    print(f"  FC máxima:  {p['fc_max']} bpm")

    # VO2max
    if ts.get("vo2max_precise"):
        p["vo2max"] = ts["vo2max_precise"]; p["vo2max_date"] = ts.get("vo2max_date")
    vo2_hist = [a["vo2max"] for a in acts if a.get("vo2max")]
    if vo2_hist: p["vo2max_peak"] = max(vo2_hist)
    print(f"  VO2max:     {p['vo2max']}  (pico {p.get('vo2max_peak')})")

    # HRV
    if tr.get("hrv_weekly"): p["hrv_weekly"] = tr["hrv_weekly"]
    # Baseline HRV real desde Garmin: evita bandas hardcodeadas en dashboards.
    hrv_bl_lo_vals = [x.get("hrv_bl_lo") for x in h if x.get("hrv_bl_lo")]
    hrv_bl_hi_vals = [x.get("hrv_bl_hi") for x in h if x.get("hrv_bl_hi")]
    if hrv_bl_lo_vals: p["hrv_baseline_low"] = round(sum(hrv_bl_lo_vals[:7]) / min(7, len(hrv_bl_lo_vals)), 1)
    if hrv_bl_hi_vals: p["hrv_baseline_high"] = round(sum(hrv_bl_hi_vals[:7]) / min(7, len(hrv_bl_hi_vals)), 1)
    print(f"  HRV:        {p.get('hrv_weekly')} ms  baseline {p.get('hrv_baseline_low','?')}–{p.get('hrv_baseline_high','?')}  status: {p.get('hrv_status','?')}")

    # Estado de entrenamiento
    if ts.get("phrase"): p["training_status"] = ts["phrase"]
    if tr.get("score"):  p["training_readiness"] = tr["score"]; p["training_readiness_level"] = tr.get("level")
    print(f"  Readiness:  {p.get('training_readiness')}/100  {p.get('training_readiness_level','')}")
    print(f"  Status:     {p.get('training_status','?')}")

    # Load balance
    tlb = raw.get("training_load_balance", {})
    if tlb: p["load_balance"] = tlb

    # ACWR
    if ts:
        p["acwr"] = ts.get("acwr", 0.0)
        p["acute_load"] = ts.get("acute_load", 0)
        p["chronic_load"] = ts.get("chronic_load", 0)

    # Derivados
    p["fc_reserva"] = p["fc_max"] - p["fc_reposo"]
    p["bmi"] = round(p["weight_kg"] / p["height_m"] ** 2, 1)
    p["zones"] = calc_zones(p["fc_max"], p["fc_reposo"])

    # Edad fisica y metricas de rendimiento
    p["fitness_age"]          = calculate_fitness_age(p, raw)
    p["performance_metrics"]  = calculate_performance_metrics(raw, p)
    chron_age = calculate_chronological_age(p)
    p["chronological_age"] = round(chron_age, 1)
    fa = p["fitness_age"]
    print(f"  Edad cronologica: {chron_age:.0f} años")
    print(f"  Edad fisica:      {fa['fitness_age_app']} ({fa['classification']})")
    print(f"  Edad recuperacion:{fa['recovery_age']}")
    print(f"  Edad aerobica:    {fa['aerobic_age']}")
    if fa["recovery_warning"]:
        print(f"  ⚠️  Edad de recuperacion elevada hoy — no intensidad")

    with open(P_FILE, "w") as f: json.dump(p, f, indent=2, default=str)
    print(f"\n  💾 Perfil: {P_FILE}")
    return p


# ═══════════════════════════════════════════════════════
# MOTOR ADAPTATIVO DE ENTRENAMIENTOS
# ═══════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════
# EDAD FISICA Y RECUPERACION
# ═══════════════════════════════════════════════════════

def _vo2_altitude_adjusted_for_norms(vo2: float, profile: dict) -> float:
    """Equivalente aproximado al nivel del mar para clasificación poblacional.

    Garmin conserva el VO2max observado. Este ajuste solo se usa para interpretar
    clasificaciones contra normas calibradas al nivel del mar cuando altitude_m > 1000.
    """
    try:
        v = float(vo2 or 0)
        alt = float(profile.get("altitude_m") or 0)
    except Exception:
        return float(vo2 or 0)
    if not v or alt <= 1000:
        return v
    # Mantiene coherencia con _altitude_adjustment_v47: ~6% a 1760 m, cap prudente.
    factor = 0.06 * max(0, min(2500, alt)) / 1760.0
    return round(v / max(0.85, 1 - factor), 1)

def _vo2_projection_gain_by_status(status: str) -> tuple[float, str]:
    """Ganancia VO2max realista a 8 semanas según Training Status Garmin."""
    s = str(status or "").lower()
    if "productive" in s or "productivo" in s:
        return 6.0, "productive"
    if "peaking" in s or "peak" in s or "pico" in s:
        return 4.5, "peaking"
    if "maintaining" in s or "mant" in s:
        return 3.5, "maintaining"
    if "recovery" in s or "recuper" in s:
        return 3.0, "recovery"
    if "detraining" in s or "desentren" in s:
        return 2.0, "detraining"
    if "unproductive" in s or "no product" in s or "improduct" in s:
        return 1.5, "unproductive"
    if "overreaching" in s or "sobrec" in s:
        return 1.0, "overreaching"
    return 4.0, "default"

def calculate_chronological_age(profile: dict) -> float:
    """Calcula edad cronologica exacta desde birth_date."""
    birth_str = profile.get("birth_date", "1989-03-28")
    try:
        from datetime import date as dt_date
        birth = datetime.fromisoformat(birth_str).date()
        today = _today()
        age = today.year - birth.year
        if (today.month, today.day) < (birth.month, birth.day):
            age -= 1
        return float(age)
    except Exception:
        return 37.0  # default estimado


def calculate_fitness_age(profile: dict, raw: dict) -> dict:
    """
    Calcula 4 edades funcionales:
      - fitness_age_app:    VO2max + FC reposo + actividad
      - recovery_age:       HRV + sueno + estres + carga reciente
      - aerobic_age:        VO2max + eficiencia Z2 + tendencia FC
      - metabolic_age:      IMC + calorias activas + pasos
    """
    chron_age = calculate_chronological_age(profile)
    health    = raw.get("health_daily", [])
    acts      = raw.get("activities", [])

    vo2    = float(profile.get("vo2max", 45) or 45)
    vo2_for_norms = _vo2_altitude_adjusted_for_norms(vo2, profile)
    fc_rep = float(profile.get("fc_reposo", 54) or 54)
    hrv    = float(profile.get("hrv_weekly", 43) or 43)
    bmi    = float(profile.get("bmi", 29.4) or 29.4)
    zones  = profile.get("zones", calc_zones(193, 54))

    # Promedios de salud reciente
    rhr_vals    = [h["rhr"] for h in health[:14] if h.get("rhr")]
    sleep_vals  = [h["sleep_total_h"] for h in health[:14] if h.get("sleep_total_h")]
    stress_vals = [h["avg_stress"] for h in health[:14] if h.get("avg_stress")]
    cal_vals    = [h["cal_active"] for h in health[:14] if h.get("cal_active")]
    step_vals   = [h["steps"] for h in health[:14] if h.get("steps")]
    bb_vals     = [h["bb_high"] for h in health[:7] if h.get("bb_high")]

    avg_rhr    = sum(rhr_vals)/len(rhr_vals)       if rhr_vals    else fc_rep
    avg_sleep  = sum(sleep_vals)/len(sleep_vals)   if sleep_vals  else 7.0
    avg_stress = sum(stress_vals)/len(stress_vals) if stress_vals else 30.0
    avg_cal    = sum(cal_vals)/len(cal_vals)        if cal_vals    else 200.0
    avg_steps  = sum(step_vals)/len(step_vals)      if step_vals   else 5000.0
    avg_bb     = sum(bb_vals)/len(bb_vals)          if bb_vals     else 60.0

    # Minutos vigorosos y Z2 ultima semana
    now = _now()
    week_acts = [a for a in acts if a.get("date") and
                 (now - datetime.strptime(a["date"][:10], "%Y-%m-%d")).days <= 7]
    z2_max = zones[1]["bpm_high"] if zones else 151
    vig_min = sum(a.get("dur_min", 0) for a in week_acts
                  if a.get("avg_hr", 0) > z2_max)
    z2_min  = sum(a.get("dur_min", 0) for a in week_acts
                  if a.get("avg_hr", 0) and a["avg_hr"] <= z2_max)

    # ── Edad Fisica App (VO2max + FC reposo + actividad) ──
    # VO2max normas por sexo y edad (Cooper Institute)
    # Hombre: excellent >= 51, good 43-51, average 35-43, poor < 35
    vo2_age_offset = 0
    if vo2_for_norms >= 55:   vo2_age_offset = -7
    elif vo2_for_norms >= 51: vo2_age_offset = -4
    elif vo2_for_norms >= 47: vo2_age_offset = -2
    elif vo2_for_norms >= 43: vo2_age_offset = 0
    elif vo2_for_norms >= 38: vo2_age_offset = +3
    else:           vo2_age_offset = +6

    rhr_age_offset = 0
    if avg_rhr < 50:    rhr_age_offset = -4
    elif avg_rhr < 55:  rhr_age_offset = -2
    elif avg_rhr < 60:  rhr_age_offset = 0
    elif avg_rhr < 70:  rhr_age_offset = +2
    else:               rhr_age_offset = +5

    act_age_offset = 0
    if vig_min >= 150:  act_age_offset = -3
    elif vig_min >= 75: act_age_offset = -1
    elif vig_min >= 30: act_age_offset = 0
    else:               act_age_offset = +2

    fitness_age_app = round(chron_age + vo2_age_offset + rhr_age_offset * 0.5 + act_age_offset)

    # ── Edad de Recuperacion (HRV + sueno + estres + carga) ──
    hrv_age_offset = 0
    if hrv >= 55:   hrv_age_offset = -4
    elif hrv >= 47: hrv_age_offset = -2
    elif hrv >= 40: hrv_age_offset = 0
    elif hrv >= 32: hrv_age_offset = +3
    else:           hrv_age_offset = +6

    sleep_age_offset = 0
    if avg_sleep >= 8.0:   sleep_age_offset = -2
    elif avg_sleep >= 7.0: sleep_age_offset = 0
    elif avg_sleep >= 6.0: sleep_age_offset = +2
    else:                  sleep_age_offset = +5

    stress_age_offset = 0
    if avg_stress < 25:    stress_age_offset = -2
    elif avg_stress < 35:  stress_age_offset = 0
    elif avg_stress < 50:  stress_age_offset = +2
    else:                  stress_age_offset = +4

    bb_age_offset = 0
    if avg_bb >= 80:   bb_age_offset = -2
    elif avg_bb >= 60: bb_age_offset = 0
    elif avg_bb >= 40: bb_age_offset = +2
    else:              bb_age_offset = +4

    recovery_age = round(chron_age + hrv_age_offset + sleep_age_offset +
                         stress_age_offset * 0.5 + bb_age_offset * 0.5)

    # ── Edad Aerobica (VO2max + eficiencia + tendencia) ──
    # Tendencia VO2max: si sube, baja edad aerobica
    vo2_hist = [(a["date"][:7], a["vo2max"]) for a in acts if a.get("vo2max")]
    vo2_trend_offset = 0
    if len(vo2_hist) >= 3:
        monthly = {}
        for m, v in vo2_hist:
            monthly.setdefault(m, []).append(v)
        months_sorted = sorted(monthly.keys())
        if len(months_sorted) >= 2:
            recent = sum(monthly[months_sorted[-1]]) / len(monthly[months_sorted[-1]])
            old    = sum(monthly[months_sorted[0]])  / len(monthly[months_sorted[0]])
            delta  = recent - old
            if delta >= 2:   vo2_trend_offset = -2
            elif delta >= 1: vo2_trend_offset = -1
            elif delta <= -2:vo2_trend_offset = +2

    aerobic_age = round(chron_age + vo2_age_offset + rhr_age_offset * 0.3 +
                        vo2_trend_offset + act_age_offset * 0.5)

    # ── Edad Metabolica (IMC + calorias + pasos) ──
    bmi_age_offset = 0
    if bmi < 22:    bmi_age_offset = -3
    elif bmi < 25:  bmi_age_offset = -1
    elif bmi < 28:  bmi_age_offset = +1
    elif bmi < 32:  bmi_age_offset = +3
    else:           bmi_age_offset = +5

    cal_age_offset = 0
    if avg_cal >= 500:   cal_age_offset = -3
    elif avg_cal >= 300: cal_age_offset = -1
    elif avg_cal >= 150: cal_age_offset = 0
    else:                cal_age_offset = +2

    step_age_offset = 0
    if avg_steps >= 10000: step_age_offset = -2
    elif avg_steps >= 8000:step_age_offset = -1
    elif avg_steps >= 5000:step_age_offset = 0
    else:                  step_age_offset = +2

    metabolic_age = round(chron_age + bmi_age_offset + cal_age_offset + step_age_offset)

    # ── Delta y clasificacion ──
    age_delta = chron_age - fitness_age_app  # positivo = mejor que edad real
    classif   = ("excelente" if age_delta >= 5 else
                 "buena"     if age_delta >= 2 else
                 "normal"    if age_delta >= -2 else
                 "por mejorar")

    recovery_warning = recovery_age > chron_age + 4

    result = {
        "chronological_age":  round(chron_age, 1),
        "fitness_age_app":    max(18, fitness_age_app),
        "recovery_age":       max(18, recovery_age),
        "aerobic_age":        max(18, aerobic_age),
        "metabolic_age":      max(18, metabolic_age),
        "age_delta":          round(age_delta, 1),
        "classification":     classif,
        "recovery_warning":   recovery_warning,
        "factors": {
            "vo2max_offset":   vo2_age_offset,
            "vo2max_observed":  round(vo2, 1),
            "vo2max_norms_value": round(vo2_for_norms, 1),
            "altitude_adjusted": bool(float(profile.get("altitude_m") or 0) > 1000),
            "rhr_offset":      rhr_age_offset,
            "hrv_offset":      hrv_age_offset,
            "sleep_offset":    sleep_age_offset,
            "stress_offset":   stress_age_offset,
            "bmi_offset":      bmi_age_offset,
            "activity_offset": act_age_offset,
            "vig_min_week":    round(vig_min),
            "z2_min_week":     round(z2_min),
        }
    }
    return result


# ═══════════════════════════════════════════════════════
# DERIVA CARDIACA Y EFICIENCIA AVANZADA
# ═══════════════════════════════════════════════════════

def calculate_cardiac_drift(activity: dict) -> dict | None:
    """
    Deriva cardiaca = aumento de FC en segunda mitad vs primera.
    Requiere datos de HR por lap/split si estan disponibles.
    Estimacion con promedio y max de la actividad.
    """
    avg_hr = activity.get("avg_hr")
    max_hr = activity.get("max_hr")
    dur    = activity.get("dur_min", 0)

    if not avg_hr or not max_hr or dur < 20:
        return None

    # Estimacion: asumiendo que FC max ocurre en segunda mitad
    # Drift estimado = (max_hr - avg_hr) / avg_hr * 100
    drift_pct = (max_hr - avg_hr) / avg_hr * 100

    return {
        "drift_pct":    round(drift_pct, 1),
        "rating":       ("excelente" if drift_pct < 5 else
                         "aceptable" if drift_pct < 8 else
                         "alto"),
        "color":        ("#4ade80" if drift_pct < 5 else
                         "#fbbf24" if drift_pct < 8 else
                         "#f87171"),
        "recommendation": ("" if drift_pct < 5 else
                           "FC estable pero con algo de deriva. Normal." if drift_pct < 8 else
                           "Deriva alta: base aerobica debil, fatiga o deshidratacion."),
        "estimation_warning": "Deriva estimada con max_hr vs avg_hr; no reemplaza deriva real primera mitad vs segunda mitad.",
        "confidence": "media-baja",
        "preferred_method": "Calcular FC media de primera mitad y segunda mitad con laps/FIT cuando estén disponibles.",
    }


def calculate_performance_metrics(raw: dict, profile: dict) -> dict:
    """
    Calcula metricas de rendimiento cruzadas:
    - Eficiencia Z2 (pace promedio en Z2)
    - Economia aeroбica (velocidad / FC)
    - Tendencia VO2max
    - Tendencia FC reposo
    - Distribucion de zonas semanal
    - Carga semanal total
    - Mejor semana / peor semana
    - Deriva cardiaca promedio
    """
    acts   = raw.get("health_daily", [])
    runs   = [a for a in raw.get("activities", [])
              if ("running" in str(a.get("type","")).lower() or str(a.get("type","")).lower() in ("run","jog","virtual_run"))
              and a.get("avg_hr") and a.get("dist_km", 0) > 1]
    zones  = profile.get("zones", calc_zones(193, 54))
    z2_max = zones[1]["bpm_high"] if zones else 151
    z2_min = zones[1]["bpm_low"]  if zones else 137

    now = _now()

    # Eficiencia Z2 (runs donde FC promedio esta en Z2)
    z2_runs = [r for r in runs if r.get("avg_hr") and z2_min <= r["avg_hr"] <= z2_max]
    z2_efficiency = []
    for r in z2_runs[-10:]:
        if r.get("dist_km", 0) > 0:
            pace = r["dur_min"] / r["dist_km"]
            z2_efficiency.append({"date": r["date"][:10], "pace": round(pace, 2),
                                   "hr": r["avg_hr"], "km": r["dist_km"]})

    # Economia aeroбica = km/h / FC
    economy = []
    for r in runs[-15:]:
        if r.get("dist_km", 0) > 0 and r.get("avg_hr"):
            speed_kmh = r["dist_km"] / (r["dur_min"] / 60)
            eco = round(speed_kmh / r["avg_hr"] * 100, 2)
            economy.append({"date": r["date"][:10], "economy": eco,
                            "speed_kmh": round(speed_kmh, 1), "hr": r["avg_hr"]})

    # Tendencia VO2max mensual
    vo2_data = [(a["date"][:7], a["vo2max"]) for a in raw.get("activities", []) if a.get("vo2max")]
    monthly_vo2 = {}
    for m, v in vo2_data:
        monthly_vo2.setdefault(m, []).append(v)
    vo2_trend = [{"month": m, "avg": round(sum(vs)/len(vs), 1)}
                 for m, vs in sorted(monthly_vo2.items())]

    # Tendencia FC reposo
    rhr_7d  = [h["rhr"] for h in raw.get("health_daily", [])[:7] if h.get("rhr")]
    rhr_30d = [h["rhr"] for h in raw.get("health_daily", [])[:30] if h.get("rhr")]
    rhr_trend = {
        "avg_7d":  round(sum(rhr_7d)/len(rhr_7d), 1)   if rhr_7d  else None,
        "avg_30d": round(sum(rhr_30d)/len(rhr_30d), 1)  if rhr_30d else None,
        "direction": ("mejorando" if rhr_7d and rhr_30d and
                       sum(rhr_7d)/len(rhr_7d) < sum(rhr_30d)/len(rhr_30d) - 1
                      else "estable" if rhr_7d and rhr_30d else "sin datos"),
    }

    # Deriva cardiaca promedio
    drifts = [calculate_cardiac_drift(r) for r in runs[-10:]]
    drifts = [d for d in drifts if d]
    avg_drift = round(sum(d["drift_pct"] for d in drifts) / len(drifts), 1) if drifts else None

    # Carga semanal
    week_acts = [a for a in raw.get("activities", []) if a.get("date") and
                 (now - datetime.strptime(a["date"][:10], "%Y-%m-%d")).days <= 7]
    week_load = sum(a.get("training_load", 0) or 0 for a in week_acts)
    week_cal  = sum(a.get("cal", 0) or 0 for a in week_acts)
    week_min  = sum(a.get("dur_min", 0) or 0 for a in week_acts)

    # Score de riesgo de lesion
    injury_risk = _calc_injury_risk(profile, raw)

    return {
        "z2_efficiency":    z2_efficiency,
        "economy":          economy,
        "vo2_trend":        vo2_trend,
        "rhr_trend":        rhr_trend,
        "avg_cardiac_drift":avg_drift,
        "week_load":        round(week_load),
        "week_cal":         round(week_cal),
        "week_min":         round(week_min),
        "injury_risk":      injury_risk,
    }


def _calc_injury_risk(profile: dict, raw: dict) -> dict:
    """Score de riesgo de lesion 0-100 + nivel."""
    acwr     = float(profile.get("acwr", 0) or 0)
    hrv      = float(profile.get("hrv_weekly", 43) or 43)
    subj     = profile.get("subjective", {}) or {}
    joint_p  = float(subj.get("joint_pain") or 0)
    muscle_p = float(subj.get("muscle_pain") or 0)
    rpe_last = float(subj.get("rpe_last") or 5)
    injury   = str(profile.get("injury_status", "none"))

    score = 0

    # ACWR
    if acwr > 1.5:   score += 30
    elif acwr > 1.3: score += 15
    elif acwr < 0.5: score += 5

    # HRV bajo
    if hrv < 32:     score += 20
    elif hrv < 40:   score += 10

    # Dolor articular
    score += joint_p * 5

    # Dolor muscular
    score += muscle_p * 2

    # RPE alto reciente
    if rpe_last >= 9:  score += 15
    elif rpe_last >= 8:score += 8

    # Lesion activa
    if injury == "moderate": score += 25
    elif injury == "minor":  score += 10

    score = min(100, round(score))
    level = ("alto" if score >= 60 else "moderado" if score >= 30 else "bajo")
    color = ("#f87171" if level == "alto" else "#fbbf24" if level == "moderado" else "#4ade80")

    return {"score": score, "level": level, "color": color}




# =======================================================
# ENTRENAMIENTO DIARIO PREMIUM - precision, ciencia y PDF
# =======================================================
def _zone_subrange(zone: dict, part: str = "media") -> tuple[int, int]:
    low = int(zone.get("bpm_low", 0)); high = int(zone.get("bpm_high", low))
    span = max(1, high - low)
    if part == "baja":
        return low, round(low + span * 0.40)
    if part == "alta":
        return round(low + span * 0.60), high
    return round(low + span * 0.30), round(low + span * 0.75)


def _segment(label, min_, zone, bpm, objetivo, control, intensidad="suave"):
    return {
        "label": label,
        "duration_min": float(min_),
        "zone": int(zone),
        "bpm_low": int(bpm[0]),
        "bpm_high": int(bpm[1]),
        "hr_range": f"{int(bpm[0])}-{int(bpm[1])} bpm",
        "objective": objetivo,
        "control": control,
        "intensity_label": intensidad,
    }


def _physicist_workout_identity(wo_type: str, today_str: str | None = None) -> dict:
    banks = {
        "recovery": [
            ("Einstein", "Relatividad Recuperadora"),
            ("Galileo", "Orbitas Suaves"),
            ("Feynman", "Movimiento Ligero"),
        ],
        "mobility_stretch": [
            ("Lorentz", "Transformacion Suave"),
            ("Carnot", "Ciclo de Restauracion"),
            ("Boltzmann", "Entropia Cero"),
        ],
        "rebuild_base": [
            ("Newton", "Base Gravitacional"),
            ("Kepler", "Orbita Aerobica"),
            ("Faraday", "Campo Base"),
        ],
        "easy_z2": [
            ("Curie", "Energia Constante"),
            ("Hawking", "Horizonte Z2"),
            ("Noether", "Simetria Aerobica"),
        ],
        "long_z2": [
            ("Humboldt", "Expedicion Larga"),
            ("Darwin", "Seleccion de Volumen"),
            ("Laplace", "Campo Extenso"),
        ],
        "progression_run": [
            ("Doppler", "Efecto Progresivo"),
            ("Bernoulli", "Flujo Ascendente"),
            ("Herschel", "Espectro Gradual"),
        ],
        "z3_tempo_intro": [
            ("Tesla", "Corriente Tempo"),
            ("Bohr", "Salto Cuantico"),
            ("Planck", "Umbral Cuantizado"),
        ],
        "z3_tempo_continuo": [
            ("Ohm", "Resistencia Sostenida"),
            ("Ampere", "Corriente Continua"),
            ("Volta", "Potencial Tempo"),
        ],
        "strides_neuromuscular": [
            ("Mendel", "Activacion Genetica"),
            ("Turing", "Algoritmo Rapido"),
            ("Ramanujan", "Series Cortas"),
        ],
        "fartlek": [
            ("Dirac", "Ondas Variables"),
            ("Fermi", "Estimacion Fartlek"),
            ("Born", "Probabilidad de Ritmo"),
        ],
        "squash_conditioning": [
            ("Penrose", "Geometria de Cancha"),
            ("Hooke", "Elasticidad Reactiva"),
            ("Young", "Modulo de Agilidad"),
        ],
        "squash_cancha": [
            ("Noether", "Simetria de Raqueta"),
            ("Pauli", "Exclusion Tactica"),
            ("Heisenberg", "Incertidumbre Reactiva"),
        ],
        "strength_preventive": [
            ("Euler", "Estructuras de Fuerza"),
            ("Cauchy", "Tension Controlada"),
            ("Poisson", "Distribucion de Carga"),
        ],
        "vo2max_intervals": [
            ("Rutherford", "Nucleo VO2"),
            ("Schrodinger", "Intervalos Cuanticos"),
            ("Heisenberg", "Incertidumbre Controlada"),
        ],
        "vo2max_4x4": [
            ("Maxwell", "Campo Maximo"),
            ("Lavoisier", "Oxigeno Maximo"),
            ("Archimedes", "Empuje 4x4"),
        ],
        "fat_burn_long": [("Joule", "Energia Prolongada"),("Carnot", "Ciclo de Oxidacion"),("Helmholtz", "Energia Libre"),],
        "fat_burn_hiit": [("Gibbs", "Entropia Metabolica"),("Clausius", "Calor Intermitente"),("Rankine", "Ciclo Explosivo"),],
        "circuit_metabolic": [("Watt", "Potencia Metabolica"),("Hertz", "Frecuencia de Esfuerzo"),("Joule", "Trabajo Total"),],
        "z2_pyramid": [("Pascal", "Presion Progresiva"),("Torricelli", "Columna Aerobica"),("Boyle", "Expansion Z2"),],
        "tempo_escalonado": [("Fourier", "Series de Tempo"),("Laplace", "Transformada de Umbral"),("Cauchy", "Convergencia"),],
        "squash_technical": [("Fermat", "Principio de Minima Accion"),("Lagrange", "Mecanica Analitica"),("Hamilton", "Trayectoria"),],
        "mindful_recovery": [("Einstein", "Relatividad del Descanso"),("Bohr", "Complementariedad"),("Heisenberg", "Presencia"),],
        "intervals_400m": [("Usain", "Velocidad Cuantica"),("Owens", "Sprint Relativo"),("Lewis", "Aceleracion Pura"),],
        "intervals_800m": [("Coe", "Ritmo de Pista"),("Kipketer", "Umbral de Distancia"),("Aouita", "Protocolo 800"),],
        "cruise_intervals": [("Lydiard", "Umbral de Crucero"),("Canova", "Bloques de Lactato"),("Pfitzinger", "Intervalos de Umbral"),],
        "hill_repeats": [("Zatopek", "Resistencia de Cuesta"),("Prefontaine", "Fuerza de Pendiente"),("Bikila", "Potencia Natural"),],
        "norwegian_15_15": [("Tjelta", "Metodo Noruego"),("Moen", "Series Nordicas"),("Ingebrigtsen", "Protocolo Escandinavo"),],
        "z2_negative_split": [("Kiptchoge", "Split Negativo"),("Radcliffe", "Progresion Inversa"),("Bekele", "Aceleracion Final"),],
        "fat_burn_walk": [("Humboldt", "Exploracion Metabolica"),("Muir", "Caminata Profunda"),("Darwin", "Adaptacion Lenta"),],
        "squash_ghosting_hiit": [("Khan", "Esquinas Explosivas"),("Power", "Velocidad de Cancha"),("Gaultier", "Reactividad Maxima"),],
        "strength_explosive": [("Newton", "Fuerza de Impulsion"),("Huxley", "Contraccion Explosiva"),("Hill", "Potencia Muscular"),],
        "yoga_recovery": [("Patanjali", "Flujo de Restauracion"),("Iyengar", "Alineacion Consciente"),("Krishnamacharya", "Movilidad Profunda"),],
    }
    arr = banks.get(wo_type, banks["easy_z2"])
    try:
        d = datetime.fromisoformat((today_str or _today().isoformat())[:10]).date()
        idx = (d.timetuple().tm_yday + len(wo_type)) % len(arr)
    except Exception:
        idx = 0
    physicist, theme = arr[idx]
    return {
        "physicist": physicist,
        "theme": theme,
        "display_prefix": f"Metodo {physicist}: {theme}",
        "daily_code": f"{physicist.upper()}-{_today().strftime('%j')}",
    }


def _precise_segments_for_workout(wo_type: str, zones: list[dict], dur_base: int) -> list[dict]:
    z1, z2, z3, z4, z5 = zones[0], zones[1], zones[2], zones[3], zones[4]
    z1m = _zone_subrange(z1, "media"); z1a = _zone_subrange(z1, "alta")
    z2b = _zone_subrange(z2, "baja"); z2m = _zone_subrange(z2, "media"); z2a = _zone_subrange(z2, "alta")
    z3m = _zone_subrange(z3, "media"); z4m = _zone_subrange(z4, "media"); z5b = _zone_subrange(z5, "baja")
    if wo_type == "recovery":
        return [
            _segment("Caminata consciente", 12, 1, z1m, "Bajar estres autonomico y mover sangre", "Respiracion nasal; si sube la FC, caminar mas lento", "muy suave"),
            _segment("Soltar piernas", 8, 1, z1a, "Activar sin fatigar", "Mantener conversacion completa", "suave"),
        ]
    if wo_type == "rebuild_base":
        return [
            _segment("Calentamiento", 5, 1, z1a, "Preparar tendones y articulaciones", "Subir la FC lentamente", "suave"),
            _segment("Trote caminata", max(12, dur_base), 2, z2b, "Reconstruir base aerobica sin disparar FC", "3 min trote + 2 min caminata; caminar si pasa el limite", "controlado"),
            _segment("Enfriamiento", 5, 1, z1m, "Cerrar con recuperacion activa", "Terminar por debajo de 110 bpm si es posible", "suave"),
        ]
    if wo_type == "easy_z2":
        return [
            _segment("Calentamiento progresivo", 5, 1, z1a, "Entrar en calor sin deuda de oxigeno", "No correr fuerte en los primeros 5 min", "suave"),
            _segment("Z2 baja", max(8, round(dur_base * 0.35)), 2, z2b, "Aumentar oxidacion de grasa y base mitocondrial", "Respirar por nariz o frases largas", "facil"),
            _segment("Z2 media", max(8, round(dur_base * 0.45)), 2, z2m, "Sostener carga aerobica util", "FC estable; si deriva, bajar ritmo", "controlado"),
            _segment("Z2 alta corta", max(4, round(dur_base * 0.20)), 2, z2a, "Cerrar con estimulo aerobico sin entrar en zona gris", "No pasar a Z3", "moderado"),
            _segment("Enfriamiento", 5, 1, z1m, "Facilitar recuperacion", "Caminar/trotar suave", "suave"),
        ]
    if wo_type == "z3_tempo_intro":
        return [
            _segment("Calentamiento Z1-Z2", 8, 2, z2b, "Preparar sistema aerobico", "Ritmo comodo", "suave"),
            _segment("Tempo 1", 5, 3, z3m, "Mejorar umbral aerobico y economia", "Fuerte controlado, sin jadear", "tempo"),
            _segment("Recuperacion", 3, 2, z2b, "Eliminar fatiga parcial", "Volver a respirar comodo", "facil"),
            _segment("Tempo 2", 5, 3, z3m, "Repetir estimulo de umbral", "No convertirlo en sprint", "tempo"),
            _segment("Recuperacion", 3, 2, z2b, "Bajar lactato", "Trote muy suave", "facil"),
            _segment("Enfriamiento", 6, 1, z1m, "Cerrar el sistema", "Terminar suave", "suave"),
        ]
    if wo_type == "vo2max_intervals":
        return [
            _segment("Calentamiento Z1-Z2", 10, 2, z2m, "Preparar musculos y corazon", "Progresivo, sin llegar a Z4", "suave"),
            _segment("4 repeticiones: trabajo", 12, 4, z4m, "Elevar consumo de oxigeno de forma segura", "4 x 3 min; FC debe subir progresiva", "fuerte"),
            _segment("4 repeticiones: recuperacion", 12, 1, z1a, "Permitir repetir calidad", "3 min suave entre esfuerzos", "suave"),
            _segment("Enfriamiento", 6, 1, z1m, "Recuperar sistema nervioso", "Caminar si hace falta", "suave"),
        ]
    if wo_type == "vo2max_4x4":
        return [
            _segment("Calentamiento progresivo", 10, 2, z2m, "Preparar para alta demanda aerobica", "Ultimos 2 min rozar Z3 sin forzar", "progresivo"),
            _segment("4 x 4 min VO2", 16, 5, z5b, "Maximizar estimulo de VO2max", "Control: fuerte pero repetible; no sprint total", "muy fuerte"),
            _segment("3 min recuperacion entre bloques", 12, 1, z1a, "Recuperar sin enfriar demasiado", "Bajar FC antes del siguiente bloque", "suave"),
            _segment("Enfriamiento", 6, 1, z1m, "Bajar carga cardiovascular", "Terminar caminando si FC sigue alta", "suave"),
        ]
    return []


def _daily_recommendations_for_workout(wo_type: str, ctx: dict) -> list[str]:
    recs = []
    if ctx.get("sick"):
        recs.append("Reportaste enfermedad: prioriza descanso, hidratacion y no hagas intensidad.")
    if ctx.get("tr_score", 80) < 55:
        recs.append("Preparacion para entrenar baja: reduce volumen y mantente en Z1-Z2.")
    if ctx.get("hrv_week", 43) < ctx.get("hrv_bl_lo", 40):
        recs.append("HRV por debajo de tu base: hoy el objetivo es recuperarte, no demostrar forma.")
    if ctx.get("avg_sleep", 7) < 6.5:
        recs.append("Sueno corto: evita intervalos; busca terminar con sensacion de energia.")
    if ctx.get("acwr", 1) > 1.3:
        recs.append("Carga reciente alta: no aumentes distancia ni intensidad aunque te sientas bien.")
    if ctx.get("rhr_elevated"):
        recs.append("FC de reposo elevada: calienta mas largo y corta si la FC sube demasiado rapido.")
    if ctx.get("high_intensity_3d"):
        recs.append("Ya hubo Z4/Z5 real reciente por FC: deja 48-72 h antes de otro estimulo fuerte.")
    elif ctx.get("high_training_effect_3d"):
        recs.append("Garmin detectó carga alta reciente, aunque no haya Z4/Z5 claro: calienta bien y controla sensaciones.")
    if ctx.get("squash_z4z5_48h"):
        recs.append("Squash reciente sí llegó a Z4/Z5: cuenta como estímulo intenso; respeta recuperación.")
    elif ctx.get("squash_48h"):
        recs.append("Squash reciente no alcanzó Z4/Z5: cuenta como carga neuromuscular, pero no como intensidad cardiaca alta.")
    if ctx.get("days_since_run", 0) > 14:
        recs.append("Vuelves tras varios dias sin correr: usa trote/caminata y protege articulaciones.")
    if wo_type in ("vo2max_intervals", "vo2max_4x4"):
        recs.append("En intervalos, la FC tarda en subir: corre por sensacion fuerte-controlada los primeros 60-90 s.")
        recs.append("Deten el bloque si hay dolor articular, mareo, dolor de pecho o perdida de tecnica.")
    elif wo_type in ("easy_z2", "rebuild_base"):
        recs.append("La meta es estabilidad: si la FC pasa el techo de la zona, baja ritmo antes de acumular fatiga.")
    if not recs:
        recs.append("Estado estable: ejecuta el plan, termina con 1-2 repeticiones en reserva y registra sensaciones.")
    return recs[:8]


def _science_principles_for_workout(wo_type: str) -> list[dict]:
    base = [
        {"title": "Zonas por FC de reserva", "text": "Usa Karvonen para personalizar la intensidad con FC maxima y FC de reposo."},
        {"title": "Control de carga", "text": "Combina ACWR, HRV, sueno y readiness para evitar sobrecarga."},
    ]
    specific = {
        "recovery": [{"title": "Recuperacion activa", "text": "Z1 mejora flujo sanguineo sin anadir estres fisiologico relevante."}],
        "mobility_stretch": [{"title": "Recuperacion pasiva", "text": "Movilidad articular y estiramiento reducen rigidez sin carga cardiovascular. Ideal tras dias rojos."}],
        "rebuild_base": [{"title": "Progresion conservadora", "text": "El trote/caminata permite volver a correr manteniendo impacto y FC bajo control."}],
        "easy_z2": [{"title": "Base aerobica", "text": "Z2 desarrolla eficiencia mitocondrial, economia y tolerancia al volumen."}],
        "long_z2": [{"title": "Tirada larga", "text": "Sesiones >45 min en Z2 desarrollan resistencia de larga distancia y oxidacion de grasa maxima (Jeukendrup 2002)."}],
        "progression_run": [{"title": "Carrera progresiva", "text": "Inicio Z2 → fin Z3: entrena el cuerpo a sostener ritmo cuando hay fatiga acumulada. Seiler 2010."}],
        "z3_tempo_intro": [{"title": "Umbral controlado", "text": "Bloques cortos en Z3 mejoran sostenibilidad sin convertir cada sesion en alta intensidad."}],
        "z3_tempo_continuo": [{"title": "Tempo sostenido", "text": "20-30 min continuos en Z3 elevan el umbral de lactato. Requiere buena base aerobica previa."}],
        "strides_neuromuscular": [{"title": "Activacion neuromuscular", "text": "Aceleraciones cortas de 20 seg mejoran economia de carrera sin carga cardiovascular significativa."}],
        "fartlek": [{"title": "Entrenamiento variable", "text": "Cambios de ritmo no estructurados mejoran la tolerancia a variaciones de intensidad. Simula condiciones de competencia."}],
        "squash_conditioning": [{"title": "Condicionamiento de cancha", "text": "Ghosting y ejercicios de pies desarrollan capacidad reactiva y resistencia especifica para squash."}],
        "squash_cancha": [{"title": "Sesion real de squash", "text": "Partido o entrenamiento tecnico en cancha combina esfuerzo intermitente Z2-Z4, velocidad de reaccion y agilidad. Demanda aerobica-anaerobica mixta."}],
        "strength_preventive": [{"title": "Fuerza preventiva", "text": "Ejercicios de core y cadena cinetica reducen riesgo de lesion en corredores. Complementa el entrenamiento aerobico."}],
        "vo2max_intervals": [{"title": "Intervalos 3 min", "text": "Bloques de 3 min en Z4 elevan consumo de oxigeno con menor coste que esfuerzos maximos."}],
        "vo2max_4x4": [{"title": "4x4 VO2max", "text": "Cuatro bloques de 4 min permiten acumular tiempo cerca de la FC alta con recuperaciones completas. Wisloff 2007."}],
        "fat_burn_long": [{"title": "Tirada larga quema grasa", "text": "Sesiones >55 min en Z1-Z2 maximizan la oxidacion de grasa como combustible. Jeukendrup 2002."}],
        "fat_burn_hiit": [{"title": "HIIT y EPOC", "text": "Los intervalos de alta intensidad generan EPOC que eleva el metabolismo 24-48h. Boutcher 2011."}],
        "circuit_metabolic": [{"title": "Circuito metabolico", "text": "Fuerza+cardio en circuito maximiza gasto calorico y preserva masa muscular. Bryner 1999."}],
        "z2_pyramid": [{"title": "Piramide Z2", "text": "Cambios de velocidad dentro de Z2 activan mas fibras sin salir de la zona de oxidacion de grasa. Lucia 2000."}],
        "tempo_escalonado": [{"title": "Tempo escalonado Z2-Z3", "text": "Alternancia Z2-Z3 en bloques mejora la zona de transicion aerobica. Seiler 2010."}],
        "squash_technical": [{"title": "Practica tecnica squash", "text": "Tecnica sin fatiga alta consolida patrones de movimiento y mejora economia. Sin carga cardiovascular significativa."}],
        "mindful_recovery": [{"title": "Recuperacion consciente", "text": "Respiracion 4-4-6 activa el nervio vago y reduce cortisol post-ejercicio. Porges 2011."}],
        "intervals_400m": [{"title": "Intervalos 400m", "text": "Los intervalos cortos en Z4 mejoran la economia de carrera y la potencia neuromuscular sin la carga de intervalos largos. Barnes 2014."}],
        "intervals_800m": [{"title": "Intervalos 800m", "text": "6x800m es el protocolo clasico para estimular VO2max con mayor volumen en Z4 que el 4x3min. Daniels 2005."}],
        "cruise_intervals": [{"title": "Cruise intervals", "text": "3x10min en umbral de lactato mejora la capacidad de sostener ritmo alto. Jack Daniels 2005."}],
        "hill_repeats": [{"title": "Repeticiones en cuesta", "text": "Las subidas desarrollan fuerza especifica de carrera y potencia aerobica con menor impacto que sprints en llano. Noakes 2003."}],
        "norwegian_15_15": [{"title": "Metodo noruego 15-15", "text": "30 repeticiones de 15s/15s al 90-95% acumulan mas tiempo cerca del VO2max que protocolos clasicos con menos fatiga. Tjelta 2019."}],
        "z2_negative_split": [{"title": "Split negativo Z2", "text": "Correr la segunda mitad mas rapido que la primera entrena la gestion del glucogeno y la resistencia a la fatiga. Magill 2014."}],
        "fat_burn_walk": [{"title": "Caminata quema grasa", "text": "La caminata sostenida usa hasta 70% grasa como combustible. Sin impacto articular. Ideal para dias de recuperacion activa con objetivo de perdida de peso."}],
        "squash_ghosting_hiit": [{"title": "Ghosting HIIT", "text": "El ghosting a maxima velocidad con recuperacion corta desarrolla la capacidad anaerobica especifica del squash. Girard 2011."}],
        "strength_explosive": [{"title": "Fuerza explosiva", "text": "Los ejercicios de potencia mejoran el tiempo de reaccion y la velocidad de aceleracion, criticos para el squash. Baker 2001."}],
        "yoga_recovery": [{"title": "Yoga deportivo", "text": "Las posturas de yoga de recuperacion reducen la rigidez muscular y mejoran la movilidad funcional. Ross 2010."}],
    }
    return base + specific.get(wo_type, [])


def _spanish_terms_glossary() -> dict:
    return {
        "Training Readiness": "Preparacion para entrenar",
        "Recovery": "Recuperacion",
        "Workout": "Entrenamiento",
        "Warmup": "Calentamiento",
        "Cooldown": "Enfriamiento",
        "Training Load": "Carga de entrenamiento",
        "ACWR": "Relacion carga aguda/cronica",
        "HRV": "Variabilidad de la frecuencia cardiaca",
        "VO2max": "Consumo maximo de oxigeno",
        "Threshold": "Umbral",
        "Tempo": "Ritmo controlado sostenido",
    }


def _enrich_workout_v21(wo: dict, wo_type: str, zones: list[dict], profile: dict, raw: dict, ctx: dict) -> dict:
    identity = _physicist_workout_identity(wo_type)
    base_name = wo.get("name", "Entrenamiento")
    wo["base_name"] = base_name
    wo["physicist"] = identity["physicist"]
    wo["physicist_theme"] = identity["theme"]
    wo["daily_code"] = identity["daily_code"]
    wo["name"] = f"{identity['display_prefix']} - {base_name}"
    wo["display_name"] = wo["name"]
    wo["precise_segments"] = _precise_segments_for_workout(wo_type, zones, int(ctx.get("dur_base", wo.get("main_min", 20))))
    wo["daily_recommendations"] = _daily_recommendations_for_workout(wo_type, ctx)
    wo["science_principles"] = _science_principles_for_workout(wo_type)
    wo["spanish_terms"] = _spanish_terms_glossary()
    if wo.get("precise_segments"):
        main = max(wo["precise_segments"], key=lambda s: s.get("duration_min", 0))
        wo["specific_hr_target"] = {
            "main_zone": main.get("zone"),
            "bpm_low": main.get("bpm_low"),
            "bpm_high": main.get("bpm_high"),
            "label": main.get("label"),
            "summary": f"Zona principal Z{main.get('zone')}: {main.get('bpm_low')}-{main.get('bpm_high')} bpm",
        }
    wo["share"] = {
        "title": wo["name"],
        "filename": "entrenamiento_diario_running.pdf",
        "message": "Entrenamiento diario ManuSquash listo para compartir.",
    }
    return wo


def _safe_text_pdf(s):
    return str(s).replace("\u2013", "-").replace("\u2014", "-").replace("\u2192", "->")


def _export_workout_pdf_safe(workout: dict, profile: dict, raw: dict) -> dict:
    out_dir = OUT / "workout_exports"
    out_dir.mkdir(exist_ok=True)
    pdf_path = out_dir / "entrenamiento_diario_running.pdf"
    html_path = out_dir / "entrenamiento_diario_running.html"
    created_pdf = False
    # HTML fallback siempre disponible
    segs = workout.get("precise_segments", [])
    recs = workout.get("daily_recommendations", [])
    html = ["<html><head><meta charset='utf-8'><title>Entrenamiento ManuSquash</title>",
            "<style>body{font-family:Arial,sans-serif;margin:28px;color:#111}h1{font-size:22px}table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border:1px solid #ccc;padding:8px;font-size:12px}th{background:#f0f0f0}.box{border:1px solid #ddd;padding:12px;margin:12px 0;border-radius:8px}</style></head><body>"]
    html.append(f"<h1>{_safe_text_pdf(workout.get('name','Entrenamiento diario'))}</h1>")
    html.append(f"<div class='box'><b>Duracion:</b> {workout.get('total_min','--')} min | <b>FC objetivo:</b> {workout.get('hr_range','--')} | <b>Zona:</b> Z{workout.get('zone_target','--')}</div>")
    html.append("<h2>Pasos precisos</h2><table><tr><th>Bloque</th><th>Min</th><th>Zona</th><th>FC</th><th>Objetivo</th><th>Control</th></tr>")
    for s in segs:
        html.append(f"<tr><td>{_safe_text_pdf(s.get('label',''))}</td><td>{s.get('duration_min','')}</td><td>Z{s.get('zone','')}</td><td>{s.get('hr_range','')}</td><td>{_safe_text_pdf(s.get('objective',''))}</td><td>{_safe_text_pdf(s.get('control',''))}</td></tr>")
    html.append("</table><h2>Recomendaciones del dia</h2><ul>")
    for r in recs:
        html.append(f"<li>{_safe_text_pdf(r)}</li>")
    html.append("</ul><h2>Metricas usadas</h2>")
    snap = workout.get("profile_snapshot", {})
    html.append(f"<div class='box'>VO2max {snap.get('vo2max','--')} | Readiness {snap.get('readiness','--')}/100 | ACWR {snap.get('acwr','--')} | HRV {snap.get('hrv','--')} | Sueno {snap.get('sleep_h','--')} h</div>")
    html.append("</body></html>")
    html_path.write_text("".join(html), encoding="utf-8")
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, rightMargin=32, leftMargin=32, topMargin=32, bottomMargin=32)
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8, leading=10))
        story = [Paragraph(_safe_text_pdf(workout.get("name", "Entrenamiento diario")), styles["Title"]), Spacer(1, 8)]
        story.append(Paragraph(_safe_text_pdf(workout.get("description", "")), styles["BodyText"]))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Duracion: {workout.get('total_min','--')} min | FC objetivo: {workout.get('hr_range','--')} | Zona: Z{workout.get('zone_target','--')}", styles["BodyText"]))
        story.append(Spacer(1, 12))
        data = [["Bloque", "Min", "Zona", "FC", "Objetivo", "Control"]]
        for s in segs:
            data.append([_safe_text_pdf(s.get("label", "")), str(s.get("duration_min", "")), f"Z{s.get('zone','')}", s.get("hr_range", ""), _safe_text_pdf(s.get("objective", "")), _safe_text_pdf(s.get("control", ""))])
        table = Table(data, colWidths=[78, 30, 32, 70, 140, 150])
        table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e8eef7")), ("GRID", (0,0), (-1,-1), 0.4, colors.grey), ("VALIGN", (0,0), (-1,-1), "TOP"), ("FONTSIZE", (0,0), (-1,-1), 7)]))
        story.append(table); story.append(Spacer(1, 12))
        story.append(Paragraph("Recomendaciones del dia", styles["Heading2"]))
        for r in recs:
            story.append(Paragraph("- " + _safe_text_pdf(r), styles["Small"]))
        story.append(Spacer(1, 8))
        snap = workout.get("profile_snapshot", {})
        story.append(Paragraph(f"Metricas: VO2max {snap.get('vo2max','--')} | Readiness {snap.get('readiness','--')}/100 | ACWR {snap.get('acwr','--')} | HRV {snap.get('hrv','--')} | Sueno {snap.get('sleep_h','--')} h", styles["Small"]))
        doc.build(story)
        created_pdf = True
    except Exception as e:
        created_pdf = False
    return {"pdf_path": str(pdf_path) if created_pdf else None, "html_path": str(html_path), "created_pdf": created_pdf, "filename": pdf_path.name}



def _mean_safe(vals, default=None):
    vals = [v for v in vals if v is not None]
    if not vals:
        return default
    return sum(vals) / len(vals)


def _count_present(rows: list[dict], key: str) -> int:
    return sum(1 for r in rows if r.get(key) not in (None, '', 0))


def _latest_valid(rows: list[dict], key: str, default=None):
    for r in rows:
        v = r.get(key)
        if v not in (None, '', 0):
            return v
    return default


def _run_candidates(raw: dict) -> list[dict]:
    acts = raw.get('activities', []) or []
    runs = []
    for a in acts:
        typ = str(a.get('type', '')).lower()
        name = str(a.get('name', '')).lower()
        if (typ in ('running', 'trail_running', 'treadmill_running') or 'run' in name or 'carrera' in name) and a.get('dist_km', 0) and a.get('dur_min', 0):
            runs.append(a)
    return sorted(runs, key=lambda x: x.get('date', ''))




def _is_squash_activity(a: dict) -> bool:
    typ = str(a.get('type', '')).lower()
    name = str(a.get('name', '')).lower()
    return 'squash' in name or typ in ('squash', 'racquetball') or (typ == 'other' and 'squash' in name)


def _activity_zone_evidence(a: dict, zones: list[dict]) -> dict:
    """Clasifica si una actividad realmente alcanzo Z4/Z5 usando los datos Garmin disponibles.
    Importante: una actividad de squash NO cuenta como Z4/Z5 solo por ser squash; debe tener evidencia cardiaca.
    """
    avg_hr = float(a.get('avg_hr') or 0)
    max_hr = float(a.get('max_hr') or 0)
    te_aer = float(a.get('te_aer') or 0)
    z4_low = float(zones[3]['bpm_low']) if len(zones) > 3 else 0
    z5_low = float(zones[4]['bpm_low']) if len(zones) > 4 else 0
    evidence = []
    reached_z4 = False
    reached_z5 = False
    likely_z4 = False
    if max_hr and z4_low and max_hr >= z4_low:
        reached_z4 = True; evidence.append(f'FC max {max_hr:.0f} >= Z4 {z4_low:.0f}')
    if max_hr and z5_low and max_hr >= z5_low:
        reached_z5 = True; evidence.append(f'FC max {max_hr:.0f} >= Z5 {z5_low:.0f}')
    if avg_hr and z4_low and avg_hr >= z4_low:
        reached_z4 = True; likely_z4 = True; evidence.append(f'FC promedio {avg_hr:.0f} en Z4+')
    if te_aer >= 3.5:
        likely_z4 = True; evidence.append(f'Training Effect aeróbico {te_aer:.1f}')
    if not evidence:
        evidence.append('No hay evidencia de Z4/Z5: FC max/promedio no alcanzan umbral o falta dato.')
    intensity = 'Z5' if reached_z5 else 'Z4' if reached_z4 else 'Alta probable' if likely_z4 else 'No Z4-Z5'
    return {
        'reached_z4': bool(reached_z4),
        'reached_z5': bool(reached_z5),
        'likely_high_intensity': bool(reached_z4 or reached_z5 or likely_z4),
        'intensity_class': intensity,
        'z4_low': round(z4_low) if z4_low else None,
        'z5_low': round(z5_low) if z5_low else None,
        'evidence': evidence[:4],
    }


def _build_activity_zone_review(raw: dict, profile: dict, limit: int = 12) -> dict:
    zones = profile.get('zones', calc_zones(int(profile.get('fc_max', 193) or 193), int(profile.get('fc_reposo', 54) or 54)))
    acts = sorted(raw.get('activities', []) or [], key=lambda x: x.get('date', ''), reverse=True)
    reviewed = []
    squash_checked = 0
    squash_z4z5 = 0
    for a in acts[:max(30, limit)]:
        ev = _activity_zone_evidence(a, zones)
        is_sq = _is_squash_activity(a)
        if is_sq:
            squash_checked += 1
            if ev.get('reached_z4') or ev.get('reached_z5'):
                squash_z4z5 += 1
        reviewed.append({
            'date': str(a.get('date', ''))[:10],
            'name': a.get('name') or a.get('type') or 'Actividad',
            'type': a.get('type'),
            'dur_min': a.get('dur_min'),
            'avg_hr': a.get('avg_hr'),
            'max_hr': a.get('max_hr'),
            'te_aer': a.get('te_aer'),
            'is_squash': is_sq,
            'counts_as_z4z5': bool(ev.get('reached_z4') or ev.get('reached_z5')),
            **ev,
        })
        if len(reviewed) >= limit:
            break
    return {
        'z4_threshold': zones[3]['bpm_low'] if len(zones) > 3 else None,
        'z5_threshold': zones[4]['bpm_low'] if len(zones) > 4 else None,
        'activities': reviewed,
        'squash_checked': squash_checked,
        'squash_z4z5_count': squash_z4z5,
        'rule': 'Una actividad cuenta como Z4/Z5 solo si FC maxima/promedio cruza Z4/Z5. El nombre squash por si solo no basta.',
    }


def _build_age_analysis(profile: dict, raw: dict) -> dict:
    fa = profile.get('fitness_age') or {}
    chron = fa.get('chronological_age') or profile.get('chronological_age') or calculate_chronological_age(profile)
    phys = fa.get('fitness_age_app')
    recov = fa.get('recovery_age')
    aer = fa.get('aerobic_age')
    metab = fa.get('metabolic_age')
    delta = fa.get('age_delta')
    if delta is None and phys is not None:
        delta = round(float(chron) - float(phys), 1)
    if phys is None:
        return {'available': False, 'reason': 'Falta fitness_age en el perfil exportado.'}
    if delta >= 5:
        status = 'Excelente: tu edad fisica estimada es bastante menor que tu edad cronologica.'
        color = 'green'
    elif delta >= 2:
        status = 'Buena: tu condicion esta por delante de tu edad cronologica.'
        color = 'green'
    elif delta >= -2:
        status = 'Normal: edad fisica cercana a edad cronologica.'
        color = 'yellow'
    else:
        status = 'Por mejorar: conviene priorizar base aerobica, fuerza, peso y recuperacion.'
        color = 'red'
    factors = fa.get('factors') or {}
    levers = []
    if factors.get('bmi_offset', 0) > 0: levers.append('Reducir peso/cintura mejoraria edad metabolica.')
    if factors.get('sleep_offset', 0) > 0: levers.append('Mejorar sueño reduce edad de recuperacion.')
    if factors.get('hrv_offset', 0) > 0: levers.append('HRV baja: mas recuperacion y carga gradual.')
    if factors.get('activity_offset', 0) > 0: levers.append('Aumentar minutos Z1-Z2 mejora edad aerobica.')
    if not levers: levers.append('Mantener Z2, fuerza y sueño para sostener tendencia.')
    return {
        'available': True,
        'chronological_age': round(float(chron), 1),
        'fitness_age': phys,
        'recovery_age': recov,
        'aerobic_age': aer,
        'metabolic_age': metab,
        'age_delta': delta,
        'classification': fa.get('classification'),
        'status': status,
        'color': color,
        'levers': levers[:5],
        'factors': factors,
        'explanation': 'Compara edad cronologica con edad fisica estimada a partir de VO2max, FC reposo, actividad, HRV, sueño, estres, IMC y pasos.',
    }

def _build_fields_available(raw: dict, profile: dict, route_summaries: list[dict] | None = None) -> dict:
    health = raw.get('health_daily', []) or []
    sleep = raw.get('sleep_data', []) or []
    acts = raw.get('activities', []) or []
    runs = _run_candidates(raw)
    route_summaries = route_summaries or []
    route_count = sum(1 for r in route_summaries if r.get('route_available'))
    return {
        'health_days': len(health),
        'activities': len(acts),
        'running_activities': len(runs),
        'rhr_days': _count_present(health, 'rhr'),
        'hrv_days': _count_present(health, 'hrv_night') + _count_present(health, 'hrv_week'),
        'sleep_days': len(sleep) or _count_present(health, 'sleep_total_h'),
        'stress_days': _count_present(health, 'avg_stress'),
        'body_battery_days': _count_present(health, 'bb_high'),
        'spo2_days': _count_present(health, 'spo2_avg'),
        'vo2_activity_points': sum(1 for a in acts if a.get('vo2max')),
        'training_load_activities': sum(1 for a in acts if a.get('training_load')),
        'cadence_activities': sum(1 for a in acts if a.get('cadence')),
        'power_activities': sum(1 for a in acts if a.get('avg_power') or a.get('normalized_power')),
        'elevation_activities': sum(1 for a in acts if a.get('elevation')),
        'activities_with_extra_garmin_fields': sum(1 for a in acts if a.get('garmin_scalar_fields')),
        'hr_running_activities': sum(1 for a in runs if a.get('avg_hr')),
        'max_hr_running_activities': sum(1 for a in runs if a.get('avg_hr') and a.get('max_hr')),
        'gps_routes': route_count,
        'has_training_readiness': bool(raw.get('training_readiness')),
        'has_training_status': bool(raw.get('training_status')),
        'has_training_load_balance': bool(raw.get('training_load_balance')),
        'has_profile': bool(profile),
    }


def _chart_status(available: bool, count: int, required: int, missing: str, suggestion: str, confidence: str = 'media') -> dict:
    if available:
        reason = f'Datos suficientes: {count}/{required} registros minimos.'
    else:
        reason = f'No se muestra porque hay {count}/{required} registros minimos. Falta: {missing}'
    return {
        'available': bool(available),
        'count': int(count),
        'required': int(required),
        'reason': reason,
        'missing': missing,
        'suggestion': suggestion,
        'confidence': confidence if available else 'baja',
    }


def _build_chart_statuses(raw: dict, profile: dict, fields: dict) -> dict:
    health = raw.get('health_daily', []) or []
    sleep = raw.get('sleep_data', []) or []
    pm = profile.get('performance_metrics', {}) or {}
    economy = pm.get('economy', []) or []
    vo2_trend = pm.get('vo2_trend', []) or []
    runs = _run_candidates(raw)
    z2_runs = []
    zones = profile.get('zones', calc_zones(int(profile.get('fc_max', 193) or 193), int(profile.get('fc_reposo', 54) or 54)))
    z2_low = zones[1]['bpm_low'] if len(zones) > 1 else 137
    z2_high = zones[1]['bpm_high'] if len(zones) > 1 else 151
    for r in runs:
        if r.get('avg_hr') and z2_low <= r['avg_hr'] <= z2_high:
            z2_runs.append(r)
    drift_count = sum(1 for r in runs if r.get('avg_hr') and r.get('max_hr') and (r.get('dur_min') or 0) >= 20)
    sleep_rhr_pairs = 0
    for i in range(len(health) - 1):
        if health[i].get('sleep_total_h') and health[i + 1].get('rhr'):
            sleep_rhr_pairs += 1
    statuses = {
        'chart-rhr': _chart_status(fields.get('rhr_days', 0) >= 5, fields.get('rhr_days', 0), 5, 'FC de reposo diaria', 'Usar el reloj al dormir y sincronizar Garmin cada dia.', 'alta'),
        'chart-hrv': _chart_status(fields.get('hrv_days', 0) >= 5, fields.get('hrv_days', 0), 5, 'HRV nocturno/semanal', 'Dormir con el reloj ajustado y activar seguimiento de HRV.', 'alta'),
        'chart-bb': _chart_status(fields.get('body_battery_days', 0) >= 5, fields.get('body_battery_days', 0), 5, 'Body Battery diario', 'Usar el reloj durante el dia y durante el sueno.', 'media'),
        'chart-steps': _chart_status(fields.get('health_days', 0) >= 5, fields.get('health_days', 0), 5, 'dias de salud', 'Sincronizar Garmin diariamente.', 'alta'),
        'chart-stress': _chart_status(fields.get('stress_days', 0) >= 5, fields.get('stress_days', 0), 5, 'estres promedio diario', 'Usar el reloj varias horas durante el dia.', 'media'),
        'chart-sleep': _chart_status((len(sleep) or fields.get('sleep_days', 0)) >= 5, len(sleep) or fields.get('sleep_days', 0), 5, 'sueno registrado', 'Dormir con el reloj minimo 5 noches.', 'alta'),
        'chart-spo2': _chart_status(fields.get('spo2_days', 0) >= 5, fields.get('spo2_days', 0), 5, 'SpO2 disponible', 'Activar PulseOx/SpO2 si tu dispositivo y bateria lo permiten.', 'media'),
        'chart-active': _chart_status(fields.get('health_days', 0) >= 5, fields.get('health_days', 0), 5, 'minutos activos diarios', 'Sincronizar datos diarios.', 'alta'),
        'chart-cals': _chart_status(fields.get('health_days', 0) >= 5, fields.get('health_days', 0), 5, 'calorias activas diarias', 'Usar el reloj durante el dia.', 'media'),
        'chart-vo2': _chart_status(len(vo2_trend) >= 2 or fields.get('vo2_activity_points', 0) >= 2, max(len(vo2_trend), fields.get('vo2_activity_points', 0)), 2, 'VO2max por actividad o mensual', 'Realizar carreras outdoor/indoor registradas con FC para que Garmin estime VO2max.', 'media'),
        'chart-load': _chart_status(fields.get('has_training_load_balance', False), 1 if fields.get('has_training_load_balance') else 0, 1, 'Training Load Balance', 'Esperar a que Garmin genere balance de carga o registrar mas actividades con FC.', 'media'),
        'chart-run-hr': _chart_status(fields.get('hr_running_activities', 0) >= 3, fields.get('hr_running_activities', 0), 3, 'carreras con FC promedio', 'Registrar minimo 3 carreras con sensor de FC.', 'alta'),
        'chart-efficiency': _chart_status(len(economy) >= 3, len(economy), 3, 'distancia + duracion + FC en carreras', 'Registrar minimo 3 carreras con distancia, duracion y FC promedio.', 'alta'),
        'chart-drift': _chart_status(drift_count >= 3, drift_count, 3, 'FC promedio, FC maxima y duracion >=20 min', 'Registrar carreras de al menos 20 min con FC confiable.', 'media'),
        'chart-economy': _chart_status(len(economy) >= 3, len(economy), 3, 'economia aerobica calculable', 'Registrar carreras con distancia, duracion y FC promedio.', 'alta'),
        'chart-vo2-hrv': _chart_status(len(vo2_trend) >= 2 and fields.get('hrv_days', 0) >= 5, min(len(vo2_trend), fields.get('hrv_days', 0)), 2, 'VO2max mensual + HRV', 'Acumular varias semanas con VO2max y HRV nocturno.', 'media'),
        'chart-readiness-load': _chart_status(fields.get('body_battery_days', 0) >= 5 and fields.get('hrv_days', 0) >= 5, min(fields.get('body_battery_days', 0), fields.get('hrv_days', 0)), 5, 'Body Battery drenado + HRV', 'Usar el reloj dia y noche durante minimo 5 dias.', 'media'),
        'chart-sleep-perf': _chart_status(sleep_rhr_pairs >= 5, sleep_rhr_pairs, 5, 'sueno + FC reposo del dia siguiente', 'Dormir con el reloj y sincronizar datos consecutivos.', 'alta'),
        'chart-stress-rhr': _chart_status(fields.get('stress_days', 0) >= 5 and fields.get('rhr_days', 0) >= 5, min(fields.get('stress_days', 0), fields.get('rhr_days', 0)), 5, 'estres + FC reposo', 'Usar el reloj durante el dia y al dormir.', 'media'),
        'chart-rhr-trend': _chart_status(fields.get('rhr_days', 0) >= 5, fields.get('rhr_days', 0), 5, 'FC reposo diaria', 'Dormir con el reloj durante varios dias.', 'alta'),
        'chart-fat-cumulative-grasa': _chart_status(len(raw.get('activities', []) or []) >= 1, len(raw.get('activities', []) or []), 1, 'actividades con calorias, duracion y FC para FatOx', 'Registrar o sincronizar al menos una actividad con FC y calorias.', 'media'),
        'chart-fat-daily': _chart_status(len(raw.get('activities', []) or []) >= 1, len(raw.get('activities', []) or []), 1, 'actividades para estimar grasa diaria', 'Registrar actividades con FC promedio, calorias y duracion.', 'media'),
        'chart-fat-session': _chart_status(len(raw.get('activities', []) or []) >= 1, len(raw.get('activities', []) or []), 1, 'sesiones con FatOx calculable', 'Sincronizar actividades con FC promedio, calorias y duracion.', 'media'),
        'chart-fat-substrate': _chart_status(len(raw.get('activities', []) or []) >= 1, len(raw.get('activities', []) or []), 1, 'sustrato estimado por sesion', 'Sincronizar actividades con datos completos.', 'media'),
        'chart-fat-zone-model': _chart_status(True, 5, 5, 'modelo de zonas FC para grasa', 'Disponible desde perfil FC max/reposo.', 'media'),
        'z2-quality': _chart_status(len(z2_runs) >= 2, len(z2_runs), 2, 'carreras dentro de Z2', 'Hacer 2 sesiones Z2 con FC dentro del rango indicado.', 'alta'),
        'gray-zone': _chart_status(fields.get('hr_running_activities', 0) >= 3, fields.get('hr_running_activities', 0), 3, 'carreras con FC promedio', 'Registrar mas carreras con FC para estimar distribucion de intensidad.', 'media'),
        'age-analysis': _chart_status(bool(profile.get('fitness_age')), 1 if profile.get('fitness_age') else 0, 1, 'edad fisica calculada', 'Ejecutar el script completo para recalcular perfil, VO2max, HRV y edad fisica.', 'media'),
        'activity-zone-review': _chart_status(fields.get('activities', 0) >= 1, fields.get('activities', 0), 1, 'actividades con FC', 'Registrar actividades con FC maxima/promedio para validar si realmente llegaron a Z4/Z5.', 'alta'),
    }
    return statuses


def _build_z2_quality(raw: dict, profile: dict) -> dict:
    runs = _run_candidates(raw)
    zones = profile.get('zones', calc_zones(int(profile.get('fc_max', 193) or 193), int(profile.get('fc_reposo', 54) or 54)))
    z2_low = zones[1]['bpm_low'] if len(zones) > 1 else 137
    z2_high = zones[1]['bpm_high'] if len(zones) > 1 else 151
    series = []
    for r in runs[-20:]:
        avg = r.get('avg_hr')
        dur = float(r.get('dur_min') or 0)
        dist = float(r.get('dist_km') or 0)
        max_hr = r.get('max_hr')
        if not avg or not dur or not dist:
            continue
        score = 100
        notes = []
        if avg < z2_low:
            score -= min(25, int((z2_low - avg) * 1.5)); notes.append('FC por debajo de Z2')
        elif avg > z2_high:
            score -= min(35, int((avg - z2_high) * 2)); notes.append('FC por encima de Z2')
        else:
            notes.append('FC dentro de Z2')
        if dur < 25:
            score -= 15; notes.append('duracion corta para base')
        if max_hr and avg:
            drift = round((max_hr - avg) / avg * 100, 1)
            if drift > 8:
                score -= 20; notes.append('deriva alta')
            elif drift > 5:
                score -= 8; notes.append('deriva moderada')
        else:
            drift = None
            score -= 5; notes.append('sin FC maxima')
        score = max(0, min(100, score))
        label = 'Excelente' if score >= 85 else 'Buena' if score >= 70 else 'Mejorable' if score >= 50 else 'Baja'
        series.append({
            'date': str(r.get('date', ''))[:10],
            'score': score,
            'label': label,
            'avg_hr': avg,
            'max_hr': max_hr,
            'duration_min': dur,
            'dist_km': dist,
            'pace': round(dur / dist, 2) if dist else None,
            'drift_pct': drift,
            'notes': notes[:3],
        })
    latest = series[-1] if series else None
    return {
        'latest_score': latest.get('score') if latest else None,
        'latest_label': latest.get('label') if latest else 'Sin datos suficientes',
        'z2_range': f'{z2_low}-{z2_high} bpm',
        'series': series[-12:],
        'explanation': 'Evalua si la sesion Z2 fue realmente controlada: FC dentro de zona, duracion suficiente y deriva baja.',
    }


def _build_gray_zone_detector(raw: dict, profile: dict) -> dict:
    runs = _run_candidates(raw)
    zones = profile.get('zones', calc_zones(int(profile.get('fc_max', 193) or 193), int(profile.get('fc_reposo', 54) or 54)))
    z2_high = zones[1]['bpm_high'] if len(zones) > 1 else 151
    z3_high = zones[2]['bpm_high'] if len(zones) > 2 else 165
    recent = []
    now = _now()
    for a in raw.get('activities', []) or []:
        if not a.get('date') or not a.get('dur_min') or not a.get('avg_hr'):
            continue
        try:
            age = (now - datetime.strptime(str(a['date'])[:10], '%Y-%m-%d')).days
        except Exception:
            age = 999
        if age <= 14:
            recent.append(a)
    total = sum(float(a.get('dur_min') or 0) for a in recent)
    low = sum(float(a.get('dur_min') or 0) for a in recent if float(a.get('avg_hr') or 0) <= z2_high)
    mid = sum(float(a.get('dur_min') or 0) for a in recent if z2_high < float(a.get('avg_hr') or 0) <= z3_high)
    high = sum(float(a.get('dur_min') or 0) for a in recent if float(a.get('avg_hr') or 0) > z3_high)
    pct_low = round(low / total * 100) if total else 0
    pct_mid = round(mid / total * 100) if total else 0
    pct_high = round(high / total * 100) if total else 0
    if total == 0:
        diagnosis = 'Sin datos suficientes'
        recommendation = 'Registra actividades con FC para detectar distribucion de intensidad.'
        level = 'unknown'
    elif pct_mid >= 30:
        diagnosis = 'Zona gris alta'
        recommendation = 'Convierte una sesion media en Z2 baja o en intervalos bien definidos; evita correr siempre medio duro.'
        level = 'warning'
    elif pct_low >= 70 and pct_high <= 25:
        diagnosis = 'Distribucion saludable'
        recommendation = 'Mantener base Z1-Z2 y usar intensidad solo cuando semaforo este verde.'
        level = 'good'
    else:
        diagnosis = 'Distribucion mixta'
        recommendation = 'Vigila que Z3 no reemplace ni la base Z2 ni la intensidad real.'
        level = 'moderate'
    return {
        'total_min_14d': round(total),
        'low_pct': pct_low,
        'gray_pct': pct_mid,
        'high_pct': pct_high,
        'diagnosis': diagnosis,
        'recommendation': recommendation,
        'level': level,
        'explanation': 'Estimacion por FC promedio de actividad. No reemplaza tiempo exacto por zona, pero detecta tendencia de entrenar demasiado en intensidad media.',
    }


def _build_hydration_plan(profile: dict, workout: dict, raw: dict) -> dict:
    weight = float(profile.get('weight_kg') or 85)
    total_min = float(workout.get('total_min') or 0)
    base_low = round(weight * 0.030, 1)
    base_high = round(weight * 0.035, 1)
    exercise_extra = round((total_min / 60.0) * 0.55, 1) if total_min else 0.0
    if workout.get('zone_target', 2) >= 4:
        exercise_extra = round(exercise_extra + 0.2, 1)
    total_low = round(base_low + exercise_extra, 1)
    total_high = round(base_high + exercise_extra, 1)
    return {
        'base_l_range': f'{base_low}-{base_high} L',
        'exercise_extra_l': exercise_extra,
        'total_l_range': f'{total_low}-{total_high} L',
        'before': f'{round(weight*5)}-{round(weight*7)} ml 3-4 h antes si vas a entrenar.',
        'during': '400-600 ml/h si dura 45-75 min; 600-800 ml/h con calor, squash o mucha sudoracion.',
        'after': 'Si puedes pesarte: 1.5 L por cada kg perdido. Si no, 500-900 ml post entreno.',
        'why': 'La hidratacion se ajusta por peso, duracion e intensidad del entrenamiento. Deriva cardiaca alta puede indicar calor, fatiga o hidratacion insuficiente.',
    }


def _build_data_quality_score(fields: dict) -> dict:
    items = [
        ('FC reposo', fields.get('rhr_days', 0), 7, 15),
        ('HRV', fields.get('hrv_days', 0), 7, 15),
        ('Sueno', fields.get('sleep_days', 0), 7, 15),
        ('Actividades', fields.get('activities', 0), 3, 15),
        ('Carreras con FC', fields.get('hr_running_activities', 0), 3, 15),
        ('Training Load', fields.get('training_load_activities', 0), 2, 10),
        ('VO2max', fields.get('vo2_activity_points', 0), 2, 10),
        ('GPS', fields.get('gps_routes', 0), 1, 5),
    ]
    score = 0
    rows = []
    for name, count, req, pts in items:
        ok = count >= req
        partial = (count > 0 and not ok)
        earned = pts if ok else int(pts * 0.45) if partial else 0
        score += earned
        rows.append({'name': name, 'count': int(count), 'required': int(req), 'status': 'ok' if ok else 'partial' if partial else 'missing'})
    score = max(0, min(100, score))
    label = 'Alta' if score >= 80 else 'Media' if score >= 60 else 'Parcial' if score >= 40 else 'Baja'
    return {'score': score, 'label': label, 'rows': rows, 'note': 'GPS pesa poco porque el sistema puede analizar rendimiento sin rutas.'}


def _build_passport(profile: dict, raw: dict, gray: dict, z2q: dict) -> dict:
    pm = profile.get('performance_metrics', {}) or {}
    inj = pm.get('injury_risk', {}) or {}
    vo2 = float(profile.get('vo2max') or 0)
    hrv = float(profile.get('hrv_weekly') or 0)
    rhr = float(profile.get('fc_reposo') or 0)
    z2_score = z2q.get('latest_score') or 55
    gray_penalty = 15 if gray.get('gray_pct', 0) >= 30 else 0
    motor = int(max(30, min(100, vo2 * 1.5 + z2_score * 0.35 - gray_penalty))) if vo2 else int(z2_score)
    recovery = int(max(30, min(100, 50 + (hrv - 35) * 1.2 - max(0, rhr - 60) * 1.5))) if hrv else 55
    durability = int(max(30, min(100, z2_score - gray_penalty + 10)))
    risk_score = int(inj.get('score', 20) or 20)
    injury_guard = max(0, 100 - risk_score)
    overall = round((motor + recovery + durability + injury_guard) / 4)
    return {
        'overall': overall,
        'motor_aerobico': motor,
        'recuperacion': recovery,
        'durabilidad': durability,
        'proteccion_lesion': injury_guard,
        'estado': 'Construccion solida' if overall >= 75 else 'Construccion controlada' if overall >= 60 else 'Necesita base y recuperacion',
        'interpretation': 'Pasaporte fisiologico: resume motor aerobico, recuperacion, durabilidad y riesgo en una lectura accionable.'
    }


def _build_adaptation_score(profile: dict, raw: dict, gray: dict, z2q: dict) -> dict:
    pm = profile.get('performance_metrics', {}) or {}
    rhr_t = pm.get('rhr_trend', {}) or {}
    score = 60
    factors = []
    if (z2q.get('latest_score') or 0) >= 80:
        score += 12; factors.append('Z2 de buena calidad')
    elif z2q.get('latest_score'):
        factors.append('Z2 mejorable')
    if gray.get('gray_pct', 0) >= 30:
        score -= 12; factors.append('Demasiada zona gris')
    if rhr_t.get('direction') == 'mejorando':
        score += 8; factors.append('FC reposo mejorando')
    elif rhr_t.get('direction') == 'estable':
        score += 4; factors.append('FC reposo estable')
    pm_drift = pm.get('avg_cardiac_drift')
    if pm_drift is not None:
        if pm_drift < 5:
            score += 10; factors.append('Deriva cardiaca excelente')
        elif pm_drift > 8:
            score -= 10; factors.append('Deriva cardiaca alta')
    sleep = [_latest_valid(raw.get('health_daily', []) or [], 'sleep_total_h')]
    recent_sleep = [h.get('sleep_total_h') for h in (raw.get('health_daily', []) or [])[:7] if h.get('sleep_total_h')]
    avg_sleep = _mean_safe(recent_sleep, None)
    if avg_sleep:
        if avg_sleep >= 7:
            score += 8; factors.append('Sueno suficiente')
        elif avg_sleep < 6:
            score -= 10; factors.append('Sueno insuficiente')
    score = int(max(0, min(100, score)))
    label = 'Asimilando carga' if score >= 80 else 'Adaptacion moderada' if score >= 60 else 'Fatiga o meseta' if score >= 40 else 'Descarga recomendada'
    return {'score': score, 'label': label, 'factors': factors[:6]}


def _build_decision_map(workout: dict, hydration: dict, adaptation: dict, gray: dict) -> dict:
    sem = workout.get('semaphore', 'GREEN')
    wo_name = workout.get('name', 'Entrenamiento del dia')
    if sem == 'RED':
        mode = 'Recuperar'
    elif sem == 'YELLOW':
        mode = 'Construir base controlada'
    else:
        mode = 'Entrenar con control'
    priorities = [
        f'Ejecutar: {wo_name}',
        f'Hidratacion total: {hydration.get("total_l_range", "--")}',
        f'Adaptacion: {adaptation.get("label", "--")} ({adaptation.get("score", "--")}/100)',
    ]
    if gray.get('gray_pct', 0) >= 30:
        priorities.append('Reducir zona gris: hacer Z2 mas suave o intensidad mas clara.')
    avoid = []
    for f in workout.get('red_flags', [])[:2]:
        avoid.append(f)
    if workout.get('semaphore') != 'GREEN':
        avoid.append('Evitar Z4-Z5 salvo que el plan lo indique explicitamente.')
    return {'mode': mode, 'decision': wo_name, 'priorities': priorities[:5], 'avoid': avoid[:4], 'why': workout.get('semaphore_desc', '')}


def _build_weekly_coach_report(profile: dict, raw: dict, passport: dict, gray: dict, z2q: dict, adaptation: dict) -> dict:
    positives = []
    limiters = []
    if passport.get('recuperacion', 0) >= 70: positives.append('Recuperacion general suficiente para sostener progresion.')
    else: limiters.append('Recuperacion limitada: vigilar sueno, HRV y FC reposo.')
    if z2q.get('latest_score') and z2q.get('latest_score') >= 75: positives.append('La ultima Z2 tuvo calidad aceptable/alta.')
    elif z2q.get('latest_score'): limiters.append('La ultima Z2 no fue totalmente estable; controlar techo de FC.')
    else: limiters.append('Faltan sesiones Z2 validas para medir calidad aerobica.')
    if gray.get('gray_pct', 0) >= 30: limiters.append('Zona gris elevada: demasiada intensidad media.')
    else: positives.append('Distribucion de intensidad sin exceso claro de zona gris.')
    if adaptation.get('score', 0) >= 70: positives.append('El cuerpo parece estar asimilando la carga.')
    else: limiters.append('Adaptacion parcial: conviene progresar con cautela.')
    summary = f"Estado semanal: {passport.get('estado','--')}. Adaptacion {adaptation.get('score','--')}/100."
    next_week = []
    next_week.append('Mantener 2-3 sesiones Z2 controladas si el semaforo no esta rojo.')
    if gray.get('gray_pct', 0) >= 30:
        next_week.append('Convertir una sesion Z3 en Z2 baja estricta.')
    if passport.get('proteccion_lesion', 100) < 70:
        next_week.append('No subir volumen; priorizar fuerza, movilidad y descanso.')
    else:
        next_week.append('Subir volumen solo si sueno y HRV se mantienen estables.')
    return {'summary': summary, 'positives': positives[:5], 'limiters': limiters[:5], 'next_week': next_week[:5]}


def _build_data_gaps(fields: dict, statuses: dict) -> list[dict]:
    gaps = []
    for key, label in [
        ('gps_routes', 'GPS/rutas'), ('spo2_days', 'SpO2'), ('vo2_activity_points', 'VO2max por actividad'),
        ('training_load_activities', 'Training Load'), ('hrv_days', 'HRV'), ('sleep_days', 'Sueno'),
    ]:
        val = fields.get(key, 0)
        req = 1 if key in ('gps_routes', 'spo2_days') else 2
        if val < req:
            gaps.append({'metric': label, 'available': int(val), 'why_it_matters': 'Mejora analisis y graficas avanzadas.', 'action': 'No rompe la app; se oculta o explica hasta que Garmin lo entregue.'})
    return gaps[:8]




def _build_decision_history(raw: dict, profile: dict, workout: dict, days: int = 7) -> dict:
    """Historial explicable de decisiones diarias basado en datos Garmin disponibles.
    No inventa entrenamientos anteriores; resume la decision fisiologica que el sistema habria tomado
    segun sueño, HRV, FC reposo y actividades del dia.
    """
    health = raw.get('health_daily', []) or []
    acts = raw.get('activities', []) or []
    zones = profile.get('zones', calc_zones(int(profile.get('fc_max', 193) or 193), int(profile.get('fc_reposo', 54) or 54)))
    acts_by_day = defaultdict(list)
    for a in acts:
        d = str(a.get('date', ''))[:10]
        if d:
            acts_by_day[d].append(a)

    rows = []
    for h in health[:days]:
        d = str(h.get('date', ''))[:10]
        if not d:
            continue
        day_acts = acts_by_day.get(d, [])
        sleep_h = h.get('sleep_total_h')
        hrv = h.get('hrv_night') or h.get('hrv_week')
        rhr = h.get('rhr')
        stress = h.get('avg_stress')
        flags = []
        positives = []
        z4_count = 0
        z2_count = 0
        for a in day_acts:
            ev = _activity_zone_evidence(a, zones)
            if ev.get('reached_z4') or ev.get('reached_z5'):
                z4_count += 1
            avg = a.get('avg_hr') or 0
            if len(zones) > 1 and avg and zones[1]['bpm_low'] <= avg <= zones[1]['bpm_high']:
                z2_count += 1
        if sleep_h and sleep_h < 6.0:
            flags.append('sueño bajo')
        elif sleep_h and sleep_h >= 7.0:
            positives.append('sueño suficiente')
        if hrv and profile.get('hrv_weekly') and hrv < float(profile.get('hrv_weekly') or 0) * 0.85:
            flags.append('HRV baja vs semanal')
        if rhr and profile.get('fc_reposo_min') and rhr > float(profile.get('fc_reposo_min') or rhr) + 5:
            flags.append('FC reposo elevada')
        if stress and stress > 45:
            flags.append('estrés alto')
        if z4_count:
            positives.append(f'{z4_count} actividad(es) con evidencia Z4/Z5')
        if z2_count:
            positives.append(f'{z2_count} actividad(es) Z2')

        if len(flags) >= 2:
            decision = 'Recuperación / Z1-Z2 suave'
            color = 'yellow'
        elif z4_count:
            decision = 'Día ya cubrió intensidad real'
            color = 'green'
        elif z2_count:
            decision = 'Base aeróbica cumplida'
            color = 'green'
        elif day_acts:
            decision = 'Actividad registrada; validar zonas'
            color = 'yellow'
        else:
            decision = 'Oportunidad para Z2 o movilidad'
            color = 'blue'
        rows.append({
            'date': d,
            'decision': decision,
            'color': color,
            'flags': flags[:4],
            'positives': positives[:4],
            'activities': len(day_acts),
            'z4z5_activities': z4_count,
            'z2_activities': z2_count,
            'sleep_h': round(float(sleep_h), 1) if sleep_h else None,
            'hrv': hrv,
            'rhr': rhr,
        })
    return {
        'available': bool(rows),
        'rows': rows,
        'explanation': 'Audita las decisiones fisiológicas recientes usando sueño, HRV, FC reposo, estrés y evidencia real de zonas por actividad.',
        'today_decision': workout.get('name') or workout.get('type_key') or 'Entrenamiento adaptativo',
    }


def _build_plateau_detector(profile: dict, raw: dict) -> dict:
    """Detecta señales de meseta con los datos disponibles: VO2max, Z2 pace, FC reposo y carga."""
    pm = profile.get('performance_metrics', {}) or {}
    vo2 = pm.get('vo2_trend', []) or []
    z2 = pm.get('z2_efficiency', []) or []
    rhr_t = pm.get('rhr_trend', {}) or {}
    acts = raw.get('activities', []) or []

    signals = []
    blockers = []
    score = 0
    available_checks = 0

    if len(vo2) >= 3:
        available_checks += 1
        delta = float(vo2[-1].get('avg', 0) or 0) - float(vo2[0].get('avg', 0) or 0)
        if delta < 0.5:
            score += 1; signals.append(f'VO2max sin mejora clara ({delta:+.1f})')
        else:
            blockers.append(f'VO2max mejora ({delta:+.1f})')
    else:
        blockers.append('Faltan al menos 3 puntos mensuales de VO2max')

    if len(z2) >= 3:
        available_checks += 1
        first = float(z2[0].get('pace', 0) or 0)
        last = float(z2[-1].get('pace', 0) or 0)
        # En pace min/km, bajar es mejorar.
        if first and last and (first - last) < 0.10:
            score += 1; signals.append('Ritmo Z2 estable o sin mejora suficiente')
        else:
            blockers.append('Ritmo Z2 muestra mejora')
    else:
        blockers.append('Faltan 3 sesiones Z2 válidas para evaluar pace')

    if rhr_t.get('direction') in ('estable', 'sin datos'):
        available_checks += 1
        score += 1 if rhr_t.get('direction') == 'estable' else 0
        signals.append('FC reposo estable') if rhr_t.get('direction') == 'estable' else blockers.append('Faltan datos de tendencia FC reposo')
    elif rhr_t.get('direction') == 'mejorando':
        available_checks += 1; blockers.append('FC reposo mejora')
    elif rhr_t:
        available_checks += 1; signals.append('FC reposo sube o no acompaña')

    loads = [a.get('training_load') for a in acts if a.get('training_load')]
    if len(loads) >= 6:
        available_checks += 1
        recent = sum(loads[:3]) / 3
        older = sum(loads[-3:]) / 3
        if older and abs(recent - older) / older < 0.15:
            score += 1; signals.append('Carga reciente poco variable')
        else:
            blockers.append('Carga con variación suficiente')
    else:
        blockers.append('Faltan actividades con Training Load para evaluar progresión de carga')

    if available_checks < 2:
        status = 'No concluyente'
        level = 'unknown'
        action = 'Acumular más datos: VO2max, sesiones Z2 con FC y Training Load.'
    elif score >= 3:
        status = 'Posible meseta aeróbica'
        level = 'warning'
        action = 'Hacer semana de descarga relativa y reiniciar bloque: 2-3 Z2 controladas + 1 estímulo intenso solo si semáforo verde.'
    elif score == 2:
        status = 'Vigilar meseta'
        level = 'watch'
        action = 'Mantener Z2, reducir zona gris y revisar sueño/hidratación durante 7-10 días.'
    else:
        status = 'Sin meseta clara'
        level = 'good'
        action = 'Continuar progresión conservadora si HRV, sueño y FC reposo se mantienen estables.'
    return {
        'available': available_checks >= 2,
        'status': status,
        'level': level,
        'score': score,
        'checks_available': available_checks,
        'signals': signals[:6],
        'blockers': blockers[:6],
        'action': action,
        'explanation': 'Detector conservador: cruza VO2max, ritmo Z2, FC reposo y carga. No diagnostica; orienta ajustes del bloque.',
    }

def _build_advanced_performance(raw: dict, profile: dict, workout: dict, route_summaries: list[dict] | None = None) -> dict:
    fields = _build_fields_available(raw, profile, route_summaries)
    statuses = _build_chart_statuses(raw, profile, fields)
    z2q = _build_z2_quality(raw, profile)
    gray = _build_gray_zone_detector(raw, profile)
    hydration = _build_hydration_plan(profile, workout, raw)
    data_quality = _build_data_quality_score(fields)
    passport = _build_passport(profile, raw, gray, z2q)
    adaptation = _build_adaptation_score(profile, raw, gray, z2q)
    decision = _build_decision_map(workout, hydration, adaptation, gray)
    report = _build_weekly_coach_report(profile, raw, passport, gray, z2q, adaptation)
    age_analysis = _build_age_analysis(profile, raw)
    activity_zone_review = _build_activity_zone_review(raw, profile)
    decision_history = _build_decision_history(raw, profile, workout)
    plateau_detector = _build_plateau_detector(profile, raw)
    gaps = _build_data_gaps(fields, statuses)
    return {
        'generated_at': _now().isoformat(),
        'fields_available': fields,
        'chart_status': statuses,
        'data_quality': data_quality,
        'decision_map': decision,
        'passport': passport,
        'hydration': hydration,
        'z2_quality': z2q,
        'gray_zone': gray,
        'adaptation_score': adaptation,
        'weekly_coach_report': report,
        'age_analysis': age_analysis,
        'activity_zone_review': activity_zone_review,
        'decision_history': decision_history,
        'plateau_detector': plateau_detector,
        'data_gaps': gaps,
        'ui_recommendations': [
            'Mostrar siempre una explicacion cuando una grafica no tenga datos suficientes.',
            'Priorizar decisiones diarias sobre graficas aisladas.',
            'Mantener GPS como opcional: no debe bloquear analisis de rendimiento.',
            'Agregar historial de decisiones diarias para auditar si el motor adaptativo esta acertando.',
            'Agregar detector de meseta cuando VO2max, Z2 pace y FC reposo no mejoren durante varias semanas.',
            'Agregar control manual de sensaciones post-entreno para comparar plan vs respuesta real.',
            'Mostrar FatOx por sesion y acumulado semanal con advertencia de estimacion.',
            'Usar deficit dinamico segun TDEE diario y semaforo fisiologico.',
        ],
    }

def _extract_laps(detail: dict) -> list[dict]:
    """
    Extrae laps/splits de activityDetailMetrics o del campo 'laps' del detalle.
    Cada lap incluye: número, duración, distancia, FC prom/máx, pace, cadencia,
    elevación y Training Effect si está disponible.
    """
    if not isinstance(detail, dict):
        return []

    # Garmin puede entregar laps en diferentes keys
    laps_raw = (detail.get("activityLaps")
                or detail.get("laps")
                or detail.get("lapDTOs")
                or [])

    laps = []
    for i, lap in enumerate(laps_raw, 1):
        if not isinstance(lap, dict):
            continue
        dur_s  = lap.get("duration") or lap.get("elapsedDuration") or 0
        dist_m = lap.get("distance") or 0
        avg_hr = lap.get("averageHR") or lap.get("averageHeartRate")
        max_hr = lap.get("maxHR") or lap.get("maxHeartRate")
        speed  = lap.get("averageSpeed") or lap.get("avgSpeed")
        pace   = round(1000 / (speed * 60), 2) if speed and speed > 0 else None
        laps.append({
            "lap":         i,
            "dur_min":     round(dur_s / 60, 1) if dur_s else None,
            "dist_km":     round(dist_m / 1000, 3) if dist_m else None,
            "avg_hr":      avg_hr,
            "max_hr":      max_hr,
            "pace_min_km": pace,
            "cadence":     lap.get("averageRunningCadenceInStepsPerMinute") or lap.get("averageCadence"),
            "elevation":   lap.get("elevationGain"),
            "calories":    lap.get("calories"),
            "intensity":   lap.get("intensity"),
        })
    return laps


def _build_route_summaries(raw: dict) -> list[dict]:
    out = []
    for a in raw.get("activities", []):
        if a.get("type") not in ("running", "trail_running", "walking", "cycling"): continue
        pts = a.get("route_points") or []
        out.append({
            "id": a.get("id"), "name": a.get("name"), "type": a.get("type"), "date": a.get("date"),
            "dist_km": a.get("dist_km", 0), "dur_min": a.get("dur_min", 0), "avg_hr": a.get("avg_hr"),
            "max_hr": a.get("max_hr"), "route_available": bool(pts or a.get("start_point")),
            "route_point_count": len(pts), "start_point": a.get("start_point"), "end_point": a.get("end_point"),
        })
    return out[:40]


def _build_last_activity_hr(raw: dict, profile: dict) -> dict:
    """
    Extrae de la última actividad:
      - hr_series: lista de {sec, hr} para la gráfica de FC vs tiempo
      - zone_distribution: minutos y % en cada zona Karvonen (Z1-Z5)
      - summary: avg_hr, max_hr, dur_min, name, date, type
    Usa route_points si están disponibles (tienen hr+sec por punto).
    Referencia: Karvonen 1957 — zonas personalizadas por FCR.
    """
    acts = raw.get("activities") or []
    if not acts:
        return {"available": False}

    # Última actividad con datos de HR
    last = None
    for a in reversed(acts):
        if a.get("avg_hr") and a.get("dur_min", 0) > 5:
            last = a
            break
    if not last:
        return {"available": False}

    # ── Zonas Karvonen ────────────────────────────────────
    fc_max  = float(profile.get("fc_max") or 193)
    fc_rest = float(profile.get("fc_reposo_min") or 54)
    fcr     = fc_max - fc_rest

    def karvonen_bpm(pct):
        return round(fc_rest + fcr * pct)

    zones_def = [
        {"z": 1, "name": "Z1 Recuperación",    "lo": karvonen_bpm(0.50), "hi": karvonen_bpm(0.60), "color": "#6b7280"},
        {"z": 2, "name": "Z2 Base aeróbica",   "lo": karvonen_bpm(0.60), "hi": karvonen_bpm(0.70), "color": "#3b82f6"},
        {"z": 3, "name": "Z3 Umbral aeróbico", "lo": karvonen_bpm(0.70), "hi": karvonen_bpm(0.80), "color": "#22d3ee"},
        {"z": 4, "name": "Z4 Umbral anaeróbico","lo": karvonen_bpm(0.80), "hi": karvonen_bpm(0.90), "color": "#fbbf24"},
        {"z": 5, "name": "Z5 VO2max",           "lo": karvonen_bpm(0.90), "hi": karvonen_bpm(1.00), "color": "#f87171"},
    ]

    # ── Serie HR desde route_points ───────────────────────
    pts = last.get("route_points") or []
    hr_series = []
    zone_seconds = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0}  # 0 = por debajo de Z1

    prev_sec = None
    for p in pts:
        hr  = p.get("hr")
        sec = p.get("sec")
        if hr is None or sec is None:
            continue
        hr_series.append({"sec": int(sec), "hr": int(hr)})

        # Acumular segundos en zona
        if prev_sec is not None:
            dt = max(0, int(sec) - prev_sec)
            zone_num = 0
            for zd in zones_def:
                if hr >= zd["lo"]:
                    zone_num = zd["z"]
            zone_seconds[zone_num] += dt
        prev_sec = int(sec)

    # Si no hay route_points con HR, estimar distribución solo con avg/max
    if not hr_series and last.get("avg_hr"):
        avg = float(last["avg_hr"])
        dur_sec = float(last.get("dur_min", 0)) * 60
        zone_num = 0
        for zd in zones_def:
            if avg >= zd["lo"]:
                zone_num = zd["z"]
        zone_seconds[zone_num] = int(dur_sec)

    total_sec = sum(zone_seconds.values()) or 1

    zone_distribution = []
    for zd in zones_def:
        secs = zone_seconds[zd["z"]]
        zone_distribution.append({
            "zone":    zd["z"],
            "name":    zd["name"],
            "color":   zd["color"],
            "bpm_lo":  zd["lo"],
            "bpm_hi":  zd["hi"],
            "seconds": secs,
            "minutes": round(secs / 60, 1),
            "pct":     round(secs / total_sec * 100, 1),
        })

    # Submuestrear serie a máx 300 puntos para no inflar el JSON
    step = max(1, len(hr_series) // 300)
    hr_series_out = hr_series[::step] if hr_series else []

    return {
        "available":        True,
        "activity_id":      last.get("id"),
        "name":             last.get("name") or last.get("type") or "Actividad",
        "type":             last.get("type"),
        "date":             str(last.get("date") or "")[:10],
        "dur_min":          last.get("dur_min"),
        "dist_km":          last.get("dist_km"),
        "avg_hr":           last.get("avg_hr"),
        "max_hr":           last.get("max_hr"),
        "hr_series":        hr_series_out,
        "hr_series_points": len(hr_series_out),
        "zone_distribution": zone_distribution,
        "zones_def":        [{k: v for k, v in z.items() if k != "color"} for z in zones_def],
        "note":             "Serie HR de route_points (Garmin API). Zonas Karvonen personalizadas.",
    }



    out = []
    for a in raw.get("activities", []):
        if a.get("type") not in ("running", "trail_running", "walking", "cycling"): continue
        pts = a.get("route_points") or []
        out.append({
            "id": a.get("id"), "name": a.get("name"), "type": a.get("type"), "date": a.get("date"),
            "dist_km": a.get("dist_km", 0), "dur_min": a.get("dur_min", 0), "avg_hr": a.get("avg_hr"),
            "max_hr": a.get("max_hr"), "route_available": bool(pts or a.get("start_point")),
            "route_point_count": len(pts), "start_point": a.get("start_point"), "end_point": a.get("end_point"),
        })
    return out[:40]



# =======================================================
# FAT OXIDATION / FATMAX / ENERGIA DINAMICA
# =======================================================
def _clamp_num(x, lo, hi, default=None):
    try:
        if x is None:
            return default if default is not None else lo
        v = float(x)
        if v != v:
            return default if default is not None else lo
        return max(lo, min(hi, v))
    except Exception:
        return default if default is not None else lo


def _date10_from_any(value: object) -> str:
    try:
        s = str(value or "")[:10]
        datetime.fromisoformat(s)
        return s
    except Exception:
        return ""


def _profile_age_years(profile: dict) -> int:
    try:
        fa = profile.get("fitness_age", {}) or {}
        age = fa.get("chronological_age") or profile.get("chronological_age")
        if age:
            return int(round(float(age)))
        bd = profile.get("birth_date")
        if bd:
            b = datetime.fromisoformat(str(bd)[:10]).date()
            today = _today()
            return max(16, today.year - b.year - ((today.month, today.day) < (b.month, b.day)))
    except Exception:
        pass
    return 36


def _estimate_bmr_kcal(profile: dict, health_daily: list[dict] | None = None) -> int:
    """BMR robusto: usa Garmin si existe; si no, Mifflin-St Jeor."""
    try:
        for d in (health_daily or []):
            v = d.get("cal_bmr")
            if v:
                return int(round(float(v)))
    except Exception:
        pass
    w = float(profile.get("weight_kg") or 85)
    h_cm = float(profile.get("height_m") or 1.70) * 100
    age = _profile_age_years(profile)
    sex = str(profile.get("sex") or "male").lower()
    s = 5 if sex.startswith("m") else -161
    return int(round(10*w + 6.25*h_cm - 5*age + s))


def _fatmax_profile(profile: dict) -> dict:
    """
    Rango estimado de FatMax por FC reserva.
    Se usa 50-60% FCR para alinear el perfil actual de Manuel (~124-138 bpm)
    y evitar recomendar Z2 alta cuando el objetivo es oxidacion de grasa por minuto.
    """
    fc_max = int(profile.get("fc_max") or 193)
    fc_rep = int(profile.get("fc_reposo") or 54)
    fcr = max(1, fc_max - fc_rep)
    low_pct, high_pct = 0.50, 0.60
    bpm_low = round(fc_rep + fcr * low_pct)
    bpm_high = round(fc_rep + fcr * high_pct)
    mid = round((bpm_low + bpm_high) / 2)
    return {
        "bpm_low": bpm_low,
        "bpm_high": bpm_high,
        "bpm_mid": mid,
        "hr_reserve_low_pct": int(low_pct * 100),
        "hr_reserve_high_pct": int(high_pct * 100),
        "label": f"{bpm_low}-{bpm_high} bpm",
        "zone_hint": "FatMax estimado / Z2 baja fisiologica",
        "vt1_upper_bpm": round(fc_rep + fcr * 0.65),
        "vt1_reference_range": f"{bpm_low}-{round(fc_rep + fcr * 0.65)} bpm",
        "vt1_note": "VT1 estimado como limite superior funcional de Z2 baja-media; usar como referencia complementaria a FatMax.",
        "method": "Karvonen 50-60% FC reserva; VT1 estimado ~65% FCR como techo funcional. Validar con prueba metabolica si se busca precision clinica.",
    }


def _hr_reserve_pct(avg_hr: float | None, profile: dict) -> float | None:
    try:
        if not avg_hr:
            return None
        fc_max = float(profile.get("fc_max") or 193)
        fc_rep = float(profile.get("fc_reposo") or 54)
        return _clamp_num((float(avg_hr) - fc_rep) / max(1, fc_max - fc_rep), 0.0, 1.2, 0.0)
    except Exception:
        return None


def _cho_fraction_from_hr(avg_hr: float | None, profile: dict) -> float:
    """
    Estimacion conservadora del % de energia desde carbohidrato por FC reserva.
    No reemplaza VO2/VCO2; sirve para dashboard cuando solo hay kcal, FC y duracion.
    """
    pct = _hr_reserve_pct(avg_hr, profile)
    if pct is None:
        return 0.50
    # Puntos suaves: a baja intensidad predomina grasa; al subir la FC domina CHO.
    anchors = [(0.40, 0.30), (0.50, 0.38), (0.60, 0.48), (0.70, 0.62), (0.80, 0.76), (0.90, 0.88), (1.00, 0.94)]
    if pct <= anchors[0][0]:
        return anchors[0][1]
    for (x0, y0), (x1, y1) in zip(anchors, anchors[1:]):
        if pct <= x1:
            t = (pct - x0) / max(0.0001, x1 - x0)
            return round(y0 + t * (y1 - y0), 3)
    return anchors[-1][1]


def _estimate_activity_fatox(activity: dict, profile: dict, fatmax: dict | None = None) -> dict | None:
    dur = _clamp_num(activity.get("dur_min"), 0, 10000, 0)
    kcal = _clamp_num(activity.get("cal") or activity.get("calories") or activity.get("cal_active"), 0, 100000, 0)
    avg_hr = activity.get("avg_hr")
    if dur <= 0 or kcal <= 0:
        return None
    kcal_min = kcal / dur
    cho_frac = _cho_fraction_from_hr(avg_hr, profile)
    fat_frac = _clamp_num(1 - cho_frac, 0, 1, 0)
    # Gramos reales estimados desde energia: kcal de grasa / 9 kcal por gramo.
    fat_g_min = kcal_min * fat_frac / 9.0
    fat_g_total = fat_g_min * dur
    # Formula aproximada solicitada por auditoria; se conserva como referencia tecnica.
    requested_formula_g_min = 0.59 * kcal_min * fat_frac
    hrp = _hr_reserve_pct(avg_hr, profile)
    fm = fatmax or _fatmax_profile(profile)
    in_fatmax = bool(avg_hr and fm.get("bpm_low") <= float(avg_hr) <= fm.get("bpm_high"))
    label = "FatMax" if in_fatmax else "Mixta" if (hrp is not None and hrp < 0.75) else "Carbo dominante"
    # Nivel de confianza profesional: con datos Garmin resumidos no se mide VO2/VCO2 real,
    # por eso clasificamos la estimacion segun continuidad probable de la sesion.
    a_type = str(activity.get("type") or activity.get("name") or "").lower()
    moving = _clamp_num(activity.get("moving_min") or activity.get("dur_min"), 0, 10000, dur)
    elapsed = _clamp_num(activity.get("elapsed_min") or activity.get("dur_min"), 0, 10000, dur)
    moving_ratio = moving / max(1, elapsed)
    interval_like = any(x in a_type for x in ("squash", "interval", "hiit", "anaer", "tennis", "basket"))
    endurance_like = any(x in a_type for x in ("running", "walking", "cycling", "bike", "cardio", "elliptical"))
    if avg_hr and kcal and dur >= 25 and moving_ratio >= 0.85 and endurance_like and not interval_like:
        confidence = "alta"
        confidence_score = 82
        confidence_reason = "Sesion continua, duracion suficiente, FC promedio y kcal disponibles."
    elif avg_hr and kcal and dur >= 12 and not interval_like:
        confidence = "media"
        confidence_score = 62
        confidence_reason = "Datos suficientes, pero puede haber cambios de intensidad o pausas."
    elif avg_hr and kcal:
        confidence = "media" if dur >= 20 else "baja"
        confidence_score = 45 if interval_like else 52
        confidence_reason = "Actividad variable; usar FatOx como tendencia, no como valor exacto."
    else:
        confidence = "baja"
        confidence_score = 28
        confidence_reason = "Faltan FC promedio o calorias; estimacion limitada."
    return {
        "fat_grams": round(fat_g_total, 1),
        "fatox_g_min": round(fat_g_min, 3),
        "kcal_min": round(kcal_min, 2),
        "fat_pct": round(fat_frac * 100, 1),
        "cho_pct": round(cho_frac * 100, 1),
        "hr_reserve_pct": round((hrp or 0) * 100, 1) if hrp is not None else None,
        "avg_hr": avg_hr,
        "fatmax_match": in_fatmax,
        "substrate_label": label,
        "confidence": confidence,
        "confidence_score": confidence_score,
        "confidence_reason": confidence_reason,
        "formula_reference_g_min": round(requested_formula_g_min, 3),
        "formula_reference_note": "La formula 0.59*kcal_min*fat_frac se conserva como referencia comparativa solicitada; el calculo principal de gramos usa kcal_grasa/9 para mantener consistencia energetica.",
        "method": "Estimado con kcal, duracion y FC promedio. Para gramos se usa kcal_grasa/9; formula VO2/VCO2 requiere gases respiratorios.",
    }




def _classify_squash_session_v47(activity: dict, profile: dict) -> dict | None:
    """Clasifica sesiones de squash por demanda fisiologica usando FC promedio y zonas personales."""
    label = (str(activity.get("type") or "") + " " + str(activity.get("name") or "")).lower()
    if "squash" not in label:
        return None
    avg_hr = activity.get("avg_hr")
    if not avg_hr:
        return {"class": "sin_fc", "label": "Squash sin FC promedio", "note": "No se puede clasificar intensidad sin FC promedio."}
    zones = calc_zones(int(profile.get("fc_max", 193)), int(profile.get("fc_reposo", 54)))
    z3_low = zones[2]["bpm_low"] if len(zones) >= 3 else 151
    z4_low = zones[3]["bpm_low"] if len(zones) >= 4 else 165
    if float(avg_hr) < z3_low:
        return {"class": "tecnica", "label": "Squash tecnico", "note": "Predomina tecnica/base; menor carga glucolitica."}
    if float(avg_hr) < z4_low:
        return {"class": "tactica", "label": "Squash tactico", "note": "Carga mixta; suma trabajo de zona gris/tempo."}
    return {"class": "competitiva", "label": "Squash competitivo", "note": "Alta demanda glucolitica; vigilar recuperacion y HRV."}

def _build_fat_by_zone(profile: dict) -> list[dict]:
    """Modelo profesional para mostrar oxidación estimada de grasa por zona FC.

    Es un modelo comparativo, no una medición clínica. Usa FC reserva, el mismo
    modelo de sustrato del FatOx y un ejemplo estándar de 8 kcal/min x 30 min
    para que la app pueda comparar zonas aunque no haya actividad en cada zona.
    """
    zones = calc_zones(int(profile.get("fc_max", 193)), int(profile.get("fc_reposo", 54)))
    fatmax = _fatmax_profile(profile)
    fc_rep = float(profile.get("fc_reposo", 54) or 54)
    fc_max = float(profile.get("fc_max", 193) or 193)
    reserve = max(1.0, fc_max - fc_rep)
    rows: list[dict] = []
    for z in zones:
        bpm_low = int(z.get("bpm_low") or 0)
        bpm_high = int(z.get("bpm_high") or 0)
        bpm_mid = round((bpm_low + bpm_high) / 2)
        hr_reserve_pct = max(0.0, min(1.1, (bpm_mid - fc_rep) / reserve))
        # Reusar el modelo de sustrato por FC reserva.
        dummy_hr = fc_rep + reserve * hr_reserve_pct
        cho_frac = _cho_fraction_from_hr(dummy_hr, profile)
        fat_frac = _clamp_num(1 - cho_frac, 0, 1, 0)
        overlap = max(0, min(bpm_high, int(fatmax.get("bpm_high") or 0)) - max(bpm_low, int(fatmax.get("bpm_low") or 0)))
        is_fatmax = overlap > 0
        # Ejemplo comparativo: 8 kcal/min * 30 min. La sesión real usa kcal reales.
        estimated_fat_g_30min = round((8.0 * 30.0 * fat_frac) / 9.0, 1)
        rows.append({
            "zone": z.get("zone"),
            "name": z.get("name"),
            "bpm_low": bpm_low,
            "bpm_high": bpm_high,
            "bpm_mid": bpm_mid,
            "color": z.get("color"),
            "hr_reserve_pct": round(hr_reserve_pct * 100, 1),
            "fat_pct": round(fat_frac * 100, 1),
            "cho_pct": round(cho_frac * 100, 1),
            "estimated_fat_g_30min": estimated_fat_g_30min,
            "fatmax_overlap_bpm": overlap,
            "is_fatmax": is_fatmax,
            "quality_score": 100 if is_fatmax else round(max(10, fat_frac * 100)),
            "interpretation": "Zona objetivo FatMax personal" if is_fatmax else "Menor oxidación relativa que FatMax",
            "note": "Comparativo estandarizado a 8 kcal/min x 30 min; la sesión real se calcula con kcal, FC y duración reales.",
        })
    return rows

def _build_fat_oxidation(raw: dict, profile: dict) -> dict:
    """Agrega FatOx por actividad, acumulados semanales y serie acumulada para la app."""
    acts = raw.get("activities", []) or []
    fatmax = _fatmax_profile(profile)
    enriched = []
    today = _today()
    week_start = today - timedelta(days=6)
    week_total_g = 0.0
    week_fatmax_min = 0.0
    week_sessions = 0
    daily = defaultdict(float)

    for a in acts:
        est = _estimate_activity_fatox(a, profile, fatmax)
        if not est:
            continue
        # Campos planos para que la app pueda mostrarlos sin rutas complejas.
        a["fatox_g_min"] = est["fatox_g_min"]
        a["fat_grams"] = est["fat_grams"]
        a["fat_pct"] = est["fat_pct"]
        a["cho_pct"] = est["cho_pct"]
        a["fatmax_match"] = est["fatmax_match"]
        a["substrate_label"] = est["substrate_label"]
        a["fatox"] = est
        squash_class = _classify_squash_session_v47(a, profile)
        if squash_class:
            a["squash_intensity"] = squash_class
        d10 = _date10_from_any(a.get("date"))
        if d10:
            daily[d10] += est["fat_grams"]
        try:
            dd = datetime.fromisoformat(d10).date() if d10 else None
        except Exception:
            dd = None
        if dd and week_start <= dd <= today:
            week_total_g += est["fat_grams"]
            week_sessions += 1
            if est["fatmax_match"]:
                week_fatmax_min += float(a.get("dur_min") or 0)
        enriched.append({
            "id": a.get("id"),
            "date": d10,
            "name": a.get("name") or a.get("type") or "Actividad",
            "type": a.get("type"),
            "dur_min": a.get("dur_min"),
            "cal": a.get("cal"),
            "avg_hr": a.get("avg_hr"),
            "squash_intensity": a.get("squash_intensity"),
            **est,
        })

    series = []
    cumulative = 0.0
    for d in sorted(daily):
        cumulative += daily[d]
        series.append({"date": d, "fat_g": round(daily[d], 1), "cumulative_fat_g": round(cumulative, 1)})

    latest = None
    if enriched:
        latest = sorted(enriched, key=lambda x: x.get("date") or "", reverse=True)[0]

    today_str = today.isoformat()
    month_str = today.strftime("%Y-%m")
    today_fat_g = round(daily.get(today_str, 0.0), 1)
    month_total_g = round(sum(v for k, v in daily.items() if str(k).startswith(month_str)), 1)
    best_session = max(enriched, key=lambda x: float(x.get("fat_grams") or 0), default=None)
    target_fatmax_min = 120
    missing_fatmax_min = max(0, target_fatmax_min - round(week_fatmax_min, 1))
    sessions_needed_35 = int((missing_fatmax_min + 34) // 35) if missing_fatmax_min else 0
    if missing_fatmax_min > 0:
        weekly_recommendation = f"Esta semana necesitas {sessions_needed_35} sesiones Z2/FatMax de 35 min para completar el estimulo ideal de oxidacion."
    else:
        weekly_recommendation = "Objetivo FatMax semanal cumplido. Mantener 1 sesion suave adicional si el semaforo esta verde."

    conf_counter = Counter(x.get("confidence", "baja") for x in enriched)
    avg_conf = round(sum(float(x.get("confidence_score") or 0) for x in enriched) / max(1, len(enriched))) if enriched else 0

    return {
        "generated_at": _now().isoformat(),
        "fatmax": fatmax,
        "fat_by_zone": _build_fat_by_zone(profile),
        "latest_session": latest,
        "best_session": best_session,
        "today": {
            "date": today_str,
            "fat_g": today_fat_g,
        },
        "weekly": {
            "period_days": 7,
            "total_fat_g": round(week_total_g, 1),
            "sessions_count": week_sessions,
            "fatmax_minutes": round(week_fatmax_min, 1),
            "avg_fat_g_session": round(week_total_g / week_sessions, 1) if week_sessions else 0,
            "target_fatmax_minutes": target_fatmax_min,
            "missing_fatmax_minutes": missing_fatmax_min,
            "sessions_needed_35min": sessions_needed_35,
            "recommendation": weekly_recommendation,
        },
        "monthly": {
            "month": month_str,
            "total_fat_g": month_total_g,
        },
        "daily_series": series[-90:],
        "activities": enriched[:120],
        "confidence_summary": {
            "score": avg_conf,
            "high": conf_counter.get("alta", 0),
            "medium": conf_counter.get("media", 0),
            "low": conf_counter.get("baja", 0),
            "label": "alta" if avg_conf >= 75 else "media" if avg_conf >= 50 else "baja",
            "explanation": "FatOx se estima con FC, kcal y duracion; la medicion exacta requiere VO2/VCO2.",
        },
        "disclaimer": "Estimacion de tendencia, no medicion clinica. Precision alta requiere VO2 y VCO2.",
    }


def _dynamic_energy_plan(raw: dict, profile: dict, workout: dict | None = None) -> dict:
    h = raw.get("health_daily", []) or []
    bmr = _estimate_bmr_kcal(profile, h)
    today_row = h[0] if h else {}
    active = int(round(float(today_row.get("cal_active") or 0)))
    if active <= 0:
        vals = [float(d.get("cal_active") or 0) for d in h[:7] if d.get("cal_active")]
        active = int(round(sum(vals) / len(vals))) if vals else 0
    tdee = bmr + active
    sem = str((workout or {}).get("semaphore") or (workout or {}).get("semaphore_label") or "").lower()
    readiness = float(profile.get("training_readiness") or 0)
    base_deficit = int(_clamp_num(round(tdee * 0.18), 280, 560, 350))
    if "red" in sem or "rojo" in sem or readiness < 45:
        deficit = int(_clamp_num(round(base_deficit * 0.55), 200, 320, 250))
        mode = "recuperacion"
    elif "yellow" in sem or "amarillo" in sem or readiness < 65:
        deficit = int(_clamp_num(round(base_deficit * 0.75), 240, 420, 330))
        mode = "controlado"
    else:
        deficit = base_deficit
        mode = "progresivo"
    if active >= 650 and mode == "progresivo":
        deficit = min(600, deficit + 50)
    if active < 150:
        deficit = min(deficit, 300)
    deficit = int(_clamp_num(deficit, 200, 600, 350))
    target = max(1200, tdee - deficit)
    w = float(profile.get("weight_kg") or 85)
    return {
        "bmr_kcal": bmr,
        "active_kcal_reference": active,
        "tdee_today": int(tdee),
        "recommended_deficit_kcal": deficit,
        "target_calories": int(target),
        "mode": mode,
        "protein_g": round(w * 1.8),
        "carbs_g": round(target * 0.40 / 4),
        "fat_g": round(target * 0.30 / 9),
        "rule": "TDEE = BMR + calorias activas Garmin; deficit se reduce con semaforo rojo/amarillo o baja actividad.",
    }



def _build_training_load_curve_v46(raw: dict, profile: dict) -> dict:
    """Serie estable para curva de carga: carga diaria, rolling 7d e intervalo ideal.

    La app usa esto para mostrar la curva real sobre una banda ideal. Si Garmin no
    entrega todos los objetivos de Training Load Balance, se estima una banda prudente
    desde la carga reciente para que la visualizacion siga siendo util.
    """
    acts = raw.get("activities", []) or []
    rows = []
    for a in acts:
        d10 = _date10_from_any(a.get("date"))
        load = a.get("training_load")
        if d10 and load is not None:
            try:
                rows.append({
                    "date": d10,
                    "value": round(float(load), 1),
                    "name": a.get("name") or a.get("type") or "Actividad",
                    "type": a.get("type"),
                })
            except Exception:
                pass
    rows = sorted(rows, key=lambda x: x.get("date") or "")[-180:]
    if not rows:
        return {
            "daily": [], "rolling_7d": [], "ideal_low": [], "ideal_high": [],
            "latest_7d_load": 0, "state": "sin_datos", "insight": "No hay actividades con Training Load.",
            "method": "Sin datos suficientes",
        }

    daily_map = defaultdict(float)
    for r in rows:
        daily_map[r["date"]] += float(r.get("value") or 0)

    last = datetime.fromisoformat(rows[-1]["date"]).date()
    first = last - timedelta(days=41)
    dates = [(first + timedelta(days=i)) for i in range((last - first).days + 1)]
    daily = []
    rolling = []
    for dd in dates:
        iso = dd.isoformat()
        val = round(daily_map.get(iso, 0.0), 1)
        daily.append({"date": iso, "value": val})
        rsum = 0.0
        for j in range(7):
            rsum += daily_map.get((dd - timedelta(days=j)).isoformat(), 0.0)
        rolling.append({"date": iso, "value": round(rsum, 1)})

    tlb = raw.get("training_load_balance") or {}
    status = raw.get("training_status") or {}
    monthly_low = float(tlb.get("aer_low_min") or 0) + float(tlb.get("aer_high_min") or 0)
    monthly_high = float(tlb.get("aer_low_max") or 0) + float(tlb.get("aer_high_max") or 0)
    recent_roll = [x["value"] for x in rolling if x.get("value")]
    avg_roll = sum(recent_roll) / len(recent_roll) if recent_roll else 250.0
    if monthly_low > 0:
        low = round(monthly_low / 4.3, 1)
        method = "Objetivos Garmin Training Load Balance convertidos a ventana semanal."
    else:
        low = round(avg_roll * 0.80, 1)
        method = "Banda ideal estimada desde carga rolling 7d reciente."
    if monthly_high > 0:
        high = round(monthly_high / 4.3, 1)
    else:
        high = round(max(low + 80, avg_roll * 1.20), 1)
    if high <= low:
        high = round(low + 100, 1)

    latest = rolling[-1]["value"] if rolling else 0
    if latest < low:
        state = "baja"
        insight = "Carga por debajo de la curva ideal: puedes sumar base Z2 si readiness y HRV acompanian."
    elif latest > high:
        state = "alta"
        insight = "Carga por encima de la curva ideal: riesgo de fatiga; prioriza recuperacion o sesion suave."
    else:
        state = "ideal"
        insight = "Carga dentro de la curva ideal: mantener progresion sin aumentos bruscos."

    ideal_low = [{"date": x["date"], "value": low} for x in rolling]
    ideal_high = [{"date": x["date"], "value": high} for x in rolling]
    week_vals = [float(x.get("value") or 0) for x in daily[-7:]]
    nonzero_week_vals = [x for x in week_vals if x > 0]
    if len(nonzero_week_vals) >= 2:
        mean_week = sum(nonzero_week_vals) / len(nonzero_week_vals)
        sd_week = (sum((x-mean_week)**2 for x in nonzero_week_vals) / max(1, len(nonzero_week_vals)-1)) ** 0.5
        monotony = round(mean_week / sd_week, 2) if sd_week > 0 else 9.99
        strain = round(sum(nonzero_week_vals) * monotony, 1)
    else:
        monotony = None
        strain = None
    monotony_state = "alta" if monotony and monotony > 2 else "normal" if monotony else "sin_datos"

    return {
        "daily": daily,
        "rolling_7d": rolling,
        "ideal_low": ideal_low,
        "ideal_high": ideal_high,
        "latest_7d_load": round(latest, 1),
        "ideal_low_value": low,
        "ideal_high_value": high,
        "state": state,
        "insight": insight,
        "acwr": status.get("acwr"),
        "acute_load": status.get("acute_load"),
        "chronic_load": status.get("chronic_load"),
        "source_points": len(rows),
        "training_monotony": monotony,
        "training_strain": strain,
        "monotony_state": monotony_state,
        "monotony_insight": "Monotonia >2 sugiere poca variacion de carga y mayor riesgo de fatiga." if monotony and monotony > 2 else "Variacion de carga aceptable." if monotony else "Sin datos suficientes para monotonia.",
        "method": method,
    }

def _build_chart_series_v44(raw: dict, profile: dict, fat_oxidation: dict, vo2_timeline: list) -> dict:
    """Contrato de graficas estable para que la app no tenga que adivinar rutas."""
    health = raw.get("health_daily", []) or []
    sleep = raw.get("sleep_data", []) or []
    acts = raw.get("activities", []) or []
    return {
        "health_daily": health[-120:],
        "sleep_data": sleep[-120:],
        "activities": acts[:180],
        "vo2max_timeline": vo2_timeline,
        "fat_daily": fat_oxidation.get("daily_series", []),
        "fat_activities": fat_oxidation.get("activities", []),
        "fat_by_zone": fat_oxidation.get("fat_by_zone", []),
        "rhr": [{"date": d.get("date"), "value": d.get("rhr")} for d in health if d.get("rhr")][-90:],
        "hrv": [{"date": d.get("date"), "value": d.get("hrv_night") or d.get("hrv_week")} for d in health if d.get("hrv_night") or d.get("hrv_week")][-90:],
        "sleep_hours": [{"date": d.get("date"), "value": d.get("sleep_total_h") or d.get("total_h")} for d in (sleep or health) if d.get("sleep_total_h") or d.get("total_h")][-90:],
        "active_calories": [{"date": d.get("date"), "value": d.get("cal_active")} for d in health if d.get("cal_active") is not None][-90:],
        "training_load": [{"date": a.get("date"), "value": a.get("training_load"), "name": a.get("name"), "type": a.get("type")} for a in acts if a.get("training_load") is not None][:120],
        "training_load_curve": _build_training_load_curve_v46(raw, profile),
    }


def _build_weekly_comparison_v44(raw: dict, fat_oxidation: dict, profile: dict) -> dict:
    today = _today()
    start_this = today - timedelta(days=6)
    start_prev = today - timedelta(days=13)
    end_prev = today - timedelta(days=7)
    acts = fat_oxidation.get("activities", []) or []
    health = raw.get("health_daily", []) or []

    def in_range(d, a, b):
        try:
            dd = datetime.fromisoformat(str(d)[:10]).date()
            return a <= dd <= b
        except Exception:
            return False

    def pct_change(now, prev):
        if prev in (0, None):
            return None if not now else 100
        return round((now - prev) / prev * 100, 1)

    this_acts = [a for a in acts if in_range(a.get("date"), start_this, today)]
    prev_acts = [a for a in acts if in_range(a.get("date"), start_prev, end_prev)]
    this_h = [d for d in health if in_range(d.get("date"), start_this, today)]
    prev_h = [d for d in health if in_range(d.get("date"), start_prev, end_prev)]

    def sum_field(rows, field): return round(sum(float(x.get(field) or 0) for x in rows), 1)
    def avg_field(rows, field):
        vals = [float(x.get(field)) for x in rows if x.get(field) is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    current = {
        "fat_g": sum_field(this_acts, "fat_grams"),
        "fatmax_minutes": round(sum(float(a.get("dur_min") or 0) for a in this_acts if a.get("fatmax_match")), 1),
        "sessions": len(this_acts),
        "sleep_h_avg": avg_field(this_h, "sleep_total_h"),
        "hrv_avg": avg_field(this_h, "hrv_night") or avg_field(this_h, "hrv_week"),
        "rhr_avg": avg_field(this_h, "rhr"),
        "active_kcal": sum_field(this_h, "cal_active"),
        "readiness": (raw.get("training_readiness") or {}).get("score"),
    }
    previous = {
        "fat_g": sum_field(prev_acts, "fat_grams"),
        "fatmax_minutes": round(sum(float(a.get("dur_min") or 0) for a in prev_acts if a.get("fatmax_match")), 1),
        "sessions": len(prev_acts),
        "sleep_h_avg": avg_field(prev_h, "sleep_total_h"),
        "hrv_avg": avg_field(prev_h, "hrv_night") or avg_field(prev_h, "hrv_week"),
        "rhr_avg": avg_field(prev_h, "rhr"),
        "active_kcal": sum_field(prev_h, "cal_active"),
        "readiness": None,
    }
    delta = {k: pct_change(current.get(k) or 0, previous.get(k) or 0) for k in current.keys()}
    return {"current": current, "previous": previous, "delta_pct": delta, "period": "semana actual vs semana anterior"}



def _build_fat_energy_balance_v47(fat_oxidation: dict, dynamic_energy: dict, profile: dict | None = None) -> dict:
    """Cruza FatOx con deficit dinamico para mostrar KPI de composicion corporal."""
    deficit = float(dynamic_energy.get("recommended_deficit_kcal") or 0)
    today_fatox = float((fat_oxidation.get("today") or {}).get("fat_g") or 0)
    weekly_fatox = float((fat_oxidation.get("weekly") or {}).get("total_fat_g") or 0)
    deficit_body_fat_g = round(deficit / 9.0, 1) if deficit else 0
    weekly_deficit_body_fat_g = round(deficit_body_fat_g * 7, 1) if deficit else 0
    combined_g_week = round(weekly_deficit_body_fat_g + weekly_fatox, 1)

    # ── Proyección de peso corporal ──────────────────────────────────────────
    # Fórmula: (peso_actual - meta_kg) × 1000 g / presión_grasa_semanal
    # Referencia: Hall et al. 2012 Lancet (modelo de balance energético)
    weight_projection: dict = {}
    if profile is not None and combined_g_week > 0:
        try:
            current_kg  = float(profile.get("weight_kg") or 0)
            target_kg   = float(profile.get("target_weight_kg") or 0)
            if current_kg > target_kg > 0:
                gramos_a_perder = (current_kg - target_kg) * 1000.0
                semanas = gramos_a_perder / combined_g_week
                semanas_r = round(semanas, 1)
                fecha_est = (_today() + __import__("datetime").timedelta(weeks=semanas_r)).isoformat()
                weight_projection = {
                    "current_kg":        current_kg,
                    "target_kg":         target_kg,
                    "grams_to_lose":     round(gramos_a_perder),
                    "weekly_fat_pressure_g": combined_g_week,
                    "weeks_to_goal":     semanas_r,
                    "estimated_date":    fecha_est,
                    "note":              (
                        f"A ritmo actual ({combined_g_week} g/sem de presión sobre grasa), "
                        f"llegas a {target_kg} kg en ~{semanas_r} semanas "
                        f"(aprox. {fecha_est[:10]}). "
                        "Estimación lineal; varía con adherencia y nivel de actividad."
                    ),
                }
            elif current_kg > 0 and target_kg > 0 and current_kg <= target_kg:
                weight_projection = {
                    "current_kg": current_kg, "target_kg": target_kg,
                    "weeks_to_goal": 0, "note": "Ya estás en o por debajo de tu peso meta.",
                }
        except Exception:
            pass

    result = {
        "daily_deficit_kcal": round(deficit),
        "deficit_body_fat_equivalent_g_today": deficit_body_fat_g,
        "exercise_fat_oxidized_g_today": round(today_fatox, 1),
        "combined_fat_pressure_g_today": round(deficit_body_fat_g + today_fatox, 1),
        "exercise_fat_oxidized_g_week": round(weekly_fatox, 1),
        "deficit_body_fat_equivalent_g_week": weekly_deficit_body_fat_g,
        "combined_fat_pressure_g_week": combined_g_week,
        "interpretation": "FatOx muestra sustrato usado en ejercicio; el deficit kcal estima perdida neta potencial. No son equivalentes clinicos, se leen como tendencia combinada.",
    }
    if weight_projection:
        result["weight_projection"] = weight_projection
    return result

def _hrv_cv_status_v47(raw: dict) -> dict:
    vals = []
    for d in (raw.get("health_daily") or [])[:7]:
        v = d.get("hrv_night") or d.get("hrv_week")
        if v:
            try: vals.append(float(v))
            except Exception: pass
    if len(vals) < 3:
        return {"available": False, "cv_pct": None, "status": "sin_datos", "note": "Se requieren al menos 3 noches con HRV."}
    mean = sum(vals) / len(vals)
    sd = (sum((x-mean)**2 for x in vals) / max(1, len(vals)-1)) ** 0.5
    cv = round(sd / mean * 100, 1) if mean else None
    status = "estable" if cv is not None and cv <= 8 else "vigilar" if cv is not None and cv <= 10 else "fatiga_posible"
    return {"available": True, "cv_pct": cv, "status": status, "samples": len(vals), "note": "CV% de HRV semanal; >10% sostenido sugiere mayor variabilidad/fatiga."}

def _sleep_debt_v47(raw: dict, target_h: float = 7.5) -> dict:
    debt = 0.0; samples = 0
    for d in (raw.get("health_daily") or [])[:7]:
        v = d.get("sleep_total_h") or d.get("total_h")
        if v is not None:
            try:
                debt += max(0.0, target_h - float(v)); samples += 1
            except Exception: pass
    return {"target_h": target_h, "debt_h_7d": round(debt, 1), "samples": samples, "status": "alta" if debt > 5 else "moderada" if debt > 2.5 else "controlada"}


def _sleep_quality_score(raw: dict) -> dict:
    """
    Score de calidad de sueño compuesto 0-100.
    Componentes (promedio últimas 3-5 noches con datos):
      - Duración    50 pts: sleep_total_h / 7.5
      - Sueño profundo 25 pts: deep_pct / 18   (umbral óptimo 18%)
      - REM         25 pts: rem_pct  / 22   (umbral óptimo 22%)
    Semáforo: ≥80 verde, ≥60 amarillo, <60 rojo.
    Referencia: Dijk 2009 Sleep; Walker 2017 Why We Sleep.
    """
    health = (raw.get("health_daily") or [])[:7]
    records = []
    for d in health:
        total_h  = d.get("sleep_total_h") or d.get("total_h")
        deep_pct = d.get("sleep_deep_pct")
        rem_pct  = d.get("sleep_rem_pct")
        if total_h is not None:
            try:
                records.append({
                    "total_h":  float(total_h),
                    "deep_pct": float(deep_pct) if deep_pct is not None else None,
                    "rem_pct":  float(rem_pct)  if rem_pct  is not None else None,
                })
            except Exception:
                pass
        if len(records) >= 5:
            break

    if not records:
        return {"available": False, "score": None, "status": "sin_datos",
                "note": "Sin noches con datos de sueño disponibles."}

    avg_h    = sum(r["total_h"]  for r in records) / len(records)
    deep_vals = [r["deep_pct"] for r in records if r["deep_pct"] is not None]
    rem_vals  = [r["rem_pct"]  for r in records if r["rem_pct"]  is not None]
    avg_deep = sum(deep_vals) / len(deep_vals) if deep_vals else None
    avg_rem  = sum(rem_vals)  / len(rem_vals)  if rem_vals  else None

    dur_score  = min(100.0, avg_h / 7.5 * 100.0) * 0.50
    deep_score = min(100.0, (avg_deep / 18.0) * 100.0) * 0.25 if avg_deep is not None else 12.5
    rem_score  = min(100.0, (avg_rem  / 22.0) * 100.0) * 0.25 if avg_rem  is not None else 12.5

    score = round(dur_score + deep_score + rem_score, 1)
    status = "bueno" if score >= 80 else "moderado" if score >= 60 else "deficiente"

    return {
        "available":   True,
        "score":       score,
        "status":      status,
        "avg_h":       round(avg_h, 1),
        "avg_deep_pct": round(avg_deep, 1) if avg_deep is not None else None,
        "avg_rem_pct":  round(avg_rem,  1) if avg_rem  is not None else None,
        "samples":     len(records),
        "components":  {
            "duration_pts":  round(dur_score,  1),
            "deep_pts":      round(deep_score, 1),
            "rem_pts":       round(rem_score,  1),
        },
        "thresholds":  {"duration_h": 7.5, "deep_pct": 18, "rem_pct": 22},
        "note": (
            f"Score {score}/100 ({status}): "
            f"{avg_h:.1f}h sueño, "
            f"{avg_deep:.0f}% profundo, " if avg_deep else ""
            f"{avg_rem:.0f}% REM " if avg_rem else ""
            f"(promedio {len(records)} noches)."
        ),
    }

def _altitude_adjustment_v47(profile: dict) -> dict:
    alt = float(profile.get("altitude_m") or 0)
    vo2 = profile.get("vo2max")
    # Aproximacion simple: a ~1760 m se asume ~6% de impacto sobre VO2max observado.
    factor = 0.06 * max(0, min(2500, alt)) / 1760.0 if alt else 0
    sea = round(float(vo2) / max(0.85, 1 - factor), 1) if vo2 else None
    return {"altitude_m": round(alt), "estimated_vo2max_altitude_penalty_pct": round(factor*100, 1), "vo2max_sea_level_equivalent": sea, "note": "Ajuste aproximado para interpretar tendencia; no modifica el VO2max Garmin original."}

def _classify_periodization_block_v47(raw: dict, profile: dict) -> dict:
    ts = raw.get("training_status") or {}
    acwr = ts.get("acwr") or ts.get("dailyAcuteChronicWorkloadRatio")
    curve = _build_training_load_curve_v46(raw, profile)
    state = curve.get("state")
    try: ac = float(acwr) if acwr is not None else None
    except Exception: ac = None
    if state == "alta" or (ac is not None and ac > 1.35):
        block = "descarga_recomendada"; msg = "Carga alta: conviene descargar o mantener sesiones suaves."
    elif state == "baja" or (ac is not None and ac < 0.80):
        block = "base"; msg = "Carga baja: buen momento para construir base aerobia progresiva."
    elif ac is not None and 0.80 <= ac <= 1.25:
        block = "construccion"; msg = "Carga controlada: mantener progresion y calidad dosificada."
    else:
        block = "mantenimiento"; msg = "Sin ACWR suficiente: mantener consistencia y revisar tendencia."
    return {"block": block, "message": msg, "acwr": ac, "load_state": state}

def _public_profile_v47(profile: dict) -> dict:
    """Perfil expuesto a la app sin fecha de nacimiento exacta."""
    out = {k: v for k, v in profile.items() if k not in ("zones", "birth_date")}
    try:
        out.setdefault("chronological_age", calculate_chronological_age(profile))
    except Exception:
        out.setdefault("chronological_age", None)
    out["birth_date_privacy"] = "hidden_in_web_export"
    if str(profile.get("birth_date", ""))[:10] == "1989-03-28":
        out["birth_date_status"] = "real_date_set"
        out["age_warning"] = "La fecha de nacimiento base es placeholder; actualizar profile.json para edades funcionales exactas."
    return out

def _build_intelligent_alerts_v44(raw: dict, profile: dict, fat_oxidation: dict, dynamic_energy: dict, comparison: dict) -> list[dict]:
    alerts = []
    health = raw.get("health_daily", []) or []
    latest = health[0] if health else {}
    hrv_today = latest.get("hrv_night") or latest.get("hrv_week")
    hrv_vals = [d.get("hrv_night") or d.get("hrv_week") for d in health[1:8] if d.get("hrv_night") or d.get("hrv_week")]
    hrv_base = round(sum(hrv_vals)/len(hrv_vals), 1) if hrv_vals else None
    sleep = latest.get("sleep_total_h")
    rhr = latest.get("rhr")
    rhr_vals = [d.get("rhr") for d in health[1:8] if d.get("rhr")]
    rhr_base = round(sum(rhr_vals)/len(rhr_vals), 1) if rhr_vals else None
    weekly = fat_oxidation.get("weekly", {})
    hrv_cv = _hrv_cv_status_v47(raw)
    sleep_debt = _sleep_debt_v47(raw)
    load_curve = _build_training_load_curve_v46(raw, profile)
    sleep_quality = _sleep_quality_score(raw)

    if hrv_cv.get("available") and hrv_cv.get("cv_pct") is not None and hrv_cv.get("cv_pct") > 10:
        alerts.append({"level": "yellow", "title": "HRV variable", "message": f"HRV CV% semanal {hrv_cv.get('cv_pct')}%; posible fatiga o recuperacion irregular.", "action": "Evitar intensidad si tambien hay sueño bajo o FC reposo elevada."})
    if sleep_debt.get("debt_h_7d", 0) > 5:
        alerts.append({"level": "red", "title": "Deuda de sueño acumulada", "message": f"Deuda aproximada de {sleep_debt.get('debt_h_7d')} h en 7 dias.", "action": "Suprimir entrenamiento intenso y priorizar recuperacion."})

    # ── Alerta compuesta de sobreentrenamiento temprana ──────────────────────
    # Dispara si TRES señales coinciden simultáneamente:
    #   1. HRV CV% > 10% (variabilidad autonómica elevada)
    #   2. Deuda de sueño 7d > 5h
    #   3. FC reposo actual > baseline + 5 bpm
    # Referencia: Meeusen et al. 2013 Med Sci Sports Exerc
    _hrv_cv_val    = hrv_cv.get("cv_pct") or 0
    _sleep_debt_h  = sleep_debt.get("debt_h_7d", 0)
    _rhr_elevated  = rhr is not None and rhr_base is not None and rhr > rhr_base + 5
    _overtraining_flags = sum([
        _hrv_cv_val > 10,
        _sleep_debt_h > 5,
        bool(_rhr_elevated),
    ])
    if _overtraining_flags >= 3:
        alerts.insert(0, {
            "level": "red",
            "title": "⚠️ Alerta de sobreentrenamiento",
            "message": (
                f"3 señales simultáneas: HRV CV% {_hrv_cv_val}% + "
                f"deuda sueño {_sleep_debt_h}h + "
                f"FC reposo elevada {rhr} bpm. "
                "Patrón de sobreentrenamiento funcional (Meeusen 2013)."
            ),
            "action": "Descanso completo o Z1 máximo. No intensidad hasta que 2 de 3 señales normalicen.",
        })
    elif _overtraining_flags == 2:
        alerts.append({
            "level": "yellow",
            "title": "Precaución: 2 señales de fatiga acumulada",
            "message": (
                f"HRV CV% {_hrv_cv_val}%, deuda sueño {_sleep_debt_h}h, "
                f"FC reposo {'elevada' if _rhr_elevated else 'normal'}. "
                "Vigilar tendencia."
            ),
            "action": "Mantener Z2 o inferior. Monitorear 48h antes de intensidad.",
        })
    if load_curve.get("training_monotony") and load_curve.get("training_monotony") > 2:
        alerts.append({"level": "yellow", "title": "Monotonía de carga alta", "message": f"Training Monotony {load_curve.get('training_monotony')}; poca variacion diaria de carga.", "action": "Alternar dias suaves, base y calidad para reducir riesgo."})

    if sleep is not None and sleep < 6:
        alerts.append({"level": "yellow", "title": "Sueño bajo", "message": "Dormiste poco; no conviene déficit alto ni intensidad fuerte hoy.", "action": "Usar déficit controlado y Z1/Z2 suave."})
    if hrv_today and hrv_base and hrv_today < hrv_base * 0.88:
        alerts.append({"level": "red", "title": "HRV en descenso", "message": "Tu HRV cayó más de 12% frente al promedio reciente.", "action": "Bajar intensidad y priorizar recuperación."})
    if rhr and rhr_base and rhr > rhr_base + 5:
        alerts.append({"level": "yellow", "title": "FC reposo elevada", "message": "FC reposo por encima del patrón reciente; posible fatiga, estrés o deshidratación.", "action": "Evitar VO2max hasta normalizar."})
    if weekly.get("fatmax_minutes", 0) < 75:
        alerts.append({"level": "blue", "title": "Falta trabajo FatMax", "message": f"Llevas {weekly.get('fatmax_minutes',0)} min en FatMax; meta sugerida 120 min/semana.", "action": "Programar 2 sesiones Z2/FatMax de 35 min si el semáforo lo permite."})
    if dynamic_energy.get("mode") == "progresivo" and (raw.get("training_readiness") or {}).get("score", 0) >= 70:
        alerts.append({"level": "green", "title": "Buena ventana de adaptación", "message": "Readiness y déficit dinámico permiten entrenar de forma productiva.", "action": "Z2 o calidad moderada según plan."})
    if not alerts:
        alerts.append({"level": "green", "title": "Sin alertas críticas", "message": "Datos dentro de rango operativo.", "action": "Mantener consistencia y revisar tendencia semanal."})
    # ── Alerta de calidad de sueño ───────────────────────────────────────────
    if sleep_quality.get("available") and sleep_quality.get("score") is not None:
        sq = sleep_quality["score"]
        if sq < 60:
            alerts.append({
                "level": "yellow",
                "title": f"Calidad de sueño baja ({sq}/100)",
                "message": (
                    f"Score {sq}/100: "
                    f"{sleep_quality.get('avg_h', '?')}h, "
                    f"profundo {sleep_quality.get('avg_deep_pct', '?')}%, "
                    f"REM {sleep_quality.get('avg_rem_pct', '?')}%."
                ),
                "action": "Priorizar higiene del sueño. Evitar pantallas 1h antes de dormir.",
            })
    return alerts


def _build_settings_v44(profile: dict, dynamic_energy: dict) -> dict:
    return {
        "editable": True,
        "source": "profile.json + ajustes locales de la app",
        "fields": {
            "weight_kg": profile.get("weight_kg"),
            "target_weight_kg": profile.get("target_weight_kg"),
            "fc_reposo": profile.get("fc_reposo"),
            "fc_max": profile.get("fc_max"),
            "deficit_base_kcal": dynamic_energy.get("recommended_deficit_kcal"),
            "training_preference": profile.get("secondary_goal", "squash_running"),
            "available_days": profile.get("available_training_days", 5),
            "primary_goal": profile.get("main_goal", "fat_loss_performance"),
        },
        "goals_available": ["grasa", "squash", "vo2max", "resistencia", "mixto"],
    }




# ═══════════════════════════════════════════════════════════════
# SCIENCE LAYER v5 — transparencia, confianza y jerarquía UX
# ═══════════════════════════════════════════════════════════════
def _msq_num(v, default=None):
    try:
        if v is None or v == "": return default
        return float(v)
    except Exception:
        return default


def _confidence_label(score):
    s = _msq_num(score, 0) or 0
    if s >= 80: return "alta"
    if s >= 60: return "media-alta"
    if s >= 45: return "media"
    if s >= 30: return "baja-media"
    return "baja"


def _confidence_from_count(count, target, floor=25, ceiling=92):
    ratio = max(0, min(1, float(count or 0) / max(1, float(target or 1))))
    return int(round(floor + (ceiling - floor) * ratio))


def _science_refs_v5():
    return {
        "garmin_training_readiness": {"label": "Garmin Training Readiness", "url": "https://www.garmin.com/en-US/garmin-technology/running-science/physiological-measurements/training-readiness/", "why": "Score propietario basado en sueño, recuperación, HRV, carga aguda, historial de sueño y estrés."},
        "hrv_guided_training": {"label": "HRV como tendencia de recuperación", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12787763/", "why": "Interpretar HRV contra baseline personal y junto a RHR, sueño, carga y percepción."},
        "wearable_validity": {"label": "Limitaciones de wearables", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12404996/", "why": "HR/RHR suelen ser más útiles que gasto energético y fases de sueño aisladas."},
        "fatmax_review": {"label": "FATmax / oxidación de grasa", "url": "https://pubmed.ncbi.nlm.nih.gov/37584843/", "why": "FatMax puede estimarse por intensidad relativa; gramos exactos requieren VO2/VCO2."},
        "acwr_limitations": {"label": "ACWR y lesión", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12487117/", "why": "ACWR vigila cambios bruscos de carga, pero no predice lesión por sí solo."},
        "protein_issn": {"label": "ISSN proteína y ejercicio", "url": "https://pubmed.ncbi.nlm.nih.gov/28642676/", "why": "Rango práctico 1.4–2.0 g/kg/día para la mayoría de personas que entrenan."},
        "sleep_wearables": {"label": "Sueño en wearables", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10820351/", "why": "Tiempo total y tendencias son más defendibles que fases aisladas como diagnóstico."},
    }


def _science_metric_v5(key, label, source_type, source, score, validity, primary_use, limitations, references, value=None, unit=None):
    return {
        "key": key, "label": label, "value": value, "unit": unit,
        "source_type": source_type, "source": source,
        "ui_label": {"measured":"Medido", "garmin_proprietary":"Garmin", "derived":"Estimado", "heuristic":"Heurístico", "user_input":"Manual"}.get(source_type, "Estimado"),
        "confidence_score": int(max(0, min(100, score))), "confidence": _confidence_label(score),
        "validity": validity, "primary_use": primary_use,
        "limitations": limitations[:5], "references": references[:5], "not_diagnostic": True,
    }


def _build_scientific_context_v5(raw, profile, workout, fat_oxidation, dynamic_energy, advanced_performance):
    health = raw.get("health_daily", []) or []
    acts = raw.get("activities", []) or []
    hrv_days = sum(1 for h in health[:30] if h.get("hrv_night") or h.get("hrv_week"))
    sleep_days = sum(1 for h in health[:30] if h.get("sleep_total_h"))
    rhr_days = sum(1 for h in health[:30] if h.get("rhr"))
    kcal_days = sum(1 for h in health[:30] if h.get("cal_active"))
    readiness = raw.get("training_readiness") or {}
    tlb = raw.get("training_load_balance") or {}
    data_quality = (advanced_performance or {}).get("data_quality", {}) or {}
    fields = (advanced_performance or {}).get("fields_available", {}) or {}
    acwr = _msq_num(profile.get("acwr") or tlb.get("acwr") or tlb.get("dailyAcuteChronicWorkloadRatio"), None)
    fat_conf = ((fat_oxidation or {}).get("confidence_summary") or {}).get("avg_confidence_score", 45)
    protein_target = (dynamic_energy or {}).get("protein_g_day")
    registry = {
        "training_readiness": _science_metric_v5("training_readiness", "Training Readiness", "garmin_proprietary", "Garmin Connect", 78 if readiness.get("score") is not None else 25, "Score direccional de preparación diaria; no diagnóstico.", "Decidir si el día permite intensidad, base o recuperación.", ["Algoritmo propietario no auditable.", "Cruzar con HRV, sueño, RHR, carga y percepción."], ["garmin_training_readiness"], readiness.get("score"), "/100"),
        "hrv": _science_metric_v5("hrv", "HRV nocturna/semanal", "measured", "Garmin PPG nocturno", _confidence_from_count(hrv_days, 14), "Marcador de tendencia autonómica contra baseline personal.", "Detectar fatiga o estrés acumulado.", ["No interpretar valor aislado.", "Alcohol, enfermedad, estrés y mala señal alteran HRV."], ["hrv_guided_training", "wearable_validity"], profile.get("hrv_weekly"), "ms"),
        "resting_hr": _science_metric_v5("resting_hr", "FC reposo", "measured", "Garmin resting HR", _confidence_from_count(rhr_days, 14, 35, 94), "Tendencia útil para recuperación y carga interna.", "Confirmar estrés fisiológico cuando HRV baja.", ["PPG de muñeca puede fallar con mala señal.", "Usar tendencia 7–14 días."], ["wearable_validity"], profile.get("fc_reposo"), "bpm"),
        "sleep": _science_metric_v5("sleep", "Sueño", "measured", "Garmin sleep tracking", _confidence_from_count(sleep_days, 14, 30, 82), "Tiempo total y tendencia son más robustos que fases aisladas.", "Ajustar carga con deuda de sueño.", ["Fases REM/profundo son estimaciones.", "No diagnostica trastornos del sueño."], ["sleep_wearables", "wearable_validity"]),
        "zones_karvonen": _science_metric_v5("zones_karvonen", "Zonas FC Karvonen", "derived", "FC máxima + FC reposo", 70 if profile.get("fc_max") and profile.get("fc_reposo") else 35, "Zonas prácticas por reserva cardiaca; no umbrales medidos.", "Prescribir intensidad diaria.", ["VT1/VT2 reales requieren test.", "FC cambia por calor, sueño, cafeína e hidratación."], ["hrv_guided_training"], unit="bpm"),
        "vo2max": _science_metric_v5("vo2max", "VO2max", "garmin_proprietary", "Garmin estimate", 64 if profile.get("vo2max") else 25, "Estimación de aptitud cardiorrespiratoria útil para tendencia.", "Seguir progreso aeróbico mensual.", ["No es prueba de laboratorio.", "Puede variar por terreno, altitud y algoritmo."], ["wearable_validity"], profile.get("vo2max"), "ml/kg/min"),
        "fat_oxidation": _science_metric_v5("fat_oxidation", "FatOx / FatMax", "derived", "Modelo FC + kcal + duración", int(fat_conf or 45), "Estimación indirecta; no gramos exactos de grasa.", "Orientar Z2/FatMax semanal.", ["Gramos exactos requieren calorimetría indirecta.", "Calorías Garmin pueden tener error relevante."], ["fatmax_review", "wearable_validity"], ((fat_oxidation or {}).get("weekly") or {}).get("total_fat_g"), "g/sem"),
        "acwr": _science_metric_v5("acwr", "ACWR", "derived", "Garmin load + modelo propio", 62 if acwr and acwr > 0 else 25, "Vigilancia de cambios bruscos de carga; no predictor determinista.", "Evitar saltos de volumen/intensidad.", ["No usar como predictor único de lesión.", "Depende del método de carga."], ["acwr_limitations"], round(acwr, 2) if acwr is not None else None, "ratio"),
        "injury_risk": _science_metric_v5("injury_risk", "Riesgo de lesión", "heuristic", "Modelo ManuSquash", 48 + min(25, int((data_quality.get("score") or 0)/4)), "Alerta preventiva; no diagnóstico ni predicción clínica.", "Bajar intensidad si hay dolor/sobrecarga/fatiga.", ["Validar contra historial real.", "Dolor subjetivo manda."], ["acwr_limitations", "hrv_guided_training"], ((profile.get("performance_metrics") or {}).get("injury_risk") or {}).get("score"), "/100"),
        "energy_balance": _science_metric_v5("energy_balance", "Balance energético", "derived", "BMR + calorías activas Garmin", _confidence_from_count(kcal_days, 14, 28, 70), "Estimación para rango calórico; calibrar con peso semanal.", "Regular déficit sin dañar recuperación.", ["Gasto energético wearable suele ser menos preciso.", "Reajustar con promedio de peso 7 días."], ["wearable_validity"], (dynamic_energy or {}).get("target_kcal"), "kcal/día"),
        "protein": _science_metric_v5("protein", "Proteína", "derived", "Peso corporal × rango deportivo", 76 if profile.get("weight_kg") else 35, "Recomendación práctica para entrenamiento; no plan médico.", "Preservar masa magra en déficit.", ["Ajustar por tolerancia y criterio profesional si aplica."], ["protein_issn"], protein_target, "g/día"),
        "fitness_age": _science_metric_v5("fitness_age", "Edad física", "heuristic", "VO2max + RHR + actividad + recuperación", 50 + min(25, int((data_quality.get("score") or 0)/4)), "Índice motivacional interno; no edad biológica/clínica.", "Comunicar progreso global.", ["No diagnóstico.", "Fórmula propia pendiente de validación longitudinal."], ["wearable_validity"], (profile.get("fitness_age") or {}).get("fitness_age_app"), "años"),
    }
    return {"version":"science-layer-v5.0", "generated_at":_now().isoformat(), "disclaimer":"Sistema de entrenamiento y bienestar; no diagnostica enfermedades, lesiones ni trastornos del sueño.", "data_window":{"health_days":len(health[:30]), "hrv_days":hrv_days, "sleep_days":sleep_days, "rhr_days":rhr_days, "activities_90d":len([a for a in acts[:90] if a.get("date")]), "fields_available":fields}, "metric_registry":registry, "references":_science_refs_v5(), "confidence_policy":{"alta":"dato suficiente y uso bien soportado", "media-alta":"útil para decisión con limitaciones normales", "media":"apto para tendencia", "baja-media":"solo señal complementaria", "baja":"insuficiente o muy estimado"}, "guardrails":["Priorizar tendencia 7–14 días sobre valor aislado.", "No usar ACWR, HRV, FatOx, sueño o edad física como diagnóstico.", "Dolor, enfermedad o síntomas mandan sobre cualquier score.", "Calibrar déficit con peso promedio semanal.", "Validar zonas con test si se busca precisión competitiva."]}


def _build_decision_hierarchy_v5(raw, profile, workout, scientific_context, advanced_performance, dynamic_energy):
    workout = workout or {}
    sem = str(workout.get("semaphore") or "UNKNOWN").upper()
    tone = "red" if sem == "RED" else "yellow" if sem == "YELLOW" else "green" if sem == "GREEN" else "neutral"
    decision = "Recuperar hoy" if sem == "RED" else "Entrenar suave y controlado" if sem == "YELLOW" else "Entrenar con control" if sem == "GREEN" else "Decisión pendiente"
    registry = (scientific_context or {}).get("metric_registry", {}) or {}
    readiness = raw.get("training_readiness") or {}
    snap = workout.get("profile_snapshot") or {}
    evidence = []
    def ev(k, label, value, interp):
        m = registry.get(k, {}) or {}
        evidence.append({"metric_key":k, "label":label, "value":value, "interpretation":interp, "source_type":m.get("source_type","derived"), "ui_label":m.get("ui_label","Estimado"), "confidence":m.get("confidence","media"), "confidence_score":m.get("confidence_score",50)})
    ev("training_readiness", "Readiness", readiness.get("score", snap.get("readiness")), workout.get("semaphore_desc", "Preparación diaria."))
    ev("hrv", "HRV", snap.get("hrv"), "Interpretar contra baseline personal y junto con RHR/sueño.")
    ev("sleep", "Sueño", snap.get("sleep_h"), "Tiempo total reciente ajusta tolerancia a carga.")
    ev("acwr", "ACWR", snap.get("acwr", profile.get("acwr")), "Vigila cambios bruscos de carga; no predice lesión por sí solo.")
    scores = [x.get("confidence_score", 0) for x in evidence if x.get("confidence_score") is not None]
    conf = int(round(sum(scores)/len(scores))) if scores else 45
    avoid = []
    avoid.extend((workout.get("red_flags") or [])[:3])
    if sem != "GREEN": avoid.append("Evitar Z4–Z5 salvo indicación explícita del plan.")
    return {"version":"decision-hierarchy-v5.0", "generated_at":_now().isoformat(), "priority_order":["1_decision_today","2_exact_prescription","3_top_reasons","4_confidence_and_data_source","5_advanced_trends"], "decision":decision, "tone":tone, "semaphore":sem, "semaphore_label":workout.get("semaphore_label"), "primary_action":{"name":workout.get("name", "Entrenamiento del día"), "type_key":workout.get("type_key") or workout.get("wo_type_key"), "duration_min":workout.get("total_min") or workout.get("duration_min"), "hr_range":workout.get("hr_range"), "zone_target":workout.get("zone_target") or workout.get("zone"), "segments":workout.get("precise_segments", [])[:8]}, "why_top":((workout.get("red_flags") or []) + (workout.get("yellow_flags") or []) + (workout.get("green_flags") or []))[:6], "avoid_today":list(dict.fromkeys([x for x in avoid if x]))[:5], "evidence":evidence, "confidence_score":conf, "confidence":_confidence_label(conf), "nutrition":{"target_kcal":(dynamic_energy or {}).get("target_kcal"), "protein_g_day":(dynamic_energy or {}).get("protein_g_day"), "mode":(dynamic_energy or {}).get("mode"), "note":"Calibrar con peso promedio semanal; Garmin estima gasto energético."}, "ui_contract":{"hero":"Mostrar decisión, plan y confianza antes de gráficas.", "cards_after_hero":["prescripción","evidencia","nutrición/hidratación","gráficas","auditoría"], "advanced_collapsed_by_default":True}}


def _attach_science_layer_v5(web, raw, profile, workout, fat_oxidation, dynamic_energy, advanced_performance):
    science = _build_scientific_context_v5(raw, profile, workout, fat_oxidation, dynamic_energy, advanced_performance)
    hierarchy = _build_decision_hierarchy_v5(raw, profile, workout, science, advanced_performance, dynamic_energy)
    web["scientific_context"] = science
    web["decision_hierarchy"] = hierarchy
    web["science_summary"] = {"classification_policy":"medido / Garmin / estimado / heurístico", "overall_confidence":hierarchy.get("confidence"), "overall_confidence_score":hierarchy.get("confidence_score"), "non_diagnostic":True, "main_limitation":"Wearables y modelos derivados sirven mejor para tendencias que para mediciones clínicas exactas."}
    web.setdefault("ui_hierarchy", hierarchy.get("priority_order", []))
    web.setdefault("adaptive_workout", {}).setdefault("scientific_note", "Entrenamiento adaptativo basado en señales Garmin + reglas conservadoras; no sustituye criterio médico/profesional.")
    web.setdefault("fat_oxidation", {}).setdefault("scientific_note", "FatOx es estimación indirecta por FC/kcal/duración; usar como tendencia.")
    web.setdefault("fat_metrics", {}).setdefault("scientific_note", "FatOx es estimación indirecta por FC/kcal/duración; usar como tendencia.")
    web.setdefault("fitness_age", {}).setdefault("source_type", "heuristic")
    web.setdefault("fitness_age", {}).setdefault("not_diagnostic", True)
    web.setdefault("fitness_age", {}).setdefault("confidence", science["metric_registry"].get("fitness_age", {}).get("confidence", "media"))
    return web

def _strengthen_web_contract_v44(web: dict, raw: dict, profile: dict, workout: dict, fat_oxidation: dict, dynamic_energy: dict, advanced_performance: dict, vo2_timeline: list) -> dict:
    """Contrato top-level profesional y estable."""
    charts = _build_chart_series_v44(raw, profile, fat_oxidation, vo2_timeline)
    comparison = _build_weekly_comparison_v44(raw, fat_oxidation, profile)
    fat_balance = _build_fat_energy_balance_v47(fat_oxidation, dynamic_energy, profile)
    fat_oxidation["energy_balance"] = fat_balance
    alerts = _build_intelligent_alerts_v44(raw, profile, fat_oxidation, dynamic_energy, comparison)
    readiness = raw.get("training_readiness") or web.get("today", {}).get("training_readiness") or {}
    training = {
        "today": web.get("today", {}),
        "workout": workout or {},
        "load_balance": raw.get("training_load_balance") or {},
        "load_curve": charts.get("training_load_curve", {}),
        "periodization": _classify_periodization_block_v47(raw, profile),
        "status": raw.get("training_status") or {},
    }
    web["version"] = "5.0-science"
    web["contract"] = {
        "schema": "manusquash.web_export.v5.0.science",
        "required_top_level_keys": ["version", "profile", "health_daily", "activities", "fat_metrics", "charts", "readiness", "training", "data_quality", "scientific_context", "decision_hierarchy"],
        "generated_at": _now().isoformat(),
    }
    web["fat_metrics"] = fat_oxidation
    web["charts"] = charts
    web["readiness"] = readiness
    web["training"] = training
    web["data_quality"] = advanced_performance.get("data_quality", web.get("data_quality", {}))
    web["weekly_comparison"] = comparison
    web["fat_energy_balance"] = fat_balance
    web["intelligent_alerts"] = alerts
    web["physiology"] = {
        "hrv_cv": _hrv_cv_status_v47(raw),
        "sleep_debt": _sleep_debt_v47(raw),
        "altitude_adjustment": _altitude_adjustment_v47(profile),
        "sleep_quality": _sleep_quality_score(raw),
    }
    # Objetos listos para render: la app no debe recalcular ni adivinar rutas.
    web["physiology_panel"] = {
        "hrv_cv": web["physiology"].get("hrv_cv", {}),
        "sleep_debt": web["physiology"].get("sleep_debt", {}),
        "altitude": web["physiology"].get("altitude_adjustment", {}),
        "sleep_quality": web["physiology"].get("sleep_quality", {}),
        "training_strain": (training.get("load_curve") or {}).get("training_strain"),
        "training_monotony": (training.get("load_curve") or {}).get("training_monotony"),
    }
    web["squash_sessions"]       = [a for a in raw.get("activities", []) if a.get("squash_intensity")][:30]
    web["last_activity_hr"]      = _build_last_activity_hr(raw, profile)
    web["last_activity_laps"]    = raw.get("last_activity_laps", [])
    web["weekly_periodization"]  = _weekly_periodization_v55(
        raw, profile,
        calc_zones(int(profile.get("fc_max",193) or 193), int(profile.get("fc_reposo", profile.get("fc_reposo_min",54)) or 54))
    )
    web["multiweek_periodization"] = _multiweek_periodization_v56(
        raw, profile,
        calc_zones(int(profile.get("fc_max",193) or 193), int(profile.get("fc_reposo", profile.get("fc_reposo_min",54)) or 54))
    )
    web["race_predictions"]      = raw.get("race_predictions", {})
    web["respiration_series"]    = raw.get("respiration_series", [])
    web["garmin_weight"]         = raw.get("garmin_weight", {})
    # Sueño detallado + siestas
    web["sleep_detail"]          = raw.get("sleep_data", [])[:30]
    # Historial de workouts prescritos (para panel visual)
    try:
        _wo_log_path = OUT / "workout_log.json"
        if _wo_log_path.exists():
            import json as _json2
            _wlog = _json2.loads(_wo_log_path.read_text())
            web["workout_history"] = _wlog[:21]  # últimos 21 días
        else:
            web["workout_history"] = []
    except Exception:
        web["workout_history"] = []

    web["naps_recent"]           = [
        nap for day in raw.get("sleep_data", [])[:14]
        for nap in (day.get("naps") or [])
    ][:20]
    web["privacy"] = {"profile_birth_date": "hidden", "note": "web_export no expone birth_date exacto; usa edad calculada para graficas."}
    web["settings"] = _build_settings_v44(profile, dynamic_energy)
    web["coach_weekly"] = {
        "title": "Coach semanal",
        "message": fat_oxidation.get("weekly", {}).get("recommendation", "Mantener consistencia y revisar datos Garmin."),
        "fatmax_minutes": fat_oxidation.get("weekly", {}).get("fatmax_minutes", 0),
        "target_fatmax_minutes": fat_oxidation.get("weekly", {}).get("target_fatmax_minutes", 120),
        "missing_fatmax_minutes": fat_oxidation.get("weekly", {}).get("missing_fatmax_minutes", 0),
    }
    # Alias para compatibilidad con versiones anteriores
    web["fat_oxidation"] = fat_oxidation
    web["dynamic_energy"] = dynamic_energy
    web["energy_plan"] = dynamic_energy
    web["graph_series"] = charts
    web = _attach_science_layer_v5(web, raw, profile, workout, fat_oxidation, dynamic_energy, advanced_performance)
    return web

def _ensure_web_contract(web: dict) -> dict:
    """Evita que la app falle si Garmin no entrega un campo."""
    web.setdefault("version", "4.8")
    web.setdefault("meta", {})
    web.setdefault("profile", {})
    web.setdefault("health_daily", [])
    web.setdefault("activities", [])
    web.setdefault("fat_metrics", web.get("fat_oxidation", {}))
    web.setdefault("charts", web.get("graph_series", {}))
    web.setdefault("readiness", web.get("today", {}).get("training_readiness", {}))
    web.setdefault("training", {"today": web.get("today", {}), "workout": web.get("adaptive_workout", {})})
    web.setdefault("data_quality", web.get("advanced_performance", {}).get("data_quality", {}))
    web.setdefault("scientific_context", {"metric_registry": {}, "references": {}, "guardrails": []})
    web.setdefault("decision_hierarchy", {"decision": "Sin datos suficientes", "confidence": "baja", "evidence": []})
    web.setdefault("science_summary", {"non_diagnostic": True})
    web.setdefault("zones", [])
    web.setdefault("health_daily", [])
    web.setdefault("sleep_data", [])
    web.setdefault("activities", [])
    web.setdefault("analysis", {"findings": [], "recommendations": []})
    web.setdefault("adaptive_workout", {})
    aw = web["adaptive_workout"]
    aw.setdefault("precise_segments", [])
    aw.setdefault("daily_recommendations", [])
    aw.setdefault("science_principles", [])
    aw.setdefault("spanish_terms", _spanish_terms_glossary())
    web.setdefault("route_summaries", [])
    web.setdefault("pdf_export", {})
    web.setdefault("advanced_performance", {})
    web.setdefault("coach_context", {})
    web.setdefault("graph_series", {})
    # Claves top-level para interfaz v4: todas son aditivas y no rompen la app previa.
    web.setdefault("age_analysis", web.get("advanced_performance", {}).get("age_analysis", web.get("profile", {}).get("fitness_age", {})))
    web.setdefault("data_quality", web.get("advanced_performance", {}).get("data_quality", {}))
    web.setdefault("chart_status", web.get("advanced_performance", {}).get("chart_status", {}))
    web.setdefault("data_gaps", web.get("advanced_performance", {}).get("data_gaps", []))
    web.setdefault("hydration", web.get("advanced_performance", {}).get("hydration", {}))
    web.setdefault("passport", web.get("advanced_performance", {}).get("passport", {}))
    web.setdefault("z2_quality", web.get("advanced_performance", {}).get("z2_quality", {}))
    web.setdefault("gray_zone", web.get("advanced_performance", {}).get("gray_zone", {}))
    web.setdefault("adaptation_score", web.get("advanced_performance", {}).get("adaptation_score", {}))
    web.setdefault("weekly_coach_report", web.get("advanced_performance", {}).get("weekly_coach_report", {}))
    web.setdefault("activity_zone_review", web.get("advanced_performance", {}).get("activity_zone_review", {}))
    web.setdefault("decision_history", web.get("advanced_performance", {}).get("decision_history", {}))
    web.setdefault("plateau_detector", web.get("advanced_performance", {}).get("plateau_detector", {}))
    web.setdefault("fat_oxidation", web.get("advanced_performance", {}).get("fat_oxidation", {}))
    web.setdefault("fatmax", web.get("fat_oxidation", {}).get("fatmax", {}))
    web.setdefault("dynamic_energy", web.get("advanced_performance", {}).get("dynamic_energy", web.get("energy_plan", {})))
    web.setdefault("energy_plan", web.get("dynamic_energy", {}))
    web["advanced_performance"].setdefault("age_analysis", web.get("age_analysis", {}))
    web["advanced_performance"].setdefault("activity_zone_review", {})
    web["advanced_performance"].setdefault("decision_history", {})
    web["advanced_performance"].setdefault("plateau_detector", {})
    web["advanced_performance"].setdefault("fat_oxidation", web.get("fat_oxidation", {}))
    web["advanced_performance"].setdefault("dynamic_energy", web.get("dynamic_energy", {}))
    web["meta"].setdefault("fields_available", web.get("advanced_performance", {}).get("fields_available", {}))
    prof = web["profile"]
    for k, v in {"vo2max": 0, "fc_reposo": 0, "hrv_weekly": 0, "fc_max": 0, "weight_kg": 0}.items():
        prof.setdefault(k, v)
    return web

def generate_adaptive_workout(profile: dict, raw: dict) -> dict:
    """
    Motor adaptativo v3 — Semáforo Fisiológico + 12 variables.

    SEMÁFORO:
      🔴 ROJO   → solo recuperación Z1 (sistema bajo estrés)
      🟡 AMARILLO → Z2 controlado, sin intensidad
      🟢 VERDE  → Z2 / Tempo Z3 / Intervalos Z4 según déficit y carga

    Variables evaluadas:
      1. Training Readiness (score + nivel)
      2. HRV semanal vs baseline
      3. HRV nocturno último
      4. Sueño reciente (horas + calidad)
      5. FC reposo actual vs línea base
      6. ACWR (ratio carga aguda/crónica)
      7. Carga aguda y crónica absolutas
      8. Training Load Balance (déficit Z1-Z2 y Z4-Z5)
      9. Días desde el último run
      10. Squash reciente (últimas 48h)
      11. Intensidad alta últimos 3 días (Z4-Z5)
      12. Training Status (DETRAINING, PRODUCTIVE, etc.)
    """
    # ── Edad fisica y datos subjetivos ───────────────────
    fitness_age_data = profile.get("fitness_age", {}) or {}
    fit_age   = float(fitness_age_data.get("fitness_age_app", 37) or 37)
    recov_age = float(fitness_age_data.get("recovery_age", 37) or 37)
    age_delta = float(fitness_age_data.get("age_delta", 0) or 0)
    recov_warn= bool(fitness_age_data.get("recovery_warning", False))
    chron_age = float(fitness_age_data.get("chronological_age", 37) or 37)
    injury_st = str(profile.get("injury_status", "none") or "none")
    subj       = profile.get("subjective", {}) or {}
    joint_pain = float(subj.get("joint_pain") or 0)
    muscle_pain= float(subj.get("muscle_pain") or 0)
    rpe_last   = float(subj.get("rpe_last") or 5)
    sick       = bool(subj.get("sick", False))

    from datetime import timedelta

    z        = profile.get("zones", calc_zones(193, 54))
    tr_score = float(profile.get("training_readiness", 80) or 80)
    tr_level = str(profile.get("training_readiness_level", "") or "")
    acwr     = float(profile.get("acwr", 0.0) or 0.0)
    acute    = float(profile.get("acute_load", 0) or 0)
    chronic  = float(profile.get("chronic_load", 100) or 100)
    hrv_week = float(profile.get("hrv_weekly", 43) or 43)
    vo2      = float(profile.get("vo2max", 45.0) or 45.0)
    status   = str(profile.get("training_status", "") or "")
    tlb      = profile.get("load_balance", {}) or {}
    fc_rep   = float(profile.get("fc_reposo", 54) or 54)
    fc_rep_min = float(profile.get("fc_reposo_min", 49) or 49)
    fc_max   = int(profile.get("fc_max", 193) or 193)

    # ── Load balance ────────────────────────────────────
    aer_low      = float(tlb.get("aer_low", 0) or 0)
    aer_high     = float(tlb.get("aer_high", 0) or 0)
    aer_low_min  = float(tlb.get("aer_low_min", 300) or 300)
    aer_low_max  = float(tlb.get("aer_low_max", 500) or 500)
    aer_high_min = float(tlb.get("aer_high_min", 282) or 282)
    aer_high_max = float(tlb.get("aer_high_max", 470) or 470)
    tlb_feedback = str(tlb.get("feedback", "") or "")

    # ── Fallback Z4-Z5 desde evidencia real de FC ───────────────────────
    # Garmin TLB frecuentemente devuelve 0 para cuentas sin historial
    # suficiente. En ese caso calculamos desde actividades reales.
    if aer_high == 0:
        acts_all  = raw.get("activities", []) or []
        zones_fb  = calc_zones(fc_max, int(fc_rep))
        now_dt    = _now()
        z45_min_28d = 0.0
        z12_min_28d = 0.0
        for _a in acts_all:
            try:
                _age = (now_dt - datetime.strptime(str(_a.get("date",""))[:10], "%Y-%m-%d")).days
                if _age > 28:
                    continue
                _ev  = _activity_zone_evidence(_a, zones_fb)
                _dur = float(_a.get("dur_min") or 0)
                if _ev.get("reached_z4") or _ev.get("reached_z5"):
                    z45_min_28d += _dur
                else:
                    z12_min_28d += _dur
            except Exception:
                pass
        # ~2.5 unidades de carga/min en Z4-Z5 (estimación conservadora)
        aer_high = round(z45_min_28d * 2.5, 1)
        if aer_low == 0:
            aer_low = round(z12_min_28d * 1.0, 1)
        if aer_high_min == 0:
            aer_high_min = 282.0
        if aer_low_min == 0:
            aer_low_min  = 300.0
        if not tlb_feedback:
            tlb_feedback = "estimado desde FC real (TLB Garmin no disponible)"

    # ── HRV nocturno ────────────────────────────────────
    health = raw.get("health_daily", [])
    hrv_night_recent = [h.get("hrv_night") for h in health[:3] if h.get("hrv_night")]
    hrv_night = hrv_night_recent[0] if hrv_night_recent else hrv_week

    # HRV baseline from profile
    hrv_bl_lo = float(profile.get("hrv_baseline_low", 40) or 40)
    hrv_bl_hi = float(profile.get("hrv_baseline_high", 57) or 57)
    hrv_status_ok = hrv_bl_lo <= hrv_week <= hrv_bl_hi

    # ── Sueño reciente ──────────────────────────────────
    sleep_recent = [h for h in health[:5] if h.get("sleep_total_h")]
    avg_sleep = sum(h["sleep_total_h"] for h in sleep_recent) / len(sleep_recent) if sleep_recent else 7.0
    avg_deep  = sum(h.get("sleep_deep_pct", 15) for h in sleep_recent) / len(sleep_recent) if sleep_recent else 15
    avg_rem   = sum(h.get("sleep_rem_pct", 20) for h in sleep_recent) / len(sleep_recent) if sleep_recent else 20
    sleep_ok  = avg_sleep >= 6.5

    # ── FC reposo vs baseline ───────────────────────────
    # Si FC reposo actual > baseline mínimo + 5 bpm → fatiga
    rhr_elevated = fc_rep > (fc_rep_min + 5)

    # ── Actividades recientes ───────────────────────────
    acts = raw.get("activities", [])
    now = _now()

    # Incluir todas las variantes de carrera que Garmin puede devolver:
    # "running", "trail_running", "track_running", "street_running",
    # "treadmill_running", "running_5k", "virtual_run", etc.
    runs = [a for a in acts if ("running" in str(a.get("type", "")).lower()
                                or str(a.get("type","")).lower() in ("run","jog","virtual_run"))
            and a.get("dist_km", 0) > 1 and a.get("avg_hr")]
    runs_sorted = sorted(runs, key=lambda x: x.get("date", ""))

    days_since_run = 999
    if runs_sorted:
        try:
            last_run_date = datetime.strptime(runs_sorted[-1]["date"][:10], "%Y-%m-%d")
            days_since_run = (now - last_run_date).days
        except Exception:
            pass

    recent_avg_pace = 7.0
    if runs_sorted:
        valid = [r for r in runs_sorted[-5:] if r.get("dist_km", 0) > 0]
        if valid:
            recent_avg_pace = sum(r["dur_min"] / r["dist_km"] for r in valid) / len(valid)

    # ── Squash últimas 48h ──────────────────────────────
    # Importante: squash reciente NO cuenta automaticamente como Z4/Z5.
    # Solo cubre Z4-Z5 si la FC maxima/promedio alcanzo el umbral de Z4/Z5.
    squash_48h = False
    squash_z4z5_48h = False
    squash_recent_evidence = []
    for a in acts:
        if not a.get("date") or not _is_squash_activity(a):
            continue
        try:
            age = (now - datetime.strptime(str(a["date"])[:10], "%Y-%m-%d")).days
        except Exception:
            continue
        if age <= 2:
            squash_48h = True
            ev = _activity_zone_evidence(a, z)
            squash_recent_evidence = ev.get('evidence', [])
            if ev.get('reached_z4') or ev.get('reached_z5'):
                squash_z4z5_48h = True

    # ── Alta intensidad últimos 3 días ──────────────────
    # Ahora high_intensity_3d significa evidencia real de Z4/Z5 por FC.
    # Training Effect alto queda separado para no confundir "carga" con "cumplio Z4/Z5".
    high_intensity_3d = False
    high_training_effect_3d = False
    high_intensity_evidence = []
    for a in acts:
        if not a.get("date"): continue
        try:
            age = (now - datetime.strptime(str(a["date"])[:10], "%Y-%m-%d")).days
        except Exception:
            continue
        if age <= 3:
            ev = _activity_zone_evidence(a, z)
            te_aer = float(a.get("te_aer", 0) or 0)
            if ev.get('reached_z4') or ev.get('reached_z5'):
                high_intensity_3d = True
                high_intensity_evidence = ev.get('evidence', [])
            if te_aer >= 3.5:
                high_training_effect_3d = True


    # ══════════════════════════════════════════════════
    # SEMÁFORO FISIOLÓGICO
    # ══════════════════════════════════════════════════
    scores = {}
    red_flags  = []
    yel_flags  = []
    green_plus = []

    # --- Readiness ---
    if tr_score >= 75:
        scores["readiness"] = "green"
        green_plus.append(f"Readiness {tr_score:.0f}/100 ({tr_level})")
    elif tr_score >= 55:
        scores["readiness"] = "yellow"
        yel_flags.append(f"Readiness moderado {tr_score:.0f}/100")
    else:
        scores["readiness"] = "red"
        red_flags.append(f"Readiness bajo {tr_score:.0f}/100 — sistema bajo estrés")

    # --- HRV ---
    hrv_drop = hrv_week < hrv_bl_lo
    if hrv_week >= hrv_bl_lo and hrv_week <= hrv_bl_hi:
        scores["hrv"] = "green"
        green_plus.append(f"HRV {hrv_week:.0f} ms en zona balance ({hrv_bl_lo:.0f}–{hrv_bl_hi:.0f})")
    elif hrv_week >= hrv_bl_lo * 0.85:
        scores["hrv"] = "yellow"
        yel_flags.append(f"HRV {hrv_week:.0f} ms ligeramente bajo (base {hrv_bl_lo:.0f})")
    else:
        scores["hrv"] = "red"
        red_flags.append(f"HRV {hrv_week:.0f} ms muy bajo (base {hrv_bl_lo:.0f}) — SNA bajo estrés")

    # --- HRV nocturno ---
    if hrv_night and hrv_night < hrv_week * 0.85:
        yel_flags.append(f"HRV nocturno {hrv_night:.0f} ms por debajo del semanal ({hrv_week:.0f})")

    # --- Sueño ---
    if avg_sleep >= 7.0 and avg_deep >= 13 and avg_rem >= 18:
        scores["sleep"] = "green"
        green_plus.append(f"Sueño {avg_sleep:.1f}h — profundo {avg_deep:.0f}%, REM {avg_rem:.0f}%")
    elif avg_sleep >= 6.0:
        scores["sleep"] = "yellow"
        yel_flags.append(f"Sueño {avg_sleep:.1f}h ({avg_deep:.0f}% profundo, {avg_rem:.0f}% REM)")
    else:
        scores["sleep"] = "red"
        red_flags.append(f"Sueño insuficiente {avg_sleep:.1f}h — recuperación comprometida")

    # --- FC reposo ---
    if not rhr_elevated:
        scores["rhr"] = "green"
        green_plus.append(f"FC reposo {fc_rep:.0f} bpm (baseline {fc_rep_min:.0f})")
    else:
        scores["rhr"] = "yellow"
        yel_flags.append(f"FC reposo elevada {fc_rep:.0f} vs baseline {fc_rep_min:.0f} bpm (+{fc_rep-fc_rep_min:.0f})")

    # --- ACWR ---
    if 0.8 <= acwr <= 1.3:
        scores["acwr"] = "green"
        green_plus.append(f"ACWR {acwr:.2f} — carga óptima")
    elif acwr < 0.5 or acwr == 0:
        scores["acwr"] = "yellow"
        yel_flags.append(f"ACWR {acwr:.2f} — subcarga (detraining)")
    elif acwr > 1.5:
        scores["acwr"] = "red"
        red_flags.append(f"ACWR {acwr:.2f} — sobrecarga, riesgo de lesión")
    else:
        scores["acwr"] = "yellow"
        yel_flags.append(f"ACWR {acwr:.2f} — fuera del rango óptimo")

    # --- Training status ---
    if "DETRAINING" in status:
        yel_flags.append(f"Training Status: DETRAINING — retomar gradual")
    elif "PRODUCTIVE" in status:
        green_plus.append("Training Status: PRODUCTIVE")
    elif "UNPRODUCTIVE" in status:
        yel_flags.append("Training Status: UNPRODUCTIVE — revisar distribución de intensidad")
    elif "OVERREACHING" in status:
        red_flags.append("Training Status: OVERREACHING — reducir carga urgente")

    # --- Alta intensidad reciente ---
    if high_intensity_3d:
        yel_flags.append("Alta intensidad real en los últimos 3 días — evidencia de FC en Z4/Z5")
    elif high_training_effect_3d:
        yel_flags.append("Garmin marcó carga alta reciente, pero sin evidencia clara de Z4/Z5 por FC")
    if squash_z4z5_48h:
        yel_flags.append("Squash en las últimas 48h sí cubrió Z4-Z5 por evidencia de FC")
    elif squash_48h:
        yel_flags.append("Squash reciente, pero no cuenta como Z4-Z5: no alcanzaste el umbral de FC")

    # --- Load balance déficit ---
    aer_low_pct  = (aer_low / aer_low_min * 100) if aer_low_min > 0 else 0
    aer_high_pct = (aer_high / aer_high_min * 100) if aer_high_min > 0 else 0

    needs_z2    = aer_low_pct < 60
    needs_z4z5  = aer_high_pct < 50

    if needs_z2:
        yel_flags.append(f"Déficit aeróbico bajo Z1-Z2: {aer_low:.0f}/{aer_low_min:.0f} ({aer_low_pct:.0f}%)")
    if needs_z4z5:
        yel_flags.append(f"Déficit aeróbico alto Z4-Z5: {aer_high:.0f}/{aer_high_min:.0f} ({aer_high_pct:.0f}%)")

    # ── DECISIÓN DEL SEMÁFORO ───────────────────────────
    # Flags adicionales por edad fisica, subjetivo y lesion
    if sick:
        red_flags.append("Enfermedad reportada — solo descanso")
    if injury_st == "moderate":
        red_flags.append(f"Lesion moderada activa — no correr")
    elif injury_st == "minor":
        yel_flags.append("Lesion menor activa — evitar impacto alto")
    if joint_pain >= 6:
        red_flags.append(f"Dolor articular alto ({joint_pain:.0f}/10) — evitar intensidad")
    elif joint_pain >= 3:
        yel_flags.append(f"Dolor articular moderado ({joint_pain:.0f}/10)")
    if muscle_pain >= 7:
        yel_flags.append(f"Dolor muscular alto ({muscle_pain:.0f}/10) — recuperacion activa")
    if rpe_last >= 9:
        yel_flags.append(f"RPE anterior muy alto ({rpe_last:.0f}/10) — respetar recuperacion")
    if recov_warn:
        yel_flags.append(f"Edad de recuperacion elevada ({recov_age:.0f} vs {calculate_chronological_age(profile):.0f} años) — bajar intensidad")
    if age_delta < -5:
        yel_flags.append(f"Edad fisica ({fit_age:.0f}) > edad real — progresion conservadora")
    elif age_delta > 5:
        green_plus.append(f"Edad fisica ({fit_age:.0f}) excelente vs cronologica")

    n_red  = len(red_flags)
    n_yel  = len(yel_flags)
    n_grn  = len(green_plus)

    if n_red >= 2 or (n_red >= 1 and scores.get("hrv") == "red"):
        semaphore = "RED"
    elif n_red >= 1 or n_yel >= 3:
        semaphore = "YELLOW"
    else:
        semaphore = "GREEN"

    # ══════════════════════════════════════════════════
    # SELECCIÓN DE WORKOUT según semáforo
    # ══════════════════════════════════════════════════
    reasons = red_flags + yel_flags + green_plus

    # Duración base según carga crónica y días sin correr
    dur_base = max(15, min(int(20 + chronic / 15), 40))

    # Día actual — necesario para variedad y especificidad
    today_date  = _today()
    weekday     = today_date.weekday()          # 0=lun … 6=dom
    day_of_year = today_date.timetuple().tm_yday
    if days_since_run > 14: dur_base = min(dur_base, 25)
    if days_since_run > 30: dur_base = min(dur_base, 20)

    # ── Periodización semanal ──────────────────────────────
    # Aplicar restricciones ANTES de elegir workout
    # Esto garantiza que el árbol de decisión no viole las reglas de microciclo.
    period   = _weekly_periodization_v55(raw, profile, z)
    period_mw = _multiweek_periodization_v56(raw, profile, z)

    # Combinar restricciones semanales + mesociclo
    # El intensity_cap del mesociclo puede ser más restrictivo que el semanal
    mw_intensity_cap = period_mw.get("intensity_cap", 2)
    mw_cycle_week    = period_mw.get("cycle_week", 2)
    mw_is_unload     = period_mw.get("is_unload_week", False)

    # Semana de descarga del mesociclo → forzar recuperación independientemente del semáforo
    if mw_is_unload and semaphore == "GREEN":
        semaphore = "YELLOW"
        yel_flags.append(
            f"Mesociclo: semana de DESCARGA (semana {mw_cycle_week}/4). "
            "El cuerpo necesita absorber las adaptaciones. Solo Z1-Z2 esta semana. (Issurin 2010)"
        )

    # Z4 ya alcanzó el cap del mesociclo esta semana
    current_z4 = period.get("z4_sessions_7d", 0)
    if current_z4 >= mw_intensity_cap and semaphore == "GREEN" and mw_intensity_cap < 2:
        green_plus.append(
            f"Mesociclo semana {mw_cycle_week} ({period_mw.get('cycle_name','?')}): "
            f"cap de intensidad {mw_intensity_cap} sesión/semana alcanzado. Continuar con Z2."
        )

    if period["block_intensity"] and semaphore != "RED":
        # Forzar a Z2 o recovery si el microciclo lo requiere
        if semaphore == "GREEN" and period["recovery_days_7d"] == 0:
            semaphore = "YELLOW"
            yel_flags.append("Periodización: sin días de recuperación esta semana → bajar intensidad.")
        elif semaphore == "GREEN":
            green_plus.append(
                f"Periodización: límite Z4-Z5 ({period['z4_sessions_7d']}/2). "
                "Sesión de calidad bloqueada. Continuar con Z2."
            )

    # ── Historial de workouts prescritos (log persistente) ──────────────
    # Lee de workout_log.json para anti-repetición real.
    # Garmin no devuelve wo_type, por eso lo guardamos en disco.
    recent_wo_types = []
    try:
        _wo_log_path = OUT / "workout_log.json"
        if _wo_log_path.exists():
            import json as _json
            _log_data = _json.loads(_wo_log_path.read_text())
            recent_wo_types = [e["wo_type"] for e in _log_data
                               if isinstance(e, dict) and e.get("wo_type")][:7]
    except Exception:
        pass
    # Fallback a web_export.json si workout_log.json no existe en el runner
    if not recent_wo_types:
        for _cand in [OUT / "web_export.json", PROJECT_DIR.parent / "web" / "garmin" / "data" / "web_export.json"]:
            if _cand.exists():
                try:
                    import json as _json
                    _we = _json.loads(_cand.read_text(encoding="utf-8"))
                    _wh = _we.get("workout_history", [])
                    if _wh:
                        recent_wo_types = [e["wo_type"] for e in _wh if isinstance(e, dict) and e.get("wo_type")][:7]
                        break
                except Exception:
                    pass
    # Fallback a actividades recientes si no hay historial previo
    if not recent_wo_types:
        for _a in acts[:7]:
            _t = _a.get("type", "")
            if _t in ("running", "trail_running"):
                recent_wo_types.append("easy_z2")
            elif _t in ("strength_training", "gym"):
                recent_wo_types.append("strength_preventive")
            elif _is_squash_activity(_a):
                recent_wo_types.append("squash_cancha")
    last_wo = recent_wo_types[0] if recent_wo_types else ""

    def _days_since_type(wt):
        for i, x in enumerate(recent_wo_types):
            if x == wt: return i
        return 99

    def _days_since_squash():
        for i, a in enumerate(acts[:10]):
            if _is_squash_activity(a): return i
        return 99

    # ── MOTOR DE SCORING INTELIGENTE v2.0 ───────────────────────────────
    # Cada workout recibe puntuación 0-100. El sistema elige el mayor.

    # Categorías por intensidad (para gate del semáforo)
    HIGH_INTENSITY   = {"vo2max_4x4","vo2max_intervals","fat_burn_hiit","fartlek","z3_tempo_continuo","circuit_metabolic","intervals_400m","intervals_800m","hill_repeats","norwegian_15_15","squash_ghosting_hiit","strength_explosive"}
    MEDIUM_INTENSITY = {"z3_tempo_intro","tempo_escalonado","progression_run","strides_neuromuscular","squash_cancha","cruise_intervals","z2_negative_split"}
    LOW_INTENSITY    = {"easy_z2","long_z2","z2_pyramid","fat_burn_long","squash_conditioning","squash_technical","strength_preventive","rebuild_base"}
    RECOVERY_ONLY    = {"recovery","mobility_stretch","mindful_recovery","yoga_recovery","fat_burn_walk"}

    MIN_TR = {
        "recovery":0,"mindful_recovery":0,"mobility_stretch":0,
        "rebuild_base":20,"easy_z2":30,"fat_burn_long":35,"z2_pyramid":40,
        "strength_preventive":40,"squash_technical":40,"squash_conditioning":45,
        "long_z2":45,"progression_run":50,"tempo_escalonado":55,
        "strides_neuromuscular":55,"z3_tempo_intro":60,"squash_cancha":60,
        "fat_burn_hiit":65,"circuit_metabolic":65,"fartlek":65,
        "z3_tempo_continuo":70,"vo2max_intervals":75,"vo2max_4x4":80,
        "intervals_400m":70,"intervals_800m":70,"cruise_intervals":60,
        "hill_repeats":60,"norwegian_15_15":72,"z2_negative_split":45,
        "fat_burn_walk":0,"squash_ghosting_hiit":65,
        "strength_explosive":60,"yoga_recovery":0,
    }

    FAT_BURN_SCORE = {
        "fat_burn_walk": 20, "fat_burn_long": 20, "z2_pyramid": 20, "z2_negative_split": 20,
        "circuit_metabolic": 19, "tempo_escalonado": 18, "progression_run": 18, "easy_z2": 18,
        "long_z2": 18, "fat_burn_hiit": 18, "strength_preventive": 16, "strides_neuromuscular": 16,
        "squash_cancha": 16, "mobility_stretch": 15, "yoga_recovery": 15, "recovery": 15,
        "fartlek": 15, "cruise_intervals": 14, "z3_tempo_intro": 14, "z3_tempo_continuo": 14,
        "vo2max_4x4": 14, "squash_conditioning": 14, "norwegian_15_15": 14, "strength_explosive": 14,
        "vo2max_intervals": 13, "intervals_400m": 12, "intervals_800m": 12, "rebuild_base": 10,
        "squash_technical": 10, "mindful_recovery": 10,
    }

    bb_curr = float(profile.get("bb_high",50) or 50)
    cy_week = period_mw.get("cycle_week",2)

    def _score_wo(wt):
        sc = 0.0
        # Gate semáforo
        if semaphore == "RED":
            if wt not in RECOVERY_ONLY: return -100.0
        elif semaphore == "YELLOW":
            if wt in HIGH_INTENSITY: return -100.0
            if wt in MEDIUM_INTENSITY: sc -= 20.0
        # Gate readiness
        if tr_score < MIN_TR.get(wt, 50): return -100.0
        # Gate Body Battery
        if bb_curr < 20 and wt not in RECOVERY_ONLY: return -100.0
        # Gate lesión
        if (injury_st not in ("none","") or joint_pain >= 3) and wt in HIGH_INTENSITY | {"circuit_metabolic","fat_burn_hiit"}: return -100.0

        # A. Readiness (0-25)
        if wt in HIGH_INTENSITY:
            sc += min(25, (tr_score - MIN_TR.get(wt,75)) * 0.5)
        else:
            sc += min(20, tr_score * 0.2)
        if hrv_night:
            if hrv_bl_lo <= hrv_night <= hrv_bl_hi + 10: sc += 5
            elif hrv_night < hrv_bl_lo - 5: sc -= 8

        # B. Pérdida de peso / quema grasa (0-25)
        sc += FAT_BURN_SCORE.get(wt, 10)
        # Bonus de volumen prolongado solo en día de tirada larga (Sábado)
        if wt in {"fat_burn_long", "long_z2"} and weekday == 5:
            sc += 6

        # C. Variedad anti-repetición (0-35)
        ds = _days_since_type(wt)
        if ds == 0:   sc -= 35   # Ya prescrito o completado hoy -> rotar obligatoriamente
        elif ds == 1: sc -= 22   # Realizado ayer -> penalización fuerte para no repetir
        elif ds == 2: sc -= 10   # Realizado anteayer
        elif ds >= 4: sc += 6    # No realizado en 4+ días -> fomenta rotación
        if len(recent_wo_types) >= 2 and recent_wo_types[0] == wt == recent_wo_types[1]:
            sc -= 30  # 2 días seguidos del mismo → penalización máxima

        # D. Periodización (0-15)
        if cy_week == 1:  # Acumulación
            if wt in {"easy_z2","long_z2","fat_burn_long","z2_pyramid"}: sc += 10
            if wt in HIGH_INTENSITY: sc -= 10
        elif cy_week == 3:  # Intensificación
            if wt in HIGH_INTENSITY: sc += 12
        elif cy_week == 4:  # Descarga
            if wt in RECOVERY_ONLY: sc += 15
            if wt in HIGH_INTENSITY: sc -= 15
        # ACWR
        if acwr < 0.8 and wt in {"long_z2","fat_burn_long","z2_pyramid"}: sc += 6
        if acwr > 1.3 and wt in RECOVERY_ONLY: sc += 10
        # Z4 déficit
        if needs_z4z5 and not high_intensity_3d and not squash_z4z5_48h:
            if wt in HIGH_INTENSITY: sc += 10
        elif not needs_z4z5 and wt in HIGH_INTENSITY:
            sc -= 5

        # E. Especificidad squash (0-10)
        ds_sq = _days_since_squash()
        if ds_sq >= 3 and wt in {"squash_cancha","squash_conditioning"}: sc += 8
        if ds_sq == 0 and wt == "strength_preventive": sc += 6
        if ds_sq == 1 and wt == "squash_technical": sc += 5

        # F. Rotación Semanal Científica — Pérdida de Grasa (FatOx / FatMax)
        # Cada día estimula un pilar metabólico distinto para evitar mesetas y optimizar lipólisis:
        if weekday == 0:  # LUNES: Activación Mitocondrial & Cadencia FatMax
            if wt == "z2_pyramid": sc += 16
            elif wt == "easy_z2": sc += 10
        elif weekday == 1:  # MARTES: Vaciado Glucogénico & Aceleración Lipídica (EPOC)
            if wt in {"tempo_escalonado", "progression_run"}: sc += 16
            elif wt == "fat_burn_hiit": sc += 12
        elif weekday == 2:  # MIÉRCOLES: Oxidación Lipídica Pura Z1 (cero cortisol, 70% grasa)
            if wt == "fat_burn_walk": sc += 18
            elif wt == "recovery": sc += 12
            elif wt == "strength_preventive": sc += 8
        elif weekday == 3:  # JUEVES: Preservación Muscular & Circuito Metabólico
            if wt in {"circuit_metabolic", "strength_preventive"}: sc += 16
            elif wt == "easy_z2": sc += 8
        elif weekday == 4:  # VIERNES: Split Negativo Cúspide FatMax
            if wt == "z2_negative_split": sc += 16
            elif wt in {"strides_neuromuscular", "easy_z2"}: sc += 10
        elif weekday == 5:  # SÁBADO: Tirada Larga Quema Grasa (Carnot Lipídico)
            if wt in {"fat_burn_long", "long_z2"}: sc += 18
            elif wt in {"squash_cancha", "squash_technical"}: sc += 10
        elif weekday == 6:  # DOMINGO: Restauración Parasimpática & Disipación de Cortisol
            if wt in {"mobility_stretch", "yoga_recovery"}: sc += 18
            elif wt in {"fat_burn_walk", "recovery"}: sc += 14
            elif wt in {"squash_cancha", "squash_technical"}: sc += 8

        return round(sc, 1)


    # Semaphore labels
    if semaphore == "RED":
        semaphore_label = "🔴 ROJO — Solo Recuperación"
        semaphore_desc  = "Múltiples indicadores de estrés fisiológico. El cuerpo necesita recuperar, no entrenar."
    elif semaphore == "YELLOW":
        semaphore_label = "🟡 AMARILLO — Z2 Controlado"
        semaphore_desc  = "Sistema en recuperación parcial. Solo trabajo aeróbico suave, sin intensidad."
    else:
        semaphore_label = "🟢 VERDE — Puede entrenar"
        semaphore_desc  = (
            "Sistema recuperado. "
            + ("Déficit Z4-Z5 → priorizar intensidad. " if needs_z4z5 else "")
            + ("Déficit Z1-Z2 → priorizar volumen. "    if needs_z2   else "")
        )

    # ── Biblioteca de workouts ───────────────────────────
    z_arr = z  # alias
    WO = {
        "recovery": {
            "name": "Recuperación Activa Z1",
            "emoji": "🌿",
            "warmup_min": 0, "main_min": 20, "cooldown_min": 0, "total_min": 20,
            "zone_target": 1,
            "hr_range": f"{z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm",
            "steps": [
                f"① 20 min caminata activa. FC: {z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm.",
                "② Ritmo cómodo, respiración nasal. Si tienes que abrir la boca, lento.",
                "③ Opcional: estiramientos 10 min post caminata.",
            ],
            "description": f"Caminata 20 min. FC: {z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm. Sin esfuerzo.",
            "garmin_type": "easy", "work_sec": 1200, "reps": 1, "rest_sec": 0,
        },
        "mobility_stretch": {
            "name": "Movilidad y Estiramientos — Recuperación Total",
            "emoji": "🧘",
            "warmup_min": 0, "main_min": 30, "cooldown_min": 0, "total_min": 30,
            "zone_target": 1,
            "hr_range": f"< {z_arr[0]['bpm_high']} bpm",
            "steps": [
                "① 10 min — movilidad articular dinámica: círculos de tobillo, rodilla, cadera, hombros.",
                "② 10 min — estiramientos activos de cadena posterior: isquios, glúteo, psoas, pantorrillas.",
                "③ 5 min — respiración diafragmática: 4 seg inhala · 4 mantén · 6 exhala. ×10 ciclos.",
                "④ 5 min — foam roller o masaje manual en zonas de tensión acumulada.",
                f"⑤ No subir FC > {z_arr[0]['bpm_high']} bpm en ningún momento.",
            ],
            "description": "Sesión de movilidad 30 min. Sin impacto, sin carga cardiovascular. Recuperación pasiva total.",
            "garmin_type": "yoga", "work_sec": 1800, "reps": 1, "rest_sec": 0,
        },
        "rebuild_base": {
            "name": f"Base Z2 — {min(3+max(0,5-days_since_run//7),5)}×(3'+2')",
            "emoji": "🏗️",
            "warmup_min": 5, "main_min": dur_base, "cooldown_min": 5,
            "total_min": dur_base + 10,
            "zone_target": 2,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 5 min — caminata rápida. FC: {z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm.",
                f"② TRABAJO {dur_base} min — alternar: 3 min trote + 2 min caminata.",
                f"   FC objetivo trote: {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm.",
                f"   Si FC > {z_arr[1]['bpm_high']} bpm → caminar de inmediato.",
                "③ ENFRIAMIENTO 5 min — caminata suave hasta FC < 110 bpm.",
            ],
            "description": f"Calent 5' → {dur_base}' trote/caminata Z2 → Enfr 5'. Total: {dur_base+10} min.",
            "garmin_type": "fartlek", "work_sec": 180, "reps": 4, "rest_sec": 120,
            "progression": "Sem2: 4×(4'/1') | Sem3: trote continuo 20' Z2 | Sem4: 25' continuo",
        },
        "easy_z2": {
            "name": f"Trote Continuo Z2 — {dur_base} min",
            "emoji": "🏃",
            "warmup_min": 5, "main_min": dur_base, "cooldown_min": 5,
            "total_min": dur_base + 10,
            "zone_target": 2,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 5 min — caminata rápida hasta {z_arr[0]['bpm_high']} bpm.",
                f"② TRABAJO {dur_base} min — trote continuo Z2.",
                f"   FC objetivo: {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm TODO el tiempo.",
                f"   Si FC > {z_arr[1]['bpm_high']} → bajar ritmo 30 seg, retomar.",
                "③ ENFRIAMIENTO 5 min — caminata hasta FC < 110 bpm.",
            ],
            "description": f"Calent 5' → trote Z2 {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']}bpm {dur_base}' → Enfr 5'.",
            "garmin_type": "easy", "work_sec": dur_base * 60, "reps": 1, "rest_sec": 0,
        },
        "long_z2": {
            "name": f"Tirada Larga Z2 — {min(dur_base+20, 60)} min",
            "emoji": "🛤️",
            "warmup_min": 8, "main_min": min(dur_base+20, 55), "cooldown_min": 7,
            "total_min": min(dur_base+35, 70),
            "zone_target": 2,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 8 min — caminata + trote suave. FC < {z_arr[0]['bpm_high']} bpm.",
                f"② TIRADA LARGA {min(dur_base+20,55)} min — trote continuo Z2.",
                f"   FC objetivo estricto: {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm.",
                "   Si FC sube → caminar hasta recuperar. Meta: mantener Z2 sin cortarla.",
                f"③ HIDRATACIÓN: 150-200 ml agua cada 20 min. Temperatura en Popayán (1760m).",
                "④ ENFRIAMIENTO 7 min — caminata muy suave hasta FC < 100 bpm.",
                "   Este estímulo largo es clave para oxidación de grasa y resistencia aeróbica.",
            ],
            "description": f"8'calent → {min(dur_base+20,55)}'Z2 continuo → 7'enfr. Tirada larga de resistencia aeróbica. Jeukendrup 2002.",
            "garmin_type": "easy", "work_sec": min(dur_base+20,55)*60, "reps": 1, "rest_sec": 0,
        },
        "progression_run": {
            "name": f"Carrera Progresiva Z2→Z3 — {dur_base+5} min",
            "emoji": "📈",
            "warmup_min": 5, "main_min": dur_base+5, "cooldown_min": 5,
            "total_min": dur_base+15,
            "zone_target": 3,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[2]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 5 min — caminata activa.",
                f"② FASE 1 — {dur_base//2} min trote suave Z2: {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm.",
                f"③ FASE 2 — {dur_base//3} min trote moderado Z2 alto: {z_arr[1]['bpm_high']-5}–{z_arr[2]['bpm_low']+5} bpm.",
                f"④ FASE 3 — 5 min ritmo Z3: {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm.",
                "   Cada fase más rápida que la anterior. Fluido y controlado.",
                "⑤ ENFRIAMIENTO 5 min — caminata hasta FC < 110 bpm.",
            ],
            "description": f"Progresión Z2→Z3: {dur_base//2}'+{dur_base//3}'+5' → el cuerpo aprende a sostener ritmo con fatiga.",
            "garmin_type": "fartlek", "work_sec": dur_base*60, "reps": 1, "rest_sec": 0,
        },
        "z3_tempo_intro": {
            "name": "Tempo Z3 — 2×5 min",
            "emoji": "🔥",
            "warmup_min": 8, "main_min": 16, "cooldown_min": 6, "total_min": 30,
            "zone_target": 3,
            "hr_range": f"{z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 8 min — trote suave Z2 ({z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm).",
                f"② BLOQUE 1: 5 min Z3 → FC: {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm.",
                f"③ RECUPERACIÓN 3 min — trote suave Z2.",
                f"④ BLOQUE 2: 5 min Z3 → FC: {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm.",
                "⑤ RECUPERACIÓN 3 min — trote suave.",
                "⑥ ENFRIAMIENTO 6 min — caminata hasta FC < 110 bpm.",
            ],
            "description": f"8'Z2 → 2×(5'Z3 {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']}bpm/3'Z2) → 6'enfr. 30 min.",
            "garmin_type": "interval", "work_sec": 300, "reps": 2, "rest_sec": 180,
        },
        "z3_tempo_continuo": {
            "name": "Tempo Continuo Z3 — 25 min",
            "emoji": "⚙️",
            "warmup_min": 10, "main_min": 25, "cooldown_min": 8, "total_min": 43,
            "zone_target": 3,
            "hr_range": f"{z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 10 min — trote progresivo Z1→Z2.",
                f"② TEMPO 25 min continuo. FC: {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm.",
                "   Ritmo cómodo-difícil: puedes hablar solo frases cortas.",
                f"   Si FC > {z_arr[2]['bpm_high']} por más de 90 seg → bajar 10-15 seg/km.",
                "   Esta zona eleva el umbral de lactato de forma eficiente.",
                "③ ENFRIAMIENTO 8 min — caminata progresiva hasta FC < 100 bpm.",
            ],
            "description": f"10'calent → 25'tempo Z3 continuo {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']}bpm → 8'enfr. 43 min.",
            "garmin_type": "interval", "work_sec": 1500, "reps": 1, "rest_sec": 0,
        },
        "strides_neuromuscular": {
            "name": f"Z2 + Strides Neuromusculares — {dur_base+8} min",
            "emoji": "⚡",
            "warmup_min": 5, "main_min": dur_base, "cooldown_min": 8, "total_min": dur_base+13,
            "zone_target": 2,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm + strides",
            "steps": [
                f"① CALENTAMIENTO 5 min — caminata activa.",
                f"② TROTE Z2 {dur_base} min — {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm continuo.",
                "③ Al finalizar el trote: 6 × STRIDES de 20 segundos.",
                "   Cada stride: acelera gradualmente hasta sentirte rápido (no sprint máximo).",
                "   Recuperación 60 seg caminando entre strides.",
                "④ Los strides mejoran economía de carrera y activan fibras rápidas sin fatigarte.",
                "⑤ ENFRIAMIENTO 3 min — caminata suave.",
            ],
            "description": f"Z2 {dur_base}' → 6 strides 20seg → mejora economía de carrera sin carga adicional.",
            "garmin_type": "fartlek", "work_sec": 20, "reps": 6, "rest_sec": 60,
        },
        "fartlek": {
            "name": f"Fartlek Variable — {dur_base+10} min",
            "emoji": "🎲",
            "warmup_min": 8, "main_min": dur_base+5, "cooldown_min": 7, "total_min": dur_base+20,
            "zone_target": 4,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 8 min — trote suave Z2.",
                f"② FARTLEK {dur_base+5} min — mezcla libre de ritmos:",
                f"   · Trote base Z2: {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm (mayoría del tiempo).",
                f"   · Cada 4-6 min: 60-90 seg a ritmo fuerte Z3-Z4 ({z_arr[2]['bpm_low']}–{z_arr[3]['bpm_high']} bpm).",
                "   · Los cambios de ritmo son por sensación, no cronometrados.",
                "   · 4-6 aceleraciones en total. Recuperar completamente entre ellas.",
                f"③ ENFRIAMIENTO 7 min — caminata progresiva.",
                "   El fartlek simula las variaciones del squash y mejora tolerancia al cambio de intensidad.",
            ],
            "description": f"8'calent → {dur_base+5}' fartlek libre Z2/Z3/Z4 → 7'enfr. Variedad y estimulo neuromuscular.",
            "garmin_type": "fartlek", "work_sec": 90, "reps": 5, "rest_sec": 240,
        },
        "squash_conditioning": {
            "name": "Acondicionamiento Específico Squash — 35 min",
            "emoji": "🎾",
            "warmup_min": 5, "main_min": 25, "cooldown_min": 5, "total_min": 35,
            "zone_target": 3,
            "hr_range": f"{z_arr[2]['bpm_low']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 5 min — movilidad articular + saltos suaves.",
                "② GHOSTING 10 min — mueve los pies a las 4 esquinas de cancha imaginaria.",
                "   Patrón: centro → esquina → centro → siguiente esquina. Ritmo constante.",
                "③ LATERALES Y DIAGONALES 8 min — desplazamientos explosivos cortos.",
                f"   FC objetivo: {z_arr[2]['bpm_low']}–{z_arr[3]['bpm_high']} bpm.",
                "④ FLEXIONES REMATE + SPRINT 7 min — imita el gesto de remate con sprint de 5 m.",
                "   3 repeticiones × 4 series. Recuperación 45 seg entre series.",
                "⑤ ENFRIAMIENTO 5 min — estiramientos específicos de squash.",
                "   Cuádriceps, isquios, hombro dominante, muñeca, tobillo.",
            ],
            "description": "35 min de condicionamiento específico squash: ghosting + laterales + gestos de remate.",
            "garmin_type": "hiit", "work_sec": 300, "reps": 3, "rest_sec": 45,
        },
        "squash_cancha": {
            "name": "Sesión de Squash en Cancha",
            "emoji": "🏸",
            "warmup_min": 8, "main_min": 45, "cooldown_min": 7, "total_min": 60,
            "zone_target": 3,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[3]['bpm_high']} bpm (variable)",
            "steps": [
                f"① CALENTAMIENTO 8 min — trote suave + movilidad hombro/tobillo/cadera.",
                "② PRÁCTICA TÉCNICA 15 min — drives paralelos, voleas, drop shots lentos.",
                "   Sin presión de tiempo. Foco en posición de cuerpo y seguimiento de raqueta.",
                "③ GHOSTING CONDICIONADO 10 min — patrones T-esquinas a ritmo controlado.",
                f"   FC objetivo: {z_arr[1]['bpm_low']}–{z_arr[2]['bpm_high']} bpm. Recuperar entre series.",
                "④ PARTIDO O RALLIES 20 min — juego con control de intensidad.",
                f"   FC máx permitida hoy: {z_arr[2]['bpm_high']} bpm (semáforo controla si ir a Z4).",
                "   Pausa activa si FC supera el techo: caminata 60 seg, retomar.",
                "⑤ ENFRIAMIENTO 7 min — estiramientos específicos de squash.",
                "   Hombro dominante, muñeca, isquios, tobillo, gemelos.",
                "   Registro post-sesión: Garmin detectará FC máx, duración y Training Effect.",
            ],
            "description": "Sesión real de squash en cancha: técnica + ghosting + juego. FC variable Z2-Z3 con picos controlados.",
            "garmin_type": "other", "work_sec": 2700, "reps": 1, "rest_sec": 0,
            "coach_note": "Esta sesión cuenta como estímulo técnico-táctico y aeróbico mixto. "
                          "Si la FC promedio final supera Z3, el sistema lo registrará como sesión Z3-Z4.",
        },
        "strength_preventive": {
            "name": "Fuerza Preventiva — Core y Cadena Cinética — 30 min",
            "emoji": "🏋️",
            "warmup_min": 5, "main_min": 22, "cooldown_min": 3, "total_min": 30,
            "zone_target": 2,
            "hr_range": f"< {z_arr[1]['bpm_low'] + 5} bpm (Z2 máx)",
            "steps": [
                "① ACTIVACIÓN 5 min — puente glúteo 2×15, clamshell 2×12 por lado.",
                "② CORE ANTIROTACIÓN 8 min:",
                "   · Plancha frontal 3×30 seg · Plancha lateral 3×20 seg por lado.",
                "   · Bird-dog 3×10 por lado. · Dead bug 3×10.",
                "③ CADENA CINÉTICA POSTERIOR 7 min:",
                "   · Sentadilla goblet 3×12. · Peso muerto a una pierna 3×10 por lado.",
                "   · Hip thrust 3×15.",
                "④ ESTABILIZADORES TOBILLO-RODILLA 7 min:",
                "   · Equilibrio monopodal 3×30 seg por lado.",
                "   · Elevaciones de talón 3×20. · Step-ups laterales 3×12.",
                "⑤ ENFRIAMIENTO 3 min — estiramientos isquios y gemelos.",
                "   Sin impacto articular. Ideal en días con lesión menor activa.",
            ],
            "description": "30 min de fuerza preventiva: core + cadena posterior + estabilizadores. Sin impacto.",
            "garmin_type": "strength_training", "work_sec": 30, "reps": 3, "rest_sec": 30,
        },
        "fat_burn_long": {
            "name": f"Tirada Larga Quema Grasa Z1-Z2 — {min(dur_base+25, 75)} min",
            "emoji": "🔥",
            "warmup_min": 5, "main_min": min(dur_base+20, 70), "cooldown_min": 5,
            "total_min": min(dur_base+30, 80), "zone_target": 1,
            "hr_range": f"{z_arr[0]['bpm_low']}–{z_arr[1]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 5 min — caminata activa hasta {z_arr[0]['bpm_high']} bpm.",
                f"② TIRADA LARGA {min(dur_base+20,70)} min — trote muy suave o caminata rápida.",
                f"   FC estricta: {z_arr[0]['bpm_low']}–{z_arr[1]['bpm_high']} bpm. NO subir más.",
                "   A esta intensidad el cuerpo quema ~60% grasa como combustible primario.",
                "③ HIDRATACIÓN: solo agua. Sin carbohidratos durante la sesión.",
                "   Esto maximiza la señal de movilización de grasa. Jeukendrup 2002.",
                "④ ENFRIAMIENTO 5 min — caminata hasta FC < 90 bpm.",
            ],
            "description": f"Tirada larga Z1-Z2 {min(dur_base+20,70)} min. Máxima oxidación de grasa. Jeukendrup 2002.",
            "garmin_type": "easy", "work_sec": min(dur_base+20,70)*60, "reps": 1, "rest_sec": 0,
        },
        "fat_burn_hiit": {
            "name": "HIIT Quema Grasa — 8×(30s/30s)",
            "emoji": "⚡🔥",
            "warmup_min": 10, "main_min": 18, "cooldown_min": 7, "total_min": 35,
            "zone_target": 4, "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 10 min — trote Z2 progresivo.",
                "② HIIT 8 × (30s sprint fuerte / 30s recuperación suave):",
                f"   · Sprint: esfuerzo 8-9/10. FC esperada: {z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm.",
                f"   · Recuperación: trote suave. FC < {z_arr[1]['bpm_high']} bpm.",
                "③ El efecto EPOC eleva tu metabolismo 24-48h post-sesión. Boutcher 2011.",
                "④ ENFRIAMIENTO 7 min — caminata hasta FC < 100 bpm.",
            ],
            "description": "10'calent → 8×(30s sprint/30s recup) → 7'enfr. EPOC activo 24-48h.",
            "garmin_type": "hiit", "work_sec": 30, "reps": 8, "rest_sec": 30,
        },
        "circuit_metabolic": {
            "name": "Circuito Metabólico — Fuerza + Cardio 35 min",
            "emoji": "🔄🔥",
            "warmup_min": 5, "main_min": 27, "cooldown_min": 3, "total_min": 35,
            "zone_target": 3, "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[2]['bpm_high']} bpm",
            "steps": [
                "① ACTIVACIÓN 5 min — saltos suaves + movilidad.",
                "② CIRCUITO 3 rondas (45s trabajo / 15s pausa):",
                "   Sentadilla salto · Flexiones · Burpee · Plancha 30s",
                "   Zancadas saltadas · Mountain climber · Step-up rápido · Dead bug",
                f"   FC objetivo: {z_arr[1]['bpm_low']}–{z_arr[2]['bpm_high']} bpm.",
                "③ Recuperación 60s entre rondas.",
                "④ ENFRIAMIENTO 3 min. Preserva músculo en déficit calórico. Bryner 1999.",
            ],
            "description": "35 min circuito fuerza+cardio. Alto gasto calórico. Preserva músculo.",
            "garmin_type": "hiit", "work_sec": 45, "reps": 12, "rest_sec": 15,
        },
        "z2_pyramid": {
            "name": f"Pirámide Z2 — {dur_base+5} min variación de cadencia",
            "emoji": "🔺",
            "warmup_min": 5, "main_min": dur_base+5, "cooldown_min": 5,
            "total_min": dur_base+15, "zone_target": 2,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 5 min — caminata activa.",
                f"② PIRÁMIDE {dur_base+5} min con variación de cadencia (mismo bpm Z2):",
                f"   · 10 min: cadencia normal. FC {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_low']+8} bpm.",
                "   · 5 min: +5-10 pasos/min. FC igual. Activa más fibras.",
                f"   · {max(dur_base-10,8)} min: cadencia normal.",
                "   · 5 min: cadencia alta de nuevo.",
                "③ ENFRIAMIENTO 5 min. Lucia 2000.",
            ],
            "description": f"Z2 {dur_base+5} min con variación de cadencia. Más fibras activas, más gasto calórico.",
            "garmin_type": "easy", "work_sec": (dur_base+5)*60, "reps": 1, "rest_sec": 0,
        },
        "tempo_escalonado": {
            "name": "Tempo Escalonado Z2-Z3 — 4×5 min",
            "emoji": "🪜",
            "warmup_min": 8, "main_min": 22, "cooldown_min": 7, "total_min": 37,
            "zone_target": 3, "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[2]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 8 min — trote Z2 suave.",
                f"② 5 min Z2 ({z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm)",
                f"③ 5 min Z3 ({z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm)",
                f"④ 5 min Z2 ({z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm)",
                f"⑤ 5 min Z3 ({z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm)",
                "⑥ Sin parar entre bloques. Transición suave de ritmo.",
                "⑦ ENFRIAMIENTO 7 min. Seiler 2010.",
            ],
            "description": "8'calent → 4×5'(Z2-Z3 alternados) → 7'enfr. Mejora zona de transición aeróbica.",
            "garmin_type": "interval", "work_sec": 300, "reps": 4, "rest_sec": 0,
        },
        "squash_technical": {
            "name": "Técnica de Squash — Práctica sin fatiga 40 min",
            "emoji": "🎯",
            "warmup_min": 5, "main_min": 30, "cooldown_min": 5, "total_min": 40,
            "zone_target": 2, "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[2]['bpm_low']} bpm",
            "steps": [
                "① CALENTAMIENTO 5 min — movilidad muñeca, hombro, cadera.",
                "② TÉCNICA 30 min sin presión:",
                "   · 10 min: drives paralelos. Foco en punto de impacto.",
                "   · 8 min: drops cortos desde la T.",
                "   · 7 min: bolos largos atrás.",
                "   · 5 min: patrones tácticos (drive → bolo → drop).",
                "   REGLA: si FC > Z3 → parar y recuperar. Objetivo: técnica, no cardio.",
                "③ ENFRIAMIENTO 5 min — estiramientos específicos.",
            ],
            "description": "40 min de práctica técnica de squash sin carga cardiovascular alta.",
            "garmin_type": "other", "work_sec": 1800, "reps": 1, "rest_sec": 0,
        },
        "mindful_recovery": {
            "name": "Recuperación Consciente — Respiración y Activación 25 min",
            "emoji": "🌬️",
            "warmup_min": 0, "main_min": 25, "cooldown_min": 0, "total_min": 25,
            "zone_target": 1, "hr_range": "< 100 bpm",
            "steps": [
                "① 5 min — Caminata muy suave. FC < 90 bpm.",
                "② 10 min — Respiración diafragmática 4-4-6:",
                "   4 seg inhala · 4 retén · 6 exhala. Solo abdomen sube. ×10 ciclos.",
                "③ 5 min — Rotaciones articulares suaves: cuello, hombros, caderas.",
                "④ 5 min — Estiramientos 30s: cuádriceps, isquios, pecho.",
                "   Activa el nervio vago y reduce cortisol. Porges 2011.",
            ],
            "description": "25 min recuperación consciente: respiración vagal + movilidad. FC < 100 bpm.",
            "garmin_type": "yoga", "work_sec": 1500, "reps": 1, "rest_sec": 0,
        },
        "intervals_400m": {
            "name": "Intervalos Velocidad — 8×400m Z4",
            "emoji": "🏟️",
            "warmup_min": 12, "main_min": 24, "cooldown_min": 6, "total_min": 42,
            "zone_target": 4,
            "hr_range": f"{z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 12 min — trote progresivo Z1→Z2→Z3.",
                f"② 8 × 400m en Z4: FC {z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm.",
                "   Ritmo: esfuerzo 7-8/10. Constante en todos los repetidos.",
                f"③ RECUPERACIÓN entre series: 90 seg trote Z1 ({z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm).",
                "④ ENFRIAMIENTO 6 min — caminata hasta FC < 100 bpm.",
                "   Los 400m mejoran economía de carrera y velocidad de zancada. Barnes 2014.",
            ],
            "description": f"12'calent → 8×(400m Z4/{z_arr[3]['bpm_low']}-{z_arr[3]['bpm_high']}bpm/90seg) → 6'enfr.",
            "garmin_type": "hiit", "work_sec": 120, "reps": 8, "rest_sec": 90,
        },
        "intervals_800m": {
            "name": "Intervalos Distancia — 6×800m Z4",
            "emoji": "🏃‍♂️",
            "warmup_min": 12, "main_min": 30, "cooldown_min": 6, "total_min": 48,
            "zone_target": 4,
            "hr_range": f"{z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 12 min — trote progresivo.",
                f"② 6 × 800m en Z4: FC {z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm.",
                "   Ritmo uniforme en todos los repetidos. No salir demasiado rápido.",
                f"③ RECUPERACIÓN: 2 min trote Z1 entre series.",
                "④ ENFRIAMIENTO 6 min.",
                "   Protocolo clásico de pista para VO2max. Daniels 2005.",
            ],
            "description": f"12'calent → 6×(800m Z4/2'recup) → 6'enfr. 48 min total.",
            "garmin_type": "hiit", "work_sec": 240, "reps": 6, "rest_sec": 120,
        },
        "cruise_intervals": {
            "name": "Cruise Intervals — 3×10min Umbral de Lactato",
            "emoji": "🚢",
            "warmup_min": 10, "main_min": 36, "cooldown_min": 7, "total_min": 53,
            "zone_target": 3,
            "hr_range": f"{z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 10 min — trote Z2 progresivo.",
                f"② 3 × 10 min en umbral Z3: FC {z_arr[2]['bpm_low']}–{z_arr[2]['bpm_high']} bpm.",
                "   Ritmo cómodo-difícil: puedes hablar solo frases cortas.",
                "③ RECUPERACIÓN: 3 min trote suave Z2 entre bloques.",
                "④ ENFRIAMIENTO 7 min.",
                "   Diferente al tempo continuo: las pausas permiten mantener el ritmo. Daniels 2005.",
            ],
            "description": f"10'calent → 3×(10'Z3 {z_arr[2]['bpm_low']}-{z_arr[2]['bpm_high']}bpm/3'recup) → 7'enfr.",
            "garmin_type": "interval", "work_sec": 600, "reps": 3, "rest_sec": 180,
        },
        "hill_repeats": {
            "name": "Repeticiones en Cuesta — 8×30s",
            "emoji": "⛰️",
            "warmup_min": 10, "main_min": 18, "cooldown_min": 7, "total_min": 35,
            "zone_target": 4,
            "hr_range": f"{z_arr[2]['bpm_high']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 10 min — trote Z2 plano.",
                "② Encuentra una cuesta de 4-8% pendiente (colinas naturales de Popayán).",
                "③ 8 × 30 seg subiendo a esfuerzo 8/10. Zancada corta, cadencia alta.",
                "④ RECUPERACIÓN: baja caminando. ~90 seg entre subidas.",
                "⑤ ENFRIAMIENTO 7 min — caminata plana.",
                "   Desarrolla fuerza específica y potencia aeróbica. Noakes 2003.",
            ],
            "description": "10'calent → 8×(30s cuesta fuerte/90seg caminata) → 7'enfr. Fuerza + VO2max.",
            "garmin_type": "hiit", "work_sec": 30, "reps": 8, "rest_sec": 90,
        },
        "norwegian_15_15": {
            "name": "Método Noruego — 30×(15s/15s) VO2max",
            "emoji": "🇳🇴",
            "warmup_min": 10, "main_min": 20, "cooldown_min": 8, "total_min": 38,
            "zone_target": 4,
            "hr_range": f"{z_arr[3]['bpm_low']}–{z_arr[4]['bpm_low']} bpm",
            "steps": [
                "① CALENTAMIENTO 10 min — trote progresivo Z1→Z2.",
                "② 30 × (15s rápido / 15s suave):",
                f"   · Rápido: 90-95% FCmax ≈ {z_arr[4]['bpm_low']-5}–{z_arr[4]['bpm_low']+5} bpm.",
                f"   · Suave: trote Z1 ≈ {z_arr[0]['bpm_high']} bpm.",
                "   Sin parar. Fluido. Los 30 repetidos duran exactamente 15 min.",
                "③ ENFRIAMIENTO 8 min.",
                "   Acumula más tiempo cerca del VO2max que protocolos clásicos. Tjelta 2019.",
            ],
            "description": "10'calent → 30×(15s/15s al 90-95%) → 8'enfr. Método noruego.",
            "garmin_type": "hiit", "work_sec": 15, "reps": 30, "rest_sec": 15,
        },
        "z2_negative_split": {
            "name": f"Z2 Split Negativo — {dur_base+5} min progresivo",
            "emoji": "📉",
            "warmup_min": 5, "main_min": dur_base+5, "cooldown_min": 5, "total_min": dur_base+15,
            "zone_target": 2,
            "hr_range": f"{z_arr[1]['bpm_low']}–{z_arr[1]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 5 min — caminata activa.",
                f"② PRIMER TERCIO ({(dur_base+5)//3} min): trote suave borde inferior Z2.",
                f"   FC: {z_arr[1]['bpm_low']}–{z_arr[1]['bpm_low']+6} bpm. Intencionalmente lento.",
                f"③ SEGUNDO TERCIO ({(dur_base+5)//3} min): ritmo normal Z2.",
                f"   FC: {z_arr[1]['bpm_low']+5}–{z_arr[1]['bpm_high']-5} bpm.",
                f"④ ÚLTIMO TERCIO ({(dur_base+5)//3} min): borde superior Z2.",
                f"   FC: {z_arr[1]['bpm_high']-8}–{z_arr[1]['bpm_high']} bpm. Más rápido que el inicio.",
                "⑤ ENFRIAMIENTO 5 min.",
                "   Entrena la gestión del ritmo y la resistencia a la fatiga. Magill 2014.",
            ],
            "description": f"Z2 {dur_base+5}' con split negativo: cada tercio más rápido. Kiptchoge style.",
            "garmin_type": "easy", "work_sec": (dur_base+5)*60, "reps": 1, "rest_sec": 0,
        },
        "fat_burn_walk": {
            "name": f"Caminata Quema Grasa Z1 — {min(dur_base+35, 90)} min",
            "emoji": "🚶🔥",
            "warmup_min": 0, "main_min": min(dur_base+35, 90), "cooldown_min": 0,
            "total_min": min(dur_base+35, 90),
            "zone_target": 1,
            "hr_range": f"{z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm",
            "steps": [
                f"① {min(dur_base+35,90)} min de caminata continua a paso activo.",
                f"   FC estricta: {z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm. Nunca trotar.",
                "② Si la FC sube: bajar el ritmo hasta volver al rango.",
                "③ A esta intensidad el cuerpo usa hasta 70% grasa como combustible.",
                "④ Sin carbohidratos durante la sesión. Solo agua.",
                "⑤ Excelente para días con dolor articular o recuperación activa.",
                "   Impacto articular mínimo comparado con trote. Igual valor metabólico.",
            ],
            "description": f"{min(dur_base+35,90)} min caminata Z1 puro. 70% combustible grasa. Impacto articular mínimo.",
            "garmin_type": "easy", "work_sec": min(dur_base+35,90)*60, "reps": 1, "rest_sec": 0,
        },
        "squash_ghosting_hiit": {
            "name": "Ghosting HIIT — 10 series en Cancha",
            "emoji": "👻⚡",
            "warmup_min": 8, "main_min": 15, "cooldown_min": 5, "total_min": 28,
            "zone_target": 4,
            "hr_range": f"{z_arr[2]['bpm_high']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 8 min — movilidad + ghosting suave.",
                "② 10 × GHOSTING EXPLOSIVO 20 seg:",
                "   Patrón: T → esquina → T → siguiente esquina a máxima velocidad.",
                "   Recuperación: 10 seg estático entre series.",
                f"   FC esperada: {z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm.",
                "③ 2-3 min recuperación completa tras las 10 series.",
                "④ Repetir el bloque 2-3 veces según energía.",
                "⑤ ENFRIAMIENTO 5 min.",
                "   Desarrolla capacidad anaeróbica específica del squash. Girard 2011.",
            ],
            "description": "8'calent → 10×(20s ghosting explosivo/10s) → 5'enfr. Anaeróbico específico squash.",
            "garmin_type": "hiit", "work_sec": 20, "reps": 10, "rest_sec": 10,
        },
        "strength_explosive": {
            "name": "Fuerza Explosiva — Potencia para Squash 30 min",
            "emoji": "💥",
            "warmup_min": 5, "main_min": 22, "cooldown_min": 3, "total_min": 30,
            "zone_target": 3,
            "hr_range": "Variable — esfuerzo explosivo",
            "steps": [
                "① ACTIVACIÓN 5 min — saltos suaves + movilidad cadera.",
                "② BLOQUE POTENCIA (3 series × 6 repeticiones):",
                "   · Sentadilla con salto (máxima altura).",
                "   · Step-up explosivo (subir con máxima aceleración).",
                "   · Salto lateral de caja (si disponible) o zancada explosiva.",
                "   Recuperación: 90 seg completos entre series.",
                "③ BLOQUE REACTIVIDAD (3 series × 8 reps):",
                "   · Cambios de dirección en T (sprint 3m + freno + sprint opuesto).",
                "   · Saltos de skipping alto 10 seg máximo.",
                "   Recuperación: 60 seg entre series.",
                "④ ENFRIAMIENTO 3 min — estiramientos de cuádriceps y glúteo.",
                "   Mejora tiempo de reacción y velocidad de aceleración. Baker 2001.",
            ],
            "description": "30 min fuerza explosiva: sentadilla salto + cambios dirección + reactividad. Potencia squash.",
            "garmin_type": "strength_training", "work_sec": 6, "reps": 3, "rest_sec": 90,
        },
        "yoga_recovery": {
            "name": "Yoga Deportivo — Recuperación Profunda 30 min",
            "emoji": "🧘‍♂️",
            "warmup_min": 0, "main_min": 30, "cooldown_min": 0, "total_min": 30,
            "zone_target": 1,
            "hr_range": "< 90 bpm",
            "steps": [
                "① 5 min — Postura del niño (balasana). Espalda baja y cadera.",
                "② 5 min — Perro mirando abajo (adho mukha). Gemelos, isquios, hombros.",
                "③ 5 min — Guerrero I y II. Psoas, flexores de cadera.",
                "④ 5 min — Paloma (eka pada). Glúteo profundo — piriformis.",
                "⑤ 5 min — Torsión sentado. Columna, IT band.",
                "⑥ 5 min — Postura del cadáver (savasana). Respiración 4-4-6.",
                "   Reduce rigidez muscular y mejora movilidad funcional. Ross 2010.",
            ],
            "description": "30 min yoga deportivo: 6 posturas de recuperación profunda. FC < 90 bpm.",
            "garmin_type": "yoga", "work_sec": 1800, "reps": 1, "rest_sec": 0,
        },
        "vo2max_intervals": {
            "name": "Intervalos VO2max — 4×3 min Z4",
            "emoji": "⚡",
            "warmup_min": 10, "main_min": 24, "cooldown_min": 6, "total_min": 40,
            "zone_target": 4,
            "hr_range": f"{z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm",
            "steps": [
                f"① CALENTAMIENTO 10 min — trote progresivo Z1→Z2.",
                f"② INTERVALO: 3 min Z4. FC: {z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']} bpm.",
                f"③ RECUPERACIÓN: 3 min Z1 ({z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm). Trotar suave.",
                "④ Repetir ②+③ por 4 series en total (24 min).",
                "⑤ ENFRIAMIENTO 6 min — caminata hasta FC < 100 bpm.",
            ],
            "description": f"10'warmup → 4×(3'Z4 {z_arr[3]['bpm_low']}–{z_arr[3]['bpm_high']}bpm/3'Z1) → 6'enfr. 40 min.",
            "garmin_type": "hiit", "work_sec": 180, "reps": 4, "rest_sec": 180,
        },
        "vo2max_4x4": {
            "name": "Protocolo 4×4 Wisløff — VO2max",
            "emoji": "🫁",
            "warmup_min": 10, "main_min": 28, "cooldown_min": 6, "total_min": 44,
            "zone_target": 5,
            "hr_range": f"{z_arr[4]['bpm_low']}–{z_arr[4]['bpm_high']} bpm",
            "steps": [
                "① CALENTAMIENTO 10 min — trote progresivo Z1→Z2→Z3.",
                f"② INTERVALO: 4 min MUY fuerte. FC: {z_arr[4]['bpm_low']}–{z_arr[4]['bpm_high']} bpm.",
                f"③ RECUPERACIÓN: 3 min Z1 ({z_arr[0]['bpm_low']}–{z_arr[0]['bpm_high']} bpm).",
                "④ Repetir ②+③ por 4 series en total (28 min).",
                "⑤ ENFRIAMIENTO 6 min — caminata lenta hasta FC < 100 bpm.",
                "   Protocolo más efectivo para VO2max (Wisløff 2007).",
            ],
            "description": f"10'warmup → 4×(4'Z5 {z_arr[4]['bpm_low']}–{z_arr[4]['bpm_high']}bpm/3'Z1) → 6'enfr. 44 min.",
            "garmin_type": "hiit", "work_sec": 240, "reps": 4, "rest_sec": 180,
        },
    }
    # ── Evaluar todos los workouts y elegir el de mayor score ────────────
    wo_scores    = {wt: _score_wo(wt) for wt in WO.keys()}
    wo_ranking   = sorted(wo_scores.items(), key=lambda x: x[1], reverse=True)
    eligible     = [(wt, sc) for wt, sc in wo_ranking if sc > -50]
    wo_type      = eligible[0][0] if eligible else "recovery"
    wo_score_top = eligible[0][1] if eligible else 0

    green_plus.append(
        "Scoring: " + wo_type + " (" + str(int(wo_score_top)) + " pts) | Top3: " +
        ", ".join(wt + "(" + str(int(sc)) + ")" for wt, sc in wo_ranking[:3])
    )

    wo = WO.get(wo_type, WO["easy_z2"]).copy()
    wo["type_key"]        = wo_type
    wo["semaphore"]       = semaphore
    wo["semaphore_label"] = semaphore_label
    wo["semaphore_desc"]  = semaphore_desc
    wo["reasons"]         = reasons
    wo["red_flags"]       = red_flags
    wo["yellow_flags"]    = yel_flags
    wo["green_flags"]     = green_plus
    wo["scores"]          = scores
    wo["generated_at"]    = _now().isoformat()
    wo["wo_type_key"]     = wo_type   # tipo real para anti-repetición persistente
    wo["wo_score"]        = round(wo_score_top, 1)
    wo["wo_ranking_top5"] = [(wt, round(sc,1)) for wt, sc in wo_ranking[:5]]

    # ── Guardar log de workouts prescritos para anti-repetición ──────────
    # El scoring necesita saber qué tipo se prescribió ayer y anteayer.
    # Como Garmin no devuelve wo_type, lo guardamos en disco.
    try:
        import json as _json
        _wo_log_path = OUT / "workout_log.json"
        _log = []
        if _wo_log_path.exists():
            try:
                _log = _json.loads(_wo_log_path.read_text(encoding="utf-8"))
            except Exception:
                _log = []
        _today_str = _today().isoformat()
        # Evitar duplicados del mismo día
        _log = [e for e in _log if e.get("date") != _today_str]
        _log.insert(0, {"date": _today_str, "wo_type": wo_type,
                        "score": round(wo_score_top, 1)})
        _log = _log[:30]  # solo últimos 30 días
        _wo_log_path.write_text(_json.dumps(_log, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as _e:
        pass  # log no crítico

    wo["data_quality"]    = {
        "has_hrv":       hrv_week > 0,
        "has_sleep":     len(sleep_recent) > 0,
        "has_readiness": tr_score > 0,
        "has_acwr":      acwr > 0,
        "has_tlb":       bool(tlb),
        "days_since_run": days_since_run,
        "squash_48h":    squash_48h,
        "squash_z4z5_48h": squash_z4z5_48h,
        "squash_recent_evidence": squash_recent_evidence,
        "high_intensity_3d": high_intensity_3d,
        "high_training_effect_3d": high_training_effect_3d,
        "high_intensity_evidence": high_intensity_evidence,
    }
    wo["profile_snapshot"] = {
        "vo2max": vo2, "readiness": tr_score, "acwr": acwr,
        "hrv": hrv_week, "hrv_night": hrv_night,
        "sleep_h": round(avg_sleep, 1), "rhr": fc_rep,
        "status": status, "days_since_run": days_since_run,
        "aer_low_pct": round(aer_low_pct), "aer_high_pct": round(aer_high_pct),
        "squash_48h": squash_48h, "squash_z4z5_48h": squash_z4z5_48h,
    }

    wo = _enrich_workout_v21(wo, wo_type, z_arr, profile, raw, {
        "dur_base": dur_base, "tr_score": tr_score, "tr_level": tr_level,
        "hrv_week": hrv_week, "hrv_bl_lo": hrv_bl_lo, "hrv_bl_hi": hrv_bl_hi,
        "avg_sleep": avg_sleep, "avg_deep": avg_deep, "avg_rem": avg_rem,
        "acwr": acwr, "days_since_run": days_since_run,
        "high_intensity_3d": high_intensity_3d, "high_training_effect_3d": high_training_effect_3d,
        "squash_48h": squash_48h, "squash_z4z5_48h": squash_z4z5_48h,
        "rhr_elevated": rhr_elevated, "recov_warn": recov_warn,
        "injury_st": injury_st, "joint_pain": joint_pain, "muscle_pain": muscle_pain,
        "rpe_last": rpe_last, "sick": sick,
    })

    # ── VO2max projection ───────────────────────────────
    weight_delta   = profile.get("weight_kg", 85) - profile.get("target_weight_kg", 70)
    vo2_from_weight = round(weight_delta / 1.5, 1)
    training_gain, training_status_key = _vo2_projection_gain_by_status(status)
    vo2_sl = _vo2_altitude_adjusted_for_norms(vo2, profile)
    wo["vo2max_projection"] = {
        "current":            vo2,
        "current_sea_level_equivalent": vo2_sl,
        "from_training_8w":   round(vo2 + training_gain, 1),
        "training_gain_8w":   training_gain,
        "training_status_used": training_status_key,
        "from_weight_loss":   round(vo2 + vo2_from_weight, 1),
        "combined_goal":      round(vo2 + vo2_from_weight + max(1.5, training_gain - 1), 1),
        "classification":     _vo2_classify(vo2, profile),
        "classification_note": "Clasificación ajustada por altitud si altitude_m > 1000; VO2max Garmin original no se modifica.",
    }

    return wo

def _vo2_classify(vo2: float, profile: dict | None = None) -> str:
    v = _vo2_altitude_adjusted_for_norms(vo2, profile or {})
    suffix = " · ajuste altitud" if (profile or {}).get("altitude_m") and float((profile or {}).get("altitude_m") or 0) > 1000 else ""
    if v >= 55: return "Excelente (élite amateur)" + suffix
    if v >= 50: return "Muy bueno" + suffix
    if v >= 45: return "Bueno" + suffix
    if v >= 38: return "Promedio" + suffix
    return "Por debajo del promedio" + suffix


def print_workout(wo: dict):
    sep = "─" * 62
    print(f"\n{'═'*62}")
    print(f"  {wo['emoji']}  ENTRENAMIENTO ADAPTATIVO DEL DÍA")
    print(f"{'═'*62}")
    print(f"  Nombre:      {wo['name']}")
    print(f"  Duración:    {wo['total_min']} min")
    print(f"  FC objetivo: {wo['hr_range']}")
    print(f"  Zona:        Z{wo['zone_target']}")
    print(f"\n  📝 {wo['description']}")
    if wo.get("progression"):
        print(f"\n  📈 Progresión: {wo['progression']}")
    print(f"\n  🧠 Razón clínica:")
    for r in wo.get("reasons", []):
        print(f"     • {r}")
    snap = wo.get("profile_snapshot", {})
    print(f"\n  📊 Estado hoy: VO2max {snap.get('vo2max')} | "
          f"Readiness {snap.get('readiness')}/100 | "
          f"ACWR {snap.get('acwr'):.2f} | "
          f"HRV {snap.get('hrv')} | "
          f"{snap.get('days_since_run')}d sin correr")
    proj = wo.get("vo2max_projection", {})
    print(f"\n  🎯 Proyección VO2max:")
    print(f"     Actual: {proj.get('current')} ({proj.get('classification')})")
    print(f"     Con 8 sem entreno: {proj.get('from_training_8w')}")
    print(f"     Con pérdida de peso: {proj.get('from_weight_loss')}")
    print(f"     Meta combinada: {proj.get('combined_goal')}")
    print(sep)


# ═══════════════════════════════════════════════════════
# DASHBOARDS — 1 FIGURA CADA UNO
# ═══════════════════════════════════════════════════════
def _fmt_dates(ax, df_col):
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m"))
    ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=30, ha="right", fontsize=8)


def _zone_band(ax, zones):
    """Dibuja bandas de zonas FC en un eje."""
    for z in zones:
        ax.axhspan(z["bpm_low"], z["bpm_high"], alpha=0.07, color=z["color"], linewidth=0)
        ax.text(ax.get_xlim()[1] * 0.98 if ax.get_xlim()[1] != 1.0 else 0.98,
                (z["bpm_low"] + z["bpm_high"]) / 2,
                f"Z{z['zone']}", fontsize=7, color=z["color"], alpha=0.7,
                ha="right", va="center", transform=ax.get_yaxis_transform())


def dashboard_salud(raw: dict, profile: dict):
    """Dashboard 1: Salud General — 6 subplots 2×3."""
    if not HAS_PLT or not HAS_PD: return
    health = raw.get("health_daily", [])
    if not health: return

    df = pd.DataFrame(health)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle("SALUD GENERAL — ManuSquash", fontsize=15,
                 fontweight="bold", color=C["white"], y=0.98)
    fig.subplots_adjust(hspace=0.45, wspace=0.35, top=0.93, bottom=0.1)

    # ── FC en Reposo ──────────────────────────────────────
    ax = axes[0, 0]
    r = df[df["rhr"].notna()]
    if not r.empty:
        ax.fill_between(r["date"], r["rhr"], alpha=0.15, color=C["red"])
        ax.plot(r["date"], r["rhr"], "-o", color=C["red"], ms=3, lw=1.5, label="FC Reposo")
        avg = r["rhr"].mean()
        ax.axhline(avg, color=C["yellow"], ls="--", lw=1, alpha=0.7, label=f"Avg {avg:.0f}")
        ax.set_title("💓 FC en Reposo (BPM)", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("BPM", fontsize=9)
        ax.legend(fontsize=8, loc="upper right")
        ax.set_ylim(bottom=max(0, r["rhr"].min() - 10))
        _fmt_dates(ax, r["date"])
    ax.grid(True, alpha=0.3)

    # ── HRV ──────────────────────────────────────────────
    ax = axes[0, 1]
    h_col = "hrv_night"
    h_df = df[df[h_col].notna()] if h_col in df.columns else pd.DataFrame()
    if not h_df.empty:
        ax.bar(h_df["date"], h_df[h_col], color=C["purple"], alpha=0.75, width=0.8, label="HRV noche")
        avg_h = h_df[h_col].mean()
        ax.axhline(avg_h, color=C["yellow"], ls="--", lw=1, alpha=0.8, label=f"Avg {avg_h:.0f}")
        # Baseline HRV real desde profile.json o desde los campos Garmin hrv_bl_lo/hrv_bl_hi.
        hrv_lo_vals = [float(x) for x in h_df.get("hrv_bl_lo", []) if x]
        hrv_hi_vals = [float(x) for x in h_df.get("hrv_bl_hi", []) if x]
        hrv_lo = float(profile.get("hrv_baseline_low") or (sum(hrv_lo_vals[:7]) / min(7, len(hrv_lo_vals)) if hrv_lo_vals else 44))
        hrv_hi = float(profile.get("hrv_baseline_high") or (sum(hrv_hi_vals[:7]) / min(7, len(hrv_hi_vals)) if hrv_hi_vals else 57))
        ax.axhspan(hrv_lo, hrv_hi, alpha=0.1, color=C["green"], label=f"Zona balance {hrv_lo:.0f}–{hrv_hi:.0f}")
        ax.set_title("📈 HRV Nocturno (ms)", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("ms", fontsize=9)
        ax.legend(fontsize=8, loc="upper right")
        _fmt_dates(ax, h_df["date"])
    else:
        ax.text(0.5, 0.5, "HRV\nsin datos suficientes", ha="center", va="center",
                transform=ax.transAxes, fontsize=12, color=C["gray"])
        ax.set_title("📈 HRV Nocturno (ms)", fontsize=11, fontweight="bold")
    ax.grid(True, alpha=0.3)

    # ── Body Battery ─────────────────────────────────────
    ax = axes[0, 2]
    bb = df[df["bb_high"].notna()] if "bb_high" in df.columns else pd.DataFrame()
    if not bb.empty:
        ax.fill_between(bb["date"], bb["bb_low"], bb["bb_high"],
                        alpha=0.2, color=C["green"], label="Rango")
        ax.plot(bb["date"], bb["bb_high"], "-", color=C["green"], lw=1.5, label="Máx")
        ax.plot(bb["date"], bb["bb_low"],  "-", color=C["red"],   lw=1.5, label="Mín")
        ax.axhline(50, color=C["gray"], ls=":", lw=1, alpha=0.5)
        ax.set_title("🔋 Body Battery", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("Nivel (0–100)", fontsize=9)
        ax.set_ylim(0, 100)
        ax.legend(fontsize=8, loc="upper right")
        _fmt_dates(ax, bb["date"])
    else:
        ax.text(0.5, 0.5, "Body Battery\nsin datos", ha="center", va="center",
                transform=ax.transAxes, color=C["gray"])
        ax.set_title("🔋 Body Battery", fontsize=11, fontweight="bold")
    ax.grid(True, alpha=0.3)

    # ── Pasos ─────────────────────────────────────────────
    ax = axes[1, 0]
    st = df[df["steps"].notna()]
    if not st.empty:
        colors_s = [C["cyan"] if s >= 8000 else C["gray"] for s in st["steps"]]
        ax.bar(st["date"], st["steps"], color=colors_s, alpha=0.85, width=0.8)
        ax.axhline(8000, color=C["yellow"], ls="--", lw=1, alpha=0.8, label="Meta 8 K")
        avg_s = st["steps"].mean()
        ax.set_title(f"👟 Pasos Diarios  (prom {avg_s:,.0f})", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("Pasos", fontsize=9)
        ax.legend(fontsize=8, loc="upper right")
        ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v/1000:.0f}K"))
        _fmt_dates(ax, st["date"])
    ax.grid(True, alpha=0.3)

    # ── Estrés ────────────────────────────────────────────
    ax = axes[1, 1]
    ss = df[df["avg_stress"].notna()]
    if not ss.empty:
        colors_st = [C["green"] if v < 30 else C["yellow"] if v < 45 else C["red"]
                     for v in ss["avg_stress"]]
        ax.bar(ss["date"], ss["avg_stress"], color=colors_st, alpha=0.85, width=0.8)
        ax.axhline(ss["avg_stress"].mean(), color=C["white"], ls="--", lw=1, alpha=0.5,
                   label=f"Avg {ss['avg_stress'].mean():.0f}")
        ax.set_title("😰 Estrés Promedio", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("Nivel (0–100)", fontsize=9)
        ax.set_ylim(0, 80)
        ax.legend(fontsize=8, loc="upper right")
        green_p = mpatches.Patch(color=C["green"],  label="<30 bajo")
        yel_p   = mpatches.Patch(color=C["yellow"], label="30–45 mod")
        red_p   = mpatches.Patch(color=C["red"],    label=">45 alto")
        ax.legend(handles=[green_p, yel_p, red_p], fontsize=7, loc="upper right", ncol=3)
        _fmt_dates(ax, ss["date"])
    ax.grid(True, alpha=0.3)

    # ── Sueño ─────────────────────────────────────────────
    ax = axes[1, 2]
    sl = raw.get("sleep_data", [])
    if sl:
        sd = pd.DataFrame(sl)
        sd["date"] = pd.to_datetime(sd["date"])
        sd = sd.sort_values("date")
        ax.bar(sd["date"], sd["deep_pct"],  color=C["blue"],   alpha=0.85, width=0.8, label="Profundo %")
        ax.bar(sd["date"], sd["rem_pct"],   color=C["purple"], alpha=0.75, width=0.8,
               bottom=sd["deep_pct"], label="REM %")
        ax2 = ax.twinx()
        ax2.plot(sd["date"], sd["total_h"], "o-", color=C["cyan"], ms=3, lw=1.5, label="Total h")
        ax2.axhline(7, color=C["yellow"], ls="--", lw=1, alpha=0.7, label="7h")
        ax.axhline(13, color=C["blue"], ls=":", lw=1, alpha=0.55, label="Profundo 13%")
        ax.axhline(18, color=C["purple"], ls=":", lw=1, alpha=0.55, label="REM 18%")
        try:
            last_sleep = sd.iloc[-1]
            flags = []
            if float(last_sleep.get("deep_pct") or 0) < 13: flags.append("profundo bajo")
            if float(last_sleep.get("rem_pct") or 0) < 18: flags.append("REM bajo")
            if flags:
                ax.text(0.02, 0.93, " / ".join(flags), transform=ax.transAxes, fontsize=8, color=C["yellow"], va="top")
        except Exception:
            pass
        ax2.set_ylabel("Horas", fontsize=8, color=C["cyan"])
        ax2.tick_params(axis='y', labelcolor=C["cyan"], labelsize=8)
        ax2.set_ylim(0, 12)
        ax.set_title("😴 Calidad de Sueño", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("% del sueño", fontsize=9)
        ax.set_ylim(0, 60)
        lines1, l1 = ax.get_legend_handles_labels()
        lines2, l2 = ax2.get_legend_handles_labels()
        ax.legend(lines1 + lines2, l1 + l2, fontsize=7, loc="upper left")
        _fmt_dates(ax, sd["date"])
    else:
        ax.text(0.5, 0.5, "Sueño sin datos", ha="center", va="center",
                transform=ax.transAxes, color=C["gray"])
        ax.set_title("😴 Sueño", fontsize=11, fontweight="bold")
    ax.grid(True, alpha=0.3)

    chart_p = OUT / "dash_1_salud.png"
    fig.savefig(chart_p, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"  📊 dash_1_salud.png")
    _safe_show_dashboard(fig)
    plt.close(fig)


def dashboard_vo2max(raw: dict, profile: dict):
    """Dashboard 2: VO2max & Training Load — 4 subplots 2×2."""
    if not HAS_PLT or not HAS_PD: return
    acts = raw.get("activities", [])
    if not acts: return

    zones = profile.get("zones", calc_zones(193, 54))

    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle("VO2MAX & TRAINING LOAD — ManuSquash", fontsize=15,
                 fontweight="bold", color=C["white"], y=0.98)
    fig.subplots_adjust(hspace=0.4, wspace=0.35, top=0.93, bottom=0.1)

    # ── VO2max evolución mensual ──────────────────────────
    ax = axes[0, 0]
    vo2_data = [(a["date"][:7], a["vo2max"]) for a in acts if a.get("vo2max")]
    if vo2_data:
        monthly = defaultdict(list)
        for m, v in vo2_data: monthly[m].append(v)
        months = sorted(monthly.keys())
        avgs   = [sum(monthly[m]) / len(monthly[m]) for m in months]
        mxs    = [max(monthly[m]) for m in months]
        mns    = [min(monthly[m]) for m in months]
        xi = range(len(months))
        ax.fill_between(xi, mns, mxs, alpha=0.12, color=C["cyan"])
        ax.plot(xi, avgs, "-o", color=C["cyan"], lw=2.5, ms=6, zorder=5, label="Prom. mensual")
        ax.plot(xi, mxs, "--", color=C["green"], lw=1, alpha=0.6, label="Máx")
        ax.plot(xi, mns, "--", color=C["red"],   lw=1, alpha=0.6, label="Mín")
        ax.axhline(55, color=C["green"], ls=":", lw=1, alpha=0.4)
        ax.text(len(months) - 0.5, 55.3, "Meta 55", fontsize=8, color=C["green"], alpha=0.7)
        ax.axhline(profile.get("vo2max", 45), color=C["yellow"], ls="--", lw=1, alpha=0.6,
                   label=f"Actual {profile.get('vo2max')}")
        # Proyección
        proj_months = ["2026-05", "2026-06", "2026-07", "2026-08"]
        proj_vals   = [45, 47, 49, 52]
        xp = range(len(months) - 1, len(months) - 1 + len(proj_months))
        ax.plot(xp, proj_vals, "--o", color=C["purple"], lw=1.5, ms=5, alpha=0.8, label="Proyección")
        ax.set_xticks(list(xi) + list(xp))
        ax.set_xticklabels(months + proj_months, rotation=40, ha="right", fontsize=8)
        ax.set_title("🫁 Evolución VO2max (ml/kg/min)", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("ml/kg/min", fontsize=9)
        ax.legend(fontsize=7, loc="lower right", ncol=2)
    ax.grid(True, alpha=0.3)

    # ── Training Load Balance ─────────────────────────────
    ax = axes[0, 1]
    tlb = profile.get("load_balance", {})
    if tlb:
        categories = ["Aeróbico Bajo\n(Z1-Z2)", "Aeróbico Alto\n(Z3-Z4)", "Anaeróbico\n(Z5)"]
        actual  = [tlb.get("aer_low", 0),  tlb.get("aer_high", 0),  tlb.get("anaer", 0)]
        t_min   = [tlb.get("aer_low_min",0), tlb.get("aer_high_min",0), 0]
        t_max   = [tlb.get("aer_low_max",0), tlb.get("aer_high_max",0), 262]

        x = range(len(categories))
        w = 0.3
        bars_a = ax.bar([i - w for i in x], actual, width=w, color=[C["blue"], C["orange"], C["red"]],
                        alpha=0.85, label="Actual")
        ax.bar([i for i in x],      t_min,   width=w, color=C["gray"],   alpha=0.4, label="Target mín")
        ax.bar([i + w for i in x],  t_max,   width=w, color=C["gray"],   alpha=0.2, label="Target máx")

        for bar, val in zip(bars_a, actual):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 5,
                    f"{val:.0f}", ha="center", va="bottom", fontsize=8, color=C["white"])

        ax.set_xticks(list(x)); ax.set_xticklabels(categories, fontsize=9)
        ax.set_title("⚖️ Training Load Balance (mensual)", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("Carga", fontsize=9)
        ax.legend(fontsize=8, loc="upper right")
        fb = tlb.get("feedback", "")
        ax.text(0.5, 0.01, fb.replace("_", " "), ha="center", va="bottom",
                transform=ax.transAxes, fontsize=8, color=C["yellow"], style="italic")
    ax.grid(True, alpha=0.3)

    # ── TE Aeróbico por actividad ─────────────────────────
    ax = axes[1, 0]
    te_acts = [a for a in acts if a.get("te_aer", 0) and a["te_aer"] > 0]
    if te_acts:
        te_sorted = sorted(te_acts, key=lambda x: x["date"])[-20:]
        dates_te = [a["date"][:10] for a in te_sorted]
        te_vals  = [a["te_aer"] for a in te_sorted]
        colors_te = [C["blue"] if v < 2 else C["green"] if v < 3 else C["yellow"] if v < 4 else C["red"]
                     for v in te_vals]
        ax.bar(range(len(dates_te)), te_vals, color=colors_te, alpha=0.85)
        ax.axhline(3, color=C["yellow"], ls="--", lw=1, alpha=0.7, label="TE≥3 mejora")
        ax.set_xticks(range(len(dates_te)))
        ax.set_xticklabels([d[5:] for d in dates_te], rotation=40, ha="right", fontsize=7)
        ax.set_title("🎯 Training Effect Aeróbico (últimas 20)", fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel("TE Aeróbico (1–5)", fontsize=9)
        ax.legend(fontsize=8)
        patches = [mpatches.Patch(color=C["blue"],   label="1–2 Mant."),
                   mpatches.Patch(color=C["green"],  label="2–3 Mejora"),
                   mpatches.Patch(color=C["yellow"], label="3–4 Muy efi."),
                   mpatches.Patch(color=C["red"],    label="4–5 Máx")]
        ax.legend(handles=patches, fontsize=7, loc="upper left", ncol=2)
    ax.grid(True, alpha=0.3)

    # ── Calorías activas por semana ───────────────────────
    ax = axes[1, 1]
    h_daily = raw.get("health_daily", [])
    if h_daily and HAS_PD:
        dh = pd.DataFrame(h_daily)
        dh["date"] = pd.to_datetime(dh["date"])
        dh = dh.sort_values("date")
        if "cal_active" in dh.columns:
            dh["week"] = dh["date"].dt.to_period("W").apply(lambda x: str(x.start_time)[:10])
            weekly = dh.groupby("week")["cal_active"].sum().reset_index()
            ax.bar(range(len(weekly)), weekly["cal_active"], color=C["orange"], alpha=0.85)
            ax.axhline(weekly["cal_active"].mean(), color=C["yellow"], ls="--", lw=1,
                       label=f"Avg {weekly['cal_active'].mean():.0f}")
            ax.set_xticks(range(len(weekly)))
            ax.set_xticklabels(weekly["week"].str[5:], rotation=40, ha="right", fontsize=7)
            ax.set_title("🔥 Calorías Activas Semanales", fontsize=11, fontweight="bold", pad=8)
            ax.set_ylabel("kcal", fontsize=9)
            ax.legend(fontsize=8)
    ax.grid(True, alpha=0.3)

    chart_p = OUT / "dash_2_vo2max.png"
    fig.savefig(chart_p, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"  📊 dash_2_vo2max.png")
    _safe_show_dashboard(fig)
    plt.close(fig)


def dashboard_running(raw: dict, profile: dict):
    """Dashboard 3: Running Performance — 4 subplots 2×2."""
    if not HAS_PLT or not HAS_PD: return
    acts  = raw.get("activities", [])
    runs  = [a for a in acts if ("running" in str(a.get("type","")).lower()
                                  or str(a.get("type","")).lower() in ("run","jog","virtual_run"))
             and a.get("dist_km", 0) > 1]
    if len(runs) < 3:
        print("  ⚠️  Dashboard running requiere ≥ 3 runs.")
        return

    zones = profile.get("zones", calc_zones(193, 54))
    rs    = sorted(runs, key=lambda x: x["date"])

    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle("RUNNING PERFORMANCE — ManuSquash", fontsize=15,
                 fontweight="bold", color=C["white"], y=0.98)
    fig.subplots_adjust(hspace=0.4, wspace=0.35, top=0.93, bottom=0.1)

    xi     = range(len(rs))
    labels = [r["date"][:10][5:] for r in rs]
    paces  = [r["dur_min"] / r["dist_km"] if r["dist_km"] > 0 else 0 for r in rs]
    avg_hr = [r.get("avg_hr") or 0 for r in rs]
    max_hr = [r.get("max_hr") or 0 for r in rs]
    dists  = [r["dist_km"] for r in rs]

    # ── Pace con tendencia ────────────────────────────────
    ax = axes[0, 0]
    ax.plot(xi, paces, "-o", color=C["cyan"], ms=5, lw=2, label="Pace", zorder=5)
    if HAS_NP and len(paces) >= 3:
        z_p = np.polyfit(xi, paces, 1)
        ax.plot(xi, np.poly1d(z_p)(xi), "--", color=C["yellow"], lw=1.5,
                alpha=0.7, label=f"Tendencia {'+' if z_p[0] > 0 else ''}{z_p[0]*len(paces):.1f}")
    ax.invert_yaxis()
    ax.set_xticks(list(xi)); ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_title("⏱️ Pace (min/km) — menor = más rápido", fontsize=11, fontweight="bold", pad=8)
    ax.set_ylabel("min/km", fontsize=9)
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.3)

    # ── FC con bandas de zona ─────────────────────────────
    ax = axes[0, 1]
    for z in zones:
        ax.axhspan(z["bpm_low"], z["bpm_high"], alpha=0.07, color=z["color"])
    ax.plot(xi, avg_hr, "-o", color=C["cyan"], ms=5, lw=2, label="FC prom", zorder=5)
    ax.plot(xi, max_hr, "-s", color=C["red"],  ms=4, lw=1.5, alpha=0.7, label="FC máx")
    # Etiquetas de zona en el eje Y
    ax2 = ax.twinx()
    ax2.set_ylim(ax.get_ylim())
    ax2.set_yticks([(z["bpm_low"] + z["bpm_high"]) / 2 for z in zones])
    ax2.set_yticklabels([f"Z{z['zone']}" for z in zones], fontsize=8)
    ax2.tick_params(length=0)
    for tick, z in zip(ax2.yaxis.get_ticklabels(), zones):
        tick.set_color(z["color"])
    ax.set_xticks(list(xi)); ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_title("❤️ FC en Runs + Zonas Karvonen", fontsize=11, fontweight="bold", pad=8)
    ax.set_ylabel("BPM", fontsize=9)
    ax.legend(fontsize=8, loc="upper left")
    ax.grid(True, alpha=0.3)

    # ── Distancia ─────────────────────────────────────────
    ax = axes[1, 0]
    ax.bar(xi, dists, color=[C["green"] if d >= 5 else C["blue"] for d in dists], alpha=0.85)
    ax.set_xticks(list(xi)); ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_title("📏 Distancia (km)", fontsize=11, fontweight="bold", pad=8)
    ax.set_ylabel("km", fontsize=9)
    for i, d in enumerate(dists):
        ax.text(i, d + 0.1, f"{d:.1f}", ha="center", fontsize=7, color=C["white"])
    ax.grid(True, alpha=0.3)

    # ── Eficiencia cardíaca (scatter pace vs FC) ──────────
    ax = axes[1, 1]
    colors_eff = range(len(paces))
    sc = ax.scatter(paces, avg_hr, c=colors_eff, cmap="cool", s=70,
                    edgecolors=C["white"], linewidth=0.5, zorder=5)
    for z in zones:
        ax.axhline(z["bpm_high"], color=z["color"], ls=":", lw=0.8, alpha=0.5)
        ax.text(max(paces) + 0.05, z["bpm_high"], f"Z{z['zone']}", fontsize=7,
                color=z["color"], va="center")
    cbar = plt.colorbar(sc, ax=ax, fraction=0.04, pad=0.02)
    cbar.set_label("más reciente →", fontsize=7, color=C["gray"])
    cbar.ax.tick_params(labelsize=7, colors=C["gray"])
    ax.set_title("🎯 Eficiencia Cardíaca (pace vs FC)", fontsize=11, fontweight="bold", pad=8)
    ax.set_xlabel("Pace (min/km)", fontsize=9)
    ax.set_ylabel("FC Promedio (BPM)", fontsize=9)
    ax.grid(True, alpha=0.3)

    chart_p = OUT / "dash_3_running.png"
    fig.savefig(chart_p, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"  📊 dash_3_running.png")
    _safe_show_dashboard(fig)
    plt.close(fig)


def dashboard_zonas(profile: dict):
    """Dashboard 4: Zonas FC — figura limpia y legible."""
    if not HAS_PLT: return

    zones = profile.get("zones", calc_zones(193, 54))
    fc_max = profile.get("fc_max", 193)
    fc_rep = profile.get("fc_reposo", 54)
    fcr    = fc_max - fc_rep

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle(f"ZONAS FC (Karvonen)  |  FCmáx {fc_max}  FCrp {fc_rep}  FCR {fcr}",
                 fontsize=14, fontweight="bold", color=C["white"], y=0.98)
    fig.subplots_adjust(wspace=0.35, top=0.90, bottom=0.12, left=0.08, right=0.95)

    # Barras horizontales
    ax = axes[0]
    descriptions = [
        "Quema grasa, recuperación activa",
        "Base aeróbica, 80% del volumen",
        "Umbral aeróbico, tempo",
        "Umbral anaeróbico, intervals",
        "VO2max, protocol 4×4",
    ]
    for i, z in enumerate(zones):
        w  = z["bpm_high"] - z["bpm_low"]
        bar = ax.barh(i, w, left=z["bpm_low"], color=z["color"],
                     alpha=0.8, height=0.65, edgecolor="#21262d", linewidth=1.5)
        ax.text(z["bpm_low"] + w / 2, i,
                f"Z{z['zone']}  {z['name']}\n{z['bpm_low']}–{z['bpm_high']} bpm",
                ha="center", va="center", fontsize=9, fontweight="bold", color="white")
        ax.text(z["bpm_high"] + 2, i, descriptions[i], va="center", fontsize=8, color=C["gray"])

    ax.set_xlabel("BPM", fontsize=10)
    ax.set_xlim(zones[0]["bpm_low"] - 15, fc_max + 70)
    ax.set_yticks([])
    ax.axvline(fc_rep, color=C["gray"], ls=":", alpha=0.6)
    ax.text(fc_rep, -0.5, f"Reposo\n{fc_rep}", ha="center", fontsize=8, color=C["gray"])
    ax.set_title("Distribución de Zonas FC", fontsize=11, fontweight="bold", pad=8)
    ax.grid(True, alpha=0.3, axis='x')

    # Donut 80/20
    ax = axes[1]
    ax.set_aspect("equal")
    wedge_data = [
        ("Z1-Z2\n(80%)", 80, C["blue"]),
        ("Z4-Z5\n(20%)", 20, C["red"]),
    ]
    sizes  = [w[1] for w in wedge_data]
    colors = [w[2] for w in wedge_data]
    wedges, texts, autotexts = ax.pie(
        sizes, labels=[w[0] for w in wedge_data],
        autopct="%1.0f%%", colors=colors,
        startangle=90, pctdistance=0.75,
        wedgeprops={"edgecolor": "#0d1117", "linewidth": 3},
        textprops={"fontsize": 11, "color": C["white"], "fontweight": "bold"}
    )
    for at in autotexts:
        at.set_fontsize(12); at.set_color("white"); at.set_fontweight("bold")
    centre = plt.Circle((0, 0), 0.52, fc="#0d1117")
    ax.add_artist(centre)
    ax.text(0, 0.1, "MODELO", ha="center", va="center", fontsize=9, color=C["gray"])
    ax.text(0, -0.1, "POLARIZADO", ha="center", va="center", fontsize=9, color=C["gray"])
    ax.set_title("Distribución ideal para VO2max", fontsize=11, fontweight="bold", pad=8)

    note = ("Evitar Z3 (zona gris)  |  "
            "El squash cubre Z4-Z5 naturalmente  |  "
            "El running debe ser 80% Z2")
    fig.text(0.5, 0.02, note, ha="center", fontsize=8, color=C["gray"], style="italic")

    chart_p = OUT / "dash_4_zonas.png"
    fig.savefig(chart_p, dpi=150, bbox_inches="tight", facecolor="#0d1117")
    print(f"  📊 dash_4_zonas.png")
    _safe_show_dashboard(fig)
    plt.close(fig)


def generate_all_dashboards(raw: dict, profile: dict):
    print(f"\n{'═'*62}\n  📊  GENERANDO DASHBOARDS\n{'═'*62}\n")
    dashboard_salud(raw, profile)
    dashboard_vo2max(raw, profile)
    dashboard_running(raw, profile)
    dashboard_zonas(profile)
    print(f"\n  ✅ 4 dashboards guardados en {OUT}/")


# ═══════════════════════════════════════════════════════
# ANÁLISIS + RECOMENDACIONES
# ═══════════════════════════════════════════════════════
def analyze_and_recommend(raw: dict, profile: dict) -> dict:
    print(f"\n{'═'*62}\n  📋  ANÁLISIS DE CONDICIÓN FÍSICA\n{'═'*62}")
    findings = []; recs = []
    h     = raw.get("health_daily", [])
    acts  = raw.get("activities", [])
    zones = profile.get("zones", calc_zones(193, 54))
    tlb   = profile.get("load_balance", {})

    # Training status
    status = profile.get("training_status", "")
    if "DETRAINING" in status:
        findings.append("🔴 DETRAINING — estás perdiendo condición activamente")
        recs.append("Retomar inmediatamente con protocolo 'rebuild_base'. "
                    "No saltar a intensidad alta. 3-4 sesiones/semana Z1-Z2.")
    elif "PRODUCTIVE" in status:
        findings.append("🟢 PRODUCTIVE — el entrenamiento da resultados")
    elif "UNPRODUCTIVE" in status:
        findings.append("🟡 UNPRODUCTIVE — entrenas sin progreso")
        recs.append("Revisar distribución: demasiado Z3 (zona gris). Modelo 80/20.")

    # Load balance
    aer_h = tlb.get("aer_high", 0); t_h = tlb.get("aer_high_min", 282)
    if aer_h < t_h * 0.5:
        findings.append(f"🔴 Carga aeróbica alta: {aer_h:.0f} (target ≥ {t_h}). Déficit severo Z4-Z5.")
        recs.append(f"Añadir 2 sesiones/sem de intervalos Z4 "
                    f"({zones[3]['bpm_low']}–{zones[3]['bpm_high']} bpm). "
                    "Protocolo 4×4 min Wisløff: el más efectivo para VO2max.")

    # VO2max
    vo2 = profile.get("vo2max", 45)
    if vo2 < 45:
        findings.append(f"⚠️  VO2max {vo2} — por debajo del potencial")
        recs.append("2 sesiones de intervalos Z4-Z5/semana + 80% volumen en Z2.")
    elif vo2 >= 50:
        findings.append(f"✅ VO2max {vo2} — buen nivel para squash amateur")

    # HRV
    hrv = profile.get("hrv_weekly", 43)
    if hrv < 40:
        findings.append(f"🔴 HRV bajo ({hrv} ms). Sobrecarga o estrés.")
        recs.append("Solo Z1-Z2 hasta HRV ≥ 44. Sueño 8h, hidratación, sin alcohol.")
    elif hrv < 44:
        findings.append(f"⚠️  HRV moderado ({hrv} ms). Monitorear.")

    # FC reposo
    rhr_vals = [h2["rhr"] for h2 in h if h2.get("rhr")]
    if rhr_vals:
        avg_rhr = sum(rhr_vals) / len(rhr_vals)
        if avg_rhr < 55:
            findings.append(f"✅ FC reposo excelente ({avg_rhr:.0f} bpm). Buena base aeróbica.")
        else:
            findings.append(f"⚠️  FC reposo {avg_rhr:.0f} bpm. Reducir con más volumen Z2.")
        rhr_range = max(rhr_vals) - min(rhr_vals)
        if rhr_range > 10:
            findings.append(f"⚠️  Variabilidad FC reposo alta ({rhr_range} bpm). Posible fatiga acumulada.")

    # Sueño
    sleep = raw.get("sleep_data", [])
    if sleep:
        avg_sl = sum(s["total_h"] for s in sleep) / len(sleep)
        avg_dp = sum(s["deep_pct"] for s in sleep) / len(sleep)
        avg_rm = sum(s["rem_pct"]  for s in sleep) / len(sleep)
        if avg_sl < 7:
            findings.append(f"🔴 Sueño insuficiente: {avg_sl:.1f}h/noche (mínimo 7h)")
            recs.append("Sueño: factor #1 de mejora de VO2max. Meta 7.5–8h. Horario fijo.")
        if avg_dp < 13:
            findings.append(f"⚠️  Sueño profundo bajo ({avg_dp:.0f}%). Ideal ≥15%.")
        if avg_rm < 18:
            findings.append(f"⚠️  REM bajo ({avg_rm:.0f}%). Ideal ≥20%. Afecta recuperación.")

    # Pasos
    st = [h2["steps"] for h2 in h if h2.get("steps")]
    if st:
        avg_st = sum(st) / len(st)
        if avg_st < 6000:
            findings.append(f"🔴 Pasos muy bajos: {avg_st:,.0f}/día")
            recs.append("Meta: 8,000 pasos/día. Caminar 30 min después de almorzar.")
        else:
            findings.append(f"✅ Pasos: {avg_st:,.0f}/día")

    # Composición corporal
    bmi = profile.get("bmi", 29.4)
    w_delta = profile["weight_kg"] - profile["target_weight_kg"]
    vo2_gain = round(w_delta / 1.5, 1)
    findings.append(f"⚖️  IMC {bmi} | Perder {w_delta}kg → VO2max +{vo2_gain} ml/kg/min")
    recs.append(f"Déficit 400–500 kcal/día. Proteína {profile['weight_kg']*1.8:.0f}g/día. "
                f"Sin reducir carbos antes de entrenar.")

    # Altitud
    findings.append(f"🏔️  Popayán {profile.get('altitude_m',1760)}m — ventaja eritropoyética natural.")

    # Squash
    squash = [a for a in acts if a.get("type") == "other" and "squash" in a.get("name","").lower()]
    if len(squash) < 2:
        recs.append("Registrar squash como actividad específica en Garmin para tracking de TE.")

    print(f"\n  HALLAZGOS ({len(findings)}):")
    for f_item in findings:
        print(f"    {f_item}")
    print(f"\n  RECOMENDACIONES ({len(recs)}):")
    for i, r in enumerate(recs, 1):
        print(f"    {i}. {r}")

    result = {"findings": findings, "recommendations": recs,
              "generated_at": _now().isoformat()}
    with open(OUT / "analysis.json", "w") as f:
        json.dump(result, f, indent=2, default=str)
    return result


# ═══════════════════════════════════════════════════════
# EXPORTACIÓN PARA APP WEB + GOOGLE DRIVE
# ═══════════════════════════════════════════════════════

def _build_coach_context(profile: dict, raw: dict, workout: dict, advanced_performance: dict | None = None) -> dict:
    """
    Contexto compacto para el Coach integrado de la app.
    No depende de Claude/OpenAI: la app puede responder localmente con estos datos.
    """
    ap = advanced_performance or {}
    zones = profile.get("zones", calc_zones(int(profile.get("fc_max", 193) or 193), int(profile.get("fc_reposo", 54) or 54)))
    recent_activities = []
    for a in sorted(raw.get("activities", []) or [], key=lambda x: x.get("date", ""), reverse=True)[:8]:
        recent_activities.append({
            "date": str(a.get("date", ""))[:10],
            "name": a.get("name") or a.get("type") or "Actividad",
            "type": a.get("type"),
            "dur_min": a.get("dur_min"),
            "dist_km": a.get("dist_km"),
            "avg_hr": a.get("avg_hr"),
            "max_hr": a.get("max_hr"),
            "training_load": a.get("training_load"),
            "te_aer": a.get("te_aer"),
            "te_ana": a.get("te_ana"),
        })
    fa = profile.get("fitness_age", {}) or {}
    ctx = {
        "generated_at": _now().isoformat(),
        "profile": {
            "name": profile.get("name"),
            "weight_kg": profile.get("weight_kg"),
            "target_weight_kg": profile.get("target_weight_kg"),
            "bmi": profile.get("bmi"),
            "vo2max": profile.get("vo2max"),
            "vo2max_peak": profile.get("vo2max_peak"),
            "fc_max": profile.get("fc_max"),
            "fc_reposo": profile.get("fc_reposo"),
            "hrv_weekly": profile.get("hrv_weekly"),
            "training_status": profile.get("training_status"),
            "training_readiness": profile.get("training_readiness"),
            "acwr": profile.get("acwr"),
            "acute_load": profile.get("acute_load"),
            "chronic_load": profile.get("chronic_load"),
        },
        "fitness_age": {
            "chronological_age": fa.get("chronological_age") or profile.get("chronological_age"),
            "fitness_age": fa.get("fitness_age_app"),
            "recovery_age": fa.get("recovery_age"),
            "aerobic_age": fa.get("aerobic_age"),
            "metabolic_age": fa.get("metabolic_age"),
            "age_delta": fa.get("age_delta"),
            "classification": fa.get("classification"),
        },
        "today": {
            "training_readiness": raw.get("training_readiness"),
            "training_status": raw.get("training_status"),
            "training_load_balance": raw.get("training_load_balance"),
        },
        "zones": zones,
        "adaptive_workout": {
            "name": workout.get("name"),
            "type_key": workout.get("type_key"),
            "semaphore": workout.get("semaphore"),
            "semaphore_label": workout.get("semaphore_label"),
            "semaphore_desc": workout.get("semaphore_desc"),
            "hr_range": workout.get("hr_range"),
            "zone_target": workout.get("zone_target"),
            "total_min": workout.get("total_min"),
            "steps": workout.get("steps", []),
            "precise_segments": workout.get("precise_segments", []),
            "daily_recommendations": workout.get("daily_recommendations", []),
            "red_flags": workout.get("red_flags", []),
            "yellow_flags": workout.get("yellow_flags", []),
            "green_flags": workout.get("green_flags", []),
        },
        "advanced": {
            "data_quality": ap.get("data_quality", {}),
            "decision_map": ap.get("decision_map", {}),
            "hydration": ap.get("hydration", {}),
            "passport": ap.get("passport", {}),
            "age_analysis": ap.get("age_analysis", {}),
            "z2_quality": ap.get("z2_quality", {}),
            "gray_zone": ap.get("gray_zone", {}),
            "adaptation_score": ap.get("adaptation_score", {}),
            "weekly_coach_report": ap.get("weekly_coach_report", {}),
            "activity_zone_review": ap.get("activity_zone_review", {}),
            "plateau_detector": ap.get("plateau_detector", {}),
            "fat_oxidation": ap.get("fat_oxidation", {}),
            "dynamic_energy": ap.get("dynamic_energy", {}),
            "chart_status": ap.get("chart_status", {}),
            "data_gaps": ap.get("data_gaps", []),
        },
        "recent_activities": recent_activities,
    }
    return ctx


def _multiweek_periodization_v56(raw: dict, profile: dict, zones: list[dict]) -> dict:
    """
    Periodización multi-semana: detecta el bloque del mesociclo actual
    y proyecta las próximas 4 semanas.

    Modelo: ciclo ondulante de 4 semanas (Issurin 2010, Bompa 2009)
    ─────────────────────────────────────────────────────────────────
    Semana 1 — Acumulación:  volumen +10%, intensidad baja (Z1-Z2)
    Semana 2 — Construcción: volumen base, inicio Z3 controlado
    Semana 3 — Intensificación: volumen -5%, Z4 permitido 2 sesiones
    Semana 4 — Descarga:     volumen -30%, solo Z1-Z2, recuperación

    El sistema detecta en qué semana del ciclo estás usando:
    - Carga rolling de las últimas 4 semanas (28 días)
    - Número de sesiones Z4-Z5 por semana histórico
    - Tendencia de ACWR semana a semana
    - HRV trend: mejora (adaptación) vs caída (fatiga acumulada)

    Referencia: Issurin 2010 Sports Med · Bompa & Haff 2009 Periodization
    """
    now  = _now()
    acts = raw.get("activities", []) or []
    health = raw.get("health_daily", []) or []

    # ── Construir perfil de 4 semanas hacia atrás ────────────
    def week_window(week_ago: int) -> tuple[int, int]:
        """Retorna (day_start, day_end) para semana N semanas atrás."""
        end   = week_ago * 7
        start = end + 7
        return start, end  # start > end porque "age" es días hacia atrás

    weeks = []
    for w in range(4):  # w=0 → esta semana, w=3 → hace 4 semanas
        day_start, day_end = week_window(w)
        w_acts = []
        for a in acts:
            try:
                age = (now - datetime.strptime(str(a.get("date",""))[:10], "%Y-%m-%d")).days
                if day_end <= age < day_start:
                    w_acts.append(a)
            except Exception:
                pass

        total_min   = sum(float(a.get("dur_min") or 0) for a in w_acts)
        total_load  = sum(float(a.get("training_load") or 0) for a in w_acts)
        z4_sessions = 0
        z12_min     = 0
        z45_min     = 0

        for a in w_acts:
            ev  = _activity_zone_evidence(a, zones)
            dur = float(a.get("dur_min") or 0)
            if ev.get("reached_z4") or ev.get("reached_z5"):
                z4_sessions += 1
                z45_min += dur
            else:
                z12_min += dur

        ratio_z12 = (z12_min / max(total_min, 1)) * 100
        weeks.append({
            "week_ago":   w,
            "label":      f"Sem -{w}" if w > 0 else "Esta sem",
            "total_min":  round(total_min, 0),
            "total_load": round(total_load, 1),
            "z4_sessions": z4_sessions,
            "z12_min":    round(z12_min, 0),
            "z45_min":    round(z45_min, 0),
            "ratio_z12":  round(ratio_z12, 1),
            "n_activities": len(w_acts),
        })

    # ── HRV trend de las últimas 4 semanas ───────────────────
    hrv_by_week = []
    for w in range(4):
        day_start, day_end = week_window(w)
        hrv_vals = []
        for h in health:
            try:
                age = (now.date() - datetime.strptime(str(h.get("date",""))[:10], "%Y-%m-%d").date()).days
                if day_end <= age < day_start:
                    v = h.get("hrv_night") or h.get("hrv_week")
                    if v: hrv_vals.append(float(v))
            except Exception:
                pass
        hrv_by_week.append(round(sum(hrv_vals)/len(hrv_vals), 1) if hrv_vals else None)

    hrv_trend = "stable"
    if all(v is not None for v in hrv_by_week[:2]):
        diff = hrv_by_week[0] - hrv_by_week[1]  # esta semana vs semana pasada
        if diff > 3:
            hrv_trend = "improving"    # adaptación positiva
        elif diff < -3:
            hrv_trend = "declining"   # fatiga acumulada

    # ── Detectar posición en el ciclo de 4 semanas ───────────
    # Algoritmo: comparar carga de las 4 semanas
    loads = [w["total_load"] for w in weeks]
    z4s   = [w["z4_sessions"] for w in weeks]

    # Semana actual (w=0) vs semana pasada (w=1)
    current_load  = loads[0]
    prev_load     = loads[1] if len(loads) > 1 else current_load
    load_trend    = "increasing" if current_load > prev_load * 1.05 else \
                    "decreasing" if current_load < prev_load * 0.85 else "stable"

    # Detectar si esta semana es de descarga (carga muy baja)
    max_load_4w = max(loads) if loads else 1
    is_unload   = current_load < max_load_4w * 0.65 and max_load_4w > 50

    # Determinar semana del ciclo
    # Usamos la tendencia de carga de las 4 semanas para inferir posición
    if is_unload:
        cycle_week = 4
        cycle_name = "Descarga"
        cycle_emoji = "🔄"
        cycle_desc = "Semana de descarga. Volumen reducido, recuperación activa. El cuerpo absorbe las adaptaciones de las semanas anteriores."
        intensity_cap = 0       # No intensidad esta semana
        volume_mod = -30        # -30% volumen
    elif len(loads) >= 2 and loads[0] > loads[1] * 1.08 and z4s[0] >= 1:
        cycle_week = 3
        cycle_name = "Intensificación"
        cycle_emoji = "⚡"
        cycle_desc = "Semana de intensificación. Carga alta con estímulos Z4 controlados. Máximo 2 sesiones de calidad."
        intensity_cap = 2
        volume_mod = -5
    elif len(loads) >= 3 and loads[2] < loads[1] < loads[0]:
        cycle_week = 3  # progresión consistente → intensificación
        cycle_name = "Intensificación"
        cycle_emoji = "⚡"
        cycle_desc = "Carga progresando 3 semanas seguidas. Semana de intensificación: añadir 1-2 estímulos de calidad."
        intensity_cap = 2
        volume_mod = 0
    elif current_load <= prev_load and z4s[0] == 0:
        cycle_week = 1
        cycle_name = "Acumulación"
        cycle_emoji = "📦"
        cycle_desc = "Semana de acumulación. Foco en volumen Z1-Z2. Construir base aeróbica sin intensidad prematura."
        intensity_cap = 1
        volume_mod = 10
    else:
        cycle_week = 2
        cycle_name = "Construcción"
        cycle_emoji = "🏗️"
        cycle_desc = "Semana de construcción. Volumen base con inicio de Z3 controlado. Base para la semana de intensificación."
        intensity_cap = 1
        volume_mod = 5

    # ── Ajustar restricciones según HRV trend ────────────────
    hrv_note = ""
    if hrv_trend == "declining" and cycle_week >= 3:
        # HRV cayendo en semana de intensificación → bajar una semana
        cycle_week = max(cycle_week - 1, 1)
        cycle_name = "Construcción (ajustada)"
        cycle_emoji = "⚠️🏗️"
        intensity_cap = 1
        hrv_note = "HRV en caída → ciclo ajustado: reducir intensidad hasta recuperar baseline."
    elif hrv_trend == "improving" and cycle_week == 4:
        hrv_note = "HRV mejorando en descarga → señal de adaptación positiva. Siguiente semana: acumulación."

    # ── Proyección de las próximas 4 semanas ─────────────────
    next_weeks = []
    cycle_sequence = ["Acumulación", "Construcción", "Intensificación", "Descarga"]
    cycle_emojis   = ["📦", "🏗️", "⚡", "🔄"]
    cycle_caps     = [1, 1, 2, 0]
    cycle_mods     = [+10, +5, -5, -30]

    for fw in range(4):
        next_pos = (cycle_week + fw) % 4  # 0-indexed
        next_weeks.append({
            "week_ahead": fw + 1,
            "label":      f"Sem +{fw+1}",
            "name":       cycle_sequence[next_pos],
            "emoji":      cycle_emojis[next_pos],
            "z4_cap":     cycle_caps[next_pos],
            "volume_mod": cycle_mods[next_pos],
            "guidance":   (
                "Volumen suave Z1-Z2, sin intensidad. Construir base."
                if next_pos == 0 else
                "Añadir Z3 controlado 1×/semana. Volumen moderado."
                if next_pos == 1 else
                "2 sesiones de calidad Z4. Reducir volumen total."
                if next_pos == 2 else
                "Solo recuperación activa Z1. Absorber adaptaciones."
            ),
        })

    # ── Datos por semana para el gráfico ─────────────────────
    weeks_chart = []
    for w in reversed(weeks):  # cronológico: más antigua primero
        label = f"Sem -{w['week_ago']}" if w["week_ago"] > 0 else "Esta"
        weeks_chart.append({
            "label":      label,
            "total_min":  w["total_min"],
            "total_load": w["total_load"],
            "z4_sessions": w["z4_sessions"],
            "ratio_z12":  w["ratio_z12"],
        })

    return {
        # Semana actual
        "cycle_week":      cycle_week,
        "cycle_name":      cycle_name,
        "cycle_emoji":     cycle_emoji,
        "cycle_desc":      cycle_desc,
        "intensity_cap":   intensity_cap,
        "volume_mod_pct":  volume_mod,

        # Tendencias
        "hrv_trend":       hrv_trend,
        "hrv_by_week":     hrv_by_week,
        "hrv_note":        hrv_note,
        "load_trend":      load_trend,
        "is_unload_week":  is_unload,

        # Historial 4 semanas
        "weeks_history":   weeks_chart,
        "weeks_detail":    weeks,

        # Proyección próximas 4 semanas
        "next_weeks":      next_weeks,

        # Datos actuales resumidos
        "current_week":    weeks[0] if weeks else {},
        "prev_week":       weeks[1] if len(weeks) > 1 else {},

        "reference": "Issurin 2010 Sports Med · Bompa & Haff 2009 Periodization · Seiler 2010",
        "available": len(acts) >= 14,   # mínimo 2 semanas de datos
    }


def _weekly_periodization_v55(raw: dict, profile: dict, zones: list[dict]) -> dict:
    """
    Analiza la semana actual e impone reglas de periodización para prevenir
    sobreentrenamiento y garantizar distribución de cargas óptima.

    Reglas de periodización (referencia: Seiler 2010, Issurin 2010):
    - Máximo 2 sesiones Z4-Z5 por semana de 7 días móviles
    - Mínimo 48h entre sesiones de alta intensidad
    - Al menos 1 día de recuperación activa por semana
    - Ratio 80/20: Z1-Z2 >= 80% del volumen total
    - No más de 3 días consecutivos con cualquier tipo de entreno
    """
    from collections import defaultdict
    now    = _now()
    acts   = raw.get("activities", []) or []
    health = raw.get("health_daily", []) or []

    # Ventana de 7 días móviles
    week_acts = []
    for a in acts:
        try:
            age = (now - datetime.strptime(str(a.get("date",""))[:10], "%Y-%m-%d")).days
            if age <= 7:
                week_acts.append((age, a))
        except Exception:
            pass

    # Contar sesiones Z4-Z5 en los últimos 7 días
    z4_sessions_7d = 0
    z5_sessions_7d = 0
    consecutive_days = 0
    recovery_days_7d = 0
    total_min_7d = 0
    z12_min_7d = 0
    z45_min_7d = 0
    intensity_days = []  # días (0-7) con sesión intensa

    for age, a in week_acts:
        ev = _activity_zone_evidence(a, zones)
        dur = float(a.get("dur_min") or 0)
        total_min_7d += dur
        if ev.get("reached_z5"):
            z5_sessions_7d += 1
            z4_sessions_7d += 1
            z45_min_7d += dur
            intensity_days.append(age)
        elif ev.get("reached_z4"):
            z4_sessions_7d += 1
            z45_min_7d += dur
            intensity_days.append(age)
        else:
            z12_min_7d += dur

    # Días consecutivos de entrenamiento (mirando los últimos 4 días)
    trained_days = set(age for age, _ in week_acts if age <= 4)
    for d in range(4):
        if d in trained_days:
            consecutive_days += 1
        else:
            break

    # Recovery days (días sin actividad registrada en los últimos 7)
    active_days = set(age for age, _ in week_acts)
    recovery_days_7d = sum(1 for d in range(7) if d not in active_days)

    # Ratio Z1-Z2 vs total
    ratio_z12 = (z12_min_7d / max(total_min_7d, 1)) * 100

    # ── Restricciones y alertas de periodización ──────────────
    restrictions = []
    recommendations = []
    block_intensity = False
    reduce_volume = False

    if z4_sessions_7d >= 2:
        block_intensity = True
        restrictions.append(
            f"Límite semanal Z4-Z5 alcanzado ({z4_sessions_7d}/2 sesiones). "
            "No más intensidad hasta la próxima semana. Seiler 2010."
        )

    if z4_sessions_7d == 1 and 0 in intensity_days:
        # Sesión intensa ayer → respetar 48h
        restrictions.append(
            "Sesión intensa ayer. Respetar 48h de recuperación antes del próximo Z4-Z5."
        )
        block_intensity = True

    if consecutive_days >= 3:
        recommendations.append(
            f"Llevas {consecutive_days} días consecutivos entrenando. "
            "Considera un día de recuperación activa hoy o mañana."
        )

    if recovery_days_7d == 0:
        restrictions.append(
            "Sin ningún día de recuperación en 7 días. "
            "El sistema de reparación muscular requiere al menos 1 día/semana. Issurin 2010."
        )
        reduce_volume = True

    if ratio_z12 < 75 and total_min_7d > 60:
        recommendations.append(
            f"Ratio Z1-Z2 esta semana: {ratio_z12:.0f}% (objetivo ≥80%). "
            "Equilibrar con más volumen suave. Seiler 2010."
        )

    # ── Bloque actual de periodización ───────────────────────
    if z4_sessions_7d >= 2 or recovery_days_7d == 0:
        block = "descarga"
        block_msg = "Semana de descarga forzada por reglas de periodización."
    elif z4_sessions_7d == 1:
        block = "consolidacion"
        block_msg = "Una sesión de calidad completada. Consolidar con volumen Z2."
    elif total_min_7d < 60:
        block = "construccion"
        block_msg = "Volumen bajo esta semana. Buen momento para construir base."
    else:
        block = "mantenimiento"
        block_msg = "Semana equilibrada. Mantener consistencia."

    return {
        "block": block,
        "block_msg": block_msg,
        "z4_sessions_7d": z4_sessions_7d,
        "z5_sessions_7d": z5_sessions_7d,
        "z4_sessions_max": 2,
        "block_intensity": block_intensity,
        "reduce_volume": reduce_volume,
        "consecutive_days": consecutive_days,
        "recovery_days_7d": recovery_days_7d,
        "total_min_7d": round(total_min_7d, 0),
        "z12_min_7d": round(z12_min_7d, 0),
        "z45_min_7d": round(z45_min_7d, 0),
        "ratio_z12_pct": round(ratio_z12, 1),
        "restrictions": restrictions,
        "recommendations": recommendations,
        "reference": "Seiler 2010 Int J Sports Physiol Perform · Issurin 2010 Sports Med",
    }


def export_for_web(raw: dict, profile: dict, analysis: dict, workout: dict) -> dict:
    """
    Exporta TODO en garmin_data/web_export.json y opcionalmente
    lo sube a Google Drive para acceso automático desde cualquier dispositivo.
    """
    acts = raw.get("activities", [])
    monthly_vo2 = defaultdict(list)
    for a in acts:
        if a.get("vo2max"):
            monthly_vo2[a["date"][:7]].append(a["vo2max"])
    vo2_timeline = [{"month": m, "avg": round(sum(v)/len(v), 1),
                     "max": max(v), "min": min(v)}
                    for m, v in sorted(monthly_vo2.items())]

    route_summaries = _build_route_summaries(raw)
    pdf_export = _export_workout_pdf_safe(workout, profile, raw)
    fat_oxidation = _build_fat_oxidation(raw, profile)
    dynamic_energy = _dynamic_energy_plan(raw, profile, workout)
    advanced_performance = _build_advanced_performance(raw, profile, workout, route_summaries)
    advanced_performance["fat_oxidation"] = fat_oxidation
    advanced_performance["dynamic_energy"] = dynamic_energy
    profile_public = _public_profile_v47(profile)

    web = {
        "meta": {"exported_at": _now().isoformat(),
                 "api_url": os.getenv("PUBLIC_API_URL", ""),
                 "device": profile.get("device"),
                 "version": "5.0-science-security-hierarchy",
                 "app_version": "ManuSquash v5.0 · Science Layer + Secure UX Hierarchy",
                 "schema_version": "2026-06-04-science-layer-v5.0",
                 "source": os.getenv("DEPLOY_NAME", "ManuSquash server"),
                 "privacy": "gps_incluido" if _export_gps_enabled() else "sin_gps_ni_ids",
                 "fields_available": advanced_performance.get("fields_available", {}),
                 "data_quality_score": advanced_performance.get("data_quality", {}).get("score")},
        "profile": profile_public,
        "fitness_age":         profile.get("fitness_age", {}),
        "performance_metrics": profile.get("performance_metrics", {}),
        "zones": profile.get("zones", []),
        "today": {
            "training_readiness": raw.get("training_readiness"),
            "training_status":    raw.get("training_status"),
            "training_load_balance": raw.get("training_load_balance"),
        },
        "health_summary": {
            "avg_rhr":    round(sum(h["rhr"] for h in raw["health_daily"] if h.get("rhr")) /
                                max(1, sum(1 for h in raw["health_daily"] if h.get("rhr"))), 1),
            "avg_steps":  round(sum(h["steps"] for h in raw["health_daily"] if h.get("steps")) /
                                max(1, sum(1 for h in raw["health_daily"] if h.get("steps")))),
            "avg_stress": round(sum(h["avg_stress"] for h in raw["health_daily"] if h.get("avg_stress")) /
                                max(1, sum(1 for h in raw["health_daily"] if h.get("avg_stress"))), 1),
        },
        "health_daily":    raw.get("health_daily", []),
        "sleep_data":      raw.get("sleep_data", []),
        "activities":      raw.get("activities", []),
        "fat_oxidation":   fat_oxidation,
        "fatmax":          fat_oxidation.get("fatmax", {}),
        "dynamic_energy":  dynamic_energy,
        "vo2max_timeline": vo2_timeline,
        "analysis":        analysis,
        "adaptive_workout": workout,
        "route_summaries":  route_summaries,
        "pdf_export":      pdf_export,
        # Series normalizadas para que la app siempre pueda renderizar graficas aunque cambie el contrato.
        "graph_series": {
            "health_daily": raw.get("health_daily", [])[-120:],
            "sleep_data": raw.get("sleep_data", [])[-120:],
            "activities": raw.get("activities", [])[:160],
            "fat_daily": fat_oxidation.get("daily_series", []),
            "fat_activities": fat_oxidation.get("activities", []),
        "fat_by_zone": fat_oxidation.get("fat_by_zone", []),
            "vo2max_timeline": vo2_timeline,
        },
        "advanced_performance": advanced_performance,
        "coach_context": _build_coach_context(profile, raw, workout, advanced_performance),
        # Alias top-level para que la app pueda mostrar las mejoras sin depender de rutas profundas.
        "age_analysis": advanced_performance.get("age_analysis", profile.get("fitness_age", {})),
        "data_quality": advanced_performance.get("data_quality", {}),
        "chart_status": advanced_performance.get("chart_status", {}),
        "data_gaps": advanced_performance.get("data_gaps", []),
        "hydration": advanced_performance.get("hydration", {}),
        "passport": advanced_performance.get("passport", {}),
        "z2_quality": advanced_performance.get("z2_quality", {}),
        "gray_zone": advanced_performance.get("gray_zone", {}),
        "adaptation_score": advanced_performance.get("adaptation_score", {}),
        "weekly_coach_report": advanced_performance.get("weekly_coach_report", {}),
        "activity_zone_review": advanced_performance.get("activity_zone_review", {}),
        "decision_history": advanced_performance.get("decision_history", {}),
        "plateau_detector": advanced_performance.get("plateau_detector", {}),
        "energy_plan": dynamic_energy,
    }
    web = _strengthen_web_contract_v44(web, raw, profile, workout, fat_oxidation, dynamic_energy, advanced_performance, vo2_timeline)
    web = _ensure_web_contract(web)
    if not _export_gps_enabled():
        web = _strip_private_fields(web)

    # ── Guardar local (escritura atómica: el servidor nunca sirve un JSON a medias) ──
    fp = OUT / "web_export.json"
    tmp = fp.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(web, f, indent=2, default=str)
    os.replace(tmp, fp)
    size_kb = fp.stat().st_size // 1024
    print(f"\n  💾 web_export.json  ({size_kb} KB)  →  {fp}")

    # ── Subir a Google Drive (opcional, DRIVE_UPLOAD=1) ─
    if os.getenv("DRIVE_UPLOAD", "0").lower() in {"1", "true", "yes"}:
        upload_to_drive(fp)

    return web


# ── Privacidad del JSON web ─────────────────────────────
# La app no usa coordenadas ni identificadores de cuenta/dispositivo, pero
# Garmin los entrega en cada actividad (el punto de inicio de una carrera
# suele ser la casa). full_extract.json los conserva; web_export.json no,
# salvo EXPORT_GPS=1.
_PRIVATE_KEYS = {"route_points", "start_point", "end_point", "garmin_scalar_fields"}
_PRIVATE_SUBSTR = ("latitude", "longitude", "owner", "userprofile", "deviceid",
                   "locationname", "manufacturer", "serial")

def _export_gps_enabled() -> bool:
    return os.getenv("EXPORT_GPS", "0").lower() in {"1", "true", "yes"}

def _strip_private_fields(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            kl = str(k).lower()
            if k in _PRIVATE_KEYS or any(s in kl for s in _PRIVATE_SUBSTR):
                continue
            out[k] = _strip_private_fields(v)
        return out
    if isinstance(obj, list):
        return [_strip_private_fields(v) for v in obj]
    return obj


def upload_to_drive(filepath: Path):
    """
    Sube web_export.json a Google Drive.
    Requiere: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

    Configuración (una sola vez):
      1. Ve a https://console.cloud.google.com/
      2. Crea un proyecto → habilita "Google Drive API"
      3. Crea credenciales OAuth 2.0 (tipo: Aplicación de escritorio)
      4. Descarga el JSON y guárdalo como garmin_data/google_credentials.json
      5. La primera vez abrirá el navegador para autorizar acceso
    """
    CREDS_FILE  = OUT / "google_credentials.json"
    TOKEN_FILE  = OUT / "google_token.json"
    DRIVE_CONFIG = OUT / "drive_config.json"

    # Sin credenciales → mostrar instrucciones y salir
    if not CREDS_FILE.exists():
        print(f"""
  ℹ️  Google Drive no configurado.

  Para subir automáticamente a Drive:
    1. Ve a: https://console.cloud.google.com/
    2. Crea proyecto → habilita "Google Drive API"
    3. Credenciales → OAuth 2.0 → App de escritorio → Descargar JSON
    4. Guarda el archivo como: {CREDS_FILE}
    5. Corre el script de nuevo → autoriza en el navegador

  Por ahora puedes subir el archivo manualmente a tu Drive:
    {filepath}
        """)
        return

    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow  import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery  import build
        from googleapiclient.http       import MediaFileUpload
    except ImportError:
        print("  ⚠️  pip install google-api-python-client google-auth-oauthlib")
        return

    SCOPES = ["https://www.googleapis.com/auth/drive.file"]

    # ── Auth ──────────────────────────────────────────
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.write_text(creds.to_json())

    service = build("drive", "v3", credentials=creds)

    # ── Carpeta en Drive ──────────────────────────────
    folder_id = None
    if DRIVE_CONFIG.exists():
        cfg = json.loads(DRIVE_CONFIG.read_text())
        folder_id = cfg.get("folder_id")

    if not folder_id:
        # Buscar o crear carpeta "ManuSquash Garmin"
        q = "name='ManuSquash Garmin' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=q, fields="files(id,name)").execute()
        folders = results.get("files", [])

        if folders:
            folder_id = folders[0]["id"]
            print(f"  📁 Carpeta existente: ManuSquash Garmin ({folder_id})")
        else:
            folder_meta = {
                "name": "ManuSquash Garmin",
                "mimeType": "application/vnd.google-apps.folder",
            }
            folder = service.files().create(body=folder_meta, fields="id").execute()
            folder_id = folder["id"]
            print(f"  📁 Carpeta creada: ManuSquash Garmin ({folder_id})")

        DRIVE_CONFIG.write_text(json.dumps({"folder_id": folder_id}))

    # ── Subir / actualizar archivo ────────────────────
    file_name = "web_export.json"
    q = f"name='{file_name}' and '{folder_id}' in parents and trashed=false"
    existing = service.files().list(q=q, fields="files(id)").execute().get("files", [])

    media = MediaFileUpload(str(filepath), mimetype="application/json", resumable=True)

    if existing:
        # Actualizar el existente (misma URL de descarga)
        file_id = existing[0]["id"]
        service.files().update(fileId=file_id, media_body=media).execute()
        print(f"  ✅ Drive actualizado — ID: {file_id}")
    else:
        # Crear nuevo
        meta = {"name": file_name, "parents": [folder_id]}
        new_file = service.files().create(body=meta, media_body=media, fields="id").execute()
        file_id = new_file["id"]
        print(f"  ✅ Drive: archivo creado — ID: {file_id}")

    # ── Guardar file_id para la app web ──────────────
    drive_info = json.loads(DRIVE_CONFIG.read_text())
    drive_info["file_id"]      = file_id
    drive_info["folder_id"]    = folder_id
    drive_info["last_upload"]  = _now().isoformat()
    # URL de descarga directa (funciona si el archivo es público o la app tiene OAuth)
    drive_info["direct_url"]   = f"https://drive.google.com/uc?export=download&id={file_id}"
    drive_info["open_url"]     = f"https://drive.google.com/file/d/{file_id}/view"
    DRIVE_CONFIG.write_text(json.dumps(drive_info, indent=2))

    print(f"  🌐 Ver en Drive:     {drive_info['open_url']}")
    print(f"\n  📱 Para la app web, haz el archivo PÚBLICO en Drive:")
    print(f"     1. Abre el archivo en Drive")
    print(f"     2. Click derecho → Compartir → Cualquier persona con el enlace")
    print(f"     3. Copia este ID en la app: {file_id}")


# ═══════════════════════════════════════════════════════
# SUBIR WORKOUT A GARMIN
# ═══════════════════════════════════════════════════════
def upload_workout_to_garmin(api: Garmin, workout: dict, profile: dict):
    """Sube el workout adaptativo del día al reloj."""
    try:
        from garminconnect.workout import (
            RunningWorkout, WorkoutSegment,
            create_warmup_step, create_interval_step,
            create_recovery_step, create_cooldown_step,
            create_repeat_group,
        )
    except ImportError:
        print("   ❌ pip install --upgrade garminconnect pydantic"); return

    name       = workout.get("name", "Adaptive Workout")
    reps       = workout.get("reps", 1)
    work_sec   = workout.get("work_sec", 1200)
    rest_sec   = workout.get("rest_sec", 0)
    warmup_sec = workout.get("warmup_min", 5) * 60
    cool_sec   = workout.get("cooldown_min", 5) * 60

    order = 1
    warmup = create_warmup_step(float(warmup_sec), step_order=order); order += 1

    if reps > 1:
        ivs = []
        for _ in range(reps):
            ivs.append(create_interval_step(float(work_sec), step_order=order)); order += 1
            if rest_sec > 0:
                ivs.append(create_recovery_step(float(rest_sec), step_order=order)); order += 1
        main_step = create_repeat_group(reps, ivs, step_order=order); order += 1
    else:
        main_step = create_interval_step(float(work_sec), step_order=order); order += 1

    cooldown = create_cooldown_step(float(cool_sec), step_order=order)
    total = warmup_sec + reps * (work_sec + rest_sec) + cool_sec

    wo_obj = RunningWorkout(
        workoutName=name,
        estimatedDurationInSecs=total,
        workoutSegments=[WorkoutSegment(
            segmentOrder=1,
            sportType={"sportTypeId": 1, "sportTypeKey": "running"},
            workoutSteps=[warmup, main_step, cooldown],
        )],
    )

    try:
        result = api.upload_running_workout(wo_obj)
        print(f"   ✅ '{name}' subido ({total//60} min)")
        if isinstance(result, dict) and result.get("workoutId"):
            wid = result["workoutId"]
            sched = input(f"   ¿Programar? (YYYY-MM-DD o Enter): ").strip()
            if sched:
                try:
                    api.schedule_workout(wid, sched)
                    print(f"   📅 Programado: {sched}")
                except Exception as e:
                    print(f"   ⚠️  {e}")
    except Exception as e:
        print(f"   ❌ {e}"); traceback.print_exc()


# ═══════════════════════════════════════════════════════
# MENÚ PRINCIPAL
# ═══════════════════════════════════════════════════════
def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║   GARMIN ADAPTIVE TRAINING SYSTEM v2.0                  ║
║   by ManuSquash | Forerunner 970 | Popayán 1760m        ║
╚══════════════════════════════════════════════════════════╝
    """)

    api = init_api()
    if not api:
        print("❌ No se pudo conectar."); return

    raw      : dict = {}
    profile  : dict = BASE_PROFILE.copy()
    analysis : dict = {}
    workout  : dict = {}

    if P_FILE.exists():
        with open(P_FILE) as f: profile = json.load(f)
    # Siempre forzar birth_date del código (evita que profile.json desactualizado pise la fecha real)
    profile["birth_date"] = BASE_PROFILE["birth_date"]

    while True:
        print(f"""
┌──────────────────────────────────────────────────────────┐
│  GARMIN ADAPTIVE TRAINING SYSTEM v2.0                   │
├──────────────────────────────────────────────────────────┤
│  1. 🔄 Extraer todos los datos                          │
│  2. 🔧 Auto-calibrar perfil y zonas FC                  │
│  3. 🧠 Generar entrenamiento adaptativo del día         │
│  4. ⬆️  Subir entrenamiento al reloj                     │
│  5. 📋 Análisis + recomendaciones                       │
│  6. 📊 Dashboards (4 gráficas separadas)                │
│  7. ❤️  Ver zonas FC                                     │
│  8. 🌐 Exportar para app web/móvil                      │
│  9. 🚀 TODO (extraer→calibrar→análisis→dash→exportar)   │
│  0. 👋 Salir                                            │
└──────────────────────────────────────────────────────────┘
        """)
        ch = input("  Opción: ").strip()

        if ch == "1":
            d = input("  ¿Cuántos días? (30/90/180/365) [90]: ").strip()
            raw = extract_all(api, max(1, min(365, int(d))) if d.isdigit() else 90)

        elif ch == "2":
            if not raw: print("  ⚠️  Primero extrae datos (1)"); continue
            profile = auto_calibrate(raw)
            print_zones(profile["zones"], profile["fc_max"], profile["fc_reposo"])

        elif ch == "3":
            if not raw: print("  ⚠️  Primero extrae datos (1)"); continue
            workout = generate_adaptive_workout(profile, raw)
            print_workout(workout)

        elif ch == "4":
            if not workout:
                print("  ⚠️  Primero genera el entrenamiento (3)"); continue
            upload_workout_to_garmin(api, workout, profile)

        elif ch == "5":
            if not raw: print("  ⚠️  Primero extrae datos (1)"); continue
            analysis = analyze_and_recommend(raw, profile)

        elif ch == "6":
            if not raw: print("  ⚠️  Primero extrae datos (1)"); continue
            generate_all_dashboards(raw, profile)

        elif ch == "7":
            z = profile.get("zones", calc_zones(profile["fc_max"], profile["fc_reposo"]))
            print_zones(z, profile["fc_max"], profile["fc_reposo"])

        elif ch == "8":
            if not raw: print("  ⚠️  Primero extrae datos (1)"); continue
            if not analysis: analysis = analyze_and_recommend(raw, profile)
            if not workout:  workout  = generate_adaptive_workout(profile, raw)
            export_for_web(raw, profile, analysis, workout)

        elif ch == "9":
            d = input("  ¿Cuántos días? (30/90/180/365) [90]: ").strip()
            raw      = extract_all(api, max(1, min(365, int(d))) if d.isdigit() else 90)
            profile  = auto_calibrate(raw)
            print_zones(profile["zones"], profile["fc_max"], profile["fc_reposo"])
            workout  = generate_adaptive_workout(profile, raw)
            print_workout(workout)
            analysis = analyze_and_recommend(raw, profile)
            generate_all_dashboards(raw, profile)
            export_for_web(raw, profile, analysis, workout)
            print("\n  ✅ ¡Completo! Revisa garmin_data/")

        elif ch == "0":
            print("\n  👋 ¡Keep smashing, ManuSquash! 🎾"); break

        else:
            print("  Opción no válida.")



def _auto_upload_workout(api: Garmin, workout: dict, zones: list = None, force: bool = False):
    """
    Sube workout con rango de FC en ppm por zona.
    Usa targetType heart.rate (tipo 4 custom) con bpm_low/bpm_high reales
    del perfil del usuario — garantiza que el reloj muestre el rango correcto.

    force=True: borra el lock del día y sube de nuevo (para generación manual
    desde la app después de sincronizar el reloj al despertar).
    """
    import json as _json

    # ── Control de duplicados ─────────────────────────────
    control_file = OUT / "last_workout_upload.json"
    today_str    = _today().isoformat()

    if control_file.exists():
        try:
            ctrl = _json.loads(control_file.read_text())
            if ctrl.get("date") == today_str:
                if force:
                    # Generación manual: borrar el lock y continuar
                    control_file.unlink()
                    print(f"   [--force-upload] Lock del día {today_str} borrado. Regenerando con métricas frescas.")
                else:
                    print(f"   Workout ya subido hoy ({today_str}). Omitiendo duplicado.")
                    return {"status": "skipped", "reason": "already_uploaded_today", "date": today_str, "control_file": str(control_file)}
        except Exception:
            pass

    # ── Parametros del workout ────────────────────────────
    name       = workout.get("name", "ManuSquash")
    reps       = workout.get("reps", 1)
    work_sec   = float(workout.get("work_sec", 1200))
    rest_sec   = float(workout.get("rest_sec", 0))
    warmup_sec = float(workout.get("warmup_min", 5)) * 60
    cool_sec   = float(workout.get("cooldown_min", 5)) * 60
    zone_num   = int(workout.get("zone_target", 2))

    # ── Obtener rango FC real de la zona ──────────────────
    bpm_low  = None
    bpm_high = None
    if zones:
        for z in zones:
            if z.get("zone") == zone_num:
                bpm_low  = z.get("bpm_low")
                bpm_high = z.get("bpm_high")
                break

    # Fallback si no hay zonas: usar porcentajes standard
    if not bpm_low or not bpm_high:
        # Zonas standard basadas en FC maxima 193 bpm / FC reposo 54 bpm
        zone_ppm = {
            1: (109, 124), 2: (124, 137), 3: (137, 151),
            4: (151, 165), 5: (165, 193)
        }
        bpm_low, bpm_high = zone_ppm.get(zone_num, (124, 151))

    today   = _today().strftime("%d/%m")
    wo_name = f"{today} {name}"
    total   = warmup_sec + reps * (work_sec + rest_sec) + cool_sec

    sport = {"sportTypeId": 1, "sportTypeKey": "running", "displayOrder": 1}

    # Target sin zona (para calentamiento/enfriamiento)
    no_target = {
        "workoutTargetTypeId": 1,
        "workoutTargetTypeKey": "no.target",
        "displayOrder": 1
    }

    # Target con FC personalizada en ppm reales de la zona
    hr_target = {
        "workoutTargetTypeId": 4,
        "workoutTargetTypeKey": "heart.rate.zone",
        "displayOrder": 4
    }

    def make_step(order, type_id, type_key, duration, target, hr_low=None, hr_high=None):
        step = {
            "type": "ExecutableStepDTO",
            "stepOrder": order,
            "stepType": {"stepTypeId": type_id, "stepTypeKey": type_key, "displayOrder": order},
            "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time", "displayOrder": 2},
            "endConditionValue": duration,
            "targetType": target,
        }
        if hr_low is not None and hr_high is not None:
            step["targetValueOne"] = float(hr_low)
            step["targetValueTwo"] = float(hr_high)
        return step

    steps = []
    order = 1

    # Calentamiento sin target
    steps.append(make_step(order, 1, "warmup", warmup_sec, no_target))
    order += 1

    if reps > 1:
        rep_steps = []
        for _ in range(reps):
            rep_steps.append(make_step(order, 3, "interval", work_sec,
                                       hr_target, bpm_low, bpm_high))
            order += 1
            if rest_sec > 0:
                rep_steps.append(make_step(order, 6, "recovery", rest_sec, no_target))
                order += 1
        steps.append({
            "type": "RepeatGroupDTO",
            "stepOrder": order,
            "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat", "displayOrder": 6},
            "numberOfIterations": reps,
            "workoutSteps": rep_steps,
            "smartRepeat": False,
            "childStepId": 1,
        })
        order += 1
    else:
        steps.append(make_step(order, 3, "interval", work_sec,
                               hr_target, bpm_low, bpm_high))
        order += 1

    # Enfriamiento sin target
    steps.append(make_step(order, 4, "cooldown", cool_sec, no_target))

    wo_json = {
        "sportType": sport,
        "workoutName": wo_name,
        "estimatedDurationInSecs": total,
        "workoutSegments": [{
            "segmentOrder": 1,
            "sportType": sport,
            "workoutSteps": steps,
        }]
    }

    try:
        result = api.upload_workout(wo_json)
        print(f"   Workout subido: '{wo_name}' Z{zone_num} {bpm_low}-{bpm_high}bpm ({int(total//60)} min)")

        # Guardar control anti-duplicados
        control_file.write_text(_json.dumps({
            "date": today_str,
            "workout_name": wo_name,
            "zone": zone_num,
            "bpm_low": bpm_low,
            "bpm_high": bpm_high,
            "uploaded_at": _now().isoformat(),
        }, indent=2, default=str))
        print(f"   Control guardado. No se repetira hoy.")

        if isinstance(result, dict) and result.get("workoutId"):
            wid = result["workoutId"]
            # Siempre programar en el calendario de Garmin para HOY (entrenamiento adaptativo del día)
            target_date = _today()
            try:
                api.schedule_workout(wid, target_date.isoformat())
                print(f"   📅 Programado en calendario Garmin: {target_date.isoformat()} (HOY)")
            except Exception as e:
                print(f"   ⚠️ Error en calendario: {e}")

            # Enviar directamente a la memoria y cola de sincronización del Forerunner 970
            try:
                push_res = api.push_workout_to_device(wid)
                dev_name = "tu reloj Forerunner 970"
                if isinstance(push_res, list) and len(push_res) > 0 and push_res[0].get("deviceName"):
                    dev_name = push_res[0].get("deviceName")
                print(f"   ⌚ Enviado directo a {dev_name} (cola de sincronización activa)")
            except Exception as e:
                print(f"   ⚠️ Error en push a dispositivo: {e}")

            # Sincronizar cola de entrenamientos programados
            try:
                api.send_scheduled_workouts_to_devices()
                print(f"   🔄 Cola de sincronización Garmin Connect actualizada")
            except Exception:
                pass

        return {"status": "uploaded", "date": today_str, "workout_name": wo_name, "zone": zone_num, "bpm_low": bpm_low, "bpm_high": bpm_high}

    except Exception as e:
        print(f"   Error subiendo workout: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "date": today_str, "error": str(e)}


def auto_run(days: int = 30, upload_workout: bool = True, force_upload: bool = False):
    """
    Modo automático — corre sin menú, sin interacción.
    Equivale a la opción 9 del menú.
    Uso: python garmin_training_system_v2.py --auto [--days N]
    """
    print(f"""
╔══════════════════════════════════════════════════════════╗
║   GARMIN ADAPTIVE TRAINING SYSTEM v2.0 — MODO AUTO     ║
║   {_now().strftime('%Y-%m-%d %H:%M')}                                   ║
╚══════════════════════════════════════════════════════════╝
    """)

    api = init_api()
    if not api:
        print("❌ No se pudo conectar a Garmin. Abortando.")
        sys.exit(1)

    try:
        print(f"  🔄 Extrayendo {days} días de datos...")
        raw      = extract_all(api, days)
        profile  = auto_calibrate(raw)
        print_zones(profile["zones"], profile["fc_max"], profile["fc_reposo"])
        workout  = generate_adaptive_workout(profile, raw)
        print_workout(workout)
        analysis = analyze_and_recommend(raw, profile)
        export_for_web(raw, profile, analysis, workout)

        # ── Subida segura al reloj (NO quitar):
        # _auto_upload_workout revisa garmin_data/last_workout_upload.json.
        # Si ya existe registro para hoy, no sube nada. Esta llamada mantiene la
        # operación idempotente cuando el modo auto se ejecuta varias veces al día.
        if upload_workout:
            print(f"\n  ⌚ Verificando/subiendo workout al Forerunner 970...")
            _auto_upload_workout(api, workout, profile.get("zones") or raw.get("zones", []), force=force_upload)
        else:
            print(f"\n  ⏭️  Workout NO subido al reloj (modo --no-upload)")


        print(f"\n  ✅ Auto-run completado: {_now().strftime('%H:%M')}")
        print(f"  📱 Datos en app móvil + workout en el reloj.")
    except Exception as e:
        print(f"\n  ❌ Error en auto-run: {e}")
        traceback.print_exc()
        sys.exit(1)


def offline_run():
    """
    Recalcula todo desde datos/full_extract.json sin conectarse a Garmin.
    Sirve para probar cambios del motor, o para regenerar web_export.json
    cuando Garmin está caído o los tokens vencieron.
    Uso: python motor/garmin_training_system_v2.py --offline
    """
    fp = OUT / "full_extract.json"
    if not fp.exists():
        print(f"❌ No existe {fp}. Corre primero una sincronización (--auto).")
        sys.exit(1)
    raw = json.loads(fp.read_text(encoding="utf-8"))
    print(f"  📂 Modo offline: {fp}  (extraído {raw.get('extracted_at', '?')})")
    try:
        profile  = auto_calibrate(raw)
        workout  = generate_adaptive_workout(profile, raw)
        print_workout(workout)
        analysis = analyze_and_recommend(raw, profile)
        export_for_web(raw, profile, analysis, workout)
        print(f"\n  ✅ Offline completado: {_now().strftime('%H:%M')}")
    except Exception as e:
        print(f"\n  ❌ Error en modo offline: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Garmin Adaptive Training System v2.0")
    parser.add_argument("--auto",  action="store_true",
                        help="Modo automático: extrae, analiza y exporta sin menú")
    parser.add_argument("--days",  type=int, default=30,
                        help="Días de historial a extraer (default: 30, max: 365)")
    parser.add_argument("--no-upload", action="store_true",
                        help="No subir workout al reloj (solo extraer y exportar)")
    parser.add_argument("--force-upload", action="store_true",
                        help="Forzar subida aunque ya se haya generado hoy (borra el lock del día)")
    parser.add_argument("--offline", action="store_true",
                        help="Recalcular desde datos/full_extract.json sin conectarse a Garmin")
    args = parser.parse_args()

    try:
        if args.offline:
            offline_run()
        elif args.auto:
            days = max(1, min(365, args.days))
            no_upload    = getattr(args, 'no_upload', False)
            force_upload = getattr(args, 'force_upload', False)
            auto_run(days, upload_workout=not no_upload, force_upload=force_upload)
        else:
            main()
    except KeyboardInterrupt:
        print("\n\n  👋 ¡Chao!")
