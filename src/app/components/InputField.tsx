import { Lock } from 'lucide-react';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  placeholder?: string;
  error?: boolean;
  locked?: boolean;
  preset?: boolean;
}

export function InputField({ label, value, onChange, unit, placeholder, error, locked = false, preset = false }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
        {preset && (
          <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            PRESET
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {locked && (
          <div className="w-8 h-10 bg-secondary border border-border rounded flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={locked}
          className={`flex-1 bg-input-background border ${
            error ? 'border-destructive' : 'border-border'
          } rounded px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent transition-colors ${
            locked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {unit && (
          <span className="bg-secondary text-secondary-foreground px-3 py-2 rounded font-mono text-sm min-w-[60px] text-center">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
