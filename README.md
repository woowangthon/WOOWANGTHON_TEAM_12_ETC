# WOOWANGTHON_TEAM_12 — <서비스 이름>

2026 AI 우왕톤 12팀 「내가 우왕이 될 상인가」

> 프로젝트 개요는 기획이 확정되면 채운다 — 한 줄 소개 · 문제 · AI 가 바꾸는 장면 · 데모 화면.

## 레포

| 레포 | 역할 | 실행 방법 |
| --- | --- | --- |
| [ETC](https://github.com/woowangthon/WOOWANGTHON_TEAM_12_ETC) | 명세 · 계약 · 결정 기록 · 팀 공통 규칙 | — |
| [FE](https://github.com/woowangthon/WOOWANGTHON_TEAM_12_FE) | 프론트엔드 | 레포 README |
| [BE](https://github.com/woowangthon/WOOWANGTHON_TEAM_12_BE) | 백엔드 | 레포 README |
| [AI](https://github.com/woowangthon/WOOWANGTHON_TEAM_12_AI) | AI 서버 | 레포 README |

## 문서

| 문서 | 내용 |
| --- | --- |
| [`docs/SPEC.md`](docs/SPEC.md) | 개발 명세 — 무엇을 어떻게 동작하게 만드나 |
| [`docs/architecture.md`](docs/architecture.md) | 아키텍처 다이어그램 |
| [`docs/contracts/`](docs/contracts/) | FE · BE · AI 사이 API · JSON 계약 |
| [`docs/decisions/`](docs/decisions/) | 기술 설계 · 선택의 이유(ADR) |
| [`docs/ai-scope.md`](docs/ai-scope.md) | 직접 구현 vs 외부 기술 · AI 기능과 검증 · 목 · 샘플 · 출처 · 한계 |
| [`docs/hackathon.md`](docs/hackathon.md) | 대회 규칙 · 일정 · 제출물 · 배점 (팀 내부용) |

## 팀원용 — 작업 방식

자세한 규칙은 [`AGENTS.md`](AGENTS.md)(사람도 같은 규칙을 따른다).

1. 네 레포를 한 폴더에 클론한다.

   ```bash
   mkdir woowangthon-12 && cd woowangthon-12
   for r in ETC FE BE AI; do gh repo clone woowangthon/WOOWANGTHON_TEAM_12_$r; done
   ```

   AI 에이전트는 이 상위 폴더에서 열면 레포를 넘나들며 명세 · 계약을 읽는다.
2. 할 일은 **GitHub Issue** 에서 본다. 회의 · 일정은 Notion.
3. 브랜치 → PR → 머지. main 직접 push 금지, 계약 · SPEC 을 바꾸는 PR 은 반대편 담당이 승인.
4. 공통 규칙 · 스킬 · 템플릿을 바꾸려면 ETC 에서 고치고 `scripts/sync-shared.sh` 를 돌린 뒤 각 레포에 PR.

## 링크

> 제출 전에 채운다.

- 배포:
- 시연 영상:
- 발표 자료:
- Notion:

제출 전 확인 목록은 [`docs/hackathon.md`](docs/hackathon.md) 「마감 직전 체크」.
