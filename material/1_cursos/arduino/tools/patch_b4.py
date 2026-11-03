# -*- coding: utf-8 -*-
def patch(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

# --- makeSerial: búfer de entrada propio para Bluetooth ---
p = 'src/core/35-mcu.js'
s = open(p, encoding='utf-8').read()
i = s.index('    makeSerial(name) {')
j = s.index('    makeWire() {')
blk = s[i:j].replace('self.serialIn', 'self[inK]').replace("      const self = this;\n", "      const self = this;\n      const inK = name === 'SerialBT' ? 'btIn' : 'serialIn';\n", 1)
s = s[:i] + blk + s[j:]
s = s.replace("this.serialIn = ''; this.serialBuf = 0;", "this.serialIn = ''; this.btIn = ''; this.serialBuf = 0;", 1)
open(p, 'w', encoding='utf-8').write(s)

patch('src/core/45-lab.js', [
    ("onSerial: (t) => this.serialAppend(t),", "onSerial: (t, n) => this.serialAppend(t, n),"),
    ("    serialAppend(t) {", "    serialAppend(t, name) {\n      if (name === 'SerialBT') { this.btText = (this.btText || '') + t; if (this.btText.length > 4000) this.btText = this.btText.slice(-3000); this.btDirty = true; return; }"),
    ("      if (cfg.code !== undefined && this.scene.mcus.length) this.buildCodePanel();",
     "      if (cfg.code !== undefined && this.scene.mcus.length) this.buildCodePanel();\n      if (cfg.web) this.buildWeb();\n      if (cfg.bt) this.buildBT();"),
    ("      if (this.serialDirty) {", "      if (this.btDirty && this.btPre) { this.btDirty = false; this.btPre.textContent = this.btText; this.btPre.scrollTop = this.btPre.scrollHeight; }\n      if (this.mcu && this.mcu.httpResp && this.webView) { const r = this.mcu.httpResp; this.mcu.httpResp = null; this.showResponse(r); }\n      if (this.serialDirty) {"),
    ("    /* ---------------- sonido ---------------- */",
     """    /* ---------------- navegador web virtual (servidor del ESP32) ---------------- */
    buildWeb() {
      const sim = this.sim, w = this.cfg.web;
      const box = el('div', 'lab-web');
      const head = el('div', 'lab-code-head'); head.innerHTML = '<b>Navegador del teléfono</b><span class="lab-board" id="' + sim._id('ip') + '">sin WiFi</span>';
      const bar = el('form', 'lab-serial-in');
      this.urlIn = document.createElement('input'); this.urlIn.type = 'text'; this.urlIn.value = '/'; this.urlIn.id = sim._id('url'); this.urlIn.setAttribute('aria-label', 'Dirección dentro del servidor');
      const go = el('button', 'btn primary', 'Ir'); go.type = 'submit';
      bar.append(this.urlIn, go);
      const links = el('div', 'lab-tray'); links.style.padding = '0 14px 8px';
      for (const [t, path] of w.links || []) { const b = el('button', 'btn', t); b.type = 'button'; b.addEventListener('click', () => { this.urlIn.value = path; this.goWeb(path); }); links.append(b); }
      this.webStatus = el('div', 'lab-baud', 'Esperando…'); this.webStatus.style.padding = '0 14px 6px';
      this.webView = el('div', 'lab-web-view'); this.webView.textContent = 'Pulse «Ir» para pedir la página al ESP32.';
      box.append(head, bar, links, this.webStatus, this.webView);
      sim.stageCol.append(box);
      bar.addEventListener('submit', (e) => { e.preventDefault(); this.goWeb(this.urlIn.value); });
      this.ipEl = head.querySelector('.lab-board');
    }
    goWeb(path) {
      if (!this.mcu) return;
      const u = String(path || '/').trim() || '/', q = u.indexOf('?'), args = {};
      if (q >= 0) u.slice(q + 1).split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) args[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
      if (!this.mcu.host || this.mcu.host.WiFi.status() !== 3) { this.webStatus.textContent = 'Sin conexión: la placa todavía no se unió a la red WiFi (espere unos segundos).'; return; }
      this.mcu.httpQueue.push({ path: q >= 0 ? u.slice(0, q) : u, args });
      this.webStatus.textContent = 'Pidiendo ' + u + ' …';
      this.webWait = this.t;
    }
    showResponse(r) {
      this.webStatus.textContent = 'Respuesta ' + r.code + ' · ' + r.type;
      const body = String(r.body).replace(/<script[\\s\\S]*?<\\/script>/gi, '').replace(/on\\w+="[^"]*"/gi, '');
      this.webView.innerHTML = /html/.test(r.type) ? body : '<pre>' + esc(body) + '</pre>';
    }
    /* ---------------- terminal Bluetooth del teléfono ---------------- */
    buildBT() {
      const sim = this.sim, box = el('div', 'lab-web');
      const head = el('div', 'lab-code-head'); head.innerHTML = '<b>Teléfono (terminal Bluetooth)</b><span class="lab-board">emparejado con «ESP32-Curso»</span>';
      this.btPre = el('pre', 'lab-serial-out'); this.btText = '';
      const f = el('form', 'lab-serial-in'); const inp = document.createElement('input'); inp.type = 'text'; inp.id = sim._id('bt-in'); inp.placeholder = 'Comando para la placa (por ejemplo: 1 o 0)'; inp.setAttribute('aria-label', 'Mensaje desde el teléfono');
      const b = el('button', 'btn', 'Enviar'); b.type = 'submit'; f.append(inp, b);
      box.append(head, this.btPre, f); sim.stageCol.append(box);
      f.addEventListener('submit', (e) => { e.preventDefault(); if (this.mcu) { this.mcu.btIn += inp.value; this.btText += '» ' + inp.value + '\\r\\n'; this.btDirty = true; } inp.value = ''; });
    }

    /* ---------------- sonido ---------------- */"""),
])
c = open('src/styles.css', encoding='utf-8').read()
c += """
.lab-web { border-top: 1px solid var(--rule); background: var(--surface); }
.lab-web-view { margin: 0 14px 14px; padding: 12px 14px; min-height: 90px; border: 1px solid var(--rule-strong); border-radius: 10px; background: #fff; color: #1b1b1f; font-family: var(--font-text); }
.lab-web-view h1 { font-size: 20px; margin: 0 0 6px; } .lab-web-view a { color: #0b5cd6; } .lab-web-view pre { margin: 0; white-space: pre-wrap; }
"""
open('src/styles.css', 'w', encoding='utf-8').write(c)
print('ok')
