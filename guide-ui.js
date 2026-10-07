/* =========================================================
   GuideUI — 생존 가이드 / 선수 가이드가 같이 쓰는 화면 조각
   (야구장, 볼카운트, 비교 카드, 상황 애니메이션, 자세히 보기, 퀴즈 엔진)
   불러오는 순서: diamond.js → guide-data.js → (player-data.js) → guide-ui.js → 페이지 스크립트
   ========================================================= */
(function (global) {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------------- 야구장 ---------------- */
  // cfg: { view, fielders, labels, runners: {id: loc} | [베이스], bases, zone, highlight, highlightPos, arrows }
  function makeDiamond(host, cfg = {}) {
    const d = new BaseballDiamond(host, {
      view: cfg.view || "infield",
      fielders: cfg.fielders !== false,
      labels: cfg.labels || "code",
      baseLabels: !!cfg.baseLabels,
      caption: !!cfg.caption,
      onFielderClick: cfg.onFielderClick || null
    });
    applyStatic(d, cfg);
    return d;
  }
  function applyStatic(d, cfg) {
    if (cfg.zone) d.setZone(cfg.zone);
    if (cfg.highlight) d.highlightGroup(cfg.highlight);
    if (cfg.highlightPos) d.highlightPosition(cfg.highlightPos);
    if (Array.isArray(cfg.runners)) d.setBases({ on: cfg.runners });
    else if (cfg.runners) Object.keys(cfg.runners).forEach((id) => d.addRunner(id, cfg.runners[id]));
    if (cfg.bases) d.setBases(cfg.bases);
    if (cfg.arrows) d.setArrows(cfg.arrows);
  }

  /* ---------------- 볼카운트 ---------------- */
  function lights(kind, n, max) {
    let s = "";
    for (let i = 0; i < max; i++) s += `<span class="lt ${kind}${i < n ? " on" : ""}"></span>`;
    return s;
  }
  function countBox({ b = 0, s = 0, o = null, ballMax = 4, strikeMax = 3, outMax = 3 }) {
    return `<div class="g-count">
      <div><span>BALL</span>${lights("b", b, ballMax)}</div>
      <div><span>STRIKE</span>${lights("s", s, strikeMax)}</div>
      ${o != null ? `<div><span>OUT</span>${lights("o", o, outMax)}</div>` : ""}
    </div>`;
  }

  /* ---------------- 비교 카드 ---------------- */
  function renderCompare(c) {
    const wrap = h(`<div class="cmp cmp-${c.cols.length}"></div>`);
    c.cols.forEach((col) => {
      const v = col.verdict ? `<span class="verdict ${col.verdict}">${{ ok: "⭕", no: "❌", warn: "⚠️" }[col.verdict]}</span>` : "";
      const node = h(`<div class="cmp-col ${col.tone ? "tone-" + col.tone : ""}">
        ${v}<p class="cmp-title">${col.title}</p>
        ${col.bases ? '<div class="cmp-field"></div>' : ""}
        ${col.lines.map((l) => `<p class="cmp-line">${l}</p>`).join("")}
      </div>`);
      if (col.bases) makeDiamond($(".cmp-field", node), { view: "infield", fielders: false, bases: col.bases });
      wrap.appendChild(node);
    });
    const out = document.createDocumentFragment();
    out.appendChild(wrap);
    if (c.note) out.appendChild(h(`<p class="cmp-note">${c.note}</p>`));
    return out;
  }

  /* ---------------- 상황 애니메이션 ---------------- */
  // 시나리오는 player-data.js 의 playerScenarios → guide-data.js 의 guideScenarios 순서로 찾음
  function findScenario(key) {
    /* global playerScenarios, guideScenarios */
    if (typeof playerScenarios !== "undefined" && playerScenarios[key]) return playerScenarios[key];
    if (typeof guideScenarios !== "undefined" && guideScenarios[key]) return guideScenarios[key];
    return null;
  }
  function scenarioView(sc) {
    return /"(LF|CF|RF)"/.test(JSON.stringify(sc)) ? "full" : "infield";
  }

  // list: [{ label, key }] / opts.open: 처음부터 펼치기, opts.button: 버튼 문구
  function renderScenarios(card, list, opts = {}) {
    const label = opts.button || "▶ 상황 예시 보기";
    const box = h(`<div class="scn">
      <button class="btn-scn" aria-expanded="false">${label}</button>
      <div class="scn-body" hidden>
        ${list.length > 1 ? `<div class="scn-tabs" role="tablist">${list.map((s, i) => `<button role="tab" data-i="${i}">${s.label}</button>`).join("")}</div>` : ""}
        <div class="scn-field"></div>
        <button class="btn-replay">↻ 다시 보기</button>
      </div>
    </div>`);
    let d = null, cur = 0;
    const play = (i) => {
      cur = i;
      const sc = findScenario(list[i].key);
      if (!sc) return;
      const view = scenarioView(sc);
      if (!d) d = makeDiamond($(".scn-field", box), { view, caption: true });
      d.setView(view);
      $(".scn-field", box).classList.toggle("full", view === "full");
      $$(".scn-tabs button", box).forEach((b) => b.classList.toggle("active", +b.dataset.i === i));
      d.play(sc);
    };
    const btn = $(".btn-scn", box);
    const toggle = (open) => {
      $(".scn-body", box).hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "■ 상황 예시 닫기" : label;
      if (open) play(cur); else if (d) d.stop();
    };
    btn.addEventListener("click", () => toggle($(".scn-body", box).hidden));
    $$(".scn-tabs button", box).forEach((b) => b.addEventListener("click", () => play(+b.dataset.i)));
    $(".btn-replay", box).addEventListener("click", () => play(cur));
    card.appendChild(box);
    return { open: () => toggle(true), play };
  }

  /* ---------------- 자세히 보기 ---------------- */
  function renderDetail(card, html) {
    const box = h(`<div class="more">
      <button class="btn-more" aria-expanded="false">자세히 보기 <span class="chev">▾</span></button>
      <div class="more-body" hidden><p>${html}</p></div>
    </div>`);
    const btn = $(".btn-more", box);
    btn.addEventListener("click", () => {
      const body = $(".more-body", box);
      body.hidden = !body.hidden;
      btn.setAttribute("aria-expanded", String(!body.hidden));
      btn.firstChild.textContent = body.hidden ? "자세히 보기 " : "접기 ";
    });
    card.appendChild(box);
  }

  /* ---------------- 퀴즈 엔진 ----------------
     opts = {
       id, title, level,
       questions : 문제 배열 전체 ({ question, options, answer, explanation, diagram? })
       indices   : 이 퀴즈에서 쓸 문제 번호들
       sample    : 0 이면 전부, 숫자면 무작위로 그만큼
       grades    : [{ min(정답률), title, msg }] (없으면 간단한 문구)
       resultLabel, restartLabel
       load()    : 저장된 진행 상태 (없으면 undefined)
       put(state): 진행 상태 저장
     }
  */
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  function createQuiz(opts) {
    const { questions, indices } = opts;
    const fresh = () => {
      const queue = opts.sample ? shuffle(indices).slice(0, opts.sample) : indices.slice();
      return { queue, all: queue.slice(), pos: 0, picked: null, results: {}, done: false, retry: false };
    };
    const valid = (q) => q && Array.isArray(q.queue) && Array.isArray(q.all) && q.all.length > 0 &&
      q.all.every((k) => indices.includes(k)) && q.queue.every((k) => indices.includes(k));
    const st = () => {
      let q = opts.load();
      if (!valid(q)) { q = fresh(); opts.put(q); }
      return q;
    };

    const card = h(`<article class="g-card quiz" id="${opts.id}" data-level="${opts.level || 1}">
      <h3 class="g-term">${opts.title}</h3>
      <div class="qz"></div>
    </article>`);
    const box = $(".qz", card);

    const draw = () => {
      const q = st();
      if (q.done) return drawResult();
      const qi = q.queue[q.pos];
      const item = questions[qi];
      const answered = q.picked !== null;
      const correct = answered && q.picked === item.answer;
      box.innerHTML = `
        <div class="qz-top"><span>${q.retry ? "🔁 틀린 문제 다시" : "문제"}</span><span><b>${q.pos + 1}</b> / ${q.queue.length}</span></div>
        <div class="qz-dots">${q.queue.map((k, i) => {
          let cls = "";
          if (i < q.pos || (i === q.pos && answered)) cls = q.results[k] ? "ok" : "no";
          return `<span class="${cls}${i === q.pos ? " now" : ""}"></span>`;
        }).join("")}</div>
        ${item.diagram ? `<div class="qz-field${item.diagram.highlight ? " full" : ""}"></div>` : ""}
        <p class="qz-q">${item.question}</p>
        <div class="qz-opts ${item.options.length === 2 ? "two" : ""}">
          ${item.options.map((o, i) => {
            let cls = "";
            if (answered) cls = i === item.answer ? "correct" : i === q.picked ? "wrong" : "dim";
            return `<button class="opt ${cls}" data-i="${i}" ${answered ? "disabled" : ""}>${o}</button>`;
          }).join("")}
        </div>
        ${answered ? `<div class="feedback ${correct ? "good" : "bad"}">
            <p class="fb-title">${correct ? "🎉 정답!" : "앗! 다시 생각해보자!"}</p>
            ${correct ? "" : `<p>정답은 <b>${item.options[item.answer]}</b></p>`}
            <p>${item.explanation}</p>
          </div>
          <button class="btn btn-primary qz-next">${q.pos + 1 < q.queue.length ? "다음 문제 →" : "결과 보기 🏁"}</button>` : ""}`;
      if (item.diagram) {
        const dg = item.diagram;
        if (dg.highlight) {
          makeDiamond($(".qz-field", box), { view: "full", labels: answered ? "code" : "none", highlightPos: dg.highlight });
        } else {
          makeDiamond($(".qz-field", box), { view: "infield", fielders: false, baseLabels: true, bases: { on: dg.runners || [] } });
        }
      }
      $$(".opt", box).forEach((b) => b.addEventListener("click", () => {
        if (q.picked !== null) return;
        q.picked = +b.dataset.i;
        q.results[qi] = q.picked === item.answer;
        opts.put(q);
        draw();
        const n = $(".qz-next", box);
        if (n) n.focus({ preventScroll: true });
        if (opts.onAnswer) opts.onAnswer(q);
      }));
      const next = $(".qz-next", box);
      if (next) next.addEventListener("click", () => {
        if (q.pos + 1 < q.queue.length) { q.pos++; q.picked = null; } else q.done = true;
        opts.put(q);
        draw();
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    const drawResult = () => {
      const q = st();
      const total = q.all.length;
      const score = q.all.filter((k) => q.results[k]).length;
      const wrong = q.all.filter((k) => q.results[k] === false);
      let grade;
      if (opts.grades) {
        const g = opts.grades.find((x) => score / total >= x.min) || opts.grades[opts.grades.length - 1];
        grade = `<p class="r-grade">${g.title}</p><p class="r-msg">${g.msg}</p>`;
      } else {
        grade = `<p class="r-msg">${score === total ? "🎊 전부 맞혔어요!" : "틀린 문제만 다시 풀어볼까요?"}</p>`;
      }
      box.innerHTML = `<div class="result">
        <p class="r-label">${opts.resultLabel || "결과"}</p>
        <div class="r-score"><b>${score}</b> / ${total}</div>
        ${grade}
        <div class="r-btns">
          ${wrong.length ? `<button class="btn btn-primary r-wrong">🔁 틀린 문제 다시 풀기 (${wrong.length})</button>` : ""}
          <button class="btn btn-outline r-all">↺ ${opts.restartLabel || "처음부터 다시"}</button>
        </div>
      </div>`;
      const rw = $(".r-wrong", box);
      if (rw) rw.addEventListener("click", () => {
        Object.assign(q, { queue: wrong, pos: 0, picked: null, done: false, retry: true });
        opts.put(q);
        draw();
      });
      $(".r-all", box).addEventListener("click", () => {
        opts.put(fresh());
        draw();
      });
    };
    draw();
    return card;
  }

  global.GuideUI = { $, $$, h, toast, makeDiamond, applyStatic, lights, countBox, renderCompare, findScenario, scenarioView, renderScenarios, renderDetail, createQuiz, shuffle };
})(window);
