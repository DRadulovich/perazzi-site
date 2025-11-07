type EditorialBlockProps = {
  html: string;
};

export function EditorialBlock({ html }: EditorialBlockProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10">
      <div
        className="prose prose-sm max-w-none text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
