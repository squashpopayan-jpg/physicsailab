# Recorta las ilustraciones de la cartilla (fotografías) para usarlas en el curso.
import sys
from PIL import Image
S = 1.2
R = {
  'ave2':   ('p01', (930,830,1500,1400)),
 'quepec': ('p02', (1475,190,1960,520)),
 'fogon':  ('p02', (190,1090,900,1420)),
 'huerta': ('p03', (60,150,940,672)),
 'mapa':   ('p03', (1320,460,1850,910)),
 'joven':  ('p04', (220,130,750,490)),
 'mayores':('p05', (110,170,930,562)),
 'arbol':  ('p06', (110,150,930,540)),
 'tulpa':  ('p06', (1100,820,1900,1230)),
 'tejedora':('p07',(1090,170,1950,592)),
 'golondrina':('p08',(1160,190,1930,598)),
 'mural':  ('p09', (10,660,940,1380)),
 'colibri':('p10', (40,120,950,612)),
 'siembra':('p11', (1140,160,1950,600)),
 'paisaje':('p14', (1110,850,1910,1172)),
}
for nombre,(p,box) in R.items():
    im = Image.open(f'docs/fuentes/paginas/{p}_image.jpg').convert('RGB')
    b = tuple(int(v*S) for v in box)
    c = im.crop(b)
    if c.width > 900:
        c = c.resize((900, int(c.height*900/c.width)), Image.LANCZOS)
    c.save(f'src/img/{nombre}.jpg', quality=78, optimize=True)
    print(nombre, c.size)
# hoja de contacto para revisión visual
names = list(R)
W = 420
sheet = Image.new('RGB',(W*4, 330*5),'white')
for i,n in enumerate(names):
    c = Image.open(f'src/img/{n}.jpg'); c.thumbnail((W-10,320))
    sheet.paste(c,((i%4)*W+5,(i//4)*330+5))
sheet.save('docs/fuentes/contacto.jpg', quality=80)
