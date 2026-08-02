-- ============================================================================
-- 0017_class_detail.sql — 클래스 상세 페이지 (v1.4)
--
-- 배경: 상단 메뉴에 '브랜드소개'와 '손님 안내'가 나란히 있어 무엇이 다른지
--       알 수 없었다. 손님 안내는 사실상 쿠킹클래스 소개였다.
--
-- 구조를 이렇게 바꾼다:
--   /about              브랜드 이야기 + 클래스 카드 목록
--   /about/cooking      쿠킹클래스 상세  → 쿠킹 구글폼만
--   /about/hiking       하이킹 상세      → 하이킹 구글폼만
--   /apply              3종 선택 (홈·상단 메뉴의 '신청하기')
--
-- 상세 본문은 코드에 박지 않고 여기 둔다. 클래스가 늘어도 코드는 그대로다.
-- ============================================================================

alter table public.forms add column if not exists detail    text not null default '';
alter table public.forms add column if not exists detail_en text not null default '';

-- 손님 안내(/guest)에 있던 내용 + 포스터 정보를 쿠킹클래스 상세로 옮긴다.
update public.forms set detail = $md$
## 이렇게 진행돼요

**1. 시장에서 만나요**
통인시장에서 호스트와 함께 장을 봅니다. 맛보면서 오늘 만들 재료를 고릅니다. (60분)

**2. 진짜 집 부엌에서**
스튜디오가 아닙니다. 40년 쓴 냄비와 그 집 레시피가 있는 서울의 부엌입니다. (120분)

**3. 먹으면서 이야기를**
직접 만든 밥상에 앉습니다. 호스트는 이 동네를 웬만한 가이드북보다 오래 살았습니다.

## 한눈에 보기

| | |
|---|---|
| 날짜 | 2026년 8월 18일 (화) 15:00 시작 |
| 소요 | 약 4시간 |
| 장소 | 통인시장 · 통인라운지 키친 (종로구, 3호선 경복궁역 인근) |
| 인원 | 5명 (선착순) |
| 참가비 | ~~135,000원~~ → **30,000원** |
| 대상 | 한국에서 공부하는 영어권 유학생 |

## 포함되는 것

- 통인시장 장보기 60분 (엽전 쇼핑 체험 포함)
- 쿠킹클래스 120분
- 직접 만든 음식 식사
- 영문 레시피 카드

**한우 불고기**를 직접 만들어 드십니다.
$md$,
detail_en = $md$
## What you will do

**1. Meet at the market**
Start at Tongin Market with your host. Taste as you go, and pick up what you will cook together. (60 min)

**2. Cook in a real home kitchen**
Not a studio. An actual Seoul kitchen, with the pots and the recipes a family has used for forty years. (120 min)

**3. Eat, and hear the stories**
Sit down to the meal you made. Your host has lived in this neighbourhood longer than most guidebooks have existed.

## At a glance

| | |
|---|---|
| Date | Tue 18 Aug 2026, 15:00 |
| Duration | About 4 hours |
| Where | Tongin Market & Tongin Lounge Kitchen, Jongno-gu (near Gyeongbokgung Stn, Line 3) |
| Group | 5 seats only |
| Price | ~~₩135,000~~ → **₩30,000** |
| For | English-speaking international students in Korea |

## What is included

- 60 min Tongin Market shopping (with traditional brass coins)
- 120 min cooking class
- Enjoy the food you made yourself
- English recipe card

You will cook **Hanwoo beef bulgogi**.
$md$
where key = 'cooking';

update public.forms set detail = $md$
## 두 개의 코스

호스트 **김선영**님과 함께 걷습니다. 노을 시간에 맞춰 두 코스 모두 저녁 빛이 가장 좋을 때 정상에 닿습니다.

### 코스 A · 인왕산
**15:50–19:50 (4시간)** · 윤동주 문학관에서 만나요

- 윤동주 문학관
- 인왕산 숲속쉼터
- 숲속 초소책방
- 무무대 전망대
- 수성동 계곡 · 서촌

*난이도: 보통, 오르막 구간 있음*

### 코스 B · 안산
**16:30–20:00 (3시간 30분)** · 서대문독립공원에서 만나요

- 안산 자락길
- 메타세쿼이아 숲
- 황토 맨발길
- 홍제천 인공폭포

*난이도: 쉬움, 턱 없는 데크길*

## 이런 분께

- 한국에서 공부하는 영어권 유학생
- 3~5명 소규모
- 대화하며 걷는 속도

## 준비물

- 편한 운동화
- 물 1병
- 얇은 겉옷

## 알아두실 점

- 호스트 일정이 가능한 날에만 열립니다.
- 두 코스 모두 저녁 8시쯤 식당가 근처에서 끝납니다.
$md$,
detail_en = $md$
## Two courses

Walk with host **Kim Sunyoung**. Both courses are timed so you reach the best evening light.

### Course A · Inwangsan
**15:50–19:50 (4 hrs)** · Meet at Yoon Dong-ju Literature Museum

- Yoon Dong-ju Literature Museum
- Inwangsan Forest Shelter
- The Forest Outpost Bookstore
- Mumu Observatory
- Suseong-dong Valley · Seochon

*Pace: moderate, some uphill sections*

### Course B · Ansan
**16:30–20:00 (3 hrs 30 min)** · Meet at Seodaemun Independence Park

- Ansan Jarak-gil
- Metasequoia Forest
- Hwangto Barefoot Trail
- Hongjecheon Waterfall

*Pace: easy, barrier-free deck trail*

## Who it is for

- English-speaking international students in Korea
- Small group of 3–5 people
- Conversation-friendly pace

## What to bring

- Comfortable sneakers
- 1 bottle of water
- Light outerwear

## Good to know

- Dates open only when the host is available.
- Both courses end near restaurant areas around 8 PM.
$md$
where key = 'hiking';
