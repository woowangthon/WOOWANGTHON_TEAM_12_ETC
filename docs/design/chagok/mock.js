// 차곡 시안 2 — 화면 배치 확인용 정적 시안. 서버 · AI 호출 없음, 모든 데이터는 아래 예시(SAMPLE)다.
// 디자인 담당 시안(styles.css · main.js · assets)을 바탕으로 PM 피드백(ETC#19)을 얹었다.
// 주황 「이번 피드백 보기」를 누르면 바뀐 자리마다 번호와 이유가 뜬다.

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

/* ---------- 작은 도구 ---------- */
const $ = (s, el = document) => el.querySelector(s);
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>',
};
const WHO = { TEAM: "팀", UNKNOWN: "누가 했는지 모름" };
let noteNo = 0;
const NOTES = [];
/** 바뀐 자리 표시 — 「이번 피드백 보기」에서 번호와 이유가 뜬다. q 는 PM 이 정할 것 */
const note = (text, q = false) => { NOTES.push({ n: ++noteNo, text, q }); return ` data-note data-n="${noteNo}"`; };
const style = (cat) => `--accent:${CATS[cat].accent};--accent-bg:${CATS[cat].bg}`;

function status(x) {
  if (x.st === "ok") return `<span class="ok" title="원문에서 확인한 경험이에요">${ICON.check}<span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">원문 확인</span></span>`;
  if (x.st === "mine") return `<span class="mine">${ICON.pen}내가 입력</span>`;
  return `<span class="review">${ICON.warn}확인 필요</span>`;
}
const tags = (x) => x.tags.map((t) => `<span class="tag ${x.st === "mine" ? "" : "tag--ai"}" ${x.st === "mine" ? "" : 'title="AI 가 붙인 역량이에요 — 해석이라 고칠 수 있어요"'}>#${t}</span>`).join("");
const month = (s, end) => {
  if (!s) return null;
  const [y, m] = s.split("-").map(Number);
  return y * 12 + (m ? m - 1 : end ? 11 : 0);
};
const NOW = (() => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); })();
const span = (a) => {
  const s = month(a.start, false);
  if (s == null) return null;
  return { s, e: a.ongoing ? NOW : month(a.end ?? a.start, true) };
};
const fmt = (s) => (s ? s.replace("-", ".") : "");
const period = (a) => !a.start ? "기간 모름" : a.ongoing ? `${fmt(a.start)} – <span class="live">진행 중</span>` : a.start === a.end ? fmt(a.start) : `${fmt(a.start)} – ${fmt(a.end)}`;

/* ---------- 틀: 사이드바 · 도구 모음 ---------- */
function shell(page, crumb, body) {
  const nav = (id, href, icon, label, count, extra = "") =>
    `<a class="nav__item ${page === id ? "is-active" : ""}" href="${href}" title="${label}"${extra}><img src="${icon}" width="20" height="20" alt="" /><span class="nav__label">${label}</span>${count != null ? `<span class="nav__count">${count}</span>` : ""}</a>`;
  return `
  <div class="bg-blur" aria-hidden="true"><img src="assets/home/bg-blur.svg" width="1500" height="1629.5" alt="" /></div>
  <aside class="drawer">
    <div class="brand">
      <a href="index.html" aria-label="차곡 홈"><img class="brand__wordmark" src="assets/home/logo.svg" width="93.1919" height="26.364" alt="차곡" /><img class="brand__symbol" src="assets/home/logo-symbol.svg" width="23.7059" height="26" alt="차곡" /></a>
      <button type="button" class="icon-btn drawer-toggle" aria-label="사이드바 접기" aria-expanded="true"><img src="assets/home/sidebar-toggle.svg" width="20" height="20" alt="" /></button>
    </div>
    <button type="button" class="btn-add" data-open="source"${page === "home" ? note("첫 버튼을 「경험 추가하기」에서 「자료 넣기」로. README · 회고를 넣으면 AI 가 활동 · 경험을 찾아 주는 게 이 서비스의 입구라서(SPEC R-01). 직접 쓰기는 바로 아래로 낮췄다") : ""}><img src="assets/home/plus.svg" width="18" height="18" alt="" /><span class="btn-add__label">자료 넣기</span></button>
    <button type="button" class="btn-add__sub" data-open="note">생각난 김에 한 줄</button>
    <nav class="nav" aria-label="주요 메뉴">
      ${nav("home", "index.html", "assets/home/home.svg", "홈")}
      ${nav("timeline", "timeline.html", "assets/home/timeline-line.svg", "타임라인", ACTS.length)}
      ${nav("apply", "apply.html", "assets/timeline/messages-square.svg", "지원 문항", 3, page === "home" ? note("메뉴에 「지원 문항」을 더했다 — 쌓은 경험을 꺼내 쓰는 곳(스프린트 2, 데모 3~6). 홈의 「어떤 경험을 꺼내볼까요?」도 여기로 이어진다") : "")}
      ${nav("saved", "#", "assets/home/bookmark-nav.svg", "저장한 경험", 5, page === "home" ? note("저장한 경험 · 경험 모음 · 태그는 시안 그대로 두되 백로그(ETC#58)다. 이번 제출엔 안 만들 수 있다", true) : "")}
      ${nav("sources", "#", "assets/timeline/paperclip.svg", "넣은 자료", SOURCES.length, page === "home" ? note("「최근 기록」 자리를 「넣은 자료」로 — 원본 파일 목록. 「이 경험이 어디서 나왔나」를 거꾸로 찾아가는 길(근거 보존 원칙)", true) : "")}
    </nav>
    <img class="drawer__divider" src="assets/home/drawer-divider.svg" width="20" height="1" alt="" />
    <section class="collections" aria-label="활동 분류">
      <div class="collections__head"${page === "home" ? note("「나의 경험 모음」을 활동 분류로. 「일상의 발견」은 「동아리 · 대외활동」으로 바꿨다 — 생각 · 계기는 따로 분류하지 않고 활동 안의 경험(한 줄)으로 들어간다. 분류 목록은 SPEC 미결정 5", true) : ""}><span>활동 분류</span><button type="button" class="icon-btn" aria-label="분류 추가"><img src="assets/home/plus-small.svg" width="14" height="14" alt="" /></button></div>
      ${Object.entries(CATS).map(([id, c]) => `<a class="collection" href="timeline.html?cat=${id}" title="${c.name}"><img src="${c.icon}" width="14" height="14" alt="" /><span class="collection__name">${c.name}</span><span class="collection__count">${ACTS.filter((a) => a.cat === id).length}</span></a>`).join("")}
    </section>
    <section class="fav-tags" aria-label="자주 쓰인 역량"${page === "home" ? note("「자주 찾는 태그」 = 역량. 역량은 정해진 13개 목록에서만 붙는다(SPEC 미결정 2) — 자유 태그를 따로 두면 정리 축이 늘어난다") : ""}>
      <span class="fav-tags__title">자주 쓰인 역량</span>
      <div class="fav-tags__list"><a href="#"># 기술 구현</a><a href="#"># 협업</a><a href="#"># 문제 해결</a></div>
    </section>
    <div class="drawer__spacer"></div>
    <div class="profile" title="예시 계정"${page === "home" ? note("프로필은 실제 사람 대신 예시 계정. 로그인은 R-02(공개 배포 전)") : ""}><div class="profile__avatar">차</div><div class="profile__info"><span class="profile__name">예시 사용자</span><span class="profile__desc">시안 · SAMPLE 데이터</span></div><button type="button" class="icon-btn" aria-label="설정"><img src="assets/home/settings-2.svg" width="17" height="17" alt="" /></button></div>
  </aside>
  <main class="workspace">
    <header class="toolbar">
      <div class="crumbs"><img src="assets/home/archive.svg" width="17" height="17" alt="" /><span>내 서랍</span><span class="crumbs__sep">/</span><strong>${crumb}</strong></div>
      <div class="toolbar__right">
        <label class="quick-search"${page === "home" ? note("상단 검색은 시안 그대로. 앱 안 검색은 백로그(ETC#32) — 결과 단위는 경험, 근거 발췌와 같이", true) : ""}><img src="assets/home/search-small.svg" width="15" height="15" alt="" /><input type="search" placeholder="내 경험에서 검색" /><kbd>Ctrl K</kbd></label>
        <button type="button" class="icon-btn" aria-label="알림"${page === "home" ? note("알림은 재촉하지 않는 것만 — 분석이 끝났을 때, 새 문항에 맞는 경험이 있을 때. 「오늘 기록하세요」는 없다(ETC#58)") : ""}><img src="assets/home/bell.svg" width="19" height="19" alt="" /></button>
        <span class="divider"></span>
        <span class="save-state"><img src="assets/home/cloud-check.svg" width="15" height="15" alt="" />모두 저장됨</span>
      </div>
    </header>
    ${body}
  </main>`;
}

/* ---------- 홈 ---------- */
function home() {
  const recent = ALL_X.filter((x) => x.added);
  const card = (x) => {
    const c = CATS[x.act.cat];
    return `<article class="card card--${c.card}" data-collection="${x.act.cat}" data-review="${x.st === "review"}" data-go="timeline.html?a=${x.act.id}" style="${style(x.act.cat)}">
      <div class="card__meta"><img src="${c.icon}" width="14" height="14" alt="" /><span class="card__collection">${c.name}</span><button type="button" class="icon-btn" aria-label="저장"><img src="assets/home/bookmark-${c.card}.svg" width="16" height="16" alt="" /></button></div>
      <div class="card__body"><h3>${x.t}</h3><p class="card__act">${x.act.name}</p></div>
      <div class="card__tags">${tags(x)}</div>
      <div class="card__foot"><span>${x.added} 쌓임</span>${status(x)}<span class="file">${ICON.file}${x.src}</span></div>
    </article>`;
  };
  const total = ALL_X.length;
  const byCat = Object.keys(CATS).map((id) => ({ id, n: ALL_X.filter((x) => x.act.cat === id).length }));
  const reviews = ALL_X.filter((x) => x.st === "review");
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const ux = ACTS.find((a) => a.id === 4);
  return shell("home", "홈", `
  <div class="workspace__scroll">
    <section class="welcome">
      <div class="welcome__text"${note("인사말은 그대로, 설명을 「AI 가 정리해 두고 필요할 때 꺼내 준다」로 — 이 서비스가 하는 일을 첫 줄에. 날짜는 고정값이던 걸 오늘 날짜로")}>
        <h1>경험이 차곡차곡 쌓이고 있어요.</h1>
        <p>흩어진 자료를 넣으면 AI 가 경험으로 정리해 두고, 필요한 순간에 근거와 함께 꺼내 드려요.</p>
      </div>
      <div class="today"><img src="assets/home/calendar-days.svg" width="16" height="16" alt="" /><time>${today}</time></div>
    </section>
    <div class="content">
      <div class="explore">
        <section class="recall"${note("「어떤 경험을 꺼내볼까요?」를 지원 문항 입구로(S-18). 문항이나 상황을 적으면 지원 문항 화면에서 맞는 경험 · 근거 · 부족한 점이 나온다. 보내기를 눌러 보세요")}>
          <div class="recall__intro"><div class="recall__desc"><h2>어떤 경험을 꺼내볼까요?</h2><p>지원 문항이나 떠오르는 상황을 적어 주세요. 쌓인 경험에서 맞는 걸 근거와 함께 찾아 드려요.</p></div><span class="ai-badge">차곡 AI</span></div>
          <form class="ai-search" action="apply.html"><img src="assets/home/search.svg" width="20" height="20" alt="" /><input type="text" placeholder="예: 기술적인 문제를 해결한 경험을 적어 주세요 (부트캠프 지원 문항)" /><button type="submit" class="ai-search__send" aria-label="꺼내기"><img src="assets/home/arrow-up.svg" width="20" height="20" alt="" /></button></form>
          <div class="suggest"><span>이렇게 물어보세요</span><button type="button" class="suggest__chip">기술적인 문제를 해결한 경험 <img src="assets/home/arrow-up-right-small.svg" width="12" height="12" alt="" /></button><button type="button" class="suggest__chip">팀에서 갈등을 풀어 본 경험 <img src="assets/home/arrow-up-right-small.svg" width="12" height="12" alt="" /></button><button type="button" class="suggest__chip">실패에서 배운 점 <img src="assets/home/arrow-up-right-small.svg" width="12" height="12" alt="" /></button></div>
        </section>
        <section class="records">
          <div class="records__head"><div class="records__title"><h2>최근 쌓인 경험</h2><span>${total}개의 경험</span></div><button type="button" class="sort">최근 쌓인 순 <img src="assets/home/chevron-down.svg" width="13" height="13" alt="" /></button></div>
          <div class="filters" role="group" aria-label="분류 필터">
            <button type="button" class="chip is-active" data-filter="all">전체</button>
            ${Object.entries(CATS).map(([id, c]) => `<button type="button" class="chip" data-filter="${id}">${c.name}</button>`).join("")}
            <button type="button" class="chip" data-review-filter${note("필터에 「확인 필요만」 — AI 가 원문에서 못 찾은 것만 모아 보기")}>확인 필요만</button>
            <button type="button" class="filters__more"><img src="assets/home/sliders-horizontal.svg" width="14" height="14" alt="" />필터</button>
          </div>
          <div class="cards"${note("카드 = 경험 하나. 제목은 AI 가 찾은 경험, 아래에 어느 활동인지 · 역량 해시태그 · 원본 파일 · 출처 상태. 해시태그가 본문을 덮던 것(높이 고정)을 고쳤다. 점선 태그 = AI 가 붙인 역량, 체크 = 원문에서 확인, 노란 꼬리표 = 확인 필요. 카드를 누르면 타임라인 세부로")}>${recent.map(card).join("")}</div>
        </section>
      </div>
      <aside class="insights">
        <section class="stack"${note("「이번 주 4개 · 지난주보다 +2 · 요일 체크」 → 줄어들지 않는 누적 숫자와 분류별 막대. 몇 달 만에 와도 빈칸 · 마이너스가 먼저 보이지 않게(기획 1.3)")}>
          <div class="stack__head"><h2>지금까지 차곡차곡</h2><img src="assets/home/sprout.svg" width="18" height="18" alt="" /></div>
          <div class="stack__nums"><div><strong>${total}</strong> <span>개의 경험</span></div><div><strong style="font-size:20px">${ACTS.length}</strong> <span>개의 활동</span></div><div><strong style="font-size:20px">${SOURCES.length}</strong> <span>개의 자료</span></div></div>
          <div class="stack__bar">${byCat.map((b) => `<i style="flex:${b.n};background:${CATS[b.id].accent}"></i>`).join("")}</div>
          <div class="stack__legend">${byCat.map((b) => `<span><i class="dot" style="--accent:${CATS[b.id].accent}"></i>${CATS[b.id].name} ${b.n}</span>`).join("")}</div>
          <p class="stack__note">기록하지 않은 날이 있어도 괜찮아요. 쌓인 건 그대로 있어요.</p>
        </section>
        <section class="check-card"${note("AI 가 원문에서 찾지 못한 경험만 「확인해 주세요」로 부탁 — AI 가 정리하고 사람이 판단하는 자리. 재촉이 아니라 할 일이 있을 때만 뜬다")}>
          <h2>확인해 주세요 · ${reviews.length}</h2>
          <p>AI 가 원문에서 그대로 찾지 못한 경험이에요. 맞으면 그대로, 아니면 고쳐 주세요.</p>
          ${reviews.slice(0, 2).map((x) => `<a href="timeline.html?a=${x.act.id}">${x.t}<small>${x.act.name}</small></a>`).join("")}
        </section>
        <section class="memory">
          <div class="memory__head"><div class="memory__title"><img src="assets/home/history.svg" width="16" height="16" alt="" /><h2>다시 꺼내 보는 경험</h2></div><button type="button" class="icon-btn" aria-label="더보기"><img src="assets/home/ellipsis-dark.svg" width="17" height="17" alt="" /></button></div>
          <article class="memory-card"${note("사진 대신 원본 발췌 — 일기장 느낌을 덜고, 「내 자료에서 나온 경험」이라는 게 보이게. 「1년 전 이맘때」는 그대로")}>
            <div class="memory-card__quote"><span class="file">${ICON.file}${ux.xs[0].src} · ${ux.xs[0].line}번째 줄</span><blockquote>${ux.xs[0].q}</blockquote></div>
            <div class="memory-card__body">
              <span class="memory-card__when">1년 전 이맘때 · ${ux.name}</span>
              <h3>${ux.xs[0].t}</h3>
              <div class="memory-card__foot"><span>${fmt(ux.start)} – ${fmt(ux.end)}</span><a href="timeline.html?a=4" class="memory-card__open">활동 열기 <img src="assets/home/arrow-up-right.svg" width="13" height="13" alt="" /></a></div>
            </div>
          </article>
        </section>
        <section class="prompt"${note("「오늘의 기록 한 조각」 → 「생각난 김에 한 줄」. 매일의 숙제가 아니라 언제든 한 줄. 남긴 한 줄은 AI 가 맞는 활동에 붙인다(S-01 텍스트 넣기). 눌러 보세요", true)}>
          <div class="prompt__label"><img src="assets/home/cookie.svg" width="16" height="16" alt="" /><span>생각난 김에 한 줄</span></div>
          <p class="prompt__q">최근에 해 본 일 중, 기억해 두고 싶은 게 있나요?</p>
          <p class="prompt__hint">거창하지 않아도 좋아요. 한 줄이면 AI 가 맞는 활동에 붙여 둘게요.</p>
          <a href="#" class="prompt__cta" data-open="note">한 줄 남기기 <img src="assets/home/arrow-right.svg" width="14" height="14" alt="" /></a>
        </section>
        <p class="privacy"${note("「나의 경험은 나에게만 보여요」는 로그인(S-14)이 붙은 뒤에야 사실이 된다 — 그 전 데모에선 빼거나 문구를 바꿔야 한다", true)}><img src="assets/home/lock-keyhole.svg" width="11" height="11" alt="" />나의 경험은 나에게만 보여요.</p>
      </aside>
    </div>
  </div>`);
}

/* ---------- 타임라인 + 세부 ---------- */
function row(a, year, faint) {
  const sp = span(a);
  const first = year * 12;
  const cells = Array.from({ length: 12 }, (_, i) => {
    const m = first + i;
    const on = sp && m >= sp.s && m <= sp.e;
    return `<i class="${on ? (a.ongoing && m === sp.e ? "fade" : "on") : ""}"></i>`;
  }).join("");
  const rev = a.xs.filter((x) => x.st === "review").length;
  const sub = faint ? `${Math.floor(sp.s / 12)}년부터 이어짐` : `${period(a)} · ${a.xs.length ? `경험 ${a.xs.length}` : "경험 아직 없음"}${rev ? `<span class="review">${ICON.warn}확인 필요 ${rev}</span>` : ""}`;
  return `<button type="button" class="row ${faint ? "row--faint" : ""}" data-a="${a.id}" data-collection="${a.cat}" style="${style(a.cat)}">
    <span><span class="row__name"><img src="${CATS[a.cat].icon}" width="13" height="13" alt="" />${a.name}</span><span class="row__sub" style="display:block">${sub}</span></span>
    ${year ? `<span class="band">${cells}</span>` : ""}
  </button>`;
}

function timeline() {
  const dated = ACTS.filter((a) => span(a));
  const years = [...new Set(dated.flatMap((a) => { const s = span(a); const ys = []; for (let y = Math.floor(s.s / 12); y <= Math.floor(s.e / 12); y++) ys.push(y); return ys; }))].sort((a, b) => b - a);
  let firstYear = true;
  const yearHtml = years.map((y) => {
    const starts = dated.filter((a) => Math.floor(span(a).s / 12) === y);
    const cont = dated.filter((a) => { const s = span(a); return Math.floor(s.s / 12) < y && Math.floor(s.e / 12) >= y; });
    const head = `<div class="yr__head"><b>${y}<small>활동 ${starts.length + cont.length}</small></b><span class="yr__months">${Array.from({ length: 12 }, (_, i) => `<span>${i + 1}</span>`).join("")}</span></div>`;
    const html = `<section class="yr"${firstYear ? note("가로 간트 → 연도별 목록 + 12칸 기간 띠. 여러 해를 위아래로 한눈에 보고, 같은 해 띠끼리 겹침을 읽는다(S-07). 띠 색 = 분류 색. 한 해짜리 간트는 해를 넘기면 옆으로 끝없이 밀려서 버렸다") : ""}>${head}${starts.map((a) => row(a, y)).join("")}${cont.map((a) => row(a, y, true)).join("")}</section>`;
    firstYear = false;
    return html;
  }).join("");
  const undated = ACTS.filter((a) => !span(a));
  const undatedHtml = undated.length ? `<section class="yr"><div class="yr__head"><b>기간 모름<small>활동 ${undated.length}</small></b></div>${undated.map((a) => row(a, 0)).join("")}</section>` : "";
  return shell("timeline", "타임라인", `
  <div class="split">
    <div class="workspace__scroll">
      <div class="tl-page">
        <div class="records__head"><div class="records__title records__title--page"><h1>타임라인</h1></div><button type="button" class="sort">최근 활동 순 <img src="assets/home/chevron-down.svg" width="13" height="13" alt="" /></button></div>
        <p class="tl-sub">활동 ${ACTS.length} · 경험 ${ALL_X.length} — 활동을 누르면 그 안에서 한 일과 근거가 옆에 열려요.</p>
        <div class="filters" role="group" aria-label="분류 필터">
          <button type="button" class="chip is-active" data-filter="all">전체</button>
          ${Object.entries(CATS).map(([id, c]) => `<button type="button" class="chip" data-filter="${id}">${c.name}</button>`).join("")}
          <button type="button" class="filters__more"><img src="assets/home/sliders-horizontal.svg" width="14" height="14" alt="" />필터</button>
        </div>
        <div class="tl-wrap">${yearHtml}${undatedHtml}</div>
      </div>
    </div>
    <aside class="panel" aria-label="활동 세부"${note("활동을 누르면 타임라인을 떠나지 않고 옆에 세부(S-08). 패널이 열려 칸이 좁아지면 띠가 이름 아래로 내려간다")}><div class="panel__inner" id="detail"></div></aside>
  </div>`);
}

function xItem(x, i, first) {
  const cite = x.miss
    ? `<div class="quote" hidden><span class="file">${ICON.file}${x.src}</span><blockquote>${x.q}</blockquote><span class="warn">원본에서 이 문장을 그대로 찾지 못했어요. 맞는지 확인해 주세요.</span></div>`
    : x.st === "mine" ? "" : `<div class="quote" hidden><span class="file">${ICON.file}${x.src}<small>· ${x.line}번째 줄</small></span><blockquote>${x.q}</blockquote></div>`;
  return `<div class="x">
    <div class="x__top"><p class="x__text">${x.t}</p><button type="button" class="icon-btn" aria-label="경험 메뉴 — 고치기 · 옮기기 · 지우기"><img src="assets/home/ellipsis.svg" width="16" height="16" alt="" /></button></div>
    <div class="x__meta"${first ? note("경험 메타를 조용하게: 원문 확인은 작은 체크 하나, 「나」는 숨기고 팀 · 모름만, 역량은 해시태그(점선 = AI 가 붙임, 실선 = 내가 고름), 색 있는 건 「확인 필요」 하나. 지우지 않고 낮췄다(ADR-002 고정 항목)") : ""}>${status(x)}${WHO[x.who] ? `<span>${WHO[x.who]}</span>` : ""}${tags(x)}${x.st === "mine" ? `<span class="x__cite" style="color:var(--gray-text);font-weight:400">근거 없음</span>` : `<button type="button" class="x__cite" aria-expanded="false" data-cite="${i}"${first ? note("근거는 접어 두고 「❝ 근거」를 누르면 원본 파일 · 줄 · 발췌문") : ""}>❝ 근거 1 ${ICON.down}</button>`}</div>
    ${cite}
    ${x.fill ? `<div class="fill-in"${note("지원 문항에서 AI 가 물은 것에 답하면, 그 답이 이 경험에 「내가 입력」 보완으로 쌓인다(S-23). 다음 문항에서 다시 쓰인다")}><span class="mine">${ICON.pen}내가 입력 · ${x.fill.from}</span><b>${x.fill.q}</b>${x.fill.a}</div>` : ""}
  </div>`;
}

function openDetail(id) {
  const a = ACTS.find((v) => v.id === Number(id));
  if (!a) return;
  document.querySelectorAll(".row").forEach((r) => r.classList.toggle("is-selected", r.dataset.a === String(a.id)));
  const c = CATS[a.cat];
  const startNo = noteNo;
  NOTES.splice(NOTES.findIndex((n) => n.detail) >>> 0);
  noteNo = NOTES.length;
  $("#detail").innerHTML = `
    <div class="dt__head" style="${style(a.cat)}">
      <div class="dt__top"><h2>${a.name}</h2><button type="button" class="icon-btn" aria-label="활동 메뉴 — 고치기 · 합치기"><img src="assets/home/ellipsis-dark.svg" width="17" height="17" alt="" /></button><button type="button" class="icon-btn" data-close aria-label="닫기">${ICON.x}</button></div>
      <span class="dt__cat"><img src="${c.icon}" width="12" height="12" alt="" />${c.name}</span>
      <span class="dt__period">${period(a)}</span>
      <div class="dt__sources"${note("「이 활동을 만든 자료」 — 원본 파일 이름. 이 활동이 어느 자료에서 나왔는지")}>이 활동을 만든 자료 ${a.sources.map((s) => `<span class="file">${ICON.file}${s}</span>`).join("")}</div>
    </div>
    <div class="dt__body" style="${style(a.cat)}">
      <p class="dt__count">이 활동에서 한 일 ${a.xs.length}</p>
      ${a.xs.length ? a.xs.map((x, i) => xItem(x, i, i === 0)).join("") : `<p class="dt__hint" style="font-size:13px">아직 이 활동에 적힌 경험이 없어요. 자료에 활동 이름 · 기간만 있었을 수 있어요 — 기억나는 일을 한 줄씩 적어 두면 여기에 쌓여요.</p>`}
      <button type="button" class="add-x"><img src="assets/home/plus-small.svg" width="14" height="14" alt="" />경험 직접 추가</button>
      <p class="dt__hint">AI 가 자료에서 찾아 채운 기록이에요. 「확인 필요」는 원문과 맞는지 한번 봐 주세요. 자료에서 찾지 못했다고 경험이 없는 건 아니에요.</p>
    </div>`;
  NOTES.slice(startNo).forEach((n) => (n.detail = true));
  renderNotes();
  $(".panel").classList.add("is-open");
  history.replaceState(null, "", `?a=${a.id}`);
}

/* ---------- 지원 문항 ---------- */
function apply() {
  // 추천은 활동 정보까지 붙은 ALL_X 에서 고른다
  const pick = (actId, i) => ALL_X.find((x) => x.act.id === actId && x.t === ACTS.find((a) => a.id === actId).xs[i].t);
  const ws = pick(5, 0);
  const recs = [
    { x: ws, why: "문항이 묻는 「기술 문제를 알아채고 → 고친」 흐름이 원문에 그대로 있어요.", stress: "폴링의 한계를 어떻게 알아챘는지, 왜 WebSocket 을 골랐는지", gap: null, fill: true },
    { x: pick(1, 1), why: "피드백을 받아 성능 문제를 고친 사례예요.", stress: "지적을 받은 상황 → 원인 → 압축을 고른 이유", gap: "자료에는 「팀」이 한 일로 적혀 있어요. 내가 직접 넣었는지는 아래 질문으로 확인할게요." },
    { x: pick(2, 0), why: "느린 화면을 기술로 고친 경험이에요.", stress: "몇 건부터 느려졌는지, 가상 스크롤을 고른 이유", gap: "고친 뒤 얼마나 빨라졌는지 수치가 자료에 없어요 — 지어내지 않았어요." },
  ];
  const recHtml = recs.map((r, i) => `
    <article class="rec" style="${style(r.x.act.cat)}"${i === 0 ? note("추천은 0~3개. 추천마다 왜 맞는지(AI 해석) · 강조할 점 · 근거(원문 발췌 · 내가 입력한 보완) · 부족한 점(S-20). 출처 상태를 크게 보여 주는 곳은 여기다 — 평소 화면에선 조용히") : ""}>
      <span class="rec__n">${i + 1}</span>
      <h3>${r.x.t}</h3>
      <span class="rec__from">${r.x.act.name} · ${period(r.x.act)} ${r.x.who === "TEAM" ? "· 팀" : ""}</span>
      <div class="rec__grid">
        <div class="rec__box"><b><span class="ai-chip">AI</span>왜 맞나요</b>${r.why}</div>
        <div class="rec__box"><b><span class="ai-chip">AI</span>강조하면 좋은 점</b>${r.stress}</div>
        <div class="rec__box rec__box--wide"><b><span class="ok">${ICON.check}</span>근거 — 원문</b><span class="file">${ICON.file}${r.x.src} · ${r.x.line}번째 줄</span><span>「${r.x.q}」</span>${r.fill ? `<span class="mine" style="margin-top:6px">${ICON.pen}내가 입력 · 보완</span><span>「${r.x.fill.a}」</span>` : ""}</div>
        ${r.gap ? `<div class="rec__box rec__box--wide rec__box--gap"><b><span class="review">${ICON.warn}부족한 점</span></b>${r.gap}</div>` : ""}
      </div>
    </article>`).join("");
  return shell("apply", "지원 문항", `
  <div class="ap">
    <nav class="ap__list" aria-label="넣은 문항"${note("넣었던 문항과 추천이 남는다 — 새로고침해도, 다시 열 수 있게(S-21)")}>
      <h2>넣은 지원 문항</h2>
      <button type="button" class="q-item is-active">기술적인 문제를 해결한 경험<small>OO 부트캠프 · 백엔드 과정</small></button>
      <button type="button" class="q-item">팀에서 맡은 역할과 기여<small>IT 연합 동아리 운영진</small></button>
      <button type="button" class="q-item">지원 동기<small>OO 공모전 · 찾는 중…</small></button>
      <button type="button" class="q-new"><img src="assets/home/plus-small.svg" width="14" height="14" alt="" />문항 넣기</button>
    </nav>
    <div class="ap__main">
      <header class="q-head"><small>OO 부트캠프 · 백엔드 과정 · 11월 3일에 넣음</small><h1>기술적인 문제를 해결한 경험을 구체적으로 적어 주세요. (700자)</h1></header>
      <section class="sec"${note("AI 가 문항을 「보려는 것」 몇 개로 쪼개고, 각각 근거 있음 / 일부 / 자료에서 확인 안 됨(S-19). 「확인 안 됨」은 「부족한 사람」이 아니라 「자료에 없다」로 보이게")}>
        <h2>이 문항이 보려는 것 <small><span class="ai-chip">AI</span> 문항을 읽고 나눴어요</small></h2>
        <div class="reqs">
          <span class="req req--yes">기술 문제를 스스로 알아챔 <em>근거 있음</em></span>
          <span class="req req--yes">해결 방법과 고른 이유 <em>근거 있음</em></span>
          <span class="req req--part">고친 뒤 어떻게 확인했나 <em>일부</em></span>
          <span class="req req--none">결과를 수치로 <em>자료에서 확인 안 됨</em></span>
        </div>
        <p class="req-note">자료에서 확인이 안 된 건 경험이 없다는 뜻이 아니에요. 아래 질문에 답하면 채워져요.</p>
      </section>
      <section class="sec"><h2>꺼내 쓸 경험 <small>${recs.length}개</small></h2><div class="recs">${recHtml}</div></section>
      <section class="sec"${note("문항에 필요한데 자료에 없는 것만 짧게 묻는다 — 최대 3개, 답은 선택(S-22). 답하면 그 경험에 「내가 입력」 보완으로 쌓인다(S-23). 없는 수치를 지어내지 않는다")}>
        <h2>몇 가지만 확인할게요 <small>답은 선택이에요</small></h2>
        <div class="asks">
          <div class="ask is-done"><span class="ask__for">바꿔요 — 채팅 WebSocket 경험</span><p class="ask__q">고친 뒤 메시지가 제때 오는지 어떻게 확인했나요?</p><p class="ask__a"><span class="mine">${ICON.pen}내가 입력</span>${ws.fill.a} <span class="muted">— 이 경험에 쌓였어요</span></p></div>
          <div class="ask"><span class="ask__for">모아봄 — 이미지 압축 경험</span><p class="ask__q">이미지 압축은 직접 넣었나요, 팀원이 넣었나요?</p><form><input placeholder="짧게 답해 주세요" /><button type="submit" class="btn btn--dark">답하기</button><button type="button" class="btn btn--ghost">건너뛰기</button></form></div>
          <div class="ask"><span class="ask__for">현장실습 — 가상 스크롤 경험</span><p class="ask__q">바꾼 뒤 달라진 점을 기억하나요? 숫자가 아니어도 괜찮아요.</p><form><input placeholder="짧게 답해 주세요" /><button type="submit" class="btn btn--dark">답하기</button><button type="button" class="btn btn--ghost">건너뛰기</button></form></div>
        </div>
      </section>
      <section class="sec"${note("다른 문항과 나란히 — 같은 「바꿔요」에서 문항마다 다른 경험이 골라지고, 앞에서 답한 보완이 다시 쓰인다(데모 6 · S-25). 발표에서 「한 번 쌓으면 여러 번 쓴다」를 보여 주는 자리")}>
        <h2>다른 문항과 나란히 보기</h2>
        <div class="cmp">
          <div class="cmp__col"><small>OO 부트캠프</small><h3>기술적인 문제를 해결한 경험</h3><div class="cmp__pick">바꿔요 — 채팅을 WebSocket 으로 바꿔 해결</div><div class="cmp__pick">모아봄 — 이미지 압축</div></div>
          <div class="cmp__col"><small>IT 연합 동아리 운영진</small><h3>팀에서 맡은 역할과 기여</h3><div class="cmp__pick">바꿔요 — 설계 방향이 갈렸을 때 사용자 의견을 먼저 듣자고 제안</div><div class="cmp__pick is-reused">바꿔요 — 채팅 개선을 맡아 끝까지 확인 <br><span class="mine">${ICON.pen}앞 문항에서 답한 보완을 다시 씀</span></div></div>
        </div>
      </section>
    </div>
  </div>`);
}

/* ---------- 대화창 · 알림 ---------- */
function dialogs() {
  return `
  <div class="dlg" id="dlg-source" role="dialog" aria-modal="true" aria-label="자료 넣기">
    <div class="dlg__box">
      <div class="dlg__top"><h2>자료 넣기</h2><button type="button" class="icon-btn" data-close-dlg aria-label="닫기">${ICON.x}</button></div>
      <div data-step="form" style="display:flex;flex-direction:column;gap:16px">
        <p class="dlg__desc">프로젝트 README · 회고 · 활동 정리 노트를 그대로 넣어 주세요. AI 가 읽고 활동과 그 안에서 한 일을 찾아, 원문 근거와 함께 쌓아 둘게요.</p>
        <div class="seg"><button type="button" class="is-active" data-tab="paste">붙여넣기</button><button type="button" data-tab="file">파일 올리기</button></div>
        <textarea data-pane="paste" placeholder="노션 · 회고 · README 내용을 붙여 넣어 주세요"></textarea>
        <div class="drop" data-pane="file" hidden><img src="assets/timeline/paperclip.svg" width="22" height="22" alt="" /><b style="color:#000">파일을 끌어다 놓거나 눌러서 고르세요</b>.md · .txt 하나 · 50,000자까지</div>
        <p class="notice"${note("외부 AI 로 보내진다는 안내(S-16, P0). 분석을 시작하기 전에 보인다")}>🔒<span>넣은 자료는 분석을 위해 외부 AI 제공사(OpenAI)로 보내져요. OpenAI API 는 보낸 내용을 학습에 쓰지 않아요. 회사 · 고객의 비공개 자료는 빼고 넣어 주세요.</span></p>
        <div class="dlg__foot"><button type="button" class="btn btn--line" data-close-dlg>취소</button><button type="button" class="btn btn--dark" data-run>분석 시작</button></div>
      </div>
      <div data-step="run" hidden>
        <p class="dlg__desc" style="margin-bottom:14px">자료에서 활동과 경험을 찾고 있어요. 창을 닫아도 이어져요.</p>
        <ol class="steps"><li class="is-done"><i></i>자료 저장</li><li class="is-now"><i></i>활동 · 경험 찾기</li><li><i></i>근거를 원문과 대조</li></ol>
      </div>
    </div>
  </div>
  <div class="dlg" id="dlg-note" role="dialog" aria-modal="true" aria-label="생각난 김에 한 줄">
    <div class="dlg__box">
      <div class="dlg__top"><h2>생각난 김에 한 줄</h2><button type="button" class="icon-btn" data-close-dlg aria-label="닫기">${ICON.x}</button></div>
      <p class="dlg__desc">거창하지 않아도 좋아요. 무엇을 했는지만 적어도 돼요.</p>
      <textarea style="min-height:96px" placeholder="예: 스터디에서 처음으로 세그먼트 트리 풀이를 발표했다"></textarea>
      <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--gray-text)">어느 활동에 붙일까요?<select><option>AI 가 맞는 활동을 골라 줘요</option>${ACTS.map((a) => `<option>${a.name}</option>`).join("")}</select></label>
      <div class="dlg__foot"><button type="button" class="btn btn--line" data-close-dlg>취소</button><button type="button" class="btn btn--dark" data-save-note>남기기</button></div>
    </div>
  </div>
  <div class="toast" role="status"></div>
  <button type="button" class="notes-btn" data-notes>이번 피드백 보기</button>
  <div class="notes" aria-label="이번 피드백"><h3>디자인 시안 → 이번 피드백</h3><p class="lead">주황 번호 = 바꾼 자리와 이유. 보라 = PM 이 정할 것. 누르면 그 자리로 가요.</p><ol id="notes-list"></ol></div>`;
}

function toast(html) {
  const t = $(".toast");
  t.innerHTML = html;
  t.classList.add("is-on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("is-on"), 5200);
}

function renderNotes() {
  $("#notes-list").innerHTML = NOTES.map((n) => `<li class="${n.q ? "is-q" : ""}" data-go-note="${n.n}"><b>${n.n}</b><span>${n.text}</span></li>`).join("");
}

/* ---------- 그리기 · 이벤트 ---------- */
const page = document.body.dataset.page;
document.querySelector(".app").innerHTML = (page === "home" ? home() : page === "timeline" ? timeline() : apply()) + dialogs();
renderNotes();

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-open],[data-close-dlg],[data-run],[data-save-note],[data-notes],[data-go-note],[data-go],[data-a],[data-close],[data-cite],[data-tab],[data-review-filter]");
  if (!t) return;
  if (t.dataset.open) { e.preventDefault(); $(`#dlg-${t.dataset.open}`).classList.add("is-open"); return; }
  if (t.hasAttribute("data-close-dlg")) { t.closest(".dlg").classList.remove("is-open"); return; }
  if (t.dataset.tab) {
    t.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === t));
    document.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tab));
    return;
  }
  if (t.hasAttribute("data-run")) {
    const box = t.closest(".dlg__box");
    box.querySelector('[data-step="form"]').hidden = true;
    box.querySelector('[data-step="form"]').style.display = "none";
    box.querySelector('[data-step="run"]').hidden = false;
    const steps = box.querySelectorAll(".steps li");
    setTimeout(() => { steps[1].className = "is-done"; steps[2].className = "is-now"; }, 1300);
    setTimeout(() => {
      t.closest(".dlg").classList.remove("is-open");
      box.querySelector('[data-step="form"]').hidden = false;
      box.querySelector('[data-step="form"]').style.display = "flex";
      box.querySelector('[data-step="run"]').hidden = true;
      steps[1].className = "is-now"; steps[2].className = "";
      toast(`자료에서 활동 1개 · 경험 3개를 찾았어요. 「확인 필요」가 붙은 것부터 봐 주세요. <a href="timeline.html?a=1">보기</a> <span style="opacity:.6">(시안 — 실제 분석 아님)</span>`);
    }, 2600);
    return;
  }
  if (t.hasAttribute("data-save-note")) {
    t.closest(".dlg").classList.remove("is-open");
    toast(`한 줄을 남겼어요. AI 가 「알고리즘 스터디」에 붙였어요 — 아니면 옮겨 주세요. <span style="opacity:.6">(시안)</span>`);
    return;
  }
  if (t.hasAttribute("data-notes")) { document.body.classList.toggle("show-notes"); t.textContent = document.body.classList.contains("show-notes") ? "피드백 표시 끄기" : "이번 피드백 보기"; return; }
  if (t.dataset.goNote) { document.querySelector(`[data-n="${t.dataset.goNote}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  if (t.dataset.cite != null) {
    const q = t.closest(".x").querySelector(".quote");
    if (q) { q.hidden = !q.hidden; t.setAttribute("aria-expanded", String(!q.hidden)); }
    return;
  }
  if (t.hasAttribute("data-close")) { $(".panel").classList.remove("is-open"); document.querySelectorAll(".row").forEach((r) => r.classList.remove("is-selected")); history.replaceState(null, "", location.pathname); return; }
  if (t.dataset.a) { openDetail(t.dataset.a); return; }
  if (t.hasAttribute("data-review-filter")) {
    document.querySelectorAll(".filters .chip").forEach((c) => c.classList.toggle("is-active", c === t));
    document.querySelectorAll(".card").forEach((c) => (c.hidden = c.dataset.review !== "true"));
    return;
  }
  if (t.dataset.go && !e.target.closest("button")) location.href = t.dataset.go;
});

// 홈의 「꺼내볼까요」 — 보내면 지원 문항 화면으로
document.querySelectorAll(".suggest__chip").forEach((c) => c.addEventListener("click", () => { $(".ai-search input").value = c.textContent.trim(); }));

// 주소로 세부 · 분류 열기
const params = new URLSearchParams(location.search);
if (page === "timeline" && params.get("a")) openDetail(params.get("a"));
if (page === "timeline" && params.get("cat")) setTimeout(() => document.querySelector(`.chip[data-filter="${params.get("cat")}"]`)?.click(), 0);
