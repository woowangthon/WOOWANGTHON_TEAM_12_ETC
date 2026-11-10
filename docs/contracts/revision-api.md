# revision-api — FE → BE

> 수정 이력(SPEC R-03 · `S-80` `P1` · [ADR-013](../decisions/ADR-013-revision-history.md), ETC#237). 경험 · 활동 · 지원서 답을 고칠 때마다 전 · 후 값을 남기고, 고른 기록의 **그때 값**(`after`)이나 그 수정 전 값(`before`)으로 되돌린다. AI 를 부르지 않는다 — 하루 분석 한도([`auth-api.md`](auth-api.md))에 세지 않는다.
> 이름 규칙 · 값 목록 · 기간 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것). 경험 · 활동 모양은 [`experience-api.md`](experience-api.md), 확정 답 · 임시 글은 [`question-api.md`](question-api.md), 외부 AI 변경 기록은 [`mcp-api.md`](mcp-api.md) 「변경 기록」.

## 흐름

```
FE ─GET /api/revisions──────────────────────▶ BE  「최근 수정」 — 경험 · 활동 · 답을 섞어 새것 먼저(커서)
FE ─GET /api/revisions?targetType=&targetId=─▶ BE  「수정 이력」 — 그 항목만
FE ─POST /api/revisions/{id}/restore────────▶ BE  그 기록의 그때 값(after) · 수정 전 값(before)으로 되돌리기 → 새 RESTORE 기록이 하나 더 생긴다
```

이력은 따로 쓰는 API 가 없다 — 아래 「언제 남나」의 API 가 저장하는 같은 트랜잭션에서 BE 가 남긴다.

## 정한 것

- **한 건 = 한 번의 저장.** 바뀌기 전(`before`) · 뒤(`after`) 스냅샷을 통째로 둘 다 남긴다 — 목록 한 줄만으로 「무엇이 바뀌었나」를 보인다. 글자 차이만 남기지 않는다(ADR-013).
- **실제로 바뀌었을 때만** 남긴다 — 스냅샷 필드가 하나도 안 바뀐 저장은 기록하지 않는다.
- **지우지 않는다.** 개수 · 기간 제한이 없다. 경험 · 활동 · 답(지원 · 문항)을 지워도 그 이력은 남는다(`target.deleted: true` — 「최근 수정」에 보이지만 그 항목으로 갈 수도 되돌릴 수도 없다. 지운 항목의 복구는 범위 밖 — S-80). 계정을 지우는 기능은 없다(auth-api).
- **되돌리기 = 고른 기록의 `after`(그때 값) 또는 `before`(그 수정 전).** 화면의 줄은 그때 값(`after`)을 보이므로 FE 는 줄마다 `to: "AFTER"` 로 되돌린다 — 「보이는 그 글로」(FE#430 · 2026-11-10: `before` 로만 되돌리면 처음 넣은 초안 줄이 빈 글로 돌아갔다). 처음 값(분석이 만든 경험 등)은 가장 오래된 기록의 `before` 로 돌아간다(`to: "BEFORE"`). 되돌리기도 새 기록(`RESTORE`)을 하나 더한다 — 지난 기록을 지우거나 고치지 않는다.
- **남의 것은 없는 것과 같다.** 목록 · 되돌리기 모두 로그인한 사용자의 이력만 — 남의 항목 · 이력은 404(있는지 알리지 않는다).
- **외부 AI(MCP)에는 열지 않는다.** 이력 읽기 · 되돌리기 도구가 없다 — 웹(쿠키 로그인)에서만(BE#21 보안 점검).
- 분석 횟수를 쓰지 않는다.

## 모양 — `Revision`

경험 — 외부 AI 가 본문을 고침

```json
{
  "id": 901,
  "targetType": "EXPERIENCE",
  "targetId": 104,
  "kind": "EDIT",
  "by": "EXTERNAL_AI",
  "client": "claude-ai",
  "mcpChangeId": 56,
  "restoredFromId": null,
  "createdAt": "2026-11-05T10:20:00+09:00",
  "target": { "deleted": false, "activityId": 7, "activityName": "바꿔요 — 캠퍼스 중고거래 앱", "questionId": null, "questionText": null, "applicationId": null, "organization": null },
  "before": {
    "content": "백엔드 API 설계를 전부 맡았다",
    "actor": "ME",
    "competencies": ["IMPLEMENTATION"],
    "competenciesBy": "AI",
    "sourceStatus": "SOURCE_CONFIRMED"
  },
  "after": {
    "content": "백엔드 API 중 채팅 · 거래 API 를 설계했다",
    "actor": "ME",
    "competencies": ["IMPLEMENTATION"],
    "competenciesBy": "AI",
    "sourceStatus": "NEEDS_REVIEW"
  }
}
```

활동 — 사용자가 이름을 고침 (`before` · `after` 만)

```json
{ "before": { "name": "바꿔요", "period": { "start": "2025-03", "end": "2025-07", "ongoing": false } },
  "after":  { "name": "바꿔요 — 캠퍼스 중고거래 앱", "period": { "start": "2025-03", "end": "2025-07", "ongoing": false } } }
```

답 — 초안을 답칸에 넣음 (`before` · `after` 만)

```json
{ "before": { "text": "" }, "after": { "text": "「바꿔요」 프로젝트에서 채팅 메시지가 늦게 도착하는 문제가 있었고, …" } }
```

| 필드 | 값 |
| --- | --- |
| `targetType` | README 「값 목록」 `revisionTargetType` — `EXPERIENCE` · `ACTIVITY` · `ANSWER` |
| `targetId` | 경험 · 활동 ID. **답은 문항 ID**(`questionId`) — 답은 문항마다 하나다 |
| `kind` | README `revisionKind` — `EDIT` · `CONFIRM` · `DRAFT_OVERWRITE` · `RESTORE` |
| `by` | README `revisionBy` — `USER`(웹) · `EXTERNAL_AI`(MCP 쓰기 도구) |
| `client` | `by` 가 `EXTERNAL_AI` 일 때 MCP 연결 이름(`McpChange.client` 와 같다). 아니면 `null` |
| `mcpChangeId` | 이 기록을 만든 외부 AI 변경(`McpChange.id`) — 외부 AI 고치기와, 변경 기록에서 그것을 되돌리거나 맞아요 한 기록에 붙는다. 아니면 `null` |
| `restoredFromId` | `RESTORE` 일 때 되돌린 기록의 `id`. 아니면 `null` |
| `target` | 목록 한 줄에 그릴 이름 — **기록한 때 값**이다(뒤에 이름이 바뀌어도 그대로). `deleted` 만 지금 값 — 그 항목이 지금 없으면 `true`. 경험은 `activityId` · `activityName`, 답은 `questionId` · `questionText` · `applicationId` · `organization` 이 차고, 안 맞는 칸은 `null`. 활동은 `before` · `after` 의 `name` 을 쓴다 |
| `before` · `after` | 그 대상의 스냅샷(아래). 답의 `before.text` 는 `kind` 마다 다르다 — `CONFIRM` 은 직전 확정 답(처음 확정이면 `""`), `DRAFT_OVERWRITE` · `RESTORE` 는 그때 답칸에 보이던 글(임시 글이 있으면 그것, 없으면 확정 답, 둘 다 없으면 `""`). `after.text` 는 확정한 글 · 답칸에 넣은 글 |

### 스냅샷 — 무엇을 남기나 (SPEC S-80)

| 대상 | 필드 | 남기지 않는 것 |
| --- | --- | --- |
| 경험 | `content` · `actor` · `competencies` · `competenciesBy` · `sourceStatus` | 근거(`citations`) · 보완 · 활동 소속(옮기기) · 저장 표시(`saved`) · 공개(`shared`) |
| 활동 | `name` · `period` | 분류 · 계기(`note`) · 이어짐 |
| 답 | `text` | 임시 글의 화면 상태(`state`) · 새 경험 후보 |

## 언제 남나

| 무엇 | `kind` · `by` | 어디서 |
| --- | --- | --- |
| 경험 고치기 | `EDIT` · `USER` | `PATCH /api/experiences/{id}` · 활동의 주체 한 번에 정하기(`POST /api/activities/{id}/actor` — 바뀐 경험마다 한 건) |
| 외부 AI 의 경험 고치기 | `EDIT` · `EXTERNAL_AI` | MCP `update_experience` — `McpChange` 와 같은 트랜잭션 |
| 변경 기록의 되돌리기 · 맞아요(경험 고치기만) | `EDIT` · `USER`, `mcpChangeId` | `POST /api/mcp/changes/{id}/undo` · `…/confirm` — 맞아요는 출처 상태가 바뀐 기록이다 |
| 활동 고치기 | `EDIT` · `USER` | `PATCH /api/activities/{id}` 에서 `name` · `period` 가 바뀌었을 때만 |
| 답 확정 | `CONFIRM` · `USER` | `PUT /api/questions/{id}/answer` — 글이 지금 확정 답과 같으면(아무것도 바꾸지 않을 때) 남기지 않는다 |
| 초안을 답칸에 넣기 | `DRAFT_OVERWRITE` · `USER` | `PUT /api/questions/{id}/answer-draft` 에 `fromDraft: true` 를 실었을 때만. 자동 저장은 남기지 않는다(S-72) |
| 되돌리기 | `RESTORE` · `USER` | 아래 `POST /api/revisions/{id}/restore` |

**남기지 않는 것**: 분석이 경험 · 활동을 처음 만드는 것 · 근거 대조로 출처 상태가 바뀌는 것 · 경험 직접 추가 · 옮기기 · 합치기(경험 · 활동) · 지우기 · 차곡이(경험 · 활동 · 답을 고치지 않는다). 외부 AI 의 자료 넣기 · 지원 만들기 · 되묻기 답은 경험 · 활동 · 답을 고친 것이 아니라 [`mcp-api.md`](mcp-api.md) 「변경 기록」에만 있다.

## GET /api/revisions — 최근 수정 · 항목의 수정 이력

- 쓰는 곳: FE 헤더 저장 상태의 「최근 수정」 · 경험 · 활동 메뉴와 답칸 줄의 「수정 이력」
- SPEC: `S-80`

| 쿼리 | 값 |
| --- | --- |
| `targetType` · `targetId` | 둘 다 주면 그 항목만, 둘 다 빼면 전체. 하나만 주면 400 |
| `cursor` | 앞 응답의 `nextCursor` 그대로. 처음엔 뺀다. FE 는 값을 해석하지 않는다 |
| `limit` | 1 ~ 50, 기본 20 |

응답 200

```json
{ "revisions": [Revision…], "nextCursor": "eyJpZCI6ODgwfQ" }
```

- 새것 먼저(`createdAt` 내림차순, 같으면 `id` 내림차순). 더 없으면 `nextCursor: null` — FE 는 이때 「더 보기」를 감춘다.
- 맞는 것이 없으면 `{ "revisions": [], "nextCursor": null }`.
- 항목만 볼 때 그 항목이 지워졌거나 남의 것이면 404 — 지운 항목의 이력은 「최근 수정」에서만 보인다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `targetType` · `targetId` 가 하나만 · 틀린 `targetType` · `limit` 범위 밖 · 읽을 수 없는 `cursor` |
| 404 | `EXPERIENCE_NOT_FOUND` · `ACTIVITY_NOT_FOUND` · `QUESTION_NOT_FOUND` | 항목만 볼 때 없거나 남의 항목 |

## POST /api/revisions/{revisionId}/restore — 그때 값 · 수정 전 값으로 되돌리기

- 쓰는 곳: FE 「최근 수정」 · 「수정 이력」의 줄마다 「이때로 되돌리기」(`AFTER`), 항목 이력 맨 아래 「처음 값」 줄(`BEFORE`)
- SPEC: `S-80`

요청

```json
{ "to": "AFTER" }
```

| 필드 | 값 |
| --- | --- |
| `to` | `BEFORE` — 그 기록의 `before`(그 수정 전 값) · `AFTER` — 그 기록의 `after`(그때 값). 본문이 없거나 `to` 를 빼면 `BEFORE`(앞 계약과 같다) |

고른 스냅샷을 지금 값으로 쓰고, `RESTORE` 기록(`before` = 되돌리기 직전 값, `after` = 고른 스냅샷, `restoredFromId` = 이 `revisionId`)을 하나 더한다.

응답 200

```json
{ "revision": Revision, "experience": Experience, "activity": null, "answerDraft": null }
```

`revision` 은 새로 생긴 `RESTORE` 기록. 대상에 맞는 칸 하나만 차고 나머지는 `null` — 경험은 `Experience`, 활동은 `{ "id", "name", "period" }`, 답은 `AnswerDraft`. FE 는 그 화면을 다시 읽어도 된다.

대상별로:

- **경험** — 스냅샷 다섯 필드를 통째로 돌린다 — **출처 상태도 그때 값**이다(S-80. 본문을 고친 것처럼 `USER_ENTERED` 로 바꾸지 않는다). 근거 · 보완 · 활동 소속은 그대로다. 사용자가 손댄 것이므로 이 경험에 달린 정하지 않은 외부 AI 변경은 `CHANGED_AFTER` 로 더는 되돌릴 수 없고, 경험의 `mcpChange` 는 `null` 이 된다. 주체를 정한 시각(S-77 · 외부 AI 자료 넣기 되돌리기의 「사용자가 손댄 경험」)은 `actor` 가 바뀌었으면 처음 한 번만 남긴다 — 웹 고치기와 같다.
- **활동** — `name` · `period` 를 돌린다. 분류 · 계기 · 이어짐은 그대로다.
- **답** — 확정 답을 바꾸지 않는다. 그 글을 **임시 글**(`AnswerDraft`, `state: null`)로 넣는다 — 답칸에 그 글이 열리고, 「다 썼어요」를 눌러야 확정이다. 그래서 새 경험 후보 · 비슷한 확정 답변은 되돌리기만으로 바뀌지 않는다.
- 두 번 눌러도 한 번만 일어난다 — 두 번째는 지금 값이 이미 고른 스냅샷과 같아 409 `NOTHING_TO_RESTORE`. 그래서 맨 위(가장 새) 기록을 `AFTER` 로 거듭 되돌려도 기록이 늘지 않는다.

오류

| HTTP | `code` | 언제 |
| --- | --- | --- |
| 404 | `REVISION_NOT_FOUND` | 없거나 남의 기록 |
| 409 | `REVISION_TARGET_DELETED` | 그 경험 · 활동 · 문항이 지워졌다(복구는 범위 밖) |
| 400 | `INVALID_REQUEST` | `to` 가 `BEFORE` · `AFTER` 가 아니다 |
| 409 | `NOTHING_TO_RESTORE` | 지금 값이 이미 고른 스냅샷과 같다(답은 지금 답칸에 보이는 글 — 임시 글, 없으면 확정 답 — 과 비교). 확정 답이 처음 생긴 `CONFIRM` 기록처럼 `before.text` 가 `""` 인 것을 `BEFORE` 로 되돌리는데 답칸도 비었을 때도 |

## 외부 AI 변경 기록과의 관계

- [`mcp-api.md`](mcp-api.md) 「변경 기록」(S-54 `P2`)은 **그대로 둔다** — 외부 AI 의 네 가지 변경과 맞아요 · 되돌리기가 거기 있다.
- 그중 **경험 고치기(`UPDATE_EXPERIENCE`)만** 수정 이력에도 한 줄(`by: EXTERNAL_AI`, `mcpChangeId`)로 든다 — S-80 「외부 AI 변경도 같은 목록에 든다」. FE 는 이 줄에서 `mcpChangeId` 로 변경 기록의 맞아요 · 되돌리기를 이어도 되고, 수정 이력의 되돌리기를 써도 된다.
- 둘은 다르다: 변경 기록의 되돌리기는 **그 변경이 마지막일 때만** 된다(`CHANGED_AFTER`). 수정 이력의 되돌리기는 그 뒤에 바뀌었어도 고른 기록의 값으로 쓴다.

## 이 계약에 없는 것

- 지운 경험 · 활동 · 지원의 복구, 합치기 · 옮기기 되돌리기(S-80 범위 밖)
- 외부 AI(MCP) 이력 도구 · 차곡이의 이력 읽기
- 두 기록 사이 글자 차이 계산 — `before` · `after` 를 받아 FE 가 그린다
- 항목 여러 개를 한 번에 되돌리기 · 「이때로 전부」
