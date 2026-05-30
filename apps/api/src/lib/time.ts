const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_HOURS = 24;

function roundTo(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function toIsoDate(date: Date): string {
  return date.toISOString();
}

export function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * HOUR_IN_MS);
}

export function diffHours(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / HOUR_IN_MS);
}

export function buildRemainingLabel(hoursLeft: number): string {
  if (hoursLeft >= DAY_IN_HOURS * 2) {
    const daysLeft = Math.ceil(hoursLeft / DAY_IN_HOURS);
    return `${daysLeft} days left`;
  }

  const wholeHours = Math.max(1, Math.ceil(hoursLeft));
  return `${wholeHours}h left`;
}

export function buildRelativeTimeLabel(from: Date, to: Date): string {
  const hours = diffHours(from, to);

  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `${minutes}m ago`;
  }

  if (hours < DAY_IN_HOURS) {
    return `${Math.round(hours)}h ago`;
  }

  const days = Math.round(hours / DAY_IN_HOURS);
  return `${days}d ago`;
}

export function toOneDecimal(value: number): number {
  return roundTo(value, 1);
}
