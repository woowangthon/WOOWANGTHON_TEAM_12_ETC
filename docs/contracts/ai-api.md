# ai-api — BE → AI

> 스프린트 1 「경험 관리」(SPEC F-02 — `POST /extract`) · 스프린트 2 「문항 매칭」(SPEC R-03 — `POST /match`) · 근거 점검(SPEC S-45 — `POST /ground-check`, `P1`) · 답변 초안(SPEC S-27 — `POST /draft`, `P1`) · 스프린트 3 「입구 하나」(SPEC F-10 — `POST /route` · `POST /ask` · `POST /parse-application`) · 이어짐 제안(SPEC S-35 — `POST /link-suggestions`, `P1`) · 차곡이 도구 루프(SPEC S-31 — `POST /agent`, `P1`) · 작성 지침 정리(SPEC S-49 — `POST /guidelines`, `P1`). 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).
> AI 서버는 DB 를 만지지 않고 상태가 없다 — 받은 텍스트로 JSON 만 돌려준다([ADR-003](../decisions/ADR-003-stack-and-ai-boundary.md)). 저장 · ID · 사용자 구분은 BE.

- 부르는 곳: BE 만, 내부망으로([ADR-004](../decisions/ADR-004-deploy.md)). 인증 없음.
- 주소: `http://<AI 서버>:<포트>` — 값은 BE 설정(compose 서비스 이름).
- 시간: 한 번 부르는 데 수십 초 걸릴 수 있다. BE 는 제한 시간(BE `AI_TIMEOUT_SECONDS`, 기본 120초)을 넘으면 끊고 작업을 `FAILED`(`AI_TIMEOUT`)로 둔다. AI 서버는 BE 의 작업 상태를 모른다. AI 서버는 LLM 폴백 · 다시 시도까지 합쳐 100초 안에 답하거나 `LLM_TIMEOUT` 으로 돌려준다(`LLM_TIMEOUT_SECONDS`). `/extract` · `/match` · `/ground-check` · `/draft` 모두 같다.
- 입구 셋(`/route` · `/ask` · `/parse-application`) · 이어짐 제안(`/link-suggestions`) · 지침 정리(`/guidelines`)는 사용자가 화면에서 기다리는 **동기** 호출이다(entrance-api · experience-api · guideline-api) — BE 는 60초(`AI_SYNC_TIMEOUT_SECONDS`)에서 끊고, AI 서버는 폴백 · 다시 시도까지 합쳐 **50초** 안에 답하거나 `LLM_TIMEOUT` 이다(`LLM_SYNC_TIMEOUT_SECONDS`).

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
      "category": "PROJECT",
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
    { "name": "캡스톤 「바꿔요」", "period": { "start": "2025", "end": "2025", "ongoing": false }, "sameAsActivityId": 7, "category": "PROJECT", "experiences": [] },
    { "name": "알고리즘 스터디", "period": { "start": "2024-09", "end": null, "ongoing": true }, "sameAsActivityId": 8, "category": "STUDY", "experiences": [
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
| `activities[].category` | 활동 분류(S-57) — README 「값 목록」 `activityCategory` 값 하나 또는 `null`. 늘 싣는다. 활동 이름 · 내용으로 가장 가까운 하나를 고르고, 가늠이 안 되면 `null` — 억지로 고르지 않는다. 목록 밖 값은 규칙 위반이다. 원문에서 확인한 사실이 아니라 AI 해석이다 |
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

## POST /ground-check — 내가 쓴 답의 근거 점검

- 부르는 곳: BE 근거 점검 작업(question-api `POST /api/questions/{questionId}/grounding-check` 뒤)
- SPEC: `F-09` / `S-45` — 우선순위 `P1`

사용자가 쓴 답을 **코드로** 문장으로 나누고, 문장마다 그 사용자의 경험(근거 · 보완)이 받치는지 판정한다. 판정은 LLM 이 하고, 지어낸 ID · 문장 속 숫자는 **코드가** 막는다(S-04 원문 대조 코드 — AI `app/citations.py` 의 맞추기 기준을 다시 쓴다).

요청 — question-api 「근거 점검」 예시. 경험은 `/match` 와 같은 모양이다(예시는 101 · 103 · 106 만 — 실제로는 경험 전부).

```json
{
  "text": "저는 「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제를 WebSocket 으로 바꿔 해결했습니다. 서버에 STOMP 엔드포인트를 만들고 앱의 폴링 코드를 구독 방식으로 바꿨습니다. 그 결과 응답 속도가 80% 빨라졌고 사용자 만족도가 크게 올랐습니다. 배포까지 제가 맡아 AWS 에 올렸습니다. 이 경험으로 문제의 원인을 끝까지 찾는 개발자가 되고 싶습니다.",
  "experiences": [
    {
      "id": 101,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 201, "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다." }],
      "supplements": [{ "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }]
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
      "id": 106,
      "activityName": "알고리즘 스터디",
      "period": { "start": "2024-09", "end": null, "ongoing": true },
      "content": "스터디원 6명의 풀이를 매주 리뷰했다",
      "competencies": ["LEARNING"],
      "actor": "ME",
      "sourceStatus": "USER_ENTERED",
      "citations": [],
      "supplements": []
    }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `text` | 점검할 답(BE 한도 5000자). 비지 않은 문자열 |
| `experiences` | 사용자의 경험 전부 — `/match` 요청과 같은 모양. **0개면 `[]`** — 오류가 아니다 |
| `experiences[].citations` | **원본에서 찾은 근거만**(`matched: true`) `{ id, quote }`. 확인 못 한 근거는 싣지 않는다 — 「원문」으로 칠하지 않게 |
| `experiences[].sourceStatus` | `USER_ENTERED` 인 경험만 본문(`content`)이 근거(`EXPERIENCE`)가 될 수 있다 — 사용자가 직접 넣거나 고친 글이라 「내가 입력」이다. AI 가 뽑은 본문(`SOURCE_CONFIRMED` · `NEEDS_REVIEW`)은 근거가 아니다(근거는 발췌문이다) |

응답 200

```json
{
  "sentences": [
    { "text": "저는 「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제를 WebSocket 으로 바꿔 해결했습니다.", "status": "SOURCE", "evidence": [{ "type": "CITATION", "id": 201 }], "note": null },
    { "text": "서버에 STOMP 엔드포인트를 만들고 앱의 폴링 코드를 구독 방식으로 바꿨습니다.", "status": "USER_INPUT", "evidence": [{ "type": "SUPPLEMENT", "id": 301 }], "note": null },
    { "text": "그 결과 응답 속도가 80% 빨라졌고 사용자 만족도가 크게 올랐습니다.", "status": "UNSUPPORTED", "evidence": [], "note": "문장의 숫자(80)가 받치는 근거 · 보완에 없어요" },
    { "text": "배포까지 제가 맡아 AWS 에 올렸습니다.", "status": "UNSUPPORTED", "evidence": [], "note": "자료엔 배포를 팀원이 맡았다고 되어 있어요" },
    { "text": "이 경험으로 문제의 원인을 끝까지 찾는 개발자가 되고 싶습니다.", "status": "OPINION", "evidence": [], "note": null }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 예시 읽는 법: 셋째 문장에 LLM 이 「201 이 받친다」고 답했어도 코드가 「80」을 201 에서 못 찾아 `UNSUPPORTED` 로 돌리고 `note` 를 쓴다. 넷째는 103 이 `TEAM` 인데 「제가 맡아」라서 근거 없음이다(LLM 판정 — 채점으로 잰다). 「스터디원 6명의 풀이를 리뷰했다」는 문장이 있었다면 `USER_INPUT` · `{ "type": "EXPERIENCE", "id": 106 }` 이다(106 은 직접 넣은 경험이고 「6」이 본문에 있다).

### 문장 나누기 — 코드가 한다

LLM 이 문장을 다시 쓰거나 빠뜨리지 않게 AI 서버 코드가 나눈다. 판정만 LLM 에 문장 번호로 묻는다.

- `.` `?` `!` `…` `。` 뒤에 공백 · 줄바꿈 · 글 끝이 오면 거기서 끊는다(「3.5」 「v2.1」 은 뒤에 공백이 없어 끊지 않는다). 줄바꿈에서도 끊는다.
- 끊은 조각의 앞뒤 공백을 걷는다. 빈 조각은 버린다. 글자는 바꾸지 않는다 — `sentences[].text` 는 요청 `text` 의 이어진 일부다.

### 응답 규칙 — 어기면 AI 서버가 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 으로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `sentences` | 위 「문장 나누기」의 결과와 개수 · 순서 · 글자가 같다(코드가 만든다) |
| `sentences[].status` | README 「값 목록」 `groundingStatus` |
| `sentences[].evidence` | `{ "type", "id" }` 배열, 중복 없음. `SOURCE` → `CITATION` 1개 이상(`SUPPLEMENT` · `EXPERIENCE` 가 같이 와도 된다). `USER_INPUT` → `SUPPLEMENT` · `EXPERIENCE` 만 1개 이상. `UNSUPPORTED` · `OPINION` → `[]`. `id` 는 **요청에 있는** 근거 · 보완 · 경험 ID — `EXPERIENCE` 는 `sourceStatus: USER_ENTERED` 경험만 |
| `sentences[].note` | `UNSUPPORTED` 면 비지 않은 한 줄 — 왜 근거 없음인지(자료에 없는 결과 · 수치 · 「팀이 했다」를 「내가 했다」로 · 확인 못 한 내용). 그 밖엔 `null` |
| `model` | 실제로 답한 LLM 이름. 선택 |

판정 규칙(프롬프트 · 채점):

- 받친다 = 문장의 사실(한 일 · 결과 · 역할 · 수치)이 근거 · 보완 · 본문에 **다 있다**. 일부만 있으면 받치지 않는다 — 「해결했다」만 있는데 「만족도가 크게 올랐다」를 더한 문장은 `UNSUPPORTED`(과장).
- `TEAM` · `UNKNOWN` 경험의 일을 「내가 · 제가」로 쓴 문장은 `UNSUPPORTED`. 「팀이 함께」로 쓰면 받칠 수 있다.
- `OPINION` 은 지난 일 · 결과에 대한 주장이 없는 문장만 — 동기 · 포부 · 느낌 · 배운 점 · 이어 주는 말(「이 경험으로 저는…」). 지난 일을 말하면서 근거가 없는 문장을 `OPINION` 으로 빼지 않는다.

코드가 LLM 판정 뒤에 확인한다 — 고칠 수 있는 것은 **엄하게** 고치고(근거 있음 → 근거 없음 쪽으로만), 고칠 수 없는 것은 위반이다.

- 지어낸 `id` · `type` 과 `status` 가 안 맞음 · 문장 수가 다름 → 위반(다시 시도 → `LLM_INVALID_OUTPUT`).
- **숫자 대조**: 문장 속 숫자(연속된 숫자 — `3`, `80`, `1,200`, `3.5`)가 그 문장 `evidence` 의 글(발췌문 · 보완 답 · 경험 본문)과 그 경험의 활동 이름 · 기간에 **하나라도 없으면** `UNSUPPORTED` · `evidence: []` · `note: "문장의 숫자(<숫자>)가 받치는 근거 · 보완에 없어요"`. 맞추는 기준은 S-04 대조와 같다(NFKC · 공백 무시). `OPINION` 문장에 숫자가 있어도 같다 — 숫자가 든 문장은 생각이 될 수 없다. LLM 이 이미 `UNSUPPORTED` 로 둔 문장은 고칠 것이 없어 그 `note` 를 그대로 둔다 — 「자료엔 팀원이 맡았다」 같은 까닭이 숫자 문구로 덮이지 않게. 한글 수사(「세 번」)는 코드가 못 잡는다 — 채점으로 잰다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `text` 가 없거나 공백뿐(나눈 문장이 0개) · `experiences` 가 없음(`null`) · 경험 `id` 중복 |
| 413 | `TEXT_TOO_LONG` | `text` 와 경험 글을 합친 글자 수가 **100000** 을 넘음(`/match` 와 같은 `MAX_MATCH_CHARS`) |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(다시 시도한 뒤에도). 그럴듯하게 고쳐서 돌려주지 않는다 — 숫자 대조로 `UNSUPPORTED` 로 돌리는 것만 예외(엄한 쪽) |
| 504 | `LLM_TIMEOUT` | 제한 시간 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 점검을 `FAILED`(`AI_FAILED`, `message` 에 위 `code`)로 둔다 — `/match` 와 같다.

## POST /draft — 고른 경험으로 답변 초안

- 부르는 곳: BE 초안 작업(question-api `POST /api/questions/{questionId}/draft` 뒤)
- SPEC: `F-09` / `S-27` · `S-05` · `S-20` — 우선순위 `P1`

사용자가 고른 경험(1 ~ 3개)으로 그 문항의 답변 초안을 **문장 배열**로 쓴다. 사실 문장(`FACT`)마다 받치는 근거 · 보완을 붙이고, 받칠 게 없는 사실은 쓰지 않고 `omitted` 로 돌려준다. 연결 · 직무 관련성 · 포부는 `OPINION` 으로 구분해 제안한다. 지어낸 ID · 문장 속 숫자는 **코드가** 막는다 — 숫자 대조는 `/ground-check` 와 같은 코드를 쓴다.

요청 — question-api 「답변 초안」 예시(문항 A + 경험 101). 경험은 `/match` 와 같은 모양이고 **고른 경험만** 싣는다. 문항 A 의 매칭 결과(요구사항 · 추천 101 의 이유 · 강조점 · 부족한 점)와 지원의 직무를 함께 싣는다(ETC#141).

```json
{
  "question": {
    "organization": "OO 백엔드 부트캠프",
    "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.",
    "jobRole": "BACKEND",
    "frame": "STAR",
    "requirements": [
      { "text": "기술 문제의 원인을 찾아 해결한 경험", "status": "SUPPORTED" },
      { "text": "해결한 뒤 결과를 확인한 방법", "status": "NOT_FOUND" },
      { "text": "Java · Spring 사용 경험", "status": "NOT_FOUND" }
    ]
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
      "citations": [{ "id": 201, "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다." }],
      "supplements": [{ "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }],
      "reason": "채팅 지연이라는 기술 문제를 직접 해결한 사례라 문항과 맞는다",
      "emphasis": "폴링의 한계를 보고 WebSocket 으로 바꾼 판단",
      "gaps": ["직접 고친 범위가 자료에 없다", "고친 뒤 확인한 방법이 자료에 없다"]
    }
  ],
  "guidelines": [
    { "id": 901, "text": "첫 문장에 무엇을 했고 어떻게 됐는지 먼저 쓴다" },
    { "id": 905, "text": "결과는 꼭 수치로 쓴다" }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `question.organization` · `question.text` | `/match` 와 같다 |
| `question.jobRole` | 선택. 그 문항이 속한 지원의 직무 — README 「값 목록」 `jobRole` 값 하나(S-42). 지원에 직무가 없으면(동아리 · 비교과 등) **싣지 않는다**(`null` 도 같게 읽는다) |
| `question.frame` | 선택. 구성 틀 — README 「값 목록」 `draftFrame` 값 하나(S-50). 없거나 `NONE` 이면 기본 순서로 쓴다(아래 「구성 틀 · 작성 지침」) |
| `question.requirements` | 선택. 그 문항의 매칭 요구사항 `{ text, status }` 배열 — question-api `Requirement` 에서 `experienceIds` 를 뺀 것, 저장된 순서 그대로. 없거나 `[]` 면 문항만 보고 쓴다 |
| `experiences` | 사용자가 고른 경험 **1 ~ 3개**, 고른 순서대로 — `/match` 요청과 같은 모양. `id` 중복 없음 |
| `experiences[].citations` | **원본에서 찾은 근거만**(`matched: true`) `{ id, quote }` — `/ground-check` 와 같다. 확인 못 한 근거는 싣지 않는다 |
| `experiences[].supplements` | 보완 `{ id, question, answer }` 전부. 사용자가 직접 말한 사실이다(「내가 입력」) |
| `experiences[].sourceStatus` | `USER_ENTERED` 인 경험만 본문(`content`)이 근거(`EXPERIENCE`)가 될 수 있다 — `/ground-check` 와 같다 |
| `experiences[].reason` · `emphasis` · `gaps` | 선택. 그 문항의 추천에서 **이 경험의** 이유 · 강조점(문자열) · 부족한 점(문자열 배열) — question-api `Recommendation` 그대로. 없으면 싣지 않는다 |
| `guidelines` | 선택. 사용자가 켜 둔 작성 지침 `{ id, text }` **0 ~ 10개**(S-49 — guideline-api), `id` 중복 없음. 없거나 `[]` 면 지침 없이 쓴다 |

**매칭 결과 · 직무는 AI 해석이라 근거가 아니다**(ETC#141). 무엇을 앞세우고 무엇을 빈칸으로 볼지 정하는 **단서**로만 쓴다.

- 선택 칸이 하나도 없으면 지금과 똑같이 동작한다 — BE 가 아직 싣지 않아도 깨지지 않는다. 있는 것만 쓴다(경험마다 있고 없고가 달라도 된다).
- `evidence` 로 붙일 수 없다 — ID 가 없고, `type` 에도 없다. 숫자 대조의 「받치는 글」에도 넣지 않는다 — 강조점 · 이유에만 있는 숫자는 `FACT` 에 쓸 수 없다.
- 강조점은 **근거로 받칠 수 있는 만큼만** 앞세운다 — 문장 순서 · 비중을 정할 뿐 사실을 더하지 않는다. 강조점에 쓸 사실이 근거 · 보완 · 본문에 없으면 쓰지 않고 `omitted` 로. 예시의 「폴링의 한계를 보고 … 판단」은 근거 201 이 「바꿔 해결했다」까지만 받치므로 「한계를 판단했다」를 사실 문장으로 만들지 않는다 — 근거 규칙이 우선이다(SPEC 미결정 16 과 같은 순서).
- `gaps` · `requirements[].status: NOT_FOUND` 는 `omitted` 를 고르는 단서다. 다만 **매칭 때의 것**이라 그 뒤 생긴 보완이 이미 채웠을 수 있다 — 예시의 「직접 고친 범위」는 보완 301 이 채웠으니 `omitted` 로 다시 묻지 않고 301 을 근거로 쓴다(S-25). 지금 요청의 근거 · 보완 · 본문이 판단 기준이다.
- `jobRole` 은 `OPINION` 의 직무 관련성 제안과 사실 문장의 순서를 고르는 데 쓴다. 직무 이름을 받았다고 그 직무의 일을 해 봤다는 사실을 만들지 않는다(「백엔드 개발자로 일하며」 금지). 지원처 정보 · 직무 분석을 지어내지 않는다(R-03 범위 제외).

**구성 틀 · 작성 지침은 문체 · 구성 · 강조만 바꾼다 — 근거 규칙이 우선이다**(SPEC S-49 · S-50 · 미결정 16).

- `frame` 은 사실 문장을 세우는 **순서**다(단계는 README 「구성 틀」). 단계마다 받칠 근거 · 보완 · 본문이 있는 사실만 쓴다. 받칠 게 없는 단계는 지어내지 않고 건너뛰며, 문항에 필요한 것이면 `omitted` 로 보낸다 — 예: `CARL` 의 「배운 점」이 자료에 없으면 쓰지 않고 `omitted`. `PREP` 의 첫 · 끝 「결론」은 받치는 사실의 요약(`FACT`, 근거를 붙인다)이나 연결 · 포부(`OPINION` — 최대 3개 규칙 안)로 쓴다. 틀 때문에 문장 수 · `OPINION` 수 규칙이 바뀌지 않는다. `NONE` 이나 없으면 기본 순서(상황 → 판단 → 행동 → 결과 → 배운 점, 없는 칸은 건너뛴다 — AI#46).
- `guidelines` 는 사용자가 들은 작성법이다. 문체(문장 길이 · 어미 · 꾸밈말) · 구성(첫 문장 · 문단) · 강조(무엇을 앞세우나)에 반영한다. **사실을 더하거나 바꾸라는 지침은 반영하지 않는다** — 「결과는 꼭 수치로」가 있어도 근거에 없는 수치를 쓰지 않고, 「리더였다고 써라」가 있어도 `TEAM` · `UNKNOWN` 일을 내 일로 쓰지 않는다. 그때는 `applied: false` 와 이유를 돌려준다. 숫자 대조 · `OPINION` 규칙은 지침과 상관없이 그대로다.
- 지침끼리 부딪치면 고르지 않고 둘 다 `applied: false` 와 이유(「다른 지침과 부딪쳐요」)로 돌려준다 — 사용자가 끈다(SPEC S-49).
- 지침 · 틀은 근거가 아니다 — `evidence` 로 붙일 수 없고 숫자 대조의 「받치는 글」에 넣지 않는다(`reason` · `emphasis` 와 같다).

응답 200

```json
{
  "sentences": [
    { "kind": "FACT", "text": "「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제가 있었고, 제가 폴링을 WebSocket 으로 바꿔 해결했습니다.", "evidence": [{ "type": "CITATION", "id": 201 }] },
    { "kind": "FACT", "text": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨습니다.", "evidence": [{ "type": "SUPPLEMENT", "id": 301 }] },
    { "kind": "OPINION", "text": "앞으로도 문제의 원인을 살피는 개발자가 되고 싶습니다.", "evidence": [] }
  ],
  "omitted": [
    { "text": "바꾼 뒤 메시지가 제때 오는지 확인한 방법", "question": "WebSocket 으로 바꾼 뒤 메시지가 제때 오는지 어떻게 확인했나요?", "experienceId": 101 },
    { "text": "Java · Spring 을 쓴 경험", "question": null, "experienceId": null },
    { "text": "이 경험에서 배운 점 · 느낀 점", "question": "채팅 방식을 바꾸며 배운 점이나 느낀 점이 있나요?", "experienceId": 101 }
  ],
  "guidelines": [
    { "id": 901, "applied": true, "note": null },
    { "id": 905, "applied": false, "note": "결과를 보여 줄 수치가 자료에 없어 넣지 않았어요" }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 예시 읽는 법: 「직접 고친 부분」은 보완 301 이 받치니 그 문장의 근거는 301 이다 — 매칭 때 `gaps` 에 있던 것이지만 지금은 보완이 있다. 「확인한 방법」 · 「Java · Spring」은 요구사항 `NOT_FOUND` 였고 지금도 받칠 게 없다. 이 둘과 느낀 점은 쓰지 않고 `omitted` 로 간다 — 「빨라졌습니다」 「뿌듯했습니다」를 지어 붙이지 않는다. 직무 `BACKEND` 는 생각 문장(포부)의 방향만 정했다 — 백엔드 일을 해 봤다는 사실로 쓰지 않는다. `TEAM` 경험 102(「팀은 매주 금요일 스프린트 회고를 했다」)를 같이 골랐다면 「팀은 매주 금요일 스프린트 회고를 했습니다」로 쓰고 「제가」로 바꾸지 않는다. BE 는 `evidence` 에 `experienceId` · `activityId` · `text` 를 붙여 저장한다(question-api `Draft`).

### 응답 규칙 — 어기면 AI 서버가 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 으로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `sentences` | 배열 **1 ~ 15개**, 글의 순서대로. **0개는** 고른 경험에 받칠 것(근거 · 보완 · `USER_ENTERED` 본문)이 하나도 없을 때만 — 받칠 것이 있는데 0개면 위반. 받칠 것이 없으면 생각만으로 채우지 않고 `sentences: []` 와 `omitted` 를 반환한다 |
| `sentences[].kind` | 필수, README `draftSentenceKind`: `FACT` · `OPINION`. `OPINION` 은 전체 15개 안에서 최대 3개(0개도 가능) |
| `sentences[].text` | 비지 않은 문장 하나 — 줄바꿈 없음. 경험 · 근거 · 보완에 없는 수치 · 역할 · 결과를 넣지 않는다(S-05). `TEAM` · `UNKNOWN` 경험의 일을 「내가 · 제가」로 쓰지 않는다(S-20). `TEAM` 은 「팀은 · 팀이 함께」로 쓴다. `UNKNOWN` 은 누가 했는지 쓰지 않는다 — 「팀은」도 자료에 없는 말이다. 일어난 일 · 원인을 주어로 쓰고(「코드가 수정됐습니다」), 내 몫은 `omitted` 로 |
| `sentences[].evidence` | `{ "type", "id" }` 배열. `FACT` 는 **1개 이상**, `OPINION` 은 `[]`. 중복 없음. `type` 은 `CITATION` · `SUPPLEMENT` · `EXPERIENCE`. `id` 는 **요청에 있는** 근거 · 보완 · 경험 ID — `EXPERIENCE` 는 `sourceStatus: USER_ENTERED` 경험만. 한 문장이 여러 경험의 근거를 같이 붙여도 된다 |
| `omitted` | `{ text, question, experienceId }` 객체 배열 **0 ~ 5개**, 중요한 것부터. 필드는 모두 필수(`null` 허용은 아래). 추천의 `clarifications` 최대 3개와 별개(S-27) |
| `omitted[].text` | 문항에 필요한데 고른 경험의 근거 · 보완 · 직접 입력한 본문에 없어 쓰지 않은 것, 공백뿐이 아닌 짧은 구절. 답을 유도하는 수치 · 역할을 넣지 않는다 |
| `omitted[].experienceId` | 그 사실을 보완할 **요청 `experiences` 중 하나의 정수 ID**. 어느 경험의 빈칸인지 붙일 수 없으면 `null` — 새 경험 ID 를 만들거나 임의의 경험에 붙이지 않는다 |
| `omitted[].question` | `experienceId` 가 있으면 그 경험 · 문항에 맞는 구체적인 질문(공백뿐인 문자열 금지). `experienceId: null` 이면 반드시 `null`. 질문만 `null` 이거나 경험만 `null` 인 조합은 금지 |
| `guidelines` | 요청 `guidelines` 마다 **하나씩, 같은 순서로** `{ id, applied, note }`. 요청에 지침이 없으면 `[]`(빼도 `[]` 로 읽는다). `applied` 는 `true` · `false`. `applied: true` 면 `note: null`, `false` 면 `note` 는 왜 못 했는지 한 줄(1 ~ 80자, 화면에 그대로 보인다 — 「자료에 수치가 없어 넣지 않았어요」) |
| `model` | 실제로 답한 LLM 이름. 선택 |

쓰는 규칙(프롬프트 · 채점):

- 받친다 = 문장의 사실(한 일 · 결과 · 역할 · 수치)이 붙인 근거 · 보완 · 본문에 **다 있다** — `/ground-check` 의 「받친다」와 같은 기준. 근거를 매끄럽게 옮겨 쓰는 건 되지만, 「해결했다」에 「크게 개선했다」를 더하지 않는다.
- `OPINION` 은 사실 주장이 없는 **연결 · 직무 관련성 · 포부 제안만** 허용한다. 근거는 `[]` 이며 「AI 제안 — 확인 필요」로 보인다. 숫자 · 감정 지어내기(「뿌듯했습니다」) · 칭찬 · 의미 단정은 금지한다. 자료에 있는 배운 점 · 감정은 `FACT` 로 근거를 붙인다.
- 과거의 일 · 역할 · 결과 · 수치나 지원처 정보를 `OPINION` 으로 빼지 않는다. 사실과 생각이 섞인 문장도 사실 부분의 근거 규칙을 피할 수 없다. `TEAM` · `UNKNOWN` 일을 내 일로 쓰지 않는 규칙은 종류와 무관하다. S-34 의 생각 · 계기 기록은 요청 재료나 근거로 넣지 않는다.
- `/ground-check` 의 `status: OPINION` 은 사용자가 쓴 글을 점검하는 판정이다. 초안의 `kind: OPINION` 은 AI 생성 범위라 더 좁다 — 점검에서 느낌을 생각으로 분류할 수 있어도 초안에서 감정을 만들 수는 없다. 초안의 종류를 점검 판정으로 그대로 쓰지 않고 글을 다시 점검한다.
- ETC#67 에서 근거 0개를 새 사실로 간주하지 않는다. `OPINION` · 생각 · 포부는 새 경험 후보에서 제외하고, 사용자가 확정한 글 중 새로 쓴 사실만 후보로 삼는다.
- 문항에 필요한 사실 · 실제 느낀 점인데 받칠 게 없는 것은 `omitted` 로 — `OPINION` 으로 대체해 빈칸이 채워진 것으로 보지 않는다.
- 경험에 연결된 빈칸은 사용자가 답할 수 있는 짧은 질문으로 묻는다. 원본 · 보완 · 직접 입력한 본문에 이미 있는 사실은 묻지 않고, 수치 · 역할을 유도하거나 「더 자세히」처럼 막연하게 묻지 않는다(S-22). 질문 품질은 채점으로 확인한다(AI#47).
- 지원 동기처럼 경험에 붙지 않는 빈칸은 `question: null` · `experienceId: null`. 예시의 「Java · Spring 을 쓴 경험」도 선택한 경험에서 그 사용 여부를 확인할 수 없어 특정 경험에 붙이지 않았다. 기술을 썼다는 전제를 질문으로 만들지 않는다.
- 다시 만들기 요청에는 최신 보완이 들어온다. 그 답에 있는 사실을 기존 근거 규칙에 따라 `SUPPLEMENT` 로 쓰고, 이미 보완한 사실은 다시 묻지 않는다. 보완의 **질문은 사실 근거가 아니며 답만** 근거다. `clarificationId` · `supplementId` 는 BE 가 관리하고 AI 응답에는 없다.

코드가 확인하는 것 — 어기면 다시 시도한 뒤 `LLM_INVALID_OUTPUT`. 규칙에 맞게 문장을 빼거나 근거를 바꿔서 돌려주지 않는다.

- 개수 · 값 목록 · 지어낸 `id` · `EXPERIENCE` 가 `USER_ENTERED` 가 아닌 경험을 가리킴 · 근거 0개인 `FACT` · 근거가 붙은 `OPINION` · `OPINION` 3개 초과 · 받칠 것이 있는데 문장 0개.
- `omitted` 객체의 필수 필드 · 타입 · 공백뿐인 `text`/질문 · 요청 밖 `experienceId` · 질문과 경험의 `null` 짝. 이 검증은 `/draft` 에 적용한다. 문자열 배열인 예전 응답을 객체로 추측해 고치지 않는다.
- `guidelines` 의 `id` 가 요청과 개수 · 순서까지 같지 않음 · `applied` 와 `note` 의 짝이 틀림(`true` 인데 `note` 있음 · `false` 인데 `note` 없음 · 80자 넘음). 「반영했다」가 맞는지는 코드가 못 잰다 — 채점으로 잰다(지침을 켜도 받치지 않는 문장 · 없는 수치가 늘지 않는지 · 「수치로 써라」에 `applied: false` 를 돌려주는지).
- **숫자 대조**: `OPINION` 에 숫자가 하나라도 있으면 위반(활동 이름 · 기간에 있더라도 금지). `FACT` 는 문장 속 숫자가 그 문장 `evidence` 의 글(발췌문 · 보완 답 · 경험 본문)과 그 경험의 활동 이름 · 기간에 하나라도 없으면 위반 — 요청의 `reason` · `emphasis` · `gaps` · `requirements` 는 이 글에 넣지 않는다(ETC#141) — 기준은 `/ground-check` 「숫자 대조」와 같다(NFKC · 공백 무시). 한글 수사(「세 번」) · 「내가 한 일」로 바꿔 쓰기 · 근거에 없는 결과는 코드가 다 못 잡는다 — 채점으로 잰다(AI#26 · `ai-scope.md`). AI#48 은 사실을 `OPINION` 으로 빼는 수 · 감정 지어냄 · 지원 동기 문항의 전후 품질도 잰다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `question.text` 가 없거나 비었음 · `experiences` 가 없음 · 0개 · 4개 이상 · 경험 `id` 중복 · 선택 칸이 있는데 모양이 틀림(`jobRole` 이 목록 밖 값 · `requirements[].status` 가 `requirementStatus` 밖 값 · `gaps` 가 문자열 배열이 아님 · `frame` 이 `draftFrame` 밖 값 · `guidelines` 11개 이상 · 지침 `id` 중복 · 빈 `text` 등) |
| 413 | `TEXT_TOO_LONG` | 문항 텍스트와 경험 글(선택 칸의 요구사항 · 이유 · 강조점 · 부족한 점 · 지침 포함)을 합친 글자 수가 **100000** 을 넘음(`/match` 와 같은 `MAX_MATCH_CHARS`) |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(다시 시도한 뒤에도) |
| 504 | `LLM_TIMEOUT` | 제한 시간 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 초안을 `FAILED`(`AI_FAILED`, `message` 에 위 `code`)로 둔다 — `/match` 와 같다.

## POST /new-facts — 확정 답에서 새 경험 후보 찾기

- 부르는 곳: BE 후보 찾기 작업(question-api `POST /api/questions/{questionId}/answer/new-facts` 뒤)
- SPEC: `F-09` / `S-48` — 우선순위 `P1`

사용자가 확정한 답을 **코드로** 문장으로 나누고(「POST /ground-check」의 「문장 나누기」와 같다), 빼야 할 문장을 **코드가** 먼저 걷어 낸 뒤, 남은 문장 중 **사용자가 새로 쓴 사실**만 LLM 이 골라 경험 문장으로 옮긴다. 근거가 없다는 것만으로 고르지 않는다 — 생각 · 포장 · 기존 자료와 어긋나는 문장은 후보가 아니다(SPEC S-48).

요청 — question-api 「확정 답변」 예시. 경험은 `/ground-check` 와 같은 모양이다(예시는 101 · 103 만 — 실제로는 경험 전부).

```json
{
  "text": "「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제가 있었고, 제가 폴링을 WebSocket 으로 바꿔 해결했습니다. 서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨습니다. 바꾼 뒤에는 두 기기로 메시지를 보내 양쪽 화면에 바로 도착하는지 확인했습니다. 이어서 알림 기능도 같은 방식으로 바꿔 서버 요청을 하루 1,200회 줄였습니다. 배포까지 제가 맡아 AWS 에 올렸습니다. 누구보다 끈질기게 문제를 파고들었습니다. 앞으로도 문제의 원인을 살피는 개발자가 되고 싶습니다.",
  "experiences": [
    {
      "id": 101,
      "activityName": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [{ "id": 201, "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다." }],
      "supplements": [{ "id": 301, "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?", "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다" }]
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
    }
  ],
  "activities": [
    { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
    { "id": 8, "name": "알고리즘 스터디", "period": { "start": "2024-09", "end": null, "ongoing": true } }
  ],
  "excludedSentences": [
    "「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제가 있었고, 제가 폴링을 WebSocket 으로 바꿔 해결했습니다.",
    "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨습니다.",
    "앞으로도 문제의 원인을 살피는 개발자가 되고 싶습니다."
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `text` | 확정 답(BE 한도 5000자). 비지 않은 문자열 |
| `experiences` | 사용자의 경험 전부 — `/ground-check` 요청과 같은 모양 · 원본에서 찾은 근거만. **0개면 `[]`** — 오류가 아니다 |
| `activities` | 사용자의 활동 전부 `{ id, name, period }`. 0개면 `[]` — 그때 후보의 `activityId` 는 모두 `null` |
| `excludedSentences` | 후보로 삼지 않을 문장 — 그 문항의 저장된 초안 문장 · 전에 「저장 안 함」 한 문장. 없으면 `[]` |

응답 200

```json
{
  "candidates": [
    {
      "sentence": "바꾼 뒤에는 두 기기로 메시지를 보내 양쪽 화면에 바로 도착하는지 확인했습니다.",
      "content": "WebSocket 으로 바꾼 뒤 두 기기로 메시지를 보내 양쪽 화면에 바로 도착하는지 확인했다",
      "actor": "ME",
      "activityId": 7
    },
    {
      "sentence": "이어서 알림 기능도 같은 방식으로 바꿔 서버 요청을 하루 1,200회 줄였습니다.",
      "content": "알림 기능도 구독 방식으로 바꿔 서버 요청을 하루 1,200회 줄였다",
      "actor": "ME",
      "activityId": 7
    }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 예시 읽는 법: 첫째 · 둘째 · 일곱째 문장은 `excludedSentences` 와 같아 코드가 LLM 에 묻기 전에 뺐다. 다섯째 「배포까지 제가 맡아」는 경험 103(`TEAM`)과 어긋나고, 여섯째는 자기 칭찬 · 포장이라 LLM 이 고르지 않는다. 셋째 · 넷째만 자료 · 보완에 없는 지난 일 · 결과다.

### 빼는 문장 — 코드가 한다

- 문장을 나눈 뒤, `excludedSentences` 의 어느 문장과 **같은** 문장은 LLM 에 보내지 않는다. 같다 = S-04 대조 기준(NFKC · 공백 무시)으로 글자가 같다. 일부만 같거나 비슷하면 빼지 않는다(사용자가 고친 문장일 수 있다).
- 남은 문장이 0개면 LLM 을 부르지 않고 `{ "candidates": [] }` 를 돌려준다.

### 응답 규칙 — 어기면 AI 서버가 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 으로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `candidates` | 0 ~ **5**개, 확정 답의 순서대로. 문장 하나에 후보 하나까지 |
| `candidates[].sentence` | 코드가 나눈 문장 중 하나와 글자가 같다 · `excludedSentences` 에 없다(LLM 에는 문장 번호로 묻고 코드가 글을 채운다) |
| `candidates[].content` | 비지 않은 한 문장, 「~했다」 꼴. 원래 문장의 사실만 — 자기 칭찬 · 포장 · 생각은 걷어 낸다 |
| `candidates[].actor` | `ME` · `TEAM` · `UNKNOWN` — 원래 문장의 주어로(「제가」 → `ME`, 「팀이」 → `TEAM`, 알 수 없으면 `UNKNOWN`) |
| `candidates[].activityId` | 요청 `activities` 의 `id` 또는 `null`(맞는 활동이 없어 보일 때) |
| `model` | 실제로 답한 LLM 이름. 선택 |

고르는 규칙(프롬프트 · 채점):

- 후보 = 지난 일 · 결과 · 역할을 말하는 문장인데, 그 사실이 경험 · 근거 · 보완 · 본문 어디에도 **없는** 것. 이미 받치는 문장(근거 점검이면 `SOURCE` · `USER_INPUT` 일 문장)은 후보가 아니다.
- 고르지 않는다: 생각 · 동기 · 포부 · 느낌 · 이어 주는 말(근거 점검의 `OPINION`) · 자기 칭찬 · 포장만 있는 문장(「누구보다 끈질기게」 — S-05) · 기존 자료와 **어긋나는** 문장(`TEAM` · `UNKNOWN` 경험의 일을 「제가」로, 자료와 다른 수치 · 역할 — 새 사실이 아니라 근거 점검에서 확인할 문장이다).
- 받치는 사실에 새 결과 · 수치를 더한 문장(「해결했고 만족도가 크게 올랐다」)은 **더한 부분만** 후보로 옮길 수 있다 — `content` 에 받치던 사실을 다시 쓰지 않는다.

코드가 LLM 답 뒤에 확인한다 — 엄한 쪽으로만 고친다(후보를 빼는 쪽).

- 지어낸 `activityId`(요청에 없음) → `null` 로 고친다. 문장 번호가 범위 밖 · 빼야 할 문장 · 한 문장에 둘 → 위반(다시 시도 → `LLM_INVALID_OUTPUT`).
- **숫자 대조**: `content` 속 숫자(연속된 숫자 — `/ground-check` 와 같은 기준)가 원래 `sentence` 에 **하나라도 없으면** 그 후보를 뺀다. 경험 문장에 원래 문장에 없는 수치가 들어가지 않게(S-05).
- 5개를 넘으면 앞에서 5개만 둔다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `text` 가 없거나 공백뿐(나눈 문장이 0개) · `experiences` · `activities` · `excludedSentences` 가 없음(`null`) · 경험 · 활동 `id` 중복 |
| 413 | `TEXT_TOO_LONG` | `text` 와 경험 글을 합친 글자 수가 **100000** 을 넘음(`/ground-check` 와 같다) |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(다시 시도한 뒤에도). 그럴듯하게 고쳐서 돌려주지 않는다 — 위의 엄한 쪽 고치기만 예외 |
| 504 | `LLM_TIMEOUT` | 제한 시간 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 후보 찾기를 `FAILED`(`AI_FAILED`, `message` 에 위 `code`)로 둔다 — `/ground-check` 와 같다.

## POST /guidelines — 붙여 넣은 작성법을 지침 한 줄씩으로

- 부르는 곳: BE 지침 정리(guideline-api `POST /api/guidelines/extract` — 동기, BE 가 60초까지 기다린다)
- SPEC: `F-09` / `S-49` — 우선순위 `P1`

사용자가 붙여 넣은 자소서 작성법 영상의 요점 · 자막 · 멘토 피드백을 **지침 한 줄씩**으로 옮긴다. 붙여 넣은 글에 **있는 것만** — 일반론을 더하지 않는다(지침은 사용자의 것이다 — SPEC 미결정 16). 결과는 저장되지 않고 사용자가 고친 뒤 저장한다.

요청

```json
{ "text": "자소서는 결론부터. 첫 문장에 뭘 했고 어떻게 됐는지 박아라. 형용사로 꾸미지 말고 행동을 써라. 팀 프로젝트면 내 몫을 분명히. 문단 하나에 이야기 하나만. 솔직히 없는 경험도 좀 부풀려야 붙는다…" }
```

| 필드 | 값 |
| --- | --- |
| `text` | 붙여 넣은 글 그대로(1 ~ 20000자). 출처는 싣지 않는다 — BE 가 들고 있다 |

응답 200

```json
{
  "guidelines": [
    { "text": "첫 문장에 무엇을 했고 어떻게 됐는지 먼저 쓴다" },
    { "text": "형용사로 꾸미지 않고 한 행동을 쓴다" },
    { "text": "팀 프로젝트는 내가 맡은 몫을 분명히 쓴다" },
    { "text": "문단 하나에 이야기 하나만 쓴다" }
  ],
  "model": "<LLM 모델 이름>"
}
```

- 예시 읽는 법: 「결론부터」와 「첫 문장에 … 박아라」는 같은 말이라 한 줄로 합쳤다. 「없는 경험도 부풀려야」는 사실을 지어내라는 말이라 옮기지 않았다(S-05).

### 응답 규칙 — 어기면 AI 서버가 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 으로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `guidelines` | 0 ~ **10**개, 글에 나온 순서대로. 같은 뜻은 한 줄로 합친다. 0개 = 글에 작성법이 없다(잡담 · 합격 후기만 등) |
| `guidelines[].text` | 비지 않은 한 줄(1 ~ 100자, 줄바꿈 없음). 「~한다」 꼴로 무엇을 어떻게 쓸지 — 문체 · 구성 · 강조 · 분량에 관한 것 |
| `model` | 실제로 답한 LLM 이름. 선택 |

옮기는 규칙(프롬프트 · 채점):

- 붙여 넣은 글에 있는 말만 옮긴다. 글에 없는 일반 작성법을 더하지 않는다.
- 사실을 지어내거나 부풀리라는 말(「없는 경험도 있는 것처럼」 · 「수치는 대충 넣어라」)은 옮기지 않는다. 「결과는 수치로 써라」처럼 쓰는 법을 말한 것은 옮긴다 — 수치가 없을 때는 초안이 반영하지 않는다(「POST /draft」).
- 특정 사람 · 회사 · 합격자의 경험이나 예문을 옮기지 않는다 — 쓰는 법만.

코드가 확인하는 것: 개수 · 빈 줄 · 길이 · 줄바꿈 — 어기면 다시 시도 → `LLM_INVALID_OUTPUT`. 글에 있는 말만 옮겼는지 · 지어내라는 말을 걸렀는지는 코드가 못 잰다 — 채점으로 잰다(`ai-scope.md`).

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `text` 가 없거나 공백뿐 |
| 413 | `TEXT_TOO_LONG` | `text` 가 20000자를 넘음 |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(다시 시도한 뒤에도) |
| 504 | `LLM_TIMEOUT` | 50초 안에 답하지 않음(`LLM_SYNC_TIMEOUT_SECONDS` — 입구 셋과 같다) |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 502 `AI_FAILED`(`message` 에 위 `code`), 60초를 넘기면 504 `AI_TIMEOUT` 으로 FE 에 돌려준다(guideline-api).

## 입구 셋 — 공통 (S-28 · S-29 · S-30)

- 부르는 곳: BE entrance-api 가 FE 요청을 받은 그 자리에서(동기 — 작업 없음). 결과를 BE 는 **저장하지 않고** FE 에 넘긴다.
- 오류 표는 셋 다 같다 — 아래 「POST /parse-application」 끝. BE 는 어떤 오류든 FE 에 502 `AI_FAILED`(`message` 에 AI 쪽 `code`), 시간을 넘기면 504 `AI_TIMEOUT` 으로 돌려준다. **예외는 422 `URL_BLOCKED` · `URL_UNREADABLE`**(`/parse-application` 링크 — S-46) — `code` · `message` 를 그대로 넘긴다.
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

- SPEC: `F-10` / `S-30`(`P1`) · `S-46`(링크, `P1` — ETC#126) · `S-42`

요청 — `text` 와 `url` 중 **하나만**.

```json
{ "text": "[OO 백엔드 부트캠프 4기 모집]\n모집 분야: 백엔드(Spring)\n\n자기소개서 문항\n1. 기술적인 문제를 해결한 경험을 구체적으로 적어 주세요. (500자)\n2. 지원 동기와 수료 후 목표를 적어 주세요. (500자)" }
```

```json
{ "url": "https://example.com/recruit/1234" }
```

| 필드 | 값 |
| --- | --- |
| `text` | 붙여 넣은 문항 · 공고 글 그대로(BE 한도 20000자). 비지 않은 문자열 |
| `url` | 공고 링크(S-46). BE 가 `http(s)://` · 2000자 이하만 넘긴다. AI 서버가 아래 「링크 받기」대로 받아 본문을 뽑은 뒤, 그 글을 `text` 로 받은 것과 **똑같이** 나눈다 — 아래 「적혀 있나」의 기준도 뽑은 글이다 |

### 링크 받기 (S-46)

사용자가 준 링크 하나를 **그 요청에서 한 번** 받는다. 받은 본문 · 결과를 저장 · 캐시하지 않고, 로그에는 링크 · 결과 코드만 남긴다(본문은 남기지 않는다). 받기는 **AI 서버**가 한다(파이썬 requests · bs4 — PM 의 공고 수집기 hq scout `net.py` 와 같은 방식, SPEC 미결정 12 · ETC#126).

| 단계 | 규칙 | 어기면 |
| --- | --- | --- |
| 주소 | `http` · `https` 만. 호스트가 풀리는 IP 가 **모두 공개 주소**여야 한다 — 사설 · 루프백 · 링크 로컬 · 멀티캐스트 · 예약 대역(IPv6 포함)이면 받지 않는다(SSRF — AI 서버는 BE · DB 와 같은 내부망에 있다). 리다이렉트는 **3번까지**, 넘어갈 때마다 다시 확인 | 422 `URL_UNREADABLE` |
| robots.txt | `<scheme>://<host>/robots.txt` 를 받아 **`*` 규칙**으로 그 경로를 판단한다(호스트마다 한 요청 안에서 한 번). 4xx 면 규칙 없음 — 받는다. 5xx · 시간 초과 · 못 받음이면 받지 않는다(조심하는 쪽) | 금지면 422 `URL_BLOCKED`, 못 받음이면 422 `URL_UNREADABLE` |
| 받기 | 브라우저 모양 User-Agent(scout 와 같다 — 파이썬 기본 UA 를 막는 사이트가 있다) · `Accept-Language: ko-KR`. robots · 페이지 합쳐 **15초**, 본문 **2MB** 까지. 응답이 2xx 이고 `text/html` · `application/xhtml+xml` 이어야 한다(PDF · 이미지는 읽지 않는다). 글자 인코딩은 헤더 → `<meta charset>` → 추정 순 | 422 `URL_UNREADABLE` |
| 본문 뽑기 | `script` · `style` · `noscript` · `nav` · `header` · `footer` · `form` 따위를 빼고 글자만. 사이트별 손질(예: 페이지에 실린 JSON 공고 본문)은 AI 담당이 시험 결과를 보고 더한다. 앞 **20000자**까지 쓴다(넘으면 자른다 — 오류 아님) | — |
| 글이 있나 | 뽑은 글이 공백을 줄여 **200자 미만**이면 못 읽은 것이다(JS 로 그리는 페이지 · 포스터 이미지 공고) — 그 글로 LLM 을 부르지 않는다 | 422 `URL_UNREADABLE` |

- 422 의 `message` 는 **사용자에게 그대로 보이는 한국어 한 줄**이다(BE 가 그대로 넘긴다 — entrance-api) — 예: 「이 사이트는 자동으로 읽는 것을 막아 두었어요」 · 「페이지를 받지 못했어요(응답 없음)」 · 「글이 거의 없는 페이지예요 — 화면을 그림이나 스크립트로 그리는 사이트일 수 있어요」. 내부 주소 · 스택 · 원문을 담지 않는다.
- 시간: 받기 15초를 포함해 전체 50초(`LLM_SYNC_TIMEOUT_SECONDS`) 안 — 넘으면 `LLM_TIMEOUT` 그대로.
- 시험: 사람인 · 잡코리아 · 원티드 · 링커리어 · SW마에스트로 · 학교 비교과 공지 · 회사 채용 페이지(그리팅 등) 링크로 **읽힌 수 · 못 읽은 이유**를 PR 과 `ai-scope.md` 에 남긴다(S-46).

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
- `/parse-application` 400: `text` 가 비었음 · `text` · `url` 이 둘 다 있거나 둘 다 없음 · `url` 이 `http(s)://` 가 아님. 413 `TEXT_TOO_LONG`: `text` 가 20000자를 넘음(링크에서 뽑은 글은 자르고 오류로 보지 않는다). 422: 위 「링크 받기」.

### 오류 — 입구 셋 공통

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 위 엔드포인트마다 적은 경우 |
| 413 | `TEXT_TOO_LONG` | 위 엔드포인트마다 적은 경우 |
| 422 | `URL_BLOCKED` | `/parse-application` `url` — robots.txt 가 막음 |
| 422 | `URL_UNREADABLE` | `/parse-application` `url` — 위 「링크 받기」에서 못 읽음 |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 응답 규칙을 벗어남(다시 시도한 뒤에도) |
| 504 | `LLM_TIMEOUT` | 50초 안에 답하지 않음 |
| 500 | `INTERNAL_ERROR` | 그 밖 |

## POST /link-suggestions — 활동 사이 이어짐 제안

- 부르는 곳: BE experience-api `POST /api/activities/{id}/link-suggestions` 가 받은 그 자리에서(동기 — 작업 없음). 결과는 BE 가 `SUGGESTED` 이어짐으로 저장한다
- SPEC: `F-13` / `S-35` — 우선순위 `P1`

계기(`note`)가 있는 활동 하나(`from`)와 그보다 뒤에 시작한 활동 후보(`candidates`)를 받아, 계기가 이어져 **보이는** 후보를 0 ~ 3개 고르고 이유를 한 줄씩 단다. 후보는 BE 가 이미 골랐다(날짜 순서 · 이미 있는 쌍 · 최대 20개 — experience-api 「이어짐 제안 받기」). AI 는 후보 밖을 고르지 않는다.

요청 — experience-api 예시. 알고리즘 스터디(8)에 계기가 있고, 뒤에 시작한 활동은 바꿔요(7) 하나다.

```json
{
  "from": {
    "id": 8,
    "name": "알고리즘 스터디",
    "period": { "start": "2024-09", "end": null, "ongoing": true },
    "note": "문제만 풀다 보니 직접 서비스를 만들어 보고 싶어졌다",
    "experiences": [
      { "id": 105, "content": "매주 풀 문제를 고른다" }
    ]
  },
  "candidates": [
    {
      "id": 7,
      "name": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "note": null,
      "experiences": [
        { "id": 101, "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다" },
        { "id": 102, "content": "매주 금요일 스프린트 회고를 했다" },
        { "id": 103, "content": "서비스를 AWS 에 배포했다" },
        { "id": 104, "content": "백엔드 API 설계를 맡았다" }
      ]
    }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `from` | 계기가 있는 활동 `{ id, name, period, note, experiences }` |
| `from.note` | 계기 한 줄(experience-api `note` — 최대 200자, 줄바꿈 없음). **비지 않은 문자열** — 이어짐의 출발점이다 |
| `candidates` | 후보 활동 — `from` 과 같은 모양, **1 ~ 20개**. `note` 는 `null` 일 수 있다. `id` 중복 없음 · `from.id` 가 없다 |
| `*.experiences` | 그 활동의 경험 `{ id, content }` 만(0개면 `[]`). 근거 발췌문 · 보완 · 역량 · 수행 주체는 싣지 않는다 — 활동이 무엇이었는지 아는 데만 쓴다 |

응답 200

```json
{
  "suggestions": [
    {
      "toActivityId": 7,
      "reason": "계기에 적은 「직접 서비스를 만들어 보고 싶어졌다」와 뒤에 시작한 「바꿔요」 앱 만들기가 닿아 보여요"
    }
  ],
  "model": "<LLM 모델 이름>"
}
```

### 응답 규칙 — 어기면 AI 서버가 다시 시도한 뒤 `LLM_INVALID_OUTPUT` 으로 돌려준다

| 필드 | 규칙 |
| --- | --- |
| `suggestions` | 배열 **0 ~ 3개**, 더 이어져 보이는 것부터. 이어져 보이는 후보가 없으면 `[]` — 정상이다. 억지로 채우지 않는다 |
| `suggestions[].toActivityId` | **요청 `candidates` 의** `id` · 제안끼리 중복 없음 |
| `suggestions[].reason` | 비지 않은 한 줄(최대 200자, 줄바꿈 없음). AI 해석 — 아래 「이유 쓰기」 |
| `model` | 실제로 답한 LLM 이름. 선택 |

이유 쓰기(프롬프트 · 채점):

- **있는 말에 기댄다** — 두 활동의 계기 · 이름 · 경험 본문에 **있는 말**을 짚는다. 없는 동기 · 감정 · 결과를 지어내지 않는다(S-05).
- **날짜 순서만을 이유로 쓰지 않는다** — 「바로 다음에 시작했어요」처럼 시간 순서뿐인 이유는 안 된다. 계기와 닿는 말이 후보에 없으면 고르지 않는다(S-35 「날짜 순서만으로 단정하지 않는다」).
- **인과를 단정하지 않는다** — 「~때문에」 「~로 이어졌다」 「~해서 시작했다」 대신 「닿아 보여요」 「이어져 보여요」 같은 추측형. 이어졌는지는 사용자가 정한다(SPEC §0 「의미를 단정하지 않는다」).
- 칭찬 · 평가(「성장이 돋보여요」)를 하지 않는다.

- 코드가 확인하는 것: 개수 · **`toActivityId` 가 `candidates` 에 있는지** · 중복 · 빈 `reason` · 길이 · 줄바꿈. 이유의 내용(있는 말인가 · 날짜뿐인가 · 단정인가)은 코드로 다 막을 수 없어 채점으로 잰다(AI#27 · `ai-scope.md`) — 단정 표현은 채점 항목이다.

### 오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `from` · `from.note` 가 없거나 비었음 · `candidates` 가 없거나 0개 · 21개 이상 · 활동 `id` 중복 · `from.id` 가 `candidates` 에 있음 |
| 413 | `TEXT_TOO_LONG` | 계기 · 이름 · 경험 `content` 를 합친 글자 수(코드 포인트)가 **100000** 을 넘음(`/match` 와 같은 `MAX_MATCH_CHARS`) |
| 502 | `LLM_ERROR` | LLM API 호출이 실패함 |
| 502 | `LLM_INVALID_OUTPUT` | LLM 출력이 위 규칙을 벗어남(다시 시도한 뒤에도). 규칙에 맞게 잘라 내거나 고쳐서 돌려주지 않는다 |
| 504 | `LLM_TIMEOUT` | 50초 안에 답하지 않음(`LLM_SYNC_TIMEOUT_SECONDS` — 입구 셋과 같다) |
| 500 | `INTERNAL_ERROR` | 그 밖 |

BE 는 어떤 오류든 FE 에 502 `AI_FAILED`(`message` 에 위 `code`), 60초를 넘기면 504 `AI_TIMEOUT` 으로 돌려주고 아무것도 저장하지 않는다 — 입구 셋과 같다.

## POST /agent — 차곡이 도구 루프 (S-31 · `P1`)

- 부르는 곳: BE 차곡이 일(`chagok-api.md` `POST /api/chagok/runs` 뒤)
- SPEC: `F-10` / `S-31` · [ADR-008](../decisions/ADR-008-mcp-tools-in-be.md) — AI 서버는 BE MCP 의 **클라이언트**다. 도구를 따로 정의하지 않는다

AI 서버는 받은 `mcpUrl` 로 MCP 에 붙어(`initialize` → `tools/list`) 도구 목록을 LLM 함수 호출에 넘기고, 읽기 도구는 `tools/call` 로 직접 부른다. 진행은 **한 줄에 이벤트 하나**(NDJSON)로 흘려 보낸다. 라이브러리(공급자 함수 호출 · MCP 파이썬 SDK · LangGraph)는 AI 담당이 고르고 `ai-scope.md` 에 더한다.

요청

```json
{
  "text": "WebSocket 경험으로 OO 부트캠프 지원 만들어 줘",
  "context": {
    "question": { "id": 41, "text": "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요.", "organization": "OO 백엔드 부트캠프" }
  },
  "mcpUrl": "http://backend:8080/mcp/k3Jx…(이 일의 CHAGOK 토큰)",
  "maxToolCalls": 8
}
```

| 필드 | 값 |
| --- | --- |
| `text` | 사용자 부탁 그대로(50000자 이하). 자료를 붙여 넣은 부탁이면 `add_source` 의 `text` 는 이 안의 글을 **그대로** 잘라 쓴다 — 요약 · 고쳐 쓰지 않는다 |
| `context.question` | 지원 화면에서 열었을 때 그 문항 — 아니면 `context: { "question": null }` |
| `mcpUrl` | 이 일에만 쓰는 MCP 주소. **내부망 주소**(BE 설정 `MCP_INTERNAL_BASE_URL`) + CHAGOK 토큰. 일이 끝나면 401 이 된다. 로그에 남기지 않는다 |
| `maxToolCalls` | 도구를 부를 수 있는 최대 횟수(BE 설정, 기본 8). 넘으면 `error` `TOO_MANY_STEPS` |

응답 200 — `Content-Type: application/x-ndjson`. 줄마다 아래 이벤트 하나. **마지막 줄은 늘 `done` · `confirm` · `error` 중 하나**다.

```
{"type":"tool_call","id":"c1","tool":"search_experiences","arguments":{"query":"WebSocket"},"label":"「WebSocket」으로 경험 찾는 중"}
{"type":"tool_result","id":"c1","ok":true,"summary":"경험 1개를 찾았어요","result":{"total":1,"experiences":[…]}}
{"type":"message","text":"「바꿔요」의 WebSocket 경험이 기술 문제 해결 문항에 맞아요."}
{"type":"confirm","tool":"create_application","arguments":{"organization":"OO 백엔드 부트캠프","organizationType":"BOOTCAMP","jobRole":"BACKEND","postingUrl":null,"questions":[{"text":"기술적인 문제를 해결한 경험을 구체적으로 적어 주세요."}]},"label":"「OO 백엔드 부트캠프」 지원을 문항 1개로 만들까요?"}
```

| `type` | 필드 · 규칙 |
| --- | --- |
| `tool_call` | `id`(이 응답 안에서 고유) · `tool` · `arguments` · `label`(무엇을 하는지 한국어 한 줄, 60자 이하). **읽기 도구만**(`annotations.readOnlyHint: true`) — 부르기 **전에** 보낸다 |
| `tool_result` | `id`(짝인 `tool_call`) · `ok` · `summary`(한 줄) · `result`(MCP `structuredContent` 그대로) · `error`(`ok` 가 `false` 면 도구 오류 `{ code, message }`, 아니면 `null`). 도구 오류는 일을 끝내지 않는다 — LLM 이 읽고 다시 부를 수 있다 |
| `message` | `text` 300자 이하. **도구 결과에 있는 것만** 말한다 — 없는 경험 · 수치를 지어내지 않고, `actor` · `sourceStatus` 를 바꿔 말하지 않는다(`mcp-api.md` 「읽는 규칙」과 같다). 경험 내용을 길게 옮기지 않는다(FE 가 `result` 로 카드를 그린다) |
| `confirm` | 쓰기 도구(`readOnlyHint: false`)를 쓰고 싶을 때 — **부르지 않고** 이걸 보내고 끝낸다. `tool` · `arguments`(그 도구의 `inputSchema` 에 맞게) · `label`(무엇을 할지 한 줄). 한 응답에 하나 |
| `done` | 쓰기 없이 끝났다(찾아 보여 주기만 한 부탁) |
| `error` | `code` · `message` — `LLM_ERROR` · `LLM_TIMEOUT` · `TOO_MANY_STEPS` · `MCP_UNAVAILABLE`(MCP 에 닿지 못함 · 401) · `INTERNAL_ERROR`. 정해진 답으로 채우지 않는다 |

- 스트림을 열기 전에 실패하면(요청 모양이 틀림) 다른 엔드포인트처럼 400 `INVALID_REQUEST` + 오류 JSON 이다.
- 시간: 일 전체를 **110초** 안에 끝내거나 `error` `LLM_TIMEOUT`(`AGENT_TIMEOUT_SECONDS`). BE 는 120초(`CHAGOK_TIMEOUT_SECONDS`)에서 끊는다. 비동기라 Cloudflare 100초와 상관없다.
- BE 가 스트림을 끊으면(사용자가 그만둠) 그 자리에서 멈춘다.
- **채점**: 시험 부탁(「○○ 경험 찾아 줘」 · 「이걸로 지원 만들어 줘」 · 맞는 경험이 없는 부탁)마다 — 쓰기를 `confirm` 없이 부르지 않음 · 마지막 이벤트 규칙 · `message` 에 도구 결과 밖 사실이 없음. AI 레포가 `ai-scope.md` §4 에 적는다.

## GET /health — 살아 있나

- 부르는 곳: Docker Compose healthcheck · BE 시작 확인

응답 200

```json
{ "status": "ok" }
```

LLM 을 부르지 않는다(키가 맞는지는 확인하지 않는다).
