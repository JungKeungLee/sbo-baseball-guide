/* =========================================================
   야구 생존 가이드 — 화면 스크립트
   콘텐츠: guide-data.js / 야구장: diamond.js (BaseballDiamond)
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, h, toast, makeDiamond, lights, countBox, renderCompare, renderScenarios, renderDetail, createQuiz } = GuideUI;

  /* ---------------- 상태 ---------------- */
  const KEY = "wony-baseball-guide-v1";
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && Array.isArray(s.done)) return Object.assign({ ch: 0, level: 3, quiz: {} }, s);
    } catch (e) { /* 무시 */ }
    return { ch: 0, done: [], level: 3, quiz: {} };
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } };


  /* ---------------- 주자 상황 컴포넌트 (재사용) ---------------- */
  const RUNNER_SETS = [
    { label: "주자 없음", on: [] }, { label: "1루", on: [1] }, { label: "2루", on: [2] }, { label: "3루", on: [3] },
    { label: "1·2루", on: [1, 2] }, { label: "1·3루", on: [1, 3] }, { label: "2·3루", on: [2, 3] }, { label: "만루", on: [1, 2, 3] }
  ];
  function runnerText(on) {
    if (!on.length) return "베이스가 텅 비었어요. 타자만 있는 상황!";
    if (on.length === 3) return "<b>만루 · BASES LOADED</b> — 볼넷만 나와도 1점!";
    const base = on.map((n) => n + "루").join("와 ") + "에 주자";
    const risp = on.some((n) => n >= 2);
    return base + (risp ? ' <span class="badge-risp">득점권</span>' : "") + (on.length === 2 && on.includes(1) && on.includes(2) ? "<br><small>1·2루라서 땅볼이면 병살, 뜬공이면 인필드 플라이 조건도 체크!</small>" : "");
  }
  function RunnerPicker(host, { initial = 1, onChange } = {}) {
    host.innerHTML = `
      <div class="rp">
        <div class="rp-btns" role="group" aria-label="주자 상황 선택">
          ${RUNNER_SETS.map((r, i) => `<button data-i="${i}">${r.label}</button>`).join("")}
        </div>
        <div class="rp-body"><div class="rp-field"></div><p class="rp-text"></p></div>
      </div>`;
    const d = makeDiamond($(".rp-field", host), { view: "infield", fielders: false, baseLabels: true });
    const pick = (i) => {
      const r = RUNNER_SETS[i];
      d.setBases({ on: r.on, hl: r.on.filter((n) => n >= 2) });
      $$(".rp-btns button", host).forEach((b) => b.classList.toggle("active", +b.dataset.i === i));
      $(".rp-text", host).innerHTML = runnerText(r.on);
      if (onChange) onChange(r);
    };
    $$(".rp-btns button", host).forEach((b) => b.addEventListener("click", () => pick(+b.dataset.i)));
    pick(initial);
    return { pick };
  }

  /* ---------------- 시각화 ---------------- */
  const VISUALS = {
    diamond(el, v) {
      const host = h(`<div class="g-diamond${v.view === "full" ? " full" : ""}"></div>`);
      el.appendChild(host);
      makeDiamond(host, Object.assign({ baseLabels: v.view !== "full" }, v));
      if (v.label) el.appendChild(h(`<p class="g-vlabel">${v.label}</p>`));
    },
    count(el, v) {
      el.innerHTML = `<div class="g-count-wrap">${countBox({ b: v.b, s: v.s })}
        <ul class="g-count-next">
          <li>다음 공이 <b class="c-b">볼</b> → 볼 4개, <b>볼넷</b></li>
          <li>다음 공이 <b class="c-s">스트라이크</b> → <b>삼진</b></li>
          <li>다음 공이 <b>파울</b> → 그대로 3볼 2스트라이크</li>
        </ul></div>`;
    },
    nested(el) {
      el.innerHTML = `<div class="nest">
        <div class="nest-out"><span class="nest-tag">노히트 노런</span><p>안타 <b>0</b></p>
          <div class="nest-in"><span class="nest-tag gold">퍼펙트게임 👑</span><p>출루 <b>0</b></p><small>안타 · 볼넷 · 몸에 맞는 공 · 실책 출루 모두 없음</small></div>
        </div>
        <p class="nest-cap">퍼펙트게임은 노히트 노런 <b>안에 들어가는</b> 더 엄격한 기록!</p>
      </div>`;
    },
    batbox(el) {
      el.innerHTML = `
        <svg class="batbox" viewBox="0 0 300 190" role="img" aria-label="타석 위치 그림">
          <rect width="300" height="190" rx="18" class="bb-bg"/>
          <circle cx="150" cy="38" r="20" class="bb-mound"/>
          <text x="150" y="42" class="bb-t">투수</text>
          <text x="150" y="16" class="bb-small">↑ 투수 쪽</text>
          <polygon points="138,128 162,128 162,140 150,150 138,140" class="bb-plate"/>
          <rect x="72" y="104" width="52" height="66" rx="4" class="bb-box r"/>
          <rect x="176" y="104" width="52" height="66" rx="4" class="bb-box l"/>
          <text x="98" y="96" class="bb-lbl">우타석</text>
          <text x="98" y="184" class="bb-small">3루 쪽</text>
          <text x="202" y="96" class="bb-lbl">좌타석</text>
          <text x="202" y="184" class="bb-small">1루 쪽</text>
          <text x="98" y="144" class="bb-emoji">🧍</text>
          <text x="202" y="144" class="bb-emoji">🧍</text>
        </svg>
        <p class="g-vlabel">포수 뒤에서 투수 쪽을 바라본 모습</p>
        <div class="hand-row"><span>🫲 <b>좌완</b> = 왼손 투수</span><span>🫱 <b>우완</b> = 오른손 투수</span></div>`;
    },
    lineup(el) {
      const row = (inn, items) => `<div class="lu-row"><span class="lu-inn">${inn}</span>${items.map(([n, r]) =>
        `<span class="lu-chip ${r}"><b>${n}</b><small>${r === "hit" ? "안타" : r === "out" ? "아웃" : r === "next" ? "다음!" : ""}</small></span>`).join("")}</div>`;
      el.innerHTML = `<div class="lineup">
        ${row("1회", [[1, "hit"], [2, "out"], [3, "out"], [4, "out"]])}
        <p class="lu-note">4번 타자가 3번째 아웃 → 공격 끝</p>
        ${row("2회", [[5, "next"], [6, ""], [7, ""], ["…", ""]])}
        <p class="lu-note">2회는 1번이 아니라 <b>5번 타자</b>부터!</p>
      </div>`;
    },
    hitTypes(el) {
      const lane = (name, desc, path, dur) => `
        <div class="ht">
          <svg viewBox="0 0 300 70" aria-hidden="true">
            <line x1="0" y1="62" x2="300" y2="62" class="ht-ground"/>
            <text x="8" y="58" class="ht-bat">🏏</text>
            <path d="${path}" class="ht-path"/>
            <circle r="5" class="ht-ball"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${path}"/></circle>
          </svg>
          <p><b>${name}</b> ${desc}</p>
        </div>`;
      el.innerHTML = `<div class="hittypes">
        ${lane("땅볼", "땅을 굴러가는 타구", "M30,58 Q60,40 90,60 Q120,46 150,60 Q180,52 210,60 L290,60", 2.4)}
        ${lane("뜬공", "공중으로 높이 뜨는 타구", "M30,56 Q150,-50 270,56", 2.8)}
        ${lane("라인드라이브", "낮고 빠르게 직선처럼 날아가는 강한 타구", "M30,54 L290,34", 1.2)}
      </div>`;
    },
    foulCount(el) {
      const r = (from, to, note) => `<div class="fc-row"><div class="fc-s">${lights("s", from, 2)}</div><span class="fc-op">+ 파울 →</span><div class="fc-s">${lights("s", to, 2)}</div><span class="fc-note">${note}</span></div>`;
      el.innerHTML = `<div class="foulcount">
        ${r(0, 1, "1스트라이크")}${r(1, 2, "2스트라이크")}${r(2, 2, "<b>그대로!</b> ✋")}
      </div>`;
    },
    walkoff(el) {
      const f = (top, mid, cls = "") => `<div class="wo ${cls}"><small>${top}</small><b>${mid}</b></div>`;
      el.innerHTML = `<div class="walkoff">
        ${f("9회 말", "3 : 3")}<span>→</span>${f("홈팀", "적시타!")}<span>→</span>${f("주자", "홈인")}<span>→</span>${f("경기 종료 🎉", "4 : 3", "end")}
      </div><p class="g-vlabel">안타면 <b>끝내기 안타</b>, 홈런이면 <b>끝내기 홈런</b></p>`;
    },
    avg(el) {
      el.innerHTML = `<div class="avg">
        <div class="avg-dots">${Array.from({ length: 10 }, (_, i) => `<span class="${i < 3 ? "hit" : ""}">${i < 3 ? "안타" : ""}</span>`).join("")}</div>
        <p><b class="big">0.300</b> = <b class="big">3할</b> = 10번 중 3번 꼴</p>
      </div>`;
    },
    era(el) {
      el.innerHTML = `<div class="era">
        <div class="era-row good"><span>ERA 2.00</span><div class="era-bar"><i style="width:40%"></i></div><b>더 좋아요 👍</b></div>
        <div class="era-row"><span>ERA 5.00</span><div class="era-bar"><i style="width:100%"></i></div><b></b></div>
        <p class="g-vlabel">막대가 짧을수록(숫자가 낮을수록) 점수를 덜 줬다는 뜻</p>
      </div>`;
    },
    cycle(el) {
      el.innerHTML = `<div class="cycle">${["1루타", "2루타", "3루타", "홈런"].map((t, i) =>
        `<div class="stamp" style="--d:${i * 0.15}s"><span>✅</span>${t}</div>`).join("")}</div>`;
    },
    relay(el) {
      const seg = (from, to, name, cls) => `<div class="rl-seg ${cls}" style="flex:${to - from + 1}"><b>${name}</b><small>${from === to ? from + "회" : from + "~" + to + "회"}</small></div>`;
      el.innerHTML = `<div class="relay">${seg(1, 6, "선발", "a")}${seg(7, 8, "불펜", "b")}${seg(9, 9, "마무리", "c")}</div>
        <p class="g-vlabel">예시예요! 경기 상황에 따라 언제든 바뀔 수 있어요</p>`;
    }
  };

  /* ---------------- 카드 ---------------- */
  const LV = (n) => `<span class="lv lv-${n}">${guideLevels[n].icon} ${guideLevels[n].label}</span>`;


  function renderCard(c) {
    const card = h(`<article class="g-card" id="card-${c.id}" data-level="${c.level || 1}">
      <div class="g-card-top">${LV(c.level || 1)}</div>
      ${c.q ? `<p class="g-q">“${c.q}”</p>` : ""}
      <h3 class="g-term">${c.term}${c.en ? ` <small>${c.en}</small>` : ""}</h3>
      ${c.short ? `<p class="g-short">${c.short}</p>` : ""}
    </article>`);
    if (c.visual) {
      const v = h(`<div class="g-visual"></div>`);
      card.appendChild(v);
      VISUALS[c.visual.type](v, c.visual);
    }
    if (c.rows) {
      card.appendChild(h(`<dl class="g-rows">${c.rows.map((r) =>
        `<div class="g-row${r.label === "한 줄 요약" ? " sum" : ""}${/아님|아웃\?|실패/.test(r.label) ? " warn" : ""}"><dt>${r.label}</dt><dd>${r.text}</dd></div>`).join("")}</dl>`));
    }
    if (c.compare) card.appendChild(renderCompare(c.compare));
    if (c.scenarios) renderScenarios(card, c.scenarios);
    if (c.detail) renderDetail(card, c.detail);
    return card;
  }

  /* ---------------- 특수 카드 ---------------- */
  function renderPositionMap() {
    const card = h(`<article class="g-card" id="card-posmap" data-level="1">
      <div class="g-card-top">${LV(1)}</div>
      <div class="zone-tabs" role="tablist">
        <button data-z="" class="active">전체 9명</button><button data-z="infield">내야</button><button data-z="outfield">외야</button>
      </div>
      <div class="g-diamond full posmap"></div>
      <p class="g-hint">👆 선수 동그라미를 눌러보세요</p>
      <div class="pos-pop" aria-live="polite"></div>
    </article>`);
    const pop = $(".pos-pop", card);
    let d;
    const show = (code) => {
      d.highlightPosition(code);
      const p = guidePositions[code];
      pop.innerHTML = `<div class="pos-card">
        <p class="pos-name"><b>${p.name}</b> <span>${code} · ${p.en}</span></p>
        <p class="pos-one">💬 ${p.one}</p>
        <p>📍 ${p.where}</p>
        <button class="link-btn" data-goto-pos="${code}">역할 자세히 보기 →</button>
      </div>`;
      $("[data-goto-pos]", pop).addEventListener("click", () => { pendingPos = code; goChapter(1); });
    };
    d = makeDiamond($(".posmap", card), { view: "full", labels: "ko", onFielderClick: show });
    $$(".zone-tabs button", card).forEach((b) => b.addEventListener("click", () => {
      $$(".zone-tabs button", card).forEach((x) => x.classList.toggle("active", x === b));
      const z = b.dataset.z;
      d.setZone(z || null);
      d.highlightGroup(z === "infield" ? ["1B", "2B", "3B", "SS"] : z === "outfield" ? ["LF", "CF", "RF"] : null);
      pop.innerHTML = z === "infield" ? `<div class="pos-card"><p class="pos-one">💬 <b>내야수</b>: 베이스 주변에서 빠르게 공을 처리하는 선수들</p></div>`
        : z === "outfield" ? `<div class="pos-card"><p class="pos-one">💬 <b>외야수</b>: 멀리 날아가는 공을 책임지는 선수들</p></div>` : "";
    }));
    return card;
  }

  let pendingPos = null;
  function renderPositionTabs() {
    const codes = BaseballDiamond.FIELDERS;
    const card = h(`<article class="g-card" id="card-postabs" data-level="1">
      <div class="g-card-top">${LV(1)}</div>
      <div class="pos-tabs" role="tablist">${codes.map((c) => `<button data-c="${c}">${guidePositions[c].name}<small>${c}</small></button>`).join("")}</div>
      <div class="pt-grid"><div class="g-diamond full pt-field"></div><div class="pt-detail"></div></div>
    </article>`);
    let d;
    const show = (code) => {
      d.highlightPosition(code);
      $$(".pos-tabs button", card).forEach((b) => b.classList.toggle("active", b.dataset.c === code));
      const p = guidePositions[code];
      $(".pt-detail", card).innerHTML = `
        <p class="pos-name"><b>${p.name}</b> <span>${code} · ${p.en}</span></p>
        <dl class="g-rows">
          <div class="g-row"><dt>📍 어디에?</dt><dd>${p.where}</dd></div>
          <div class="g-row"><dt>🎯 하는 일</dt><dd>${p.role}</dd></div>
          <div class="g-row"><dt>💪 중요한 능력</dt><dd>${p.skills.map((s) => `<span class="chip">${s}</span>`).join("")}</dd></div>
          <div class="g-row"><dt>⭐ 대표 플레이</dt><dd>${p.plays.join(" · ")}</dd></div>
          ${p.pitches ? `<div class="g-row"><dt>⚾ 대표 구종</dt><dd>${p.pitches.map((s) => `<span class="chip">${s}</span>`).join("")}</dd></div>` : ""}
          <div class="g-row sum"><dt>💬 한 줄 설명</dt><dd><b>${p.one}</b></dd></div>
        </dl>`;
    };
    d = makeDiamond($(".pt-field", card), { view: "full", labels: "code", onFielderClick: show });
    $$(".pos-tabs button", card).forEach((b) => b.addEventListener("click", () => show(b.dataset.c)));
    show(pendingPos || "P");
    pendingPos = null;
    return card;
  }

  function renderRunnerPicker(c) {
    const card = h(`<article class="g-card" id="card-${c.id}" data-level="${c.level}">
      <div class="g-card-top">${LV(c.level)}</div>
      <h3 class="g-term">${c.title}</h3>
      <p class="g-short">버튼을 누르면 주자가 있는 베이스에 불이 켜져요. <b>2루·3루</b>는 득점권이라 더 밝게!</p>
      <div class="rp-host"></div>
    </article>`);
    RunnerPicker($(".rp-host", card), { initial: 1 });
    return card;
  }

  function renderBroadcast() {
    const card = h(`<article class="g-card bc" id="card-bc" data-level="1">
      <div class="bc-top"><span class="bc-count"></span><div class="bc-nav"><button class="bc-prev" aria-label="이전 문장">←</button><button class="bc-next" aria-label="다음 문장">→</button></div></div>
      <div class="bc-body"></div>
    </article>`);
    let i = 0;
    const draw = () => {
      const L = broadcastLines[i];
      $(".bc-count", card).textContent = `문장 ${i + 1} / ${broadcastLines.length}`;
      const body = $(".bc-body", card);
      body.innerHTML = `
        <p class="bc-line">🎙️ “${L.text}”</p>
        <button class="btn btn-primary bc-show">🔍 해석 보기</button>
        <div class="bc-ans" hidden>
          <div class="bc-visual"><div class="bc-field"></div>${countBox({ b: L.balls, s: L.strikes, o: L.outs, ballMax: 3, strikeMax: 2, outMax: 2 })}</div>
          <ul class="bc-points">${L.points.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>`;
      $(".bc-show", body).addEventListener("click", (e) => {
        e.currentTarget.remove();
        const ans = $(".bc-ans", body);
        ans.hidden = false;
        makeDiamond($(".bc-field", body), { view: "infield", fielders: false, baseLabels: true, bases: { on: L.runners } });
      });
      $(".bc-prev", card).disabled = i === 0;
      $(".bc-next", card).disabled = i === broadcastLines.length - 1;
    };
    $(".bc-prev", card).addEventListener("click", () => { if (i > 0) { i--; draw(); } });
    $(".bc-next", card).addEventListener("click", () => { if (i < broadcastLines.length - 1) { i++; draw(); } });
    draw();
    return card;
  }

  function renderDictionary(c) {
    const card = h(`<article class="g-card" id="card-${c.id}" data-level="${c.level}">
      <div class="g-card-top">${LV(c.level)}</div>
      <h3 class="g-term">${c.title}</h3>
      <input class="dict-search" type="search" placeholder="🔍 용어 검색 (예: 포일, 클린업)" aria-label="용어 검색">
      <ul class="dict"></ul>
    </article>`);
    const list = $(".dict", card);
    const draw = (q) => {
      const items = guideDictionary.filter((d) => !q || d.term.includes(q) || d.desc.includes(q));
      list.innerHTML = items.length ? items.map((d) => `<li>
        <b>${d.term}</b><p>${d.desc}</p>
        ${d.to ? `<button class="link-btn" data-goto="${d.to}">설명 보기 →</button>` : ""}
      </li>`).join("") : `<li class="dict-empty">"${q}" 검색 결과가 없어요 🥲</li>`;
    };
    $(".dict-search", card).addEventListener("input", (e) => draw(e.target.value.trim()));
    draw("");
    return card;
  }

  function renderQIndex(c) {
    return h(`<article class="g-card qindex" id="card-${c.id}" data-level="${c.level}">
      <h3 class="g-term">🙋 이런 게 궁금했죠?</h3>
      <div class="qi-list">${guideQuestions.map((q) => `<button class="qi" data-goto="${q.to}">${q.q}<span>→</span></button>`).join("")}</div>
    </article>`);
  }

  /* ---------------- 퀴즈 (엔진은 guide-ui.js) ---------------- */
  function renderQuizCard(c) {
    const final = c.set === "final";
    const indices = guideQuizzes.map((q, i) => (final || q.set === c.set ? i : -1)).filter((i) => i >= 0);
    return createQuiz({
      id: "card-quiz-" + c.set, title: c.title, level: c.level,
      questions: guideQuizzes, indices, sample: final ? 12 : 0,
      grades: final ? guideGrades : null,
      resultLabel: final ? "⚾ 최종 야구력" : "결과",
      restartLabel: final ? "새 문제로 다시" : "처음부터 다시",
      load: () => state.quiz[c.set],
      put: (v) => { state.quiz[c.set] = v; save(); }
    });
  }

  /* ---------------- 챕터 ---------------- */
  const CARD_RENDER = {
    card: renderCard,
    positionMap: renderPositionMap,
    positionTabs: renderPositionTabs,
    runnerPicker: renderRunnerPicker,
    broadcast: renderBroadcast,
    dictionary: renderDictionary,
    qindex: renderQIndex,
    quiz: renderQuizCard
  };

  function renderNav() {
    $("#chapNav").innerHTML = guideChapters.map((c, i) =>
      `<button data-i="${i}" title="${c.title}" class="${i === state.ch ? "active" : ""} ${state.done.includes(c.id) ? "done" : ""}">
        <span class="cn-no">${i + 1}</span><span class="cn-ic">${c.icon}</span>
      </button>`).join("");
    $$("#chapNav button").forEach((b) => b.addEventListener("click", () => goChapter(+b.dataset.i)));
    const act = $("#chapNav .active");
    if (act) {
      const nav = $("#chapNav");
      nav.scrollLeft = act.offsetLeft - nav.clientWidth / 2 + act.clientWidth / 2;
    }
  }

  function renderProgress() {
    const pct = Math.round((state.done.length / guideChapters.length) * 100);
    $$(".g-power-num").forEach((e) => (e.textContent = pct + "%"));
    $$(".g-power-fill").forEach((e) => (e.style.width = pct + "%"));
  }

  function renderChapter() {
    const i = state.ch;
    const ch = guideChapters[i];
    const root = $("#chapter");
    const done = state.done.includes(ch.id);
    root.innerHTML = `
      <header class="ch-head">
        <span class="ch-no">CHAPTER ${i + 1} / ${guideChapters.length}</span>
        <h2><span>${ch.icon}</span> ${ch.title}</h2>
        <p>${ch.intro}</p>
      </header>
      <div class="ch-cards"></div>
      <div class="ch-hidden" hidden></div>
      <button class="btn-learn ch-done ${done ? "is-done" : ""}">${done ? "✅ 이 챕터 완료! (다시 누르면 취소)" : "👍 이 챕터 이해했어요"}</button>
      <nav class="ch-pager">
        <button class="btn btn-ghost pg-prev" ${i === 0 ? "disabled" : ""}>← 이전</button>
        <button class="btn btn-primary pg-next">${i === guideChapters.length - 1 ? "기본편으로 🏠" : "다음 챕터 →"}</button>
      </nav>`;
    const list = $(".ch-cards", root);
    ch.cards.forEach((c) => list.appendChild(CARD_RENDER[c.type](c)));
    applyLevel();

    $(".ch-done", root).addEventListener("click", () => {
      const k = state.done.indexOf(ch.id);
      if (k >= 0) state.done.splice(k, 1);
      else { state.done.push(ch.id); toast("⚾ 생존력 UP!"); }
      save();
      renderChapter();
      renderNav();
      renderProgress();
    });
    $(".pg-prev", root).addEventListener("click", () => goChapter(i - 1));
    $(".pg-next", root).addEventListener("click", () => {
      if (i === guideChapters.length - 1) location.href = "index.html";
      else goChapter(i + 1);
    });
  }

  function applyLevel() {
    const cards = $$("#chapter .ch-cards > .g-card");
    let hidden = 0;
    cards.forEach((c) => {
      const hide = +c.dataset.level > state.level;
      c.hidden = hide;
      if (hide) hidden++;
    });
    const bar = $("#chapter .ch-hidden");
    if (!bar) return;
    bar.hidden = hidden === 0;
    bar.innerHTML = hidden ? `🔒 더 어려운 카드 <b>${hidden}개</b>가 숨겨져 있어요 <button class="link-btn">모두 보기</button>` : "";
    const b = $("button", bar);
    if (b) b.addEventListener("click", () => setLevel(3));
    $$("#levelFilter button").forEach((b) => b.classList.toggle("active", +b.dataset.lv === state.level));
  }
  function setLevel(lv) {
    state.level = lv;
    save();
    applyLevel();
  }

  function goChapter(i, cardId) {
    if (i < 0 || i >= guideChapters.length) return;
    state.ch = i;
    save();
    history.replaceState(null, "", "#ch-" + (i + 1));
    renderChapter();
    renderNav();
    const target = cardId ? $("#card-" + cardId) : $("#chapter");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (cardId) { target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash"); }
    }
  }

  function goCard(id) {
    const i = guideChapters.findIndex((c) => c.cards.some((x) => x.id === id));
    if (i < 0) return;
    const card = guideChapters[i].cards.find((x) => x.id === id);
    if ((card.level || 1) > state.level) { state.level = 3; save(); toast("모든 단계 카드를 보여줄게요"); }
    goChapter(i, id);
  }

  /* ---------------- 시작 ---------------- */
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) goCard(g.dataset.goto);
  });
  $$("#levelFilter button").forEach((b) => b.addEventListener("click", () => setLevel(+b.dataset.lv)));
  $("#resetGuide").addEventListener("click", () => {
    if (!confirm("생존 가이드 진행 상황과 퀴즈 기록을 모두 지울까요?")) return;
    state = { ch: 0, done: [], level: 3, quiz: {} };
    save();
    goChapter(0);
    renderProgress();
  });
  $("#startBtn").addEventListener("click", () => goChapter(state.ch));

  const m = location.hash.match(/^#ch-(\d+)$/);
  if (m && +m[1] >= 1 && +m[1] <= guideChapters.length) state.ch = +m[1] - 1;
  if (state.ch >= guideChapters.length) state.ch = 0;
  renderChapter();
  renderNav();
  renderProgress();

  // 다른 페이지에서 guide.html#card-steal 처럼 카드로 바로 들어온 경우
  const cm = location.hash.match(/^#card-([\w-]+)$/);
  if (cm) setTimeout(() => goCard(cm[1]), 50);
})();
