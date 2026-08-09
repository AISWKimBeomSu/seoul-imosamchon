"use server";

import { revalidatePath } from "next/cache";
import { type ActionState } from "@/lib/action-state";

import { isAdminRequest } from "@/lib/admin-guard.server";
import { createServiceClient } from "@/lib/supabase/service";
import { newCancelToken } from "@/lib/token.server";
import {
  getAdminBooking,
  purgeOldBookings,
  setBookingStatus,
} from "@/lib/admin-bookings.server";
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
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

/**
 * 전화·종이로 들어온 예약을 운영자가 대신 등록한다 (F16-7).
 *
 * 이게 없으면 이메일을 안 쓰시는 시니어 게스트가 예약할 길이 아예 없고,
 * 전화로 받은 신청이 정원 밖에서 돌아 '정원 사고 0건'이 첫 주에 깨진다.
 *
 * 웹 폼과 같은 RPC를 쓴다 — 정원 검증·카운트 증가가 한 트랜잭션에서
 * 일어나야 하는 건 접수 경로와 무관하다. source='admin'이라 마감 컷오프는
 * 면제된다(전화는 마감 직전에 올 수 있고, 그 판단은 사람이 한다).
 */
export async function createManualBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await isAdminRequest())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  const sessionId = String(formData.get("session_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const guests = Number(formData.get("guests") ?? 1);
  const note = String(formData.get("note") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!sessionId) return { ok: false, message: "회차를 골라 주세요." };
  if (!name) return { ok: false, message: "성함을 입력해 주세요." };
  if (phone.replace(/\D/g, "").length < 8) {
    return { ok: false, message: "전화번호를 숫자 8자 이상 입력해 주세요." };
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    return { ok: false, message: "인원은 1~20명 사이로 입력해 주세요." };
  }

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "서버 키가 설정되지 않았습니다." };

  const token = newCancelToken();
  const { data, error } = await supabase.rpc("request_booking", {
    p_session: sessionId,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_guests: guests,
    p_note: note,
    p_locale: "ko",
    p_token: token,
    p_source: "admin",
  });

  if (error || !data) {
    return {
      ok: false,
      message: error?.message.includes("CAPACITY_EXCEEDED")
        ? "남은 자리보다 인원이 많습니다."
        : error?.message.includes("SESSION_CLOSED")
          ? "이미 마감되었거나 지난 회차입니다."
          : "등록하지 못했습니다.",
    };
  }

  // 전화 접수는 대개 바로 확정해 드리는 게 맞다. 다만 자동으로 하지 않는다 —
  // 운영자가 승인 버튼을 눌러야 확정 메일이 나가고 SLA 기록도 남는다.
  if (memo) {
    await supabase.from("bookings").update({ admin_memo: memo }).eq("id", data);
  }

  revalidatePath("/admin/bookings");
  return {
    ok: true,
    message: email
      ? `${name}님을 등록했습니다. 승인하면 확정 메일이 갑니다.`
      : `${name}님을 등록했습니다. 이메일이 없으니 전화로 확정을 안내해 주세요.`,
  };
}

/** 조회 링크를 잃은 게스트에게 다시 보낸다(F16-6). */
export async function resendManageLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

/**
 * 6개월 지난 예약 파기 (F16-4).
 *
 * 방침 §6에 적어 둔 보유기간을 실제로 지키는 장치다. 되돌릴 수 없으므로
 * 화면에서 건수를 보여주고 사람이 누르게 한다.
 */
export async function purgeBookings(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  if (!(await isAdminRequest())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  const { bookings, sessions } = await purgeOldBookings();
  revalidatePath("/admin/bookings");

  return bookings === 0
    ? { ok: true, message: "파기할 예약이 없습니다." }
    : {
        ok: true,
        message: `예약 ${bookings}건을 파기했습니다. 빈 회차 ${sessions}개도 함께 정리했습니다.`,
      };
}
