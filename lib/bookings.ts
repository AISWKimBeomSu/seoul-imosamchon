/**
 * 예약. 서버·클라이언트 공용 순수 로직만 둔다.
 * DB 조회·RPC 호출은 lib/bookings.server.ts.
 *
 * 참조: docs/PLATFORM.md §11.4·§13, F11·F12
 */

export type BookingStatus =
  | "requested" // 신청 접수 — 아직 자리는 잡았지만 확정은 아님
  | "confirmed" // 운영자 승인
  | "declined" // 운영자 거절
  | "cancelled" // 게스트 또는 운영자 취소
  | "no_show" // 확정됐으나 오지 않음
  | "done"; // 참여 완료

/** 좌석을 점유하는 상태. DB의 admin_set_booking_status RPC와 같은 정의여야 한다. */
export const SEAT_HOLDING: BookingStatus[] = [
  "requested",
  "confirmed",
  "no_show",
  "done",
];

export function holdsSeat(status: BookingStatus): boolean {
  return SEAT_HOLDING.includes(status);
}

/** 게스트가 스스로 취소할 수 있는 상태 */
export function isCancellable(status: BookingStatus): boolean {
  return status === "requested" || status === "confirmed";
}

export type Booking = {
  id: string;
  session_id: string;
  name: string;
  email: string | null;
  phone: string;
  guests: number;
  note: string;
  locale: "ko" | "en";
  status: BookingStatus;
  source: "web" | "admin";
  decline_reason: string;
  cancel_token: string;
  created_at: string;
};

export const BOOKING_COLS =
  "id, session_id, name, email, phone, guests, note, locale, status, source, decline_reason, cancel_token, created_at";

// ── 입력 검증 ───────────────────────────────────────────────────────────────
// zod를 넣지 않는다. 필드 다섯 개에 라이브러리를 하나 더 다는 것보다,
// DB CHECK와 같은 규칙을 눈으로 대조할 수 있게 여기 적어 두는 편이 낫다.
// (규칙이 갈라지면 DB가 거부하는데 화면은 통과시키는 상황이 된다)

export type BookingInput = {
  name: string;
  email: string;
  phone: string;
  guests: number;
  note: string;
  consent: boolean;
  ageConfirmed: boolean;
};

export type FieldError = { field: keyof BookingInput; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** DB의 bookings_phone_check와 같은 규칙 — 기호는 허용하되 숫자 8자 이상 */
const PHONE_SHAPE_RE = /^[0-9+\-\s()]{9,25}$/;

export function digitsOf(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

/**
 * 에러 문구는 "무엇이 잘못됐는지"가 아니라 "무엇을 하면 되는지"로 쓴다.
 * "올바른 형식이 아닙니다"는 시니어에게 아무것도 알려주지 않는다.
 */
export function validateBooking(
  input: BookingInput,
  maxGuests: number,
  locale: "ko" | "en",
  opts: { requireEmail?: boolean } = {},
): FieldError[] {
  const en = locale === "en";
  const errors: FieldError[] = [];
  const requireEmail = opts.requireEmail ?? true;

  const name = input.name.trim();
  if (!name) {
    errors.push({
      field: "name",
      message: en ? "Please enter your name." : "이름을 적어 주세요.",
    });
  } else if (name.length > 50) {
    errors.push({
      field: "name",
      message: en
        ? "Please use 50 characters or fewer."
        : "이름은 50자까지 적을 수 있어요.",
    });
  }

  const email = input.email.trim();
  if (requireEmail && !email) {
    errors.push({
      field: "email",
      message: en
        ? "We send your confirmation here, so we need an email address."
        : "확정 안내를 보내드릴 이메일 주소가 필요해요.",
    });
  } else if (email && !EMAIL_RE.test(email)) {
    errors.push({
      field: "email",
      message: en
        ? "Please check the email address — it needs an @ and a domain."
        : "이메일 주소를 다시 확인해 주세요. @와 주소가 모두 필요해요.",
    });
  }

  const phone = input.phone.trim();
  if (!phone) {
    errors.push({
      field: "phone",
      message: en
        ? "Please enter a phone number we can reach you on."
        : "연락받으실 전화번호를 적어 주세요.",
    });
  } else if (!PHONE_SHAPE_RE.test(phone) || digitsOf(phone) < 8) {
    errors.push({
      field: "phone",
      message: en
        ? "Please enter at least 8 digits. International numbers are fine (+34…)."
        : "숫자를 8자 이상 적어 주세요. 해외 번호도 괜찮아요.",
    });
  }

  if (!Number.isInteger(input.guests) || input.guests < 1) {
    errors.push({
      field: "guests",
      message: en ? "Please choose at least 1 person." : "인원을 1명 이상 골라 주세요.",
    });
  } else if (input.guests > maxGuests) {
    errors.push({
      field: "guests",
      message: en
        ? `This session can take up to ${maxGuests} people.`
        : `이 회차는 ${maxGuests}명까지 예약할 수 있어요.`,
    });
  }

  if (input.note.length > 500) {
    errors.push({
      field: "note",
      message: en
        ? "Please use 500 characters or fewer."
        : "요청사항은 500자까지 적을 수 있어요.",
    });
  }

  if (!input.consent) {
    errors.push({
      field: "consent",
      message: en
        ? "Please agree to the collection of your personal data so we can process the booking."
        : "예약을 처리하려면 개인정보 수집·이용 동의가 필요해요.",
    });
  }

  if (!input.ageConfirmed) {
    errors.push({
      field: "ageConfirmed",
      message: en
        ? "Bookings are for guests aged 14 and over."
        : "만 14세 이상만 예약하실 수 있어요.",
    });
  }

  return errors;
}

/** RPC가 던지는 예외 코드를 사람이 읽는 문장으로. 코드가 새어 나가면 안 된다. */
export function bookingErrorMessage(raw: string, locale: "ko" | "en"): string {
  const en = locale === "en";
  if (raw.includes("CAPACITY_EXCEEDED")) {
    return en
      ? "That session just filled up. Please choose another date."
      : "방금 자리가 찼습니다. 다른 회차를 골라 주세요.";
  }
  if (raw.includes("SESSION_CLOSED")) {
    return en
      ? "Bookings for this session are closed. Please choose another date."
      : "이 회차는 마감되었습니다. 다른 회차를 골라 주세요.";
  }
  if (raw.includes("SESSION_NOT_FOUND") || raw.includes("NOT_BOOKABLE")) {
    return en
      ? "This experience is not taking bookings right now."
      : "지금은 이 체험을 예약받고 있지 않습니다.";
  }
  return en
    ? "Something went wrong on our side. Please try again, or call us."
    : "저희 쪽에서 문제가 생겼어요. 다시 시도하시거나 전화 주세요.";
}

/** 상태 배지 문구 */
export function statusLabel(status: BookingStatus, locale: "ko" | "en"): string {
  const ko: Record<BookingStatus, string> = {
    requested: "확정 대기",
    confirmed: "예약 확정",
    declined: "예약 불가",
    cancelled: "취소됨",
    no_show: "불참",
    done: "참여 완료",
  };
  const en: Record<BookingStatus, string> = {
    requested: "Awaiting confirmation",
    confirmed: "Confirmed",
    declined: "Not available",
    cancelled: "Cancelled",
    no_show: "No-show",
    done: "Completed",
  };
  return locale === "en" ? en[status] : ko[status];
}
