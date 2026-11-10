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
| [`experience-api.md`](experience-api.md) | FE → BE | 자료 넣기 · 분석 작업 · 활동 · 경험 · 근거 (스프린트 1) · 보완 (스프린트 2) · 그때의 나 · 이어짐 (S-34 · S-35) · 경험마다 쓰인 지원 `usedIn` (S-38) · 경험 찾기 `GET /api/experiences` (S-58) · 자료 여러 개 한 번에 `POST /api/sources/batch` · 활동에 자료 더하기 `activityId` (S-59 · S-60) · 같은 자료 알아보기 `SOURCE_DUPLICATE` (S-69) · 경험 합치기 (S-70) |
| [`question-api.md`](question-api.md) | FE → BE | 지원(문항 여러 개) · 지원 문항 · 추천 · 되묻기에 답하기 (스프린트 2) · 근거 점검 (S-45) · 답변 초안 (S-27 · 구성 틀 S-50) · 확정 답변 · 새 경험 후보 (S-48) · 비슷한 확정 답변 (S-43) · 지원 상태 · 낸 달 (S-36 · S-37) |
| [`entrance-api.md`](entrance-api.md) | FE → BE | 홈 입력 가르기 · 한 줄 질문 꺼내기 · 지원처 · 문항 나누기 — 저장 없는 동기 호출 (스프린트 3 — S-28 ~ S-30) |
| [`chagok-api.md`](chagok-api.md) | FE → BE | 차곡이 도구 루프 — 일 시작 · 단계 읽기(폴링) · 확인하고 실행 · 그만두기 (S-31) |
| [`work-api.md`](work-api.md) | FE → BE | 진행 중인 일 · 막 끝난 일을 한 번에 읽기 · 소식 읽음 (S-47) |
| [`guideline-api.md`](guideline-api.md) | FE → BE | 작성 지침 목록 · 붙여 넣은 글 정리(동기 · 저장 안 함) · 저장 · 켜고 끄기 · 지우기 (S-49) |
| [`share-api.md`](share-api.md) | FE · 로그인 없는 사람 → BE | 공개 프로필 링크 — 프로필에 넣기 · 내 공개 설정 · 링크 켜기 · 끄기 · 로그인 없는 공개 읽기 (S-65 · S-66) |
| [`ai-api.md`](ai-api.md) | BE → AI | 추출 `/extract` (스프린트 1) · 매칭 `/match` (스프린트 2) · 근거 점검 `/ground-check` (S-45) · 답변 초안 `/draft` (S-27) · 입구 `/route` · `/ask` · `/parse-application` (스프린트 3) · 이어짐 제안 `/link-suggestions` (S-35) · 차곡이 도구 루프 `/agent` (S-31) · 작성 지침 정리 `/guidelines` (S-49) |
| [`mcp-api.md`](mcp-api.md) | 외부 AI(MCP) · 차곡이(AI) · FE → BE | 연결 주소 만들기 · 끊기, MCP 읽기 도구 `search_experiences` · `list_activities` · `get_activity` (스프린트 3 — S-32) · 토큰 범위 READ / CHAGOK · 차곡이 쓰기 도구 `create_application` · `add_source` (S-31) |

## 공통 — 모든 계약이 같이 쓰는 것

### 모양

- JSON 필드 이름은 `camelCase`. ID 는 BE 가 매기는 정수(`number`).
- 시각은 ISO 8601 + 시간대 — `"2026-11-03T14:05:00+09:00"`.
- 값이 없으면 필드를 빼지 않고 `null` 로 둔다(배열은 `[]`).
- 로그인은 세션 쿠키다(인증 헤더 없음) — FE 는 모든 요청에 쿠키를 싣는다(`credentials: 'include'`). 가입 · 로그인 · 로그아웃 · 공개 프로필 읽기(`GET /api/public/profiles/{token}`, [`share-api.md`](share-api.md))를 뺀 모든 `/api/…` 는 로그인하지 않으면 401 `UNAUTHENTICATED`, 분석을 시작하는 곳은 하루 한도를 넘으면 429 `DAILY_LIMIT_EXCEEDED` — [`auth-api.md`](auth-api.md).

### 값 목록 — 코드에선 이 영문 값만 쓴다

화면 문구는 FE 가 따로 정한다(오른쪽 칸은 SPEC 용어).

| 이름 | 값 | 뜻 (SPEC) |
| --- | --- | --- |
| `sourceStatus` 출처 상태 | `SOURCE_CONFIRMED` | 원문에서 확인 — 근거가 전부 원본에서 찾아졌다 |
| | `USER_ENTERED` | 내가 입력 — 사용자가 본문을 고쳤거나 직접 넣었다(수행 주체 · 역량만 고치면 바뀌지 않는다 — S-10). **BE 만** 붙인다 |
| | `NEEDS_REVIEW` | 확인 필요 — 근거가 없거나, 원본에서 못 찾은 근거가 있거나, 아직 대조하지 않았거나, 외부 AI 가 본문을 고쳐 사용자가 아직 확인하지 않았다(S-53) |
| `actor` 수행 주체 | `ME` | 나 |
| | `TEAM` | 팀(나 아닌 팀원 포함) |
| | `UNKNOWN` | 알 수 없음 — 원본으로 판단할 수 없다 |
| `status` 작업 상태 | `QUEUED` | 차례를 기다림 — 같이 넣은 앞 자료의 분석이 끝나면 시작(experience-api S-59, `P2`) |
| | `ANALYZING` | 분석 중 |
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
| | `SUPPLEMENT` | 보완 — 되묻기에 사용자가 한 답(「내가 입력」). 외부 AI 를 거쳐 아직 확인 전인 보완(`mcpChange` 있음)은 근거가 되지 않는다(S-56) |
| | `EXPERIENCE` | 경험 본문 — 사용자가 직접 넣거나 고친(`sourceStatus: USER_ENTERED`) 경험일 때만(「내가 입력」). 근거 점검(S-45) · 답변 초안(S-27)에서 쓴다 — `/match` 추천엔 쓰지 않는다. `id` 는 경험 ID |
| `mcpChangeType` 외부 AI 변경 종류 (S-54) | `ADD_SOURCE` | 자료 넣기 |
| | `UPDATE_EXPERIENCE` | 경험 본문 고치기 |
| | `CREATE_APPLICATION` | 지원 만들기 |
| | `ANSWER_CLARIFICATION` | 되묻기 답 전하기 |
| `mcpChangeStatus` 외부 AI 변경 상태 (S-54) | `APPLIED` | 반영됨 — 사용자가 아직 정하지 않았다 |
| | `CONFIRMED` | 맞아요 — 사용자가 확인했다 |
| | `UNDONE` | 되돌림 |
| `draftSentenceKind` 초안 문장 종류 (S-27) | `FACT` | 근거가 받치는 사실 문장 |
| | `ELABORATED` | AI 보탬 (S-78) — 받치는 사실을 풀어 쓴 문장. 근거 · 보완 1개 이상 + `note` 필수. 「AI 보탬 — 확인 필요」 |
| | `OPINION` | 연결 · 직무 관련성 · 포부 제안 — 「AI 초안 · 생각」. 근거 `[]`, 초안당 최대 3개. 숫자 · 새 사실 · 감정 지어내기 · 칭찬 · 의미 단정 금지 |
| | `SUPPOSED` | AI 가정 (S-78 · ADR-014) — 자료에 없는 장면 · 판단 · 과정 · 결과를 틀의 단계 · 합격 답 패턴에 맞춰 그럴 법하게 쓴 문장. 근거 0개 이상, 짝이 되는 `omitted` 1개(질문 · 경험) 필수, `specific` 으로 수치 · 수상 · 직책 · 고유명사를 표시. 숫자 대조를 받지 않는다. 「AI 가정 — 비슷했나요?」 |
| `groundingStatus` 근거 점검 판정 (S-45) | `SOURCE` | 원문 — 원본에서 찾은 발췌문(근거)이 받친다. 보완이 같이 받쳐도 이것 |
| | `USER_INPUT` | 내가 입력 — 원본 발췌 없이 보완 · 직접 넣거나 고친 경험 본문(`EXPERIENCE`)만 받친다 |
| | `UNSUPPORTED` | 근거 없음 — 받치는 근거 · 보완이 없다. 「거짓」이 아니라 「확인해 주세요」 |
| | `OPINION` | 생각 — 동기 · 포부 · 느낌 · 이어 주는 문장처럼 사실 주장이 아니라 점검하지 않는다(AI 해석) |
| `newFactStatus` 새 경험 후보 상태 (S-48) | `PENDING` | 아직 정하지 않음 |
| | `SAVED` | 경험으로 저장함 |
| | `DISMISSED` | 저장 안 함 — 그 문항에서 같은 문장은 다시 후보가 되지 않는다 |
| `experienceOrigin` 경험이 온 곳 (S-48) | `ANSWER` | 내가 쓴 지원서 — 확정 답의 새 경험 후보를 저장했다. 그 밖의 경험은 `origin: null` |
| `sectionKind` 원본 구간 종류 (S-39) | `PAGE` | PDF 의 쪽 |
| | `SLIDE` | PPTX 의 슬라이드 |
| `entranceKind` 홈 입력 가르기 (S-28) | `SOURCE` | 자료 — 쌓기(S-01)로 |
| | `APPLICATION` | 문항 · 공고 — 지원(S-18 · S-30)으로 |
| | `ASK` | 한 줄 질문 — 꺼내기(S-29)로 |
| | `UNSURE` | 애매함 — 사용자에게 묻는다 |
| `questionType` 문항 유형 (S-41) | `MOTIVATION` | 지원 동기 · 포부 · 목표 |
| | `SELF_INTRO` | 자기소개 · 성격 · 가치관 |
| | `STRENGTH_WEAKNESS` | 장단점 |
| | `ACHIEVEMENT` | 성취 · 몰입 · 열정 |
| | `PROBLEM_SOLVING` | 문제 해결 · 기술적 어려움 |
| | `COLLABORATION` | 협업 · 소통 · 팀워크 |
| | `CONFLICT` | 갈등 · 의견 조율 |
| | `FAILURE` | 실패 · 극복 · 아쉬움 |
| | `GROWTH` | 성장 과정 · 배운 점 · 피드백 |
| | `IDEA` | 아이디어 · 기획 제안 |
| | `OTHER` | 기타 — 맞는 유형이 없다 |
| `questionTypeBy` 문항 유형 출처 | `AI` | AI 가 매칭 때 붙인 해석 |
| | `USER` | 사용자가 골랐다. **BE 만** 붙인다 |
| `organizationType` 지원처 종류 (S-42) | `CLUB` | 동아리 · 학회 |
| | `EXTRACURRICULAR` | 교내 비교과 프로그램 |
| | `EXTERNAL` | 대외활동 · 서포터즈 · 공모전 |
| | `BOOTCAMP` | 부트캠프 · 교육 과정 |
| | `INTERN` | 인턴 |
| | `JOB` | 채용(신입 · 경력) |
| | `OTHER` | 기타 |
| `jobRole` 직무 (S-42) | `BACKEND` | 백엔드 · 서버 |
| | `FRONTEND` | 프론트엔드 · 웹 |
| | `MOBILE` | 모바일 앱 |
| | `AI_DATA` | AI · 데이터 |
| | `INFRA` | 인프라 · 클라우드 · DevOps · 보안 |
| | `DESIGN` | 디자인 |
| | `PLANNING` | 기획 · PM |
| | `MARKETING` | 마케팅 · 홍보 · 콘텐츠 |
| | `BUSINESS` | 경영 · 사무 · 영업 |
| | `OTHER` | 기타 |
| `linkStatus` 이어짐 상태 (S-35) | `SUGGESTED` | AI 제안 — 사용자가 아직 정하지 않았다 |
| | `CONFIRMED` | 맞아요 — 사용자가 이어졌다고 확인했다 |
| | `REJECTED` | 아니에요 — 다시 제안하지 않는다. 화면 · 활동 세부 응답엔 나오지 않는다 |
| `draftFrame` 구성 틀 (S-50) | `STAR` | 상황 → 과제 → 행동 → 결과 |
| | `CARL` | 맥락 → 행동 → 결과 → 배운 점 |
| | `PREP` | 결론 → 이유 → 사례 → 결론(두괄식) |
| | `NONE` | 틀 없이 — 기본 순서(상황 → 판단 → 행동 → 결과 → 배운 점) |
| `applicationStatus` 지원 상태 (S-36) | `WRITING` | 작성 중 — 새 지원은 이것 |
| | `SUBMITTED` | 냈음 — 결과를 기다린다 |
| | `PASSED` | 합격 |
| | `NOT_PASSED` | 불합격 — 작업 상태 `FAILED` 와 헷갈리지 않게 이 이름 |
| | `UNKNOWN` | 모름 — 내긴 했는데 결과를 모른다(못 들었다 · 기억나지 않는다) |
| `activityCategory` 활동 분류 (S-57) | `PROJECT` | 프로젝트 · 일 — 팀 · 개인 프로젝트 · 산학 · 연구실 · 인턴 · 실무 · 아르바이트 · 공모전 · 대회 |
| | `STUDY` | 공부 · 성장 — 수업 · 전공과목 · 스터디 · 외부교육 · 자격증 · 어학 |
| | `CLUB` | 동아리 · 대외활동 — 동아리 · 학회 · 서포터즈 · 봉사 · 멘토링 · 해외 활동 |
| `categoryBy` 분류 출처 (S-57) | `AI` | AI 가 붙인 해석 — 분석이 만든 그대로 |
| | `USER` | 사용자가 골랐다 |

`competencies` 는 **배열**이다 — 경험 하나에 0 ~ 3개, 중복 없음, 앞에 둔 것이 더 잘 맞는다. 없으면 `[]`(`null` 이 아니다). 목록은 닫혀 있다 — 새 값은 SPEC 미결정 2 의 결정을 고치고 이 표에 먼저 더한 뒤 쓴다(동의어가 생기면 검색 · 매칭이 쪼개진다).

`questionType` 은 문항 하나에 **하나**(배열 아님), `organizationType` · `jobRole` 은 지원에 하나씩이고 선택이라 `null` 일 수 있다. 셋 다 목록이 닫혀 있다 — 새 값은 SPEC 미결정 13 · 17 을 고치고 이 표에 먼저 더한다(「백엔드」 · 「서버」가 갈라지면 비슷한 답변을 못 묶는다 — S-43).

`applicationStatus` 는 지원에 **하나**, 늘 값이 있다. 사용자가 붙인 꼬리표일 뿐이다 — 합격률 · 상태별 개수 · 점수로 모아 보이지 않는다(SPEC 범위 제외: 합격 가능성 · S-36).

#### 구성 틀 `draftFrame` — 출처 · 문항 유형 → 제안 틀 (S-50)

공개된 작성 기법을 **우리가** 골라 둔 것이다(작성 지침과 달리 — SPEC 미결정 16 ①). 초안 하나에 하나. 단계는 사실을 세우는 순서일 뿐, 받칠 게 없는 단계는 건너뛴다(ai-api 「POST /draft」). FE 는 틀 이름 · 단계를 보인다. 출처는 이 표에 남기고 화면에는 두지 않는다(S-50).

| 값 | 이름 | 출처 |
| --- | --- | --- |
| `STAR` | STAR 기법 | University of Washington Career & Internship Center 「STAR Method of Interviewing」 — https://careers.uw.edu/resources/star-method-of-interviewing/ |
| `CARL` | CARL 기법 | University of Edinburgh Reflection Toolkit 「The CARL framework of reflection」 — https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/carl |
| `PREP` | PREP 기법(두괄식) | FourWeekMBA 「PREP Method」 — https://fourweekmba.com/prep-method/ |

제안 틀 — FE 가 문항 유형(`questionType`)으로 미리 고른다. LLM 을 부르지 않는 **코드 표**다. 유형이 AI 해석(`questionTypeBy: AI`)이면 제안도 「문항 유형에 맞춘 제안」으로 보인다. 사용자가 바꾸면 그 초안의 `frame` 이 된다.

| `questionType` | 제안 틀 |
| --- | --- |
| `PROBLEM_SOLVING` · `ACHIEVEMENT` · `COLLABORATION` · `CONFLICT` · `IDEA` | `STAR` |
| `FAILURE` · `GROWTH` | `CARL` |
| `MOTIVATION` · `SELF_INTRO` · `STRENGTH_WEAKNESS` | `PREP` |
| `OTHER` · 유형 없음(`null`) | `NONE` |

### 기간 `period`

```json
{ "start": "2025-03", "end": "2025-06", "ongoing": false }
```

- `start` · `end` 는 `"YYYY"` · `"YYYY-MM"` · `"YYYY-MM-DD"` 중 하나. **원본에 있는 만큼만** 적는다 — 월만 있으면 일을 지어내지 않는다(S-05). 모르면 `null`.
- `ongoing: true` 면 `end` 는 `null`. `start` 가 `null` 이어도 된다(기간을 모르는 활동 — 타임라인에서 어디에 둘지는 FE 가 정한다).
- 문자열 그대로 앞에서부터 비교하면 시간 순이 된다.

### 오류 응답

모든 4xx · 5xx 는 같은 모양이다. `code` 는 각 계약의 엔드포인트에 적은 값, `message` 는 사람이 읽는 설명(로그용 — 화면 문구로 그대로 쓰지 않아도 된다). 예외: entrance-api `parse-application` 의 422 `URL_BLOCKED` · `URL_UNREADABLE` 은 `message` 가 **화면에 그대로 보이는 한국어 한 줄**이다(S-46 — 왜 못 읽었는지). experience-api 의 409 `SOURCE_DUPLICATE` 는 `error` 안에 `source` 를 더 싣는다(S-69).

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
