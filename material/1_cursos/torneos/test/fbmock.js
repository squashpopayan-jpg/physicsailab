/* Firebase Realtime Database simulado para pruebas (API compat mínima).
   Comparte datos entre pestañas/orígenes a través de serve.py.
   window.__mock.setOnline(false|true) simula perder / recuperar internet. */
(function () {
  var apps = {}, roots = {};
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function hasBad(v, where) {
    if (v === undefined) throw new Error("Firebase: valor undefined en " + where);
    if (typeof v === "number" && !isFinite(v)) throw new Error("Firebase: número inválido en " + where);
    if (v && typeof v === "object") Object.keys(v).forEach(function (k) {
      if (/[.#$\[\]\/]/.test(k)) throw new Error("Firebase: clave inválida '" + k + "' en " + where);
      hasBad(v[k], where + "/" + k);
    });
  }
  function toStore(v) {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== "object") return v;
    var d = {};
    Object.keys(v).forEach(function (k) { var x = toStore(v[k]); if (x !== undefined) d[k] = x; });
    return Object.keys(d).length ? d : undefined;
  }
  function setPath(tree, path, value) {
    var segs = path.split("/").filter(Boolean);
    if (!segs.length) return toStore(value);
    if (!tree || typeof tree !== "object") tree = {};
    var node = tree, parents = [];
    for (var i = 0; i < segs.length - 1; i++) {
      var nx = node[segs[i]];
      if (!nx || typeof nx !== "object") { nx = {}; node[segs[i]] = nx; }
      parents.push([node, segs[i]]); node = nx;
    }
    var sv = toStore(value);
    if (sv === undefined) delete node[segs[segs.length - 1]]; else node[segs[segs.length - 1]] = sv;
    for (var j = parents.length - 1; j >= 0; j--) {
      var p = parents[j][0], k = parents[j][1];
      if (p[k] && typeof p[k] === "object" && !Object.keys(p[k]).length) delete p[k];
    }
    return Object.keys(tree).length ? tree : undefined;
  }
  function readFb(n) {
    if (n === undefined || n === null) return null;
    if (typeof n !== "object") return n;
    var keys = Object.keys(n), out = {}, allInt = keys.length > 0, max = -1;
    keys.forEach(function (k) { out[k] = readFb(n[k]); if (!/^(0|[1-9]\d*)$/.test(k)) allInt = false; else max = Math.max(max, +k); });
    if (allInt && keys.length * 2 > max + 1) { var a = []; keys.forEach(function (k) { a[+k] = out[k]; }); return a; }
    return out;
  }
  function Root(path) {
    this.path = path; this.tree = undefined; this.ver = -1; this.loaded = false; this.online = true;
    this.listeners = []; this.conn = []; this.pending = 0; this.queue = []; this.log = [];
    var self = this;
    fetch("/mockdb/get?path=" + encodeURIComponent(path)).then(function (r) { return r.json(); }).then(function (s) {
      self.tree = s.data || undefined; self.ver = s.v; self.loaded = true; self.fire(); self.fireConn(); self.poll();
    });
  }
  Root.prototype.fire = function () {
    var v = readFb(this.tree);
    this.listeners.forEach(function (cb) { var c = clone(v); try { cb({ val: function () { return c === undefined ? null : c; } }); } catch (e) { console.error(e); } });
  };
  Root.prototype.fireConn = function () {
    var on = this.online && this.loaded;
    this.conn.forEach(function (cb) { cb({ val: function () { return on; } }); });
  };
  Root.prototype.poll = function () {
    var self = this;
    if (!self.online) return;
    fetch("/mockdb/poll?path=" + encodeURIComponent(self.path) + "&v=" + self.ver).then(function (r) { return r.json(); }).then(function (s) {
      if (self.online && s.v > self.ver && self.pending === 0) { self.ver = s.v; self.tree = s.data || undefined; self.fire(); }
      self.poll();
    }).catch(function () { setTimeout(function () { self.poll(); }, 1000); });
  };
  Root.prototype.send = function (kind, payload) {
    var self = this;
    self.log.push({ kind: kind, keys: kind === "update" ? Object.keys(payload) : ["(todo)"], at: Date.now() });
    return new Promise(function (resolve, reject) {
      var job = function () {
        self.pending++;
        var body = kind === "update" ? { path: self.path, updates: payload } : { path: self.path, value: payload };
        return fetch("/mockdb/" + kind, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); })
          .then(function (s) { self.pending--; if (self.pending === 0 && s.v > self.ver) { self.ver = s.v; self.tree = s.data || undefined; self.fire(); } resolve(); })
          .catch(function (e) { self.pending--; reject(e); });
      };
      if (self.online) job(); else self.queue.push(job);
    });
  };
  function makeRef(root, sub) {
    var base = sub || "";
    return {
      on: function (ev, cb) { root.listeners.push(cb); if (root.loaded) setTimeout(function () { root.fire(); }, 0); },
      off: function () {},
      child: function (p) { return makeRef(root, base ? base + "/" + p : p); },
      update: function (obj) {
        Object.keys(obj).forEach(function (k) { hasBad(obj[k], "update " + k); });
        var full = {};
        Object.keys(obj).forEach(function (k) { full[base ? base + "/" + k : k] = obj[k]; root.tree = setPath(root.tree, base ? base + "/" + k : k, clone(obj[k])); });
        root.fire();
        return root.send("update", full);
      },
      set: function (v) {
        hasBad(v, "set");
        if (base) { var o = {}; o[base] = v; return this.update ? makeRef(root, "").update(o) : null; }
        root.tree = toStore(clone(v)); root.fire();
        return root.send("set", v);
      }
    };
  }
  window.firebase = {
    app: function (name) { if (!apps[name]) throw new Error("no app"); return apps[name]; },
    initializeApp: function (cfg, name) { apps[name] = { name: name, cfg: cfg }; return apps[name]; },
    database: function () {
      return {
        ref: function (path) {
          if (path === ".info/connected") {
            return { on: function (ev, cb) { var r = roots.__last; if (r) { r.conn.push(cb); setTimeout(function () { r.fireConn(); }, 0); } } };
          }
          if (!roots[path]) roots[path] = new Root(path);
          roots.__last = roots[path];
          return makeRef(roots[path], "");
        }
      };
    }
  };
  window.__mock = {
    root: function () { return roots.__last; },
    setOnline: function (on) {
      var r = roots.__last; if (!r) return;
      r.online = !!on; r.fireConn();
      if (on) { var q = r.queue.splice(0); q.reduce(function (p, job) { return p.then(job); }, Promise.resolve()).then(function () { r.poll(); }); }
    },
    reset: function () { var r = roots.__last; return fetch("/mockdb/reset", { method: "POST", body: JSON.stringify({ path: r.path }) }); },
    writes: function () { var r = roots.__last; return r ? r.log : []; }
  };
})();
