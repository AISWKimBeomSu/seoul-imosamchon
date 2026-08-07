import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ExperienceForm from "@/components/ExperienceForm";
import SessionManager from "@/components/SessionManager";
import HostPicker from "@/components/HostPicker";
import { requireAdmin } from "@/lib/admin-guard.server";
import { getAdminExperience } from "@/lib/admin-experiences.server";
import { getAdminPeople } from "@/lib/people.server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getLinkedHosts(formKey: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("form_hosts")
      .select("person_id")
      .eq("form_key", formKey);
    return ((data ?? []) as { person_id: string }[]).map((r) => r.person_id);
  } catch {
    return [];
  }
}

export default async function AdminExperienceEditPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireAdmin();
  const { key } = await params;

  const experience = await getAdminExperience(key);
  if (!experience) notFound();

  const [seniors, linked] = await Promise.all([
    getAdminPeople("senior"),
    getLinkedHosts(key),
  ]);

  const native = experience.booking_mode === "native";

  return (
    <main className="section">
      <div className="wrap">
        <AdminNav current="/admin/experiences" />

        <Link href="/admin/experiences" className="backlink mt-4 inline-block">
          ← 체험 목록
        </Link>

        <div className="mt-2 mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="m-0 text-[clamp(1.5rem,3vw,2rem)] font-extrabold">
            {experience.title}
          </h1>
          <span className="font-mono text-sub">{experience.key}</span>
          {experience.is_published && (
            <Link href={`/about/${experience.key}`} className="underline">
              사이트에서 보기 ↗
            </Link>
          )}
        </div>

        <div className="max-w-[820px]">
          {/* 자체 예약을 켠 체험만 회차가 의미 있다. 구글폼은 날짜가 폼 안에 있다. */}
          {native && (
            <SessionManager
              formKey={experience.key}
              sessions={experience.sessions}
              cutoffHours={experience.cutoff_hours ?? 0}
              defaultCapacity={experience.max_guests ?? null}
            />
          )}

          <HostPicker formKey={experience.key} people={seniors} selected={linked} />

          <hr className="my-10 border-line" />

          <ExperienceForm form={experience} />

          {!native && experience.sessions.length > 0 && (
            <p className="mt-6 rounded-[18px] bg-soft px-5 py-4 text-sub">
              이 체험에는 회차가 {experience.sessions.length}개 있지만 지금은
              구글폼 방식이라 손님에게 안 보입니다. &lsquo;사이트에서 직접
              예약받기&rsquo;로 바꾸면 나타납니다.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
