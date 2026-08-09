import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import FaqEditor from "@/components/FaqEditor";
import { requireAdmin } from "@/lib/admin-guard.server";
import { getAdminFaqs } from "@/lib/faqs.server";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  await requireAdmin();
  const faqs = await getAdminFaqs();

  return (
    <main className="section">
      <div className="wrap">
        <AdminNav current="/admin/faqs" />
        <h1 className="mt-4 mb-2 text-[clamp(1.5rem,3vw,2rem)] font-extrabold">
          자주 묻는 질문
        </h1>
        <p className="sec-sub">
          손님이 여기서 답을 못 찾으면 전화가 옵니다. 자주 받는 질문일수록 위로
          올려 주세요.{" "}
          <Link href="/faq" className="underline">
            사이트에서 보기 ↗
          </Link>
        </p>

        {faqs.length === 0 ? (
          <p className="mt-6 rounded-[18px] border border-danger-line bg-danger-soft px-5 py-4 font-bold text-danger">
            FAQ를 읽지 못했습니다. 마이그레이션(0025)이 아직 적용되지 않았거나
            서버 키가 설정되지 않았습니다.
          </p>
        ) : (
          <FaqEditor faqs={faqs} />
        )}
      </div>
    </main>
  );
}
