import Link from "next/link";

const REP_NAME = process.env.NEXT_PUBLIC_REP_NAME || "신승민";
const REP_EMAIL = process.env.NEXT_PUBLIC_REP_EMAIL || "harry147017@gachon.ac.kr";

export default function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <span className="bname" style={{ fontSize: "1.24rem", fontWeight: 800 }}>
              서울이모삼촌
            </span>
            <p className="foot-info" style={{ marginTop: "0.5rem", maxWidth: "34ch" }}>
              부엌은 빌려도, 60년을 살아야 얻어지는 손맛과 이야기는 빌릴 수 없습니다.
              시니어의 세월을 정당한 일자리로 잇습니다.
            </p>
          </div>
          <div>
            <h4>바로가기</h4>
            <ul>
              <li><Link href="/about">브랜드소개</Link></li>
              <li><Link href="/notice">공지사항</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/apply">신청하기</Link></li>
            </ul>
          </div>
          <div>
            <h4>운영 · 문의</h4>
            <p className="foot-info">
              운영 · 팀 theOne<br />
              대표자 · {REP_NAME}<br />
              문의 · <a href={`mailto:${REP_EMAIL}`}>{REP_EMAIL}</a><br />
              후원 · 서울특별시50플러스재단 시니어일자리지원센터
            </p>
          </div>
        </div>
        <div className="foot-legal">
          <span>© 2026 서울이모삼촌 (팀 theOne)</span>
          <Link href="/" style={{ color: "var(--point)", fontWeight: 700 }}>
            ↑ 처음으로
          </Link>
        </div>
      </div>
    </footer>
  );
}
