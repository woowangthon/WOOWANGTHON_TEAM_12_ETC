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
2. 할 일의 원본은 **GitHub Issue** 다. 회의 · 일정 · 디자인 논의는 Notion 에서 하고, **정한 건 이슈 댓글이나 SPEC 으로 옮긴다** — 에이전트는 Notion 을 읽지 않는다.
   스프린트로 간다([ADR-002](docs/decisions/ADR-002-sprints.md)) — 흐름 하나씩 화면부터 DB · AI 까지 잇고, PM 이 써 보며 고친다. 지금 스프린트는 Milestone 에서 본다.
3. 이슈 하나가 도는 길 — 에이전트에게 말로 시키면 된다.

   | 하고 싶은 것 | 에이전트에게 | 하는 일 |
   | --- | --- | --- |
   | 뭐부터 하지 | 「다음에 뭐 하지?」 「FE 쪽 가져갈 거 있어?」 | `next-up` — 추천 순서(지금 가능 · 목으로 먼저 · 대기) |
   | 가져가서 만들기 | 「FE#5 진행해」 | `implement-issue` — 나를 담당으로 걸고 브랜치 → 구현 → 검증 → PR |
   | 새 일이 생김 | 「F-04 이슈로 나눠 줘」 | `plan-feature` — 이슈를 만들고 선행을 GitHub blocked by 로 건다 |
   | 결정 · 동작이 바뀜 | 「회의 결과 SPEC 에 반영해」 | `sync-spec` |

   - 담당은 미리 정하지 않는다 — 시작하는 사람이 자기를 건다. 끊기면 이슈 댓글로 「한 것 / 남은 것 / 막힌 곳」.
   - 화면 배치 · 문구는 묻지 말고 만들어서 PR 에 스크린샷을 붙인다(덜 된 화면이어도 된다).
4. 브랜치 → PR → 머지. main 직접 push 금지, 계약 · SPEC 을 바꾸는 PR 은 반대편 담당이 승인.
5. 공통 규칙 · 스킬 · 템플릿을 바꾸려면 ETC 에서 고치고 `scripts/sync-shared.sh` 를 돌린 뒤 각 레포에 PR.

## 링크

> 제출 전에 채운다.

- 배포:
- 시연 영상:
- 발표 자료:
- Notion:

제출 전 확인 목록은 [`docs/hackathon.md`](docs/hackathon.md) 「마감 직전 체크」.
