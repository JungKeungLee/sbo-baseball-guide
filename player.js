/* =========================================================
   내가 오늘 선수라면? — 화면 스크립트
   콘텐츠: player-data.js / 공통 UI: guide-ui.js / 야구장: diamond.js
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, h, toast, makeDiamond, countBox, renderCompare, cardActions, cardHref, createQuiz } = GuideUI;

  /* ---------------- 상태 ---------------- */
  const KEY = "wony-baseball-player-v1";
  const TABS = [
    { key: "basic", label: "기본 역할", icon: "🧢" },
    { key: "tips", label: "꼭 알아둘 것", icon: "📌" },
    { key: "mistakes", label: "자주 하는 실수", icon: "🙅" },
    { key: "situations", label: "실제 상황", icon: "🎬" },
    { key: "quiz", label: "미니 퀴즈", icon: "✏️" },
    { key: "summary", label: "요약", icon: "🏁" }
  ];
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s === "object" && s.seen) return Object.assign({ role: null, tab: {}, seen: {}, quiz: {}, sit: {} }, s);
    } catch (e) { /* 무시 */ }
    return { role: null, tab: {}, seen: {}, quiz: {}, sit: {} };
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } };
  const roleOf = (key) => playerRoles.find((r) => r.key === key);

  function markSeen(roleKey, tabIdx) {
    const s = state.seen[roleKey] || (state.seen[roleKey] = []);
    if (!s.includes(tabIdx)) { s.push(tabIdx); save(); }
  }
  const pctOf = (roleKey) => Math.round(((state.seen[roleKey] || []).length / TABS.length) * 100);

  /* ---------------- 기존 설명으로 이동 ---------------- */
  function linksHtml(links) {
    if (!links || !links.length) return "";
    return `<div class="rule-links">${links.map(([label, to]) =>
      `<a class="rule-link" href="${cardHref(to)}">📘 ${label} <span>→</span></a>`).join("")}</div>`;
  }

  /* ---------------- 오늘 내 포지션은? ---------------- */
  function renderToday() {
    const box = $("#today");
    box.innerHTML = `
      <p class="today-q">오늘 내 포지션은?</p>
      <div class="today-btns">${playerRoles.map((r) => `<button class="role-${r.color}" data-r="${r.key}"><span>${r.icon}</span>${r.name}</button>`).join("")}</div>
      <div class="today-card" hidden></div>`;
    $$(".today-btns button", box).forEach((b) => b.addEventListener("click", () => {
      const r = roleOf(b.dataset.r);
      $$(".today-btns button", box).forEach((x) => x.classList.toggle("active", x === b));
      const c = $(".today-card", box);
      c.hidden = false;
      c.className = "today-card role-" + r.color;
      c.innerHTML = `<p class="tc-label">오늘 이것만 기억하세요 ${r.icon}</p>
        <p class="tc-text">${r.remember}</p>
        <button class="btn btn-primary tc-open">${r.name} 가이드 열기 ↓</button>`;
      c.classList.remove("tc-bounce"); void c.offsetWidth; c.classList.add("tc-bounce");
      $(".tc-open", c).addEventListener("click", () => openRole(r.key, true));
    }));
  }

  /* ---------------- 역할 카드 ---------------- */
  function renderRoleCards() {
    $("#roleCards").innerHTML = playerRoles.map((r) => `
      <button class="role-card role-${r.color}${state.role === r.key ? " active" : ""}" data-r="${r.key}">
        <span class="rc-icon">${r.icon}</span>
        <span class="rc-sub">${r.sub}</span>
        <b class="rc-name">${r.name}</b>
        <span class="rc-one">${r.one}</span>
        <span class="rc-bar"><i style="width:${pctOf(r.key)}%"></i></span>
      </button>`).join("");
    $$("#roleCards .role-card").forEach((b) => b.addEventListener("click", () => openRole(b.dataset.r, true)));
  }

  function openRole(key, scroll) {
    state.role = key;
    save();
    renderRoleCards();
    renderGuide();
    if (scroll) $("#roleGuide").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- 역할 가이드 ---------------- */
  function renderGuide() {
    const root = $("#roleGuide");
    const r = roleOf(state.role);
    if (!r) { root.hidden = true; return; }
    root.hidden = false;
    const tab = state.tab[r.key] || 0;
    root.className = "role-guide role-" + r.color;
    root.innerHTML = `
      <header class="rg-head">
        <span class="rg-icon">${r.icon}</span>
        <h2>${r.title}</h2>
        <p class="rg-intro">${r.intro.join("<br>")}</p>
        <p class="rg-one">💬 ${r.one}</p>
      </header>
      <nav class="rg-tabs" role="tablist">${TABS.map((t, i) => `
        <button role="tab" data-t="${i}" class="${i === tab ? "active" : ""}${(state.seen[r.key] || []).includes(i) ? " seen" : ""}" aria-selected="${i === tab}">
          <span class="rg-no">${i + 1}</span>${t.icon} ${t.label}
        </button>`).join("")}</nav>
      <div class="rg-panel"></div>
      <nav class="rg-pager">
        <button class="btn btn-ghost rg-prev" ${tab === 0 ? "disabled" : ""}>← 이전</button>
        <button class="btn btn-primary rg-next">${tab < TABS.length - 1 ? `다음: ${TABS[tab + 1].label} →` : "다른 포지션 보기 ↑"}</button>
      </nav>`;
    const panel = $(".rg-panel", root);
    PANELS[TABS[tab].key](panel, r);
    markSeen(r.key, tab);
    if (pctOf(r.key) === 100 && !(state.doneToast || {})[r.key]) {
      state.doneToast = Object.assign({}, state.doneToast, { [r.key]: true });
      save();
      toast(`${r.icon} ${r.name} 가이드 완주!`);
    }
    $$(".rg-tabs button", root).forEach((b) => b.addEventListener("click", () => goTab(+b.dataset.t)));
    $(".rg-prev", root).addEventListener("click", () => goTab(tab - 1));
    $(".rg-next", root).addEventListener("click", () => {
      if (tab < TABS.length - 1) goTab(tab + 1);
      else $("#roleCards").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const act = $(".rg-tabs .active", root);
    const nav = $(".rg-tabs", root);
    nav.scrollLeft = act.offsetLeft - nav.clientWidth / 2 + act.clientWidth / 2;
    renderRoleCards();
  }

  function goTab(i) {
    if (i < 0 || i >= TABS.length) return;
    state.tab[state.role] = i;
    save();
    renderGuide();
    $("#roleGuide .rg-tabs").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- 탭 내용 ---------------- */
  const LVBADGE = (lv) => `<span class="plv plv-${lv}">${playerLevels[lv].icon} ${playerLevels[lv].label}</span>`;

  const PANELS = {
    basic(el, r) {
      el.innerHTML = `
        <div class="basics">${r.basics.map((b, i) => `
          <div class="basic" style="--d:${i * 80}ms"><span class="b-icon">${b.icon}</span><div><b>${b.title}</b><p>${b.text}</p></div></div>`).join("")}
        </div>
        <p class="panel-note">이 세 가지만 기억하고, 다음 탭에서 하나씩 자세히 볼게요 👉</p>`;
    },

    tips(el, r) {
      el.innerHTML = `
        <div class="tip-filter" role="group" aria-label="난이도">
          <button data-lv="" class="active">전체</button>
          ${Object.keys(playerLevels).map((k) => `<button data-lv="${k}">${playerLevels[k].icon} ${playerLevels[k].label}</button>`).join("")}
        </div>
        <div class="acc"></div>`;
      const acc = $(".acc", el);
      r.tips.forEach((t, i) => {
        const item = h(`<div class="acc-item" data-lv="${t.level}">
          <button class="acc-head" aria-expanded="false">
            ${LVBADGE(t.level)}<span class="acc-title">${t.title}</span><span class="chev">▾</span>
          </button>
          <div class="acc-body" hidden></div>
        </div>`);
        const body = $(".acc-body", item);
        let built = false;
        const build = () => {
          if (built) return;
          built = true;
          body.appendChild(h(`<p class="g-short">${t.short}</p>`));
          if (t.visual && t.visual.type === "count") {
            body.appendChild(h(`<div class="g-visual center">${countBox({ b: t.visual.b, s: t.visual.s })}</div>`));
          }
          if (t.compare) body.appendChild(renderCompare(t.compare));
          // 공통 카드 하단: 야구장 그림 + [상황 보기] [자세히 알아보기]
          const more = [];
          if (t.detail) more.push(h(`<p class="more-text">${t.detail}</p>`));
          if (t.links) more.push(h(linksHtml(t.links)));
          cardActions(body, { scenarios: t.scenarios, more });
        };
        const head = $(".acc-head", item);
        const toggle = (open) => {
          if (open) build();
          body.hidden = !open;
          head.setAttribute("aria-expanded", String(open));
          item.classList.toggle("open", open);
        };
        head.addEventListener("click", () => toggle(body.hidden));
        acc.appendChild(item);
        if (i === 0) toggle(true);
      });
      $$(".tip-filter button", el).forEach((b) => b.addEventListener("click", () => {
        $$(".tip-filter button", el).forEach((x) => x.classList.toggle("active", x === b));
        $$(".acc-item", el).forEach((it) => { it.hidden = !!b.dataset.lv && it.dataset.lv !== b.dataset.lv; });
      }));
    },

    mistakes(el, r) {
      el.innerHTML = `
        <h3 class="panel-title">초보 ${r.name}가 많이 하는 실수</h3>
        <div class="mistakes">${r.mistakes.map((m, i) => `
          <div class="mk" style="--d:${i * 70}ms">
            <span class="mk-no">${i + 1}</span>
            <p class="mk-bad"><span>❌</span>${m.bad}</p>
            <p class="mk-good"><span>✅</span>${m.good}</p>
          </div>`).join("")}
        </div>`;
    },

    situations(el, r) {
      let i = Math.min(state.sit[r.key] || 0, r.situations.length - 1);
      const draw = () => {
        const s = r.situations[i];
        state.sit[r.key] = i;
        save();
        el.innerHTML = `
          <div class="sit-top"><span>상황 <b>${i + 1}</b> / ${r.situations.length}</span>
            <div class="bc-nav"><button class="s-prev" aria-label="이전 상황" ${i === 0 ? "disabled" : ""}>←</button><button class="s-next" aria-label="다음 상황" ${i === r.situations.length - 1 ? "disabled" : ""}>→</button></div></div>
          <div class="sit">
            <p class="sit-title">🎬 ${s.title}</p>
            ${s.runners || s.count ? `<div class="sit-visual">${s.runners ? '<div class="sit-field"></div>' : ""}${s.count ? countBox({ b: s.count.b, s: s.count.s }) : ""}</div>` : ""}
            <p class="sit-text">${s.text}</p>
            <p class="sit-q">🤔 ${s.question} <small>내가 ${r.name}라면?</small></p>
            <div class="qz-opts">${s.options.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join("")}</div>
            <div class="sit-ans"></div>
          </div>`;
        if (s.runners) makeDiamond($(".sit-field", el), { view: "infield", fielders: false, baseLabels: true, bases: { on: s.runners } });
        $$(".opt", el).forEach((b) => b.addEventListener("click", () => {
          const k = +b.dataset.k;
          const ok = k === s.answer;
          $$(".opt", el).forEach((x, xi) => {
            x.disabled = true;
            x.classList.add(xi === s.answer ? "correct" : xi === k ? "wrong" : "dim");
          });
          const ans = $(".sit-ans", el);
          ans.innerHTML = `<div class="feedback ${ok ? "good" : "bad"}">
              <p class="fb-title">${ok ? "🎉 정답!" : "앗! 다시 생각해보자!"}</p>
              <p>${s.explain}</p>
            </div>`;
          if (s.scenario) cardActions(ans, { scenarios: [{ label: s.title, key: s.scenario }], playLabel: "▶ 야구장에서 보기" });
          if (i < r.situations.length - 1) {
            const nb = h(`<button class="btn btn-primary sit-next-btn">다음 상황 →</button>`);
            nb.addEventListener("click", () => { i++; draw(); });
            ans.appendChild(nb);
          }
        }));
        $(".s-prev", el).addEventListener("click", () => { if (i > 0) { i--; draw(); } });
        $(".s-next", el).addEventListener("click", () => { if (i < r.situations.length - 1) { i++; draw(); } });
      };
      draw();
    },

    quiz(el, r) {
      const indices = playerQuizzes.map((q, i) => (q.role === r.key ? i : -1)).filter((i) => i >= 0);
      el.appendChild(createQuiz({
        id: "pquiz-" + r.key, title: `${r.icon} ${r.name} 미니 퀴즈`, level: 1,
        questions: playerQuizzes, indices,
        resultLabel: `${r.name} 준비도`,
        load: () => state.quiz[r.key],
        put: (v) => { state.quiz[r.key] = v; save(); }
      }));
    },

    summary(el, r) {
      const others = playerRoles.filter((x) => x.key !== r.key);
      el.innerHTML = `
        <div class="sum-card">
          <p class="sum-label">${r.icon} ${r.name} 핵심 정리</p>
          <ol class="sum-list">${r.summary.map((s) => `<li>${s}</li>`).join("")}</ol>
          <p class="sum-remember">오늘 이것만! ${r.remember}</p>
        </div>
        <div class="sum-next">
          <p>다른 포지션도 볼까요?</p>
          <div class="sum-btns">${others.map((o) => `<button class="btn role-btn role-${o.color}" data-r="${o.key}">${o.icon} ${o.name} 가이드</button>`).join("")}</div>
          <a class="rule-link" href="rules.html">📘 규칙이 더 궁금하면 「왜 저렇게 해?」 <span>→</span></a>
        </div>`;
      $$(".sum-btns button", el).forEach((b) => b.addEventListener("click", () => openRole(b.dataset.r, true)));
    }
  };

  /* ---------------- 시작 ---------------- */
  $("#resetPlayer").addEventListener("click", () => {
    if (!confirm("선수 가이드 진행 상황과 퀴즈 기록을 모두 지울까요?")) return;
    state = { role: null, tab: {}, seen: {}, quiz: {}, sit: {} };
    save();
    renderRoleCards();
    renderGuide();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  renderToday();
  renderRoleCards();
  const hm = location.hash.match(/^#(batter|pitcher|catcher)$/);
  if (hm) openRole(hm[1], true);
  else renderGuide();
})();
