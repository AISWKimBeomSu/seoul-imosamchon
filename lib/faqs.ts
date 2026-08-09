/**
 * FAQ. 서버·클라이언트 공용 순수 로직만 둔다.
 *
 * 0000 베이스라인부터 있던 faqs 테이블이 한 번도 안 쓰이고 코드에 배열로
 * 박혀 있었다(부채 D5). 문항 하나 고치려고 배포를 해야 하는 콘텐츠는
 * "비개발자가 직접 운영한다"(G3)는 목표와 정면으로 어긋난다.
 */

export type FaqAudience = "senior" | "guest" | "all";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  question_en: string;
  answer_en: string;
  audience: FaqAudience;
  sort: number;
};

export type AdminFaq = Faq & { is_published: boolean };

export const FAQ_PUBLIC_COLS =
  "id, question, answer, question_en, answer_en, audience, sort";

export const FAQ_ADMIN_COLS = `${FAQ_PUBLIC_COLS}, is_published`;

/**
 * 대상별 묶음.
 *
 * 시니어 지원자와 체험 손님은 궁금한 게 전혀 다르다. 한 목록에 섞으면
 * 둘 다 자기 질문을 못 찾는다. 'all'은 양쪽에 다 붙는다.
 */
export function groupByAudience(faqs: Faq[]): {
  senior: Faq[];
  guest: Faq[];
} {
  const bySort = (a: Faq, b: Faq) => a.sort - b.sort;
  return {
    senior: faqs.filter((f) => f.audience !== "guest").sort(bySort),
    guest: faqs.filter((f) => f.audience !== "senior").sort(bySort),
  };
}

export const AUDIENCE_LABEL: Record<FaqAudience, string> = {
  senior: "시니어 지원자",
  guest: "체험 손님",
  all: "공통",
};
