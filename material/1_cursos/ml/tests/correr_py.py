"""Ejecuta los programas de práctica (py/*.py) y guarda su salida real en py/out/.

Uso:  python tests/correr_py.py            → todos
      python tests/correr_py.py 06-ols ...  → solo esos
Cada programa corre en un proceso aparte con matplotlib en modo sin ventana (Agg),
de modo que plt.show() no bloquea; en Colab o Jupyter las gráficas sí se muestran.
Termina con código 1 si algún programa falla.
"""
import os, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = os.path.join(ROOT, "py")
OUT = os.path.join(PY, "out")
os.makedirs(OUT, exist_ok=True)
names = sys.argv[1:] or sorted(f[:-3] for f in os.listdir(PY) if f.endswith(".py"))
env = dict(os.environ, MPLBACKEND="Agg", PYTHONIOENCODING="utf-8", PYTHONWARNINGS="ignore", PYTHONHASHSEED="0", OMP_NUM_THREADS="1")
fails = 0
for n in names:
    t = time.time()
    r = subprocess.run([sys.executable, n + ".py"], cwd=PY, env=env, capture_output=True, text=True, encoding="utf-8", timeout=900)
    dt = time.time() - t
    txt = "\n".join(line.rstrip() for line in r.stdout.splitlines()).rstrip() + "\n"
    if r.returncode != 0:
        fails += 1
        print(f"FALLA {n} ({dt:.1f} s)\n{r.stderr[-2000:]}")
        continue
    with open(os.path.join(OUT, n + ".txt"), "w", encoding="utf-8") as f:
        f.write(txt)
    print(f"OK    {n} ({dt:.1f} s, {len(txt.splitlines())} líneas)")
sys.exit(1 if fails else 0)
