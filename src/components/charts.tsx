import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/components/format";

export const CHART_FILLS = [
  "var(--color-teal)",
  "var(--color-blue)",
  "var(--color-mint)",
  "var(--color-coral)",
  "color-mix(in oklab, var(--color-teal) 55%, var(--color-blue))",
  "color-mix(in oklab, var(--color-mint) 70%, var(--color-fg))",
  "color-mix(in oklab, var(--color-blue) 40%, var(--color-coral))",
  "color-mix(in oklab, var(--color-teal) 35%, var(--color-fg))",
  "color-mix(in oklab, var(--color-blue) 30%, var(--color-mint))",
];

export function AllocationChart({ rows }: { rows: { name: string; value: number }[] }) {
  if (rows.length === 0) {
    return <div className="grid h-52 place-items-center text-sm text-muted">No market value yet.</div>;
  }
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={78} paddingAngle={2} stroke="transparent">
            {rows.map((row, index) => (
              <Cell key={row.name} fill={CHART_FILLS[index % CHART_FILLS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => money(Number(value ?? 0))}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "12px",
              color: "var(--color-fg)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
