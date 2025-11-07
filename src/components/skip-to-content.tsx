type SkipToContentProps = {
  targetId?: string;
  label?: string;
};

export function SkipToContent({
  targetId = "site-content",
  label = "Skip to content",
}: SkipToContentProps) {
  return (
    <a className="skip-link focus-ring" href={`#${targetId}`}>
      {label}
    </a>
  );
}
