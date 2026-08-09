import Link from "next/link";

// 순서는 운영자가 자주 여는 순이다. 예약이 제일 앞에 오는 이유 —
// 미처리 신청은 24시간 안에 답해야 하고, 나머지는 급하지 않다.
const ITEMS: { href: string; label: string }[] = [
  { href: "/admin/bookings", label: "예약" },
  { href: "/admin/experiences", label: "체험·회차" },
  { href: "/admin", label: "공지" },
  { href: "/admin/people", label: "사람 소개" },
  { href: "/admin/faqs", label: "FAQ" },
  { href: "/admin/popups", label: "팝업" },
  { href: "/admin/settings", label: "연락처·QR" },
];

export default function AdminNav({ current }: { current: string }) {
  return (
    <nav className="admin-nav" aria-label="관리 메뉴">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`btn ${it.href === current ? "btn-primary" : "btn-ghost"} nav-cta`}
          aria-current={it.href === current ? "page" : undefined}
        >
          {it.label}
        </Link>
      ))}
      {/* 게시 전에 실제 화면을 확인하는 통로. 관리자 세션이 있을 때만 동작한다. */}
      <Link href="/?preview=1" className="btn btn-ghost nav-cta">
        미리보기 ↗
      </Link>
    </nav>
  );
}
