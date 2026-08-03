/**
 * 한/영 전환.
 *
 * 화면 문구는 이 사전에서, 운영자가 쓰는 콘텐츠는 DB의 *_en 컬럼에서 온다.
 * 영문이 비어 있으면 한국어를 그대로 보여준다 — 번역을 다 채우지 않아도
 * 페이지가 깨지지 않고, 채우는 만큼 영어가 된다.
 */

export type Locale = "ko" | "en";

export const LOCALES: Locale[] = ["ko", "en"];
export const LOCALE_COOKIE = "lang";
export const DEFAULT_LOCALE: Locale = "ko";

export function normalizeLocale(v: string | undefined | null): Locale {
  return v === "en" ? "en" : "ko";
}

/** 영문이 비었으면 한국어로 떨어진다. 번역을 강제하지 않기 위한 규칙. */
export function pick(
  locale: Locale,
  ko: string | null | undefined,
  en: string | null | undefined,
): string {
  if (locale === "en") {
    const t = (en ?? "").trim();
    if (t) return t;
  }
  return (ko ?? "").trim();
}

type Dict = Record<string, { ko: string; en: string }>;

const DICT: Dict = {
  // ── 공통 ──────────────────────────────────────────────
  "brand.name": { ko: "서울이모삼촌", en: "Seoul Imo·Samchon" },
  "brand.tagline": {
    ko: "시니어 로컬 라이프 크리에이터",
    en: "Senior local life creators",
  },
  "brand.home": { ko: "서울이모삼촌 홈", en: "Seoul Imo·Samchon home" },

  "nav.menu": { ko: "주요 메뉴", en: "Main menu" },
  "nav.home": { ko: "홈", en: "Home" },
  "nav.about": { ko: "브랜드소개", en: "About" },
  "nav.people": { ko: "우리 이모·삼촌", en: "Our people" },
  "nav.notice": { ko: "공지사항", en: "Notices" },
  "nav.faq": { ko: "FAQ", en: "FAQ" },
  "nav.classes": { ko: "클래스", en: "Classes" },
  "nav.apply": { ko: "신청하기", en: "Apply / Book" },
  // 모바일 메뉴 버튼. 아이콘(☰)만으로 두지 않는 이유는 §접근성 —
  // 시니어 사용자에게 햄버거 아이콘 단독은 인지율이 낮다. 항상 글자를 함께 쓴다.
  "nav.open": { ko: "메뉴", en: "Menu" },
  "nav.close": { ko: "닫기", en: "Close" },

  "lang.label": { ko: "언어 선택", en: "Language" },
  "lang.toKo": { ko: "한국어", en: "한국어" },
  "lang.toEn": { ko: "English", en: "English" },

  "common.newWindow": {
    ko: " (새 창에서 열립니다)",
    en: " (opens in a new window)",
  },
  "common.closed": { ko: "접수 마감", en: "Closed" },
  "common.preparing": { ko: "접수 준비 중", en: "Opening soon" },
  "common.copyLink": { ko: "링크 복사해서 보내기", en: "Copy link to share" },
  "common.copied": { ko: "복사됨 ✓", en: "Copied ✓" },
  "common.copyFail": {
    ko: "주소창에서 복사해 주세요",
    en: "Please copy from the address bar",
  },
  "common.saveQr": { ko: "QR 이미지 저장", en: "Save QR image" },
  "common.scanQr": {
    ko: "휴대폰 카메라로 비춰 주세요",
    en: "Point your phone camera here",
  },
  "common.more": { ko: "자세히 보기", en: "See more" },

  // ── 홈 ────────────────────────────────────────────────
  "home.eyebrow": { ko: "SEOUL 50+ 선정사업", en: "SEOUL 50+ SELECTED PROJECT" },
  "home.h1a": { ko: "여러분만이 알고 있는", en: "Show us the Seoul" },
  "home.h1b": { ko: "서울의 ‘로컬함’을 알려주세요", en: "only you know" },
  "home.h1kw": { ko: "‘로컬함’", en: "only you" },
  "home.sub": {
    ko: "만 60세 이상 시니어와 함께하는 유급 로컬 체험.",
    en: "Paid local experiences hosted by Seoul residents aged 60+.",
  },
  "home.viewNotice": { ko: "모집 공고 보기 ›", en: "Read the notice ›" },
  "home.noticeEyebrow": { ko: "공지사항", en: "Notices" },
  "home.noticeTitle": { ko: "최신 소식", en: "Latest news" },
  "home.noticeSub": {
    ko: "모집 공고와 안내를 이곳에 올립니다. 카드를 누르면 상세 페이지로 이동해요.",
    en: "Announcements and guides. Tap a card to read the full notice.",
  },
  "home.noticeAll": { ko: "공지사항 전체보기 →", en: "All notices →" },
  "home.noticeEmpty": {
    ko: "첫 공지가 곧 올라올 예정이에요.",
    en: "The first notice is coming soon.",
  },
  "home.peopleEyebrow": { ko: "우리 사람들", en: "Our people" },
  "home.peopleTitle": { ko: "이런 분들이 함께합니다", en: "The people behind it" },
  "home.peopleSub": {
    ko: "평범한 서울의 이모·삼촌이라서 특별합니다.",
    en: "Ordinary Seoul aunties and uncles. That is exactly the point.",
  },
  "home.peopleAll": { ko: "우리 이모·삼촌 모두 보기 →", en: "Meet everyone →" },

  // ── 신청 ──────────────────────────────────────────────
  "apply.eyebrow": { ko: "신청하기", en: "Apply / Book" },
  "apply.title": { ko: "어떤 신청을 하시나요?", en: "What would you like to do?" },
  "apply.sub": {
    ko: "아래에서 하나를 고르시면 신청서가 바로 열립니다. QR을 휴대폰으로 비추셔도 됩니다.",
    en: "Pick one below and the form opens right away. You can also scan the QR code.",
  },
  "apply.empty": {
    ko: "준비 중입니다. 곧 신청을 받을 예정이에요.",
    en: "Nothing open right now. Applications will open soon.",
  },
  "apply.altEyebrow": { ko: "그 밖의 방법", en: "Another way" },
  "apply.altTitle": {
    ko: "손으로 쓴 신청서를 보내고 싶으세요?",
    en: "Prefer to send a paper application?",
  },
  "apply.altSub": {
    ko: "시니어 호스트 신청은 종이로도 받습니다. 휴대폰이 어려우시면 이 방법을 쓰세요.",
    en: "Host applications are also accepted on paper, if a phone is difficult.",
  },
  "apply.step1": {
    ko: "공지사항 모집공고에서 신청서 내려받기",
    en: "Download the form from the notice page",
  },
  "apply.step2": { ko: "출력해서 작성", en: "Print and fill it in" },
  "apply.step3": { ko: "사진 촬영", en: "Take a photo" },
  "apply.step4": { ko: "아래 이메일로 전송", en: "Email it to the address below" },
  "apply.phone": {
    ko: "어려우시면 전화 주세요.",
    en: "Call us if anything is unclear.",
  },
  "apply.phoneSub": {
    ko: "자녀·손주분과 함께 신청하셔도 좋아요.",
    en: "You are welcome to apply together with your family.",
  },
  "apply.privacy": {
    ko: "지원서는 Google Forms에서 접수되며, 개인정보 처리 주체는 팀 theOne입니다.",
    en: "Applications are collected via Google Forms. Team theOne is the data controller.",
  },

  // ── 소개 ──────────────────────────────────────────────
  "people.eyebrow": { ko: "우리 사람들", en: "Our people" },
  "people.title": {
    ko: "평범한 서울의 이모·삼촌이라서 특별합니다",
    en: "Ordinary Seoul aunties and uncles. That is what makes it special.",
  },
  "people.intro": {
    ko: "부엌은 빌릴 수 있어도, 40년 단골 관계와 손맛은 빌릴 수 없습니다. 서울이모삼촌과 함께하는 분들을 소개합니다.",
    en: "You can rent a kitchen. You cannot rent forty years of knowing your grocer. Meet the people behind Seoul Imo·Samchon.",
  },
  "people.seniorsEyebrow": { ko: "시니어 호스트", en: "Senior hosts" },
  "people.seniorsTitle": { ko: "우리 이모·삼촌", en: "Our imo and samchon" },
  "people.seniorsSub": {
    ko: "60년의 세월이 그대로 프로그램이 되는 분들입니다.",
    en: "Sixty years of living, turned into an afternoon you can join.",
  },
  "people.seniorsEmpty": {
    ko: "첫 이모·삼촌을 곧 소개해 드릴게요.",
    en: "We will introduce our first hosts soon.",
  },
  "people.teamEyebrow": { ko: "팀 theOne", en: "Team theOne" },
  "people.teamTitle": { ko: "함께 만드는 사람들", en: "The team behind it" },
  "people.teamSub": {
    ko: "시니어가 주인공이고, 저희는 옆에서 거듭니다. 통역·모객·정산은 저희 몫입니다.",
    en: "The hosts are the stars. We handle interpretation, bookings and payments.",
  },
  "people.teamEmpty": {
    ko: "팀 소개를 준비하고 있어요.",
    en: "Team profiles are on the way.",
  },
  "people.ctaTitle": { ko: "다음은 당신의 이야기입니다", en: "Your story could be next" },
  "people.ctaSub": {
    ko: "요리가 아니어도 좋아요. 동네 산책, 손재주, 살아온 이야기 — 무엇이든 특별함이 됩니다.",
    en: "It does not have to be cooking. A walk, a craft, a life story — anything can become an experience.",
  },
  "people.ctaBtn": { ko: "나도 신청하기", en: "Apply as a host" },
  "people.photoPending": { ko: "사진 준비 중", en: "photo coming soon" },

  // ── 공지 ──────────────────────────────────────────────
  "notice.eyebrow": { ko: "공지사항", en: "Notices" },
  "notice.title": { ko: "공지사항", en: "Notices" },
  "notice.sub": {
    ko: "모집 공고와 안내입니다. 카드를 누르면 상세 내용과 첨부파일을 볼 수 있어요.",
    en: "Announcements and guides. Tap a card for details and attachments.",
  },
  "notice.empty": {
    ko: "아직 등록된 공지가 없습니다.",
    en: "No notices yet.",
  },
  "notice.back": { ko: "← 공지사항 목록", en: "← All notices" },
  "notice.author": { ko: "작성 · 서울이모삼촌", en: "By Seoul Imo·Samchon" },
  "notice.attachments": { ko: "첨부파일 · 내려받기", en: "Attachments" },
  "notice.download": { ko: "내려받기", en: "Download" },
  "notice.formKind": { ko: "신청서 양식 · ", en: "Application form · " },
  "notice.applyHow": { ko: "신청 방법 자세히 보기", en: "How to apply" },
  "notice.koreanOnly": {
    ko: "",
    en: "This notice is written in Korean. Please contact us if you need help reading it.",
  },
  "notice.attachCount": { ko: "첨부파일", en: "attachments" },
  "notice.deadline": { ko: "마감", en: "Closed" },

  // ── FAQ ───────────────────────────────────────────────
  "faq.eyebrow": { ko: "자주 묻는 질문", en: "Frequently asked" },
  "faq.title": { ko: "궁금한 점을 모았어요", en: "Questions we get a lot" },
  "faq.ctaTitle": { ko: "궁금증이 풀리셨나요?", en: "Still have a question?" },
  "faq.ctaSub": {
    ko: "더 궁금한 점은 신청 후에도 전화·이메일로 도와드립니다.",
    en: "We are reachable by phone and email, before and after you apply.",
  },
  "faq.ctaBtn": { ko: "신청하러 가기", en: "Go to applications" },

  // ── 브랜드소개 ─────────────────────────────────────────
  "about.eyebrow": { ko: "브랜드소개", en: "About" },
  "about.title": {
    ko: "평범한 서울의 이모·삼촌이 하기에 특별합니다",
    en: "It is special because an ordinary Seoul auntie does it",
  },
  "about.lead": {
    ko: "서울에 온 외국인 여행자들은 유명 관광지보다 ‘진짜 한국 사람들의 일상’을 더 궁금해합니다. 그런데 그걸 보여줄 사람이 없습니다. 서울이모삼촌이 바로 그 자리를 채웁니다.",
    en: "Visitors to Seoul are more curious about everyday Korean life than about landmarks. But almost nobody is there to show it. That is the gap Seoul Imo·Samchon fills.",
  },
  "about.quote": {
    ko: "“부엌은 빌릴 수 있어도, 40년 단골 관계와 손맛은 빌릴 수 없습니다. 그건 60년을 살아야만 얻어지는 것이니까요.”",
    en: "“You can rent a kitchen. You cannot rent forty years of knowing your grocer, or a taste that took a lifetime to learn.”",
  },
  "about.card1t": { ko: "손맛", en: "A cook's hand" },
  "about.card1d": {
    ko: "요리학원에서 못 배웁니다. 40년 부엌에서 나옵니다.",
    en: "Not taught in a class. It comes from forty years at one stove.",
  },
  "about.card2t": { ko: "단골 관계", en: "Regulars" },
  "about.card2d": {
    ko: "돈으로 못 삽니다. 30년 같은 시장을 다녀야 생깁니다.",
    en: "Cannot be bought. It takes thirty years at the same market.",
  },
  "about.card3t": { ko: "이야기", en: "Stories" },
  "about.card3d": {
    ko: "복제되지 않습니다. 그 사람의 인생이니까요.",
    en: "Cannot be copied. They are somebody's life.",
  },
  "about.tracksTitle": { ko: "이렇게 함께합니다", en: "Two ways to join" },
  "about.tracksSub": {
    ko: "두 갈래로 함께해요. 요리가 아니어도, 아직 뭐가 특별한지 몰라도 괜찮아요.",
    en: "Two tracks. Cooking is optional, and not knowing your own speciality yet is fine.",
  },
  "about.track1": { ko: "트랙 1", en: "Track 1" },
  "about.track1t": { ko: "쿠킹 클래스", en: "Cooking class" },
  "about.track1d": {
    ko: "시장 장보기 + 집밥 만들기. 우리 대표 프로그램.",
    en: "Market shopping and home cooking. Our flagship programme.",
  },
  "about.track2": { ko: "트랙 2", en: "Track 2" },
  "about.track2t": { ko: "나만의 특별함", en: "Your own speciality" },
  "about.track2d": {
    ko: "산책·손재주·이야기까지, 어르신만의 특별함을 체험으로.",
    en: "Walks, crafts, stories — whatever only you can offer.",
  },
  "about.ctaApply": { ko: "시니어 호스트 신청하기", en: "Apply as a host" },
  "about.ctaPeople": { ko: "함께하는 분들 보기", en: "Meet the hosts" },
  "about.classesEyebrow": { ko: "클래스", en: "Classes" },
  "about.classesTitle": {
    ko: "어떤 하루를 함께할까요",
    en: "Pick a day to spend with us",
  },
  "about.classesSub": {
    ko: "지금 열려 있는 클래스입니다. 카드를 누르면 자세한 일정과 코스를 볼 수 있어요.",
    en: "Classes running right now. Tap a card for the full schedule and route.",
  },
  "about.classesEmpty": {
    ko: "준비 중인 클래스가 곧 열립니다.",
    en: "New classes are on the way.",
  },
  "about.hostCtaTitle": {
    ko: "호스트로 함께하고 싶으세요?",
    en: "Want to host instead?",
  },
  "about.hostCtaSub": {
    ko: "만 60세 이상이면 누구나. 요리가 아니어도 좋습니다.",
    en: "Open to anyone aged 60+. Cooking is not required.",
  },

  // ── 클래스 상세 ────────────────────────────────────────
  "class.eyebrow": { ko: "클래스 안내", en: "Class" },
  "class.back": { ko: "← 브랜드소개", en: "← About" },
  "class.open": { ko: "신청 받는 중", en: "Open" },
  "class.preparing": { ko: "준비 중", en: "Coming soon" },
  "class.readMore": { ko: "자세히 보기 →", en: "Read more →" },
  "class.zoom": { ko: "포스터를 누르면 크게 보입니다", en: "Tap the poster to enlarge" },
  "class.otherEyebrow": { ko: "다른 클래스", en: "Other classes" },
  "class.otherTitle": { ko: "이런 것도 있어요", en: "You might also like" },
  "class.emailUs": { ko: "메일로 문의하기", en: "Email us" },

  // ── 손님 안내 ──────────────────────────────────────────
  "guest.eyebrow": { ko: "손님 안내", en: "For guests" },
  "guest.title": {
    ko: "서울 이모의 부엌에서 진짜 집밥을 배웁니다",
    en: "Cook a real Korean home meal with a Seoul local",
  },
  "guest.lead": {
    ko: "호스트는 60대이고, 같은 시장을 30년 다녔습니다. 부엌은 빌릴 수 있어도 그건 빌릴 수 없습니다.",
    en: "Your host is in their sixties and has shopped at the same market for thirty years. A kitchen can be rented. That cannot.",
  },
  "guest.stepsEyebrow": { ko: "이렇게 진행돼요", en: "What you will do" },
  "guest.stepsTitle": { ko: "세 시간, 한 동네", en: "Three hours, one neighbourhood" },
  "guest.step1t": { ko: "시장에서 만나요", en: "Meet at the market" },
  "guest.step1d": {
    ko: "통인시장에서 호스트와 함께 장을 봅니다. 맛보면서 오늘 만들 재료를 고릅니다.",
    en: "Start at Tongin Market with your host. Taste as you go, and pick up what you will cook together.",
  },
  "guest.step2t": { ko: "진짜 집 부엌에서", en: "Cook in a real home kitchen" },
  "guest.step2d": {
    ko: "스튜디오가 아닙니다. 40년 쓴 냄비와 그 집 레시피가 있는 서울의 부엌입니다.",
    en: "Not a studio. An actual Seoul kitchen, with the pots and recipes a family has used for forty years.",
  },
  "guest.step3t": { ko: "먹으면서 이야기를", en: "Eat, and hear the stories" },
  "guest.step3d": {
    ko: "직접 만든 밥상에 앉습니다. 호스트는 이 동네를 웬만한 가이드북보다 오래 살았습니다.",
    en: "Sit down to the meal you made. Your host has lived in this neighbourhood longer than most guidebooks have existed.",
  },
  "guest.hostsEyebrow": { ko: "호스트 소개", en: "Your hosts" },
  "guest.hostsTitle": { ko: "회사가 아니라 사람입니다", en: "Real people, not a company" },
  "guest.ctaTitle": { ko: "함께 요리하실래요?", en: "Ready to cook?" },
  "guest.ctaSub": {
    ko: "한국어를 못 해도 괜찮습니다. 젊은 팀원이 통역으로 함께합니다.",
    en: "No Korean needed. A younger team member joins to help with translation.",
  },
  "guest.soon": { ko: "예약은 곧 열립니다.", en: "Bookings open soon." },
  "guest.soonSub": {
    ko: "아래 메일로 연락 주시면 가장 먼저 알려드립니다.",
    en: "Write to us and we will let you know first.",
  },
  "guest.emailUs": { ko: "메일 보내기", en: "Email us" },
  "guest.closedNow": {
    ko: "지금은 예약을 받지 않습니다. 아래 메일로 연락 주세요.",
    en: "Bookings are not open right now. Please write to us.",
  },

  // ── 개인정보처리방침 ───────────────────────────────────
  // 본문은 lib/privacy.ts에 있다. 여기는 페이지 껍데기 문구만.
  "privacy.eyebrow": { ko: "개인정보", en: "Privacy" },
  "privacy.title": { ko: "개인정보처리방침", en: "Privacy policy" },
  "privacy.lead": {
    ko: "어떤 정보를 왜 받는지, 얼마나 두는지, 지워 달라고 하시면 어떻게 되는지를 적었습니다. 어려운 말은 되도록 뺐습니다.",
    en: "What we ask for and why, how long we keep it, and what happens when you ask us to delete it. We have kept the legal wording to a minimum.",
  },
  "privacy.effective": { ko: "시행일", en: "In effect from" },
  "privacy.toc": { ko: "이 문서의 차례", en: "On this page" },
  "privacy.short": { ko: "개인정보처리방침", en: "Privacy policy" },
  "privacy.readMore": {
    ko: "개인정보처리방침 보기 ›",
    en: "Read the privacy policy ›",
  },

  // ── 푸터 ──────────────────────────────────────────────
  "foot.motto": {
    ko: "부엌은 빌려도, 60년을 살아야 얻어지는 손맛과 이야기는 빌릴 수 없습니다. 시니어의 세월을 정당한 일자리로 잇습니다.",
    en: "You can rent a kitchen. You cannot rent a taste and a story that took sixty years. We turn those years into real, paid work.",
  },
  "foot.links": { ko: "바로가기", en: "Quick links" },
  "foot.contact": { ko: "운영 · 문의", en: "Operated by · Contact" },
  "foot.operator": { ko: "운영 · 팀 theOne", en: "Operated by Team theOne" },
  "foot.rep": { ko: "대표자", en: "Representative" },
  "foot.inquiry": { ko: "문의", en: "Contact" },
  "foot.support": {
    ko: "후원 · 서울특별시50플러스재단 시니어일자리지원센터",
    en: "Supported by the Seoul 50 Plus Foundation",
  },
  "foot.top": { ko: "↑ 처음으로", en: "↑ Back to top" },
  "foot.showPopup": {
    ko: "공지 팝업 다시 보기",
    en: "Show the notice popup again",
  },
};

export function translator(locale: Locale) {
  return (key: keyof typeof DICT | string): string => {
    const entry = DICT[key];
    if (!entry) return key; // 누락된 키는 눈에 띄게 그대로 노출한다
    return entry[locale] || entry.ko;
  };
}
