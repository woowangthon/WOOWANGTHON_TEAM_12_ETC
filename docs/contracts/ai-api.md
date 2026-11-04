# ai-api — BE → AI

> 스프린트 1 「경험 관리」(SPEC F-02 — `POST /extract`) · 스프린트 2 「문항 매칭」(SPEC R-03 — `POST /match`) · 스프린트 3 「입구 하나」(SPEC F-10 — `POST /route` · `POST /ask` · `POST /parse-application`). 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> AI 서버는 DB 를 만지지 않고 상태가 없다 — 받은 텍스트로 JSON 만 돌려준다([ADR-003](../decisions/ADR-003-stack-and-ai-boundary.md)). 저장 · ID · 사용자 구분은 BE.

- 부르는 곳: BE 만, 내부망으로([ADR-004](../decisions/ADR-004-deploy.md)). 인증 없음.
- 주소: `http://<AI 서버>:<포트>` — 값은 BE 설정(compose 서비스 이름).
- 시간: 한 번 부르는 데 수십 초 걸릴 수 있다. BE 는 제한 시간(BE `AI_TIMEOUT_SECONDS`, 기본 120초)을 넘으면 끊고 작업을 `FAILED`(`AI_TIMEOUT`)로 둔다. AI 서버는 BE 의 작업 상태를 모른다. AI 서버는 LLM 폴백 · 다시 시도까지 합쳐 100초 안에 답하거나 `LLM_TIMEOUT` 으로 돌려준다(`LLM_TIMEOUT_SECONDS`). `/extract` · `/match` 둘 다 같다.
- 입구 셋(`/route` · `/ask` · `/parse-application`)은 사용자가 화면에서 기다리는 **동기** 호출이다(entrance-api) — BE 는 60초(`AI_SYNC_TIMEOUT_SECONDS`)에서 끊고, AI 서버는 폴백 · 다시 시도까지 합쳐 **50초** 안에 답하거나 `LLM_TIMEOUT` 이다(`LLM_SYNC_TIMEOUT_SECONDS`).

## POST /extract — 활동 · 경험 · 근거 추출

- 부르는 곳: BE 분석 작업(experience-api `POST /api/sources` · `retry` 뒤)
- SPEC: `F-02` / `S-03` · `S-04` · `S-05` · `S-06` · `F-04` / `S-44`(`existingActivities` · `sameAsActivityId`, `P1`)

요청

```json
{
  "sourceName": "바꿔요-회고.md",
  "text": "# 바꿔요 — 캠퍼스 중고거래 앱 회고 (2025년 1학기 캡스톤)\n\n기간: 2025-03 ~ 2025-06, 4명 팀. 나는 백엔드를 맡았다.\n\n- 채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.\n- 팀은 매주 금요일 스프린트 회고를 했다.\n- 배포는 팀원이 맡아 AWS 에 올렸다.\n\n## 알고리즘 스터디\n2024-09 부터 지금까지 매주 문제를 풀고 있다. 내가 문제 선정을 맡는다.\n",
  "existingActivities": []
}
```

| 필드 | 값 |
| --- | --- |
| `sourceName` | 원본 이름(파일 이름 등). 활동 이름을 짐작할 단서로만 쓴다 |
| `text` | 원본 텍스트 그대로. BE 가 저장한 것과 **글자 하나 다르지 않게** 보낸다 — 근거 대조 · 줄 번호의 기준이다 |
| `existingActivities` | 이 사용자가 **이미 가진** 활동 — `{ id, name, period }` 의 배열(S-44, `P1`). 처음 넣는 사용자면 `[]`. 빼면 `[]` 와 같다(S-44 전 BE 와 맞물리게). 경험 본문 · 근거는 싣지 않는다. BE 는 `period.start` 최근 순으로 최대 **300개**까지 싣는다(`start` 가 `null` 인 활동은 뒤) — 넘으면 오래된 것이 빠진다. 다시 시도(`retry`)에서도 그때의 목록을 다시 만들어 보낸다 |

응답 200

```json
{
  "activities": [
    {
      "name": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "sameAsActivityId": null,
      "experiences": [
        {
          "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
          "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
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
          "competencies": ["COLLABORATION"],
          "actor": "TEAM",
          "sourceStatus": "SOURCE_CONFIRMED",
          "citations": [
            { "quote": "팀은 매주 금요일 스프린트 회고를 했다.", "matched": true, "location": { "startLine": 6, "endLine": 6 } }
          ]
        },
        {
          "content": "서비스를 AWS 에 배포했다",
          "competencies": ["IMPLEMENTATION"],
          "actor": "TEAM",
          "sourceStatus": "SOURCE_CONFIRMED",
          "citations": [
            { "quote": "배포는 팀원이 맡아 AWS 에 올렸다.", "matched": true, "location": { "startLine": 7, "endLine": 7 } }
          ]
        },
        {
          "content": "백엔드 API 설계를 맡았다",
          "competencies": ["IMPLEMENTATION"],
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
      "sameAsActivityId": null,
      "experiences": [
        {
          "content": "매주 풀 문제를 고른다",
          "competencies": ["OPERATION"],
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

- 예시 읽는 법: 배포는 「팀원이 맡아」라서 `TEAM`(S-06). 「백엔드 API 설계를 전부」는 원본에 없는 발췌문이라 `matched: false` → `NEEDS_REVIEW`(S-04). 원본에 수치가 없으니 경험에도 수치가 없다(S-05). 처음 넣는 자료라 `existingActivities` 가 `[]` 이고 `sameAsActivityId` 는 전부 `null`.

두 번째 자료를 넣을 때(S-44) — 위 회고로 활동 7 · 8 이 생긴 뒤 이력서를 넣는다(experience-api 「자료 넣기」의 PDF 예시와 같은 자료)

```json
{
  "sourceName": "이력서-2026.pdf",
  "text": "김차곡 — 백엔드 개발자\n2025 캡스톤 「바꿔요」 백엔드\n\n2024-09 ~ 알고리즘 스터디\n문제 선정을 맡는다",
  "existingActivities": [
    { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
    { "id": 8, "name": "알고리즘 스터디", "period": { "start": "2024-09", "end": null, "ongoing": true } }
  ]
}
```

응답 200 — 요점만(경험 · 근거는 위 예시와 같은 모양)

```json
{
  "activities": [
    { "name": "캡스톤 「바꿔요」", "period": { "start": "2025", "end": "2025", "ongoing": false }, "sameAsActivityId": 7, "experiences": [] },
    { "name": "알고리즘 스터디", "period": { "start": "2024-09", "end": null, "ongoing": true }, "sameAsActivityId": 8, "experiences": [
      { "content": "매주 풀 문제를 고른다", "competencies": ["OPERATION"], "actor": "ME", "sourceStatus": "SOURCE_CONFIRMED", "citations": [{ "quote": "문제 선정을 맡는다", "matched": true, "location": { "startLine": 5, "endLine": 5 } }] }
    ] }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 이름이 달라도(「캡스톤 「바꿔요」」 / 「바꿔요 — 캠퍼스 중고거래 앱」) 같은 활동으로 보이면 그 `id` 를 붙인다. 기간이 다르게 적혀도(이력서는 연도만 — `"2025"`) 막지 않는다 — 사용자가 이름 · 기간을 나란히 보고 정한다.

### 응답 규칙 — 어기면 AI 서버가 `LLM_INVALID_OUTPUT` 오류로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `activities` | 배열. 활동을 못 찾으면 `[]` 로 200 — 오류가 아니다(BE 는 작업을 `COMPLETED` · `activityIds: []` 로) |
| `activities[].name` | 비지 않은 문자열 |
| `activities[].period` | README 「기간」 규칙. 원본에 없는 날짜를 지어내지 않는다 — 모르면 `null` |
| `activities[].sameAsActivityId` | 같은 활동으로 보이는 기존 활동 — 요청 `existingActivities` 의 `id` 하나 또는 `null`(S-44). 늘 싣는다(`existingActivities` 가 `[]` 면 전부 `null`). **목록 밖 `id` 는 규칙 위반**이다 — 몰래 `null` 로 바꿔 「같은 활동 없음」처럼 보이게 하지 않는다. 같은 활동인지 확실하지 않으면 `null`. 서로 다른 새 활동 둘이 같은 `id` 를 가리켜도 된다. AI 해석이다 — BE · FE 는 제안으로만 쓰고 저절로 합치지 않는다 |
| `activities[].experiences` | 배열(0개 가능). 원본에 활동 이름 · 기간만 있고 한 일이 없으면(이력서 항목 · MOC 링크 목록) `[]` 로 활동만 돌려준다(SPEC S-03) — 경험을 지어내 채우지 않는다 |
| `experiences[].content` | 비지 않은 문자열. 원본에 없는 수치 · 역할 · 결과를 넣지 않는다(S-05) |
| `experiences[].competencies` | 배열 **1 ~ 3개**. README 「값 목록」의 역량 값만 · 중복 없음 · 가장 잘 맞는 것부터. 원문에서 확인한 사실이 아니라 AI 해석이다(SPEC 미결정 2) |
| `experiences[].actor` | `ME` · `TEAM` · `UNKNOWN`. 원본이 「팀이 했다」면 `ME` 로 바꾸지 않는다 |
| `experiences[].sourceStatus` | `SOURCE_CONFIRMED` · `NEEDS_REVIEW` 만. `USER_ENTERED` 는 BE 만 붙인다 |
| `experiences[].citations` | 배열(0개 가능 — 그러면 `NEEDS_REVIEW`) |
| `citations[].quote` | 원본에서 그대로 옮긴 발췌문. 비지 않은 문자열 |
| `citations[].matched` | 원본에서 찾았으면 `true` · 못 찾았으면 `false` · 대조하지 않았으면 `null` |
| `citations[].location` | 선택. `{ "startLine", "endLine" }` — 요청 `text` 기준 1부터 세는 줄 번호. 모르면 `null` |
| `model` | 이번 추출에 실제로 답한 LLM 이름(로그 · `ai-scope.md` 용). 모델 폴백이 있어 요청마다 다를 수 있다. 선택 |

`sourceStatus` 는 근거 대조 결과로 **코드가** 정한다(LLM 이 정하지 않는다).

- 근거가 1개 이상이고 전부 `matched: true` → `SOURCE_CONFIRMED`
- 그 밖(근거 없음 · `false` 가 하나라도 · `null` 이 하나라도) → `NEEDS_REVIEW`
- 원본에서 찾은 기준(공백 · 줄바꿈 · 마크다운 기호 무시 등)은 AI 서버가 정해 `ai-scope.md` 에 적는다(AI#5).
- 근거 대조가 붙기 전(AI#4 만 된 상태)에는 모든 `matched` 가 `null`, 모든 경험이 `NEEDS_REVIEW` 다 — 확인하지 않은 것을 확인했다고 돌려주지 않는다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `text` 가 없거나 비었음 |
| 413 | `TEXT_TOO_LONG` | `text` 가 **50000자**를 넘음(파이썬 `len` — 유니코드 코드 포인트 수, AI 서버 `MAX_TEXT_CHARS`). BE 한도는 이 숫자보다 크면 안 된다 |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함(키 · 한도 · 네트워크) |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(AI 서버 안에서 다시 시도한 뒤에도). 그럴듯하게 고쳐서 돌려주지 않는다 |
| 504 | `LLM_TIMEOUT` | LLM 이 AI 서버의 제한 시간 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 작업을 `FAILED`(`AI_FAILED`, `message` 에 위 `code`)로 둔다. 정해진 결과로 대신 채우지 않는다(대회 규칙 2).

## POST /match — 지원 문항에 맞는 경험 추천 · 되묻기

- 부르는 곳: BE 추천 작업(question-api `POST /api/questions` · `retry` 뒤)
- SPEC: `F-06` · `F-07` · `F-08` / `S-19` · `S-20` · `S-22` · `S-25` · `S-41`(`P1`)

BE 가 문항과 **그 사용자의 경험 전부**를 후보로 보낸다([ADR-003](../decisions/ADR-003-stack-and-ai-boundary.md) — 임베딩 · 후보 줄이기는 넘칠 때). AI 서버는 문항을 요구사항으로 쪼개고, 요구사항마다 근거를 판정하고, 경험을 0 ~ 3개 추천하고, 부족한 사실을 0 ~ 3개 묻고, 문항 유형을 하나 붙인다. LLM 을 안에서 몇 번 부를지는 AI 서버가 정한다 — 응답은 하나다.

요청 — 문항 B(question-api 예시). 경험 101 엔 문항 A 에서 답한 보완 301 이 실려 있다.

```json
{
  "question": {
    "organization": "OO 연합 동아리",
    "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요."
  },
  "experiences": [
    {
      "id": 101,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [
        { "id": 201, "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다." }
      ],
      "supplements": [
        { "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }
      ]
    },
    {
      "id": 102,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "매주 금요일 스프린트 회고를 했다",
      "competencies": ["COLLABORATION"],
      "actor": "TEAM",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 202, "quote": "팀은 매주 금요일 스프린트 회고를 했다." }],
      "supplements": []
    },
    {
      "id": 103,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "서비스를 AWS 에 배포했다",
      "competencies": ["IMPLEMENTATION"],
      "actor": "TEAM",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 203, "quote": "배포는 팀원이 맡아 AWS 에 올렸다." }],
      "supplements": []
    },
    {
      "id": 104,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "백엔드 API 설계를 맡았다",
      "competencies": ["IMPLEMENTATION"],
      "actor": "ME",
      "sourceStatus": "NEEDS_REVIEW",
      "citations": [{ "id": 204, "quote": "나는 백엔드 API 설계를 전부 맡았다." }],
      "supplements": []
    },
    {
      "id": 105,
      "activityName": "알고리즘 스터디",
      "period": { "start": "2024-09", "end": null, "ongoing": true },
      "content": "매주 풀 문제를 고른다",
      "competencies": ["OPERATION"],
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 205, "quote": "내가 문제 선정을 맡는다." }],
      "supplements": []
    }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `question.organization` | 지원처 이름. `null` 가능 — 문항 의도를 읽는 단서로만 쓴다 |
| `question.text` | 문항 텍스트(BE 한도 5000자). 비지 않은 문자열 |
| `experiences` | 사용자의 경험 전부. **0개면 `[]`** — 오류가 아니다. `id` 는 BE 의 경험 ID, 중복 없음 |
| `experiences[].activityName` · `period` | 그 경험이 속한 활동 — 문맥 단서 |
| `experiences[].content` · `competencies` · `actor` · `sourceStatus` | `experience-api.md` 「Experience」 그대로 |
| `experiences[].citations` | `{ id, quote }` 만. 원본에서 확인 못 한 근거(`matched: false`)도 싣는다 — 경험의 `sourceStatus` 가 그걸 말해 준다 |
| `experiences[].supplements` | 보완 `{ id, question, answer }`. 사용자가 직접 말한 사실이다(「내가 입력」). 없으면 `[]` |

응답 200

```json
{
  "questionType": "COLLABORATION",
  "requirements": [
    { "text": "팀에서 내가 맡은 역할", "status": "SUPPORTED", "experienceIds": [101] },
    { "text": "팀과 함께 일한 방식", "status": "PARTIAL", "experienceIds": [102] }
  ],
  "recommendations": [
    {
      "experienceId": 102,
      "reason": "팀이 매주 회고로 일하는 방식을 맞춘 사례다",
      "emphasis": "정기 회고로 진행을 함께 점검한 방식",
      "evidence": [{ "type": "CITATION", "id": 202 }],
      "gaps": ["회고에서 내가 맡은 몫이 자료에 없다"]
    },
    {
      "experienceId": 101,
      "reason": "팀에서 실시간 채팅 기능을 직접 맡아 고친 역할이 드러난다",
      "emphasis": "서버 엔드포인트와 앱 코드를 모두 맡은 범위",
      "evidence": [{ "type": "CITATION", "id": 201 }, { "type": "SUPPLEMENT", "id": 301 }],
      "gaps": []
    }
  ],
  "clarifications": [
    { "experienceId": 102, "question": "매주 회고에서 직접 맡은 일이 있었다면 무엇이었나요?" }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 예시 읽는 법: 102 는 `TEAM` 이라 이유에 「내가 했다」가 없고 내 몫은 되묻기로 묻는다(S-20). 101 의 「직접 고친 부분」은 보완 301 에 있으니 다시 묻지 않고 근거로 쓴다(S-25). 배포 103 은 팀원이 한 일이라 「내가 맡은 역할」의 근거가 아니다. 104 는 근거가 원본에서 확인되지 않아(`NEEDS_REVIEW`) 역할의 근거로 고르지 않았다 — 고를 수는 있지만 그러면 `gaps` 에 그 점을 적는다. 문항 A(기술 문제 해결)였다면 101 이 먼저 오고, 보완이 없을 때 「직접 고친 부분은?」을 물었을 것이다.

### 응답 규칙 — 어기면 AI 서버가 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 으로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `questionType` | README 「값 목록」 `questionType` 값 **하나**(S-41). 문항이 묻는 꼴 — 맞는 게 없으면 `OTHER`. 매칭과 같은 호출에서 정한다(LLM 을 따로 부르지 않는다). 경험이 `[]` 여도 붙인다 |
| `requirements` | 배열 **1 ~ 6개** |
| `requirements[].text` | 비지 않은 문자열 — 문항이 보려는 것 하나(도구 「Python · SQL」 또는 능력 서술 「데이터 정합성 검증」) |
| `requirements[].status` | `requirementStatus` 값(README) — `SUPPORTED` 근거가 받친다 · `PARTIAL` 일부만 받친다 · `NOT_FOUND` 자료에서 확인 안 됨 |
| `requirements[].experienceIds` | `NOT_FOUND` 면 `[]`, 아니면 1개 이상. 전부 **요청에 있는** 경험 ID |
| `recommendations` | 배열 **0 ~ 3개**, 더 잘 맞는 것부터. 맞는 게 없으면 `[]` — 억지로 채우지 않는다 |
| `recommendations[].experienceId` | 요청에 있는 경험 ID · 추천끼리 중복 없음 |
| `recommendations[].reason` · `emphasis` | 비지 않은 문자열. AI 해석이다. 경험 · 근거 · 보완에 없는 수치 · 역할 · 결과를 넣지 않는다(S-05). `actor` 가 `TEAM` · `UNKNOWN` 이면 「내가 한 일」로 바꿔 말하지 않는다(S-20) |
| `recommendations[].evidence` | 배열(0개 가능 — 근거 · 보완이 없는 경험). `{ "type": "CITATION" \| "SUPPLEMENT", "id" }` — `id` 는 **같은 경험의** `citations[].id` · `supplements[].id` 중 하나. 중복 없음 |
| `recommendations[].gaps` | 문자열 배열(0개 가능) — 문항에 필요한데 그 경험의 근거 · 보완에 없는 것 |
| `clarifications` | 배열 **0 ~ 3개**(SPEC S-22) |
| `clarifications[].experienceId` | `recommendations` 에 있는 경험 ID — 답이 그 경험의 보완이 되므로 추천하지 않은 경험엔 묻지 않는다 |
| `clarifications[].question` | 비지 않은 문자열. 그 경험 · 문항에 맞게 구체적으로. 근거 · 보완에 이미 있는 사실은 묻지 않는다(S-25). 답을 유도하는 수치 · 역할을 넣지 않는다(S-22) |
| `model` | 실제로 답한 LLM 이름. 선택 |

- 코드가 확인하는 것: 개수 · 값 목록 · **ID 가 요청에 있는지**(경험 · 근거 · 보완 — 지어낸 ID 면 위반). 이유 · 질문의 내용(수치 유도 · 같은 사실 다시 묻기)은 코드로 다 막을 수 없어 채점으로 잰다(AI#21 · `ai-scope.md`).
- 경험이 `[]` 면 `requirements` 는 전부 `NOT_FOUND`, `recommendations` · `clarifications` 는 `[]`.
- `questionType` 은 문항 쪽 해석이다 — 추천 · 되묻기를 고르는 데 쓰지 않아도 되고, 경험에 저장하지 않는다(SPEC 미결정 8 · 13). BE 는 문항에 `questionTypeBy: "AI"` 로 저장하되, 사용자가 이미 고른(`USER`) 문항이면 덮어쓰지 않는다. 지원처 종류 · 직무(S-42)는 요청에 싣지 않는다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `question.text` 가 없거나 비었음 · `experiences` 가 없음(`null`) · 경험 `id` 중복 |
| 413 | `TEXT_TOO_LONG` | 문항 텍스트와 경험의 `content` · `quote` · 보완 `question` · `answer` 를 합친 글자 수(코드 포인트)가 **100000** 을 넘음(AI 서버 `MAX_MATCH_CHARS`) — 경험 수백 개 분량. 넘치면 그때 후보 줄이기(ADR-003) |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(다시 시도한 뒤에도). 규칙에 맞게 잘라 내거나 고쳐서 돌려주지 않는다 |
| 504 | `LLM_TIMEOUT` | 제한 시간 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 문항을 `FAILED`(`AI_FAILED`, `message` 에 위 `code`)로 둔다 — `/extract` 와 같다.

## 입구 셋 — 공통 (S-28 · S-29 · S-30)

- 부르는 곳: BE entrance-api 가 FE 요청을 받은 그 자리에서(동기 — 작업 없음). 결과를 BE 는 **저장하지 않고** FE 에 넘긴다.
- 오류 표는 셋 다 같다 — 아래 「POST /parse-application」 끝. BE 는 어떤 오류든 FE 에 502 `AI_FAILED`(`message` 에 AI 쪽 `code`), 시간을 넘기면 504 `AI_TIMEOUT` 으로 돌려준다.
- 응답 규칙을 어기면 AI 서버가 한 번 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 이다. 규칙에 맞게 잘라 내거나 고쳐서 돌려주지 않는다.

## POST /route — 홈 입력 가르기

- SPEC: `F-10` / `S-28`(`P0`) · `S-29`(`ASK`) — [ADR-007](../decisions/ADR-007-chagok-entrance-agent.md)

요청

```json
{ "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요.", "totalLength": 35 }
```

| 필드 | 값 |
| --- | --- |
| `text` | 홈 입력의 **앞 4000자**(코드 포인트). BE 가 자른다. 비지 않은 문자열 |
| `totalLength` | 자르기 전 전체 길이(코드 포인트). 긴 글이면 자료일 가능성이 높다는 단서 |

응답 200

```json
{ "kind": "APPLICATION", "reason": "지원서가 묻는 문항 문장이다", "model": "<LLM 모델 이름>" }
```

| 필드 | 규칙 |
| --- | --- |
| `kind` | README 「값 목록」 `entranceKind` 하나. `SOURCE` 내가 한 일을 적은 글(회고 · README · 이력서 · 노트 · 회의록) · `APPLICATION` 지원처가 묻는 문항 · 모집 공고 · `ASK` 내 경험을 찾아 달라는 물음(「~ 한 적 있었나?」) · `UNSURE` 둘 이상으로 읽힌다 — **애매하면 `UNSURE`**(틀리게 넘기는 것보다 묻는 게 싸다) |
| `reason` | 비지 않은 한 문장(최대 200자). AI 해석 |
| `model` | 실제로 답한 LLM 이름. 선택 |

- LLM 한 번 + 분기(ADR-007). 맞게 가른 비율은 시험 입력 묶음으로 재고 `ai-scope.md` 에 남긴다.
- `/route` 400: `text` 가 비었거나 4000자를 넘음.

## POST /ask — 한 줄 질문에 맞는 경험

- SPEC: `F-10` / `S-29`(`P1`) — 규칙은 `S-20` 과 같다

요청 — `experiences` 는 「POST /match」 요청의 `experiences` 와 **같은 모양**이다(사용자의 경험 전부 · 근거 · 보완). BE 는 경험이 0개면 부르지 않는다.

```json
{
  "query": "동아리에서 의견 모아 본 적 있었나?",
  "experiences": [
    {
      "id": 102,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "매주 금요일 스프린트 회고를 했다",
      "competencies": ["COLLABORATION"],
      "actor": "TEAM",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 202, "quote": "팀은 매주 금요일 스프린트 회고를 했다." }],
      "supplements": []
    }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `query` | 질문(BE 한도 2000자). 비지 않은 문자열 |
| `experiences` | 「POST /match」와 같다. 1개 이상 · `id` 중복 없음 |

응답 200

```json
{
  "recommendations": [
    {
      "experienceId": 102,
      "reason": "팀이 매주 회고로 의견을 모은 자리라 질문과 맞는다. 회고를 내가 이끌었는지는 자료에 없다",
      "evidence": [{ "type": "CITATION", "id": 202 }]
    }
  ],
  "model": "<LLM 모델 이름>"
}
```

| 필드 | 규칙 |
| --- | --- |
| `recommendations` | 배열 **0 ~ 3개**, 더 잘 맞는 것부터. 맞는 게 없으면 `[]` — 억지로 채우지 않는다 |
| `recommendations[].experienceId` · `reason` · `evidence` | 「POST /match」 응답 규칙의 같은 이름 필드와 **같다** — 요청에 있는 경험 ID · 추천끼리 중복 없음, `reason` 에 경험 · 근거 · 보완에 없는 수치 · 역할 · 결과를 넣지 않고 `TEAM` · `UNKNOWN` 을 「내가 한 일」로 바꿔 말하지 않는다, `evidence` 는 **같은 경험의** 근거 · 보완 ID |
| `model` | 실제로 답한 LLM 이름. 선택 |

- 요구사항 · 되묻기 · 문항 유형은 없다(지원을 만들지 않는다). 안에서 `/match` 의 코드를 같이 써도 된다 — 응답 모양만 지킨다.
- `/ask` 400: `query` 가 비었음 · `experiences` 가 없거나 0개 · 경험 `id` 중복. 413 `TEXT_TOO_LONG`: 「POST /match」와 같은 셈(`MAX_MATCH_CHARS`).

## POST /parse-application — 문항 · 공고에서 지원처 · 종류 · 직무 · 문항 나누기

- SPEC: `F-10` / `S-30`(`P1`) · 미결정 12(붙여 넣은 공고) · `S-42`

요청

```json
{ "text": "[OO 백엔드 부트캠프 4기 모집]\n모집 분야: 백엔드(Spring)\n\n자기소개서 문항\n1. 기술적인 문제를 해결한 경험을 구체적으로 적어 주세요. (500자)\n2. 지원 동기와 수료 후 목표를 적어 주세요. (500자)" }
```

| 필드 | 값 |
| --- | --- |
| `text` | 붙여 넣은 문항 · 공고 글 그대로(BE 한도 20000자). 비지 않은 문자열 |

응답 200

```json
{
  "organization": "OO 백엔드 부트캠프 4기",
  "organizationType": "BOOTCAMP",
  "jobRole": "BACKEND",
  "questions": [
    "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요. (500자)",
    "지원 동기와 수료 후 목표를 적어 주세요. (500자)"
  ],
  "model": "<LLM 모델 이름>"
}
```

| 필드 | 규칙 |
| --- | --- |
| `organization` | `null` 또는 비지 않은 문자열(최대 100자) — **요청 `text` 에 들어 있는 글자**여야 한다(아래 「적혀 있나」). 지어낸 이름이면 위반 |
| `organizationType` · `jobRole` | README 「값 목록」 값 하나 또는 `null`. AI 해석 — 확실하지 않으면 `null`. 목록 밖 값은 위반 |
| `questions` | 문자열 배열 **0 ~ 10개**, 글에 나온 순서대로, 중복 없음, 각각 비지 않고 최대 5000자. **각각 요청 `text` 에 적혀 있어야 한다** — 문항을 만들거나 다듬어 쓰지 않는다(R-03 범위 제외). 앞 번호(「1.」)는 빼도 된다. 글이 문항 하나뿐이면 그 하나. 못 찾으면 `[]` |
| `model` | 실제로 답한 LLM 이름. 선택 |

- **적혀 있나** — 코드로 확인한다: 양쪽의 연속 공백(줄바꿈 포함)을 공백 하나로 줄인 뒤 요청 `text` 의 부분 문자열이면 적혀 있다.
- `/parse-application` 400: `text` 가 비었음. 413 `TEXT_TOO_LONG`: 20000자를 넘음.

### 오류 — 입구 셋 공통

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 위 엔드포인트마다 적은 경우 |
| 413 | `TEXT_TOO_LONG` | 위 엔드포인트마다 적은 경우 |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 응답 규칙을 벗어남(다시 시도한 뒤에도) |
| 504 | `LLM_TIMEOUT` | 50초 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

## GET /health — 살아 있나

- 부르는 곳: Docker Compose healthcheck · BE 시작 확인

응답 200

```json
{ "status": "ok" }
```

LLM 을 부르지 않는다(키가 맞는지는 확인하지 않는다).
