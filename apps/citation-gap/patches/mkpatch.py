import sys, json, re, hashlib, difflib
def unesc(s): return re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1),16)), s)
def sha(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()
old=unesc(open(sys.argv[1],encoding='utf-8').read()); new=unesc(open(sys.argv[2],encoding='utf-8').read())
ol=old.split('\n'); nl=new.split('\n')
hunks=[]
for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,ol,nl,autojunk=False).get_opcodes():
    if tag=='equal': continue
    hunks.append({'at':i1,'del':i2-i1,'ins':nl[j1:j2]})
# verify
out=[];pos=0
for h in hunks:
    out+=ol[pos:h['at']]; out+=h['ins']; pos=h['at']+h['del']
out+=ol[pos:]
assert '\n'.join(out)==new
raw=json.dumps({'hunks':hunks},ensure_ascii=True,indent=0)
open(sys.argv[3],'w',encoding='utf-8').write(raw)
print('base',sha(old)); print('hunks',len(hunks)); print('patch sha (normalized)',sha(unesc(raw)), 'bytes',len(raw)); print('result',sha(new),'bytes',len(new.encode('utf-8')))
