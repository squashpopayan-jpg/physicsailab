"""Calcula valores de referencia con SciPy/NumPy/SymPy/mpmath, de forma independiente del código JavaScript.
Cada módulo ref/NN_*.py define run(R) y añade claves a R. Resultado: tests/referencias.json"""
import json, glob, os, importlib.util, sys
R = {}
here = os.path.dirname(os.path.abspath(__file__))
for f in sorted(glob.glob(os.path.join(here, 'ref', '*.py'))):
    spec = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); m.run(R)
with open(os.path.join(here, 'referencias.json'), 'w', encoding='utf8') as fh:
    json.dump(R, fh, indent=1)
print('referencias:', len(R), 'claves')
