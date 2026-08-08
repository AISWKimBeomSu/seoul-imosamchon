/**
 * 개인정보처리방침 본문.
 *
 * 왜 i18n.ts가 아니라 여기인가 — DICT는 화면 UI 문구용이고, 이 문서는
 * 법정 기재사항을 갖춘 한 덩어리의 글이다. DICT에 섞으면 UI 키를 찾을 수
 * 없어진다. 대신 같은 ko/en 병기 규칙은 그대로 따른다(lib/i18n.ts의 pick).
 *
 * ⚠ 여기 적힌 내용은 실제 처리 현황과 일치해야 한다. 수집 항목·수탁사·
 * 보유 기간을 바꾸는 변경(새 폼 추가, 분석 도구 도입, 로그 적재 등)을
 * 하면 이 파일도 같은 커밋에서 고친다. 안 고치면 방침이 곧 허위 고지다.
 *
 * 근거: 개인정보보호법 §30(처리방침 수립·공개), §31(보호책임자),
 *       §28-8(국외 이전).
 */

export type Bi = { ko: string; en: string };

export type Block =
  | { kind: "p"; text: Bi }
  | { kind: "ul"; items: Bi[] }
  | { kind: "note"; text: Bi }
  | { kind: "table"; head: Bi[]; rows: Bi[][] };

export type Section = { id: string; title: Bi; blocks: Block[] };

/** 시행일. 내용을 고치면 이 날짜도 같이 올린다. */
export const POLICY_EFFECTIVE_DATE = "2026-08-08";

export const POLICY_EFFECTIVE_LABEL: Bi = {
  ko: "2026년 8월 8일",
  en: "8 August 2026",
};

/** 직전 판. §11 변경 이력에 쓴다. */
export const POLICY_PREVIOUS_LABEL: Bi = {
  ko: "2026년 8월 3일",
  en: "3 August 2026",
};

export type PolicyContacts = {
  /** 개인정보 보호책임자 성명 */
  officerName: string;
  /** 보호책임자 연락 이메일 */
  officerEmail: string;
  /** 열람·정정·삭제 청구 접수 이메일(운영 담당) */
  requestEmail: string;
  /** 전화 안전망. 없으면 표시하지 않는다 */
  phone: string | null;
};

export function buildPolicy(c: PolicyContacts): Section[] {
  return [
    {
      id: "purpose",
      title: { ko: "1. 개인정보의 처리 목적", en: "1. Why we process personal data" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "서울이모삼촌은 아래 목적으로만 개인정보를 처리합니다. 목적이 바뀌면 미리 알리고 동의를 다시 받습니다.",
            en: "Seoul Imo·Samchon processes personal data only for the purposes below. If a purpose changes, we will tell you in advance and ask for consent again.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "시니어 호스트 모집 — 지원 접수, 선발, 결과 연락",
              en: "Senior host recruitment — receiving applications, selection, and contacting applicants",
            },
            {
              ko: "체험 클래스 예약 — 예약 접수, 일정 안내, 당일 연락",
              en: "Class bookings — taking reservations, sending schedule details, and contacting you on the day",
            },
            {
              ko: "호스트 소개 게시 — 본인이 사전 동의한 범위에서 웹사이트에 소개를 싣는 것",
              en: "Host profiles — publishing a host's introduction on this site, within the scope they consented to in advance",
            },
            {
              ko: "문의 응대 — 이메일·전화로 주신 질문에 답하는 것",
              en: "Enquiries — answering questions you send by email or phone",
            },
            {
              ko: "이용 통계 — 어떤 안내가 도움이 되었는지 확인하는 것(개인을 식별하지 않는 형태)",
              en: "Usage statistics — understanding which pages help people, in a form that does not identify anyone",
            },
          ],
        },
      ],
    },

    {
      id: "items",
      title: {
        ko: "2. 처리하는 개인정보 항목과 보유 기간",
        en: "2. What we collect, and how long we keep it",
      },
      blocks: [
        {
          kind: "table",
          head: [
            { ko: "구분", en: "Context" },
            { ko: "항목", en: "Data collected" },
            { ko: "수집 방법", en: "How it reaches us" },
            { ko: "보유 기간", en: "Retention" },
          ],
          rows: [
            [
              { ko: "시니어 호스트 지원", en: "Senior host application" },
              {
                ko: "성명, 연락처, 이메일, 거주 지역, 지원서에 적어 주신 내용",
                en: "Name, phone number, email, area of residence, and whatever you write on the form",
              },
              {
                ko: "Google Forms 신청, 또는 종이 신청서를 촬영해 보내신 이메일",
                en: "A Google Form, or an email with a photo of a paper application",
              },
              {
                ko: "모집·선발 절차가 끝난 뒤 6개월 이내 파기",
                en: "Deleted within 6 months of the recruitment round closing",
              },
            ],
            [
              { ko: "체험 클래스 예약", en: "Class booking" },
              {
                ko: "성명, 연락처, 이메일, 참여 인원, 예약한 회차, 미리 알려주신 요청사항(알레르기 등)",
                en: "Name, phone number, email, number of guests, the session you booked, and anything you tell us in advance (allergies and so on)",
              },
              {
                ko: "이 사이트의 예약 화면. 전화로 신청하신 경우에는 저희가 대신 입력합니다. 체험에 따라 Google Forms를 쓰기도 합니다",
                en: "The booking form on this site. If you book by phone we enter it for you. Some experiences still use a Google Form",
              },
              {
                ko: "체험이 끝난 뒤 6개월 이내 파기",
                en: "Deleted within 6 months of the experience taking place",
              },
            ],
            [
              { ko: "호스트 소개 게시", en: "Published host profile" },
              {
                ko: "성명 또는 활동명, 사진, 활동 지역, 소개글",
                en: "Name or working name, photograph, area, and introduction text",
              },
              {
                ko: "본인이 제공. 공개 게시 동의를 확인한 뒤에만 게시합니다",
                en: "Provided by the host, and published only after their consent is recorded",
              },
              {
                ko: "게시 철회를 요청하시거나 활동이 끝나면 즉시 삭제",
                en: "Deleted as soon as the host asks us to take it down, or when they stop hosting",
              },
            ],
            [
              { ko: "문의", en: "Enquiries" },
              { ko: "이메일 주소, 문의 내용", en: "Email address and the contents of your message" },
              { ko: "이메일", en: "Email" },
              {
                ko: "응대가 끝난 뒤 1년 이내 파기",
                en: "Deleted within 1 year of the enquiry being answered",
              },
            ],
          ],
        },
        {
          kind: "note",
          text: {
            ko: "서울이모삼촌은 회원가입 절차를 두지 않으며, 주민등록번호를 수집하지 않습니다. 사상·신념, 건강, 정치적 견해와 같은 민감정보도 수집하지 않습니다. 만 14세 미만 아동의 개인정보는 수집하지 않습니다.",
            en: "There is no account sign-up on this site, and we never collect resident registration numbers. We do not collect sensitive data such as beliefs, health, or political opinions, and we do not collect data from children under 14.",
          },
        },
      ],
    },

    {
      id: "third-party",
      title: { ko: "3. 개인정보의 제3자 제공", en: "3. Sharing with third parties" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "서울이모삼촌은 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 특별한 규정이 있거나 수사기관이 법이 정한 절차와 방법에 따라 요구하는 경우에는 그 범위에서 제공할 수 있습니다.",
            en: "We do not share your personal data with third parties. The only exception is where a law specifically requires it, or where an investigative authority requests it through the procedure the law prescribes.",
          },
        },
        {
          kind: "p",
          text: {
            ko: "다음 항목의 위탁(우리 대신 저장·처리하는 것)은 제3자 제공과 다릅니다. 아래에 따로 밝힙니다.",
            en: "Processing carried out on our behalf by service providers is a different matter, and is set out below.",
          },
        },
      ],
    },

    {
      id: "processors",
      title: {
        ko: "4. 처리 위탁과 국외 이전",
        en: "4. Service providers and transfers abroad",
      },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "서비스를 운영하기 위해 아래 사업자에게 개인정보 처리를 위탁하고 있습니다.",
            en: "We rely on the following providers to run the service.",
          },
        },
        {
          kind: "table",
          head: [
            { ko: "수탁자", en: "Provider" },
            { ko: "위탁하는 일", en: "What they do for us" },
            { ko: "개인정보가 저장되는 곳", en: "Where the data is stored" },
          ],
          rows: [
            [
              { ko: "Google LLC (미국)", en: "Google LLC (United States)" },
              {
                ko: "Google Forms 신청서 접수, 접수 이메일(Gmail) 수신·보관",
                en: "Receiving applications through Google Forms, and receiving and storing our incoming email (Gmail)",
              },
              {
                ko: "미국 등 Google이 운영하는 데이터센터 — 국외 이전에 해당합니다",
                en: "Google data centres in the United States and elsewhere — this is a transfer abroad",
              },
            ],
            [
              { ko: "Supabase Inc. (미국)", en: "Supabase Inc. (United States)" },
              {
                ko: "예약 정보(성명·연락처·이메일·인원·요청사항), 호스트 소개 정보와 사진의 데이터베이스·파일 저장",
                en: "Database and file storage for bookings (name, phone, email, party size, requests) and for host profiles and photographs",
              },
              {
                ko: "대한민국(서울 리전) — 국외 이전이 아닙니다",
                en: "Republic of Korea (Seoul region) — not a transfer abroad",
              },
            ],
            [
              { ko: "Vercel Inc. (미국)", en: "Vercel Inc. (United States)" },
              {
                ko: "웹사이트 호스팅, 쿠키를 쓰지 않는 방문 통계",
                en: "Website hosting, and cookieless visit statistics",
              },
              {
                ko: "미국 등 Vercel이 운영하는 서버 — 국외 이전에 해당합니다",
                en: "Vercel servers in the United States and elsewhere — this is a transfer abroad",
              },
            ],
          ],
        },
        {
          kind: "ul",
          items: [
            {
              ko: "이전되는 항목 — 위 2항의 항목 가운데 해당 업무에 필요한 범위",
              en: "What is transferred — only the items in section 2 that the task actually needs",
            },
            {
              ko: "이전 목적 — 신청 접수, 자료 보관, 웹사이트 제공",
              en: "Why — to receive applications, store records, and serve this website",
            },
            {
              ko: "보유 기간 — 위 2항의 보유 기간과 같으며, 위탁이 끝나면 지체 없이 파기하도록 합니다",
              en: "How long — the same periods as in section 2; when a contract ends we require prompt deletion",
            },
            {
              // 이제 자체 예약 화면이 있으므로 '대안이 없다'는 전제가 사라졌다.
              // 국외 이전을 원치 않으시면 실제로 피할 길이 있다는 걸 적는다.
              ko: `거부 방법 — 국외 이전을 원하지 않으시면 ${c.officerEmail} 로 알려 주십시오. 체험 예약은 이 사이트의 예약 화면이나 전화로 접수해 드릴 수 있고, 그 경우 Google을 거치지 않습니다. 시니어 호스트 지원은 종이 신청서로 대신하실 수 있습니다.`,
              en: `How to refuse — write to ${c.officerEmail}. Bookings can be taken on this site or over the phone, which does not involve Google at all. Host applications can be made on paper instead.`,
            },
          ],
        },
      ],
    },

    {
      id: "auto",
      title: {
        ko: "5. 자동으로 수집되는 정보와 쿠키",
        en: "5. Information collected automatically, and cookies",
      },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "신청 버튼이 얼마나 눌리는지 세기 위해 아래 정보를 남깁니다. 개인을 식별할 수 있는 정보는 남기지 않습니다.",
            en: "To count how often the apply buttons are used, we record the following. None of it identifies a person.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "눌린 신청 링크의 종류(시니어 호스트 / 클래스 등)",
              en: "Which apply link was used (host application, class booking, and so on)",
            },
            {
              ko: "사이트 안에서 어느 위치의 버튼을 눌렀는지",
              en: "Which place on the site the button was pressed from",
            },
            {
              ko: "찾아오신 사이트의 주소(도메인)만 — 예: instagram.com. 어떤 게시물·검색어였는지는 저장하지 않습니다",
              en: "The domain you arrived from — e.g. instagram.com. We do not store which post or search term",
            },
            {
              ko: "기기 구분(휴대전화 / 데스크톱 / 자동 프로그램)과 누른 시각",
              en: "Device type (mobile, desktop, or automated program) and the time",
            },
          ],
        },
        {
          kind: "note",
          text: {
            ko: "IP 주소, 쿠키, 광고 식별자, 사용자 식별자는 수집하지도 저장하지도 않습니다. 그래서 이 기록만으로는 누가 눌렀는지 알 수 없습니다. 방문 통계 역시 쿠키를 쓰지 않는 집계 방식입니다.",
            en: "We do not collect or store IP addresses, cookies, advertising identifiers, or user identifiers. These records therefore cannot tell us who pressed anything. Our visit statistics are likewise cookieless.",
          },
        },
        {
          kind: "p",
          text: {
            ko: "사이트가 브라우저에 남기는 것은 아래 두 가지뿐이며, 광고나 추적 목적의 쿠키는 사용하지 않습니다.",
            en: "The site stores only the two items below in your browser. We use no advertising or tracking cookies.",
          },
        },
        {
          kind: "table",
          head: [
            { ko: "이름", en: "Name" },
            { ko: "쓰임", en: "Purpose" },
            { ko: "지우는 방법", en: "How to remove it" },
          ],
          rows: [
            [
              { ko: "lang (쿠키)", en: "lang (cookie)" },
              {
                ko: "고르신 화면 언어(한국어 / English)를 기억합니다",
                en: "Remembers the display language you chose (Korean or English)",
              },
              {
                ko: "브라우저 설정에서 쿠키를 삭제·차단하시면 됩니다. 차단하셔도 이용에 지장은 없고, 매번 한국어로 열립니다",
                en: "Delete or block cookies in your browser settings. Blocking it causes no problems; the site simply opens in Korean each time",
              },
            ],
            [
              { ko: "imo:popup:… (브라우저 저장소)", en: "imo:popup:… (browser storage)" },
              {
                ko: "공지 팝업의 '다시 보지 않기'를 누르셨는지 기억합니다. 이 값은 서버로 전송되지 않고 브라우저에만 남습니다",
                en: "Remembers whether you dismissed a notice popup. This value stays in your browser and is never sent to our server",
              },
              {
                ko: "페이지 맨 아래 '공지 팝업 다시 보기'를 누르시면 지워집니다",
                en: "Press “Show the notice popup again” at the bottom of any page",
              },
            ],
          ],
        },
      ],
    },

    {
      id: "destroy",
      title: { ko: "6. 개인정보의 파기", en: "6. How we destroy personal data" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "보유 기간이 지났거나 처리 목적을 이루었으면 지체 없이 파기합니다.",
            en: "Once the retention period passes or the purpose is met, we destroy the data without delay.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "전자 파일 — 복구할 수 없는 방법으로 영구 삭제합니다. 데이터베이스의 기록과 저장된 사진 파일을 반드시 함께 지웁니다(둘 중 하나만 지워 사진이 남는 일이 없도록 합니다).",
              en: "Electronic records — permanently erased so they cannot be recovered. The database row and the stored image file are always deleted together, so no orphaned photograph is left behind.",
            },
            {
              ko: "종이 문서 — 출력된 신청서는 분쇄하거나 소각합니다.",
              en: "Paper documents — printed applications are shredded or incinerated.",
            },
          ],
        },
      ],
    },

    {
      id: "rights",
      title: {
        ko: "7. 정보주체의 권리와 행사 방법",
        en: "7. Your rights, and how to use them",
      },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "언제든지 아래를 요구하실 수 있습니다. 법정대리인이나 위임받은 분이 대신 요구하셔도 됩니다.",
            en: "You may make any of the following requests at any time. A legal representative or an authorised person may do so on your behalf.",
          },
        },
        {
          kind: "ul",
          items: [
            { ko: "내 개인정보를 보여 달라(열람)", en: "Ask to see the personal data we hold about you" },
            { ko: "틀린 내용을 고쳐 달라(정정)", en: "Ask us to correct anything that is wrong" },
            { ko: "지워 달라(삭제)", en: "Ask us to delete it" },
            { ko: "더 이상 쓰지 말라(처리정지) 또는 동의를 철회한다", en: "Ask us to stop processing it, or withdraw your consent" },
          ],
        },
        {
          kind: "p",
          text: {
            ko: `요청은 ${c.requestEmail} 로 보내 주시면 지체 없이 처리하고 결과를 알려 드립니다.${
              c.phone ? ` 이메일이 어려우시면 ${c.phone} 로 전화 주셔도 됩니다.` : ""
            }`,
            en: `Send your request to ${c.requestEmail} and we will act on it without delay and tell you the outcome.${
              c.phone ? ` If email is difficult, you can call ${c.phone}.` : ""
            }`,
          },
        },
        {
          kind: "note",
          text: {
            ko: "웹사이트에 실린 호스트 소개는 특히 간단합니다. 내려 달라고 말씀만 주시면 이유를 묻지 않고 바로 내리고, 사진 파일까지 함께 지웁니다.",
            en: "Taking down a published host profile is deliberately simple: just say the word. We remove it immediately, without asking why, and delete the photograph with it.",
          },
        },
      ],
    },

    {
      id: "security",
      title: {
        ko: "8. 개인정보의 안전성 확보조치",
        en: "8. How we keep personal data safe",
      },
      blocks: [
        {
          kind: "ul",
          items: [
            {
              ko: "취급자 최소화 — 접수 이메일과 관리자 계정에 접근할 수 있는 사람을 운영팀 안에서 지정된 인원으로 제한합니다.",
              en: "Fewest possible handlers — access to the application inbox and the admin account is limited to named members of the operating team.",
            },
            {
              ko: "접근 통제 — 관리자 페이지는 로그인 인증과 허용 계정 목록으로 막고, 데이터베이스에도 별도의 접근 정책(RLS)을 두어 이중으로 차단합니다.",
              en: "Access control — the admin pages require login and are limited to an allow-list of accounts, and the database enforces its own row-level access policies as a second barrier.",
            },
            {
              ko: "전송 구간 암호화 — 모든 페이지와 파일이 HTTPS로 오갑니다.",
              en: "Encryption in transit — every page and file is served over HTTPS.",
            },
            {
              ko: "관리 키 격리 — 데이터베이스 관리 권한 키는 서버에서만 쓰이며 브라우저로 내려보내지 않습니다.",
              en: "Key isolation — the database service key is used only on the server and is never sent to a browser.",
            },
            {
              ko: "업로드 제한 — 사진·문서는 허용된 확장자와 용량으로만 올릴 수 있습니다.",
              en: "Upload restrictions — photographs and documents may only be uploaded in permitted formats and sizes.",
            },
          ],
        },
      ],
    },

    {
      id: "officer",
      title: { ko: "9. 개인정보 보호책임자", en: "9. Data protection officer" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "개인정보 처리에 관한 업무를 총괄하고, 관련 불만과 피해 구제를 처리할 책임자를 아래와 같이 지정하고 있습니다.",
            en: "The person below is responsible for how personal data is handled here, and for dealing with related complaints and remedies.",
          },
        },
        {
          kind: "table",
          head: [
            { ko: "구분", en: "Role" },
            { ko: "내용", en: "Details" },
          ],
          rows: [
            [
              { ko: "개인정보 보호책임자", en: "Data protection officer" },
              {
                ko: `${c.officerName} · 팀 theOne 대표 · ${c.officerEmail}`,
                en: `${c.officerName}, representative of Team theOne — ${c.officerEmail}`,
              },
            ],
            [
              {
                ko: "열람·정정·삭제·처리정지 청구 접수",
                en: "Requests to access, correct, delete, or stop processing",
              },
              {
                ko: `서울이모삼촌 운영 담당 · ${c.requestEmail}${c.phone ? ` · ${c.phone}` : ""}`,
                en: `Seoul Imo·Samchon operations — ${c.requestEmail}${c.phone ? ` · ${c.phone}` : ""}`,
              },
            ],
            [
              { ko: "운영 주체", en: "Operated by" },
              {
                ko: "팀 theOne (서울이모삼촌 운영팀)",
                en: "Team theOne (the Seoul Imo·Samchon operating team)",
              },
            ],
          ],
        },
      ],
    },

    {
      id: "remedy",
      title: {
        ko: "10. 권익침해 구제 방법",
        en: "10. Where to complain if something goes wrong",
      },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "저희에게 먼저 말씀해 주시면 성실히 답하겠습니다. 그래도 해결되지 않으면 아래 기관에 상담·분쟁조정을 신청하실 수 있습니다.",
            en: "Please tell us first and we will answer in good faith. If that does not resolve it, you can turn to the bodies below.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "개인정보분쟁조정위원회 — 국번 없이 1833-6972 (www.kopico.go.kr)",
              en: "Personal Information Dispute Mediation Committee — 1833-6972 (www.kopico.go.kr)",
            },
            {
              ko: "개인정보침해신고센터 — 국번 없이 118 (privacy.kisa.or.kr)",
              en: "Privacy Infringement Report Centre — 118 (privacy.kisa.or.kr)",
            },
            {
              ko: "대검찰청 사이버수사과 — 국번 없이 1301 (www.spo.go.kr)",
              en: "Supreme Prosecutors' Office, Cybercrime Division — 1301 (www.spo.go.kr)",
            },
            {
              ko: "경찰청 사이버수사국 — 국번 없이 182 (ecrm.police.go.kr)",
              en: "National Police Agency, Cyber Bureau — 182 (ecrm.police.go.kr)",
            },
          ],
        },
      ],
    },

    {
      id: "changes",
      title: { ko: "11. 방침의 변경", en: "11. Changes to this policy" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "이 개인정보처리방침은 문서 첫머리에 적힌 시행일부터 적용됩니다. 내용을 더하거나 고치는 경우, 바뀌는 내용과 시행일을 시행 7일 전부터 공지사항에 올려 알려 드립니다.",
            en: "This policy applies from the effective date shown at the top of this page. If we add or change anything, we will post what is changing and when, in our notices section, at least seven days beforehand.",
          },
        },
        {
          kind: "p",
          text: {
            ko: "다만 이미 하고 있는 처리를 사실대로 적기 위한 정정은 바로 반영합니다. 틀린 설명을 7일 더 두는 것보다 고치는 편이 낫기 때문입니다. 그런 정정은 아래 이력에 남깁니다.",
            en: "One exception: when a change simply corrects a description to match what we already do, we apply it at once. Leaving an inaccurate statement up for another week helps no one. Such corrections are listed below.",
          },
        },
        {
          kind: "table",
          head: [
            { ko: "시행일", en: "Effective" },
            { ko: "바뀐 내용", en: "What changed" },
          ],
          rows: [
            [
              { ko: pick("ko", POLICY_EFFECTIVE_LABEL), en: pick("en", POLICY_EFFECTIVE_LABEL) },
              {
                ko: "체험 예약을 이 사이트에서 직접 받기 시작하면서, 수집 방법(‘Google Forms’ → ‘이 사이트의 예약 화면’)과 수집 항목(예약 회차·요청사항 추가)을 실제와 맞췄습니다. Supabase 위탁 범위에 예약 정보 저장을 명시했고, 국외 이전 거부 시의 대안을 실제로 가능한 방법으로 고쳤습니다.",
                en: "We began taking bookings directly on this site, so we corrected how data reaches us (‘a Google Form’ → ‘the booking form on this site’) and what we collect (the session booked, and any requests). We also stated that Supabase stores booking data, and updated how to opt out of transfers abroad now that a real alternative exists.",
              },
            ],
            [
              { ko: pick("ko", POLICY_PREVIOUS_LABEL), en: pick("en", POLICY_PREVIOUS_LABEL) },
              { ko: "최초 시행", en: "First version" },
            ],
          ],
        },
      ],
    },
  ];
}

/** 이력 표에서 Bi를 한쪽 언어로 꺼내는 작은 도구. */
function pick(locale: "ko" | "en", bi: Bi): string {
  return locale === "en" ? bi.en : bi.ko;
}
