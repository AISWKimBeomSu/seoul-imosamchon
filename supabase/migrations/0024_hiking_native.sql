-- ============================================================================
-- 0024_hiking_native.sql — 하이킹 자체 예약 전환 (v2.0 Phase 3)
--
-- 0023에서 쿠킹에 했던 것을 하이킹에도 한다. 순서는 같다:
--   회차를 열고 → native로 바꾸고 → 그다음에 텍스트의 중복을 지운다.
-- 구조화 값이 화면에 나오기 시작한 뒤에 지워야 손님이 정보를 잃지 않는다.
--
-- 이제 구글폼을 쓰는 건 시니어 호스트 모집 하나만 남는다. 그건 체험이 아니라
-- 모집 공고라 회차·정원 개념이 없고, 지원서 문항이 길어 구글폼이 여전히 맞다.
--
-- 참조: docs/PLATFORM.md F9-4, ADR-14(하이브리드 유지)
-- ============================================================================

update public.forms set booking_mode = 'native' where key = 'hiking';

-- 팝업도 상세를 거치게. 코스가 A/B 둘이라 바로 신청으로 보내면
-- 어느 코스인지 모른 채 예약 화면에 떨어진다.
update public.popups set link_kind = 'class' where form_key = 'hiking';

-- ── 이중 기재 정리 ──────────────────────────────────────────────────────────
-- 날짜는 sessions가, 인원은 capacity가, 언어는 language가 말한다.
update public.forms set
  subtitle       = '인왕산과 안산, 노을 시간에 맞춘 두 코스',
  subtitle_en    = 'Inwangsan and Ansan, timed for the evening light',
  description    = '가이드북에 없는 동네 길을, 그 길을 오래 걸어온 분과 함께 걷습니다.',
  description_en = 'Walk the neighbourhood paths no guidebook lists, with someone who has walked them for years.'
where key = 'hiking';

-- detail에서 '이런 분께'의 인원 문구만 걷어낸다. 코스 설명은 그대로 둔다 —
-- 그건 구조화할 수 있는 값이 아니라 읽어야 하는 내용이다.
update public.forms set
  detail = $md$
## 두 개의 코스

호스트 **김선영**님과 함께 걷습니다. 노을 시간에 맞춰 두 코스 모두 저녁 빛이 가장 좋을 때 정상에 닿습니다.

### 코스 A · 인왕산
윤동주 문학관에서 만나요.

- 윤동주 문학관
- 인왕산 숲속쉼터
- 숲속 초소책방
- 무무대 전망대
- 수성동 계곡 · 서촌

*난이도: 보통, 오르막 구간 있음*

### 코스 B · 안산
서대문독립공원에서 만나요.

- 안산 자락길
- 메타세쿼이아 숲
- 황토 맨발길
- 홍제천 인공폭포

*난이도: 쉬움, 턱 없는 데크길*

## 준비물

- 편한 운동화
- 물 1병
- 얇은 겉옷

## 알아두실 점

- 호스트 일정이 가능한 날에만 열립니다. 위에서 열린 날짜를 확인하세요.
- 두 코스 모두 저녁 8시쯤 식당가 근처에서 끝납니다.
$md$,
  detail_en = $md$
## Two courses

Walk with host **Kim Sunyoung**. Both courses are timed so you reach the best evening light.

### Course A · Inwangsan
Meet at Yoon Dong-ju Literature Museum.

- Yoon Dong-ju Literature Museum
- Inwangsan Forest Shelter
- The Forest Outpost Bookstore
- Mumu Observatory
- Suseong-dong Valley · Seochon

*Pace: moderate, some uphill sections*

### Course B · Ansan
Meet at Seodaemun Independence Park.

- Ansan Jarak-gil
- Metasequoia Forest
- Hwangto Barefoot Trail
- Hongjecheon Waterfall

*Pace: easy, barrier-free deck trail*

## What to bring

- Comfortable sneakers
- 1 bottle of water
- Light outerwear

## Good to know

- Dates open only when the host is available — see the list above.
- Both courses end near restaurant areas around 8 PM.
$md$
where key = 'hiking';
