#!/usr/bin/env bash
# ETC 레포의 공통 파일을 옆에 클론된 FE · BE · AI 레포로 복사한다.
#   - AGENTS.md 의 common:start ~ common:end 블록 (그 아래 「이 레포」 절은 건드리지 않는다)
#   - .claude/skills/ 전체
#   - .github/ 의 PR 템플릿 · 이슈 템플릿 (epic 은 ETC 전용이라 뺀다)
#   - .editorconfig · .gitattributes
#   - 대상에 없을 때만: CLAUDE.md · .gitignore · AGENTS.md 「이 레포」 틀
# 쓰는 법: ETC 레포 어디서든 `bash scripts/sync-shared.sh` → 각 레포에서 git diff 를 보고 PR.
set -euo pipefail

ETC="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(dirname "$ETC")"
BLOCK="$(mktemp)"
trap 'rm -f "$BLOCK"' EXIT

sed -n '/<!-- common:start/,/<!-- common:end -->/p' "$ETC/AGENTS.md" > "$BLOCK"
if [ ! -s "$BLOCK" ]; then
  echo "ETC AGENTS.md 에 common:start ~ common:end 블록이 없다" >&2
  exit 1
fi

role() {
  case "$1" in
    FE) echo "프론트엔드" ;;
    BE) echo "백엔드" ;;
    AI) echo "AI 서버" ;;
  esac
}

for r in FE BE AI; do
  T="$ROOT/WOOWANGTHON_TEAM_12_$r"
  if [ ! -e "$T/.git" ]; then
    echo "건너뜀 $r — $T 에 클론이 없다"
    continue
  fi

  # AGENTS.md: 공통 블록만 바꾼다
  if [ -f "$T/AGENTS.md" ] && grep -q '<!-- common:start' "$T/AGENTS.md"; then
    awk -v src="$BLOCK" '
      /<!-- common:start/ { while ((getline line < src) > 0) print line; close(src); skip = 1; next }
      /<!-- common:end -->/ { skip = 0; next }
      !skip { print }
    ' "$T/AGENTS.md" > "$T/AGENTS.md.tmp" && mv "$T/AGENTS.md.tmp" "$T/AGENTS.md"
  elif [ -f "$T/AGENTS.md" ]; then
    echo "건너뜀 $r AGENTS.md — 공통 블록 표시가 없다. 손으로 맞춘다" >&2
  else
    {
      cat "$BLOCK"
      echo
      echo "## 이 레포 — $r ($(role "$r"))"
      echo
      echo "- 스택: 미정"
      echo "- 실행: 미정 — 정해지면 README 와 여기에"
      echo "- 검증 명령: 미정 — 정해지면 여기에. 비어 있는 동안은 무엇으로 확인할지 묻는다"
      echo "- 담당: 미정"
    } > "$T/AGENTS.md"
  fi

  [ -f "$T/CLAUDE.md" ] || echo "@AGENTS.md" > "$T/CLAUDE.md"
  [ -f "$T/.gitignore" ] || cp "$ETC/.gitignore" "$T/.gitignore"

  rm -rf "$T/.claude/skills"
  mkdir -p "$T/.claude" "$T/.github/ISSUE_TEMPLATE"
  cp -R "$ETC/.claude/skills" "$T/.claude/skills"

  cp "$ETC/.github/pull_request_template.md" "$T/.github/"
  for f in "$ETC"/.github/ISSUE_TEMPLATE/*; do
    case "$(basename "$f")" in epic.yml) continue ;; esac
    cp "$f" "$T/.github/ISSUE_TEMPLATE/"
  done

  cp "$ETC/.editorconfig" "$ETC/.gitattributes" "$T/"

  echo "== $r"
  git -C "$T" status --short
done
