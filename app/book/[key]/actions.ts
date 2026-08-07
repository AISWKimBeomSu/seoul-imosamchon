"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getForm } from "@/lib/forms.server";
import { getSession } from "@/lib/sessions.server";
import { getSiteConfig } from "@/lib/config";
import { getSiteOrigin } from "@/lib/origin";
import { getLocale } from "@/lib/locale.server";
import { newCancelToken } from "@/lib/token.server";
import { remainingSeats } from "@/lib/sessions";
import { pick } from "@/lib/i18n";
import {
  bookingErrorMessage,
  validateBooking,
  type BookingInput,
  type FieldError,
} from "@/lib/bookings";
import {
  adminNewBooking,
  bookingReceived,
  sendEmail,
  type BookingMailData,
} from "@/lib/email.server";

export type BookingFormState = {
  errors: FieldError[];
  /** 필드와 무관한 실패(정원 마감 등) */
  message: string;
};

/**
 * 예약 신청.
 *
 * 정원 확인을 여기서 하지 않는다 — 확인하고 넣는 사이에 다른 사람이 들어오면
 * 그대로 초과된다. 잔여 검사·삽입·카운트 증가는 request_booking RPC가 한
 * 트랜잭션에서 처리하고, 여기서는 그 결과만 받는다.
 *
 * 참조: docs/PLATFORM.md §13.1
 */
export async function submitBooking(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const locale = await getLocale();

  const formKey = String(formData.get("formKey") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");

  // 봇 함정. 사람 눈에 안 보이는 칸이 채워졌다면 자동 제출이다.
  // 조용히 성공한 척한다 — 실패를 알려주면 우회 방법을 알려주는 셈이다.
  if (String(formData.get("website") ?? "").trim() !== "") {
    redirect(`/book/${formKey}/done`);
  }

  const input: BookingInput = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    guests: Number(formData.get("guests") ?? 1),
    note: String(formData.get("note") ?? ""),
    consent: formData.get("consent") === "on",
    ageConfirmed: formData.get("ageConfirmed") === "on",
  };

  const [form, session] = await Promise.all([
    getForm(formKey),
    getSession(sessionId),
  ]);

  if (!form || !session) {
    return {
      errors: [],
      message: bookingErrorMessage("SESSION_NOT_FOUND", locale),
    };
  }

  const maxGuests = Math.min(remainingSeats(session), 20);
  const errors = validateBooking(input, maxGuests, locale);
  if (errors.length > 0) return { errors, message: "" };

  const supabase = createServiceClient();
  if (!supabase) {
    // 서버 키가 없으면 예약을 받을 수 없다. 조용히 실패하지 않고 사실대로 말한다.
    console.error(
      "[booking] SUPABASE_SERVICE_ROLE_KEY missing — cannot accept bookings",
    );
    return { errors: [], message: bookingErrorMessage("", locale) };
  }

  const token = newCancelToken();
  const { data, error } = await supabase.rpc("request_booking", {
    p_session: sessionId,
    p_name: input.name.trim(),
    p_email: input.email.trim(),
    p_phone: input.phone.trim(),
    p_guests: input.guests,
    p_note: input.note.trim(),
    p_locale: locale,
    p_token: token,
    p_source: "web",
  });

  if (error || !data) {
    // 토큰은 로그에 남기지 않는다.
    console.error(
      "[booking] request_booking failed:",
      error?.message ?? "no id returned",
    );
    return { errors: [], message: bookingErrorMessage(error?.message ?? "", locale) };
  }

  // 메일은 예약이 들어간 다음의 일이다. 실패해도 예약을 되돌리지 않는다(F13-4).
  try {
    await notify({ form, session, input, token, locale });
  } catch (e) {
    console.error("[booking] notify failed:", e instanceof Error ? e.message : e);
  }

  redirect(`/book/${formKey}/done?t=${encodeURIComponent(token)}`);
}

async function notify({
  form,
  session,
  input,
  token,
  locale,
}: {
  form: NonNullable<Awaited<ReturnType<typeof getForm>>>;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  input: BookingInput;
  token: string;
  locale: "ko" | "en";
}) {
  const [origin, cfg] = await Promise.all([getSiteOrigin(), getSiteConfig()]);

  const data: BookingMailData = {
    locale,
    guestName: input.name.trim(),
    experienceTitle: pick(locale, form.title, form.title_en),
    startsAt: session.starts_at,
    guests: input.guests,
    meetPlace: pick(locale, form.meet_place, form.meet_place_en),
    manageUrl: `${origin}/booking/${encodeURIComponent(token)}`,
    contactEmail: cfg.contact_email,
    contactPhone: cfg.contact_phone,
  };

  const guestMail = bookingReceived(data);
  const adminMail = adminNewBooking({
    ...data,
    locale: "ko", // 운영자 통지는 늘 한국어
    adminUrl: `${origin}/admin/bookings`,
    phone: input.phone.trim(),
    email: input.email.trim() || null,
    note: input.note.trim(),
  });

  await Promise.all([
    input.email.trim()
      ? sendEmail({
          to: input.email.trim(),
          subject: guestMail.subject,
          html: guestMail.html,
          replyTo: cfg.contact_email,
        })
      : Promise.resolve(false),
    sendEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL || cfg.contact_email,
      subject: adminMail.subject,
      html: adminMail.html,
    }),
  ]);
}
