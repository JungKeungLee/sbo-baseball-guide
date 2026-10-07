/* =========================================================
   야구력 테스트 — 모든 퀴즈를 한곳에 모음
   문제: data.js(quizList) · guide-data.js(guideQuizzes) / 엔진: guide-ui.js(createQuiz)
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, createQuiz } = GuideUI;
  const KEY = "wony-baseball-quiz-v1";
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.sets) return s;
    } catch (e) { /* 무시 */ }
    return { sets: {}, cur: null };
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } };

  const bySet = (set) => guideQuizzes.map((q, i) => (q.set === set ? i : -1)).filter((i) => i >= 0);
  // 기본 퀴즈 등급(10문제 기준 점수)을 정답률로 바꿔서 같은 엔진으로 사용
  const basicGrades = grades.map((g) => ({ min: g.min / quizList.length, title: g.title, msg: g.msg }));

  const SETS = [
    { id: "basic", icon: "⚾", title: "기본 규칙 퀴즈", desc: "점수 · 아웃 · 볼넷 · 홈런", level: 1, questions: quizList, indices: quizList.map((_, i) => i), grades: basicGrades, resultLabel: "⚾ 워니의 야구력" },
    { id: "spot", icon: "🎯", title: "위치 맞히기 게임", desc: "불 켜진 자리는 누구 자리?", level: 1, questions: guideQuizzes, indices: bySet("spot") },
    { id: "position", icon: "🧢", title: "포지션 퀴즈", desc: "투수 · 포수 · 내야 · 외야", level: 1, questions: guideQuizzes, indices: bySet("position") },
    { id: "possible", icon: "⭕", title: "가능할까? 불가능할까?", desc: "도루 · 태그업 · 낫아웃 판단", level: 2, questions: guideQuizzes, indices: bySet("possible") },
    { id: "real", icon: "📺", title: "실제 경기 상황 읽기", desc: "중계에서 나오는 장면", level: 2, questions: guideQuizzes, indices: bySet("real") },
    { id: "final", icon: "🏆", title: "최종 야구력 테스트", desc: "전체에서 무작위 12문제", level: 3, questions: guideQuizzes, indices: guideQuizzes.map((_, i) => i), sample: 12, grades: guideGrades, resultLabel: "🏆 최종 야구력", restartLabel: "새 문제로 다시" }
  ];

  function status(set) {
    const q = state.sets[set.id];
    if (!q || !Array.isArray(q.all)) return { text: `${set.sample || set.indices.length}문제`, cls: "" };
    const score = q.all.filter((k) => q.results[k]).length;
    if (q.done) return { text: `${score} / ${q.all.length}`, cls: score === q.all.length ? "perfect" : "done" };
    const answered = q.all.filter((k) => k in q.results).length;
    return { text: answered ? `${answered} / ${q.all.length} 푸는 중` : `${q.all.length}문제`, cls: answered ? "doing" : "" };
  }

  function renderMenu() {
    $("#quizMenu").innerHTML = SETS.map((s) => {
      const st = status(s);
      return `<button class="qm ${state.cur === s.id ? "active" : ""}" data-id="${s.id}">
        <span class="qm-ic">${s.icon}</span>
        <span class="qm-txt"><b>${s.title}</b><small>${s.desc}</small></span>
        <span class="qm-st ${st.cls}">${st.text}</span>
      </button>`;
    }).join("");
    $$("#quizMenu .qm").forEach((b) => b.addEventListener("click", () => open(b.dataset.id, true)));
  }

  function open(id, scroll) {
    const set = SETS.find((s) => s.id === id);
    if (!set) return;
    state.cur = id;
    save();
    history.replaceState(null, "", "#" + id);
    const box = $("#quizArea");
    box.innerHTML = "";
    box.appendChild(createQuiz({
      id: "quiz-" + set.id, title: `${set.icon} ${set.title}`, level: set.level,
      questions: set.questions, indices: set.indices, sample: set.sample || 0,
      grades: set.grades || null, resultLabel: set.resultLabel, restartLabel: set.restartLabel,
      load: () => state.sets[set.id],
      put: (v) => { state.sets[set.id] = v; save(); renderMenu(); },
      onAnswer: renderMenu
    }));
    renderMenu();
    if (scroll) box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("#resetQuiz").addEventListener("click", () => {
    if (!confirm("모든 퀴즈 기록을 지울까요?")) return;
    state = { sets: {}, cur: null };
    save();
    $("#quizArea").innerHTML = "";
    renderMenu();
  });

  renderMenu();
  const h = location.hash.replace("#", "");
  if (SETS.some((s) => s.id === h)) open(h, true);
  else if (state.cur) open(state.cur, false);
})();
