import Link from "next/link";
import PopupResetLink from "@/components/PopupResetLink";
import { getT } from "@/lib/locale.server";

const REP_NAME = process.env.NEXT_PUBLIC_REP_NAME || "신승민";
const REP_EMAIL = process.env.NEXT_PUBLIC_REP_EMAIL || "harry147017@gachon.ac.kr";

export default async function SiteFooter() {
  const { t } = await getT();

  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <span className="bname" style={{ fontSize: "1.24rem", fontWeight: 800 }}>
              {t("brand.name")}
            </span>
            <p className="foot-info" style={{ marginTop: "0.5rem", maxWidth: "38ch" }}>
              {t("foot.motto")}
            </p>
          </div>
          <div>
            <h4>{t("foot.links")}</h4>
            <ul>
              {/* 예전에는 푸터 맨 아래 "↑ 처음으로"가 홈 링크를 겸했는데,
                  화살표 라벨과 동작이 어긋나 헷갈렸다(§PRD GL-3의 '처음으로'는
                  이 항목이 대신한다). 스크롤 최상단 이동은 ScrollToTop이 맡는다. */}
              <li><Link href="/">{t("nav.home")}</Link></li>
              <li><Link href="/about">{t("nav.about")}</Link></li>
              <li><Link href="/people">{t("nav.people")}</Link></li>
              <li><Link href="/notice">{t("nav.notice")}</Link></li>
              <li><Link href="/faq">{t("nav.faq")}</Link></li>
              <li><Link href="/about#classes">{t("nav.classes")}</Link></li>
              <li><Link href="/apply">{t("nav.apply")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("foot.contact")}</h4>
            <p className="foot-info">
              {t("foot.operator")}<br />
              {t("foot.rep")} · {REP_NAME}<br />
              {t("foot.inquiry")} · <a href={`mailto:${REP_EMAIL}`}>{REP_EMAIL}</a><br />
              {t("foot.support")}
            </p>
          </div>
        </div>
        <div className="foot-legal">
          <span>© 2026 {t("brand.name")} (Team theOne)</span>
          {/* 개인정보보호법 §30 — 정보주체가 '쉽게 확인할 수 있도록' 공개해야
              한다. 그래서 바로가기 목록에 섞지 않고 여기서 굵게 세워 둔다. */}
          {/* .foot-legal은 0.8rem(12.8px)이다. 법정 고지 링크를 그 크기로
              두면 '쉽게 확인'이 아니고, 시니어 사이트의 14px 하한도 깬다. */}
          <Link
            href="/privacy"
            className="text-[0.95rem] font-bold text-point underline"
          >
            {t("privacy.short")}
          </Link>
          <Link
            href="/terms"
            className="text-[0.95rem] font-bold text-point underline"
          >
            {t("terms.short")}
          </Link>
          {/* 숨긴 기록이 있을 때만 나타난다 */}
          <PopupResetLink label={t("foot.showPopup")} />
        </div>
      </div>
    </footer>
  );
}
