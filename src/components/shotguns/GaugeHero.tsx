type GaugeHeroProps = {
  title: string;
  subheading?: string;
};

export function GaugeHero({ title, subheading }: GaugeHeroProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-ink shadow-sm sm:px-10">
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
        {title}
      </h1>
      {subheading ? (
        <p className="mt-3 max-w-3xl text-sm text-ink-muted">{subheading}</p>
      ) : null}
    </section>
  );
}
