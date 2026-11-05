# chagok-api — FE → BE

> 차곡이 도구 루프(SPEC R-04 `F-10` · `S-31`, ETC#99 · 계약 ETC#132). 차곡이는 우리 MCP 의 도구로 부탁 하나를 여러 단계로 처리하고, 사용자는 **도구를 부르며 일하는 과정**을 본다. 자유 대화가 아니다([ADR-007](../decisions/ADR-007-chagok-entrance-agent.md)).
> 도구는 BE MCP 에만 있고 차곡이(AI 서버)는 그 클라이언트다([ADR-008](../decisions/ADR-008-mcp-tools-in-be.md)) — 도구 목록 · 모양은 [`mcp-api.md`](mcp-api.md), BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /agent」.
> 이름 규칙 · 값 목록 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).

## 흐름

```
FE ─POST /api/chagok/runs { text, questionId? }──▶ BE   일 하나 시작 → 202 { runId }
   BE: 이 일에만 쓰는 CHAGOK 토큰(10분) 만들기
   BE ─POST /agent { text, context, mcpUrl }──▶ AI      응답은 단계 이벤트를 한 줄씩(NDJSON)
      AI ─POST /mcp/{CHAGOK 토큰} tools/list · tools/call(읽기만)──▶ BE (내부망)
   BE: 이벤트가 올 때마다 그 일의 steps 에 쌓는다
FE ─GET /api/chagok/runs/{runId}  (1초마다)──────────▶ BE   steps · status
   쓰기가 필요하면 AI 는 도구를 부르지 않고 「확인 요청」으로 끝낸다 → status WAITING_CONFIRM
FE ─POST /api/chagok/runs/{runId}/confirm──────────▶ BE   BE 가 그 쓰기 도구를 실행 → DONE + 결과
FE ─POST /api/chagok/runs/{runId}/cancel───────────▶ BE   안 함 → CANCELED
```

- **비동기 + 폴링**(분석 작업 `GET /api/jobs/{id}` 와 같다). SSE 는 쓰지 않는다 — Cloudflare 100초 제한 · 다시 연결 처리를 피한다. FE 는 `status` 가 `RUNNING` 인 동안 1초마다 읽는다.
- **저장 · 변경은 확인 뒤에만**(S-31). AI 는 쓰기 도구를 MCP 로 부르지 못한다(`mcp-api.md` 「쓰기 도구」). 사용자가 확인하면 **BE 가 같은 도구 코드로** 실행한다 — 도구 하나 = 코드 한 곳(ADR-008).
- **확인 뒤엔 일이 끝난다**(1차 — 기본값). 「지원을 만들었어요 → 열기」까지가 한 일이다. 이어서 할 일은 새 부탁으로.
- **실패**: 단계 하나가 실패하면 그 단계에 오류를 남기고 일은 `FAILED` 다. FE 는 오류와 「다시 시도」(같은 `text` · `questionId` 로 새 일 시작)를 보인다 — 정해진 답으로 채우지 않는다(대회 규칙 2).
- 하루 분석 한도([`auth-api.md`](auth-api.md) `dailyAnalysis`): **일 하나 시작에 1회**. 확인 뒤 실행하는 쓰기는 그 API 의 규칙대로 따로 센다(`create_application` 은 문항마다 · `add_source` 는 1회).
- 화면 배치(고정 옆 패널 / 띄운 창) · 단계를 보이는 모양 · 문구는 FE 가 정해 스크린샷으로 보인다(ADR-002). 이름 · 캐릭터는 디자인 몫(ETC#19).

## 모양

### Run — 일 하나

```json
{
  "runId": 55,
  "text": "WebSocket 경험으로 OO 부트캠프 지원 만들어 줘",
  "questionId": null,
  "status": "WAITING_CONFIRM",
  "steps": [
    {
      "seq": 1,
      "type": "TOOL_CALL",
      "label": "「WebSocket」으로 경험 찾는 중",
      "tool": "search_experiences",
      "arguments": { "query": "WebSocket" },
      "ok": true,
      "summary": "경험 1개를 찾았어요",
      "result": { "total": 1, "experiences": [ "…mcp-api search_experiences 응답 그대로…" ] },
      "error": null,
      "at": "2026-11-06T10:00:02+09:00"
    },
    {
      "seq": 2,
      "type": "MESSAGE",
      "label": null,
      "text": "「바꿔요」의 WebSocket 경험이 기술 문제 해결 문항에 맞아요.",
      "at": "2026-11-06T10:00:05+09:00"
    },
    {
      "seq": 3,
      "type": "CONFIRM",
      "label": "「OO 백엔드 부트캠프」 지원을 문항 1개로 만들까요?",
      "tool": "create_application",
      "arguments": {
        "organization": "OO 백엔드 부트캠프",
        "organizationType": "BOOTCAMP",
        "jobRole": "BACKEND",
        "postingUrl": null,
        "questions": [{ "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요." }]
      },
      "at": "2026-11-06T10:00:06+09:00"
    }
  ],
  "result": null,
  "error": null,
  "createdAt": "2026-11-06T10:00:00+09:00"
}
```

| 필드 | 값 |
| --- | --- |
| `status` | `RUNNING` 진행 중 · `WAITING_CONFIRM` 사용자 확인 기다림 · `DONE` 끝 · `FAILED` 실패 · `CANCELED` 그만둠 |
| `steps` | 순서대로(`seq` 1부터). 진행 중에도 쌓인 만큼 싣는다. 단계 모양은 아래 |
| `result` | `DONE` 이고 쓰기를 실행했을 때만 — `{ "tool": "create_application", "applicationId": 21, "questionIds": [41] }` 또는 `{ "tool": "add_source", "sourceId": 12, "jobId": 34 }`. 쓰기 없이 끝났으면 `null` |
| `error` | `FAILED` 일 때 `{ "code", "message" }` — 아래 오류 코드. 아니면 `null` |

단계 `type`

| `type` | 뜻 | 필드 |
| --- | --- | --- |
| `TOOL_CALL` | 읽기 도구를 불렀다 | `label`(무엇을 하는지 한 줄 — 화면에 그대로) · `tool` · `arguments` · `ok` · `summary`(결과 한 줄) · `result`(도구 결과 JSON 그대로 — `mcp-api.md` 응답 모양) · `error`(`ok` 가 `false` 일 때 도구 오류 `{ code, message }`) |
| `MESSAGE` | 차곡이가 사용자에게 하는 말 한 줄(300자 이하) | `text` |
| `CONFIRM` | 쓰기를 하려고 사용자 확인을 기다린다. 늘 **마지막** 단계 | `label`(무엇을 할지 한 줄) · `tool` · `arguments`(확인하면 이 값 그대로 실행) |

- `TOOL_CALL` 의 `result` 로 FE 는 경험 카드(근거 · 출처 상태 · 보완)를 그린다 — 경험 내용을 `MESSAGE` 글로만 보이지 않는다(근거가 보이게).
- 사용자는 `CONFIRM` 의 `arguments` 를 고칠 수 없다(1차). 고치고 싶으면 「안 함」 뒤 그 화면(지원 넣기 · 자료 넣기)에서 직접.

---

## POST /api/chagok/runs — 일 시작

- 쓰는 곳: FE 차곡이 패널의 부탁 입력 · 미리 정한 부탁 버튼(「근거 찾기」 「다른 경험으로」 — 같은 API 에 정한 글을 `text` 로)
- SPEC: `F-10` / `S-31`

요청

```json
{ "text": "WebSocket 경험으로 OO 부트캠프 지원 만들어 줘", "questionId": null }
```

| 필드 | 값 |
| --- | --- |
| `text` | 부탁. 공백만 안 됨 · 최대 **50000**자(자료를 붙여 넣고 「이거 쌓아 줘」 할 수 있게 — `POST /api/sources` 한도와 같다) |
| `questionId` | 선택. 지원 화면에서 열었으면 그 문항 — BE 가 문항 글 · 지원처를 AI 에 맥락으로 싣는다. 남의 문항이면 404 |

응답 202

```json
{ "runId": 55 }
```

- 저장한 일은 적어도 **하루** 남는다(새로고침 뒤에도 `GET` 으로 다시 본다). 지난 일 목록은 1차에 없다 — 진행 중 · 막 끝난 일은 [`work-api.md`](work-api.md).
- 한 사용자가 동시에 돌리는 일은 **하나**. `RUNNING` 인 일이 있으면 409 `RUN_IN_PROGRESS`.
- 409 를 받으면 FE 는 오류로 끝내지 않고 「그만두고 새로 시작」 / 「기다리기」를 묻는다(S-47). 쓴 글은 지우지 않는다. 그만두기는 `GET /api/work` 의 `RUNNING` 차곡이 일 `runId` 로 `POST …/cancel` 한 뒤 같은 글로 다시 `POST /api/chagok/runs` — 새 일이라 분석 1회를 더 센다. 사이에 다른 탭이 시작해 또 409 면 같은 선택지를 다시 묻는다.
- `WAITING_CONFIRM` 인 일이 있어도 새 일을 시작할 수 있다. 확인 카드는 `GET /api/work` 의 `inProgress` 로 다시 찾는다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `text` 없음 · `questionId` 가 숫자가 아님 |
| 413 | `TEXT_TOO_LONG` | `text` 가 50000자를 넘음 |
| 404 | `QUESTION_NOT_FOUND` | 없는 · 남의 문항 |
| 409 | `RUN_IN_PROGRESS` | 이미 `RUNNING` 인 일이 있음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 한도를 다 씀 — 일을 만들지 않는다 |

## GET /api/chagok/runs/{runId} — 진행 읽기

- 쓰는 곳: FE 차곡이 패널(`RUNNING` 동안 1초마다)
- SPEC: `F-10` / `S-31` — 「단계마다 무엇을 하는지 보인다」

응답 200 — 위 「Run」. 없는 · 남의 일이면 404 `RUN_NOT_FOUND`.

## POST /api/chagok/runs/{runId}/confirm — 확인하고 실행

- 쓰는 곳: FE `CONFIRM` 단계의 「만들기」(문구는 FE)
- SPEC: `S-31` — 「저장 · 변경은 사용자가 확인한 뒤에만」

요청 본문 없음. BE 는 마지막 `CONFIRM` 단계의 `tool` · `arguments` 를 **그 도구의 REST API 와 같은 규칙으로** 검사하고 실행한다(`create_application` = `POST /api/applications`, `add_source` = `POST /api/sources`).

응답 200 — `status: "DONE"` · `result` 가 채워진 Run.

- 실행이 실패하면(입력 검사 · 한도 · 그 밖) 일은 `FAILED` 이고 `error` 에 그 API 의 오류 `code` 를 그대로 싣는다(예: `DAILY_LIMIT_EXCEEDED`). 응답은 200 + `FAILED` Run — FE 는 Run 하나만 보면 된다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 404 | `RUN_NOT_FOUND` | 없는 · 남의 일 |
| 409 | `RUN_NOT_WAITING` | `WAITING_CONFIRM` 이 아님(이미 확인 · 그만둠 · 실패) — 두 번 눌러도 한 번만 실행된다 |

## POST /api/chagok/runs/{runId}/cancel — 그만두기

- 쓰는 곳: FE 「안 함」 · 진행 중 「그만」

요청 본문 없음. `RUNNING` · `WAITING_CONFIRM` 이면 `CANCELED` 로 두고(진행 중이면 AI 스트림을 끊는다), 이미 끝났으면 그대로. 응답 200 — Run. 없는 · 남의 일이면 404 `RUN_NOT_FOUND`.

## 일의 오류 코드 (`error.code`)

| `code` | 언제 |
| --- | --- |
| `AI_UNAVAILABLE` | AI 서버에 닿지 못함 · 5xx |
| `AI_TIMEOUT` | 일 전체가 `CHAGOK_TIMEOUT_SECONDS`(기본 **120**초)를 넘음 |
| `LLM_TIMEOUT` · `LLM_ERROR` · `MCP_UNAVAILABLE` | AI 이벤트 `error` 의 코드 그대로(`ai-api.md` 「POST /agent」) |
| `INTERNAL_ERROR` | AI 이벤트 `error` 의 같은 코드 · BE 가 단계 · 쓰기를 저장하지 못함 · 일 도중 서버가 다시 시작됨 |
| `TOO_MANY_STEPS` | 도구를 정해진 수(기본 8번) 넘게 부름 |
| `INVALID_AGENT_OUTPUT` | AI 가 계약 밖 이벤트를 보냄 · `confirm` 의 도구가 쓰기 도구가 아님 · 마지막 줄이 `done` · `confirm` · `error` 가 아님 |
| 쓰기 API 의 `code` | 확인 뒤 실행이 실패 — `DAILY_LIMIT_EXCEEDED` · `INVALID_REQUEST` · `EMPTY_TEXT` · `TEXT_TOO_LONG` |

## 이 계약에 없는 것

- 확인 뒤 루프 잇기 · 여러 쓰기를 차례로 확인 — 1차는 쓰기 하나로 끝난다
- 근거 점검 · 초안 만들기 · 다른 경험으로 바꿔 끼우기 도구 — S-45(ETC#74) · S-27(ETC#26) 이 선 뒤 `mcp-api.md` 에 도구로 더한다
- 보완 저장 도구 — 되묻기(`clarificationId`) 맥락이 필요하다
- 확인 전에 `arguments` 고치기 · 지난 일 다시 보기
- 일 줄 세우기(SPEC 미결정 22) · 한 사용자의 동시 실행(제출 후)
- 홈 입력에서 차곡이 루프 — 홈은 가르기(S-28)를 그대로 쓴다. 1차 입구는 지원 화면의 차곡이 패널
