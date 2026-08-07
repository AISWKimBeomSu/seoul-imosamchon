"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard.server";
import { getAdminBooking, setBookingStatus } from "@/lib/admin-bookings.server";
import { getForm } from "@/lib/forms.server";
import { getSiteConfig } from "@/lib/config";
import { getSiteOrigin } from "@/lib/origin";
import { pick } from "@/lib/i18n";
import type { BookingStatus } from "@/lib/bookings";
import {
  bookingConfirmed,
  bookingDeclined,
  sendEmail,
  type BookingMailData,
} from "@/lib/email.server";

export type AdminActionState = { ok: boolean; message: string };

export const ADMIN_EMPTY: AdminActionState = { ok: false, message: "" };

const ALLOWED: BookingStatus[] = [
  "confirmed",
  "declined",
  "cancelled",
  "no_show",
  "done",
];

/**
 * 예약 상태 변경.
 *
 * 좌석 카운트는 admin_set_booking_status RPC가 상태 변경과 같은 트랜잭션에서
 * 조정한다. 여기서 sessions를 직접 건드리면 둘이 어긋난다(ADR-15).
 *
 * 메일 발송 실패는 상태를 되돌리지 않는다 — 승인은 이미 사실이고,
 * 못 보낸 메일은 다시 보내면 된다(F13-4).
 */
export async function updateBookingStatus(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminRequest())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!id || !ALLOWED.includes(status)) {
    return { ok: false, message: "잘못된 요청입니다." };
  }

  // 메일에 넣을 정보는 상태를 바꾸기 전에 읽어 둔다.
  const before = await getAdminBooking(id);

  const ok = await setBookingStatus(id, status, reason);
  if (!ok) {
    // RPC가 false를 주는 경우는 대개 게스트가 먼저 취소한 건이다.
    return {
      ok: false,
      message: "이미 처리된 예약입니다. 화면을 새로고침해 주세요.",
    };
  }

  let mailNote = "";
  if ((status === "confirmed" || status === "declined") && before?.session) {
    const sent = await notifyGuest(before, status, reason);
    if (!sent) mailNote = " (안내 메일은 보내지 못했습니다)";
  }

  revalidatePath("/admin/bookings");
  const label =
    status === "confirmed"
      ? "확정했습니다"
      : status === "declined"
        ? "거절 처리했습니다"
        : status === "cancelled"
          ? "취소했습니다"
          : status === "no_show"
            ? "불참으로 기록했습니다"
            : "완료로 기록했습니다";
  return { ok: true, message: label + mailNote };
}

async function notifyGuest(
  booking: NonNullable<Awaited<ReturnType<typeof getAdminBooking>>>,
  status: "confirmed" | "declined",
  reason: string,
): Promise<boolean> {
  if (!booking.email || !booking.session) return true; // 전화 접수분은 메일이 없다

  try {
    const [origin, cfg, form] = await Promise.all([
      getSiteOrigin(),
      getSiteConfig(),
      getForm(booking.session.form_key),
    ]);
    const locale = booking.locale;
    const data: BookingMailData = {
      locale,
      guestName: booking.name,
      experienceTitle: form ? pick(locale, form.title, form.title_en) : booking.formTitle,
      startsAt: booking.session.starts_at,
      guests: booking.guests,
      meetPlace: form ? pick(locale, form.meet_place, form.meet_place_en) : "",
      manageUrl: `${origin}/booking/${encodeURIComponent(booking.cancel_token)}`,
      contactEmail: cfg.contact_email,
      contactPhone: cfg.contact_phone,
      declineReason: reason,
    };

    const mail = status === "confirmed" ? bookingConfirmed(data) : bookingDeclined(data);
    return await sendEmail({
      to: booking.email,
      subject: mail.subject,
      html: mail.html,
      replyTo: cfg.contact_email,
    });
  } catch (e) {
    console.error("[admin] notify failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** 조회 링크를 잃은 게스트에게 다시 보낸다(F16-6). */
export async function resendManageLink(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminRequest())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  const id = String(formData.get("id") ?? "");
  const booking = await getAdminBooking(id);
  if (!booking?.session) return { ok: false, message: "예약을 찾지 못했습니다." };
  if (!booking.email) {
    return { ok: false, message: "이 예약에는 이메일이 없습니다. 전화로 안내해 주세요." };
  }

  const sent = await notifyGuest(
    booking,
    booking.status === "declined" ? "declined" : "confirmed",
    booking.decline_reason,
  );
  return sent
    ? { ok: true, message: "안내 메일을 다시 보냈습니다." }
    : { ok: false, message: "메일을 보내지 못했습니다. 발송 설정을 확인해 주세요." };
}
