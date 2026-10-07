/* =========================================================
   워니의 야구 입문서 — 콘텐츠 데이터
   설명 문구, 전광판 예시, 용어, 퀴즈는 모두 이 파일에서 수정하면 됩니다.
   (HTML 태그 <b>, <br> 정도는 그대로 써도 됩니다)
   ========================================================= */

/* ---------- 1. 단계별 설명 카드 ----------
   visual: 카드 아래에 붙는 그림/체험 위젯 이름
     'diamond'  : 베이스 한 바퀴 달려보기
     'count'    : 스트라이크/볼 카운트 체험
     'homerun'  : 주자 수에 따른 홈런 점수
     'inning'   : 이닝(초/말) 표
   items: 작은 카드 목록 (icon, title, big, desc, anim, base, featured)
     anim : 'shake' | 'fly' | 'roll' | 'pop'  (아이콘 애니메이션)
     base : 1~4 → 미니 다이아몬드에 해당 베이스까지 표시 (안타 카드용)
     featured : true 면 강조 카드
*/
const lessons = [
  {
    id: "game",
    step: 1,
    emoji: "⚾",
    title: "야구는 어떤 게임?",
    lead: "공격팀과 수비팀이 <b>번갈아</b> 경기하면서<br><b>점수를 더 많이 낸 팀</b>이 이기는 게임이야!",
    points: [
      "공격하는 선수(<b>타자</b>)는 공을 치고 달려요.",
      "<b>홈 → 1루 → 2루 → 3루 → 홈</b> 순서로 한 바퀴!",
      "다시 홈까지 들어오면 <b>1점!</b>"
    ],
    big: "HOME = +1",
    visual: "diamond",
    tip: "아래 버튼을 눌러서 직접 한 바퀴 돌아보자 👇"
  },
  {
    id: "count",
    step: 2,
    emoji: "🎯",
    title: "스트라이크와 볼",
    lead: "투수가 던진 공은 <b>스트라이크</b> 아니면 <b>볼</b>로 판정돼.",
    items: [
      {
        icon: "⚾",
        title: "스트라이크",
        big: "3 STRIKE",
        desc: "치기 좋은 곳(스트라이크존)에 들어온 공<br>3개 모이면 → <b>삼진 아웃</b>",
        tone: "yellow"
      },
      {
        icon: "🙅",
        title: "볼",
        big: "4 BALL",
        desc: "스트라이크존을 벗어난 공<br>4개 모이면 → <b>볼넷</b>, 타자는 <b>1루로</b>!",
        tone: "green"
      }
    ],
    tip: "💡 타자가 방망이를 휘둘렀는데 못 맞히면?<br>공이 존 밖이어도 보통 <b>스트라이크</b>야!",
    visual: "count"
  },
  {
    id: "out",
    step: 3,
    emoji: "✋",
    title: "아웃",
    lead: "야구에서 <b>가장 중요한</b> 규칙!<br>아웃 3개가 되면 공격과 수비가 바뀌어요.",
    big: "3 OUT = 공수교대",
    items: [
      {
        icon: "🔥",
        anim: "shake",
        title: "삼진",
        big: "3 STRIKE",
        desc: "스트라이크 3개 → <b>아웃</b>"
      },
      {
        icon: "⚾",
        anim: "fly",
        title: "뜬공",
        big: "슝~ 잡았다!",
        desc: "친 공이 <b>땅에 떨어지기 전에</b><br>수비수가 잡으면 아웃"
      },
      {
        icon: "⚾",
        anim: "roll",
        title: "땅볼",
        big: "공이 더 빨라!",
        desc: "타자가 1루에 도착하기 전에<br>공이 <b>먼저 1루</b>에 가면 아웃"
      }
    ]
  },
  {
    id: "hit",
    step: 4,
    emoji: "💥",
    title: "안타",
    lead: "공을 치고 <b>아웃되지 않고</b> 베이스에 무사히 도착하면<br>보통 <b>안타</b>라고 생각하면 돼!",
    items: [
      { title: "1루타", base: 1, desc: "1루까지" },
      { title: "2루타", base: 2, desc: "2루까지" },
      { title: "3루타", base: 3, desc: "3루까지" },
      { title: "홈런", base: 4, desc: "홈까지 한 번에!", featured: true }
    ]
  },
  {
    id: "homerun",
    step: 5,
    emoji: "🚀",
    title: "홈런",
    lead: "홈런을 치면 타자는 <b>홈까지</b> 들어올 수 있어.<br>베이스에 있던 주자들도 <b>다같이</b> 홈으로!",
    big: "주자 수 + 1 = 점수",
    visual: "homerun",
    tip: "주자 수를 바꿔 보면서 몇 점인지 확인해봐 👇"
  },
  {
    id: "inning",
    step: 6,
    emoji: "🔄",
    title: "이닝",
    lead: "야구는 보통 <b>9이닝(9회)</b>까지 해.<br>한 이닝은 <b>초</b>와 <b>말</b>로 나뉘어!",
    items: [
      { icon: "⬆️", title: "초", big: "원정팀 공격", desc: "이닝의 앞쪽 절반" },
      { icon: "⬇️", title: "말", big: "홈팀 공격", desc: "이닝의 뒤쪽 절반" }
    ],
    visual: "inning",
    tip: "'3회 말' = <b>세 번째 이닝</b>에서 <b>홈팀</b>이 공격 중!<br>표의 칸을 눌러서 확인해봐 👇"
  }
];

/* ---------- 2. 실전 전광판 예시 ----------
   half: '초' | '말' / runners: 주자가 있는 베이스 번호 배열
   설명 문장은 자동으로 만들어지고, note 가 있으면 한 줄 더 붙어요.
*/
const boardScenarios = [
  {
    inning: 2, half: "말", outs: 1, runners: [1, 2], balls: 2, strikes: 1,
    away: { name: "원정", score: 1 }, home: { name: "홈", score: 0 },
    note: "안타 하나면 점수가 날 수도 있는 찬스!"
  },
  {
    inning: 7, half: "초", outs: 2, runners: [1, 2, 3], balls: 3, strikes: 2,
    away: { name: "원정", score: 2 }, home: { name: "홈", score: 3 },
    note: "만루 + 3볼 2스트라이크(풀카운트)! 다음 공 하나로 볼넷, 삼진, 안타가 갈려요 😱"
  },
  {
    inning: 9, half: "말", outs: 0, runners: [], balls: 0, strikes: 0,
    away: { name: "원정", score: 4 }, home: { name: "홈", score: 4 },
    note: "동점인 9회 말! 홈팀이 1점만 내면 그대로 경기 끝 (끝내기)!"
  }
];

/* ---------- 3. 한 줄 요약 ---------- */
const summaryFlow = [
  { icon: "🏏", text: "공을 친다" },
  { icon: "🏃", text: "베이스를 돈다" },
  { icon: "🏠", text: "홈에 들어오면 <b>1점</b>" },
  { icon: "🔄", text: "아웃 3개면 <b>공수교대</b>" },
  { icon: "9️⃣", text: "보통 <b>9회</b>까지 진행" }
];

/* ---------- 4. 추가 용어 ---------- */
const glossary = [
  { icon: "🟨", term: "만루", desc: "1루, 2루, 3루에 <b>모두</b> 주자가 있는 상태" },
  { icon: "💨", term: "도루", desc: "투수가 공을 던지는 사이 주자가 다음 베이스로 <b>몰래 뛰는</b> 것" },
  { icon: "✌️", term: "병살", desc: "하나의 플레이에서 아웃을 <b>2개</b> 잡는 것" },
  { icon: "🙇", term: "희생플라이", desc: "뜬공으로 아웃되지만, 그 사이 주자가 <b>홈으로 들어와</b> 점수를 내는 플레이" },
  { icon: "↗️", term: "파울", desc: "친 공이 정해진 경기 영역(파울라인) <b>밖으로</b> 나가는 것" },
  { icon: "🦶", term: "태그업", desc: "뜬공이 잡힌 뒤, 주자가 베이스를 밟고 있다가 <b>다음 베이스로</b> 뛰는 플레이" }
];

/* ---------- 5. 퀴즈 ----------
   answer: options 배열의 인덱스 (0부터 시작)
*/
const quizList = [
  {
    question: "타자가 홈까지 돌아오면 몇 점일까요?",
    options: ["1점", "2점", "3점", "4점"],
    answer: 0,
    explanation: "홈에 들어온 주자 <b>한 명당 1점</b>이에요."
  },
  {
    question: "아웃이 몇 개가 되면 공격과 수비가 바뀔까요?",
    options: ["1개", "2개", "3개", "4개"],
    answer: 2,
    explanation: "<b>3 OUT = 공수교대!</b> 야구에서 제일 중요한 규칙이에요."
  },
  {
    question: "스트라이크가 3개가 되면?",
    options: ["볼넷", "삼진", "홈런", "도루"],
    answer: 1,
    explanation: "스트라이크 3개면 <b>삼진 아웃</b>이에요."
  },
  {
    question: "볼이 4개가 되면?",
    options: ["타자 아웃", "타자가 1루로 걸어간다", "타자가 2루로 간다", "다시 처음부터"],
    answer: 1,
    explanation: "볼 4개는 <b>볼넷</b>! 타자는 공을 안 치고도 <b>1루로</b> 걸어가요."
  },
  {
    question: "타자가 친 공을 땅에 떨어지기 전에 수비수가 잡았습니다. 어떻게 될까요?",
    options: ["안타", "홈런", "아웃", "볼넷"],
    answer: 2,
    explanation: "땅에 닿기 전에 잡으면 <b>뜬공 아웃</b>이에요."
  },
  {
    question: "주자가 2명 있을 때 타자가 홈런을 쳤습니다. 몇 점일까요?",
    options: ["1점", "2점", "3점", "4점"],
    answer: 2,
    explanation: "주자 2명 + 타자 1명 = <b>3점 홈런</b>!"
  },
  {
    question: "'3회 말'은 어떤 상황일까요?",
    options: ["3번째 이닝 홈팀 공격", "3번째 이닝 원정팀 공격", "경기 종료", "연장전"],
    answer: 0,
    explanation: "<b>초 = 원정팀</b>, <b>말 = 홈팀</b> 공격이에요. 3회 말은 3번째 이닝의 홈팀 공격!"
  },
  {
    question: "2아웃 상황에서 한 명이 더 아웃되었습니다. 어떻게 될까요?",
    options: ["계속 공격한다", "점수 +1", "공격과 수비가 바뀐다", "홈런"],
    answer: 2,
    explanation: "아웃이 3개가 됐으니 <b>공수교대</b>!"
  },
  {
    question: "BALL 3 / STRIKE 2 상황입니다. 다음 공이 볼이면 어떻게 될까요?",
    options: ["삼진", "볼넷", "홈런", "아웃"],
    answer: 1,
    explanation: "볼이 4개가 되니까 <b>볼넷</b>, 타자는 1루로!"
  },
  {
    question: "만루 상황에서 홈런을 쳤습니다. 몇 점일까요?",
    options: ["1점", "2점", "3점", "4점"],
    answer: 3,
    explanation: "주자 3명 + 타자 1명 = <b>4점</b>! 이걸 <b>그랜드슬램</b>이라고 해요 🏆"
  }
];

/* ---------- 6. 퀴즈 등급 (min 점수 이상이면 해당 등급) ---------- */
const grades = [
  { min: 10, title: "야구 천재 🏆", msg: "이제 워니보다 야구 잘 아는 거 아니야?" },
  { min: 7, title: "야구 잘알 직전 🔥", msg: "SBO 보면서 충분히 따라갈 수 있겠다!" },
  { min: 4, title: "야구 입문 완료 ⚾", msg: "이제 경기 볼 준비가 되어가고 있어!" },
  { min: 0, title: "야구 새싹 🌱", msg: "아직 괜찮아! 설명을 한 번 더 읽어보자." }
];
