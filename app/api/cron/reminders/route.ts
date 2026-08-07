import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getSiteOrigin } from "@/lib/origin";
import { getSiteConfig } from "@/lib/config";
import { getForms } from "@/lib/forms.server";
import { pick } from "@/lib/i18n";
import {
  bookingReminder,
  isEmailConfigured,
  sendEmail,
  type BookingMailData,
} from "@/lib/email.server";

export const dynamic = "force-dynamic";

/**
 * 하루 전 리마인더 (v2.0 F13-6).
 *
 * 선결제가 없으면 노쇼가 는다. 완화 장치 중 가장 값싼 게 이 메일이다 —
 * 못 오시는 분이 미리 취소하면 그 자리에 다른 분이 올 수 있다. 그래서
 * 본문에 취소 링크를 크게 둔다. 취소 문턱을 낮추면 무단 불참이 취소로 바뀐다.
 *
 * 중복 발송 방지: reminded_at이 비어 있는 건만 골라 보내고 즉시 기록한다.
 * Cron이 두 번 돌거나 재시도돼도 같은 사람에게 두 번 가지 않는다.
 *
 * 인증: Vercel Cron은 CRON_SECRET이 설정돼 있으면 Authorization 헤더를 붙여
 * 보낸다. 이 라우트는 메일을 보내므로 아무나 호출하게 두면 안 된다.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: "email not configured", sent: 0 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "service key missing" }, { status: 500 });
  }

  // 지금부터 36시간 안에 시작하는 확정 예약 중 아직 안 보낸 것.
  // 24시간이 아니라 36인 이유 — cron이 하루 한 번이라 24로 자르면
  // 실행 시각과 회차 시각의 조합에 따라 통째로 건너뛰는 예약이 생긴다.
  const now = new Date();
  const until = new Date(now.getTime() + 36 * 3600_000);

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, form_key, starts_at")
    .gt("starts_at", now.toISOString())
    .lt("starts_at", until.toISOString());

  const rows = (sessions ?? []) as {
    id: string;
    form_key: string;
    starts_at: string;
  }[];
  if (rows.length === 0) return NextResponse.json({ sent: 0, checked: 0 });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, session_id, name, email, guests, locale, cancel_token")
    .in(
      "session_id",
      rows.map((s) => s.id),
    )
    .eq("status", "confirmed")
    .is("reminded_at", null)
    .not("email", "is", null);

  const targets = (bookings ?? []) as {
    id: string;
    session_id: string;
    name: string;
    email: string;
    guests: number;
    locale: "ko" | "en";
    cancel_token: string;
  }[];
  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, checked: rows.length });
  }

  const [origin, cfg, forms] = await Promise.all([
    getSiteOrigin(),
    getSiteConfig(),
    getForms(),
  ]);
  const sessionById = new Map(rows.map((s) => [s.id, s]));

  let sent = 0;
  let failed = 0;

  for (const b of targets) {
    const session = sessionById.get(b.session_id);
    if (!session) continue;
    const form = forms.find((f) => f.key === session.form_key);

    const data: BookingMailData = {
      locale: b.locale,
      guestName: b.name,
      experienceTitle: form ? pick(b.locale, form.title, form.title_en) : "",
      startsAt: session.starts_at,
      guests: b.guests,
      meetPlace: form ? pick(b.locale, form.meet_place, form.meet_place_en) : "",
      manageUrl: `${origin}/booking/${encodeURIComponent(b.cancel_token)}`,
      contactEmail: cfg.contact_email,
      contactPhone: cfg.contact_phone,
    };

    const mail = bookingReminder(data);
    const ok = await sendEmail({
      to: b.email,
      subject: mail.subject,
      html: mail.html,
      replyTo: cfg.contact_email,
    });

    if (ok) {
      // 보낸 직후에 기록한다. 여기서 실패하면 다음 실행에 한 번 더 갈 수 있지만,
      // 안 보낸 걸 보냈다고 적는 것보다는 두 번 가는 쪽이 낫다.
      await supabase
        .from("bookings")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", b.id);
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, checked: rows.length });
}
