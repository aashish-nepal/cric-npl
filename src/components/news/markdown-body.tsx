import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter((part) => part.length > 0);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      const safe = href && (href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://"));
      if (safe) {
        return (
          <a key={key} href={href} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} target={href.startsWith("http") ? "_blank" : undefined}>
            {label}
          </a>
        );
      }
      return label;
    }
    return part;
  });
}

/**
 * Small, dependency-free renderer for the editorial subset used by this project.
 * It deliberately does not accept raw HTML, so article bodies cannot inject markup.
 */
export function MarkdownBody({ body, className }: { body: string; className?: string }) {
  const lines = body.replaceAll("\r\n", "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    if (text) blocks.push(<p key={`p-${blocks.length}`}>{inline(text, `p-${blocks.length}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`list-${blocks.length}`}>
        {list.items.map((item, index) => (
          <li key={`item-${index}`}>{inline(item, `item-${blocks.length}-${index}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };
  const flushQuote = () => {
    if (quote.length === 0) return;
    blocks.push(
      <blockquote key={`quote-${blocks.length}`}>
        <p>{inline(quote.join(" "), `quote-${blocks.length}`)}</p>
      </blockquote>,
    );
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") {
      flushAll();
      continue;
    }
    if (line.startsWith("### ")) {
      flushAll();
      blocks.push(<h3 key={`h3-${blocks.length}`}>{inline(line.slice(4), `h3-${blocks.length}`)}</h3>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushAll();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{inline(line.slice(3), `h2-${blocks.length}`)}</h2>);
      continue;
    }
    if (line.startsWith("# ")) {
      flushAll();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{inline(line.slice(2), `h2-${blocks.length}`)}</h2>);
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2));
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.slice(2));
      continue;
    }
    const ordered = /^\d+\.\s+/.exec(line);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.slice(ordered[0].length));
      continue;
    }
    if (line === "---" || line === "***") {
      flushAll();
      blocks.push(<hr key={`hr-${blocks.length}`} />);
      continue;
    }
    if (list) {
      list.items[list.items.length - 1] = `${list.items[list.items.length - 1]} ${line.trim()}`;
      continue;
    }
    if (quote.length > 0 && !line.startsWith(">")) {
      quote.push(line.trim());
      continue;
    }
    paragraph.push(line.trim());
  }
  flushAll();

  return <div className={className ?? "prose-editorial"}>{blocks}</div>;
}
