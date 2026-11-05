# guideline-api — FE → BE

> 작성 지침(SPEC R-03 `F-09` · `S-49` · `P1`, ETC#68 · ETC#156). 사용자가 들은 작성법(영상 · 멘토 · 현직자 피드백)을 **지침 한 줄 + 출처**로 쌓고, 켜 둔 지침을 답변 초안(S-27)에 싣는다.
> 이름 규칙 · 값 목록 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것). 초안에 어떻게 실리는지는 [`question-api.md`](question-api.md) 「답변 초안」, BE → AI 는 [`ai-api.md`](ai-api.md) 「POST /guidelines」 · 「POST /draft」.

## 흐름

```
FE ─GET /api/guidelines─────────────▶ BE  내 지침 목록
FE ─POST /api/guidelines/extract────▶ BE ─POST /guidelines──▶ AI   붙여 넣은 요점 · 자막 → 지침 후보(저장 안 함, 동기)
FE ─POST /api/guidelines────────────▶ BE  사용자가 고친 줄(또는 직접 쓴 줄) 저장
FE ─PATCH /api/guidelines/{id}──────▶ BE  고치기 · 켜고 끄기
FE ─DELETE /api/guidelines/{id}─────▶ BE  지우기
FE ─POST /api/questions/{id}/draft──▶ BE  초안 — BE 가 그때 켜 둔 지침을 /draft 에 싣는다(question-api)
```

- **지침은 사용자의 것이다** — 0개에서 시작하고, 우리가 미리 넣어 두지 않는다(SPEC 미결정 16). 구성 틀(STAR 등)은 지침이 아니라 초안 요청의 `frame` 이다(README `draftFrame` · S-50).
- **정리는 저장하지 않고 동기로 답한다** — entrance-api 와 같다. BE 는 AI 를 `AI_SYNC_TIMEOUT_SECONDS`(기본 **60**초)까지 기다리고 넘으면 504 `AI_TIMEOUT`. 후보는 FE 가 들고 있다가 사용자가 고친 줄만 `POST /api/guidelines` 로 저장한다 — 저절로 저장하지 않는다.
- 지침은 **문체 · 구성 · 강조만** 바꾼다. 근거 규칙(S-05 · S-27)이 우선이다 — 지침이 「수치를 넣어라」여도 근거에 없는 수치는 쓰지 않는다(ai-api 「POST /draft」).
- 지침은 경험이 아니다 — `/match` · `/ground-check` · `/new-facts` · MCP 에 싣지 않는다.

## 모양

작성 지침 `Guideline`

```json
{
  "id": 901,
  "text": "첫 문장에 무엇을 했고 어떻게 됐는지 먼저 쓴다",
  "source": "유튜브 「자소서 첫 문장 쓰는 법」",
  "enabled": true,
  "createdAt": "2026-11-06T10:00:00+09:00",
  "updatedAt": "2026-11-06T10:00:00+09:00"
}
```

- `text` — 지침 한 줄(1 ~ **200**자, 줄바꿈 없음). 사용자가 쓰거나 고친 값이다(「내가 입력」).
- `source` — 출처 한 줄(1 ~ **100**자, 줄바꿈 없음) — 어느 영상 · 누구의 피드백. 필수다(「멘토 피드백」 · 「내 생각」처럼 짧아도 된다). 링크를 적어도 되지만 BE 가 열어 보지 않는다.
- `enabled` — 초안에 실을지. 한 사용자의 켠 지침은 **최대 10개**.
- 한 사용자가 저장할 수 있는 지침은 **최대 50개**.

## GET /api/guidelines — 내 지침 목록

- 쓰는 곳: FE 「작성 지침」 화면 · 초안 만들기 옆의 켠 지침 보기
- SPEC: `F-09` / `S-49`

응답 200 — `{ "guidelines": [Guideline] }`, 만든 순서대로. 없으면 `[]`.

## POST /api/guidelines/extract — 붙여 넣은 글을 지침 후보로 정리

- 쓰는 곳: FE 「작성 지침」 화면 「붙여 넣고 정리하기」
- SPEC: `F-09` / `S-49`

요청

```json
{
  "text": "자소서는 결론부터. 첫 문장에 뭘 했고 어떻게 됐는지 박아라. 형용사로 꾸미지 말고 행동을 써라. 팀 프로젝트면 내 몫을 분명히. 문단 하나에 이야기 하나만…",
  "source": "유튜브 「자소서 첫 문장 쓰는 법」"
}
```

| 필드 | 값 |
| --- | --- |
| `text` | 붙여 넣은 요점 · 자막(1 ~ **20000**자) |
| `source` | 출처 한 줄(1 ~ 100자). AI 에 보내지 않는다 — 응답에 그대로 돌려줘 FE 가 저장할 때 쓴다 |

응답 200 — **저장하지 않는다.**

```json
{
  "source": "유튜브 「자소서 첫 문장 쓰는 법」",
  "candidates": [
    { "text": "첫 문장에 무엇을 했고 어떻게 됐는지 먼저 쓴다" },
    { "text": "형용사로 꾸미지 않고 한 행동을 쓴다" },
    { "text": "팀 프로젝트는 내가 맡은 몫을 분명히 쓴다" },
    { "text": "문단 하나에 이야기 하나만 쓴다" }
  ]
}
```

- `candidates` — 0 ~ **10**개, 글에 나온 순서대로. **AI 해석**이다 — FE 는 줄마다 고칠 수 있는 칸 · 빼기로 보이고, 사용자가 고른 줄을 `POST /api/guidelines` 로 보낸다. 0개면 「지침으로 정리할 만한 게 없어요 — 직접 써 주세요」.
- 붙여 넣은 글에 **있는 것만** 옮긴다 — 우리가 일반론을 더하지 않는다. 사실을 지어내거나 부풀리라는 말(「없는 리더 경험도 있는 것처럼」)은 지침으로 옮기지 않는다(ai-api 「POST /guidelines」).
- 분석 1회로 센다([`auth-api.md`](auth-api.md) `dailyAnalysis`). 실패해도 센다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `EMPTY_TEXT` | `text` 가 비었거나 공백뿐 |
| 400 | `INVALID_REQUEST` | `text` · `source` 가 없음 · `source` 가 비었거나 100자를 넘거나 줄바꿈이 있음 |
| 413 | `TEXT_TOO_LONG` | `text` 가 20000자를 넘음 |
| 429 | `DAILY_LIMIT_EXCEEDED` | 오늘 분석 횟수를 다 씀 |
| 502 | `AI_FAILED` | AI 서버가 오류를 돌려줌 — `message` 에 AI 쪽 `code` |
| 504 | `AI_TIMEOUT` | 60초 안에 답이 없음 |

FE 는 502 · 504 면 오류와 「다시 시도」를 보이고, 붙여 넣은 글을 지우지 않는다. 정해진 지침으로 채우지 않는다(대회 규칙 2).

## POST /api/guidelines — 지침 저장

- 쓰는 곳: FE 정리한 후보를 고친 뒤 「저장」 · 직접 한 줄 쓰기
- SPEC: `F-09` / `S-49`

요청

```json
{
  "guidelines": [
    { "text": "첫 문장에 무엇을 했고 어떻게 됐는지 먼저 쓴다", "source": "유튜브 「자소서 첫 문장 쓰는 법」" },
    { "text": "팀 프로젝트는 내가 맡은 몫을 분명히 쓴다", "source": "유튜브 「자소서 첫 문장 쓰는 법」" }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `guidelines` | 1 ~ 10개. 줄마다 `text`(1 ~ 200자) · `source`(1 ~ 100자), 줄바꿈 없음 |

응답 201 — `{ "guidelines": [Guideline] }`, 만든 것만 보낸 순서대로. AI 를 부르지 않는다 — 분석 횟수를 쓰지 않는다.

- 새 지침은 **켜진 채로** 저장한다. 다만 켠 지침이 이미 10개면 남는 것은 꺼진 채로 저장한다(앞에서부터 켠다) — FE 는 꺼진 채 저장된 것을 알린다.
- 같은 글자의 지침이 이미 있어도 막지 않는다(출처가 다를 수 있다).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `guidelines` 가 없음 · 0개 · 11개 이상 · `text` · `source` 가 없거나 비었거나 길이를 넘거나 줄바꿈이 있음 |
| 409 | `TOO_MANY_GUIDELINES` | 저장하면 50개를 넘음 — 하나도 저장하지 않는다 |

## PATCH /api/guidelines/{guidelineId} — 고치기 · 켜고 끄기

- 쓰는 곳: FE 지침 줄의 고치기 · 켜기 스위치
- SPEC: `F-09` / `S-49`

요청 — 바꿀 필드만 보낸다(하나 이상).

```json
{ "enabled": false }
```

| 필드 | 값 |
| --- | --- |
| `text` | 선택. 1 ~ 200자, 줄바꿈 없음 |
| `source` | 선택. 1 ~ 100자, 줄바꿈 없음 |
| `enabled` | 선택. `true` · `false` |

응답 200 — 바뀐 `Guideline`. 이미 만든 초안의 「적용한 지침」은 바뀌지 않는다 — 만들 때의 글이 초안에 남아 있다(question-api `Draft.guidelines`).

오류: 400 `INVALID_REQUEST`(필드가 하나도 없음 · 값이 틀림) · 404 `GUIDELINE_NOT_FOUND` · 409 `TOO_MANY_ENABLED`(켜면 11개가 됨 — 바꾸지 않는다).

## DELETE /api/guidelines/{guidelineId} — 지우기

- 쓰는 곳: FE 지침 줄의 지우기
- SPEC: `F-09` / `S-49`

응답 204. 이미 만든 초안의 「적용한 지침」에는 남는다(만들 때의 글). 오류: 404 `GUIDELINE_NOT_FOUND`.

---

## 이 계약에 없는 것

- 「이번에 고친 걸 지침으로 남길까요?」(S-51) — 차곡이(S-31) · 확정 답변(S-48)이 선 뒤 차곡이 도구(지침 저장)로 더한다. 그때 `source` 에 「내가 고친 초안 — 지원처 · 문항」이 들어간다
- 유튜브 링크 · 영상 자동 읽기 · 지침 묶음 미리 제공 · 다른 사용자와 지침 나누기 — 없다(SPEC 미결정 16)
- 지침끼리 부딪치는지 판단 · 지침 순서 바꾸기 · 문항마다 다른 지침 켜기 — 없다. 켠 지침은 모든 초안에 실리고, 부딪치면 사용자가 끈다
- 지침을 근거 점검(S-45) · 새 경험 후보(S-48) · MCP 에 쓰기 — 없다
