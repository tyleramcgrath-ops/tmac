import subprocess, os
R='raw/'
TOTAL=27.0
S=[(0.00,2.62,'mk23179.mp4@0.3',8.5,'lux'),
   (2.62,3.34,'mk35576.mp4',2.0,'lux'),
   (3.34,5.17,'mk69.mp4@0.75',2.0,'lux'),
   (5.17,6.98,'mk52427.mp4',1.0,'lux'),
   (6.98,8.84,'mk44542.mp4',2.0,'lux'),
   (8.84,10.41,'mk18303.mp4',5.0,'lux'),
   (10.41,12.65,'mk45453.mp4',2.0,'lux'),
   (12.65,15.63,'mk44545.mp4',3.0,'lux'),
   (15.63,18.22,'mk4805.mp4',2.0,'calm'),
   (18.22,19.88,'mk9607.mp4',3.0,'calm'),
   (19.88,22.21,'mk42716.mp4',2.0,'calm'),
   (22.21,23.48,'urus0.jpg',0,'lux'),
   (23.48,24.97,'mk42724.mp4',2.0,'calm'),
   (24.97,TOTAL,'mk23179.mp4@0.3',12.0,'lux')]
G={'calm':"eq=contrast=1.05:saturation=1.08:brightness=0.0,colorbalance=rs=.03:gs=.01:bs=-.03",'lux':"eq=contrast=1.10:saturation=1.30:brightness=-0.02,colorbalance=rs=.04:bs=-.04",
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
