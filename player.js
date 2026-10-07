/* =========================================================
   내가 오늘 선수라면? — 화면 스크립트
   콘텐츠: player-data.js / 공통 UI: guide-ui.js / 야구장: diamond.js
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, h, toast, makeDiamond, countBox, renderCompare, cardActions, cardHref, createQuiz } = GuideUI;

  /* ---------------- 상태 ---------------- */
  const KEY = "wony-baseball-player-v1";
  const BASE_TABS = [
    { key: "basic", label: "기본 역할", icon: "🧢" },
    { key: "tips", label: "꼭 알아둘 것", icon: "📌" },
    { key: "mistakes", label: "자주 하는 실수", icon: "🙅" },
    { key: "situations", label: "실제 상황", icon: "🎬" },
    { key: "quiz", label: "미니 퀴즈", icon: "✏️" },
    { key: "summary", label: "요약", icon: "🏁" }
  ];
  // 역할별 추가 탭 (player-data.js 의 extraTabs) — 요약 바로 앞에 끼워 넣음
  const EXTRA_TABS = {
    swing: { key: "swing", label: "스윙 비교", icon: "🏏" },
    pitches: { key: "pitches", label: "구종", icon: "🌀" }
  };
  function tabsOf(r) {
    const t = BASE_TABS.slice();
    (r.extraTabs || []).forEach((k) => { if (EXTRA_TABS[k]) t.splice(t.length - 1, 0, EXTRA_TABS[k]); });
    return t;
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s === "object" && s.seen) {
        const st = Object.assign({ role: null, tab: {}, seen: {}, quiz: {}, sit: {} }, s);
        // 예전 기록은 탭 번호로 저장돼 있어서 탭 이름으로 바꿔줌
        const k = (v) => (typeof v === "number" ? (BASE_TABS[v] || BASE_TABS[0]).key : v);
        Object.keys(st.tab).forEach((r) => { st.tab[r] = k(st.tab[r]); });
        Object.keys(st.seen).forEach((r) => { st.seen[r] = Array.from(new Set((st.seen[r] || []).map(k))); });
        return st;
      }
    } catch (e) { /* 무시 */ }
    return { role: null, tab: {}, seen: {}, quiz: {}, sit: {} };
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } };
  const roleOf = (key) => playerRoles.find((r) => r.key === key);

  function markSeen(roleKey, tabKey) {
    const s = state.seen[roleKey] || (state.seen[roleKey] = []);
    if (!s.includes(tabKey)) { s.push(tabKey); save(); }
  }
  const pctOf = (roleKey) => {
    const tabs = tabsOf(roleOf(roleKey));
    const seen = (state.seen[roleKey] || []).filter((k) => tabs.some((t) => t.key === k)).length;
    return Math.round((seen / tabs.length) * 100);
  };

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
    const TABS = tabsOf(r);
    const tab = Math.max(0, TABS.findIndex((t) => t.key === state.tab[r.key]));
    root.className = "role-guide role-" + r.color;
    root.innerHTML = `
      <header class="rg-head">
        <span class="rg-icon">${r.icon}</span>
        <h2>${r.title}</h2>
        <p class="rg-intro">${r.intro.join("<br>")}</p>
        <p class="rg-one">💬 ${r.one}</p>
      </header>
      <nav class="rg-tabs" role="tablist">${TABS.map((t, i) => `
        <button role="tab" data-t="${i}" class="${i === tab ? "active" : ""}${(state.seen[r.key] || []).includes(t.key) ? " seen" : ""}" aria-selected="${i === tab}">
          <span class="rg-no">${i + 1}</span>${t.icon} ${t.label}
        </button>`).join("")}</nav>
      <div class="rg-panel"></div>
      <nav class="rg-pager">
        <button class="btn btn-ghost rg-prev" ${tab === 0 ? "disabled" : ""}>← 이전</button>
        <button class="btn btn-primary rg-next">${tab < TABS.length - 1 ? `다음: ${TABS[tab + 1].label} →` : "다른 포지션 보기 ↑"}</button>
      </nav>`;
    const panel = $(".rg-panel", root);
    PANELS[TABS[tab].key](panel, r);
    markSeen(r.key, TABS[tab].key);
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
    const TABS = tabsOf(roleOf(state.role));
    if (typeof i === "string") i = TABS.findIndex((t) => t.key === i);
    if (i < 0 || i >= TABS.length) return;
    state.tab[state.role] = TABS[i].key;
    save();
    renderGuide();
    $("#roleGuide .rg-tabs").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  let pendingTip = null;
  // VR 야구 준비운동의 해당 위치로 (vr.html)
  const VR_LINK = {
    batter: ["타자 시작 전 준비운동 보기", "vr.html#warmup-batter"],
    pitcher: ["어깨 / 팔 준비운동 보기", "vr.html#warmup-arms"],
    catcher: ["무릎 / 허리 준비운동 보기", "vr.html#warmup-legs"]
  };

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
        if (pendingTip ? t.id === pendingTip : i === 0) {
          toggle(true);
          if (pendingTip) setTimeout(() => item.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
        }
      });
      pendingTip = null;
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

    swing(el) {
      renderSwing(el);
      pendingTip = null;
    },

    pitches(el) {
      renderPitches(el);
      pendingTip = null;
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
          <a class="rule-link" href="${VR_LINK[r.key][1]}">🥽 ${VR_LINK[r.key][0]} <span>→</span></a>
          <a class="rule-link" href="rules.html">📘 규칙이 더 궁금하면 「왜 저렇게 해?」 <span>→</span></a>
        </div>`;
      $$(".sum-btns button", el).forEach((b) => b.addEventListener("click", () => openRole(b.dataset.r, true)));
    }
  };

  /* ---------------- 타자 · 스윙 비교 ----------------
     데이터: player-data.js 의 batterSwing
     5단계(준비 · 시작 · 진입 · 임팩트 · 팔로스루)를 SVG 로 보여주고, 세 스윙 궤적을 겹쳐서 비교
  */
  const SW = batterSwing;
  const swingOf = (k) => SW.swings.find((s) => s.key === k);
  const stepText = (i, k) => {
    const t = SW.steps[i].text;
    return typeof t === "string" ? t : t[k];
  };
  // 점 여러 개를 부드러운 곡선(path)으로 이어줌
  function curve(pts) {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  // 궤적은 '스윙 시작'부터 그림 (준비 자세의 배트 위치는 빼고)
  const pathOf = (sw, upto = 4) => curve(sw.frames.tip.slice(1, upto + 1));
  const ballAt = (sw, i) => (i < 3 ? SW.ballIn[i] : i === 3 ? SW.impact : sw.ballOut);

  function swingSvg(cls = "") {
    return `<svg class="sw-svg ${cls}" viewBox="0 0 320 200" role="img" aria-label="스윙 그림">
      <defs><marker id="swArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sw-arrowhead"/></marker></defs>
      <rect x="0" y="0" width="320" height="200" rx="18" class="sw-bg"/>
      <line x1="0" y1="186" x2="320" y2="186" class="sw-ground"/>
      <text x="306" y="22" class="sw-hint">← 공이 와요</text>
      <g class="sw-paths"></g>
      <g class="sw-batter">
        <circle cx="80" cy="46" r="11" class="sw-body"/>
        <path d="M82,58 L90,118 M90,118 L68,182 M90,118 L114,182" class="sw-limb"/>
        <line x1="86" y1="70" x2="96" y2="72" class="sw-limb sw-arm"/>
      </g>
      <line x1="96" y1="72" x2="58" y2="30" class="sw-bat"/>
      <g class="sw-impact" opacity="0">
        <circle cx="${SW.impact[0]}" cy="${SW.impact[1]}" r="15" class="sw-burst"/>
        <text x="${SW.impact[0]}" y="${SW.impact[1] - 22}" class="sw-pow">딱!</text>
      </g>
      <g class="sw-out" opacity="0"><line class="sw-outline" marker-end="url(#swArrow)"/><text class="sw-outtext"></text></g>
      <circle r="6" cx="300" cy="118" class="sw-ball"/>
    </svg>`;
  }

  function SwingViewer(host) {
    host.innerHTML = `
      <div class="sw-modes" role="tablist">
        ${SW.swings.map((s) => `<button data-m="${s.key}" class="sw-${s.key}"><i></i>${s.name} 보기</button>`).join("")}
        <button data-m="compare" class="sw-cmp">🔀 비교해서 보기</button>
      </div>
      <div class="sw-stage">${swingSvg()}</div>
      <div class="sw-legend" hidden>${SW.swings.map((s) => `<span class="sw-${s.key}"><i></i>${s.name}</span>`).join("")}</div>
      <div class="sw-steps">${SW.steps.map((st, i) => `<button data-s="${i}"><b>${i + 1}</b>${st.name}</button>`).join("")}</div>
      <p class="sw-desc" aria-live="polite"></p>
      <div class="sw-ctrl">
        <button class="btn btn-ghost sw-prev">← 이전</button>
        <button class="btn btn-primary sw-play">▶ 재생</button>
        <button class="btn btn-ghost sw-next">다음 →</button>
      </div>`;
    const svg = $("svg", host);
    const q = (s) => $(s, svg);
    const bat = q(".sw-bat"), arm = q(".sw-arm"), ball = q(".sw-ball");
    const paths = q(".sw-paths"), impact = q(".sw-impact"), outG = q(".sw-out");
    let mode = "down", step = 0, pose = null, raf = 0, fb = 0, timer = 0, run = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setPose = (p) => {
      bat.setAttribute("x1", p.hands[0]); bat.setAttribute("y1", p.hands[1]);
      bat.setAttribute("x2", p.tip[0]); bat.setAttribute("y2", p.tip[1]);
      arm.setAttribute("x2", p.hands[0]); arm.setAttribute("y2", p.hands[1]);
      ball.setAttribute("cx", p.ball[0]); ball.setAttribute("cy", p.ball[1]);
      pose = p;
    };
    const target = (sw, i) => ({ hands: sw.frames.hands[i], tip: sw.frames.tip[i], ball: ballAt(sw, i) });
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

    function drawSingle(i, animate) {
      const sw = swingOf(mode);
      cancelAnimationFrame(raf);
      clearTimeout(fb);
      const to = target(sw, i);
      const trail = q(".sw-trail");
      const done = () => {
        setPose(to);
        trail.setAttribute("d", pathOf(sw, i));
        impact.setAttribute("opacity", i >= 3 ? "1" : "0");
        outG.setAttribute("opacity", i === 4 ? "1" : "0");
      };
      if (!animate || !pose || reduce) { done(); return; }
      const from = pose, t0 = performance.now(), ms = 420;
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const p = { hands: lerp(from.hands, to.hands, e), tip: lerp(from.tip, to.tip, e), ball: lerp(from.ball, to.ball, e) };
        setPose(p);
        trail.setAttribute("d", curve(sw.frames.tip.slice(1, i).concat([p.tip]).filter((_, k, a) => i > 0 || k === a.length - 1)));
        if (t < 1) raf = requestAnimationFrame(tick); else { clearTimeout(fb); done(); }
      };
      raf = requestAnimationFrame(tick);
      // 탭이 백그라운드라 프레임이 안 돌아도 마지막 자세는 꼭 맞춰 둠
      fb = setTimeout(() => { cancelAnimationFrame(raf); done(); }, ms + 120);
    }

    function setMode(m) {
      mode = m;
      run++;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      $$(".sw-modes button", host).forEach((b) => b.classList.toggle("active", b.dataset.m === m));
      const cmp = m === "compare";
      svg.classList.toggle("compare", cmp);
      $(".sw-legend", host).hidden = !cmp;
      $(".sw-steps", host).hidden = cmp;
      $(".sw-prev", host).hidden = cmp;
      $(".sw-next", host).hidden = cmp;
      paths.innerHTML = "";
      if (cmp) {
        // 세 궤적을 한 화면에 겹쳐서
        SW.swings.forEach((s, k) => {
          paths.insertAdjacentHTML("beforeend",
            `<path d="${pathOf(s)}" class="sw-line sw-${s.key}" style="--d:${k * 0.5}s"/>
             <line x1="${SW.impact[0]}" y1="${SW.impact[1]}" x2="${s.ballOut[0]}" y2="${s.ballOut[1]}" class="sw-line thin sw-${s.key}" style="--d:${k * 0.5 + 0.3}s" marker-end="url(#swArrow)"/>`);
        });
        setPose({ hands: [148, 126], tip: [204, 124], ball: SW.impact });
        bat.classList.add("ghost"); arm.classList.add("ghost");
        impact.setAttribute("opacity", "1");
        outG.setAttribute("opacity", "0");
        $(".sw-desc", host).innerHTML = "세 스윙 모두 <b>같은 공(임팩트)</b>을 지나지만, <b>들어오는 길과 빠져나가는 방향</b>이 조금씩 달라요. 어느 하나가 정답은 아니에요!";
        replayCompare();
      } else {
        const sw = swingOf(m);
        bat.classList.remove("ghost"); arm.classList.remove("ghost");
        paths.innerHTML = `<path d="${pathOf(sw)}" class="sw-ghost sw-${m}"/><path class="sw-trail sw-line sw-${m}" d=""/>`;
        const ol = q(".sw-outline");
        ol.setAttribute("x1", SW.impact[0]); ol.setAttribute("y1", SW.impact[1]);
        ol.setAttribute("x2", sw.ballOut[0]); ol.setAttribute("y2", sw.ballOut[1]);
        ol.setAttribute("class", "sw-outline sw-" + m);
        const ot = q(".sw-outtext");
        ot.setAttribute("x", Math.min(sw.ballOut[0], 300)); ot.setAttribute("y", sw.ballOut[1] + (sw.ballOut[1] < 100 ? -8 : 18));
        ot.textContent = sw.result;
        pose = null;
        goStep(0, false);
        play();
      }
    }

    function replayCompare() {
      $$(".sw-line", paths).forEach((p) => { p.classList.remove("draw"); void p.getBoundingClientRect(); p.classList.add("draw"); });
    }

    function goStep(i, animate = true) {
      step = Math.max(0, Math.min(4, i));
      $$(".sw-steps button", host).forEach((b) => b.classList.toggle("active", +b.dataset.s === step));
      const sw = swingOf(mode);
      $(".sw-desc", host).innerHTML = `<b class="sw-stepname sw-${mode}">${step + 1}. ${SW.steps[step].name}</b> ${stepText(step, mode)}`;
      $(".sw-prev", host).disabled = step === 0;
      $(".sw-next", host).disabled = step === 4;
      drawSingle(step, animate);
      return sw;
    }

    function play() {
      if (mode === "compare") { replayCompare(); return; }
      const my = ++run;
      clearTimeout(timer);
      goStep(0, false);
      let i = 0;
      const next = () => {
        if (my !== run || i >= 4) return;
        i++;
        goStep(i, true);
        timer = setTimeout(next, reduce ? 500 : 950);
      };
      timer = setTimeout(next, 600);
    }

    $$(".sw-modes button", host).forEach((b) => b.addEventListener("click", () => setMode(b.dataset.m)));
    $$(".sw-steps button", host).forEach((b) => b.addEventListener("click", () => { run++; clearTimeout(timer); goStep(+b.dataset.s); }));
    $(".sw-prev", host).addEventListener("click", () => { run++; clearTimeout(timer); goStep(step - 1); });
    $(".sw-next", host).addEventListener("click", () => { run++; clearTimeout(timer); goStep(step + 1); });
    $(".sw-play", host).addEventListener("click", play);
    setMode("down");
  }

  function renderSwing(el) {
    el.innerHTML = `
      <section class="sw-intro">
        <div class="sw-badges"><span class="plv plv-good">👍 알아두면 좋음</span><span class="plv plv-tip">🌤 실전 전에 가볍게 보기</span></div>
        <h3 class="sw-title">${SW.title}</h3>
        <p>${SW.intro}</p>
        <p class="rg-one">💬 ${SW.one}</p>
      </section>

      <section class="sw-block">
        <h4 class="sw-h">🎬 단계별로 보기</h4>
        <div class="sw-viewer"></div>
      </section>

      <section class="sw-block">
        <h4 class="sw-h">🃏 세 가지 스윙 카드 <small>옆으로 넘겨보세요</small></h4>
        <div class="sw-cards"></div>
      </section>

      <section class="sw-block">
        <h4 class="sw-h">📋 한눈에 비교</h4>
        <div class="sw-table" role="table">
          <div class="sw-tr sw-th" role="row"><span role="columnheader">스윙</span><span role="columnheader">쉬운 느낌</span><span role="columnheader">초보자 이미지</span></div>
          ${SW.swings.map((s) => `<div class="sw-tr" role="row"><span role="cell" class="sw-name sw-${s.key}"><i></i>${s.name}</span><span role="cell">${s.feel}</span><span role="cell">${s.image}</span></div>`).join("")}
        </div>
        <p class="sw-note">💡 좋고 나쁨을 나누는 표가 아니에요. 배트가 지나가는 길의 <b>차이</b>만 보면 돼요.</p>
      </section>

      <section class="sw-block">
        <h4 class="sw-h">🤔 초보자가 자주 헷갈리는 점</h4>
        <div class="mistakes">${SW.myths.map((m, i) => `
          <div class="mk" style="--d:${i * 70}ms">
            <span class="mk-no">${i + 1}</span>
            <p class="mk-bad"><span>❌</span>${m.bad}</p>
            <p class="mk-good"><span>✅</span>${m.good}</p>
          </div>`).join("")}</div>
      </section>

      <section class="sw-block sw-quiz"></section>

      <p class="sw-notice">※ ${SW.notice}</p>

      <div class="rule-links sw-links">
        <button class="rule-link" data-go="basic">🏏 타자 기본 가이드 보기 <span>→</span></button>
        <button class="rule-link" data-go="tips:b-run">🏃 공을 치면 왜 바로 뛰어야 하나? <span>→</span></button>
        <button class="rule-link" data-go="quiz">✏️ 타자 미니퀴즈 보기 <span>→</span></button>
      </div>`;

    SwingViewer($(".sw-viewer", el));

    const cards = $(".sw-cards", el);
    SW.swings.forEach((s) => {
      const card = h(`<article class="sw-card sw-${s.key}">
        <p class="sw-cname"><i></i>${s.name}</p>
        <p class="sw-cone">${s.one}</p>
        <svg class="sw-mini" viewBox="40 20 280 160" aria-hidden="true">
          <line x1="40" y1="186" x2="320" y2="186" class="sw-ground"/>
          <path d="${pathOf(s)}" class="sw-line sw-${s.key}"/>
          <line x1="${SW.impact[0]}" y1="${SW.impact[1]}" x2="${s.ballOut[0]}" y2="${s.ballOut[1]}" class="sw-line thin sw-${s.key}" marker-end="url(#swArrow)"/>
          <circle cx="${SW.impact[0]}" cy="${SW.impact[1]}" r="6" class="sw-ball"/>
        </svg>
        <p class="sw-feel">느낌: <b>${s.feel}</b></p>
        <ul class="key">${s.points.map((p) => `<li>${p}</li>`).join("")}</ul>
      </article>`);
      cardActions(card, { more: [h(`<p class="more-text">⚠️ ${s.caution}</p>`)] });
      cards.appendChild(card);
    });

    const indices = playerQuizzes.map((q, i) => (q.role === "swing" ? i : -1)).filter((i) => i >= 0);
    $(".sw-quiz", el).appendChild(createQuiz({
      id: "pquiz-swing", title: "✏️ 스윙 미니퀴즈", level: 2,
      questions: playerQuizzes, indices, resultLabel: "스윙 감 잡기",
      load: () => state.quiz.swing,
      put: (v) => { state.quiz.swing = v; save(); }
    }));

    $$(".sw-links [data-go]", el).forEach((b) => b.addEventListener("click", () => {
      const [tab, tip] = b.dataset.go.split(":");
      pendingTip = tip || null;
      goTab(tab);
    }));
  }

  /* ---------------- 투수 · 구종 ----------------
     데이터: player-data.js 의 pitcherPitches
     공 궤적을 두 칸으로 보여줌 — 위에서 본 모습(옆으로 휘는지) / 옆에서 본 모습(떨어지는지)
     두 칸의 공은 같은 시간에 같이 움직이고, 구종마다 걸리는 시간(ms)이 달라 빠르기 차이가 보임
  */
  const PP = pitcherPitches;
  const pitchOf = (k) => PP.pitches.find((p) => p.key === k);
  const PX0 = 32, PX1 = 288;            // 투수 손 → 홈플레이트 (가로 위치)
  const TOP_Y = 50, SIDE_Y0 = 26, SIDE_SLOPE = 24, DROP_K = 0.75;
  // t(0~1) 지점의 공 위치 — 위에서 본 칸 / 옆에서 본 칸
  function pitchAt(m, t) {
    const x = PX0 + (PX1 - PX0) * t;
    const lat = m.lat * Math.pow(t, m.latPow || 2);
    let drop = m.drop * Math.pow(t, m.dropPow || 2) - (m.lift || 0) * Math.sin(Math.PI * t);
    if (m.late && t > m.late.from) drop += m.late.amount * Math.pow((t - m.late.from) / (1 - m.late.from), 2);
    // 글러브 쪽(+)은 화면 위쪽 = 1루 쪽, 오른손 타자는 화면 아래쪽에 서 있음
    return { top: [x, TOP_Y - lat], side: [x, SIDE_Y0 + SIDE_SLOPE * t + drop * DROP_K] };
  }
  const pitchPath = (m, view, upto = 1) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = (i / 40) * upto; pts.push(pitchAt(m, t)[view].map((v) => v.toFixed(1)).join(",")); }
    return pts.join(" ");
  };

  function pitchPanels() {
    return `
      <div class="pt-panel">
        <p class="pt-cap">🔭 위에서 본 모습 <small>옆으로 휘는지</small></p>
        <svg class="pt-svg top" viewBox="0 0 320 100" aria-hidden="true">
          <rect width="320" height="100" rx="14" class="pt-bg"/>
          <line x1="${PX0}" y1="${TOP_Y}" x2="${PX1}" y2="${TOP_Y}" class="pt-center"/>
          <circle cx="22" cy="${TOP_Y}" r="12" class="pt-mound"/><text x="22" y="${TOP_Y + 4}" class="pt-who">투수</text>
          <polygon points="${PX1 - 4},${TOP_Y - 7} ${PX1 + 4},${TOP_Y - 7} ${PX1 + 9},${TOP_Y} ${PX1 + 4},${TOP_Y + 7} ${PX1 - 4},${TOP_Y + 7}" class="pt-plate"/>
          <circle cx="${PX1 + 4}" cy="${TOP_Y + 30}" r="8" class="pt-batter"/><text x="${PX1 - 8}" y="${TOP_Y + 46}" class="pt-small">오른손 타자</text>
          <text x="${PX1 - 2}" y="12" class="pt-small">1루 쪽 ↑</text>
          <g class="pt-lines"></g>
        </svg>
      </div>
      <div class="pt-panel">
        <p class="pt-cap">👀 옆에서 본 모습 <small>떨어지는지</small></p>
        <svg class="pt-svg side" viewBox="0 0 320 100" aria-hidden="true">
          <rect width="320" height="100" rx="14" class="pt-bg"/>
          <line x1="0" y1="93" x2="320" y2="93" class="pt-ground"/>
          <path d="M6,93 Q22,80 38,93 Z" class="pt-moundside"/>
          <circle cx="22" cy="22" r="6" class="pt-body"/><path d="M22,28 L22,52 M22,52 L14,78 M22,52 L30,78 M22,34 L36,${SIDE_Y0}" class="pt-limb"/>
          <rect x="${PX1 - 6}" y="46" width="12" height="34" rx="2" class="pt-zone"/>
          <text x="${PX1 - 26}" y="52" class="pt-small">스트라이크존 →</text>
          <circle cx="${PX1 + 18}" cy="26" r="6" class="pt-body"/><path d="M${PX1 + 18},32 L${PX1 + 18},60 M${PX1 + 18},60 L${PX1 + 12},90 M${PX1 + 18},60 L${PX1 + 24},90" class="pt-limb"/>
          <g class="pt-lines"></g>
        </svg>
      </div>`;
  }

  // keys: 보여줄 구종들, el: 그림을 넣을 곳 → { play() }
  function PitchViewer(el, keys) {
    el.innerHTML = pitchPanels() + `<p class="pt-result" aria-live="polite"></p>`;
    const views = { top: $(".pt-svg.top", el), side: $(".pt-svg.side", el) };
    const items = keys.map((k, i) => {
      const p = pitchOf(k), m = p.motion;
      const it = { p, m, cls: "pc-" + i };
      ["top", "side"].forEach((v) => {
        const g = $(".pt-lines", views[v]);
        g.insertAdjacentHTML("beforeend", `<polyline points="${pitchPath(m, v)}" class="pt-ghost ${it.cls}"/><polyline class="pt-trail ${it.cls}" points=""/><circle r="5" class="pt-ball ${it.cls}" cx="${PX0}" cy="${pitchAt(m, 0)[v][1]}"/>`);
        it[v] = { trail: g.lastElementChild.previousElementSibling, ball: g.lastElementChild };
      });
      return it;
    });
    let raf = 0, fbs = [], run = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setT = (it, t) => ["top", "side"].forEach((v) => {
      const [x, y] = pitchAt(it.m, t)[v];
      it[v].ball.setAttribute("cx", x); it[v].ball.setAttribute("cy", y);
      it[v].trail.setAttribute("points", pitchPath(it.m, v, t));
    });
    const result = $(".pt-result", el);
    function finish() {
      const order = items.slice().sort((a, b) => a.m.ms - b.m.ms);
      result.innerHTML = items.length > 1
        ? `🏁 도착 순서: ${order.map((it) => `<b class="${it.cls}">${it.p.name}</b>`).join(" → ")}`
        : "🏁 포수 미트 도착!";
    }
    function play() {
      const my = ++run;
      cancelAnimationFrame(raf); fbs.forEach(clearTimeout); fbs = [];
      result.innerHTML = "";
      items.forEach((it) => setT(it, 0));
      const k = reduce ? 0.5 : 1, t0 = performance.now();
      const longest = Math.max(...items.map((it) => it.m.ms)) * k;
      const tick = (now) => {
        if (my !== run) return;
        const e = now - t0;
        items.forEach((it) => setT(it, Math.min(1, e / (it.m.ms * k))));
        if (e < longest) raf = requestAnimationFrame(tick); else finish();
      };
      raf = requestAnimationFrame(tick);
      // 탭이 백그라운드라 프레임이 안 돌아도 끝 장면은 맞춰 둠
      fbs.push(setTimeout(() => { if (my !== run) return; cancelAnimationFrame(raf); items.forEach((it) => setT(it, 1)); finish(); }, longest + 150));
    }
    return { play };
  }

  function renderPitches(el) {
    let cur = 0;
    el.innerHTML = `
      <section class="sw-intro">
        <div class="sw-badges"><span class="plv plv-good">👍 알아두면 좋음</span><span class="plv plv-tip">📺 중계 볼 때 도움</span></div>
        <h3 class="sw-title">${PP.title}</h3>
        <p>${PP.intro}</p>
        <p class="rg-one">💬 ${PP.one}</p>
      </section>

      <section class="sw-block">
        <h4 class="sw-h">⚾ 구종 하나씩 보기</h4>
        <div class="pt-tabs" role="tablist">${PP.pitches.map((p, i) => `<button data-i="${i}">${p.icon} ${p.name}</button>`).join("")}</div>
        <div class="pt-card-host"></div>
      </section>

      <section class="sw-block">
        <h4 class="sw-h">🔀 한번에 비교</h4>
        <div class="pt-presets">${PP.presets.map((p, i) => `<button data-i="${i}">${p.label}</button>`).join("")}</div>
        <div class="pt-cmp"></div>
        <p class="pt-note"></p>
        <button class="btn btn-primary pt-replay">▶ 다시 비교하기</button>
      </section>

      <section class="sw-block pt-keycmp"></section>
      <section class="sw-block pt-qcards"></section>
      <section class="sw-block sw-quiz"></section>

      <p class="sw-notice">※ ${PP.notice}</p>

      <div class="rule-links sw-links">
        <button class="rule-link" data-go="basic">⚾ 투수 기본 가이드 보기 <span>→</span></button>
        <button class="rule-link" data-go="tips:p-strike">🎯 왜 빠른 공보다 스트라이크가 먼저일까? <span>→</span></button>
        <button class="rule-link" data-go="quiz">✏️ 투수 미니퀴즈 보기 <span>→</span></button>
      </div>`;

    // 구종 카드 (모바일에서 한 번에 하나)
    const host = $(".pt-card-host", el);
    const showPitch = (i) => {
      cur = (i + PP.pitches.length) % PP.pitches.length;
      const p = PP.pitches[cur];
      $$(".pt-tabs button", el).forEach((b) => b.classList.toggle("active", +b.dataset.i === cur));
      const act = $(".pt-tabs .active", el), nav = $(".pt-tabs", el);
      nav.scrollLeft = act.offsetLeft - nav.clientWidth / 2 + act.clientWidth / 2;
      host.innerHTML = "";
      const card = h(`<article class="pt-card">
        <p class="pt-name"><span>${p.icon}</span>${p.name}${p.alias ? ` <small>${p.alias}</small>` : ""}</p>
        <p class="pt-one">${p.one}</p>
        <div class="pt-view"></div>
        <div class="pt-speed"><span>빠르기 느낌</span><b>${p.speed}</b><i class="dots">${"●".repeat(p.dots)}<em>${"●".repeat(5 - p.dots)}</em></i><button class="pt-again">↻ 다시 보기</button></div>
        <p class="pt-why-t">왜 던지나요?</p>
        <ul class="key">${p.why.map((w) => `<li>${w}</li>`).join("")}</ul>
      </article>`);
      host.appendChild(card);
      const v = PitchViewer($(".pt-view", card), [p.key]);
      $(".pt-again", card).addEventListener("click", () => v.play());
      cardActions(card, { more: [h(`<p class="more-text">${p.desc}</p>`), h(`<p class="more-text">💡 ${p.detail}</p>`)] });
      card.appendChild(h(`<div class="pt-pager"><button class="btn btn-ghost pt-prev">← 이전 구종</button><button class="btn btn-ghost pt-next">다음 구종 →</button></div>`));
      $(".pt-prev", card).addEventListener("click", () => showPitch(cur - 1));
      $(".pt-next", card).addEventListener("click", () => showPitch(cur + 1));
      v.play();
    };
    $$(".pt-tabs button", el).forEach((b) => b.addEventListener("click", () => showPitch(+b.dataset.i)));
    showPitch(0);

    // 한번에 비교
    let cmp = null;
    const showPreset = (i) => {
      const pr = PP.presets[i];
      $$(".pt-presets button", el).forEach((b) => b.classList.toggle("active", +b.dataset.i === i));
      cmp = PitchViewer($(".pt-cmp", el), pr.keys);
      $(".pt-note", el).innerHTML = `<span class="pt-legend">${pr.keys.map((k, j) => `<b class="pc-${j}"><i></i>${pitchOf(k).name}</b>`).join("")}</span>${pr.note}`;
      cmp.play();
    };
    $$(".pt-presets button", el).forEach((b) => b.addEventListener("click", () => showPreset(+b.dataset.i)));
    $(".pt-replay", el).addEventListener("click", () => cmp && cmp.play());
    showPreset(0);

    // 꼭 알아둘 비교 2개
    const kc = $(".pt-keycmp", el);
    kc.insertAdjacentHTML("beforeend", `<h4 class="sw-h">⭐ 초보자에게 가장 중요한 비교</h4>`);
    PP.keyCompares.forEach((c) => {
      const card = h(`<article class="pt-qcard"><p class="pt-qsub">${c.sub}</p><p class="pt-qtitle">${c.title}</p></article>`);
      card.appendChild(renderCompare({ cols: c.cols, note: c.note }));
      kc.appendChild(card);
    });

    // 질문형 카드: 변화구란? / 직구만 던지면 안 돼요?
    const qc = $(".pt-qcards", el);
    [PP.breaking, PP.whyMix].forEach((c) => {
      const card = h(`<article class="pt-qcard">
        <p class="pt-qtitle">“${c.q}”</p>
        <p class="pt-qone">${c.one}</p>
        <p class="more-text">${c.text}</p>
        ${c.mix ? `<div class="pt-mix">${c.mix.map((m) => `<span>${m}</span>`).join("")}</div>` : ""}
      </article>`);
      if (c.detail) cardActions(card, { more: [h(`<p class="more-text">${c.detail}</p>`)] });
      qc.appendChild(card);
    });

    // 미니퀴즈
    const indices = playerQuizzes.map((q, i) => (q.role === "pitch" ? i : -1)).filter((i) => i >= 0);
    $(".sw-quiz", el).appendChild(createQuiz({
      id: "pquiz-pitch", title: "✏️ 구종 미니퀴즈", level: 2,
      questions: playerQuizzes, indices, resultLabel: "구종 감 잡기",
      load: () => state.quiz.pitch,
      put: (v) => { state.quiz.pitch = v; save(); }
    }));

    $$(".sw-links [data-go]", el).forEach((b) => b.addEventListener("click", () => {
      const [tab, tip] = b.dataset.go.split(":");
      pendingTip = tip || null;
      goTab(tab);
    }));
  }

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
  const hm = location.hash.match(/^#(batter|pitcher|catcher)(?:-(\w+))?$/);
  if (hm) {
    state.role = hm[1];
    if (hm[2]) state.tab[hm[1]] = hm[2];
    openRole(hm[1], true);
  }
  else renderGuide();
})();
