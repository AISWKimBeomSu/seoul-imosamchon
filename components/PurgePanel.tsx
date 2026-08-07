"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ADMIN_EMPTY, purgeBookings } from "@/app/admin/bookings/actions";

/**
 * 개인정보 파기 (F16-4).
 *
 * 방침에 "체험 후 6개월 파기"라고 적어 뒀다. 그건 문장이 아니라 지켜야 하는
 * 의무고, 지킬 수단이 화면에 없으면 안 지켜진다.
 *
 * 되돌릴 수 없으므로 건수를 먼저 보여주고 확인을 한 번 받는다.
 */
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? "파기하는 중…" : "네, 파기합니다"}
    </Button>
  );
}

export default function PurgePanel({
  count,
  oldest,
}: {
  count: number;
  oldest: string | null;
}) {
  const [state, action] = useActionState(purgeBookings, ADMIN_EMPTY);
  const [asking, setAsking] = useState(false);

  if (state.message) {
    return (
      <p role="status" className="mt-8 rounded-[18px] bg-soft px-5 py-4 font-bold">
        {state.message}
      </p>
    );
  }

  // 파기할 게 없으면 굳이 자리를 차지하지 않는다.
  if (count === 0) return null;

  const oldestLabel = oldest
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
      }).format(new Date(oldest))
    : "";

  return (
    <section className="mt-10 rounded-[22px] border border-line bg-soft px-6 py-5">
      <h2 className="m-0 text-[1.15rem] font-extrabold">개인정보 파기 대상</h2>
      <p className="mt-2 mb-0">
        체험이 끝난 지 6개월이 지난 예약이 <strong>{count}건</strong> 있습니다.
        {oldestLabel && ` 가장 오래된 것은 ${oldestLabel} 회차입니다.`}
      </p>
      <p className="mt-2 text-sub">
        개인정보처리방침에 적어 둔 보유기간이 지났습니다. 성함·연락처·이메일이
        함께 지워지고, 예약이 없어진 지난 회차도 정리됩니다. 되돌릴 수 없습니다.
      </p>

      {asking ? (
        <form action={action} className="mt-4 flex flex-wrap gap-3">
          <Button type="button" size="sm" onClick={() => setAsking(false)}>
            아니요, 그대로 둘게요
          </Button>
          <Submit />
        </form>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => setAsking(true)}
        >
          {count}건 파기하기
        </Button>
      )}
    </section>
  );
}
