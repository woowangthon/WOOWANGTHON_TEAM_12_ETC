# ai-api — BE → AI

> 스프린트 1 「경험 관리」(SPEC F-02). 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> AI 서버는 DB 를 만지지 않고 상태가 없다 — 받은 텍스트로 JSON 만 돌려준다([ADR-003](../decisions/ADR-003-stack-and-ai-boundary.md)). 저장 · ID · 사용자 구분은 BE.

- 부르는 곳: BE 만, 내부망으로([ADR-004](../decisions/ADR-004-deploy.md)). 인증 없음.
- 주소: `http://<AI 서버>:<포트>` — 값은 BE 설정(compose 서비스 이름).
- 시간: 한 번 부르는 데 수십 초 걸릴 수 있다. BE 는 제한 시간(BE 설정, 제안 120초)을 넘으면 끊고 작업을 `FAILED`(`AI_TIMEOUT`)로 둔다. AI 서버는 BE 의 작업 상태를 모른다.

## POST /extract — 활동 · 경험 · 근거 추출

- 부르는 곳: BE 분석 작업(experience-api `POST /api/sources` · `retry` 뒤)
- SPEC: `F-02` / `S-03` · `S-04` · `S-05` · `S-06`

요청

```json
{
  "sourceName": "바꿔요-회고.md",
  "text": "# 바꿔요 — 캠퍼스 중고거래 앱 회고 (2025년 1학기 캡스톤)\n\n기간: 2025-03 ~ 2025-06, 4명 팀. 나는 백엔드를 맡았다.\n\n- 채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.\n- 팀은 매주 금요일 스프린트 회고를 했다.\n- 배포는 팀원이 맡아 AWS 에 올렸다.\n\n## 알고리즘 스터디\n2024-09 부터 지금까지 매주 문제를 풀고 있다. 내가 문제 선정을 맡는다.\n"
}
```

| 필드 | 값 |
| --- | --- |
| `sourceName` | 원본 이름(파일 이름 등). 활동 이름을 짐작할 단서로만 쓴다 |
| `text` | 원본 텍스트 그대로. BE 가 저장한 것과 **글자 하나 다르지 않게** 보낸다 — 근거 대조 · 줄 번호의 기준이다 |

응답 200

```json
{
  "activities": [
    {
      "name": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "experiences": [
        {
          "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
          "perspective": "문제 해결",
          "actor": "ME",
          "sourceStatus": "SOURCE_CONFIRMED",
          "citations": [
            {
              "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.",
              "matched": true,
              "location": { "startLine": 5, "endLine": 5 }
            }
          ]
        },
        {
          "content": "매주 금요일 스프린트 회고를 했다",
          "perspective": "협업",
          "actor": "TEAM",
          "sourceStatus": "SOURCE_CONFIRMED",
          "citations": [
            { "quote": "팀은 매주 금요일 스프린트 회고를 했다.", "matched": true, "location": { "startLine": 6, "endLine": 6 } }
          ]
        },
        {
          "content": "서비스를 AWS 에 배포했다",
          "perspective": "기술 구현",
          "actor": "TEAM",
          "sourceStatus": "SOURCE_CONFIRMED",
          "citations": [
            { "quote": "배포는 팀원이 맡아 AWS 에 올렸다.", "matched": true, "location": { "startLine": 7, "endLine": 7 } }
          ]
        },
        {
          "content": "백엔드 API 설계를 맡았다",
          "perspective": "기술 구현",
          "actor": "ME",
          "sourceStatus": "NEEDS_REVIEW",
          "citations": [
            { "quote": "나는 백엔드 API 설계를 전부 맡았다.", "matched": false, "location": null }
          ]
        }
      ]
    },
    {
      "name": "알고리즘 스터디",
      "period": { "start": "2024-09", "end": null, "ongoing": true },
      "experiences": [
        {
          "content": "매주 풀 문제를 고른다",
          "perspective": "운영",
          "actor": "ME",
          "sourceStatus": "SOURCE_CONFIRMED",
          "citations": [
            { "quote": "내가 문제 선정을 맡는다.", "matched": true, "location": { "startLine": 10, "endLine": 10 } }
          ]
        }
      ]
    }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 예시 읽는 법: 배포는 「팀원이 맡아」라서 `TEAM`(S-06). 「백엔드 API 설계를 전부」는 원본에 없는 발췌문이라 `matched: false` → `NEEDS_REVIEW`(S-04). 원본에 수치가 없으니 경험에도 수치가 없다(S-05).

### 응답 규칙 — 어기면 AI 서버가 `LLM_INVALID_OUTPUT` 오류로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `activities` | 배열. 활동을 못 찾으면 `[]` 로 200 — 오류가 아니다(BE 는 작업을 `COMPLETED` · `activityIds: []` 로) |
| `activities[].name` | 비지 않은 문자열 |
| `activities[].period` | README 「기간」 규칙. 원본에 없는 날짜를 지어내지 않는다 — 모르면 `null` |
| `activities[].experiences` | 1개 이상. 경험이 없는 활동은 돌려주지 않는다 |
| `experiences[].content` | 비지 않은 문자열. 원본에 없는 수치 · 역할 · 결과를 넣지 않는다(S-05) |
| `experiences[].perspective` | 비지 않은 자유 문자열(SPEC 미결정 2 의 기본값) |
| `experiences[].actor` | `ME` · `TEAM` · `UNKNOWN`. 원본이 「팀이 했다」면 `ME` 로 바꾸지 않는다 |
| `experiences[].sourceStatus` | `SOURCE_CONFIRMED` · `NEEDS_REVIEW` 만. `USER_ENTERED` 는 BE 만 붙인다 |
| `experiences[].citations` | 배열(0개 가능 — 그러면 `NEEDS_REVIEW`) |
| `citations[].quote` | 원본에서 그대로 옮긴 발췌문. 비지 않은 문자열 |
| `citations[].matched` | 원본에서 찾았으면 `true` · 못 찾았으면 `false` · 대조하지 않았으면 `null` |
| `citations[].location` | 선택. `{ "startLine", "endLine" }` — 요청 `text` 기준 1부터 세는 줄 번호. 모르면 `null` |
| `model` | 이번 추출에 쓴 LLM 이름(로그 · `ai-scope.md` 용). 선택 |

`sourceStatus` 는 근거 대조 결과로 **코드가** 정한다(LLM 이 정하지 않는다).

- 근거가 1개 이상이고 전부 `matched: true` → `SOURCE_CONFIRMED`
- 그 밖(근거 없음 · `false` 가 하나라도 · `null` 이 하나라도) → `NEEDS_REVIEW`
- 원본에서 찾은 기준(공백 · 줄바꿈 · 마크다운 기호 무시 등)은 AI 서버가 정해 `ai-scope.md` 에 적는다(AI#5).
- 근거 대조가 붙기 전(AI#4 만 된 상태)에는 모든 `matched` 가 `null`, 모든 경험이 `NEEDS_REVIEW` 다 — 확인하지 않은 것을 확인했다고 돌려주지 않는다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `text` 가 없거나 비었음 |
| 413 | `TEXT_TOO_LONG` | AI 서버가 한 번에 다룰 수 없는 길이 — 한도는 AI 서버가 정해 여기 적는다(BE 한도보다 작으면 안 된다) |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함(키 · 한도 · 네트워크) |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(AI 서버 안에서 다시 시도한 뒤에도). 그럴듯하게 고쳐서 돌려주지 않는다 |
| 504 | `LLM_TIMEOUT` | LLM 이 AI 서버의 제한 시간 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 작업을 `FAILED`(`AI_FAILED`, `message` 에 위 `code`)로 둔다. 정해진 결과로 대신 채우지 않는다(대회 규칙 2).

## GET /health — 살아 있나

- 부르는 곳: Docker Compose healthcheck · BE 시작 확인

응답 200

```json
{ "status": "ok" }
```

LLM 을 부르지 않는다(키가 맞는지는 확인하지 않는다).
