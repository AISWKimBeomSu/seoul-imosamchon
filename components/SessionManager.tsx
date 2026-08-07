"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_INIT,
  createSession,
  updateSession,
} from "@/app/admin/experiences/actions";
import {
  formatSessionWhen,
  remainingSeats,
  sessionState,
  type AdminSession,
} from "@/lib/sessions";

/**
 * 회차 관리.
 *
 * 예약 인원(booked_count)은 읽기 전용이다. 여기서 손으로 고칠 수 있게 하면
 * 예약 행과 카운트가 어긋나고, 그 불일치는 화면 어디에도 안 드러난다.
 * 인원을 바꾸는 길은 예약을 취소하는 것뿐이다(ADR-15).
 */

function Submit({ label, busy = "처리 중…", variant = "default", size = "sm" }: {
  label: string;
  busy?: string;
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "sm" | "xs";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} variant={variant} disabled={pending}>
      {pending ? busy : label}
    </Button>
  );
}

const STATE_LABEL: Record<string, { text: string; cls: string }> = {
  past: { text: "지남", cls: "bg-soft text-sub" },
  cutoff: { text: "접수 마감(시간)", cls: "bg-soft text-sub" },
  closed: { text: "마감", cls: "bg-danger-soft text-danger" },
  "soon-full": { text: "자리 얼마 안 남음", cls: "bg-gold-soft text-gold-ink" },
  open: { text: "예약 가능", cls: "bg-point-soft text-point-dark" },
};

export default function SessionManager({
  formKey,
  sessions,
  cutoffHours,
  defaultCapacity,
}: {
  formKey: string;
  sessions: AdminSession[];
  cutoffHours: number;
  defaultCapacity: number | null;
}) {
  const [createState, createAction] = useActionState(createSession, ADMIN_INIT);
  const [rowState, rowAction] = useActionState(updateSession, ADMIN_INIT);
  const [adding, setAdding] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);

  const note = createState.message || rowState.message;
  const noteOk = createState.ok || rowState.ok;

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[1.2rem] font-extrabold">
          회차
          {sessions.length > 0 && (
            <span className="ml-2 text-sub">{sessions.length}개</span>
          )}
        </h2>
        {!adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            + 회차 추가
          </Button>
        )}
      </div>

      <p className="mb-4 text-sub">
        여기 있는 회차만 손님이 고를 수 있습니다. 반복 일정 기능은 없습니다 —
        여는 날마다 하나씩 추가하시면 됩니다.
      </p>

      {adding && (
        <form
          action={createAction}
          className="mb-5 rounded-[18px] border border-line bg-soft px-5 py-5"
        >
          <input type="hidden" name="form_key" value={formKey} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="starts_at">시작 일시 (한국 시간)</Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="capacity">정원</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                max={50}
                defaultValue={defaultCapacity ?? 5}
                required
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="note">메모 <span className="font-normal text-sub">(관리자만 봅니다)</span></Label>
            <Input id="note" name="note" className="mt-1.5" placeholder="예: 김선영 호스트 진행" />
          </div>
          <div className="mt-4 flex gap-2">
            <Submit label="추가" />
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>
              그만두기
            </Button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <p className="rounded-[18px] bg-soft px-5 py-4 text-sub">
          아직 회차가 없습니다. 자체 예약을 켜려면 최소 1개가 필요합니다.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {sessions.map((s) => {
            const state = sessionState(s, cutoffHours);
            const badge = STATE_LABEL[state];
            const left = remainingSeats(s);
            const past = state === "past";

            return (
              <li
                key={s.id}
                className={`rounded-[18px] border px-5 py-4 ${
                  past ? "border-line bg-soft opacity-70" : "border-line bg-white"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="m-0 text-[1.05rem] font-extrabold">
                    {formatSessionWhen(s.starts_at, "ko")}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-[0.9rem] font-bold ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>

                <p className="m-0 mt-1 text-sub">
                  정원 {s.capacity}명 · 예약 {s.booked_count}명 · 남은 자리 {left}명
                  {s.note && ` · ${s.note}`}
                </p>

                {!past && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={rowAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="action" value="toggle-closed" />
                      <input type="hidden" name="is_closed" value={String(s.is_closed)} />
                      <Submit
                        label={s.is_closed ? "다시 열기" : "마감하기"}
                        variant="outline"
                        size="xs"
                      />
                    </form>

                    {editingCapacity === s.id ? (
                      <form action={rowAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="action" value="capacity" />
                        <Input
                          name="capacity"
                          type="number"
                          min={s.booked_count || 1}
                          max={50}
                          defaultValue={s.capacity}
                          className="w-24"
                        />
                        <Submit label="저장" size="xs" />
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingCapacity(null)}
                        >
                          취소
                        </Button>
                      </form>
                    ) : (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => setEditingCapacity(s.id)}
                      >
                        정원 바꾸기
                      </Button>
                    )}

                    {s.booked_count === 0 && (
                      <form action={rowAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="action" value="delete" />
                        <Submit label="삭제" variant="destructive" size="xs" />
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {note && (
        <p
          role="status"
          className={`mt-3 font-bold ${noteOk ? "text-point-dark" : "text-danger"}`}
        >
          {note}
        </p>
      )}
    </section>
  );
}
