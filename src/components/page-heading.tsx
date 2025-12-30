import { Heading, Text } from "@/components/ui";

type PageHeadingProps = {
  title: string;
  description?: string;
  kicker?: string;
};

export function PageHeading({ title, description, kicker }: PageHeadingProps) {
  return (
    <section className="space-y-sm">
      {kicker ? (
        <Text
          size="label-tight"
          muted
        >
          {kicker}
        </Text>
      ) : null}
      <Heading level={1} size="xl">
        {title}
      </Heading>
      {description ? (
        <Text muted className="max-w-3xl" leading="relaxed">
          {description}
        </Text>
      ) : null}
    </section>
  );
}
