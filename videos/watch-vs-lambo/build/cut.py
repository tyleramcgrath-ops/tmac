import subprocess, os
R='raw/'
TOTAL=39.1
S=[(0.00,1.85,'urus0.jpg',0,'lux'),
   (1.85,3.29,'mk33029.mp4',1.0,'lux'),
   (3.29,4.95,'mk35540.mp4',2.0,'lux'),
   (4.95,6.61,'mk28888.mp4',2.0,'lux'),
   (6.61,10.74,'mk52427.mp4',1.0,'lux'),
   (10.74,14.58,'mk18303.mp4',5.0,'lux'),
   (14.58,17.74,'mk44070.mp4@0.78',2.0,'lux'),
   (17.74,21.34,'mk38406.mp4',5.0,'lux'),
   (21.34,24.67,'mk3652.mp4@0.3',4.0,'lux'),
   (24.67,26.86,'mk2862.mp4',2.0,'lux'),
   (26.86,30.21,'mk16109.mp4',2.0,'cost'),
   (30.21,33.52,'mk18299.mp4',5.0,'cost'),
   (33.52,35.48,'urus0.jpg',0,'cost'),
   (35.48,36.96,'mk33029.mp4',5.0,'lux'),
   (36.96,TOTAL,'SPLIT',0,'lux')]
G={'lux':"eq=contrast=1.10:saturation=1.30:brightness=-0.02,colorbalance=rs=.04:bs=-.04",
   'cost':"eq=contrast=1.12:saturation=0.75:brightness=-0.07,colorbalance=bs=.03"}
VIG="vignette=PI/4.5"
parts=[]
for i,(a,b,src,off,g) in enumerate(S):
    D=round(b-a,3); out=f'build/seg{i:02d}.mp4'
    if src=='SPLIT':
        fc=(f"[0:v]scale=-2:960,crop=1080:960,{G[g]}[top];"
            f"[1:v]scale=-2:960,crop=1080:960,{G[g]}[bot];"
            f"[top][bot]vstack,drawbox=x=0:y=954:w=1080:h=12:color=white@1:t=fill,fps=30,format=yuv420p[v]")
        cmd=['ffmpeg','-v','error','-y','-loop','1','-framerate','30','-t',str(D),'-i',R+'urus0.jpg','-ss','3','-t',str(D),'-i',R+'mk28888.mp4','-filter_complex',fc,'-map','[v]','-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',out]
    elif src.endswith('.jpg'):
        # blur-fill background + full car foreground with slow push-in
        fc=(f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.06:saturation=1.2[bg];"
            f"[0:v]scale=1300:-2,fps=30,zoompan=z='1+0.10*on/({D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1300x708:fps=30[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2-80,{G[g]},{VIG},fps=30,format=yuv420p[v]")
        cmd=['ffmpeg','-v','error','-y','-loop','1','-framerate','30','-t',str(D),'-i',R+src,'-filter_complex',fc,'-map','[v]','-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',out]
    else:
        fx=0.5
        if '@' in src: src,fx=src.split('@'); fx=float(fx)
        vf=(f"scale=-2:1920,crop=1080:1920:(iw-1080)*{fx}:0,fps=30,zoompan=z='1+0.06*on/({D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
            f"{G[g]},{VIG},fps=30,format=yuv420p")
        cmd=['ffmpeg','-v','error','-y','-ss',str(off),'-t',str(D),'-i',R+src,'-vf',vf,'-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',out]
    subprocess.run(cmd,check=True); parts.append(out)
open('build/list.txt','w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','build/list.txt','-c','copy','assets/footage/track.mp4'],check=True)
print('ok')
