import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Text } from "@/components/ui";
import type { Author } from "@/types/journal";

type AuthorBoxProps = Readonly<{
  author?: Author;
}>;

export function AuthorBox({ author }: AuthorBoxProps) {
  if (!author) return null;
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 p-6 sm:flex-row">
      {author.headshot ? (
        <div className="h-24 w-24 flex-none">
          <Image
            src={author.headshot.url}
            alt={author.headshot.alt}
            width={96}
            height={96}
            sizes="96px"
            className="rounded-full object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Text size="xs" muted className="font-semibold">
          About the author
        </Text>
        <Heading level={3} size="md" className="text-ink">
          {author.name}
        </Heading>
        {author.bioHtml ? (
          <SafeHtml
            className="prose prose-sm text-ink-muted"
            html={author.bioHtml}
          />
        ) : null}
        {author.links?.length ? (
          <div className="flex flex-wrap gap-2 text-sm">
            {author.links.map((link) => (
              <a key={link.href} href={link.href} className="text-perazzi-red focus-ring">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
