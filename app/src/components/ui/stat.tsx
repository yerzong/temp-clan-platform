/** A compact labelled metric readout. Generic — reusable across modules. */
export function Stat({
  label,
  value,
  align = "end",
}: {
  label: string;
  value: string | number;
  align?: "start" | "end";
}) {
  return (
    <div
      className={`flex flex-col ${align === "end" ? "items-end" : "items-start"}`}
    >
      <span className="font-mono text-2xl font-semibold tabular-nums text-tc-fg">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-tc-fg-muted">
        {label}
      </span>
    </div>
  );
}
