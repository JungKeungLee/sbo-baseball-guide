/* =========================================================
   BaseballDiamond — 재사용 야구장 컴포넌트
   포지션 배치도, 주자 상황, 도루/태그업/병살 애니메이션을 모두 이 하나로 그립니다.

   사용법:
     const d = new BaseballDiamond(el, { view: "full" | "infield", fielders: true, labels: "code" | "ko" | "none" });
     d.setBases({ on: [1, 2], hl: [2, 3] });   // 주자 있는 베이스 / 강조 베이스
     d.setZone("infield" | "outfield" | null); // 내야/외야 영역 강조
     d.highlightPosition("SS");                // 포지션 강조 (null 이면 해제)
     d.setArrows([{ from: "B1", to: "B2", kind: "run" | "throw" }]);
     d.play(scenario);                          // 애니메이션 시나리오 실행 (guide-data.js 참고)

   위치(loc) 표기:
     "H" "B1" "B2" "B3"                     홈/베이스
     "P" "C" "1B" "2B" "SS" "3B" "LF" "CF" "RF"   기본 수비 위치
     [x, y]                                 좌표 (viewBox 300x300 기준)
     { between: ["B1", "B2"], t: 0.3 }      두 지점 사이 (0~1)
     { at: "B2", dx: 0, dy: -12 }           어떤 지점에서 살짝 옆
   ========================================================= */
(function (global) {
  "use strict";

  /* 베이스 좌표 — 이 사이트의 모든 야구장(포지션 · 룰 · 선수 · 기본편)이 이 값 하나를 씀
     포수 뒤에서 본 모습: 홈 = 아래, 1루 = 오른쪽, 2루 = 위, 3루 = 왼쪽
     좌표는 viewBox(300×300) 기준이라 화면 크기가 바뀌어도 비율 그대로 늘어나고 줄어듦 */
  const BASE_POSITIONS = {
    home: [150, 258],
    first: [214, 194],
    second: [150, 130],
    third: [86, 194]
  };
  // 주루 순서 (홈 → 1루 → 2루 → 3루 → 홈)
  const ROUTE = ["home", "first", "second", "third", "home"];
  // 시나리오 데이터에서 쓰는 짧은 이름
  const BASE_ALIAS = { H: "home", B1: "first", B2: "second", B3: "third" };
  const BASE_NAME = { home: "홈", first: "1루", second: "2루", third: "3루" };
  // 베이스 이름표 위치: 주자 길(베이스 사이 선)과 겹치지 않게 다이아몬드 바깥쪽에 둠
  const BASE_LABEL_POS = { home: [-26, 12], first: [18, 18], second: [0, -19], third: [-18, 18] };

  const PTS = {
    H: BASE_POSITIONS.home, B1: BASE_POSITIONS.first, B2: BASE_POSITIONS.second, B3: BASE_POSITIONS.third,
    home: BASE_POSITIONS.home, first: BASE_POSITIONS.first, second: BASE_POSITIONS.second, third: BASE_POSITIONS.third,
    P: [150, 196], C: [150, 282],
    "1B": [228, 162], "2B": [190, 142], SS: [110, 142], "3B": [72, 162],
    LF: [68, 98], CF: [150, 72], RF: [232, 98]
  };
  const POS_KO = { P: "투수", C: "포수", "1B": "1루수", "2B": "2루수", SS: "유격수", "3B": "3루수", LF: "좌익수", CF: "중견수", RF: "우익수" };
  const FIELDERS = ["P", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF"];
  const VIEWS = { full: "0 46 300 266", infield: "52 94 196 206" };
  const SVGNS = "http://www.w3.org/2000/svg";
  let uid = 0;

  function loc(l) {
    if (!l) return PTS.H;
    if (Array.isArray(l)) return l;
    if (typeof l === "string") return PTS[l] || PTS.H;
    if (l.between) {
      const a = loc(l.between[0]), b = loc(l.between[1]), t = l.t == null ? 0.5 : l.t;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    if (l.at) { const p = loc(l.at); return [p[0] + (l.dx || 0), p[1] + (l.dy || 0)]; }
    return PTS.H;
  }
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // 'H' / 'B1' / 'first' 같은 베이스 이름이면 표준 이름(home/first/...)으로, 아니면 null
  const baseKey = (l) => (typeof l === "string" ? (BASE_ALIAS[l] || (BASE_POSITIONS[l] ? l : null)) : null);
  // 주자가 a 베이스에서 b 베이스까지 앞으로 갈 때 밟는 베이스들 (a 제외, b 포함)
  function routeBetween(a, b) {
    const i = ROUTE.indexOf(a);
    const j = b === "home" ? 4 : ROUTE.indexOf(b);
    if (i < 0 || j <= i) return [b];
    return ROUTE.slice(i + 1, j + 1);
  }
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  class BaseballDiamond {
    constructor(container, opts = {}) {
      this.opts = Object.assign({ view: "full", fielders: true, labels: "code", baseLabels: true, caption: false, theme: "", onFielderClick: null }, opts);
      this.id = "bd" + (++uid);
      this.root = document.createElement("div");
      this.root.className = "bd" + (this.opts.theme ? " bd-" + this.opts.theme : "");
      container.appendChild(this.root);
      this.tokens = {};
      this.runId = 0;
      this.build();
      if (this.opts.caption) {
        this.caption = document.createElement("div");
        this.caption.className = "bd-caption";
        this.caption.setAttribute("aria-live", "polite");
        this.root.appendChild(this.caption);
      }
    }

    /* ---------- 그리기 ---------- */
    build() {
      const id = this.id;
      const svg = el("svg", { viewBox: VIEWS[this.opts.view] || VIEWS.full, class: "bd-svg", role: "img", "aria-label": "야구장 그림" });
      this.svg = svg;
      const defs = el("defs", {}, svg);
      const clip = el("clipPath", { id: id + "-fan" }, defs);
      const FAN = "M150,258 L9,117 A200,200 0 0 1 291,117 Z";
      el("path", { d: FAN }, clip);
      [["run", "bd-arrow-run"], ["throw", "bd-arrow-throw"]].forEach(([k, cls]) => {
        const m = el("marker", { id: `${id}-m-${k}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z", class: cls }, m);
      });

      el("rect", { x: -40, y: 0, width: 380, height: 320, class: "bd-foul" }, svg);
      el("path", { d: FAN, class: "bd-fair" }, svg);
      el("path", { d: "M9,117 A200,200 0 0 1 291,117", class: "bd-track" }, svg);
      const g = el("g", { "clip-path": `url(#${id}-fan)` }, svg);
      el("circle", { cx: 150, cy: 192, r: 82, class: "bd-dirt" }, g);
      el("polygon", { points: "150,244 202,192 150,140 98,192", class: "bd-ingrass" }, g);
      // 영역 강조 오버레이
      this.zoneOut = el("path", { d: FAN, class: "bd-zone bd-zone-out" }, g);
      this.zoneIn = el("circle", { cx: 150, cy: 192, r: 82, class: "bd-zone bd-zone-in" }, g);
      el("circle", { cx: 150, cy: 262, r: 20, class: "bd-dirt" }, svg);
      el("line", { x1: 150, y1: 258, x2: 9, y2: 117, class: "bd-foulline" }, svg);
      el("line", { x1: 150, y1: 258, x2: 291, y2: 117, class: "bd-foulline" }, svg);
      el("polygon", { points: ["home", "first", "second", "third"].map((k) => BASE_POSITIONS[k].join(",")).join(" "), class: "bd-basepath" }, svg);
      el("circle", { cx: 150, cy: 196, r: 9, class: "bd-mound" }, svg);
      el("rect", { x: 146, y: 195, width: 8, height: 2, class: "bd-rubber" }, svg);
      this.zoneLabels = el("g", { class: "bd-zone-labels" }, svg);
      el("text", { x: 150, y: 172, class: "bd-zone-label in" }, this.zoneLabels).textContent = "내야";
      el("text", { x: 150, y: 100, class: "bd-zone-label out" }, this.zoneLabels).textContent = "외야";

      // 베이스: 1·2·3루는 ◆, 홈은 오각형 ⬟ (모두 BASE_POSITIONS 기준)
      this.bases = {};
      ["first", "second", "third"].forEach((k, i) => {
        const [x, y] = BASE_POSITIONS[k];
        this.bases[i + 1] = el("rect", { x: x - 6.5, y: y - 6.5, width: 13, height: 13, rx: 1.5, transform: `rotate(45 ${x} ${y})`, class: "bd-base", "data-base": k }, svg);
      });
      const [hx, hy] = BASE_POSITIONS.home;
      this.bases[0] = el("polygon", { points: `${hx - 6},${hy - 4} ${hx + 6},${hy - 4} ${hx + 6},${hy + 1} ${hx},${hy + 6} ${hx - 6},${hy + 1}`, class: "bd-base bd-homeplate", "data-base": "home" }, svg);
      // 이름표는 주자·공보다 아래 층에 그려서 애니메이션을 가리지 않음
      if (this.opts.baseLabels) {
        const lg = el("g", { class: "bd-baselabels", "aria-hidden": "true" }, svg);
        Object.keys(BASE_POSITIONS).forEach((k) => {
          const [x, y] = BASE_POSITIONS[k], [dx, dy] = BASE_LABEL_POS[k];
          el("text", { x: x + dx, y: y + dy, class: "bd-baselabel" }, lg).textContent = BASE_NAME[k];
        });
      }

      this.arrowLayer = el("g", {}, svg);
      this.trailLayer = el("g", {}, svg);
      this.tokenLayer = el("g", {}, svg);
      this.bubbleLayer = el("g", {}, svg);

      this.fielders = {};
      if (this.opts.fielders) FIELDERS.forEach((code) => this.addFielder(code));

      this.ball = el("g", { class: "bd-ball hidden" }, svg);
      el("circle", { r: 4.5 }, this.ball);
      this.place(this.ball, PTS.P, false);

      this.root.appendChild(svg);
      this.setView(this.opts.view);
    }

    addFielder(code) {
      const g = el("g", { class: "bd-fielder", "data-pos": code, tabindex: this.opts.onFielderClick ? 0 : -1 }, this.tokenLayer);
      el("circle", { r: 15, class: "bd-ring" }, g);
      el("circle", { r: 10.5, class: "bd-body" }, g);
      const t = el("text", { y: 3.5, class: "bd-code" }, g);
      t.textContent = this.opts.labels === "none" ? "" : code;
      if (this.opts.labels === "ko") {
        el("text", { y: 22, class: "bd-name" }, g).textContent = POS_KO[code];
      }
      if (this.opts.onFielderClick) {
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", POS_KO[code]);
        const fire = () => this.opts.onFielderClick(code);
        g.addEventListener("click", fire);
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
      }
      this.place(g, PTS[code], false);
      this.fielders[code] = g;
      this.tokens[code] = g;
    }

    place(node, l, animate = true, ms) {
      const [x, y] = loc(l);
      if (!animate) {
        node.style.transition = "none";
        node.style.transform = `translate(${x}px, ${y}px)`;
        void node.getBoundingClientRect();
        node.style.transition = "";
      } else {
        if (ms != null) node.style.transitionDuration = ms + "ms";
        node.style.transform = `translate(${x}px, ${y}px)`;
      }
      node._pos = [x, y];
      node._base = baseKey(l);
    }

    // 주자를 베이스까지 이동: 두 베이스 이상 떨어져 있으면 중간 베이스를 순서대로 밟고 감
    moveRunner(node, target, ms) {
      const to = baseKey(target);
      const from = node._base;
      const legs = to && from && to !== from ? routeBetween(from, to) : null;
      if (!legs || legs.length < 2) { this.place(node, target, true, ms); return; }
      const run = this.runId, leg = ms / legs.length;
      legs.forEach((b, k) => setTimeout(() => { if (run === this.runId) this.place(node, b, true, leg); }, k * leg));
    }

    /* ---------- 정적 상태 ---------- */
    setView(v) {
      this.svg.setAttribute("viewBox", VIEWS[v] || VIEWS.full);
      // 내야만 보이는 화면에서는 가장자리에 잘려 보이는 외야수(LF·CF·RF)를 숨김
      this.svg.classList.toggle("view-infield", v === "infield");
    }

    setZone(z) {
      this.svg.classList.toggle("zone-in", z === "infield");
      this.svg.classList.toggle("zone-out", z === "outfield");
    }

    highlightPosition(code, { dimOthers = true } = {}) {
      FIELDERS.forEach((c) => {
        const f = this.fielders[c];
        if (!f) return;
        f.classList.toggle("hl", c === code);
        f.classList.toggle("dim", !!code && dimOthers && c !== code);
      });
    }

    highlightGroup(codes) {
      FIELDERS.forEach((c) => {
        const f = this.fielders[c];
        if (!f) return;
        f.classList.toggle("hl", !!codes && codes.includes(c));
        f.classList.toggle("dim", !!codes && !codes.includes(c));
      });
    }

    setBases({ on = [], hl = [] } = {}) {
      [0, 1, 2, 3].forEach((n) => {
        this.bases[n].classList.toggle("on", on.includes(n));
        this.bases[n].classList.toggle("hl", hl.includes(n));
      });
    }

    setArrows(list = []) {
      this.arrowLayer.innerHTML = "";
      list.forEach((a) => {
        const p1 = loc(a.from), p2 = loc(a.to);
        const kind = a.kind || "run";
        el("line", {
          x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1],
          class: "bd-arrow " + kind, "marker-end": `url(#${this.id}-m-${kind})`
        }, this.arrowLayer);
      });
    }

    clearRunners() {
      Object.keys(this.tokens).forEach((k) => {
        if (!FIELDERS.includes(k)) { this.tokens[k].remove(); delete this.tokens[k]; }
      });
    }

    addRunner(id, l, label) {
      const g = el("g", { class: "bd-runner" + (id === "bat" ? " batter" : "") }, this.tokenLayer);
      el("circle", { r: 9 }, g);
      el("text", { y: 3.5 }, g).textContent = label || (id === "bat" ? "타" : "주");
      this.place(g, l, false);
      this.tokens[id] = g;
      return g;
    }

    reset() {
      this.runId++;
      this.clearRunners();
      this.trailLayer.innerHTML = "";
      this.bubbleLayer.innerHTML = "";
      this.arrowLayer.innerHTML = "";
      this.ball.classList.add("hidden");
      FIELDERS.forEach((c) => {
        const f = this.fielders[c];
        if (f) { this.place(f, PTS[c], false); f.classList.remove("hl", "dim", "act"); }
      });
      this.setBases({});
      if (this.caption) this.caption.innerHTML = "";
    }

    /* ---------- 애니메이션 ---------- */
    bubble(l, text, kind = "") {
      const [x, y] = loc(l);
      // 같은 자리에 있던 말풍선은 지우고 새로 띄움
      Array.from(this.bubbleLayer.children).forEach((b) => {
        if (Math.hypot(b._x - x, b._y - y) < 26) b.remove();
      });
      const g = el("g", { class: "bd-bubble " + kind, transform: `translate(${x} ${y - 16})` }, this.bubbleLayer);
      g._x = x; g._y = y;
      const w = Math.max(30, text.length * 8 + 12);
      el("rect", { x: -w / 2, y: -10, width: w, height: 17, rx: 8 }, g);
      el("text", { y: 2.5 }, g).textContent = text;
      return g;
    }

    trail(p1, p2) {
      const line = el("line", { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], class: "bd-trail" }, this.trailLayer);
      setTimeout(() => line.classList.add("fade"), 900);
      setTimeout(() => line.remove(), 1800);
    }

    applyStep(step) {
      const speed = this._speed;
      const dur = (step.dur || 900) * speed;
      const ms = (step.ms != null ? step.ms : (step.dur || 900) * 0.85) * speed;
      if (step.text != null && this.caption) {
        this.caption.innerHTML = `<span class="bd-step">${this._i + 1}/${this._n}</span> ${step.text}`;
      }
      if (step.move) {
        Object.keys(step.move).forEach((id) => {
          const target = step.move[id];
          if (id === "ball") {
            const from = this.ball._pos;
            this.ball.classList.remove("hidden");
            if (step.throw !== false && from) this.trail(from, loc(target));
            this.place(this.ball, target, true, ms);
          } else if (this.fielders[id]) {
            this.place(this.fielders[id], target, true, ms);
            this.fielders[id].classList.add("act");
          } else if (this.tokens[id]) {
            this.moveRunner(this.tokens[id], target, ms);
          }
        });
      }
      (step.add || []).forEach((r) => this.addRunner(r.id, r.at, r.label));
      (step.hide || []).forEach((id) => {
        if (id === "ball") this.ball.classList.add("hidden");
        else if (this.tokens[id]) this.tokens[id].classList.add("gone");
      });
      (step.out || []).forEach((id) => {
        const t = this.tokens[id];
        if (t) { t.classList.add("out"); this.bubble(t._pos, "OUT", "out"); }
      });
      (step.safe || []).forEach((id) => {
        const t = this.tokens[id];
        if (t) { t.classList.add("safe"); this.bubble(t._pos, "SAFE", "safe"); }
      });
      if (step.score) {
        const n = typeof step.score === "number" ? step.score : 1;
        this.bubble("H", `+${n}점`, "score");
      }
      (step.bubble || []).forEach((b) => this.bubble(b.at, b.text, b.kind || ""));
      if (step.flash) step.flash.forEach((b) => {
        const n = { H: 0, B1: 1, B2: 2, B3: 3, home: 0, first: 1, second: 2, third: 3 }[b];
        const node = this.bases[n];
        if (!node) return;
        node.classList.remove("flash"); void node.getBoundingClientRect(); node.classList.add("flash");
      });
      if (step.bases) this.setBases(step.bases);
      if (step.arrows) this.setArrows(step.arrows);
      return dur;
    }

    // 시나리오의 시작 장면만 보여줌 (카드의 '간단한 야구장 그림'으로 사용)
    preview(scenario) {
      this.reset();
      const setup = scenario.setup || {};
      if (setup.view) this.setView(setup.view);
      Object.keys(setup.runners || {}).forEach((id) => this.addRunner(id, setup.runners[id]));
      Object.keys(setup.fielders || {}).forEach((c) => this.fielders[c] && this.place(this.fielders[c], setup.fielders[c], false));
      // 공은 투수 손(P)에서 시작하지만, 투수를 가리지 않도록 처음 움직일 때 나타남
      this.place(this.ball, setup.ball || "P", false);
      if (setup.ball) this.ball.classList.remove("hidden");
      if (setup.bases) this.setBases(setup.bases);
      if (setup.highlight) this.highlightGroup(setup.highlight);
      if (this.caption) this.caption.innerHTML = setup.text || "";
      this._n = scenario.steps.length;
    }

    async play(scenario, { onDone } = {}) {
      this.preview(scenario);
      const run = this.runId;
      this._speed = reduceMotion() ? 0.35 : 1;
      if (this.caption) this.caption.innerHTML = (scenario.setup && scenario.setup.text) || "준비!";
      await wait(700 * this._speed);
      for (let i = 0; i < scenario.steps.length; i++) {
        if (run !== this.runId) return;
        this._i = i;
        const d = this.applyStep(scenario.steps[i]);
        await wait(d + 250 * this._speed);
      }
      if (run === this.runId && onDone) onDone();
    }

    stop() { this.runId++; }
  }

  BaseballDiamond.PTS = PTS;
  BaseballDiamond.BASE_POSITIONS = BASE_POSITIONS;
  BaseballDiamond.ROUTE = ROUTE;
  BaseballDiamond.routeBetween = routeBetween;
  BaseballDiamond.POS_KO = POS_KO;
  BaseballDiamond.FIELDERS = FIELDERS;
  global.BaseballDiamond = BaseballDiamond;
})(window);
