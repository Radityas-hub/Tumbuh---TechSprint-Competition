import type { ReactNode } from "react";

import type { RoadmapItemApiModel } from "./types";
import { cx } from "./utils";

export function WorkspaceHeader({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="workspace-header">
      <div>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {action}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="feature-card">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx("panel", className)}>{children}</section>;
}

export function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className={cx("metric-card", tone)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function RoadmapStrip({
  items,
}: {
  items: Array<
    | {
        title: string;
        status: string;
        tone: string;
      }
    | RoadmapItemApiModel
  >;
}) {
  return (
    <div className="roadmap-strip">
      {items.map((item) => (
        <article key={item.title} className={cx("strip-item", item.tone)}>
          <span />
          <strong>{item.title}</strong>
          <small>{"statusLabel" in item ? item.statusLabel : item.status}</small>
        </article>
      ))}
    </div>
  );
}

export function Skeleton({
  className,
  width,
  height,
  radius,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}) {
  const style: Record<string, string | number> = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;
  if (radius !== undefined) style.borderRadius = typeof radius === "number" ? `${radius}px` : radius;
  return <span className={cx("skeleton", className)} style={style} aria-hidden />;
}

export function SkeletonText({
  lines = 3,
  widths,
}: {
  lines?: number;
  widths?: Array<string | number>;
}) {
  return (
    <span className="skeleton-text">
      {Array.from({ length: lines }).map((_, index) => {
        const w = widths?.[index] ?? (index === lines - 1 ? "60%" : "100%");
        return <Skeleton key={index} height={12} radius={6} width={w} />;
      })}
    </span>
  );
}
