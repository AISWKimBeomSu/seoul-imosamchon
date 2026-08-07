import "server-only";

import { pick, type Locale } from "@/lib/i18n";
import { formatSessionWhen } from "@/lib/sessions";

/**
 * 예약 안내 메일.
 *
 * SDK를 넣지 않고 Resend REST를 fetch로 부른다(ADR-16). 이 앱은 의존성이 적은
 * 편이고, 메일 한 종류 보내자고 패키지를 다는 것보다 40줄 쓰는 편이 낫다.
 *
 * 키가 없으면 아무것도 안 하고 false를 돌려준다 — 메일이 안 나가는 것이
 * 예약 자체를 막아서는 안 된다(F13-4). 운영자는 admin 배너로 알게 된다.
 * (lib/supabase/service.ts가 키 없을 때 null을 주는 것과 같은 태도)
 *
 * 참조: docs/PLATFORM.md §14, F13
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.BOOKING_FROM_EMAIL);
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  /** 회신은 사람에게 간다. noreply로 보내면 답장이 허공으로 사라진다. */
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_FROM_EMAIL;
  if (!key || !from) return false;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      // 토큰이 담긴 본문은 남기지 않는다. 상태 코드만으로 충분히 진단된다.
      console.error(`[email] send failed: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send threw:", e instanceof Error ? e.message : e);
    return false;
  }
}

// ── 템플릿 ──────────────────────────────────────────────────────────────────
// React Email을 쓰지 않는다. 메일 클라이언트는 2026년에도 1998년의 HTML을 읽으므로
// 인라인 스타일 테이블이 결국 정답이고, 그건 문자열로 쓰는 게 제일 짧다.

export type BookingMailData = {
  locale: Locale;
  guestName: string;
  experienceTitle: string;
  startsAt: string; // ISO
  guests: number;
  meetPlace: string;
  /** 예약 조회·취소 절대 URL */
  manageUrl: string;
  contactEmail: string;
  contactPhone: string | null;
  declineReason?: string;
};

const BRAND = "#4E6A18";
const INK = "#22261c";

function shell(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f6f7f2;font-family:'Noto Sans KR',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${INK};font-size:17px;line-height:1.7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:22px;padding:32px 28px">
<tr><td>${bodyHtml}<div style="margin-top:28px;padding-top:20px;border-top:1px solid #e7e9e0;font-size:15px;color:#5c6155">${footerHtml}</div></td></tr>
</table></body></html>`;
}

function detailRows(d: BookingMailData): string {
  const en = d.locale === "en";
  const rows: [string, string][] = [
    [en ? "Experience" : "체험", d.experienceTitle],
    [en ? "When" : "일시", formatSessionWhen(d.startsAt, d.locale)],
    [en ? "Guests" : "인원", en ? `${d.guests} people` : `${d.guests}명`],
  ];
  if (d.meetPlace) rows.push([en ? "Where" : "만나는 곳", d.meetPlace]);

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f6f7f2;border-radius:16px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:10px 16px;color:#5c6155;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:10px 16px;font-weight:700">${escapeHtml(v)}</td></tr>`,
  )
  .join("")}
</table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function manageButton(d: BookingMailData): string {
  const label = pick(d.locale, "예약 확인·취소하기", "View or cancel my booking");
  return `<p style="margin:24px 0"><a href="${d.manageUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:16px 28px;border-radius:999px;font-weight:700;font-size:17px">${label}</a></p>`;
}

function contactFooter(d: BookingMailData): string {
  const en = d.locale === "en";
  const lines = [
    en
      ? `Questions? Just reply to this email — a person reads it.`
      : `궁금한 점은 이 메일에 그대로 답장 주세요. 사람이 읽습니다.`,
  ];
  if (d.contactPhone) {
    lines.push(en ? `Phone: ${d.contactPhone}` : `전화: ${d.contactPhone}`);
  }
  lines.push(en ? "Seoul Imo·Samchon" : "서울이모삼촌");
  return lines.join("<br>");
}

/** ① 신청 접수 — 게스트 */
export function bookingReceived(d: BookingMailData) {
  const en = d.locale === "en";
  return {
    subject: en
      ? `We received your booking request — ${d.experienceTitle}`
      : `예약 신청이 접수되었습니다 — ${d.experienceTitle}`,
    html: shell(
      `<p style="margin:0 0 8px;font-size:20px;font-weight:800">${
        en ? `Thank you, ${escapeHtml(d.guestName)}!` : `${escapeHtml(d.guestName)}님, 신청해 주셔서 고맙습니다.`
      }</p>
<p style="margin:0">${
        en
          ? "We have your request. This is not a confirmation yet — we will check the details and get back to you <strong>within 24 hours</strong>."
          : "신청을 잘 받았습니다. 아직 확정은 아니고, <strong>24시간 안에</strong> 확인해서 다시 안내드릴게요."
      }</p>
${detailRows(d)}
${manageButton(d)}
<p style="margin:0;font-size:15px;color:#5c6155">${
        en
          ? "Keep this email — the button above is how you check or cancel your booking."
          : "이 메일을 지우지 마세요. 위 버튼으로 예약을 확인하거나 취소하실 수 있습니다."
      }</p>`,
      contactFooter(d),
    ),
  };
}

/** ② 확정 — 게스트 */
export function bookingConfirmed(d: BookingMailData) {
  const en = d.locale === "en";
  return {
    subject: en
      ? `Confirmed — ${d.experienceTitle}`
      : `예약이 확정되었습니다 — ${d.experienceTitle}`,
    html: shell(
      `<p style="margin:0 0 8px;font-size:20px;font-weight:800">${
        en ? "Your booking is confirmed" : "예약이 확정되었습니다"
      }</p>
<p style="margin:0">${
        en
          ? `See you there, ${escapeHtml(d.guestName)}. Here are the details.`
          : `${escapeHtml(d.guestName)}님, 그날 뵙겠습니다. 아래 내용을 확인해 주세요.`
      }</p>
${detailRows(d)}
<p style="margin:0 0 4px;font-weight:700">${en ? "Before you come" : "오시기 전에"}</p>
<ul style="margin:0 0 20px;padding-left:20px">
<li>${en ? "Please arrive a few minutes early — we start on time." : "시작 시각에 맞춰 조금 일찍 와 주세요."}</li>
<li>${en ? "If anything changes, cancel using the button below so someone else can take the place." : "사정이 생기시면 아래 버튼으로 취소해 주세요. 다른 분이 그 자리에 오실 수 있습니다."}</li>
</ul>
${manageButton(d)}`,
      contactFooter(d),
    ),
  };
}

/** ③ 거절 — 게스트. 승인제를 두면 반드시 필요한 편지다. */
export function bookingDeclined(d: BookingMailData) {
  const en = d.locale === "en";
  const reason = (d.declineReason ?? "").trim();
  return {
    subject: en
      ? `We couldn't confirm your booking — ${d.experienceTitle}`
      : `예약을 확정하지 못했습니다 — ${d.experienceTitle}`,
    html: shell(
      `<p style="margin:0 0 8px;font-size:20px;font-weight:800">${
        en ? "We're sorry" : "죄송합니다"
      }</p>
<p style="margin:0">${
        en
          ? `${escapeHtml(d.guestName)}, we were not able to confirm this booking.`
          : `${escapeHtml(d.guestName)}님, 이번 신청은 확정해 드리지 못했습니다.`
      }</p>
${reason ? `<p style="margin:16px 0;padding:14px 18px;background:#f6f7f2;border-radius:16px">${escapeHtml(reason)}</p>` : ""}
${detailRows(d)}
<p style="margin:0">${
        en
          ? "Other dates may still be open — please take a look, or just reply to this email and we'll help you find one."
          : "다른 회차는 아직 자리가 있을 수 있습니다. 한번 살펴보시거나, 이 메일에 답장 주시면 함께 찾아드릴게요."
      }</p>
<p style="margin:16px 0 0">${en ? "No fee has been charged." : "참가비는 청구되지 않았습니다."}</p>`,
      contactFooter(d),
    ),
  };
}

/** ④ 취소 확인 — 게스트 */
export function bookingCancelled(d: BookingMailData) {
  const en = d.locale === "en";
  return {
    subject: en
      ? `Cancelled — ${d.experienceTitle}`
      : `예약이 취소되었습니다 — ${d.experienceTitle}`,
    html: shell(
      `<p style="margin:0 0 8px;font-size:20px;font-weight:800">${
        en ? "Your booking is cancelled" : "예약이 취소되었습니다"
      }</p>
<p style="margin:0">${
        en
          ? "The place has been released. Nothing else is needed from you."
          : "자리는 다시 열렸습니다. 더 하실 일은 없습니다."
      }</p>
${detailRows(d)}
<p style="margin:0">${
        en
          ? "We hope to see you another time."
          : "다음에 또 뵐 수 있으면 좋겠습니다."
      }</p>`,
      contactFooter(d),
    ),
  };
}

/** ⑤ D-1 리마인더 (Phase 3) */
export function bookingReminder(d: BookingMailData) {
  const en = d.locale === "en";
  return {
    subject: en
      ? `Tomorrow — ${d.experienceTitle}`
      : `내일 뵙겠습니다 — ${d.experienceTitle}`,
    html: shell(
      `<p style="margin:0 0 8px;font-size:20px;font-weight:800">${
        en ? "See you tomorrow" : "내일 뵙겠습니다"
      }</p>
<p style="margin:0">${
        en
          ? `${escapeHtml(d.guestName)}, here's a reminder of where and when.`
          : `${escapeHtml(d.guestName)}님, 장소와 시간을 다시 알려드립니다.`
      }</p>
${detailRows(d)}
<p style="margin:0;font-size:15px;color:#5c6155">${
        en
          ? "If you can no longer come, please cancel below — it takes a second and frees the place."
          : "혹시 못 오시게 되면 아래에서 취소해 주세요. 잠깐이면 되고, 그 자리를 다른 분이 쓰실 수 있습니다."
      }</p>
${manageButton(d)}`,
      contactFooter(d),
    ),
  };
}

/** 운영자 통지 — 새 신청. 관리자 페이지를 매일 열지 않아도 되게 하는 장치(G6). */
export function adminNewBooking(d: BookingMailData & { adminUrl: string; phone: string; email: string | null; note: string }) {
  const rows = [
    ["체험", d.experienceTitle],
    ["일시", formatSessionWhen(d.startsAt, "ko")],
    ["신청자", `${d.guestName} (${d.guests}명)`],
    ["연락처", d.phone],
    ["이메일", d.email ?? "— (전화 접수)"],
    ["요청사항", d.note || "—"],
  ] as [string, string][];

  return {
    subject: `[예약 신청] ${d.experienceTitle} · ${d.guestName}님 ${d.guests}명`,
    html: shell(
      `<p style="margin:0 0 8px;font-size:20px;font-weight:800">새 예약 신청</p>
<p style="margin:0">24시간 안에 확정 또는 거절 안내를 보내야 합니다.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f6f7f2;border-radius:16px">
${rows.map(([k, v]) => `<tr><td style="padding:10px 16px;color:#5c6155;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:10px 16px;font-weight:700">${escapeHtml(v)}</td></tr>`).join("")}
</table>
<p style="margin:24px 0"><a href="${d.adminUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:16px 28px;border-radius:999px;font-weight:700">관리자에서 처리하기</a></p>`,
      "서울이모삼촌 운영 알림",
    ),
  };
}
