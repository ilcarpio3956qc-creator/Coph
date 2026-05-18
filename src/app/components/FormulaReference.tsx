import { X } from 'lucide-react';

interface FormulaReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaReference({ isOpen, onClose }: FormulaReferenceProps) {
  if (!isOpen) return null;

  const formulas = [
    {
      title: 'Horizontal Position',
      formula: 'x(t) = x₀ + v₀ₓ·t + ½·aₓ·t²',
      description: 'Position along horizontal axis',
    },
    {
      title: 'Vertical Position',
      formula: 'y(t) = y₀ + v₀ᵧ·t - ½·g·t²',
      description: 'Altitude above ground level',
    },
    {
      title: 'Horizontal Velocity',
      formula: 'vₓ(t) = v₀ₓ + aₓ·t',
      description: 'Velocity component in x-direction',
    },
    {
      title: 'Vertical Velocity',
      formula: 'vᵧ(t) = v₀ᵧ - g·t',
      description: 'Velocity component in y-direction',
    },
    {
      title: 'Drag Force',
      formula: 'Fᴅ = ½·ρ·v²·Cᴅ·A',
      description: 'Air resistance force (ρ: air density, Cᴅ: drag coefficient, A: cross-sectional area)',
    },
    {
      title: 'Time to Impact',
      formula: 't = (v₀ᵧ + √(v₀ᵧ² + 2·g·h)) / g',
      description: 'Time for bomb to reach ground',
    },
    {
      title: 'Horizontal Range',
      formula: 'R = v₀ₓ·t',
      description: 'Total horizontal distance traveled (neglecting air resistance)',
    },
    {
      title: 'Impact Speed',
      formula: 'v = √(vₓ² + vᵧ²)',
      description: 'Magnitude of velocity vector at impact',
    },
    {
      title: 'Impact Angle',
      formula: 'θ = arctan(vᵧ / vₓ)',
      description: 'Angle of impact relative to horizontal',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="uppercase tracking-wide text-accent">
            Physics Formula Reference
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="grid gap-6">
            {formulas.map((item, index) => (
              <div key={index} className="bg-background border border-border rounded p-4">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                  {item.title}
                </h3>
                <div className="bg-secondary/50 border border-secondary rounded px-4 py-3 mb-2">
                  <code className="font-mono text-accent">{item.formula}</code>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
