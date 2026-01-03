import { notFound } from "next/navigation";
import MotionPlayground from "@/motion/expandable/dev/MotionPlayground";

export const dynamic = "force-dynamic";

export default function MotionPlaygroundPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <MotionPlayground />;
}

