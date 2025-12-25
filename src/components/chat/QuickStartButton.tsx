type QuickStartButtonProps = Readonly<{
  label: string;
  prompt: string;
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}>;

export function QuickStartButton({ label, prompt, disabled, onSelect }: QuickStartButtonProps) {
  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-left text-sm sm:text-base font-medium text-ink shadow-sm transition hover:border-ink/30 hover:bg-card/85 focus-ring disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => onSelect(prompt)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
