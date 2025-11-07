import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SectionTheme = "default" | "light" | "dark";
type SectionPadding = "none" | "sm" | "md" | "lg";

type SectionProps = HTMLAttributes<HTMLElement> & {
  theme?: SectionTheme;
  padding?: SectionPadding;
  bordered?: boolean;
};

const paddingClasses: Record<SectionPadding, string> = {
  none: "",
  sm: "px-md py-sm",
  md: "px-lg py-lg",
  lg: "px-xl py-xl",
};

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      theme = "default",
      padding = "lg",
      bordered = true,
      ...props
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        data-theme={theme === "default" ? undefined : theme}
        className={cn(
          "relative rounded-3xl bg-card text-ink shadow-sm transition-colors data-[theme=dark]:bg-perazzi-black data-[theme=dark]:text-perazzi-white data-[theme=light]:bg-perazzi-white data-[theme=light]:text-perazzi-black",
          bordered &&
            "border border-border/70 data-[theme=dark]:border-white/10 data-[theme=light]:border-black/5",
          paddingClasses[padding],
          className,
        )}
        {...props}
      />
    );
  },
);

Section.displayName = "Section";
