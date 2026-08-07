import AdminNav from "@/components/AdminNav";
import BookingActions from "@/components/BookingActions";
import ManualBooking from "@/components/ManualBooking";
import PurgePanel from "@/components/PurgePanel";
import { requireAdmin } from "@/lib/admin-guard.server";
import {
  getAdminBookings,
  getBookableSessions,
  getPurgeTarget,
  type AdminBookingRow,
} from "@/lib/admin-bookings.server";
import { isEmailConfigured } from "@/lib/email.server";
import { formatSessionWhen } from "@/lib/sessions";
import { statusLabel } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** SLA. 이 시간을 넘긴 신청은 화면에서 눈에 띄어야 한다. */
const SLA_HOURS = 24;

function Row({ b }: { b: AdminBookingRow }) {
  const overdue = b.status === "requested" && b.hoursWaiting >= SLA_HOURS;

  return (
    <li
      className={`rounded-[18px] border px-5 py-4 ${
        overdue ? "border-danger-line bg-danger-soft" : "border-line bg-white"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[1.05rem] font-extrabold">
          {b.name}
          <span className="ml-2 font-bold text-sub">{b.guests}명</span>
          {b.source === "admin" && (
            <span className="ml-2 rounded-full bg-soft px-2.5 py-1 text-[0.85rem] font-bold text-sub">
              전화 접수
            </span>
          )}
        </p>
        <span className="text-sub">
          {b.status === "requested"
            ? `${b.hoursWaiting}시간 전 신청`
            : statusLabel(b.status, "ko")}
        </span>
      </div>

      <p className="m-0 mt-1 text-sub">
        {b.formTitle}
        {b.session && ` · ${formatSessionWhen(b.session.starts_at, "ko")}`}
      </p>

      <p className="m-0 mt-2">
        <a href={`tel:${b.phone}`} className="underline">
          {b.phone}
        </a>
        {b.email ? (
          <>
            {" · "}
            <a href={`mailto:${b.email}`} className="underline">
              {b.email}
            </a>
          </>
        ) : (
          <span className="text-sub"> · 이메일 없음 (전화로 안내 필요)</span>
        )}
      </p>

      {b.note && (
        <p className="m-0 mt-2 rounded-[12px] bg-soft px-4 py-2.5">
          <span className="font-bold">요청사항 </span>
          {b.note}
        </p>
      )}

      {b.status === "declined" && b.decline_reason && (
        <p className="m-0 mt-2 text-sub">거절 사유 · {b.decline_reason}</p>
      )}

      <BookingActions id={b.id} status={b.status} hasEmail={Boolean(b.email)} />
    </li>
  );
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: AdminBookingRow[];
  empty: string;
}) {
  return (
    <section className="mt-9">
      <h2 className="mb-3 text-[1.2rem] font-extrabold">
        {title}
        {rows.length > 0 && <span className="ml-2 text-sub">{rows.length}건</span>}
      </h2>
      {rows.length === 0 ? (
        <p className="m-0 rounded-[18px] bg-soft px-5 py-4 text-sub">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((b) => (
            <Row key={b.id} b={b} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminBookingsPage() {
  await requireAdmin();

  const [{ pending, upcoming, past, closed, unavailable }, bookable, purge] =
    await Promise.all([getAdminBookings(), getBookableSessions(), getPurgeTarget()]);
  const mailOff = !isEmailConfigured();

  return (
    <main className="section">
      <div className="wrap">
        <AdminNav current="/admin/bookings" />
        <h1 className="mt-4 mb-2 text-[clamp(1.5rem,3vw,2rem)] font-extrabold">
          예약 관리
        </h1>
        <p className="sec-sub">
          신청은 24시간 안에 확정 또는 거절 안내를 보내기로 약관에 적혀 있습니다.
        </p>

        {/* 설정이 빠져 있으면 화면이 조용히 비는 대신 이유를 말한다.
            ClickSummary가 계측 키 없을 때 하는 것과 같은 방식. */}
        {unavailable && (
          <p className="mt-6 rounded-[18px] border border-danger-line bg-danger-soft px-5 py-4 font-bold text-danger">
            예약 정보를 읽지 못했습니다. 예약 테이블(0021 마이그레이션)이 아직
            적용되지 않았거나 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.
          </p>
        )}

        {!unavailable && mailOff && (
          <p className="mt-6 rounded-[18px] border border-line bg-soft px-5 py-4">
            <strong>안내 메일이 꺼져 있습니다.</strong> RESEND_API_KEY와
            BOOKING_FROM_EMAIL을 설정하기 전까지 승인·거절해도 게스트에게 메일이
            가지 않습니다. 그동안은 전화나 이메일로 직접 안내해 주세요.
          </p>
        )}

        {!unavailable && (
          <>
            <Section
              title="확정을 기다리는 신청"
              rows={pending}
              empty="처리할 신청이 없습니다."
            />
            <Section
              title="다가오는 예약"
              rows={upcoming}
              empty="확정된 예약이 없습니다."
            />
            <Section title="지난 예약" rows={past} empty="아직 없습니다." />
            <Section
              title="취소·거절"
              rows={closed}
              empty="아직 없습니다."
            />

            {/* 이메일을 안 쓰시는 분과 전화 접수분의 유일한 통로.
                여기를 안 거치면 그 예약이 정원 밖에서 돌아 잔여석이 거짓이 된다. */}
            <ManualBooking sessions={bookable} />

            <PurgePanel count={purge.count} oldest={purge.oldest} />
          </>
        )}
      </div>
    </main>
  );
}
