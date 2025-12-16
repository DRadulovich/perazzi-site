import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { FullScreenChat } from "@/components/chat/FullScreenChat";

type FullScreenChatPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata: Metadata = {
  title: "Perazzi Concierge – Full Screen",
  description: "A focused, full-screen view of the Perazzi concierge chat experience.",
};

export default async function FullScreenChatPage({ searchParams }: FullScreenChatPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const promptParam =
    (typeof resolvedParams.q === "string" && resolvedParams.q) ||
    (typeof resolvedParams.prompt === "string" && resolvedParams.prompt) ||
    (typeof resolvedParams.question === "string" && resolvedParams.question) ||
    null;

  const initialPrompt = promptParam?.trim() ? { question: promptParam.trim() } : null;

  return (
    <SiteShell
      showChatWidget={false}
      mainClassName="flex-1 px-0 py-0 flex"
      contentClassName="mx-auto flex w-full max-w-7xl flex-1 flex-col"
    >
      <div className="border-b border-subtle bg-card px-6 py-6 sm:px-8 sm:py-8 lg:px-12">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
          Perazzi Concierge
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink">Full-screen conversation</h1>
        <p className="mt-2 max-w-3xl text-sm sm:text-base text-ink-muted">
          A focused view of the concierge without the floating drawer. Use it to test the experience or
          share a direct link with a prefilled question.
        </p>
      </div>
      <div className="flex flex-1 px-0 py-6 sm:px-6 lg:px-12">
        <FullScreenChat initialPrompt={initialPrompt} />
      </div>
    </SiteShell>
  );
}
