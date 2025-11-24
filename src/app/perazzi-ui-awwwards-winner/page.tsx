import type { Metadata } from "next";
import { AwwwardsPageContent } from "@/components/awwwards/AwwwardsPageContent";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Perazzi Glass Atelier",
  description:
    "A glassmorphic, cinematic Perazzi experience—crafted to feel like an Awwwards showcase without altering the core site.",
};

export default function PerazziAwwwardsWinnerPage() {
  return (
    <SiteShell showChatWidget={false}>
      <AwwwardsPageContent />
    </SiteShell>
  );
}
