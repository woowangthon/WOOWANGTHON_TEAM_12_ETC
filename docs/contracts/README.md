# 계약 — FE · BE · AI 사이 약속

레포 사이에 오가는 것(API · JSON 스키마 · AI 응답 형식)만 둔다. 한 레포 안에서 끝나는 것은 그 레포에.

## 규칙

- **계약이 먼저다.** 걸치는 기능은 여기서 먼저 합의하고, 각 레포는 계약을 보고 병렬로 만든다(계약 전엔 목으로).
- 바꾸는 PR 은 머지 전에 반대편 레포의 열린 이슈에 「무엇이 바뀌었나 + PR 링크」를 단다(승인은 받지 않는다 — ADR-006). 코드 PR 본문에 계약 PR 링크.
- 버전은 git 이력으로 본다. 파일에 버전 칸을 따로 두지 않는다.

## 파일

| 파일 | 누가 → 누구 | 내용 |
| --- | --- | --- |
| `<영역>-api.md` | FE → BE | 엔드포인트 · 요청 · 응답 · 오류 — 영역마다 한 파일 |
| [`auth-api.md`](auth-api.md) | FE → BE | 가입 · 로그인 · 내 정보 · 하루 분석 한도, 모든 API 의 401 · 429 (R-02) |
| [`experience-api.md`](experience-api.md) | FE → BE | 자료 넣기 · 분석 작업 · 활동 · 경험 · 근거 (스프린트 1) · 보완 (스프린트 2) |
| [`question-api.md`](question-api.md) | FE → BE | 지원(문항 여러 개) · 지원 문항 · 추천 · 되묻기에 답하기 (스프린트 2) |
| [`ai-api.md`](ai-api.md) | BE → AI | 추출 `/extract` (스프린트 1) · 매칭 `/match` (스프린트 2) |

## 공통 — 모든 계약이 같이 쓰는 것

### 모양

- JSON 필드 이름은 `camelCase`. ID 는 BE 가 매기는 정수(`number`).
- 시각은 ISO 8601 + 시간대 — `"2026-11-03T14:05:00+09:00"`.
- 값이 없으면 필드를 빼지 않고 `null` 로 둔다(배열은 `[]`).
- 로그인은 세션 쿠키다(인증 헤더 없음) — FE 는 모든 요청에 쿠키를 싣는다(`credentials: 'include'`). 가입 · 로그인 · 로그아웃을 뺀 모든 `/api/…` 는 로그인하지 않으면 401 `UNAUTHENTICATED`, 분석을 시작하는 곳은 하루 한도를 넘으면 429 `DAILY_LIMIT_EXCEEDED` — [`auth-api.md`](auth-api.md).

### 값 목록 — 코드에선 이 영문 값만 쓴다

화면 문구는 FE 가 따로 정한다(오른쪽 칸은 SPEC 용어).

| 이름 | 값 | 뜻 (SPEC) |
| --- | --- | --- |
| `sourceStatus` 출처 상태 | `SOURCE_CONFIRMED` | 원문에서 확인 — 근거가 전부 원본에서 찾아졌다 |
| | `USER_ENTERED` | 내가 입력 — 사용자가 고쳤거나 직접 넣었다. **BE 만** 붙인다 |
| | `NEEDS_REVIEW` | 확인 필요 — 근거가 없거나, 원본에서 못 찾은 근거가 있거나, 아직 대조하지 않았다 |
| `actor` 수행 주체 | `ME` | 나 |
| | `TEAM` | 팀(나 아닌 팀원 포함) |
| | `UNKNOWN` | 알 수 없음 — 원본으로 판단할 수 없다 |
| `status` 작업 상태 | `ANALYZING` | 분석 중 |
| | `COMPLETED` | 완료 |
| | `FAILED` | 실패 — `error` 에 이유 |
| `competencies` 역량 | `IMPLEMENTATION` | 기술 구현 |
| | `PROBLEM_SOLVING` | 문제 해결 |
| | `PLANNING` | 기획 |
| | `ANALYSIS` | 분석 |
| | `OPERATION` | 운영 |
| | `COLLABORATION` | 협업 |
| | `COMMUNICATION` | 소통 |
| | `LEADERSHIP` | 리더십 |
| | `INITIATIVE` | 주도성 |
| | `RESPONSIBILITY` | 책임감 |
| | `PERSEVERANCE` | 끈기 |
| | `LEARNING` | 학습 |
| | `PRESENTATION` | 발표 |
| `competenciesBy` 역량 출처 | `AI` | AI 가 붙인 해석 — 분석이 만든 그대로 |
| | `USER` | 사용자가 골랐다 — 역량을 고쳤거나 경험을 직접 넣었다. **BE 만** 붙인다 |
| `requirementStatus` 요구사항 판정 (스프린트 2) | `SUPPORTED` | 근거 있음 — 경험의 근거 · 보완이 받친다 |
| | `PARTIAL` | 일부 — 일부만 받친다 |
| | `NOT_FOUND` | 자료에서 확인 안 됨 — 「경험 없음」이 아니다(SPEC §0) |
| `evidenceType` 추천 근거 종류 (스프린트 2) | `CITATION` | 원본 발췌문(근거) |
| | `SUPPLEMENT` | 보완 — 되묻기에 사용자가 한 답(「내가 입력」) |

`competencies` 는 **배열**이다 — 경험 하나에 0 ~ 3개, 중복 없음, 앞에 둔 것이 더 잘 맞는다. 없으면 `[]`(`null` 이 아니다). 목록은 닫혀 있다 — 새 값은 SPEC 미결정 2 의 결정을 고치고 이 표에 먼저 더한 뒤 쓴다(동의어가 생기면 검색 · 매칭이 쪼개진다).

### 기간 `period`

```json
{ "start": "2025-03", "end": "2025-06", "ongoing": false }
```

- `start` · `end` 는 `"YYYY"` · `"YYYY-MM"` · `"YYYY-MM-DD"` 중 하나. **원본에 있는 만큼만** 적는다 — 월만 있으면 일을 지어내지 않는다(S-05). 모르면 `null`.
- `ongoing: true` 면 `end` 는 `null`. `start` 가 `null` 이어도 된다(기간을 모르는 활동 — 타임라인에서 어디에 둘지는 FE 가 정한다).
- 문자열 그대로 앞에서부터 비교하면 시간 순이 된다.

### 오류 응답

모든 4xx · 5xx 는 같은 모양이다. `code` 는 각 계약의 엔드포인트에 적은 값, `message` 는 사람이 읽는 설명(로그용 — 화면 문구로 그대로 쓰지 않아도 된다).

```json
{ "error": { "code": "TEXT_TOO_LONG", "message": "텍스트가 50000자를 넘습니다" } }
```

### 한 엔드포인트 틀

````markdown
## POST /api/<자원>

- 쓰는 곳: FE <화면>
- SPEC: `F-01` / `S-01`

요청
```json
{}
```

응답 200
```json
{}
```

오류: 400 <언제> · 500 <언제>
````
