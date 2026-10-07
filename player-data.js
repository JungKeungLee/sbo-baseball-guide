/* =========================================================
   내가 오늘 선수라면? — 콘텐츠 데이터 (타자 / 투수 / 포수)
   구성: 기본 역할 → 꼭 알아둘 것 → 자주 하는 실수 → 실제 상황 → 미니 퀴즈 → 요약
   (diamond.js, guide-data.js 다음에 불러와야 합니다 — btw/off 헬퍼와 기존 시나리오를 같이 씀)

   links: 기존 설명으로 이동하는 버튼 [버튼 문구, 대상]
     대상이 "main:lesson-out" 처럼 main: 으로 시작하면 처음 보는 야구(basics.html)의 해당 단계,
     그 외에는 포지션(positions.html) / 룰(rules.html) 페이지의 카드 id (GuideUI.cardHref 가 알아서 찾음)
   ========================================================= */

/* ---------- 난이도 ---------- */
const playerLevels = {
  must: { label: "꼭 알아두기", icon: "📌" },
  good: { label: "알아두면 좋음", icon: "👍" },
  tip: { label: "실전 팁", icon: "💡" }
};

/* ---------- 선수용 추가 애니메이션 (기존 guideScenarios 도 key 로 그대로 사용 가능) ---------- */
const playerScenarios = {
  pitcherField: {
    setup: { runners: { bat: "H" }, text: "주자 없음. 투수가 던집니다" },
    steps: [
      { text: "투구!", move: { ball: off("H", 0, -4) }, dur: 500 },
      { text: "타자가 <b>투수 앞 땅볼</b>을 쳤어요", move: { ball: [150, 214], P: [150, 210], bat: btw("H", "B1", 0.3) }, dur: 800 },
      { text: "투수가 직접 잡아서 1루로 송구!", move: { ball: off("B1", 7, -5), "1B": off("B1", 7, -5), bat: btw("H", "B1", 0.85) }, dur: 800 },
      { text: "<b>아웃!</b> 투수도 수비수예요", out: ["bat"], dur: 1200 }
    ]
  },
  pitcherCover: {
    setup: { runners: { bat: "H" }, text: "주자 없음. 1루수 쪽으로 땅볼이 갑니다" },
    steps: [
      { text: "1루수 쪽 땅볼! 1루수가 공을 잡으러 나감 → <b>1루가 비었어요</b>", move: { ball: [212, 178], "1B": [212, 178], bat: btw("H", "B1", 0.3), P: [190, 196] }, dur: 900 },
      { text: "그래서 <b>투수가 1루로 달려가 커버!</b>", move: { P: off("B1", -2, 9), bat: btw("H", "B1", 0.65) }, dur: 800 },
      { text: "1루수 → 투수에게 토스", move: { ball: off("B1", -2, 9), bat: btw("H", "B1", 0.88) }, dur: 600 },
      { text: "투수가 베이스를 밟아 <b>아웃!</b>", out: ["bat"], flash: ["B1"], dur: 1200 }
    ]
  },
  catcherBlock: {
    setup: { runners: { r1: "B1" }, text: "1루에 주자" },
    steps: [
      { text: "주자 리드, 투구가 <b>홈 앞에서 크게 튐!</b>", move: { r1: btw("B1", "B2", 0.15), ball: [150, 262] }, dur: 700 },
      { text: "포수가 무릎을 꿇고 <b>몸으로 막음</b> → 공이 앞에 떨어짐", move: { C: [150, 268], ball: [150, 272] }, throw: false, bubble: [{ at: [150, 272], text: "블록!", kind: "safe" }], dur: 1100 },
      { text: "공이 뒤로 안 빠졌으니 주자는 <b>못 가고 돌아감</b> 👍", move: { r1: "B1" }, dur: 1200 }
    ]
  },
  catcherMiss: {
    setup: { runners: { r1: "B1" }, text: "1루에 주자" },
    steps: [
      { text: "주자 리드, 투구가 홈 앞에서 크게 튐!", move: { r1: btw("B1", "B2", 0.15), ball: [150, 262] }, dur: 700 },
      { text: "글러브만 뻗다가 <b>공이 뒤로 빠짐</b>", move: { ball: [200, 294] }, throw: false, bubble: [{ at: "C", text: "놓침!", kind: "warn" }], dur: 900 },
      { text: "그 사이 주자는 <b>2루로 진루</b> (폭투 또는 포일)", move: { r1: "B2", C: [196, 290] }, dur: 1200 },
      { text: "공이 뒤로 빠지면 주자에게 공짜 베이스가 생겨요", safe: ["r1"], dur: 1100 }
    ]
  },
  homeTag: {
    setup: { runners: { r3: "B3", bat: "H" }, text: "1아웃, 3루에 주자" },
    steps: [
      { text: "외야 뜬공! 3루 주자는 베이스를 밟고 대기", move: { ball: off("LF", 0, -2), bat: btw("H", "B1", 0.5) }, dur: 1200 },
      { text: "좌익수가 잡음 → 타자 아웃. 3루 주자 태그업 출발!", out: ["bat"], move: { r3: btw("B3", "H", 0.35) }, dur: 800 },
      { text: "강한 홈 송구! 포수는 <b>공과 주자를 같이 보면서</b> 홈 앞에서 대기", move: { ball: off("H", -10, 2), C: off("H", -10, 2), r3: btw("B3", "H", 0.78) }, dur: 1000 },
      { text: "공을 먼저 받아 주자를 <b>태그</b>", move: { C: btw("B3", "H", 0.84), ball: btw("B3", "H", 0.84) }, throw: false, dur: 500 },
      { text: "홈에서 <b>아웃!</b> (포스 상황이 아니라서 태그해야 해요)", out: ["r3"], dur: 1300 }
    ]
  },
  catcherFoulFly: {
    setup: { runners: { bat: "H" }, text: "투수가 던집니다" },
    steps: [
      { text: "투구!", move: { ball: off("H", 0, -4) }, dur: 500 },
      { text: "타자가 친 공이 포수 뒤쪽으로 <b>높이 뜸</b> (파울 지역)", move: { ball: [112, 290] }, dur: 1100 },
      { text: "포수가 마스크를 벗고 쫓아감", move: { C: [114, 290] }, dur: 900 },
      { text: "땅에 떨어지기 전에 잡았다 → <b>타자 아웃!</b>", out: ["bat"], dur: 1200 }
    ]
  }
};

/* ---------- 공통 카드: 폭투 vs 포일 (투수·포수 둘 다 보여줌) ---------- */
const tipWildPitch = {
  id: "wppb", level: "good", title: "폭투 vs 포일, 누구 책임이에요?",
  short: "공이 뒤로 빠져 주자가 진루했을 때, <b>누구 실수냐</b>에 따라 이름이 달라요.",
  compare: {
    cols: [
      { title: "⚾ 폭투 WP", tone: "sky", lines: ["투수가 포수가 처리하기 <b>어려운 공</b>을 던짐", "<b>투수가 너무 어렵게 던진 경우</b>"] },
      { title: "🧤 포일 PB", tone: "green", lines: ["포수가 잡을 만한 공을 <b>제대로 처리 못 함</b>", "<b>포수가 잡을 만한 공을 놓친 경우</b>"] }
    ],
    note: "두 경우 모두 공이 빠진 사이 <b>주자가 진루할 수 있어요.</b> 어느 쪽인지는 기록원이 판단해요."
  },
  scenarios: [{ label: "공이 뒤로 빠지면", key: "catcherMiss" }],
  links: [["폭투·포일 기록 보기", "notSteal"]]
};

/* ---------- 역할별 가이드 ---------- */
const playerRoles = [
  {
    key: "batter", name: "타자", icon: "🏏", sub: "BATTER", color: "batter",
    extraTabs: ["swing"], // 타자만 있는 탭: 스윙 비교 (batterSwing)
    title: "내가 오늘 타자라면?",
    intro: ["타자의 목표는 단순히 홈런을 치는 게 아니에요.", "공을 <b>잘 골라내고</b>,", "공을 쳤다면 <b>빠르게 뛰고</b>,", "주자가 있다면 <b>상황에 맞는 플레이</b>를 하는 것도 중요해요."],
    one: "공을 잘 고르고, 치면 바로 뛰자!",
    remember: "공을 쳤다면 구경하지 말고 <b>바로 1루로!</b>",
    basics: [
      { icon: "👀", title: "공 고르기", text: "치기 좋은 공은 치고, 나쁜 공은 보내기" },
      { icon: "🏃", title: "치면 달리기", text: "공을 맞혔으면 무조건 1루로 전력질주" },
      { icon: "🧠", title: "상황 보기", text: "아웃카운트와 주자를 알고 타석에 들어가기" }
    ],
    tips: [
      {
        id: "b-pick", level: "must", title: "모든 공을 칠 필요는 없어요",
        short: "<b>나쁜 공까지 억지로 치려고 하지 말기</b>",
        detail: "스트라이크존 밖으로 들어온 공은 그냥 보내도 돼요. 볼이 4개 모이면 <b>볼넷</b>으로 1루에 걸어갈 수 있어요. 단, 방망이를 휘둘렀다가 못 맞히면 존 밖의 공이어도 <b>스트라이크</b>예요.",
        links: [["스트라이크와 볼 다시 보기", "main:lesson-count"]]
      },
      {
        id: "b-2s", level: "must", title: "2스트라이크 이후엔 조심",
        short: "스트라이크 하나만 더 들어오면 <b>삼진</b>! 존 근처 공에 더 집중해요.",
        visual: { type: "count", b: 1, s: 2 },
        detail: "2스트라이크에서 존 근처 공을 그냥 보냈다가 스트라이크 판정이 나면 그대로 삼진이에요. 대신 <b>일반 파울</b>은 2스트라이크 이후에도 삼진이 아니라 그대로 2스트라이크! (단, <b>번트 파울</b>은 2스트라이크에서 삼진이에요.)",
        links: [["파울과 스트라이크", "foul"], ["번트 파울", "buntFoul"]]
      },
      {
        id: "b-run", level: "must", title: "공을 치면 바로 1루로 뛰기",
        short: "<b>공을 쳤으면 일단 뛰자!</b> 타구를 오래 구경하지 않기",
        detail: "특히 땅볼은 빨리 뛰면 수비가 서두르다 실수하거나 <b>내야안타</b>가 될 수 있어요. 방망이는 던지지 말고 내려놓고 뛰어요 — 포수와 심판이 다칠 수 있어요.",
        scenarios: [{ label: "땅볼 → 1루 승부", key: "force1" }],
        links: [["포스아웃 (1루 아웃)", "forceout"], ["내야안타", "hitTypes"]]
      },
      {
        id: "b-through", level: "must", title: "1루까지 끝까지 달리기",
        short: "거의 다 왔다고 속도를 줄이지 말고 <b>베이스를 밟을 때까지 전력으로!</b>",
        detail: "타자는 1루를 <b>지나쳐도</b> 곧바로 돌아오면 일반적으로 아웃이 아니에요. 그러니 멈추려고 미리 감속할 필요가 없어요. 단, 지나친 뒤 2루로 가려는 행동을 하면 태그아웃될 수 있어요.",
        scenarios: [{ label: "1루 지나치기", key: "overrun" }],
        links: [["1루 오버런 규칙", "overrun"]]
      },
      {
        id: "b-call", level: "must", title: "심판 판정 전에 멈추지 않기",
        short: "<b>내 판단보다 심판 콜을 먼저 확인!</b>",
        detail: "파울인 줄 알고 멈췄는데 페어일 수 있고, 아웃인 줄 알았는데 수비가 공을 놓칠 수도 있어요. 플레이는 심판이 '파울!', '아웃!', '타임!'을 부를 때까지 계속돼요."
      },
      {
        id: "b-check", level: "good", title: "타석 들어가기 전에 상황 확인",
        short: "<b>아웃카운트</b>와 <b>주자 위치</b>를 보고 들어가요.",
        detail: "주자가 1루에 있고 0·1아웃이면 땅볼에 <b>병살</b>이 나올 수 있고, 3루에 주자가 있으면 외야 뜬공만 쳐도 <b>희생플라이</b>로 1점이 날 수 있어요. 상황을 알면 무엇을 노릴지가 보여요.",
        links: [["주자 상황 보기", "picker"], ["병살", "dp"], ["희생플라이", "sacFly"]]
      },
      {
        id: "b-notout", level: "good", title: "삼진이어도 포수가 공을 놓치면?",
        short: "조건이 맞으면 <b>낫아웃</b>! 1루로 달려요.",
        detail: "세 번째 스트라이크를 포수가 제대로 못 잡았을 때, <b>1루가 비어 있거나 2아웃</b>이면 1루로 뛸 수 있어요. 심판 콜을 보고 바로 뛰기!",
        scenarios: [{ label: "낫아웃으로 출루", key: "notOut" }],
        links: [["낫아웃 조건 자세히", "notOut"]]
      },
      {
        id: "b-2out", level: "tip", title: "주자가 되면: 2아웃이면 치는 순간 출발",
        short: "1루에 나간 뒤 <b>2아웃</b>이면 타자가 공을 치는 순간 바로 뛰어요.",
        detail: "2아웃에서 뜬공이 잡히면 어차피 이닝이 끝나서 돌아갈 필요가 없어요. 0·1아웃일 땐 뜬공이 잡히면 원래 베이스로 돌아가야 하니 조심!",
        links: [["태그업 / 귀루", "tagup"]]
      }
    ],
    mistakes: [
      { bad: "공을 치고 타구를 구경한다", good: "바로 1루로 달린다" },
      { bad: "모든 공을 무조건 휘두른다", good: "스트라이크인지 볼인지 확인하면서 친다" },
      { bad: "1루 도착 전에 속도를 줄인다", good: "베이스를 지나갈 때까지 끝까지 달린다" },
      { bad: "파울이라고 생각해서 혼자 멈춘다", good: "심판 판정을 확인한다" },
      { bad: "아웃카운트나 주자 상황을 전혀 안 본다", good: "타석에 들어가기 전에 아웃카운트와 주자를 확인한다" }
    ],
    situations: [
      {
        title: "3볼 0스트라이크", count: { b: 3, s: 0 },
        text: "투수가 스트라이크존에서 <b>많이 벗어난 공</b>을 던졌어요.",
        question: "무조건 쳐야 할까요?",
        options: ["무조건 휘두른다", "치지 않고 보낸다"], answer: 1,
        explain: "아니요! 그 공이 볼이 되면 <b>볼넷</b>으로 1루에 갈 수 있어요. 굳이 나쁜 공을 칠 필요가 없어요."
      },
      {
        title: "땅볼을 쳤다!",
        text: "타자가 내야 <b>땅볼</b>을 쳤어요.",
        question: "무엇을 해야 하나요?",
        options: ["타구가 어디로 가는지 지켜본다", "바로 1루로 전력질주", "파울인지 확인될 때까지 서 있는다"], answer: 1,
        explain: "<b>바로 1루로 전력질주!</b> 수비가 실수하거나 내야안타가 될 수도 있어요.",
        scenario: "overrun"
      },
      {
        title: "2스트라이크", count: { b: 1, s: 2 },
        text: "다음 공이 <b>스트라이크존 근처</b>로 들어와요.",
        question: "어떻게 할까요?",
        options: ["적극적으로 대응한다 (친다)", "일단 보내고 다음 공을 기다린다"], answer: 0,
        explain: "그냥 보냈다가 스트라이크면 <b>삼진</b>! 존 근처라면 적극적으로 대응해요. 파울이 나면 그대로 2스트라이크라 다시 기회가 있어요."
      },
      {
        title: "2아웃, 헛스윙 삼진…인데?", runners: [],
        text: "세 번째 스트라이크를 포수가 <b>놓쳐서</b> 공이 옆으로 굴러갔어요.",
        question: "타자는 어떻게 할까요?",
        options: ["삼진이니까 덕아웃으로 들어간다", "1루로 달린다"], answer: 1,
        explain: "2아웃이면 <b>낫아웃</b> 조건! 1루에 먼저 도착하면 살 수 있어요.",
        scenario: "notOut"
      }
    ],
    summary: ["좋은 공을 골라 친다", "치면 바로 뛴다", "1루까지 끝까지 달린다", "심판 판정 전에 멈추지 않는다", "아웃카운트와 주자를 확인한다"]
  },
  {
    key: "pitcher", name: "투수", icon: "⚾", sub: "PITCHER", color: "pitcher",
    title: "내가 오늘 투수라면?",
    intro: ["투수의 목표는 단순히 가장 빠른 공을 던지는 게 아니에요.", "초보자에게 가장 중요한 건", "<b>스트라이크를 안정적으로 던지는 것!</b>"],
    one: "빠른 공보다 먼저 스트라이크",
    remember: "<b>빠른 공보다 스트라이크부터!</b>",
    basics: [
      { icon: "🎯", title: "스트라이크 넣기", text: "세게보다 정확하게" },
      { icon: "🔢", title: "상황 알기", text: "볼카운트 · 아웃카운트 · 주자" },
      { icon: "🧤", title: "던진 뒤엔 수비수", text: "땅볼 처리 · 1루 커버 · 백업" }
    ],
    tips: [
      {
        id: "p-strike", level: "must", title: "스트라이크를 먼저 던지기",
        short: "<b>세게보다 정확하게!</b> 초보 단계에서는 구속보다 제구가 먼저예요.",
        detail: "처음부터 너무 세게 던지다가 볼만 계속 나오면 타자를 볼넷으로 내보내게 돼요. 볼넷은 안타를 맞은 것처럼 주자를 1루에 보내요."
      },
      {
        id: "p-count", level: "must", title: "볼카운트 확인",
        short: "지금 <b>몇 볼, 몇 스트라이크</b>인지 항상 알고 던지기",
        visual: { type: "count", b: 3, s: 0 },
        detail: "예를 들어 <b>3볼 0스트라이크</b>라면 볼 하나만 더 나오면 볼넷이에요. 반대로 2스트라이크라면 하나만 더 넣으면 삼진!",
        links: [["볼카운트 다시 보기", "main:lesson-count"]]
      },
      {
        id: "p-outs", level: "must", title: "매 타자 전에 상황 확인",
        short: "<b>아웃카운트와 주자</b>를 보고 던져요.",
        detail: "2아웃이면 아웃 하나로 이닝이 끝나고, 주자가 있으면 견제나 베이스 커버도 생각해야 해요.",
        links: [["주자 상황 보기", "picker"], ["아웃 다시 보기", "main:lesson-out"]]
      },
      {
        id: "p-runner", level: "good", title: "주자가 있으면 주자도 보기",
        short: "타자만 보지 말고 주자가 <b>베이스에서 얼마나 떨어져 있는지</b> 확인!",
        detail: "주자가 너무 멀리 떨어져 있으면 <b>견제</b>로 잡을 수 있어요. 견제를 안 해도 주자를 한 번 쳐다보는 것만으로 도루를 막는 효과가 있어요.",
        scenarios: [{ label: "견제사", key: "pickOut" }, { label: "주자 귀루 세이프", key: "pickSafe" }],
        links: [["견제 규칙 자세히 보기", "pickoff"], ["도루 규칙", "steal"]]
      },
      {
        id: "p-catcher", level: "good", title: "포수와 호흡 맞추기",
        short: "<b>투수와 포수는 한 팀처럼 같이 움직여요.</b>",
        detail: "포수가 보내는 사인이나 미트를 대는 위치를 보고 던져요. 서로 생각이 다르면 사인을 다시 맞추면 돼요."
      },
      {
        id: "p-field", level: "must", title: "공을 던진 뒤에도 수비수",
        short: "<b>투구 후에도 플레이에 참여해요!</b>",
        detail: "자기 앞으로 오는 땅볼 처리, 1루수가 공을 잡으러 나가면 <b>1루 베이스 커버</b>, 홈이나 3루 송구 때 뒤에서 백업하기 등 할 일이 많아요.",
        scenarios: [{ label: "투수 앞 땅볼", key: "pitcherField" }, { label: "1루 커버", key: "pitcherCover" }],
        links: [["포스아웃", "forceout"]]
      },
      {
        id: "p-balk", level: "good", title: "주자가 있을 땐 동작 주의 (보크)",
        short: "투구를 시작하는 것처럼 움직였다가 <b>부자연스럽게 멈추거나</b>, 규칙에 어긋나는 견제 동작을 하면 <b>보크</b>가 선언될 수 있어요.",
        detail: "보크가 선언되면 주자가 한 베이스씩 진루할 수 있어요. 세부 규정은 복잡하니 '투구 동작을 시작했으면 그대로 던진다' 정도만 기억해도 충분해요.",
        links: [["보크 설명 보기", "balk"]]
      },
      tipWildPitch,
      {
        id: "p-relax", level: "tip", title: "볼이 계속 나오면 잠깐 숨 고르기",
        short: "같은 힘으로 계속 던지지 말고 <b>힘을 조금 빼서라도</b> 스트라이크를 잡아요.",
        detail: "포수 미트만 보고 천천히 한 번 던져보는 것만으로도 다시 스트라이크가 들어가는 경우가 많아요."
      }
    ],
    mistakes: [
      { bad: "무조건 빠르게 던지려고 한다", good: "먼저 스트라이크를 안정적으로 던진다" },
      { bad: "볼이 계속 나오는데 같은 힘으로 계속 던진다", good: "힘을 조금 줄여서라도 스트라이크를 잡는다" },
      { bad: "주자가 있어도 타자만 본다", good: "주자가 얼마나 베이스에서 떨어져 있는지 확인한다" },
      { bad: "공을 던진 뒤 가만히 서 있는다", good: "타구가 나오면 수비에 참여한다" },
      { bad: "아웃카운트와 주자 상황을 모른다", good: "매 타자 전에 현재 상황을 확인한다" }
    ],
    situations: [
      {
        title: "1루 주자가 멀리 나왔다", runners: [1],
        text: "1루 주자가 베이스에서 <b>많이 떨어져</b> 있어요.",
        question: "어떻게 할 수 있나요?",
        options: ["1루로 견제를 시도한다", "주자는 신경 안 쓰고 타자에게만 던진다", "투구 동작을 하다가 멈춰서 속인다"], answer: 0,
        explain: "<b>1루 견제</b>를 시도할 수 있어요. 투구 동작을 하다 멈추는 건 <b>보크</b>가 될 수 있어요!",
        scenario: "pickOut"
      },
      {
        title: "볼이 계속 들어가서 3볼", count: { b: 3, s: 0 },
        text: "볼만 계속 나와서 현재 <b>3볼</b>이에요.",
        question: "무엇이 가장 중요할까요?",
        options: ["더 세게, 가장 빠른 공을 던진다", "스트라이크를 넣는 데 집중한다"], answer: 1,
        explain: "빠른 공보다 <b>스트라이크</b>가 먼저! 볼 하나면 볼넷이에요."
      },
      {
        title: "투수 앞 땅볼!",
        text: "타자가 <b>투수 앞으로</b> 땅볼을 쳤어요.",
        question: "투수는 어떻게 해야 하나요?",
        options: ["공을 잡아 1루로 던져 아웃을 노린다", "다른 수비수가 잡도록 피한다", "마운드에 그대로 서 있는다"], answer: 0,
        explain: "투수도 <b>수비수</b>예요! 직접 잡아서 아웃 플레이를 해요.",
        scenario: "pitcherField"
      },
      {
        title: "1루수 쪽 땅볼, 1루가 비었다",
        text: "1루수가 공을 잡으러 앞으로 나가서 <b>1루 베이스가 비었어요.</b>",
        question: "투수는?",
        options: ["1루로 달려가 베이스 커버", "마운드에서 지켜본다"], answer: 0,
        explain: "<b>1루 커버!</b> 1루수가 던져주는 공을 받아 베이스를 밟으면 아웃이에요.",
        scenario: "pitcherCover"
      }
    ],
    summary: ["먼저 스트라이크를 던진다", "볼카운트를 확인한다", "주자가 있으면 견제를 생각한다", "포수와 호흡을 맞춘다", "투구 후에도 수비한다"]
  },
  {
    key: "catcher", name: "포수", icon: "🧤", sub: "CATCHER", color: "catcher",
    title: "내가 오늘 포수라면?",
    intro: ["포수는 단순히 투수 공을 받는 사람이 아니에요.", "투수와 가장 가까이 <b>호흡</b>하고,", "<b>주자</b>를 확인하고,", "<b>수비 상황 전체</b>를 앞에서 볼 수 있는 중요한 포지션이에요."],
    one: "공을 받으면서 경기 전체를 보는 선수",
    remember: "<b>공만 보지 말고 주자도 확인!</b>",
    basics: [
      { icon: "🧤", title: "공 받기", text: "확실하게 받고, 못 잡겠으면 몸으로 막기" },
      { icon: "👀", title: "주자 보기", text: "도루·홈 진입하는 주자 확인" },
      { icon: "📣", title: "상황 알리기", text: "아웃카운트를 알고 수비를 이끌기" }
    ],
    tips: [
      {
        id: "c-catch", level: "must", title: "공을 확실하게 받기",
        short: "가장 기본! 공이 <b>뒤로 빠지면 주자가 진루</b>할 수 있어요.",
        detail: "주자가 있을 때 공이 뒤로 빠지면 폭투·포일로 주자가 공짜로 한 베이스 더 갈 수 있어요."
      },
      {
        id: "c-block", level: "must", title: "낮은 공은 몸으로 막기",
        short: "<b>못 잡겠으면 뒤로 안 빠지게 막는 것도 중요!</b>",
        detail: "낮거나 크게 튀는 공을 글러브만으로 잡으려 하지 말고, 몸 앞으로 막아서 공이 앞에 떨어지게 하는 것만으로도 충분해요.",
        scenarios: [{ label: "몸으로 막기", key: "catcherBlock" }, { label: "뒤로 빠지면", key: "catcherMiss" }]
      },
      {
        id: "c-runner", level: "must", title: "주자를 확인하기",
        short: "공만 보면 <b>도루하는 주자</b>를 놓쳐요. 공을 받은 뒤 주자도 봐요.",
        links: [["주자 상황 보기", "picker"], ["리드", "lead"]]
      },
      {
        id: "c-steal", level: "good", title: "도루 저지",
        short: "1루 주자 → 투구 → 2루 도루 시도 → 포수가 공을 받음 → <b>2루로 송구</b> → 야수가 주자 태그",
        detail: "급하게 던지려다 공을 놓치면 아무것도 못 해요. <b>먼저 확실히 받고, 그다음 빠르게</b> 던지는 게 순서예요.",
        scenarios: [{ label: "도루 저지 성공", key: "stealFail" }, { label: "도루 허용", key: "stealOk" }],
        links: [["도루 규칙 자세히 보기", "steal"], ["태그아웃", "tagout"]]
      },
      {
        id: "c-outs", level: "must", title: "아웃카운트 확인",
        short: "포수는 항상 <b>지금 몇 아웃인지</b> 알고 있어야 해요.",
        detail: "예를 들어 <b>2아웃</b>이라면 다음 아웃 하나로 공격이 끝나니까, 가장 쉬운 아웃(보통 1루)을 잡으면 돼요. 포수는 수비 전체를 마주 보고 있어서 손가락으로 아웃카운트를 알려주기도 해요.",
        links: [["아웃 다시 보기", "main:lesson-out"]]
      },
      {
        id: "c-home", level: "good", title: "홈으로 들어오는 주자 확인",
        short: "3루에 주자가 있으면 <b>홈에서 태그 플레이</b>가 생길 수 있어요.",
        detail: "외야 뜬공 뒤 태그업, 안타 등으로 3루 주자가 홈으로 뛰어오면 포수가 공을 받아 주자를 태그해요. 만루처럼 <b>포스 상황</b>이면 공을 들고 홈플레이트만 밟아도 아웃이에요.",
        scenarios: [{ label: "홈 태그아웃", key: "homeTag" }, { label: "득점 허용", key: "tagupOk" }],
        links: [["태그업", "tagup"], ["포스아웃 vs 태그아웃", "forceVsTag"]]
      },
      {
        id: "c-foul", level: "good", title: "포수 근처 파울 뜬공",
        short: "포수 뒤나 옆으로 뜬 파울도 <b>땅에 떨어지기 전에 잡으면 아웃!</b>",
        scenarios: [{ label: "파울 뜬공 잡기", key: "catcherFoulFly" }],
        links: [["파울 플라이 아웃 규칙", "foulFly"]]
      },
      tipWildPitch,
      {
        id: "c-notout", level: "tip", title: "세 번째 스트라이크를 놓쳤다면?",
        short: "<b>1루가 비었거나 2아웃</b>이면 타자가 뛸 수 있어요(낫아웃). 타자를 태그하거나 1루로 던지기!",
        links: [["낫아웃 조건 자세히", "notOut"]]
      },
      {
        id: "c-gear", level: "tip", title: "보호장비는 꼭!",
        short: "마스크·헬멧·프로텍터·레그가드를 꼭 착용해요. 파울 타구가 가장 많이 오는 자리예요."
      }
    ],
    mistakes: [
      { bad: "공만 보고 주자를 전혀 안 본다", good: "공을 받은 뒤 주자 움직임도 확인한다" },
      { bad: "낮은 공을 무조건 글러브로 잡으려고 한다", good: "잡기 어려우면 몸으로 막아 뒤로 빠지는 것을 줄인다" },
      { bad: "도루한다고 너무 급하게 던지다가 공을 놓친다", good: "먼저 공을 확실히 받은 뒤 빠르게 송구한다" },
      { bad: "아웃카운트를 모른다", good: "항상 현재 아웃 수를 확인한다" },
      { bad: "홈으로 들어오는 주자를 늦게 발견한다", good: "3루에 주자가 있으면 홈 진입 가능성도 생각한다" }
    ],
    situations: [
      {
        title: "1루 주자 도루!", runners: [1],
        text: "1루 주자가 <b>투구와 동시에</b> 2루로 뛰었어요.",
        question: "포수는 무엇을 하나요?",
        options: ["공을 받은 뒤 2루로 빠르게 송구", "공을 받자마자 투수에게 돌려준다", "공보다 주자를 먼저 쫓아간다"], answer: 0,
        explain: "공을 <b>확실히 받은 뒤</b> 2루로 빠르게 던져 도루 저지를 시도해요.",
        scenario: "stealFail"
      },
      {
        title: "원바운드 공", runners: [1],
        text: "투수가 던진 공이 <b>홈 앞에서 크게 튀어요.</b>",
        question: "포수는 무엇을 해야 하나요?",
        options: ["글러브만 뻗어서 잡으려 한다", "몸으로 막아서 뒤로 빠지지 않게 한다", "다칠 수 있으니 피한다"], answer: 1,
        explain: "잡기 어렵다면 <b>몸으로 막아서</b> 공이 뒤로 빠지는 걸 줄여요. 그래야 주자가 못 가요.",
        scenario: "catcherBlock"
      },
      {
        title: "홈으로 들어오는 공과 주자", runners: [3],
        text: "3루 주자가 홈으로 뛰고, 외야에서 <b>홈으로 공이 들어와요.</b>",
        question: "포수는 무엇을 신경 써야 하나요?",
        options: ["공만 보고 주자는 신경 쓰지 않는다", "공과 주자를 같이 보며 홈에서 아웃 플레이를 준비한다", "홈을 비우고 1루로 커버 간다"], answer: 1,
        explain: "<b>공과 주자를 같이</b> 보면서 홈에서 받아 태그할 준비를 해요.",
        scenario: "homeTag"
      },
      {
        title: "2아웃, 세 번째 스트라이크를 놓쳤다",
        text: "헛스윙 삼진인데 공이 미트에서 빠졌고, 타자가 <b>1루로 뛰기 시작했어요.</b>",
        question: "포수는?",
        options: ["이미 삼진이니까 신경 쓰지 않는다", "공을 주워 타자를 태그하거나 1루로 던진다"], answer: 1,
        explain: "2아웃이면 <b>낫아웃</b>! 타자를 태그하거나 1루로 먼저 던져야 아웃이에요.",
        scenario: "notOut"
      }
    ],
    summary: ["공을 안정적으로 받는다", "어려운 공은 뒤로 빠지지 않게 막는다", "주자 움직임을 확인한다", "도루 시 빠르게 송구한다", "아웃카운트와 홈 상황을 확인한다"]
  }
];

/* ---------- 포지션별 미니퀴즈 (role 로 구분) ---------- */
const playerQuizzes = [
  // 타자
  { role: "batter", type: "situation", category: "batting", question: "공을 쳤는데 내야 땅볼이 나왔어요. 가장 먼저 해야 할 행동은?", options: ["타구를 구경한다", "바로 1루로 달린다", "벤치를 본다", "홈플레이트에서 기다린다"], answer: 1, explanation: "치면 <b>바로 1루로!</b>" },
  { role: "batter", type: "ox", category: "batting", question: "볼 3개 상황에서 스트라이크존을 크게 벗어난 공이 들어왔어요. 무조건 휘둘러야 할까요?", options: ["네", "아니요"], answer: 1, explanation: "볼이면 <b>볼넷</b>! 나쁜 공은 보내도 돼요." },
  { role: "batter", type: "choice", category: "terminology", question: "2스트라이크에서 일반 스윙으로 파울이 났어요. 어떻게 될까요?", options: ["삼진 아웃", "그대로 2스트라이크", "볼넷", "1루로 진루"], answer: 1, explanation: "일반 파울은 2스트라이크 이후엔 카운트가 안 늘어요." },
  { role: "batter", type: "choice", category: "batting", question: "1루에 거의 도착했어요. 어떻게 달릴까요?", options: ["멈출 준비를 하며 속도를 줄인다", "베이스를 밟을 때까지 전력질주"], answer: 1, explanation: "1루는 지나쳐도 곧장 돌아오면 괜찮아요. <b>끝까지 전력질주!</b>" },
  { role: "batter", type: "choice", category: "batting", question: "친 공이 파울 같았는데 심판이 아직 아무 콜도 안 했어요.", options: ["혼자 멈춘다", "심판 콜을 확인하며 계속 뛴다"], answer: 1, explanation: "<b>내 판단보다 심판 콜!</b> 콜이 나올 때까지 플레이는 계속돼요." },
  { role: "batter", type: "choice", category: "situation", question: "타석에 들어가기 전에 확인하면 좋은 것은?", options: ["아웃카운트와 주자 위치", "관중 수", "상대 유니폼 색", "전광판 광고"], answer: 0, explanation: "<b>아웃카운트와 주자</b>를 알면 무엇을 해야 할지 보여요." },
  // 투수
  { role: "pitcher", type: "choice", category: "pitching", question: "초보 투수에게 가장 먼저 중요한 것은?", options: ["무조건 가장 빠른 공", "스트라이크를 안정적으로 던지는 것", "변화구만 던지는 것", "매번 삼진만 노리는 것"], answer: 1, explanation: "<b>빠른 공보다 스트라이크!</b>" },
  { role: "pitcher", type: "choice", category: "steal", question: "1루 주자가 베이스에서 많이 떨어져 있어요. 할 수 있는 플레이는?", diagram: { runners: [1] }, options: ["견제", "보크", "타자에게 고의로 몸에 맞히기", "아무것도 할 수 없음"], answer: 0, explanation: "<b>견제</b>로 주자를 잡거나 리드를 줄일 수 있어요." },
  { role: "pitcher", type: "choice", category: "pitching", question: "3볼 0스트라이크예요. 볼이 하나 더 나오면?", options: ["삼진", "볼넷", "아무 일 없음", "타자 아웃"], answer: 1, explanation: "볼 4개 = <b>볼넷</b>" },
  { role: "pitcher", type: "choice", category: "situation", question: "타자가 투수 앞으로 땅볼을 쳤어요.", options: ["잡아서 아웃 플레이를 한다", "피한다", "그대로 서 있는다", "포수에게 맡긴다"], answer: 0, explanation: "투수도 <b>수비수</b>예요!" },
  { role: "pitcher", type: "choice", category: "terminology", question: "주자가 있을 때 투구 동작을 시작했다가 부자연스럽게 멈추면?", options: ["보크가 선언될 수 있다", "아무 문제 없다", "자동으로 스트라이크", "타자가 아웃"], answer: 0, explanation: "<b>보크</b> → 주자가 한 베이스씩 진루할 수 있어요." },
  { role: "pitcher", type: "choice", category: "situation", question: "1루수 쪽 땅볼이라 1루수가 공을 잡으러 나갔어요. 1루가 비었어요. 투수는?", options: ["1루로 달려가 커버", "마운드에 서 있는다", "홈으로 간다", "3루를 커버한다"], answer: 0, explanation: "<b>1루 커버!</b> 투구 후에도 플레이에 참여해요." },
  // 포수
  { role: "catcher", type: "choice", category: "steal", question: "1루 주자가 2루 도루를 시도해요. 포수가 공을 받은 다음 할 수 있는 플레이는?", diagram: { runners: [1] }, options: ["2루로 송구해 도루 저지를 시도한다", "투수에게 돌려준다", "1루로 던진다", "공을 들고 기다린다"], answer: 0, explanation: "<b>2루로 빠르게 송구!</b>" },
  { role: "catcher", type: "choice", category: "catching", question: "투수 공이 땅에 튀어 잡기 어려워요. 가장 중요한 것은?", options: ["몸으로 막아서 뒤로 빠지는 것을 줄인다", "피한다", "일어서서 기다린다", "글러브만 쭉 뻗는다"], answer: 0, explanation: "<b>뒤로 안 빠지게 막는 것</b>이 먼저예요." },
  { role: "catcher", type: "choice", category: "terminology", question: "포수가 잡을 만한 공을 놓쳐서 주자가 진루했어요. 뭐라고 기록할까요?", options: ["폭투", "포일", "보크", "도루"], answer: 1, explanation: "포수가 놓친 건 <b>포일(PB)</b>, 투수가 어렵게 던진 건 폭투(WP)!" },
  { role: "catcher", type: "choice", category: "situation", question: "3루 주자가 홈으로 뛰고 외야에서 홈으로 공이 들어와요. 포수는?", diagram: { runners: [3] }, options: ["공과 주자를 같이 보며 홈에서 태그 준비", "1루를 커버하러 간다", "공만 보고 주자는 무시", "홈을 비운다"], answer: 0, explanation: "홈에서 <b>공을 받아 태그</b>할 준비!" },
  { role: "catcher", type: "choice", category: "terminology", question: "포수 뒤쪽 파울 지역으로 높이 뜬 공을 땅에 떨어지기 전에 잡았어요.", options: ["타자 아웃", "그냥 파울", "볼", "다시 투구"], answer: 0, explanation: "파울 지역이어도 잡으면 <b>아웃</b>!" },
  { role: "catcher", type: "choice", category: "situation", question: "2아웃에서 세 번째 스트라이크를 놓쳤고 타자가 1루로 뛰어요.", options: ["타자를 태그하거나 1루로 송구한다", "이미 삼진이니 신경 안 쓴다"], answer: 0, explanation: "<b>낫아웃</b> 상황! 아웃을 마무리해야 해요." },
  // 타자 · 스윙 비교 미니퀴즈
  { role: "swing", type: "choice", category: "batting", question: "공을 띄우는 느낌이 강한 스윙은?", options: ["다운스윙", "업스윙", "레벨스윙"], answer: 1, explanation: "<b>업스윙</b>은 맞힌 뒤 위로 퍼 올리듯 지나가서 공을 띄우는 느낌이 강해요." },
  { role: "swing", type: "choice", category: "batting", question: "배트가 비교적 평평하게 들어가는 느낌의 스윙은?", options: ["레벨스윙", "다운스윙", "포스아웃"], answer: 0, explanation: "<b>레벨스윙</b>! (포스아웃은 스윙이 아니라 수비 규칙이에요 😉)" },
  { role: "swing", type: "choice", category: "batting", question: "다운스윙을 가장 쉽게 설명한 것은?", options: ["배트를 무조건 아래로 찍는 것", "공을 향해 자연스럽게 내려오며 들어가는 것", "스윙 없이 공을 보는 것"], answer: 1, explanation: "무조건 찍는 게 아니라 <b>공을 향해 자연스럽게 내려오며</b> 들어가는 느낌이에요." },
  { role: "swing", type: "choice", category: "batting", question: "세 가지 스윙 중 하나만 정답일까요?", options: ["네, 하나만 정답이에요", "아니요, 선수마다 조금씩 달라요"], answer: 1, explanation: "정답/오답이 아니라 <b>배트가 들어오는 길의 차이</b>예요. 실제로는 선수마다 스윙이 달라요." }
];

/* ---------- 타자 · 스윙 비교 (다운 / 업 / 레벨) ----------
   전문 타격 레슨이 아니라 "배트가 공으로 들어오는 길이 조금씩 다르구나" 감 잡기용
   frames: 5단계(준비 · 시작 · 진입 · 임팩트 · 팔로스루)의 손(hands) / 배트 끝(tip) 위치
           그림 좌표는 320×200, 타자는 왼쪽, 공은 오른쪽에서 옴
*/
const batterSwing = {
  title: "스윙은 어떻게 다른가요?",
  intro: "타자는 공을 칠 때 배트가 들어오는 각도와 길이 조금씩 다를 수 있어요. 대표적으로 <b>다운스윙 · 업스윙 · 레벨스윙</b>이라는 말을 써요. 초보자는 <b>“배트가 공 쪽으로 어떻게 들어오는지”</b> 감 잡는 정도면 충분해요!",
  one: "스윙은 배트가 공으로 들어오는 길이 조금씩 달라요.",
  impact: [188, 124],
  ballIn: [[300, 118], [262, 121], [226, 123]],
  steps: [
    { name: "준비 자세", text: "공을 보기 좋은 자세로 배트를 준비해요." },
    { name: "스윙 시작", text: "몸이 돌기 시작하면서 배트가 앞으로 나와요." },
    { name: "배트 진입", text: { down: "배트가 공을 향해 <b>내려오듯</b> 들어가요. 무조건 찍는 게 아니라 공 쪽으로 자연스럽게!", up: "배트가 공보다 조금 <b>아래에서 올라오듯</b> 들어가요.", level: "배트가 공 높이에 맞춰 <b>평평하게</b> 들어가요." } },
    { name: "임팩트", text: "공과 배트가 만나는 순간! 어떤 스윙이든 공을 끝까지 보는 게 먼저예요." },
    { name: "팔로스루", text: { down: "맞힌 뒤 멈추지 않고 <b>앞으로 뻗으며</b> 자연스럽게 마무리해요.", up: "맞힌 뒤 <b>위쪽으로 퍼 올리듯</b> 크게 마무리해요.", level: "맞힌 뒤 <b>앞쪽으로 길게</b> 뻗어 마무리해요." } }
  ],
  swings: [
    {
      key: "down", name: "다운스윙", line: "solid",
      one: "공을 향해 자연스럽게 <b>내려오며</b> 들어가는 스윙",
      feel: "공을 향해 내려오며 들어감", image: "정확하게 맞히는 느낌",
      points: ["공을 정확하게 맞히는 느낌을 이해하기 좋아요", "공 윗부분만 스치지 않게 도와줘요", "낮고 강한 타구나 땅볼 느낌과 연결돼요"],
      caution: "다운스윙은 <b>배트를 무조건 아래로 찍는 것이 아니에요.</b> 공이 오는 곳을 향해 자연스럽게 내려오며 들어간다고 생각하면 돼요.",
      result: "낮고 강하게 가는 느낌",
      frames: { hands: [[96, 72], [104, 86], [128, 106], [148, 126], [172, 130]], tip: [[58, 30], [72, 46], [160, 84], [204, 124], [230, 142]] },
      ballOut: [302, 146]
    },
    {
      key: "up", name: "업스윙", line: "dash",
      one: "맞힌 뒤 <b>퍼 올리듯</b> 지나가는, 공을 띄우는 느낌이 강한 스윙",
      feel: "퍼 올리듯 지나감", image: "공을 띄우는 느낌",
      points: ["타구를 띄우는 느낌을 설명하기 쉬워요", "멀리 보내는 이미지로 이해하기 쉬워요", "너무 심하면 헛스윙이 많아질 수도 있어요"],
      caution: "업스윙이 <b>무조건 홈런 스윙</b>은 아니에요. 공을 띄우는 느낌이 강한 스윙 정도로 이해하면 돼요.",
      result: "공이 뜨는 느낌",
      frames: { hands: [[96, 72], [104, 88], [124, 118], [148, 128], [166, 108]], tip: [[58, 30], [70, 50], [142, 156], [204, 126], [214, 60]] },
      ballOut: [292, 50]
    },
    {
      key: "level", name: "레벨스윙", line: "dot",
      one: "배트가 공 높이에 맞춰 <b>평평하게</b> 들어가는 느낌의 스윙",
      feel: "비교적 평평하게 지나감", image: "안정적으로 맞히는 느낌",
      points: ["안정적으로 맞히는 느낌을 설명하기 좋아요", "공을 정면으로 맞히는 이미지예요", "입문자에게 가장 설명하기 쉬운 형태 중 하나예요"],
      caution: "실제 스윙은 몸이 돌면서 둥글게 움직여서 <b>완전히 일자로만</b> 움직이지는 않아요. 공 근처에서 “비교적 평평하게” 지나간다는 뜻이에요.",
      result: "앞으로 곧게 가는 느낌",
      frames: { hands: [[96, 72], [104, 86], [126, 116], [148, 126], [172, 122]], tip: [[58, 30], [72, 46], [150, 122], [204, 124], [234, 118]] },
      ballOut: [306, 120]
    }
  ],
  myths: [
    { bad: "다운스윙은 배트를 무조건 아래로 찍는 것이다", good: "공을 향해 자연스럽게 들어오는 스윙으로 이해하면 쉬워요" },
    { bad: "업스윙은 무조건 홈런 스윙이다", good: "공을 띄우는 느낌이 강한 스윙으로 이해하면 돼요" },
    { bad: "레벨스윙은 배트가 완전히 일자로만 움직인다", good: "비교적 평평하게 들어오는 느낌이라고 이해하면 돼요" },
    { bad: "세 가지 중 하나만 정답이다", good: "실제로는 선수마다 스윙이 조금씩 달라요" }
  ],
  notice: "이 설명은 초보자용 간단 안내예요. 실제 선수들의 스윙은 사람마다 다를 수 있고, 여기서는 차이를 쉽게 이해하는 데 목적이 있어요."
};
