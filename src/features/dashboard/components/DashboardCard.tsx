import { weeklyData } from "../data/dataTypes";

export default function DashboardCard({
  weeklyOrderCost,
  weeklyWaste,
  ordersPlaced,
  orderCostStatus,
  wasteStatus,
}: weeklyData) {
  return (
    <article className="min-w-0 bg-surface border border-border rounded-md p-4 flex flex-col justify-center mt-10">
      <h3 className="text-title-sm font-semibold text-foreground">This week:</h3>
      <hr className="mt-5 mb-5"/>
      <div className="grid grid-cols-3 gap-1 w-full mb-3">

        <div className="flex flex-col items-center text-center gap-1">
          <p className="text-body-sm text-foreground">
            Order Cost:
          </p>
          <h2 className={`text-title-sm font-semibold ${
            orderCostStatus === "par"
              ? "text-success"
              : "text-warning"
          }`}>
            ${weeklyOrderCost}
          </h2>
          <p className="text-caption text-foreground-muted">par: $1500</p>
          
        </div>

        <div className="flex flex-col items-center text-center gap-1">
          <p className="text-body-sm text-foreground">
            Waste Logged:
          </p>
          <h2 className={`text-title-sm font-semibold ${
            wasteStatus === "par"
              ? "text-success"
              : "text-warning"
          }`}>
            ${weeklyWaste}
          </h2>
          <p className="text-caption text-foreground-muted">par: $25</p>
          
        </div>

        <div className="flex flex-col items-center text-center gap-1">
          <p className="text-body-sm text-foreground">
            Orders Placed:
          </p>
          <h2 className="text-title-sm font-semibold text-foreground">
            {ordersPlaced}
          </h2>
          <p className="text-caption text-foreground-muted">minimum: 2</p>
        </div>
        </div>
    </article>
  );
}