(function(){
  var d=document, body=d.body, root=d.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var mqMobile=window.matchMedia('(max-width:760px)');
  function $(id){ return d.getElementById(id); }
  function all(sel,ctx){ return [].slice.call((ctx||d).querySelectorAll(sel)); }

  /* ================= page init (real URLs) ================= */
  var PRODUCT={'/clark-app':1,'/clark-atlas':1,'/clark-pod':1};
  function pathOf(href){ var u=d.createElement('a'); u.href=href; var p=u.pathname.replace(/\.html$/,'').replace(/\/index$/,'/'); if(p.length>1) p=p.replace(/\/$/,''); return p; }
  var current=pathOf(location.href);
  function samePage(href){ return pathOf(href)===current; }
  function stickyOffset(){
    if(body.classList.contains('r-home')) return $('gnav').offsetHeight;
    var ln=d.querySelector('.lnav'); return ln?ln.offsetHeight:0;
  }
  function goTo(id,instant){
    var el=$(id); if(!el) return;
    var y=el.getBoundingClientRect().top+window.pageYOffset-stickyOffset()+1;
    if(reduce||instant){ root.style.scrollBehavior='auto'; window.scrollTo(0,y); root.style.scrollBehavior=''; }
    else window.scrollTo({top:y,behavior:'smooth'});
  }
  d.addEventListener('click',function(e){
    var t=e.target.closest('a[data-top]');
    if(t && samePage(t.href)){ e.preventDefault(); window.scrollTo({top:0,behavior:reduce?'auto':'smooth'}); }
  });
  d.addEventListener('click',function(e){
    var a=e.target.closest('a[data-scroll]'); if(!a) return;
    if(!samePage(a.href)) return;
    e.preventDefault(); closeDD(); closeMenu(); goTo(a.getAttribute('data-scroll'));
  });
  function init(){
    all('.gnav nav a[data-route]').forEach(function(a){ if(a.getAttribute('data-route')===current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    $('ddBtn').classList.toggle('cur',!!PRODUCT[current]);
    reveal.rescan();
    stories.measure();
    window.dispatchEvent(new Event('resize'));
    if(location.hash && location.hash.length>1){ var id=location.hash.slice(1); if($(id)){ goTo(id,true); setTimeout(function(){ goTo(id,true); },350); } }
  }

  /* ================= products menu ================= */
  var ddBtn=$('ddBtn'), dd=$('dd'), ddOpen=false, hoverT=0;
  function openDD(){ ddOpen=true; dd.classList.add('open'); ddBtn.setAttribute('aria-expanded','true'); $('gnav').classList.remove('on-dark'); }
  function closeDD(){ ddOpen=false; dd.classList.remove('open'); ddBtn.setAttribute('aria-expanded','false'); if(window.__tone) window.__tone(); }
  ddBtn.addEventListener('click',function(e){
    if(fine && e.detail>0){ if(!ddOpen) openDD(); return; }
    ddOpen?closeDD():openDD();
  });
  [dd,ddBtn].forEach(function(el){ el.addEventListener('focusout',function(){ setTimeout(function(){
    var a=d.activeElement; if(ddOpen && !(dd.contains(a)||a===ddBtn) && !dd.matches(':hover') && !ddBtn.matches(':hover')) closeDD();
  },0); }); });
  if(fine){
    ddBtn.addEventListener('mouseenter',function(){ clearTimeout(hoverT); openDD(); });
    ddBtn.addEventListener('mouseleave',function(){ hoverT=setTimeout(closeDD,240); });
    dd.addEventListener('mouseenter',function(){ clearTimeout(hoverT); });
    dd.addEventListener('mouseleave',function(){ hoverT=setTimeout(closeDD,240); });
  }
  d.addEventListener('click',function(e){ if(ddOpen&&!e.target.closest('#dd')&&!e.target.closest('#ddBtn')) closeDD(); });
  dd.addEventListener('click',function(e){ if(e.target.closest('a')) closeDD(); });
  d.addEventListener('keydown',function(e){ if(e.key!=='Escape') return; if(ddOpen){ closeDD(); ddBtn.focus(); } if($('mmenu').classList.contains('open')){ closeMenu(); $('navToggle').focus(); } });

  /* ================= mobile menu ================= */
  var nt=$('navToggle'), mm=$('mmenu'), acc=$('mmAcc'), sub=$('mmSub');
  function closeMenu(){ mm.classList.remove('open'); nt.setAttribute('aria-expanded','false'); nt.setAttribute('aria-label','Open menu'); }
  nt.addEventListener('click',function(){ var o=mm.classList.toggle('open'); nt.setAttribute('aria-expanded',o?'true':'false'); nt.setAttribute('aria-label',o?'Close menu':'Open menu'); });
  acc.addEventListener('click',function(){ var o=sub.classList.toggle('open'); acc.setAttribute('aria-expanded',o?'true':'false'); acc.querySelector('span').textContent=o?'−':'+'; });
  mm.addEventListener('click',function(e){ if(e.target.closest('a')) closeMenu(); });

  /* ================= reveal: visible at rest, below-the-fold blocks float in ================= */
  var reveal=(function(){
    var io=null;
    if('IntersectionObserver' in window && !reduce){
      io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pending'); io.unobserve(e.target); } }); },{rootMargin:'0px 0px -6% 0px'});
    }
    function rescan(){
      if(!io) return;
      all('.page:not([hidden]) .rv:not(.seen)').forEach(function(el){
        el.classList.add('seen');
        if(el.getBoundingClientRect().top>window.innerHeight*0.94){ el.classList.add('pending'); io.observe(el); }
      });
    }
    function sweep(){ all('.rv.pending').forEach(function(el){ if(el.offsetParent!==null && el.getBoundingClientRect().top<window.innerHeight*0.9){ el.classList.remove('pending'); if(io) io.unobserve(el); } }); }
    window.addEventListener('beforeprint',function(){ all('.rv.pending').forEach(function(el){ el.classList.remove('pending'); }); });
    return {rescan:rescan,sweep:sweep};
  })();

  /* ================= stories: scrolly steps, the ATLAS map, the POD van ================= */
  var stories=(function(){
    var groups=all('[data-scrolly]').map(function(g){ return {el:g,kind:g.getAttribute('data-scrolly'),steps:all('.sstep',g),idx:-1}; });
    var pushT=0, countRaf=0;
    var amap=d.querySelector('.amap-wrap'), score=$('scoreNum'), van=$('van');
    if(amap) amap.classList.add('pre');
    if(van) van.classList.add('arm');
    function countTo(to){
      cancelAnimationFrame(countRaf);
      if(reduce){ score.textContent=to; return; }
      var t0=0, dur=1400;
      function f(t){ if(!t0) t0=t; var p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3); score.textContent=Math.round(to*e); if(p<1) countRaf=requestAnimationFrame(f); }
      score.textContent='0'; setTimeout(function(){ countRaf=requestAnimationFrame(f); },200);
    }
    function apply(G,i){
      if(G.idx===i) return;
      G.idx=i;
      G.steps.forEach(function(s,k){ s.classList.toggle('on',k===i); });
      if(G.kind==='app'){
        all('.story-phone .scr img',G.el).forEach(function(im,k){ im.classList.toggle('on',k===i); });
        var push=G.el.querySelector('.push'); clearTimeout(pushT);
        if(i===2){ pushT=setTimeout(function(){ push.classList.add('on'); },reduce?0:650); } else { push.classList.remove('on'); }
      }
      if(G.kind==='atlas' && amap){
        amap.setAttribute('data-s',String(i));
        if(i===3) countTo(60); else { cancelAnimationFrame(countRaf); score.textContent='0'; }
      }
    }
    var gnav=$('gnav');
    function darkAt(y){
      var el=d.elementFromPoint(Math.min(40,window.innerWidth-1),y);
      return !!(el && el.closest('.navy,.cta,.hero,.pod-hero,footer'));
    }
    function navTone(){
      if(!$('dm').hidden) return;
      if($('dd').classList.contains('open')){ gnav.classList.remove('on-dark'); }
      else if(body.classList.contains('r-home')){ gnav.classList.toggle('on-dark',darkAt(gnav.getBoundingClientRect().bottom+2)); }
      else gnav.classList.toggle('on-dark',current==='/clark-pod');
      var ln=d.querySelector('.page:not([hidden]) .lnav');
      if(ln){ ln.classList.toggle('on-dark',darkAt(ln.getBoundingClientRect().bottom+2)); }
    }
    window.__tone=function(){ navTone(); };
    function measure(){
      var vh=window.innerHeight, m=mqMobile.matches;
      groups.forEach(function(G){
        if(G.el.offsetParent===null) return;
        var i=0;
        if(m){
          /* phones: the visual sticks on top, text scrolls through the band below it */
          var sb=G.el.querySelector('.scrolly-stage').getBoundingClientRect().bottom;
          var line=Math.min(sb+Math.max(0,vh-sb)*0.7,vh);
          G.steps.forEach(function(s,k){ if(s.getBoundingClientRect().top<line) i=k; });
        } else {
          /* wider screens: the step nearest the middle of the window leads */
          var best=1e9;
          G.steps.forEach(function(s,k){ var r=s.getBoundingClientRect(), dist=Math.abs(r.top+r.height*0.5-vh*0.5); if(dist<best){ best=dist; i=k; } });
        }
        apply(G,i);
      });
      navTone();
      if(amap && amap.offsetParent!==null && amap.classList.contains('pre')){
        var ar=amap.getBoundingClientRect(); if(ar.top<vh*0.82 && ar.bottom>0) amap.classList.remove('pre');
      }
      if(van && van.offsetParent!==null && !van.classList.contains('in')){
        var vr=van.getBoundingClientRect(); if(vr.top<vh*0.88 && vr.bottom>0) van.classList.add('in');
      }
      reveal.sweep();
    }
    function reset(){
      groups.forEach(function(G){ G.idx=-1; });
      if(amap){ amap.classList.add('pre'); amap.setAttribute('data-s','0'); }
      if(van) van.classList.remove('in');
      if(score) score.textContent='0';
    }
    var ticking=false;
    function onScroll(){ if(ticking) return; ticking=true; requestAnimationFrame(function(){ ticking=false; measure(); }); }
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    return {measure:measure,reset:reset};
  })();

  /* ================= before and after ================= */
  (function(){
    var ba=$('ba'), range=$('baRange'); if(!ba) return;
    function setPos(p){ p=Math.max(0,Math.min(100,p)); ba.style.setProperty('--pos',p+'%'); range.value=Math.round(p); }
    range.addEventListener('input',function(){ setPos(+range.value); });
    var drag=null;
    function at(e){ var r=ba.getBoundingClientRect(); return (e.clientX-r.left)/r.width*100; }
    ba.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse' && e.button!==0) return;
      drag={id:e.pointerId,x:e.clientX,moved:false,touch:e.pointerType!=='mouse'};
      try{ ba.setPointerCapture(e.pointerId); }catch(_){}
      if(!drag.touch){ setPos(at(e)); e.preventDefault(); }
    });
    ba.addEventListener('pointermove',function(e){ if(!drag||e.pointerId!==drag.id) return; if(Math.abs(e.clientX-drag.x)>3) drag.moved=true; setPos(at(e)); });
    function end(e){ if(!drag) return; if(e.type==='pointerup' && drag.touch && !drag.moved) setPos(at(e)); drag=null; }
    ba.addEventListener('pointerup',end); ba.addEventListener('pointercancel',function(){ drag=null; });
  })();

  /* ================= demo sheet ================= */
  (function(){
    var dm=$('dm'), bd=$('dmBackdrop'), form=$('dmForm'), stepForm=$('dmStepForm'), stepDone=$('dmStepDone'), submit=$('dmSubmit');
    var picked=null, lastFocus=null, label='Book the demo', closeT=0, alt=$('slotAlt'), ENDPOINT='https://formsubmit.co/ajax/support@teaforstreets.app';
    function open(btn){
      clearTimeout(closeT);
      $('dmTitle').textContent=btn.getAttribute('data-t')||'See CLARK on your streets.';
      $('dmSub').textContent=btn.getAttribute('data-s')||'Twenty minutes on a video call.';
      label=btn.getAttribute('data-b')||'Book the demo'; submit.textContent=label;
      $('dmKicker').textContent=(btn.textContent||'Book a demo').trim();
      stepDone.hidden=true; stepForm.hidden=false; submit.disabled=false; $('dmErr').classList.remove('on');
      lastFocus=d.activeElement; dm.hidden=false; bd.hidden=false; void dm.offsetWidth;
      dm.classList.add('on'); bd.classList.add('on'); body.style.overflow='hidden';
      closeDD(); closeMenu(); dm.focus();
      try{ if(window.goatcounter&&window.goatcounter.count) window.goatcounter.count({path:'/demo-open',title:'Demo sheet opened',event:true}); }catch(x){}
    }
    function close(){
      dm.classList.remove('on'); bd.classList.remove('on'); body.style.overflow='';
      closeT=setTimeout(function(){ dm.hidden=true; bd.hidden=true; },320);
      if(lastFocus&&lastFocus.focus) lastFocus.focus();
    }
    d.addEventListener('click',function(e){ var b=e.target.closest('.dm-open'); if(b){ e.preventDefault(); open(b); } });
    $('dmClose').addEventListener('click',close); bd.addEventListener('click',close);
    d.addEventListener('keydown',function(e){
      if(dm.hidden) return;
      if(e.key==='Escape'){ close(); return; }
      if(e.key==='Tab'){
        var f=all('button:not([disabled]),input,[href]',dm).filter(function(x){ return x.offsetParent!==null; });
        if(!f.length) return;
        var first=f[0], last=f[f.length-1];
        if(e.shiftKey && (d.activeElement===first||d.activeElement===dm)){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && d.activeElement===last){ e.preventDefault(); first.focus(); }
      }
    });
    $('dmDone').addEventListener('click',close);
    var days=$('days'), dt=new Date(), list=[];
    while(list.length<5){ dt.setDate(dt.getDate()+1); if(dt.getDay()!==0&&dt.getDay()!==6) list.push(new Date(dt)); }
    var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    list.forEach(function(day){
      var card=d.createElement('div'); card.className='day';
      card.innerHTML='<span class="dw">'+DOW[day.getDay()]+'</span><span class="dn">'+day.getDate()+'</span>';
      ['1:00 PM','2:00 PM'].forEach(function(tm){
        var b=d.createElement('button'); b.type='button'; b.className='slot'; b.textContent=tm.replace(':00','');
        b.setAttribute('aria-label',DOW[day.getDay()]+' '+MON[day.getMonth()]+' '+day.getDate()+' at '+tm+' Pacific');
        b.addEventListener('click',function(){ all('.slot',days).forEach(function(s){ s.classList.remove('on'); s.removeAttribute('aria-pressed'); }); alt.classList.remove('on'); alt.setAttribute('aria-pressed','false'); b.classList.add('on'); b.setAttribute('aria-pressed','true'); picked=DOW[day.getDay()]+', '+MON[day.getMonth()]+' '+day.getDate()+' at '+tm+' PT'; $('dmErr').classList.remove('on'); });
        card.appendChild(b);
      });
      days.appendChild(card);
    });
    alt.addEventListener('click',function(){
      all('.slot',days).forEach(function(s){ s.classList.remove('on'); s.removeAttribute('aria-pressed'); });
      var on=!alt.classList.contains('on'); alt.classList.toggle('on',on); alt.setAttribute('aria-pressed',on?'true':'false');
      picked=on?'ALT':null; $('dmErr').classList.remove('on');
    });
    function err(msg){ var e=$('dmErr'); e.textContent=msg; e.classList.add('on'); }
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var name=$('dmName'), email=$('dmEmail'), addr=$('dmAddr');
      $('dmErr').classList.remove('on');
      var okN=!!name.value.trim(), okE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      $('fName').classList.toggle('bad',!okN); $('fEmail').classList.toggle('bad',!okE);
      if(!picked){ err('Pick a time, or let us email you a few.'); days.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'}); return; }
      if(!okN||!okE){ err('Add your name and a work email so the invite has somewhere to go.'); return; }
      submit.disabled=true; submit.textContent='Sending…';
      var roleEl=form.querySelector('input[name=role]:checked'), role=roleEl?roleEl.value:'';
      var when=picked==='ALT'?'None of the offered times; email a few options':picked;
      var a=addr.value.trim();
      var payload={ name:name.value.trim(), email:email.value.trim(), organization_type:role, requested_time:when, address:a||'(none given)', request:label, page:location.href,
        _subject:label+': '+role+' · '+when, _replyto:email.value.trim(), _template:'table', _captcha:'false', _honey:form.querySelector('[name=_honey]').value };
      function done(){
        $('dmWhen').textContent=picked==='ALT'?"We'll email you a few times that work.":picked;
        var at=$('dmAt');
        if(a){ at.textContent="We'll have "+a+" ready on the call."; at.hidden=false; } else { at.hidden=true; }
        stepForm.hidden=true; stepDone.hidden=false; submit.textContent=label; dm.focus();
      }
      fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){ if(!r.ok) throw new Error('bad status'); return r.json().catch(function(){ return {}; }); })
        .then(function(){
          try{ if(window.goatcounter&&window.goatcounter.count) window.goatcounter.count({path:'/demo-request',title:'Demo request',event:true}); }catch(x){}
          done();
        })
        .catch(function(){
          var bodyTxt=label+'\n\nName: '+payload.name+'\nEmail: '+payload.email+'\nOrganization type: '+role+'\nRequested time: '+when+'\nAddress: '+payload.address+'\nPage: '+payload.page+'\n';
          location.href='mailto:support@teaforstreets.app?subject='+encodeURIComponent(payload._subject)+'&body='+encodeURIComponent(bodyTxt);
          err('Our form relay did not answer, so we opened your mail app with the request filled in. Send it and we will confirm.');
        })
        .then(function(){ submit.disabled=false; submit.textContent=label; });
    });
  })();

  /* ================= films: autoplay in view, tap to pause, full screen ================= */
  var SCENES=[[0,'Human report','One sentence, filed and followed.'],[7.7,'Auto capture','The idea behind CLARK POD. Concept.'],[15.1,'Delivery robot','Sidewalks, on every run. Concept.'],[22.5,'CLARK POD','Street condition from a truck route. Concept.']];
  all('.film').forEach(function(f){
    var v=f.querySelector('video'), bp=f.querySelector('.film-play'), bf=f.querySelector('.film-full'), chip=f.querySelector('.scene-chip'), userPaused=false, cur=-1, swapT=0;
    if(!v) return;
    function sync(){ var p=v.paused; f.classList.toggle('paused',p); if(bp) bp.setAttribute('aria-label',p?'Play the film':'Pause the film'); }
    function play(){ var r=v.play(); if(r&&r.catch) r.catch(function(){ sync(); }); }
    v.addEventListener('play',sync); v.addEventListener('pause',sync);
    function toggle(){ if(v.paused){ userPaused=false; play(); } else { userPaused=true; v.pause(); } }
    if(bp) bp.addEventListener('click',toggle);
    v.addEventListener('click',toggle);
    if(bf) bf.addEventListener('click',function(){
      var done=function(){ play(); };
      try{
        if(v.requestFullscreen){ v.requestFullscreen().then(done,function(){ window.open(v.currentSrc||v.src,'_blank','noopener'); }); return; }
        if(v.webkitEnterFullscreen){ v.webkitEnterFullscreen(); done(); return; }
      }catch(_){}
      window.open(v.currentSrc||v.src,'_blank','noopener');
    });
    if(chip){
      v.addEventListener('timeupdate',function(){
        var t=v.currentTime, i=0; for(var k=0;k<SCENES.length;k++){ if(t>=SCENES[k][0]) i=k; }
        if(i===cur) return; cur=i;
        clearTimeout(swapT); chip.classList.add('swap');
        swapT=setTimeout(function(){ chip.querySelector('b').textContent=SCENES[i][1]; chip.querySelector('span').textContent=SCENES[i][2]; chip.classList.remove('swap'); },reduce?0:300);
      });
    }
    sync();
    if(reduce) return;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.intersectionRatio>=0.5){ if(v.paused && !userPaused) play(); }
        else if(e.intersectionRatio<0.15 && !v.paused){ v.pause(); }
      }); },{threshold:[0,0.15,0.5]}).observe(f);
    }
  });

  init();
})();
/* home hero: the animated, pointer-reactive point cloud from the live homepage */
(function(){
  var c=document.getElementById('heroCanvas'); if(!c||!c.getContext) return;
  var ctx=c.getContext('2d'), reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches, hero=document.querySelector('.hero');
  var PAL=[[42,35,80],[47,95,168],[31,158,138],[111,191,74],[232,226,75]];
  function col(e){ e=e<0?0:e>1?1:e; var s=e*4,i=s|0,t=s-i,a=PAL[i],b=PAL[i<4?i+1:4]; return 'rgb('+((a[0]+(b[0]-a[0])*t)|0)+','+((a[1]+(b[1]-a[1])*t)|0)+','+((a[2]+(b[2]-a[2])*t)|0)+')'; }
  var W=0,H=0,DPR=1,pts=[],raf=0,run=false,last=0,mx=-9999,my=-9999,tpx=0,tpy=0,pmx=0,pmy=0,REP=95,REPF=30;
  function size(){ DPR=Math.min(window.devicePixelRatio||1,2); W=c.clientWidth; H=c.clientHeight; c.width=Math.max(1,W*DPR); c.height=Math.max(1,H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0); }
  function build(){ var n=Math.max(450,Math.min(1700,(W*H/820)|0)); pts=[]; for(var i=0;i<n;i++){ var x,y,e; if(i<n*0.72){ var yy=Math.pow(Math.random(),0.7); y=0.42+yy*0.56; e=(0.98-y)/0.56+(Math.random()-0.5)*0.1; } else { var tt=Math.random(); y=0.40-tt*0.22+(Math.random()-0.5)*0.05; e=0.62+tt*0.4; } x=-0.03+Math.random()*1.06; pts.push({x:x,y:y,e:e<0?0:e>1?1:e,ph:Math.random()*6.283,sp:0.3+Math.random()*0.8,dx:0,dy:0}); } }
  function frame(ts){ var dt=Math.min(50,ts-last); last=ts; ctx.clearRect(0,0,W,H); pmx+=(tpx-pmx)*0.06; pmy+=(tpy-pmy)*0.06;
    for(var k=0;k<pts.length;k++){ var p=pts[k];
      if(!reduce){ p.x+=0.000016*dt*p.sp; if(p.x>1.03) p.x-=1.06; p.ph+=0.0016*dt; }
      var bx=p.x*W+pmx*(8+p.e*18), by=(p.y+(reduce?0:0.003*Math.sin(p.ph)))*H+pmy*(6+p.e*14);
      if(!reduce){ var ax=bx-mx, ay=by-my, d2=ax*ax+ay*ay, tx=0, ty=0; if(d2<REP*REP){ var dd=Math.sqrt(d2)||1, f=(1-dd/REP)*REPF; tx=ax/dd*f; ty=ay/dd*f; } p.dx+=(tx-p.dx)*0.16; p.dy+=(ty-p.dy)*0.16; }
      var tw=reduce?1:0.6+0.4*Math.sin(p.ph);
      ctx.globalAlpha=(0.3+0.55*p.e)*tw; ctx.fillStyle=col(p.e); var r=p.e<0.6?1:1.7;
      ctx.fillRect(bx+p.dx,by+p.dy,r,r);
    }
    ctx.globalAlpha=1; if(!reduce&&run) raf=requestAnimationFrame(frame);
  }
  function start(){ if(run) return; run=true; last=performance.now(); if(reduce) frame(performance.now()); else raf=requestAnimationFrame(frame); }
  function stop(){ run=false; cancelAnimationFrame(raf); }
  size(); build(); start();
  if(!reduce&&hero){ hero.addEventListener('pointermove',function(ev){ var r=c.getBoundingClientRect(); mx=ev.clientX-r.left; my=ev.clientY-r.top; tpx=(mx/W-0.5)*2; tpy=(my/H-0.5)*2; },{passive:true}); hero.addEventListener('pointerleave',function(){ mx=my=-9999; tpx=tpy=0; }); }
  var rt; window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ if(!c.clientWidth) return; stop(); size(); build(); start(); },120); },{passive:true});
  if(window.IntersectionObserver&&hero){ new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting?start():stop(); }); },{threshold:0}).observe(hero); }
})();
/* live-site capture compare (photo + LiDAR), ported as is */
(function(){
const frame=document.getElementById('cap-frame'); if(!frame) return;
const pc=document.getElementById('cap-photo'),lc=document.getElementById('cap-lidar');
const pctx=pc.getContext('2d'),lctx=lc.getContext('2d');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1);
const R=(a,b)=>a+Math.random()*(b-a);
const REG={graf:{x:.09,y:.13,w:.16,h:.18},pot:{x:.45,y:.73,w:.16,h:.15},dump:{x:.69,y:.57,w:.18,h:.19}};
function drawPhoto(){const w=W,h=H;
 let g=pctx.createLinearGradient(0,0,0,h*0.56);g.addColorStop(0,'#6f655a');g.addColorStop(1,'#574f47');pctx.fillStyle=g;pctx.fillRect(0,0,w,h*0.56);
 pctx.fillStyle='rgba(30,32,38,0.45)';for(let i=0;i<5;i++){const x=w*(0.34+i*0.13),y=h*0.10;pctx.fillRect(x,y,w*0.075,h*0.16);}
 pctx.strokeStyle='rgba(0,0,0,0.18)';pctx.lineWidth=1;for(let i=1;i<6;i++){pctx.beginPath();pctx.moveTo(0,h*0.56*i/6);pctx.lineTo(w,h*0.56*i/6);pctx.stroke();}
 g=pctx.createLinearGradient(0,h*0.56,0,h*0.68);g.addColorStop(0,'#9a9a93');g.addColorStop(1,'#86867f');pctx.fillStyle=g;pctx.fillRect(0,h*0.56,w,h*0.12);
 pctx.strokeStyle='rgba(0,0,0,0.15)';for(let i=0;i<9;i++){const x=w*i/9;pctx.beginPath();pctx.moveTo(x,h*0.56);pctx.lineTo(x+(x-w/2)*0.06,h*0.68);pctx.stroke();}
 g=pctx.createLinearGradient(0,h*0.68,0,h);g.addColorStop(0,'#3b3d41');g.addColorStop(1,'#2b2d30');pctx.fillStyle=g;pctx.fillRect(0,h*0.68,w,h*0.32);
 pctx.strokeStyle='rgba(220,200,120,0.5)';pctx.lineWidth=3;pctx.setLineDash([h*0.04,h*0.03]);pctx.beginPath();pctx.moveTo(w*0.16,h);pctx.lineTo(w*0.10,h*0.68);pctx.stroke();pctx.setLineDash([]);
 const Gr=REG.graf,gx=Gr.x*w,gy=Gr.y*h,gw=Gr.w*w,gh=Gr.h*h;pctx.lineWidth=4;pctx.lineCap='round';const tags=['#e35fd0','#7d6cff','#ff5c8a'];
 for(let s=0;s<3;s++){pctx.strokeStyle=tags[s];pctx.beginPath();let x=gx+gw*0.1+s*6,y=gy+gh*(0.4+s*0.12);pctx.moveTo(x,y);for(let k=0;k<4;k++){pctx.quadraticCurveTo(x+gw*0.12,y-gh*R(0.2,0.4),x+gw*0.22,y+R(-6,10));x+=gw*0.22;}pctx.stroke();}
 pctx.strokeStyle=tags[0];pctx.lineWidth=2;for(let d=0;d<5;d++){const x=gx+R(gw*0.1,gw*0.9);pctx.beginPath();pctx.moveTo(x,gy+gh*0.8);pctx.lineTo(x,gy+gh*R(0.95,1.25));pctx.stroke();}
 const P=REG.pot,ppx=P.x*w,ppy=P.y*h,pw=P.w*w,ph=P.h*h;pctx.fillStyle='#141518';pctx.beginPath();for(let a=0;a<=6.3;a+=0.4){const rr=(pw/2)*(0.7+0.3*Math.sin(a*3));pctx.lineTo(ppx+pw/2+Math.cos(a)*rr,ppy+ph/2+Math.sin(a)*rr*0.6);}pctx.closePath();pctx.fill();pctx.strokeStyle='rgba(255,255,255,0.06)';pctx.lineWidth=3;pctx.stroke();
 const D=REG.dump,dx=D.x*w,dy=D.y*h,dw=D.w*w,dh=D.h*h;const items=[['#2f3a2a',0.0,0.45,0.5,0.55],['#5a4632',0.4,0.25,0.45,0.5],['#1c1c1f',0.55,0.5,0.45,0.5],['#46402f',0.18,0.66,0.4,0.34]];
 items.forEach(it=>{pctx.fillStyle=it[0];const ix=dx+dw*it[1],iy=dy+dh*it[2];pctx.beginPath();pctx.roundRect?pctx.roundRect(ix,iy,dw*it[3],dh*it[4],6):pctx.rect(ix,iy,dw*it[3],dh*it[4]);pctx.fill();});
 for(let i=0;i<w*h/900;i++){pctx.fillStyle='rgba(255,255,255,'+R(0.01,0.04)+')';pctx.fillRect(R(0,w),R(0,h),1,1);}
 const vg=pctx.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.4)');pctx.fillStyle=vg;pctx.fillRect(0,0,w,h);
}
let pts=[];
function buildPts(){pts=[];const w=W,h=H;const n=W<640?2600:5200;for(let i=0;i<n;i++){pts.push([R(0,w),R(0,h)]);}}
function depthColor(nx,ny){const t=1-ny;let r,g,b;if(t<0.5){const u=t*2;r=255-u*120;g=90+u*120;b=50+u*90;}else{const u=(t-0.5)*2;r=135-u*120;g=210-u*40;b=140+u*100;}return [r,g,b];}
function inReg(nx,ny,Rr){return nx>Rr.x&&nx<Rr.x+Rr.w&&ny>Rr.y&&ny<Rr.y+Rr.h;}
function drawLidar(t){const w=W,h=H;lctx.fillStyle='#06080c';lctx.fillRect(0,0,w,h);
 for(let i=0;i<pts.length;i++){let x=pts[i][0],y=pts[i][1];const nx=x/w,ny=y/h;let c=depthColor(nx,ny),a=0.62;
  if(inReg(nx,ny,REG.pot)){c=[255,70,60];a=0.95;}else if(inReg(nx,ny,REG.dump)){c=[255,180,70];a=0.95;}else if(inReg(nx,ny,REG.graf)){c=[120,200,235];a=0.85;}
  const tw=reduce?1:0.7+0.3*Math.sin(t*0.003+i);lctx.globalAlpha=a*tw;lctx.fillStyle='rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';lctx.fillRect(x,y,2,2);}
 lctx.globalAlpha=1;lctx.strokeStyle='rgba(120,150,180,0.10)';lctx.lineWidth=1;
 for(let i=1;i<16;i++){lctx.beginPath();lctx.moveTo(w*i/16,0);lctx.lineTo(w*i/16,h);lctx.stroke();}
 for(let i=1;i<10;i++){lctx.beginPath();lctx.moveTo(0,h*i/10);lctx.lineTo(w,h*i/10);lctx.stroke();}
}
function resize(){const r=frame.getBoundingClientRect();W=r.width;H=r.height;[pc,lc].forEach(c=>{c.width=W*dpr;c.height=H*dpr;});pctx.setTransform(dpr,0,0,dpr,0,0);lctx.setTransform(dpr,0,0,dpr,0,0);drawPhoto();buildPts();drawLidar(performance.now());}
const divider=document.getElementById('cap-divider'),hit=document.getElementById('cap-hit');
let handle=58,auto=false,t0=0,dragging=false,raf=0,started=false;
function apply(){pc.style.clipPath='inset(0 '+(100-handle)+'% 0 0)';divider.style.left=handle+'%';}
function setFromX(cx){const r=frame.getBoundingClientRect();handle=Math.max(2,Math.min(98,((cx-r.left)/r.width)*100));}
hit.addEventListener('pointerdown',e=>{auto=false;dragging=true;try{hit.setPointerCapture(e.pointerId);}catch(_){}setFromX(e.clientX);apply();});
hit.addEventListener('pointermove',e=>{if(dragging){setFromX(e.clientX);apply();}});
hit.addEventListener('pointerup',()=>{dragging=false;});hit.addEventListener('pointercancel',()=>{dragging=false;});
const boxes=[document.getElementById('cb-graf'),document.getElementById('cb-pot'),document.getElementById('cb-dump')];
function showBoxes(){boxes.forEach((b,i)=>setTimeout(()=>{if(b)b.classList.add('on');},reduce?0:i*350));}
function loop(now){if(auto){const k=(now-t0)/1000;handle=58-18*Math.sin(Math.min(k,3)/3*Math.PI);if(k>3.2)auto=false;apply();}drawLidar(now);raf=requestAnimationFrame(loop);}
function startLoop(){if(!raf)raf=requestAnimationFrame(loop);}
function stopLoop(){if(raf){cancelAnimationFrame(raf);raf=0;}}
resize();apply();let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{resize();apply();},180);},{passive:true});
function onView(v){if(v){if(!started){started=true;setTimeout(showBoxes,reduce?0:500);if(!reduce){auto=true;t0=performance.now();}}if(reduce)drawLidar(performance.now());else startLoop();}else stopLoop();}
if(window.IntersectionObserver){new IntersectionObserver(es=>es.forEach(e=>onView(e.isIntersecting)),{threshold:0.25}).observe(frame);}else onView(true);
})();
