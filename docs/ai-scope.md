# 구현 · AI 범위와 출처

> 심사 「AI 활용도 10 · 기술 설계 10」과 대회 공개 범위 규칙([`hackathon.md`](hackathon.md))의 근거. 발표 부록에 이 표들을 그대로 옮긴다.
>
> **같은 PR 에서 고친다:**
> - AI 모델 · 외부 API · 라이브러리 · 데이터셋을 더하거나 바꾸거나 뺄 때
> - 코드에 `MOCK(<id>)` · `SAMPLE(<id>)` 마커를 넣거나 뺄 때 (아래 §3)
> - AI 기능의 검증 상태가 바뀔 때

## 1. 직접 구현 vs 외부 기술

| 구분 | 무엇 | 우리가 한 일 |
| --- | --- | --- |
| 직접 구현 | 활동 · 경험 · 근거 추출 흐름 (AI 서버) | 프롬프트 설계 · LLM 출력을 계약 규칙으로 검사해 어기면 다시 부르거나 오류로 돌려주는 코드 · 출처 상태를 LLM 이 아니라 코드가 정함 · 모델 폴백 |
| 외부 기술 | Google Gemini API (AI 서버) | 활동 · 경험을 나누고 문장을 쓰는 건 LLM 이 한다 — 우리는 호출 · 검사만. 모델은 §2 |
| 외부 기술 | FastAPI · Pydantic · uvicorn · google-genai SDK · uv (AI 서버) | 연동만 |
| 외부 기술 | Next.js 16 · React 19 · TypeScript 5 (FE) | `create-next-app` 기본 설정 · 연동만 |
| 외부 기술 | Tailwind CSS 4 (FE) | 설정 · 연동만 |
| 외부 기술 | Vercel (FE 배포 · PR 미리보기) | GitHub 연동 설정만 |

## 2. AI 기능

심사가 묻는 것: AI 가 **무엇을** 하고, **얼마나 믿을 만**하고, **사람은 어디서** 판단하나.

| 기능 (SPEC) | 모델 / API | AI 가 맡는 일 | 사람이 판단하는 곳 | 검증 상태 | 검증 방법 · 결과 |
| --- | --- | --- | --- | --- | --- |
| `F-02` S-03 · S-05 · S-06 추출 | Gemini — 기본 `gemini-3.5-flash`, 그 모델을 지금 못 쓰면(503 · 429 · 5xx · 404 · 시간 초과) `gemini-3.8-flash` → `gemini-3.5-flash-lite` 순으로 넘어간다. 응답 `model` 에 실제로 답한 모델 | 원본에서 활동을 나누고, 활동마다 경험 · 관점 · 수행 주체를 붙이고, 근거 발췌문을 원문에서 옮긴다 | 경험이 사실인지 · 내가 한 일인지 확인하고 고친다(F-04). 근거 대조 전이라 모든 경험이 「확인 필요」로 나온다 | 미검증 | 지어낸 시험 자료 3건(AI `samples/`)을 `gemini-3.5-flash` 로 1회씩 돌려 손으로 봄(2026-11-02) — 활동 섞인 노트가 활동 4개로 나뉨 · 팀원 · 「우리는」이 한 일이 `ME` 로 간 것 0건(주어 없는 문장은 `UNKNOWN`) · 수치 없는 README 에서 지어낸 수치 0건 · 발췌문 17개 모두 원문에 글자 그대로 있음. 정해 둔 입력 세트로 채점한 수치는 아직 없다 |
| `F-02` S-04 근거 대조 | 코드 (AI#5) | — | — | 미적용 | AI#4 만 된 지금은 모든 근거가 `matched: null`, 모든 경험이 `NEEDS_REVIEW` |

- **검증됨** — 정해 둔 입력 세트로 돌려 확인했다. 방법과 숫자를 적는다(예: 「샘플 30건 중 26건 맞음」).
- **미검증** — 돌기는 하지만 정확도를 재지 않았다. 발표에서 그렇게 말한다.
- **미적용** — 계획했지만 못 만들었다. 대신 무엇이 그 일을 하는지 적는다.

## 3. 목 · 샘플 · 테스트 계정

코드 마커와 1:1 — 이 표에 없는 마커가 코드에 있으면 안 된다. 찾기: `rg -n "(MOCK|SAMPLE)\("` (네 레포에서).

| 마커 | 쓰는 곳 | 예 |
| --- | --- | --- |
| `MOCK(<id>):` | 진짜 일을 안 하고 정해진 결과를 돌려주는 코드 | AI 응답 목, 계약 전 목 서버 |
| `SAMPLE(<id>):` | 진짜 코드가 준비된 · 합성 데이터로 도는 것 | 시드 사용자, 데모 데이터, 테스트 계정 |

```python
# MOCK(ai-summary-stub): LLM 호출이 붙기 전까지 고정 요약을 돌려준다 (F-02)
```

| ID | 종류 | 레포 · 위치 | 무엇이 가짜 · 준비된 것인가 | 시연에 나오나 |
| --- | --- | --- | --- | --- |
| `example-id` | MOCK / SAMPLE / 테스트 계정 | `FE src/…` | | 예 → 영상에 「모킹」 표시 / 아니오 |
| `design-mockup-data` | SAMPLE | `ETC docs/design/timeline.html` | 디자인 시안용 가상 활동 · 경험 · 근거(제품 코드 아님) | 아니오 |
| `extract-samples` | SAMPLE | `AI samples/` | 추출 결과를 손으로 볼 지어낸 README · 회고 · 목록형 노트 3건(제품 동작엔 안 쓰인다) | 아니오 |

- `<id>` 는 kebab-case, 네 레포 통틀어 하나. 마커를 빼면 이 줄도 뺀다.
- 테스트 계정 비밀번호는 여기 적지 않는다 — README 와 제출 폼에만.

## 4. 데이터 · 오픈소스 · 근거 출처

| 항목 | 출처 (URL) | 라이선스 · 이용 조건 | 어디에 썼나 |
| --- | --- | --- | --- |
| Airbnb DESIGN.md (디자인 방식 참고) | https://getdesign.md | 공개 분석 문서 — 방식만 참고, 색값 · 글꼴 · 로고는 쓰지 않음 | ETC `docs/design/DESIGN.md` 출발점 |
| Pretendard | https://github.com/orioncactus/pretendard | SIL OFL 1.1 | 디자인 시안 · DESIGN.md 글꼴 |
| Phosphor Icons | https://phosphoricons.com | MIT | 디자인 시안 · DESIGN.md 아이콘 |
| Gemini API | https://ai.google.dev/gemini-api/terms | Google Gemini API 추가 이용약관 | AI 서버 추출 |
| FastAPI | https://github.com/fastapi/fastapi | MIT | AI 서버 |
| google-genai (Python SDK) | https://github.com/googleapis/python-genai | Apache 2.0 | AI 서버 Gemini 호출 |

## 5. 알려진 한계

발표 「오류와 한계」에 그대로 쓴다. 감추면 질의응답에서 잃는다.

- 근거 대조(S-04)가 붙기 전엔 모든 경험이 「확인 필요」다 — 확인하지 않은 것을 확인했다고 돌려주지 않는다(AI#5).
- 수행 주체는 LLM 이 문장을 읽고 판단한다. 주어가 없는 팀 프로젝트 문장은 `UNKNOWN` 으로 두게 했지만 틀릴 수 있다 — 사람이 고친다(F-04).
- 폴백으로 모델이 바뀌면 결과 품질이 다를 수 있다. `gemini-3.5-flash-lite` 는 README 의 기능 목록까지 경험으로 뽑았다(1건 관찰).
- 한 번에 50000자까지 받는다(ai-api `TEXT_TOO_LONG`).
- Gemini API 를 무료 등급으로 쓰면 입력이 Google 제품 개선에 쓰일 수 있다(이용약관). 팀 키가 결제 등급인지 확인 필요 — 실제 사용자 자료를 넣기 전에.
