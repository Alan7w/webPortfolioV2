import type { ReactNode } from "react";
import type { Contact, Entry, Locale, Portfolio, Section } from "@/lib/content/schema";
import { contactHref, resumeSections } from "@/lib/content/derive";
import { formatRange } from "@/lib/content/dates";
import { t, UI } from "@/lib/content/i18n";
import { InlineMarkdown } from "@/components/shared/Markdown";

/**
 * One-column, ATS-friendly résumé. Real text (no images of text), semantic headings, links kept
 * clickable in the exported PDF. Photo and QR are rendered and toggled with CSS by the toolbar.
 */

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Row({ left, right }: { left: ReactNode; right?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="min-w-0">{left}</div>
      {right && <div className="shrink-0 whitespace-nowrap text-[8.8pt] tabular-nums text-neutral-600">{right}</div>}
    </div>
  );
}

function BulletList({ entry, locale, max }: { entry: Entry; locale: Locale; max?: number }) {
  const bullets = entry.bullets
    .map((b) => t(b.text, locale))
    .filter(Boolean)
    .slice(0, max);
  if (!bullets.length) return null;
  return (
    <ul className="mt-0.5 space-y-[1.5pt]">
      {bullets.map((bullet, i) => (
        <li key={i} className="relative pl-[9pt]">
          <span className="absolute left-[1pt] top-[0.55em] size-[3pt] rounded-full bg-neutral-700" aria-hidden />
          <InlineMarkdown text={bullet} />
        </li>
      ))}
    </ul>
  );
}

function EntryTitle({ entry, locale, extra }: { entry: Entry; locale: Locale; extra?: ReactNode }) {
  const subtitle = t(entry.subtitle, locale);
  const location = t(entry.location, locale);
  return (
    <p>
      <strong className="font-semibold text-neutral-950">{t(entry.title, locale)}</strong>
      {subtitle && <span className="text-neutral-800"> — {subtitle}</span>}
      {location && <span className="text-neutral-600">, {location}</span>}
      {extra}
    </p>
  );
}

function ExperienceBlock({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="space-y-[5pt]">
      {section.items.map((item) => (
        <div key={item.id} className="avoid-break">
          <Row left={<EntryTitle entry={item} locale={locale} />} right={formatRange(item.start, item.end, locale)} />
          {t(item.summary, locale) && <p className="text-neutral-800">{t(item.summary, locale)}</p>}
          <BulletList entry={item} locale={locale} />
        </div>
      ))}
    </div>
  );
}

function ProjectsBlock({ section, locale }: { section: Section; locale: Locale }) {
  const ui = UI[locale];
  return (
    <div className="space-y-[5pt]">
      {section.items.map((item) => {
        const link = item.links.find((l) => l.kind === "live" && l.url) ?? item.links.find((l) => l.url);
        return (
          <div key={item.id} className="avoid-break">
            <Row
              left={
                <EntryTitle
                  entry={item}
                  locale={locale}
                  extra={
                    link && (
                      <a href={link.url} className="ml-1.5 text-[8.8pt] text-[var(--accent)] underline decoration-neutral-300 underline-offset-2">
                        {shortUrl(link.url)}
                      </a>
                    )
                  }
                />
              }
              right={formatRange(item.start, item.end, locale)}
            />
            {/* Résumé projects stay compact: the one-line pitch only when there are no highlights. */}
            {t(item.summary, locale) && !item.bullets.some((b) => t(b.text, locale)) && (
              <p className="text-neutral-800">{t(item.summary, locale)}</p>
            )}
            <BulletList entry={item} locale={locale} max={2} />
            {item.tags.length > 0 && (
              <p className="text-[8.8pt] text-neutral-600">
                <span className="font-medium text-neutral-700">{ui.skills}:</span> {item.tags.join(", ")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EducationBlock({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="space-y-[5pt]">
      {section.items.map((item) => {
        const facts = item.facts.filter((f) => t(f.value, locale));
        const short = facts.filter((f) => t(f.value, locale).length <= 40);
        const long = facts.filter((f) => t(f.value, locale).length > 40);
        return (
          <div key={item.id} className="avoid-break">
            <Row left={<EntryTitle entry={item} locale={locale} />} right={formatRange(item.start, item.end, locale)} />
            {short.length > 0 && (
              <p className="text-neutral-800">
                {short.map((f, i) => (
                  <span key={f.id}>
                    {i > 0 && <span className="text-neutral-400"> · </span>}
                    <span className="text-neutral-600">{t(f.label, locale)}:</span> {t(f.value, locale)}
                  </span>
                ))}
              </p>
            )}
            {long.map((f) => (
              <p key={f.id} className="text-neutral-800">
                <span className="text-neutral-600">{t(f.label, locale)}:</span> {t(f.value, locale)}
              </p>
            ))}
            {t(item.summary, locale) && <p className="text-neutral-800">{t(item.summary, locale)}</p>}
            <BulletList entry={item} locale={locale} />
          </div>
        );
      })}
    </div>
  );
}

function SkillsBlock({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="space-y-[1.5pt]">
      {section.items.map((group) => (
        <p key={group.id}>
          <strong className="font-semibold text-neutral-900">{t(group.title, locale)}:</strong>{" "}
          <span className="text-neutral-800">{group.tags.join(", ")}</span>
        </p>
      ))}
    </div>
  );
}

function AwardsBlock({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="space-y-[2pt]">
      {section.items.map((item) => (
        <Row
          key={item.id}
          left={
            <p>
              <strong className="font-semibold text-neutral-950">{t(item.title, locale)}</strong>
              {t(item.subtitle, locale) && <span className="text-neutral-700"> — {t(item.subtitle, locale)}</span>}
            </p>
          }
          right={formatRange(item.start, item.end, locale)}
        />
      ))}
    </div>
  );
}

function LanguagesBlock({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <p className="text-neutral-800">
      {section.items.map((item, i) => (
        <span key={item.id}>
          {i > 0 && <span className="text-neutral-400"> · </span>}
          <strong className="font-semibold text-neutral-900">{t(item.title, locale)}</strong>
          {t(item.subtitle, locale) && <span> ({t(item.subtitle, locale)})</span>}
        </span>
      ))}
    </p>
  );
}

function SectionBody({ section, locale }: { section: Section; locale: Locale }) {
  switch (section.kind) {
    case "projects":
      return <ProjectsBlock section={section} locale={locale} />;
    case "education":
      return <EducationBlock section={section} locale={locale} />;
    case "skills":
      return <SkillsBlock section={section} locale={locale} />;
    case "awards":
      return <AwardsBlock section={section} locale={locale} />;
    case "languages":
      return <LanguagesBlock section={section} locale={locale} />;
    default:
      return <ExperienceBlock section={section} locale={locale} />;
  }
}

export interface ResumeDocumentProps {
  portfolio: Portfolio;
  locale: Locale;
  /** Private contacts (e.g. phone) — only passed when printing from the Studio. */
  extraContacts?: Contact[];
  qrSvg?: string;
  qrUrl?: string;
}

export function ResumeDocument({ portfolio, locale, extraContacts = [], qrSvg, qrUrl }: ResumeDocumentProps) {
  const ui = UI[locale];
  const profile = portfolio.profile;
  const settings = portfolio.settings.resume;
  const contacts = [...profile.contacts.filter((c) => c.onResume && c.value), ...extraContacts.filter((c) => c.onResume && c.value)];
  const ordered = [...contacts.filter((c) => c.kind === "email"), ...contacts.filter((c) => c.kind === "phone"), ...contacts.filter((c) => c.kind !== "email" && c.kind !== "phone")];
  const location = t(profile.location, locale);
  const sections = resumeSections(portfolio);
  const siteUrl = portfolio.settings.siteUrl.trim();

  return (
    <article
      className="paper resume-doc no-calt font-[family-name:var(--font-inter)] text-[9.3pt] leading-[1.34] text-neutral-900"
      data-paper={settings.paper}
      lang={locale}
    >
      <div className="px-[13mm] py-[11mm]">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-[7pt]">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-source-serif)] text-[23pt] font-semibold leading-none tracking-tight text-neutral-950">
              {t(profile.name, locale)}
            </h1>
            {t(profile.headline, locale) && <p className="mt-[4pt] text-[11pt] font-medium text-[var(--accent)]">{t(profile.headline, locale)}</p>}
            <p className="mt-[5pt] flex flex-wrap gap-x-[7pt] gap-y-[1pt] text-[8.8pt] text-neutral-700">
              {location && <span>{location}</span>}
              {ordered.map((contact) => {
                const href = contactHref(contact);
                const text = contact.kind === "github" || contact.kind === "linkedin" || contact.kind === "website" ? shortUrl(contact.value) : contact.value;
                return (
                  <span key={contact.id} className="before:mr-[7pt] before:text-neutral-300 before:content-['|'] first:before:hidden">
                    {href ? (
                      <a href={href} className="underline decoration-neutral-300 underline-offset-2">
                        {text}
                      </a>
                    ) : (
                      text
                    )}
                  </span>
                );
              })}
              {siteUrl && (
                <span className="before:mr-[7pt] before:text-neutral-300 before:content-['|']">
                  <a href={siteUrl} className="underline decoration-neutral-300 underline-offset-2">
                    {shortUrl(siteUrl)}
                  </a>
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-[8pt]">
            {qrSvg && (
              <figure className="resume-qr flex flex-col items-center gap-[2pt]">
                <div className="size-[17mm] [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <figcaption className="max-w-[20mm] text-center text-[6pt] leading-tight text-neutral-500">{ui.scanToView}</figcaption>
                {qrUrl && <span className="sr-only">{qrUrl}</span>}
              </figure>
            )}
            {profile.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="" className="resume-photo h-[27mm] w-[21mm] rounded-[3pt] object-cover object-[50%_25%]" />
            )}
          </div>
        </header>

        {settings.showSummary && t(profile.summary, locale) && <p className="mt-[7pt] text-neutral-800">{t(profile.summary, locale)}</p>}

        {sections.map((section) => (
          <section key={section.id} className="mt-[9pt]">
            <h2 className="mb-[4pt] border-b border-neutral-200 pb-[2pt] text-[8.6pt] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              {t(section.title, locale)}
            </h2>
            <SectionBody section={section} locale={locale} />
          </section>
        ))}
      </div>
    </article>
  );
}
