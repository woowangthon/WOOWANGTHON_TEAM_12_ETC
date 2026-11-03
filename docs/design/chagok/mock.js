// 차곡 시안 3 — 화면 배치 확인용 정적 시안. 서버 · AI 호출 없음, 모든 데이터는 아래 예시(SAMPLE)다.
// 디자인 담당 시안(styles.css · main.js · assets)을 바탕으로 PM 피드백(ETC#19)을 얹었다.
// 주황 「이번 피드백 보기」를 누르면 바뀐 자리마다 번호와 이유가 뜬다(보라 = PM 이 정할 것).
/* ---------- 예시 데이터 ---------- */
const CATS = {
  project: { name: "프로젝트 · 일", icon: "assets/home/folder.svg", accent: "var(--blue)", bg: "var(--blue-bg)", card: "blue" },
  study: { name: "공부 · 성장", icon: "assets/home/sprout-small.svg", accent: "var(--green)", bg: "var(--green-bg)", card: "green" },
  club: { name: "동아리 · 대외활동", icon: "assets/home/exclude.svg", accent: "var(--pink)", bg: "var(--pink-bg)", card: "pink" },
};

// st: ok(원문에서 확인) · mine(내가 입력) · review(확인 필요) / who: ME · TEAM · UNKNOWN
const ACTS = [
  { id: 1, name: "졸업 프로젝트 「모아봄」", cat: "project", start: "2026-03", end: null, ongoing: true, sources: ["모아봄-README.md"], xs: [
    { t: "사진을 날짜별로 묶어 보여 주는 타임라인 화면을 만들고 있다", tags: ["기술 구현"], who: "ME", st: "ok", src: "모아봄-README.md", line: 12, q: "사진을 촬영 날짜별로 묶어 보여 주는 타임라인 화면을 맡아 만들고 있다.", added: "오늘" },
    { t: "중간 발표에서 업로드가 느리다는 지적을 받고 이미지 압축을 넣었다", tags: ["문제 해결"], who: "TEAM", st: "ok", src: "모아봄-README.md", line: 31, q: "중간 발표 때 업로드가 느리다는 피드백을 받고, 올리기 전에 이미지를 압축하도록 바꿨다.", added: "어제" },
    { t: "이슈와 PR 로 일을 나눈다", tags: ["협업"], who: "TEAM", st: "ok", src: "모아봄-README.md", line: 40, q: "작업은 GitHub 이슈로 나누고 PR 리뷰를 거쳐 합친다." },
  ] },
  { id: 2, name: "현장실습 — 핀테크 스타트업 프론트엔드", cat: "project", start: "2026-01", end: "2026-02", sources: ["현장실습-회고.md"], xs: [
    { t: "결제 내역 화면의 긴 목록을 가상 스크롤로 바꿨다", tags: ["기술 구현", "문제 해결"], who: "ME", st: "ok", src: "현장실습-회고.md", line: 8, q: "결제 내역이 수천 건이면 화면이 버벅여서 가상 스크롤을 적용했다." },
    { t: "주간 회의에서 맡은 화면의 진행 상황을 공유했다", tags: ["소통"], who: "ME", st: "mine" },
  ] },
  { id: 3, name: "IT 연합 동아리 웹 파트", cat: "club", start: "2025-08", end: "2026-02", sources: ["2025-동아리-정리.md"], xs: [
    { t: "신입 부원 스터디에서 React 기초를 두 번 발표했다", tags: ["발표", "리더십"], who: "ME", st: "ok", src: "2025-동아리-정리.md", line: 5, q: "신입 부원 대상 React 기초 스터디에서 두 차례 발표를 맡았다.", added: "10월 30일" },
    { t: "해커톤에서 프론트를 맡아 24시간 안에 시연 화면을 만들었다", tags: ["기술 구현"], who: "TEAM", st: "ok", src: "2025-동아리-정리.md", line: 14, q: "동아리 해커톤에서 프론트엔드를 맡아 시연 화면을 완성했다." },
  ] },
  { id: 4, name: "UX 리서치 수업 팀 프로젝트", cat: "project", start: "2025-09", end: "2025-12", sources: ["UX리서치-기말보고서.md"], xs: [
    { t: "사용자 인터뷰 다섯 번을 정리해 문제를 다시 정의했다", tags: ["분석", "기획"], who: "TEAM", st: "ok", src: "UX리서치-기말보고서.md", line: 22, q: "다섯 번의 인터뷰를 정리하며, 기능이 부족한 게 아니라 시작하는 방법을 몰랐다는 걸 알게 됐다." },
    { t: "인터뷰 질문지를 직접 만들었다", tags: ["기획"], who: "UNKNOWN", st: "review", src: "UX리서치-기말보고서.md", line: null, q: "인터뷰 질문지를 작성했다.", miss: true, added: "10월 28일" },
  ] },
  { id: 5, name: "바꿔요 — 캠퍼스 중고거래 앱", cat: "project", start: "2025-03", end: "2025-06", sources: ["바꿔요-회고.md", "바꿔요-README.md"], xs: [
    { t: "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다", tags: ["문제 해결", "기술 구현"], who: "ME", st: "ok", src: "바꿔요-회고.md", line: 18, q: "채팅이 몇 초씩 늦게 보이는 문제가 있어 폴링을 WebSocket 으로 바꿨다.",
      fill: { q: "고친 뒤 메시지가 제때 오는지 어떻게 확인했나요?", a: "두 기기로 동시에 보내 보고, 지연이 1초 안인 걸 확인했어요.", from: "OO 부트캠프 문항에서 답함" } },
    { t: "매주 금요일 스프린트 회고를 했다", tags: ["협업"], who: "TEAM", st: "ok", src: "바꿔요-회고.md", line: 25, q: "매주 금요일에 그 주의 일을 돌아보는 회고를 했다." },
    { t: "화면 설계 방향이 갈렸을 때 사용자 의견을 먼저 듣자고 제안했다", tags: ["협업", "소통"], who: "ME", st: "ok", src: "바꿔요-회고.md", line: 41, q: "디자인과 개발 의견이 갈려서, 실제 사용자 다섯 명에게 먼저 물어보자고 제안했다." },
    { t: "서비스를 AWS 에 배포했다", tags: ["기술 구현"], who: "TEAM", st: "ok", src: "바꿔요-README.md", line: 33, q: "EC2 와 RDS 로 배포했다." },
    { t: "거래 후기 기능 아이디어를 냈다", tags: ["기획"], who: "ME", st: "review", src: "바꿔요-회고.md", line: null, q: "후기 기능을 넣자는 의견이 나왔다.", miss: true },
  ] },
  { id: 6, name: "정보처리기사 필기 준비", cat: "study", start: "2025-02", end: "2025-04", sources: ["2024-활동정리.md"], xs: [] },
  { id: 7, name: "신입생 학습 멘토", cat: "club", start: "2025", end: "2025", sources: ["2024-활동정리.md"], xs: [
    { t: "신입생 네 명의 C 언어 과제 질문을 매주 받아 줬다", tags: ["책임감"], who: "ME", st: "ok", src: "2024-활동정리.md", line: 19, q: "학습 멘토로 신입생 4명의 C 언어 과제 질문을 매주 받았다." },
  ] },
  { id: 8, name: "알고리즘 스터디", cat: "study", start: "2024-09", end: null, ongoing: true, sources: ["2024-활동정리.md"], xs: [
    { t: "매주 문제 세 개를 풀고 풀이를 블로그에 정리한다", tags: ["학습", "끈기"], who: "ME", st: "ok", src: "2024-활동정리.md", line: 7, q: "매주 세 문제씩 풀고 풀이를 블로그에 올린다.", added: "11월 1일" },
    { t: "스터디 일정과 문제 목록을 관리했다", tags: ["운영"], who: "ME", st: "ok", src: "2024-활동정리.md", line: 9, q: "스터디 일정과 주차별 문제 목록을 관리했다." },
  ] },
  { id: 9, name: "밴드 동아리 「소리결」 총무", cat: "club", start: "2024-03", end: "2025-02", sources: ["2024-활동정리.md"], xs: [
    { t: "공연 예산을 표로 정리해 회비 쓰임을 공개했다", tags: ["운영", "책임감"], who: "ME", st: "ok", src: "2024-활동정리.md", line: 27, q: "공연 예산을 엑셀로 정리해 회비 사용 내역을 부원들에게 공개했다." },
    { t: "정기 공연 대관 일정을 조율했다", tags: ["소통"], who: "ME", st: "review", src: "2024-활동정리.md", line: null, q: "공연장 대관 일정 조율.", miss: true },
  ] },
  { id: 10, name: "교내 SW 경진대회", cat: "project", start: "2024-11", end: "2024-11", sources: ["2024-활동정리.md"], xs: [
    { t: "3인 팀으로 캠퍼스 분실물 찾기 웹을 만들어 장려상을 받았다", tags: ["기술 구현", "협업"], who: "TEAM", st: "ok", src: "2024-활동정리.md", line: 33, q: "3인 팀으로 분실물 찾기 웹을 만들어 장려상을 받았다." },
  ] },
  { id: 11, name: "기술 블로그", cat: "study", start: null, end: null, sources: ["붙여넣은 텍스트 10-28"], xs: [
    { t: "React 렌더링 최적화 글을 썼다", tags: ["학습"], who: "ME", st: "ok", src: "붙여넣은 텍스트 10-28", line: 2, q: "React 렌더링 최적화에 대한 글을 블로그에 올렸다." },
  ] },
];
const ALL_X = ACTS.flatMap((a) => a.xs.map((x) => ({ ...x, act: a })));
const SOURCES = [...new Set(ACTS.flatMap((a) => a.sources))];

// 저장한 경험(북마크) 예시
[[5, 0], [1, 1], [8, 0]].forEach(([a, i]) => (ACTS.find((v) => v.id === a).xs[i].saved = true));
ALL_X.forEach((x) => (x.saved = x.act.xs.find((y) => y.t === x.t).saved));

// 지원서 = 지원처 하나 + 문항 여러 개(SPEC S-18)
const APPS = [
  { id: 1, name: "OO 부트캠프", role: "백엔드 과정", kind: "부트캠프", state: "작성 중 · 문항 3" },
  { id: 2, name: "IT 연합 동아리 운영진", role: "", kind: "동아리", state: "추천 완료 · 문항 2" },
  { id: 3, name: "OO 공모전", role: "", kind: "공모전", state: "경험 찾는 중…", wait: true },
];

/* ---------- 작은 도구 ---------- */
const $ = (s, el = document) => el.querySelector(s);
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></svg>',
  stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h5"/></svg>',
  clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m20 11-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  panel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg>',
  up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
};
const WHO = { TEAM: "팀", UNKNOWN: "누가 했는지 모름" };
/** 바뀐 자리 표시 — 「이번 피드백 보기」에서 번호와 이유가 뜬다. q = PM 이 정할 것. 번호는 그린 뒤 화면 순서로 붙인다 */
const note = (text, q = false) => ` data-note="${text.replace(/"/g, "&quot;")}"${q ? " data-q" : ""}`;
const style = (cat) => `--accent:${CATS[cat].accent};--accent-bg:${CATS[cat].bg}`;
const page = document.body.dataset.page;
const params = new URLSearchParams(location.search);

function status(x) {
  if (x.st === "ok") return `<span class="ok" title="원문에서 확인한 경험이에요">${ICON.check}<span class="sr">원문 확인</span></span>`;
  if (x.st === "mine") return `<span class="mine">${ICON.pen}내가 입력</span>`;
  return `<span class="review">${ICON.warn}확인 필요</span>`;
}
const tags = (x) => x.tags.map((t) => `<span class="tag ${x.st === "mine" ? "" : "tag--ai"}"${x.st === "mine" ? "" : ' title="AI 가 붙인 역량이에요 — 해석이라 고칠 수 있어요"'}>#${t}</span>`).join("");
const month = (s, end) => { if (!s) return null; const [y, m] = s.split("-").map(Number); return y * 12 + (m ? m - 1 : end ? 11 : 0); };
const NOW = (() => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); })();
const span = (a) => { const s = month(a.start, false); return s == null ? null : { s, e: a.ongoing ? NOW : month(a.end ?? a.start, true) }; };
const fmt = (s) => (s ? s.replace("-", ".") : "");
const period = (a) => !a.start ? "기간 모름" : a.ongoing ? `${fmt(a.start)} – <span class="live">진행 중</span>` : a.start === a.end ? fmt(a.start) : `${fmt(a.start)} – ${fmt(a.end)}`;
const reviews = ALL_X.filter((x) => x.st === "review");

/* ---------- 틀: 사이드바 · 도구 모음 ---------- */
function shell(crumb, body, { split = false } = {}) {
  const nav = (id, href, icon, label, count, extra = "") =>
    `<a class="nav__item ${page === id ? "is-active" : ""}" href="${href}" data-tip="${label}"${extra}>${icon}<span class="nav__label">${label}</span>${count != null ? `<span class="nav__count">${count}</span>` : ""}</a>`;
  const appId = Number(params.get("app") || 1);
  return `
  <div class="bg-blur" aria-hidden="true"><img src="assets/home/bg-blur.svg" width="1500" height="1629.5" alt="" /></div>
  <aside class="drawer">
    <div class="brand"${note("사이드바 폭 286 → 248. 접으면 둥근 아이콘만 남는 레일이 되고, 접힌 상태에선 로고에 마우스를 올리면 「사이드바 열기」로 바뀐다(Gemini 방식). 로고 칸 높이를 고정해 로고 ↔ 열기 버튼이 바뀌어도 아래가 흔들리지 않는다")}>
      <a href="index.html" aria-label="차곡 홈"><img class="brand__wordmark" src="assets/home/logo.svg" width="93.1919" height="26.364" alt="차곡" /><img class="brand__symbol" src="assets/home/logo-symbol.svg" width="23.7059" height="26" alt="차곡" /></a>
      <span class="brand__tools"><button type="button" class="circle drawer-toggle" data-tip="사이드바 열기" aria-label="사이드바 접기" aria-expanded="true">${ICON.panel}</button></span>
    </div>
    <button type="button" class="btn-add" data-menu="plus" data-tip="추가"${note("「자료 넣기」 · 「생각난 김에 한 줄」 두 버튼을 「+ 추가」 하나로. 누르면 자료 가져오기 · 직접 기록하기 · 새 지원서 중에서 고른다. 검은 알약 대신 홈 · 내 경험과 같은 메뉴 줄 모양(Gemini 의 「새 채팅」처럼), 접은 레일에선 같은 동그라미")}>
      <img src="assets/home/plus.svg" width="18" height="18" alt="" /><span class="btn-add__label">추가</span></button>
    <nav class="nav" aria-label="주요 메뉴">
      ${nav("home", "index.html", ICON.home, "홈")}
      ${nav("exp", "experience.html", ICON.stack, "내 경험", ALL_X.length, note("「타임라인 · 저장한 경험 · 넣은 자료」를 「내 경험」 하나로 — 셋 다 같은 경험을 보는 방법(타임라인 · 목록 · 자료별)과 거르기(저장한 것)라서. 이름이 「타임라인」이면 보기 하나만 떠올라 바꿨다", true))}
      <a class="nav__item rail-only" href="apply.html" data-tip="지원서">${ICON.doc}<span class="nav__label">지원서</span></a>
    </nav>
    <section class="apps"${note("지원서 목록을 사이드바에 — 대화 목록처럼 최근 지원서가 바로 보이고, 누르면 그 지원서의 문항들로. 지원서 = 지원처 하나 + 문항 여러 개(SPEC S-18). 활동 분류 · 자주 쓰인 역량은 사이드바에서 빼서 내 경험의 거르기로")}>
      <div class="apps__head"><span>지원서</span><button type="button" class="circle" style="width:26px;height:26px" data-open="app" aria-label="새 지원서">${ICON.plus}</button></div>
      ${APPS.map((a) => `<a class="app-link ${page === "apply" && a.id === appId ? "is-active" : ""}" href="apply.html?app=${a.id}">${a.name}${a.role ? ` · ${a.role}` : ""}<small><i class="${a.wait ? "wait" : ""}"></i>${a.kind} · ${a.state}</small></a>`).join("")}
      <a class="app-more" href="apply.html">모든 지원서</a>
    </section>
    <div class="drawer__spacer"></div>
    <div class="profile" title="예시 계정"><div class="profile__avatar">차</div><div class="profile__info"><span class="profile__name">예시 사용자</span><span class="profile__desc">시안 · SAMPLE 데이터</span></div><button type="button" class="icon-btn" aria-label="설정"><img src="assets/home/settings-2.svg" width="17" height="17" alt="" /></button></div>
  </aside>
  <main class="workspace">
    <header class="toolbar">
      <div class="crumbs"><img src="assets/home/archive.svg" width="17" height="17" alt="" /><span>내 서랍</span><span class="crumbs__sep">/</span><strong>${crumb}</strong></div>
      <div class="toolbar__right">
        <label class="tsearch"${note("검색은 알림 옆으로 — 찾는 건 경험이라 화면 위쪽이 자연스럽다. 누르면 넓어진다(Ctrl K). 뜻으로 찾기는 홈의 「물어보기」가 맡는다")}><span class="circle">${ICON.search}</span><span class="quick-search"><input placeholder="내 경험에서 검색" /></span></label>
        <button type="button" class="circle bell" data-menu="bell" aria-label="알림 — 확인할 것 ${reviews.length}"${note("「확인해 주세요」 큰 칸을 홈에서 빼고 알림함으로 — 빨간 점 하나. 누르면 AI 가 원문에서 못 찾은 경험 · 끝난 분석 · 추천 완료가 뜬다. 재촉하는 알림(「오늘 기록하세요」)은 없다")}><img src="assets/home/bell.svg" width="19" height="19" alt="" /><i></i></button>
        <span class="divider"></span>
        <span class="save-state"><img src="assets/home/cloud-check.svg" width="15" height="15" alt="" />모두 저장됨</span>
      </div>
    </header>
    ${split ? body : `<div class="workspace__scroll">${body}</div>`}
  </main>`;
}

/* ---------- 홈 — 입력 하나, 안에서 모드 고르기 ---------- */
// 모드 색은 로고의 세 색에서: 물어보기 = 파랑, 지원서 = 분홍, 쌓기 = 초록
const MODES = {
  ask: { name: "물어보기", color: "var(--blue)", desc: "내 경험에 대해 한 줄로 물어봐요", ph: "예: 동아리에서 사람들 의견을 모아 본 적 있었나?", chips: [["리더십을 보여 준 경험 있어?", "var(--blue)"], ["작년에 뭐 했더라", "var(--green)"], ["실패했다가 다시 해 본 일", "var(--pink)"]], hint: "쌓인 경험에서 찾아 근거와 함께 보여 줘요" },
  app: { name: "지원서 만들기", color: "var(--pink)", desc: "문항 · 공고를 넣으면 맞는 경험을 찾아요", ph: "지원 문항이나 공고를 붙여 넣어 보세요 — 문항이 여러 개여도 돼요", chips: [["지원 동기", "var(--pink)"], ["협업 · 갈등", "var(--pink)"], ["기술 문제 해결", "var(--pink)"], ["실패와 배움", "var(--pink)"]], hint: "자주 나오는 문항을 눌러 바로 넣을 수 있어요" },
  in: { name: "쌓기", color: "var(--green)", desc: "자료 · 한 줄을 넣으면 AI 가 정리해요", ph: "README · 회고 · 노트를 붙여 넣거나, 한 줄만 적어도 돼요", chips: [[".md · .txt 파일 올리기", "var(--green)"], ["노션에서 복사한 활동 정리", "var(--green)"], ["한 줄: 스터디에서 처음 발표했다", "var(--green)"]], hint: "넣은 자료는 분석을 위해 외부 AI 제공사(OpenAI)로 보내져요 · 학습엔 안 쓰여요" },
};
const chipsHtml = (m) => m.chips.map(([c, col]) => `<button type="button" class="sg sg--dot" style="--dot:${col}">${c}</button>`).join("");
function home() {
  const m = MODES.ask;
  return shell("홈", `
  <div class="home">
    <section class="hero"${note("배경을 로고의 세 색(파랑 · 초록 · 분홍)으로 은은하게 — 파랑 하나라 차갑던 걸 시안 원래 분위기로. 작은 글은 회색 단계로 낮추고, 칩 앞에 색 점")}>
      <h1>어떤 경험을 꺼내볼까요?</h1>
      <p class="hero__sub"><span class="dot3"><i style="background:var(--blue)"></i><i style="background:var(--green)"></i><i style="background:var(--pink)"></i></span>경험 ${ALL_X.length}개가 차곡차곡 쌓여 있어요 · <a href="experience.html?view=list&f=review">확인할 것 ${reviews.length}</a></p>
      <form class="ask-box" data-ask data-mode="ask">
        <textarea rows="2" placeholder="${m.ph}"></textarea>
        <div class="ask-box__bar">
          <button type="button" class="circle" data-menu="plus" aria-label="자료 · 파일 추가">${ICON.plus}</button>
          <span class="ask-box__hint">${m.hint}</span>
          <button type="button" class="mode-pick" data-menu="model"${note("보내기 옆은 모델 고르는 자리로 비워 둔다 — 나중에 내 API 키 · 모델을 고르게 하면 여기(BYOK, ETC#28 · P1). 지금은 팀 기본 모델 하나", true)}><span>기본 모델</span>${ICON.down}</button>
          <button type="submit" class="ask-box__send" aria-label="보내기">${ICON.up}</button>
        </div>
      </form>
      <div class="modes" role="tablist"${note("물어보기 · 지원서 만들기 · 쌓기는 입력칸 아래에서 바꾼다(Gemini 의 채팅 / 작업처럼). 보내기 옆 자리를 나중의 모델 고르기에 남기려고", true)}>${Object.entries(MODES).map(([k, v]) => `<button type="button" class="${k === "ask" ? "is-active" : ""}" data-pick-mode="${k}"><i style="background:${v.color}"></i>${v.name}</button>`).join("")}</div>
      <div class="suggest">${chipsHtml(m)}</div>
      <div class="answer" hidden${note("「물어보기」 — 지원서를 만들지 않고 한 줄로 물으면, 쌓인 경험에서 찾아 근거와 함께 답한다. 맞으면 「지원서로 만들기」로 이어진다. 지금 SPEC 에 없는 동작이라(문항 매칭 S-18 ~ S-20 을 저장 없이 쓰는 것) 넣을지 정해야 한다", true)}></div>
    </section>
    <section class="later"${note("「이어서」 세 칸 — 색 아이콘으로 무슨 칸인지 먼저 보이게")}>
      <h2>이어서</h2>
      <div class="later__row">
        <a class="mini" href="apply.html?app=1" style="--c:var(--pink);--cb:var(--pink-bg)"><span class="mini__ic">${ICON.doc}</span><span class="mini__k">작성 중인 지원서</span><b>OO 부트캠프 · 백엔드 과정</b><small>문항 3개 중 1개 남음</small></a>
        <a class="mini" href="experience.html?a=1" style="--c:var(--green);--cb:var(--green-bg)"><span class="mini__ic">${ICON.stack}</span><span class="mini__k">어제 쌓임</span><b>모아봄-README.md 에서 경험 3개</b><small>졸업 프로젝트 「모아봄」</small></a>
        <a class="mini" href="experience.html?a=4" style="--c:var(--blue);--cb:var(--blue-bg)"><span class="mini__ic"><img src="assets/home/history.svg" alt="" /></span><span class="mini__k">1년 전 이맘때</span><b>사용자 인터뷰 다섯 번으로 문제를 다시 정의</b><small>UX 리서치 수업 팀 프로젝트</small></a>
      </div>
    </section>
  </div>`);
}
function askAnswer(text) {
  const hits = [pick(3, 0), pick(5, 2), pick(9, 0)];
  return `<div class="answer__head"><span class="ai-chip">AI</span> 「${text || "동아리에서 사람들 의견을 모아 본 적 있었나?"}」 — 관련 경험 ${hits.length}개를 찾았어요</div>
    ${hits.map((x) => `<a class="hit" href="experience.html?a=${x.act.id}" style="${style(x.act.cat)}"><span class="act-chip">${x.act.name.split(" — ")[0]}</span><b>${x.t}</b><span class="hit__q"><span class="ok">${ICON.check}</span>「${x.q}」 <span class="muted">${x.src}</span></span></a>`).join("")}
    <div class="answer__foot"><span class="muted">자료에 없는 건 지어내지 않았어요.</span><button type="button" class="btn btn--line" data-open="app">이 경험으로 지원서 만들기</button></div>`;
}

/* ---------- 내 경험 — 하나의 공간, 여러 보기 ---------- */
function row(a, year, faint) {
  const sp = span(a), first = year * 12;
  const cells = Array.from({ length: 12 }, (_, i) => { const m = first + i; const on = sp && m >= sp.s && m <= sp.e; return `<i class="${on ? (a.ongoing && m === sp.e ? "fade" : "on") : ""}"></i>`; }).join("");
  const rev = a.xs.filter((x) => x.st === "review").length;
  const sub = faint ? `${Math.floor(sp.s / 12)}년부터 이어짐` : `${period(a)} · ${a.xs.length ? `경험 ${a.xs.length}` : "경험 아직 없음"}${rev ? `<span class="review">${ICON.warn}확인 필요 ${rev}</span>` : ""}`;
  return `<button type="button" class="row ${faint ? "row--faint" : ""}" data-a="${a.id}" data-cat="${a.cat}" style="${style(a.cat)}">
    <span><span class="row__name"><img src="${CATS[a.cat].icon}" width="13" height="13" alt="" />${a.name}</span><span class="row__sub">${sub}</span></span>${year ? `<span class="band">${cells}</span>` : ""}</button>`;
}
function timelineView() {
  const dated = ACTS.filter((a) => span(a));
  const years = [...new Set(dated.flatMap((a) => { const s = span(a), ys = []; for (let y = Math.floor(s.s / 12); y <= Math.floor(s.e / 12); y++) ys.push(y); return ys; }))].sort((a, b) => b - a);
  const html = years.map((y, i) => {
    const starts = dated.filter((a) => Math.floor(span(a).s / 12) === y);
    const cont = dated.filter((a) => { const s = span(a); return Math.floor(s.s / 12) < y && Math.floor(s.e / 12) >= y; });
    return `<section class="yr"${i === 0 ? note("타임라인 보기: 연도별 목록 + 12칸 띠(분류 색). 여러 해를 위아래로 한눈에, 같은 해 띠끼리 겹침을 읽는다(S-07). 누르면 오른쪽에 세부") : ""}><div class="yr__head"><b>${y}<small>활동 ${starts.length + cont.length}</small></b><span class="yr__months">${Array.from({ length: 12 }, (_, k) => `<span>${k + 1}</span>`).join("")}</span></div>${starts.map((a) => row(a, y)).join("")}${cont.map((a) => row(a, y, true)).join("")}</section>`;
  }).join("");
  const undated = ACTS.filter((a) => !span(a));
  return `<div class="tl-wrap">${html}${undated.length ? `<section class="yr"><div class="yr__head"><b>기간 모름<small>활동 ${undated.length}</small></b></div>${undated.map((a) => row(a, 0)).join("")}</section>` : ""}</div>`;
}
function card(x) {
  const c = CATS[x.act.cat];
  return `<article class="card card--${c.card}" data-cat="${x.act.cat}" data-review="${x.st === "review"}" data-saved="${!!x.saved}" data-a="${x.act.id}" style="${style(x.act.cat)}">
    <div class="card__meta"><img src="${c.icon}" width="14" height="14" alt="" /><span class="card__collection">${c.name}</span><span class="icon-btn" aria-label="저장">${x.saved ? `<img src="assets/home/bookmark-${c.card}.svg" width="16" height="16" alt="저장함" />` : ""}</span></div>
    <div class="card__body"><h3>${x.t}</h3><p class="card__act">${x.act.name}</p></div>
    <div class="card__tags">${tags(x)}</div>
    <div class="card__foot">${status(x)}<span class="file">${ICON.file}${x.src || "직접 입력"}</span></div></article>`;
}
const listView = () => `<div class="cards"${note("목록 보기: 디자인 시안의 경험 카드 그대로 — 홈에 있던 「최근 쌓인 경험」이 여기로 왔다. 카드를 누르면 그 활동의 세부")}>${ALL_X.map(card).join("")}</div>`;
const srcView = () => `<div class="srcs"${note("자료별 보기: 넣은 자료마다 AI 가 무엇을 찾았나. 사이드바의 「넣은 자료」 메뉴를 여기로 — 자주 쓰는 화면이 아니라서", true)}>${SOURCES.map((s) => {
  const acts = ACTS.filter((a) => a.sources.includes(s)); const n = ALL_X.filter((x) => x.src === s).length;
  return `<div class="src"><span class="file">${ICON.file}${s}</span><span class="src__when">넣은 자료</span><div class="src__acts">활동 ${acts.length} · 경험 ${n} 찾음 ${acts.map((a) => `<button type="button" data-a="${a.id}" style="${style(a.cat)}">${a.name}</button>`).join("")}</div></div>`;
}).join("")}</div>`;
function experience() {
  const view = params.get("view") || "timeline";
  return shell("내 경험", `
  <div class="split">
    <div class="workspace__scroll"><div class="ex">
      <div class="ex__head"><div><h1>내 경험</h1><p>활동 ${ACTS.length} · 경험 ${ALL_X.length} · 자료 ${SOURCES.length} — 누르면 그 안에서 한 일과 근거가 옆에 열려요.</p></div>
        <div class="vt" role="tablist"${note("보기 전환 — 타임라인 · 목록 · 자료별. 같은 경험 데이터를 보는 방법만 바꾼다(노션 데이터베이스의 보기처럼)")}>
          ${[["timeline", "타임라인"], ["list", "목록"], ["source", "자료별"]].map(([v, l]) => `<button type="button" data-view="${v}" class="${view === v ? "is-active" : ""}">${l}</button>`).join("")}
        </div></div>
      <div class="fbar" style="display:flex;align-items:center;gap:8px;margin:18px 0 4px;flex-wrap:wrap"${note("거르기: 분류 · 저장한 것 · 확인 필요. 사이드바에 있던 활동 분류 · 자주 쓰인 역량 · 「저장한 경험」 메뉴가 여기 칩으로. 자세한 필터(역량 · 기간)는 「필터」를 눌러야 펼친다")}>
        <button type="button" class="chip is-active" data-f="all">전체</button>
        ${Object.entries(CATS).map(([id, c]) => `<button type="button" class="chip" data-f="${id}">${c.name}</button>`).join("")}
        <span class="filters__sep"></span>
        <button type="button" class="chip" data-f="saved">${ICON.bookmark}저장한 것</button>
        <button type="button" class="chip" data-f="review">확인 필요 ${reviews.length}</button>
        <button type="button" class="filters__more" style="flex:1"><img src="assets/home/sliders-horizontal.svg" width="14" height="14" alt="" />필터</button>
      </div>
      <div data-panel="timeline" ${view === "timeline" ? "" : "hidden"}>${timelineView()}</div>
      <div data-panel="list" ${view === "list" ? "" : "hidden"}>${listView()}</div>
      <div data-panel="source" ${view === "source" ? "" : "hidden"}>${srcView()}</div>
    </div></div>
    <aside class="panel" aria-label="활동 세부"><div class="panel__inner" id="detail"></div></aside>
  </div>`, { split: true });
}
function xItem(x, i) {
  const first = i === 0;
  const cite = x.st === "mine" ? "" : `<div class="quote" hidden><span class="file">${ICON.file}${x.src}${x.line ? `<small class="muted">· ${x.line}번째 줄</small>` : ""}</span><blockquote>${x.q}</blockquote>${x.miss ? `<span class="warn">원본에서 이 문장을 그대로 찾지 못했어요. 맞는지 확인해 주세요.</span>` : ""}</div>`;
  return `<div class="x">
    <div class="x__top"><p class="x__text">${x.t}</p><button type="button" class="icon-btn" aria-label="경험 메뉴 — 고치기 · 옮기기 · 지우기"><img src="assets/home/ellipsis.svg" width="16" height="16" alt="" /></button></div>
    <div class="x__meta"${first ? note("경험 메타는 조용하게: 원문 확인은 작은 체크, 「나」는 숨기고 팀 · 모름만, 역량은 해시태그(점선 = AI 가 붙임, 실선 = 내가 고름), 색 있는 건 「확인 필요」 하나. 지우지 않고 낮췄다") : ""}>${status(x)}${WHO[x.who] ? `<span>${WHO[x.who]}</span>` : ""}${tags(x)}${x.st === "mine" ? `<span class="x__cite muted" style="font-weight:400">근거 없음</span>` : `<button type="button" class="x__cite" aria-expanded="false" data-cite>❝ 근거 1 ${ICON.down}</button>`}</div>
    ${cite}
    ${x.fill ? `<div class="fill-in"${note("지원서에서 AI 가 물은 것에 답하면, 그 답이 이 경험에 「내가 입력」 보완으로 쌓인다(S-23) — 다음 지원서에서 다시 쓰인다(S-25)")}><span class="mine">${ICON.pen}내가 입력 · ${x.fill.from}</span><b>${x.fill.q}</b>${x.fill.a}</div>` : ""}
  </div>`;
}
function openDetail(id) {
  const a = ACTS.find((v) => v.id === Number(id));
  if (!a || !$("#detail")) return;
  document.querySelectorAll(".row").forEach((r) => r.classList.toggle("is-selected", r.dataset.a === String(a.id)));
  const c = CATS[a.cat];
  $("#detail").innerHTML = `
    <div class="dt__head" style="${style(a.cat)}">
      <div class="dt__top"><h2>${a.name}</h2><button type="button" class="circle" aria-label="활동 메뉴 — 고치기 · 합치기"><img src="assets/home/ellipsis-dark.svg" width="17" height="17" alt="" /></button><button type="button" class="circle" data-close aria-label="닫기">${ICON.x}</button></div>
      <span class="dt__cat"><img src="${c.icon}" width="12" height="12" alt="" />${c.name}</span>
      <span class="dt__period">${period(a)}</span>
      <div class="dt__sources">이 활동을 만든 자료 ${a.sources.map((s) => `<span class="file">${ICON.file}${s}</span>`).join("")}</div>
    </div>
    <div class="dt__body" style="${style(a.cat)}">
      <p class="dt__count">이 활동에서 한 일 ${a.xs.length}</p>
      ${a.xs.length ? a.xs.map((x, i) => xItem(x, i)).join("") : `<p class="dt__hint" style="font-size:13px">아직 이 활동에 적힌 경험이 없어요. 자료에 활동 이름 · 기간만 있었을 수 있어요 — 기억나는 일을 한 줄씩 적어 두면 여기에 쌓여요.</p>`}
      <button type="button" class="add-x"><img src="assets/home/plus-small.svg" width="14" height="14" alt="" />경험 직접 추가</button>
      <p class="dt__hint">AI 가 자료에서 찾아 채운 기록이에요. 「확인 필요」는 원문과 맞는지 한번 봐 주세요. 자료에서 찾지 못했다고 경험이 없는 건 아니에요.</p>
    </div>`;
  $(".panel").classList.add("is-open");
  params.set("a", a.id);
  history.replaceState(null, "", `?${params}`);
  renumber();
}
function applyFilter(f) {
  document.querySelectorAll(".fbar .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.f === f));
  if ((f === "saved" || f === "review") && !$('[data-panel="list"]').offsetParent) switchView("list");
  document.querySelectorAll(".row").forEach((r) => (r.hidden = !(f === "all" || f === "saved" || f === "review" || r.dataset.cat === f)));
  document.querySelectorAll(".card").forEach((c) => (c.hidden = !(f === "all" || c.dataset.cat === f || (f === "saved" && c.dataset.saved === "true") || (f === "review" && c.dataset.review === "true"))));
}
function switchView(v) {
  document.querySelectorAll(".vt button").forEach((b) => b.classList.toggle("is-active", b.dataset.view === v));
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== v));
  params.set("view", v); history.replaceState(null, "", `?${params}`);
  renumber();
}

/* ---------- 지원서 — 지원처 하나, 문항 여러 개 ---------- */
const pick = (actId, i) => ALL_X.find((x) => x.act.id === actId && x.t === ACTS.find((a) => a.id === actId).xs[i].t);
// 초안 문장 — src: 원문(근거) · me(내가 입력한 보완) · none(받치는 근거 없음 — 근거 점검에서 걸린다)
const QS = [
  { t: "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.", lim: 700,
    reqs: [["기술 문제를 스스로 알아챔", "yes"], ["해결 방법과 고른 이유", "yes"], ["고친 뒤 어떻게 확인했나", "part"], ["결과를 수치로", "none"]],
    recs: [
      { x: pick(5, 0), why: "「기술 문제를 알아채고 → 고친」 흐름이 원문에 그대로 있어요", stress: "폴링의 한계를 어떻게 알아챘는지, 왜 WebSocket 을 골랐는지", gap: null, fill: true, on: true },
      { x: pick(1, 1), why: "피드백을 받아 성능 문제를 고친 사례예요", stress: "지적을 받은 상황 → 원인 → 압축을 고른 이유", gap: "자료에는 「팀」이 한 일로 적혀 있어요. 직접 넣었는지 오른쪽에서 물어볼게요.", on: true },
      { x: pick(2, 0), why: "느린 화면을 기술로 고친 경험이에요", stress: "몇 건부터 느려졌는지, 가상 스크롤을 고른 이유", gap: "얼마나 빨라졌는지 수치가 자료에 없어요 — 지어내지 않았어요." },
    ],
    draft: [
      ["캠퍼스 중고거래 앱 「바꿔요」에서 채팅 메시지가 몇 초씩 늦게 보이는 문제가 있었습니다.", "src", "바꿔요-회고.md 18번째 줄"],
      ["저는 폴링 방식을 WebSocket 으로 바꿔 이 문제를 해결했습니다.", "src", "바꿔요-회고.md 18번째 줄"],
      ["바꾼 뒤에는 두 기기로 동시에 메시지를 보내 지연이 1초 안인 것을 확인했습니다.", "me", "내가 입력 · 이 지원서에서 답함"],
      ["덕분에 사용자 만족도가 크게 올랐습니다.", "none", "자료 · 보완 어디에도 없는 결과예요. 지우거나, 사실이면 근거를 더해 주세요."],
      ["이후 졸업 프로젝트에서도 업로드가 느리다는 지적을 받고 이미지를 압축해 올리도록 바꿨습니다.", "src", "모아봄-README.md 31번째 줄"],
    ] },
  { t: "지원 동기와 수료 후 목표를 적어 주세요.", lim: 500,
    reqs: [["백엔드에 관심을 갖게 된 계기", "none"], ["관련해 해 본 것", "yes"], ["수료 후 목표", "none"]],
    recs: [
      { x: pick(5, 3), why: "직접 배포까지 해 본 경험이 관심의 근거가 돼요", stress: "배포하며 처음 마주친 서버 쪽 문제", gap: "왜 백엔드인지는 자료에 없어요 — 동기는 내 생각이라 물어볼게요.", on: true },
      { x: pick(8, 0), why: "꾸준히 해 온 학습이에요", stress: "몇 달째, 매주 얼마나", gap: null },
    ] },
  { t: "팀 프로젝트에서 갈등을 해결한 경험을 적어 주세요.", lim: 600,
    reqs: [["갈등 상황", "yes"], ["내가 한 행동", "yes"], ["결과 · 배운 점", "part"]],
    recs: [
      { x: pick(5, 2), why: "의견이 갈린 상황과 내가 제안한 해결이 원문에 있어요", stress: "양쪽 의견 → 사용자에게 먼저 묻자고 한 이유", gap: "제안 뒤 어떻게 정해졌는지는 자료에 없어요.", on: true },
      { x: pick(9, 0), why: "회비를 둘러싼 불만을 투명하게 풀어 본 경험이에요", stress: "공개 전후로 달라진 점", gap: null },
    ] },
];
const actChip = (x) => `<span class="act-chip" style="${style(x.act.cat)}">${x.act.name.split(" — ")[0]}</span>`;
function recToggle(r, first) {
  const x = r.x;
  return `<details class="tg" style="${style(x.act.cat)}"${first ? note("참고용 경험은 아래로, 접어서 — 펼치기 전엔 활동 칩(색) · 경험 제목(굵게) · 이유(회색 한 줄)만. 활동 이름과 설명을 글자 굵기 · 색으로 나눴다") : ""}>
    <summary><span class="tg__arrow">${ICON.right}</span><input type="checkbox" class="tg__pick" ${r.on ? "checked" : ""} aria-label="이 경험으로 쓰기" onclick="event.stopPropagation()" />
      <span class="tg__title">${actChip(x)}<b>${x.t}</b><small>${r.why}</small></span>${r.gap ? `<span class="review">${ICON.warn}빠진 것</span>` : ""}</summary>
    <div class="tg__body">
      <div class="box"><b>강조하면 좋은 점</b>${r.stress}</div>
      <div class="box"><b><span class="ok">${ICON.check}</span>근거</b><span>「${x.q}」</span><span class="file">${ICON.file}${x.src} · ${x.line}번째 줄</span>${r.fill ? `<span class="mine">${ICON.pen}보완 — ${x.fill.a}</span>` : ""}</div>
      ${r.gap ? `<div class="box box--wide box--gap"><b>빠진 것</b>${r.gap}</div>` : ""}
    </div></details>`;
}
function qBody(q, qi) {
  const text = q.draft ? q.draft.map(([s, k, why]) => `<span class="sent sent--${k}" title="${why}">${s}</span>`).join(" ") : "";
  return `
  <div class="q-text"><h2>${q.t}</h2><span class="muted">${q.lim}자</span></div>
  <section class="editor"${qi === 0 ? note("답변을 맨 위에 — 지원서 화면의 주인공은 내가 쓰는 답. 초안(S-27, P1)이 여기 채워지고, 「근거 점검」을 누르면 문장마다 원문 · 보완 · 근거 없음이 칠해진다. 근거 없는 문장(4번째)은 노랗게 걸린다 — 과장을 막는 이 서비스만의 점검") : ""}>
    <div class="editor__text" contenteditable="true">${text || `<span class="muted">여기에 답을 쓰거나, 오른쪽 AI 동료에게 「초안 만들기」를 부탁해 보세요.</span>`}</div>
    <div class="editor__bar"><span class="muted">${q.draft ? q.draft.map((d) => d[0]).join(" ").length : 0}자 / ${q.lim}자</span><span class="legend"><i class="l-src"></i>원문 <i class="l-me"></i>내가 입력 <i class="l-none"></i>근거 없음</span><button type="button" class="btn btn--line" data-check>근거 점검</button><button type="button" class="btn btn--line">복사</button></div>
  </section>
  <section class="refs"><h3>참고 — 꺼내 쓸 경험 <span class="muted">체크한 경험으로 초안을 만들어요</span></h3>${q.recs.map((r, i) => recToggle(r, qi === 0 && i === 0)).join("")}</section>`;
}
function mateFeed(q, qi) {
  const lab = { yes: "근거 있음", part: "일부", none: "자료에 없음" };
  const intro = `<div class="msg"><p>문항을 읽어 봤어요. 이 문항이 보려는 건 ${q.reqs.length}가지예요.</p><ul class="reqlist">${q.reqs.map(([t, s]) => `<li class="r-${s}"><i></i>${t}<em>${lab[s]}</em></li>`).join("")}</ul><p class="muted">자료에 없다고 경험이 없는 건 아니에요. 몇 가지만 물어볼게요.</p></div>`;
  if (qi !== 0) return intro + `<div class="msg"><p>${q.recs[0].x.act.name.split(" — ")[0]} 경험이 가장 잘 맞아요. 아래 「참고」에 골라 뒀어요.</p></div><div class="msg msg--ask"><p class="ask__q">${q.recs[0].gap || "더 묻고 싶은 건 없어요."}</p><form><input placeholder="짧게 답해 주세요" /><button type="submit" class="btn btn--dark">답하기</button><button type="button" class="btn btn--ghost">건너뛰기</button></form></div>`;
  return intro + `
    <div class="msg"><p>「바꿔요」 채팅 경험이 가장 잘 맞아요. 근데 <b>고친 뒤 어떻게 확인했는지</b>가 자료에 없어요.</p></div>
    <div class="msg msg--ask"><span class="ask__for">${actChip(pick(5, 0))} 채팅 WebSocket</span><p class="ask__q">고친 뒤 메시지가 제때 오는지 어떻게 확인했나요?</p></div>
    <div class="msg msg--me">${pick(5, 0).fill.a}</div>
    <div class="msg"><p>「바꿔요」 경험에 보완으로 쌓았어요. 다른 지원서에서도 이 답을 근거로 같이 써요.</p></div>
    <div class="msg msg--ask"><span class="ask__for">${actChip(pick(1, 1))} 이미지 압축</span><p class="ask__q">이미지 압축은 직접 넣었나요, 팀원이 넣었나요?</p><form><input placeholder="짧게 답해 주세요" /><button type="submit" class="btn btn--dark">답하기</button><button type="button" class="btn btn--ghost">건너뛰기</button></form></div>
    <div class="msg"><p>체크한 경험 2개로 초안을 만들어 왼쪽에 넣었어요. 4번째 문장은 자료에 없는 결과라 근거 점검에서 걸려요.</p></div>`;
}
function apply() {
  const app = APPS.find((a) => a.id === Number(params.get("app") || 1));
  const qi = Number(params.get("q") || 0);
  return shell(`지원서 / ${app.name}`, `
  <div class="split">
    <div class="workspace__scroll">
      <header class="ap-head"${note("지원서 = 지원처 하나 + 문항 여러 개(SPEC S-18). 문항 탭은 번호만 — 문항 글은 아래에 크게 한 번만. 「문항 이 보려는 것」은 위에서 빼고 오른쪽 AI 동료의 첫 말로 옮겼다")}>
        <div class="ap-head__top"><h1>${app.name}${app.role ? ` <span class="muted">· ${app.role}</span>` : ""}</h1><span class="pill">${app.kind}</span><button type="button" class="circle" data-mate aria-label="AI 동료 패널 열고 닫기">${ICON.panel}</button></div>
        <nav class="qtabs">${QS.map((q, i) => `<button type="button" class="${i === qi ? "is-active" : ""}" data-q="${i}">문항 ${i + 1}</button>`).join("")}<button type="button" class="qtabs__add" aria-label="문항 더하기">${ICON.plus.replace("<svg", '<svg width="15" height="15"')}</button></nav>
      </header>
      <div class="ap-main" id="qbody">${qBody(QS[qi], qi)}</div>
    </div>
    <aside class="panel is-open" aria-label="AI 동료"${note("오른쪽 「AI 동료」 — 대화처럼 흐른다: 문항을 읽고 → 맞는 경험을 고르고 → 빠진 것만 묻고 → 답을 경험에 쌓고 → 초안을 넣는다. 아래 입력칸으로 부탁도 할 수 있다. 버튼은 이 서비스만의 일(근거 점검 · 빠진 것 묻기 · 다른 경험으로)부터. 옆 채팅을 둘지는 SPEC 범위 제외(「채팅창이 메인인 AI」)와 겹쳐 정해야 한다", true)}>
      <div class="panel__inner mate">
        <div class="mate__head"><b>AI 동료</b><span class="muted">문항 ${qi + 1}</span></div>
        <div class="mate__body" id="feed">${mateFeed(QS[qi], qi)}</div>
        <div class="mate__foot">
          <div class="mate__acts"><button type="button" class="sg" data-check>근거 점검</button><button type="button" class="sg">초안 만들기 <span class="p1">P1</span></button><button type="button" class="sg">다른 경험으로</button><button type="button" class="sg">더 짧게</button></div>
          <form class="mate__input"><input placeholder="동료에게 부탁하기 — 예: 협업 얘기는 빼 줘" /><button type="submit" class="ask-box__send" style="width:34px;height:34px" aria-label="보내기">${ICON.up}</button></form>
        </div>
      </div>
    </aside>
  </div>`, { split: true });
}

/* ---------- 메뉴 · 대화창 · 알림 ---------- */
function overlays() {
  return `
  <div class="menu" id="menu-plus" role="menu">
    <span class="menu__label">쌓기</span>
    <button type="button" class="menu__item" data-open="source">${ICON.clip}<span><b>자료 가져오기</b><small>README · 회고 · 노트 · .md 파일 — AI 가 활동과 경험을 찾아요</small></span></button>
    <button type="button" class="menu__item" data-open="source" data-tab-open="line">${ICON.pen}<span><b>직접 기록하기</b><small>한 줄이면 돼요 — 맞는 활동에 붙여 둘게요</small></span></button>
    <hr />
    <span class="menu__label">꺼내기</span>
    <button type="button" class="menu__item" data-open="app">${ICON.doc}<span><b>새 지원서</b><small>지원처와 문항을 넣으면 맞는 경험을 근거와 함께 찾아요</small></span></button>
  </div>
  <div class="menu" id="menu-model" role="menu">
    <span class="menu__label">분석 · 추천에 쓰는 AI</span>
    <button type="button" class="menu__item"><i class="mdot" style="background:var(--black)"></i><span><b>기본 모델</b><small>팀이 제공하는 모델 — 따로 설정할 것 없어요</small></span></button>
    <button type="button" class="menu__item" disabled style="opacity:.55"><i class="mdot" style="background:var(--line)"></i><span><b>내 API 키로 <span class="p1">P1</span></b><small>Gemini · OpenAI 키를 넣어 내 모델로 분석해요</small></span></button>
  </div>
  <div class="pop" id="menu-bell" role="dialog" aria-label="알림">
    <h3>알림</h3>
    ${reviews.map((x) => `<a href="experience.html?a=${x.act.id}">확인해 주세요 — ${x.t}<small>${x.act.name} · AI 가 원문에서 그대로 찾지 못했어요</small></a>`).join("")}
    <a href="apply.html?app=2">추천이 끝났어요 — IT 연합 동아리 운영진<small>문항 2개 · 오늘</small></a>
    <a href="experience.html?a=1">분석이 끝났어요 — 모아봄-README.md<small>활동 1 · 경험 3 · 어제</small></a>
  </div>
  <div class="dlg" id="dlg-source" role="dialog" aria-modal="true" aria-label="쌓기">
    <div class="dlg__box">
      <div class="dlg__top"><h2>쌓기</h2><button type="button" class="circle" data-close-dlg aria-label="닫기">${ICON.x}</button></div>
      <div data-step="form" style="display:flex;flex-direction:column;gap:14px">
        <div class="seg"><button type="button" class="is-active" data-stab="paste">붙여넣기</button><button type="button" data-stab="file">파일 올리기</button><button type="button" data-stab="line">한 줄 쓰기</button></div>
        <textarea data-spane="paste" placeholder="노션 · 회고 · README 내용을 붙여 넣어 주세요"></textarea>
        <div class="drop" data-spane="file" hidden><img src="assets/timeline/paperclip.svg" width="22" height="22" alt="" /><b style="color:#000">파일을 끌어다 놓거나 눌러서 고르세요</b>.md · .txt 하나 · 50,000자까지</div>
        <div data-spane="line" hidden style="display:flex;flex-direction:column;gap:10px"><textarea style="min-height:84px" placeholder="예: 스터디에서 처음으로 세그먼트 트리 풀이를 발표했다"></textarea><label>어느 활동에 붙일까요?<select style="height:40px;padding:0 12px;border:1px solid var(--line);border-radius:12px;font:inherit"><option>AI 가 맞는 활동을 골라 줘요</option>${ACTS.map((a) => `<option>${a.name}</option>`).join("")}</select></label></div>
        <p class="notice">🔒<span>넣은 자료는 분석을 위해 외부 AI 제공사(OpenAI)로 보내져요. OpenAI API 는 보낸 내용을 학습에 쓰지 않아요. 회사 · 고객의 비공개 자료는 빼고 넣어 주세요.</span></p>
        <div class="dlg__foot"><button type="button" class="btn btn--line" data-close-dlg>취소</button><button type="button" class="btn btn--dark" data-run>넣기</button></div>
      </div>
      <div data-step="run" hidden>
        <p class="dlg__desc" style="margin-bottom:14px">자료에서 활동과 경험을 찾고 있어요. 창을 닫아도 이어져요.</p>
        <ol class="steps"><li class="is-done"><i></i>자료 저장</li><li class="is-now"><i></i>활동 · 경험 찾기</li><li><i></i>근거를 원문과 대조</li></ol>
      </div>
    </div>
  </div>
  <div class="dlg" id="dlg-app" role="dialog" aria-modal="true" aria-label="새 지원서">
    <div class="dlg__box">
      <div class="dlg__top"><h2>새 지원서</h2><button type="button" class="circle" data-close-dlg aria-label="닫기">${ICON.x}</button></div>
      <p class="dlg__desc">지원처와 문항을 넣으면, 문항마다 쌓인 경험에서 맞는 걸 근거와 함께 찾아요.</p>
      <label>지원처 이름 (선택)<input type="text" placeholder="예: OO 부트캠프" /></label>
      <div class="row2"><label>종류 (선택)<input type="text" placeholder="부트캠프 · 동아리 · 인턴 …" /></label><label>직무 (선택)<input type="text" placeholder="백엔드 · 기획 …" /></label></div>
      <div class="qs"><span style="font-size:12px;color:var(--gray-text)">문항 — 한 번에 여러 개 넣을 수 있어요</span><textarea data-q1 placeholder="문항 1 — 예: 기술적인 문제를 해결한 경험을 적어 주세요 (700자)"></textarea><textarea placeholder="문항 2"></textarea></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn--line">+ 문항 더하기</button><button type="button" class="btn btn--line" disabled>자주 나오는 문항에서 고르기 · P1</button><button type="button" class="btn btn--line" disabled>공고 링크로 가져오기 · P1</button></div>
      <div class="dlg__foot"><button type="button" class="btn btn--line" data-close-dlg>취소</button><a class="btn btn--dark" href="apply.html?app=1">맞는 경험 찾기</a></div>
    </div>
  </div>
  <div class="toast" role="status"></div>
  <div class="tip" aria-hidden="true"></div>
  <button type="button" class="notes-btn" data-notes>이번 피드백 보기</button>
  <div class="notes" aria-label="이번 피드백"><h3>시안 3 → 시안 4 피드백</h3><p class="lead">주황 = 바꾼 자리와 이유, 보라 = PM 이 정할 것. 누르면 그 자리로 가요. 지금 화면에 보이는 것만 번호가 붙어요.</p><ol id="notes-list"></ol></div>`;
}

function renumber() {
  const els = [...document.querySelectorAll("[data-note]")].filter((el) => el.closest(".app") && (el.offsetParent || el.getClientRects().length));
  document.querySelectorAll("[data-note]").forEach((el) => el.removeAttribute("data-n"));
  els.forEach((el, i) => (el.dataset.n = i + 1));
  $("#notes-list").innerHTML = els.map((el, i) => `<li class="${el.hasAttribute("data-q") ? "is-q" : ""}" data-go-note="${i + 1}"><b>${i + 1}</b><span>${el.dataset.note}</span></li>`).join("");
}
function toast(html) { const t = $(".toast"); t.innerHTML = html; t.classList.add("is-on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("is-on"), 5200); }
function openMenu(id, anchor) {
  const m = $(`#menu-${id}`), wasOpen = m.classList.contains("is-open");
  document.querySelectorAll(".menu,.pop").forEach((x) => x.classList.remove("is-open"));
  if (wasOpen) return;
  const r = anchor.getBoundingClientRect();
  m.classList.add("is-open");
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = `${Math.min(r.left, innerWidth - w - 12)}px`;
  m.style.top = `${r.bottom + 8 + h > innerHeight ? r.top - h - 8 : r.bottom + 8}px`;
}
function setSourceTab(tab) {
  document.querySelectorAll("[data-stab]").forEach((b) => b.classList.toggle("is-active", b.dataset.stab === tab));
  document.querySelectorAll("[data-spane]").forEach((p) => (p.hidden = p.dataset.spane !== tab));
  $(".dlg__foot [data-run]").textContent = tab === "line" ? "남기기" : "넣기";
}

/* ---------- 그리기 · 이벤트 ---------- */
document.querySelector(".app").innerHTML = (page === "home" ? home() : page === "exp" ? experience() : apply()) + overlays();

document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu,.pop,[data-menu]")) document.querySelectorAll(".menu,.pop").forEach((x) => x.classList.remove("is-open"));
  const t = e.target.closest("[data-pick-mode],[data-check],[data-menu],[data-open],[data-close-dlg],[data-run],[data-notes],[data-go-note],[data-a],[data-close],[data-cite],[data-stab],[data-view],[data-f],[data-q],[data-tab],[data-mate],.sg");
  if (!t) return;
  if (t.dataset.pickMode) {
    const k = t.dataset.pickMode, m = MODES[k], box = $(".ask-box");
    box.dataset.mode = k; box.querySelector("textarea").placeholder = m.ph; $(".ask-box__hint").textContent = m.hint;
    document.querySelectorAll(".modes [data-pick-mode]").forEach((b) => b.classList.toggle("is-active", b === t));
    $(".hero .suggest").innerHTML = chipsHtml(m); $(".answer").hidden = true;
    document.querySelectorAll(".menu").forEach((x) => x.classList.remove("is-open")); return;
  }
  if (t.hasAttribute("data-check")) { const ed = $(".editor"); if (ed) { ed.classList.toggle("is-checking"); renumber(); } return; }
  if (t.dataset.menu) { e.preventDefault(); openMenu(t.dataset.menu, t); return; }
  if (t.dataset.open) {
    e.preventDefault(); document.querySelectorAll(".menu,.pop").forEach((x) => x.classList.remove("is-open"));
    $(`#dlg-${t.dataset.open}`).classList.add("is-open");
    if (t.dataset.open === "source") setSourceTab(t.dataset.tabOpen || "paste");
    return;
  }
  if (t.hasAttribute("data-close-dlg")) { t.closest(".dlg").classList.remove("is-open"); return; }
  if (t.dataset.stab) { setSourceTab(t.dataset.stab); return; }
  if (t.hasAttribute("data-run")) {
    const box = t.closest(".dlg__box"), form = box.querySelector('[data-step="form"]'), run = box.querySelector('[data-step="run"]');
    if (t.textContent === "남기기") { t.closest(".dlg").classList.remove("is-open"); toast(`한 줄을 남겼어요. AI 가 「알고리즘 스터디」에 붙였어요 — 아니면 옮겨 주세요. <span style="opacity:.6">(시안)</span>`); return; }
    form.style.display = "none"; run.hidden = false;
    const steps = box.querySelectorAll(".steps li");
    setTimeout(() => { steps[1].className = "is-done"; steps[2].className = "is-now"; }, 1300);
    setTimeout(() => {
      t.closest(".dlg").classList.remove("is-open"); form.style.display = "flex"; run.hidden = true; steps[1].className = "is-now"; steps[2].className = "";
      toast(`자료에서 활동 1개 · 경험 3개를 찾았어요. 「확인 필요」가 붙은 것부터 봐 주세요. <a href="experience.html?a=1">보기</a> <span style="opacity:.6">(시안 — 실제 분석 아님)</span>`);
    }, 2600);
    return;
  }
  if (t.hasAttribute("data-notes")) { document.body.classList.toggle("show-notes"); t.textContent = document.body.classList.contains("show-notes") ? "피드백 표시 끄기" : "이번 피드백 보기"; renumber(); return; }
  if (t.dataset.goNote) { document.querySelector(`[data-n="${t.dataset.goNote}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  if (t.hasAttribute("data-cite")) { const q = t.closest(".x").querySelector(".quote"); if (q) { q.hidden = !q.hidden; t.setAttribute("aria-expanded", String(!q.hidden)); } return; }
  if (t.hasAttribute("data-close")) { $(".panel").classList.remove("is-open"); document.querySelectorAll(".row").forEach((r) => r.classList.remove("is-selected")); params.delete("a"); history.replaceState(null, "", `?${params}`); return; }
  if (t.dataset.a) { openDetail(t.dataset.a); return; }
  if (t.classList.contains("sg") && t.closest(".hero")) { $(".ask-box textarea").value = t.textContent.trim(); $(".ask-box textarea").focus(); return; }
  if (t.dataset.view) { switchView(t.dataset.view); return; }
  if (t.dataset.f) { applyFilter(t.dataset.f); return; }
  if (t.dataset.q) {
    const qi = Number(t.dataset.q);
    document.querySelectorAll(".qtabs [data-q]").forEach((b) => b.classList.toggle("is-active", b === t));
    $("#qbody").innerHTML = qBody(QS[qi], qi); $("#feed").innerHTML = mateFeed(QS[qi], qi); $(".mate__head .muted").textContent = `문항 ${qi + 1}`; params.set("q", qi); history.replaceState(null, "", `?${params}`); renumber(); return;
  }
  if (t.dataset.tab) { t.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === t)); document.querySelectorAll("[data-tabpane]").forEach((p) => (p.hidden = p.dataset.tabpane !== t.dataset.tab)); return; }
  if (t.hasAttribute("data-mate")) { $(".panel").classList.toggle("is-open"); return; }
});

// 홈 입력: 꺼내기면 새 지원서로, 쌓기면 분석
document.querySelector("[data-ask]")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $(".ask-box textarea").value.trim();
  if ($(".ask-box").dataset.mode === "ask") { const a = $(".answer"); a.innerHTML = askAnswer(text); a.hidden = false; renumber(); return; }
  if ($(".ask-box").dataset.mode === "in") { $("#dlg-source").classList.add("is-open"); setSourceTab("paste"); $('[data-spane="paste"]').value = text; return; }
  $("#dlg-app").classList.add("is-open"); $("[data-q1]").value = text;
});

// 접힌 레일: 아이콘에 마우스를 올리면 이름이 말풍선으로
document.addEventListener("mouseover", (e) => {
  const el = e.target.closest(".drawer [data-tip]"), tip = $(".tip");
  if (!el || !document.documentElement.classList.contains("drawer-collapsed")) return tip.classList.remove("is-on");
  const r = el.getBoundingClientRect();
  tip.textContent = el.dataset.tip; tip.style.left = `${r.right + 10}px`; tip.style.top = `${r.top + r.height / 2}px`; tip.classList.add("is-on");
});

if (page === "exp") { if (params.get("f")) applyFilter(params.get("f")); if (params.get("a")) openDetail(params.get("a")); }
renumber();
