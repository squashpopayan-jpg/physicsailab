#!/usr/bin/env python3
"""Servidor local de Apogeo.

Por defecto sirve la app por HTTPS con un certificado autofirmado (necesario para que el celular permita usar la
cámara). Uso:

    python serve.py              # https://<IP-del-PC>:8796  (para abrir desde el celular en la misma red Wi-Fi)
    python serve.py 9000         # otro puerto
    python serve.py --http --local   # solo http://127.0.0.1:8796 (desarrollo en el PC)
"""
import argparse
import datetime
import http.server
import ipaddress
import mimetypes
import os
import socket
import ssl
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(HERE, ".cert")


def local_ips():
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            ips.add(ip)
    except OSError:
        pass
    return sorted(ip for ip in ips if not ip.startswith("127."))


def ensure_cert(ips):
    """Genera (si hace falta) un certificado autofirmado válido para localhost y las IP de este PC."""
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID

    os.makedirs(CERT_DIR, exist_ok=True)
    crt, key, meta = (os.path.join(CERT_DIR, n) for n in ("cert.pem", "key.pem", "ips.txt"))
    want = ",".join(ips)
    if os.path.exists(crt) and os.path.exists(key) and os.path.exists(meta) and open(meta).read() == want:
        return crt, key
    k = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Apogeo (local)")])
    san = [x509.DNSName("localhost"), x509.IPAddress(ipaddress.ip_address("127.0.0.1"))]
    san += [x509.IPAddress(ipaddress.ip_address(ip)) for ip in ips]
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(k.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=825))
        .add_extension(x509.SubjectAlternativeName(san), critical=False)
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(k, hashes.SHA256())
    )
    with open(key, "wb") as f:
        f.write(k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption()))
    with open(crt, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    with open(meta, "w") as f:
        f.write(want)
    return crt, key


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
        ".json": "application/json",
    }

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "--quiet" not in sys.argv:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("port", nargs="?", type=int, default=8796)
    ap.add_argument("--http", action="store_true", help="sin TLS (la cámara del celular no funcionará)")
    ap.add_argument("--local", action="store_true", help="escuchar solo en 127.0.0.1")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()
    mimetypes.add_type("text/javascript", ".js")
    host = "127.0.0.1" if a.local else "0.0.0.0"
    srv = http.server.ThreadingHTTPServer((host, a.port), Handler)
    ips = local_ips()
    scheme = "http" if a.http else "https"
    if not a.http:
        crt, key = ensure_cert(ips)
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(crt, key)
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    print("Apogeo listo.")
    print(f"  En este PC:   {scheme}://localhost:{a.port}/")
    if not a.local:
        for ip in ips:
            print(f"  En el celular: {scheme}://{ip}:{a.port}/   (misma red Wi-Fi o el punto de acceso del celular)")
        if not a.http:
            print("  Chrome avisará 'La conexión no es privada': toca Avanzado -> Continuar. Es normal (certificado propio).")
    print("  Ctrl+C para detener.")
    sys.stdout.flush()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
