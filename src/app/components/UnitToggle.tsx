interface UnitToggleProps {
  options: [string, string];
  value: string;
  onChange: (value: string) => void;
}

export function UnitToggle({ options, value, onChange }: UnitToggleProps) {
  return (
    <div className="inline-flex bg-secondary rounded p-1 gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1 rounded font-mono text-sm transition-colors ${
            value === option
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
