/* ============================================================
   DST SYSTEM — Vitrine JS v2.0
   Navigation flat, animations scroll, FAQ, formulaire
   ============================================================ */

(function () {
  'use strict';

  /* --- Navigation burger (mobile) --- */
  const burger  = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  /* --- Fermer le menu si on clique en dehors --- */
  document.addEventListener('click', function (e) {
    if (navLinks && burger && !navLinks.contains(e.target) && !burger.contains(e.target)) {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* --- Fermer le menu sur resize --- */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && navLinks) {
      navLinks.classList.remove('open');
      if (burger) {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
      document.body.style.overflow = '';
    }
  });

  /* --- Active nav link --- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href !== '#' && href === currentPage) {
      link.classList.add('active');
    }
  });

  /* --- Scroll fade-in animations --- */
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(function (el) {
    observer.observe(el);
  });

  /* --- FAQ accordion --- */
  document.querySelectorAll('.faq-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Fermer tous les autres
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        if (openItem !== item) openItem.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });

  /* --- Pré-sélection du formulaire via paramètres URL --- */
  const formule = document.getElementById('formule');
  if (formule) {
    const params = new URLSearchParams(window.location.search);
    const objet  = params.get('objet');
    const valid  = ['presentation', 'initier', 'evaluation', 'devis', 'indetermine',
                    'offre-base', 'offre-operationnel', 'offre-premium', 'programme-mobile', 'sur-mesure'];
    if (objet && valid.includes(objet)) {
      formule.value = objet;
    }
  }

  /* --- Smooth scroll pour ancres internes --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* --- Cookie banner --- */
  const cookieBanner = document.getElementById('cookie-banner');
  if (cookieBanner && localStorage.getItem('cookies_accepted')) {
    cookieBanner.style.display = 'none';
  }

})();
