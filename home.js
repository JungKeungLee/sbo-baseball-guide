/* =========================================================
   홈 — 메뉴 카드 5개 + 각 메뉴 진행률
   진행률은 각 페이지가 localStorage 에 남긴 기록을 읽어서 계산
   ========================================================= */
(function () {
  "use strict";

  const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null") || {}; } catch (e) { return {}; } };
  const basic = read("wony-baseball-v1");
  const guide = read("wony-baseball-guide-v1");
  const player = read("wony-baseball-player-v1");
  const quiz = read("wony-baseball-quiz-v1");

  const basicIds = lessons.map((l) => l.id).concat(["board", "summary"]);
  const chapterIds = (track) => guideChapters.filter((c) => c.track === track).map((c) => c.id);
  const ratio = (done, total) => (total ? Math.min(1, done / total) : 0);
  const doneIn = (ids) => ids.filter((id) => (guide.done || []).includes(id)).length;
  const seen = Object.values(player.seen || {}).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0);
  const quizDone = Object.values(quiz.sets || {}).filter((q) => q && q.done).length;

  const MENUS = [
    { href: "basics.html", icon: "⚾", title: "처음 보는 야구", sub: "야구 기본 규칙 배우기", meta: "8단계 · 약 5분",
      p: ratio((basic.learned || []).filter((id) => basicIds.includes(id)).length, basicIds.length) },
    { href: "positions.html", icon: "🧢", title: "선수들은 어디에 있어?", sub: "포지션과 역할 알아보기", meta: "3주제 · 약 3분",
      p: ratio(doneIn(chapterIds("pos")), chapterIds("pos").length) },
    { href: "rules.html", icon: "🤔", title: "왜 저렇게 해?", sub: "도루, 견제, 태그업 등 헷갈리는 규칙", meta: "궁금한 것만 골라 보기",
      p: ratio(doneIn(chapterIds("rule")), chapterIds("rule").length) },
    { href: "player.html", icon: "👤", title: "내가 선수라면?", sub: "타자 · 투수 · 포수 기본 가이드", meta: "포지션별 약 3분",
      p: ratio(seen, 19) }, // 타자 7탭(스윙 비교 포함) + 투수 6 + 포수 6
    { href: "quiz.html", icon: "🏆", title: "야구력 테스트", sub: "퀴즈로 배운 내용 확인하기", meta: "6종류",
      p: ratio(quizDone, 6) }
  ];

  const total = Math.round((MENUS.reduce((s, m) => s + m.p, 0) / MENUS.length) * 100);
  const first = MENUS.findIndex((m) => m.p < 1);

  document.getElementById("homePower").innerHTML = `<span class="hp-label">나의 야구력</span><span class="tp-bar"><i style="width:${total}%"></i></span><b>${total}%</b>`;
  document.getElementById("homeMenu").innerHTML = MENUS.map((m, i) => `
    <a class="home-card${i === first ? " next" : ""}" href="${m.href}">
      ${i === first ? `<span class="hc-badge">${total === 0 ? "여기부터!" : "이어서 보기"}</span>` : ""}
      <span class="hc-ic" aria-hidden="true">${m.icon}</span>
      <span class="hc-txt">
        <b>${m.title}</b>
        <span class="hc-sub">${m.sub}</span>
        <span class="hc-meta">${m.p >= 1 ? "✅ 다 봤어요" : m.meta}</span>
      </span>
      <span class="hc-go" aria-hidden="true">›</span>
      <span class="hc-bar"><i style="width:${Math.round(m.p * 100)}%"></i></span>
    </a>`).join("");
})();
