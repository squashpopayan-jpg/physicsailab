p='build.js'; s=open(p,encoding='utf-8').read()
s=s.replace("""for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {""","""for (const m of t.matchAll(/(?:data-sim|<explore\s+sim)="([^"]+)"/g)) {""")
open(p,'w',encoding='utf-8').write(s)
