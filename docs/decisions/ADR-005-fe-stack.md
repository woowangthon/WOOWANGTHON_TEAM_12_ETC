# ADR-005: FE 는 Next.js(App Router) + Vercel — PR 마다 미리보기 URL

- 상태: 채택
- 날짜: 2026-11-02

## 배경

- PM 이 PR 마다 실제 화면을 열어 보고 피드백한다([ADR-002](ADR-002-sprints.md)). 그래서 **PR 을 열면 미리보기 링크가 저절로 뜨는 것**이 FE 의 첫 단추다(FE#4).
- [ADR-004](ADR-004-deploy.md) 는 BE · AI · DB 를 OCI 서버 하나에 두고, FE 를 어디서 띄울지는 FE · BE 담당에게 남겼다. 조건은 FE · BE 를 같은 상위 도메인 아래(`app.` · `api.`)에 두는 것.
- 프론트 · 디자인 셋이 2주 안에 PC · 모바일 화면을 같이 만든다(SPEC §0). 백엔드 · 클라우드는 한 명이라 FE 배포까지 맡기기 어렵다.
- 기획에서 Next.js(React) + Vercel 미리보기를 제안했다.

## 결정

- **Next.js 16(App Router) · React 19 · TypeScript · Tailwind CSS 4.** `create-next-app` 기본값 그대로 시작한다.
- **Vercel GitHub 연동으로 배포한다.** main 은 운영, PR 은 미리보기 URL 을 Vercel 봇이 PR 댓글로 단다. 레포에 배포 비밀값이 없다.
- **BE 는 Spring Boot 하나다.** Next.js 의 서버 기능(Route Handler · Server Action)으로 BE 일을 하지 않는다 — 데이터 · 인증 · AI 호출은 전부 BE API(`docs/contracts/experience-api.md`)로.
- 검증은 `npm run check`(린트 → 타입체크 → 빌드). GitHub Actions 가 PR 마다 같은 것을 돌린다.
- 운영 도메인이 생기면 Vercel 에 `app.<도메인>` 을 붙인다(ADR-004 의 같은 상위 도메인 조건).

## 버린 안

- **Vite + React SPA 를 Cloudflare Pages 에** — 정적 파일이라 어디든 올라가고, Cloudflare 터널 · Access 와 계정이 같다. 하지만 라우팅 · 폴더 구조 관례를 팀이 따로 정해야 하고, 기획 제안은 Next.js 였다. Pages 도 미리보기는 되지만 Next.js 를 올리려면 어댑터(OpenNext)가 더 든다.
- **OCI 서버의 Docker Compose 에 FE 도 함께** — 서버 하나로 모이고 도메인 · Access 설정이 한 곳이다. 하지만 PR 마다 미리보기를 띄우려면 직접 만들어야 하고, BE 담당 한 명에게 FE 배포까지 얹힌다.

## 결과

- PR 을 열면 몇 분 안에 PM 이 실제 화면을 연다. FE 담당은 서버를 몰라도 배포된다.
- 배포처가 둘(Vercel · OCI)이 된다. FE → BE 호출은 다른 도메인 사이라 BE 의 CORS 에 운영 · 미리보기 주소를 넣어야 한다.
- 남은 위험: 로그인 전 Cloudflare Access 로 `api.` 을 막아 두면(ADR-004) 브라우저가 다른 도메인에서 부를 때 Access 로그인에 막힐 수 있다. 실제 API 를 붙이는 FE#7 전에 BE 담당과 정한다(예: 미리보기는 목으로, 운영 `app.` 도 Access 뒤에 두기).
- Vercel 무료(Hobby) 플랜은 미리보기에 「Vercel 로그인한 사람만」 보호가 기본으로 켜진다. 팀원이 못 열면 프로젝트 설정에서 끈다 — 공개 레포라 미리보기에 감출 것이 없다.
