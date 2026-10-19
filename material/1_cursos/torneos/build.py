"""Construye la app de torneos.

  dist/torneos-squash-popayan-v15.html  -> archivo final (Firebase real)
  test/app-test.html                    -> misma app con Firebase simulado (test/fbmock.js + serve.py)

El logo se toma de src/logo.txt (se extrae una sola vez del archivo v14 original).
"""
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src", "torneos.html")
LOGO_TXT = os.path.join(HERE, "src", "logo.txt")
ORIG = r"C:\Users\User\Desktop\torneos-squash-popayan-v14-profesional.html"
DIST = os.path.join(HERE, "dist", "torneos-squash-popayan-v15.html")
TEST = os.path.join(HERE, "test", "app-test.html")

FB_TAGS = (
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>\n'
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>'
)


def read(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def logo():
    if not os.path.exists(LOGO_TXT):
        m = re.search(r'var LOGO="(data:image/png;base64,[A-Za-z0-9+/=]+)";', read(ORIG))
        if not m:
            sys.exit("No se encontró el logo en el archivo original")
        write(LOGO_TXT, m.group(1))
    return read(LOGO_TXT).strip()


def main():
    src = read(SRC)
    if src.count('var LOGO="__LOGO__";') != 1 or src.count(FB_TAGS) != 1:
        sys.exit("La plantilla no tiene los marcadores esperados")
    app = src.replace('var LOGO="__LOGO__";', 'var LOGO="%s";' % logo())
    write(DIST, app)
    write(TEST, app.replace(FB_TAGS, '<script src="fbmock.js"></script>'))
    print("dist:", DIST, len(app), "bytes")
    print("test:", TEST)


if __name__ == "__main__":
    main()
