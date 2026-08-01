import Link from "next/link";
import Image from "next/image";
import ApplyButton from "@/components/ApplyButton";

export default function SiteHeader() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="서울이모삼촌 홈">
          <Image
            src="/brand/logo.png"
            alt=""
            width={69}
            height={69}
            aria-hidden="true"
          />
          <span>
            <span className="bname">서울이모삼촌</span>
            <br />
            <span className="bsub">시니어 로컬 라이프 크리에이터</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label="주요 메뉴">
          <Link href="/">홈</Link>
          <Link href="/about">브랜드소개</Link>
          <Link href="/people">소개</Link>
          <Link href="/notice">공지사항</Link>
          <Link href="/faq">FAQ</Link>
          <Link
            href="/guest"
            className="nav-en"
            lang="en"
            aria-label="English page for guests"
          >
            EN
          </Link>
          {/* 클릭 1회로 구글폼까지. 마감되면 자동으로 '접수 마감'이 된다 */}
          <ApplyButton
            source="nav"
            className="btn btn-primary nav-cta"
            label="신청하기"
          />
        </nav>
      </div>
    </header>
  );
}
