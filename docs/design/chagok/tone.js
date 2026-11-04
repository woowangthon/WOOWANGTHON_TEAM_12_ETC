// 톤 시험(ETC#19) — <head> 에서 바로 읽어 그리기 전에 data-tone 을 붙이고, 그린 뒤 오른쪽 아래에 「시안 · 먹」 버튼을 단다.
// ?tone=ink | default 로도 바꾼다. 고른 톤은 이 브라우저에 남는다.
(function () {
  var KEY = "chagok:tone";
  var root = document.documentElement;
  function set(tone) {
    try { localStorage.setItem(KEY, tone); } catch (e) {}
    if (tone === "ink") root.dataset.tone = "ink"; else delete root.dataset.tone;
    var box = document.querySelector(".tone-switch");
    if (box) box.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tone === (tone === "ink" ? "ink" : "default"))); });
  }
  try {
    var q = new URLSearchParams(location.search).get("tone");
    set(q || localStorage.getItem(KEY) || "default");
  } catch (e) {}
  document.addEventListener("DOMContentLoaded", function () {
    var box = document.createElement("div");
    box.className = "tone-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "톤 시험");
    box.innerHTML = '<span>톤</span><button type="button" data-tone="default">시안</button><button type="button" data-tone="ink">먹</button>';
    box.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) set(b.dataset.tone); });
    document.body.appendChild(box);
    set(root.dataset.tone === "ink" ? "ink" : "default");
  });
})();
