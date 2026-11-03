# question-api — FE → BE

> 스프린트 2 「문항 매칭」(SPEC R-03). 이름 규칙 · 값 목록 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> 경험 · 근거 · 보완의 모양은 [`experience-api.md`](experience-api.md), BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /match」.
> 예시는 스프린트 1 예시(「바꿔요」 · 경험 101 ~ 104 · 근거 201 ~ 204)를 잇는다 — 문항 A(기술 문제 해결)에서 되묻기에 답한 보완 301 이 문항 B(역할 · 협업)에서 근거로 다시 쓰인다(S-25).

## 흐름

```
FE ─POST /api/questions─────────────▶ BE  문항 저장 · 추천 시작 → 202 { questionId }
                                       BE ─POST /match──▶ AI  (문항 + 사용자 경험 전부 + 보완)
FE ─GET /api/questions/{id} (폴링)───▶ BE  ANALYZING → COMPLETED(요구사항 · 추천 · 되묻기) / FAILED
FE ─POST /api/clarifications/{id}/answer ▶ BE  답 → 그 경험의 보완
FE ─GET /api/questions──────────────▶ BE  넣었던 문항 목록
```

- 문항 하나 = 추천 작업 하나다. 상태(`status` · `error`)는 문항에 붙는다 — `/api/jobs` 를 쓰지 않는다. 폴링 간격은 자료 넣기와 같이 FE 가 정한다.
- 추천은 **문항을 넣을 때 한 번** 돈다. 되묻기에 답해도 저절로 다시 돌지 않는다(AI#21 기본값). 보완을 반영한 추천을 보려면 새 문항을 넣는다 — 그게 데모 6 이다.

## 모양

문항 요약 `QuestionSummary`

```json
{
  "id": 41,
  "organization": "OO 백엔드 부트캠프",
  "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.",
  "status": "COMPLETED",
  "createdAt": "2026-11-04T10:00:00+09:00"
}
```

- `organization` — 지원처 이름. 선택이라 `null` 일 수 있다.
- `status` — README 「값 목록」 작업 상태(`ANALYZING` · `COMPLETED` · `FAILED`).

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

---

## POST /api/questions — 지원 문항 넣기

- 쓰는 곳: FE 문항 넣기
- SPEC: `F-06` / `S-18`

요청

```json
{ "organization": "OO 백엔드 부트캠프", "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요." }
```

| 필드 | 값 |
| --- | --- |
| `organization` | 지원처 이름(선택 — 없으면 `null`). 최대 100자 |
| `text` | 문항 텍스트. 공고 일부를 같이 붙여도 된다. 공백만 있으면 안 된다. 최대 **5000자**(Java `String.length()` — JS `text.length` 와 같은 숫자) |

응답 202 — 문항을 저장하고 추천을 뒤에서 돌린다.

```json
{ "questionId": 41, "status": "ANALYZING" }
```

- 경험이 하나도 없어도 받는다 — AI 가 요구사항을 전부 `NOT_FOUND` · 추천 `[]` 로 돌려준다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `text` 가 없음 · `organization` 이 100자를 넘음 |
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
    { "id": 42, "organization": "OO 연합 동아리", "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요.", "status": "COMPLETED", "createdAt": "2026-11-04T10:20:00+09:00" },
    { "id": 41, "organization": "OO 백엔드 부트캠프", "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.", "status": "COMPLETED", "createdAt": "2026-11-04T10:00:00+09:00" }
  ]
}
```

## GET /api/questions/{questionId} — 문항 하나 · 추천 결과

- 쓰는 곳: FE 추천 결과(분석 중 폴링 포함)
- SPEC: `F-06` · `F-07` · `F-08` / `S-18` ~ `S-22` · `S-25`

`ANALYZING` · `FAILED` 면 `requirements` · `recommendations` · `clarifications` 는 `[]`. `FAILED` 의 `error.code` 는 `experience-api.md` 「GET /api/jobs」 실패 이유와 같은 값(`AI_TIMEOUT` · `AI_UNAVAILABLE` · `AI_FAILED` · `INTERNAL_ERROR`) — 정해진 결과로 대신 채우지 않는다(대회 규칙 2).

응답 200 — 문항 A, 되묻기 하나에 답한 뒤

```json
{
  "id": 41,
  "organization": "OO 백엔드 부트캠프",
  "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.",
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
  "createdAt": "2026-11-04T10:00:00+09:00",
  "updatedAt": "2026-11-04T10:00:24+09:00"
}
```

- 예시 읽는 법: 원본엔 「바꿔 해결했다」뿐이라 「확인한 방법」 · 「Java · Spring」은 `NOT_FOUND` 다 — 경험이 없다는 뜻이 아니라 자료에 없다는 뜻이다. 61 엔 답해 보완 301 이 생겼고, 62 는 건너뛰었다(`null`). 추천의 `evidence` · `gaps` 는 **추천했을 때** 그대로다 — 보완 301 은 이 문항 뒤에 생겨서 `evidence` 에 없지만 `experience.supplements` 엔 보인다.

응답 200 — 문항 B(보완 301 이 생긴 뒤 넣음). S-25: 보완이 근거로 쓰이고, 같은 사실은 다시 묻지 않는다.

```json
{
  "id": 42,
  "organization": "OO 연합 동아리",
  "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요.",
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

## POST /api/clarifications/{clarificationId}/answer — 되묻기에 답하기

- 쓰는 곳: FE 추천 결과의 되묻기
- SPEC: `F-07` / `S-23`

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

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_ANSWER` | `answer` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `answer` 가 없음 · 2000자를 넘음 |
| 404 | `CLARIFICATION_NOT_FOUND` | 없는 되묻기 |
| 404 | `EXPERIENCE_NOT_FOUND` | 묻던 경험이 그새 지워짐 |
| 409 | `CLARIFICATION_ALREADY_ANSWERED` | 이미 답함 — 고치기는 `PATCH /api/supplements/{id}`(S-24, `P1`) |

---

## 이 계약에 없는 것

- 문항 지우기 · 고치기 — 스프린트 2 엔 없다. 잘못 넣었으면 새로 넣는다
- 답변 초안 · 문장 생성(ETC#26) · 공고 링크에서 본문 가져오기
