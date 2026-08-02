-- ============================================================================
-- 0016_i18n.sql — 한/영 전환 (v1.3)
--
-- 배경: EN 버튼이 '영문 전용 페이지로 이동'이었다. 지금 보는 페이지를 영어로
--       바꾸고 다시 한국어로 돌아오는 토글이어야 한다.
--
-- 화면 문구(메뉴·제목·버튼)는 코드 사전으로 처리하고, 운영자가 쓰는 콘텐츠만
-- _en 컬럼을 둔다. 비어 있으면 한국어를 그대로 보여준다 — 영문을 채우지 않아도
-- 사이트가 깨지지 않고, 채우는 만큼 영어가 된다.
-- ============================================================================

-- 신청 폼
alter table public.forms add column if not exists title_en       text not null default '';
alter table public.forms add column if not exists subtitle_en    text not null default '';
alter table public.forms add column if not exists description_en text not null default '';
alter table public.forms add column if not exists cta_label_en   text not null default '';
alter table public.forms add column if not exists closed_note_en text not null default '';

-- 팝업
alter table public.popups add column if not exists title_en     text not null default '';
alter table public.popups add column if not exists subtitle_en  text not null default '';
alter table public.popups add column if not exists body_en      text not null default '';
alter table public.popups add column if not exists cta_label_en text not null default '';

-- 인물
alter table public.people add column if not exists role_en    text not null default '';
alter table public.people add column if not exists region_en  text not null default '';
alter table public.people add column if not exists tagline_en text not null default '';
alter table public.people add column if not exists bio_en     text not null default '';
alter table public.people add column if not exists quote_en   text not null default '';

-- 지금 들어 있는 두 폼의 영문을 채워 둔다(포스터가 이미 영문이라 그대로 옮긴다).
update public.forms set
  title_en = 'Oneday Cooking Class',
  subtitle_en = 'Tongin Market · Tue 18 Aug, 15:00',
  description_en = 'Shop at Tongin Market with a real Korean imo, then cook Hanwoo beef bulgogi in a home kitchen. ₩135,000 → ₩30,000. Only 5 seats.',
  cta_label_en = 'Book the cooking class',
  closed_note_en = 'Bookings for this class are closed.'
where key = 'cooking';

update public.forms set
  title_en = 'Become a Seoul Imo·Samchon',
  subtitle_en = 'Age 60+ · ₩20,000/hour · until 30 Aug',
  description_en = 'We are looking for Seoul residents in their sixties to host international travellers. Cooking is not required.',
  cta_label_en = 'Apply as a host',
  closed_note_en = 'This recruitment round is closed.'
where key = 'senior';

update public.forms set
  title_en = 'Neighbourhood Hiking',
  subtitle_en = 'Track 2 · Local walks',
  description_en = 'Walk the streets that are not in any guidebook, with someone who has walked them for thirty years.',
  cta_label_en = 'Book the hike',
  closed_note_en = 'Bookings open soon.'
where key = 'hiking';

update public.popups set
  title_en = 'Become a Seoul Imo·Samchon',
  subtitle_en = '22 Jul – 30 Aug 2026',
  body_en = 'Open to Seoul residents aged 60+. ₩20,000 per hour, with interpretation and on-site support.',
  cta_label_en = 'Apply as a host'
where form_key = 'senior';

update public.popups set
  title_en = 'Oneday Cooking Class',
  subtitle_en = 'Tongin Market · Tue 18 Aug, 15:00',
  body_en = '₩135,000 → ₩30,000. Only 5 seats. Cook and eat your own Hanwoo beef bulgogi.',
  cta_label_en = 'Book the cooking class'
where form_key = 'cooking';
