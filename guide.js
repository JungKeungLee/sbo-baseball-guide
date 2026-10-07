/* =========================================================
   포지션(positions.html) · 룰(rules.html) 페이지 스크립트
   body 의 data-track 으로 어떤 챕터 묶음을 보여줄지 정함
   콘텐츠: guide-data.js / 공통 UI: guide-ui.js / 야구장: diamond.js
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, h, toast, makeDiamond, lights, countBox, renderCompare, cardActions, cardHref } = GuideUI;

  /* ---------------- 상태 ---------------- */
  const KEY = "wony-baseball-guide-v1";
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && Array.isArray(s.done)) return Object.assign({ chs: {} }, s);
    } catch (e) { /* 무시 */ }
    return { chs: {}, done: [] };
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
      el.innerHTML = `<div class="g-count-wrap">${countBox({ b: v.b, s: v.s })}</div>`;
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

  /* ---------------- 공통 카드 틀 ----------------
     모든 카드: [난이도 · 용어] → 질문형 제목 → 한 줄 요약 → (본문: 그림 · 핵심 3가지 · 상황 보기 · 자세히)
     '처음 알기'가 아닌 카드는 제목만 보이게 접어 두고, 누르면 펼침
  */
  const LV = (n) => `<span class="lv lv-${n}">${guideLevels[n].icon} ${guideLevels[n].label}</span>`;

  function shell({ id, level = 1, term = "", q, short, folded, build }) {
    const card = h(`<article class="g-card${folded ? " folded" : ""}" id="card-${id}" data-level="${level}">
      <button class="card-head" aria-expanded="${!folded}">
        <span class="card-meta">${LV(level)}${term ? `<span class="card-term">${term}</span>` : ""}</span>
        <span class="card-q">${q}</span>
        ${short ? `<span class="card-one">${short}</span>` : ""}
        <span class="card-fold" aria-hidden="true"></span>
      </button>
      <div class="card-body"${folded ? " hidden" : ""}></div>
    </article>`);
    const body = $(".card-body", card);
    let built = false;
    const ensure = () => { if (!built) { built = true; build(body); } };
    card._open = () => {
      ensure();
      body.hidden = false;
      card.classList.remove("folded");
      $(".card-head", card).setAttribute("aria-expanded", "true");
    };
    $(".card-head", card).addEventListener("click", () => {
      if (body.hidden) card._open();
      else {
        body.hidden = true;
        card.classList.add("folded");
        $(".card-head", card).setAttribute("aria-expanded", "false");
      }
    });
    if (!folded) ensure();
    return card;
  }

  function renderCard(c) {
    const level = c.level || 1;
    return shell({
      id: c.id, level, term: c.term + (c.en ? ` · ${c.en}` : ""), q: c.q || c.term, short: c.short, folded: level > 1,
      build(body) {
        if (c.visual) {
          const v = h(`<div class="g-visual"></div>`);
          body.appendChild(v);
          VISUALS[c.visual.type](v, c.visual);
        }
        if (c.key) body.appendChild(h(`<ul class="key">${c.key.map((k) => `<li>${k}</li>`).join("")}</ul>`));
        // 그림이 이미 있으면 비교표는 '자세히'로 보냄
        const compareInMore = c.compare && c.visual;
        if (c.compare && !compareInMore) body.appendChild(renderCompare(c.compare));
        const more = [];
        if (c.rows) more.push(h(`<dl class="g-rows">${c.rows.map((r) =>
          `<div class="g-row${r.label === "한 줄 요약" ? " sum" : ""}${/아님|아웃\?|실패/.test(r.label) ? " warn" : ""}"><dt>${r.label}</dt><dd>${r.text}</dd></div>`).join("")}</dl>`));
        if (compareInMore) { const w = h(`<div></div>`); w.appendChild(renderCompare(c.compare)); more.push(w); }
        if (c.detail) more.push(h(`<p class="more-text">${c.detail}</p>`));
        cardActions(body, { scenarios: c.scenarios, more });
      }
    });
  }

  /* ---------------- 특수 카드 ---------------- */
  function renderPositionMap() {
    return shell({
      id: "posmap", q: "수비하는 9명, 어디에 서 있을까?", short: "동그라미를 누르면 그 선수가 뭘 하는지 알려줘요.",
      build(body) {
        body.innerHTML = `
          <div class="zone-tabs" role="tablist">
            <button data-z="" class="active">전체 9명</button><button data-z="infield">내야</button><button data-z="outfield">외야</button>
          </div>
          <div class="g-diamond full posmap"></div>
          <div class="pos-pop" aria-live="polite"></div>`;
        const pop = $(".pos-pop", body);
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
        d = makeDiamond($(".posmap", body), { view: "full", labels: "ko", onFielderClick: show });
        $$(".zone-tabs button", body).forEach((b) => b.addEventListener("click", () => {
          $$(".zone-tabs button", body).forEach((x) => x.classList.toggle("active", x === b));
          const z = b.dataset.z;
          d.setZone(z || null);
          d.highlightGroup(z === "infield" ? ["1B", "2B", "3B", "SS"] : z === "outfield" ? ["LF", "CF", "RF"] : null);
          pop.innerHTML = z === "infield" ? `<div class="pos-card"><p class="pos-one">💬 <b>내야수</b>: 베이스 주변에서 빠르게 공을 처리하는 선수들</p></div>`
            : z === "outfield" ? `<div class="pos-card"><p class="pos-one">💬 <b>외야수</b>: 멀리 날아가는 공을 책임지는 선수들</p></div>` : "";
        }));
      }
    });
  }

  let pendingPos = null;
  function renderPositionTabs() {
    const codes = BaseballDiamond.FIELDERS;
    return shell({
      id: "postabs", q: "포지션마다 무슨 일을 해요?", short: "이름을 누르면 위치와 역할이 바뀌어요.",
      build(body) {
        body.innerHTML = `
          <div class="pos-tabs" role="tablist">${codes.map((c) => `<button data-c="${c}">${guidePositions[c].name}<small>${c}</small></button>`).join("")}</div>
          <div class="pt-grid"><div class="g-diamond full pt-field"></div><div class="pt-detail"></div></div>`;
        let d;
        const show = (code) => {
          d.highlightPosition(code);
          $$(".pos-tabs button", body).forEach((b) => b.classList.toggle("active", b.dataset.c === code));
          const p = guidePositions[code];
          const det = $(".pt-detail", body);
          det.innerHTML = `
            <p class="pos-name"><b>${p.name}</b> <span>${code} · ${p.en}</span></p>
            <p class="pos-one">💬 ${p.one}</p>
            <ul class="key"><li>📍 ${p.where}</li><li>🎯 ${p.role}</li></ul>`;
          cardActions(det, {
            more: [h(`<dl class="g-rows">
              <div class="g-row"><dt>💪 중요한 능력</dt><dd>${p.skills.map((s) => `<span class="chip">${s}</span>`).join("")}</dd></div>
              <div class="g-row"><dt>⭐ 대표 플레이</dt><dd>${p.plays.join(" · ")}</dd></div>
              ${p.pitches ? `<div class="g-row"><dt>⚾ 대표 구종</dt><dd>${p.pitches.map((s) => `<span class="chip">${s}</span>`).join("")}</dd></div>` : ""}
            </dl>`)]
          });
        };
        d = makeDiamond($(".pt-field", body), { view: "full", labels: "code", onFielderClick: show });
        $$(".pos-tabs button", body).forEach((b) => b.addEventListener("click", () => show(b.dataset.c)));
        show(pendingPos || "P");
        pendingPos = null;
      }
    });
  }

  function renderRunnerPicker(c) {
    return shell({
      id: c.id, level: c.level, q: "버튼으로 주자 상황 만들어보기", short: "주자가 있는 베이스에 불이 켜져요. 2루·3루는 득점권!",
      build(body) { RunnerPicker(body, { initial: 1 }); }
    });
  }

  function renderBroadcast() {
    return shell({
      id: "bc", q: "캐스터가 한 말, 무슨 뜻일까?", short: "먼저 스스로 생각해보고 [해석 보기]를 눌러요.",
      build(body) {
        body.innerHTML = `<div class="bc-top"><span class="bc-count"></span><div class="bc-nav"><button class="bc-prev" aria-label="이전 문장">←</button><button class="bc-next" aria-label="다음 문장">→</button></div></div><div class="bc-body"></div>`;
        let i = 0;
        const draw = () => {
          const L = broadcastLines[i];
          $(".bc-count", body).textContent = `문장 ${i + 1} / ${broadcastLines.length}`;
          const box = $(".bc-body", body);
          box.innerHTML = `
            <p class="bc-line">🎙️ “${L.text}”</p>
            <button class="btn btn-primary bc-show">🔍 해석 보기</button>
            <div class="bc-ans" hidden>
              <div class="bc-visual"><div class="bc-field"></div>${countBox({ b: L.balls, s: L.strikes, o: L.outs, ballMax: 3, strikeMax: 2, outMax: 2 })}</div>
              <ul class="key">${L.points.map((p) => `<li>${p}</li>`).join("")}</ul>
            </div>`;
          $(".bc-show", box).addEventListener("click", (e) => {
            e.currentTarget.remove();
            $(".bc-ans", box).hidden = false;
            makeDiamond($(".bc-field", box), { view: "infield", fielders: false, baseLabels: true, bases: { on: L.runners } });
          });
          $(".bc-prev", body).disabled = i === 0;
          $(".bc-next", body).disabled = i === broadcastLines.length - 1;
        };
        $(".bc-prev", body).addEventListener("click", () => { if (i > 0) { i--; draw(); } });
        $(".bc-next", body).addEventListener("click", () => { if (i < broadcastLines.length - 1) { i++; draw(); } });
        draw();
      }
    });
  }

  function renderDictionary(c) {
    return shell({
      id: c.id, level: 2, q: "📖 용어 사전", short: "모르는 말이 나오면 검색해봐요. (25개)", folded: true,
      build(body) {
        body.innerHTML = `<input class="dict-search" type="search" placeholder="🔍 용어 검색 (예: 포일, 클린업)" aria-label="용어 검색"><ul class="dict"></ul>`;
        const list = $(".dict", body);
        const draw = (q) => {
          const items = guideDictionary.filter((d) => !q || d.term.includes(q) || d.desc.includes(q));
          list.innerHTML = items.length ? items.map((d) => `<li>
            <b>${d.term}</b><p>${d.desc}</p>
            ${d.to ? `<button class="link-btn" data-goto="${d.to}">설명 보기 →</button>` : ""}
          </li>`).join("") : `<li class="dict-empty">"${q}" 검색 결과가 없어요 🥲</li>`;
        };
        $(".dict-search", body).addEventListener("input", (e) => draw(e.target.value.trim()));
        draw("");
      }
    });
  }

  function renderQIndex(c) {
    return shell({
      id: c.id, q: "🙋 이런 게 궁금했죠?", short: "질문을 누르면 그 설명으로 바로 가요.",
      build(body) {
        body.innerHTML = `<div class="qi-list">${guideQuestions.map((q) => `<button class="qi" data-goto="${q.to}">${q.q}<span>→</span></button>`).join("")}</div>`;
      }
    });
  }

  function renderLinkCard(c) {
    return shell({
      id: c.id, level: c.level, q: `${c.icon} ${c.title}`, short: c.text,
      build(body) { body.innerHTML = `<a class="btn btn-primary link-card-btn" href="${c.href}">${c.button}</a>`; }
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
    linkCard: renderLinkCard
  };

  // 이 페이지가 보여줄 챕터 묶음 (body data-track: pos = 선수들은 어디에 있어?, rule = 왜 저렇게 해?)
  const TRACK = document.body.dataset.track || "rule";
  const CH = guideChapters.filter((c) => c.track === TRACK);
  const NEXT_PAGE = { pos: ["왜 저렇게 해? →", "rules.html"], rule: ["야구력 테스트 →", "quiz.html"] };
  state.chs = state.chs || {};
  const cur = () => Math.min(state.chs[TRACK] || 0, CH.length - 1);

  function renderNav() {
    const c = cur();
    $("#chapNav").innerHTML = CH.map((ch, i) =>
      `<button data-i="${i}" class="${i === c ? "active" : ""} ${state.done.includes(ch.id) ? "done" : ""}" aria-label="${ch.title}">
        <span class="cn-ic">${ch.icon}</span><span class="cn-t">${ch.title}</span>
      </button>`).join("");
    $$("#chapNav button").forEach((b) => b.addEventListener("click", () => goChapter(+b.dataset.i)));
    const act = $("#chapNav .active");
    if (act) {
      const nav = $("#chapNav");
      nav.scrollLeft = act.offsetLeft - nav.clientWidth / 2 + act.clientWidth / 2;
    }
  }

  function renderProgress() {
    const n = CH.filter((c) => state.done.includes(c.id)).length;
    const pct = Math.round((n / CH.length) * 100);
    const el = $("#trackProgress");
    if (el) el.innerHTML = `<span class="tp-bar"><i style="width:${pct}%"></i></span><span>${n} / ${CH.length} 다 봤어요</span>`;
  }

  function renderChapter() {
    const i = cur();
    const ch = CH[i];
    const root = $("#chapter");
    const done = state.done.includes(ch.id);
    const last = i === CH.length - 1;
    root.innerHTML = `
      <header class="ch-head">
        <span class="ch-no">${i + 1} / ${CH.length}</span>
        <h2><span>${ch.icon}</span> ${ch.title}</h2>
        <p>${ch.intro}</p>
      </header>
      <div class="ch-cards"></div>
      <button class="btn-learn ch-done ${done ? "is-done" : ""}">${done ? "✅ 다 봤어요! (다시 누르면 취소)" : "👍 이 주제 다 봤어요"}</button>
      <nav class="ch-pager">
        <button class="btn btn-ghost pg-prev" ${i === 0 ? "disabled" : ""}>← 이전</button>
        <button class="btn btn-primary pg-next">${last ? NEXT_PAGE[TRACK][0] : "다음 →"}</button>
      </nav>`;
    const list = $(".ch-cards", root);
    ch.cards.forEach((c) => list.appendChild(CARD_RENDER[c.type](c)));

    $(".ch-done", root).addEventListener("click", () => {
      const k = state.done.indexOf(ch.id);
      if (k >= 0) state.done.splice(k, 1);
      else { state.done.push(ch.id); toast("⚾ 야구력 UP!"); }
      save();
      renderChapter();
      renderNav();
      renderProgress();
    });
    $(".pg-prev", root).addEventListener("click", () => goChapter(i - 1));
    $(".pg-next", root).addEventListener("click", () => {
      if (last) location.href = NEXT_PAGE[TRACK][1];
      else goChapter(i + 1);
    });
  }

  function goChapter(i, cardId) {
    if (i < 0 || i >= CH.length) return;
    state.chs[TRACK] = i;
    save();
    history.replaceState(null, "", "#ch-" + (i + 1));
    renderChapter();
    renderNav();
    const target = cardId ? $("#card-" + cardId) : $("#chapter");
    if (target) {
      if (cardId && target._open) target._open();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (cardId) { target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash"); }
    }
  }

  // 다른 묶음(포지션 ↔ 룰)의 카드면 그 페이지로 이동
  function goCard(id) {
    const ch = guideChapters.find((c) => c.cards.some((x) => x.id === id));
    if (!ch) return;
    if (ch.track !== TRACK) { location.href = cardHref(id); return; }
    goChapter(CH.indexOf(ch), id);
  }

  /* ---------------- 시작 ---------------- */
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) goCard(g.dataset.goto);
  });
  const reset = $("#resetGuide");
  if (reset) reset.addEventListener("click", () => {
    if (!confirm("이 페이지에서 '다 봤어요' 표시를 모두 지울까요?")) return;
    state.done = state.done.filter((id) => !CH.some((c) => c.id === id));
    state.chs[TRACK] = 0;
    save();
    goChapter(0);
    renderProgress();
  });

  const m = location.hash.match(/^#ch-(\d+)$/);
  if (m && +m[1] >= 1 && +m[1] <= CH.length) state.chs[TRACK] = +m[1] - 1;
  renderChapter();
  renderNav();
  renderProgress();

  // 다른 페이지에서 rules.html#card-steal 처럼 카드로 바로 들어온 경우
  const cm = location.hash.match(/^#card-([\w-]+)$/);
  if (cm) setTimeout(() => goCard(cm[1]), 50);
})();
