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
| 직접 구현 | 활동 · 경험 · 근거 추출 흐름 (AI 서버) | 프롬프트 설계 · LLM 출력을 계약 규칙으로 검사해 어기면 다시 부르거나 오류로 돌려주는 코드 · 근거 발췌문이 원본에 있는지 코드로 대조해 출처 상태를 정함(LLM 이 정하지 않음) · 모델 폴백 · 지어낸 시험 자료 9건과 손으로 적은 정답으로 채점하는 스크립트 |
| 외부 기술 | OpenAI API — 기본, 팀 크레딧 (AI 서버) | 활동 · 경험을 나누고 문장을 쓰는 건 LLM 이 한다 — 우리는 호출 · 검사만. 모델은 §2 |
| 외부 기술 | Google Gemini API — 선택 폴백, 키가 있을 때만 (AI 서버) | 위와 같음 |
| 외부 기술 | FastAPI · Pydantic · uvicorn · openai SDK · google-genai SDK · uv (AI 서버) | 연동만 |
| 직접 구현 | 원본 · 활동 · 경험 · 근거 저장 · 조회 · 수정 API (BE) | 저장 구조 · 계약대로 응답 · 사용자가 고치면 출처 상태를 「내가 입력」으로 바꾸고 근거는 남기는 규칙을 코드가 정함 |
| 직접 구현 | 자료 넣기 → 분석 작업 → 추출 결과 저장 (BE) | 작업 상태(분석 중 · 완료 · 실패) · 다시 시도 · AI 서버 오류 · 제한 시간을 실패 이유로 남김(정해진 결과로 대신 채우지 않음) · AI 응답이 계약을 어기면(대조하지 않은 근거로 「원문에서 확인」 등) 아무것도 저장하지 않고 실패로 둠 |
| 외부 기술 | Spring Boot 4 · Spring Data JPA(Hibernate) · Flyway (BE) | 연동만 |
| 외부 기술 | PostgreSQL 18 (`pgvector/pgvector` 이미지 — 확장은 켜지 않음) (BE · DB) | 설정만 |
| 외부 기술 | Testcontainers (BE 테스트) | 연동만 |
| 외부 기술 | Next.js 16 · React 19 · TypeScript 5 (FE) | `create-next-app` 기본 설정 · 연동만 |
| 외부 기술 | Tailwind CSS 4 (FE) | 설정 · 연동만 |
| 외부 기술 | shadcn/ui (button · sheet · dialog) · Radix UI (FE) | 부품 코드를 레포에 복사해 DESIGN.md 대로 색 · 크기를 고쳐 씀 |
| 외부 기술 | Vercel (FE 배포 · PR 미리보기) | GitHub 연동 설정만 |
| 외부 기술 | Docker · Docker Compose · Oracle Cloud(OCI) 서버 · Cloudflare Tunnel · Access (BE · AI · DB 배포) | 이미지 · Compose 구성 · 설정만. 공개 전엔 Access 로 팀원만 통과 |

## 2. AI 기능

심사가 묻는 것: AI 가 **무엇을** 하고, **얼마나 믿을 만**하고, **사람은 어디서** 판단하나.

| 기능 (SPEC) | 모델 / API | AI 가 맡는 일 | 사람이 판단하는 곳 | 검증 상태 | 검증 방법 · 결과 |
| --- | --- | --- | --- | --- | --- |
| `F-02` S-03 · S-05 · S-06 추출 | OpenAI `gpt-6-luna` → `gpt-6.1-terra` → `gpt-5.4-mini`(Structured Outputs). 셋 다 못 쓰면(404 · 429 · 5xx · 시간 초과) `GEMINI_API_KEY` 가 있을 때만 `gemini-3.5-flash` → `gemini-3.5-flash-lite`. 고르는 규칙: 지원 중인 모델을 최근 세대부터, 비싼 등급(astra · pro)과 지원 종료 예정은 뺀다. 첫 모델은 아래 채점으로 골랐다 — `gpt-6-luna` 는 활동을 빠뜨리지 않았고 가장 싸다. 응답 `model` 에 실제로 답한 모델 | 원본에서 활동을 나누고, 활동마다 경험 · 역량(1 ~ 3개) · 수행 주체를 붙이고, 근거 발췌문을 원문에서 옮긴다 | 경험이 사실인지 · 내가 한 일인지 · 역량이 맞는지 확인하고 고친다(F-04). 근거를 원본에서 못 찾은 경험은 「확인 필요」로 나온다 | 검증됨 | 아래 「추출 채점」 — 지어낸 시험 자료 9건(사용자 유형별) · 손으로 적은 정답 · `scripts/eval_extract.py`(2026-11-03). 그 전(2026-11-02) 3건을 손으로 볼 때 `gpt-6.1-sol` 은 너무 조심스러워(내 일도 `UNKNOWN`), `gpt-4.1-mini` 는 주어 없는 문장을 `ME` 로 둬서 뺐다 |
| `F-02` S-04 근거 대조 | 코드 — AI `app/citations.py` (LLM 안 씀) | — | 「원문에서 확인」은 글이 원본에 있다는 뜻일 뿐, 해석이 맞는지는 사람이 본다 | 검증됨 | 기준: 두 쪽 다 유니코드 NFKC 로 맞추고 공백 · 줄바꿈 · 마크다운 기호(`#` `*` `_` `~` `>` `-` · 표 칸 `\|` · 백틱)를 뺀 뒤, 발췌문이 원본의 이어진 부분 문자열이면 찾음(`matched: true` · 줄 번호). 글자 · 수치 · 대소문자는 그대로 비교. 하나라도 못 찾거나 근거가 없으면 `NEEDS_REVIEW`. 단위 테스트 — 수치 · 주어를 바꾼 발췌문, 떨어진 문장을 이어 붙인 발췌문은 못 찾음. 시험 자료 채점에서 우리 프롬프트의 발췌문 386개 전부 원본에서 찾음 |

**추출 채점** (2026-11-03, AI `scripts/eval_extract.py`, LLM 81회) — 지어낸 자료 9건: 목록형 노트 · 팀 회고 · 개인 README · 옵시디언식 활동 노트 · 팀 README · 커밋 메모 · 회의록 · 날짜 없는 짧은 메모 · 이력서와 자소서. 정답(활동 16 · 꼭 찾을 경험 47 · 수행 주체)은 원문을 읽고 손으로 적었다 — AI 에이전트가 초안을 썼고 팀원 검토 전이다. 「범용」은 같은 모델 · 같은 출력 모양에 지시만 「이 자료에서 내 경험을 정리해 줘」. 우리 프롬프트는 2번 돌린 값.

| 모델 · 프롬프트 | 근거 일치 | 원문에 없는 수치 | 남의 일을 `ME` 로 | 그 밖의 주체 틀림 | 경험 찾음 | 활동 수 |
| --- | --- | --- | --- | --- | --- | --- |
| `gpt-6-luna` · 우리 | 55/55 · 58/58 | 0 · 0 | 0 · 0 | 0 · 0 | 42 · 40 / 47 | 16 · 16 / 16 |
| `gpt-6-luna` · 범용 | 66/66 | 0 | 0 | 0 | 34 / 47 | 16 / 16 |
| `gpt-6.1-terra` · 우리 | 70/70 · 71/71 | 0 · 0 | 0 · 0 | 0 · 1 | 44 · 45 / 47 | 14 · 15 / 16 |
| `gpt-6.1-terra` · 범용 | 60/60 | 0 | 0 | 0 | 36 / 47 | 16 / 16 |
| `gpt-5.4-mini` · 우리 | 66/66 · 66/66 | 0 · 0 | 0 · 0 | 1 · 2 | 43 · 43 / 47 | 16 · 16 / 16 |
| `gpt-5.4-mini` · 범용 | 61/61 | 0 | 1 | 1 | 35 / 47 | 13 / 16 |

- 범용 프롬프트보다 낫다: 같은 모델에서 경험을 6 ~ 9개 더 찾는다(범용은 여러 일을 한 경험으로 뭉친다). `gpt-5.4-mini` 범용은 활동 4개가 섞인 노트를 활동 하나로 묶고, 부장이 제안해 옮긴 일을 `ME` 로 달았다. 근거 일치 · 수치는 둘 다 좋았다 — 범용도 출력 모양에 `quotes` 칸이 있어서다.
- 「경험 찾음」은 정답 구절마다 짝지어진 경험이 있는지다. 이웃한 두 문장을 한 경험으로 합치면 하나를 놓친 것으로 센다(내용은 남아 있다).
- 「원문에 없는 수치」는 경험 문장의 숫자 중 원본에 없는 것. 「세 번」→「3번」처럼 한글 수를 숫자로 바꾼 것도 걸리게 했지만 이번엔 0건.
- 우리 프롬프트로 안 한 할 일(`[ ]`)을 한 일처럼 쓴 경우 0건. 의미가 맞는지(인용은 맞지만 해석이 틀림)는 자동으로 재지 않았다 — 응답을 읽어 찾은 틀린 사례는 §5.
- 우리 프롬프트 응답 시간(자료 1건): `gpt-5.4-mini` 2 ~ 4초 · `gpt-6-luna` · `gpt-6.1-terra` 8 ~ 33초(모델 한 번 제한 45초 안).

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
| `extract-samples` | SAMPLE | `AI samples/` | 추출을 손으로 보고 채점할 지어낸 자료 9건(README · 회고 · 노트 · 회의록 · 커밋 메모 · 자소서 등)과 손으로 적은 정답 `samples/answers/`(제품 동작엔 안 쓰인다) | 아니오 |
| `timeline-activities` | MOCK | `FE src/lib/mock/activities.ts` · `src/lib/api/experience.ts` | API 주소(`NEXT_PUBLIC_API_BASE_URL`)가 비어 있는 목 모드에서만 가상 대학생 활동 · 경험 · 근거를 돌려준다. 화면에 「목 모드」 표시, 저장은 실패로 보여 준다. 실제 API 실패 때 대신 쓰지 않는다(FE#7) | 아니오 |
| `fixed-user` | SAMPLE | `BE src/main/resources/db/migration/V1__experience_schema.sql` · `src/main/java/.../common/CurrentUser.java` | 로그인(BE#10) 전까지 모든 원본 · 활동 · 경험을 사용자 1 하나의 것으로 본다 | 아니오 |
| `dev-seed-activities` | SAMPLE | `BE src/main/java/.../seed/SampleSeeder.java` | `SEED_SAMPLE=true` 일 때 계약 예시(「바꿔요」 회고 · 알고리즘 스터디) 원본 · 활동 2 · 경험 5 · 근거를 손으로 넣는다 — AI 추출 결과가 아니다. 로컬 · 개발 서버(Access 뒤)에서만, 공개 전에 끄고 지운다 | 아니오 |
| `source-analysis` | MOCK | `FE src/lib/mock/analysis.ts` · `src/lib/api/experience.ts` | API 주소가 비어 있는 목 모드에서만 탭 저장소에 작업을 두고 몇 초 뒤 정해진 결과(「— 목 결과」 활동 하나)로 끝낸다. 실제 API 모드에서는 BE `POST /api/sources` · `GET /api/jobs/{id}` · 재시도를 쓴다(FE#7) | 아니오 |

- `<id>` 는 kebab-case, 네 레포 통틀어 하나. 마커를 빼면 이 줄도 뺀다.
- 테스트 계정 비밀번호는 여기 적지 않는다 — README 와 제출 폼에만.

## 4. 데이터 · 오픈소스 · 근거 출처

| 항목 | 출처 (URL) | 라이선스 · 이용 조건 | 어디에 썼나 |
| --- | --- | --- | --- |
| Airbnb DESIGN.md (디자인 방식 참고) | https://getdesign.md | 공개 분석 문서 — 방식만 참고, 색값 · 글꼴 · 로고는 쓰지 않음 | ETC `docs/design/DESIGN.md` 출발점 |
| Pretendard | https://github.com/orioncactus/pretendard | SIL OFL 1.1 | 디자인 시안 · DESIGN.md 글꼴 · FE 본문 글꼴(jsDelivr CDN) |
| Phosphor Icons | https://phosphoricons.com | MIT | 디자인 시안 · DESIGN.md 아이콘 · FE 아이콘(`@phosphor-icons/react`) |
| OpenAI API | https://openai.com/policies/ | OpenAI 이용약관 · API 데이터는 기본적으로 학습에 쓰지 않음 | AI 서버 추출(기본) |
| openai (Python SDK) | https://github.com/openai/openai-python | Apache 2.0 | AI 서버 OpenAI 호출 |
| Gemini API | https://ai.google.dev/gemini-api/terms | Google Gemini API 추가 이용약관 | AI 서버 추출(선택 폴백) |
| FastAPI | https://github.com/fastapi/fastapi | MIT | AI 서버 |
| google-genai (Python SDK) | https://github.com/googleapis/python-genai | Apache 2.0 | AI 서버 Gemini 호출 |
| Spring Boot | https://github.com/spring-projects/spring-boot | Apache 2.0 | BE |
| Hibernate ORM | https://github.com/hibernate/hibernate-orm | Apache 2.0 | BE (Spring Data JPA) |
| Flyway | https://github.com/flyway/flyway | Apache 2.0 | BE DB 마이그레이션 |
| PostgreSQL | https://www.postgresql.org/about/licence/ | PostgreSQL License | DB |
| pgvector | https://github.com/pgvector/pgvector | PostgreSQL License | DB 이미지(확장은 아직 안 켬) |
| Testcontainers | https://github.com/testcontainers/testcontainers-java | MIT | BE 통합 테스트 |
| Docker Engine · Docker Compose | https://github.com/moby/moby · https://github.com/docker/compose | Apache 2.0 | 서버 배포(BE `docker-compose.yml`) |
| Eclipse Temurin (JDK · JRE 이미지) | https://adoptium.net | GPLv2 + Classpath Exception | BE 이미지 빌드 · 실행 |
| cloudflared | https://github.com/cloudflare/cloudflared | Apache 2.0 | 서버 → Cloudflare Tunnel 연결 컨테이너 |
| Cloudflare Zero Trust (Tunnel · Access) | https://www.cloudflare.com/terms/ | Cloudflare 서비스 약관 | BE 외부 공개 · 공개 전 팀원만 접근 |
| Oracle Cloud Infrastructure | https://www.oracle.com/cloud/ | Oracle Cloud 서비스 약관 | 배포 서버(BE · AI · DB) |

## 5. 알려진 한계

발표 「오류와 한계」에 그대로 쓴다. 감추면 질의응답에서 잃는다.

- 근거 대조(S-04)는 발췌문 **글**이 원본에 있는지만 본다. 한 줄을 통째로 발췌하면(「서버는 한결, 앱 화면은 서윤, 나는 기관 담당자 연락…」) 남의 일이 섞인 줄로도 「원문에서 확인」이 된다 — 해석이 맞는지는 사람이 본다(F-04).
- `gpt-6.1-terra` 는 짧은 메모에서 활동을 통째로 빠뜨렸다 — 「토익 스터디 들어감. 3번 나가고 안 나감..」 2회 중 2회, 이력서의 「구청 행정 인턴」 2회 중 1회. 그래서 첫 모델을 `gpt-6-luna` 로 바꿨다. 빠진 활동은 사용자가 직접 더한다(S-11).
- `gpt-6-luna` 는 이웃한 문장을 한 경험으로 합치는 편이다 — 회의록의 「한결: QR 체크인 제안 · 서윤: … 의견 · 결정: …」을 경험 하나로, 「로그인과 알림 서버를 맡았다. FCM 으로 …」를 하나로. 내용은 남지만 경험 개수가 적다.
- `gpt-5.4-mini` 는 이력서의 「동아리 공동구매 사이트 개발」처럼 주어 없는 항목을 `TEAM` 으로 단 적이 있다(내 일을 덜 주장하는 쪽).
- 범용 프롬프트(`gpt-5.4-mini`)는 「지난 회의록 노션 정리」를 「회의 기록을 체계화했다」로 쓰는 등 원문에 없는 평가를 붙였다 — 우리 프롬프트 규칙 3이 막는 것. 수치 지어내기는 이번 자료에선 어느 쪽도 0건이었다.
- 수행 주체는 LLM 이 문장을 읽고 판단한다. 주어가 없는 팀 프로젝트 문장은 `UNKNOWN` 으로 두게 했지만 틀릴 수 있다 — 사람이 고친다(F-04).
- 폴백으로 모델이 바뀌면 결과 품질이 다를 수 있다. `gemini-3.5-flash-lite` 는 README 의 기능 목록까지 경험으로 뽑았다(1건 관찰). `gpt-6.1-terra` · `gpt-5.4-mini` 는 한 문장을 여러 경험으로 잘게 나누는 편이다(`gpt-6-luna` 는 덜함).
- 한 번에 50000자까지 받는다(ai-api `TEXT_TOO_LONG`).
- 기본은 OpenAI 유료 API(팀 크레딧 약 $100, 2026-12-01 만료). 크레딧이 떨어지면 429 → Gemini 키가 있으면 넘어간다.
- Gemini 는 무료 등급이라 입력이 Google 제품 개선에 쓰일 수 있고 Flash 모델마다 하루 20회 한도다 — 선택 폴백으로만 둔다. 배포에서 빼려면 `GEMINI_API_KEY` 를 비운다.
