# question-api — FE → BE

> 스프린트 2 「문항 매칭」(SPEC R-03). 이름 규칙 · 값 목록 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> 경험 · 근거 · 보완의 모양은 [`experience-api.md`](experience-api.md), BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /match」.
> 예시는 스프린트 1 예시(「바꿔요」 · 경험 101 ~ 104 · 근거 201 ~ 204)를 잇는다 — 문항 A(기술 문제 해결)에서 되묻기에 답한 보완 301 이 문항 B(역할 · 협업)에서 근거로 다시 쓰인다(S-25).
> 지원 기록(SPEC R-05 F-14 `P1` — 지원 상태 `applicationStatus` · 낸 달 `submittedMonth`, S-36 · S-37). 경험마다 쓰인 지원(S-38)은 `experience-api.md` 「GET /api/activities/{activityId}」의 `usedIn`.

## 흐름

```
FE ─POST /api/applications──────────▶ BE  지원 + 문항 여러 개 저장 · 문항마다 추천 시작 → 202 { applicationId, questionIds }
FE ─POST /api/applications/{id}/questions ▶ BE  그 지원에 문항 더하기 → 202 { questionId }
FE ─GET /api/applications───────────▶ BE  넣었던 지원 목록(문항 요약 포함)
FE ─POST /api/questions─────────────▶ BE  (문항 하나짜리 지원) 문항 저장 · 추천 시작 → 202 { questionId, applicationId }
                                       BE ─POST /match──▶ AI  (문항 + 사용자 경험 전부 + 보완)
FE ─GET /api/questions/{id} (폴링)───▶ BE  ANALYZING → COMPLETED(요구사항 · 추천 · 되묻기) / FAILED
FE ─POST /api/clarifications/{id}/answer ▶ BE  답 → 그 경험의 보완
FE ─GET /api/questions──────────────▶ BE  넣었던 문항 목록(「내가 넣었던 문항」 다시 고르기 — S-40)
FE ─PATCH /api/applications/{id}────▶ BE  지원처 종류 · 직무 바꾸기(S-42) · 지원 상태 · 낸 달 바꾸기(S-36)
FE ─PATCH /api/questions/{id}───────▶ BE  문항 유형 고치기(S-41)
FE ─POST /api/questions/{id}/grounding-check ▶ BE  내가 쓴 답 근거 점검 시작(S-45) → 202
                                       BE ─POST /ground-check──▶ AI  (답 + 사용자 경험 전부 + 보완)
FE ─GET /api/questions/{id}/grounding-check (폴링) ▶ BE  ANALYZING → COMPLETED(문장마다 판정) / FAILED
FE ─POST /api/questions/{id}/draft──▶ BE  고른 경험 1 ~ 3개로 답변 초안 시작(S-27) → 202
                                       BE ─POST /draft──▶ AI  (문항 + 고른 경험만 + 보완)
FE ─GET /api/questions/{id} (폴링)───▶ BE  draft: ANALYZING → COMPLETED(문장마다 근거 · 쓰지 않은 것) / FAILED
FE ─POST /api/clarifications/{id}/answer ▶ BE  초안 omitted의 clarificationId로 답 → 그 경험의 보완
FE ─POST /api/questions/{id}/draft──▶ BE  사용자가 다시 만들기를 누르면 최신 보완으로 재생성
```

- **지원**(SPEC R-03 용어 · 2026-11-03 PM) = 지원처 하나 + 문항 여러 개. 문항은 늘 어느 지원에 딸린다(`applicationId`). 추천은 지금처럼 **문항마다 따로** 돈다 — AI 는 문항 사이를 같이 보지 않는다(SPEC 미결정 15). 한 지원 안에서 같은 경험이 여러 문항에 추천됐는지는 FE 가 문항들의 `recommendations` 로 계산해 표시한다(S-21).
- 문항 하나 = 추천 작업 하나다. 상태(`status` · `error`)는 문항에 붙는다 — `/api/jobs` 를 쓰지 않는다. 폴링 간격은 자료 넣기와 같이 FE 가 정한다.
- 추천은 **문항을 넣을 때 한 번** 돈다. 되묻기에 답해도 저절로 다시 돌지 않는다(AI#21 기본값). 보완을 반영한 추천을 보려면 새 문항을 넣는다 — 그게 데모 6 이다.

## 모양

문항 요약 `QuestionSummary`

```json
{
  "id": 41,
  "applicationId": 21,
  "organization": "OO 백엔드 부트캠프",
  "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.",
  "questionType": "PROBLEM_SOLVING",
  "questionTypeBy": "AI",
  "status": "COMPLETED",
  "createdAt": "2026-11-04T10:00:00+09:00"
}
```

- `applicationId` — 이 문항이 딸린 지원.
- `organization` — 지원처 이름(그 지원의 것). 선택이라 `null` 일 수 있다.
- `status` — README 「값 목록」 작업 상태(`ANALYZING` · `COMPLETED` · `FAILED`).
- `questionType` — README 「값 목록」 문항 유형 하나(S-41). 매칭이 끝나면 AI 가 붙인다(`/match` 응답의 `questionType`). 아직 없으면(`ANALYZING` · `FAILED`, 사용자가 고르지 않음) `null`.
- `questionTypeBy` — `AI`(매칭이 붙인 해석 — FE 는 AI 해석으로 보인다) · `USER`(사용자가 `PATCH` 로 골랐다). `questionType` 이 `null` 이면 `null`. **`USER` 면 다시 시도 · 매칭 결과가 덮어쓰지 않는다.**

요구사항 `Requirement` — AI 가 문항을 쪼갠 「이 지원처가 보려는 것」 하나(SPEC R-03 용어)

```json
{ "text": "기술 문제의 원인을 찾아 해결한 경험", "status": "SUPPORTED", "experienceIds": [101] }
```

- `status` — README 「값 목록」 `requirementStatus`. `NOT_FOUND` 는 「자료에서 확인 안 됨」이지 「경험 없음」이 아니다 — 화면에서 부족한 사람처럼 보이지 않게(SPEC S-19).
- `experienceIds` — 이 요구사항을 받치는 경험. `NOT_FOUND` 면 `[]`. 그새 지워진 경험은 빠진다.

추천 `Recommendation`

```json
{
  "activity": { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
  "experience": { "id": 101, "activityId": 7, "content": "…", "competencies": [], "actor": "ME", "sourceStatus": "SOURCE_CONFIRMED", "citations": [], "supplements": [] },
  "reason": "채팅 지연이라는 기술 문제를 직접 해결한 사례라 문항과 맞는다",
  "emphasis": "폴링의 한계를 보고 WebSocket 으로 바꾼 판단",
  "evidence": [{ "type": "CITATION", "id": 201 }],
  "gaps": ["직접 고친 범위가 자료에 없다", "고친 뒤 확인한 방법이 자료에 없다"]
}
```

- `experience` — `experience-api.md` 「Experience」 그대로, **지금 상태로**(문항을 넣은 뒤 고쳤으면 고친 내용). `activity` 는 그 경험이 지금 속한 활동(옮겨졌으면 옮긴 곳).
- `reason` · `emphasis` · `gaps` — **AI 해석**이다. FE 는 원문 근거와 섞이지 않게 보인다(SPEC S-20 · DESIGN). `gaps` 는 0개일 수 있다.
- `evidence` — 이 추천을 받치는 것. `type` 은 `evidenceType` 값, `id` 는 같은 `experience` 의 `citations[].id`(`CITATION`) 또는 `supplements[].id`(`SUPPLEMENT`). 그새 지워진 보완은 빠진다. 0개일 수 있다(근거 없이 직접 넣은 경험).
- 순서는 AI 가 돌려준 순서(더 잘 맞는 것부터). 경험이 그새 지워졌으면 그 추천은 빠진다.

되묻기 `Clarification`

```json
{ "id": 61, "experienceId": 101, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "supplementId": null }
```

- `experienceId` — 이 질문이 묻는 경험. 늘 이 문항 `recommendations` 의 경험 중 하나다.
- `supplementId` — 답했으면 그 보완의 ID(`experience.supplements[]` 에 있다), 아직이면 `null`. 건너뛰기는 서버에 아무것도 보내지 않는 것이라 따로 표시가 없다(SPEC S-23).
- 문항 하나에 0 ~ 3개(SPEC S-22). 경험이 그새 지워졌으면 빠진다.

지원 `Application`

```json
{
  "id": 21,
  "organization": "OO 백엔드 부트캠프",
  "organizationType": "BOOTCAMP",
  "jobRole": "BACKEND",
  "postingUrl": "https://example.com/recruit/1234",
  "applicationStatus": "SUBMITTED",
  "submittedMonth": "2026-11",
  "questions": [
    { "id": 41, "applicationId": 21, "organization": "OO 백엔드 부트캠프", "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.", "questionType": "PROBLEM_SOLVING", "questionTypeBy": "AI", "status": "COMPLETED", "createdAt": "2026-11-04T10:00:00+09:00" },
    { "id": 43, "applicationId": 21, "organization": "OO 백엔드 부트캠프", "text": "지원 동기와 수료 후 목표를 적어 주세요.", "questionType": null, "questionTypeBy": null, "status": "ANALYZING", "createdAt": "2026-11-04T10:00:00+09:00" }
  ],
  "createdAt": "2026-11-04T10:00:00+09:00"
}
```

- `organizationType` · `jobRole` — README 「값 목록」 지원처 종류 · 직무(S-42). 사용자가 고른다 · 선택이라 `null` 일 수 있다. 문항 요약에는 싣지 않는다 — 지원의 것이다.
- `postingUrl` — 공고 원문 링크(S-46 · `P1`). 넣을 때 사용자가 확인한 값 · 없으면 `null`. FE 는 지원 화면에서 새 탭으로 연다. 서버는 이 링크를 다시 읽지 않는다(본문 · 요약을 저장하지 않는다). 넣은 뒤엔 고치지 않는다.
- `applicationStatus` — README 「값 목록」 지원 상태(S-36 · `P1`). **늘 값이 있다** — 새 지원은 `WRITING`(넣을 때 요청에 싣지 않는다). 사용자가 `PATCH` 로만 바꾼다 — 추천 · 초안이 끝나도 저절로 바뀌지 않는다. FE 는 목록의 **꼬리표**로 보인다(보드 · 칸 옮기기가 아니다). 합격률 · 상태별 개수로 모아 보이지 않고, 합격 · 불합격을 점수처럼 칠하지 않는다(SPEC 범위 제외).
- `submittedMonth` — 낸 달 `"YYYY-MM"`(S-37). 타임라인 「지원도 같이 보기」에서 이 달에 한 줄로 놓인다. 규칙:
  - `applicationStatus` 가 `WRITING` 이면 늘 `null` — 타임라인에 놓이지 않는다.
  - `WRITING` 에서 다른 상태로 바뀔 때 값이 없으면 **BE 가 그 달**(서울 시간)을 붙인다. 다른 상태끼리 바꿀 땐(냈음 → 합격) 그대로 둔다. `WRITING` 으로 되돌리면 `null`.
  - 사용자가 `PATCH` 로 고친다 — 예전에 낸 지원을 나중에 넣었을 때 그해 자리에 놓이게.
  - 「모름」(`UNKNOWN`)도 낸 것이라 달이 붙는다.
- `questions` — 문항 요약(`QuestionSummary`), **넣은 순서대로**(지원서의 문항 순서). 추천 결과는 문항마다 `GET /api/questions/{questionId}`.

---

## POST /api/applications — 지원 넣기(문항 여러 개)

- 쓰는 곳: FE 지원 넣기
- SPEC: `F-06` / `S-18`

요청

```json
{
  "organization": "OO 백엔드 부트캠프",
  "organizationType": "BOOTCAMP",
  "jobRole": "BACKEND",
  "postingUrl": "https://example.com/recruit/1234",
  "questions": [
    { "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요." },
    { "text": "지원 동기와 수료 후 목표를 적어 주세요." }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `organization` | 지원처 이름(선택 — 없으면 `null`). 최대 100자 |
| `organizationType` · `jobRole` | 지원처 종류 · 직무(선택 — 없거나 `null` 이면 비움). README 「값 목록」 값만(S-42) |
| `postingUrl` | 공고 원문 링크(선택 — 없거나 `null` 이면 비움, S-46). `http://` · `https://` 만, 최대 2000자. 빼고 보내면 `null` 과 같다(S-46 전 FE 와 맞물리게) |
| `questions` | 문항 **1 ~ 10개**, 넣은 순서가 지원서의 문항 순서. 각 `text` 는 `POST /api/questions` 의 `text` 와 같은 규칙(공백만 안 됨 · 최대 5000자) |

응답 202 — 지원과 문항을 저장하고 문항마다 추천을 뒤에서 돌린다.

```json
{ "applicationId": 21, "questionIds": [41, 43] }
```

- 새 지원은 `applicationStatus: "WRITING"` · `submittedMonth: null` 로 시작한다(S-36). 요청엔 싣지 않는다(실어도 무시한다) — 상태 · 낸 달은 `PATCH` 로만.
- 문항마다 분석 1회로 센다([`auth-api.md`](auth-api.md) `dailyAnalysis`). 남은 횟수가 문항 수보다 적으면 **아무것도 저장하지 않고** 429 — 일부만 넣지 않는다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | 어떤 문항의 `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `questions` 가 없거나 0개 · 10개를 넘음 · `text` 가 없음 · `organization` 이 100자를 넘음 · `organizationType` · `jobRole` 이 목록에 없는 값 · `postingUrl` 이 `http(s)://` 가 아니거나 2000자를 넘음 |
| 413 | `TEXT_TOO_LONG` | 어떤 문항의 `text` 가 5000자를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 남은 분석 횟수가 문항 수보다 적음 |

## POST /api/applications/{applicationId}/questions — 지원에 문항 더하기

- 쓰는 곳: FE 지원 화면의 「문항 더하기」
- SPEC: `F-06` / `S-18`

요청 · 규칙은 `POST /api/questions` 와 같다(`organization` 은 받지 않는다 — 지원의 것을 쓴다).

```json
{ "text": "본인의 장단점을 적어 주세요." }
```

응답 202 — `{ "questionId": 44, "status": "ANALYZING" }`. 지원 하나의 문항은 **최대 20개** — 넘으면 400 `INVALID_REQUEST`.

오류: `POST /api/questions` 와 같은 것 + 404 `APPLICATION_NOT_FOUND`

## GET /api/applications — 넣었던 지원 목록

- 쓰는 곳: FE 지원 목록
- SPEC: `F-06` / `S-21`

최근에 넣은 지원부터. 페이지 나누기 없음.

응답 200 — `{ "applications": [Application, …] }`

## GET /api/applications/{applicationId} — 지원 하나

- 쓰는 곳: FE 지원 화면(문항 목록 · 분석 중 폴링)
- SPEC: `F-06` / `S-18` · `S-21`

응답 200 — `Application`. 오류: 404 `APPLICATION_NOT_FOUND`

---

## POST /api/questions — 지원 문항 넣기

- 쓰는 곳: FE 문항 넣기
- SPEC: `F-06` / `S-18`

요청

```json
{ "organization": "OO 백엔드 부트캠프", "organizationType": "BOOTCAMP", "jobRole": "BACKEND", "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요." }
```

| 필드 | 값 |
| --- | --- |
| `organization` | 지원처 이름(선택 — 없으면 `null`). 최대 100자 |
| `organizationType` · `jobRole` | 새로 만드는 지원의 종류 · 직무(선택). `POST /api/applications` 와 같다 |
| `text` | 문항 텍스트. 공고 일부를 같이 붙여도 된다. 공백만 있으면 안 된다. 최대 **5000자**(Java `String.length()` — JS `text.length` 와 같은 숫자) |

응답 202 — 문항을 저장하고 추천을 뒤에서 돌린다. 문항 하나짜리 **지원을 새로 만든다**(`organization` 은 그 지원의 것, 상태는 `WRITING` — S-36) — 스프린트 2 처음 모양을 깨지 않으려고 남겨 둔다.

```json
{ "questionId": 41, "applicationId": 21, "status": "ANALYZING" }
```

- 경험이 하나도 없어도 받는다 — AI 가 요구사항을 전부 `NOT_FOUND` · 추천 `[]` 로 돌려준다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `text` 가 없음 · `organization` 이 100자를 넘음 · `organizationType` · `jobRole` 이 목록에 없는 값 |
| 413 | `TEXT_TOO_LONG` | `text` 가 5000자를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 — 추천도 LLM 을 불러 자료 넣기와 같이 센다. 문항을 저장하지 않는다([`auth-api.md`](auth-api.md)) |

## GET /api/questions — 넣었던 문항 목록

- 쓰는 곳: FE 문항 목록 · 두 문항 오가기
- SPEC: `F-06` / `S-21`

최근에 넣은 것부터. 페이지 나누기 없음.

응답 200

```json
{
  "questions": [
    { "id": 42, "applicationId": 22, "organization": "OO 연합 동아리", "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요.", "questionType": "COLLABORATION", "questionTypeBy": "AI", "status": "COMPLETED", "createdAt": "2026-11-04T10:20:00+09:00" },
    { "id": 41, "applicationId": 21, "organization": "OO 백엔드 부트캠프", "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.", "questionType": "PROBLEM_SOLVING", "questionTypeBy": "AI", "status": "COMPLETED", "createdAt": "2026-11-04T10:00:00+09:00" }
  ]
}
```

## GET /api/questions/{questionId} — 문항 하나 · 추천 결과

- 쓰는 곳: FE 추천 결과(분석 중 폴링 포함)
- SPEC: `F-06` · `F-07` · `F-08` / `S-18` ~ `S-22` · `S-25`

`ANALYZING` · `FAILED` 면 `requirements` · `recommendations` · `clarifications` 는 `[]`. `FAILED` 의 `error.code` 는 `experience-api.md` 「GET /api/jobs」 실패 이유와 같은 값(`AI_TIMEOUT` · `AI_UNAVAILABLE` · `AI_FAILED` · `INTERNAL_ERROR`) — 정해진 결과로 대신 채우지 않는다(대회 규칙 2).

`draft` — 이 문항의 답변 초안(아래 「답변 초안」 `Draft`). 아직 만들지 않았으면 `null`. 초안을 만드는 중엔 이 응답을 폴링한다.

응답 200 — 문항 A, 되묻기 하나에 답한 뒤

```json
{
  "id": 41,
  "applicationId": 21,
  "organization": "OO 백엔드 부트캠프",
  "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.",
  "questionType": "PROBLEM_SOLVING",
  "questionTypeBy": "AI",
  "status": "COMPLETED",
  "error": null,
  "requirements": [
    { "text": "기술 문제의 원인을 찾아 해결한 경험", "status": "SUPPORTED", "experienceIds": [101] },
    { "text": "해결한 뒤 결과를 확인한 방법", "status": "NOT_FOUND", "experienceIds": [] },
    { "text": "Java · Spring 사용 경험", "status": "NOT_FOUND", "experienceIds": [] }
  ],
  "recommendations": [
    {
      "activity": { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
      "experience": {
        "id": 101,
        "activityId": 7,
        "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
        "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
        "actor": "ME",
        "sourceStatus": "SOURCE_CONFIRMED",
        "citations": [
          { "id": 201, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.", "matched": true, "location": { "startLine": 5, "endLine": 5 } }
        ],
        "supplements": [
          { "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다", "questionId": 41, "createdAt": "2026-11-04T10:05:00+09:00", "updatedAt": "2026-11-04T10:05:00+09:00" }
        ]
      },
      "reason": "채팅 지연이라는 기술 문제를 직접 해결한 사례라 문항과 맞는다",
      "emphasis": "폴링의 한계를 보고 WebSocket 으로 바꾼 판단",
      "evidence": [{ "type": "CITATION", "id": 201 }],
      "gaps": ["직접 고친 범위가 자료에 없다", "고친 뒤 확인한 방법이 자료에 없다"]
    }
  ],
  "clarifications": [
    { "id": 61, "experienceId": 101, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "supplementId": 301 },
    { "id": 62, "experienceId": 101, "question": "바꾼 뒤 메시지가 제때 오는지 어떻게 확인했나요?", "supplementId": null }
  ],
  "draft": null,
  "createdAt": "2026-11-04T10:00:00+09:00",
  "updatedAt": "2026-11-04T10:00:24+09:00"
}
```

- 예시 읽는 법: 원본엔 「바꿔 해결했다」뿐이라 「확인한 방법」 · 「Java · Spring」은 `NOT_FOUND` 다 — 경험이 없다는 뜻이 아니라 자료에 없다는 뜻이다. 61 엔 답해 보완 301 이 생겼고, 62 는 건너뛰었다(`null`). 추천의 `evidence` · `gaps` 는 **추천했을 때** 그대로다 — 보완 301 은 이 문항 뒤에 생겨서 `evidence` 에 없지만 `experience.supplements` 엔 보인다.

응답 200 — 문항 B(보완 301 이 생긴 뒤 넣음). S-25: 보완이 근거로 쓰이고, 같은 사실은 다시 묻지 않는다.

```json
{
  "id": 42,
  "applicationId": 22,
  "organization": "OO 연합 동아리",
  "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요.",
  "questionType": "COLLABORATION",
  "questionTypeBy": "AI",
  "status": "COMPLETED",
  "error": null,
  "requirements": [
    { "text": "팀에서 내가 맡은 역할", "status": "SUPPORTED", "experienceIds": [101] },
    { "text": "팀과 함께 일한 방식", "status": "PARTIAL", "experienceIds": [102] }
  ],
  "recommendations": [
    {
      "activity": { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
      "experience": {
        "id": 102, "activityId": 7,
        "content": "매주 금요일 스프린트 회고를 했다",
        "competencies": ["COLLABORATION"], "actor": "TEAM", "sourceStatus": "SOURCE_CONFIRMED",
        "citations": [{ "id": 202, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "팀은 매주 금요일 스프린트 회고를 했다.", "matched": true, "location": { "startLine": 6, "endLine": 6 } }],
        "supplements": []
      },
      "reason": "팀이 매주 회고로 일하는 방식을 맞춘 사례다",
      "emphasis": "정기 회고로 진행을 함께 점검한 방식",
      "evidence": [{ "type": "CITATION", "id": 202 }],
      "gaps": ["회고에서 내가 맡은 몫이 자료에 없다"]
    },
    {
      "activity": { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
      "experience": {
        "id": 101, "activityId": 7,
        "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
        "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"], "actor": "ME", "sourceStatus": "SOURCE_CONFIRMED",
        "citations": [{ "id": 201, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.", "matched": true, "location": { "startLine": 5, "endLine": 5 } }],
        "supplements": [{ "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다", "questionId": 41, "createdAt": "2026-11-04T10:05:00+09:00", "updatedAt": "2026-11-04T10:05:00+09:00" }]
      },
      "reason": "팀에서 실시간 채팅 기능을 직접 맡아 고친 역할이 드러난다",
      "emphasis": "서버 엔드포인트와 앱 코드를 모두 맡은 범위",
      "evidence": [{ "type": "CITATION", "id": 201 }, { "type": "SUPPLEMENT", "id": 301 }],
      "gaps": []
    }
  ],
  "clarifications": [
    { "id": 63, "experienceId": 102, "question": "매주 회고에서 직접 맡은 일이 있었다면 무엇이었나요?", "supplementId": null }
  ],
  "draft": null,
  "createdAt": "2026-11-04T10:20:00+09:00",
  "updatedAt": "2026-11-04T10:20:19+09:00"
}
```

- 예시 읽는 법: 같은 활동에서 문항 A 는 101 을, 문항 B 는 102 를 먼저 골랐다. 102 는 `TEAM` 이라 이유에 「내가 했다」가 없고, 내 몫은 되묻기 63 으로 묻는다(S-20). 101 의 「직접 고친 부분」은 보완 301 에 있으니 다시 묻지 않고 근거로 쓴다(S-25).

오류: 404 `QUESTION_NOT_FOUND`

## POST /api/questions/{questionId}/retry — 다시 시도

- 쓰는 곳: FE 추천 실패의 「다시 시도」
- SPEC: `F-06` / `S-18`

같은 문항으로 추천을 다시 돌린다(새 문항을 만들지 않는다). 그때의 경험 · 보완을 다시 싣는다. 요청 본문 없음.

응답 202 — `GET /api/questions/{questionId}` 와 같은 모양, `status: "ANALYZING"` · `error: null` · 결과 배열은 `[]`.

오류: 404 `QUESTION_NOT_FOUND` · 409 `QUESTION_NOT_FAILED` 실패 상태가 아닌 문항 · 429 `DAILY_LIMIT_EXCEEDED` 오늘 분석 횟수를 다 씀

## PATCH /api/applications/{applicationId} — 지원처 종류 · 직무 · 지원 상태 · 낸 달 바꾸기

- 쓰는 곳: FE 지원 화면의 지원처 종류 · 직무 칸 · 지원 목록 · 지원 화면의 상태 꼬리표
- SPEC: `R-03` / `S-42` · `R-05` / `S-36` · `S-37` — 우선순위 `P1`

보낸 필드만 바꾼다. 지원처 이름 · 문항 · 공고 링크는 여기서 바꾸지 않는다(S-18 · S-46).

요청 — `PATCH /api/applications/21`

```json
{ "organizationType": "BOOTCAMP", "jobRole": "BACKEND" }
```

```json
{ "applicationStatus": "SUBMITTED" }
```

```json
{ "applicationStatus": "PASSED", "submittedMonth": "2025-02" }
```

| 필드 | 값 |
| --- | --- |
| `organizationType` · `jobRole` | README 「값 목록」 값 하나. `null` 을 보내면 비운다(S-42) |
| `applicationStatus` | README 「값 목록」 지원 상태 하나. `null` 은 받지 않는다 — 늘 값이 있다(S-36) |
| `submittedMonth` | 낸 달 `"YYYY-MM"`(S-37). 바꾼 뒤 상태가 `WRITING` 이면 받지 않는다. `null` 은 받지 않는다 — 지우려면 상태를 `WRITING` 으로 |

- `applicationStatus` 만 보내면 낸 달은 「지원 `Application`」의 규칙대로 BE 가 정한다 — `WRITING` → 다른 상태면 그 달, → `WRITING` 이면 `null`. 둘 다 보내면 보낸 달이 이긴다.
- 같은 값을 다시 보내도 200(바뀐 것 없음).

응답 200 — 바뀐 `Application`. 추천은 다시 돌지 않는다(종류 · 직무 · 상태 모두 매칭 요청에 싣지 않는다 — S-42).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 목록에 없는 값 · 바꿀 필드가 하나도 없음 · `applicationStatus` 가 `null` · `submittedMonth` 가 `null` 이거나 `YYYY-MM` 이 아님(`2025-2` · `2025` 안 됨) · 바꾼 뒤 상태가 `WRITING` 인데 `submittedMonth` 를 보냄 |
| 404 | `APPLICATION_NOT_FOUND` | 없는 지원 |

## PATCH /api/questions/{questionId} — 문항 유형 고치기

- 쓰는 곳: FE 추천 결과의 문항 유형
- SPEC: `R-03` / `S-41` — 우선순위 `P1`

문항 텍스트는 바꾸지 않는다(S-18) — 유형만.

요청 — `PATCH /api/questions/41`

```json
{ "questionType": "ACHIEVEMENT" }
```

| 필드 | 값 |
| --- | --- |
| `questionType` | README 「값 목록」 문항 유형 하나. `null` 은 받지 않는다(AI 값으로 되돌리기는 없다 — 다시 고른다) |

응답 200 — `GET /api/questions/{questionId}` 와 같은 모양. 값을 보냈으면 `questionTypeBy: "USER"`. 분석 중 · 실패한 문항도 고를 수 있다 — 그 뒤 매칭이 끝나도 덮어쓰지 않는다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `questionType` 이 없음 · `null` · 목록에 없는 값 |
| 404 | `QUESTION_NOT_FOUND` | 없는 문항 |

## POST /api/clarifications/{clarificationId}/answer — 되묻기에 답하기

- 쓰는 곳: FE 추천 결과의 되묻기 · 초안의 빠진 사실에 답하기
- SPEC: `F-07` / `S-23` · `F-09` / `S-27`

답을 그 경험의 **보완**으로 저장한다. 경험의 `content` · `citations` · `sourceStatus` 는 바꾸지 않는다(SPEC 미결정 10). 보완은 늘 「내가 입력」이다.

요청 — `POST /api/clarifications/61/answer`

```json
{ "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }
```

| 필드 | 값 |
| --- | --- |
| `answer` | 비지 않은 문자열. 최대 2000자 |

응답 201 — 만든 보완(`experience-api.md` 「Supplement」) + 어느 경험에 붙었나

```json
{
  "experienceId": 101,
  "supplement": { "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다", "questionId": 41, "createdAt": "2026-11-04T10:05:00+09:00", "updatedAt": "2026-11-04T10:05:00+09:00" }
}
```

- 보완의 `question` 은 되묻기 질문을 그대로 옮긴 것이다.
- 초안에서도 같은 경로를 쓴다 — `Draft.omitted[].clarificationId` 로 호출하고 요청은 `{ "answer" }` 그대로다. 경험 · 질문 · 문항 ID 는 BE 가 저장한 되묻기에서 읽는다(FE 가 보낸 값으로 바꾸지 않는다). 소유자 확인은 추천 되묻기와 같다.
- 초안에서 답해도 `Supplement.questionId` 는 그 지원 문항 ID 이다. 답 저장은 AI 를 부르지 않으며 분석 횟수를 쓰지 않는다. 추천 · 초안은 자동으로 다시 만들지 않는다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_ANSWER` | `answer` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `answer` 가 없음 · 2000자를 넘음 |
| 404 | `CLARIFICATION_NOT_FOUND` | 없는 되묻기 · 다시 만들기로 교체된 초안의 되묻기 |
| 404 | `EXPERIENCE_NOT_FOUND` | 묻던 경험이 그새 지워짐 |
| 409 | `CLARIFICATION_ALREADY_ANSWERED` | 이미 답함 — 고치기는 `PATCH /api/supplements/{id}`(S-24, `P1`) |

---

## 근거 점검 (S-45 · `P1`)

사용자가 그 문항에 쓴 답(초안을 고친 글이든 직접 쓴 글이든)을 문장마다 칠한다. **문항마다 최신 하나**만 둔다 — 다시 점검하면 바뀐다. 문항의 추천 작업과 따로 돈다(문항이 `ANALYZING` · `FAILED` 여도 점검할 수 있다 — 추천 결과를 쓰지 않는다). BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /ground-check」.

근거 점검 `GroundingCheck`

```json
{
  "questionId": 41,
  "status": "COMPLETED",
  "error": null,
  "text": "저는 「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제를 WebSocket 으로 바꿔 해결했습니다. 서버에 STOMP 엔드포인트를 만들고 앱의 폴링 코드를 구독 방식으로 바꿨습니다. 그 결과 응답 속도가 80% 빨라졌고 사용자 만족도가 크게 올랐습니다. 배포까지 제가 맡아 AWS 에 올렸습니다. 이 경험으로 문제의 원인을 끝까지 찾는 개발자가 되고 싶습니다.",
  "sentences": [
    {
      "text": "저는 「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제를 WebSocket 으로 바꿔 해결했습니다.",
      "status": "SOURCE",
      "evidence": [{ "type": "CITATION", "id": 201, "experienceId": 101, "activityId": 7, "text": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다." }],
      "note": null
    },
    {
      "text": "서버에 STOMP 엔드포인트를 만들고 앱의 폴링 코드를 구독 방식으로 바꿨습니다.",
      "status": "USER_INPUT",
      "evidence": [{ "type": "SUPPLEMENT", "id": 301, "experienceId": 101, "activityId": 7, "text": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }],
      "note": null
    },
    {
      "text": "그 결과 응답 속도가 80% 빨라졌고 사용자 만족도가 크게 올랐습니다.",
      "status": "UNSUPPORTED",
      "evidence": [],
      "note": "문장의 숫자(80)가 받치는 근거 · 보완에 없어요"
    },
    {
      "text": "배포까지 제가 맡아 AWS 에 올렸습니다.",
      "status": "UNSUPPORTED",
      "evidence": [],
      "note": "자료엔 배포를 팀원이 맡았다고 되어 있어요"
    },
    {
      "text": "이 경험으로 문제의 원인을 끝까지 찾는 개발자가 되고 싶습니다.",
      "status": "OPINION",
      "evidence": [],
      "note": null
    }
  ],
  "createdAt": "2026-11-05T15:00:00+09:00",
  "updatedAt": "2026-11-05T15:00:12+09:00"
}
```

- `text` — 점검한 글 그대로. 실패했을 때 「다시 시도」는 이 글로 같은 `POST` 를 부른다.
- `status` · `error` — 작업 상태(README 「값 목록」). `ANALYZING` · `FAILED` 면 `sentences` 는 `[]`. `FAILED` 의 `error.code` 는 `GET /api/questions/{questionId}` 와 같은 값 — 정해진 결과로 칠하지 않는다(대회 규칙 2).
- `sentences` — 글을 나눈 문장, **글의 순서대로**. 문장 나누기는 AI 서버 코드가 한다(ai-api 「POST /ground-check」). FE 는 이 배열을 차례로 이어 보여 칠한다.
- `sentences[].status` — README 「값 목록」 `groundingStatus`. 화면: `UNSUPPORTED` 는 눈에 띄게 칠하고 「지우거나, 사실이면 근거를 더해 주세요」, `OPINION` 은 칠하지 않고 AI 해석으로(SPEC S-45). 「근거 없음」을 「거짓」처럼 보이지 않는다.
- `sentences[].evidence` — 받치는 것. `type` 은 `evidenceType`(`CITATION` · `SUPPLEMENT` · `EXPERIENCE`), `id` 는 그 근거 · 보완 · 경험의 ID. BE 가 `experienceId` · `activityId`(활동 세부 S-08 로 가는 길) · `text`(발췌문 `quote` · 보완 `answer` · 경험 `content` — **지금 상태로**)를 붙인다. `SOURCE` · `USER_INPUT` 은 1개 이상, `UNSUPPORTED` · `OPINION` 은 `[]`. 그새 지워진 근거 · 보완 · 경험은 빠진다 — 판정(`status`)은 점검했을 때 그대로다(다시 점검하면 새로 판정).
- `sentences[].note` — `UNSUPPORTED` 일 때만 왜 근거 없음인지 한 줄(그 밖엔 `null`). AI 해석이거나 코드가 쓴 문구(숫자 대조)다 — FE 는 AI 해석으로 보인다.
- 예시 읽는 법: 첫 문장은 회고 발췌 201 이 받친다(원문). 둘째는 문항 A 에서 답한 보완 301 만 받친다(내가 입력). 셋째는 자료에 없는 결과 · 수치다 — LLM 이 근거를 붙였더라도 「80」이 근거 · 보완에 없으니 코드가 근거 없음으로 돌린다. 넷째는 경험 103(`TEAM`, 「배포는 팀원이 맡아」)을 「제가」로 바꿔 쓴 문장이다. 다섯째는 포부라 점검하지 않는다.

## POST /api/questions/{questionId}/grounding-check — 근거 점검 시작

- 쓰는 곳: FE 지원 화면의 「근거 점검」
- SPEC: `F-09` / `S-45` — 우선순위 `P1`

요청 — `POST /api/questions/41/grounding-check`

```json
{ "text": "저는 「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제를 WebSocket 으로 바꿔 해결했습니다. …" }
```

| 필드 | 값 |
| --- | --- |
| `text` | 점검할 답. 공백만 있으면 안 된다. 최대 **5000자**(`POST /api/questions` 의 `text` 와 같은 셈) |

응답 202 — `GroundingCheck`, `status: "ANALYZING"` · `sentences: []`. 그 문항의 예전 점검을 이것으로 바꾼다. 실패한 점검을 다시 할 때도 이 호출이다(따로 `retry` 가 없다).

- BE 는 그 사용자의 **경험 전부**(본문 · 수행 주체 · 출처 상태 · **원본에서 찾은 근거만**(`matched: true`) · 보완)를 지금 상태로 AI 에 보낸다 — 추천된 경험만이 아니다(SPEC S-45). 경험이 0개여도 받는다.
- 분석 1회로 센다([`auth-api.md`](auth-api.md) `dailyAnalysis`).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `text` 가 없음 |
| 404 | `QUESTION_NOT_FOUND` | 없는 문항 |
| 409 | `GROUNDING_CHECK_IN_PROGRESS` | 그 문항의 점검이 아직 `ANALYZING` — 예전 것을 바꾸지 않는다 |
| 413 | `TEXT_TOO_LONG` | `text` 가 5000자를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 — 예전 점검을 바꾸지 않는다 |

## GET /api/questions/{questionId}/grounding-check — 근거 점검 결과

- 쓰는 곳: FE 지원 화면(문항을 열 때 · 점검 중 폴링)
- SPEC: `F-09` / `S-45`

응답 200 — `{ "groundingCheck": GroundingCheck }`. 그 문항을 아직 점검하지 않았으면 `{ "groundingCheck": null }`.

오류: 404 `QUESTION_NOT_FOUND`

---

## 답변 초안 (S-27 · `P1`)

추천 결과에서 사용자가 고른 경험(1 ~ 3개)으로 그 문항의 답변 초안을 만든다. 범용 LLM 의 「자소서 써 줘」와 다른 점은 **문장마다 어느 근거(원문 발췌) · 보완(내가 입력)에서 왔는지 붙는다**는 것이고, 받치는 것이 없는 문장은 쓰지 않는다(SPEC S-27 · S-05). 받칠 게 없어 쓰지 않은 것은 `omitted` 로 따로 돌려준다. 최종 문장은 사람이 고친다 — 사용자는 텍스트로 복사해 자기 글로 고쳐 쓴다(SPEC §0). BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /draft」.

- **문항마다 최신 하나**만 둔다 — 다시 만들면 바뀐다(예전 초안을 비교해 보여 주지 않는다). 근거 점검과 같다.
- 초안은 문항 응답(`GET /api/questions/{questionId}`)의 `draft` 로 온다 — 따로 `GET` 이 없다. 추천이 끝난(`COMPLETED`) 문항에서만 만든다(고를 경험이 추천에서 나온다).

답변 초안 `Draft` — 문항 A, 경험 101 을 골라 만든 것(보완 301 이 생긴 뒤)

```json
{
  "questionId": 41,
  "status": "COMPLETED",
  "error": null,
  "experienceIds": [101],
  "sentences": [
    {
      "text": "「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제가 있었고, 제가 폴링을 WebSocket 으로 바꿔 해결했습니다.",
      "evidence": [{ "type": "CITATION", "id": 201, "experienceId": 101, "activityId": 7, "text": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다." }]
    },
    {
      "text": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨습니다.",
      "evidence": [{ "type": "SUPPLEMENT", "id": 301, "experienceId": 101, "activityId": 7, "text": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }]
    }
  ],
  "omitted": [
    { "text": "바꾼 뒤 메시지가 제때 오는지 확인한 방법", "question": "WebSocket 으로 바꾼 뒤 메시지가 제때 오는지 어떻게 확인했나요?", "experienceId": 101, "clarificationId": 64, "supplementId": null },
    { "text": "Java · Spring 을 쓴 경험", "question": null, "experienceId": null, "clarificationId": null, "supplementId": null },
    { "text": "이 경험에서 배운 점 · 느낀 점", "question": "채팅 방식을 바꾸며 배운 점이나 느낀 점이 있나요?", "experienceId": 101, "clarificationId": 65, "supplementId": null }
  ],
  "createdAt": "2026-11-04T10:10:00+09:00",
  "updatedAt": "2026-11-04T10:10:21+09:00"
}
```

- `status` · `error` — 작업 상태(README 「값 목록」). `ANALYZING` · `FAILED` 면 `sentences` · `omitted` 는 `[]`. `FAILED` 의 `error.code` 는 문항과 같은 값(`AI_TIMEOUT` · `AI_UNAVAILABLE` · `AI_FAILED` · `INTERNAL_ERROR`) — 정해진 문장으로 채우지 않는다(대회 규칙 2). 서버가 재시작돼 끊긴 초안도 `FAILED` 로 정리한다(추천과 같다).
- `experienceIds` — 사용자가 고른 경험, 보낸 순서대로. 실패했을 때 「다시 만들기」는 이 값으로 같은 `POST` 를 부른다. 그새 지워진 경험은 빠진다.
- `sentences` — 초안 문장, **글의 순서대로**. 한 문장에 줄바꿈이 없다. FE 는 차례로 이어 보이고, 「텍스트로 복사」는 근거 표시 없이 `text` 만 이어 붙인다. 0개일 수 있다 — 고른 경험에 받칠 근거 · 보완 · 본문이 하나도 없을 때(그때는 `omitted` 만 있다).
- `sentences[].evidence` — 그 문장을 받치는 것. 근거 점검(`GroundingCheck`)의 `evidence` 와 **같은 모양**이다 — FE 가 같은 표시를 쓴다. `type` 은 `evidenceType`(`CITATION` 원문 · `SUPPLEMENT` · `EXPERIENCE` 내가 입력), `id` 는 그 근거 · 보완 · 경험의 ID. BE 가 `experienceId` · `activityId` · `text`(발췌문 `quote` · 보완 `answer` · 경험 `content` — **지금 상태로**)를 붙인다. 만들 때는 문장마다 **1개 이상**이다. 그새 지워진 근거 · 보완 · 경험은 빠지므로 0개가 될 수 있다 — 문장은 만들었을 때 그대로 둔다(다시 만들면 새로 쓴다). 보완을 고쳤으면(S-24) `text` 는 고친 답이고 문장은 그대로다.
- `omitted` — 문항에 필요한데 고른 경험의 근거 · 보완 · 직접 입력한 본문에 없어 **쓰지 않은 것**, 객체 0 ~ 5개. AI 해석이다. 화면에서 「자료에 없어 쓰지 않았어요」처럼 — 부족한 사람처럼 읽히지 않게(SPEC S-19). 추천의 `clarifications` 최대 3개와 별개이고 그 배열에 섞지 않는다.
- `omitted[].text` · `question` · `experienceId` — AI `/draft` 응답 그대로. 경험에 연결된 것은 `experienceIds` 안의 경험 ID 와 구체적인 질문이 함께 있다. 연결되지 않은 빈칸은 둘 다 `null` 이며 FE 는 답 저장 칸을 붙이지 않고 사용자가 직접 쓸 거리로 보인다.
- `omitted[].clarificationId` — BE 가 초안 완료 시 질문마다 새로 붙여 저장하는 되묻기 ID. 추천 되묻기와 같은 ID 공간을 쓰되 초안에 속한 것으로 구분한다. 경험이 `null` 이면 이 값도 `null` 이고 되묻기를 만들지 않는다. 새로고침해도 같은 ID 다. FE 는 배열 순번 · 문구 · 추천 되묻기 ID 로 대신 답하지 않는다.
- `omitted[].supplementId` — 아직 답하지 않았으면 `null`, 답했으면 만든 보완 ID. BE 가 현재 연결을 조회해 응답하므로 새로고침해도 답한 상태가 유지된다. 답은 활동 세부의 보완에서 확인 · 수정한다(S-24). 보완을 지우면 `null` 로 돌아가 다시 답할 수 있다. 경험을 지우면 해당 `omitted` 항목은 응답에서 빠진다.
- 필드 5개는 모두 응답한다. 경험에 붙지 않는 빈칸은 `text` 만 문자열이고 나머지 네 필드는 `null` 이다. 건너뛰기는 요청하지 않는 것 — 보완이 생기지 않고 초안의 표시 · 복사를 막지 않는다.
- 예시 읽는 법: 첫 문장은 회고 발췌 201 이 받친다(원문 — 101 이 `ME` 라 「제가」로 쓸 수 있다). 둘째는 되묻기 61 에 답한 보완 301 만 받친다(내가 입력) — 「3초」의 3 이 301 에 있어 숫자 확인을 지난다. 되묻기 62(확인한 방법)는 건너뛰어 받칠 게 없으니 쓰지 않고 `omitted` 로 간다. 「Java · Spring」은 문항 A 요구사항에서 `NOT_FOUND` 였던 것, 「배운 점 · 느낀 점」은 자료에 없어 지어내지 않은 것이다. `TEAM` 경험 102 를 같이 골랐다면 「팀은 매주 금요일 스프린트 회고를 했습니다」로 쓰고 「제가」로 바꾸지 않는다.

### 빠진 사실에 답하기 · 저장된 초안 전환

1. 위 예시에서 FE 는 `POST /api/clarifications/64/answer` 에 `{ "answer": "두 기기로 메시지를 보내고 양쪽 화면에 도착하는지 확인했다" }` 를 보낸다. 기존 답 저장과 같은 201 응답으로 경험 101 의 보완(예: 302)이 생긴다. 질문은 저장된 `omitted.question`, `questionId` 는 41 이다.
2. `GET /api/questions/41` 의 같은 항목은 `clarificationId: 64` · `supplementId: 302` 로 온다. 문장 · 빠진 사실의 문구는 아직 바뀌지 않는다. 같은 ID 에 다시 답하면 409 `CLARIFICATION_ALREADY_ANSWERED` — 새 보완을 중복 생성하지 않는다.
3. 사용자가 다시 만들기를 누르면 아래 `POST /api/questions/41/draft` 에 `{ "experienceIds": [101] }` 을 보낸다. AI 요청의 경험 101 `supplements` 에 302 를 포함한다. 성공한 초안은 해당 답을 근거로 쓸 수 있고, 이미 답한 사실은 다시 묻지 않는다.

문자열 배열에서 객체 배열로 **AI · BE · FE 를 함께 전환**한다(ETC#139). 옛 문자열을 보고 경험이나 질문을 추측하지 않는다. BE 에 저장된 옛 형식 초안은 `draft: null` 로 반환해 사용자가 다시 만들게 한다 — 추천 · 기존 보완은 유지하고 자동 재생성 · 자동 과금은 하지 않는다. 새로 만든 초안부터 이 계약을 적용하며 혼합 배열은 반환하지 않는다. 서비스 구현은 AI#47 · BE#71 · FE#103 에서 함께 맞춘다.

## POST /api/questions/{questionId}/draft — 답변 초안 만들기

- 쓰는 곳: FE 추천 결과의 「초안 만들기」 · 완료한 초안(보완에 답한 뒤 포함)과 실패한 초안의 「다시 만들기」
- SPEC: `F-09` / `S-27` — 우선순위 `P1`

요청 — `POST /api/questions/41/draft`

```json
{ "experienceIds": [101] }
```

| 필드 | 값 |
| --- | --- |
| `experienceIds` | 그 문항 `recommendations` 의 경험 ID **1 ~ 3개**, 중복 없음. AI 에 이 순서로 싣는다 |

응답 202 — `Draft`, `status: "ANALYZING"` · `sentences: []` · `omitted: []`. 그 문항의 예전 초안(완료든 실패든)을 이것으로 바꾼다. 실패한 초안을 다시 만들 때도 이 호출이다(따로 `retry` 가 없다).

- BE 는 **고른 경험만** 지금 상태로 AI 에 보낸다 — 본문 · 역량 · 수행 주체 · 출처 상태 · 활동 이름 · 기간 · **원본에서 찾은 근거만**(`matched: true`) · 보완 전부. 원본에서 못 찾은 발췌는 「원문」으로 칠하지 않게 싣지 않는다(근거 점검과 같다). 추천의 `reason` · `emphasis` · `gaps` 는 싣지 않는다.
- 분석 1회로 센다([`auth-api.md`](auth-api.md) `dailyAnalysis`).

- 보완에 답한 뒤에도 **사용자가 다시 만들기를 누를 때만** 호출한다. FE 는 답 저장의 성공을 확인한 뒤 같은 `experienceIds` 로 요청하고, BE 는 그때 저장된 보완 전부를 싣는다. 답 저장 실패 시 오류 · 다시 시도를 보이고 저장된 것처럼 표시하지 않는다.
- 다시 만들기를 받아 예전 초안을 교체할 때 그 초안의 `clarificationId` 는 무효가 된다(이후 답 저장은 404 `CLARIFICATION_NOT_FOUND`). 이미 쌓인 보완은 지우지 않는다. 새 초안에는 새 ID 를 붙이며, 추천의 `clarifications` 는 바꾸지 않는다. 답 저장과 교체가 겹쳐도 무효인 ID 로 보완이 생기지 않게 BE 가 원자적으로 처리한다.
- 요청을 거절한 경우(400 · 404 · 409 · 429)는 예전 초안과 그 되묻기를 유지한다. 받아서 교체한 뒤 AI 호출이 실패하면 기존 규칙대로 `FAILED` 와 다시 만들기를 보인다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `experienceIds` 가 없음 · 0개 · 4개 이상 · 중복 · 그 문항 `recommendations` 에 없는 경험(그새 지워진 경험 포함) |
| 404 | `QUESTION_NOT_FOUND` | 없는 문항 |
| 409 | `QUESTION_NOT_COMPLETED` | 문항의 추천이 `COMPLETED` 가 아님(`ANALYZING` · `FAILED`) |
| 409 | `DRAFT_IN_PROGRESS` | 그 문항의 초안이 아직 `ANALYZING` — 예전 것을 바꾸지 않는다 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 — 예전 초안을 바꾸지 않는다 |

---

## 이 계약에 없는 것

- 지원 · 문항 지우기, 문항 텍스트 · 지원처 이름 고치기 — 없다(종류 · 직무 · 상태 · 낸 달 · 문항 유형만 `PATCH`).
- 지원 상태(S-36)의 바뀐 이력 · 상태별 개수 · 합격률 · 상태로 거르기 — 없다. 상태는 꼬리표 하나다. 받은 피드백(면접 질문 · 탈락 사유 · 멘토 의견)을 경험에 쌓기는 ETC#30. 타임라인(`GET /api/activities`)에 지원을 섞어 주는 API 도 없다 — FE 가 `GET /api/applications` 의 `submittedMonth` 로 합친다(S-37) 넣기 전엔 FE 에서 자유롭게 고치고, 넣은 뒤 잘못 넣었으면 그 지원에 새로 더한다(SPEC S-18)
- 「자주 나오는 문항」 목록(S-26) — FE 에 둔다. API 없음. 「내가 넣었던 문항」(S-40)은 `GET /api/questions` 를 FE 가 묶어 보인다 — 새 API 없음
- 예전 답변 다시 보기(S-43) — 확정 답변(ETC#67)이 생긴 뒤 계약을 더한다
- 공고 링크에서 본문 가져오기 — entrance-api `parse-application` 의 `url`(S-46). 여기는 원문 링크 `postingUrl` 을 남기기만 한다 · 넣은 뒤 링크 고치기 없음
- 답변 초안을 화면에서 고쳐 저장하기 · 확정 답변 · 근거 없는 문장을 새 경험으로(ETC#67), 작성 지침 · 구성 틀(ETC#68), 예전 초안 이력 · 비교, 문항 여러 개를 한 번에 초안으로, 글자 수 맞추기 — 없다. 초안은 문항마다 최신 하나다(S-27)
- 근거 점검의 예전 결과 모아 보기 · 문장을 고쳐 주기 — 없다. 점검은 문항마다 최신 하나, 글은 사람이 고친다(S-45). 근거 없는 문장을 새 경험 후보로 올리기는 확정 답변(ETC#67)에서
