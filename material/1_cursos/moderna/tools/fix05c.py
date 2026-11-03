# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\05-doppler.js'
s = open(p, encoding='utf-8').read()
i0 = s.index("      for (let k = 0; k < 24; k++) {\n        const a0")
i1 = s.index("      EM.draw.arrow(ctx, cx - 14, cy, cx + 30, cy")
new = """      for (let k = 0; k < 24; k++) {
        const a0 = (k * Math.PI * 2) / 24 + 0.0001, ang = Math.abs(((a0 + Math.PI) % (2 * Math.PI)) - Math.PI), sgn = Math.sin(a0) >= 0 ? 1 : -1, a1 = sgn * R.aberrate(b, ang);
        const aa = sgn * ang;
        ctx.save(); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.6; ctx.beginPath();
        for (let t = 0; t <= 1.0001; t += 0.1) { const a = aa + (a1 - aa) * t, x = cx + Rr * Math.cos(a), y = cy - Rr * Math.sin(a); t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(cx + Rr * Math.cos(aa), cy - Rr * Math.sin(aa), 3, 0, 7); ctx.fill();
        ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + Rr * Math.cos(a1), cy - Rr * Math.sin(a1), 4, 0, 7); ctx.fill(); ctx.restore();
      }
"""
s = s[:i0] + new + s[i1:]
s = s.replace("'○ posición sin movimiento   ● posición aparente (se agolpan hacia delante)'", "'○ sin movimiento · ● aparente'")
s = s.replace("sim.set('a', `${EM.fix(deg(a1), 4)}° · ${EM.fix(90 - deg(a1), 4)}° (${EM.fix((Math.PI / 2 - a1) * 206264.806, 2)}″)`);", "sim.set('a', `${EM.fix(deg(a1), 4)}° · ${EM.fix(90 - deg(a1), 4)}°` + (b < 0.01 ? ` (${EM.fix((Math.PI / 2 - a1) * 206264.806, 2)}″)` : ''));")
s = s.replace("sim.set('B', `B = ${EM.sci(b / c, 4)}·E (T por V/m) — a β = ${EM.fix(b, 3)}: cB/E = ${EM.fix(b, 3)}`);", "sim.set('B', `cB/E = β sen θ: en el plano perpendicular vale ${EM.fix(b, 3)}; a lo largo del movimiento, 0`);")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
