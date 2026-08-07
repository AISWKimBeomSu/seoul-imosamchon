-- ============================================================================
-- 0022_popup_class.sql — 팝업에서 체험 상세로 (v2.0 Phase 3)
--
-- 배경: 팝업의 link_kind가 form|notice|none 셋뿐이라, 포스터를 누르면 구글폼으로
--       바로 나간다. 자체 예약으로 옮기고 나면 팝업이 상세 페이지를 거치게 해야
--       회차를 고르고 예약할 수 있다.
--
-- 'class'는 form_key를 그대로 쓴다(체험 키). 새 컬럼이 필요 없다.
--
-- 참조: docs/PLATFORM.md §11.6, F15-4
-- ============================================================================

alter table public.popups drop constraint if exists popups_link_kind_check;
alter table public.popups add  constraint popups_link_kind_check
  check (link_kind in ('form','notice','class','none'));

alter table public.popups drop constraint if exists popups_link_ok;
alter table public.popups add  constraint popups_link_ok check (
     (link_kind in ('form','class') and form_key  is not null)
  or (link_kind = 'notice'          and notice_id is not null)
  or (link_kind = 'none')
);

comment on column public.popups.link_kind is
  'form=구글폼 직행(/api/go), class=체험 상세(/about/[key]), notice=공지 상세, none=링크 없음. class는 form_key를 체험 키로 쓴다.';
