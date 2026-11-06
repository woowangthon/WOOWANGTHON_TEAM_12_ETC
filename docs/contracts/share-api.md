# share-api — FE → BE · 로그인 없는 사람 → BE

> 공개 프로필 링크(SPEC R-04 · `F-15` · `S-65` · `S-66` `P2`, ETC#35). 사용자가 경험을 골라 링크 하나를 만들고, 로그인 없는 사람이 그 링크로 **고른 경험만** 읽는다. AI 를 부르지 않는다 — 하루 분석 한도([`auth-api.md`](auth-api.md))에 세지 않는다.
> 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것). 경험 모양은 [`experience-api.md`](experience-api.md) 「모양」. 외부 AI 에 보일 범위(ETC#89)와는 다른 스위치다.

## 흐름

```
FE ─PUT /api/experiences/{id}/shared──▶ BE  「프로필에 넣기」 켜기 · 끄기
FE ─GET · PATCH /api/public-profile───▶ BE  내 공개 설정 읽기 · 제목 고치기
FE ─POST /api/public-profile/link─────▶ BE  링크 켜기 · 새로 만들기 → 새 token, 옛 주소는 바로 404
FE ─DELETE /api/public-profile/link───▶ BE  링크 끄기 → 옛 주소는 바로 404

로그인 없는 사람
FE(공개 페이지) ─GET /api/public/profiles/{token}──▶ BE  허용 목록의 필드만 — 꺼진 · 없는 주소는 같은 404
```

## 정한 것 (기본값 — PM 이 고치면 따른다)

- 사용자당 **설정 하나 · 링크 하나**. 켜지 않으면 공개되는 것이 없다.
- **주소에 사용자 ID 를 넣지 않는다.** `token` 은 추측할 수 없는 무작위 값 — `SecureRandom` 16바이트 이상을 base64url(패딩 없음)로. 켤 때마다 새로 만들고 옛 값을 다시 쓰지 않는다.
- **`token` 은 원문으로 저장한다** — MCP 연결(해시만 저장, 한 번만 보임)과 다르다. 사용자가 주소를 언제든 다시 복사해야 하고, 읽을 수 있는 것은 이미 공개하려고 고른 경험뿐이다.
- 공개 주소는 **FE 가 만든다**(`<앱 주소>/<FE 가 정한 길>/<token>`). BE 는 `token` 만 돌려준다.
- 「프로필에 넣기」는 경험의 불리언 하나(`shared`)다. 링크를 꺼도 남는다(S-66). 그때의 사본을 따로 두지 않는다 — 공개 응답은 **요청 때마다 지금 값으로** 만든다(S-65).
- **공개 조건** = `shared: true` **그리고** `sourceStatus` 가 `NEEDS_REVIEW` 가 아니다. 켜 둔 경험이 나중에 `NEEDS_REVIEW` 가 되면(외부 AI 고침 S-53 등) 공개 응답에서 빠지고 `shared` 는 그대로다 — 다시 확인되면 돌아온다.
- 공개 응답에 사용자 이메일 · 이름 · `loginId` 를 싣지 않는다 — 사람을 가리키는 건 사용자가 쓴 제목 한 줄뿐이다.

---

## 모양 — 내 공개 설정 `PublicProfileSettings`

`GET` · `PATCH /api/public-profile` · `POST …/link` 가 같은 모양을 돌려준다.

```json
{
  "title": "백엔드를 공부하는 김차곡의 경험",
  "linkEnabled": true,
  "token": "example-public-token",
  "sharedCount": 4,
  "visibleCount": 3
}
```

| 필드 | 값 |
| --- | --- |
| `title` | 프로필 제목 한 줄. 없으면 `null` |
| `linkEnabled` | 링크가 켜져 있나. 한 번도 켠 적 없으면 `false` |
| `token` | 켜져 있으면 주소 토큰, 꺼져 있으면 `null` |
| `sharedCount` | `shared: true` 인 경험 수 — 화면의 「고른 경험」 |
| `visibleCount` | 그중 지금 공개 조건을 채워 실제로 실리는 수 |

- `visibleCount` 가 `0` 이면 FE 는 켜기를 막는다. `sharedCount` 가 더 크면 그 차이만큼 「확인이 필요해 빠져 있어요」로 알린다(문구는 FE).

---

## PUT /api/experiences/{experienceId}/shared — 프로필에 넣기 · 빼기

- 쓰는 곳: FE 활동 세부의 경험마다 「프로필에 넣기」
- SPEC: `F-15` / `S-65`

경험 수정(`PATCH /api/experiences/{id}`)과 따로 둔다 — 그 요청은 값이 바뀌면 `sourceStatus` 를 `USER_ENTERED` 로 바꾸지만, 넣기 · 빼기는 내용을 고친 게 아니다. `sourceStatus` · `competenciesBy` 를 바꾸지 않는다.

요청

```json
{ "shared": true }
```

| 필드 | 값 |
| --- | --- |
| `shared` | `true`(넣기) · `false`(빼기). 필수. 이미 그 값이면 아무것도 바꾸지 않고 200 |

응답 200 — 바뀐 `Experience`(`shared` 는 [`experience-api.md`](experience-api.md) 「경험 `Experience`」).

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `shared` 가 없거나 불리언이 아님 |
| 404 | `EXPERIENCE_NOT_FOUND` | 없는 경험(남의 경험 포함 — 고를 수 없고, 있는지도 알리지 않는다) |
| 409 | `EXPERIENCE_NEEDS_REVIEW` | `shared: true` 인데 `sourceStatus` 가 `NEEDS_REVIEW` — FE 는 「먼저 확인해 주세요」를 보인다 |

- **빼기는 언제나 된다** — `NEEDS_REVIEW` 인 경험도 `false` 로 바꿀 수 있다.
- 확인하는 길: 외부 AI 가 고친 경험(`mcpChange` 있음)은 `POST /api/mcp/changes/{changeId}/confirm`(「맞아요」, [`mcp-api.md`](mcp-api.md)) 또는 고치기, 그 밖의 `NEEDS_REVIEW` 는 경험 수정으로 값을 고치기(`USER_ENTERED` 가 된다 — 고치지 않고 확인하는 길은 없다, SPEC 미결정 25).
- `shared` 는 **웹에서 사용자만** 바꾼다 — 외부 AI · 차곡이의 쓰기 도구로 바꿀 수 없다.

## GET /api/public-profile — 내 공개 설정 읽기

- 쓰는 곳: FE 공개 프로필 설정
- SPEC: `F-15` / `S-65` · `S-66`

응답 200 — `PublicProfileSettings`. 설정을 만진 적 없어도 404 가 아니다.

```json
{ "title": null, "linkEnabled": false, "token": null, "sharedCount": 0, "visibleCount": 0 }
```

## PATCH /api/public-profile — 제목 고치기

- 쓰는 곳: FE 공개 프로필 설정
- SPEC: `F-15` / `S-65`

링크가 꺼져 있어도 고칠 수 있다. 켜져 있으면 공개 페이지에 바로 반영된다. 주소는 바뀌지 않는다.

요청

```json
{ "title": "백엔드를 공부하는 김차곡의 경험" }
```

| 필드 | 값 |
| --- | --- |
| `title` | 문자열 또는 `null`. 앞뒤 공백을 걷은 뒤 **최대 100자**(Java `String.length()`, JS `length` 와 같다) · **줄바꿈(`\n` · `\r`) 없음**. `null` 이나 걷은 뒤 빈 문자열이면 제목을 지운다(`title: null`) |

응답 200 — `PublicProfileSettings`.

오류: 400 `INVALID_REQUEST` `title` 이 100자를 넘거나 줄바꿈이 있음 · 문자열 · `null` 이 아님 · 필드가 없음

## POST /api/public-profile/link — 링크 켜기 · 새로 만들기

- 쓰는 곳: FE 공개 프로필 설정의 「링크 켜기」 · 「새로 만들기」
- SPEC: `F-15` / `S-65` · `S-66`

요청 본문 없음. **언제나 새 `token`** 을 만든다 — 꺼져 있었으면 켜고, 켜져 있었으면 바꾼다. 옛 주소는 이 요청이 끝나는 대로 404 다. 제목 · 고른 경험은 그대로다.

FE 는 부르기 전에 「링크를 아는 누구나 볼 수 있어요」를 알리고(S-65), 켜져 있을 땐 옛 주소가 막힌다고 알린다.

응답 201 — `PublicProfileSettings`(`linkEnabled: true`).

오류: 409 `NO_SHARED_EXPERIENCES` — `visibleCount` 가 `0`(고른 것이 없거나 전부 `NEEDS_REVIEW`). 링크를 만들거나 바꾸지 않는다.

## DELETE /api/public-profile/link — 링크 끄기

- 쓰는 곳: FE 공개 프로필 설정의 「링크 끄기」
- SPEC: `F-15` / `S-66`

요청 본문 없음. `token` 을 없앤다 — 옛 주소는 바로 404 이고, 다시 켜면 새 주소다. 제목 · 고른 경험(`shared`)은 남는다. 꺼져 있어도 204(같은 결과).

응답 204 — 본문 없음.

## GET /api/public/profiles/{token} — 공개 읽기 (로그인 없음)

- 쓰는 곳: FE 공개 페이지(로그인 가드 밖)
- SPEC: `F-15` / `S-65` · `S-66`

**인증 없이 열리는 유일한 조회 API** 다. 쿠키를 읽지도 만들지도 않고, 누가 불러도 응답이 같다(주인이 불러도 같다). 접근 기록 · 조회 수를 남기지 않는다(S-66). 한도를 세지 않는다.

응답 200

```json
{
  "title": "백엔드를 공부하는 김차곡의 경험",
  "activities": [
    {
      "name": "바꿔요 — 캠퍼스 중고거래 앱",
      "period": { "start": "2025-03", "end": "2025-06", "ongoing": false },
      "category": "PROJECT",
      "categoryBy": "AI",
      "experiences": [
        {
          "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
          "sourceStatus": "SOURCE_CONFIRMED",
          "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
          "competenciesBy": "AI",
          "sourceNames": ["바꿔요-회고.md"]
        }
      ]
    }
  ]
}
```

### 허용 목록 — 이 필드만 나간다

| 자리 | 필드 | 값 |
| --- | --- | --- |
| 최상위 | `title` | 프로필 제목. 없으면 `null` |
| | `activities` | 공개 조건을 채운 경험이 하나라도 있는 활동. 순서는 타임라인과 같다(`period.start` 오름차순, `null` 은 맨 뒤). 없으면 `[]` |
| 활동 | `name` · `period` · `category` | 지금 값(`category` 는 미분류면 `null`) |
| | `categoryBy` | `category` 의 해석 표시 — `AI` 면 FE 는 「AI 해석」으로 보인다(S-57) |
| | `experiences` | 공개 조건을 채운 경험만. 순서는 활동 세부와 같다 |
| 경험 | `content` | 본문 지금 값 |
| | `sourceStatus` | `SOURCE_CONFIRMED` · `USER_ENTERED` 중 하나. FE 는 글자로 보인다 |
| | `competencies` · `competenciesBy` | 역량과 해석 표시 — `AI` 면 FE 는 「AI 해석」으로 보인다 |
| | `sourceNames` | 근거 원본 **이름**만. 아래 규칙 |

**위 표에 없는 것은 나가지 않는다.** BE 는 `ActivitySummary` · `Experience` 를 재사용하지 말고 이 응답 전용 모양을 만든다 — 그래야 그 모양에 필드가 늘어도 공개 응답으로 새지 않는다. 특히 다음은 절대 싣지 않는다.

| 싣지 않는 것 | 왜 |
| --- | --- |
| 근거 `citations` — `quote` · `location` · `sourceId` | 비공개 원문 발췌 |
| 원본 글 · 보완 `supplements` | 비공개 원문 · 되묻기 답 |
| 계기 `note` · 이어짐 `links` | 비공개 기록(S-34 · S-35) |
| `usedIn` · `origin` · `mcpChange` | 지원 기록 · 내부 상태 |
| `experienceCount` · `mergeSuggestion` · 고르지 않은 경험 | 고르지 않은 것의 존재 · 수를 알린다 |
| `actor` | S-65 「실리는 것」에 없다(SPEC 미결정 26) |
| 모든 `id` · `shared` · 사용자 이메일 · 이름 · `loginId` | 내부 값 · 사람을 가리키는 값. FE 는 배열 순서로 그린다 |

`sourceNames` 규칙

- **원본에서 찾은 근거(`matched: true`)** 의 원본 이름만 — 근거가 받치지 않는 경험에 원본 이름을 달아 보이지 않는다(사용자가 고친 경험에 남은 `matched: false` 근거 등).
- 이름에 폴더 경로가 있으면(S-62 · S-63 · S-64) **마지막 `/` 뒤만** 싣는다 — `볼트/활동/바꿔요-회고.md` → `바꿔요-회고.md`. 폴더 이름도 비공개 기록이다.
- 중복을 빼고 처음 나온 순서. 없으면 `[]`(직접 넣은 경험 등).

### 고른 경험이 나중에 다 빠지면

켜 둔 링크는 저절로 꺼지지 않는다 — `shared` 를 다 끄거나 경험을 지우거나 전부 `NEEDS_REVIEW` 가 되면 `200` · `activities: []` 다. FE 는 「아직 실린 경험이 없어요」를 보인다(문구는 FE). 주소를 끊는 건 사용자의 끄기 · 새로 만들기뿐이다.

### 오류

오류: 404 `PUBLIC_PROFILE_NOT_FOUND` — 꺼진 주소 · 바꾼 옛 주소 · 없는 주소 · 형식이 틀린 주소. **`message` 까지 전부 같다** — 있었는지 알리지 않는다(S-66). FE 는 전부 「없는 페이지예요」로 보인다. 연결 실패 · 5xx 는 다른 상태다 — 오류 · 다시 시도를 보인다.

### 응답 헤더

`Cache-Control: no-store` — 브라우저 · CDN 에 남으면 끈 주소가 「바로 막히지」 않는다(S-66).

---

## 다른 계약에 닿는 것

- `Experience` 에 `shared` 가 더해진다 — 기본 `false`. 옮기기 · 활동 합치기 · 경험 수정에도 그대로 남고, 고친 본문은 공개에 바로 반영되며, 지운 경험은 빠진다(S-65). 경험 합치기(S-70 — ETC PR #194)는 남길 쪽 값 — 지울 쪽만 골랐어도 공개되지 않는다.
- [`auth-api.md`](auth-api.md) 401 의 예외는 `GET /api/public/profiles/{token}` 하나뿐이다. BE 보안 설정은 이 경로의 `GET` 만 연다 — `/api/public/**` 처럼 넓게 열지 않는다. 설정 · 넣기 · 빼기 API 는 보통처럼 로그인이 필요하다.
- 개발 중 배포는 Cloudflare Access 가 공개 길도 막는다(BE#21 과 같은 고민, [`architecture.md`](../architecture.md)) — 예외는 배포 담당과 정한다.

## 이 계약에 없는 것

- 링크 여러 개 · 비밀번호 · 만료 · 조회 수 · 접근 기록 — SPEC 범위 밖(S-66 · ETC#35)
- 활동 단위로 한 번에 고르기 · 고른 경험 목록 API — FE 는 활동 세부의 `shared` 로 그린다
- SNS 공유 · 미리보기 카드 · 프로필 꾸미기 · PDF 저장 — FE#133 범위 제외
- MCP 도구 · AI 서버 요청에 `shared` 싣기 · 외부 AI 로 고르기 — 외부 AI 에 보일 범위는 ETC#89
- 공개 읽기 남용 막기 — 하루 상한 없음. DB 읽기만이라 비용이 작다(BE#102 기본값)
