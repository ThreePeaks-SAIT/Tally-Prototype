export type Order = {
    id?: number;
  company: string;
  title: string;
  subtitle: string;
  status: string;
  statusType: "warning" | "info";
};

export type weeklyData = {
    weeklyOrderCost: number;
    weeklyWaste: number;
    ordersPlaced: number;
    orderCostStatus: "par" | "above",
    wasteStatus: "par" | "above",
}

export type Activities = {
  id: number;
  desc: string;
  user: string;
  date: string;
}

export const testActivities:Activities[] = [
  {
    id: 1,
    desc: "Sysco Order Received",
    user: "Marcus",
    date: "Wednesday, 11:13am",
  },
  {
    id: 2,
    desc: "Sysco Order #3138 Placed",
    user: "Jacob",
    date: "Tuesday, 3:48pm",
  },
  {
    id: 3,
    desc: "Alforno Order #215 Placed",
    user: "Marcus",
    date: "Tuesday, 8:18am",
  },
];

export const weekly: weeklyData = {
    weeklyOrderCost: 1890.25,
    weeklyWaste: 17.68,
    ordersPlaced: 3,
    orderCostStatus: "above",
    wasteStatus: "par"
  }

 export const orders: Order[] = [
     {
      id: 0,
    company: "SYSCO",
    title: "Order by 5:00 pm",
    subtitle: "Delivery Wed · 18 items",
    status: "Tuesday",
    statusType: "info",
  },
     {
      id: 1,
    company: "ALFORNO",
    title: "Order by 6:00 pm",
    subtitle: "Delivery Thu · 6 items",
    status: "Tuesday",
    statusType: "info",
  },
     {
      id: 2,
    company: "COSTCO",
    title: "Manual pickup",
    subtitle: "List builds through the week",
    status: "Today",
    statusType: "warning",
     },
      {
      id: 3,
    company: "WHOLESALE",
    title: "Manual pickup",
    subtitle: "List builds through the week",
    status: "Wednesday",
    statusType: "info",
  },
];