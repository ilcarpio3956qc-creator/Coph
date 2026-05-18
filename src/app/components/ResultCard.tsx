interface ResultCardProps {
  label: string;
  value: string | number;
  unit: string;
  loading?: boolean;
}

export function ResultCard({ label, value, unit, loading }: ResultCardProps) {
  return (
    <div className="bg-card border border-border rounded p-4 flex flex-col gap-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div
          className={`font-mono text-2xl text-foreground ${
            loading ? 'animate-pulse' : ''
          }`}
        >
          {value}
        </div>
        <div className="text-sm text-accent font-mono">{unit}</div>
      </div>
    </div>
  );
}
