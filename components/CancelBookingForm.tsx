"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cancelBooking, type CancelState } from "@/app/booking/[token]/actions";

/**
 * 취소 버튼 → 확인 → 실행.
 *
 * 한 번에 취소되게 하지 않는다. 되돌릴 수 없는 일에는 확인 단계를 둔다 —
 * 다만 단계는 하나뿐이고, 그 화면에서 '그대로 둘게요'가 먼저 눈에 들어오게 한다.
 */
const EMPTY: CancelState = { done: false, failed: false };

function ConfirmButton({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? busy : label}
    </Button>
  );
}

export default function CancelBookingForm({
  token,
  locale,
  contactPhone,
}: {
  token: string;
  locale: "ko" | "en";
  contactPhone: string | null;
}) {
  const [state, action] = useActionState(cancelBooking, EMPTY);
  const [asking, setAsking] = useState(false);
  const en = locale === "en";

  const T = {
    cancel: en ? "Cancel this booking" : "예약 취소하기",
    confirm: en ? "Are you sure you want to cancel?" : "정말 취소하시겠어요?",
    confirmHelp: en
      ? "Cancelling releases your place. To come back you'd need to book again."
      : "취소하면 자리가 다시 열립니다. 되돌리려면 새로 신청하셔야 합니다.",
    yes: en ? "Yes, cancel it" : "네, 취소합니다",
    no: en ? "No, keep my booking" : "아니요, 그대로 둘게요",
    busy: en ? "Cancelling…" : "취소하는 중…",
    done: en ? "Your booking is cancelled." : "예약이 취소되었습니다.",
    failed: en
      ? "We couldn't cancel it — the start time may have passed, or it's already been handled. Please call us."
      : "취소하지 못했습니다. 시작 시각이 지났거나 이미 처리된 예약입니다. 전화 주시면 도와드리겠습니다.",
  };

  if (state.done) {
    return (
      <p
        role="status"
        className="rounded-[18px] border border-line bg-soft px-5 py-4 font-bold"
      >
        {T.done}
      </p>
    );
  }

  if (!asking) {
    return (
      <>
        <Button type="button" variant="outline" onClick={() => setAsking(true)}>
          {T.cancel}
        </Button>
        {state.failed && (
          <p role="alert" className="mt-3 font-bold text-danger">
            {T.failed}
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
      </>
    );
  }

  return (
    <div className="rounded-[22px] border border-danger-line bg-danger-soft px-6 py-5">
      <p className="m-0 text-[1.1rem] font-extrabold">{T.confirm}</p>
      <p className="mt-1 mb-4 text-sub">{T.confirmHelp}</p>
      <form action={action} className="flex flex-wrap gap-3">
        <input type="hidden" name="token" value={token} />
        {/* 되돌리는 쪽을 먼저 둔다 */}
        <Button type="button" onClick={() => setAsking(false)}>
          {T.no}
        </Button>
        <ConfirmButton label={T.yes} busy={T.busy} />
      </form>
    </div>
  );
}
