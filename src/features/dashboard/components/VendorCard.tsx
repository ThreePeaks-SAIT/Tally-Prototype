"use client";
import { Order } from "../data/dataTypes";


export default function VendorCard({ company, title, subtitle, status, statusType}: Order) {
  return (
      
        <article className="min-w-0 bg-surface border border-border rounded-md p-4 flex flex-col justify-center hover:bg-surface-muted hover:cursor-pointer">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-micro font-mono font-medium tracking-widest uppercase text-foreground-muted truncate">
              {company}
            </span>

            {/* Status */}
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

          {/* Title */}
          <h3 className="text-body-sm font-semibold leading-5 tracking-tight text-foreground mb-1">
            {title}
          </h3>

          {/* Subtitle */}
          <p className="text-caption text-foreground-muted leading-4">
            {subtitle}
          </p>
        </article>
  );
}