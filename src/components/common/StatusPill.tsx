import type { ReactNode } from "react";
import { statusClass } from "../../lib/format";

export function StatusPill({ value }: { value: ReactNode }) {
  const text = String(value);
  return <span className={`pill ${statusClass(text)}`}>{value}</span>;
}
