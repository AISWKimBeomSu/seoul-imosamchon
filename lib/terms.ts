/**
 * 이용약관 + 취소·환불 규정 본문.
 *
 * 왜 별도 파일인가 — lib/privacy.ts와 같은 이유다. 법정 기재사항을 갖춘 한
 * 덩어리의 글이라 DICT(화면 UI 문구)에 섞으면 둘 다 못 쓰게 된다. 블록 타입은
 * privacy.ts 것을 그대로 재사용한다(렌더러는 components/LegalDoc.tsx 공용).
 *
 * ⚠ 이 문서는 실제 운영 방식과 일치해야 한다. 참가비 수수 방식·취소 기한·
 *    서비스 범위를 바꾸면 이 파일도 같은 커밋에서 고친다.
 *
 * ⚠ 취소 규정은 코드와 한 몸이다.
 *    아래 §5는 cancel_booking RPC(0021)의 실제 동작과 정확히 같아야 한다.
 *    지금 규칙: **체험 시작 전까지 언제든 취소 가능**. RPC도 starts_at 이전이면
 *    허용하고 이후면 거부한다. 무결제 단계라 '위약금 없는 기한'이라는 개념이
 *    아직 의미가 없어서, 기한을 두지 않는 쪽이 문서와 코드가 어긋나지 않는다.
 *    결제를 붙이는 릴리스에서 FREE_CANCEL_HOURS를 살리고 RPC도 같이 고친다.
 *
 * ⚠ 미확정 (docs/PLATFORM.md §21)
 *    - U7 전화 안전망 번호: 확정되면 site_config.contact_phone에 넣으면 §7에 자동 반영.
 *    - 사업자등록번호·통신판매업 신고번호: PG 도입(부록 B) 시점에 §1에 추가.
 *
 * 근거: 전자상거래법 §13(신원·거래조건 표시), §17(청약철회), 약관규제법 §3(명시·설명).
 */

import type { Bi, Section } from "@/lib/privacy";

/** 시행일. 내용을 고치면 이 날짜도 같이 올린다. */
export const TERMS_EFFECTIVE_DATE = "2026-08-07";

export const TERMS_EFFECTIVE_LABEL: Bi = {
  ko: "2026년 8월 7일",
  en: "7 August 2026",
};

/**
 * 유료화 이후 적용할 무료 취소 기한(시간).
 * 지금은 무결제라 쓰이지 않는다 — 결제를 붙일 때 §5와 cancel_booking RPC를
 * 함께 이 값 기준으로 고친다.
 */
export const FREE_CANCEL_HOURS = 48;

export type TermsContacts = {
  /** 운영 주체 상호 */
  operatorName: string;
  /** 대표자 성명 */
  repName: string;
  /** 문의·접수 이메일 */
  contactEmail: string;
  /** 전화 안전망. 없으면 표시하지 않는다 */
  phone: string | null;
};

export function buildTerms(c: TermsContacts): Section[] {
  return [
    {
      id: "operator",
      title: { ko: "1. 운영 주체", en: "1. Who operates this service" },
      blocks: [
        {
          kind: "table",
          head: [
            { ko: "항목", en: "Item" },
            { ko: "내용", en: "Detail" },
          ],
          rows: [
            [
              { ko: "서비스명", en: "Service" },
              { ko: "서울이모삼촌", en: "Seoul Imo·Samchon" },
            ],
            [
              { ko: "운영 주체", en: "Operator" },
              { ko: c.operatorName, en: c.operatorName },
            ],
            [
              { ko: "대표자", en: "Representative" },
              { ko: c.repName, en: c.repName },
            ],
            [
              { ko: "문의", en: "Contact" },
              { ko: c.contactEmail, en: c.contactEmail },
            ],
          ],
        },
      ],
    },

    {
      id: "purpose",
      title: { ko: "2. 목적과 적용 범위", en: "2. Purpose and scope" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "이 약관은 서울이모삼촌이 제공하는 체험 클래스의 예약·참가 조건을 정합니다. 이 사이트에서 체험을 예약하시면 이 약관에 동의하신 것으로 봅니다.",
            en: "These terms set out the conditions for booking and joining experiences offered by Seoul Imo·Samchon. By booking on this site you agree to them.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "‘체험’ — 시니어 호스트가 진행하는 쿠킹클래스, 하이킹 등 이 사이트에 게시된 프로그램을 말합니다.",
              en: "“Experience” means a programme listed on this site and led by a senior host, such as a cooking class or a hike.",
            },
            {
              ko: "‘회차’ — 특정 날짜·시각에 진행되는 체험 한 건을 말합니다. 회차마다 정원이 있습니다.",
              en: "“Session” means one running of an experience at a specific date and time. Each session has a capacity.",
            },
            {
              ko: "‘예약자’ — 이 사이트에서 회차를 신청한 분을 말합니다. 회원 가입은 필요하지 않습니다.",
              en: "“Guest” means a person who requests a session on this site. No account registration is required.",
            },
          ],
        },
        {
          kind: "note",
          text: {
            ko: "시니어 호스트 모집(참여 신청)은 이 약관이 아니라 별도의 모집 공고 조건을 따릅니다.",
            en: "Recruitment of senior hosts is governed by the terms in each recruitment notice, not by this document.",
          },
        },
      ],
    },

    {
      id: "booking",
      title: { ko: "3. 예약의 성립", en: "3. How a booking becomes final" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "예약은 승인제입니다. 신청만으로는 자리가 확정되지 않고, 저희가 확정 안내를 보내드린 때에 예약이 성립합니다.",
            en: "Bookings are confirmed by us, not automatically. Your request does not hold a place until we send you a confirmation.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "① 신청 — 회차·인원·연락처를 입력해 신청하시면 접수 확인 안내를 보내드립니다.",
              en: "① Request — choose a session, party size and contact details. We send you an acknowledgement.",
            },
            {
              ko: "② 확정 — 신청일로부터 24시간 이내에 확정 여부를 안내합니다. 확정 안내를 받으신 때에 예약이 성립합니다.",
              en: "② Confirmation — we reply within 24 hours. Your booking is final when you receive the confirmation.",
            },
            {
              ko: "③ 미확정 — 정원 초과, 최소 인원 미달, 안전상의 사유 등으로 확정되지 않을 수 있습니다. 이 경우 참가비를 받지 않습니다.",
              en: "③ Not confirmed — we may be unable to confirm (capacity, minimum numbers, safety). In that case no fee is charged.",
            },
          ],
        },
        {
          kind: "p",
          text: {
            ko: "회차의 정원은 시스템이 관리합니다. 남은 자리를 넘는 신청은 접수되지 않습니다.",
            en: "Session capacity is enforced by the system. Requests beyond the remaining places are not accepted.",
          },
        },
      ],
    },

    {
      id: "fee",
      title: { ko: "4. 참가비와 결제", en: "4. Fees and payment" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "참가비는 체험별 안내 화면에 표시된 금액입니다. 현재 이 사이트는 온라인 결제를 받지 않으며, 확정 안내에 적힌 방법(계좌 이체 또는 현장 결제)으로 지불하시면 됩니다.",
            en: "The fee is the amount shown on each experience page. This site does not currently take online payments; you pay by the method given in your confirmation (bank transfer or on the day).",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "표시 금액은 1인 기준이며 원화(KRW)입니다.",
              en: "Prices are per person in Korean won (KRW).",
            },
            {
              ko: "포함·불포함 사항은 체험별 안내 화면에 적혀 있습니다.",
              en: "What is and is not included is listed on each experience page.",
            },
          ],
        },
      ],
    },

    {
      id: "cancel",
      title: {
        ko: "5. 취소·환불 규정",
        en: "5. Cancellations and refunds",
      },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "예약 안내 메일에 담긴 링크로 직접 취소하실 수 있습니다. 체험이 시작되기 전까지는 언제든 취소하실 수 있고, 위약금은 없습니다.",
            en: "You can cancel yourself using the link in your booking email. Cancel any time before the experience starts — there is no penalty.",
          },
        },
        {
          kind: "table",
          head: [
            { ko: "취소 시점", en: "When you cancel" },
            { ko: "처리", en: "What happens" },
          ],
          rows: [
            [
              { ko: "체험 시작 전", en: "Before the start time" },
              {
                ko: "사이트에서 직접 취소. 이미 지불하셨다면 전액 환불",
                en: "Cancel on the site. Full refund if you have already paid",
              },
            ],
            [
              { ko: "체험 시작 이후", en: "After the start time" },
              {
                ko: "화면에서는 취소되지 않습니다. 이메일이나 전화로 연락 주세요",
                en: "The site can no longer cancel it. Please contact us by email or phone",
              },
            ],
            [
              { ko: "연락 없이 불참", en: "No-show" },
              {
                ko: "재료 준비가 이미 끝난 뒤라 환불은 어렵습니다. 못 오시게 되면 미리 취소만 해 주세요",
                en: "Ingredients have already been bought, so we cannot refund. If you can't come, please just cancel in advance",
              },
            ],
          ],
        },
        {
          kind: "note",
          text: {
            ko: "취소는 빠를수록 좋습니다. 정원이 5명 안팎이라, 한 자리가 열리면 기다리시던 다른 분이 오실 수 있습니다.",
            en: "The earlier you cancel the better. Groups are around five people, so one freed place often goes to someone who was waiting.",
          },
        },
        {
          kind: "p",
          text: {
            ko: "저희 사정(호스트 사고, 정원 미달, 기상 악화 등)으로 체험이 취소되면 전액 환불하거나 다른 회차를 안내해 드립니다.",
            en: "If we cancel (host emergency, too few guests, severe weather) we refund in full or offer another session.",
          },
        },
        {
          kind: "note",
          text: {
            ko: "야외 체험은 안전을 우선합니다. 기상 특보 등으로 진행이 어려우면 저희가 먼저 연락드립니다.",
            en: "For outdoor experiences safety comes first. If a weather warning makes it unsafe, we will contact you first.",
          },
        },
      ],
    },

    {
      id: "guest",
      title: { ko: "6. 참가자의 협조 사항", en: "6. What we ask of you" },
      blocks: [
        {
          kind: "ul",
          items: [
            {
              ko: "신청하실 때 정확한 연락처를 적어 주세요. 확정·변경 안내를 보내드릴 유일한 통로입니다.",
              en: "Please give accurate contact details. They are the only way we can send confirmations and changes.",
            },
            {
              ko: "알레르기, 거동이 불편한 점, 도움이 필요한 부분은 요청사항 칸에 미리 적어 주세요. 안전과 직결됩니다.",
              en: "Tell us in advance about allergies, mobility needs or any help you need. This matters for your safety.",
            },
            {
              ko: "체험 시작 시각에 맞춰 만남 장소로 와 주세요. 늦으시면 진행상 참여가 어려울 수 있습니다.",
              en: "Please arrive at the meeting point on time. Late arrivals may not be able to join.",
            },
            {
              ko: "호스트와 다른 참가자를 존중해 주세요. 다른 분의 안전을 해치는 행동이 있으면 참여를 중단시킬 수 있습니다.",
              en: "Please respect your host and other guests. We may end your participation if you put others at risk.",
            },
            {
              ko: "만 14세 미만은 신청하실 수 없습니다. 미성년자는 보호자와 함께 참가해 주세요.",
              en: "Guests under 14 cannot book. Minors must be accompanied by a guardian.",
            },
          ],
        },
      ],
    },

    {
      id: "safety",
      title: { ko: "7. 안전과 책임", en: "7. Safety and liability" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "저희는 체험이 안전하게 진행되도록 준비하지만, 조리·도보 등 신체 활동에는 위험이 따를 수 있습니다. 건강 상태에 걱정되는 부분이 있으면 신청 전에 알려 주세요.",
            en: "We prepare carefully, but cooking and walking involve some physical risk. If you have any health concerns, tell us before booking.",
          },
        },
        {
          kind: "ul",
          items: [
            {
              ko: "참가자 본인의 부주의나 미리 알리지 않은 건강 상태로 생긴 사고에 대해서는 저희가 책임지기 어렵습니다.",
              en: "We cannot take responsibility for incidents caused by a guest's own carelessness or by a health condition not disclosed to us.",
            },
            {
              ko: "천재지변, 감염병, 교통 통제 등 저희가 통제할 수 없는 사유로 체험이 취소된 경우에도 §5에 따라 환불해 드립니다.",
              en: "If an experience is cancelled for reasons beyond our control (natural disaster, epidemic, road closure) we still refund under §5.",
            },
            {
              ko: "소지품은 직접 관리해 주세요.",
              en: "Please look after your own belongings.",
            },
          ],
        },
        c.phone
          ? {
              kind: "p" as const,
              text: {
                ko: `당일 급한 일은 ${c.phone}으로 전화 주세요.`,
                en: `On the day, please call ${c.phone} for anything urgent.`,
              },
            }
          : {
              kind: "p" as const,
              text: {
                ko: `당일 급한 일은 ${c.contactEmail}으로 알려 주세요.`,
                en: `On the day, please contact us at ${c.contactEmail}.`,
              },
            },
      ],
    },

    {
      id: "content",
      title: { ko: "8. 사진과 저작물", en: "8. Photos and content" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "체험 중 촬영한 사진을 홍보에 쓰는 경우에는 미리 따로 동의를 받습니다. 동의하지 않으셔도 참가에는 아무 영향이 없습니다.",
            en: "If we want to use photos from an experience for promotion, we ask for your consent separately. Declining does not affect your participation.",
          },
        },
        {
          kind: "p",
          text: {
            ko: "이 사이트의 글·사진·디자인은 서울이모삼촌과 각 저작권자에게 권리가 있습니다.",
            en: "Text, photographs and design on this site belong to Seoul Imo·Samchon and the respective rights holders.",
          },
        },
      ],
    },

    {
      id: "privacy",
      title: { ko: "9. 개인정보", en: "9. Personal data" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "예약 과정에서 받는 개인정보는 개인정보처리방침에 따라 처리합니다. 어떤 정보를 왜 받고 얼마나 보관하는지는 그 문서에 적혀 있습니다.",
            en: "Personal data collected when you book is handled under our privacy policy, which explains what we collect, why, and for how long.",
          },
        },
      ],
    },

    {
      id: "change",
      title: { ko: "10. 약관의 변경", en: "10. Changes to these terms" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: "이 약관을 바꿀 때는 시행일 7일 전까지 이 페이지에 알립니다. 이미 확정된 예약에는 예약 당시의 약관이 적용됩니다.",
            en: "We post any change on this page at least 7 days before it takes effect. Bookings already confirmed remain under the terms that applied when you booked.",
          },
        },
      ],
    },

    {
      id: "dispute",
      title: { ko: "11. 분쟁 해결", en: "11. If something goes wrong" },
      blocks: [
        {
          kind: "p",
          text: {
            ko: `불편한 점이 있으면 먼저 ${c.contactEmail}으로 알려 주세요. 대화로 풀리지 않는 분쟁은 대한민국 법을 따르며, 관할 법원은 민사소송법에 따릅니다.`,
            en: `Please tell us first at ${c.contactEmail}. Disputes we cannot resolve together are governed by the laws of the Republic of Korea, with jurisdiction as set by the Civil Procedure Act.`,
          },
        },
      ],
    },
  ];
}
