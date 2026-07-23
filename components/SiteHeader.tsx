import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="서울이모삼촌 홈">
          <Image
            src="/brand/logo.png"
            alt=""
            width={46}
            height={46}
            aria-hidden="true"
          />
          <span>
            <span className="bname">서울이모삼촌</span>
            <br />
            <span className="bsub">시니어 로컬 라이프 크리에이터</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label="주요 메뉴">
          <Link href="/about">브랜드소개</Link>
          <Link href="/notice">공지사항</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/apply" className="btn btn-primary nav-cta">
            신청하기
          </Link>
        </nav>
      </div>
    </header>
  );
}
