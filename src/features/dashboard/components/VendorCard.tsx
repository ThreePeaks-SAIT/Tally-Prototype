
"use client";

import { Order } from "../data/dataTypes";

export default function VendorCard({
  company,
  title,
  subtitle,
  status,
  statusType,
}: Order) {
  return (
    <article className="min-w-0 w-full bg-surface border border-border rounded-md p-3 sm:p-4 flex flex-col justify-center hover:bg-surface-muted transition-colors">

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">

        <span className="min-w-0 flex-1 text-micro font-mono font-medium tracking-widest uppercase text-foreground-muted break-words">
          {company}
        </span>

        <span
          className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-sm text-caption font-medium whitespace-nowrap shrink-0 ${
            statusType === "warning"
              ? "bg-warning-soft text-warning"
              : "bg-primary-soft text-primary"
          }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
          {status}
        </span>
      </div>

      <h3 className="text-body-sm font-semibold leading-5 tracking-tight text-foreground mb-1 break-words">
        {title}
      </h3>

      <p className="text-caption text-foreground-muted leading-4 break-words">
        {subtitle}
      </p>

    </article>
  );
}
