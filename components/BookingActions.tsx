"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  ADMIN_EMPTY,
  resendManageLink,
  updateBookingStatus,
} from "@/app/admin/bookings/actions";
import type { BookingStatus } from "@/lib/bookings";

/**
 * 예약 한 건의 처리 버튼들.
 *
 * 거절은 사유를 받는다 — 승인제를 두면 "왜 안 되는지" 한 줄이 게스트에게
 * 가야 한다. 사유 없이 거절 메일만 가면 예약이 조용히 사라진 것과 같다.
 *
 * useFormStatus는 반드시 <form> **안쪽** 컴포넌트에서 불러야 그 폼의 상태를
 * 읽는다. 그래서 제출 버튼을 별도 컴포넌트로 뺐다.
 */

function SubmitButton({
  label,
  busyLabel = "처리 중…",
  variant = "default",
  size = "sm",
}: {
  label: string;
  busyLabel?: string;
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "sm" | "xs";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} variant={variant} disabled={pending}>
      {pending ? busyLabel : label}
    </Button>
  );
}

export default function BookingActions({
  id,
  status,
  hasEmail,
}: {
  id: string;
  status: BookingStatus;
  hasEmail: boolean;
}) {
  // 상태 변경은 어느 버튼을 눌렀든 결과가 한 곳에 모여야 한다.
  const [state, statusAction] = useActionState(updateBookingStatus, ADMIN_EMPTY);
  const [resendState, resendAction] = useActionState(resendManageLink, ADMIN_EMPTY);
  const [declining, setDeclining] = useState(false);

  const note = state.message || resendState.message;
  const noteOk = state.ok || resendState.ok;

  return (
    <div className="mt-3">
      {status === "requested" && !declining && (
        <div className="flex flex-wrap gap-2">
          <form action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="confirmed" />
            <SubmitButton label="승인" />
          </form>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDeclining(true)}
          >
            거절
          </Button>
        </div>
      )}

      {status === "requested" && declining && (
        <form action={statusAction} className="rounded-[16px] bg-soft px-4 py-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="declined" />
          <label htmlFor={`reason-${id}`} className="block font-bold">
            거절 사유{" "}
            <span className="font-normal text-sub">
              (게스트에게 그대로 전달됩니다)
            </span>
          </label>
          <textarea
            id={`reason-${id}`}
            name="reason"
            rows={2}
            required
            placeholder="예: 이 회차는 최소 인원이 모이지 않아 진행하지 못하게 되었습니다."
            className="mt-1.5 w-full rounded-[12px] border border-line bg-white px-3 py-2 text-base"
          />
          <div className="mt-2 flex gap-2">
            <SubmitButton label="거절하고 안내 보내기" />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDeclining(false)}
            >
              그만두기
            </Button>
          </div>
        </form>
      )}

      {status === "confirmed" && (
        <div className="flex flex-wrap gap-2">
          <form action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="done" />
            <SubmitButton label="참여 완료" variant="outline" />
          </form>
          <form action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="no_show" />
            <SubmitButton label="불참" variant="outline" />
          </form>
          <form action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="cancelled" />
            <SubmitButton label="취소 처리" variant="destructive" />
          </form>
        </div>
      )}

      {hasEmail && (status === "requested" || status === "confirmed") && (
        <form action={resendAction} className="mt-2">
          <input type="hidden" name="id" value={id} />
          <SubmitButton
            label="안내 메일 다시 보내기"
            busyLabel="보내는 중…"
            variant="ghost"
            size="xs"
          />
        </form>
      )}

      {note && (
        <p
          role="status"
          className={`mt-2 font-bold ${noteOk ? "text-point-dark" : "text-danger"}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}
