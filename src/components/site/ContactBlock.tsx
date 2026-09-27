import { ArrowUpRight, Mail } from "lucide-react";
import type { Locale, Portfolio } from "@/lib/content/schema";
import { contactHref } from "@/lib/content/derive";
import { t, UI } from "@/lib/content/i18n";
import { ContactIcon } from "@/components/shared/Icons";
import { CopyButton } from "./CopyButton";
import { VCardButton } from "./VCardButton";

export function ContactBlock({ portfolio, locale, email }: { portfolio: Portfolio; locale: Locale; email: string }) {
  const ui = UI[locale];
  const profile = portfolio.profile;
  const contacts = profile.contacts.filter((c) => c.onSite && c.value);
  const name = t(profile.name, "en") || t(profile.name, locale);

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-20 border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="label text-accent-text">{ui.contact}</p>
        <h2 id="contact-title" className="mt-4 max-w-4xl font-display text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.02] text-ink">
          {ui.getInTouch}
        </h2>
        <p className="mt-5 max-w-xl text-lg text-ink-2">{ui.getInTouchSub}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {email && (
            <>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2.5 rounded-chip bg-ink px-6 py-3.5 text-base font-medium text-bg transition hover:bg-accent hover:text-accent-ink"
              >
                <Mail size={18} aria-hidden />
                {email}
              </a>
              <CopyButton
                text={email}
                label={ui.copyEmail}
                copiedLabel={ui.copied}
                className="inline-flex items-center gap-2 rounded-chip border border-line-strong px-4 py-3.5 text-sm font-medium text-ink transition hover:border-ink"
              />
            </>
          )}
          <VCardButton
            label={ui.saveContact}
            className="inline-flex items-center gap-2 rounded-chip border border-line-strong px-4 py-3.5 text-sm font-medium text-ink transition hover:border-ink"
            data={{
              name,
              title: t(profile.headline, "en"),
              email,
              urls: [portfolio.settings.siteUrl, ...contacts.filter((c) => c.kind !== "email").map(contactHref)].filter(Boolean),
            }}
          />
        </div>

        {contacts.length > 0 && (
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contacts.map((contact) => {
              const href = contactHref(contact);
              const body = (
                <>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-sunken text-ink-2 transition group-hover:bg-accent group-hover:text-accent-ink">
                    <ContactIcon kind={contact.kind} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label block text-[0.6rem] text-ink-3">{t(contact.label, locale) || contact.kind}</span>
                    <span className="no-calt block truncate text-sm font-medium text-ink">{contact.value}</span>
                  </span>
                  {href && <ArrowUpRight size={16} className="text-ink-3 transition group-hover:text-accent-text" aria-hidden />}
                </>
              );
              return (
                <li key={contact.id}>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer me"
                      className="group flex items-center gap-3 rounded-card border border-line bg-elev p-3.5 transition hover:border-line-strong"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="group flex items-center gap-3 rounded-card border border-line bg-elev p-3.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
