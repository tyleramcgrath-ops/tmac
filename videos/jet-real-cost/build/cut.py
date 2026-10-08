import subprocess, os
R='raw/'
TOTAL=34.2
S=[(0.00,2.21,'mk6737.mp4',4.6,'lux'),
   (2.21,3.04,'mk51562.mp4',2.0,'lux'),
   (3.04,4.10,'mk4204.mp4',2.0,'lux'),
   (4.10,8.60,'mk7138.mp4',2.0,'cost'),
   (8.60,9.19,'mk6770.mp4',2.0,'cost'),
   (9.19,9.77,'mk23991.mp4',2.0,'cost'),
   (9.77,10.50,'mk22618.mp4',2.0,'cost'),
   (10.50,11.47,'mk23751.mp4',2.0,'cost'),
   (11.47,14.71,'mk24354.mp4',3.0,'cost'),
   (14.71,16.63,'mk6753.mp4',2.0,'cost'),
   (16.63,18.65,'mk28000.mp4',1.0,'lux'),
   (18.65,21.89,'mk2862.mp4',2.0,'cost'),
   (21.89,24.74,'mk18303.mp4',5.0,'lux'),
   (24.74,27.21,'mk51531.mp4',2.0,'lux'),
   (27.21,29.96,'mk18299.mp4',5.0,'cost'),
   (29.96,31.78,'mk46128.mp4',2.0,'lux'),
   (31.78,TOTAL,'mk6737.mp4',7.0,'lux')]
G={'lux':"eq=contrast=1.10:saturation=1.30:brightness=-0.02,colorbalance=rs=.04:bs=-.04",
   'cost':"eq=contrast=1.12:saturation=0.75:brightness=-0.07,colorbalance=bs=.03"}
VIG="vignette=PI/4.5"
parts=[]
for i,(a,b,src,off,g) in enumerate(S):
    D=round(b-a,3); out=f'build/seg{i:02d}.mp4'
    if src.endswith('.jpg'):
        # blur-fill background + full car foreground with slow push-in
        fc=(f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.06:saturation=1.2[bg];"
            f"[0:v]scale=1300:-2,fps=30,zoompan=z='1+0.10*on/({D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1300x708:fps=30[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2-80,{G[g]},{VIG},fps=30,format=yuv420p[v]")
        cmd=['ffmpeg','-v','error','-y','-loop','1','-framerate','30','-t',str(D),'-i',R+src,'-filter_complex',fc,'-map','[v]','-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',out]
    else:
        vf=(f"scale=-2:1920,crop=1080:1920,fps=30,zoompan=z='1+0.06*on/({D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
            f"{G[g]},{VIG},fps=30,format=yuv420p")
        cmd=['ffmpeg','-v','error','-y','-ss',str(off),'-t',str(D),'-i',R+src,'-vf',vf,'-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',out]
    subprocess.run(cmd,check=True); parts.append(out)
open('build/list.txt','w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','build/list.txt','-c','copy','assets/footage/track.mp4'],check=True)
print('ok')
