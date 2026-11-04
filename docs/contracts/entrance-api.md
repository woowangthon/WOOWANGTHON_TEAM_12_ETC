# entrance-api — FE → BE

> 스프린트 3 「입구 하나」(SPEC R-04 `F-10`, ETC#118) — 가르기 `S-28`(`P0`) · 한 줄 질문 꺼내기 `S-29`(`P1`) · 지원처 · 문항 나누기 `S-30`(`P1`). 결정: [ADR-007](../decisions/ADR-007-chagok-entrance-agent.md) — LLM 한 번 + 분기, 도구 호출 루프(S-31)는 아직 아니다.
> 이름 규칙 · 값 목록 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것). 경험 · 근거 · 보완의 모양은 [`experience-api.md`](experience-api.md), 추천의 모양은 [`question-api.md`](question-api.md) 「Recommendation」. BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /route」 · 「POST /ask」 · 「POST /parse-application」.

## 흐름

```
홈 입력 — 모드: 꺼내기(기본) / 쌓기
  쌓기 · 파일 올리기 ──────────▶ 가르지 않고 자료 넣기(experience-api POST /api/sources)
  꺼내기
    FE ─POST /api/entrance/route──▶ BE ─POST /route──▶ AI   → { kind }
       SOURCE      → 자료 넣기로 — 글을 채워 두고 사용자가 「넣기」를 누른다
       APPLICATION → FE ─POST /api/entrance/parse-application─▶ BE ─POST /parse-application─▶ AI (S-30)
                     → 지원 넣기로 — 칸을 채워 두고 사용자가 고친 뒤 POST /api/applications(question-api 그대로)
       ASK         → FE ─POST /api/ask─▶ BE ─POST /ask─▶ AI (S-29) → 근거 달린 경험 0 ~ 3개
       UNSURE      → 「자료로 쌓을까요, 지원으로 만들까요?」를 묻는다
```

- **셋 다 저장하지 않고 동기로 답한다** — 작업 · 폴링이 없다. 새로고침하면 사라진다(꺼낸 답을 남기고 싶으면 지원으로 만든다). BE 는 AI 를 `AI_SYNC_TIMEOUT_SECONDS`(기본 **60**초)까지 기다리고 넘으면 504 `AI_TIMEOUT` 이다 — Cloudflare 가 100초에서 끊기 전에.
- 가르기 결과는 **넘기기만** 한다. 자료 넣기 · 지원 넣기는 사용자가 그 화면에서 누를 때 일어난다(저장은 사용자 확인 뒤 — ADR-007).
- **다른 쪽으로 보내기**(잘못 갈렸을 때 · S-28): FE 가 입력 글을 들고 있다가 다른 흐름으로 넘긴다 — API 없음. 답(S-29) 아래에는 늘 「지원으로 만들기」가 있다(가르기가 문항을 질문으로 잘못 가른 경우).
- **실패**: 가르기가 실패하면(502 · 504) 오류만 보이지 않고 UNSURE 처럼 **사용자에게 묻는다**(S-28) — 정해진 종류로 대신 넘기지 않는다. 꺼내기 · 지원 나누기가 실패하면 오류와 「다시 시도」를 보인다. 지원 나누기 실패에선 「직접 채우기」(빈 지원 넣기 화면, 문항 칸에 입력 글)도 같이 보인다.
- **S-29 · S-30 전(P1 이 아직)**: FE 는 `ASK` 를 `UNSURE` 처럼 묻고, `APPLICATION` 은 지원 넣기 화면에 입력 글 전체를 문항 하나로 채워 넘긴다. API 모양은 그대로다.
- 하루 분석 한도([`auth-api.md`](auth-api.md) `dailyAnalysis`): **꺼내기(`/api/ask`)만 1회 센다**(경험 전부를 LLM 에 넘기는 매칭과 같은 비용). 가르기 · 지원 나누기는 세지 않는다 — 짧은 호출이고 뒤따르는 자료 넣기 · 지원 넣기가 센다.

## POST /api/entrance/route — 가르기

- 쓰는 곳: FE 홈 입력(꺼내기 모드)
- SPEC: `F-10` / `S-28` · `S-29`(`ASK`)

요청

```json
{ "text": "팀 프로젝트에서 맡은 역할과, 팀과 함께 일한 방식을 적어 주세요." }
```

| 필드 | 값 |
| --- | --- |
| `text` | 홈 입력 글 그대로. 공백만 있으면 안 된다. 최대 **50000자**(자료 넣기와 같다). BE 는 AI 에 앞 **4000자**와 전체 길이만 보낸다 |

응답 200

```json
{ "kind": "APPLICATION", "reason": "지원서가 묻는 문항 문장이다" }
```

| 필드 | 값 |
| --- | --- |
| `kind` | README 「값 목록」 `entranceKind` — `SOURCE` · `APPLICATION` · `ASK` · `UNSURE` |
| `reason` | 왜 그렇게 갈랐는지 한 문장. **AI 해석**이다 — FE 가 보일지는 정한다(로그용으로 둬도 된다) |

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 413 | `TEXT_TOO_LONG` | `text` 가 50000자를 넘음 |
| 502 | `AI_FAILED` | AI 서버가 오류를 돌려줌 — `message` 에 AI 쪽 `code` |
| 504 | `AI_TIMEOUT` | 60초 안에 답이 없음 |

FE 는 502 · 504 면 묻는다(위 「실패」).

## POST /api/ask — 한 줄 질문에 쌓인 경험으로 답하기

- 쓰는 곳: FE 홈 입력 — 가르기가 `ASK` 일 때
- SPEC: `F-10` / `S-29` — 규칙은 `S-20` 과 같다

요청

```json
{ "text": "동아리에서 의견 모아 본 적 있었나?" }
```

| 필드 | 값 |
| --- | --- |
| `text` | 질문. 공백만 있으면 안 된다. 최대 **2000자** |

응답 200 — 경험이 하나도 없으면 AI 를 부르지 않고 `recommendations: []`(한도에도 세지 않는다)

```json
{
  "recommendations": [
    {
      "activity": { "id": 7, "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-06", "ongoing": false } },
      "experience": { "id": 102, "activityId": 7, "content": "매주 금요일 스프린트 회고를 했다", "competencies": ["COLLABORATION"], "actor": "TEAM", "sourceStatus": "SOURCE_CONFIRMED", "citations": [{ "id": 202, "sourceId": 12, "sourceName": "바꿔요-회고.md", "quote": "팀은 매주 금요일 스프린트 회고를 했다.", "matched": true, "location": { "startLine": 6, "endLine": 6, "section": null } }], "supplements": [] },
      "reason": "팀이 매주 회고로 의견을 모은 자리라 질문과 맞는다. 회고를 내가 이끌었는지는 자료에 없다",
      "evidence": [{ "type": "CITATION", "id": 202 }]
    }
  ]
}
```

- `recommendations` — **0 ~ 3개**, 더 잘 맞는 것부터. 맞는 게 없으면 `[]`(억지로 채우지 않는다 — S-20). 하나의 모양은 question-api 「Recommendation」에서 `emphasis` · `gaps` 를 뺀 것이다 — `activity` · `experience` 는 지금 상태, `reason` 은 **AI 해석**, `evidence` 는 같은 경험의 근거 · 보완 ID(0개 가능).
- 근거는 그 경험에 이미 있는 발췌문 · 보완뿐이다. `actor` 가 `TEAM` · `UNKNOWN` 이면 「내가 한 일」로 바꿔 말하지 않는다(S-20 — AI 응답 규칙이 막는다).
- 지원 · 문항을 만들지 않고, 되묻기도 없다. 이걸로 지원서를 쓰려면 FE 의 「지원으로 만들기」(→ 지원 나누기 · 지원 넣기).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `text` 가 없음 · 2000자를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 한도를 다 씀 — AI 를 부르지 않는다 |
| 502 | `AI_FAILED` | AI 서버가 오류를 돌려줌 — `message` 에 AI 쪽 `code` |
| 504 | `AI_TIMEOUT` | 60초 안에 답이 없음 |

## POST /api/entrance/parse-application — 붙여 넣은 문항 · 공고에서 지원 칸 채우기

- 쓰는 곳: FE — 가르기가 `APPLICATION` 일 때, 꺼내기 답 아래 「지원으로 만들기」, 지원 넣기 화면에 공고를 붙여 넣을 때
- SPEC: `F-10` / `S-30` · 미결정 12(붙여 넣은 공고 — 링크 읽기는 아직) · `S-42`(종류 · 직무)

요청

```json
{ "text": "[OO 백엔드 부트캠프 4기 모집]\n모집 분야: 백엔드(Spring)\n\n자기소개서 문항\n1. 기술적인 문제를 해결한 경험을 구체적으로 적어 주세요. (500자)\n2. 지원 동기와 수료 후 목표를 적어 주세요. (500자)" }
```

| 필드 | 값 |
| --- | --- |
| `text` | 붙여 넣은 문항 · 공고 글. 공백만 있으면 안 된다. 최대 **20000자** |

응답 200

```json
{
  "organization": "OO 백엔드 부트캠프 4기",
  "organizationType": "BOOTCAMP",
  "jobRole": "BACKEND",
  "questions": [
    "기술적인 문제를 해결한 경험을 구체적으로 적어 주세요. (500자)",
    "지원 동기와 수료 후 목표를 적어 주세요. (500자)"
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `organization` | 지원처 이름 — 글에 **적힌** 것만, 없으면 `null`. 최대 100자 |
| `organizationType` · `jobRole` | README 「값 목록」 지원처 종류 · 직무(S-42) 또는 `null`. **AI 해석**이다 — 확실하지 않으면 `null`. 직무가 없는 지원(동아리 · 서포터즈)은 `jobRole: null` |
| `questions` | 글에 **적힌** 문항, 글의 순서대로 **0 ~ 10개**. 문항을 만들지 않는다(R-03 범위 제외 — AI 응답 규칙이 코드로 막는다). 각 최대 5000자. 글이 문항 하나뿐이면 그 문항 하나. 못 찾으면 `[]` |

- **저장하지 않는다.** FE 는 지원 넣기 화면(S-18)의 칸을 이 값으로 채우고 **「AI 가 채움」** 으로 보인 뒤, 사용자가 고쳐서 `POST /api/applications` 로 넣는다 — 그 요청은 지금 모양 그대로다(넣은 값은 사용자가 확인한 값이다).
- `questions` 가 `[]` 면 FE 는 「글에서 문항을 찾지 못했어요」를 보이고 문항 칸을 비워 둔다(입력 글을 문항으로 지어 넣지 않는다).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 413 | `TEXT_TOO_LONG` | `text` 가 20000자를 넘음 |
| 502 | `AI_FAILED` | AI 서버가 오류를 돌려줌 — `message` 에 AI 쪽 `code` |
| 504 | `AI_TIMEOUT` | 60초 안에 답이 없음 |

## 이 계약에 없는 것

- 도구 호출 루프 · 단계 보이기(S-31 · ETC#99) — 여기는 LLM 한 번 + 분기다
- 공고 **링크**에서 본문 가져오기(미결정 12) — 나중에 `parse-application` 에 `url` 을 더한다
- 꺼낸 답 · 가르기 결과 저장 · 목록 — 없다
