import Link from "next/link";
import Image from "next/image";
import LanguageToggle from "@/components/LanguageToggle";
import { getT } from "@/lib/locale.server";

export default async function SiteHeader() {
  const { t, locale } = await getT();

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label={t("brand.home")}>
          <Image
            src="/brand/logo.png"
            alt=""
            width={69}
            height={69}
            aria-hidden="true"
          />
          <span>
            <span className="bname">{t("brand.name")}</span>
            <br />
            <span className="bsub">{t("brand.tagline")}</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label={t("nav.menu")}>
          <Link href="/">{t("nav.home")}</Link>
          {/* '손님 안내'는 사실상 쿠킹클래스 소개였다. 브랜드소개 하위로 들여
              메뉴에서 뺐다 — 무엇이 다른지 알 수 없는 항목이 둘이었다. */}
          <Link href="/about">{t("nav.about")}</Link>
          <Link href="/people">{t("nav.people")}</Link>
          <Link href="/notice">{t("nav.notice")}</Link>
          <Link href="/faq">{t("nav.faq")}</Link>
          {/* 신청 종류가 여럿이라 폼으로 직행시키지 않고 선택 페이지로 보낸다. */}
          <Link href="/apply" className="btn btn-primary nav-cta">
            {t("nav.apply")}
          </Link>
          <LanguageToggle locale={locale} />
        </nav>
      </div>
    </header>
  );
}
