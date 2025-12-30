import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { FullScreenChat } from "@/components/chat/FullScreenChat";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type FullScreenChatPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata: Metadata = {
  title: "Perazzi Concierge – Full Screen",
  description: "A focused, full-screen view of the Perazzi concierge chat experience.",
  manifest: "/fschat/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "pgpt_debug",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [
      {
        url: "/pwa-admin/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/pwa-admin/apple-touch-icon-167.png",
        sizes: "167x167",
        type: "image/png",
      },
      {
        url: "/pwa-admin/apple-touch-icon-152.png",
        sizes: "152x152",
        type: "image/png",
      },
    ],
  },
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
      mainClassName="flex flex-1 py-0"
      contentClassName="flex w-full flex-1 flex-col max-w-none px-0"
    >
      <div className="border-b border-subtle bg-card px-6 py-6 sm:px-8 sm:py-8 lg:px-12">
        <Text size="label-tight" className="text-ink-muted">
          Perazzi Concierge
        </Text>
        <Heading level={1} size="display" className="text-ink">
          Full-screen conversation
        </Heading>
        <Text className="mt-2 max-w-3xl text-ink-muted">
          A focused view of the concierge without the floating drawer. Use it to test the experience or
          share a direct link with a prefilled question.
        </Text>
      </div>
      <div className="flex flex-1 px-0 py-6 sm:px-6 lg:px-12">
        <FullScreenChat initialPrompt={initialPrompt} />
      </div>
    </SiteShell>
  );
}
