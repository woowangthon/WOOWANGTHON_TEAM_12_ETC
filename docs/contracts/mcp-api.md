# mcp-api — 외부 AI(MCP 클라이언트) → BE · FE → BE

> 다른 AI 에서 내 경험 꺼내 쓰기(SPEC R-04 · `F-11` · `S-32`, ETC#24). **읽기만** — 더하기 · 고치기는 ETC#27.
> 서버는 BE 에 둔다(SPEC 미결정 18 기본값 — 토큰 · 데이터가 BE 에 있고, AI 서버는 내부망 전용 — ADR-004). 도구 목록은 차곡이(S-31)와 같이 쓴다(ADR-007) — 차곡이가 쓸 때 도구를 더하면 이 파일에 더한다.
> 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것). 경험 · 근거 · 보완 모양은 [`experience-api.md`](experience-api.md) 「모양」 그대로다.

## 흐름

```
FE ─POST /api/mcp/connection────────▶ BE  연결 주소 만들기 → 주소는 이때 한 번만 보인다
사용자: 주소를 Claude 의 커스텀 커넥터(또는 MCP 설정)에 붙여 넣는다
Claude ─POST /mcp/{token} (JSON-RPC)──▶ BE  토큰 → 사용자 → 그 사용자의 경험만 읽는다
FE ─DELETE /api/mcp/connection──────▶ BE  연결 끊기 → 그 주소는 바로 401
```

- 데모는 **Claude 하나**로 확인한다(claude.ai · Claude Desktop 의 커스텀 커넥터, 또는 Claude Code `claude mcp add --transport http <이름> <주소>`). 다른 클라이언트 차이는 보지 않는다.
- 읽기만 하므로 LLM 을 부르지 않는다 — 하루 분석 한도([`auth-api.md`](auth-api.md))에 세지 않는다.

## 연결 주소 — 정한 것 (기본값, BE 담당이 시작할 때 바꿀 수 있다)

- **비밀 연결 주소** `https://<API 주소>/mcp/<token>` 하나로 연결한다. claude.ai 커스텀 커넥터는 주소만 받기 때문(OAuth 를 빼면 헤더를 넣을 칸이 없다). 바꾸면 이 파일 · FE 안내 문구를 같이 고친다.
- 사용자당 연결 **하나**. 다시 만들면 예전 주소는 바로 끊긴다.
- `token` 은 추측할 수 없는 무작위 값(32바이트 이상, URL 에 그대로 쓰는 문자). BE 는 **해시만 저장**한다 — 그래서 주소는 만들 때 한 번만 보이고, 잃어버리면 다시 만든다.
- 웹 로그인 세션과 따로 산다 — 로그아웃 · BE 재시작에도 연결은 남는다(DB 에 저장).
- 주소가 곧 비밀번호다. FE 는 「다른 사람에게 보여 주지 마세요」를 알린다(문구는 FE).

> 버린 안: **OAuth** — 클라이언트 호환이 가장 좋지만 인가 서버를 붙이는 데 하루 이상 든다. **`Authorization: Bearer` 헤더만** — Claude Code 에선 되지만 claude.ai 커넥터에 넣을 칸이 없어 데모 7 이 막힌다(BE 가 헤더도 같이 받는 건 자유).

---

## GET /api/mcp/connection — 연결 상태

- 쓰는 곳: FE 「다른 AI 에서 쓰기」(MCP 연결) 화면
- SPEC: `F-11` / `S-32`

응답 200 — 연결 있음

```json
{ "connected": true, "createdAt": "2026-11-05T10:00:00+09:00", "lastUsedAt": "2026-11-05T10:12:30+09:00" }
```

응답 200 — 연결 없음(만든 적 없거나 끊음)

```json
{ "connected": false, "createdAt": null, "lastUsedAt": null }
```

- `lastUsedAt` — 마지막으로 MCP 요청이 들어온 시각. 한 번도 안 쓰였으면 `null`. 「Claude 에서 연결됐나」를 사용자가 확인하는 용도다.
- 주소(`url`)는 여기에 **싣지 않는다**(해시만 있다).

## POST /api/mcp/connection — 연결 주소 만들기 · 다시 만들기

- 쓰는 곳: FE MCP 연결 화면의 「연결 주소 만들기」 · 「다시 만들기」
- SPEC: `F-11` / `S-32`

요청 본문 없음. 이미 연결이 있으면 끊고 새로 만든다.

응답 201

```json
{
  "url": "https://api-woowang.miroda.live/mcp/q7Zk…(무작위)",
  "createdAt": "2026-11-05T10:00:00+09:00"
}
```

- `url` 은 이 응답에만 온다. FE 는 복사 버튼과 「Claude 에 넣는 법」을 같이 보여 준다(배치 · 문구는 FE).
- 주소 앞부분(`https://…/mcp/`)은 BE 설정값이다 — 요청이 들어온 호스트로 짐작하지 않는다(Cloudflare Tunnel 뒤라서).

## DELETE /api/mcp/connection — 연결 끊기

- 쓰는 곳: FE MCP 연결 화면의 「연결 끊기」
- SPEC: `F-11` / `S-32` — 「사용자가 연결을 끊을 수 있다」

요청 본문 없음. 연결이 없어도 204(같은 결과).

응답 204 — 본문 없음. 그 뒤 예전 주소로 오는 MCP 요청은 401.

---

## MCP 엔드포인트 — `POST /mcp/{token}`

- 쓰는 곳: Claude 같은 MCP 클라이언트
- SPEC: `F-11` / `S-32` · 데모 7

| 항목 | 값 |
| --- | --- |
| 전송 | MCP **Streamable HTTP** — 요청 하나에 JSON-RPC 2.0 메시지 하나, 응답은 `Content-Type: application/json` 한 번(SSE 스트림 없음). `GET /mcp/{token}` 은 405 |
| 상태 | 없음(stateless). `Mcp-Session-Id` 를 쓰지 않는다 |
| 프로토콜 버전 | 클라이언트가 `initialize` 에 보낸 버전을 지원하면 그대로, 아니면 BE 가 지원하는 최신 버전으로 답한다 |
| 받는 메서드 | `initialize` · `notifications/initialized`(202, 본문 없음) · `ping` · `tools/list` · `tools/call`. 그 밖엔 JSON-RPC 오류 `-32601` |
| 서버 정보 | `serverInfo.name` = `woowang-experiences`. `instructions` 에 아래 「읽는 규칙」을 싣는다 |
| 인증 실패 | 없는 · 끊긴 토큰이면 HTTP **401**(JSON-RPC 본문 없이). 클라이언트에 「연결 실패」로 보인다 |
| 쿠키 · CORS | 쓰지 않는다. 로그인 세션과 상관없다 |

라이브러리(Spring AI MCP 서버 등)를 쓸지, 위 다섯 메서드를 직접 받을지는 BE 가 정한다 — 쓰면 ETC `docs/ai-scope.md` 에 더한다(대회 규칙 3).

### 읽는 규칙 — 서버 `instructions` 에 싣는 글

외부 AI 가 우리 데이터의 뜻을 틀리게 말하지 않게, 아래 뜻을 `initialize` 응답의 `instructions` 와 각 도구 설명에 싣는다(문장은 BE 가 다듬어도 되지만 뜻은 바꾸지 않는다).

```
이 서버는 사용자가 「내가 우왕이 될 상인가」에 쌓은 활동 · 경험 · 근거를 읽기 전용으로 돌려준다.
- sourceStatus: SOURCE_CONFIRMED 는 원본 자료에서 확인된 경험, USER_ENTERED 는 사용자가 직접 넣거나 고친 것, NEEDS_REVIEW 는 근거를 원본에서 찾지 못해 확인이 필요한 것이다. NEEDS_REVIEW 를 확인된 사실처럼 말하지 않는다.
- citations[].quote 는 원본 발췌문이다. 사실을 말할 때 근거로 이것과 sourceName 을 함께 든다.
- supplements 는 사용자가 되묻기에 직접 답한 보완(「내가 입력」)이다. 원본 근거와 구분해 말한다.
- actor 가 TEAM 이면 팀이 한 일이다 — 사용자 혼자 한 일처럼 바꿔 말하지 않는다. UNKNOWN 은 누가 했는지 모른다.
- competencies 는 AI(competenciesBy=AI) 또는 사용자(USER)가 붙인 해석이다 — 원문 사실이 아니다.
- 검색 결과가 없다는 것은 「그런 경험이 없다」가 아니라 「쌓인 자료에서 찾지 못했다」이다. 없는 경험 · 수치를 지어내지 않는다.
```

### 도구 목록 (`tools/list`)

세 개 다 읽기 전용 — `annotations: { "readOnlyHint": true }`. 결과는 `content` 에 JSON 텍스트 하나(`{ "type": "text", "text": "<아래 응답 JSON>" }`)와 같은 값을 `structuredContent` 에 같이 싣는다(클라이언트마다 읽는 쪽이 달라서).

#### `search_experiences` — 경험 찾기

입력

```json
{ "query": "WebSocket 채팅", "competencies": ["PROBLEM_SOLVING"], "year": "2025", "limit": 20 }
```

| 필드 | 값 |
| --- | --- |
| `query` | 선택. 공백으로 나눈 낱말 중 **하나라도** 들어 있는 경험(대소문자 무시, 부분 일치). 찾는 곳: 경험 `content` · 근거 `quote` · 보완 `question` · `answer` · 활동 `name`. 빼거나 빈 문자열이면 낱말로 거르지 않는다 |
| `competencies` | 선택. 역량 값 배열 — 이 중 **하나라도** 붙은 경험(README 「값 목록」). 목록 밖 값은 오류 |
| `year` | 선택. `"YYYY"` — 활동 `period` 가 그해와 겹치는 경험(`start` 가 `null` 인 활동은 빠진다. `ongoing` 이면 지금까지로 본다) |
| `limit` | 선택. 1 ~ 50, 기본 20 |

- 조건은 모두 그리고(AND)로 묶는다. 아무것도 안 주면 사용자의 경험 전부(최대 `limit`).
- 순서: 맞은 낱말 수가 많은 것 → 활동 `period.start` 최근 것(`null` 은 뒤) → 경험 `id`.
- 낱말 맞추기다(의미 검색 아님) — AI 를 쓰지 않는다. 외부 AI 가 낱말을 바꿔 여러 번 부르거나, 조건 없이 불러 전부 읽고 고르면 된다(도구 설명에 이렇게 적는다).

응답

```json
{
  "total": 1,
  "experiences": [
    {
      "id": 101,
      "activity": {
        "id": 7,
        "name": "바꿔요 — 캠퍼스 중고거래 앱",
        "period": { "start": "2025-03", "end": "2025-06", "ongoing": false }
      },
      "content": "채팅 메시지가 늦게 도착하는 문제를 폴링에서 WebSocket 으로 바꿔 해결했다",
      "competencies": ["PROBLEM_SOLVING", "IMPLEMENTATION"],
      "competenciesBy": "AI",
      "actor": "ME",
      "sourceStatus": "SOURCE_CONFIRMED",
      "citations": [
        {
          "id": 201,
          "sourceId": 12,
          "sourceName": "바꿔요-회고.md",
          "quote": "채팅 메시지가 늦게 도착하는 문제가 있었다. 내가 폴링을 WebSocket 으로 바꿔 해결했다.",
          "matched": true,
          "location": { "startLine": 5, "endLine": 5 }
        }
      ],
      "supplements": [
        {
          "id": 301,
          "question": "폴링을 WebSocket 으로 바꿀 때 직접 고친 부분은 어디였나요?",
          "answer": "서버에 STOMP 엔드포인트를 만들고, 앱의 3초 폴링 코드를 구독 방식으로 바꿨다",
          "questionId": 41,
          "createdAt": "2026-11-04T10:05:00+09:00",
          "updatedAt": "2026-11-04T10:05:00+09:00"
        }
      ]
    }
  ]
}
```

- 경험 하나는 `experience-api.md` 의 `Experience` 에서 `activityId` 대신 `activity`(`ActivitySummary` 에서 `experienceCount` 를 뺀 것)를 싣는다. 근거 · 보완은 **빠짐없이** 싣는다 — 데모 7 의 「웹에서 쌓고 보완한 경험이 그대로 나온다」.
- `total` — `limit` 을 적용하기 전 맞은 개수. 맞은 게 없으면 `{ "total": 0, "experiences": [] }`(오류가 아니다).

#### `list_activities` — 활동 목록

입력 `{}` (없음)

응답 — `GET /api/activities` 와 같다(`{ "activities": [ActivitySummary…] }`, 같은 순서).

#### `get_activity` — 활동 하나 보기

입력

```json
{ "activityId": 7 }
```

응답 — `GET /api/activities/{activityId}` 와 같다(모든 경험에 `competenciesBy` · `supplements` 포함).

### 도구 오류

도구 안의 실패는 HTTP 200 + JSON-RPC 정상 응답에 `isError: true` 로 돌려준다 — 외부 AI 가 읽고 다시 부를 수 있게. 텍스트는 README 「오류 응답」 모양의 JSON.

```json
{ "content": [{ "type": "text", "text": "{\"error\":{\"code\":\"ACTIVITY_NOT_FOUND\",\"message\":\"활동 7 이 없습니다\"}}" }], "isError": true }
```

| `code` | 언제 |
| --- | --- |
| `INVALID_ARGUMENT` | 입력 모양이 틀림 — 목록 밖 역량 · `year` 형식 · `limit` 범위 · `activityId` 없음 |
| `ACTIVITY_NOT_FOUND` | 없는 활동이거나 **다른 사용자의 활동**(있는지도 알려 주지 않는다) |
| `INTERNAL_ERROR` | 그 밖에 BE 안에서 실패 — 정해진 결과로 대신 채우지 않는다(대회 규칙 2) |

없는 도구 이름은 JSON-RPC 오류 `-32602`.

## 다른 사용자의 데이터

- 모든 도구는 **토큰의 주인 것만** 읽는다. 입력에 사용자 ID 를 받지 않는다.
- 남의 `activityId` 는 없는 것과 똑같이 답한다(`ACTIVITY_NOT_FOUND`).

## 이 계약에 없는 것

- 쓰기 도구(자료 넣기 · 보완 저장 · 지원 만들기) — ETC#27, 사용자 확인 뒤
- 원본 전문 읽기(`get_source`) — 근거에 `sourceName` · `quote` 가 실려 오므로 데모 7 엔 두지 않는다. 기획의 `get_evidence` 도 같은 이유로 `search_experiences` · `get_activity` 결과에 합쳤다
- 지원 · 문항 · 추천 읽기 — 차곡이(S-31)가 필요할 때 더한다
- 의미 검색(임베딩) — 앱 검색(ETC#32)과 같이 본다
