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
      box.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
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

// Provence: калькулятор пакетного предложения (ведущий и DJ по желанию, торт +1 кг = +3 000 ₽)
const seg = document.querySelectorAll('.seg__btn');
const addHost = document.getElementById('addHost');
if (seg.length) {
  const $ = id => document.getElementById(id);
  const CAKE_KG_PRICE = 3000, CAKE_MAX = 5;
  let cakeExtra = 0;
  const num = s => +String(s).replace(/\D/g, '');
  const fmt = n => n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₽';
  const render = () => {
    const b = document.querySelector('.seg__btn.is-active');
    const host = addHost && addHost.checked;
    const add = cakeExtra * CAKE_KG_PRICE;
    $('pkDrinks').textContent = b.dataset.drinks;
    $('pkFurshet').textContent = b.dataset.furshet;
    $('pkCake').textContent = (num(b.dataset.cake) + cakeExtra) + ' кг';
    $('pkOld').textContent = fmt(num(host ? b.dataset.old : b.dataset.oldNh) + add);
    $('pkNew').textContent = fmt(num(host ? b.dataset.new : b.dataset.newNh) + add);
    const ce = $('cakeExtra'); if (ce) ce.textContent = '+' + cakeExtra + ' кг';
    document.querySelectorAll('.cake-step__btn').forEach(btn => {
      const d = +btn.dataset.cake;
      btn.disabled = (d < 0 && cakeExtra === 0) || (d > 0 && cakeExtra === CAKE_MAX);
    });
  };
  seg.forEach(b => b.addEventListener('click', () => {
    seg.forEach(x => x.classList.toggle('is-active', x === b)); render();
  }));
  document.querySelectorAll('.cake-step__btn').forEach(btn => btn.addEventListener('click', () => {
    cakeExtra = Math.min(CAKE_MAX, Math.max(0, cakeExtra + +btn.dataset.cake)); render();
  }));
  if (addHost) addHost.addEventListener('change', render);
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

// Шапка: выпадающее меню «Все проекты»
document.querySelectorAll('.projects').forEach(p => {
  const btn = p.querySelector('.projects__btn');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = p.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e => { if (!p.contains(e.target)) { p.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') p.classList.remove('open'); });
});

// Галерея: только фото с Google Диска (gallery-config.js). На странице — первые perPage, остальные в окне «Все фото»
(() => {
  const cfg = window.GALLERY_CONFIG || {};
  const per = cfg.perPage || 12;
  const thumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const FOLDER = 'application/vnd.google-apps.folder';
  const driveQuery = async folder => {
    const q = encodeURIComponent(`'${folder}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = '${FOLDER}')`);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=500&fields=files(id,name,mimeType,createdTime)&key=${cfg.apiKey}`);
    if (!r.ok) throw new Error('drive ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return (await r.json()).files || [];
  };
  // фото из папки и из вложенных папок (на один уровень), новые сверху
  const driveList = async folder => {
    const items = await driveQuery(folder);
    let files = items.filter(f => f.mimeType !== FOLDER);
    for (const sub of items.filter(f => f.mimeType === FOLDER)) {
      try { files = files.concat((await driveQuery(sub.id)).filter(f => f.mimeType !== FOLDER)); } catch (e) {}
    }
    files.sort((a, b) => (b.createdTime || '').localeCompare(a.createdTime || ''));
    return files.map(f => ({ small: thumb(f.id, 900), full: thumb(f.id, 2400) }));
  };
  const tile = (p, n) => {
    const b = document.createElement('button');
    b.className = 'gal-item'; b.type = 'button'; b.dataset.full = p.full; b.setAttribute('aria-label', 'Фото ' + n);
    const img = new Image(); img.loading = 'lazy'; img.alt = ''; img.src = p.small; img.onerror = () => b.remove();
    b.appendChild(img); return b;
  };

  const all = document.querySelector('.gal-all');
  const openAll = (photos, title) => {
    const g = all.querySelector('.gal-all__grid'); g.innerHTML = '';
    photos.forEach((p, k) => g.appendChild(tile(p, k + 1)));
    all.querySelector('.gal-all__title').textContent = title;
    all.classList.add('open'); all.scrollTop = 0; document.body.style.overflow = 'hidden';
  };
  if (all) {
    const close = () => { all.classList.remove('open'); document.body.style.overflow = ''; };
    all.querySelector('.gal-all__close').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && all.classList.contains('open') && !document.querySelector('.lightbox.open')) close(); });
  }

  const setup = async (grid, sec) => {
    const key = grid.dataset.galPanel;
    let photos = [];
    const folder = cfg.folders && cfg.folders[key];
    if (cfg.apiKey && folder) {
      try { photos = await driveList(folder); } catch (e) { console.warn('Галерея: не удалось загрузить фото с Google Диска', e); }
    }
    grid.innerHTML = '';
    photos.slice(0, per).forEach((p, k) => grid.appendChild(tile(p, k + 1)));
    grid.dataset.count = photos.length;
    if (photos.length > per) {
      const more = document.createElement('button');
      more.type = 'button'; more.className = 'btn btn--dark gal-more';
      more.innerHTML = `Смотреть все фото <span>${photos.length}</span>`;
      const tab = sec.querySelector(`.gal-tab[data-gal="${key}"]`);
      more.addEventListener('click', () => openAll(photos, tab ? 'Фото · ' + tab.textContent : 'Все фото'));
      grid.after(more); grid._more = more;
    }
    // пустые вкладки и галереи прячем
    const tab = sec.querySelector(`.gal-tab[data-gal="${key}"]`);
    if (tab && !photos.length) tab.hidden = true;
  };

  document.querySelectorAll('.gal-sec').forEach(async sec => {
    const grids = [...sec.querySelectorAll('.gal-grid')];
    const activate = key => {
      sec.querySelectorAll('.gal-tab').forEach(x => x.classList.toggle('is-active', x.dataset.gal === key));
      grids.forEach(g => { g.classList.toggle('is-active', g.dataset.galPanel === key); if (g._more) g._more.style.display = g.dataset.galPanel === key ? '' : 'none'; });
    };
    sec.querySelectorAll('.gal-tab').forEach(t => t.addEventListener('click', () => activate(t.dataset.gal)));
    await Promise.all(grids.map(g => setup(g, sec)));
    const first = grids.find(g => +g.dataset.count > 0);
    const empty = !first;
    if (empty && sec.hasAttribute('data-hide-empty')) {
      sec.hidden = true;
      document.querySelectorAll(`.subnav a[href="#${sec.id}"]`).forEach(a => a.parentElement.hidden = true);
    } else if (first) activate(first.dataset.galPanel);
    const tabs = sec.querySelector('.gal-tabs');
    if (tabs && [...tabs.children].filter(t => !t.hidden).length < 2) tabs.hidden = true;
  });

  // просмотр фото крупно
  const lb = document.querySelector('.lightbox');
  if (!lb) return;
  const big = lb.querySelector('img');
  let list = [], i = 0;
  const show = () => { big.src = list[i].dataset.full; };
  const close = () => { lb.classList.remove('open'); if (!all || !all.classList.contains('open')) document.body.style.overflow = ''; };
  const step = d => { i = (i + d + list.length) % list.length; show(); };
  document.addEventListener('click', e => {
    const it = e.target.closest('.gal-item');
    if (!it) return;
    list = [...it.parentElement.querySelectorAll('.gal-item')]; i = list.indexOf(it);
    show(); lb.classList.add('open'); document.body.style.overflow = 'hidden';
  });
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
  lb.querySelector('.lightbox__nav--next').addEventListener('click', e => { e.stopPropagation(); step(1); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__close')) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();

// Provence: календарь бронирования (занятые даты — из Google Таблицы, booking-config.js)
(() => {
  const cal = document.querySelector('[data-booking]');
  if (!cal) return;
  const cfg = window.BOOKING_CONFIG || {};
  const MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
  const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const DAYS = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxMonths = cfg.monthsAhead || 18;
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let busy = {};            // 'YYYY-MM-DD' -> {status, note}
  let loaded = false;
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const $ = s => document.querySelector(s);

  const parseCSV = text => {
    const rows = []; let row = [], cell = '', q = false;
    for (let k = 0; k < text.length; k++) {
      const ch = text[k];
      if (q) { if (ch === '"' && text[k + 1] === '"') { cell += '"'; k++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[k + 1] === '\n') k++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };
  const parseDate = s => {
    s = (s || '').trim(); let m;
    if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/))) return new Date(+m[3], +m[2] - 1, +m[1]);
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return new Date(+m[3], +m[1] - 1, +m[2]);
    return null;
  };

  const render = () => {
    $('.bk__month').textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    const days = cal.querySelector('.bk__days'); days.innerHTML = '';
    const lead = (view.getDay() + 6) % 7;
    for (let k = 0; k < lead; k++) days.appendChild(document.createElement('span'));
    const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= n; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const info = busy[key(date)];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bk__day'; b.textContent = d; b.dataset.date = key(date);
      if (date < today) { b.classList.add('is-past'); b.disabled = true; }
      else if (info && info.status === 'busy') { b.classList.add('is-busy'); b.disabled = true; b.title = 'Занято'; }
      else if (info && info.status === 'hold') { b.classList.add('is-hold'); b.title = 'Уточняйте'; }
      else b.classList.add('is-free');
      if (+date === +today) b.classList.add('is-today');
      days.appendChild(b);
    }
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    cal.querySelector('[data-step="-1"]').disabled = view <= first;
    cal.querySelector('[data-step="1"]').disabled = view >= new Date(first.getFullYear(), first.getMonth() + maxMonths, 1);
  };

  const pick = btn => {
    cal.querySelectorAll('.bk__day.is-picked').forEach(x => x.classList.remove('is-picked'));
    btn.classList.add('is-picked');
    const [y, m, d] = btn.dataset.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const human = `${d} ${MONTHS_GEN[m - 1]} ${y}`;
    const info = busy[btn.dataset.date];
    $('.bk__date').textContent = `${human}, ${DAYS[date.getDay()]}`;
    $('.bk__note').textContent = info && info.status === 'hold'
      ? 'На эту дату есть предварительная бронь — позвоните, подскажем.' + (info.note ? ' ' + info.note : '')
      : (loaded ? 'Дата свободна' + (info && info.note ? ' · ' + info.note : '') : 'Уточним наличие по телефону');
    const text = encodeURIComponent(`Здравствуйте! Хочу забронировать банкетный зал Provence на ${human}.`);
    const wa = document.querySelector('[data-bk-wa]');
    if (wa && cfg.whatsapp) wa.href = `https://wa.me/${cfg.whatsapp}?text=${text}`;
    document.querySelector('.bk__picked').classList.add('is-set');
  };

  cal.addEventListener('click', e => {
    const nav = e.target.closest('.bk__nav');
    if (nav) { view = new Date(view.getFullYear(), view.getMonth() + +nav.dataset.step, 1); render(); return; }
    const day = e.target.closest('.bk__day');
    if (day && !day.disabled) pick(day);
  });

  const status = cal.querySelector('.bk__status');
  render();
  if (cfg.sheetCsvUrl) {
    status.textContent = 'Загружаем календарь…';
    fetch(cfg.sheetCsvUrl + (cfg.sheetCsvUrl.includes('?') ? '&' : '?') + 't=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(text => {
        parseCSV(text).slice(1).forEach(([d, s, note]) => {
          const date = parseDate(d); if (!date) return;
          const st = (s || '').trim().toLowerCase();
          const status = st.startsWith('занят') ? 'busy' : st.startsWith('предвар') ? 'hold' : 'free';
          busy[key(date)] = { status, note: (note || '').trim() };
        });
        loaded = true; status.textContent = ''; render();
      })
      .catch(() => { status.textContent = 'Не удалось загрузить календарь — уточните дату по телефону.'; });
  } else {
    status.textContent = 'Календарь обновляется — точную дату подтвердим по телефону.';
  }
})();

// Консалтинг: убрать подпись «Фото», когда фото загружено
document.querySelectorAll('.cs-photo').forEach(el => {
  const m = getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/);
  if (!m) return;
  const img = new Image();
  img.onload = () => el.classList.add('has-photo');
  img.src = m[1];
});

// Переход по якорям: ровно к началу секции, с учётом шапки и подменю
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.hasAttribute('data-open')) return;
  const id = a.getAttribute('href').slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const header = document.querySelector('.header');
  const sub = document.querySelector('.subnav');
  const offset = (header ? header.offsetHeight : 0) + (sub ? sub.offsetHeight : 0);
  const root = document.documentElement;
  const go = () => window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  root.style.scrollSnapType = 'none';
  // закрыть открытое окно, если ссылка была внутри него
  document.querySelectorAll('.modal.open').forEach(m => { m.classList.remove('open'); document.body.style.overflow = ''; });
  go();
  setTimeout(go, 450);   // поправка, если выше успели догрузиться фото
  setTimeout(() => { root.style.scrollSnapType = ''; }, 1100);
  history.replaceState(null, '', '#' + id);
});

// Отступ «прилипания» секций = высота шапки + подменю
(() => {
  const set = () => {
    const h = document.querySelector('.header'), s = document.querySelector('.subnav');
    document.documentElement.style.scrollPaddingTop = ((h ? h.offsetHeight : 0) + (s ? s.offsetHeight : 0)) + 'px';
  };
  set(); window.addEventListener('resize', set); window.addEventListener('scroll', () => requestAnimationFrame(set), { passive: true });
})();
