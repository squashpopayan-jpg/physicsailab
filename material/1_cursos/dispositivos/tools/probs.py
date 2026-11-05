import re,sys,glob
sys.stdout.reconfigure(encoding='utf-8')
for f in sorted(glob.glob('src/chapters/%s-*.html'%sys.argv[1])):
    s=open(f,encoding='utf-8').read()
    n=re.search(r'data-num="(\d+)"',s).group(1)
    print('=== CAP',n)
    for m in re.finditer(r'<li><span class="lvl">(.*?)</span>(.*?)<details class="sol">(.*?)</details>',s,re.S):
        st=re.sub(r'<[^>]+>','',m.group(2)).strip()
        steps=re.sub(r'<[^>]+>','|',m.group(3)); steps=re.sub(r'\|+','|',steps)
        print('-',st[:260]); print('   ',steps[:520])
