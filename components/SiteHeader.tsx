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
          {/* 신청 종류가 여럿이라 폼으로 직행시키지 않고 선택 페이지로 보낸다.
              폼이 하나뿐일 때는 직행이 맞았지만, 지금은 어느 폼인지 사용자가 정해야 한다. */}
          <Link href="/apply" className="btn btn-primary nav-cta">
            신청하기
          </Link>
        </nav>
      </div>
    </header>
  );
}
