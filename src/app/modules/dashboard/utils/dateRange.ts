export type RangeType = "daily" | "weekly" | "monthly";

export function getDateRange(type: RangeType) {
  const end = new Date();
  const start = new Date();

  switch (type) {
    case "daily":
      start.setDate(end.getDate() - 7);
      break;
    case "weekly":
      start.setDate(end.getDate() - 30);
      break;
    case "monthly":
      start.setMonth(end.getMonth() - 6);
      break;
  }

  return { start, end };
}
