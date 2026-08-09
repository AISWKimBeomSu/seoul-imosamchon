"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ACTION_INIT } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualBooking } from "@/app/admin/bookings/actions";
import { formatSessionWhen, remainingSeats, type Session } from "@/lib/sessions";

/**
 * 전화·종이 접수분을 운영자가 대신 등록.
 *
 * 이메일을 안 쓰시는 시니어 게스트의 유일한 예약 경로다. 그리고 전화로 받은
 * 신청이 여기를 거치지 않으면 정원 밖에서 돌아 잔여석 표시가 통째로 거짓이 된다.
 */
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "등록 중…" : "예약 등록"}
    </Button>
  );
}

export type SessionOption = Session & { formTitle: string };

export default function ManualBooking({ sessions }: { sessions: SessionOption[] }) {
  const [state, action] = useActionState(createManualBooking, ACTION_INIT);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          + 전화로 받은 예약 등록
        </Button>
        {state.ok && state.message && (
          <p role="status" className="mt-3 font-bold text-point-dark">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mt-6 rounded-[18px] bg-soft px-5 py-4 text-sub">
        예약을 받을 수 있는 회차가 없습니다. 체험 관리에서 회차를 먼저 열어 주세요.
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 rounded-[22px] border border-line bg-soft px-6 py-5">
      <h2 className="mb-1 text-[1.15rem] font-extrabold">전화로 받은 예약 등록</h2>
      <p className="mb-5 text-sub">
        이메일이 없으셔도 됩니다. 대신 확정 안내는 전화로 직접 드려야 합니다.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="mb-session">회차</Label>
          <select
            id="mb-session"
            name="session_id"
            required
            className="mt-1.5 min-h-[50px] w-full rounded-[12px] border border-line bg-white px-4 text-base"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.formTitle} · {formatSessionWhen(s.starts_at, "ko")} (남은 자리{" "}
                {remainingSeats(s)}명)
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="mb-name">성함</Label>
          <Input id="mb-name" name="name" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="mb-guests">인원</Label>
          <Input
            id="mb-guests"
            name="guests"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="mb-phone">전화번호</Label>
          <Input id="mb-phone" name="phone" type="tel" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="mb-email">
            이메일 <span className="font-normal text-sub">(없으면 비워 두세요)</span>
          </Label>
          <Input id="mb-email" name="email" type="email" className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mb-note">요청사항</Label>
          <Input
            id="mb-note"
            name="note"
            className="mt-1.5"
            placeholder="알레르기, 거동이 불편한 점 등"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mb-memo">
            관리자 메모 <span className="font-normal text-sub">(손님에게 안 보입니다)</span>
          </Label>
          <Input
            id="mb-memo"
            name="memo"
            className="mt-1.5"
            placeholder="예: 8/7 오후 전화 접수, 자녀분이 대신 신청"
          />
        </div>
      </div>

      <p className="mt-5 rounded-[12px] bg-white px-4 py-3 text-sub">
        등록하면 <strong>확정 대기</strong> 상태로 들어갑니다. 위 목록에서 승인해
        주세요 — 그때 정식으로 자리가 확정되고 기록이 남습니다.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Submit />
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          그만두기
        </Button>
        {state.message && !state.ok && (
          <span role="alert" className="font-bold text-danger">
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
