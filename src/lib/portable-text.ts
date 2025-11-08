import type { PortableTextBlock } from "@/sanity/queries/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function portableTextToHtml(blocks?: PortableTextBlock[] | null): string | undefined {
  if (!blocks?.length) return undefined;

  const html = blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const type = (block as { _type?: string })._type;
      if (type !== "block") return "";
      const style = (block as { style?: string }).style ?? "normal";
      const children = Array.isArray((block as { children?: unknown[] }).children)
        ? ((block as { children?: unknown[] }).children as Array<{ text?: string }>)
        : [];
      const text = children
        .map((child) => (typeof child?.text === "string" ? child.text : ""))
        .join("");
      if (!text) return "";
      const safeText = escapeHtml(text);
      switch (style) {
        case "h2":
          return `<h2>${safeText}</h2>`;
        case "h3":
          return `<h3>${safeText}</h3>`;
        default:
          return `<p>${safeText}</p>`;
      }
    })
    .filter(Boolean)
    .join("");

  return html || undefined;
}
