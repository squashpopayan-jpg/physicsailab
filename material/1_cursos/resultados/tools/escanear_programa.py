"""Cuenta menciones de 'resultados de aprendizaje' en los microcurrículos y las actas del programa.
Uso: python tools/escanear_programa.py "<carpeta evidencias para los pares>"
Escribe tests/fuentes/programa_hallazgos.json (solo recuentos; no copia contenido)."""
import sys, os, re, json, glob, subprocess
import docx

base = sys.argv[1]
RA = re.compile(r'resultados?\s+de\s+aprendizaje', re.I)
COMP = re.compile(r'competenc', re.I)
OBJ = re.compile(r'objetivo', re.I)


def txt_docx(p):
    d = docx.Document(p)
    parts = [x.text for x in d.paragraphs]
    for tb in d.tables:
        for r in tb.rows:
            for c in r.cells:
                parts.append(c.text)
    return '\n'.join(parts)


def txt_pdf(p):
    try:
        return subprocess.run(['pdftotext', '-enc', 'UTF-8', p, '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
    except Exception:
        return ''


out = {}
micro = os.path.join(base, '5_Microcurriculos_Ya')
rows = []
for f in sorted(glob.glob(os.path.join(micro, '*'))):
    ext = f.lower().rsplit('.', 1)[-1]
    if ext == 'docx':
        t = txt_docx(f)
    elif ext == 'pdf':
        t = txt_pdf(f)
    else:
        continue  # .doc antiguos: no se leen
    rows.append({'ext': ext, 'ra': len(RA.findall(t)), 'comp': len(COMP.findall(t)), 'obj': len(OBJ.findall(t)), 'chars': len(t)})
out['microcurriculos'] = {
    'archivos_leidos': len(rows),
    'docx': sum(r['ext'] == 'docx' for r in rows),
    'pdf': sum(r['ext'] == 'pdf' for r in rows),
    'con_menciones_de_RA': sum(r['ra'] > 0 for r in rows),
    'menciones_totales_RA': sum(r['ra'] for r in rows),
    'con_objetivo': sum(r['obj'] > 0 for r in rows),
    'doc_antiguos_sin_leer': len([f for f in glob.glob(os.path.join(micro, '*')) if f.lower().endswith('.doc')]),
}
actas = glob.glob(os.path.join(base, '23_actas*', '*.docx'))
filas = []
for f in sorted(actas):
    t = txt_docx(f)
    filas.append({'n_chars': len(t), 'ra': len(RA.findall(t)), 'microcurriculo': len(re.findall(r'microcurr', t, re.I))})
out['actas'] = {'archivos': len(filas), 'con_RA': sum(x['ra'] > 0 for x in filas), 'con_microcurriculos': sum(x['microcurriculo'] > 0 for x in filas), 'max_caracteres': max(x['n_chars'] for x in filas)}
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests', 'fuentes', 'programa_hallazgos.json')
json.dump(out, open(dest, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(json.dumps(out, indent=1, ensure_ascii=False))
