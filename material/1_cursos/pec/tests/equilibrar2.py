import glob
R=[
("'Talleres tipo laboratorio, como biocultura, mecánica o ebanistería'","'Talleres tipo laboratorio, como biocultura o mecánica'"),
("'Educación pertinente para el resguardo que también responda a los retos del mundo'","'Educación pertinente para el resguardo y para los retos del mundo'"),
("'El tejido de vida y el tejido de sabidurías y conocimientos', ['El tejido de lana","'El tejido de vida y el de sabidurías y conocimientos', ['El tejido de lana"),
("'En la Ley de Origen, la autoridad y el gobierno propio', [","'En la Ley de Origen y el gobierno propio', ["),
("['Ejercicios planificados para memorizar datos', 'Notas que se ponen en el boletín de cada periodo', 'Talleres tipo laboratorio en la escuela']","['Ejercicios planificados para memorizar datos y fechas históricas', 'Notas que se ponen en el boletín de cada periodo', 'Talleres tipo laboratorio en la escuela de Novirao']"),
("['Reuniones para resolver peleas entre vecinos', 'Cada una de las materias del plan de estudios', 'Los intermediarios que compran y venden el café']","['Reuniones para resolver peleas entre vecinos del sector', 'Cada una de las materias del plan de estudios del colegio', 'Los intermediarios que compran y venden el café']"),
("'las capacidades identificadas en los momentos de maduración', [","'las capacidades que se identifican en la maduración', ["),
("['Extracción de petróleo en los llanos', 'Minería industrial en otras regiones', 'Exportación de flores a otros países']","['Extracción de petróleo en los llanos orientales del país', 'Minería industrial en otras regiones del país', 'Exportación de flores a mercados de otros países']"),
("'la educación es fundamental para la pervivencia cultural y comunitaria', [","'la educación es clave para la pervivencia cultural', ["),
("'Un hilo trabajaba con un grupo y cada jueves rotaban por todos los hilos', [","'Un hilo trabajaba con un grupo y cada jueves rotaban de hilo', ["),
("'El que organiza la formación de cada grado, cuya estructura aún se discute', [","'El que organiza la formación de cada grado y aún se discute', ["),
]
files=sorted(glob.glob('src/data/*.js'));txt={f:open(f,encoding='utf8').read() for f in files};bad=0
for o,n in R:
    h=[f for f in files if o in txt[f]]
    if len(h)!=1 or txt[h[0]].count(o)!=1: print('NO:',o[:70]);bad+=1;continue
    txt[h[0]]=txt[h[0]].replace(o,n)
for f in files: open(f,'w',encoding='utf8').write(txt[f])
print('ok',len(R)-bad)
