"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ACTION_INIT } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { setHosts } from "@/app/admin/experiences/actions";
import type { AdminPerson } from "@/lib/people";

/**
 * 이 체험을 진행하는 호스트 고르기.
 *
 * 여기서 연결해도 공개 여부는 people 쪽이 정한다 — 동의(consent_at)가 없거나
 * 비공개인 분은 연결해도 손님에게 안 보인다. 그래서 목록에 상태를 같이 적는다.
 */
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "저장 중…" : "호스트 저장"}
    </Button>
  );
}

export default function HostPicker({
  formKey,
  people,
  selected,
}: {
  formKey: string;
  people: AdminPerson[];
  selected: string[];
}) {
  const [state, action] = useActionState(setHosts, ACTION_INIT);

  return (
    <section className="mt-8">
      <h2 className="mb-1 text-[1.2rem] font-extrabold">호스트</h2>
      <p className="mb-4 text-sub">
        상세 페이지에서 설명보다 위에 나옵니다. 체험에서는 호스트가 곧 상품이라
        가장 먼저 보이게 두었습니다.
      </p>

      {people.length === 0 ? (
        <p className="rounded-[18px] bg-soft px-5 py-4 text-sub">
          등록된 시니어가 없습니다. &lsquo;사람 소개&rsquo;에서 먼저 추가해 주세요.
        </p>
      ) : (
        <form action={action} className="rounded-[18px] border border-line bg-white px-5 py-4">
          <input type="hidden" name="form_key" value={formKey} />
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {people.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    name="host"
                    value={p.id}
                    defaultChecked={selected.includes(p.id)}
                    className="size-6 accent-point"
                  />
                  <span className="font-bold">{p.name}</span>
                  {p.role && <span className="text-sub">{p.role}</span>}
                  {!p.is_published && (
                    <span className="rounded-full bg-soft px-2.5 py-0.5 text-[0.85rem] font-bold text-sub">
                      비공개 — 연결해도 손님에게 안 보임
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Submit />
            {state.message && (
              <span
                role="status"
                className={`font-bold ${state.ok ? "text-point-dark" : "text-danger"}`}
              >
                {state.message}
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
