import type { ReactNode } from "react";

/**
 * A deliberately tiny Markdown renderer for content fields: paragraphs, ##/### headings,
 * - / 1. lists, **bold**, *italic*, `code` and [links](https://…). It builds React elements
 * (never raw HTML), so content can't inject scripts.
 */

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("`")) {
      out.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      out.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (token.startsWith("*")) {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      if (link && SAFE_HREF.test(link[2])) {
        const external = /^https?:/i.test(link[2]);
        out.push(
          <a key={key} href={link[2]} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
            {renderInline(link[1], key)}
          </a>,
        );
      } else {
        out.push(token);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(text: string, keyPrefix: string): ReactNode[] {
  return text.split("\n").flatMap((line, index) =>
    index === 0 ? renderInline(line, `${keyPrefix}-l${index}`) : [<br key={`${keyPrefix}-br${index}`} />, ...renderInline(line, `${keyPrefix}-l${index}`)],
  );
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) return null;
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  const nodes: ReactNode[] = [];

  blocks.forEach((block, b) => {
    const lines = block.split("\n");
    // A heading line may be followed by content in the same block.
    if (/^#{2,3} /.test(lines[0])) {
      const level = lines[0].startsWith("### ") ? 3 : 2;
      const content = lines[0].replace(/^#{2,3} /, "");
      nodes.push(level === 2 ? <h2 key={`h${b}`}>{renderInline(content, `h${b}`)}</h2> : <h3 key={`h${b}`}>{renderInline(content, `h${b}`)}</h3>);
      lines.shift();
      if (!lines.length) return;
    }
    if (lines.every((line) => /^\s*[-*] /.test(line))) {
      nodes.push(
        <ul key={`ul${b}`}>
          {lines.map((line, i) => (
            <li key={i}>{renderInline(line.replace(/^\s*[-*] /, ""), `ul${b}-${i}`)}</li>
          ))}
        </ul>,
      );
    } else if (lines.every((line) => /^\s*\d+[.)] /.test(line))) {
      nodes.push(
        <ol key={`ol${b}`}>
          {lines.map((line, i) => (
            <li key={i}>{renderInline(line.replace(/^\s*\d+[.)] /, ""), `ol${b}-${i}`)}</li>
          ))}
        </ol>,
      );
    } else {
      nodes.push(<p key={`p${b}`}>{withBreaks(lines.join("\n"), `p${b}`)}</p>);
    }
  });

  return <div className={className ?? "prose-md"}>{nodes}</div>;
}

/** Inline-only variant (for one-line fields such as bullets). */
export function InlineMarkdown({ text }: { text: string }) {
  return <>{renderInline(text, "i")}</>;
}

/** Strip Markdown syntax for plain-text contexts (meta descriptions, JSON Resume export…). */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6} /gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*] /gm, "• ")
    .trim();
}
