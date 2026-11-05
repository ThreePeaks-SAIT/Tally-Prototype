import { getCurrentLocalTime, getTimeGreeting } from "../actions/act"
import VendorCard from "./VendorCard";
import DashboardCard from "./DashboardCard";
import InfoBanner from "./InfoBanner";
import ActivityTable from "./ActivityTable";
import { orders, weekly, testActivities } from "../data/dataTypes";

export function DashboardContent() {
  
  const timeGreeting = getTimeGreeting(); //Changes between "Morning", "Afternoon", "Evening"

  const localTime = getCurrentLocalTime();

  const date = Intl.DateTimeFormat("en-US", { //Gets the current date in format: dayName, monthName, dayNumber
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());


  return (
    <div className="min-h-screen bg-background">

      <header className="border-b border-border px-4 py-3 sm:px-6  bg-primary-soft flex justify-between items-center">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-semibold">Good {timeGreeting}, Marcus</h1> {/* TODO: change name based on user */}
          <p className="text-foreground-muted ">{date} | <strong>{localTime}</strong></p>
        </div>
        <button className="h-9 rounded border border-border bg-foreground px-4 text-body-sm text-surface font-semibold hover:bg-foreground-muted hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Start Today&#39;s Count
        </button>
      </header>
      
      <main className="">
        <InfoBanner />

        <div className=" flex flex-1 flex-row min-w-0 justify-evenly w-full mt-5">
        {orders.map(order => <VendorCard key={order.id} company={order.company} title={order.title} subtitle={order.subtitle} statusType={order.statusType} status={order.status}  />)}
        </div> 
        <div className="flex flex-row justify-evenly items-start gap-5 mt-5">
          <div className="flex-1 min-w-0 ml-1">
        <DashboardCard weeklyOrderCost={weekly.weeklyOrderCost} weeklyWaste={weekly.weeklyWaste} ordersPlaced={weekly.ordersPlaced} orderCostStatus={weekly.orderCostStatus} wasteStatus={weekly.wasteStatus} />
          </div>
          <div className="flex-1 min-w-0 mr-1">
            <ActivityTable activities={testActivities} />
            </div>
        </div>
      </main>


    </div>

  )

}
