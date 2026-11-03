import Link from 'next/link'
import { ArrowRight, Boxes, CheckCircle2, CircleAlert, PackageOpen, Refrigerator, Snowflake } from 'lucide-react'

import type { CountLocationsPageData } from '../types'

function LocationCard({ countedItems, name, slug, totalItems }: CountLocationsPageData['locations'][number]) {
  const isComplete = totalItems > 0 && countedItems === totalItems
  const hasItems = totalItems > 0
  const progress = hasItems ? countedItems / totalItems * 100 : 0
  const LocationIcon = slug === 'freezer' ? Snowflake : slug === 'dry-goods' ? Boxes : Refrigerator

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-primary-soft text-primary">
          <LocationIcon aria-hidden="true" size={20} />
        </div>
        {isComplete && (
          <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-caption font-semibold text-success">
            <CheckCircle2 aria-hidden="true" size={14} />
            Complete
          </span>
        )}
      </div>

      <div className="mt-5">
        <h2 className="text-title font-semibold tracking-tight">{name}</h2>
        <p className="mt-1 text-body-sm text-foreground-muted">
          {hasItems ? `${totalItems} items assigned` : 'No items assigned'}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 font-mono text-caption text-foreground-muted">
          <span>{countedItems} of {totalItems} counted</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full transition-[width] ${isComplete ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className={`mt-6 flex items-center justify-between border-t border-border-soft pt-4 text-body-sm font-semibold ${hasItems ? 'text-primary' : 'text-foreground-subtle'}`}>
        <span>{isComplete ? 'View completion' : countedItems > 0 ? 'Continue count' : 'Start count'}</span>
        {hasItems && <ArrowRight aria-hidden="true" size={16} />}
      </div>
    </>
  )

  if (!hasItems) {
    return <article className="rounded-md border border-border bg-surface p-5 opacity-70">{content}</article>
  }

  return (
    <Link
      className="block rounded-md border border-border bg-surface p-5 transition-colors hover:border-primary/35 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      href={`/count/${slug}`}
    >
      {content}
    </Link>
  )
}

export function CountLocationsPage({ locations, unassignedItemCount }: CountLocationsPageData) {
  const totalItems = locations.reduce((sum, location) => sum + location.totalItems, 0)
  const countedItems = locations.reduce((sum, location) => sum + location.countedItems, 0)

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-micro font-medium uppercase tracking-widest text-primary">Inventory count</p>
            <h1 className="mt-2 text-page-title font-semibold tracking-tight">Choose a storage location</h1>
            <p className="mt-2 max-w-2xl text-body text-foreground-muted">
              Count one area at a time. Your progress is saved as you move through the kitchen.
            </p>
          </div>
          <div className="shrink-0 rounded-md border border-border bg-surface px-4 py-3 text-right">
            <p className="font-mono text-title-sm font-semibold tabular-nums">{countedItems} / {totalItems}</p>
            <p className="text-caption text-foreground-muted">items counted today</p>
          </div>
        </header>

        {locations.length > 0 ? (
          <section aria-label="Storage locations" className="mt-7 grid gap-4 md:grid-cols-3">
            {locations.map((location) => <LocationCard key={location.id} {...location} />)}
          </section>
        ) : (
          <section className="mt-7 rounded-md border border-border bg-surface px-6 py-12 text-center">
            <PackageOpen className="mx-auto text-foreground-muted" size={28} />
            <h2 className="mt-4 text-title-sm font-semibold">No storage locations available</h2>
            <p className="mt-2 text-body-sm text-foreground-muted">Add a storage location before starting a count.</p>
          </section>
        )}

        {unassignedItemCount > 0 && (
          <aside className="mt-6 flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 text-body-sm text-foreground-muted">
            <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-foreground-subtle" size={18} />
            <p>
              <span className="font-semibold text-foreground">{unassignedItemCount} items need a storage location.</span>{' '}
              They are not included in this location count yet.
            </p>
          </aside>
        )}
      </div>
    </main>
  )
}
