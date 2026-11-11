# 아키텍처

> 다이어그램은 GitHub 이 그려 주는 mermaid 로. 왜 이렇게 정했나는 [ADR-003](decisions/ADR-003-stack-and-ai-boundary.md) · [ADR-004](decisions/ADR-004-deploy.md) · [ADR-005](decisions/ADR-005-fe-stack.md).

```mermaid
flowchart LR
    U[사용자] --> FE[FE · Next.js · Vercel]
    FE -->|REST| BE
    U -->|Cloudflare Tunnel| BE[BE · Spring Boot]
    subgraph OCI 서버 · Docker Compose
        BE -->|REST · 내부망| AI[AI 서버 · FastAPI]
        BE --> DB[(PostgreSQL)]
    end
    AI --> LLM[LLM API]
    AI -.->|사용자가 준 공고 링크 한 번 · S-46| WEB[공고 페이지]
```

## 구성 요소

| 구성 | 레포 | 스택 | 하는 일 |
| --- | --- | --- | --- |
| FE | `WOOWANGTHON_TEAM_12_FE` | Next.js(App Router) · TypeScript · Tailwind CSS, Vercel 배포 | 화면. 데이터 · 인증은 전부 BE API 로 |
| BE | `WOOWANGTHON_TEAM_12_BE` | Spring Boot | 인증 · 저장 · 조회 · 수정 · 분석 작업 상태 · 사용 한도. AI 서버를 부르는 유일한 곳 |
| AI | `WOOWANGTHON_TEAM_12_AI` | Python FastAPI | 받은 텍스트에서 활동 · 경험 · 근거를 뽑아 JSON 으로 돌려준다. DB 를 만지지 않는다. 밖으로 나가는 건 LLM API 와, 사용자가 준 공고 링크를 그 요청에서 한 번 받는 것(S-46 — robots.txt · 내부 주소 막기, 계약 `ai-api.md` 「링크 받기」)뿐이다 |
| MCP · 차곡이 도구 | BE 안 (스프린트 3 — SPEC R-04) | Spring Boot — `POST /mcp/{token}` | 다른 AI(MCP)와 홈 입력 뒤의 차곡이가 같이 쓰는 도구 목록. 도구는 BE MCP 에만 정의하고, 차곡이(AI 서버)는 그 MCP 의 클라이언트([ADR-007](decisions/ADR-007-chagok-entrance-agent.md) · [ADR-008](decisions/ADR-008-mcp-tools-in-be.md)) |
| DB | (BE 가 관리) | PostgreSQL (`pgvector/pgvector` 이미지, 확장은 아직 안 켬) | 원본 · 활동 · 경험 · 근거 |

## 배포

- BE · AI · DB 는 OCI 서버 하나에 Docker Compose. Cloudflare Tunnel 로 BE 만 내보내고, AI 서버 · DB 는 내부망에만 둔다.
- FE 는 Vercel. main 만 운영으로 자동 배포한다(ADR-005). PR 미리보기는 하루 배포 한도 때문에 껐다 — UI PR 은 스크린샷(ADR-020).
- 로그인이 붙기 전엔 Cloudflare Access 로 팀원만 들어온다. 공개 전에 로그인 · 사용 한도(SPEC R-02)를 붙이고 푼다.
- FE · BE 는 같은 상위 도메인 아래(예: `app.` · `api.`). 도메인 · 서버 · 비밀값은 사람만.
