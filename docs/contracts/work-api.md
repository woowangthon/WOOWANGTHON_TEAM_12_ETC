# work-api — FE → BE

> 진행 중인 일(SPEC R-04 `F-10` · `S-47`, ETC#147). 사용자가 어느 화면에 있든 돌고 있는 AI 작업과 막 끝난 작업을 **한 번에** 읽는다.
> 일 자체는 각 계약이 원본이다 — 자료 분석 `experience-api.md` · 추천 · 근거 점검 · 초안 `question-api.md` · 차곡이 `chagok-api.md`. 이 API 는 일의 상태를 바꾸지 않는다 — 계정에 소식을 어디까지 봤는지만 남긴다.
> 이름 규칙 · 값 목록 · 오류 모양은 [README 「공통」](README.md#공통--모든-계약이-같이-쓰는-것).

## GET /api/work — 진행 중인 일과 막 끝난 일

- 쓰는 곳: FE 공통 틀(화면을 옮겨도 살아 있는 자리). 표시 자리 · 모양은 시안 6 을 보고 FE 가 고른다(ADR-002)
- 폴링 간격은 FE 가 정한다(제안: `inProgress` 가 있으면 3초, 없으면 30초 · 탭이 숨었으면 멈춤). 각 화면의 자세한 폴링(`GET /api/jobs/{id}` 등)은 그대로 둔다
- AI 를 부르지 않는다 — 하루 분석 한도를 세지 않는다
- 로그인한 사용자의 일만 돌려준다

응답 200

```json
{
  "seenAt": "2026-11-06T09:30:00+09:00",
  "inProgress": [
    {
      "key": "CHAGOK:55",
      "kind": "CHAGOK",
      "status": "RUNNING",
      "label": "WebSocket 경험으로 OO 부트캠프 지원 만들어 줘",
      "startedAt": "2026-11-06T10:00:00+09:00",
      "finishedAt": null,
      "errorCode": null,
      "sourceId": null,
      "jobId": null,
      "applicationId": null,
      "questionId": null,
      "runId": 55
    }
  ],
  "recent": [
    {
      "key": "SOURCE_ANALYSIS:34",
      "kind": "SOURCE_ANALYSIS",
      "status": "COMPLETED",
      "label": "바꿔요-회고.md",
      "startedAt": "2026-11-06T09:58:00+09:00",
      "finishedAt": "2026-11-06T09:58:40+09:00",
      "errorCode": null,
      "sourceId": 12,
      "jobId": 34,
      "applicationId": null,
      "questionId": null,
      "runId": null
    }
  ]
}
```

| 필드 | 값 |
| --- | --- |
| `seenAt` | 이 계정이 소식을 어디까지 봤나(아래 `POST /api/work/seen`). 한 번도 안 봤으면 `null`. `recent` 중 `finishedAt` 이 이보다 뒤인 일이 **안 읽은 소식**이다(`null` 이면 전부) — FE 가 센다 |
| `inProgress` | 지금 도는 일 · 사용자 확인을 기다리는 일. 시작이 최근인 것부터. 없으면 `[]` |
| `recent` | 최근 **24시간** 안에 끝난 일, 끝난 시각이 최근인 것부터 **최대 20개**. 없으면 `[]`. 그만둔 일(`CANCELED`)은 싣지 않는다 |
| `key` | 일 하나를 가리키는 문자열 `<kind>:<id>`. 같은 일을 다시 시도하면 **같은 `key`** 다(`finishedAt` 이 바뀐다). 화면에서 항목을 구분하는 데 쓴다 |
| `kind` | `SOURCE_ANALYSIS` 자료 분석 · `MATCH` 추천 · `GROUNDING_CHECK` 근거 점검 · `DRAFT` 답변 초안 · `CHAGOK` 차곡이 일 |
| `status` | `inProgress`: `ANALYZING` · `RUNNING` · `WAITING_CONFIRM`. `recent`: `COMPLETED` · `FAILED` · `DONE`(차곡이). 각 계약의 값 그대로다 |
| `label` | 사용자가 알아볼 한 줄 — 자료는 자료 이름, 문항 작업은 지원처 + 문항 앞부분, 차곡이는 부탁 앞부분. 최대 100자, 넘으면 BE 가 자른다 |
| `startedAt` · `finishedAt` | ISO 8601. 진행 중이면 `finishedAt` 은 `null` |
| `errorCode` | `FAILED` 일 때 그 일의 오류 코드, 아니면 `null` |
| `sourceId` · `jobId` | `SOURCE_ANALYSIS` 일 때 — 자료 화면으로 간다 |
| `applicationId` · `questionId` | `MATCH` · `GROUNDING_CHECK` · `DRAFT` 일 때 — 그 문항으로 간다. 차곡이는 문항에서 시작했으면 `questionId`, 아니면 `null`. 문항이 지원에 묶이지 않았으면 `applicationId` 는 `null` |
| `runId` | `CHAGOK` 일 때 — `GET /api/chagok/runs/{runId}` 로 이어 본다 |

- 사용자 확인을 기다리는 차곡이 일(`WAITING_CONFIRM`)은 시작한 지 24시간이 지나면 `inProgress` 에서 뺀다(chagok-api 「일은 적어도 하루 남는다」).
- 서버 재시작으로 끊긴 일은 각 정리 작업이 `FAILED` 로 두므로 `recent` 에 실패로 보인다.

오류: 401(README 「공통」). 그 밖엔 없다 — 일이 없으면 200 과 빈 배열이다.

## POST /api/work/seen — 소식을 여기까지 봤다

- 쓰는 곳: FE 소식 목록을 열 때. 읽음은 **계정 단위**다 — 다른 기기에서도 읽은 것으로 보인다. 알림마다 따로 읽지 않고, 열면 그때 보이던 소식까지 전부 읽은 것이다

요청 — 화면에 보인 소식 중 가장 늦은 `finishedAt`. 지금 시각이 아니라 이 값을 보내는 까닭은, 폴링 사이에 끝나 아직 안 보인 소식을 읽은 것으로 만들지 않기 위해서다

```json
{ "seenAt": "2026-11-06T09:58:40+09:00" }
```

응답 200 — 저장된 값

```json
{ "seenAt": "2026-11-06T09:58:40+09:00" }
```

- 앞으로만 간다 — 저장된 값보다 이른 `seenAt` 이 오면 그대로 두고 저장된 값을 돌려준다(다른 기기 · 늦게 도착한 요청). 두 번 불러도 같다.
- 보일 소식이 없으면 부르지 않는다.

오류: 400 `INVALID_REQUEST`(`seenAt` 없음 · 날짜가 아님) · 401(README 「공통」)

## 이 계약에 없는 것

- 동기 호출(`POST /api/entrance/route` · `POST /api/ask` · `…/parse-application` · `…/link-suggestions`) — 일이 저장되지 않고, 누른 자리에서 기다린다
- 알림마다 따로 읽음 처리 · 브라우저 푸시 · 메일
- 24시간보다 오래된 일 · 지난 일 목록
