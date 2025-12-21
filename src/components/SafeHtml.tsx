// nosemgrep
import DOMPurify from "isomorphic-dompurify";
import { memo, useMemo } from "react";

// Centralised wrapper around React's dangerous HTML injection.
// All HTML strings are sanitized once before reaching the DOM.
//
// Usage example:
//   <SafeHtml html={someHtmlString} className="prose" />
//   <SafeHtml as="figcaption" html={captionHtml} />
//
// The optional `as` prop lets you choose the underlying element without
// losing ref-safety. Defaults to a <div>.


type SafeHtmlProps<E extends React.ElementType = "div"> = {
  /** Raw HTML to inject */
  html: string;
  /** Which element to render, default is `div` */
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "dangerouslySetInnerHTML">;

function InternalSafeHtml<E extends React.ElementType = "div">({
  html,
  as,
  ...rest
}: SafeHtmlProps<E>) {
  const Component = (as ?? "div") as React.ElementType;

  const sanitized = useMemo(() => {
    // Using DOMPurify default "html" profile for balanced strictness.
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [html]);

  {/* nosemgrep: SafeHtml centralizes sanitized HTML injection */}
  return <Component {...rest} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

/**
 * Memoised version to avoid re-sanitising unchanged strings.
 */
const SafeHtml = memo(InternalSafeHtml) as typeof InternalSafeHtml;

export default SafeHtml;
