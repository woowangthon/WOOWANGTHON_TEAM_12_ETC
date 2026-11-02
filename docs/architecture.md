# 아키텍처

> 다이어그램은 GitHub 이 그려 주는 mermaid 로. 왜 이렇게 정했나는 [ADR-003](decisions/ADR-003-stack-and-ai-boundary.md) · [ADR-004](decisions/ADR-004-deploy.md).

```mermaid
flowchart LR
    U[사용자] -->|Cloudflare Tunnel| FE[FE]
    U -->|Cloudflare Tunnel| BE[BE · Spring Boot]
    subgraph OCI 서버 · Docker Compose
        BE -->|REST · 내부망| AI[AI 서버 · FastAPI]
        BE --> DB[(PostgreSQL)]
    end
    AI --> LLM[LLM API]
```

## 구성 요소

| 구성 | 레포 | 스택 | 하는 일 |
| --- | --- | --- | --- |
| FE | `WOOWANGTHON_TEAM_12_FE` | 미정 | 화면 |
| BE | `WOOWANGTHON_TEAM_12_BE` | Spring Boot | 인증 · 저장 · 조회 · 수정 · 분석 작업 상태 · 사용 한도. AI 서버를 부르는 유일한 곳 |
| AI | `WOOWANGTHON_TEAM_12_AI` | Python FastAPI | 받은 텍스트에서 활동 · 경험 · 근거를 뽑아 JSON 으로 돌려준다. DB 를 만지지 않는다 |
| DB | (BE 가 관리) | PostgreSQL (`pgvector/pgvector` 이미지, 확장은 아직 안 켬) | 원본 · 활동 · 경험 · 근거 |

## 배포

- OCI 서버 하나에 Docker Compose. Cloudflare Tunnel 로 FE · BE 만 내보내고, AI 서버 · DB 는 내부망에만 둔다.
- 로그인이 붙기 전엔 Cloudflare Access 로 팀원만 들어온다. 공개 전에 로그인 · 사용 한도(SPEC R-02)를 붙이고 푼다.
- FE · BE 는 같은 상위 도메인 아래(예: `app.` · `api.`). 도메인 · 서버 · 비밀값은 사람만.
