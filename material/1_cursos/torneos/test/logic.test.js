// Pruebas de la lógica del torneo (sin navegador): node torneos/test/logic.test.js
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "dist", "torneos-squash-popayan-v15.html"), "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/g).pop().replace(/^<script>|<\/script>$/g, "");
const noop = () => {};
const store = {};
const ctx = {
  console, setTimeout, clearTimeout, requestAnimationFrame: noop, Blob: function () {}, URL: {},
  navigator: {}, location: {},
  document: { addEventListener: noop, querySelectorAll: () => [], getElementById: () => null, visibilityState: "visible", fonts: null, createElement: () => ({ style: {} }) },
  window: { addEventListener: noop, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, scrollTo: noop },
};
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(code, ctx);
const T = ctx; let n = 0;
const _dse = assert.deepStrictEqual; assert.deepStrictEqual = (a, b, m) => _dse(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m); // arreglos de otro realm (vm)
function test(name, fn) { fn(); n++; console.log("✓", name); }

// Firebase: arreglos→objetos, nulls y vacíos desaparecen; al leer, objetos con claves enteras→arreglos
function fbStore(v) { if (v === null || v === undefined) return undefined; if (typeof v !== "object") return v; const d = {}; for (const k of Object.keys(v)) { const x = fbStore(v[k]); if (x !== undefined) d[k] = x; } return Object.keys(d).length ? d : undefined; }
function fbRead(n) { if (n == null) return null; if (typeof n !== "object") return n; const ks = Object.keys(n), o = {}; let allInt = ks.length > 0, max = -1; for (const k of ks) { o[k] = fbRead(n[k]); if (!/^(0|[1-9]\d*)$/.test(k)) allInt = false; else max = Math.max(max, +k); } if (allInt && ks.length * 2 > max + 1) { const a = []; for (const k of ks) a[+k] = o[k]; return a; } return o; }
const roundTrip = v => fbRead(fbStore(JSON.parse(JSON.stringify(v))));

test("gameWinner: PAR a 11 y a 15", () => {
  const g = T.gameWinner;
  assert.strictEqual(g(11, 9, 11), 1); assert.strictEqual(g(9, 11, 11), 2); assert.strictEqual(g(11, 0, 11), 1);
  assert.strictEqual(g(11, 10, 11), null); assert.strictEqual(g(12, 10, 11), 1); assert.strictEqual(g(13, 11, 11), 1);
  assert.strictEqual(g(13, 10, 11), null, "13-10 es imposible"); assert.strictEqual(g(14, 10, 11), null); assert.strictEqual(g(10, 8, 11), null);
  assert.strictEqual(g(15, 13, 15), 1); assert.strictEqual(g(15, 14, 15), null); assert.strictEqual(g(11, 9, 15), null);
});

test("siembra estándar: 1 y 2 solo se cruzan en la final", () => {
  assert.deepStrictEqual(Array.from(T.seedOrder(8)), [1, 8, 4, 5, 2, 7, 3, 6]);
  assert.deepStrictEqual(Array.from(T.seedOrder(4)), [1, 4, 2, 3]);
  const o = T.seedOrder(16); assert.ok(o.slice(0, 8).includes(1) && o.slice(8).includes(2));
});

test("todos contra todos (método del círculo) para 2..9 jugadores", () => {
  for (let k = 2; k <= 9; k++) {
    const ps = Array.from({ length: k }, (_, i) => ({ id: "p" + i, name: "J" + i, level: 5 }));
    const rounds = T.rrRounds(ps), seen = new Set();
    rounds.forEach(r => { const inR = new Set(); r.forEach(([a, b]) => { assert.ok(!inR.has(a.id) && !inR.has(b.id), "jugador repetido en una ronda"); inR.add(a.id); inR.add(b.id); const key = [a.id, b.id].sort().join("|"); assert.ok(!seen.has(key), "pareja repetida"); seen.add(key); }); });
    assert.strictEqual(seen.size, k * (k - 1) / 2);
  }
});

test("grupos equilibrados en tamaño y nivel", () => {
  const ps = Array.from({ length: 11 }, (_, i) => ({ id: "p" + i, name: "J" + i, level: (i % 10) + 1 }));
  const g = T.balanceGroups(ps, 3), sizes = g.map(x => x.players.length).sort();
  assert.deepStrictEqual(sizes, [3, 4, 4]);
  assert.strictEqual(g.reduce((s, x) => s + x.players.length, 0), 11);
  assert.strictEqual(T.maxGroupsFor(5), 2); assert.strictEqual(T.maxGroupsFor(2), 1); assert.strictEqual(T.maxGroupsFor(40), 8);
});

function mk(p1, p2, w, games, extra) { return Object.assign(T.newMatch({ p1, p2, p1Name: p1.toUpperCase(), p2Name: p2.toUpperCase(), groupId: 1 }), { status: "done", winner: w, games }, extra || {}); }
test("clasificación: desempate por enfrentamiento directo entre 2", () => {
  const ps = ["a", "b", "c"].map(id => ({ id, name: id.toUpperCase() }));
  // a gana a b; b gana a c 2-0 con mucha diferencia; c gana a a  → todos 1 victoria (triple empate)
  const ms = [mk("a", "b", "a", [{ s1: 11, s2: 9, winner: 1 }, { s1: 11, s2: 9, winner: 1 }]), mk("b", "c", "b", [{ s1: 11, s2: 0, winner: 1 }, { s1: 11, s2: 0, winner: 1 }]), mk("c", "a", "c", [{ s1: 11, s2: 9, winner: 1 }, { s1: 11, s2: 9, winner: 1 }])];
  const st = T.groupStandings(ps, ms).map(r => r.id);
  assert.deepStrictEqual(st, ["b", "a", "c"], "triple empate: mini-tabla por diferencia de puntos");
  // empate de 2: d y e con 1 victoria, d le ganó a e
  const ps2 = ["d", "e", "f"].map(id => ({ id, name: id.toUpperCase() }));
  const ms2 = [mk("d", "e", "d", [{ s1: 11, s2: 9, winner: 1 }, { s1: 11, s2: 9, winner: 1 }]), mk("e", "f", "e", [{ s1: 11, s2: 0, winner: 1 }, { s1: 11, s2: 0, winner: 1 }]), mk("f", "d", "f", [{ s1: 11, s2: 0, winner: 1 }, { s1: 11, s2: 0, winner: 1 }]), mk("f", "e", "f", [{ s1: 11, s2: 0, winner: 1 }, { s1: 11, s2: 0, winner: 1 }])];
  const st2 = T.groupStandings(ps2, ms2).map(r => r.id);
  assert.deepStrictEqual(st2, ["f", "d", "e"], "d por delante de e por el directo aunque e tenga mejor diferencia");
});

function seeds(k, groups) { return Array.from({ length: k }, (_, i) => ({ id: "s" + (i + 1), name: "S" + (i + 1), group: groups ? groups[i] : null })); }
test("cuadro: 6 clasificados → pases directos a los sembrados 1 y 2", () => {
  const r = T.createKOMatches({ id: 0 }, seeds(6));
  const g = T.koGridFrom(r.matches);
  assert.deepStrictEqual(Array.from(r.roundNames), ["Cuartos de final", "Semifinal", "Final"]);
  const byes = g[0].filter(m => m.status === "bye").map(m => m.winner).sort();
  assert.deepStrictEqual(byes, ["s1", "s2"]);
  assert.ok(g[1].some(m => m.p1 === "s1" || m.p2 === "s1"), "s1 ya está en semifinal");
  assert.ok(!(g[1][0].p1 === "s1" && g[1][0].p2 === "s2"));
});

test("cuadro: evita rivales del mismo grupo en 1.ª ronda", () => {
  // 2 grupos x 2: orden de siembra A1,B1,A2,B2 → 1v4 = A1 v B2 (ok). Forzar caso malo: A1,B1,B2,A2
  const s = [{ id: "a1", name: "A1", group: 1 }, { id: "b1", name: "B1", group: 2 }, { id: "b2", name: "B2", group: 2 }, { id: "a2", name: "A2", group: 1 }];
  const r = T.createKOMatches({ id: 0 }, s), g = T.koGridFrom(r.matches);
  g[0].forEach(m => { const ga = s.find(x => x.id === m.p1).group, gb = s.find(x => x.id === m.p2).group; assert.notStrictEqual(ga, gb); });
});

test("cuadro: avance de ganadores y reinicio en cascada al corregir", () => {
  let ms = T.createKOMatches({ id: 0 }, seeds(4)).matches;
  let g = T.koGridFrom(ms);
  const done = (m, w) => Object.assign({}, m, { status: "done", winner: w, games: [{ s1: 11, s2: 5, winner: w === m.p1 ? 1 : 2 }, { s1: 11, s2: 5, winner: w === m.p1 ? 1 : 2 }] });
  ms = T.progressKO(ms.map(m => m.id === g[0][0].id ? done(m, m.p1) : m)); g = T.koGridFrom(ms);
  assert.strictEqual(g[1][0].status, "waiting"); assert.strictEqual(g[1][0].p1, "s1");
  ms = T.progressKO(ms.map(m => m.id === g[0][1].id ? done(m, m.p2) : m)); g = T.koGridFrom(ms);
  assert.strictEqual(g[1][0].status, "pending"); assert.strictEqual(g[1][0].p2, "s3");
  ms = T.progressKO(ms.map(m => m.id === g[1][0].id ? done(m, "s3") : m)); g = T.koGridFrom(ms);
  assert.strictEqual(T.champion({ matches: ms }).name, "S3");
  // corregir la semifinal 2: ahora gana s2 → la final debe reiniciarse
  const info = { reset: 0 };
  ms = T.progressKO(ms.map(m => m.id === g[0][1].id ? done(m, "s2") : m), info); g = T.koGridFrom(ms);
  assert.strictEqual(g[1][0].p2, "s2"); assert.strictEqual(g[1][0].status, "pending"); assert.strictEqual(g[1][0].winner, null);
  assert.strictEqual(info.reset, 1); assert.strictEqual(T.champion({ matches: ms }), null);
});

test("cuadro: un partido en juego no se pisa al cerrar el otro", () => {
  let ms = T.createKOMatches({ id: 0 }, seeds(4)).matches, g = T.koGridFrom(ms);
  const live = Object.assign({}, g[0][0], { status: "playing", games: [{ s1: 7, s2: 5, winner: null }] });
  ms = ms.map(m => m.id === live.id ? live : m);
  ms = T.progressKO(ms.map(m => m.id === g[0][1].id ? Object.assign({}, m, { status: "done", winner: m.p1, games: [{ s1: 11, s2: 1, winner: 1 }, { s1: 11, s2: 1, winner: 1 }] }) : m));
  const after = ms.find(m => m.id === live.id);
  assert.strictEqual(after.status, "playing"); assert.strictEqual(after.games[0].s1, 7);
});

function baseState(o) { return T.normalizeState(Object.assign(T.initState(), o || {}), false); }
function sched(state) { return T.scheduleAll(state); }
function allMatches(s) { return s.categories.flatMap(c => c.matches.filter(m => m.status !== "bye" && m.status !== "empty")); }
test("horarios: sin choques de cancha ni de jugador y con descanso", () => {
  let s = baseState({ courts: 2, slotMinutes: 30, restMinutes: 15 });
  const ps = Array.from({ length: 8 }, (_, i) => ({ id: "x" + i, name: "Jugador " + i, level: 1 + (i % 9) }));
  const g = T.balanceGroups(ps, 2);
  s.categories[0] = Object.assign({}, s.categories[0], { players: ps, groups: g, matches: T.roundRobin(g, 0) });
  // categoría B comparte a "Jugador 0" (mismo nombre, otra categoría)
  const ps2 = [{ id: "y0", name: "jugador 0", level: 5 }, { id: "y1", name: "Otro 1", level: 5 }, { id: "y2", name: "Otro 2", level: 5 }];
  const g2 = T.balanceGroups(ps2, 1);
  s.categories[1] = Object.assign({}, s.categories[1], { players: ps2, groups: g2, matches: T.roundRobin(g2, 1) });
  s = sched(s);
  const ms = allMatches(s); assert.ok(ms.every(m => /^\d\d:\d\d$/.test(m.startTime)), "todos con hora");
  const slot = 30, rest = 15;
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
    const a = ms[i], b = ms[j], ta = T.timeToMin(a.startTime), tb = T.timeToMin(b.startTime), ov = ta < tb + slot && tb < ta + slot;
    if (ov) assert.notStrictEqual(a.court, b.court, "cancha doble " + a.startTime);
    const na = [a.p1Name, a.p2Name].map(T.normName), nb = [b.p1Name, b.p2Name].map(T.normName);
    if (na.some(x => nb.includes(x))) assert.ok(ta + slot + rest <= tb || tb + slot + rest <= ta, "sin descanso: " + na + " / " + nb);
  }
  assert.ok(ms.every(m => m.court >= 1 && m.court <= 2));
});

test("horarios: los partidos jugados y fijados no se mueven; desde ahora", () => {
  let s = baseState({ courts: 1, slotMinutes: 30, restMinutes: 0 });
  const ps = Array.from({ length: 4 }, (_, i) => ({ id: "z" + i, name: "Z" + i, level: 5 }));
  const g = T.balanceGroups(ps, 1); s.categories[0] = Object.assign({}, s.categories[0], { players: ps, groups: g, matches: T.roundRobin(g, 0) });
  s = sched(s);
  const m0 = s.categories[0].matches[0];
  s.categories[0].matches[0] = Object.assign({}, m0, { status: "done", winner: m0.p1, startTime: "08:00" });
  s.categories[0].matches[1] = Object.assign({}, s.categories[0].matches[1], { fixed: true, startTime: "13:00" });
  const r = T.scheduleAll(s, { fromMin: 10 * 60 });
  assert.strictEqual(r.categories[0].matches[0].startTime, "08:00");
  assert.strictEqual(r.categories[0].matches[1].startTime, "13:00");
  r.categories[0].matches.slice(2).forEach(m => assert.ok(T.timeToMin(m.startTime) >= 600, "pendiente antes de las 10:00"));
});

test("horarios: playoffs después de terminar los grupos", () => {
  let s = baseState({ courts: 2, slotMinutes: 30, restMinutes: 0 });
  const ps = Array.from({ length: 6 }, (_, i) => ({ id: "k" + i, name: "K" + i, level: 6 - i }));
  const g = T.balanceGroups(ps, 2); let c = Object.assign({}, s.categories[0], { players: ps, groups: g, matches: T.roundRobin(g, 0) });
  s.categories[0] = c; s = sched(s);
  c = s.categories[0];
  c = Object.assign({}, c, { matches: c.matches.map(m => Object.assign({}, m, { status: "done", winner: m.p1, games: [{ s1: 11, s2: 3, winner: 1 }, { s1: 11, s2: 3, winner: 1 }] })) });
  const ko = T.createKOMatches(c, T.qualifiers(c, 2));
  c = Object.assign({}, c, { matches: c.matches.concat(ko.matches), knockout: { roundNames: ko.roundNames, nAdv: 2 } });
  s.categories[0] = c; s = sched(s);
  const lastGroup = Math.max(...s.categories[0].matches.filter(m => m.phase === "group").map(m => T.timeToMin(m.startTime)));
  const kos = s.categories[0].matches.filter(m => m.phase === "knockout" && m.status !== "bye" && m.status !== "empty");
  assert.ok(kos.length >= 3);
  kos.forEach(m => assert.ok(T.timeToMin(m.startTime) >= lastGroup + 30, "KO antes de terminar grupos"));
  const grid = T.koGridFrom(s.categories[0].matches);
  const semis = grid[0].filter(m => m.status === "pending").map(m => T.timeToMin(m.startTime)), fin = T.timeToMin(grid[1][0].startTime);
  assert.ok(semis.every(t => fin >= t + 30), "la final va después de las semifinales");
});

test("normalización: datos como los devuelve Firebase (v14 con knockout.rounds)", () => {
  const p = (id, n) => ({ id, name: n, level: 5 });
  const koA = { id: "ko-a", catId: 0, phase: "knockout", roundName: "Final", p1: "1", p1Name: "Ana", p2: "2", p2Name: "Beto", games: [], winner: null, status: "pending", startTime: "", court: 1, slog: [], scoreMeta: null };
  const v14 = { courts: 2, scoringMode: "bo3", judgePinHash: "h123", appVersion: "v14-pro", categories: [
    { id: 0, name: "Categoria A", color: 0, startTime: "08:00", players: [p("1", "Ana"), p("2", "Beto")], groups: [{ id: 1, players: [p("1", "Ana"), p("2", "Beto")] }],
      matches: [{ id: "g-1", catId: 0, groupId: 1, phase: "group", p1: "1", p2: "2", p1Name: "Ana", p2Name: "Beto", games: [{ s1: 11, s2: 5, winner: 1 }, { s1: 11, s2: 7, winner: 1 }], winner: "1", startTime: "08:00", court: 1, status: "done", slog: [[], [{ s1: 1, s2: 0 }]], scoreMeta: null }, koA],
      knockout: { rounds: [[koA]], roundNames: ["Final"] } },
    { id: 1, name: "Categoria B", color: 1, players: [], groups: [], matches: [], knockout: null, startTime: "08:00" }] };
  const raw = roundTrip(v14);
  assert.ok(!Array.isArray(raw.categories[0].matches[0].slog), "Firebase devuelve slog [[],[x]] como objeto");
  const s = T.normalizeState(raw, true);
  assert.strictEqual(T.NEED_FULL, false);
  const c = s.categories[0];
  assert.strictEqual(c.matches.length, 2); assert.strictEqual(c.matches[0].slog.length, 2);
  assert.strictEqual(c.matches[1].koRound, 0); assert.strictEqual(c.matches[1].koSlot, 0); assert.strictEqual(c.matches[1].winner, null);
  assert.deepStrictEqual(Array.from(c.knockout.roundNames), ["Final"]);
  assert.strictEqual(s.slotMinutes, 15, "datos v14 conservan bloques de 15 min"); assert.strictEqual(s.restMinutes, 0);
  assert.strictEqual(s.judgeCode, "juez2026"); assert.strictEqual(s.categories[1].players.length, 0);
  assert.deepStrictEqual(Array.from(s.categories[1].matches), []);
  // idempotente
  assert.strictEqual(JSON.stringify(T.normalizeState(JSON.parse(JSON.stringify(s)), false)), JSON.stringify(s));
});

test("persistencia: solo se envían las rutas que cambiaron", () => {
  T.LEGACY_KO = {};
  const a = baseState(); const ps = [{ id: "1", name: "A", level: 5, withdrawn: false }, { id: "2", name: "B", level: 5, withdrawn: false }];
  const g = T.balanceGroups(ps, 1); a.categories[0] = Object.assign({}, a.categories[0], { players: ps, groups: g, matches: T.roundRobin(g, 0) });
  const A = T.normalizeState(JSON.parse(JSON.stringify(a)), false);
  const B = JSON.parse(JSON.stringify(A)); B.categories[0].matches[0].games = [{ s1: 3, s2: 1, winner: null }]; B.categories[0].matches[0].status = "playing";
  assert.deepStrictEqual(Object.keys(T.computeUpdates(A, T.normalizeState(B, false))), ["categories/0/matches/0"]);
  const C = JSON.parse(JSON.stringify(A)); C.categories.push(T.defaultCategory(5, "Nueva"));
  assert.deepStrictEqual(Object.keys(T.computeUpdates(A, T.normalizeState(C, false))), ["categories/5"]);
  const D = JSON.parse(JSON.stringify(A)); D.categories.splice(2, 1);
  assert.deepStrictEqual(Object.keys(T.computeUpdates(A, T.normalizeState(D, false))), ["categories"]);
  const E = JSON.parse(JSON.stringify(A)); E.judgeCode = "nuevo1"; E.judgePinHash = null;
  assert.deepStrictEqual(Object.keys(T.computeUpdates(A, T.normalizeState(E, false))).sort(), ["judgeCode", "judgePinHash"]);
  // datos v14: la primera escritura de esa categoría reescribe knockout (borra las copias de knockout.rounds)
  T.LEGACY_KO = { 0: 1 };
  assert.deepStrictEqual(Object.keys(T.computeUpdates(A, T.normalizeState(B, false))).sort(), ["categories/0/knockout", "categories/0/matches/0"]);
  assert.deepStrictEqual(Object.keys(T.computeUpdates(A, T.normalizeState(E, false))).sort(), ["judgeCode", "judgePinHash"], "otras categorías/rutas no se tocan");
  T.LEGACY_KO = {};
});

test("cuadro: si falta un partido previo, NO se regala el pase", () => {
  let ms = T.createKOMatches({ id: 0 }, seeds(4)).matches, g = T.koGridFrom(ms);
  ms = T.progressKO(ms.map(m => m.id === g[0][1].id ? Object.assign({}, m, { status: "done", winner: m.p2, games: [{ s1: 1, s2: 11, winner: 2 }, { s1: 1, s2: 11, winner: 2 }] }) : m));
  const broken = ms.map(m => m.id === g[0][0].id ? Object.assign({}, m, { koRound: null, koSlot: null }) : m); // semifinal 1 sin posición
  const fin = T.koGridFrom(T.progressKO(broken))[1][0];
  assert.strictEqual(fin.status, "waiting"); assert.strictEqual(fin.winner, null);
});

test("v14: posición del cuadro reconstruida desde el id", () => {
  const mkKo = (seq, extra) => Object.assign(T.newMatch({ id: "ko-0-1791641087143-" + seq + "-ab", phase: "knockout" }), { koRound: null, koSlot: null }, extra || {});
  const ms = [mkKo(2), mkKo(0, { p1: "a", p2: "b" }), mkKo(1, { p1: "c", p2: "d" })].map(m => T.normalizeMatch(m, 0));
  T.inferKOSlots(ms);
  const pos = Object.fromEntries(ms.map(m => [m.id.split("-")[3], m.koRound + "/" + m.koSlot]));
  assert.deepStrictEqual(pos, { "0": "0/0", "1": "0/1", "2": "1/0" });
  const odd = [mkKo(0), mkKo(1)].map(m => T.normalizeMatch(m, 0)); T.inferKOSlots(odd); // 2 partidos no forman un cuadro
  assert.ok(odd.every(m => m.koRound === null));
});

test("v14: la limpieza de knockout.rounds guarda la posición de todos los partidos de playoffs", () => {
  T.LEGACY_KO = { 0: 1 };
  const a = baseState(); let ms = T.createKOMatches({ id: 0 }, seeds(4)).matches;
  a.categories[0] = Object.assign({}, a.categories[0], { matches: ms, knockout: { roundNames: ["Semifinal", "Final"], nAdv: null, direct: false } });
  const A = T.normalizeState(JSON.parse(JSON.stringify(a)), false), B = JSON.parse(JSON.stringify(A));
  B.categories[0].matches[1].status = "playing"; B.categories[0].matches[1].games = [{ s1: 1, s2: 0, winner: null }];
  const keys = Object.keys(T.computeUpdates(A, T.normalizeState(B, false))).sort();
  assert.deepStrictEqual(keys, ["categories/0/knockout", "categories/0/matches/0", "categories/0/matches/1", "categories/0/matches/2"]);
  T.LEGACY_KO = {};
});

test("W.O.: conserva games jugados y completa los que faltan", () => {
  const m = T.newMatch({ p1: "a", p2: "b", p1Name: "A", p2Name: "B" });
  const r = T.buildWO(m, 2, [{ s1: 11, s2: 4, winner: 1 }, { s1: 5, s2: 3, winner: null }], { mode: "bo3", needed: 2, pts: 11 });
  assert.strictEqual(r.winner, "b"); assert.strictEqual(r.status, "wo");
  assert.deepStrictEqual(r.games.map(g => [g.s1, g.s2, g.winner]), [[11, 4, 1], [0, 11, 2], [0, 11, 2]]);
});

test("PIN de admin «Anto» y código de jueces", () => {
  assert.strictEqual(T.ph(T.normCode("Anto")), T.AHASH); assert.strictEqual(T.ph(T.normCode(" anto ")), T.AHASH);
  assert.notStrictEqual(T.ph(T.normCode("Antonio")), T.AHASH);
  assert.strictEqual(T.DEFAULT_JUDGE_CODE, "juez2026");
});
console.log("\n" + n + " pruebas OK");
