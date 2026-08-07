"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_INIT, createExperience } from "@/app/admin/experiences/actions";

/**
 * 새 체험 만들기.
 *
 * 키와 제목만 받고 나머지는 편집 화면에서 채우게 한다. 처음부터 20개 필드를
 * 내밀면 뭘 넣어야 할지 몰라 아예 시작을 못 한다.
 */
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "만드는 중…" : "만들기"}
    </Button>
  );
}

export default function NewExperience() {
  const [state, action] = useActionState(createExperience, ADMIN_INIT);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          + 새 체험 만들기
        </Button>
        {state.ok && state.message && (
          <p role="status" className="mt-3 font-bold text-point-dark">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 rounded-[22px] border border-line bg-soft px-6 py-5">
      <h2 className="mb-4 text-[1.15rem] font-extrabold">새 체험</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-title">제목</Label>
          <Input
            id="new-title"
            name="title"
            required
            placeholder="예: 한지공예 클래스"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="new-key">키 (주소에 쓰입니다)</Label>
          <Input
            id="new-key"
            name="key"
            required
            pattern="[a-z][a-z0-9-]{1,30}"
            placeholder="hanji"
            className="mt-1.5 font-mono"
          />
          <p className="mt-1.5 text-[0.95rem] text-sub">
            영문 소문자·숫자·하이픈만. 만든 뒤에는 바꿀 수 없습니다 — 주소와
            인쇄된 QR이 이 값을 물고 있어서입니다.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="new-audience">누구를 위한 것인가</Label>
        <select
          id="new-audience"
          name="audience"
          defaultValue="guest"
          className="mt-1.5 min-h-[50px] w-full rounded-[12px] border border-line bg-white px-4 text-base sm:w-64"
        >
          <option value="guest">손님 (체험 참가자)</option>
          <option value="senior">시니어 (호스트 모집)</option>
        </select>
      </div>

      <p className="mt-5 rounded-[12px] bg-white px-4 py-3 text-sub">
        만들면 <strong>비공개 상태</strong>로 시작합니다. 내용을 다 채운 뒤에
        편집 화면에서 &lsquo;사이트에 보이기&rsquo;를 켜면 손님에게 노출됩니다.
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
