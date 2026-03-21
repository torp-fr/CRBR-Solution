/* ============================================================
   DST SYSTEM — Vitrine JS
   Navigation, animations, formulaire
   ============================================================ */

(function () {
  'use strict';

  /* --- Navigation burger (mobile) --- */
  const burger  = document.getElementById('navBurger');
  const navMenu = document.getElementById('navMenu');

  if (burger && navMenu) {
    burger.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
    });
  }

  /* --- Dropdown mobile (touch/click) --- */
  document.querySelectorAll('.nav__dropdown > .nav__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = link.closest('.nav__dropdown');
        parent.classList.toggle('open');
      }
    });
  });

  /* --- Fermer le menu si on clique en dehors --- */
  document.addEventListener('click', function (e) {
    if (navMenu && burger && !navMenu.contains(e.target) && !burger.contains(e.target)) {
      navMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* --- Fermer le menu sur resize --- */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && navMenu) {
      navMenu.classList.remove('open');
      if (burger) {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    }
  });

  /* --- Active nav link --- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href !== '#' && href === currentPage) {
      link.classList.add('active');
      const parent = link.closest('.nav__dropdown');
      if (parent) {
        const parentLink = parent.querySelector(':scope > .nav__link');
        if (parentLink) parentLink.classList.add('active');
      }
    }
  });
  document.querySelectorAll('.nav__submenu a').forEach(function (link) {
    if (link.getAttribute('href') === currentPage) {
      link.style.color = 'var(--text-d1)';
      const parentLink = link.closest('.nav__dropdown')?.querySelector(':scope > .nav__link');
      if (parentLink) parentLink.classList.add('active');
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
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach(function (el) {
    observer.observe(el);
  });

  /* --- Pré-sélection du formulaire via paramètres URL --- */
  const formule = document.getElementById('formule');
  if (formule) {
    const params = new URLSearchParams(window.location.search);
    const objet  = params.get('objet');
    const niveau = params.get('niveau');
    const valid  = ['presentation', 'initier', 'evaluation', 'devis', 'indetermine'];
    if (objet && valid.includes(objet)) {
      formule.value = objet;
    } else if (niveau) {
      // niveau=renforce / unite / territorial → map to devis
      formule.value = 'devis';
    }
  }

  /* --- Formulaire de contact --- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const notice = document.getElementById('formNotice');
      const originalText = btn.textContent;

      // Validation basique
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#c0392b';
          valid = false;
        }
      });

      if (!valid) {
        if (notice) {
          notice.textContent = 'Veuillez remplir tous les champs obligatoires.';
          notice.style.color = '#c0392b';
        }
        return;
      }

      // Simulation envoi
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';

      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = originalText;
        form.reset();
        if (notice) {
          notice.textContent = 'Votre message a bien été envoyé. Nous vous répondrons dans les 48 heures.';
          notice.style.color = '#2a7a2a';
        }
      }, 1200);
    });
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

})();
