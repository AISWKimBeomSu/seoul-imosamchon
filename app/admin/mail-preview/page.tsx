import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin-guard.server";
import { getSiteConfig } from "@/lib/config";
import {
  adminNewBooking,
  bookingCancelled,
  bookingConfirmed,
  bookingDeclined,
  bookingReceived,
  bookingReminder,
  isEmailConfigured,
  type BookingMailData,
} from "@/lib/email.server";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/**
 * 예약 안내 메일 미리보기.
 *
 * 메일은 한 번 나가면 회수할 수 없다. 그런데 실제로 보낼 때까지 어떻게 생겼는지
 * 볼 방법이 없으면, 오타나 어색한 문장을 손님이 먼저 발견한다.
 * 여기서 여섯 종을 그대로 렌더해 두고 운영자가 미리 읽게 한다.
 *
 * 실제 발송은 하지 않는다 — 화면에 그리기만 한다.
 */
export default async function MailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  await requireAdmin();
  const { locale: rawLocale } = await searchParams;
  const locale = rawLocale === "en" ? "en" : "ko";
  const cfg = await getSiteConfig();

  // 실제와 비슷한 예시 데이터. 이름은 누가 봐도 예시인 걸로 둔다.
  // 날짜는 고정값이다 — 렌더할 때마다 달라지면 미리보기가 순수하지 않고,
  // 문구를 검토하는 데 오늘 날짜가 필요하지도 않다.
  const base: BookingMailData = {
    locale,
    guestName: locale === "en" ? "Maria" : "김순자",
    experienceTitle: locale === "en" ? "Oneday Cooking Class" : "원데이 쿠킹클래스",
    startsAt: "2026-08-21T06:00:00.000Z", // 8월 21일(금) 오후 3시 KST
    guests: 2,
    meetPlace:
      locale === "en"
        ? "Tongin Market main entrance, Jongno-gu, Seoul"
        : "서울 종로구 통인시장 입구",
    manageUrl: "https://seoulimosamchon.com/booking/EXAMPLE-TOKEN",
    contactEmail: cfg.contact_email,
    contactPhone: cfg.contact_phone,
    declineReason:
      locale === "en"
        ? "This session did not reach the minimum number of guests, so we cannot run it."
        : "이 회차는 최소 인원이 모이지 않아 진행하지 못하게 되었습니다.",
  };

  const mails = [
    { key: "received", label: "① 신청 접수 (게스트)", mail: bookingReceived(base) },
    { key: "confirmed", label: "② 예약 확정 (게스트)", mail: bookingConfirmed(base) },
    { key: "declined", label: "③ 거절 안내 (게스트)", mail: bookingDeclined(base) },
    { key: "cancelled", label: "④ 취소 확인 (게스트)", mail: bookingCancelled(base) },
    { key: "reminder", label: "⑤ 하루 전 안내 (게스트)", mail: bookingReminder(base) },
    {
      key: "admin",
      label: "⑥ 새 신청 알림 (운영자)",
      mail: adminNewBooking({
        ...base,
        locale: "ko",
        adminUrl: "https://seoulimosamchon.com/admin/bookings",
        phone: "010-1234-5678",
        email: "guest@example.com",
        note: "견과류 알레르기가 있습니다",
      }),
    },
  ];

  return (
    <main className="section">
      <div className="wrap">
        <AdminNav current="/admin/mail-preview" />
        <h1 className="mt-4 mb-2 text-[clamp(1.5rem,3vw,2rem)] font-extrabold">
          예약 안내 메일 미리보기
        </h1>
        <p className="sec-sub">
          실제로 나가는 여섯 종입니다. 여기서는 <strong>발송하지 않습니다</strong> —
          문구만 확인하세요. 고칠 곳이 있으면 알려 주세요.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/mail-preview"
            className={`btn nav-cta ${locale === "ko" ? "btn-primary" : "btn-ghost"}`}
          >
            한국어
          </Link>
          <Link
            href="/admin/mail-preview?locale=en"
            className={`btn nav-cta ${locale === "en" ? "btn-primary" : "btn-ghost"}`}
          >
            English
          </Link>
        </div>

        {!isEmailConfigured() && (
          <p className="mt-6 rounded-[18px] border border-line bg-soft px-5 py-4">
            <strong>아직 발송 설정이 안 돼 있습니다.</strong> RESEND_API_KEY와
            BOOKING_FROM_EMAIL을 넣기 전까지 이 메일들은 실제로 나가지 않습니다.
            예약 접수 자체는 정상 동작합니다.
          </p>
        )}

        {mails.map(({ key, label, mail }) => (
          <section key={key} className="mt-10">
            <h2 className="mb-1 text-[1.2rem] font-extrabold">{label}</h2>
            <p className="m-0 mb-3 text-sub">
              제목 · <strong>{mail.subject}</strong>
            </p>
            {/* 메일 HTML을 그대로 보여준다. sandbox로 스크립트·폼을 막는다 —
                우리가 쓴 템플릿이지만 iframe에 무제한 권한을 줄 이유는 없다. */}
            <iframe
              title={label}
              srcDoc={mail.html}
              sandbox=""
              className="h-[620px] w-full rounded-[18px] border border-line bg-white"
            />
          </section>
        ))}
      </div>
    </main>
  );
}
