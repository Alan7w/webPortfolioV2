import { FileText, MapPin } from "lucide-react";
import type { Locale, Portfolio } from "@/lib/content/schema";
import { contactHref, initials } from "@/lib/content/derive";
import { t, UI } from "@/lib/content/i18n";
import { ContactIcon } from "@/components/shared/Icons";
import { CopyButton } from "./CopyButton";
import { DotField } from "./DotField";
import { PixelPortrait } from "./PixelPortrait";

export function Hero({ portfolio, locale, resumeHref, email }: { portfolio: Portfolio; locale: Locale; resumeHref: string; email: string }) {
  const ui = UI[locale];
  const profile = portfolio.profile;
  const name = t(profile.name, locale);
  const location = t(profile.location, locale);
  const status = profile.status.enabled ? t(profile.status.text, locale) : "";
  const socials = profile.contacts.filter((c) => c.onSite && c.kind !== "email" && c.kind !== "phone" && contactHref(c));
  const highlights = profile.highlights.filter((h) => t(h.value, locale));

  return (
    <section className="relative overflow-hidden">
      <DotField />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-40">
        <div className="flex flex-col-reverse gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-3xl">
            {(status || location) && (
              <div className="flex flex-wrap items-center gap-2">
                {status && (
                  <p className="inline-flex items-center gap-2 rounded-chip border border-line bg-elev/70 px-3 py-1.5 text-sm text-ink-2 backdrop-blur">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-ok" />
                    </span>
                    {status}
                  </p>
                )}
                {location && (
                  <p className="inline-flex items-center gap-1.5 rounded-chip px-2 py-1.5 text-sm text-ink-3">
                    <MapPin size={14} aria-hidden />
                    {location}
                  </p>
                )}
              </div>
            )}
            <h1 className="accent-glow caret mt-6 font-display text-[clamp(2.6rem,8.5vw,6.2rem)] leading-[0.95] text-ink">{name}</h1>
            {t(profile.headline, locale) && (
              <p className="mt-5 font-display text-2xl leading-snug text-accent-text sm:text-[2rem]">{t(profile.headline, locale)}</p>
            )}
            {t(profile.summary, locale) && (
              <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-ink-2 sm:text-lg">{t(profile.summary, locale)}</p>
            )}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={resumeHref}
                className="inline-flex items-center gap-2 rounded-chip bg-accent px-5 py-3 text-sm font-semibold text-accent-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/25"
              >
                <FileText size={16} aria-hidden />
                {ui.resume}
              </a>
              {email && (
                <CopyButton
                  text={email}
                  label={ui.copyEmail}
                  copiedLabel={ui.copied}
                  className="inline-flex items-center gap-2 rounded-chip border border-line-strong bg-elev/60 px-4 py-3 text-sm font-medium text-ink backdrop-blur transition hover:border-ink"
                >
                  <span className="no-calt max-w-[16rem] truncate">{email}</span>
                </CopyButton>
              )}
              {socials.length > 0 && (
                <ul className="flex items-center gap-1 sm:ml-2">
                  {socials.map((contact) => (
                    <li key={contact.id}>
                      <a
                        href={contactHref(contact)}
                        target="_blank"
                        rel="noreferrer me"
                        aria-label={t(contact.label, locale) || contact.kind}
                        title={contact.value}
                        className="inline-flex size-10 items-center justify-center rounded-chip text-ink-2 transition hover:bg-sunken hover:text-ink"
                      >
                        <ContactIcon kind={contact.kind} size={18} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {profile.avatar && (
            <PixelPortrait src={profile.avatar} alt={t(profile.avatarAlt, locale) || name} initials={initials(name)} />
          )}
        </div>

        {highlights.length > 0 && (
          <dl
            className={`mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:mt-20 ${
              highlights.length >= 4 ? "lg:grid-cols-4" : highlights.length === 3 ? "lg:grid-cols-3" : ""
            }`}
          >
            {highlights.map((item) => (
              <div key={item.id} className="flex flex-col-reverse justify-end gap-1 bg-bg p-5 sm:p-6">
                <dt className="text-sm leading-snug text-ink-3">{t(item.label, locale)}</dt>
                <dd className="font-display text-3xl tabular-nums text-ink sm:text-4xl">{t(item.value, locale)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
