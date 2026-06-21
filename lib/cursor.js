/* F2AIA — Spotlight glow cursor (compartido por todas las páginas)
   Mantiene el cursor normal y agrega un resplandor verde radial que sigue al mouse.
   Se desactiva en touch/mobile y con prefers-reduced-motion (accesibilidad). */
(function () {
  'use strict';
  var noHover = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (noHover || reduce) return;

  function init() {
    // estilos inyectados (no requiere tocar el CSS de cada página)
    var style = document.createElement('style');
    style.textContent =
      '#f2aia-cursor-glow{position:fixed;top:0;left:0;width:460px;height:460px;border-radius:50%;' +
      'pointer-events:none;z-index:9998;opacity:0;transition:opacity .35s ease;will-change:transform;' +
      'background:radial-gradient(circle,rgba(0,255,136,.10) 0%,rgba(0,255,136,.045) 32%,rgba(0,255,136,0) 68%)}';
    document.head.appendChild(style);

    var glow = document.createElement('div');
    glow.id = 'f2aia-cursor-glow';
    document.body.appendChild(glow);

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, shown = false;

    function loop() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      glow.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { glow.style.opacity = '1'; shown = true; }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    document.addEventListener('mouseleave', function () { glow.style.opacity = '0'; shown = false; });
    document.addEventListener('mouseenter', function () { if (tx || ty) { glow.style.opacity = '1'; shown = true; } });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
