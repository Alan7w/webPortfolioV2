import type { SectionKind } from "./schema";

export type EntryField =
  | "title"
  | "subtitle"
  | "url"
  | "location"
  | "dates"
  | "type"
  | "summary"
  | "bullets"
  | "tags"
  | "links"
  | "facts"
  | "image"
  | "body"
  | "featured";

export interface KindConfig {
  label: string;
  description: string;
  /** Does this kind hold entries at all? (`text` and `timeline` don't.) */
  hasItems: boolean;
  /** Fields the Studio shows, in order, with their labels. */
  fields: Partial<Record<EntryField, string>>;
  /** Suggestions for the free-form `type` field. */
  typeOptions?: string[];
  subtitleOptions?: string[];
  newItemTitle: string;
}

export const KINDS: Record<SectionKind, KindConfig> = {
  experience: {
    label: "Experience",
    description: "Jobs, internships, teaching, leadership, volunteering.",
    hasItems: true,
    fields: {
      title: "Role / position",
      subtitle: "Organization",
      url: "Organization website",
      location: "Location",
      dates: "Dates",
      type: "Employment type",
      summary: "Summary (optional)",
      bullets: "Achievements & responsibilities",
      tags: "Skills used",
      links: "Links",
      facts: "Extra details",
    },
    typeOptions: ["Full-time", "Part-time", "Internship", "Contract", "Freelance", "Teaching", "Volunteer", "Leadership", "Seasonal"],
    newItemTitle: "New role",
  },
  education: {
    label: "Education",
    description: "Degrees, schools, programs and bootcamps.",
    hasItems: true,
    fields: {
      title: "Degree / program",
      subtitle: "School",
      url: "School website",
      location: "Location",
      dates: "Dates",
      summary: "Summary (optional)",
      facts: "Details (GPA, minor, coursework…)",
      bullets: "Honors & activities",
      tags: "Skills gained",
      links: "Links",
    },
    newItemTitle: "New degree",
  },
  projects: {
    label: "Projects",
    description: "Apps, games, research, open source — anything you built.",
    hasItems: true,
    fields: {
      title: "Project name",
      subtitle: "Role / context",
      type: "Category",
      dates: "Dates",
      summary: "One-line pitch",
      bullets: "Highlights",
      tags: "Tech stack",
      links: "Links (live demo, code, video…)",
      image: "Cover image",
      facts: "Facts (team size, platform, status…)",
      body: "Case study (Markdown, optional — creates its own page)",
      featured: "Featured",
    },
    typeOptions: ["Web", "Game", "Systems", "Mobile", "Tool", "Research", "Coursework", "Open source"],
    newItemTitle: "New project",
  },
  skills: {
    label: "Skills",
    description: "Grouped skills. Names shared with other entries' tags become clickable evidence.",
    hasItems: true,
    fields: {
      title: "Group name",
      tags: "Skills",
      summary: "Note (optional)",
    },
    newItemTitle: "New skill group",
  },
  awards: {
    label: "Honors & certifications",
    description: "Awards, scholarships, certificates, competitions.",
    hasItems: true,
    fields: {
      title: "Title",
      subtitle: "Issuer",
      type: "Type",
      dates: "Date(s)",
      summary: "Description",
      url: "Credential URL",
      links: "Links",
    },
    typeOptions: ["Award", "Scholarship", "Certification", "Honor", "Competition", "Course"],
    newItemTitle: "New honor",
  },
  languages: {
    label: "Languages",
    description: "Spoken languages and proficiency.",
    hasItems: true,
    fields: {
      title: "Language",
      subtitle: "Proficiency",
      summary: "Notes (e.g. IELTS 7.5)",
    },
    subtitleOptions: ["Native", "Fluent", "Professional working", "Conversational", "Basic", "C2", "C1", "B2", "B1", "A2", "A1"],
    newItemTitle: "New language",
  },
  text: {
    label: "Text",
    description: "A free-form block: About me, What I'm looking for, Now…",
    hasItems: false,
    fields: {},
    newItemTitle: "",
  },
  timeline: {
    label: "Journey (auto timeline)",
    description: "Builds itself from every dated entry — no typing needed.",
    hasItems: false,
    fields: {},
    newItemTitle: "",
  },
  custom: {
    label: "Custom",
    description: "Anything else: publications, talks, volunteering, clubs…",
    hasItems: true,
    fields: {
      title: "Title",
      subtitle: "Subtitle",
      url: "URL",
      location: "Location",
      dates: "Dates",
      type: "Type",
      summary: "Summary",
      bullets: "Bullets",
      tags: "Tags",
      links: "Links",
      facts: "Facts",
      image: "Image",
      body: "Long text (Markdown)",
    },
    newItemTitle: "New item",
  },
};

export interface SectionTemplate {
  key: string;
  kind: SectionKind;
  label: string;
  hint: string;
}

/** Shown in the Studio's "Add section" menu. Several templates can share one kind. */
export const SECTION_TEMPLATES: SectionTemplate[] = [
  { key: "experience", kind: "experience", label: "Experience", hint: "Jobs & internships" },
  { key: "projects", kind: "projects", label: "Projects", hint: "Things you built" },
  { key: "education", kind: "education", label: "Education", hint: "Degrees & schools" },
  { key: "skills", kind: "skills", label: "Skills", hint: "Grouped skills" },
  { key: "awards", kind: "awards", label: "Honors & certifications", hint: "Awards, scholarships, certificates" },
  { key: "languages", kind: "languages", label: "Languages", hint: "Spoken languages" },
  { key: "leadership", kind: "experience", label: "Leadership & community", hint: "Clubs, organizing, events" },
  { key: "volunteering", kind: "experience", label: "Volunteering", hint: "Unpaid & community work" },
  { key: "publications", kind: "custom", label: "Publications", hint: "Papers & articles" },
  { key: "talks", kind: "custom", label: "Talks", hint: "Presentations & workshops" },
  { key: "text", kind: "text", label: "Text block", hint: "About, Now, What I'm looking for" },
  { key: "timeline", kind: "timeline", label: "Journey timeline", hint: "Auto-built from dated entries" },
  { key: "custom", kind: "custom", label: "Custom", hint: "Any other kind of list" },
];
