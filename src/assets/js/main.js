const navbar = document.getElementById('navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('navLinks');

  const setNavHeight = () => {
    if (!navbar) return;
    const navHeight = Math.ceil(navbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
  };

  setNavHeight();
  window.addEventListener('load', setNavHeight);
  window.addEventListener('resize', setNavHeight);

  if (navToggle && navLinks) {
    const MENU_BREAKPOINT = 860;
    const SCROLL_CLOSE_DELAY = 120;
    let scrollCloseTimer = null;

    const isMenuOpen = () => navLinks.classList.contains('open');

    const syncMenuState = isOpen => {
      navLinks.classList.toggle('open', isOpen);
      navLinks.setAttribute('aria-hidden', String(!isOpen));
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      setNavHeight();
    };

    const openMenu = () => {
      if (isMenuOpen()) return;
      syncMenuState(true);
    };

    const closeMenu = ({ focusToggle = false } = {}) => {
      if (!isMenuOpen()) return;
      syncMenuState(false);
      if (scrollCloseTimer) {
        window.clearTimeout(scrollCloseTimer);
        scrollCloseTimer = null;
      }
      if (focusToggle) navToggle.focus();
    };

    const toggleMenu = () => {
      if (isMenuOpen()) {
        closeMenu();
        return;
      }
      openMenu();
    };

    navToggle.addEventListener('click', toggleMenu);

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    document.addEventListener('click', event => {
      if (!isMenuOpen()) return;
      const clickTarget = event.target;
      if (navLinks.contains(clickTarget) || navToggle.contains(clickTarget)) return;
      closeMenu();
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      closeMenu({ focusToggle: true });
    });

    window.addEventListener('scroll', () => {
      if (!isMenuOpen()) return;
      if (scrollCloseTimer) return;

      scrollCloseTimer = window.setTimeout(() => {
        closeMenu();
        scrollCloseTimer = null;
      }, SCROLL_CLOSE_DELAY);
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (window.innerWidth > MENU_BREAKPOINT) {
        closeMenu();
      }
    });

    if (window.innerWidth > MENU_BREAKPOINT) {
      syncMenuState(false);
    } else {
      navLinks.setAttribute('aria-hidden', String(!isMenuOpen()));
    }
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');

  if (contactForm && formMessage) {
    const setFormMessage = (message, state) => {
      formMessage.textContent = message;
      formMessage.classList.remove('is-success', 'is-error');
      if (state) {
        formMessage.classList.add(state);
      }
    };

    contactForm.addEventListener('submit', async event => {
      event.preventDefault();

      const submitButton = contactForm.querySelector('button[type="submit"]');
      const honeypot = contactForm.querySelector('[name="website"]');
      if (honeypot && honeypot.value) {
        setFormMessage('Спасибо! Заявка отправлена, мы скоро перезвоним.', 'is-success');
        contactForm.reset();
        return;
      }
      const formData = new FormData(contactForm);
      formData.delete('website');

      if (submitButton) {
        submitButton.disabled = true;
      }

      setFormMessage('Отправляем заявку...', '');

      try {
        const response = await fetch('/send.php', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result && result.ok === true) {
          setFormMessage('Спасибо! Заявка отправлена, мы скоро перезвоним.', 'is-success');
          contactForm.reset();
          return;
        }

        setFormMessage('Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.', 'is-error');
      } catch (error) {
        setFormMessage('Ошибка сети. Проверьте интернет-соединение и попробуйте снова.', 'is-error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }
