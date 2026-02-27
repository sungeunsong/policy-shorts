import { subHours } from "date-fns";

export function windowStart(now: Date, hours: number): Date {
  return subHours(now, hours);
}
