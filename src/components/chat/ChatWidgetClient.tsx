"use client";

import dynamic from "next/dynamic";

const LazyChatWidget = dynamic(() => import("./ChatWidget").then((mod) => mod.ChatWidget), {
  ssr: false,
});

export function ChatWidgetClient() {
  return <LazyChatWidget />;
}
