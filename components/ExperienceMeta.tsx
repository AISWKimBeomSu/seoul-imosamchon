import { formatDuration, formatPrice } from "@/lib/sessions";
import { pick, type Locale } from "@/lib/i18n";
import type { ApplyForm } from "@/lib/forms";

/**
 * 체험 메타 바 — 소요시간 · 진행 언어 · 최대 인원 · 참가비.
 *
 * 값이 없으면 그 칸만 빠진다. 0018 마이그레이션을 적용하기 전에는 전부
 * undefined라 이 컴포넌트가 통째로 렌더되지 않는다 — 그래야 스키마와 코드의
 * 배포 순서가 어긋나도 화면이 깨지지 않고 예전 모습 그대로 남는다.
 *
 * 참조: docs/PLATFORM.md F9-1
 */

function languageLabel(code: string | null | undefined, locale: Locale): string {
  if (!code) return "";
  const ko: Record<string, string> = {
    ko: "한국어",
    en: "영어",
    "ko-en": "한국어 · 영어",
  };
  const en: Record<string, string> = {
    ko: "Korean",
    en: "English",
    "ko-en": "Korean & English",
  };
  return (locale === "en" ? en : ko)[code] ?? "";
}

export default function ExperienceMeta({
  form,
  locale,
}: {
  form: ApplyForm;
  locale: Locale;
}) {
  const en = locale === "en";

  const items: { label: string; value: string }[] = [];

  const duration = formatDuration(form.duration_min ?? null, locale);
  if (duration) items.push({ label: en ? "Duration" : "소요시간", value: duration });

  const lang = languageLabel(form.language, locale);
  if (lang) items.push({ label: en ? "Language" : "진행 언어", value: lang });

  if (form.max_guests) {
    items.push({
      label: en ? "Group size" : "정원",
      value: en ? `Up to ${form.max_guests}` : `최대 ${form.max_guests}명`,
    });
  }

  const price = formatPrice(form.price_krw ?? null, locale);
  if (price) {
    items.push({
      label: en ? "Price" : "참가비",
      value: en ? `${price} / person` : `1인 ${price}`,
    });
  }

  // 영문 목록이 비어 있으면 한국어로 떨어진다 — pick()과 같은 규칙을 배열에 적용한 것.
  const includeList =
    (locale === "en" && form.includes_en?.length ? form.includes_en : form.includes) ??
    [];

  const meetPlace = pick(locale, form.meet_place, form.meet_place_en);

  if (items.length === 0 && includeList.length === 0 && !meetPlace) return null;

  return (
    <div className="my-7">
      {items.length > 0 && (
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 rounded-[22px] border border-line bg-soft px-6 py-5 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.label}>
              <dt className="text-sub text-[0.95rem]">{it.label}</dt>
              <dd className="m-0 mt-1 font-bold">{it.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {includeList.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-[1.15rem] font-extrabold">
            {en ? "What's included" : "이런 게 포함돼 있어요"}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {includeList.map((it, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden="true" className="font-bold text-point-dark">
                  ✓
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {meetPlace && (
        <div className="mt-6">
          <h2 className="mb-2 text-[1.15rem] font-extrabold">
            {en ? "Where we meet" : "만나는 곳"}
          </h2>
          <p className="m-0">{meetPlace}</p>
          {/* 지도를 임베드하지 않는다 — 외부 스크립트가 CSP·성능·동의 문제를 한꺼번에
              끌고 온다. 한국에서 도보 길찾기는 네이버가 낫고 외국인은 구글을 쓰므로
              둘 다 건다. */}
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetPlace)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {en ? "Open in Google Maps" : "구글 지도로 보기"}
            </a>
            <a
              href={`https://map.naver.com/p/search/${encodeURIComponent(meetPlace)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {en ? "Open in Naver Map" : "네이버 지도로 보기"}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
