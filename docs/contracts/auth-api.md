# auth-api — FE → BE

> 계정과 사용 한도(SPEC R-02 · `F-05` · `S-14` · `S-15`, BE#10). 이름 규칙 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).

## 흐름

```
FE ─POST /api/auth/signup · login──▶ BE  아이디 · 비밀번호 확인 → 세션 쿠키(JSESSIONID)
FE ─GET /api/auth/me───────────────▶ BE  로그인했나 · 오늘 분석 횟수
FE ─그 밖의 /api/… (쿠키 실어서)───▶ BE  로그인 안 했으면 401 UNAUTHENTICATED
누구나 ─GET /api/public/profiles/{token}─▶ BE  로그인 없는 공개 읽기 하나뿐(share-api.md)
FE ─POST /api/auth/logout──────────▶ BE  세션 지움
```

- 로그인 방식: **아이디 · 비밀번호 + 서버 세션 쿠키**(BE 담당 결정, BE#10). 인증 헤더는 없다 — FE 는 모든 요청에 `fetch(…, { credentials: 'include' })` 로 쿠키를 싣는다.
- 쿠키는 `HttpOnly` · `SameSite=Lax` · 서버에선 `Secure`, 7일. FE 와 BE 가 같은 상위 도메인(`app-…` · `api-…`)에 있어야 실린다([ADR-004](../decisions/ADR-004-deploy.md)). 다른 사이트(예: `*.vercel.app` 미리보기)에선 로그인되지 않는다.
- 세션은 BE 메모리에 있다 — BE 를 다시 켜면 401 이 나고 다시 로그인한다. FE 는 401 을 받으면 로그인 화면으로 보낸다.
- 테스트 계정: 아이디 `test`. 비밀번호는 BE README · 제출 폼에만(ETC `ai-scope.md` §3 `test-account`).

## 모양 — 내 정보 `Me`

가입 · 로그인 · `GET /api/auth/me` 가 같은 모양을 돌려준다.

```json
{
  "id": 7,
  "loginId": "mina_01",
  "dailyAnalysis": { "used": 3, "limit": 20 }
}
```

- `dailyAnalysis` — 오늘(한국 날짜) 시작한 분석 수와 한도. 분석은 **AI 를 부르는 열네 곳**에서 하나씩 센다: `POST /api/sources`(`activityId` 로 자료 더하기도 같다, S-60) · `POST /api/sources/batch`(자료마다 1회 · 받을 때 한꺼번에 — 남은 횟수가 자료 수보다 적으면 하나도 넣지 않는다, S-59) · `POST /api/jobs/{id}/retry` · `POST /api/questions` · `POST /api/questions/{id}/retry` · `POST /api/applications`(문항마다 1회) · `POST /api/applications/{id}/questions` · `POST /api/questions/{id}/grounding-check`(question-api, S-45) · `POST /api/questions/{id}/draft`(question-api 답변 초안, S-27) · `POST /api/questions/{id}/answer/new-facts`(question-api 새 경험 후보, S-48) · `POST /api/guidelines/extract`(guideline-api 지침 정리, S-49) · `POST /api/ask`(entrance-api, 경험이 0개라 AI 를 부르지 않으면 세지 않는다) · `POST /api/activities/{id}/link-suggestions`(experience-api 이어짐 제안 S-35, 후보가 0개라 AI 를 부르지 않으면 세지 않는다) · `POST /api/chagok/runs`(chagok-api 차곡이 일 하나에 1회 — 확인 뒤 실행하는 지원 만들기 · 자료 넣기는 그 API 대로 따로 센다). 입구의 가르기 · 지원 나누기(`POST /api/entrance/route` · `…/parse-application`)는 AI 를 부르지만 세지 않는다 — 짧은 호출이고 뒤따르는 자료 넣기 · 지원 넣기가 센다. 실패한 분석도 센다(이미 LLM 을 불렀을 수 있다). 요청이 틀려(400 · 413) 시작하지 못한 것은 세지 않는다. 한국 시간 자정에 0 으로 돌아간다.
- 한도 숫자는 BE 설정값(SPEC 미결정 6) — 기본 20, 테스트 계정 200.

## POST /api/auth/signup — 가입

- 쓰는 곳: FE 가입 화면
- SPEC: `F-05` / `S-14`

요청
```json
{ "loginId": "Mina_01", "password": "8자 이상" }
```

- `loginId`: 영문 · 숫자 · `_` `.` `-`, 3 ~ 30자. 앞뒤 공백을 지우고 **소문자로 맞춰** 저장한다(`Mina_01` → `mina_01`, 로그인도 대소문자를 가리지 않는다).
- `password`: 8자 이상, UTF-8 72바이트까지.

응답 201 — `Me`. **바로 로그인된다**(세션 쿠키가 함께 온다).

오류: 400 `INVALID_REQUEST` 아이디 · 비밀번호 형식이 틀림 · 필드 없음 · 409 `LOGIN_ID_TAKEN` 이미 있는 아이디

## POST /api/auth/login — 로그인

- 쓰는 곳: FE 로그인 화면
- SPEC: `F-05` / `S-14`

요청
```json
{ "loginId": "mina_01", "password": "…" }
```

응답 200 — `Me` + 세션 쿠키.

오류: 401 `INVALID_CREDENTIALS` 아이디가 없거나 비밀번호가 틀림(어느 쪽인지 알려 주지 않는다)

## POST /api/auth/logout — 로그아웃

요청 본문 없음. 응답 204. 로그인하지 않았어도 204.

## GET /api/auth/me — 내 정보

- 쓰는 곳: FE 첫 화면(로그인했나 확인) · 분석 넣기 전 남은 횟수
- SPEC: `S-14` · `S-15`

응답 200 — `Me`.

오류: 401 `UNAUTHENTICATED` 로그인하지 않음

## 다른 계약에 더해지는 오류

| HTTP | `code` | 어디서 | 언제 |
| --- | --- | --- | --- |
| 401 | `UNAUTHENTICATED` | 위 가입 · 로그인 · 로그아웃 · `GET /api/public/profiles/{token}`([`share-api.md`](share-api.md))을 뺀 모든 `/api/…` | 로그인하지 않음 · 세션이 끝남(7일 · BE 재시작) |
| 429 | `DAILY_LIMIT_EXCEEDED` | 분석을 시작하는 열네 곳(위 `dailyAnalysis`) | 오늘 한도를 다 씀 — 원본 · 문항을 저장하지 않고 분석을 시작하지 않는다. FE 는 「오늘 분석 횟수를 다 썼어요」처럼 이유를 보인다(S-15) |

- 사용자별로 나뉜다: 다른 사용자의 원본 · 활동 · 경험 · 근거 · 문항은 목록에 없고, ID 로 불러도 `404 …_NOT_FOUND` 다(있는지 알려 주지 않는다).

## 이 계약에 없는 것

- 비밀번호 바꾸기 · 찾기 · 탈퇴 · 소셜 로그인 — 데모 흐름에 없다
- 로그인 실패 횟수 제한 · 가입 남용(계정을 여러 개 만들어 한도 늘리기) 막기 — LLM 제공사 콘솔 한도가 마지막 겹이다(ADR-004)
