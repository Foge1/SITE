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
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navLinks.setAttribute('aria-hidden', String(!isOpen));
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.setAttribute('aria-hidden', 'true');
    });
  });
}

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
    if (state) formMessage.classList.add(state);
  };

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);

    if (submitButton) submitButton.disabled = true;
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
      } else {
        setFormMessage('Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.', 'is-error');
      }
    } catch (error) {
      setFormMessage('Ошибка сети. Проверьте интернет-соединение и попробуйте снова.', 'is-error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
