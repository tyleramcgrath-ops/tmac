import subprocess, os
R='raw/'
TOTAL=32.4
# (start, end, source, src_offset, grade)
S=[(0.00,1.90,'urus0.jpg',0,'lux'),
   (1.90,2.55,'mk45453.mp4',2.0,'lux'),
   (2.55,3.44,'mk44545.mp4',1.0,'lux'),
   (3.44,7.55,'urus0.jpg',0,'cost'),
   (7.55,10.59,'mk24354.mp4',3.0,'cost'),
   (10.59,14.45,'mk18303.mp4',5.0,'lux'),
   (14.45,16.46,'mk64.mp4',4.0,'cost'),
   (16.46,17.52,'mk35577.mp4',2.0,'cost'),
   (17.52,19.02,'mk52427.mp4',1.0,'cost'),
   (19.02,21.27,'mk2862.mp4',2.0,'cost'),
   (21.27,23.24,'mk38406.mp4',5.0,'cost'),
   (23.24,26.45,'mk51549.mp4',3.0,'lux'),
   (26.45,27.78,'mk18299.mp4',5.0,'cost'),
   (27.78,30.29,'mk44541.mp4',3.0,'lux'),
   (30.29,TOTAL,'urus0.jpg',0,'lux')]
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
