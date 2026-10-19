"""Servidor de pruebas: sirve test/ y simula Firebase Realtime Database.

Imita lo que hace Firebase al guardar: los arreglos se guardan como objetos
con claves "0","1"…, los null y los contenedores vacíos desaparecen.
La conversión de vuelta a arreglos la hace el cliente (test/fbmock.js).

  python torneos/serve.py 8797
"""
import gzip
import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test")
STORE = {}
VER = 0
COND = threading.Condition()


def to_store(v):
    if v is None:
        return None
    if isinstance(v, list):
        d = {str(i): to_store(x) for i, x in enumerate(v)}
    elif isinstance(v, dict):
        d = {k: to_store(x) for k, x in v.items()}
    else:
        return v
    d = {k: x for k, x in d.items() if x is not None}
    return d or None


def set_path(tree, path, value):
    segs = [s for s in path.split("/") if s]
    if not segs:
        return to_store(value)
    if not isinstance(tree, dict):
        tree = {}
    node, parents = tree, []
    for s in segs[:-1]:
        nxt = node.get(s)
        if not isinstance(nxt, dict):
            nxt = {}
            node[s] = nxt
        parents.append((node, s))
        node = nxt
    sv = to_store(value)
    if sv is None:
        node.pop(segs[-1], None)
    else:
        node[segs[-1]] = sv
    for parent, key in reversed(parents):
        if isinstance(parent.get(key), dict) and not parent[key]:
            parent.pop(key)
    return tree or None


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _snap(self, path):
        return {"v": VER, "data": STORE.get(path)}

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        path = q.get("path", ["root"])[0]
        if u.path == "/mockdb/get":
            with COND:
                return self._json(self._snap(path))
        if u.path == "/mockdb/poll":
            since = int(q.get("v", ["-1"])[0])
            with COND:
                COND.wait_for(lambda: VER > since, timeout=20)
                return self._json(self._snap(path))
        # Archivos estáticos comprimidos (en este equipo las respuestas grandes llegaban cortadas)
        f = os.path.join(ROOT, u.path.lstrip("/") or "app-test.html")
        if os.path.isfile(f) and "gzip" in (self.headers.get("Accept-Encoding") or ""):
            with open(f, "rb") as fh:
                body = gzip.compress(fh.read())
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(f))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        return super().do_GET()

    def do_POST(self):
        global VER
        u = urlparse(self.path)
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        path = body.get("path", "root")
        with COND:
            if u.path == "/mockdb/update":
                tree = STORE.get(path)
                for k, v in body.get("updates", {}).items():
                    tree = set_path(tree, k, v)
                STORE[path] = tree
            elif u.path == "/mockdb/set":
                STORE[path] = to_store(body.get("value"))
            elif u.path == "/mockdb/reset":
                STORE.pop(path, None)
            else:
                return self._json({"error": "ruta desconocida"}, 404)
            VER += 1
            COND.notify_all()
            return self._json(self._snap(path))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8797
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    srv.daemon_threads = True
    print("Torneos (pruebas) en http://127.0.0.1:%d/app-test.html" % port, flush=True)
    srv.serve_forever()
