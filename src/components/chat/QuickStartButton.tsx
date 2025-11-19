interface QuickStartButtonProps {
  label: string;
  prompt: string;
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}

export function QuickStartButton({ label, prompt, disabled, onSelect }: QuickStartButtonProps) {
  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-subtle bg-card px-4 py-3 text-left font-medium text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => onSelect(prompt)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
