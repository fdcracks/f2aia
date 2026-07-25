/* F2AIA — índice de las páginas legales (/privacidad, /terminos).
   Marca en verde la sección que se está leyendo. Sin dependencias.
   Si el script no carga, el índice sigue funcionando como lista de anclas. */
(function () {
  'use strict';

  var links = Array.prototype.slice.call(document.querySelectorAll('.toc-list a[href^="#"]'));
  if (!links.length) return;

  var linkById = {};
  var sections = [];

  links.forEach(function (link) {
    var id = decodeURIComponent(link.getAttribute('href').slice(1));
    var section = document.getElementById(id);
    if (!section) return;
    linkById[id] = link;
    sections.push(section);
  });
  if (!sections.length) return;

  var currentId = null;

  function setActive(id) {
    if (id === currentId) return;
    if (currentId && linkById[currentId]) linkById[currentId].classList.remove('toc-active');
    if (linkById[id]) linkById[id].classList.add('toc-active');
    currentId = id;
  }

  function update() {
    ticking = false;
    // Activa = la última sección cuyo tope ya pasó el 40% superior de la ventana.
    var mark = window.innerHeight * 0.4;
    var activeId = sections[0].id;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= mark) activeId = sections[i].id;
    }
    // Al final de la página, marcar siempre la última.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      activeId = sections[sections.length - 1].id;
    }
    setActive(activeId);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
