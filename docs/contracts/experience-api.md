# experience-api — FE → BE

> 스프린트 1 「경험 관리」(SPEC R-01) · 스프린트 2 보완(SPEC R-03 — 「보완 `Supplement`」 · 보완 고치기 · 지우기). 활동 분류(SPEC S-57 `P1` — `category` · `categoryBy`). 같은 활동 제안(SPEC S-44 `P1` — `mergeSuggestion` · 따로 두기). 그때의 나 · 이어짐(SPEC R-05 F-13 `P1` — 활동 `note` · `ActivityLink` · 이어짐 제안 받기 · 정하기). 경험마다 쓰인 지원(SPEC R-05 F-14 `P1` — 활동 세부의 `usedIn`, S-38). 경험 찾기(SPEC S-58 `P1` — `GET /api/experiences`). 자료 여러 개 한 번에 · 활동에 자료 더하기(SPEC S-59 · S-60 `P2` — `POST /api/sources/batch` · `POST /api/sources` 의 `activityId` · 작업 `QUEUED` · `targetActivityId` · `targetMatched`). 폴더 · Notion ZIP · GitHub 가져오기(SPEC S-62 ~ S-64 `P2` — 새 API · 필드 없음, `name` 에 경로). 같은 자료 알아보기(SPEC S-69 `P2` — `allowDuplicate` · 409 `SOURCE_DUPLICATE`). 경험 합치기(SPEC S-70 `P2` — `POST /api/experiences/{keepId}/merge`). 공개 프로필에 넣기(SPEC S-65 `P2` — `Experience` 의 `shared`, API 는 [`share-api.md`](share-api.md)). 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> 예시는 가상의 팀 프로젝트 회고 하나(「바꿔요」 · 알고리즘 스터디)로 이어진다 — [`ai-api.md`](ai-api.md) 예시와 같은 자료다.

## 흐름

```
FE ─POST /api/sources──────────▶ BE  원본 저장 · 작업 생성 → 202 { jobId }
                                  BE ─POST /extract──▶ AI   (ai-api.md)
FE ─GET /api/jobs/{id} (폴링)───▶ BE  ANALYZING → COMPLETED / FAILED
FE ─GET /api/activities─────────▶ BE  타임라인
FE ─GET /api/activities/{id}────▶ BE  세부(경험 · 근거)
FE ─GET /api/experiences?query=…▶ BE  경험 찾기 · 거르기(S-58 — MCP search_experiences 와 같은 검색)
FE ─PATCH · POST · DELETE …─────▶ BE  고치기 · 더하기 · 지우기 · 옮기기 · 합치기
FE ─PUT /api/experiences/{id}/saved▶ BE  저장 켜기 · 끄기(S-71)

자료 여러 개 한 번에 · 활동에 자료 더하기 (S-59 · S-60, P2)
FE ─POST /api/sources/batch─────────────▶ BE  원본 N개 · 작업 N개 → 202 { items }
                                          BE  작업을 차례로: 1번 ANALYZING, 나머지 QUEUED → 앞 작업이 끝나면 다음
FE ─POST /api/sources { activityId }────▶ BE ─POST /extract { targetActivityId }──▶ AI
                                          BE  sameAsActivityId = 대상인 활동은 대상에 바로 붙인다

같은 자료 알아보기 (S-69, P2)
FE ─POST /api/sources─────────────────────────▶ BE  같은 글자의 원본이 있으면 409 SOURCE_DUPLICATE — 저장 · 분석 · 횟수 없음
FE ─POST /api/sources { allowDuplicate: true }▶ BE  보통 자료 넣기 → 202 { jobId }

그때의 나 · 이어짐 (S-34 · S-35, P1)
FE ─PATCH /api/activities/{id} { note }──────────▶ BE  계기 한 줄 저장
FE ─POST /api/activities/{id}/link-suggestions───▶ BE ─POST /link-suggestions──▶ AI  (동기)
                                                    BE  SUGGESTED 로 저장 → 200 { links }
FE ─PATCH /api/activity-links/{id} { status }────▶ BE  CONFIRMED · REJECTED
```

- 기본 주소: `/api` 아래. 로그인한 사용자의 것만 보이고 고칠 수 있다 — 쿠키 · 401 은 [`auth-api.md`](auth-api.md).
- 폴링 간격은 FE 가 정한다(제안 2초). 실시간 스트리밍은 하지 않는다.

## 모양 — 응답에 되풀이해 나오는 것

활동 요약 `ActivitySummary`

```json
{
  "id": 7,
  "name": "바꿔요 — 캠퍼스 중고거래 앱",
  "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
  "experienceCount": 4,
  "category": "PROJECT",
  "categoryBy": "AI",
  "mergeSuggestion": null,
  "note": null
}
```

- `category` — 활동 분류(SPEC S-57, `P1`). README 「값 목록」 `activityCategory`, 미분류면 `null`. 분석이 `/extract` 응답(`ai-api.md`)으로 **새 활동에** 붙이고, 사용자가 `PATCH /api/activities/{id}` 로 고르거나 비운다. 기존 활동은 다시 분석하지 않아 `null` 로 남는다. **모든 `ActivitySummary` · 활동 세부 응답에 실린다** — 이 파일의 다른 예시엔 줄였다. 정리용이라 매칭 · 초안 · 근거 점검 요청에 싣지 않는다.
- `categoryBy` — 지금 `category` 를 누가 붙였나(README 「값 목록」 `categoryBy` — `AI` · `USER`). `category` 가 `null` 이면 `null`. **BE 만** 붙인다: 분석이 붙이면 `AI`, `PATCH` 에서 `category` 가 실제로 바뀌면 `USER`(같은 값을 보내면 그대로). FE 는 `AI` 일 때 「AI 해석」으로 보인다.
- `note` — 그때의 나: 이 활동의 계기 · 그때 든 생각 **한 줄**(SPEC S-34, `P1`). 없으면 `null`. 사용자만 쓴다(`PATCH /api/activities/{id}`) — AI 가 만들거나 고치지 않으므로 늘 「내가 입력」이고 출처 칸이 따로 없다. 경험이 아니다 — 경험 · 근거 · 보완과 섞지 않고, `/match` · `/ground-check` · `/ask` 요청에 싣지 않는다(추천 · 점검 근거로 쓰지 않는다). 쓰는 AI 호출은 이어짐 제안(`/link-suggestions`) 하나다. **모든 `ActivitySummary` · 활동 세부 응답에 실린다** — 이 파일의 다른 예시엔 줄였다.
- `mergeSuggestion` — 「기존 활동 X 와 같아 보여요」 AI 제안(SPEC S-44, `P1`). 없으면 `null`. 있으면 같아 보이는 **기존** 활동의 `{ "activityId", "name", "period" }` — `name` · `period` 는 지금 그 활동의 값이다(BE 가 응답 때 채운다). **모든 `ActivitySummary` · 활동 세부 응답에 실린다** — 이 파일의 다른 예시엔 줄였다(전부 `null`).
  - 만드는 곳: 분석 작업이 `/extract` 응답의 `sameAsActivityId`(`ai-api.md`)로 **새 활동에** 붙인다. 그 밖에서는 생기지 않는다(직접 고치거나 옮겨도 새로 생기지 않는다).
  - 「붙이기」 = `POST /api/activities/{mergeSuggestion.activityId}/merge` `{ "fromActivityId": <제안이 붙은 새 활동> }` — 기존 활동이 남는다(아래 「활동 합치기」). 「따로 두기」 = `DELETE /api/activities/{activityId}/merge-suggestion`.
  - 사라지는 때: 따로 두기 · 제안이 붙은 활동이 합쳐져 사라질 때 · 가리키는 기존 활동이 합쳐져 사라질 때(BE 가 `null` 로 — 다른 활동으로 옮겨 가리키지 않는다). 사라진 제안은 다시 생기지 않는다.
  - 자동으로 합치지 않는다. AI 해석이라 FE 는 「AI 제안」으로 보인다.

예: 이력서를 넣어 생긴 활동 9 「캡스톤 「바꿔요」」에 붙은 제안(`ai-api.md` 「두 번째 자료를 넣을 때」)

```json
{
  "id": 9,
  "name": "캡스톤 「바꿔요」",
  "period": { "start": "2025", "end": "2025", "ongoing": false },
  "experienceCount": 0,
  "mergeSuggestion": {
    "activityId": 7,
    "name": "바꿔요 — 캠퍼스 중고거래 앱",
    "period": { "start": "2025-03", "end": "2025-06", "ongoing": false }
  }
}
```

경험 `Experience`

```json
{
  "id": 101,
  "activityId": 7,
  "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
  "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
  "competenciesBy": "AI",
  "actor": "ME",
  "sourceStatus": "SOURCE_CONFIRMED",
  "citations": [],
  "supplements": []
}
```

- `supplements` 는 아래 `Supplement` 의 배열 — 되묻기에 답해 그 경험에 쌓인 보완(SPEC R-03 · S-23). 없으면 `[]`. 만든 순서. **스프린트 2 부터 모든 `Experience` 응답에 실린다** — 이 파일의 스프린트 1 예시엔 줄였다(전부 `[]`).
- `citations` 는 아래 `Citation` 의 배열. AI 가 뽑은 경험은 1개 이상이지만, 근거가 없는 경험도 올 수 있다(그때 `NEEDS_REVIEW`).
- `competencies` 는 역량 값의 배열(README 「값 목록」 — 0 ~ 3개, 중복 없음, 앞이 더 잘 맞는 것). 없으면 `[]`. AI 가 붙인 것은 **해석**이라 FE 는 원문 사실처럼 보이지 않게 한다(SPEC 미결정 2 · DESIGN). BE 는 받은 순서대로 저장하고 돌려준다.
- `competenciesBy` — 지금 `competencies` 를 누가 붙였나(README 「값 목록」 — `AI` · `USER`). **BE 만** 붙인다: 분석이 만든 경험은 `AI`, 직접 추가(`POST …/experiences`)는 `USER`, 경험 수정(`PATCH`)에서 `competencies` 가 실제로 바뀌면(순서 · `[]` 포함) `USER`. 본문 · 수행 주체만 고치거나, 옮기거나, 합치거나, 보완이 생겨도 그대로다. FE 는 `AI` 일 때만 역량 앞에 「AI」 표시를 붙인다 — `sourceStatus` 로 짐작하지 않는다(본문만 고쳐도 `USER_ENTERED` 가 되기 때문). **모든 `Experience` 응답에 실린다** — 이 파일 · `question-api.md` 의 다른 예시엔 줄였다.
- `mcpChange` — 외부 AI 가 본문을 고쳐 사용자가 아직 정하지 않은 경험(S-53 `P2`). `{ "changeId": 56, "client": "claude-ai" }`, 그 밖엔 `null`. FE 는 「Claude 가 고침」을 보이고 `mcp-api.md` 「변경 기록」으로 전 · 후 본문과 맞아요 · 되돌리기를 잇는다. 사용자가 이 경험을 고치거나 변경을 정하면 `null` 이 된다. **모든 `Experience` 응답에 실린다** — 이 파일 · `question-api.md` 의 다른 예시엔 줄였다. AI 서버 요청에는 싣지 않는다.
- `origin` — 이 경험이 어디서 왔나(S-48 `P1`). 보통 `null`(자료 분석 · 직접 추가). 확정 답의 새 경험 후보를 저장해 생긴 경험(question-api 「후보를 경험으로 저장」)만 `{ "type": "ANSWER", "questionId", "applicationId", "organization", "questionText" }` — 「내가 쓴 지원서 — 지원처 · 문항」. `type` 은 README 「값 목록」 `experienceOrigin`. `organization` · `questionText` 는 BE 가 응답 때 지금 값으로 채운다(지원처 이름이 없으면 `null`). 그런 경험은 늘 `sourceStatus: USER_ENTERED` 로 시작하고, 고치거나 옮기거나 합쳐도 `origin` 은 그대로다. FE 는 「원문에서 확인」 · 일반 「내가 입력」과 구분해 「내가 쓴 지원서 · <지원처> · <문항>」으로 보인다. **모든 `Experience` 응답에 실린다** — 이 파일 · `question-api.md` 의 다른 예시엔 줄였다(전부 `null`). AI 요청(`/match` · `/draft` · `/ground-check` · `/new-facts`)엔 싣지 않는다 — 그 경험은 `USER_ENTERED` 본문으로 다른 경험과 같이 쓰인다.
- `shared` — 공개 프로필에 넣었나(S-65 `P2`). 새 경험은 늘 `false`(기본은 아무것도 공개되지 않는다). 바꾸는 곳은 `PUT /api/experiences/{id}/shared`([`share-api.md`](share-api.md)) 하나 — 경험 수정 · 옮기기 · 활동 합치기 · `sourceStatus` 변화에도 그대로다. **FE 로 가는 모든 `Experience` 응답에 실린다** — 이 파일 · `question-api.md` 의 다른 예시엔 줄였다. MCP 도구 · AI 서버 요청엔 싣지 않는다.
- `saved` — 사용자가 저장했나(S-71 `P2`). 새 경험은 늘 `false`. 활동 세부 · 경험 찾기의 경험에 싣고 MCP · 공개 프로필 응답에는 싣지 않는다. 바꾸는 곳은 아래 「PUT /api/experiences/{experienceId}/saved」.
- `usedIn` — 쓰인 지원(S-38 `P1`). **활동 세부의 경험에만** 더 붙는다 — 아래 「GET /api/activities/{activityId}」의 「쓰인 지원 `usedIn`」.

근거 `Citation`

```json
{
  "id": 201,
  "sourceId": 12,
  "sourceName": "바꿔요-회고.md",
  "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.",
  "matched": true,
  "location": { "startLine": 5, "endLine": 5, "section": null }
}
```

- 필수는 `sourceId` · `quote`. `location` 은 선택(`null` 가능) — 원본 텍스트 기준 1부터 세는 줄 번호.
- `location.section` — 원본이 PDF · PPTX 일 때 근거가 몇 쪽 · 몇 번째 슬라이드인지(S-39). `{ "kind": "PAGE" | "SLIDE", "from": 2, "to": 3 }` — `from` 은 `startLine` 이, `to` 는 `endLine` 이 든 구간의 번호(한 쪽이면 둘이 같다). **BE 가** 원본의 `sections`(아래 「자료 넣기」)와 줄 번호로 계산해 싣는다 — AI 는 모른다. 원본에 `sections` 가 없거나(`.md` · `.txt` · 붙여넣기) 줄이 어느 구간에도 들지 않으면 `null`. FE 는 「2쪽」 · 「2–3쪽」 · 「슬라이드 4」처럼 보인다. `Citation` 이 실리는 모든 곳(`question-api.md` · `mcp-api.md` 포함)에서 같다.
- `matched` — 발췌문을 원본에서 찾았나(`true` / `false`), 대조하지 않았으면 `null`. AI 결과를 그대로 저장한다.
- 근거는 **사용자가 고치거나 옮겨도 바뀌지 않는다**(S-10 · S-12).

보완 `Supplement` — 스프린트 2 (SPEC R-03)

```json
{
  "id": 301,
  "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?",
  "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다",
  "questionId": 41,
  "mcpChange": null,
  "createdAt": "2026-11-04T10:05:00+09:00",
  "updatedAt": "2026-11-04T10:05:00+09:00"
}
```

- 되묻기 질문과 사용자의 답 한 쌍. 만드는 곳은 `question-api.md` 「POST /api/clarifications/{id}/answer」.
- `mcpChange` — 외부 AI 를 거쳐 들어와 사용자가 아직 정하지 않은 보완(S-56 `P2`). `{ "changeId": 57, "client": "claude-ai" }`, 그 밖엔 `null`. 이 값이 있는 동안은 「내가 입력」이 아니다 — BE 는 AI 서버의 `/match` · `/ask` · `/draft` · `/ground-check` 요청과 근거 대조에서 뺀다. FE 는 「Claude 를 거친 답」과 맞아요 · 되돌리기를 보인다(`mcp-api.md` 「변경 기록」). 맞아요 · 웹에서 답 고치기 뒤엔 `null` 이 된다. **모든 `Supplement` 응답에 실린다** — 다른 예시엔 줄였다.
- `mcpChange` 가 없는 보완은 「내가 입력」이다 — 따로 출처 칸이 없다. 보완이 생기거나 바뀌어도 **경험의 `content` · `citations` · `sourceStatus` 는 그대로**다(원문 사실과 사용자 말을 섞지 않는다 — SPEC 미결정 10). 경험 수정(`PATCH /api/experiences/{id}`)은 보완을 바꾸지 않는다.
- `questionId` — 이 보완이 나온 지원 문항. 문항이 없어지면 `null`(외부 AI 가 만든 지원을 되돌릴 때 — S-55).
- 경험을 지우면 보완도 지워지고, 경험을 옮기거나 활동을 합치면 보완은 경험을 따라간다. 경험을 합치면 남길 경험으로 옮겨진다(S-70).

이어짐 `ActivityLink` — `P1` (SPEC S-35)

```json
{
  "id": 501,
  "fromActivityId": 8,
  "fromActivityName": "알고리즘 스터디",
  "toActivityId": 7,
  "toActivityName": "바꿔요 — 캠퍼스 중고거래 앱",
  "reason": "계기에 적은 「직접 서비스를 만들어 보고 싶어졌다」와 뒤에 시작한 「바꿔요」 앱 만들기가 닿아 보여요",
  "status": "SUGGESTED",
  "createdAt": "2026-11-06T10:00:00+09:00"
}
```

- 「`from` 활동의 계기가 `to` 활동으로 이어졌나」 한 쌍. `from` 은 계기(`note`)가 있는 활동, `to` 는 그보다 뒤에 시작한 활동이다(아래 「이어짐 제안 받기」의 후보 규칙).
- `fromActivityName` · `toActivityName` — 지금 그 활동의 이름(BE 가 응답 때 채운다 — 이름을 고치면 따라 바뀐다). 활동 세부는 어느 쪽에서 열어도 상대 활동 이름을 보일 수 있게 둘 다 싣는다.
- `reason` — 왜 이어져 보이나 한 줄. **AI 해석**이다 — `CONFIRMED` 가 된 뒤에도 AI 가 쓴 글이다(사용자가 확인한 건 「이어졌다」는 것이지 이 문장이 아니다). 고칠 수 없다.
- `status` — README 「값 목록」 `linkStatus`. `SUGGESTED`(AI 제안 — FE 는 「AI 제안」 · 질문 「이 마음이 다음 활동으로 이어졌나요?」 · 「맞아요 / 아니에요」로 보인다) → 사용자가 정하면 `CONFIRMED` 또는 `REJECTED`. 정한 뒤엔 바꿀 수 없다(아래 「이어짐 정하기」).
- 같은 쌍(`fromActivityId` · `toActivityId`)의 이어짐은 상태와 상관없이 **하나뿐**이다 — `REJECTED` 도 지우지 않고 남겨 다시 제안하지 않는 데 쓴다.
- 활동 세부(`GET /api/activities/{id}`)의 `links` 에 실린다. 그 밖의 응답(타임라인 · MCP · 내보내기)엔 없다.

---

## POST /api/sources — 자료 넣기

- 쓰는 곳: FE 자료 넣기
- SPEC: `F-01` / `S-01` · `S-60`(`activityId`, `P2`) · `S-69`(`allowDuplicate`, `P2`)

파일도 같은 JSON 으로 보낸다 — **FE 가 브라우저에서 글자를 뽑아** `text` 에 담는다. BE 는 multipart 를 받지 않고 원본 파일을 받지도 남기지도 않는다(ETC#25 — 지금 계약 · 서버를 그대로 두는 쪽. 원본 보관 · OCR · 대량 처리가 필요해지면 서버 추출로 옮긴다).

- `.md` · `.txt` — `file.text()` 그대로.
- `.pdf` · `.pptx`(S-39) — 쪽 · 슬라이드마다 글자를 뽑아 순서대로 이어 `text` 에 담고, 각 쪽 · 슬라이드가 `text` 의 몇째 줄부터 몇째 줄까지인지 `sections` 에 싣는다. `text` 에 「3쪽」 같은 표시 줄은 넣지 않는다. 글자가 없는 쪽 · 슬라이드는 `text` · `sections` 둘 다에서 뺀다(그래서 `number` 는 건너뛸 수 있다). 글자가 하나도 없으면 보내지 않는다 — S-39.
- PPTX 슬라이드 순서는 `ppt/presentation.xml` 의 슬라이드 목록 순서다(`slideN.xml` 파일 이름 순서가 아니다). 발표자 노트는 넣지 않는다.
- **줄 세기** — `text` 를 `\n` 으로 나눠 1부터 센다. FE 는 `\r\n` · `\r` 을 `\n` 으로 바꾼 **뒤에** `sections` 를 계산하고 그 `text` 를 그대로 보낸다. AI 서버도 `\n` 으로만 줄을 센다(`ai-api.md` `location`) — 그래서 AI 가 준 줄 번호를 BE 가 `sections` 에 그대로 대어 쪽을 찾는다.

요청

```json
{
  "kind": "FILE",
  "name": "바꿔요-회고.md",
  "text": "# 바꿔요 — 캠퍼스 중고거래 앱 회고 (2025년 1학기 캡스톤)\n\n기간: 2025-03 ~ 2025-06, 4명 팀. 나는 백엔드를 맡았다.\n\n- 채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.\n- 팀은 매주 금요일 스프린트 회고를 했다.\n- 배포는 팀원이 맡아 AWS 에 올렸다.\n\n## 알고리즘 스터디\n2024-09 부터 지금까지 매주 문제를 풀고 있다. 내가 문제 선정을 맡는다.\n"
}
```

PDF 를 넣을 때(S-39) — 1쪽은 1 ~ 2줄, 2쪽은 글자가 없어 빠지고, 3쪽은 4 ~ 5줄(3줄은 쪽 사이 빈 줄이라 어느 구간에도 들지 않는다)

```json
{
  "kind": "FILE",
  "name": "이력서-2026.pdf",
  "text": "김차곡 — 백엔드 개발자\n2025 캡스톤 「바꿔요」 백엔드\n\n2024-09 ~ 알고리즘 스터디\n문제 선정을 맡는다",
  "sections": [
    { "kind": "PAGE", "number": 1, "startLine": 1, "endLine": 2 },
    { "kind": "PAGE", "number": 3, "startLine": 4, "endLine": 5 }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `kind` | `TEXT`(붙여넣기) · `FILE`(파일 올리기) |
| `name` | `FILE` 이면 파일 이름(필수, `.md` · `.txt` · `.pdf` · `.pptx` — 대소문자 무시). 폴더 · Notion ZIP 에서 가져오면(S-62 · S-63) 폴더 안 경로(`볼트/활동/바꿔요-회고.md`), GitHub 에서 가져오면(S-64) `owner/repo (GitHub).md` — `/` · 공백이 들어갈 수 있고 BE 는 받은 그대로 남긴다(지금 동작 그대로 — BE 변경 없음). `TEXT` 면 `null` — BE 가 「붙여넣은 텍스트 2026-11-03 14:05」처럼 이름을 붙인다 |
| `text` | 원본 텍스트. 공백만 있으면 안 된다. 최대 길이는 아래 한도 |
| `sections` | `.pdf` · `.pptx` 면 **필수**(1개 이상), 그 밖엔 `null`(빼도 된다). 원소 `{ kind, number, startLine, endLine }` — `kind` 는 `.pdf` 면 `PAGE`, `.pptx` 면 `SLIDE`(README 「값 목록」) · `number` 는 1부터 센 쪽 · 슬라이드 번호 · `startLine` ≤ `endLine` 은 위 「줄 세기」의 줄 번호이고 `text` 의 줄 수를 넘지 않는다. `number` · 줄 둘 다 오름차순이고 구간끼리 겹치지 않는다. BE 는 받은 그대로 원본에 남긴다 |
| `activityId` | 활동 세부의 「자료 더하기」(S-60, `P2`)일 때 그 활동의 `id`, 그 밖엔 `null`(빼도 된다). 아래 「활동에 자료 더하기」 |
| `allowDuplicate` | `true` 면 같은 자료인지 견주지 않고 보통처럼 넣는다 — 사용자가 「그래도 넣기」를 골랐을 때(S-69, `P2`). 그 밖엔 `false` · `null`(빼도 된다). 아래 「같은 자료 알아보기」 |

응답 202 — 원본을 저장하고 분석 작업을 만든 뒤 바로 돌려준다. 분석은 뒤에서 돈다.

```json
{ "sourceId": 12, "jobId": 34, "status": "ANALYZING" }
```

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `UNSUPPORTED_FILE_TYPE` | `FILE` 인데 이름이 `.md` · `.txt` · `.pdf` · `.pptx` 가 아님 |
| 400 | `INVALID_SECTIONS` | `.pdf` · `.pptx` 인데 `sections` 가 없거나 비었음 · `kind` 가 확장자와 안 맞음 · 줄 번호가 `text` 를 벗어나거나 겹치거나 순서가 틀림 · `.md` · `.txt` · `TEXT` 인데 `sections` 가 비지 않음 |
| 400 | `INVALID_REQUEST` | 필드가 없거나 `kind` 값이 틀림 |
| 404 | `ACTIVITY_NOT_FOUND` | `activityId` 가 없는 활동(남의 활동 · 이미 합쳐진 활동 포함) — 원본을 저장하지 않는다 |
| 409 | `SOURCE_DUPLICATE` | 같은 글자의 원본이 이미 있음(S-69, `P2`) — 원본을 저장하지 않고 횟수도 세지 않는다. 아래 「같은 자료 알아보기」 |
| 413 | `TEXT_TOO_LONG` | `text` 가 한도를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 — 원본을 저장하지 않는다([`auth-api.md`](auth-api.md)) |

- 한도: **`50000`자**(BE#5 — README · 회고 몇 개 분량, LLM 한 번에 들어가는 크기). BE 는 Java `String.length()`(UTF-16 단위)로 세므로 JS `text.length` 와 같은 숫자다 — FE 는 같은 숫자로 미리 막아도 된다. AI 서버 한도(코드 포인트 수 50000, `ai-api.md`)보다 크지 않다.
- 같은 자료를 다시 넣으면 먼저 409 `SOURCE_DUPLICATE` 로 묻고(S-69, `P2`), 그래도 넣으면 새 원본 · 새 활동이 생긴다. 자동으로 합치지 않는다(SPEC 미결정 3). 대신 분석 작업은 사용자의 기존 활동 목록을 `/extract` 에 같이 보내고, 같아 보이는 기존 활동이 있으면 새 활동에 `mergeSuggestion` 을 붙인다(S-44, `P1` — 위 「ActivitySummary」).

### 활동에 자료 더하기 — `activityId` (S-60, `P2`)

사용자가 활동 세부에서 그 활동의 자료를 넣었다. 분석 1회 · 상태 · 다시 시도는 보통 자료 넣기와 같고, 다른 점은 셋이다.

1. BE 는 `/extract` 에 `targetActivityId: <activityId>` 를 같이 보낸다(`ai-api.md`). 대상 활동은 `existingActivities` 에 **반드시** 싣는다 — 300개 한도로 잘리는 활동이어도 대상은 넣는다.
2. 응답에서 `sameAsActivityId` 가 대상인 활동은 **새 활동을 만들지 않고** 그 경험 · 근거를 대상 활동에 바로 붙인다 — 결과는 「활동 합치기」(아래 `POST /api/activities/{activityId}/merge`, 남길 활동 = 대상)와 같다: 대상의 이름 · 기간 · 분류 · 계기는 그대로, 붙는 경험은 대상의 경험 뒤에 AI 가 돌려준 순서로. 대상이 미분류면 붙는 활동의 `category` 를 `categoryBy: "AI"` 로 가져온다(합치기와 같은 규칙). `mergeSuggestion` 은 만들지 않는다. 대상을 가리키는 활동이 둘 이상이면 전부 붙인다.
3. 그 밖의 활동은 보통처럼 새 활동이 되고, `sameAsActivityId` 가 대상이 아닌 기존 활동이면 `mergeSuggestion` 이 붙는다(S-44).

작업 상태(`GET /api/jobs/{jobId}`)의 `targetActivityId` · `targetMatched` 로 결과를 알린다. `activityIds` 에는 **새로 생긴** 활동만 싣는다(대상은 넣지 않는다). 분석 중에 대상이 지워지거나 다른 활동에 합쳐졌으면 대상 없이 보통 자료 넣기로 끝내고 `targetMatched: false` 다(붙일 곳을 다른 활동으로 바꾸지 않는다).

### 같은 자료 알아보기 — `SOURCE_DUPLICATE` · `allowDuplicate` (S-69, `P2`)

분석 **전에** 같은 자료인지 본다. AI 를 부르지 않는다. 같으면 원본을 저장하지 않고 분석 횟수도 쓰지 않으며, README 「오류 응답」 모양에 그 원본 `source` 를 더해 돌려준다.

응답 409

```json
{
  "error": {
    "code": "SOURCE_DUPLICATE",
    "message": "이미 넣은 자료입니다",
    "source": { "id": 12, "name": "바꿔요-회고.md", "createdAt": "2026-11-03T14:05:00+09:00" }
  }
}
```

- **같다** = 같은 사용자의 원본 중 해시가 같다. `kind` · `name` · `sections` 는 보지 않는다 — 파일로 넣은 글을 붙여 넣어도 같은 자료다.
- **해시** — BE 가 받은 `text` 로 계산한다: `\r\n` · `\r` 을 `\n` 으로 바꾸고 앞뒤 공백 · 줄바꿈을 뗀 뒤 UTF-8 로 SHA-256. 그 밖의 차이(가운데 공백 · 글자 하나)는 다른 자료다. 비교에만 쓴다 — 저장하는 `text` 는 받은 그대로이고 해시는 응답에 싣지 않는다.
- **무엇과 견주나** — 남아 있는 원본 전부. 어느 길로 들어왔든(묶음 · 자료 더하기 · MCP · 차곡이) 저장할 때 해시를 남긴다. 분석이 실패했거나 경험을 다 지운 원본도 남아 있으면 같은 자료다 — 안내일 뿐이고 「그래도 넣기」로 넘어간다. 같은 원본이 여럿이면 **가장 최근에 넣은 것**을 `source` 에 싣는다.
- **언제 견주나** — `POST /api/sources` 에 `activityId` 가 없을 때만. 자료 더하기(`activityId`) · `POST /api/sources/batch` · 차곡이 · MCP 의 `add_source` 는 견주지 않고 지금처럼 넣는다.
- **순서** — 400 · 404 · 413 검사 뒤, 429 앞. 오늘 횟수를 다 썼어도 같은 자료면 409 가 먼저다.
- **`allowDuplicate: true`** — 견주기만 건너뛴다. 나머지는 보통 자료 넣기와 같다: 분석 1회 · 새 원본 · 새 작업 · 새 활동(S-44 제안은 붙는다).
- FE 는 409 를 오류가 아니라 안내로 보인다 — 「이미 넣은 자료예요」 · `source.name` · `source.createdAt` · 「그래도 넣기 / 그만」. 「그만」이면 입력을 지우지 않는다.

## POST /api/sources/batch — 자료 여러 개 한 번에 넣기 (`P2`)

- 쓰는 곳: FE 자료 넣기에서 파일을 여러 개 골랐을 때
- SPEC: `F-01` / `S-59`

`POST /api/sources` 를 여러 번 부른 것과 같은 원본 · 작업을 한 번에 만든다. 다른 점은 **차례로 돈다**는 것 — 앞 작업이 끝나야(`COMPLETED` · `FAILED`) 다음 작업이 `QUEUED` → `ANALYZING` 이 된다. 그래서 다음 작업이 `/extract` 에 보내는 기존 활동 목록에 앞 파일로 생긴 활동이 들어가고, S-44 제안의 대상이 된다. 기존 활동 목록은 작업이 **시작할 때** 만든다.

요청 — 회고와 README 를 같이 넣는다

```json
{
  "sources": [
    { "kind": "FILE", "name": "바꿔요-회고.md", "text": "# 바꿔요 — 캠퍼스 중고거래 앱 회고 (2025년 1학기 캡스톤)\n…", "sections": null },
    { "kind": "FILE", "name": "README.md", "text": "# 바꿔요\n캠퍼스 중고거래 앱 …", "sections": null }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `sources` | **1 ~ 10개**. 원소는 `POST /api/sources` 요청과 같은 모양 · 같은 규칙(`kind` · `name` · `text` · `sections`). `activityId` 는 받지 않는다 — 실려 오면 400 `INVALID_REQUEST`. 이 순서대로 돈다 |

응답 202 — 원본 · 작업을 전부 만든 뒤 바로 돌려준다. `items` 는 요청 순서 그대로다.

```json
{
  "items": [
    { "sourceId": 12, "jobId": 34, "status": "ANALYZING" },
    { "sourceId": 13, "jobId": 35, "status": "QUEUED" }
  ]
}
```

오류 — **하나라도 틀리면 하나도 넣지 않는다**(원본 · 작업을 만들지 않고 횟수도 세지 않는다). FE 는 못 넣는 파일을 미리 걸러 보내고(S-59), 이 오류는 마지막 막이다.

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `sources` 가 없거나 0개 · 10개 넘음 · 원소에 `activityId` 가 있음 · 원소 필드가 없거나 `kind` 값이 틀림 |
| 400 | `EMPTY_TEXT` · `UNSUPPORTED_FILE_TYPE` · `INVALID_SECTIONS` | 원소 하나가 `POST /api/sources` 의 같은 규칙을 어김 |
| 413 | `TEXT_TOO_LONG` | 원소 하나의 `text` 가 50000자를 넘음(한도는 파일마다 — 합이 아니다) |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 남은 분석 횟수가 `sources` 개수보다 적음 — 하나도 넣지 않는다([`auth-api.md`](auth-api.md)) |

- 원소 오류면 `message` 에 몇째 원소(1부터)인지와 파일 이름을 담는다 — 예: `"2번째 자료(README.md): 텍스트가 50000자를 넘습니다"`.
- 분석 횟수는 **원소마다 1회**로, 요청을 받을 때 한꺼번에 센다(`QUEUED` 로 기다리는 것도 이미 셌다).
- 한 작업이 실패해도 다음 작업은 이어 돈다. 실패한 작업의 다시 시도(`retry`)는 차례를 기다리지 않고 바로 돈다.
- 창을 닫아도 BE 가 차례대로 이어 돌린다. 서버가 다시 켜져 끊긴 작업은 다른 분석 작업과 같이 `FAILED` 로 두고, 그 뒤 `QUEUED` 작업은 다시 차례대로 돈다.
- 같은 자료 알아보기(S-69)는 하지 않는다 — 원소의 `allowDuplicate` 는 무시한다. 넣은 원본의 해시는 남아 다음 `POST /api/sources` 때 견준다.
- 묶음 자체에는 ID 가 없다 — FE 는 `items` 의 `jobId` 들을 들고 각각 `GET /api/jobs/{jobId}` 로 본다.

## GET /api/jobs/{jobId} — 분석 작업 상태

- 쓰는 곳: FE 자료 넣기 뒤 분석 상태
- SPEC: `F-01` / `S-02` · `S-59`(`QUEUED`, `P2`) · `S-60`(`targetActivityId` · `targetMatched`, `P2`)

FE 는 `jobId` 를 들고 있다가(새로고침 대비 주소 · 브라우저 저장소 등은 FE 가 정한다) 끝날 때까지 부른다. 상태는 BE 가 저장하므로 새로고침해도 이어진다.

응답 200 — 분석 중

```json
{
  "jobId": 34,
  "sourceId": 12,
  "status": "ANALYZING",
  "activityIds": [],
  "targetActivityId": null,
  "targetMatched": null,
  "error": null,
  "createdAt": "2026-11-03T14:05:00+09:00",
  "updatedAt": "2026-11-03T14:05:00+09:00"
}
```

응답 200 — 완료

```json
{
  "jobId": 34,
  "sourceId": 12,
  "status": "COMPLETED",
  "activityIds": [7, 8],
  "targetActivityId": null,
  "targetMatched": null,
  "error": null,
  "createdAt": "2026-11-03T14:05:00+09:00",
  "updatedAt": "2026-11-03T14:05:21+09:00"
}
```

- `activityIds` — 이 작업으로 생긴 활동. 완료인데 `[]` 면 자료에서 활동을 찾지 못한 것이다 — 실패가 아니다(「자료에서 확인 안 됨」은 「경험 없음」이 아니다, SPEC §0). 화면에서 어떻게 알릴지는 FE 가 정한다. 「자료 더하기」(S-60)면 대상 활동에 붙은 것은 넣지 않는다 — 새로 생긴 활동만.
- `targetActivityId` — 「자료 더하기」(S-60, `P2`)로 넣었으면 그 활동 `id`, 아니면 `null`. 대상이 지워져도 넣을 때의 값 그대로다.
- `targetMatched` — 「자료 더하기」 결과. `COMPLETED` 이고 `targetActivityId` 가 있을 때만 `true` · `false`, 그 밖엔 `null`. `true` 면 자료 속 활동이 대상에 붙었다(경험이 0개인 활동이 붙었어도 `true`). `false` 면 대상과 같은 활동을 못 찾았거나 분석 중에 대상이 사라졌다 — FE 는 「이 자료에서 이 활동 내용을 찾지 못했어요」를 보이고, `activityIds` 의 새 활동으로 안내한다.

응답 200 — 차례를 기다림(S-59 묶음의 2번째 이후, `P2`). 앞 작업이 끝나면 `ANALYZING` 이 된다. `updatedAt` 은 만든 시각 그대로다.

```json
{
  "jobId": 35,
  "sourceId": 13,
  "status": "QUEUED",
  "activityIds": [],
  "targetActivityId": null,
  "targetMatched": null,
  "error": null,
  "createdAt": "2026-11-03T14:05:00+09:00",
  "updatedAt": "2026-11-03T14:05:00+09:00"
}
```

응답 200 — 실패

```json
{
  "jobId": 34,
  "sourceId": 12,
  "status": "FAILED",
  "activityIds": [],
  "targetActivityId": null,
  "targetMatched": null,
  "error": { "code": "AI_TIMEOUT", "message": "AI 서버가 120초 안에 답하지 않았습니다" },
  "createdAt": "2026-11-03T14:05:00+09:00",
  "updatedAt": "2026-11-03T14:07:00+09:00"
}
```

실패 이유 `error.code` — 어떤 경우에도 정해진 결과로 대신 채우지 않는다(대회 규칙 2).

| `code` | 언제 |
| --- | --- |
| `AI_TIMEOUT` | AI 서버가 BE 의 제한 시간 안에 답하지 않음 |
| `AI_UNAVAILABLE` | AI 서버에 연결하지 못함 |
| `AI_FAILED` | AI 서버가 오류를 돌려줌 — `message` 에 AI 쪽 `code` 를 담는다 |
| `INTERNAL_ERROR` | 그 밖에 BE 안에서 실패(저장 실패 등) |

오류: 404 `JOB_NOT_FOUND` 없는 작업

## POST /api/jobs/{jobId}/retry — 다시 시도

- 쓰는 곳: FE 분석 실패 화면의 「다시 시도」
- SPEC: `F-01` / `S-02`

같은 원본으로 같은 작업을 다시 돌린다(새 작업을 만들지 않는다). 요청 본문 없음.

응답 202 — `GET /api/jobs/{jobId}` 와 같은 모양, `status: "ANALYZING"` · `error: null`.

오류: 404 `JOB_NOT_FOUND` · 409 `JOB_NOT_FAILED` 실패 상태가 아닌 작업(`QUEUED` 포함) · 429 `DAILY_LIMIT_EXCEEDED` 오늘 분석 횟수를 다 씀(다시 시도도 한 번으로 센다)

- 묶음(S-59)의 작업이어도 차례를 기다리지 않고 바로 돈다.
- 「자료 더하기」(S-60) 작업이면 같은 `targetActivityId` 로 다시 돈다. 대상이 그새 사라졌으면 대상 없이 돌고 `targetMatched: false`.

## GET /api/activities — 타임라인용 활동 목록

- 쓰는 곳: FE 타임라인
- SPEC: `F-03` / `S-07`

사용자의 활동 전부. `period.start` 오름차순, `start` 가 `null` 인 활동은 맨 뒤. 연도로 묶기 · 겹침 · 진행 중 표시는 FE 가 `period` 로 한다. 스프린트 1 은 페이지 나누기 없음.

응답 200

```json
{
  "activities": [
    {
      "id": 8,
      "name": "알고리즘 스터디",
      "period": { "start": "2024-09", "end": null, "ongoing": true },
      "experienceCount": 1
    },
    {
      "id": 7,
      "name": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "experienceCount": 4
    }
  ]
}
```

## GET /api/activities/{activityId} — 활동 세부

- 쓰는 곳: FE 타임라인에서 활동을 눌렀을 때 세부
- SPEC: `F-03` / `S-08` · `S-09`

경험은 AI 가 돌려준 순서(옮겨 온 경험은 뒤에). 처음에 몇 개만 보여 줄지는 FE 가 정한다. 경험이 0개인 활동도 있다 — 원본에 활동 이름 · 기간만 있을 때(SPEC S-03 · 이력서 항목 · MOC 링크 목록) 또는 사용자가 다 지웠을 때. 이때 무엇을 보여 줄지(직접 추가 · 자료 더 넣기 안내 등)는 FE 가 정한다.

응답 200

```json
{
  "id": 7,
  "name": "바꿔요 — 캠퍼스 중고거래 앱",
  "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
  "experiences": [
    {
      "id": 101,
      "activityId": 7,
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [
        {
          "id": 201,
          "sourceId": 12,
          "sourceName": "바꿔요-회고.md",
          "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.",
          "matched": true,
          "location": { "startLine": 5, "endLine": 5 }
        }
      ]
    },
    {
      "id": 102,
      "activityId": 7,
      "content": "매주 금요일 스프린트 회고를 했다",
      "competencies": ["COLLABORATION"],
      "actor": "TEAM",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [
        {
          "id": 202,
          "sourceId": 12,
          "sourceName": "바꿔요-회고.md",
          "quote": "팀은 매주 금요일 스프린트 회고를 했다.",
          "matched": true,
          "location": { "startLine": 6, "endLine": 6 }
        }
      ]
    },
    {
      "id": 103,
      "activityId": 7,
      "content": "서비스를 AWS 에 배포했다",
      "competencies": ["IMPLEMENTATION"],
      "actor": "TEAM",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [
        {
          "id": 203,
          "sourceId": 12,
          "sourceName": "바꿔요-회고.md",
          "quote": "배포는 팀원이 맡아 AWS 에 올렸다.",
          "matched": true,
          "location": { "startLine": 7, "endLine": 7 }
        }
      ]
    },
    {
      "id": 104,
      "activityId": 7,
      "content": "백엔드 API 설계를 맡았다",
      "competencies": ["IMPLEMENTATION"],
      "actor": "ME",
      "sourceStatus": "NEEDS_REVIEW",
      "citations": [
        {
          "id": 204,
          "sourceId": 12,
          "sourceName": "바꿔요-회고.md",
          "quote": "나는 백엔드 API 설계를 전부 맡았다.",
          "matched": false,
          "location": null
        }
      ]
    }
  ]
}
```

- 경험 104 처럼 AI 가 단 발췌문이 원본에 없으면 `matched: false` · `NEEDS_REVIEW` 다(S-04).
- `category` · `categoryBy` · `mergeSuggestion` · `note` 도 `ActivitySummary` 와 같이 실린다(S-57 · S-44 · S-34 — 위 예시엔 줄였다).
- `links` — 이 활동이 `from` 이든 `to` 든 걸린 이어짐(`ActivityLink`, S-35 `P1`). **`REJECTED` 는 빼고** `createdAt` 순. 없으면 `[]`. 모든 활동 세부 응답(합치기 응답 포함)에 실린다 — 위 예시엔 줄였다.
- `experiences[].usedIn` — 이 경험이 **쓰인 지원**(S-38 `P1`). 활동 세부 모양의 응답(이 응답 · 활동 합치기 응답)의 경험에만 있다 — 위 예시엔 줄였다. 아래 「쓰인 지원 `usedIn`」.

쓰인 지원 `usedIn` — `P1` (SPEC S-38)

활동 7 세부의 경험 101 — 문항 A(지원 21)와 문항 B(지원 22) 추천에 나왔다(`question-api.md` 예시)

```json
{
  "id": 101,
  "activityId": 7,
  "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
  "…": "…",
  "usedIn": [
    {
      "applicationId": 22,
      "organization": "OO 연합 동아리",
      "applicationStatus": "PASSED",
      "submittedMonth": "2025-02",
      "questions": [{ "id": 42, "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요." }]
    },
    {
      "applicationId": 21,
      "organization": "OO 백엔드 부트캠프",
      "applicationStatus": "SUBMITTED",
      "submittedMonth": "2026-11",
      "questions": [{ "id": 41, "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요." }]
    }
  ]
}
```

- 「쓰였다」 = 그 지원의 어느 문항 `recommendations` 에 이 경험이 **지금** 있다. 보완을 다시 쓴 지원(S-25)도 추천에 있으니 저절로 센다. 초안(S-27)에 고른 경험은 늘 추천 안의 것이라 따로 세지 않는다. 추천이 없는 문항(`ANALYZING` · `FAILED`)은 세지 않는다.
- 배열 하나 = 지원 하나. **개수가 「지원서 N곳에 쓰임」의 N** 이다. 지원은 최근에 넣은 것부터(`Application.createdAt` 내림차순), `questions` 는 그 지원에서 이 경험이 추천된 문항만 지원서 순서로. 없으면 `[]` — FE 는 아무것도 보이지 않는다(재촉하지 않는다).
- `organization` · `applicationStatus` · `submittedMonth` — 그 지원의 지금 값(`question-api.md` 「지원 `Application`」). 상태는 사용자가 붙인 꼬리표다 — 합격률처럼 모아 보이지 않는다.
- 경험을 옮기거나 활동을 합쳐도 따라간다(추천이 경험 ID 를 가리킨다). 경험을 합치면 남길 경험에 모인다(S-70).
- 그 밖의 응답의 `Experience`(추천 · 초안 · MCP · 경험 수정 · 추가 · 옮기기 · 경험 합치기 응답 등)엔 싣지 않는다 — FE 는 활동 세부를 다시 읽어 갱신한다.

예: 활동 8 「알고리즘 스터디」에 계기를 남기고 이어짐을 제안받은 뒤의 세부(경험은 줄임)

```json
{
  "id": 8,
  "name": "알고리즘 스터디",
  "period": { "start": "2024-09", "end": null, "ongoing": true },
  "mergeSuggestion": null,
  "note": "문제만 풀다 보니 직접 서비스를 만들어 보고 싶어졌다",
  "experiences": [ … ],
  "links": [
    {
      "id": 501,
      "fromActivityId": 8,
      "fromActivityName": "알고리즘 스터디",
      "toActivityId": 7,
      "toActivityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "reason": "계기에 적은 「직접 서비스를 만들어 보고 싶어졌다」와 뒤에 시작한 「바꿔요」 앱 만들기가 닿아 보여요",
      "status": "SUGGESTED",
      "createdAt": "2026-11-06T10:00:00+09:00"
    }
  ]
}
```

활동 7 의 세부에도 같은 이어짐 501 이 실린다(`to` 쪽).

오류: 404 `ACTIVITY_NOT_FOUND` 없는 활동(합쳐져 사라진 활동 포함)

## GET /api/experiences — 경험 찾기 (`P1`)

- 쓰는 곳: FE 경험 찾기(검색칸 · 거르기 — 위치는 FE 가 정한다)
- SPEC: `F-03` / `S-58`

사용자의 경험을 낱말로 찾고 거른다. **MCP `search_experiences`(`mcp-api.md`)와 같은 검색**이다 — 낱말 · 역량 · 연도의 규칙과 순서가 같고, BE 는 한 코드로 둘을 돌린다(같은 입력이면 같은 결과). AI 를 부르지 않는다. 한도를 세지 않는다.

쿼리(전부 선택)

| 이름 | 값 |
| --- | --- |
| `query` | 공백으로 나눈 낱말 중 **하나라도** 들어 있는 경험(대소문자 무시, 부분 일치). 찾는 곳: 경험 `content` · 근거 `quote` · 보완 `question` · `answer` · 활동 `name`. 빼거나 빈 문자열이면 낱말로 거르지 않는다 |
| `competencies` | 역량 값을 쉼표로 — `competencies=PROBLEM_SOLVING,COLLABORATION`. 이 중 **하나라도** 붙은 경험(README 「값 목록」) |
| `year` | `YYYY` — 활동 `period` 가 그해와 겹치는 경험. 규칙은 `search_experiences` 의 `year` 와 같다(`start` 가 `null` 인 활동은 빠진다) |
| `sourceStatus` | 값 하나(README 「값 목록」 `sourceStatus`) — 그 출처 상태인 경험. 「확인 필요만 보기」는 `NEEDS_REVIEW` |
| `category` | 값 하나(README 「값 목록」 `activityCategory`) — 그 분류 활동의 경험. 미분류 활동의 경험은 이 값을 주면 빠진다(S-57 「전체」에만) |
| `saved` | `true` — 저장한 경험만(S-71). 빼면 거르지 않는다. MCP `search_experiences` 에는 없는 조건이다 |
| `limit` | 1 ~ 200, 기본 100 |

- 조건은 모두 그리고(AND). 아무것도 안 주면 경험 전부(최대 `limit`).
- 순서: 맞은 낱말 수가 많은 것 → 활동 `period.start` 최근 것(`null` 은 뒤) → 경험 `id` — `search_experiences` 와 같다.

응답 200

```json
{
  "total": 1,
  "experiences": [
    {
      "id": 101,
      "activity": {
        "id": 7,
        "name": "바꿔요 — 캠퍼스 중고거래 앱",
        "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
        "category": "PROJECT"
      },
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
      "competenciesBy": "AI",
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [
        {
          "id": 201,
          "sourceId": 12,
          "sourceName": "바꿔요-회고.md",
          "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.",
          "matched": true,
          "location": { "startLine": 5, "endLine": 5, "section": null }
        }
      ],
      "supplements": [],
      "mcpChange": null,
      "origin": null
    }
  ]
}
```

- 경험 하나는 위 `Experience` 와 같고 `activityId` 대신 `activity`(`id` · `name` · `period` · `category`)를 싣는다. `usedIn`(활동 세부에만)은 싣지 않는다. 경험을 누르면 FE 는 `activity.id` 로 활동 세부를 연다.
- `total` — `limit` 을 적용하기 전 맞은 개수. `total` 이 `experiences` 개수보다 크면 FE 는 「N개 중 M개」와 더 좁히라는 안내를 보인다. 맞은 게 없으면 `{ "total": 0, "experiences": [] }` — 오류가 아니다. FE 는 「쌓인 자료에서 찾지 못했어요」로 보인다(「경험 없음」이 아니다).

오류: 400 `INVALID_REQUEST` — 값 목록 밖의 `competencies` · `sourceStatus` · `category`, `YYYY` 가 아닌 `year`, `true` 가 아닌 `saved`, 범위 밖 `limit`

## PATCH /api/activities/{activityId} — 활동 수정

- 쓰는 곳: FE 활동 세부에서 바로 고치기
- SPEC: `F-04` / `S-10` · `F-03` / `S-57`(분류)

보낸 필드만 바꾼다. `period` 는 세 칸을 통째로 보낸다.

요청

```json
{
  "name": "바꿔요 — 캠퍼스 중고거래 앱 (캡스톤)",
  "period": { "start": "2025-03", "end": "2025-07", "ongoing": false }
}
```

| 필드 | 값 |
| --- | --- |
| `name` | 비지 않은 문자열 |
| `period` | README 「기간」 — 세 칸 통째로 |
| `category` | 활동 분류(S-57, `P1`) — README 「값 목록」 `activityCategory` 또는 `null`(비우기). 비우면 `categoryBy` 도 `null` |
| `note` | 그때의 나(S-34, `P1`) — 문자열 또는 `null`. 앞뒤 공백을 걷은 뒤 **최대 200자**(Java `String.length()`, JS `length` 와 같다) · **줄바꿈(`\n` · `\r`) 없음**. `null` 이나 걷은 뒤 빈 문자열이면 계기를 지운다(`note: null`). **빼면 그대로** — `null` 을 보낸 것과 다르다(BE 는 필드가 왔는지를 가린다) |

계기만 남길 때 — `PATCH /api/activities/8`

```json
{ "note": "문제만 풀다 보니 직접 서비스를 만들어 보고 싶어졌다" }
```

- 계기를 고치거나 지워도 이미 있는 이어짐(`links`)은 그대로다. 계기를 지운 활동에서는 새 제안을 받을 수 없다(409 `NOTE_REQUIRED`).

응답 200 — 바뀐 `ActivitySummary`

```json
{
  "id": 7,
  "name": "바꿔요 — 캠퍼스 중고거래 앱 (캡스톤)",
  "period": { "start": "2025-03", "end": "2025-07", "ongoing": false },
  "experienceCount": 4
}
```

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `name` 이 비었음 · 날짜 형식이 README 「기간」과 다름 · `note` 가 200자를 넘거나 줄바꿈이 있음 · `note` 가 문자열 · `null` 이 아님 · `category` 가 목록에 없음 |
| 400 | `INVALID_PERIOD` | `start` 가 `end` 보다 늦음 · `ongoing: true` 인데 `end` 가 있음 |
| 404 | `ACTIVITY_NOT_FOUND` | 없는 활동 |

## POST /api/activities/{activityId}/actor — 활동의 수행 주체 한 번에 정하기 (`P0`)

- 쓰는 곳: FE 활동 세부(초안 카드는 근거 경험만 — 아래 `PATCH /api/experiences/{experienceId}` 의 `actor`)
- SPEC: `S-76`

요청 `{ "actor": "ME" }` — `ME` · `TEAM`. 그 활동의 `UNKNOWN` 경험만 바꾼다. `sourceStatus` · 본문 · 근거는 그대로다. AI 를 부르지 않고 분석 횟수를 세지 않는다.

응답 200 `{ "changed": 4 }`. 오류: 400 `INVALID_REQUEST`(`UNKNOWN` · 없는 값) · 404 `ACTIVITY_NOT_FOUND`.

## GET /api/sources/{sourceId} — 자료 원문 읽기 (`P1`)

- 쓰는 곳: FE 활동 세부 · 근거의 자료 이름
- SPEC: `S-74`

응답 200 `{ "id": 12, "name": "2024-활동정리.md", "text": "…", "createdAt": "2026-11-05T10:00:00+09:00" }`. `text` 는 저장한 글자 그대로다(근거 `location` 의 줄 번호가 이 글 기준). 내 자료만 읽는다 — 공개 프로필 경로에는 없다. 오류: 404 `SOURCE_NOT_FOUND`(없거나 남의 자료).

## PATCH /api/experiences/{experienceId} — 경험 수정

- 쓰는 곳: FE 활동 세부에서 바로 고치기 · 초안 카드의 주체 확인(S-79 — `actor` 만)
- SPEC: `F-04` / `S-10`

보낸 필드만 바꾼다. **`content` 가 실제로 바뀌었으면 `sourceStatus` 는 `USER_ENTERED`** 가 된다. `actor` · `competencies` 만 바뀌면 `sourceStatus` 와 외부 AI 변경 표시(`mcpChange`)는 그대로다 — 누가 했는지 · 어떤 역량인지 정한 것은 본문을 확인한 것이 아니다(S-10, 2026-11-09). `actor` 가 실제로 바뀌면 그 경험에 「주체를 정한 시각」을 처음 한 번만 남긴다 — 다시 만들기 무료(S-77) · 외부 AI 되돌리기의 「사용자가 손댄 경험」에 쓴다(응답에는 없다). `competencies` 가 실제로 바뀌었으면 **`competenciesBy` 도 `USER`** 가 된다(다른 필드만 바뀌면 그대로). `citations` 는 그대로 남는다 — 이 요청으로 바꿀 수 없다.

요청

```json
{
  "content": "백엔드 API 중 채팅 · 거래 API 를 설계했다",
  "actor": "ME"
}
```

| 필드 | 값 |
| --- | --- |
| `content` | 비지 않은 문자열 |
| `competencies` | 역량 값 배열 — **통째로 바꾼다**(빼면 그대로). `[]` 이면 역량을 지운다. 순서가 다르면 바뀐 것으로 본다 |
| `actor` | `ME` · `TEAM` · `UNKNOWN` |

응답 200 — 바뀐 `Experience`. 아래는 본문 · 수행 주체만 고친 예라 `competenciesBy` 는 `AI` 그대로다

```json
{
  "id": 104,
  "activityId": 7,
  "content": "백엔드 API 중 채팅 · 거래 API 를 설계했다",
  "competencies": ["IMPLEMENTATION"],
  "competenciesBy": "AI",
  "actor": "ME",
  "sourceStatus": "USER_ENTERED",
  "citations": [
    {
      "id": 204,
      "sourceId": 12,
      "sourceName": "바꿔요-회고.md",
      "quote": "나는 백엔드 API 설계를 전부 맡았다.",
      "matched": false,
      "location": null
    }
  ]
}
```

오류: 400 `INVALID_REQUEST` 빈 `content` · 틀린 `actor` 값 · `competencies` 가 목록 밖 값 · 중복 · 4개 이상 · `null` · 404 `EXPERIENCE_NOT_FOUND`

## PUT /api/experiences/{experienceId}/saved — 경험 저장 · 빼기 (`P2`)

- 쓰는 곳: FE 활동 세부의 경험 · 경험 찾기 결과 줄
- SPEC: `F-03` / `S-71`

경험 수정(`PATCH /api/experiences/{id}`)과 따로 둔다 — 그 요청은 값이 바뀌면 `sourceStatus` 를 `USER_ENTERED` 로 바꾸지만, 저장은 내용을 고친 게 아니다. `shared`(share-api)와 같은 모양이다.

요청

```json
{ "saved": true }
```

| 필드 | 값 |
| --- | --- |
| `saved` | `true`(저장) · `false`(빼기). 필수. 이미 그 값이면 아무것도 바꾸지 않고 200 |

응답 200 — 바뀐 `Experience`.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `saved` 가 없거나 불리언이 아님 |
| 404 | `EXPERIENCE_NOT_FOUND` | 없는 경험 |

- `saved` 는 **웹에서 사용자만** 바꾼다 — 외부 AI · 차곡이의 쓰기 도구로 바꿀 수 없고, 분석 작업 수 · 하루 한도와 상관없다.
- 경험을 옮기거나 활동을 합쳐도 그대로다. 경험을 합치면(`POST /api/experiences/{keepId}/merge`) 둘 중 하나라도 `true` 면 남길 경험이 `true` 다.

## POST /api/activities/{activityId}/experiences — 경험 직접 추가

- 쓰는 곳: FE 활동 세부의 「경험 직접 추가」
- SPEC: `F-04` / `S-11`

사용자가 활동에 경험을 직접 적어 넣는다. **`sourceStatus` 는 `USER_ENTERED`, `competenciesBy` 는 `USER`, `citations` 는 `[]`, `shared` 는 `false`** — BE 가 붙인다(근거 없는 AI 경험의 `NEEDS_REVIEW` 와 다르다). 활동의 경험 맨 뒤에 붙는다.

요청 — `POST /api/activities/7/experiences`

```json
{ "content": "결제 실패 알림을 슬랙으로 받게 붙였다", "competencies": [], "actor": "ME" }
```

| 필드 | 값 |
| --- | --- |
| `content` | 비지 않은 문자열(필수) |
| `competencies` | 역량 값 배열(선택 — 빼면 `[]`) |
| `actor` | `ME` · `TEAM` · `UNKNOWN`(필수 — 화면에서 미리 고를 값은 FE 가 정한다) |

응답 201 — 만든 `Experience`

```json
{
  "id": 107,
  "activityId": 7,
  "content": "결제 실패 알림을 슬랙으로 받게 붙였다",
  "competencies": [],
  "competenciesBy": "USER",
  "actor": "ME",
  "sourceStatus": "USER_ENTERED",
  "citations": []
}
```

오류: 400 `INVALID_REQUEST` 빈 `content` · 틀린 `actor` 값 · `competencies` 가 목록 밖 값 · 중복 · 4개 이상 · `null` · 404 `ACTIVITY_NOT_FOUND`

## DELETE /api/experiences/{experienceId} — 경험 지우기

- 쓰는 곳: FE 활동 세부의 경험 메뉴 「지우기」
- SPEC: `F-04` / `S-11`

경험과 그 경험의 근거 · 보완을 지운다. **원본은 남는다**(다른 경험의 근거일 수 있다). 경험이 다 빠진 활동도 남는다 — 없애려면 합치기를 쓴다. 요청 본문 없음.

응답 204 — 본문 없음

오류: 404 `EXPERIENCE_NOT_FOUND`

- 지운 것을 되살리는 API 는 없다. 화면에서 「되돌리기」를 보여 주려면 FE 가 알림이 닫힐 때까지 요청을 늦춘다(기본값).

## POST /api/experiences/{experienceId}/move — 경험 옮기기 (`P1`)

- 쓰는 곳: FE 활동 세부 — 끌어다 놓기 · 메뉴
- SPEC: `F-04` / `S-12`

경험이 속한 활동만 바꾼다. **내용 · 근거 · 출처 상태는 그대로**다(묶음을 바꾼 것이지 내용을 고친 게 아니다). 경험이 다 빠진 활동도 남는다 — 지우려면 합치기를 쓴다.

요청

```json
{ "toActivityId": 8 }
```

응답 200 — 옮긴 `Experience`(`activityId` 만 바뀜). 이미 그 활동에 있으면 아무것도 바꾸지 않고 200.

```json
{
  "id": 102,
  "activityId": 8,
  "content": "매주 금요일 스프린트 회고를 했다",
  "competencies": ["COLLABORATION"],
  "actor": "TEAM",
  "sourceStatus": "SOURCE_CONFIRMED",
  "citations": [
    {
      "id": 202,
      "sourceId": 12,
      "sourceName": "바꿔요-회고.md",
      "quote": "팀은 매주 금요일 스프린트 회고를 했다.",
      "matched": true,
      "location": { "startLine": 6, "endLine": 6 }
    }
  ]
}
```

오류: 400 `INVALID_REQUEST` `toActivityId` 없음 · 404 `EXPERIENCE_NOT_FOUND` · 404 `ACTIVITY_NOT_FOUND` 옮길 활동이 없음

## POST /api/experiences/{keepId}/merge — 경험 합치기 (`P2`)

- 쓰는 곳: FE 활동 세부의 「하나로 합치기」
- SPEC: `F-04` / `S-70`

주소의 `keepId` 가 **남길 경험**이다. `fromExperienceId` 의 근거 · 보완을 남길 경험으로 옮기고, 그 경험을 가리키던 것을 남길 경험으로 바꾼 뒤 `fromExperienceId` 경험을 지운다 — 한 번에(중간에 실패하면 아무것도 바뀌지 않는다). AI 를 부르지 않는다. 되돌리는 API 는 없다(활동 합치기와 같다) — FE 는 합치기 전에 알린다.

예: 회고에서 나온 경험 101 과 README 에서 나온 경험 105 가 같은 일을 말해, 105 를 101 에 합친다.

요청 — `POST /api/experiences/101/merge`

```json
{ "fromExperienceId": 105 }
```

응답 200 — 합친 `Experience`. 남길 경험의 값은 그대로이고 `citations` · `supplements` 만 늘어난다.

```json
{
  "id": 101,
  "activityId": 7,
  "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
  "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
  "competenciesBy": "AI",
  "actor": "ME",
  "sourceStatus": "SOURCE_CONFIRMED",
  "citations": [
    {
      "id": 201,
      "sourceId": 12,
      "sourceName": "바꿔요-회고.md",
      "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.",
      "matched": true,
      "location": { "startLine": 5, "endLine": 5 }
    },
    {
      "id": 205,
      "sourceId": 13,
      "sourceName": "README.md",
      "quote": "채팅은 3초 폴링을 걷어 내고 WebSocket 으로 옮겼다.",
      "matched": true,
      "location": { "startLine": 12, "endLine": 12 }
    }
  ],
  "supplements": []
}
```

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `fromExperienceId` 없음 · 남길 경험과 같음 · 두 경험의 활동이 다름(먼저 옮긴다 — 위 「경험 옮기기」) |
| 404 | `EXPERIENCE_NOT_FOUND` | 둘 중 하나가 없음(남의 경험 · 이미 합쳐진 경험 포함) |

- **남길 경험의 값은 그대로** — `content` · `competencies` · `competenciesBy` · `actor` · `sourceStatus` · `origin` · `mcpChange`. 지울 경험의 값을 섞지 않는다.
- **근거 · 보완은 하나도 잃지 않는다** — `id` · 내용 그대로 남길 경험의 것이 된다(추천 · 초안의 `evidence` 가 이 `id` 를 가리키므로 새로 만들지 않는다). 순서는 지금 규칙 그대로 만든 순서(`id`)다. 같은 내용의 근거가 둘이어도 줄이지 않는다. 원본은 그대로다.
- **가리키던 것은 남길 경험으로 바꾼다** — 끊으면 쓰인 지원 · 확정 답변의 연결이 사라진다. 같은 트랜잭션에서 아래를 전부.

| 무엇 | BE 자리 |
| --- | --- |
| 지원 추천 · 요구사항 | `question_recommendation.experience_id` · `question_requirement.experience_ids` |
| 되묻기 | `clarification.experience_id` |
| 초안에 고른 경험 · 빠진 사실 | `draft_experience.experience_id` · `draft_omitted.experience_id` |
| 초안 · 근거 점검의 문장 근거(`type` 이 `EXPERIENCE`) | `draft_sentence_evidence.ref_id` · `grounding_sentence_evidence.ref_id` |
| 확정 답변의 새 경험 후보 | `new_fact_candidate.experience_id` |

- **둘이 같이 있으면 하나로** — 한 문항의 추천에 두 경험이 다 있으면 앞 순위 추천 하나만 남긴다(그 `reason` · `emphasis` · `gaps` · `evidence` 그대로, 뒤 추천은 지운다). 요구사항의 `experience_ids` · 초안에 고른 경험 · 한 문장의 근거도 앞의 것 하나로 줄인다. 되묻기는 줄이지 않는다.
- `usedIn`(S-38): 추천을 따라 남길 경험에 모인다. 응답엔 싣지 않는다 — FE 는 활동 세부를 다시 읽어 갱신한다.
- `mcpChange`(S-53): 지울 경험에 달린 정하지 않은 변경은 경험을 지웠을 때와 같다(`CHANGED_AFTER` — `mcp-api.md` 「변경 기록」). 보완에 달린 것은 보완을 따라간다.
- 합치는 사이 분석 중이던 매칭 · 초안 · 근거 점검이 끝나 지울 경험을 돌려주면, 지운 경험과 같이 조회할 때 뺀다.

## POST /api/activities/{activityId}/merge — 활동 합치기 (`P1`)

- 쓰는 곳: FE 타임라인 · 활동 세부의 합치기
- SPEC: `F-04` / `S-13`

주소의 `activityId` 가 **남길 활동**이다. `fromActivityId` 의 경험을 전부 남길 활동으로 옮기고 `fromActivityId` 활동을 지운다 — 한 번에(중간에 실패하면 아무것도 바뀌지 않는다). 경험 · 근거는 옮기기와 같이 그대로이고, 남길 활동의 이름 · 기간도 그대로다(바꾸려면 활동 수정).

예: AI 가 배포 경험 103 을 「바꿔요 배포」(활동 9)로 따로 떼어 냈을 때, 9 를 7 에 합친다.

요청 — `POST /api/activities/7/merge`

```json
{ "fromActivityId": 9 }
```

응답 200 — 남은 활동의 세부(`GET /api/activities/{activityId}` 와 같은 모양). 9 에서 온 경험은 7 의 경험 뒤에 붙는다.

```json
{
  "id": 7,
  "name": "바꿔요 — 캠퍼스 중고거래 앱",
  "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
  "experiences": [
    {
      "id": 101, "activityId": 7,
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"], "actor": "ME", "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 201, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.", "matched": true, "location": { "startLine": 5, "endLine": 5 } }]
    },
    {
      "id": 102, "activityId": 7,
      "content": "매주 금요일 스프린트 회고를 했다",
      "competencies": ["COLLABORATION"], "actor": "TEAM", "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 202, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "팀은 매주 금요일 스프린트 회고를 했다.", "matched": true, "location": { "startLine": 6, "endLine": 6 } }]
    },
    {
      "id": 104, "activityId": 7,
      "content": "백엔드 API 설계를 맡았다",
      "competencies": ["IMPLEMENTATION"], "actor": "ME", "sourceStatus": "NEEDS_REVIEW",
      "citations": [{ "id": 204, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "나는 백엔드 API 설계를 전부 맡았다.", "matched": false, "location": null }]
    },
    {
      "id": 103, "activityId": 7,
      "content": "서비스를 AWS 에 배포했다",
      "competencies": ["IMPLEMENTATION"], "actor": "TEAM", "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 203, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "배포는 팀원이 맡아 AWS 에 올렸다.", "matched": true, "location": { "startLine": 7, "endLine": 7 } }]
    }
  ]
}
```

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `fromActivityId` 없음 |
| 400 | `SAME_ACTIVITY` | `fromActivityId` 가 남길 활동과 같음 |
| 404 | `ACTIVITY_NOT_FOUND` | 둘 중 하나가 없음(이미 합쳐진 활동 포함) |

- `mergeSuggestion`(S-44): `fromActivityId` 활동이 사라지므로 그 제안도 사라진다. 사라진 활동을 가리키던 다른 활동의 제안은 `null` 이 된다. 남길 활동의 제안은 그대로다(같은 트랜잭션에서).
- S-44 의 「붙이기」도 이 요청이다 — 남길 활동 = `mergeSuggestion.activityId`(기존), `fromActivityId` = 제안이 붙은 새 활동. 다른 방향(새 활동을 남기기)으로 합쳐도 막지 않는다.
- `category`(S-57): 남길 활동의 분류가 그대로 남는다. 남길 활동이 미분류고 `fromActivityId` 에 분류가 있으면 `category` · `categoryBy` 를 같이 옮겨 온다.
- `note`(S-34): 남길 활동의 계기가 그대로 남는다. 남길 활동에 계기가 없고 `fromActivityId` 에 있으면 그것을 옮겨 온다(계기를 잃지 않게). 둘을 이어 붙이지 않는다.
- `links`(S-35): `fromActivityId` 에 걸린 이어짐은 남길 활동으로 옮긴다(같은 트랜잭션에서). 옮긴 뒤 자기 자신을 가리키면(`from` = `to`) 지운다. 같은 쌍이 둘이 되면 하나만 남긴다 — `REJECTED` 가 있으면 그것(다시 제안하지 않게), 없으면 `CONFIRMED`, 그다음 먼저 생긴 것.

## DELETE /api/activities/{activityId}/merge-suggestion — 같은 활동 제안 따로 두기 (`P1`)

- 쓰는 곳: FE 활동 세부 · 분석 완료 뒤의 「따로 두기」
- SPEC: `F-04` / `S-44`

그 활동의 `mergeSuggestion` 을 `null` 로 둔다. 다시 생기지 않는다. 두 활동은 그대로다. 요청 본문 없음.

응답 204 — 본문 없음. 제안이 이미 없어도 204(두 번 눌러도 같다).

오류: 404 `ACTIVITY_NOT_FOUND`

---

## POST /api/activities/{activityId}/link-suggestions — 이어짐 제안 받기 (`P1`)

- 쓰는 곳: FE 활동 세부(계기가 있는 활동)의 「이어진 활동 찾아보기」
- SPEC: `F-13` / `S-35`

사용자가 누를 때만 부른다(자동 · 백그라운드 없음). BE 가 후보를 고르고 AI(`ai-api.md` 「POST /link-suggestions」)에 물어, 받은 제안을 `SUGGESTED` 이어짐으로 저장한 뒤 **새로 생긴 것만** 돌려준다. **동기** 호출이다 — 작업 · 폴링 없음(입력이 활동 20개 이하라 짧다). 요청 본문 없음.

후보 고르기 — BE 가 한다(AI 는 받은 후보 안에서만 고른다)

1. 이 활동(`from`)의 `period.start` 가 `null` 이면 후보는 없다.
2. 그 사용자의 다른 활동 중 `period.start` 가 `from` 의 `start` 와 **같거나 뒤**인 것(README 「기간」 — 문자열 비교). `start` 가 `null` 인 활동은 뺀다.
3. `from` 과 이미 이어짐이 있는 쌍은 **상태와 상관없이** 뺀다(이 활동이 `from` 이든 `to` 든) — `REJECTED` 를 다시 제안하지 않고, `SUGGESTED` · `CONFIRMED` 를 겹쳐 만들지 않는다.
4. `start` 가 `from` 에 가까운 순(같으면 `id` 순)으로 **최대 20개**.

AI 에 싣는 것: 활동마다 `id` · 이름 · 기간 · 계기(`note`, 후보는 없으면 `null`) · 경험 본문(`content`)만. 근거 발췌문 · 보완은 싣지 않는다.

응답 200 — 새로 생긴 이어짐(`ActivityLink`, 전부 `SUGGESTED`) 0 ~ 3개, AI 가 준 순서

```json
{
  "links": [
    {
      "id": 501,
      "fromActivityId": 8,
      "fromActivityName": "알고리즘 스터디",
      "toActivityId": 7,
      "toActivityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "reason": "계기에 적은 「직접 서비스를 만들어 보고 싶어졌다」와 뒤에 시작한 「바꿔요」 앱 만들기가 닿아 보여요",
      "status": "SUGGESTED",
      "createdAt": "2026-11-06T10:00:00+09:00"
    }
  ]
}
```

- **후보가 0개**면 AI 를 부르지 않고 200 `{ "links": [] }` — 분석 횟수도 세지 않는다. AI 가 이어진 활동을 못 찾아도 200 `[]` 다(실패가 아니다 — 날짜 순서만으로 억지로 잇지 않는다, S-35). FE 는 「이어져 보이는 활동을 찾지 못했어요」처럼 보인다.
- AI 응답을 저장하기 전에 BE 가 다시 확인한다: `toActivityId` 가 보낸 후보 안에 있나 · 중복 없나 · 3개 이하인가. 어기면 **아무것도 저장하지 않고** 502 `AI_FAILED`. 그새 같은 쌍이 생겼으면(두 번 눌렀을 때) 그 제안만 건너뛴다.
- 다시 누르면 다시 AI 를 부른다(분석 1회). 이미 있는 쌍은 후보에서 빠지므로 같은 제안이 겹치지 않는다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 404 | `ACTIVITY_NOT_FOUND` | 없는 활동 |
| 409 | `NOTE_REQUIRED` | 이 활동에 계기(`note`)가 없음 — 계기가 이어짐의 출발점이다 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 — AI 를 부를 때 1회로 센다([`auth-api.md`](auth-api.md)). 후보가 0개면 세지 않는다 |
| 502 | `AI_FAILED` | AI 서버가 오류를 돌려줌(`message` 에 AI 쪽 `code`) · 연결하지 못함 · 응답이 위 확인을 어김 |
| 504 | `AI_TIMEOUT` | `AI_SYNC_TIMEOUT_SECONDS`(기본 60초) 안에 답이 없음 — entrance-api 와 같다 |

- 실패하면 아무것도 저장하지 않는다. FE 는 오류와 「다시 시도」를 보인다 — 정해진 이어짐으로 대신 채우지 않는다(대회 규칙 2). 실패도 분석 1회로 센다(auth-api — 이미 LLM 을 불렀을 수 있다).

## PATCH /api/activity-links/{linkId} — 이어짐 정하기 (`P1`)

- 쓰는 곳: FE 활동 세부의 이어짐 제안 「맞아요 / 아니에요」
- SPEC: `F-13` / `S-35`

`SUGGESTED` 이어짐을 사용자가 정한다. 「from 활동 세부」 · 「to 활동 세부」 어느 쪽에서 눌러도 같다.

요청

```json
{ "status": "CONFIRMED" }
```

| 필드 | 값 |
| --- | --- |
| `status` | `CONFIRMED`(맞아요) · `REJECTED`(아니에요). `SUGGESTED` 로 되돌릴 수 없다 |

응답 200 — 바뀐 `ActivityLink`. `REJECTED` 도 돌려준다(FE 는 화면에서 뺀다 — 다음 세부 응답의 `links` 엔 없다).

- 이미 같은 상태면 아무것도 바꾸지 않고 200(두 번 눌러도 같다).
- 이미 정한 이어짐을 **다른** 상태로 바꾸면 409 — `CONFIRMED` 되돌리기 · 「아니에요」 취소는 이 계약에 없다(범위 제외).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `status` 가 없거나 `CONFIRMED` · `REJECTED` 가 아님 |
| 404 | `LINK_NOT_FOUND` | 없는 이어짐(다른 사용자의 것 · 합치기로 지워진 것 포함) |
| 409 | `LINK_ALREADY_DECIDED` | 이미 `CONFIRMED` · `REJECTED` 인데 다른 상태를 보냄 |

---

## PATCH /api/supplements/{supplementId} — 보완 고치기 (`P1`)

- 쓰는 곳: FE 활동 세부의 보완 바로 고치기
- SPEC: `F-07` / `S-24`

답만 고친다(질문은 되묻기 그대로). `updatedAt` 이 바뀐다. 경험의 출처 상태는 그대로다. 외부 AI 를 거친 답을 고치면 사용자 말이 된다 — `mcpChange` 가 `null` 이 되고 그 변경은 `CHANGED_AFTER` 로 남는다(S-56).

요청

```json
{ "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 폴링 코드를 구독 방식으로 바꿨다. 재연결도 붙였다" }
```

응답 200 — 바뀐 `Supplement`

오류: 400 `EMPTY_ANSWER` 빈 `answer` · 400 `INVALID_REQUEST` `answer` 없음 · 2000자 넘음 · 404 `SUPPLEMENT_NOT_FOUND`

## DELETE /api/supplements/{supplementId} — 보완 지우기 (`P1`)

- 쓰는 곳: FE 활동 세부의 보완 지우기
- SPEC: `F-07` / `S-24`

보완을 지운다. 다음 추천부터 AI 후보에 실리지 않고, 이미 끝난 추천의 `evidence` 에서도 빠진다. 그 보완을 만든 되묻기는 `supplementId: null` 로 돌아간다(다시 답할 수 있다). 요청 본문 없음.

응답 204 — 본문 없음

오류: 404 `SUPPLEMENT_NOT_FOUND`

---

## 이 계약에 없는 것

- 원본 목록 · 원본 다시 보기 — 근거에 `sourceName` · `quote` 가 실려 오므로 스프린트 1 엔 따로 두지 않는다
- 자료 빼기(원본을 지우면 그 원본에서만 나온 경험을 어떻게 하나) — 백로그
- 바뀐 부분만 다시 분석 · 다른 사용자의 같은 자료 알아보기 · 묶음 · 자료 더하기 · 차곡이 · MCP 에서 같은 자료 알아보기(S-69 범위 제외, ETC#114 큰 판)
- 경험 셋 이상을 한 번에 합치기 · 다른 활동의 경험끼리 합치기 · 합치기 되돌리기 · AI 가 겹치는 경험 찾기(S-70 범위 제외)
- 묶음으로 「자료 더하기」(`sources[].activityId`) · 묶음 전체의 ID · 묶음 그만두기 — 자료 더하기는 하나씩, 묶음은 작업마다 본다(S-59 · S-60)
- 이어짐을 사용자가 직접 긋기 · 고치기 · 지우기 · 정한 것 되돌리기(S-35 범위 제외) · 타임라인 목록(`GET /api/activities`)에 이어짐 싣기 — 보이는 곳은 활동 세부다
- 계기를 여러 개 · 목록으로 — 활동마다 한 줄 하나다. 미결정 14 (나)(확정 답변의 동기 → 생각 · 계기)가 시작되면 배열로 바꾸는 계약 PR 을 낸다
- 뒤 활동의 계기에서 앞 활동을 찾는 반대 방향 제안 — 계기가 있는 활동 → 뒤 활동만
- 계기 · 이어짐을 MCP(`get_activity`) · Markdown 내보내기(S-33)에 싣기
- 분류로 거르는 쿼리 — `GET /api/activities` 가 활동 전부를 주므로 FE 가 받은 목록에서 거른다(S-57). 분류를 더하기 · 이름 바꾸기 · MCP · 내보내기에 싣기
