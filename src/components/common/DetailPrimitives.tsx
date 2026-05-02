import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { StatusPill } from "./StatusPill";

export function DetailPageHeader({
  title,
  headline,
  backTo,
  backLabel,
  status,
}: {
  title: string;
  headline: ReactNode;
  backTo: string;
  backLabel: string;
  status?: string;
}) {
  return (
    <div className="page-head with-action">
      <div>
        <h1>{title}</h1>
        <div className="hero-name">{headline}</div>
      </div>
      <div className="page-head-actions">
        <NavLink className="ghost-button" to={backTo}>
          {backLabel}
        </NavLink>
        {status ? <StatusPill value={status} /> : null}
      </div>
    </div>
  );
}

export function DetailCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`detail-card ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

export function DetailList({ items, compact = false }: { items: Array<{ label: string; value: ReactNode }>; compact?: boolean }) {
  return (
    <dl className={`detail-list${compact ? " compact" : ""}`}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
