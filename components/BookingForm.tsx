"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import GuestStepper from "@/components/GuestStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitBooking, type BookingFormState } from "@/app/book/[key]/actions";
import type { FieldError } from "@/lib/bookings";

/**
 * 예약 폼.
 *
 * 라벨은 입력창 위에 늘 있다 — placeholder를 라벨로 쓰면 글자를 넣는 순간
 * 사라져서, 무엇을 적던 중인지 잃어버린다. 에러는 해당 칸 바로 아래에
 * 무엇을 하면 되는지로 적는다.
 *
 * 참조: docs/PLATFORM.md §8.2·§13.1
 */

const EMPTY: BookingFormState = { errors: [], message: "" };

function errorFor(errors: FieldError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

function FieldNote({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[0.95rem] text-sub">
      {children}
    </p>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 font-bold text-danger" role="alert">
      {message}
    </p>
  );
}

function SubmitButton({ label, busyLabel }: { label: string; busyLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? busyLabel : label}
    </Button>
  );
}

export default function BookingForm({
  formKey,
  sessionId,
  maxGuests,
  locale,
  contactPhone,
}: {
  formKey: string;
  sessionId: string;
  maxGuests: number;
  locale: "ko" | "en";
  contactPhone: string | null;
}) {
  const [state, action] = useActionState(submitBooking, EMPTY);
  const en = locale === "en";
  const errors = state.errors;

  const T = {
    details: en ? "How we reach you" : "연락받으실 곳",
    name: en ? "Your name" : "성함",
    email: en ? "Email" : "이메일",
    emailHelp: en
      ? "We send your confirmation and cancellation link here."
      : "확정 안내와 취소 링크를 이 주소로 보내드립니다.",
    phone: en ? "Phone" : "전화번호",
    phoneHelp: en
      ? "Only used if something urgent comes up on the day. International numbers are fine (+34…)."
      : "당일 급한 일이 있을 때만 씁니다.",
    note: en ? "Anything we should know" : "미리 알려주실 것",
    noteHelp: en
      ? "Allergies, mobility needs, or anything you'd like help with."
      : "알레르기, 거동이 불편한 점, 도움이 필요한 부분을 적어 주세요.",
    consent: en
      ? "I agree to the collection and use of my personal data (required)"
      : "개인정보 수집·이용에 동의합니다 (필수)",
    consentDetail: en
      ? "We collect your name, email, phone and party size to handle the booking, and delete them 6 months after the experience."
      : "성함·이메일·전화번호·인원을 예약 처리와 안내 목적으로 받고, 체험 후 6개월이 지나면 지웁니다.",
    policy: en ? "Read the privacy policy" : "개인정보처리방침 보기",
    age: en ? "I am 14 or older (required)" : "만 14세 이상입니다 (필수)",
    submit: en ? "Request booking" : "예약 신청하기",
    busy: en ? "Sending…" : "보내는 중…",
    optional: en ? "optional" : "선택",
  };

  return (
    <form action={action} className="flex flex-col gap-7">
      <input type="hidden" name="formKey" value={formKey} />
      <input type="hidden" name="sessionId" value={sessionId} />

      {/* 봇 함정. 사람에게는 보이지도, 읽히지도, 탭으로 닿지도 않는다. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <GuestStepper max={maxGuests} locale={locale} />

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-4 text-[1.25rem] font-extrabold">{T.details}</legend>

        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="name">{T.name}</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              className="mt-1.5"
              aria-describedby={errorFor(errors, "name") ? "name-error" : undefined}
              aria-invalid={Boolean(errorFor(errors, "name"))}
            />
            <FieldError id="name-error" message={errorFor(errors, "name")} />
          </div>

          <div>
            <Label htmlFor="email">{T.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="mt-1.5"
              aria-describedby={`email-help${errorFor(errors, "email") ? " email-error" : ""}`}
              aria-invalid={Boolean(errorFor(errors, "email"))}
            />
            <FieldNote id="email-help">{T.emailHelp}</FieldNote>
            <FieldError id="email-error" message={errorFor(errors, "email")} />
          </div>

          <div>
            <Label htmlFor="phone">{T.phone}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              className="mt-1.5"
              aria-describedby={`phone-help${errorFor(errors, "phone") ? " phone-error" : ""}`}
              aria-invalid={Boolean(errorFor(errors, "phone"))}
            />
            <FieldNote id="phone-help">{T.phoneHelp}</FieldNote>
            <FieldError id="phone-error" message={errorFor(errors, "phone")} />
          </div>

          <div>
            <Label htmlFor="note">
              {T.note}{" "}
              <span className="font-normal text-sub">({T.optional})</span>
            </Label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={500}
              className="mt-1.5 w-full rounded-[12px] border border-line bg-white px-4 py-3 text-base leading-relaxed focus-visible:border-point focus-visible:outline-none"
              aria-describedby="note-help"
            />
            <FieldNote id="note-help">{T.noteHelp}</FieldNote>
            <FieldError id="note-error" message={errorFor(errors, "note")} />
          </div>
        </div>
      </fieldset>

      <fieldset className="m-0 rounded-[22px] border border-line bg-soft px-6 py-5">
        <legend className="sr-only">{T.consent}</legend>

        <label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            className="mt-1 size-6 shrink-0 accent-point"
            aria-describedby="consent-detail"
          />
          <span className="font-bold">{T.consent}</span>
        </label>
        <p id="consent-detail" className="mt-2 pl-9 text-[0.95rem] text-sub">
          {T.consentDetail}{" "}
          <Link href="/privacy" className="underline">
            {T.policy}
          </Link>
        </p>
        <FieldError id="consent-error" message={errorFor(errors, "consent")} />

        <label htmlFor="ageConfirmed" className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            id="ageConfirmed"
            name="ageConfirmed"
            type="checkbox"
            required
            className="mt-1 size-6 shrink-0 accent-point"
          />
          <span className="font-bold">{T.age}</span>
        </label>
        <FieldError id="age-error" message={errorFor(errors, "ageConfirmed")} />
      </fieldset>

      {/* 정원 마감처럼 어느 칸의 문제도 아닌 실패 */}
      {state.message && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-[18px] border border-danger-line bg-danger-soft px-5 py-4 font-bold text-danger"
        >
          {state.message}
          {contactPhone && (
            <>
              {" "}
              <a href={`tel:${contactPhone}`} className="underline">
                {contactPhone}
              </a>
            </>
          )}
        </p>
      )}

      <SubmitButton label={T.submit} busyLabel={T.busy} />
    </form>
  );
}
