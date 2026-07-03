import { useLocale } from "./i18n/LocaleContext";
import { SUPPORTED_LOCALES } from "./i18n/locale";

export function LanguageSwitcher() {
  const { locale, setLocale, m } = useLocale();

  return (
    <div className="lang-switch" role="group" aria-label={m.lang.label}>
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={code === locale ? "chip active" : "chip"}
          aria-pressed={code === locale}
          onClick={() => setLocale(code)}
        >
          {m.lang[code]}
        </button>
      ))}
    </div>
  );
}
