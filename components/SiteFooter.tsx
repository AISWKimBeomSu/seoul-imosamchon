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
              <li><Link href="/about">{t("nav.about")}</Link></li>
              <li><Link href="/people">{t("nav.people")}</Link></li>
              <li><Link href="/notice">{t("nav.notice")}</Link></li>
              <li><Link href="/faq">{t("nav.faq")}</Link></li>
              <li><Link href="/guest">{t("nav.guest")}</Link></li>
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
          {/* 숨긴 기록이 있을 때만 나타난다 */}
          <PopupResetLink label={t("foot.showPopup")} />
          <Link href="/" style={{ color: "var(--point)", fontWeight: 700 }}>
            {t("foot.top")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
