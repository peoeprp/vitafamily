// Прелоадер «vita family»: скрываем после загрузки страницы (минимум ~1.6 с, чтобы анимация успела проиграться)
(() => {
  const pl = document.querySelector('.preloader');
  if (!pl) return;
  const started = performance.now();
  const hide = () => {
    const wait = Math.max(0, 1600 - (performance.now() - started));
    setTimeout(() => { pl.classList.add('is-done'); document.documentElement.classList.remove('is-loading'); setTimeout(() => pl.remove(), 900); }, wait);
  };
  if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide);
  setTimeout(hide, 4500); // на случай очень медленной загрузки
})();

// Шапка меняет фон при скролле
const header = document.querySelector('.header');
const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 60);
window.addEventListener('scroll', onScroll);
onScroll();

// Бургер-меню на мобильных
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.textContent = nav.classList.contains('open') ? '×' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.textContent = '☰';
  }));
}

// Попапы: любая ссылка/кнопка с data-open="id" открывает модалку
document.querySelectorAll('[data-open]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const modal = document.getElementById(el.dataset.open);
    if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  });
});
const closeModal = m => { m.classList.remove('open'); document.body.style.overflow = ''; };
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m || e.target.classList.contains('modal__close')) closeModal(m);
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(closeModal);
});

// Вкладки внутри меню
document.querySelectorAll('.tabs').forEach(tabs => {
  const box = tabs.closest('.modal__box');
  tabs.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      box.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      box.querySelector('#' + tab.dataset.tab).classList.add('active');
    });
  });
});

// Форма бронирования (демо: показывает подтверждение; подключите отправку на свой сервер)
document.querySelectorAll('.form').forEach(form => {
  const date = form.querySelector('input[type="date"]');
  if (date) date.min = new Date().toISOString().split('T')[0];
  form.addEventListener('submit', e => {
    e.preventDefault();
    // fetch('/api/booking', { method: 'POST', body: new FormData(form) });
    form.style.display = 'none';
    form.nextElementSibling.style.display = 'block';
  });
});

// Подсветка активного пункта подменю
const links = document.querySelectorAll('.subnav a');
if (links.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const s = document.querySelector(l.getAttribute('href')); if (s) io.observe(s); });
}

// Плавное появление блоков
const ro = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); ro.unobserve(en.target); } });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// Cookie-баннер
const cookie = document.querySelector('.cookie');
if (cookie) {
  let accepted = false;
  try { accepted = localStorage.getItem('cookieOk') === '1'; } catch (e) {}
  if (!accepted) cookie.classList.add('show');
  cookie.querySelector('button').addEventListener('click', () => {
    try { localStorage.setItem('cookieOk', '1'); } catch (e) {}
    cookie.classList.remove('show');
  });
}

// Слайдер плашек на главной: крупные плашки, автопрокрутка, точки-прогресс
const track = document.getElementById('tilesTrack');
if (track) {
  const tiles = [...track.querySelectorAll('.tile')];
  const prev = document.querySelector('.slider__arrow--prev');
  const next = document.querySelector('.slider__arrow--next');
  const dotsBox = document.querySelector('.slider__dots');
  const counter = document.querySelector('.slider__counter b');
  const DELAY = 5000;               // смена плашки каждые 5 секунд
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
  let current = 0, timer = null, paused = false;

  const dots = tiles.map((_, i) => {
    const d = document.createElement('button');
    d.className = 'slider__dot'; d.setAttribute('aria-label', 'Ресторан ' + (i + 1));
    d.innerHTML = '<i></i>';
    d.addEventListener('click', () => { go(i); restart(); });
    dotsBox && dotsBox.appendChild(d);
    return d;
  });
  dotsBox && dotsBox.style.setProperty('--delay', DELAY + 'ms');

  const mark = i => {
    current = i;
    tiles.forEach((t, k) => t.classList.toggle('is-current', k === i));
    dots.forEach((d, k) => { d.classList.remove('is-active'); if (k === i) { void d.offsetWidth; d.classList.add('is-active'); } });
    if (counter) counter.textContent = String(i + 1).padStart(2, '0');
  };
  const go = i => {
    i = (i + tiles.length) % tiles.length;
    const t = tiles[i];
    track.scrollTo({ left: t.offsetLeft - (track.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    mark(i);
  };
  const tick = () => { if (!paused && isDesktop() && !document.hidden) go(current + 1); };
  const restart = () => { clearInterval(timer); timer = setInterval(tick, DELAY); mark(current); };

  prev.addEventListener('click', () => { go(current - 1); restart(); });
  next.addEventListener('click', () => { go(current + 1); restart(); });

  // если листают вручную (тачпад, свайп) — определяем, какая плашка в центре
  let scrollT;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      const c = track.scrollLeft + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      tiles.forEach((t, k) => { const d = Math.abs(t.offsetLeft + t.offsetWidth / 2 - c); if (d < dist) { dist = d; best = k; } });
      if (best !== current) { mark(best); restart(); }
    }, 120);
  });
  // пауза, пока курсор на слайдере
  track.parentElement.addEventListener('mouseenter', () => { paused = true; dotsBox && dotsBox.classList.add('is-paused'); });
  track.parentElement.addEventListener('mouseleave', () => { paused = false; dotsBox && dotsBox.classList.remove('is-paused'); restart(); });
  window.addEventListener('resize', () => go(current));
  go(0); restart();
}

// Выбор формата: банкет / фуршет
document.querySelectorAll('.formats').forEach(group => {
  const items = group.querySelectorAll('.format');
  const select = f => items.forEach(i => i.classList.toggle('is-active', i === f));
  items.forEach(f => {
    f.addEventListener('click', () => select(f));
    f.addEventListener('keydown', e => { if (e.key === 'Enter') select(f); });
  });
});

// Ссылка с data-tab-open открывает попап сразу на нужной вкладке
document.querySelectorAll('[data-tab-open]').forEach(el => {
  el.addEventListener('click', () => {
    const tab = document.querySelector('.tab[data-tab="' + el.dataset.tabOpen + '"]');
    if (tab) tab.click();
  });
});

// Provence: калькулятор пакетного предложения
const seg = document.querySelectorAll('.seg__btn');
const noHost = document.getElementById('noHost');
if (seg.length) {
  const $ = id => document.getElementById(id);
  const render = () => {
    const b = document.querySelector('.seg__btn.is-active');
    const nh = noHost && noHost.checked;
    $('pkDrinks').textContent = b.dataset.drinks;
    $('pkFurshet').textContent = b.dataset.furshet;
    $('pkCake').textContent = b.dataset.cake;
    $('pkOld').textContent = (nh ? b.dataset.oldNh : b.dataset.old) + ' ₽';
    $('pkNew').textContent = (nh ? b.dataset.newNh : b.dataset.new) + ' ₽';
  };
  seg.forEach(b => b.addEventListener('click', () => {
    seg.forEach(x => x.classList.toggle('is-active', x === b)); render();
  }));
  if (noHost) noHost.addEventListener('change', render);
  render();
}

// Слайдер новостей (Leckoff)
document.querySelectorAll('.news').forEach(box => {
  const track = box.querySelector('.news__track');
  const slides = [...track.children];
  const sec = box.closest('section');
  const count = sec.querySelector('.news__count b');
  const dotsBox = box.querySelector('.news__dots');
  const delay = +box.dataset.autoplay || 0;
  let cur = 0, timer;
  const dots = slides.map((_, i) => {
    const d = document.createElement('button'); d.setAttribute('aria-label', 'Новость ' + (i + 1));
    d.addEventListener('click', () => { go(i); restart(); }); dotsBox.appendChild(d); return d;
  });
  const mark = i => { cur = i; dots.forEach((d, k) => d.classList.toggle('is-active', k === i)); if (count) count.textContent = String(i + 1).padStart(2, '0'); };
  const go = i => { i = (i + slides.length) % slides.length; track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); mark(i); };
  const restart = () => { clearInterval(timer); if (delay) timer = setInterval(() => { if (!document.hidden) go(cur + 1); }, delay); };
  sec.querySelectorAll('.news__arrow').forEach(b => b.addEventListener('click', () => { go(cur + +b.dataset.dir); restart(); }));
  let t; track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => {
    const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== cur) { mark(i); restart(); } }, 120); });
  box.addEventListener('mouseenter', () => clearInterval(timer));
  box.addEventListener('mouseleave', restart);
  mark(0); restart();
});
