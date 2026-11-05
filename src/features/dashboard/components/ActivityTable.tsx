
import { Activities } from "../data/dataTypes"

type ActivityTableProps = {
    activities: Activities[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
    return (
        <div className="min-w-0 bg-surface border border-border rounded-md overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
                <h3 className="text-title-sm font-semibold text-foreground">
                    Recent Activity
                </h3>
            </div>

            {/* Desktop / Tablet Table */}
            <div className="hidden sm:block w-full overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border-soft bg-surface-muted">
                            <th className="px-4 py-3 text-micro font-medium uppercase tracking-widest text-foreground-muted">
                                Activity
                            </th>
                            <th className="px-4 py-3 text-micro font-medium uppercase tracking-widest text-foreground-muted">
                                User
                            </th>
                            <th className="px-4 py-3 text-micro font-medium uppercase tracking-widest text-foreground-muted">
                                Date
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {activities.map((activity) => (
                            <tr
                                key={activity.id}
                                className="border-b border-border-soft last:border-0"
                            >
                                <td className="px-4 py-4 text-body-sm font-medium text-foreground">
                                    {activity.desc}
                                </td>

                                <td className="px-4 py-4 text-body-sm text-foreground-muted">
                                    {activity.user}
                                </td>

                                <td className="px-4 py-4 text-caption text-foreground-muted whitespace-nowrap">
                                    {activity.date}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-border-soft">
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="px-4 py-4 space-y-2"
                    >
                        <p className="text-body-sm font-medium text-foreground break-words">
                            {activity.desc}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-caption text-foreground-muted">
                                {activity.user}
                            </span>

                            <span className="text-caption text-foreground-muted whitespace-nowrap">
                                {activity.date}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
