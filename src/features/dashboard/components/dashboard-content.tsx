
import { getCurrentLocalTime, getTimeGreeting } from "../actions/act";
import VendorCard from "./VendorCard";
import DashboardCard from "./DashboardCard";
import InfoBanner from "./InfoBanner";
import ActivityTable from "./ActivityTable";
import { orders, weekly, testActivities } from "../data/dataTypes";

export function DashboardContent() {

  const timeGreeting = getTimeGreeting();
  const localTime = getCurrentLocalTime();

  const date = Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen w-full min-w-0 bg-background">
      <header className="border-b border-border px-4 py-4 sm:px-6 sm:py-5 bg-primary-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Good {timeGreeting}, Marcus
            </h1>

            <p className="text-sm text-foreground-muted mt-1">
              {date} | <strong>{localTime}</strong>
            </p>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto h-10 shrink-0 rounded border border-border bg-foreground px-4 text-body-sm text-surface font-semibold hover:bg-foreground-muted hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            Start Today&apos;s Count
          </button>
        </div>
      </header>

      <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5 min-w-0">
        <InfoBanner />
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
            {orders.map((order) => (
              <VendorCard
                key={order.id}
                company={order.company}
                title={order.title}
                subtitle={order.subtitle}
                statusType={order.statusType}
                status={order.status}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start min-w-0">
          <div className="min-w-0">
            <DashboardCard
              weeklyOrderCost={weekly.weeklyOrderCost}
              weeklyWaste={weekly.weeklyWaste}
              ordersPlaced={weekly.ordersPlaced}
              orderCostStatus={weekly.orderCostStatus}
              wasteStatus={weekly.wasteStatus}
            />
          </div>
          
          <div className="min-w-0">
            <ActivityTable activities={testActivities} />
          </div>

        </section>

      </main>

    </div>
  );
}
