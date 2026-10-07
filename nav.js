/* =========================================================
   공통 상단 메뉴 — 모든 페이지 맨 위에 같은 메뉴를 붙임
   <body data-page="home|basics|pos|rule|player|quiz|vr"> 로 현재 메뉴를 표시
   ========================================================= */
(function () {
  "use strict";
  const MENU = [
    { key: "home", href: "index.html", icon: "🏠", label: "홈" },
    { key: "basics", href: "basics.html", icon: "⚾", label: "기본" },
    { key: "pos", href: "positions.html", icon: "🧢", label: "포지션" },
    { key: "rule", href: "rules.html", icon: "🤔", label: "룰" },
    { key: "player", href: "player.html", icon: "👤", label: "선수" },
    { key: "quiz", href: "quiz.html", icon: "🏆", label: "퀴즈" },
    { key: "vr", href: "vr.html", icon: "🥽", label: "VR" }
  ];
  const page = document.body.dataset.page || "";
  const nav = document.createElement("header");
  nav.className = "app-nav";
  nav.innerHTML = `<nav aria-label="메인 메뉴">${MENU.map((m) =>
    `<a href="${m.href}" class="${m.key === page ? "active" : ""}"${m.key === page ? ' aria-current="page"' : ""}>
      <span class="an-ic" aria-hidden="true">${m.icon}</span><span class="an-t">${m.label}</span>
    </a>`).join("")}</nav>`;
  document.body.insertBefore(nav, document.body.firstChild);
})();
