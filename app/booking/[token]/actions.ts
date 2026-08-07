"use server";

import { revalidatePath } from "next/cache";
import { cancelBookingByToken, getBookingByToken } from "@/lib/bookings.server";
import { getForm } from "@/lib/forms.server";
import { getSiteConfig } from "@/lib/config";
import { getSiteOrigin } from "@/lib/origin";
import { pick } from "@/lib/i18n";
import { bookingCancelled, sendEmail, type BookingMailData } from "@/lib/email.server";

export type CancelState = { done: boolean; failed: boolean };

/**
 * 게스트 취소.
 *
 * 좌석 반환은 cancel_booking RPC 안에서 예약 상태 변경과 같은 트랜잭션으로
 * 일어난다. 여기서 booked_count를 건드리지 않는다(ADR-15).
 */
export async function cancelBooking(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { done: false, failed: true };

  // 메일에 쓸 정보는 취소하기 전에 읽어 둔다.
  const before = await getBookingByToken(token);

  const ok = await cancelBookingByToken(token);
  if (!ok) return { done: false, failed: true };

  if (before?.session) {
    try {
      const [origin, cfg, form] = await Promise.all([
        getSiteOrigin(),
        getSiteConfig(),
        getForm(before.session.form_key),
      ]);
      const locale = before.locale;
      const data: BookingMailData = {
        locale,
        guestName: before.name,
        experienceTitle: form ? pick(locale, form.title, form.title_en) : "",
        startsAt: before.session.starts_at,
        guests: before.guests,
        meetPlace: form ? pick(locale, form.meet_place, form.meet_place_en) : "",
        manageUrl: `${origin}/booking/${encodeURIComponent(token)}`,
        contactEmail: cfg.contact_email,
        contactPhone: cfg.contact_phone,
      };
      const mail = bookingCancelled(data);

      await Promise.all([
        before.email
          ? sendEmail({
              to: before.email,
              subject: mail.subject,
              html: mail.html,
              replyTo: cfg.contact_email,
            })
          : Promise.resolve(false),
        // 운영자도 알아야 자리를 다시 채울 수 있다.
        sendEmail({
          to: process.env.ADMIN_NOTIFY_EMAIL || cfg.contact_email,
          subject: `[예약 취소] ${data.experienceTitle} · ${before.name}님 ${before.guests}명`,
          html: bookingCancelled({ ...data, locale: "ko" }).html,
        }),
      ]);
    } catch (e) {
      // 메일이 안 나가도 취소 자체는 이미 끝났다. 되돌리지 않는다.
      console.error("[booking] cancel notify failed:", e instanceof Error ? e.message : e);
    }
  }

  revalidatePath(`/booking/${token}`);
  return { done: true, failed: false };
}
