import { Button } from "@/components/ui";

type QuickStartButtonProps = Readonly<{
  label: string;
  prompt: string;
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}>;

export function QuickStartButton({ label, prompt, disabled, onSelect }: QuickStartButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="w-full justify-start rounded-2xl px-4 py-3 text-left text-sm sm:text-base normal-case tracking-normal"
      onClick={() => onSelect(prompt)}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
