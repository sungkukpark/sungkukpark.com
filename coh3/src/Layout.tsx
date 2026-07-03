import { Link, Outlet } from "react-router-dom";
import { useLocale } from "./i18n/LocaleContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OPEN_DATA_URL } from "./types";

export function Layout() {
  const { m } = useLocale();

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-row">
          <p className="eyebrow">
            <Link to="/">{m.layout.hubLink}</Link>
          </p>
          <LanguageSwitcher />
        </div>
        <h1>{m.layout.title}</h1>
        <p className="lede">{m.layout.lede}</p>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          {m.layout.footerAttribution}{" "}
          <a href={OPEN_DATA_URL} rel="noopener noreferrer">
            COH3 Stats Open Data
          </a>
          . {m.layout.footerDisclaimer}
        </p>
        <p className="footer-meta">{m.layout.footerIcons}</p>
      </footer>
    </div>
  );
}
