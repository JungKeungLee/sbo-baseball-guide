/* =========================================================
   VR 야구 준비부터 마무리까지 — 화면 스크립트
   콘텐츠: vr-data.js
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- 상태 ---------------- */
  const KEY = "wony-baseball-vr-v1";
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.checks) return Object.assign({ tab: "warmup", seen: [], role: "batter" }, s);
    } catch (e) { /* 무시 */ }
    return { tab: "warmup", seen: [], checks: {}, role: "batter" };
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } };

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* =========================================================
     사람 실루엣 — 관절 각도(자세 값)만 바꿔 모든 동작을 그림
     ========================================================= */
  const SVGNS = "http://www.w3.org/2000/svg";
  const BASE_POSE = { lean: 0, head: 0, hdy: 0, sh: 0, tw: 0, la: [-15, 0], ra: [15, 0], ll: [-6, 0], rl: [6, 0], wr: null, heel: 0, seat: false, bat: -150 };
  const rad = (d) => (d * Math.PI) / 180;
  const vec = (a, len) => [Math.sin(rad(a)) * len, Math.cos(rad(a)) * len];   // 0 = 아래, 90 = 오른쪽
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function mix(a, b, t) {
    const o = {};
    Object.keys(a).forEach((k) => {
      const x = a[k], y = b[k];
      if (Array.isArray(x)) o[k] = x.map((v, i) => v + (y[i] - v) * t);
      else if (typeof x === "number" && typeof y === "number") o[k] = x + (y - x) * t;
      else o[k] = x != null ? x : y;
    });
    return o;
  }

  function Figure(host, fig, { size = "" } = {}) {
    const props = fig.props || {};
    const poses = fig.poses.map((p) => Object.assign({}, BASE_POSE, p));
    // 팔 돌리기처럼 한 바퀴 도는 동작은 마지막 → 처음으로 거꾸로 돌아가지 않게
    const first = poses[0], last = poses[poses.length - 1];
    const noWrap = Math.abs(last.la[0] - first.la[0]) >= 300 || (first.wr != null && Math.abs(last.wr - first.wr) >= 300);
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 120 142");
    svg.setAttribute("class", "fig-svg " + size);
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `
      <rect x="0" y="0" width="120" height="142" rx="16" class="fg-bg"/>
      ${props.wall === "left" ? '<rect x="4" y="16" width="7" height="122" rx="2" class="fg-wall"/>' : ""}
      ${props.wall === "right" ? '<rect x="109" y="16" width="7" height="122" rx="2" class="fg-wall"/>' : ""}
      ${props.chair ? '<path d="M38,100 H78 M42,100 V134 M74,100 V134 M38,100 V70" class="fg-chair"/>' : ""}
      <line x1="0" y1="135" x2="120" y2="135" class="fg-ground"/>
      <ellipse cx="60" cy="136" rx="20" ry="3" class="fg-shadow"/>
      <g class="fg-body">
        <polyline class="fg-limb leg l"/><polyline class="fg-limb leg r"/>
        <line class="fg-limb torso"/>
        <polyline class="fg-limb arm l"/><polyline class="fg-limb arm r"/>
        <line class="fg-bat"/>
        <line class="fg-hand l"/><line class="fg-hand r"/>
        <circle r="3" class="fg-ctrl l"/><circle r="3" class="fg-ctrl r"/>
        <g class="fg-headg"><circle r="9" class="fg-head"/><rect x="-8" y="-4" width="16" height="7" rx="3" class="fg-vr"/></g>
      </g>`;
    host.appendChild(svg);
    const q = (s) => svg.querySelector(s);
    const els = {
      ll: q(".leg.l"), rl: q(".leg.r"), torso: q(".torso"), la: q(".arm.l"), ra: q(".arm.r"),
      bat: q(".fg-bat"), hl: q(".fg-hand.l"), hr: q(".fg-hand.r"), cl: q(".fg-ctrl.l"), cr: q(".fg-ctrl.r"), head: q(".fg-headg")
    };
    const pts = (arr) => arr.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const line = (el, a, b) => { el.setAttribute("x1", a[0]); el.setAttribute("y1", a[1]); el.setAttribute("x2", b[0]); el.setAttribute("y2", b[1]); };

    function draw(P) {
      const legH = (l) => 24 * Math.cos(rad(l[0])) + 24 * Math.cos(rad(l[0] + l[1]));
      const hipY = P.seat ? 96 : 134 - Math.max(legH(P.ll), legH(P.rl)) - P.heel;
      const hip = [60, hipY];
      const legPts = (side, l) => { const hp = [60 + side * 6, hipY]; const k = add(hp, vec(l[0], 24)); return [hp, k, add(k, vec(l[0] + l[1], 24))]; };
      els.ll.setAttribute("points", pts(legPts(-1, P.ll)));
      els.rl.setAttribute("points", pts(legPts(1, P.rl)));
      const u = [Math.sin(rad(P.lean)), -Math.cos(rad(P.lean))];
      const neck = [hip[0] + u[0] * 34, hip[1] + u[1] * 34];
      line(els.torso, hip, neck);
      const sc = [neck[0] - u[0] * 3, neck[1] - u[1] * 3 + P.sh];
      const half = 11 * Math.cos(rad(P.tw)), pv = [Math.cos(rad(P.lean)) * half, Math.sin(rad(P.lean)) * half];
      const armPts = (S, a) => { const e = add(S, vec(a[0], 18)); return [S, e, add(e, vec(a[0] + a[1], 17))]; };
      const L = armPts([sc[0] - pv[0], sc[1] - pv[1]], P.la), R = armPts([sc[0] + pv[0], sc[1] + pv[1]], P.ra);
      els.la.setAttribute("points", pts(L));
      els.ra.setAttribute("points", pts(R));
      [[els.cl, L[2]], [els.cr, R[2]]].forEach(([c, p]) => { c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.style.display = props.controller ? "" : "none"; });
      [[els.hl, L], [els.hr, R]].forEach(([el, A]) => {
        if (P.wr == null) { el.style.display = "none"; return; }
        el.style.display = "";
        line(el, A[2], add(A[2], vec(P.wr + 180, 6)));
      });
      if (props.bat) { els.bat.style.display = ""; line(els.bat, R[2], add(R[2], vec(P.bat, 34))); } else els.bat.style.display = "none";
      // 머리는 몸통이 향하는 방향(+ 고개 기울기) 쪽으로
      const hv = vec(180 - P.head - P.lean, 12);
      const hc = [neck[0] + hv[0], neck[1] + hv[1] + P.hdy];
      els.head.setAttribute("transform", `translate(${hc[0].toFixed(1)} ${hc[1].toFixed(1)}) rotate(${(P.head + P.lean).toFixed(1)})`);
    }

    let raf = 0, t0 = 0, running = false;
    const n = poses.length, segs = noWrap ? n - 1 : n;
    function poseAt(phase) {
      const s = phase * segs, i = Math.min(Math.floor(s), segs - 1), t = ease(s - i);
      return mix(poses[i], poses[(i + 1) % n], t);
    }
    function tick(now) {
      if (!running) return;
      // 첫 프레임 시각이 시작 시각보다 살짝 이를 수 있어 음수가 되지 않게
      const phase = ((((now - t0) % fig.dur) + fig.dur) % fig.dur) / fig.dur;
      draw(poseAt(phase));
      raf = requestAnimationFrame(tick);
    }
    // 가장 특징적인 자세(두 번째 자세)를 정지 화면으로
    draw(poses.length > 1 ? poses[1] : poses[0]);
    return {
      svg,
      start() { if (running || reduce) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(tick); },
      stop() { running = false; cancelAnimationFrame(raf); }
    };
  }

  window.VRFigure = Figure; // 동작 그림 점검용

  // 화면에 보이는 실루엣만 움직이게 (배터리 · 성능)
  const figs = [];
  const io = "IntersectionObserver" in window ? new IntersectionObserver((ents) => ents.forEach((e) => {
    const f = figs.find((x) => x.svg === e.target);
    if (f) (e.isIntersecting ? f.start() : f.stop());
  })) : null;
  function liveFigure(host, fig, opts) {
    const f = Figure(host, fig, opts);
    figs.push(f);
    if (io) io.observe(f.svg); else f.start();
    return f;
  }

  /* ---------------- 공통 조각 ---------------- */
  // 운동 카드: 동작 이름 · 무엇을 풀어주는지 · 몇 회/초 · 그림 · 주의사항 (모두 같은 형식)
  function exerciseCard(id, { open = false } = {}) {
    const ex = vrExercises[id];
    const card = h(`<article class="ex-card${open ? " open" : ""}" id="ex-${id}">
      <button class="ex-head" aria-expanded="${open}">
        <span class="ex-name">${ex.name}</span>
        <span class="ex-meta"><span class="ex-part">${ex.part}</span><span class="ex-amt">${ex.amount}</span></span>
        <span class="ex-chev" aria-hidden="true">▾</span>
      </button>
      <div class="ex-body"${open ? "" : " hidden"}>
        <div class="ex-fig"></div>
        <dl class="ex-rows">
          <div><dt>풀어주는 곳</dt><dd>${ex.part}</dd></div>
          <div><dt>횟수 · 시간</dt><dd>${ex.amount}</dd></div>
          <div><dt>이렇게</dt><dd>${ex.how}</dd></div>
          <div class="warn"><dt>⚠️ 주의</dt><dd>${ex.caution}</dd></div>
        </dl>
      </div>
    </article>`);
    let built = false;
    const build = () => { if (!built) { built = true; liveFigure($(".ex-fig", card), ex.fig); } };
    if (open) build();
    card._open = () => { build(); $(".ex-body", card).hidden = false; card.classList.add("open"); $(".ex-head", card).setAttribute("aria-expanded", "true"); };
    $(".ex-head", card).addEventListener("click", () => {
      const body = $(".ex-body", card);
      if (body.hidden) card._open();
      else { body.hidden = true; card.classList.remove("open"); $(".ex-head", card).setAttribute("aria-expanded", "false"); }
    });
    return card;
  }

  // 체크리스트 (체크 상태 저장)
  function checklist(id, items, doneMsg) {
    const box = h(`<div class="vr-check"><ul></ul><p class="vc-status"></p></div>`);
    const ul = $("ul", box);
    const sel = () => (state.checks[id] = state.checks[id] || []);
    const draw = () => {
      const on = sel();
      ul.innerHTML = items.map((t, i) => `<li><button class="${on.includes(i) ? "on" : ""}" data-i="${i}" aria-pressed="${on.includes(i)}"><span class="vc-box">${on.includes(i) ? "✓" : ""}</span>${t}</button></li>`).join("");
      const n = on.length;
      $(".vc-status", box).innerHTML = n === items.length
        ? `🎉 <b>${doneMsg}</b> <button class="link-btn vc-reset">다시 체크</button>`
        : `<span class="tp-bar"><i style="width:${Math.round((n / items.length) * 100)}%"></i></span> ${n} / ${items.length}`;
      $$("li button", ul).forEach((b) => b.addEventListener("click", () => {
        const i = +b.dataset.i, arr = sel(), k = arr.indexOf(i);
        if (k >= 0) arr.splice(k, 1); else arr.push(i);
        save();
        draw();
        if (arr.length === items.length) toast("✅ " + doneMsg);
      }));
      const r = $(".vc-reset", box);
      if (r) r.addEventListener("click", () => { state.checks[id] = []; save(); draw(); });
    };
    draw();
    return box;
  }

  const infoCard = (cls, title, one, text) => h(`<article class="vr-card ${cls}">
    <p class="vr-title">${title}</p>
    ${one ? `<p class="vr-one">${one}</p>` : ""}
    ${text ? `<p class="vr-text">${text}</p>` : ""}
  </article>`);

  const mistakesHtml = (list, badLabel = "", goodLabel = "") => `<div class="vr-mk">${list.map((m, i) => `
    <div class="vr-mk-item"><span class="vr-mk-no">${i + 1}</span>
      <p class="bad"><span>❌</span>${badLabel}${m.bad}</p>
      <p class="good"><span>✅</span>${goodLabel}${m.good}</p>
    </div>`).join("")}</div>`;

  /* ---------------- 따라하기 모드 ---------------- */
  const follow = { list: [], i: 0, left: 0, timer: 0, paused: false, fig: null, title: "" };
  function openFollow(title, list) {
    Object.assign(follow, { list, i: 0, title });
    const ov = $("#follow");
    ov.hidden = false;
    document.body.classList.add("no-scroll");
    $(".fw-title", ov).textContent = title;
    showFollow();
    $(".fw-next", ov).focus({ preventScroll: true });
  }
  function closeFollow() {
    clearInterval(follow.timer);
    if (follow.fig) follow.fig.stop();
    $("#follow").hidden = true;
    document.body.classList.remove("no-scroll");
  }
  function showFollow() {
    const ov = $("#follow");
    const id = follow.list[follow.i], ex = vrExercises[id];
    const n = follow.list.length, last = follow.i === n - 1;
    $(".fw-count", ov).textContent = `${follow.i + 1} / ${n}`;
    $(".fw-bar i", ov).style.width = Math.round(((follow.i + 1) / n) * 100) + "%";
    $(".fw-name", ov).textContent = ex.name;
    $(".fw-meta", ov).innerHTML = `<span class="ex-part">${ex.part}</span><span class="ex-amt">${ex.amount}</span>`;
    $(".fw-how", ov).textContent = ex.how;
    $(".fw-warn", ov).textContent = "⚠️ " + ex.caution;
    const figHost = $(".fw-fig", ov);
    if (follow.fig) follow.fig.stop();
    figHost.innerHTML = "";
    follow.fig = Figure(figHost, ex.fig, { size: "big" });
    follow.fig.start();
    $(".fw-prev", ov).disabled = follow.i === 0;
    $(".fw-next", ov).textContent = last ? "완료 🎉" : "다음 운동 →";
    // 타이머 (자동으로 넘어가지는 않음 — 내 속도대로)
    clearInterval(follow.timer);
    follow.left = ex.sec;
    follow.paused = false;
    drawTimer(ex.sec);
    follow.timer = setInterval(() => {
      if (follow.paused) return;
      follow.left = Math.max(0, follow.left - 1);
      drawTimer(ex.sec);
      if (follow.left === 0) clearInterval(follow.timer);
    }, 1000);
  }
  function drawTimer(total) {
    const ov = $("#follow");
    const done = follow.left === 0;
    $(".fw-sec", ov).textContent = done ? "끝!" : follow.left + "초";
    $(".fw-ring circle.on", ov).style.strokeDashoffset = String(100 - ((total - follow.left) / total) * 100);
    $(".fw-pause", ov).textContent = done ? "↻ 한 번 더" : follow.paused ? "▶ 계속" : "⏸ 잠깐 멈춤";
    $(".fw-next", ov).classList.toggle("ready", done);
  }
  function initFollow() {
    const ov = $("#follow");
    $(".fw-close", ov).addEventListener("click", closeFollow);
    $(".fw-prev", ov).addEventListener("click", () => { if (follow.i > 0) { follow.i--; showFollow(); } });
    $(".fw-next", ov).addEventListener("click", () => {
      if (follow.i < follow.list.length - 1) { follow.i++; showFollow(); }
      else { closeFollow(); toast("🎉 " + follow.title + " 완료!"); }
    });
    $(".fw-pause", ov).addEventListener("click", () => {
      if (follow.left === 0) { showFollow(); return; }
      follow.paused = !follow.paused;
      drawTimer(vrExercises[follow.list[follow.i]].sec);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !ov.hidden) closeFollow(); });
  }
  const warmupList = () => vrWarmup.groups.flatMap((g) => g.items)
    .concat([vrWarmup.rehearsal.roles.find((r) => r.key === state.role).ex]);

  /* =========================================================
     탭
     ========================================================= */
  const TABS = [
    { key: "warmup", label: "시작 전 준비운동", icon: "🔥" },
    { key: "check", label: "착용 전 체크", icon: "✅" },
    { key: "during", label: "플레이 중", icon: "🎮" },
    { key: "stretch", label: "끝난 후 스트레칭", icon: "🧘" },
    { key: "mistakes", label: "자주 하는 실수", icon: "🙅" },
    { key: "stream", label: "방송 체크", icon: "📺" }
  ];

  const PANELS = {
    warmup(el) {
      const W = vrWarmup;
      el.appendChild(h(`<article class="vr-card lead">
        <p class="vr-title">${W.title}</p>
        <p class="vr-text">${W.intro}</p>
        <div class="vr-chips">${W.parts.map((p) => `<span>${p}</span>`).join("")}</div>
        <p class="vr-one">💬 ${W.one}</p>
        <button class="btn btn-primary vr-big fw-start">▶ 5분 준비운동 따라하기</button>
      </article>`));
      $(".fw-start", el).addEventListener("click", () => openFollow("5분 준비운동", warmupList()));
      let firstOpen = true;
      W.groups.forEach((g) => {
        const sec = h(`<section class="vr-group" id="g-${g.id}"><h3 class="vr-h">${g.title}</h3>${g.note ? `<p class="vr-note">${g.note}</p>` : ""}</section>`);
        g.items.forEach((id) => { sec.appendChild(exerciseCard(id, { open: firstOpen })); firstOpen = false; });
        el.appendChild(sec);
      });
      // 플레이 직전 (포지션별)
      const R = W.rehearsal;
      const reh = h(`<section class="vr-group" id="g-rehearsal">
        <h3 class="vr-h">${R.title}</h3><p class="vr-note">${R.note}</p>
        <div class="vr-roles" role="tablist">${R.roles.map((r) => `<button data-r="${r.key}">${r.icon} ${r.name}</button>`).join("")}</div>
        <div class="vr-reh"></div>
      </section>`);
      el.appendChild(reh);
      const showRole = (k) => {
        state.role = k; save();
        const r = R.roles.find((x) => x.key === k);
        $$(".vr-roles button", reh).forEach((b) => b.classList.toggle("active", b.dataset.r === k));
        const box = $(".vr-reh", reh);
        box.innerHTML = `<ul class="vr-list">${r.list.map((t) => `<li>${t}</li>`).join("")}</ul>`;
        box.appendChild(exerciseCard(r.ex, { open: true }));
      };
      $$(".vr-roles button", reh).forEach((b) => b.addEventListener("click", () => showRole(b.dataset.r)));
      showRole(state.role);
    },

    check(el) {
      const C = vrCheck;
      el.appendChild(h(`<article class="vr-card lead"><p class="vr-title">🥽 ${C.title}</p></article>`));
      $(".vr-card.lead", el).appendChild(checklist("pre", C.list, "준비 완료! 이제 헤드셋을 써도 좋아요"));
      // 플레이 공간 그림 (위에서 본 모습)
      el.appendChild(h(`<article class="vr-card">
        <p class="vr-title">📐 ${C.space.title}</p>
        <svg class="space-svg" viewBox="0 0 240 200" role="img" aria-label="플레이 공간: 가운데 사람이 팔을 뻗어도 닿지 않는 공간">
          <rect x="4" y="4" width="232" height="192" rx="14" class="sp-room"/>
          <rect x="10" y="10" width="54" height="26" rx="4" class="sp-obj"/><text x="37" y="27" class="sp-objt">책상</text>
          <rect x="190" y="150" width="40" height="40" rx="4" class="sp-obj"/><text x="210" y="174" class="sp-objt">의자</text>
          <circle cx="120" cy="100" r="74" class="sp-safe"/>
          <circle cx="120" cy="100" r="74" class="sp-ring"/>
          <g class="sp-sweep"><line x1="120" y1="100" x2="120" y2="30" class="sp-arm"/><circle cx="120" cy="30" r="5" class="sp-hand"/></g>
          <g class="sp-arrows">
            <path d="M120,84 V40" /><path d="M120,116 V160" /><path d="M104,100 H60" /><path d="M136,100 H180" />
          </g>
          <text x="120" y="22" class="sp-dir">앞</text><text x="120" y="186" class="sp-dir">뒤</text>
          <text x="38" y="104" class="sp-dir">왼쪽</text><text x="202" y="104" class="sp-dir">오른쪽</text>
          <circle cx="120" cy="100" r="13" class="sp-me"/><rect x="111" y="94" width="18" height="7" rx="3" class="sp-vr"/>
        </svg>
        <p class="vr-one">💬 ${C.space.one}</p>
        <p class="vr-text">${C.space.text}</p>
      </article>`));
      el.appendChild(infoCard("strong", "🔗 " + C.strap.title, "💬 " + C.strap.one, C.strap.text));
      const small = infoCard("", "🐢 " + C.small.title, "💬 " + C.small.one, C.small.text);
      small.appendChild(h(`<div class="meter"><div class="meter-bar"><i></i><span class="m-ok">50~60%</span></div><div class="meter-scale"><span>살살</span><span>처음엔 여기까지</span><span>전력</span></div></div>`));
      el.appendChild(small);
    },

    during(el) {
      const D = vrDuring;
      el.appendChild(h(`<article class="vr-card danger">
        <p class="vr-title">🤢 ${D.sick.title}</p>
        <p class="vr-text">${D.sick.text}</p>
        <div class="vr-chips red">${D.sick.symptoms.map((s) => `<span>${s}</span>`).join("")}</div>
        <p class="vr-one">💬 ${D.sick.one}</p>
      </article>`));
      el.appendChild(h(`<article class="vr-card">
        <p class="vr-title">👀 ${D.gaze.title}</p><p class="vr-text">${D.gaze.text}</p>
        <div class="gaze">${D.gaze.roles.map((r) => `<div><span>${r.icon}</span><b>${r.name}</b><p>${r.text}</p></div>`).join("")}</div>
      </article>`));
      const roleSec = h(`<section class="vr-group" id="g-roles"><div class="vr-roles" role="tablist">${D.roles.map((r) => `<button data-r="${r.key}">${r.icon} ${r.title.replace(" 이것만 기억", "").replace("라면", "")}</button>`).join("")}</div><div class="vr-rolebox"></div></section>`);
      el.appendChild(roleSec);
      const showRole = (k) => {
        state.role = k; save();
        const r = D.roles.find((x) => x.key === k);
        $$(".vr-roles button", roleSec).forEach((b) => b.classList.toggle("active", b.dataset.r === k));
        $(".vr-rolebox", roleSec).innerHTML = `<article class="vr-card"><p class="vr-title">${r.icon} ${r.title}</p>
          <ol class="vr-steps">${r.list.map(([t, d]) => `<li><b>${t}</b><p>${d}</p></li>`).join("")}</ol></article>`;
      };
      $$(".vr-roles button", roleSec).forEach((b) => b.addEventListener("click", () => showRole(b.dataset.r)));
      showRole(state.role);
      el.appendChild(h(`<article class="vr-card">
        <p class="vr-title">⏱️ ${D.rest.title}</p>
        <div class="vr-flow">${D.rest.flow.map((f) => `<span>${f}</span>`).join("<i>→</i>")}</div>
        <p class="vr-note">${D.rest.note}</p>
      </article>`));
      el.appendChild(infoCard("", "💧 " + D.water.title, "", D.water.text));
      el.appendChild(infoCard("", "🚶 " + D.cool.title, "💬 " + D.cool.one, D.cool.text));
    },

    stretch(el) {
      const S = vrStretch;
      el.appendChild(h(`<article class="vr-card lead">
        <p class="vr-title">${S.title}</p>
        <p class="vr-text">${S.intro}</p>
        <p class="vr-one">💬 ${S.one}</p>
        <button class="btn btn-primary vr-big fw-start">▶ 5분 스트레칭 따라하기</button>
      </article>`));
      $(".fw-start", el).addEventListener("click", () => openFollow("5분 스트레칭", S.items));
      const sec = h(`<section class="vr-group" id="g-stretch"></section>`);
      S.items.forEach((id, i) => sec.appendChild(exerciseCard(id, { open: i === 0 })));
      el.appendChild(sec);
      const rc = h(`<article class="vr-card"><p class="vr-title">🩺 ${S.recover.title}</p></article>`);
      rc.appendChild(checklist("recover", S.recover.list, "오늘도 무사히 끝!"));
      rc.appendChild(h(`<p class="vr-note warn">${S.recover.note}</p>`));
      el.appendChild(rc);
    },

    mistakes(el) {
      el.appendChild(h(`<section><h3 class="vr-h center">VR 야구 초보가 많이 하는 실수</h3>${mistakesHtml(vrMistakes)}</section>`));
    },

    stream(el) {
      const S = vrStream;
      const b = h(`<article class="vr-card lead"><p class="vr-title">🎬 ${S.before.title}</p></article>`);
      b.appendChild(checklist("stream", S.before.list, "방송 준비 완료!"));
      el.appendChild(b);
      el.appendChild(h(`<article class="vr-card small"><p class="vr-title">📡 ${S.during.title}</p>
        <ul class="vr-list">${S.during.list.map((t) => `<li>${t}</li>`).join("")}</ul></article>`));
      const a = h(`<article class="vr-card"><p class="vr-title">🏁 ${S.after.title}</p>
        <ol class="vr-steps num">${S.after.list.map((t) => `<li><b>${t}</b></li>`).join("")}</ol>
        <button class="btn btn-primary vr-big fw-start">▶ 끝난 후 스트레칭 따라하기</button></article>`);
      $(".fw-start", a).addEventListener("click", () => openFollow("5분 스트레칭", vrStretch.items));
      el.appendChild(a);
    }
  };

  function renderTabs() {
    $("#vrTabs").innerHTML = TABS.map((t, i) => `<button role="tab" data-t="${t.key}" class="${t.key === state.tab ? "active" : ""}${state.seen.includes(t.key) ? " seen" : ""}" aria-selected="${t.key === state.tab}">
      <span class="rg-no">${i + 1}</span>${t.icon} ${t.label}</button>`).join("");
    $$("#vrTabs button").forEach((b) => b.addEventListener("click", () => goTab(b.dataset.t, true)));
    const act = $("#vrTabs .active"), nav = $("#vrTabs");
    if (act) nav.scrollLeft = act.offsetLeft - nav.clientWidth / 2 + act.clientWidth / 2;
  }

  function goTab(key, scroll, anchor) {
    if (!PANELS[key]) key = "warmup";
    state.tab = key;
    if (!state.seen.includes(key)) state.seen.push(key);
    save();
    figs.splice(0).forEach((f) => { f.stop(); if (io) io.unobserve(f.svg); });
    const panel = $("#vrPanel");
    panel.innerHTML = "";
    PANELS[key](panel);
    const i = TABS.findIndex((t) => t.key === key);
    const pager = h(`<nav class="ch-pager">
      <button class="btn btn-ghost" ${i === 0 ? "disabled" : ""}>← 이전</button>
      <button class="btn btn-primary">${i < TABS.length - 1 ? `다음: ${TABS[i + 1].label} →` : "선수 가이드 보기 →"}</button>
    </nav>`);
    const [prev, next] = $$("button", pager);
    prev.addEventListener("click", () => goTab(TABS[i - 1].key, true));
    next.addEventListener("click", () => { if (i < TABS.length - 1) goTab(TABS[i + 1].key, true); else location.href = "player.html"; });
    panel.appendChild(pager);
    renderTabs();
    history.replaceState(null, "", "#" + key + (anchor ? "-" + anchor : ""));
    if (anchor) {
      const target = $("#g-" + anchor) || $("#ex-" + anchor);
      if (target) {
        const card = target.classList.contains("ex-card") ? target : $(".ex-card", target);
        if (card && card._open) card._open();
        setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        target.classList.add("flash");
      }
    } else if (scroll) $("#vrTabs").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- 시작 ---------------- */
  $("#vrNotice").textContent = vrIntro.notice;
  initFollow();
  // 주소로 바로 들어온 경우: vr.html#warmup-batter / #warmup-arms / #warmup-legs / #stretch …
  const m = location.hash.match(/^#(\w+)(?:-(\w+))?$/);
  if (m && PANELS[m[1]]) {
    if (m[2] && ["batter", "pitcher", "catcher"].includes(m[2])) { state.role = m[2]; goTab(m[1], true, "rehearsal"); }
    else goTab(m[1], true, m[2]);
  } else goTab(state.tab, false);
})();
