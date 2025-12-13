import Link from "next/link";

import { getOpenQaFlagCount } from "../../lib/pgpt-insights/cached";

export async function QaReviewLink({
  prefix,
  className,
}: {
  prefix: string;
  className: string;
}) {
  const count = await getOpenQaFlagCount();
  const label = count > 0 ? ` (${count})` : "";

  return (
    <Link href="/admin/pgpt-insights/qa" className={className}>
      {prefix}
      {label}
    </Link>
  );
}
