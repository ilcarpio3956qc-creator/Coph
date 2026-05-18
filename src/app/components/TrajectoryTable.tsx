interface TrajectoryDataPoint {
  time: number;
  x: number;
  y: number;
  speed: number;
  angle: number;
}

interface TrajectoryTableProps {
  data: TrajectoryDataPoint[];
}

export function TrajectoryTable({ data }: TrajectoryTableProps) {
  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
          Trajectory Data Table
        </h3>
      </div>
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-secondary sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground font-mono">
                Time (s)
              </th>
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground font-mono">
                X Pos (m)
              </th>
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground font-mono">
                Y Pos (m)
              </th>
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground font-mono">
                Speed (m/s)
              </th>
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground font-mono">
                Angle (°)
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-mono">
                  --
                </td>
              </tr>
            ) : (
              data.map((point, index) => (
                <tr key={index} className="border-t border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-sm">{point.time.toFixed(2)}</td>
                  <td className="px-4 py-2 font-mono text-sm">{point.x.toFixed(2)}</td>
                  <td className="px-4 py-2 font-mono text-sm">{point.y.toFixed(2)}</td>
                  <td className="px-4 py-2 font-mono text-sm">{point.speed.toFixed(2)}</td>
                  <td className="px-4 py-2 font-mono text-sm">{point.angle.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
