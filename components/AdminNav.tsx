import Link from "next/link";

const ITEMS: { href: string; label: string }[] = [
  { href: "/admin", label: "공지" },
  { href: "/admin/bookings", label: "예약" },
  { href: "/admin/settings", label: "신청 폼 설정" },
  { href: "/admin/popups", label: "팝업" },
  { href: "/admin/people", label: "사람 소개" },
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
