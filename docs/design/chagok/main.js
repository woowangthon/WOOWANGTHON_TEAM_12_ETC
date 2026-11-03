// 모음 필터: 선택한 모음의 경험만 보여준다
const items = document.querySelectorAll('[data-collection]');
const chips = document.querySelectorAll('.filters .chip');

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    const filter = chip.dataset.filter;
    items.forEach((item) => {
      item.hidden = filter !== 'all' && item.dataset.collection !== filter;
    });
    // 리스트 보기: 보이는 경험이 없는 달은 빈 달(가는 선) 모양으로 바꾼다
    document.querySelectorAll('.list-month').forEach((month) => {
      month.classList.toggle('has-items', !!month.querySelector('.list-card:not([hidden])'));
    });
  });
});

// 리스트 / 타임라인 보기 전환 — 주소의 #list 로 새로고침해도 리스트 보기를 유지한다
const viewButtons = document.querySelectorAll('.view-toggle__btn');
const sortLabel = document.querySelector('.sort__label');
const pageYear = document.querySelector('.page-year');
const SORT_LABELS = { timeline: '최근 기록순', list: '시작일순' };
let updatePageYear = () => {}; // 타임라인 준비가 끝나면 아래에서 채운다

function showView(view) {
  viewButtons.forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
  if (sortLabel) sortLabel.textContent = SORT_LABELS[view];
  if (view === 'list') {
    const list = document.querySelector('.tl-list');
    if (pageYear && list) pageYear.textContent = list.dataset.year;
  } else {
    updatePageYear();
  }
}

if (viewButtons.length) {
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      showView(btn.dataset.view);
      history.replaceState(null, '', btn.dataset.view === 'list' ? '#list' : location.pathname);
    });
  });
  showView(location.hash === '#list' ? 'list' : 'timeline');
}

// 추천 질문을 누르면 AI 검색 입력에 채운다
const aiInput = document.querySelector('.ai-search input');
document.querySelectorAll('.suggest__chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    aiInput.value = chip.textContent.trim();
    aiInput.focus();
  });
});

// 아래로 스크롤하면 상단 도구 모음을 숨기고, 위로 올리면 다시 보여준다
const workspace = document.querySelector('.workspace');
const SCROLL_THRESHOLD = 6;
let lockUntil = 0; // 도구 모음이 움직이는 동안 생기는 스크롤 변화는 무시

function watchScroll(el) {
  if (!el) return;
  let last = el.scrollTop;
  el.addEventListener('scroll', () => {
    const y = el.scrollTop;
    if (performance.now() < lockUntil) { last = y; return; }
    if (Math.abs(y - last) < SCROLL_THRESHOLD) return;
    const hide = y > last && y > SCROLL_THRESHOLD;
    last = y;
    if (hide !== workspace.classList.contains('is-toolbar-hidden')) {
      workspace.classList.toggle('is-toolbar-hidden', hide);
      lockUntil = performance.now() + 300;
    }
  }, { passive: true });
}

watchScroll(document.querySelector('.workspace__scroll'));

// 타임라인: 화면 아래에 고정된 가로 스크롤바와 타임라인 가로 위치를 맞춘다
const tl = document.querySelector('.tl');
const hscroll = document.querySelector('.tl-hscroll');

// 타임라인 월 머리글: 시작 연도 1월부터 (올해 + 1년) 12월까지 끊김 없이 이어 붙인다
if (tl) {
  const firstYear = Number(tl.dataset.startYear);
  const lastYear = Math.max(firstYear, new Date().getFullYear() + 1);
  const months = [];
  for (let y = firstYear; y <= lastYear; y++) {
    for (let m = 1; m <= 12; m++) {
      // 해가 바뀌는 1월에는 연도를 함께 적어 경계를 알 수 있게 한다
      months.push(m === 1 && y > firstYear ? `<li class="is-year-start">${y}년 1월</li>` : `<li>${m}월</li>`);
    }
  }
  tl.querySelector('.tl__months').innerHTML = months.join('');
  tl.style.setProperty('--months', months.length);

  // 화면 왼쪽 끝(반 달 안쪽)에 걸린 달의 연도를 제목에 보여준다
  const monthWidth = tl.querySelector('.tl__months li').offsetWidth || 160;
  updatePageYear = () => {
    if (!pageYear || tl.hidden) return;
    const index = Math.floor((tl.scrollLeft + monthWidth / 2) / monthWidth);
    pageYear.textContent = String(Math.min(lastYear, firstYear + Math.floor(index / 12)));
  };
  tl.addEventListener('scroll', updatePageYear, { passive: true });
  updatePageYear();
}

if (tl && hscroll) {
  const spacer = hscroll.firstElementChild;
  const sizeSpacer = () => { spacer.style.width = `${tl.scrollWidth}px`; };
  // 값이 같으면 건드리지 않아 서로의 scroll 이벤트가 무한히 오가지 않는다
  const sync = (from, to) => from.addEventListener('scroll', () => {
    if (to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
  }, { passive: true });
  sync(tl, hscroll);
  sync(hscroll, tl);
  sizeSpacer();
  new ResizeObserver(sizeSpacer).observe(tl);
}

// 사이드바 접기 / 펼치기 — 페이지를 옮겨도 유지되도록 저장한다 (적용은 <body> 첫 스크립트)
const drawerToggle = document.querySelector('.drawer-toggle');
if (drawerToggle) {
  const root = document.documentElement;
  const syncToggle = () => {
    const collapsed = root.classList.contains('drawer-collapsed');
    drawerToggle.setAttribute('aria-expanded', String(!collapsed));
    drawerToggle.setAttribute('aria-label', collapsed ? '사이드바 펼치기' : '사이드바 접기');
  };
  const FADE_MS = 140;  // styles.css 의 --drawer-fade 와 맞춘다
  const SLIDE_MS = 300; // styles.css 의 --drawer-slide 와 맞춘다
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animating = false;

  const applyToggle = () => {
    const collapsed = root.classList.toggle('drawer-collapsed');
    try { localStorage.setItem('drawer', collapsed ? 'collapsed' : 'expanded'); } catch (e) {}
    syncToggle();
  };

  drawerToggle.addEventListener('click', () => {
    if (reduceMotion.matches) { applyToggle(); return; }
    if (animating) return; // 애니메이션 도중의 연타는 무시
    animating = true;
    // 1) 현재 내용을 흐리게 → 2) 레이아웃을 바꾸면 폭이 미끄러지듯 변함 → 3) 폭이 거의 다 바뀔 즈음 새 내용을 보여줌
    root.classList.add('drawer-fading');
    setTimeout(() => {
      applyToggle();
      setTimeout(() => {
        root.classList.remove('drawer-fading');
        setTimeout(() => { animating = false; }, FADE_MS);
      }, SLIDE_MS * 0.7);
    }, FADE_MS);
  });
  syncToggle();
}

// ⌘K / Ctrl+K 로 빠른 검색에 포커스
const quickSearch = document.querySelector('.quick-search input');
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    quickSearch.focus();
  }
});
