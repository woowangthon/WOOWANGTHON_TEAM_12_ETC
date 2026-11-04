# experience-api — FE → BE

> 스프린트 1 「경험 관리」(SPEC R-01) · 스프린트 2 보완(SPEC R-03 — 「보완 `Supplement`」 · 보완 고치기 · 지우기). 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> 예시는 가상의 팀 프로젝트 회고 하나(「바꿔요」 · 알고리즘 스터디)로 이어진다 — [`ai-api.md`](ai-api.md) 예시와 같은 자료다.

## 흐름

```
FE ─POST /api/sources──────────▶ BE  원본 저장 · 작업 생성 → 202 { jobId }
                                  BE ─POST /extract──▶ AI   (ai-api.md)
FE ─GET /api/jobs/{id} (폴링)───▶ BE  ANALYZING → COMPLETED / FAILED
FE ─GET /api/activities─────────▶ BE  타임라인
FE ─GET /api/activities/{id}────▶ BE  세부(경험 · 근거)
FE ─PATCH · POST · DELETE …─────▶ BE  고치기 · 더하기 · 지우기 · 옮기기 · 합치기
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
  "experienceCount": 4
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
  "createdAt": "2026-11-04T10:05:00+09:00",
  "updatedAt": "2026-11-04T10:05:00+09:00"
}
```

- 되묻기 질문과 사용자의 답 한 쌍. 만드는 곳은 `question-api.md` 「POST /api/clarifications/{id}/answer」.
- 보완은 늘 「내가 입력」이다 — 따로 출처 칸이 없다. 보완이 생기거나 바뀌어도 **경험의 `content` · `citations` · `sourceStatus` 는 그대로**다(원문 사실과 사용자 말을 섞지 않는다 — SPEC 미결정 10). 경험 수정(`PATCH /api/experiences/{id}`)은 보완을 바꾸지 않는다.
- `questionId` — 이 보완이 나온 지원 문항. 문항이 없어지면 `null`(스프린트 2 엔 문항 지우기가 없다).
- 경험을 지우면 보완도 지워지고, 경험을 옮기거나 활동을 합치면 보완은 경험을 따라간다.

---

## POST /api/sources — 자료 넣기

- 쓰는 곳: FE 자료 넣기
- SPEC: `F-01` / `S-01`

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
| `name` | `FILE` 이면 파일 이름(필수, `.md` · `.txt` · `.pdf` · `.pptx` — 대소문자 무시). `TEXT` 면 `null` — BE 가 「붙여넣은 텍스트 2026-11-03 14:05」처럼 이름을 붙인다 |
| `text` | 원본 텍스트. 공백만 있으면 안 된다. 최대 길이는 아래 한도 |
| `sections` | `.pdf` · `.pptx` 면 **필수**(1개 이상), 그 밖엔 `null`(빼도 된다). 원소 `{ kind, number, startLine, endLine }` — `kind` 는 `.pdf` 면 `PAGE`, `.pptx` 면 `SLIDE`(README 「값 목록」) · `number` 는 1부터 센 쪽 · 슬라이드 번호 · `startLine` ≤ `endLine` 은 위 「줄 세기」의 줄 번호이고 `text` 의 줄 수를 넘지 않는다. `number` · 줄 둘 다 오름차순이고 구간끼리 겹치지 않는다. BE 는 받은 그대로 원본에 남긴다 |

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
| 413 | `TEXT_TOO_LONG` | `text` 가 한도를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 — 원본을 저장하지 않는다([`auth-api.md`](auth-api.md)) |

- 한도: **`50000`자**(BE#5 — README · 회고 몇 개 분량, LLM 한 번에 들어가는 크기). BE 는 Java `String.length()`(UTF-16 단위)로 세므로 JS `text.length` 와 같은 숫자다 — FE 는 같은 숫자로 미리 막아도 된다. AI 서버 한도(코드 포인트 수 50000, `ai-api.md`)보다 크지 않다.
- 같은 자료를 두 번 넣으면 새 원본 · 새 활동이 생긴다(BE#5 기본값). 자동으로 합치지 않는다(SPEC 미결정 3).

## GET /api/jobs/{jobId} — 분석 작업 상태

- 쓰는 곳: FE 자료 넣기 뒤 분석 상태
- SPEC: `F-01` / `S-02`

FE 는 `jobId` 를 들고 있다가(새로고침 대비 주소 · 브라우저 저장소 등은 FE 가 정한다) 끝날 때까지 부른다. 상태는 BE 가 저장하므로 새로고침해도 이어진다.

응답 200 — 분석 중

```json
{
  "jobId": 34,
  "sourceId": 12,
  "status": "ANALYZING",
  "activityIds": [],
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
  "error": null,
  "createdAt": "2026-11-03T14:05:00+09:00",
  "updatedAt": "2026-11-03T14:05:21+09:00"
}
```

- `activityIds` — 이 작업으로 생긴 활동. 완료인데 `[]` 면 자료에서 활동을 찾지 못한 것이다 — 실패가 아니다(「자료에서 확인 안 됨」은 「경험 없음」이 아니다, SPEC §0). 화면에서 어떻게 알릴지는 FE 가 정한다.

응답 200 — 실패

```json
{
  "jobId": 34,
  "sourceId": 12,
  "status": "FAILED",
  "activityIds": [],
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

오류: 404 `JOB_NOT_FOUND` · 409 `JOB_NOT_FAILED` 실패 상태가 아닌 작업 · 429 `DAILY_LIMIT_EXCEEDED` 오늘 분석 횟수를 다 씀(다시 시도도 한 번으로 센다)

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

오류: 404 `ACTIVITY_NOT_FOUND` 없는 활동(합쳐져 사라진 활동 포함)

## PATCH /api/activities/{activityId} — 활동 수정

- 쓰는 곳: FE 활동 세부에서 바로 고치기
- SPEC: `F-04` / `S-10`

보낸 필드만 바꾼다. `period` 는 세 칸을 통째로 보낸다.

요청

```json
{
  "name": "바꿔요 — 캠퍼스 중고거래 앱 (캡스톤)",
  "period": { "start": "2025-03", "end": "2025-07", "ongoing": false }
}
```

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
| 400 | `INVALID_REQUEST` | `name` 이 비었음 · 날짜 형식이 README 「기간」과 다름 |
| 400 | `INVALID_PERIOD` | `start` 가 `end` 보다 늦음 · `ongoing: true` 인데 `end` 가 있음 |
| 404 | `ACTIVITY_NOT_FOUND` | 없는 활동 |

## PATCH /api/experiences/{experienceId} — 경험 수정

- 쓰는 곳: FE 활동 세부에서 바로 고치기
- SPEC: `F-04` / `S-10`

보낸 필드만 바꾼다. 실제로 값이 바뀐 필드가 하나라도 있으면 **`sourceStatus` 는 `USER_ENTERED`** 가 된다. `competencies` 가 실제로 바뀌었으면 **`competenciesBy` 도 `USER`** 가 된다(다른 필드만 바뀌면 그대로). `citations` 는 그대로 남는다 — 이 요청으로 바꿀 수 없다.

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

## POST /api/activities/{activityId}/experiences — 경험 직접 추가

- 쓰는 곳: FE 활동 세부의 「경험 직접 추가」
- SPEC: `F-04` / `S-11`

사용자가 활동에 경험을 직접 적어 넣는다. **`sourceStatus` 는 `USER_ENTERED`, `competenciesBy` 는 `USER`, `citations` 는 `[]`** — BE 가 붙인다(근거 없는 AI 경험의 `NEEDS_REVIEW` 와 다르다). 활동의 경험 맨 뒤에 붙는다.

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

---

## PATCH /api/supplements/{supplementId} — 보완 고치기 (`P1`)

- 쓰는 곳: FE 활동 세부의 보완 바로 고치기
- SPEC: `F-07` / `S-24`

답만 고친다(질문은 되묻기 그대로). `updatedAt` 이 바뀐다. 경험의 출처 상태는 그대로다.

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
