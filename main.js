(function(){
  'use strict';

  var WA_NUM  = '5491164858166';
  var WA_MSG  = encodeURIComponent('Hola! Vi la web de F2AIA y me interesa automatizar mi negocio.');
  var WEBHOOK = 'https://n8n.f2aia.com/webhook/f2aia-leads';

  var reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isMobile = !matchMedia('(hover:hover)').matches;

  function $(s,p){ return (p||document).querySelector(s); }
  function $$(s,p){ return Array.from((p||document).querySelectorAll(s)); }
  function safe(fn,n){ try{ fn(); }catch(e){ console.warn('['+n+']',e); } }

  /* ── SCROLL PROGRESS ── */
  function initScrollBar(){
    var bar = document.getElementById('scroll-bar');
    if(!bar) return;
    function update(){
      var total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total>0 ? Math.min(100,(window.scrollY/total)*100) : 0)+'%';
    }
    window.addEventListener('scroll', update, {passive:true});
    update();
  }

  /* ── CUSTOM CURSOR ── */
  function initCursor(){
    if(isMobile) return;
    var outer = document.getElementById('cursor-outer');
    var dot   = document.getElementById('cursor-dot');
    if(!outer || !dot) return;

    var mx = -100, my = -100, ox = -100, oy = -100;
    var raf;

    document.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate('+(mx-2.5)+'px,'+(my-2.5)+'px)';
    });

    function lerp(a,b,t){ return a+(b-a)*t; }
    function loop(){
      ox = lerp(ox, mx, 0.12);
      oy = lerp(oy, my, 0.12);
      outer.style.transform = 'translate('+(ox-18)+'px,'+(oy-18)+'px)';
      raf = requestAnimationFrame(loop);
    }
    loop();

    var hoverEls = 'a, button, [role="button"], input, select, textarea, label, .prob-card, .srv-card, .test-card, .faq-btn';
    document.addEventListener('mouseover', function(e){
      if(e.target.closest(hoverEls)) outer.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function(e){
      if(e.target.closest(hoverEls)) outer.classList.remove('is-hover');
    });
    document.addEventListener('mousedown', function(){
      outer.classList.add('is-click');
    });
    document.addEventListener('mouseup', function(){
      outer.classList.remove('is-click');
    });
    document.addEventListener('mouseleave', function(){
      outer.style.opacity = '0';
      dot.style.opacity   = '0';
    });
    document.addEventListener('mouseenter', function(){
      outer.style.opacity = '1';
      dot.style.opacity   = '1';
    });
  }

  /* ── NAV ── */
  function initNav(){
    var nav    = $('.nav');
    var burger = $('.nav-burger');
    if(!nav) return;
    function onScroll(){ nav.classList.toggle('scrolled', window.scrollY > 50); }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    if(burger){
      burger.addEventListener('click', function(){
        var open = nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
        var mob = $('#nav-mobile');
        if(mob) mob.setAttribute('aria-hidden', String(!open));
      });
    }
    $$('#nav-mobile a').forEach(function(a){
      a.addEventListener('click', function(){
        nav.classList.remove('open');
        if(burger) burger.setAttribute('aria-expanded','false');
        var mob = $('#nav-mobile');
        if(mob) mob.setAttribute('aria-hidden','true');
      });
    });
    document.addEventListener('click', function(e){
      if(nav.classList.contains('open') && !nav.contains(e.target)){
        nav.classList.remove('open');
        if(burger) burger.setAttribute('aria-expanded','false');
      }
    });
  }

  /* ── SMOOTH SCROLL ── */
  function initSmoothScroll(){
    document.addEventListener('click', function(e){
      var a = e.target.closest('a[href^="#"]');
      if(!a) return;
      var id = a.getAttribute('href');
      if(!id || id==='#') return;
      var target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||66;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: reduced?'auto':'smooth' });
    });
  }

  /* ── WHATSAPP ── */
  function initWA(){
    var fab = $('#wa-fab');
    if(fab) fab.href = 'https://wa.me/'+WA_NUM+'?text='+WA_MSG;
    var formWa = $('.form-wa');
    if(formWa){
      formWa.style.cursor = 'pointer';
      formWa.addEventListener('click', function(){
        window.open('https://wa.me/'+WA_NUM+'?text='+WA_MSG,'_blank','noopener');
      });
    }
  }

  /* ── SCROLL REVEALS ── */
  function initReveals(){
    var els = $$('.reveal');
    if(!els.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, {threshold:0.05, rootMargin:'0px 0px -5% 0px'});
    els.forEach(function(el){ io.observe(el); });
    setTimeout(function(){
      $$('.reveal:not(.is-visible)').forEach(function(el){
        if(el.getBoundingClientRect().top < window.innerHeight*1.2) el.classList.add('is-visible');
      });
    }, 4000);
  }

  /* ── COUNT-UP ── */
  function initCountUp(){
    var els = $$('.count-up');
    if(!els.length) return;
    function animateEl(el){
      var target = parseInt(el.dataset.target,10);
      if(isNaN(target)) return;
      if(reduced){ el.textContent=target; return; }
      var start = performance.now(), dur = 1800;
      function step(now){
        var t = Math.min(1,(now-start)/dur);
        var eased = 1-Math.pow(1-t,3);
        el.textContent = Math.round(eased*target);
        if(t<1) requestAnimationFrame(step); else el.textContent=target;
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        io.unobserve(e.target);
        animateEl(e.target);
      });
    }, {threshold:0.1, rootMargin:'0px 0px -5% 0px'});
    els.forEach(function(el){ el.textContent='0'; io.observe(el); });
    setTimeout(function(){
      $$('.count-up').forEach(function(el){ if(el.textContent==='0') animateEl(el); });
    }, 3000);
  }

  /* ── FAQ ── */
  function initFaq(){
    $$('.faq-item').forEach(function(item){
      var btn = item.querySelector('.faq-btn');
      if(!btn) return;
      btn.addEventListener('click', function(){
        var isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
        $$('.faq-item.open').forEach(function(other){
          if(other!==item){
            other.classList.remove('open');
            var ob=other.querySelector('.faq-btn');
            if(ob) ob.setAttribute('aria-expanded','false');
          }
        });
      });
    });
  }

  /* ── LIVE FEED TERMINAL ── */
  function initLiveFeed(){
    var el = document.getElementById('live-feed-text');
    if(!el || reduced) return;

    var messages = [
      'Nuevo lead captado — Clínica Belgrano',
      'Turno confirmado — 16:30hs vía WhatsApp',
      'CRM actualizado: +1 lead calificado',
      'IA respondió consulta en 8 seg',
      'Pipeline agendamiento: 3 turnos procesados',
      'Lead calificado — Estudio Jurídico CABA',
      'Sistema conversacional: consulta resuelta',
      'Integración CRM: sincronización completa',
      'Turno recordatorio enviado · 100% confirmado',
      'Nuevo lead desde Instagram captado'
    ];

    var idx = 0;
    var typeTimer = null;

    function typeText(text){
      if(typeTimer) clearInterval(typeTimer);
      el.textContent = '';
      var i = 0;
      typeTimer = setInterval(function(){
        if(i < text.length){
          el.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(typeTimer);
          typeTimer = null;
        }
      }, 38);
    }

    typeText(messages[0]);
    setInterval(function(){
      idx = (idx + 1) % messages.length;
      typeText(messages[idx]);
    }, 4200);
  }

  /* ── FORM → n8n ── */
  function initForm(){
    var form = $('#form-contacto');
    var btn  = $('#btn-submit');
    if(!form||!btn) return;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      if(!form.reportValidity()) return;
      if(btn.classList.contains('is-sending')||btn.classList.contains('is-sent')) return;
      btn.classList.add('is-sending');
      btn.disabled = true;
      var payload = {
        nombre:   form.nombre.value.trim(),
        negocio:  form.negocio.value,
        whatsapp: form.whatsapp.value.trim(),
        mensaje:  form.mensaje ? form.mensaje.value.trim() : '',
        fecha:    new Date().toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'}),
        origen:   'Landing F2AIA'
      };
      try {
        await fetch(WEBHOOK, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        btn.classList.remove('is-sending');
        btn.classList.add('is-sent');
        btn.scrollIntoView({behavior:'smooth',block:'center'});
        setTimeout(function(){ btn.classList.remove('is-sent'); btn.disabled=false; form.reset(); }, 4000);
      } catch(err){
        console.warn('[form]',err);
        btn.classList.remove('is-sending');
        btn.classList.add('is-sent');
        setTimeout(function(){ btn.classList.remove('is-sent'); btn.disabled=false; }, 4000);
      }
    });
  }

  /* ── BOOT ── */
  function boot(){
    safe(initScrollBar,   'scrollBar');
    safe(initCursor,      'cursor');
    safe(initNav,         'nav');
    safe(initSmoothScroll,'smoothScroll');
    safe(initWA,          'wa');
    safe(initReveals,     'reveals');
    safe(initCountUp,     'countUp');
    safe(initFaq,         'faq');
    safe(initLiveFeed,    'liveFeed');
    safe(initForm,        'form');
    document.documentElement.classList.add('loaded');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

})();
