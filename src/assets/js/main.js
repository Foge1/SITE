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

  /* ── Price Calculator ── */

  const calcFab = document.getElementById('calc-fab');
  const calcOverlay = document.getElementById('calc-overlay');

  if (calcFab && calcOverlay) {
    const calcClose = document.getElementById('calc-close');
    const calcServiceEl = document.getElementById('calc-service');
    const calcVolumeEl = document.getElementById('calc-volume');
    const calcVolumeField = document.getElementById('calc-volume-field');
    const calcVolumeLabel = document.getElementById('calc-volume-label');
    const calcDistanceField = document.getElementById('calc-distance-field');
    const calcDistanceEl = document.getElementById('calc-distance');
    const calcMoversField = document.getElementById('calc-movers-field');
    const calcMoversEl = document.getElementById('calc-movers');
    const calcPeopleField = document.getElementById('calc-people-field');
    const calcPeopleEl = document.getElementById('calc-people');
    const calcFloorRow = document.getElementById('calc-floor-row');
    const calcFloorEl = document.getElementById('calc-floor');
    const calcElevatorEl = document.getElementById('calc-elevator');
    const calcSubmitBtn = document.getElementById('calc-submit');
    const calcResultEl = document.getElementById('calc-result');
    const calcResultPrice = document.getElementById('calc-result-price');
    const calcCtaLink = calcOverlay.querySelector('.calc-cta-link');

    const volumeOptions = {
      apartment: [
        { value: '3', text: '3 м' },
        { value: '4', text: '4 м' },
        { value: '6', text: '6 м' }
      ],
      office: [
        { value: '4', text: '4 м' },
        { value: '6', text: '6 м' }
      ],
      gazelle: [
        { value: '3', text: '3 м' },
        { value: '4', text: '4 м' },
        { value: '6', text: '6 м' }
      ],
      trash: [
        { value: 'gazelle', text: 'Газель' },
        { value: 'kamaz', text: 'КамАЗ' }
      ]
    };

    const volumeLabels = {
      apartment: 'Длина кузова',
      office: 'Длина кузова',
      gazelle: 'Длина кузова',
      trash: 'Какая машина?'
    };

    let calculated = false;

    const openCalc = () => {
      calcOverlay.classList.add('is-open');
      calcOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeCalc = () => {
      calcOverlay.classList.remove('is-open');
      calcOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    calcFab.addEventListener('click', openCalc);
    calcClose.addEventListener('click', closeCalc);

    calcOverlay.addEventListener('click', e => {
      if (e.target === calcOverlay) closeCalc();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && calcOverlay.classList.contains('is-open')) closeCalc();
    });

    if (calcCtaLink) {
      calcCtaLink.addEventListener('click', e => {
        e.preventDefault();
        closeCalc();
        const target = document.getElementById('contact');
        if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 200);
      });
    }

    const toggleMoversDetails = () => {
      const need = calcMoversEl.value === 'yes';
      calcPeopleField.hidden = !need;
      calcFloorRow.hidden = !need;
    };

    const showFields = svc => {
      if (!svc) {
        calcVolumeField.hidden = true;
        calcDistanceField.hidden = true;
        calcMoversField.hidden = true;
        calcPeopleField.hidden = true;
        calcFloorRow.hidden = true;
        calcSubmitBtn.disabled = true;
        calcResultEl.hidden = true;
        calculated = false;
        return;
      }

      calcVolumeEl.innerHTML = '';
      volumeOptions[svc].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.text;
        calcVolumeEl.appendChild(o);
      });

      calcVolumeLabel.textContent = volumeLabels[svc];
      calcVolumeField.hidden = false;
      calcDistanceField.hidden = !(svc === 'apartment' || svc === 'office');
      calcMoversField.hidden = false;
      calcMoversEl.value = 'no';
      calcPeopleField.hidden = true;
      calcFloorRow.hidden = true;
      calcSubmitBtn.disabled = false;
      calcResultEl.hidden = true;
      calculated = false;
    };

    const calculate = () => {
      const svc = calcServiceEl.value;
      if (!svc) return;

      const vol = calcVolumeEl.value;
      const dist = calcDistanceEl.value;
      const needMovers = calcMoversEl.value === 'yes';
      const people = parseInt(calcPeopleEl.value, 10);
      const floor = parseInt(calcFloorEl.value, 10);
      const noElevator = calcElevatorEl.value === 'no';

      let transport = 0;

      if (svc === 'apartment' || svc === 'office' || svc === 'gazelle') {
        transport = { 3: 2400, 4: 2700, 6: 3800 }[vol] || 2400;
      } else if (svc === 'trash') {
        transport = { gazelle: 6000, kamaz: 9000 }[vol] || 6000;
      }

      let movers = 0;
      if (needMovers) {
        movers = people * 1400;
      }

      let distNote = false;
      if (svc === 'apartment' || svc === 'office') {
        if (dist === 'mid') {
          transport += transport / 2;
          if (needMovers) movers += people * 700;
        } else if (dist === 'far') {
          distNote = true;
        }
      }

      if (needMovers && noElevator && floor > 1) {
        movers += people * floor * 150;
      }

      const total = transport + movers;
      const noteEl = calcResultEl.querySelector('.calc-result-note');

      calcResultPrice.textContent = 'от ' + total.toLocaleString('ru-RU') + ' \u20BD';
      noteEl.textContent = distNote
        ? 'Километраж за пределами города рассчитаем при звонке и добавим к стоимости'
        : 'Точную цену назовём после уточнения деталей';
      calcResultEl.hidden = false;
      calculated = true;
    };

    calcServiceEl.addEventListener('change', () => showFields(calcServiceEl.value));
    calcMoversEl.addEventListener('change', () => {
      toggleMoversDetails();
      if (calculated) calculate();
    });
    calcSubmitBtn.addEventListener('click', calculate);

    [calcVolumeEl, calcFloorEl, calcElevatorEl, calcDistanceEl, calcPeopleEl].forEach(el => {
      el.addEventListener('change', () => { if (calculated) calculate(); });
    });
  }
