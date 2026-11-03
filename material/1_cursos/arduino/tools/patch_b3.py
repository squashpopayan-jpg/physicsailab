# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

patch('src/core/35-mcu.js', [
    ("      case 'NewPing':",
     """      case 'WebServer': return function WebServer(port) {
        const s = this; s.routes = {}; s.nf = null; s.cur = null; s.port = port || 80;
        s.on = (path, fn) => { s.routes[path] = fn; };
        s.onNotFound = (fn) => { s.nf = fn; };
        s.begin = () => { self.httpOn = true; };
        s.handleClient = () => {
          const rq = self.httpQueue && self.httpQueue.shift();
          if (!rq) return;
          s.cur = rq; self.us += 800;
          const h = s.routes[rq.path] || s.nf;
          if (!h) { self.httpResp = { code: 404, type: 'text/plain', body: 'No encontrado: ' + rq.path, path: rq.path }; return; }
          const g = h();
          for (let k = 0; k < 100000; k++) { const r = g.next(); if (r.done) break; }
        };
        s.send = (code, type, body) => { self.httpResp = { code, type, body: String(body), path: s.cur ? s.cur.path : '/' }; };
        s.sendHeader = () => {};
        s.arg = (n) => (s.cur && s.cur.args && s.cur.args[n] !== undefined ? String(s.cur.args[n]) : '');
        s.hasArg = (n) => (s.cur && s.cur.args && n in s.cur.args ? 1 : 0);
        s.uri = () => (s.cur ? s.cur.path : '');
      };
      case 'NewPing':"""),
    ("    this.txBytes = 0;\n    }", "    this.txBytes = 0;\n      this.httpQueue = []; this.httpResp = null; this.httpOn = false;\n    }"),
])
print('ok')
