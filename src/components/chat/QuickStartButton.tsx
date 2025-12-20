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
      className="w-full rounded-2xl border border-subtle/60 bg-card px-4 py-3 text-left text-sm sm:text-base font-medium text-ink transition hover:border-ink focus-ring disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => onSelect(prompt)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
