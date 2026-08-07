"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_INIT, updateExperience } from "@/app/admin/experiences/actions";
import type { AdminForm } from "@/lib/forms";

/**
 * 체험 편집.
 *
 * 지금까지 이 화면이 없어서 새 체험을 만들거나 상세 본문을 고치려면 SQL을
 * 써야 했다(부채 D9). 필드가 많아 세 덩어리로 나눈다 —
 * 기본 / 예약 방식 / 영문. 한 화면에 다 펼치면 무엇부터 채워야 할지 모른다.
 */

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-[0.95rem] text-sub">{hint}</p>}
    </div>
  );
}

function Textarea({
  id,
  name,
  rows = 3,
  defaultValue,
  placeholder,
  mono,
}: {
  id: string;
  name: string;
  rows?: number;
  defaultValue?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={`mt-1.5 w-full rounded-[12px] border border-line bg-white px-4 py-3 text-base leading-relaxed focus-visible:border-point focus-visible:outline-none ${
        mono ? "font-mono text-[0.95rem]" : ""
      }`}
    />
  );
}

function SaveBar({ note, ok }: { note: string; ok: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-4 border-t border-line bg-bg/95 py-4 backdrop-blur">
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중…" : "저장"}
      </Button>
      {note && (
        <span role="status" className={`font-bold ${ok ? "text-point-dark" : "text-danger"}`}>
          {note}
        </span>
      )}
    </div>
  );
}

export default function ExperienceForm({ form }: { form: AdminForm }) {
  const [state, action] = useActionState(updateExperience, ADMIN_INIT);
  const [mode, setMode] = useState(form.booking_mode ?? "external");

  const native = mode === "native";

  return (
    <form action={action}>
      <input type="hidden" name="key" value={form.key} />

      {/* ── 노출 ─────────────────────────────────────────────── */}
      <fieldset className="m-0 rounded-[22px] border border-line bg-soft px-6 py-5">
        <legend className="px-2 font-extrabold">노출</legend>
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={form.is_published}
              className="size-6 accent-point"
            />
            <span className="font-bold">사이트에 보이기</span>
            <span className="text-sub">— 끄면 목록·상세 어디에도 안 나옵니다</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="is_open"
              defaultChecked={form.is_open}
              className="size-6 accent-point"
            />
            <span className="font-bold">접수 중</span>
            <span className="text-sub">— 끄면 &lsquo;접수 마감&rsquo;으로 표시됩니다</span>
          </label>
        </div>
      </fieldset>

      {/* ── 기본 ─────────────────────────────────────────────── */}
      <fieldset className="m-0 mt-6 border-0 p-0">
        <legend className="mb-4 text-[1.2rem] font-extrabold">기본 정보</legend>
        <div className="flex flex-col gap-5">
          <Field id="title" label="제목">
            <Input id="title" name="title" defaultValue={form.title} required className="mt-1.5" />
          </Field>
          <Field id="subtitle" label="부제" hint="카드와 상세 상단에 한 줄로 붙습니다.">
            <Input id="subtitle" name="subtitle" defaultValue={form.subtitle} className="mt-1.5" />
          </Field>
          <Field id="description" label="소개" hint="카드에 보이는 두세 문장.">
            <Textarea id="description" name="description" defaultValue={form.description} />
          </Field>
          <Field
            id="detail"
            label="상세 본문 (마크다운)"
            hint="## 제목, **굵게**, - 목록을 쓸 수 있습니다. 진행 순서나 코스 설명처럼 긴 이야기를 여기에."
          >
            <Textarea id="detail" name="detail" rows={14} defaultValue={form.detail} mono />
          </Field>
        </div>
      </fieldset>

      {/* ── 체험 정보 ─────────────────────────────────────────── */}
      <fieldset className="m-0 mt-8 border-0 p-0">
        <legend className="mb-1 text-[1.2rem] font-extrabold">체험 정보</legend>
        <p className="mb-4 text-sub">
          상세 페이지 상단 요약에 나옵니다. 비워 두면 그 항목만 안 보입니다.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="duration_min" label="소요 시간 (분)" hint="예: 210 → 3.5시간으로 표시">
            <Input
              id="duration_min"
              name="duration_min"
              type="number"
              min={0}
              defaultValue={form.duration_min ?? ""}
              className="mt-1.5"
            />
          </Field>
          <Field id="price_krw" label="1인 참가비 (원)" hint="0을 넣으면 '무료'로 표시됩니다.">
            <Input
              id="price_krw"
              name="price_krw"
              type="number"
              min={0}
              defaultValue={form.price_krw ?? ""}
              className="mt-1.5"
            />
          </Field>
          <Field id="max_guests" label="기본 정원 (명)" hint="회차를 추가할 때 기본값으로 쓰입니다.">
            <Input
              id="max_guests"
              name="max_guests"
              type="number"
              min={1}
              max={50}
              defaultValue={form.max_guests ?? ""}
              className="mt-1.5"
            />
          </Field>
          <div>
            <Label htmlFor="language">진행 언어</Label>
            <select
              id="language"
              name="language"
              defaultValue={form.language ?? "ko"}
              className="mt-1.5 min-h-[50px] w-full rounded-[12px] border border-line bg-white px-4 text-base"
            >
              <option value="ko">한국어</option>
              <option value="en">영어</option>
              <option value="ko-en">한국어 · 영어</option>
            </select>
          </div>
          <Field id="meet_place" label="만나는 곳">
            <Input
              id="meet_place"
              name="meet_place"
              defaultValue={form.meet_place ?? ""}
              placeholder="서울 종로구 통인시장 입구"
              className="mt-1.5"
            />
          </Field>
          <Field id="meet_place_en" label="만나는 곳 (영문)">
            <Input
              id="meet_place_en"
              name="meet_place_en"
              defaultValue={form.meet_place_en ?? ""}
              placeholder="Tongin Market main entrance"
              className="mt-1.5"
            />
          </Field>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="includes" label="포함 사항" hint="한 줄에 하나씩 적어 주세요.">
            <Textarea
              id="includes"
              name="includes"
              rows={5}
              defaultValue={(form.includes ?? []).join("\n")}
              placeholder={"장보기 동행\n재료비\n함께 먹는 식사"}
            />
          </Field>
          <Field id="includes_en" label="포함 사항 (영문)" hint="비우면 한국어가 그대로 쓰입니다.">
            <Textarea
              id="includes_en"
              name="includes_en"
              rows={5}
              defaultValue={(form.includes_en ?? []).join("\n")}
            />
          </Field>
        </div>
      </fieldset>

      {/* ── 신청 방식 ─────────────────────────────────────────── */}
      <fieldset className="m-0 mt-8 rounded-[22px] border border-line px-6 py-5">
        <legend className="px-2 text-[1.2rem] font-extrabold">신청 방식</legend>

        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="booking_mode"
              value="external"
              checked={!native}
              onChange={() => setMode("external")}
              className="mt-1 size-5 accent-point"
            />
            <span>
              <span className="font-bold">구글폼으로 보내기</span>
              <span className="block text-sub">
                지금까지의 방식. 신청 버튼을 누르면 구글폼이 새 창으로 열립니다.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="booking_mode"
              value="native"
              checked={native}
              onChange={() => setMode("native")}
              className="mt-1 size-5 accent-point"
            />
            <span>
              <span className="font-bold">사이트에서 직접 예약받기</span>
              <span className="block text-sub">
                손님이 회차를 고르고 인원을 넣어 신청합니다. 정원이 자동으로 관리되고,
                접수·확정 안내 메일이 나갑니다.
              </span>
            </span>
          </label>
        </div>

        {native ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              id="cutoff_hours"
              label="마감 시간 (시작 N시간 전)"
              hint="0이면 시작 직전까지 받습니다. 24를 넣으면 하루 전에 닫힙니다."
            >
              <Input
                id="cutoff_hours"
                name="cutoff_hours"
                type="number"
                min={0}
                max={168}
                defaultValue={form.cutoff_hours ?? 0}
                className="mt-1.5"
              />
            </Field>
            <p className="self-end rounded-[12px] bg-point-soft px-4 py-3 text-point-dark">
              게시하려면 앞으로의 회차가 최소 1개 있어야 합니다.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <Field
              id="url"
              label="구글폼 주소"
              hint="docs.google.com/forms/… 또는 forms.gle/… 만 넣을 수 있습니다."
            >
              <Input
                id="url"
                name="url"
                type="url"
                defaultValue={form.url ?? ""}
                className="mt-1.5"
              />
            </Field>
          </div>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="cta_label" label="버튼 문구">
            <Input id="cta_label" name="cta_label" defaultValue={form.cta_label} className="mt-1.5" />
          </Field>
          <Field id="closed_note" label="마감 안내 문구">
            <Input
              id="closed_note"
              name="closed_note"
              defaultValue={form.closed_note}
              className="mt-1.5"
            />
          </Field>
        </div>
      </fieldset>

      {/* ── 영문 ─────────────────────────────────────────────── */}
      <fieldset className="m-0 mt-8 border-0 p-0">
        <legend className="mb-1 text-[1.2rem] font-extrabold">영문</legend>
        <p className="mb-4 text-sub">
          비워 두면 한국어가 그대로 보입니다. 채우는 만큼 영어가 됩니다.
        </p>
        <div className="flex flex-col gap-5">
          <Field id="title_en" label="Title">
            <Input id="title_en" name="title_en" defaultValue={form.title_en} className="mt-1.5" />
          </Field>
          <Field id="subtitle_en" label="Subtitle">
            <Input
              id="subtitle_en"
              name="subtitle_en"
              defaultValue={form.subtitle_en}
              className="mt-1.5"
            />
          </Field>
          <Field id="description_en" label="Description">
            <Textarea id="description_en" name="description_en" defaultValue={form.description_en} />
          </Field>
          <Field id="detail_en" label="Detail (markdown)">
            <Textarea id="detail_en" name="detail_en" rows={12} defaultValue={form.detail_en} mono />
          </Field>
        </div>
      </fieldset>

      {/* ── 정렬·색 ──────────────────────────────────────────── */}
      <fieldset className="m-0 mt-8 border-0 p-0">
        <legend className="mb-4 text-[1.2rem] font-extrabold">표시</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="sort" label="정렬 순서" hint="작을수록 먼저 나옵니다.">
            <Input id="sort" name="sort" type="number" defaultValue={form.sort} className="mt-1.5" />
          </Field>
          <div>
            <Label htmlFor="accent">강조색</Label>
            <select
              id="accent"
              name="accent"
              defaultValue={form.accent}
              className="mt-1.5 min-h-[50px] w-full rounded-[12px] border border-line bg-white px-4 text-base"
            >
              <option value="green">딥그린</option>
              <option value="lime">라임</option>
              <option value="gold">골드</option>
            </select>
          </div>
        </div>
      </fieldset>

      <SaveBar note={state.message} ok={state.ok} />
    </form>
  );
}
