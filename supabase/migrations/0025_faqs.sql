-- ============================================================================
-- 0025_faqs.sql — FAQ를 코드에서 DB로 (부채 D5 해소)
--
-- 배경: faqs 테이블은 0000 베이스라인부터 있었는데 한 번도 안 쓰였다.
--       FAQ 4문항이 app/faq/page.tsx에 배열로 박혀 있어서, 문항 하나 고치려면
--       개발자가 배포를 해야 했다. 운영자가 직접 못 고치는 콘텐츠는
--       "셀프 운영"(G3)이라는 목표에 어긋난다.
--
-- 0000의 faqs에는 영문 컬럼이 없다. i18n 규칙(v1.3)에 맞춰 _en을 붙인다.
--
-- 참조: docs/PLAN.md 부채 D5, docs/PLATFORM.md §9
-- ============================================================================

alter table public.faqs
  add column if not exists question_en text not null default '',
  add column if not exists answer_en   text not null default '',
  -- 시니어 지원자용 / 체험 손님용 질문이 섞이면 둘 다 못 찾는다.
  add column if not exists audience    text not null default 'senior',
  add column if not exists updated_at  timestamptz not null default now();

alter table public.faqs drop constraint if exists faqs_audience_ok;
alter table public.faqs add  constraint faqs_audience_ok
  check (audience in ('senior','guest','all'));

drop trigger if exists trg_faqs_updated on public.faqs;
create trigger trg_faqs_updated
  before update on public.faqs
  for each row execute function public.touch_updated_at();

create index if not exists idx_faqs_listing
  on public.faqs (is_published, audience, sort);

-- ── 기존 하드코딩 4문항 이관 ────────────────────────────────────────────────
-- 값은 app/faq/page.tsx의 FAQS 배열 그대로다. 옮기는 것이지 새로 쓰는 게 아니다.
insert into public.faqs (question, answer, question_en, answer_en, audience, sort, is_published)
values
  ('영어를 못 해도 지원할 수 있나요?',
   '네, 지원하실 수 있어요. 분야에 따라 영어가 거의 필요 없고(손기술·동네 산책 등), 필요한 자리엔 통역과 젊은 팀원이 함께합니다.',
   'Can I apply if I do not speak English?',
   'Yes. Many activities barely need English (crafts, neighbourhood walks), and where it helps, an interpreter and a younger team member join you.',
   'senior', 10, true),

  ('정말 급여를 받나요?',
   '네. 무급 봉사가 아니라 시급 2만 원 수준(안)의 실제 일자리입니다. 식재료비·교통비 등 실비와 교육·보험도 지원합니다.',
   'Is this actually paid?',
   'Yes. This is real work at around ₩20,000 per hour — not volunteering. Ingredients, travel costs, training and insurance are covered.',
   'senior', 20, true),

  ('스마트폰이 서툴러도 되나요?',
   '괜찮습니다. 휴대폰으로 5분이면 신청되고, 어려우면 신청서를 내려받아 작성 후 사진을 보내거나 전화로 도와드립니다.',
   'What if I am not comfortable with smartphones?',
   'That is fine. The online form takes five minutes, and you can instead print the form, photograph it and email it — or call us and we will help.',
   'senior', 30, true),

  ('어디에서 활동하나요?',
   '망원시장(마포)을 중심으로 시작합니다. 마포·서대문·은평·영등포 등 인근 거주 시 우대하며, 그 외 지역도 지원하실 수 있어요.',
   'Where does this take place?',
   'We are starting around Mangwon Market in Mapo. Living nearby (Mapo, Seodaemun, Eunpyeong, Yeongdeungpo) helps, but anyone in Seoul may apply.',
   'senior', 40, true)
on conflict do nothing;

-- ── 손님용 질문 신설 ────────────────────────────────────────────────────────
-- 자체 예약을 켜면서 실제로 받게 될 질문들이다. 예약 화면에서 답을 못 찾으면
-- 전화가 오고, 그 전화를 받는 건 운영자 한 사람이다.
insert into public.faqs (question, answer, question_en, answer_en, audience, sort, is_published)
values
  ('예약하면 바로 확정되나요?',
   '아닙니다. 신청을 받은 뒤 24시간 안에 확정 여부를 알려드립니다. 확정 안내를 받으신 때에 자리가 확보됩니다.',
   'Is my booking confirmed straight away?',
   'Not quite. We reply within 24 hours to confirm. Your place is held from the moment you receive that confirmation.',
   'guest', 10, true),

  ('취소는 어떻게 하나요?',
   '예약 안내 메일에 담긴 링크로 직접 취소하실 수 있습니다. 체험이 시작되기 전까지는 언제든 취소하실 수 있고 위약금은 없습니다. 다만 자리가 한정돼 있으니 빠를수록 좋습니다.',
   'How do I cancel?',
   'Use the link in your booking email. You can cancel any time before the experience starts, with no penalty. Places are limited, so the earlier the better.',
   'guest', 20, true),

  ('참가비는 어떻게 내나요?',
   '지금은 온라인 결제를 받지 않습니다. 확정 안내에 적힌 방법(계좌 이체 또는 현장 결제)으로 내시면 됩니다.',
   'How do I pay?',
   'We do not take online payments yet. Pay by the method given in your confirmation — bank transfer or on the day.',
   'guest', 30, true),

  ('한국어를 못 해도 참여할 수 있나요?',
   '네. 쿠킹클래스와 하이킹은 영어로 진행하거나 통역이 함께합니다. 체험별 안내 화면의 ‘진행 언어’를 확인해 주세요.',
   'Can I join if I do not speak Korean?',
   'Yes. Our cooking class and hike run in English or with an interpreter. Check the “Language” line on each experience page.',
   'guest', 40, true),

  ('알레르기가 있는데 괜찮을까요?',
   '예약하실 때 요청사항 칸에 미리 적어 주세요. 재료를 바꾸거나 다른 방법을 안내해 드립니다. 안전과 직결되는 부분이라 꼭 알려 주셔야 합니다.',
   'I have an allergy — is that a problem?',
   'Please write it in the requests box when you book. We will change ingredients or suggest an alternative. This matters for your safety, so do tell us.',
   'guest', 50, true)
on conflict do nothing;
