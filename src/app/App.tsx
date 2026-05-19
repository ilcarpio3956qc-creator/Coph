import { useState, useEffect } from 'react';
import { InputField } from './components/InputField';
import { ResultCard } from './components/ResultCard';
import { UnitToggle } from './components/UnitToggle';
import { TrajectoryChart } from './components/TrajectoryChart';
import { TrajectoryTable } from './components/TrajectoryTable';
import { FormulaReference } from './components/FormulaReference';
import { BookOpen } from 'lucide-react';

const AIRCRAFT = [
  {
    id: 1,
    name: 'Boeing B-17 Flying Fortress',
    country: 'USA',
    flag: '🇺🇸',
    maxSpeed_ms: 128.61,
    ceiling_m: 10851,
    operationalAltitude_m: 7600,
    cruiseSpeed_ms: 100,
    bombMass: 907,
    dragCoefficient: 0.47,
    airDensity: 1.225,
  },
  {
    id: 2,
    name: 'Junkers Ju 87 Stuka',
    country: 'Germany',
    flag: '🇩🇪',
    maxSpeed_ms: 114.09,
    ceiling_m: 7925,
    operationalAltitude_m: 5500,
    cruiseSpeed_ms: 90,
    bombMass: 500,
    dragCoefficient: 0.52,
    airDensity: 1.225,
  },
  {
    id: 3,
    name: 'Avro Lancaster',
    country: 'UK',
    flag: '🇬🇧',
    maxSpeed_ms: 128.61,
    ceiling_m: 7468,
    operationalAltitude_m: 5200,
    cruiseSpeed_ms: 98,
    bombMass: 6350,
    dragCoefficient: 0.43,
    airDensity: 1.225,
  },
  {
    id: 4,
    name: 'Mitsubishi G4M',
    country: 'Japan',
    flag: '🇯🇵',
    maxSpeed_ms: 118.59,
    ceiling_m: 8992,
    operationalAltitude_m: 6300,
    cruiseSpeed_ms: 95,
    bombMass: 800,
    dragCoefficient: 0.45,
    airDensity: 1.225,
  },
  {
    id: 5,
    name: 'Savoia-Marchetti SM.79',
    country: 'Italy',
    flag: '🇮🇹',
    maxSpeed_ms: 119.48,
    ceiling_m: 7010,
    operationalAltitude_m: 4900,
    cruiseSpeed_ms: 92,
    bombMass: 1250,
    dragCoefficient: 0.44,
    airDensity: 1.225,
  },
];

interface TrajectoryPoint {
  x: number;
  y: number;
}

interface TrajectoryDataPoint {
  time: number;
  x: number;
  y: number;
  speed: number;
  angle: number;
}

interface SimulationResults {
  timeOfImpact: number;
  horizontalRange: number;
  impactSpeed: number;
  impactAngle: number;
  maxHeight: number;
  initialVelocityX: number;
  initialVelocityY: number;
  trajectoryPoints: TrajectoryPoint[];
  trajectoryData: TrajectoryDataPoint[];
  aircraftSpeed?: number;
  deviation?: number;
  isHit?: boolean;
  accuracy?: string;
}

export default function App() {
  const [mode, setMode] = useState<'free' | 'target'>('free');
  const [targetPlacementMode, setTargetPlacementMode] = useState<'random' | 'place'>('random');
  const [targetDistance, setTargetDistance] = useState(850);
  const [targetDistanceInput, setTargetDistanceInput] = useState('850');
  const [altitude, setAltitude] = useState('');
  const [speed, setSpeed] = useState('');
  const [speedUnit, setSpeedUnit] = useState<'m/s' | 'km/h'>('m/s');
  const [direction, setDirection] = useState('');
  const [acceleration, setAcceleration] = useState('');
  const [windSpeed, setWindSpeed] = useState('');
  const [dragCoefficient, setDragCoefficient] = useState('');
  const [airDensity, setAirDensity] = useState('');
  const [bombMass, setBombMass] = useState('');
  const [includeAirResistance, setIncludeAirResistance] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);

  const selectAircraft = (id: number | null) => {
    setSelectedAircraftId(id);
    if (id === null) return;
    const ac = AIRCRAFT.find(a => a.id === id);
    if (!ac) return;
    setAltitude(String(ac.operationalAltitude_m));
    setSpeed(String(ac.cruiseSpeed_ms));
    setSpeedUnit('m/s');
    setAcceleration('0');
    setBombMass(String(ac.bombMass));
    setDragCoefficient(String(ac.dragCoefficient));
    setAirDensity(String(ac.airDensity));
  };

  const [results, setResults] = useState<SimulationResults | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const HIT_TOLERANCE = 15;

  const TARGET_MAX = 2000;

  const randomizeTarget = () => {
    const minDist = 100;
    const maxDist = TARGET_MAX;
    const newDist = Math.round(minDist + Math.random() * (maxDist - minDist));
    setTargetDistance(newDist);
    setTargetDistanceInput(String(newDist));
  };

  const handleTargetDistanceInput = (value: string) => {
    setTargetDistanceInput(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      const clamped = Math.min(num, TARGET_MAX);
      setTargetDistance(clamped);
      if (num > TARGET_MAX) setTargetDistanceInput(String(TARGET_MAX));
    }
  };

  useEffect(() => {
    if (results) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.01;
        if (progress >= 1) {
          progress = 0;
        }
        setAnimationProgress(progress);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [results]);

  const calculateTrajectory = () => {
    const h = parseFloat(altitude);
    let v = parseFloat(speed);
    const angle = parseFloat(direction);
    const ax = parseFloat(acceleration) || 0;

    const wind = mode === 'target' ? 0 : (parseFloat(windSpeed) || 0);
    const cd = mode === 'target' ? 0.47 : (parseFloat(dragCoefficient) || 0.47);
    const rho = mode === 'target' ? 1.225 : (parseFloat(airDensity) || 1.225);
    const mass = mode === 'target' ? 100 : (parseFloat(bombMass) || 100);

    if (isNaN(h) || isNaN(v) || isNaN(angle)) {
      return;
    }

    if (speedUnit === 'km/h') {
      v = v / 3.6;
    }

    const aircraftSpeed = v;

    const g = 9.81;
    const angleRad = (angle * Math.PI) / 180;

    const v0x = v * Math.cos(angleRad) + wind;
    const v0y = v * Math.sin(angleRad);

    const timeOfImpact = (v0y + Math.sqrt(v0y * v0y + 2 * g * h)) / g;

    const points: TrajectoryPoint[] = [];
    const dataPoints: TrajectoryDataPoint[] = [];
    let maxY = h;

    const dt = timeOfImpact / 100;

    for (let i = 0; i <= 100; i++) {
      const t = i * dt;

      let x: number, y: number, vx: number, vy: number;

      if (includeAirResistance) {
        x = 0;
        y = h;
        vx = v0x;
        vy = v0y;

        const steps = Math.floor(t / 0.01);
        const dt_sim = 0.01;

        for (let j = 0; j < steps; j++) {
          const v_total = Math.sqrt(vx * vx + vy * vy);
          const area = 0.1;
          const Fd = 0.5 * rho * v_total * v_total * cd * area;

          const ax_drag = -(Fd / mass) * (vx / v_total);
          const ay_drag = -(Fd / mass) * (vy / v_total);

          vx += (ax + ax_drag) * dt_sim;
          vy += (-g + ay_drag) * dt_sim;

          x += vx * dt_sim;
          y += vy * dt_sim;

          if (y < 0) break;
        }
      } else {
        x = v0x * t + 0.5 * ax * t * t;
        y = h + v0y * t - 0.5 * g * t * t;
        vx = v0x + ax * t;
        vy = v0y - g * t;
      }

      if (y < 0) break;

      points.push({ x, y });

      if (i % 10 === 0) {
        const speed = Math.sqrt(vx * vx + vy * vy);
        const angleVel = (Math.atan2(vy, vx) * 180) / Math.PI;
        dataPoints.push({ time: t, x, y, speed, angle: angleVel });
      }

      if (y > maxY) maxY = y;
    }

    const horizontalRange = includeAirResistance
      ? (points[points.length - 1]?.x || 0)
      : v0x * timeOfImpact + 0.5 * ax * timeOfImpact * timeOfImpact;

    if (points.length > 0) {
      points.push({ x: horizontalRange, y: 0 });
    }

    const vx_impact = v0x + ax * timeOfImpact;
    const vy_impact = includeAirResistance
      ? -(Math.sqrt(v0y * v0y + 2 * g * h))
      : v0y - g * timeOfImpact;

    const impactSpeed = Math.sqrt(vx_impact * vx_impact + vy_impact * vy_impact);
    const impactAngle = Math.abs((Math.atan2(vy_impact, vx_impact) * 180) / Math.PI);

    let deviation = 0;
    let isHit = false;
    let accuracy = '';

    if (mode === 'target') {
      deviation = horizontalRange - targetDistance;
      isHit = Math.abs(deviation) <= HIT_TOLERANCE;

      if (isHit) {
        accuracy = 'DIRECT HIT';
      } else if (Math.abs(deviation) <= 50) {
        accuracy = 'CLOSE';
      } else {
        accuracy = 'OFF TARGET';
      }
    }

    setResults({
      timeOfImpact,
      horizontalRange,
      impactSpeed,
      impactAngle,
      maxHeight: maxY - h,
      initialVelocityX: v0x,
      initialVelocityY: v0y,
      trajectoryPoints: points,
      trajectoryData: dataPoints,
      aircraftSpeed,
      deviation,
      isHit,
      accuracy,
    });
  };

  const chartRange = 2000;
  const chartPoints = (results?.trajectoryPoints || []).map(p => ({ x: p.x, y: p.y }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded flex items-center justify-center">
              <svg
                className="w-6 h-6 text-accent-foreground"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18l5.5 3.44v6.76L12 17.82l-5.5-3.44V7.62L12 4.18z" />
              </svg>
            </div>
            <div>
              <h1 className="tracking-tight">BombSight</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Bomb Kinematics & Physics Simulator
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 space-y-3">

        {/* Disclaimer banner */}
        <div className="flex items-start gap-2 bg-yellow-950/40 border border-yellow-700/50 rounded-lg px-4 py-2 text-yellow-400 text-xs font-mono">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>This simulator is for <strong>educational and historical study purposes only</strong>. It does not represent real-world ballistics or military operations.</span>
        </div>

        {/* Aircraft selector */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2 border-b border-border pb-2">
            <span className="text-xs text-accent uppercase tracking-wide font-mono">✈ Select Aircraft</span>
            {selectedAircraftId !== null && (
              <button
                onClick={() => setSelectedAircraftId(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-wide transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {AIRCRAFT.map(ac => (
              <button
                key={ac.id}
                onClick={() => selectAircraft(selectedAircraftId === ac.id ? null : ac.id)}
                className={`flex flex-col gap-1 p-2 rounded border text-left transition-colors ${
                  selectedAircraftId === ac.id
                    ? 'border-accent bg-accent/10 text-foreground'
                    : 'border-border hover:border-accent/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="text-base leading-none">{ac.flag}</span>
                <span className="text-xs font-mono font-bold leading-tight">{ac.name} <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-normal ml-1">{ac.flag} {ac.country}</span></span>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs font-mono text-accent">{ac.cruiseSpeed_ms} m/s cruise</span>
                  <span className="text-xs font-mono text-muted-foreground">{ac.operationalAltitude_m.toLocaleString()} m alt</span>
                </div>
              </button>
            ))}
          </div>
          {selectedAircraftId !== null && (() => {
            const ac = AIRCRAFT.find(a => a.id === selectedAircraftId)!;
            return (
              <div className="mt-2 pt-2 border-t border-border flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <span className="text-accent">{ac.flag} {ac.name}</span>
                <span>·</span>
                <span>{ac.country}</span>
                <span>·</span>
                <span>Cruise {ac.cruiseSpeed_ms} m/s</span>
                <span>·</span>
                <span>Op. Alt {ac.operationalAltitude_m.toLocaleString()} m</span>
                <span>·</span>
                <span>Ceiling {ac.ceiling_m.toLocaleString()} m</span>
                <span>·</span>
                <span>Mass {ac.bombMass} kg</span>
                <span>·</span>
                <span>Cd {ac.dragCoefficient}</span>
                <span className="ml-auto text-yellow-500/70">Values pre-filled below — you can override any field</span>
              </div>
            );
          })()}
        </div>

        {/* Mode toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setMode('free')}
              className={`px-6 py-2 rounded uppercase tracking-wide text-sm font-mono transition-colors ${
                mode === 'free'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Free Calc
            </button>
            <button
              onClick={() => setMode('target')}
              className={`px-6 py-2 rounded uppercase tracking-wide text-sm font-mono transition-colors ${
                mode === 'target'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Target Mode
            </button>
          </div>

          {mode === 'target' && (
            <>
              <div className="inline-flex bg-card border border-border rounded-lg p-1">
                <button
                  onClick={() => setTargetPlacementMode('random')}
                  className={`px-4 py-1.5 rounded uppercase tracking-wide text-xs font-mono transition-colors ${
                    targetPlacementMode === 'random'
                      ? 'bg-chart-4 text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Random Target
                </button>
                <button
                  onClick={() => setTargetPlacementMode('place')}
                  className={`px-4 py-1.5 rounded uppercase tracking-wide text-xs font-mono transition-colors ${
                    targetPlacementMode === 'place'
                      ? 'bg-chart-4 text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Place Target
                </button>
              </div>

              {targetPlacementMode === 'random' ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    TARGET: {targetDistance} m
                  </span>
                  <button
                    onClick={randomizeTarget}
                    className="bg-chart-4 hover:bg-chart-4/80 text-white px-4 py-1.5 rounded uppercase tracking-wide text-xs font-mono transition-colors"
                  >
                    Randomize
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">TARGET:</span>
                  <input
                    type="text"
                    value={targetDistanceInput}
                    onChange={(e) => handleTargetDistanceInput(e.target.value)}
                    placeholder="850"
                    className="w-24 bg-input-background border border-border rounded px-2 py-1 text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-chart-4 transition-colors"
                  />
                  <span className="text-xs text-muted-foreground font-mono">m</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* TOP — Input Parameters: horizontal bar */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
            <h2 className="uppercase tracking-wide text-sm text-accent">Input Parameters</h2>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Air Resistance</label>
              <button
                onClick={() => setIncludeAirResistance(!includeAirResistance)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  includeAirResistance ? 'bg-accent' : 'bg-secondary'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform ${
                    includeAirResistance ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <InputField label="Altitude" value={altitude} onChange={setAltitude} unit="m" placeholder="1000" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Aircraft Speed</label>
              <InputField label="" value={speed} onChange={setSpeed} unit={speedUnit} placeholder={speedUnit === 'm/s' ? '250' : '900'} />
              <UnitToggle options={['m/s', 'km/h']} value={speedUnit} onChange={(val) => setSpeedUnit(val as 'm/s' | 'km/h')} />
            </div>
            <InputField label="Direction Angle" value={direction} onChange={setDirection} unit="°" placeholder="0" />
            <InputField label="Acceleration" value={acceleration} onChange={setAcceleration} unit="m/s²" placeholder="0" />
          </div>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <InputField label="Wind Speed" value={mode === 'target' ? '0' : windSpeed} onChange={setWindSpeed} unit="m/s" placeholder="0" locked={mode === 'target'} preset={mode === 'target'} />
            <InputField label="Drag Coefficient" value={mode === 'target' ? '0.47' : dragCoefficient} onChange={setDragCoefficient} unit="Cd" placeholder="0.47" locked={mode === 'target'} preset={mode === 'target'} />
            <InputField label="Air Density" value={mode === 'target' ? '1.225' : airDensity} onChange={setAirDensity} unit="kg/m³" placeholder="1.225" locked={mode === 'target'} preset={mode === 'target'} />
            <InputField label="Bomb Mass" value={mode === 'target' ? '100' : bombMass} onChange={setBombMass} unit="kg" placeholder="100" locked={mode === 'target'} preset={mode === 'target'} />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={calculateTrajectory}
              className="bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-2.5 rounded uppercase tracking-wide transition-colors text-sm"
            >
              Calculate
            </button>
            <button
              onClick={() => {
                setAltitude('');
                setSpeed('');
                setDirection('');
                setAcceleration('');
                setWindSpeed('');
                setDragCoefficient('');
                setAirDensity('');
                setBombMass('');
                setIncludeAirResistance(false);
                setResults(null);
              }}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-2.5 rounded uppercase tracking-wide transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFormulas(true)}
              className="ml-auto flex items-center gap-2 bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors px-4 py-2 rounded text-sm uppercase tracking-wide"
            >
              <BookOpen className="w-4 h-4" />
              Formulas
            </button>
          </div>
        </div>

        {/* MIDDLE — Trajectory Visualization: full width */}
        <TrajectoryChart
          trajectoryPoints={chartPoints}
          altitude={parseFloat(altitude) || 500}
          range={chartRange}
          releasePoint={chartPoints[0]}
          impactPoint={chartPoints[chartPoints.length - 1]}
          animationProgress={animationProgress}
          mode={mode}
          targetDistance={targetDistance}
          targetPlacementMode={targetPlacementMode}
          onTargetPlace={(d) => { const c = Math.round(Math.min(d, TARGET_MAX)); setTargetDistance(c); setTargetDistanceInput(String(c)); }}
          isHit={results?.isHit}
          aircraftSpeed={results?.aircraftSpeed}
        />

        {/* BELOW CHART — Hit/Miss banner + Results cards: horizontal row */}
        <div className="space-y-4">
          {mode === 'target' && results && (
            <div
              className={`border-2 rounded-lg p-4 ${
                results.isHit
                  ? 'bg-accent/10 border-accent'
                  : 'bg-destructive/10 border-destructive'
              }`}
            >
              <div className="text-center">
                <div
                  className={`uppercase tracking-widest font-mono text-lg font-bold ${
                    results.isHit ? 'text-accent' : 'text-destructive'
                  }`}
                >
                  {results.isHit ? '✓ DIRECT HIT' : '✗ MISS'}
                </div>
                {!results.isHit && results.deviation !== undefined && (
                  <div className="text-sm text-muted-foreground font-mono mt-1">
                    Δ: {results.deviation > 0 ? '+' : ''}
                    {results.deviation.toFixed(2)} m
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="uppercase tracking-wide text-sm text-accent mb-4 border-b border-border pb-2">
              Results
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
              {mode === 'target' && (
                <>
                  <ResultCard
                    label="Deviation"
                    value={
                      results?.deviation !== undefined
                        ? `${results.deviation > 0 ? '+' : ''}${results.deviation.toFixed(2)}`
                        : '--'
                    }
                    unit="m"
                  />
                  <ResultCard
                    label="Accuracy Rating"
                    value={results?.accuracy || '--'}
                    unit=""
                  />
                </>
              )}
              <ResultCard label="Time of Impact" value={results?.timeOfImpact.toFixed(2) || '--'} unit="s" />
              <ResultCard label="Horizontal Range" value={results?.horizontalRange.toFixed(2) || '--'} unit="m" />
              <ResultCard label="Impact Speed" value={results?.impactSpeed.toFixed(2) || '--'} unit="m/s" />
              <ResultCard label="Impact Angle" value={results?.impactAngle.toFixed(2) || '--'} unit="°" />
              <ResultCard label="Max Height Gain" value={results?.maxHeight.toFixed(2) || '--'} unit="m" />
              <ResultCard label="Initial Vₓ" value={results?.initialVelocityX.toFixed(2) || '--'} unit="m/s" />
              <ResultCard label="Initial Vᵧ" value={results?.initialVelocityY.toFixed(2) || '--'} unit="m/s" />
            </div>
          </div>
        </div>

        {/* BOTTOM — Trajectory Data Table */}
        <div className="mt-0">
          <TrajectoryTable data={results?.trajectoryData || []} />
        </div>
      </main>

      <FormulaReference isOpen={showFormulas} onClose={() => setShowFormulas(false)} />
    </div>
  );
}
