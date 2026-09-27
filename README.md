# Portfolio Studio

My portfolio website and the tool I use to keep it current. One content file produces three things:

| Output | Where | Audience |
| --- | --- | --- |
| **Portfolio website** in English, Uzbek and Russian | `/en`, `/uz`, `/ru` | Everyone |
| **One-page résumé** (print / PDF) | `/en/resume` | Recruiters |
| **Obyektivka** (Ma’lumotnoma) | Studio only | Government, banks, local employers |

Everything is edited in the **Studio**, a local editor with a live preview.

---

## Quick start

```sh
npm install
npm run dev
```

- Website: <http://localhost:3000>
- Studio: <http://localhost:3000/studio>

Requires Node.js 20.9 or newer.

## Updating the portfolio

1. Open the Studio and edit. Changes save to `content/` automatically (⌘S saves immediately, ⌘Z undoes).
2. Switch the editing language (EN / UZ / RU) in the top bar to translate. Untranslated fields fall back to English, and the percentages show what's left.
3. Check the **Coach** for weak bullets, broken links, missing translations and résumé length.
4. Open **Publish**, review the changelog and click **Publish & push**. This commits only `content/portfolio.json` and `public/uploads/`, pushes to GitHub, and Vercel redeploys.

The deployed site is fully static. The Studio and its API exist only under `npm run dev`, bound to `localhost`, so nobody can edit the live site.

## Where things live

```
content/portfolio.json         All public content (committed). Validated by src/lib/content/schema.ts
content/portfolio.schema.json  JSON Schema: autocomplete if you edit the file by hand (npm run schema)
content/private.json           PRIVATE vault (git-ignored): Obyektivka, phone number, review queue, notes
content/private.example.json   Template for the vault
private/                       PRIVATE files (git-ignored): the Obyektivka photo
public/uploads/                Images uploaded in the Studio (committed)
```

> **Back up the vault.** `content/private.json` and `private/` exist only on this computer. Use **Vault → Back up** now and then, and store the file somewhere private.

## Privacy model

- **Public:** everything in `portfolio.json`, including hidden entries (hidden only means "not rendered"). Don't put anything sensitive there.
- **Private:** the vault holds the Obyektivka (birth date, relatives, addresses), private contacts such as your phone number, and your notes and review items.
- The vault is never imported by the website code, never committed and never deployed.
- Private contacts print only on résumés exported **from the Studio preview**. The public `/resume` page never shows them.

## Features

**Website.** Editorial design with an optional arcade theme; light and dark mode; three languages with automatic browser-language redirect. It also has:
- a pixel-resolving portrait and generated "space invader" covers for projects without screenshots
- clickable skills that show where each one was used
- an auto-built Journey timeline and case-study pages for projects
- a ⌘K command palette, a save-contact (vCard) button and a Konami-code easter egg
- SEO: an OG share image per language, sitemap, hreflang and schema.org Person data

**Résumé.** One-column and ATS-friendly. Toggles for A4/Letter, photo and QR code, plus a live "fits on one page?" meter with page-break guides. Section order is set in Settings.

**Variants.** Tailored versions of the same content, e.g. `/en/v/game-dev` with the matching `/en/resume/game-dev`. A variant hides irrelevant entries, overrides the headline and moves key skills to the front.

**Studio.** Profile, sections and entries with drag-to-reorder, duplicate, move, and hide-on-website or hide-on-résumé. It also covers:
- theme presets and accent colour
- import and export: JSON Resume, `portfolio.json`, a plain-text résumé, and importing projects from GitHub
- a Publish panel with a changelog and a history you can restore from

**Coach.** Checks content the way a linter checks code: weak verbs, missing numbers, invalid or outdated dates, broken or temporary links, inconsistent skill spellings, skills with no evidence, translation gaps and résumé length. Run it from the terminal with `npm run check`.

**Obyektivka.** The standard Ma’lumotnoma layout in Cyrillic or Latin, with one-click conversion between scripts. Work-history rows can be suggested from your portfolio entries; the relatives table is on its own page.

## Deploying (Vercel)

1. Push this repository to GitHub, then import it at <https://vercel.com/new>. No settings or environment variables are needed.
2. After the first deploy, set **Settings → Site URL** in the Studio to your domain. It's used for QR codes, link previews and the sitemap. Until then the Vercel production URL is used automatically.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run studio` | Website + Studio on localhost |
| `npm run build` | Production build (static pages) |
| `npm run check` | Validate content and print the Coach report (`-- --all` for suggestions) |
| `npm run schema` | Regenerate `content/portfolio.schema.json` after changing the schema |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |

## Code map

```
src/lib/content/    schema, i18n, dates, derived data, coach, diff, transliteration, JSON Resume, SEO
src/lib/studio/     Studio store (undo/redo, autosave, conflicts) and file helpers
src/components/site/     public website components (also rendered in the Studio preview)
src/components/resume/   résumé document and toolbar
src/components/obyektivka/
src/components/studio/   Studio UI: shell, fields, panels
src/app/(site)/[locale]/ public routes      src/app/(studio)/studio/ Studio routes
src/app/api/studio/      local-only API: content, vault, uploads, git, link checks
```

**Adding a new kind of data** rarely needs code. Every entry has free-form `facts` (label/value pairs) and a `custom` section kind. To add a real new section kind, add it to `SECTION_KINDS` in `schema.ts`, give it field labels in `kinds.ts`, and add a renderer in `components/site/Sections.tsx`.
