const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric"
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto"
});

function roundDistance(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function formatDistanceKm(value: number) {
  return `${roundDistance(value)} km`;
}

export function formatPercent(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${Math.round(safeValue)}%`;
}

export function formatDateLabel(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
}

export function getDaysLeft(endTime: string) {
  const diffMs = new Date(endTime).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getDurationDays(startTime: string, endTime: string) {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function getInitials(name: string) {
  const segments = name.trim().split(/\s+/).slice(0, 2);
  return segments.map((segment) => segment[0]?.toUpperCase() ?? "").join("");
}
