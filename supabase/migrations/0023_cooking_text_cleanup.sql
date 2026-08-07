-- ============================================================================
-- 0023_cooking_text_cleanup.sql — 쿠킹클래스의 이중 기재 정리 (v2.0 Phase 2)
--
-- 0018에서 미뤄 둔 F9-4를 이제 한다. 쿠킹클래스가 자체 예약(native)으로
-- 전환돼 회차·가격·정원이 구조화 필드에서 화면에 나오기 시작했기 때문이다.
--
-- 왜 지금인가 — 0018 시점에는 booking_mode가 external이라 회차를 안 띄웠다.
-- 그때 부제에서 "8월 18일(화) 15:00"을 지웠으면 손님이 날짜를 알 방법이
-- 사라진다. 구조화 값이 실제로 보이기 시작한 뒤에 텍스트를 지우는 게 순서다.
--
-- 하이킹은 아직 구글폼이라 건드리지 않는다. native로 바꾸는 릴리스에서
-- 같은 방식으로 정리한다.
--
-- 참조: docs/PLATFORM.md F9-4·F9-5
-- ============================================================================

update public.forms set
  -- 날짜는 sessions가, 장소는 meet_place가 말한다
  subtitle       = '통인시장에서 장을 보고, 집 부엌에서 한우 불고기를',
  subtitle_en    = 'Shop at Tongin Market, then cook hanwoo bulgogi in a home kitchen',
  -- 가격·정원은 price_krw·capacity가 말한다
  description    = '진짜 한국 이모의 손맛으로 한우 불고기를 직접 만들어 드셔 보세요. 40년 쓴 냄비가 있는 서울의 부엌에서요.',
  description_en = 'Cook and share real hanwoo bulgogi with a Korean home cook, in a Seoul kitchen where the pots are forty years old.'
where key = 'cooking';

-- detail 마크다운의 '한눈에 보기' 표는 상세 페이지 상단 메타 바가 대신한다.
-- 표만 걷어내고 서사(진행 순서·포함사항)는 그대로 둔다.
update public.forms set
  detail = $md$
## 이렇게 진행돼요

**1. 시장에서 만나요**
통인시장에서 호스트와 함께 장을 봅니다. 맛보면서 오늘 만들 재료를 고릅니다. (60분)

**2. 진짜 집 부엌에서**
스튜디오가 아닙니다. 40년 쓴 냄비와 그 집 레시피가 있는 서울의 부엌입니다. (120분)

**3. 먹으면서 이야기를**
직접 만든 밥상에 앉습니다. 호스트는 이 동네를 웬만한 가이드북보다 오래 살았습니다.

## 이런 분께

한국에서 공부하는 영어권 유학생, 그리고 관광지 말고 진짜 서울의 하루를
보고 싶은 분.

## 준비물

편한 옷차림이면 됩니다. 앞치마와 조리도구는 저희가 준비합니다.
$md$,
  detail_en = $md$
## What you will do

**1. Meet at the market**
Start at Tongin Market with your host. Taste as you go, and pick up what you will cook together. (60 min)

**2. Cook in a real home kitchen**
Not a studio. An actual Seoul kitchen, with the pots and the recipes a family has used for forty years. (120 min)

**3. Eat, and hear the stories**
Sit down to the meal you made. Your host has lived in this neighbourhood longer than most guidebooks have existed.

## Who it is for

English-speaking students in Korea, and anyone who would rather see a real
day in Seoul than another landmark.

## What to bring

Just comfortable clothes. We provide the apron and everything in the kitchen.
$md$
where key = 'cooking';
