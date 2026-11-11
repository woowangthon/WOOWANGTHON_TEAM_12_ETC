"""SAMPLE(test-account-content): 심사용 테스트 계정에 견본 자료 · 지원을 **실제 API 로** 넣는다.

경험을 DB 에 손으로 넣지 않는다 — 자료를 넣으면 진짜 AI 분석이 활동 · 경험 · 근거를 만들고,
지원을 넣으면 진짜 매칭 · 초안이 돈다. 가짜는 지어낸 인물의 자료 글뿐이다(ETC docs/ai-scope.md §3).

쓰는 법 (표준 라이브러리만):
    TEST_ACCOUNT_PASSWORD=... python demo/test-account/load.py
    API_BASE=http://localhost:8080 TEST_ACCOUNT_PASSWORD=... python demo/test-account/load.py

- API_BASE 기본값 https://api-woowang.miroda.live (Cloudflare Access 를 푼 뒤에만 된다), LOGIN_ID 기본값 test
- 계정에 활동이 이미 있으면 멈춘다(두 번 넣지 않게). 비운 계정에서만 돌린다.
- 분석 12회(자료 7 · 문항 4 · 초안 1)를 쓴다.
"""

import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
API = os.environ.get("API_BASE", "https://api-woowang.miroda.live").rstrip("/")
LOGIN_ID = os.environ.get("LOGIN_ID", "test")
PASSWORD = os.environ.get("TEST_ACCOUNT_PASSWORD", "")

# 넣는 순서. 두 번째 값이 있으면 그 이름이 든 활동에 「자료 더하기」(S-60)로 붙인다.
SOURCES = [
    ("견본-모여봄-README.md", None),
    ("견본-모여봄-회고.md", "견본-모여봄-README.md"),
    ("견본-코드랩-운영진-회의록.md", None),
    ("견본-현장실습-업무일지.md", None),
    ("견본-교내해커톤-메모.md", None),
    ("견본-알고리즘스터디-기록.md", None),
    ("견본-카페알바-메모.md", None),
]

# contracts README 「문항 유형 → 제안 틀」 — FE 가 미리 고르는 틀과 같게
FRAME = {
    "MOTIVATION": "MOTIVE_LINK", "PROBLEM_SOLVING": "CAUSE_FIX", "COLLABORATION": "ALIGN",
    "CONFLICT": "ALIGN", "IDEA": "CHANGE", "GROWTH": "ORIGIN", "JOB_SKILL": "SKILL_STEPS",
    "ACHIEVEMENT": "STAR", "FAILURE": "CARL", "SELF_INTRO": "PREP", "STRENGTH_WEAKNESS": "PREP",
}

jar = http.cookiejar.CookieJar()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):  # Access 로그인 페이지로 끌려가지 않게
        return None


opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NoRedirect)


def call(method, path, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(API + path, data=data, method=method,
                                 headers={"Content-Type": "application/json", "Accept": "application/json",
                                          # Cloudflare 는 Python 기본 User-Agent 를 막는다(오류 1010)
                                          "User-Agent": "Mozilla/5.0 (compatible; chagok-sample-loader/1.0)"})
    try:
        with opener.open(req, timeout=60) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            sys.exit(f"✗ {path} 가 다른 곳으로 넘어갑니다({e.headers.get('Location', '')[:60]}…) — Cloudflare Access 를 풀었는지 확인")
        sys.exit(f"✗ {method} {path} → {e.code} {e.read().decode('utf-8', 'replace')[:300]}")


def wait(path, done, what, timeout=300):
    start = time.time()
    while time.time() - start < timeout:
        body = call("GET", path)
        state = done(body)
        if state == "COMPLETED":
            return body
        if state == "FAILED":
            sys.exit(f"✗ {what} 실패: {json.dumps(body.get('error'), ensure_ascii=False)} — 다시 돌리기 전에 계정을 비운다")
        time.sleep(3)
    sys.exit(f"✗ {what} 가 {timeout}초 안에 끝나지 않음")


def main():
    if not PASSWORD:
        sys.exit("TEST_ACCOUNT_PASSWORD 를 환경 변수로 주세요(값은 제출 폼 · 서버 .env 에만 있다)")
    me = call("POST", "/api/auth/login", {"loginId": LOGIN_ID, "password": PASSWORD})
    print(f"로그인: {LOGIN_ID} · 오늘 남은 분석 {json.dumps(me.get('dailyAnalysis'), ensure_ascii=False)}")
    if call("GET", "/api/activities")["activities"]:
        sys.exit("✗ 이 계정에 활동이 이미 있습니다 — 견본은 비운 계정에만 넣습니다")

    activity_of = {}
    for name, attach_to in SOURCES:
        body = {"kind": "FILE", "name": name, "text": (HERE / "sources" / name).read_text(encoding="utf-8")}
        if attach_to:
            body["activityId"] = activity_of[attach_to]
        job = call("POST", "/api/sources", body)
        done = wait(f"/api/jobs/{job['jobId']}", lambda b: b["status"], f"자료 분석 {name}")
        activity_of[name] = (done["activityIds"] or [body.get("activityId")])[0]
        print(f"✓ {name} → 활동 {done['activityIds']}")

    spec = json.loads((HERE / "applications.json").read_text(encoding="utf-8"))
    for app in spec["applications"]:
        created = call("POST", "/api/applications", {
            "organization": app["organization"], "organizationType": app["organizationType"],
            "jobRole": app["jobRole"], "questions": [{"text": q["text"]} for q in app["questions"]]})
        if app.get("status"):
            call("PATCH", f"/api/applications/{created['applicationId']}", app["status"])
        for qid, q in zip(created["questionIds"], app["questions"]):
            question = wait(f"/api/questions/{qid}", lambda b: b["status"], f"문항 추천 {qid}")
            if q.get("targetLength"):
                call("PATCH", f"/api/questions/{qid}", {"targetLength": q["targetLength"]})
            print(f"✓ 문항 {qid} · 유형 {question['questionType']} · 추천 {len(question['recommendations'])}개")
            if q.get("answer"):
                call("PUT", f"/api/questions/{qid}/answer", {"text": q["answer"]})
                print(f"  · 확정 답 넣음(지어낸 인물의 글)")
            if q.get("draft") and question["recommendations"]:
                first = question["recommendations"][0]["activity"]["id"]
                ids = [r["experience"]["id"] for r in question["recommendations"] if r["activity"]["id"] == first][:8]
                frame = FRAME.get(question["questionType"], "NONE")
                call("POST", f"/api/questions/{qid}/draft", {"experienceIds": ids, "frame": frame})
                wait(f"/api/questions/{qid}", lambda b: (b.get("draft") or {}).get("status"), f"초안 {qid}")
                print(f"  · 초안 만듦 — 경험 {ids} · 틀 {frame}")
        print(f"✓ 지원 {created['applicationId']} {app['organization']}")

    print("끝 — 웹에서 test 로 들어가 타임라인 · 지원을 한 번 훑어본다")


if __name__ == "__main__":
    main()
