/* McGrath Chrome — chrome field, blue-links dissolve, nav, lens, crawler view. */

(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ---------------- WebGL chrome field ---------------- */
  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS=[
  'precision highp float;',
  'uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;uniform float u_dark;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
  ' return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}',
  'void main(){',
  ' vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;',
  ' float t=u_t*.055;',
  ' vec2 mo=(u_m-.5)*.45;',
  ' vec2 q=vec2(fbm(uv*1.6+t), fbm(uv*1.6+vec2(3.2,1.7)-t*.8));',
  ' vec2 r=vec2(fbm(uv*1.9+q*2.4+mo+t*1.1), fbm(uv*1.9+q*2.4-mo+vec2(8.3,2.8)-t));',
  ' float f=fbm(uv*2.1+r*2.2);',
  ' float band=sin((f*9.0+r.x*3.0)*3.14159+u_t*.22);',
  ' float sheen=pow(abs(band),7.0);',
  ' vec3 lo=mix(vec3(.60,.68,.80),vec3(.82,.84,.80),r.y);',
  ' vec3 hi=vec3(.949,.941,.918);',
  ' vec3 col=mix(lo,hi,smoothstep(.28,.82,f));',
  ' vec3 irid=.5+.5*cos(6.28318*(f*1.15+vec3(.58,.42,.10)));',
  ' col=mix(col,col*(.88+irid*.24),.18);',
  ' col+=sheen*.22;',
  ' col=mix(col,vec3(.027,.102,.188)+col*vec3(.10,.20,.34),u_dark);',
  ' float g=(h(gl_FragCoord.xy*.7+u_t)-.5)*.022;',
  ' gl_FragColor=vec4(col+g,1.);',
  '}'].join('\n');

  function field(canvas,dark){
    if(!canvas) return;
    var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
    if(!gl){canvas.style.background=dark
      ?'radial-gradient(120% 120% at 70% 20%, #1B4570 0%, #071A30 72%)'
      :'radial-gradient(120% 120% at 70% 20%, #FFFFFF 0%, #C6D2E0 74%)';return;}
    function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;}
    var pr=gl.createProgram();
    gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){canvas.style.background=dark?'#071A30':'#DCE3EC';return;}
    gl.useProgram(pr);
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var uRes=gl.getUniformLocation(pr,'u_res'),uT=gl.getUniformLocation(pr,'u_t'),
        uM=gl.getUniformLocation(pr,'u_m'),uD=gl.getUniformLocation(pr,'u_dark');
    gl.uniform1f(uD,dark?1:0);
    var mx=.5,my=.5,tx=.5,ty=.5;
    function size(){var d=Math.min(window.devicePixelRatio||1,2);
      var w=canvas.clientWidth||1,h=canvas.clientHeight||1;
      canvas.width=Math.floor(w*d);canvas.height=Math.floor(h*d);
      gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uRes,canvas.width,canvas.height);}
    size();window.addEventListener('resize',size);
    window.addEventListener('pointermove',function(e){
      var r=canvas.getBoundingClientRect();
      tx=(e.clientX-r.left)/Math.max(r.width,1);ty=1-(e.clientY-r.top)/Math.max(r.height,1);
    },{passive:true});
    var t0=performance.now();
    (function loop(now){
      mx+=(tx-mx)*.045;my+=(ty-my)*.045;
      gl.uniform2f(uM,mx,my);gl.uniform1f(uT,reduce?12:(now-t0)/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(!reduce) requestAnimationFrame(loop);
    })(t0);
  }
  /* inner-page heroes and the closing CTA only; the dissolve no longer uses it */
  field(document.getElementById('chrome'),false);
  field(document.getElementById('chrome2'),true);

  /* ---------------- hero line reveal ---------------- */
  var lines=[].slice.call(document.querySelectorAll('[data-l]'));
  if(!reduce){
    lines.forEach(function(el,i){
      el.style.transform='translateY(108%)';
      el.style.transition='transform 1.05s cubic-bezier(.16,1,.3,1) '+(0.10+i*0.1)+'s';
    });
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      lines.forEach(function(el){el.style.transform='none';});});});
  }

  /* ---------------- scroll reveals ---------------- */
  var rv=[].slice.call(document.querySelectorAll('.rv'));
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{threshold:.15,rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){io.observe(el);});
  } else rv.forEach(function(el){el.classList.add('in');});

  /* ---------------- counters ---------------- */
  var nums=[].slice.call(document.querySelectorAll('[data-count]'));
  if('IntersectionObserver' in window && !reduce){
    var io3=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el=e.target,
            end=parseFloat(el.getAttribute('data-count')),
            pre=el.getAttribute('data-prefix')||'',
            suf=el.getAttribute('data-suffix')||'',
            s=null;
        if(isNaN(end)) { io3.unobserve(el); return; }
        function step(ts){
          if(!s)s=ts;
          var p=Math.min((ts-s)/1100,1),e2=1-Math.pow(1-p,3);
          el.textContent=pre+Math.round(end*e2)+suf;
          if(p<1)requestAnimationFrame(step);
        }
        requestAnimationFrame(step);io3.unobserve(el);
      });
    },{threshold:.6});
    nums.forEach(function(el){io3.observe(el);});
  }

  /* ---------------- sticky nav + mobile menu ---------------- */
  var navEl=document.getElementById('siteNav');
  if(navEl){
    var onNavScroll=function(){ navEl.classList.toggle('stuck',window.scrollY>8); };
    window.addEventListener('scroll',onNavScroll,{passive:true});
    onNavScroll();
  }
  var navBtn=document.getElementById('navToggle');
  if(navBtn){
    navBtn.addEventListener('click',function(){
      var open=document.body.classList.toggle('navOpen');
      navBtn.setAttribute('aria-expanded',open?'true':'false');
    });
    /* follow a link and the panel should not stay open behind it */
    [].slice.call(document.querySelectorAll('#primaryNav a')).forEach(function(a){
      a.addEventListener('click',function(){
        document.body.classList.remove('navOpen');
        navBtn.setAttribute('aria-expanded','false');
      });
    });
    window.addEventListener('keydown',function(e){
      if(e.key==='Escape' && document.body.classList.contains('navOpen')){
        document.body.classList.remove('navOpen');
        navBtn.setAttribute('aria-expanded','false');
        navBtn.focus();
      }
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  if(window.matchMedia('(pointer:fine)').matches && !reduce){
    [].slice.call(document.querySelectorAll('[data-mag]')).forEach(function(el){
      el.addEventListener('pointermove',function(e){
        var r=el.getBoundingClientRect();
        el.style.transform='translate('+((e.clientX-r.left-r.width/2)*.28)+'px,'+((e.clientY-r.top-r.height/2)*.38)+'px)';
      });
      el.addEventListener('pointerleave',function(){
        el.style.transition='transform .5s cubic-bezier(.2,.8,.2,1)';el.style.transform='none';
        setTimeout(function(){el.style.transition='';},500);});
    });
  }
})();


/* ===================== THE DISSOLVE, IN THE HERO =====================
   A local results page for "SEO company Jupiter, FL" is drawn to an offscreen
   canvas and sampled into particles. The question a buyer now asks a model is
   drawn the same way. Scroll flies every particle from one to the other. */
(function(){
  var sec=document.getElementById('heroSeq'), cv=document.getElementById('morph');
  if(!sec||!cv) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}

  /* ---- the results page, sampled from the REAL DOM text ----
     Every line in the markup is its own span, so each one maps to a single
     fillText at the exact place the browser laid it out. The particles are
     therefore born pixel-aligned with the crisp text they replace. ---- */
  function drawSerpFromDOM(c,w,h){
    var serp=document.getElementById('serp');
    var stage=document.querySelector('.hstage');
    if(!serp||!stage) return;
    var sb=stage.getBoundingClientRect();
    c.textBaseline='top';

    var bar=document.getElementById('sbar');
    if(bar){
      var br=bar.getBoundingClientRect();
      if(br.width){
        c.strokeStyle='#cfd3da';c.lineWidth=1.5;
        rr(c,br.left-sb.left,br.top-sb.top,br.width,br.height,br.height/2);c.stroke();
      }
    }

    var favs=serp.querySelectorAll('.fav');
    for(var f=0;f<favs.length;f++){
      var fr=favs[f].getBoundingClientRect();
      if(!fr.width) continue;
      c.fillStyle='#c0c5cf';
      c.beginPath();
      c.arc(fr.left-sb.left+fr.width/2, fr.top-sb.top+fr.height/2, fr.width/2, 0, Math.PI*2);
      c.fill();
    }

    var nodes=serp.querySelectorAll('[data-t]');
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i], r=n.getBoundingClientRect();
      if(!r.width) continue;
      var cs=getComputedStyle(n);
      var fam=cs.fontFamily||'Arial, sans-serif';
      var size=parseFloat(cs.fontSize)||14;
      var lead=(parseFloat(cs.lineHeight)||size*1.3);
      c.font=(cs.fontWeight||'400')+' '+size+'px '+fam;
      c.fillStyle=cs.color||'#202124';
      c.fillText(n.textContent, r.left-sb.left, r.top-sb.top+Math.max((lead-size)/2,0));
    }
  }

  /* ---- the question, measured off the real DOM, word by word ---- */
  function drawQuestionFromDOM(c,w,h){
    var q=document.getElementById('qtext');
    var stage=document.querySelector('.hstage');
    if(!q||!stage) return;
    var sb=stage.getBoundingClientRect();
    c.textBaseline='top';
    var words=q.querySelectorAll('[data-q]');
    for(var i=0;i<words.length;i++){
      var n=words[i], r=n.getBoundingClientRect();
      if(!r.width) continue;
      var cs=getComputedStyle(n);
      var size=parseFloat(cs.fontSize)||32;
      var lead=parseFloat(cs.lineHeight)||size*1.24;
      var padL=parseFloat(cs.paddingLeft)||0, padT=parseFloat(cs.paddingTop)||0;
      var x=r.left-sb.left, y=r.top-sb.top;
      if(cs.backgroundColor && cs.backgroundColor!=='rgba(0, 0, 0, 0)'){
        c.fillStyle=cs.backgroundColor;
        rr(c,x,y,r.width,r.height,parseFloat(cs.borderRadius)||8);c.fill();
      }
      c.font=(cs.fontWeight||'700')+' '+size+'px '+(cs.fontFamily||'sans-serif');
      c.fillStyle=cs.color||'#08080A';
      c.fillText(n.textContent, x+padL, y+padT+Math.max((lead-size)/2,0));
    }
  }

  function sample(fn,w,h,step){
    var o=document.createElement('canvas');o.width=w;o.height=h;
    var c=o.getContext('2d');fn(c,w,h);
    var d=c.getImageData(0,0,w,h).data,pts=[];
    for(var y=0;y<h;y+=step){
      for(var x=0;x<w;x+=step){
        var i=(y*w+x)*4;
        if(d[i+3]>140) pts.push([x,y,d[i],d[i+1],d[i+2]]);
      }
    }
    return pts;
  }
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=(Math.random()*(i+1))|0,t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}

  /* ---- three markets, rotating, so the hero is not only one query ---- */
  var SETS=[
    {q:'seo company jupiter fl',
     ask:['Who','is','the','best','SEO','company','in'], mark:'Jupiter, FL?',
     res:[
      {u:'clutch.co \u203a fl \u203a jupiter \u203a seo', t:'Top 10 SEO Companies in Jupiter, FL (2026)',
       s:['Verified reviews, pricing ranges and minimum project','sizes for agencies serving Palm Beach County.']},
      {u:'palmbeachdigital.com \u203a seo-services', t:'Jupiter SEO Services for Local Business',
       s:['Local rankings, Google Business Profile management','and monthly reporting for small teams.']},
      {u:'yelp.com \u203a search \u203a seo-jupiter-fl', t:'Best SEO Companies near Jupiter, Florida',
       s:['Nineteen listings with star ratings, photos and hours.','Sorted by recommended.']},
      {u:'searchfirmfl.com \u203a locations \u203a jupiter', t:'SEO Agency Serving Jupiter and Palm Beach Gardens',
       s:['Free site audit, no long-term contracts and a dedicated','account manager on every account.']}]},

    {q:'managed it services palm beach gardens',
     ask:['Who','should','we','shortlist','for','managed','IT','in'], mark:'Palm Beach?',
     res:[
      {u:'techlist.io \u203a fl \u203a palm-beach \u203a msp', t:'Top Managed IT Providers in Palm Beach (2026)',
       s:['Side by side comparison of response times, contract','lengths and after-hours coverage.']},
      {u:'coastalitpartners.com \u203a services', t:'Managed IT and Cybersecurity for Florida Business',
       s:['Helpdesk, backup, compliance and monitoring for','teams of ten to two hundred people.']},
      {u:'reddit.com \u203a r/msp \u203a comments', t:'Anyone using a local MSP in Palm Beach County?',
       s:['Forty-two replies from operators comparing quotes','and onboarding experiences.']},
      {u:'securenetfl.com \u203a locations \u203a palm-beach', t:'IT Support Serving Palm Beach Gardens and Jupiter',
       s:['Free network assessment, flat monthly pricing and','a named engineer on every account.']}]},

    {q:'fleet telematics for small fleets',
     ask:['Which','telematics','provider','fits','a'], mark:'60 vehicle fleet?',
     res:[
      {u:'fleetreview.com \u203a guides \u203a telematics', t:'Best Fleet Telematics Platforms for Small Fleets',
       s:['We tested installation, reporting depth and contract','terms across eleven vendors.']},
      {u:'trackwisefleet.com \u203a platform', t:'GPS Tracking and Driver Safety in One Dashboard',
       s:['Live location, driver scoring and maintenance alerts','with a two week rollout.']},
      {u:'g2.com \u203a categories \u203a fleet-management', t:'Fleet Management Software Reviews and Pricing',
       s:['Verified user reviews, feature grids and pricing','ranges for mid-market buyers.']},
      {u:'forum.fleetops.com \u203a thread \u203a 88214', t:'Worth switching telematics providers mid-contract?',
       s:['Thirty-one replies from operators running forty to','four hundred vehicles.']}]}
  ];
  var si=0;

  function applySet(i){
    var set=SETS[i];
    var bar=document.querySelector('#sbar span');
    if(bar) bar.textContent=set.q;
    var res=document.querySelectorAll('#serp .res');
    for(var r=0;r<res.length;r++){
      var d=set.res[r]; if(!d) continue;
      var u=res[r].querySelector('.rurl span[data-t]'); if(u) u.textContent=d.u;
      var t=res[r].querySelector('.rtitle span'); if(t) t.textContent=d.t;
      var sn=res[r].querySelectorAll('.rsnip span');
      for(var k=0;k<sn.length;k++) sn[k].textContent=d.s[k]||'';
    }
    var qp=document.querySelector('#qtext p');
    if(qp){
      var html='';
      for(var w=0;w<set.ask.length;w++) html+='<span data-q>'+set.ask[w]+'</span> ';
      qp.innerHTML=html+'<span data-q class="mk">'+set.mark+'</span>';
    }
  }

  var W=0,H=0,DPR=1,img=null,blank=null,P=[],ready=false,blk=3;

  function build(){
    W=Math.max(cv.clientWidth,320);H=Math.max(cv.clientHeight,320);
    DPR=Math.min(window.devicePixelRatio||1,1.5);
    cv.width=Math.floor(W*DPR);cv.height=Math.floor(H*DPR);
    blk=Math.max(2,Math.ceil(3*DPR*0.98));
    img=ctx.createImageData(cv.width,cv.height);
    blank=new Uint8ClampedArray(img.data.length);
    var A=shuffle(sample(drawSerpFromDOM,W,H,3));
    var B=shuffle(sample(drawQuestionFromDOM,W,H,3));
    if(!A.length||!B.length){ready=false;return;}
    while(B.length>9500) B=B.filter(function(_,i){return i%2===0;});
    while(A.length>9500) A=A.filter(function(_,i){return i%2===0;});
    var n=Math.min(Math.max(A.length,B.length),9500);
    P=new Array(n);
    for(var k=0;k<n;k++){
      var a=A[k%A.length],b=B[k%B.length];
      var ang=Math.random()*Math.PI*2,rad=70+Math.random()*Math.min(W,H)*0.42;
      P[k]={sx:a[0],sy:a[1],sr:a[2],sg:a[3],sb:a[4],
            tx:b[0],ty:b[1],tr:b[2],tg:b[3],tb:b[4],
            cx:(a[0]+b[0])/2+Math.cos(ang)*rad,
            cy:(a[1]+b[1])/2+Math.sin(ang)*rad*0.66,
            d:Math.random()*0.42};
    }
    ready=true;
  }

  function paint(prog){
    if(!ready) return;
    img.data.set(blank);
    var data=img.data,cw=cv.width,ch=cv.height;
    var local=Math.min(Math.max((prog-0.18)/0.70,0),1);
    for(var i=0;i<P.length;i++){
      var p=P[i];
      var t=Math.min(Math.max((local-p.d)/(1-0.42),0),1),e=ease(t),m=1-e;
      var x=m*m*p.sx+2*m*e*p.cx+e*e*p.tx;
      var y=m*m*p.sy+2*m*e*p.cy+e*e*p.ty;
      var r=(p.sr+(p.tr-p.sr)*e)|0,g=(p.sg+(p.tg-p.sg)*e)|0,b=(p.sb+(p.tb-p.sb)*e)|0;
      var px=(x*DPR)|0,py=(y*DPR)|0;
      for(var oy=0;oy<blk;oy++){
        var yy=py+oy;if(yy<0||yy>=ch)continue;
        var row=yy*cw;
        for(var ox=0;ox<blk;ox++){
          var xx=px+ox;if(xx<0||xx>=cw)continue;
          var id=(row+xx)*4;
          data[id]=r;data[id+1]=g;data[id+2]=b;data[id+3]=255;
        }
      }
    }
    ctx.putImageData(img,0,0);
  }

  var cites=document.getElementById('dcites'),
      title=document.getElementById('htitle'),
      bg=document.getElementById('hbg'),
      serpEl=document.getElementById('serp'),
      qEl=document.getElementById('qtext'),
      shown=-1,raf=0,target=0,cur=0;

  function setStage(local){
    var started = local>0.004, landed = local>0.984;
    if(serpEl) serpEl.style.opacity = started ? '0' : '1';
    if(qEl) qEl.style.opacity = landed ? '1' : '0';
    cv.style.opacity = (started && !landed) ? '1' : '0';
    var idx = local<0.06 ? 0 : (local<0.74 ? 1 : 2);
    if(idx!==shown){
      shown=idx;
      if(title) title.classList.toggle('out', idx>0);
    }

    if(cites) cites.classList.toggle('is-on', local>0.92);
    /* the colour behind the answer settles in as the last particles land */
    if(bg) bg.style.opacity = String(Math.max(0,Math.min((local-0.68)/0.28,1)));
  }

  function progress(){
    var r=sec.getBoundingClientRect();
    var span=Math.max(r.height-window.innerHeight,1);
    return Math.min(Math.max(-r.top/span,0),1);
  }
  function tick(){
    cur+=(target-cur)*0.12;
    if(Math.abs(target-cur)<0.0004) cur=target;
    paint(cur);
    raf=Math.abs(target-cur)>0.0002?requestAnimationFrame(tick):0;
  }
  function onScroll(){
    var r=sec.getBoundingClientRect();
    if(r.bottom<-200||r.top>window.innerHeight+200) return;
    var pr=progress();
    setStage(Math.min(Math.max((pr-0.18)/0.70,0),1));
    target=pr;
    if(!raf) raf=requestAnimationFrame(tick);
  }
  function boot(){
    build();
    if(reduce){paint(1);setStage(1);if(cites)cites.classList.add('is-on');cv.style.opacity='0';
      if(serpEl)serpEl.style.opacity='0';if(qEl)qEl.style.opacity='1';
      if(bg)bg.style.opacity='1';return;}
    paint(0);setStage(0);
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    /* Query rotation is available but OFF: the hero stays on the target term.
       To rotate through SETS, call applySet(i) on a timer here. */
  }
  var t=null;
  window.addEventListener('resize',function(){
    clearTimeout(t);t=setTimeout(function(){build();paint(cur);},220);
  });
  var booted=false;
  function go(){ if(booted) return; booted=true; boot(); }
  /* boot on whichever happens first, then resample once the real faces land
     so the particles match the text the browser finally drew */
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(function(){
      if(booted){ build(); paint(cur); } else go();
    }).catch(go);
  }
  window.addEventListener('load',go);
  setTimeout(go,1200);
})();


/* ============ THE LENS + CRAWLER VIEW ============
   The lens reveals the machine-readable layer under the design, wherever the
   cursor is. The switch flips the whole page into that layer. ============== */
(function(){
  var sec=document.getElementById('svc'), lx=document.getElementById('lensX');
  var fine=window.matchMedia&&window.matchMedia('(pointer:fine)').matches;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(sec&&lx&&fine&&!reduce){
    var R=Math.max(120,Math.min(190,window.innerWidth*0.11));
    sec.addEventListener('pointerenter',function(){ lx.style.transition=''; });
    sec.addEventListener('pointermove',function(e){
      var r=sec.getBoundingClientRect();
      lx.style.clipPath='circle('+R+'px at '+(e.clientX-r.left)+'px '+(e.clientY-r.top)+'px)';
    },{passive:true});
    sec.addEventListener('pointerleave',function(){
      lx.style.transition='clip-path .3s cubic-bezier(.2,.8,.2,1)';
      lx.style.clipPath='circle(0px at -200px -200px)';
    });
    window.addEventListener('resize',function(){
      R=Math.max(120,Math.min(190,window.innerWidth*0.11));
    });
  }

  var btn=document.getElementById('vmode');
  if(btn){
    btn.addEventListener('click',function(){
      var on=document.body.classList.toggle('crawl');
      btn.setAttribute('aria-pressed',on?'true':'false');
      btn.textContent=on?'Human view':'Crawler view';
      /* the particle fields sample computed colours, so rebuild them */
      window.dispatchEvent(new Event('resize'));
    });
  }
})();
