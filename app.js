/* =========================================================
   워니의 야구 입문서 — 동작 스크립트
   콘텐츠는 data.js 에 있고, 이 파일은 화면 그리기/상태 관리만 합니다.
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------- 저장 상태 ---------------- */
  const STORE_KEY = "wony-baseball-v1";
  const LEARN_IDS = lessons.map((l) => l.id).concat(["board", "summary"]);

  function freshQuiz() {
    return { mode: "all", queue: quizList.map((_, i) => i), pos: 0, picked: null, results: {}, done: false };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.learned) && s.quiz && Array.isArray(s.quiz.queue)) return s;
      }
    } catch (e) { /* 저장소를 못 쓰는 환경이면 그냥 새로 시작 */ }
    return { learned: [], quiz: freshQuiz() };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
  }
  let state = load();

  /* ---------------- 공통: 토스트 / 진행률 ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  function progress() {
    const learned = state.learned.filter((id) => LEARN_IDS.includes(id)).length;
    const answered = Object.keys(state.quiz.results).length;
    return Math.round((learned / LEARN_IDS.length) * 50 + (answered / quizList.length) * 50);
  }
  let lastPct = null;
  function updateProgress() {
    const pct = progress();
    $$(".power-num").forEach((el) => (el.textContent = pct + "%"));
    $$(".power-fill").forEach((el) => (el.style.width = pct + "%"));
    const msg = $(".hero-power-msg");
    if (pct >= 100) msg.innerHTML = "🎉 <b>야구력 100%!</b> 이제 SBO 볼 준비 완료!";
    if (lastPct !== null && pct > lastPct) {
      $$(".power-num").forEach((el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
      if (pct >= 100) toast("🏆 야구력 100%! 경기 볼 준비 완료!");
    }
    lastPct = pct;
  }

  /* ---------------- 공통: 다이아몬드 SVG ---------------- */
  // 0: 홈, 1: 1루, 2: 2루, 3: 3루 (포수 뒤에서 본 모습 — 1루가 오른쪽)
  const BASES = [
    { x: 100, y: 165, label: "홈", lx: 100, ly: 197 },
    { x: 165, y: 100, label: "1루", lx: 165, ly: 130 },
    { x: 100, y: 35, label: "2루", lx: 100, ly: 18 },
    { x: 35, y: 100, label: "3루", lx: 35, ly: 130 }
  ];
  const pt = (i) => BASES[i].x + "," + BASES[i].y;

  function diamondSVG({ runners = [], labels = true, path = 0, runner = false, cls = "" } = {}) {
    let s = `<svg class="diamond ${cls}" viewBox="0 0 200 205" aria-hidden="true">`;
    s += `<rect x="2" y="2" width="196" height="201" rx="26" class="d-grass"/>`;
    s += `<polygon points="100,188 177,100 100,14 23,100" class="d-dirt"/>`;
    s += `<polygon points="100,150 150,100 100,50 50,100" class="d-infield"/>`;
    s += `<polygon points="${[0, 1, 2, 3].map(pt).join(" ")}" class="d-line"/>`;
    if (path) {
      const seq = [0, 1, 2, 3, 0].slice(0, path + 1).map(pt).join(" ");
      s += `<polyline points="${seq}" class="d-path"/>`;
    }
    if (runner) s += `<polyline points="${pt(0)}" class="d-path live"/>`;
    s += `<circle cx="100" cy="100" r="7" class="d-mound"/>`;
    [1, 2, 3].forEach((i) => {
      const b = BASES[i];
      const on = runners.includes(i) ? " on" : "";
      s += `<rect x="${b.x - 9}" y="${b.y - 9}" width="18" height="18" rx="2" transform="rotate(45 ${b.x} ${b.y})" class="d-base${on}" data-base="${i}"/>`;
    });
    s += `<polygon points="91,160 109,160 109,168 100,176 91,168" class="d-home" data-base="0"/>`;
    if (labels) {
      BASES.forEach((b) => { s += `<text x="${b.lx}" y="${b.ly}" class="d-label">${b.label}</text>`; });
    }
    if (runner) {
      s += `<g class="d-runner" style="transform: translate(${BASES[0].x}px, ${BASES[0].y}px)"><circle r="10"/><text y="4">타</text></g>`;
    }
    s += `</svg>`;
    return s;
  }

  /* ---------------- 단계별 설명 카드 ---------------- */
  function renderItem(it) {
    if (it.base) {
      const runners = it.base < 4 ? [it.base] : [];
      return `<div class="item hit-item${it.featured ? " featured" : ""}">
        ${it.featured ? '<span class="ribbon">BEST ✨</span>' : ""}
        ${diamondSVG({ runners, labels: false, path: it.base, cls: "mini" })}
        <div class="item-title">${it.title}</div>
        <div class="item-desc">→ ${it.desc}</div>
      </div>`;
    }
    let icon;
    if (it.anim === "fly" || it.anim === "roll") {
      icon = `<div class="i-anim anim-${it.anim}"><span class="a-ball">⚾</span><span class="a-glove">🧤</span></div>`;
    } else {
      icon = `<div class="i-icon${it.anim ? " anim-" + it.anim : ""}">${it.icon || ""}</div>`;
    }
    return `<div class="item${it.tone ? " tone-" + it.tone : ""}">
      ${icon}
      <div class="item-title">${it.title}</div>
      ${it.big ? `<div class="item-big">${it.big}</div>` : ""}
      ${it.desc ? `<div class="item-desc">${it.desc}</div>` : ""}
    </div>`;
  }

  function renderLessons() {
    const wrap = $("#lessons");
    wrap.innerHTML = lessons.map((l) => `
      <article class="card lesson" id="lesson-${l.id}" data-learn-id="${l.id}">
        <div class="lesson-head">
          <span class="step-chip">STEP ${l.step}</span>
          <span class="done-badge">✅ 완료</span>
        </div>
        <h3><span class="lesson-emoji">${l.emoji}</span> ${l.title}</h3>
        <p class="lead">${l.lead}</p>
        ${l.points ? `<ul class="points">${l.points.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
        ${l.big ? `<div class="big-word">${l.big}</div>` : ""}
        ${l.items ? `<div class="items items-${l.items.length}">${l.items.map(renderItem).join("")}</div>` : ""}
        ${l.tip ? `<p class="tip">${l.tip}</p>` : ""}
        ${l.visual ? `<div class="visual" data-visual="${l.visual}"></div>` : ""}
        <button class="btn-learn" data-learn="${l.id}">👍 이해했어!</button>
      </article>`).join("");

    $$("[data-visual]", wrap).forEach((el) => {
      const fn = VISUALS[el.dataset.visual];
      if (fn) fn(el);
    });
  }

  /* ---------------- 위젯: 베이스 한 바퀴 ---------------- */
  function visualDiamond(el) {
    el.innerHTML = `
      <div class="widget run-widget">
        <div class="run-field">${diamondSVG({ runner: true })}<div class="pop" aria-hidden="true">+1점!</div></div>
        <div class="run-side">
          <div class="run-score">점수 <b class="run-num">0</b></div>
          <p class="run-msg">타자가 홈에서 기다리는 중…</p>
          <button class="btn btn-primary btn-sm run-btn">▶ 한 바퀴 달려보기</button>
        </div>
      </div>`;
    const svg = $("svg", el);
    const runner = $(".d-runner", svg);
    const line = $(".d-path.live", svg);
    const msg = $(".run-msg", el);
    const btn = $(".run-btn", el);
    const num = $(".run-num", el);
    const pop = $(".pop", el);
    let score = 0;
    const order = [1, 2, 3, 0];
    const names = ["1루 도착!", "2루 도착!", "3루 도착!", "홈인! 🎉"];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    btn.addEventListener("click", () => {
      btn.disabled = true;
      line.setAttribute("points", pt(0));
      $$(".d-base, .d-home", svg).forEach((b) => b.classList.remove("visited"));
      let i = 0;
      const stepGap = reduce ? 250 : 700;
      const go = () => {
        const b = order[i];
        runner.style.transform = `translate(${BASES[b].x}px, ${BASES[b].y}px)`;
        setTimeout(() => {
          line.setAttribute("points", line.getAttribute("points") + " " + pt(b));
          const baseEl = $(`[data-base="${b}"]`, svg);
          if (baseEl) baseEl.classList.add("visited");
          msg.textContent = names[i];
          i++;
          if (i < order.length) {
            setTimeout(go, 150);
          } else {
            score++;
            num.textContent = score;
            pop.classList.remove("show"); void pop.offsetWidth; pop.classList.add("show");
            msg.innerHTML = "홈에 들어왔으니 <b>1점!</b> 🎉";
            btn.textContent = "▶ 한 번 더 달리기";
            btn.disabled = false;
          }
        }, stepGap - 150);
      };
      go();
    });
  }

  /* ---------------- 위젯: 볼카운트 체험 ---------------- */
  function lights(kind, n, max) {
    let s = "";
    for (let i = 0; i < max; i++) s += `<span class="light ${kind}${i < n ? " on" : ""}"></span>`;
    return s;
  }
  function visualCount(el) {
    const c = { b: 0, s: 0, o: 0 };
    let busy = false;
    el.innerHTML = `
      <div class="widget count-widget">
        <p class="widget-title">🎮 직접 던져보기</p>
        <div class="count-board">
          <div class="count-row"><span class="c-label">BALL</span><span class="c-lights" data-k="b"></span></div>
          <div class="count-row"><span class="c-label">STRIKE</span><span class="c-lights" data-k="s"></span></div>
          <div class="count-row"><span class="c-label">OUT</span><span class="c-lights" data-k="o"></span></div>
        </div>
        <p class="count-msg">공을 던져서 불을 채워봐!</p>
        <div class="count-btns">
          <button class="btn btn-yellow btn-sm" data-pitch="s">⚾ 스트라이크</button>
          <button class="btn btn-green btn-sm" data-pitch="b">🙅 볼</button>
          <button class="btn btn-ghost btn-sm" data-pitch="r">↺</button>
        </div>
      </div>`;
    const msg = $(".count-msg", el);
    const draw = () => {
      $('[data-k="b"]', el).innerHTML = lights("ball", c.b, 4);
      $('[data-k="s"]', el).innerHTML = lights("strike", c.s, 3);
      $('[data-k="o"]', el).innerHTML = lights("out", c.o, 3);
    };
    const say = (html, cls) => {
      msg.innerHTML = html;
      msg.className = "count-msg" + (cls ? " " + cls : "");
    };
    const later = (fn) => { busy = true; setTimeout(() => { fn(); busy = false; draw(); }, 1300); };
    draw();

    $$("[data-pitch]", el).forEach((b) => b.addEventListener("click", () => {
      const p = b.dataset.pitch;
      if (p === "r") { c.b = c.s = c.o = 0; busy = false; draw(); say("공을 던져서 불을 채워봐!"); return; }
      if (busy) return;
      if (p === "s") {
        c.s++;
        if (c.s === 3) {
          c.o++;
          draw();
          if (c.o === 3) {
            say("🔥 삼진 아웃! 그리고 <b>3 OUT → 공수교대!</b>", "big");
            later(() => { c.b = c.s = c.o = 0; say("새 이닝 시작! 다시 던져봐"); });
          } else {
            say("🔥 <b>3 STRIKE → 삼진 아웃!</b>", "big");
            later(() => { c.b = c.s = 0; say("다음 타자 등장! 🧢"); });
          }
          return;
        }
        say(`스트라이크 ${c.s}개! ${c.s === 2 ? "하나만 더 들어가면 삼진!" : ""}`);
      } else {
        c.b++;
        if (c.b === 4) {
          draw();
          say("🚶 <b>4 BALL → 볼넷!</b> 타자는 1루로", "big good");
          later(() => { c.b = c.s = 0; say("다음 타자 등장! 🧢"); });
          return;
        }
        say(`볼 ${c.b}개! ${c.b === 3 ? "하나만 더 나오면 볼넷!" : ""}`);
      }
      draw();
    }));
  }

  /* ---------------- 위젯: 홈런 점수 ---------------- */
  function visualHomerun(el) {
    const opts = [
      { label: "주자 없음", runners: [] },
      { label: "주자 1명", runners: [1] },
      { label: "주자 2명", runners: [1, 2] },
      { label: "만루", runners: [1, 2, 3] }
    ];
    el.innerHTML = `
      <div class="widget hr-widget">
        <div class="seg" role="group" aria-label="주자 수 선택">
          ${opts.map((o, i) => `<button data-i="${i}">${o.label}</button>`).join("")}
        </div>
        <div class="hr-body">
          <div class="hr-field"></div>
          <div class="hr-result"></div>
        </div>
      </div>`;
    const show = (i) => {
      const o = opts[i];
      const n = o.runners.length + 1;
      $$(".seg button", el).forEach((b) => b.classList.toggle("active", +b.dataset.i === i));
      $(".hr-field", el).innerHTML = diamondSVG({ runners: o.runners, cls: "hr" });
      const balls = "🏃".repeat(o.runners.length) + "🧢";
      const name = n === 1 ? "솔로 홈런" : n === 4 ? "만루 홈런" : `${n}점 홈런`;
      $(".hr-result", el).innerHTML = `
        <div class="hr-eq">주자 <b>${o.runners.length}</b> + 타자 <b>1</b></div>
        <div class="hr-people" aria-hidden="true">${balls}</div>
        <div class="hr-score"><b>${n}</b>점</div>
        <div class="hr-name">${name}</div>
        ${n === 4 ? '<div class="grand">🏆 이걸 <b>그랜드슬램</b>이라고 불러요!</div>' : ""}`;
      const r = $(".hr-score", el);
      r.classList.remove("bump"); void r.offsetWidth; r.classList.add("bump");
    };
    $$(".seg button", el).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    show(0);
  }

  /* ---------------- 위젯: 이닝 표 ---------------- */
  function visualInning(el) {
    let sel = { inn: 3, half: "말" };
    const cells = (half) => Array.from({ length: 9 }, (_, i) =>
      `<td><button data-inn="${i + 1}" data-half="${half}" aria-label="${i + 1}회 ${half}"></button></td>`).join("");
    el.innerHTML = `
      <div class="widget inning-widget">
        <div class="inning-scroll">
          <table class="inning-table">
            <thead><tr><th></th>${Array.from({ length: 9 }, (_, i) => `<th>${i + 1}</th>`).join("")}</tr></thead>
            <tbody>
              <tr><th>원정 <small>초</small></th>${cells("초")}</tr>
              <tr><th>홈 <small>말</small></th>${cells("말")}</tr>
            </tbody>
          </table>
        </div>
        <p class="inning-msg"></p>
      </div>`;
    const draw = () => {
      $$("button[data-inn]", el).forEach((b) => {
        b.classList.toggle("active", +b.dataset.inn === sel.inn && b.dataset.half === sel.half);
      });
      const team = sel.half === "초" ? "원정팀" : "홈팀";
      $(".inning-msg", el).innerHTML = `<b class="pill">${sel.inn}회 ${sel.half}</b> = ${sel.inn}번째 이닝, <b>${team}</b> 공격 중!`;
    };
    $$("button[data-inn]", el).forEach((b) => b.addEventListener("click", () => {
      sel = { inn: +b.dataset.inn, half: b.dataset.half };
      draw();
    }));
    draw();
  }

  const VISUALS = { diamond: visualDiamond, count: visualCount, homerun: visualHomerun, inning: visualInning };

  /* ---------------- 실전 전광판 ---------------- */
  function explainBoard(sc) {
    const team = sc.half === "초" ? "원정팀" : "홈팀";
    const outTxt = [
      "아직 아웃 없음 (노아웃)",
      "아웃 1개 — 2개 더 잡히면 공수교대",
      "아웃 2개 — 하나만 더 잡히면 공수교대!"
    ][sc.outs];
    let runTxt;
    if (sc.runners.length === 0) runTxt = "베이스에 주자 없음";
    else if (sc.runners.length === 3) runTxt = "<b>만루!</b> 1·2·3루 모두 주자가 있음";
    else runTxt = sc.runners.map((r) => r + "루").join("와 ") + "에 주자가 있음";
    const cntTxt = sc.balls === 0 && sc.strikes === 0
      ? "새 타자가 막 들어왔어요 (0볼 0스트라이크)"
      : `현재 타자는 <b>${sc.balls}볼 ${sc.strikes}스트라이크</b>`;
    return [
      ["🕒", `${sc.inning}번째 이닝, <b>${team} 공격 중</b>`],
      ["✋", outTxt],
      ["🏃", runTxt],
      ["🎯", cntTxt]
    ];
  }

  function renderBoard(idx) {
    const sc = boardScenarios[idx];
    $("#scoreboard").innerHTML = `
      <div class="sb-top">
        <div class="sb-team"><span>${sc.away.name}</span><b>${sc.away.score}</b></div>
        <div class="sb-inning">${sc.inning}회 <span class="${sc.half === "초" ? "up" : "down"}">${sc.half === "초" ? "▲" : "▼"}</span> ${sc.half}</div>
        <div class="sb-team"><span>${sc.home.name}</span><b>${sc.home.score}</b></div>
      </div>
      <div class="sb-main">
        <div class="sb-diamond">${diamondSVG({ runners: sc.runners, labels: false, cls: "led" })}</div>
        <div class="sb-count">
          <div class="sb-row"><span>B</span>${lights("ball", sc.balls, 3)}</div>
          <div class="sb-row"><span>S</span>${lights("strike", sc.strikes, 2)}</div>
          <div class="sb-row"><span>O</span>${lights("out", sc.outs, 2)}</div>
        </div>
      </div>`;
    $("#boardExplain").innerHTML = `
      <h4>📌 현재 상황</h4>
      <ul>${explainBoard(sc).map(([i, t]) => `<li><span>${i}</span><p>${t}</p></li>`).join("")}</ul>
      ${sc.note ? `<p class="board-tip">${sc.note}</p>` : ""}`;
    $$("#boardSwitch button").forEach((b) => b.classList.toggle("active", +b.dataset.i === idx));
  }
  function initBoard() {
    $("#boardSwitch").innerHTML = boardScenarios.map((s, i) =>
      `<button data-i="${i}">예시 ${i + 1}<small>${s.inning}회 ${s.half}</small></button>`).join("");
    $$("#boardSwitch button").forEach((b) => b.addEventListener("click", () => renderBoard(+b.dataset.i)));
    renderBoard(0);
  }

  /* ---------------- 요약 & 용어 ---------------- */
  function renderSummary() {
    $("#flow").innerHTML = summaryFlow.map((f, i) =>
      `<li style="--d:${i * 80}ms"><span class="f-icon">${f.icon}</span><span>${f.text}</span></li>`).join("");
  }
  function renderGlossary() {
    $("#glossary").innerHTML = glossary.map((g) => `
      <div class="term">
        <div class="term-icon">${g.icon}</div>
        <div><h4>${g.term}</h4><p>${g.desc}</p></div>
      </div>`).join("");
    const btn = $("#moreToggle");
    btn.addEventListener("click", () => {
      const box = $("#glossary");
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.firstChild.textContent = open ? "접기 " : "조금 더 알아보기 ";
      if (open) box.classList.add("opening");
    });
  }

  /* ---------------- 학습 완료 버튼 ---------------- */
  function syncLearned() {
    $$("[data-learn-id]").forEach((card) => {
      const done = state.learned.includes(card.dataset.learnId);
      card.classList.toggle("is-done", done);
      const btn = $(`[data-learn="${card.dataset.learnId}"]`, card);
      if (btn) btn.textContent = done ? "✅ 완료! (다시 누르면 취소)" : "👍 이해했어!";
    });
  }
  function initLearnButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-learn]");
      if (!btn) return;
      const id = btn.dataset.learn;
      const i = state.learned.indexOf(id);
      if (i >= 0) {
        state.learned.splice(i, 1);
      } else {
        state.learned.push(id);
        btn.classList.remove("pressed"); void btn.offsetWidth; btn.classList.add("pressed");
        toast("⚾ 야구력 UP!");
      }
      save();
      syncLearned();
      updateProgress();
    });
  }

  /* ---------------- 퀴즈 ---------------- */
  const LETTERS = ["1", "2", "3", "4", "5", "6"];

  function score() {
    return Object.values(state.quiz.results).filter(Boolean).length;
  }
  function wrongList() {
    return quizList.map((_, i) => i).filter((i) => state.quiz.results[i] === false);
  }
  function gradeFor(n) {
    return grades.find((g) => n >= g.min) || grades[grades.length - 1];
  }

  function renderQuiz() {
    const q = state.quiz;
    const box = $("#quizBox");
    if (q.done) return renderResult();

    const qi = q.queue[q.pos];
    const item = quizList[qi];
    const total = q.queue.length;
    const answered = q.picked !== null;
    const correct = answered && q.picked === item.answer;

    const dots = q.queue.map((k, i) => {
      let c = "";
      if (i < q.pos || (i === q.pos && answered)) c = q.results[k] ? "ok" : "no";
      if (i === q.pos) c += " now";
      return `<span class="dot ${c}"></span>`;
    }).join("");

    box.innerHTML = `
      <div class="q-top">
        <span class="q-mode">${q.mode === "retry" ? "🔁 틀린 문제 다시 풀기" : "⚾ 야구 퀴즈"}</span>
        <span class="q-count"><b>${q.pos + 1}</b> / ${total}</span>
      </div>
      <div class="q-dots">${dots}</div>
      <h3 class="q-text"><span class="q-no">Q${qi + 1}.</span> ${item.question}</h3>
      <div class="q-options">
        ${item.options.map((o, i) => {
          let c = "";
          if (answered) {
            if (i === item.answer) c = "correct";
            else if (i === q.picked) c = "wrong";
            else c = "dim";
          }
          return `<button class="opt ${c}" data-opt="${i}" ${answered ? "disabled" : ""}>
            <span class="opt-no">${LETTERS[i]}</span><span>${o}</span></button>`;
        }).join("")}
      </div>
      ${answered ? `
        <div class="feedback ${correct ? "good" : "bad"}">
          <p class="fb-title">${correct ? "🎉 정답!" : "앗! 다시 생각해보자!"}</p>
          ${correct ? "" : `<p class="fb-answer">정답은 <b>${item.options[item.answer]}</b></p>`}
          <p class="fb-exp">${item.explanation}</p>
        </div>
        <button class="btn btn-primary q-next">${q.pos + 1 < total ? "다음 문제 →" : "결과 보기 🏁"}</button>` : ""}
    `;

    $$(".opt", box).forEach((b) => b.addEventListener("click", () => pick(+b.dataset.opt)));
    const next = $(".q-next", box);
    if (next) next.addEventListener("click", nextQuestion);
  }

  function pick(i) {
    const q = state.quiz;
    if (q.picked !== null) return;
    const qi = q.queue[q.pos];
    q.picked = i;
    q.results[qi] = i === quizList[qi].answer;
    save();
    renderQuiz();
    updateProgress();
    const next = $(".q-next");
    if (next) next.focus({ preventScroll: true });
  }

  function nextQuestion() {
    const q = state.quiz;
    if (q.pos + 1 < q.queue.length) {
      q.pos++;
      q.picked = null;
    } else {
      q.done = true;
    }
    save();
    renderQuiz();
    scrollTo("#quiz");
  }

  function renderResult() {
    const n = score();
    const g = gradeFor(n);
    const wrong = wrongList();
    const pct = Math.round((n / quizList.length) * 100);
    $("#quizBox").innerHTML = `
      <div class="result">
        <p class="r-label">⚾ 워니의 야구력</p>
        <div class="r-score"><b>${n}</b> / ${quizList.length}</div>
        <div class="r-bar"><span style="width:${pct}%"></span></div>
        <p class="r-grade">${g.title}</p>
        <p class="r-msg">${g.msg}</p>
        ${wrong.length ? `
          <div class="r-wrong">
            <p>틀린 문제 <b>${wrong.length}개</b></p>
            <ul>${wrong.map((i) => `<li>Q${i + 1}. ${quizList[i].question}</li>`).join("")}</ul>
          </div>` : `<p class="r-perfect">🎊 전부 맞혔어! 완벽해!</p>`}
        <div class="r-btns">
          ${wrong.length ? `<button class="btn btn-primary" id="retryWrong">🔁 틀린 문제 다시 풀기</button>` : ""}
          <button class="btn btn-outline" id="retryAll">↺ 처음부터 다시 풀기</button>
        </div>
      </div>`;
    const rw = $("#retryWrong");
    if (rw) rw.addEventListener("click", () => {
      state.quiz = { ...state.quiz, mode: "retry", queue: wrongList(), pos: 0, picked: null, done: false };
      save();
      renderQuiz();
      scrollTo("#quiz");
    });
    $("#retryAll").addEventListener("click", () => {
      state.quiz = freshQuiz();
      save();
      renderQuiz();
      updateProgress();
      scrollTo("#quiz");
    });
  }

  /* ---------------- 스크롤 & 메뉴 ---------------- */
  function scrollTo(sel) {
    const el = $(sel);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function initNav() {
    $$("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("href");
      scrollTo(id);
      history.replaceState(null, "", id);
    }));

    // 현재 보고 있는 섹션을 메뉴에 표시
    const links = $$(".menu a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach((s) => io.observe(s));
  }

  /* ---------------- 초기화 ---------------- */
  $("#resetAll").addEventListener("click", () => {
    if (!confirm("학습 진행률과 퀴즈 기록을 모두 지울까요?")) return;
    state = { learned: [], quiz: freshQuiz() };
    save();
    syncLearned();
    renderQuiz();
    lastPct = null;
    updateProgress();
    scrollTo("#hero");
  });

  renderLessons();
  initBoard();
  renderSummary();
  renderGlossary();
  initLearnButtons();
  syncLearned();
  renderQuiz();
  initNav();
  updateProgress();
})();
