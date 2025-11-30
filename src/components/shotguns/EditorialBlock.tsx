type EditorialBlockProps = {
  html: string;
};

export function EditorialBlock({ html }: EditorialBlockProps) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10">
      <div
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
