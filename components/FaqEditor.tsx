"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FAQ_INIT, createFaq, updateFaq } from "@/app/admin/faqs/actions";
import { AUDIENCE_LABEL, type AdminFaq, type FaqAudience } from "@/lib/faqs";

/**
 * FAQ 편집.
 *
 * 이 화면이 생기기 전에는 문항 하나 고치려고 개발자가 배포를 해야 했다.
 * "비개발 운영자가 직접 고친다"는 목표에서 FAQ만 예외일 이유가 없다.
 */

function Submit({ label, busy = "저장 중…", variant = "default", size = "sm" }: {
  label: string;
  busy?: string;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "xs";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} variant={variant} disabled={pending}>
      {pending ? busy : label}
    </Button>
  );
}

function Textarea({
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      rows={rows}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="mt-1.5 w-full rounded-[12px] border border-line bg-white px-4 py-3 text-base leading-relaxed focus-visible:border-point focus-visible:outline-none"
    />
  );
}

function Fields({ faq }: { faq?: AdminFaq }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <Label>대상</Label>
          <select
            name="audience"
            defaultValue={faq?.audience ?? "guest"}
            className="mt-1.5 min-h-[50px] w-full rounded-[12px] border border-line bg-white px-4 text-base"
          >
            {(["guest", "senior", "all"] as FaqAudience[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>순서</Label>
          <Input
            name="sort"
            type="number"
            defaultValue={faq?.sort ?? 100}
            className="mt-1.5 w-28"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 self-end pb-3">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={faq?.is_published ?? true}
            className="size-6 accent-point"
          />
          <span className="font-bold">공개</span>
        </label>
      </div>

      <div className="mt-5">
        <Label>질문</Label>
        <Input
          name="question"
          defaultValue={faq?.question}
          required
          className="mt-1.5"
          placeholder="예: 주차할 수 있나요?"
        />
      </div>
      <div className="mt-4">
        <Label>답변</Label>
        <Textarea name="answer" defaultValue={faq?.answer} />
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer font-bold text-sub">
          영문 (비우면 한국어가 그대로 보입니다)
        </summary>
        <div className="mt-3">
          <Label>Question</Label>
          <Input name="question_en" defaultValue={faq?.question_en} className="mt-1.5" />
        </div>
        <div className="mt-3">
          <Label>Answer</Label>
          <Textarea name="answer_en" defaultValue={faq?.answer_en} />
        </div>
      </details>
    </>
  );
}

function Row({ faq }: { faq: AdminFaq }) {
  const [state, action] = useActionState(updateFaq, FAQ_INIT);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-[18px] border border-point bg-soft px-5 py-5">
        <form action={action}>
          <input type="hidden" name="id" value={faq.id} />
          <Fields faq={faq} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Submit label="저장" />
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              그만두기
            </Button>
            {state.message && (
              <span className={`font-bold ${state.ok ? "text-point-dark" : "text-danger"}`}>
                {state.message}
              </span>
            )}
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-[18px] border border-line bg-white px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[1.05rem] font-bold">{faq.question}</p>
        <div className="flex gap-2">
          <span className="rounded-full bg-soft px-3 py-1 text-[0.9rem] font-bold text-sub">
            {AUDIENCE_LABEL[faq.audience]}
          </span>
          {!faq.is_published && (
            <span className="rounded-full bg-danger-soft px-3 py-1 text-[0.9rem] font-bold text-danger">
              비공개
            </span>
          )}
        </div>
      </div>
      <p className="m-0 mt-2 leading-relaxed text-ink2">{faq.answer}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="xs" variant="outline" onClick={() => setEditing(true)}>
          수정
        </Button>
        <form action={action}>
          <input type="hidden" name="id" value={faq.id} />
          <input type="hidden" name="action" value="delete" />
          <Submit label="삭제" variant="destructive" size="xs" busy="삭제 중…" />
        </form>
        {state.message && !editing && (
          <span className={`self-center font-bold ${state.ok ? "text-point-dark" : "text-danger"}`}>
            {state.message}
          </span>
        )}
      </div>
    </li>
  );
}

export default function FaqEditor({ faqs }: { faqs: AdminFaq[] }) {
  const [state, action] = useActionState(createFaq, FAQ_INIT);
  const [adding, setAdding] = useState(false);

  const guest = faqs.filter((f) => f.audience === "guest");
  const senior = faqs.filter((f) => f.audience === "senior");
  const all = faqs.filter((f) => f.audience === "all");

  const groups: [string, AdminFaq[]][] = [
    ["체험 손님", guest],
    ["시니어 지원자", senior],
    ["공통", all],
  ];

  return (
    <>
      {groups.map(([label, list]) =>
        list.length === 0 ? null : (
          <section key={label} className="mt-8">
            <h2 className="mb-3 text-[1.2rem] font-extrabold">
              {label}
              <span className="ml-2 text-sub">{list.length}문항</span>
            </h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {list.map((f) => (
                <Row key={f.id} faq={f} />
              ))}
            </ul>
          </section>
        ),
      )}

      {adding ? (
        <form action={action} className="mt-8 rounded-[22px] border border-line bg-soft px-6 py-5">
          <h2 className="mb-4 text-[1.15rem] font-extrabold">새 문항</h2>
          <Fields />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Submit label="추가" busy="추가 중…" />
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>
              그만두기
            </Button>
            {state.message && !state.ok && (
              <span className="font-bold text-danger">{state.message}</span>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-8">
          <Button type="button" variant="outline" onClick={() => setAdding(true)}>
            + 문항 추가
          </Button>
          {state.ok && state.message && (
            <p role="status" className="mt-3 font-bold text-point-dark">
              {state.message}
            </p>
          )}
        </div>
      )}
    </>
  );
}
