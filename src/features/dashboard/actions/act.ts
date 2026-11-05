export function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Morning";
  } else if (hour < 16) {
    return "Afternoon";
  } else {
    return "Evening";
  }

  
}

export function getCurrentLocalTime(): string {
  return new Date().toLocaleTimeString("en-CA", {
    timeZone: "America/Edmonton",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

