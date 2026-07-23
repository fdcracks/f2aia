/* F2AIA — fondo orbe de partículas + intro cinematográfica (vanilla, sin deps).
   Corre la intro solo 1 vez por sesión (sessionStorage). No toca nada de n8n. */
(function(){
  'use strict';
  var cvs=document.getElementById('fx'); if(!cvs) return;
  var ctx=cvs.getContext('2d');
  var orbname=document.getElementById('orbname');
  var install=document.getElementById('install'), code=document.getElementById('code');
  var barwrap=document.getElementById('barwrap'), barfill=document.getElementById('barfill'), pct=document.getElementById('pct');
  var diagram=document.getElementById('diagram'), dgsvg=document.getElementById('dgsvg');
  var skip=document.getElementById('skip'), heroL=document.getElementById('hero-l'), navEl=document.getElementById('nav');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Modo estático (opt-in, usado por /demo): orbe ya formado, sin intro cinematográfica.
  var STATIC=document.body&&document.body.getAttribute('data-hero')==='static';

  var W,H,DPR,CX,CY,R,P=[],ocx=0,OCXt=0;
  function size(){ DPR=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    cvs.width=W*DPR; cvs.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.fillStyle='#070707'; ctx.fillRect(0,0,W,H);
    CX=W<820?W*0.5:W*0.74; CY=H*(W<820?0.30:0.40); R=Math.min(W,H)*(W<820?0.28:0.19);
    if(!ocx){ ocx=W*0.5; OCXt=W*0.5; }
    var n=Math.round(Math.min(3000,W*H/(STATIC?1400:800)));   // densidad de la bandada
    P=[]; for(var i=0;i<n;i++) P.push({x:Math.random()*W,y:Math.random()*H,a:Math.random()*6.283,rf:Math.sqrt(Math.random()),tw:Math.random()*6.283});
  }
  addEventListener('resize',size); size();

  var g={part:0,wave:0,orb:0}, T={part:0,wave:0,orb:0}, t=0, lastHb=0, CYCLE=3.6, nameTimer=null, murmurT0=0;
  // Murmuración: curl-noise (divergencia≈0) → bandas coherentes que ondulan y giran, como la bandada.
  var S=0.0016, FSP=560;   // FSP = velocidad de la bandada
  function flowVec(x,y,ft){
    var a=x*S+ft*0.9, b=y*(S*1.3)-ft*0.6, c=(x+y)*(S*0.8)-ft*0.7, d=x*(S*2.1)-y*(S*1.7)+ft*1.1;
    var sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b),cc=Math.cos(c),sd=Math.sin(d);
    var dPx=ca*S*cb + 0.6*cc*(S*0.8) - 0.5*sd*(S*2.1);
    var dPy=-sa*sb*(S*1.3) + 0.6*cc*(S*0.8) + 0.5*sd*(S*1.7);
    return { vx:dPy*FSP, vy:-dPx*FSP };   // curl = (∂ψ/∂y, -∂ψ/∂x)
  }
  function heartbeat(sec){ var p=(sec%CYCLE)/CYCLE; return Math.exp(-Math.pow((p-0.06)/0.03,2))+Math.exp(-Math.pow((p-0.16)/0.035,2))*0.6; }
  function emitWave(){ var st=document.querySelector('.stage'); if(!st) return;
    var d=R*1.0; // las ondas salen del CENTRO DEL ORBE (ocx,CY), no de la pantalla
    var r=document.createElement('div');
    r.style.cssText='position:absolute;left:'+ocx+'px;top:'+CY+'px;width:'+d+'px;height:'+d+'px;margin:'+(-d/2)+'px 0 0 '+(-d/2)+'px;border-radius:50%;border:1px solid rgba(255,255,255,.5);pointer-events:none;';
    r.animate([{opacity:.5,transform:'scale(.5)'},{opacity:.12,offset:.2},{opacity:0,transform:'scale(2.8)'}],{duration:2800,easing:'ease-out'});
    st.appendChild(r); setTimeout(function(){r.remove();},2800);
    if(orbname){ orbname.classList.add('flash'); clearTimeout(nameTimer); nameTimer=setTimeout(function(){orbname.classList.remove('flash');},2000); }
  }
  function frame(now){
    // Pausa de dibujo (el chat del demo tapa el canvas): se mantiene el rAF vivo,
    // se saltea el trabajo pesado de pintar las partículas.
    if(window.__f2aiaOrbPaused){ requestAnimationFrame(frame); return; }
    var sec=(now||0)/1000; t+=reduce?0.0006:0.0016;
    for(var k in g) g[k]+=(T[k]-g[k])*0.05;
    ocx += (OCXt-ocx)*(reduce?0.05:0.026);
    ctx.globalCompositeOperation='source-over'; ctx.fillStyle='rgba(7,7,7,0.11)'; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    var rot=t*0.26, hb=heartbeat(sec), beat=1+hb*0.10*g.orb;
    if(g.orb>0.5 && hb>0.55 && lastHb<=0.55) emitWave(); lastHb=hb;
    if(g.orb>0.02 && orbname){ orbname.style.left=ocx+'px'; orbname.style.top=(CY+R*1.2)+'px'; orbname.style.right='auto'; }
    // reloj rápido (tiempo real) para que la bandada se mueva de verdad durante los ~3s de murmuración
    var ft=sec*1.25;   // reloj de la bandada (más alto = más rápida)
    // recorrido dirigido: la cabeza de la bandada barre de izquierda -> centro -> derecha (hacia el orbe)
    // recorrido de la murmuración anclado al inicio de la FASE 3 (0=izq .. 1=der), no al reloj absoluto
    var phase = murmurT0 ? Math.min(1,(sec-murmurT0)/2.6) : 1;
    var sweep = phase<1 ? phase*phase*(3-2*phase) : 1;   // smoothstep: entra izq -> cruza centro -> converge der
    var headX=W*0.12+(CX-W*0.12)*sweep, headY=CY;        // izq (0.12W) -> CX real (0.74W desktop / 0.5W movil), sin salto
    var AT=[
      {x:headX,                         y:headY+H*0.10*Math.sin(ft*1.3)},
      {x:headX-W*0.10+W*0.05*Math.cos(ft), y:headY+H*0.16*Math.cos(ft*0.9+1.2)},
      {x:headX-W*0.18+W*0.04*Math.sin(ft*1.1+2.0), y:headY+H*0.12*Math.sin(ft*0.7+3.1)}
    ];
    for(var i=0;i<P.length;i++){ var p=P[i], o=g.orb;
      var fv=flowVec(p.x,p.y,ft), waveY=Math.sin(p.x*0.008+ft*2.0)*1.5*g.wave;
      var ax=0,ay=0;
      if(o<0.985){ for(var m=0;m<3;m++){ var A=AT[m], adx=A.x-p.x, ady=A.y-p.y, d2=adx*adx+ady*ady+9000, invd=1/Math.sqrt(d2), pull=52000/d2; if(pull>3.4)pull=3.4;
        ax+=(adx*invd*0.6 - ady*invd*1.15)*pull; ay+=(ady*invd*0.6 + adx*invd*1.15)*pull; } }   // radial + tangencial (swirl) = flock
      var fvx=fv.vx+ax*g.wave, fvy=fv.vy+ay*g.wave+waveY;
      var sp2=fvx*fvx+fvy*fvy; if(sp2>27.04){ var cf=5.2/Math.sqrt(sp2); fvx*=cf; fvy*=cf; }        // clamp de velocidad
      var tx=ocx+R*beat*p.rf*Math.cos(p.a+rot), ty=CY+R*beat*p.rf*Math.sin(p.a+rot);
      if(o>0.01){ p.x+=fvx*(1-o)+(tx-p.x)*0.07*o; p.y+=fvy*(1-o)+(ty-p.y)*0.07*o; }
      else{ p.x+=fvx; p.y+=fvy; }
      if(o<0.4&&(p.x<-30||p.x>W+30||p.y<-30||p.y>H+30)){ p.x=W*(0.15+Math.random()*0.7); p.y=Math.random()*H; }
      // brillo por velocidad local (bandas rápidas = más luminosas) con piso alto → visibles en toda la pantalla
      var spd=Math.min(1,Math.sqrt(fvx*fvx+fvy*fvy)/4.6), b=Math.max(o,0.4+0.6*spd), tw=0.6+0.4*Math.sin(t*2+p.tw), alpha=(0.07+b*0.3)*g.part*tw;
      if(alpha>0.003){ ctx.fillStyle='rgba('+Math.floor(20+30*b)+',255,'+Math.floor(130+70*b)+','+alpha+')'; ctx.fillRect(p.x,p.y,1.7,1.7); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ── workflow n8n (borroso, horizontal desktop / vertical móvil) ── */
  var ICON={ wa:'<path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1l-.9 1.2c-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5L9.2 6.9c-.2-.6-.5-.5-.6-.5h-.6c-.2 0-.5.1-.8.4-.9.9-1 2.3-.4 3.3 1.2 2 2.9 3.9 5.2 4.9 3 1.3 3 .9 3.6.8.5-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4z"/>',
    bot:'<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 4v4M8 13h.01M16 13h.01"/>', br:'<path d="M6 3v6M6 15v6M18 9a3 3 0 1 0 0 6M6 9a3 3 0 1 0 0 6M18 12H6"/>',
    reply:'<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 5 5v3"/>', human:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/>',
    spark:'<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>', db:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>', cal:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/>', tag:'<path d="M20 12l-8 8-8-8 8-8h8z"/>', tg:'<path d="M22 3 2 10l6 2 2 7 3-4 5 4z"/>', bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' };
  var RN_D=[{id:'trg',x:40,y:290,w:128,h:44,ic:'wa',t:'Mensaje entrante',s:'whatsapp'},{id:'agt',x:250,y:279,w:160,h:70,ic:'bot',t:'Neura · Agente',s:'atiende'},{id:'dec',x:500,y:290,w:110,h:44,ic:'br',t:'¿Resuelve?',s:''},{id:'r1',x:700,y:170,w:128,h:44,ic:'reply',t:'Responde',s:''},{id:'r2',x:910,y:170,w:128,h:44,ic:'db',t:'Registra CRM',s:''},{id:'r3',x:1120,y:170,w:128,h:44,ic:'cal',t:'Agenda turno',s:''},{id:'f1',x:700,y:410,w:128,h:44,ic:'human',t:'Deriva humano',s:''},{id:'f2',x:910,y:410,w:128,h:44,ic:'tg',t:'Aviso Telegram',s:''},{id:'f3',x:1120,y:410,w:128,h:44,ic:'bell',t:'Recordatorio',s:''}];
  var CN_D=[{id:'mdl',x:270,y:470,ic:'spark',t:'Modelo'},{id:'mem',x:330,y:470,ic:'db',t:'Memoria'},{id:'to1',x:390,y:470,ic:'tag',t:'CRM'}];
  var LK_D=[['trg','agt'],['agt','dec'],['dec','r1'],['r1','r2'],['r2','r3'],['dec','f1'],['f1','f2'],['f2','f3']];
  var RN_M=[{id:'trg',x:120,y:46,w:200,h:56,ic:'wa',t:'Mensaje entrante',s:'whatsapp'},{id:'agt',x:108,y:196,w:224,h:78,ic:'bot',t:'Neura · Agente',s:'atiende'},{id:'dec',x:140,y:440,w:160,h:56,ic:'br',t:'¿Resuelve?',s:''},{id:'r1',x:52,y:596,w:150,h:54,ic:'reply',t:'Responde',s:''},{id:'f1',x:238,y:596,w:150,h:54,ic:'human',t:'Deriva',s:''}];
  var CN_M=[{id:'mdl',x:110,y:352,ic:'spark',t:'Modelo'},{id:'mem',x:220,y:352,ic:'db',t:'Memoria'},{id:'cal',x:330,y:352,ic:'cal',t:'Agenda'}];
  var LK_M=[['trg','agt'],['agt','dec'],['dec','r1'],['dec','f1']];
  var RN=RN_D,CN=CN_D,LK=LK_D;
  function rc(id){ for(var i=0;i<RN.length;i++) if(RN[i].id===id) return RN[i]; }
  function port(A,B){ var ac={x:A.x+A.w/2,y:A.y+A.h/2}, bc={x:B.x+B.w/2,y:B.y+B.h/2};
    if(Math.abs(bc.y-ac.y)>Math.abs(bc.x-ac.x)){ var dn=bc.y>ac.y; return {x1:ac.x,y1:dn?A.y+A.h:A.y,x2:bc.x,y2:dn?B.y:B.y+B.h,vert:true}; }
    var rt=bc.x>ac.x; return {x1:rt?A.x+A.w:A.x,y1:ac.y,x2:rt?B.x:B.x+B.w,y2:bc.y,vert:false}; }
  function buildDiagram(){ var M=W<820; RN=M?RN_M:RN_D; CN=M?CN_M:CN_D; LK=M?LK_M:LK_D;
    dgsvg.setAttribute('viewBox', M?'0 0 440 720':'0 0 1440 520'); var s='';
    LK.forEach(function(pr,i){ var A=rc(pr[0]),B=rc(pr[1]); if(!A||!B)return; var p=port(A,B);
      var d=p.vert?('M'+p.x1+' '+p.y1+' C '+p.x1+' '+((p.y1+p.y2)/2)+', '+p.x2+' '+((p.y1+p.y2)/2)+', '+p.x2+' '+p.y2):('M'+p.x1+' '+p.y1+' C '+((p.x1+p.x2)/2)+' '+p.y1+', '+((p.x1+p.x2)/2)+' '+p.y2+', '+p.x2+' '+p.y2);
      s+='<path id="L'+i+'" class="dgl" d="'+d+'" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.4" stroke-dasharray="900" stroke-dashoffset="900" style="transition:stroke-dashoffset .9s ease"/>';
      s+='<circle id="E'+i+'" r="3" fill="#00FF88" opacity="0"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#L'+i+'"/></animateMotion></circle>'; });
    CN.forEach(function(c,i){ var A=rc('agt'),x1=c.x,y1=c.y-18,x2=A.x+A.w/2+(i-1)*34,y2=A.y+A.h;
      s+='<path id="D'+i+'" class="dgl-d" d="M'+x1+' '+y1+' C '+x1+' '+((y1+y2)/2)+', '+x2+' '+((y1+y2)/2)+', '+x2+' '+y2+'" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1" stroke-dasharray="3 4" opacity="0" style="transition:opacity .5s ease"/>'; });
    RN.forEach(function(n){ s+='<g class="dgn" id="N-'+n.id+'" style="opacity:0;transition:opacity .4s ease"><rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" rx="10" fill="#0E0E0E" stroke="rgba(255,255,255,.14)"/><g transform="translate('+(n.x+12)+','+(n.y+n.h/2-9)+')" fill="none" stroke="#00FF88" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+ICON[n.ic]+'</g><text x="'+(n.x+40)+'" y="'+(n.y+(n.s?n.h/2-2:n.h/2+4))+'" fill="#fff" font-family="Inter" font-size="12" font-weight="600">'+n.t+'</text>'+(n.s?'<text x="'+(n.x+40)+'" y="'+(n.y+n.h/2+11)+'" fill="rgba(255,255,255,.45)" font-family="JetBrains Mono" font-size="9">'+n.s+'</text>':'')+'</g>'; });
    CN.forEach(function(c){ s+='<g class="dgn" id="N-'+c.id+'" style="opacity:0;transition:opacity .4s ease"><circle cx="'+c.x+'" cy="'+c.y+'" r="16" fill="#0E0E0E" stroke="rgba(0,255,136,.3)"/><g transform="translate('+(c.x-7)+','+(c.y-7)+')" fill="none" stroke="#8BFFC4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g transform="scale(.6)">'+ICON[c.ic]+'</g></g><text x="'+c.x+'" y="'+(c.y+30)+'" text-anchor="middle" fill="rgba(255,255,255,.55)" font-family="Inter" font-size="10">'+c.t+'</text></g>'; });
    var T1=rc('r1'),F1=rc('f1'); if(T1) s+='<text x="'+T1.x+'" y="'+(T1.y-8)+'" fill="#00FF88" font-family="JetBrains Mono" font-size="10">sí</text>'; if(F1) s+='<text x="'+F1.x+'" y="'+(F1.y-8)+'" fill="rgba(255,255,255,.5)" font-family="JetBrains Mono" font-size="10">no</text>';
    dgsvg.innerHTML=s;
  }
  function q(sel){ return dgsvg.querySelector(sel); }
  function showNode(id){ var n=q('#N-'+id); if(n)n.style.opacity=1; }
  function drawLink(i){ var l=q('#L'+i); if(l)l.style.strokeDashoffset=0; var e=q('#E'+i); if(e)setTimeout(function(){e.setAttribute('opacity','1');},650); }

  var CODE=['# ══════════════════════════════════════════════════════════════════','#   F2AIA · NEURA runtime v2.6','#   sistemas autónomos con IA','# ══════════════════════════════════════════════════════════════════','',
    '> neura · iniciando sistema --env=prod --region=sa-east-1 --channel=whatsapp-cloud-api',
    '[0.02s]  conectando whatsapp cloud api · graph.facebook.com/v19.0 ·················· ok',
    '[0.15s]  autenticando · meta oauth · token permanente ····························· ok',
    '[0.34s]  cargando motor de ia · gpt-4o · tono rioplatense es-AR ·················· ok',
    '[0.52s]  activando escudo anti-bot · turnstile · siteverify ······················ ok',
    '[0.71s]  vinculando herramientas · crm · sheets · calendar · telegram ············ ok',
    '[0.93s]  cargando memoria · postgres · contexto de sesión ······················· ok',
    '[1.12s]  construyendo grafo de flujos · n8n · nodos=9 · ramas=2 ·················· ok',
    '         trigger[whatsapp] → agente[neura] → switch{¿resuelve?} → [ sí | no ]',
    '[1.36s]  verificando políticas RLS · seguridad a nivel de fila ··················· ok',
    '[1.58s]  cifrando credenciales · vault · aes-256-gcm ····························· ok',
    '[1.80s]  sincronizando 700+ integraciones · pool de conexiones listo ············· ok',
    '[2.03s]  optimizando latencia · mediana 340ms · p95 <30s ························· ok',
    '[2.24s]  activando webhook · POST /webhook/f2aia-chat ···························· ok',
    '[2.28s]  activando webhook · POST /webhook/f2aia-lead ···························· ok',
    '[2.53s]  chequeo de salud · api · db · cola · llm · todos los sistemas ··········· ok',
    '[2.71s]  handshake 0x00FF88 · canal seguro establecido ··························· ok',
    '[3.04s]  neura.core → ● EN LÍNEA · atendiendo 24/7','         sistema listo en 3.04s.'];

  var timers=[], done=false;
  function wait(ms){ return new Promise(function(r){ timers.push(setTimeout(r,ms)); }); }
  function showContent(){ if(navEl)navEl.classList.add('ready'); if(heroL)heroL.classList.add('on');
    document.body.classList.remove('intro-lock'); if(skip)skip.style.display='none'; }
  function revealNow(){ if(install){install.style.display='none';} if(diagram){diagram.style.opacity=0;}
    T.part=1; T.wave=0.22; T.orb=1; OCXt=CX; ocx=CX; if(orbname)orbname.classList.add('flash');
    showContent(); }

  function seqNodes(){ return (async function(){
    showNode('trg'); await wait(420); drawLink(0); await wait(520);
    showNode('agt'); await wait(240); CN.forEach(function(c,i){ var d=q('#D'+i); if(d)setTimeout(function(){d.style.opacity=1;},i*120); timers.push(setTimeout(function(){showNode(c.id);},i*140)); });
    await wait(520); drawLink(1); await wait(500); showNode('dec'); await wait(360);
    drawLink(2); await wait(300); showNode('r1'); await wait(280);
    drawLink(3); await wait(280); showNode('r2'); await wait(280);
    drawLink(4); await wait(280); showNode('r3'); await wait(300);
    drawLink(5); await wait(280); showNode('f1'); await wait(280);
    drawLink(6); await wait(280); showNode('f2'); await wait(280);
    drawLink(7); await wait(280); showNode('f3');
  })(); }

  async function run(){
    done=false; document.body.classList.add('intro-lock'); window.scrollTo(0,0); if(navEl)navEl.classList.remove('ready');
    if(code)code.innerHTML=''; if(install){install.style.display='flex'; install.style.opacity=1;}
    if(barwrap)barwrap.classList.remove('on'); if(barfill)barfill.style.width='0'; if(pct)pct.textContent='0%';
    if(diagram)diagram.style.opacity=0; if(skip)skip.style.display='block';
    T.part=0; T.wave=0; T.orb=0; ocx=W*0.5; OCXt=W*0.5;
    // FASE 1a · código
    for(var i=0;i<CODE.length && !done;i++){ var d=document.createElement('div'); d.className='cl';
      d.innerHTML=CODE[i].replace('F2AIA','<span class="ok">F2AIA</span>').replace(/\bok\b/g,'<span class="ok">ok</span>').replace(/\blisto\b/g,'<span class="ok">listo</span>').replace('EN LÍNEA','<span class="ok">EN LÍNEA</span>');
      code.appendChild(d); code.scrollTop=code.scrollHeight; await wait(i<5?110:70); }
    if(done)return; await wait(450);
    // FASE 1b · barra
    if(code)code.classList.add('hide'); if(barwrap)barwrap.classList.add('on');
    for(var pr=0;pr<=100 && !done;pr+=4){ if(barfill)barfill.style.width=pr+'%'; if(pct)pct.textContent=pr+'%'; await wait(26); }
    if(done)return; await wait(380);
    // FASE 2 · workflow borroso, nodos uno por uno
    if(install)install.style.opacity=0; buildDiagram(); if(diagram)diagram.style.opacity=1; T.part=0.22;
    await wait(400); if(install)install.style.display='none';
    await seqNodes(); await wait(1000); if(done)return;
    // FASE 3 · murmuración: la bandada ondula por TODA la pantalla
    if(diagram)diagram.style.opacity=0; T.part=1; T.wave=1; T.orb=0; murmurT0=(typeof performance!=='undefined'?performance.now():Date.now())/1000; await wait(2600); if(done)return;
    // FASE 4 · el orbe se forma DIRECTO a la derecha (CX,CY), donde la murmuración ya dejó la masa
    ocx=CX; OCXt=CX; T.orb=1; T.wave=0.22; if(orbname)orbname.classList.add('flash');
    await wait(2400); if(done)return;
    showContent();
  }

  if(skip) skip.addEventListener('click', function(){ done=true; timers.forEach(clearTimeout); revealNow(); });

  // La intro corre en CADA carga; F5 la reinicia como página nueva, desde arriba (no detrás del contenido).
  if(reduce || STATIC){ revealNow(); }
  else {
    try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
    window.scrollTo(0,0);
    try{ run(); }catch(e){ revealNow(); }
  }
  // red de seguridad: si algo se traba, el contenido igual aparece
  setTimeout(function(){ if(heroL && !heroL.classList.contains('on')) revealNow(); }, 15000);
})();
