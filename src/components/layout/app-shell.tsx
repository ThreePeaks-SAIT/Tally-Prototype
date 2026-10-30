'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  FileText,
  LayoutDashboard,
  PackageCheck,
  SquareCheckBig,
  Trash2,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

const navigation = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', available: true },
  { href: '/inventory', icon: Boxes, label: 'Inventory', available: true },
  { href: '/count', icon: SquareCheckBig, label: 'Count', available: true },
  { href: '/waste', icon: Trash2, label: 'Waste', available: false },
  { href: '/orders', icon: PackageCheck, label: 'Orders', available: false },
  { href: '/invoices', icon: FileText, label: 'Invoices', available: false },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[216px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-surface md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r">
        <div className="flex h-16 items-center gap-3 border-b border-border-soft px-5">
          <div className="grid h-8 w-8 place-items-center rounded bg-foreground text-title-sm font-bold text-primary-foreground">T</div>
          <span className="text-title-sm font-bold tracking-tight">Tally</span>
        </div>

        <nav aria-label="Primary navigation" className="overflow-x-auto p-3 md:flex-1 md:overflow-visible">
          <ul className="flex min-w-max gap-1 md:min-w-0 md:flex-col">
            {navigation.map(({ available, href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              const className = cn(
                'flex h-11 items-center gap-3 rounded px-3 text-body-sm font-medium transition-colors',
                active && 'bg-primary text-primary-foreground',
                !active && available && 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                !available && 'cursor-not-allowed text-foreground-muted',
              )

              return (
                <li key={href}>
                  {available ? (
                    <Link aria-current={active ? 'page' : undefined} className={className} href={href}>
                      <Icon aria-hidden="true" size={17} />
                      {label}
                    </Link>
                  ) : (
                    <span aria-disabled="true" className={className} title="Planned after the demo">
                      <Icon aria-hidden="true" size={17} />
                      {label}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="hidden border-t border-border-soft p-4 md:block">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-caption font-bold text-primary-foreground">M</div>
            <div>
              <p className="text-body-sm font-semibold">Marcus · 7249</p>
              <p className="text-caption text-foreground-muted">Cook</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  )
}
