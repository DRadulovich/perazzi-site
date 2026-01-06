import { vercelStegaSplit } from "@vercel/stega";

type CleanTextProps = Readonly<{
  value: string;
}>;

/**
 * Renders a Stega-encoded string in a layout-safe way:
 * - `cleaned` is visible and used for layout/typography
 * - `encoded` is preserved in a hidden span for Visual Editing overlays
 */
export function CleanText({ value }: CleanTextProps) {
  const { cleaned, encoded } = vercelStegaSplit(value);

  if (!encoded) {
    return <>{cleaned}</>;
  }

  return (
    <>
      {cleaned}
      <span className="hidden">{encoded}</span>
    </>
  );
}
