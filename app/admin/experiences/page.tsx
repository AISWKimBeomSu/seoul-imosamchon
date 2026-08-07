import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import NewExperience from "@/components/NewExperience";
import { requireAdmin } from "@/lib/admin-guard.server";
import { getAdminExperiences } from "@/lib/admin-experiences.server";
import { AUDIENCE_LABEL } from "@/lib/forms";
import { formatPrice, formatDuration } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function AdminExperiencesPage() {
  await requireAdmin();
  const { rows, unavailable } = await getAdminExperiences();

  return (
    <main className="section">
      <div className="wrap">
        <AdminNav current="/admin/experiences" />
        <h1 className="mt-4 mb-2 text-[clamp(1.5rem,3vw,2rem)] font-extrabold">체험 관리</h1>
        <p className="sec-sub">
          손님에게 보이는 체험과 회차를 여기서 만듭니다. 이제 SQL 없이 됩니다.
        </p>

        {unavailable && (
          <p className="mt-6 rounded-[18px] border border-danger-line bg-danger-soft px-5 py-4 font-bold text-danger">
            체험 정보를 읽지 못했습니다. 마이그레이션(0018·0019)이 아직 적용되지
            않았거나 서버 키가 설정되지 않았습니다.
          </p>
        )}

        {!unavailable && (
          <>
            <ul className="mt-8 flex list-none flex-col gap-3 p-0">
              {rows.map((r) => (
                <li key={r.key} className="rounded-[18px] border border-line bg-white px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <p className="m-0 text-[1.1rem] font-extrabold">
                      {r.title}
                      <span className="ml-2 font-mono text-[0.9rem] font-normal text-sub">
                        {r.key}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {!r.is_published && (
                        <span className="rounded-full bg-soft px-3 py-1 text-[0.9rem] font-bold text-sub">
                          비공개
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-[0.9rem] font-bold ${
                          r.booking_mode === "native"
                            ? "bg-point-soft text-point-dark"
                            : "bg-soft text-sub"
                        }`}
                      >
                        {r.booking_mode === "native" ? "자체 예약" : "구글폼"}
                      </span>
                    </div>
                  </div>

                  <p className="m-0 mt-1 text-sub">
                    {AUDIENCE_LABEL[r.audience]}
                    {r.duration_min ? ` · ${formatDuration(r.duration_min, "ko")}` : ""}
                    {r.price_krw != null ? ` · ${formatPrice(r.price_krw, "ko")}` : ""}
                    {r.booking_mode === "native"
                      ? ` · 예약 가능 회차 ${r.openCount}개`
                      : r.is_open
                        ? " · 접수 중"
                        : " · 접수 마감"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link href={`/admin/experiences/${r.key}`} className="btn btn-primary nav-cta">
                      편집
                    </Link>
                    {r.is_published && (
                      <Link href={`/about/${r.key}`} className="btn btn-ghost nav-cta">
                        사이트에서 보기 ↗
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <NewExperience />
          </>
        )}
      </div>
    </main>
  );
}
