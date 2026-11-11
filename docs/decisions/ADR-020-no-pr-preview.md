# ADR-020: FE 는 main 만 Vercel 에 배포한다 — PR 미리보기는 끄고 스크린샷으로

- 상태: 채택
- 날짜: 2026-11-12

## 배경

- [ADR-005](ADR-005-fe-stack.md) 는 PR 마다 Vercel 미리보기 URL 을 띄워 PM 이 실제 화면을 열어 보게 했다.
- Vercel 계정은 Hobby 요금제라 **하루 배포 100개**가 한도다. PR 이 하루 30개 남짓 열리고 push 마다 미리보기가 하나씩 생겨, 2026-11-12 한도에 걸려 **main 운영 배포까지 막혔다**(FE#525 · 머지 커밋 `eb772cb` — 「Deployment rate limited — retry in 24 hours」). 제출은 11-15 다.
- 미리보기는 API 주소를 비운 목 모드다 — `*.vercel.app` 엔 Access 쿠키가 안 실려 실제 API 를 못 부른다(FE README). 지원서 화면은 「목 모드에서는 지원서를 불러올 수 없어요」만 보여, 새 화면을 미리보기로 볼 수 없었다.
- UI 확인은 이미 Playwright 시험(가짜 API)으로 1440 · 1024 · 390 을 찍어 PR 에 붙이고 있다(FE#508).

## 결정

- FE `vercel.json` 에 `"git": { "deploymentEnabled": { "**": false, "main": true } }` — **main 만 자동 배포**한다. 모든 브랜치가 `**` 에 걸려 꺼지고, main 은 `true` 규칙에도 걸려 켜진다(걸린 규칙 중 하나라도 `true` 면 배포 — Vercel 「Git configuration」).
- UI 가 바뀌는 PR 은 확인 폭 셋의 **스크린샷**을 붙인다(Playwright · 가짜 API 로 찍어도 된다). 실제 API · AI 결과는 운영(`app-woowang.miroda.live`)에서 본다.

영향: AGENTS.md 공통 블록 · PR 템플릿 · FE AGENTS.md 「이 레포」 · FE README 「배포 · 미리보기」. ADR-005 의 스택 · main 운영 배포는 그대로.

## 버린 안

- **Ignored Build Step 으로 문서 · 시험만 바꾼 PR 건너뛰기** — 미리보기는 남는다. 버린 이유: 건너뛴 빌드도 「취소됨」 배포로 남아 한도에 센다(Vercel 「Project settings」).
- **Pro 요금제로 올리기** — 한도가 커지고 미리보기를 지킨다. 버린 이유: 비용이 들고, 미리보기는 목 모드라 얻는 게 적다.
- **미리보기를 그대로 두고 push 를 줄이기** — 설정 변경이 없다. 버린 이유: 에이전트 · 사람 모두 push 를 세며 일할 수 없고, 한 번 더 걸리면 운영 배포가 하루 막힌다.

## 결과

- 배포는 main 머지 수만큼만 생긴다(하루 30개 안팎).
- PR 에 Vercel 봇 링크가 더는 뜨지 않는다. PM 은 PR 스크린샷과 머지 뒤 운영 화면으로 본다.
- 남은 확인: 끈 브랜치가 배포 기록을 아예 안 만드는지는 Vercel 문서에 없다 — 머지 뒤 PR 하나로 대시보드를 본다(ETC#351).
